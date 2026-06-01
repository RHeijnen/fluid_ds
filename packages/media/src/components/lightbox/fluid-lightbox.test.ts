import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidLightbox } from "./fluid-lightbox.js";

async function gallery(): Promise<FluidLightbox> {
  const el = await fixture<FluidLightbox>(html`
    <fluid-lightbox loop>
      <img src="a.png" alt="Alpha" />
      <img src="b.png" alt="Bravo" />
      <img src="c.png" alt="Charlie" />
    </fluid-lightbox>
  `);
  await elementUpdated(el);
  await aTimeout(0);
  return el;
}

describe("<fluid-lightbox>", () => {
  it("makes each thumbnail a focusable button", async () => {
    const el = await gallery();
    const imgs = el.querySelectorAll("img");
    expect(imgs[0]!.getAttribute("role")).to.equal("button");
    expect(imgs[0]!.tabIndex).to.equal(0);
  });

  it("opens the dialog at the clicked index and emits fluid-open", async () => {
    const el = await gallery();
    const imgs = el.querySelectorAll<HTMLImageElement>("img");
    setTimeout(() => imgs[1]!.click());
    const ev = await oneEvent(el, "fluid-open");
    expect(ev.detail.index).to.equal(1);
    await elementUpdated(el);
    const big = el.shadowRoot!.querySelector('[part="image"]') as HTMLImageElement;
    expect(big.getAttribute("alt")).to.equal("Bravo");
  });

  it("navigates with the next control and wraps when loop is set", async () => {
    const el = await gallery();
    el.openAt(2);
    await elementUpdated(el);
    const next = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!;
    setTimeout(() => next.click());
    const ev = await oneEvent(el, "fluid-change");
    expect(ev.detail.index).to.equal(0); // wrapped past the last
  });

  it("shows a position counter for multi-image galleries", async () => {
    const el = await gallery();
    el.openAt(0);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="counter"]')?.textContent).to.contain("1 of 3");
  });

  it("passes the a11y audit (thumbnails)", async () => {
    const el = await fixture<FluidLightbox>(html`
      <div style="--fluid-accent-base:#4f46e5;">
        <fluid-lightbox>
          <img src="a.png" alt="Alpha" />
          <img src="b.png" alt="Bravo" />
        </fluid-lightbox>
      </div>
    `);
    await aTimeout(0);
    await expect(el.querySelector("fluid-lightbox")!).to.be.accessible();
  });
});
