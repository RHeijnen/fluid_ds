import { expect, fixture, html, elementUpdated, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
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

function column(el: FluidKanban, index: number): HTMLElement {
  return el.shadowRoot!.querySelectorAll<HTMLElement>('[part="column"]')[index]!;
}

/** Minimal DataTransfer stub backed by an in-memory string store. */
function dataTransfer(): DataTransfer {
  const store: Record<string, string> = {};
  return {
    effectAllowed: "none",
    dropEffect: "none",
    setData(format: string, value: string) {
      store[format] = value;
    },
    getData(format: string) {
      return store[format] ?? "";
    }
  } as unknown as DataTransfer;
}

function dragEvent(type: string, dt: DataTransfer): DragEvent {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "dataTransfer", { value: dt, configurable: true });
  return ev as DragEvent;
}

describe("<fluid-kanban>", () => {
  it("does not emit moves for unchanged positions or invalid indices", async () => {
    const el = await board();
    const events: Event[] = [];
    el.addEventListener("fluid-move", (event) => events.push(event));
    el.moveCard("c1", 0, 0);
    el.moveCard("c1", 0, -1);
    expect(el.moveCard("c1", Number.NaN, 0)).to.equal(null);
    expect(el.moveCard("c1", 0, Number.NaN)).to.equal(null);
    expect(events).to.deep.equal([]);
    expect(el.columns).to.deep.equal(clone());
  });

  it("Escape restores the picked-up position after a keyboard move", async () => {
    const el = await board();
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await el.updateComplete;
    card(el, "c1").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );
    await el.updateComplete;
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(el.columns).to.deep.equal(clone());
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
  });

  it("offers a single-pointer move without dragging", async () => {
    const el = await board();
    const control = card(el, "c1").querySelector<HTMLButtonElement>('[data-move="next"]');
    expect(control).to.exist;
    expect(control!.getBoundingClientRect().height).to.be.at.least(24);
    expect(control!.getBoundingClientRect().width).to.be.at.least(24);
    control!.click();
    await el.updateComplete;
    expect(el.columns[1]!.cards.map((item) => item.id)).to.deep.equal(["c1", "c3"]);
  });

  it("refocuses arbitrary card IDs safely and clears pickup state on reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div><fluid-kanban></fluid-kanban></div>`);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    const id = 'card"with]punctuation';
    el.columns = [
      { id: "one", title: "One", cards: [{ id, title: "Quoted ID" }] },
      { id: "two", title: "Two", cards: [] }
    ];
    await el.updateComplete;
    const current = () =>
      [...el.shadowRoot!.querySelectorAll<HTMLElement>("[data-card-id]")].find(
        (element) => element.dataset.cardId === id
      )!;
    current().focus();
    current().dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    current().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    await Promise.resolve();
    expect(el.shadowRoot!.activeElement).to.equal(current());
    expect(el.columns[1]!.cards[0]!.id).to.equal(id);
    el.remove();
    wrapper.append(el);
    await el.updateComplete;
    expect(current().getAttribute("aria-grabbed")).to.equal("false");
  });

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

  it("follows the rendered logical column track in RTL without reversing board data", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);

    const renderedColumns = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="column"]');
    expect(renderedColumns[0]!.getBoundingClientRect().left).to.be.greaterThan(
      renderedColumns[1]!.getBoundingClientRect().left
    );

    const original = clone();
    const c1 = card(el, "c1");
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    const moved = oneEvent(el, "fluid-move") as Promise<CustomEvent>;
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const event = await moved;
    await elementUpdated(el);

    expect(event.detail).to.include({ cardId: "c1", fromColumn: "todo", toColumn: "doing" });
    expect(el.columns.map((entry) => entry.id)).to.deep.equal(original.map((entry) => entry.id));
    expect(el.columns[1]!.cards.map((entry) => entry.id)).to.deep.equal(["c1", "c3"]);

    const previous = card(el, "c1").querySelector<HTMLElement>('[data-move="previous"]')!;
    const next = card(el, "c1").querySelector<HTMLButtonElement>('[data-move="next"]')!;
    expect(previous.getAttribute("aria-label")).to.equal("Move to previous column: Alpha");
    expect(getComputedStyle(previous.querySelector(".horizontal-symbol")!).transform).to.not.equal(
      "none"
    );
    expect(next.disabled).to.equal(true);
  });

  it("uses a live inherited direction while a card is picked up", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="ltr"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);

    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    wrapper.dir = "rtl";
    await aTimeout(0);
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await elementUpdated(el);

    expect(el.columns[1]!.cards.map((entry) => entry.id)).to.deep.equal(["c1", "c3"]);
  });

  it("ArrowDown reorders within a column", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2", "c1"]);
  });

  it("Escape cancels a pickup without moving", async () => {
    const el = await board();
    const c1 = card(el, "c1");
    c1.focus();
    c1.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c2"]);
  });

  it("pointer drag and drop moves a card and emits fluid-move", async () => {
    const el = await board();
    const dt = dataTransfer();

    // dragstart on the card stashes its id on the dataTransfer.
    card(el, "c1").dispatchEvent(dragEvent("dragstart", dt));
    expect(dt.getData("text/plain")).to.equal("c1");

    // dragover on the target column highlights it via .drop-target.
    column(el, 1).dispatchEvent(dragEvent("dragover", dt));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(true);

    // drop on the target column moves the card and fires fluid-move.
    setTimeout(() => column(el, 1).dispatchEvent(dragEvent("drop", dt)));
    const ev = await oneEvent(el, "fluid-move");
    expect(ev.detail.cardId).to.equal("c1");
    expect(ev.detail.fromColumn).to.equal("todo");
    expect(ev.detail.toColumn).to.equal("doing");
    expect(ev.detail.index).to.equal(1);

    await elementUpdated(el);
    // Drop clears the highlight and relocates the card to the end of "doing".
    expect(column(el, 1).classList.contains("drop-target")).to.equal(false);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2"]);
    expect(el.columns[1]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1"]);
  });

  it("dragleave clears the drop-target highlight", async () => {
    const el = await board();
    const dt = dataTransfer();
    column(el, 1).dispatchEvent(dragEvent("dragover", dt));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(true);
    column(el, 1).dispatchEvent(new Event("dragleave", { bubbles: true }));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(false);
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

  it("updates inherited Arabic and regional French board controls without mutating board data", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);
    const original = el.columns;
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    expect(el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal(
      "لوحة كانبان"
    );
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!.dir).to.equal("rtl");
    expect(card(el, "c1").querySelector('[data-move="next"]')!.getAttribute("aria-label")).to.equal(
      "تحريك إلى العمود التالي: Alpha"
    );

    wrapper.lang = "fr-CA";
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal(
      "Tableau Kanban"
    );
    expect(card(el, "c1").querySelector('[data-move="next"]')!.getAttribute("aria-label")).to.equal(
      "Déplacer vers la colonne suivante : Alpha"
    );
    expect(el.columns).to.equal(original);
    expect(moves).to.deep.equal([]);
  });

  it("preserves explicit move-label overrides including empty values", async () => {
    const el = await fixture<FluidKanban>(html`
      <fluid-kanban
        move-up-label="Custom up"
        move-down-label="Custom down"
        move-previous-label="Custom previous"
        move-next-label=""
      ></fluid-kanban>
    `);
    el.columns = clone();
    await elementUpdated(el);
    expect(card(el, "c1").querySelector('[data-move="up"]')!.getAttribute("aria-label")).to.equal(
      "Custom up: Alpha"
    );
    expect(card(el, "c1").querySelector('[data-move="down"]')!.getAttribute("aria-label")).to.equal(
      "Custom down: Alpha"
    );
    expect(
      card(el, "c1").querySelector('[data-move="previous"]')!.getAttribute("aria-label")
    ).to.equal("Custom previous: Alpha");
    expect(card(el, "c1").querySelector('[data-move="next"]')!.getAttribute("aria-label")).to.equal(
      ": Alpha"
    );
    el.lang = "ar";
    await elementUpdated(el);
    expect(card(el, "c1").querySelector('[data-move="up"]')!.getAttribute("aria-label")).to.equal(
      "Custom up: Alpha"
    );
    expect(card(el, "c1").querySelector('[data-move="down"]')!.getAttribute("aria-label")).to.equal(
      "Custom down: Alpha"
    );
    expect(
      card(el, "c1").querySelector('[data-move="previous"]')!.getAttribute("aria-label")
    ).to.equal("Custom previous: Alpha");
    expect(card(el, "c1").querySelector('[data-move="next"]')!.getAttribute("aria-label")).to.equal(
      ": Alpha"
    );
  });

  it("relocalizes an active pickup announcement without replaying a business event", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    const status = el.shadowRoot!.querySelector<HTMLElement>('[role="status"]')!;
    expect(status.dir).to.equal("rtl");
    expect(status.textContent).to.contain("تم الالتقاط").and.contain("To do");
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    wrapper.lang = "de";
    await elementUpdated(el);
    expect(status.textContent).to.contain("Aufgenommen").and.contain("To do");
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("true");
    expect(moves).to.deep.equal([]);
  });

  it("uses inherited Arabic direction for logical keyboard movement and preserves canonical data", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    const moved = oneEvent(el, "fluid-move") as Promise<CustomEvent>;
    card(el, "c1").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const event = await moved;
    expect(event.detail).to.deep.equal({
      cardId: "c1",
      fromColumn: "todo",
      toColumn: "doing",
      index: 0
    });
    expect(el.columns.map((entry) => entry.id)).to.deep.equal(["todo", "doing"]);
    expect(el.columns[1]!.cards.map((entry) => entry.id)).to.deep.equal(["c1", "c3"]);
    expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent).to.contain("Alpha");
  });
});
