/**
 * Settings dashboard demo, a SaaS-style page with the components a
 * real product would use on day one: a left nav, a profile section, a
 * form, a toggle list, a billing chart, callouts, and a sticky
 * save/cancel footer.
 *
 * Exercises ~25 components in their typical positions. Switching the
 * brand or scheme from the theme picker in the top-right re-themes
 * everything live.
 */
import "./shared/register-fluid.js";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Settings", currentRoute: "settings" });
mountDesignOverlay();

main.innerHTML = `
  <fluid-breadcrumb>
    <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
    <fluid-breadcrumb-item>Settings</fluid-breadcrumb-item>
  </fluid-breadcrumb>

  <header style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem 0 1.5rem;">
    <div>
      <h1 style="margin: 0 0 0.25rem;">Account settings</h1>
      <p style="margin: 0; color: var(--fluid-text-secondary);">
        Manage your profile, preferences, and billing.
      </p>
    </div>
    <fluid-button-group aria-label="Save controls">
      <fluid-button variant="ghost" id="cancel-btn">Discard</fluid-button>
      <fluid-button id="save-btn">Save changes</fluid-button>
    </fluid-button-group>
  </header>

  <!-- KPI strip, gives the page some weight before the tabs. -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
    <fluid-card>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="font-size: 0.8rem; color: var(--fluid-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">Plan</div>
          <strong style="font-size: 1.25rem;">Pro</strong>
          <div style="font-size: 0.85rem; color: var(--fluid-text-secondary);">Renews Apr 12, 2026</div>
        </div>
        <fluid-tag variant="success">Active</fluid-tag>
      </div>
    </fluid-card>

    <fluid-card>
      <div style="font-size: 0.8rem; color: var(--fluid-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">Storage</div>
      <div style="display: flex; align-items: baseline; gap: 0.4rem; margin: 0.1rem 0 0.5rem;">
        <strong style="font-size: 1.25rem;">12.4 GB</strong>
        <span style="color: var(--fluid-text-secondary); font-size: 0.85rem;">/ 20 GB</span>
      </div>
      <fluid-progress-bar value="62" aria-label="Storage used"></fluid-progress-bar>
    </fluid-card>

    <fluid-card>
      <div style="display: flex; align-items: center; gap: 0.9rem;">
        <fluid-progress-ring value="32" style="--fluid-progress-ring-size: 3rem;"></fluid-progress-ring>
        <div>
          <div style="font-size: 0.8rem; color: var(--fluid-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">Members</div>
          <strong style="font-size: 1.25rem;">8 / 25</strong>
          <div style="font-size: 0.85rem; color: var(--fluid-text-secondary);">seats used</div>
        </div>
      </div>
    </fluid-card>
  </div>

  <fluid-tabs>
    <fluid-tab slot="nav" panel="profile">Profile</fluid-tab>
    <fluid-tab slot="nav" panel="notifications">Notifications</fluid-tab>
    <fluid-tab slot="nav" panel="billing">Billing</fluid-tab>
    <fluid-tab slot="nav" panel="security">Security</fluid-tab>

    <!-- Profile -->
    <fluid-tab-panel name="profile">
      <div style="display: grid; gap: 1.25rem; grid-template-columns: 1fr 1fr; margin-top: 1rem;">
        <fluid-card>
          <h3 slot="header" style="margin: 0;">Identity</h3>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <fluid-avatar size="lg" initials="RH"></fluid-avatar>
            <div>
              <strong>Rene Heijnen</strong>
              <div style="color: var(--fluid-text-secondary); font-size: 0.875rem;">
                rene@example.com
              </div>
            </div>
            <fluid-button variant="secondary" size="sm" style="margin-left: auto;">
              Change photo
            </fluid-button>
          </div>

          <div style="display: grid; gap: 0.75rem;">
            <label>
              <span style="font-size: 0.85rem; font-weight: 600;">Display name</span>
              <fluid-input
                value="Rene Heijnen"
                aria-label="Display name"
                required
                minlength="2"
              ></fluid-input>
            </label>
            <label>
              <span style="font-size: 0.85rem; font-weight: 600;">Email</span>
              <fluid-input
                type="email"
                value="rene@example.com"
                aria-label="Email"
                required
              ></fluid-input>
            </label>
            <label>
              <span style="font-size: 0.85rem; font-weight: 600;">Time zone</span>
              <fluid-select value="Europe/Amsterdam" aria-label="Time zone">
                <fluid-option value="America/Los_Angeles">Pacific Time</fluid-option>
                <fluid-option value="America/New_York">Eastern Time</fluid-option>
                <fluid-option value="Europe/Amsterdam">Central European Time</fluid-option>
                <fluid-option value="Asia/Tokyo">Japan Standard Time</fluid-option>
              </fluid-select>
            </label>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header" style="margin: 0;">About</h3>
          <label>
            <span style="font-size: 0.85rem; font-weight: 600;">Bio</span>
            <fluid-textarea
              rows="5"
              aria-label="Bio"
              value="Building design systems and tinkering with web components."
            ></fluid-textarea>
          </label>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
            <fluid-tag>Lit</fluid-tag>
            <fluid-tag>TypeScript</fluid-tag>
            <fluid-tag>Design systems</fluid-tag>
            <fluid-tag>Accessibility</fluid-tag>
          </div>
        </fluid-card>
      </div>
    </fluid-tab-panel>

    <!-- Notifications -->
    <fluid-tab-panel name="notifications">
      <fluid-card style="margin-top: 1rem;">
        <h3 slot="header" style="margin: 0;">Notify me about</h3>

        <ul style="list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem;">
          ${[
            ["Comments on my posts", "When someone comments on something I wrote.", true],
            ["Mentions", "When I'm @-mentioned.", true],
            ["Weekly digest", "A summary of activity once per week.", false],
            ["Marketing", "Product news and tips.", false]
          ]
            .map(
              ([label, hint, checked]) => `
              <li style="display: flex; align-items: start; justify-content: space-between; gap: 1rem;">
                <div>
                  <div style="font-weight: 600;">${label}</div>
                  <div style="color: var(--fluid-text-secondary); font-size: 0.875rem;">${hint}</div>
                </div>
                <fluid-switch ${checked ? "checked" : ""} aria-label="${label}"></fluid-switch>
              </li>`
            )
            .join("")}
        </ul>
      </fluid-card>

      <fluid-callout variant="info" style="margin-top: 1rem;">
        <span slot="header">Heads up</span>
        Security alerts are always on. You can't disable them from this panel.
      </fluid-callout>
    </fluid-tab-panel>

    <!-- Billing -->
    <fluid-tab-panel name="billing">
      <div style="display: grid; gap: 1.25rem; grid-template-columns: 2fr 1fr; margin-top: 1rem;">
        <fluid-card>
          <h3 slot="header" style="margin: 0;">Spending this year</h3>
          <div id="billing-wrap">
            <!-- Loading skeleton, replaced once loadBillingData resolves -->
            <div style="display: flex; flex-direction: column; gap: 0.5rem; height: 16rem; padding: 0.5rem; align-items: stretch; justify-content: end;">
              ${Array.from(
                { length: 12 },
                (_, i) => `<fluid-skeleton style="width: 100%; height: ${20 + (i * 5) % 60}%;"></fluid-skeleton>`
              ).join("")}
            </div>
          </div>
        </fluid-card>

        <fluid-card>
          <h3 slot="header" style="margin: 0;">Current plan</h3>
          <div style="display: flex; align-items: baseline; gap: 0.5rem;">
            <strong style="font-size: 1.75rem;">$24</strong>
            <span style="color: var(--fluid-text-secondary);">/ month</span>
          </div>
          <div style="margin: 0.5rem 0 1rem;">
            <fluid-tag variant="success">Pro</fluid-tag>
          </div>
          <ul style="padding-left: 1.2rem; color: var(--fluid-text-secondary); line-height: 1.7;">
            <li>Unlimited projects</li>
            <li>20 GB storage</li>
            <li>Email support</li>
          </ul>
          <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <fluid-button variant="ghost" size="sm">Manage</fluid-button>
            <fluid-button size="sm">Upgrade</fluid-button>
          </div>
        </fluid-card>
      </div>
    </fluid-tab-panel>

    <!-- Security -->
    <fluid-tab-panel name="security">
      <fluid-card style="margin-top: 1rem;">
        <h3 slot="header" style="margin: 0;">Two-factor auth</h3>
        <p>Add a second step when signing in from a new device.</p>
        <fluid-segmented-control value="app" aria-label="Method">
          <fluid-segment value="app">Authenticator app</fluid-segment>
          <fluid-segment value="sms">SMS</fluid-segment>
          <fluid-segment value="off">Off</fluid-segment>
        </fluid-segmented-control>
      </fluid-card>

      <fluid-card style="margin-top: 1rem;">
        <h3 slot="header" style="margin: 0;">Danger zone</h3>
        <fluid-callout variant="danger">
          <span slot="header">Delete account</span>
          Permanently delete your account and everything in it. This can't be undone.
        </fluid-callout>
        <div slot="footer" style="display: flex; justify-content: flex-end;">
          <fluid-button id="delete-btn" variant="ghost" style="--fluid-button-fg: var(--fluid-color-danger);">
            Delete account…
          </fluid-button>
        </div>
      </fluid-card>
    </fluid-tab-panel>
  </fluid-tabs>

  <fluid-dialog id="delete-dialog" size="sm">
    <span slot="label">Are you absolutely sure?</span>
    <p>This will permanently delete your account and all associated data. This action can't be undone.</p>
    <fluid-input
      id="delete-confirm-input"
      placeholder="Type DELETE to confirm"
      aria-label="Confirm"
    ></fluid-input>
    <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <fluid-button variant="ghost" id="cancel-delete">Cancel</fluid-button>
      <fluid-button
        id="confirm-delete"
        disabled
        style="--fluid-button-bg: var(--fluid-color-danger);"
      >
        Delete
      </fluid-button>
    </div>
  </fluid-dialog>

  <fluid-toast id="toaster" placement="top-end"></fluid-toast>
`;

// Wire interactions.

const $ = <T extends Element>(sel: string): T | null =>
  document.querySelector<T>(sel);

const toaster = $<HTMLElement & { toast: (o: { message: string; variant: string }) => void }>(
  "#toaster"
);

/**
 * Light-weight form validation: walk every form-associated control we
 * care about, ask the browser for its validity, surface the first
 * failing one as a toast + focus the offending input. Realistic for a
 * demo and gives screen-reader-friendly behavior for free.
 */
function validateForm(): boolean {
  const fields = Array.from(
    document.querySelectorAll<HTMLElement & { validity?: ValidityState; validationMessage?: string; focus?: () => void; reportValidity?: () => boolean }>(
      "fluid-input, fluid-textarea, fluid-select"
    )
  );
  for (const field of fields) {
    const v = field.validity;
    if (v && !v.valid) {
      field.focus?.();
      toaster?.toast({
        message: field.validationMessage ?? "Please check the highlighted field",
        variant: "danger"
      });
      return false;
    }
  }
  return true;
}

const saveBtn = $<HTMLElement & { loading?: boolean }>("#save-btn");
saveBtn?.addEventListener("click", async () => {
  if (!validateForm()) return;
  // Loading state, flips a `loading` attribute the button reads.
  saveBtn.setAttribute("loading", "");
  saveBtn.setAttribute("disabled", "");
  await new Promise((resolve) => setTimeout(resolve, 900));
  saveBtn.removeAttribute("loading");
  saveBtn.removeAttribute("disabled");
  toaster?.toast({ message: "Settings saved", variant: "success" });
});

$<HTMLElement>("#cancel-btn")?.addEventListener("click", () => {
  toaster?.toast({ message: "Discarded", variant: "neutral" });
});

const deleteDialog = $<HTMLElement & { show: () => void; hide: () => void }>("#delete-dialog");
$<HTMLElement>("#delete-btn")?.addEventListener("click", () => deleteDialog?.show());
$<HTMLElement>("#cancel-delete")?.addEventListener("click", () => deleteDialog?.hide());

const confirmInput = $<HTMLElement & { value?: string; addEventListener: typeof window.addEventListener }>(
  "#delete-confirm-input"
);
const confirmBtn = $<HTMLElement>("#confirm-delete");
confirmInput?.addEventListener("fluid-input", () => {
  if (confirmInput.value === "DELETE") confirmBtn?.removeAttribute("disabled");
  else confirmBtn?.setAttribute("disabled", "");
});
confirmBtn?.addEventListener("click", () => {
  deleteDialog?.hide();
  toaster?.toast({ message: "(Demo only, nothing was deleted)", variant: "warning" });
});

/**
 * Simulate fetching the billing data from a backend. While in flight
 * the chart card shows a spinner skeleton; on resolve we swap in the
 * real chart. If the URL hash is `#empty` we show the empty state
 * instead, a deliberate manual switch so the demo can demonstrate
 * both code paths.
 */
async function loadBillingData(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const wrap = document.querySelector("#billing-wrap");
  if (!wrap) return;

  if (window.location.hash === "#empty") {
    wrap.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem 1rem;
        color: var(--fluid-text-secondary);
        text-align: center;
        height: 16rem;
      ">
        <fluid-icon name="chart-no-axes-column" style="--fluid-icon-size: 2.5rem; opacity: 0.5;"></fluid-icon>
        <strong style="color: var(--fluid-text-primary);">No billing yet</strong>
        <div style="font-size: 0.9rem;">
          Your first invoice will show here at the end of the month.
        </div>
        <a href="#" onclick="event.preventDefault(); window.location.hash=''; window.location.reload();" style="font-size: 0.875rem;">
          Show sample data
        </a>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `<fluid-bar-chart id="billing-chart" style="height: 16rem;"></fluid-bar-chart>`;
  queueMicrotask(() => {
    const chart = document.querySelector("#billing-chart") as HTMLElement & {
      data?: unknown;
    };
    if (!chart) return;
    chart.data = {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ],
      datasets: [
        {
          label: "Spend",
          data: [22, 24, 21, 26, 28, 25, 27, 30, 28, 32, 31, 29],
          backgroundColor: "#6366f1"
        }
      ]
    };
  });
}

void loadBillingData();
