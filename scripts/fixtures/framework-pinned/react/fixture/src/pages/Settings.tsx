import { toast } from "../lib";

export function Settings() {
  return (
    <>
      <fluid-card>
        <h3 slot="header">Workspace</h3>
        <div className="form-grid">
          <label>
            Workspace name <fluid-input value="Fluid Inc." />
          </label>
          <label>
            Support email <fluid-input type="email" value="support@fluid.dev" />
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
        <div className="toggles">
          <div className="toggle-row">
            <div>
              <strong>Product updates</strong>
              <div className="muted">News about releases.</div>
            </div>
            <fluid-switch checked />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Security alerts</strong>
              <div className="muted">Sign-ins and changes.</div>
            </div>
            <fluid-switch checked />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Weekly digest</strong>
              <div className="muted">A Monday summary.</div>
            </div>
            <fluid-switch />
          </div>
        </div>
        <div slot="footer" className="dialog-actions">
          <fluid-button onClick={() => toast("Settings saved.", "success")}>Save changes</fluid-button>
        </div>
      </fluid-card>
    </>
  );
}
