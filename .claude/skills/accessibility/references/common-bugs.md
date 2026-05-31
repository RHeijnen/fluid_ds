# Common accessibility bugs: grep-friendly catalog

Flat catalog of frequent a11y defects in component-library code. Use it as a checklist when reviewing a PR or a component file. Each item maps to a primary success criterion and a verifiable code pattern. Numbers in brackets are WCAG 2.2 success criteria. `[NEW in 2.2]` marks criteria added since 2.1.

Primary sources:
- WCAG 2.2 normative text: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/
- APG patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- APG keyboard interface: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/

When a row points to a specific SC or APG pattern, fetch the primary URL before quoting wording, the brief did not verbatim-verify every SC below.

---

## 1. Semantics & roles

- **Div used as button**
  - What it breaks: 4.1.2 Name, Role, Value; 2.1.1 Keyboard.
  - Spot: `<div onclick`, `<span @click`, `<div class="*-button"` without `role` or `tabindex`.
  - Fix: use `<button type="button">`, or add `role="button" tabindex="0"` plus Enter/Space handlers AND a `:focus-visible` style.
  - Why: native `<button>` ships role, focusability, keyboard activation, and forms wiring for free; a div ships none of them.

- **Anchor used as action trigger**
  - What it breaks: 4.1.2; 2.1.1.
  - Spot: `<a href="#" @click` or `<a role="button">` that runs JS and never navigates.
  - Fix: `<button type="button">` for actions; reserve `<a href>` for navigation.
  - Why: anchors announce as "link", do not respond to Space, and pollute browser history with `#`.

- **Missing `type="button"` inside a form**
  - What it breaks: 3.2.2 On Input (unexpected submit).
  - Spot: `<button>` inside `<form>` with no `type` attribute.
  - Fix: every non-submit button gets `type="button"`. Make the convention component-level in `FluidElement`.
  - Why: HTML defaults `<button>` to `type="submit"`; Enter on any field then triggers the wrong button.

- **Custom checkbox without role + state**
  - What it breaks: 4.1.2; 1.3.1 Info and Relationships.
  - Spot: `class="checkbox"` with `aria-checked` missing, or `role="checkbox"` without `aria-checked`, or relying on `checked` attribute alone on a non-input element.
  - Fix: wrap a real `<input type="checkbox">` inside the shadow root (FACE), OR set `role="checkbox" aria-checked="true|false|mixed" tabindex="0"` with Space toggling.
  - Why: AT needs the role to announce "checkbox" and the state to announce checked/unchecked.

- **Custom radio without group semantics**
  - What it breaks: 1.3.1; 4.1.2. APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
  - Spot: a list of buttons sharing a `name` but no `role="radiogroup"` container, or roving tabindex missing.
  - Fix: `role="radiogroup"` (with `aria-labelledby`) wrapping items with `role="radio" aria-checked`; arrow keys move selection.
  - Why: a radio is meaningless without its group; AT needs the relationship to announce "1 of 3".

- **Switch announced as checkbox or button**
  - What it breaks: 4.1.2. APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
  - Spot: `<button aria-pressed>` claiming to be a switch, or visual switch with `role="checkbox"`.
  - Fix: `role="switch" aria-checked="true|false"` on the interactive element. Do not use `aria-pressed` for switches.
  - Why: switches are on/off; aria-pressed is for toggle buttons (e.g. Bold in a toolbar) and mixes the semantics.

- **Toast role mismatch (status vs alert)**
  - What it breaks: 4.1.3 Status Messages.
  - Spot: every toast uses `role="alert"` regardless of severity; or success toasts use `role="alert"` and interrupt SR users.
  - Fix: `role="status"` (polite) for informational toasts, `role="alert"` only for errors/time-critical. Region must exist in DOM before content arrives.
  - Why: `role="alert"` interrupts the current SR utterance; over-using it trains users to dismiss.

- **`role="presentation"` / `role="none"` on something semantic**
  - What it breaks: 1.3.1; 4.1.2.
  - Spot: `role="presentation"` on `<table>` carrying data, on `<ul>` used for navigation, or on a focusable element.
  - Fix: remove the role; if the element has descendants with required-owned roles or is focusable, the role is ignored anyway and the markup is misleading.
  - Why: presentation strips semantics: fine for layout tables, harmful on real structure.

- **Heading level skip / heading used for styling**
  - What it breaks: 1.3.1; 2.4.6 Headings and Labels.
  - Spot: `<h4>` directly under `<h1>`; `<h3>` chosen because "it looks the right size".
  - Fix: levels reflect outline. Components that render headings (Card, Section, Dialog) should accept a `headingLevel` prop, not hardcode.
  - Why: SR users navigate by heading level and infer page structure from it.

- **Landmark missing or duplicated**
  - What it breaks: 1.3.1; 2.4.1 Bypass Blocks. APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
  - Spot: page with two `<nav>` and no `aria-label`; no `<main>`; `role="banner"` inside `<main>`.
  - Fix: one `<main>`; label duplicated landmarks (`aria-label="Primary"` vs `"Footer"`); top-level `<header>`/`<footer>` are banner/contentinfo only when not nested.
  - Why: landmark navigation only works when each region is unique and named.

- **List markup faked with `<div>`**
  - What it breaks: 1.3.1.
  - Spot: `<div class="list">` containing repeated child cards with no list semantics.
  - Fix: `<ul>`/`<ol>` + `<li>`, or `role="list"`/`role="listitem"` if styling forces divs.
  - Why: VoiceOver announces "list, 7 items": vital for understanding scope; divs are silent.

- **Table without header association**
  - What it breaks: 1.3.1.
  - Spot: `<table>` with `<td>` only, no `<th>` / `scope`; or `role="table"` without `role="rowheader"`/`columnheader`.
  - Fix: `<th scope="col">` / `scope="row">`; for complex headers, `headers="id1 id2"`.
  - Why: SR users hear the column header reannounced on each cell only when scope is set.

- **Icon font / decorative SVG announced as text**
  - What it breaks: 1.1.1 Non-text Content.
  - Spot: `<i class="icon-chevron">`, `<svg>` without `aria-hidden`, or `<svg>` containing `<title>` that is purely decorative.
  - Fix: decorative icons: `aria-hidden="true"` and remove `<title>`. Meaningful icons: `role="img" aria-label="…"`.
  - Why: a decorative chevron read aloud as "chevron right" is noise.

- **Disclosure / accordion missing button semantics**
  - What it breaks: 4.1.2; 2.1.1. APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
  - Spot: `<div class="accordion-header" @click>` with `aria-expanded` but no role or tabindex.
  - Fix: the toggle is a `<button aria-expanded aria-controls>`; the panel is its `id` target.
  - Why: SR users need "button, expanded": the click-div gives them nothing.

---

## 2. Keyboard

- **Esc does not dismiss modal / popover / menu**
  - What it breaks: 2.1.1; APG Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - Spot: dialog/menu/popover with no `keydown` handler for `Escape`, or one bound to a child that has no focus.
  - Fix: bind Escape at the overlay/host; close and return focus to the trigger.
  - Why: Escape is the universally expected dismiss key for transient overlays.

- **Arrow keys do not navigate composite widget**
  - What it breaks: 2.1.1. APG keyboard interface: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
  - Spot: Tabs, Menu, Listbox, Radiogroup, Toolbar, Tree, Grid where every item has `tabindex="0"` and Tab walks through each one.
  - Fix: roving tabindex (exactly one item `tabindex="0"`, others `-1`, arrow keys move focus and swap) OR `aria-activedescendant`.
  - Why: APG cross-cutting rule: Tab moves between widgets, arrow keys move within. Walking 12 tabs with Tab is a failure.

- **Enter / Space do not activate custom button**
  - What it breaks: 2.1.1; 4.1.2.
  - Spot: `role="button"` on a div with only a `click` handler.
  - Fix: also handle `keydown` for `Enter` (activate immediately) and `Space` (activate on keyup; prevent page scroll on keydown).
  - Why: native buttons get both for free; a custom one must replicate both.

- **Positive `tabindex`**
  - What it breaks: 2.4.3 Focus Order.
  - Spot regex: `tabindex="[1-9]`.
  - Fix: use `tabindex="0"` to add to natural order, `-1` for programmatic-only, and rearrange DOM for order. Never positive.
  - Why: positive values create a parallel focus order that diverges from DOM and is impossible to maintain.

- **Focus trap missing in modal dialog**
  - What it breaks: 2.4.3; APG Dialog (Modal).
  - Spot: `role="dialog"`/`aria-modal="true"` but Tab leaks to the page behind.
  - Fix: cycle focus among focusables inside the dialog; combine with `inert` on the rest of the document.
  - Why: keyboard users escape to invisible controls and lose place; SR users hear background content that should be hidden.

- **Tab order out of DOM order**
  - What it breaks: 2.4.3; 1.3.2 Meaningful Sequence.
  - Spot: CSS `order:` / `flex-direction: row-reverse` / `grid-area` reflowing visual order without changing DOM; `tabindex` patching the result.
  - Fix: change DOM order to match visual order; do not patch with tabindex.
  - Why: the SC requires focus order to preserve meaning: visual mismatch confuses sighted keyboard users and SR users alike.

- **Sub-menu does not open on ArrowRight / close on ArrowLeft**
  - What it breaks: 2.1.1; APG Menu and Menubar: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
  - Spot: menu component handles only Enter for open; arrow keys move focus past the submenu.
  - Fix: implement the APG menubar key map (ArrowRight/Left open/close submenus, ArrowDown/Up move within).
  - Why: users who already know the menu pattern expect it everywhere; deviating breaks their muscle memory.

- **Combobox missing required keys**
  - What it breaks: 2.1.1; APG Combobox: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  - Spot: combobox where ArrowDown does not open the listbox, or Enter selects without closing, or Escape does not clear/close.
  - Fix: re-read APG Combobox key map before implementing; keys depend on `aria-autocomplete` value.
  - Why: combobox is the most-cited APG pattern and has the most variations; do not improvise from memory.

---

## 3. Focus

- **`outline: none` without replacement (F78)**
  - What it breaks: 2.4.7 Focus Visible.
  - Spot regex: `outline\s*:\s*(0|none)` without nearby `:focus-visible` rule.
  - Fix: never remove the outline globally; if you must, replace with a `:focus-visible` ring with ≥3:1 contrast against adjacent colors (1.4.11).
  - Why: keyboard users lose track of focus entirely; F78 is a named failure technique.

- **Focus indicator obscured by sticky header / sticky footer**
  - What it breaks: 2.4.11 Focus Not Obscured (Minimum) `[NEW in 2.2]`. https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
  - Spot: sticky `<header>` / `<footer>` / sticky table headers; check that focused links/buttons still have part of their indicator visible after scroll.
  - Fix: `scroll-padding-top: <header-height>;` on the scroll container; or trigger `scrollIntoView({ block: 'center' })` on focus.
  - Why: 2.2 requires the focused control not be entirely hidden by author content.

- **Focus not returned to trigger after dialog close**
  - What it breaks: 2.4.3.
  - Spot: dialog close handler that does not call `trigger.focus()`; common in toast undo, popover dismiss, drawer close.
  - Fix: remember the activating element on open; refocus it on close (unless it no longer exists, then focus a stable ancestor).
  - Why: keyboard users land on `<body>` and lose all context.

- **Skip link not visible on focus**
  - What it breaks: 2.4.1 Bypass Blocks; 2.4.7.
  - Spot: `.skip-link { position: absolute; left: -9999px }` with no `:focus`/`:focus-visible` rule pulling it back on screen.
  - Fix: on `:focus`, make the link visible and positioned in the viewport with adequate contrast.
  - Why: invisibly-focused links are useless to sighted keyboard users; they cannot confirm they hit the right thing.

- **`:focus { outline: none }` killing `:focus-visible`**
  - What it breaks: 2.4.7.
  - Spot: bare `:focus { outline: none }` with no compensating `:focus-visible` ring.
  - Fix: only style `:focus-visible`; leave `:focus` alone, or use `:focus:not(:focus-visible) { outline: none }`.
  - Why: `:focus` matches even for keyboard activation, so removing its outline kills the keyboard indicator.

- **Modal does not make background inert**
  - What it breaks: 2.4.3; 4.1.2.
  - Spot: dialog open without `inert` (or polyfilled equivalent) on the rest of the page; Tab leaks; SR users can navigate hidden content.
  - Fix: use the `inert` attribute on the document tree outside the dialog; remove on close.
  - Why: `inert` removes elements from the focus order AND from the AT tree atomically.

- **`autofocus` on a destructive control**
  - What it breaks: 3.2.5 Change on Request (industry pattern, not a hard SC).
  - Spot: `autofocus` on a "Delete" button or on a confirmation dialog's primary action.
  - Fix: focus the dialog container (or a safe element like the heading / cancel button); let users opt in.
  - Why: accidental Enter destroys data.

- **Focus visible only via `box-shadow` on transparent backgrounds**
  - What it breaks: 1.4.11 Non-text Contrast.
  - Spot: `box-shadow: 0 0 0 2px var(--ring)` where `--ring` is a semi-transparent color on a busy background.
  - Fix: combine an `outline` with an offset, OR a solid color shadow plus a contrasting inner ring; measure ≥3:1 against adjacent colors.
  - Why: a 30% alpha glow can drop below 3:1 over light content and disappear.

---

## 4. Names & labels

- **Icon-only button without accessible name**
  - What it breaks: 1.1.1; 4.1.2.
  - Spot: `<button><svg/></button>` with no `aria-label`, no visually hidden text, no `aria-labelledby`.
  - Fix: `aria-label="Close"` on the button, or visually-hidden text node, plus `aria-hidden="true"` on the inner SVG.
  - Why: SR users hear "button" with no context.

- **`aria-label` overriding visible text (Label in Name)**
  - What it breaks: 2.5.3 Label in Name.
  - Spot: visible "Submit" text inside the button but `aria-label="Send form"`.
  - Fix: the accessible name must contain the visible text; either drop the `aria-label` or include the visible string in it.
  - Why: voice-control users say what they see; if the name does not contain that string, "click Submit" fails.

- **Tooltip as the only accessible name**
  - What it breaks: 4.1.2; 2.5.3; APG Tooltip: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  - Spot: icon button with `aria-describedby="tooltip-id"` but no `aria-label`.
  - Fix: name the control with `aria-label`; the tooltip is the description, not the name.
  - Why: tooltips are supplemental; many AT/touch users never see them.

- **Form input with no programmatic label**
  - What it breaks: 1.3.1; 3.3.2 Labels or Instructions; 4.1.2.
  - Spot: `<input>` whose `<label>` is a sibling with no `for=`; or label text rendered in a div nearby.
  - Fix: `<label for="id">` + matching `id`, OR `<label>…<input></label>`, OR `aria-labelledby`.
  - Why: clicking the visual label must focus the input AND SR must announce the label on focus.

- **Required indicated only by `*` glyph**
  - What it breaks: 3.3.2; 1.3.3 Sensory Characteristics.
  - Spot: `<label>Email *</label>` with no `aria-required` / `required` and no legend explaining "*".
  - Fix: native `required` (and/or `aria-required="true"`), visible "required" wording or a documented legend, and contrast on the glyph.
  - Why: not all SR settings announce "*"; users with low vision may miss the glyph entirely.

- **Error text not linked via `aria-describedby`**
  - What it breaks: 3.3.1 Error Identification; 1.3.1.
  - Spot: error message rendered next to input with no `aria-describedby` from input → error id; or `aria-invalid` missing.
  - Fix: `aria-describedby="err-id"` on the input pointing at the error element; `aria-invalid="true"` when error is present.
  - Why: SR users focus the field and need the error announced inline, not as a separate landmark visit.

- **Placeholder used as label**
  - What it breaks: 3.3.2; 1.4.3 (placeholders typically fail contrast); 1.3.1.
  - Spot: `<input placeholder="Email">` with no label.
  - Fix: a visible persistent label outside the input; placeholder is example data, optional.
  - Why: placeholder disappears on typing; users who needed it lose the cue mid-task.

- **`title` attribute used as label**
  - What it breaks: 4.1.2; 2.5.3.
  - Spot: `<input title="Search">` with no other label.
  - Fix: real `<label>`. `title` is keyboard-inaccessible on most platforms and not exposed reliably.
  - Why: relying on `title` for naming is a documented failure pattern.

---

## 5. Color & contrast

- **Body text below 4.5:1**
  - What it breaks: 1.4.3 Contrast (Minimum). https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
  - Spot: muted text tokens like `--text-secondary` paired with `--surface-1`; placeholder text; ghost button labels.
  - Fix: 4.5:1 for normal text, 3:1 for ≥18pt (24px) or ≥14pt (18.66px) bold.
  - Why: WCAG AA threshold; disabled controls are exempt but "muted" is not.

- **Focus ring below 3:1 against background**
  - What it breaks: 1.4.11 Non-text Contrast. https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
  - Spot: blue focus ring on a blue button; white ring on a light page.
  - Fix: pick a ring color that hits 3:1 against BOTH the component and the page; or use an outer + inner two-color ring.
  - Why: a focus indicator you cannot see is not a focus indicator.

- **Color as the only differentiator**
  - What it breaks: 1.4.1 Use of Color.
  - Spot: required field marked only red; chart series distinguished only by hue; "error" state implied by red border only.
  - Fix: add a second channel: icon, label, pattern, underline, text prefix ("Error: ").
  - Why: color-blind users and users in monochrome / high-contrast modes lose the signal.

- **Disabled state with low contrast where it conveys information**
  - What it breaks: 1.4.11 (disabled exempt for text contrast under 1.4.3, but state-conveying borders are still UI components).
  - Spot: disabled button at 1.5:1 where the only "I am disabled" cue is the dim color.
  - Fix: add a non-color cue (icon, "Disabled" text, locked appearance); or ensure the disabled state is still 3:1 if it is the sole indicator.
  - Why: a button that "looks faintly there" reads as "available" to many users.

- **Link without underline AND not 3:1 distinct from surrounding text**
  - What it breaks: 1.4.1.
  - Spot: links in body text styled only with a slightly different color and no underline.
  - Fix: underline links in prose; OR ensure ≥3:1 contrast between link color and body text AND add a non-color cue on hover/focus.
  - Why: color-only links are invisible to color-blind users scanning text.

---

## 6. Sizing & spacing

- **Target smaller than 24×24 CSS px without spacing exception** `[NEW in 2.2]`
  - What it breaks: 2.5.8 Target Size (Minimum). https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
  - Spot: 16×16 icon buttons in toolbars; 20×20 dismiss buttons in chips.
  - Fix: make the hit target 24×24, OR ensure a 24px-diameter circle around the target doesn't overlap any other target (spacing exception); inline-text targets and UA-default controls are exempt.
  - Why: 2.2's new minimum; smaller targets cause mis-taps and fail-rate spikes for motor-impaired users.

- **Close button in modal smaller than 24×24** `[NEW in 2.2]`
  - What it breaks: 2.5.8.
  - Spot: `.dialog-close { width: 16px; height: 16px }`.
  - Fix: 24×24 minimum; pad inside if the visual icon should stay 16×16.
  - Why: same SC; the X is the most-clicked control in any dialog.

- **`pointer-events: none` to "disable": keyboard still activates**
  - What it breaks: 4.1.2; 2.1.1 (depending).
  - Spot: `.disabled { pointer-events: none }` on a button with no `disabled` / `aria-disabled`.
  - Fix: use the `disabled` attribute (native) or `aria-disabled="true"` plus an event guard that suppresses activation.
  - Why: keyboard activation bypasses pointer-events; SR users have no idea the control is meant to be off.

- **Touch target rows too dense to hit on mobile**
  - What it breaks: 2.5.8.
  - Spot: list rows at 36 px tall with multiple controls; menu items at 28 px.
  - Fix: 44×44 is the historical iOS target; 2.5.8 requires 24×24, but design for 44 where you have room.
  - Why: mis-tap rate doubles below 44 px even for unimpaired users.

---

## 7. States & live regions

- **`aria-hidden="true"` on a focusable element**
  - What it breaks: 4.1.2; 2.4.3.
  - Spot: `aria-hidden="true"` on a `<button>`, link, or anything with `tabindex>=0`.
  - Fix: also remove from focus order: `inert`, `tabindex="-1"`, or unmount.
  - Why: keyboard users tab to it; SR ignores it; results in "ghost" controls.

- **Live region attached AFTER the change**
  - What it breaks: 4.1.3 Status Messages.
  - Spot: toast container appended to DOM at the moment of message, then text inserted; or the region is empty and text replaces it in one mutation.
  - Fix: the live region exists in the DOM at page load (empty); text is injected into it later.
  - Why: assistive tech subscribes when the region exists; appending the whole region at once is missed by some screen readers.

- **`disabled` attribute removes element from AT in some readers**
  - What it breaks: 4.1.2.
  - Spot: critical controls that must remain announceable while disabled (e.g. a submit button explaining why it's unavailable).
  - Fix: prefer `aria-disabled="true"` plus a click/keydown guard so the control stays focusable and described.
  - Why: native `disabled` skips focus and may not be announced; users cannot discover why the action is unavailable.

- **`aria-pressed` missing on toggle button**
  - What it breaks: 4.1.2.
  - Spot: bold/italic/mute buttons toggling visual state with no `aria-pressed`.
  - Fix: `aria-pressed="true|false"` on the toggle button (not switches: those use `role="switch"`).
  - Why: SR users need to hear "Bold, pressed".

- **`aria-expanded` missing on disclosure / menu / combobox trigger**
  - What it breaks: 4.1.2; APG Disclosure / Menu Button / Combobox.
  - Spot: chevron button toggling a panel with no `aria-expanded`.
  - Fix: `aria-expanded="true|false"` on the trigger, plus `aria-controls="panel-id"`.
  - Why: SR users hear "collapsed" / "expanded" and orient.

- **`aria-busy` not set during async load**
  - What it breaks: 4.1.3 (informational; helps SR users skip loading regions).
  - Spot: data table that swaps to skeletons with no `aria-busy`.
  - Fix: `aria-busy="true"` on the region during load; remove when content arrives.
  - Why: SR users navigate past in-flight regions instead of reading skeleton placeholders.

- **`aria-live="assertive"` on non-urgent content**
  - What it breaks: 4.1.3.
  - Spot: search-result counts, autosave indicators using `assertive`.
  - Fix: `polite` for informational; reserve `assertive` (and `role="alert"`) for time-critical errors.
  - Why: assertive interrupts the current SR utterance: over-use is hostile.

---

## 8. Motion

- **`prefers-reduced-motion` ignored**
  - What it breaks: 2.3.3 Animation from Interactions (AAA), but de facto industry baseline. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - Spot: animation/transition/transform with no `@media (prefers-reduced-motion: reduce)` override.
  - Fix: wrap motion in the media query; replace with instant transitions or short fades.
  - Why: vestibular users get nauseated; the OS preference exists to be respected.

- **Auto-playing animation > 5s with no pause control**
  - What it breaks: 2.2.2 Pause, Stop, Hide.
  - Spot: looping hero animations, particle backgrounds, looping Lottie.
  - Fix: pause/stop control, OR honor `prefers-reduced-motion: reduce` to stop, OR cap at 5 s total.
  - Why: moving content distracts users with attention-related disabilities; SC mandates user control.

- **Auto-advancing carousel without pause control**
  - What it breaks: 2.2.2.
  - Spot: hero carousel that auto-rotates every 4s; pause-on-hover only (no keyboard equivalent).
  - Fix: visible pause button that is keyboard-focusable; pause on focus AND hover.
  - Why: auto-rotation steals focus / reading position; user must be able to stop it.

---

## 9. Shadow DOM / custom elements

- **IDREF reused across multiple instances**
  - What it breaks: 4.1.2; 1.3.1.
  - Spot: a `<fluid-input>` template hardcoding `id="input"` and `aria-describedby="hint"`: multiple instances collide in the same shadow tree if slotted into light DOM, and `aria-describedby` cannot cross shadow boundaries.
  - Fix: generate per-instance ids inside the shadow root; or use `ariaDescribedByElements` / `ElementInternals` reflection where supported.
  - Why: duplicate ids break label/description resolution; cross-root references are not resolved by browsers.

- **`aria-labelledby` crossing shadow boundary**
  - What it breaks: 4.1.2.
  - Spot: a host attribute `aria-labelledby="external-id"` referencing an id in light DOM, where the labelled element is inside the shadow root.
  - Fix: keep the IDREF source and target in the same tree; or expose an `ariaLabel` property and forward via `ElementInternals`. Cross-root ARIA (WICG explainer: https://github.com/WICG/aom/blob/gh-pages/cross-root-aria-delegation.md) is not yet shipped.
  - Why: IDREFs do not pierce shadow roots; the relationship silently fails.

- **`delegatesFocus` missing on form-control wrappers**
  - What it breaks: 2.1.1; 2.4.3.
  - Spot: a `<fluid-input>` whose host has `tabindex="0"` but Tab lands on the wrapper, not the inner `<input>`.
  - Fix: `this.attachShadow({ mode: 'open', delegatesFocus: true })` so focus on the host forwards to the first focusable descendant.
  - Why: `delegatesFocus` is the documented mechanism (WHATWG HTML); without it, focus and `:focus` styling end up on the wrong node.

- **`tabindex` on inner element instead of host**
  - What it breaks: 2.4.3.
  - Spot: shadow-root child gets `tabindex="0"` while the host is also focusable; Tab visits both.
  - Fix: pick one: the host (with `delegatesFocus`) OR the inner, not both.
  - Why: duplicate tab stops disorient keyboard users.

- **Hiding via `display: none` AND `aria-hidden="true"` on host**
  - What it breaks: 4.1.2; 2.4.3.
  - Spot: dialog/dropdown setting host `style="display:none"` plus `aria-hidden="true"` plus leaving focusables inside.
  - Fix: use `inert` for "off but in DOM"; `hidden` attribute or unmount for fully removed.
  - Why: `aria-hidden` does not remove focusability; mixing with `display:none` is redundant when visible and broken when partially shown.

- **Form-associated custom element without `ElementInternals`**
  - What it breaks: 1.3.1; 3.3.2; 4.1.2. https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/
  - Spot: a `<fluid-checkbox>` claiming to be a form control but not submitting with the form; no `formAssociated = true`.
  - Fix: `static formAssociated = true;` and use `this.attachInternals()` to participate; expose `name`/`value`/validity.
  - Why: only FACE-registered elements get implicit label association, autofill, and form submission.

- **Slotted content not reachable by AT due to overzealous `aria-hidden`**
  - What it breaks: 1.3.1; 4.1.2.
  - Spot: wrapper sets `aria-hidden="true"` on a container that also slots user content.
  - Fix: hide only the decorative shell; never blanket-hide a slot.
  - Why: hides the actual content authors put into the component.

---

## 10. Pointer & motion gestures

- **Swipe-only gesture without keyboard / single-pointer alternative**
  - What it breaks: 2.5.1 Pointer Gestures.
  - Spot: carousel that only advances on horizontal swipe; image gallery panned only by drag.
  - Fix: provide next/prev buttons; keyboard arrows on focus.
  - Why: users without multi-touch or precise pointer control cannot operate path-based gestures.

- **Shake / tilt to undo without alternative**
  - What it breaks: 2.5.4 Motion Actuation.
  - Spot: PWA listening to `devicemotion` for an action with no UI control duplicating it.
  - Fix: provide a button/menu item; allow the user to disable motion actuation.
  - Why: users with tremors trigger accidentally; users on a fixed device cannot trigger at all.

- **Drag-only reorder without keyboard alternative** `[NEW in 2.2]`
  - What it breaks: 2.5.7 Dragging Movements. https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
  - Spot: sortable list / kanban with only `pointerdown` + `pointermove` drag.
  - Fix: add "Move up" / "Move down" controls or keyboard reorder (Space to pick up, arrows to move, Space to drop).
  - Why: 2.2 mandates a single-pointer (non-dragging) alternative for any function operable by dragging.
