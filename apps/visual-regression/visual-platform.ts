import { devices, type PlaywrightTestConfig } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import visualRasterPolicy from "./visual-platform-policy.json" with { type: "json" };

export const visualChromiumLaunchArgs = visualRasterPolicy.chromiumLaunchArgs;

const expectedRasterThreadArgument = `--num-raster-threads=${visualRasterPolicy.rasterThreads}`;
if (
  visualChromiumLaunchArgs.filter((argument) => argument.startsWith("--num-raster-threads="))
    .length !== 1 ||
  !visualChromiumLaunchArgs.includes(expectedRasterThreadArgument)
) {
  throw new Error("Visual raster metadata and Chromium launch arguments disagree");
}

export const visualPlatform = {
  id: "ubuntu-24.04-x64-node22-chromium-playwright1.60",
  os: "ubuntu-24.04-x64",
  nodeMajor: 22,
  browserName: "chromium",
  playwrightVersion: "1.60.0",
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 1,
  locale: "en-US",
  rtlLocale: "ar-EG",
  timezoneId: "UTC",
  fixedTime: "2026-08-27T12:00:00.000Z",
  randomSeed: 2_026_082_7,
  rasterPolicy: visualRasterPolicy
} as const;

export function attestVisualChromiumLaunch(parentPid = process.pid): string {
  if (process.platform !== "linux") {
    throw new Error("Canonical visual Chromium launch attestation requires Linux /proc");
  }
  const processes = readdirSync("/proc")
    .filter((entry) => /^\d+$/.test(entry))
    .flatMap((entry) => {
      try {
        const stat = readFileSync(`/proc/${entry}/stat`, "utf8");
        const commandLine = readFileSync(`/proc/${entry}/cmdline`, "utf8").replaceAll("\0", " ");
        const afterName = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
        return [{ pid: Number(entry), parentPid: Number(afterName[1]), commandLine }];
      } catch {
        return [];
      }
    });
  const descendants = new Set([parentPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const processInfo of processes) {
      if (descendants.has(processInfo.parentPid) && !descendants.has(processInfo.pid)) {
        descendants.add(processInfo.pid);
        changed = true;
      }
    }
  }
  const browser = processes.find(
    (processInfo) =>
      descendants.has(processInfo.pid) &&
      /(?:chrome-headless-shell|chromium|chrome)(?:\s|$)/.test(processInfo.commandLine) &&
      processInfo.commandLine.includes("--remote-debugging-pipe") &&
      !processInfo.commandLine.includes("--type=")
  );
  if (!browser) throw new Error("Could not attest the Playwright Chromium parent process");
  for (const argument of visualChromiumLaunchArgs) {
    if (!browser.commandLine.split(" ").includes(argument)) {
      throw new Error(`Visual Chromium launch is missing required argument: ${argument}`);
    }
  }
  return browser.commandLine;
}

const modeUse = {
  light: { colorScheme: "light", forcedColors: "none", reducedMotion: "no-preference" },
  dark: { colorScheme: "dark", forcedColors: "none", reducedMotion: "no-preference" },
  "forced-colors": { colorScheme: "light", forcedColors: "active", reducedMotion: "no-preference" },
  rtl: { colorScheme: "light", forcedColors: "none", reducedMotion: "no-preference" },
  "reduced-motion": { colorScheme: "light", forcedColors: "none", reducedMotion: "reduce" }
} as const;

export const visualProjects: NonNullable<PlaywrightTestConfig["projects"]> = Object.entries(
  modeUse
).map(([name, media]) => ({
  name,
  use: {
    ...devices["Desktop Chrome"],
    browserName: visualPlatform.browserName,
    launchOptions: { args: [...visualChromiumLaunchArgs] },
    viewport: visualPlatform.viewport,
    deviceScaleFactor: visualPlatform.deviceScaleFactor,
    locale: name === "rtl" ? visualPlatform.rtlLocale : visualPlatform.locale,
    timezoneId: visualPlatform.timezoneId,
    ...media
  }
}));
