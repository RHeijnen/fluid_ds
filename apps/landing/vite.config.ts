import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
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
