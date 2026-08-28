import { test, expect } from "@playwright/test";

test("Storybook loads every pinned font subset without external network access", async ({
  page,
  browserName
}, testInfo) => {
  const external: string[] = [];
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failed.push(request.url()));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      external.push(url.href);
      await route.abort();
    } else await route.continue();
  });
  await page.goto("/iframe.html?id=components-forms-select--with-disabled-option&viewMode=story");
  await expect(page.getByRole("combobox", { name: "Plan" })).toBeVisible();
  const result = await page.evaluate(async () => {
    const familyName = (face: FontFace) => face.family.replace(/^["']|["']$/g, "");
    const faces = [...document.fonts].filter((face) =>
      ["Inter", "JetBrains Mono"].includes(familyName(face))
    );
    await Promise.all(faces.map((face) => face.load()));
    await document.fonts.ready;
    // Reference fetches below must not fill holes in the stylesheet's requests.
    const assets = performance
      .getEntriesByType("resource")
      .map((resource) => resource.name)
      .filter((url) => url.includes("/fonts/") && url.endsWith(".woff2"));
    const context = document.createElement("canvas").getContext("2d")!;
    const measure = (family: string) => {
      context.font = `400 16px "${family}"`;
      return context.measureText("Fluid 0123456789 Résumé Über mañana").width;
    };
    const widths = ["Inter", "JetBrains Mono"].map(measure);
    // Compare against the pinned Latin bytes in this same browser/OS. Canvas
    // metrics are not portable across operating-system font implementations.
    const references = [];
    for (const [index, file] of [
      "UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2",
      "tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2"
    ].entries()) {
      const response = await fetch(`/fonts/${file}`);
      if (!response.ok) throw new Error(`Reference font request failed: ${file}`);
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const face = new FontFace(`FluidReference${index}`, bytes, {
        weight: index === 0 ? "100 900" : "400"
      });
      await face.load();
      document.fonts.add(face);
      try {
        references.push({ width: measure(face.family), sha256 });
      } finally {
        document.fonts.delete(face);
      }
    }
    return {
      faces: faces.map((face) => ({
        family: familyName(face),
        weight: face.weight,
        status: face.status
      })),
      assets,
      widths,
      references,
      fallbackWidth: measure("FluidMissingFontNegativeControl"),
      userAgent: navigator.userAgent
    };
  });
  // Preserve diagnostics even when a later assertion fails.
  await testInfo.attach("font-metrics", {
    body: JSON.stringify({ platform: process.platform, ...result }),
    contentType: "application/json"
  });
  expect(result.faces).toHaveLength(31);
  expect(result.faces.every((face) => face.status === "loaded")).toBe(true);
  expect(new Set(result.assets).size).toBe(13);
  expect(
    result.faces
      .filter((face) => face.family === "Inter")
      .every((face) => face.weight === "100 900")
  ).toBe(true);
  expect(
    new Set(
      result.faces.filter((face) => face.family === "JetBrains Mono").map((face) => face.weight)
    )
  ).toEqual(new Set(["400", "500", "600", "700"]));
  expect(result.references.map((reference) => reference.sha256)).toEqual([
    "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
    "83c005d49d8a6a50474c73a5a36ac0468076e9c4a29da7bdb14995d80560a5be"
  ]);
  for (const [index, reference] of result.references.entries()) {
    expect(result.widths[index]).toBeCloseTo(reference.width, 6);
    // A genuine missing-family measurement must not satisfy this fingerprint.
    expect(Math.abs(result.fallbackWidth - reference.width)).toBeGreaterThan(1);
  }
  // Retain the original Windows Chromium before/after-vendoring measurements
  // in their measured environment; they are not Linux or macOS baselines.
  if (browserName === "chromium" && process.platform === "win32") {
    expect(result.widths[0]).toBeCloseTo(306.6640625, 2);
    expect(result.widths[1]).toBeCloseTo(335.9996643066406, 2);
  }
  expect(external).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});
