import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { themeStore } from "./store.js";
import { selectionStore, type Mode } from "./selection-store.js";
import { syncUrlState } from "./url-state.js";
import "./token-form.js";
import "./preview.js";
import "./export-panel.js";
import "./inspector.js";

type ColorScheme = "light" | "dark";

/**
 * Root element of the theme builder.
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │ Header: title, reset, color-scheme toggle                  │
 *  ├──────────────────────┬─────────────────────────────────────┤
 *  │ Sidebar              │ Main                                │
 *  │  - token-form        │  - component-preview                │
 *  │                      │  - export-panel                     │
 *  └──────────────────────┴─────────────────────────────────────┘
 */
@customElement("fluid-playground")
export class FluidPlayground extends LitElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: minmax(340px, 400px) 1fr;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    @media (max-width: 880px) {
      :host {
        grid-template-columns: 1fr;
      }
      aside {
        max-height: 50vh !important;
        position: static !important;
        border-right: 0;
        border-bottom: 1px solid var(--fluid-border-default);
      }
    }

    header {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--fluid-space-4);
      padding: var(--fluid-space-3) var(--fluid-space-5);
      border-bottom: 1px solid var(--fluid-border-default);
      background: var(--fluid-surface-base);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .titlebar {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-3);
    }
    .titlebar .brand-mark {
      width: 2.1rem;
      height: 2.1rem;
      flex: none;
      display: block;
    }

    h1 {
      margin: 0;
      font-size: var(--fluid-font-size-lg);
      font-weight: var(--fluid-font-weight-semibold);
    }

    .subtitle {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-3);
    }

    aside {
      border-right: 1px solid var(--fluid-border-default);
      background: var(--fluid-surface-subtle);
      overflow-y: auto;
      max-height: calc(100vh - 65px);
      position: sticky;
      top: 65px;
    }

    main {
      padding: var(--fluid-space-5);
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-6);
      min-width: 0;
    }

    .section-label {
      margin: 0 0 var(--fluid-space-3) 0;
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .design-hint {
      font-weight: var(--fluid-font-weight-regular);
      text-transform: none;
      letter-spacing: 0;
      color: var(--fluid-accent-base);
    }

    /*
     * Design Mode toggle, a dedicated, high-impact pill with a clear
     * "armed" state. Big and obvious so designers see it immediately
     * and know what's about to change when they click.
     */
    .design-toggle {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-weight: var(--fluid-font-weight-semibold);
      font-size: var(--fluid-font-size-sm);
      background: var(--fluid-surface-base);
      color: var(--fluid-text-secondary);
      border: 2px solid var(--fluid-border-default);
      transition:
        background 120ms ease,
        color 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease;
    }
    .design-toggle:hover {
      border-color: var(--fluid-accent-base);
      color: var(--fluid-text-primary);
    }
    .design-toggle:focus-visible {
      outline: 2px solid var(--fluid-focus-ring-color);
      outline-offset: 2px;
    }
    .design-toggle[aria-pressed="true"] {
      background: var(--fluid-accent-base);
      background-image: var(--fluid-gradient-glossy);
      color: var(--fluid-accent-text);
      border-color: transparent;
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--fluid-accent-base) 25%, transparent),
        0 6px 16px -4px color-mix(in srgb, var(--fluid-accent-base) 40%, transparent);
    }
    .design-toggle .pulse {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
    }
    .design-toggle[aria-pressed="true"] .pulse {
      animation: design-pulse 1.6s ease-out infinite;
    }
    @keyframes design-pulse {
      0% {
        box-shadow: 0 0 0 0 rgb(255 255 255 / 0.7);
      }
      80%,
      100% {
        box-shadow: 0 0 0 8px rgb(255 255 255 / 0);
      }
    }
  `;

  @state() private colorScheme: ColorScheme = "light";
  @state() private changeCount = 0;
  @state() private mode: Mode = "interaction";

  private unsubscribeTheme?: () => void;
  private unsubscribeSelection?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    syncUrlState();
    this.unsubscribeTheme = themeStore.subscribe((overrides) => {
      this.changeCount = Object.keys(overrides).length;
    });
    this.unsubscribeSelection = selectionStore.subscribe((s) => {
      this.mode = s.mode;
      this.applyDesignMode();
    });
    this.applyColorScheme();
    this.applyDesignMode();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeTheme?.();
    this.unsubscribeSelection?.();
  }

  private toggleDesignMode = () => {
    selectionStore.setMode(this.mode === "design" ? "interaction" : "design");
  };

  /**
   * Mirror Design Mode on the documentElement so the inspector overlay
   * and any other ancestor styling can react to it. Keeping it on
   * `<html>` (not just this component) lets us cascade outline styles
   * down to anything inside the preview, including shadow roots that
   * forward CSS variables.
   */
  private applyDesignMode(): void {
    document.documentElement.toggleAttribute("data-fluid-design-mode", this.mode === "design");
  }

  private applyColorScheme(): void {
    document.documentElement.setAttribute("data-fluid-theme", this.colorScheme);
  }

  private handleSchemeChange = (e: CustomEvent) => {
    this.colorScheme = e.detail.value as ColorScheme;
    this.applyColorScheme();
  };

  private handleReset = () => {
    themeStore.reset();
  };

  override render(): TemplateResult {
    return html`
      <header>
        <div class="titlebar">
          <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
            <defs>
              <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#3b82f6"></stop>
                <stop offset="1" stop-color="#22d3ee"></stop>
              </linearGradient>
              <clipPath id="fluidLogoClip"><rect width="96" height="96" rx="22"></rect></clipPath>
            </defs>
            <g clip-path="url(#fluidLogoClip)">
              <rect width="96" height="96" fill="url(#fluidLogoGrad)"></rect>
              <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
                <path d="M-6,40 C12,30 26,50 44,40 S72,30 102,40" opacity="0.95"></path>
                <path d="M-6,58 C12,48 26,68 44,58 S72,48 102,58" opacity="0.65"></path>
                <path d="M-6,76 C12,66 26,86 44,76 S72,66 102,76" opacity="0.35"></path>
              </g>
            </g>
          </svg>
          <div>
            <h1>Fluid Theme Builder</h1>
            <div class="subtitle">
              Tweak tokens on the left. The right pane shows live components and the diff you'll
              export.
            </div>
          </div>
        </div>
        <div class="actions">
          <button
            class="design-toggle"
            type="button"
            aria-pressed=${this.mode === "design" ? "true" : "false"}
            aria-label=${this.mode === "design" ? "Exit design mode" : "Enter design mode"}
            @click=${this.toggleDesignMode}
          >
            <span class="pulse"></span>
            <span>${this.mode === "design" ? "Design Mode · ON" : "Design Mode"}</span>
          </button>
          <fluid-segmented-control
            .value=${this.colorScheme}
            aria-label="Color scheme"
            @fluid-change=${this.handleSchemeChange}
          >
            <fluid-segment value="light">Light</fluid-segment>
            <fluid-segment value="dark">Dark</fluid-segment>
          </fluid-segmented-control>
          <fluid-button
            variant="ghost"
            ?disabled=${this.changeCount === 0}
            @click=${this.handleReset}
          >
            Reset ${this.changeCount > 0 ? html`(${this.changeCount})` : ""}
          </fluid-button>
        </div>
      </header>
      <aside>
        <token-form></token-form>
      </aside>
      <main>
        <section>
          <h2 class="section-label">
            Live preview
            ${this.mode === "design"
              ? html`<span class="design-hint">click a component to inspect</span>`
              : ""}
          </h2>
          <design-inspector>
            <component-preview></component-preview>
          </design-inspector>
        </section>
      </main>
      <!--
        Export panel is no longer a bottom section, it renders as a fixed
        floating "Export theme" pill anchored to the viewport, and opens a
        modal on click. Placing it here keeps it inside the playground's
        component tree (so theme overrides cascade in) but the FAB itself
        lives at position:fixed so scroll doesn't hide it.
      -->
      <export-panel></export-panel>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "fluid-playground": FluidPlayground;
  }
}
