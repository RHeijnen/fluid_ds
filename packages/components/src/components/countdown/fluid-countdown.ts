import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidCountdownFormat = "segments" | "clock";

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Split a whole number of seconds into day / hour / minute / second parts. */
function splitParts(totalSeconds: number): CountdownParts {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(clamped / 86400);
  const hours = Math.floor((clamped % 86400) / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return { days, hours, minutes, seconds };
}

/** Pad a number to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Counts down to a target time and renders the remaining duration.
 *
 * Provide a `target` (an ISO datetime string the countdown ticks toward) or a
 * fixed `seconds` duration. `format` switches between a labelled
 * day / hour / minute / second segment readout and a compact HH:MM:SS clock.
 *
 * The readout lives in a `role="timer"` region with `aria-live="polite"`, but
 * announcements are throttled (about once every 10 seconds, plus a final
 * announcement at zero) so a screen reader is not flooded with one update per
 * tick. The visible digits still update every second.
 *
 * Driven by a plain `setInterval` that is cleared on disconnect.
 *
 * @summary Counts down to a target time or across a fixed duration.
 *
 * @csspart base - The timer region.
 * @csspart segment - A single segment group (segments format).
 * @csspart digit - The numeric value of a segment or the clock readout.
 * @csspart label - The unit label under a segment (segments format).
 * @csspart separator - The colon between clock groups (clock format).
 *
 * Every styled property reads a component-scoped `--fluid-countdown-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-countdown-digit-fg - Digit text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-countdown-separator-fg - Clock separator color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-countdown-label-fg - Segment label color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-countdown-font-family - Numeric font family. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-text-primary - Digit text color.
 * @uses-token --fluid-text-secondary - Separator and label color.
 * @uses-token --fluid-font-family-sans - Numeric font family.
 *
 * @fires fluid-tick - Fires on each one-second tick while running, with
 *   `detail.remaining` (whole seconds left).
 * @fires fluid-complete - Fires once when the remaining time reaches zero.
 */
export class FluidCountdown extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      font-family: var(--fluid-countdown-font-family, var(--fluid-font-family-sans));
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: inline-flex;
      align-items: flex-end;
      gap: var(--fluid-space-3);
    }

    .base.clock {
      align-items: baseline;
      gap: 0;
    }

    .segment {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: var(--fluid-space-1);
    }

    .digit {
      font-size: var(--fluid-font-size-2xl);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-countdown-digit-fg, var(--fluid-text-primary));
    }

    .clock .digit {
      font-variant-numeric: tabular-nums;
    }

    .label {
      font-size: var(--fluid-font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--fluid-countdown-label-fg, var(--fluid-text-secondary));
    }

    .separator {
      font-size: var(--fluid-font-size-2xl);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-countdown-separator-fg, var(--fluid-text-secondary));
      padding: 0 var(--fluid-space-1);
    }
  `;

  /** ISO datetime string to count down toward. Takes precedence over `seconds`. */
  @property() target?: string;

  /** Fixed duration in seconds to count down across (when no `target` is set). */
  @property({ type: Number }) seconds?: number;

  /** Readout format: labelled segments or a compact HH:MM:SS clock. */
  @property({ reflect: true }) format: FluidCountdownFormat = "segments";

  /** Whether the countdown starts automatically. */
  @property({ type: Boolean }) autostart = true;

  /** Accessible label for the timer region. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Remaining whole seconds, the public read-only state. */
  @state() private remaining = 0;

  /** Whether the interval is currently running. */
  @state() private running = false;

  private timerId: ReturnType<typeof setInterval> | null = null;
  private resumeOnConnect = false;
  private initializedTarget: string | undefined;
  private initializedSeconds: number | undefined;

  /** Wall-clock target in ms (derived from `target`), or null for duration mode. */
  private targetMs: number | null = null;

  /** Seconds value last announced through the live region. */
  private lastAnnounced = -1;

  /** Whether fluid-complete has already fired for the current run. */
  private completed = false;

  /** Keep the announced value so locale updates do not require a new tick. */
  @state() private announcement: number | "complete" | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    // Fixed durations pause while detached; wall-clock targets continue to elapse.
    if (!this.hasUpdated || this.targetMs !== null || this.sourceChanged())
      this.computeInitialRemaining();
    const shouldStart = this.resumeOnConnect || (!this.hasUpdated && this.autostart);
    this.resumeOnConnect = false;
    if (shouldStart) this.start();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resumeOnConnect = this.running;
    this.running = false;
    this.clearTimer();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if ((changed.has("target") || changed.has("seconds")) && this.sourceChanged()) {
      this.computeInitialRemaining();
    }
  }

  private sourceChanged(): boolean {
    return (
      this.target !== this.initializedTarget || !Object.is(this.seconds, this.initializedSeconds)
    );
  }

  /** Resolve the starting remaining time from `target` or `seconds`. */
  private computeInitialRemaining(): void {
    this.initializedTarget = this.target;
    this.initializedSeconds = this.seconds;
    if (this.target) {
      const parsed = Date.parse(this.target);
      if (!Number.isNaN(parsed)) {
        this.targetMs = parsed;
        this.remaining = Math.max(0, Math.round((parsed - Date.now()) / 1000));
        return;
      }
    }
    this.targetMs = null;
    this.remaining = Math.max(0, Math.floor(this.seconds ?? 0));
  }

  /** Start (or resume) the countdown. */
  start(): void {
    if (this.running) return;
    if (this.remaining <= 0) {
      // Nothing to count: still surface completion once.
      this.maybeComplete();
      return;
    }
    this.running = true;
    this.completed = false;
    this.tick();
    // The immediate tick can complete the countdown or be paused by an event listener.
    if (this.running) this.timerId = setInterval(() => this.tick(), 1000);
  }

  /** Pause the countdown, keeping the remaining time intact. */
  pause(): void {
    this.running = false;
    this.resumeOnConnect = false;
    this.clearTimer();
  }

  /** Reset to the initial duration / target and stop. */
  reset(): void {
    this.pause();
    this.completed = false;
    this.lastAnnounced = -1;
    this.announcement = null;
    this.computeInitialRemaining();
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Advance one second (or recompute from the wall clock in target mode). */
  private tick(): void {
    const next =
      this.targetMs !== null
        ? Math.max(0, Math.round((this.targetMs - Date.now()) / 1000))
        : Math.max(0, this.remaining - 1);
    this.remaining = next;

    this.dispatchEvent(
      new CustomEvent("fluid-tick", {
        detail: { remaining: next },
        bubbles: true,
        composed: true
      })
    );

    this.maybeAnnounce(next);

    if (next <= 0) {
      this.pause();
      this.maybeComplete();
    }
  }

  /**
   * Throttle live-region announcements: refresh the polite text about once
   * every 10 seconds, plus always at zero, so a screen reader is not flooded
   * with one announcement per second.
   */
  private maybeAnnounce(value: number): void {
    const atBoundary = value % 10 === 0 || value === 0;
    if (atBoundary && value !== this.lastAnnounced) {
      this.lastAnnounced = value;
      this.announcement = value;
    }
  }

  private maybeComplete(): void {
    if (this.completed) return;
    this.completed = true;
    this.announcement = "complete";
    this.dispatchEvent(new CustomEvent("fluid-complete", { bubbles: true, composed: true }));
  }

  /** A human-readable sentence for the live region. */
  private spokenLabel(value: number): string {
    const { days, hours, minutes, seconds } = splitParts(value);
    // Follow the same effective context as the complete-message dictionary,
    // including its browser-language fallback. Invalid Intl tags stay safe.
    let locales = ["en"];
    try {
      locales = [...Intl.getCanonicalLocales(this.localize.locale), "en"];
    } catch {
      /* Use English unit formatting for an invalid locale. */
    }
    const bits: string[] = [];
    const unit = (count: number, name: string): string =>
      new Intl.NumberFormat(locales, { style: "unit", unit: name, unitDisplay: "long" }).format(
        count
      );
    if (days) bits.push(unit(days, "day"));
    if (hours) bits.push(unit(hours, "hour"));
    if (minutes) bits.push(unit(minutes, "minute"));
    if (seconds || bits.length === 0) {
      bits.push(unit(seconds, "second"));
    }
    const duration = new Intl.ListFormat(locales, { style: "long", type: "conjunction" }).format(
      bits
    );
    return this.term("countdownRemaining", duration);
  }

  private renderSegments(parts: CountdownParts): TemplateResult {
    const showDays = parts.days > 0;
    const showHours = showDays || parts.hours > 0;
    const showMinutes = showHours || parts.minutes > 0;
    return html`
      ${showDays
        ? html`<span part="segment" class="segment">
            <span part="digit" class="digit">${parts.days}</span>
            <span part="label" class="label">${this.term("days")}</span>
          </span>`
        : ""}
      ${showHours
        ? html`<span part="segment" class="segment">
            <span part="digit" class="digit">${pad2(parts.hours)}</span>
            <span part="label" class="label">${this.term("hoursShort")}</span>
          </span>`
        : ""}
      ${showMinutes
        ? html`<span part="segment" class="segment">
            <span part="digit" class="digit">${pad2(parts.minutes)}</span>
            <span part="label" class="label">${this.term("minutesShort")}</span>
          </span>`
        : ""}
      <span part="segment" class="segment">
        <span part="digit" class="digit">${pad2(parts.seconds)}</span>
        <span part="label" class="label">${this.term("secondsShort")}</span>
      </span>
    `;
  }

  private renderClock(parts: CountdownParts): TemplateResult {
    const totalHours = parts.days * 24 + parts.hours;
    return html`
      ${totalHours > 0
        ? html`<span part="digit" class="digit">${pad2(totalHours)}</span>
            <span part="separator" class="separator" aria-hidden="true">:</span>`
        : ""}
      <span part="digit" class="digit">${pad2(parts.minutes)}</span>
      <span part="separator" class="separator" aria-hidden="true">:</span>
      <span part="digit" class="digit">${pad2(parts.seconds)}</span>
    `;
  }

  override render(): TemplateResult {
    const parts = splitParts(this.remaining);
    const isClock = this.format === "clock";
    return html`
      <div
        part="base"
        class="base ${isClock ? "clock" : ""}"
        role="timer"
        aria-label=${this.ariaLabel ?? this.term("timeRemaining")}
      >
        ${isClock ? this.renderClock(parts) : this.renderSegments(parts)}
      </div>
      <span
        aria-live="polite"
        style="position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0;white-space:nowrap;"
        >${this.announcement === "complete"
          ? this.term("countdownComplete")
          : this.announcement === null
            ? ""
            : this.spokenLabel(this.announcement)}</span
      >
    `;
  }
}
