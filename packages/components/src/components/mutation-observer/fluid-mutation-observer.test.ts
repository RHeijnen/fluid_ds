import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidMutationObserver } from "./fluid-mutation-observer.js";

// Reach into the private observer field for white-box lifecycle assertions.
type Internals = {
  observer: MutationObserver | null;
};

const peek = (el: FluidMutationObserver): Internals =>
  el as unknown as Internals;

describe("<fluid-mutation-observer>", () => {
  it("passes an a11y audit without changing slotted semantics", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list><button>Observed action</button></fluid-mutation-observer>
    `);
    await expect(el).to.be.accessible();
  });

  it("renders its slotted children", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list>
        <div id="t">hi</div>
      </fluid-mutation-observer>
    `);
    await el.updateComplete;
    expect(el.querySelector("#t")).to.not.be.null;
  });

  it("creates a MutationObserver on connect", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list><div>hi</div></fluid-mutation-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(MutationObserver);
  });

  it("fires fluid-mutation with detail.records when a child is added under child-list", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list><div>hi</div></fluid-mutation-observer>
    `);
    await el.updateComplete;

    setTimeout(() => el.appendChild(document.createElement("span")));

    const ev = await oneEvent(el, "fluid-mutation");
    expect(ev).to.exist;
    expect(ev.detail.records).to.be.an("array");
    expect(ev.detail.records.length).to.be.greaterThan(0);
    expect(ev.detail.records[0].type).to.equal("childList");
  });

  it("honors attr-filter (fires only for filtered attributes)", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer attr attr-filter="data-watch"><div>hi</div></fluid-mutation-observer>
    `);
    await el.updateComplete;

    // A change to an unfiltered attribute must NOT fire.
    let fired = false;
    const onFire = (): void => {
      fired = true;
    };
    el.addEventListener("fluid-mutation", onFire);
    el.setAttribute("data-ignored", "x");
    await aTimeout(50);
    expect(fired).to.equal(false);
    el.removeEventListener("fluid-mutation", onFire);

    // A change to the filtered attribute fires.
    setTimeout(() => el.setAttribute("data-watch", "y"));
    const ev = await oneEvent(el, "fluid-mutation");
    expect(ev.detail.records[0].attributeName).to.equal("data-watch");
  });

  it("does not observe when disabled", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list disabled><div>hi</div></fluid-mutation-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.null;

    let fired = false;
    el.addEventListener("fluid-mutation", () => {
      fired = true;
    });
    el.appendChild(document.createElement("span"));
    await aTimeout(50);
    expect(fired).to.equal(false);
  });

  it("does not fire after el.remove() (observer is disconnected, no leak)", async () => {
    const el = await fixture<FluidMutationObserver>(html`
      <fluid-mutation-observer child-list><div>hi</div></fluid-mutation-observer>
    `);
    await el.updateComplete;
    expect(peek(el).observer).to.be.instanceOf(MutationObserver);

    el.remove();

    // disconnectedCallback() must tear the observer down.
    expect(peek(el).observer).to.be.null;

    let fired = false;
    el.addEventListener("fluid-mutation", () => {
      fired = true;
    });
    // A subsequent DOM change must NOT dispatch fluid-mutation.
    el.appendChild(document.createElement("span"));
    await aTimeout(50);
    expect(fired).to.equal(false);
  });
});
