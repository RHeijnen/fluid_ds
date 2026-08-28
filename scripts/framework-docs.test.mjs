import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(new URL("../apps/framework-sveltekit/package.json", import.meta.url));
const { compile } = require("svelte/compiler");

async function documentedSvelte() {
  const guide = await readFile(
    new URL("../apps/docs/src/content/docs/guides/frameworks.mdx", import.meta.url),
    "utf8"
  );
  const section = guide.replaceAll("\r\n", "\n").split("## Svelte\n")[1]?.split("\n## SolidJS")[0];
  assert.ok(section, "Svelte documentation section is missing");
  const examples = [...section.matchAll(/```svelte\r?\n([\s\S]*?)\r?\n```/g)];
  assert.equal(examples.length, 1, "Expected exactly one documented Svelte integration example");
  return examples[0][1];
}

test("the exact documented Svelte custom-element value example compiles for client and server", async () => {
  const source = await documentedSvelte();
  assert.ok(source.includes("value={value}"));
  assert.ok(source.includes("on:fluid-change="));
  for (const generate of ["client", "server"]) {
    const result = compile(source, { generate, filename: "DocumentedFluidInput.svelte" });
    assert.ok(result.js.code.length > 0);
  }
});

test("the previously documented bind:value on a custom element fails compilation", async () => {
  const source = (await documentedSvelte()).replace("value={value}", "bind:value");
  assert.throws(
    () => compile(source, { generate: "client" }),
    (error) => error.code === "bind_invalid_target"
  );
});
