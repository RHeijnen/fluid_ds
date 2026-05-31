import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import "../input/define.js";
import { FluidFormAssociated } from "../../internal/form-associated.js";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * A composite color input.
 *
 * Built by composing `<fluid-input>` with a color swatch in its `prefix` slot
 *, that way the swatch and the hex field render inside a single shared
 * frame, looking like one element instead of two floating siblings. A hidden
 * `<input type="color">` is invoked when the user clicks the swatch.
 *
 * @summary Pick a color via picker, hex text, or preset.
 *
 * @csspart base - The outer container.
 * @csspart swatch - The current-color preview button (rendered in input's prefix slot).
 * @csspart input - The underlying <fluid-input>.
 * @csspart palette - The preset palette container.
 *
 * Every styled property reads a component-scoped `--fluid-color-picker-*` token
 * that falls back to a main semantic var (the override ladder). The hex field
 * is a composed `<fluid-input>`, so its own `--fluid-input-*` tokens apply too.
 *
 * @cssproperty --fluid-color-picker-swatch-size - Swatch width. Falls back to 2.5rem.
 * @cssproperty --fluid-color-picker-preset-size - Preset chip size (floored by --fluid-target-min). Falls back to 1.25rem.
 * @cssproperty --fluid-color-picker-radius - Swatch + preset corner radius. Falls back to --fluid-radius-sm.
 * @cssproperty --fluid-color-picker-font-family - Hex field font family. Falls back to --fluid-font-family-mono.
 * @cssproperty --fluid-color-picker-focus-ring - Focus ring color for the swatch and presets. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-color-picker-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 *
 * @uses-token --fluid-focus-ring-color - Swatch + preset focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum preset hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-radius-sm - Swatch + preset corner radius.
 * @uses-token --fluid-font-family-mono - Hex field font family.
 *
 * @fires fluid-input - Fired on every value change. `event.detail.value` is the new hex.
 * @fires fluid-change - Fired when the value is committed (blur / native picker close).
 */
export class FluidColorPicker extends FluidFormAssociated {
  static override styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      gap: var(--fluid-space-2);
      width: 100%;
    }

    /*
     * The swatch is the *prefix* of the underlying fluid-input. It stretches
     * the full field height and a fixed width, so it reads as a single
     * unified field with a color block on the left, not a floating chip.
     * We use data-flush on the slot to suppress fluid-input's prefix padding.
     */
    .swatch {
      all: unset;
      display: block;
      width: var(--fluid-color-picker-swatch-size, 2.5rem);
      height: 100%;
      align-self: stretch;
      background: var(--current);
      background-image:
        /* Subtle checkerboard fallback for transparent / invalid colors */
        linear-gradient(45deg, rgb(0 0 0 / 0.06) 25%, transparent 25%),
        linear-gradient(-45deg, rgb(0 0 0 / 0.06) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgb(0 0 0 / 0.06) 75%),
        linear-gradient(-45deg, transparent 75%, rgb(0 0 0 / 0.06) 75%);
      background-size: 12px 12px;
      background-position:
        0 0,
        0 6px,
        6px -6px,
        -6px 0;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transition: filter var(--fluid-duration-fast) var(--fluid-easing-standard);
    }

    /* Re-layer: the solid color goes on a pseudo-element above the checkerboard,
       so transparent/missing values reveal the checkerboard underneath. */
    .swatch::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--current);
    }

    .swatch:hover::before {
      filter: brightness(0.95);
    }

    .swatch:focus-visible {
      outline: var(--fluid-color-picker-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-color-picker-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: -4px;
      border-radius: var(--fluid-color-picker-radius, var(--fluid-radius-sm));
    }

    .native {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    fluid-input {
      font-family: var(--fluid-color-picker-font-family, var(--fluid-font-family-mono));
    }

    fluid-input::part(input) {
      font-family: var(--fluid-color-picker-font-family, var(--fluid-font-family-mono));
      font-variant-numeric: tabular-nums;
    }

    .palette {
      display: flex;
      flex-wrap: wrap;
      gap: var(--fluid-space-1);
    }

    /*
     * SC 2.5.8 Target Size. Preset chips floor their box to --fluid-target-min,
     * so AA lifts them to 24px and AAA to 44px without any per-size override.
     */
    .preset {
      all: unset;
      box-sizing: border-box;
      width: max(var(--fluid-color-picker-preset-size, 1.25rem), var(--fluid-target-min, 0px));
      height: max(var(--fluid-color-picker-preset-size, 1.25rem), var(--fluid-target-min, 0px));
      border-radius: var(--fluid-color-picker-radius, var(--fluid-radius-sm));
      cursor: pointer;
      box-shadow: inset 0 0 0 var(--fluid-field-border-width, 1px) rgb(0 0 0 / 0.12);
    }

    .preset:hover {
      transform: scale(1.1);
    }
    .preset:focus-visible {
      outline: var(--fluid-color-picker-focus-ring-width, var(--fluid-focus-ring-width)) solid
        var(--fluid-color-picker-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: 2px;
    }
  `;

  @query("input.native") private nativeEl!: HTMLInputElement;
  @query("fluid-input") private inputEl!: HTMLElement & { value: string };

  /** Current value (hex, e.g. "#ff00aa"). */
  @property() override value = "#000000";

  /** Form control name. */
  @property({ reflect: true }) override name = "";

  /** Optional preset swatches (array of hex strings). */
  @property({ type: Array }) palette: string[] = [];

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Accessible label. */
  @property({ attribute: "aria-label" }) override ariaLabel: string | null = null;

  @state() private invalid = false;

  override formResetCallback(): void {
    this.value = this.getAttribute("value") ?? "#000000";
    this.invalid = false;
  }

  override formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("value") || changed.has("required")) {
      this.syncFormValue();
      this.refreshValidity();
    }
  }

  private refreshValidity(): void {
    const valid = !this.value || HEX_RE.test(this.value);
    if (!valid) {
      this.setValidity({ patternMismatch: true }, "Enter a valid hex color (e.g. #ff00aa).");
      this.invalid = true;
    } else if (this.required && !this.value) {
      this.setValidity({ valueMissing: true }, "Please choose a color.");
      this.invalid = false;
    } else {
      this.setValidity({});
      this.invalid = false;
    }
  }

  private openNative = () => {
    if (this.disabled) return;
    this.nativeEl?.click();
  };

  private handleNativeInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.emit("fluid-input");
  };

  private handleNativeChange = () => this.emit("fluid-change");

  private handleHexInput = (e: CustomEvent) => {
    const raw = String(e.detail.value).trim();
    const next = raw.startsWith("#") || !raw ? raw : `#${raw}`;
    this.value = next;
    if (HEX_RE.test(this.value)) this.emit("fluid-input");
  };

  private handleHexBlur = () => this.emit("fluid-change");

  private handlePresetClick = (hex: string) => {
    this.value = hex;
    this.emit("fluid-input");
    this.emit("fluid-change");
  };

  private emit(name: string): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  override render(): TemplateResult {
    const validForNative = HEX_RE.test(this.value);
    const ariaLabel = this.ariaLabel ?? "Color";
    return html`
      <div
        part="base"
        style="--current: ${validForNative ? this.value : "transparent"}; position: relative;"
      >
        <fluid-input
          part="input"
          .value=${this.value}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${`${ariaLabel} hex`}
          spellcheck="false"
          autocomplete="off"
          @fluid-input=${this.handleHexInput}
          @blur=${this.handleHexBlur}
        >
          <button
            type="button"
            part="swatch"
            class="swatch"
            slot="prefix"
            data-flush
            aria-label=${`${ariaLabel}, open picker`}
            ?disabled=${this.disabled}
            @click=${this.openNative}
          ></button>
        </fluid-input>
        <input
          class="native"
          type="color"
          tabindex="-1"
          aria-hidden="true"
          .value=${validForNative ? this.value : "#000000"}
          @input=${this.handleNativeInput}
          @change=${this.handleNativeChange}
        />
        ${this.palette.length
          ? html`
              <div part="palette" class="palette" role="listbox" aria-label="Color presets">
                ${this.palette.map(
                  (hex) => html`
                    <button
                      type="button"
                      role="option"
                      aria-selected=${this.value.toLowerCase() === hex.toLowerCase()}
                      class="preset"
                      style="background: ${hex};"
                      title=${hex}
                      @click=${() => this.handlePresetClick(hex)}
                    ></button>
                  `
                )}
              </div>
            `
          : ""}
      </div>
    `;
  }
}
