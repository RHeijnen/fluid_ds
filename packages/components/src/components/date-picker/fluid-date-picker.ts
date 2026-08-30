import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { autoUpdate, computePosition, flip, offset, shift } from "../../internal/position.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";
import {
  fieldChromeStyles,
  fieldHelpDescribedBy,
  renderFieldChrome
} from "../../internal/field-chrome.js";
import "../calendar/define.js";
import type { FluidCalendar } from "../calendar/fluid-calendar.js";
import {
  type Weekday,
  fromISODate,
  toISODate,
  formatDate,
  clampDate,
  inRange
} from "../../internal/date-utils.js";

type DisplayFormat = "short" | "medium" | "long" | "numeric" | "iso";

/** Map the friendly `format` to Intl options (or null = emit the raw ISO). */
function formatOptions(format: DisplayFormat): Intl.DateTimeFormatOptions | null {
  switch (format) {
    case "iso":
      return null;
    case "numeric":
      return { year: "numeric", month: "2-digit", day: "2-digit" };
    case "short":
      return { dateStyle: "short" };
    case "long":
      return { dateStyle: "long" };
    default:
      return { dateStyle: "medium" };
  }
}

let counter = 0;

/**
 * A single-date picker: a form-associated text field that opens an accessible
 * fluid-calendar in a popover dialog.
 *
 * The form/`value` is always an ISO `YYYY-MM-DD` string (timezone-safe,
 * date-only). The visible text is controlled by `format` (default "medium"),
 * and `fluid-change` carries `{ value, date, timestamp }` so consumers can read
 * whatever shape they need.
 *
 * Accessibility: WAI-ARIA APG Date Picker Dialog. The field stays a normal
 * text input (type to set a date); a "Choose date" button (`aria-haspopup`,
 * `aria-expanded`) opens a `role="dialog"` holding the grid. ArrowDown in the
 * field opens + focuses the calendar; Esc closes and returns focus.
 *
 * @summary Pick a single date.
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
 * @csspart trigger - The calendar toggle button.
 * @csspart dialog - The popover dialog holding the calendar.
 * @csspart calendar - The inner fluid-calendar.
 *
 * @cssproperty --fluid-date-picker-bg - Field background. Falls back to --fluid-input-bg → --fluid-surface-base.
 * @cssproperty --fluid-date-picker-fg - Field text. Falls back to --fluid-input-fg → --fluid-text-primary.
 * @cssproperty --fluid-date-picker-border - Field border color. Falls back to --fluid-input-border → --fluid-border-default.
 * @cssproperty --fluid-date-picker-border-focus - Focused border. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-date-picker-radius - Field corner radius. Falls back to --fluid-field-border-radius → --fluid-radius-md.
 * @cssproperty --fluid-date-picker-dialog-bg - Popover background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-date-picker-dialog-shadow - Popover elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-date-picker-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Field + dialog background.
 * @uses-token --fluid-text-primary - Field text.
 * @uses-token --fluid-border-default - Field border.
 * @uses-token --fluid-accent-base - Focus border + ring.
 * @uses-token --fluid-field-border-radius - Field radius.
 * @uses-token --fluid-field-height-md - Field height.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Trigger min target (24/44px).
 * @uses-token --fluid-font-size-sm - Text size at size="sm".
 * @uses-token --fluid-font-size-md - Text size at size="md".
 * @uses-token --fluid-font-size-lg - Text size at size="lg".
 *
 * @fires fluid-change - The committed date changed. `detail: { value, date, timestamp }`.
 * @fires fluid-open - The calendar opened.
 * @fires fluid-close - The calendar closed.
 * @cssproperty --fluid-date-picker-accent-base - Component override for the corresponding semantic token.
 * @cssproperty --fluid-date-picker-border-default - Component override for the corresponding semantic token.
 * @cssproperty --fluid-date-picker-text-primary - Component override for the corresponding semantic token.
 * @cssproperty --fluid-date-picker-text-secondary - Component override for the corresponding semantic token.
 */
export class FluidDatePicker extends FluidFormAssociated {
  static override formAssociated = true;
  static override shadowRootOptions: ShadowRootInit = {
    ...FluidFormAssociated.shadowRootOptions,
    delegatesFocus: true
  };

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
        font-family: var(--fluid-date-picker-font-family, var(--fluid-font-family-sans));
      }
      :host([disabled]) {
        opacity: 0.6;
        pointer-events: none;
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
        background: var(--fluid-date-picker-bg, var(--fluid-input-bg, var(--fluid-surface-base)));
        color: var(--fluid-date-picker-fg, var(--fluid-input-fg, var(--fluid-text-primary)));
        border: var(--fluid-field-border-width, 1px) solid
          var(--fluid-date-picker-border, var(--fluid-input-border, var(--fluid-border-default)));
        border-radius: var(
          --fluid-date-picker-radius,
          var(--fluid-field-border-radius, var(--fluid-radius-md))
        );
        transition:
          border-color 120ms ease,
          box-shadow 120ms ease;
      }
      /* Font scales with the size, as it does on every other field. Sized by
         height alone, a sm picker kept the md text and read a size larger than
         the input beside it — see fluid-date-range-picker. */
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
        border-color: var(--fluid-date-picker-border-focus, var(--fluid-accent-base));
        outline: var(--fluid-date-picker-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid
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
          var(--fluid-date-picker-text-secondary, var(--fluid-text-secondary))
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
        color: var(--fluid-date-picker-text-secondary, var(--fluid-text-secondary));
        cursor: pointer;
      }
      .trigger:hover {
        color: var(--fluid-date-picker-text-primary, var(--fluid-text-primary));
      }
      .trigger:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-date-picker-accent-base, var(--fluid-accent-base));
        outline-offset: 1px;
      }
      /* Rendered in the top layer via popover="manual" so it is never clipped
         by an ancestor's overflow / transform / contain. the positioning engine still
         drives placement. */
      .dialog {
        position: fixed;
        inset: auto;
        top: 0;
        left: 0;
        z-index: 1000;
        margin: 0;
        padding: 0.65rem;
        background: var(--fluid-date-picker-dialog-bg, var(--fluid-surface-base));
        border: 1px solid var(--fluid-date-picker-border-default, var(--fluid-border-default));
        border-radius: var(--fluid-radius-lg, 0.75rem);
        box-shadow: var(
          --fluid-date-picker-dialog-shadow,
          var(--fluid-shadow-lg, 0 12px 32px -8px rgba(0, 0, 0, 0.25))
        );
        opacity: 0;
        transform: scale(0.97);
        transform-origin: top left;
        transition:
          opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          transform calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          overlay calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete,
          display calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete;
      }
      .dialog:popover-open {
        opacity: 1;
        transform: scale(1);
      }
      @starting-style {
        .dialog:popover-open {
          opacity: 0;
          transform: scale(0.97);
        }
      }
      svg {
        width: 1.1em;
        height: 1.1em;
      }
    `
  ];

  /** ISO `YYYY-MM-DD` value (form value). */
  @property() override value: string | null = null;

  /** Field name for form submission. */
  @property() override name = "";

  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readonly = false;
  @property()
  get placeholder(): string {
    return this.placeholderOverride ?? this.term("selectDate");
  }
  set placeholder(value: string | null) {
    this.placeholderOverride = value;
  }
  private placeholderOverride: string | null = null;

  /** Earliest selectable date, `YYYY-MM-DD`. */
  @property() min: string | null = null;
  /** Latest selectable date, `YYYY-MM-DD`. */
  @property() max: string | null = null;

  /** First weekday: 0 = Sunday … 6 = Saturday (default Monday). */
  @property({ type: Number, attribute: "week-start" }) weekStart: Weekday = 1;

  /** BCP-47 locale for display + the grid. */
  @property() locale: string | undefined = undefined;

  /** Visible text format. Value/form stays ISO regardless. */
  @property() format: DisplayFormat = "medium";

  /** Field size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Whether the calendar popover is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Open the calendar when the text input is clicked. */
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

  @state() private typed = "";

  @query("input") private inputEl!: HTMLInputElement;

  /** Visible label rendered above the field (a real label/for association). */
  @property() label = "";

  /** Help text rendered below the field, announced via aria-describedby. */
  @property({ attribute: "help-text" }) helpText = "";
  @query(".trigger") private triggerEl!: HTMLButtonElement;
  @query(".dialog") private dialogEl!: HTMLElement;
  @query("fluid-calendar") private calendarEl?: FluidCalendar;

  private cleanup?: () => void;
  private dialogId = `fluid-datepicker-${++counter}`;
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

  /** Visible text for the current value. */
  private get displayText(): string {
    const d = fromISODate(this.value);
    if (!d) return "";
    const opts = formatOptions(this.format);
    return opts ? formatDate(d, this.displayLocale, opts) : this.value!;
  }

  /** Explicit locale wins; otherwise date display follows the reactive language context. */
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
    if (changed.has("value") || this.typed === this.lastDisplayText) {
      this.typed = displayText;
    }
    this.lastDisplayText = displayText;
    if (changed.has("value")) {
      this.syncFormValue();
    }
    this.refreshValidity();
  }

  protected override firstUpdated(): void {
    // The first client render supplies the native validation focus anchor.
    this.refreshValidity();
  }

  private refreshValidity(): void {
    const missing = this.required && !this.value;
    this.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? this.term("chooseDateRequired") : undefined,
      this.inputEl ?? undefined
    );
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) void this.openDialog();
      else this.closeDialog();
    }
  }

  override formResetCallback(): void {
    this.value = this.defaultValue;
    this.open = false;
  }
  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  private commit(iso: string | null): void {
    this.value = iso;
    const d = iso ? fromISODate(iso) : null;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: iso, date: d, timestamp: d ? d.getTime() : null },
        bubbles: true,
        composed: true
      })
    );
  }

  private async openDialog(): Promise<void> {
    if (!this.dialogEl || !this.triggerEl) return;
    this.dispatchEvent(new CustomEvent("fluid-open", { bubbles: true, composed: true }));
    const dialog = this.dialogEl as HTMLElement & { showPopover?: () => void };
    try {
      dialog.showPopover?.();
    } catch {
      /* already shown or unsupported, ignore */
    }
    this.cleanup = autoUpdate(this.base, this.dialogEl, () => this.reposition());
    await this.reposition();
    requestAnimationFrame(() => {
      // Move keyboard focus into the grid.
      const focusBtn =
        this.calendarEl?.shadowRoot?.querySelector<HTMLButtonElement>(".day[tabindex='0']");
      focusBtn?.focus();
    });
  }

  private closeDialog(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    const dialog = this.dialogEl as HTMLElement & { hidePopover?: () => void };
    try {
      dialog?.hidePopover?.();
    } catch {
      /* not shown, ignore */
    }
    this.dispatchEvent(new CustomEvent("fluid-close", { bubbles: true, composed: true }));
  }

  private get base(): HTMLElement {
    return this.renderRoot.querySelector(".base") as HTMLElement;
  }

  private async reposition(): Promise<void> {
    if (!this.base || !this.dialogEl) return;
    const { x, y } = await computePosition(this.base, this.dialogEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(6), flip(), shift({ padding: 8 })]
    });
    Object.assign(this.dialogEl.style, { left: `${x}px`, top: `${y}px` });
  }

  private onDocPointerDown = (e: Event): void => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) this.open = false;
  };

  private toggle(): void {
    if (this.disabled || this.readonly) return;
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

  /**
   * Opening is driven by a click on the field rather than by focus. Focus also
   * arrives from constraint validation, from an overlay above the field
   * closing, and from any programmatic .focus(), none of which are a request
   * to see the options, and opening there strands the user in a surface they
   * never asked for. Keyboard users open with ArrowDown, per the APG combobox
   * pattern.
   */
  private onInputClick = (): void => {
    if (this.disabled || this.readonly || this.noAutoOpen) return;
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
    if (this.disabled || this.readonly || this.suppressFocusSelect || this.noSelectOnFocus) return;
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

  private onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key === "ArrowDown" && !this.open) {
      e.preventDefault();
      this.open = true;
    } else if (e.key === "Escape" && this.open) {
      e.preventDefault();
      this.open = false;
      this.refocusInput();
    } else if (e.key === "Enter") {
      this.commitTyped();
    }
  };

  /** Parse the typed text (ISO or a locale string) and commit if valid. */
  private commitTyped(): void {
    const text = this.typed.trim();
    if (!text) {
      this.commit(null);
      return;
    }
    let d = fromISODate(text);
    if (!d) {
      const parsed = new Date(text);
      if (!isNaN(parsed.getTime()))
        d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
    const min = fromISODate(this.min);
    const max = fromISODate(this.max);
    if (d && inRange(d, min, max)) this.commit(toISODate(clampDate(d, min, max)));
    else this.typed = this.displayText; // revert
  }

  private onCalendarActivate = (e: Event): void => {
    const iso = (e as CustomEvent).detail?.iso as string;
    this.commit(iso);
    this.open = false;
    this.refocusInput();
  };

  private onDialogKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.open = false;
      this.refocusInput();
    }
  };

  override render(): TemplateResult {
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
            ?readonly=${this.readonly}
            role="combobox"
            aria-haspopup="dialog"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls=${this.dialogId}
            aria-describedby=${ifDefined(fieldHelpDescribedBy(this.helpText))}
            @click=${this.onInputClick}
            @focus=${this.onInputFocus}
            @input=${(e: Event) => (this.typed = (e.target as HTMLInputElement).value)}
            @change=${this.commitTyped}
            @keydown=${this.onInputKeydown}
          />
          <button
            part="trigger"
            class="trigger"
            type="button"
            aria-label=${this.term("chooseDate")}
            aria-haspopup="dialog"
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
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2"></rect>
              <path d="M16 2v4M8 2v4M3 10h18"></path>
            </svg>
          </button>
        </div>

        <div
          part="dialog"
          id=${this.dialogId}
          class="dialog"
          role="dialog"
          aria-label=${this.term("chooseDate")}
          popover="manual"
          @keydown=${this.onDialogKeydown}
        >
          <fluid-calendar
            part="calendar"
            .value=${this.value}
            min=${this.min ?? ""}
            max=${this.max ?? ""}
            week-start=${this.weekStart}
            .locale=${this.locale}
            @fluid-date-activate=${this.onCalendarActivate}
          ></fluid-calendar>
        </div>
      `
    );
  }
}
