import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
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
  it("keeps empty values last in both sort directions", async () => {
    const el = await table({
      rows: [
        { id: "a", age: 2 },
        { id: "b", age: null },
        { id: "c", age: 10 }
      ]
    });
    for (const dir of ["asc", "desc"] as const) {
      el.sort = { key: "age", dir };
      await elementUpdated(el);
      const values = [...el.shadowRoot!.querySelectorAll("tbody tr")].map((row) =>
        row.querySelectorAll("td")[1]!.textContent!.trim()
      );
      expect(values).to.deep.equal(dir === "asc" ? ["2", "10", ""] : ["10", "2", ""]);
    }
  });

  it("keeps index-keyed duplicate row objects independently selectable through sorting", async () => {
    const shared = { name: "Shared", age: 2 };
    const el = await table({
      selectable: true,
      rows: [shared, { name: "Other", age: 1 }, shared],
      sort: { key: "age", dir: "asc" }
    });
    const boxes = [...el.shadowRoot!.querySelectorAll<HTMLInputElement>("tbody input")];
    boxes[2]!.click();
    await elementUpdated(el);
    expect(el.selectedKeys).to.deep.equal(["2"]);
    expect(boxes[1]!.checked).to.be.false;
    expect(boxes[2]!.getAttribute("aria-label")).to.equal("Select row 3");
  });

  it("leaves two empty values in the order they arrived", async () => {
    const el = await table({
      rows: [
        { id: "a", name: "Anna", age: null },
        { id: "b", name: "Bo", age: 5 },
        { id: "c", name: "Cleo", age: "" }
      ],
      sort: { key: "age", dir: "asc" }
    });
    const names = [...el.shadowRoot!.querySelectorAll("tbody tr")].map((row) =>
      row.querySelector("td")!.textContent!.trim()
    );
    // Both empties sort last, and neither jumps the other on the way there.
    expect(names).to.deep.equal(["Bo", "Anna", "Cleo"]);
  });

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

  it("renders no caption at all when the table was given none", async () => {
    const el = await fixture<FluidTable>(html`<fluid-table></fluid-table>`);
    el.columns = columns;
    el.rows = rows;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("caption")).to.equal(null);
    expect(el.shadowRoot!.querySelectorAll("tbody tr")).to.have.length(3);
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

  it("cycles the same header from ascending to descending and back", async () => {
    const el = await table();
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("thead th button")!;
    const directions: string[] = [];
    el.addEventListener("fluid-sort", (event) =>
      directions.push((event as CustomEvent).detail.dir as string)
    );
    const ariaSort = () => el.shadowRoot!.querySelector("thead th")!.getAttribute("aria-sort");
    for (const expected of ["ascending", "descending", "ascending"]) {
      button.click();
      await elementUpdated(el);
      expect(ariaSort()).to.equal(expected);
    }
    expect(directions).to.deep.equal(["asc", "desc", "asc"]);
    const first = el.shadowRoot!.querySelectorAll("tbody tr")[0]!.querySelector("td")!;
    expect(first.textContent?.trim()).to.equal("Alice");
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

  it("drops a row from the selection when its checkbox is cleared again", async () => {
    const el = await table({ selectable: true });
    const box = el.shadowRoot!.querySelector<HTMLInputElement>("tbody [part='select-row']")!;
    box.click();
    await elementUpdated(el);
    expect(el.selectedKeys).to.deep.equal(["a"]);
    setTimeout(() => box.click());
    const event = await oneEvent(el, "fluid-selection-change");
    expect(event.detail.selected).to.deep.equal([]);
    expect(el.selectedKeys).to.deep.equal([]);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("tbody tr")!.hasAttribute("data-selected")).to.be.false;
  });

  it("clears every row when select-all is unchecked again", async () => {
    const el = await table({ selectable: true });
    const all = el.shadowRoot!.querySelector<HTMLInputElement>("[part='select-all']")!;
    all.click();
    await elementUpdated(el);
    expect(el.selectedKeys).to.have.length(3);
    expect(all.checked).to.be.true;
    setTimeout(() => all.click());
    const event = await oneEvent(el, "fluid-selection-change");
    expect(event.detail.selected).to.deep.equal([]);
    await elementUpdated(el);
    expect(all.indeterminate).to.be.false;
    expect(el.shadowRoot!.querySelectorAll("tbody tr[data-selected]")).to.have.length(0);
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

  it("updates inherited Arabic and regional French controls without changing table state or data", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-table caption="<Caller caption>" selectable></fluid-table>
      </div>
    `);
    const el = wrapper.querySelector<FluidTable>("fluid-table")!;
    el.columns = columns;
    el.rows = rows;
    el.sort = { key: "age", dir: "desc" };
    await elementUpdated(el);
    const rowBox = el.shadowRoot!.querySelector<HTMLInputElement>('[part="select-row"]')!;
    rowBox.click();
    await elementUpdated(el);
    const rowReference = el.rows;
    const columnReference = el.columns;
    const selected = [...el.selectedKeys];
    const sort = el.sort;
    const events: Event[] = [];
    el.addEventListener("fluid-sort", (event) => events.push(event));
    el.addEventListener("fluid-selection-change", (event) => events.push(event));
    expect(el.shadowRoot!.querySelector<HTMLElement>("table")!.dir).to.equal("rtl");
    expect(
      el.shadowRoot!.querySelector('[part="select-all"]')!.getAttribute("aria-label")
    ).to.equal("تحديد كل الصفوف");
    const firstPosition = new Intl.NumberFormat("ar", { useGrouping: false }).format(1);
    expect(rowBox.getAttribute("aria-label")).to.equal(`تحديد الصف ${firstPosition}`);
    expect(el.shadowRoot!.querySelector("caption")!.textContent?.trim()).to.equal(
      "<Caller caption>"
    );
    expect(el.shadowRoot!.querySelector("tbody")!.textContent).to.contain("Oslo");

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector('[part="select-all"]')!.getAttribute("aria-label")
    ).to.equal("Sélectionner toutes les lignes");
    expect(el.rows).to.equal(rowReference);
    expect(el.columns).to.equal(columnReference);
    expect(el.sort).to.equal(sort);
    expect(el.selectedKeys).to.deep.equal(selected);
    expect(events).to.deep.equal([]);
  });
});
