import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { resolveTestBrowsers } from "./resolve-test-browsers.mjs";

test("defaults are explicit and all selects exactly three engines", () => {
  assert.deepEqual(resolveTestBrowsers(""), ["chromium"]);
  assert.deepEqual(resolveTestBrowsers(" ALL "), ["chromium", "firefox", "webkit"]);
  assert.deepEqual(resolveTestBrowsers("Firefox, WEBKIT,firefox"), ["firefox", "webkit"]);
});

test("unknown, partly invalid and empty matrix entries fail closed", () => {
  for (const value of ["safari", "chromium,firefoxx", "webkit,", ",firefox", "all,chromium"])
    assert.throws(() => resolveTestBrowsers(value), /Invalid FLUID_BROWSERS/);
});

test("callers cannot mutate the shared all-engine selection", () => {
  resolveTestBrowsers("all").pop();
  assert.equal(resolveTestBrowsers("all").length, 3);
});

test("every component unit runner uses the fail-closed selector", async () => {
  let checked = 0;
  const packages = new URL("../packages/", import.meta.url);
  for (const directory of await readdir(packages, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    const config = new URL(`${directory.name}/web-test-runner.config.js`, packages);
    let source;
    try {
      source = await readFile(config, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    assert.match(
      source,
      /import \{ resolveTestBrowsers \} from "\.\.\/\.\.\/scripts\/resolve-test-browsers\.mjs"/
    );
    assert.match(source, /browsers: resolveTestBrowsers\(\)\.map/);
    assert.doesNotMatch(source, /function resolveBrowsers/);
    checked++;
  }
  assert.equal(checked, 14);
});
