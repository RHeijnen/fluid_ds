import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidKanban, KanbanColumn } from "./fluid-kanban.js";

const data: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "c1", title: "Alpha", description: "First" },
      { id: "c2", title: "Bravo" }
    ]
  },
  {
    id: "doing",
    title: "In progress",
    cards: [{ id: "c3", title: "Charlie" }]
  }
];

function clone(): KanbanColumn[] {
  return data.map((col) => ({ ...col, cards: col.cards.map((c) => ({ ...c })) }));
}

async function board(): Promise<FluidKanban> {
  const el = await fixture<FluidKanban>(html`<fluid-kanban></fluid-kanban>`);
  el.columns = clone();
  await elementUpdated(el);
  await aTimeout(0);
  return el;
}

function card(el: FluidKanban, id: string): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>(`[data-card-id="${id}"]`)!;
}

describe("<fluid-kanban>", () => {
  it("renders each column as a labelled group with a card list", async () => {
    const el = await board();
    const columns = el.shadowRoot!.querySelectorAll('[part="column"]');
    expect(columns.length).to.equal(2);
    const list = el.shadowRoot!.querySelector('[part="list"]')!;
    expect(list.getAttribute("role")).to.equal("list");
    const items = el.shadowRoot!.querySelectorAll('[part="card"]');
    expect(items.length).to.equal(3);
    expect(items[0]!.getAttribute("role")).to.equal("listitem");
  });

  it("makes cards focusable and draggable", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    expect(c1.getAttribute("tabindex")).to.equal("0");
    expect(c1.getAttribute("draggable")).to.equal("true");
    expect(c1.getAttribute("aria-grabbed")).to.equal("false");
  });

  it("moveCard relocates a card across columns and emits fluid-move", async () => {
    const el = await board();
    setTimeout(() => el.moveCard("c1", 1, 0));
    const ev = await oneEvent(el, "fluid-move");
    expect(ev.detail.cardId).to.equal("c1");
    expect(ev.detail.fromColumn).to.equal("todo");
    expect(ev.detail.toColumn).to.equal("doing");
    expect(ev.detail.index).to.equal(0);
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2"]);
    expect(el.columns[1]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c3"]);
  });

  it("Space picks up a card and sets aria-grabbed", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("true");
  });

  it("ArrowRight moves a grabbed card to the next column", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
    await elementUpdated(el);
    expect(el.columns[1]!.cards.some((c) => c.id === "c1")).to.equal(true);
  });

  it("ArrowDown reorders within a column", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
    );
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2", "c1"]);
  });

  it("Escape cancels a pickup without moving", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c2"]);
  });

  it("passes the a11y audit", async () => {
    const wrapper = await fixture(html`
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
        <fluid-kanban></fluid-kanban>
      </div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
