# @fluid-ds/angular

Angular `ControlValueAccessor` directives for Fluid form components. Install
this next to `@fluid-ds/components` and every Fluid form control binds with
`[(ngModel)]`, `formControlName`, or `[formControl]` like a native input. No
hand-written CVA bridge components required.

```bash
npm i @fluid-ds/angular @fluid-ds/components
```

```ts
import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { FLUID_FORM_DIRECTIVES } from "@fluid-ds/angular";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/switch";

@Component({
  selector: "app-profile",
  imports: [ReactiveFormsModule, FLUID_FORM_DIRECTIVES],
  schemas: [], // CUSTOM_ELEMENTS_SCHEMA if you use unwrapped fluid-* tags too
  template: `
    <fluid-input label="Display name" [formControl]="name"></fluid-input>
    <fluid-switch [formControl]="notifications">Notifications</fluid-switch>
  `
})
export class ProfileComponent {
  name = new FormControl("Rene");
  notifications = new FormControl(true);
}
```

## What is covered

- **Value controls** (`value` property, updates on `fluid-input` /
  `fluid-change`): input, textarea, number input, masked input, select,
  typeahead, segmented control, radio group, slider, rating, date picker,
  time picker, color picker, tag input, OTP.
- **Boolean controls** (`checked` property, updates on `fluid-change`):
  checkbox, switch.

Values pass through with the component's own `value` type: a rating hands your
form a number, a tag input its string array, a slider a string (like a native
range input). A `null` model writes as an empty string
(matching Angular's `DefaultValueAccessor`); initialize numeric controls with
a real number. Compound-value controls (date range picker, range slider) are
not covered yet; bind their properties and events directly.

`disabled` follows the form state (`control.disable()`), and blur marks the
control touched, so validation timing behaves like native fields.

## Notes

- The directives attach only when a form binding is present, unbound
  `fluid-*` elements carry no Angular behavior.
- Compiled in Angular partial-compilation mode; any Angular 20+ CLI build
  links it automatically.
- Registering the elements (`@fluid-ds/components/define/*`) stays your
  side-effect import, exactly as without this package.

MIT licensed, like the rest of Fluid.
