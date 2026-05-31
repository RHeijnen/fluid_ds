import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import type { FluidToastItem, FluidToastVariant } from "./fluid-toast-item.js";

export type FluidToastPlacement =
  | "top-start"
  | "top"
  | "top-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end";

interface ToastOptions {
  /** Body text or markup. Strings are appended as text; HTMLElements are appended directly. */
  message: string | HTMLElement;
  variant?: FluidToastVariant;
  /** Auto-dismiss duration in ms. 0 = sticky. */
  duration?: number;
}

/**
 * Toast stack manager. Render one of these per app (or per region) and call
 * `.toast(options)` to push new toasts onto the stack. Toasts auto-dismiss
 * and the stack handles its own positioning.
 *
 * Multiple toast containers in the same document is supported, useful if
 * you want different placements for different parts of the app (e.g.
 * top-end for global notifications, bottom for in-content prompts).
 *
 * @summary Toast notification stack.
 *
 * @slot - Pre-existing `<fluid-toast-item>` children (rare, usually pushed via toast()).
 *
 * @csspart base - The stack container.
 *
 * @cssproperty --fluid-toast-gap - Vertical gap between stacked toasts.
 *
 * @uses-token --fluid-space-3 - Default gap between toasts.
 */
export class FluidToast extends FluidElement {
  static override styles = css`
    :host {
      position: fixed;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-toast-gap, var(--fluid-space-3));
      padding: var(--fluid-space-4);
      pointer-events: none;
      max-width: 100vw;
    }

    :host([placement^="top"]) {
      top: 0;
    }
    :host([placement^="bottom"]) {
      bottom: 0;
      flex-direction: column-reverse;
    }
    :host([placement$="-start"]) {
      left: 0;
      align-items: flex-start;
    }
    :host([placement$="-end"]) {
      right: 0;
      align-items: flex-end;
    }
    :host([placement="top"]),
    :host([placement="bottom"]) {
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }
  `;

  /** Stack placement. */
  @property({ reflect: true }) placement: FluidToastPlacement = "top-end";

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "region");
    this.setAttribute("aria-label", "Notifications");
  }

  /**
   * Push a new toast onto the stack. Returns the created toast-item so the
   * caller can dismiss it programmatically.
   */
  toast(options: ToastOptions): FluidToastItem {
    const item = document.createElement("fluid-toast-item") as FluidToastItem;
    item.variant = options.variant ?? "neutral";
    if (options.duration !== undefined) item.duration = options.duration;
    if (typeof options.message === "string") {
      item.textContent = options.message;
    } else {
      item.appendChild(options.message);
    }
    item.addEventListener("fluid-dismiss", () => item.remove(), { once: true });
    this.appendChild(item);
    return item;
  }

  /** Dismiss all toasts. */
  clear(): void {
    for (const item of Array.from(this.querySelectorAll("fluid-toast-item"))) {
      (item as FluidToastItem).dismiss();
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
