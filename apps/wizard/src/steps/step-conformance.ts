import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { wizardStore, type Conformance } from "../wizard-store.js";
import { themeStore } from "../theme-store.js";

function motionFromStore(): number {
  const m = themeStore.diff()["--fluid-motion"];
  return m != null && Number.isFinite(Number(m)) ? Number(m) : 1;
}

/**
 * Step 7, Accessibility. Conformance level (AA / AAA) plus motion. AA/AAA is an
 * attribute (`data-fluid-conformance`) handled by the base token CSS; motion is
 * the global `--fluid-motion` scalar. Both are comfort / accessibility choices:
 * AAA enlarges targets and focus rings, motion reduces or disables animation
 * (on top of the user's own prefers-reduced-motion).
 */
@customElement("wizard-step-conformance")
export class WizardStepConformance extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .section {
        margin-bottom: 1.75rem;
      }
      .section > h3 {
        font-size: 1rem;
        margin: 0 0 0.6rem;
      }
    `
  ];

  protected stepTitle = "Accessibility";
  protected stepLede =
    "Comfort settings that apply everywhere: conformance level and how much things animate.";

  @state() private level: Conformance = wizardStore.get().config.conformance;
  @state() private motion = motionFromStore();
  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = wizardStore.subscribe((s) => (this.level = s.config.conformance));
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private onChange(e: Event): void {
    const value = (e as CustomEvent<{ value: string }>).detail?.value as Conformance;
    if (value) wizardStore.setConfig({ conformance: value });
  }

  /**
   * Human label for the motion value. --fluid-motion is a DURATION multiplier
   * (higher = longer = slower), so the descriptor spells that out — otherwise a
   * bare "1.50×" reads like "1.5x faster", which is the opposite of what it does.
   */
  private get motionLabel(): string {
    const m = this.motion;
    if (m === 0) return "off";
    const feel = m < 1 ? "snappier" : m > 1 ? "slower" : "default";
    return `${m.toFixed(2)}× duration (${feel})`;
  }

  private onMotion(e: Event): void {
    const v = Number((e as CustomEvent<{ value: number }>).detail?.value);
    if (!Number.isFinite(v)) return;
    this.motion = v;
    // Inherited scalar; 1 = default (clear the override), 0 = off.
    themeStore.set("--fluid-motion", v === 1 ? "" : String(v));
  }

  override render(): TemplateResult {
    return html`
      ${this.header()}

      <div class="section">
        <h3>Conformance level</h3>
        <fluid-segmented-control
          value=${this.level}
          aria-label="Conformance level"
          @fluid-change=${this.onChange}
        >
          <fluid-segment value="aa">AA</fluid-segment>
          <fluid-segment value="aaa">AAA</fluid-segment>
        </fluid-segmented-control>
        <p class="lede" style="margin-top:0.9rem;">
          ${this.level === "aaa"
            ? "AAA: targets ≥ 44px, focus rings 3px. The preview's buttons and fields just grew."
            : "AA (default): targets ≥ 24px, focus rings 2px. Every component ships AA out of the box."}
        </p>
      </div>

      <div class="section">
        <h3>Motion</h3>
        <label for="motion" class="lede" style="display:block;margin:0 0 0.4rem;">
          Motion — ${this.motionLabel}
        </label>
        <fluid-slider
          id="motion"
          min="0"
          max="1.5"
          step="0.25"
          value=${this.motion}
          @fluid-change=${this.onMotion}
        ></fluid-slider>
        <fluid-callout variant="info" style="margin-top:0.75rem;">
          Multiplies how long every transition runs (dialogs, drawers, menus, toggles, the segmented
          slide), so higher is slower and more deliberate, lower is snappier. 0 turns animation off
          everywhere, on top of each visitor's prefers-reduced-motion. Watch the looping sample in
          the preview as you drag.
        </fluid-callout>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-conformance": WizardStepConformance;
  }
}
