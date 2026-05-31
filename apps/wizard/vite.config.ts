import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * `WIZARD_BASE` lets the unified website build mount this app under
 * a sub-path (`/wizard/`). For local dev it stays at the root.
 */
const base = process.env.WIZARD_BASE ?? "/";

export default defineConfig({
  root: here,
  base,
  server: {
    port: 5176,
    open: false,
    strictPort: false
  },
  build: {
    outDir: resolve(here, "dist"),
    sourcemap: true,
    target: "es2022"
  }
});
