import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * `PLAYGROUND_BASE` lets the unified website build mount this app under
 * a sub-path (`/playground/`). For local dev it stays at the root.
 */
const base = process.env.PLAYGROUND_BASE ?? "/";

export default defineConfig({
  root: here,
  base,
  server: {
    port: 5173,
    open: false,
    strictPort: false
  },
  build: {
    outDir: resolve(here, "dist"),
    sourcemap: true,
    target: "es2022"
  }
});
