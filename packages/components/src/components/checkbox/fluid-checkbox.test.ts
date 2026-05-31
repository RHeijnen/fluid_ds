import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidCheckbox } from "./fluid-checkbox.js";

describe("<fluid-checkbox>", () => {
  it("renders unchecked by default", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox>Agree</fluid-checkbox>`);
    expect(el.checked).to.be.false;
  });

  it("reflects the checked attribute", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox checked>Agree</fluid-checkbox>`);
    expect(el.checked).to.be.true;
    expect(el.shadowRoot!.querySelector("input")!.checked).to.be.true;
  });

  it("sets indeterminate on the inner input", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate>Mixed</fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("input")!.indeterminate).to.be.true;
  });

  it("fires fluid-change on toggle and clears indeterminate", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate>Mixed</fluid-checkbox>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    setTimeout(() => input.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.checked).to.be.true;
    expect(el.checked).to.be.true;
    expect(el.indeterminate).to.be.false;
  });

  it("aria-checked is 'mixed' when indeterminate", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox indeterminate aria-label="x"></fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("input")!.getAttribute("aria-checked")).to.equal(
      "mixed"
    );
  });

  it("submits value when checked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-checkbox name="terms" checked></fluid-checkbox>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("terms")).to.equal("on");
  });

  it("does not submit when unchecked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form><fluid-checkbox name="terms"></fluid-checkbox></form>
    `);
    const data = new FormData(form);
    expect(data.get("terms")).to.be.null;
  });

  it("reports invalid when required and not checked", async () => {
    const el = await fixture<FluidCheckbox>(
      html`<fluid-checkbox required aria-label="x"></fluid-checkbox>`
    );
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox>Agree</fluid-checkbox>`);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("checked-box color reads the --fluid-checkbox-* override ladder", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox checked>x</fluid-checkbox>`);
    el.style.setProperty("--fluid-checkbox-bg-on", "rgb(1, 2, 3)");
    await el.updateComplete;
    const control = el.shadowRoot!.querySelector<HTMLElement>(".control")!;
    expect(getComputedStyle(control).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidCheckbox>(html`<fluid-checkbox aria-label="x"></fluid-checkbox>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
