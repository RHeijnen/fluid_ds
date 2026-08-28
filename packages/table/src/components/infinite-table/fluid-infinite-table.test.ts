import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import { html as litHtml } from "lit";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidInfiniteTable, FluidInfiniteTableColumn } from "./fluid-infinite-table.js";

const columns: FluidInfiniteTableColumn[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "domain", path: "owner.domain", label: "Domain" },
  {
    key: "status",
    label: "Status",
    renderCell: ({ row }) => litHtml`<strong>${row["online"] ? "Online" : "Offline"}</strong>`
  }
];

async function setup(): Promise<FluidInfiniteTable> {
  const element = await fixture<FluidInfiniteTable>(html`
    <fluid-infinite-table
      caption="Terminals"
      configurable
      .columns=${columns}
      .rows=${[
        { id: 1, name: "Apollo", owner: { domain: "CURO" }, online: true },
        { id: 2, name: "Polar", owner: { domain: "PAYTER" }, online: false }
      ]}
      .total=${10}
    >
      <div slot="filters">Filters</div>
    </fluid-infinite-table>
  `);
  await elementUpdated(element);
  return element;
}

describe("<fluid-infinite-table>", () => {
  it("exposes header-inclusive counts and absolute row indices for a windowed dataset", async () => {
    const element = await setup();
    expect(element.shadowRoot!.querySelector("table")!.getAttribute("aria-rowcount")).to.equal(
      "11"
    );
    expect(element.shadowRoot!.querySelector("thead tr")!.getAttribute("aria-rowindex")).to.equal(
      "1"
    );
    expect(
      element.shadowRoot!.querySelector("tbody tr[data-row]")!.getAttribute("aria-rowindex")
    ).to.equal("2");
    element.total = 0;
    element.hasMore = true;
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector("table")!.getAttribute("aria-rowcount")).to.equal(
      "-1"
    );
  });

  it("clamps the window after a scrolled dataset is replaced by fewer rows", async () => {
    const element = await setup();
    element.rows = Array.from({ length: 100 }, (_, id) => ({ id, name: `Row ${id}` }));
    (element as unknown as { viewScrollTop: number }).viewScrollTop = 5000;
    await elementUpdated(element);
    element.rows = [{ id: "match", name: "Only match" }];
    await elementUpdated(element);
    const rendered = element.shadowRoot!.querySelectorAll("tbody tr[data-row]");
    expect(rendered).to.have.length(1);
    expect(rendered[0]!.textContent).to.include("Only match");
    expect(rendered[0]!.getAttribute("aria-rowindex")).to.equal("2");
    expect(element.shadowRoot!.querySelector(".spacer")).to.equal(null);
  });

  it("keeps window arithmetic finite for invalid row-height and overscan values", async () => {
    const element = await setup();
    element.rowHeight = 0;
    element.overscan = -5;
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelectorAll("tbody tr[data-row]")).to.have.length(2);
    expect(element.shadowRoot!.querySelector(".viewport")!.getAttribute("style")).not.to.match(
      /NaN|Infinity|height:0px/
    );
  });

  it("restores container scroll observation when the table reconnects", async () => {
    const wrapper = await fixture(html`<div></div>`);
    const element = await setup();
    element.scrollMode = "container";
    element.style.setProperty("--fluid-infinite-table-height", "300px");
    element.rows = Array.from({ length: 100 }, (_, id) => ({ id, name: `Row ${id}` }));
    await elementUpdated(element);
    element.remove();
    wrapper.append(element);
    await aTimeout(30);
    const viewport = element.shadowRoot!.querySelector<HTMLElement>(".viewport")!;
    viewport.scrollTop = 2500;
    viewport.dispatchEvent(new Event("scroll"));
    await aTimeout(30);
    expect(
      Number(element.shadowRoot!.querySelector("tbody tr[data-row]")!.getAttribute("data-row-key"))
    ).to.be.greaterThan(10);
  });

  it("renders native table semantics and projected filters", async () => {
    const element = await setup();
    expect(element.shadowRoot!.querySelector("table")).to.exist;
    expect(element.shadowRoot!.querySelectorAll("th[scope='col']")).to.have.length(3);
    expect(element.querySelector("[slot='filters']")).to.exist;
  });

  it("resolves nested paths and rich cell templates", async () => {
    const element = await setup();
    const cells = element.shadowRoot!.querySelectorAll("tbody tr[data-row] td");
    expect(cells[1]!.textContent?.trim()).to.equal("CURO");
    expect(cells[2]!.querySelector("strong")?.textContent).to.equal("Online");
  });

  it("emits controlled sort requests and updates aria-sort", async () => {
    const element = await setup();
    const button = element.shadowRoot!.querySelector<HTMLButtonElement>(".sort")!;
    setTimeout(() => button.click());
    const event = await oneEvent(element, "fluid-sort");
    expect(event.detail).to.deep.equal({ key: "name", dir: "asc" });
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector("th")?.getAttribute("aria-sort")).to.equal(
      "ascending"
    );
  });

  it("emits a serializable layout when a column is hidden", async () => {
    const element = await setup();
    const open = element.shadowRoot!.querySelector<HTMLButtonElement>(".toolbar-actions button")!;
    open.click();
    const checkbox = element.shadowRoot!.querySelector<HTMLInputElement>(".column-option input")!;
    setTimeout(() => {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change"));
    });
    const event = await oneEvent(element, "fluid-column-layout-change");
    expect(event.detail.layout[0]).to.include({
      key: "name",
      visible: false,
      order: 0
    });
  });

  it("supports keyboard row activation when clickable", async () => {
    const element = await setup();
    element.clickable = true;
    await elementUpdated(element);
    const row = element.shadowRoot!.querySelector<HTMLElement>("tbody tr[data-row]")!;
    setTimeout(() =>
      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = await oneEvent(element, "fluid-row-click");
    expect(event.detail.row["name"]).to.equal("Apollo");
    expect(event.detail.rowIndex).to.equal(0);
  });

  it("is accessible with rich templates and column configuration", async () => {
    const element = await setup();
    await expect(element).to.be.accessible();
    element.shadowRoot!.querySelector<HTMLButtonElement>(".toolbar-actions button")!.click();
    await elementUpdated(element);
    const firstToggle =
      element.shadowRoot!.querySelector<HTMLInputElement>(".column-option input")!;
    expect(firstToggle.labels?.[0]?.textContent?.trim()).to.equal("Name");
    await expect(element).to.be.accessible();
  });
});

describe("<fluid-infinite-table> localization", () => {
  it("updates Arabic and regional French UI live without changing data, state or events", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-infinite-table
          caption="<Caller caption>"
          configurable
          .columns=${columns}
          .rows=${[
            { id: "row-a", name: "Apollo <caller>", owner: { domain: "CURO" }, online: true },
            { id: "row-b", name: "Polar", owner: { domain: "PAYTER" }, online: false }
          ]}
          .total=${10}
          .sort=${{ key: "name", dir: "desc" }}
        ></fluid-infinite-table>
      </div>
    `);
    const element = wrapper.querySelector<FluidInfiniteTable>("fluid-infinite-table")!;
    await elementUpdated(element);
    const rowsReference = element.rows;
    const columnsReference = element.columns;
    const sortReference = element.sort;
    const rowKeys = [...element.shadowRoot!.querySelectorAll<HTMLElement>("[data-row-key]")].map(
      (row) => row.dataset["rowKey"]
    );
    const events: Event[] = [];
    for (const name of [
      "fluid-sort",
      "fluid-column-layout-change",
      "fluid-row-click",
      "fluid-load-more"
    ]) {
      element.addEventListener(name, (event) => events.push(event));
    }
    const loaded = new Intl.NumberFormat("ar").format(2);
    const total = new Intl.NumberFormat("ar").format(10);
    expect(element.shadowRoot!.querySelector<HTMLElement>('[part="viewport"]')!.dir).to.equal(
      "rtl"
    );
    expect(element.shadowRoot!.querySelector('[part="progress"]')!.textContent?.trim()).to.equal(
      `تم تحميل ${loaded} من ${total}`
    );
    expect(element.shadowRoot!.querySelector("caption")!.textContent?.trim()).to.equal(
      "<Caller caption>"
    );
    expect(element.shadowRoot!.querySelector("tbody")!.textContent).to.contain("Apollo <caller>");
    expect(
      element.shadowRoot!.querySelector(".toolbar-actions button")!.textContent?.trim()
    ).to.equal("الأعمدة");
    expect(element.shadowRoot!.querySelector("dialog h2")!.textContent).to.equal("أعمدة الجدول");
    expect(
      element.shadowRoot!.querySelector("dialog .dialog-head button")!.getAttribute("aria-label")
    ).to.equal("إغلاق إعدادات الأعمدة");
    expect(element.shadowRoot!.querySelector('[part="sentinel"]')!.textContent?.trim()).to.equal(
      "تم تحميل كل النتائج"
    );

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('[part="progress"]')!.textContent?.trim()).to.equal(
      "2 chargés sur 10"
    );
    expect(
      element.shadowRoot!.querySelector(".toolbar-actions button")!.textContent?.trim()
    ).to.equal("Colonnes");
    expect(element.shadowRoot!.querySelector('[part="sentinel"]')!.textContent?.trim()).to.equal(
      "Tous les résultats sont chargés"
    );
    expect(element.rows).to.equal(rowsReference);
    expect(element.columns).to.equal(columnsReference);
    expect(element.sort).to.equal(sortReference);
    expect(
      [...element.shadowRoot!.querySelectorAll<HTMLElement>("[data-row-key]")].map(
        (row) => row.dataset["rowKey"]
      )
    ).to.deep.equal(rowKeys);
    expect(events).to.deep.equal([]);
  });

  it("uses Arabic plural forms and localized numerals for result statuses", async () => {
    const element = await fixture<FluidInfiniteTable>(html`
      <fluid-infinite-table lang="ar" .columns=${columns}></fluid-infinite-table>
    `);
    const progress = () =>
      element.shadowRoot!.querySelector('[part="progress"]')!.textContent?.trim();
    expect(progress()).to.equal("لا نتائج");
    expect(element.shadowRoot!.querySelector(".state")!.textContent?.trim()).to.equal(
      "لا توجد نتائج"
    );
    element.loading = true;
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector('[part="sentinel"]')!.textContent?.trim()).to.equal(
      "جارٍ تحميل المزيد من النتائج"
    );
    element.loading = false;
    element.hasMore = true;
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector('[part="sentinel"]')!.textContent?.trim()).to.equal(
      "مرر لتحميل المزيد"
    );
    element.hasMore = false;
    element.rows = [{ id: 1, name: "One" }];
    await elementUpdated(element);
    expect(progress()).to.equal("تم تحميل نتيجة واحدة");
    element.rows = [
      { id: 1, name: "One" },
      { id: 2, name: "Two" }
    ];
    await elementUpdated(element);
    expect(progress()).to.equal("تم تحميل نتيجتين");
    element.rows = Array.from({ length: 11 }, (_, id) => ({ id, name: `Row ${id}` }));
    await elementUpdated(element);
    const eleven = new Intl.NumberFormat("ar").format(11);
    expect(progress()).to.contain(eleven);
  });

  it("preserves application error content and explicit empty slot precedence", async () => {
    const element = await fixture<FluidInfiniteTable>(html`
      <fluid-infinite-table lang="ar" error="<Caller error>">
        <span slot="error"></span>
        <span slot="empty"></span>
      </fluid-infinite-table>
    `);
    const errorSlot = element.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="error"]')!;
    expect(errorSlot.assignedElements()).to.have.length(1);
    expect(errorSlot.assignedElements()[0]!.textContent?.trim()).to.equal("");
    element.error = "";
    await elementUpdated(element);
    const emptySlot = element.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="empty"]')!;
    expect(emptySlot.assignedElements()).to.have.length(1);
    expect(emptySlot.assignedElements()[0]!.textContent?.trim()).to.equal("");
    element.querySelector('[slot="error"]')!.remove();
    element.error = "<Caller error>";
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector('[role="alert"]')!.textContent?.trim()).to.equal(
      "<Caller error>"
    );
  });
});

describe("<fluid-infinite-table> columns a reader can arrange", () => {
  async function arrangeable(): Promise<FluidInfiniteTable> {
    const element = await fixture<FluidInfiniteTable>(html`
      <fluid-infinite-table
        caption="Terminals"
        reorderable-columns
        resizable-columns
        .columns=${columns}
        .rows=${[
          { id: 1, name: "Apollo", owner: { domain: "CURO" }, online: true },
          { id: 2, name: "Polar", owner: { domain: "PAYTER" }, online: false }
        ]}
      ></fluid-infinite-table>
    `);
    await elementUpdated(element);
    return element;
  }

  const handles = (element: FluidInfiniteTable) =>
    element.shadowRoot!.querySelectorAll<HTMLButtonElement>(".grab");
  const grips = (element: FluidInfiniteTable) =>
    element.shadowRoot!.querySelectorAll<HTMLElement>(".grip");
  const order = (element: FluidInfiniteTable) =>
    [...element.shadowRoot!.querySelectorAll("th[data-column]")].map(
      (cell) => (cell as HTMLElement).dataset["column"]
    );

  it("keeps flexible columns within a finite host width before resizing", async () => {
    const element = await arrangeable();
    const table = element.shadowRoot!.querySelector("table")!;
    const hostWidth = element.getBoundingClientRect().width;
    expect(table.getBoundingClientRect().width).to.be.at.most(hostWidth + 1);
  });

  it("gives every header a reorder handle and a resize grip", async () => {
    const element = await arrangeable();
    expect(handles(element)).to.have.length(3);
    expect(grips(element)).to.have.length(3);
    expect(handles(element)[0]!.getAttribute("aria-label")).to.equal("Reorder Name");
    expect(grips(element)[0]!.getAttribute("aria-label")).to.equal("Resize Name");
    // The sort control still works: the handles sit beside it, not inside it.
    expect(element.shadowRoot!.querySelector("th .sort")).to.exist;
  });

  it("starts the header text where the cell text starts", async () => {
    const element = await arrangeable();
    const th = element.shadowRoot!.querySelector<HTMLElement>("th[data-column]")!;
    const label = th.querySelector<HTMLElement>(".header-label")!;
    const padding = parseFloat(getComputedStyle(th).paddingInlineStart);
    // The grab handle overlays the header rather than sitting in the flow, so
    // the label lines up over the column's cells instead of a handle-width
    // to the side of them.
    expect(label.getBoundingClientRect().left - th.getBoundingClientRect().left).to.be.closeTo(
      padding,
      1
    );
  });

  it("truncates a narrowed header and its cells with an ellipsis", async () => {
    const element = await fixture<FluidInfiniteTable>(html`
      <fluid-infinite-table
        caption="Terminals"
        resizable-columns
        .columns=${[
          { key: "name", label: "Name", sortable: true },
          { key: "notes", label: "A considerably long column heading" }
        ] as FluidInfiniteTableColumn[]}
        .rows=${[{ id: 1, name: "Apollo", notes: "A value long enough that it cannot fit" }]}
        .layout=${[
          { key: "name", visible: true, order: 0 },
          { key: "notes", visible: true, order: 1, width: "88px" }
        ]}
      ></fluid-infinite-table>
    `);
    await elementUpdated(element);
    const th = element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")[1]!;
    const label = th.querySelector<HTMLElement>(".header-label")!;
    expect(getComputedStyle(label).textOverflow).to.equal("ellipsis");
    expect(getComputedStyle(label).whiteSpace).to.equal("nowrap");
    expect(label.scrollWidth).to.be.greaterThan(label.clientWidth);
    const cell = element.shadowRoot!.querySelectorAll<HTMLElement>("tbody tr[data-row] td")[1]!;
    expect(getComputedStyle(cell).textOverflow).to.equal("ellipsis");
    expect(getComputedStyle(cell).whiteSpace).to.equal("nowrap");
    expect(cell.scrollWidth).to.be.greaterThan(cell.clientWidth);
  });

  it("truncates a stacked two-line cell a renderer drew itself", async () => {
    const element = await fixture<FluidInfiniteTable>(html`
      <fluid-infinite-table
        caption="Terminals"
        resizable-columns
        .columns=${[
          {
            key: "terminal",
            label: "Terminal",
            renderCell: ({ row }) => litHtml`<span style="display:grid">
              <strong>${row["name"]}</strong>
              <small>${row["serial"]}</small>
            </span>`
          },
          { key: "domain", label: "Domain" }
        ] as FluidInfiniteTableColumn[]}
        .rows=${[
          {
            id: 1,
            name: "[DO NOT USE] A name far too long for the column",
            serial: "APM20242200232-EXTENDED",
            domain: "CURO"
          }
        ]}
        .layout=${[
          { key: "terminal", visible: true, order: 0, width: "100px" },
          { key: "domain", visible: true, order: 1 }
        ]}
      ></fluid-infinite-table>
    `);
    await elementUpdated(element);
    const cell = element.shadowRoot!.querySelector<HTMLElement>("tbody tr[data-row] td")!;
    const line = cell.querySelector("strong")!;
    // The implicit grid track is clamped to the cell instead of sizing to
    // its longest line, so each line overflows its own box and ellipsizes.
    expect(line.getBoundingClientRect().width).to.be.at.most(cell.getBoundingClientRect().width);
    expect(getComputedStyle(line).textOverflow).to.equal("ellipsis");
    expect(line.scrollWidth).to.be.greaterThan(line.clientWidth);
    const sub = cell.querySelector("small")!;
    expect(sub.scrollWidth).to.be.greaterThan(sub.clientWidth);
  });

  it("renders a column at exactly the width it was given, and banks the slack", async () => {
    const element = await arrangeable();
    element.layout = [
      { key: "name", visible: true, order: 0, width: "120px" },
      { key: "domain", visible: true, order: 1, width: "140px" },
      { key: "status", visible: true, order: 2, width: "160px" }
    ];
    await elementUpdated(element);
    const widths = () =>
      [...element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")].map((cell) =>
        Math.round(cell.getBoundingClientRect().width)
      );
    // Fixed layout used to re-share the spare space over the sized columns,
    // so a column asked to be 120px rendered wider. The filler takes it now.
    expect(widths()).to.eql([120, 140, 160]);
    const filler = element.shadowRoot!.querySelector<HTMLElement>("thead td.filler")!;
    expect(filler.getBoundingClientRect().width).to.be.greaterThan(0);

    // While any column is still flexible, the flexible column is the slack
    // and the filler stays collapsed.
    element.layout = [
      { key: "name", visible: true, order: 0, width: "120px" },
      { key: "domain", visible: true, order: 1 },
      { key: "status", visible: true, order: 2, width: "160px" }
    ];
    await elementUpdated(element);
    expect(Math.round(filler.getBoundingClientRect().width)).to.equal(0);
    expect(widths()[0]).to.equal(120);
    expect(widths()[2]).to.equal(160);
  });

  it("refuses to start a column drag from the resize grip", async () => {
    const element = await arrangeable();
    const grip = grips(element)[0]!;
    const started = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    grip.dispatchEvent(started);
    await elementUpdated(element);
    // A gesture on the grip is a resize; reorder must not race it.
    expect(started.defaultPrevented).to.equal(true);
    expect(element.shadowRoot!.querySelector("th[data-dragging]")).to.equal(null);
  });

  it("reports nothing when a drag ends where it began", async () => {
    const element = await arrangeable();
    const changed: unknown[] = [];
    element.addEventListener("fluid-column-layout-change", (event) => changed.push(event));
    const header = element.shadowRoot!.querySelector<HTMLElement>("th[data-column='name']")!;
    const transfer = new DataTransfer();
    header.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: transfer }));
    header.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer })
    );
    header.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
    await elementUpdated(element);
    // A consumer persists every layout it is handed; an unchanged order is
    // not worth a write.
    expect(changed).to.have.length(0);
    expect(order(element)).to.eql(["name", "domain", "status"]);
  });

  it("fits a column to its contents on a double-click of the grip", async () => {
    const element = await arrangeable();
    const grip = grips(element)[0]!;
    setTimeout(() => grip.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    const event = await oneEvent(element, "fluid-column-layout-change");
    const item = event.detail.layout.find((entry: { key: string }) => entry.key === "name");
    expect(item.width).to.match(/px$/);
    expect(parseFloat(item.width)).to.be.at.least(56);
  });

  it("leaves the grip off a column that must not be resized", async () => {
    const element = await arrangeable();
    element.columns = [
      { key: "name", label: "Name", sortable: true },
      { key: "domain", label: "Domain", resizable: false },
      { key: "status", label: "Status" }
    ];
    await elementUpdated(element);
    expect(grips(element)).to.have.length(2);
    expect(element.shadowRoot!.querySelector("th[data-column='domain'] .grip")).to.equal(null);
  });

  it("drops a dragged column beside the header it was dropped on", async () => {
    const element = await arrangeable();
    const from = handles(element)[0]!;
    const onto = element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")[2]!;
    from.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        dataTransfer: new DataTransfer()
      })
    );
    const rect = onto.getBoundingClientRect();
    onto.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientX: rect.right - 2,
        dataTransfer: new DataTransfer()
      })
    );
    setTimeout(() =>
      onto.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        })
      )
    );
    const event = await oneEvent(element, "fluid-column-layout-change");
    expect(event.detail.layout.map((item: { key: string }) => item.key)).to.eql([
      "domain",
      "status",
      "name"
    ]);
    await elementUpdated(element);
    expect(order(element)).to.eql(["domain", "status", "name"]);
  });

  it("previews the drop while dragging, and a cancelled drag puts it back", async () => {
    const element = await arrangeable();
    const changed: unknown[] = [];
    element.addEventListener("fluid-column-layout-change", (event) => changed.push(event));
    const from = handles(element)[0]!;
    const onto = element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")[2]!;
    from.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        dataTransfer: new DataTransfer()
      })
    );
    const rect = onto.getBoundingClientRect();
    onto.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientX: rect.right - 2,
        dataTransfer: new DataTransfer()
      })
    );
    await elementUpdated(element);
    // The preview is the real order, on screen before anything is released —
    // and it is only a preview: nothing has been reported yet.
    expect(order(element)).to.eql(["domain", "status", "name"]);
    expect(changed).to.have.length(0);

    // No drop: the drag was cancelled, and the original order comes back.
    onto.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
    await elementUpdated(element);
    expect(order(element)).to.eql(["name", "domain", "status"]);
    expect(changed).to.have.length(0);
  });

  it("moves a column from the keyboard, and puts it back on Escape", async () => {
    const element = await arrangeable();
    const handle = handles(element)[0]!;
    handle.focus();
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(element);
    expect(handle.getAttribute("aria-pressed")).to.equal("true");

    setTimeout(() =>
      handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    );
    const moved = await oneEvent(element, "fluid-column-layout-change");
    expect(moved.detail.layout.map((item: { key: string }) => item.key)).to.eql([
      "domain",
      "name",
      "status"
    ]);
    await elementUpdated(element);
    // The move is announced, because a drag is silent to a screen reader.
    expect(element.shadowRoot!.querySelector("[aria-live]")!.textContent!.trim()).to.equal(
      "Name, column 2 of 3"
    );

    const grabbed = handles(element)[1]!;
    setTimeout(() =>
      grabbed.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    );
    const restored = await oneEvent(element, "fluid-column-layout-change");
    expect(restored.detail.layout.map((item: { key: string }) => item.key)).to.eql([
      "name",
      "domain",
      "status"
    ]);
  });

  it("refuses to move a column past one that cannot be configured", async () => {
    const element = await arrangeable();
    element.columns = [
      { key: "name", label: "Name", sortable: true },
      { key: "domain", label: "Domain", configurable: false },
      { key: "status", label: "Status" }
    ];
    await elementUpdated(element);
    const changed: unknown[] = [];
    element.addEventListener("fluid-column-layout-change", (event) => changed.push(event));
    const handle = handles(element)[0]!;
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await elementUpdated(element);
    expect(changed).to.have.length(0);
    expect(order(element)).to.eql(["name", "domain", "status"]);
    // A fixed column offers no handle of its own either.
    expect(handles(element)).to.have.length(2);
  });

  it("persists a dragged width on the layout, in the same event", async () => {
    const element = await arrangeable();
    const grip = grips(element)[0]!;
    const start = element
      .shadowRoot!.querySelector("th[data-column]")!
      .getBoundingClientRect().width;
    grip.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: 100
      })
    );
    grip.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 1,
        clientX: 160
      })
    );
    // Live: the column follows the pointer rather than the commit.
    const col = element.shadowRoot!.querySelector<HTMLElement>("col")!;
    expect(parseFloat(col.style.width)).to.be.closeTo(start + 60, 2);
    setTimeout(() =>
      grip.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          pointerId: 1,
          clientX: 160
        })
      )
    );
    const event = await oneEvent(element, "fluid-column-layout-change");
    const item = event.detail.layout.find((entry: { key: string }) => entry.key === "name");
    expect(parseFloat(item.width)).to.be.closeTo(start + 60, 2);
    expect(item).to.include({ visible: true, order: 0 });
  });

  it("resizes one column: the flexible neighbours are pinned where they stood", async () => {
    const element = await arrangeable();
    const cells = element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]");
    const before = [...cells].map((cell) => Math.round(cell.getBoundingClientRect().width));
    const grip = grips(element)[0]!;
    grip.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 2,
        clientX: 100
      })
    );
    grip.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerId: 2, clientX: 60 })
    );
    setTimeout(() =>
      grip.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, pointerId: 2, clientX: 60 })
      )
    );
    const event = await oneEvent(element, "fluid-column-layout-change");
    // The freed 40px lands in the filler, not in the other columns: each
    // neighbour leaves with the exact width it was rendered at before.
    const layout = event.detail.layout as {
      key: string;
      width?: string;
    }[];
    expect(parseFloat(layout.find((item) => item.key === "domain")!.width!)).to.be.closeTo(
      before[1]!,
      1
    );
    expect(parseFloat(layout.find((item) => item.key === "status")!.width!)).to.be.closeTo(
      before[2]!,
      1
    );
    await elementUpdated(element);
    const after = [...cells].map((cell) => Math.round(cell.getBoundingClientRect().width));
    expect(after[0]).to.be.closeTo(before[0]! - 40, 2);
    expect(after[1]).to.equal(before[1]);
    expect(after[2]).to.equal(before[2]);
  });

  it("sizes a column from the keyboard and restores the declared width", async () => {
    const element = await arrangeable();
    element.columns = columns.map((column) =>
      column.key === "name" ? { ...column, width: "12rem" } : column
    );
    await elementUpdated(element);
    const grip = grips(element)[0]!;
    setTimeout(() =>
      grip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    );
    const wider = await oneEvent(element, "fluid-column-layout-change");
    const resized = wider.detail.layout.find((entry: { key: string }) => entry.key === "name");
    expect(resized.width).to.match(/px$/);

    setTimeout(() =>
      grip.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))
    );
    const reset = await oneEvent(element, "fluid-column-layout-change");
    expect(
      reset.detail.layout.find((entry: { key: string }) => entry.key === "name").width
    ).to.equal(undefined);
    await elementUpdated(element);
    // Back on the width the column was declared with, not on a pixel count.
    expect(element.shadowRoot!.querySelector<HTMLElement>("col")!.style.width).to.equal("12rem");
  });

  it("keeps a width the layout arrived with, whatever syntax it is in", async () => {
    const element = await arrangeable();
    element.columns = columns.map((column) =>
      column.key === "name" ? { ...column, width: "minmax(16rem, 1.5fr)" } : column
    );
    element.layout = [
      { key: "name", visible: true, order: 0, width: "minmax(16rem, 1.5fr)" },
      { key: "domain", visible: true, order: 1 },
      { key: "status", visible: true, order: 2 }
    ];
    await elementUpdated(element);
    const col = element.shadowRoot!.querySelector("col")!;
    expect(col.getAttribute("style")).to.contain("minmax(16rem, 1.5fr)");
  });

  it("is accessible with both handles present", async () => {
    const element = await arrangeable();
    await expect(element).to.be.accessible();
  });

  it("relocalizes an active Arabic column pickup without changing layout or emitting events", async () => {
    const element = await arrangeable();
    element.lang = "ar";
    await aTimeout(0);
    await element.updateComplete;
    const initialOrder = order(element);
    const changed: Event[] = [];
    element.addEventListener("fluid-column-layout-change", (event) => changed.push(event));
    const handle = handles(element)[0]!;
    handle.focus();
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await elementUpdated(element);
    const one = new Intl.NumberFormat("ar").format(1);
    const three = new Intl.NumberFormat("ar").format(3);
    const status = element.shadowRoot!.querySelector<HTMLElement>("[aria-live]")!;
    expect(status.dir).to.equal("rtl");
    expect(status.textContent?.trim()).to.equal(`Name، العمود ${one} من ${three}`);
    element.lang = "fr-CA";
    await aTimeout(0);
    await element.updateComplete;
    expect(status.textContent?.trim()).to.equal("Name, colonne 1 sur 3");
    expect(element.shadowRoot!.activeElement).to.equal(handle);
    expect(handle.getAttribute("aria-pressed")).to.equal("true");
    expect(order(element)).to.deep.equal(initialOrder);
    expect(changed).to.deep.equal([]);
  });

  it("preserves explicit empty resize, reorder and position templates", async () => {
    const element = await arrangeable();
    element.resizeColumnLabel = "";
    element.reorderColumnLabel = "";
    element.columnPositionLabel = "";
    element.lang = "ar";
    await aTimeout(0);
    await element.updateComplete;
    expect(handles(element)[0]!.getAttribute("aria-label")).to.equal("");
    expect(grips(element)[0]!.getAttribute("aria-label")).to.equal("");
    handles(element)[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await elementUpdated(element);
    expect(element.shadowRoot!.querySelector("[aria-live]")!.textContent?.trim()).to.equal("");
  });

  it("keeps Arabic RTL keyboard reorder and resize semantics with canonical layout payloads", async () => {
    const element = await arrangeable();
    element.lang = "ar";
    await aTimeout(0);
    await element.updateComplete;
    const handle = handles(element)[0]!;
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    setTimeout(() =>
      handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }))
    );
    const moved = await oneEvent(element, "fluid-column-layout-change");
    expect(moved.detail.layout.map((item: { key: string }) => item.key)).to.deep.equal([
      "domain",
      "name",
      "status"
    ]);
    await elementUpdated(element);

    const nameGrip = grips(element)[1]!;
    const before = element
      .shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")[1]!
      .getBoundingClientRect().width;
    setTimeout(() =>
      nameGrip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }))
    );
    const resized = await oneEvent(element, "fluid-column-layout-change");
    const name = resized.detail.layout.find((item: { key: string }) => item.key === "name");
    expect(parseFloat(name.width)).to.be.greaterThan(before);
    expect(resized.detail.layout.map((item: { key: string }) => item.key)).to.deep.equal([
      "domain",
      "name",
      "status"
    ]);
  });

  describe("column scrolling", () => {
    async function overflowing(): Promise<FluidInfiniteTable> {
      const element = await fixture<FluidInfiniteTable>(html`
        <div style="width: 320px">
          <fluid-infinite-table
            column-scroll
            .columns=${[
              { key: "a", label: "A", width: "200px" },
              { key: "b", label: "B", width: "200px" },
              { key: "c", label: "C", width: "200px" }
            ] as FluidInfiniteTableColumn[]}
            .rows=${[{ id: 1, a: "1", b: "2", c: "3" }]}
          ></fluid-infinite-table>
        </div>
      `).then((wrapper) => wrapper.querySelector("fluid-infinite-table")!);
      await elementUpdated(element);
      // Geometry lands via a ResizeObserver tick and a deferred frame, not the
      // render — so the fixture is ready when the table says so, not after a
      // guessed number of frames.
      for (let i = 0; i < 40 && !element.hasAttribute("data-columns-overflow"); i += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return element;
    }

    it("offers the strip between header and rows only while columns overflow", async () => {
      const element = await overflowing();
      expect(element.hasAttribute("data-columns-overflow")).to.equal(true);
      const row = element.shadowRoot!.querySelector(".column-scroll-row")!;
      expect(row).to.exist;
      // Between the header and the rows: the strip is the header row's next
      // sibling inside the table head.
      const header = element.shadowRoot!.querySelector('[part~="header-row"]')!;
      expect(header.nextElementSibling).to.equal(row);
      expect(getComputedStyle(row).display).to.not.equal("none");
    });

    it("moves the columns and the rows together as the strip scrolls", async () => {
      const element = await overflowing();
      const strip = element.shadowRoot!.querySelector<HTMLElement>(".column-scroll")!;
      const table = element.shadowRoot!.querySelector("table")!;
      const headerBefore = element
        .shadowRoot!.querySelector('[part~="header-cell"]')!
        .getBoundingClientRect().left;
      const cellBefore = element
        .shadowRoot!.querySelector('[part~="cell"]')!
        .getBoundingClientRect().left;
      strip.scrollLeft = 120;
      strip.dispatchEvent(new Event("scroll"));
      await elementUpdated(element);
      const shift = Math.round(strip.scrollLeft);
      expect(shift).to.be.greaterThan(0);
      expect(getComputedStyle(table).transform).to.not.equal("none");
      const headerAfter = element
        .shadowRoot!.querySelector('[part~="header-cell"]')!
        .getBoundingClientRect().left;
      const cellAfter = element
        .shadowRoot!.querySelector('[part~="cell"]')!
        .getBoundingClientRect().left;
      // Header and body moved by the same amount: columns stay columns.
      expect(Math.round(headerBefore - headerAfter)).to.equal(shift);
      expect(Math.round(cellBefore - cellAfter)).to.equal(shift);
    });

    it("stays out of the way when the columns fit", async () => {
      const element = await fixture<FluidInfiniteTable>(html`
        <fluid-infinite-table
          column-scroll
          .columns=${[{ key: "a", label: "A" }] as FluidInfiniteTableColumn[]}
          .rows=${[{ id: 1, a: "1" }]}
        ></fluid-infinite-table>
      `);
      await elementUpdated(element);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      expect(element.hasAttribute("data-columns-overflow")).to.equal(false);
      const row = element.shadowRoot!.querySelector(".column-scroll-row")!;
      expect(getComputedStyle(row).display).to.equal("none");
    });
  });
});
