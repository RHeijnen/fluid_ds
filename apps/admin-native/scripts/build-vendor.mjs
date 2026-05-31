/**
 * Bundle the local Fluid build into a single self-contained ESM file the
 * buildless page can load from one URL, and copy the token stylesheets next to
 * it. Run automatically before `dev` and `build`.
 *
 * We use Vite's library build (Rollup under the hood) because it resolves
 * `@fluid-ds/*` and their deps (Lit, floating-ui) from the workspace and inlines
 * everything. `inlineDynamicImports` forces a single file so the import map only
 * needs one entry. This is the local stand-in for a CDN: the output is exactly
 * what jsDelivr / esm.run would serve once the packages are published.
 */
import { build } from "vite";
import { cpSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(here, "..");
const repoRoot = resolve(appDir, "../..");
const vendorOut = resolve(appDir, "vendor");

mkdirSync(vendorOut, { recursive: true });

console.log("▻ bundling Fluid (local build) → vendor/fluid.js");
await build({
  configFile: false,
  root: appDir,
  logLevel: "warn",
  publicDir: false,
  build: {
    outDir: "vendor",
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: resolve(appDir, "vendor/entry.js"),
      formats: ["es"],
      fileName: () => "fluid.js"
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
});

// Token stylesheets: copy the three base sheets so the page links them locally.
// (Swapping to a CDN means pointing the <link>s at the tokens package instead.)
const tokensDist = resolve(repoRoot, "packages/tokens/dist");
mkdirSync(resolve(vendorOut, "tokens"), { recursive: true });
for (const css of ["base.css", "light.css", "dark.css"]) {
  copyFileSync(resolve(tokensDist, css), resolve(vendorOut, "tokens", css));
}
console.log("▻ copied tokens base/light/dark → vendor/tokens/");

// Brand themes: optional preset stylesheets, inert until data-fluid-brand is set.
const themesSrc = resolve(repoRoot, "packages/themes/src");
mkdirSync(resolve(vendorOut, "themes"), { recursive: true });
for (const css of ["midnight.css", "corporate.css"]) {
  copyFileSync(resolve(themesSrc, css), resolve(vendorOut, "themes", css));
}
console.log("▻ copied brand themes midnight/corporate → vendor/themes/");
