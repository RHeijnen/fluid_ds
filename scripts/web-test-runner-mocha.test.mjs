import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import ts from "typescript";
import * as lifecycle from "./web-test-runner-lifecycle.mjs";

const lifecycleKey = Symbol.for("fluid.wtr.lifecycle");

test("serialized errors cannot become successful skips or hide in nested suites", () => {
  const session = {
    testFile: "fixture.test.js",
    testResults: {
      name: "root",
      tests: [
        { name: "normal", passed: true, skipped: false },
        { name: "allowed pending", passed: false, skipped: true }
      ],
      suites: [{ name: "nested", suites: [], tests: [] }]
    }
  };
  assert.deepEqual(lifecycle.serializedTestFailures([session]), []);
  for (const [passed, skipped] of [
    [false, false],
    [false, true],
    [true, false],
    [true, true]
  ]) {
    const failed = structuredClone(session);
    failed.testResults.suites[0].tests.push({
      name: "rejected",
      passed,
      skipped,
      error: { message: "Pending test forbidden" }
    });
    assert.deepEqual(lifecycle.serializedTestFailures([failed]), [
      "fixture.test.js: root > nested > rejected: Pending test forbidden"
    ]);
  }
});

function withMode(mode, check) {
  const originalCi = process.env.CI;
  const originalLifecycle = globalThis[lifecycleKey];
  delete process.env.CI;
  delete globalThis[lifecycleKey];
  try {
    if (mode === "ci") process.env.CI = "true";
    if (mode === "supervised") {
      lifecycle.createLifecycle({ record() {}, complete() {} });
    }
    check();
  } finally {
    if (originalCi === undefined) delete process.env.CI;
    else process.env.CI = originalCi;
    if (originalLifecycle === undefined) delete globalThis[lifecycleKey];
    else globalThis[lifecycleKey] = originalLifecycle;
  }
}

for (const mode of ["ci", "supervised", "interactive"]) {
  test(`shared Mocha policy: ${mode}`, () => {
    withMode(mode, () => {
      assert.equal(typeof lifecycle.fluidMochaFramework, "function");
      assert.deepEqual(lifecycle.fluidMochaFramework(), {
        config: {
          ui: "bdd",
          timeout: "5000",
          forbidOnly: mode !== "interactive",
          forbidPending: mode !== "interactive"
        }
      });
      assert.equal(lifecycle.fluidMochaFramework("10000").config.timeout, "10000");
    });
  });
}

test("every browser unit package uses the shared policy without a local override", async () => {
  const packages = new URL("../packages/", import.meta.url);
  const checked = [];
  for (const entry of await readdir(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let source;
    try {
      source = await readFile(new URL(`${entry.name}/web-test-runner.config.js`, packages), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const file = ts.createSourceFile("config.js", source, ts.ScriptTarget.Latest, true);
    const exported = file.statements.find(ts.isExportAssignment)?.expression;
    assert.ok(exported && ts.isObjectLiteralExpression(exported), `${entry.name}: expected config`);
    const properties = exported.properties.filter(
      (property) =>
        ts.isPropertyAssignment(property) && property.name.getText(file) === "testFramework"
    );
    assert.equal(properties.length, 1, `${entry.name}: one test framework policy`);
    const factory = properties[0].initializer;
    assert.ok(ts.isCallExpression(factory), `${entry.name}: framework must use the factory`);
    assert.equal(factory.expression.getText(file), "fluidMochaFramework", entry.name);
    assert.equal(factory.arguments.length, entry.name === "media" ? 1 : 0, entry.name);
    if (entry.name === "media") assert.equal(factory.arguments[0].text, "10000");
    const imported = file.statements.find(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier.text === "../../scripts/web-test-runner-lifecycle.mjs"
    );
    assert.ok(
      imported?.importClause?.namedBindings?.elements.some(
        (binding) => binding.name.text === "fluidMochaFramework"
      ),
      `${entry.name}: import the actual shared factory`
    );
    checked.push(entry.name);
  }
  assert.equal(checked.length, 14, "All fourteen configured browser unit packages must be checked");
});
