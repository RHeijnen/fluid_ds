import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidSpinner } from "./fluid-spinner.js";

describe("<fluid-spinner>", () => {
  it("renders an SVG", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.shadowRoot!.querySelector("svg")).to.exist;
  });

  it("has role=progressbar with an accessible name", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    expect(el.getAttribute("role")).to.equal("progressbar");
    expect(el.getAttribute("aria-label")).to.equal("Loading");
  });

  it("respects a custom aria-label", async () => {
    const el = await fixture<FluidSpinner>(
      html`<fluid-spinner aria-label="Fetching"></fluid-spinner>`
    );
    expect(el.getAttribute("aria-label")).to.equal("Fetching");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder. */

  it("indicator stroke reads the --fluid-spinner-* override ladder", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);
    el.style.setProperty("--fluid-spinner-color", "rgb(1, 2, 3)");
    await el.updateComplete;
    const indicator = el.shadowRoot!.querySelector<SVGElement>(".indicator")!;
    expect(getComputedStyle(indicator).stroke).to.equal("rgb(1, 2, 3)");
  });

  /* Reduced-motion: the rotation must stop entirely, not just slow down. */

  it("kills the spin animation under prefers-reduced-motion: reduce", async () => {
    const el = await fixture<FluidSpinner>(html`<fluid-spinner></fluid-spinner>`);

    // The pure-CSS @media rule can't be toggled from JS, so assert the rule
    // itself zeroes out motion rather than merely slowing the infinite spin.
    const cssText = (el.shadowRoot!.adoptedStyleSheets ?? [])
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .join("\n");

    const reducedRule = cssText.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/
    )?.[0];

    expect(reducedRule, "reduced-motion @media block should exist").to.exist;
    // Motion is stopped, not just slowed: the animation shorthand resolves to
    // `none` (the CSSOM may serialize `animation: none` to its longhand form
    // `auto ease 0s 1 normal none running none`, so match the name token).
    expect(reducedRule).to.match(/animation:[^;}]*\bnone\b/);
    // ...and we never reintroduce an infinite loop or a long spin duration.
    expect(reducedRule).to.not.match(/infinite/);
    expect(reducedRule).to.not.match(/animation-duration/);
  });
});
