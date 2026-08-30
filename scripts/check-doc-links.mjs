import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
// Use the HTML parser already pinned by the documentation build toolchain.
const docsRequire = createRequire(join(root, "apps/docs/package.json"));
const { parse } = createRequire(docsRequire.resolve("astro"))("parse5");

export function documentLinks(html) {
  const links = [];
  const ids = new Set();
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === "a") {
      if (attrs.name) ids.add(attrs.name);
      if (attrs.href !== undefined) links.push(attrs.href);
    }
    for (const child of node.childNodes ?? []) visit(child);
    // Inert template contents are not document fragment targets.
  }
  visit(parse(html));
  return { links, ids };
}

export function checkDocumentLinks(
  documents,
  files,
  {
    base = "/",
    origin = "https://fluid-web.dev",
    // These routes belong to other outputs of build-website.mjs, not docs/dist.
    // /animations.html is the landing's second Vite page (the standalone
    // animation showcase), emitted at the site root next to the landing.
    externalAppPrefixes = ["/demos", "/storybook", "/playground", "/wizard", "/animations.html"]
  } = {}
) {
  if (!base.startsWith("/") || !base.endsWith("/"))
    throw new Error("Documentation base must start and end with /");
  const failures = [];
  let checked = 0;
  let outsideScope = 0;
  for (const [page, document] of documents) {
    const pageURL = new URL(`${base}${page.replace(/index\.html$/, "")}`, origin);
    for (const href of document.links) {
      let target;
      try {
        target = new URL(href, pageURL);
      } catch {
        failures.push({ page, href, reason: "Invalid URL" });
        continue;
      }
      if (!/^https?:$/.test(target.protocol) || target.origin !== pageURL.origin) {
        outsideScope++;
        continue;
      }
      let pathname;
      let fragment;
      try {
        pathname = decodeURIComponent(target.pathname);
        fragment = decodeURIComponent(target.hash.slice(1));
      } catch {
        failures.push({ page, href, reason: "Invalid percent encoding" });
        continue;
      }
      if (
        externalAppPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        ) ||
        (base !== "/" && pathname === "/")
      ) {
        outsideScope++;
        continue;
      }
      if (base !== "/" && !pathname.startsWith(base)) {
        failures.push({ page, href, reason: "Link escapes documentation base" });
        continue;
      }
      checked++;
      const path = pathname.slice(base.length);
      const candidate = [path, `${path.replace(/\/$/, "")}/index.html`, `${path}.html`]
        .map((value) => value.replace(/^\//, ""))
        .find((value) => files.has(value));
      if (!candidate) failures.push({ page, href, reason: "Missing local target" });
      else if (fragment && documents.has(candidate) && !documents.get(candidate).ids.has(fragment))
        failures.push({ page, href, reason: `Missing fragment #${fragment}` });
    }
  }
  return { pages: documents.size, checked, outsideScope, failures };
}

async function main() {
  const directory = resolve(process.argv[2] ?? join(root, "apps/docs/dist"));
  const files = new Set();
  const documents = new Map();
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const name = relative(directory, path).split(sep).join("/");
        files.add(name);
        if (name.endsWith(".html"))
          documents.set(name, documentLinks(await readFile(path, "utf8")));
      }
    }
  }
  await walk(directory);
  if (!documents.size) throw new Error("No built documentation HTML found; build it first");
  const report = checkDocumentLinks(documents, files, {
    base: process.env.DOCS_BASE ?? "/",
    origin: process.env.DOCS_SITE ?? "https://fluid-web.dev"
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
