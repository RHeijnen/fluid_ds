import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTable, FluidTableColumn, FluidTableRow } from "./fluid-table.js";

const columns: FluidTableColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "age", label: "Age", sortable: true, align: "end" },
  { key: "city", label: "City" }
];

const rows: FluidTableRow[] = [
  { id: "a", name: "Charlie", age: 30, city: "Oslo" },
  { id: "b", name: "Alice", age: 9, city: "Berlin" },
  { id: "c", name: "Bob", age: 22, city: "Paris" }
];

async function table(props: Partial<FluidTable> = {}): Promise<FluidTable> {
  const el = await fixture<FluidTable>(html`<fluid-table caption="People"></fluid-table>`);
  el.columns = columns;
  el.rows = rows;
  Object.assign(el, props);
  await elementUpdated(el);
  return el;
}

describe("<fluid-table>", () => {
  it("renders a semantic table with caption, scoped headers, and a row per datum", async () => {
    const el = await table();
    const root = el.shadowRoot!;
    expect(root.querySelector("caption")?.textContent?.trim()).to.equal("People");
    const ths = root.querySelectorAll("thead th[scope='col']");
    expect(ths.length).to.equal(3);
    expect(root.querySelectorAll("tbody tr").length).to.equal(3);
  });

  it("hides the caption visually but keeps it in the DOM when hide-caption", async () => {
    const el = await table({ hideCaption: true });
    const cap = el.shadowRoot!.querySelector("caption")!;
    expect(cap.classList.contains("sr-only")).to.be.true;
    expect(cap.textContent?.trim()).to.equal("People");
  });

  it("toggles aria-sort and emits fluid-sort on a sortable header", async () => {
    const el = await table();
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>("thead th button")!;
    setTimeout(() => btn.click());
    const ev = await oneEvent(el, "fluid-sort");
    expect(ev.detail).to.deep.equal({ key: "name", dir: "asc" });
    await elementUpdated(el);
    const th = el.shadowRoot!.querySelector("thead th")!;
    expect(th.getAttribute("aria-sort")).to.equal("ascending");
  });

  it("sorts numerically when the column is numeric", async () => {
    const el = await table({ sort: { key: "age", dir: "asc" } });
    await elementUpdated(el);
    const firstCell = el.shadowRoot!.querySelectorAll("tbody tr")[0]!.querySelector("td")!;
    expect(firstCell.textContent?.trim()).to.equal("Alice"); // age 9 sorts first numerically
  });

  it("sorts strings alphabetically and reverses on second click", async () => {
    const el = await table({ sort: { key: "name", dir: "asc" } });
    await elementUpdated(el);
    let first = el.shadowRoot!.querySelectorAll("tbody tr")[0]!.querySelector("td")!;
    expect(first.textContent?.trim()).to.equal("Alice");
    el.sort = { key: "name", dir: "desc" };
    await elementUpdated(el);
    first = el.shadowRoot!.querySelectorAll("tbody tr")[0]!.querySelector("td")!;
    expect(first.textContent?.trim()).to.equal("Charlie");
  });

  it("adds a selection column and emits fluid-selection-change with stable keys", async () => {
    const el = await table({ selectable: true });
    const rowBox = el.shadowRoot!.querySelector<HTMLInputElement>("tbody tr [part='select-row']")!;
    setTimeout(() => {
      rowBox.checked = true;
      rowBox.dispatchEvent(new Event("change"));
    });
    const ev = await oneEvent(el, "fluid-selection-change");
    expect(ev.detail.selected).to.deep.equal(["a"]);
  });

  it("select-all picks every row and reflects as checked", async () => {
    const el = await table({ selectable: true });
    const all = el.shadowRoot!.querySelector<HTMLInputElement>("[part='select-all']")!;
    setTimeout(() => {
      all.checked = true;
      all.dispatchEvent(new Event("change"));
    });
    const ev = await oneEvent(el, "fluid-selection-change");
    expect(ev.detail.selected).to.have.members(["a", "b", "c"]);
    expect(el.selectedKeys).to.have.length(3);
  });

  it("falls back to the row index as the key when no id field is present", async () => {
    const el = await table({ selectable: true });
    el.rows = [{ name: "X" }, { name: "Y" }];
    await elementUpdated(el);
    const box = el.shadowRoot!.querySelectorAll<HTMLInputElement>("tbody [part='select-row']")[1]!;
    setTimeout(() => {
      box.checked = true;
      box.dispatchEvent(new Event("change"));
    });
    const ev = await oneEvent(el, "fluid-selection-change");
    expect(ev.detail.selected).to.deep.equal(["1"]);
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidTable>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
        "
      >
        <fluid-table caption="Accessible table" selectable></fluid-table>
      </div>
    `);
    const t = el.querySelector<FluidTable>("fluid-table")!;
    t.columns = columns;
    t.rows = rows;
    await elementUpdated(t);
    await aTimeout(20);
    await expect(t).to.be.accessible();
  });
});
