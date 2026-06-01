import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";
import { motionStyles, reducedMotion } from "../../internal/motion.js";

/** A single command-palette entry. */
export interface FluidCommandItem {
  /** Stable, unique id used in the `fluid-select` event detail. */
  id: string;
  /** Visible label, also the field matched while filtering. */
  label: string;
  /** Optional secondary text shown on the trailing edge of the row. */
  hint?: string;
  /** Optional group heading the item is bucketed under. */
  group?: string;
}

let counter = 0;

/**
 * A command launcher (the "⌘K" pattern): a modal dialog containing a search
 * input and a filtered results list. The dialog traps focus, closes on Escape,
 * and restores focus to whatever was focused before it opened. The input is a
 * combobox driving a listbox of results; the user filters by typing, moves the
 * active result with ArrowUp / ArrowDown, and runs it with Enter.
 *
 * Closest WAI-ARIA APG analog: the Combobox pattern with `aria-activedescendant`
 * managing the active option, wrapped in the Dialog (Modal) pattern for the
 * overlay, focus trap, and focus restoration. DOM focus stays on the input; the
 * active option is tracked with `aria-activedescendant`.
 *
 * @summary Modal ⌘K launcher: search input plus a filtered results listbox.
 *
 * @csspart base - The backdrop overlay (the outermost element).
 * @csspart panel - The floating dialog panel.
 * @csspart search - The search input row wrapper.
 * @csspart input - The combobox text input.
 * @csspart listbox - The results listbox.
 * @csspart option - Each result option row.
 * @csspart group - A group heading row.
 * @csspart empty - The "no results" message.
 *
 * Every styled property reads a component-scoped `--fluid-command-palette-*`
 * token that falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-command-palette-backdrop - Overlay fill. Falls back to rgb(0 0 0 / 0.4).
 * @cssproperty --fluid-command-palette-bg - Panel background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-command-palette-fg - Panel text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-command-palette-radius - Panel corner radius. Falls back to --fluid-radius-lg.
 * @cssproperty --fluid-command-palette-font-family - Panel font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-command-palette-max-width - Panel max width. Falls back to 36rem.
 * @cssproperty --fluid-command-palette-border-width - Search separator + option border width. Falls back to 1px.
 * @cssproperty --fluid-command-palette-border - Search separator color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-command-palette-input-fg - Input text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-command-palette-placeholder-fg - Input placeholder color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-command-palette-hint-fg - Trailing hint + group heading color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-command-palette-active-bg - Active option background. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-command-palette-active-fg - Active option text color. Falls back to --fluid-accent-text.
 * @cssproperty --fluid-command-palette-focus-ring - Input focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-command-palette-focus-ring-width - Input focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty [--fluid-command-palette-enter-animation=fluid-scale-in] - Panel open animation preset, or `none`.
 * @cssproperty [--fluid-command-palette-enter-duration=var(--fluid-duration-normal)] - Panel open duration (scaled by --fluid-motion).
 * @cssproperty [--fluid-command-palette-enter-easing=var(--fluid-easing-emphasized)] - Panel open easing.
 *
 * @uses-token --fluid-surface-base - Default panel background.
 * @uses-token --fluid-text-primary - Default panel + input text.
 * @uses-token --fluid-text-secondary - Placeholder, hints, group headings.
 * @uses-token --fluid-border-default - Search separator + option separators.
 * @uses-token --fluid-accent-base - Active option background.
 * @uses-token --fluid-accent-text - Active option text.
 * @uses-token --fluid-focus-ring-color - Input focus ring color.
 * @uses-token --fluid-focus-ring-width - Input focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum option row height floor (24px AA / 44px AAA).
 * @uses-token --fluid-radius-lg - Default panel corner radius.
 * @uses-token --fluid-radius-sm - Option row corner radius.
 * @uses-token --fluid-font-family-sans - Default font family.
 * @uses-token --fluid-shadow-lg - Panel elevation.
 *
 * @fires fluid-open - Fired when the palette opens.
 * @fires fluid-close - Fired when the palette closes (Escape, backdrop, or programmatically).
 * @fires fluid-select - Fired when an item is chosen. `event.detail` = `{ id, item }`.
 */
export class FluidCommandPalette extends FluidElement {
  static override styles = [
    motionStyles,
    reducedMotion,
    css`
      :host {
        display: contents;
      }

      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 12vh var(--fluid-space-4) var(--fluid-space-4);
        background: var(--fluid-command-palette-backdrop, rgb(0 0 0 / 0.4));
        backdrop-filter: blur(2px);
        animation: fluid-backdrop-in
          calc(
            var(--fluid-command-palette-enter-duration, var(--fluid-duration-fast)) *
              var(--fluid-motion, 1)
          )
          var(--fluid-easing-standard);
      }

      .panel {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: var(--fluid-command-palette-max-width, 36rem);
        max-height: 70vh;
        background: var(--fluid-command-palette-bg, var(--fluid-surface-base));
        color: var(--fluid-command-palette-fg, var(--fluid-text-primary));
        border-radius: var(--fluid-command-palette-radius, var(--fluid-radius-lg));
        box-shadow: var(--fluid-shadow-lg);
        font-family: var(--fluid-command-palette-font-family, var(--fluid-font-family-sans));
        overflow: hidden;
        animation: var(--fluid-command-palette-enter-animation, fluid-scale-in)
          calc(
            var(--fluid-command-palette-enter-duration, var(--fluid-duration-normal)) *
              var(--fluid-motion, 1)
          )
          var(--fluid-command-palette-enter-easing, var(--fluid-easing-emphasized)) both;
      }

      .search {
        display: flex;
        align-items: center;
        gap: var(--fluid-space-3);
        padding: var(--fluid-space-3) var(--fluid-space-4);
        border-bottom: var(--fluid-command-palette-border-width, 1px) solid
          var(--fluid-command-palette-border, var(--fluid-border-default));
      }

      .input {
        all: unset;
        box-sizing: border-box;
        flex: 1 1 auto;
        min-width: 0;
        font: inherit;
        font-size: var(--fluid-font-size-lg);
        line-height: 1.5;
        padding: var(--fluid-space-1) 0;
        color: var(--fluid-command-palette-input-fg, var(--fluid-text-primary));
      }
      .input::placeholder {
        color: var(--fluid-command-palette-placeholder-fg, var(--fluid-text-secondary));
        opacity: 1;
      }
      .input:focus-visible {
        outline: var(--fluid-command-palette-focus-ring-width, var(--fluid-focus-ring-width))
          solid var(--fluid-command-palette-focus-ring, var(--fluid-focus-ring-color));
        outline-offset: 2px;
        border-radius: var(--fluid-radius-sm);
      }

      .listbox {
        list-style: none;
        margin: 0;
        padding: var(--fluid-space-2);
        overflow-y: auto;
        flex: 1 1 auto;
        scrollbar-width: thin;
      }

      .group {
        padding: var(--fluid-space-2) var(--fluid-space-3) var(--fluid-space-1);
        font-size: var(--fluid-font-size-xs);
        font-weight: var(--fluid-font-weight-semibold);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--fluid-command-palette-hint-fg, var(--fluid-text-secondary));
      }

      /* min-height floors the row to --fluid-target-min so AAA lifts the hit
         target to 44px (SC 2.5.8) while AA keeps the design height. */
      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--fluid-space-3);
        box-sizing: border-box;
        min-height: max(2.25rem, var(--fluid-target-min, 0px));
        padding: var(--fluid-space-2) var(--fluid-space-3);
        border-radius: var(--fluid-radius-sm);
        cursor: pointer;
        user-select: none;
      }

      .option[aria-selected="true"] {
        background: var(--fluid-command-palette-active-bg, var(--fluid-accent-base));
        color: var(--fluid-command-palette-active-fg, var(--fluid-accent-text));
      }

      .option .hint {
        flex-shrink: 0;
        font-size: var(--fluid-font-size-sm);
        color: var(--fluid-command-palette-hint-fg, var(--fluid-text-secondary));
      }
      /* Keep the hint legible on the accent-filled active row. */
      .option[aria-selected="true"] .hint {
        color: inherit;
      }

      .option .label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .empty {
        padding: var(--fluid-space-5) var(--fluid-space-4);
        text-align: center;
        color: var(--fluid-command-palette-hint-fg, var(--fluid-text-secondary));
      }
    `
  ];

  @query(".input") private inputEl!: HTMLInputElement;
  @query(".panel") private panelEl!: HTMLElement;

  /** Whether the palette is open. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** The full set of selectable items. */
  @property({ type: Array }) items: FluidCommandItem[] = [];

  /** Input placeholder. */
  @property() placeholder = "Type a command or search…";

  /** Accessible label for the dialog. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = "Command palette";

  @state() private query = "";
  @state() private activeIndex = 0;

  private listboxId = `fluid-command-palette-listbox-${++counter}`;
  private optionIdBase = `fluid-command-palette-option-${counter}`;
  private restoreFocusTo: HTMLElement | null = null;

  /** Open the palette. */
  show(): void {
    this.open = true;
  }

  /** Close the palette. */
  hide(): void {
    this.open = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleGlobalKeydown, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleGlobalKeydown, true);
  }

  /** Items left after the substring filter, preserving input order. */
  private get filteredItems(): FluidCommandItem[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((item) => item.label.toLowerCase().includes(q));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Any change to the result set must keep activeIndex in range.
    void changed;
    const max = this.filteredItems.length - 1;
    if (this.activeIndex > max) this.activeIndex = Math.max(0, max);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.handleOpen();
      else this.handleClose(changed.get("open") as boolean | undefined);
    }
  }

  private handleOpen(): void {
    this.restoreFocusTo =
      (this.getRootNode() as Document | ShadowRoot).activeElement as HTMLElement | null;
    this.query = "";
    this.activeIndex = 0;
    // Wait for the panel + input to render, then move focus into the dialog.
    void this.updateComplete.then(() => {
      this.inputEl?.focus();
    });
    this.dispatchEvent(new CustomEvent("fluid-open", { bubbles: true, composed: true }));
  }

  private handleClose(previous: boolean | undefined): void {
    // Restore focus to the trigger only when we actually transitioned from open.
    if (previous) {
      this.restoreFocusTo?.focus?.();
      this.restoreFocusTo = null;
      this.dispatchEvent(new CustomEvent("fluid-close", { bubbles: true, composed: true }));
    }
  }

  private moveActive(delta: number): void {
    const count = this.filteredItems.length;
    if (count === 0) return;
    this.activeIndex = (this.activeIndex + delta + count) % count;
    void this.updateComplete.then(() => this.scrollActiveIntoView());
  }

  private setActive(index: number): void {
    const count = this.filteredItems.length;
    if (count === 0) return;
    this.activeIndex = Math.min(Math.max(index, 0), count - 1);
  }

  private scrollActiveIntoView(): void {
    const root = this.shadowRoot;
    if (!root) return;
    const active = root.querySelector<HTMLElement>(".option[aria-selected='true']");
    active?.scrollIntoView({ block: "nearest" });
  }

  private selectActive(): void {
    const item = this.filteredItems[this.activeIndex];
    if (!item) return;
    this.dispatchEvent(
      new CustomEvent("fluid-select", {
        detail: { id: item.id, item },
        bubbles: true,
        composed: true
      })
    );
    this.open = false;
  }

  private handleInput = (e: Event) => {
    this.query = (e.target as HTMLInputElement).value;
    this.activeIndex = 0;
  };

  private handleInputKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.moveActive(1);
        return;
      case "ArrowUp":
        e.preventDefault();
        this.moveActive(-1);
        return;
      case "Home":
        e.preventDefault();
        this.setActive(0);
        void this.updateComplete.then(() => this.scrollActiveIntoView());
        return;
      case "End":
        e.preventDefault();
        this.setActive(this.filteredItems.length - 1);
        void this.updateComplete.then(() => this.scrollActiveIntoView());
        return;
      case "Enter":
        e.preventDefault();
        this.selectActive();
        return;
      case "Escape":
        e.preventDefault();
        this.open = false;
        return;
    }
  };

  // Trap focus inside the panel: a Tab/Shift+Tab at an edge wraps. Because the
  // input is the only natively focusable control, Tab simply keeps focus on it.
  private handleGlobalKeydown = (e: KeyboardEvent) => {
    if (!this.open) return;
    if (e.key === "Tab") {
      const focusables = this.panelEl?.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const activeEl = this.shadowRoot?.activeElement as HTMLElement | null;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  private handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this.open = false;
  };

  private optionId(index: number): string {
    return `${this.optionIdBase}-${index}`;
  }

  private renderResults(): TemplateResult {
    const items = this.filteredItems;
    if (items.length === 0) {
      return html`<li part="empty" class="empty" role="presentation">No results found.</li>`;
    }
    let lastGroup: string | undefined;
    return html`
      ${items.map((item, index) => {
        const showGroup = item.group !== undefined && item.group !== lastGroup;
        lastGroup = item.group;
        const active = index === this.activeIndex;
        return html`
          ${showGroup
            ? html`<li part="group" class="group" role="presentation">${item.group}</li>`
            : ""}
          <li
            id=${this.optionId(index)}
            part="option"
            class="option"
            role="option"
            aria-selected=${active ? "true" : "false"}
            @click=${() => {
              this.activeIndex = index;
              this.selectActive();
            }}
            @pointermove=${() => (this.activeIndex = index)}
          >
            <span class="label">${item.label}</span>
            ${item.hint ? html`<span class="hint">${item.hint}</span>` : ""}
          </li>
        `;
      })}
    `;
  }

  override render(): TemplateResult {
    if (!this.open) return html``;
    const hasResults = this.filteredItems.length > 0;
    return html`
      <div part="base" class="backdrop" @mousedown=${this.handleBackdropClick}>
        <div
          part="panel"
          class="panel"
          role="dialog"
          aria-modal="true"
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
        >
          <div part="search" class="search">
            <input
              part="input"
              class="input"
              type="text"
              role="combobox"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              aria-autocomplete="list"
              aria-expanded=${hasResults ? "true" : "false"}
              aria-controls=${this.listboxId}
              aria-activedescendant=${ifDefined(
                hasResults ? this.optionId(this.activeIndex) : undefined
              )}
              aria-label=${ifDefined(this.ariaLabel ?? undefined)}
              placeholder=${this.placeholder}
              .value=${this.query}
              @input=${this.handleInput}
              @keydown=${this.handleInputKeydown}
            />
          </div>
          <ul part="listbox" class="listbox" id=${this.listboxId} role="listbox">
            ${this.renderResults()}
          </ul>
        </div>
      </div>
    `;
  }
}
