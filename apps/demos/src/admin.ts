/**
 * Admin / data demo, what a moderation queue or user-management page
 * tends to look like. Exercises:
 *
 *   - Filter bar (input + select)
 *   - Bulk-select rows (header checkbox + per-row)
 *   - A dropdown for bulk actions
 *   - A row of status badges + tags
 *   - A confirm-delete dialog
 *   - Toast feedback after actions
 *
 * Rows are static, but the interaction model is real: bulk-select
 * toggles the bulk-action button's enabled state, the filter input
 * narrows visible rows live, the confirm dialog uses a real
 * `<fluid-dialog>` with focus trap.
 */
import "./shared/register-fluid.js";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  status: "Active" | "Invited" | "Suspended";
  joined: string;
}

const USERS: User[] = [
  { id: "u1", name: "Iris Chen", email: "iris@example.com", role: "Owner", status: "Active", joined: "2023-04-12" },
  { id: "u2", name: "Marco Diaz", email: "marco@example.com", role: "Admin", status: "Active", joined: "2023-06-30" },
  { id: "u3", name: "Aisha Khan", email: "aisha@example.com", role: "Member", status: "Active", joined: "2024-01-14" },
  { id: "u4", name: "Oliver Pratt", email: "oliver@example.com", role: "Member", status: "Invited", joined: "2024-08-02" },
  { id: "u5", name: "Soraya Lopes", email: "soraya@example.com", role: "Member", status: "Active", joined: "2024-09-19" },
  { id: "u6", name: "Henrik Berg", email: "henrik@example.com", role: "Guest", status: "Suspended", joined: "2024-11-03" },
  { id: "u7", name: "Yuki Tanaka", email: "yuki@example.com", role: "Member", status: "Active", joined: "2025-02-21" },
  { id: "u8", name: "Daria Ivanov", email: "daria@example.com", role: "Admin", status: "Active", joined: "2025-03-10" }
];

const statusVariant: Record<User["status"], string> = {
  Active: "success",
  Invited: "info",
  Suspended: "danger"
};

const main = mountShell({ title: "Admin", currentRoute: "admin" });
mountDesignOverlay();

const totalCount = USERS.length;
const activeCount = USERS.filter((u) => u.status === "Active").length;
const invitedCount = USERS.filter((u) => u.status === "Invited").length;
const suspendedCount = USERS.filter((u) => u.status === "Suspended").length;

main.innerHTML = `
  <fluid-breadcrumb>
    <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
    <fluid-breadcrumb-item>Team members</fluid-breadcrumb-item>
  </fluid-breadcrumb>

  <header style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem 0 1.5rem;">
    <div>
      <h1 style="margin: 0 0 0.25rem;">Team members</h1>
      <p style="margin: 0; color: var(--fluid-text-secondary);">${totalCount} people in your workspace</p>
    </div>
    <fluid-button>
      <fluid-icon slot="prefix" name="plus"></fluid-icon>
      Invite member
    </fluid-button>
  </header>

  <!-- KPI strip -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
    ${[
      ["Total", totalCount, "users", "var(--fluid-text-secondary)"],
      ["Active", activeCount, "circle-check", "var(--fluid-color-success, #16a34a)"],
      ["Invited", invitedCount, "bell", "var(--fluid-color-info, #2563eb)"],
      ["Suspended", suspendedCount, "circle-x", "var(--fluid-color-danger, #dc2626)"]
    ]
      .map(
        ([label, value, icon, color]) => `
        <fluid-card>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 2.25rem;
              height: 2.25rem;
              border-radius: 999px;
              background: color-mix(in srgb, ${color} 18%, transparent);
              color: ${color};
            ">
              <fluid-icon name="${icon}" style="--fluid-icon-size: 1.1rem;"></fluid-icon>
            </span>
            <div>
              <div style="font-size: 0.75rem; color: var(--fluid-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">${label}</div>
              <strong style="font-size: 1.4rem;">${value}</strong>
            </div>
          </div>
        </fluid-card>
      `
      )
      .join("")}
  </div>

  <fluid-card>
    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding-bottom: 1rem; border-bottom: 1px solid var(--fluid-border-default); margin: -0.5rem 0 1rem;">
      <fluid-input id="filter-input" placeholder="Search by name or email…" aria-label="Filter" style="flex: 1 1 18rem;">
        <fluid-icon slot="prefix" name="search"></fluid-icon>
      </fluid-input>

      <fluid-select id="role-filter" value="" aria-label="Role filter" size="sm" style="min-width: 8rem;">
        <fluid-option value="">All roles</fluid-option>
        <fluid-option value="Owner">Owner</fluid-option>
        <fluid-option value="Admin">Admin</fluid-option>
        <fluid-option value="Member">Member</fluid-option>
        <fluid-option value="Guest">Guest</fluid-option>
      </fluid-select>

      <fluid-dropdown id="bulk-menu">
        <fluid-button slot="trigger" variant="secondary" id="bulk-trigger" disabled>
          Bulk actions
          <fluid-icon slot="suffix" name="chevron-down"></fluid-icon>
        </fluid-button>
        <fluid-dropdown-item id="bulk-suspend">Suspend selected</fluid-dropdown-item>
        <fluid-dropdown-item id="bulk-resend">Resend invitations</fluid-dropdown-item>
        <fluid-dropdown-item type="separator"></fluid-dropdown-item>
        <fluid-dropdown-item id="bulk-delete">Delete selected…</fluid-dropdown-item>
      </fluid-dropdown>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
      <thead>
        <tr style="text-align: left; color: var(--fluid-text-secondary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;">
          <th style="width: 2rem; padding: 0.5rem;">
            <fluid-checkbox id="select-all" aria-label="Select all"></fluid-checkbox>
          </th>
          <th style="padding: 0.5rem;">Name</th>
          <th style="padding: 0.5rem;">Role</th>
          <th style="padding: 0.5rem;">Status</th>
          <th style="padding: 0.5rem;">Joined</th>
          <th style="padding: 0.5rem; width: 3rem;"></th>
        </tr>
      </thead>
      <tbody id="rows-loading">
        ${Array.from(
          { length: 4 },
          () => `
          <tr style="border-top: 1px solid var(--fluid-border-default);">
            <td colspan="6" style="padding: 0.65rem 0.5rem;">
              <fluid-skeleton style="height: 2rem;"></fluid-skeleton>
            </td>
          </tr>`
        ).join("")}
      </tbody>
      <tbody id="rows" hidden>
        ${USERS.map(
          (u) => `
          <tr data-id="${u.id}" data-name="${u.name}" data-email="${u.email}" data-role="${u.role}" style="border-top: 1px solid var(--fluid-border-default);">
            <td style="padding: 0.65rem 0.5rem;">
              <fluid-checkbox class="row-check" aria-label="Select ${u.name}"></fluid-checkbox>
            </td>
            <td style="padding: 0.65rem 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <fluid-avatar size="sm" initials="${u.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}"></fluid-avatar>
                <div>
                  <div style="font-weight: 600;">${u.name}</div>
                  <div style="color: var(--fluid-text-secondary); font-size: 0.85rem;">${u.email}</div>
                </div>
              </div>
            </td>
            <td style="padding: 0.65rem 0.5rem;">${u.role}</td>
            <td style="padding: 0.65rem 0.5rem;">
              <fluid-badge variant="${statusVariant[u.status]}">${u.status}</fluid-badge>
            </td>
            <td style="padding: 0.65rem 0.5rem; color: var(--fluid-text-secondary);">${u.joined}</td>
            <td style="padding: 0.65rem 0.5rem; text-align: right;">
              <fluid-button variant="ghost" size="sm" aria-label="Row actions">
                <fluid-icon name="ellipsis"></fluid-icon>
              </fluid-button>
            </td>
          </tr>
        `
        ).join("")}
      </tbody>
      <tbody id="rows-empty" hidden>
        <tr>
          <td colspan="6" style="padding: 3rem 1rem; text-align: center; color: var(--fluid-text-secondary);">
            <fluid-icon name="search-x" style="--fluid-icon-size: 2rem; display:block; margin: 0 auto 0.5rem; opacity: 0.5;"></fluid-icon>
            <strong style="display: block; color: var(--fluid-text-primary); margin-bottom: 0.25rem;">No members match</strong>
            <div style="font-size: 0.9rem;">Try a different search or clear the role filter.</div>
            <fluid-button variant="ghost" size="sm" id="clear-filters" style="margin-top: 0.75rem;">
              Clear filters
            </fluid-button>
          </td>
        </tr>
      </tbody>
    </table>
  </fluid-card>

  <fluid-dialog id="confirm-dialog" size="sm">
    <span slot="label">Delete <span id="del-count">0</span> member<span id="del-plural">s</span>?</span>
    <p>This removes them from the workspace immediately. They'll lose access to all projects.</p>
    <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <fluid-button variant="ghost" id="cancel-confirm">Cancel</fluid-button>
      <fluid-button id="ok-confirm" style="--fluid-button-bg: var(--fluid-color-danger);">Delete</fluid-button>
    </div>
  </fluid-dialog>

  <fluid-toast id="toaster" placement="top-end"></fluid-toast>
`;

// Wire interactions

const $ = <T extends Element>(sel: string): T | null =>
  document.querySelector<T>(sel);

const toaster = $<HTMLElement & { toast: (o: { message: string; variant: string }) => void }>(
  "#toaster"
);

function selectedRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("#rows tr")).filter(
    (tr) =>
      (tr.querySelector(".row-check") as HTMLElement & { checked?: boolean })?.checked ?? false
  );
}

function refreshBulkState() {
  const trigger = $<HTMLElement>("#bulk-trigger");
  if (!trigger) return;
  const count = selectedRows().length;
  if (count > 0) trigger.removeAttribute("disabled");
  else trigger.setAttribute("disabled", "");
}

document.querySelectorAll<HTMLElement>(".row-check").forEach((cb) => {
  cb.addEventListener("fluid-change", refreshBulkState as EventListener);
});

$<HTMLElement>("#select-all")?.addEventListener("fluid-change", (e) => {
  const checked = (e as CustomEvent).detail.checked as boolean;
  document
    .querySelectorAll<HTMLElement & { checked: boolean }>(".row-check")
    .forEach((cb) => (cb.checked = checked));
  refreshBulkState();
});

// Live filter, also flips the empty-state visibility.
function applyFilter(): void {
  const q = (
    ($<HTMLElement>("#filter-input") as unknown as { value?: string })?.value ?? ""
  )
    .toLowerCase()
    .trim();
  const role =
    ($<HTMLElement>("#role-filter") as unknown as { value?: string })?.value ?? "";
  let visible = 0;
  document.querySelectorAll<HTMLTableRowElement>("#rows tr").forEach((tr) => {
    const name = (tr.getAttribute("data-name") ?? "").toLowerCase();
    const email = (tr.getAttribute("data-email") ?? "").toLowerCase();
    const r = tr.getAttribute("data-role") ?? "";
    const matchText = !q || name.includes(q) || email.includes(q);
    const matchRole = !role || r === role;
    const show = matchText && matchRole;
    tr.style.display = show ? "" : "none";
    if (show) visible += 1;
  });

  // Toggle empty-state visibility
  const empty = $<HTMLElement>("#rows-empty");
  if (empty) empty.toggleAttribute("hidden", visible > 0);
}

$<HTMLElement>("#filter-input")?.addEventListener("fluid-input", applyFilter);
$<HTMLElement>("#role-filter")?.addEventListener("fluid-change", applyFilter);

/** Clear filter inputs from the empty-state CTA. */
$<HTMLElement>("#clear-filters")?.addEventListener("click", () => {
  const input = $<HTMLElement & { value?: string }>("#filter-input");
  const select = $<HTMLElement & { value?: string }>("#role-filter");
  if (input) input.value = "";
  if (select) select.value = "";
  applyFilter();
});

/**
 * Reveal the real rows once the simulated "fetch" resolves. Until then
 * the loading skeleton at #rows-loading is visible. Mirrors what a
 * real product would do, block the table on the network call.
 */
async function loadUsers(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  $<HTMLElement>("#rows-loading")?.setAttribute("hidden", "");
  $<HTMLElement>("#rows")?.removeAttribute("hidden");
}

void loadUsers();

// Bulk actions
const confirmDialog = $<HTMLElement & { show: () => void; hide: () => void }>("#confirm-dialog");

$<HTMLElement>("#bulk-suspend")?.addEventListener("fluid-select", () => {
  const n = selectedRows().length;
  toaster?.toast({
    message: `Suspended ${n} member${n === 1 ? "" : "s"}`,
    variant: "warning"
  });
});

$<HTMLElement>("#bulk-resend")?.addEventListener("fluid-select", () => {
  const n = selectedRows().length;
  toaster?.toast({
    message: `Resent ${n} invitation${n === 1 ? "" : "s"}`,
    variant: "info"
  });
});

$<HTMLElement>("#bulk-delete")?.addEventListener("fluid-select", () => {
  const n = selectedRows().length;
  const countEl = $<HTMLElement>("#del-count");
  const pluralEl = $<HTMLElement>("#del-plural");
  if (countEl) countEl.textContent = String(n);
  if (pluralEl) pluralEl.textContent = n === 1 ? "" : "s";
  confirmDialog?.show();
});

$<HTMLElement>("#cancel-confirm")?.addEventListener("click", () => confirmDialog?.hide());
$<HTMLElement>("#ok-confirm")?.addEventListener("click", () => {
  const n = selectedRows().length;
  confirmDialog?.hide();
  toaster?.toast({
    message: `Deleted ${n} member${n === 1 ? "" : "s"} (demo only)`,
    variant: "success"
  });
});
