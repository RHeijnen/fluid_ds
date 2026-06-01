import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A centered placeholder for "nothing here yet" states: an optional icon /
 * illustration, a heading, supporting text, and call-to-action buttons. Use it
 * for empty lists, no-results, and first-run screens.
 *
 * @summary Placeholder for empty or no-results states.
 *
 * @slot media - An icon or illustration above the heading.
 * @slot - The supporting description text.
 * @slot actions - Call-to-action buttons below the text.
 *
 * @csspart base - The container.
 * @csspart media - The media wrapper.
 * @csspart heading - The heading element.
 * @csspart actions - The actions wrapper.
 *
 * @cssproperty --fluid-empty-state-fg - Heading text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-empty-state-muted-fg - Description text. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-empty-state-gap - Vertical gap. Falls back to 0.75rem.
 * @cssproperty --fluid-empty-state-max-width - Max content width. Falls back to 28rem.
 *
 * @uses-token --fluid-text-primary - Heading text.
 * @uses-token --fluid-text-secondary - Description text.
 */
export class FluidEmptyState extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
    }
    .base {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--fluid-empty-state-gap, 0.75rem);
      max-width: var(--fluid-empty-state-max-width, 28rem);
      margin-inline: auto;
      padding: 2rem 1rem;
    }
    .media {
      display: inline-flex;
      color: var(--fluid-empty-state-muted-fg, var(--fluid-text-secondary));
      font-size: 2.5rem;
    }
    .media ::slotted(*) {
      width: 3rem;
      height: 3rem;
    }
    .heading {
      margin: 0;
      font-size: var(--fluid-font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--fluid-empty-state-fg, var(--fluid-text-primary));
    }
    .description {
      color: var(--fluid-empty-state-muted-fg, var(--fluid-text-secondary));
      font-size: var(--fluid-font-size-sm, 0.875rem);
      line-height: 1.5;
    }
    .description ::slotted(*) {
      margin: 0 !important;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.25rem;
    }
    .actions:not(:has(*))::slotted(*) {
      display: none;
    }
    [hidden] {
      display: none !important;
    }
  `;

  /** The heading text. (Use the default slot for longer descriptions.) */
  @property() heading = "";

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <span part="media" class="media"><slot name="media"></slot></span>
        ${this.heading ? html`<p part="heading" class="heading">${this.heading}</p>` : ""}
        <div class="description"><slot></slot></div>
        <div part="actions" class="actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
}
