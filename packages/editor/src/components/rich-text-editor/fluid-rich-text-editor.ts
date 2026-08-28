import { html, svg, css, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import DOMPurify from "dompurify";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

const sanitizeHtml = (value: string): string =>
  String(DOMPurify.sanitize(value, { USE_PROFILES: { html: true } }));

// TypeScript 5.8's DOM library predates this optional browser capability.
// An intersection also remains compatible with newer libraries that declare it.
type ComposedSelection = Selection & {
  getComposedRanges?: (options?: { shadowRoots?: ShadowRoot[] }) => StaticRange[];
};

/** A formatting command exposed by the toolbar. */
interface ToolbarCommand {
  /** The execCommand name (or "createLink" / "removeFormat"). */
  readonly cmd: string;
  /** Shared localization term for the button's accessible name. */
  readonly term:
    | "editorBold"
    | "editorItalic"
    | "editorUnderline"
    | "editorBulletList"
    | "editorNumberedList"
    | "editorLink"
    | "editorClearFormatting";
  /** Whether the button is a toggle (reflects aria-pressed). */
  readonly toggle: boolean;
  /** Inline SVG path data. */
  readonly icon: TemplateResult;
}

const icon = (body: TemplateResult): TemplateResult => html`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${body}
  </svg>
`;

const COMMANDS: readonly ToolbarCommand[] = [
  {
    cmd: "bold",
    term: "editorBold",
    toggle: true,
    icon: icon(svg`<path d="M6 4h8a4 4 0 0 1 0 8H6z" /><path d="M6 12h9a4 4 0 0 1 0 8H6z" />`)
  },
  {
    cmd: "italic",
    term: "editorItalic",
    toggle: true,
    icon: icon(
      svg`<line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />`
    )
  },
  {
    cmd: "underline",
    term: "editorUnderline",
    toggle: true,
    icon: icon(svg`<path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />`)
  },
  {
    cmd: "insertUnorderedList",
    term: "editorBulletList",
    toggle: true,
    icon: icon(
      svg`<line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />`
    )
  },
  {
    cmd: "insertOrderedList",
    term: "editorNumberedList",
    toggle: true,
    icon: icon(
      svg`<line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4l2-3H4" />`
    )
  },
  {
    cmd: "createLink",
    term: "editorLink",
    toggle: false,
    icon: icon(
      svg`<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />`
    )
  },
  {
    cmd: "removeFormat",
    term: "editorClearFormatting",
    toggle: false,
    icon: icon(
      svg`<path d="M4 7V5h12v2" /><path d="M9 5v9" /><line x1="14" y1="14" x2="20" y2="20" /><line x1="20" y1="14" x2="14" y2="20" />`
    )
  }
];

/**
 * A lightweight, accessible WYSIWYG rich-text editor. A roving-tabindex toolbar
 * (role="toolbar") of toggle buttons sits above a `contenteditable` region
 * exposed as a multi-line textbox. Formatting uses `document.execCommand`, which
 * is deprecated yet still universally supported and adequate for a small editor;
 * no external editor library is pulled in.
 *
 * The editable region takes its accessible name from the `label` prop and shows
 * the `placeholder` while empty. Get or set the HTML via the `value` property;
 * setting it replaces the editable content. Each input dispatches `fluid-change`
 * with the current HTML, and the toggle buttons reflect `aria-pressed` from
 * `document.queryCommandState` whenever the selection changes.
 * Horizontal toolbar arrows follow its rendered direction: Right advances in
 * LTR and Left advances in RTL. Vertical arrows retain command-order semantics.
 *
 * @summary Accessible contenteditable WYSIWYG with a formatting toolbar.
 *
 * @csspart base - The editor root (toolbar + editable region).
 * @csspart toolbar - The formatting toolbar.
 * @csspart button - A toolbar button.
 * @csspart editable - The contenteditable textbox.
 *
 * @cssproperty --fluid-editor-bg - Editable region background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-editor-fg - Text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-editor-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-editor-toolbar-bg - Toolbar background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-editor-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-editor-focus - Focus ring color. Falls back to --fluid-accent-base.
 *
 * @uses-token --fluid-surface-base - Editable background.
 * @uses-token --fluid-surface-muted - Toolbar background.
 * @uses-token --fluid-text-primary - Editable text color.
 * @uses-token --fluid-text-secondary - Placeholder + toolbar icon color.
 * @uses-token --fluid-border-default - Border color.
 * @uses-token --fluid-accent-base - Focus ring + active toggle color.
 * @uses-token --fluid-accent-text - Active toggle foreground.
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-radius-sm - Toolbar button radius.
 * @uses-token --fluid-font-family-sans - Editor font family.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset (AA / AAA).
 * @uses-token --fluid-target-min - Minimum control target (24px AA / 44px AAA).
 *
 * @fires fluid-change - The content changed. `detail: { value }` (current HTML).
 */
export class FluidRichTextEditor extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
    }
    .base {
      border: 1px solid var(--fluid-editor-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-editor-radius, var(--fluid-radius-md, 0.5rem));
      overflow: hidden;
      background: var(--fluid-editor-bg, var(--fluid-surface-base, #ffffff));
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.125rem;
      padding: 0.25rem;
      background: var(--fluid-editor-toolbar-bg, var(--fluid-surface-muted, #f4f4f5));
      border-bottom: 1px solid var(--fluid-editor-border, var(--fluid-border-default, #e4e4e7));
    }
    .button {
      display: inline-grid;
      place-items: center;
      min-width: max(2rem, var(--fluid-target-min, 0px));
      min-height: max(2rem, var(--fluid-target-min, 0px));
      padding: 0.25rem;
      border: 1px solid transparent;
      border-radius: var(--fluid-radius-sm, 0.25rem);
      background: transparent;
      color: var(--fluid-text-secondary, #3f3f46);
      cursor: pointer;
    }
    .button:hover {
      background: var(--fluid-editor-bg, var(--fluid-surface-base, #ffffff));
    }
    .button:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-editor-focus, var(--fluid-accent-base, #4f46e5));
      outline-offset: var(--fluid-focus-ring-offset, 2px);
    }
    .button[aria-pressed="true"] {
      background: var(--fluid-editor-focus, var(--fluid-accent-base, #4f46e5));
      color: var(--fluid-accent-text, #ffffff);
    }
    .button svg {
      width: 1.125rem;
      height: 1.125rem;
    }
    .editable {
      min-height: 8rem;
      padding: 0.75rem;
      color: var(--fluid-editor-fg, var(--fluid-text-primary, #18181b));
      background: var(--fluid-editor-bg, var(--fluid-surface-base, #ffffff));
      line-height: 1.6;
      outline: none;
      overflow-wrap: break-word;
    }
    .editable:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid
        var(--fluid-editor-focus, var(--fluid-accent-base, #4f46e5));
      outline-offset: calc(-1 * var(--fluid-focus-ring-width, 2px));
    }
    .editable:empty::before {
      content: attr(data-placeholder);
      color: var(--fluid-text-secondary, #3f3f46);
      pointer-events: none;
    }
    .editable :where(p, ul, ol):first-child {
      margin-top: 0;
    }
  `;

  /** The editor content as an HTML string. Setting it replaces the editable content. */
  @property({ attribute: false })
  get value(): string {
    return this.editable ? this.editable.innerHTML : this._value;
  }
  set value(html: string) {
    const old = this._value;
    const safeHtml = sanitizeHtml(html);
    this._value = safeHtml;
    if (this.editable && this.editable.innerHTML !== safeHtml) {
      // Live Ranges relocate when their nodes are removed. Such a range can
      // still appear contained here but no longer represents the user's selection.
      this.savedRange = null;
      this.editable.innerHTML = safeHtml;
    }
    this.requestUpdate("value", old);
  }
  private _value = "";

  /** Accessible name for the editable region. */
  @property({ type: String })
  get label(): string {
    return this.labelOverride ?? this.term("richTextEditor");
  }
  set label(value: string | null) {
    this.labelOverride = value;
  }
  private labelOverride: string | null = null;

  /** Placeholder shown while the editor is empty. */
  @property({ type: String }) placeholder = "";

  /** Keep the content selectable but prevent editing and toolbar commands. */
  @property({ type: Boolean, reflect: true, attribute: "readonly" }) readOnly = false;

  @state() private active = 0;
  @state() private pressed: Record<string, boolean> = {};

  @query(".editable") private editable!: HTMLDivElement;
  private savedRange: Range | null = null;
  private savedBackward = false;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("selectionchange", this.onSelectionChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("selectionchange", this.onSelectionChange);
    this.savedRange = null;
  }

  override firstUpdated(): void {
    if (this._value && this.editable.innerHTML !== this._value) {
      this.editable.innerHTML = this._value;
    }
  }

  private onSelectionChange = (): void => {
    if (!this.editable) return;
    const sel: ComposedSelection | null = document.getSelection();
    if (!sel || !sel.rangeCount) return;
    let range: AbstractRange | undefined;
    if (typeof sel.getComposedRanges === "function") {
      // The document Selection can retarget shadow endpoints to their hosts.
      // Expose only our own and containing roots to recover the actual range.
      const shadowRoots: ShadowRoot[] = [];
      let root = this.editable.getRootNode();
      while (root instanceof ShadowRoot) {
        shadowRoots.push(root);
        root = root.host.getRootNode();
      }
      [range] = sel.getComposedRanges({ shadowRoots });
    } else {
      range = sel.getRangeAt(0);
    }
    if (
      !range ||
      !this.editable.contains(range.startContainer) ||
      !this.editable.contains(range.endContainer)
    )
      return;
    const snapshot = document.createRange();
    snapshot.setStart(range.startContainer, range.startOffset);
    snapshot.setEnd(range.endContainer, range.endOffset);
    this.savedRange = snapshot;
    this.savedBackward =
      sel.direction === "backward" ||
      (!range.collapsed &&
        sel.anchorNode === range.endContainer &&
        sel.anchorOffset === range.endOffset);
    this.syncPressed();
  };

  private syncPressed(): void {
    const next: Record<string, boolean> = {};
    for (const c of COMMANDS) {
      if (!c.toggle) continue;
      try {
        next[c.cmd] = document.queryCommandState(c.cmd);
      } catch {
        next[c.cmd] = false;
      }
    }
    this.pressed = next;
  }

  private exec(c: ToolbarCommand): void {
    if (this.readOnly) return;
    this.editable.focus();
    if (this.savedRange && this.editable.contains(this.savedRange.commonAncestorContainer)) {
      const selection = document.getSelection();
      selection?.setBaseAndExtent(
        this.savedBackward ? this.savedRange.endContainer : this.savedRange.startContainer,
        this.savedBackward ? this.savedRange.endOffset : this.savedRange.startOffset,
        this.savedBackward ? this.savedRange.startContainer : this.savedRange.endContainer,
        this.savedBackward ? this.savedRange.startOffset : this.savedRange.endOffset
      );
    }
    if (c.cmd === "createLink") {
      const url = window.prompt(this.term("editorLinkUrl"));
      if (url) document.execCommand("createLink", false, url);
    } else {
      document.execCommand(c.cmd, false);
    }
    this.syncPressed();
    this.emitChange();
  }

  private emitChange(): void {
    const safeHtml = sanitizeHtml(this.editable.innerHTML);
    if (safeHtml !== this.editable.innerHTML) {
      this.savedRange = null;
      this.editable.innerHTML = safeHtml;
    }
    // execCommand can synchronously dispatch input. A command/paste and its
    // native input must not report the same content mutation twice.
    if (safeHtml === this._value) return;
    this._value = safeHtml;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { value: this._value },
        bubbles: true,
        composed: true
      })
    );
  }

  private onInput(): void {
    if (this.readOnly) {
      if (this.editable.innerHTML !== this._value) {
        this.savedRange = null;
        this.editable.innerHTML = this._value;
      }
      return;
    }
    this.syncPressed();
    this.emitChange();
  }

  private onPaste(event: ClipboardEvent): void {
    if (this.readOnly) {
      event.preventDefault();
      return;
    }
    const htmlValue = event.clipboardData?.getData("text/html");
    if (!htmlValue) return;
    event.preventDefault();
    document.execCommand("insertHTML", false, sanitizeHtml(htmlValue));
    this.emitChange();
  }

  private onToolbarKeydown(e: KeyboardEvent): void {
    if (this.readOnly) return;
    const last = COMMANDS.length - 1;
    let next = this.active;
    const rtl = getComputedStyle(e.currentTarget as Element).direction === "rtl";
    if (
      (e.key === "ArrowRight" && !rtl) ||
      (e.key === "ArrowLeft" && rtl) ||
      e.key === "ArrowDown"
    ) {
      next = this.active >= last ? 0 : this.active + 1;
    } else if (
      (e.key === "ArrowLeft" && !rtl) ||
      (e.key === "ArrowRight" && rtl) ||
      e.key === "ArrowUp"
    ) {
      next = this.active <= 0 ? last : this.active - 1;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = last;
    } else {
      return;
    }
    e.preventDefault();
    this.active = next;
    this.updateComplete.then(() => {
      const buttons = this.renderRoot.querySelectorAll<HTMLButtonElement>('[part="button"]');
      if (this.isConnected && !this.readOnly) buttons[next]?.focus();
    });
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base" dir=${this.localize.dir}>
        <div
          part="toolbar"
          class="toolbar"
          role="toolbar"
          aria-orientation="horizontal"
          aria-label=${this.term("editorFormatting")}
          @keydown=${this.onToolbarKeydown}
        >
          ${COMMANDS.map((c, i) => {
            const pressed = c.toggle ? String(Boolean(this.pressed[c.cmd])) : undefined;
            return html`
              <button
                part="button"
                class="button"
                type="button"
                aria-label=${this.term(c.term)}
                aria-pressed=${ifDefined(pressed)}
                tabindex=${i === this.active ? "0" : "-1"}
                ?disabled=${this.readOnly}
                @pointerdown=${(event: PointerEvent) => {
                  this.onSelectionChange();
                  event.preventDefault();
                }}
                @click=${() => this.exec(c)}
                @focus=${() => {
                  this.active = i;
                }}
              >
                ${c.icon}
              </button>
            `;
          })}
        </div>
        <div
          part="editable"
          class="editable"
          contenteditable=${this.readOnly ? "false" : "true"}
          tabindex="0"
          role="textbox"
          aria-multiline="true"
          aria-readonly=${String(this.readOnly)}
          aria-label=${this.label}
          data-placeholder=${this.placeholder}
          @input=${this.onInput}
          @paste=${this.onPaste}
          @focusout=${this.onSelectionChange}
        ></div>
      </div>
    `;
  }
}
