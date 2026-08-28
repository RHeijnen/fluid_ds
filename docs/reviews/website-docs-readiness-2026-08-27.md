# Website and documentation readiness review — 2026-08-27

## Scope and evidence boundary

This pass covered the locally built landing page and documentation site: visitor
navigation, mounted-base links, separately built application routes, keyboard
semantics, responsive navigation CSS, light/dark token usage, and public claims.
It did not deploy or fetch production, external, Storybook, playground, wizard,
or demo URLs. The in-app browser was unavailable, so this is build, source,
generated-HTML, unit, and raster-inspection evidence—not human visual or
assistive-technology acceptance.

## Reproduced defects and repairs

1. The landing page and Button guide placed `<fluid-button>` inside `<a>` for
   navigation. Because the component owns a native shadow-DOM `<button>`, this
   created nested interactive controls. Navigation now uses styled real anchors;
   the guide explicitly documents the semantic rule, and a source guard rejects
   regressions.
2. A production-base docs build at `/docs/` left 708 authored links rooted at
   `/components/`, `/guides/`, and similar paths. They escaped the docs mount even
   though the config comment claimed automatic prefixing. A Markdown/MDX transform
   now prefixes authored documentation links while preserving `/`, already-prefixed
   URLs, and the independently built `/demos`, `/storybook`, `/playground`, and
   `/wizard` surfaces. The rebuilt 136-page output has zero local link or fragment
   failures.
3. On narrow viewports the landing header hid every primary destination except
   GitHub. The header now wraps into a horizontally scrollable native-link row, so
   all destinations remain keyboard reachable without a custom menu state machine.
4. Landing copy conflated 103 component families with element count, described a
   pre-1.0 line as stable, claimed pixel-for-pixel framework identity, and made an
   unconditional per-component accessibility claim. Copy and metadata now use the
   repository-backed 124 core elements / 103 families / 13 expansion packs model,
   and claims are limited to the evidence actually maintained. The SVG social card
   was updated and its 1200×630 PNG was regenerated and inspected for clipping and
   readability.

## Executable evidence

- Landing TypeScript: pass.
- Landing production build: pass; 175 modules. The generated main chunk is
  530.75 kB (151.31 kB gzip), which triggers Vite's 500 kB warning.
- Docs `astro check`: 13 files, zero errors, warnings, or hints.
- Docs production build with `DOCS_BASE=/docs/`: pass; 136 pages, 135 indexed by
  Pagefind.
- Root-base documentation link check: 24,231 local links/fragments checked,
  571 links outside this artifact's validation scope, zero failures. The production-
  base traversal checks 24,230 with 572 outside scope and zero failures.
- Focused website/link tests: 16 passing cases covering HTML link resolution,
  mounted-base rewriting, nested-interactive rejection, stale-claim rejection, and
  separate-surface classification.
- Website source guard: two root/local references, 17 independently built surface
  references, six external references, zero failures. These are source counts, not
  reachability claims.
- Canonical-manifest check: the first run failed closed on stale generated output;
  regeneration and the rerun pass 27/27 guards and verify 14 manifests / 155 elements.
- Quality inventories pass for 155 elements, 14 packages, 102 interaction-attributed
  elements, 155 SSR-rendered elements, and the 12-surface localization inventory.

## Remaining validation and follow-up

- Retain human keyboard, responsive, light/dark, and focus inspection as an owner
  gate; the automated browser journeys below are not human visual acceptance.
- Validate the unified staged artifact so the 17 separately built application
  references and redirect rules are exercised together.
- Validate external and deployed URLs independently; the local checks intentionally
  do not turn URL presence into reachability evidence.
- Investigate code splitting for the 524 kB landing chunk and 738 kB docs Head chunk.
- Astro logs `Entry docs → 404 was not found` while still emitting `/404.html`. The
  local landing/docs harness now verifies that artifact with a real 404 response;
  the complete separately built deployment remains outside this pass.

## Automated visitor-journey follow-up

A repository-owned local harness now serves the already-built landing artifact at
`/` and the production-base documentation artifact at `/docs/` from one ephemeral
origin. It selects an available port, validates both build inputs before listening,
contains decoded paths inside their declared roots, serves correct MIME types,
records every HTTP status, redirects `/docs` to `/docs/`, returns the generated docs
404 with an actual 404 status, and closes cleanly on success or failure. Its CLI is
explicit that Storybook, playground, wizard, demos, external URLs, and deployment
behavior are outside this two-surface harness.

The Playwright journey runner owns the preview and browser-server lifecycles and
runs the following in Chromium, Firefox, and WebKit:

- landing load and real `Get started` navigation into mounted docs;
- the bare `/docs` canonical redirect;
- the Button guide's `#as-a-link` anchor, live custom-element registration, and
  absence of nested interactive controls in the navigation demo;
- a missing route with a real HTTP 404 response;
- keyboard navigation and Enter activation;
- landing and docs light/dark controls, including Fluid token synchronization;
- 360×740 landing navigation retention and document-width containment;
- 360×740 docs reflow and main-content containment.

All eight journeys pass in each engine (24 executions, 233 HTTP requests) with zero unexpected console warnings or
errors, page errors, request failures, external requests, or HTTP errors. The run
records expected navigation cancellation/404 console noise separately rather than
hiding it. Browser processes and the preview server report closed lifecycle state.
Headless WebKit follows Safari's default preference of omitting links from sequential
Tab order, so Chromium and Firefox exercise Tab discovery while WebKit verifies Enter
activation after explicit focus. This is an automation boundary, not a claim about a
user's Safari Full Keyboard Access setting.

The preview-harness unit suite also covers landing/docs routing, the canonical
redirect, actual 404 status, malformed percent encoding, and path containment. Along
with the earlier link/source guards, the focused suite now has 16 passing cases.

The bundle warnings were causally inspected but not changed. The landing eagerly
renders live examples requiring 29 core definitions and three Chart.js-backed chart
definitions; docs intentionally registers 102 core definitions so arbitrary live
examples work on every generated page. Splitting these safely requires a deliberate
loading/registration contract and page-level regression coverage. A superficial
manual-chunk configuration would move bytes between files without reducing the
required startup payload, so this pass does not claim an optimization.

The interactive in-app browser remained unavailable after its prescribed discovery
and recovery check. The evidence above comes from the repository's installed
Playwright engines and is not human visual or assistive-technology acceptance.
