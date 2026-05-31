import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import type { FluidRadio } from "./fluid-radio.js";

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
 * @cssproperty --fluid-radio-group-label-fg - Label text color.
 *
 * @uses-token --fluid-text-primary - Label color.
 *
 * @fires fluid-change - Fired when the selected value changes. detail.value is the new value.
 */
export class FluidRadioGroup extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: block;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }

    .label {
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-radio-group-label-fg, var(--fluid-text-primary));
    }

    .label.empty {
      display: none;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
    }

    :host([orientation="horizontal"]) .options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--fluid-space-4);
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

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "radiogroup");
    this.addEventListener("click", this.handleClick);
    this.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("keydown", this.handleKeyDown);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
  }

  override formDisabledCallback(disabled: boolean): void {
    for (const radio of this.getRadios()) {
      if (disabled) radio.setAttribute("disabled", "");
      else radio.removeAttribute("disabled");
    }
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    const target =
      this.getRadios().find((r) => r.checked && !r.disabled) ??
      this.getRadios().find((r) => !r.disabled);
    target?.focus(options);
  }

  private getRadios(): FluidRadio[] {
    return Array.from(this.querySelectorAll("fluid-radio")) as FluidRadio[];
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.internals.setFormValue(this.value);
    }
    if (changed.has("required") || changed.has("value")) {
      if (this.required && !this.value) {
        this.setValidity({ valueMissing: true }, "Please pick an option.");
      } else {
        this.setValidity({});
      }
    }
  }

  protected override updated(): void {
    this.syncRadioState();
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
  }

  private selectRadio(radio: FluidRadio | null | undefined): void {
    if (!radio || radio.disabled) return;
    if (this.value === radio.value) return;
    this.value = radio.value;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
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
      case "ArrowRight":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % radios.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = currentIndex < 0 ? radios.length - 1 : (currentIndex - 1 + radios.length) % radios.length;
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
      <div part="base" class="base">
        <div
          part="label"
          class="label ${this.children.length === this.getRadios().length ? "empty" : ""}"
        >
          <slot name="label"></slot>
        </div>
        <div
          class="options"
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        >
          <slot @slotchange=${() => this.syncRadioState()}></slot>
        </div>
      </div>
    `;
  }
}
