import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import { marked, type MarkedOptions } from "marked";
import DOMPurify from "dompurify";

function sanitizeHtml(dirty: string): string {
  return String(DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } }));
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
 * Rendered HTML is sanitized with DOMPurify by default since `marked` does not
 * sanitize and `src` can fetch untrusted remote content. Set `trusted` to
 * bypass sanitization for known-safe input.
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
export class FluidMarkdown extends FluidElement {
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
      border-left: 3px solid var(--fluid-markdown-blockquote-border, var(--fluid-border-default));
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
  @state() private loadError: string | null = null;

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
    this.loadError = null;
    let source = this.value ?? "";
    if (this.src) {
      try {
        const response = await fetch(this.src);
        source = await response.text();
      } catch (e) {
        this.loadError = e instanceof Error ? e.message : String(e);
        return;
      }
    }
    const parsed = await marked.parse(source, this.options);
    this.rendered = this.trusted ? parsed : sanitizeHtml(parsed);
    this.dispatchEvent(new CustomEvent("fluid-render", { bubbles: true, composed: true }));
  }

  override render(): TemplateResult {
    if (this.loadError !== null) {
      return html`<div part="base" class="content" role="alert" dir=${this.localize.dir}>
        ${this.term("markdownLoadFailed", this.loadError)}
      </div>`;
    }
    return html`<div
      part="base"
      class="content"
      dir=${this.localize.dir}
      .innerHTML=${this.rendered as unknown as string}
    ></div>`;
  }
}
