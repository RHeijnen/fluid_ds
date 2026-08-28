import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { catalog } from "../.generated/catalog.js";
import { prepareFixture } from "./fixture-helpers.js";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

type AxeViolation = {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  nodes: Array<{ target: string[]; failureSummary?: string }>;
};

for (const fixture of catalog) {
  test(`${fixture.tag} has no browser-level accessibility violations`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto(`/iframe.html?id=${fixture.storyId}&viewMode=story`, {
      waitUntil: "domcontentloaded"
    });
    await page.waitForFunction(
      () => (document.getElementById("storybook-root")?.childElementCount ?? 0) > 0
    );
    const host = await prepareFixture(page, fixture);
    const auditedHost = await host.elementHandle();
    await page.evaluate(async () => {
      await document.fonts?.ready;
      const tags = new Set(
        [...document.querySelectorAll("*")]
          .map((element) => element.localName)
          .filter((tag) => tag.startsWith("fluid-"))
      );
      await Promise.all([...tags].map((tag) => customElements.whenDefined(tag)));
    });

    const storybookError = await page
      .locator("#storybook-root-error-display, #error-message")
      .first()
      .textContent()
      .catch(() => null);
    expect(
      storybookError?.trim() || null,
      `Storybook failed to render ${fixture.storyId}`
    ).toBeNull();

    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const axe = (
        globalThis as typeof globalThis & {
          axe: {
            run: (root: Element, options: object) => Promise<{ violations: AxeViolation[] }>;
          };
        }
      ).axe;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          const result = await axe.run(document.getElementById("storybook-root")!, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
            },
            resultTypes: ["violations"]
          });
          return result.violations;
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("Axe is already running")) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      throw new Error("Timed out waiting for Storybook's accessibility audit to finish.");
    });

    // Keep observing through axe and reject fixtures that disappear mid-audit.
    expect(
      await auditedHost!.evaluate((element) => element.isConnected),
      `${fixture.tag} must remain attached throughout the audit`
    ).toBe(true);
    expect(runtimeErrors, `Runtime errors in ${fixture.storyId}`).toEqual([]);
    expect(
      violations,
      violations
        .map(
          (violation) =>
            `${violation.id} (${violation.impact}): ${violation.help}\n` +
            violation.nodes
              .map((node) => `  ${node.target.join(" ")}\n  ${node.failureSummary ?? ""}`)
              .join("\n") +
            `\n  ${violation.helpUrl}`
        )
        .join("\n\n")
    ).toEqual([]);
  });
}
