import { expect, type Page } from "@playwright/test";

export type BrowserFixture = {
  tag: string;
  storyId: string;
  setupButtons: readonly string[];
};

export async function prepareFixture(page: Page, fixture: BrowserFixture, timeout = 5000) {
  const root = page.locator("#storybook-root");
  for (const name of fixture.setupButtons) {
    await root.getByRole("button", { name, exact: true }).click({ timeout });
  }
  const host = root.locator(fixture.tag).first();
  // Hidden utilities are valid fixtures, but absent or unregistered tags are not.
  await expect(
    host,
    `${fixture.storyId} must render ${fixture.tag} before it can be audited`
  ).toBeAttached({ timeout });
  await expect
    .poll(
      async () =>
        host.evaluate((element) => {
          const definition = customElements.get(element.localName);
          return Boolean(definition && element instanceof definition);
        }),
      { message: `${fixture.tag} must be upgraded before auditing`, timeout }
    )
    .toBe(true);
  await host.evaluate(async (element) => {
    await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
  });
  return host;
}
