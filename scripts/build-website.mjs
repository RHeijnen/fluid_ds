/**
 * Unified website build.
 *
 * Compiles every deployable surface and stages the outputs into
 * `website/` under their respective sub-paths so a single deploy
 * artifact serves the entire site:
 *
 *   website/
 *     index.html                ← docs landing (also serves at /)
 *     docs/*                    ← Astro Starlight (the rest of docs)
 *     storybook/*               ← built Storybook
 *     playground/*              ← built theme builder
 *     demos/*                   ← built demos
 *     _redirects                ← Cloudflare Pages / Netlify routing
 *     _headers                  ← long-cache static assets
 *
 * Each sub-app reads a `*_BASE` env var (PLAYGROUND_BASE / DEMOS_BASE,
 * etc.) so URLs inside its bundle are prefixed correctly.
 *
 * Astro uses its own `base` config option, we pass it on the CLI via
 * `--base`. Storybook supports the same idea via `--base-path`.
 *
 * Run via `pnpm build:website` from the repo root.
 */
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const websiteDir = resolve(root, "website");

/**
 * Run a shell command in the given cwd, inheriting stdio, throwing on
 * non-zero exit. We use `pnpm` directly so env vars come from this
 * process, Vite picks them up natively.
 */
function run(cmd, args, opts = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...(opts.env ?? {}) }
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

/** Recursively copy a directory tree. Overwrites existing files. */
async function copyDir(src, dest) {
  if (!existsSync(src)) {
    throw new Error(`expected ${src} to exist after build`);
  }
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
}

async function main() {
  // Fresh artifact directory.
  await rm(websiteDir, { recursive: true, force: true });
  await mkdir(websiteDir, { recursive: true });

  // 1. Library packages first: every app depends on the built tokens,
  //    icons, and components.
  console.log("\n▻ building packages");
  await run("pnpm", ["-r", "--filter=./packages/*", "build"]);

  // 2. Docs site: Astro, mounted at /docs/.
  //    We pass DOCS_BASE so every internal Starlight link is prefixed
  //    correctly in the production bundle. The root `/` is reserved
  //    for a marketing landing page (see step 6 below, for now it's
  //    a small placeholder).
  console.log("\n▻ building docs");
  await run("pnpm", ["--filter", "@fluid-ds/docs", "build"], {
    env: { DOCS_BASE: "/docs/" }
  });
  await copyDir(resolve(root, "apps/docs/dist"), join(websiteDir, "docs"));

  // 3. Storybook: mounted at /storybook/.
  console.log("\n▻ building storybook");
  await run("pnpm", ["--filter", "@fluid-ds/storybook", "build"]);
  await copyDir(resolve(root, "apps/storybook/storybook-static"), join(websiteDir, "storybook"));

  // 4. Playground (theme builder): mounted at /playground/.
  console.log("\n▻ building playground");
  await run("pnpm", ["--filter", "@fluid-ds/playground", "build"], {
    env: { PLAYGROUND_BASE: "/playground/" }
  });
  await copyDir(resolve(root, "apps/playground/dist"), join(websiteDir, "playground"));

  // 5. Demos: mounted at /demos/.
  console.log("\n▻ building demos");
  await run("pnpm", ["--filter", "@fluid-ds/demos", "build"], {
    env: { DEMOS_BASE: "/demos/" }
  });
  await copyDir(resolve(root, "apps/demos/dist"), join(websiteDir, "demos"));

  // 5a. Admin-portal demo apps, one per framework, each staged as a static
  //     sub-app under /demos/<framework>/. These MUST run after the
  //     `@fluid-ds/demos` copy above, which writes the whole demos dist into
  //     website/demos/ — staging the portal subfolders afterwards keeps them
  //     from being wiped, and leaves the demos index/settings/admin intact.
  console.log("\n▻ building admin-native (buildless static)");
  await run("pnpm", ["--filter", "@fluid-ds/admin-native", "build"]);
  await copyDir(resolve(root, "apps/admin-native/dist"), join(websiteDir, "demos/native"));

  console.log("\n▻ building admin-react");
  await run("pnpm", ["--filter", "@fluid-ds/admin-react", "build"], {
    env: { ADMIN_REACT_BASE: "/demos/react/" }
  });
  await copyDir(resolve(root, "apps/admin-react/dist"), join(websiteDir, "demos/react"));

  console.log("\n▻ building admin-next (static export)");
  await run("pnpm", ["--filter", "@fluid-ds/admin-next", "build"], {
    env: { ADMIN_NEXT_BASE: "/demos/next" }
  });
  await copyDir(resolve(root, "apps/admin-next/out"), join(websiteDir, "demos/next"));

  console.log("\n▻ building admin-angular");
  // The angular `build` script is just `ng build` with no env hook for the
  // base href, so we invoke the CLI directly with --base-href. Its prebuild
  // deps (tokens/icons/components/charts) are already built in step 1.
  await run("pnpm", [
    "--filter",
    "@fluid-ds/admin-angular",
    "exec",
    "ng",
    "build",
    "--base-href",
    "/demos/angular/"
  ]);
  await copyDir(
    resolve(root, "apps/admin-angular/dist/admin-angular/browser"),
    join(websiteDir, "demos/angular")
  );

  // 5b. Wizard (package builder), mounted at /wizard/.
  console.log("\n▻ building wizard");
  await run("pnpm", ["--filter", "@fluid-ds/wizard", "build"], {
    env: { WIZARD_BASE: "/wizard/" }
  });
  await copyDir(resolve(root, "apps/wizard/dist"), join(websiteDir, "wizard"));

  // 6. Marketing landing: mounted at /.
  //    The landing is its own Vite app (apps/landing). It builds a
  //    single `index.html` plus its bundled assets, all of which we
  //    stage to the website root. LANDING_BASE=/ keeps internal asset
  //    URLs at the root.
  console.log("\n▻ building landing");
  await run("pnpm", ["--filter", "@fluid-ds/landing", "build"], {
    env: { LANDING_BASE: "/" }
  });
  // Copy *into* websiteDir so index.html and the assets/ folder land at
  // the root alongside docs/, storybook/, etc.
  const landingDist = resolve(root, "apps/landing/dist");
  for (const entry of await readdir(landingDist)) {
    await cp(join(landingDist, entry), join(websiteDir, entry), { recursive: true });
  }

  // 7. Cloudflare Pages / Netlify routing.
  //    `_redirects` syntax is identical between the two; we use
  //    Cloudflare's docs as the reference.
  const redirects = [
    "# Pretty short URLs for the four surfaces.",
    "# Each entry is `source → destination status`.",
    "# 200 = silent rewrite (URL bar stays). 301/302 = visible redirect.",
    "",
    "# Aliases so the bare name works (e.g. /docs → /docs/).",
    "/docs              /docs/                        301",
    "/storybook         /storybook/                   301",
    "/playground        /playground/                  301",
    "/demos             /demos/                       301",
    "/wizard            /wizard/                      301",
    "",
    "# Bare-name aliases for the four admin-portal demo sub-apps.",
    "/demos/native      /demos/native/                301",
    "/demos/react       /demos/react/                 301",
    "/demos/next        /demos/next/                  301",
    "/demos/angular     /demos/angular/               301",
    "",
    "# SPA fallback for the playground (single index.html, Vite SPA).",
    "/playground/*      /playground/index.html        200",
    "/wizard/*          /wizard/index.html            200",
    "",
    "# SPA fallbacks for the hash-routed admin demos (a stray deep link still",
    "# loads the app shell). admin-next is omitted: it has real exported HTML.",
    "/demos/native/*    /demos/native/index.html      200",
    "/demos/react/*     /demos/react/index.html       200",
    "/demos/angular/*   /demos/angular/index.html     200",
    ""
  ].join("\n");
  await writeFile(join(websiteDir, "_redirects"), redirects, "utf8");

  // 8. Long-cache headers for hashed assets.
  const headers = [
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/docs/_astro/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/playground/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/demos/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/demos/react/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/demos/next/_next/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/wizard/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/storybook/static/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    ""
  ].join("\n");
  await writeFile(join(websiteDir, "_headers"), headers, "utf8");

  console.log(`\n✓ website built at ${websiteDir}`);
  console.log("  upload that directory to Cloudflare Pages / Netlify / any static host.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
