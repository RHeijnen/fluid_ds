import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, queryAll } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import { reducedMotion } from "@fluid-ds/components/internal/motion";
import {
  generateSlots,
  fromLocalISO,
  fromISODate,
  type Slot,
  type Availability,
  type Booking
} from "../../internal/availability.js";

type TimeFormat = "12h" | "24h";

/**
 * A single day's bookable time slots, rendered as an accessible
 * **radiogroup** (WAI-ARIA APG Radio Group pattern): one slot is tabbable,
 * arrow keys move between selectable slots, Enter/Space picks. Fully-booked and
 * past slots render as disabled radios so they are announced but skipped.
 *
 * Feed it either a pre-generated `slots` array, or a `date` + `availability`
 * (+ optional `bookings`) and it generates the slots itself via the package's
 * availability engine.
 *
 * @summary Pick a time slot for one day.
 *
 * @csspart base - The container.
 * @csspart heading - The date heading above the grid.
 * @csspart list - The radiogroup grid.
 * @csspart slot - Every slot button.
 * @csspart slot-selected - The chosen slot button.
 * @csspart empty - The "no openings" message.
 *
 * @cssproperty --fluid-time-slots-gap - Gap between slots. Falls back to 0.5rem.
 * @cssproperty --fluid-time-slots-min - Min slot width (grid track). Falls back to 5rem.
 * @cssproperty --fluid-time-slots-bg - Slot background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-time-slots-fg - Slot text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-time-slots-border - Slot border. Falls back to --fluid-border-default.
 * @cssproperty --fluid-time-slots-radius - Slot corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-time-slots-hover-bg - Slot hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-time-slots-selected-bg - Selected slot fill. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-time-slots-selected-fg - Selected slot text. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-time-slots-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Slot background.
 * @uses-token --fluid-surface-muted - Slot hover.
 * @uses-token --fluid-text-primary - Slot text.
 * @uses-token --fluid-text-secondary - Heading + empty text.
 * @uses-token --fluid-border-default - Slot border.
 * @uses-token --fluid-accent-base - Selected fill + focus ring.
 * @uses-token --fluid-accent-text - Selected text.
 * @uses-token --fluid-radius-md - Slot radius.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum slot height (24px AA / 44px AAA).
 *
 * @fires fluid-change - A slot was selected. `detail: { value, slot }`.
 */
export class FluidTimeSlots extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        color: var(--fluid-time-slots-fg, var(--fluid-text-primary));
      }
      :host([disabled]) {
        opacity: 0.6;
        pointer-events: none;
      }
      .heading {
        margin: 0 0 0.6rem;
        font-size: var(--fluid-font-size-sm, 0.875rem);
        font-weight: 600;
        color: var(--fluid-text-primary);
      }
      .list {
        display: grid;
        grid-template-columns: repeat(var(--fluid-time-slots-columns, auto-fill), minmax(var(--fluid-time-slots-min, 5rem), 1fr));
        gap: var(--fluid-time-slots-gap, 0.5rem);
      }
      .slot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: max(2.25rem, var(--fluid-target-min, 0px));
        padding: 0.35rem 0.5rem;
        box-sizing: border-box;
        border: 1px solid var(--fluid-time-slots-border, var(--fluid-border-default));
        border-radius: var(--fluid-time-slots-radius, var(--fluid-radius-md));
        background: var(--fluid-time-slots-bg, var(--fluid-surface-base));
        color: inherit;
        font: inherit;
        font-variant-numeric: tabular-nums;
        cursor: pointer;
        transition: background-color calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease,
          border-color calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1)) ease;
      }
      :host([size="sm"]) .slot { min-height: max(1.9rem, var(--fluid-target-min, 0px)); font-size: 0.8125rem; }
      :host([size="lg"]) .slot { min-height: max(2.75rem, var(--fluid-target-min, 0px)); font-size: 1rem; }
      .slot:hover:not(:disabled):not(.selected) {
        background: var(--fluid-time-slots-hover-bg, var(--fluid-surface-muted));
        border-color: var(--fluid-accent-base);
      }
      .slot.selected {
        background: var(--fluid-time-slots-selected-bg, var(--fluid-accent-base));
        color: var(--fluid-time-slots-selected-fg, var(--fluid-accent-text));
        border-color: var(--fluid-time-slots-selected-bg, var(--fluid-accent-base));
        font-weight: 600;
      }
      .slot:disabled {
        cursor: not-allowed;
        opacity: 0.45;
        text-decoration: line-through;
      }
      .slot:focus-visible {
        outline: var(--fluid-time-slots-focus-ring-width, var(--fluid-focus-ring-width, 2px)) solid var(--fluid-accent-base);
        outline-offset: 2px;
      }
      .empty {
        margin: 0;
        padding: 0.75rem 0;
        color: var(--fluid-text-secondary);
        font-size: var(--fluid-font-size-sm, 0.875rem);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ];

  /** Day to show, `YYYY-MM-DD`. Used with `availability` to generate slots. */
  @property() date: string | null = null;

  /** Availability config (object or JSON). Generates slots when paired with `date`. */
  @property({ type: Object }) availability: Availability | null = null;

  /** Existing bookings to subtract from availability. */
  @property({ type: Array }) bookings: Booking[] = [];

  /** Pre-generated slots. When set, used as-is (overrides `availability`). */
  @property({ attribute: false }) slots: Slot[] | null = null;

  /** Selected slot start, ISO `YYYY-MM-DDTHH:MM`. */
  @property() value: string | null = null;

  /** Clock format for slot labels. */
  @property({ attribute: "time-format" }) timeFormat: TimeFormat = "24h";

  /** Fixed column count; defaults to responsive auto-fill. */
  @property({ type: Number }) columns: number | null = null;

  /** BCP-47 locale for time + date labels. */
  @property() locale: string | undefined = undefined;

  /** Slot size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Disable the whole group. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Hide the date heading above the grid. */
  @property({ type: Boolean, attribute: "no-heading" }) noHeading = false;

  /** Index (into the resolved slots) of the currently tabbable slot. */
  @state() private activeIndex = -1;

  @queryAll(".slot") private slotEls!: NodeListOf<HTMLButtonElement>;

  /** The slots to render: explicit `slots`, else generated from date + availability. */
  private get resolved(): Slot[] {
    if (this.slots) return this.slots;
    if (this.date && this.availability) return generateSlots(this.date, this.availability, this.bookings);
    return [];
  }

  private isSelectable(slot: Slot): boolean {
    return slot.state === "available" || (slot.state === "full" && slot.start === this.value);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("slots") || changed.has("availability") || changed.has("date") || changed.has("bookings")) {
      this.activeIndex = this.initialActiveIndex();
    }
  }

  /** Tabbable slot: the selected one if selectable, else the first selectable. */
  private initialActiveIndex(): number {
    const slots = this.resolved;
    const selectedIdx = slots.findIndex((s) => s.start === this.value && this.isSelectable(s));
    if (selectedIdx >= 0) return selectedIdx;
    return slots.findIndex((s) => this.isSelectable(s));
  }

  private columnStyle(): string {
    return this.columns ? `--fluid-time-slots-columns: ${this.columns};` : "";
  }

  private formatTime(iso: string): string {
    const d = fromLocalISO(iso);
    if (!d) return iso;
    return new Intl.DateTimeFormat(this.locale || undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: this.timeFormat === "12h"
    }).format(d);
  }

  private headingText(): string {
    if (!this.date) return "";
    const d = fromISODate(this.date);
    if (!d) return "";
    return new Intl.DateTimeFormat(this.locale || undefined, { weekday: "long", month: "long", day: "numeric" }).format(d);
  }

  private select(slot: Slot): void {
    if (this.disabled || !this.isSelectable(slot)) return;
    this.value = slot.start;
    this.dispatchEvent(
      new CustomEvent("fluid-change", { detail: { value: slot.start, slot }, bubbles: true, composed: true })
    );
  }

  private onKeydown = (e: KeyboardEvent): void => {
    const slots = this.resolved;
    const selectable = slots.map((s, i) => ({ s, i })).filter(({ s }) => this.isSelectable(s));
    if (!selectable.length) return;
    const pos = selectable.findIndex(({ i }) => i === this.activeIndex);
    let nextPos = pos;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextPos = pos < 0 ? 0 : (pos + 1) % selectable.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextPos = pos < 0 ? selectable.length - 1 : (pos - 1 + selectable.length) % selectable.length;
        break;
      case "Home":
        nextPos = 0;
        break;
      case "End":
        nextPos = selectable.length - 1;
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const current = pos >= 0 ? selectable[pos] : undefined;
        if (current) this.select(current.s);
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    const target = selectable[nextPos];
    if (!target) return;
    this.activeIndex = target.i;
    this.updateComplete.then(() => this.slotEls[this.activeIndex]?.focus());
  };

  override render(): TemplateResult {
    const slots = this.resolved;
    const groupLabel = this.date ? `Time slots for ${this.headingText()}` : "Time slots";

    if (slots.length === 0) {
      const closed = !!this.date && !!this.availability;
      return html`
        <div part="base">
          ${this.date && !this.noHeading ? html`<p class="heading" part="heading">${this.headingText()}</p>` : ""}
          <p class="empty" part="empty" role="status">${closed ? "No openings on this day." : "Select a day to see openings."}</p>
        </div>
      `;
    }

    const available = slots.filter((s) => s.state === "available").length;

    return html`
      <div part="base">
        ${this.date && !this.noHeading ? html`<p class="heading" part="heading">${this.headingText()}</p>` : ""}
        <div
          part="list"
          class="list"
          role="radiogroup"
          aria-label=${groupLabel}
          style=${this.columnStyle()}
          @keydown=${this.onKeydown}
        >
          ${slots.map((slot, i) => {
            const selected = slot.start === this.value;
            const selectable = this.isSelectable(slot);
            const label = this.formatTime(slot.start);
            return html`
              <button
                part=${selected ? "slot slot-selected" : "slot"}
                class=${selected ? "slot selected" : "slot"}
                type="button"
                role="radio"
                aria-checked=${selected ? "true" : "false"}
                tabindex=${i === this.activeIndex && selectable ? 0 : -1}
                ?disabled=${!selectable || this.disabled}
                aria-label=${selectable ? label : `${label}, unavailable`}
                @click=${() => this.select(slot)}
              >
                ${label}
              </button>
            `;
          })}
        </div>
        <span class="sr-only" role="status" aria-live="polite">
          ${available} ${available === 1 ? "opening" : "openings"} available${this.date ? ` on ${this.headingText()}` : ""}.
        </span>
      </div>
    `;
  }
}
