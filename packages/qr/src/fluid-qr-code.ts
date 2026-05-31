import { LitElement, html, svg, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import qrcode from "qrcode-generator";

type EcLevel = "L" | "M" | "Q" | "H";

interface QRCode {
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
}

/**
 * Renders a QR code from a string. Output is a crisp inline SVG so it
 * scales without aliasing and prints cleanly.
 *
 * @summary QR code renderer.
 *
 * @csspart base - The wrapping SVG.
 *
 * @cssproperty --fluid-qr-color - Foreground (module) color.
 * @cssproperty --fluid-qr-bg - Background color.
 */
export class FluidQrCode extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }
    svg {
      display: block;
      width: var(--_size);
      height: var(--_size);
      shape-rendering: crispEdges;
    }
  `;

  /** Data to encode. */
  @property() value = "";

  /** Pixel size of the rendered code. */
  @property({ type: Number }) size = 160;

  /** Error correction level. */
  @property({ attribute: "ec-level" }) ecLevel: EcLevel = "M";

  /** Foreground color. */
  @property() fill = "currentColor";

  /** Background color. */
  @property() background = "transparent";

  /** Module margin (in modules). */
  @property({ type: Number }) margin = 2;

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("size")) this.style.setProperty("--_size", `${this.size}px`);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.setProperty("--_size", `${this.size}px`);
  }

  private build(): QRCode | null {
    if (!this.value) return null;
    try {
      const qr = qrcode(0, this.ecLevel) as QRCode;
      qr.addData(this.value);
      qr.make();
      return qr;
    } catch {
      return null;
    }
  }

  override render(): TemplateResult {
    const qr = this.build();
    if (!qr) {
      return html`<svg
        part="base"
        viewBox="0 0 1 1"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Empty QR code"
      ></svg>`;
    }
    const count = qr.getModuleCount();
    const total = count + this.margin * 2;
    const rects: TemplateResult[] = [];
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          rects.push(
            svg`<rect x=${c + this.margin} y=${r + this.margin} width="1" height="1" fill=${
              this.fill
            } />`
          );
        }
      }
    }
    return html`<svg
      part="base"
      viewBox="0 0 ${total} ${total}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label=${`QR code for ${this.value}`}
    >
      <rect width=${total} height=${total} fill=${this.background} />
      ${rects}
    </svg>`;
  }
}
