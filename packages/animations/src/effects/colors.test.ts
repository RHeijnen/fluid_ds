import { expect } from "@open-wc/testing";

import { RAINBOW, brandColors, defaultColors, pick, resolvePalette } from "./colors.js";

const BRAND_TOKENS = [
  "--fluid-color-brand-300",
  "--fluid-color-brand-400",
  "--fluid-color-brand-500",
  "--fluid-color-brand-600",
  "--fluid-color-brand-700"
];

function clearBrandTokens(): void {
  for (const token of BRAND_TOKENS) document.documentElement.style.removeProperty(token);
}

describe("colors: palettes", () => {
  it("hands out a fresh festive palette each call", () => {
    const first = defaultColors();
    const second = defaultColors();
    expect(first).to.deep.equal(second);
    expect(first).to.not.equal(second);
    first.length = 0;
    expect(defaultColors(), "a caller must not be able to empty the shared default").to.deep.equal(
      second
    );
  });

  it("exposes the six-band rainbow in flag order", () => {
    expect(RAINBOW).to.have.lengthOf(6);
    expect(RAINBOW[0]).to.equal("#e40303");
    expect(RAINBOW.at(-1)).to.equal("#750787");
  });

  it("resolvePalette copies a supplied palette and falls back when it is empty", () => {
    const supplied = ["#111111", "#222222"];
    const resolved = resolvePalette(supplied);
    expect(resolved).to.deep.equal(supplied);
    expect(resolved, "the caller's array must not be aliased").to.not.equal(supplied);

    expect(resolvePalette([])).to.deep.equal(defaultColors());
    expect(resolvePalette(undefined)).to.deep.equal(defaultColors());
  });

  it("pick returns a member of the palette", () => {
    const palette = ["#aa0000", "#00bb00", "#0000cc"];
    for (let i = 0; i < 40; i += 1) {
      expect(palette).to.include(pick(palette));
    }
  });

  it("pick still returns a usable color for an empty palette", () => {
    const color = pick([]);
    expect(color).to.be.a("string");
    expect(color).to.match(/^#[0-9a-f]{6}$/i);
  });
});

describe("colors: brandColors", () => {
  afterEach(clearBrandTokens);

  it("falls back to the default blue ramp when no brand tokens resolve", () => {
    clearBrandTokens();
    const colors = brandColors();
    expect(colors).to.have.lengthOf(5);
    expect(colors[0]).to.equal("#93c5fd");
    expect(colors.at(-1)).to.equal("#1d4ed8");
  });

  it("reads the live brand ramp so an opted-in burst follows the active brand", () => {
    const ramp = ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"];
    BRAND_TOKENS.forEach((token, index) => {
      document.documentElement.style.setProperty(token, ramp[index]!);
    });
    expect(brandColors()).to.deep.equal(ramp);
  });

  it("keeps only the brand steps that actually resolve", () => {
    document.documentElement.style.setProperty("--fluid-color-brand-500", "#0f766e");
    expect(brandColors()).to.deep.equal(["#0f766e"]);
  });
});
