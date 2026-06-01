import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

export type FluidSpeedDialPlacement = "up" | "down" | "left" | "right";

let counter = 0;

/**
 * A floating action button that expands a set of actions.
 *
 * Implements the WAI-ARIA Menu Button pattern: the trigger is a `<button>`
 * with `aria-haspopup="menu"` and `aria-expanded`; the actions are a
 * `role="menu"` of slotted action buttons (each `role="menuitem"`) that animate
 * out when the dial opens.
 *
 * Keyboard contract (Menu Button + Menu):
 * - Enter / Space / the placement-aligned arrow open the menu and focus the
 *   first action.
 * - Arrow keys move focus between actions (roving tabindex); the opposite arrow
 *   focuses the last action when opening.
 * - Home / End jump to the first / last action.
 * - Esc closes the dial and returns focus to the trigger.
 * - Tab closes the dial.
 * Clicking an action fires `fluid-action` and closes the dial.
 *
 * Honors `prefers-reduced-motion` and the `--fluid-motion` scalar.
 *
 * @summary Floating action button that fans out a set of actions.
 *
 * @slot - One or more action buttons. Each is given `role="menuitem"` and
 *   roving tabindex automatically.
 * @slot trigger-icon - Optional custom icon for the trigger (defaults to a `+`).
 *
 * @csspart base - The outer wrapper.
 * @csspart trigger - The floating trigger button.
 * @csspart menu - The `role="menu"` actions container.
 *
 * Every styled property reads a component-scoped `--fluid-speed-dial-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-speed-dial-bg - Trigger background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-speed-dial-fg - Trigger icon color. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-speed-dial-size - Trigger diameter. Falls back to 3.5rem.
 * @cssproperty --fluid-speed-dial-radius - Trigger corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-speed-dial-gap - Gap between trigger and actions. Falls back to --fluid-space-3.
 * @cssproperty --fluid-speed-dial-action-gap - Gap between actions. Falls back to --fluid-space-2.
 * @cssproperty --fluid-speed-dial-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-speed-dial-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-speed-dial-focus-ring-offset - Focus ring offset. Falls back to --fluid-focus-ring-offset.
 *
 * @uses-token --fluid-accent-base - Trigger background.
 * @uses-token --fluid-accent-text - Trigger icon color.
 * @uses-token --fluid-radius-full - Default trigger corner radius.
 * @uses-token --fluid-space-3 - Default gap between trigger and actions.
 * @uses-token --fluid-space-2 - Default gap between actions.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum trigger target size (24px AA / 44px AAA).
 * @uses-token --fluid-shadow-lg - Trigger elevation.
 * @uses-token --fluid-duration-fast - Open/close transition duration.
 * @uses-token --fluid-easing-emphasized - Open/close easing.
 *
 * @fires fluid-action - Fired when an action is activated (click or keyboard).
 *   `event.detail.action` is the activated element.
 * @fires fluid-open - Fired when the dial opens.
 * @fires fluid-close - Fired when the dial closes.
 */
export class FluidSpeedDial extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: inline-flex;
        position: relative;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: inline-flex;
        position: relative;
        align-items: center;
        justify-content: center;
      }

      .trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: var(--fluid-speed-dial-size, 3.5rem);
        height: var(--fluid-speed-dial-size, 3.5rem);
        /* AAA can lift the floor to a 44px target; AA keeps the design size. */
        min-width: max(var(--fluid-speed-dial-size, 3.5rem), var(--fluid-target-min, 0px));
        min-height: max(var(--fluid-speed-dial-size, 3.5rem), var(--fluid-target-min, 0px));
        padding: 0;
        border: none;
        border-radius: var(--fluid-speed-dial-radius, var(--fluid-radius-full));
        background: var(--fluid-speed-dial-bg, var(--fluid-accent-base));
        color: var(--fluid-speed-dial-fg, var(--fluid-accent-text));
        box-shadow: var(--fluid-shadow-lg);
        cursor: pointer;
        transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .trigger:hover {
        transform: scale(1.04);
      }

      .trigger:focus-visible {
        outline: var(--fluid-speed-dial-focus-ring-width, var(--fluid-focus-ring-width)) solid
          var(--fluid-speed-dial-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: var(--fluid-speed-dial-focus-ring-offset, 2px);
      }

      .trigger-icon {
        display: inline-flex;
        width: 1.5em;
        height: 1.5em;
        transition: transform var(--fluid-duration-fast) var(--fluid-easing-emphasized);
      }

      :host([open]) .trigger-icon {
        transform: rotate(45deg);
      }

      .trigger-icon svg {
        width: 100%;
        height: 100%;
      }

      .menu {
        display: flex;
        position: absolute;
        gap: var(--fluid-speed-dial-action-gap, var(--fluid-space-2));
        margin: 0;
        padding: 0;
        list-style: none;
        /* Hidden + non-interactive until open. */
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: scale(0.9);
        transform-origin: center;
        transition:
          opacity calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
            var(--fluid-easing-emphasized),
          transform calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
            var(--fluid-easing-emphasized),
          visibility 0s linear calc(var(--fluid-duration-fast) * var(--fluid-motion, 1));
      }

      :host([open]) .menu {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: none;
        transition-delay: 0s;
      }

      /* Placement: the menu fans out from the trigger in the chosen direction. */
      :host([placement="up"]) .menu {
        flex-direction: column-reverse;
        bottom: calc(100% + var(--fluid-speed-dial-gap, var(--fluid-space-3)));
        left: 50%;
        align-items: center;
        transform: translateX(-50%) scale(0.9);
        transform-origin: bottom center;
      }
      :host([open][placement="up"]) .menu {
        transform: translateX(-50%);
      }

      :host([placement="down"]) .menu {
        flex-direction: column;
        top: calc(100% + var(--fluid-speed-dial-gap, var(--fluid-space-3)));
        left: 50%;
        align-items: center;
        transform: translateX(-50%) scale(0.9);
        transform-origin: top center;
      }
      :host([open][placement="down"]) .menu {
        transform: translateX(-50%);
      }

      :host([placement="left"]) .menu {
        flex-direction: row-reverse;
        right: calc(100% + var(--fluid-speed-dial-gap, var(--fluid-space-3)));
        top: 50%;
        align-items: center;
        transform: translateY(-50%) scale(0.9);
        transform-origin: right center;
      }
      :host([open][placement="left"]) .menu {
        transform: translateY(-50%);
      }

      :host([placement="right"]) .menu {
        flex-direction: row;
        left: calc(100% + var(--fluid-speed-dial-gap, var(--fluid-space-3)));
        top: 50%;
        align-items: center;
        transform: translateY(-50%) scale(0.9);
        transform-origin: left center;
      }
      :host([open][placement="right"]) .menu {
        transform: translateY(-50%);
      }

      /* Honor the --fluid-motion scalar on the trigger transforms too. */
      ::slotted(*) {
        margin: 0 !important;
      }
    `
  ];

  @query(".trigger") private triggerEl!: HTMLButtonElement;

  /** Whether the dial is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Which direction the actions fan out from the trigger. */
  @property({ reflect: true }) placement: FluidSpeedDialPlacement = "up";

  /** Accessible label for the trigger button. */
  @property() label = "Actions";

  @state() private activeIndex = -1;

  private menuId = `fluid-speed-dial-menu-${++counter}`;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
  }

  override focus(options?: FocusOptions): void {
    this.triggerEl?.focus(options);
  }

  /** Get all slotted action elements (skipping disabled ones is done per-call). */
  private getActions(): HTMLElement[] {
    return Array.from(this.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.slot !== "trigger-icon"
    );
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      this.applyActionRoles();
      if (this.open) {
        this.dispatchEvent(new CustomEvent("fluid-open", { bubbles: true, composed: true }));
      } else if (changed.get("open") === true) {
        this.dispatchEvent(new CustomEvent("fluid-close", { bubbles: true, composed: true }));
      }
    }
    this.applyRovingTabindex();
  }

  /** Mark slotted actions as menu items so the menu has valid children. */
  private applyActionRoles(): void {
    for (const action of this.getActions()) {
      if (!action.hasAttribute("role")) action.setAttribute("role", "menuitem");
    }
  }

  /** Roving tabindex: only the active action is tabbable while open. */
  private applyRovingTabindex(): void {
    const actions = this.getActions();
    actions.forEach((action, i) => {
      action.tabIndex = this.open && i === this.activeIndex ? 0 : -1;
    });
  }

  private isDisabled(el: HTMLElement): boolean {
    return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
  }

  private focusAction(index: number): void {
    const actions = this.getActions();
    const action = actions[index];
    if (!action) return;
    this.activeIndex = index;
    this.applyRovingTabindex();
    action.focus();
  }

  private moveActive(delta: number): void {
    const actions = this.getActions();
    if (!actions.length) return;
    let i = this.activeIndex < 0 ? (delta > 0 ? -1 : 0) : this.activeIndex;
    const visited = new Set<number>();
    do {
      i = (i + delta + actions.length) % actions.length;
      if (visited.has(i)) return;
      visited.add(i);
    } while (actions[i] && this.isDisabled(actions[i]!));
    this.focusAction(i);
  }

  private firstEnabled(): number {
    const actions = this.getActions();
    return actions.findIndex((a) => !this.isDisabled(a));
  }

  private lastEnabled(): number {
    const actions = this.getActions();
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i] && !this.isDisabled(actions[i]!)) return i;
    }
    return -1;
  }

  private openMenu(focusLast = false): void {
    this.open = true;
    // Defer focus until the menu items are interactive.
    void this.updateComplete.then(() => {
      const index = focusLast ? this.lastEnabled() : this.firstEnabled();
      if (index >= 0) this.focusAction(index);
    });
  }

  private closeMenu(returnFocus = true): void {
    if (!this.open) return;
    this.open = false;
    this.activeIndex = -1;
    if (returnFocus) {
      void this.updateComplete.then(() => this.triggerEl?.focus());
    }
  }

  /** Open along the dial's main axis (Down/Right for forward placements). */
  private get openKey(): string {
    switch (this.placement) {
      case "up":
        return "ArrowUp";
      case "down":
        return "ArrowDown";
      case "left":
        return "ArrowLeft";
      case "right":
        return "ArrowRight";
    }
  }

  private handleTriggerClick = () => {
    if (this.open) this.closeMenu(false);
    else this.openMenu();
  };

  private handleTriggerKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (this.open) this.closeMenu();
        else this.openMenu();
        return;
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        this.openMenu(false);
        return;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        // Opening "backwards" focuses the last item, matching the APG note.
        this.openMenu(true);
        return;
      case "Escape":
        if (this.open) {
          e.preventDefault();
          this.closeMenu();
        }
        return;
    }
  };

  /** Whether the dial's actions sit along a vertical (up/down) axis. */
  private get isVertical(): boolean {
    return this.placement === "up" || this.placement === "down";
  }

  /** Forward direction for the active axis (down/right => +1, up/left visually reversed). */
  private get forwardKey(): string {
    return this.isVertical ? "ArrowDown" : "ArrowRight";
  }

  private get backwardKey(): string {
    return this.isVertical ? "ArrowUp" : "ArrowLeft";
  }

  private handleMenuKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case this.forwardKey:
        e.preventDefault();
        this.moveActive(1);
        return;
      case this.backwardKey:
        e.preventDefault();
        this.moveActive(-1);
        return;
      case "Home":
        e.preventDefault();
        this.focusAction(this.firstEnabled());
        return;
      case "End":
        e.preventDefault();
        this.focusAction(this.lastEnabled());
        return;
      case "Escape":
        e.preventDefault();
        this.closeMenu();
        return;
      case "Tab":
        // Tabbing out of the menu closes the dial without stealing focus.
        this.closeMenu(false);
        return;
      case "Enter":
      case " ": {
        const actions = this.getActions();
        const active = actions[this.activeIndex];
        if (active && !this.isDisabled(active)) {
          e.preventDefault();
          this.activateAction(active);
        }
        return;
      }
    }
  };

  private handleMenuClick = (e: Event) => {
    const action = this.getActions().find((a) => e.composedPath().includes(a));
    if (!action || this.isDisabled(action)) return;
    this.activateAction(action);
  };

  private activateAction(action: HTMLElement): void {
    this.dispatchEvent(
      new CustomEvent("fluid-action", {
        detail: { action },
        bubbles: true,
        composed: true
      })
    );
    this.closeMenu();
  }

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    if (e.composedPath().includes(this)) return;
    this.closeMenu(false);
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <button
          part="trigger"
          class="trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${ifDefined(this.open ? this.menuId : undefined)}
          aria-label=${this.label}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeyDown}
        >
          <span class="trigger-icon">
            <slot name="trigger-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </slot>
          </span>
        </button>
        <div
          part="menu"
          class=${classMap({ menu: true })}
          id=${this.menuId}
          role="menu"
          aria-label=${this.label}
          @click=${this.handleMenuClick}
          @keydown=${this.handleMenuKeyDown}
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}
