import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import type { FluidSwitch } from "./fluid-switch.js";

describe("<fluid-switch>", () => {
  it("renders with checked=false by default", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    expect(el.checked).to.be.false;
  });

  it("reflects the checked attribute", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch checked>Wifi</fluid-switch>`
    );
    expect(el.checked).to.be.true;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.checked).to.be.true;
  });

  it("fires fluid-change on toggle", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    const input = el.shadowRoot!.querySelector("input")!;
    setTimeout(() => input.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.checked).to.be.true;
    expect(el.checked).to.be.true;
  });

  it("toggles via keyboard (space)", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch>Wifi</fluid-switch>`);
    el.focus();
    await el.updateComplete;
    setTimeout(() => sendKeys({ press: "Space" }));
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.checked).to.be.true;
  });

  it("submits value=on when checked, omits when unchecked", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-switch name="wifi" checked></fluid-switch>
        <fluid-switch name="bt"></fluid-switch>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("wifi")).to.equal("on");
    expect(data.get("bt")).to.be.null;
  });

  it("submits a custom value when set", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-switch name="theme" checked value="dark"></fluid-switch>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("theme")).to.equal("dark");
  });

  it("respects disabled", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch disabled>Wifi</fluid-switch>`
    );
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.disabled).to.be.true;
  });

  it("reports invalid when required and not checked", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch required aria-label="Required"></fluid-switch>`
    );
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
  });

  it("becomes valid once checked", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch required aria-label="Required"></fluid-switch>`
    );
    el.checked = true;
    await el.updateComplete;
    expect(el.checkValidity()).to.be.true;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch aria-label="Enable wifi"></fluid-switch>`
    );
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("track-on color reads the --fluid-switch-* override ladder", async () => {
    const el = await fixture<FluidSwitch>(
      html`<fluid-switch checked aria-label="x"></fluid-switch>`
    );
    el.style.setProperty("--fluid-switch-track-bg-on", "rgb(1, 2, 3)");
    await el.updateComplete;
    const track = el.shadowRoot!.querySelector<HTMLElement>(".track")!;
    expect(getComputedStyle(track).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the clickable target respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidSwitch>(html`<fluid-switch aria-label="x"></fluid-switch>`);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    expect(base.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
