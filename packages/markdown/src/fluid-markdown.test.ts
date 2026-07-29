import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidMarkdown } from "./fluid-markdown.js";

function output(el: FluidMarkdown): HTMLElement {
  return el.shadowRoot!.querySelector('[part="base"]')!;
}

describe("<fluid-markdown>", () => {
  it("promotes inline default-slot text to source on connect", async () => {
    const el = await fixture<FluidMarkdown>(
      html`<fluid-markdown>### Inline heading</fluid-markdown>`
    );
    await elementUpdated(el);
    await aTimeout(0);
    expect(el.value).to.equal("### Inline heading");
    expect(output(el).querySelector("h3")).to.exist;
  });

  it("renders the value property", async () => {
    const el = await fixture<FluidMarkdown>(
      html`<fluid-markdown value="**bold** text"></fluid-markdown>`
    );
    await elementUpdated(el);
    await aTimeout(0);
    expect(output(el).querySelector("strong")).to.exist;
    expect(output(el).textContent).to.contain("bold");
  });

  it("renders source fetched from src", async () => {
    const url =
      "data:text/markdown," + encodeURIComponent("# From remote");
    const el = await fixture<FluidMarkdown>(
      html`<fluid-markdown src=${url}></fluid-markdown>`
    );
    await elementUpdated(el);
    await aTimeout(20);
    expect(output(el).querySelector("h1")?.textContent).to.equal("From remote");
  });

  it("fires fluid-render (bubbling + composed) on completion", async () => {
    // Render is async (await marked.parse), so attach the listener first, then
    // trigger a fresh render by changing the value, to avoid racing the initial
    // fluid-render fired during fixture setup.
    const el = await fixture<FluidMarkdown>(html`<fluid-markdown></fluid-markdown>`);
    const ended = oneEvent(el, "fluid-render");
    el.value = "hi";
    const ev = await ended;
    expect(ev).to.exist;
    expect(ev.bubbles).to.be.true;
    expect(ev.composed).to.be.true;
  });

  it("renders an error message when the fetch fails", async () => {
    const el = await fixture<FluidMarkdown>(
      html`<fluid-markdown src="http://127.0.0.1:0/missing.md"></fluid-markdown>`
    );
    await elementUpdated(el);
    await aTimeout(50);
    expect(output(el).textContent).to.contain("Failed to load markdown");
  });

  describe("sanitization (XSS)", () => {
    it("strips inline event handlers from rendered HTML by default", async () => {
      const el = await fixture<FluidMarkdown>(
        html`<fluid-markdown value=${'<img src="x" onerror="window.__xss=1">'}></fluid-markdown>`
      );
      await elementUpdated(el);
      await aTimeout(0);
      const img = output(el).querySelector("img");
      expect(img).to.exist;
      expect(img!.hasAttribute("onerror")).to.be.false;
    });

    it("removes script elements by default", async () => {
      const el = await fixture<FluidMarkdown>(
        html`<fluid-markdown value=${'<script>window.__xss=1</' + "script>"}></fluid-markdown>`
      );
      await elementUpdated(el);
      await aTimeout(0);
      expect(output(el).querySelector("script")).to.not.exist;
    });

    it("strips javascript: URLs from links by default", async () => {
      const el = await fixture<FluidMarkdown>(
        html`<fluid-markdown value=${'<a href="javascript:alert(1)">x</a>'}></fluid-markdown>`
      );
      await elementUpdated(el);
      await aTimeout(0);
      const link = output(el).querySelector("a");
      expect(link).to.exist;
      expect(link!.hasAttribute("href")).to.be.false;
    });

    it("preserves raw markup when trusted is set", async () => {
      const el = await fixture<FluidMarkdown>(
        html`<fluid-markdown
          trusted
          value=${'<a href="javascript:void(0)">x</a>'}
        ></fluid-markdown>`
      );
      await elementUpdated(el);
      await aTimeout(0);
      const link = output(el).querySelector("a");
      expect(link!.getAttribute("href")).to.equal("javascript:void(0)");
    });
  });
});
