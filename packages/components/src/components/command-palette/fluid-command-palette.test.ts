import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidCommandPalette, FluidCommandItem } from "./fluid-command-palette.js";

const items: FluidCommandItem[] = [
  { id: "new", label: "New File", hint: "⌘N", group: "File" },
  { id: "open", label: "Open File", hint: "⌘O", group: "File" },
  { id: "copy", label: "Copy", group: "Edit" },
  { id: "toggle", label: "Toggle Theme", group: "View" }
];

async function open(el: FluidCommandPalette): Promise<void> {
  el.items = items;
  el.open = true;
  await elementUpdated(el);
}

function input(el: FluidCommandPalette): HTMLInputElement {
  return el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
}

function options(el: FluidCommandPalette): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>(".option"));
}

describe("<fluid-command-palette>", () => {
  it("renders nothing when closed", async () => {
    const el = await fixture<FluidCommandPalette>(
      html`<fluid-command-palette .items=${items}></fluid-command-palette>`
    );
    expect(el.open).to.be.false;
    expect(el.shadowRoot!.querySelector(".panel")).to.be.null;
  });

  it("renders a modal dialog when open", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    expect(dialog).to.exist;
    expect(dialog.getAttribute("aria-modal")).to.equal("true");
  });

  it("fires fluid-open when opened", async () => {
    const el = await fixture<FluidCommandPalette>(
      html`<fluid-command-palette .items=${items}></fluid-command-palette>`
    );
    setTimeout(() => (el.open = true));
    const event = await oneEvent(el, "fluid-open");
    expect(event).to.exist;
  });

  it("the input has the combobox contract", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    expect(combobox.getAttribute("role")).to.equal("combobox");
    expect(combobox.getAttribute("aria-expanded")).to.equal("true");
    const listboxId = el.shadowRoot!.querySelector('[role="listbox"]')!.id;
    expect(combobox.getAttribute("aria-controls")).to.equal(listboxId);
  });

  it("filters items by substring as the query changes", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    combobox.value = "file";
    combobox.dispatchEvent(new Event("input"));
    await elementUpdated(el);
    const labels = options(el).map((o) => o.querySelector(".label")!.textContent!.trim());
    expect(labels).to.deep.equal(["New File", "Open File"]);
  });

  it("shows the empty state when nothing matches", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    combobox.value = "zzzz";
    combobox.dispatchEvent(new Event("input"));
    await elementUpdated(el);
    expect(options(el).length).to.equal(0);
    expect(el.shadowRoot!.querySelector(".empty")).to.exist;
    expect(combobox.getAttribute("aria-expanded")).to.equal("false");
  });

  it("ArrowDown / ArrowUp move the active option via aria-activedescendant", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    const opts = options(el);
    expect(opts[0]!.getAttribute("aria-selected")).to.equal("true");
    expect(combobox.getAttribute("aria-activedescendant")).to.equal(opts[0]!.id);

    combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(options(el)[1]!.getAttribute("aria-selected")).to.equal("true");
    expect(combobox.getAttribute("aria-activedescendant")).to.equal(options(el)[1]!.id);

    combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await elementUpdated(el);
    expect(options(el)[0]!.getAttribute("aria-selected")).to.equal("true");
  });

  it("ArrowUp from the top wraps to the last option", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await elementUpdated(el);
    const opts = options(el);
    expect(opts[opts.length - 1]!.getAttribute("aria-selected")).to.equal("true");
  });

  it("Enter fires fluid-select with { id, item } and closes", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    setTimeout(() =>
      combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.id).to.equal("open");
    expect(event.detail.item.label).to.equal("Open File");
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("clicking an option fires fluid-select for that item", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    setTimeout(() => options(el)[2]!.click());
    const event = await oneEvent(el, "fluid-select");
    expect(event.detail.id).to.equal("copy");
  });

  it("Escape closes the palette and fires fluid-close", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    const combobox = input(el);
    setTimeout(() =>
      combobox.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const event = await oneEvent(el, "fluid-close");
    expect(event).to.exist;
    await elementUpdated(el);
    expect(el.open).to.be.false;
  });

  it("reflects the open attribute", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    el.show();
    await elementUpdated(el);
    expect(el.hasAttribute("open")).to.be.true;
    el.hide();
    await elementUpdated(el);
    expect(el.hasAttribute("open")).to.be.false;
  });

  it("moves focus to the input on open", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    await el.updateComplete;
    await aTimeout(20);
    expect(el.shadowRoot!.activeElement).to.equal(input(el));
  });

  it("option rows respect --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    el.style.setProperty("--fluid-target-min", "44px");
    await elementUpdated(el);
    const row = options(el)[0]!;
    expect(row.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  it("active option background reads the override ladder", async () => {
    const el = await fixture<FluidCommandPalette>(html`<fluid-command-palette></fluid-command-palette>`);
    await open(el);
    el.style.setProperty("--fluid-command-palette-active-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const active = options(el).find((o) => o.getAttribute("aria-selected") === "true")!;
    expect(getComputedStyle(active).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("is accessible", async () => {
    const el = await fixture<FluidCommandPalette>(html`
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
        <fluid-command-palette open .items=${items}></fluid-command-palette>
      </div>
    `);
    const palette = el.querySelector<FluidCommandPalette>("fluid-command-palette")!;
    await elementUpdated(palette);
    await aTimeout(20);
    await expect(palette).to.be.accessible();
  });
});
