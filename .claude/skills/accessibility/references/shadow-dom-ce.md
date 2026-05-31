# Shadow DOM and custom-element accessibility

Reference material for reviewing Fluid components. Web components hit several accessibility edge cases that ordinary DOM does not. Use this file when reviewing any `fluid-*` component, especially form-associated ones.

Primary sources cited throughout, refetch when a spec status matters:

- WHATWG HTML, custom elements: https://html.spec.whatwg.org/multipage/custom-elements.html
- `ElementInternals` (MDN): https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals
- WebKit blog, Form-associated custom elements: https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/
- WICG Cross-root ARIA explainer: https://github.com/WICG/aom/blob/gh-pages/cross-root-aria.md
- Accessibility Object Model (AOM) draft: https://wicg.github.io/aom/
- WAI-ARIA 1.2 Recommendation: https://www.w3.org/TR/wai-aria-1.2/
- `delegatesFocus` (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
- `:focus-visible` (CSSWG Selectors 4): https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo

---

## ARIA in shadow DOM

### The IDREF boundary rule

ARIA attributes that take a string (`role`, `aria-label`, `aria-expanded`, `aria-pressed`, etc.) set on the host element propagate through to the accessibility tree as expected.

ARIA attributes that take an **IDREF or IDREF list** (`aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-activedescendant`, `aria-owns`, `aria-flowto`, `aria-errormessage`) only resolve against IDs in the **same tree** as the attribute owner. Shadow boundaries break the lookup. There is no shadow-piercing IDREF in current browsers.

Concretely:

- `aria-labelledby="my-label"` on a host element only finds `#my-label` in the host's light DOM (the document or a containing shadow root).
- The same attribute set on an element **inside** the shadow root only finds IDs in **that** shadow root.
- You cannot cross the boundary in either direction.

This is a longstanding interop reality. The fix in progress is the Cross-root ARIA proposal (see below), not shippable today. Confirm current status at https://github.com/WICG/aom/blob/gh-pages/cross-root-aria.md before recommending any reliance on it.

### Practical workarounds

Pick whichever keeps the IDREF and its anchor in the same tree:

1. **Set ARIA on the host from the light DOM.** Most ergonomic. The consumer writes `<fluid-input aria-labelledby="email-label">` and the IDREF resolves in the document. Good for `aria-label`, `aria-labelledby`, `aria-describedby` when the labelling text lives in user markup.
2. **Slot the labelling element into the shadow root.** The slotted node is rendered in the shadow tree but still belongs to its original tree (light DOM). See "Slot labelling" below for why this changes the IDREF resolution rules.
3. **Use `ElementInternals.aria*` properties** to set ARIA on the host's accessibility node without touching its attribute set. Works for string-valued ARIA. For IDREF-valued reflections (`ariaLabelledByElements`, `ariaDescribedByElements`), behavior is improving: check support in primary sources before relying on it.

### ID scoping

Two cases the reviewer must check:

- **IDs inside a shadow root are scoped to that root.** Document-level CSS, `document.getElementById`, and any light-DOM IDREF cannot see them. Stories and tests written against `document.querySelector('#listbox-1')` will silently miss internal nodes: direct them through the host's shadow root instead.
- **IDs in the light DOM collide across multiple instances** of a component on the same page. If you generate IDREFs to coordinate `aria-labelledby`/`aria-controls`, ensure each instance produces unique IDs. A monotonic counter or `crypto.randomUUID()` at construction time is the conventional approach.

---

## `ElementInternals`

`HTMLElement.attachInternals()` returns an `ElementInternals` object that exposes the element's "private" surface to the accessibility tree and form system without polluting the host attribute set.

What it gives you:

- **Default ARIA semantics.** `ariaRole`, `ariaLabel`, `ariaDescription`, `ariaExpanded`, `ariaPressed`, `ariaChecked`, `ariaValueNow`, etc. Setting these does not add an `aria-*` attribute to the host: it sets the default semantics for the AOM. Consumer-supplied attributes on the host still win.
- **Form participation** (when paired with `static formAssociated = true`): `setFormValue(value, state?)`, `setValidity(flags, message?, anchor?)`, plus the `form`, `labels`, `validity`, `validationMessage`, `willValidate`, and `checkValidity()`/`reportValidity()` getters.
- **Custom states** for `:state(...)` selectors via `internals.states` (a `CustomStateSet`). Use this for component-specific state pseudos like `:state(loading)` or `:state(invalid)` instead of attribute selectors.

### Browser support

Per MDN at time of writing:

- Chromium: long-shipped (the API originated here).
- Safari: `ElementInternals` since 16.4; form-association ships with it.
- Firefox: `ElementInternals` and FACE shipped in 126.

Status moves, **verify against MDN** before treating any of this as universal. Always provide a fallback for ARIA: if a property setter is not honored, set the corresponding `aria-*` attribute on the host.

### Minimal Lit wiring

```ts
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("fluid-toggle")
export class FluidToggle extends LitElement {
  static formAssociated = true;

  #internals = this.attachInternals();

  @property({ type: Boolean, reflect: true }) pressed = false;

  constructor() {
    super();
    this.#internals.role = "button";
    this.#internals.ariaPressed = "false";
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("pressed")) {
      this.#internals.ariaPressed = String(this.pressed);
      this.#internals.setFormValue(this.pressed ? "on" : null);
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
```

Notes on this snippet:

- `role` and `ariaPressed` are set via `ElementInternals`: the host does not get `role="button"` or `aria-pressed="false"` attributes, keeping the DOM clean.
- A consumer writing `<fluid-toggle aria-pressed="mixed">` still overrides the default.
- `setFormValue(null)` removes the entry from form submission.

---

## Form-associated custom elements (FACE)

Mandatory checklist for any `fluid-*` component that behaves like an input (checkbox, radio, select, combobox, textarea, slider, switch, file input, etc.):

- `static formAssociated = true` on the class. Without this, the other internals form APIs throw.
- `attachInternals()` once and store the result.
- Wire **value** via `internals.setFormValue(value, state?)`. The optional `state` lets a restored form submission carry richer data than the wire value.
- Wire **validity** via `internals.setValidity(flags, message?, anchor?)`. The `anchor` element is what the browser focuses on `reportValidity()`: useful when the host's shadow root contains the real input.
- Implement the form lifecycle callbacks as needed:
  - `formAssociatedCallback(form)`: called when the element associates with a form.
  - `formDisabledCallback(disabled)`: propagate `disabled` into internal state.
  - `formResetCallback()`: restore default value.
  - `formStateRestoreCallback(state, mode)`: bfcache / autofill restoration.

Why this matters: native form participation (name, value, validation, reset, submission, autofill) **without** rendering a hidden `<input>` shim inside the shadow root. The hidden-input approach leaks light-DOM IDs, doubles the form's value when a consumer also uses `name=`, and breaks `:user-invalid` semantics.

Primary sources:

- WHATWG HTML, "Form-associated custom elements": https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements
- WebKit blog: https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/

---

## Slot labelling

A slotted node renders inside the shadow tree but **belongs to the light DOM**. Consequence: an `aria-labelledby` set on the host, pointing at a slotted node's `id`, **does** resolve, because both the host and the slotted node live in the same (light) tree.

But: if the component derives its accessible name from slotted text content rather than an IDREF, accessibility-tree behavior depends on whether the name computation walks slotted descendants. It does in practice in modern browsers, but two things still need a reviewer's eye:

- If the consumer puts free text in the default slot **and** sets `aria-label` on the host, `aria-label` wins per ARIA naming precedence. Document the precedence in the component.
- If the component needs the slotted label's text as a programmatic name elsewhere (for example, mirroring it into `internals.ariaLabel` so a screen reader announces the host as a single labeled control), wire a `slotchange` listener:

```ts
firstUpdated() {
  const slot = this.renderRoot.querySelector("slot");
  slot?.addEventListener("slotchange", () => {
    const text = slot.assignedNodes({ flatten: true })
      .map(n => n.textContent ?? "")
      .join(" ").trim();
    this.#internals.ariaLabel = text || null;
  });
}
```

Confirm name-from-content behavior for the specific role at https://www.w3.org/TR/wai-aria-1.2/#namecalculation when in doubt.

---

## `:focus-visible` across shadow boundaries

`:focus-visible` matches inside a shadow root when the focused element received focus through a "user agent's heuristic", keyboard navigation in practice. The browser tracks the heuristic at the document level and applies it through shadow boundaries.

Two practical implications:

- **`delegatesFocus: true`**: when the host's shadow root is created with `attachShadow({ mode: "open", delegatesFocus: true })`, calling `host.focus()` (or clicking the host) forwards focus to the first focusable descendant, and `:focus-visible` matches that descendant only when the trigger was keyboard-like. This is the right default for any component that wraps a single native form control (input, textarea, select-like). It also makes `:focus` on the host work for outline styling.
- **Never strip the inner focus ring without replacing it.** WCAG 2.4.7 Focus Visible is failed by F78 (removing outline with no replacement). If the design moves the focus ring to the host, make sure the inner control's default ring is suppressed only when the host's ring is actually rendered.

---

## Cross-root ARIA references

`aria-labelledby` (and other IDREF ARIA) pointing at a node in **another shadow tree** does not work in any current browser. The proposal under discussion is the Cross-root ARIA explainer at https://github.com/WICG/aom/blob/gh-pages/cross-root-aria.md, refetch for the current status; this batch did not deep-verify shipping support, and last known state was "not in any stable browser".

Workarounds today:

- Keep every IDREF anchor and its target in the **same tree**: both in the document light DOM, or both inside the same shadow root.
- For a composite where the popup is a sibling of the trigger (combobox listbox, menu, tooltip), render both inside the same shadow root and use intra-root IDREFs.
- Where a consumer needs to point an external `aria-describedby` at internal help text, expose a `description` slot or a `description` property and surface it through `internals.ariaDescription`.

---

## Implementation review checks for custom elements

Grep-friendly checklist. For every new `fluid-*` component verify:

- `static formAssociated = true` is set when the component represents user input (checkbox, switch, input, select, radio, slider, textarea, combobox, file picker).
- ARIA semantics are set via `ElementInternals` (`internals.role`, `internals.aria*`) where possible, with `setAttribute` fallback on the host when an `aria-*` reflection isn't yet supported.
- Consumer attributes on the host (`aria-label`, `aria-labelledby`, `aria-describedby`, `role`) override the defaults: never overwrite them in `updated()`.
- `attachShadow({ delegatesFocus: true })` is used on any component that wraps a single native focusable control. (1.4.11 Non-text Contrast, 2.4.7 Focus Visible.)
- Every internal ID used as an IDREF anchor is **unique per instance** (counter or `crypto.randomUUID()`), not a hardcoded string.
- IDREF-valued ARIA (`aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-activedescendant`) only references IDs in the **same tree** as the attribute owner: never assume cross-boundary lookup works.
- `tabindex` is set on the host (or via roving on internal items), not on a single inner node that consumers cannot reach. Composite widgets use exactly one tabbable entry point. (APG keyboard interface conventions.)
- Pointer activation (`click`) does not bypass the keyboard path: both end in the same internal handler, so Enter/Space activation behaves identically. (2.1.1 Keyboard.)
- `formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback` are implemented when `formAssociated`, and `disabled` propagates into both internal focusability and `setValidity`.
- `setValidity` is called with an `anchor` argument when the host is not itself the visible invalid control, so `reportValidity()` focuses the right element.
- `slotchange` updates derived accessibility state (`internals.ariaLabel` mirror, `aria-controls` IDREF recompute) when the slot affects the accessibility tree.
- Custom states (`internals.states.add("loading")`) are used instead of attribute-selector hacks where a `:state(...)` pseudo would do.
- Storybook and tests query nodes via `host.shadowRoot`: not `document.getElementById`, when asserting on shadow-DOM content.

Where this file says a browser ships or does not ship a feature, **refetch MDN** for the current matrix before depending on it. The web platform moves; this skill file is reference material, not a substitute for the source.

## Slotted content inherits the PAGE's CSS, not your shadow styles (hard-won)

This bit us on `fluid-button`: it looked perfect in Storybook but ballooned to
~48px tall in the Astro/Starlight docs. The lesson is general and applies to
**every component that slots text or arbitrary content** (button, badge, tag,
callout, breadcrumb, chip, menu item, …).

**The rule.** A slotted node lives in the light DOM. For *inherited* CSS
properties (`line-height`, `font-family`, `font-size`, `color`,
`letter-spacing`, `white-space`, …) it inherits from its **light-DOM ancestor
chain, i.e. the host page, NOT from the shadow `<slot>` location.** Styles set
on the inner wrapper never reach slotted text. Only `:host`, `::slotted()`, and
the page's own rules touch it.

Two distinct leaks, both real, both seen on the button:

1. **Inherited typography leaks in.** The docs `<body>` had `line-height: 1.75`
   (28px). The slotted label inherited that 28px line box → tall button. Setting
   `line-height` on the inner button did nothing.
   **Fix:** pin typography on `:host` with literal fallbacks (so it holds when
   token CSS isn't loaded, tests, bare pages):
   ```css
   :host {
     line-height: var(--fluid-font-line-height-tight, 1.2);
     font-family: var(--fluid-font-family-sans, sans-serif);
     font-weight: var(--fluid-font-weight-medium, 500);
   }
   /* size-bearing font-size must be on :host([size]) (NOT the inner node) so
      the slotted label inherits the right size: */
   :host([size="md"]) { font-size: var(--fluid-font-size-md, 0.875rem); }
   ```

2. **Markdown wraps loose text in a paragraph → block margins leak in.**
   MDX/Astro wrapped the label "Download" in a paragraph and prose CSS gave it
   `margin: 1em 0`. As a flex item that margin grew the button to its
   margin-box. Storybook (raw text node) had no paragraph, hence the divergence.
   **Fix:** reset slotted margins, and it MUST be `!important`:
   ```css
   ::slotted(*) { margin: 0 !important; }
   ```
   **Why `!important` is required, not lazy:** in the shadow cascade, for
   *normal* declarations the **outer (page) tree wins** over a shadow
   `::slotted()` rule, so the page's paragraph margin (normal) beats
   `::slotted(*){margin:0}` (normal). A shadow-tree `!important` outranks
   author-normal page styles, which is exactly the encapsulation guarantee
   wanted here. (CSS Scoping cascade: outer-tree-wins for normal,
   inner-tree-wins for important.)

3. **`:host` LAYOUT margins lose to a page reset too: same rule, different
   target.** `fluid-button-group` fuses members by pulling each non-first
   button leftward with a `:host([data-fluid-group]) { margin-left: -1px }`
   overlap. In the docs (and any app with a CSS reset, Tailwind preflight,
   normalize, `* { margin: 0 }`) the page's universal rule matched the host
   in the OUTER tree and zeroed the margin, so the overlap silently vanished
   and seams showed a 2px double border. Same cascade law as `::slotted`:
   a normal outer-tree declaration beats a normal `:host` declaration even
   at *lower* specificity. **Fix:** make the structural margin `!important`.
   If a component's layout depends on a `:host` margin/position, assume a
   page reset will fight it and assert it with `!important`, and verify in
   a real prose/reset context, not just Storybook. Found via Chrome MCP:
   the rule was in the sheet and `matches()` was true, but computed
   `margin-left` was `0px`; an injected `!important` copy proved the cascade
   loss rather than a selector miss.

4. **`align-self: stretch` does NOT stretch a slotted element that has an
   explicit height, don't style the slotted node as the box; wrap the slot in
   a component-owned shadow box.** `fluid-input` styled the prefix/suffix
   affix directly via `::slotted([slot="prefix"])` with `align-self: stretch`
   to make a full-height bordered box. It worked for a slotted `<span>` (no
   definite height → stretches) but NOT for a slotted `<fluid-icon>`, whose
   `:host` sets `height: 1em`, an explicit cross-size defeats `stretch`, so
   the affix collapsed to ~14px and **top-aligned** (a tiny bordered box, not a
   full-height fused section). You can't reliably override another custom
   element's internal height from `::slotted`. **Fix:** render the slot inside
   a shadow `<span class="affix"><slot></slot></span>` that the component sizes
   (`align-self: stretch` on a span with no explicit height DOES stretch) and
   center the content with `align-items: center`; the slotted thing keeps its
   intrinsic size and just sits centered. Toggle the box's visibility +
   `data-flush` via slotchange state, not `::slotted` selectors (which can't
   reach up to the wrapper). This is the right pattern for every affixed field
   (input, number-input, select, …). Found via Chrome MCP: prefix box measured
   14px tall inside a 38px field, top-aligned.

**The docs-embedding corollary.** When you EMBED components in a prose/markdown
context (the docs site), the page also leaks **flow spacing** onto the component
elements themselves: Starlight gives every element after the first sibling a top
margin (`* + *`), so in a centered flex demo row the first item sat ~8px above
the rest. The component can't fix its own external margin, fix it at the
embedding site:
- add Starlight's `not-content` class to the demo wrapper to opt the subtree out
  of prose styling, and
- reset `.<demo-wrapper> > * { margin: 0 !important }` as a backstop. Demo items
  are spaced by flex `gap`, never margins.

**Review checks for any text-slotting component:**
- Renders at the right height inside a prose context (line-height 1.75, 16px
  font)? Test in a large-line-height wrapper, not just Storybook.
- `::slotted(*) { margin: 0 !important }` present so a markdown paragraph label
  can't balloon it?
- Size-bearing `font-size` on `:host([size])` (reaches the slotted label), not
  only on an inner element (does not)?
- Regression test: wrap the component in `<div style="line-height:2.5">` and in
  a paragraph-labelled variant with `margin:1em`; assert the rendered height
  stays compact.
