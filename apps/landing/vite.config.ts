import { defineConfig } from "vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * `LANDING_BASE` lets the unified website build mount this app at the
 * site root. Local dev stays at `/`. The build emits a single `index.html`
 * plus its asset bundle.
 */
const base = process.env.LANDING_BASE ?? "/";

export default defineConfig({
  root: here,
  base,
  server: {
    port: 5175
  }
});
