import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function within(parent, candidate) {
  const path = relative(parent, candidate);
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

async function fileCandidate(directory, pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidate = resolve(directory, `.${decoded}`);
  if (!within(directory, candidate)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory())
      return fileCandidate(directory, `${pathname.replace(/\/$/, "")}/index.html`);
    return info.isFile() ? candidate : null;
  } catch {
    if (!extname(candidate)) {
      try {
        const html = `${candidate}.html`;
        return (await stat(html)).isFile() ? html : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function createWebsitePreview({
  landingDirectory = join(root, "apps/landing/dist"),
  docsDirectory = join(root, "apps/docs/dist"),
  hostname = "127.0.0.1",
  port = 0
} = {}) {
  const landing = resolve(landingDirectory);
  const docs = resolve(docsDirectory);
  for (const [name, directory] of [
    ["landing", landing],
    ["docs", docs]
  ]) {
    const index = await fileCandidate(directory, "/index.html");
    if (!index) throw new Error(`Missing built ${name} index at ${directory}`);
  }

  const requests = [];
  const server = createServer(async (request, response) => {
    const record = { method: request.method ?? "GET", pathname: "", status: 500 };
    try {
      const parsed = new URL(request.url ?? "/", `http://${hostname}`);
      record.pathname = parsed.pathname;

      if (parsed.pathname === "/docs") {
        record.status = 301;
        response.writeHead(301, { Location: "/docs/", "Cache-Control": "no-cache" });
        response.end();
        return;
      }

      let directory = landing;
      let pathname = parsed.pathname;
      if (pathname === "/favicon.ico") pathname = "/favicon.svg";
      if (pathname === "/docs" || pathname.startsWith("/docs/")) {
        directory = docs;
        pathname = pathname.slice("/docs".length) || "/";
      }

      const file = await fileCandidate(directory, pathname);
      if (file) {
        record.status = 200;
        const body = await readFile(file);
        response.writeHead(200, {
          "Cache-Control": "no-cache",
          "Content-Length": body.length,
          "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream"
        });
        response.end(request.method === "HEAD" ? undefined : body);
        return;
      }

      const notFound = await fileCandidate(docs, "/404.html");
      record.status = 404;
      if (notFound) {
        const body = await readFile(notFound);
        response.writeHead(404, {
          "Cache-Control": "no-cache",
          "Content-Length": body.length,
          "Content-Type": "text/html; charset=utf-8"
        });
        response.end(request.method === "HEAD" ? undefined : body);
      } else {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(request.method === "HEAD" ? undefined : "404, Not Found");
      }
    } catch (error) {
      record.status = error instanceof URIError ? 400 : 500;
      response.writeHead(record.status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(record.status === 400 ? "Bad request" : "Internal server error");
    } finally {
      requests.push(record);
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, hostname, resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Preview server has no TCP address");

  return {
    origin: `http://${hostname}:${address.port}`,
    requests,
    async close() {
      await new Promise((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose()))
      );
    }
  };
}

async function main() {
  const preview = await createWebsitePreview({ port: Number(process.env.PORT ?? 4180) });
  console.log(`Fluid landing + docs preview: ${preview.origin}`);
  console.log("Scope: / and /docs/ only; separately built apps are not staged by this harness.");
  const close = async () => {
    await preview.close();
    process.exit(0);
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
