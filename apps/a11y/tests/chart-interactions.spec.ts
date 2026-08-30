import { test, expect } from "@playwright/test";
import type { FluidChart } from "../../../packages/charts/src/components/chart/fluid-chart.js";

const fixtures = [
  ["fluid-chart", "generic"],
  ["fluid-bar-chart", "bar"],
  ["fluid-line-chart", "line"],
  ["fluid-pie-chart", "pie"],
  ["fluid-doughnut-chart", "doughnut"],
  ["fluid-radar-chart", "radar"],
  ["fluid-polar-area-chart", "polar-area"],
  ["fluid-scatter-chart", "scatter"],
  ["fluid-bubble-chart", "bubble"]
] as const;

for (const [tag, fixture] of fixtures) {
  test(`${tag} native legend keyboard, visibility, data update and reconnect`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(
      `/iframe.html?id=quality-chart-interaction-contracts--${fixture}-keyboard-fixture&viewMode=story`
    );
    const chart = page.locator(tag);
    const arc = ["pie", "doughnut", "polar-area"].includes(fixture);
    const first = chart.getByRole("button", { name: arc ? "North" : "Revenue", exact: true });
    await expect(first).toBeVisible();
    await expect(chart.getByRole("img", { name: "Regional results" })).toBeVisible();
    await chart.evaluate((element) => {
      element.addEventListener("fluid-legend-change", (event) => {
        const detail = (event as CustomEvent<{ visible: boolean }>).detail;
        element.setAttribute(
          "data-toggles",
          `${element.getAttribute("data-toggles") ?? ""}${detail.visible ? "1" : "0"}`
        );
      });
    });
    const visible = () =>
      chart.evaluate((element) => {
        const host = element as FluidChart;
        return ["pie", "doughnut", "polarArea"].includes(host.type)
          ? host.instance!.getDataVisibility(0)
          : host.instance!.isDatasetVisible(0);
      });
    await page.getByRole("button", { name: "Before chart", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "false");
    expect(await visible()).toBe(false);
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    expect(await visible()).toBe(true);
    await first.click();
    expect(await visible()).toBe(false);
    await page.getByRole("button", { name: "Reconnect chart", exact: true }).click();
    await expect(first).toHaveAttribute("aria-pressed", "false");
    expect(await visible()).toBe(false);
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(chart).toHaveAttribute("data-toggles", "0101");
    const count = await chart.getByRole("button").count();
    for (let index = 0; index < count; index++) await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "After chart", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Update chart data", exact: true }).click();
    await expect(
      chart.getByRole("button", { name: arc ? "Updated North" : "Updated revenue", exact: true })
    ).toBeVisible();
    expect(
      await chart.evaluate((element) => {
        const value = (element as FluidChart).instance!.data.datasets[0]!.data[0];
        return typeof value === "number" ? value : (value as { y: number }).y;
      })
    ).toBe(9);
    await expect(chart.locator('[slot="fallback"]')).toContainText("North: 9");
    expect(errors).toEqual([]);
  });
}
