import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";
import type { FluidTab } from "./fluid-tab.js";
import type { FluidTabPanel } from "./fluid-tab-panel.js";

export type FluidTabsActivation = "auto" | "manual";

/**
 * A tabbed interface. Owns the active-panel state and the tablist keyboard model.
 *
 * Children:
 *  - `<fluid-tab panel="name">` in the `nav` slot
 *  - `<fluid-tab-panel name="name">` in the default slot
 *
 * @summary Container for tabs and tab panels.
 *
 * @slot nav - One or more `<fluid-tab>` elements.
 * @slot - One or more `<fluid-tab-panel>` elements.
 *
 * @csspart base - The outer wrapper.
 * @csspart nav - The tab strip container.
 * @csspart panels - The panels container.
 *
 * @cssproperty --fluid-tabs-nav-border - Bottom border color under the tab strip. Falls back to --fluid-border-default.
 * @cssproperty --fluid-tabs-nav-border-width - Bottom border width under the tab strip. Falls back to 1px.
 * @cssproperty --fluid-tabs-gap - Gap between tabs. Falls back to --fluid-space-1.
 * @cssproperty --fluid-tabs-indicator-color - The sliding active-tab underline color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-tabs-indicator-size - Underline thickness. Falls back to 2px.
 * @cssproperty [--fluid-tabs-indicator-duration=var(--fluid-duration-normal)] - Underline slide duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-tabs-indicator-easing=var(--fluid-easing-emphasized)] - Underline slide easing.
 *
 * @csspart indicator - The sliding underline under the active tab.
 *
 * @uses-token --fluid-border-default - Bottom border under the tab strip.
 * @uses-token --fluid-accent-base - Default active-tab underline color.
 * @uses-token --fluid-space-1 - Default gap between tabs.
 *
 * @fires fluid-change - Fired when the active panel changes. `event.detail.value`.
 */
export class FluidTabs extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
      }

      .nav {
        position: relative;
        display: flex;
        gap: var(--fluid-tabs-gap, var(--fluid-space-1));
        border-bottom: var(--fluid-tabs-nav-border-width, 1px) solid
          var(--fluid-tabs-nav-border, var(--fluid-border-default));
        overflow-x: auto;
      }

      /* Sliding active-tab underline, measured over the selected tab. */
      .indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: var(--fluid-tabs-indicator-size, 2px);
        width: var(--_w, 0);
        transform: translateX(var(--_x, 0));
        background: var(--fluid-tabs-indicator-color, var(--fluid-accent-base));
        border-radius: var(--fluid-tabs-indicator-size, 2px);
        opacity: 0;
        pointer-events: none;
        transition:
          transform
            calc(
              var(--fluid-tabs-indicator-duration, var(--fluid-duration-normal)) *
                var(--fluid-motion, 1)
            )
            var(--fluid-tabs-indicator-easing, var(--fluid-easing-emphasized)),
          width
            calc(
              var(--fluid-tabs-indicator-duration, var(--fluid-duration-normal)) *
                var(--fluid-motion, 1)
            )
            var(--fluid-tabs-indicator-easing, var(--fluid-easing-emphasized));
      }
      .indicator.ready {
        opacity: 1;
      }
      .indicator.no-anim {
        transition: none;
      }
    `
  ];

  /** Name of the currently active panel. */
  @property() value = "";

  /**
   * "auto" (default) activates a tab as soon as it's focused via keyboard.
   * "manual" requires Enter/Space to activate.
   */
  @property() activation: FluidTabsActivation = "auto";

  @query(".nav") private navEl!: HTMLElement;
  @query(".indicator") private indicatorEl!: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private tabObserver?: MutationObserver;
  /**
   * True once the value change originates from user interaction (click /
   * keyboard) or an explicit external `value` set, as opposed to the initial
   * auto-select in firstUpdated(). Guards the `fluid-change` dispatch so an
   * uncontrolled <fluid-tabs> doesn't emit on mount.
   */
  private hasInteracted = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(this, "keydown", this.handleKeyDown);
    if (typeof MutationObserver !== "undefined") {
      this.tabObserver?.disconnect();
      this.tabObserver = new MutationObserver(() => this.syncSelection());
      this.tabObserver.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "name", "panel"]
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.tabObserver?.disconnect();
  }

  protected override willUpdate(): void {
    // Initial fallback selection belongs before rendering. Assigning `value`
    // from firstUpdated schedules a second host update and emits Lit's
    // change-in-update warning even though no public change event is intended.
    this.recoverSelection(this.getTabs(), this.getPanels());
  }

  protected override firstUpdated(): void {
    this.syncSelection();
    requestAnimationFrame(() => this.positionIndicator(false));
    this.resizeObserver = new ResizeObserver(() => this.positionIndicator(false));
    this.resizeObserver.observe(this);
    // Keep the underline aligned while the tab strip scrolls horizontally.
    if (this.navEl)
      this.listen(this.navEl, "scroll", () => this.positionIndicator(false), {
        passive: true
      });
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncSelection();
      this.positionIndicator(true);
      // Don't emit for the initial auto-select in firstUpdated(); only after a
      // user interaction or an explicit value change has occurred.
      if (this.hasInteracted) {
        this.dispatchEvent(
          new CustomEvent("fluid-change", {
            detail: { value: this.value },
            bubbles: true,
            composed: true
          })
        );
      }
    }
  }

  /**
   * Slide the underline under the active tab. Measured with
   * getBoundingClientRect (crosses the shadow boundary) + the nav's scrollLeft
   * so it stays aligned when the strip scrolls. `animate=false` snaps without a
   * transition (first paint / resize / scroll).
   */
  private positionIndicator(animate: boolean): void {
    const nav = this.navEl;
    const indicator = this.indicatorEl;
    if (!nav || !indicator) return;
    const tab = this.getTabs().find((t) => t.panel === this.value);
    if (!tab) {
      indicator.classList.remove("ready");
      return;
    }
    const n = nav.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (!animate) indicator.classList.add("no-anim");
    indicator.style.setProperty("--_x", `${t.left - n.left + nav.scrollLeft}px`);
    indicator.style.setProperty("--_w", `${t.width}px`);
    indicator.classList.add("ready");
    if (!animate) {
      void indicator.offsetWidth;
      requestAnimationFrame(() => indicator.classList.remove("no-anim"));
    }
  }

  private getTabs(): FluidTab[] {
    if (typeof this.querySelectorAll !== "function") return [];
    return Array.from(this.querySelectorAll("fluid-tab")) as FluidTab[];
  }

  private getPanels(): FluidTabPanel[] {
    if (typeof this.querySelectorAll !== "function") return [];
    return Array.from(this.querySelectorAll("fluid-tab-panel")) as FluidTabPanel[];
  }

  private syncSelection(): void {
    const tabs = this.getTabs();
    const panels = this.getPanels();
    this.recoverSelection(tabs, panels);
    for (const tab of tabs) {
      tab.selected = tab.panel === this.value;
      const panel = panels.find((p) => p.name === tab.panel);
      if (panel) {
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", tab.id);
      }
    }
    for (const panel of panels) {
      panel.active = panel.name === this.value;
    }
  }

  private recoverSelection(tabs: FluidTab[], panels: FluidTabPanel[]): void {
    const available = tabs.filter((tab) => panels.some((panel) => panel.name === tab.panel));
    const selected = available.find((tab) => tab.panel === this.value);
    if ((!selected || selected.disabled) && available.length) {
      const first = available.find((tab) => !tab.disabled);
      if (first) this.value = first.panel;
    }
  }

  private handleNavClick = (e: Event) => {
    const tab = (e.target as HTMLElement).closest("fluid-tab") as FluidTab | null;
    if (!tab || tab.disabled) return;
    this.hasInteracted = true;
    this.value = tab.panel;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const tabs = this.getTabs().filter((t) => !t.disabled);
    if (!tabs.length) return;
    // Only tab-originated keys belong to this widget. Panel inputs retain their
    // native arrow behavior. The composed path also works inside outer shadows.
    const currentIndex = tabs.findIndex((tab) => e.composedPath().includes(tab));
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    switch (e.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + (this.isRtl ? -1 : 1) + tabs.length) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex + (this.isRtl ? 1 : -1) + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (this.activation === "manual") {
          const focused = tabs[currentIndex];
          if (focused) {
            this.hasInteracted = true;
            this.value = focused.panel;
          }
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    // Manual activation separates selection from focus. Keep exactly one tab
    // stop at the focused tab while arrows leave aria-selected unchanged.
    for (const tab of this.getTabs()) tab.tabIndex = tab === tabs[nextIndex] ? 0 : -1;
    tabs[nextIndex]?.focus();
    if (this.activation === "auto") {
      this.hasInteracted = true;
      this.value = tabs[nextIndex]!.panel;
    }
  };

  private handleSlotChange = () => this.syncSelection();

  override render(): TemplateResult {
    return html`
      <div part="base">
        <div part="nav" class="nav" role="tablist" @click=${this.handleNavClick}>
          <slot name="nav" @slotchange=${this.handleSlotChange}></slot>
          <div class="indicator no-anim" part="indicator" aria-hidden="true"></div>
        </div>
        <div part="panels">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
