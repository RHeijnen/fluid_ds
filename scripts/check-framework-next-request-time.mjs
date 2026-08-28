import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runFrameworkCommand } from "./framework-commands.mjs";
import { terminateOwnedChild, withDeadline } from "./framework-runtime.mjs";
import { runRuntime } from "./check-framework-next-ssr.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const retainedLane = join(root, "scripts/fixtures/framework-pinned/next");
const retainedFixture = join(retainedLane, "fixture");

async function unusedPort() {
  const server = createServer();
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  const port = server.address().port;
  await new Promise((accept, reject) =>
    server.close((error) => (error ? reject(error) : accept()))
  );
  return port;
}

async function startNextServer(directory, logPath) {
  const port = await unusedPort();
  const nextBin = join(directory, "node_modules/next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: directory,
    env: { ...process.env, CI: "true", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const origin = `http://127.0.0.1:${port}`;
  try {
    await withDeadline(
      (async () => {
        while (child.exitCode === null) {
          try {
            const response = await fetch(`${origin}/ssr-contract/`, { redirect: "manual" });
            if (response.status === 200) return;
          } catch {
            // The production server is still starting.
          }
          await new Promise((accept) => setTimeout(accept, 100));
        }
        throw new Error(`Next server exited before readiness (${child.exitCode})`);
      })(),
      30_000,
      "Next request-time server readiness"
    );
  } catch (error) {
    await writeFile(logPath, output);
    await terminateOwnedChild(child).catch(() => undefined);
    throw error;
  }
  return {
    child,
    mode: "packed-production-request-time-SSR-with-server-DSD-and-delayed-client-registration",
    origin,
    async close() {
      if (child.exitCode === null) {
        let onExit;
        const exited = new Promise((accept) => {
          onExit = accept;
          child.once("exit", onExit);
        });
        try {
          child.kill("SIGTERM");
          await withDeadline(exited, 10_000, "Next request-time server shutdown").catch(() =>
            terminateOwnedChild(child)
          );
        } finally {
          child.removeListener("exit", onExit);
        }
      }
      await writeFile(logPath, output);
    }
  };
}

export function requestTimePage(source) {
  assert.match(source, /export const dynamic = "force-static";/);
  assert.match(source, /export default async function SsrContractPage\(\) \{/);
  assert.match(source, /<section aria-label="Packed SSR contract">/);
  assert.match(source, /<fluid-card id="contract-card">/);
  return source
    .replace('export const dynamic = "force-static";', 'export const dynamic = "force-dynamic";')
    .replace(
      "export default async function SsrContractPage() {",
      `export default async function SsrContractPage() {\n  const { headers } = await import("next/headers");\n  const requestId = (await headers()).get("x-fluid-request-id") ?? "unidentified";`
    )
    .replace(
      '<section aria-label="Packed SSR contract">',
      '<section aria-label="Packed SSR contract" data-request-id={requestId}>'
    )
    .replace(
      '<fluid-card id="contract-card">',
      '<span id="fluid-request-marker">${requestId}</span><fluid-card id="contract-card">'
    );
}

export function requestTimeConfig(source) {
  assert.match(source, /\s*output: "export",/);
  return source.replace(/\s*output: "export",/, "");
}

export function assertRequestCachePolicy(cacheControl) {
  assert.match(cacheControl, /(?:^|,)\s*(?:private|no-store)(?:,|$)/);
  assert.doesNotMatch(cacheControl, /(?:^|,)\s*(?:public|s-maxage=)/);
}

async function assertDistinctResponses(origin, evidenceDirectory) {
  const request = async (id) => {
    const response = await fetch(`${origin}/ssr-contract/`, {
      headers: { "x-fluid-request-id": id, cookie: `fluid-request=${id}` }
    });
    assert.equal(response.status, 200);
    const cacheControl = response.headers.get("cache-control") ?? "";
    assertRequestCachePolicy(cacheControl);
    const markup = await response.text();
    assert.equal((markup.match(/shadowrootmode="open"/g) ?? []).length, 4);
    assert.match(markup, new RegExp(`data-request-id="${id}"`));
    const marker = markup.match(/<span id="fluid-request-marker">([\s\S]*?)<\/span>/);
    assert.ok(marker, "Request marker is missing from the server response");
    assert.equal(
      marker[1].replaceAll(/<!--[\s\S]*?-->/g, "").trim(),
      id,
      "Request marker must contain only the active request identifier"
    );
    return markup;
  };
  const [first, second] = await Promise.all([request("request-alpha"), request("request-beta")]);
  assert.notEqual(first, second, "Independent request contexts returned identical HTML");
  assert.doesNotMatch(first, /request-beta/);
  assert.doesNotMatch(second, /request-alpha/);
  await writeFile(join(evidenceDirectory, "request-alpha.html"), first);
  await writeFile(join(evidenceDirectory, "request-beta.html"), second);
}

async function main() {
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const evidenceDirectory = join(root, "quality/evidence/framework-next-request-time", timestamp);
  const temporary = await mkdtemp(join(tmpdir(), "fluid-next-request-time-"));
  const consumer = join(temporary, "fixture");
  const commandOutcomes = [];
  let server;
  let runtime = { status: "not-run" };
  let status = "failed";
  await mkdir(evidenceDirectory, { recursive: true });
  try {
    await cp(retainedFixture, consumer, { recursive: true });
    await cp(join(retainedLane, "packs"), join(temporary, "packs"), { recursive: true });
    await writeFile(
      join(consumer, "next.config.mjs"),
      requestTimeConfig(await readFile(join(consumer, "next.config.mjs"), "utf8"))
    );
    const pagePath = join(consumer, "app/ssr-contract/page.tsx");
    await writeFile(pagePath, requestTimePage(await readFile(pagePath, "utf8")));
    const run = (args, stage) =>
      runFrameworkCommand(args, {
        cwd: consumer,
        stage,
        outcomes: commandOutcomes,
        logPath: join(evidenceDirectory, `${stage}.log`)
      });
    await run(["install", "--frozen-lockfile", "--offline", "--ignore-scripts"], "install");
    await run(["run", "typecheck"], "typecheck");
    await run(["run", "build"], "build");
    server = await startNextServer(consumer, join(evidenceDirectory, "server.log"));
    await assertDistinctResponses(server.origin, evidenceDirectory);
    runtime = await runRuntime(consumer, join(evidenceDirectory, "runtime"), server);
    assert.equal(runtime.status, "passed");
    status = "passed";
  } finally {
    if (server) await server.close();
    await writeFile(
      join(evidenceDirectory, "result.json"),
      `${JSON.stringify(
        {
          status,
          framework: "Next.js",
          mode: "retained-packed-production-request-time-SSR",
          requestIsolation: status === "passed" ? "passed" : "not-proven",
          runtimeStatus: runtime.status,
          commandOutcomes,
          limitations: [
            "The production server runs locally; deployed ingress, CDN and hosting behavior remain external validation boundaries.",
            "Four representative Fluid elements do not certify every element in a framework consumer. Catalog-wide rendering remains covered by the separate Node and browser SSR gates."
          ]
        },
        null,
        2
      )}\n`
    );
    if (temporary.startsWith(`${tmpdir()}${sep}fluid-next-request-time-`))
      await rm(temporary, { recursive: true, force: true });
  }
  console.log(`${status}: packed Next request-time SSR contract (${evidenceDirectory})`);
  if (status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
