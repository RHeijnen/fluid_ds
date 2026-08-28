import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { eventProp, nativeEventTypes } from "./event-props.mjs";

test("all 38 verified canonical event contracts retain explicit public payload aliases", async () => {
  const native = await readFile(new URL("../src/jsx/components.ts", import.meta.url), "utf8");
  const pairs = [
    ["anchor-nav", "active-change", "FluidAnchorNavActiveChangeEvent"],
    ["button", "change", "FluidButtonChangeEvent"],
    ["button", "click", "FluidButtonClickEvent"],
    ["banner", "dismiss", "FluidBannerDismissEvent"],
    ["callout", "dismiss", "FluidCalloutDismissEvent"],
    ["checkbox", "change", "FluidCheckboxChangeEvent"],
    ["switch", "change", "FluidSwitchChangeEvent"],
    ["radio-group", "change", "FluidRadioGroupChangeEvent"],
    ["select", "change", "FluidSelectChangeEvent"],
    ["textarea", "input", "FluidTextareaInputEvent"],
    ["textarea", "change", "FluidTextareaChangeEvent"],
    ["tag-input", "change", "FluidTagInputChangeEvent"],
    ["slider", "input", "FluidSliderInputEvent"],
    ["slider", "change", "FluidSliderChangeEvent"],
    ["dialog", "show", "FluidDialogShowEvent"],
    ["dialog", "hide", "FluidDialogHideEvent"],
    ["drawer", "show", "FluidDrawerShowEvent"],
    ["drawer", "hide", "FluidDrawerHideEvent"],
    ["dropdown", "show", "FluidDropdownShowEvent"],
    ["dropdown", "hide", "FluidDropdownHideEvent"],
    ["context-menu", "show", "FluidContextMenuShowEvent"],
    ["context-menu", "hide", "FluidContextMenuHideEvent"],
    ["dropzone", "change", "FluidDropzoneChangeEvent"],
    ["dropzone", "reject", "FluidDropzoneRejectEvent"],
    ["file-input", "change", "FluidFileInputChangeEvent"],
    ["form", "invalid", "FluidFormInvalidEvent"],
    ["form", "submit", "FluidFormSubmitEvent"],
    ["otp", "complete", "FluidOtpCompleteEvent"],
    ["otp", "input", "FluidOtpInputEvent"],
    ["popover", "show", "FluidPopoverShowEvent"],
    ["popover", "hide", "FluidPopoverHideEvent"],
    ["rating", "change", "FluidRatingChangeEvent"],
    ["input", "change", "FluidInputChangeEvent"],
    ["input", "input", "FluidInputInputEvent"],
    ["typeahead", "change", "FluidTypeaheadChangeEvent"],
    ["typeahead", "input", "FluidTypeaheadInputEvent"],
    ["tooltip", "show", "FluidTooltipShowEvent"],
    ["tooltip", "hide", "FluidTooltipHideEvent"]
  ];
  for (const [file, event, alias] of pairs) {
    const wrapper = await readFile(new URL(`../src/generated/${file}.ts`, import.meta.url), "utf8");
    assert.ok(wrapper.includes(`"fluid-${event}" as EventName<${alias}>`));
    const nativeLine = native.split("\n").find((line) => line.includes(`"fluid-${file}":`));
    assert.ok(nativeLine?.includes(`"onfluid-${event}"?: (event: ${alias})`));
  }
});

test("the generated denominator stays honest for events without public aliases", async () => {
  const generated = new URL("../src/generated/", import.meta.url);
  const files = await Promise.all(
    (await readdir(generated))
      .filter((name) => name.endsWith(".ts"))
      .map((name) => readFile(new URL(name, generated), "utf8"))
  );
  const unknowns = files.reduce(
    (count, source) => count + (source.match(/EventName<CustomEvent<unknown>>/g)?.length ?? 0),
    0
  );
  assert.equal(unknowns, 128, "166 canonical events minus the 38 verified contracts stay unknown");
});

test("wrapper props retain explicit camel-case mappings", () => {
  assert.equal(eventProp("fluid-change"), "onFluidChange");
  assert.equal(eventProp("fluid-node-move"), "onFluidNodeMove");
});

test("native custom-element event properties preserve exact event spelling", () => {
  assert.equal(
    nativeEventTypes(["fluid-change", "sayHi"]),
    '"onfluid-change"?: (event: CustomEvent<unknown>) => void; "onsayHi"?: (event: CustomEvent<unknown>) => void;'
  );
  assert.equal(nativeEventTypes([]), "");
  assert.equal(
    nativeEventTypes([{ name: "fluid-change", type: { text: "FluidInputChangeEvent" } }]),
    '"onfluid-change"?: (event: FluidInputChangeEvent) => void;'
  );
  assert.doesNotMatch(nativeEventTypes(["fluid-change"]), /onFluidChange/);
});

test("generated native and wrapper entry points enforce different listener conventions", async () => {
  const native = await readFile(new URL("../src/jsx/components.ts", import.meta.url), "utf8");
  const wrapper = await readFile(new URL("../src/generated/input.ts", import.meta.url), "utf8");
  assert.match(native, /"onfluid-change"\?: \(event: CustomEvent<unknown>\)/);
  assert.doesNotMatch(native, /onFluidChange\?:/);
  assert.match(wrapper, /onFluidChange: "fluid-change" as EventName<FluidInputChangeEvent>/);
  assert.match(
    wrapper,
    /import type \{ FluidInputChangeEvent, FluidInputInputEvent \} from "@fluid-ds\/components"/
  );
  assert.match(native, /"fluid-input": [^\n]*"onfluid-change"\?: \(event: FluidInputChangeEvent\)/);
});

test("canonical metadata restores inherited and arrow-member events without inventing payloads", async () => {
  for (const [file, event] of [
    ["line-chart", "fluid-legend-change"],
    ["bar-chart", "fluid-legend-change"],
    ["celebrate", "fluid-celebrate-end"],
    ["tree-item", "fluid-select"]
  ]) {
    const wrapper = await readFile(new URL(`../src/generated/${file}.ts`, import.meta.url), "utf8");
    assert.ok(wrapper.includes(`"${event}" as EventName<CustomEvent<unknown>>`));
  }
});
