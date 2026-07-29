import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { marked, type MarkedOptions } from "marked";

/**
 * Dependency-free HTML sanitizer. Parses the markup, strips dangerous
 * elements (script/style/iframe/object/embed/link/meta), and removes
 * event-handler attributes (on*) and `javascript:` URLs from href/src.
 * Returns sanitized HTML safe to assign via innerHTML.
 */
function sanitizeHtml(dirty: string): string {
  const template = document.createElement("template");
  template.innerHTML = dirty;

  const DANGEROUS_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "LINK",
    "META"
  ]);

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const toRemove: Element[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const el = node as Element;
    if (DANGEROUS_TAGS.has(el.tagName)) {
      toRemove.push(el);
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      // Strip whitespace + C0 control chars so obfuscated schemes
      // ("java\tscript:", "java script:") cannot slip past the prefix test.
      // eslint-disable-next-line no-control-regex
      const value = attr.value.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      } else if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    }
  }
  for (const el of toRemove) el.remove();

  return template.innerHTML;
}

/**
 * Renders Markdown to HTML inside the shadow DOM. Provide source in one
 * of three ways:
 *
 *   - inline text content (the default slot)
 *   - the `value` property
 *   - a remote URL via the `src` attribute
 *
 * Powered by [marked](https://marked.js.org/). Pass `marked` options via
 * the `options` property if you need GFM, breaks, etc.
 *
 * Rendered HTML is sanitized by default (script/style/iframe/object/embed/
 * link/meta elements, `on*` handlers, and `javascript:` URLs are stripped)
 * since `marked` does not sanitize and `src` can fetch untrusted remote
 * content. Set `trusted` to bypass sanitization for known-safe input.
 *
 * @summary Markdown renderer.
 *
 * @slot - Markdown source as a text node.
 *
 * @csspart base - The rendered output container.
 *
 * @cssproperty --fluid-markdown-color - Text color.
 * @cssproperty --fluid-markdown-code-bg - Background for inline and block code.
 * @cssproperty --fluid-markdown-blockquote-border - Blockquote left border color.
 * @cssproperty --fluid-markdown-blockquote-fg - Blockquote text color.
 * @cssproperty --fluid-markdown-link-fg - Link color.
 * @cssproperty --fluid-markdown-table-border - Table cell border color.
 *
 * @fires fluid-render - Fired when render completes.
 */
export class FluidMarkdown extends LitElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--fluid-markdown-color, inherit);
      font-family: var(--fluid-font-family-sans);
      line-height: 1.6;
    }
    .content :first-child {
      margin-top: 0;
    }
    .content :last-child {
      margin-bottom: 0;
    }
    .content h1,
    .content h2,
    .content h3,
    .content h4 {
      margin-top: 1.25em;
      margin-bottom: 0.5em;
      line-height: 1.25;
    }
    .content code {
      font-family: var(--fluid-font-family-mono, ui-monospace, monospace);
      background: var(--fluid-markdown-code-bg, var(--fluid-surface-muted));
      padding: 0.125em 0.25em;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .content pre {
      background: var(--fluid-markdown-code-bg, var(--fluid-surface-muted));
      padding: var(--fluid-space-3);
      border-radius: var(--fluid-radius-md);
      overflow-x: auto;
    }
    .content pre code {
      background: transparent;
      padding: 0;
    }
    .content blockquote {
      border-left: 3px solid
        var(--fluid-markdown-blockquote-border, var(--fluid-border-default));
      padding-left: var(--fluid-space-3);
      color: var(--fluid-markdown-blockquote-fg, var(--fluid-text-secondary));
      margin: 1em 0;
    }
    .content a {
      color: var(--fluid-markdown-link-fg, var(--fluid-accent-base, inherit));
    }
    .content table {
      border-collapse: collapse;
    }
    .content th,
    .content td {
      border: 1px solid var(--fluid-markdown-table-border, var(--fluid-border-default));
      padding: 0.4em 0.6em;
    }
  `;

  /** Markdown source. */
  @property() value: string | null = null;

  /** Fetch source from this URL. */
  @property() src: string | null = null;

  /** Pass-through options for marked. */
  @property({ attribute: false }) options: MarkedOptions = { gfm: true, breaks: false };

  /**
   * Skip HTML sanitization. Only set this when the markdown source is fully
   * trusted: it allows raw script/iframe/event-handler markup to execute.
   */
  @property({ type: Boolean }) trusted = false;

  @state() private rendered = "";

  override connectedCallback(): void {
    super.connectedCallback();
    // Treat the default slot's text content as source if value/src aren't set.
    if (this.value === null && this.src === null && this.textContent?.trim()) {
      this.value = this.textContent.trim();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("value") ||
      changed.has("src") ||
      changed.has("options") ||
      changed.has("trusted")
    )
      this.refresh();
  }

  private async refresh(): Promise<void> {
    let source = this.value ?? "";
    if (this.src) {
      try {
        const response = await fetch(this.src);
        source = await response.text();
      } catch (e) {
        this.rendered = `Failed to load markdown: ${(e as Error).message}`;
        return;
      }
    }
    const parsed = await marked.parse(source, this.options);
    this.rendered = this.trusted ? parsed : sanitizeHtml(parsed);
    this.dispatchEvent(new CustomEvent("fluid-render", { bubbles: true, composed: true }));
  }

  override render(): TemplateResult {
    return html`<div
      part="base"
      class="content"
      .innerHTML=${this.rendered as unknown as string}
    ></div>`;
  }
}
