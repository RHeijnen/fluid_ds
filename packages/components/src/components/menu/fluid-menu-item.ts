import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { reducedMotion } from "../../internal/motion.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * A single actionable item inside a `<fluid-menu>`.
 *
 * Authored as a light-DOM child of the menu:
 *
 * ```html
 * <fluid-menu>
 *   <fluid-menu-item value="copy">Copy</fluid-menu-item>
 * </fluid-menu>
 * ```
 *
 * The host carries `role="menuitem"`. The parent menu owns the roving tabindex,
 * arrow-key navigation, and type-ahead; the item only renders, reflects its
 * `active` / `disabled` state, and fires its own `fluid-select` on activation
 * (so consumers can listen on either the item or the menu).
 *
 * @summary One action in a menu surface.
 *
 * @slot - The visible label.
 * @slot icon - A leading icon (e.g. `<fluid-icon>`), rendered before the label.
 *
 * @csspart base - The item row.
 * @csspart icon - The leading icon wrapper.
 * @csspart label - The label text wrapper.
 *
 * Every styled property reads a component-scoped `--fluid-menu-item-*` token
 * that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-menu-item-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-menu-item-radius - Row corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-menu-item-padding - Row padding (shorthand). Falls back to --fluid-space-2 --fluid-space-3.
 * @cssproperty --fluid-menu-item-active-bg - Active (hover/keyboard) background. Falls back to a tint of --fluid-accent-base.
 * @cssproperty --fluid-menu-item-active-fg - Active text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-menu-item-accent - Accent used for the active rail. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-menu-item-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 *
 * @uses-token --fluid-text-primary - Text color.
 * @uses-token --fluid-accent-base - Active tint + rail.
 * @uses-token --fluid-radius-sm - Row corner radius.
 * @uses-token --fluid-space-2 - Row vertical padding.
 * @uses-token --fluid-space-3 - Row horizontal padding.
 * @uses-token --fluid-font-family-sans - Font family.
 * @uses-token --fluid-font-size-md - Font size.
 * @uses-token --fluid-target-min - Minimum row height floor (24px AA / 44px AAA).
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width.
 * @uses-token --fluid-duration-fast - Transition duration.
 * @uses-token --fluid-easing-standard - Transition easing.
 *
 * @fires fluid-select - Fired when the item is activated (click, Enter, Space).
 *   `event.detail.value` carries the item's `value`. Bubbles and is composed.
 */
export class FluidMenuItem extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        outline: none;
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: var(--fluid-space-2);
        /* min-height reads --fluid-target-min as a floor so AAA lifts the row
           to a 44px target (SC 2.5.5) while AA keeps the design height. */
        min-height: max(2rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-menu-item-padding, var(--fluid-space-2) var(--fluid-space-3));
        font-family: var(--fluid-font-family-sans);
        font-size: var(--fluid-font-size-md);
        color: var(--fluid-menu-item-fg, var(--fluid-text-primary));
        border-radius: var(--fluid-menu-item-radius, var(--fluid-radius-sm));
        cursor: pointer;
        user-select: none;
        position: relative;
        white-space: nowrap;
        transition:
          background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
          color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      /* Active = hover or keyboard-focused. Accent-tinted background plus a 2px
         accent rail on the left, matching the option styling for consistency. */
      :host([active]) .base {
        background: var(
          --fluid-menu-item-active-bg,
          color-mix(in srgb, var(--fluid-menu-item-accent, var(--fluid-accent-base)) 10%, transparent)
        );
        color: var(--fluid-menu-item-active-fg, var(--fluid-text-primary));
      }
      :host([active]) .base::before {
        content: "";
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--fluid-menu-item-accent, var(--fluid-accent-base));
        border-radius: var(--fluid-radius-full);
      }

      /* The menu manages roving focus by calling .focus() on the host; show a
         ring when the host is focused so keyboard users always see the target. */
      :host(:focus-visible) .base {
        outline: var(--fluid-focus-ring-width, 2px) solid
          var(--fluid-menu-item-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: -2px;
      }

      :host([disabled]) .base {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .icon {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
      }

      slot[name="icon"]::slotted(*) {
        width: 1em;
        height: 1em;
      }
    `
  ];

  /** Value carried by `fluid-select` when this item is activated. */
  @property({ reflect: true }) value = "";

  /** Whether this item is the currently highlighted (keyboard/hover) item. */
  @property({ type: Boolean, reflect: true }) active = false;

  /** Whether this item is disabled. Disabled items are skipped by the menu. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "menuitem");
    if (!this.id) this.id = `fluid-menu-item-${++counter}`;
    if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
    this.addEventListener("click", this.handleClick);
    this.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("keydown", this.handleKeyDown);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
      // Keep a disabled item out of the tab order entirely.
      if (this.disabled) this.tabIndex = -1;
    }
  }

  private fire(): void {
    if (this.disabled) return;
    // A single bubbling, composed fluid-select. Because it bubbles, a listener
    // on the parent <fluid-menu> receives it too, no re-dispatch needed.
    this.dispatchEvent(
      new CustomEvent("fluid-select", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleClick = (e: Event) => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.fire();
  };

  // Enter/Space activate from the item itself, so the focused menuitem owns its
  // activation (and an item still works when used outside a <fluid-menu>). The
  // menu deliberately does not re-handle these keys, avoiding a double dispatch.
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.fire();
    }
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <span part="icon" class="icon"><slot name="icon"></slot></span>
        <span part="label" class="label"><slot></slot></span>
      </div>
    `;
  }
}
