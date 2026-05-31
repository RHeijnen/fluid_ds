import { html, css, nothing, type PropertyValues } from "lit";
import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidButtonVariant = "primary" | "secondary" | "ghost";
export type FluidButtonSize = "sm" | "md" | "lg";
/**
 * Semantic intent of the button. Orthogonal to variant (which is the
 * visual treatment). `brand` = the current accent token; `neutral` =
 * grayscale; `success` / `danger` / `warning` / `info` = theme-
 * independent status colors that don't change when the brand theme
 * swaps.
 *
 * Default is variant-aware: primary → brand, secondary / ghost →
 * neutral. This preserves the pre-tone visual for every existing call
 * site while still letting authors opt in to colored variants.
 */
export type FluidButtonTone = "brand" | "neutral" | "success" | "danger" | "warning" | "info";

/**
 * A button.
 *
 * @summary Primary interactive element. Renders a native `<button>` inside shadow DOM.
 *
 * @slot - Button label.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @csspart base - The internal button element.
 * @csspart spinner - The loading spinner (present only while `loading`).
 * @csspart caret - The built-in dropdown chevron (present only with `caret`).
 *
 * Every styled property reads a component-scoped `--fluid-button-*` token that
 * falls back to a main semantic var, so a consumer can retheme one button, all
 * buttons, or (by overriding the main var) the whole system. The
 * `@cssproperty` list below is the complete set of per-button override knobs;
 * the `@uses-token` list is every main var those knobs fall back to.
 *
 * @cssproperty --fluid-button-bg - Background. Falls back per variant to accent / surface.
 * @cssproperty --fluid-button-fg - Text/icon color. Falls back per variant to accent-text / accent / text.
 * @cssproperty --fluid-button-border - Outline color (secondary variant). Falls back to --fluid-border-default.
 * @cssproperty --fluid-button-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-button-gap - Gap between icon and label. Falls back to --fluid-space-2.
 * @cssproperty --fluid-button-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-button-font-weight - Label weight. Falls back to --fluid-font-weight-medium.
 * @cssproperty --fluid-button-line-height - Label line-height. Falls back to --fluid-font-line-height-tight.
 * @cssproperty --fluid-button-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-button-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-button-focus-ring-offset - Focus ring offset. Falls back to --fluid-focus-ring-offset.
 *
 * @uses-token --fluid-accent-base - Primary background; secondary/ghost text (per tone).
 * @uses-token --fluid-accent-hover - Primary hover background.
 * @uses-token --fluid-accent-active - Primary active background.
 * @uses-token --fluid-accent-text - Primary text color.
 * @uses-token --fluid-surface-base - Secondary variant background.
 * @uses-token --fluid-border-default - Secondary variant outline.
 * @uses-token --fluid-border-strong - Secondary active outline.
 * @uses-token --fluid-neutral-base - `tone="neutral"` accent track (base/hover/active/text).
 * @uses-token --fluid-success-base - `tone="success"` accent track.
 * @uses-token --fluid-danger-base - `tone="danger"` accent track.
 * @uses-token --fluid-warning-base - `tone="warning"` accent track.
 * @uses-token --fluid-info-base - `tone="info"` accent track.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default label font family.
 * @uses-token --fluid-font-weight-medium - Default label weight.
 * @uses-token --fluid-font-line-height-tight - Default label line-height.
 * @uses-token --fluid-font-size-sm - Label size at size="sm".
 * @uses-token --fluid-font-size-md - Label size at size="md".
 * @uses-token --fluid-font-size-lg - Label size at size="lg".
 * @uses-token --fluid-space-2 - Icon/label gap + padding scale.
 * @uses-token --fluid-space-3 - Horizontal padding.
 * @uses-token --fluid-gradient-glossy - Subtle sheen overlay on solid fills.
 * @uses-token --fluid-duration-fast - Hover/press transition duration.
 * @uses-token --fluid-easing-standard - Hover/press transition easing.
 *
 * @fires fluid-click - Dispatched on activation (click or Enter/Space).
 * @fires fluid-change - Dispatched by a toggle button when `pressed` flips;
 *   `detail` is `{ pressed: boolean }`.
 */
export class FluidButton extends FluidElement {
  /**
   * delegatesFocus: true makes calling `.focus()` on the host element
   * forward to the inner native <button>, and ensures :focus-visible
   * fires on the right element across browsers. Without this, code that
   * does `document.querySelector("fluid-button").focus()` would no-op
   * silently, the inner button never gets focus.
   *
   * Reference: shadow-dom-ce.md (accessibility skill), "Recommend
   * delegatesFocus: true for any component that wraps a single native
   * form control."
   */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };

  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      /*
       * Pin typography on the host. The label is slotted from the LIGHT
       * DOM, so inherited CSS (line-height, font-family, font-size,
       * font-weight) reaches it from the HOST's inherited values, NOT
       * from the shadow .button. In a prose context (e.g. the Starlight
       * docs page, body line-height 1.75 = 28px) the slotted label
       * inherited that 28px line box and ballooned the button to ~46px
       * tall. Declaring the typography here means slotted content uses
       * the component's values regardless of the surrounding page CSS.
       *
       * font-size is set per size variant via :host([size="…"]) below so
       * it reaches the slotted label too (a rule on .button would not).
       */
      line-height: var(--fluid-button-line-height, var(--fluid-font-line-height-tight, 1.2));
      font-family: var(--fluid-button-font-family, var(--fluid-font-family-sans, sans-serif));
      font-weight: var(--fluid-button-font-weight, var(--fluid-font-weight-medium, 500));
    }
    :host([size="sm"]) {
      font-size: var(--fluid-font-size-sm);
    }
    :host([size="md"]) {
      font-size: var(--fluid-font-size-md);
    }
    :host([size="lg"]) {
      font-size: var(--fluid-font-size-lg);
    }

    /*
     * Per-tone accent override. Each data-tone value swaps the
     * --fluid-accent-* variables ONLY for this button's subtree, so
     * the existing variant rules (.variant-primary etc.) pick up the
     * right color without per-variant copies. brand falls through to
     * the global accent unchanged, that's the default and preserves
     * theme-picker behavior.
     *
     * Theme-independent on purpose: success / danger / warning / info
     * remain stable when the brand theme changes (per the accessibility
     * skill's tone scope decision).
     */
    :host([data-tone="neutral"]) {
      --fluid-accent-base: var(--fluid-neutral-base);
      --fluid-accent-hover: var(--fluid-neutral-hover);
      --fluid-accent-active: var(--fluid-neutral-active);
      --fluid-accent-text: var(--fluid-neutral-text);
    }
    :host([data-tone="success"]) {
      --fluid-accent-base: var(--fluid-success-base);
      --fluid-accent-hover: var(--fluid-success-hover);
      --fluid-accent-active: var(--fluid-success-active);
      --fluid-accent-text: var(--fluid-success-text);
    }
    :host([data-tone="danger"]) {
      --fluid-accent-base: var(--fluid-danger-base);
      --fluid-accent-hover: var(--fluid-danger-hover);
      --fluid-accent-active: var(--fluid-danger-active);
      --fluid-accent-text: var(--fluid-danger-text);
    }
    :host([data-tone="warning"]) {
      --fluid-accent-base: var(--fluid-warning-base);
      --fluid-accent-hover: var(--fluid-warning-hover);
      --fluid-accent-active: var(--fluid-warning-active);
      --fluid-accent-text: var(--fluid-warning-text);
    }
    :host([data-tone="info"]) {
      --fluid-accent-base: var(--fluid-info-base);
      --fluid-accent-hover: var(--fluid-info-hover);
      --fluid-accent-active: var(--fluid-info-active);
      --fluid-accent-text: var(--fluid-info-text);
    }

    .button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /*
       * SC 2.5.8 Target Size (Minimum) [NEW in WCAG 2.2 AA]. The floor is
       * enforced on the inner button so EVERY size variant (incl. size="sm")
       * meets the criterion regardless of label length or icon-only geometry.
       * Without this, sm-with-text collapsed to ~20px tall and failed.
       *
       * Reads --fluid-target-min so an ancestor opting into AAA
       * (data-fluid-conformance="aaa") lifts every target to 44×44
       * (SC 2.5.5 Target Size Enhanced) with zero per-component branching.
       * Falls back to the 24px AA floor when the token is absent.
       *
       * https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
       * https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
       */
      min-block-size: var(--fluid-target-min, 24px);
      min-inline-size: var(--fluid-target-min, 24px);
      /*
       * Tight gap between an icon and the label, space-2 (8px) is
       * the upper bound for "they read as one unit". We use it as the
       * default; sm bumps to a narrower value below so the small
       * button doesn't feel airy.
       */
      gap: var(--fluid-button-gap, var(--fluid-space-2));
      /* Typography is inherited from :host (see the note there) so the
       * slotted label and this inner button stay in lockstep, the
       * tight line-height keeps the icon + label vertically centered
       * without the slack that let the icon visibly float. */
      font: inherit;
      border-radius: var(--fluid-button-radius, var(--fluid-radius-md));
      cursor: pointer;
      user-select: none;
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /*
     * Neutralize margins on slotted content. Markdown / MDX (e.g. the
     * Starlight docs site) wraps loose label text in a <p>, and prose
     * CSS gives that <p> block margins, which, as a flex item, grow the
     * button to its margin-box (the docs button ballooned to ~48px from
     * a ~33px design). A button label must never carry layout margin, so
     * reset it for any slotted node regardless of how the label was
     * authored. This is what made docs differ from Storybook.
     *
     * !important is required, not lazy: for NORMAL declarations the
     * cascade gives the OUTER (page) tree precedence over a shadow
     * ::slotted() rule, so the docs prose paragraph margin would
     * otherwise win. A shadow-tree !important beats author-normal page
     * styles, which is exactly the encapsulation guarantee we want here.
     */
    ::slotted(*) {
      margin: 0 !important;
    }

    /*
     * Slotted-icon sizing. Lucide line-art glyphs need to be a touch
     * larger than the surrounding text to feel weight-balanced, at
     * exactly 1em they read as thin and "floaty" next to medium-weight
     * type. 1.125em is the modern convention (Radix, Vercel, Shoelace
     * all land here within a rounding error).
     */
    ::slotted(fluid-icon) {
      --fluid-icon-size: 1.125em;
      flex-shrink: 0;
    }

    .button:focus-visible {
      outline: var(--fluid-button-focus-ring-width, var(--fluid-focus-ring-width))
        solid var(--fluid-button-focus-ring-color, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-button-focus-ring-offset, var(--fluid-focus-ring-offset));
    }

    /*
     * The "Fluid" signature: settle-on-press. The button drops 1px and the
     * shadow softens, like a key being pressed. Subtle but it's the kind of
     * thing your finger remembers.
     */
    .button:active:not([aria-disabled="true"]) {
      transform: translateY(1px);
    }

    .button[aria-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /*
     * Sizes. Vertical padding is scaled per size; horizontal is per side
     * so the icon-side can tighten when a prefix or suffix slot is
     * populated. Without that asymmetry, an icon visually drifts away
     * from the button edge, too much padding to the icon's outer side
     * relative to the icon-to-label gap, which makes the cluster look
     * off-center.
     *
     * Convention: padded side ≈ size step; icon side ≈ one step tighter.
     * Matches what Tailwind UI / Radix / Vercel ship.
     */
    /* font-size lives on :host([size]) (so the slotted label inherits it);
       these rules own only the padding + gap geometry. */
    .size-sm {
      padding-block: var(--fluid-space-1);
      padding-inline: var(--fluid-space-3);
      gap: 0.375rem;
    }
    .size-md {
      padding-block: var(--fluid-space-2);
      padding-inline: var(--fluid-space-4);
    }
    .size-lg {
      padding-block: var(--fluid-space-3);
      padding-inline: var(--fluid-space-5);
    }

    .size-sm.has-prefix { padding-inline-start: var(--fluid-space-2); }
    .size-sm.has-suffix { padding-inline-end: var(--fluid-space-2); }
    .size-md.has-prefix { padding-inline-start: var(--fluid-space-3); }
    .size-md.has-suffix { padding-inline-end: var(--fluid-space-3); }
    .size-lg.has-prefix { padding-inline-start: var(--fluid-space-4); }
    .size-lg.has-suffix { padding-inline-end: var(--fluid-space-4); }

    /*
     * Icon-only buttons (no label slot, just prefix or suffix). Drop the
     * remaining horizontal padding to a near-square footprint so a lone
     * icon doesn't sit inside a stretched pill. The aspect-ratio plus
     * symmetric padding give us the "circular button" look without
     * hard-coding pixel widths.
     */
    .button.icon-only {
      padding-inline: var(--fluid-space-2);
      aspect-ratio: 1 / 1;
      justify-content: center;
    }
    .button.icon-only.size-lg { padding-inline: var(--fluid-space-3); }

    /*
     * Variants, primary + secondary wear the glossy gradient overlay. The
     * background-color is the brand fill; the gradient is a layered sheen
     * that adapts to any color the user sets. Ghost stays flat.
     */
    .variant-primary {
      background-color: var(--fluid-button-bg, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
      color: var(--fluid-button-fg, var(--fluid-accent-text));
      box-shadow:
        0 1px 2px rgb(0 0 0 / 0.12),
        inset 0 1px 0 rgb(255 255 255 / 0.12);
    }
    .variant-primary:hover {
      background-color: var(--fluid-accent-hover);
    }
    .variant-primary:active:not([aria-disabled="true"]) {
      background-color: var(--fluid-accent-active);
      box-shadow:
        0 1px 1px rgb(0 0 0 / 0.08),
        inset 0 1px 2px rgb(0 0 0 / 0.1);
    }

    /*
     * Secondary = outline. The border stays neutral (var(--fluid-border-
     * default)) regardless of tone, only the text + hover-tint follow
     * the tone, so a row of toned outline buttons reads as a coherent
     * family rather than a rainbow of competing borders. The text uses
     * --fluid-accent-base which the host-level :host([data-tone=...])
     * blocks swap, so the same rule paints every tone correctly.
     */
    .variant-secondary {
      background-color: var(--fluid-button-bg, var(--fluid-surface-base));
      background-image: var(--fluid-gradient-glossy);
      color: var(--fluid-button-fg, var(--fluid-accent-base));
      box-shadow:
        0 1px 2px rgb(0 0 0 / 0.06),
        inset 0 0 0 1px var(--fluid-button-border, var(--fluid-border-default)),
        inset 0 1px 0 rgb(255 255 255 / 0.4);
    }
    .variant-secondary:hover {
      background-color: color-mix(in srgb, var(--fluid-accent-base) 6%, var(--fluid-surface-base));
    }
    .variant-secondary:active:not([aria-disabled="true"]) {
      box-shadow:
        inset 0 0 0 1px var(--fluid-border-strong),
        inset 0 1px 2px rgb(0 0 0 / 0.05);
    }

    /*
     * Ghost = transparent with tone-colored text. Hover tint pulled
     * directly from the tone via color-mix so danger ghost gets a
     * red wash, success a green one, etc. The neutral tone produces
     * a subtle gray wash equivalent to the previous --fluid-surface-
     * muted hover, so existing call sites stay visually consistent.
     */
    .variant-ghost {
      background: transparent;
      color: var(--fluid-button-fg, var(--fluid-accent-base));
    }
    .variant-ghost:hover {
      background: color-mix(in srgb, var(--fluid-accent-base) 12%, transparent);
    }

    /*
     * Toggle-button pressed state (aria-pressed="true"). A subtle inset
     * "sunk in" treatment reads as on/active without inventing a new
     * color, it tints toward the current tone and recesses the surface.
     */
    .button.variant-primary[aria-pressed="true"],
    .button.variant-secondary[aria-pressed="true"],
    .button.variant-ghost[aria-pressed="true"] {
      background-color: color-mix(in srgb, var(--fluid-accent-base) 22%, transparent);
      box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.12);
    }

    /*
     * Loading spinner. A pure-CSS ring rendered in the shadow DOM (no
     * dependency on registering fluid-spinner). aria-hidden, the busy
     * state is announced via aria-busy on the button, and the label
     * stays put so the accessible name is unchanged (SC 2.5.3). While
     * loading we hide a prefix icon so it doesn't sit next to the
     * spinner; the label and any suffix remain.
     */
    .spinner {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: fluid-button-spin 0.6s linear infinite;
    }
    .button.is-loading ::slotted([slot="prefix"]) {
      display: none;
    }
    @keyframes fluid-button-spin {
      to {
        transform: rotate(360deg);
      }
    }

    /*
     * Built-in dropdown caret (the caret attribute). A self-contained
     * inline chevron, no fluid-icon registration needed, same as the
     * spinner, sized to match a slotted icon (1.125em) and rotated while
     * the host carries aria-expanded="true" (stamped by fluid-dropdown).
     */
    .caret {
      width: 1.125em;
      height: 1.125em;
      flex-shrink: 0;
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    :host([aria-expanded="true"]) .caret {
      transform: rotate(180deg);
    }

    /*
     * Button-group membership. A <fluid-button-group> stamps
     * data-fluid-group="first|inner|last|only" on every member button
     * (including a caret trigger nested inside a <fluid-dropdown>), and the
     * button flattens its own interior corners + overlaps the shared border.
     * Keeping the fusion HERE (not in the group's ::slotted CSS) is what lets
     * a split button work even when the trigger sits one shadow boundary deep
     * inside a dropdown, which ::slotted()/::part() can't reach.
     */
    /*
     * Overlap adjacent borders into a single stroke. !important is required,
     * not lazy: a page-level reset like "* { margin: 0 }" (Starlight, Tailwind
     * preflight, normalize) matches the host in the OUTER tree and, per the
     * shadow-host cascade, overrides a normal :host margin even at lower
     * specificity. The same reason ::slotted(*) needs !important above. The
     * overlap is part of the component's contract, so we assert it.
     */
    /* Only subsequent members (inner / last) overlap leftward; first + only
       keep their natural position so the group isn't nudged off-origin. */
    :host([data-fluid-group="inner"]),
    :host([data-fluid-group="last"]) {
      margin-left: -1px !important;
    }
    :host([data-fluid-group="first"]) .button {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    :host([data-fluid-group="inner"]) .button {
      border-radius: 0;
    }
    :host([data-fluid-group="last"]) .button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    /* Vertical groups overlap upward and flatten the top/bottom seams. */
    :host([data-fluid-group-orientation="vertical"][data-fluid-group="inner"]),
    :host([data-fluid-group-orientation="vertical"][data-fluid-group="last"]) {
      margin-left: 0 !important;
      margin-top: -1px !important;
    }
    :host([data-fluid-group-orientation="vertical"][data-fluid-group="first"]) .button {
      border-radius: var(--fluid-radius-md) var(--fluid-radius-md) 0 0;
    }
    :host([data-fluid-group-orientation="vertical"][data-fluid-group="inner"]) .button {
      border-radius: 0;
    }
    :host([data-fluid-group-orientation="vertical"][data-fluid-group="last"]) .button {
      border-radius: 0 0 var(--fluid-radius-md) var(--fluid-radius-md);
    }

    /* Raise the hovered/focused member so its full border wins over the
       overlapped neighbor (otherwise the -1px overlap clips the ring). */
    :host([data-fluid-group]) .button:hover,
    :host([data-fluid-group]) .button:focus-visible {
      position: relative;
      z-index: 1;
    }

    /*
     * Honor the user's reduced-motion preference. WCAG 2.3.3 is AAA
     * but is treated as a hard baseline for design systems, disabling
     * the settle-on-press transform + zeroing transition durations is
     * the minimum vestibular-safety move. We keep the focus-ring
     * rendering instant either way (it's a paint, not a motion).
     *
     * https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
     * https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
     */
    @media (prefers-reduced-motion: reduce) {
      .button {
        transition-duration: 0ms;
      }
      .button:active:not([aria-disabled="true"]) {
        transform: none;
      }
    }
  `;

  /** Visual treatment, primary (solid), secondary (outline), ghost (transparent). */
  @property({ reflect: true }) variant: FluidButtonVariant = "primary";

  /**
   * Semantic intent. Independent of variant, `tone="danger"` turns the
   * button red whether it's primary (solid red), secondary (red outline),
   * or ghost (transparent with red text). When unset, the effective tone
   * is variant-aware: primary defaults to "brand", secondary / ghost
   * default to "neutral" so the existing visual is preserved for every
   * call site that doesn't opt in. The resolved effective tone is
   * mirrored onto the host as `data-tone` so CSS targets it.
   */
  @property({ reflect: true }) tone?: FluidButtonTone;

  /** Size of the button. */
  @property({ reflect: true }) size: FluidButtonSize = "md";

  /** Disable interaction. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Pending / in-flight state. Shows a spinner, marks the button
   * `aria-busy`, and blocks activation, but, unlike `disabled`, the
   * button stays focusable (via `aria-disabled`, not native `disabled`)
   * so a screen-reader user keeps their place and hears the busy state.
   * The label stays in the DOM so the accessible name is unchanged
   * while loading (SC 2.5.3 Label in Name). Use for async submits to
   * prevent double-submission.
   */
  @property({ type: Boolean, reflect: true }) loading = false;

  /**
   * Opt this button into the toggle-button pattern (WAI-ARIA APG). When
   * set, the inner button exposes `aria-pressed` reflecting `pressed`,
   * and activating it flips `pressed` and fires `fluid-change`.
   */
  @property({ type: Boolean, reflect: true }) toggle = false;

  /** Pressed state for a toggle button (only meaningful with `toggle`). */
  @property({ type: Boolean, reflect: true }) pressed = false;

  /**
   * Render a built-in chevron after the label, marking this button as a
   * menu/dropdown trigger. The chevron rotates 180° while the menu is open
   * (driven by the `aria-expanded` attribute a `<fluid-dropdown>` stamps on
   * the host). Use this instead of hand-slotting an icon so every dropdown
   * trigger in the system looks identical.
   */
  @property({ type: Boolean, reflect: true }) caret = false;

  /** Form submission type when used inside a form. */
  @property() type: "button" | "submit" | "reset" = "button";

  /**
   * Accessible name override. Required for icon-only buttons (where the
   * default slot is empty and the slotted icon is decorative); honoured
   * as the inner <button>'s aria-label so screen readers announce
   * something other than empty when activating the host.
   *
   * Maps to SC 4.1.2 Name, Role, Value and SC 1.1.1 Non-text Content
   * (icon-only alt-text). Without this, an icon-only button is
   * effectively unlabelled.
   *
   * https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
   */
  @property({ attribute: "aria-label", reflect: true })
  override ariaLabel: string | null = null;

  /**
   * Reflects whether the prefix/suffix/default slots have content.
   * Drives the padding-asymmetry + icon-only styles. Kept as private
   * state so the consumer never has to wire it, the slotchange events
   * keep it accurate as content moves in and out.
   */
  @state() private hasPrefix = false;
  @state() private hasSuffix = false;
  @state() private hasLabel = false;

  private ariaObserver?: MutationObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    // A <fluid-dropdown> stamps aria-haspopup / aria-expanded on this host
    // (its trigger) imperatively. Mirror those onto the inner <button> in
    // render() so the popup state lands on the element that actually carries
    // the button role (SC 4.1.2), and re-render on change so the caret
    // reflects the open state.
    this.ariaObserver = new MutationObserver(() => this.requestUpdate());
    this.ariaObserver.observe(this, {
      attributes: true,
      attributeFilter: ["aria-haspopup", "aria-expanded", "aria-controls"]
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.ariaObserver?.disconnect();
    this.ariaObserver = undefined;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", String(this.disabled));
    }
    if (changed.has("ariaLabel")) {
      // Reset the dev-warning guard so toggling aria-label re-checks.
      this.warnedNameless = false;
      this.warnIfNamelessIconOnly();
    }
    if (changed.has("tone") || changed.has("variant")) {
      // The visible-tone resolution: explicit `tone` always wins.
      // Without one, primary defaults to brand (the current accent)
      // and secondary / ghost default to neutral so existing call
      // sites render exactly as before. CSS targets data-tone, so this
      // attribute is the contract between TS and the stylesheet.
      const effective: FluidButtonTone =
        this.tone ?? (this.variant === "primary" ? "brand" : "neutral");
      this.dataset.tone = effective;
    }
  }

  /**
   * Update the "this slot has assigned content" flags whenever a slot
   * fires `slotchange`. We strip whitespace-only text nodes so trailing
   * newlines in templated markup don't accidentally enable the icon-only
   * geometry.
   */
  private handleSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const populated = slot.assignedNodes().some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0;
    });
    if (slot.name === "prefix") this.hasPrefix = populated;
    else if (slot.name === "suffix") this.hasSuffix = populated;
    else this.hasLabel = populated;
    this.warnIfNamelessIconOnly();
  };

  /**
   * Guard for the icon-only-without-accessible-name footgun.
   *
   * When the default (label) slot is empty AND there's an icon in
   * prefix/suffix AND the host has no aria-label, the rendered button
   * has no accessible name, screen readers announce "button" with no
   * context, which fails SC 4.1.2. We can't BLOCK the consumer (the
   * label might land asynchronously) but we can shout once per element
   * so the bug surfaces immediately in dev. The warn is also useful
   * even in prod, it's a one-shot console message that flags a real
   * a11y bug in the consumer's markup, not in Fluid itself.
   */
  private warnedNameless = false;
  private warnIfNamelessIconOnly(): void {
    if (this.warnedNameless) return;
    const isIconOnly = !this.hasLabel && (this.hasPrefix || this.hasSuffix);
    if (!isIconOnly) return;
    if (this.ariaLabel) return;
    this.warnedNameless = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[fluid-button] Icon-only button has no accessible name. Add aria-label on the host so screen readers announce something. SC 4.1.2 Name, Role, Value.",
      this
    );
  }

  private handleClick = (event: MouseEvent) => {
    // Block activation while disabled OR loading. Loading uses
    // aria-disabled (the inner button stays focusable), so the native
    // `disabled` short-circuit doesn't cover it, guard here too.
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    // Toggle-button pattern: activation flips pressed + announces it.
    if (this.toggle) {
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent("fluid-change", {
          detail: { pressed: this.pressed },
          bubbles: true,
          composed: true
        })
      );
    }
    this.dispatchEvent(new CustomEvent("fluid-click", { bubbles: true, composed: true }));
  };

  override render() {
    return html`
      <button
        part="base"
        class=${classMap({
          button: true,
          [`variant-${this.variant}`]: true,
          [`size-${this.size}`]: true,
          "has-prefix": this.hasPrefix,
          "has-suffix": this.hasSuffix,
          // Icon-only = a prefix OR suffix is filled but the default
          // (label) slot is not. Gives the button a near-square
          // footprint and tight, symmetric padding so the icon sits
          // centered instead of biased to one side.
          "icon-only":
            !this.hasLabel && (this.hasPrefix || this.hasSuffix || this.caret),
          "is-loading": this.loading
        })}
        type=${this.type}
        ?disabled=${this.disabled}
        aria-disabled=${this.disabled || this.loading ? "true" : "false"}
        aria-busy=${this.loading ? "true" : nothing}
        aria-pressed=${this.toggle ? (this.pressed ? "true" : "false") : nothing}
        aria-haspopup=${ifDefined(this.getAttribute("aria-haspopup") ?? undefined)}
        aria-expanded=${ifDefined(this.getAttribute("aria-expanded") ?? undefined)}
        aria-controls=${ifDefined(this.getAttribute("aria-controls") ?? undefined)}
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        @click=${this.handleClick}
      >
        ${this.loading
          ? html`<span class="spinner" part="spinner" aria-hidden="true"></span>`
          : nothing}
        <slot name="prefix" @slotchange=${this.handleSlotChange}></slot>
        <slot @slotchange=${this.handleSlotChange}></slot>
        <slot name="suffix" @slotchange=${this.handleSlotChange}></slot>
        ${this.caret
          ? html`<svg
              class="caret"
              part="caret"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>`
          : nothing}
      </button>
    `;
  }
}
