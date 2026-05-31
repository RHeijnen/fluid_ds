import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidTextarea } from "./fluid-textarea.js";

describe("<fluid-textarea>", () => {
  it("renders empty by default", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="x"></fluid-textarea>`
    );
    expect(el.value).to.equal("");
  });

  it("syncs value to the inner textarea", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="x" value="hello"></fluid-textarea>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("textarea")!.value).to.equal("hello");
  });

  it("fires fluid-input on typing", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="x"></fluid-textarea>`
    );
    const ta = el.shadowRoot!.querySelector("textarea")!;
    ta.value = "abc";
    setTimeout(() => ta.dispatchEvent(new Event("input", { bubbles: true })));
    const event = (await oneEvent(el, "fluid-input")) as CustomEvent;
    expect(event.detail.value).to.equal("abc");
  });

  it("submits with a form", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-textarea name="comment" value="hello" aria-label="x"></fluid-textarea>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("comment")).to.equal("hello");
  });

  it("shows the character counter when maxlength is set", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea aria-label="x" maxlength="10" value="hi"></fluid-textarea>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".counter")!.textContent?.trim()).to.equal("2/10");
  });

  it("counter shows 'over' state at the limit", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea aria-label="x" maxlength="3" value="abc"></fluid-textarea>
    `);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".counter")!.classList.contains("over")).to.be.true;
  });

  it("reports invalid when required and empty", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea aria-label="x" required></fluid-textarea>
    `);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea aria-label="Comment" placeholder="Type here…"></fluid-textarea>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + danger/warning tone tokens. */

  it("styled properties read the --fluid-textarea-* override ladder", async () => {
    const el = await fixture<FluidTextarea>(html`<fluid-textarea aria-label="x"></fluid-textarea>`);
    el.style.setProperty("--fluid-textarea-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("invalid border uses the danger TOKEN, not a hard-coded red", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea required aria-label="x"></fluid-textarea>`
    );
    el.style.setProperty("--fluid-danger-base", "rgb(10, 20, 30)");
    el.shadowRoot!.querySelector("textarea")!.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.classList.contains("invalid")).to.be.true;
    expect(getComputedStyle(base).borderColor).to.equal("rgb(10, 20, 30)");
  });

  it("counter over-limit uses the danger token", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="x" maxlength="3" value="abcd"></fluid-textarea>`
    );
    el.style.setProperty("--fluid-danger-base", "rgb(7, 8, 9)");
    await el.updateComplete;
    const counter = el.shadowRoot!.querySelector<HTMLElement>(".counter.over")!;
    expect(counter).to.exist;
    expect(getComputedStyle(counter).color).to.equal("rgb(7, 8, 9)");
  });
});
