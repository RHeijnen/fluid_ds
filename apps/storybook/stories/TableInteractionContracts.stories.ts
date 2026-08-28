import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "../../../packages/table/src/components/table/define.js";
import "../../../packages/table/src/components/infinite-table/define.js";

const meta: Meta = {
  title: "Quality/Table interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

const people = [
  { id: "charlie", name: "Charlie", score: 10 },
  { id: "alice", name: "Alice", score: 2 },
  { id: "bob", name: "Bob", score: null }
];

export const TableContract: Story = {
  parameters: { quality: { componentTag: "fluid-table" } },
  render: () => html`
    <section>
      <button
        @click=${(event: Event) => {
          event.currentTarget instanceof HTMLElement &&
            (event.currentTarget.parentElement!.querySelector("fluid-table")!.rows = people.filter(
              (row) => row.id === "alice"
            ));
        }}
      >
        Show Alice only
      </button>
      <fluid-table
        selectable
        caption="Contributors"
        .columns=${[
          { key: "name", label: "Name", sortable: true },
          { key: "score", label: "Score", sortable: true }
        ]}
        .rows=${people}
      ></fluid-table>
    </section>
  `,
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("fluid-table")!;
    const root = table.shadowRoot!;
    const sorts: CustomEvent<{ key: string; dir: string }>[] = [];
    const selections: CustomEvent<{ selected: string[] }>[] = [];
    const onSort = (event: Event) => sorts.push(event as CustomEvent<{ key: string; dir: string }>);
    const onSelection = (event: Event) =>
      selections.push(event as CustomEvent<{ selected: string[] }>);
    const names = () =>
      [...root.querySelectorAll("tbody tr")].map((row) =>
        row.querySelectorAll("td")[1]!.textContent!.trim()
      );
    const score = root.querySelectorAll<HTMLButtonElement>("thead button")[1]!;
    const all = root.querySelector<HTMLInputElement>('[part="select-all"]')!;
    table.addEventListener("fluid-sort", onSort);
    table.addEventListener("fluid-selection-change", onSelection);
    try {
      score.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(names()).toEqual(["Alice", "Charlie", "Bob"]));
      await expect(score.closest("th")!.getAttribute("aria-sort")).toBe("ascending");
      const alice = root.querySelector<HTMLInputElement>('tbody input[aria-label="Select row 2"]')!;
      await userEvent.click(alice);
      await waitFor(() => expect(all.indeterminate).toBe(true));
      score.focus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(names()).toEqual(["Charlie", "Alice", "Bob"]));
      await expect(score.closest("th")!.getAttribute("aria-sort")).toBe("descending");
      await expect(
        root.querySelector<HTMLInputElement>('tbody input[aria-label="Select row 2"]')!.checked
      ).toBe(true);
      await expect(table.selectedKeys).toEqual(["alice"]);
      await userEvent.click(all);
      await waitFor(() => expect(all.checked).toBe(true));
      await expect(all.indeterminate).toBe(false);
      await expect([...table.selectedKeys].sort()).toEqual(["alice", "bob", "charlie"]);
      await userEvent.click(all);
      await waitFor(() => expect(table.selectedKeys).toEqual([]));
      await userEvent.click(canvasElement.querySelector("button")!);
      await waitFor(() => expect(names()).toEqual(["Alice"]));
      await userEvent.click(root.querySelector<HTMLInputElement>("tbody input")!);
      await expect(table.selectedKeys).toEqual(["alice"]);
      await expect(sorts.map((event) => event.detail)).toEqual([
        { key: "score", dir: "asc" },
        { key: "score", dir: "desc" }
      ]);
      await expect(selections.map((event) => event.detail.selected)).toEqual([
        ["alice"],
        ["charlie", "alice", "bob"],
        [],
        ["alice"]
      ]);
      await expect(
        [...sorts, ...selections].every(
          (event) => event.target === table && event.bubbles && event.composed
        )
      ).toBe(true);
    } finally {
      table.removeEventListener("fluid-sort", onSort);
      table.removeEventListener("fluid-selection-change", onSelection);
    }
  }
};

export const InfiniteTableContract: Story = {
  parameters: { quality: { componentTag: "fluid-infinite-table" } },
  render: () => html`
    <fluid-infinite-table
      configurable
      clickable
      scroll-mode="container"
      caption="Projects"
      style="--fluid-infinite-table-height:300px"
      .rowHeight=${64}
      .overscan=${2}
      .columns=${[
        { key: "name", label: "Name", sortable: true },
        { key: "score", label: "Score" },
        {
          key: "action",
          label: "Action",
          renderCell: ({ row }: { row: Record<string, unknown> }) =>
            html`<button>Open ${row["name"]}</button>`
        }
      ]}
      .rows=${Array.from({ length: 100 }, (_, id) => ({ id, name: `Project ${id}`, score: id }))}
      .total=${100}
    ></fluid-infinite-table>
  `,
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector("fluid-infinite-table")!;
    const root = table.shadowRoot!;
    const rowEvents: CustomEvent<{ rowIndex: number; row: Record<string, unknown> }>[] = [];
    const sortEvents: CustomEvent[] = [];
    const layouts: CustomEvent<{ layout: Array<{ key: string; visible: boolean }> }>[] = [];
    const loads: CustomEvent<{ offset: number }>[] = [];
    const onRow = (event: Event) => rowEvents.push(event as (typeof rowEvents)[number]);
    const onSort = (event: Event) => sortEvents.push(event as CustomEvent);
    const onLayout = (event: Event) => layouts.push(event as (typeof layouts)[number]);
    const onLoad = (event: Event) => {
      loads.push(event as (typeof loads)[number]);
      table.hasMore = false;
      table.rows = [...table.rows, { id: "next", name: "Next page result", score: 2 }];
      table.total = table.rows.length;
    };
    table.addEventListener("fluid-row-click", onRow);
    table.addEventListener("fluid-sort", onSort);
    table.addEventListener("fluid-column-layout-change", onLayout);
    table.addEventListener("fluid-load-more", onLoad);
    try {
      const first = root.querySelector<HTMLElement>("tr[data-row]")!;
      first.focus();
      await userEvent.keyboard("{Enter}");
      await expect(rowEvents.map((event) => event.detail.rowIndex)).toEqual([0]);
      await userEvent.click(first.querySelector("button")!);
      await expect(rowEvents.length).toBe(1);
      const sort = root.querySelector<HTMLButtonElement>(".sort")!;
      sort.focus();
      await userEvent.keyboard("{Enter}");
      await expect(sortEvents.map((event) => event.detail)).toEqual([{ key: "name", dir: "asc" }]);
      await waitFor(() => expect(sort.closest("th")!.getAttribute("aria-sort")).toBe("ascending"));
      const columns = root.querySelector<HTMLButtonElement>(".toolbar-actions button")!;
      await userEvent.click(columns);
      await waitFor(() => expect(root.querySelector("dialog")!.open).toBe(true));
      await userEvent.click(root.querySelectorAll<HTMLInputElement>(".column-option input")[1]!);
      await waitFor(() => expect(root.querySelectorAll("th[data-column]").length).toBe(2));
      await expect(layouts[0]!.detail.layout.find((item) => item.key === "score")!.visible).toBe(
        false
      );
      await userEvent.click(root.querySelector<HTMLButtonElement>(".dialog-foot button")!);
      await waitFor(() => expect(root.querySelector("dialog")!.open).toBe(false));
      await expect(root.activeElement).toBe(columns);
      const viewport = root.querySelector<HTMLElement>(".viewport")!;
      viewport.scrollTop = 2500;
      viewport.dispatchEvent(new Event("scroll"));
      await waitFor(() =>
        expect(
          Number(root.querySelector("tr[data-row]")!.getAttribute("data-row-key"))
        ).toBeGreaterThan(10)
      );
      const visible = [...root.querySelectorAll("tr[data-row]")];
      await expect(visible.length).toBeLessThan(20);
      await expect(Number(visible[0]!.getAttribute("aria-rowindex"))).toBe(
        Number(visible[0]!.getAttribute("data-row-key")) + 2
      );
      // Consumer-owned filtering replaces data while the viewport is deeply scrolled.
      table.rows = [{ id: "match", name: "Only match", score: 1 }];
      table.total = 1;
      await waitFor(() => expect(root.querySelectorAll("tr[data-row]").length).toBe(1));
      await expect(root.querySelector("tr[data-row]")!.textContent).toContain("Only match");
      await expect(root.querySelector("table")!.getAttribute("aria-rowcount")).toBe("2");
      table.hasMore = true;
      await waitFor(() => expect(loads.length).toBe(1));
      await expect(loads[0]!.detail.offset).toBe(1);
      await waitFor(() => expect(root.querySelectorAll("tr[data-row]").length).toBe(2));
      await expect(root.textContent).toContain("Next page result");
      await expect(
        [...rowEvents, ...sortEvents, ...layouts, ...loads].every(
          (event) => event.target === table && event.bubbles && event.composed
        )
      ).toBe(true);
    } finally {
      table.removeEventListener("fluid-row-click", onRow);
      table.removeEventListener("fluid-sort", onSort);
      table.removeEventListener("fluid-column-layout-change", onLayout);
      table.removeEventListener("fluid-load-more", onLoad);
    }
  }
};
