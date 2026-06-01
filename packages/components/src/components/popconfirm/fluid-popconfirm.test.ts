import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../button/define.js";
import type { FluidPopconfirm } from "./fluid-popconfirm.js";

const TOKENS =
  "--fluid-surface-base:#ffffff;--fluid-surface-muted:#f4f4f5;" +
  "--fluid-text-primary:#18181b;--fluid-text-secondary:#3f3f46;" +
  "--fluid-border-default:#e4e4e7;--fluid-accent-base:#4f46e5;--fluid-accent-text:#ffffff;" +
  "--fluid-success-base:#16a34a;--fluid-success-text:#ffffff;" +
  "--fluid-danger-base:#dc2626;--fluid-danger-text:#ffffff;--fluid-warning-base:#d97706;" +
  "--fluid-motion:0;";

async function open(el: FluidPopconfirm): Promise<void> {
  const trigger = el.querySelector("fluid-button")!;
  (trigger as HTMLElement).click();
  await elementUpdated(el);
  await aTimeout(20);
}

describe("<fluid-popconfirm>", () => {
  it("is closed by default", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    expect(el.open).to.be.false;
  });

  it("uses role=alertdialog with aria-modal and aria-describedby", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm message="Sure?"><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    const panel = el.shadowRoot!.querySelector(".panel")!;
    expect(panel.getAttribute("role")).to.equal("alertdialog");
    expect(panel.getAttribute("aria-modal")).to.equal("true");
    const describedby = panel.getAttribute("aria-describedby");
    expect(describedby).to.be.a("string");
    const msg = el.shadowRoot!.querySelector(`#${describedby}`);
    expect(msg?.textContent?.trim()).to.equal("Sure?");
  });

  it("opens on trigger activation and sets aria-expanded", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    await open(el);
    expect(el.open).to.be.true;
    expect(el.querySelector("fluid-button")!.getAttribute("aria-expanded")).to.equal("true");
  });

  it("fires fluid-confirm and closes when confirm is clicked", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    await open(el);
    const confirm = el.shadowRoot!.querySelector<HTMLElement>(".confirm")!;
    setTimeout(() => confirm.click());
    await oneEvent(el, "fluid-confirm");
    expect(el.open).to.be.false;
  });

  it("fires fluid-cancel and closes when cancel is clicked", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    await open(el);
    const cancel = el.shadowRoot!.querySelector<HTMLElement>(".cancel")!;
    setTimeout(() => cancel.click());
    await oneEvent(el, "fluid-cancel");
    expect(el.open).to.be.false;
  });

  it("cancels on Escape", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    await open(el);
    setTimeout(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    );
    await oneEvent(el, "fluid-cancel");
    expect(el.open).to.be.false;
  });

  it("does not open when disabled", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm disabled><fluid-button slot="trigger">X</fluid-button></fluid-popconfirm>
    `);
    await open(el);
    expect(el.open).to.be.false;
  });

  it("reflects custom labels onto the buttons", async () => {
    const el = await fixture<FluidPopconfirm>(html`
      <fluid-popconfirm confirm-text="Yep" cancel-text="Nope">
        <fluid-button slot="trigger">X</fluid-button>
      </fluid-popconfirm>
    `);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".confirm")!.textContent?.trim()).to.equal("Yep");
    expect(el.shadowRoot!.querySelector(".cancel")!.textContent?.trim()).to.equal("Nope");
  });

  it("passes a11y audit when open", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div style=${TOKENS}>
        <fluid-popconfirm message="Delete this?" confirm-text="Delete">
          <fluid-button slot="trigger" variant="secondary" tone="danger">Delete</fluid-button>
        </fluid-popconfirm>
      </div>
    `);
    const el = wrapper.querySelector<FluidPopconfirm>("fluid-popconfirm")!;
    await open(el);
    await expect(el).to.be.accessible();
  });
});
