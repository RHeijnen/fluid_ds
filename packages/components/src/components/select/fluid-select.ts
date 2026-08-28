import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { autoUpdate, computePosition, flip, offset, size } from "../../internal/position.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { FormDisabledController } from "../../internal/form-disabled.js";
import {
  fieldChromeStyles,
  fieldHelpDescribedBy,
  renderFieldChrome
} from "../../internal/field-chrome.js";
import { hideFromTopLayer, showInTopLayer } from "../../internal/top-layer.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons/registry";

// Ensure chevron-down is available even without the defaults bundle.
registerIcon(
  "chevron-down",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`
);

export type FluidSelectSize = "sm" | "md" | "lg";

export interface FluidSelectValueDetail {
  value: string;
}
export type FluidSelectChangeEvent = CustomEvent<FluidSelectValueDetail>;

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
 * @slot prefix - Content rendered before the selected value, such as an icon or currency.
 * @slot suffix - Content rendered after the selected value and before the chevron.
 *
 *
 * A visible label and help text can be attached directly with the `label` and
 * `help-text` attributes; the label is a real `<label for>` inside the shadow
 * root and the help text is announced via `aria-describedby`. For rich label
 * content, error messages, or a required indicator, wrap the control in
 * `fluid-field` instead.
 *
 * @csspart label - The visible label (present only when `label` is set).
 * @csspart help-text - The help text (present only when `help-text` is set).
 * @csspart base - The outer wrapper.
 * @csspart trigger - The combobox trigger button.
 * @csspart prefix - The prefix affix box (present only when the prefix slot is filled).
 * @csspart suffix - The suffix affix box (present only when the suffix slot is filled).
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
 * @cssproperty --fluid-select-font-size-sm - Small text size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-select-font-size-md - Medium text size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-select-font-size-lg - Large text size. Falls back to --fluid-font-size-lg.
 * @cssproperty --fluid-select-height-sm - Small trigger height. Falls back to --fluid-field-height-sm.
 * @cssproperty --fluid-select-height-md - Medium trigger height. Falls back to --fluid-field-height-md.
 * @cssproperty --fluid-select-height-lg - Large trigger height. Falls back to --fluid-field-height-lg.
 * @cssproperty --fluid-select-padding-x-sm - Small inline padding. Falls back to --fluid-field-padding-x-sm.
 * @cssproperty --fluid-select-padding-x-md - Medium inline padding. Falls back to --fluid-field-padding-x-md.
 * @cssproperty --fluid-select-padding-x-lg - Large inline padding. Falls back to --fluid-field-padding-x-lg.
 * @cssproperty --fluid-select-gap - Gap between label and chevron. Falls back to --fluid-space-2.
 * @cssproperty --fluid-select-target-min - Minimum target-size floor. Falls back to --fluid-target-min.
 * @cssproperty --fluid-select-duration - Transition duration. Falls back to --fluid-duration-fast.
 * @cssproperty --fluid-select-easing - Transition easing. Falls back to --fluid-easing-standard.
 * @cssproperty --fluid-select-focus-ring-color - Focus ring color. Falls back to legacy --fluid-select-focus-ring, then --fluid-focus-ring-color.
 * @cssproperty --fluid-select-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-select-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-select-invalid-border - Invalid border. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-select-disabled-bg - Disabled background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-select-disabled-fg - Disabled foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-select-disabled-opacity - Disabled opacity. Defaults to 0.5.
 * @cssproperty --fluid-select-chevron-size - Chevron size. Defaults to 1em.
 * @cssproperty --fluid-select-chevron-fg - Chevron color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-select-affix-bg - Prefix/suffix background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-select-affix-fg - Prefix/suffix foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-select-affix-border - Prefix/suffix divider. Falls back to --fluid-border-default.
 * @cssproperty --fluid-select-listbox-shadow - Listbox elevation. Falls back to --fluid-shadow-lg.
 * @cssproperty --fluid-select-listbox-radius - Listbox radius. Falls back to --fluid-select-radius.
 * @cssproperty --fluid-select-listbox-padding - Listbox inner padding. Falls back to --fluid-space-1.
 * @cssproperty --fluid-select-listbox-max-height - Listbox maximum height. Defaults to 18rem.
 * @cssproperty --fluid-select-scrollbar-size - Scrollbar width. Defaults to 8px.
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
 * @fires {FluidSelectChangeEvent} fluid-change - Fired when the selected value changes. `event.detail.value`.
 * @cssproperty --fluid-select-border-strong - Component override for the corresponding semantic token.
 */
export class FluidSelect extends FluidFormAssociated {
  private readonly formDisabled = new FormDisabledController(this);
  static override shadowRootOptions: ShadowRootInit = {
    ...FluidFormAssociated.shadowRootOptions,
    delegatesFocus: true
  };

  static override styles = [
    fieldChromeStyles,
    css`
      :host {
        display: inline-flex;
        width: 100%;
        max-width: 100%;
      }

      .trigger {
        --_fluid-select-border-width: var(
          --fluid-select-border-width,
          var(--fluid-field-border-width, 1px)
        );
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        background: var(--fluid-select-bg, var(--fluid-surface-base));
        border: var(--_fluid-select-border-width) solid
          var(--fluid-select-border, var(--fluid-border-default));
        border-radius: var(--fluid-select-radius, var(--fluid-field-border-radius));
        font-family: var(--fluid-select-font-family, var(--fluid-font-family-sans));
        color: var(--fluid-select-fg, var(--fluid-text-primary));
        cursor: pointer;
        text-align: left;
        transition:
          border-color var(--fluid-select-duration, var(--fluid-duration-fast))
            var(--fluid-select-easing, var(--fluid-easing-standard)),
          box-shadow var(--fluid-select-duration, var(--fluid-duration-fast))
            var(--fluid-select-easing, var(--fluid-easing-standard));
      }

      .trigger:hover:not(.disabled) {
        border-color: var(--fluid-select-border-hover, var(--fluid-border-strong));
      }

      .trigger.focused {
        border-color: var(--fluid-select-border-focus, var(--fluid-accent-base));
        box-shadow: 0 0 0 var(--fluid-select-focus-ring-width, var(--fluid-focus-ring-width))
          var(
            --fluid-select-focus-ring-color,
            var(--fluid-select-focus-ring, var(--fluid-focus-ring-color))
          );
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
        background: var(--fluid-select-disabled-bg, var(--fluid-surface-subtle));
        color: var(--fluid-select-disabled-fg, var(--fluid-text-secondary));
        opacity: var(--fluid-select-disabled-opacity, 0.5);
        cursor: not-allowed;
      }

      .trigger.invalid {
        border-color: var(--fluid-select-invalid-border, var(--fluid-danger-base));
      }
      .trigger.invalid.focused {
        box-shadow: 0 0 0 var(--fluid-select-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(
            in srgb,
            var(--fluid-select-invalid-border, var(--fluid-danger-base)) 35%,
            transparent
          );
      }

      /*
       * Native buttons use border-box sizing. Add the two visible borders to
       * the shared field-height content token so Select has the same outer box
       * as Input: 38px at md/AA and 46px at the 44px AAA target floor.
       */
      .size-sm {
        font-size: var(--fluid-select-font-size-sm, var(--fluid-font-size-sm));
        min-height: calc(
          max(
              var(--fluid-select-height-sm, var(--fluid-field-height-sm, 1.75rem)),
              var(--fluid-select-target-min, var(--fluid-target-min, 0px))
            ) +
            var(--_fluid-select-border-width) + var(--_fluid-select-border-width)
        );
      }
      .size-md {
        font-size: var(--fluid-select-font-size-md, var(--fluid-font-size-md));
        min-height: calc(
          max(
              var(--fluid-select-height-md, var(--fluid-field-height-md, 2.25rem)),
              var(--fluid-select-target-min, var(--fluid-target-min, 0px))
            ) +
            var(--_fluid-select-border-width) + var(--_fluid-select-border-width)
        );
      }
      .size-lg {
        font-size: var(--fluid-select-font-size-lg, var(--fluid-font-size-lg));
        min-height: calc(
          max(
              var(--fluid-select-height-lg, var(--fluid-field-height-lg, 2.75rem)),
              var(--fluid-select-target-min, var(--fluid-target-min, 0px))
            ) +
            var(--_fluid-select-border-width) + var(--_fluid-select-border-width)
        );
      }

      .label {
        flex: 1 1 auto;
        min-width: 0;
        align-self: stretch;
        display: inline-flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .size-sm .label,
      .size-sm .affix:not(.flush) {
        padding-inline: var(--fluid-select-padding-x-sm, var(--fluid-field-padding-x-sm));
      }
      .size-md .label,
      .size-md .affix:not(.flush) {
        padding-inline: var(--fluid-select-padding-x-md, var(--fluid-field-padding-x-md));
      }
      .size-lg .label,
      .size-lg .affix:not(.flush) {
        padding-inline: var(--fluid-select-padding-x-lg, var(--fluid-field-padding-x-lg));
      }

      .affix {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        align-self: stretch;
        flex: 0 0 auto;
        color: var(--fluid-select-affix-fg, var(--fluid-text-secondary));
        background: var(--fluid-select-affix-bg, var(--fluid-surface-subtle));
      }
      .affix[hidden] {
        display: none;
      }
      .prefix {
        border-inline-end: var(--_fluid-select-border-width) solid
          var(--fluid-select-affix-border, var(--fluid-border-default));
      }
      .suffix {
        border-inline-start: var(--_fluid-select-border-width) solid
          var(--fluid-select-affix-border, var(--fluid-border-default));
      }
      .affix.flush {
        padding: 0;
        align-items: stretch;
      }
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        margin: 0;
      }

      .label.placeholder {
        color: var(--fluid-select-placeholder-fg, var(--fluid-text-secondary));
      }

      .chevron {
        flex-shrink: 0;
        width: var(--fluid-select-chevron-size, 1em);
        height: var(--fluid-select-chevron-size, 1em);
        margin-inline-end: var(--fluid-select-gap, var(--fluid-space-2));
        color: var(--fluid-select-chevron-fg, var(--fluid-text-secondary));
        transition: transform var(--fluid-select-duration, var(--fluid-duration-fast))
          var(--fluid-select-easing, var(--fluid-easing-standard));
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
     * The Popover API promotes the listbox to the browser top layer, which is
     * what actually lets it escape clipping cards, modals and transformed
     * containers. position:fixed + the positioning engine still own viewport placement
     * and provide a graceful fallback for browsers without Popover support.
     */
      .listbox {
        position: fixed;
        /* Reset the UA popover centring so the engine's coordinates win. */
        inset: auto;
        margin: 0;
        top: 0;
        left: 0;
        z-index: 1000;
        box-sizing: border-box;
        max-height: var(--fluid-select-listbox-max-height, 18rem);
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
        scrollbar-color: var(
            --fluid-select-border-strong,
            var(--fluid-border-strong, color-mix(in srgb, currentColor 25%, transparent))
          )
          transparent;
        background: var(--fluid-select-bg, var(--fluid-surface-base));
        border: var(--fluid-select-border-width, var(--fluid-field-border-width)) solid
          var(--fluid-select-border, var(--fluid-border-default));
        border-radius: var(
          --fluid-select-listbox-radius,
          var(--fluid-select-radius, var(--fluid-field-border-radius))
        );
        box-shadow: var(--fluid-select-listbox-shadow, var(--fluid-shadow-lg));
        padding: var(--fluid-select-listbox-padding, var(--fluid-space-1));
        opacity: 0;
        visibility: hidden;
        transition:
          opacity var(--fluid-select-duration, var(--fluid-duration-fast))
            var(--fluid-select-easing, var(--fluid-easing-standard)),
          visibility 0s var(--fluid-select-duration, var(--fluid-duration-fast));
      }
      .listbox::-webkit-scrollbar {
        width: var(--fluid-select-scrollbar-size, 8px);
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
    `
  ];

  @query(".trigger") private triggerEl!: HTMLButtonElement & {
    ariaActiveDescendantElement: Element | null;
  };
  @query(".listbox") private listboxEl!: HTMLElement;

  /** Selected value. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Size. */
  @property({ reflect: true }) size: FluidSelectSize = "md";

  /** Placeholder shown when no value is selected. */
  @property() placeholder = "";

  /** Whether the listbox is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /** Visible label rendered above the trigger (a real label/for association). */
  @property() label = "";

  /** Help text rendered below the trigger, announced via aria-describedby. */
  @property({ attribute: "help-text" }) helpText = "";

  @state() private focused = false;
  @state() private invalid = false;
  @state() private activeIndex = -1;
  @state() private hasPrefix = false;
  @state() private hasSuffix = false;
  @state() private prefixFlush = false;
  @state() private suffixFlush = false;

  private listboxId = `fluid-listbox-${++counter}`;
  private cleanupAutoUpdate?: () => void;
  private typeaheadBuffer = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;
  private optionValues = new Set<string>();
  private optionObserver?: MutationObserver;

  constructor() {
    super();
    this.addEventListener("invalid", this.handleInvalid);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.listen(document, "pointerdown", this.handleOutsideClick, { capture: true });
    this.optionObserver ??= new MutationObserver(() => this.reconcileOptions());
    this.optionObserver.observe(this, {
      attributes: true,
      attributeFilter: ["value", "disabled", "selected"],
      characterData: true,
      childList: true,
      subtree: true
    });
    this.reconcileOptions();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.optionObserver?.disconnect();
    this.cleanupAutoUpdate?.();
    hideFromTopLayer(this.listboxEl);
    clearTimeout(this.typeaheadTimer);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
    this.applySelection();
  }

  override formDisabledCallback(disabled: boolean): void {
    this.formDisabled.preserve(
      disabled,
      () => this.disabled,
      (value) => (this.disabled = value)
    );
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.triggerEl?.focus(options);
  }

  /** Get all option children, regardless of slot. */
  private getOptions(): FluidOptionElement[] {
    if (typeof this.querySelectorAll !== "function") return [];
    return Array.from(this.querySelectorAll<FluidOptionElement>("fluid-option"));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
      this.applySelection();
    }
    if (changed.has("open")) {
      // Derive active state before render. The post-render popup work should
      // position the existing DOM, not schedule another reactive update.
      if (!this.open) this.activeIndex = -1;
      else if (this.activeIndex < 0) {
        const options = this.getOptions();
        const selectedIndex = options.findIndex((o) => o.value === this.value && !o.disabled);
        this.activeIndex =
          selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled);
      }
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    // The native validation anchor exists only after the first render. Refresh
    // on inherited locale updates too, while preserving custom validity.
    this.refreshValidity();
    if (changed.has("open")) {
      if (this.open) this.openListbox();
      else this.closeListbox();
    }
    this.applyActive();
  }

  private refreshValidity(showInvalid = this.invalid): void {
    if (this.required && !this.value) {
      this.setValidity({ valueMissing: true }, this.term("pickAnOption"), this.triggerEl);
      this.invalid = showInvalid;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
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
    if (this.triggerEl) {
      // The options are slotted light-DOM elements. An IDREF on the shadow
      // button cannot resolve them; element reflection supports ancestor scope.
      const active = options[this.activeIndex];
      this.triggerEl.ariaActiveDescendantElement =
        this.open && active && !active.disabled ? active : null;
    }
  }

  private handleSlotChange = () => this.reconcileOptions();

  private reconcileOptions(): void {
    const options = this.getOptions();
    const selectedOptionWasRemoved =
      Boolean(this.value) &&
      this.optionValues.has(this.value) &&
      !options.some((option) => option.value === this.value);
    const selectedOptionBecameDisabled = options.some(
      (option) => option.value === this.value && option.disabled
    );

    this.applySelection();
    if (!this.value) {
      const firstSelected = options.find((option) => option.hasAttribute("selected"));
      if (firstSelected) this.value = firstSelected.value;
    } else if (selectedOptionWasRemoved || selectedOptionBecameDisabled) {
      this.value = options.find((option) => !option.disabled)?.value ?? "";
    }
    if (this.open && (this.activeIndex < 0 || options[this.activeIndex]?.disabled)) {
      this.activeIndex = options.findIndex((option) => !option.disabled);
    }
    this.applyActive();
    this.optionValues = new Set(options.map((option) => option.value));
    this.requestUpdate();
  }

  private async openListbox(): Promise<void> {
    if (!this.triggerEl || !this.listboxEl) return;
    this.applyActive();
    showInTopLayer(this.listboxEl);
    this.cleanupAutoUpdate = autoUpdate(this.triggerEl, this.listboxEl, () => this.reposition());
    await this.reposition();
    this.scrollActiveIntoView();
  }

  private closeListbox(): void {
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;
    hideFromTopLayer(this.listboxEl);
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
        // The viewport is the only boundary that matters: the listbox renders in
        // the top layer, so no ancestor can clip it. Naming
        // document.documentElement as the boundary measured overflow in
        // document coordinates while the reference was measured in viewport
        // ones, so a scrolled page kept the placement it would have had at
        // scroll zero: a control near the bottom of a long page opened
        // upwards even after being scrolled to the top of the screen.
        flip(),
        size({
          apply: ({ rects, elements, availableHeight }) => {
            // The trigger's width exactly, the way typeahead does it. Letting
            // the listbox grow to the longest label read as a second, unrelated
            // panel rather than the continuation of the trigger the borders are
            // drawn to suggest, and one long option among eighty was enough to
            // do it: the list widened past the trigger, that pushed it toward
            // the edge of the viewport, and flip answered by re-aligning it to
            // the right, so the two no longer even shared an edge.
            //
            // A label longer than the trigger truncates instead. That is what
            // the extra width was bought to avoid, but it costs one label its
            // tail rather than costing every list its shape, and the full text
            // is on the option's title.
            elements.floating.style.width = `${rects.reference.width}px`;
            // Cap height to the available space below/above the trigger
            // so the listbox never spills past the viewport edge.
            elements.floating.style.maxHeight = `${Math.min(availableHeight, 288)}px`;
          }
        })
      ]
    });
    // Keep the engine's subpixel coords, trigger + listbox share the same
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
      new CustomEvent<FluidSelectValueDetail>("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private typeahead(char: string): void {
    const key = char.toLowerCase();
    const repeated =
      this.typeaheadBuffer.length > 0 &&
      Array.from(this.typeaheadBuffer).every((buffered) => buffered === key);
    this.typeaheadBuffer = repeated ? key : this.typeaheadBuffer + key;
    clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeaheadBuffer = ""), 500);
    const options = this.getOptions();
    const start = repeated ? this.activeIndex + 1 : 0;
    let match = -1;
    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      const option = options[index]!;
      if (!option.disabled && option.label.toLowerCase().startsWith(this.typeaheadBuffer)) {
        match = index;
        break;
      }
    }
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

  private handleTriggerBlur = () => {
    this.focused = false;
    this.refreshValidity(true);
  };

  private handleInvalid = () => this.refreshValidity(true);

  private handleOptionClick = (e: Event) => {
    const opt = (e.target as HTMLElement).closest("fluid-option") as FluidOptionElement | null;
    if (!opt || opt.disabled) return;
    this.value = opt.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent<FluidSelectValueDetail>("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleOptionHover = (e: Event) => {
    const opt = (e.target as HTMLElement).closest("fluid-option") as FluidOptionElement | null;
    if (!opt || opt.disabled) return;
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

  private handlePrefixChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.hasPrefix = slotHasContent(slot);
    this.prefixFlush = slotHasFlush(slot);
  }

  private handleSuffixChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.hasSuffix = slotHasContent(slot);
    this.suffixFlush = slotHasFlush(slot);
  }

  override render(): TemplateResult {
    const label = this.selectedLabel;
    return renderFieldChrome(
      { label: this.label, helpText: this.helpText, for: "trigger" },
      html`
        <div part="base" style="position:relative; width:100%;">
          <button
            id="trigger"
            part="trigger"
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls=${this.listboxId}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-describedby=${ifDefined(fieldHelpDescribedBy(this.helpText))}
            aria-invalid=${this.invalid ? "true" : "false"}
            ?disabled=${this.disabled}
            class=${classMap({
              trigger: true,
              [`size-${this.size}`]: true,
              focused: this.focused,
              disabled: this.disabled,
              invalid: this.invalid
            })}
            @click=${this.handleTriggerClick}
            @keydown=${this.handleTriggerKeyDown}
            @focus=${() => (this.focused = true)}
            @blur=${this.handleTriggerBlur}
          >
            <span
              class=${`affix prefix${this.prefixFlush ? " flush" : ""}`}
              part="prefix"
              ?hidden=${!this.hasPrefix}
            >
              <slot name="prefix" @slotchange=${this.handlePrefixChange}></slot>
            </span>
            <span class=${classMap({ label: true, placeholder: !label })}>
              ${(label ?? this.placeholder) || this.term("select")}
            </span>
            <span
              class=${`affix suffix${this.suffixFlush ? " flush" : ""}`}
              part="suffix"
              ?hidden=${!this.hasSuffix}
            >
              <slot name="suffix" @slotchange=${this.handleSuffixChange}></slot>
            </span>
            <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
          </button>
          <div
            part="listbox"
            class="listbox"
            id=${this.listboxId}
            role="listbox"
            popover="manual"
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            @click=${this.handleOptionClick}
            @pointermove=${this.handleOptionHover}
          >
            <slot @slotchange=${this.handleSlotChange}></slot>
          </div>
        </div>
      `
    );
  }
}

function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({ flatten: true })
    .some((node) => node.nodeType !== Node.TEXT_NODE || Boolean(node.textContent?.trim()));
}

function slotHasFlush(slot: HTMLSlotElement): boolean {
  return slot
    .assignedElements({ flatten: true })
    .some((element) => element.hasAttribute("data-flush"));
}
