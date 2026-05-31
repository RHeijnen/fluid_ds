import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { isExpansion, packageFor } from "./component-packages.js";

/**
 * Thin wrapper around <fluid-card> for the playground preview pane. Adds a
 * "Requires @fluid-ds/X" badge for components that live in expansion packs.
 *
 * Use this instead of `<fluid-card>` directly for each component demo so
 * consumers of the playground always know which package they need to install.
 */
@customElement("preview-card")
export class PreviewCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-3);
    }

    .title {
      font-size: var(--fluid-font-size-md);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
    }

    fluid-badge {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
    }
  `;

  /** Component tag this card demos. Drives the expansion-pack badge. */
  @property() tag = "";

  /** Visible title (defaults to a human-friendly version of `tag`). */
  @property() label = "";

  override render(): TemplateResult {
    const title = this.label || this.tag.replace(/^fluid-/, "").replace(/-/g, " ");
    const expansion = isExpansion(this.tag);
    return html`
      <fluid-card>
        <div slot="header" class="header">
          <span class="title">${title}</span>
          ${expansion
            ? html`<fluid-badge variant="info" size="sm">${packageFor(this.tag)}</fluid-badge>`
            : ""}
        </div>
        <slot></slot>
      </fluid-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "preview-card": PreviewCard;
  }
}
