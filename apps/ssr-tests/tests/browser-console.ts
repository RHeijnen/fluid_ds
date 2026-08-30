import type { Page, TestInfo } from "@playwright/test";

export const renderCycleMessage = (tag: string) =>
  `Element ${tag} scheduled an update (generally because a property was set) after an update completed, causing a new update to be scheduled. This is inefficient and should be avoided unless the next update can only be scheduled as a side effect of the previous update. See https://lit.dev/msg/change-in-update for more information.`;
const developmentNotice =
  "Lit is in dev mode. Not recommended for production! See https://lit.dev/msg/dev-mode for more information.";
type WarningOccurrence = { text: string; classification: "development-notice" | "unexpected" };
export const warningOccurrences = new WeakMap<Page, WarningOccurrence[]>();

export function captureErrors(page: Page): string[] {
  const errors: string[] = [];
  const warnings: WarningOccurrence[] = [];
  warningOccurrences.set(page, warnings);
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") errors.push(text);
    if (message.type() === "warning") {
      const classification = text === developmentNotice ? "development-notice" : "unexpected";
      warnings.push({ text, classification });
      if (classification === "unexpected") errors.push(text);
    }
  });
  return errors;
}

export async function attachWarningOccurrences(page: Page, testInfo: TestInfo): Promise<void> {
  await testInfo.attach("browser-warning-occurrences", {
    body: JSON.stringify(warningOccurrences.get(page) ?? [], null, 2),
    contentType: "application/json"
  });
}
