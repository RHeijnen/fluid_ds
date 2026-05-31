import { defineConfig } from "vite";
import { resolve } from "node:path";

/**
 * Multi-page Vite app.
 *
 * Each demo is its own HTML entry, Vite handles shared chunks for the
 * common shell + Fluid imports. Each entry is fully static and
 * deep-linkable.
 *
 * Why multi-page rather than SPA-routed? Two reasons:
 *
 * 1. Deep-linking + SEO: hosting `/demos/settings/` as a separate HTML
 *    page means crawlers and shared-link previews see the demo
 *    directly. SPA hash routing fights that.
 * 2. Each demo can experiment with theming independently: the
 *    `data-fluid-brand` attribute sits on the document, not on a
 *    component the router has to manage.
 *
 * The unified website build sets BASE=/demos/ via env so every emitted
 * URL inside the bundle is prefixed correctly for the deploy artifact.
 */
const base = process.env.DEMOS_BASE ?? "/";

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        settings: resolve(__dirname, "settings/index.html"),
        admin: resolve(__dirname, "admin/index.html")
      }
    }
  },
  server: {
    port: 5174
  }
});
