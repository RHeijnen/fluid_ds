import { expect, type ElementHandle, type Page } from "@playwright/test";
import { prepareFixture, type BrowserFixture } from "../../a11y/tests/fixture-helpers.js";

export type VisualFixture = {
  id: string;
  tags: readonly string[];
  fixtures: readonly (BrowserFixture & {
    focusTarget?: {
      selector: string;
      accessibleName: string;
      modality: "keyboard";
    };
    settleMethod?: "stop" | "finishChartAnimation";
  })[];
};

export async function prepareVisualFixture(page: Page, fixture: VisualFixture, timeout = 5000) {
  const selectedTags = fixture.fixtures.map((entry) => entry.tag);
  if (
    new Set(fixture.tags).size !== fixture.tags.length ||
    new Set(selectedTags).size !== selectedTags.length ||
    fixture.tags.length !== selectedTags.length ||
    fixture.tags.some((tag) => !selectedTags.includes(tag)) ||
    fixture.fixtures.some((entry) => entry.storyId !== fixture.id)
  ) {
    throw new Error(`${fixture.id} has inconsistent visual element attribution`);
  }
  // Multiple elements may share the same action-created fixture. Activate its
  // setup once, then require every attributed element instead of duplicating it.
  const setup = new Set(fixture.fixtures.flatMap((entry) => [...entry.setupButtons]));
  for (const name of setup) {
    await page
      .locator("#storybook-root")
      .getByRole("button", { name, exact: true })
      .click({ timeout });
  }
  const hosts: {
    tag: string;
    handle: ElementHandle<SVGElement | HTMLElement>;
    focusTarget?: VisualFixture["fixtures"][number]["focusTarget"];
    focusHandle?: ElementHandle<SVGElement | HTMLElement>;
    settleMethod?: VisualFixture["fixtures"][number]["settleMethod"];
  }[] = [];
  for (const entry of fixture.fixtures) {
    const host = await prepareFixture(page, { ...entry, setupButtons: [] }, timeout);
    const handle = await host.elementHandle();
    if (!handle) throw new Error(`${fixture.id} lost ${entry.tag} during visual setup`);
    hosts.push({
      tag: entry.tag,
      handle,
      focusTarget: entry.focusTarget,
      settleMethod: entry.settleMethod
    });
  }
  for (const { handle, settleMethod } of hosts) {
    if (settleMethod === "stop") {
      await handle.evaluate((element) => {
        const controller = element as HTMLElement & { stop?: () => void };
        if (typeof controller.stop !== "function") throw new Error("Missing deterministic stop()");
        controller.stop();
      });
    } else if (settleMethod === "finishChartAnimation") {
      await handle.evaluate(async (element) => {
        const controller = element as HTMLElement & {
          instance?: {
            stop?: () => void;
            update?: (mode?: string) => void;
          } | null;
          updateComplete?: Promise<unknown>;
        };
        const chart = controller.instance;
        if (typeof chart?.stop !== "function" || typeof chart.update !== "function") {
          throw new Error("Missing live Chart.js instance");
        }
        chart.stop();
        chart.update("none");
        await controller.updateComplete;
      });
    }
  }
  const focused = hosts.filter(({ focusTarget }) => focusTarget);
  if (focused.length > 1) throw new Error(`${fixture.id} has multiple focus targets`);
  if (focused[0]?.focusTarget) {
    await page.keyboard.press("Tab");
    const { handle, focusTarget, tag } = focused[0];
    await expect
      .poll(
        () =>
          handle.evaluate((host, target) => {
            const active = host.shadowRoot?.activeElement;
            return {
              hostActive: document.activeElement === host,
              targetMatches: active?.matches(target.selector) ?? false,
              focusVisible: active?.matches(":focus-visible") ?? false
            };
          }, focusTarget),
        { message: `${tag} must receive real keyboard focus on the attributed target`, timeout }
      )
      .toEqual({
        hostActive: true,
        targetMatches: true,
        focusVisible: true
      });
    const namedTarget = page
      .locator("#storybook-root")
      .getByRole("button", { name: focusTarget.accessibleName, exact: true });
    await expect(namedTarget).toHaveCount(1);
    const focusHandle = await namedTarget.elementHandle();
    if (!focusHandle) throw new Error(`${tag} lost its named focus target`);
    expect(
      await handle.evaluate(
        (host, target) => host.shadowRoot?.activeElement === target,
        focusHandle
      ),
      `${tag} accessible-name target must be the focused target`
    ).toBe(true);
    focused[0].focusHandle = focusHandle;
  }
  return {
    async assertAttached() {
      for (const { tag, handle, focusTarget, focusHandle } of hosts) {
        expect(
          await handle.evaluate((element) => element.isConnected),
          `${tag} must remain attached throughout the visual capture`
        ).toBe(true);
        if (focusTarget) {
          if (!focusHandle) throw new Error(`${tag} lost its attributed focus target`);
          expect(
            await handle.evaluate(
              (host, target) =>
                document.activeElement === host &&
                host.shadowRoot?.activeElement === target &&
                target.matches(":focus-visible"),
              focusHandle
            ),
            `${tag} must retain the attributed focus-visible target throughout capture`
          ).toBe(true);
        }
      }
    },
    async dispose() {
      await Promise.all(
        hosts.flatMap(({ handle, focusHandle }) => [handle.dispose(), focusHandle?.dispose()])
      );
    }
  };
}
