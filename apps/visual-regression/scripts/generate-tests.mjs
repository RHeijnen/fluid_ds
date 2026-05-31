/**
 * Generate one Playwright `.spec.ts` file per component story directory.
 *
 * Why generated tests:
 *   - Adding a new component should add a new visual snapshot automatically;
 *     no human bookkeeping in the visual-regression package.
 *   - Each spec only does one thing: navigate to a story iframe URL and
 *     screenshot the body, so there's nothing meaningful to write by hand.
 *
 * Inputs:
 *   - `packages/components/src/components/<name>/*.stories.ts`
 *     We extract `title` and the exported story names from a textual parse
 *     (regex). Stories are simple CSF; we don't need a full TS AST.
 *
 * Output:
 *   - `apps/visual-regression/tests/<component>.spec.ts`, one per story file.
 *     Each spec has one `test()` per story export.
 *
 * Storybook ID rule (mirrored from `@storybook/csf` `sanitize` + `toId`):
 *   lower-case, strip diacritics, collapse any run of non-alphanumeric chars
 *   to a single `-`, trim leading/trailing dashes, then join `title` + name
 *   with `--`.
 *
 * Re-running is safe, generated files are fully overwritten.
 */
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const COMPONENTS_ROOT = join(ROOT, "packages/components/src/components");
const TESTS_DIR = join(HERE, "..", "tests");

const TITLE_RE = /title:\s*["'`]([^"'`]+)["'`]/;
// CSF: `export const Foo: Story = …` (covers `: StoryObj` too).
const STORY_EXPORT_RE = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g;
// We never want to screenshot the meta export.
const NON_STORY_EXPORTS = new Set(["default", "meta"]);

/**
 * Stories that Storybook itself fails to render, they need a fix in the
 * story file (e.g. a missing `render` function) but that's out of scope for
 * this package. Listed as `Title|ExportName`. Skipped specs leave a TODO in
 * the generated file so they're easy to spot in review.
 */
const KNOWN_BROKEN = new Set([
  // Skeleton/Sheen's meta has no `render`, so Storybook rejects it with
  // "the component annotation is missing from the default export". Once
  // the meta gets a render (or the story gets its own), drop this entry.
  "Components/Skeleton|Sheen"
]);

/**
 * Storybook's title/name → id slug. Mirror of `@storybook/csf` `sanitize`:
 * lowercase, normalize, replace any non-alphanumeric run with `-`, trim.
 */
function sanitize(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Storybook computes the display name from a CSF export with a lodash
 * `startCase`: it inserts spaces between camel-case boundaries (`FromArray`
 * → `From Array`, `WithRichContent` → `With Rich Content`) before sanitizing.
 * Without this step, the test URL ends up as `--fromarray` but Storybook
 * registers it as `--from-array` and we get "Couldn't find story matching".
 */
function startCaseSpaces(name) {
  return String(name)
    // Insert a space between a lowercase/digit and an uppercase ("aB" → "a B").
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // Insert a space between consecutive uppercase + lowercase ("ABCd" → "AB Cd").
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function toStoryId(title, exportName) {
  return `${sanitize(title)}--${sanitize(startCaseSpaces(exportName))}`;
}

async function findStoryFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findStoryFiles(full)));
    } else if (entry.name.endsWith(".stories.ts")) {
      out.push(full);
    }
  }
  return out;
}

function specFileBody({ relStoryPath, title, stories, skipped = [] }) {
  const cases = stories
    .map((name) => {
      const id = toStoryId(title, name);
      return `  test(${JSON.stringify(name)}, async ({ page }) => {
    await page.goto(\`/iframe.html?id=${id}&viewMode=story\`);
    // Wait for Storybook to render the story root and for fonts + custom
    // elements to finish upgrading. We screenshot the full viewport rather
    // than the root element because some stories render off-screen overlays
    // (dialog, drawer, toast) whose root has zero visible bounds.
    await page.waitForSelector("#storybook-root", { state: "attached" });
    await page.evaluate(() => document.fonts?.ready);
    // Detect Storybook's own error overlay early so the failure points at
    // the story instead of timing out on an empty root.
    const sbErr = await page.locator("#storybook-root-error-display, #error-message").first().textContent().catch(() => null);
    if (sbErr) {
      throw new Error(\`Storybook failed to render story '${id}': \${sbErr.trim()}\`);
    }
    await page.waitForFunction(() => {
      const root = document.getElementById("storybook-root");
      return !!root && root.childElementCount > 0;
    }, { timeout: 5000 }).catch(() => {
      // Some stories (e.g. broken meta) leave the root empty. Fall through
      // and let the screenshot diff capture whatever's on screen, the
      // resulting baseline will show the Storybook error page, which makes
      // the issue obvious in review.
    });
    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot(${JSON.stringify(
      `${sanitize(startCaseSpaces(name))}.png`
    )}, {
      fullPage: false
    });
  });`;
    })
    .join("\n\n");

  const skippedBlock = skipped.length
    ? `\n${skipped
        .map(
          (n) =>
            `  // TODO: ${JSON.stringify(n)} skipped, listed in KNOWN_BROKEN in scripts/generate-tests.mjs.\n  test.skip(${JSON.stringify(n)}, async () => {});`
        )
        .join("\n\n")}\n`
    : "";
  return `// AUTO-GENERATED by scripts/generate-tests.mjs. Do not edit by hand.
// Source: ${relStoryPath}
import { test, expect } from "@playwright/test";

test.describe(${JSON.stringify(title)}, () => {
${cases}${skippedBlock}
});
`;
}

async function main() {
  const storyFiles = await findStoryFiles(COMPONENTS_ROOT);
  if (!storyFiles.length) {
    console.error("generate-tests: no *.stories.ts files found.");
    process.exit(1);
  }

  // Wipe + recreate so deleted stories don't leave orphan specs.
  await rm(TESTS_DIR, { recursive: true, force: true });
  await mkdir(TESTS_DIR, { recursive: true });

  let written = 0;
  let totalStories = 0;
  for (const file of storyFiles) {
    const src = await readFile(file, "utf8");
    const titleMatch = src.match(TITLE_RE);
    if (!titleMatch) {
      console.warn(`generate-tests: no title in ${file}, skipping.`);
      continue;
    }
    const title = titleMatch[1];

    const stories = [];
    const skipped = [];
    for (const m of src.matchAll(STORY_EXPORT_RE)) {
      const name = m[1];
      if (NON_STORY_EXPORTS.has(name)) continue;
      if (KNOWN_BROKEN.has(`${title}|${name}`)) {
        skipped.push(name);
        continue;
      }
      stories.push(name);
    }
    if (!stories.length && !skipped.length) {
      console.warn(`generate-tests: no story exports in ${file}, skipping.`);
      continue;
    }

    // One spec per stories file; sibling component groups (e.g. tabs +
    // tab-panel under fluid-tabs.stories.ts) share one spec naturally.
    const slug = sanitize(title.replace(/^[^/]*\//, "")) || "component";
    const specPath = join(TESTS_DIR, `${slug}.spec.ts`);
    const relStoryPath = relative(ROOT, file).replace(/\\/g, "/");
    await writeFile(
      specPath,
      specFileBody({ relStoryPath, title, stories, skipped }),
      "utf8"
    );
    written += 1;
    totalStories += stories.length;
  }

  console.log(
    `generate-tests: wrote ${written} spec file(s) covering ${totalStories} story(ies) into ${relative(
      ROOT,
      TESTS_DIR
    )}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
