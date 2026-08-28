import { expect, fixture, html, aTimeout } from "@open-wc/testing";
import { FluidElement } from "./base-element.js";
import "../locales/nl.js";
import "../locales/fr.js";

class DefaultNameProbe extends FluidElement {
  static override properties = { marker: { type: String } };
  marker = "initial";
  updates = 0;

  protected override willUpdate(): void {
    this.updates++;
    this.updateDefaultAriaLabel(this.term("progress"));
  }
}
customElements.define("default-name-probe", DefaultNameProbe);

describe("FluidElement default host names", () => {
  async function settle(control: DefaultNameProbe): Promise<void> {
    await aTimeout(0);
    await control.updateComplete;
  }

  it("observes naming attributes without losing subclass reactive attributes", async () => {
    expect(DefaultNameProbe.observedAttributes).to.include.members([
      "aria-label",
      "aria-labelledby",
      "marker"
    ]);
    const control = await fixture<DefaultNameProbe>(
      html`<default-name-probe lang="en"></default-name-probe>`
    );
    control.setAttribute("marker", "changed");
    await settle(control);
    expect(control.marker).to.equal("changed");
  });

  it("does not treat a same-value author write as a library default", async () => {
    const control = await fixture<DefaultNameProbe>(
      html`<default-name-probe lang="en"></default-name-probe>`
    );
    control.setAttribute("aria-label", "Progress");
    control.lang = "nl";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progress");
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Voortgang");
  });

  it("preserves an explicit empty name and restores a removed override without another property change", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div lang="nl"></div>`);
    const control = document.createElement("default-name-probe") as DefaultNameProbe;
    // Deliberately invalid caller naming tests ownership, not conformance.
    control.setAttribute("aria-label", "");
    wrapper.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("");
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Voortgang");
  });

  it("never promotes a library write into application ownership or an update loop", async () => {
    const control = await fixture<DefaultNameProbe>(
      html`<default-name-probe lang="en"></default-name-probe>`
    );
    control.lang = "nl";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Voortgang");
    control.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progression");
    const updates = control.updates;
    await aTimeout(20);
    expect(control.updates).to.equal(updates);
    expect(control.isUpdatePending).to.equal(false);
  });

  it("defers owned names to authored aria-labelledby without deleting an authored fallback", async () => {
    const control = await fixture<DefaultNameProbe>(
      html`<default-name-probe lang="nl"></default-name-probe>`
    );
    control.setAttribute("aria-labelledby", "external-heading");
    await settle(control);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    control.setAttribute("aria-label", "Caller fallback");
    control.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Caller fallback");
    control.removeAttribute("aria-label");
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progression");
  });

  it("treats server or pre-upgrade attributes as authored even when they match English defaults", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div><upgrade-name-probe lang="fr" aria-label="Progress"></upgrade-name-probe></div>`
    );
    customElements.define("upgrade-name-probe", class extends DefaultNameProbe {});
    const control = wrapper.firstElementChild as DefaultNameProbe;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progress");
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progression");
  });

  it("tracks detached overrides and removal across reconnect without an observer", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div lang="en"><default-name-probe></default-name-probe></div>`
    );
    const control = wrapper.firstElementChild as DefaultNameProbe;
    control.remove();
    control.ariaLabel = "Progress";
    wrapper.lang = "fr";
    wrapper.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progress");
    control.remove();
    control.ariaLabel = null;
    wrapper.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Progression");
  });

  it("does not schedule name-only updates for components that never opt into defaults", async () => {
    class NoDefaultProbe extends FluidElement {
      updates = 0;
      protected override willUpdate(): void {
        this.updates++;
      }
    }
    customElements.define("no-default-name-probe", NoDefaultProbe);
    const control = await fixture<NoDefaultProbe>(
      html`<no-default-name-probe></no-default-name-probe>`
    );
    const updates = control.updates;
    control.ariaLabel = "Caller name";
    control.setAttribute("aria-labelledby", "caller-heading");
    await aTimeout(0);
    expect(control.updates).to.equal(updates);
  });
});

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
