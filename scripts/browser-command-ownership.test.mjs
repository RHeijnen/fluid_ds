import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import {
  asyncBrowserCommands,
  checkBrowserCommandOwnership,
  inspectBrowserCommandOwnership
} from "./browser-command-ownership.mjs";

const imports = 'import { sendKeys, sendMouse, resetMouse } from "@web/test-runner-commands";';
const inspect = (source) => inspectBrowserCommandOwnership(`${imports}\n${source}`);
const pass = (source, count = 1) => {
  const result = inspect(source);
  assert.deepEqual(result.problems, [], source);
  assert.equal(result.calls, count, source);
};
const fail = (source) => assert.ok(inspect(source).problems.length > 0, source);

test("every installed asynchronous browser command participates in ownership checking", async () => {
  const declarations = await readFile(
    new URL(
      "../packages/components/node_modules/@web/test-runner-commands/browser/commands.d.ts",
      import.meta.url
    ),
    "utf8"
  );
  const source = ts.createSourceFile("commands.d.ts", declarations, ts.ScriptTarget.Latest, true);
  assert.equal(source.parseDiagnostics.length, 0);
  const installed = source.statements
    .filter(
      (node) =>
        ts.isFunctionDeclaration(node) &&
        node.type &&
        ts.isTypeReferenceNode(node.type) &&
        node.type.typeName.getText(source) === "Promise"
    )
    .map((node) => node.name.text);
  assert.deepEqual([...asyncBrowserCommands].sort(), installed.sort());
  for (const name of installed) {
    const header = `import { ${name} } from "@web/test-runner-commands";`;
    const owned = inspectBrowserCommandOwnership(
      `${header} it("owned", async () => { await ${name}(); });`
    );
    assert.equal(owned.calls, 1, name);
    assert.deepEqual(owned.problems, [], name);
    const detached = inspectBrowserCommandOwnership(
      `${header} it("detached", () => { ${name}(); });`
    );
    assert.equal(detached.problems.length, 1, name);
  }
  assert.equal(
    inspectBrowserCommandOwnership(
      'import { findAccessibilityNode } from "@web/test-runner-commands"; it("sync", () => { findAccessibilityNode(); });'
    ).calls,
    0
  );
});

test("direct await, returned test promises and owned Promise.all preserve command completion", () => {
  pass('it("keys", async () => { await sendKeys({press:"Enter"}); });');
  pass('it("keys", () => sendKeys({press:"Enter"}));');
  pass('it("keys", () => { return sendKeys({press:"Enter"}); });');
  pass(
    'it("keys", async () => { const [event] = await Promise.all([oneEvent(el,"change"), sendKeys({press:"Enter"})]); expect(event).to.exist; });'
  );
  pass('it("keys", () => Promise.all([sendKeys({press:"Enter"})]));');
  pass('it("keys", async () => { await (sendKeys)({press:"Enter"}); });');
});

test("every local helper call must have an owned promise chain including cleanup", () => {
  pass(
    'async function draw() { try { await sendMouse({type:"down"}); } finally { await resetMouse(); } } it("draw", async () => { await draw(); });',
    2
  );
  pass('const keys = () => sendKeys({press:"Enter"}); it("keys", () => { return keys(); });');
  pass(
    'async function inner() { await sendKeys({press:"Enter"}); } async function outer() { await inner(); } beforeEach(async () => { await outer(); });'
  );
  fail(
    'async function keys() { await sendKeys({press:"Enter"}); } it("keys", async () => { keys(); });'
  );
  fail(
    'async function keys() { await sendKeys({press:"Enter"}); } it("owned", async () => { await keys(); }); it("detached", () => { keys(); });'
  );
  fail(
    'async function keys() { await sendKeys({press:"Enter"}); } it("keys", async () => { setTimeout(keys); });'
  );
});

test("imports, namespace members and immutable command aliases are identified by symbols", () => {
  const source = `import { sendKeys as keys } from "@web/test-runner-commands";
    import * as browser from "@web/test-runner-commands";
    const mouse = browser.sendMouse;
    it("keys", async () => { await keys({press:"Enter"}); await mouse({type:"up"}); await browser["resetMouse"](); });`;
  const result = inspectBrowserCommandOwnership(source);
  assert.deepEqual(result.problems, []);
  assert.equal(result.calls, 3);
  fail('const keys = sendKeys; it("keys", () => { keys({press:"Enter"}); });');
  assert.equal(
    inspectBrowserCommandOwnership('function sendKeys() {} it("local", () => { sendKeys(); });')
      .calls,
    0
  );
  pass('it("shadow", () => { const sendKeys = () => undefined; sendKeys(); });', 0);
});

test("timer callbacks remain detached even if their inner command is awaited or returned", () => {
  for (const callback of [
    '() => sendKeys({press:"Enter"})',
    'async () => { await sendKeys({press:"Enter"}); }',
    '() => { return sendKeys({press:"Enter"}); }'
  ]) {
    fail(`it("keys", async () => { setTimeout(${callback}); await oneEvent(el,"change"); });`);
  }
  fail('it("keys", async () => { setTimeout(sendKeys, 0, {press:"Enter"}); });');
  fail(
    'it("keys", async () => { await setTimeout(async () => { await sendKeys({press:"Enter"}); }); });'
  );
});

test("the seven original timer-dispatched command patterns are all rejected", () => {
  const actions = [
    { type: "abc" },
    { press: "Enter" },
    { press: "Space" },
    { press: "Enter" },
    { press: "," },
    { press: "Backspace" },
    { press: "Enter" }
  ];
  const result = inspect(
    actions
      .map(
        (action, index) =>
          `it("original ${index}", async () => { setTimeout(() => sendKeys(${JSON.stringify(action)})); await oneEvent(el,"change"); });`
      )
      .join("\n")
  );
  assert.equal(result.calls, 7);
  assert.equal(result.problems.length, 7);
});

test("detached handlers, forEach and unawaited async IIFEs cannot borrow the outer test await", () => {
  fail(
    'it("keys", async () => { [1].forEach(async () => { await sendKeys({press:"Enter"}); }); });'
  );
  fail(
    'it("keys", async () => { el.addEventListener("click", async () => { await sendKeys({press:"Enter"}); }); });'
  );
  fail(
    'it("keys", async () => { await unknown.then(async () => { await sendKeys({press:"Enter"}); }); });'
  );
  fail('it("keys", async () => { (async () => { await sendKeys({press:"Enter"}); })(); });');
  pass('it("keys", async () => { await (async () => { await sendKeys({press:"Enter"}); })(); });');
});

test("unowned aggregates, races, swallowed failures and void calls do not certify completion", () => {
  for (const body of [
    'Promise.all([sendKeys({press:"Enter"})]);',
    'await Promise.race([sendKeys({press:"Enter"}), timeout()]);',
    'await Promise.allSettled([sendKeys({press:"Enter"})]);',
    'void sendKeys({press:"Enter"});',
    'sendKeys({press:"Enter"}).then(() => undefined);',
    'await sendKeys({press:"Enter"}).catch(() => undefined);',
    'const pending = sendKeys({press:"Enter"}); await pending;'
  ])
    fail(`it("keys", async () => { ${body} });`);
  pass('it("keys", async () => { await sendKeys({press:"Enter"}).then(() => undefined); });');
});

test("native clipboard reads/writes and their immutable aliases require the same ownership", () => {
  pass('it("clipboard", async () => { await navigator.clipboard.writeText("owned"); });');
  pass('const clipboard = navigator.clipboard; it("clipboard", () => clipboard.readText());');
  fail('it("clipboard", async () => { navigator.clipboard.writeText("detached"); });');
  fail(
    'const clipboard = navigator.clipboard; it("clipboard", async () => { setTimeout(async () => { await clipboard.readText(); }); });'
  );
  fail(
    'it("clipboard", async () => { const write = navigator.clipboard.writeText; setTimeout(write); });'
  );
});

test("escaping references and malformed syntax fail closed", () => {
  fail('it("keys", async () => { const bag = { keys: sendKeys }; });');
  fail('it("keys", async () => { let keys = sendKeys; await keys({press:"Enter"}); });');
  assert.ok(
    inspectBrowserCommandOwnership(
      'import * as commands from "@web/test-runner-commands"; it("escape", () => { unknown(commands); });'
    ).problems.length > 0
  );
  assert.throws(() => inspect('it("bad", async () => {'), /Cannot parse/);
});

test("repository test commands all have proven ownership", async () => {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const result = await checkBrowserCommandOwnership(root);
  assert.ok(result.files >= 141, "test discovery must include the existing catalog");
  assert.ok(
    result.calls >= 47,
    "command discovery must include the existing native and media paths"
  );
  assert.deepEqual(result.problems, []);
});
