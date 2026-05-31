import { html, css, type PropertyValues, type TemplateResult, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "check",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`
);

export type FluidStepState = "complete" | "current" | "upcoming";

/**
 * A single step inside a `<fluid-steps>` element.
 *
 * The visual state (complete / current / upcoming) and the displayed number are
 * DERIVED and assigned by the parent `<fluid-steps>` from its `current` index:
 * you don't set them yourself. The numbered indicator shows the 1-based step
 * number for current/upcoming and a check icon for complete.
 *
 * By default a step is presentational. When the parent is `clickable`, each step
 * becomes a real `<button>` so it is focusable and keyboard-activatable.
 *
 * @summary One step in a stepper; state derived by the parent.
 *
 * @slot - The step label.
 * @slot description - Optional secondary text under the label.
 *
 * Every styled property reads a component-scoped `--fluid-step-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @csspart base - The step row (button when clickable).
 * @csspart indicator - The numbered / check circle.
 * @csspart connector - The line connecting this step to the previous one.
 * @csspart label - The label text.
 * @csspart description - The optional description text.
 *
 * @cssproperty --fluid-step-indicator-size - Diameter of the indicator circle. Falls back to 1.75rem.
 * @cssproperty --fluid-step-connector-color - Connector line color (upcoming). Falls back to --fluid-border-default.
 * @cssproperty --fluid-step-connector-complete-color - Connector color for a completed segment. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-step-connector-size - Connector line thickness. Falls back to 2px.
 * @cssproperty --fluid-step-gap - Gap between the connector and the indicator. Falls back to --fluid-space-2.
 * @cssproperty --fluid-step-complete-bg - Complete indicator background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-step-complete-fg - Complete indicator foreground. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-step-current-bg - Current indicator background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-step-current-fg - Current indicator foreground. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-step-upcoming-bg - Upcoming indicator background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-step-upcoming-fg - Upcoming indicator foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-step-label-fg - Default label color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-step-current-label-fg - Current/complete label color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-step-description-fg - Description color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-step-font-size - Label font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-step-focus-ring - Keyboard focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-step-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-step-chip-bg - Chip variant: pill background (upcoming). Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-step-chip-border - Chip variant: pill border (upcoming). Falls back to --fluid-border-default.
 * @cssproperty --fluid-step-chip-current-bg - Chip variant: pill background when current. Falls back to a 10% accent tint.
 * @cssproperty --fluid-step-chip-current-border - Chip variant: pill border when current. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-step-chip-indicator-size - Chip variant: badge diameter. Falls back to 1.4rem.
 *
 * @uses-token --fluid-accent-base - Complete + current indicator background; completed connector.
 * @uses-token --fluid-accent-text - Complete + current indicator foreground.
 * @uses-token --fluid-border-default - Upcoming connector line color.
 * @uses-token --fluid-surface-muted - Upcoming indicator background.
 * @uses-token --fluid-text-primary - Current/complete label text.
 * @uses-token --fluid-text-secondary - Default label + description + upcoming indicator text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum step hit-target height when clickable (24px AA / 44px AAA).
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-md - Label font size.
 * @uses-token --fluid-radius-sm - Focus ring corner radius.
 */
export class FluidStep extends FluidElement {
  static override styles = css`
    :host {
      --_indicator: var(--fluid-step-indicator-size, 1.75rem);
      --_conn-size: var(--fluid-step-connector-size, 2px);
      display: block;
      font-family: var(--fluid-font-family-sans);
      line-height: var(--fluid-line-height-normal, 1.5);
    }

    :host([hidden]) {
      display: none;
    }

    /* Horizontal: steps lay out in a row; each step grows to share the width and
       its connector is a horizontal line to the left of the indicator. */
    :host([orientation="horizontal"]) {
      flex: 1 1 0;
      min-width: 0;
    }

    /* The step row. A plain div when presentational; a real button when the
       parent is clickable (then it floors to the AA/AAA target size). */
    .base {
      display: flex;
      align-items: flex-start;
      gap: var(--fluid-space-3);
      width: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      color: inherit;
      text-align: start;
    }

    /* Horizontal layout: connector + indicator on one row, text underneath. */
    :host([orientation="horizontal"]) .base {
      flex-direction: column;
      align-items: center;
      gap: var(--fluid-space-2);
      text-align: center;
    }

    .base.clickable {
      cursor: pointer;
      padding: var(--fluid-space-1);
      margin: calc(-1 * var(--fluid-space-1));
      border-radius: var(--fluid-radius-sm);
    }

    :host([orientation="vertical"]) .base.clickable {
      align-items: center;
      /* SC 2.5.8 Target Size, floor to --fluid-target-min (24px AA / 44px AAA). */
      min-height: max(var(--_indicator), var(--fluid-target-min, 0px));
    }

    .base.clickable:focus-visible {
      outline: var(--fluid-step-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-step-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }

    /* Indicator + connector live in a small "rail" so the connector can run from
       the previous indicator into this one along the layout axis. */
    .rail {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }
    :host([orientation="horizontal"]) .rail {
      width: 100%;
      flex-direction: row;
      justify-content: center;
    }
    :host([orientation="vertical"]) .rail {
      flex-direction: column;
    }

    .connector {
      flex: 1 1 auto;
      background: var(--fluid-step-connector-color, var(--fluid-border-default));
    }
    :host([orientation="horizontal"]) .connector {
      height: var(--_conn-size);
      margin-inline-end: var(--fluid-step-gap, var(--fluid-space-2));
    }
    :host([orientation="vertical"]) .connector {
      width: var(--_conn-size);
      min-height: var(--fluid-space-4);
      margin-block-end: var(--fluid-step-gap, var(--fluid-space-2));
    }
    /* A completed segment (this step is complete OR current) rides the accent. */
    :host([state="complete"]) .connector,
    :host([state="current"]) .connector {
      background: var(--fluid-step-connector-complete-color, var(--fluid-accent-base));
    }
    .connector.hidden {
      display: none;
    }

    .indicator {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_indicator);
      height: var(--_indicator);
      border-radius: var(--fluid-radius-full);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      line-height: 1;
      /* Default (upcoming), muted surface + secondary text. */
      background: var(--fluid-step-upcoming-bg, var(--fluid-surface-muted));
      color: var(--fluid-step-upcoming-fg, var(--fluid-text-secondary));
    }

    :host([state="complete"]) .indicator {
      background: var(--fluid-step-complete-bg, var(--fluid-accent-base));
      color: var(--fluid-step-complete-fg, var(--fluid-accent-text));
    }

    :host([state="current"]) .indicator {
      background: var(--fluid-step-current-bg, var(--fluid-accent-base));
      color: var(--fluid-step-current-fg, var(--fluid-accent-text));
    }

    .indicator fluid-icon {
      font-size: calc(var(--_indicator) * 0.6);
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-1);
      min-width: 0;
    }

    .label {
      font-size: var(--fluid-step-font-size, var(--fluid-font-size-md));
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-step-label-fg, var(--fluid-text-secondary));
    }

    :host([state="current"]) .label,
    :host([state="complete"]) .label {
      color: var(--fluid-step-current-label-fg, var(--fluid-text-primary));
    }

    .description {
      font-size: var(--fluid-font-size-sm);
      color: var(--fluid-step-description-fg, var(--fluid-text-secondary));
    }

    .description.empty {
      display: none;
    }

    ::slotted(*) {
      margin: 0 !important;
    }

    /* ---- Chip variant: compact pills, number badge + inline label, no
       connectors. Placed after the orientation rules so it wins at equal
       specificity regardless of axis. ---- */
    :host([variant="chip"]) {
      flex: 0 0 auto;
    }
    :host([variant="chip"]) .base,
    :host([variant="chip"][orientation="horizontal"]) .base {
      flex-direction: row;
      align-items: center;
      gap: var(--fluid-space-2);
      width: auto;
      text-align: start;
      padding: var(--fluid-space-1) var(--fluid-space-3);
      border: var(--fluid-field-border-width, 1px) solid
        var(--fluid-step-chip-border, var(--fluid-border-default));
      border-radius: var(--fluid-radius-full);
      background: var(--fluid-step-chip-bg, var(--fluid-surface-subtle));
      /* SC 2.5.8 Target Size when clickable (24px AA / 44px AAA). */
      min-height: max(var(--_indicator), var(--fluid-target-min, 0px));
    }
    :host([variant="chip"]) .base.clickable {
      margin: 0;
    }
    :host([variant="chip"]) .rail {
      width: auto;
    }
    :host([variant="chip"]) .connector {
      display: none;
    }
    :host([variant="chip"]) .indicator {
      --_indicator: var(--fluid-step-chip-indicator-size, 1.4rem);
      font-size: var(--fluid-font-size-xs, 0.75rem);
    }
    :host([variant="chip"]) .text {
      flex-direction: row;
    }
    :host([variant="chip"]) .description {
      display: none;
    }
    /* Current pill: accent border + tinted fill, bolder label. */
    :host([variant="chip"][state="current"]) .base {
      border-color: var(--fluid-step-chip-current-border, var(--fluid-accent-base));
      background: var(
        --fluid-step-chip-current-bg,
        color-mix(in srgb, var(--fluid-accent-base) 10%, transparent)
      );
    }
    :host([variant="chip"][state="current"]) .label {
      color: var(--fluid-step-current-label-fg, var(--fluid-text-primary));
      font-weight: var(--fluid-font-weight-semibold);
    }
  `;

  /**
   * Visual state, managed by the parent `<fluid-steps>`. One of
   * "complete" | "current" | "upcoming".
   */
  @property({ reflect: true }) state: FluidStepState = "upcoming";

  /** Optional secondary text under the label (alternative to the `description` slot). */
  @property() description = "";

  /**
   * Whether this step renders as an interactive `<button>`. Set by the parent
   * `<fluid-steps clickable>`, not authored directly.
   */
  @property({ type: Boolean, reflect: true }) clickable = false;

  /** 1-based number shown in the indicator. Set by the parent. */
  @property({ type: Number }) index = 0;

  /** Layout axis. Mirrors the parent `<fluid-steps>`; set by the parent. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" = "horizontal";

  /** Visual variant. Mirrors the parent `<fluid-steps>`; set by the parent. */
  @property({ reflect: true }) variant: "default" | "chip" = "default";

  /** True for the first step (suppresses the leading connector). Set by the parent. */
  @property({ type: Boolean }) first = false;

  @state() private hasDescriptionSlot = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("state")) {
      // The current step carries aria-current; the visible label + number
      // convey progress, so the check icon stays decorative (aria-hidden).
      if (this.state === "current") this.setAttribute("aria-current", "step");
      else this.removeAttribute("aria-current");
    }
  }

  private handleDescSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this.hasDescriptionSlot = slot.assignedNodes({ flatten: true }).length > 0;
  };

  private get isComplete(): boolean {
    return this.state === "complete";
  }

  private renderRail(): TemplateResult {
    // The connector runs INTO this step from the previous one, so its color
    // reflects this step's own state (complete/current = filled accent). The
    // first step has no leading connector.
    return html`
      <span class="rail">
        <span part="connector" class="connector ${this.first ? "hidden" : ""}" aria-hidden="true"></span>
        <span part="indicator" class="indicator">
          ${this.isComplete
            ? html`<fluid-icon name="check" aria-hidden="true"></fluid-icon>`
            : html`${this.index || nothing}`}
        </span>
      </span>
    `;
  }

  private renderBody(): TemplateResult {
    const hasDescAttr = this.description.length > 0;
    return html`
      ${this.renderRail()}
      <span class="text">
        <span part="label" class="label"><slot></slot></span>
        <span
          part="description"
          class="description ${hasDescAttr || this.hasDescriptionSlot ? "" : "empty"}"
        >
          ${hasDescAttr ? this.description : nothing}
          <slot name="description" @slotchange=${this.handleDescSlotChange}></slot>
        </span>
      </span>
    `;
  }

  override render(): TemplateResult {
    return this.clickable
      ? html`<button type="button" part="base" class="base clickable">
          ${this.renderBody()}
        </button>`
      : html`<div part="base" class="base">${this.renderBody()}</div>`;
  }
}
