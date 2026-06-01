import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidCountdown } from "./fluid-countdown.js";

describe("<fluid-countdown>", () => {
  it("renders a role=timer region", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="90" .autostart=${false}></fluid-countdown>`
    );
    const region = el.shadowRoot!.querySelector('[role="timer"]');
    expect(region).to.exist;
  });

  it("renders labelled segments for a multi-unit duration", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3661" format="segments" .autostart=${false}></fluid-countdown>`
    );
    const labels = [...el.shadowRoot!.querySelectorAll(".label")].map((n) =>
      n.textContent?.trim()
    );
    expect(labels).to.include("hrs");
    expect(labels).to.include("min");
    expect(labels).to.include("sec");
  });

  it("renders a HH:MM:SS clock in clock format", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3661" format="clock" .autostart=${false}></fluid-countdown>`
    );
    const digits = [...el.shadowRoot!.querySelectorAll(".digit")].map((n) =>
      n.textContent?.trim()
    );
    // 1h 1m 1s -> 01:01:01
    expect(digits).to.deep.equal(["01", "01", "01"]);
    const seps = el.shadowRoot!.querySelectorAll(".separator");
    expect(seps.length).to.equal(2);
  });

  it("does not autostart when autostart is false", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="5" .autostart=${false}></fluid-countdown>`
    );
    let ticked = false;
    el.addEventListener("fluid-tick", () => (ticked = true));
    await aTimeout(1100);
    expect(ticked).to.be.false;
  });

  it("fires fluid-tick when running", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="5" .autostart=${false}></fluid-countdown>`
    );
    setTimeout(() => el.start());
    const event = await oneEvent(el, "fluid-tick");
    expect(event.detail.remaining).to.be.a("number");
    el.pause();
  });

  it("fires fluid-complete at zero", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="1" .autostart=${false}></fluid-countdown>`
    );
    setTimeout(() => el.start());
    const event = await oneEvent(el, "fluid-complete");
    expect(event).to.exist;
  });

  it("reset restores the initial duration", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="3" .autostart=${false}></fluid-countdown>`
    );
    el.start();
    await aTimeout(1100);
    el.reset();
    await elementUpdated(el);
    const digits = el.shadowRoot!.querySelectorAll(".digit");
    expect(digits[digits.length - 1]!.textContent?.trim()).to.equal("03");
  });

  it("clears its interval on disconnect", async () => {
    const el = await fixture<FluidCountdown>(
      html`<fluid-countdown seconds="60"></fluid-countdown>`
    );
    let ticked = false;
    el.addEventListener("fluid-tick", () => (ticked = true));
    el.remove();
    await aTimeout(1100);
    expect(ticked).to.be.false;
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-motion:0;
        "
      >
        <fluid-countdown seconds="90" .autostart=${false}></fluid-countdown>
      </div>
    `);
    const el = wrapper.querySelector<FluidCountdown>("fluid-countdown")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
