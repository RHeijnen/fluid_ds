import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidRelativeTime } from "./fluid-relative-time.js";

describe("<fluid-relative-time>", () => {
  it("formats a known past date", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 3);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${past} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("3 hours ago");
  });

  it("formats a known future date", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${future} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("in 2 days");
  });

  it('uses phrasing like "yesterday" when numeric is "auto"', async () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${yesterday} locale="en" numeric="auto"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim().toLowerCase()).to.equal("yesterday");
  });

  it("respects locale switching", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time .date=${past} locale="en" numeric="always"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("3 days ago");
    el.locale = "es";
    await elementUpdated(el);
    expect(el.shadowRoot!.textContent?.trim()).to.equal("hace 3 días");
  });

  it("falls back gracefully for an invalid date", async () => {
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time date="not-a-date"></fluid-relative-time>`
    );
    expect(el.shadowRoot!.textContent?.trim()).to.equal("");
  });

  it("does not schedule the refresh timer when no-sync is set", async () => {
    const realSetTimeout = window.setTimeout;
    const delays: unknown[] = [];
    (window as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      delays.push(timeout);
      return realSetTimeout(handler, timeout, ...args);
    }) as typeof setTimeout;
    try {
      const el = await fixture<FluidRelativeTime>(
        html`<fluid-relative-time
          .date=${new Date(Date.now() - 1000 * 60 * 5)}
          no-sync
        ></fluid-relative-time>`
      );
      expect(el.noSync).to.be.true;
      // The 60s auto-refresh timer must never be scheduled.
      expect(delays).to.not.include(60_000);
    } finally {
      (window as unknown as { setTimeout: typeof setTimeout }).setTimeout = realSetTimeout;
    }
  });

  it("clears its pending refresh timer on disconnect", async () => {
    const realClearTimeout = window.clearTimeout;
    let clearCount = 0;
    (window as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = ((
      id?: number
    ) => {
      clearCount += 1;
      return realClearTimeout(id);
    }) as typeof clearTimeout;
    try {
      const el = await fixture<FluidRelativeTime>(
        html`<fluid-relative-time
          .date=${new Date(Date.now() - 1000 * 60 * 5)}
        ></fluid-relative-time>`
      );
      clearCount = 0;
      el.remove();
      // The pending refresh timer must be cleared so it cannot keep
      // re-rendering after the element leaves the DOM.
      expect(clearCount).to.be.greaterThan(0);
    } finally {
      (window as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout =
        realClearTimeout;
    }
  });

  it("does not re-render after the element is removed", async () => {
    const el = await fixture<FluidRelativeTime>(
      html`<fluid-relative-time
        .date=${new Date(Date.now() - 1000 * 60 * 5)}
      ></fluid-relative-time>`
    );
    el.remove();
    let updated = false;
    const realRequestUpdate = el.requestUpdate.bind(el);
    el.requestUpdate = ((...args: unknown[]) => {
      updated = true;
      return (realRequestUpdate as (...a: unknown[]) => unknown)(...args);
    }) as typeof el.requestUpdate;
    // The cleared 60s timer must not fire; give the loop a brief window.
    await aTimeout(50);
    expect(updated).to.be.false;
  });
});
