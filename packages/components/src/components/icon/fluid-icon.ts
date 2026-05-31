import { html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { getIcon, onIconRegistered } from "@fluid-ds/icons";
import { FluidElement } from "../../internal/base-element.js";

/**
 * An icon.
 *
 * Looks up the icon by name in the @fluid-ds/icons registry. Consumers must
 * register icons before they render (typically via
 * `import "@fluid-ds/icons/register-defaults"` at app bootstrap).
 *
 * Decorative icons (`label` not set) get `aria-hidden="true"`. Provide a
 * `label` when the icon carries meaning on its own.
 *
 * @summary Renders an SVG from the icon registry.
 *
 * @cssproperty --fluid-icon-size - Width and height of the rendered icon. Defaults to 1em.
 * @cssproperty --fluid-icon-color - Stroke/fill color. Defaults to currentColor.
 *
 * @csspart svg - The inner SVG element.
 */
export class FluidIcon extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      width: var(--fluid-icon-size, 1em);
      height: var(--fluid-icon-size, 1em);
      color: var(--fluid-icon-color, currentColor);
      flex-shrink: 0;
    }

    :host([hidden]) {
      display: none;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `;

  /** Icon name. Must be registered in the icon registry. */
  @property() name?: string;

  /**
   * Accessible label for assistive tech. When set, the icon is announced and
   * gets role="img". When omitted, the icon is treated as decorative.
   */
  @property() label?: string;

  @state() private svg: string | undefined;

  private unsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = onIconRegistered((name) => {
      if (name === this.name) this.lookup();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("name")) this.lookup();
  }

  protected override updated(): void {
    if (this.label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", this.label);
      this.removeAttribute("aria-hidden");
    } else {
      this.setAttribute("aria-hidden", "true");
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }
  }

  private lookup(): void {
    if (!this.name) {
      this.svg = undefined;
      return;
    }
    this.svg = getIcon(this.name);
    if (!this.svg && this.name) {
      // Quietly do nothing, the icon may register later and we'll re-render.
      // This is intentional: decoupled registration is the whole point.
    }
  }

  override render(): TemplateResult | typeof nothing {
    return this.svg ? html`${unsafeHTML(this.svg)}` : nothing;
  }
}
