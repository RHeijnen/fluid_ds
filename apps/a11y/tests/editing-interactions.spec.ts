import { test, expect } from "@playwright/test";
import type { FluidRichTextEditor } from "../../../packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.js";
import type { FluidKanban } from "../../../packages/kanban/src/components/kanban/fluid-kanban.js";

test("editor native typing, selection formatting, readonly and reconnect preserve the value contract", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=quality-editing-interaction-contracts--editor-keyboard-fixture&viewMode=story");
  const editor = page.locator("fluid-rich-text-editor");
  const textbox = page.getByRole("textbox", { name: "Project note" });
  const bold = page.getByRole("button", { name: "Bold", exact: true });
  await expect(textbox).toBeVisible();
  await editor.evaluate((element) => {
    element.addEventListener("fluid-change", (event) => {
      element.setAttribute("data-changes", String(Number(element.getAttribute("data-changes") ?? 0) + 1));
      element.setAttribute("data-last-value", (event as CustomEvent<{ value: string }>).detail.value);
    });
  });
  await page.getByRole("button", { name: "Before editor" }).focus();
  await page.keyboard.press("Tab");
  await expect(bold).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(textbox).toBeFocused();
  await page.keyboard.type("Hello world");
  await page.keyboard.press("Control+A");
  const beforeFormat = Number(await editor.getAttribute("data-changes"));
  await bold.click();
  await expect(textbox.locator("b,strong")).toHaveText("Hello world");
  await expect(editor).toHaveAttribute("data-changes", String(beforeFormat + 1));
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await textbox.focus();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+Tab");
  await expect(bold).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Italic", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(textbox.locator("i,em")).toHaveText("Hello world");
  const formatted = await editor.evaluate((element) => (element as FluidRichTextEditor).value);
  await page.getByRole("button", { name: "Make readonly" }).click();
  await expect(textbox).toHaveAttribute("aria-readonly", "true");
  await expect(textbox).toHaveAttribute("contenteditable", "false");
  await expect(bold).toBeDisabled();
  await textbox.focus();
  await page.keyboard.type("Must not edit");
  expect(await editor.evaluate((element) => (element as FluidRichTextEditor).value)).toBe(formatted);
  await page.getByRole("button", { name: "Load untrusted HTML" }).click();
  await expect(textbox.locator("a")).not.toHaveAttribute("href");
  await expect(textbox.locator("a")).not.toHaveAttribute("onclick");
  await expect(textbox.locator("strong")).toHaveText("Safe content");
  await page.getByRole("button", { name: "Edit note", exact: true }).click();
  await expect(textbox).toHaveAttribute("contenteditable", "true");
  await page.getByRole("button", { name: "Reconnect editor" }).click();
  const beforeReconnectEdit = Number(await editor.getAttribute("data-changes"));
  // Exercise native editing after reconnect. fill() selects content through
  // an injected helper, which does not replace this shadow-root selection in WebKit.
  await textbox.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("After reconnect");
  await expect(textbox).toHaveText("After reconnect");
  const reconnectedHtml = await textbox.innerHTML();
  expect(await editor.evaluate((element) => (element as FluidRichTextEditor).value)).toBe(reconnectedHtml);
  await expect(editor).toHaveAttribute("data-last-value", reconnectedHtml);
  expect(Number(await editor.getAttribute("data-changes"))).toBeGreaterThan(beforeReconnectEdit);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After editor", exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test("kanban native keyboard cancellation and click move controls keep focus and event data", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=quality-editing-interaction-contracts--kanban-keyboard-fixture&viewMode=story");
  const board = page.locator("fluid-kanban");
  const alpha = board.locator('[data-card-id="alpha"]');
  await expect(alpha).toBeVisible();
  await board.evaluate((element) => {
    element.addEventListener("fluid-move", (event) => {
      const events = JSON.parse(element.getAttribute("data-moves") ?? "[]") as unknown[];
      events.push((event as CustomEvent).detail);
      element.setAttribute("data-moves", JSON.stringify(events));
    });
  });
  await page.getByRole("button", { name: "Before board" }).focus();
  await page.keyboard.press("Tab");
  await expect(alpha).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await expect(board.getByRole("group", { name: "In progress", exact: true }).locator('[data-card-id="alpha"]')).toBeVisible();
  await expect(alpha).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(board.getByRole("group", { name: "To do", exact: true }).locator('[data-card-id="alpha"]')).toBeVisible();
  await expect(alpha).toBeFocused();
  await expect(alpha).toHaveAttribute("aria-grabbed", "false");
  await alpha.getByRole("button", { name: "Move to next column: Alpha", exact: true }).click();
  await expect(alpha).toBeFocused();
  await expect(board.getByRole("status")).toContainText("Moved Alpha to In progress, position 1 of 2.");
  expect(JSON.parse((await board.getAttribute("data-moves"))!)).toEqual([
    { cardId: "alpha", fromColumn: "todo", toColumn: "doing", index: 0 },
    { cardId: "alpha", fromColumn: "doing", toColumn: "todo", index: 0 },
    { cardId: "alpha", fromColumn: "todo", toColumn: "doing", index: 0 }
  ]);
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Reconnect board" }).click();
  await expect(alpha).toHaveAttribute("aria-grabbed", "false");
  await alpha.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  expect(await board.evaluate((element) => (element as FluidKanban).columns[1]!.cards.map((card) => card.id))).toEqual(["charlie", "alpha"]);
  expect(errors).toEqual([]);
});

test("kanban actual pointer drag reorders before the target card", async ({ page }) => {
  await page.goto("/iframe.html?id=quality-editing-interaction-contracts--kanban-keyboard-fixture&viewMode=story");
  const board = page.locator("fluid-kanban");
  const alpha = board.locator('[data-card-id="alpha"]');
  const bravo = board.locator('[data-card-id="bravo"]');
  await expect(alpha).toBeVisible();
  await bravo.dragTo(alpha, { sourcePosition: { x: 30, y: 16 }, targetPosition: { x: 30, y: 16 } });
  await expect.poll(() => board.evaluate((element) => (element as FluidKanban).columns[0]!.cards.map((card) => card.id))).toEqual(["bravo", "alpha"]);
  await expect(bravo).toBeFocused();
  await expect(board.getByRole("status")).toContainText("Moved Bravo to To do, position 1 of 2.");
});
