import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidTimelineItemTone = "default" | "info" | "success" | "warning" | "danger";

/**
 * A single event inside a `<fluid-timeline>`. Renders a marker dot (which can
 * hold a small icon via the `icon` slot), an optional time stamp via the `time`
 * slot, the event content in the default slot, and the connecting line that
 * joins this item's marker to the next one.
 *
 * Whether this item is the last one (and so draws no trailing line) is DERIVED
 * and assigned by the parent `<fluid-timeline>`: you do not set `last` yourself.
 *
 * The item is presentational. It carries `role="listitem"` so the parent's
 * `role="list"` produces a correct list in the accessibility tree. The marker
 * and connecting line are decorative (`aria-hidden`): the meaning is carried by
 * the slotted content and time text.
 *
 * @summary One event in a timeline; marker + time + content.
 *
 * @slot - The event content (title, description, anything).
 * @slot time - Optional time stamp or label, rendered above the content.
 * @slot icon - Optional small icon shown inside the marker dot.
 *
 * Every styled property reads a component-scoped `--fluid-timeline-item-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @csspart marker - The marker dot.
 * @csspart content - The text column (time + slotted content).
 *
 * @cssproperty --fluid-timeline-item-marker-size - Diameter of the marker dot. Falls back to 0.875rem.
 * @cssproperty --fluid-timeline-item-marker-bg - Marker fill color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-timeline-item-marker-fg - Marker icon color. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-timeline-item-marker-ring - Ring drawn around the marker (separates it from the line). Falls back to --fluid-surface-base.
 * @cssproperty --fluid-timeline-item-line-color - Connecting line color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-timeline-item-line-size - Connecting line thickness. Falls back to 2px.
 * @cssproperty --fluid-timeline-item-gap - Gap between the marker rail and the content. Falls back to --fluid-space-3.
 * @cssproperty --fluid-timeline-item-time-fg - Time stamp text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-timeline-item-content-fg - Content text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-timeline-item-time-font-size - Time stamp font size. Falls back to --fluid-font-size-xs.
 *
 * @uses-token --fluid-accent-base - Default marker fill.
 * @uses-token --fluid-accent-text - Default marker icon color.
 * @uses-token --fluid-success-base - Success tone marker fill.
 * @uses-token --fluid-success-text - Success tone marker icon color.
 * @uses-token --fluid-danger-base - Danger tone marker fill.
 * @uses-token --fluid-danger-text - Danger tone marker icon color.
 * @uses-token --fluid-warning-base - Warning tone marker fill.
 * @uses-token --fluid-info-base - Info tone marker fill.
 * @uses-token --fluid-info-text - Info tone marker icon color.
 * @uses-token --fluid-surface-base - Ring color separating the marker from the line.
 * @uses-token --fluid-border-default - Connecting line color.
 * @uses-token --fluid-text-primary - Content text color.
 * @uses-token --fluid-text-secondary - Time stamp text color.
 * @uses-token --fluid-space-3 - Gap between the rail and the content.
 * @uses-token --fluid-font-size-xs - Time stamp font size.
 */
export class FluidTimelineItem extends FluidElement {
  static override styles = css`
    :host {
      --_marker: var(--fluid-timeline-item-marker-size, 0.875rem);
      --_line: var(--fluid-timeline-item-line-size, 2px);
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      align-items: flex-start;
      gap: var(--fluid-timeline-item-gap, var(--fluid-space-3));
    }

    /* The rail holds the marker dot and the line that descends to the next
       item. The line is centered under the marker. */
    .rail {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      align-self: stretch;
      /* Match the marker so the line aligns under its center. */
      width: var(--_marker);
    }

    .marker {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: var(--_marker);
      height: var(--_marker);
      /* A small top offset so the dot sits on the first line of content. */
      margin-top: 0.3rem;
      border-radius: var(--fluid-radius-full);
      background: var(--fluid-timeline-item-marker-bg, var(--fluid-accent-base));
      color: var(--fluid-timeline-item-marker-fg, var(--fluid-accent-text));
      /* A ring in the surface color visually separates the dot from the line. */
      box-shadow: 0 0 0 var(--_line)
        var(--fluid-timeline-item-marker-ring, var(--fluid-surface-base));
    }

    :host([tone="info"]) .marker {
      background: var(--fluid-timeline-item-marker-bg, var(--fluid-info-base));
      color: var(--fluid-timeline-item-marker-fg, var(--fluid-info-text));
    }
    :host([tone="success"]) .marker {
      background: var(--fluid-timeline-item-marker-bg, var(--fluid-success-base));
      color: var(--fluid-timeline-item-marker-fg, var(--fluid-success-text));
    }
    :host([tone="warning"]) .marker {
      background: var(--fluid-timeline-item-marker-bg, var(--fluid-warning-base));
      color: var(--fluid-timeline-item-marker-fg, var(--fluid-accent-text));
    }
    :host([tone="danger"]) .marker {
      background: var(--fluid-timeline-item-marker-bg, var(--fluid-danger-base));
      color: var(--fluid-timeline-item-marker-fg, var(--fluid-danger-text));
    }

    .marker ::slotted(*) {
      width: calc(var(--_marker) * 0.625);
      height: calc(var(--_marker) * 0.625);
      font-size: calc(var(--_marker) * 0.625);
    }

    .line {
      flex: 1 1 auto;
      width: var(--_line);
      margin-top: var(--fluid-space-1);
      background: var(--fluid-timeline-item-line-color, var(--fluid-border-default));
    }

    /* The last item draws no trailing line. */
    :host([last]) .line {
      display: none;
    }

    .content {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-1);
      color: var(--fluid-timeline-item-content-fg, var(--fluid-text-primary));
      /* Bottom padding so consecutive items breathe even with the gap. */
      padding-bottom: var(--fluid-space-1);
    }

    .time {
      font-size: var(--fluid-timeline-item-time-font-size, var(--fluid-font-size-xs));
      color: var(--fluid-timeline-item-time-fg, var(--fluid-text-secondary));
    }

    .time.empty {
      display: none;
    }

    ::slotted(*) {
      margin: 0 !important;
    }
  `;

  /**
   * Visual tone of the marker dot. Semantic status tones (info / success /
   * warning / danger) are theme-independent. Defaults to the accent track.
   */
  @property({ reflect: true }) tone: FluidTimelineItemTone = "default";

  /**
   * True for the final item, which suppresses the trailing connecting line.
   * Set by the parent `<fluid-timeline>`, not authored directly.
   */
  @property({ type: Boolean, reflect: true }) last = false;

  @state() private hasTimeSlot = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  protected override updated(_changed: PropertyValues<this>): void {
    /* No derived attribute work needed beyond the reflected props. */
  }

  private handleTimeSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasTimeSlot = slot.assignedNodes({ flatten: true }).length > 0;
  };

  override render(): TemplateResult {
    return html`
      <div class="base">
        <span class="rail">
          <span part="marker" class="marker" aria-hidden="true">
            <slot name="icon"></slot>
          </span>
          <span class="line" aria-hidden="true"></span>
        </span>
        <div part="content" class="content">
          <span class="time ${this.hasTimeSlot ? "" : "empty"}">
            <slot name="time" @slotchange=${this.handleTimeSlotChange}></slot>
          </span>
          <slot></slot>
        </div>
      </div>
    `;
  }
}
