import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  arrow,
  type Placement
} from "@floating-ui/dom";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";
import "../button/define.js";
import type { FluidButtonTone } from "../button/fluid-button.js";

export type FluidPopconfirmTone = "danger" | "warning" | "brand" | "neutral";

let popconfirmIdCounter = 0;

/**
 * A confirmation popover anchored to its trigger. Drop an action that needs a
 * second confirmation (a delete button, an irreversible toggle) into the
 * `trigger` slot. Activating the trigger opens a small alert dialog in the top
 * layer with a message and Confirm / Cancel buttons.
 *
 * Maps to the WAI-ARIA Alert Dialog pattern: the panel is `role="alertdialog"`
 * with `aria-modal="true"`. There is no visible title, so the message element
 * supplies both the dialog's accessible name (`aria-labelledby`) and its
 * description (`aria-describedby`): a confirmation prompt's whole content is the
 * message, and an alertdialog must have an accessible name. On open, focus moves
 * to the Cancel button (the safe default for a destructive prompt); Escape
 * cancels; focus is restored to the trigger on close.
 *
 * Behavior:
 *  - Activate the trigger to open the prompt.
 *  - Confirm fires `fluid-confirm` and closes; Cancel fires `fluid-cancel` and closes.
 *  - Click outside or press Escape to cancel.
 *  - Focus moves to Cancel on open; restored to the trigger on close.
 *
 * @summary Confirmation prompt anchored to a trigger.
 *
 * @slot trigger - The control that opens the prompt (e.g. a delete button). Required.
 *
 * @csspart base - The outer wrapper.
 * @csspart panel - The popover panel (role="alertdialog").
 * @csspart arrow - The pointer arrow.
 * @csspart message - The confirmation message.
 * @csspart actions - The actions row wrapping the buttons.
 * @csspart confirm-button - The confirm button.
 * @csspart cancel-button - The cancel button.
 *
 * Every styled property reads a component-scoped `--fluid-popconfirm-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-popconfirm-bg - Panel background color. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-popconfirm-border - Panel border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-popconfirm-border-width - Panel border width. Falls back to 1px.
 * @cssproperty --fluid-popconfirm-radius - Panel corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-popconfirm-fg - Message text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-popconfirm-font-family - Panel font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-popconfirm-font-size - Message font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-popconfirm-padding - Panel padding. Falls back to --fluid-space-4.
 * @cssproperty --fluid-popconfirm-gap - Gap between message and actions. Falls back to --fluid-space-3.
 * @cssproperty --fluid-popconfirm-width - Panel max width. Falls back to 18rem.
 * @cssproperty --fluid-popconfirm-shadow - Panel elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-popconfirm-icon-color - Tone accent for the leading icon. Falls back per tone.
 *
 * @uses-token --fluid-surface-base - Default panel background.
 * @uses-token --fluid-border-default - Default panel border.
 * @uses-token --fluid-text-primary - Default message text.
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-sm - Default message size.
 * @uses-token --fluid-space-4 - Default panel padding.
 * @uses-token --fluid-space-3 - Default actions gap.
 * @uses-token --fluid-shadow-lg - Panel elevation.
 * @uses-token --fluid-danger-base - Danger tone accent.
 * @uses-token --fluid-warning-base - Warning tone accent.
 * @uses-token --fluid-accent-base - Brand tone accent.
 * @uses-token --fluid-text-secondary - Neutral tone accent.
 *
 * @fires fluid-confirm - Fired when the user confirms the action.
 * @fires fluid-cancel - Fired when the user cancels (button, outside click, or Escape).
 * @fires fluid-show - Fired when the prompt opens.
 * @fires fluid-hide - Fired when the prompt closes.
 */
export class FluidPopconfirm extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: contents;
    }

    .panel {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      box-sizing: border-box;
      max-width: var(--fluid-popconfirm-width, 18rem);
      display: flex;
      flex-direction: column;
      gap: var(--fluid-popconfirm-gap, var(--fluid-space-3));
      padding: var(--fluid-popconfirm-padding, var(--fluid-space-4));
      background: var(--fluid-popconfirm-bg, var(--fluid-surface-base));
      border: var(--fluid-popconfirm-border-width, 1px) solid
        var(--fluid-popconfirm-border, var(--fluid-border-default));
      border-radius: var(--fluid-popconfirm-radius, var(--fluid-radius-md));
      box-shadow: var(--fluid-popconfirm-shadow, var(--fluid-shadow-lg));
      font-family: var(--fluid-popconfirm-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-popconfirm-fg, var(--fluid-text-primary));
      opacity: 0;
      visibility: hidden;
      transform: scale(0.97);
      transform-origin: top left;
      transition:
        opacity calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
          var(--fluid-easing-standard),
        transform calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
          var(--fluid-easing-standard),
        visibility 0s calc(var(--fluid-duration-fast) * var(--fluid-motion, 1));
    }

    :host([open]) .panel {
      opacity: 1;
      visibility: visible;
      transform: scale(1);
      transition-delay: 0s;
    }

    .arrow {
      position: absolute;
      width: 0.625rem;
      height: 0.625rem;
      background: var(--fluid-popconfirm-bg, var(--fluid-surface-base));
      border: var(--fluid-popconfirm-border-width, 1px) solid
        var(--fluid-popconfirm-border, var(--fluid-border-default));
      transform: rotate(45deg);
      z-index: -1;
    }

    .body {
      display: flex;
      align-items: flex-start;
      gap: var(--fluid-space-2);
    }

    .icon {
      flex: 0 0 auto;
      display: inline-flex;
      width: 1.125rem;
      height: 1.125rem;
      margin-top: 0.0625rem;
      color: var(--fluid-popconfirm-icon-color, var(--fluid-text-secondary));
    }

    :host([tone="danger"]) .icon {
      color: var(--fluid-popconfirm-icon-color, var(--fluid-danger-base));
    }
    :host([tone="warning"]) .icon {
      color: var(--fluid-popconfirm-icon-color, var(--fluid-warning-base));
    }
    :host([tone="brand"]) .icon {
      color: var(--fluid-popconfirm-icon-color, var(--fluid-accent-base));
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }

    .message {
      margin: 0;
      font-size: var(--fluid-popconfirm-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-normal, 1.5);
      color: inherit;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--fluid-space-2);
    }
  `
  ];

  @query(".panel") private panelEl!: HTMLElement;
  @query(".arrow") private arrowEl!: HTMLElement;
  @query(".cancel") private cancelEl?: HTMLElement;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** The confirmation message shown in the prompt. */
  @property() message = "Are you sure?";

  /** Label for the confirm button. */
  @property({ attribute: "confirm-text" }) confirmText = "Confirm";

  /** Label for the cancel button. */
  @property({ attribute: "cancel-text" }) cancelText = "Cancel";

  /** Tone of the prompt. Drives the leading icon color and the confirm button. */
  @property({ reflect: true }) tone: FluidPopconfirmTone = "danger";

  /** Floating-ui placement. */
  @property() placement: Placement = "top";

  /** Distance (px) between the trigger and the panel. */
  @property({ type: Number }) distance = 10;

  /** Disable the popconfirm (activating the trigger does nothing). */
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private messageId = `fluid-popconfirm-${++popconfirmIdCounter}`;

  private trigger: HTMLElement | null = null;
  private cleanup?: () => void;
  private previouslyFocused: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
    document.removeEventListener("keydown", this.handleKeyDown);
    this.cleanup?.();
  }

  protected override firstUpdated(): void {
    this.attachTrigger();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) void this.handleOpen();
      else this.handleClose();
    }
  }

  /** Open the prompt. */
  show(): void {
    if (this.disabled || this.open) return;
    this.open = true;
  }

  /** Close the prompt without firing confirm or cancel. */
  hide(): void {
    if (!this.open) return;
    this.open = false;
  }

  private attachTrigger(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot[name='trigger']");
    const slotted = slot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!slotted) return;
    if (this.trigger !== slotted) {
      this.trigger?.removeEventListener("click", this.handleTriggerClick);
      this.trigger = slotted;
      this.trigger.addEventListener("click", this.handleTriggerClick);
      if (!this.trigger.hasAttribute("aria-haspopup")) {
        this.trigger.setAttribute("aria-haspopup", "dialog");
      }
    }
    this.trigger.setAttribute("aria-expanded", this.open ? "true" : "false");
  }

  private async handleOpen(): Promise<void> {
    this.previouslyFocused = (this.getRootNode() as Document).activeElement as HTMLElement | null;
    if (!this.trigger || !this.panelEl) return;
    this.trigger.setAttribute("aria-expanded", "true");
    this.cleanup = autoUpdate(this.trigger, this.panelEl, () => void this.reposition());
    await this.reposition();
    // Move focus to Cancel after the panel paints (safe default for a prompt).
    requestAnimationFrame(() => {
      this.cancelEl?.focus();
    });
    this.dispatchEvent(new CustomEvent("fluid-show", { bubbles: true, composed: true }));
  }

  private handleClose(): void {
    this.cleanup?.();
    this.cleanup = undefined;
    if (this.trigger) this.trigger.setAttribute("aria-expanded", "false");
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("fluid-hide", { bubbles: true, composed: true }));
  }

  private async reposition(): Promise<void> {
    if (!this.trigger || !this.panelEl) return;
    const { x, y, placement, middlewareData } = await computePosition(
      this.trigger,
      this.panelEl,
      {
        placement: this.placement,
        strategy: "fixed",
        middleware: [
          offset(this.distance),
          flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }),
          shift({ padding: 8 }),
          this.arrowEl ? arrow({ element: this.arrowEl, padding: 8 }) : undefined
        ].filter((m): m is NonNullable<typeof m> => m !== undefined)
      }
    );
    Object.assign(this.panelEl.style, { left: `${x}px`, top: `${y}px` });

    const arrowData = middlewareData.arrow;
    if (this.arrowEl && arrowData) {
      const side = placement.split("-")[0] ?? "top";
      const opposite: Record<string, string> = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
      };
      const staticSide = opposite[side] ?? "bottom";
      this.arrowEl.style.left = arrowData.x != null ? `${arrowData.x}px` : "";
      this.arrowEl.style.top = arrowData.y != null ? `${arrowData.y}px` : "";
      this.arrowEl.style.right = "";
      this.arrowEl.style.bottom = "";
      this.arrowEl.style[staticSide as "top" | "bottom" | "left" | "right"] = "-0.3125rem";
    }
  }

  private handleTriggerClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled) return;
    if (this.open) this.hide();
    else this.show();
  };

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (path.includes(this) || (this.trigger && path.includes(this.trigger))) return;
    this.cancel();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.open) {
      e.stopPropagation();
      this.cancel();
    }
  };

  private confirm = () => {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-confirm", { bubbles: true, composed: true }));
  };

  private cancel = () => {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent("fluid-cancel", { bubbles: true, composed: true }));
  };

  private get confirmButtonTone(): FluidButtonTone {
    return this.tone === "neutral" ? "neutral" : this.tone;
  }

  private renderIcon(): TemplateResult {
    if (this.tone === "danger" || this.tone === "warning") {
      return html`<svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>`;
    }
    return html`<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>`;
  }

  override render(): TemplateResult {
    return html`
      <slot name="trigger" @slotchange=${() => this.attachTrigger()}></slot>
      <div
        part="panel"
        class="panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby=${this.messageId}
        aria-describedby=${this.messageId}
      >
        <div class="body">
          <span class="icon" aria-hidden="true">${this.renderIcon()}</span>
          <p part="message" class="message" id=${this.messageId}>${this.message}</p>
        </div>
        <div part="actions" class="actions">
          <fluid-button
            part="cancel-button"
            class="cancel"
            variant="ghost"
            size="sm"
            tone="neutral"
            @click=${this.cancel}
          >
            ${this.cancelText}
          </fluid-button>
          <fluid-button
            part="confirm-button"
            class="confirm"
            variant="primary"
            size="sm"
            tone=${this.confirmButtonTone}
            @click=${this.confirm}
          >
            ${this.confirmText}
          </fluid-button>
        </div>
      </div>
    `;
  }
}
