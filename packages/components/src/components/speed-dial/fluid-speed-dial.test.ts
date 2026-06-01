import { expect, fixture, html, oneEvent, aTimeout, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidSpeedDial } from "./fluid-speed-dial.js";

const actions = html`
  <button class="a1">Share</button>
  <button class="a2" disabled>Edit</button>
  <button class="a3">Delete</button>
`;

function trigger(el: FluidSpeedDial): HTMLButtonElement {
  return el.shadowRoot!.querySelector<HTMLButtonElement>(".trigger")!;
}

describe("<fluid-speed-dial>", () => {
  it("renders closed by default", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    expect(el.open).to.be.false;
    expect(trigger(el).getAttribute("aria-expanded")).to.equal("false");
    expect(trigger(el).getAttribute("aria-haspopup")).to.equal("menu");
  });

  it("the trigger carries the label as its accessible name", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Quick actions">${actions}</fluid-speed-dial>
    `);
    expect(trigger(el).getAttribute("aria-label")).to.equal("Quick actions");
  });

  it("the menu has role=menu and slotted actions become menuitems", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    const menu = el.shadowRoot!.querySelector(".menu")!;
    expect(menu.getAttribute("role")).to.equal("menu");
    await elementUpdated(el);
    expect(el.querySelector(".a1")!.getAttribute("role")).to.equal("menuitem");
  });

  it("opens on click and reflects open + aria-expanded", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    trigger(el).click();
    await elementUpdated(el);
    expect(el.open).to.be.true;
    expect(el.hasAttribute("open")).to.be.true;
    expect(trigger(el).getAttribute("aria-expanded")).to.equal("true");
  });

  it("fires fluid-open when opening and fluid-close when closing", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    setTimeout(() => trigger(el).click());
    await oneEvent(el, "fluid-open");
    setTimeout(() => trigger(el).click());
    await oneEvent(el, "fluid-close");
    expect(el.open).to.be.false;
  });

  it("keyboard: ArrowUp on the trigger opens (placement=up) and focuses the last action", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.focus();
    trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.open).to.be.true;
    // Last enabled action is .a3 (.a2 is disabled).
    expect(document.activeElement).to.equal(el.querySelector(".a3"));
  });

  it("keyboard: Enter on the trigger opens and focuses the first action", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.focus();
    trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.open).to.be.true;
    expect(document.activeElement).to.equal(el.querySelector(".a1"));
  });

  it("arrow keys move between actions, skipping disabled ones", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.focus();
    trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(document.activeElement).to.equal(el.querySelector(".a1"));
    const menu = el.shadowRoot!.querySelector(".menu")!;
    // ArrowDown is the forward key on a vertical (up) dial: a1 -> a3 (skip a2).
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(document.activeElement).to.equal(el.querySelector(".a3"));
  });

  it("Escape closes and returns focus to the trigger", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.focus();
    trigger(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    const menu = el.shadowRoot!.querySelector(".menu")!;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.activeElement).to.equal(trigger(el));
  });

  it("clicking an action fires fluid-action and closes the dial", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.open = true;
    await elementUpdated(el);
    const share = el.querySelector<HTMLButtonElement>(".a1")!;
    setTimeout(() => share.click());
    const event = (await oneEvent(el, "fluid-action")) as CustomEvent;
    expect(event.detail.action).to.equal(share);
    expect(el.open).to.be.false;
  });

  it("clicking a disabled action does nothing", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="up">${actions}</fluid-speed-dial>
    `);
    el.open = true;
    await elementUpdated(el);
    let fired = false;
    el.addEventListener("fluid-action", () => (fired = true));
    el.querySelector<HTMLButtonElement>(".a2")!.click();
    await elementUpdated(el);
    expect(fired).to.be.false;
    expect(el.open).to.be.true;
  });

  it("closes when clicking outside", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div>
        <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
        <span class="outside">outside</span>
      </div>
    `);
    const el = wrapper.querySelector<FluidSpeedDial>("fluid-speed-dial")!;
    el.open = true;
    await elementUpdated(el);
    wrapper
      .querySelector<HTMLElement>(".outside")!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("placement reflects to an attribute", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions" placement="right">${actions}</fluid-speed-dial>
    `);
    expect(el.getAttribute("placement")).to.equal("right");
  });

  it("trigger min size respects --fluid-target-min (AAA scaling)", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    el.style.setProperty("--fluid-target-min", "60px");
    await elementUpdated(el);
    const rect = trigger(el).getBoundingClientRect();
    expect(rect.width).to.be.greaterThanOrEqual(60);
    expect(rect.height).to.be.greaterThanOrEqual(60);
  });

  it("trigger background reads the --fluid-speed-dial-bg override ladder", async () => {
    const el = await fixture<FluidSpeedDial>(html`
      <fluid-speed-dial label="Actions">${actions}</fluid-speed-dial>
    `);
    el.style.setProperty("--fluid-speed-dial-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    expect(getComputedStyle(trigger(el)).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("passes a11y audit (open)", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-motion:0;
        "
      >
        <fluid-speed-dial label="Quick actions" open placement="up">
          <button class="a1">Share</button>
          <button class="a3">Delete</button>
        </fluid-speed-dial>
      </div>
    `);
    const el = wrapper.querySelector<FluidSpeedDial>("fluid-speed-dial")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
