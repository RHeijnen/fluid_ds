/**
 * Data table demo, the infinite table from the Fluid table expansion
 * pack on an operations-sized dataset. Exercises:
 *
 *   - Columns and rows set as properties, with Lit `html` cell renderers
 *     (status badge, stacked two-line customer cell, right-aligned money,
 *     formatted dates, nested `path` reads)
 *   - Infinite loading from a fake async source (pages of 50 out of a
 *     few thousand generated orders) driving total / availableTotal /
 *     hasMore / loading
 *   - Virtual windowing with a fixed row height
 *   - Container scroll mode with `--fluid-infinite-table-height`
 *   - Sortable columns, re-sorting the dataset and resetting pages
 *   - A projected filter bar (search input + status select) and a
 *     toolbar-secondary row of removable filter chips
 *   - The column manager (`configurable`), reorderable + resizable
 *     columns, and the horizontal column-scroll strip
 *   - Layout persistence to localStorage with a reset button
 *   - Clickable rows opening a detail dialog, and an empty slot
 */
import "./shared/register-fluid.js";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";
import { html } from "lit";
import type {
  FluidInfiniteTable,
  FluidInfiniteTableColumn,
  FluidInfiniteTableLayoutItem
} from "@fluid-ds/table";

type OrderStatus = "Paid" | "Pending" | "Refunded" | "Failed";

type Order = {
  id: string;
  number: string;
  customer: { name: string; email: string };
  status: OrderStatus;
  channel: string;
  payment: string;
  items: number;
  amount: number;
  region: { city: string; country: string };
  courier: string;
  tracking: string;
  placed: string;
};

// Synthetic dataset. Seeded so every reload shows the same orders.

const TOTAL_ORDERS = 4200;
const PAGE_SIZE = 50;
const LOAD_DELAY_MS = 350;
const LAYOUT_KEY = "fluid-demo.data-table.layout.v1";

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const pick = <T>(list: readonly T[], r: number): T =>
  list[Math.floor(r * list.length) % list.length]!;

const FIRST = [
  "Iris",
  "Marco",
  "Aisha",
  "Oliver",
  "Soraya",
  "Henrik",
  "Yuki",
  "Daria",
  "Lena",
  "Tom",
  "Priya",
  "Jonas",
  "Mei",
  "Carlos",
  "Amara",
  "Finn",
  "Noor",
  "Pavel",
  "Sofia",
  "Ethan"
] as const;
const LAST = [
  "Chen",
  "Diaz",
  "Khan",
  "Pratt",
  "Lopes",
  "Berg",
  "Tanaka",
  "Ivanov",
  "Visser",
  "Novak",
  "Sharma",
  "Meyer",
  "Lindqvist",
  "Okafor",
  "Costa",
  "Moreau",
  "Haddad",
  "Kowalski",
  "Nilsen",
  "Baker"
] as const;
const CITIES: readonly (readonly [string, string])[] = [
  ["Amsterdam", "Netherlands"],
  ["Rotterdam", "Netherlands"],
  ["Berlin", "Germany"],
  ["Hamburg", "Germany"],
  ["Paris", "France"],
  ["Lyon", "France"],
  ["Madrid", "Spain"],
  ["Milan", "Italy"],
  ["Copenhagen", "Denmark"],
  ["Oslo", "Norway"],
  ["Vienna", "Austria"],
  ["Dublin", "Ireland"]
];
// Weighted: most orders in a healthy shop are paid.
const STATUSES: readonly OrderStatus[] = [
  "Paid",
  "Paid",
  "Paid",
  "Paid",
  "Pending",
  "Pending",
  "Refunded",
  "Failed"
];
const CHANNELS = ["Web", "Mobile", "Marketplace", "POS"] as const;
const PAYMENTS = ["Card", "iDEAL", "PayPal", "Invoice", "Gift card"] as const;
const COURIERS = ["PostNL", "DHL", "UPS", "DPD", "GLS"] as const;

function generateOrders(count: number): Order[] {
  const rand = makeRng(20260825);
  const start = Date.UTC(2024, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST, rand());
    const last = pick(LAST, rand());
    const [city, country] = pick(CITIES, rand());
    return {
      id: `o${i + 1}`,
      number: `ORD-${90_000 + i}`,
      customer: {
        name: `${first} ${last}`,
        email: `${first}.${last}@example.com`.toLowerCase()
      },
      status: pick(STATUSES, rand()),
      channel: pick(CHANNELS, rand()),
      payment: pick(PAYMENTS, rand()),
      items: 1 + Math.floor(rand() * 9),
      amount: Math.round((8 + rand() * 940) * 100) / 100,
      region: { city, country },
      courier: pick(COURIERS, rand()),
      tracking: `3S${String(Math.floor(rand() * 1e9)).padStart(9, "0")}NL`,
      placed: new Date(start + Math.floor(rand() * 600) * 86_400_000).toISOString().slice(0, 10)
    };
  });
}

const ALL_ORDERS = generateOrders(TOTAL_ORDERS);

const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const statusVariant: Record<OrderStatus, string> = {
  Paid: "success",
  Pending: "warning",
  Refunded: "info",
  Failed: "danger"
};

// Twelve columns, wider together than the container, so the horizontal
// column-scroll strip has real work to do.
const columns: FluidInfiniteTableColumn<Order>[] = [
  {
    key: "number",
    label: "Order",
    width: "8.5rem",
    sortable: true,
    renderCell: ({ row }) => html`<strong>${row.number}</strong>`
  },
  {
    key: "customer",
    label: "Customer",
    width: "16rem",
    sortable: true,
    // Stacked two-line cell: name on top, email below.
    renderCell: ({ row }) => html`
      <div style="display: grid; line-height: 1.35;">
        <span style="font-weight: 600;">${row.customer.name}</span>
        <span style="color: var(--fluid-text-secondary); font-size: 0.8125rem;"
          >${row.customer.email}</span
        >
      </div>
    `
  },
  {
    key: "status",
    label: "Status",
    width: "8.5rem",
    sortable: true,
    renderCell: ({ row }) =>
      html`<fluid-badge variant=${statusVariant[row.status]}>${row.status}</fluid-badge>`
  },
  {
    key: "amount",
    label: "Amount",
    width: "8rem",
    align: "end",
    sortable: true,
    renderCell: ({ row }) =>
      html`<span style="font-variant-numeric: tabular-nums;">${money.format(row.amount)}</span>`
  },
  {
    key: "items",
    label: "Items",
    width: "6rem",
    align: "end",
    sortable: true
  },
  {
    key: "placed",
    label: "Placed",
    width: "9rem",
    sortable: true,
    renderCell: ({ row }) => html`<span>${shortDate.format(new Date(row.placed))}</span>`
  },
  // Nested reads: no renderer, the table walks the dot path itself.
  { key: "city", path: "region.city", label: "City", width: "9.5rem", sortable: true },
  { key: "country", path: "region.country", label: "Country", width: "9.5rem", sortable: true },
  { key: "channel", label: "Channel", width: "8.5rem", sortable: true },
  { key: "payment", label: "Payment", width: "8.5rem" },
  { key: "courier", label: "Courier", width: "8rem" },
  {
    key: "tracking",
    label: "Tracking",
    width: "11rem",
    renderCell: ({ row }) => html`<code style="font-size: 0.8125rem;">${row.tracking}</code>`
  }
];

// Page shell

const main = mountShell({ title: "Data table", currentRoute: "data-table" });
mountDesignOverlay();

const revenue = ALL_ORDERS.reduce((sum, o) => sum + (o.status === "Paid" ? o.amount : 0), 0);
const pendingCount = ALL_ORDERS.filter((o) => o.status === "Pending").length;
const refundedCount = ALL_ORDERS.filter((o) => o.status === "Refunded").length;

const FEATURES = [
  "Virtual windowing",
  "Infinite loading",
  "Sortable columns",
  "Reorder + resize",
  "Column manager",
  "Column scroll",
  "Persistent layout",
  "Clickable rows"
];

main.innerHTML = `
  <fluid-breadcrumb>
    <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
    <fluid-breadcrumb-item>Orders</fluid-breadcrumb-item>
  </fluid-breadcrumb>

  <header style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem 0 0.75rem;">
    <div>
      <h1 style="margin: 0 0 0.25rem;">Orders</h1>
      <p style="margin: 0; color: var(--fluid-text-secondary);">
        ${TOTAL_ORDERS.toLocaleString()} orders behind one infinite table, loaded 50 at a time.
      </p>
    </div>
    <fluid-button id="new-order">
      <fluid-icon slot="prefix" name="plus"></fluid-icon>
      New order
    </fluid-button>
  </header>

  <p style="margin: 0 0 1rem; max-width: 60rem; color: var(--fluid-text-secondary); font-size: 0.9rem;">
    The table below runs in container scroll mode: a fixed-height viewport set with
    <code>--fluid-infinite-table-height</code>, so the page stays tidy. Switch it to
    <code>scroll-mode="document"</code> and it scrolls with the page instead, sticky
    toolbar and header included. Drag a header to reorder, drag its trailing grip to
    resize, and your layout survives a reload.
  </p>

  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0 0 1.25rem;">
    ${FEATURES.map((f) => `<fluid-tag size="sm">${f}</fluid-tag>`).join("")}
  </div>

  <!-- KPI strip -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
    ${[
      ["Orders", TOTAL_ORDERS.toLocaleString(), "users", "var(--fluid-text-secondary)"],
      [
        "Paid revenue",
        money.format(Math.round(revenue)),
        "circle-check",
        "var(--fluid-color-success, #16a34a)"
      ],
      ["Pending", pendingCount.toLocaleString(), "bell", "var(--fluid-color-warning, #d97706)"],
      ["Refunded", refundedCount.toLocaleString(), "circle-x", "var(--fluid-color-info, #2563eb)"]
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

  <fluid-infinite-table
    id="orders-table"
    caption="Orders"
    hide-caption
    configurable
    clickable
    reorderable-columns
    resizable-columns
    column-scroll
    scroll-mode="container"
    row-height="64"
    row-key="id"
    style="--fluid-infinite-table-height: 34rem;"
  >
    <div slot="filters" style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
      <fluid-input id="order-search" size="sm" placeholder="Search order, customer, city…" aria-label="Search orders" style="flex: 1 1 16rem; max-width: 22rem;">
        <fluid-icon slot="prefix" name="search"></fluid-icon>
      </fluid-input>
      <fluid-select id="status-filter" value="" aria-label="Status filter" size="sm" style="min-width: 9rem;">
        <fluid-option value="">All statuses</fluid-option>
        <fluid-option value="Paid">Paid</fluid-option>
        <fluid-option value="Pending">Pending</fluid-option>
        <fluid-option value="Refunded">Refunded</fluid-option>
        <fluid-option value="Failed">Failed</fluid-option>
      </fluid-select>
    </div>

    <div slot="toolbar-actions" style="display: flex; align-items: center; gap: 0.4rem;">
      <fluid-button id="export-btn" variant="secondary" size="sm">
        <fluid-icon slot="prefix" name="download"></fluid-icon>
        Export
      </fluid-button>
      <fluid-button id="reset-layout" variant="ghost" size="sm">Reset layout</fluid-button>
    </div>

    <div slot="toolbar-secondary" id="filter-chips" style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; font-size: 0.8125rem; color: var(--fluid-text-secondary);"></div>

    <div slot="empty" style="text-align: center; padding: 1.5rem 1rem;">
      <fluid-icon name="search-x" style="--fluid-icon-size: 2rem; display: block; margin: 0 auto 0.5rem; opacity: 0.5;"></fluid-icon>
      <strong style="display: block; color: var(--fluid-text-primary); margin-bottom: 0.25rem;">No orders match</strong>
      <div style="font-size: 0.9rem; color: var(--fluid-text-secondary);">Try a different search or clear the status filter.</div>
      <fluid-button variant="ghost" size="sm" id="empty-clear" style="margin-top: 0.75rem;">Clear filters</fluid-button>
    </div>
  </fluid-infinite-table>

  <fluid-dialog id="row-dialog" size="sm">
    <span slot="label" id="row-dialog-title">Order</span>
    <div id="row-dialog-body"></div>
    <div slot="footer" style="display: flex; justify-content: flex-end;">
      <fluid-button variant="ghost" id="row-dialog-close">Close</fluid-button>
    </div>
  </fluid-dialog>

  <fluid-toast id="toaster" placement="top-end"></fluid-toast>
`;

// Wire interactions

const $ = <T extends Element>(sel: string): T | null => document.querySelector<T>(sel);

const table = $<FluidInfiniteTable>("#orders-table")!;
const toaster = $<HTMLElement & { toast: (o: { message: string; variant: string }) => void }>(
  "#toaster"
);

// Restore a persisted column layout before the first render of columns.
try {
  const saved = localStorage.getItem(LAYOUT_KEY);
  if (saved) table.layout = JSON.parse(saved) as FluidInfiniteTableLayoutItem[];
} catch {
  // Ignore an unreadable snapshot: the declared column order is the fallback.
}

table.columns = columns as unknown as FluidInfiniteTableColumn[];

// Fake async source: filter + sort the full dataset, then hand out
// pages of PAGE_SIZE with a short delay, the way a paged API would.

let query = "";
let statusFilter = "";
let sortState: { key: string; dir: "asc" | "desc" } | null = null;
let working: Order[] = [];
let loaded = 0;
let loadToken = 0;

function sortValue(order: Order, key: string): string | number {
  switch (key) {
    case "customer":
      return order.customer.name;
    case "city":
      return order.region.city;
    case "country":
      return order.region.country;
    default: {
      const value = (order as Record<string, unknown>)[key];
      return typeof value === "number" ? value : String(value ?? "");
    }
  }
}

function applyPipeline(): void {
  const q = query.toLowerCase().trim();
  let rows = ALL_ORDERS;
  if (q) {
    rows = rows.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.region.city.toLowerCase().includes(q) ||
        o.tracking.toLowerCase().includes(q)
    );
  }
  if (statusFilter) rows = rows.filter((o) => o.status === statusFilter);
  if (sortState) {
    const { key, dir } = sortState;
    const sign = dir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va).localeCompare(String(vb)) * sign;
    });
  }
  working = rows;
}

async function loadPage(): Promise<void> {
  if (table.loading || loaded >= working.length) return;
  const token = loadToken;
  table.loading = true;
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  // A filter or sort arrived while this page was in flight: drop it.
  if (token !== loadToken) return;
  loaded = Math.min(loaded + PAGE_SIZE, working.length);
  table.rows = working.slice(0, loaded);
  table.hasMore = loaded < working.length;
  table.loading = false;
}

function resetAndLoad(): void {
  loadToken += 1;
  applyPipeline();
  loaded = 0;
  table.loading = false;
  table.rows = [];
  table.total = working.length;
  table.availableTotal = ALL_ORDERS.length;
  table.hasMore = working.length > 0;
  renderChips();
  void loadPage();
}

table.addEventListener("fluid-load-more", () => void loadPage());

table.addEventListener("fluid-sort", (e) => {
  sortState = (e as CustomEvent<{ key: string; dir: "asc" | "desc" }>).detail;
  resetAndLoad();
});

// Filters: search + status select, both narrowing the fake dataset so
// the readout shows "loaded of matching · total".

const searchInput = $<HTMLElement & { value: string }>("#order-search");
const statusSelect = $<HTMLElement & { value: string }>("#status-filter");

searchInput?.addEventListener("fluid-input", () => {
  query = searchInput.value ?? "";
  resetAndLoad();
});

statusSelect?.addEventListener("fluid-change", () => {
  statusFilter = statusSelect.value ?? "";
  resetAndLoad();
});

function clearFilters(): void {
  query = "";
  statusFilter = "";
  if (searchInput) searchInput.value = "";
  if (statusSelect) statusSelect.value = "";
  resetAndLoad();
}

$<HTMLElement>("#empty-clear")?.addEventListener("click", clearFilters);

/** Removable chips in the toolbar-secondary slot mirror the active filters. */
function renderChips(): void {
  const host = $<HTMLElement>("#filter-chips");
  if (!host) return;
  host.textContent = "";
  const label = document.createElement("span");
  const active: Array<{ text: string; clear: () => void }> = [];
  if (query.trim()) {
    active.push({
      text: `Search: ${query.trim()}`,
      clear: () => {
        query = "";
        if (searchInput) searchInput.value = "";
        resetAndLoad();
      }
    });
  }
  if (statusFilter) {
    active.push({
      text: `Status: ${statusFilter}`,
      clear: () => {
        statusFilter = "";
        if (statusSelect) statusSelect.value = "";
        resetAndLoad();
      }
    });
  }
  label.textContent = active.length ? "Active filters:" : "No active filters";
  host.appendChild(label);
  for (const chip of active) {
    const tag = document.createElement("fluid-tag");
    tag.setAttribute("size", "sm");
    tag.setAttribute("variant", "info");
    tag.setAttribute("removable", "");
    tag.setAttribute("remove-label", `Remove filter ${chip.text}`);
    tag.textContent = chip.text;
    tag.addEventListener("fluid-remove", chip.clear);
    host.appendChild(tag);
  }
  if (active.length > 1) {
    const clearAll = document.createElement("button");
    clearAll.type = "button";
    clearAll.textContent = "Clear all";
    clearAll.style.cssText =
      "border: 0; background: transparent; color: var(--fluid-accent-base); font: inherit; font-size: 0.8125rem; cursor: pointer; padding: 0.15rem 0.3rem;";
    clearAll.addEventListener("click", clearFilters);
    host.appendChild(clearAll);
  }
}

// Layout persistence: the table hands over a complete layout on every
// visibility, order or width change, ready to store as-is.

table.addEventListener("fluid-column-layout-change", (e) => {
  const { layout } = (e as CustomEvent<{ layout: FluidInfiniteTableLayoutItem[] }>).detail;
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Storage full or blocked: the session keeps its layout, it just won't survive a reload.
  }
});

$<HTMLElement>("#reset-layout")?.addEventListener("click", () => {
  try {
    localStorage.removeItem(LAYOUT_KEY);
  } catch {
    // Nothing stored to remove.
  }
  table.layout = [];
  toaster?.toast({ message: "Column layout reset to defaults", variant: "info" });
});

// Row click opens the detail dialog. Clicks on interactive cell content
// are filtered out by the table itself.

const rowDialog = $<HTMLElement & { show: () => void; hide: () => void }>("#row-dialog");

table.addEventListener("fluid-row-click", (e) => {
  const { row } = (e as CustomEvent<{ row: Order }>).detail;
  const title = $<HTMLElement>("#row-dialog-title");
  if (title) title.textContent = `${row.number} · ${row.customer.name}`;
  const body = $<HTMLElement>("#row-dialog-body");
  if (body) {
    body.textContent = "";
    const list = document.createElement("dl");
    list.style.cssText =
      "display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1rem; margin: 0; font-size: 0.9rem;";
    const entries: Array<[string, string]> = [
      ["Status", row.status],
      ["Amount", money.format(row.amount)],
      ["Items", String(row.items)],
      ["Placed", shortDate.format(new Date(row.placed))],
      ["Customer", `${row.customer.name} (${row.customer.email})`],
      ["Ships to", `${row.region.city}, ${row.region.country}`],
      ["Channel", row.channel],
      ["Payment", row.payment],
      ["Courier", `${row.courier} · ${row.tracking}`]
    ];
    for (const [term, value] of entries) {
      const dt = document.createElement("dt");
      dt.textContent = term;
      dt.style.cssText = "color: var(--fluid-text-secondary); font-weight: 600;";
      const dd = document.createElement("dd");
      dd.textContent = value;
      dd.style.margin = "0";
      list.append(dt, dd);
    }
    body.appendChild(list);
  }
  rowDialog?.show();
});

$<HTMLElement>("#row-dialog-close")?.addEventListener("click", () => rowDialog?.hide());

// Toolbar actions

$<HTMLElement>("#export-btn")?.addEventListener("click", () => {
  toaster?.toast({
    message: `Exported ${table.rows.length.toLocaleString()} loaded rows as CSV (demo only)`,
    variant: "success"
  });
});

$<HTMLElement>("#new-order")?.addEventListener("click", () => {
  toaster?.toast({ message: "New order created (demo only)", variant: "success" });
});

// First page
resetAndLoad();
