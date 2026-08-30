/**
 * Sprint board demo: the @fluid-ds/kanban board mid-sprint. Cards drag
 * between columns (or move entirely by keyboard); every move lands in the
 * activity feed via the board's `fluid-move` event.
 */
import "./shared/register-fluid.js";
import "@fluid-ds/kanban/define/kanban";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Sprint board", currentRoute: "board" });
mountDesignOverlay();

const columns = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "t1", title: "Empty-state illustrations", description: "Three sizes, both schemes." },
      { id: "t2", title: "Rate-limit the invite endpoint" },
      { id: "t3", title: "Migrate billing webhooks", description: "v2 payloads, retry queue." },
      { id: "t4", title: "Localize the onboarding tour" }
    ]
  },
  {
    id: "doing",
    title: "In progress",
    cards: [
      { id: "d1", title: "Realtime presence dots", description: "Socket fanout + debounce." },
      { id: "d2", title: "Contrast pass on charts" }
    ]
  },
  {
    id: "review",
    title: "In review",
    cards: [{ id: "r1", title: "Export to CSV", description: "Streams, no memory spike." }]
  },
  {
    id: "done",
    title: "Done",
    cards: [
      { id: "x1", title: "Upgrade to Vite 6" },
      { id: "x2", title: "Session refresh fix" }
    ]
  }
];

main.innerHTML = `
  <section class="demo-page demo-page-wide fluid-glass-panel">
    <header class="demo-page-head">
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="../">Demos</fluid-breadcrumb-item>
        <fluid-breadcrumb-item current>Sprint board</fluid-breadcrumb-item>
      </fluid-breadcrumb>
      <h1>Sprint 42</h1>
      <p class="muted-lead">
        Drag a card between columns, or focus one and move it entirely with the keyboard. Every
        move fires <code>fluid-move</code>; the feed below listens.
      </p>
    </header>

    <fluid-kanban id="board" aria-label="Sprint 42 board"></fluid-kanban>

    <fluid-card class="board-feed-card">
      <h3 slot="header">Activity</h3>
      <ul class="board-feed" id="board-feed" aria-live="polite">
        <li class="muted-lead">No moves yet, the board is as planned.</li>
      </ul>
    </fluid-card>
  </section>
`;

const board = document.getElementById("board") as HTMLElement & { columns?: unknown };
board.columns = columns;

const titles = new Map(columns.flatMap((c) => c.cards.map((card) => [card.id, card.title])));
const columnTitles = new Map(columns.map((c) => [c.id, c.title]));
const feed = document.getElementById("board-feed")!;
let moves = 0;

board.addEventListener("fluid-move", (event) => {
  const { cardId, fromColumn, toColumn } = (event as CustomEvent).detail as {
    cardId: string;
    fromColumn: string;
    toColumn: string;
  };
  if (moves === 0) feed.textContent = "";
  moves += 1;
  const item = document.createElement("li");
  item.textContent = `"${titles.get(cardId) ?? cardId}" moved from ${
    columnTitles.get(fromColumn) ?? fromColumn
  } to ${columnTitles.get(toColumn) ?? toColumn}.`;
  feed.prepend(item);
});
