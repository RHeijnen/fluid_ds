import { html, css, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { WizardStep } from "./step-base.js";

/**
 * Step 1, Start. A plain description of what the wizard produces, so the user
 * knows the outcome before investing in choices. (The brand-preset picker moved
 * to the Theme step.) Internal step id stays "preset" to avoid churning the
 * persisted-state format / URL links.
 */
@customElement("wizard-step-preset")
export class WizardStepPreset extends WizardStep {
  static override styles = [
    WizardStep.styles,
    css`
      .outcome {
        display: grid;
        gap: 0.75rem;
        max-width: 42rem;
        margin: 0 0 1.5rem;
        padding: 0;
        list-style: none;
      }
      .outcome li {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
      }
      .outcome .num {
        flex: none;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
        background: color-mix(in srgb, var(--fluid-accent-base) 14%, transparent);
        color: var(--fluid-accent-base);
      }
      .outcome strong {
        display: block;
      }
      .outcome .desc {
        color: var(--fluid-text-secondary);
        font-size: 0.9rem;
      }
      .note {
        color: var(--fluid-text-secondary);
        max-width: 48ch;
      }
    `
  ];

  protected stepTitle = "Set up Fluid your way";
  protected stepLede =
    "A few quick choices, every one previews live on the right. You walk away with a tiny, paste-ready override, not a fork of the whole system.";

  override render(): TemplateResult {
    return html`
      ${this.header()}
      <ol class="outcome">
        <li>
          <span class="num" aria-hidden="true">1</span>
          <span>
            <strong>A small CSS override block</strong>
            <span class="desc"
              >Just the tokens you changed (<code>[data-fluid-brand="custom"]</code>), layered on
              top of the base tokens, never a copy of everything.</span
            >
          </span>
        </li>
        <li>
          <span class="num" aria-hidden="true">2</span>
          <span>
            <strong>A copy-paste install snippet</strong>
            <span class="desc"
              >The stylesheet links, the component imports, the webfont, and the exact wrapper
              attributes your choices need.</span
            >
          </span>
        </li>
        <li>
          <span class="num" aria-hidden="true">3</span>
          <span>
            <strong>A resume link</strong>
            <span class="desc"
              >Bookmark where you left off, or hand the config to a teammate, it reopens the wizard
              with every choice intact.</span
            >
          </span>
        </li>
      </ol>
      <p class="note">Nothing here is permanent, you can change any step later, or skip ahead.</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "wizard-step-preset": WizardStepPreset;
  }
}
