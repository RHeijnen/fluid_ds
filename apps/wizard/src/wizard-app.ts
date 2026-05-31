import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";

import { STEPS, wizardStore, type Step } from "./wizard-store.js";
import { themeStore } from "./theme-store.js";
import { loadGoogleFont } from "./fonts.js";

import "./wizard-preview.js";
import "./steps/step-preset.js";
import "./steps/step-scheme.js";
import "./steps/step-accent.js";
import "./steps/step-tones.js";
import "./steps/step-type.js";
import "./steps/step-shape.js";
import "./steps/step-conformance.js";
import "./steps/step-review.js";
import "./steps/step-export.js";

/**
 * Configuration-wizard shell. Left column: the active step. Right column: a
 * persistent live preview that re-themes as the user makes choices. The flow
 * is override-first, sensible defaults, opt into changes, export the delta.
 */
@customElement("wizard-app")
export class WizardApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--fluid-surface-base);
      color: var(--fluid-text-primary);
      font-family: var(--fluid-font-family-sans);
    }

    header.site-nav {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      background: color-mix(in srgb, var(--fluid-surface-base) 85%, transparent);
      backdrop-filter: saturate(180%) blur(8px);
      border-bottom: 1px solid var(--fluid-border-default);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 700;
      font-size: 1.05rem;
      text-decoration: none;
      color: inherit;
    }
    .brand-mark {
      width: 1.7rem;
      height: 1.7rem;
      display: block;
      flex: none;
    }
    nav.primary {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    nav.primary a {
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      text-decoration: none;
      color: var(--fluid-text-primary);
      font-size: 0.92rem;
    }
    nav.primary a:hover {
      background: var(--fluid-surface-muted);
    }

    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 2rem 1.25rem 6rem;
    }
    .intro {
      margin-bottom: 1.5rem;
    }
    .intro h1 {
      font-size: clamp(1.6rem, 2.6vw, 2.2rem);
      margin: 0.4rem 0 0.3rem;
      letter-spacing: -0.01em;
    }
    .intro p {
      margin: 0;
      color: var(--fluid-text-secondary);
      max-width: 60ch;
    }

    .stepper {
      margin: 0 0 1.75rem;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 2rem;
      align-items: start;
    }
    @media (max-width: 880px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    footer.wizard-footer {
      position: sticky;
      bottom: 0;
      margin-top: 2rem;
      padding: 1rem 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: color-mix(in srgb, var(--fluid-surface-base) 92%, transparent);
      backdrop-filter: saturate(160%) blur(6px);
      border-top: 1px solid var(--fluid-border-default);
    }
    .footer-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: var(--fluid-text-secondary);
    }
    button.reset {
      all: unset;
      cursor: pointer;
      color: var(--fluid-text-secondary);
      text-decoration: underline;
      text-underline-offset: 2px;
      border-radius: 4px;
    }
    button.reset:hover {
      color: var(--fluid-accent-base);
    }
    button.reset:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-focus-ring-color, var(--fluid-accent-base));
      outline-offset: 2px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `;

  @state() private step: Step = wizardStore.get().step;
  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = wizardStore.subscribe((s) => {
      this.step = s.step;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  /** Wipe every choice back to the out-of-the-box defaults. */
  private startOver(): void {
    if (!window.confirm("Start over? This clears every choice and returns to the first step.")) {
      return;
    }
    themeStore.reset(); // clears token overrides (preview re-themes via subscription)
    loadGoogleFont(null); // drop any live webfont <link>
    wizardStore.reset(); // step → first, config → defaults
  }

  private static readonly STEP_META: Record<Step, { label: string; hint: string }> = {
    preset: { label: "Start", hint: "What you'll build" },
    scheme: { label: "Theme", hint: "Preset + light/dark" },
    accent: { label: "Color", hint: "Brand color" },
    tones: { label: "Status", hint: "success / danger…" },
    type: { label: "Font", hint: "Typeface & scale" },
    shape: { label: "Shape", hint: "Radius & density" },
    conformance: { label: "Accessibility", hint: "AA / AAA + motion" },
    review: { label: "Review", hint: "Check it over" },
    export: { label: "Export", hint: "Copy & ship" }
  };

  private renderStepContent(): TemplateResult {
    switch (this.step) {
      case "preset":
        return html`<wizard-step-preset></wizard-step-preset>`;
      case "scheme":
        return html`<wizard-step-scheme></wizard-step-scheme>`;
      case "accent":
        return html`<wizard-step-accent></wizard-step-accent>`;
      case "tones":
        return html`<wizard-step-tones></wizard-step-tones>`;
      case "type":
        return html`<wizard-step-type></wizard-step-type>`;
      case "shape":
        return html`<wizard-step-shape></wizard-step-shape>`;
      case "conformance":
        return html`<wizard-step-conformance></wizard-step-conformance>`;
      case "review":
        return html`<wizard-step-review></wizard-step-review>`;
      case "export":
        return html`<wizard-step-export></wizard-step-export>`;
    }
  }

  override render(): TemplateResult {
    const stepIndex = STEPS.indexOf(this.step);
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === STEPS.length - 1;
    const meta = WizardApp.STEP_META[this.step];

    return html`
      <header class="site-nav">
        <a class="brand" href="/">
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
          <span>Fluid</span>
        </a>
        <nav class="primary" aria-label="Primary">
          <a href="/docs/">Docs</a>
          <a href="/storybook/">Storybook</a>
          <a href="/playground/">Theme builder</a>
          <a href="/demos/">Demos</a>
        </nav>
      </header>

      <main>
        <div class="intro">
          <fluid-badge variant="info">Configuration wizard</fluid-badge>
          <h1>Set up Fluid your way</h1>
          <p>
            Start from a sensible default, then decide what to override. Every
            choice previews live; you leave with a small CSS override block: just
            the deltas, layered on top of the base tokens.
          </p>
        </div>

        <fluid-steps
          class="stepper"
          variant="chip"
          current=${stepIndex}
          clickable
          aria-label="Wizard progress"
          @fluid-step-change=${(e: CustomEvent<{ index: number }>) => {
            const target = STEPS[e.detail.index];
            if (target) wizardStore.setStep(target);
          }}
        >
          ${STEPS.map((step) => {
            const m = WizardApp.STEP_META[step];
            return html`<fluid-step description=${m.hint}>${m.label}</fluid-step>`;
          })}
        </fluid-steps>

        <div class="layout">
          <section class="step-content">${this.renderStepContent()}</section>
          <aside aria-label="Live preview">
            <wizard-preview></wizard-preview>
          </aside>
        </div>

        <div class="sr-only" role="status" aria-live="polite">
          Step ${stepIndex + 1} of ${STEPS.length}: ${meta.label}
        </div>

        <footer class="wizard-footer">
          <fluid-button variant="secondary" ?disabled=${isFirst} @click=${() => wizardStore.prev()}>
            <fluid-icon slot="prefix" name="arrow-left"></fluid-icon>
            Back
          </fluid-button>
          <span class="footer-meta">
            <span>Step ${stepIndex + 1} of ${STEPS.length}</span>
            <button type="button" class="reset" @click=${() => this.startOver()}>Start over</button>
          </span>
          <fluid-button ?disabled=${isLast} @click=${() => wizardStore.next()}>
            ${isLast ? "Done" : "Continue"}
            <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
          </fluid-button>
        </footer>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-app": WizardApp;
  }
}
