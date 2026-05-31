# Motion system plan

Goal: a coherent, accessible motion system baked into the **core** components,
plus extraction of the mis-shelved `fluid-animation` out of `@fluid-ds/media`
(which becomes purely media). Decision (owned): **motion lives in core**, not a
standalone package, core components consume the standard animations, so the
vocabulary can't live in an optional pack; `<fluid-animation>` joins core beside
the observer utilities. Tree-shaking keeps it free for non-users.

## Conventions (apply throughout)
- **Override ladder for motion too:** components read `--fluid-<comp>-<role>`
  with a fallback to a shared motion token, e.g.
  `animation-duration: var(--fluid-dialog-enter-duration, var(--fluid-duration-normal))`.
- **Animations are swappable AND opt-out-able** (core design requirement). The
  animation *name* is itself a token, not hardwired:
  `animation-name: var(--fluid-dialog-enter-animation, fluid-scale-in)`. Four
  layers of control, all declarative (no JS):
  1. **Default**: each component ships a tasteful enter/exit.
  2. **Swap preset**: set `--fluid-<comp>-enter-animation: fluid-slide-in-up`
     (or any shipped preset) at brand / component / instance scope. Works because
     the full preset set is adopted into *every* component's shadow root, so the
     name resolves there.
  3. **None**: `--fluid-<comp>-enter-animation: none`, or the global inherited
     scalar `--fluid-motion: 0` (custom props pierce shadow DOM, so it works at
     `:root`, a subtree, or one element); `prefers-reduced-motion` is always
     honored on top.
  4. **Fully custom**: `<comp>::part(panel){ animation: myKeyframes … }` with the
     user's own document `@keyframes`. This is the ONE path for custom keyframes,
     because `::part` resolves in document scope (shadow-scoped `@keyframes`
     can't otherwise be supplied from outside). Document this explicitly.
- Per animated component therefore exposes: `--fluid-<comp>-enter-animation`,
  `--fluid-<comp>-exit-animation` (names), and timing via shared duration/easing
  tokens (overridable per component). Annotate each with `@cssproperty`.
- **Reduced motion is non-negotiable:** every component that animates ships a
  `@media (prefers-reduced-motion: reduce)` guard that drops to a near-instant
  cross-fade (or none). The shared `--fluid-motion: 0` opt-out gives apps a
  manual switch independent of the OS setting. One shared helper makes this one line.
- **Keyframes are shadow-scoped:** `@keyframes` don't cross shadow boundaries,
  so the standard set ships as a Lit `css` fragment that each component spreads
  into its `static styles` (adopted per shadow root). Not a global stylesheet.
- Follow the `component-authoring` skill for every component reworked.
- `pnpm docs:build` after any `.mdx`; browser-verify marquee animations
  (incl. reduced-motion emulation) per `verify-in-browser`.

---

## Phase 0: Extract `fluid-animation` from media → core
Media must be purely media (video, video-playlist, animated-image, zoomable-frame).
1. Move `packages/media/src/components/animation/` →
   `packages/components/src/components/animation/`; re-base it on `FluidElement`.
2. Remove it from `@fluid-ds/media` (delete folder, update `src/index.ts`).
3. Wire core: it auto-exports via `@fluid-ds/components` `./define/*`; add
   `import "@fluid-ds/components/define/animation"` to docs `Head.astro`.
4. Docs: remove animation from the `@fluid-ds/media` expansion page; add a core
   component page `components/animation.mdx`; move the sidebar entry out of
   "Expansion packs" into the core utilities group (with the observers).
5. Coverage: add story (move from media) + docs page + preview card (or
   PREVIEW_EXEMPT, it's `display:contents`, presentational).
6. Regenerate CEM; `pnpm verify` + `pnpm docs:build` green.

## Phase 1: Motion foundation (tokens + shared module)
1. **Tokens** (`@fluid-ds/tokens`, theme-independent): add easings
   `--fluid-easing-decelerate` (enter), `--fluid-easing-accelerate` (exit),
   `--fluid-easing-emphasized`; keep `standard`. Add `--fluid-duration-slower`
   (~480ms) for large surfaces (drawer). Document in the tokens manifest.
2. **`packages/components/src/internal/motion.ts`**: export a `css` fragment
   with the standard `@keyframes`: `fluid-fade-in/out`, `fluid-scale-in/out`
   (0.96→1 + fade), `fluid-slide-in-{up,down,left,right}` + `-out`,
   `fluid-backdrop-in/out`. Plus an exported reduced-motion guard fragment.
3. Document the set + the per-component motion-token names.

## Phase 2: Apply standard motion to overlays & disclosure (one per turn)
Each: enter + exit, component motion tokens w/ fallback, reduced-motion guard,
story state, docs note, browser-verify.
- [ ] **dialog**: scale+fade enter / fade-down exit + backdrop fade; ADD reduced-motion.
- [ ] **drawer**: slide-in from edge (per `placement`) + backdrop; real keyframes; reduced-motion.
- [ ] **toast**: slide+fade in (per placement), fade out; reduced-motion. (currently none)
- [ ] **popover**: scale+fade enter/exit tied to side; reduced-motion.
- [ ] **tooltip**: fade(+small slide) enter/exit; reduced-motion.
- [ ] **dropdown**: align existing `@starting-style` to the shared presets.
- [ ] **accordion / details**: animated expand/collapse (grid-rows 0fr→1fr or WAAPI); reduced-motion.
- [ ] **segmented-control**: sliding active thumb over the track (user-requested).
- [ ] **tabs**: sliding active indicator under the active tab.

## Phase 3: Consistency sweep
- [ ] Add `prefers-reduced-motion` guards to every animating component missing one
      (audit: callout, carousel, color-picker, copy-button, dialog, drawer,
      file-input, input, number-input, popover, rating, scroller, select,
      slider, split-panel, tag, textarea, tooltip).
- [ ] Normalize hardcoded durations/easings to the motion tokens.

## Phase 4: Docs, features, verification
- [ ] Rewrite the **Animations guide** (`/guides/animations`): the motion system,
      tokens, standard keyframes, reduced-motion contract, `<fluid-animation>`.
- [ ] `components/animation.mdx` to full standard parity.
- [ ] Update `FEATURES.md` (motion system as a first-class capability) + HANDOFF.
- [ ] `pnpm verify` + `pnpm docs:build` green; Chrome MCP verify dialog/drawer/
      toast/segmented/tabs incl. `prefers-reduced-motion` emulation.

## Status: COMPLETE
- **Phase 0 ✅**: `fluid-animation` moved to core; media is purely media. (`1344895`)
- **Phase 1 ✅**: motion tokens + `internal/motion.ts`. (`d8ea0ca`)
- **Phase 2 ✅**: dialog, drawer, toast, popover, tooltip, accordion enter/exit
  + tabs & segmented-control sliding indicators; dropdown already animated. (`db37b87`)
- **Phase 3 ✅**: carousel autoplay now respects reduced-motion; principled
  scope recorded (auto-motion guarded; color/user-driven transitions don't need
  the guard). (`fix(carousel)`)
- **Phase 4 ✅**: Animations guide rewritten (two layers: component motion +
  `@fluid-ds/animations`), FEATURES motion-system bullet, verified.

The configuration wizard (`configuration-wizard-plan.md`) is the next effort.

### P2 application recipe (per component)
1. `static styles = [motionStyles, reducedMotion, css\`…\`]`.
2. Animate the relevant part on open/close:
   `animation: var(--fluid-<c>-enter-animation, fluid-scale-in)
     calc(var(--fluid-<c>-enter-duration, var(--fluid-duration-normal)) * var(--fluid-motion, 1))
     var(--fluid-<c>-enter-easing, var(--fluid-easing-decelerate)) both;`
   (exit variant on close, using `accelerate`).
3. Annotate the new `--fluid-<c>-enter/exit-animation` tokens with `@cssproperty`.
4. Add a story state if useful; browser-verify open/close + reduced-motion emulation.
