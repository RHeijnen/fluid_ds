import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { wizardStore } from "../wizard-store.js";
import { themeStore } from "../theme-store.js";
import { deriveRamp, defaultBrandStop, type DerivedStop } from "../derive-ramp.js";
import { contrastRatio, contrastVerdict } from "../contrast.js";

/**
 * Step 3, Accent (the centerpiece). One seed color derives the full 10-stop
 * brand ramp (OKLCH, matched to the system's curve), written into themeStore so
 * accent/links/focus recolor live. Shows real WCAG contrast verdicts.
 */
@customElement("wizard-step-accent")
export class WizardStepAccent extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .ramp {
        display: flex;
        gap: 4px;
        margin: 0.5rem 0 1.25rem;
      }
      .swatch {
        flex: 1;
        height: 2.5rem;
        border-radius: 6px;
        border: 1px solid color-mix(in srgb, var(--fluid-text-primary) 12%, transparent);
        position: relative;
      }
      .swatch span {
        position: absolute;
        bottom: -1.2rem;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.6rem;
        color: var(--fluid-text-secondary);
      }
      .verdicts {
        display: grid;
        gap: 0.6rem;
        max-width: 32rem;
      }
    `
  ];

  protected stepTitle = "Pick your accent color";
  protected stepLede =
    "Choose one seed, we derive the full 10-stop ramp and check contrast for you. Buttons, links, and focus rings update live in the preview.";

  @state() private seed: string = wizardStore.get().config.seed ?? defaultBrandStop(600) ?? "#2563eb";
  @state() private ramp: DerivedStop[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    // If the seed differs from the default, re-derive on mount so the preview
    // matches a restored/earlier choice.
    this.apply(this.seed, false);
  }

  private apply(seed: string, write = true): void {
    this.seed = seed;
    this.ramp = deriveRamp(seed);
    if (write) {
      wizardStore.setConfig({ seed, preset: "custom" });
      for (const stop of this.ramp) themeStore.set(stop.cssVar, stop.hex);
    }
  }

  private onPick(e: Event): void {
    const value = (e as CustomEvent<{ value: string }>).detail?.value;
    if (value) this.apply(value);
  }

  private stop(n: number): string {
    return this.ramp.find((s) => s.stop === n)?.hex ?? this.seed;
  }

  override render(): TemplateResult {
    // Light accent = brand-600 on white text (button label). Focus ring ≈
    // brand-500 vs the light surface (non-text, needs 3:1).
    const accentText = contrastRatio(this.stop(600), "#ffffff");
    const focusRing = contrastRatio(this.stop(500), "#ffffff");
    const vText = contrastVerdict(accentText);
    const vRing = contrastVerdict(focusRing, { needNonText: true });

    return html`
      ${this.header()}
      <div class="field">
        <label for="seed">Seed color</label>
        <fluid-color-picker
          id="seed"
          value=${this.seed}
          @fluid-change=${this.onPick}
        ></fluid-color-picker>
      </div>

      <div class="ramp" role="img" aria-label="Derived brand ramp">
        ${this.ramp.map(
          (s) => html`<div class="swatch" style="background:${s.hex}" title="${s.cssVar}: ${s.hex}">
            <span>${s.stop}</span>
          </div>`
        )}
      </div>

      <div class="verdicts">
        <fluid-callout variant=${vText.tone}>
          <strong>White text on the accent button:</strong> ${vText.label}
        </fluid-callout>
        <fluid-callout variant=${vRing.tone}>
          <strong>Focus ring vs. surface:</strong> ${vRing.label}
        </fluid-callout>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-accent": WizardStepAccent;
  }
}
