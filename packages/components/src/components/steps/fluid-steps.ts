import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidStep } from "./fluid-step.js";

export type FluidStepsOrientation = "horizontal" | "vertical";
export type FluidStepsVariant = "default" | "chip";

/**
 * A progress / navigation stepper. Renders an ordered list of `<fluid-step>`
 * children and derives each step's visual state from the `current` index:
 * complete (before current), current, or upcoming (after current).
 *
 * A stepper is a progress indicator, NOT a set of buttons. By default the steps
 * are presentational. Set `clickable` to turn each step into a real `<button>`
 * that is focusable, keyboard-activatable, and fires `fluid-step-change`.
 *
 * Two visual variants: the default connector style (numbered circles joined by
 * lines, with labels and descriptions), and `variant="chip"`, a compact row of
 * pills (number badge + inline label, no connectors) that wraps onto multiple
 * rows. Both share the same state model and tokens.
 *
 * @summary Container for an ordered set of `<fluid-step>` items.
 *
 * @slot - One or more `<fluid-step>` elements.
 *
 * @csspart base - The list wrapper (role="list").
 *
 * @cssproperty --fluid-steps-gap - Gap between steps. Falls back to --fluid-space-2 (horizontal) / --fluid-space-4 (vertical).
 *
 * @uses-token --fluid-space-2 - Default gap between steps (horizontal).
 * @uses-token --fluid-space-4 - Default gap between steps (vertical).
 *
 * @fires fluid-step-change - Fired when a clickable step is activated. `event.detail.index` (0-based).
 */
export class FluidSteps extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

      .base {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
      }

      .base.horizontal {
        flex-direction: row;
        align-items: flex-start;
        gap: var(--fluid-steps-gap, var(--fluid-space-2));
      }

      .base.vertical {
        flex-direction: column;
        gap: var(--fluid-steps-gap, var(--fluid-space-4));
      }

      /* Chip variant: a wrapping row of pills. */
      :host([variant="chip"]) .base {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--fluid-steps-gap, var(--fluid-space-2));
      }
  `;

  /** 0-based index of the active (current) step. */
  @property({ type: Number, reflect: true }) current = 0;

  /** Layout axis. */
  @property({ reflect: true }) orientation: FluidStepsOrientation = "horizontal";

  /**
   * Visual variant. `default` is the connector stepper; `chip` is a compact
   * wrapping row of pills (number badge + inline label, no connectors).
   */
  @property({ reflect: true }) variant: FluidStepsVariant = "default";

  /**
   * When true each step is an interactive `<button>` that fires
   * `fluid-step-change` on activation. When false (default) steps are
   * presentational.
   */
  @property({ type: Boolean, reflect: true }) clickable = false;

  /** Accessible name for the stepper. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
  }

  protected override firstUpdated(): void {
    this.syncSteps();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("current") ||
      changed.has("orientation") ||
      changed.has("clickable") ||
      changed.has("variant")
    ) {
      this.syncSteps();
    }
  }

  private getSteps(): FluidStep[] {
    return Array.from(this.querySelectorAll("fluid-step")) as FluidStep[];
  }

  /** Push derived state (number, complete/current/upcoming, orientation) onto each child. */
  private syncSteps(): void {
    const steps = this.getSteps();
    steps.forEach((step, i) => {
      step.index = i + 1;
      step.first = i === 0;
      step.orientation = this.orientation;
      step.variant = this.variant;
      step.clickable = this.clickable;
      step.state = i < this.current ? "complete" : i === this.current ? "current" : "upcoming";
    });
  }

  private handleClick = (e: Event) => {
    if (!this.clickable) return;
    const step = (e.target as HTMLElement).closest("fluid-step") as FluidStep | null;
    if (!step) return;
    const index = this.getSteps().indexOf(step);
    if (index < 0) return;
    this.dispatchEvent(
      new CustomEvent("fluid-step-change", {
        detail: { index },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleSlotChange = () => this.syncSteps();

  override render(): TemplateResult {
    // role="list" + each step's role="listitem" gives the same accessibility
    // tree as an <ol> (slotted children flatten in). We use the role instead of
    // a literal <ol> because a shadow-DOM <ol> can only contain <li>/<template>/
    // <script> per spec, a <slot> would be a lint/markup violation. The
    // numbering is conveyed by the visible indicators (screen readers don't
    // announce <ol> ordinals anyway).
    return html`
      <div
        part="base"
        class="base ${this.orientation}"
        role="list"
        aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
