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

function moveControl(el: FluidKanban, id: string, name: string): HTMLButtonElement {
  return card(el, id).querySelector<HTMLButtonElement>(`[data-move="${name}"]`)!;
}

/** The trimmed text of the polite live region. */
function announced(el: FluidKanban): string {
  return el.shadowRoot!.querySelector<HTMLElement>('[role="status"]')!.textContent!.trim();
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

/** The board data with one card removed, as a live refresh would deliver it. */
function without(cardId: string): KanbanColumn[] {
  return clone().map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) }));
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

  it("rejects moves for unknown cards and out-of-range columns", async () => {
    const el = await board();
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    expect(el.moveCard("ghost", 0, 0)).to.equal(null);
    expect(el.moveCard("c1", 5, 0)).to.equal(null);
    expect(el.moveCard("c1", -1, 0)).to.equal(null);
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns).to.deep.equal(clone());
    expect(announced(el)).to.equal("");
  });

  it("clamps an over-large target index to the end of the destination column", async () => {
    const el = await board();
    setTimeout(() => el.moveCard("c1", 1, 99));
    const ev = await oneEvent(el, "fluid-move");
    expect(ev.detail.index).to.equal(1);
    await elementUpdated(el);
    expect(el.columns[1]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1"]);
    expect(announced(el)).to.equal("Moved Alpha to In progress, position 2 of 2.");
  });

  it("skips gaps in a sparse columns array", async () => {
    const el = await fixture<FluidKanban>(html`<fluid-kanban></fluid-kanban>`);
    const sparse: KanbanColumn[] = [];
    sparse[1] = { id: "later", title: "Later", cards: [{ id: "s1", title: "Solo" }] };
    sparse[2] = { id: "done", title: "Done", cards: [] };
    el.columns = sparse;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll('[part="column"]').length).to.equal(2);
    // Index 0 is a hole: it is neither a source nor a usable destination.
    expect(el.moveCard("s1", 0, 0)).to.equal(null);
    expect(el.moveCard("s1", 2, 0)).to.deep.equal({ columnIndex: 2, cardIndex: 0 });
    await elementUpdated(el);
    expect(el.columns[1]!.cards).to.deep.equal([]);
    expect(el.columns[2]!.cards.map((c) => c.id)).to.deep.equal(["s1"]);
    expect(announced(el)).to.equal("Moved Solo to Done, position 1 of 1.");
  });

  it("Space twice drops a card and announces the column it landed in", async () => {
    const el = await board();
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    press(card(el, "c1"), " ");
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("true");
    press(card(el, "c1"), " ");
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
    expect(announced(el)).to.equal("Dropped in To do.");
    // A pick up and drop in place is not a move, so no business event fires.
    expect(moves).to.deep.equal([]);
    expect(el.columns).to.deep.equal(clone());
  });

  it("Enter picks up and drops a card like Space", async () => {
    const el = await board();
    press(card(el, "c1"), "Enter");
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("true");
    press(card(el, "c1"), "Enter");
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
    expect(announced(el)).to.equal("Dropped in To do.");
  });

  it("announces a bare drop when the card left the board mid-pickup", async () => {
    const el = await board();
    press(card(el, "c1"), " ");
    await elementUpdated(el);
    const grabbed = card(el, "c1");
    // A live refresh removes the card in the same task as the drop keypress, so
    // the still-rendered card is dropped against data that no longer has it.
    el.columns = without("c1");
    press(grabbed, " ");
    await elementUpdated(el);
    expect(announced(el)).to.equal("Dropped.");
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2"]);
  });

  it("announces a bare pickup and ignores arrows for a card missing from the data", async () => {
    const el = await board();
    const stale = card(el, "c1");
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    el.columns = without("c1");
    press(stale, " ");
    press(stale, "ArrowDown");
    await elementUpdated(el);
    expect(announced(el)).to.equal("Picked up.");
    expect(moves).to.deep.equal([]);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2"]);
  });

  it("Escape after a pickup with no recorded origin just cancels", async () => {
    const el = await board();
    const stale = card(el, "c1");
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    el.columns = without("c1");
    press(stale, " ");
    press(stale, "Escape");
    await elementUpdated(el);
    await aTimeout(0);
    expect(announced(el)).to.equal("Move cancelled.");
    expect(moves).to.deep.equal([]);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2"]);
  });

  it("arrow keys and Escape do nothing until a card is picked up", async () => {
    const el = await board();
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    press(card(el, "c1"), "ArrowDown");
    press(card(el, "c1"), "ArrowRight");
    press(card(el, "c1"), "Escape");
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns).to.deep.equal(clone());
    expect(announced(el)).to.equal("");
  });

  it("ArrowUp reorders a grabbed card toward the top and stops at the first slot", async () => {
    const el = await board();
    press(card(el, "c2"), " ");
    await elementUpdated(el);
    press(card(el, "c2"), "ArrowUp");
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2", "c1"]);
    expect(announced(el)).to.equal("Moved Bravo to To do, position 1 of 2.");
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    press(card(el, "c2"), "ArrowUp");
    // An unhandled key leaves the pickup untouched.
    press(card(el, "c2"), "a");
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c2", "c1"]);
    expect(card(el, "c2").getAttribute("aria-grabbed")).to.equal("true");
  });

  it("ArrowLeft in LTR walks a grabbed card back along the column track", async () => {
    const el = await board();
    press(card(el, "c3"), " ");
    await elementUpdated(el);
    press(card(el, "c3"), "ArrowLeft");
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1", "c2"]);
    expect(el.columns[1]!.cards).to.deep.equal([]);
    // The track ends here, so a further ArrowLeft leaves the board alone.
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    press(card(el, "c3"), "ArrowLeft");
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1", "c2"]);
  });

  it("ArrowRight in RTL walks a grabbed card back along the column track", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div dir="rtl"><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    el.columns = clone();
    await elementUpdated(el);
    press(card(el, "c3"), " ");
    await elementUpdated(el);
    press(card(el, "c3"), "ArrowRight");
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1", "c2"]);
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    press(card(el, "c3"), "ArrowRight");
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c3", "c1", "c2"]);
  });

  it("ignores keys typed on a card's own move controls", async () => {
    const el = await board();
    press(moveControl(el, "c1", "next"), " ");
    press(moveControl(el, "c1", "down"), "Enter");
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
    expect(announced(el)).to.equal("");
    expect(el.columns).to.deep.equal(clone());
  });

  it("dropping a card onto a card in another column inserts it at that position", async () => {
    const el = await board();
    const dt = dataTransfer();
    card(el, "c1").dispatchEvent(dragEvent("dragstart", dt));
    setTimeout(() => card(el, "c3").dispatchEvent(dragEvent("drop", dt)));
    const ev = await oneEvent(el, "fluid-move");
    expect(ev.detail).to.deep.equal({
      cardId: "c1",
      fromColumn: "todo",
      toColumn: "doing",
      index: 0
    });
    await elementUpdated(el);
    expect(el.columns[1]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c3"]);
  });

  it("reordering inside a column accounts for the card leaving its old slot", async () => {
    const el = await fixture<FluidKanban>(html`<fluid-kanban></fluid-kanban>`);
    el.columns = [
      {
        id: "todo",
        title: "To do",
        cards: [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
          { id: "c", title: "C" }
        ]
      }
    ];
    await elementUpdated(el);

    // Downwards: the target index shifts back by one once the card is lifted out.
    const down = dataTransfer();
    card(el, "a").dispatchEvent(dragEvent("dragstart", down));
    setTimeout(() => card(el, "c").dispatchEvent(dragEvent("drop", down)));
    const first = await oneEvent(el, "fluid-move");
    expect(first.detail.index).to.equal(1);
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((x) => x.id)).to.deep.equal(["b", "a", "c"]);

    // Upwards: the target index is already correct and is used as is.
    const up = dataTransfer();
    card(el, "c").dispatchEvent(dragEvent("dragstart", up));
    setTimeout(() => card(el, "b").dispatchEvent(dragEvent("drop", up)));
    const second = await oneEvent(el, "fluid-move");
    expect(second.detail.index).to.equal(0);
    await elementUpdated(el);
    expect(el.columns[0]!.cards.map((x) => x.id)).to.deep.equal(["c", "b", "a"]);
  });

  it("ignores a drop that carries no card this board owns", async () => {
    const el = await board();
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));

    const empty = dataTransfer();
    column(el, 1).dispatchEvent(dragEvent("dragover", empty));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(true);
    column(el, 1).dispatchEvent(dragEvent("drop", empty));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(false);

    // A drop with no dataTransfer at all, e.g. a synthesized or stripped event.
    column(el, 1).dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));
    // A drag that started elsewhere carries an id this board cannot resolve.
    const foreign = dataTransfer();
    foreign.setData("text/plain", "ghost");
    card(el, "c3").dispatchEvent(dragEvent("drop", foreign));
    await elementUpdated(el);

    expect(moves).to.deep.equal([]);
    expect(el.columns).to.deep.equal(clone());
  });

  it("ignores a drop on a column the data no longer has", async () => {
    const el = await board();
    const moves: Event[] = [];
    el.addEventListener("fluid-move", (event) => moves.push(event));
    const dt = dataTransfer();
    card(el, "c1").dispatchEvent(dragEvent("dragstart", dt));
    const stale = column(el, 1);
    // The second column disappears in the same task as the drop, before re-render.
    el.columns = [clone()[0]!];
    stale.dispatchEvent(dragEvent("drop", dt));
    await elementUpdated(el);
    expect(moves).to.deep.equal([]);
    expect(el.columns.length).to.equal(1);
    expect(el.columns[0]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c2"]);
  });

  it("dragend clears the highlight and dragleave only clears its own column", async () => {
    const el = await board();
    const dt = dataTransfer();
    card(el, "c1").dispatchEvent(dragEvent("dragstart", dt));
    column(el, 1).dispatchEvent(dragEvent("dragover", dt));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(true);

    column(el, 0).dispatchEvent(new Event("dragleave", { bubbles: true }));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(true);

    card(el, "c1").dispatchEvent(new Event("dragend", { bubbles: true }));
    await elementUpdated(el);
    expect(column(el, 1).classList.contains("drop-target")).to.equal(false);
  });

  it("skips refocus when the board is removed mid-move", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><button id="outside">Outside</button><fluid-kanban></fluid-kanban></div>
    `);
    const el = wrapper.querySelector<FluidKanban>("fluid-kanban")!;
    const outside = wrapper.querySelector<HTMLButtonElement>("#outside")!;
    el.columns = clone();
    await elementUpdated(el);
    press(card(el, "c1"), " ");
    await elementUpdated(el);
    press(card(el, "c1"), "ArrowRight");
    el.remove();
    outside.focus();
    await el.updateComplete;
    await aTimeout(0);

    expect(el.columns[1]!.cards.map((c) => c.id)).to.deep.equal(["c1", "c3"]);
    expect(document.activeElement).to.equal(outside);
    wrapper.append(el);
    await elementUpdated(el);
    expect(card(el, "c1").getAttribute("aria-grabbed")).to.equal("false");
  });
});
