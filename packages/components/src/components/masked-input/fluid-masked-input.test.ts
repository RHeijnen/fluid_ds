import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidMaskedInput } from "./fluid-masked-input.js";

/** Simulate the user typing `text` into the inner input one character at a
 * time, replaying the browser's insert-at-caret behavior so the formatter and
 * caret logic run exactly as they would for real keystrokes. */
async function type(el: FluidMaskedInput, text: string): Promise<void> {
  const input = el.shadowRoot!.querySelector("input")!;
  for (const ch of text) {
    const caret = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, caret) + ch + input.value.slice(caret);
    input.setSelectionRange(caret + 1, caret + 1);
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await elementUpdated(el);
  }
}

describe("<fluid-masked-input>", () => {
  it("renders with defaults", async () => {
    const el = await fixture<FluidMaskedInput>(html`<fluid-masked-input></fluid-masked-input>`);
    expect(el.size).to.equal("md");
    expect(el.value).to.equal("");
    expect(el.mask).to.equal("");
  });

  it("formats input against the mask as the user types", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    await type(el, "5551234567");
    expect(el.value).to.equal("(555) 123-4567");
  });

  it("exposes the raw characters as unmaskedValue", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    await type(el, "5551234567");
    expect(el.unmaskedValue).to.equal("5551234567");
  });

  it("only accepts characters matching the next placeholder token", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="Digits"></fluid-masked-input>`
    );
    await type(el, "1a2b3");
    expect(el.value).to.equal("123");
    expect(el.unmaskedValue).to.equal("123");
  });

  it("supports letter (A) and alphanumeric (*) tokens", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="AA-*#" aria-label="Code"></fluid-masked-input>`
    );
    await type(el, "ab9c5");
    // AA consumes a,b; literal "-" auto-inserted; * takes 9; # takes 5. "c"
    // was offered to # which rejects a letter, so it is dropped.
    expect(el.value).to.equal("ab-95");
  });

  it("normalizes a programmatically set value against the mask", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>`
    );
    el.value = "5551234567";
    await elementUpdated(el);
    expect(el.value).to.equal("(555) 123-4567");
  });

  it("fires fluid-input with formatted + unmasked detail", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="##/##" aria-label="Expiry"></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "12";
    setTimeout(() => input.dispatchEvent(new InputEvent("input", { bubbles: true })));
    const event = await oneEvent(el, "fluid-input");
    expect((event as CustomEvent).detail.value).to.equal("12/");
    expect((event as CustomEvent).detail.unmaskedValue).to.equal("12");
  });

  it("fires fluid-change on blur after edit", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="####" aria-label="Pin"></fluid-masked-input>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "1234";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    const event = await oneEvent(el, "fluid-change");
    expect((event as CustomEvent).detail.value).to.equal("1234");
  });

  it("submits the formatted string as the form value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-masked-input name="phone" mask="(###) ###-####" value="5551234567">
        </fluid-masked-input>
      </form>
    `);
    await elementUpdated(form.querySelector("fluid-masked-input")!);
    const data = new FormData(form);
    expect(data.get("phone")).to.equal("(555) 123-4567");
  });

  it("respects disabled", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input disabled mask="###"></fluid-masked-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.disabled).to.be.true;
  });

  it("reports invalid when required and incomplete", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="(###) ###-####" aria-label="x"></fluid-masked-input>`
    );
    await type(el, "555");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("becomes valid once every placeholder is filled", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="##/##" aria-label="x"></fluid-masked-input>`
    );
    await type(el, "1225");
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.true;
  });

  it("derives a visual placeholder from the mask", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="##/##" aria-label="x"></fluid-masked-input>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("input")!.placeholder).to.equal("__/__");
  });

  it("styled properties read the --fluid-masked-input-* override ladder", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-masked-input-bg", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("invalid border uses the danger TOKEN, not a hard-coded red", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input required mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-danger-base", "rgb(10, 20, 30)");
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.classList.contains("invalid")).to.be.true;
    expect(getComputedStyle(base).borderColor).to.equal("rgb(10, 20, 30)");
  });

  it("min height respects --fluid-target-min as a floor (AAA scaling)", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input size="sm" mask="###" aria-label="x"></fluid-masked-input>`
    );
    el.style.setProperty("--fluid-target-min", "60px");
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });

  it("always exposes aria-invalid on the inner input", async () => {
    const el = await fixture<FluidMaskedInput>(
      html`<fluid-masked-input mask="###" aria-label="x"></fluid-masked-input>`
    );
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-invalid")).to.equal("false");
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-subtle:#f4f4f5; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-border-strong:#a1a1aa; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-danger-base:#dc2626; --fluid-danger-text:#ffffff;"
      >
        <fluid-masked-input
          mask="(###) ###-####"
          aria-label="Phone number"
        ></fluid-masked-input>
      </div>
    `);
    const el = wrapper.querySelector<FluidMaskedInput>("fluid-masked-input")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
