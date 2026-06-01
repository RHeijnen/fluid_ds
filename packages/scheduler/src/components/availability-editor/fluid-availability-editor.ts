import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/number-input";
import "@fluid-ds/components/define/date-picker";
import type { Availability, TimeWindow, Weekday } from "../../internal/availability.js";

const DEFAULT_WINDOW: TimeWindow = { start: "09:00", end: "17:00" };

/**
 * The owner-side editor for a scheduler's availability: a weekly-hours grid
 * (toggle each weekday open, add one or more time windows) plus global slot
 * rules and a list of closed-date exceptions. It emits a complete
 * `Availability` config on every edit, ready to hand to `fluid-scheduler`.
 *
 * @summary Define when a business is open for bookings.
 *
 * @csspart base - The editor container.
 * @csspart settings - The global settings grid.
 * @csspart week - The weekly-hours group.
 * @csspart day - A single weekday row.
 * @csspart exceptions - The exceptions group.
 *
 * @cssproperty --fluid-availability-editor-gap - Vertical gap between sections. Falls back to 1.5rem.
 * @cssproperty --fluid-availability-editor-row-bg - Weekday row background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-availability-editor-radius - Row corner radius. Falls back to --fluid-radius-md.
 *
 * @uses-token --fluid-surface-muted - Row background.
 * @uses-token --fluid-text-primary - Labels.
 * @uses-token --fluid-text-secondary - Helper text.
 * @uses-token --fluid-border-default - Time-input borders.
 * @uses-token --fluid-radius-md - Row radius.
 * @uses-token --fluid-focus-ring-width - Time-input focus ring (2px AA / 3px AAA).
 *
 * @fires fluid-change - The availability config changed. `detail: { availability }`.
 */
export class FluidAvailabilityEditor extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
      color: var(--fluid-text-primary);
    }
    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-availability-editor-gap, 1.5rem);
    }
    h3 {
      margin: 0 0 0.6rem;
      font-size: var(--fluid-font-size-md, 1rem);
      font-weight: 600;
    }
    .settings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
      gap: 0.75rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }
    .field > span {
      color: var(--fluid-text-secondary);
    }
    .day {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      background: var(--fluid-availability-editor-row-bg, var(--fluid-surface-muted));
      border-radius: var(--fluid-availability-editor-radius, var(--fluid-radius-md));
    }
    .day-name {
      flex: 0 0 6rem;
      font-weight: 500;
    }
    .windows {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      flex: 1;
    }
    .window {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    input[type="time"] {
      min-height: max(2rem, var(--fluid-target-min, 0px));
      padding: 0.2rem 0.4rem;
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-sm, 4px);
      background: var(--fluid-surface-base);
      color: var(--fluid-text-primary);
      font: inherit;
      font-variant-numeric: tabular-nums;
    }
    input[type="time"]:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base);
      outline-offset: 1px;
    }
    .closed-note {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }
    .exception {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .icon-btn {
      display: inline-grid;
      place-items: center;
      min-width: max(1.75rem, var(--fluid-target-min, 0px));
      min-height: max(1.75rem, var(--fluid-target-min, 0px));
      border: 0;
      border-radius: var(--fluid-radius-sm, 4px);
      background: transparent;
      color: var(--fluid-text-secondary);
      font: inherit;
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
    }
    .icon-btn:hover {
      color: var(--fluid-danger-base, var(--fluid-text-primary));
      background: var(--fluid-surface-base);
    }
    .icon-btn:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base);
      outline-offset: 1px;
    }
  `;

  /** Initial / controlled availability. Editing emits a new config via `fluid-change`. */
  @property({ type: Object }) availability: Availability | null = null;

  /** First weekday to list: 0 = Sunday … 6 = Saturday (default Monday). */
  @property({ type: Number, attribute: "week-start" }) weekStart = 1;

  /** BCP-47 locale for weekday names. */
  @property() locale: string | undefined = undefined;

  @state() private weekly: Record<number, TimeWindow[]> = {};
  @state() private exceptions: { date: string; closed: boolean }[] = [];
  @state() private slotMinutes = 30;
  @state() private capacity = 1;
  @state() private minNoticeHours = 0;
  @state() private maxAdvanceDays = 60;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.availability) this.hydrate(this.availability);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("availability") && this.availability) this.hydrate(this.availability);
  }

  private hydrate(a: Availability): void {
    const weekly: Record<number, TimeWindow[]> = {};
    for (const [d, wins] of Object.entries(a.weekly ?? {})) {
      weekly[Number(d)] = (wins ?? []).map((w) => ({ ...w }));
    }
    this.weekly = weekly;
    this.slotMinutes = a.slotMinutes ?? 30;
    this.capacity = a.capacity ?? 1;
    this.minNoticeHours = Math.round((a.minNoticeMinutes ?? 0) / 60);
    this.maxAdvanceDays = a.maxAdvanceDays ?? 60;
    this.exceptions = (a.exceptions ?? []).map((e) => ({ date: e.date, closed: e.closed ?? true }));
  }

  private get orderedDays(): number[] {
    return Array.from({ length: 7 }, (_, i) => (this.weekStart + i) % 7);
  }

  private dayName(d: number): string {
    // 2024-01-07 is a Sunday (getDay 0); offset to weekday d.
    return new Intl.DateTimeFormat(this.locale || undefined, { weekday: "long" }).format(new Date(2024, 0, 7 + d));
  }

  private emit(): void {
    const weekly: Availability["weekly"] = {};
    for (const d of Object.keys(this.weekly).map(Number)) {
      const wins = this.weekly[d];
      if (wins && wins.length) weekly[d as Weekday] = wins.map((w) => ({ ...w }));
    }
    const availability: Availability = {
      weekly,
      slotMinutes: this.slotMinutes,
      ...(this.capacity > 1 ? { capacity: this.capacity } : {}),
      ...(this.minNoticeHours > 0 ? { minNoticeMinutes: this.minNoticeHours * 60 } : {}),
      ...(this.maxAdvanceDays > 0 ? { maxAdvanceDays: this.maxAdvanceDays } : {}),
      ...(this.exceptions.length
        ? { exceptions: this.exceptions.filter((e) => e.date).map((e) => ({ date: e.date, closed: e.closed })) }
        : {})
    };
    this.dispatchEvent(new CustomEvent("fluid-change", { detail: { availability }, bubbles: true, composed: true }));
  }

  private toggleDay(d: number, open: boolean): void {
    const next = { ...this.weekly };
    next[d] = open ? (this.weekly[d]?.length ? this.weekly[d]! : [{ ...DEFAULT_WINDOW }]) : [];
    this.weekly = next;
    this.emit();
  }

  private addWindow(d: number): void {
    const next = { ...this.weekly };
    next[d] = [...(this.weekly[d] ?? []), { ...DEFAULT_WINDOW }];
    this.weekly = next;
    this.emit();
  }

  private removeWindow(d: number, i: number): void {
    const next = { ...this.weekly };
    next[d] = (this.weekly[d] ?? []).filter((_, idx) => idx !== i);
    this.weekly = next;
    this.emit();
  }

  private setWindow(d: number, i: number, field: "start" | "end", value: string): void {
    const next = { ...this.weekly };
    const wins = [...(this.weekly[d] ?? [])];
    const w = wins[i];
    if (!w) return;
    wins[i] = { ...w, [field]: value };
    next[d] = wins;
    this.weekly = next;
    this.emit();
  }

  private addException(): void {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    this.exceptions = [...this.exceptions, { date: iso, closed: true }];
    this.emit();
  }

  private setExceptionDate(i: number, date: string): void {
    this.exceptions = this.exceptions.map((e, idx) => (idx === i ? { ...e, date } : e));
    this.emit();
  }

  private removeException(i: number): void {
    this.exceptions = this.exceptions.filter((_, idx) => idx !== i);
    this.emit();
  }

  private numberField(label: string, value: number, min: number, step: number, onChange: (n: number) => void): TemplateResult {
    return html`
      <label class="field">
        <span>${label}</span>
        <fluid-number-input
          aria-label=${label}
          value=${String(value)}
          min=${min}
          step=${step}
          @fluid-change=${(e: Event) => {
            const v = Number((e.target as HTMLElement & { value: string }).value);
            if (!Number.isNaN(v)) onChange(v);
          }}
        ></fluid-number-input>
      </label>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <section part="settings">
          <h3>Slot rules</h3>
          <div class="settings">
            ${this.numberField("Slot length (min)", this.slotMinutes, 5, 5, (n) => {
              this.slotMinutes = n;
              this.emit();
            })}
            ${this.numberField("Capacity per slot", this.capacity, 1, 1, (n) => {
              this.capacity = n;
              this.emit();
            })}
            ${this.numberField("Min notice (hours)", this.minNoticeHours, 0, 1, (n) => {
              this.minNoticeHours = n;
              this.emit();
            })}
            ${this.numberField("Book up to (days)", this.maxAdvanceDays, 0, 1, (n) => {
              this.maxAdvanceDays = n;
              this.emit();
            })}
          </div>
        </section>

        <section part="week" role="group" aria-label="Weekly hours">
          <h3>Weekly hours</h3>
          ${this.orderedDays.map((d) => {
            const wins = this.weekly[d] ?? [];
            const open = wins.length > 0;
            const name = this.dayName(d);
            return html`
              <div class="day" part="day">
                <span class="day-name">${name}</span>
                <fluid-switch
                  aria-label=${`Open on ${name}`}
                  ?checked=${open}
                  @fluid-change=${(e: Event) => this.toggleDay(d, (e as CustomEvent).detail.checked)}
                ></fluid-switch>
                ${open
                  ? html`
                      <div class="windows">
                        ${wins.map(
                          (w, i) => html`
                            <span class="window">
                              <input
                                type="time"
                                aria-label=${`${name} opening time ${i + 1}`}
                                .value=${w.start}
                                @change=${(e: Event) => this.setWindow(d, i, "start", (e.target as HTMLInputElement).value)}
                              />
                              <span aria-hidden="true">–</span>
                              <input
                                type="time"
                                aria-label=${`${name} closing time ${i + 1}`}
                                .value=${w.end}
                                @change=${(e: Event) => this.setWindow(d, i, "end", (e.target as HTMLInputElement).value)}
                              />
                              <button
                                class="icon-btn"
                                type="button"
                                aria-label=${`Remove ${name} window ${i + 1}`}
                                @click=${() => this.removeWindow(d, i)}
                              >
                                ×
                              </button>
                            </span>
                          `
                        )}
                        <fluid-button size="sm" variant="ghost" @click=${() => this.addWindow(d)}>+ Hours</fluid-button>
                      </div>
                    `
                  : html`<span class="closed-note">Closed</span>`}
              </div>
            `;
          })}
        </section>

        <section part="exceptions" role="group" aria-label="Closed dates">
          <h3>Closed dates</h3>
          ${this.exceptions.map(
            (e, i) => html`
              <div class="exception">
                <fluid-date-picker
                  aria-label="Closed date"
                  value=${e.date}
                  @fluid-change=${(ev: Event) => this.setExceptionDate(i, (ev as CustomEvent).detail.value)}
                ></fluid-date-picker>
                <span class="closed-note">Closed all day</span>
                <button class="icon-btn" type="button" aria-label="Remove closed date" @click=${() => this.removeException(i)}>
                  ×
                </button>
              </div>
            `
          )}
          <fluid-button size="sm" variant="ghost" @click=${() => this.addException()}>+ Add closed date</fluid-button>
        </section>
      </div>
    `;
  }
}
