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

function counterText(el: FluidLightbox): string | undefined {
  return el.shadowRoot!.querySelector('[part="counter"]')?.textContent ?? undefined;
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

  it("closes when the backdrop is clicked", async () => {
    const el = await gallery();
    el.openAt(0);
    await elementUpdated(el);
    const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;
    expect(dialog.open).to.equal(true);

    /* A native dialog gives Escape and a backdrop pseudo-element but no
       backdrop-click close, so the component adds it. */
    dialog.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(dialog.open).to.equal(false);
  });

  it("honors the documented no-light-dismiss attribute", async () => {
    const el = await gallery();
    el.setAttribute("no-light-dismiss", "");
    el.openAt(0);
    await elementUpdated(el);
    const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;

    dialog.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(dialog.open).to.equal(true);
    el.close();
  });

  it("keeps a drag that starts on the image from dismissing the viewer", async () => {
    const el = await gallery();
    el.openAt(0);
    await elementUpdated(el);
    const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;
    const img = el.shadowRoot!.querySelector("img") ?? dialog;

    /* Press on the image, release on the backdrop. The click lands on the
       backdrop, but the gesture began inside the content, so it is a slipped
       drag rather than a dismissal. */
    img.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await elementUpdated(el);
    await aTimeout(0);
    expect(dialog.open).to.equal(true);
    el.close();
  });

  it("opens a focused thumbnail with Enter", async () => {
    const el = await gallery();
    const imgs = el.querySelectorAll<HTMLImageElement>("img");
    setTimeout(() =>
      imgs[2]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }))
    );
    expect((await oneEvent(el, "fluid-open")).detail.index).to.equal(2);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("dialog")!.open).to.be.true;
    expect(counterText(el)).to.contain("3 of 3");
    el.close();
  });

  it("opens a focused thumbnail with Space without scrolling the page", async () => {
    const el = await gallery();
    const space = new KeyboardEvent("keydown", { key: " ", cancelable: true });
    el.querySelectorAll<HTMLImageElement>("img")[1]!.dispatchEvent(space);
    await elementUpdated(el);
    expect(space.defaultPrevented).to.be.true;
    expect(counterText(el)).to.contain("2 of 3");
    el.close();
  });

  it("leaves other keys on a thumbnail to the browser", async () => {
    const el = await gallery();
    const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    el.querySelector("img")!.dispatchEvent(tab);
    await elementUpdated(el);
    expect(tab.defaultPrevented).to.be.false;
    expect(el.shadowRoot!.querySelector("dialog")!.open).to.be.false;
  });

  it("ignores an open request outside the gallery range", async () => {
    const el = await gallery();
    el.openAt(-1);
    el.openAt(3);
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.shadowRoot!.querySelector("dialog")!.open).to.be.false;
  });

  it("navigates the open viewer with the arrow keys", async () => {
    const el = await gallery();
    el.openAt(1);
    await elementUpdated(el);
    const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;

    const right = new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true });
    dialog.dispatchEvent(right);
    await elementUpdated(el);
    expect(right.defaultPrevented).to.be.true;
    expect(counterText(el)).to.contain("3 of 3");

    const left = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
    dialog.dispatchEvent(left);
    await elementUpdated(el);
    expect(left.defaultPrevented).to.be.true;
    expect(counterText(el)).to.contain("2 of 3");

    const other = new KeyboardEvent("keydown", { key: "a", cancelable: true });
    dialog.dispatchEvent(other);
    await elementUpdated(el);
    expect(other.defaultPrevented).to.be.false;
    expect(counterText(el)).to.contain("2 of 3");
    el.close();
  });

  it("wraps backwards past the first image when loop is set", async () => {
    const el = await gallery();
    el.openAt(0);
    await elementUpdated(el);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="prev"]')!.click();
    await elementUpdated(el);
    expect(counterText(el)).to.contain("3 of 3");
    el.close();
  });

  it("stops at both ends when loop is not set", async () => {
    const el = await fixture<FluidLightbox>(html`
      <fluid-lightbox>
        <img src="a.png" alt="Alpha" />
        <img src="b.png" alt="Bravo" />
      </fluid-lightbox>
    `);
    await aTimeout(0);

    el.openAt(0);
    await elementUpdated(el);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="prev"]')!.click();
    await elementUpdated(el);
    expect(counterText(el)).to.contain("1 of 2");

    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!.click();
    await elementUpdated(el);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!.click();
    await elementUpdated(el);
    expect(counterText(el)).to.contain("2 of 2");
    el.close();
  });

  it("omits the pager for a single-image gallery", async () => {
    const el = await fixture<FluidLightbox>(html`
      <fluid-lightbox><img src="a.png" alt="Alpha" /></fluid-lightbox>
    `);
    await aTimeout(0);
    el.openAt(0);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="prev"]')).to.not.exist;
    expect(el.shadowRoot!.querySelector('[part="next"]')).to.not.exist;
    expect(el.shadowRoot!.querySelector('[part="counter"]')).to.not.exist;
    expect(el.shadowRoot!.querySelector('[part="close"]')).to.exist;
    el.close();
  });

  it("ignores navigation once every thumbnail is gone", async () => {
    const el = await gallery();
    el.openAt(0);
    await elementUpdated(el);
    const dialog = el.shadowRoot!.querySelector<HTMLDialogElement>("dialog")!;

    for (const img of [...el.querySelectorAll("img")]) img.remove();
    await aTimeout(0);
    await elementUpdated(el);

    let changes = 0;
    el.addEventListener("fluid-change", () => (changes += 1));
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }));
    await elementUpdated(el);
    expect(changes).to.equal(0);
    expect(dialog.open).to.be.true;
    el.close();
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
