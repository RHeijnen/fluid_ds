import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/define.js";
import { registerIcon } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";
import { reducedMotion } from "../../internal/motion.js";

registerIcon(
  "sun",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
);
registerIcon(
  "moon",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
);
registerIcon(
  "palette",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z"/></svg>`
);

export type FluidThemeToggleTheme = "light" | "dark";

const STORAGE_KEY = "fluid-theme";
const BRAND_STORAGE_KEY = "fluid-brand";

/**
 * Toggles the document color scheme and persists the choice.
 *
 * Renders an icon-only toggle button (a sun in light mode, a moon in dark
 * mode). `aria-pressed` reflects whether dark mode is active and the button
 * carries an `aria-label` of "Toggle dark mode". Clicking it flips
 * `data-fluid-theme` between "light" and "dark" on `document.documentElement`
 * and writes the choice to `localStorage`. On connect it restores the saved
 * value, falling back to the OS `prefers-color-scheme` when nothing is stored.
 *
 * An optional `brands` array renders a second button that cycles
 * `data-fluid-brand` on the document root (and persists it), letting the user
 * sample preset palettes.
 *
 * @summary Persisted light/dark (and optional brand) switcher.
 *
 * @csspart base - The control row that wraps the buttons.
 * @csspart theme-button - The light/dark toggle button.
 * @csspart brand-button - The brand cycle button (only when `brands` is set).
 * @csspart icon - The glyph inside a button.
 *
 * Every styled property reads a component-scoped `--fluid-theme-toggle-*` token
 * that falls back to a main semantic var (the override ladder). The
 * `@cssproperty` list is the complete set of override knobs; `@uses-token` is
 * every main var they fall back to.
 *
 * @cssproperty --fluid-theme-toggle-fg - Glyph/text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-theme-toggle-bg - Resting background. Falls back to transparent.
 * @cssproperty --fluid-theme-toggle-hover-bg - Hover background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-theme-toggle-border - Border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-theme-toggle-radius - Corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-theme-toggle-size - Square button size. Falls back to 2.25rem.
 * @cssproperty --fluid-theme-toggle-gap - Gap between the theme and brand buttons. Falls back to --fluid-space-1.
 * @cssproperty --fluid-theme-toggle-focus-ring - Focus ring color. Falls back to --fluid-focus-ring-color.
 * @cssproperty --fluid-theme-toggle-focus-ring-width - Focus ring width. Falls back to --fluid-focus-ring-width.
 * @cssproperty --fluid-theme-toggle-focus-ring-offset - Focus ring offset. Falls back to --fluid-focus-ring-offset.
 *
 * @uses-token --fluid-text-primary - Glyph/text color.
 * @uses-token --fluid-surface-muted - Hover background.
 * @uses-token --fluid-border-default - Button border.
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-target-min - Minimum hit-target size (24px AA / 44px AAA).
 * @uses-token --fluid-focus-ring-color - Keyboard focus indicator color.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset.
 * @uses-token --fluid-space-1 - Gap between buttons.
 * @uses-token --fluid-duration-fast - Hover/press transition duration (scaled by --fluid-motion).
 * @uses-token --fluid-motion - Global motion scalar; multiplies the transition duration (0 = off).
 * @uses-token --fluid-easing-standard - Hover/press transition easing.
 *
 * @fires fluid-theme-change - Fired after the color scheme flips.
 *   `event.detail.theme` is the new "light" | "dark" value.
 */
export class FluidThemeToggle extends FluidElement {
  static override styles = [
    reducedMotion,
    css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--fluid-theme-toggle-gap, var(--fluid-space-1));
    }

    .button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--fluid-theme-toggle-size, 2.25rem);
      height: var(--fluid-theme-toggle-size, 2.25rem);
      min-width: max(var(--fluid-theme-toggle-size, 2.25rem), var(--fluid-target-min, 0px));
      min-height: max(var(--fluid-theme-toggle-size, 2.25rem), var(--fluid-target-min, 0px));
      border-radius: var(--fluid-theme-toggle-radius, var(--fluid-radius-md));
      border: 1px solid var(--fluid-theme-toggle-border, var(--fluid-border-default));
      background: var(--fluid-theme-toggle-bg, transparent);
      color: var(--fluid-theme-toggle-fg, var(--fluid-text-primary));
      cursor: pointer;
      transition:
        background-color calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
          var(--fluid-easing-standard),
        color calc(var(--fluid-duration-fast) * var(--fluid-motion, 1))
          var(--fluid-easing-standard);
    }

    .button:hover {
      background: var(--fluid-theme-toggle-hover-bg, var(--fluid-surface-muted));
    }

    .button:focus-visible {
      outline: var(--fluid-theme-toggle-focus-ring-width, var(--fluid-focus-ring-width, 2px))
        solid var(--fluid-theme-toggle-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: var(--fluid-theme-toggle-focus-ring-offset, var(--fluid-focus-ring-offset));
    }

    fluid-icon {
      width: 1.125rem;
      height: 1.125rem;
    }
  `
  ];

  /**
   * Optional palette presets to cycle through. When non-empty a second button
   * is rendered that steps `data-fluid-brand` on the document root through this
   * list (plus the unset/default state at index 0 if you include it). Accepts
   * an array property or a JSON-string attribute.
   */
  @property({ type: Array }) brands: string[] = [];

  /** Current color scheme. Reflects to `theme` for styling hooks. */
  @property({ reflect: true }) theme: FluidThemeToggleTheme = "light";

  @state() private brandIndex = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.restore();
  }

  /** Resolve the stored or system-preferred theme and apply it without firing an event. */
  private restore(): void {
    const root = this.documentRoot();
    let next: FluidThemeToggleTheme;
    const stored = this.readStorage(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      next = stored;
    } else {
      const prefersDark =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      next = prefersDark ? "dark" : "light";
    }
    this.theme = next;
    if (root) root.setAttribute("data-fluid-theme", next);

    if (this.brands.length > 0 && root) {
      const storedBrand = this.readStorage(BRAND_STORAGE_KEY);
      const idx = storedBrand ? this.brands.indexOf(storedBrand) : -1;
      if (idx >= 0) {
        this.brandIndex = idx;
        this.applyBrand(root, this.brands[idx]);
      }
    }
  }

  private documentRoot(): HTMLElement | null {
    return typeof document !== "undefined" ? document.documentElement : null;
  }

  private readStorage(key: string): string | null {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable (private mode, blocked); ignore. */
    }
  }

  private applyBrand(root: HTMLElement, brand: string | undefined): void {
    if (!brand) {
      root.removeAttribute("data-fluid-brand");
    } else {
      root.setAttribute("data-fluid-brand", brand);
    }
  }

  private toggleTheme = (): void => {
    const next: FluidThemeToggleTheme = this.theme === "dark" ? "light" : "dark";
    this.theme = next;
    const root = this.documentRoot();
    if (root) root.setAttribute("data-fluid-theme", next);
    this.writeStorage(STORAGE_KEY, next);
    this.dispatchEvent(
      new CustomEvent("fluid-theme-change", {
        detail: { theme: next },
        bubbles: true,
        composed: true
      })
    );
  };

  private cycleBrand = (): void => {
    if (this.brands.length === 0) return;
    this.brandIndex = (this.brandIndex + 1) % this.brands.length;
    const root = this.documentRoot();
    const brand = this.brands[this.brandIndex];
    if (root) this.applyBrand(root, brand);
    if (brand) this.writeStorage(BRAND_STORAGE_KEY, brand);
  };

  override render(): TemplateResult {
    const isDark = this.theme === "dark";
    const currentBrand = this.brands[this.brandIndex];
    return html`
      <div part="base" class="base">
        <button
          part="theme-button"
          class="button"
          type="button"
          aria-label="Toggle dark mode"
          aria-pressed=${isDark ? "true" : "false"}
          @click=${this.toggleTheme}
        >
          <fluid-icon
            part="icon"
            name=${isDark ? "moon" : "sun"}
          ></fluid-icon>
        </button>
        ${this.brands.length > 0
          ? html`
              <button
                part="brand-button"
                class="button"
                type="button"
                aria-label=${currentBrand
                  ? `Cycle brand, current ${currentBrand}`
                  : "Cycle brand"}
                @click=${this.cycleBrand}
              >
                <fluid-icon part="icon" name="palette"></fluid-icon>
              </button>
            `
          : ""}
      </div>
    `;
  }
}
