import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const filename = join(root, "scripts", "__virtual-localization-contract.ts");
const config = JSON.parse(await readFile(join(root, "tsconfig.base.json"), "utf8"));
const converted = ts.convertCompilerOptionsFromJson(config.compilerOptions, root);
assert.deepEqual(converted.errors, []);

function diagnostics(body) {
  const source = `import { LocalizationController } from "../packages/components/src/internal/localization.js";
    import { FluidElement } from "../packages/components/src/internal/base-element.js";
    declare const controller: LocalizationController;
    class Probe extends FluidElement { check() { ${body.replaceAll("SUBJECT", "this")} } }
    ${body.replaceAll("SUBJECT", "controller")}`;
  const options = { ...converted.options, noEmit: true, types: [] };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (path, languageVersion, ...rest) =>
    resolve(path) === filename
      ? ts.createSourceFile(path, source, languageVersion, true)
      : original(path, languageVersion, ...rest);
  return ts.getPreEmitDiagnostics(ts.createProgram([filename], options, host));
}

test("controller and component helpers accept declared string, numeric and multi-argument terms", () => {
  assert.deepEqual(
    diagnostics(`
    SUBJECT.term("dismiss");
    SUBJECT.term("page", 2);
    SUBJECT.term("slideOf", 2, 8);
    SUBJECT.term("avatarWithInitials", "AB");
    SUBJECT.term("digitOf", 1, 6);
    SUBJECT.term("removeFile", "report.csv");
    SUBJECT.term("eventsOnDate", 3, "3", "27 August 2026");
    SUBJECT.term("kanbanMovedCard", "Card", "Column", "2", "4");
    SUBJECT.term("nodeGraphConnectCandidate", "Node", "2", "5");
    SUBJECT.term("parserTransformFailed", "Field", "Reason");
    SUBJECT.term("parserReadySummary", 2, 5, 1, 2, "2", "5", "1", "2");
  `).map(({ code, messageText }) => ({ code, messageText })),
    []
  );
});

test("controller and component helpers reject incorrect argument kinds and arity", () => {
  const cases = [
    'SUBJECT.term("page", "two");',
    'SUBJECT.term("page");',
    'SUBJECT.term("page", 1, 2);',
    'SUBJECT.term("dismiss", "extra");',
    'SUBJECT.term("slideOf", 1);',
    'SUBJECT.term("slideOf", 1, "eight");',
    'SUBJECT.term("avatarWithInitials", 12);',
    'SUBJECT.term("digitOf", 1, null);',
    'SUBJECT.term("removeFile", undefined);',
    'SUBJECT.term("eventsOnDate", "three", "3", "date");',
    'SUBJECT.term("kanbanMovedCard", "Card", "Column", "2");',
    'SUBJECT.term("nodeGraphConnectCandidate", "Node", 2, "5");',
    'SUBJECT.term("parserTransformFailed", "Field");',
    'SUBJECT.term("parserReadySummary", 2, 5, 1, 2, "2", "5", "1");',
    'SUBJECT.term("parserReadySummary", 2, 5, 1, 2, "2", "5", "1", 2);',
    'SUBJECT.term("missingTerm");',
    'SUBJECT.term("$code");'
  ];
  const result = diagnostics(
    cases.map((source) => `// @ts-expect-error invalid translation contract\n${source}`).join("\n")
  );
  assert.deepEqual(
    result.map(({ code, messageText }) => ({ code, messageText })),
    []
  );
});
