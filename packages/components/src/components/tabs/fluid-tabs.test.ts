import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidTabs } from "./fluid-tabs.js";

const sample = html`
  <fluid-tabs value="overview">
    <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
    <fluid-tab slot="nav" panel="usage">Usage</fluid-tab>
    <fluid-tab slot="nav" panel="api">API</fluid-tab>
    <fluid-tab-panel name="overview">Overview content</fluid-tab-panel>
    <fluid-tab-panel name="usage">Usage content</fluid-tab-panel>
    <fluid-tab-panel name="api">API content</fluid-tab-panel>
  </fluid-tabs>
`;

describe("<fluid-tabs>", () => {
  it("activates the value panel", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    const panels = el.querySelectorAll("fluid-tab-panel");
    expect(panels[0]!.hasAttribute("hidden")).to.be.false;
    expect(panels[1]!.hasAttribute("hidden")).to.be.true;
    expect(panels[2]!.hasAttribute("hidden")).to.be.true;
  });

  it("selecting a tab updates the value and shows its panel", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    const usage = el.querySelector<HTMLElement>('fluid-tab[panel="usage"]')!;
    setTimeout(() => usage.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("usage");
    expect(el.value).to.equal("usage");
  });

  it("ArrowRight moves focus and (auto mode) activates next tab", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    const tabs = el.querySelectorAll<HTMLElement>("fluid-tab");
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("usage");
  });

  it("Home jumps to first tab", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs value="api">
        <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
        <fluid-tab slot="nav" panel="usage">Usage</fluid-tab>
        <fluid-tab slot="nav" panel="api">API</fluid-tab>
        <fluid-tab-panel name="overview"></fluid-tab-panel>
        <fluid-tab-panel name="usage"></fluid-tab-panel>
        <fluid-tab-panel name="api"></fluid-tab-panel>
      </fluid-tabs>
    `);
    await el.updateComplete;
    const api = el.querySelector<HTMLElement>('fluid-tab[panel="api"]')!;
    api.focus();
    api.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("overview");
  });

  it("wires aria-controls and aria-labelledby", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    const tab = el.querySelector<HTMLElement>('fluid-tab[panel="overview"]')!;
    const panel = el.querySelector<HTMLElement>('fluid-tab-panel[name="overview"]')!;
    expect(tab.getAttribute("aria-controls")).to.equal(panel.id);
    expect(panel.getAttribute("aria-labelledby")).to.equal(tab.id);
  });

  it("defaults value to the first non-disabled tab", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs>
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A</fluid-tab-panel>
        <fluid-tab-panel name="b">B</fluid-tab-panel>
      </fluid-tabs>
    `);
    await el.updateComplete;
    expect(el.value).to.equal("a");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("selected tab color reads the --fluid-tab-* override ladder", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    const tab = el.querySelector<HTMLElement>('fluid-tab[panel="overview"]')!;
    tab.style.setProperty("--fluid-tab-selected-fg", "rgb(1, 2, 3)");
    await (tab as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(getComputedStyle(tab).color).to.equal("rgb(1, 2, 3)");
  });

  it("each tab respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidTabs>(sample);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const tab = el.querySelector<HTMLElement>("fluid-tab")!;
    expect(tab.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
