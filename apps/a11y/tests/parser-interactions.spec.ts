import { test, expect } from "@playwright/test";

const parserFixture =
  "/iframe.html?id=quality-parser-interaction-contracts--native-parser-fixture&viewMode=story";
const mapperFixture =
  "/iframe.html?id=quality-parser-interaction-contracts--native-mapper-fixture&viewMode=story";
const people =
  "Name,Email Address,Age\nAda,ada@example.com,30\nDuplicate,ada@example.com,bad\nBo,bo@example.com,20";

test("file intake opens from the keyboard, parses actual CSV and exports cleaned rows", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(parserFixture);
  const intake = page.getByRole("button", { name: "Choose import file" });
  await intake.focus();
  const choosing = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (
    await choosing
  ).setFiles({ name: "people.csv", mimeType: "text/csv", buffer: Buffer.from(people) });
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(1);
  // The callout's text is slotted: inspect its accessible subtree, not DOM textContent.
  await expect.poll(() => page.getByRole("status").ariaSnapshot()).toContain("1 duplicate removed");
  await expect(page.getByRole("cell", { name: "Ada", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bo", exact: true })).toBeVisible();
  await page.locator("fluid-file-parser").evaluate((parser) => {
    parser.addEventListener("fluid-parse", (event) => {
      parser.setAttribute("data-result", JSON.stringify((event as CustomEvent).detail));
    });
  });
  await page.getByRole("button", { name: "Import 2 rows" }).focus();
  await page.keyboard.press("Space");
  const result = JSON.parse((await page.locator("fluid-file-parser").getAttribute("data-result"))!);
  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
  expect(result.rows).toEqual([
    { name: "Ada", email: "ada@example.com", age: 30 },
    { name: "Bo", email: "bo@example.com", age: 20 }
  ]);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("people.cleaned.csv");
  const stream = (await download.createReadStream())!;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain("Ada,ada@example.com,30");
  expect(csv).not.toContain("Duplicate");
  await page.getByRole("button", { name: "Reset", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(intake).toBeFocused();
  expect(errors).toEqual([]);
});

test("malformed JSON can recover and removing a file clears the parsed preview", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(parserFixture);
  const input = page.locator('fluid-file-parser input[type="file"]');
  await input.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{invalid")
  });
  await expect(page.getByRole("alert")).toHaveCount(1);
  await expect.poll(() => page.getByRole("alert").ariaSnapshot()).toContain("Invalid JSON");
  await expect(page.getByRole("table")).toHaveCount(0);
  await input.setInputFiles({
    name: "people.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(people)
  });
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Remove people.csv" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Choose import file" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("native mapper keyboard changes required validity and retains explicit source reuse", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(mapperFixture);
  const name = page.getByRole("combobox", { name: "Full name" });
  const email = page.getByRole("combobox", { name: "Email", exact: true });
  await name.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(name).toHaveValue("");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  expect(
    await name.evaluate((control) => (control as HTMLSelectElement).validity.valueMissing)
  ).toBe(true);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(name).toHaveValue("Name");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await email.selectOption("Name");
  expect(
    await page
      .locator("fluid-column-mapper")
      .evaluate(
        (mapper) => (mapper as HTMLElement & { mapping: Record<string, string | null> }).mapping
      )
  ).toEqual({ name: "Name", email: "Name", age: "Age" });
  await page.keyboard.press("Shift+Tab");
  await expect(name).toBeFocused();
  expect(errors).toEqual([]);
});
