import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { themeStore } from "./store.js";
import { elementOverridesStore } from "./element-overrides-store.js";

/** Packages a consumer needs to use a Fluid theme. */
const PACKAGES = ["@fluid-ds/components", "@fluid-ds/tokens", "@fluid-ds/icons"];

/** Filename the generated override CSS is saved + imported as. */
const BRAND_FILE = "fluid-custom-brand.css";

/** Attribute/selector the overrides are scoped under (kept in sync with toCSS). */
const BRAND_ATTR = `data-fluid-brand="custom"`;
const BRAND_SELECTOR = `[${BRAND_ATTR}]`;

/**
 * Assemble the export CSS: brand-wide block on top, per-element blocks
 * below. Per-element blocks select on `data-fluid-id`, which the playground
 * stamps on the isolated element and the consumer drops onto whichever real
 * element in their app should receive that look.
 */
function buildCss(): string {
  const brand = themeStore.toCSS(BRAND_SELECTOR);
  const elements = elementOverridesStore.toCSS();
  if (!elements) return brand;
  const note = `/* Per-instance overrides, tag the matching element with the same\n   data-fluid-id and these vars will apply. The attribute name is\n   part of the Fluid namespace so it stays distinct from your own\n   class/id system. */`;
  return `${brand}\n\n${note}\n${elements}\n`;
}

/**
 * "Use your theme" panel, a copy-pasteable setup guide that updates live as
 * the user edits.
 *
 * UX: a fixed floating "Export theme" pill in the bottom-right of the
 * viewport is always reachable, with the override count as a chip so users
 * can see at a glance whether they have anything to export. Clicking the
 * pill opens a `<fluid-dialog>` with the 3-step setup (install / wire up /
 * brand CSS) and a download button. The pill stays visible everywhere
 * inside the playground regardless of scroll position.
 */
@customElement("export-panel")
export class ExportPanel extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    /*
     * The floating launcher pill, fixed to the viewport so it's always one
     * click away. We use position: fixed on the host of an absolutely
     * positioned div so the pill survives outside any clipping ancestor.
     */
    .fab {
      all: unset;
      position: fixed;
      bottom: var(--fluid-space-5);
      right: var(--fluid-space-5);
      z-index: 50;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
      padding: 0.75rem 1.25rem;
      border-radius: 999px;
      background: var(--fluid-accent-base);
      background-image: var(--fluid-gradient-glossy);
      color: var(--fluid-accent-text);
      font-family: var(--fluid-font-family-sans);
      font-weight: var(--fluid-font-weight-semibold);
      font-size: var(--fluid-font-size-sm);
      box-shadow:
        0 8px 24px -8px color-mix(in srgb, var(--fluid-accent-base) 60%, transparent),
        0 2px 4px rgb(0 0 0 / 0.08);
      transition:
        transform 120ms ease,
        box-shadow 120ms ease,
        background-color 120ms ease;
    }
    .fab:hover {
      transform: translateY(-1px);
      box-shadow:
        0 12px 32px -8px color-mix(in srgb, var(--fluid-accent-base) 70%, transparent),
        0 4px 8px rgb(0 0 0 / 0.1);
    }
    .fab:focus-visible {
      outline: 2px solid var(--fluid-focus-ring-color);
      outline-offset: 3px;
    }
    .fab:active {
      transform: translateY(0);
    }
    .fab .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.4rem;
      border-radius: 999px;
      background: rgb(255 255 255 / 0.25);
      color: currentColor;
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 880px) {
      .fab {
        bottom: var(--fluid-space-4);
        right: var(--fluid-space-4);
      }
    }

    /*
     * Dialog content layout. The dialog itself is themed by fluid-dialog:
     * here we only style what we put inside it.
     */
    .dialog-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--fluid-space-3);
      margin-bottom: var(--fluid-space-3);
    }
    .meta {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
    ol.steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-4);
    }
    .step-label {
      display: flex;
      align-items: baseline;
      gap: var(--fluid-space-2);
      margin-bottom: var(--fluid-space-2);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-primary);
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.4rem;
      height: 1.4rem;
      flex-shrink: 0;
      border-radius: 999px;
      background: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
    }
    .hint {
      margin: var(--fluid-space-2) 0 0;
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      line-height: 1.5;
    }
    code {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-primary);
      background: var(--fluid-surface-muted);
      padding: 1px var(--fluid-space-1);
      border-radius: var(--fluid-radius-sm);
    }
  `;

  @state() private css = buildCss();
  @state() private changeCount = 0;
  @state() private elementCount = 0;
  @state() private open = false;

  @query("fluid-dialog") private dialogEl!: HTMLElement & {
    show: () => void;
    hide: () => void;
  };

  private unsubscribeTheme?: () => void;
  private unsubscribeElements?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    const refresh = () => {
      this.css = buildCss();
      this.changeCount = Object.keys(themeStore.diff()).length;
      this.elementCount = elementOverridesStore.size();
    };
    this.unsubscribeTheme = themeStore.subscribe(refresh);
    this.unsubscribeElements = elementOverridesStore.subscribe(refresh);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeTheme?.();
    this.unsubscribeElements?.();
  }

  private get installSnippet(): string {
    return `npm install ${PACKAGES.join(" ")}`;
  }

  private get setupSnippet(): string {
    return [
      `// 1 · Design tokens (CSS custom properties)`,
      `import "@fluid-ds/tokens/base.css";`,
      `import "@fluid-ds/tokens/light.css";`,
      `import "@fluid-ds/tokens/dark.css";`,
      ``,
      `// 2 · Your brand overrides (saved as ${BRAND_FILE}, see step 3)`,
      `import "./${BRAND_FILE}";`,
      ``,
      `// 3 · Register the default icons + one import per component you use`,
      `import "@fluid-ds/icons/register-defaults";`,
      `import "@fluid-ds/components/define/button";`,
      `// …e.g. define/input, define/card, define/dialog`
    ].join("\n");
  }

  private handleDownload(): void {
    const blob = new Blob([this.css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = BRAND_FILE;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private handleToggle = () => {
    this.open = !this.open;
    if (this.open) this.dialogEl?.show();
    else this.dialogEl?.hide();
  };

  private handleDialogHide = () => {
    this.open = false;
  };

  override render(): TemplateResult {
    const totalChanges = this.changeCount + this.elementCount;
    const hasChanges = totalChanges > 0;
    const meta = (() => {
      if (this.changeCount === 0 && this.elementCount === 0) {
        return "Drop Fluid into your app, tweak tokens to fill in your brand CSS.";
      }
      const parts: string[] = [];
      if (this.changeCount > 0)
        parts.push(
          `${this.changeCount} brand override${this.changeCount === 1 ? "" : "s"}`
        );
      if (this.elementCount > 0)
        parts.push(
          `${this.elementCount} isolated element${this.elementCount === 1 ? "" : "s"}`
        );
      return parts.join(" · ");
    })();
    return html`
      <button
        class="fab"
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${this.open ? "true" : "false"}
        aria-label="Open theme export"
        @click=${this.handleToggle}
      >
        <fluid-icon name="download"></fluid-icon>
        <span>Export theme</span>
        ${hasChanges ? html`<span class="count">${totalChanges}</span>` : ""}
      </button>

      <fluid-dialog
        size="lg"
        aria-label="Use your theme"
        @fluid-hide=${this.handleDialogHide}
      >
        <span slot="label">Use your theme</span>

        <div class="dialog-header">
          <div class="meta">${meta}</div>
        </div>

        <ol class="steps">
          <li>
            <div class="step-label">
              <span class="step-num">1</span> Install the packages
            </div>
            <fluid-code-block .code=${this.installSnippet} language="bash"></fluid-code-block>
          </li>

          <li>
            <div class="step-label">
              <span class="step-num">2</span> Load it in your app entry
            </div>
            <fluid-code-block .code=${this.setupSnippet} language="ts"></fluid-code-block>
          </li>

          <li>
            <div class="step-label">
              <span class="step-num">3</span> Your brand overrides
              <code>${BRAND_FILE}</code>
            </div>
            <fluid-code-block .code=${this.css} language="css"></fluid-code-block>
            <p class="hint">
              ${hasChanges
                ? html`Brand overrides activate when you add <code>${BRAND_ATTR}</code>
                    to a wrapping element (e.g. <code>&lt;body&gt;</code>). Each
                    isolated element rule targets a specific
                    <code>data-fluid-id</code>, drop the same attribute on the
                    matching element in your app to apply it.`
                : html`No customizations yet, tweak some tokens in the sidebar and
                    they'll appear here, scoped under <code>${BRAND_SELECTOR}</code>.
                    Isolate any specific instance in Design mode to add per-element
                    rules.`}
            </p>
          </li>
        </ol>

        <fluid-button
          slot="footer"
          variant="ghost"
          @click=${() => this.dialogEl?.hide()}
        >
          Close
        </fluid-button>
        <fluid-button
          slot="footer"
          variant="primary"
          ?disabled=${!hasChanges}
          @click=${this.handleDownload}
        >
          <fluid-icon slot="prefix" name="download"></fluid-icon>
          Download ${BRAND_FILE}
        </fluid-button>
      </fluid-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "export-panel": ExportPanel;
  }
}
