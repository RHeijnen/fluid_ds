// The three admin pages. Each exports `{ title, html, mount(root) }`. The shell
// (app.js) drops `html` into <main> then calls `mount` to wire up events. Plain
// DOM + Fluid custom elements — properties set as DOM props, events via
// addEventListener, exactly how any framework-free app would use them.
import { STATS, USERS, ROLES, STATUS_TONE } from "./data.js";

const notify = (message, variant = "success") =>
  document.getElementById("app-toast")?.toast({ message, variant, duration: 3500 });

/* ----------------------------------------------------------------- Dashboard */
export const dashboard = {
  title: "Dashboard",
  html: `
    <section class="cards">
      ${STATS.map(
        (s) => `
        <fluid-card class="stat">
          <span class="stat-label">${s.label}</span>
          <span class="stat-value">${s.value}</span>
          <fluid-badge variant="${s.tone}">${s.delta}</fluid-badge>
        </fluid-card>`
      ).join("")}
    </section>

    <div class="grid-2">
      <fluid-card class="chart-card">
        <h3 slot="header">Signups · last 6 months</h3>
        <fluid-line-chart id="chart-signups" style="--fluid-chart-height:260px;"></fluid-line-chart>
      </fluid-card>

      <fluid-card class="chart-card">
        <h3 slot="header">Plan mix</h3>
        <fluid-doughnut-chart id="chart-plans" style="--fluid-chart-height:260px;"></fluid-doughnut-chart>
      </fluid-card>
    </div>

    <div class="grid-2">
      <fluid-card>
        <h3 slot="header">Onboarding</h3>
        <fluid-steps variant="chip" current="2" aria-label="Onboarding progress">
          <fluid-step>Create workspace</fluid-step>
          <fluid-step>Invite team</fluid-step>
          <fluid-step>Connect billing</fluid-step>
          <fluid-step>Go live</fluid-step>
        </fluid-steps>
        <p class="muted" style="margin:1rem 0 0;">Two steps left to finish setup.</p>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Storage</h3>
        <div class="usage">
          <div class="usage-row"><span>Documents</span><span class="muted">62%</span></div>
          <fluid-progress-bar value="62"></fluid-progress-bar>
          <div class="usage-row"><span>Media</span><span class="muted">28%</span></div>
          <fluid-progress-bar value="28"></fluid-progress-bar>
          <div class="usage-row"><span>Backups</span><span class="muted">81%</span></div>
          <fluid-progress-bar value="81"></fluid-progress-bar>
        </div>
      </fluid-card>
    </div>
  `,
  // Charts take their data as a property (Chart.js shape). Colors are left to
  // the chart's theme palette so they recolor with the brand/scheme.
  mount(root) {
    const line = root.querySelector("#chart-signups");
    if (line) {
      line.data = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ label: "Signups", data: [320, 410, 380, 520, 610, 740], tension: 0.4, fill: true }]
      };
      line.options = { plugins: { legend: { display: false } } };
    }
    const donut = root.querySelector("#chart-plans");
    if (donut) {
      donut.data = {
        labels: ["Free", "Pro", "Enterprise"],
        datasets: [{ data: [62, 28, 10] }]
      };
    }
  }
};

/* --------------------------------------------------------------------- Users */
let users = [...USERS];

function rowsHtml(filter = "") {
  const q = filter.trim().toLowerCase();
  const list = q
    ? users.filter((u) => (u.name + u.email + u.role).toLowerCase().includes(q))
    : users;
  if (!list.length) return `<tr><td colspan="4" class="empty">No users match “${filter}”.</td></tr>`;
  return list
    .map(
      (u) => `
      <tr data-id="${u.id}">
        <td>
          <div class="user-cell">
            <fluid-avatar size="sm" label="${u.name}"></fluid-avatar>
            <div><div class="user-name">${u.name}</div><div class="muted">${u.email}</div></div>
          </div>
        </td>
        <td><fluid-tag>${u.role}</fluid-tag></td>
        <td><fluid-badge variant="${STATUS_TONE[u.status]}">${u.status}</fluid-badge></td>
        <td class="row-actions">
          <fluid-button size="sm" variant="ghost" data-act="toggle">${u.status === "suspended" ? "Reactivate" : "Suspend"}</fluid-button>
          <fluid-button size="sm" variant="ghost" tone="danger" data-act="remove">Remove</fluid-button>
        </td>
      </tr>`
    )
    .join("");
}

export const usersPage = {
  title: "Users",
  html: `
    <fluid-card>
      <div slot="header" class="table-toolbar">
        <fluid-typeahead id="user-search" placeholder="Search users…" aria-label="Search users" style="max-width:18rem;"></fluid-typeahead>
        <fluid-button id="add-user">
          <fluid-icon slot="prefix" name="plus"></fluid-icon>
          Add user
        </fluid-button>
      </div>
      <table class="table">
        <thead>
          <tr><th>User</th><th>Role</th><th>Status</th><th class="row-actions">Actions</th></tr>
        </thead>
        <tbody id="user-rows">${rowsHtml()}</tbody>
      </table>
    </fluid-card>

    <fluid-dialog id="add-dialog" label="Add user">
      <div class="form-grid">
        <label>Name <fluid-input id="nu-name" placeholder="Jane Doe"></fluid-input></label>
        <label>Email <fluid-input id="nu-email" type="email" placeholder="jane@fluid.dev"></fluid-input></label>
        <label>Role
          <fluid-select id="nu-role" value="Editor">
            ${ROLES.map((r) => `<fluid-option value="${r}">${r}</fluid-option>`).join("")}
          </fluid-select>
        </label>
      </div>
      <div slot="footer" class="dialog-actions">
        <fluid-button variant="ghost" id="nu-cancel">Cancel</fluid-button>
        <fluid-button id="nu-save">Add user</fluid-button>
      </div>
    </fluid-dialog>
  `,
  mount(root) {
    const tbody = root.querySelector("#user-rows");
    const search = root.querySelector("#user-search");
    const dialog = root.querySelector("#add-dialog");

    const rerender = () => (tbody.innerHTML = rowsHtml(search.value || ""));

    search.addEventListener("fluid-input", rerender);

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = Number(btn.closest("tr").dataset.id);
      const user = users.find((u) => u.id === id);
      if (!user) return;
      if (btn.dataset.act === "remove") {
        users = users.filter((u) => u.id !== id);
        notify(`Removed ${user.name}.`, "neutral");
      } else {
        user.status = user.status === "suspended" ? "active" : "suspended";
        notify(`${user.name} is now ${user.status}.`, user.status === "active" ? "success" : "warning");
      }
      rerender();
    });

    root.querySelector("#add-user").addEventListener("click", () => (dialog.open = true));
    root.querySelector("#nu-cancel").addEventListener("click", () => (dialog.open = false));
    root.querySelector("#nu-save").addEventListener("click", () => {
      const name = root.querySelector("#nu-name").value.trim();
      const email = root.querySelector("#nu-email").value.trim();
      const role = root.querySelector("#nu-role").value;
      if (!name || !email) {
        notify("Name and email are required.", "danger");
        return;
      }
      users = [{ id: Date.now(), name, email, role, status: "invited" }, ...users];
      dialog.open = false;
      root.querySelector("#nu-name").value = "";
      root.querySelector("#nu-email").value = "";
      rerender();
      notify(`Invited ${name}.`, "success");
    });
  }
};

/* ------------------------------------------------------------------ Settings */
export const settings = {
  title: "Settings",
  html: `
    <fluid-card>
      <h3 slot="header">Workspace</h3>
      <div class="form-grid">
        <label>Workspace name <fluid-input value="Fluid Inc."></fluid-input></label>
        <label>Support email <fluid-input type="email" value="support@fluid.dev"></fluid-input></label>
        <label>Default density
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
        <div class="toggle-row"><div><strong>Product updates</strong><div class="muted">News about releases.</div></div><fluid-switch checked></fluid-switch></div>
        <div class="toggle-row"><div><strong>Security alerts</strong><div class="muted">Sign-ins and changes.</div></div><fluid-switch checked></fluid-switch></div>
        <div class="toggle-row"><div><strong>Weekly digest</strong><div class="muted">A Monday summary.</div></div><fluid-switch></fluid-switch></div>
      </div>
      <div slot="footer" class="dialog-actions">
        <fluid-button id="save-settings">Save changes</fluid-button>
      </div>
    </fluid-card>
  `,
  mount(root) {
    root.querySelector("#save-settings").addEventListener("click", () =>
      notify("Settings saved.", "success")
    );
  }
};

export const PAGES = { dashboard, users: usersPage, settings };
