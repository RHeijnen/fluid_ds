import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidHotkey } from "./fluid-hotkey.js";

/** Dispatch a keydown on window with the given init. */
function pressKey(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...init });
  window.dispatchEvent(event);
  return event;
}

describe("<fluid-hotkey>", () => {
  it("renders nothing visible", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="mod+k"></fluid-hotkey>`);
    expect(getComputedStyle(el).display).to.equal("none");
  });

  it("fires fluid-hotkey on a matching ctrl chord", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`);
    setTimeout(() => pressKey({ key: "k", ctrlKey: true }));
    const event = await oneEvent(el, "fluid-hotkey");
    expect(event).to.exist;
    expect(event.detail.keys).to.equal("ctrl+k");
    expect(event.detail.event).to.be.instanceOf(KeyboardEvent);
  });

  it("does not fire when modifiers do not match", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`);
    let fired = false;
    el.addEventListener("fluid-hotkey", () => (fired = true));
    pressKey({ key: "k" });
    expect(fired).to.be.false;
  });

  it("does not fire an extra-modifier superset of the chord", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`);
    let fired = false;
    el.addEventListener("fluid-hotkey", () => (fired = true));
    pressKey({ key: "k", ctrlKey: true, altKey: true });
    expect(fired).to.be.false;
  });

  it("matches a shifted character like shift+?", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="shift+?"></fluid-hotkey>`);
    setTimeout(() => pressKey({ key: "?", shiftKey: true }));
    const event = await oneEvent(el, "fluid-hotkey");
    expect(event).to.exist;
  });

  it("fires only after a full sequence", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="g h"></fluid-hotkey>`);
    let fired = false;
    el.addEventListener("fluid-hotkey", () => (fired = true));
    pressKey({ key: "g" });
    expect(fired).to.be.false;
    pressKey({ key: "h" });
    expect(fired).to.be.true;
  });

  it("ignores shortcuts while focus is in an input by default", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-hotkey keys="ctrl+k"></fluid-hotkey>
        <input type="text" />
      </div>
    `);
    let fired = false;
    wrapper.querySelector("fluid-hotkey")!.addEventListener("fluid-hotkey", () => (fired = true));
    const input = wrapper.querySelector("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    expect(fired).to.be.false;
  });

  it("fires inside an input when when-input is set", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-hotkey keys="ctrl+k" when-input></fluid-hotkey>
        <input type="text" />
      </div>
    `);
    let fired = false;
    wrapper.querySelector("fluid-hotkey")!.addEventListener("fluid-hotkey", () => (fired = true));
    const input = wrapper.querySelector("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    expect(fired).to.be.true;
  });

  it("calls preventDefault on a match when prevent-default is set", async () => {
    await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k" prevent-default></fluid-hotkey>`);
    const event = pressKey({ key: "k", ctrlKey: true, cancelable: true });
    expect(event.defaultPrevented).to.be.true;
  });

  it("stops firing after disconnect", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`);
    let fired = false;
    el.addEventListener("fluid-hotkey", () => (fired = true));
    el.remove();
    pressKey({ key: "k", ctrlKey: true });
    expect(fired).to.be.false;
  });

  it("re-parses when keys changes", async () => {
    const el = await fixture<FluidHotkey>(html`<fluid-hotkey keys="ctrl+k"></fluid-hotkey>`);
    el.keys = "ctrl+j";
    await elementUpdated(el);
    let fired = false;
    el.addEventListener("fluid-hotkey", () => (fired = true));
    pressKey({ key: "k", ctrlKey: true });
    expect(fired).to.be.false;
    pressKey({ key: "j", ctrlKey: true });
    expect(fired).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidHotkey>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-text-primary:#18181b; --fluid-border-default:#e4e4e7;"
      >
        <fluid-hotkey keys="mod+k"></fluid-hotkey>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
