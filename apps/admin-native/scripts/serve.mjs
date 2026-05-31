/**
 * Zero-dependency static file server for the buildless admin portal. There is
 * no app bundler here on purpose: the browser loads our plain ESM modules and
 * resolves `@fluid-ds/*` through the import map in index.html. We just need
 * something to serve files over http with correct MIME types (file:// can't do
 * ES modules / import maps). Hash routing means every route is index.html.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const startPort = Number(process.env.PORT) || 4318;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost`);
    let pathname = decodeURIComponent(url.pathname);
    // Static assets are served as-is; anything without a file extension is a
    // client route, so fall back to index.html (hash router takes over).
    let filePath = join(appDir, normalize(pathname));
    if (pathname === "/" || !extname(pathname)) filePath = join(appDir, "index.html");
    // Block path traversal outside the app dir.
    if (!filePath.startsWith(appDir)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
});

// Try the start port, then the next few if it's taken (no hard crash).
let attempts = 0;
function listen(port) {
  server.listen(port);
}
server.on("listening", () => {
  const { port } = server.address();
  console.log(`\n  Fluid admin (native) → http://localhost:${port}/\n`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && attempts < 10) {
    attempts += 1;
    listen(startPort + attempts);
  } else {
    throw err;
  }
});
listen(startPort);
