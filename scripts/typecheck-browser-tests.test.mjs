import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createBrowserTestProgram } from "./typecheck-browser-tests.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function fixture(t, source) {
  const directory = await mkdtemp(join(tmpdir(), "fluid-test-types-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "src"));
  await writeFile(
    join(directory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        noUncheckedIndexedAccess: true,
        skipLibCheck: true,
        typeRoots: [join(root, "node_modules/@types")]
      },
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"]
    })
  );
  if (source) await writeFile(join(directory, "src/contract.test.ts"), source);
  return directory;
}

test("checks browser tests despite the build config excluding them, without emitting", async (t) => {
  const directory = await fixture(
    t,
    'describe("contract", () => { it("runs", async () => {}); });'
  );
  const result = createBrowserTestProgram(directory);
  assert.equal(result.tests.length, 1);
  assert.deepEqual(result.diagnostics, []);
  await assert.rejects(access(join(directory, "src/contract.test.js")));
});

test("rejects an incorrect argument in a test's imported typed contract", async (t) => {
  const directory = await fixture(
    t,
    'import { acceptsString } from "./subject.js"; it("contract", () => acceptsString(123));'
  );
  await writeFile(
    join(directory, "src/subject.ts"),
    "export function acceptsString(value: string) { return value; }"
  );
  const result = createBrowserTestProgram(directory);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === 2345));
});

test("rejects empty test selection and invalid configuration", async (t) => {
  const directory = await fixture(t);
  assert.throws(() => createBrowserTestProgram(directory), /No browser test files/);
  await writeFile(join(directory, "tsconfig.json"), "{");
  assert.throws(() => createBrowserTestProgram(directory));
});
