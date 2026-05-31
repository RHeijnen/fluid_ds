import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { themeStore } from "./theme-store.js";
import { wizardStore, type Step, type WizardState } from "./wizard-store.js";

/**
 * Persistent live preview. Subscribes to BOTH stores: the theme diff
 * (themeStore, written by the accent/tones/type/shape steps) and the wizard
 * config attributes (data-fluid-theme / -brand / -conformance). It applies the
 * theme overrides to its own preview container so the sample components recolor
 * instantly, exactly as the consumer's app will once they paste the export.
 */
@customElement("wizard-preview")
export class WizardPreview extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: sticky;
      top: 5rem;
    }
    .frame {
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-lg);
      overflow: hidden;
      background: var(--fluid-surface-base);
    }
    .frame-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--fluid-border-default);
      background: var(--fluid-surface-subtle);
      font-size: 0.75rem;
      color: var(--fluid-text-secondary);
    }
    .dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: var(--fluid-border-strong, var(--fluid-border-default));
    }
    .frame-title {
      margin-left: auto;
      font-weight: 600;
    }
    .surface {
      padding: var(--fluid-space-5, 1.25rem);
      background: var(--fluid-surface-base);
      color: var(--fluid-text-primary);
      /* Drive sample text off the type-scale tokens so the Type step's scale
         slider visibly affects the preview (incl. the card content). */
      font-size: var(--fluid-font-size-md);
      display: grid;
      gap: var(--fluid-space-4, 1rem);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--fluid-space-2, 0.5rem);
      align-items: center;
    }
    a.link {
      color: var(--fluid-accent-base);
      font-weight: 600;
    }
    .muted {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-md);
      margin: 0;
    }

    /* Motion demo (shown on the Accessibility step): a self-running visual whose
       loop duration reads --fluid-motion live. Drag the slider and the pill
       speeds up / slows down; at 0 the duration is 0s, so it freezes (no motion).
       No JS replay needed, the animation re-reads the scalar on its own. */
    .motion-demo {
      display: grid;
      gap: var(--fluid-space-2, 0.5rem);
    }
    .motion-track {
      position: relative;
      height: 2.5rem;
      padding: 0.5rem;
      border-radius: var(--fluid-radius-full);
      background: var(--fluid-surface-subtle);
      border: 1px solid var(--fluid-border-default);
      overflow: hidden;
    }
    .motion-pill {
      position: absolute;
      top: 50%;
      left: 0.5rem;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--fluid-radius-full);
      background: var(--fluid-accent-base);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--fluid-accent-base) 50%, transparent);
      animation: motion-sweep calc(1s * var(--fluid-motion, 1)) var(--fluid-easing-emphasized, ease-in-out)
        infinite alternate;
    }
    /* Sweep left↔right across the track with a gentle squash + glow pulse. */
    @keyframes motion-sweep {
      from {
        left: 0.5rem;
        transform: translateY(-50%) scale(0.85);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--fluid-accent-base) 45%, transparent);
      }
      to {
        left: calc(100% - 2rem);
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--fluid-accent-base) 0%, transparent);
      }
    }
    /* Respect the visitor's own reduced-motion preference, never loop for them. */
    @media (prefers-reduced-motion: reduce) {
      .motion-pill {
        animation: none;
        left: calc(50% - 0.75rem);
      }
    }
    .motion-hint {
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
    }
  `;

  private unsubscribeTheme?: () => void;
  private unsubscribeWizard?: () => void;

  @state() private step: Step = wizardStore.get().step;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeTheme = themeStore.subscribe(() => this.applyTheme());
    this.unsubscribeWizard = wizardStore.subscribe((s) => {
      this.step = s.step;
      this.applyConfig(s);
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeTheme?.();
    this.unsubscribeWizard?.();
  }

  override firstUpdated(): void {
    this.applyTheme();
    this.applyConfig(wizardStore.get());
  }

  /*
   * Theme the DOCUMENT ROOT, not this component's shadow .surface. The
   * attribute-driven layers (data-fluid-theme / -brand / -conformance) are
   * powered by document-level stylesheets (dark.css, the AAA block, the brand
   * themes) whose RULES do not cross shadow boundaries, only the custom-property
   * *values* they produce inherit in. So we set the attributes + inline token
   * overrides on <html>; every shadow (this preview and the whole wizard)
   * inherits the resolved tokens. Bonus: the entire wizard previews the choice.
   */
  private applyTheme(): void {
    // Root-scope apply: only the override diff (no semantic re-declaration), so
    // dark.css's dark semantics aren't clobbered and primitive overrides
    // re-resolve semantics at root automatically.
    themeStore.applyOverridesTo(document.documentElement);
  }

  private applyConfig({ config }: WizardState): void {
    const root = document.documentElement;
    // "auto" follows the OS for the live preview (the export emits the
    // prefers-color-scheme snippet for real apps).
    const dark =
      config.scheme === "dark" ||
      (config.scheme === "auto" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    root.setAttribute("data-fluid-theme", dark ? "dark" : "light");
    if (config.preset && config.preset !== "custom" && config.preset !== "default") {
      root.setAttribute("data-fluid-brand", config.preset);
    } else {
      root.setAttribute("data-fluid-brand", "custom");
    }
    if (config.conformance === "aaa") root.setAttribute("data-fluid-conformance", "aaa");
    else root.removeAttribute("data-fluid-conformance");
  }

  override render(): TemplateResult {
    return html`
      <div class="frame">
        <div class="frame-bar">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="frame-title">Live preview</span>
        </div>
        <div class="surface" part="surface">
          <div class="row">
            <fluid-button>Primary</fluid-button>
            <fluid-button variant="secondary">Secondary</fluid-button>
            <fluid-button variant="ghost">Ghost</fluid-button>
          </div>
          <div class="row">
            <fluid-badge variant="info">Info</fluid-badge>
            <fluid-badge variant="success">Success</fluid-badge>
            <fluid-badge variant="danger">Danger</fluid-badge>
            <a class="link" href="#" @click=${(e: Event) => e.preventDefault()}>A themed link</a>
          </div>
          ${this.step === "tones"
            ? html`
                <div class="row" aria-label="Status buttons">
                  <fluid-button tone="success" size="sm">Success</fluid-button>
                  <fluid-button tone="danger" size="sm">Danger</fluid-button>
                  <fluid-button tone="warning" size="sm">Warning</fluid-button>
                  <fluid-button tone="info" size="sm">Info</fluid-button>
                </div>
              `
            : null}
          <fluid-card>
            <h3 slot="header" style="margin:0;font-size:var(--fluid-font-size-lg);">Card title</h3>
            <p class="muted">
              Buttons, links, focus rings, and surfaces all follow the accent and
              scheme you choose. This is what your app will look like.
            </p>
            <div slot="footer" class="row" style="justify-content:flex-end;">
              <fluid-button variant="ghost" size="sm">Cancel</fluid-button>
              <fluid-button size="sm">Save</fluid-button>
            </div>
          </fluid-card>
          <div class="row">
            <fluid-input placeholder="you@example.com" style="flex:1;"></fluid-input>
            <fluid-switch checked></fluid-switch>
          </div>
          ${this.step === "conformance"
            ? html`
                <div class="motion-demo" aria-label="Motion demo">
                  <div class="motion-track">
                    <span class="motion-pill" aria-hidden="true"></span>
                  </div>
                  <span class="motion-hint">
                    This loops at your motion setting. Higher = slower and more deliberate, lower =
                    snappier, 0 = frozen.
                  </span>
                </div>
              `
            : html`<fluid-callout variant="success">Looks good, contrast passes.</fluid-callout>`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-preview": WizardPreview;
  }
}
