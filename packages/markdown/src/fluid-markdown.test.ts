import {
  expect,
  fixture,
  html,
  elementUpdated,
  oneEvent,
  aTimeout,
  waitUntil
} from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidMarkdown } from "./fluid-markdown.js";

function output(el: FluidMarkdown): HTMLElement {
  return el.shadowRoot!.querySelector('[part="base"]')!;
}

describe("<fluid-markdown>", () => {
  it("passes an a11y audit for rendered document content", async () => {
    const el = await fixture<FluidMarkdown>(html`
      <fluid-markdown value=${"## Release notes\n\nProduction-ready content."}></fluid-markdown>
    `);
    await elementUpdated(el);
    await aTimeout(0);
    await expect(el).to.be.accessible();
  });

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
    const url = "data:text/markdown," + encodeURIComponent("# From remote");
    const el = await fixture<FluidMarkdown>(html`<fluid-markdown src=${url}></fluid-markdown>`);
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

  it("renders non-Error fetch rejections as useful failure details", async () => {
    const originalFetch = window.fetch;
    window.fetch = async () => Promise.reject("network unavailable");
    try {
      const el = await fixture<FluidMarkdown>(
        html`<fluid-markdown src="https://caller.example/unavailable.md"></fluid-markdown>`
      );
      await waitUntil(() => output(el).getAttribute("role") === "alert");
      expect(output(el).textContent).to.contain("Failed to load markdown: network unavailable");
    } finally {
      window.fetch = originalFetch;
    }
  });

  it("localizes a raw failure detail live without refetching or emitting render", async () => {
    const originalFetch = window.fetch;
    const detail = '<raw & "detail"> </div><script>caller()</script>';
    let fetches = 0;
    window.fetch = async () => {
      fetches++;
      throw new Error(detail);
    };
    try {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="ar">
          <fluid-markdown src="https://caller.example/unusual.md"></fluid-markdown>
        </div>
      `);
      const el = wrapper.querySelector<FluidMarkdown>("fluid-markdown")!;
      await waitUntil(() => output(el).getAttribute("role") === "alert");
      const error = output(el);
      const events: Event[] = [];
      el.addEventListener("fluid-render", (event) => events.push(event));
      expect(error.dir).to.equal("rtl");
      expect(error.textContent!.trim()).to.equal(`تعذر تحميل Markdown: ${detail}`);
      expect(error.querySelector("script")).to.equal(null);

      wrapper.lang = "fr-CA";
      await aTimeout(0);
      await el.updateComplete;
      expect(output(el)).to.equal(error);
      expect(error.dir).to.equal("ltr");
      expect(error.textContent!.trim()).to.equal(`Échec du chargement du Markdown : ${detail}`);
      expect(el.src).to.equal("https://caller.example/unusual.md");
      expect(fetches).to.equal(1);
      expect(events).to.deep.equal([]);
    } finally {
      window.fetch = originalFetch;
    }
  });

  it("changes only inherited direction for rendered application Markdown", async () => {
    const source = '## Caller \\<heading\\> & text\n\n<a href="/caller?q=1">Caller body</a>';
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-markdown .value=${source}></fluid-markdown></div>
    `);
    const el = wrapper.querySelector<FluidMarkdown>("fluid-markdown")!;
    await aTimeout(0);
    await el.updateComplete;
    const content = output(el);
    const heading = content.querySelector("h2")!;
    const rendered = content.innerHTML;
    const events: Event[] = [];
    el.addEventListener("fluid-render", (event) => events.push(event));
    expect(content.dir).to.equal("rtl");
    expect(heading.textContent).to.equal("Caller <heading> & text");
    expect(content.querySelector("a")!.getAttribute("href")).to.equal("/caller?q=1");

    wrapper.lang = "nl-BE";
    await aTimeout(0);
    await el.updateComplete;
    expect(output(el)).to.equal(content);
    expect(content.querySelector("h2")).to.equal(heading);
    expect(content.innerHTML).to.equal(rendered);
    expect(content.dir).to.equal("ltr");
    expect(el.value).to.equal(source);
    expect(events).to.deep.equal([]);
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
        html`<fluid-markdown value=${"<script>window.__xss=1</" + "script>"}></fluid-markdown>`
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
