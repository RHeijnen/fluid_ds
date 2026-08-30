import { LitElement, html, css, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { groupSemanticTokens, groupUserFacingPrimitives, type TokenEntry } from "./manifest.js";
import { themeStore } from "./store.js";
import { selectionStore, type SelectionState } from "./selection-store.js";
import { componentOverridesStore } from "./component-overrides-store.js";
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
  `;

  @state() private query = "";
  @state() private openGroups = new Set<string>();
  @state() private changeCount = 0;
  @state() private selection: SelectionState = selectionStore.current;

  private unsubscribeTheme?: () => void;
  private unsubscribeSelection?: () => void;

  /**
   * Shared-theme diff as it stood when the current element was selected.
   * Pressing "Isolate" compares against this to find the edits made while
   * inspecting, and retroactively confines exactly those to the element.
   */
  private themeAtSelection: Record<string, string> = themeStore.diff();

  override connectedCallback(): void {
    super.connectedCallback();
    this.seedDefaultOpenGroup();
    this.unsubscribeTheme = themeStore.subscribe((overrides) => {
      this.changeCount = Object.keys(overrides).length;
    });
    this.unsubscribeSelection = selectionStore.subscribe((s) => {
      const anchoredElChanged = s.selectedEl !== this.selection.selectedEl;
      this.selection = s;
      if (anchoredElChanged) this.themeAtSelection = themeStore.diff();
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
    const tag = el?.tagName.toLowerCase() ?? this.selection.selectedTag;
    if (on && tag) {
      /*
       * Retroactively confine the session's pending edits to this component:
       * every shared-theme change made SINCE this component was selected moves
       * into a `fluid-x { ... }` rule, and the shared theme reverts to its
       * at-selection value. Visually the rest of the page snaps back and only
       * this component keeps the change, which is the promise of the button.
       */
      const now = themeStore.diff();
      for (const [cssVar, value] of Object.entries(now)) {
        if (this.themeAtSelection[cssVar] === value) continue;
        componentOverridesStore.set(tag, cssVar, value);
        themeStore.set(cssVar, this.themeAtSelection[cssVar] ?? "");
      }
      this.themeAtSelection = themeStore.diff();
    }
    if (!on && tag) {
      // Turning isolate OFF: drop the component rule so every instance goes
      // back to the shared theme.
      componentOverridesStore.clearTag(tag);
    }
    selectionStore.setIsolate(on);
  }

  /**
   * Which token groups the sidebar shows.
   *
   * No selection: the full primitive + semantic catalog, so the page still
   * works as a palette editor.
   *
   * Selected, not isolated: only the semantics this component actually reads.
   * Editing one of those is a shared-theme change and will move everything
   * else that reads the same token, which is the intent at this level.
   *
   * Selected and isolated: the component's own tokens, plus those same
   * semantics. Both are written into the component's own rule, so a change
   * reaches every instance of this component and stops there.
   */
  private buildGroups(): ReturnType<typeof groupUserFacingPrimitives> {
    const tag = this.selection.selectedTag;
    if (!tag) {
      return [...groupUserFacingPrimitives(), groupSemanticTokens("light")];
    }
    const entry = entriesFor(tag);
    if (!entry) {
      // Tag selected but no metadata for it: show everything rather than
      // leave the user with an empty panel.
      return [...groupUserFacingPrimitives(), groupSemanticTokens("light")];
    }
    const groups: ReturnType<typeof groupUserFacingPrimitives> = [];
    if (this.selection.isolate && entry.ownTokens.length) {
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
    if (entry.usesSemantics.length) {
      const allSemantic = groupSemanticTokens("light");
      const filteredSemantic = {
        ...allSemantic,
        label: this.selection.isolate
          ? "Shared tokens, scoped to this component"
          : "Shared tokens this component uses",
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
    const scope = isolate ? "component" : "global";

    return html`
      <div class="search">
        ${hasSelection
          ? html`
              <div class="selection-banner">
                <div class="selection-banner-row">
                  <span class="selection-tag">${this.selection.selectedTag}</span>
                  <button class="clear-selection" @click=${this.clearSelection}>Show all</button>
                </div>
                ${isolate
                  ? html`
                      <fluid-callout variant="success">
                        <span slot="header"> Scoped to every ${this.selection.selectedTag} </span>
                        Edits below are written to a
                        <code>${this.selection.selectedTag}</code> rule, so they reach every
                        instance of this component and nothing else. The rest of the page keeps the
                        shared theme. Paste the exported rule into your app and it behaves the same
                        way.
                      </fluid-callout>
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
                        <strong>every ${this.selection.selectedTag}</strong> and anything else using
                        these tokens. Want to restyle just this one instance? Isolate it.
                      </fluid-callout>
                      <fluid-button
                        class="isolate-cta"
                        variant="primary"
                        size="sm"
                        @fluid-click=${this.enableIsolate}
                      >
                        Scope changes to this component
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
                  ? { cls: "scope-component", text: "this component only" }
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
                    ${chip ? html`<span class="scope-chip ${chip.cls}">${chip.text}</span>` : ""}
                  </span>
                  <fluid-icon class="chevron" name="chevron-down"></fluid-icon>
                </button>
                ${hasSelection && groupRole === "global" && isOpen
                  ? isolate
                    ? html`<div class="scope-note">
                        While isolated, these are written to
                        <code>${this.selection.selectedTag}</code> only, not other components.
                      </div>`
                    : html`<div class="scope-note">
                        ⚠ These tokens are shared. Editing one will affect every component that
                        reads it. To scope a change to
                        <code>${this.selection.selectedTag}</code> only, turn on
                        <strong>Isolate</strong> above.
                      </div>`
                  : ""}
                <div class="group-body">
                  ${group.tokens.map(
                    (token) =>
                      html`<token-control
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

declare global {
  interface HTMLElementTagNameMap {
    "token-form": TokenForm;
  }
}
