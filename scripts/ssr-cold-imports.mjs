import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Each entry gets a new Node process, without another entry priming globals. */
export async function coldImport(url, { timeout = 30_000 } = {}) {
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120_000)
    throw new Error("Cold import timeout must be an integer from 1 to 120000 milliseconds");
  const marker = `fluid-cold-import:${randomUUID()}`;
  const source = `
    for (const name of ["window", "document", "customElements", "HTMLElement"]) {
      if (name in globalThis) throw new Error("Unexpected preloaded browser global: " + name);
    }
    await import(process.argv[1]);
    console.log(process.argv[2]);
  `;
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    ["--input-type=module", "--eval", source, String(url), marker],
    {
      timeout,
      // SIGTERM can be intercepted by a stuck imported module on POSIX.
      // This bounds the owned Node child, not arbitrary descendants it spawns.
      killSignal: "SIGKILL",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
      // A consumer's preload must not make this cold-import check accidentally green.
      env: { ...process.env, NODE_OPTIONS: "" }
    }
  );
  if (!stdout.split(/\r?\n/).includes(marker))
    throw new Error(`Import exited without reaching completion: ${url}`);
  return { stdout: stdout.replace(marker, "").trim(), stderr: stderr.trim() };
}

export async function coldImportAll(urls, concurrency = 4) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16)
    throw new Error("Cold import concurrency must be an integer from 1 to 16");
  const pending = [...new Set(urls.map(String))];
  if (!pending.length) throw new Error("Cold import gate must include at least one entry");
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      while (next < pending.length) {
        const url = pending[next++];
        try {
          results.push({ url, status: "passed", ...(await coldImport(url)) });
        } catch (error) {
          results.push({ url, status: "failed", error: error.message });
        }
      }
    })
  );
  return results.sort((a, b) => a.url.localeCompare(b.url));
}
