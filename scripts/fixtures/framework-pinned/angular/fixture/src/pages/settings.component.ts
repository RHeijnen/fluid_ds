import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { JsonPipe } from "@angular/common";
import { FLUID_FORM_DIRECTIVES } from "@fluid-ds/angular";
import { toast } from "../lib";

/**
 * Settings page, rebuilt on Angular reactive forms via @fluid-ds/angular.
 * The fluid-* controls bind through the package's ControlValueAccessor
 * directives, so formControlName works on them exactly like on native
 * inputs: no bridge components, no manual event plumbing.
 */
@Component({
  selector: "app-settings",
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, FLUID_FORM_DIRECTIVES],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSave()">
      <fluid-card>
        <h3 slot="header">Workspace</h3>
        <div class="form-grid">
          <label> Workspace name <fluid-input formControlName="name"></fluid-input> </label>
          <label>
            Support email <fluid-input type="email" formControlName="email"></fluid-input>
          </label>
          <label>
            Default density
            <fluid-segmented-control formControlName="density" aria-label="Default density">
              <fluid-segment value="compact">Compact</fluid-segment>
              <fluid-segment value="cozy">Cozy</fluid-segment>
              <fluid-segment value="comfortable">Comfortable</fluid-segment>
            </fluid-segmented-control>
          </label>
        </div>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Notifications</h3>
        <div class="toggles">
          <div class="toggle-row">
            <div>
              <strong>Product updates</strong>
              <div class="muted">News about releases.</div>
            </div>
            <fluid-switch formControlName="productUpdates"></fluid-switch>
          </div>
          <div class="toggle-row">
            <div>
              <strong>Security alerts</strong>
              <div class="muted">Sign-ins and changes.</div>
            </div>
            <fluid-switch formControlName="securityAlerts"></fluid-switch>
          </div>
          <div class="toggle-row">
            <div>
              <strong>Weekly digest</strong>
              <div class="muted">A Monday summary.</div>
            </div>
            <fluid-switch formControlName="weeklyDigest"></fluid-switch>
          </div>
        </div>
        <div slot="footer" class="dialog-actions">
          <fluid-button type="submit" [disabled]="form.invalid">Save changes</fluid-button>
        </div>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Live form state</h3>
        <p class="muted">
          Bound through <code>&#64;fluid-ds/angular</code>'s ControlValueAccessor directives; edit
          anything above and the reactive form follows.
        </p>
        <pre class="form-state" data-testid="form-state">{{ form.value | json }}</pre>
        <p class="muted">
          status: <strong data-testid="form-status">{{ form.status }}</strong>
        </p>
      </fluid-card>
    </form>
  `
})
export class SettingsComponent {
  readonly form = new FormGroup({
    name: new FormControl("Fluid Inc.", { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl("support@fluid.dev", {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    density: new FormControl("cozy", { nonNullable: true }),
    productUpdates: new FormControl(true, { nonNullable: true }),
    securityAlerts: new FormControl(true, { nonNullable: true }),
    weeklyDigest: new FormControl(false, { nonNullable: true })
  });

  onSave(): void {
    if (this.form.invalid) return;
    toast(`Saved settings for ${this.form.getRawValue().name}.`, "success");
  }
}
