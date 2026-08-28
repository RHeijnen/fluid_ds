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
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("aria-label")).to.equal("People");
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

  it("preserves list semantics as items are inserted, removed, and reconnected", async () => {
    const el = await fixture<FluidList>(html`<fluid-list label="Queue"></fluid-list>`);
    const item = document.createElement("fluid-list-item") as FluidListItem;
    item.textContent = "One";
    el.append(item);
    await item.updateComplete;
    expect(item.getAttribute("role")).to.equal("listitem");
    expect(el.shadowRoot!.querySelector("[role=list]")?.getAttribute("aria-label")).to.equal(
      "Queue"
    );

    item.remove();
    el.remove();
    document.body.append(el);
    el.append(item);
    await Promise.all([el.updateComplete, item.updateComplete]);
    expect(item.getAttribute("role")).to.equal("listitem");
    expect(el.shadowRoot!.querySelector("[role=list]")?.getAttribute("aria-label")).to.equal(
      "Queue"
    );
  });
});

describe("<fluid-list-item>", () => {
  it("keeps trailing actions outside the row button and never selects the row for them", async () => {
    const el = await fixture<FluidListItem>(html`
      <fluid-list-item interactive>
        Project
        <button slot="trailing">Archive project</button>
      </fluid-list-item>
    `);
    const slot = el.shadowRoot!.querySelector('slot[name="trailing"]')!;
    expect(slot.closest("button, a")).to.equal(null);
    let selections = 0;
    el.addEventListener("fluid-select", () => selections++);
    el.querySelector("button")!.click();
    expect(selections).to.equal(0);
    el.shadowRoot!.querySelector("button")!.click();
    expect(selections).to.equal(1);
  });

  it("resolves the configured focus outline instead of falling back to a UA outline", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive>Project</fluid-list-item>`
    );
    el.style.setProperty("--fluid-focus-ring-width", "4px");
    el.style.setProperty("--fluid-list-item-focus-ring-color", "rgb(1, 2, 3)");
    const button = el.shadowRoot!.querySelector("button")!;
    button.focus();
    expect(button.matches(":focus-visible")).to.be.true;
    expect(getComputedStyle(button).outlineStyle).to.equal("solid");
    expect(getComputedStyle(button).outlineWidth).to.equal("4px");
    expect(getComputedStyle(button).outlineColor).to.equal("rgb(1, 2, 3)");
  });

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

  it("withdraws a focused interactive row from the tab order when disabled", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive>One</fluid-list-item>`
    );
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button.base")!;
    button.focus();
    expect(el.shadowRoot!.activeElement?.tagName).to.equal("BUTTON");
    el.disabled = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector<HTMLButtonElement>("button.base")!.disabled).to.equal(true);
    expect(el.shadowRoot!.activeElement?.tagName ?? null).to.equal(null);
  });

  it("reconciles button, disabled link, active link, and passive modes", async () => {
    const el = await fixture<FluidListItem>(
      html`<fluid-list-item interactive>One</fluid-list-item>`
    );
    expect(el.shadowRoot!.querySelector("button.base")?.getAttribute("type")).to.equal("button");
    el.href = "/one";
    el.disabled = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("a.base")?.hasAttribute("href")).to.equal(false);
    expect(el.shadowRoot!.querySelector("a.base")?.getAttribute("aria-disabled")).to.equal("true");
    el.disabled = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("a.base")?.getAttribute("href")).to.equal("/one");
    el.href = null;
    el.interactive = false;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("button, a")).to.equal(null);
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
