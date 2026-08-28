import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const separatelyBuiltPrefixes = ["/demos/", "/docs/", "/playground/", "/storybook/", "/wizard/"];

export function auditWebsiteSources({
  landingSource,
  landingHtml,
  socialSvg = "",
  buttonGuide,
  publicClaims = []
}) {
  const failures = [];
  const combined = `${landingSource}\n${landingHtml}\n${socialSvg}`;
  const claimSources = `${combined}\n${publicClaims.join("\n")}`;
  const nestedInteractive = /<a\b(?:(?!<\/a>)[\s\S])*?<fluid-button\b(?:(?!<\/a>)[\s\S])*?<\/a>/gi;

  for (const [surface, source] of [
    ["landing", landingSource],
    ["button guide", buttonGuide]
  ]) {
    if (nestedInteractive.test(source)) {
      failures.push(`${surface}: anchor contains a fluid-button`);
    }
    nestedInteractive.lastIndex = 0;
  }

  const staleClaims = [
    /\b103 (?:standard web )?components\b/i,
    /\bstable 0\.x\b/i,
    /\bpixel-for-pixel identical\b/i,
    /\bframeworks proven\b/i,
    /\bSSR-safe\b/i,
    /\baccessible out of the box\b/i,
    /\bVue, Svelte, and Solid are supported too\b/i,
    /\bcurrent (?:browser|pinned-Linux) accessibility suite passes 642\b/i,
    /\ball seven typecheck, build, and\s+pass\b/i,
    /\ball seven representative consumers also pass\b/i
  ];
  for (const claim of staleClaims) {
    if (claim.test(claimSources))
      failures.push(`public source: stale or unsupported claim ${claim}`);
  }

  const hrefs = [...combined.matchAll(/\bhref=["']([^"']+)["']/g)].map((match) => match[1]);
  const localRoutes = hrefs.filter((href) => href.startsWith("/") && !href.startsWith("//"));
  const separateAppRoutes = localRoutes.filter((href) =>
    separatelyBuiltPrefixes.some((prefix) => href.startsWith(prefix))
  );
  const landingRoutes = localRoutes.filter((href) => !separateAppRoutes.includes(href));
  const externalLinks = hrefs.filter((href) => /^https?:\/\//.test(href));

  for (const href of localRoutes) {
    const pathname = href.split(/[?#]/, 1)[0];
    const isFile = /\/[^/]+\.[a-z0-9]+$/i.test(pathname);
    if (
      href !== "/" &&
      !href.endsWith("/") &&
      !href.includes("#") &&
      !href.includes("?") &&
      !isFile
    ) {
      failures.push(`landing: local route lacks a trailing slash: ${href}`);
    }
  }

  return {
    sourceFiles: 4 + publicClaims.length,
    localRoutes: landingRoutes.length,
    separatelyBuiltRoutes: separateAppRoutes.length,
    externalLinks: externalLinks.length,
    failures
  };
}

async function main() {
  const report = auditWebsiteSources({
    landingSource: await readFile(join(root, "apps/landing/src/main.ts"), "utf8"),
    landingHtml: await readFile(join(root, "apps/landing/index.html"), "utf8"),
    socialSvg: await readFile(join(root, "apps/landing/public/og.svg"), "utf8"),
    buttonGuide: await readFile(
      join(root, "apps/docs/src/content/docs/components/button.mdx"),
      "utf8"
    ),
    publicClaims: await Promise.all(
      [
        "README.md",
        "docs/FEATURES.md",
        "apps/docs/src/content/docs/index.mdx",
        "apps/docs/src/content/docs/guides/accessibility.mdx",
        "apps/docs/src/content/docs/guides/frameworks.mdx",
        "apps/docs/src/content/docs/guides/localization.mdx",
        "apps/docs/src/content/docs/guides/ssr.mdx"
      ].map((path) => readFile(join(root, path), "utf8"))
    )
  });
  console.log(JSON.stringify(report, null, 2));
  console.log(
    "Route counts are source-level coverage only. Separately built routes and external URLs are not fetched or deployment-validated."
  );
  if (report.failures.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
