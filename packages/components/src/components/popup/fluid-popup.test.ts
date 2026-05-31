import { expect, fixture, html, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidPopup } from "./fluid-popup.js";

describe("<fluid-popup>", () => {
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
});
