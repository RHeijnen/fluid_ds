import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { autoUpdate, computePosition, flip, offset, size } from "@floating-ui/dom";
import { FluidFormAssociated } from "../../internal/form-associated.js";

let counter = 0;

/**
 * One option, normalized from any of the four supported input paths.
 */
export interface TypeaheadOption {
  value: string;
  label: string;
  /** Free-form payload, preserved through events so consumers can read it. */
  data?: unknown;
}

type RawOption = string | TypeaheadOption;

/**
 * An autocomplete / typeahead input.
 *
 * Four ways to feed it options:
 *
 * 1. **Property (array)**: for React/Vue/Lit consumers with dynamic data:
 *    ```html
 *    <fluid-typeahead .options=${["Apple","Banana"]}></fluid-typeahead>
 *    ```
 *
 * 2. **JSON-string attribute**: for vanilla HTML with static data:
 *    ```html
 *    <fluid-typeahead options='["Apple","Banana"]'></fluid-typeahead>
 *    ```
 *
 * 3. **Async loader**: for remote suggestions; called with the current query
 *    (debounced via the `debounce` attribute):
 *    ```html
 *    <fluid-typeahead .loadOptions=${async (q) => fetch(...)}></fluid-typeahead>
 *    ```
 *
 * 4. **Slotted children**: for richer option markup:
 *    ```html
 *    <fluid-typeahead>
 *      <fluid-option value="us">United States</fluid-option>
 *    </fluid-typeahead>
 *    ```
 *
 * Implements the WAI-ARIA combobox pattern. Form-associated.
 *
 * @summary Autocomplete text input.
 *
 * @slot - Optional `<fluid-option>` children with extra markup.
 *
 * @csspart base - The outer wrapper.
 * @csspart input - The text input.
 * @csspart listbox - The popover listbox.
 * @csspart option - Each option row.
 *
 * Every styled property reads a component-scoped `--fluid-typeahead-*` token
 * that falls back to a main semantic var (the override ladder), most fall
 * through to the shared `--fluid-field-*` tokens so a typeahead matches your
 * inputs by default.
 *
 * @cssproperty --fluid-typeahead-bg - Input and listbox background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-typeahead-fg - Input and option text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-typeahead-border - Default border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-typeahead-border-hover - Border color on hover. Falls back to --fluid-border-strong.
 * @cssproperty --fluid-typeahead-border-focus - Border color when focused / open. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-typeahead-border-width - Border width. Falls back to --fluid-field-border-width.
 * @cssproperty --fluid-typeahead-radius - Corner radius. Falls back to --fluid-field-border-radius.
 * @cssproperty --fluid-typeahead-font-family - Font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-typeahead-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-typeahead-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-typeahead-disabled-bg - Disabled state background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-typeahead-disabled-fg - Disabled state foreground. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-typeahead-placeholder-fg - Placeholder text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-typeahead-accent - Accent used for active rail, match highlight, selected text. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-typeahead-empty-fg - Empty/loading text color. Falls back to --fluid-text-secondary.
 *
 * @uses-token --fluid-surface-base - Input + listbox background.
 * @uses-token --fluid-surface-subtle - Disabled background.
 * @uses-token --fluid-border-default - Default borders.
 * @uses-token --fluid-border-strong - Border on hover.
 * @uses-token --fluid-accent-base - Focused state + highlight.
 * @uses-token --fluid-text-primary - Input + option text.
 * @uses-token --fluid-text-secondary - Placeholder, disabled, empty text.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum field height floor (24px AA / 44px AAA).
 * @uses-token --fluid-field-border-width - Default border width.
 * @uses-token --fluid-field-border-radius - Default corner radius.
 * @uses-token --fluid-field-height-sm - Field height at size="sm".
 * @uses-token --fluid-field-height-md - Field height at size="md".
 * @uses-token --fluid-field-height-lg - Field height at size="lg".
 * @uses-token --fluid-font-family-sans - Input font family.
 * @uses-token --fluid-shadow-lg - Listbox elevation.
 *
 * @fires fluid-input - Fired on every keystroke. detail.value is the current query.
 * @fires fluid-change - Fired when an option is selected. detail.option is the chosen TypeaheadOption.
 */
export class FluidTypeahead extends FluidFormAssociated {
  static override formAssociated = true;

  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
      max-width: 100%;
    }

    .base {
      position: relative;
      width: 100%;
    }

    .input-wrap {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      background: var(--fluid-typeahead-bg, var(--fluid-surface-base));
      border: var(--fluid-typeahead-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-typeahead-border, var(--fluid-border-default));
      border-radius: var(--fluid-typeahead-radius, var(--fluid-field-border-radius));
      box-shadow:
        inset 0 1px 0 0 rgb(0 0 0 / 0.02),
        0 1px 2px 0 rgb(0 0 0 / 0.04);
      transition:
        border-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        box-shadow var(--fluid-duration-fast) var(--fluid-easing-standard);
      font-family: var(--fluid-typeahead-font-family, var(--fluid-font-family-sans));
      color: var(--fluid-typeahead-fg, var(--fluid-text-primary));
    }

    .input-wrap:hover:not(.disabled):not(.focused) {
      border-color: var(--fluid-typeahead-border-hover, var(--fluid-border-strong));
    }

    .input-wrap.focused {
      border-color: var(--fluid-typeahead-border-focus, var(--fluid-accent-base));
      box-shadow:
        0 0 0 var(--fluid-typeahead-focus-ring-width, var(--fluid-focus-ring-width))
          color-mix(in srgb, var(--fluid-typeahead-focus-ring, var(--fluid-focus-ring-color)) 25%, transparent),
        inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }

    .input-wrap.disabled {
      background: var(--fluid-typeahead-disabled-bg, var(--fluid-surface-subtle));
      color: var(--fluid-typeahead-disabled-fg, var(--fluid-text-secondary));
      cursor: not-allowed;
    }

    /* Fused-dropdown styling, see fluid-select for the same pattern.
       When open, the listbox visually grows out of the input as one shape:
       seam edge is flat, halo wraps three sides, listbox borrows the same
       accent border to read as one element. */
    :host([open][data-placement="bottom"]) .input-wrap {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    /*
     * Drop the focus halo entirely when fused. The accent border on the
     * combined shape already signals focus clearly; the extra halo around the
     * input alone reads as a visual gap between input and listbox.
     */
    :host([open]) .input-wrap.focused {
      box-shadow: inset 0 1px 0 0 rgb(0 0 0 / 0.02);
    }
    :host([open][data-placement="top"]) .input-wrap {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    /*
     * SC 2.5.8 Target Size. min-height reads --fluid-target-min as a floor so
     * AAA (44px) lifts the field without touching the visual padding; AA stays
     * at the field height. Literal fallbacks keep the max() valid when the
     * field-height tokens aren't loaded (e.g. unit tests).
     */
    .size-sm {
      min-height: max(var(--fluid-field-height-sm, 1.75rem), var(--fluid-target-min, 0px));
      font-size: var(--fluid-font-size-sm);
    }
    .size-md {
      min-height: max(var(--fluid-field-height-md, 2.25rem), var(--fluid-target-min, 0px));
      font-size: var(--fluid-font-size-md);
    }
    .size-lg {
      min-height: max(var(--fluid-field-height-lg, 2.75rem), var(--fluid-target-min, 0px));
      font-size: var(--fluid-font-size-lg);
    }

    input {
      all: unset;
      flex: 1 1 auto;
      min-width: 0;
      font: inherit;
      color: inherit;
      line-height: var(--fluid-font-line-height-normal);
    }
    .size-sm input {
      padding: 0 var(--fluid-field-padding-x-sm);
    }
    .size-md input {
      padding: 0 var(--fluid-field-padding-x-md);
    }
    .size-lg input {
      padding: 0 var(--fluid-field-padding-x-lg);
    }
    input::placeholder {
      color: var(--fluid-typeahead-placeholder-fg, var(--fluid-text-secondary));
    }

    /*
     * position: fixed lets the listbox escape ancestor clipping (cards, modals).
     * floating-ui strategy matches in reposition(). Width is pinned to the
     * input width by the size middleware, no min-width:100% here because
     * with position:fixed that resolves against the viewport, not the input.
     */
    .listbox {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      box-sizing: border-box;
      max-height: 18rem;
      overflow-y: auto;
      background: var(--fluid-typeahead-bg, var(--fluid-surface-base));
      border: var(--fluid-typeahead-border-width, var(--fluid-field-border-width)) solid
        var(--fluid-typeahead-border, var(--fluid-border-default));
      border-radius: var(--fluid-typeahead-radius, var(--fluid-field-border-radius));
      box-shadow: var(--fluid-shadow-lg);
      padding: var(--fluid-space-1);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--fluid-duration-fast) var(--fluid-easing-standard),
        visibility 0s var(--fluid-duration-fast);
    }

    :host([open]) .listbox {
      opacity: 1;
      visibility: visible;
      transition-delay: 0s;
      border-color: var(--fluid-typeahead-border-focus, var(--fluid-accent-base));
    }

    :host([open][data-placement="bottom"]) .listbox {
      border-top: 0;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    :host([open][data-placement="top"]) .listbox {
      border-bottom: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .option {
      display: flex;
      align-items: center;
      padding: var(--fluid-space-2) var(--fluid-space-3);
      cursor: pointer;
      user-select: none;
      border-radius: var(--fluid-radius-sm);
      font-size: inherit;
      color: var(--fluid-typeahead-fg, var(--fluid-text-primary));
      position: relative;
      transition:
        background-color var(--fluid-duration-fast) var(--fluid-easing-standard),
        color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /*
     * Active = keyboard-focused option. Brand-tinted background with a 2px
     * accent rail on the left edge, more identifiable than a flat grey row,
     * and the rail visually anchors the highlight to the brand.
     */
    .option.active {
      background: color-mix(
        in srgb,
        var(--fluid-typeahead-accent, var(--fluid-accent-base)) 8%,
        transparent
      );
      color: var(--fluid-typeahead-fg, var(--fluid-text-primary));
    }
    .option.active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: var(--fluid-typeahead-accent, var(--fluid-accent-base));
      border-radius: var(--fluid-radius-full);
    }

    .option.selected {
      color: var(--fluid-typeahead-accent, var(--fluid-accent-base));
      font-weight: var(--fluid-font-weight-semibold);
    }

    .option-empty,
    .option-loading {
      padding: var(--fluid-space-3);
      color: var(--fluid-typeahead-empty-fg, var(--fluid-text-secondary));
      font-size: var(--fluid-font-size-sm);
      text-align: center;
    }

    /*
     * Match highlight, the matched substring inside an option's label.
     * Weight bump + accent color, no extra background, so it composes cleanly
     * with the active-row tint instead of fighting it.
     */
    .match {
      color: var(--fluid-typeahead-accent, var(--fluid-accent-base));
      font-weight: var(--fluid-font-weight-semibold);
    }
    .option.active .match,
    .option.selected .match {
      color: inherit;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;
  @query(".input-wrap") private wrapEl!: HTMLElement;
  @query(".listbox") private listboxEl!: HTMLElement;

  /**
   * Options. Accepts either a JS array (set via property: `.options=[...]`)
   * OR a JSON-encoded string (set via attribute: `options='[...]'`).
   * Lit handles both transparently because `type: Array` parses string
   * attributes as JSON.
   */
  @property({ type: Array }) options: RawOption[] = [];

  /**
   * Async loader. Called with the current query string after `debounce` ms.
   * Must return an array of options (or a Promise of one). Overrides the
   * static `options` prop when set.
   */
  @property({ attribute: false }) loadOptions?: (query: string) => Promise<RawOption[]> | RawOption[];

  /** Debounce delay (ms) for loadOptions calls. */
  @property({ type: Number, attribute: "debounce" }) debounceMs = 200;

  /** Minimum query length before opening + loading. */
  @property({ type: Number, attribute: "min-query" }) minQuery = 0;

  /** Maximum number of options shown in the listbox (after filtering). */
  @property({ type: Number, attribute: "max-options" }) maxOptions = 50;

  /** Current input value. Submitted with the form. */
  @property() override value = "";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  /** Placeholder. */
  @property() placeholder = "";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Open state. */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  /**
   * When true, restricts the input value to an option's value, typing
   * something that doesn't match clears on blur. Default false: free text.
   */
  @property({ type: Boolean, attribute: "strict" }) strict = false;

  @state() private focused = false;
  @state() private activeIndex = -1;
  @state() private filteredOptions: TypeaheadOption[] = [];
  @state() private loading = false;
  @state() private selectedValue: string | null = null;

  private listboxId = `fluid-typeahead-listbox-${++counter}`;
  private cleanupAutoUpdate?: () => void;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private lastQuery = "";

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.handleOutsideClick, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.handleOutsideClick, true);
    this.cleanupAutoUpdate?.();
    clearTimeout(this.debounceTimer);
  }

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "";
    this.selectedValue = null;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  /**
   * Normalize a raw option (string or {value,label}) into a TypeaheadOption.
   */
  private normalizeOptions(opts: RawOption[]): TypeaheadOption[] {
    return opts.map((o) =>
      typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label, data: o.data }
    );
  }

  /**
   * Read options from slotted `<fluid-option>` children, if any.
   */
  private slottedOptions(): TypeaheadOption[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>("slot:not([name])");
    const slotted = slot?.assignedElements({ flatten: true }) ?? [];
    return slotted
      .filter(
        (el): el is HTMLElement & { value: string } =>
          el.tagName.toLowerCase() === "fluid-option" && "value" in el
      )
      .map((el) => ({
        value: el.value,
        label: el.textContent?.trim() ?? el.value
      }));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value")) {
      this.syncFormValue();
    }
    // Re-filter whenever the value or options change so consumers driving the
    // input via the `value` property see the same filtered list as users
    // typing in the field.
    if ((changed.has("value") || changed.has("options")) && !this.loadOptions) {
      this.recomputeFiltered(this.value);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("open")) {
      if (this.open) this.openListbox();
      else this.closeListbox();
    }
  }

  private async openListbox(): Promise<void> {
    if (!this.wrapEl || !this.listboxEl) return;
    // Anchor to the input-wrap (the bordered shell) so the listbox aligns
    // with the visible field edge, not the inner native input.
    this.cleanupAutoUpdate = autoUpdate(this.wrapEl, this.listboxEl, () => this.reposition());
    await this.reposition();
    this.scrollActiveIntoView();
  }

  private closeListbox(): void {
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;
    this.activeIndex = -1;
    this.removeAttribute("data-placement");
  }

  private async reposition(): Promise<void> {
    if (!this.wrapEl || !this.listboxEl) return;
    const { x, y, placement } = await computePosition(this.wrapEl, this.listboxEl, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [
        // Sit flush against the input so the two read as a single shape.
        offset(0),
        // Decide flip based on the viewport, not the nearest scrollable card.
        flip({ boundary: "clippingAncestors", rootBoundary: "viewport" }),
        size({
          apply: ({ rects, elements }) => {
            // Pin width exactly to the input so the fused shape stays aligned.
            elements.floating.style.width = `${rects.reference.width}px`;
          }
        })
      ]
    });
    // Keep floating-ui's subpixel coords, input + listbox share the same
    // subpixel offset, so they line up. Rounding picks a different pixel
    // grid than the input and shifts the listbox half a pixel sideways.
    Object.assign(this.listboxEl.style, {
      left: `${x}px`,
      top: `${y}px`
    });
    this.setAttribute("data-placement", placement.startsWith("top") ? "top" : "bottom");
  }

  private scrollActiveIntoView(): void {
    if (!this.listboxEl) return;
    const opt = this.listboxEl.querySelectorAll(".option")[this.activeIndex];
    opt?.scrollIntoView({ block: "nearest" });
  }

  private recomputeFiltered(query: string): void {
    if (this.loadOptions) return; // async path handles its own pipeline
    const all = this.options.length ? this.normalizeOptions(this.options) : this.slottedOptions();
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((o) => o.label.toLowerCase().includes(q))
      : all;
    this.filteredOptions = filtered.slice(0, this.maxOptions);
    this.activeIndex = this.filteredOptions.length ? 0 : -1;
  }

  private scheduleLoad(query: string): void {
    if (!this.loadOptions) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      if (query !== this.lastQuery) return;
      this.loading = true;
      try {
        const raw = await this.loadOptions!(query);
        if (query !== this.lastQuery) return; // a newer query has arrived; drop stale result
        this.filteredOptions = this.normalizeOptions(raw).slice(0, this.maxOptions);
        this.activeIndex = this.filteredOptions.length ? 0 : -1;
      } finally {
        this.loading = false;
      }
    }, this.debounceMs);
  }

  private moveActive(delta: number): void {
    const n = this.filteredOptions.length;
    if (!n) return;
    this.activeIndex = (this.activeIndex + delta + n) % n;
    this.scrollActiveIntoView();
  }

  private commitOption(opt: TypeaheadOption): void {
    this.value = opt.label;
    this.selectedValue = opt.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: opt.value, label: opt.label, option: opt },
        bubbles: true,
        composed: true
      })
    );
  }

  private handleInput = (e: Event) => {
    const next = (e.target as HTMLInputElement).value;
    this.value = next;
    this.lastQuery = next;
    this.selectedValue = null;
    this.dispatchEvent(
      new CustomEvent("fluid-input", {
        detail: { value: next },
        bubbles: true,
        composed: true
      })
    );
    if (next.length >= this.minQuery) {
      this.open = true;
      if (this.loadOptions) this.scheduleLoad(next);
      else this.recomputeFiltered(next);
    } else {
      this.open = false;
    }
  };

  private handleFocus = () => {
    this.focused = true;
    // Pre-warm the filtered list so the listbox opens instantly when the user
    // hits ArrowDown, but don't auto-open on bare focus (would intrude on
    // tab-through-form flows).
    if (this.value.length >= this.minQuery) {
      if (this.loadOptions) this.scheduleLoad(this.value);
      else this.recomputeFiltered(this.value);
    }
  };

  private handleBlur = () => {
    this.focused = false;
    if (this.strict && this.selectedValue === null) {
      // Strict mode: invalid free text clears.
      this.value = "";
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          this.activeIndex = this.filteredOptions.length ? 0 : -1;
          this.scrollActiveIntoView();
        } else {
          this.moveActive(1);
        }
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          this.activeIndex = this.filteredOptions.length - 1;
          this.scrollActiveIntoView();
        } else {
          this.moveActive(-1);
        }
        return;
      case "Enter":
        if (this.open && this.activeIndex >= 0) {
          e.preventDefault();
          const opt = this.filteredOptions[this.activeIndex];
          if (opt) this.commitOption(opt);
        }
        return;
      case "Escape":
        if (this.open) {
          e.preventDefault();
          this.open = false;
        }
        return;
      case "Tab":
        if (this.open) this.open = false;
        return;
    }
  };

  private handleOptionClick = (e: Event) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".option");
    if (!el) return;
    const idx = Number(el.dataset.index);
    const opt = this.filteredOptions[idx];
    if (opt) this.commitOption(opt);
  };

  private handleOptionHover = (e: Event) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".option");
    if (!el) return;
    this.activeIndex = Number(el.dataset.index);
  };

  private handleOutsideClick = (e: PointerEvent) => {
    if (!this.open) return;
    if (e.composedPath().includes(this)) return;
    this.open = false;
  };

  private get activeId(): string | undefined {
    if (this.activeIndex < 0) return undefined;
    return `${this.listboxId}-opt-${this.activeIndex}`;
  }

  /** Highlight the matched portion of the label. */
  private renderLabel(label: string): TemplateResult {
    const q = this.value.trim();
    if (!q) return html`${label}`;
    const idx = label.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return html`${label}`;
    return html`${label.slice(0, idx)}<span class="match"
        >${label.slice(idx, idx + q.length)}</span
      >${label.slice(idx + q.length)}`;
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <div
          class=${classMap({
            "input-wrap": true,
            [`size-${this.size}`]: true,
            focused: this.focused,
            disabled: this.disabled
          })}
        >
          <input
            part="input"
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls=${this.listboxId}
            aria-activedescendant=${ifDefined(this.open ? this.activeId : undefined)}
            aria-autocomplete="list"
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            autocomplete="off"
            spellcheck="false"
            .value=${live(this.value)}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @input=${this.handleInput}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
            @keydown=${this.handleKeyDown}
          />
        </div>
        <div
          part="listbox"
          class="listbox"
          id=${this.listboxId}
          role="listbox"
          aria-label=${ifDefined(this.ariaLabel ?? undefined)}
          @click=${this.handleOptionClick}
          @pointermove=${this.handleOptionHover}
        >
          ${this.loading
            ? html`<div class="option-loading">Loading…</div>`
            : this.filteredOptions.length === 0
              ? html`<div class="option-empty">No matches</div>`
              : this.filteredOptions.map(
                  (opt, i) => html`
                    <div
                      part="option"
                      class=${classMap({
                        option: true,
                        active: i === this.activeIndex,
                        selected: opt.value === this.selectedValue
                      })}
                      role="option"
                      id=${`${this.listboxId}-opt-${i}`}
                      aria-selected=${opt.value === this.selectedValue ? "true" : "false"}
                      data-index=${i}
                    >
                      ${this.renderLabel(opt.label)}
                    </div>
                  `
                )}
        </div>
        <slot @slotchange=${() => this.requestUpdate()} style="display:none"></slot>
      </div>
    `;
  }
}
