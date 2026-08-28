export const eventFixture = [
  {
    path: "src/index.ts",
    text: `
/** @fires fluid-change - A documented dynamic event. */
export class FluidFixture extends HTMLElement {
  emit(name: string) { this.dispatchEvent(new CustomEvent(name, {detail: {value: 1}})); }
  private click = () => this.dispatchEvent(new CustomEvent("fluid-select", { detail: { item: this } }));
  activate() { const activation = new CustomEvent("fluid-click"); this.dispatchEvent(activation); }
  unused() { const activation = new CustomEvent("fluid-unused"); }
  internal() { /** @internal */ this.dispatchEvent(new CustomEvent("fluid-secret")); }
  shadowed() {
    { const activation = new CustomEvent("fluid-unused-shadow"); }
    { const activation = new Event("fluid-native"); this.dispatchEvent(activation); }
  }
  reassigned() { let activation = new CustomEvent("fluid-unused-reassigned"); activation = otherEvent; this.dispatchEvent(activation); }
  ignoredLocal() { const event = new CustomEvent("fluid-unused-internal"); /** @ignore */ this.dispatchEvent(event); }
}
customElements.define("fluid-fixture", FluidFixture);
`
  }
];

export const inheritanceFixture = [
  {
    path: "src/base.ts",
    text: `
/** @fires fluid-change - Base change. */
export class Base extends HTMLElement {
  value: string | string[] | null = null;
  static shared = "static";
  retained = true;
}
`
  },
  {
    path: "src/index.ts",
    text: `
import { Base } from "./base.js";
/** @fires fluid-change - Child change. */
export class FluidChild extends Base {
  override value: string = "";
  shared = "instance";
}
customElements.define("fluid-child", FluidChild);
`
  }
];

export const factoryFixture = [
  {
    path: "src/base.ts",
    text: `
/** @fires fluid-legend-change - Legend changed. */
export class FluidChart extends HTMLElement { type = "line"; }
`
  },
  {
    path: "src/factory.ts",
    text: `
import { FluidChart } from "./base.js";
export function createTypedChart(type: string): typeof FluidChart {
  return class extends FluidChart { constructor() { super(); this.type = type; } };
}
`
  },
  {
    path: "src/index.ts",
    text: `
import { createTypedChart as create } from "./factory.js";
${["Bar", "Line", "Pie", "Doughnut", "Scatter", "Bubble", "Radar", "Polar"]
  .map(
    (name) => `
export const Fluid${name} = create("${name.toLowerCase()}");
customElements.define("fluid-${name.toLowerCase()}", Fluid${name});`
  )
  .join("\n")}
`
  }
];

export const typedEventFixture = [
  {
    path: "src/fixture.ts",
    text: `
export interface FixtureOption { value: string; data?: unknown; }
export interface FixtureDetail { value: string; option: FixtureOption; }
export type FixtureChangeEvent = CustomEvent<FixtureDetail>;
/** @fires {FixtureChangeEvent} fluid-change - Explicit public contract. */
export class FluidTyped extends HTMLElement {
  change() { this.dispatchEvent(new CustomEvent<FixtureDetail>("fluid-change", { detail: { value: "a", option: {value:"a"} } })); }
}
`
  },
  {
    path: "src/index.ts",
    text: `
import { FluidTyped } from "./fixture.js";
export { FluidTyped } from "./fixture.js";
export type { FixtureOption, FixtureDetail, FixtureChangeEvent } from "./fixture.js";
customElements.define("fluid-typed", FluidTyped);
`
  }
];
