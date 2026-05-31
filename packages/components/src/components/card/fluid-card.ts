import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidCardVariant = "elevated" | "outlined" | "filled";

/**
 * A surface for grouping related content.
 *
 * @summary Flexible container with header / body / footer slots.
 *
 * @slot header - Card header (typically a title and actions).
 * @slot - Card body content (default slot).
 * @slot footer - Card footer.
 *
 * @csspart base - The outer container.
 * @csspart header - The header wrapper.
 * @csspart body - The body wrapper.
 * @csspart footer - The footer wrapper.
 *
 * @cssproperty --fluid-card-bg - Background color.
 * @cssproperty --fluid-card-border - Border color.
 * @cssproperty --fluid-card-padding - Padding inside each section.
 *
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-surface-subtle - Footer background.
 * @uses-token --fluid-border-default - Header/footer separators.
 * @uses-token --fluid-text-primary - Text color.
 */
export class FluidCard extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      flex-direction: column;
      background: var(--fluid-card-bg, var(--fluid-surface-base));
      border-radius: var(--fluid-radius-lg);
      color: var(--fluid-text-primary);
      overflow: hidden;
    }

    .variant-elevated {
      box-shadow: var(--fluid-shadow-md);
    }

    .variant-outlined {
      border: 1px solid var(--fluid-card-border, var(--fluid-border-default));
    }

    .variant-filled {
      background: var(--fluid-card-bg, var(--fluid-surface-subtle));
    }

    .header,
    .body,
    .footer {
      padding: var(--fluid-card-padding, var(--fluid-space-4));
    }

    .header {
      border-bottom: 1px solid var(--fluid-border-default);
      font-weight: var(--fluid-font-weight-semibold);
    }

    .footer {
      border-top: 1px solid var(--fluid-border-default);
      background: var(--fluid-surface-subtle);
    }

    .empty {
      display: none;
    }
  `;

  /** Visual variant. */
  @property({ reflect: true }) variant: FluidCardVariant = "elevated";

  override render(): TemplateResult {
    return html`
      <article part="base" class="base variant-${this.variant}">
        <header part="header" class="header">
          <slot name="header" @slotchange=${this.toggleSection}></slot>
        </header>
        <div part="body" class="body">
          <slot></slot>
        </div>
        <footer part="footer" class="footer">
          <slot name="footer" @slotchange=${this.toggleSection}></slot>
        </footer>
      </article>
    `;
  }

  private toggleSection = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const parent = slot.parentElement;
    if (!parent) return;
    const hasContent = slot.assignedNodes({ flatten: true }).length > 0;
    parent.classList.toggle("empty", !hasContent);
  };

  protected override firstUpdated(): void {
    // Hide header/footer if no slotted content (initial pass).
    const root = this.shadowRoot!;
    for (const name of ["header", "footer"]) {
      const slot = root.querySelector<HTMLSlotElement>(`slot[name="${name}"]`);
      if (slot && slot.assignedNodes({ flatten: true }).length === 0) {
        slot.parentElement?.classList.add("empty");
      }
    }
  }
}
