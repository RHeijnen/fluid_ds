import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { themeStore } from "../theme-store.js";
import { semanticDefault } from "../scale-tokens.js";
import { contrastRatio, contrastVerdict } from "../contrast.js";

const TONES = ["success", "danger", "warning", "info"] as const;
type Tone = (typeof TONES)[number];

/**
 * Step 4, Status colors (advanced / optional). Semantic tones are
 * theme-independent across brands, so most teams keep the defaults. Editing
 * one writes the previewed scheme's `--fluid-<tone>-base`; the other scheme
 * keeps defaults unless also overridden (v1 scope, per the plan).
 */
@customElement("wizard-step-tones")
export class WizardStepTones extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .tone {
        display: grid;
        gap: 0.4rem;
        margin: 1rem 0;
        max-width: 30rem;
      }
      .tone > label {
        font-weight: 600;
        text-transform: capitalize;
      }
    `
  ];

  protected stepTitle = "Status colors";
  protected stepLede =
    "success / danger / warning / info are theme-independent across brands, a delete button stays red everywhere. Most teams keep the defaults.";

  @state() private values: Record<Tone, string> = Object.fromEntries(
    TONES.map((t) => [t, themeStore.get(`--fluid-${t}-base`) ?? semanticDefault(`--fluid-${t}-base`)])
  ) as Record<Tone, string>;

  private onPick(tone: Tone, e: Event): void {
    const value = (e as CustomEvent<{ value: string }>).detail?.value;
    if (!value) return;
    this.values = { ...this.values, [tone]: value };
    themeStore.set(`--fluid-${tone}-base`, value);
  }

  override render(): TemplateResult {
    return html`
      ${this.header()}
      ${TONES.map((tone) => {
        const base = this.values[tone];
        const text = semanticDefault(`--fluid-${tone}-text`) || "#ffffff";
        const v = contrastVerdict(contrastRatio(base, text));
        return html`
          <div class="tone">
            <label for="tone-${tone}">${tone}</label>
            <fluid-color-picker
              id="tone-${tone}"
              value=${base}
              @fluid-change=${(e: Event) => this.onPick(tone, e)}
            ></fluid-color-picker>
            <fluid-callout variant=${v.tone}>Label on ${tone}: ${v.label}</fluid-callout>
          </div>
        `;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-tones": WizardStepTones;
  }
}
