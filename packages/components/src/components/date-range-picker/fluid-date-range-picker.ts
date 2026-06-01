import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";
import "../calendar/define.js";
import {
  type Weekday,
  type RangePreset,
  defaultRangePresets,
  matchPreset,
  fromISODate,
  toISODate,
  formatDate,
  compareDay,
  addMonths
} from "../../internal/date-utils.js";

type DisplayFormat = "short" | "medium" | "long" | "numeric" | "iso";

function fmtOpts(format: DisplayFormat): Intl.DateTimeFormatOptions | null {
  switch (format) {
    case "iso": return null;
    case "numeric": return { year: "numeric", month: "2-digit", day: "2-digit" };
    case "short": return { dateStyle: "short" };
    case "long": return { dateStyle: "long" };
    default: return { dateStyle: "medium" };
  }
}

let counter = 0;

/**
 * A date-range picker: a form-associated field that opens a popover with a
 * preset column, two month grids (fluid-calendar), and Apply / Cancel.
 *
 * `start` and `end` are ISO `YYYY-MM-DD` (timezone-safe). The form value is the
 * ISO interval `start/end`. `fluid-change` carries
 * `{ start, end, startDate, endDate }`. Presets default to a sensible list,
 * are fully customizable via `.presets`, and can be turned off with `no-presets`.
 *
 * Accessibility: WAI-ARIA APG Date Picker Dialog over two grids. Each grid is a
 * full keyboard `role="grid"` (see fluid-calendar). Esc closes and restores
 * focus; the preset column is a labeled list of buttons.
 *
 * @summary Pick a start + end date.
 *
 * @csspart base - The field container.
 * @csspart input - The text input.
 * @csspart trigger - The calendar toggle button.
 * @csspart dialog - The popover.
 * @csspart presets - The preset column.
 * @csspart calendars - The two-month grid wrapper.
 * @csspart footer - The selected-range + actions row.
 *
 * @cssproperty --fluid-date-range-picker-bg - Field background. Falls back to --fluid-input-bg → --fluid-surface-base.
 * @cssproperty --fluid-date-range-picker-border - Field border. Falls back to --fluid-input-border → --fluid-border-default.
 * @cssproperty --fluid-date-range-picker-dialog-bg - Popover background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-date-range-picker-preset-active-bg - Active preset fill. Falls back to a 15% accent tint.
 * @cssproperty --fluid-date-range-picker-radius - Field radius. Falls back to --fluid-field-border-radius → --fluid-radius-md.
 *
 * @uses-token --fluid-surface-base - Field + dialog background.
 * @uses-token --fluid-surface-muted - Preset hover.
 * @uses-token --fluid-text-primary - Field text.
 * @uses-token --fluid-border-default - Borders.
 * @uses-token --fluid-accent-base - Focus + active preset.
 * @uses-token --fluid-field-border-radius - Field radius.
 * @uses-token --fluid-field-height-md - Field height.
 * @uses-token --fluid-focus-ring-width - Focus ring width.
 * @uses-token --fluid-target-min - Min target size.
 *
 * @fires fluid-change - The range was applied. `detail: { start, end, startDate, endDate }`.
 * @fires fluid-open - The popover opened.
 * @fires fluid-close - The popover closed.
 */
export class FluidDateRangePicker extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    css`
      :host { display: inline-block; font-family: var(--fluid-font-family-sans); }
      :host([disabled]) { opacity: 0.6; pointer-events: none; }
      .base {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        min-width: 16rem;
        height: var(--fluid-field-height-md, 2.5rem);
        padding-inline: var(--fluid-field-padding-x-md, 0.75rem);
        background: var(--fluid-date-range-picker-bg, var(--fluid-input-bg, var(--fluid-surface-base)));
        color: var(--fluid-input-fg, var(--fluid-text-primary));
        border: var(--fluid-field-border-width, 1px) solid
          var(--fluid-date-range-picker-border, var(--fluid-input-border, var(--fluid-border-default)));
        border-radius: var(--fluid-date-range-picker-radius, var(--fluid-field-border-radius, var(--fluid-radius-md)));
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      :host([size="sm"]) .base { height: var(--fluid-field-height-sm, 2rem); }
      :host([size="lg"]) .base { height: var(--fluid-field-height-lg, 3rem); }
      .base:focus-within {
        border-color: var(--fluid-accent-base);
        outline: var(--fluid-focus-ring-width, 2px) solid color-mix(in srgb, var(--fluid-accent-base) 35%, transparent);
      }
      input {
        flex: 1; min-width: 10rem; border: 0; outline: none; background: transparent;
        color: inherit; font: inherit; padding: 0;
      }
      input::placeholder { color: var(--fluid-input-placeholder-fg, var(--fluid-text-secondary)); }
      .trigger {
        display: inline-grid; place-items: center;
        min-width: max(1.5rem, var(--fluid-target-min, 0px));
        min-height: max(1.5rem, var(--fluid-target-min, 0px));
        margin-inline-end: -0.25rem;
        border: 0; border-radius: var(--fluid-radius-sm, 4px); background: transparent;
        color: var(--fluid-text-secondary); cursor: pointer;
      }
      .trigger:hover { color: var(--fluid-text-primary); }
      .trigger:focus-visible { outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base); outline-offset: 1px; }
      svg { width: 1.1em; height: 1.1em; }

      /* Rendered in the top layer via popover="manual" so it is never clipped
         by an ancestor's overflow / transform / contain (a plain position:fixed
         can still be trapped by a transformed containing block). floating-ui
         left/top still drive placement. */
      .dialog {
        position: fixed; inset: auto; top: 0; left: 0; z-index: 1000; margin: 0;
        background: var(--fluid-date-range-picker-dialog-bg, var(--fluid-surface-base));
        border: 1px solid var(--fluid-border-default);
        border-radius: var(--fluid-radius-lg, 0.75rem);
        box-shadow: var(--fluid-shadow-lg, 0 12px 32px -8px rgba(0, 0, 0, 0.25));
        opacity: 0; transform: scale(0.97); transform-origin: top left;
        transition:
          opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          transform calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          overlay calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete,
          display calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) allow-discrete;
      }
      .dialog:popover-open { display: flex; opacity: 1; transform: scale(1); }
      @starting-style {
        .dialog:popover-open { opacity: 0; transform: scale(0.97); }
      }
      .presets {
        display: flex; flex-direction: column; gap: 0.15rem;
        padding: 0.65rem; min-width: 9rem;
        border-right: 1px solid var(--fluid-border-default);
      }
      .preset {
        text-align: left; padding: 0.4rem 0.6rem; border: 0; border-radius: var(--fluid-radius-md, 6px);
        background: transparent; color: inherit; font: inherit; cursor: pointer;
        min-height: max(1.75rem, var(--fluid-target-min, 0px));
      }
      .preset:hover { background: var(--fluid-surface-muted); }
      .preset[aria-pressed="true"] {
        background: var(--fluid-date-range-picker-preset-active-bg, color-mix(in srgb, var(--fluid-accent-base) 15%, transparent));
        color: var(--fluid-accent-base);
        font-weight: 600;
      }
      .preset:focus-visible { outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base); outline-offset: 1px; }
      .right { display: flex; flex-direction: column; }
      .cal-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0.65rem 0.65rem 0;
      }
      .nav-button {
        display: inline-grid; place-items: center;
        min-width: max(1.75rem, var(--fluid-target-min, 0px));
        min-height: max(1.75rem, var(--fluid-target-min, 0px));
        border: 0; border-radius: var(--fluid-radius-md, 6px); background: transparent; color: inherit;
        font: inherit; cursor: pointer;
      }
      .nav-button:hover { background: var(--fluid-surface-muted); }
      .nav-button:focus-visible { outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base); outline-offset: 1px; }
      .calendars { display: flex; gap: 0.5rem; padding: 0.5rem 0.65rem; }
      .calendars fluid-calendar + fluid-calendar { border-left: 1px solid var(--fluid-border-default); padding-left: 0.5rem; }
      .footer {
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        padding: 0.65rem; border-top: 1px solid var(--fluid-border-default);
      }
      .selected-range { font-size: 0.875rem; color: var(--fluid-text-secondary); }
      .actions { display: flex; gap: 0.5rem; }
      .btn {
        padding: 0.4rem 0.85rem; border-radius: var(--fluid-radius-md, 6px);
        font: inherit; cursor: pointer; min-height: max(2rem, var(--fluid-target-min, 0px));
        border: 1px solid var(--fluid-border-default); background: var(--fluid-surface-base); color: inherit;
      }
      .btn.apply { background: var(--fluid-accent-base); color: var(--fluid-accent-text); border-color: transparent; }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn:focus-visible { outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base); outline-offset: 2px; }
      @media (max-width: 560px) {
        .calendars fluid-calendar + fluid-calendar { display: none; }
      }
    `
  ];

  /** Range start, ISO `YYYY-MM-DD`. */
  @property() start: string | null = null;
  /** Range end, ISO `YYYY-MM-DD`. */
  @property() end: string | null = null;

  @property() override name = "";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readonly = false;
  @property() placeholder = "Select a date range";

  @property() min: string | null = null;
  @property() max: string | null = null;
  @property({ type: Number, attribute: "week-start" }) weekStart: Weekday = 1;
  @property() locale: string | undefined = undefined;
  @property() format: DisplayFormat = "medium";
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Hide the preset column. */
  @property({ type: Boolean, attribute: "no-presets" }) noPresets = false;

  /** Preset list (property only; defaults to the built-in set). */
  @property({ attribute: false }) presets: RangePreset[] = defaultRangePresets;

  @property({ type: Boolean, reflect: true }) open = false;

  /** Form value: the ISO interval `start/end`, derived from `start` + `end`. */
  @property() override value: string | null = null;

  @state() private tempStart: string | null = null;
  @state() private tempEnd: string | null = null;
  @state() private hover: string | null = null;
  @state() private viewISO: string | null = null;
  @state() private typed = "";

  @query("input") private inputEl!: HTMLInputElement;
  @query(".dialog") private dialogEl!: HTMLElement;

  private cleanup?: () => void;
  private dialogId = `fluid-range-${++counter}`;
  private defaults: { start: string | null; end: string | null } = { start: null, end: null };

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaults = { start: this.start, end: this.end };
    this.syncFormValue();
    document.addEventListener("pointerdown", this.onDocPointerDown, true);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup?.();
    document.removeEventListener("pointerdown", this.onDocPointerDown, true);
  }

  private fmt(iso: string | null): string {
    const d = fromISODate(iso);
    if (!d) return "";
    const o = fmtOpts(this.format);
    return o ? formatDate(d, this.locale, o) : iso!;
  }

  private get displayText(): string {
    if (this.start && this.end) return `${this.fmt(this.start)} – ${this.fmt(this.end)}`;
    return "";
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("start") || changed.has("end")) {
      this.typed = this.displayText;
      this.value = this.start && this.end ? `${this.start}/${this.end}` : null;
      this.syncFormValue();
      if (this.required && (!this.start || !this.end)) this.setValidity({ valueMissing: true }, "Please choose a date range.");
      else this.setValidity({});
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.onOpen();
      else this.onClose();
    }
  }

  override formResetCallback(): void {
    this.start = this.defaults.start;
    this.end = this.defaults.end;
    this.open = false;
  }
  override formDisabledCallback(d: boolean): void {
    this.disabled = d;
  }

  private get baseEl(): HTMLElement {
    return this.renderRoot.querySelector(".base") as HTMLElement;
  }

  private onOpen(): void {
    // Seed the temp selection + view from the committed range.
    this.tempStart = this.start;
    this.tempEnd = this.end;
    this.hover = null;
    const anchor = fromISODate(this.start) ?? new Date();
    this.viewISO = toISODate(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    this.dispatchEvent(new CustomEvent("fluid-open", { bubbles: true, composed: true }));
    // Promote to the top layer; :popover-open + @starting-style drive the fade.
    const dialog = this.dialogEl as HTMLElement & { showPopover?: () => void };
    try {
      dialog?.showPopover?.();
    } catch {
      /* already shown or unsupported, ignore */
    }
    this.cleanup = autoUpdate(this.baseEl, this.dialogEl, () => this.reposition());
    void this.reposition();
  }
  private onClose(): void {
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

  private async reposition(): Promise<void> {
    if (!this.baseEl || !this.dialogEl) return;
    const { x, y } = await computePosition(this.baseEl, this.dialogEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(6), flip({ rootBoundary: "viewport" }), shift({ padding: 8 })]
    });
    Object.assign(this.dialogEl.style, { left: `${x}px`, top: `${y}px` });
  }

  private onDocPointerDown = (e: Event): void => {
    if (this.open && !e.composedPath().includes(this)) this.open = false;
  };

  private viewDate(): Date {
    return fromISODate(this.viewISO) ?? new Date();
  }
  private goMonth(delta: number): void {
    this.viewISO = toISODate(addMonths(this.viewDate(), delta));
  }

  private onActivate = (e: Event): void => {
    const iso = (e as CustomEvent).detail?.iso as string;
    const picked = fromISODate(iso)!;
    if (!this.tempStart || (this.tempStart && this.tempEnd)) {
      this.tempStart = iso;
      this.tempEnd = null;
    } else {
      const startD = fromISODate(this.tempStart)!;
      if (compareDay(picked, startD) < 0) {
        this.tempEnd = this.tempStart;
        this.tempStart = iso;
      } else {
        this.tempEnd = iso;
      }
    }
    this.hover = null;
  };

  private onHover = (e: Event): void => {
    if (this.tempStart && !this.tempEnd) this.hover = (e as CustomEvent).detail?.iso as string;
  };

  private selectPreset(p: RangePreset): void {
    const r = p.getRange();
    this.tempStart = toISODate(r.start);
    this.tempEnd = toISODate(r.end);
    this.viewISO = toISODate(new Date(r.start.getFullYear(), r.start.getMonth(), 1));
  }

  private apply(): void {
    if (!this.tempStart || !this.tempEnd) return;
    this.start = this.tempStart;
    this.end = this.tempEnd;
    const sd = fromISODate(this.start);
    const ed = fromISODate(this.end);
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { start: this.start, end: this.end, startDate: sd, endDate: ed },
        bubbles: true,
        composed: true
      })
    );
    this.open = false;
    this.inputEl?.focus();
  }
  private cancel(): void {
    this.open = false;
    this.inputEl?.focus();
  }

  private onDialogKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.cancel();
    }
  };

  override render(): TemplateResult {
    const v = this.viewDate();
    const leftView = toISODate(new Date(v.getFullYear(), v.getMonth(), 1));
    const rightView = toISODate(addMonths(v, 1));
    const activeId =
      this.tempStart && this.tempEnd
        ? matchPreset(
            { start: fromISODate(this.tempStart)!, end: fromISODate(this.tempEnd)! },
            this.presets
          )
        : null;
    const tempLabel =
      this.tempStart && this.tempEnd
        ? `${this.fmt(this.tempStart)} – ${this.fmt(this.tempEnd)}`
        : this.tempStart
          ? `${this.fmt(this.tempStart)} – …`
          : "Select a range";

    return html`
      <div part="base" class="base">
        <input
          part="input"
          type="text"
          .value=${this.typed}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          readonly
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this.dialogId}
          @click=${() => !this.disabled && (this.open = true)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === "ArrowDown") { e.preventDefault(); this.open = true; } }}
        />
        <button part="trigger" class="trigger" type="button" aria-label="Choose date range"
          aria-haspopup="dialog" aria-expanded=${this.open ? "true" : "false"} ?disabled=${this.disabled}
          @click=${() => !this.disabled && (this.open = !this.open)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>
          </svg>
        </button>
      </div>

      <div part="dialog" id=${this.dialogId} class="dialog" role="dialog" aria-label="Choose date range"
        popover="manual" @keydown=${this.onDialogKeydown}>
        ${this.noPresets || !this.presets.length
          ? null
          : html`
              <div part="presets" class="presets" role="group" aria-label="Range presets">
                ${this.presets.map(
                  (p) => html`<button
                    type="button"
                    class="preset"
                    aria-pressed=${activeId === p.id ? "true" : "false"}
                    @click=${() => this.selectPreset(p)}
                  >${p.label}</button>`
                )}
              </div>`}
        <div class="right">
          <div class="cal-head">
            <button class="nav-button" type="button" aria-label="Previous month" @click=${() => this.goMonth(-1)}>‹</button>
            <button class="nav-button" type="button" aria-label="Next month" @click=${() => this.goMonth(1)}>›</button>
          </div>
          <div part="calendars" class="calendars" @fluid-date-activate=${this.onActivate} @fluid-date-hover=${this.onHover}>
            <fluid-calendar
              no-nav range view=${leftView}
              range-start=${this.tempStart ?? ""} range-end=${this.tempEnd ?? ""} range-preview=${this.hover ?? ""}
              min=${this.min ?? ""} max=${this.max ?? ""} week-start=${this.weekStart} locale=${this.locale ?? ""}
            ></fluid-calendar>
            <fluid-calendar
              no-nav range view=${rightView}
              range-start=${this.tempStart ?? ""} range-end=${this.tempEnd ?? ""} range-preview=${this.hover ?? ""}
              min=${this.min ?? ""} max=${this.max ?? ""} week-start=${this.weekStart} locale=${this.locale ?? ""}
            ></fluid-calendar>
          </div>
          <div part="footer" class="footer">
            <span class="selected-range">${tempLabel}</span>
            <div class="actions">
              <button class="btn" type="button" @click=${this.cancel}>Cancel</button>
              <button class="btn apply" type="button" ?disabled=${!this.tempStart || !this.tempEnd} @click=${this.apply}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
