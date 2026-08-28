import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { toast } from "../lib";

@Component({
  selector: "app-settings",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <fluid-card>
      <h3 slot="header">Workspace</h3>
      <div class="form-grid">
        <label>
          Workspace name <fluid-input value="Fluid Inc."></fluid-input>
        </label>
        <label>
          Support email <fluid-input type="email" value="support@fluid.dev"></fluid-input>
        </label>
        <label>
          Default density
          <fluid-segmented-control value="cozy" aria-label="Default density">
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
          <fluid-switch [checked]="true"></fluid-switch>
        </div>
        <div class="toggle-row">
          <div>
            <strong>Security alerts</strong>
            <div class="muted">Sign-ins and changes.</div>
          </div>
          <fluid-switch [checked]="true"></fluid-switch>
        </div>
        <div class="toggle-row">
          <div>
            <strong>Weekly digest</strong>
            <div class="muted">A Monday summary.</div>
          </div>
          <fluid-switch></fluid-switch>
        </div>
      </div>
      <div slot="footer" class="dialog-actions">
        <fluid-button (click)="onSave()">Save changes</fluid-button>
      </div>
    </fluid-card>
  `
})
export class SettingsComponent {
  onSave(): void {
    toast("Settings saved.", "success");
  }
}
