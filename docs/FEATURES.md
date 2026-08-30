# Fluid: feature list

The canonical capability list for Fluid. **This is the source of truth the
marketing / landing page draws from.** When a big feature lands (or its status
changes), update this file in the same PR, see "Keeping this current" at the
bottom.

Status legend:

- ✅ **Shipped**: built, tested, usable today.
- 🔨 **In progress**: partially built or actively under construction.
- 📋 **Planned**: designed / speced but not built yet.

---

## Production-readiness checkpoint (2026-08-28)

The approved certification program is in progress. Local WIP checkpoints are
committed through `5ef233a`; nothing has been pushed. The catalog
contains 155 elements: 124 core and 31 expansion.
All 102 elements currently classified as interactive/composite have passing
representative Storybook contracts. This is not complete behavioral coverage.
The frozen-source pinned-Linux stable-depth matrix passes 765 checks across three
engines (255 per engine), including the catalog axe audits, native interaction
contracts, and nine newer causal depth cohorts, with a clean supervised lifecycle.
Historical Windows platform failures remain retained. Manual
assistive-technology and fluent-locale review, visual baseline approval, native
Safari/mobile proof, and release-candidate certification remain open. Seven
representative packed consumers have retained relocated offline/frozen replay: React,
Astro, Next.js, SvelteKit, Vue, Angular, and plain TypeScript/HTML. React, Vue,
Angular, and plain TypeScript/HTML prove CSR; Astro, Next.js, and SvelteKit prove
build-time static DSD. A separate packed Next production-server gate proves
request-time rendering, concurrent request isolation, cache semantics, and the
same hydration contract in all three engines; it does not certify a deployed
hosting adapter. The final synchronized
relocated replay passes every frozen install, typecheck, production build and
immutable-byte check, with 39/39 runtime records across the three engines. This
certifies the selected corpus bytes. After replacing React's 14 internal
development-only `workspace:*` ranges with exact `0.4.0` ranges, 10/10 initial
and 5/5 final raw React packs are byte-identical.
Browser test source now has its own TypeScript gate: 142 files across all 14
component packages, rather than relying on runtime transpilation. A separate
Node gate checks 1,904 cold built-JavaScript imports, all 155 catalog renders and
18 renderer-contract tests. Export-map targets and render catalog completeness have separate guards.
Canonical manifests cover all 14 component packages and generate 155 React wrappers;
38 of 166 event mappings have verified payload types, with 128 explicitly unknown.
All 14 actual packed manifests pass. A fresh 18-package consumer passes strict
peer installation, public-file checks, 16 JavaScript roots and 16 type roots, with a
portable lock and actual archives retained. This is not individual browser
runtime verification of every typed event mapping or every framework.
Four formatters now inherit language with deterministic English fallback; 136
targeted cases pass separately in all three engines, including normal shutdown.
Translation call arguments are type checked, not only message keys. The current
cross-browser unit matrix passes 2,501 assertions per engine, or 7,503 executions
across 42 package/engine runs. Fresh Chromium coverage executes those 2,501
assertions and passes all 14 ratcheted package floors, with no missing required
runtime files. The 136-page documentation build checks 26,043 local links/fragments
with zero failures. The complete browser accessibility regression passes 642/642
(214 per engine) with zero retries, skips or flakes. The fresh integrated browser
SSR matrix passes 231/231 across Chromium, Firefox and WebKit in 6.5 minutes. Its
new scheduler regression verifies that validity focus falls back to the first
enabled calendar day when the late-day roving day is disabled; the scheduler unit
suite passes 68/68. The serial suite's global timeout increased from 420 to 600
seconds for the 213-to-231-case growth, while individual 60-second timeouts remain.
Packed CEM validation passes 14/14; the packed-package gate passes 32/32 policy
guards, all 18 tarballs and installed packages, and 16 runtime plus 16 type roots.
The supply-chain gate passes 11/11 without waiving the open dependency audit.
Core bundle ceilings remain unchanged at 19,000 B for Button, 14,000 B for
Dialog, 16,000 B for Input and 23,000 B for React Button; their focused gate
passes. Disabled-fieldset
preservation moved from universal `FluidElement` into an opt-in controller on
seven form controls, with a nested-fieldset reconnect regression. Deterministic
visual setup now advances nine animated Chart fixtures to their final frame and
uses inline/local assets for AspectRatio, Lightbox and Map stories. These machine
repairs do not approve any image. The authoritative exact-tree
`FLUID_BROWSERS=all corepack pnpm@9.15.0 verify` passed on `0879c8b` in 789
seconds; its retained log SHA-256 is
`792e65305237cd332dd6a4e5a146145b590d192b6686bce345490c2e6b0de0ec`.
On clean HEAD `5ef233a`, the pinned framework profile and all explicit serialized
lanes pass (400 seconds summed; 493 seconds wall). The exact
`corepack pnpm@9.15.0 publish:dry` rehearsal also exits 0 and records all 18
packages at `0.4.0`, with no failures, network commands or publish commands in
`quality/evidence/release-dry-run/2026-08-28T11-32-38-136Z/result.json`.
This machine evidence does not accept visual baselines, close human or external
gates, or authorize a push, publish, deploy or tag.
The historical failed runs remain evidence, not silently relabeled passes.
No stable promotion or whole-catalog AA/AAA conformance is certified by these
counts. See [the execution plan](plans/production-readiness-plan.md).

Subsequent color-picker hardening passes 18 focused client/DSD browser checks,
87 unit executions and the complete 114-case SSR browser gate. Required native
form-focus coverage is now 11/16 controls. This repairs native validation focus,
duplicate text events, disabled editing surfaces and shorthand native-color values;
it does not expand input/checkbox-only pre-hydration state adoption. Full workspace
verification of this slice passes 6,897 unit executions, builds, Node SSR and
24,224 local documentation links. The dedicated coverage, Storybook, accessibility,
packed-consumer and performance gates were not rerun for this slice. See
[the scoped evidence](reviews/color-picker-form-contract-2026-08-26.md).

File-input hardening adds actual chooser-backed file contracts with exact names,
MIME types and bytes. Eighteen focused client/DSD checks, 93 unit executions and
the expanded 132-case SSR browser gate pass across all three engines. Required
native form-focus coverage is now 12/16. Reproduced repairs cover visible invalid
focus, synchronous multipart event data, disabled selection/removal, native
button keyboard semantics and removal focus. A live Storybook check measured the
visible picker at 420×132 CSS pixels with a 2px focus ring and 2px offset. This
does not certify OS dialog UI, pre-registration selection adoption, reload file
restoration, manual AT, themes or complete localization. See
[the scoped file-input evidence](reviews/file-input-form-contract-2026-08-26.md).
The explicit all-engine full verification checkpoint also passes 6,906 unit
executions across 42 package/engine runs, 18 builds, 1,903 cold imports, 155
renders and 24,224 checked local documentation links.

OTP hardening adds real sequential typing, Backspace and native clipboard-paste
contracts for empty, partial and complete codes. Eighteen focused client/DSD
checks, 90 unit executions and the expanded 150-case SSR browser gate pass
across Chromium, Firefox and WebKit. Required native form-focus coverage is now
13/16. Repairs cover delegated host/DSD focus, first-missing-box validation,
synchronous FormData during public events and render-cycle-free length clamping.
This does not certify pre-registration OTP adoption, password-manager/autofill
UI, mobile virtual keyboards or manual screen-reader behavior. See
[the scoped OTP evidence](reviews/otp-form-contract-2026-08-26.md).

Radio-group hardening adds first-enabled and selected-option native validation
focus, real pointer/keyboard roving selection, synchronous change-event FormData,
dynamic option removal/disable reconciliation, fieldset-disabled restoration and
an all-options-disabled focus fallback. Eighteen focused client/DSD checks, 57
unit executions and the expanded 168-case pinned-Linux SSR gate pass across all
three engines. Required native form-focus coverage is now 14/16. This does not
certify pre-registration state adoption or manual AT. See
[the scoped radio-group evidence](reviews/radio-group-form-contract-2026-08-26.md).

Date-range-picker hardening makes its typeable and non-typeable validation-focus
policy explicit and verifies incomplete draft, Cancel and Apply behavior. It adds
synchronous event FormData, canonical interval restoration and render-cycle-free
dialog preparation. Eighteen focused client/DSD checks, 60 unit executions and
the expanded 186-case pinned-Linux SSR gate pass across all three engines.
That slice advanced native form-focus coverage to 15/16 before scheduler. See
[the scoped date-range evidence](reviews/date-range-picker-form-contract-2026-08-27.md).

Scheduler closes the scoped native required-focus inventory at 16/16. Its
correction target now follows the calendar/slot state, public events expose
synchronous FormData, canonical appointment state restores, and scheduler plus
time-slot UI strings use ten typed terms shipped in all six locales. Eighteen
client/DSD browser checks, 186 scheduler-package unit executions, 36 focused
calendar executions, 150 localization executions and the exact 204-case
pinned-Linux SSR gate pass across all three engines. See
[the scoped scheduler evidence](reviews/scheduler-form-contract-2026-08-27.md).
The completed native-focus batch also passes the coordinated all-engine full
verification: 6,942 unit executions across 42 package/engine runs, 18 builds,
1,903 cold imports, 155 renders, the 136-page docs build and 24,224 local links.

## The pitch (one-liners for the landing page)

Lift these directly onto marketing surfaces. Each maps to a capability below.

- **Free, now and permanently.** MIT licensed: no license fees, no seat
  pricing, no paid tier, no license key. Free for personal and commercial use;
  credit is appreciated, never required.
- **Framework-agnostic.** Standard web components: drop them into React, Vue,
  Angular, Svelte, Solid, or plain HTML. Wrappers are optional. (The same admin portal,
  built in native HTML, React, Next.js, and Angular, ships as a live demo.)
- **No build step required.** Load from a CDN with a `<script>` tag, or install
  via npm for bundled apps.
- **Accessibility built in, certification in progress.** Semantic controls,
  keyboard behavior and automated audits support the WCAG 2.2 AA target.
  Enhanced conformance settings do not replace component and application review.
- **Themeable down to a single element.** One brand variable retheming
  everything, or override one component, or one instance, live, in the
  browser, with a visual Theme Builder that exports the CSS.
- **Lean core, opt-in power.** Charts, markdown, media, QR, and animations ship
  as separate packages you add only if you need them.
- **Bring your own icons.** Ships ~1,545 Lucide icons out of the box, but the
  icon registry is open, register your own set or override ours under any name.
  Not locked to one icon library.
- **Documented four ways.** A docs site, an interactive Storybook, a live
  Theme Builder, and a Bundle builder wizard (shipped at `/wizard/`), all the
  same components.

---

## Capabilities

### Framework-agnostic component library ✅

- Built on standard custom elements (Lit 3 + TypeScript): work in every
  framework and in plain HTML.
- **124 core elements in 103 component families** across inputs, layout, feedback, navigation,
  content, and format/observer helpers, including a responsive **grid** (column
  / `<fluid-col>`) and a dense bento **mosaic** layout system.
- **Navigation + command surfaces**: an APG **menu** / menubar, a **command
  palette** (⌘K), **pagination**, a **toolbar** (roving tabindex), and a
  **speed-dial** FAB.
- **Form building blocks**: a **field** wrapper (label + description + error),
  an **OTP / PIN** input, and a **tag (token) input**, all form-associated.
- **Content + status**: **timeline**, **stat** (KPI), **avatar group**,
  **banner**, **kbd**, **empty state**, and a **pricing table**.
- **App shell + page structure**: a **hero** masthead, an **app bar**, a
  collapsible **sidebar**, a **nav list**, scroll-spy **anchor nav**, and a
  right-click **context menu**.
- **More form controls**: a **form** orchestrator (clean submit event +
  validity gate), a **fieldset** group, a dual-thumb **range slider**, a
  **time picker**, a **masked input**, a two-pane **transfer** list, and a
  **dropzone** (drag-and-drop file intake), all form-associated where relevant.
- **More feedback + flow**: a **result** page, a **loading overlay**, a
  **popconfirm**, a guided **tour** (coach marks), and a **meter** gauge.
- **More content + utility**: a **description list**, a generic **list**, a
  responsive **image**, a **countdown**, a **truncate** (line-clamp + reveal),
  a **fold** (a divider with a "Show more" disclosure at its centre),
  an **aspect-ratio** box, a **theme toggle**, and a non-visual **hotkey**
  (keyboard-shortcut) behavior.
- **Date family**: an accessible **calendar** (WAI-ARIA APG grid with full
  keyboard navigation), a form-associated **date picker**, and a **date range
  picker** with dual calendars and configurable presets. ISO `YYYY-MM-DD`
  values, locale-aware formatting, min/max bounds.
- **Signature capture**: a **signature pad** that records strokes as ink
  (point sequences, not pixels), so it redraws losslessly on resize, supports
  per-stroke undo, follows pointer pressure, and exports crisp bitmaps at the
  device's real resolution. Form-associated.
- **Field chrome on every text-like control**: `label` / `help-text`
  attributes on **input, select, textarea, typeahead, time picker, and date
  picker** (via one shared internal helper) attach a real `<label for>` and
  `aria-describedby` help row directly to the control, no wrapper needed.
- **Typeahead multi-pick**: a `keep-open` mode keeps the listbox open after
  each choice (query left intact) so several values can be gathered in a row.
- **Top-layer listboxes**: select and typeahead render their popup listbox in
  the browser top layer with viewport-correct placement, so it escapes
  clipping / overflow containers and stays aligned to the field.
- **Command-palette query reporting**: the palette emits a `fluid-query`
  event as the search text changes, so hosts can load results asynchronously.
- Distributed as scoped `@fluid-ds/*` packages.
- Side-effect-free imports + per-component `/define/*` entry points, so a
  consumer ships only the components they register.

### Delivery: CDN and npm ✅

- ✅ CDN-first: a `<link>` + `<script>` from jsDelivr/unpkg, no bundler needed.
- ✅ npm / bundler path with tree-shakable per-component entry points.
- ✅ **Published**: all `@fluid-ds/*` packages are live on the public npm
  registry under the stable `latest` channel. Install with
  `npm i @fluid-ds/components@latest`.

### Accessibility: WCAG 2.2 ✅ AA / 🔨 AAA

- ✅ Every component built to **WCAG 2.2 Level AA**: semantics from the WAI-ARIA
  APG, keyboard contracts, focus management, 24×24 target sizes, 4.5:1 contrast,
  `prefers-reduced-motion` honored.
- ✅ **Respects the reader's system preferences**, not just the page's. Reduced
  motion, high contrast (Windows forced-colors), dark mode and right-to-left are
  all settings someone chooses once in their operating system, and Fluid follows
  them without the host app wiring anything up. Motion is the clearest case:
  someone who gets migraines or motion sickness from animation sets "reduce
  motion" in Windows or macOS, and Fluid's animations stand down. Where a CSS
  media query cannot reach (canvas-backed charts, scripted sequences), the
  components check the preference in JavaScript and take a still path instead.
  Not a claim on trust: **light, dark, forced-colors, RTL and reduced-motion are
  five machine-verified modes** in the visual-regression suite, rendered across
  the whole component catalog on every run.
- ✅ Internal standard enforced by a committed **accessibility skill** (cited to
  W3C primary sources) + a **component-authoring skill** + a build-time coverage
  gate.
- 🔨 **Switchable AA ↔ AAA conformance** via a `data-fluid-conformance`
  attribute. The **structural deltas ship today**: `--fluid-target-min`
  (24→44px, SC 2.5.5 Target Size Enhanced) and `--fluid-focus-ring-width`
  (2→3px, SC 2.4.13 Focus Appearance) are real tokens in `base.css`;
  components read them and never branch on conformance. Flip the toggle at the
  top of the [button docs](/components/button/#aa-vs-aaa) and every live
  example resizes in place. The 7:1 contrast track (SC 1.4.6), a brand-palette
  concern, is the remaining piece. No mainstream design system is known to
  offer a switchable conformance axis; likely novel ground.
- ✅ a11y is part of the test gate: `@open-wc/testing` axe audits per component.

### Theming ✅

- ✅ Token-driven: a small palette of semantic CSS variables drives every
  component (DTCG-compatible source → CSS + manifest).
- ✅ **Override ladder**: change a brand variable (everything reflows), a
  component variable (all of that component), or a single instance
  (`data-fluid-id`). Component tokens fall back to the main semantic vars so all
  three levels work for free.
- ✅ **Light + dark** schemes (`data-fluid-theme`).
- ✅ **Brand presets** out of the box: Default, Midnight, Corporate (dense
  enterprise surfaces: a ~15% tighter spacing ramp, squared corners, flat
  elevation with ruled borders), Titanium
  (metallic graphite chrome, gray data, colour kept for status), Glass
  (frosted translucent surfaces over a colour wash) and Orchid (violet accent
  track with soft radii and a ~35% roomier spacing ramp). Pure CSS applied via
  `data-fluid-brand`, swappable at runtime, and each one now re-derives the
  accent at its own scope so it themes a single subtree, not only `<html>`.
  Glass composes with the light/dark scheme (wash and frost invert to a dark
  material) and ships a `.fluid-glass-panel` helper so an app's own non-component
  chrome frosts to match from one definition.
- ✅ **Semantic action tones**: brand / neutral / success / danger / warning /
  info, theme-independent, so a delete button stays red across brands.
- ✅ **Motion system**: overlays (dialog, drawer, toast, popover, tooltip,
  accordion) animate their own enter/exit and tabs / segmented-control slide
  their active indicator. Timing rides shared motion tokens
  (`--fluid-duration-*`, `--fluid-easing-*`); the _animation itself_ is a
  swappable token (`--fluid-<comp>-enter-animation`); and motion is opt-out at
  any scope (`--fluid-motion: 0`, per-animation `none`, or automatic
  `prefers-reduced-motion`). Same override ladder as color/shape.

### Theme Builder (playground) ✅

- ✅ Live, in-browser visual token editor.
- ✅ **Composed preview scenes**, not a specimen grid. Sixteen tabbed sections
  each render a realistic surface built from the catalog: a full event-setup
  form, a document editor, a release status page, a project workspace, an
  operational data grid (reorderable + resizable columns), a sprint board, a
  booking console, a docs app frame, a workspace-settings page for overlays, a
  press kit, an analytics board, marketing blocks, the rich-text editor, a node
  graph, maps, and a file-parser import flow.
- ✅ **Design Mode**: hover to see a component's name, click to inspect and edit
  just the tokens it uses. Isolating scopes every edit to that component, so a
  change reaches every instance of it and nothing else, which is the component
  rung of the brand → component → instance ladder. Isolating is retroactive:
  edits made while inspecting move into the component's own rule and the shared
  theme reverts. An isolated component exposes both its own tokens and the
  shared semantics it reads, each prefilled with the value it currently
  resolves to.
- ✅ Follows the light/dark switch: the preview re-resolves semantic tokens for
  the active scheme, and canvas-backed charts repaint when tokens change.
- ✅ Exports a ready-to-paste brand CSS file, plus a `fluid-x { … }` rule per
  customized component. The preview injects that same CSS verbatim, so what is
  previewed cannot drift from what is exported.
- ✅ URL-shareable state: the theme diff and the per-component rules both live
  in the hash, and a shared link restores and repaints on a fresh load.

### Icons ✅

- ✅ Lucide-backed icon registry (~1,545 icons available; a curated default set
  registered up front; lazy `loadIcon()` for the rest).
- ✅ **Bring your own icons.** The registry is name→SVG, so consumers can
  register their own icon set under any name, or override Fluid's defaults:
  not locked to Lucide. Swap in your brand's custom icons without forking.
- ✅ `<fluid-icon>` with token-driven sizing/color.

### Expansion packs (opt-in) ✅

Kept out of the core so the base bundle stays lean:

- ✅ `@fluid-ds/charts`: 10 chart elements, bar, line, pie, doughnut, scatter,
  bubble, radar, polar area, sparkline, plus a shared base, all themed by the
  same tokens.
- ✅ `@fluid-ds/scheduler`: accessible appointment scheduler (calendar with
  bookable time slots + availability dots), a standalone time-slot radiogroup,
  an owner-side hours editor, and a framework-free availability engine
  (server-usable). Form-associated; lazy per-month booking fetch.
- ✅ `@fluid-ds/table`: accessible semantic tables for compact and large
  operational datasets, including sortable and selectable static tables plus
  template-driven infinite loading, sticky filters and headers (with projected
  filter-row and header content slots), row windowing, an opt-in horizontal
  **column scrollbar** (`column-scroll`, placed between header and rows so
  both move together), and configurable columns: shown, ordered (drag or
  keyboard) and sized (drag, double-click to auto-fit, or keyboard) through
  one persistable layout.
- ✅ `@fluid-ds/calendar`: event calendar (month view of events; distinct from
  the booking scheduler).
- ✅ `@fluid-ds/editor`: lightweight accessible rich-text editor (toolbar +
  contenteditable).
- ✅ `@fluid-ds/kanban`: drag-and-drop board with a full keyboard path.
- ✅ `@fluid-ds/map`: themed Leaflet map wrapper with markers.
- ✅ `@fluid-ds/node-graph`: node graph editor with typed connection ports,
  Bezier edges, pan/zoom/fit, drag-to-connect, and a full keyboard path
  (arrow-key node moves, keyboard connection with live target cycling, polite
  live-region announcements). Traversal display (run badges, marching-ants
  edges) is data-driven so a host can replay real runs.
- ✅ `@fluid-ds/markdown`: markdown rendering.
- ✅ `@fluid-ds/qr`: QR codes, including **logo-embedded "fancy" codes** (center
  logo with auto error-correction H, dot / rounded modules, recolorable finder
  eyes, gradients, an opt-in artistic image-background mode, and PNG export).
- ✅ `@fluid-ds/parser`: **blueprint-driven file import**. Drag a JSON / CSV /
  TSV / Excel file onto a Fluid file-drop and parse it against a declarative
  schema: fuzzy column auto-mapping, per-type coercion + validation with
  per-cell errors, and a validated preview with CSV / JSON export. Zero-UI core
  plus `<fluid-file-parser>` / `<fluid-column-mapper>`. XLSX (SheetJS) is loaded
  lazily only when an `.xlsx` is dropped.
- ✅ `@fluid-ds/media`: video / video playlist / animated image / zoomable
  frame / audio player / lightbox gallery.
- ✅ `@fluid-ds/animations`: a standalone, dependency-free motion package with
  its own shareable marketing page (`/animations.html`). Two halves: an
  attribute-driven keyframe system (`data-fluid-animation` plus trigger /
  duration / iterations / easing attributes on any element) and an imperative
  canvas **event-effects** engine with **31 named effects** (confetti,
  fireworks, pride, glitter, coins, embers, fireflies, fog, shooting stars, a
  firework finale, butterflies with steered, side-entry flight paths that never
  fly backwards or upside down, and more), plus a declarative
  `<fluid-celebrate>` wrapper. Every effect returns a handle with `stop()` and
  a graceful `fizzle()` wind-down, ambient effects take a `duration` and end on
  their own, and a regression suite guards against runaway emitters. Palettes
  are purpose-tuned per effect and tint to the live brand ramp only on request
  (`colors: brandColors()`). Reduced-motion aware throughout.

### Documentation & developer surfaces ✅

- ✅ **Docs site** (Astro Starlight): guides, per-component pages with live
  examples + framework tabs, auto-generated API tables from the Custom Elements
  Manifest, theming/forms/a11y/SSR guides, plus a **CMS & server-rendered**
  guide covering Umbraco (Razor), WordPress, and Laravel (Blade) integration.
  Every expansion-pack page opens with a **live, animated embedded demo** (a
  node-graph pipeline run with marching-ants edges, a streaming charts
  dashboard, a draggable kanban board, real celebration-effect triggers, a
  fully offline map, and more), each pausing off-screen and honoring reduced
  motion.
- ✅ **Self-dogfooding code blocks**: every code sample in the docs renders
  through our own `<fluid-code-block>` (Expressive Code disabled). Shiki still
  highlights, dual-theme follows the light/dark toggle, and our header bar
  (filename / language + copy button) frames each block, proof the component
  holds up in production, not just in demos.
- ✅ **Storybook**: interactive props / states / a11y explorer.
- ✅ **Demos**: seven sample apps (settings, admin, data table, analytics,
  booking, sprint board, QR studio) shipped as an installable PWA, plus
  **four framework-integration admin portals**: the _same_ portal built in
  **native HTML, React, Next.js, and Angular**, proving the components are
  genuinely framework-agnostic (see "Framework integration portals" below).
- ✅ **Unified website build**: one deploy artifact serving landing + docs +
  Storybook + Theme Builder + Bundle builder (`/wizard/`) + demos (including
  the four framework portals at `/demos/{native,react,next,angular}/`).

### Quality & tooling

- ✅ Cross-engine component tests (Chromium / Firefox / WebKit via Playwright +
  web-test-runner).
- 🔨 Visual-regression infrastructure with real-fixture guards and five modes.
  The active inventory has 1,009 accepted images and 60 generated candidates;
  candidate human approval remains unfinished. The old exact-hash history retains
  1 flaky execution in 86 (1.163%), but the replacement full-catalog machine
  window passes 50/50 exact runs under the fail-closed, process-attested
  `--num-raster-threads=1` policy, with zero flaky executions and zero
  fresh-capture variance. That retained window covers the 60 candidates plus five
  accepted-smoke images, not the entire accepted set. A partial normal run later
  observed 18 accepted-baseline diffs before cancellation on a changing tree;
  human review must reconcile the candidates, stale Chart captures, and accepted
  AspectRatio/Lightbox/Map pixels changed by hermetic story assets.
  Story attribution is not a passing screenshot comparison.
- ✅ `pnpm verify` checks workspace and browser-test types, lint, formatting,
  catalog/presence, generated-output and command-ownership guards, tokens, unit
  tests, packages, Node SSR and built documentation links. Browser coverage is a
  separate gate; presence checks are not line/function/branch coverage.
- ✅ The catalog/presence gate covers **all 155 published elements across every
  package**, core and expansion packs alike, and matches tags exactly. It
  previously scanned only `packages/components` with a substring match, which
  let expansion-pack elements lose their playground demo unnoticed.
- ✅ Component maturity is declared once in `quality/maturity.json` and enforced
  against the Storybook status of every element, so the two cannot drift.
- 🔨 SSR import safety, DSD rendering and client hydration are distinct tested
  contracts. The representative framework matrix separates CSR from build-time
  static DSD. A packed Next production server additionally passes local
  request-time isolation and all-engine hydration; deployed adapter/ingress proof
  remains open.

### Angular reactive-forms integration ✅

- ✅ `@fluid-ds/angular`: ControlValueAccessor directives that bind Fluid form
  controls with `[(ngModel)]`, `formControlName`, or `[formControl]`, no
  hand-written bridge components. One accessor covers the fifteen
  value-carrying controls (input, textarea, number input, masked input,
  select, typeahead, segmented control, radio group, slider, rating, date
  picker, time picker, color picker, tag input, OTP), a second covers the
  boolean pair (checkbox, switch). Values keep the component's own type (a
  slider hands the form a number), `disabled` follows the form state, and
  blur marks controls touched. Compiled in Angular partial-compilation mode
  (links on any Angular 20+ CLI build) and proven end to end in the
  admin-angular demo's settings page, which now runs on a reactive form.

### Framework integration portals ✅

- ✅ **One admin workflow, four demos**: native HTML (buildless import map),
  **React** (19 + Vite), **Next.js** (15 App Router, static host output), and
  **Angular** (20 standalone). They share dashboard, users, settings, and theme
  functionality while consuming the same `@fluid-ds/*` components. This is a
  functional comparison, not byte-identical or pixel-equivalent evidence. The
  docs "Framework integrations" guide links them and the separate seven-consumer
  packed contract matrix.
- ✅ The **native demo consumes the published packages straight from the
  jsDelivr CDN** via its import map, the real buildless path an end user would
  write. The framework apps consume the workspace packages that are published
  as-is to npm (`latest`).
- ✅ The **Bundle builder wizard** (pick components, generate a custom bundle)
  is shipped at `/wizard/`.

---

## Package matrix

| Package                | What it is                                                                             | Status |
| ---------------------- | -------------------------------------------------------------------------------------- | ------ |
| `@fluid-ds/tokens`     | Design tokens → CSS + manifest                                                         | ✅     |
| `@fluid-ds/components` | The core library: 103 component families (124 elements)                                | ✅     |
| `@fluid-ds/icons`      | Lucide-backed icon registry                                                            | ✅     |
| `@fluid-ds/themes`     | Brand presets (Midnight, Corporate, Titanium, Glass, Orchid)                           | ✅     |
| `@fluid-ds/charts`     | Charts (opt-in)                                                                        | ✅     |
| `@fluid-ds/scheduler`  | Appointment / availability scheduler: bookable time slots + hours editor (opt-in)      | ✅     |
| `@fluid-ds/table`      | Data grid: sortable, selectable, plus infinite loading + configurable columns (opt-in) | ✅     |
| `@fluid-ds/calendar`   | Event calendar: month view of events (opt-in)                                          | ✅     |
| `@fluid-ds/editor`     | Accessible rich-text editor: contenteditable with a toolbar (opt-in)                   | ✅     |
| `@fluid-ds/kanban`     | Kanban board: drag-and-drop columns and cards with keyboard moves (opt-in)             | ✅     |
| `@fluid-ds/map`        | Themed Leaflet map wrapper with markers (opt-in)                                       | ✅     |
| `@fluid-ds/node-graph` | Node graph editor: typed ports, Bezier edges, keyboard-first (opt-in)                  | ✅     |
| `@fluid-ds/markdown`   | Markdown rendering (opt-in)                                                            | ✅     |
| `@fluid-ds/qr`         | QR codes, incl. logo-embedded fancy codes (opt-in)                                     | ✅     |
| `@fluid-ds/parser`     | Blueprint-driven JSON / CSV / Excel file import (opt-in)                               | ✅     |
| `@fluid-ds/media`      | Video / media (opt-in)                                                                 | ✅     |
| `@fluid-ds/animations` | Standalone keyframes + 31 canvas event effects with graceful wind-down (opt-in)        | ✅     |
| `@fluid-ds/angular`    | Angular ControlValueAccessor directives: ngModel / reactive forms on fluid-\* controls | ✅     |

---

## Keeping this current

**Whenever a big feature lands or changes status, update this file in the same
change.** "Big feature" = a new package, a new app/surface, a capability worth a
line on the marketing page, or a status flip (📋 → 🔨 → ✅). The landing page
and any pitch material should be regenerated from this list, not maintained
independently, this is the single source of truth.

(This rule is also noted in the root `CLAUDE.md`.)
