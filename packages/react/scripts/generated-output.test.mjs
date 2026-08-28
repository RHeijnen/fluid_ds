import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { processGeneratedOutput } from "./generated-output.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "fluid-react-generated-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const outputs = new Map([
    [join(root, "src/index.ts"), 'export { FluidInput } from "./generated/input.js";\n'],
    [join(root, "src/generated/input.ts"), "export const FluidInput = {};\n"],
    [join(root, "src/jsx/components.ts"), "export {};\n"]
  ]);
  await processGeneratedOutput(root, outputs);
  return { root, outputs };
}

test("exact generation passes read-only verification", async (t) => {
  const { root, outputs } = await fixture(t);
  await processGeneratedOutput(root, outputs, { check: true });
  for (const [path, text] of outputs) assert.equal(await readFile(path, "utf8"), text);
});

test("unchanged export count cannot hide altered wrappers or declarations", async (t) => {
  const { root, outputs } = await fixture(t);
  const wrapper = join(root, "src/generated/input.ts");
  const jsx = join(root, "src/jsx/components.ts");
  await writeFile(wrapper, "export const FluidInput = { wrongEvent: true };\n");
  await writeFile(jsx, "export type Incorrect = unknown;\n");
  await assert.rejects(processGeneratedOutput(root, outputs, { check: true }), (error) => {
    assert.match(error.message, /Stale: src[/\\]generated[/\\]input.ts/);
    assert.match(error.message, /Stale: src[/\\]jsx[/\\]components.ts/);
    return true;
  });
  assert.match(await readFile(wrapper, "utf8"), /wrongEvent/);
});

test("missing and unexpected generated files fail without silent deletion", async (t) => {
  const { root, outputs } = await fixture(t);
  const missing = join(root, "src/generated/input.ts");
  const stale = join(root, "src/generated/removed.ts");
  await rm(missing);
  await writeFile(stale, "export const Removed = {};\n");
  await assert.rejects(processGeneratedOutput(root, outputs, { check: true }), (error) => {
    assert.match(error.message, /Missing:/);
    assert.match(error.message, /Unexpected generated file:/);
    return true;
  });
  assert.equal(await readFile(stale, "utf8"), "export const Removed = {};\n");
});
