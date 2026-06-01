import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, queryAssignedElements } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "../../internal/base-element.js";

let fieldIdCounter = 0;

/**
 * A form-field wrapper that pairs a label, an optional description / help text,
 * and an error message with a slotted control (any fluid input or native form
 * control). It owns the accessible plumbing so you don't have to: it generates
 * ids, wires `aria-describedby` on the slotted control to the description and
 * error text, sets `aria-invalid` when an error is present, and renders a
 * required indicator with screen-reader-only "required" text.
 *
 * There is no single APG widget for a field group; this composes native
 * labelling semantics (a real `<label>`, `aria-describedby`, `aria-invalid`,
 * and `role="alert"` on the error) around whatever control you slot in. The
 * `<label>` lives in this element's shadow root, so it cannot reach a slotted
 * light-DOM control by `for`; we therefore mirror the label text onto the
 * control as `aria-label` so it has an accessible name across the shadow
 * boundary. An accessible name the author set on the control always wins.
 *
 * @summary Label + description + error wrapper for a slotted control.
 *
 * @slot - The form control. Place exactly one focusable control here.
 * @slot label - Rich label content (overrides the `label` attribute when set).
 * @slot description - Rich description content (overrides the `description` attribute).
 * @slot error - Rich error content (overrides the `error` attribute).
 *
 * @csspart base - The field container.
 * @csspart label - The `<label>` element.
 * @csspart required - The required indicator ("*").
 * @csspart control - The wrapper around the slotted control.
 * @csspart description - The description / help text.
 * @csspart error - The error message (carries `role="alert"` when present).
 *
 * Every styled property reads a component-scoped `--fluid-field-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of per-field override knobs; `@uses-token` is every
 * main var they fall back to.
 *
 * @cssproperty --fluid-field-gap - Vertical gap between label, control, and messages. Falls back to --fluid-space-1.
 * @cssproperty --fluid-field-label-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-field-label-font-size - Label font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-field-label-font-weight - Label font weight. Falls back to --fluid-font-weight-medium.
 * @cssproperty --fluid-field-description-fg - Description text color. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-field-description-font-size - Description font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-field-error-fg - Error text color. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-field-error-font-size - Error font size. Falls back to --fluid-font-size-sm.
 * @cssproperty --fluid-field-required-fg - Required indicator color. Falls back to --fluid-danger-base.
 * @cssproperty --fluid-field-font-family - Font family for the field text. Falls back to --fluid-font-family-sans.
 *
 * @uses-token --fluid-space-1 - Default vertical gap.
 * @uses-token --fluid-space-2 - Bottom margin under the label.
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-text-secondary - Description text color.
 * @uses-token --fluid-danger-base - Error and required-indicator color (theme-independent).
 * @uses-token --fluid-font-size-sm - Label, description, and error font size.
 * @uses-token --fluid-font-weight-medium - Label font weight.
 * @uses-token --fluid-font-line-height-normal - Line height for the text rows.
 * @uses-token --fluid-font-family-sans - Default font family.
 */
export class FluidField extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      /*
       * Pin typography on :host so slotted text and our own rows share a
       * predictable line-height regardless of the host page's prose styles
       * (the slotted-content gotcha).
       */
      font-family: var(--fluid-field-font-family, var(--fluid-font-family-sans));
      line-height: var(--fluid-font-line-height-normal);
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-field-* token
     * that falls back to a main semantic var, so a consumer can retheme one
     * field, all fields, or the whole system. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: flex;
      flex-direction: column;
      gap: var(--fluid-field-gap, var(--fluid-space-1));
    }

    .label {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25em;
      margin: 0;
      color: var(--fluid-field-label-fg, var(--fluid-text-primary));
      font-size: var(--fluid-field-label-font-size, var(--fluid-font-size-sm));
      font-weight: var(--fluid-field-label-font-weight, var(--fluid-font-weight-medium));
      line-height: var(--fluid-font-line-height-normal);
    }

    .label[hidden] {
      display: none;
    }

    /*
     * The required indicator is a visual "*"; the actual semantic is carried
     * by the sr-only "required" text and by the control's own required state,
     * so the asterisk is decorative (aria-hidden) and color is never the only
     * cue (SC 1.4.1).
     */
    .required {
      color: var(--fluid-field-required-fg, var(--fluid-danger-base));
    }

    .control {
      display: block;
    }

    .description {
      margin: 0;
      color: var(--fluid-field-description-fg, var(--fluid-text-secondary));
      font-size: var(--fluid-field-description-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-normal);
    }

    .error {
      margin: 0;
      color: var(--fluid-field-error-fg, var(--fluid-danger-base));
      font-size: var(--fluid-field-error-font-size, var(--fluid-font-size-sm));
      line-height: var(--fluid-font-line-height-normal);
    }

    .description[hidden],
    .error[hidden] {
      display: none;
    }

    /* Visually hidden but available to assistive tech (SC 1.3.1). */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Neutralize stray prose margins on slotted content (slotted-content gotcha). */
    ::slotted(*) {
      margin: 0 !important;
    }
  `;

  /** The label text. Use the `label` slot for rich content. */
  @property() label = "";

  /** Optional description / help text shown under the label. */
  @property() description = "";

  /** Error message. When set, the control is marked invalid and the error gets `role="alert"`. */
  @property({ reflect: true }) error = "";

  /** Marks the field required: shows the indicator and exposes "required" to assistive tech. */
  @property({ type: Boolean, reflect: true }) required = false;

  /**
   * The id of the control the label points at (the `<label for>` target). When
   * omitted, the slotted control should already carry its own accessible name;
   * we still wire `aria-describedby` / `aria-invalid` on it via `slotchange`.
   */
  @property() for?: string;

  @queryAssignedElements({ slot: undefined, flatten: true })
  private controlElements!: HTMLElement[];

  private readonly uid = ++fieldIdCounter;
  private readonly descriptionId = `fluid-field-desc-${this.uid}`;
  private readonly errorId = `fluid-field-error-${this.uid}`;

  private get control(): HTMLElement | undefined {
    return this.controlElements?.find(
      (el) => el.nodeType === Node.ELEMENT_NODE
    );
  }

  private handleSlotChange = (): void => {
    this.wireControl();
  };

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("description") ||
      changed.has("error") ||
      changed.has("for") ||
      changed.has("label")
    ) {
      this.wireControl();
    }
  }

  /**
   * Set aria-describedby (to the description + error ids that are actually
   * present) and aria-invalid on the slotted control, without clobbering any
   * describedby the consumer already set on it.
   */
  private wireControl(): void {
    const control = this.control;
    if (!control) return;

    const described: string[] = [];
    if (this.hasDescription) described.push(this.descriptionId);
    if (this.hasError) described.push(this.errorId);

    if (described.length > 0) {
      control.setAttribute("aria-describedby", described.join(" "));
    } else {
      control.removeAttribute("aria-describedby");
    }

    if (this.hasError) {
      control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("aria-invalid");
    }

    this.wireLabel(control);
  }

  /**
   * Associate the field's visible label with the slotted control. The `<label>`
   * lives in this element's shadow root, so a native `for` reference cannot
   * reach a control sitting in the light DOM, and `aria-labelledby` likewise
   * cannot cross the shadow boundary by id. We therefore mirror the label text
   * onto the control as `aria-label`, giving it an accessible name that holds
   * across the boundary, while the visible `<label>` still serves sighted
   * users. We only manage names we set ourselves (tracked with a marker) so an
   * author-provided `aria-label` / `aria-labelledby` always wins.
   */
  private wireLabel(control: HTMLElement): void {
    const ownsName = control.hasAttribute("data-fluid-field-label");
    const authorLabelled =
      !ownsName &&
      (control.hasAttribute("aria-label") ||
        control.hasAttribute("aria-labelledby"));
    if (authorLabelled) return;

    const text = this.labelText();
    if (text) {
      control.setAttribute("aria-label", text);
      control.setAttribute("data-fluid-field-label", "");
    } else if (ownsName) {
      control.removeAttribute("aria-label");
      control.removeAttribute("data-fluid-field-label");
    }
  }

  /** The plain-text label, from the `label` attribute or the `label` slot. */
  private labelText(): string {
    const fromAttr = this.label.trim();
    if (fromAttr) return fromAttr;
    const slotted = this.querySelector('[slot="label"]');
    return slotted?.textContent?.trim() ?? "";
  }

  private get hasDescription(): boolean {
    return this.description.trim().length > 0 || this.hasSlotted("description");
  }

  private get hasError(): boolean {
    return this.error.trim().length > 0 || this.hasSlotted("error");
  }

  private get hasLabel(): boolean {
    return this.label.trim().length > 0 || this.hasSlotted("label");
  }

  private hasSlotted(name: string): boolean {
    return this.querySelector(`[slot="${name}"]`) !== null;
  }

  override render(): TemplateResult {
    const showDescription = this.hasDescription;
    const showError = this.hasError;

    return html`
      <div part="base" class="base">
        <label
          part="label"
          class="label"
          for=${ifDefined(this.for)}
          ?hidden=${!this.hasLabel}
        >
          <span><slot name="label">${this.label}</slot></span>
          ${this.required
            ? html`<span part="required" class="required" aria-hidden="true">*</span
                ><span class="sr-only">required</span>`
            : ""}
        </label>

        ${showDescription
          ? html`<div part="description" class="description" id=${this.descriptionId}>
              <slot name="description">${this.description}</slot>
            </div>`
          : ""}

        <div part="control" class="control">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>

        ${showError
          ? html`<div
              part="error"
              class="error"
              id=${this.errorId}
              role="alert"
            >
              <slot name="error">${this.error}</slot>
            </div>`
          : ""}
      </div>
    `;
  }
}
