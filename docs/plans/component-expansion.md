# Program plan: component expansion

Status: **in progress**. Build order top to bottom; each component lands to the
full authoring standard (semantics + WCAG 2.2 AA, component-scoped tokens,
story + docs page + playground card + tests) with `pnpm verify` green at each
checkpoint.

## Packaging decisions

**Core (`@fluid-ds/components`)** for general-purpose UI primitives:
pagination, menu / menu-item / menu-bar + context-menu, command-palette, OTP /
PIN input, tag-input (token input), field (form-field wrapper), toolbar,
empty-state, timeline / timeline-item, stat (KPI), avatar-group, kbd, banner,
speed-dial (FAB), pricing-table.

**`@fluid-ds/media`** (existing pack): audio player, lightbox / gallery.

**New expansion packs** (domain-specific, heavier deps):
- `@fluid-ds/table` — data grid (sort / filter / select / virtualize).
- `@fluid-ds/calendar` — event calendar (month / week / day views), distinct
  from the booking `@fluid-ds/scheduler`.
- `@fluid-ds/editor` — accessible rich-text / markdown editor.
- `@fluid-ds/kanban` — drag-drop board (gantt later).
- `@fluid-ds/map` — themed Leaflet / MapLibre wrapper.

## Phases

- **A. Core quick wins** (presentational, low risk): `kbd`, `empty-state`,
  `stat`, `avatar-group`, `banner`, `timeline`.
- **B. Core navigation + forms** (interactive, APG-heavy): `pagination`,
  `menu` + `menu-item` + `menu-bar` + context-menu, `toolbar`,
  `command-palette`, `otp`, `tag-input`, `field`, `speed-dial`.
- **C. Core / media extras**: `pricing-table`; `@fluid-ds/media` `audio` +
  `lightbox`.
- **D. Expansion packs**: `@fluid-ds/table`, then `@fluid-ds/calendar`,
  `@fluid-ds/editor`, `@fluid-ds/kanban`, `@fluid-ds/map`.

## Per-component checklist (core)

1. `fluid-<name>.ts` (FluidElement / FluidFormAssociated) + `define.ts`.
2. Component-token override ladder; `@cssproperty` / `@uses-token` / `@csspart`
   JSDoc; conformance tokens for targets + focus.
3. `fluid-<name>.stories.ts` (every variant/state).
4. `fluid-<name>.test.ts` (isAccessible audit + contract).
5. Docs page `apps/docs/src/content/docs/components/<name>.mdx`.
6. Playground: register in `apps/playground/src/main.ts`, card in `preview.ts`.
7. Docs: register in `Head.astro`, sidebar entry in `astro.config.mjs`.
8. Export from `packages/components/src/index.ts`.
9. `pnpm verify` + `pnpm docs:build` green.
