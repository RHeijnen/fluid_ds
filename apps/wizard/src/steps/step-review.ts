import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { wizardStore, type WizardState } from "../wizard-store.js";
import { themeStore } from "../theme-store.js";

/**
 * Step 8, Review. Summarizes every decision; the persistent preview rail is
 * the live gallery. (The per-component fine-tune drawer is a W3 add behind a
 * flag, see the plan.)
 */
@customElement("wizard-step-review")
export class WizardStepReview extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 0.5rem 1.5rem;
        max-width: 36rem;
      }
      dt {
        color: var(--fluid-text-secondary);
      }
      dd {
        margin: 0;
        font-weight: 600;
      }
    `
  ];

  protected stepTitle = "Review your setup";
  protected stepLede = "Here's everything you chose. The live preview shows it in action, tweak any step or continue to export.";

  @state() private config: WizardState["config"] = wizardStore.get().config;
  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = wizardStore.subscribe((s) => (this.config = s.config));
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  override render(): TemplateResult {
    const overrideCount = Object.keys(themeStore.diff()).length;
    return html`
      ${this.header()}
      <dl>
        <dt>Starting point</dt>
        <dd>${this.config.preset}</dd>
        <dt>Color scheme</dt>
        <dd>${this.config.scheme}</dd>
        <dt>Accent seed</dt>
        <dd>${this.config.seed ?? "default"}</dd>
        <dt>Accessibility</dt>
        <dd>${this.config.conformance.toUpperCase()}</dd>
        <dt>Token overrides</dt>
        <dd>${overrideCount} ${overrideCount === 1 ? "variable" : "variables"}</dd>
      </dl>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-review": WizardStepReview;
  }
}
