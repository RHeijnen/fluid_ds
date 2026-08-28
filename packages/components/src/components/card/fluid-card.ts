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
 * @cssproperty --fluid-card-border-default - Component override for the corresponding semantic token.
 * @cssproperty --fluid-card-shadow-md - Component override for the corresponding semantic token.
 * @cssproperty --fluid-card-surface-subtle - Component override for the corresponding semantic token.
 * @cssproperty --fluid-card-text-primary - Component override for the corresponding semantic token.
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
      color: var(--fluid-card-text-primary, var(--fluid-text-primary));
      overflow: hidden;
    }

    .variant-elevated {
      box-shadow: var(--fluid-card-shadow-md, var(--fluid-shadow-md));
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
      min-width: 0;
      padding: var(--fluid-card-padding, var(--fluid-space-4));
      overflow-wrap: anywhere;
    }

    .header {
      border-bottom: 1px solid var(--fluid-card-border-default, var(--fluid-border-default));
      font-weight: var(--fluid-font-weight-semibold);
    }

    .footer {
      border-top: 1px solid var(--fluid-card-border-default, var(--fluid-border-default));
      background: var(--fluid-card-surface-subtle, var(--fluid-surface-subtle));
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
          <slot @slotchange=${this.toggleSection}></slot>
        </div>
        <footer part="footer" class="footer">
          <slot name="footer" @slotchange=${this.toggleSection}></slot>
        </footer>
      </article>
    `;
  }

  private toggleSection = (e: Event) => {
    this.updateSection(e.target as HTMLSlotElement);
  };

  private updateSection(slot: HTMLSlotElement): void {
    const parent = slot.parentElement;
    if (!parent) return;
    const hasContent = slot
      .assignedNodes({ flatten: true })
      .some((node) => node instanceof Element || Boolean(node.textContent?.trim()));
    parent.classList.toggle("empty", !hasContent);
  }

  protected override firstUpdated(): void {
    // Hide sections with no slotted content (initial pass).
    const root = this.shadowRoot!;
    for (const name of ["header", "", "footer"]) {
      const selector = name ? `slot[name="${name}"]` : "slot:not([name])";
      const slot = root.querySelector<HTMLSlotElement>(selector);
      if (slot) this.updateSection(slot);
    }
  }
}
