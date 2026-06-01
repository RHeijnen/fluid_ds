import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";
// The tour's action controls are real Fluid buttons, so they match the rest of
// the design system. Side-effect import registers <fluid-button>.
import "../button/define.js";

/**
 * One stop in the tour. `target` is a CSS selector resolved against the tour's
 * own root node (its containing document or shadow root), so a tour that lives
 * inside a shadow root spotlights elements in that same root.
 */
export interface FluidTourStep {
  /** CSS selector for the element to spotlight. */
  target: string;
  /** Step heading. */
  title: string;
  /** Step body copy. */
  body: string;
  /** Preferred popover placement relative to the target. */
  placement?: Placement;
}

let counter = 0;

/**
 * A guided product tour (coachmarks). Given an ordered list of `steps`, it walks
 * the user through your UI one step at a time: it spotlights the current step's
 * target element (a full-page scrim with a transparent cutout punched out via a
 * large box-shadow on a positioned highlight) and shows a popover anchored to
 * that target with the step title, body, a "Step n of m" counter, and the
 * Back / Next / Done plus Skip controls.
 *
 * Accessibility: the popover is the WAI-ARIA APG Dialog (Modal) pattern. It is
 * `role="dialog"` with `aria-modal="true"`, labelled by its heading and
 * described by its body. Focus moves into the popover on open and is trapped
 * (Tab wraps); each step's text is mirrored into an `aria-live` region so a
 * screen reader announces the change. The scrim and popover render in the top
 * layer (`popover="manual"`) so they are never clipped by an ancestor's
 * overflow, transform, or containment.
 *
 * Keyboard: ArrowRight / ArrowLeft step forward / back, Escape skips the tour,
 * Tab is trapped inside the popover.
 *
 * @summary Step-by-step guided product tour with spotlight coachmarks.
 *
 * @csspart base - The popover dialog.
 * @csspart scrim - The dimming overlay behind the spotlight.
 * @csspart highlight - The transparent spotlight cutout over the target.
 * @csspart title - The step heading.
 * @csspart body - The step body copy.
 * @csspart counter - The "Step n of m" text.
 * @csspart actions - The button row.
 * @csspart back - The Back action (a fluid-button).
 * @csspart next - The Next / Done action (a fluid-button, the emphasised primary action).
 * @csspart skip - The Skip action (a fluid-button).
 *
 * Every styled property reads a component-scoped `--fluid-tour-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-tour-bg - Popover background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-tour-fg - Popover text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-tour-muted-fg - Secondary text (the counter). Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-tour-border - Popover border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-tour-border-width - Popover border width. Falls back to 1px.
 * @cssproperty --fluid-tour-radius - Popover corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-tour-shadow - Popover elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-tour-font-family - Popover font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-tour-scrim - Scrim color (the dim outside the cutout). Falls back to a translucent black.
 * @cssproperty --fluid-tour-highlight-radius - Spotlight cutout corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-tour-highlight-ring - Spotlight outline color, also the emphasis glow on the primary action. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-tour-highlight-ring-width - Width of the emphasis glow around the primary (Next / Done) action. Falls back to 3px.
 * @cssproperty --fluid-tour-focus-ring-color - Focus ring color for the action buttons. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-surface-base - Popover background.
 * @uses-token --fluid-text-primary - Popover text.
 * @uses-token --fluid-text-secondary - Counter text.
 * @uses-token --fluid-border-default - Popover + button border.
 * @uses-token --fluid-radius-lg - Popover corner radius.
 * @uses-token --fluid-radius-md - Spotlight corner radius.
 * @uses-token --fluid-shadow-lg - Popover elevation.
 * @uses-token --fluid-font-family-sans - Popover font family.
 * @uses-token --fluid-accent-base - Primary button + spotlight ring.
 * @uses-token --fluid-accent-text - Primary button text.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Button min target (24/44px).
 *
 * @fires fluid-step-change - The active step changed. `detail: { index }`.
 * @fires fluid-finish - The tour completed (Done on the last step).
 * @fires fluid-skip - The tour was dismissed (Skip or Escape).
 */
export class FluidTour extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: contents;
      }

      .scrim {
        position: fixed;
        inset: 0;
        margin: 0;
        padding: 0;
        border: 0;
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        background: transparent;
        pointer-events: none;
        overflow: visible;
      }
      .scrim::backdrop {
        background: transparent;
      }

      /* The highlight is positioned over the target; its huge spread box-shadow
         paints the scrim everywhere EXCEPT the cutout, giving a spotlight. */
      .highlight {
        position: fixed;
        top: 0;
        left: 0;
        box-sizing: border-box;
        pointer-events: none;
        border-radius: var(--fluid-tour-highlight-radius, var(--fluid-radius-md, 8px));
        box-shadow:
          0 0 0 9999px var(--fluid-tour-scrim, rgb(0 0 0 / 0.55)),
          0 0 0 2px var(--fluid-tour-highlight-ring, var(--fluid-accent-base));
        transition:
          top calc(var(--fluid-duration-normal, 200ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease),
          left calc(var(--fluid-duration-normal, 200ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease),
          width calc(var(--fluid-duration-normal, 200ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease),
          height calc(var(--fluid-duration-normal, 200ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease);
      }

      .panel {
        position: fixed;
        inset: auto;
        top: 0;
        left: 0;
        z-index: 1001;
        margin: 0;
        box-sizing: border-box;
        width: max-content;
        max-width: min(20rem, calc(100vw - 2rem));
        padding: var(--fluid-space-4, 1rem);
        background: var(--fluid-tour-bg, var(--fluid-surface-base));
        color: var(--fluid-tour-fg, var(--fluid-text-primary));
        border: var(--fluid-tour-border-width, 1px) solid
          var(--fluid-tour-border, var(--fluid-border-default));
        border-radius: var(--fluid-tour-radius, var(--fluid-radius-lg, 0.75rem));
        box-shadow: var(--fluid-tour-shadow, var(--fluid-shadow-lg, 0 12px 32px -8px rgb(0 0 0 / 0.25)));
        font-family: var(--fluid-tour-font-family, var(--fluid-font-family-sans));
        opacity: 0;
        transform: scale(0.97);
        transform-origin: top left;
        transition:
          opacity calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease),
          transform calc(var(--fluid-duration-fast, 120ms) * var(--fluid-motion, 1))
            var(--fluid-easing-standard, ease);
      }
      .panel:popover-open {
        opacity: 1;
        transform: scale(1);
      }
      @starting-style {
        .panel:popover-open {
          opacity: 0;
          transform: scale(0.97);
        }
      }

      .counter {
        margin: 0 0 var(--fluid-space-1, 0.25rem);
        font-size: var(--fluid-font-size-xs, 0.75rem);
        font-weight: var(--fluid-font-weight-medium, 500);
        color: var(--fluid-tour-muted-fg, var(--fluid-text-secondary));
      }
      .title {
        margin: 0 0 var(--fluid-space-2, 0.5rem);
        font-size: var(--fluid-font-size-md, 1rem);
        font-weight: var(--fluid-font-weight-semibold, 600);
        line-height: 1.3;
        color: inherit;
      }
      .body {
        margin: 0 0 var(--fluid-space-4, 1rem);
        font-size: var(--fluid-font-size-sm, 0.875rem);
        line-height: 1.5;
        color: inherit;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: var(--fluid-space-2, 0.5rem);
      }
      .actions .spacer {
        flex: 1;
      }

      /*
       * The action buttons are real <fluid-button>s, so they inherit the design
       * system's look, sizing, focus ring, and target-size floor. The tour's job
       * is only to EMPHASISE its own primary action so the user always sees where
       * to click next: a soft glow ring around the advance (Next / Done) button.
       * The ring color reads the component-scoped accent token, falling back to
       * the main accent var (the override ladder), and is suppressed under
       * reduced-motion-agnostic rules (it is a static ring, no animation).
       */
      .action::part(base) {
        --fluid-button-focus-ring-color: var(
          --fluid-tour-focus-ring-color,
          var(--fluid-focus-ring-color, var(--fluid-accent-base))
        );
      }
      .action-next {
        border-radius: var(--fluid-radius-md, 8px);
        box-shadow:
          0 0 0 var(--fluid-tour-highlight-ring-width, 3px)
            color-mix(
              in srgb,
              var(--fluid-tour-highlight-ring, var(--fluid-accent-base)) 35%,
              transparent
            );
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ];

  /** The ordered list of tour steps. */
  @property({ type: Array }) steps: FluidTourStep[] = [];

  /** Whether the tour is running. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Index of the active step. */
  @property({ type: Number, reflect: true }) index = 0;

  @state() private liveMessage = "";

  @query(".panel") private panelEl!: HTMLElement;
  @query(".scrim") private scrimEl!: HTMLElement;
  @query(".highlight") private highlightEl!: HTMLElement;

  private cleanup?: () => void;
  private currentTarget: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;
  private panelId = `fluid-tour-${++counter}`;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.teardown();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) void this.start();
      else this.teardown();
      return;
    }
    if (this.open && (changed.has("index") || changed.has("steps"))) {
      void this.applyStep();
    }
  }

  /** The current step, guarded against an out-of-range index. */
  private get currentStep(): FluidTourStep | undefined {
    return this.steps[this.index];
  }

  /** Open the tour at the first step. */
  show(): void {
    this.index = 0;
    this.open = true;
  }

  /** Advance to the next step, or finish on the last one. */
  next(): void {
    if (this.index >= this.steps.length - 1) {
      this.finish();
      return;
    }
    this.index += 1;
    this.dispatchEvent(
      new CustomEvent("fluid-step-change", {
        detail: { index: this.index },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Go back to the previous step. */
  back(): void {
    if (this.index <= 0) return;
    this.index -= 1;
    this.dispatchEvent(
      new CustomEvent("fluid-step-change", {
        detail: { index: this.index },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Finish the tour (the user reached the end). */
  finish(): void {
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-finish", { bubbles: true, composed: true }));
  }

  /** Skip / dismiss the tour. */
  skip(): void {
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-skip", { bubbles: true, composed: true }));
  }

  private async start(): Promise<void> {
    const root = this.getRootNode() as Document | ShadowRoot;
    this.previouslyFocused = root.activeElement as HTMLElement | null;
    document.addEventListener("keydown", this.handleKeyDown, true);
    await this.updateComplete;
    const scrim = this.scrimEl as HTMLElement & { showPopover?: () => void };
    const panel = this.panelEl as HTMLElement & { showPopover?: () => void };
    try {
      scrim.showPopover?.();
      panel.showPopover?.();
    } catch {
      /* already shown or unsupported, ignore */
    }
    await this.applyStep();
  }

  private teardown(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    document.removeEventListener("keydown", this.handleKeyDown, true);
    const scrim: (HTMLElement & { hidePopover?: () => void }) | null = this.scrimEl ?? null;
    const panel: (HTMLElement & { hidePopover?: () => void }) | null = this.panelEl ?? null;
    try {
      panel?.hidePopover?.();
      scrim?.hidePopover?.();
    } catch {
      /* not shown, ignore */
    }
    this.currentTarget = null;
    const restore = this.previouslyFocused;
    this.previouslyFocused = null;
    restore?.focus?.();
  }

  /**
   * Resolve a step's CSS selector against the tour's own root node first, then
   * fall back to the document. `document.querySelector` never pierces a shadow
   * boundary, so a tour rendered inside a shadow root (the theme-builder
   * playground, or any consumer's component) must query its containing root to
   * find the elements it spotlights.
   */
  private resolveTarget(selector: string): HTMLElement | null {
    const root = this.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      const inRoot = root.querySelector<HTMLElement>(selector);
      if (inRoot) return inRoot;
    }
    return document.querySelector<HTMLElement>(selector);
  }

  /** Resolve the current target, place the spotlight + popover, move focus. */
  private async applyStep(): Promise<void> {
    const step = this.currentStep;
    if (!step) return;
    await this.updateComplete;

    const target = this.resolveTarget(step.target);
    this.currentTarget = target;

    // Keep autoUpdate pinned to whatever the active target is.
    this.cleanup?.();
    this.cleanup = undefined;
    if (target) {
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      this.cleanup = autoUpdate(target, this.panelEl, () => this.reposition());
    }
    this.reposition();

    // Announce the step for assistive tech.
    this.liveMessage = `Step ${this.index + 1} of ${this.steps.length}. ${step.title}. ${step.body}`;

    // Move focus into the popover after it paints. Prefer the emphasised
    // primary action (the Next / Done button) so focus lands on the control we
    // want the user to act on; otherwise the first focusable control.
    requestAnimationFrame(() => {
      const controls = this.focusables();
      const preferred = controls.find((c) => c.classList.contains("action-next"));
      (preferred ?? controls[0])?.focus();
    });
  }

  /** Position the spotlight over the target and the popover next to it. */
  private reposition(): void {
    const target = this.currentTarget;
    if (target && this.highlightEl) {
      const rect = target.getBoundingClientRect();
      const pad = 6;
      Object.assign(this.highlightEl.style, {
        display: "block",
        top: `${rect.top - pad}px`,
        left: `${rect.left - pad}px`,
        width: `${rect.width + pad * 2}px`,
        height: `${rect.height + pad * 2}px`
      });
    } else if (this.highlightEl) {
      // No target: hide the cutout so the scrim is uniform.
      this.highlightEl.style.display = "none";
    }

    if (!this.panelEl) return;
    if (target) {
      void computePosition(target, this.panelEl, {
        placement: this.currentStep?.placement ?? "bottom",
        strategy: "fixed",
        middleware: [offset(12), flip({ rootBoundary: "viewport" }), shift({ padding: 12 })]
      }).then(({ x, y }) => {
        Object.assign(this.panelEl.style, { left: `${x}px`, top: `${y}px` });
      });
    } else {
      // Center the popover when there is no anchor.
      this.panelEl.style.left = "50%";
      this.panelEl.style.top = "50%";
      this.panelEl.style.transform = "translate(-50%, -50%)";
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.open) return;
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        this.skip();
        return;
      case "ArrowRight":
        e.preventDefault();
        this.next();
        return;
      case "ArrowLeft":
        e.preventDefault();
        this.back();
        return;
      case "Tab":
        this.trapFocus(e);
        return;
      default:
        return;
    }
  };

  /**
   * The popover's focusable controls, in DOM order. The action buttons are
   * `fluid-button` hosts (delegatesFocus forwards `.focus()` to the inner native
   * button), so we match those alongside any native focusables.
   */
  private focusables(): HTMLElement[] {
    if (!this.panelEl) return [];
    return Array.from(
      this.panelEl.querySelectorAll<HTMLElement>(
        'fluid-button:not([disabled]), button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  /** Keep Tab focus inside the popover (APG Dialog focus trap). */
  private trapFocus(e: KeyboardEvent): void {
    if (!this.panelEl) return;
    const focusables = this.focusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    // Resolve the focused control inside this component's own shadow root. The
    // action buttons are `fluid-button` hosts, so `shadowRoot.activeElement`
    // gives us the host element we can compare against `focusables`.
    const shadow = this.shadowRoot;
    const focused = shadow?.activeElement as HTMLElement | null;
    const active = focused && this.panelEl.contains(focused) ? focused : null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  override render(): TemplateResult {
    const step = this.currentStep;
    const total = this.steps.length;
    const isLast = this.index >= total - 1;
    const isFirst = this.index <= 0;
    const titleId = `${this.panelId}-title`;
    const bodyId = `${this.panelId}-body`;

    return html`
      <div part="scrim" class="scrim" popover="manual" aria-hidden="true">
        <div part="highlight" class="highlight"></div>
      </div>

      <div
        part="base"
        id=${this.panelId}
        class="panel"
        popover="manual"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${titleId}
        aria-describedby=${bodyId}
      >
        <p part="counter" class="counter">Step ${total ? this.index + 1 : 0} of ${total}</p>
        <h2 part="title" class="title" id=${titleId}>${step?.title ?? ""}</h2>
        <p part="body" class="body" id=${bodyId}>${step?.body ?? ""}</p>

        <div part="actions" class="actions">
          <fluid-button
            part="skip"
            class="action action-skip"
            variant="ghost"
            size="sm"
            @fluid-click=${() => this.skip()}
          >
            Skip
          </fluid-button>
          <span class="spacer"></span>
          ${isFirst
            ? ""
            : html`
                <fluid-button
                  part="back"
                  class="action action-back"
                  variant="secondary"
                  size="sm"
                  @fluid-click=${() => this.back()}
                >
                  Back
                </fluid-button>
              `}
          <fluid-button
            part="next"
            class="action action-next"
            variant="primary"
            size="sm"
            @fluid-click=${() => this.next()}
          >
            ${isLast ? "Done" : "Next"}
          </fluid-button>
        </div>
      </div>

      <div class="sr-only" role="status" aria-live="polite">${this.liveMessage}</div>
    `;
  }
}
