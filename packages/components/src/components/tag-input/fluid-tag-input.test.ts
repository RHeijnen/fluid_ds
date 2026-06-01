import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidTagInput } from "./fluid-tag-input.js";

const input = (el: FluidTagInput): HTMLInputElement =>
  el.shadowRoot!.querySelector("input")!;

const chips = (el: FluidTagInput): NodeListOf<HTMLElement> =>
  el.shadowRoot!.querySelectorAll<HTMLElement>("fluid-tag");

describe("<fluid-tag-input>", () => {
  it("parses a comma-separated string attribute into the value array", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="react, lit ,ts"></fluid-tag-input>`
    );
    expect(el.value).to.eql(["react", "lit", "ts"]);
    expect(chips(el).length).to.equal(3);
  });

  it("renders each token as a removable fluid-tag chip", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b"></fluid-tag-input>`
    );
    const first = chips(el)[0]!;
    expect(first.hasAttribute("removable")).to.be.true;
    expect(first.textContent?.trim()).to.equal("a");
  });

  it("adds a token on Enter and clears the field", async () => {
    const el = await fixture<FluidTagInput>(html`<fluid-tag-input></fluid-tag-input>`);
    const field = input(el);
    field.focus();
    await sendKeys({ type: "hello" });
    setTimeout(() => sendKeys({ press: "Enter" }));
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.eql(["hello"]);
    await elementUpdated(el);
    expect(field.value).to.equal("");
  });

  it("adds a token on comma without leaving a comma in the field", async () => {
    const el = await fixture<FluidTagInput>(html`<fluid-tag-input></fluid-tag-input>`);
    const field = input(el);
    field.focus();
    await sendKeys({ type: "world" });
    setTimeout(() => sendKeys({ press: "," }));
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.eql(["world"]);
    await elementUpdated(el);
    expect(field.value).to.equal("");
  });

  it("removes the last token on Backspace when the field is empty", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b,c"></fluid-tag-input>`
    );
    input(el).focus();
    setTimeout(() => sendKeys({ press: "Backspace" }));
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.eql(["a", "b"]);
  });

  it("does not remove a token on Backspace when the field has text", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b"></fluid-tag-input>`
    );
    const field = input(el);
    field.focus();
    await sendKeys({ type: "x" });
    await sendKeys({ press: "Backspace" });
    await elementUpdated(el);
    expect(el.value).to.eql(["a", "b"]);
  });

  it("removes a token when its chip remove button fires fluid-remove", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b,c"></fluid-tag-input>`
    );
    const chip = chips(el)[1]!;
    const removeBtn = chip.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    setTimeout(() => removeBtn.click());
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.eql(["a", "c"]);
  });

  it("rejects duplicates by default", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a"></fluid-tag-input>`
    );
    input(el).focus();
    await sendKeys({ type: "a" });
    await sendKeys({ press: "Enter" });
    await elementUpdated(el);
    expect(el.value).to.eql(["a"]);
  });

  it("allows duplicates when allow-duplicates is set", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a" allow-duplicates></fluid-tag-input>`
    );
    input(el).focus();
    await sendKeys({ type: "a" });
    setTimeout(() => sendKeys({ press: "Enter" }));
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.eql(["a", "a"]);
  });

  it("stops accepting tokens at the max cap", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b" max="2"></fluid-tag-input>`
    );
    const field = input(el);
    expect(field.disabled).to.be.true;
  });

  it("does not add or remove tokens when disabled", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input value="a,b" disabled></fluid-tag-input>`
    );
    const chip = chips(el)[0]!;
    const removeBtn = chip.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    removeBtn.click();
    await elementUpdated(el);
    expect(el.value).to.eql(["a", "b"]);
  });

  it("submits the comma-joined string as its form value", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-tag-input name="tags" value="a,b"></fluid-tag-input>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("tags")).to.equal("a,b");
  });

  it("resets to its initial attribute value on form reset", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-tag-input name="tags" value="a,b"></fluid-tag-input>
      </form>
    `);
    const el = form.querySelector<FluidTagInput>("fluid-tag-input")!;
    el.value = ["a", "b", "c"];
    await elementUpdated(el);
    form.reset();
    await elementUpdated(el);
    expect(el.value).to.eql(["a", "b"]);
  });

  it("exposes role=group with the accessible name on the base part", async () => {
    const el = await fixture<FluidTagInput>(
      html`<fluid-tag-input aria-label="Tags" value="a"></fluid-tag-input>`
    );
    const group = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(group.getAttribute("role")).to.equal("group");
    expect(group.getAttribute("aria-label")).to.equal("Tags");
    expect(input(el).getAttribute("aria-label")).to.equal("Tags");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTagInput>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-subtle:#fafafa; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-border-strong:#a1a1aa; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-focus-ring-color:#4f46e5; --fluid-motion:0;"
      >
        <fluid-tag-input aria-label="Tags" value="react,lit"></fluid-tag-input>
      </div>
    `);
    const el2 = el.querySelector<FluidTagInput>("fluid-tag-input")!;
    await elementUpdated(el2);
    await aTimeout(20);
    await expect(el2).to.be.accessible();
  });
});
