import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidOtp } from "./fluid-otp.js";

function boxes(el: FluidOtp): HTMLInputElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLInputElement>(".box"));
}

describe("<fluid-otp>", () => {
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
    expect(labels).to.deep.equal([
      "Digit 1 of 4",
      "Digit 2 of 4",
      "Digit 3 of 4",
      "Digit 4 of 4"
    ]);
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
    const ev = await oneEvent(el, "fluid-input");
    expect(ev.detail.value).to.equal("5");
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
    const ev = await oneEvent(el, "fluid-complete");
    expect(ev.detail.value).to.equal("12");
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

  it("distributes a pasted code across boxes", async () => {
    const el = await fixture<FluidOtp>(html`<fluid-otp length="6"></fluid-otp>`);
    const b = boxes(el)[0]!;
    const data = new DataTransfer();
    data.setData("text", "246810");
    b.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true, composed: true })
    );
    await elementUpdated(el);
    expect(el.value).to.equal("246810");
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
