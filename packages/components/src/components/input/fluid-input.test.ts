import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
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

  it("provides an accessible reveal toggle for password inputs", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input type="password" value="secret" aria-label="Password"></fluid-input>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(".password-toggle")!;

    expect(input.type).to.equal("password");
    expect(toggle.getAttribute("aria-label")).to.equal("Show password");
    expect(toggle.getAttribute("aria-pressed")).to.equal("false");
    expect(toggle.getAttribute("aria-controls")).to.equal("input");
    await expect(el).to.be.accessible();

    toggle.click();
    await el.updateComplete;
    expect(input.type).to.equal("text");
    expect(input.value).to.equal("secret");
    expect(toggle.getAttribute("aria-label")).to.equal("Hide password");
    expect(toggle.getAttribute("aria-pressed")).to.equal("true");

    toggle.click();
    await el.updateComplete;
    expect(input.type).to.equal("password");
    expect(input.value).to.equal("secret");
  });

  it("allows the password toggle color to be isolated per input", async () => {
    const el = await fixture<FluidInput>(html`
      <fluid-input
        type="password"
        aria-label="Password"
        style="--fluid-input-password-toggle-fg: rgb(1, 2, 3);"
      ></fluid-input>
    `);
    const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(".password-toggle")!;
    expect(getComputedStyle(toggle).color).to.equal("rgb(1, 2, 3)");
  });

  it("only renders the password toggle for password inputs and disables it with the field", async () => {
    const text = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    expect(text.shadowRoot!.querySelector(".password-toggle")).to.equal(null);

    const password = await fixture<FluidInput>(
      html`<fluid-input type="password" disabled></fluid-input>`
    );
    expect(password.shadowRoot!.querySelector<HTMLButtonElement>(".password-toggle")!.disabled).to
      .be.true;
  });

  it("forwards its form name to the internal input for autofill metadata", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input name="username" aria-label="Username"></fluid-input>`
    );
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.id).to.equal("input");
    expect(input.name).to.equal("username");
  });

  it("fires fluid-input on user typing", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    el.focus();
    const firstInput = oneEvent(el, "fluid-input");
    await sendKeys({ type: "abc" });
    const event = await firstInput;
    expect(event).to.exist;
    expect((event as CustomEvent).detail.value).to.equal("a");
    expect(el.value).to.equal("abc");
    expect(el.shadowRoot!.querySelector("input")!.value).to.equal("abc");
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
    expect(el.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.be.false;
    // Trigger validity refresh by blurring
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
    expect(el.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.be.true;
  });

  it("native form validation focuses the inner input and blocks invalid submission", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-input name="note" label="Note" required></fluid-input>
        <button type="submit">Submit</button>
      </form>
    `);
    const input = form.querySelector<FluidInput>("fluid-input")!;
    await input.updateComplete;
    await input.updateComplete;
    const native = input.shadowRoot!.querySelector("input")!;
    const submit = form.querySelector("button")!;
    expect(input.value).to.equal("");
    expect(native.value).to.equal("");
    expect(input.validity.valueMissing).to.be.true;
    expect(native.validity.valueMissing).to.be.true;
    let submissions = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submissions++;
    });
    submit.focus();
    expect(document.activeElement).to.equal(submit);
    const [invalid] = await Promise.all([oneEvent(input, "invalid"), sendKeys({ press: "Enter" })]);
    await input.updateComplete;
    expect(invalid.target).to.equal(input);
    expect(submissions).to.equal(0);
    expect(input.value).to.equal("");
    expect(native.value).to.equal("");
    expect(input.validity.valueMissing).to.be.true;
    expect(input.shadowRoot!.activeElement).to.equal(native);
    expect(input.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.be.true;
  });

  it("platform focus delegates to the native input without the JavaScript focus override", async () => {
    const input = await fixture<FluidInput>(html`<fluid-input label="Note"></fluid-input>`);
    HTMLElement.prototype.focus.call(input);
    expect(input.shadowRoot!.activeElement).to.equal(input.shadowRoot!.querySelector("input"));
  });

  it("derives focused styling from the native focus tree without component state", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="Note"></fluid-input>`);
    const native = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    native.focus();
    expect(base.matches(":focus-within")).to.equal(true);
    expect(base.classList.contains("focused")).to.equal(false);
    native.blur();
    expect(base.matches(":focus-within")).to.equal(false);
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

  it("restores built-in validity after a custom error is cleared", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input required></fluid-input>`);
    await el.updateComplete;
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("blur"));

    expect(el.validity.valueMissing).to.be.true;
    el.setCustomValidity("Custom message");
    expect(el.validity.customError).to.be.true;
    expect(el.validity.valueMissing).to.be.true;

    el.setCustomValidity("");
    expect(el.validity.customError).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
    expect(el.checkValidity()).to.be.false;
  });

  for (const [type, invalidValue, validValue, flag] of [
    ["email", "not-an-email", "ada@example.com", "typeMismatch"],
    ["url", "not-a-url", "https://example.com", "typeMismatch"]
  ] as const) {
    it(`tracks ${type} errors and recovers when the value becomes valid`, async () => {
      const el = await fixture<FluidInput>(html`
        <fluid-input type=${type} value=${invalidValue} aria-label=${type}></fluid-input>
      `);
      await el.updateComplete;
      expect(el.validity[flag]).to.equal(true);
      expect(el.checkValidity()).to.equal(false);

      el.value = validValue;
      await el.updateComplete;
      expect(el.validity[flag]).to.equal(false);
      expect(el.checkValidity()).to.equal(true);
    });
  }

  it("reassociates its submitted value when moved between forms and renamed", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <form id="first"><fluid-input name="account" value="Ada"></fluid-input></form>
        <form id="second"></form>
      </div>
    `);
    const first = wrapper.querySelector<HTMLFormElement>("#first")!;
    const second = wrapper.querySelector<HTMLFormElement>("#second")!;
    const input = wrapper.querySelector<FluidInput>("fluid-input")!;
    expect(input.form).to.equal(first);
    expect(new FormData(first).get("account")).to.equal("Ada");

    second.append(input);
    input.name = "owner";
    await aTimeout(0);
    expect(input.form).to.equal(second);
    expect(new FormData(first).has("account")).to.equal(false);
    expect(new FormData(second).get("owner")).to.equal("Ada");
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

  it("isolates text, font and focus-ring overrides to the input component", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input
        aria-label="x"
        style="
          --fluid-input-fg: rgb(1, 2, 3);
          --fluid-input-font-family: 'Input Override';
          --fluid-focus-ring-color: rgb(255, 0, 0);
          --fluid-focus-ring-width: 2px;
        "
      ></fluid-input>`
    );
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;

    expect(getComputedStyle(input).color).to.equal("rgb(1, 2, 3)");
    expect(getComputedStyle(input).fontFamily).to.contain("Input Override");

    input.focus();
    await aTimeout(0);
    const sharedRing = getComputedStyle(base).boxShadow;
    expect(sharedRing).not.to.equal("none");

    el.style.setProperty("--fluid-input-focus-ring-color", "rgb(0, 0, 255)");
    await el.updateComplete;
    const scopedRing = getComputedStyle(base).boxShadow;
    expect(scopedRing).not.to.equal("none");
    expect(scopedRing).not.to.equal(sharedRing);
  });

  it("allows scoped typography overrides for its optional label and help text", async () => {
    const el = await fixture<FluidInput>(html`
      <fluid-input
        label="Account"
        help-text="Enter the account name"
        style="
          --fluid-field-font-family: 'Field Override';
          --fluid-field-label-font-size: 18px;
          --fluid-field-label-font-weight: 700;
          --fluid-field-description-font-size: 13px;
        "
      ></fluid-input>
    `);
    const label = el.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
    const help = el.shadowRoot!.querySelector<HTMLElement>('[part="help-text"]')!;

    expect(getComputedStyle(label).fontFamily).to.contain("Field Override");
    expect(getComputedStyle(label).fontSize).to.equal("18px");
    expect(getComputedStyle(label).fontWeight).to.equal("700");
    expect(getComputedStyle(help).fontFamily).to.contain("Field Override");
    expect(getComputedStyle(help).fontSize).to.equal("13px");
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

  it("does not force autocomplete='off'; omits the attribute unless set", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="x"></fluid-input>`);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.hasAttribute("autocomplete")).to.be.false;
  });

  it("reflects a consumer-set autocomplete onto the inner input", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input aria-label="x" autocomplete="username"></fluid-input>`
    );
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.getAttribute("autocomplete")).to.equal("username");
  });

  it("always exposes aria-invalid on the inner input", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input aria-label="x"></fluid-input>`);
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-invalid")).to.equal("false");
  });

  it("renders no field chrome by default", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input></fluid-input>`);
    expect(el.shadowRoot!.querySelector(".field-chrome")).to.equal(null);
    expect(el.shadowRoot!.querySelector("label")).to.equal(null);
  });

  it("renders a visible label associated with the input", async () => {
    const el = await fixture<FluidInput>(html`<fluid-input label="Serial number"></fluid-input>`);
    const label = el.shadowRoot!.querySelector("label")!;
    expect(label.textContent).to.contain("Serial number");
    expect(label.getAttribute("for")).to.equal("input");
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.id).to.equal("input");
  });

  it("renders help text and wires it to the input via aria-describedby", async () => {
    const el = await fixture<FluidInput>(
      html`<fluid-input label="Name" help-text="One per line"></fluid-input>`
    );
    const help = el.shadowRoot!.querySelector("#field-help")!;
    expect(help.textContent).to.contain("One per line");
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.getAttribute("aria-describedby")).to.equal("field-help");
  });
});
