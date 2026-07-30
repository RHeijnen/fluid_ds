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
