import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { themeStore } from "../theme-store.js";
import { scaleRemTokens, currentScale } from "../scale-tokens.js";
import { wizardStore } from "../wizard-store.js";
import {
  allFontNames,
  resolveFont,
  stackToName,
  loadGoogleFont,
  DEFAULT_FONT_NAME,
  SYSTEM_FONT_NAME
} from "../fonts.js";

/**
 * Step 5, Font. Pick the UI font, the DS default, the OS system stack, or
 * *any* family from the Google Fonts library (typeahead). Google families load
 * live into the preview via a document `<link>`, and the export emits that link.
 * A scale slider derives the whole --fluid-font-size-* ramp. Both controls
 * restore from persisted state.
 */
@customElement("wizard-step-type")
export class WizardStepType extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .picker {
        max-width: 24rem;
      }
    `
  ];

  protected stepTitle = "Choose your font";
  protected stepLede =
    "Start with our default (Inter), keep the OS system font, or search the entire Google Fonts library, it loads right here in the preview. One slider rescales the whole type ramp.";

  @state() private familyName = stackToName(themeStore.get("--fluid-font-family-sans"));
  @state() private scale = currentScale("--fluid-font-size-md");

  private readonly fontNames = allFontNames();

  override connectedCallback(): void {
    super.connectedCallback();
    // Re-load a previously-chosen Google font so the restored preview matches.
    const { google } = resolveFont(this.familyName);
    if (google) loadGoogleFont(google);
  }

  private get isGoogle(): boolean {
    return this.familyName !== DEFAULT_FONT_NAME && this.familyName !== SYSTEM_FONT_NAME;
  }

  private onFamily(e: Event): void {
    const name = (e as CustomEvent<{ value: string }>).detail?.value;
    if (!name) return;
    // Typeahead is free-text; only accept a real family from our list.
    if (!this.fontNames.includes(name)) return;
    this.familyName = name;
    const { token, google } = resolveFont(name);
    themeStore.set("--fluid-font-family-sans", token);
    loadGoogleFont(google);
    wizardStore.setConfig({ fontGoogle: google ?? undefined });
  }

  private onScale(e: Event): void {
    const value = Number((e as CustomEvent<{ value: number }>).detail?.value);
    if (!Number.isFinite(value)) return;
    this.scale = value;
    scaleRemTokens("--fluid-font-size-", value);
  }

  override render(): TemplateResult {
    return html`
      ${this.header()}
      <div class="field">
        <label for="font">Font family</label>
        <fluid-typeahead
          id="font"
          class="picker"
          strict
          placeholder="Search Google Fonts…"
          aria-label="Font family"
          .value=${this.familyName}
          .options=${this.fontNames}
          max-options="12"
          @fluid-change=${this.onFamily}
        ></fluid-typeahead>
        ${this.isGoogle
          ? html`<fluid-callout variant="info">
              <strong>${this.familyName}</strong> is loaded live from Google Fonts. The export
              includes the <code>&lt;link&gt;</code> so your app loads it too.
            </fluid-callout>`
          : this.familyName === SYSTEM_FONT_NAME
            ? html`<fluid-callout variant="info">
                Uses each device's native UI font, zero webfont download, fastest paint.
              </fluid-callout>`
            : null}
      </div>

      <div class="field">
        <label for="scale">Text scale, ${this.scale.toFixed(2)}×</label>
        <fluid-slider
          id="scale"
          min="0.85"
          max="1.2"
          step="0.05"
          value=${this.scale}
          @fluid-change=${this.onScale}
        ></fluid-slider>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-type": WizardStepType;
  }
}
