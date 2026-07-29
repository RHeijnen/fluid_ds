import { expect, fixture, html, aTimeout } from "@open-wc/testing";
import { FluidElement } from "./base-element.js";

/**
 * A throwaway element that exercises every teardown helper so we can prove a
 * subclass cannot leak: an interval, an event listener, and a manual cleanup
 * are all torn down on disconnect.
 */
class CleanupProbe extends FluidElement {
  /** How many times the interval ticked. */
  ticks = 0;
  /** How many times the (managed) document listener fired. */
  docClicks = 0;
  /** Whether the manual cleanup ran. */
  manualCleaned = false;
  /** The captured disconnect signal, to assert it aborts. */
  signal!: AbortSignal;

  override connectedCallback(): void {
    super.connectedCallback();
    this.signal = this.disconnectSignal;
    const id = window.setInterval(() => (this.ticks += 1), 10);
    this.registerCleanup(() => window.clearInterval(id));
    this.registerCleanup(() => (this.manualCleaned = true));
    this.listen(document, "click", () => (this.docClicks += 1));
  }
}
customElements.define("cleanup-probe", CleanupProbe);

describe("FluidElement teardown helpers", () => {
  it("runs registered cleanups and aborts the disconnect signal on remove", async () => {
    const el = await fixture<CleanupProbe>(html`<cleanup-probe></cleanup-probe>`);
    await aTimeout(35);
    const ticksWhileConnected = el.ticks;
    expect(ticksWhileConnected, "interval runs while connected").to.be.greaterThan(0);
    expect(el.signal.aborted).to.equal(false);

    el.remove();

    expect(el.manualCleaned, "manual cleanup ran").to.equal(true);
    expect(el.signal.aborted, "disconnect signal aborted").to.equal(true);

    // The interval was cleared: no further ticks after disconnect.
    await aTimeout(35);
    expect(el.ticks, "interval stopped after disconnect").to.equal(ticksWhileConnected);

    // The managed listener was removed: a later document click is not counted.
    const before = el.docClicks;
    document.dispatchEvent(new MouseEvent("click"));
    expect(el.docClicks, "managed listener removed after disconnect").to.equal(before);
  });

  it("the early disposer from registerCleanup runs and unregisters the callback", async () => {
    let ran = 0;
    class DisposerProbe extends FluidElement {
      dispose!: () => void;
      override connectedCallback(): void {
        super.connectedCallback();
        this.dispose = this.registerCleanup(() => (ran += 1));
      }
    }
    customElements.define("disposer-probe", DisposerProbe);
    const el = await fixture<DisposerProbe>(html`<disposer-probe></disposer-probe>`);
    el.dispose();
    expect(ran, "disposer ran the cleanup once").to.equal(1);
    el.remove();
    expect(ran, "disconnect did not run it again").to.equal(1);
  });

  it("a throwing cleanup does not block the others", async () => {
    let secondRan = false;
    class ThrowProbe extends FluidElement {
      override connectedCallback(): void {
        super.connectedCallback();
        this.registerCleanup(() => {
          throw new Error("boom");
        });
        this.registerCleanup(() => (secondRan = true));
      }
    }
    customElements.define("throw-probe", ThrowProbe);
    const el = await fixture<ThrowProbe>(html`<throw-probe></throw-probe>`);
    el.remove();
    expect(secondRan, "second cleanup still ran after the first threw").to.equal(true);
  });

  it("changedAfterFirstRender suppresses mount, fires on a real change", async () => {
    class ChangeProbe extends FluidElement {
      static override properties = { value: { type: String } };
      value = "a";
      events: string[] = [];
      protected override updated(changed: Map<PropertyKey, unknown>): void {
        if (this.changedAfterFirstRender(changed, "value")) this.events.push(this.value);
      }
    }
    customElements.define("change-probe", ChangeProbe);
    const el = await fixture<ChangeProbe>(html`<change-probe></change-probe>`);
    expect(el.events, "no event at mount").to.deep.equal([]);
    el.value = "b";
    await el.updateComplete;
    expect(el.events, "event on a genuine change").to.deep.equal(["b"]);
  });

  it("mints a fresh disconnect signal after reconnect", async () => {
    const el = await fixture<CleanupProbe>(html`<cleanup-probe></cleanup-probe>`);
    const first = el.signal;
    el.remove();
    expect(first.aborted).to.equal(true);
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.signal, "a new signal is used after reconnect").to.not.equal(first);
    expect(el.signal.aborted, "the new signal is live").to.equal(false);
    el.remove();
  });
});
