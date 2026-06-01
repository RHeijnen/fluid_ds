import { LitElement, html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";

/** A single card on the board. */
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

/** A column holding an ordered list of cards. */
export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface CardPosition {
  columnIndex: number;
  cardIndex: number;
}

/**
 * A drag-and-drop kanban board. Pass an array of `columns`, each with a
 * `title` and an ordered list of `cards`. Columns render side by side; each is
 * a labelled region containing a list (role="list") of draggable cards
 * (role="listitem").
 *
 * Cards move two ways. With a pointer, use native HTML5 drag and drop: press a
 * card and drop it onto another card or column. With the keyboard, focus a card
 * and press Space to pick it up, then ArrowLeft / ArrowRight to move it between
 * columns and ArrowUp / ArrowDown to reorder within a column; press Space again
 * to drop or Escape to cancel. Every move is announced through a polite
 * aria-live region.
 *
 * Either way the board updates its internal `columns` state and emits
 * `fluid-move` with the card id, source column, target column, and target
 * index.
 *
 * @summary Accessible drag-and-drop kanban board.
 *
 * @csspart base - The board: a horizontal track of columns.
 * @csspart column - A single column region.
 * @csspart column-header - A column's title bar.
 * @csspart list - The card list inside a column.
 * @csspart card - A single draggable card.
 *
 * @cssproperty --fluid-kanban-gap - Gap between columns and between cards. Falls back to --fluid-space-md.
 * @cssproperty --fluid-kanban-radius - Corner radius of columns and cards. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-kanban-column-bg - Column background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-kanban-card-bg - Card background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-kanban-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-kanban-border - Border color of columns and cards. Falls back to --fluid-border-default.
 *
 * @uses-token --fluid-space-md - Default gap.
 * @uses-token --fluid-radius-md - Default corner radius.
 * @uses-token --fluid-surface-muted - Default column background.
 * @uses-token --fluid-surface-base - Default card background.
 * @uses-token --fluid-text-primary - Default text color.
 * @uses-token --fluid-text-secondary - Card description color.
 * @uses-token --fluid-border-default - Default border color.
 * @uses-token --fluid-accent-base - Focus ring and pick-up highlight.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset (scales with conformance).
 * @uses-token --fluid-target-min - Minimum interactive target (24px AA / 44px AAA).
 * @uses-token --fluid-font-family-sans - Board typography.
 * @uses-token --fluid-font-size-sm - Column and card title size.
 * @uses-token --fluid-font-size-xs - Card description size.
 *
 * @fires fluid-move - A card moved. detail: { cardId, fromColumn, toColumn, index }.
 */
export class FluidKanban extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--fluid-kanban-fg, var(--fluid-text-primary, #18181b));
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
    }
    .board {
      display: flex;
      align-items: flex-start;
      gap: var(--fluid-kanban-gap, var(--fluid-space-md, 1rem));
      overflow-x: auto;
    }
    .column {
      flex: 0 0 16rem;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-kanban-gap, var(--fluid-space-md, 1rem));
      padding: var(--fluid-kanban-gap, var(--fluid-space-md, 1rem));
      background: var(--fluid-kanban-column-bg, var(--fluid-surface-muted, #f4f4f5));
      border: 1px solid var(--fluid-kanban-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-kanban-radius, var(--fluid-radius-md, 0.5rem));
    }
    /* Drop highlight uses an INSET ring (and a faint accent tint) rather than an
       outline: the board is an overflow:auto scroll container, which clips an
       outset outline / outline-offset, so the indicator showed only partially.
       An inset box-shadow paints inside the column box and is never clipped. */
    .column.drop-target {
      box-shadow: inset 0 0 0 var(--fluid-focus-ring-width, 2px)
        var(--fluid-accent-base, #4f46e5);
      background: color-mix(
        in srgb,
        var(--fluid-accent-base, #4f46e5) 8%,
        var(--fluid-kanban-column-bg, var(--fluid-surface-muted, #f4f4f5))
      );
    }
    .column-header {
      margin: 0;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .count {
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      opacity: 0.7;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--fluid-kanban-gap, var(--fluid-space-md, 1rem));
      min-height: 2rem;
    }
    .card {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-height: max(2.5rem, var(--fluid-target-min, 0px));
      padding: 0.625rem 0.75rem;
      background: var(--fluid-kanban-card-bg, var(--fluid-surface-base, #ffffff));
      border: 1px solid var(--fluid-kanban-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-kanban-radius, var(--fluid-radius-md, 0.5rem));
      cursor: grab;
    }
    .card:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-accent-base, #4f46e5);
      outline-offset: var(--fluid-focus-ring-offset, 2px);
    }
    .card[aria-grabbed="true"] {
      cursor: grabbing;
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-accent-base, #4f46e5);
      outline-offset: var(--fluid-focus-ring-offset, 2px);
      opacity: 0.85;
    }
    .card-title {
      margin: 0;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
    }
    .card-desc {
      margin: 0;
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-text-secondary, #3f3f46);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /** The board data: an ordered list of columns, each with ordered cards. */
  @property({ type: Array }) columns: KanbanColumn[] = [];

  /** The id of the card currently picked up via the keyboard, if any. */
  @state() private grabbedId: string | null = null;

  /** Index of the column being hovered during a pointer drag, if any. */
  @state() private dragOverColumn: number | null = null;

  /** Live-region message announcing the latest move action. */
  @state() private liveMessage = "";

  private findCard(cardId: string): CardPosition | null {
    for (let c = 0; c < this.columns.length; c++) {
      const column = this.columns[c];
      if (!column) continue;
      const cardIndex = column.cards.findIndex((card) => card.id === cardId);
      if (cardIndex !== -1) return { columnIndex: c, cardIndex };
    }
    return null;
  }

  /**
   * Move a card to a target column at a target index, update state, announce,
   * and emit fluid-move. Returns the resulting position, or null if the card
   * was not found.
   */
  moveCard(cardId: string, toColumn: number, toIndex: number): CardPosition | null {
    const from = this.findCard(cardId);
    if (!from) return null;
    const source = this.columns[from.columnIndex];
    const target = this.columns[toColumn];
    if (!source || !target) return null;

    const moving = source.cards[from.cardIndex];
    if (!moving) return null;

    // Build the next state immutably so Lit re-renders.
    const next = this.columns.map((col) => ({ ...col, cards: [...col.cards] }));
    const nextSource = next[from.columnIndex];
    const nextTarget = next[toColumn];
    if (!nextSource || !nextTarget) return null;

    nextSource.cards.splice(from.cardIndex, 1);

    // Clamp the destination index into the target list as it stands now.
    let index = toIndex;
    if (index < 0) index = 0;
    if (index > nextTarget.cards.length) index = nextTarget.cards.length;
    nextTarget.cards.splice(index, 0, moving);

    this.columns = next;

    this.liveMessage = `Moved ${moving.title} to ${target.title}, position ${index + 1} of ${nextTarget.cards.length}.`;

    this.dispatchEvent(
      new CustomEvent("fluid-move", {
        detail: {
          cardId,
          fromColumn: source.id,
          toColumn: target.id,
          index
        },
        bubbles: true,
        composed: true
      })
    );

    return { columnIndex: toColumn, cardIndex: index };
  }

  private async refocusCard(cardId: string): Promise<void> {
    await this.updateComplete;
    const el = this.renderRoot.querySelector<HTMLElement>(
      `[data-card-id="${cardId}"]`
    );
    el?.focus();
  }

  // --- Pointer drag and drop ---

  private onDragStart(e: DragEvent, cardId: string): void {
    e.dataTransfer?.setData("text/plain", cardId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  }

  private onColumnDragOver(e: DragEvent, columnIndex: number): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    this.dragOverColumn = columnIndex;
  }

  private onColumnDrop(e: DragEvent, columnIndex: number, beforeIndex?: number): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverColumn = null;
    const cardId = e.dataTransfer?.getData("text/plain");
    if (!cardId) return;
    const target = this.columns[columnIndex];
    if (!target) return;
    const index = beforeIndex ?? target.cards.length;
    const result = this.moveCard(cardId, columnIndex, index);
    if (result) void this.refocusCard(cardId);
  }

  // --- Keyboard moves ---

  private onCardKeydown(e: KeyboardEvent, cardId: string): void {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (this.grabbedId === cardId) {
        this.grabbedId = null;
        const pos = this.findCard(cardId);
        const col = pos ? this.columns[pos.columnIndex] : undefined;
        this.liveMessage = col
          ? `Dropped in ${col.title}.`
          : "Dropped.";
      } else {
        this.grabbedId = cardId;
        const pos = this.findCard(cardId);
        const col = pos ? this.columns[pos.columnIndex] : undefined;
        this.liveMessage = col
          ? `Picked up. Use arrow keys to move, Space to drop, Escape to cancel. In ${col.title}.`
          : "Picked up.";
      }
      return;
    }

    if (e.key === "Escape" && this.grabbedId === cardId) {
      e.preventDefault();
      this.grabbedId = null;
      this.liveMessage = "Move cancelled.";
      return;
    }

    if (this.grabbedId !== cardId) return;

    const pos = this.findCard(cardId);
    if (!pos) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.moveCard(cardId, pos.columnIndex, pos.cardIndex - 1);
      void this.refocusCard(cardId);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this.moveCard(cardId, pos.columnIndex, pos.cardIndex + 1);
      void this.refocusCard(cardId);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (pos.columnIndex > 0) {
        this.moveCard(cardId, pos.columnIndex - 1, pos.cardIndex);
        void this.refocusCard(cardId);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (pos.columnIndex < this.columns.length - 1) {
        this.moveCard(cardId, pos.columnIndex + 1, pos.cardIndex);
        void this.refocusCard(cardId);
      }
    }
  }

  private renderCard(card: KanbanCard): TemplateResult {
    const grabbed = this.grabbedId === card.id;
    // The <li> is itself the draggable card. Wrapping the card in an extra
    // element with role="listitem" would put a listitem inside a listitem,
    // which axe flags (aria-required-parent): the listitem's nearest parent
    // would be the wrapper, not the role="list". Letting the <li> be the card
    // keeps a single, valid list -> listitem structure.
    return html`
      <li
        part="card"
        class="card"
        data-card-id=${card.id}
        role="listitem"
        tabindex="0"
        draggable="true"
        aria-grabbed=${grabbed ? "true" : "false"}
        aria-roledescription="Draggable card"
        @dragstart=${(e: DragEvent) => this.onDragStart(e, card.id)}
        @keydown=${(e: KeyboardEvent) => this.onCardKeydown(e, card.id)}
      >
        <p class="card-title">${card.title}</p>
        ${card.description
          ? html`<p class="card-desc">${card.description}</p>`
          : ""}
      </li>
    `;
  }

  private renderColumn(column: KanbanColumn, columnIndex: number): TemplateResult {
    const labelId = `col-${column.id}`;
    return html`
      <section
        part="column"
        class="column ${this.dragOverColumn === columnIndex ? "drop-target" : ""}"
        role="group"
        aria-labelledby=${labelId}
        @dragover=${(e: DragEvent) => this.onColumnDragOver(e, columnIndex)}
        @dragleave=${() => {
          if (this.dragOverColumn === columnIndex) this.dragOverColumn = null;
        }}
        @drop=${(e: DragEvent) => this.onColumnDrop(e, columnIndex)}
      >
        <h3 part="column-header" class="column-header" id=${labelId}>
          <span>${column.title}</span>
          <span class="count" aria-hidden="true">${column.cards.length}</span>
        </h3>
        <ul part="list" class="list" role="list">
          ${column.cards.map((card) => this.renderCard(card))}
        </ul>
      </section>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="board" role="group" aria-label="Kanban board">
        ${this.columns.map((column, i) => this.renderColumn(column, i))}
      </div>
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        ${this.liveMessage}
      </div>
    `;
  }
}
