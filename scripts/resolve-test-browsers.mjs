export const supportedTestBrowsers = Object.freeze(["chromium", "firefox", "webkit"]);

/** A misspelled matrix must fail, never silently become Chromium-only. */
export function resolveTestBrowsers(raw = process.env.FLUID_BROWSERS) {
  const value = raw?.trim().toLowerCase();
  if (!value) return ["chromium"];
  if (value === "all") return [...supportedTestBrowsers];
  const requested = value.split(",").map((name) => name.trim());
  const invalid = requested.filter((name) => !supportedTestBrowsers.includes(name));
  if (invalid.length) {
    throw new Error(
      `Invalid FLUID_BROWSERS=${JSON.stringify(raw)}: expected all or a comma-separated subset of ${supportedTestBrowsers.join(", ")}`
    );
  }
  return [...new Set(requested)];
}
