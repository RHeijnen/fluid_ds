import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidBreadcrumb } from "./fluid-breadcrumb.js";
import type { FluidBreadcrumbItem } from "./fluid-breadcrumb-item.js";

describe("<fluid-breadcrumb>", () => {
  it("renders a nav landmark with aria-label", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>Current</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    expect(el.getAttribute("aria-label")).to.equal("Breadcrumb");
    expect(el.shadowRoot!.querySelector("nav")).to.exist;
  });

  it("auto-marks the last item as current when none is explicit", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    const items = el.querySelectorAll("fluid-breadcrumb-item");
    expect(items[items.length - 1]!.getAttribute("aria-current")).to.equal("page");
  });

  it("respects an explicit current attribute", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item current>Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/d">Docs</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    const items = el.querySelectorAll("fluid-breadcrumb-item");
    expect(items[0]!.getAttribute("aria-current")).to.equal("page");
    expect(items[1]!.hasAttribute("aria-current")).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("link color reads the --fluid-breadcrumb-item-* override ladder", async () => {
    const el = await fixture<FluidBreadcrumbItem>(
      html`<fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>`
    );
    el.style.setProperty("--fluid-breadcrumb-item-fg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const link = el.shadowRoot!.querySelector<HTMLElement>("a.label")!;
    expect(getComputedStyle(link).color).to.equal("rgb(1, 2, 3)");
  });
});
