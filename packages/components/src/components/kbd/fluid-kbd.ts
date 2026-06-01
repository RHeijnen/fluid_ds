import { html, css, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A keyboard key: renders slotted text inside a styled `<kbd>` so shortcuts and
 * key hints read as real keyboard input to assistive tech.
 *
 * @summary Display a keyboard key or shortcut.
 *
 * @slot - The key label (e.g. `Ctrl`, `⌘`, `Enter`).
 *
 * @csspart base - The `<kbd>` element.
 *
 * @cssproperty --fluid-kbd-bg - Key background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-kbd-fg - Key text. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-kbd-border - Key border. Falls back to --fluid-border-default.
 * @cssproperty --fluid-kbd-radius - Corner radius. Falls back to --fluid-radius-sm.
 *
 * @uses-token --fluid-surface-muted - Key background.
 * @uses-token --fluid-text-primary - Key text.
 * @uses-token --fluid-border-default - Key border.
 * @uses-token --fluid-radius-sm - Corner radius.
 */
export class FluidKbd extends FluidElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    :host([hidden]) {
      display: none;
    }
    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.6em;
      padding: 0.15em 0.45em;
      box-sizing: border-box;
      font-family: var(--fluid-font-family-mono, ui-monospace, monospace);
      font-size: var(--fluid-font-size-xs, 0.75rem);
      line-height: 1.4;
      color: var(--fluid-kbd-fg, var(--fluid-text-primary));
      background: var(--fluid-kbd-bg, var(--fluid-surface-muted));
      border: 1px solid var(--fluid-kbd-border, var(--fluid-border-default));
      border-bottom-width: 2px;
      border-radius: var(--fluid-kbd-radius, var(--fluid-radius-sm, 4px));
    }
    :host([size="sm"]) kbd { font-size: 0.6875rem; }
    :host([size="lg"]) kbd { font-size: var(--fluid-font-size-sm, 0.875rem); }
  `;

  /** Key size. */
  @property({ reflect: true }) size: "sm" | "md" | "lg" = "md";

  override render(): TemplateResult {
    return html`<kbd part="base"><slot></slot></kbd>`;
  }
}
