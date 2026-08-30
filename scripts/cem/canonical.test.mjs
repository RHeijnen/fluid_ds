import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ts } from "../../packages/components/node_modules/@custom-elements-manifest/analyzer/index.js";
import {
  analyzePackage,
  canonicalModule,
  checkManifestOutputs,
  expectedManifestOutputs,
  readRepositoryManifests,
  requireManifestPublication,
  resolveRegistry
} from "./canonical.mjs";
import {
  eventFixture,
  factoryFixture,
  inheritanceFixture,
  typedEventFixture
} from "./fixtures.mjs";

const record = (sources, packageName = "@fluid-ds/fixture") => ({
  packageName,
  manifest: analyzePackage(packageName, sources)
});
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

test("dynamic event arguments never become event names; arrows and dispatched locals remain discoverable", () => {
  const events = resolveRegistry([record(eventFixture)])[0].events;
  assert.deepEqual(
    events.map((event) => event.name),
    ["fluid-change", "fluid-click", "fluid-native", "fluid-select"]
  );
  assert.ok(
    events
      .filter((event) => event.name !== "fluid-native")
      .every((event) => event.type.text === "CustomEvent<unknown>")
  );
  assert.equal(events.find((event) => event.name === "fluid-native").type.text, "Event");
});

test("own member and event declarations override inherited metadata without losing inherited members", () => {
  const { manifest } = record(inheritanceFixture);
  const child = manifest.modules
    .flatMap((module) => module.declarations ?? [])
    .find((entry) => entry.name === "FluidChild");
  assert.equal(child.members.find((member) => member.name === "value").type.text, "string");
  assert.equal(child.members.find((member) => member.name === "value").inheritedFrom, undefined);
  assert.equal(
    child.members.find((member) => member.name === "retained").inheritedFrom.name,
    "Base"
  );
  assert.equal(child.members.filter((member) => member.name === "shared").length, 2);
  assert.equal(
    child.events.find((event) => event.name === "fluid-change").description,
    "Child change."
  );
});

test("all eight constructor-only chart factory aliases resolve to public classes with inherited events", () => {
  const entries = resolveRegistry([record(factoryFixture)]);
  assert.equal(entries.length, 8);
  assert.ok(
    entries.every(
      (entry) => entry.events.length === 1 && entry.events[0].name === "fluid-legend-change"
    )
  );
  assert.ok(entries.every((entry) => entry.events[0].inheritedFrom.name === "FluidChart"));
});

test("unsupported factories and missing public class exports fail closed", () => {
  assert.throws(
    () =>
      resolveRegistry([
        record([
          {
            path: "src/index.ts",
            text: 'declare function unknown(): typeof HTMLElement; export const FluidUnknown = unknown(); customElements.define("fluid-unknown", FluidUnknown);'
          }
        ])
      ]),
    /Unresolved class or unsupported factory/
  );
  const changed = structuredClone(factoryFixture);
  changed[1].text = changed[1].text.replace("constructor()", "changed() {} constructor()");
  assert.throws(() => record(changed), /Unsupported factory/);
  const conditional = structuredClone(factoryFixture);
  conditional[1].text = conditional[1].text.replace(
    "return class",
    "if (type === 'unknown') return HTMLElement; return class"
  );
  assert.throws(
    () => resolveRegistry([record(conditional)]),
    /Unresolved class or unsupported factory/
  );
  const valid = record(eventFixture);
  valid.manifest.modules[0].exports = valid.manifest.modules[0].exports.filter(
    (entry) => entry.kind !== "js"
  );
  assert.throws(() => resolveRegistry([valid]), /not publicly exported/);
});

test("inheritance cycles are rejected before entering the upstream analyzer", () => {
  assert.throws(
    () =>
      record([
        {
          path: "src/index.ts",
          text: 'export class A extends B {} export class B extends A {} customElements.define("fluid-a", A);'
        }
      ]),
    /Cyclic inheritance/
  );
});

test("duplicate tags, declarations, modules and mismatched inventory cannot inflate completeness", () => {
  const valid = record(eventFixture);
  assert.throws(
    () => resolveRegistry([valid, { ...valid, packageName: "@fluid-ds/other" }]),
    /Duplicate registered tag/
  );
  assert.throws(() => resolveRegistry([valid, valid]), /Duplicate manifest package/);
  assert.throws(() => resolveRegistry([valid], []), /independent quality catalog/);
  const duplicate = structuredClone(valid);
  duplicate.manifest.modules.push(duplicate.manifest.modules[0]);
  assert.throws(() => resolveRegistry([duplicate]), /Duplicate manifest module/);
  const declarations = structuredClone(valid);
  declarations.manifest.modules[0].declarations.push(
    declarations.manifest.modules[0].declarations[0]
  );
  assert.throws(() => resolveRegistry([declarations]), /Duplicate declaration/);
});

test("package-local identities normalize analyzer references and reject source escapes", () => {
  assert.equal(canonicalModule("/src/button/define.js"), "src/button/define.ts");
  assert.equal(canonicalModule("src\\button\\define.ts"), "src/button/define.ts");
  for (const invalid of [
    "../../private.ts",
    "src/../private.ts",
    "C:\\repo\\private.ts",
    "/etc/passwd",
    "src//bad.ts"
  ])
    assert.throws(() => canonicalModule(invalid));
  const invalid = record(eventFixture);
  invalid.manifest.schemaVersion = "future";
  assert.throws(() => resolveRegistry([invalid]), /Unsupported CEM schema/);
});

test("source ordering does not change deterministic manifest bytes", () => {
  const first = expectedManifestOutputs([record(factoryFixture)]);
  const second = expectedManifestOutputs([record([...factoryFixture].reverse())]);
  assert.deepEqual([...first], [...second]);
});

test("byte checking detects absent and modified artifacts without rewriting them", async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), "fluid-cem-unit-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const outputs = expectedManifestOutputs([record(eventFixture)]);
  await assert.rejects(() => checkManifestOutputs(temporary, outputs), /Missing manifest/);
  for (const [path, expected] of outputs) {
    await mkdir(dirname(join(temporary, path)), { recursive: true });
    await writeFile(join(temporary, path), expected);
  }
  await checkManifestOutputs(temporary, outputs);
  const path = join(temporary, [...outputs.keys()][0]);
  await writeFile(path, "tampered\n");
  await assert.rejects(() => checkManifestOutputs(temporary, outputs), /Changed manifest/);
  assert.equal(await readFile(path, "utf8"), "tampered\n");
});

test("repository analysis resolves all 155 actual registrations and leaves payloads honest", async () => {
  const before = await readFile(join(root, "packages/components/custom-elements.json"), "utf8");
  const { records, registry } = await readRepositoryManifests(root);
  assert.equal(records.length, 14);
  assert.equal(registry.length, 155);
  assert.equal(registry.flatMap((entry) => entry.events).length, 166);
  const events = registry.flatMap((entry) => entry.events);
  assert.equal(events.filter((event) => event.type.text === "CustomEvent<unknown>").length, 128);
  const typed = events.filter((event) => event.type.text !== "CustomEvent<unknown>");
  assert.equal(typed.length, 38);
  const select = registry.find((entry) => entry.tag === "fluid-select").events[0];
  assert.equal(
    select["x-fluid-event-contract"].dispatches,
    2,
    "Both pointer and keyboard dispatches are verified"
  );
  const anchorNav = registry.find((entry) => entry.tag === "fluid-anchor-nav").events[0];
  assert.deepEqual(anchorNav.type, {
    text: "FluidAnchorNavActiveChangeEvent",
    references: [{ name: "FluidAnchorNavActiveChangeEvent", package: "@fluid-ds/components" }]
  });
  assert.equal(anchorNav["x-fluid-event-contract"].detailType, "FluidAnchorNavActiveChangeDetail");
  for (const [tag, eventName, eventType, detailType, dispatches] of [
    [
      "fluid-file-input",
      "fluid-change",
      "FluidFileInputChangeEvent",
      "FluidFileInputChangeDetail",
      2
    ],
    ["fluid-dropzone", "fluid-change", "FluidDropzoneChangeEvent", "FluidDropzoneChangeDetail", 2],
    ["fluid-dropzone", "fluid-reject", "FluidDropzoneRejectEvent", "FluidDropzoneRejectDetail", 1],
    ["fluid-form", "fluid-invalid", "FluidFormInvalidEvent", "FluidFormInvalidDetail", 1],
    ["fluid-form", "fluid-submit", "FluidFormSubmitEvent", "FluidFormSubmitDetail", 1],
    ["fluid-rating", "fluid-change", "FluidRatingChangeEvent", "FluidRatingChangeDetail", 1],
    ["fluid-otp", "fluid-complete", "FluidOtpCompleteEvent", "FluidOtpValueDetail", 1],
    ["fluid-otp", "fluid-input", "FluidOtpInputEvent", "FluidOtpValueDetail", 1]
  ]) {
    const event = registry
      .find((entry) => entry.tag === tag)
      .events.find((entry) => entry.name === eventName);
    assert.deepEqual(event.type, {
      text: eventType,
      references: [{ name: eventType, package: "@fluid-ds/components" }]
    });
    assert.equal(event["x-fluid-event-contract"].detailType, detailType);
    assert.equal(event["x-fluid-event-contract"].dispatches, dispatches);
  }
  for (const [tag, eventName, eventType] of [
    ["fluid-tooltip", "fluid-show", "FluidTooltipShowEvent"],
    ["fluid-tooltip", "fluid-hide", "FluidTooltipHideEvent"],
    ["fluid-dropdown", "fluid-show", "FluidDropdownShowEvent"],
    ["fluid-dropdown", "fluid-hide", "FluidDropdownHideEvent"],
    ["fluid-context-menu", "fluid-show", "FluidContextMenuShowEvent"],
    ["fluid-context-menu", "fluid-hide", "FluidContextMenuHideEvent"],
    ["fluid-callout", "fluid-dismiss", "FluidCalloutDismissEvent"],
    ["fluid-banner", "fluid-dismiss", "FluidBannerDismissEvent"]
  ]) {
    const event = registry
      .find((entry) => entry.tag === tag)
      .events.find((entry) => entry.name === eventName);
    assert.deepEqual(event.type, {
      text: eventType,
      references: [{ name: eventType, package: "@fluid-ds/components" }]
    });
    assert.equal(event["x-fluid-event-contract"].detailType, "null");
    assert.equal(event["x-fluid-event-contract"].dispatches, 1);
  }
  assert.ok(
    typed.every(
      (event) =>
        event.type.references[0].package === "@fluid-ds/components" &&
        event["x-fluid-event-contract"].verification === "explicit-dispatch-generic"
    )
  );
  const input = records
    .find((entry) => entry.packageName === "@fluid-ds/components")
    .manifest.modules.flatMap((module) => module.declarations ?? [])
    .find((entry) => entry.name === "FluidInput");
  assert.equal(input.members.find((member) => member.name === "value").type.text, "string");
  for (const tag of ["fluid-line-chart", "fluid-bar-chart", "fluid-celebrate", "fluid-tree-item"])
    assert.ok(registry.find((entry) => entry.tag === tag).events.length > 0);
  assert.equal(
    await readFile(join(root, "packages/components/custom-elements.json"), "utf8"),
    before
  );
});

test("named public event contracts have real explicit dispatch generics and import references", () => {
  const event = resolveRegistry([record(typedEventFixture)])[0].events[0];
  assert.deepEqual(event.type, {
    text: "FixtureChangeEvent",
    references: [{ name: "FixtureChangeEvent", package: "@fluid-ds/fixture" }]
  });
  assert.equal(event["x-fluid-event-contract"].detailType, "FixtureDetail");
  assert.equal(event["x-fluid-event-contract"].dispatches, 1);
});

test("event aliases and their detail dependencies must be publicly importable", () => {
  for (const name of ["FixtureChangeEvent", "FixtureDetail", "FixtureOption"]) {
    const sources = structuredClone(typedEventFixture);
    sources[1].text = sources[1].text.replace(name, "RemovedExport");
    assert.throws(() => record(sources), /not exported from the public barrel/);
  }
  const sources = structuredClone(typedEventFixture);
  sources[0].text = sources[0].text.replace(
    "export interface FixtureOption",
    "interface FixtureOption"
  );
  assert.throws(() => record(sources), /declaration is not exported/);
});

test("metadata cannot invent precision when a dispatch is absent, untyped or incompatible", () => {
  for (const [before, after, reason] of [
    [
      'this.dispatchEvent(new CustomEvent<FixtureDetail>("fluid-change", { detail: { value: "a", option: {value:"a"} } }));',
      "",
      /no proven literal dispatch/
    ],
    ["new CustomEvent<FixtureDetail>", "new CustomEvent", /lacks an explicit detail generic/],
    ["new CustomEvent<FixtureDetail>", "new CustomEvent<OtherDetail>", /generic disagree/],
    ["{ detail: { value:", "{ ignored: { value:", /exactly one explicit detail field/],
    ['"fluid-change", { detail:', "dynamicName, { detail:", /no proven literal dispatch/],
    [
      "{FixtureChangeEvent} fluid-change",
      "{CustomEvent<{value:number}>} fluid-change",
      /named public contract/
    ]
  ]) {
    const sources = structuredClone(typedEventFixture);
    sources[0].text = sources[0].text.replace(before, after);
    assert.throws(() => record(sources), reason);
  }
});

test("named aliases cannot conceal any or unknown while application option data stays unknown", () => {
  const sources = structuredClone(typedEventFixture);
  sources[0].text = sources[0].text.replace("data?: unknown", "data?: any");
  assert.throws(() => record(sources), /must not hide any/);
  const unknown = structuredClone(typedEventFixture);
  unknown[0].text = unknown[0].text.replace("CustomEvent<FixtureDetail>", "CustomEvent<unknown>");
  assert.throws(() => record(unknown), /must not conceal an unverified payload/);
  assert.doesNotThrow(() => record(typedEventFixture));
});

test("platform event dependencies are explicit and narrowly allowlisted", () => {
  const platform = structuredClone(typedEventFixture);
  platform[0].text = platform[0].text.replace(
    "value: string; option: FixtureOption;",
    "value: string; files: File[]; invalid: HTMLElement;"
  );
  assert.doesNotThrow(() => record(platform));

  const unsupported = structuredClone(platform);
  unsupported[0].text = unsupported[0].text.replace("HTMLElement", "Window");
  assert.throws(() => record(unsupported), /Unresolved event type: .*#Window/);
});

test("publication metadata cannot promise a manifest excluded from the tarball or exports", () => {
  const descriptor = {
    name: "@fluid-ds/fixture",
    customElements: "custom-elements.json",
    exports: { "./custom-elements.json": "./custom-elements.json" },
    publishConfig: { exports: { "./custom-elements.json": "./custom-elements.json" } },
    files: ["custom-elements.json"]
  };
  requireManifestPublication(descriptor.name, descriptor);
  for (const key of ["customElements", "exports", "publishConfig", "files"]) {
    const missing = structuredClone(descriptor);
    delete missing[key];
    assert.throws(() => requireManifestPublication(descriptor.name, missing));
  }
});

test("the TypeScript dispatch checker rejects mismatched string, boolean, array and null shapes", () => {
  const filename = join(root, "event-detail-negative.fixture.ts");
  const source = `
interface StringDetail { value: string; }
interface ToggleDetail { checked: boolean; }
interface ArrayDetail { value: string[]; }
new CustomEvent<StringDetail>("fluid-change", { detail: { value: "ok" } });
new CustomEvent<ToggleDetail>("fluid-change", { detail: { checked: true } });
new CustomEvent<ArrayDetail>("fluid-change", { detail: { value: ["ok"] } });
new CustomEvent<null>("fluid-show", { detail: null });
new CustomEvent<StringDetail>("fluid-change", { detail: { value: 42 } });
new CustomEvent<ToggleDetail>("fluid-change", { detail: { checked: "yes" } });
new CustomEvent<ArrayDetail>("fluid-change", { detail: { value: "csv" } });
new CustomEvent<null>("fluid-show", { detail: { reason: "invented" } });
`;
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (path, language, ...rest) =>
    resolve(path) === resolve(filename)
      ? ts.createSourceFile(path, source, language, true)
      : getSourceFile(path, language, ...rest);
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    4,
    diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n")
  );
  assert.ok(diagnostics.every((diagnostic) => diagnostic.code === 2322));
});
