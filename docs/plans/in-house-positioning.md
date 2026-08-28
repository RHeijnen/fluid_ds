# In-house positioning: replace `@floating-ui/dom`

Goal: drop the only runtime third-party dependency shared across the overlay
components, `@floating-ui/dom`, in favor of an in-house engine, so the design
system ships zero third-party positioning code (and the docs CDN import-map no
longer has to shim it).

## Status

**COMPLETE (2026-08-25).** All 11 overlay components migrated in one pass,
`@floating-ui/dom` removed from every package.json and import map, overlays
browser-verified (placement, width-matching, flip at the viewport edge,
scroll tracking, popconfirm arrow). Two fixes landed during the migration:
the engine's `size` middleware now passes `elements` to `apply` (Floating UI
signature parity; select/popup/typeahead width-matching depended on it), and
popconfirm renders the `.arrow` element its positioning code had always
expected. Tooltip was upgraded from untracked absolute positioning to
`strategy: "fixed"` + `autoUpdate`.

- ✅ **Engine built + unit-tested**, `packages/components/src/internal/position.ts`
  (+ `position.test.ts`, 8 deterministic tests). It re-implements the subset of
  Floating UI the components use, with a drop-in-compatible API:
  - `computePosition(reference, floating, { placement, strategy, middleware })`
    → `{ x, y, placement, strategy, middlewareData }` (async, like Floating UI).
  - middleware: `offset(n)`, `flip({ padding })`, `shift({ padding })`,
    `size({ padding, apply })`, `arrow({ element, padding })`.
  - `autoUpdate(reference, floating, update, options)` → cleanup.
  - exported types: `Placement`, `Side`, `Alignment`, `Strategy`, ...
- ⏳ **Not wired into any component yet** (inert internal code, zero risk).

## The migration (one component per session, browser-verified)

Eleven components import `@floating-ui/dom`:

`tooltip`, `popover`, `popup`, `dropdown`, `select`, `typeahead`, `popconfirm`,
`date-picker`, `date-range-picker`, `time-picker`, `tour`.

For each: change the import from `@floating-ui/dom` to
`../../internal/position.js` (the API matches), then **browser-verify** the live
placement before moving on.

Suggested order, simplest first: `tooltip` → `popover` / `popconfirm` →
`popup` → `dropdown` / `select` / `typeahead` → the date/time pickers → `tour`.

## The one real risk: strategy + offsetParent in shadow DOM

This is what the unit tests can't fully cover and what each migration must check
in a real browser:

- Components position their floating element with **`position: absolute`** inside
  their **shadow root** (e.g. tooltip's `.popover`). Floating UI's default
  `absolute` strategy returns coordinates relative to the floating element's
  **offset parent**, and its platform layer resolves the offset parent across
  shadow boundaries. The in-house engine uses `floating.offsetParent` and
  subtracts its rect + scroll, a simplification that may not match Floating UI
  pixel-for-pixel when the offset parent is the host vs. a positioned ancestor
  vs. the document.
- **Mitigations to evaluate per component:**
  1. Prefer **`strategy: "fixed"`** + `position: fixed` on the floating element
     (viewport coordinates, which the engine handles simply and exactly). Most of
     these overlays are top-layer / popover-based and can move to fixed cleanly,
     several already use the Popover API.
  2. If a component must stay `absolute`, verify the offset-parent math against
     the old Floating UI output in the browser (open the story, trigger the
     overlay at several placements + after scrolling, compare positions).

## Verification checklist (per component)

- [ ] Default placement renders flush against the anchor (no drift).
- [ ] `flip` works: near a viewport edge it flips to the opposite side.
- [ ] `shift` works: near a perpendicular edge it slides to stay on-screen.
- [ ] Arrow (where used) stays centered on the anchor and never points past an edge.
- [ ] Re-positions on scroll/resize (`autoUpdate`), and the listeners are cleaned
      up on close/disconnect (use `FluidElement.registerCleanup` /
      `disconnectSignal`).
- [ ] Component's existing `*.test.ts` still passes; add a regression for the
      placement contract if missing.

## When all eleven are migrated

- Remove `@floating-ui/dom` from `packages/components/package.json` dependencies.
- Drop the `@floating-ui/dom` entry from the docs CDN import-map shim.
- Update `docs/FEATURES.md` (zero runtime third-party deps in core).
