import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single row inside a `<fluid-list>`, with role="listitem".
 *
 * The row has four content regions: a `leading` slot (icon / avatar), the
 * default slot (primary text), a `description` slot (secondary text below the
 * primary), and a `trailing` slot (meta / actions). By default the row is
 * passive. Set `interactive` to render the row body as a real `<button>` (it
 * gains hover, a focus ring, and fires `fluid-select` on activation), or set
 * `href` to render it as a real `<a>` link. `disabled` suppresses interaction
 * on both.
 *
 * Because `interactive` rows wrap a native `<button>` and link rows wrap a
 * native `<a>`, they inherit the platform keyboard contract for free: a button
 * activates on Enter and Space, a link on Enter, and both are in the tab order.
 *
 * @summary A row in a styled list, optionally interactive or a link.
 *
 * @slot - Primary text content.
 * @slot leading - Leading visual (icon or avatar).
 * @slot description - Secondary text shown below the primary content.
 * @slot trailing - Trailing meta or actions, kept out of the activation target.
 *
 * @csspart base - The row container (the `<button>`, `<a>`, or `<div>`).
 * @csspart leading - The leading slot wrapper.
 * @csspart content - The primary + description column.
 * @csspart primary - The primary text wrapper.
 * @csspart description - The secondary text wrapper.
 * @csspart trailing - The trailing slot wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-list-item-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-list-item-bg - Row background. Falls back to transparent.
 * @cssproperty --fluid-list-item-hover-bg - Row background on hover/focus (interactive). Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-list-item-fg - Primary text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-list-item-secondary-fg - Description text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-list-item-radius - Row corner radius (for hover/focus). Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-list-item-padding - Row inner padding. Falls back to --fluid-space-3.
 *
 * @uses-token --fluid-text-primary - Primary text color.
 * @uses-token --fluid-text-secondary - Description text color.
 * @uses-token --fluid-surface-muted - Hover/focus background.
 * @uses-token --fluid-radius-sm - Row corner radius.
 * @uses-token --fluid-space-3 - Row inner padding.
 * @uses-token --fluid-target-min - Minimum interactive row height.
 * @uses-token --fluid-focus-ring-width - Focus ring thickness.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 *
 * @fires fluid-select - Fired when an `interactive` row is activated (click,
 *   Enter, or Space). Bubbles and is composed. Not fired for link rows or when
 *   disabled.
 */
export class FluidListItem extends FluidElement {
  static override shadowRootOptions: ShadowRootInit = {
    ...FluidElement.shadowRootOptions,
    delegatesFocus: true
  };

  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--fluid-space-3);
        width: 100%;
        margin: 0;
        padding: var(--fluid-list-item-padding, var(--fluid-space-3));
        background: var(--fluid-list-item-bg, transparent);
        color: var(--fluid-list-item-fg, var(--fluid-text-primary));
        font-family: inherit;
        font-size: var(--fluid-font-size-sm);
        line-height: var(--fluid-line-height-normal, 1.5);
        text-align: left;
        text-decoration: none;
      }

      /* Interactive + link rows: native control reset, hover, focus ring,
         conformance-aware target size. */
      button.base,
      a.base {
        border: 0;
        border-radius: var(--fluid-list-item-radius, var(--fluid-radius-sm));
        cursor: pointer;
        min-height: max(2.25rem, var(--fluid-target-min, 0px));
        transition: background-color var(--fluid-duration-fast, 120ms)
          var(--fluid-easing-standard, ease);
        appearance: none;
        -webkit-appearance: none;
      }

      button.base:hover,
      a.base:hover,
      button.base:focus-visible,
      a.base:focus-visible {
        background: var(--fluid-list-item-hover-bg, var(--fluid-surface-muted));
      }

      button.base:focus-visible,
      a.base:focus-visible {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-focus-ring-color, var(--fluid-accent-base));
        outline-offset: calc(-1 * var(--fluid-focus-ring-width, 2px));
      }

      :host([disabled]) .base {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .leading {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-space-1);
        flex: 1 1 auto;
        min-width: 0;
      }

      .primary {
        display: block;
        min-width: 0;
      }

      .description {
        display: block;
        color: var(--fluid-list-item-secondary-fg, var(--fluid-text-secondary));
        font-size: var(--fluid-font-size-xs);
      }

      .trailing {
        display: inline-flex;
        align-items: center;
        gap: var(--fluid-space-2);
        flex: 0 0 auto;
      }

      /* Slotted content inherits the host PAGE's CSS, not these shadow styles,
         so reset margins on everything we slot in to survive a prose context. */
      ::slotted(*) {
        margin: 0;
      }
    `
  ];

  /** Render the row body as a button that fires `fluid-select` on activation. */
  @property({ type: Boolean, reflect: true }) interactive = false;

  /** Render the row body as a link. Takes precedence over `interactive`. */
  @property() href: string | null = null;

  /** Link target (only meaningful with `href`). */
  @property() target: string | null = null;

  /** Disable interaction on an interactive or link row. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    // The host is the listitem; the inner button/a/div is the row body so the
    // listitem role is never lost to the interactive wrapper's implicit role.
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  private handleActivate = (e: Event) => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.dispatchEvent(
      new CustomEvent("fluid-select", { bubbles: true, composed: true })
    );
  };

  private renderInner(): TemplateResult {
    return html`
      <span part="leading" class="leading">
        <slot name="leading"></slot>
      </span>
      <span part="content" class="content">
        <span part="primary" class="primary"><slot></slot></span>
        <span part="description" class="description"><slot name="description"></slot></span>
      </span>
      <span part="trailing" class="trailing">
        <slot name="trailing"></slot>
      </span>
    `;
  }

  override render(): TemplateResult {
    // A link row takes precedence. We drop href when disabled so the link is
    // inert and not focusable, matching the disabled visual.
    if (this.href !== null) {
      return html`
        <a
          part="base"
          class="base"
          href=${ifDefined(this.disabled ? undefined : this.href)}
          target=${ifDefined(this.target ?? undefined)}
          aria-disabled=${this.disabled ? "true" : "false"}
        >
          ${this.renderInner()}
        </a>
      `;
    }

    if (this.interactive) {
      return html`
        <button
          part="base"
          class="base"
          type="button"
          ?disabled=${this.disabled}
          @click=${this.handleActivate}
        >
          ${this.renderInner()}
        </button>
      `;
    }

    return html`<div part="base" class="base">${this.renderInner()}</div>`;
  }
}
