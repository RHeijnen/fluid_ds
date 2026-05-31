import { html, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { scaleRemTokens, currentScale } from "../scale-tokens.js";

const DENSITY: Record<string, number> = { compact: 0.85, cozy: 1, comfortable: 1.15 };

function densityFromStore(): string {
  const f = currentScale("--fluid-space-4");
  if (f <= 0.92) return "compact";
  if (f >= 1.08) return "comfortable";
  return "cozy";
}

/**
 * Step 6, Shape & density. Roundness scales the --fluid-radius-* ramp; density
 * scales the --fluid-space-* ramp (wizard-side multiplier, no token-source
 * change, per the plan). Motion lives on the Accessibility step.
 */
@customElement("wizard-step-shape")
export class WizardStepShape extends WizardStep {
  protected stepTitle = "Shape & density";
  protected stepLede =
    "Corner roundness and spacing density. Each control derives a whole ramp from one value.";

  @state() private roundness = currentScale("--fluid-radius-md");
  @state() private density = densityFromStore();

  private onRoundness(e: Event): void {
    const v = Number((e as CustomEvent<{ value: number }>).detail?.value);
    if (!Number.isFinite(v)) return;
    this.roundness = v;
    scaleRemTokens("--fluid-radius-", v);
  }

  private onDensity(e: Event): void {
    const v = (e as CustomEvent<{ value: string }>).detail?.value;
    if (!v) return;
    this.density = v;
    scaleRemTokens("--fluid-space-", DENSITY[v] ?? 1);
  }

  override render(): TemplateResult {
    return html`
      ${this.header()}

      <div class="field">
        <label for="round">Corner roundness, ${this.roundness.toFixed(2)}×</label>
        <fluid-slider id="round" min="0" max="1.6" step="0.1" value=${this.roundness} @fluid-change=${this.onRoundness}></fluid-slider>
      </div>

      <div class="field">
        <label>Spacing density</label>
        <fluid-segmented-control value=${this.density} aria-label="Density" @fluid-change=${this.onDensity}>
          <fluid-segment value="compact">Compact</fluid-segment>
          <fluid-segment value="cozy">Cozy</fluid-segment>
          <fluid-segment value="comfortable">Comfortable</fluid-segment>
        </fluid-segmented-control>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-shape": WizardStepShape;
  }
}
