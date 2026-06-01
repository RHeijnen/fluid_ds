import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A styled semantic list container implementing the native list role.
 *
 * The container wraps a `role="list"` surface; its `<fluid-list-item>` children
 * are `role="listitem"`. This element is purely the surface and divider styling,
 * it does not own keyboard navigation (rows are individually focusable when
 * `interactive` or rendered as links, matching their native semantics). An
 * optional accessible name can be set with `label` (or `aria-label`).
 *
 * @summary A styled semantic list surface.
 *
 * @slot - One or more `<fluid-list-item>` elements.
 *
 * @csspart base - The `role="list"` surface.
 *
 * Every styled property reads a component-scoped `--fluid-list-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-list-bg - Surface background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-list-fg - Primary text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-list-border - Outer border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-list-radius - Outer corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-list-divider - Color of the rule between rows. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-surface-base - Surface background.
 * @uses-token --fluid-text-primary - Primary text color.
 * @uses-token --fluid-border-default - Outer border and dividers.
 * @uses-token --fluid-radius-md - Outer corner radius.
 */
export class FluidList extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        font-family: var(--fluid-font-family-sans);
        line-height: var(--fluid-line-height-normal, 1.5);
        color: var(--fluid-list-fg, var(--fluid-text-primary));
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--fluid-list-bg, var(--fluid-surface-base));
        border-radius: var(--fluid-list-radius, var(--fluid-radius-md));
      }

      /* Bordered variant: outer frame plus a rule between rows. */
      :host([bordered]) .base {
        border: 1px solid var(--fluid-list-border, var(--fluid-border-default));
        overflow: hidden;
      }

      /* Dividers between rows. Hosted here so a single token controls them and
         they survive slotted-content theming. */
      :host([divided]) ::slotted(fluid-list-item:not(:first-child)) {
        border-top: 1px solid var(--fluid-list-divider, var(--fluid-border-default));
      }
    `
  ];

  /** Accessible label for the list. Mirrors aria-label onto the inner surface. */
  @property() label: string | null = null;

  /** Draw an outer border around the list. */
  @property({ type: Boolean, reflect: true }) bordered = false;

  /** Draw a divider rule between rows. */
  @property({ type: Boolean, reflect: true }) divided = false;

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="base"
        role="list"
        aria-label=${ifDefined(this.label ?? this.ariaLabel ?? undefined)}
      >
        <slot></slot>
      </div>
    `;
  }
}
