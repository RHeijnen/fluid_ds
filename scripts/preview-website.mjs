/**
 * Local preview for the unified `website/` artifact.
 *
 * Serves `website/` on http://localhost:4180 and applies the rewrites
 * declared in `website/_redirects`, so the preview behaves the way
 * Cloudflare Pages / Netlify will at deploy time.
 *
 * Port 4180 is chosen specifically to NOT collide with the other dev
 * servers running concurrently:
 *   - Vite playground   :5173
 *   - Vite demos        :5174
 *   - Astro docs dev    :4321
 *   - Vite/Astro preview:4173   ← classic collision
 *   - Storybook         :6006
 * Override with `PORT=…` if you need something else.
 *
 * Three reasons to use this over `npx serve website`:
 *
 *   1. Honors the rewrites we already write in build-website.mjs (so
 *      `/playground/anything` falls back to the playground SPA's
 *      index, etc).
 *   2. Serves `index.html` for directory requests (Astro emits its
 *      pages as `path/index.html`).
 *   3. Zero dependencies: uses Node's built-in http + fs.
 *
 * Usage:
 *
 *   pnpm build:website        # one-time, builds the artifact
 *   pnpm preview:website      # starts the local server
 *
 * For an even closer-to-production preview, use Cloudflare's wrangler:
 *
 *   npx wrangler pages dev website --port 4180
 */
import { createServer } from "node:http";
import { extname, join, resolve, dirname } from "node:path";
import { stat, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const websiteDir = resolve(root, "website");
const port = Number(process.env.PORT ?? 4180);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
  ".map": "application/json"
};

/**
 * Parse `_redirects` into an array of { from, to, status } entries.
 * Format we emit in build-website.mjs:
 *
 *   /docs              /docs/index.html              200
 *   /playground/*      /playground/index.html        200
 *
 * Lines starting with `#` and blank lines are ignored. The `*` is a
 * suffix wildcard.
 */
async function loadRedirects() {
  const file = join(websiteDir, "_redirects");
  try {
    const text = await readFile(file, "utf8");
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const [from, to, status = "200"] = parts;
      out.push({
        from,
        to,
        status: Number(status),
        wildcard: from.endsWith("/*")
      });
    }
    return out;
  } catch {
    return [];
  }
}

function matchRedirect(url, rules) {
  for (const rule of rules) {
    if (rule.wildcard) {
      const prefix = rule.from.slice(0, -2); // drop the /*
      if (url === prefix || url.startsWith(prefix + "/")) return rule;
    } else if (url === rule.from) {
      return rule;
    }
  }
  return null;
}

async function tryServe(res, fsPath) {
  try {
    const s = await stat(fsPath);
    if (s.isDirectory()) {
      return tryServe(res, join(fsPath, "index.html"));
    }
    const buf = await readFile(fsPath);
    const mime = MIME[extname(fsPath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
    res.end(buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Sanity: warn if `website/` doesn't exist yet so the user knows to build.
  try {
    await stat(websiteDir);
  } catch {
    console.error(
      `× ${websiteDir} doesn't exist, run \`pnpm build:website\` first.`
    );
    process.exit(1);
  }

  const redirects = await loadRedirects();

  const server = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end();
      return;
    }

    let url = req.url.split("?")[0];
    // Strip leading double slashes (some link prefetchers send these)
    url = url.replace(/^\/+/, "/");

    // 1. Direct file match (with /index.html fallback for directories)
    const direct = join(websiteDir, decodeURIComponent(url));
    if (await tryServe(res, direct)) return;

    // 2. Redirect rules from _redirects
    const rule = matchRedirect(url, redirects);
    if (rule) {
      if (rule.status === 200) {
        // Internal rewrite, serve the destination as if it were the URL
        const dest = join(websiteDir, decodeURIComponent(rule.to));
        if (await tryServe(res, dest)) return;
      } else {
        // 301/302, actual redirect
        res.writeHead(rule.status, { Location: rule.to });
        res.end();
        return;
      }
    }

    // 3. 404: try to serve the docs 404 if it exists, otherwise plain
    if (await tryServe(res, join(websiteDir, "404.html"))) {
      res.statusCode = 404;
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404, Not Found");
  });

  server.listen(port, () => {
    console.log(`\n  ✓ Fluid website preview`);
    console.log(`    http://localhost:${port}\n`);
    console.log(`  Routes:`);
    console.log(`    /                 landing (placeholder until the marketing site lands)`);
    console.log(`    /docs/            documentation portal`);
    console.log(`    /storybook/       interactive component reference`);
    console.log(`    /playground/      live theme builder`);
    console.log(`    /demos/           settings · admin · landing`);
    console.log(`\n  Press Ctrl+C to stop.\n`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
