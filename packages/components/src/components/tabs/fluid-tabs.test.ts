import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
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

  it("reverses horizontal navigation in RTL", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs dir="rtl" value="usage">
        <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
        <fluid-tab slot="nav" panel="usage">Usage</fluid-tab>
        <fluid-tab slot="nav" panel="api">API</fluid-tab>
        <fluid-tab-panel name="overview"></fluid-tab-panel>
        <fluid-tab-panel name="usage"></fluid-tab-panel>
        <fluid-tab-panel name="api"></fluid-tab-panel>
      </fluid-tabs>
    `);
    await el.updateComplete;
    const usage = el.querySelector<HTMLElement>('fluid-tab[panel="usage"]')!;
    usage.focus();
    usage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("overview");
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

  it("does not emit fluid-change on the initial auto-select", async () => {
    let fired = 0;
    const onChange = () => {
      fired += 1;
    };
    // Attach the listener before the element finishes its first update so any
    // mount-time auto-select emission would be observed.
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs @fluid-change=${onChange}>
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A</fluid-tab-panel>
        <fluid-tab-panel name="b">B</fluid-tab-panel>
      </fluid-tabs>
    `);
    await el.updateComplete;
    // The auto-select picks the first tab but must not announce a change.
    expect(el.value).to.equal("a");
    expect(fired).to.equal(0);

    // A real user interaction should still emit.
    const second = el.querySelector<HTMLElement>('fluid-tab[panel="b"]')!;
    second.click();
    await el.updateComplete;
    expect(fired).to.equal(1);
  });

  it("recovers to an available tab when the selected tab-panel pair is removed", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs>
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A panel</fluid-tab-panel>
        <fluid-tab-panel name="b">B panel</fluid-tab-panel>
      </fluid-tabs>
    `);
    const changes: string[] = [];
    el.addEventListener("fluid-change", (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value)
    );
    el.querySelector<HTMLElement>('fluid-tab[panel="b"]')!.click();
    await el.updateComplete;
    el.querySelector('fluid-tab[panel="b"]')!.remove();
    el.querySelector('fluid-tab-panel[name="b"]')!.remove();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await el.updateComplete;
    expect(el.value).to.equal("a");
    expect(el.querySelector('fluid-tab[panel="a"]')!.getAttribute("aria-selected")).to.equal(
      "true"
    );
    expect(changes).to.deep.equal(["b", "a"]);
  });

  it("recovers when the selected tab becomes disabled", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs value="b">
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A panel</fluid-tab-panel>
        <fluid-tab-panel name="b">B panel</fluid-tab-panel>
      </fluid-tabs>
    `);
    const selected = el.querySelector<HTMLElement>('fluid-tab[panel="b"]')!;

    selected.setAttribute("disabled", "");
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("a");
    expect(el.querySelector('fluid-tab[panel="a"]')!.getAttribute("aria-selected")).to.equal(
      "true"
    );
    expect(selected.getAttribute("aria-selected")).to.equal("false");
    expect(selected.tabIndex).to.equal(-1);
  });

  it("neutralizes a selected tab when it is removed and keeps it inert on reconnect", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs value="b">
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A panel</fluid-tab-panel>
        <fluid-tab-panel name="b">B panel</fluid-tab-panel>
      </fluid-tabs>
    `);
    const removed = el.querySelector<HTMLElement>('fluid-tab[panel="b"]')!;

    removed.remove();
    await aTimeout(0);

    expect(el.value).to.equal("a");
    expect(removed.hasAttribute("selected")).to.be.false;
    expect(removed.getAttribute("aria-selected")).to.equal("false");
    expect(removed.tabIndex).to.equal(-1);

    document.body.append(removed);
    await (removed as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    expect(removed.hasAttribute("selected")).to.be.false;
    expect(removed.tabIndex).to.equal(-1);
    removed.remove();
  });

  it("rewires a live replacement for the selected panel and neutralizes the removed panel", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs value="a">
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab-panel name="a">Old panel</fluid-tab-panel>
      </fluid-tabs>
    `);
    const tab = el.querySelector<HTMLElement>("fluid-tab")!;
    const removed = el.querySelector<HTMLElement>("fluid-tab-panel")!;
    const replacement = document.createElement("fluid-tab-panel") as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    replacement.setAttribute("name", "a");
    replacement.textContent = "New panel";

    removed.replaceWith(replacement);
    await replacement.updateComplete;
    await aTimeout(0);

    expect(replacement.hasAttribute("active")).to.be.true;
    expect(replacement.hasAttribute("hidden")).to.be.false;
    expect(replacement.getAttribute("aria-labelledby")).to.equal(tab.id);
    expect(removed.hasAttribute("active")).to.be.false;
    expect(removed.hasAttribute("hidden")).to.be.true;
  });

  it("restores the default panel tab stop after an authored tabindex is removed", async () => {
    const panel = await fixture<HTMLElement & { updateComplete: Promise<unknown> }>(
      html`<fluid-tab-panel tabindex="-1">Managed focus</fluid-tab-panel>`
    );
    expect(panel.tabIndex).to.equal(-1);

    panel.removeAttribute("tabindex");
    await aTimeout(0);

    expect(panel.tabIndex).to.equal(0);
  });

  it("preserves selection and rebuilds ARIA after paired reorder and reconnect", async () => {
    const el = await fixture<FluidTabs>(html`
      <fluid-tabs value="b">
        <fluid-tab slot="nav" panel="a">A</fluid-tab>
        <fluid-tab slot="nav" panel="b">B</fluid-tab>
        <fluid-tab-panel name="a">A panel</fluid-tab-panel>
        <fluid-tab-panel name="b">B panel</fluid-tab-panel>
      </fluid-tabs>
    `);
    const tab = el.querySelector<HTMLElement>('fluid-tab[panel="b"]')!;
    const panel = el.querySelector<HTMLElement>('fluid-tab-panel[name="b"]')!;
    el.prepend(panel);
    el.prepend(tab);
    el.remove();
    document.body.append(el);
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("b");
    expect(tab.getAttribute("aria-selected")).to.equal("true");
    expect(tab.getAttribute("aria-controls")).to.equal(panel.id);
    expect(panel.getAttribute("aria-labelledby")).to.equal(tab.id);
    expect(panel.hasAttribute("hidden")).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTabs>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("makes text panels focusable while preserving an explicit consumer tabindex", async () => {
    const el = await fixture<FluidTabs>(sample);
    const panels = el.querySelectorAll("fluid-tab-panel");
    expect(panels[0]!.tabIndex).to.equal(0);
    panels[0]!.focus();
    expect(document.activeElement).to.equal(panels[0]);
    const custom = await fixture<HTMLElement>(
      html`<fluid-tab-panel tabindex="-1">Managed focus</fluid-tab-panel>`
    );
    expect(custom.tabIndex).to.equal(-1);
  });

  it("manual arrows advance from focus without changing selection", async () => {
    const el = await fixture<FluidTabs>(sample);
    el.activation = "manual";
    await el.updateComplete;
    const tabs = [...el.querySelectorAll("fluid-tab")];
    let changes = 0;
    el.addEventListener("fluid-change", () => changes++);
    tabs[0]!.focus();
    for (const index of [1, 2, 0]) {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true })
      );
      await el.updateComplete;
      expect(document.activeElement).to.equal(tabs[index]);
      expect(el.value).to.equal("overview");
      expect(tabs.map((tab) => tab.tabIndex)).to.deep.equal(
        tabs.map((_, i) => (i === index ? 0 : -1))
      );
    }
    expect(changes).to.equal(0);
  });

  it("does not capture arrow keys from panel inputs", async () => {
    const el = await fixture<FluidTabs>(sample);
    const input = document.createElement("input");
    el.querySelector("fluid-tab-panel")!.append(input);
    input.focus();
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      composed: true,
      cancelable: true
    });
    input.dispatchEvent(event);
    await el.updateComplete;
    expect(event.defaultPrevented).to.be.false;
    expect(document.activeElement).to.equal(input);
    expect(el.value).to.equal("overview");
  });

  it("manual activation works inside an outer shadow root and prevents Space scrolling", async () => {
    const outer = await fixture<HTMLElement>(html`<div></div>`);
    const root = outer.attachShadow({ mode: "open" });
    root.innerHTML = `<fluid-tabs activation="manual" value="one">
      <fluid-tab slot="nav" panel="one">One</fluid-tab><fluid-tab slot="nav" panel="two">Two</fluid-tab>
      <fluid-tab-panel name="one">First</fluid-tab-panel><fluid-tab-panel name="two">Second</fluid-tab-panel>
    </fluid-tabs>`;
    const el = root.querySelector<FluidTabs>("fluid-tabs")!;
    await el.updateComplete;
    const tab = el.querySelectorAll("fluid-tab")[1]!;
    tab.focus();
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      composed: true,
      cancelable: true
    });
    tab.dispatchEvent(event);
    await el.updateComplete;
    expect(event.defaultPrevented).to.be.true;
    expect(el.value).to.equal("two");
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
