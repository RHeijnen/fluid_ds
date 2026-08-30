import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * `LANDING_BASE` lets the unified website build mount this app at the
 * site root. Local dev stays at `/`. The build emits two pages: the main
 * `index.html` and a standalone `animations.html` showcase, each with its
 * own asset bundle.
 */
const base = process.env.LANDING_BASE ?? "/";

export default defineConfig({
  root: here,
  base,
  server: {
    port: 5175
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(here, "index.html"),
        animations: resolve(here, "animations.html")
      }
    }
  }
});
