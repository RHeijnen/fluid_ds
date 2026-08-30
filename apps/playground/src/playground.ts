import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { themeStore } from "./store.js";
import { componentOverridesStore } from "./component-overrides-store.js";
import { selectionStore, type Mode } from "./selection-store.js";
import { syncUrlState } from "./url-state.js";
import "./token-form.js";
import "./preview.js";
import "./builder-demo.js";
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

    /*
     * The walkthrough sits over the preview, the way the scheduler's demo sits
     * over its canvas: the thing being explained stays visible behind it, and
     * the first click anywhere goes to dismissing it rather than to a control
     * the reader has not been told about yet.
     */
    section {
      position: relative;
    }
    .demo-veil {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: grid;
      /* Start, not centre: the preview is many viewports tall, so centring in
         the veil would park the panel somewhere far below the fold. */
      justify-items: center;
      align-items: start;
      padding: var(--fluid-space-4);
      background: color-mix(in srgb, var(--fluid-surface-base) 82%, transparent);
      backdrop-filter: blur(2px);
      cursor: pointer;
    }
    .demo-panel {
      /* Sticky so it stays in view while the veil spans the whole preview. */
      position: sticky;
      inset-block-start: 12vh;
      width: min(30rem, 100%);
      padding: var(--fluid-space-4);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      background: var(--fluid-surface-base);
      box-shadow: var(--fluid-shadow-lg);
      cursor: auto;
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
    .base-select {
      inline-size: 8.5rem;
    }
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
  /**
   * Brand-wide overrides plus per-element ones. Both are user changes, and a
   * Reset that only knew about the theme store sat disabled while an isolated
   * element was visibly overridden, with no way to undo it.
   */
  @state() private themeChangeCount = 0;
  @state() private elementChangeCount = 0;

  private get changeCount(): number {
    return this.themeChangeCount + this.elementChangeCount;
  }
  @state() private baseTheme = "default";
  @state() private mode: Mode = "interaction";
  @state() private demoDismissed = false;
  @state() private demoRequested = false;

  private unsubscribeTheme?: () => void;
  private unsubscribeElements?: () => void;
  private unsubscribeSelection?: () => void;
  /**
   * Demo fluid-theme-toggle components inside the preview flip the document's
   * data-fluid-theme out-of-band; this observer keeps the shell's scheme
   * control and the preview's semantic re-declarations honest.
   */
  private schemeObserver?: MutationObserver;

  override connectedCallback(): void {
    super.connectedCallback();
    syncUrlState();
    this.unsubscribeTheme = themeStore.subscribe((overrides) => {
      this.themeChangeCount = Object.keys(overrides).length;
    });
    this.unsubscribeElements = componentOverridesStore.subscribe(() => {
      this.elementChangeCount = componentOverridesStore.valueCount();
    });
    this.unsubscribeSelection = selectionStore.subscribe((s) => {
      this.mode = s.mode;
      this.applyDesignMode();
    });
    this.applyColorScheme();
    this.applyDesignMode();
    this.schemeObserver = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute("data-fluid-theme");
      if ((attr === "light" || attr === "dark") && attr !== this.colorScheme) {
        this.colorScheme = attr;
        themeStore.setScheme(attr);
      }
    });
    this.schemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-fluid-theme"]
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeTheme?.();
    this.unsubscribeElements?.();
    this.unsubscribeSelection?.();
    this.schemeObserver?.disconnect();
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
    themeStore.setScheme(this.colorScheme);
  }

  private handleSchemeChange = (e: CustomEvent) => {
    this.colorScheme = e.detail.value as ColorScheme;
    this.applyColorScheme();
  };

  /** The brand presets offered as a starting point, in the same order as the demos. */
  private static readonly BASE_THEMES = ["default", "glass", "titanium", "midnight", "corporate"];

  private handleBaseChange = (e: CustomEvent) => {
    this.loadBaseTheme(String(e.detail.value));
  };

  /**
   * Load a brand preset as an editable starting point.
   *
   * The preset is a shipped @fluid-ds/themes brand, i.e. a set of token
   * overrides. Rather than duplicate its values here, they are read back from a
   * hidden probe carrying the brand attribute, then written into the theme
   * store as the current overrides. From there every token is editable and the
   * export is the user's own theme built on that base. `themeStore.replace`
   * drops anything equal to the default, so only the preset's real differences
   * land. "default" clears back to the base tokens.
   *
   * Glass loads its palette this way like any other; its frosted surface
   * treatment is structural CSS, not tokens, so it is best seen in the portal
   * or hero demos rather than here.
   */
  private loadBaseTheme(brand: string): void {
    this.baseTheme = brand;
    if (brand === "default") {
      themeStore.reset();
      return;
    }
    const probe = document.createElement("div");
    probe.setAttribute("data-fluid-brand", brand);
    probe.style.display = "none";
    document.body.appendChild(probe);
    const styles = getComputedStyle(probe);
    const keys = [
      ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => `--fluid-color-brand-${n}`),
      "--fluid-radius-sm",
      "--fluid-radius-md",
      "--fluid-radius-lg",
      "--fluid-radius-xl"
    ];
    const overrides: Record<string, string> = {};
    for (const key of keys) {
      const value = styles.getPropertyValue(key).trim();
      if (value) overrides[key] = value;
    }
    /*
     * The accent semantics are var() references, which getPropertyValue returns
     * unresolved, so they would not land as usable overrides. Resolve each to a
     * concrete colour by borrowing the probe's `color` property, which forces
     * the engine to substitute the reference against the brand ramp. Captured
     * as a snapshot: the accent will not re-derive if the user later edits the
     * ramp, which is the expected behaviour for a starting point.
     */
    const resolveColor = (token: string): string => {
      probe.style.setProperty("color", `var(${token})`);
      const resolved = getComputedStyle(probe).color;
      probe.style.removeProperty("color");
      return resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : "";
    };
    for (const token of [
      "--fluid-accent-base",
      "--fluid-accent-hover",
      "--fluid-accent-active",
      "--fluid-focus-ring-color"
    ]) {
      const value = resolveColor(token);
      if (value) overrides[token] = value;
    }
    document.body.removeChild(probe);
    themeStore.replace(overrides);
  }

  /**
   * Whether the walkthrough is on the preview right now.
   *
   * Unasked while the page is still untouched, and on request after that.
   * Dismissing it is remembered for the session so it does not reappear every
   * time the preview re-renders while someone is reading it.
   */
  private showDemo(): boolean {
    if (this.demoRequested) return true;
    if (this.demoDismissed) return false;
    return this.mode !== "design" && this.changeCount === 0;
  }

  /** Any click on the preview puts the walkthrough away and gets out of the way. */
  private dismissDemo = (): void => {
    this.demoRequested = false;
    this.demoDismissed = true;
  };

  private handleReset = () => {
    themeStore.reset();
    this.baseTheme = "default";
    // The preview renders these as a stylesheet it rebuilds from the store,
    // so clearing the store is enough to un-paint them.
    componentOverridesStore.reset();
    /*
     * Leave isolate mode too. The component-scoped overrides were just
     * cleared, so a panel still claiming to be scoped to that component
     * would misrepresent what the next edit does.
     */
    selectionStore.setIsolate(false);
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
          <fluid-select
            class="base-select"
            .value=${this.baseTheme}
            aria-label="Base theme"
            @fluid-change=${this.handleBaseChange}
          >
            ${FluidPlayground.BASE_THEMES.map(
              (name) =>
                html`<fluid-option value=${name}
                  >${name[0]!.toUpperCase() + name.slice(1)}</fluid-option
                >`
            )}
          </fluid-select>
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
          ${this.showDemo()
            ? html`<div class="demo-veil" @click=${this.dismissDemo}>
                <div class="demo-panel">
                  <builder-demo></builder-demo>
                </div>
              </div>`
            : ""}
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
