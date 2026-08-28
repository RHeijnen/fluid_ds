/**
 * Generated production-readiness inventory for every published Fluid element.
 *
 * The report intentionally has no timestamp or absolute paths, so two clean
 * checkouts produce byte-identical output. `--write` refreshes the checked-in
 * snapshot. `--check` verifies that snapshot and enforces the categories that
 * have reached blocking status.
 */
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { interactionContractTagsFromSource } from "./interaction-contracts.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(root, "packages");
const qualityRoot = join(root, "quality");
const reportFile = join(qualityRoot, "component-quality.json");
const exceptionsFile = join(qualityRoot, "exceptions.json");
const maturityFile = join(qualityRoot, "maturity.json");
const interactionClassificationFile = join(qualityRoot, "interaction-classification.json");
const visualTestsRoot = join(root, "apps/visual-regression/tests");
const visualCatalogFile = join(root, "apps/visual-regression/.generated/catalog.ts");
const a11yCatalogFile = join(root, "apps/a11y/.generated/catalog.ts");
const ssrGateFile = join(root, "scripts/check-ssr.mjs");
const interactionContractsRoot = join(root, "apps/storybook/stories");

const DEFINE_RE = /customElements\.define\(\s*["'](fluid-[a-z0-9-]+)["']/g;
const TEST_RE = /\bit\s*\(/g;
const AXE_RE = /\.to\.be\.accessible\s*\(/g;
const PLAY_RE = /\bplay\s*:/g;
const STORY_EXPORT_RE = /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g;
const STATUS_RE = /status\s*:\s*\{\s*type\s*:\s*["'](experimental|beta|stable|deprecated)["']/;
const TITLE_RE = /title\s*:\s*["'`]([^"'`]+)["'`]/;
const RELATIVE_IMPORT_RE = /from\s+["'](\.{1,2}\/[^"']+)["']/g;

function posix(file) {
  return relative(root, file).split(sep).join("/");
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, predicate = () => true, out = []) {
  if (!(await exists(dir))) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await walk(file, predicate, out);
    else if (predicate(file)) out.push(file);
  }
  return out;
}

function count(source, regex) {
  return [...source.matchAll(regex)].length;
}

function sanitize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function storySpecName(source) {
  const title = source.match(TITLE_RE)?.[1];
  if (!title) return undefined;
  return `${sanitize(title.replace(/^[^/]*\//, "")) || "component"}.spec.ts`;
}

function nearest(files, dir, tag, sources) {
  const exact = files.find((file) => basename(file).replace(/\.(?:test|stories)\.ts$/, "") === tag);
  if (exact) return exact;
  const local = files.find((file) => dirname(file) === dir);
  if (local) return local;
  return files.find((file) => sources.get(file)?.includes(tag));
}

function validateExceptions(raw, knownTags) {
  const errors = [];
  if (!raw || !Array.isArray(raw.accessibility)) {
    return ["quality/exceptions.json must contain an accessibility array."];
  }
  const seen = new Set();
  const today = new Date().toISOString().slice(0, 10);
  for (const item of raw.accessibility) {
    if (!item || typeof item !== "object") {
      errors.push("Accessibility exceptions must be objects.");
      continue;
    }
    for (const key of ["tag", "reason", "issue", "owner", "reviewAfter"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) {
        errors.push(`Accessibility exception is missing ${key}.`);
      }
    }
    if (typeof item.reason === "string" && item.reason.trim().length < 20) {
      errors.push(`Accessibility exception for ${item.tag ?? "unknown"} needs a specific reason.`);
    }
    if (!knownTags.has(item.tag))
      errors.push(`Accessibility exception references unknown tag ${item.tag}.`);
    if (seen.has(item.tag)) errors.push(`Duplicate accessibility exception for ${item.tag}.`);
    seen.add(item.tag);
    if (item.reviewAfter && item.reviewAfter < today) {
      errors.push(`Accessibility exception for ${item.tag} expired on ${item.reviewAfter}.`);
    }
  }
  return errors;
}

async function collect() {
  const maturityManifest = JSON.parse(await readFile(maturityFile, "utf8"));
  const maturityRecords = maturityManifest.components ?? {};
  const interactionManifest = JSON.parse(await readFile(interactionClassificationFile, "utf8"));
  const packageDirs = (await readdir(packagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesRoot, entry.name));
  const published = [];
  for (const dir of packageDirs) {
    const manifestFile = join(dir, "package.json");
    if (!(await exists(manifestFile))) continue;
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    if (
      manifest.private ||
      manifest.fluidIntegration ||
      !String(manifest.name ?? "").startsWith("@fluid-ds/")
    )
      continue;
    published.push({ dir, name: manifest.name, version: manifest.version });
  }

  const definitions = [];
  const sourceCache = new Map();
  for (const pkg of published) {
    const sourceFiles = await walk(join(pkg.dir, "src"), (file) => file.endsWith(".ts"));
    for (const file of sourceFiles) {
      const source = await readFile(file, "utf8");
      sourceCache.set(file, source);
      for (const match of source.matchAll(DEFINE_RE)) {
        definitions.push({ tag: match[1], file, pkg });
      }
    }
  }
  definitions.sort((a, b) => a.tag.localeCompare(b.tag));

  const allTests = [];
  const allStories = [];
  for (const pkg of published) {
    allTests.push(...(await walk(join(pkg.dir, "src"), (file) => file.endsWith(".test.ts"))));
    allStories.push(...(await walk(join(pkg.dir, "src"), (file) => file.endsWith(".stories.ts"))));
  }
  for (const file of [...allTests, ...allStories]) {
    if (!sourceCache.has(file)) sourceCache.set(file, await readFile(file, "utf8"));
  }

  const visualSpecs = new Set(
    (await walk(visualTestsRoot, (file) => file.endsWith(".spec.ts"))).map((file) => basename(file))
  );
  const visualCatalogSource = (await exists(visualCatalogFile))
    ? await readFile(visualCatalogFile, "utf8")
    : "";
  const visualCatalogTags = new Set(
    [...visualCatalogSource.matchAll(/["'](fluid-[a-z0-9-]+)["']/g)].map((match) => match[1])
  );
  const a11yCatalogSource = (await exists(a11yCatalogFile))
    ? await readFile(a11yCatalogFile, "utf8")
    : "";
  const a11yCatalogTags = new Set(
    [...a11yCatalogSource.matchAll(/"tag":\s*"(fluid-[a-z0-9-]+)"/g)].map((match) => match[1])
  );
  const ssrSource = await readFile(ssrGateFile, "utf8");
  const interactionContractTags = new Set();
  for (const file of (
    await walk(interactionContractsRoot, (file) => file.endsWith("InteractionContracts.stories.ts"))
  ).sort()) {
    for (const tag of interactionContractTagsFromSource(await readFile(file, "utf8"))) {
      interactionContractTags.add(tag);
    }
  }
  const explicitlyRendered = new Set(
    [...ssrSource.matchAll(/<((?:fluid-)[a-z0-9-]+)/g)].map((m) => m[1])
  );
  const catalogRenderGate = ssrSource.includes("for (const tag of [...publishedTags].sort())");

  const exceptions = JSON.parse(await readFile(exceptionsFile, "utf8"));
  const knownTags = new Set(definitions.map((item) => item.tag));
  const exceptionErrors = validateExceptions(exceptions, knownTags);
  const accessibilityExempt = new Map(exceptions.accessibility.map((item) => [item.tag, item]));
  const interactionErrors = [];
  const interactionClassifications = new Map();
  const interactionCategories = ["interactive", "composite", "presentational", "helper"];
  for (const category of interactionCategories) {
    const tags = interactionManifest.categories?.[category];
    if (!Array.isArray(tags)) {
      interactionErrors.push(`Interaction classification is missing the ${category} array.`);
      continue;
    }
    for (const tag of tags) {
      if (interactionClassifications.has(tag)) {
        interactionErrors.push(`${tag}: duplicate interaction classification`);
      }
      interactionClassifications.set(tag, category);
      if (!knownTags.has(tag)) interactionErrors.push(`${tag}: unknown interaction classification`);
    }
  }
  for (const tag of knownTags) {
    if (!interactionClassifications.has(tag)) {
      interactionErrors.push(`${tag}: missing interaction classification`);
    }
  }
  const interactionMinimum = interactionManifest.policy?.minimumCovered;
  if (!Number.isInteger(interactionMinimum) || interactionMinimum < 0) {
    interactionErrors.push("Interaction policy minimumCovered must be a non-negative integer.");
  }

  const components = [];
  for (const definition of definitions) {
    const dir = dirname(definition.file);
    const definitionSource = sourceCache.get(definition.file) ?? "";
    let componentSource = definitionSource;
    for (const match of definitionSource.matchAll(RELATIVE_IMPORT_RE)) {
      const imported = join(dirname(definition.file), match[1].replace(/\.js$/, ".ts"));
      componentSource += `\n${sourceCache.get(imported) ?? ""}`;
    }
    const testFile = nearest(allTests, dir, definition.tag, sourceCache);
    const storyFile = nearest(allStories, dir, definition.tag, sourceCache);
    const testSource = testFile ? (sourceCache.get(testFile) ?? "") : "";
    const storySource = storyFile ? (sourceCache.get(storyFile) ?? "") : "";
    const maturity = maturityRecords[definition.tag]?.status ?? "unclassified";
    const visualSpec = storySpecName(storySource);
    const family = basename(dir) === "src" ? definition.pkg.name.split("/").at(-1) : basename(dir);
    const docs =
      definition.pkg.name === "@fluid-ds/components"
        ? join(root, "apps/docs/src/content/docs/components", `${family}.mdx`)
        : join(
            root,
            "apps/docs/src/content/docs/expansion",
            `${definition.pkg.name.split("/").at(-1)}.mdx`
          );
    const exception = accessibilityExempt.get(definition.tag);
    const accessibilityAudits = count(testSource, AXE_RE);
    const interactionClassification =
      interactionClassifications.get(definition.tag) ?? "unclassified";
    const interactionRequired =
      interactionClassification === "interactive" || interactionClassification === "composite";

    components.push({
      tag: definition.tag,
      package: definition.pkg.name,
      version: definition.pkg.version,
      family,
      maturity,
      maturitySource: "quality/maturity.json",
      files: {
        definition: posix(definition.file),
        test: testFile ? posix(testFile) : null,
        story: storyFile ? posix(storyFile) : null,
        docs: (await exists(docs)) ? posix(docs) : null
      },
      unit: {
        cases: count(testSource, TEST_RE),
        accessibilityAudits,
        accessibilityException: exception ?? null
      },
      storybook: {
        stories: count(storySource, STORY_EXPORT_RE),
        interactions:
          count(storySource, PLAY_RE) + (interactionContractTags.has(definition.tag) ? 1 : 0),
        classification: interactionClassification,
        interactionRequired
      },
      visual: {
        spec: visualCatalogTags.has(definition.tag)
          ? "apps/visual-regression/tests/catalog.spec.ts"
          : visualSpec && visualSpecs.has(visualSpec)
            ? `apps/visual-regression/tests/${visualSpec}`
            : null,
        modes: visualCatalogTags.has(definition.tag)
          ? ["light", "dark", "forced-colors", "rtl", "reduced-motion"]
          : []
      },
      browserAccessibility: {
        fixture: a11yCatalogTags.has(definition.tag) ? "apps/a11y/tests/catalog.spec.ts" : null
      },
      ssr: {
        importSafetyGate: true,
        catalogRenderGate,
        renderedFixture: catalogRenderGate || explicitlyRendered.has(definition.tag)
      },
      localization: {
        usesRegistry: /\b(?:term|localize\.term)\s*\(/.test(componentSource),
        directionAware: /\bisRtl\b|\blocalize\.dir\b/.test(componentSource)
      }
    });
  }

  const duplicateTags = components
    .filter((item, index) => components.findIndex((other) => other.tag === item.tag) !== index)
    .map((item) => item.tag);
  const blocking = [];
  for (const item of components) {
    if (!item.files.test) blocking.push(`${item.tag}: missing unit test`);
    if (!item.files.story) blocking.push(`${item.tag}: missing Storybook story`);
    if (item.maturity === "unclassified") blocking.push(`${item.tag}: missing maturity status`);
    const storySource = item.files.story
      ? (sourceCache.get(join(root, item.files.story)) ?? "")
      : "";
    const storyMaturity = storySource.match(STATUS_RE)?.[1] ?? "unclassified";
    if (storyMaturity !== item.maturity) {
      blocking.push(
        `${item.tag}: Storybook maturity ${storyMaturity} differs from manifest ${item.maturity}`
      );
    }
    if (!item.unit.accessibilityAudits && !item.unit.accessibilityException) {
      blocking.push(`${item.tag}: missing accessibility audit or structured exception`);
    }
    if (!item.ssr.renderedFixture) blocking.push(`${item.tag}: missing SSR render gate`);
    if (!item.browserAccessibility.fixture) {
      blocking.push(`${item.tag}: missing browser accessibility fixture`);
    }
    if (
      interactionManifest.policy?.stableRequiresCoverage &&
      item.maturity === "stable" &&
      item.storybook.interactionRequired &&
      item.storybook.interactions === 0
    ) {
      blocking.push(`${item.tag}: stable interactive component is missing a Storybook interaction`);
    }
  }
  for (const tag of new Set(duplicateTags))
    blocking.push(`${tag}: duplicate custom-element definition`);
  blocking.push(...exceptionErrors);
  blocking.push(...interactionErrors);

  const interactionRequired = components.filter((item) => item.storybook.interactionRequired);
  const interactionCovered = interactionRequired.filter((item) => item.storybook.interactions > 0);
  if (Number.isInteger(interactionMinimum) && interactionCovered.length < interactionMinimum) {
    blocking.push(
      `Storybook interaction coverage regressed to ${interactionCovered.length}; ratchet requires ${interactionMinimum}`
    );
  }

  const summary = {
    packages: new Set(components.map((item) => item.package)).size,
    components: components.length,
    unitTested: components.filter((item) => item.files.test).length,
    accessibilityAudited: components.filter((item) => item.unit.accessibilityAudits > 0).length,
    accessibilityExempt: components.filter((item) => item.unit.accessibilityException).length,
    storybookCovered: components.filter((item) => item.files.story).length,
    storybookInteractions: components.filter((item) => item.storybook.interactions > 0).length,
    interactionClassification: Object.fromEntries(
      interactionCategories.map((category) => [
        category,
        components.filter((item) => item.storybook.classification === category).length
      ])
    ),
    interactionRequired: interactionRequired.length,
    interactionCovered: interactionCovered.length,
    interactionMissing: interactionRequired.length - interactionCovered.length,
    interactionCoveragePercent: Number(
      ((interactionCovered.length / interactionRequired.length) * 100).toFixed(1)
    ),
    interactionCatalogCoveragePercent: Number(
      (
        (components.filter((item) => item.storybook.interactions > 0).length / components.length) *
        100
      ).toFixed(1)
    ),
    visualCovered: components.filter((item) => item.visual.spec).length,
    browserAccessibilityCovered: components.filter((item) => item.browserAccessibility.fixture)
      .length,
    ssrRenderedFixtures: components.filter((item) => item.ssr.renderedFixture).length,
    localized: components.filter((item) => item.localization.usesRegistry).length,
    rtlAware: components.filter((item) => item.localization.directionAware).length,
    blockingGaps: blocking.length
  };

  return {
    schemaVersion: 1,
    measurement: "source-attribution-not-execution",
    policy: {
      blocking: [
        "unit-test",
        "maturity",
        "unit-accessibility",
        "browser-accessibility",
        "ssr-render",
        "storybook-interaction-ratchet",
        "stable-storybook-interaction"
      ],
      reporting: [
        "storybook-interaction-depth",
        "visual",
        "ssr-rendered-fixture",
        "localization",
        "rtl"
      ]
    },
    summary,
    blocking,
    components
  };
}

function serialize(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

async function main() {
  const report = await collect();
  const serialized = serialize(report);
  const write = process.argv.includes("--write");
  const check = process.argv.includes("--check");
  const json = process.argv.includes("--json");

  if (write) await writeFile(reportFile, serialized, "utf8");
  if (check) {
    const current = (await exists(reportFile)) ? await readFile(reportFile, "utf8") : "";
    if (current !== serialized) {
      console.error("Quality report is stale. Run `pnpm quality:report` and review the changes.");
      process.exitCode = 1;
    }
  }

  if (report.blocking.length) {
    console.error(`Quality gate has ${report.blocking.length} blocking gap(s):`);
    for (const gap of report.blocking) console.error(`  - ${gap}`);
    process.exitCode = 1;
  }

  if (json) process.stdout.write(serialized);
  else {
    const s = report.summary;
    console.log(
      `Quality inventory: ${s.components} elements in ${s.packages} packages; ` +
        `${s.accessibilityAudited} unit-a11y source attributions, ` +
        `${s.interactionCovered}/${s.interactionRequired} interaction attributions, ` +
        `${s.visualCovered} visual, ${s.ssrRenderedFixtures} SSR-rendered.`
    );
    if (write) console.log(`Updated ${posix(reportFile)}.`);
    if (check && !process.exitCode) console.log("Quality report is current.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
