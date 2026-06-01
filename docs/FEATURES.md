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

## The pitch (one-liners for the landing page)

Lift these directly onto marketing surfaces. Each maps to a capability below.

- **Framework-agnostic.** Standard web components: drop them into React, Vue,
  Angular, Svelte, Solid, or plain HTML. No wrappers. (The same admin portal,
  built in native HTML, React, Next.js, and Angular, ships as a live demo.)
- **No build step required.** Load from a CDN with a `<script>` tag, or install
  via npm for bundled apps.
- **Accessible by default: AA today, AAA on a switch.** Every component meets
  WCAG 2.2 Level AA out of the box, with an opt-in AAA conformance mode.
- **Themeable down to a single element.** One brand variable retheming
  everything, or override one component, or one instance, live, in the
  browser, with a visual Theme Builder that exports the CSS.
- **Lean core, opt-in power.** Charts, markdown, media, QR, and animations ship
  as separate packages you add only if you need them.
- **Bring your own icons.** Ships ~1,500 Lucide icons out of the box, but the
  icon registry is open, register your own set or override ours under any name.
  Not locked to one icon library.
- **Documented three ways.** A docs site, an interactive Storybook, and a live
  Theme Builder, all the same components.

---

## Capabilities

### Framework-agnostic component library ✅
- Built on standard custom elements (Lit 3 + TypeScript): work in every
  framework and in plain HTML.
- **101 components** across inputs, layout, feedback, navigation,
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
  an **aspect-ratio** box, a **theme toggle**, and a non-visual **hotkey**
  (keyboard-shortcut) behavior.
- **Date family**: an accessible **calendar** (WAI-ARIA APG grid with full
  keyboard navigation), a form-associated **date picker**, and a **date range
  picker** with dual calendars and configurable presets. ISO `YYYY-MM-DD`
  values, locale-aware formatting, min/max bounds.
- Distributed as scoped `@fluid-ds/*` packages.
- Side-effect-free imports + per-component `/define/*` entry points, so a
  consumer ships only the components they register.

### Delivery: CDN and npm ✅
- ✅ CDN-first: a `<link>` + `<script>` from jsDelivr/unpkg, no bundler needed.
- ✅ npm / bundler path with tree-shakable per-component entry points.
- ✅ **Published**: all `@fluid-ds/*` packages are live on the public npm
  registry under the `alpha` tag (current release `0.0.3-alpha`). Install with
  `npm i @fluid-ds/components@alpha`.

### Accessibility: WCAG 2.2 ✅ AA / 🔨 AAA
- ✅ Every component built to **WCAG 2.2 Level AA**: semantics from the WAI-ARIA
  APG, keyboard contracts, focus management, 24×24 target sizes, 4.5:1 contrast,
  `prefers-reduced-motion` honored.
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
- ✅ **Three brand presets** out of the box: Default, Midnight, Corporate
  (`data-fluid-brand`), pure CSS, swap at runtime.
- ✅ **Semantic action tones**: brand / neutral / success / danger / warning /
  info, theme-independent, so a delete button stays red across brands.
- ✅ **Motion system**: overlays (dialog, drawer, toast, popover, tooltip,
  accordion) animate their own enter/exit and tabs / segmented-control slide
  their active indicator. Timing rides shared motion tokens
  (`--fluid-duration-*`, `--fluid-easing-*`); the *animation itself* is a
  swappable token (`--fluid-<comp>-enter-animation`); and motion is opt-out at
  any scope (`--fluid-motion: 0`, per-animation `none`, or automatic
  `prefers-reduced-motion`). Same override ladder as color/shape.

### Theme Builder (playground) ✅
- ✅ Live, in-browser visual token editor.
- ✅ **Design Mode**: click any component to inspect + edit just the tokens it
  uses; per-element isolation for one-off overrides.
- ✅ Exports a ready-to-paste brand CSS file (and per-instance rules).
- ✅ URL-shareable state.

### Icons ✅
- ✅ Lucide-backed icon registry (~1,500 icons available; a curated default set
  registered up front; lazy `loadIcon()` for the rest).
- ✅ **Bring your own icons.** The registry is name→SVG, so consumers can
  register their own icon set under any name, or override Fluid's defaults:
  not locked to Lucide. Swap in your brand's custom icons without forking.
- ✅ `<fluid-icon>` with token-driven sizing/color.

### Expansion packs (opt-in) ✅
Kept out of the core so the base bundle stays lean:
- ✅ `@fluid-ds/charts`: chart components.
- ✅ `@fluid-ds/scheduler`: accessible appointment scheduler (calendar with
  bookable time slots + availability dots), a standalone time-slot radiogroup,
  an owner-side hours editor, and a framework-free availability engine
  (server-usable). Form-associated; lazy per-month booking fetch.
- ✅ `@fluid-ds/table`: accessible data grid (sortable, selectable, semantic
  `<table>`).
- ✅ `@fluid-ds/calendar`: event calendar (month view of events; distinct from
  the booking scheduler).
- ✅ `@fluid-ds/editor`: lightweight accessible rich-text editor (toolbar +
  contenteditable).
- ✅ `@fluid-ds/kanban`: drag-and-drop board with a full keyboard path.
- ✅ `@fluid-ds/map`: themed Leaflet map wrapper with markers.
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
- ✅ `@fluid-ds/media`: video / animated image / zoomable frame / audio player /
  lightbox gallery.
- ✅ `@fluid-ds/animations`: attribute-driven keyframe animation system
  (`data-fluid-animation`) plus an imperative **event-effects** engine
  (`confetti`, `fireworks`, emoji / image burst + rain, snow, sparkles,
  streamers, pulse, and a declarative `<fluid-celebrate>`), reduced-motion aware.

### Documentation & developer surfaces ✅
- ✅ **Docs site** (Astro Starlight): guides, per-component pages with live
  examples + framework tabs, auto-generated API tables from the Custom Elements
  Manifest, theming/forms/a11y/SSR guides, plus a **CMS & server-rendered**
  guide covering Umbraco (Razor), WordPress, and Laravel (Blade) integration.
- ✅ **Self-dogfooding code blocks**: every code sample in the docs renders
  through our own `<fluid-code-block>` (Expressive Code disabled). Shiki still
  highlights, dual-theme follows the light/dark toggle, and our header bar
  (filename / language + copy button) frames each block, proof the component
  holds up in production, not just in demos.
- ✅ **Storybook**: interactive props / states / a11y explorer.
- ✅ **Demos**: settings + admin sample apps, plus **four framework-integration
  admin portals** — the *same* portal built in **native HTML, React, Next.js,
  and Angular** — proving the components are genuinely framework-agnostic
  (see "Framework integration portals" below).
- ✅ **Unified website build**: one deploy artifact serving landing + docs +
  Storybook + Theme Builder + demos (including the four framework portals at
  `/demos/{native,react,next,angular}/`).

### Quality & tooling ✅
- ✅ Cross-engine component tests (Chromium / Firefox / WebKit via Playwright +
  web-test-runner).
- ✅ Visual-regression screenshots vs every Storybook story.
- ✅ `pnpm verify` gate: typecheck → lint → coverage (story + docs page +
  playground card per component) → test → build.
- ✅ SSR-safe (define on client, server emits plain HTML); SSR guide shipped.

### Framework integration portals ✅ (local 🔨 → published 📋)
- ✅ **One admin portal, four frameworks**: native HTML (buildless import map),
  **React** (19 + Vite), **Next.js** (15 App Router, SSR-safe + static export),
  and **Angular** (20 standalone). All four are byte-for-byte the same UI —
  dashboard with Fluid-themed charts, a users table with dialog + toasts, a
  settings form, and live brand + light/dark theming — each consuming the
  identical `@fluid-ds/*` components. They're the canonical per-framework
  integration reference (the docs "Framework integrations" guide links them).
- 🔨 Today they consume the **local workspace build**: the native demo via an
  import map (one line to repoint at a CDN), the framework apps via
  `workspace:*` deps.
- 📋 Flipping them to the **published npm packages / CDN** is the only remaining
  step, and depends on the first npm publish.
- 🔨 A **package wizard** app (build a custom bundle) is under construction.

---

## Package matrix

| Package | What it is | Status |
| --- | --- | --- |
| `@fluid-ds/tokens` | Design tokens → CSS + manifest | ✅ |
| `@fluid-ds/components` | The 57-component core library | ✅ |
| `@fluid-ds/icons` | Lucide-backed icon registry | ✅ |
| `@fluid-ds/themes` | Brand presets (Midnight, Corporate) | ✅ |
| `@fluid-ds/charts` | Charts (opt-in) | ✅ |
| `@fluid-ds/markdown` | Markdown rendering (opt-in) | ✅ |
| `@fluid-ds/qr` | QR codes, incl. logo-embedded fancy codes (opt-in) | ✅ |
| `@fluid-ds/parser` | Blueprint-driven JSON / CSV / Excel file import (opt-in) | ✅ |
| `@fluid-ds/media` | Video / media (opt-in) | ✅ |
| `@fluid-ds/animations` | Keyframe animations + event effects, e.g. confetti (opt-in) | ✅ |

---

## Keeping this current

**Whenever a big feature lands or changes status, update this file in the same
change.** "Big feature" = a new package, a new app/surface, a capability worth a
line on the marketing page, or a status flip (📋 → 🔨 → ✅). The landing page
and any pitch material should be regenerated from this list, not maintained
independently, this is the single source of truth.

(This rule is also noted in the root `CLAUDE.md`.)
