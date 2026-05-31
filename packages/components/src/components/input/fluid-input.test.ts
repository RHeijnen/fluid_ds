import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidInput } from "./fluid-input.js";

describe("<fluid-input>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    expect(el.type).to.equal("text");
    expect(el.size).to.equal("md");
    expect(el.value).to.equal("");
  });

  it("propagates value to the internal input", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input value="hello"></fluid-input>`);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.value).to.equal("hello");
  });

  it("fires fluid-input on user typing", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    el.focus();
    setTimeout(() => sendKeys({ type: "abc" }));
    const event = await oneEvent(el, "fluid-input");
    expect(event).to.exist;
    expect((event as CustomEvent).detail.value).to.equal("a");
  });

  it("fires fluid-change on blur after edit", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "modified";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    const event = await oneEvent(el, "fluid-change");
    expect((event as CustomEvent).detail.value).to.equal("modified");
  });

  it("participates in form submission", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-input name="username" value="alice"></fluid-input>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("username")).to.equal("alice");
  });

  it("respects disabled", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input disabled></fluid-input>`);
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.disabled).to.be.true;
  });

  it("reports invalid when required and empty", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input required></fluid-input>`);
    await el.updateComplete;
    // Trigger validity refresh by blurring
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("becomes valid once a value is set", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input required></fluid-input>`);
    el.value = "filled";
    await el.updateComplete;
    expect(el.checkValidity()).to.be.true;
  });

  it("setCustomValidity sets and clears the message", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input value="x"></fluid-input>`);
    el.setCustomValidity("Nope");
    expect(el.checkValidity()).to.be.false;
    expect(el.validationMessage).to.equal("Nope");
    el.setCustomValidity("");
    expect(el.checkValidity()).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input aria-label="Username" placeholder="Enter your name"></fluid-input>`
    );
    await expect(el).to.be.accessible();
  });

  /* Rework: override-ladder tokens, danger tone, AAA target floor. */

  it("styled properties read the --fluid-input-* override ladder", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="x"></fluid-input>`);
    el.style.setProperty("--fluid-input-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("invalid border uses the danger TOKEN, not a hard-coded red", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input required aria-label="x"></fluid-input>`);
    // Prove it reads the token: a custom danger value must flow through.
    el.style.setProperty("--fluid-danger-base", "rgb(10, 20, 30)");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.classList.contains("invalid")).to.be.true;
    expect(getComputedStyle(base).borderColor).to.equal("rgb(10, 20, 30)");
  });

  it("min height respects --fluid-target-min as a floor (AAA scaling)", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input size="sm" aria-label="x"></fluid-input>`
    );
    el.style.setProperty("--fluid-target-min", "60px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });

  it("prefix affix fills the full field height (not the slotted element's height)", async () => {
    const el = await fixture<FluidInput>(html`
      <fluid-input aria-label="x">
        <span slot="prefix" style="height: 8px;">@</span>
      </fluid-input>
    `);
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    // The affix box stretches to the field height regardless of the slotted
    // element's tiny 8px height (the bug: it used to collapse + top-align).
    expect(prefix.getBoundingClientRect().height).to.be.closeTo(
      base.getBoundingClientRect().height,
      1.5
    );
  });

  it("affix boxes are hidden until their slot has content", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="x"></fluid-input>`);
    await el.updateComplete;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    expect(prefix.hasAttribute("hidden")).to.be.true;
  });

  it("always exposes aria-invalid on the inner input", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="x"></fluid-input>`);
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-invalid")).to.equal(
      "false"
    );
  });
});
