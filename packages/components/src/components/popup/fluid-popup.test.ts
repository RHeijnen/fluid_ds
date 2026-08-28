import { expect, fixture, html, aTimeout, oneEvent, waitUntil } from "@open-wc/testing";
import "./define.js";
import type { FluidPopup } from "./fluid-popup.js";

function stubRect(element: HTMLElement, rect: DOMRect): void {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => rect
  });
  Object.defineProperty(element, "offsetWidth", { configurable: true, value: rect.width });
  Object.defineProperty(element, "offsetHeight", { configurable: true, value: rect.height });
}

describe("<fluid-popup>", () => {
  it("settles the initial update when no anchor is present", async () => {
    const el = document.createElement("fluid-popup") as FluidPopup;
    document.body.append(el);

    expect(await el.updateComplete).to.be.true;
    expect(el.active).to.be.false;
    el.remove();
  });

  it("passes an a11y audit with an authored trigger and named content", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open>
        <button slot="anchor" aria-expanded="true">Show details</button>
        <section aria-label="Details">Popup content</section>
      </fluid-popup>
    `);
    await expect(el).to.be.accessible();
  });

  it("renders an anchor slot and a popup slot", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup>
        <button slot="anchor">Trigger</button>
        <div>Content</div>
      </fluid-popup>
    `);
    expect(el.shadowRoot!.querySelectorAll("slot").length).to.equal(2);
  });

  it("hides the popup when not open", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup>
        <button slot="anchor">a</button>
        <div>c</div>
      </fluid-popup>
    `);
    await el.updateComplete;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    expect(getComputedStyle(popup).display).to.equal("none");
  });

  it("positions the popup when open", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open>
        <button slot="anchor" style="position: absolute; left: 100px; top: 100px;">a</button>
        <div style="width: 50px; height: 50px;">c</div>
      </fluid-popup>
    `);
    await el.updateComplete;
    await aTimeout(50);
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    expect(popup.style.left).to.not.equal("0px");
  });

  it("matches the anchor width when match-width is set", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open match-width>
        <button slot="anchor" style="width: 200px;">a</button>
        <div>c</div>
      </fluid-popup>
    `);
    await el.updateComplete;
    await aTimeout(50);
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    expect(popup.style.width).to.match(/2\d\dpx/);
  });

  it("repositions when the inherited writing direction changes", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div dir="ltr">
        <fluid-popup open .flip=${false} .shift=${false}>
          <button slot="anchor" style="position: absolute; left: 100px; top: 100px;">a</button>
          <div style="width: 50px; height: 50px;">c</div>
        </fluid-popup>
      </div>
    `);
    const el = wrapper.querySelector<FluidPopup>("fluid-popup")!;
    await el.updateComplete;
    await aTimeout(50);
    let repositionCount = 0;
    el.addEventListener("fluid-reposition", () => (repositionCount += 1));

    wrapper.dir = "rtl";
    await aTimeout(0);
    await el.updateComplete;
    await aTimeout(50);

    expect(repositionCount).to.be.greaterThan(0);
  });

  it("uses logical start alignment when the inherited direction changes", async () => {
    const wrapper = await fixture<HTMLElement>(html`
      <div dir="ltr">
        <fluid-popup open placement="bottom-start" .flip=${false} .shift=${false}>
          <button slot="anchor">a</button>
          <div>c</div>
        </fluid-popup>
      </div>
    `);
    const el = wrapper.querySelector<FluidPopup>("fluid-popup")!;
    const anchor = el.querySelector<HTMLElement>("[slot='anchor']")!;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    stubRect(anchor, new DOMRect(100, 100, 50, 20));
    stubRect(popup, new DOMRect(0, 0, 80, 40));
    let positioned = oneEvent(el, "fluid-reposition");
    el.reposition_();
    await positioned;
    expect(popup.style.left).to.equal("100px");

    positioned = oneEvent(el, "fluid-reposition");
    wrapper.dir = "rtl";
    await positioned;
    expect(popup.style.left).to.equal("70px");
  });

  it("restarts tracking when an open slotted anchor is replaced", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open placement="bottom-start" .flip=${false} .shift=${false}>
        <button slot="anchor">First</button>
        <div>c</div>
      </fluid-popup>
    `);
    const first = el.querySelector<HTMLElement>("[slot='anchor']")!;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    stubRect(first, new DOMRect(20, 20, 40, 20));
    stubRect(popup, new DOMRect(0, 0, 80, 40));
    const positioned = oneEvent(el, "fluid-reposition");
    el.reposition_();
    await positioned;
    expect(popup.style.left).to.equal("20px");

    const second = document.createElement("button");
    second.slot = "anchor";
    second.textContent = "Second";
    stubRect(second, new DOMRect(220, 20, 40, 20));
    first.replaceWith(second);

    await waitUntil(() => popup.style.left === "220px", "popup tracks its replacement anchor");
    expect(el.active).to.be.true;
  });

  it("deactivates without an anchor and recovers when one is inserted", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open>
        <button slot="anchor">First</button>
        <div>c</div>
      </fluid-popup>
    `);
    const first = el.querySelector<HTMLElement>("[slot='anchor']")!;
    first.remove();
    await waitUntil(() => !el.active, "popup deactivates after anchor removal");
    expect(getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>(".popup")!).display).to.equal(
      "none"
    );

    const second = document.createElement("button");
    second.slot = "anchor";
    second.textContent = "Second";
    el.append(second);
    await waitUntil(() => el.active, "popup reactivates after anchor insertion");
  });

  it("reacts to live positioning option changes", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open placement="bottom-start" .flip=${false} .shift=${false}>
        <button slot="anchor">a</button>
        <div>c</div>
      </fluid-popup>
    `);
    const anchor = el.querySelector<HTMLElement>("[slot='anchor']")!;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    stubRect(anchor, new DOMRect(100, 100, 50, 20));
    stubRect(popup, new DOMRect(0, 0, 80, 40));
    let positioned = oneEvent(el, "fluid-reposition");
    el.reposition_();
    await positioned;
    expect(popup.style.left).to.equal("100px");

    positioned = oneEvent(el, "fluid-reposition");
    el.skidding = 25;
    await positioned;
    expect(popup.style.left).to.equal("125px");

    positioned = oneEvent(el, "fluid-reposition");
    el.matchWidth = true;
    await positioned;
    expect(popup.style.width).to.equal("50px");

    positioned = oneEvent(el, "fluid-reposition");
    el.matchWidth = false;
    await positioned;
    expect(popup.style.width).to.equal("");
  });

  it("reports the collision-resolved placement", async () => {
    const el = await fixture<FluidPopup>(html`
      <fluid-popup open placement="top" .shift=${false}>
        <button slot="anchor">a</button>
        <div>c</div>
      </fluid-popup>
    `);
    const anchor = el.querySelector<HTMLElement>("[slot='anchor']")!;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    stubRect(anchor, new DOMRect(100, 2, 50, 20));
    stubRect(popup, new DOMRect(0, 0, 80, 40));

    const positioned = oneEvent(el, "fluid-reposition");
    el.reposition_();
    const event = await positioned;
    expect(event.detail.placement).to.equal("bottom");
  });

  it("resumes open anchor tracking after reconnect", async () => {
    const host = await fixture<HTMLElement>(html`<div></div>`);
    const el = document.createElement("fluid-popup") as FluidPopup;
    el.open = true;
    el.placement = "bottom-start";
    el.flip = false;
    el.shift = false;
    el.innerHTML = `<button slot="anchor">a</button><div>c</div>`;
    const anchor = el.querySelector<HTMLElement>("[slot='anchor']")!;
    stubRect(anchor, new DOMRect(30, 20, 40, 20));
    host.append(el);
    await el.updateComplete;
    const popup = el.shadowRoot!.querySelector<HTMLElement>(".popup")!;
    stubRect(popup, new DOMRect(0, 0, 80, 40));
    let positioned = oneEvent(el, "fluid-reposition");
    el.reposition_();
    await positioned;

    el.remove();
    stubRect(anchor, new DOMRect(190, 20, 40, 20));
    positioned = oneEvent(el, "fluid-reposition");
    host.append(el);
    await positioned;
    expect(el.active).to.be.true;
    expect(popup.style.left).to.equal("190px");
  });
});
