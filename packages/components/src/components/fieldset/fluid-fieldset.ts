import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, queryAssignedElements } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";

let fieldsetIdCounter = 0;

/**
 * Groups a set of related form controls under a shared caption, rendering a
 * real native `<fieldset>` with a `<legend>`, an optional description and an
 * optional error message, and a default slot for the fields themselves.
 *
 * Native `<fieldset>` / `<legend>` is the correct semantic for grouping
 * related controls (it is the analog the APG Radio Group pattern points at),
 * so this component wraps the platform element rather than reinventing it with
 * ARIA. The legend gives the group an accessible name; the error region is a
 * `role="alert"` live region so it is announced when it appears.
 *
 * Setting `disabled` propagates a native `disabled` attribute onto the slotted
 * controls. A native `<fieldset disabled>` already disables nested native form
 * controls, but custom elements (the `fluid-*` controls) do not observe their
 * ancestor's disabled state, so we mirror it onto each assigned element on
 * `slotchange` and whenever `disabled` changes.
 *
 * @summary Native fieldset + legend that groups related fields.
 *
 * @slot - The grouped form controls.
 * @slot legend - Rich legend content (overrides the `legend` attribute when set).
 * @slot description - Rich description content (overrides the `description` attribute).
 * @slot error - Rich error content (overrides the `error` attribute).
 *
 * @csspart base - The native `<fieldset>` container.
 * @csspart legend - The native `<legend>` element.
 * @csspart description - The description / help text.
 * @csspart error - The error message (carries `role="alert"` when present).
 *
 * Every styled property reads a component-scoped `--fluid-fieldset-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of per-fieldset override knobs; `@uses-token` is
 * every main var they fall back to.
 *
 * @cssproperty --fluid-fieldset-gap - Vertical gap between legend, description, fields, and error. Falls back to --fluid-space-3.
 * @cssproperty --fluid-fieldset-padding - Inner padding of the fieldset. Falls back to --fluid-space-4.
 * @cssproperty --fluid-fieldset-radius - Border radius of the fieldset. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-fieldset-border - Border color of the fieldset. Falls back to --fluid-border-default.
 * @cssproperty --fluid-fieldset-bg - Background color of the fieldset. Falls back to transparent.
 * @cssproperty --fluid-fieldset-legend-fg - Legend text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-fieldset-legend-font-size - Legend font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-fieldset-legend-font-weight - Legend font weight. Falls back to --fluid-font-weight-semibold.
 * @cssproperty --fluid-fieldset-description-fg - Description text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-fieldset-description-font-size - Description font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-fieldset-error-fg - Error text color. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-fieldset-error-font-size - Error font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-fieldset-font-family - Font family for the fieldset text. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-space-3 - Default vertical gap.
 * @uses-token --fluid-space-4 - Default inner padding.
 * @uses-token --fluid-radius-md - Default border radius.
 * @uses-token --fluid-border-default - Border color.
 * @uses-token --fluid-text-primary - Legend text color.
 * @uses-token --fluid-text-secondary - Description text color.
 * @uses-token --fluid-danger-base - Error text color (theme-independent).
 * @uses-token --fluid-font-size-md - Legend font size.
 * @uses-token --fluid-font-size-sm - Description and error font size.
 * @uses-token --fluid-font-weight-semibold - Legend font weight.
 * @uses-token --fluid-font-line-height-normal - Line height for the text rows.
 * @uses-token --fluid-font-family-sans - Default font family.
 */
export class FluidFieldset extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      /*
       * Pin typography on :host so slotted text and our own rows share a
       * predictable line-height regardless of the host page's prose styles
       * (the slotted-content gotcha).
       */
      font-family: var(--fluid-fieldset-font-family, var(--fluid-font-family-sans));
      line-height: var(--fluid-font-line-height-normal);
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-fieldset-* token
     * that falls back to a main semantic var, so a consumer can retheme one
     * fieldset, all fieldsets, or the whole system. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-fieldset-gap, var(--fluid-space-3));
      margin: 0;
      padding: var(--fluid-fieldset-padding, var(--fluid-space-4));
      border: 1px solid var(--fluid-fieldset-border, var(--fluid-border-default));
      border-radius: var(--fluid-fieldset-radius, var(--fluid-radius-md));
      background: var(--fluid-fieldset-bg, transparent);
      min-inline-size: 0;
    }

    .legend {
      padding: 0;
      color: var(--fluid-fieldset-legend-fg, var(--fluid-text-primary));
      font-size: var(--fluid-fieldset-legend-font-size, var(--fluid-font-size-md));
      font-weight: var(--fluid-fieldset-legend-font-weight, var(--fluid-font-weight-semibold));
      line-height: var(--fluid-font-line-height-normal);
    }

    .legend[hidden] {
      display: none;
    }

    .description {
      margin: 0;
      color: var(--fluid-fieldset-description-fg, var(--fluid-text-secondary));
      font-size: var(--fluid-fieldset-description-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-normal);
    }

    .fields {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-fieldset-gap, var(--fluid-space-3));
    }

    .error {
      margin: 0;
      color: var(--fluid-fieldset-error-fg, var(--fluid-danger-base));
      font-size: var(--fluid-fieldset-error-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-normal);
    }

    .description[hidden],
    .error[hidden] {
      display: none;
    }

    /* Neutralize stray prose margins on slotted content (slotted-content gotcha). */
    ::slotted(*) {
      margin: 0 !important;
    }
  `;

  /** The legend / caption text. Use the `legend` slot for rich content. */
  @property() legend = "";

  /** Optional description / help text shown under the legend. */
  @property() description = "";

  /** Error message. When set, the error region is shown with `role="alert"`. */
  @property({ reflect: true }) error = "";

  /**
   * Disables the group. Native nested controls are disabled by the native
   * `<fieldset disabled>`; we also mirror a `disabled` attribute onto every
   * assigned element so custom (`fluid-*`) controls disable too.
   */
  @property({ type: Boolean, reflect: true }) disabled = false;

  @queryAssignedElements({ slot: undefined, flatten: true })
  private fieldElements!: HTMLElement[];

  private readonly uid = ++fieldsetIdCounter;
  private readonly descriptionId = `fluid-fieldset-desc-${this.uid}`;
  private readonly errorId = `fluid-fieldset-error-${this.uid}`;

  private handleSlotChange = (): void => {
    this.propagateDisabled();
  };

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("disabled")) {
      this.propagateDisabled();
    }
  }

  /**
   * Mirror the group's `disabled` state onto each slotted control. We only
   * remove the attribute from controls we disabled ourselves (tracked with a
   * marker) so a control the author disabled independently stays disabled when
   * the group is re-enabled.
   */
  private propagateDisabled(): void {
    const elements = this.fieldElements ?? [];
    for (const el of elements) {
      if (this.disabled) {
        if (!el.hasAttribute("disabled")) {
          el.setAttribute("disabled", "");
          el.setAttribute("data-fluid-fieldset-disabled", "");
        }
      } else if (el.hasAttribute("data-fluid-fieldset-disabled")) {
        el.removeAttribute("disabled");
        el.removeAttribute("data-fluid-fieldset-disabled");
      }
    }
  }

  private get hasLegend(): boolean {
    return this.legend.trim().length > 0 || this.hasSlotted("legend");
  }

  private get hasDescription(): boolean {
    return this.description.trim().length > 0 || this.hasSlotted("description");
  }

  private get hasError(): boolean {
    return this.error.trim().length > 0 || this.hasSlotted("error");
  }

  private hasSlotted(name: string): boolean {
    return this.querySelector(`[slot="${name}"]`) !== null;
  }

  override render(): TemplateResult {
    const showDescription = this.hasDescription;
    const showError = this.hasError;
    const describedBy = [
      showDescription ? this.descriptionId : "",
      showError ? this.errorId : ""
    ]
      .filter(Boolean)
      .join(" ");

    return html`
      <fieldset
        part="base"
        class="base"
        ?disabled=${this.disabled}
        aria-describedby=${ifDefined(describedBy || undefined)}
      >
        <legend part="legend" class="legend" ?hidden=${!this.hasLegend}>
          <slot name="legend">${this.hasSlotted("legend") ? "" : this.legend}</slot>
        </legend>

        ${showDescription
          ? html`<div part="description" class="description" id=${this.descriptionId}>
              <slot name="description">${this.description}</slot>
            </div>`
          : ""}

        <div class="fields">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>

        ${showError
          ? html`<div part="error" class="error" id=${this.errorId} role="alert">
              <slot name="error">${this.error}</slot>
            </div>`
          : ""}
      </fieldset>
    `;
  }
}
