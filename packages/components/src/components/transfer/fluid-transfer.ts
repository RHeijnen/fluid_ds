import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";
import { reducedMotion } from "../../internal/motion.js";

/** A single transferable item. */
export interface FluidTransferItem {
  /** Stable identifier. Serialized into the form value. */
  id: string;
  /** Visible label. */
  label: string;
  /** When true, the item cannot be moved or selected. */
  disabled?: boolean;
}

/** Which side a listbox represents. */
type Side = "source" | "target";

/**
 * A dual list box: move items between a source list and a target list. The
 * target list is the control's value, the array of item ids currently on the
 * target side.
 *
 * Form-associated via ElementInternals: the control participates in `<form>`
 * submission. Its submitted value is the comma-joined string of target ids (so
 * a server receives `a,c`), while the `value` property is the array of ids.
 *
 * There is no single WAI-ARIA APG pattern for a transfer / dual list box. It is
 * built from two Listbox widgets (each `role="listbox"` with
 * `aria-multiselectable="true"`) plus two move buttons. Each listbox follows
 * the APG Listbox keyboard contract: arrow keys move the active option, Space
 * toggles its selection, Shift+Arrow extends a selection range, Home / End jump
 * to the first / last option. The move buttons carry explicit `aria-label`s
 * ("Move selected to target" / "Move selected to source") and reflect their
 * enabled state, so the whole control is reachable and operable end to end with
 * the keyboard.
 *
 * @summary Dual list box that moves items between a source and a target list.
 *
 * @csspart base - The grid wrapper holding both panes and the move buttons.
 * @csspart pane - Each labelled pane (a `<section>` wrapping a label + listbox).
 * @csspart label - The visible label above each listbox.
 * @csspart listbox - Each `role="listbox"` scroll container.
 * @csspart option - Each `role="option"` row.
 * @csspart controls - The column of move buttons between the two panes.
 * @csspart button - Each move button. Reach it with `::part()` for any CSS not
 *   covered by a token (the escape hatch).
 *
 * Every styled property reads a component-scoped `--fluid-transfer-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of per-control override knobs; `@uses-token` is every
 * main var they fall back to.
 *
 * @cssproperty --fluid-transfer-bg - Listbox background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-transfer-fg - Option text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-transfer-border - Listbox border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-transfer-border-width - Listbox border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-transfer-radius - Listbox corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-transfer-label-fg - Pane label text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-transfer-option-hover-bg - Option hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-transfer-option-selected-bg - Selected option background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-transfer-option-selected-fg - Selected option text color. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-transfer-option-disabled-fg - Disabled option text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-transfer-button-bg - Move-button background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-transfer-button-fg - Move-button icon color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-transfer-button-border - Move-button border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-transfer-button-hover-bg - Move-button hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-transfer-focus-ring-color - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-transfer-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-transfer-gap - Gap between panes and the controls. Falls back to --fluid-space-3.
 * @cssproperty --fluid-transfer-font-family - Font family. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-surface-base - Default listbox + button background.
 * @uses-token --fluid-surface-muted - Option + button hover background.
 * @uses-token --fluid-text-primary - Option + button text color.
 * @uses-token --fluid-text-secondary - Pane label + disabled option text color.
 * @uses-token --fluid-border-default - Listbox + button border color.
 * @uses-token --fluid-accent-base - Selected option background.
 * @uses-token --fluid-accent-text - Selected option text color.
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-radius-sm - Option corner radius.
 * @uses-token --fluid-font-weight-medium - Pane label font weight.
 * @uses-token --fluid-focus-ring-color - Focus ring color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum option + button target size (24px AA / 44px AAA).
 * @uses-token --fluid-space-2 - Option inline padding.
 * @uses-token --fluid-space-3 - Default gap.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-font-size-sm - Label text size.
 * @uses-token --fluid-font-size-md - Option text size.
 * @uses-token --fluid-duration-fast - Hover transition duration.
 * @uses-token --fluid-easing-standard - Hover transition easing.
 *
 * @fires fluid-change - Fired whenever items move between lists.
 *   `event.detail.value` is the current array of target ids.
 */
export class FluidTransfer extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = [
    reducedMotion,
    css`
      :host {
        display: block;
        font-family: var(--fluid-transfer-font-family, var(--fluid-font-family-sans));
      }

      :host([hidden]) {
        display: none;
      }

      .base {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: stretch;
        gap: var(--fluid-transfer-gap, var(--fluid-space-3));
      }

      :host([disabled]) .base {
        opacity: 0.5;
        pointer-events: none;
      }

      .pane {
        display: flex;
        flex-direction: column;
        gap: var(--fluid-space-1);
        min-width: 0;
      }

      .label {
        font-size: var(--fluid-font-size-sm);
        font-weight: var(--fluid-font-weight-medium);
        color: var(--fluid-transfer-label-fg, var(--fluid-text-secondary));
      }

      .listbox {
        list-style: none;
        margin: 0;
        padding: var(--fluid-space-1);
        min-height: 8rem;
        max-height: 16rem;
        overflow-y: auto;
        background: var(--fluid-transfer-bg, var(--fluid-surface-base));
        color: var(--fluid-transfer-fg, var(--fluid-text-primary));
        border: var(--fluid-transfer-border-width, var(--fluid-field-border-width))
          solid var(--fluid-transfer-border, var(--fluid-border-default));
        border-radius: var(--fluid-transfer-radius, var(--fluid-field-border-radius));
        box-sizing: border-box;
      }

      .listbox:focus-visible {
        outline: var(--fluid-transfer-focus-ring-width, var(--fluid-focus-ring-width))
          solid var(--fluid-transfer-focus-ring-color, var(--fluid-focus-ring-color));
        outline-offset: 2px;
      }

      .option {
        display: flex;
        align-items: center;
        /* SC 2.5.8 Target Size: the row reads --fluid-target-min as a floor. */
        min-height: max(1.75rem, var(--fluid-target-min, 0px));
        padding: 0 var(--fluid-space-2);
        font-size: var(--fluid-font-size-md);
        border-radius: var(--fluid-radius-sm);
        cursor: pointer;
        user-select: none;
        transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .option:hover:not(.option-disabled) {
        background: var(--fluid-transfer-option-hover-bg, var(--fluid-surface-muted));
      }

      .option[aria-selected="true"] {
        background: var(--fluid-transfer-option-selected-bg, var(--fluid-accent-base));
        color: var(--fluid-transfer-option-selected-fg, var(--fluid-accent-text));
      }

      /*
       * The active option (roving active descendant) gets an inset ring so
       * sighted keyboard users can tell which row the arrow keys are on, even
       * when it is not selected. State is not conveyed by color alone.
       */
      .option-active {
        box-shadow: inset 0 0 0 2px
          var(--fluid-transfer-focus-ring-color, var(--fluid-focus-ring-color));
      }

      .option-disabled {
        color: var(--fluid-transfer-option-disabled-fg, var(--fluid-text-secondary));
        cursor: not-allowed;
        opacity: 0.65;
      }

      .controls {
        display: flex;
        flex-direction: column;
        align-self: center;
        gap: var(--fluid-space-2);
      }

      .button {
        all: unset;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* SC 2.5.8 Target Size floor. */
        min-width: max(2rem, var(--fluid-target-min, 0px));
        min-height: max(2rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-space-1);
        background: var(--fluid-transfer-button-bg, var(--fluid-surface-base));
        color: var(--fluid-transfer-button-fg, var(--fluid-text-primary));
        border: var(--fluid-transfer-border-width, var(--fluid-field-border-width))
          solid var(--fluid-transfer-button-border, var(--fluid-border-default));
        border-radius: var(--fluid-transfer-radius, var(--fluid-field-border-radius));
        cursor: pointer;
        transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
      }

      .button:hover:not(:disabled) {
        background: var(--fluid-transfer-button-hover-bg, var(--fluid-surface-muted));
      }

      .button:focus-visible {
        outline: var(--fluid-transfer-focus-ring-width, var(--fluid-focus-ring-width))
          solid var(--fluid-transfer-focus-ring-color, var(--fluid-focus-ring-color));
        outline-offset: 2px;
      }

      .button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .button svg {
        width: 1.125rem;
        height: 1.125rem;
        display: block;
      }
    `
  ];

  @query("#transfer-source") private sourceListEl!: HTMLElement;
  @query("#transfer-target") private targetListEl!: HTMLElement;

  /** The full set of transferable items. */
  @property({ type: Array }) items: FluidTransferItem[] = [];

  /** Target-side item ids. The control's value. */
  @property({ type: Array }) override value: string[] = [];

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Visible label for the source (left) list. */
  @property({ attribute: "source-label" }) sourceLabel = "Available";

  /** Visible label for the target (right) list. */
  @property({ attribute: "target-label" }) targetLabel = "Selected";

  /** Disabled state. No items can be moved. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Selected (highlighted) source ids, staged for the next move. */
  @state() private sourceSelection = new Set<string>();

  /** Selected (highlighted) target ids, staged for the next move. */
  @state() private targetSelection = new Set<string>();

  /** Active (roving) option id per side, for arrow-key navigation. */
  @state() private sourceActive: string | null = null;
  @state() private targetActive: string | null = null;

  /** Anchor for Shift+Arrow range extension, per side. */
  private sourceAnchor: string | null = null;
  private targetAnchor: string | null = null;

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("items")) {
      this.syncFormValue();
    }
  }

  protected override syncFormValue(): void {
    this.internals.setFormValue(this.value.join(","));
  }

  override formResetCallback(): void {
    const attr = this.getAttribute("value");
    this.value = attr
      ? attr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    this.sourceSelection = new Set();
    this.targetSelection = new Set();
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: "restore" | "autocomplete"
  ): void {
    if (typeof state === "string") {
      this.value = state.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  /** Move focus into the source listbox. */
  override focus(options?: FocusOptions): void {
    this.sourceListEl?.focus(options);
  }

  private get sourceItems(): FluidTransferItem[] {
    return this.items.filter((item) => !this.value.includes(item.id));
  }

  private get targetItems(): FluidTransferItem[] {
    // Preserve target order by the value array, not the items array.
    const byId = new Map(this.items.map((item) => [item.id, item]));
    return this.value
      .map((id) => byId.get(id))
      .filter((item): item is FluidTransferItem => item != null);
  }

  private itemsFor(side: Side): FluidTransferItem[] {
    return side === "source" ? this.sourceItems : this.targetItems;
  }

  private selectionFor(side: Side): Set<string> {
    return side === "source" ? this.sourceSelection : this.targetSelection;
  }

  private setSelection(side: Side, next: Set<string>): void {
    if (side === "source") this.sourceSelection = next;
    else this.targetSelection = next;
  }

  private activeFor(side: Side): string | null {
    return side === "source" ? this.sourceActive : this.targetActive;
  }

  private setActive(side: Side, id: string | null): void {
    if (side === "source") this.sourceActive = id;
    else this.targetActive = id;
  }

  private anchorFor(side: Side): string | null {
    return side === "source" ? this.sourceAnchor : this.targetAnchor;
  }

  private setAnchor(side: Side, id: string | null): void {
    if (side === "source") this.sourceAnchor = id;
    else this.targetAnchor = id;
  }

  private emitChange(): void {
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  /** Move the selected source items to the target side. */
  private moveToTarget = (): void => {
    if (this.disabled) return;
    const movable = [...this.sourceSelection].filter((id) => {
      const item = this.items.find((i) => i.id === id);
      return item != null && !item.disabled;
    });
    if (movable.length === 0) return;
    // Append in items order so the target stays predictable.
    const ordered = this.items.filter((i) => movable.includes(i.id)).map((i) => i.id);
    this.value = [...this.value, ...ordered];
    this.sourceSelection = new Set();
    this.sourceActive = null;
    this.emitChange();
  };

  /** Move the selected target items back to the source side. */
  private moveToSource = (): void => {
    if (this.disabled) return;
    const movable = [...this.targetSelection].filter((id) => {
      const item = this.items.find((i) => i.id === id);
      return item != null && !item.disabled;
    });
    if (movable.length === 0) return;
    this.value = this.value.filter((id) => !movable.includes(id));
    this.targetSelection = new Set();
    this.targetActive = null;
    this.emitChange();
  };

  private toggleSelection(side: Side, id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.disabled) return;
    const next = new Set(this.selectionFor(side));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.setSelection(side, next);
    this.setActive(side, id);
    this.setAnchor(side, id);
  }

  private handleOptionClick(side: Side, id: string): void {
    if (this.disabled) return;
    this.toggleSelection(side, id);
  }

  private handleListKeydown(side: Side, event: KeyboardEvent): void {
    if (this.disabled) return;
    const list = this.itemsFor(side);
    if (list.length === 0) return;
    const ids = list.map((i) => i.id);
    const active = this.activeFor(side);
    const currentIndex = active != null ? ids.indexOf(active) : -1;

    const focusAt = (index: number, extend: boolean): void => {
      const clamped = Math.max(0, Math.min(ids.length - 1, index));
      const id = ids[clamped];
      if (id == null) return;
      this.setActive(side, id);
      if (extend) {
        // Shift+Arrow: extend the selection range from the anchor.
        const anchor = this.anchorFor(side) ?? id;
        this.setAnchor(side, anchor);
        const from = ids.indexOf(anchor);
        const lo = Math.min(from, clamped);
        const hi = Math.max(from, clamped);
        const next = new Set<string>();
        for (let i = lo; i <= hi; i++) {
          const rangeId = ids[i];
          if (rangeId == null) continue;
          const item = list[i];
          if (item && !item.disabled) next.add(rangeId);
        }
        this.setSelection(side, next);
      } else {
        this.setAnchor(side, id);
      }
    };

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(currentIndex < 0 ? 0 : currentIndex + 1, event.shiftKey);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(currentIndex < 0 ? ids.length - 1 : currentIndex - 1, event.shiftKey);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0, event.shiftKey);
        break;
      case "End":
        event.preventDefault();
        focusAt(ids.length - 1, event.shiftKey);
        break;
      case " ":
      case "Spacebar": {
        event.preventDefault();
        if (active != null) this.toggleSelection(side, active);
        break;
      }
      case "Enter": {
        // Enter commits the move from the focused side.
        event.preventDefault();
        if (side === "source") this.moveToTarget();
        else this.moveToSource();
        break;
      }
      default:
        break;
    }
  }

  private handleListFocus(side: Side): void {
    // Establish an active option when the listbox first receives focus.
    if (this.activeFor(side) != null) return;
    const first = this.itemsFor(side)[0];
    if (first) this.setActive(side, first.id);
  }

  private renderListbox(side: Side): TemplateResult {
    const list = this.itemsFor(side);
    const selection = this.selectionFor(side);
    const active = this.activeFor(side);
    const label = side === "source" ? this.sourceLabel : this.targetLabel;
    const listId = side === "source" ? "transfer-source" : "transfer-target";
    const labelId = `${listId}-label`;
    return html`
      <section part="pane" class="pane">
        <span part="label" class="label" id=${labelId}>${label}</span>
        <ul
          part="listbox"
          id=${listId}
          class="listbox"
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby=${labelId}
          aria-disabled=${this.disabled ? "true" : "false"}
          aria-activedescendant=${ifDefined(active ? `${listId}-opt-${active}` : undefined)}
          tabindex=${this.disabled ? -1 : 0}
          @keydown=${(e: KeyboardEvent) => this.handleListKeydown(side, e)}
          @focus=${() => this.handleListFocus(side)}
        >
          ${repeat(
            list,
            (item) => item.id,
            (item) => html`
              <li
                part="option"
                id=${`${listId}-opt-${item.id}`}
                class=${classMap({
                  option: true,
                  "option-active": active === item.id,
                  "option-disabled": Boolean(item.disabled)
                })}
                role="option"
                aria-selected=${selection.has(item.id) ? "true" : "false"}
                aria-disabled=${item.disabled ? "true" : "false"}
                @click=${() => this.handleOptionClick(side, item.id)}
              >
                ${item.label}
              </li>
            `
          )}
        </ul>
      </section>
    `;
  }

  override render(): TemplateResult {
    const canMoveRight =
      !this.disabled &&
      [...this.sourceSelection].some((id) => {
        const item = this.items.find((i) => i.id === id);
        return item != null && !item.disabled;
      });
    const canMoveLeft =
      !this.disabled &&
      [...this.targetSelection].some((id) => {
        const item = this.items.find((i) => i.id === id);
        return item != null && !item.disabled;
      });
    return html`
      <div part="base" class="base">
        ${this.renderListbox("source")}
        <div part="controls" class="controls">
          <button
            part="button"
            class="button"
            type="button"
            aria-label="Move selected to ${this.targetLabel}"
            ?disabled=${!canMoveRight}
            @click=${this.moveToTarget}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button
            part="button"
            class="button"
            type="button"
            aria-label="Move selected to ${this.sourceLabel}"
            ?disabled=${!canMoveLeft}
            @click=${this.moveToSource}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
        ${this.renderListbox("target")}
      </div>
    `;
  }
}
