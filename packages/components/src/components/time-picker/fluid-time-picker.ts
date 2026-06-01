import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";

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

/** Format a canonical 24h "HH:MM" for display in the chosen format. */
function formatLabel(value: string, format: FluidTimeFormat): string {
  const mins = toMinutes(value);
  if (mins === null) return value;
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  if (format === "24h") return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
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
 * @cssproperty --fluid-time-picker-listbox-bg - Popover background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-time-picker-option-fg - Option text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-time-picker-option-active-bg - Active/hovered option background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-time-picker-option-selected-bg - Selected option background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-time-picker-option-selected-fg - Selected option text. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-time-picker-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Field + listbox background.
 * @uses-token --fluid-surface-muted - Active option background.
 * @uses-token --fluid-text-primary - Field + option text.
 * @uses-token --fluid-text-secondary - Trigger icon + placeholder.
 * @uses-token --fluid-border-default - Field + listbox border.
 * @uses-token --fluid-accent-base - Focus border + selected option background.
 * @uses-token --fluid-accent-text - Selected option text.
 * @uses-token --fluid-field-border-radius - Field radius.
 * @uses-token --fluid-field-height-md - Field height.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Trigger + option min target (24px AA / 44px AAA).
 *
 * @fires fluid-change - The committed time changed. `detail: { value }` where value is the 24h "HH:MM" (or null when cleared).
 * @fires fluid-open - The listbox opened.
 * @fires fluid-close - The listbox closed.
 */
export class FluidTimePicker extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    css`
      :host {
        display: inline-block;
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
        align-items: center;
        gap: 0.25rem;
        height: var(--fluid-field-height-md, 2.5rem);
        padding-inline: var(--fluid-field-padding-x-md, 0.75rem);
        background: var(--fluid-time-picker-bg, var(--fluid-input-bg, var(--fluid-surface-base)));
        color: var(--fluid-time-picker-fg, var(--fluid-input-fg, var(--fluid-text-primary)));
        border: var(--fluid-field-border-width, 1px) solid
          var(--fluid-time-picker-border, var(--fluid-input-border, var(--fluid-border-default)));
        border-radius: var(--fluid-time-picker-radius, var(--fluid-field-border-radius, var(--fluid-radius-md)));
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      :host([size="sm"]) .base {
        height: var(--fluid-field-height-sm, 2rem);
        padding-inline: var(--fluid-field-padding-x-sm, 0.6rem);
      }
      :host([size="lg"]) .base {
        height: var(--fluid-field-height-lg, 3rem);
        padding-inline: var(--fluid-field-padding-x-lg, 0.9rem);
      }
      .base:focus-within {
        border-color: var(--fluid-time-picker-border-focus, var(--fluid-accent-base));
        outline: var(--fluid-time-picker-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid
          color-mix(in srgb, var(--fluid-accent-base) 35%, transparent);
        outline-offset: 0;
      }
      input {
        flex: 1;
        min-width: 5rem;
        border: 0;
        outline: none;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
      }
      input::placeholder {
        color: var(--fluid-input-placeholder-fg, var(--fluid-text-secondary));
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
        color: var(--fluid-text-secondary);
        cursor: pointer;
      }
      .trigger:hover {
        color: var(--fluid-text-primary);
      }
      .trigger:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base);
        outline-offset: 1px;
      }
      svg {
        width: 1.1em;
        height: 1.1em;
      }
      /* Rendered in the top layer via popover="manual" so it is never clipped
         by an ancestor overflow / transform / contain. floating-ui drives
         placement. */
      .listbox {
        position: fixed;
        inset: auto;
        top: 0;
        left: 0;
        z-index: 1000;
        margin: 0;
        padding: 0.25rem;
        max-height: 16rem;
        overflow-y: auto;
        min-width: 8rem;
        list-style: none;
        background: var(--fluid-time-picker-listbox-bg, var(--fluid-surface-base));
        border: 1px solid var(--fluid-border-default);
        border-radius: var(--fluid-radius-lg, 0.75rem);
        box-shadow: var(--fluid-shadow-lg, 0 12px 32px -8px rgba(0, 0, 0, 0.25));
        opacity: 0;
        transform: scale(0.97);
        transform-origin: top left;
        transition:
          opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          transform calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
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
      .option.active {
        background: var(--fluid-time-picker-option-active-bg, var(--fluid-surface-muted));
      }
      .option[aria-selected="true"] {
        background: var(--fluid-time-picker-option-selected-bg, var(--fluid-accent-base));
        color: var(--fluid-time-picker-option-selected-fg, var(--fluid-accent-text));
      }
      .empty {
        padding: 0.5rem 0.6rem;
        font-size: var(--fluid-font-size-sm);
        color: var(--fluid-text-secondary);
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

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required: the form is invalid when no time is chosen. */
  @property({ type: Boolean }) required = false;

  /** Field size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Placeholder when no time is selected. */
  @property() placeholder = "Select a time";

  /** Whether the listbox popover is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Live text in the input (drives type-to-filter). */
  @state() private typed = "";

  /** Index of the active option in the filtered list, or -1. */
  @state() private activeIndex = -1;

  @query("input") private inputEl!: HTMLInputElement;
  @query(".trigger") private triggerEl!: HTMLButtonElement;
  @query(".listbox") private listboxEl!: HTMLElement;

  private cleanup?: () => void;
  private listboxId = `fluid-time-picker-${++counter}`;
  private defaultValue: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaultValue = this.value;
    if (this.value) this.syncFormValue();
    document.addEventListener("pointerdown", this.onDocPointerDown, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.cleanup?.();
    document.removeEventListener("pointerdown", this.onDocPointerDown, true);
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
      out.push({ value, label: formatLabel(value, this.format), id: `${this.listboxId}-opt-${m}` });
    }
    return out;
  }

  /** Options matching the current typed filter. */
  private get filteredOptions(): TimeOption[] {
    const q = this.typed.trim().toLowerCase();
    if (!q) return this.allOptions;
    return this.allOptions.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q));
  }

  private get displayText(): string {
    return this.value ? formatLabel(this.value, this.format) : "";
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.typed = this.displayText;
      this.syncFormValue();
      if (this.required && !this.value) this.setValidity({ valueMissing: true }, "Please choose a time.");
      else this.setValidity({});
    }
    if (changed.has("format") && !changed.has("value")) {
      this.typed = this.displayText;
    }
  }

  protected override updated(changed: PropertyValues): void {
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
    // Seed the active option from the current value (or the first match).
    const opts = this.filteredOptions;
    const selectedIdx = this.value ? opts.findIndex((o) => o.value === this.value) : -1;
    this.activeIndex = selectedIdx >= 0 ? selectedIdx : opts.length > 0 ? 0 : -1;
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
    this.activeIndex = -1;
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
    const { x, y } = await computePosition(this.base, this.listboxEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(6), flip({ rootBoundary: "viewport" }), shift({ padding: 8 })]
    });
    Object.assign(this.listboxEl.style, { left: `${x}px`, top: `${y}px` });
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
    this.open = !this.open;
  }

  private moveActive(delta: number): void {
    const opts = this.filteredOptions;
    if (opts.length === 0) {
      this.activeIndex = -1;
      return;
    }
    const next = this.activeIndex < 0 ? (delta > 0 ? 0 : opts.length - 1) : this.activeIndex + delta;
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
    else this.typed = this.displayText; // revert
  }

  private onOptionClick(opt: TimeOption): void {
    this.commit(opt.value);
    this.open = false;
    this.inputEl?.focus();
  }

  override render(): TemplateResult {
    const opts = this.filteredOptions;
    const active = this.activeIndex >= 0 ? opts[this.activeIndex] : undefined;
    return html`
      <div part="base" class="base">
        <input
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
          aria-activedescendant=${this.open && active ? active.id : ""}
          @input=${this.onInput}
          @change=${this.commitTyped}
          @keydown=${this.onInputKeydown}
        />
        <button
          part="trigger"
          class="trigger"
          type="button"
          tabindex="-1"
          aria-label="Choose time"
          aria-haspopup="listbox"
          aria-expanded=${this.open ? "true" : "false"}
          ?disabled=${this.disabled}
          @click=${() => this.toggle()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
        aria-label="Time options"
        popover="manual"
      >
        ${opts.length === 0
          ? html`<li class="empty" role="presentation">No matching times</li>`
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
    `;
  }
}
