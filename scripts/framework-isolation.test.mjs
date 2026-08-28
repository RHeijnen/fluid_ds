import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";
import ts from "typescript";
import { checkFixtureIsolation, validateConfigIsolation } from "./framework-isolation.mjs";

const root = resolve("fixture");
const file = resolve(root, "tsconfig.json");
test("rejects the reproduced missing workspace-root base config", () => {
  assert.throws(
    () => validateConfigIsolation({ extends: "../../tsconfig.base.json" }, file, root),
    /extends escapes/
  );
});
test("rejects workspace package aliases and references", () => {
  assert.throws(
    () =>
      validateConfigIsolation(
        {
          compilerOptions: {
            paths: { "@fluid-ds/components": ["../../packages/components/dist/index.js"] }
          }
        },
        file,
        root
      ),
    /paths.*escapes/
  );
  assert.throws(
    () => validateConfigIsolation({ references: [{ path: "../library" }] }, file, root),
    /references escapes/
  );
});
test("rejects absolute paths and baseUrl-assisted escape", () => {
  assert.throws(
    () => validateConfigIsolation({ extends: "C:\\workspace\\tsconfig.json" }, file, root),
    /escapes/
  );
  assert.throws(
    () =>
      validateConfigIsolation(
        { compilerOptions: { baseUrl: "src", paths: { lib: ["../../outside"] } } },
        file,
        root
      ),
    /escapes/
  );
});
test("allows installed package configs, generated configs and in-fixture aliases", () => {
  validateConfigIsolation(
    {
      extends: ["astro/tsconfigs/strict", "./.svelte-kit/tsconfig.json"],
      compilerOptions: {
        paths: {
          "@/*": ["./src/*"],
          "@fluid-ds/components": ["./node_modules/@fluid-ds/components/dist/index.js"]
        }
      }
    },
    file,
    root
  );
});
test("all six framework consumers have self-contained compiler configuration", async () => {
  for (const name of [
    "admin-react",
    "admin-next",
    "admin-angular",
    "framework-vue",
    "framework-astro",
    "framework-sveltekit"
  ]) {
    assert.ok(
      await checkFixtureIsolation(resolve("apps", name)),
      `${name} must have a checked configuration`
    );
  }
});

async function angularRegistryResolution(removeMapping = false) {
  const directory = resolve("apps/admin-angular");
  const filename = resolve(directory, "tsconfig.json");
  const parsed = ts.parseConfigFileTextToJson(filename, await readFile(filename, "utf8"));
  assert.equal(parsed.error, undefined);
  if (removeMapping) delete parsed.config.compilerOptions.paths["@fluid-ds/icons/registry"];
  const converted = ts.parseJsonConfigFileContent(parsed.config, ts.sys, directory, {}, filename);
  assert.deepEqual(converted.errors, []);
  const resolved = ts.resolveModuleName(
    "@fluid-ds/icons/registry",
    resolve(directory, "src/main.ts"),
    converted.options,
    ts.sys
  ).resolvedModule;
  assert.ok(resolved, "The actual Angular icon-registry import must resolve");
  return resolved.resolvedFileName.replaceAll("\\", "/");
}

test("Angular resolves the icon registry through built JavaScript, not workspace TypeScript", async () => {
  assert.match(await angularRegistryResolution(), /\/icons\/dist\/registry\.js$/);
});

test("removing the Angular registry mapping reproduces the unsupported workspace-source resolution", async () => {
  assert.match(await angularRegistryResolution(true), /\/icons\/src\/registry\.ts$/);
});
