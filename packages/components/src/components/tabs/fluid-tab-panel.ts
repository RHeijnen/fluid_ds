import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

let counter = 0;

/**
 * A content panel paired with a `<fluid-tab>`.
 *
 * @summary Panel displayed when its sibling tab is active.
 *
 * @slot - Panel content.
 */
export class FluidTabPanel extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      padding: var(--fluid-space-4) 0;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  /** Panel name (matched against `<fluid-tab>`'s `panel` attribute). */
  @property() name = "";

  /** Whether this panel is currently the active one. Managed by `<fluid-tabs>`. */
  @property({ type: Boolean, reflect: true }) active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("role", "tabpanel");
    if (!this.id) this.id = `fluid-tab-panel-${++counter}`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("active")) {
      if (this.active) this.removeAttribute("hidden");
      else this.setAttribute("hidden", "");
    }
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}
