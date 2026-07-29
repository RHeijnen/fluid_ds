import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidList } from "./fluid-list.js";
import type { FluidListItem } from "./fluid-list-item.js";

describe("<fluid-list>", () => {
  it("renders a role=list surface", async () => {
    const el = await fixture<FluidList>(html`
      <fluid-list><fluid-list-item>One</fluid-list-item></fluid-list>
    `);
    const base = el.shadowRoot!.querySelector(".base")!;
    expect(base.getAttribute("role")).to.equal("list");
  });

  it("forwards label to aria-label on the surface", async () => {
    const el = await fixture<FluidList>(html`
      <fluid-list label="People"><fluid-list-item>One</fluid-list-item></fluid-list>
    `);
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("aria-label")).to.equal(
      "People"
    );
  });

  it("does not emit an empty aria-label when no label is set", async () => {
    const el = await fixture<FluidList>(html`
      <fluid-list><fluid-list-item>One</fluid-list-item></fluid-list>
    `);
    expect(el.shadowRoot!.querySelector(".base")!.hasAttribute("aria-label")).to.be.false;
  });

  it("honors the --fluid-font-line-height-normal token (no phantom var)", async () => {
    // The real design-system token must drive line-height; the previously used
    // --fluid-line-height-normal is a phantom var and would leave this dead.
    const wrapper = await fixture(html`
      <div style="font-size: 16px; --fluid-font-line-height-normal: 3;">
        <fluid-list><fluid-list-item>One</fluid-list-item></fluid-list>
      </div>
    `);
    const el = wrapper.querySelector<FluidList>("fluid-list")!;
    await elementUpdated(el);
    // 3 (unitless) * 16px font-size => 48px resolved line-height.
    expect(getComputedStyle(el).lineHeight).to.equal("48px");
  });

  it("passes a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-focus-ring-color:#4f46e5; --fluid-motion:0;"
      >
        <fluid-list label="Team" bordered divided>
          <fluid-list-item>
            Ada
            <span slot="description">Owner</span>
            <span slot="trailing">Admin</span>
          </fluid-list-item>
          <fluid-list-item interactive>Alan</fluid-list-item>
          <fluid-list-item href="#x">Grace</fluid-list-item>
        </fluid-list>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});

describe("<fluid-list-item>", () => {
  it("has role=listitem on the host", async () => {
    const el = await fixture<FluidListItem>(html`<fluid-list-item>One</fluid-list-item>`);
    expect(el.getAttribute("role")).to.equal("listitem");
  });

  it("renders a plain div by default (no implicit button or link)", async () => {
    const el = await fixture<FluidListItem>(html`<fluid-list-item>One</fluid-list-item>`);
    expect(el.shadowRoot!.querySelector("button")).to.be.null;
    expect(el.shadowRoot!.querySelector("a")).to.be.null;
    expect(el.shadowRoot!.querySelector("div.base")).to.exist;
  });

  it("renders a button when interactive and fires fluid-select", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive>One</fluid-list-item>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button.base")!;
    expect(button).to.exist;
    setTimeout(() => button.click());
    const event = await oneEvent(el, "fluid-select");
    expect(event).to.exist;
  });

  it("does not fire fluid-select when interactive and disabled", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive disabled>One</fluid-list-item>`
    );
    let fired = false;
    el.addEventListener("fluid-select", () => (fired = true));
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button.base")!;
    expect(button.disabled).to.be.true;
    button.click();
    expect(fired).to.be.false;
  });

  it("renders an anchor when href is set", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item href="/about">About</fluid-list-item>`
    );
    const link = el.shadowRoot!.querySelector<HTMLAnchorElement>("a.base")!;
    expect(link).to.exist;
    expect(link.getAttribute("href")).to.equal("/about");
  });

  it("drops href and marks aria-disabled when a link row is disabled", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item href="/about" disabled>About</fluid-list-item>`
    );
    const link = el.shadowRoot!.querySelector<HTMLAnchorElement>("a.base")!;
    expect(link.hasAttribute("href")).to.be.false;
    expect(link.getAttribute("aria-disabled")).to.equal("true");
  });

  it("href takes precedence over interactive", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive href="/x">X</fluid-list-item>`
    );
    expect(el.shadowRoot!.querySelector("a.base")).to.exist;
    expect(el.shadowRoot!.querySelector("button.base")).to.be.null;
  });

  it("honors the --fluid-font-line-height-normal token on the row (no phantom var)", async () => {
    // Regression: the row previously read phantom --fluid-line-height-normal, so
    // the design-system token could never retheme it.
    const wrapper = await fixture(html`
      <div style="font-size: 16px; --fluid-font-line-height-normal: 3;">
        <fluid-list-item>One</fluid-list-item>
      </div>
    `);
    const el = wrapper.querySelector<FluidListItem>("fluid-list-item")!;
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    // 3 (unitless) * 16px font-size => 48px resolved line-height.
    expect(getComputedStyle(base).lineHeight).to.equal("48px");
  });

  it("exposes leading, description, and trailing slots", async () => {
    const el = await fixture<FluidListItem>(html`
      <fluid-list-item>
        <span slot="leading">L</span>
        Primary
        <span slot="description">Secondary</span>
        <span slot="trailing">T</span>
      </fluid-list-item>
    `);
    const slots = Array.from(el.shadowRoot!.querySelectorAll("slot")).map((s) =>
      s.getAttribute("name")
    );
    expect(slots).to.include("leading");
    expect(slots).to.include("description");
    expect(slots).to.include("trailing");
  });
});
