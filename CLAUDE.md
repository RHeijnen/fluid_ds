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
- `pnpm verify`: full gate of typecheck → lint → check:coverage → test → build.
- `pnpm check:coverage`: every component must have a `.stories.ts`, a docs
  `.mdx` page (`apps/docs/src/content/docs/components/<name>.mdx`), AND appear in
  the playground preview (`apps/playground/src/preview.ts`). Missing any of the
  three fails the build.

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
- Component-scoped tokens use inline `var()` fallback, e.g.
  `var(--fluid-button-bg, var(--fluid-accent-base))`, never a `:host` declaration
  (it pins the value and breaks global overrides). This override ladder
  (brand → component → instance) is the core theming contract. See
  [`docs/component-token-convention.md`](docs/component-token-convention.md).
- New component tokens must be annotated with `@cssproperty` in the component
  JSDoc; main semantic vars a component reads get `@uses-token`.
- Semantic status tones (success / danger / warning / info) are
  **theme-independent**: brand themes only retune the `--fluid-accent-*` track.
