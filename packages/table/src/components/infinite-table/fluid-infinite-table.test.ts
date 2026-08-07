import {
  expect,
  fixture,
  html,
  elementUpdated,
  oneEvent
} from "@open-wc/testing";
import { html as litHtml } from "lit";
import "./define.js";
import type {
  FluidInfiniteTable,
  FluidInfiniteTableColumn
} from "./fluid-infinite-table.js";

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
    expect(
      element.shadowRoot!.querySelector("th")?.getAttribute("aria-sort")
    ).to.equal("ascending");
  });

  it("emits a serializable layout when a column is hidden", async () => {
    const element = await setup();
    const open = element.shadowRoot!.querySelector<HTMLButtonElement>(
      ".toolbar-actions button"
    )!;
    open.click();
    const checkbox = element.shadowRoot!.querySelector<HTMLInputElement>(
      ".column-option input"
    )!;
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
    const row = element.shadowRoot!.querySelector<HTMLElement>(
      "tbody tr[data-row]"
    )!;
    setTimeout(() =>
      row.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      )
    );
    const event = await oneEvent(element, "fluid-row-click");
    expect(event.detail.row["name"]).to.equal("Apollo");
    expect(event.detail.rowIndex).to.equal(0);
  });

  it("is accessible with rich templates and column configuration", async () => {
    const element = await setup();
    await expect(element).to.be.accessible();
    element.shadowRoot!.querySelector<HTMLButtonElement>(
      ".toolbar-actions button"
    )!.click();
    await elementUpdated(element);
    const firstToggle = element.shadowRoot!.querySelector<HTMLInputElement>(
      ".column-option input"
    )!;
    expect(firstToggle.labels?.[0]?.textContent?.trim()).to.equal("Name");
    await expect(element).to.be.accessible();
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

  it("gives every header a reorder handle and a resize grip", async () => {
    const element = await arrangeable();
    expect(handles(element)).to.have.length(3);
    expect(grips(element)).to.have.length(3);
    expect(handles(element)[0]!.getAttribute("aria-label")).to.equal(
      "Reorder Name"
    );
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
    expect(
      label.getBoundingClientRect().left - th.getBoundingClientRect().left
    ).to.be.closeTo(padding, 1);
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
        .rows=${[
          { id: 1, name: "Apollo", notes: "A value long enough that it cannot fit" }
        ]}
        .layout=${[
          { key: "name", visible: true, order: 0 },
          { key: "notes", visible: true, order: 1, width: "88px" }
        ]}
      ></fluid-infinite-table>
    `);
    await elementUpdated(element);
    const th = element.shadowRoot!.querySelectorAll<HTMLElement>(
      "th[data-column]"
    )[1]!;
    const label = th.querySelector<HTMLElement>(".header-label")!;
    expect(getComputedStyle(label).textOverflow).to.equal("ellipsis");
    expect(getComputedStyle(label).whiteSpace).to.equal("nowrap");
    expect(label.scrollWidth).to.be.greaterThan(label.clientWidth);
    const cell = element.shadowRoot!.querySelectorAll<HTMLElement>(
      "tbody tr[data-row] td"
    )[1]!;
    expect(getComputedStyle(cell).textOverflow).to.equal("ellipsis");
    expect(getComputedStyle(cell).whiteSpace).to.equal("nowrap");
    expect(cell.scrollWidth).to.be.greaterThan(cell.clientWidth);
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
      [
        ...element.shadowRoot!.querySelectorAll<HTMLElement>("th[data-column]")
      ].map((cell) => Math.round(cell.getBoundingClientRect().width));
    // Fixed layout used to re-share the spare space over the sized columns,
    // so a column asked to be 120px rendered wider. The filler takes it now.
    expect(widths()).to.eql([120, 140, 160]);
    const filler = element.shadowRoot!.querySelector<HTMLElement>(
      "thead td.filler"
    )!;
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
    element.addEventListener("fluid-column-layout-change", (event) =>
      changed.push(event)
    );
    const header = element.shadowRoot!.querySelector<HTMLElement>(
      "th[data-column='name']"
    )!;
    const transfer = new DataTransfer();
    header.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer: transfer })
    );
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
    const item = event.detail.layout.find(
      (entry: { key: string }) => entry.key === "name"
    );
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
    expect(
      element.shadowRoot!.querySelector("th[data-column='domain'] .grip")
    ).to.equal(null);
  });

  it("drops a dragged column beside the header it was dropped on", async () => {
    const element = await arrangeable();
    const from = handles(element)[0]!;
    const onto = element.shadowRoot!.querySelectorAll<HTMLElement>(
      "th[data-column]"
    )[2]!;
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
    element.addEventListener("fluid-column-layout-change", (event) =>
      changed.push(event)
    );
    const from = handles(element)[0]!;
    const onto = element.shadowRoot!.querySelectorAll<HTMLElement>(
      "th[data-column]"
    )[2]!;
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
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    await elementUpdated(element);
    expect(handle.getAttribute("aria-pressed")).to.equal("true");

    setTimeout(() =>
      handle.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      )
    );
    const moved = await oneEvent(element, "fluid-column-layout-change");
    expect(moved.detail.layout.map((item: { key: string }) => item.key)).to.eql([
      "domain",
      "name",
      "status"
    ]);
    await elementUpdated(element);
    // The move is announced, because a drag is silent to a screen reader.
    expect(
      element.shadowRoot!.querySelector("[aria-live]")!.textContent!.trim()
    ).to.equal("Name, column 2 of 3");

    const grabbed = handles(element)[1]!;
    setTimeout(() =>
      grabbed.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      )
    );
    const restored = await oneEvent(element, "fluid-column-layout-change");
    expect(
      restored.detail.layout.map((item: { key: string }) => item.key)
    ).to.eql(["name", "domain", "status"]);
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
    element.addEventListener("fluid-column-layout-change", (event) =>
      changed.push(event)
    );
    const handle = handles(element)[0]!;
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
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
    const item = event.detail.layout.find(
      (entry: { key: string }) => entry.key === "name"
    );
    expect(parseFloat(item.width)).to.be.closeTo(start + 60, 2);
    expect(item).to.include({ visible: true, order: 0 });
  });

  it("resizes one column: the flexible neighbours are pinned where they stood", async () => {
    const element = await arrangeable();
    const cells = element.shadowRoot!.querySelectorAll<HTMLElement>(
      "th[data-column]"
    );
    const before = [...cells].map((cell) =>
      Math.round(cell.getBoundingClientRect().width)
    );
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
    const after = [...cells].map((cell) =>
      Math.round(cell.getBoundingClientRect().width)
    );
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
      grip.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      )
    );
    const wider = await oneEvent(element, "fluid-column-layout-change");
    const resized = wider.detail.layout.find(
      (entry: { key: string }) => entry.key === "name"
    );
    expect(resized.width).to.match(/px$/);

    setTimeout(() =>
      grip.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true })
      )
    );
    const reset = await oneEvent(element, "fluid-column-layout-change");
    expect(
      reset.detail.layout.find((entry: { key: string }) => entry.key === "name")
        .width
    ).to.equal(undefined);
    await elementUpdated(element);
    // Back on the width the column was declared with, not on a pixel count.
    expect(
      element.shadowRoot!.querySelector<HTMLElement>("col")!.style.width
    ).to.equal("12rem");
  });

  it("keeps a width the layout arrived with, whatever syntax it is in", async () => {
    const element = await arrangeable();
    element.columns = columns.map((column) =>
      column.key === "name"
        ? { ...column, width: "minmax(16rem, 1.5fr)" }
        : column
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
});
