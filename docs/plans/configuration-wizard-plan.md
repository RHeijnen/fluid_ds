# Configuration Wizard: implementation plan

> Status: **W1 + W2 SHIPPED.** Full 9-step flow works end to end with live
> preview, WCAG contrast, OKLCH ramp derivation, real tones/type/shape steps,
> and URL+localStorage resume. The `packages/theme-engine` extraction is
> **deferred** (2 small copied files; repointing the playground is high-risk /
> low-gain, features first). **W3 remaining:** optional per-component fine-tune
> drawer (flag-gated), wire into `build-website.mjs` (stage `website/wizard/`,
> nav links), docs guide + FEATURES. Earlier status: plan only.
> Scope: a guided, step-by-step wizard that lets a consumer configure Fluid
> (brand, color scheme, accent, semantic tones, typography, shape/density,
> conformance, optional per-component tweaks) and export a ready-to-paste
> theme + setup. Lives at `apps/wizard` (`@fluid-ds/wizard`), already scaffolded
> and wired into `pnpm dev`.

---

## 0. Setup UX north star: "override-first" (per user)

The wizard models **how a team actually adopts a design system**: start from a
sensible default, then deliberately decide what to *override*. Overrides are
opt-in and always visible, never a wall of every token.

Principles every step must follow:
1. **Defaults are the happy path.** Each step opens showing the current resolved
   value (from the manifest) as the default. A user can hit **Next** and get a
   great result having changed nothing. "Most teams keep this" hints on the
   advanced steps (tones, mono font, motion, density).
2. **Overriding is an explicit, reversible act.** The moment a control changes a
   token, the step shows a small **"Overriding default"** badge + the before→after
   value, and a **"Reset to default"** affordance that clears *only* that step's
   vars. The running diff is the user's mental model of "what I've changed."
3. **One decision at a time, in adoption order:** start point → scheme → accent
   (the centerpiece) → status tones → type → shape/density → accessibility →
   review → export. Advanced/rarely-overridden choices are collapsed, not absent.
4. **Show, don't assert.** Live preview rail re-themes on every change; accent &
   tone steps show real measured WCAG contrast verdicts, not promises.
5. **Honor existing setups.** The export tells the user exactly what to override
   in *their* app (the `[data-fluid-brand="custom"]` block + the wrapper
   attributes), layered *after* the base tokens, never "replace everything."
   A resume link / `fluid.config.json` lets them come back and change their mind.
6. **The diff is the product.** Output is only the deltas from default: the
   smallest override block that achieves their look, not a full token dump.

### §11 open questions: RESOLVED (so W1 isn't blocked)
- **Ramp from seed:** hand-rolled OKLCH lightness sweep, no new dep; manual
  per-stop override as the escape hatch. ✅
- **Fonts:** curated `fluid-select` + "Custom…" string; set the CSS var only,
  export emits a `<link>`/`@font-face` reminder (no font bundling in v1). ✅
- **Semantic tones:** collapsed "advanced" step; v1 overrides the previewed
  scheme only and warns the other scheme keeps defaults. ✅
- **Density:** wizard-side multiplier over `--fluid-space-*` (no token-source
  change) for v1. ✅
- **Per-component fine-tune:** ship the Design-Mode drawer in `review` behind a
  flag, off by default; brand-wide config is the v1 deliverable. ✅
- **Component-selection step:** deferred (depends on unbuilt tree-shaking). ✅
- **Engine extraction:** Option B (cross-import) in W1, extract
  `packages/theme-engine` in W2. ✅
- **`auto` scheme:** emit `prefers-color-scheme` guidance, don't force an
  attribute. ✅

## 1. Goal & scope

### What "configure to their liking" means for Fluid

Fluid is themed entirely through CSS custom properties (`--fluid-*`). There is
no JS config object the runtime reads, **the design system IS the cascade.** So
"configuring it" concretely means producing a single CSS override block that the
consumer loads after the base tokens:

```css
[data-fluid-brand="custom"] {
  --fluid-color-brand-600: #7c3aed;
  --fluid-radius-md: 0.5rem;
  /* … */
}
```

That block is exactly what the playground's `themeStore.toCSS()` already emits.
The wizard's job is to produce the **same kind of artifact** through a *guided*
flow instead of a freeform sidebar of every token.

The full override surface the wizard can touch (all confirmed present in
`packages/tokens/src/tokens.ts` and `dist/manifest.json`):

| Family | Tokens (CSS vars) | `$userFacing`? | Wizard step |
|---|---|---|---|
| Accent / brand ramp | `--fluid-color-brand-50 … -900` | ✅ all 10 stops | 3 |
| Color scheme | `data-fluid-theme="light\|dark"` attribute | n/a (attr) | 2 |
| Brand preset | `data-fluid-brand="midnight\|corporate"` attribute | n/a (attr) | 1 |
| Semantic tones | `--fluid-{success,danger,warning,info}-{base,hover,active,text}` (semantic, **theme-dependent light/dark, brand-independent**) | exposed via `manifest.semantics` | 4 |
| Typography | `--fluid-font-family-sans`, `--fluid-font-family-mono`, `--fluid-font-size-{xs…4xl}` | ✅ | 5 |
| Shape | `--fluid-radius-{sm,md,lg,xl}` | ✅ | 6 |
| Density / spacing | `--fluid-space-*` (currently **not** `$userFacing`; see §11 open question) | ❌ today | 6 |
| Motion | `--fluid-duration-{fast,normal,slow}` | ✅ | 6 (optional) |
| Conformance | `data-fluid-conformance="aaa"` → `--fluid-target-min` 24→44px, `--fluid-focus-ring-width` 2→3px | n/a (attr) | 7 |
| Per-component tokens | `--fluid-<name>-*` (e.g. `--fluid-button-radius`) from CEM `@cssproperty` | from `custom-elements.json` | 8 |

### Wizard vs. the existing Theme Builder (playground)

| | Theme Builder (`apps/playground`) | Configuration Wizard (`apps/wizard`) |
|---|---|---|
| Mental model | Freeform: one big sidebar of every `$userFacing` token + a Design Mode inspector | Guided: ordered steps, one decision at a time, opinionated defaults |
| Audience | Designers who already know the token system | New adopters who want a good result fast |
| Entry | Blank `[data-fluid-brand="custom"]` | "Start from a preset or scratch" |
| Color | Edit raw brand stops 50–900 individually | Pick **one seed**, derive the 10-stop ramp + show contrast verdicts |
| Output | `fluid-custom-brand.css` via export dialog | Same CSS **plus** a JSON config, install snippets, and resume link |
| State | `themeStore` + `elementOverridesStore` + URL hash | **Reuses both stores**, adds a thin `wizardStore` for step/seed/preset metadata |

**Decision: the wizard is a guided front-end over the same stores.** It does not
fork the theming engine. It writes into `themeStore` (brand-wide overrides) and
optionally `elementOverridesStore` (per-component), then hands off to the same
CSS serializer. This keeps a single source of truth and means a wizard config can
be opened in the Theme Builder for fine-tuning and vice-versa (shared URL-hash
format).

---

## 2. Build on the existing scaffold (do not replace)

`apps/wizard` already exists and is correct in shape, keep it:

- `apps/wizard/package.json`: `@fluid-ds/wizard`, deps on `components`, `icons`,
  `themes`, `tokens`, `lit`; `predev`/`prebuild` already build tokens/components.
- `apps/wizard/src/main.ts` → `register-fluid.ts` (loads `base/light/dark.css`,
  `midnight.css`, `corporate.css`, default icons, a few chrome components) →
  `wizard-app.ts`.
- `apps/wizard/src/wizard-app.ts`: shell with site-nav clone, stepper,
  `aria-live` step-content region, back/next footer. **Solid; extend it.**
- `apps/wizard/src/wizard-store.ts`: observable store, currently only
  `{ step }`. **Extend its state shape (see §5).**
- `apps/wizard/src/steps/step-{select,theme,download}.ts`: three placeholders.

**Change of plan vs. the current 3-step scaffold:** the current steps are
`select → theme → download` ("pick components / brand it / get setup"). That is a
*package builder* framing. The user's ask is a *configuration* wizard. We will:

1. **Keep** `step-download.ts` (rename concept to "Export") as the terminal step.
2. **Demote/defer** `step-select.ts` (component picking): it's orthogonal to
   configuration and depends on tree-shaking work that isn't built. Park it
   behind a feature flag as an optional Step 0; it is **not** on the v1 critical
   path. (See §11.)
3. **Replace** the single `step-theme.ts` placeholder with the ordered
   configuration steps below, each its own `wizard-step-*` element.

This is additive, no existing file is deleted, the stepper just grows.

---

## 3. User flow: ordered steps

`STEPS` becomes (in `wizard-store.ts`):

```
preset → scheme → accent → tones → type → shape → conformance → review → export
```

(Optional `select` step gated behind a flag, inserted before `preset`.)

| # | id | Title | One-liner | Writes |
|---|---|---|---|---|
| 1 | `preset` | Start point | Begin from a brand preset or scratch | `data-fluid-brand`, seeds `themeStore` |
| 2 | `scheme` | Color scheme | Light, dark, or follow the OS | `data-fluid-theme` (preview only) + config flag |
| 3 | `accent` | Accent color | Pick one seed → derive brand ramp; contrast checks | `--fluid-color-brand-50…900` |
| 4 | `tones` | Status colors | success / danger / warning / info (theme-independent) | semantic tone vars (optional) |
| 5 | `type` | Typography | Font family + type scale | `--fluid-font-family-sans/mono`, `--fluid-font-size-*` |
| 6 | `shape` | Shape & density | Corner radius + (spacing) + motion | `--fluid-radius-*`, `--fluid-space-*`, `--fluid-duration-*` |
| 7 | `conformance` | Accessibility | AA vs AAA | `data-fluid-conformance` + config flag |
| 8 | `review` | Review | Full preview gallery + summary of every choice | nothing (read-only) |
| 9 | `export` | Export | CSS / JSON / snippets / download / resume link | nothing (read-only) |

Per-component tweaks (the playground's Design Mode) are folded into the `review`
step as an **optional "fine-tune a component" drawer**, not a mandatory step (see
§3.8), keeps the happy path short.

### 3.1 Step `preset`: Start point
- **UI:** 3 large radio cards (dogfood `fluid-radio-group` + custom card render,
  or a row of `fluid-card`s each with a mini swatch preview): **Default** (blue),
  **Midnight** (violet), **Corporate**, plus a 4th **"Start from scratch"** card.
- **Action:** sets `data-fluid-brand` on the preview root. Choosing a *named*
  preset means the wizard's diff stays empty until the user changes something
  (the preset CSS already does the work). Choosing "scratch" keeps
  `data-fluid-brand="custom"` and an empty diff.
- **Validation:** none. Always advanceable.
- **Preview:** the persistent right-rail preview re-themes instantly.

### 3.2 Step `scheme`: Color scheme
- **UI:** `fluid-segmented-control` with `light` / `dark` / `auto`.
- **Writes:** `data-fluid-theme` on `<html>` of the preview (light/dark). `auto`
  records a config flag and the consumer snippet emits a
  `@media (prefers-color-scheme: dark)` note + `data-fluid-theme` guidance.
- **Note:** scheme is an *attribute*, not a token, so it does **not** enter the
  `themeStore` diff. It is stored in `wizardStore.config.scheme` and only affects
  the exported setup instructions + which `manifest.semantics[scheme]` the accent
  contrast check runs against.

### 3.3 Step `accent`: Accent color (the centerpiece)
- **UI:** `fluid-color-picker` (seed) + a derived 10-swatch ramp strip + a
  contrast results panel.
- **Algorithm (seed → ramp):** generate `brand-50 … brand-900` from one seed.
  v1 approach (no new deps): convert seed to **OKLCH**, fix hue+chroma, sweep
  lightness across the 10 canonical stops (matching the default ramp's lightness
  curve measured from `tokens.ts`), clamp chroma near the extremes. Provide a
  "tweak individual stops" disclosure that falls back to the playground's
  per-stop color controls for power users. (See §11 for the algorithm decision.)
- **Writes:** `themeStore.set('--fluid-color-brand-600', …)` for each derived
  stop. Because semantics reference `{color.brand.600}` etc., the accent,
  focus-ring, and any brand-driven UI update live via `themeStore.applyTo`'s
  semantic re-declaration trick (already implemented in `store.ts`).
- **Validation (WCAG, runs live):**
  - `accent.base` (brand-600 light / brand-500 dark) vs `accent.text` (white)
    must be **≥ 4.5:1** (SC 1.4.3). Show a `fluid-callout variant="success|danger"`
    with the measured ratio.
  - `focus.ring.color` (brand-500/400) vs adjacent surface ≥ **3:1** (SC 1.4.11).
  - Run the check against the **scheme chosen in step 2** (uses
    `manifest.semantics.light` or `.dark` to know which brand stop maps to
    `accent.base`).
  - Contrast math lives in a new shared util `contrast.ts` (relative luminance per
    WCAG; reused by step 4). The repo already documents the AA contrast targets in
    `tokens.ts` comments and the accessibility skill, formalize them here.
- **Preview:** buttons / links / focus rings in the right rail recolor live.

### 3.4 Step `tones`: Status colors
- **Framing:** semantic tones are **theme-independent across brands** (the
  `tokens.ts` comment is explicit: switching brand does not recolor
  success/danger/warning/info). So this step is **optional / "advanced"** and
  collapsed by default with a "Most teams keep the defaults" note.
- **UI:** four `fluid-color-picker`s (one per tone base), each showing a live
  swatch with the tone's `text` color overlaid + a contrast badge.
- **Writes:** semantic vars directly into `themeStore` (e.g.
  `--fluid-success-base`). Note these are *semantic*, light/dark differ, write
  the value for the **currently-previewed scheme**; the export documents that the
  other scheme keeps defaults unless also overridden. (v1: override light only,
  warn that dark uses defaults, see §11.)
- **Validation:** base vs text ≥ 4.5:1, same util as step 3.

### 3.5 Step `type`: Typography
- **UI:**
  - Font family: a `fluid-select` of a **curated list** (system stack, Inter,
    Geist, IBM Plex, Roboto, Source Sans, + "Custom…" text input). Default value
    is the current `--fluid-font-family-sans` from the manifest.
  - Mono family: same pattern (optional, collapsed).
  - Type scale: a single `fluid-slider` "scale ratio" (1.0–1.333) that **derives**
    all eight `--fluid-font-size-*` from a base, OR a "manual" disclosure exposing
    each size as its own slider (each token already carries a `$range` in the
    manifest, reuse it directly).
- **Writes:** `--fluid-font-family-sans/-mono`, and each `--fluid-font-size-*`.
- **Caveat:** the wizard only sets the CSS var; it does **not** bundle the font
  file. The export step emits a `@font-face` / Google Fonts `<link>` reminder for
  any non-system family chosen. (See §11.)
- **Validation:** none blocking; soft warning if a custom family string looks
  malformed.

### 3.6 Step `shape`: Shape & density
- **UI:**
  - Radius: a single "roundness" `fluid-slider` (0 → 1) mapping to the four
    `--fluid-radius-*` proportionally, or manual per-token sliders (manifest
    `$range` exists for sm/md/lg/xl). Live preview shows a button + card + input.
  - Density: a `fluid-segmented-control` Compact / Cozy / Comfortable that scales
    the `--fluid-space-*` ramp. **Requires** marking the space scale `$userFacing`
    in `tokens.ts` first (see §11/§9), otherwise this control is deferred to W3.
  - Motion (collapsed/optional): `--fluid-duration-{fast,normal,slow}` sliders
    (manifest `$range` exists) + a "reduce motion" note.
- **Writes:** the touched `--fluid-radius-*`, `--fluid-space-*`,
  `--fluid-duration-*`.

### 3.7 Step `conformance`: Accessibility level
- **UI:** `fluid-segmented-control` **AA** (default) / **AAA**, with a plain-text
  explanation of the deltas: target size 24→44px, focus ring 2→3px (mirrors the
  docs' `ConformanceToggle`/`ConformanceCode` behavior).
- **Writes:** sets `data-fluid-conformance` on the preview root (an *attribute*,
  not a token, handled by the existing `base.css` AAA block). Stored as
  `wizardStore.config.conformance`. Export emits the attribute + a note.
- **Preview:** buttons/fields visibly grow; this is the most dramatic live change
  and a good confidence-builder near the end.

### 3.8 (Within `review`) Optional per-component fine-tune
- The `review` step renders the full preview gallery (reuse
  `<component-preview>` from the playground). A "Fine-tune a component" button
  opens a `fluid-drawer` that mounts the playground's **Design Mode** path:
  `<design-inspector>` (click-to-select) + the component-token sidebar driven by
  `component-tokens-map.ts` (CEM `@cssproperty`/`@uses-token`). Edits go to
  `elementOverridesStore` keyed by `data-fluid-id`, exactly as the playground
  does. **v1 can ship this drawer disabled behind a flag** and still be complete;
  the brand-wide config is the core deliverable.

### 3.9 Step `export`
See §6.

---

## 4. Per-step UI contract (dogfood `fluid-*` only)

Every control is a Fluid component (the wizard is itself a showcase):

| Need | Component | Event |
|---|---|---|
| One-of-N choice | `fluid-segmented-control` + `fluid-segment` | `fluid-change {value}` |
| Card choice | `fluid-radio-group` / `fluid-card` | `fluid-change` |
| Color | `fluid-color-picker` | `fluid-change {value}` |
| Numeric token | `fluid-slider` (manifest `$range`) | `fluid-change {value}` |
| Curated/custom list | `fluid-select` + `fluid-option` | `fluid-change` |
| Free text (custom font) | `fluid-input` | `fluid-input` |
| Status / contrast verdict | `fluid-callout variant=…` |, |
| Code output | `fluid-code-block` |, |
| Container | `fluid-card`, `fluid-drawer`, `fluid-tabs` |, |

Each step element:
- subscribes to `wizardStore` for its slice of config + to `themeStore` for the
  current resolved values,
- writes via `themeStore.set(cssVar, value)` (brand-wide): which auto-applies to
  the preview through the existing subscriber in `<component-preview>`,
- exposes a "Reset this section" affordance that clears just the vars it owns
  (it knows its own cssVar list).

`register-fluid.ts` must add `define/` imports for: `color-picker`, `slider`,
`select`, `option`, `segmented-control`, `segment`, `radio`, `radio-group`,
`input`, `code-block`, `drawer`, `tabs`, `tab`, `callout` (some already present).

---

## 5. State & data model

### `wizardStore` (extend the existing file)

```ts
export const STEPS = [
  "preset", "scheme", "accent", "tones",
  "type", "shape", "conformance", "review", "export",
] as const;
export type Step = (typeof STEPS)[number];

export interface WizardConfig {
  preset: "default" | "midnight" | "corporate" | "custom";
  scheme: "light" | "dark" | "auto";
  seed?: string;                 // accent seed hex (ramp is derived → themeStore)
  conformance: "aa" | "aaa";
  fontPreset?: string;           // curated key or "custom"
  density?: "compact" | "cozy" | "comfortable";
  completed: Partial<Record<Step, boolean>>;  // for stepper "done" ticks
}

export interface WizardState {
  step: Step;
  config: WizardConfig;
}
```

**Token values themselves do NOT live in `wizardStore`.** They live in the
existing `themeStore` (brand-wide) and `elementOverridesStore` (per-element).
`wizardStore` only holds *navigation + non-token decisions* (preset/scheme/
conformance attributes, seed, chosen presets, completion). This is deliberate:
it lets the wizard and the Theme Builder share the *exact* same token diff and
the *same* URL-hash format.

The store keeps its current `subscribe/next/prev/setStep` API and gains
`setConfig(partial)`, `reset()`, and `markComplete(step)`.

### Mapping config → token overrides

- `preset` → `data-fluid-brand` attribute (no diff) + optionally pre-fills seed
  from the preset's brand-600.
- `seed` → `deriveRamp(seed)` → 10× `themeStore.set('--fluid-color-brand-N', …)`.
- `scheme` / `conformance` → attributes on preview root + config; emitted as
  setup instructions, not CSS vars.
- All slider/select edits → `themeStore.set(cssVar, value)` directly.

### Persistence & resumability
- **URL hash:** reuse `apps/playground/src/url-state.ts` verbatim for the token
  diff (`#theme=…`, `#elements=…`). **Add** a third key `#wizard=<b64>` carrying
  the `WizardConfig` (step + attributes). Factor the encode/decode helpers out of
  `url-state.ts` into a tiny shared `apps/wizard/src/url-codec.ts` (or import the
  playground's if we extract a shared package, see §7) so the format matches.
- **localStorage:** mirror `wizardStore.config` + the diff under
  `fluid-wizard-state` so a refresh resumes mid-flow (the playground does not
  persist to localStorage today; this is wizard-net-new and small).
- **Result:** sharing the URL reopens the wizard at the same step with the same
  config; pasting it into the Theme Builder reopens just the token diff.

---

## 6. Output / export (Step `export`)

Reuse the playground's export machinery; present it as a guided summary.

### What the user walks away with
1. **`fluid-custom-brand.css`**: the brand-wide override block. Generated by
   `themeStore.toCSS('[data-fluid-brand="custom"]')` (already implemented). If
   the per-component drawer was used, append `elementOverridesStore.toCSS()`
   exactly like `export-panel.ts`'s `buildCss()`.
2. **`fluid.config.json`**: the `WizardConfig` plus the token diff. Lets the
   consumer re-open the wizard later or feed CI. Net-new tiny serializer.
3. **Copy-paste setup snippets** (mirror `export-panel.ts`):
   - `npm install @fluid-ds/components @fluid-ds/tokens @fluid-ds/icons`
   - entry imports (`base/light/dark.css`, `./fluid-custom-brand.css`,
     `register-defaults`, per-component `define/*`)
   - the wrapper attributes the config needs:
     `<html data-fluid-brand="custom" data-fluid-theme="…" data-fluid-conformance="…">`
   - font `<link>`/`@font-face` reminder if a non-system family was chosen.
4. **Download button**: Blob download of the CSS (reuse `handleDownload` logic).
   Optionally a `.zip` (CSS + JSON + a `README` snippet) via a tiny zip helper:
   defer JSZip to a later milestone.
5. **Resume link**: the current URL (with `#wizard`/`#theme`) shown in a
   `fluid-code-block` + copy button.
6. **Links** to the docs install + theming guides
   (`/docs/guides/…`, the component-token-convention doc).

### Reuse vs. net-new
- **Reuse:** `themeStore.toCSS`, `elementOverridesStore.toCSS`, the
  download-blob pattern, the 3-step snippet layout from `export-panel.ts`.
- **Net-new:** the JSON config serializer, the font reminder, the attribute
  summary line, the resume-link block. These are thin presentational additions in
  a `wizard-step-export.ts`.

---

## 7. Architecture & reuse: concrete module list

```
apps/wizard/
  package.json                 (exists; add nothing or only define imports)
  index.html, vite.config.ts   (exist)
  src/
    main.ts                    (exists)
    register-fluid.ts          (EXTEND: add define/* for all controls used)
    wizard-app.ts              (EXTEND: 9-step stepper, keyboard, live region)
    wizard-store.ts            (EXTEND: WizardConfig, setConfig, markComplete)
    contrast.ts                (NEW: WCAG relative-luminance + ratio helpers)
    derive-ramp.ts             (NEW: seed hex → 10 brand stops, OKLCH sweep)
    url-codec.ts               (NEW: encode/decode shared with playground format)
    preview-rail.ts            (NEW: persistent right-rail live preview wrapper)
    steps/
      step-preset.ts           (NEW)
      step-scheme.ts           (NEW)
      step-accent.ts           (NEW)
      step-tones.ts            (NEW)
      step-type.ts             (NEW)
      step-shape.ts            (NEW)
      step-conformance.ts      (NEW)
      step-review.ts           (NEW; mounts component-preview + optional drawer)
      step-export.ts           (NEW; replaces step-download.ts role)
      step-select.ts           (KEEP, behind flag; deferred)
      step-theme.ts            (DELETE or repurpose; superseded by the above)
      step-download.ts         (KEEP as reference; export step supersedes)
```

### Reused from `apps/playground` (import directly across the workspace)
The cleanest path is a small **shared internal package** so both apps import the
engine instead of reaching across app boundaries:

- **Option A (recommended, low-risk):** extract the framework-agnostic engine
  into `packages/theme-engine` (private, not published): `store.ts`,
  `manifest.ts`, `element-overrides-store.ts`, `url-state.ts` helpers,
  `component-tokens-map.ts`, `contrast.ts`, `derive-ramp.ts`. Both `playground`
  and `wizard` depend on it. The current `step-theme.ts` comment already
  anticipates this ("`packages/theme-engine`"). This is the right long-term move
  and removes duplication.
- **Option B (fast start):** the wizard imports the playground's modules via a
  `workspace:*` dep or relative path for v1, and we extract later. Acceptable for
  W1 but pay down in W2.

**Recommendation:** do **Option B in W1** (unblock), **Option A in W2** (extract
`packages/theme-engine`, repoint both apps). The plan's milestones reflect this.

Reused **UI** components from the playground (only if the engine is shared):
- `component-preview` / `preview-card` → the review-step gallery + right rail.
- `design-inspector` (`inspector.ts`) + `token-control`/`token-form` → the
  optional fine-tune drawer.

### Framework
Lit 3 + TypeScript + Vite (matches every other app). No new framework. No new
runtime deps for v1 (ramp derivation is hand-rolled OKLCH math; JSZip only if/when
the ZIP export lands).

---

## 8. Accessibility of the wizard itself (AA bar: it's a Fluid surface)

- **Stepper** is an ordered list of `<button>`s with `aria-current="step"` on the
  active one (already in `wizard-app.ts`). Add `aria-disabled` on steps not yet
  reachable if we gate forward nav; keep all visited steps clickable.
- **Step transitions:** the `section.step-content` is already `aria-live="polite"`.
  On step change, move focus to the step's `<h2>` (give it `tabindex="-1"`) and
  announce "Step N of M: <title>" via a visually-hidden live region.
- **Keyboard:** Back/Next reachable via Tab; support `Alt+←/→` (or just rely on
  the buttons). Every control already dogfoods accessible `fluid-*` components.
- **Focus order:** header → stepper → step content → footer (DOM order already
  matches).
- **Reduced motion:** the `design-pulse` keyframe and any step-slide transitions
  must be wrapped in `@media (prefers-reduced-motion: reduce)` no-ops (the
  playground already guards its pulse).
- **Contrast:** the wizard chrome itself uses semantic tokens, so it inherits AA;
  the contrast *of the user's chosen theme* is validated in-step (§3.3/3.4).
- **Conformance self-test:** the wizard should pass the same axe / open-wc audit
  the components do; add a smoke a11y test if the wizard gets a test target
  (today only `@fluid-ds/components` runs tests, see §10).

---

## 9. Token-source prerequisites (small `packages/tokens` edits)

Some steps need tokens to be `$userFacing` (so they appear in the manifest the
engine reads). These are **one-line edits in `tokens.ts`** + a tokens rebuild:

- **Spacing density (step 6):** `space.*` leaves currently have no
  `$userFacing`/`$range`. To drive the Compact/Cozy/Comfortable control, either
  (a) mark the scale `$userFacing` with ranges, or (b) implement density as a
  derived multiplier the wizard applies to each `--fluid-space-*` without a
  manifest entry. **Decision: (b) for v1** (no token-source change, density is a
  wizard-side transform); promote to (a) if the Theme Builder wants it too.
- **Semantic tones in dark scheme (step 4):** already in `manifest.semantics.dark`
, no source change; just decide v1 scope (light-only override, see §11).
- Everything else (brand, font family/size, radius, duration) is **already
  `$userFacing`**, confirmed in `tokens.ts`. No change needed.

Any token-source change ships in the **same commit** per `CLAUDE.md`, and
`FEATURES.md` is updated when the wizard lands as a marketing-worthy surface.

---

## 10. Coverage gate, verify, and build wiring

- **`pnpm check:coverage`** walks `packages/components` for stories/preview/docs.
  The wizard adds **no new `fluid-*` component**, so the gate is unaffected. The
  wizard's own `wizard-step-*` elements are app-internal (not `fluid-*`), so they
  don't trip it.
- **`pnpm verify`** = typecheck → lint → check:coverage → test → build. The
  wizard's `typecheck` (`tsc --noEmit`) already runs under `pnpm -r typecheck`.
  Lint (`eslint .`) covers `apps/wizard`. **`pnpm build` only builds
  `packages/*`**, not apps, so the wizard build is validated separately via
  `pnpm wizard:build` (already a root script) and in `build-website.mjs`.
- **Website integration:** add the wizard to `scripts/build-website.mjs` (build
  with `WIZARD_BASE=/wizard/`, stage to `website/wizard/`), add `_redirects`
  (`/wizard → /wizard/`) and `_headers` (`/wizard/assets/*` long-cache) entries:
  mirror exactly what `landing`/`playground` do. The site-nav clone in
  `wizard-app.ts` already links to the other surfaces; add a "Wizard" link to the
  other apps' navs.
- **`pnpm dev`** already launches the wizard (port per its vite config).

---

## 11. Risks / open questions (decide before/at W1)

1. **Ramp-from-seed algorithm.** Proposal: OKLCH lightness sweep with fixed
   hue/chroma, calibrated to the default ramp's lightness stops, chroma-clamped at
   the ends. Alternatives: HSL sweep (simpler, worse perceptual spacing) or a dep
   like `culori`/`chroma-js` (better, +bundle). **Decide:** hand-rolled OKLCH
   (no dep) for v1, accept "good not perfect", expose manual per-stop override as
   the escape hatch. Confirm acceptable.
2. **Fonts: curated list vs. arbitrary.** Proposal: curated `fluid-select` +
   "Custom…" free text. The wizard sets the CSS var only; it does **not** bundle
   the font, export emits a `<link>`/`@font-face` reminder. **Decide:** curated +
   custom-string, no font bundling in v1.
3. **Semantic tones scope.** They're theme-independent across *brands* but differ
   light/dark. **Decide:** v1 overrides the **previewed scheme only** and warns
   the other scheme keeps defaults; v2 offers per-scheme editing. Also confirm
   tones stay a collapsed "advanced" step (most users skip).
4. **Density.** Wizard-side multiplier (no token change) vs. `$userFacing` space
   scale. **Decide:** multiplier for v1.
5. **Per-component fine-tune in v1?** Proposal: ship the Design-Mode drawer behind
   a flag, off by default; brand-wide config is the v1 deliverable. **Decide.**
6. **Component-selection step.** Keep `step-select` deferred (depends on
   tree-shaking/bundle work not built)? Proposal: yes, defer. **Decide.**
7. **Engine extraction timing.** Option B (cross-import) in W1 vs. Option A
   (`packages/theme-engine`), proposal: extract in W2. **Decide.**
8. **`auto` scheme** export guidance: confirm we emit `prefers-color-scheme`
   guidance rather than forcing an attribute.

---

## 12. Phased milestones (each independently shippable)

### W1: Flow skeleton + accent + export (the spine)
**Goal:** a user can walk preset → scheme → accent → review → export and get a
working `fluid-custom-brand.css`. Other steps stubbed but navigable.
- `wizard-store.ts`: extend to the 9-step `STEPS` + `WizardConfig` + `setConfig`.
- `wizard-app.ts`: render 9 steps, focus-to-heading + live-region announce,
  reduced-motion guard.
- Cross-import playground `store.ts` + `manifest.ts` (Option B) into the wizard.
- `contrast.ts`, `derive-ramp.ts` (new).
- `step-preset.ts`, `step-scheme.ts`, `step-accent.ts` (full), `step-review.ts`
  (preview only), `step-export.ts` (CSS + snippets + download + resume link).
- `step-tones/type/shape/conformance` rendered as "coming next" placeholders.
- `preview-rail.ts` persistent live preview; `register-fluid.ts` extended.
- **Acceptance:** pick midnight → set a seed → contrast verdict shows → export
  CSS downloads and, when loaded in a blank page with the base tokens, recolors
  `fluid-button`. `pnpm typecheck` + `pnpm lint` + `pnpm wizard:build` green.
  Browser-verified (Chrome DevTools MCP) per `verify-in-browser`.

### W2: Extract `packages/theme-engine` + remaining config steps
**Goal:** real implementations of tones / type / shape / conformance, on a shared
engine.
- Create `packages/theme-engine` (private): move `store.ts`, `manifest.ts`,
  `element-overrides-store.ts`, url-codec, `component-tokens-map.ts`,
  `contrast.ts`, `derive-ramp.ts`. Repoint **playground + wizard** imports.
  Re-run `pnpm verify` to prove no regression in the playground.
- Implement `step-tones.ts` (light-scheme tones + contrast), `step-type.ts`
  (curated fonts + scale slider, manifest `$range`), `step-shape.ts` (radius +
  density multiplier + motion), `step-conformance.ts` (AA/AAA attribute).
- URL `#wizard` config persistence + localStorage resume.
- **Acceptance:** every step writes the correct `--fluid-*` (verified by reading
  computed styles in-browser); refresh resumes mid-flow; playground still passes
  `pnpm verify`. JSON config export added.

### W3: Fine-tune drawer, website wiring, polish, docs
**Goal:** production-ready surface.
- Optional per-component drawer in `step-review` reusing `design-inspector` +
  `component-tokens-map` + `elementOverridesStore` (flag-gated).
- `scripts/build-website.mjs` + `_redirects` + `_headers`: stage `website/wizard/`.
  Add "Wizard" nav link across landing/docs/playground/demos.
- Optional ZIP export (JSZip): CSS + JSON + README.
- A wizard guide page in the docs (`apps/docs/.../guides/`), link from export
  step; update `docs/FEATURES.md` (new marketing surface) and `docs/HANDOFF.md`.
- a11y smoke pass (axe / open-wc) if a test target is added for the wizard.
- **Acceptance:** `pnpm build:website` produces `website/wizard/`; full
  `pnpm verify` + `pnpm docs:build` green; browser-verified end-to-end including
  the resume link and the fine-tune drawer.

---

## 13. Verification per phase (how we prove it)

- **Static:** `pnpm typecheck` (incl. `apps/wizard`), `pnpm lint`.
- **Engine regression:** after the W2 extraction, `pnpm verify` must still pass:
  the playground is the canary that the shared engine didn't break.
- **Build:** `pnpm wizard:build` each phase; `pnpm build:website` in W3.
- **Docs:** `pnpm docs:build` whenever a wizard `.mdx` guide is touched (note:
  `verify` does **not** build docs, per HANDOFF).
- **Coverage:** `pnpm check:coverage` stays green (wizard adds no `fluid-*`).
- **Browser (mandatory, per `verify-in-browser` skill):** with Chrome DevTools
  MCP, load the wizard, walk the steps, and **read computed styles** to confirm
  each control writes the intended `--fluid-*` and the contrast verdicts match
  real ratios. Confirm the exported CSS, loaded into a clean page, actually
  re-themes components. Do not claim a visual step works without measuring.
