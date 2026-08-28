import { test, expect } from "@playwright/test";
import type { FluidTable } from "../../../packages/table/src/components/table/fluid-table.js";
import type { FluidInfiniteTable } from "../../../packages/table/src/components/infinite-table/fluid-infinite-table.js";

test("data table preserves stable selection through native sorting and a filtered dataset", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=table-data-table--selectable&viewMode=story");
  await expect(page.getByRole("table")).toBeVisible();
  const table = page.locator("fluid-table");
  await table.evaluate((host) => {
    const element = host as FluidTable;
    element.caption = "Contributors";
    element.columns = [
      { key: "name", label: "Name", sortable: true },
      { key: "score", label: "Score", sortable: true }
    ];
    element.rows = [
      { id: "c", name: "Charlie", score: 10 },
      { id: "a", name: "Alice", score: 2 },
      { id: "b", name: "Bob", score: null }
    ];
    element.addEventListener("fluid-selection-change", (event) =>
      element.setAttribute("data-selected", JSON.stringify((event as CustomEvent).detail.selected))
    );
    const before = document.createElement("button");
    before.textContent = "Before contributors";
    const after = document.createElement("button");
    after.textContent = "After contributors";
    element.before(before);
    element.after(after);
  });
  await page.getByRole("button", { name: "Before contributors" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox", { name: "Select all rows" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const score = page.getByRole("button", { name: "Score", exact: true });
  await expect(score).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("columnheader", { name: "Score" })).toHaveAttribute(
    "aria-sort",
    "ascending"
  );
  await expect(table.locator("tbody tr").first()).toContainText("Alice");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("checkbox", { name: "Select row 2", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(table).toHaveAttribute("data-selected", '["a"]');
  await expect(page.getByRole("checkbox", { name: "Select all rows" })).toBeChecked({
    indeterminate: true
  });
  await score.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("columnheader", { name: "Score" })).toHaveAttribute(
    "aria-sort",
    "descending"
  );
  await expect(table.locator("tbody tr").first()).toContainText("Charlie");
  await expect(table.locator("tbody tr").last()).toContainText("Bob");
  await expect(page.getByRole("checkbox", { name: "Select row 2", exact: true })).toBeChecked();
  await table.evaluate((host) => {
    (host as FluidTable).rows = (host as FluidTable).rows.filter((row) => row["id"] === "a");
  });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "Select all rows" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Select all rows" }).focus();
  await page.keyboard.press("Space");
  await expect(table).toHaveAttribute("data-selected", "[]");
  expect(errors).toEqual([]);
});

test("infinite table supports native row actions, column dialog, window updates and page requests", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=table-infinite-table--template-columns&viewMode=story");
  await expect(page.getByRole("table")).toBeVisible();
  const table = page.locator("fluid-infinite-table");
  await table.evaluate((host) => {
    const previous = host as FluidInfiniteTable;
    const element = document.createElement("fluid-infinite-table") as FluidInfiniteTable;
    element.caption = "Projects";
    element.clickable = true;
    element.configurable = true;
    element.scrollMode = "container";
    element.rowHeight = 64;
    element.overscan = 2;
    element.style.setProperty("--fluid-infinite-table-height", "300px");
    element.columns = [
      { key: "name", label: "Name", sortable: true },
      { key: "score", label: "Score" },
      {
        key: "action",
        label: "Action",
        renderCell: ({ row }) => {
          const button = document.createElement("button");
          button.textContent = `Open ${row["name"]}`;
          button.addEventListener("click", () =>
            element.setAttribute("data-opened", String(row["id"]))
          );
          return button;
        }
      }
    ];
    element.rows = Array.from({ length: 100 }, (_, id) => ({
      id,
      name: `Project ${id}`,
      score: id
    }));
    element.total = 100;
    element.addEventListener("fluid-row-click", (event) => {
      element.setAttribute("data-row-click", JSON.stringify((event as CustomEvent).detail.row.id));
      element.setAttribute(
        "data-row-clicks",
        String(Number(element.getAttribute("data-row-clicks") ?? 0) + 1)
      );
    });
    element.addEventListener("fluid-load-more", (event) => {
      element.setAttribute("data-offset", String((event as CustomEvent).detail.offset));
      element.setAttribute(
        "data-loads",
        String(Number(element.getAttribute("data-loads") ?? 0) + 1)
      );
      element.hasMore = false;
      element.rows = [...element.rows, { id: "next", name: "Next page result", score: 2 }];
      element.total = element.rows.length;
    });
    previous.replaceWith(element);
  });
  const first = table.locator('tr[data-row-key="0"]');
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(table).toHaveAttribute("data-row-click", "0");
  await first.getByRole("button", { name: "Open Project 0" }).focus();
  await page.keyboard.press("Space");
  await expect(table).toHaveAttribute("data-opened", "0");
  await expect(table).toHaveAttribute("data-row-clicks", "1");
  const columns = page.getByRole("button", { name: "Columns", exact: true });
  await columns.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Table columns" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("checkbox", { name: "Score", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(table.locator("th[data-column]")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(columns).toBeFocused();
  const viewport = table.locator(".viewport");
  await viewport.hover();
  // Firefox caps one wheel event to roughly a viewport. Exercise repeated
  // native scrolling until a genuinely different, deep data window appears.
  for (let gesture = 0; gesture < 8; gesture++) {
    if (Number(await table.locator("tr[data-row]").first().getAttribute("data-row-key")) > 10)
      break;
    const previousScroll = await viewport.evaluate((element) => element.scrollTop);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(previousScroll);
  }
  await expect
    .poll(async () =>
      Number(await table.locator("tr[data-row]").first().getAttribute("data-row-key"))
    )
    .toBeGreaterThan(10);
  expect(await table.locator("tr[data-row]").count()).toBeLessThan(20);
  // Read key and index atomically: native wheel momentum can replace the window
  // between two protocol calls. Every visible row must keep its absolute index.
  await expect
    .poll(() =>
      table
        .locator("tr[data-row]")
        .evaluateAll(
          (rows) =>
            rows.length > 0 &&
            rows.every(
              (row) =>
                Number(row.getAttribute("aria-rowindex")) ===
                Number(row.getAttribute("data-row-key")) + 2
            )
        )
    )
    .toBe(true);
  await expect(table.getByRole("table")).toHaveAttribute("aria-rowcount", "101");
  await table.evaluate((host) => {
    const element = host as FluidInfiniteTable;
    element.rows = [{ id: "match", name: "Only match", score: 1 }];
    element.total = 1;
  });
  await expect(table.locator("tr[data-row]")).toHaveCount(1);
  await expect(table.locator("tr[data-row]")).toHaveAttribute("aria-rowindex", "2");
  await expect(table.locator("tr[data-row]")).toContainText("Only match");
  await table.evaluate((host) => {
    (host as FluidInfiniteTable).hasMore = true;
  });
  await expect(table).toHaveAttribute("data-offset", "1");
  await expect(table).toHaveAttribute("data-loads", "1");
  await expect(table.locator("tr[data-row]")).toHaveCount(2);
  await expect(table.locator("tr[data-row]").last()).toContainText("Next page result");
  expect(errors).toEqual([]);
});
