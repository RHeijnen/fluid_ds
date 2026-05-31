import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { wizardStore, type Preset, type Scheme } from "../wizard-store.js";
import { themeStore } from "../theme-store.js";
import { defaultBrandStop } from "../derive-ramp.js";

const PRESETS: { id: Preset; title: string; desc: string }[] = [
  { id: "default", title: "Default", desc: "Fluid blue, the out-of-the-box brand." },
  { id: "midnight", title: "Midnight", desc: "Violet, deep and modern." },
  { id: "corporate", title: "Corporate", desc: "Restrained slate for enterprise UIs." },
  { id: "custom", title: "From scratch", desc: "Start blank and build your own." }
];

/**
 * Step 2, Theme. The starting brand preset PLUS light/dark/auto. Internal step
 * id stays "scheme" to keep persisted-state/URL format stable.
 */
@customElement("wizard-step-scheme")
export class WizardStepScheme extends WizardStep {
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

  protected stepTitle = "Pick your theme";
  protected stepLede =
    "Start from a ready-made brand (tweak it later) or from scratch, and choose how it defaults light or dark.";

  @state() private preset: Preset = wizardStore.get().config.preset;
  @state() private scheme: Scheme = wizardStore.get().config.scheme;
  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = wizardStore.subscribe((s) => {
      this.preset = s.config.preset;
      this.scheme = s.config.scheme;
    });
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private choosePreset(id: Preset): void {
    wizardStore.setConfig({ preset: id });
    if (!wizardStore.get().config.seed) {
      const seed = defaultBrandStop(600);
      if (seed) wizardStore.setConfig({ seed });
    }
    // Named presets re-skin via their own attribute CSS; clear token overrides.
    if (id !== "custom") themeStore.reset();
  }

  private onScheme(e: Event): void {
    const value = (e as CustomEvent<{ value: string }>).detail?.value as Scheme;
    if (value) wizardStore.setConfig({ scheme: value });
  }

  override render(): TemplateResult {
    return html`
      ${this.header()}

      <div class="section">
        <h3>Starting brand</h3>
        <div class="cards" role="group" aria-label="Starting brand">
          ${PRESETS.map(
            (p) => html`
              <button
                class="choice"
                aria-pressed=${this.preset === p.id ? "true" : "false"}
                @click=${() => this.choosePreset(p.id)}
              >
                <span class="title">${p.title}</span>
                <span class="desc">${p.desc}</span>
              </button>
            `
          )}
        </div>
      </div>

      <div class="section">
        <h3>Color scheme</h3>
        <fluid-segmented-control
          value=${this.scheme}
          aria-label="Color scheme"
          @fluid-change=${this.onScheme}
        >
          <fluid-segment value="auto">Auto (both)</fluid-segment>
          <fluid-segment value="light">Light</fluid-segment>
          <fluid-segment value="dark">Dark</fluid-segment>
        </fluid-segmented-control>
        <p class="lede" style="margin: 0.9rem 0 0;">
          ${this.scheme === "auto"
            ? "Auto follows each visitor's OS setting (prefers-color-scheme). Ships both, the export includes the snippet."
            : `Your app defaults to ${this.scheme} mode. Users can still switch if you wire a toggle.`}
        </p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-scheme": WizardStepScheme;
  }
}
