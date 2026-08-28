import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type {
  FluidOtp,
  FluidOtpCompleteEvent,
  FluidOtpInputEvent,
  FluidOtpValueDetail
} from "../../index.js";

const otpDetail: FluidOtpValueDetail = { value: "" };
// @ts-expect-error OTP values are strings, including for numeric-mode controls.
const invalidOtpDetail: FluidOtpValueDetail = { value: 123456 };
void invalidOtpDetail;

function boxes(el: FluidOtp): HTMLInputElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLInputElement>(".box"));
}

describe("<fluid-otp>", () => {
  for (const [locale, message] of [
    ["nl", "Vul de volledige code in."],
    ["de", "Bitte vervollständigen Sie den Code."],
    ["fr-CA", "Veuillez compléter le code."],
    ["es", "Completa el código."],
    ["ar", "يرجى إكمال الرمز."]
  ] as const) {
    it(`updates current required validation when switching to ${locale}`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-otp required aria-label="Required control"></fluid-otp></div>
      `);
      const control = wrapper.querySelector<FluidOtp>("fluid-otp")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Please complete the code.");
      wrapper.lang = locale;
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal(message);
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.checkValidity()).to.equal(false);
    });
  }

  it("preserves custom validity across shadow-context language changes and restores the current translation", async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const root = host.attachShadow({ mode: "closed" });
    const wrapper = document.createElement("section");
    wrapper.lang = "nl";
    const control = document.createElement("fluid-otp") as FluidOtp;
    control.required = true;
    control.ariaLabel = "Application label";
    wrapper.append(control);
    root.append(wrapper);
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Vul de volledige code in.");
    control.setCustomValidity("Application validation");
    wrapper.lang = "de";
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
    expect(control.validationMessage).to.equal("Application validation");
    expect(control.validity.customError).to.equal(true);
    expect(control.ariaLabel).to.equal("Application label");
    control.setCustomValidity("");
    expect(control.validationMessage).to.equal("Bitte vervollständigen Sie den Code.");
    expect(control.validity.customError).to.equal(false);
    expect(control.validity.valueMissing).to.equal(true);
    control.required = false;
    await control.updateComplete;
    expect(control.validationMessage).to.equal("");
    expect(control.checkValidity()).to.equal(true);
  });

  it("renders `length` boxes (default 6)", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp></fluid-otp>`);
    expect(boxes(el).length).to.equal(6);
  });

  it("honors a custom length", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    expect(boxes(el).length).to.equal(4);
  });

  it("uses role=group with an accessible name", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp></fluid-otp>`);
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).to.equal("One-time code");
  });

  it("labels each box as 'Digit N of M'", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    const labels = boxes(el).map((b) => b.getAttribute("aria-label"));
    expect(labels).to.deep.equal(["Digit 1 of 4", "Digit 2 of 4", "Digit 3 of 4", "Digit 4 of 4"]);
  });

  it("forwards a custom group aria-label", async () => {
    const el = await fixture<FluidOtp>(
      html`<fluid-otp aria-label="Verification code"></fluid-otp>`
    );
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).to.equal("Verification code");
  });

  it("distributes a prefilled value across boxes", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp value="123"></fluid-otp>`);
    const vals = boxes(el).map((b) => b.value);
    expect(vals).to.deep.equal(["1", "2", "3", "", "", ""]);
  });

  it("fires fluid-input and auto-advances on typing", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    const bs = boxes(el);
    bs[0]!.focus();
    setTimeout(() => {
      bs[0]!.value = "5";
      bs[0]!.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    const ev = (await oneEvent(el, "fluid-input")) as FluidOtpInputEvent;
    expect(ev.detail).to.deep.equal({ value: "5" });
    expect(otpDetail).to.deep.equal({ value: "" });
    await elementUpdated(el);
    expect(el.shadowRoot!.activeElement).to.equal(bs[1]);
  });

  it("rejects non-digits when type=number", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    const b = boxes(el)[0]!;
    b.value = "a";
    b.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await elementUpdated(el);
    expect(el.value).to.equal("");
  });

  it("allows letters when type=text", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp type="text" length="4"></fluid-otp>`);
    const b = boxes(el)[0]!;
    b.value = "a";
    b.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await elementUpdated(el);
    expect(el.value).to.equal("a");
  });

  it("fires fluid-complete when all boxes are filled", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="2" value="1"></fluid-otp>`);
    const b = boxes(el)[1]!;
    b.focus();
    setTimeout(() => {
      b.value = "2";
      b.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    const ev = (await oneEvent(el, "fluid-complete")) as FluidOtpCompleteEvent;
    expect(ev.detail).to.deep.equal({ value: "12" });
  });

  it("synchronizes FormData before public input and complete events", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-otp name="code" length="2" value="1"></fluid-otp></form>
    `);
    const el = form.querySelector<FluidOtp>("fluid-otp")!;
    const snapshots: { type: string; value: string | null }[] = [];
    for (const type of ["fluid-input", "fluid-complete"])
      el.addEventListener(type, (event) =>
        snapshots.push({ type: event.type, value: new FormData(form).get("code") as string | null })
      );
    const box = boxes(el)[1]!;
    box.value = "2";
    box.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    expect(snapshots).to.deep.equal([
      { type: "fluid-input", value: "12" },
      { type: "fluid-complete", value: "12" }
    ]);
  });

  it("delegates host focus and targets the first missing box for partial required values", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4" value="1" required></fluid-otp>`);
    expect(el.shadowRoot!.delegatesFocus).to.be.true;
    expect(el.checkValidity()).to.be.false;
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(boxes(el)[1]);
  });

  it("keeps required validity active without painting an untouched control", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp required></fluid-otp>`);
    await el.updateComplete;

    expect(el.validity.valueMissing).to.equal(true);
    expect(el.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.equal(false);
    expect(boxes(el).every((box) => box.getAttribute("aria-invalid") === "false")).to.equal(true);

    expect(el.checkValidity()).to.equal(false);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".base")!.classList.contains("invalid")).to.equal(true);
    expect(boxes(el).every((box) => box.getAttribute("aria-invalid") === "true")).to.equal(true);
  });

  it("Backspace on an empty box steps back and clears the previous", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4" value="12"></fluid-otp>`);
    const bs = boxes(el);
    bs[2]!.focus();
    await sendKeys({ press: "Backspace" });
    await elementUpdated(el);
    expect(el.value).to.equal("1");
    expect(el.shadowRoot!.activeElement).to.equal(bs[1]);
  });

  it("truncates the value when length shrinks at runtime", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="6" value="123456"></fluid-otp>`);
    el.length = 4;
    await elementUpdated(el);
    expect(el.value).to.equal("1234");
    // The submitted form value must not carry the stale extra characters.
    const form = await fixture<HTMLFormElement>(html`<form></form>`);
    const el2 = await fixture<FluidOtp>(
      html`<fluid-otp name="code" length="6" value="123456"></fluid-otp>`
    );
    form.append(el2);
    el2.length = 4;
    await elementUpdated(el2);
    expect(new FormData(form).get("code")).to.equal("1234");
  });

  it("Home / End jump to the first / last box", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    const bs = boxes(el);
    bs[2]!.focus();
    await sendKeys({ press: "Home" });
    expect(el.shadowRoot!.activeElement).to.equal(bs[0]);
    await sendKeys({ press: "End" });
    expect(el.shadowRoot!.activeElement).to.equal(bs[3]);
  });

  it("Delete clears the focused box", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4" value="1234"></fluid-otp>`);
    const bs = boxes(el);
    bs[1]!.focus();
    await sendKeys({ press: "Delete" });
    await elementUpdated(el);
    // Delete clears box 1 and the value collapses ("1"+""+"3"+"4" -> "134"),
    // so the boxes re-render from "134": box 1 now shows the next char, "3".
    expect(el.value).to.equal("134");
    expect(bs[1]!.value).to.equal("3");
  });

  it("ArrowLeft / ArrowRight move between boxes", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="4"></fluid-otp>`);
    const bs = boxes(el);
    bs[1]!.focus();
    await sendKeys({ press: "ArrowRight" });
    expect(el.shadowRoot!.activeElement).to.equal(bs[2]);
    await sendKeys({ press: "ArrowLeft" });
    await sendKeys({ press: "ArrowLeft" });
    expect(el.shadowRoot!.activeElement).to.equal(bs[0]);
  });

  it("distributes a native keyboard paste across boxes and submits the complete code", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <input aria-label="Code to copy" value="246810" />
        <fluid-otp name="code" length="6"></fluid-otp>
      </form>
    `);
    const el = form.querySelector<FluidOtp>("fluid-otp")!;
    const b = boxes(el)[0]!;
    const pastes: { trusted: boolean; text: string }[] = [];
    const changes: string[] = [];
    const completed: string[] = [];
    b.addEventListener("paste", (event) => {
      pastes.push({
        trusted: event.isTrusted,
        text: event.clipboardData?.getData("text/plain") ?? ""
      });
    });
    el.addEventListener("fluid-input", (event) =>
      changes.push((event as CustomEvent).detail.value)
    );
    el.addEventListener("fluid-complete", (event) =>
      completed.push((event as CustomEvent).detail.value)
    );
    const source = form.querySelector<HTMLInputElement>("input")!;
    source.focus();
    source.select();
    // Firefox drops constructor-supplied ClipboardEvent data (Mozilla bug 2027025).
    // Exercise the actual browser clipboard path, not a patched synthetic event.
    await sendKeys({ press: "ControlOrMeta+c" });
    b.focus();
    await sendKeys({ press: "ControlOrMeta+v" });
    await elementUpdated(el);
    expect(pastes).to.deep.equal([{ trusted: true, text: "246810" }]);
    expect(el.value).to.equal("246810");
    expect(boxes(el).map((box) => box.value)).to.deep.equal(["2", "4", "6", "8", "1", "0"]);
    expect(changes).to.deep.equal(["246810"]);
    expect(completed).to.deep.equal(["246810"]);
    expect(new FormData(form).get("code")).to.equal("246810");
    expect(el.shadowRoot!.activeElement).to.equal(boxes(el)[5]);
  });

  it("reflects length, type, mask, disabled, required to attributes", async () => {
    const el = await fixture<FluidOtp>(
      html`<fluid-otp length="4" type="text" mask disabled required></fluid-otp>`
    );
    expect(el.getAttribute("length")).to.equal("4");
    expect(el.getAttribute("type")).to.equal("text");
    expect(el.hasAttribute("mask")).to.be.true;
    expect(el.hasAttribute("disabled")).to.be.true;
    expect(el.hasAttribute("required")).to.be.true;
  });

  it("renders password-style boxes when masked", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp mask></fluid-otp>`);
    expect(boxes(el).every((b) => b.type === "password")).to.be.true;
  });

  it("submits the value with the form under its name", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-otp name="code" value="1234"></fluid-otp>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("code")).to.equal("1234");
  });

  it("clear() empties the value", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp value="123"></fluid-otp>`);
    el.clear();
    await elementUpdated(el);
    expect(el.value).to.equal("");
  });

  it("disables every box when disabled", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp disabled></fluid-otp>`);
    expect(boxes(el).every((b) => b.disabled)).to.be.true;
  });

  it("uses sans tabular typography and allows component font overrides", async () => {
    const el = await fixture<FluidOtp>(html`
      <fluid-otp
        style="--fluid-font-family-sans: 'Otp Sans'; --fluid-font-size-lg: 16px;"
      ></fluid-otp>
    `);
    const box = boxes(el)[0]!;
    expect(getComputedStyle(box).fontFamily).to.contain("Otp Sans");
    expect(getComputedStyle(box).fontSize).to.equal("16px");
    expect(getComputedStyle(box).fontVariantNumeric).to.equal("tabular-nums");

    el.style.setProperty("--fluid-otp-font-family", "'Otp Override'");
    el.style.setProperty("--fluid-otp-font-size", "18px");
    await elementUpdated(el);
    expect(getComputedStyle(box).fontFamily).to.contain("Otp Override");
    expect(getComputedStyle(box).fontSize).to.equal("18px");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidOtp>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-subtle:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-border-strong:#a1a1aa;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-danger-base:#dc2626;
          --fluid-danger-text:#ffffff;
        "
      >
        <fluid-otp aria-label="Verification code"></fluid-otp>
      </div>
    `);
    const otp = el.querySelector<FluidOtp>("fluid-otp")!;
    await elementUpdated(otp);
    await aTimeout(20);
    await expect(otp).to.be.accessible();
  });
});
