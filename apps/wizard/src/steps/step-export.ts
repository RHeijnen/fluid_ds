import { html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";
import { wizardStore, type WizardState } from "../wizard-store.js";
import { themeStore } from "../theme-store.js";
import { googleFontLink } from "../fonts.js";

/**
 * Step 9, Export. The override-first payoff: the smallest CSS delta block
 * (layered after the base tokens, never "replace everything"), the install
 * snippet with the wrapper attributes the config needs, a download, and a
 * resume link.
 */
@customElement("wizard-step-export")
export class WizardStepExport extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .block {
        margin-bottom: 1.5rem;
      }
      .block h3 {
        font-size: 1rem;
        margin: 0 0 0.5rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
      }
      fluid-code-block {
        display: block;
        width: 100%;
      }
    `
  ];

  protected stepTitle = "Your setup is ready";
  protected stepLede =
    "Drop this override block in after the base tokens, it only contains what you changed. Then load the components and add the wrapper attributes.";

  @state() private config: WizardState["config"] = wizardStore.get().config;
  private unsubscribeWizard?: () => void;
  private unsubscribeTheme?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeWizard = wizardStore.subscribe((s) => (this.config = s.config));
    this.unsubscribeTheme = themeStore.subscribe(() => this.requestUpdate());
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeWizard?.();
    this.unsubscribeTheme?.();
  }

  private brandCss(): string {
    return themeStore.toCSS('[data-fluid-brand="custom"]');
  }

  private wrapperAttrs(): string {
    const attrs = ['data-fluid-brand="custom"'];
    if (this.config.scheme !== "auto") attrs.push(`data-fluid-theme="${this.config.scheme}"`);
    if (this.config.conformance === "aaa") attrs.push('data-fluid-conformance="aaa"');
    return attrs.join(" ");
  }

  private setupSnippet(): string {
    const autoNote =
      this.config.scheme === "auto"
        ? `\n<!-- Auto scheme: set data-fluid-theme from prefers-color-scheme -->\n` +
          `<script>\n` +
          `  const dark = matchMedia("(prefers-color-scheme: dark)").matches;\n` +
          `  document.documentElement.dataset.fluidTheme = dark ? "dark" : "light";\n` +
          `</script>`
        : "";
    const fontLink = googleFontLink(this.config.fontGoogle ?? null);
    const fontNote = fontLink ? `<!-- Webfont you chose -->\n${fontLink}\n\n` : "";
    return (
      fontNote +
      `<!-- 1. Base tokens, then YOUR overrides (order matters) -->\n` +
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css" />\n` +
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css" />\n` +
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/dark.css" />\n` +
      `<link rel="stylesheet" href="./fluid-custom-brand.css" />\n\n` +
      `<!-- 2. The components you use -->\n` +
      `<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/button/define.js"></script>\n\n` +
      `<!-- 3. Wrap your app with the chosen attributes -->\n` +
      `<html ${this.wrapperAttrs()}>${autoNote}`
    );
  }

  private download(): void {
    const blob = new Blob([this.brandCss()], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fluid-custom-brand.css";
    a.click();
    URL.revokeObjectURL(url);
  }

  override render(): TemplateResult {
    const resumeLink = typeof location !== "undefined" ? location.href : "";
    return html`
      ${this.header()}

      <div class="block">
        <h3>fluid-custom-brand.css</h3>
        <fluid-code-block filename="fluid-custom-brand.css" code=${this.brandCss()}></fluid-code-block>
        <div class="actions" style="margin-top:0.75rem;">
          <fluid-button @click=${this.download}>
            <fluid-icon slot="prefix" name="download"></fluid-icon>
            Download CSS
          </fluid-button>
          <fluid-copy-button value=${this.brandCss()} aria-label="Copy CSS">Copy</fluid-copy-button>
        </div>
      </div>

      <div class="block">
        <h3>Add it to your page</h3>
        <fluid-code-block language="html" code=${this.setupSnippet()}></fluid-code-block>
      </div>

      <div class="block">
        <h3>Come back later</h3>
        <p class="lede">Bookmark this link to reopen the wizard with these choices.</p>
        <fluid-code-block code=${resumeLink}></fluid-code-block>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-export": WizardStepExport;
  }
}
