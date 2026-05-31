# WCAG 2.2 AA matrix: design-system reviewer reference

Scope: every Level A and AA Success Criterion that a component-level or page-level review of Fluid may need to assert against. AAA is out of scope (informative only for the AA baseline).

Authoritative spec: [WCAG 2.2 Recommendation, 12 December 2024](https://www.w3.org/TR/WCAG22/). Per-SC normative wording lives under [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/). What's new in 2.2 is summarised at [w3.org/WAI/standards-guidelines/wcag/new-in-22](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).

Two cross-cutting reminders before the matrix:

1. **Conformance is determined by meeting the Success Criteria, not by using specific techniques.** W3C techniques are informative. When you review, assert outcomes (measured contrast ratio, observed focus indicator, correct name/role/value) rather than insisting on a particular code pattern.
2. **ARIA version sensitivity.** APG patterns and combobox guidance below assume [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/). ARIA 1.3 (Working Draft) relaxes some requirements; do not raise findings that depend on draft behaviour.

Where a row says "verbatim wording not in the verified research batch, fetch primary source", do not paraphrase the normative text from memory. Open the linked Understanding doc and quote it.

---

## Perceivable

### 1.1.1 Non-text Content: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html). In summary terms: non-text content has a text alternative that serves the equivalent purpose, with documented exceptions (decorative, controls, sensory, CAPTCHA, test).
- **Common violations.**
  - `fluid-icon` rendered alone as an interactive control (icon-only button) with no accessible name.
  - Decorative SVG exposed to AT instead of being hidden with `aria-hidden="true"` or empty `alt`.
- **How to verify.**
  - Manual: tab through each control and listen with VoiceOver / NVDA: every interactive element announces a name.
  - Automated: axe-core rules `image-alt`, `button-name`, `link-name`, `input-image-alt`, `svg-img-alt`. See [axe rule descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html

### 1.3.1 Info and Relationships: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html). Note: residual concerns formerly covered by the removed 4.1.1 Parsing now fall under 1.3.1 and 4.1.2.
- **Common violations.**
  - Visual grouping (a "card", a fieldset of radios, a table header) conveyed only by styling, with no `role`, `<fieldset>/<legend>`, `<th scope>`, or `aria-labelledby`.
  - Headings styled by font-size alone (`<div class="h2">`) instead of `<h1>`–`<h6>`.
- **How to verify.**
  - Manual: inspect the accessibility tree (Chrome DevTools → Elements → Accessibility pane); every visual relationship should have a programmatic counterpart.
  - Automated: axe-core `aria-required-parent`, `aria-required-children`, `definition-list`, `dlitem`, `list`, `listitem`, `th-has-data-cells`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html

### 1.3.2 Meaningful Sequence: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html).
- **Common violations.**
  - CSS `order` / `flex-direction: row-reverse` / absolute positioning reorders content so the DOM sequence no longer matches the visual reading order.
  - Slot reprojection in a Lit component that moves children into a different reading order than authors wrote.
- **How to verify.**
  - Manual: disable CSS (DevTools → Rendering → Disable styles) and confirm content still reads in a sensible order.
  - Automated: no reliable axe rule: this is a human review item.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html

### 1.3.4 Orientation: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.3.4](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html). In essence content must not be restricted to a single display orientation unless essential.
- **Common violations.** Layout locked to landscape on a tablet via `screen.orientation.lock()` or a media query that hides content in portrait.
- **How to verify.** Manual: rotate device / DevTools device toolbar; confirm both orientations work.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/orientation.html

### 1.3.5 Identify Input Purpose: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.3.5](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html). Inputs collecting information about the user must use the appropriate `autocomplete` token from the HTML spec list.
- **Common violations.** `fluid-input` form-associated wrapper that does not forward an `autocomplete` attribute to the internal `<input>`.
- **How to verify.**
  - Manual: shadow-DOM inspect the internal input and confirm `autocomplete="email"`, `"name"`, `"tel"`, etc. where the field is collecting that kind of data.
  - Automated: axe-core `autocomplete-valid`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html

### 1.4.1 Use of Color: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html). Color must not be the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.
- **Common violations.**
  - Form errors signalled only by a red border with no icon, no text, and no `aria-invalid`.
  - Link inside a paragraph distinguished only by color (no underline, no weight change).
- **How to verify.** Manual: take a greyscale screenshot (DevTools → Rendering → Emulate vision deficiencies → Achromatopsia) and check every state distinction still reads.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html

### 1.4.3 Contrast (Minimum): Level AA

- **What it requires.** Text and images of text have a contrast ratio of at least **4.5:1**, except: large text (≥18pt or ≥14pt bold) requires **3:1**; incidental text, logotypes, and disabled controls are exempt. See [Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **Common violations.**
  - Placeholder text or hint text (`fluid-input`) at ~2.5:1 because the brand token resolves grey-on-white.
  - Brand-themed button label where the chosen accent + foreground pair fails the ratio in light or dark mode.
- **How to verify.**
  - Manual: sample foreground and background with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or DevTools picker.
  - Automated: axe-core `color-contrast`; Storybook a11y addon runs this per story ([docs](https://storybook.js.org/docs/writing-tests/accessibility-testing)).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

### 1.4.4 Resize Text: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). Text can be resized up to 200% without loss of content or functionality.
- **Common violations.** Component layout uses fixed `px` heights so labels clip when the user zooms text-only to 200%.
- **How to verify.** Manual: in Firefox set View → Zoom → Zoom Text Only and zoom to 200%; nothing should clip, overlap, or disappear.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html

### 1.4.5 Images of Text: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.5](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html). Use live text instead of images of text except for logotypes and essential cases.
- **Common violations.** A "hero" component that ships its title as a bitmap PNG.
- **How to verify.** Manual: inspect; any text in `<img>` or background-image should be justified as logotype or essential.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html

### 1.4.10 Reflow: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Content must reflow without requiring two-dimensional scrolling at 320 CSS px width (with two-axis scroll only permitted for content that essentially requires it, e.g. data tables, maps).
- **Common violations.** Fixed-width modal or toolbar that triggers horizontal scroll on a 320px viewport.
- **How to verify.** Manual: DevTools device toolbar → 320 × 256; scroll only vertically.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

### 1.4.11 Non-text Contrast: Level AA

- **What it requires.** Visual presentation of (a) **UI components**: including their states and boundaries needed to identify the component, and (b) **graphical objects** required to understand content, must have a contrast ratio of at least **3:1** against adjacent color(s). See [Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) and the still-current [WCAG 2.1 version](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html).
- **Common violations.**
  - Form-field border that is < 3:1 against the page background (extremely common with light-grey-on-white inputs).
  - Focus ring that fails 3:1 against the component background or against the surrounding page.
  - Toggle / switch where the "off" track is indistinguishable from the surface.
  - Icon-only `fluid-button` where the glyph itself carries meaning but is < 3:1 against its button background.
- **How to verify.**
  - Manual: sample the boundary pixel against the adjacent pixel with DevTools color picker.
  - Automated: axe-core `color-contrast-enhanced` covers text only: UI/graphical contrast is largely a manual review item. Storybook a11y addon flags some cases.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html

### 1.4.12 Text Spacing: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). Content must tolerate user overrides of line height, paragraph spacing, letter spacing, and word spacing without loss.
- **Common violations.** Component sets `line-height: 1` via tokens; user CSS bumping it to 1.5 clips text inside a fixed-height container.
- **How to verify.** Manual: apply the [Text Spacing Bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html) and confirm no clipping/overlap.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html

### 1.4.13 Content on Hover or Focus: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html). Additional content triggered by hover/focus must be dismissable, hoverable, and persistent.
- **Common violations.**
  - `fluid-tooltip` that dismisses on `mouseleave` of the trigger, so the pointer cannot reach the tooltip content.
  - No `Escape` to dismiss.
- **How to verify.** Manual: hover trigger, move pointer onto tooltip: it stays. Press `Escape`, it dismisses. Tooltip persists until trigger blur / dismissal.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html

---

## Operable

### 2.1.1 Keyboard: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html). All functionality available via pointer must be operable through a keyboard interface (path/timing exceptions apply).
- **Common violations.**
  - Custom slider implemented with mousedown/mousemove only; no arrow-key handler.
  - Drag-and-drop in a card list with no keyboard alternative (this also implicates 2.5.7).
- **How to verify.** Manual: unplug the mouse and reach every action.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html

### 2.1.2 No Keyboard Trap: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html). Keyboard focus must be moveable away from any component using only the keyboard.
- **Common violations.** Modal dialog that traps Tab forever because there is no close button and `Escape` is not wired.
- **How to verify.** Manual: enter every dialog/menu/popover and confirm Tab/Shift+Tab/Escape can leave it.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html

### 2.1.4 Character Key Shortcuts: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html). Single-character shortcuts can be turned off, remapped, or only fire when a control has focus.
- **Common violations.** A global `/` opens search even while the user is typing in an unrelated input (dictation users hit this constantly).
- **How to verify.** Manual: invoke shortcuts from outside any control; check they do not fire while typing in inputs.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html

### 2.2.1 Timing Adjustable: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).
- **Common violations.** `fluid-toast` auto-dismiss after 4 s with no pause / extend.
- **How to verify.** Manual: confirm timeouts can be turned off, adjusted, or extended.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html

### 2.2.2 Pause, Stop, Hide: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Moving/blinking/scrolling/auto-updating content lasting > 5 s can be paused, stopped, or hidden.
- **Common violations.** Carousel auto-rotating with no pause control. Skeleton shimmer that never stops.
- **How to verify.** Manual: carousel exposes pause; loading shimmer respects `prefers-reduced-motion: reduce` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html

### 2.3.1 Three Flashes or Below Threshold: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html). No content flashes more than three times in any one-second period (or stays below the general/red flash thresholds).
- **Common violations.** Error state that rapidly toggles a high-contrast color.
- **How to verify.** Manual: visually inspect any animation involving large color changes.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html

### 2.4.1 Bypass Blocks: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.1](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html). Skip links / landmarks / heading structure allow bypassing repeated blocks.
- **Common violations.** Docs page with no `<main>` landmark and no skip link.
- **How to verify.** Manual: first Tab on page exposes a skip link, OR landmarks (`<nav>`, `<main>`, `<header>`, `<footer>`) are present.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html

### 2.4.2 Page Titled: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.2](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html).
- **How to verify.** Automated: axe-core `document-title`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html

### 2.4.3 Focus Order: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html). Reminder from APG: tab order follows DOM order; avoid positive `tabindex` values.
- **Common violations.** A composite widget whose internal focusable parts are reachable in an order that doesn't match the visual layout.
- **How to verify.** Manual: Tab through and confirm order matches reading order.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html

### 2.4.4 Link Purpose (In Context): Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html). Link purpose determinable from link text alone or together with its programmatically determined context.
- **How to verify.** Manual: list links via screen-reader rotor; each one makes sense.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html

### 2.4.5 Multiple Ways: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.5](https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html). More than one way to locate a page within a set.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html

### 2.4.6 Headings and Labels: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html). Headings and labels describe topic or purpose.
- **How to verify.** Automated: axe-core `empty-heading`, `label`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html

### 2.4.7 Focus Visible: Level AA

- **What it requires.** Any keyboard-operable user-interface has a mode of operation where the keyboard focus indicator is visible. See [Understanding 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). Documented failure **F78**: removing the UA outline (`outline: none`) without providing a replacement focus indicator.
- **Common violations.**
  - `:focus { outline: none }` in a reset, with `:focus-visible` styling missing.
  - A focus ring that is rendered but fails 3:1 against the component background (compound failure with 1.4.11).
- **How to verify.**
  - Manual: Tab to every focusable element; an indicator must appear.
  - Automated: axe-core does not reliably detect this: manual verification is required.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html

### 2.4.11 Focus Not Obscured (Minimum): Level AA [NEW in 2.2]

- **What it requires.** When a user interface component receives keyboard focus, the component is **not entirely hidden** by author-created content. See [Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html). Note: partial obscuring is allowed at AA; AAA 2.4.12 tightens this to "not obscured at all".
- **Common violations.**
  - Sticky header / cookie banner / `fluid-toast` overlays the focused element so the user cannot see what is focused.
  - Scroll-into-view logic that leaves the focused element just under a sticky toolbar.
- **How to verify.** Manual: with a sticky header / footer / popover present, Tab through the page; the focused element must remain at least partially visible at all times.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

### 2.5.1 Pointer Gestures: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.5.1](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html). Multi-point or path-based gestures have a single-pointer alternative.
- **Common violations.** Carousel that only advances via swipe; slider that only accepts a drag path.
- **How to verify.** Manual: every gesture-driven action can be performed with a single tap/click.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html

### 2.5.2 Pointer Cancellation: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.5.2](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html). Functionality completes on the up-event, or up-event aborts/reverses the action (with documented exceptions like keyboard emulators).
- **Common violations.** `fluid-button` triggers its action on `pointerdown` instead of `click`.
- **How to verify.** Manual: press, drag away, release: action must not fire.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html

### 2.5.3 Label in Name: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html). The accessible name must contain the visible label text.
- **Common violations.** Button visually labelled "Save" but `aria-label="Submit form"`: voice-control users say "click Save" and nothing happens.
- **How to verify.**
  - Manual: visible text appears at the start of the accessible name.
  - Automated: axe-core `label-content-name-mismatch`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html

### 2.5.4 Motion Actuation: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.5.4](https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html). Functionality operated by device motion has a UI alternative and motion can be disabled.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/motion-actuation.html

### 2.5.7 Dragging Movements: Level AA [NEW in 2.2]

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html). Any functionality that uses a dragging movement can also be operated by a single pointer without dragging (with an essential-use exception).
- **Common violations.** Kanban card reorder via drag with no per-card "move up / move down" buttons; slider thumb that only responds to drag.
- **How to verify.** Manual: every drag interaction has a click/tap alternative (and keyboard alternative under 2.1.1).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

### 2.5.8 Target Size (Minimum): Level AA [NEW in 2.2]

- **What it requires.** Pointer-input targets are at least **24 × 24 CSS px**, except where the target is **inline** in a sentence, sized by the **user agent** and not modified by author CSS, **essential** to the information being conveyed, sufficiently **spaced** so a 24-px circle centred on the target does not overlap another target, or has an **equivalent** larger target available. See [Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- **Common violations.**
  - 16-px icon-only `fluid-icon-button` with no surrounding hit area.
  - Pagination chevrons at 20 × 20.
  - Densely packed table action icons that violate the spacing exception.
- **How to verify.**
  - Manual: DevTools → inspect → check rendered box; if < 24 px, document which exception applies.
  - Automated: axe-core `target-size`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

---

## Understandable

### 3.1.1 Language of Page: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.1.1](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html).
- **How to verify.** Automated: axe-core `html-has-lang`, `html-lang-valid`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html

### 3.1.2 Language of Parts: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html).
- **How to verify.** Automated: axe-core `valid-lang`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html

### 3.2.1 On Focus: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.2.1](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html). Receiving focus does not trigger a change of context.
- **Common violations.** Select-like control that submits the form on focus, or auto-opens a popover.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html

### 3.2.2 On Input: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.2.2](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html). Changing a setting does not change context unless the user was warned.
- **Common violations.** Selecting a radio causes navigation with no warning.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/on-input.html

### 3.2.3 Consistent Navigation: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.2.3](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html

### 3.2.4 Consistent Identification: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.2.4](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html). Components with the same functionality are identified consistently.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html

### 3.2.6 Consistent Help: Level A [NEW in 2.2]

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html). When help mechanisms (contact details, chat, FAQ link, etc.) are provided on multiple pages, they appear in the same relative order.
- **Common violations.** Help link in the docs header on one page and only in the footer on another.
- **How to verify.** Manual: check the layout of help mechanisms across the docs site.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html

### 3.3.1 Error Identification: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html). Errors are identified and described in text.
- **Common violations.** `fluid-input` invalid state announced only by a red border; no `aria-invalid="true"`; no associated error text.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html

### 3.3.2 Labels or Instructions: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html).
- **How to verify.** Automated: axe-core `label`, `form-field-multiple-labels`.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html

### 3.3.3 Error Suggestion: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.3](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html

### 3.3.4 Error Prevention (Legal, Financial, Data): Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html). For legal/financial/data submissions: reversible, checked, or confirmable.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html

### 3.3.7 Redundant Entry: Level A [NEW in 2.2]

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html). Information previously entered in the same process is auto-populated or available for selection (exceptions: re-entering for security, information no longer valid, essential).
- **Common violations.** Multi-step form re-asks the user to type their email at every step.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html

### 3.3.8 Accessible Authentication (Minimum): Level AA [NEW in 2.2]

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html). A cognitive function test (remembering a password, solving a puzzle, transcribing) must not be required for any step in an authentication process unless an alternative, a mechanism to assist, object-recognition, or personal-content exception applies.
- **Common violations.** Login form blocking paste in the password field; CAPTCHA with only a transcription challenge.
- **How to verify.** Manual: confirm password fields accept paste from password managers; confirm WebAuthn/SSO option exists.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html

---

## Robust

### 4.1.2 Name, Role, Value: Level A

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html). For all UI components the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; notification of changes is available to AT. Most ARIA-related findings in a design-system review map here.
- **Common violations.**
  - Custom switch built from a `<div>` with no `role="switch"` and no `aria-checked`.
  - `fluid-tabs` where the active tab does not update `aria-selected`.
  - Shadow-DOM control whose label inside light DOM is not associated (see Cross-root ARIA: [WICG explainer](https://github.com/WICG/aom/blob/gh-pages/cross-root-aria-delegation.md)). Form-associated custom elements should use [`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) ARIA reflection (`role`, `ariaLabel`, etc.), see [WebKit FACE post](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/).
- **How to verify.**
  - Manual: inspect the accessibility tree; every interactive node has a role, accessible name, and any applicable state (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-pressed`, `aria-current`).
  - Automated: axe-core `aria-valid-attr`, `aria-valid-attr-value`, `aria-allowed-attr`, `aria-required-attr`, `button-name`, `link-name`. Playwright: `await expect(locator).toHaveAccessibleName(...)`, `.toHaveRole(...)` ([Playwright a11y](https://playwright.dev/docs/accessibility-testing)).
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html

### 4.1.3 Status Messages: Level AA

- **What it requires.** Verbatim wording not in the verified research batch: fetch from [Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). Status messages can be programmatically determined through role or properties so AT can present them without receiving focus.
- **Common violations.**
  - `fluid-toast` for a non-urgent success message rendered without `role="status"` / `aria-live="polite"`.
  - `fluid-toast` for an error with no `role="alert"` (or `aria-live="assertive"`).
  - Form validation summary appended to the DOM with no live region.
- **How to verify.**
  - Manual: trigger the status change while a screen reader is running; the message announces without focus moving.
  - Automated: axe-core does not fully cover this: primarily manual.
- **Primary source.** https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html

---

## Note on the removed criterion

**4.1.1 Parsing** was removed in WCAG 2.2 (now obsolete). Residual concerns it used to cover, duplicate IDs that affect AT, malformed start/end tags that break role/name computation, now fall under **1.3.1** and **4.1.2**. Do not raise stand-alone 4.1.1 findings.
