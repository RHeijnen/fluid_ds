import assert from "node:assert/strict";
import { test } from "node:test";
import { auditWebsiteSources } from "./check-website-surfaces.mjs";

test("accepts real anchor navigation and separates independently built routes", () => {
  const report = auditWebsiteSources({
    landingSource: '<a class="landing-button" href="/docs/">Docs</a>',
    landingHtml: '<a href="/">Home</a><a href="https://example.test/">External</a>',
    socialSvg: "<svg><text>124 core elements</text></svg>",
    buttonGuide: '<a class="fluid-doc-link-button" href="/pricing/">Pricing</a>'
  });
  assert.deepEqual(report, {
    sourceFiles: 4,
    localRoutes: 1,
    separatelyBuiltRoutes: 1,
    externalLinks: 1,
    failures: []
  });
});

test("rejects nested interactive navigation and stale marketing claims", () => {
  const report = auditWebsiteSources({
    landingSource:
      '<a href="/docs"><fluid-button>Docs</fluid-button></a><p>Pixel-for-pixel identical.</p><p>4 frameworks proven</p><p>SSR-safe</p>',
    landingHtml:
      '<meta content="103 standard web components"><span>stable 0.x</span><p>Accessible out of the box</p><p>Vue, Svelte, and Solid are supported too</p>',
    socialSvg: "<svg></svg>",
    buttonGuide: '<a href="/pricing"><fluid-button>Pricing</fluid-button></a>'
  });
  assert.deepEqual(report.failures, [
    "landing: anchor contains a fluid-button",
    "button guide: anchor contains a fluid-button",
    "public source: stale or unsupported claim /\\b103 (?:standard web )?components\\b/i",
    "public source: stale or unsupported claim /\\bstable 0\\.x\\b/i",
    "public source: stale or unsupported claim /\\bpixel-for-pixel identical\\b/i",
    "public source: stale or unsupported claim /\\bframeworks proven\\b/i",
    "public source: stale or unsupported claim /\\bSSR-safe\\b/i",
    "public source: stale or unsupported claim /\\baccessible out of the box\\b/i",
    "public source: stale or unsupported claim /\\bVue, Svelte, and Solid are supported too\\b/i",
    "landing: local route lacks a trailing slash: /docs"
  ]);
});

test("checks central public claims in addition to landing copy", () => {
  const report = auditWebsiteSources({
    landingSource: "",
    landingHtml: "",
    buttonGuide: "",
    publicClaims: ["Supported too: Vue, Svelte, and Solid are supported too."]
  });
  assert.equal(report.sourceFiles, 5);
  assert.deepEqual(report.failures, [
    "public source: stale or unsupported claim /\\bVue, Svelte, and Solid are supported too\\b/i"
  ]);
});

test("rejects retained framework and accessibility evidence presented as current", () => {
  const report = auditWebsiteSources({
    landingSource: "",
    landingHtml: "",
    buttonGuide: "",
    publicClaims: [
      "The current browser accessibility suite passes 642 cases.",
      "All seven typecheck, build, and pass their runtime contracts.",
      "All seven representative consumers also pass a relocated replay."
    ]
  });
  assert.deepEqual(report.failures, [
    "public source: stale or unsupported claim /\\bcurrent (?:browser|pinned-Linux) accessibility suite passes 642\\b/i",
    "public source: stale or unsupported claim /\\ball seven typecheck, build, and\\s+pass\\b/i",
    "public source: stale or unsupported claim /\\ball seven representative consumers also pass\\b/i"
  ]);
});
