import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { TokenEntry } from "./manifest.js";
import { themeStore } from "./store.js";
import { elementOverridesStore } from "./element-overrides-store.js";

/**
 * Where a control's edits land:
 *   - "global": the shared theme store (cascades to the whole preview).
 *   - "element": inline CSS variables on one specific preview element, so the
 *     change is isolated to that single instance.
 */
export type ControlScope = "global" | "element";

/**
 * Render the appropriate input control for a given token, wired to the store.
 *
 * Layout is vertical: label / path above, full-width control below. The
 * label row carries the "modified" pip and a reset affordance that appears
 * on hover when the token has been overridden.
 *
 * Mapping:
 *   color           → <fluid-color-picker> (which composes <fluid-input>)
 *   dimension+range → <fluid-slider> with value label
 *   duration+range  → <fluid-slider> with ms label
 *   fontFamily      → <fluid-input> (text fallback)
 *   *               → <fluid-input> (text fallback)
 */
@customElement("token-control")
export class TokenControl extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: var(--fluid-space-3) var(--fluid-space-4);
      transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    :host(:hover) {
      background: var(--fluid-surface-base);
    }

    :host([changed]) .pip {
      background: var(--fluid-accent-base);
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-2);
      margin-bottom: var(--fluid-space-2);
    }

    .label-stack {
      display: flex;
      align-items: baseline;
      gap: var(--fluid-space-2);
      min-width: 0;
    }

    .label {
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-medium);
      color: var(--fluid-text-primary);
      letter-spacing: var(--fluid-font-letter-spacing-tight);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    code {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .right-cluster {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      flex-shrink: 0;
    }

    .pip {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: transparent;
      transition: background-color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    .reset-btn {
      all: unset;
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      cursor: pointer;
      opacity: 0;
      transition: opacity var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .reset-btn:hover {
      color: var(--fluid-text-primary);
    }
    :host([changed]:hover) .reset-btn {
      opacity: 1;
    }

    .control {
      width: 100%;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
    }

    fluid-slider {
      flex: 1 1 auto;
    }

    .numeric {
      flex-shrink: 0;
      min-width: 3rem;
      text-align: right;
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      font-variant-numeric: tabular-nums;
    }
  `;

  @property({ attribute: false }) token!: TokenEntry;

  /** Edit target. Driven by the "Isolate to this element" toggle in the form. */
  @property() scope: ControlScope = "global";

  /** The element to scope edits to when `scope === "element"`. */
  @property({ attribute: false }) element: HTMLElement | null = null;

  @state() private current = "";

  /** Reflected as attribute so `:host([changed])` style works. */
  @property({ type: Boolean, reflect: true }) changed = false;

  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    // Global-store changes still drive a resync (e.g. preset load / reset),
    // and the immediate first call seeds `current` on mount.
    this.unsubscribe = themeStore.subscribe(() => this.syncFromSource());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("scope") || changed.has("element") || changed.has("token")) {
      this.syncFromSource();
    }
  }

  /** Pull the current value + changed-state from whichever scope is active. */
  private syncFromSource(): void {
    if (this.scope === "element" && this.element) {
      const inline = this.element.style.getPropertyValue(this.token.cssVar).trim();
      this.changed = inline !== "";
      // Seed the control from whatever the element is actually rendering.
      // Priority: inline > global override > resolved computed value. The
      // computed-style fallback matters because an element about to be
      // isolated usually inherits its color from a semantic token (e.g.
      // --fluid-button-bg falls back to --fluid-accent-base), so without
      // it the picker would open empty even though the element clearly
      // renders a color on screen.
      this.current =
        inline ||
        themeStore.get(this.token.cssVar) ||
        getComputedStyle(this.element).getPropertyValue(this.token.cssVar).trim() ||
        "";
    } else {
      this.current = themeStore.get(this.token.cssVar) ?? "";
      this.changed = !!themeStore.diff()[this.token.cssVar];
    }
  }

  private commit(value: string): void {
    if (this.scope === "element" && this.element) {
      // Two parallel writes:
      //  1. Inline style: so the change shows up instantly in the live
      //     preview without waiting for a store round-trip.
      //  2. elementOverridesStore: so the override is persisted (and will
      //     end up in the URL hash + CSS export later this pass).
      if (value === "") this.element.style.removeProperty(this.token.cssVar);
      else this.element.style.setProperty(this.token.cssVar, value);
      const id = this.element.getAttribute("data-fluid-id");
      if (id) elementOverridesStore.set(id, this.token.cssVar, value);
      this.syncFromSource();
    } else {
      themeStore.set(this.token.cssVar, value);
    }
  }

  private resetToken(): void {
    if (this.scope === "element" && this.element) {
      this.element.style.removeProperty(this.token.cssVar);
      const id = this.element.getAttribute("data-fluid-id");
      if (id) elementOverridesStore.set(id, this.token.cssVar, "");
      this.syncFromSource();
    } else {
      themeStore.set(this.token.cssVar, "");
    }
  }

  private renderControl(): TemplateResult {
    const t = this.token;
    if (t.type === "color") {
      return html`
        <fluid-color-picker
          class="control"
          .value=${this.current}
          aria-label=${labelOf(t)}
          @fluid-input=${(e: CustomEvent) => this.commit(e.detail.value)}
        ></fluid-color-picker>
      `;
    }
    if ((t.type === "dimension" || t.type === "duration") && t.range) {
      const numeric = stripUnit(this.current);
      return html`
        <div class="slider-row">
          <fluid-slider
            .min=${t.range.min}
            .max=${t.range.max}
            .step=${t.range.step ?? 1}
            .value=${String(numeric)}
            aria-label=${labelOf(t)}
            @fluid-input=${(e: CustomEvent) =>
              this.commit(`${e.detail.value}${t.range?.unit ?? ""}`)}
          ></fluid-slider>
          <span class="numeric">${this.current}</span>
        </div>
      `;
    }
    return html`
      <fluid-input
        class="control"
        size="sm"
        .value=${this.current}
        aria-label=${labelOf(t)}
        @fluid-input=${(e: CustomEvent) => this.commit(e.detail.value)}
      ></fluid-input>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="label-row">
        <div class="label-stack">
          <span class="label">${labelOf(this.token)}</span>
          <code>${this.token.cssVar}</code>
        </div>
        <div class="right-cluster">
          ${this.changed
            ? html`<button class="reset-btn" @click=${this.resetToken}>reset</button>`
            : ""}
          <span class="pip" aria-hidden="true"></span>
        </div>
      </div>
      ${this.renderControl()}
    `;
  }
}

function labelOf(t: TokenEntry): string {
  return t.path.slice(1).join(" / ") || t.path.join(" / ");
}

function stripUnit(value: string): number {
  const match = /^(-?\d+(\.\d+)?)/.exec(value);
  return match ? Number(match[1]) : 0;
}

declare global {
  interface HTMLElementTagNameMap {
    "token-control": TokenControl;
  }
}
