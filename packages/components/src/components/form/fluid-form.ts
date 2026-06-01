import { html, css, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

/**
 * A thin wrapper around a native `<form>` that coordinates Fluid
 * form-associated controls. It is standards-based: it renders a real
 * `<form>`, lets the browser collect values via `FormData`, and only adds the
 * validation orchestration and a clean submit event on top.
 *
 * On submit it runs `checkValidity()` across the form, focuses the first
 * invalid control, and:
 *   - emits `fluid-submit` with `{ values }` (a plain object collected from the
 *     named light-DOM controls) when every control is valid, OR
 *   - emits `fluid-invalid` when any control is invalid.
 *
 * The native submit is always prevented: this element drives submission
 * through events so a host stays in control of what happens next (fetch,
 * navigation, framework router, etc.). Set `novalidate` to skip the validity
 * gate and always emit `fluid-submit`.
 *
 * It is NOT itself form-associated: it IS the form. Because the native `<form>`
 * lives in this element's shadow root, slotted controls are not its DOM
 * descendants, so values, validity, and reset are driven over the named
 * light-DOM controls (native input/select/textarea and Fluid form-associated
 * custom elements) rather than through `new FormData(form)`. The shadow
 * `<form>` is kept (with `novalidate`) so the platform still fires `submit` on
 * Enter and the actions slot can host real submit/reset buttons.
 *
 * @summary Wrapper that coordinates Fluid form controls and emits a clean submit event.
 *
 * @slot - The form fields (inputs, selects, Fluid controls).
 * @slot actions - Submit / reset buttons and other form actions.
 *
 * @csspart base - The inner native `<form>` element.
 * @csspart actions - The actions region wrapping the `actions` slot.
 *
 * Every styled property reads a component-scoped `--fluid-form-*` token that
 * falls back to a main semantic var (the override ladder).
 *
 * @cssproperty --fluid-form-gap - Vertical gap between fields. Falls back to --fluid-space-4.
 * @cssproperty --fluid-form-actions-gap - Gap between items in the actions slot. Falls back to --fluid-space-2.
 * @cssproperty --fluid-form-actions-margin - Space above the actions region. Falls back to --fluid-space-2.
 *
 * @uses-token --fluid-space-4 - Default vertical gap between fields.
 * @uses-token --fluid-space-2 - Default actions gap and top margin.
 *
 * @fires fluid-submit - Dispatched on a valid submit. `detail.values` is a
 *   plain object collected from the named light-DOM controls. Repeated field
 *   names collapse to a string array.
 * @fires fluid-invalid - Dispatched when submit is blocked by an invalid
 *   control. `detail.invalid` is the first invalid element (already focused).
 */
export class FluidForm extends FluidElement {
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
      gap: var(--fluid-form-gap, var(--fluid-space-4));
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--fluid-form-actions-gap, var(--fluid-space-2));
      margin-top: var(--fluid-form-actions-margin, var(--fluid-space-2));
    }

    /* Collapse the actions region when nothing is slotted into it. */
    .actions:not(:has(*)) {
      display: none;
    }

    ::slotted(*) {
      margin: 0;
    }
  `;

  @query("form") private formEl!: HTMLFormElement;

  /**
   * Skip the validity gate. When set, submit always emits `fluid-submit`
   * without running `checkValidity()`, mirroring the native `novalidate`
   * attribute on `<form>`.
   */
  @property({ type: Boolean, reflect: true }) novalidate = false;

  /** The inner native `<form>` element, once rendered. */
  get nativeForm(): HTMLFormElement | null {
    return this.formEl ?? null;
  }

  /**
   * Submit the form programmatically. Runs the same validity gate and emits
   * the same events as a user submit.
   */
  submit(): void {
    this.formEl?.requestSubmit();
  }

  /**
   * Run `checkValidity()` over the form without submitting. Returns true when
   * every light-DOM control is valid.
   */
  checkValidity(): boolean {
    return this.firstInvalid() === null;
  }

  /**
   * Reset every light-DOM control to its initial value. Native controls reset
   * to their default attribute (defaultValue / defaultChecked / default
   * option); Fluid form-associated controls get `formResetCallback()` (or, as a
   * fallback, their initial `value` attribute reassigned).
   */
  reset(): void {
    for (const el of this.lightControls()) {
      resetControl(el);
    }
  }

  /**
   * The named light-DOM controls this form coordinates. The native `<form>`
   * lives in our shadow root, so slotted controls are NOT its descendants:
   * we walk our own light DOM by `[name]` instead, covering native
   * input/select/textarea and Fluid form-associated custom elements (which
   * expose a `name` attribute plus a `.value` property).
   */
  private lightControls(): Element[] {
    return Array.from(this.querySelectorAll("[name]"));
  }

  /**
   * Collect the form's values as a plain object. Repeated names collapse to an
   * array; disabled controls and unchecked checkboxes/radios are skipped, and a
   * multi-select contributes one entry per selected option.
   */
  private collectValues(): Record<string, string | string[]> {
    const values: Record<string, string | string[]> = {};
    const add = (name: string, value: string): void => {
      const existing = values[name];
      if (existing === undefined) {
        values[name] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        values[name] = [existing, value];
      }
    };

    for (const el of this.lightControls()) {
      const name = el.getAttribute("name");
      if (!name) continue;
      if (isDisabled(el)) continue;
      for (const value of controlValues(el)) {
        add(name, value);
      }
    }
    return values;
  }

  /**
   * Find the first invalid control in DOM order, across native controls and
   * Fluid form-associated elements (both expose `checkValidity()` /
   * `willValidate`).
   */
  private firstInvalid(): HTMLElement | null {
    for (const el of this.lightControls()) {
      if (isDisabled(el)) continue;
      const candidate = el as Element & {
        checkValidity?: () => boolean;
        willValidate?: boolean;
      };
      if (typeof candidate.checkValidity !== "function") continue;
      if (candidate.willValidate === false) continue;
      if (!candidate.checkValidity()) return el as HTMLElement;
    }
    return null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The submit button and the editable controls live in the light DOM, not
    // inside our shadow `<form>`, so the platform never wires them to that form.
    // We listen on the host instead: a click on a `type="submit"` control, or
    // Enter pressed in a single-line text field, drives the same gate as
    // `submit()`.
    this.addEventListener("click", this.handleClick);
    this.addEventListener("keydown", this.handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.handleClick);
    this.removeEventListener("keydown", this.handleKeydown);
  }

  private handleClick = (event: MouseEvent): void => {
    const target = event.target as Element | null;
    const submitter = target?.closest?.("[type='submit']");
    if (submitter && this.contains(submitter)) {
      event.preventDefault();
      this.triggerSubmit();
    }
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.defaultPrevented) return;
    const target = event.target as Element | null;
    // Mirror native implicit submission: Enter in a single-line text input
    // submits the form; Enter in a textarea inserts a newline.
    if (target instanceof HTMLInputElement && target.type !== "textarea") {
      event.preventDefault();
      this.triggerSubmit();
    }
  };

  // The shadow `<form>` carries `novalidate`, so the browser never blocks this
  // on invalid controls. It fires when something inside the shadow form submits
  // (or via `submit()` -> requestSubmit()); we run our own gate either way.
  private handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    this.triggerSubmit();
  };

  /**
   * Run the validity gate over the light-DOM controls, then emit `fluid-submit`
   * with the collected values, or `fluid-invalid` (focusing the first offender)
   * when a control is invalid.
   *
   * The gate (firstInvalid / focus) runs synchronously so we preempt the native
   * submit, but the outgoing event is dispatched on a microtask. That decouples
   * it from the triggering click / keypress (the trigger has fully settled and
   * the host's listener is attached before our event lands), which is exactly
   * what a host expects when it reacts to a submit via fetch or routing.
   */
  private triggerSubmit(): void {
    if (!this.novalidate) {
      const invalid = this.firstInvalid();
      if (invalid) {
        // reportValidity surfaces the native validity UI where supported.
        if (typeof (invalid as HTMLElement & { reportValidity?: () => boolean }).reportValidity === "function") {
          (invalid as HTMLElement & { reportValidity: () => boolean }).reportValidity();
        }
        invalid.focus();
        queueMicrotask(() => {
          this.dispatchEvent(
            new CustomEvent("fluid-invalid", {
              detail: { invalid },
              bubbles: true,
              composed: true
            })
          );
        });
        return;
      }
    }

    const values = this.collectValues();
    queueMicrotask(() => {
      this.dispatchEvent(
        new CustomEvent("fluid-submit", {
          detail: { values },
          bubbles: true,
          composed: true
        })
      );
    });
  }

  override render(): TemplateResult {
    return html`
      <form
        part="base"
        class="base"
        novalidate
        @submit=${this.handleSubmit}
      >
        <slot></slot>
        <div part="actions" class="actions">
          <slot name="actions"></slot>
        </div>
      </form>
    `;
  }
}

/* Light-DOM control helpers ──────────────────────────────────────────────── */

/** A control is skipped when it (or a participating fieldset) is disabled. */
function isDisabled(el: Element): boolean {
  const candidate = el as Element & { disabled?: boolean };
  return candidate.disabled === true;
}

/**
 * Read the submittable string value(s) of a single control:
 *   - checkbox / radio: contributes only when checked (value, default "on").
 *   - multi-select: one entry per selected option.
 *   - single select / input / textarea: the current value.
 *   - Fluid form-associated element: its `.value`, with a string[] flattened
 *     and any non-string (File / FormData / null) coerced to a string.
 */
function controlValues(el: Element): string[] {
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio") {
      return el.checked ? [el.value || "on"] : [];
    }
    return [el.value];
  }
  if (el instanceof HTMLTextAreaElement) {
    return [el.value];
  }
  if (el instanceof HTMLSelectElement) {
    if (el.multiple) {
      return Array.from(el.selectedOptions, (option) => option.value);
    }
    return [el.value];
  }
  // Fluid form-associated custom element: read its `.value` property.
  const value = (el as Element & { value?: unknown }).value;
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value == null) return [""];
  return [String(value)];
}

/** Restore a single control to its initial value. */
function resetControl(el: Element): void {
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = el.defaultChecked;
    } else {
      el.value = el.defaultValue;
    }
    return;
  }
  if (el instanceof HTMLTextAreaElement) {
    el.value = el.defaultValue;
    return;
  }
  if (el instanceof HTMLSelectElement) {
    for (const option of Array.from(el.options)) {
      option.selected = option.defaultSelected;
    }
    return;
  }
  // Fluid form-associated element: prefer its reset lifecycle hook, else fall
  // back to reassigning the initial `value` attribute.
  const candidate = el as Element & {
    formResetCallback?: () => void;
    value?: unknown;
  };
  if (typeof candidate.formResetCallback === "function") {
    candidate.formResetCallback();
    return;
  }
  if ("value" in candidate) {
    candidate.value = el.getAttribute("value") ?? "";
  }
}
