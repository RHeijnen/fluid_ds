import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { isExpansion, packageFor } from "./component-packages.js";

/**
 * Flat section item for the playground preview pane (formerly a fluid-card
 * wrapper; the gallery now groups plain sections under tabs). Renders the
 * component name, an expansion-pack badge when the component ships outside
 * the core package, and the demo content below.
 *
 * Use this for each component demo so consumers of the playground always
 * know which package they need to install.
 */
@customElement("preview-card")
export class PreviewCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      margin-block-end: var(--fluid-space-3);
      padding-block-end: var(--fluid-space-2);
      border-block-end: 1px solid var(--fluid-border-default);
    }

    .title {
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
      text-transform: capitalize;
    }

    fluid-badge {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
    }
  `;

  /** Component tag this item demos. Drives the expansion-pack badge. */
  @property() tag = "";

  /** Visible title (defaults to a human-friendly version of tag). */
  @property() label = "";

  override render(): TemplateResult {
    const title = this.label || this.tag.replace(/^fluid-/, "").replace(/-/g, " ");
    const expansion = isExpansion(this.tag);
    return html`
      <section class="item">
        <div class="header">
          <span class="title">${title}</span>
          ${expansion
            ? html`<fluid-badge variant="info" size="sm">${packageFor(this.tag)}</fluid-badge>`
            : ""}
        </div>
        <slot></slot>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "preview-card": PreviewCard;
  }
}
