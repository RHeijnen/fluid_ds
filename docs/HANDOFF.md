# Fluid: Cross-device handoff

This file is the **shared notebook between machines**. It is committed to git, so
whatever you write here travels to the other device on the next `git pull`. Use it
to hand off context when you switch machines.

**How to use**
- **Start of a session:** read the _Current state_ snapshot below to see where things left off.
- **End of a session:** overwrite _Current state_ to reflect reality, and add one
  dated entry to the _Log_. Then commit (`docs: update handoff`) and push.
- Keep it honest and short. Stale notes are worse than none.
- Private, machine-local notes (toolchain quirks for *this* box, scratch thoughts)
  belong in Claude's `memory/`, that folder is **not** synced. This file is.

---

## Current state

- **Branch:** `main`
- **Last verified:** 2026-06-01: `pnpm typecheck` + `pnpm lint` +
  `pnpm check:coverage` + `pnpm test` (854 component tests) + `pnpm build` +
  `pnpm docs:build` (130 pages) + `pnpm storybook:build` all green.
  **101 core component families** (122 elements) plus the expansion packs:
  charts, scheduler, markdown, qr, media (incl. audio + lightbox), table,
  calendar, editor, kanban, map. This session added **26 more core components**
  (75 → 101): `fluid-hero` plus a 25-component batch (form, fieldset,
  range-slider, time-picker, masked-input, transfer, dropzone, app-bar, sidebar,
  nav-list, anchor-nav, context-menu, meter, popconfirm, result, tour,
  loading-overlay, image, description-list, list, truncate, countdown,
  theme-toggle, hotkey, aspect-ratio), each to the full authoring standard
  (story + docs page + playground card + tests). All wired into the core
  `index.ts`, playground, and docs sidebar; OG image + marketing counts bumped
  to 101; changeset `core-components-batch-2.md` added.
- **🚀 Launch status (LIVE on npm; website deploys on next push):**
  - Model: **git is the source of truth; npm package + website are two outputs
    of the same commit.** The website consumes `@fluid-ds/*` via `workspace:*`,
    so they can't drift. The *user-facing* references (README/docs CDN snippets,
    native demo import map) point at the published `@alpha`.
  - ✅ **History squashed** to a single public commit; **repo is public**.
  - ✅ **All 9 `@fluid-ds/*` packages published** to npm at `0.0.1-alpha.0`
    under the **`alpha`** dist-tag (bootstrapped locally, no token; provenance
    was stripped for that one publish then restored). `npm i` default `latest`
    gets nothing until we cut stable. Install today with `@alpha`.
  - **Trusted Publishing is the plan for future releases** (no token): configure
    an OIDC trusted publisher per package on npm, then rewire `release.yml` to
    drop the token + use `id-token` (npm ≥ 11.5.1). NOT done yet, `release.yml`
    still token-shaped (`NODE_AUTH_TOKEN`); revisit before the next publish.
  - **Hosting = Cloudflare Pages**, Direct Upload project **`fluid-25z`** (the
    project keeps that name), served from the custom domain
    **https://fluid-web.dev**. Astro `site` is set to it (override via
    `DOCS_SITE`). The site is currently shipped via **local `wrangler pages
    deploy website --project-name=fluid-25z --branch=main`** (run after
    `pnpm build:website`).
  - **CI auto-deploy NOT working yet:** `deploy.yml` builds + deploys on push to
    `main`, but the Cloudflare token step fails (`wrangler` exit 1). Until that
    token/permission is fixed, deploy locally with wrangler. (`CLOUDFLARE_API_TOKEN`
    + `CLOUDFLARE_ACCOUNT_ID` secrets exist; the token likely needs
    Account → Cloudflare Pages → Edit.)
  - **Next:** attach `fluid-web.dev` to the `fluid-25z` Pages project in the
    Cloudflare dashboard (+ DNS), fix the CI deploy token, and the
    Trusted-Publishing rewire of `release.yml`.
  - Docs search (Pagefind) only indexes at **build**, so it's empty in
    `astro dev`; it works once the site is deployed (or via `pnpm docs:build`).
- **⚠️ Process note: `pnpm verify` does NOT build the docs site.** `verify`'s
  `build` step only compiles the component packages (tsc + cem); the Astro docs
  (MDX) are never touched. **After editing any `*.mdx`, run `pnpm docs:build`**
  (fast, ~22s) to catch MDX/JSX compile errors, e.g. the recurring
  backtick-in-a-`css\`\`` bug, or unclosed inline code that makes MDX parse a
  later `<fluid-*>` as JSX. A green `verify` says nothing about the docs.
- **Follow-up bundle (2026-05-30, committed `bcbc0eb` + `0f79af4`, NOT pushed):**
  - **Dropdown menu → top layer.** The split-button menu hid behind the docs
    nav pane. Switched `fluid-dropdown`'s menu to the Popover API
    (`popover="manual"` + showPopover/hidePopover, `@starting-style` +
    `allow-discrete` for the animation) so it paints above all app chrome and
    escapes clipping/stacking. floating-ui still positions it.
  - **AA⇄AAA conformance axis (structural deltas) shipped.** New
    `--fluid-target-min` token (24px AA, 44px under
    `[data-fluid-conformance="aaa"]`) + `--fluid-focus-ring-width` 2→3px in
    `base.css`; `fluid-button` reads `--fluid-target-min`. New
    `ConformanceToggle.astro` puts a live AA/AAA toggle atop the button +
    button-group docs (flips the attr on `<html>`, persisted). 7:1 contrast
    track (1.4.6) still pending, it's a brand-palette concern.
- **Most recent work (2026-05-30, committed `789f24d`, NOT pushed):**
  **button-group + dropdown rework, split buttons & caret triggers.**
  Decided (with the user) on the Shoelace-style split: the caret lives on
  the button, the menu stays `fluid-dropdown`, the group only fuses.
  - `fluid-button` gained `caret` (built-in chevron, rotates on
    aria-expanded), forwards host aria-haspopup/expanded/controls to the
    inner button, and OWNS the group-fusion CSS keyed off a
    `data-fluid-group` attribute the group stamps on it.
  - `fluid-button-group` no longer uses ::slotted/::part fusion: it stamps
    position attrs on member buttons (incl. a trigger nested inside a
    `fluid-dropdown`), so split buttons fuse across the shadow boundary.
  - `fluid-dropdown` menu restyled to share the select/typeahead listbox
    surface (thin styled scrollbar, box-sizing, reduced-motion); dropdown-item
    got the accent rail to match fluid-option.
  - **Gotcha recorded as a skill lesson:** a page `* { margin: 0 }` reset
    beats a normal `:host` margin in the shadow-host cascade, so the fusion
    overlap margin must be `!important` (same law as `::slotted` margins):
    added to `shadow-dom-ce.md`.
- **Active focus:** **Deployment + first public launch** (see Launch readiness
  above). Prior focus, still the standing bar for any component work:
  **component standardization, one component per session (button is the
  reference).** A `component-authoring` skill + hard
  coverage gate (`pnpm check:coverage` requires a story, playground card,
  AND docs page per component) now enforce the bar; `verify-in-browser`
  + `accessibility` skills back it. This session brought the button to
  standard and added two features:
  - **`loading`**: inline spinner, `aria-busy` + `aria-disabled` (NOT
    native `disabled`, so it stays focusable), clicks blocked, label
    stays so the accessible name is unchanged; spinner respects
    reduced-motion. New `spinner` csspart.
  - **`toggle`**: WAI-ARIA toggle-button: `aria-pressed` flips on
    activation, inset pressed visual, fires `fluid-change {pressed}`.
    `pressed` sets the initial state.
  - Docs (`button.mdx`) reworked: reordered examples (Variants → Sizes →
    Tones → With icon → Disabled → Loading → Toggle), trimmed marketing
    tone, dropped redundant `variant="primary"` from framework snippets.
  - Earlier in the arc (already committed): semantic `tone` prop
    (brand/neutral/success/danger/warning/info, theme-independent),
    slotted-content typography hardening (the docs-vs-Storybook 48px bug),
    `docs/FEATURES.md` capability list, three lessons captured as skills.
  - **Migrated to standard so far:** `button`, `button-group`, `input`,
    `number-input`, `textarea`, `switch`, `checkbox`, `radio` / `radio-group`,
    **`select`, `typeahead`, `slider`, `color-picker`, `rating`, `file-input`**
    (last six this session, committed locally, NOT pushed). The whole
    **input/form-control family is now on standard.**
  - **This session's input batch (one commit each):** every component got the
    override ladder (own `--fluid-<name>-*` tokens falling through to
    `--fluid-field-*` / semantic vars incl. new `border-width` / `radius` /
    `font-family` / `focus-ring-width` aliases), an AAA target-size floor
    (`max(<base>, var(--fluid-target-min, 0px))` on the clickable box, trigger,
    field row, preset chips, stars, remove buttons), `--fluid-focus-ring-width`
    on every focus ring, full `@cssproperty` / `@uses-token` JSDoc, two rework
    regression tests (ladder color + measured target height), and a doc page
    rewritten to the requirement (ConformanceToggle, Install, ConformanceCode,
    framework tabs, form, Theming + `::part()`, structured Accessibility +
    AA/AAA table). Notable fixes: `rating` had a **hardcoded `#f59e0b`**
    (→ `var(--fluid-color-amber-500)`) and **no visible focus ring on the
    slider host** (added). `pnpm verify` green at **302 component tests**;
    target floors + ladder verified in-browser by the new Chromium tests.
  - **Layout system landed (this session, committed locally, NOT pushed):**
    `fluid-grid` + `fluid-col` (column/grid) and `fluid-mosaic` +
    `fluid-mosaic-item` (bento/mosaic). All four are `:host { display: grid }`
    primitives with a bare `<slot>`, so slotted children are real grid items.
    Grid has intrinsic auto-fill (`min-col-width`) and fixed `cols` modes with
    breakpoint-aware `cols-sm/md/lg` (40/48/64rem) via a **pure-CSS
    `--_active-cols` cascade** (no matchMedia). `fluid-col`: `span` +
    responsive, `start`, `row-span`. Mosaic uses `grid-auto-flow: dense` +
    fixed `grid-auto-rows`; items take a `size` preset
    (normal/wide/tall/large) or explicit `col-span`/`row-span`. Override
    ladder via `--fluid-grid-*` / `--fluid-mosaic-*` (gap/min-col/row-height/
    align/justify), settable per-instance through matching attributes. Marked
    PREVIEW_EXEMPT (layout primitives, like page/split-panel). Recurring
    gotcha re-hit + fixed: a backtick inside a `css\`\`` **comment** terminates
    the template, keep CSS comments backtick-free.
  - **Next candidates:** remaining un-migrated visual components can follow the
    input checklist; layout could later gain a `fluid-stack` / `fluid-cluster`
    flow primitive if wanted. (Build-time token-contrast validator + a
    slotted-content sweep remain good follow-ups.)
- **Prior focus (still current):** Marketing landing + website routing:
  the unified site mounts each surface under its own sub-path:
  - **New `apps/landing` Vite app** at the website root (`/`). Hero +
    feature grid + before/after comparison + 5-line setup + CTA +
    footer. Builds to `website/index.html` + `website/assets/*`.
  - **Improved before/after slider**: same sign-in form (email,
    password, remember-me, sign-in button) rendered twice, raw
    `<input>`/`<button>` in Times New Roman on the "before" side,
    `<fluid-input>`/`<fluid-button>`/`<fluid-switch>` on the "after"
    side. Drag the divider to flip between the two.
  - **Demos slimmed**: dropped the marketing-landing demo (the real
    landing replaces it); demo picker now shows two cards (settings +
    admin) and links visitors back to the root for the marketing site.
  - **Settings + admin polish**: new KPI strip at the top of each
    page (Plan/Storage/Members on settings; Total/Active/Invited/
    Suspended on admin). Shared row-hover affordance for tables.
  - **Unified website build** updated: `scripts/build-website.mjs` now
    builds the landing with `LANDING_BASE=/` and stages it to the root
    alongside `docs/`, `storybook/`, `playground/`, `demos/`. The old
    placeholder index.html generation is gone. New `/assets/*` entry
    in `_headers` for the landing's hashed bundles.
  - **`pnpm dev` runs 5 apps now** (landing + storybook + playground +
    docs + demos), landing on port 5175.
  - **`pnpm preview:website`** (added earlier this session): zero-dep
    Node static server that honors `_redirects` (301/302/200 rewrite +
    wildcard) for previewing the staged `website/` artifact on
    port 4180.
- **Next steps (publish: deferred):**
  - [ ] First publish: write a changeset (`pnpm changeset`), push, the
        release workflow opens a "Version Packages" PR. Merging it
        publishes all 8 packages to npm under the `alpha` dist-tag with
        provenance. Requires `NPM_TOKEN` in repo secrets first.
- **Next steps (content polish):**
  - [ ] Cloudflare Pages deploy: `pnpm build:website` → upload
        `website/`. Set `site` in `astro.config.mjs` to the deploy URL
        so the sitemap builds.
  - [ ] Replace the inline-SVG wordmark with a real logo when one
        exists.
  - [ ] Audit chart/expansion components for hand-rolled SVGs that
        could switch to `<fluid-icon>` now that lucide is wired up.
  - [ ] Presets dropdown in the export panel (save/load brand configs
        from localStorage).
  - [ ] **Docs-side dedup opportunities** (flagged by the sub-agent):
        a shared `<FormFieldApi>` partial for the repeated
        name/value/disabled/required/aria-label block; a
        `<FormExample tag="..."/>` macro for the "Inside a form"
        section; a `<SeverityTokensExample>` for variant-bearing
        components.
  - [ ] **Source-side audit** (also flagged): `<fluid-rating>`
        declares its own formAssociated + internals rather than
        inheriting from `FluidFormAssociated`. Behaviour is fine but
        it's an inconsistency worth normalizing.
- **Blockers / open questions:** none.

---

## npm publish setup

Pre-flight checklist before merging the first release PR:

1. **Create npm account** at <https://www.npmjs.com/signup>
2. **Enable 2FA**: required for publish access. Use Authy / 1Password /
   hardware key. Note the backup codes.
3. **Create the `@fluid-ds` organization** at
   <https://www.npmjs.com/org/create>. Pick the free tier (public
   packages only). Add additional maintainers as members.
4. **Generate a granular access token** at
   <https://www.npmjs.com/settings/{user}/tokens/granular-access-tokens/new>:
   - Name: `fluid-ds-release` (or similar)
   - Expires: 1 year (rotate annually)
   - Permissions: `Read and write` to packages
   - Packages: select `@fluid-ds/*`
   - Scopes: none required beyond the package access
5. **Add the token to GitHub secrets**: in the repo, Settings → Secrets
   and variables → Actions → New repository secret:
   - Name: `NPM_TOKEN`
   - Secret: the token from step 4
6. **(Optional) reserve the package names early** by publishing empty
   `0.0.0-placeholder.0` stubs from `npm publish` locally. Stops
   squatters between now and the first real publish. Skip if you trust
   the timeline.
7. **First real publish**: write a changeset (`pnpm changeset`),
   describe what's in this alpha, push the branch. The release workflow
   opens a "Version Packages" PR. Merge it. Workflow re-runs and
   publishes to npm with provenance under the `alpha` dist-tag.

After the first publish, the CDN URLs documented across the docs and
README start resolving, jsDelivr and unpkg auto-mirror npm.

### Can you delete from npm?

- **Within 72 hours of publishing**: `npm unpublish <pkg>@<ver>`
  works.
- **After 72 hours**: you can only `npm deprecate <pkg> "message"`.
  The version stays available; consumers see a warning. **Don't
  unpublish**, anyone who pinned to that version would 404. Deprecate
  + roll forward to a fixed version.

---

## Environment notes

Things true across machines (machine-specific quirks go in private memory):

- **Toolchain is pnpm-only** (`packageManager: pnpm@9.15.0`, `workspace:*` deps).
  If `pnpm` isn't on PATH, use `corepack pnpm …` (corepack ships with Node 20),
  or run `corepack enable pnpm` once.
- **First-time setup on a new box:** `corepack pnpm install` → `corepack pnpm build`
  (the build is needed before `typecheck`/`verify` because `@fluid-ds/icons`
  only exposes its built `dist`).
- Never run `npm install` here: it leaves a stray `package-lock.json` and a
  node_modules layout pnpm won't use.

---

## Log

Newest first. One short entry per working session.

### 2026-06-01: +26 core components (75 → 101)

- Added `fluid-hero` (a slot-driven marketing masthead: eyebrow / heading /
  description / actions / media, with `align`, `media-position`, `size`; empty
  regions collapse) plus a **25-component batch** built one-agent-per-component
  via the Workflow tool: form, fieldset, range-slider, time-picker,
  masked-input, transfer, dropzone, app-bar, sidebar, nav-list (+ nav-item),
  anchor-nav, context-menu, meter, popconfirm, result, tour, loading-overlay,
  image, description-list (+ description-item), list (+ list-item), truncate,
  countdown, theme-toggle, hotkey (non-visual), aspect-ratio.
- Each ships to the full authoring standard: story + docs `.mdx` + playground
  card + tests (854 component tests pass). `fluid-hotkey` is non-visual, added
  to `PREVIEW_EXEMPT`.
- Wired into `packages/components/src/index.ts`, playground `main.ts` +
  `preview.ts`, docs `Head.astro` + `astro.config.mjs` sidebar.
- Fix-up: re-architected `fluid-form` to operate over its light-DOM controls
  (the shadow `<form>` + slot never saw slotted inputs); fixed clashes where
  `offsetTop`/`title` collided with native `HTMLElement` members; fixed
  masked-input + range-slider form-value sync; fixed a11y/role issues in
  dropzone, popconfirm, context-menu, description-item, fieldset; converted two
  MDX demos (anchor-nav, hotkey/tour) to MDX-safe forms.
- Counts bumped to **101** in landing copy, OG image (regenerated PNG),
  FEATURES, README. Changeset `core-components-batch-2.md` added.
- Gates: typecheck, lint, coverage (122 components / 101 families), test, build,
  docs:build (130 pages), storybook:build all green.
- Storybook sidebar now splits **per package**: each expansion pack is its own
  top-level header (Scheduler, Charts, Media, Table, Calendar, Editor, Kanban,
  Map) instead of a shared "Expansion" bucket; `storySort` in `.storybook/
  preview.ts` lists core categories first then the packs. Added the missing
  charts stories glob to `.storybook/main.ts` + a `Charts/Gallery` story (charts
  had none), and moved the core `fluid-comparison` story out of the `Media/`
  group into `Components/`. Also tidied the `fluid-truncate` Lit
  change-in-update warning (measurement deferred a frame, out of the update
  cycle). Note: a running Storybook must be **restarted** to pick up new story
  globs / packages.
- Subdivided the core `Components/` Storybook bucket into the same categories the
  docs sidebar uses (Inputs & forms, Layout, Navigation, Feedback, Content,
  Utilities & motion), derived from `apps/docs/astro.config.mjs` so the two
  surfaces match. Each core story's `title` prefix was rewritten in place; the
  `storySort` order in `.storybook/preview.ts` was updated to list those
  categories first. (A scripted prefix-swap initially mangled a `fluid-tour`
  step's `title` field, since the first `title:` in that file is data, not the
  meta: corrected by hand.)
- Fixed three expansion-pack visual bugs (browser-verified via Storybook +
  Chrome DevTools; changeset `fix-editor-map-kanban-visuals.md`): editor toolbar
  icons were invisible (inline SVG path fragments built with the `html` tag, so
  they were HTML-namespaced, not SVG: now use the `svg` tag); map markers were
  broken images (Leaflet `Icon.Default` prepends a mis-detected `imagePath` under
  the ESM build, so the component now uses one explicit `L.icon` with absolute
  CDN URLs); kanban drag drop-target highlight was clipped by the `overflow:auto`
  board, now an inset box-shadow ring + accent tint. editor / map / kanban tests
  still pass (10 / 6 / 8).

### 2026-06-01: expansion program complete (media extras + 5 new packs)

- **Media pack extras**: `fluid-audio` (themed player) + `fluid-lightbox`
  (gallery + top-layer `<dialog>`). Added a web-test-runner to the media pack.
- **Five new expansion packs** (scaffolded serially, components built by a
  multi-agent workflow, then orchestrated wiring + fix-up): **`@fluid-ds/table`**
  (data grid), **`@fluid-ds/calendar`** (event-calendar), **`@fluid-ds/editor`**
  (rich-text), **`@fluid-ds/kanban`** (DnD board), **`@fluid-ds/map`** (Leaflet
  wrapper). Each: component + define + index + story + test + docs page.
- **Date popover fix**: `fluid-date-picker` + `fluid-date-range-picker` panels
  now render in the **top layer** (Popover API) so they are never clipped by a
  transformed/overflow ancestor (the "range picker does nothing" report). Same
  approach as `fluid-dropdown`. Browser-verified.
- **Leaflet typing**: the map imports `leaflet/dist/leaflet-src.esm.js` (the
  UMD main yields an empty namespace under native ESM); types come from a
  `paths` shim in `tsconfig.base.json` → `types/leaflet-esm.d.ts` re-exporting
  `@types/leaflet` (added at the repo root). CSS auto-loaded via a CDN `<link>`.
- **Test ports**: scheduler/media/packs each pin a distinct web-test-runner
  port (8011, 8012, 8020-8024) so the root `test` script runs them in parallel
  without colliding on :8000.
- **Wiring**: root `test`, Storybook glob, playground deps + `main.ts` + preview
  cards, and the docs Expansion sidebar now cover all 8 packs. Changesets added.
- **Verify**: `pnpm verify` + `pnpm docs:build` + `pnpm storybook:build` all
  green. The component-expansion program (`docs/plans/component-expansion.md`)
  is complete: 15 core components + media extras + 5 new packs.

### 2026-06-01: 15 new core components (60 → 75), multi-agent build

- **Phase A + B + pricing** of the component-expansion program
  (`docs/plans/component-expansion.md`): **15 new core components** in
  `@fluid-ds/components`, each to the authoring standard (story + docs page +
  playground card + tests + AA/AAA tokens):
  - Navigation/commands: `fluid-menu` (+ item/label), `fluid-command-palette`
    (⌘K), `fluid-pagination`, `fluid-toolbar`, `fluid-speed-dial`.
  - Forms: `fluid-field`, `fluid-otp`, `fluid-tag-input` (form-associated).
  - Content/status: `fluid-timeline` (+ item), `fluid-stat`,
    `fluid-avatar-group`, `fluid-banner`, `fluid-kbd`, `fluid-empty-state`,
    `fluid-pricing-table` (+ tier).
- **How**: kbd/empty-state/stat built by hand; the other 12 via a **multi-agent
  Workflow** (one subagent per component) returning structured wiring data,
  which the orchestrator applied to index.ts / playground / docs Head / sidebar.
  Then an orchestrated fix-up pass (typecheck + lint + 6 flaky/logic test fixes
  + 1 MDX parse fix in command-palette).
- **Storybook**: the glob already includes `packages/scheduler`; core stories
  were already covered. All 15 new stories bundle (`storybook:build` green).
- **Core change**: `FluidFormAssociated.value` widened to allow `string[]` (for
  the tag input); a backtick-in-`css\`\`` bug fixed in avatar-group.
- **Verify**: `pnpm verify` green (580 component tests + 50 scheduler),
  `pnpm docs:build` green (75 component pages), `pnpm storybook:build` green.
  Changeset: `.changeset/core-components-expansion.md` (components minor).
- **Still open** (program plan tasks #224/#225): media `audio` + `lightbox`,
  and the 5 new expansion packs (`table`, `calendar`, `editor`, `kanban`,
  `map`). Browser spot-check of the 15 new components is pending (axe audits in
  their tests pass).

### 2026-06-01: @fluid-ds/scheduler expansion pack (appointment booking)

- **New extension package `@fluid-ds/scheduler`** (mirrors charts/qr/media):
  - `src/internal/availability.ts`: a pure, framework-free engine
    (`generateSlots`, `dayState`, full slot model: capacity, buffers,
    min-notice, max-advance; local-first, tz-ready). 22 unit tests.
  - `fluid-time-slots`: a single day's slots as a WAI-ARIA radiogroup (roving
    tabindex, arrows, disabled full/past). 11 tests.
  - `fluid-scheduler`: form-associated calendar + slot panel; fires
    `fluid-range-change` (lazy per-month booking fetch), `fluid-day-select`,
    `fluid-change`; `refresh()` + `loading` overlay. 10 tests.
  - `fluid-availability-editor`: owner-side weekly-hours grid + closed-dates,
    emits an `Availability` config. 7 tests.
  - Stories for all three (the editor↔scheduler "OwnerAndVisitor" story is the
    live vet-clinic demo); reference docs at `/expansion/scheduler/`.
- **Additive `fluid-calendar` feature** (`day-state` map): coloured
  availability dots + auto-disable of closed/unavailable days. Backward
  compatible (no-op when unset). 3 new calendar tests.
- **Core now exports `@fluid-ds/components/internal/*`** (FluidElement,
  FluidFormAssociated, motion) so expansion packs can build on the base classes
  without pulling the whole barrel.
- **Wiring:** Storybook glob now includes `packages/scheduler` (the repo's first
  extension-package stories); playground registers + previews all three;
  docs sidebar + FEATURES updated. Root `test` script runs the scheduler suite.
- **Landing:** added a **`WCAG 2.2 AA · AAA-ready`** badge to the hero next to
  the version tag (accessibility as a headline selling point).
- **Verify:** `pnpm verify` green (typecheck → lint → coverage → tests → build),
  `pnpm docs:build` green (84 pages), `pnpm storybook:build` green (all three
  scheduler stories bundled). Browser-verified the vet-clinic scheduler: dots,
  closed-day disabling, day select, lunch-break slot gaps, slot selection.
- Design doc: `docs/plans/scheduler.md`. Changeset: `.changeset/scheduler.md`
  (scheduler + components patch).

### 2026-06-01: date component family + CMS guide (0.0.2-alpha)

- **New components (full authoring standard):** `fluid-calendar` (WAI-ARIA APG
  month grid: roving tabindex, arrows/Home/End/PageUp/PageDown/Shift+Page,
  single + range selection), `fluid-date-picker` (form-associated single date,
  floating-ui popover, ISO `YYYY-MM-DD`, configurable display format/size), and
  `fluid-date-range-picker` (form-associated, dual calendars, replaceable/
  disableable preset column, hover-preview range). Shared engine in
  `src/internal/date-utils.ts` (timezone-safe local dates, month grid, presets).
  Each ships stories + `.mdx` + playground card + tests; wired into
  playground `main.ts`/`preview.ts`, docs `Head.astro`, and the docs sidebar.
- **CMS & server-rendered guide** (`guides/cms.mdx`): Umbraco (Razor `@@`
  escaping + Bellissima back-office note), WordPress (`wp_enqueue_*`), Laravel
  (Blade). Linked under docs → Guides. docs:build 83 pages green.
- **Real a11y fix found while making the open-audit deterministic:**
  `fluid-calendar` adjacent-month days were dimmed with an extra `opacity: 0.55`
  on top of the muted color, blending the text to ~2.98:1 (below AA). These are
  focusable month-navigation buttons, so the opacity was dropped; they now
  de-emphasize via the muted color alone. The flaky audit (it ran mid-fade)
  is now pinned by setting `--fluid-motion: 0` on the test fixture.
- **ESLint ignores** extended for build artifacts that broke `eslint .`
  locally: `**/.angular/**`, `**/.next/**`, `**/out/**`, `**/next-env.d.ts`;
  added `apps/**/*.js` to the browser-globals block (vanilla admin-native demo).
- **Docs updated:** changeset bumps `@fluid-ds/components` (patch → `0.0.2`);
  `FEATURES.md`, `README.md`, landing copy bumped 57 → **60 components** and the
  npm-publish line flipped to ✅ (live at `0.0.1-alpha`).
- **Verify:** `pnpm verify` green end-to-end (typecheck → lint → coverage →
  402 tests → build); ran the full suite 15× with zero flakes.

### 2026-05-31: four framework portals + deploy automation + pre-launch prep

- **Framework admin portals (native / React / Next.js / Angular).** One admin
  portal built four ways, each consuming the same `@fluid-ds/*` from the local
  workspace (native via import map; the rest via `workspace:*`). All four are
  1:1. Wired into `build-website.mjs` under `/demos/{native,react,next,angular}/`
  (Next static export + `basePath`; Angular `--base-href`). Docs "Framework
  integrations" guide + demos landing link them; `FEATURES.md` updated.
- **Charts overhaul** (line gradient fill + distinctive doughnut with center
  total) and **compact card headers**, flowing into the portals.
- **Angular dashboard gutter fix:** routed page hosts + `<router-outlet>` set
  to `display:contents` so the page sections become direct `.view` grid
  children and inherit the 20px row gap (matching the other portals).
- **Docs header rework:** aligned the WCAG toggle + brand + theme controls to
  one 34px height; fixed two real a11y bugs on the WCAG toggle itself (target
  size 21.7→32px for SC 2.5.8; selected-button contrast 3.43→5.17 for SC 1.4.3,
  caused by Starlight's `--sl-color-white` resolving near-black in light mode);
  fixed the GitHub/brand-select overlap (Astro emitted the GitHub `<a>` inside
  `<starlight-brand-select>` — wrapped our controls in a boundary element); and
  scoped the header background/border to `header.header` so the divider stops
  hugging the logo/search (it was painting on the inner content row too).
- **Deployment decided + wired:** Cloudflare Pages, deploy-on-`main`, alpha
  line. Added `.github/workflows/deploy.yml`; fixed `release.yml` publish auth
  (`NODE_AUTH_TOKEN`); fixed the docs CDN import-map example to map `lit` +
  `@floating-ui/dom` (the component dist ships those bare imports). See "Launch
  readiness" up top for the remaining manual steps + go-live order.
- **History about to be squashed** to a single public commit before going
  public + first publish (provenance must reference a commit in the public
  repo).

### 2026-05-31: configuration wizard W2 (real config steps + resume)

Commits `8864e93` (steps), `04cc064` (resume).
- **Real tones / type / shape steps** (replaced W1 placeholders), all writing
  live to the theme store: tones = 4 tone pickers + contrast badges (collapsed
  advanced); type = curated font select + scale slider (rescales the
  `--fluid-font-size-*` ramp); shape = roundness (scales `--fluid-radius-*`),
  density (compact/cozy/comfortable multiplier on `--fluid-space-*`), motion
  (`--fluid-motion` scalar, 0 = off). New `scale-tokens.ts` derives a ramp from
  one factor.
- **Resume** (`persistence.ts`): step + config + token diff mirrored to URL
  `#w=` + localStorage, restored on load. Browser-verified (cyan accent survives
  reload at step 3).
- **theme-engine extraction DEFERRED** (documented): 2 small copied files
  (`theme-store`/`theme-manifest`); repointing the playground's many imports is
  high-blast-radius / low-gain. Features shipped first.
- **W3 remaining:** optional fine-tune drawer (flag), `build-website.mjs` wiring
  (`website/wizard/` + nav links), docs guide + FEATURES.
- **Then (user-queued):** a docs section: "what are web components", slots /
  shadow DOM, and how to build your own `fluid-*` / extend the system. (Task #201)

### 2026-05-31: configuration wizard W1 (override-first flow shipped)

Plan: `docs/plans/configuration-wizard-plan.md` (status: W1 SHIPPED).
Commit `6a6dd76`.

- Replaced the old package-builder scaffold (select/theme/download) with the
  9-step **override-first** config flow: preset → scheme → accent →
  tones/type/shape (W2 placeholders) → conformance → review → export.
- **accent** (centerpiece): one seed → full 10-stop OKLCH ramp matched to the
  system's own curve (`derive-ramp.ts`, no deps) → written to the theme store →
  live WCAG contrast verdicts (`contrast.ts`). Verified in Chrome: rose seed
  recolors the preview (accent re-resolves to #d1003d), verdicts compute, export
  yields the `[data-fluid-brand="custom"]` delta CSS + install snippet + download
  + resume link.
- **Architecture:** copied the playground engine into the wizard
  (`theme-store.ts` / `theme-manifest.ts`) for W1 robustness across the Vite app
  boundary; **W2 extracts a shared `packages/theme-engine` and repoints both
  apps** (the playground is the regression canary). Persistent `<wizard-preview>`
  rail; steps share a focus-managing base; dogfoods fluid-* throughout.
- Gates: wizard typecheck + lint clean, `pnpm wizard:build` green.
- **W2 next:** extract theme-engine; real tones/type/shape steps; URL `#wizard`
  + localStorage resume. **W3:** fine-tune drawer, `build-website.mjs` wiring
  (stage `website/wizard/`, nav links), docs guide + FEATURES.

### 2026-05-31: motion system (whole plan, P0–P4) + animation extraction

Plan: `docs/plans/motion-system-plan.md` (status: COMPLETE). Decision: motion
lives in **core**, not a standalone package (components consume it).

- **P0**: moved `<fluid-animation>` out of `@fluid-ds/media` into
  `@fluid-ds/components` (rebased on FluidElement, beside the observers). Media
  is now purely media. New core docs page + sidebar group renamed
  "⚙️ Utilities & motion". (`1344895`)
- **P1**: motion foundation: tokens (`--fluid-easing-decelerate/accelerate/
  emphasized`, `--fluid-duration-slower`) + `packages/components/src/internal/
  motion.ts`, shared `@keyframes` fragment (fade/scale/slide/backdrop) + a
  drop-in `reducedMotion` guard. Keyframes ship as an adopted `css` fragment so
  the animation *name* is a swappable token inside each shadow root. (`d8ea0ca`)
- **P2**: enter/exit on dialog, drawer, toast, popover, tooltip, accordion;
  **NEW sliding indicators** on segmented-control (`part="thumb"`) and tabs
  (`part="indicator"`), both getBoundingClientRect-measured (+ ResizeObserver,
  scroll-aware), the per-item selected bg/underline was removed so the moving
  element is the single surface. Each: `--fluid-<comp>-enter-animation` swap
  token + `--fluid-motion` scaling + reduced-motion. Browser-verified the two
  slides align+settle exactly. (`db37b87`)
- **P3**: carousel autoplay now bails under `prefers-reduced-motion`.
  Principled scope: auto-appearing/auto-playing/auto-sliding motion is guarded;
  color and user-driven (slider/divider) transitions intentionally aren't
  (not "motion" under SC 2.3.3). (`fix(carousel)`)
- **P4**: Animations guide rewritten as **two layers** (built-in component
  motion vs `@fluid-ds/animations` element attributes); FEATURES motion bullet.
  `@fluid-ds/animations` IS a real package (the `data-fluid-animation`
  controller), distinct from the new component motion and from
  `<fluid-animation>` (core WAAPI element). docs:build green (75 pages).

**Control model (the user's requirement):** animations are swappable
(`--fluid-<comp>-enter-animation: fluid-slide-in-up`), disable-able per scope
(`--fluid-motion: 0`) or per animation (`…: none`), and reduced-motion is
automatic. Custom keyframes via `::part()` + document `@keyframes`.

**Next:** the configuration wizard (`docs/plans/configuration-wizard-plan.md`,
override-first), W1→W3.

### 2026-05-31: docs dogfood our own code block (replaced Expressive Code)

- **`<fluid-code-block>` redesigned:** header bar (filename / language label on
  the left, copy button on the right) + border/radius; new props `filename`;
  new tokens `--fluid-code-border`, `--fluid-code-header-bg` (annotated
  `@cssproperty`); new parts `header`, `body`. Now **theme-aware**, body/chrome
  use surface tokens that flip with `data-fluid-theme`, and a `::slotted(pre)`
  reset strips a slotted Shiki `<pre>`'s own frame so only token colors show.
  Story + tests updated; component tests green.
- **Docs now render ALL fenced code through `<fluid-code-block>`:**
  - `expressiveCode: false` in the Starlight block; Astro's built-in Shiki takes
    over via `markdown.shikiConfig` (dual theme `github-light`/`github-dark`,
    `defaultColor: "light"`).
  - New `src/lib/fluid-code-shiki.mjs`: a **Shiki transformer** (`root` hook)
    that tags the highlighted `<pre>` as `slot="highlighted"` and nests it in a
    `<fluid-code-block>`, forwarding `language` + the fence `title="…"` →
    `filename`. Copy works off the host's text content (no raw-code attr).
  - `custom.css`: under `[data-theme="dark"]` the slotted Shiki spans swap to
    `var(--shiki-dark)` (light-DOM, so document CSS reaches them); plus a
    `:not(:defined)` pre fallback for first paint.
  - **Gotcha:** `ConformanceCode.astro` used Starlight's EC-backed `<Code>`,
    which throws `mergeEcConfigOptions is not a function` once EC is off →
    switched it to Astro's built-in `<Code>` from `astro:components` with the
    same dual-theme config + our transformer.
  - Audit first confirmed the docs only use highlighting + `title=` (183 blocks)
    + copy, no EC line-markers/diff/`[!code]`, so nothing else regressed.
- Verified: component build + tests green, `pnpm lint` clean, `pnpm docs:build`
  green (74 pages); Chrome MCP confirmed highlighting, header bar, copy, and the
  light⇄dark token swap on real pages.

### 2026-05-31: Tier-C N2 finished: last 9 visual component pages to parity

- Brought **card, avatar, page, scroller, split-panel, carousel, code-block,
  comparison, copy-button** to full standard parity (hero Demo, `## Install`,
  override-ladder Theming + `### Beyond tokens: ::part()`, `## Related`).
  **Tier-C is now 21/21 → every component page matches the standard.**
- Pulled events/parts/slots/css-props straight from the regenerated CEM so the
  docs aren't guessed. Added `## Listening` framework-tab sections with the real
  event names: carousel `fluid-slide-change`, code-block + copy-button
  `fluid-copy`, comparison `fluid-position-change`, split-panel `fluid-reposition`.
- **AA/AAA section only on copy-button**: a grep confirmed it's the only one of
  the nine that reads `--fluid-focus-ring-width`, and none read `--fluid-target-min`,
  so its table has the focus-ring-width row only.
- **Phantom-token cleanup:** carousel / comparison / split-panel Theming examples
  still referenced the non-existent `--fluid-color-primary` → `--fluid-accent-base`.
- Verified: `pnpm docs:build` green (74 pages); Chrome MCP spot-checked
  split-panel (live draggable demo) and code-block (template-literal demo +
  framework tabs), both render with the full TOC structure.

### 2026-05-31: docs portal visual overhaul (branding)

- **Sidebar groups rebranded.** Dropped the repetitive `Components: ` prefix
  and prepended a category emoji to every group label in `astro.config.mjs`:
  🚀 Getting started · 🎨 Theming · ✏️ Inputs & forms · 🧱 Layout · 💬 Feedback ·
  🧭 Navigation · 🔖 Content · ⚙️ Format & observers · 📦 Expansion packs ·
  📚 Guides. `custom.css` styles the group heading itself (uppercase, tracked,
  secondary color) + a hairline divider above each group so they read as
  sections.
- **KEYSTONE FIX: `--fluid-color-primary` was a phantom token.** The entire
  `custom.css` accent bridge read `var(--fluid-color-primary)`, which **doesn't
  exist** (the accent track is `--fluid-accent-*`). It resolved invalid, so
  Starlight fell back to its **stock purple**, that's *why the docs "looked
  like vanilla Starlight."* Swept every accent reference to `--fluid-accent-base`
  / `-active` / `-text`. **Specificity gotcha:** the `--sl-color-accent*`
  remap had to move INTO the `:root[data-theme="light"|"dark"]` blocks, because
  Starlight defines its own accent at that scope (0,2,0) and beats a plain
  `:root`. Verified live: accent now = brand `#2563eb`, and the header brand
  picker retunes the whole chrome (midnight → violet, corporate → slate).
- **Branding pass in `custom.css`:** active-item accent pill + rail, accent
  prose links + TOC, accent underline under page h1, hero gradient title +
  accent CTA, card hover accent border, code-block radius + hairline, branded
  `::selection`, our radius scale on `--sl-radius-*`.
- **Header dedup.** `logo.replacesTitle: true`: the wordmark already spells
  "Fluid", so the separate site-title text (a second "Fluid") is gone.
- **Verified:** `pnpm docs:build` green (74 pages, 0 errors); Chrome MCP
  confirmed accent resolution, brand-picker retune, dark mode, deduped header.

### 2026-05-31: docs consistency: global AA/AAA toggle + page audit + tiered requirement

- **AA/AAA toggle is now GLOBAL (docs header), persistent.** New
  `apps/docs/src/components/HeaderConformanceToggle.astro` rendered via the
  `SocialIcons` override; `Head.astro` restores the level pre-paint. Removed the
  14 per-page `<ConformanceToggle />` + deleted the old page-level component.
  `ConformanceCode` is pure-CSS off `html[data-fluid-conformance]`, so it still
  tracks the header toggle. Verified live in Chrome.
- **Requirement (`docs/component-doc-template.md`) updated:** no per-page toggle;
  **`### AA vs AAA` only when the component has a real conformance delta**
  (omit for progress/spinner/skeleton/badge/tag/divider/format/observers);
  **Accessibility section reduced/omitted for pure utilities** that render no UI.
- **Full page audit (55 pages → 3 tiers):**
  - **Tier A: full standard (17):** the input/button family + grid/mosaic/stack.
  - **Tier B: half-migrated this session (17):** accordion, breadcrumb, callout,
    dialog, drawer, dropdown, popover, popup, progress-bar, progress-ring,
    segmented-control, skeleton, spinner, tabs, toast, tooltip, tree, have modern
    Theming(::part) + Accessibility but **lack Install / framework Listening tabs /
    ConformanceCode / Related.**
  - **Tier C: legacy (21):** avatar, badge, card, carousel, code-block,
    comparison, copy-button, divider, format-bytes/date/number, icon, include,
    intersection/mutation/resize-observer, page, relative-time, scroller,
    split-panel, tag, old freeform, full rewrites.
- **Decisions (user):** Tier B → **full button parity**; execute in **batches,
  one component per turn**.
- **Phase N1 COMPLETE: all 17 Tier-B pages at full button parity** (one commit
  each): tabs, accordion, progress-bar, progress-ring, spinner, skeleton,
  popover, popup, breadcrumb, tooltip, dialog, drawer, dropdown,
  segmented-control, callout, tree, toast. Added hero Demo + `## Install` +
  (where the component emits events) a `## Listening` framework-tabs section +
  (where AA/AAA changes markup) `ConformanceCode` + `## Related`; kept the
  modern Theming(::part) + Accessibility. **→ All 34 Tier-A + Tier-B component
  pages now match the standard.** Each gated by `pnpm docs:build` (74 pages, 0
  errors); header-toggle persistence + tree fix browser-verified.
- **Tier-C COMPLETE: 21 of 21 done** (one+ commit each, each `docs:build`-green):
  - **N3 pure utilities: COMPLETE (9/9):** format-bytes, format-number,
    format-date, relative-time, intersection-observer, mutation-observer,
    resize-observer, include, icon. Minimal shape (Install + hero/usage +
    Related; an `<Aside>` noting they read no tokens); no AA/AAA, no framework
    expansion. **Fix:** icon example used the non-token `--fluid-color-primary`
    → switched to `--fluid-danger-base` / `--fluid-accent-base`.
  - **N2 visual: COMPLETE (12/12):** divider, badge, tag, then **card, avatar,
    page, scroller, split-panel, carousel, code-block, comparison, copy-button**
    (this session). Each: hero Demo + `## Install` + override-ladder Theming with
    `### Beyond tokens: ::part()` + `## Related`. `## Listening` framework-tabs
    section where events exist, with **CEM-verified** event names: carousel
    `fluid-slide-change`, code-block/copy-button `fluid-copy`, comparison
    `fluid-position-change`, split-panel `fluid-reposition`. **AA/AAA table only
    on copy-button** (the only one reading `--fluid-focus-ring-width`; none read
    `--fluid-target-min`, confirmed by grep, so focus-ring-width row only).
    page/scroller are layout primitives (presentational a11y, no framework tabs).
    **Fix:** carousel/comparison/split-panel Theming examples used the phantom
    `--fluid-color-primary` → `--fluid-accent-base`.
- **Wizard plan delivered (background agent):**
  [`docs/plans/configuration-wizard-plan.md`](plans/configuration-wizard-plan.md)
, found `apps/wizard/` already scaffolded; plan builds on it, reuses the
  playground theme engine (`themeStore`/`elementOverridesStore`/`manifest`/
  `url-state`), a 9-step flow (preset→scheme→accent→tones→type→shape→
  conformance→review→export), W1/W2/W3 phases. Open question flagged: keep the
  component-selection step out of v1 (depends on tree-shaking not yet built)?

### 2026-05-31: navigation family → standard

Migrated the navigation family one-by-one (committed locally, **not pushed**):
**tabs, breadcrumb, tree, dropdown, popover, popup, accordion,
segmented-control.** Each: override-ladder aliases (border-width / radius /
font-family / font-size / focus-ring-width as relevant), interactive rows/tabs/
items floored to `--fluid-target-min` with `--fluid-focus-ring-width`, full
`@cssproperty`/`@uses-token` JSDoc, a ladder/target rework test, and a docs
Theming(+`::part`) / structured-Accessibility(+keyboard table + AA/AAA) refresh.

- **BUG FIX (tree):** the selected-row accent referenced `--fluid-color-primary`,
  which **is not a real token**, the `color-mix` resolved invalid and the
  selection highlight silently never applied. Switched to `--fluid-accent-base`;
  confirmed live in Chrome (selected row now renders accent text + 15% tint).
- **Notable:** breadcrumb links use the target-size *inline exception* (no
  min-height); dropdown items floor to target-min but separators are exempt;
  popup is documented as a headless primitive (no visual tokens, you wire the
  roles). Added a **test file for `fluid-tree`** (none existed).
- Each component verified with **both `pnpm verify` and `pnpm docs:build`** (74
  pages, 0 errors) per the process fix.

### 2026-05-30: flow layout (stack) + feedback family → standard

- **`fluid-stack`** added, completing the layout trio (grid / mosaic / stack).
  1D flexbox flow: `direction` vertical (stack) / horizontal; `wrap` →
  cluster; friendly `align`/`justify` aliases mapped to flex values; `inline`.
  Override ladder `--fluid-stack-gap/-align/-justify`. PREVIEW_EXEMPT. Tests
  include column + row placement geometry assertions.
- **Feedback family migrated one-by-one** (all committed locally, NOT pushed):
  **toast, dialog, drawer, callout, tooltip, progress-bar, progress-ring,
  spinner, skeleton.** Each: override-ladder aliases (border-width / radius /
  font-family / focus-ring-width as relevant), close/dismiss buttons floored to
  `--fluid-target-min` (24/44px) with `--fluid-focus-ring-width`, full
  `@cssproperty`/`@uses-token` JSDoc, a ladder/target rework test, and a docs
  Theming(+::part) / structured-Accessibility(+AA/AAA where interactive)
  refresh. **Hardcoded hex removed:** toast + callout variant colors now use
  the semantic tone tokens / color primitives (`--fluid-success/danger/warning/
  info-base`, `--fluid-color-{emerald,amber,red}-*`). **Bug fixes:** rating had
  a hardcoded `#f59e0b` + missing focus ring (fixed earlier); progress-ring's
  documented `--fluid-progress-ring-thickness` CSS var never reached the JS
  geometry, replaced with a real numeric `thickness` property driving both
  stroke-width and the arc radius/dasharray.
- `pnpm verify` green at ~340 tests / 68 components / 55 families.

### 2026-05-30: layout system: grid + col, mosaic + mosaic-item

Built the column/grid + mosaic layout systems to the component standard
(committed locally, **not pushed**). All four are `:host { display: grid }`
primitives with a bare `<slot>`, so slotted light-DOM children are real grid
items (verified in Chromium by a placement geometry assertion, two cells sit
side by side at `cols=2`).

- **fluid-grid / fluid-col**: intrinsic auto-fill (`min-col-width`) or fixed
  `cols`, with breakpoint-aware `cols-sm/md/lg` (40/48/64rem) resolved by a
  pure-CSS `--_active-cols` cascade (no JS matchMedia). `fluid-col`: `span`
  (+ responsive), `start` (offset), `row-span`.
- **fluid-mosaic / fluid-mosaic-item**: `grid-auto-flow: dense` packing +
  fixed `grid-auto-rows`; item `size` presets (normal/wide/tall/large) or
  explicit `col-span`/`row-span`.
- Override ladder via `--fluid-grid-*` / `--fluid-mosaic-*` (gap, min-col,
  row-height, align, justify), settable per instance through matching
  attributes. Layout primitives → PREVIEW_EXEMPT (docs, not theme builder).
- Wiring: index exports, docs `Head.astro` registration, Storybook stories,
  18 tests, `grid.mdx` + `mosaic.mdx` (Install / examples / theming + `::part`
  / presentational-a11y notes), sidebar entries, FEATURES.md bump.
- **Gotcha re-hit:** a backtick inside a `css\`\`` *comment* terminates the
  template literal (TS1005 cascade). Keep CSS comments backtick-free.

`pnpm verify` green at **321 component tests** / 67 components / 54 families.

### 2026-05-30: select, typeahead, slider, color-picker, rating, file-input → standard

Finished the input/form-control family with the same per-component playbook, one
commit each (all local, **not pushed**):

- **select**: added `--fluid-select-border-width / -radius / -font-family /
  -focus-ring-width` aliases; all three size rules + listbox now floor to
  `--fluid-target-min`.
- **typeahead**: same alias set falling through to `--fluid-field-*`; focus halo
  reads `--fluid-focus-ring-width`; keyboard table in docs corrected to the
  actual handler (no Home/End).
- **slider**: new `--fluid-slider-track-size / -radius / -font-family /
  -value-fg / -focus-ring / -focus-ring-width`; the input *row* floors to
  `--fluid-target-min` so the drag target hits 44px at AAA without thickening the
  track.
- **color-picker**: preset chips floor to `--fluid-target-min`; added
  `-preset-size / -radius / -font-family / -focus-ring-width`. Swatch already
  fills the field height (so it inherits the input's floor).
- **rating**: **fixed a hardcoded `#f59e0b`** (→ `var(--fluid-color-amber-500)`)
  and **added the missing visible focus ring** on the `role="slider"` host; each
  star floors to `--fluid-target-min`.
- **file-input**: removed hardcoded `2px` / `1px` / `2px` border + focus widths
  for aliases; remove button floors to `--fluid-target-min`.

Each: full `@cssproperty`/`@uses-token` JSDoc (flows to CEM → docs API tables +
Theme Builder), two rework regression tests (ladder color + measured target
height, run in real Chromium), and a doc page rewritten to the requirement.
`pnpm verify` green at **302 component tests**. **Next: the layout system (column
+ grid + mosaic).**

### 2026-05-30: number-input, textarea, switch, checkbox → standard (one by one)

Migrated four more components with the input playbook (override-ladder tokens,
danger/warning tone tokens replacing hard-coded hex, conformance wiring, full
`@cssproperty`/`@uses-token` annotations, docs rewritten to the requirement,
+regression tests, verify + Chrome-MCP check each).

- **number-input** (`cb1820e`): #dc2626 → `--fluid-danger-base`; min-height
  `max(field-height, --fluid-target-min)` (38→46px AAA); added border-width/
  radius/font-family/focus-ring-width aliases. 17 tokens + 18 main vars.
- **textarea** (`3edc236`): invalid #dc2626/#fca5a5 → danger; counter near/over
  #b45309/#dc2626 → `--fluid-warning-base`/`--fluid-danger-base`; target size
  inherently met (multi-line). 15 + 21.
- **switch** (`e270af0`): the important fix: 20px track failed SC 2.5.8, so the
  clickable `<label>` now reads `--fluid-target-min` (hit area 24.5→44px,
  graphic unchanged). 11 + 16.
- **checkbox** (`850710e`): same target-size floor (18px box → 24/44px hit
  area); hard-coded 1px border → `--fluid-field-border-width` alias;
  indeterminate/mixed a11y documented. 13 + 17.
- Pattern for small controls (switch/checkbox): `min-height: var(--fluid-target-min, 0px)`
  on the clickable label is the SC 2.5.8/2.5.5 floor without resizing the
  graphic. 288 tests pass.
- **MDX gotcha hit + fixed:** an unclosed inline-code backtick (`` `--fluid-x-* ``
  missing its closer) made MDX parse a later `<fluid-input>` as JSX → build
  error. Close inline code spans.

### 2026-05-30: fluid-input reworked to the component standard

Second component migrated (after button + button-group). `fluid-input` now
follows the full standard:
- **Override ladder**: every styled property reads a `--fluid-input-*` token
  → main var (was only bg/border/border-focus). 17 component tokens
  (`@cssproperty`) + 26 main vars (`@uses-token`), docs API tables + Theme
  Builder list them all.
- **Danger tone fix**: invalid border was hard-coded `#dc2626`; now reads
  `--fluid-danger-base` (theme-independent, dark-mode + brand safe, overridable).
- **Conformance**: `min-height: max(field-height, --fluid-target-min)` so AAA
  lifts fields to 44px; focus ring reads `--fluid-focus-ring-width`. Verified
  sm field 30→46px on the toggle.
- **Docs** rewritten to the requirement (ConformanceToggle, hero, Install,
  ConformanceCode examples, fluid-input vs fluid-change framework tabs, form,
  Theming ladder + ::part, structured Accessibility, AA/AAA, API, Related).
  **Removed a false "Password reveal" section**, it documented an eye-toggle
  the component never implemented.
- +4 tests (276 pass), verify green, committed `d878fbe`.
- **Next candidates** (same playbook): textarea, number-input, select, switch,
  checkbox, radio, all currently have the same gaps (bare main-var reads, no
  conformance wiring, pre-standard docs). The field-wrapper idea is **parked**
  until the core inputs + a label are on-standard.

### 2026-05-30: button override-ladder tokens + complete variable docs

The button only half-followed its own "every styled property reads a
component-scoped token that falls back to a main var" rule (just bg/fg). Brought
it fully onto the ladder: added `--fluid-button-{border,radius,gap,font-family,
font-weight,line-height,focus-ring-color,focus-ring-width,focus-ring-offset}`,
each `var(--fluid-button-X, var(--fluid-main-Y))`, resolve identically when
unset, zero visual change (272 tests pass). JSDoc now annotates **all 11**
component tokens (`@cssproperty`) + **all 28** main vars the stylesheet reads
(`@uses-token`), was 2 + 9, so the docs API tables (CSS custom properties +
Semantic tokens consumed) are the complete, authoritative list of every
overridable variable. button.mdx Theming rewritten around the
brand→component→instance ladder; button-group.mdx notes it has no tokens of its
own (theme via members). Requirement updated: Theming MUST explain the ladder +
defer to the API tables, and the listing's completeness is a property of the
component source (annotate every `var(--fluid-…)`; grep-audit noted). Committed
`b3a86f7`. **Migration note:** other components likely have the same gap (read
main vars directly without a `--fluid-<name>-*` alias), bring each onto the
full ladder + complete its annotations as it's migrated. (Reminder: `serve`
caches, hard-reload when checking a freshly rebuilt API table.)

### 2026-05-30: conformance-aware example code + expanded a11y sections

Fixed a correctness bug: the AA⇄AAA toggle resized the live demos but the code
snippets stayed plain, so copying `<fluid-button>Primary</fluid-button>` in AAA
mode gave a non-AAA button. New `apps/docs/src/components/ConformanceCode.astro`
renders an example's markup twice, plain (AA) and wrapped in
`data-fluid-conformance="aaa"` (AAA), and CSS shows the one matching the page's
`<html data-fluid-conformance>` (flipped by the toggle). Uses Starlight's
`<Code>` (re-exported from `@astrojs/starlight/components`) so the dynamic blocks
match the page fences. Replaced all example snippets on button.mdx (8) +
button-group.mdx (5). Expanded both Accessibility sections into structured
subsections (Keyboard table / Names / State semantics / Motion & target size /
AA vs AAA) and made the AAA snippet a single `<html data-fluid-conformance>`
wrapper. Requirement (`component-doc-template.md`) now mandates ConformanceCode
for example snippets + the multi-subsection Accessibility section. Verified live
(Chrome MCP). Committed `08509f8`. **Doc-page bar for future components now
includes: example code must track the conformance toggle.**

### 2026-05-30: component-doc-page REQUIREMENT + button-group 1:1

Turned `docs/component-doc-template.md` from a loose shape-note into a
prescriptive **requirement** derived from the button page as built: fixed
section order with MUST/SHOULD, the now-mandatory `<ConformanceToggle />` at the
top + the `### AA vs AAA` accessibility subsection, each-Demo-has-a-snippet, the
framework-tabs order, and a "when a section doesn't apply" carve-out for
layout/non-form components. `button.mdx` + `button-group.mdx` are named as the
two reference pages that stay 1:1. Brought `button-group.mdx` to 1:1 (added hero
demo, Install, missing snippets, `### When not to use`, reordered to
Examples→Theming→When-to-use→Accessibility→API→Related, added the Related grid).
Pointed the component-authoring skill at the requirement. Verified the rebuilt
page in-browser. Committed `f77bbd6`. **When migrating the next component, this
requirement is the doc-page bar.**

### 2026-05-30: dropdown top-layer fix + AA⇄AAA conformance toggle

Two follow-ups after the split-button work.

- **Split-button menu hid behind the docs nav pane.** Measured (Chrome MCP):
  the left nav pane is `position:fixed; z-index:5`; the menu's z-index:1000 beat
  it on z-order but was *clipped*, not z-stacked, behind it (a fixed-containing-
  block / stacking pathology, not pure z-index). Fix: render `fluid-dropdown`'s
  menu in the browser **top layer** via the Popover API (`popover="manual"` +
  showPopover/hidePopover), which escapes every clipping/stacking context.
  Reset the UA popover inset/margin so floating-ui's left/top still win;
  preserved the open/close animation with `@starting-style` +
  `transition-behavior: allow-discrete`; guarded the calls so old browsers fall
  back to fixed+z-index. Applies to both the split button and the standalone
  menu button (same component). Verified at a narrow width where it previously
  clipped, menu now fully on top.
- **AA⇄AAA conformance axis: structural deltas shipped.** The
  `data-fluid-conformance` axis was specced but had zero tokens. Added
  `--fluid-target-min` (24px) to the token source and a
  `[data-fluid-conformance="aaa"]` override block (`--fluid-target-min: 44px`;
  `--fluid-focus-ring-width: 3px`) appended to `base.css` by the tokens build.
  `fluid-button` now reads `var(--fluid-target-min, 24px)` for its min target
  (was hard-coded 24px) and already read the focus-ring tokens, so AA→AAA
  scales it to 44×44 + 3px ring with no per-component branching; button-group
  inherits via its members.
- **Docs toggle.** New `apps/docs/src/components/ConformanceToggle.astro`: an
  AA/AAA segmented control at the top of button.mdx + button-group.mdx. Flips
  `data-fluid-conformance` on `<html>` (persisted to localStorage), so every
  live example updates in place. Added an "AA vs AAA" token-delta table to
  button.mdx and an a11y note to button-group.mdx. FEATURES.md + the
  conformance-levels skill updated to reflect what now ships (target size +
  focus appearance; 1.4.6 contrast still pending).
- Verified live (Chrome MCP): toggle AA→AAA grows the hero buttons 32.8→44px,
  focus ring 2→3px, attr on `<html>`, persists. 272 tests pass.
- **Pre-existing lint warning** left as-is: `fluid-button.ts` has an unused
  `eslint-disable no-console` on the icon-only warn (verify still 0 errors).
- **Follow-up idea:** `fluid-select` / `fluid-typeahead` listboxes still use
  position:fixed + z-index (not the top layer); if they ever hide behind chrome,
  give them the same popover treatment. Other components should read
  `--fluid-target-min` as they migrate to standard.

### 2026-05-30: button-group + dropdown: split buttons, caret triggers, unified menu

Made "dropdown buttons" a first-class composable pattern and brought
button-group up to standard. User explicitly chose the architecture
(Shoelace-style): caret on the button, menu stays `fluid-dropdown`, group
only fuses.

- **`fluid-button` `caret`**: self-contained chevron SVG (no icon registration),
  rotates 180° on host `aria-expanded`. Label-less caret = compact square
  trigger (split-button right half). New `caret` part.
- **ARIA forwarding**: a MutationObserver mirrors host aria-haspopup /
  aria-expanded / aria-controls (stamped by fluid-dropdown) onto the inner
  native button, so popup state sits on the element with the button role.
- **Fusion moved into the button**: the group stamps
  `data-fluid-group=first|inner|last|only` (+ `-orientation`) on each member;
  the button flattens its own interior corners + overlaps the border. This is
  the only way a split button's caret trigger, nested one shadow boundary
  deep inside `fluid-dropdown`, can fuse, since `::slotted`/`::part` can't
  reach it.
- **button-group** rewritten: pure stamping on slotchange + orientation change;
  `memberButton()` resolves a direct `fluid-button` OR the
  `fluid-button[slot="trigger"]` inside a slotted `fluid-dropdown`.
- **dropdown menu restyle**: same surface as select/typeahead listboxes: thin
  styled scrollbar (+ webkit), box-sizing, overflow hidden auto, reduced-motion
  guard, new `--fluid-dropdown-radius`. dropdown-item gained the 2px accent
  rail to match fluid-option.
- **Cascade gotcha (new skill lesson)**: a page `* { margin: 0 }` reset
  (Tailwind preflight, Starlight, normalize) overrides a *normal* `:host`
  margin, found via Chrome MCP (rule present + `matches()` true but computed
  `margin-left: 0`; an injected `!important` copy proved cascade loss). So the
  fusion overlap margin is `!important`, same as `::slotted(*){margin:0}`.
  Recorded in `accessibility/references/shadow-dom-ce.md`.
- Stories: split button (+ tones), menu button, icon toolbar, caret-on-button.
  Tests +7 (272 pass). Docs: button-group split/menu + how-fusion-works aside,
  button "Dropdown trigger" section, dropdown shared-surface note.
- Verified live (Chrome MCP): seam overlap (first=0, inner/last=-1px), caret
  rotation, aria on inner button, menu shadow-lg + active rail.
- **Note:** `fluid-button` is now reopened-and-extended (caret + group fusion)
  on top of the earlier loading/toggle work, still the reference component.

### 2026-05-30: button: loading + toggle, docs polish (component standard)

Closed out the button-standardization arc by adding the two states it was
missing and finishing the doc pass.

- **`loading`** state on `fluid-button`. Shows an inline `.spinner` (1em
  ring, `border-top: transparent`, `fluid-button-spin` keyframes, killed
  under `prefers-reduced-motion`). Critically it sets `aria-busy` +
  `aria-disabled` rather than the native `disabled` attribute, so a
  screen-reader user is **not** dropped out of the tab order mid-task;
  clicks/keys are still blocked in `handleClick`. The label stays slotted
  so the accessible name is unchanged (SC 2.5.3). Prefix icon is hidden
  while loading so the spinner takes its place.
- **`toggle`** + **`pressed`** props (WAI-ARIA toggle-button). Inner
  button exposes `aria-pressed` only when `toggle` is set; activating
  flips `pressed`, paints an inset color-mix pressed state per variant,
  and fires `fluid-change` with `{ pressed }`. Non-toggle buttons omit
  `aria-pressed` entirely.
- JSDoc/CEM updated: `@csspart spinner`, `@fires fluid-change`, and the
  three new property docs flow into the docs API table.
- **Stories**: added `Loading` + `Toggle` stories and loading/toggle/
  pressed controls. (Used `eye`/`bell`/`star`, confirmed they're in
  `register-defaults`; `bold`/`volume-x` are NOT, so avoid them in stories.)
- **Tests**: +3 (spinner present + aria-busy + focusable + blocked click;
  aria-pressed flip + fluid-change detail; no aria-pressed when not a
  toggle). **265 pass.** One snapshot test forced `aria-busy` to render
  only when loading (via `nothing`) instead of always emitting `="false"`.
- **Docs (`button.mdx`)**: reordered examples to Variants → Sizes → Tones
  → With icon → Disabled → Loading → Toggle; led with what the button does
  (dropped "workhorse of the system"); dropped redundant `variant="primary"`
  from the React/Vue/Angular/Svelte click snippets; reconciled the
  "when NOT to use a toggle" bullet now that a toggle button exists;
  documented the loading + toggle a11y contract.
- **Verified in-browser** (Chrome MCP, staged `website/`): spinner sizing
  (~18px box in a 34px md button, the 25px rect was just the rotating
  square's AABB), pressed visuals, full aria state, and a live
  `fluid-change` event firing on click. Only console 404 is the
  pre-existing `/docs/favicon.svg`, unrelated.
- Committed as `183c83e`. Left the user's in-progress `apps/wizard` +
  its `package.json` / `build-website.mjs` edits unstaged on purpose.

### 2026-05-29: playground fixes + @fluid-ds/animations package

Three related changes in one session.

- **Playground filter behavior** now matches the
  `$button-color: $primary` mental model. When a component is selected
  and not isolated, the sidebar shows **only** the shared semantic
  tokens that component reads (editing them cascades globally, what
  the user wants when picking a brand color from a swatch). When
  isolated, the sidebar swaps to **only** the component's own tokens
  (editing writes inline to the one element, what the user wants when
  giving a single instance a unique look). The two groups no longer
  show together; the "stricter" mode split removes the choice paralysis
  of "which group do I edit?".
- **Sidebar collapse/expand fixed.** A regression in the open-state
  computation forced groups open whenever a component was selected or
  `i === 0` regardless of the user's clicks. Rewrote so `openGroups`
  is a single explicit Set, seeded on mount and on selection change,
  with no implicit overrides. Toggle now sticks across renders.
- **New `@fluid-ds/animations` package**:
  attribute-driven animation system based on the Web Animations API.
  Single global controller (one MutationObserver + one
  IntersectionObserver) watches the page for `data-fluid-animation`
  and runs the matching registered animation. Per-element overrides
  via `data-fluid-animation-{trigger,duration,delay,easing,iterations}`.
  Respects `prefers-reduced-motion`. 12 default keyframe modules
  (fade-in/out, slide-up/down/left/right, scale-in, zoom-in, pulse,
  shake, bounce, flash, spin), each its own tree-shakable file:
  registered together via `register-defaults`. Public API mirrors
  `@fluid-ds/icons` (registerAnimation / getAnimation / listAnimations /
  onAnimationRegistered / startAnimationController /
  playElementAnimation / stopElementAnimation).
- **Storybook integration.** Storybook preview boots the controller +
  registers defaults so any story can use the attributes directly.
  New `stories/Animations.stories.ts` ships a Catalog grid (every
  default with a replay click), an interactive Playground story
  with controls for every knob, and individual stories per
  animation. Storybook also gained `@fluid-ds/icons` as an explicit
  dep so component icon slots render in stories without per-story
  registration.
- **Docs guide** at `/guides/animations/`: setup, attribute
  reference, default catalog table, per-component examples (staggered
  card reveal, pulsing CTA, shake-on-failed-validation), custom
  registration recipe, reduced-motion note, imperative API surface,
  "when not to use this" cases (component-internal motion, scripted
  sequences, scroll-linked animations), theming consideration
  showing how to read durations/easings from semantic tokens for a
  custom animation.
- **Initial mistake corrected mid-session**: first cut wired
  animations into the playground sidebar as an "Animations" group
  with an `<animation-control>` element. User pointed out that
  animations aren't token-based and don't belong in the theme
  builder, they're per-instance, attribute-driven, and the value is
  in documentation + stories, not in a global editor. Reverted the
  playground integration (deleted `animation-control.ts`,
  `element-animations-store.ts`, the dep, and the rendering hook).
  Kept the package + controller + Storybook + docs.
- Verified: `pnpm verify` green, `pnpm --filter @fluid-ds/docs
  build` = 71 pages, Storybook builds clean.

### 2026-05-29: demos header parity + sidebar 404 fix

Two bugs surfaced after the marketing-landing routing pass.

- **Sidebar 404s from the picker page.** The demos shell used
  relative paths like `../settings/` for cross-demo links. From
  `/demos/settings/index.html` that resolved to `/demos/settings/`
  fine; but from `/demos/index.html` (the picker) it resolved to
  `/settings/`, which 404'd in production. Switched the shell to
  `import.meta.env.BASE_URL`-based hrefs, Vite substitutes `/` in
  dev and `/demos/` in production, so links work from any page in
  either mode. Added `apps/demos/src/vite-env.d.ts` with the
  `vite/client` triple-slash reference so TypeScript knows about
  `import.meta.env`.
- **Header layout jump between `/` and `/demos/`.** Landing had a
  full `site-nav` (brand + 4 cross-surface links + GitHub CTA),
  demos had a tiny `brand + theme-picker` header, clicking
  "Demos" from the landing nav reshaped the whole top bar. Rebuilt
  the demos header in the same `site-nav` shape with identical
  styling (sticky + backdrop-filter blur, 0.85rem 1.25rem padding,
  same brand-mark gradient, same primary nav link styles) so the
  surface change is invisible. The theme picker now sits on the
  right edge after the nav, extra functionality, no shape change.
- **Sidebar slimmed.** Cross-surface links moved into the header
  (matching the landing) so the sidebar carries only the demos
  picker (All demos / Settings / Admin). Less duplication, single
  source of truth for cross-surface nav.
- **Cross-app consistency rule** now documented in the CSS comment:
  `.demo-shell header.site-nav` is intentionally a clone of the
  landing's `.site-nav`; tweak both together.
- Verified: `pnpm verify` green; `pnpm build:website` produces the
  expected tree; built demos JS contains `no="/demos/"` and
  template-literal links `${no}settings/` → `/demos/settings/`,
  proving the BASE_URL substitution at build time.

### 2026-05-29: marketing landing + website routing

- **New `apps/landing` Vite app.** Standalone, registers tokens +
  default icons + 11 components, builds to `apps/landing/dist/` with
  `LANDING_BASE` env-var driving `base` (`/` for dev, `/` for the
  unified site since it mounts at the root).
- Landing layout: sticky nav (brand + 4 surface links + GitHub CTA),
  hero with gradient-accent headline + two buttons, 4-card feature
  grid, before/after comparison strip, 5-line setup code block,
  themable callout, CTA button-group, footer. All Fluid components
  except the page chrome.
- **Before/after comparison rewrite.** The previous version was just
  two abstract colored panes. The new one shows the same sign-in
  form rendered twice: `<input>` / `<button>` / `<label>` in Times
  New Roman on `slot="before"`; `<fluid-input>` / `<fluid-button>`
  / `<fluid-switch>` on `slot="after"`. Same DOM shape, dramatically
  different result. Pane labels ("Before" / "After") pinned top-left.
- **Demos: marketing-landing removed.** Deleted
  `apps/demos/landing/index.html` + `apps/demos/src/landing.ts`,
  dropped `landing` from the vite input map and the shell
  `ShellOptions` route union. Picker now lists settings + admin
  only with a note linking visitors back to `../` for the real
  marketing landing.
- **Demos: polish pass on settings + admin.** Both pages now lead
  with a KPI strip:
  - settings: Plan card (badge), Storage card (progress bar),
    Members card (progress ring), 3 fluid-cards wide
  - admin: Total / Active / Invited / Suspended: 4 fluid-cards
    each with a tinted icon chip
- Shared `table tbody tr:hover { background: surface-muted; }` so
  the admin rows feel alive on hover.
- **Unified site rewiring** (`scripts/build-website.mjs`):
  1. **Docs no longer at root.** Builds with `DOCS_BASE=/docs/` and
     copies to `website/docs/`. Internal Starlight links + the `/docs`
     sitemap all pick that up via the new base support in
     `apps/docs/astro.config.mjs`.
  2. **Landing builds at root.** New step 6 runs the landing build
     with `LANDING_BASE=/` and unpacks `apps/landing/dist/*` into
     `website/` so `index.html` + `assets/` land directly at the root.
  3. **Placeholder landing generation removed.** The handwritten
     `<!doctype html>` blob and its CSS are gone; the real Vite-built
     landing has replaced it.
  4. **`_redirects`** updated with `/docs → /docs/`, `/storybook →
     /storybook/`, etc. (301s) so the bare names work too.
  5. **`_headers`** updated with `/assets/*` (landing bundles) +
     `/docs/_astro/*` (Astro hashed) etc. for the long-cache
     immutable header.
- **`pnpm dev` now runs 5 apps concurrently** (landing+storybook
  +playground+docs+demos). `pnpm landing` / `pnpm landing:build`
  run the landing alone.
- **`pnpm preview:website`**: earlier addition, kept. Zero-dep Node
  static server at port 4180 that parses `_redirects` for the
  rewrite/301/302 lines so the staged `website/` artifact previews
  with the same routing the host will use.
- Verified: every sub-app builds; full `pnpm build:website` produces
  the expected `website/` tree (index.html, assets, docs/, storybook/,
  playground/, demos/, _headers, _redirects).

### 2026-05-29: big sweep (a11y + SSR guides, 50 component pages, demo polish, theme overlay)

Four-task sweep in one session:

- **Sample app polish**: form validation (focus first invalid +
  validationMessage toast), save-button loading state, billing
  chart skeleton ladder → real data, `#empty` hash swaps to empty
  state, delete-confirm requires typing "DELETE" (settings). Rows
  skeleton on first paint, empty-state tbody with Clear Filters
  CTA when the filter narrows to zero (admin).
- **45 component docs pages + 4 expansion-pack pages** written by a
  sub-agent following the established template (overview, examples
  with Demo + code, when-to-use + cross-links, theming, ComponentApi,
  a11y). Total docs build went from 69 pages / 2305 words to
  **70 pages / 3905 words indexed**. Sub-agent flagged three
  dedup opportunities + one source-side inconsistency (fluid-rating
  doesn't inherit from FluidFormAssociated like the other form
  controls).
- **Accessibility guide** at `/guides/accessibility/`: the contract
  Fluid commits to (ARIA, keyboard, focus, motion, contrast),
  what consumers own (names, headings, validity), a keyboard cheat
  sheet, axe + open-wc testing patterns, brand-swap-contrast
  pitfall, what we don't yet ship.
- **SSR guide** at `/guides/ssr/`: two rules (define on client,
  server emits plain HTML), per-framework setup (Next app + pages
  routers, Nuxt 3, Astro, Remix, SvelteKit), FOUC mitigation via
  `:not(:defined)`, declarative shadow DOM note, hydration timing
  diagram, common gotchas.
- **Theme overlay component** at
  `apps/demos/src/shared/design-overlay.ts`, floating "Customize"
  FAB that opens a `<fluid-drawer>` with brand preset + a
  `<fluid-color-picker>` per key semantic token. Writes inline
  `--fluid-*` on `<html>`; persists to localStorage. Mounted on all
  four demo pages.

### 2026-05-29: demos + unified website build

- **New `apps/demos`**: Vite multi-page app with three demos sharing
  one shell:
  - `/`: picker landing
  - `/settings/`: SaaS settings dashboard (profile, notifications,
    billing chart, danger-zone delete dialog with confirm)
  - `/admin/`: team members admin: filter bar, table with row select,
    bulk-action dropdown, confirm-delete dialog, status badges
  - `/landing/`: marketing-style landing: hero, feature cards, code
    block, comparison slider, CTA
- **Shared shell** (`src/shared/shell.ts` + `theme-picker.ts`): top
  bar with a brand+scheme picker (writes `data-fluid-brand` +
  `data-fluid-theme` on `<html>`, persists to localStorage), sidebar
  nav for cross-demo links + jumps to docs/storybook/playground.
- **Unified website build** (`scripts/build-website.mjs`):
  1. builds packages
  2. builds docs (root mount)
  3. builds storybook (mount /storybook/)
  4. builds playground with `PLAYGROUND_BASE=/playground/`
  5. builds demos with `DEMOS_BASE=/demos/`
  6. stages each into `website/`
  7. writes `_redirects` (Cloudflare/Netlify) + `_headers` for
     long-cache assets
- `pnpm dev` now opens all four apps (Storybook + playground + docs +
  demos) concurrently. `pnpm demos` / `pnpm demos:build` run demos
  alone.
- `website/` is gitignored: it's a build output, not committed.
- Verify chain stays clean; total artifact ~18 MB.

### 2026-05-29: visual regression (Playwright + Storybook)

- New **`apps/visual-regression`** package: Playwright + `@playwright/test`
  driving Chromium against the pre-built Storybook static site. One
  generated `*.spec.ts` per `.stories.ts` file, one `test()` per CSF
  export, each navigating to `iframe.html?id=<storybook-id>&viewMode=story`
  and asserting `expect(page).toHaveScreenshot()` against a committed
  baseline PNG under `__screenshots__/`.
- **Generated tests**: `scripts/generate-tests.mjs` walks
  `packages/components/src/components/**/*.stories.ts`, parses `title:`
  and the CSF exports, mirrors Storybook's `toId` sanitization (incl. the
  `startCase`-style camelCase split, `FromArray` → `from-array`), and
  writes specs into `tests/`. `pretest` regenerates so adding a new
  component immediately picks up a snapshot. Generated specs are
  committed so CI doesn't depend on the generator at install-time.
- **Run locally**: `corepack pnpm --filter @fluid-ds/storybook build`
  then `corepack pnpm --filter @fluid-ds/visual-regression test:visual`.
  Refresh baselines with `… test:visual:update`. Playwright auto-boots a
  local `http-server` against `apps/storybook/storybook-static` on a
  dedicated port (6007); no manual server needed.
- **NOT** wired into `pnpm verify` by design: visual regression is too
  slow and too noisy for the quick local verify gate. `pnpm verify` stays
  fast (typecheck + lint + unit tests + build).
- **CI**: new `.github/workflows/visual-regression.yml` runs on PRs that
  touch `packages/{components,tokens,themes,icons}/**`, `apps/storybook/**`,
  or the VR package itself. On failure it uploads the Playwright HTML
  report + raw diff images as artifacts and comments on the PR with the
  artifact link plus the exact commands to refresh baselines.
- **Quirks handled**: `animations: "disabled"` per screenshot;
  `maxDiffPixelRatio: 0.01` for sub-pixel renderer noise; viewport pinned
  to 1024x768 at DPR 1; `document.fonts.ready` + a short upgrade timeout
  so web components finish hydrating before the snapshot. Storybook's
  own "Couldn't find story" overlay is detected and turned into a
  helpful test error instead of a generic timeout.
- **Known broken story**: `Components/Skeleton/Sheen` has no `render` in
  its meta and Storybook refuses to mount it, listed in `KNOWN_BROKEN`
  in `scripts/generate-tests.mjs` and `test.skip`'d with a TODO. Drop
  the entry once the story file gets a render.
- **Baseline footprint**: 142 PNGs, ~1.6 MB total in
  `apps/visual-regression/__screenshots__/`. Single Chromium project
  only, Firefox/WebKit would triple this for little extra signal on a
  Chromium-class web-components library.

### 2026-05-29: cross-engine smoke test

- Installed Firefox + WebKit Playwright browsers and ran the 254-test
  suite via `FLUID_BROWSERS=all pnpm test`.
- **Chromium: 254/254 pass.**
- **WebKit (Safari): 254/254 pass.** This is the historically-hardest
  engine for web components, custom-element upgrade timing,
  form-associated edge cases, shadow-DOM CSS quirks all work cleanly.
- **Firefox: cannot launch on this Windows box.** The exact error is
  `spawn UNKNOWN`; running `firefox.exe --version` from bash returns
  "Permission denied" / exit 126. Almost certainly Windows Defender or
  SmartScreen blocking the unsigned Playwright binary. The CI workflow
  (Ubuntu) will validate Firefox there, defer the local fix unless
  this box becomes the only test surface.
- Local dev tip: run `FLUID_BROWSERS=chromium,webkit pnpm test` to get
  the two working engines without the Firefox error noise.

### 2026-05-29: publish hardening

Pre-flight robustness pass before the first npm publish.

- **Per-package metadata + LICENSE + README** across all 8 packages:
  description, keywords, homepage, repository (with `directory`),
  bugs, author, MIT license file. Each package's README pitches what
  it is + a CDN + npm install example.
- **Version strategy**: bumped every package to `0.0.1-alpha.0`. Each
  `publishConfig` now carries `tag: alpha` (so `npm install` returns
  nothing until a stable `0.x` cuts) and `provenance: true` (for
  cryptographically-verifiable build origin).
- **Community files** at the root: `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, plus `.github/ISSUE_TEMPLATE/`
  (bug + feature templates + a `config.yml` that links Security
  Advisories) and `.github/PULL_REQUEST_TEMPLATE.md`.
- **GitHub Actions CI** at `.github/workflows/verify.yml`: runs
  `pnpm verify` on every PR + push to main. Caches the pnpm store and
  Playwright browser binaries. Sets `FLUID_BROWSERS=all` so the
  component test suite runs across Chromium + Firefox + WebKit.
- **Cross-engine test matrix**: `packages/components/web-test-runner.config.js`
  now reads `FLUID_BROWSERS` (default Chromium for fast local iteration,
  `all` in CI, or a comma-separated subset).
- **Release workflow** at `.github/workflows/release.yml`: changesets
  action opens a "Version Packages" PR; merging it triggers
  `changeset publish --tag alpha` with provenance.
- **Dry-run publish** at `scripts/dry-run-publish.mjs` (wired as
  `pnpm publish:dry`): runs `pnpm publish --dry-run` on every package
  and surfaces the tarball contents. All 8 packages publish cleanly.
- **HANDOFF.md** now carries a dedicated "npm publish setup" section
  documenting the account / org / token / `NPM_TOKEN` secret steps and
  the "can you unpublish?" rules.
- Visual regression (Playwright screenshots) launched as a background
  sub-agent, check its result when complete.

### 2026-05-29: CDN + HTML first, framework second

Refocused the docs around the actual differentiator: these are real web
components, deliverable from a CDN with no build step.

- **`Installation`** rewritten to lead with a complete paste-ready HTML
  file using jsDelivr URLs. Bundlers and frameworks moved underneath.
  Adds an "Import maps" section for cleaner bare imports once you're
  loading more than a couple of components, plus a "Pin a version for
  production" table. The "not yet published to npm" caveat lives in a
  callout so readers aren't surprised.
- **`First component`** rewritten as a single paste-then-it-just-works
  HTML walkthrough, render, listen, theme, add another. Vanilla JS
  example first; React / Vue / Angular variants in tabs.
- New **`CDN reference`** page (`/getting-started/cdn/`): URL pattern
  per package, version pinning table, file layout per package
  (tokens / icons / components / expansion), import maps deep-dive,
  comparison of jsDelivr / unpkg / esm.sh, SRI hashes.
- New **`Framework integrations`** page (`/guides/frameworks/`):
  React 18 vs 19 differences, Vue 3 `isCustomElement`, Angular
  `CUSTOM_ELEMENTS_SCHEMA`, Svelte + SolidJS sections, and a "CDN inside
  a framework app" pattern at the end.
- **Landing page** now leads with a tiny CDN+HTML snippet right after
  the hero, and the cards highlight "No framework required" +
  "CDN-first delivery".
- **README** quick-start now leads with the CDN snippet; the bundler
  story moved underneath. "No framework required" added to highlights.
- Sidebar reordered so Getting Started carries: Overview, Installation,
  First component, CDN reference, Framework integrations, Theming basics.

### 2026-05-29: README + theme builder cleanup + more docs

- **Real GitHub README at the root.** Highlights, quick-start snippet,
  theming in one example, package matrix, three-surfaces table, dev
  setup, architecture conventions, contributing. Polished for a public
  repo landing.
- **Theme builder de-cluttered.** Stripped the cards for non-visual
  components, page, split-panel, scroller, format-bytes/number/date,
  relative-time, mutation/resize/intersection observers, include. Their
  home is the docs site; the theme builder is for things with real
  visual tokens to edit. Updated `PREVIEW_EXEMPT` in
  `scripts/check-component-coverage.mjs` to include both internal
  sub-components AND non-visual helpers (with comments explaining the
  two categories).
- **Four more docs pages fleshed out**: Getting Started → First
  component (full tutorial from blank page to working button +
  branded variant + second component); Input (full reference); Card
  (full reference); Switch (full reference incl. when-to-use vs
  checkbox).

### 2026-05-29: docs site (Astro Starlight)

- New `apps/docs` joins the workspace as the third surface alongside
  Storybook and the theme builder. Built on **Astro Starlight**, fast
  static, MDX content, framework-agnostic so Fluid web components
  embed natively without wrappers.
- Sidebar manually curated in `astro.config.mjs` to match an ng-bootstrap
  / Vercel-DS shape: Getting started → Theming → Components (grouped
  Inputs / Layout / Feedback / Navigation / Content / Format & observers)
  → Expansion packs → Guides.
- **CEM-driven API tables** via `src/components/ComponentApi.astro`. The
  Astro component reads `packages/components/custom-elements.json` at
  build time and emits properties/events/slots/parts/CSS-vars tables.
  Each table is overridable per page (`<ComponentApi tag="..."
  events={[...]} />`), pick CEM defaults, hand-write the rest.
- **Live web components in MDX**: a Starlight Head override
  (`src/components/Head.astro`) wraps the default and injects a single
  `<script>` block importing every `@fluid-ds/components/define/*` plus
  `@fluid-ds/icons/register-defaults`. Astro bundles the imports,
  code-splits per page, caches.
- **Theming**: `src/styles/custom.css` re-maps Starlight's `--sl-color-*`
  tokens to `--fluid-*` semantic tokens so the chrome (sidebar, headings,
  code blocks) matches the components, soft dogfood.
- Three anchor pages written: Installation, Theming basics, **Button**
  (full reference incl. examples, when-to-use, theming, API table, a11y).
- 63 stub pages auto-generated by `scripts/generate-stubs.mjs` so every
  sidebar link resolves; component stubs already include
  `<ComponentApi>` so the auto API table is visible from day 1.
- `pnpm dev` now starts three apps (storybook, playground, docs).
  `pnpm docs` / `pnpm docs:build` run docs alone.
- Lint: added `apps/docs/.astro/**` and
  `packages/icons/src/lucide/_manifest.ts` to the ignore list (machine-
  generated, not authored), and registered `apps/*/scripts/**/*.mjs` as
  node-globals so generate-stubs lints cleanly.
- `pnpm verify` green end-to-end including `astro check` on the docs.

### 2026-05-29: floating export FAB + slugified data-fluid-id

- **Export panel is now a floating launcher + modal.** The bottom-of-page
  section is gone; in its place is a fixed accent-gradient pill in the
  bottom-right ("Export theme" + override-count chip) that stays visible
  while the user scrolls/edits. Clicking opens a `<fluid-dialog>` (size lg)
  with the original 3-step setup guide + a primary "Download
  fluid-custom-brand.css" button in the footer.
- The export-panel host is `display: contents` so it doesn't carve out a
  box in `<main>`; the FAB uses `position: fixed` so it survives outside
  any clipping ancestor and stays one click away from anywhere.
- **`data-fluid-id` is slugified on rename.** New `slugifyId(raw)` in
  `token-form.ts` strips diacritics, lowercases, replaces any non-ascii
  char with `-`, collapses runs, and trims leading/trailing separators.
  The input mirrors the sanitized form back so "Primary CTA / Mobile"
  becomes `primary-cta-mobile`, what the exported selector will actually
  match.
- Touched: `apps/playground/src/export-panel.ts` (now a launcher + dialog),
  `apps/playground/src/playground.ts` (removed bottom section, moved
  `<export-panel>` outside `<main>`), `apps/playground/src/token-form.ts`
  (slugify on rename).
- `pnpm verify` green end-to-end.

### 2026-05-29: element-overrides serialization + lucide icon set

- **Per-element overrides are now fully shareable + exportable.** New
  `element-overrides-store` (sibling to `themeStore`) keyed by
  `data-fluid-id`. Wired through:
  - `url-state.ts` now serializes both stores under separate `#theme=` and
    `#elements=` hash keys so reload + share both restore correctly.
  - `export-panel.ts` builds CSS with the brand block on top and one
    `[data-fluid-id="..."] { ... }` block per isolated element underneath,
    with a header comment explaining the attribute convention.
  - `controls.ts` writes through the store (inline + persistent) instead
    of inline only; `resetToken` clears the store entry too.
  - `token-form.ts` shows a rename input for the data-fluid-id in the
    isolation callout. Initial id auto-assigned as `<tag>-<n>` from
    `generateFluidId` in `selection-store.ts`.
- **Computed-style prefill** (fixes the empty-picker-on-isolate bug):
  `controls.ts → syncFromSource` now falls back to
  `getComputedStyle(el).getPropertyValue(cssVar)` so the picker opens on
  the actually-rendered color when an element inherits from a semantic.
- **Real icon set:** `@fluid-ds/icons` now generates one TS module per
  lucide icon (`build:icons` script reads `lucide-static`, writes 1544
  files under `src/lucide/`). `register-defaults` switched to a curated
  lucide subset (~50 icons) with backwards-compatible aliases for the
  old hand-rolled names (`alert-triangle` → `triangle-alert`, etc.).
  New `loadIcon(name)` does on-demand registration via a generated
  manifest. Added a dual `exports` field so dev-mode resolves to
  `./src/*.ts` and `publishConfig` overrides to `./dist/*.js`.
- Touched files:
  - playground: `controls.ts`, `selection-store.ts`, `token-form.ts`,
    `url-state.ts`, `export-panel.ts`, new `element-overrides-store.ts`
  - icons: `package.json`, new `scripts/build-lucide.ts`,
    `src/lucide/*.ts` (1544 generated), `src/registry.ts`,
    `src/register-defaults.ts`, `src/index.ts`
- `pnpm verify` green end-to-end.

### 2026-05-29: per-element token isolation (playground)

- Added an **"Isolate to this element"** toggle to Design mode. When on, token
  edits are written as inline CSS variables on the one selected element instead
  of the shared preview root, so a single instance can own unique values while
  others keep following the semantic ("main") variables.
- Touched files (all in `apps/playground/src`):
  - `selection-store.ts`: now tracks `selectedEl` + `isolate`; `setSelected(tag, el)`,
    `setIsolate()`. Isolate auto-derives from whether the element already has
    inline `--fluid-*` overrides.
  - `inspector.ts`: publishes the clicked element (not just the tag).
  - `controls.ts`: `token-control` gained `scope` + `element` props; in element
    scope it reads/writes inline styles, in global scope it uses `themeStore`.
  - `token-form.ts`: renders the checkbox, routes scope to controls, updates the
    scope chips/notes; un-isolating clears the element's inline overrides.
- Also changed `.claude/launch.json` to launch via `corepack pnpm` (bare `pnpm`
  isn't on the preview runner's PATH).
- Verified live: isolated edit colored only the clicked button, left siblings and
  the global store untouched; un-isolating reverted it.

### 2026-05-29: second machine setup

- Brought the repo up on a new machine: removed a stray `package-lock.json` left
  by an accidental `npm install`, ran `corepack pnpm install`, then `pnpm build`
  (green, CEM manifest regenerated) and `pnpm typecheck` (green everywhere).
- Created this handoff doc + root `CLAUDE.md` to make cross-device context explicit.
