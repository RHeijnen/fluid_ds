import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import type { FluidRadio } from "./fluid-radio.js";

export interface FluidRadioGroupValueDetail {
  value: string;
}
export type FluidRadioGroupChangeEvent = CustomEvent<FluidRadioGroupValueDetail>;

/**
 * Container for a set of `<fluid-radio>` children. Manages selection,
 * roving tabindex, and keyboard navigation (arrow keys move between
 * non-disabled radios; Space/Enter activates).
 *
 * Form-associated. Submits the selected radio's `value` under the group's
 * `name`.
 *
 * @summary Mutually exclusive radio set.
 *
 * @slot - One or more `<fluid-radio>` elements.
 * @slot label - Optional label rendered above the group.
 *
 * @csspart base - The outer container.
 * @csspart label - The group label slot wrapper.
 *
 * @cssproperty --fluid-radio-group-gap - Gap between the group label and options.
 * @cssproperty --fluid-radio-group-option-gap - Gap between vertical options.
 * @cssproperty --fluid-radio-group-horizontal-gap - Gap between horizontal options.
 * @cssproperty --fluid-radio-group-label-fg - Label text color.
 * @cssproperty --fluid-radio-group-label-font-family - Label font family.
 * @cssproperty --fluid-radio-group-label-font-size - Label font size.
 * @cssproperty --fluid-radio-group-label-font-weight - Label font weight.
 * @cssproperty --fluid-radio-group-invalid-border - Invalid option border color.
 *
 * @uses-token --fluid-text-primary - Label color.
 * @uses-token --fluid-danger-base - Invalid option border color.
 *
 * @fires {FluidRadioGroupChangeEvent} fluid-change - Fired when the selected value changes. detail.value is the new value.
 */
export class FluidRadioGroup extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-radio-group-gap, var(--fluid-space-2));
    }

    .label {
      font-family: var(--fluid-radio-group-label-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-radio-group-label-font-size, var(--fluid-font-size-sm));
      font-weight: var(--fluid-radio-group-label-font-weight, var(--fluid-font-weight-medium));
      color: var(--fluid-radio-group-label-fg, var(--fluid-text-primary));
    }

    .label.empty {
      display: none;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-radio-group-option-gap, var(--fluid-space-2));
    }

    :host([orientation="horizontal"]) .options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--fluid-radio-group-horizontal-gap, var(--fluid-space-4));
    }

    .base.invalid .options-slot::slotted(fluid-radio) {
      --fluid-radio-border: var(--fluid-radio-group-invalid-border, var(--fluid-danger-base));
      --fluid-radio-border-hover: var(--fluid-radio-group-invalid-border, var(--fluid-danger-base));
    }
  `;

  /** Selected value. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Layout orientation. */
  @property({ reflect: true }) orientation: "vertical" | "horizontal" = "vertical";

  /** Required for form validation. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  private radioObserver?: MutationObserver;
  private selectedRadio: FluidRadio | null = null;
  private formDisabled = false;
  private readonly authoredDisabled = new Map<FluidRadio, boolean>();
  @state() private invalid = false;

  constructor() {
    super();
    this.addEventListener("invalid", this.handleInvalid);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "radiogroup");
    this.listen(this, "click", this.handleClick);
    this.listen(this, "keydown", this.handleKeyDown);
    this.listen(this, "focusout", this.handleFocusOut);
    if (typeof MutationObserver !== "undefined") {
      this.radioObserver = new MutationObserver(() => this.reconcileRadioOptions());
      this.radioObserver.observe(this, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "value"]
      });
    }
    if (this.hasUpdated) this.reconcileRadioOptions();
  }

  override disconnectedCallback(): void {
    this.radioObserver?.disconnect();
    super.disconnectedCallback();
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.invalid = false;
    this.syncRadioState();
    this.refreshFormContract();
  }

  override formDisabledCallback(disabled: boolean): void {
    const radios = this.getRadios();
    if (disabled) {
      this.formDisabled = true;
      this.authoredDisabled.clear();
      for (const radio of radios) {
        this.authoredDisabled.set(radio, radio.disabled);
        radio.disabled = true;
      }
    } else {
      for (const radio of radios)
        radio.disabled = this.authoredDisabled.get(radio) ?? radio.disabled;
      this.authoredDisabled.clear();
      this.formDisabled = false;
    }
    this.syncRadioState();
    this.refreshFormContract();
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.value = state;
      this.syncRadioState();
      this.refreshFormContract();
    }
  }

  override focus(options?: FocusOptions): void {
    const target =
      this.getRadios().find((r) => r.checked && !r.disabled) ??
      this.getRadios().find((r) => !r.disabled);
    target?.focus(options);
  }

  private getRadios(): FluidRadio[] {
    if (typeof this.querySelectorAll !== "function") return [];
    return (Array.from(this.querySelectorAll("fluid-radio")) as FluidRadio[]).filter(
      (radio) => radio.closest("fluid-radio-group") === this
    );
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
  }

  protected override updated(): void {
    this.syncRadioState();
    this.refreshFormContract();
  }

  private refreshFormContract(showInvalid = this.invalid): void {
    const radios = this.getRadios();
    const selected = this.formDisabled
      ? undefined
      : radios.find((radio) => radio.value === this.value && !radio.disabled);
    const firstEnabled = radios.find((radio) => !radio.disabled);
    const anchor = selected ?? firstEnabled;
    // A required group whose options are all disabled must still expose a
    // focusable validation target instead of triggering the browser's
    // "invalid form control is not focusable" error. Normal groups keep focus
    // on their roving radio option rather than adding a second tab stop.
    this.tabIndex = !this.formDisabled && !firstEnabled ? 0 : -1;
    this.internals.setFormValue(selected ? this.value : null);
    if (this.required && !selected) {
      this.setValidity({ valueMissing: true }, this.term("pickAnOption"), anchor);
      this.invalid = showInvalid;
    } else {
      this.setValidity({}, undefined, anchor);
      this.invalid = false;
    }
    this.setAttribute("aria-invalid", this.invalid ? "true" : "false");
  }

  private handleInvalid = (): void => {
    this.refreshFormContract(true);
  };

  private handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    this.refreshFormContract(true);
  };

  private reconcileRadioOptions(): void {
    const radios = this.getRadios();
    if (this.formDisabled) {
      for (const radio of radios) {
        if (!this.authoredDisabled.has(radio)) {
          this.authoredDisabled.set(radio, radio.disabled);
          radio.disabled = true;
        }
      }
    }
    const focused = (this.getRootNode() as Document | ShadowRoot).activeElement;
    const focusedDisabledRadio = radios.find((radio) => radio === focused && radio.disabled);
    if (
      !this.formDisabled &&
      this.selectedRadio &&
      (!radios.includes(this.selectedRadio) ||
        this.selectedRadio.disabled ||
        this.selectedRadio.value !== this.value)
    ) {
      this.value = "";
      this.selectedRadio = null;
    }
    this.syncRadioState();
    this.refreshFormContract();
    if (focusedDisabledRadio && !this.formDisabled) {
      radios.find((radio) => !radio.disabled)?.focus();
    }
  }

  private syncRadioState(): void {
    const radios = this.getRadios();
    const hasChecked = radios.some((r) => r.value === this.value && !r.disabled);
    for (const radio of radios) {
      radio.checked = radio.value === this.value && !radio.disabled;
      // Roving tabindex: only one radio in the group is in the tab order.
      // If something is checked, that gets focus; else the first enabled radio.
      radio.tabIndex = radio.checked ? 0 : -1;
    }
    if (!hasChecked) {
      const first = radios.find((r) => !r.disabled);
      if (first) first.tabIndex = 0;
    }
    this.selectedRadio = radios.find((radio) => radio.checked) ?? null;
  }

  private selectRadio(radio: FluidRadio | null | undefined): void {
    if (!radio || radio.disabled) return;
    if (this.value === radio.value) return;
    this.value = radio.value;
    this.syncRadioState();
    this.refreshFormContract();
    this.dispatchEvent(
      new CustomEvent<FluidRadioGroupValueDetail>("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleClick = (e: MouseEvent) => {
    const radio = (e.target as HTMLElement).closest("fluid-radio") as FluidRadio | null;
    if (!radio) return;
    this.selectRadio(radio);
    radio.focus();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const radios = this.getRadios().filter((r) => !r.disabled);
    if (!radios.length) return;
    const currentIndex = radios.findIndex((r) => r === document.activeElement);
    let nextIndex = currentIndex;
    switch (e.key) {
      case "ArrowDown":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % radios.length;
        break;
      case "ArrowUp":
        nextIndex =
          currentIndex < 0 ? radios.length - 1 : (currentIndex - 1 + radios.length) % radios.length;
        break;
      case "ArrowRight":
        nextIndex =
          currentIndex < 0
            ? 0
            : (currentIndex + (this.isRtl ? -1 : 1) + radios.length) % radios.length;
        break;
      case "ArrowLeft":
        nextIndex =
          currentIndex < 0
            ? radios.length - 1
            : (currentIndex + (this.isRtl ? 1 : -1) + radios.length) % radios.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = radios.length - 1;
        break;
      case " ":
      case "Enter":
        if (currentIndex >= 0) {
          e.preventDefault();
          this.selectRadio(radios[currentIndex]);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    const next = radios[nextIndex]!;
    next.focus();
    this.selectRadio(next);
  };

  override render(): TemplateResult {
    return html`
      <div part="base" class="base ${this.invalid ? "invalid" : ""}">
        <div
          part="label"
          class="label ${(this.children?.length ?? 0) === this.getRadios().length ? "empty" : ""}"
        >
          <slot name="label"></slot>
        </div>
        <div class="options" aria-label=${ifDefined(this.ariaLabel ?? undefined)}>
          <slot class="options-slot" @slotchange=${() => this.syncRadioState()}></slot>
        </div>
      </div>
    `;
  }
}
