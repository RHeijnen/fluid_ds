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
