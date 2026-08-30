import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDocumentLinks, documentLinks } from "./check-doc-links.mjs";

function check(html, target = '<h2 id="details">Details</h2>', options) {
  const documents = new Map([
    ["index.html", documentLinks(html)],
    ["guide/index.html", documentLinks(target)]
  ]);
  return checkDocumentLinks(documents, new Set([...documents.keys(), "asset.svg"]), options);
}

test("checks local pages, fragments, query strings and file links", () => {
  const result = check('<a href="guide/?mode=one#details">Guide</a><a href="asset.svg">Asset</a>');
  assert.equal(result.checked, 2);
  assert.deepEqual(result.failures, []);
});

test("rejects missing pages and missing fragments instead of counting link presence", () => {
  const result = check('<a href="missing/">Page</a><a href="guide/#absent">Fragment</a>');
  assert.deepEqual(
    result.failures.map((item) => item.reason),
    ["Missing local target", "Missing fragment #absent"]
  );
});

test("uses parsed HTML entities, encoded fragments and ignores inert templates", () => {
  const result = check(
    '<a href="guide/#a%26b">Valid</a><a href="guide/#inert">Invalid</a>',
    '<h2 id="a&amp;b">Heading</h2><template><h2 id="inert">Not a document target</h2></template>'
  );
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].reason, "Missing fragment #inert");
});

test("normalizes relative links and handles mounted documentation", () => {
  const result = check(
    '<a href="/docs/guide/#details">Guide</a>',
    '<h2 id="details">Heading</h2><a href="../">Home</a>',
    { base: "/docs/" }
  );
  assert.equal(result.checked, 2);
  assert.deepEqual(result.failures, []);
});

test("reports external and separately built application links as unvalidated", () => {
  const result = check(
    '<a href="https://example.org/">External</a><a href="/demos/react/">Demo</a><a href="mailto:a@example.org">Mail</a>'
  );
  assert.equal(result.checked, 0);
  assert.equal(result.outsideScope, 3);
  assert.deepEqual(result.failures, []);
});

test("rejects malformed encoded targets", () => {
  assert.equal(
    check('<a href="guide/#%E0%A4%A">Broken</a>').failures[0].reason,
    "Invalid percent encoding"
  );
});

test("mounted docs do not silently exempt mistyped root-relative documentation links", () => {
  const result = check('<a href="/guide/">Missing base</a><a href="/">Landing</a>', undefined, {
    base: "/docs/"
  });
  assert.equal(result.failures[0].reason, "Link escapes documentation base");
  assert.equal(result.outsideScope, 1);
});
