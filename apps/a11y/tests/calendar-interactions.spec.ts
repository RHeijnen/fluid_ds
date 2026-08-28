import { test, expect } from "@playwright/test";

test("event chips and overflow have native keyboard access without a double day event", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-calendar-interaction-contracts--native-event-fixture&viewMode=story"
  );
  const calendar = page.locator("fluid-event-calendar");
  await calendar.evaluate((host) => {
    for (const type of ["fluid-event-click", "fluid-day-click"])
      host.addEventListener(type, (event) => {
        const seen = JSON.parse(host.getAttribute("data-events") ?? "[]") as unknown[];
        seen.push({ type, detail: (event as CustomEvent).detail });
        host.setAttribute("data-events", JSON.stringify(seen));
      });
  });
  const day = calendar.locator('[data-iso="2026-06-10"]');
  await day.focus();
  await page.keyboard.press("F2");
  await expect(page.getByRole("button", { name: "Release", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Review", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /Show all 3 events/ })).toBeFocused();
  await page.keyboard.press("Enter");
  const seen = JSON.parse((await calendar.getAttribute("data-events"))!);
  expect(seen.map((event: { type: string }) => event.type)).toEqual([
    "fluid-event-click",
    "fluid-event-click",
    "fluid-day-click"
  ]);
  expect(seen[0].detail.id).toBe("release");
  expect(seen[1].detail.id).toBe("review");
  expect(seen[2].detail.date).toBe("2026-06-10");
  await page.keyboard.press("Escape");
  await expect(day).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(calendar.locator('[data-iso="2026-07-10"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After calendar" })).toBeFocused();
  expect(errors).toEqual([]);
});

test("scheduler commits a real form value and excludes disabled controls from native Tab", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-calendar-interaction-contracts--native-scheduler-fixture&viewMode=story"
  );
  const scheduler = page.locator("fluid-scheduler");
  const booked = page.getByRole("radio", { name: "10:00, unavailable" });
  await expect(booked).toBeDisabled();
  // Intl implementations may pad a numeric hour; the submitted ISO value is exact below.
  await page.getByRole("radio", { name: /^0?9:00$/ }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("radio", { name: "11:00", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "11:00", exact: true })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  expect(
    await page
      .locator("form")
      .evaluate((form) => new FormData(form as HTMLFormElement).get("appointment"))
  ).toBe("2035-06-18T11:00");
  await scheduler.evaluate((element) => {
    (element as HTMLElement & { disabled: boolean }).disabled = true;
  });
  await page.getByRole("button", { name: "Before scheduler" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Reset appointment" })).toBeFocused();
  expect(
    await page
      .locator("form")
      .evaluate((form) => new FormData(form as HTMLFormElement).has("appointment"))
  ).toBe(false);
  await scheduler.evaluate((element) => {
    (element as HTMLElement & { disabled: boolean }).disabled = false;
  });
  await page.getByRole("button", { name: "Reset appointment" }).click();
  await expect(page.getByRole("radio", { name: /^0?9:00$/ })).toHaveAttribute(
    "aria-checked",
    "true"
  );
  expect(errors).toEqual([]);
});

test("scheduler rejects a selection that becomes booked and blocks loading interaction", async ({
  page
}) => {
  await page.goto(
    "/iframe.html?id=quality-calendar-interaction-contracts--native-scheduler-fixture&viewMode=story"
  );
  const scheduler = page.locator("fluid-scheduler");
  await scheduler.evaluate((element) => {
    (element as HTMLElement & { bookings: { start: string }[] }).bookings = [
      { start: "2035-06-18T09:00" }
    ];
  });
  await expect
    .poll(() =>
      scheduler.evaluate(
        (element) => (element as HTMLElement & { validity: ValidityState }).validity.customError
      )
    )
    .toBe(true);
  await scheduler.evaluate((element) => {
    (element as HTMLElement & { loading: boolean }).loading = true;
  });
  await expect(scheduler.locator('[part="base"][aria-busy]')).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("radio")).toHaveCount(3);
  for (const radio of await page.getByRole("radio").all()) await expect(radio).toBeDisabled();
});

test("availability edits emit one complete event and invalid drafts cannot escape", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/iframe.html?id=quality-calendar-interaction-contracts--native-availability-fixture&viewMode=story"
  );
  const editor = page.locator("fluid-availability-editor");
  await editor.evaluate((element) => {
    element.addEventListener("fluid-change", (event) => {
      const changes = JSON.parse(element.getAttribute("data-changes") ?? "[]");
      changes.push((event as CustomEvent).detail);
      element.setAttribute("data-changes", JSON.stringify(changes));
    });
  });
  const monday = page.getByRole("switch", { name: "Open on Monday" });
  await monday.focus();
  await page.keyboard.press("Space");
  await expect(monday).not.toBeChecked();
  let changes = JSON.parse((await editor.getAttribute("data-changes"))!);
  expect(changes).toHaveLength(1);
  expect(changes[0].availability).toMatchObject({
    stepMinutes: 15,
    bufferMinutes: 5,
    minNoticeMinutes: 90
  });
  await page.keyboard.press("Space");
  const opening = page.getByLabel("Monday opening time 1");
  await opening.fill("18:00");
  await opening.press("Tab");
  await expect(opening).toHaveAttribute("aria-invalid", "true");
  changes = JSON.parse((await editor.getAttribute("data-changes"))!);
  expect(changes).toHaveLength(2);
  await opening.fill("08:30");
  await opening.press("Tab");
  await expect(opening).toHaveAttribute("aria-invalid", "false");
  changes = JSON.parse((await editor.getAttribute("data-changes"))!);
  expect(changes).toHaveLength(3);
  expect(changes[2].availability.weekly[1][0]).toEqual({ start: "08:30", end: "17:00" });
  await editor.evaluate((element) => {
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
  });
  await expect(opening).toHaveValue("08:30");
  expect(errors).toEqual([]);
});
