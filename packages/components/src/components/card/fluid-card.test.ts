import { aTimeout, expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidCard } from "./fluid-card.js";

describe("<fluid-card>", () => {
  it("renders with default variant", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body</fluid-card>`);
    expect(el.variant).to.equal("elevated");
  });

  it("renders slot content", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <span slot="header">Title</span>
        <p>Body content</p>
        <span slot="footer">Footer</span>
      </fluid-card>
    `);
    expect(el.textContent).to.include("Title");
    expect(el.textContent).to.include("Body content");
    expect(el.textContent).to.include("Footer");
  });

  it("hides header/footer when empty", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body only</fluid-card>`);
    await el.updateComplete;
    const header = el.shadowRoot!.querySelector(".header")!;
    const footer = el.shadowRoot!.querySelector(".footer")!;
    expect(header.classList.contains("empty")).to.be.true;
    expect(footer.classList.contains("empty")).to.be.true;
  });

  it("reflects variant changes for CSS and external inspection", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body</fluid-card>`);
    el.variant = "outlined";
    await el.updateComplete;
    expect(el.getAttribute("variant")).to.equal("outlined");
  });

  it("updates empty slot state when header and footer content changes", async () => {
    const el = await fixture<FluidCard>(html`<fluid-card>Body</fluid-card>`);
    const header = document.createElement("strong");
    header.slot = "header";
    header.textContent = "Title";
    el.append(header);
    await el.updateComplete;
    await new Promise((resolve) => setTimeout(resolve));
    expect(el.shadowRoot!.querySelector(".header")!.classList.contains("empty")).to.be.false;
    header.remove();
    await new Promise((resolve) => setTimeout(resolve));
    expect(el.shadowRoot!.querySelector(".header")!.classList.contains("empty")).to.be.true;
  });

  it("recomputes header, body and footer visibility through replacement mutations", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <h2 slot="header">Original title</h2>
        <p>Original body</p>
        <button slot="footer">Original action</button>
      </fluid-card>
    `);
    const sections = () =>
      ["header", "body", "footer"].map((name) => el.shadowRoot!.querySelector(`.${name}`)!);
    expect(sections().every((section) => !section.classList.contains("empty"))).to.equal(true);

    el.replaceChildren();
    await aTimeout(0);
    expect(sections().every((section) => section.classList.contains("empty"))).to.equal(true);
    expect(sections().every((section) => getComputedStyle(section).display === "none")).to.equal(
      true
    );

    const title = document.createElement("h2");
    title.slot = "header";
    title.textContent = "Replacement title";
    const body = document.createElement("p");
    body.textContent = "Replacement body";
    const footer = document.createElement("button");
    footer.slot = "footer";
    footer.textContent = "Replacement action";
    el.append(title, body, footer);
    await aTimeout(0);
    expect(sections().every((section) => !section.classList.contains("empty"))).to.equal(true);
  });

  it("preserves composed focus order as nested actions are replaced across slots", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <div slot="header"><button id="header-action">Header action</button></div>
        <div><a id="body-action" href="#body">Body action</a></div>
        <div slot="footer"><button id="footer-action">Footer action</button></div>
      </fluid-card>
    `);
    const focusOrder = () =>
      [...el.querySelectorAll<HTMLElement>("button,a[href]")].map((action) => action.id);
    expect(focusOrder()).to.deep.equal(["header-action", "body-action", "footer-action"]);

    const replacement = document.createElement("button");
    replacement.id = "replacement-header-action";
    replacement.textContent = "Replacement header action";
    el.querySelector("[slot=header]")!.replaceChildren(replacement);
    await aTimeout(0);
    expect(focusOrder()).to.deep.equal([
      "replacement-header-action",
      "body-action",
      "footer-action"
    ]);
  });

  it("reflows long section content inside a narrow card", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card style="width: 160px;">
        <strong slot="header">VeryLongUnbrokenCardHeadingThatMustWrap</strong>
        <span>VeryLongUnbrokenCardBodyThatMustWrap</span>
        <span slot="footer">VeryLongUnbrokenCardFooterThatMustWrap</span>
      </fluid-card>
    `);
    for (const section of el.shadowRoot!.querySelectorAll<HTMLElement>(".header,.body,.footer")) {
      expect(getComputedStyle(section).overflowWrap).to.equal("anywhere");
      expect(section.scrollWidth).to.be.at.most(section.clientWidth);
    }
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidCard>(html`
      <fluid-card>
        <h3 slot="header">Card title</h3>
        <p>Content</p>
      </fluid-card>
    `);
    await expect(el).to.be.accessible();
  });
});
