import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidPagination } from "./fluid-pagination.js";

const pageButtons = (el: FluidPagination) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button.page"));

const prevButton = (el: FluidPagination) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>('button[part~="prev"]')!;

const nextButton = (el: FluidPagination) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>('button[part~="next"]')!;

describe("<fluid-pagination>", () => {
  it("renders a labelled navigation landmark", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5"></fluid-pagination>`
    );
    const nav = el.shadowRoot!.querySelector("nav")!;
    expect(nav).to.exist;
    expect(nav.getAttribute("aria-label")).to.equal("Pagination");
  });

  it("honors a custom label", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5" label="Results"></fluid-pagination>`
    );
    expect(el.shadowRoot!.querySelector("nav")!.getAttribute("aria-label")).to.equal(
      "Results"
    );
  });

  it("derives page count from total and page-size", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total="45" page-size="10"></fluid-pagination>`
    );
    // 45 / 10 = 5 pages. Small list shows every page.
    expect(pageButtons(el).map((b) => b.textContent?.trim())).to.deep.equal([
      "1",
      "2",
      "3",
      "4",
      "5"
    ]);
  });

  it("total-pages takes precedence over total", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total="999" page-size="10" total-pages="3"></fluid-pagination>`
    );
    expect(pageButtons(el)).to.have.lengthOf(3);
  });

  it("marks the current page with aria-current and no other", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5" page="3"></fluid-pagination>`
    );
    const current = pageButtons(el).filter((b) => b.getAttribute("aria-current") === "page");
    expect(current).to.have.lengthOf(1);
    expect(current[0]!.textContent?.trim()).to.equal("3");
  });

  it("truncates a long list with ellipses around the current page", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="20" page="10"></fluid-pagination>`
    );
    const ellipses = el.shadowRoot!.querySelectorAll('[part~="ellipsis"]');
    expect(ellipses).to.have.lengthOf(2);
    // First and last page always rendered.
    const labels = pageButtons(el).map((b) => b.textContent?.trim());
    expect(labels[0]).to.equal("1");
    expect(labels[labels.length - 1]).to.equal("20");
    expect(labels).to.include("10");
  });

  it("disables Previous on the first page", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="10" page="1"></fluid-pagination>`
    );
    expect(prevButton(el).disabled).to.be.true;
    expect(nextButton(el).disabled).to.be.false;
  });

  it("disables Next on the last page", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="10" page="10"></fluid-pagination>`
    );
    expect(nextButton(el).disabled).to.be.true;
    expect(prevButton(el).disabled).to.be.false;
  });

  it("fires fluid-page-change with the target page on a number click", async () => {
    // Small list (no truncation), so page 4 is reliably rendered. Select it by
    // its stable accessible name rather than visible text.
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5" page="1"></fluid-pagination>`
    );
    const fourth = el.shadowRoot!.querySelector<HTMLButtonElement>(
      'button.page[aria-label="Page 4"]'
    )!;
    expect(fourth).to.exist;
    setTimeout(() => fourth.click());
    const event = await oneEvent(el, "fluid-page-change");
    expect(event.detail.page).to.equal(4);
  });

  it("updates the reflected page after navigation", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="10" page="1"></fluid-pagination>`
    );
    nextButton(el).click();
    await elementUpdated(el);
    expect(el.page).to.equal(2);
    expect(el.getAttribute("page")).to.equal("2");
  });

  it("Previous and Next move by one page", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="10" page="5"></fluid-pagination>`
    );
    setTimeout(() => prevButton(el).click());
    const prevEvent = await oneEvent(el, "fluid-page-change");
    expect(prevEvent.detail.page).to.equal(4);

    el.page = 5;
    await elementUpdated(el);
    setTimeout(() => nextButton(el).click());
    const nextEvent = await oneEvent(el, "fluid-page-change");
    expect(nextEvent.detail.page).to.equal(6);
  });

  it("does not fire when clicking the current page", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="10" page="3"></fluid-pagination>`
    );
    let fired = false;
    el.addEventListener("fluid-page-change", () => (fired = true));
    pageButtons(el).find((b) => b.getAttribute("aria-current") === "page")!.click();
    expect(fired).to.be.false;
  });

  it("clamps an out-of-range page into the valid range", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5" page="99"></fluid-pagination>`
    );
    await elementUpdated(el);
    expect(el.page).to.equal(5);
  });

  it("each page button exposes an accessible name", async () => {
    const el = await fixture<FluidPagination>(
      html`<fluid-pagination total-pages="5" page="1"></fluid-pagination>`
    );
    expect(pageButtons(el)[0]!.getAttribute("aria-label")).to.equal("Page 1");
    expect(prevButton(el).getAttribute("aria-label")).to.equal("Previous page");
    expect(nextButton(el).getAttribute("aria-label")).to.equal("Next page");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidPagination>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-pagination total-pages="20" page="10"></fluid-pagination>
      </div>
    `);
    const pagination = el.querySelector<FluidPagination>("fluid-pagination")!;
    await elementUpdated(pagination);
    await aTimeout(20);
    await expect(pagination).to.be.accessible();
  });
});
