import { html, css, type TemplateResult, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import "../button/define.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

registerIcon(
  "copy",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
);
registerIcon(
  "check",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`
);

/**
 * A formatted, monospaced code block with a title/language bar and a copy
 * button.
 *
 * The default rendering is plain monospaced text, perfect for showing
 * generated config, JSON, or CSS. For syntax-highlighted output, slot
 * pre-highlighted HTML (e.g. a Shiki `<pre>`) into the `highlighted` slot; the
 * block strips its background so the surrounding chrome stays consistent and
 * only the token colors come through.
 *
 * A header bar appears whenever there's a `filename`, a `language`, or a copy
 * button to show. The copy button copies the `code` property, the slotted
 * highlighted text, or the default-slot text, in that order.
 *
 * @summary Read-only code display with a header bar and copy-to-clipboard.
 *
 * @slot - The raw code text. Used when no `highlighted` slot content is present.
 * @slot highlighted - Pre-highlighted HTML output (overrides the raw slot).
 *
 * @csspart base - The outer container.
 * @csspart header - The top bar holding the filename/language label and copy button.
 * @csspart body - The scrollable code area.
 * @csspart copy - The copy button.
 *
 * @cssproperty [--fluid-code-bg=var(--fluid-surface-subtle)] - Code area background.
 * @cssproperty [--fluid-code-fg=var(--fluid-text-primary)] - Code foreground (used when not syntax-highlighted).
 * @cssproperty [--fluid-code-border=var(--fluid-border-default)] - Border + header divider color.
 * @cssproperty [--fluid-code-header-bg=var(--fluid-surface-muted)] - Header bar background.
 *
 * @fires fluid-copy - Fired when the user copies the code. `event.detail.text`.
 */
export class FluidCodeBlock extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      border: 1px solid var(--fluid-code-border, var(--fluid-border-default));
      border-radius: var(--fluid-radius-md);
      background: var(--fluid-code-bg, var(--fluid-surface-subtle));
      color: var(--fluid-code-fg, var(--fluid-text-primary));
      overflow: hidden;
      font-family: var(--fluid-font-family-mono);
      font-size: var(--fluid-font-size-sm, 0.875rem);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--fluid-space-2);
      min-height: 2.25rem;
      padding-inline: var(--fluid-space-3) var(--fluid-space-1);
      background: var(--fluid-code-header-bg, var(--fluid-surface-muted));
      border-bottom: 1px solid var(--fluid-code-border, var(--fluid-border-default));
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-text-secondary);
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: var(--fluid-font-weight-medium, 500);
    }

    .label.is-lang {
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .body {
      padding: var(--fluid-space-4);
      overflow-x: auto;
      line-height: 1.55;
      tab-size: 2;
    }

    /* Plain-text fallback (the code prop / default slot). The highlighted
       slot is NOT wrapped in this, a slotted Shiki pre is projected straight
       into .body, so it doesn't pick up phantom line-boxes from sitting inside
       an inline code element in a white-space:pre block. */
    .plain {
      margin: 0;
      white-space: pre;
      font: inherit;
    }

    .plain code {
      font: inherit;
    }

    /* When highlighted HTML is slotted in (e.g. a Shiki <pre>), strip its own
       frame so our chrome owns the background, padding, radius, and scrolling.
       Critically, kill the slotted <pre>'s own overflow: a Shiki <pre> ships
       overflow-x: auto, which on a long line renders a SECOND horizontal
       scrollbar inside the block (its height showed up as ~16px of dead space
       at the bottom). The .body is the single scroll container; only its token
       colors should come through here. */
    ::slotted(pre) {
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: visible !important;
      background: transparent !important;
      font: inherit;
    }

    .copy {
      flex: none;
      --fluid-button-bg: transparent;
      --fluid-button-fg: var(--fluid-text-secondary);
    }
  `;

  /** Plain code string. Ignored if the `highlighted` slot has content. */
  @property() code = "";

  /** Optional filename / title shown on the left of the header bar. */
  @property({ reflect: true }) filename?: string;

  /** Optional language label (e.g. "css", "ts"). Shown when no filename is set, and in the copy tooltip. */
  @property() language?: string;

  /** Hide the copy button. */
  @property({ type: Boolean, attribute: "no-copy" }) noCopy = false;

  @state() private copied = false;

  private async handleCopy() {
    const text = this.code || this.textContent?.trim() || "";
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
      this.dispatchEvent(
        new CustomEvent("fluid-copy", {
          detail: { text },
          bubbles: true,
          composed: true
        })
      );
    } catch {
      /* clipboard unavailable, fail quiet */
    }
  }

  override render(): TemplateResult {
    const showCopy = !this.noCopy;
    const labelText = this.filename ?? this.language;
    const showHeader = showCopy || !!labelText;

    return html`
      <div part="base" class="base">
        ${showHeader
          ? html`
              <div part="header" class="header">
                ${labelText
                  ? html`<span class="label ${this.filename ? "" : "is-lang"}"
                      >${labelText}</span
                    >`
                  : html`<span></span>`}
                ${showCopy
                  ? html`
                      <fluid-button
                        part="copy"
                        class="copy"
                        variant="ghost"
                        size="sm"
                        @click=${this.handleCopy}
                      >
                        <fluid-icon
                          name=${this.copied ? "check" : "copy"}
                          label=${this.copied
                            ? "Copied"
                            : this.language
                              ? `Copy ${this.language} code`
                              : "Copy code"}
                        ></fluid-icon>
                      </fluid-button>
                    `
                  : nothing}
              </div>
            `
          : nothing}
        <div part="body" class="body"><slot name="highlighted"><pre class="plain"><code><slot>${this.code}</slot></code></pre></slot></div>
      </div>
    `;
  }
}
