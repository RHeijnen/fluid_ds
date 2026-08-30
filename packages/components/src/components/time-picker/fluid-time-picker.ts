import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { autoUpdate, computePosition, flip, offset, shift, size } from "../../internal/position.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";
import {
  fieldChromeStyles,
  fieldHelpDescribedBy,
  renderFieldChrome
} from "../../internal/field-chrome.js";

export type FluidTimeFormat = "12h" | "24h";

/** A single generated time option. */
interface TimeOption {
  /** Canonical 24h "HH:MM" value (the form value). */
  value: string;
  /** Display label, formatted per `format`. */
  label: string;
  /** DOM id for aria-activedescendant. */
  id: string;
}

let counter = 0;

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes-since-midnight for a canonical "HH:MM", or null if malformed. */
function toMinutes(value: string | null): number | null {
  if (!value) return null;
  const m = HH_MM.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes-since-midnight back to a canonical "HH:MM". */
function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Format a canonical 24h "HH:MM" for display in the chosen format.
 *
 * Intl carries the locale's digits, ordering and separators, but two of its
 * details vary by ICU version and would make the same value render differently
 * across browsers, so they are pinned here instead:
 *
 *  - 24h asks for a 2-digit hour rather than "numeric". Under an h23 cycle some
 *    ICU builds promote "numeric" to a padded hour and others do not, which is
 *    the difference between "09:00" and "9:00" in a column of times that should
 *    line up.
 *  - The day period is uppercased and the narrow no-break space ICU 72+ puts in
 *    front of it is normalized to a regular space, so 12h stays "1:30 PM".
 *    Uppercasing runs through the locale and is a no-op where case does not
 *    apply, so scripts like Japanese keep their own day-period text.
 */
function formatLabel(value: string, format: FluidTimeFormat, locale: string | undefined): string {
  const mins = toMinutes(value);
  if (mins === null) return value;
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  const parts = new Intl.DateTimeFormat(locale, {
    hour: format === "24h" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle: format === "24h" ? "h23" : "h12"
  }).formatToParts(new Date(2000, 0, 1, h, mm));
  return parts
    .map((part) => {
      if (part.type === "dayPeriod") return part.value.toLocaleUpperCase(locale);
      if (part.type === "literal") return part.value.replace(/[\u202f\u00a0]/g, " ");
      return part.value;
    })
    .join("");
}

/**
 * A standalone, form-associated time picker: a text field that opens an
 * accessible listbox of time options generated from `min` / `max` / `step`.
 *
 * The form / `value` is always a canonical 24h `"HH:MM"` string regardless of
 * the visible `format` ("12h" shows "1:30 PM", "24h" shows "13:30"). Options are
 * computed from `min` (default "00:00"), `max` (default "23:59"), and `step`
 * (minutes, default 15).
 *
 * Accessibility: WAI-ARIA APG Combobox with a `role="listbox"` popup. The field
 * is `role="combobox"` (`aria-haspopup="listbox"`, `aria-expanded`,
 * `aria-controls`); DOM focus stays on the input and the active option is
 * tracked with `aria-activedescendant`. ArrowDown / ArrowUp move the active
 * option, Enter commits it, Escape closes, and typing filters the list.
 *
 * @summary Pick a time from a generated list.
 *
 *
 * A visible label and help text can be attached directly with the `label` and
 * `help-text` attributes; the label is a real `<label for>` inside the shadow
 * root and the help text is announced via `aria-describedby`. For rich label
 * content, error messages, or a required indicator, wrap the control in
 * `fluid-field` instead.
 *
 * @csspart label - The visible label (present only when `label` is set).
 * @csspart help-text - The help text (present only when `help-text` is set).
 * @csspart base - The field container.
 * @csspart input - The text input.
 * @csspart trigger - The clock toggle button.
 * @csspart listbox - The popover listbox.
 * @csspart option - A single time option.
 *
 * Every styled property reads a component-scoped `--fluid-time-picker-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-time-picker-bg - Field background. Falls back to --fluid-input-bg then --fluid-surface-base.
 * @cssproperty --fluid-time-picker-fg - Field text. Falls back to --fluid-input-fg then --fluid-text-primary.
 * @cssproperty --fluid-time-picker-border - Field border color. Falls back to --fluid-input-border then --fluid-border-default.
 * @cssproperty --fluid-time-picker-border-focus - Focused border color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-time-picker-radius - Field corner radius. Falls back to --fluid-field-border-radius then --fluid-radius-md.
 * @cssproperty --fluid-time-picker-font-family - Field + option font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-time-picker-listbox-bg - Popover background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-time-picker-listbox-shadow - Popover elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-time-picker-option-active-rail - Color of the rail marking the keyboard-active option. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-time-picker-listbox-radius - Popover corner radius. Falls back to --fluid-time-picker-radius, so the popover and the field share the corner they meet at.
 * @cssproperty --fluid-time-picker-listbox-padding - Inset around the option list. Falls back to --fluid-space-1.
 * @cssproperty --fluid-time-picker-listbox-max-height - Height at which the option list starts scrolling. Falls back to 16rem.
 * @cssproperty --fluid-time-picker-border-strong - Scrollbar thumb color in the popover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-time-picker-option-fg - Option text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-time-picker-option-active-bg - Active/hovered option background. Falls back to an 8% --fluid-accent-base tint.
 * @cssproperty --fluid-time-picker-option-active-rail-width - Active option rail width. Falls back to 2px.
 * @cssproperty --fluid-time-picker-option-active-rail-inset - Active option rail inset. Falls back to 4px.
 * @cssproperty --fluid-time-picker-option-selected-bg - Selected option background. Falls back to a 16% --fluid-accent-base tint.
 * @cssproperty --fluid-time-picker-option-selected-fg - Selected option text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-time-picker-option-selected-font-weight - Selected option font weight. Falls back to --fluid-font-weight-medium.
 * @cssproperty --fluid-time-picker-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Field + listbox background.
 * @uses-token --fluid-text-primary - Field + option text.
 * @uses-token --fluid-text-secondary - Trigger icon + placeholder.
 * @uses-token --fluid-border-default - Field + listbox border.
 * @uses-token --fluid-accent-base - Focus border, option tints and active rail.
 * @uses-token --fluid-font-weight-medium - Selected option font weight.
 * @uses-token --fluid-radius-full - Active option rail radius.
 * @uses-token --fluid-field-border-radius - Field radius.
 * @uses-token --fluid-space-1 - Default inset around the option list.
 * @uses-token --fluid-border-strong - Default scrollbar thumb color in the popover.
 * @uses-token --fluid-field-height-md - Field height.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Trigger + option min target (24px AA / 44px AAA).
 * @uses-token --fluid-font-size-sm - Text size at size="sm".
 * @uses-token --fluid-font-size-md - Text size at size="md".
 * @uses-token --fluid-font-size-lg - Text size at size="lg".
 *
 * @fires fluid-change - The committed time changed. `detail: { value }` where value is the 24h "HH:MM" (or null when cleared).
 * @fires fluid-open - The listbox opened.
 * @fires fluid-close - The listbox closed.
 * @cssproperty --fluid-time-picker-accent-base - Component override for the corresponding semantic token.
 * @cssproperty --fluid-time-picker-border-default - Component override for the corresponding semantic token.
 * @cssproperty --fluid-time-picker-text-primary - Component override for the corresponding semantic token.
 * @cssproperty --fluid-time-picker-text-secondary - Component override for the corresponding semantic token.
 */
export class FluidTimePicker extends FluidFormAssociated {
  static override shadowRootOptions: ShadowRootInit = {
    ...FluidFormAssociated.shadowRootOptions,
    delegatesFocus: true
  };

  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    fieldChromeStyles,
    css`
      :host {
        display: inline-block;
        /*
         * Fill the field wrapper and, more importantly, be allowed to shrink
         * inside it. Without max-width an inline-block host keeps its intrinsic
         * width and spills out of a narrow grid track or flex item, colliding
         * with whatever sits beside it. This matches fluid-input, fluid-select
         * and the rest of the field family.
         */
        width: 100%;
        max-width: 100%;
        font-family: var(--fluid-time-picker-font-family, var(--fluid-font-family-sans));
      }
      :host([disabled]) {
        opacity: 0.6;
        pointer-events: none;
      }
      :host([hidden]) {
        display: none;
      }
      .base {
        display: inline-flex;
        width: 100%;
        /* width: 100% is the border box, so the padding and border sit inside
           the field wrapper instead of adding 23px of overflow to it. */
        box-sizing: border-box;
        align-items: center;
        gap: 0.25rem;
        height: var(--fluid-field-height-md, 2.5rem);
        padding-inline: var(--fluid-field-padding-x-md, 0.75rem);
        background: var(--fluid-time-picker-bg, var(--fluid-input-bg, var(--fluid-surface-base)));
        color: var(--fluid-time-picker-fg, var(--fluid-input-fg, var(--fluid-text-primary)));
        border: var(--fluid-field-border-width, 1px) solid
          var(--fluid-time-picker-border, var(--fluid-input-border, var(--fluid-border-default)));
        border-radius: var(
          --fluid-time-picker-radius,
          var(--fluid-field-border-radius, var(--fluid-radius-md))
        );
        transition:
          border-color 120ms ease,
          box-shadow 120ms ease;
      }
      /* Font scales with the size, as it does on every other field. The
         size-scoped font rules further down style the dropdown rows, not the
         field — see fluid-date-range-picker. */
      .base {
        font-size: var(--fluid-font-size-md);
      }
      :host([size="sm"]) .base {
        height: var(--fluid-field-height-sm, 2rem);
        padding-inline: var(--fluid-field-padding-x-sm, 0.6rem);
        font-size: var(--fluid-font-size-sm);
      }
      :host([size="lg"]) .base {
        height: var(--fluid-field-height-lg, 3rem);
        padding-inline: var(--fluid-field-padding-x-lg, 0.9rem);
        font-size: var(--fluid-font-size-lg);
      }
      .base:focus-within {
        border-color: var(--fluid-time-picker-border-focus, var(--fluid-accent-base));
        outline: var(--fluid-time-picker-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid
          color-mix(in srgb, var(--fluid-accent-base) 35%, transparent);
        outline-offset: 0;
      }
      input {
        flex: 1;
        /* 0, not a rem floor: the host now takes its width from the field
           wrapper, so a floor here only stops the control shrinking and pushes
           it out of a narrow track. Long values scroll inside the input. */
        min-width: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
      }
      input::placeholder {
        color: var(
          --fluid-input-placeholder-fg,
          var(--fluid-time-picker-text-secondary, var(--fluid-text-secondary))
        );
      }
      .trigger {
        display: inline-grid;
        place-items: center;
        min-width: max(1.5rem, var(--fluid-target-min, 0px));
        min-height: max(1.5rem, var(--fluid-target-min, 0px));
        margin-inline-end: calc(-1 * 0.25rem);
        border: 0;
        border-radius: var(--fluid-radius-sm, 4px);
        background: transparent;
        color: var(--fluid-time-picker-text-secondary, var(--fluid-text-secondary));
        cursor: pointer;
      }
      .trigger:hover {
        color: var(--fluid-time-picker-text-primary, var(--fluid-text-primary));
      }
      .trigger:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-time-picker-accent-base, var(--fluid-accent-base));
        outline-offset: 1px;
      }
      svg {
        width: 1.1em;
        height: 1.1em;
      }
      /* Rendered in the top layer via popover="manual" so it is never clipped
         by an ancestor overflow / transform / contain. the positioning engine drives
         placement. */
      .listbox {
        position: fixed;
        inset: auto;
        top: 0;
        left: 0;
        z-index: 1000;
        margin: 0;
        /* The engine sizes this to the field's exact width, so the border and
           padding have to sit inside that width rather than add to it. */
        box-sizing: border-box;
        padding: var(--fluid-time-picker-listbox-padding, var(--fluid-space-1));
        max-height: var(--fluid-time-picker-listbox-max-height, 16rem);
        /*
       * overflow: hidden auto, never a horizontal scrollbar, only a vertical
       * one when the content actually overflows max-height. Setting just
       * overflow-y: auto makes the UA compute overflow-x as auto too (per
       * spec), which draws a spurious horizontal scrollbar whenever sub-pixel
       * rounding nudges an option past the listbox width by even 1px.
       */
        overflow: hidden auto;
        scrollbar-width: thin;
        scrollbar-color: var(
            --fluid-time-picker-border-strong,
            var(--fluid-border-strong, color-mix(in srgb, currentColor 25%, transparent))
          )
          transparent;
        list-style: none;
        background: var(--fluid-time-picker-listbox-bg, var(--fluid-surface-base));
        border: var(--fluid-field-border-width, 1px) solid
          var(--fluid-time-picker-border-default, var(--fluid-border-default));
        /* Same radius as the field: the two halves have to agree on the corner
           they share, or the fused shape reads as two stacked panels. */
        border-radius: var(
          --fluid-time-picker-listbox-radius,
          var(--fluid-time-picker-radius, var(--fluid-field-border-radius, var(--fluid-radius-md)))
        );
        box-shadow: var(
          --fluid-time-picker-listbox-shadow,
          var(--fluid-shadow-lg, 0 12px 32px -8px rgba(0, 0, 0, 0.25))
        );
        opacity: 0;
        /* Fade only. A scale-in would peel the listbox off the seam it is
           welded to for the length of the transition. */
        transition:
          opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          overlay calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete,
          display calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete;
      }
      .listbox:popover-open {
        opacity: 1;
        transform: scale(1);
      }
      @starting-style {
        .listbox:popover-open {
          opacity: 0;
          transform: scale(0.97);
        }
      }
      .option {
        position: relative;
        display: flex;
        align-items: center;
        min-height: max(1.75rem, var(--fluid-target-min, 0px));
        padding: 0 0.6rem;
        border-radius: var(--fluid-radius-sm, 4px);
        font-size: var(--fluid-font-size-sm);
        color: var(--fluid-time-picker-option-fg, var(--fluid-text-primary));
        cursor: pointer;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      /*
       * Option states follow fluid-option (used by fluid-select and matched by
       * typeahead) so every listbox in the system reads the same: an 8% accent
       * tint plus a 2px accent rail for the keyboard-active row, and a 16%
       * tint with primary text for the selected one. The previous neutral-grey
       * active row and solid accent fill made this popup look like a native OS
       * select rather than a Fluid listbox.
       */
      .option.active {
        background: var(
          --fluid-time-picker-option-active-bg,
          color-mix(in srgb, var(--fluid-accent-base) 8%, transparent)
        );
      }
      .option.active::before {
        content: "";
        position: absolute;
        inset-inline-start: 0;
        top: var(--fluid-time-picker-option-active-rail-inset, 4px);
        bottom: var(--fluid-time-picker-option-active-rail-inset, 4px);
        width: var(--fluid-time-picker-option-active-rail-width, 2px);
        background: var(--fluid-time-picker-option-active-rail, var(--fluid-accent-base));
        border-radius: var(--fluid-radius-full);
      }
      .option[aria-selected="true"] {
        background: var(
          --fluid-time-picker-option-selected-bg,
          color-mix(in srgb, var(--fluid-accent-base) 16%, transparent)
        );
        color: var(--fluid-time-picker-option-selected-fg, var(--fluid-text-primary));
        font-weight: var(
          --fluid-time-picker-option-selected-font-weight,
          var(--fluid-font-weight-medium)
        );
      }
      /*
       * Fuse the field and the listbox into one shape while open, matching
       * fluid-select: the joined edge loses its corners and the listbox drops
       * the duplicated border so the seam is a single stroke. Without this the
       * popup reads as an unrelated panel floating under the field.
       */
      /*
       * While fused, the field's focus ring has to go. An outline follows the
       * border box, so it would draw a hard line straight across the seam and
       * cut the one shape back into two. The accent border below carries the
       * focus state instead, and it runs around the whole fused shape rather
       * than stopping at the field, the way a single outline would.
       */
      :host([open]) .base:focus-within {
        outline: none;
      }
      :host([open]) .listbox {
        border-color: var(--fluid-time-picker-border-focus, var(--fluid-accent-base));
      }

      :host([open][data-placement="bottom"]) .base {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      :host([open][data-placement="bottom"]) .listbox {
        border-top: 0;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
      :host([open][data-placement="top"]) .base {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
      :host([open][data-placement="top"]) .listbox {
        border-bottom: 0;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .empty {
        padding: 0.5rem 0.6rem;
        font-size: var(--fluid-font-size-sm);
        color: var(--fluid-time-picker-text-secondary, var(--fluid-text-secondary));
      }
    `
  ];

  /** Canonical 24h "HH:MM" value (the form value). */
  @property() override value: string | null = null;

  /** Field name for form submission. */
  @property() override name = "";

  /** Earliest selectable time, 24h "HH:MM". */
  @property() min = "00:00";

  /** Latest selectable time, 24h "HH:MM". */
  @property() max = "23:59";

  /** Step between generated options, in minutes. */
  @property({ type: Number }) step = 15;

  /** Display format for the field + options. The form value stays 24h. */
  @property() format: FluidTimeFormat = "24h";

  /** BCP-47 locale for display labels. Defaults to inherited language. */
  @property() locale: string | undefined = undefined;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required: the form is invalid when no time is chosen. */
  @property({ type: Boolean }) required = false;

  /** Field size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Placeholder when no time is selected. */
  @property()
  get placeholder(): string {
    return this.placeholderOverride ?? this.term("selectTime");
  }
  set placeholder(value: string | null) {
    this.placeholderOverride = value;
  }
  private placeholderOverride: string | null = null;

  /** Whether the listbox popover is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Open the time options when the text input is clicked. */
  /**
   * Prevent clicking the field from opening the picker.
   *
   * Opening on click is the default so the text and the trigger button offer
   * the same thing. Set this when the picker should only open from its
   * trigger button or from ArrowDown.
   */
  @property({ type: Boolean, attribute: "no-auto-open" }) noAutoOpen = false;

  /**
   * Prevent focusing the field from selecting its current value.
   *
   * Selecting is the default so one click is enough to type or paste a
   * replacement instead of having to clear the field first.
   */
  @property({ type: Boolean, attribute: "no-select-on-focus" }) noSelectOnFocus = false;

  /** Live text in the input (drives type-to-filter). */
  @state() private typed = "";

  /**
   * True only while the typed text is a user-entered filter.
   *
   * `typed` also mirrors the committed value so the field shows it, which
   * meant opening a picker that already had a value filtered the list down to
   * that single option: you could never see the others without clearing the
   * field first. Filtering therefore starts on input and stops whenever the
   * text goes back to mirroring the value.
   */
  private filtering = false;

  /** Index of the active option in the filtered list, or -1. */
  @state() private activeIndex = -1;

  @query("input") private inputEl!: HTMLInputElement;

  /** Visible label rendered above the field (a real label/for association). */
  @property() label = "";

  /** Help text rendered below the field, announced via aria-describedby. */
  @property({ attribute: "help-text" }) helpText = "";
  @query(".trigger") private triggerEl!: HTMLButtonElement;
  @query(".listbox") private listboxEl!: HTMLElement;

  private cleanup?: () => void;
  private listboxId = `fluid-time-picker-${++counter}`;
  private defaultValue: string | null = null;
  private lastDisplayText = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaultValue = this.value;
    if (this.value) this.syncFormValue();
    this.listen(document, "pointerdown", this.onDocPointerDown, { capture: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup?.();
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  /** All options generated from min / max / step. */
  private get allOptions(): TimeOption[] {
    const start = toMinutes(this.min) ?? 0;
    const end = toMinutes(this.max) ?? 23 * 60 + 59;
    const step = Math.max(1, Math.floor(this.step));
    const out: TimeOption[] = [];
    for (let m = start; m <= end; m += step) {
      const value = toHHMM(m);
      out.push({
        value,
        label: formatLabel(value, this.format, this.displayLocale),
        id: `${this.listboxId}-opt-${m}`
      });
    }
    return out;
  }

  /** Options matching the current typed filter. */
  private get filteredOptions(): TimeOption[] {
    if (!this.filtering) return this.allOptions;
    const q = this.typed.trim().toLowerCase();
    if (!q) return this.allOptions;
    return this.allOptions.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q));
  }

  private get displayText(): string {
    return this.value ? formatLabel(this.value, this.format, this.displayLocale) : "";
  }

  /** Explicit locale wins; otherwise time display follows the reactive language context. */
  private get displayLocale(): string | undefined {
    const locale = this.locale === undefined ? this.localize.locale : this.locale;
    if (locale === "") return undefined;
    try {
      Intl.getCanonicalLocales(locale);
      return locale;
    } catch {
      return this.locale === undefined ? "en" : undefined;
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    const displayText = this.displayText;
    if (
      changed.has("value") ||
      changed.has("format") ||
      changed.has("locale") ||
      this.typed === this.lastDisplayText
    ) {
      this.typed = displayText;
      this.filtering = false;
    }
    this.lastDisplayText = displayText;
    if (changed.has("value")) {
      this.syncFormValue();
    }
    if (changed.has("open")) {
      if (!this.open) this.removeAttribute("data-placement");
      if (this.open) {
        const opts = this.filteredOptions;
        const selectedIdx = this.value ? opts.findIndex((o) => o.value === this.value) : -1;
        this.activeIndex = selectedIdx >= 0 ? selectedIdx : opts.length > 0 ? 0 : -1;
      } else this.activeIndex = -1;
    }
  }

  protected override updated(changed: PropertyValues): void {
    // Native form validation needs the rendered input as its focus anchor.
    // Refresh localized text on every update without discarding custom errors.
    if (this.required && !this.value) {
      this.setValidity({ valueMissing: true }, this.term("chooseTimeRequired"), this.inputEl);
    } else {
      this.setValidity({});
    }
    if (changed.has("open")) {
      if (this.open) void this.openListbox();
      else this.closeListbox();
    }
    if (changed.has("activeIndex") && this.open) {
      this.scrollActiveIntoView();
    }
  }

  override formResetCallback(): void {
    this.value = this.defaultValue;
    this.open = false;
  }
  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }
  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  private commit(value: string | null): void {
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value },
        bubbles: true,
        composed: true
      })
    );
  }

  private async openListbox(): Promise<void> {
    if (!this.listboxEl || !this.triggerEl) return;
    this.dispatchEvent(new CustomEvent("fluid-open", { bubbles: true, composed: true }));
    const popover = this.listboxEl as HTMLElement & { showPopover?: () => void };
    try {
      popover.showPopover?.();
    } catch {
      /* already shown or unsupported, ignore */
    }
    this.cleanup = autoUpdate(this.base, this.listboxEl, () => void this.reposition());
    await this.reposition();
    requestAnimationFrame(() => this.scrollActiveIntoView());
  }

  private closeListbox(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    const popover = this.listboxEl as HTMLElement & { hidePopover?: () => void };
    try {
      popover?.hidePopover?.();
    } catch {
      /* not shown, ignore */
    }
    this.dispatchEvent(new CustomEvent("fluid-close", { bubbles: true, composed: true }));
  }

  private get base(): HTMLElement {
    return this.renderRoot.querySelector(".base") as HTMLElement;
  }

  private async reposition(): Promise<void> {
    if (!this.base || !this.listboxEl) return;
    const { x, y, placement } = await computePosition(this.base, this.listboxEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [
        // No gap: the listbox sits flush against the field so the two read as
        // one shape, the way fluid-select fuses its trigger and listbox.
        offset(0),
        flip(),
        shift({ padding: 8 }),
        // Match the field's width exactly. A listbox that grows to its longest
        // label reads as a separate floating panel rather than a continuation
        // of the field the joined borders are drawing.
        size({
          apply: ({ rects, elements }) => {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`
            });
          }
        })
      ]
    });
    Object.assign(this.listboxEl.style, { left: `${x}px`, top: `${y}px` });
    // Drives the fusing rules: which edge is the seam.
    this.setAttribute("data-placement", placement.startsWith("top") ? "top" : "bottom");
  }

  private scrollActiveIntoView(): void {
    if (this.activeIndex < 0) return;
    const el = this.listboxEl?.querySelectorAll<HTMLElement>(".option")[this.activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }

  private onDocPointerDown = (e: Event): void => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) this.open = false;
  };

  private toggle(): void {
    if (this.disabled) return;
    if (!this.open) this.filtering = false;
    this.open = !this.open;
  }

  /**
   * Focusing the field opens the picker and selects the current value, so a
   * click on the text offers the same thing a click on the trigger does and
   * the value is immediately replaceable.
   *
   * The selection is deferred a frame because the browser places the caret
   * after this event, which would otherwise drop a selection made here.
   */
  /**
   * Opening is driven by a click on the field rather than by focus. Focus also
   * arrives from constraint validation, from an overlay above the field
   * closing, and from any programmatic .focus(), none of which are a request
   * to see the options, and opening there strands the user in a surface they
   * never asked for. Keyboard users open with ArrowDown, per the APG combobox
   * pattern.
   */
  private onInputClick = (): void => {
    if (this.disabled || this.noAutoOpen) return;
    this.open = true;
  };

  /**
   * Focusing the field selects its current value, so one click is enough to
   * type or paste a replacement instead of having to clear the field first.
   *
   * Deferred a frame because the browser places the caret after this event,
   * which would otherwise drop a selection made here.
   */
  private onInputFocus = (): void => {
    if (this.disabled || this.suppressFocusSelect || this.noSelectOnFocus) return;
    requestAnimationFrame(() => {
      if (
        this.inputEl &&
        this.renderRoot instanceof ShadowRoot &&
        this.renderRoot.activeElement === this.inputEl
      ) {
        this.inputEl.select();
      }
    });
  };

  private moveActive(delta: number): void {
    const opts = this.filteredOptions;
    if (opts.length === 0) {
      this.activeIndex = -1;
      return;
    }
    const next =
      this.activeIndex < 0 ? (delta > 0 ? 0 : opts.length - 1) : this.activeIndex + delta;
    this.activeIndex = Math.max(0, Math.min(opts.length - 1, next));
  }

  private onInputKeydown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this.open) this.open = true;
        else this.moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!this.open) this.open = true;
        else this.moveActive(-1);
        break;
      case "Home":
        if (this.open) {
          e.preventDefault();
          this.activeIndex = this.filteredOptions.length > 0 ? 0 : -1;
        }
        break;
      case "End":
        if (this.open) {
          e.preventDefault();
          this.activeIndex = this.filteredOptions.length - 1;
        }
        break;
      case "Enter": {
        e.preventDefault();
        const opts = this.filteredOptions;
        const opt = this.activeIndex >= 0 ? opts[this.activeIndex] : undefined;
        if (this.open && opt) {
          this.commit(opt.value);
          this.open = false;
        } else {
          this.commitTyped();
        }
        break;
      }
      case "Escape":
        if (this.open) {
          e.preventDefault();
          this.open = false;
        }
        break;
      default:
        break;
    }
  };

  private onInput = (e: Event): void => {
    this.filtering = true;
    this.typed = (e.target as HTMLInputElement).value;
    if (!this.open) this.open = true;
    // Re-seed the active option against the new filter.
    this.activeIndex = this.filteredOptions.length > 0 ? 0 : -1;
  };

  /** Parse the typed text (a display label or canonical value) and commit if it maps to an option. */
  private commitTyped(): void {
    const text = this.typed.trim();
    if (!text) {
      this.commit(null);
      return;
    }
    const lower = text.toLowerCase();
    const match =
      this.allOptions.find((o) => o.label.toLowerCase() === lower) ??
      this.allOptions.find((o) => o.value === text) ??
      this.allOptions.find((o) => o.label.toLowerCase().startsWith(lower));
    if (match) this.commit(match.value);
    else {
      this.typed = this.displayText; // revert
      this.filtering = false;
    }
  }

  private suppressFocusSelect = false;

  /**
   * Return focus to the field without re-selecting its text. Closing the
   * popover hands focus back to the input, and that is a continuation of the
   * interaction the user just finished rather than a fresh arrival at the
   * field, so it should not grab the value again.
   */
  private refocusInput(): void {
    this.suppressFocusSelect = true;
    this.inputEl?.focus();
    this.suppressFocusSelect = false;
  }

  private onOptionClick(opt: TimeOption): void {
    this.commit(opt.value);
    this.open = false;
    this.refocusInput();
  }

  override render(): TemplateResult {
    const opts = this.filteredOptions;
    const active = this.activeIndex >= 0 ? opts[this.activeIndex] : undefined;
    return renderFieldChrome(
      { label: this.label, helpText: this.helpText, for: "input" },
      html`
        <div part="base" class="base">
          <input
            id="input"
            part="input"
            type="text"
            .value=${this.typed}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            aria-haspopup="listbox"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls=${this.listboxId}
            aria-describedby=${ifDefined(fieldHelpDescribedBy(this.helpText))}
            aria-activedescendant=${this.open && active ? active.id : ""}
            @click=${this.onInputClick}
            @focus=${this.onInputFocus}
            @input=${this.onInput}
            @change=${this.commitTyped}
            @keydown=${this.onInputKeydown}
          />
          <button
            part="trigger"
            class="trigger"
            type="button"
            tabindex="-1"
            aria-label=${this.term("chooseTime")}
            aria-haspopup="listbox"
            aria-expanded=${this.open ? "true" : "false"}
            ?disabled=${this.disabled}
            @click=${() => this.toggle()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 2"></path>
            </svg>
          </button>
        </div>

        <ul
          part="listbox"
          id=${this.listboxId}
          class="listbox"
          role="listbox"
          aria-label=${this.term("timeOptions")}
          popover="manual"
        >
          ${opts.length === 0
            ? html`<li class="empty" role="presentation">${this.term("noMatchingTimes")}</li>`
            : opts.map(
                (opt, i) => html`
                  <li
                    part="option"
                    class="option ${i === this.activeIndex ? "active" : ""}"
                    id=${opt.id}
                    role="option"
                    aria-selected=${opt.value === this.value ? "true" : "false"}
                    @click=${() => this.onOptionClick(opt)}
                    @pointermove=${() => (this.activeIndex = i)}
                  >
                    ${opt.label}
                  </li>
                `
              )}
        </ul>
      `
    );
  }
}
