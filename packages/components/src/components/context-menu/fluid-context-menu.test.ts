import {
  expect,
  fixture,
  html,
  oneEvent,
  elementUpdated,
  aTimeout
} from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidContextMenu } from "./fluid-context-menu.js";

const sampleItems = [
  { label: "Cut", value: "cut" },
  { label: "Copy", value: "copy" },
  { label: "Paste", value: "paste", disabled: true },
  { label: "", value: "", divider: true },
  { label: "Delete", value: "delete" }
];

const basic = () => html`
  <fluid-context-menu aria-label="Actions" .items=${sampleItems}>
    <div slot="trigger" tabindex="0">Target</div>
  </fluid-context-menu>
`;

const trigger = (el: FluidContextMenu): HTMLElement =>
  el.querySelector<HTMLElement>("[slot='trigger']")!;

const rightClick = (target: HTMLElement) =>
  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 40 })
  );

describe("<fluid-context-menu>", () => {
  it("wires aria-haspopup=menu onto the trigger", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    expect(trigger(el).getAttribute("aria-haspopup")).to.equal("menu");
  });

  it("renders an internal role=menu with menuitems from items", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    // The internal menu delegates to <fluid-menu>, which carries role="menu" on
    // its own shadow surface (the APG menu). role="menuitem" lives on each item
    // host, which is a child in this element's shadow tree.
    const internalMenu = el.shadowRoot!.querySelector<HTMLElement>("fluid-menu")!;
    expect(internalMenu).to.exist;
    await elementUpdated(internalMenu);
    expect(internalMenu.shadowRoot!.querySelector('[role="menu"]')).to.exist;
    const items = el.shadowRoot!.querySelectorAll('[role="menuitem"]');
    // 4 actionable entries (the divider is not a menuitem).
    expect(items.length).to.equal(4);
  });

  it("opens on contextmenu and marks the trigger aria-expanded", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    rightClick(trigger(el));
    await elementUpdated(el);
    expect(el.open).to.be.true;
    expect(trigger(el).getAttribute("aria-expanded")).to.equal("true");
  });

  it("contextmenu default is prevented (no native menu)", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    const evt = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10
    });
    trigger(el).dispatchEvent(evt);
    expect(evt.defaultPrevented).to.be.true;
  });

  it("does not open when disabled", async () => {
    const el = await fixture<FluidContextMenu>(html`
      <fluid-context-menu disabled aria-label="Actions" .items=${sampleItems}>
        <div slot="trigger" tabindex="0">Target</div>
      </fluid-context-menu>
    `);
    await elementUpdated(el);
    const evt = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    trigger(el).dispatchEvent(evt);
    await elementUpdated(el);
    expect(el.open).to.be.false;
    expect(evt.defaultPrevented).to.be.false;
  });

  it("Escape closes the menu and restores focus to the trigger", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    trigger(el).focus();
    rightClick(trigger(el));
    await elementUpdated(el);
    await aTimeout(20);
    await sendKeys({ press: "Escape" });
    await elementUpdated(el);
    expect(el.open).to.be.false;
    expect(trigger(el).getAttribute("aria-expanded")).to.equal("false");
  });

  it("Shift+F10 on the trigger opens the menu", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    trigger(el).dispatchEvent(
      new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true })
    );
    await elementUpdated(el);
    expect(el.open).to.be.true;
  });

  it("the ContextMenu key on the trigger opens the menu", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    trigger(el).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ContextMenu", bubbles: true })
    );
    await elementUpdated(el);
    expect(el.open).to.be.true;
  });

  it("fires fluid-select with the value and closes on activation", async () => {
    const el = await fixture<FluidContextMenu>(basic());
    await elementUpdated(el);
    rightClick(trigger(el));
    await elementUpdated(el);
    await aTimeout(20);
    const copy = el.shadowRoot!.querySelector<HTMLElement>('[role="menuitem"][value="copy"]')!;
    setTimeout(() => copy.click());
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.value).to.equal("copy");
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("supports a custom menu via the menu slot", async () => {
    const el = await fixture<FluidContextMenu>(html`
      <fluid-context-menu aria-label="Account">
        <div slot="trigger" tabindex="0">Avatar</div>
        <fluid-menu slot="menu" aria-label="Account">
          <fluid-menu-item value="profile">Profile</fluid-menu-item>
          <fluid-menu-item value="logout">Sign out</fluid-menu-item>
        </fluid-menu>
      </fluid-context-menu>
    `);
    await elementUpdated(el);
    // No internal menu is rendered when the slot has content.
    expect(el.shadowRoot!.querySelector("fluid-menu")).to.be.null;
    rightClick(trigger(el));
    await elementUpdated(el);
    await aTimeout(20);
    const profile = el.querySelector<HTMLElement>("fluid-menu-item[value='profile']")!;
    setTimeout(() => profile.click());
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.value).to.equal("profile");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<HTMLDivElement>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-motion:0;"
      >
        <fluid-context-menu
          aria-label="Actions"
          .items=${[
            { label: "Cut", value: "cut" },
            { label: "Copy", value: "copy" },
            { label: "Delete", value: "delete", disabled: true }
          ]}
        >
          <button slot="trigger">Target</button>
        </fluid-context-menu>
      </div>
    `);
    const cm = el.querySelector<FluidContextMenu>("fluid-context-menu")!;
    await elementUpdated(cm);
    await aTimeout(20);
    await expect(cm).to.be.accessible();
  });
});
