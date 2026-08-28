import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidTextarea } from "./fluid-textarea.js";

describe("<fluid-textarea>", () => {
  it("platform focus reaches the textarea without the JavaScript focus override", async () => {
    const el = await fixture<FluidTextarea>(html`<fluid-textarea label="Notes"></fluid-textarea>`);
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("textarea"));
  });

  it("renders empty by default", async () => {
    const el = await fixture<FluidTextarea>(html`<fluid-textarea aria-label="x"></fluid-textarea>`);
    expect(el.value).to.equal("");
  });

  it("associates an optional visible label and help text", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea label="Notes" help-text="Keep this concise."></fluid-textarea>
    `);
    const label = el.shadowRoot!.querySelector<HTMLLabelElement>('[part="label"]')!;
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    const help = el.shadowRoot!.querySelector<HTMLElement>('[part="help-text"]')!;
    expect(label.htmlFor).to.equal("textarea");
    expect(label.textContent?.trim()).to.equal("Notes");
    expect(textarea.getAttribute("aria-describedby")).to.equal(help.id);
  });

  it("keeps an untouched required textarea visually neutral until blur or validation", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea required aria-label="Notes"></fluid-textarea>
    `);
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(el.validity.valueMissing).to.equal(true);
    expect(base.classList.contains("invalid")).to.equal(false);
    expect(textarea.getAttribute("aria-invalid")).to.equal("false");

    textarea.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(base.classList.contains("invalid")).to.equal(true);
    expect(textarea.getAttribute("aria-invalid")).to.equal("true");
  });

  it("syncs value to the inner textarea", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="x" value="hello"></fluid-textarea>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("textarea")!.value).to.equal("hello");
  });

  it("forwards its form name to the internal textarea for autofill metadata", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea name="comment" aria-label="Comment"></fluid-textarea>`
    );
    await el.updateComplete;
    const textarea = el.shadowRoot!.querySelector("textarea")!;
    expect(textarea.id).to.equal("textarea");
    expect(textarea.name).to.equal("comment");
    expect(textarea.hasAttribute("autocomplete")).to.equal(false);

    el.autocomplete = "street-address";
    await el.updateComplete;
    expect(textarea.getAttribute("autocomplete")).to.equal("street-address");
  });

  it("fires fluid-input on typing", async () => {
    const el = await fixture<FluidTextarea>(html`<fluid-textarea aria-label="x"></fluid-textarea>`);
    const ta = el.shadowRoot!.querySelector("textarea")!;
    ta.value = "abc";
    setTimeout(() => ta.dispatchEvent(new Event("input", { bubbles: true })));
    const event = (await oneEvent(el, "fluid-input")) as CustomEvent;
    expect(event.detail).to.deep.equal({ value: "abc" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
  });

  it("committed change preserves the full string payload and event flags", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="Notes"></fluid-textarea>`
    );
    const textarea = el.shadowRoot!.querySelector("textarea")!;
    textarea.value = "line one\nline two";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    const changed = oneEvent(el, "fluid-change");
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    const event = await changed;
    expect(event.detail).to.deep.equal({ value: "line one\nline two" });
    expect([event.bubbles, event.composed, event.cancelable]).to.deep.equal([true, true, false]);
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

  it("tracks live length limits after real user edits", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-textarea name="notes" minlength="3" maxlength="5" aria-label="Notes">
        </fluid-textarea>
      </form>
    `);
    const el = form.querySelector<FluidTextarea>("fluid-textarea")!;
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    textarea.focus();
    await sendKeys({ type: "ab" });
    textarea.blur();
    await el.updateComplete;
    expect(el.validity.tooShort).to.equal(true);
    expect(el.checkValidity()).to.equal(false);
    textarea.focus();
    await sendKeys({ type: "cde" });
    textarea.blur();
    await el.updateComplete;
    expect(el.value).to.equal("abcde");
    expect(el.checkValidity()).to.equal(true);
    expect(new FormData(form).get("notes")).to.equal("abcde");
    el.maxlength = 4;
    await el.updateComplete;
    expect(el.validity.tooLong).to.equal(true);
    expect(el.shadowRoot!.querySelector(".counter")!.textContent?.trim()).to.equal("5/4");
    el.maxlength = 6;
    await el.updateComplete;
    expect(el.checkValidity()).to.equal(true);
  });

  it("honors every supported native resize mode", async () => {
    const el = await fixture<FluidTextarea>(
      html`<fluid-textarea aria-label="Notes"></fluid-textarea>`
    );
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    for (const mode of ["none", "horizontal", "vertical", "both"] as const) {
      el.resize = mode;
      await el.updateComplete;
      expect(getComputedStyle(textarea).resize, mode).to.equal(mode);
    }
    el.resize = "auto";
    await el.updateComplete;
    expect(getComputedStyle(textarea).resize).to.equal("none");
  });

  it("auto-resizes in both directions after user input", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea resize="auto" aria-label="Notes"></fluid-textarea>
    `);
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    const initialHeight = textarea.getBoundingClientRect().height;
    textarea.value = Array.from({ length: 12 }, (_, index) => `Line ${index}`).join("\n");
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    await el.updateComplete;
    await new Promise(requestAnimationFrame);
    const grownHeight = textarea.getBoundingClientRect().height;
    expect(grownHeight).to.be.greaterThan(initialHeight);
    textarea.value = "Short";
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContent" }));
    await el.updateComplete;
    await new Promise(requestAnimationFrame);
    expect(textarea.getBoundingClientRect().height).to.be.lessThan(grownHeight);
  });

  it("contains long unbroken input in a narrow reflow container", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div style="width: 120px">
        <fluid-textarea value="${"x".repeat(200)}" aria-label="Notes"></fluid-textarea>
      </div>
    `);
    const el = wrapper.querySelector<FluidTextarea>("fluid-textarea")!;
    expect(el.getBoundingClientRect().right).to.be.at.most(
      wrapper.getBoundingClientRect().right + 1
    );
    expect(el.shadowRoot!.querySelector("textarea")!.getBoundingClientRect().right).to.be.at.most(
      wrapper.getBoundingClientRect().right + 1
    );
  });

  it("adopts detached edits when reconnected to a new form owner", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="first"><fluid-textarea name="notes" value="First"></fluid-textarea></form>
        <form id="second"></form>
      </div>
    `);
    const first = wrapper.querySelector<HTMLFormElement>("#first")!;
    const second = wrapper.querySelector<HTMLFormElement>("#second")!;
    const el = wrapper.querySelector<FluidTextarea>("fluid-textarea")!;
    const events: Event[] = [];
    el.addEventListener("fluid-input", (event) => events.push(event));
    el.addEventListener("fluid-change", (event) => events.push(event));
    el.remove();
    el.name = "comment";
    el.value = "Detached edit";
    second.append(el);
    await aTimeout(0);
    await el.updateComplete;
    expect(el.form).to.equal(second);
    expect(new FormData(first).has("notes")).to.equal(false);
    expect(new FormData(second).get("comment")).to.equal("Detached edit");
    expect(el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!.value).to.equal(
      "Detached edit"
    );
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("textarea"));
    expect(events).to.have.length(0);
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

  it("preserves authored disabled state through disabled fieldset ownership", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset>
          <fluid-textarea disabled aria-label="Authored disabled"></fluid-textarea>
          <fluid-textarea aria-label="Owner disabled only"></fluid-textarea>
        </fieldset>
      </form>
    `);
    const fieldset = form.querySelector("fieldset")!;
    const [authored, enabled] = form.querySelectorAll<FluidTextarea>("fluid-textarea");
    fieldset.disabled = true;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.true;
    fieldset.disabled = false;
    await aTimeout(0);
    expect(authored!.disabled).to.be.true;
    expect(authored!.shadowRoot!.querySelector("textarea")!.disabled).to.be.true;
    expect(enabled!.disabled).to.be.false;
    expect(enabled!.shadowRoot!.querySelector("textarea")!.disabled).to.be.false;
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

  it("uses Input typography by default and isolates size, spacing and disabled styling", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea
        size="sm"
        disabled
        aria-label="Notes"
        style="
          --fluid-font-family-sans: 'Textarea Sans';
          --fluid-textarea-font-size-sm: 13px;
          --fluid-textarea-line-height: 19px;
          --fluid-textarea-min-height: 91px;
          --fluid-textarea-padding-x-sm: 17px;
          --fluid-textarea-padding-y-sm: 9px;
          --fluid-textarea-disabled-bg: rgb(1, 2, 3);
          --fluid-textarea-disabled-fg: rgb(4, 5, 6);
          --fluid-textarea-disabled-opacity: 0.7;
        "
      ></fluid-textarea>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    expect(getComputedStyle(textarea).fontFamily).to.contain("Textarea Sans");
    expect(getComputedStyle(textarea).fontSize).to.equal("13px");
    expect(getComputedStyle(textarea).lineHeight).to.equal("19px");
    expect(getComputedStyle(textarea).paddingInlineStart).to.equal("17px");
    expect(getComputedStyle(textarea).paddingTop).to.equal("9px");
    expect(textarea.getBoundingClientRect().height).to.be.greaterThanOrEqual(91);
    expect(getComputedStyle(base).backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(getComputedStyle(base).color).to.equal("rgb(4, 5, 6)");
    expect(getComputedStyle(base).opacity).to.equal("0.7");
  });

  it("isolates counter typography and spacing", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea
        aria-label="Notes"
        maxlength="20"
        value="hello"
        style="
          --fluid-textarea-counter-font-family: 'Counter Mono';
          --fluid-textarea-counter-font-size: 11px;
        "
      ></fluid-textarea>
    `);
    const counter = el.shadowRoot!.querySelector<HTMLElement>(".counter")!;
    const styles = getComputedStyle(counter);
    expect(styles.fontFamily).to.contain("Counter Mono");
    expect(styles.fontSize).to.equal("11px");
  });

  it("places the counter below the field and keeps the native resize corner clear", async () => {
    const el = await fixture<FluidTextarea>(html`
      <fluid-textarea aria-label="Notes" maxlength="200" resize="vertical"></fluid-textarea>
    `);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const textarea = el.shadowRoot!.querySelector<HTMLTextAreaElement>("textarea")!;
    const counter = el.shadowRoot!.querySelector<HTMLElement>(".counter")!;
    const baseRect = base.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    const counterRect = counter.getBoundingClientRect();

    expect(base.getBoundingClientRect().height).to.be.closeTo(textareaRect.height, 0.5);
    expect(counterRect.top).to.be.greaterThanOrEqual(baseRect.bottom);
    expect(counterRect.right).to.be.closeTo(baseRect.right, 0.5);
    expect(getComputedStyle(counter).pointerEvents).to.equal("none");
    expect(textarea.getAttribute("aria-describedby")).to.equal("textarea-counter");
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
