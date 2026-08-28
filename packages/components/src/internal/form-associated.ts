import { FluidElement } from "./base-element.js";

/**
 * Base class for form-associated custom elements.
 *
 * Wraps ElementInternals so subclasses get:
 *   - Form participation (name + value submitted with the form)
 *   - Validation API (setValidity, checkValidity, reportValidity)
 *   - Accessibility (ARIA reflection via internals)
 *   - Form lifecycle hooks (reset, disabled propagation, restore state)
 *
 * Subclasses MUST set `static formAssociated = true` and implement `value`
 * (typically as a reactive property that calls `this.syncFormValue()` on change).
 */
export class FluidFormAssociated extends FluidElement {
  static formAssociated = true;

  protected readonly internals: ElementInternals;
  private validationFlags: ValidityStateFlags = {};
  private validationMessageText = "";
  private validationAnchor?: HTMLElement;
  private customValidationMessage = "";

  /**
   * The control's name. Submitted with the form alongside `value`.
   * Mirrors the native `name` HTML attribute.
   */
  declare name: string;

  /**
   * The current value. Subclasses must declare this as a reactive @property
   * and call `syncFormValue()` whenever it changes. Most controls use a string;
   * multi-value controls (e.g. tag input) may hold a string array and serialize
   * it to a string in their own `syncFormValue()` before submission.
   */
  declare value: string | string[] | File | FormData | null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  /** The associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Standard validity state. */
  get validity(): ValidityState {
    return this.internals.validity;
  }

  /** Localized validation message. */
  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  /** Whether the control is valid. */
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  /** Same as checkValidity, plus shows the browser-native validity UI when invalid. */
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** Imperatively set a custom validation message. Pass "" to clear. */
  setCustomValidity(message: string): void {
    this.customValidationMessage = message;
    this.applyValidity();
  }

  /**
   * Push the current `value` into ElementInternals so the form sees it.
   * Subclasses call this from the property setter / on change.
   */
  protected syncFormValue(): void {
    this.internals.setFormValue(this.value as FormValue);
  }

  /**
   * Update validity state. Pass an empty object to clear.
   * Anchor element is the focusable element inside shadow DOM that should
   * receive focus when validation fails (typically the inner <input>).
   */
  protected setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
    this.validationFlags = { ...flags };
    this.validationMessageText = message ?? "";
    this.validationAnchor = anchor;
    this.applyValidity();
  }

  private applyValidity(): void {
    const flags: ValidityStateFlags = {
      ...this.validationFlags,
      ...(this.customValidationMessage ? { customError: true } : {})
    };
    const message = this.customValidationMessage || this.validationMessageText || undefined;
    this.internals.setValidity(flags, message, this.validationAnchor);
  }

  /* Form lifecycle callbacks invoked by the platform. ──────────────────── */

  formAssociatedCallback(_form: HTMLFormElement | null): void {
    /* Subclasses override if needed. */
  }

  formDisabledCallback(_disabled: boolean): void {
    /* Subclasses override if needed. */
  }

  formResetCallback(): void {
    /* Subclasses override, typically reset value to default. */
  }

  formStateRestoreCallback(_state: FormValue, _mode: "restore" | "autocomplete"): void {
    /* Subclasses override for form state restoration. */
  }
}

type FormValue = string | File | FormData | null;
