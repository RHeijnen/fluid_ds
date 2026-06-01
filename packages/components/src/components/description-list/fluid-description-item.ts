import { html, css, type TemplateResult } from "lit";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A single key/value pair inside a `<fluid-description-list>`. Renders a term
 * (the key, via the `term` slot) above or beside its detail (the value, in the
 * default slot).
 *
 * The item is presentational. It carries `role="listitem"` so the parent's
 * `role="list"` produces a correct list in the accessibility tree. Within the
 * item the term is marked up as a `<dt>`-equivalent label and the detail as the
 * value; a screen reader reading the listitem announces the term text followed
 * by the detail text, which mirrors how a native `<dl>` pair reads.
 *
 * A real `<dl>`/`<dt>`/`<dd>` is not used here because the parent must project
 * authored items through a `<slot>`, which a shadow `<dl>` may not legally
 * contain (see `<fluid-description-list>` for the full rationale). The list /
 * listitem role pairing matches the precedent set by `<fluid-steps>` and
 * `<fluid-timeline>`.
 *
 * @summary One key/value pair: a term and its detail.
 *
 * @slot term - The term (key / label) for this pair.
 * @slot - The detail (value) for this pair.
 *
 * Every styled property reads a component-scoped `--fluid-description-item-*`
 * token that falls back to a main semantic var (the override ladder).
 *
 * @csspart base - The pair wrapper.
 * @csspart term - The term (key) element.
 * @csspart detail - The detail (value) element.
 *
 * @cssproperty --fluid-description-item-term-fg - Term text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-description-item-term-font-size - Term font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-description-item-term-font-weight - Term font weight. Falls back to --fluid-font-weight-medium.
 * @cssproperty --fluid-description-item-detail-fg - Detail text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-description-item-detail-font-size - Detail font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-description-item-gap - Gap between the term and its detail. Falls back to --fluid-space-1.
 *
 * @uses-token --fluid-text-secondary - Default term text color.
 * @uses-token --fluid-text-primary - Default detail text color.
 * @uses-token --fluid-font-size-sm - Default term font size.
 * @uses-token --fluid-font-size-md - Default detail font size.
 * @uses-token --fluid-font-weight-medium - Default term font weight.
 * @uses-token --fluid-space-1 - Default gap between the term and detail.
 */
export class FluidDescriptionItem extends FluidElement {
  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-description-item-gap, var(--fluid-space-1));
      min-width: 0;
    }

    .term {
      font-size: var(--fluid-description-item-term-font-size, var(--fluid-font-size-sm));
      font-weight: var(
        --fluid-description-item-term-font-weight,
        var(--fluid-font-weight-medium)
      );
      color: var(--fluid-description-item-term-fg, var(--fluid-text-secondary));
      margin: 0;
    }

    .detail {
      font-size: var(--fluid-description-item-detail-font-size, var(--fluid-font-size-md));
      color: var(--fluid-description-item-detail-fg, var(--fluid-text-primary));
      margin: 0;
      min-width: 0;
      overflow-wrap: break-word;
    }

    /* Slotted content inherits the host page CSS, not these shadow styles, so
       reset stray margins that a prose context would otherwise apply. */
    ::slotted(*) {
      margin: 0 !important;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  override render(): TemplateResult {
    return html`
      <div part="base" class="base">
        <span part="term" class="term">
          <slot name="term"></slot>
        </span>
        <span part="detail" class="detail">
          <slot></slot>
        </span>
      </div>
    `;
  }
}
