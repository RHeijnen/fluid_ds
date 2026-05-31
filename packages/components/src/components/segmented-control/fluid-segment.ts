import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * One option inside a `<fluid-segmented-control>`.
 *
 * @summary Individual segment / radio choice.
 *
 * @slot - The visible label.
 *
 * Every styled property reads a component-scoped `--fluid-segment-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-segment-fg - Default segment text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-segment-hover-fg - Text color on hover. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-segment-selected-bg - Background color when selected. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-segment-selected-fg - Text color when selected. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-segment-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-segment-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-segment-font-size - Font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-segment-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-segment-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-surface-base - Selected segment background.
 * @uses-token --fluid-text-primary - Hovered / selected segment text.
 * @uses-token --fluid-text-secondary - Default segment text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum segment hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-font-family-sans - Font family.
 * @uses-token --fluid-font-size-sm - Font size.
 * @uses-token --fluid-shadow-sm - Selected-segment elevation.
 */
export class FluidSegment extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      flex: 1 1 0;
      align-items: center;
      justify-content: center;
      /* SC 2.5.8 Target Size, floor the segment to --fluid-target-min. */
      min-height: var(--fluid-target-min, 0px);
      padding: var(--fluid-space-1) var(--fluid-space-3);
      font-family: var(--fluid-segment-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-segment-font-size, var(--fluid-font-size-sm));
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-segment-fg, var(--fluid-text-secondary));
      cursor: pointer;
      user-select: none;
      border-radius: var(--fluid-segment-radius, var(--fluid-radius-md));
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host(:hover) {
      color: var(--fluid-segment-hover-fg, var(--fluid-text-primary));
    }

    /* The raised "selected" surface is drawn by the parent's sliding .thumb
       (so it animates between segments); the segment itself only switches its
       text color. --fluid-segment-selected-bg is kept for back-compat but the
       thumb fill is --fluid-segmented-thumb-bg on the control. */
    :host([selected]) {
      color: var(--fluid-segment-selected-fg, var(--fluid-text-primary));
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: not-allowed;
    }

    :host(:focus-visible) {
      outline: var(--fluid-segment-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-segment-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }
  `;

  /** Value submitted when this segment is chosen. */
  @property() value = "";

  /** Whether this segment is currently selected. Managed by parent. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "radio");
    if (!this.id) this.id = `fluid-segment-${++counter}`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("selected")) {
      this.setAttribute("aria-checked", this.selected ? "true" : "false");
      this.setAttribute("tabindex", this.selected ? "0" : "-1");
    }
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
