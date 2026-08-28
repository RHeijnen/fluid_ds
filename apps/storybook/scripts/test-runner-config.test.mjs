import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getJestConfig } = require("@storybook/test-runner");
const config = require("../.storybook/test-runner-jest.config.cjs");

test("retained evidence is excluded without narrowing story discovery or browser checks", () => {
  const original = getJestConfig();
  assert.deepEqual(config, {
    ...original,
    modulePathIgnorePatterns: [
      ...(original.modulePathIgnorePatterns ?? []),
      "<rootDir>/quality/evidence/"
    ]
  });
  const excluded = config.modulePathIgnorePatterns.map(
    (pattern) =>
      new RegExp(pattern.replace("<rootDir>", resolve(config.rootDir).replaceAll("\\", "/")))
  );
  const isExcluded = (path) =>
    excluded.some((pattern) => pattern.test(resolve(config.rootDir, path).replaceAll("\\", "/")));
  assert.equal(isExcluded("quality/evidence/framework-fixtures/run/fixture/package.json"), true);
  assert.equal(isExcluded("apps/storybook/stories/InteractionContracts.stories.ts"), false);
  assert.equal(
    isExcluded("packages/components/src/components/button/fluid-button.stories.ts"),
    false
  );
  assert.equal(isExcluded("quality/interaction-contracts.json"), false);
});
