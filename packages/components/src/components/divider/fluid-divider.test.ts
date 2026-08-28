import { expect, fixture, html, elementUpdated } from "@open-wc/testing";
import { emulateMedia } from "@web/test-runner-commands";
import "./define.js";
import type { FluidDivider } from "./fluid-divider.js";

describe("<fluid-divider>", () => {
  it("renders with role=separator", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    expect(el.getAttribute("role")).to.equal("separator");
    expect(el.getAttribute("aria-orientation")).to.equal("horizontal");
  });

  it("defaults to horizontal", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    expect(el.orientation).to.equal("horizontal");
  });

  it("supports vertical orientation", async () => {
    const el = await fixture<FluidDivider>(
      html`<fluid-divider orientation="vertical"></fluid-divider>`
    );
    expect(el.orientation).to.equal("vertical");
    expect(el.getAttribute("aria-orientation")).to.equal("vertical");
  });

  it("re-syncs aria-orientation when orientation changes at runtime", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    expect(el.getAttribute("aria-orientation")).to.equal("horizontal");
    el.orientation = "vertical";
    await elementUpdated(el);
    expect(el.getAttribute("aria-orientation")).to.equal("vertical");
  });

  it("preserves a live accessible name while orientation changes", async () => {
    const el = await fixture<FluidDivider>(
      html`<fluid-divider aria-label="Section boundary"></fluid-divider>`
    );
    el.setAttribute("aria-label", "Results boundary");
    el.orientation = "vertical";
    await elementUpdated(el);
    expect(el.getAttribute("aria-label")).to.equal("Results boundary");
    expect(el.getAttribute("aria-orientation")).to.equal("vertical");
  });

  it("provides a visible system-color line in forced-colors mode", async () => {
    const initiallyForced = matchMedia("(forced-colors: active)").matches;
    try {
      await emulateMedia({ forcedColors: "active" });
      const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      expect(matchMedia("(forced-colors: active)").matches).to.equal(true);
      expect(getComputedStyle(el).backgroundColor).to.equal(canvasText);
      expect(el.getBoundingClientRect().height).to.be.greaterThan(0);
    } finally {
      await emulateMedia({ forcedColors: initiallyForced ? "active" : "none" });
    }
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidDivider>(html`<fluid-divider></fluid-divider>`);
    await expect(el).to.be.accessible();
  });
});
