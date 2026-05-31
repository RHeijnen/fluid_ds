import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from "lit";

/**
 * Shared base for every wizard step: consistent heading + lede, focus
 * management (moves focus to the step heading when the step mounts, so screen
 * readers announce the new context), and shared layout styles.
 */
export abstract class WizardStep extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      display: block;
    }
    h2 {
      font-size: 1.4rem;
      margin: 0 0 0.35rem;
      letter-spacing: -0.01em;
      outline: none;
    }
    .lede {
      margin: 0 0 1.5rem;
      color: var(--fluid-text-secondary);
      max-width: 58ch;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .choice {
      all: unset;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      border: 1.5px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      cursor: pointer;
    }
    .choice:hover {
      border-color: var(--fluid-border-strong, var(--fluid-border-default));
    }
    .choice[aria-pressed="true"] {
      border-color: var(--fluid-accent-base);
      background: color-mix(in srgb, var(--fluid-accent-base) 8%, transparent);
    }
    .choice .title {
      font-weight: 600;
    }
    .choice .desc {
      font-size: 0.85rem;
      color: var(--fluid-text-secondary);
    }
    .field {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      max-width: 32rem;
    }
    .field > label {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .placeholder {
      padding: 2rem;
      border: 1.5px dashed var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      color: var(--fluid-text-secondary);
      text-align: center;
    }
  `;

  protected abstract stepTitle: string;
  protected abstract stepLede: string;

  override firstUpdated(): void {
    const h = this.shadowRoot?.querySelector("h2") as HTMLElement | null;
    h?.focus();
  }

  protected header(): TemplateResult {
    return html`<h2 tabindex="-1">${this.stepTitle}</h2>
      <p class="lede">${this.stepLede}</p>`;
  }
}
