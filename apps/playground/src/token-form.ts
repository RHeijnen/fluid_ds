import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  groupSemanticTokens,
  groupUserFacingPrimitives,
  type TokenEntry
} from "./manifest.js";
import { themeStore } from "./store.js";
import { selectionStore, type SelectionState, generateFluidId } from "./selection-store.js";
import { elementOverridesStore } from "./element-overrides-store.js";
import { entriesFor } from "./component-tokens-map.js";
import "./controls.js";

/**
 * The token sidebar. Renders:
 *   - a search filter pinned to the top
 *   - one collapsible group per token category
 *   - per-row controls (delegated to <token-control>)
 *
 * Group headers expand/collapse independently. Search lifts that constraint:
 * when active, all matching groups are forced open so hits stay visible.
 */
@customElement("token-form")
export class TokenForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .search {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: var(--fluid-space-3) var(--fluid-space-4);
      background: var(--fluid-surface-subtle);
      border-bottom: 1px solid var(--fluid-border-default);
    }

    .summary {
      margin-top: var(--fluid-space-2);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
    }

    .summary strong {
      color: var(--fluid-accent-base);
      font-weight: var(--fluid-font-weight-semibold);
    }

    .group {
      border-bottom: 1px solid var(--fluid-border-default);
    }

    .group-header {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--fluid-space-3) var(--fluid-space-4);
      cursor: pointer;
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--fluid-font-letter-spacing-widest);
      color: var(--fluid-text-secondary);
      transition: color var(--fluid-duration-fast) var(--fluid-easing-standard);
    }
    .group-header:hover {
      color: var(--fluid-text-primary);
    }
    .group-header:focus-visible {
      outline: var(--fluid-focus-ring-width) solid var(--fluid-focus-ring-color);
      outline-offset: -2px;
    }

    .group-header-left {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
    }

    .count {
      font-weight: var(--fluid-font-weight-regular);
      font-size: var(--fluid-font-size-xs);
      letter-spacing: 0;
      color: var(--fluid-text-secondary);
      opacity: 0.7;
    }

    .chevron {
      transition: transform var(--fluid-duration-fast) var(--fluid-easing-standard);
      color: var(--fluid-text-secondary);
    }
    .group[open] .chevron {
      transform: rotate(180deg);
    }

    .group-body {
      display: none;
    }
    .group[open] .group-body {
      display: block;
    }

    .empty {
      padding: var(--fluid-space-6) var(--fluid-space-4);
      color: var(--fluid-text-secondary);
      font-size: var(--fluid-font-size-sm);
      text-align: center;
    }
    .empty code {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-primary);
      background: var(--fluid-surface-muted);
      padding: 1px var(--fluid-space-1);
      border-radius: var(--fluid-radius-sm);
    }

    .selection-banner {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
      margin-bottom: var(--fluid-space-2);
    }

    .selection-banner-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-2);
    }

    .selection-tag {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-sm);
      font-weight: var(--fluid-font-weight-semibold);
      color: var(--fluid-accent-base);
    }

    .selection-banner fluid-callout {
      font-size: var(--fluid-font-size-xs);
    }

    .selection-banner fluid-callout strong {
      font-weight: var(--fluid-font-weight-semibold);
    }

    /* Full-width call-to-action under the callout. */
    .isolate-cta {
      width: 100%;
    }
    .isolate-cta::part(base) {
      width: 100%;
      justify-content: center;
    }

    .clear-selection {
      all: unset;
      cursor: pointer;
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      text-decoration: underline;
    }
    .clear-selection:hover {
      color: var(--fluid-text-primary);
    }

    /*
     * Scope chips on group headers, make it impossible to accidentally edit
     * a global token while thinking you're scoping to one component.
     *   - scope-component (green-ish): edits affect ONLY the selected tag
     *   - scope-global (amber/danger): edits cascade to ANY component reading
     *     the semantic
     */
    .scope-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--fluid-font-size-xs);
      font-weight: var(--fluid-font-weight-semibold);
      letter-spacing: 0;
      text-transform: none;
      line-height: 1.2;
    }
    .scope-chip.scope-component {
      background: color-mix(in srgb, var(--fluid-color-success, #16a34a) 18%, transparent);
      color: var(--fluid-color-success, #16a34a);
      border: 1px solid color-mix(in srgb, var(--fluid-color-success, #16a34a) 40%, transparent);
    }
    .scope-chip.scope-global {
      background: color-mix(in srgb, var(--fluid-color-warning, #d97706) 16%, transparent);
      color: var(--fluid-color-warning, #d97706);
      border: 1px solid color-mix(in srgb, var(--fluid-color-warning, #d97706) 40%, transparent);
    }
    .scope-chip::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .scope-note {
      padding: var(--fluid-space-2) var(--fluid-space-4);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      background: var(--fluid-surface-muted);
    }

    .isolate-id-row {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
      margin-top: var(--fluid-space-2);
    }
    .isolate-id-label {
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-xs);
      color: var(--fluid-text-secondary);
      white-space: nowrap;
    }
    .isolate-id-row fluid-input {
      flex: 1 1 auto;
    }
  `;

  @state() private query = "";
  @state() private openGroups = new Set<string>();
  @state() private changeCount = 0;
  @state() private selection: SelectionState = selectionStore.current;

  private unsubscribeTheme?: () => void;
  private unsubscribeSelection?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.seedDefaultOpenGroup();
    this.unsubscribeTheme = themeStore.subscribe((overrides) => {
      this.changeCount = Object.keys(overrides).length;
    });
    this.unsubscribeSelection = selectionStore.subscribe((s) => {
      this.selection = s;
      // Selection changed, the list of groups changes too. Prune any open
      // entries that no longer exist, and if nothing's left open, seed the
      // first group of the new view so the user sees something instead of
      // a fully-collapsed sidebar.
      this.seedDefaultOpenGroup();
    });
  }

  /**
   * Make sure `openGroups` has at least one entry matching the currently-
   * rendered groups. Called on mount and after every selection change.
   * Honors the user's collapses, only seeds when openGroups is empty (or
   * contains only stale keys) after filtering to the current group list.
   */
  private seedDefaultOpenGroup(): void {
    const groups = this.buildGroups();
    const validKeys = new Set(groups.map((g) => g.key));
    const filtered = new Set<string>();
    for (const key of this.openGroups) {
      if (validKeys.has(key)) filtered.add(key);
    }
    if (filtered.size === 0 && groups[0]) filtered.add(groups[0].key);
    this.openGroups = filtered;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribeTheme?.();
    this.unsubscribeSelection?.();
  }

  private handleSearch = (e: CustomEvent) => {
    this.query = String(e.detail.value).trim().toLowerCase();
  };

  private toggleGroup(key: string): void {
    const next = new Set(this.openGroups);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.openGroups = next;
  }

  private tokenMatches(token: TokenEntry): boolean {
    if (!this.query) return true;
    return (
      token.cssVar.toLowerCase().includes(this.query) ||
      token.path.some((seg) => String(seg).toLowerCase().includes(this.query))
    );
  }

  private clearSelection = () => {
    selectionStore.setSelectedTag(null);
  };

  private enableIsolate = () => this.applyIsolate(true);
  private disableIsolate = () => this.applyIsolate(false);

  private applyIsolate(on: boolean): void {
    const el = this.selection.selectedEl;
    if (on && el) {
      // Stamp the element with a stable `data-fluid-id` if it doesn't have
      // one yet. The id is what the exported CSS rule selects on, so a
      // friendly slug (e.g. "button-1") is more discoverable than a random
      // GUID. The user can rename it from the sidebar later.
      if (!el.hasAttribute("data-fluid-id")) {
        el.setAttribute("data-fluid-id", generateFluidId(this.selection.selectedTag));
      }
    }
    if (!on && el) {
      // Turning isolate OFF: drop inline overrides, remove the id, and
      // clear the persistent store entry so the element fully reverts to
      // the shared theme.
      const id = el.getAttribute("data-fluid-id");
      clearElementTokenOverrides(el);
      if (id) {
        elementOverridesStore.clearId(id);
        el.removeAttribute("data-fluid-id");
      }
    }
    selectionStore.setIsolate(on);
  }

  /**
   * Rename the data-fluid-id of the selected element. Moves its overrides
   * in the store and updates the inline attribute so the export selector
   * keeps matching.
   */
  private renameSelectedId = (e: CustomEvent) => {
    const el = this.selection.selectedEl;
    if (!el) return;
    const raw = String(e.detail.value);
    // The id lands inside a CSS attribute selector, spaces / quotes /
    // slashes would break it. Slugify before we touch state, then mirror
    // the sanitized form back into the input so the user sees what's
    // really being exported.
    const next = slugifyId(raw);
    if (!next) return;
    const prev = el.getAttribute("data-fluid-id");
    if (!prev || prev === next) {
      el.setAttribute("data-fluid-id", next);
      if (raw !== next) this.requestUpdate();
      return;
    }
    // Move overrides in the store under the new key.
    const map = elementOverridesStore.forId(prev);
    elementOverridesStore.clearId(prev);
    for (const [k, v] of Object.entries(map)) elementOverridesStore.set(next, k, v);
    el.setAttribute("data-fluid-id", next);
    this.requestUpdate();
  };

  /**
   * Build the list of groups to show.
   *
   * The mental model is `$button-color: $primary`:
   *  - When NOT isolated, editing is supposed to flow through the shared
   *    palette: `$primary` is the right knob, not `$button-color`. So we
   *    show **only** the semantic tokens this component reads. Hiding the
   *    component-own tokens here is intentional, editing them while not
   *    isolated would write to the shared theme too, which is rarely what
   *    the user means in this mode.
   *  - When isolated, the whole point is to give this one instance unique
   *    values, exactly what the component-own tokens are for. So we show
   *    **only** the component's own tokens. Editing semantics in isolate
   *    mode would still cascade globally and miss the point.
   *
   * No selection: fall back to the full primitive + semantic catalog so
   * the page is still useful as a palette editor.
   */
  private buildGroups(): ReturnType<typeof groupUserFacingPrimitives> {
    const tag = this.selection.selectedTag;
    if (!tag) {
      return [...groupUserFacingPrimitives(), groupSemanticTokens("light")];
    }
    const entry = entriesFor(tag);
    if (!entry) {
      // Tag selected but we have no metadata, show everything so the user
      // isn't stuck.
      return [...groupUserFacingPrimitives(), groupSemanticTokens("light")];
    }
    const groups: ReturnType<typeof groupUserFacingPrimitives> = [];
    if (this.selection.isolate) {
      // Isolated → component-own only. Each token writes to the element's
      // inline styles via `<token-control scope="element">`.
      if (entry.ownTokens.length) {
        groups.push({
          key: "component-tokens",
          label: "This component",
          tokens: entry.ownTokens.map((ref) => ({
            path: ref.cssVar.replace(/^--fluid-/, "").split("-"),
            cssVar: ref.cssVar,
            type: ref.type as TokenEntry["type"],
            value: themeStore.get(ref.cssVar) ?? "",
            userFacing: true,
            range: ref.range
          }))
        });
      }
    } else if (entry.usesSemantics.length) {
      // Not isolated → semantics only, filtered to what this component reads.
      const allSemantic = groupSemanticTokens("light");
      const filteredSemantic = {
        ...allSemantic,
        label: "Shared tokens this component uses",
        tokens: allSemantic.tokens.filter((t) => entry.usesSemantics.includes(t.cssVar))
      };
      if (filteredSemantic.tokens.length) groups.push(filteredSemantic);
    }
    return groups;
  }

  override render(): TemplateResult {
    const groups = this.buildGroups();
    const searchActive = this.query.length > 0;
    const filtered = groups
      .map((g) => ({ ...g, tokens: g.tokens.filter((t) => this.tokenMatches(t)) }))
      .filter((g) => g.tokens.length > 0);
    const total = filtered.reduce((n, g) => n + g.tokens.length, 0);
    const designModeActive = this.selection.mode === "design";
    const hasSelection = !!this.selection.selectedTag;
    const isolate = this.selection.isolate;
    const scope = isolate ? "element" : "global";

    return html`
      <div class="search">
        ${hasSelection
          ? html`
              <div class="selection-banner">
                <div class="selection-banner-row">
                  <span class="selection-tag">${this.selection.selectedTag}</span>
                  <button class="clear-selection" @click=${this.clearSelection}>
                    Show all
                  </button>
                </div>
                ${isolate
                  ? html`
                      <fluid-callout variant="success">
                        <span slot="header">Isolated to this element</span>
                        Edits below are written to this one
                        <strong>${this.selection.selectedTag}</strong> only, every
                        other instance keeps the shared theme. The export rules
                        below target <code>data-fluid-id</code>, so drop the same
                        attribute on the matching element in your app.
                      </fluid-callout>
                      <div class="isolate-id-row">
                        <span class="isolate-id-label">data-fluid-id</span>
                        <fluid-input
                          size="sm"
                          .value=${this.selection.selectedEl?.getAttribute(
                            "data-fluid-id"
                          ) ?? ""}
                          aria-label="Element id used for the per-instance CSS selector"
                          @fluid-change=${this.renameSelectedId}
                        ></fluid-input>
                      </div>
                      <fluid-button
                        class="isolate-cta"
                        variant="ghost"
                        size="sm"
                        @fluid-click=${this.disableIsolate}
                      >
                        <fluid-icon slot="prefix" name="undo"></fluid-icon>
                        Stop isolating &amp; restore shared theme
                      </fluid-button>
                    `
                  : html`
                      <fluid-callout variant="info">
                        <span slot="header">You're editing the shared theme</span>
                        Changes apply to
                        <strong>every ${this.selection.selectedTag}</strong> and
                        anything else using these tokens. Want to restyle just this
                        one instance? Isolate it.
                      </fluid-callout>
                      <fluid-button
                        class="isolate-cta"
                        variant="primary"
                        size="sm"
                        @fluid-click=${this.enableIsolate}
                      >
                        Isolate to this element
                      </fluid-button>
                    `}
              </div>
            `
          : ""}
        <fluid-input
          size="sm"
          placeholder="Search tokens…"
          aria-label="Search tokens"
          .value=${this.query}
          @fluid-input=${this.handleSearch}
        >
          <fluid-icon slot="prefix" name="search"></fluid-icon>
        </fluid-input>
        <div class="summary">
          ${searchActive
            ? html`${total} match${total === 1 ? "" : "es"}`
            : hasSelection
              ? html`${total} token${total === 1 ? "" : "s"} for
                  ${isolate ? "this element" : "this component"}`
              : designModeActive
                ? html`Click a component on the right to inspect it.`
                : html`<strong>${this.changeCount}</strong> override${this.changeCount === 1
                      ? ""
                      : "s"}`}
        </div>
      </div>

      ${filtered.length === 0
        ? html`<div class="empty">
            ${this.query
              ? html`No tokens match "${this.query}"`
              : hasSelection
                ? html`No editable tokens for <code>${this.selection.selectedTag}</code> yet.`
                : html`No tokens.`}
          </div>`
        : filtered.map((group) => {
            // openGroups is seeded on mount + selection change so a fresh
            // view always has the first group visible. After that, expand /
            // collapse is fully driven by toggleGroup, no implicit
            // overrides, so user choices stick.
            const isOpen = searchActive || this.openGroups.has(group.key);
            const groupRole =
              group.key === "component-tokens"
                ? "component"
                : group.key === "semantic" || group.key.startsWith("semantic-")
                  ? "global"
                  : null;
            // While isolated, every edit lands on the one element, so even the
            // "global" group is scoped here. Reflect that in the chip + notes.
            const chip =
              !hasSelection || !groupRole
                ? null
                : isolate
                  ? { cls: "scope-component", text: "this element only" }
                  : groupRole === "component"
                    ? { cls: "scope-component", text: "this component only" }
                    : { cls: "scope-global", text: "global" };
            return html`
              <div class="group" ?open=${isOpen}>
                <button
                  class="group-header"
                  aria-expanded=${isOpen ? "true" : "false"}
                  @click=${() => this.toggleGroup(group.key)}
                >
                  <span class="group-header-left">
                    <span>${group.label}</span>
                    <span class="count">${group.tokens.length}</span>
                    ${chip
                      ? html`<span class="scope-chip ${chip.cls}">${chip.text}</span>`
                      : ""}
                  </span>
                  <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
                </button>
                ${hasSelection && groupRole === "global" && isOpen
                  ? isolate
                    ? html`<div class="scope-note">
                        While isolated, these are written to
                        <code>${this.selection.selectedTag}</code> only, not other
                        components.
                      </div>`
                    : html`<div class="scope-note">
                        ⚠ These tokens are shared. Editing one will affect every component that reads it.
                        To scope a change to <code>${this.selection.selectedTag}</code> only, turn on
                        <strong>Isolate</strong> above.
                      </div>`
                  : ""}
                <div class="group-body">
                  ${group.tokens.map(
                    (token) => html`<token-control
                      .token=${token}
                      .scope=${scope}
                      .element=${this.selection.selectedEl}
                    ></token-control>`
                  )}
                </div>
              </div>
            `;
          })}
    `;
  }
}

/** Remove every inline --fluid-* override this tool may have set on an element. */
function clearElementTokenOverrides(el: HTMLElement): void {
  const props: string[] = [];
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    if (prop && prop.startsWith("--fluid-")) props.push(prop);
  }
  for (const prop of props) el.style.removeProperty(prop);
}

/**
 * Turn arbitrary user input into a value that is safe inside a CSS
 * attribute selector. Mirrors the conventions designers expect for ids:
 * lowercase, ascii letters/digits/underscore/hyphen, no leading or trailing
 * separator, accents stripped. If the user types "Primary CTA / Mobile"
 * they get back "primary-cta-mobile".
 */
function slugifyId(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

declare global {
  interface HTMLElementTagNameMap {
    "token-form": TokenForm;
  }
}
