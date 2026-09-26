import { html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

/**
 * A big, friendly clock face: hours and minutes in the display font with a
 * short date line underneath, in the Rainbow widget style. Pairs with
 * `<fluid-rainbow-landscape>` but works anywhere.
 *
 * Rendered as a native `<time>` element with a machine-readable `datetime`.
 * The face ticks once a minute, aligned to the minute boundary, and is never a
 * live region: a clock that announced itself every minute would be noise.
 *
 * Formatting follows the Fluid locale (`lang` on the element or an ancestor)
 * through `Intl.DateTimeFormat`, so the weekday is translated and the hour
 * cycle matches the locale unless `hour-cycle` overrides it.
 *
 * Set `datetime` to show a fixed moment instead of the current time (a
 * timezone demo, a screenshot, a test). The timer only runs while no
 * `datetime` is set and the element is connected.
 *
 * @summary Live, localized clock face in the Rainbow widget style.
 *
 * @csspart base - The `<time>` element.
 * @csspart time - The hours and minutes.
 * @csspart date - The date line.
 *
 * @cssproperty --fluid-rainbow-clock-font-family - Face font. Falls back to --fluid-font-family-display.
 * @cssproperty --fluid-rainbow-clock-size - Size of the hours and minutes. Falls back to clamp(1.75rem, 14cqi, 4.5rem), which scales with a containing landscape.
 * @cssproperty --fluid-rainbow-clock-fg - Text color. Falls back to inherited color.
 *
 * @uses-token --fluid-font-family-display - Default face font.
 * @uses-token --fluid-font-weight-bold - Hours and minutes weight.
 * @uses-token --fluid-font-weight-semibold - Date line weight.
 * @uses-token --fluid-font-size-sm - Date line size.
 */
export class FluidRainbowClock extends FluidElement {
  static override styles = css`
    :host {
      display: inline-block;
      font-family: var(--fluid-rainbow-clock-font-family, var(--fluid-font-family-display));
      color: var(--fluid-rainbow-clock-fg, inherit);
      line-height: 1;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: grid;
      gap: 0.4em;
    }

    .time {
      font-size: var(--fluid-rainbow-clock-size, clamp(1.75rem, 14cqi, 4.5rem));
      font-weight: var(--fluid-font-weight-bold, 700);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
    }

    .date {
      font-size: var(--fluid-font-size-sm, 0.75rem);
      font-weight: var(--fluid-font-weight-semibold, 600);
    }
  `;

  /**
   * A fixed moment to display (anything `Date` can parse). When unset the
   * clock shows the current time and updates every minute.
   */
  @property() datetime?: string;

  /** Hide the date line. */
  @property({ type: Boolean, attribute: "hide-date", reflect: true }) hideDate = false;

  /** Force a 12- or 24-hour face. `auto` follows the locale. */
  @property({ attribute: "hour-cycle" }) hourCycle: "auto" | "h12" | "h23" = "auto";

  @state() private now = new Date();

  private timer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    this.schedule();
    this.registerCleanup(() => this.stop());
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("datetime") && this.isConnected) this.schedule();
  }

  private stop(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Tick on the next minute boundary, then every minute, while live. */
  private schedule(): void {
    this.stop();
    if (this.datetime) return;
    this.now = new Date();
    const wait = 60_000 - (this.now.getSeconds() * 1000 + this.now.getMilliseconds());
    this.timer = setTimeout(() => this.schedule(), wait);
  }

  private get moment(): Date {
    if (!this.datetime) return this.now;
    const fixed = new Date(this.datetime);
    return Number.isNaN(fixed.getTime()) ? this.now : fixed;
  }

  private format(options: Intl.DateTimeFormatOptions, date: Date): string {
    try {
      return new Intl.DateTimeFormat([this.localize.locale, "en"], options).format(date);
    } catch {
      return new Intl.DateTimeFormat("en", options).format(date);
    }
  }

  override render(): TemplateResult {
    const date = this.moment;
    const cycle = this.hourCycle === "auto" ? {} : { hourCycle: this.hourCycle };
    const time = this.format({ hour: "2-digit", minute: "2-digit", ...cycle }, date);
    const day = this.format({ weekday: "long", day: "numeric", month: "short" }, date);
    return html`
      <time part="base" class="base" datetime=${date.toISOString()}>
        <span part="time" class="time">${time}</span>
        ${this.hideDate ? nothing : html`<span part="date" class="date">${day}</span>`}
      </time>
    `;
  }
}
