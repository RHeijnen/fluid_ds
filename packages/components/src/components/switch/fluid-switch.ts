import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

/**
 * A toggle switch (on/off).
 *
 * Form-associated. Submits its `value` (default "on") when checked, or omits
 * the field entirely when unchecked, matching native checkbox semantics.
 *
 * @summary Two-state on/off control.
 *
 * @slot - Optional visible label.
 *
 * @csspart base - The outer container.
 * @csspart track - The track (background).
 * @csspart thumb - The moving thumb.
 * @csspart label - The label wrapper around the default slot.
 *
 * Every styled property reads a component-scoped `--fluid-switch-*` token that
 * falls back to a main semantic var (the override ladder). The `@cssproperty`
 * list is the complete set of override knobs; `@uses-token` is every main var
 * they fall back to.
 *
 * @cssproperty --fluid-switch-track-bg - Track background when off. Falls back to --fluid-color-neutral-300.
 * @cssproperty --fluid-switch-track-bg-on - Track background when on. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-switch-thumb-bg - Thumb color. Falls back to --fluid-color-white.
 * @cssproperty --fluid-switch-fg - Label text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-switch-radius - Track + thumb corner radius. Falls back to --fluid-radius-full.
 * @cssproperty --fluid-switch-gap - Gap between control and label. Falls back to --fluid-space-2.
 * @cssproperty --fluid-switch-font-family - Label font family. Falls back to --fluid-font-family-sans.
 * @cssproperty --fluid-switch-font-size - Label font size. Falls back to --fluid-font-size-md.
 * @cssproperty --fluid-switch-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-switch-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-switch-focus-ring-offset - Focus ring offset. Falls back to --fluid-focus-ring-offset.
 *
 * @uses-token --fluid-accent-base - Track color when checked.
 * @uses-token --fluid-color-neutral-300 - Track color when off.
 * @uses-token --fluid-color-white - Thumb color.
 * @uses-token --fluid-text-primary - Label text color.
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-target-min - Minimum hit-target height (24px AA / 44px AAA).
 * @uses-token --fluid-radius-full - Track + thumb radius.
 * @uses-token --fluid-space-2 - Gap between control and label.
 * @uses-token --fluid-font-family-sans - Label font family.
 * @uses-token --fluid-font-size-md - Label font size.
 * @uses-token --fluid-gradient-glossy - On-track sheen.
 * @uses-token --fluid-gradient-glossy-inverse - Off-track sheen.
 * @uses-token --fluid-duration-fast - Track/thumb transition duration (scaled by --fluid-motion).
 * @uses-token --fluid-motion - Global motion scalar; multiplies the toggle duration (0 = off).
 * @uses-token --fluid-easing-standard - Track/thumb transition easing.
 *
 * @fires fluid-change - Fired when the checked state changes. `event.detail.checked`.
 */
export class FluidSwitch extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([hidden]) {
      display: none;
    }

    /*
     * Override ladder: every styled property reads a --fluid-switch-* token
     * that falls back to a main semantic var. See the @cssproperty /
     * @uses-token lists in the JSDoc for the complete set.
     */
    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-switch-gap, var(--fluid-space-2));
      cursor: pointer;
      user-select: none;
      color: var(--fluid-switch-fg, var(--fluid-text-primary));
      font-family: var(--fluid-switch-font-family, var(--fluid-font-family-sans));
      font-size: var(--fluid-switch-font-size, var(--fluid-font-size-md));
      /*
       * SC 2.5.8 Target Size. The visible track is only 20px tall, so the
       * clickable <label> reads --fluid-target-min as a floor, a label-less
       * switch still presents a >=24px (AA) / 44px (AAA) hit target without
       * enlarging the track graphic. The track stays centered.
       */
      min-height: var(--fluid-target-min, 0px);
    }

    .base.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .track {
      position: relative;
      flex-shrink: 0;
      width: 2.25rem;
      height: 1.25rem;
      background-color: var(--fluid-switch-track-bg, var(--fluid-color-neutral-300));
      background-image: var(--fluid-gradient-glossy-inverse);
      border-radius: var(--fluid-switch-radius, var(--fluid-radius-full));
      box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.08);
      transition: background-color calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
        var(--fluid-easing-standard);
    }

    .base.checked .track {
      background-color: var(--fluid-switch-track-bg-on, var(--fluid-accent-base));
      background-image: var(--fluid-gradient-glossy);
    }

    .thumb {
      position: absolute;
      top: 50%;
      left: 0.125rem;
      width: 1rem;
      height: 1rem;
      background-color: var(--fluid-switch-thumb-bg, var(--fluid-color-white));
      background-image: linear-gradient(180deg, rgb(255 255 255 / 0.4) 0%, transparent 50%);
      border-radius: var(--fluid-radius-full);
      box-shadow:
        0 1px 2px rgb(0 0 0 / 0.15),
        0 2px 4px rgb(0 0 0 / 0.1),
        inset 0 1px 0 rgb(255 255 255 / 0.6);
      transform: translate(0, -50%);
      transition: transform calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
        var(--fluid-easing-standard);
    }

    .base.checked .thumb {
      transform: translate(1rem, -50%);
    }

    /* Hidden but focusable native input, keyboard, screen reader, form participation. */
    input {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    .base.focused .track {
      outline: var(--fluid-switch-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-switch-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-switch-focus-ring-offset, var(--fluid-focus-ring-offset));
    }

    @media (prefers-reduced-motion: reduce) {
      .track,
      .thumb {
        transition-duration: 0s;
      }
    }

    ::slotted(*) {
      pointer-events: none;
    }
  `;

  @query("input") private inputEl!: HTMLInputElement;

  /** Whether the switch is on. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Value submitted when checked. */
  @property() override value = "on";

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label when no slot content. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private focused = false;

  override formResetCallback(): void {
    this.checked = this.hasAttribute("checked");
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    this.checked = state === this.value;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  override blur(): void {
    this.inputEl?.blur();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("checked") || changed.has("value")) {
      this.internals.setFormValue(this.checked ? this.value : null);
    }
    if (changed.has("required") || changed.has("checked")) {
      if (this.required && !this.checked) {
        // Anchor not yet available during the first willUpdate; updated() reapplies with it.
        this.setValidity({ valueMissing: true }, "Please toggle this switch.");
      } else {
        this.setValidity({});
      }
    }
  }

  protected override updated(): void {
    if (this.required && !this.checked && this.inputEl) {
      this.setValidity({ valueMissing: true }, "Please toggle this switch.", this.inputEl);
    }
  }

  private handleChange = () => {
    this.checked = this.inputEl.checked;
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
  };

  override render(): TemplateResult {
    return html`
      <label
        part="base"
        class=${classMap({
          base: true,
          checked: this.checked,
          disabled: this.disabled,
          focused: this.focused
        })}
      >
        <input
          type="checkbox"
          role="switch"
          .checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-checked=${this.checked ? "true" : "false"}
          aria-label=${this.ariaLabel ?? ""}
          @change=${this.handleChange}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <span part="track" class="track">
          <span part="thumb" class="thumb"></span>
        </span>
        <span part="label"><slot></slot></span>
      </label>
    `;
  }
}
