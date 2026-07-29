import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidInclude } from "./fluid-include.js";

// Self-contained data: URLs so tests don't depend on the dev server.
const fragment = (markup: string) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(markup)}`;

const okSrc = fragment(`<p class="frag">Hello from the include.</p>`);
const scriptSrc = fragment(
  `<p class="frag">With script</p><script>window.__fluidIncludeRan = true;</script>`
);
const badSrc = "https://this-host-definitely-does-not-exist.invalid/fragment.html";

describe("<fluid-include>", () => {
  it("fetches and injects the markup, then fires fluid-load with detail.src", async () => {
    const el = await fixture<FluidInclude>(html`<fluid-include src=${okSrc}></fluid-include>`);
    const ev = await oneEvent(el, "fluid-load");
    await elementUpdated(el);
    expect(ev.detail.src).to.equal(okSrc);
    const container = el.shadowRoot!.querySelector(".content")!;
    expect(container.querySelector(".frag")).to.exist;
    expect(container.textContent).to.contain("Hello from the include.");
  });

  it("fires fluid-error with detail.src when the fetch fails", async () => {
    const el = await fixture<FluidInclude>(html`<fluid-include src=${badSrc}></fluid-include>`);
    const ev = await oneEvent(el, "fluid-error");
    expect(ev.detail.src).to.equal(badSrc);
  });

  it("shows the default slot until the include is loaded", async () => {
    const el = await fixture<FluidInclude>(
      html`<fluid-include src=${okSrc}><span>Loading…</span></fluid-include>`
    );
    // Before load completes the fallback slot is rendered.
    expect(el.shadowRoot!.querySelector("slot")).to.exist;
    await oneEvent(el, "fluid-load");
    await elementUpdated(el);
    // Once loaded the fallback slot is removed.
    expect(el.shadowRoot!.querySelector("slot")).to.not.exist;
  });

  it("does NOT execute scripts without allow-scripts", async () => {
    delete (window as unknown as { __fluidIncludeRan?: boolean }).__fluidIncludeRan;
    const el = await fixture<FluidInclude>(html`<fluid-include src=${scriptSrc}></fluid-include>`);
    await oneEvent(el, "fluid-load");
    await aTimeout(20);
    expect((window as unknown as { __fluidIncludeRan?: boolean }).__fluidIncludeRan).to.be.undefined;
  });

  it("executes scripts when allow-scripts is set", async () => {
    delete (window as unknown as { __fluidIncludeRan?: boolean }).__fluidIncludeRan;
    const el = await fixture<FluidInclude>(
      html`<fluid-include src=${scriptSrc} allow-scripts></fluid-include>`
    );
    await oneEvent(el, "fluid-load");
    await aTimeout(20);
    expect((window as unknown as { __fluidIncludeRan?: boolean }).__fluidIncludeRan).to.be.true;
  });

  it("does not inject markup after the element is removed mid-fetch (lifecycle)", async () => {
    const el = await fixture<FluidInclude>(html`<fluid-include src=${okSrc}></fluid-include>`);
    const container = el.shadowRoot!.querySelector(".content")!;
    // Remove synchronously, before the in-flight fetch resolves.
    el.remove();
    await aTimeout(50);
    // The aborted load must never write into the detached element.
    expect(container.querySelector(".frag")).to.not.exist;
    expect(container.innerHTML).to.equal("");
  });
});
