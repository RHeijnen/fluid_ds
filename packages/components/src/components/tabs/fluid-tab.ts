import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * A single tab inside a `<fluid-tabs>` element.
 *
 * @summary Clickable tab; linked to a `<fluid-tab-panel>` by `panel` name.
 *
 * @slot - The tab label.
 *
 * Every styled property reads a component-scoped `--fluid-tab-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-tab-fg - Default tab text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-tab-hover-fg - Hovered tab text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-tab-selected-fg - Selected tab text + underline color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-tab-indicator-width - Selected underline thickness. Falls back to 2px.
 * @cssproperty --fluid-tab-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-tab-font-size - Label font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-tab-focus-ring - Keyboard focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-tab-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-accent-base - Active tab text + underline.
 * @uses-token --fluid-text-primary - Hovered tab text.
 * @uses-token --fluid-text-secondary - Default tab text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum tab hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-md - Label font size.
 * @uses-token --fluid-radius-sm - Focus ring corner radius.
 */
export class FluidTab extends FluidElement {
  static override styles = css`
    /*
     * SC 2.5.8 Target Size, the tab floors its height to --fluid-target-min
     * (24px AA / 44px AAA); align-items keeps the label centered as it grows.
     */
    :host {
      display: inline-flex;
      align-items: center;
      min-height: var(--fluid-target-min, 0px);
      padding: var(--fluid-space-2) var(--fluid-space-4);
      font-family: var(--fluid-tab-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-tab-font-size, var(--fluid-font-size-md));
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-tab-fg, var(--fluid-text-secondary));
      cursor: pointer;
      user-select: none;
      border-bottom: var(--fluid-tab-indicator-width, 2px) solid transparent;
      transition:
        color var(--fluid-duration-fast) var(--fluid-easing-standard),
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host(:hover) {
      color: var(--fluid-tab-hover-fg, var(--fluid-text-primary));
    }

    /* The underline is drawn by the parent's sliding .indicator (so it
       animates between tabs); the tab only switches its text color. The
       transparent border-bottom stays to reserve the same vertical space. */
    :host([selected]) {
      color: var(--fluid-tab-selected-fg, var(--fluid-accent-base));
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host(:focus-visible) {
      outline: var(--fluid-tab-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-tab-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: -2px;
      border-radius: var(--fluid-radius-sm);
    }
  `;

  /** Name of the panel this tab controls. */
  @property() panel = "";

  /** Whether this tab is currently selected. Managed by the parent `<fluid-tabs>`. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Whether this tab is disabled. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "tab");
    if (!this.id) this.id = `fluid-tab-${++counter}`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("selected")) {
      this.setAttribute("aria-selected", this.selected ? "true" : "false");
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
