import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { autoUpdate, computePosition, flip, offset, size } from "@floating-ui/dom";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";

// Ensure chevron-down is available even without the defaults bundle.
registerIcon(
  "chevron-down",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`
);

export type FluidSelectSize = "sm" | "md" | "lg";

type FluidOptionElement = HTMLElement & {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  active: boolean;
};

let counter = 0;

/**
 * A single-select dropdown.
 *
 * Uses the WAI-ARIA combobox + listbox pattern. Form-associated.
 *
 * @summary Pick one value from a list of `<fluid-option>` children.
 *
 * @slot - One or more `<fluid-option>` elements.
 *
 * @csspart base - The outer wrapper.
 * @csspart trigger - The combobox trigger button.
 * @csspart listbox - The popover listbox.
 *
 * Every styled property reads a component-scoped `--fluid-select-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-select-bg - Trigger + listbox background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-select-fg - Trigger label color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-select-border - Default border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-select-border-hover - Border on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-select-border-focus - Border when focused/open. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-select-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-select-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-select-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-select-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-select-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-select-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 *
 * @uses-token --fluid-surface-base - Trigger + listbox background.
 * @uses-token --fluid-border-default - Default border.
 * @uses-token --fluid-border-strong - Border on hover + scrollbar thumb.
 * @uses-token --fluid-accent-base - Border + focus ring when focused.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum trigger height floor (24px AA / 44px AAA).
 * @uses-token --fluid-text-primary - Trigger label color.
 * @uses-token --fluid-text-secondary - Placeholder text color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-sm - Trigger height at size="sm".
 * @uses-token --fluid-field-height-md - Trigger height at size="md".
 * @uses-token --fluid-field-height-lg - Trigger height at size="lg".
 * @uses-token --fluid-field-padding-x-md - Trigger inline padding.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Listbox elevation.
 * @uses-token --fluid-radius-md - Listbox corner radius.
 * @uses-token --fluid-duration-fast - Transition duration.
 * @uses-token --fluid-easing-standard - Transition easing.
 *
 * @fires fluid-change - Fired when the selected value changes. `event.detail.value`.
 */
export class FluidSelect extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
      max-width: 100%;
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-space-2);
      width: 100%;
      background: var(--fluid-select-bg, var(--fluid-surface-base));
      border: var(--fluid-select-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-select-border, var(--fluid-border-default));
      border-radius: var(--fluid-select-radius, var(--fluid-field-border-radius));
      font-family: var(--fluid-select-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-select-fg, var(--fluid-text-primary));
      cursor: pointer;
      text-align: left;
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .trigger:hover:not(.disabled) {
      border-color: var(--fluid-select-border-hover, var(--fluid-border-strong));
    }

    .trigger.focused {
      border-color: var(--fluid-select-border-focus, var(--fluid-accent-base));
      box-shadow: 0 0 0
        var(--fluid-select-focus-ring-width, var(--fluid-focus-ring-width))
        var(--fluid-select-focus-ring, var(--fluid-focus-ring-color));
      outline: none;
    }

    /*
     * Drop the focus halo when fused, the strong accent border on the
     * combined trigger+listbox shape signals focus by itself. A leftover halo
     * around the trigger alone reads as a visual gap before the listbox.
     */
    :host([open]) .trigger.focused {
      box-shadow: none;
    }

    .trigger.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* min-height reads --fluid-target-min as a floor so AAA lifts the trigger
       to a 44px target (SC 2.5.5) while AA keeps the design heights. */
    .size-sm {
      padding: 0 var(--fluid-field-padding-x-sm);
      font-size: var(--fluid-font-size-sm);
      min-height: max(var(--fluid-field-height-sm, 1.75rem), var(--fluid-target-min, 0px));
    }
    .size-md {
      padding: 0 var(--fluid-field-padding-x-md);
      font-size: var(--fluid-font-size-md);
      min-height: max(var(--fluid-field-height-md, 2.25rem), var(--fluid-target-min, 0px));
    }
    .size-lg {
      padding: 0 var(--fluid-field-padding-x-lg);
      font-size: var(--fluid-font-size-lg);
      min-height: max(var(--fluid-field-height-lg, 2.75rem), var(--fluid-target-min, 0px));
    }

    .label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label.placeholder {
      color: var(--fluid-select-placeholder-fg, var(--fluid-text-secondary));
    }

    .chevron {
      flex-shrink: 0;
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host([open]) .chevron {
      transform: rotate(180deg);
    }

    /*
     * Fused-dropdown look: when open, the listbox visually extends out of the
     * trigger as one shape, flat meeting edge, continuous border. The trigger
     * keeps the bordering line at the seam; the listbox drops its matching
     * side so we don't get a double-stroke.
     *
     * position: fixed lets the listbox escape ancestor clipping (cards,
     * modals, anywhere with overflow: hidden). Floating-ui's strategy is set
     * to "fixed" to match, see reposition().
     */
    .listbox {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      box-sizing: border-box;
      max-height: 18rem;
      /*
       * overflow: hidden auto, never show a horizontal scrollbar, only a
       * vertical one when content actually overflows max-height. Setting
       * just overflow-y: auto causes the UA to compute overflow-x as
       * auto too (per spec), which produces a spurious horizontal
       * scrollbar at the bottom of the dropdown whenever sub-pixel rounding
       * or option content nudges past the listbox width by even 1px.
       */
      overflow: hidden auto;
      /* Styled vertical scrollbar so the rare overflow case still feels
         designed instead of dropping back to the OS default. */
      scrollbar-width: thin;
      scrollbar-color: var(--fluid-border-strong, color-mix(in srgb, currentColor 25%, transparent))
        transparent;
      background: var(--fluid-select-bg, var(--fluid-surface-base));
      border: var(--fluid-select-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-select-border, var(--fluid-border-default));
      border-radius: var(--fluid-select-radius, var(--fluid-field-border-radius));
      box-shadow: var(--fluid-shadow-lg);
      padding: var(--fluid-space-1);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        visibility 0s var(--fluid-duration-fast);
    }
    .listbox::-webkit-scrollbar {
      width: 8px;
    }
    .listbox::-webkit-scrollbar-track {
      background: transparent;
    }
    .listbox::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, currentColor 22%, transparent);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .listbox::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, currentColor 36%, transparent);
      background-clip: padding-box;
    }

    :host([open]) .listbox {
      opacity: 1;
      visibility: visible;
      transition-delay: 0s;
      /* Match the trigger's focused outline so the whole expanded shape
         reads as one focus state. */
      border-color: var(--fluid-select-border-focus, var(--fluid-accent-base));
    }

    /* Below-placement: trigger keeps its top corners + border, drops bottom
       corners; listbox keeps its bottom corners + border, drops top corners
       and its top border so the seam is a single stroke. */
    :host([open][data-placement="bottom"]) .trigger {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    :host([open][data-placement="bottom"]) .listbox {
      border-top: 0;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    /* Above-placement (viewport-edge flip): mirror. */
    :host([open][data-placement="top"]) .trigger {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    :host([open][data-placement="top"]) .listbox {
      border-bottom: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  `;

  @query(".trigger") private triggerEl!: HTMLButtonElement;
  @query(".listbox") private listboxEl!: HTMLElement;

  /** Selected value. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Size. */
  @property({ reflect: true }) size: FluidSelectSize = "md";

  /** Placeholder shown when no value is selected. */
  @property() placeholder = "Select…";

  /** Whether the listbox is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;
  @state() private activeIndex = -1;

  private listboxId = `fluid-listbox-${++counter}`;
  private cleanupAutoUpdate?: () => void;
  private typeaheadBuffer = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
    this.cleanupAutoUpdate?.();
    clearTimeout(this.typeaheadTimer);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.applySelection();
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.triggerEl?.focus(options);
  }

  /** Get all option children, regardless of slot. */
  private getOptions(): FluidOptionElement[] {
    return Array.from(
      this.querySelectorAll<FluidOptionElement>("fluid-option")
    );
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
      this.applySelection();
    }
    if (changed.has("required") || changed.has("value")) {
      if (this.required && !this.value) {
        this.setValidity({ valueMissing: true }, "Please choose an option.");
      } else {
        this.setValidity({});
      }
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.openListbox();
      else this.closeListbox();
    }
    this.applyActive();
  }

  private applySelection(): void {
    const options = this.getOptions();
    for (const opt of options) {
      opt.selected = opt.value === this.value;
    }
  }

  private applyActive(): void {
    const options = this.getOptions();
    options.forEach((opt, i) => (opt.active = i === this.activeIndex));
  }

  private handleSlotChange = () => {
    this.applySelection();
    if (!this.value) {
      const firstSelected = this.getOptions().find((o) => o.hasAttribute("selected"));
      if (firstSelected) this.value = firstSelected.value;
    }
  };

  private async openListbox(): Promise<void> {
    if (!this.triggerEl || !this.listboxEl) return;
    // Only seed the active index if nothing has set it (e.g. typeahead during
    // the same keystroke that opened the listbox).
    if (this.activeIndex < 0) {
      const selectedIndex = this.getOptions().findIndex((o) => o.value === this.value);
      this.activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    }
    this.applyActive();
    this.cleanupAutoUpdate = autoUpdate(this.triggerEl, this.listboxEl, () =>
      this.reposition()
    );
    await this.reposition();
    this.scrollActiveIntoView();
  }

  private closeListbox(): void {
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;
    this.activeIndex = -1;
    this.applyActive();
    this.removeAttribute("data-placement");
  }

  private async reposition(): Promise<void> {
    if (!this.triggerEl || !this.listboxEl) return;
    const { x, y, placement } = await computePosition(this.triggerEl, this.listboxEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [
        // No gap, listbox sits flush against the trigger to read as one shape.
        offset(0),
        // Use the viewport as the boundary so cards/modals with overflow:hidden
        // don't force an unnecessary flip. Only flip when we'd truly go off-screen.
        flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }),
        size({
          apply: ({ rects, elements, availableHeight }) => {
            // `minWidth`, not `width`: the listbox should be at least as
            // wide as the trigger so the fused shape's left/right edges
            // line up, but grow if an option's label is wider than the
            // trigger (the way native <select> dropdowns behave). Pinning
            // to exactly the trigger's width clipped longer options and
            // forced a horizontal scrollbar to appear at the bottom.
            elements.floating.style.minWidth = `${rects.reference.width}px`;
            // Cap height to the available space below/above the trigger
            // so the listbox never spills past the viewport edge.
            elements.floating.style.maxHeight = `${Math.min(availableHeight, 288)}px`;
          }
        })
      ]
    });
    // Keep floating-ui's subpixel coords, trigger + listbox share the same
    // subpixel offset, so they line up. Rounding picks a different pixel
    // grid than the trigger and shifts the listbox half a pixel sideways.
    Object.assign(this.listboxEl.style, {
      left: `${x}px`,
      top: `${y}px`
    });
    // Reflect the (post-flip) placement so the CSS can fuse trigger + listbox
    // into one shape with continuous borders.
    this.setAttribute("data-placement", placement.startsWith("top") ? "top" : "bottom");
  }

  private scrollActiveIntoView(): void {
    const options = this.getOptions();
    options[this.activeIndex]?.scrollIntoView({ block: "nearest" });
  }

  private moveActive(delta: number): void {
    const options = this.getOptions();
    if (!options.length) return;
    let i = this.activeIndex;
    const visit = new Set<number>();
    do {
      i = (i + delta + options.length) % options.length;
      if (visit.has(i)) return;
      visit.add(i);
    } while (options[i]?.disabled);
    this.activeIndex = i;
    this.applyActive();
    this.scrollActiveIntoView();
  }

  private setActiveToFirst(): void {
    const options = this.getOptions();
    const first = options.findIndex((o) => !o.disabled);
    if (first >= 0) {
      this.activeIndex = first;
      this.applyActive();
      this.scrollActiveIntoView();
    }
  }

  private setActiveToLast(): void {
    const options = this.getOptions();
    for (let i = options.length - 1; i >= 0; i--) {
      if (!options[i]!.disabled) {
        this.activeIndex = i;
        this.applyActive();
        this.scrollActiveIntoView();
        return;
      }
    }
  }

  private selectActive(): void {
    const options = this.getOptions();
    const opt = options[this.activeIndex];
    if (!opt || opt.disabled) return;
    this.value = opt.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private typeahead(char: string): void {
    this.typeaheadBuffer += char.toLowerCase();
    clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeaheadBuffer = ""), 500);
    const options = this.getOptions();
    const match = options.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(this.typeaheadBuffer)
    );
    if (match >= 0) {
      this.activeIndex = match;
      this.applyActive();
      this.scrollActiveIntoView();
    }
  }

  private handleTriggerKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    switch (e.key) {
      case " ":
      case "Enter":
        e.preventDefault();
        if (!this.open) this.open = true;
        else this.selectActive();
        return;
      case "ArrowDown":
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        } else {
          this.moveActive(1);
        }
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          this.setActiveToLast();
        } else {
          this.moveActive(-1);
        }
        return;
      case "Home":
        if (this.open) {
          e.preventDefault();
          this.setActiveToFirst();
        }
        return;
      case "End":
        if (this.open) {
          e.preventDefault();
          this.setActiveToLast();
        }
        return;
      case "Escape":
        if (this.open) {
          e.preventDefault();
          this.open = false;
        }
        return;
      case "Tab":
        if (this.open) this.open = false;
        return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      this.typeahead(e.key);
      if (!this.open) this.open = true;
    }
  };

  private handleTriggerClick = () => {
    if (this.disabled) return;
    this.open = !this.open;
  };

  private handleOptionClick = (e: Event) => {
    const opt = (e.target as HTMLElement).closest("fluid-option") as FluidOptionElement | null;
    if (!opt || opt.disabled) return;
    this.value = opt.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleOptionHover = (e: Event) => {
    const opt = (e.target as HTMLElement).closest("fluid-option") as FluidOptionElement | null;
    if (!opt) return;
    const idx = this.getOptions().indexOf(opt);
    if (idx >= 0) {
      this.activeIndex = idx;
      this.applyActive();
    }
  };

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    if (path.includes(this)) return;
    this.open = false;
  };

  private get selectedLabel(): string | undefined {
    return this.getOptions().find((o) => o.value === this.value)?.label;
  }

  private get activeId(): string | undefined {
    const opt = this.getOptions()[this.activeIndex];
    return opt?.id;
  }

  override render(): TemplateResult {
    const label = this.selectedLabel;
    return html`
      <div part="base" style="position:relative; width:100%;">
        <button
          part="trigger"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this.listboxId}
          aria-activedescendant=${ifDefined(this.open ? this.activeId : undefined)}
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          ?disabled=${this.disabled}
          class=${classMap({
            trigger: true,
            [`size-${this.size}`]: true,
            focused: this.focused,
            disabled: this.disabled
          })}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeyDown}
          @focus=${() => (this.focused = true)}
          @blur=${() => (this.focused = false)}
        >
          <span class=${classMap({ label: true, placeholder: !label })}>
            ${label ?? this.placeholder}
          </span>
          <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
        </button>
        <div
          part="listbox"
          class="listbox"
          id=${this.listboxId}
          role="listbox"
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          @click=${this.handleOptionClick}
          @pointermove=${this.handleOptionHover}
        >
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
