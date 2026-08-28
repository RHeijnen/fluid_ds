# Fluid: agent guide

Framework-agnostic web-component design system (Lit 3 + TypeScript), pnpm
monorepo, distributed as `@fluid-ds/*`.

## Voice & naming — non-negotiable

These two rules apply to every word of human-readable text we write (UI copy,
docs, MDX, comments, commit bodies, READMEs, marketing):

1. **Call it "Fluid", never "Fluid DS".** In 99% of cases the product is just
   **Fluid**. Spell out **"Fluid Design System"** only on the rare occasion the
   full term is genuinely needed (a formal first mention). The string "Fluid DS"
   must never appear in prose.
   - This rule is about *prose only*. It does NOT change identifiers: the npm
     scope `@fluid-ds/*`, the repo folder `fluid_ds`, the `--fluid-*` CSS tokens,
     the `fluid-*` element names, and `data-fluid-*` attributes all stay exactly
     as they are.
2. **No em dashes.** The "—" character is banned. Rewrite the sentence using a
   colon, a comma, parentheses, or a full stop instead. A plain hyphen "-" in
   compound words and a numeric en-dash range (like "10–20") are fine; the em
   dash is not.

## Cross-device handoff: read this first

This repo is worked on from more than one machine. **At the start of a session,
read [`docs/HANDOFF.md`](docs/HANDOFF.md)** to see where the last session left off.
**At the end of a session**, update its _Current state_ snapshot and add a dated
_Log_ entry, then commit and push so the other device sees it.

`HANDOFF.md` is committed and shared. Claude's `memory/` folder is private and
machine-local (not synced), so keep cross-device facts in the handoff, not memory.

## Feature list: keep it current

[`docs/FEATURES.md`](docs/FEATURES.md) is the canonical capability list and the
source of truth the marketing / landing page draws from. **Whenever a big
feature lands or changes status** (a new package, a new app/surface, a
marketing-worthy capability, or a 📋→🔨→✅ status flip), **update
`docs/FEATURES.md` in the same change.** Don't maintain pitch copy independently:
regenerate it from this list.

## Toolchain: pnpm only

- Use **pnpm** (`packageManager: pnpm@9.15.0`). If `pnpm` isn't on PATH, use
  `corepack pnpm …`. Never run `npm install` / `yarn`: it corrupts the workspace
  layout and leaves a stray `package-lock.json`.
- Fresh checkout: `corepack pnpm install` then `corepack pnpm build`.
  The build must run before `typecheck`/`verify`, because `@fluid-ds/icons` only
  exposes its built `dist`.

## Common commands

- `pnpm dev`: Storybook + playground together.
- `pnpm build` / `pnpm typecheck` / `pnpm test`.
- `pnpm verify`: workspace and browser-test typechecks, lint, presence/quality,
  canonical manifests, framework/test-harness guards, tokens, serialized unit
  matrix, build, cold Node SSR/rendering, and built documentation links. See the
  root `package.json` for exact ordering. Browser SSR, accessibility, visual,
  packed-framework runtime and measured coverage have additional dedicated gates;
  a passing `verify` alone is not production certification.
- Supervised unit-test cleanup currently has Windows native-handle and Linux
  pidfd implementations. Linux requires Python with `os.pidfd_open` and
  `signal.pidfd_send_signal`; CI configures Python 3.13. The baseline native Linux
  controls and expanded watchdog guards pass on Python 3.12.3 (39 applicable
  checks, with one Windows-only skip).
  Other operating systems fail closed
  before supervised execution rather than falling back to PID-tree cleanup.
  Stock watch-mode execution is not an equivalent lifecycle-certification gate.
  Batch mode has a separate 30-second startup watchdog, unchanged 30-second
  shutdown deadline and 10-second inventory/cleanup operation bounds. A timeout
  remains a failure; unavailable process inventory is unknown, not empty.
  See `docs/reviews/windows-webkit-teardown-2026-08-26.md` for the retained
  Windows failures and the separate ownership-safety incident.
- `pnpm check:coverage`: every component must have a `.stories.ts`, a docs
  `.mdx` page (`apps/docs/src/content/docs/components/<name>.mdx`), AND appear in
  the playground preview (`apps/playground/src/preview.ts`). Missing any of the
  three fails the build.
- `pnpm check:tokens`: every `var(--fluid-*)` (and JS `getPropertyValue`) must
  resolve to a real token. Catches **phantom tokens** (a typo'd semantic var like
  `--fluid-color-primary` or `--fluid-line-height-normal` that silently paints
  its fallback and ignores theme overrides). Component knobs only need to resolve
  when referenced bare; primitive/semantic namespaces must always resolve.

## Building or reworking a component: read this first

**Any time you create, rework, or review a `fluid-*` component, follow the
[`component-authoring`](.claude/skills/component-authoring/SKILL.md) skill.** It
is the end-to-end standard: semantics + WCAG 2.2 AA accessibility, component-
scoped tokens that fall back to the main semantic vars, light/dark + three-brand
theming with verified contrast, and the required story + docs page + playground
card + tests. The companion
[`accessibility`](.claude/skills/accessibility/SKILL.md) skill holds the detailed
WCAG / WAI-ARIA reference the authoring skill defers to.

Existing components migrate to this standard **one at a time, per session**
(button is done), not in a big bang.

**Measure, don't assume.** For any visual bug or "looks broken" report, and
before claiming a visual fix worked, inspect the live page with the Chrome
DevTools MCP and read the real DOM / computed styles first. Follow the
[`verify-in-browser`](.claude/skills/verify-in-browser/SKILL.md) skill. Guessing
a cause from source (or blaming cache) without measuring is how debugging loops
get long.

## Conventions

- Components live in `packages/components/src/components/<name>/` as `define.ts`,
  `fluid-<name>.ts`, `.stories.ts`, `.test.ts`. All extend `FluidElement`.
- **Tear down every side effect on disconnect.** Any `setInterval` /
  `setTimeout` / `requestAnimationFrame` / observer / external `addEventListener`
  / Web-Animation started in a component must be undone in
  `disconnectedCallback`, or it leaks (and keeps running in Storybook when you
  switch stories). `FluidElement` provides opt-in helpers so you can't forget:
  `this.registerCleanup(() => clearInterval(id))`, `this.listen(target, type, fn)`
  (auto-removed on disconnect), and `this.disconnectSignal` (an `AbortSignal` for
  `addEventListener`/`fetch`). Also honor `prefers-reduced-motion` for any
  auto/looping/decorative motion.
- Component-scoped tokens use inline `var()` fallback, e.g.
  `var(--fluid-button-bg, var(--fluid-accent-base))`, never a `:host` declaration
  (it pins the value and breaks global overrides). This override ladder
  (brand → component → instance) is the core theming contract. See
  [`docs/component-token-convention.md`](docs/component-token-convention.md).
- New component tokens must be annotated with `@cssproperty` in the component
  JSDoc; main semantic vars a component reads get `@uses-token`.
- Semantic status tones (success / danger / warning / info) are
  **theme-independent**: brand themes only retune the `--fluid-accent-*` track.
