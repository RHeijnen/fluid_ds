/**
 * ControlValueAccessor directives for Fluid form components.
 *
 * Every Fluid form control is a form-associated custom element that exposes
 * its state as a `value` (or `checked`) property, mirrors `disabled`, and
 * announces edits with `fluid-input` (as-you-type) and `fluid-change`
 * (committed) events. These directives translate that contract into
 * Angular's, so a `fluid-*` control binds with `[(ngModel)]`,
 * `formControlName`, or `[formControl]` exactly like a native input, with no
 * hand-written bridge component.
 *
 * The directives attach only when a form binding is present on the element
 * (the same convention Angular's own accessors use), so unbound Fluid
 * controls carry no Angular behavior.
 */
import { Directive, ElementRef, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms";

interface FluidFormControlElement extends HTMLElement {
  value?: unknown;
  checked?: boolean;
  disabled?: boolean;
}

/** Shared plumbing: change/touched callbacks, disabled mirroring, blur. */
@Directive({
  host: { "(focusout)": "handleFocusOut()" }
})
export abstract class FluidValueAccessorBase implements ControlValueAccessor {
  protected onChange: (value: unknown) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor(protected readonly host: ElementRef<FluidFormControlElement>) {}

  abstract writeValue(value: unknown): void;

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.host.nativeElement.disabled = isDisabled;
  }

  protected handleFocusOut(): void {
    this.onTouched();
  }
}

/**
 * Accessor for every value-carrying Fluid control (text fields, pickers,
 * selects, sliders, rating, OTP, tag input). Reads the element's `value`
 * property on each `fluid-input` / `fluid-change`, so typed values (a
 * slider's number, a tag input's list) flow through unchanged.
 *
 * A null or undefined model writes as an empty string, matching Angular's
 * DefaultValueAccessor. Initialize numeric controls with a real number.
 */
@Directive({
  selector:
    "fluid-input[formControlName], fluid-input[formControl], fluid-input[ngModel]," +
    "fluid-textarea[formControlName], fluid-textarea[formControl], fluid-textarea[ngModel]," +
    "fluid-number-input[formControlName], fluid-number-input[formControl], fluid-number-input[ngModel]," +
    "fluid-masked-input[formControlName], fluid-masked-input[formControl], fluid-masked-input[ngModel]," +
    "fluid-select[formControlName], fluid-select[formControl], fluid-select[ngModel]," +
    "fluid-typeahead[formControlName], fluid-typeahead[formControl], fluid-typeahead[ngModel]," +
    "fluid-segmented-control[formControlName], fluid-segmented-control[formControl], fluid-segmented-control[ngModel]," +
    "fluid-radio-group[formControlName], fluid-radio-group[formControl], fluid-radio-group[ngModel]," +
    "fluid-slider[formControlName], fluid-slider[formControl], fluid-slider[ngModel]," +
    "fluid-rating[formControlName], fluid-rating[formControl], fluid-rating[ngModel]," +
    "fluid-date-picker[formControlName], fluid-date-picker[formControl], fluid-date-picker[ngModel]," +
    "fluid-time-picker[formControlName], fluid-time-picker[formControl], fluid-time-picker[ngModel]," +
    "fluid-color-picker[formControlName], fluid-color-picker[formControl], fluid-color-picker[ngModel]," +
    "fluid-tag-input[formControlName], fluid-tag-input[formControl], fluid-tag-input[ngModel]," +
    "fluid-otp[formControlName], fluid-otp[formControl], fluid-otp[ngModel]",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FluidValueAccessorDirective),
      multi: true
    }
  ],
  host: {
    "(fluid-input)": "handleValueEvent()",
    "(fluid-change)": "handleValueEvent()"
  }
})
export class FluidValueAccessorDirective extends FluidValueAccessorBase {
  override writeValue(value: unknown): void {
    this.host.nativeElement.value = value ?? "";
  }

  protected handleValueEvent(): void {
    this.onChange(this.host.nativeElement.value);
  }
}

/**
 * Accessor for the boolean Fluid controls (checkbox, switch), which carry
 * their state as `checked` and commit it with `fluid-change`.
 */
@Directive({
  selector:
    "fluid-checkbox[formControlName], fluid-checkbox[formControl], fluid-checkbox[ngModel]," +
    "fluid-switch[formControlName], fluid-switch[formControl], fluid-switch[ngModel]",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FluidCheckedValueAccessorDirective),
      multi: true
    }
  ],
  host: {
    "(fluid-change)": "handleCheckedEvent()"
  }
})
export class FluidCheckedValueAccessorDirective extends FluidValueAccessorBase {
  override writeValue(value: unknown): void {
    this.host.nativeElement.checked = Boolean(value);
  }

  protected handleCheckedEvent(): void {
    this.onChange(Boolean(this.host.nativeElement.checked));
  }
}

/**
 * Everything a form template needs, in one import:
 *
 * ```ts
 * import { FLUID_FORM_DIRECTIVES } from "@fluid-ds/angular";
 *
 * @Component({ imports: [ReactiveFormsModule, FLUID_FORM_DIRECTIVES], ... })
 * ```
 */
export const FLUID_FORM_DIRECTIVES = [
  FluidValueAccessorDirective,
  FluidCheckedValueAccessorDirective
] as const;
