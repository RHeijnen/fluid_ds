# Component & animation hardening roadmap

Generated from an exhaustive multi-agent audit of every Fluid component and the
animation engine (89 agents, 1061 tool calls). Each candidate bug was adversarially
re-verified against the real code before being counted. This document is the
prioritized plan; the P0/P1 bug fixes themselves were applied in the same pass and
land with regression tests.

## What the audit found

| Category            | Count |
| ------------------- | ----- |
| Confirmed bugs      | 54    |
| Test gaps           | 55    |
| Doc gaps            | 21    |
| Future improvements | 17    |

Bug breakdown by kind: correctness (14), a11y (7), phantom-token (7), lifecycle-leak (6), reduced-motion (3), spurious-event (2), target-size (2), tokenization (1), a11y-focus (1), focus-visible (1), wrong-jsdoc (1), dead-condition (1), default-override (1), duplicate-part (1), a11y-name-mismatch (1), theming-token (1), a11y-aria-activedescendant (1), lifecycle (1), convention (1), xss-unsanitized-html (1).

The two dominant, structural classes were **lifecycle leaks** (timers / observers /
animations / fetches started but never torn down, because the `FluidElement` base is
empty and every component hand-rolls its own cleanup) and **phantom tokens** (CSS
custom properties that do not exist in the token set, so themed surfaces silently
render the wrong color).

## Themes

### P0 · Lifecycle & teardown hardening (memory-leak class) _(effort: M)_

The single most dangerous pattern in the audit: observers, animations, fetches, timers and object URLs created in firstUpdated/connectedCallback are never torn down on disconnect. These leak detached DOM, keep CPU work running off-screen, and can write into a shadow root after teardown. Several are tagged [high] (WAAPI never cancelled, scroller ResizeObserver, tree-item MutationObserver, include fetch). Root cause is structural: the empty FluidElement base forces every component to hand-roll cleanup, so the one that forgets leaks silently. Fix the leaks AND remove the class of bug at the base.

- [high] fluid-animation: cancel the WAAPI animation in disconnectedCallback (fluid-animation.ts:92)
- [high] fluid-scroller: disconnect the ResizeObserver created in firstUpdated (fluid-scroller.ts:126)
- [high] fluid-tree-item: disconnect the MutationObserver started in firstUpdated (fluid-tree-item.ts:157)
- [medium] fluid-include: AbortController the fetch and bail if disconnected before writing to shadow DOM (fluid-include.ts:44)
- [low] fluid-code-block: clear the copy-reset setTimeout on disconnect (fluid-code-block.ts:157)
- [low] fluid-dropzone: revoke createObjectURL thumbnails on disconnect, not only on img load (fluid-dropzone.ts:472)
- [low] fluid-celebrate: do not dispatch fluid-celebrate-end after disconnect (fluid-celebrate.ts:159)
- [low] fluid-tour: cancel the applyStep requestAnimationFrame on teardown (fluid-tour.ts:412)
- [low] fluid-file-parser: defer revokeObjectURL until after link.click() completes (fluid-file-parser.ts:280)

### P0 · Phantom & wrong-track token correctness _(effort: M)_

Multiple components, stories, and JSDoc reference CSS custom properties that do not exist in packages/tokens/src/tokens.ts. Confirmed absent: --fluid-color-primary, --fluid-line-height-normal (real: --fluid-font-line-height-normal), --fluid-line-height-tight, --fluid-warning-text, --fluid-color-warning-soft, --fluid-color-danger. A phantom token silently falls through to its var() fallback or to nothing, so themed/branded surfaces render the wrong color (carousel active dot, comparison divider/handle, timeline warning marker). This directly violates the brand-independent status-tone contract in CLAUDE.md. These are mechanical, high-confidence fixes once the canonical token name is substituted.

- [high] fluid-comparison: divider/handle fall back to non-existent --fluid-color-primary; point at the accent track (fluid-comparison.ts:73)
- [medium] fluid-carousel: active pagination dot falls back to phantom --fluid-color-primary (fluid-carousel.ts:124)
- [medium] fluid-badge: success/warning/danger hardcode hex fallbacks instead of semantic tone tracks (fluid-badge.ts:73)
- [medium] fluid-timeline-item: warning marker uses brand --fluid-accent-text instead of theme-independent --fluid-warning-text (fluid-timeline-item.ts:118)
- [medium] fluid-option: selected-option default colors use raw brand palette tokens undefined in dark theme (fluid-option.ts:83)
- [low] fluid-tag: success/warning/danger hardcode hex fallbacks instead of tone tokens (fluid-tag.ts:96)
- [low] phantom --fluid-line-height-normal in fluid-dropzone (172), fluid-list (43), fluid-list-item (89); --fluid-line-height-tight in fluid-loading-overlay (98)
- [medium] page WithBanner story: phantom --fluid-color-warning-soft (fluid-page.stories.ts:46)
- [medium] include ErrorState story: phantom --fluid-color-danger (fluid-include.stories.ts:38)

### P1 · Spurious lifecycle events on mount/update _(effort: S)_

A recurring correctness bug: components fire change/show/hide/toggle events during initial render or on unrelated re-renders, when they should only fire on genuine user-driven state changes. This breaks consumers who wire analytics, form state, or lazy-fetch to these events (e.g. video-playlist fires fluid-change on every update). It is a consistency contract worth fixing as a batch with a shared 'first render guard' idiom.

- [high] fluid-video-playlist: fluid-change dispatched on every update including initial mount (fluid-video-playlist.ts:107)
- [medium] fluid-tabs: fluid-change emitted at mount when auto-selecting first tab (fluid-tabs.ts:123)
- [medium] fluid-segmented-control: fluid-change fired when default value auto-seeded on first render (fluid-segmented-control.ts:141)
- [medium] fluid-popover / fluid-popconfirm: spurious fluid-hide on first render of a closed instance (fluid-popover.ts:132, fluid-popconfirm.ts:240)
- [medium] fluid-details: fluid-toggle fires once on mount for every details, even closed ones (fluid-details.ts:146)

### P1 · Broken/invalid CSS and dead behavior code _(effort: M)_

Several features are simply non-functional due to invalid CSS selectors, dead event handlers, or unwired form semantics. These are user-facing breakage (a Reset button that does nothing, a breadcrumb that always shows a trailing separator) and the docs often promise the working behavior, so they erode trust in the library. All are concrete, isolated fixes.

- [high] fluid-breadcrumb: last-item separator never hidden, ::slotted()::part() is invalid CSS (fluid-breadcrumb.ts:36)
- [high] fluid-form: actions-slot type=reset button is never wired to the form (fluid-form.ts:205)
- [high] fluid-format-bytes: base=binary divides by 1024 but labels output KB/MB instead of KiB/MiB (fluid-format-bytes.ts:41)
- [high] fluid-split-panel: keyboard resize never fires fluid-reposition though drag path and docs promise it (fluid-split-panel.ts:133)
- [medium] fluid-file-input: focus() override targets non-focusable element; handleClick/handleKey are dead code (fluid-file-input.ts:255)
- [low] fluid-empty-state: non-functional .actions:not(:has(_))::slotted(_) selector (fluid-empty-state.ts:75)
- [low] fluid-form: Enter-to-submit guard checks input.type !== 'textarea' which is always true (fluid-form.ts:219)
- [low] fluid-otp: shrinking length does not truncate value, leaving hidden chars in submission (fluid-otp.ts:264)
- [medium] animations/controller: hover/click triggers bind the def once and ignore data-fluid-animation changes (controller.ts:213)

### P0 · Security: markdown XSS sink _(effort: S)_

@fluid-ds/markdown injects marked() output via .innerHTML with no sanitization. This is a direct XSS sink: any consumer rendering user-authored or third-party markdown ships a script-injection vector. It is the only security finding and stands alone at the top of the priority list independent of effort. The package also has zero tests, so the fix must land with a regression suite proving script payloads are neutralized.

- [high] fluid-markdown: sanitize marked output (DOMPurify or marked sanitize hook) before innerHTML injection (fluid-markdown.ts:132)
- Add a sanitization regression test covering <script>, on\* handlers, javascript: URLs, and <img onerror>
- Document the sanitization guarantee (and any escape hatch) on the markdown docs page

### P1 · Accessibility: focus visibility, names, roles & target size _(effort: L)_

A broad set of WCAG 2.2 AA gaps spanning focus management (file-input focus invisible on hidden input, date-range and popconfirm dialogs that do not move/trap focus), accessible names (split-panel separator, meter label override, badge dot color-only status), ARIA contract violations (typeahead activedescendant not aria-selected, carousel/video-playlist tab/listbox patterns missing the APG model), stale ARIA (divider aria-orientation), and sub-24px targets (tag remove button ~12px, number-input steppers). These map directly onto the accessibility and component-authoring skills that are non-negotiable for this repo. Group by surface and burn down per the one-component-per-session migration cadence.

- [high] fluid-file-input: move visible focus to the styled .dropzone label, not the 1px hidden input (fluid-file-input.ts:116)
- [medium] fluid-date-range-picker: move focus into the popover dialog on open (fluid-date-range-picker.ts:291)
- [medium] fluid-popconfirm: alertdialog declares aria-modal=true but does not trap focus (fluid-popconfirm.ts:347)
- [medium] fluid-typeahead: mark the active option aria-selected for the combobox activedescendant contract (fluid-typeahead.ts:744)
- [medium] fluid-carousel & fluid-video-playlist: implement the full APG tab/listbox keyboard model and correct aria-selected (fluid-carousel.ts:316, fluid-video-playlist.ts:145)
- [medium] fluid-event-calendar: implement roving-tabindex grid; chips and +N more must not be independent Tab stops (fluid-event-calendar.ts:535)
- [medium] fluid-split-panel: give the separator an accessible name (fluid-split-panel.ts:161)
- [medium] fluid-meter: stop overriding the slotted label with a generic aria-label 'Meter' (fluid-meter.ts:298)
- [medium] fluid-divider: keep aria-orientation in sync on runtime orientation change (fluid-divider.ts:47)
- [medium] fluid-tag remove button (112) and [low] number-input steppers (382): meet the 24x24 --fluid-target-min floor
- [low] fluid-badge dot mode: provide a text alternative for color-only status (fluid-badge.ts:106)
- [low] fluid-rating: add aria-valuetext alongside the numeric aria-valuenow (fluid-rating.ts:196)

### P1 · Reduced-motion compliance _(effort: S)_

prefers-reduced-motion is honored inconsistently. Autoplaying/looping animations (fluid-animation autoplay, spinner, button loading spinner) keep moving under the reduced-motion setting, and several fade/scale transitions and the popover transition ignore the --fluid-motion opt-out scalar that popconfirm already respects. This is both a WCAG 2.3.3 concern and a vestibular-safety issue. There is a clear existing convention (--fluid-motion scalar) to standardize on, which makes this a consistency pass rather than novel work.

- [medium] fluid-animation: gate autoplay on prefers-reduced-motion (fluid-animation.ts:86)
- [low] fluid-spinner: reduced-motion guard only slows the spin; it should stop rotating (fluid-spinner.ts:58)
- [low] fluid-button: loading spinner keeps spinning under reduced motion (fluid-button.ts:507)
- [low] fluid-popover: route its transition through the --fluid-motion scalar like popconfirm (fluid-popover.ts:79)
- [low] add reduced-motion guards to image fade-in, loading-overlay fade, progress-bar indeterminate, and rating hover-scale

### P1 · Testing infrastructure & missing coverage _(effort: L)_

Whole packages and many behavior components ship with no test file at all (charts has zero tests anywhere; markdown, scroller, split-panel, carousel, code-block, comparison, include, the format-\* trio, and the standalone observer wrappers all lack tests; media and animations controller/registry are largely untested). Two distinct gaps compound the lifecycle theme: there is almost no regression coverage proving observers/timers/listeners are torn down on disconnect, and almost none proving events are NOT emitted on mount. Without these, the P0 leak fixes and the spurious-event fixes will silently regress. Prioritize disconnect-cleanup and spurious-event regression tests alongside their fixes; backfill bare missing-test-file gaps as a sustained P2 effort.

- [high] @fluid-ds/charts: stand up a test file/harness (zero tests exist) (charts/src/index.ts:1)
- [medium] add missing test files: carousel, code-block, comparison, include, intersection-observer, mutation-observer, resize-observer, relative-time, scroller, split-panel, format-bytes/-date/-number, markdown, media video/video-playlist/zoomable-frame
- [medium] disconnect-cleanup regression tests landing WITH the leak fixes: animation, tree-item, scroller, popover, dropdown, form, plus tooltip/time-picker/speed-dial/menu listener+autoUpdate teardown
- [medium] spurious-event regression tests landing WITH those fixes: tabs (no fluid-change on auto-select), video-playlist, segmented-control, popover/popconfirm fluid-hide, details
- [medium] keyboard/grid contract tests: file-input keyboard activation, event-calendar roving grid
- [low] reduced-motion regression tests for animation, spinner, image, loading-overlay, progress-bar, rating, and the animations controller 0ms collapse
- [low] event-emission and drag-path coverage: slider fluid-change, scheduler fluid-range-change, map fluid-move + teardown, kanban pointer drag path, animations emojiFountain/bubbles in the API matrix

### P2 · Documentation accuracy (doc-vs-code mismatches & annotation gaps) _(effort: M)_

Docs make several false or stale claims the code does not back: format-bytes promising IEC units it never renders, form claiming type=reset works natively, carousel claiming focus-pause, breadcrumb-item comment claiming a separator removal that never happens, divider docs referencing a part that does not exist. Separately, @uses-token / @cssproperty JSDoc annotations are wrong or missing across comparison, option, tag, grid, chart, map, and zoomable-frame, and several docs theming examples (markdown, qr, comparison) demo the phantom --fluid-color-primary. Because FEATURES.md and the landing page are generated from docs, inaccurate component docs propagate into marketing. Fix the false claims first, then sweep the annotation/phantom-token-in-example gaps once the token fixes land.

- [high] format-bytes docs: stop promising KiB/MiB until the component renders them (resolve jointly with the format-bytes bug) (format-bytes.mdx:63)
- [medium] form docs: correct the 'type=reset behaves natively' claim (form.mdx:273)
- [low] carousel docs: autoplay pauses on hover only, not focus (carousel.mdx:246)
- [low] breadcrumb-item: remove stale comment claiming parent strips the last separator (breadcrumb-item.ts:88)
- [low] divider docs: remove part='base'/::part(base) references; divider exposes no part (divider.mdx:110)
- [medium] fix phantom --fluid-color-primary in markdown.mdx (46), qr.mdx (190), comparison.mdx (202) theming examples
- [medium] map docs: correct the CSS-module import claim (Leaflet CSS is CDN-injected) (map.mdx:16)
- [medium] sparkline docs: example uses a non-existent data attribute, fails to compile (charts.mdx:62)
- [low] annotation fixes: comparison @uses-token phantom (30), option missing @uses-token (24), tag missing brand-token annotation (45), grid annotation/fallback gap (29), chart brand range mismatch 200-900 vs documented 300-800 (72), map tone-pin tokens (246), zoomable-frame --fluid-shadow-sm (76)
- [low] coverage gaps: file-input docs lack an a11y section; media docs omit active-accent token + video-playlist example; charts stories omit scatter/bubble/radar/polar-area; animations gallery omits emojiFountain/bubbles

### P0 · NET-NEW: managed-cleanup primitive on FluidElement _(effort: M)_

The audit names this seven times and it is the structural root of the entire P0 lifecycle theme: FluidElement is literally `class FluidElement extends LitElement {}`, so every behavior component re-implements teardown by hand and at least three forgot (animation, scroller, tree-item). A shared registry on the base class turns an error-prone manual discipline into a default. The base class JSDoc already states its purpose is 'add cross-cutting behavior in one place' so this is the intended evolution.

- Add a disposer registry to FluidElement: e.g. addCleanup(fn) / a tracked AbortController exposed as this.cleanupSignal, with a single disconnectedCallback that drains it
- Provide thin helpers for the common cases: observe(observer, target, opts), setManagedTimeout, listenOn(target,type,fn) that auto-remove, and a managed createObjectURL that revokes on disconnect
- Migrate the confirmed leakers first (animation, scroller, tree-item, include) onto the primitive as the reference implementations
- Convert the media (video/video-playlist/animated-image) and charts components from raw LitElement to FluidElement so they inherit teardown (also closes the base-class-convention findings)
- Note: changedProperties-in-updated churn (number-input refreshValidity every cycle, avatar no-op willUpdate) are adjacent base-class hygiene items to fold in

### P1 · NET-NEW: build-time phantom-token & annotation validator _(effort: M)_

At least nine phantom-token findings and several @uses-token/@cssproperty mismatches exist because nothing checks that a referenced --fluid-\* custom property actually exists in tokens.ts, or that JSDoc token annotations match the CSS the component reads. The repo already has a check:coverage gate (scripts/check-component-coverage.mjs) wired into pnpm verify, so there is a proven pattern to extend. A validator makes this entire bug class non-recurring instead of re-auditing by hand.

- Add scripts/check-tokens.mjs: parse tokens.ts into the set of real --fluid-_ names, scan component CSS + stories + mdx for var(--fluid-_) references, fail on any name not in the set (allowing documented component-scoped tokens)
- Cross-check @uses-token / @cssproperty JSDoc against the custom properties actually read in each component's CSS and flag drift (covers chart 200-900, comparison, option, tag, grid, map, zoomable-frame)
- Seed an allowlist from the real token names so --fluid-font-line-height-normal passes and --fluid-line-height-normal fails
- Wire it into pnpm verify alongside check:coverage so CI blocks new phantom tokens

### P2 · NET-NEW: reduced-motion lint/convention enforcement _(effort: S)_

Reduced-motion compliance is applied ad hoc: some components honor --fluid-motion, some honor prefers-reduced-motion, several honor neither, and the autoplaying ones are the worst offenders. A shared motion utility plus a lint check would make 'every animation/transition routes through the motion opt-out' an enforced invariant rather than a per-component judgement call, preventing the spinner/button/animation-style regressions from recurring.

- Provide a shared motion helper/mixin (a reducedMotion getter + a standard @media (prefers-reduced-motion: reduce) css fragment) that components compose instead of re-deriving
- Standardize on the --fluid-motion scalar already used by popconfirm; document it as the single opt-out in the component-authoring skill
- Add a lint/static check that flags @keyframes / animation / transition declarations in a fluid-\* component that are not paired with a reduced-motion guard or the --fluid-motion scalar
- Backfill the offenders identified in the reduced-motion theme as the first consumers

### P2 · NET-NEW: deprecated-ARIA & APG-pattern conformance audit _(effort: M)_

Beyond individual a11y bugs, two systemic ARIA issues recur: deprecated attributes (kanban uses aria-grabbed, removed from ARIA 1.2) and partial APG-pattern implementations where a role is applied without its required keyboard model and selection state (carousel tabs, video-playlist/event-calendar listbox/grid, typeahead combobox). A one-time conformance pass plus a small lint rule for known-deprecated ARIA attributes prevents shipping roles that screen readers announce but cannot operate.

- Replace deprecated aria-grabbed in kanban with a supported drag-state mechanism (kanban.ts:354)
- Audit every component that applies a composite role (tab/tablist, listbox/option, grid, combobox, menu, tree) against its APG keyboard + selection contract and file the gaps
- Add a lint rule flagging deprecated ARIA attributes (aria-grabbed, aria-dropeffect) in templates
- Capture the APG keyboard-model expectations as reusable test helpers so new composite-widget components inherit the contract tests

## Net-new infrastructure (prevent the whole class)

These are not single-component fixes but systemic guards that stop the recurring
patterns from coming back:

1. **✅ DONE, teardown helpers on `FluidElement`.** `registerCleanup(fn)`,
   `listen(target, type, handler)` (auto-removed on disconnect), and a
   `disconnectSignal` `AbortSignal`, all run/aborted in the base
   `disconnectedCallback`. Opt-in and additive (a non-adopting component behaves
   like a plain `LitElement`). See `packages/components/src/internal/base-element.ts`
   - its test. Removes the leak class at the root: a component no longer has to
     remember to mirror every side effect in teardown.
2. **✅ DONE, build-time phantom-token validator.** `pnpm check:tokens`
   (`scripts/check-tokens.mjs`, wired into `pnpm verify`) fails the build on any
   `var(--fluid-*)` / `getPropertyValue` reference that does not resolve to a real
   token. Primitive/semantic namespaces (`--fluid-color-*`, `--fluid-line-height-*`,
   ...) must always resolve; component knobs only when referenced bare. Caught four
   more phantoms the fix sweep had missed.
3. **A reduced-motion lint / test helper.** A shared test utility that mounts each
   component under a stubbed `prefers-reduced-motion: reduce` and asserts no infinite
   animation or autoplay timer is running, wired into the coverage gate. (Still TODO.)
4. **✅ DONE, a first-render event guard.** `FluidElement.changedAfterFirstRender(
changed, key)` returns true only on a genuine value change, not at mount, so
   components emit `fluid-change`/`fluid-toggle`/`fluid-hide` only on real
   transitions. The audit's six spurious-mount-event bugs were fixed individually;
   new/migrated components should use this helper. (Incremental migration of the
   existing call sites is the remaining follow-up.)

## Appendix: confirmed bugs by severity

### high (2)

- **fluid-file-input** (focus-visible): Keyboard focus is invisible: focus lands on the 1px hidden <input>, not the styled .dropzone label `packages/components/src/components/file-input/fluid-file-input.ts:116`
- **fluid-markdown** (xss-unsanitized-html): marked output injected via .innerHTML with no sanitization (XSS sink) `packages/markdown/src/fluid-markdown.ts:132`

### medium (27)

- **animations/controller** (correctness): hover/click triggers bind the animation def once and never update when data-fluid-animation changes `packages/animations/src/controller.ts:213`
- **carousel** (phantom-token): Active pagination dot falls back to phantom --fluid-color-primary `packages/components/src/components/carousel/fluid-carousel.ts:124`
- **carousel** (a11y): Pagination dots use tab/tablist role but lack the APG tab contract `packages/components/src/components/carousel/fluid-carousel.ts:316`
- **comparison** (phantom-token): Divider and handle fall back to the non-existent --fluid-color-primary token `packages/components/src/components/comparison/fluid-comparison.ts:73`
- **fluid-animation** (lifecycle-leak): WAAPI animation is never cancelled on disconnect (keeps running after element leaves DOM) `packages/components/src/components/animation/fluid-animation.ts:92`
- **fluid-animation** (reduced-motion): Autoplay animation does not honor prefers-reduced-motion `packages/components/src/components/animation/fluid-animation.ts:86`
- **fluid-badge** (a11y): Dot-only badge conveys status by color alone with no text alternative `packages/components/src/components/badge/fluid-badge.ts:106`
- **fluid-button** (reduced-motion): Loading spinner keeps spinning under prefers-reduced-motion `packages/components/src/components/button/fluid-button.ts:507`
- **fluid-date-range-picker** (a11y-focus): Opening the range popover does not move focus into the dialog `packages/components/src/components/date-range-picker/fluid-date-range-picker.ts:291`
- **fluid-divider** (a11y): aria-orientation goes stale when orientation changes at runtime `packages/components/src/components/divider/fluid-divider.ts:47`
- **fluid-event-calendar** (a11y): Event chips and "+N more" inside grid cells are independent Tab stops, breaking the documented roving-tabindex grid contract `packages/calendar/src/components/event-calendar/fluid-event-calendar.ts:535`
- **fluid-form** (correctness): Reset button in the actions slot does nothing: light-DOM type="reset" is never wired to the form `packages/components/src/components/form/fluid-form.ts:205`
- **fluid-format-bytes** (correctness): base="binary" divides by 1024 but mislabels output with SI/decimal unit names (KB/MB, never KiB/MiB) `packages/components/src/components/format-bytes/fluid-format-bytes.ts:41`
- **fluid-popconfirm** (a11y): alertdialog declares aria-modal=true but does not trap focus `packages/components/src/components/popconfirm/fluid-popconfirm.ts:347`
- **fluid-popover** (correctness): Spurious fluid-hide fires on first render of a closed popover `packages/components/src/components/popover/fluid-popover.ts:132`
- **fluid-scroller** (lifecycle-leak): ResizeObserver created in firstUpdated is never disconnected `packages/components/src/components/scroller/fluid-scroller.ts:126`
- **fluid-segmented-control** (correctness): Spurious fluid-change fired when the default value is auto-seeded on first render `packages/components/src/components/segmented-control/fluid-segmented-control.ts:141`
- **fluid-spinner** (reduced-motion): Reduced-motion guard only slows the infinite spin, it never stops rotating `packages/components/src/components/spinner/fluid-spinner.ts:58`
- **fluid-split-panel** (correctness): Keyboard resize updates position but never fires fluid-reposition (drag path does, docs promise both) `packages/components/src/components/split-panel/fluid-split-panel.ts:133`
- **fluid-split-panel** (a11y): Separator divider has no accessible name `packages/components/src/components/split-panel/fluid-split-panel.ts:161`
- **fluid-tabs** (spurious-event): Uncontrolled <fluid-tabs> emits a fluid-change at mount when it auto-selects the first tab `packages/components/src/components/tabs/fluid-tabs.ts:123`
- **fluid-tag** (target-size): Remove button hit target is ~12px, far below the 24x24 AA minimum (SC 2.5.8) `packages/components/src/components/tag/fluid-tag.ts:112`
- **fluid-timeline-item** (correctness): Warning-tone marker icon color uses brand-retuned --fluid-accent-text instead of theme-independent --fluid-warning-text `packages/components/src/components/timeline/fluid-timeline-item.ts:118`
- **fluid-typeahead** (a11y-aria-activedescendant): Active (keyboard-highlighted) option is not marked aria-selected, breaking the APG combobox active-descendant contract `packages/components/src/components/typeahead/fluid-typeahead.ts:744`
- **fluid-video-playlist** (a11y): listbox/option pattern uses aria-current instead of aria-selected and lacks APG keyboard model `packages/media/src/components/video-playlist/fluid-video-playlist.ts:145`
- **include** (lifecycle-leak): Async fetch in fluid-include is not aborted on disconnect and writes into the shadow DOM after teardown `packages/components/src/components/include/fluid-include.ts:44`
- **input** (default-override): fluid-input forces autocomplete="off" by default, overriding browser/password-manager behavior `packages/components/src/components/input/fluid-input.ts:475`

### low (25)

- **animations/effects** (correctness): observedAttributes omits origin/cannons/shells/rate/duration/spread so live changes to them are not reflected under auto `packages/animations/src/effects/fluid-celebrate.ts:71`
- **animations/effects** (lifecycle): fire() dispatches fluid-celebrate-end even after the element has been disconnected `packages/animations/src/effects/fluid-celebrate.ts:159`
- **code-block** (lifecycle-leak): Copy-reset setTimeout is never cleared on disconnect `packages/components/src/components/code-block/fluid-code-block.ts:157`
- **fluid-badge** (tokenization): Success/warning/danger variants hardcode hex fallbacks instead of the semantic color tracks `packages/components/src/components/badge/fluid-badge.ts:73`
- **fluid-breadcrumb** (correctness): Last-item separator is never hidden: ::slotted()::part() is invalid CSS `packages/components/src/components/breadcrumb/fluid-breadcrumb.ts:36`
- **fluid-details** (spurious-event): fluid-toggle fires once on initial mount for every details (even closed ones) `packages/components/src/components/accordion/fluid-details.ts:146`
- **fluid-dropzone** (phantom-token): Phantom CSS token --fluid-line-height-normal (real token is --fluid-font-line-height-normal) `packages/components/src/components/dropzone/fluid-dropzone.ts:172`
- **fluid-dropzone** (lifecycle-leak): createObjectURL thumbnail can leak: revoked only on img load, never on disconnect `packages/components/src/components/dropzone/fluid-dropzone.ts:472`
- **fluid-empty-state** (correctness): Non-functional CSS selector: .actions:not(:has(_))::slotted(_) `packages/components/src/components/empty-state/fluid-empty-state.ts:75`
- **fluid-file-input** (correctness): focus() override targets a non-focusable element; handleClick/handleKey are dead code `packages/components/src/components/file-input/fluid-file-input.ts:255`
- **fluid-form** (dead-condition): Enter-to-submit guard checks input.type !== "textarea", which is always true `packages/components/src/components/form/fluid-form.ts:219`
- **fluid-format-bytes** (wrong-jsdoc): JSDoc on the `unit` property describes the `base` property `packages/components/src/components/format-bytes/fluid-format-bytes.ts:25`
- **fluid-list** (phantom-token): fluid-list uses phantom token --fluid-line-height-normal (real token is --fluid-font-line-height-normal) `packages/components/src/components/list/fluid-list.ts:43`
- **fluid-list-item** (phantom-token): fluid-list-item uses phantom token --fluid-line-height-normal `packages/components/src/components/list/fluid-list-item.ts:89`
- **fluid-loading-overlay** (phantom-token): fluid-loading-overlay uses phantom token --fluid-line-height-tight `packages/components/src/components/loading-overlay/fluid-loading-overlay.ts:98`
- **fluid-meter** (a11y-name-mismatch): Visible slotted meter label is overridden by a generic aria-label "Meter" `packages/components/src/components/meter/fluid-meter.ts:298`
- **fluid-option** (theming-token): Selected-option default colors use raw brand palette tokens undefined in the dark theme `packages/components/src/components/select/fluid-option.ts:83`
- **fluid-popconfirm** (correctness): Spurious fluid-hide fires on first render of a closed popconfirm `packages/components/src/components/popconfirm/fluid-popconfirm.ts:240`
- **fluid-tree-item** (lifecycle-leak): MutationObserver started in firstUpdated is never disconnected (leaks after removal) `packages/components/src/components/tree/fluid-tree-item.ts:157`
- **fluid-video-playlist** (correctness): fluid-change dispatched on every update, including initial mount and unrelated re-renders `packages/media/src/components/video-playlist/fluid-video-playlist.ts:107`
- **fluid-video-playlist** (convention): media components extend LitElement directly instead of FluidElement `packages/media/src/components/video-playlist/fluid-video-playlist.ts:35`
- **image** (duplicate-part): fluid-image exposes part="img" on two different elements `packages/components/src/components/image/fluid-image.ts:178`
- **number-input** (target-size): Stepper buttons fall below the 24x24 target floor the component otherwise enforces `packages/components/src/components/number-input/fluid-number-input.ts:382`
- **otp** (correctness): Shrinking `length` does not truncate `value`, leaving hidden extra characters in the submitted value `packages/components/src/components/otp/fluid-otp.ts:264`
- **page** (phantom-token): WithBanner story uses phantom token --fluid-color-warning-soft `packages/components/src/components/page/fluid-page.stories.ts:46`
