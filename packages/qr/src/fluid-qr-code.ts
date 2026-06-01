import { LitElement, html, svg, css, type PropertyValues, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import * as qrcodeModule from "qrcode-generator";

type EcLevel = "L" | "M" | "Q" | "H";

type QrFactory = (typeNumber: number, errorCorrectionLevel: EcLevel) => QRCode;

/**
 * qrcode-generator is a CommonJS module whose `module.exports` is the factory
 * function itself. Different bundlers surface that as either the namespace's
 * `default` or the namespace object being directly callable, so we normalize
 * here without `any` or `@ts-ignore`.
 */
const factory: QrFactory = (() => {
  const ns = qrcodeModule as unknown as Record<string, unknown>;
  // Some bundlers expose a lazy CommonJS wrapper (`__require`) that returns the
  // real module.exports when invoked; unwrap it before checking for the factory.
  const lazy = ns["__require"];
  const unwrapped = typeof lazy === "function" ? (lazy as () => unknown)() : undefined;
  const candidates: unknown[] = [
    unwrapped,
    ns["default"],
    (ns["default"] as Record<string, unknown> | undefined)?.["default"],
    qrcodeModule
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "function") return candidate as QrFactory;
  }
  throw new Error("qrcode-generator did not resolve to a callable factory");
})();
type ModuleShape = "square" | "dots" | "rounded";
type EyeShape = "square" | "rounded" | "circle";

interface QRCode {
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
}

/** A finder pattern's top-left module coordinate (in module units). */
interface EyeOrigin {
  row: number;
  col: number;
  /** Which corner this eye sits in, used for per-eye color overrides. */
  corner: "top-left" | "top-right" | "bottom-left";
}

/**
 * Renders a QR code from a string as a crisp inline SVG, with optional logo
 * overlay, reshaped modules and finder eyes, a gradient fill, and an artistic
 * "image behind the modules" mode. Output scales without aliasing and prints
 * cleanly.
 *
 * Accessibility: the SVG carries `role="img"` and an accessible name. By
 * default the name is derived from `value`; set `label` to describe the
 * destination in human terms (e.g. "Open the Fluid docs"). When a `logo` is
 * embedded the logo is decorative (the QR still encodes the same `value`), so
 * its description stays the host's responsibility via `label`, matching the
 * pre-existing name mechanism.
 *
 * @summary Fancy, logo-embeddable QR code renderer.
 *
 * @csspart base - The wrapping SVG.
 * @csspart svg - Alias of base, the wrapping SVG.
 * @csspart background - The background rect behind the code.
 * @csspart modules - The group holding all non-eye data modules.
 * @csspart module - An individual data module (rect/circle/path).
 * @csspart eyes - The group holding the three finder patterns.
 * @csspart eye - A single finder pattern (outer ring + inner pupil group).
 * @csspart eye-frame - The outer ring of a finder pattern.
 * @csspart eye-pupil - The inner pupil of a finder pattern.
 * @csspart logo - The embedded logo group (knockout plate + image).
 * @csspart logo-image - The embedded logo image element.
 * @csspart image - The full-bleed background image in artistic mode.
 *
 * @cssproperty --fluid-qr-color - Foreground (module) color.
 * @cssproperty --fluid-qr-bg - Background color behind the code.
 * @cssproperty --fluid-qr-eye-color - Finder-eye color (defaults to the module color).
 * @cssproperty --fluid-qr-logo-bg - Knockout plate color behind an embedded logo.
 * @cssproperty --fluid-qr-gap - Gap between modules as a fraction of one module (0 to 0.4).
 *
 * @uses-token --fluid-text-primary - Default module / eye color.
 * @uses-token --fluid-surface-base - Default background and logo-plate color.
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
    }
    /* crispEdges keeps square modules sharp; reshaped modules want smoothing,
       so it is applied conditionally via the [data-smooth] hook below. */
    svg:not([data-smooth]) {
      shape-rendering: crispEdges;
    }
  `;

  /** Data to encode. */
  @property() value = "";

  /** Pixel size of the rendered code. */
  @property({ type: Number }) size = 160;

  /**
   * Error correction level. Note: when `logo` is set (or `artistic` is on) this
   * is forced to `H` internally so the covered modules still scan.
   */
  @property({ attribute: "ec-level" }) ecLevel: EcLevel = "M";

  /** Foreground (module) color. Falls back to the `--fluid-qr-color` token. */
  @property() fill = "";

  /** Background color behind the code. Falls back to the `--fluid-qr-bg` token. */
  @property() background = "";

  /** Module margin (the quiet zone, in modules). */
  @property({ type: Number }) margin = 2;

  /**
   * Human-readable accessible name for the code. When empty, the name is
   * derived from `value`.
   */
  @property() label = "";

  /** Shape of the data modules. */
  @property({ attribute: "module-shape" }) moduleShape: ModuleShape = "square";

  /** Shape of the three finder eyes. */
  @property({ attribute: "eye-shape" }) eyeShape: EyeShape = "square";

  /** Finder-eye color. Falls back to the `--fluid-qr-eye-color` token (then the module color). */
  @property({ attribute: "eye-color" }) eyeColor = "";

  /** Optional per-eye color override for the top-left finder. */
  @property({ attribute: "eye-color-top-left" }) eyeColorTopLeft = "";

  /** Optional per-eye color override for the top-right finder. */
  @property({ attribute: "eye-color-top-right" }) eyeColorTopRight = "";

  /** Optional per-eye color override for the bottom-left finder. */
  @property({ attribute: "eye-color-bottom-left" }) eyeColorBottomLeft = "";

  /** Optional linear gradient start color for module fill. Both ends required to take effect. */
  @property({ attribute: "gradient-from" }) gradientFrom = "";

  /** Optional linear gradient end color for module fill. */
  @property({ attribute: "gradient-to" }) gradientTo = "";

  /** Gradient angle in degrees (0 = left→right, 90 = top→bottom). */
  @property({ type: Number, attribute: "gradient-angle" }) gradientAngle = 45;

  /** Center logo image URL or data URI. Setting this forces `ec-level` to `H`. */
  @property() logo = "";

  /** Logo size as a fraction of the code's module span (clamped to a safe max of 0.3). */
  @property({ type: Number, attribute: "logo-size" }) logoSize = 0.22;

  /** Extra knockout padding around the logo, as a fraction of one module. */
  @property({ type: Number, attribute: "logo-padding" }) logoPadding = 0.5;

  /** Knockout plate color behind the logo. Falls back to the `--fluid-qr-logo-bg` token. */
  @property({ attribute: "logo-background" }) logoBackground = "";

  /** Corner radius (in modules) of the logo knockout plate. */
  @property({ type: Number, attribute: "logo-radius" }) logoRadius = 1;

  /**
   * Artistic mode: render `logo` as a full-bleed background image and draw the
   * data modules as semi-opaque dots on top, like a halftone overlay. Forces
   * `ec-level` to `H` and keeps the finder eyes solid for scannability.
   * Scannability caveat: artistic codes are decorative-first; always test scan
   * reliability with a real phone before shipping one in production.
   */
  @property({ type: Boolean }) artistic = false;

  /** Opacity of the modules in artistic mode (0 to 1). */
  @property({ type: Number, attribute: "artistic-opacity" }) artisticOpacity = 0.85;

  /** The effective error-correction level after logo/artistic overrides. */
  private get effectiveEcLevel(): EcLevel {
    return this.logo || this.artistic ? "H" : this.ecLevel;
  }

  private get smoothing(): boolean {
    return this.moduleShape !== "square" || this.eyeShape !== "square" || this.artistic;
  }

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
      const qr = factory(0, this.effectiveEcLevel);
      qr.addData(this.value);
      qr.make();
      return qr;
    } catch {
      return null;
    }
  }

  /** The three finder-pattern origins for a code of `count` modules. */
  private eyeOrigins(count: number): EyeOrigin[] {
    return [
      { row: 0, col: 0, corner: "top-left" },
      { row: 0, col: count - 7, corner: "top-right" },
      { row: count - 7, col: 0, corner: "bottom-left" }
    ];
  }

  /** True when (r, c) lies inside any of the three 7×7 finder patterns. */
  private isInEye(r: number, c: number, count: number): boolean {
    for (const eye of this.eyeOrigins(count)) {
      if (r >= eye.row && r < eye.row + 7 && c >= eye.col && c < eye.col + 7) return true;
    }
    return false;
  }

  private moduleColor(): string {
    return this.fill || "var(--fluid-qr-color, var(--fluid-text-primary, currentColor))";
  }

  private resolvedEyeColor(corner: EyeOrigin["corner"]): string {
    const perEye =
      corner === "top-left"
        ? this.eyeColorTopLeft
        : corner === "top-right"
          ? this.eyeColorTopRight
          : this.eyeColorBottomLeft;
    if (perEye) return perEye;
    if (this.eyeColor) return this.eyeColor;
    return `var(--fluid-qr-eye-color, ${this.moduleColor()})`;
  }

  /** Paint for the data modules: gradient ref when both ends are set, else flat color. */
  private modulePaint(): string {
    if (this.gradientFrom && this.gradientTo) return "url(#fluid-qr-grad)";
    return this.moduleColor();
  }

  /** Resolve the inter-module gap (fraction of one module) from the token, clamped to [0, 0.4]. */
  private resolveGap(): number {
    const raw = getComputedStyle(this).getPropertyValue("--fluid-qr-gap").trim();
    const n = raw ? Number.parseFloat(raw) : NaN;
    if (Number.isFinite(n)) return Math.min(Math.max(n, 0), 0.4);
    return this.moduleShape === "dots" ? 0.1 : 0;
  }

  /** Render one data module at module coords (x, y) with the active shape. */
  private renderModule(x: number, y: number, paint: string, opacity: number, gap: number): TemplateResult {
    const inset = gap / 2;
    const w = 1 - gap;
    if (this.moduleShape === "dots" || this.artistic) {
      const r = w / 2;
      return svg`<circle
        part="module"
        cx=${x + 0.5}
        cy=${y + 0.5}
        r=${r}
        fill=${paint}
        fill-opacity=${opacity}
      />`;
    }
    if (this.moduleShape === "rounded") {
      const rad = w * 0.3;
      return svg`<rect
        part="module"
        x=${x + inset}
        y=${y + inset}
        width=${w}
        height=${w}
        rx=${rad}
        ry=${rad}
        fill=${paint}
        fill-opacity=${opacity}
      />`;
    }
    return svg`<rect
      part="module"
      x=${x + inset}
      y=${y + inset}
      width=${w}
      height=${w}
      fill=${paint}
      fill-opacity=${opacity}
    />`;
  }

  /** Render one finder eye (outer frame ring + inner pupil) at its origin. */
  private renderEye(eye: EyeOrigin): TemplateResult {
    const color = this.resolvedEyeColor(eye.corner);
    const x = eye.col + this.margin;
    const y = eye.row + this.margin;
    if (this.eyeShape === "circle") {
      const cx = x + 3.5;
      const cy = y + 3.5;
      return svg`<g part="eye">
        <circle part="eye-frame" cx=${cx} cy=${cy} r="3.5" fill="none" stroke=${color} stroke-width="1" />
        <circle part="eye-pupil" cx=${cx} cy=${cy} r="1.5" fill=${color} />
      </g>`;
    }
    if (this.eyeShape === "rounded") {
      const r = 2;
      return svg`<g part="eye">
        <rect
          part="eye-frame"
          x=${x + 0.5}
          y=${y + 0.5}
          width="6"
          height="6"
          rx=${r}
          ry=${r}
          fill="none"
          stroke=${color}
          stroke-width="1"
        />
        <rect
          part="eye-pupil"
          x=${x + 2}
          y=${y + 2}
          width="3"
          height="3"
          rx="0.8"
          ry="0.8"
          fill=${color}
        />
      </g>`;
    }
    // square: outer 7×7 ring (drawn as a thick-stroked rect) + 3×3 pupil.
    return svg`<g part="eye">
      <rect
        part="eye-frame"
        x=${x + 0.5}
        y=${y + 0.5}
        width="6"
        height="6"
        fill="none"
        stroke=${color}
        stroke-width="1"
      />
      <rect part="eye-pupil" x=${x + 2} y=${y + 2} width="3" height="3" fill=${color} />
    </g>`;
  }

  private renderGradientDef(): TemplateResult | null {
    if (!(this.gradientFrom && this.gradientTo)) return null;
    const rad = (this.gradientAngle * Math.PI) / 180;
    const x1 = 0.5 - Math.cos(rad) / 2;
    const y1 = 0.5 - Math.sin(rad) / 2;
    const x2 = 0.5 + Math.cos(rad) / 2;
    const y2 = 0.5 + Math.sin(rad) / 2;
    return svg`<linearGradient id="fluid-qr-grad" x1=${x1} y1=${y1} x2=${x2} y2=${y2}>
      <stop offset="0" stop-color=${this.gradientFrom} />
      <stop offset="1" stop-color=${this.gradientTo} />
    </linearGradient>`;
  }

  /** Render the center logo (knockout plate + image). */
  private renderLogo(count: number, total: number): TemplateResult | null {
    if (!this.logo) return null;
    const frac = Math.min(Math.max(this.logoSize, 0.05), 0.3);
    const logoSpan = count * frac;
    const pad = this.logoPadding;
    const plate = logoSpan + pad * 2;
    const center = total / 2;
    const plateX = center - plate / 2;
    const plateY = center - plate / 2;
    const imgX = center - logoSpan / 2;
    const imgY = center - logoSpan / 2;
    const plateColor =
      this.logoBackground || "var(--fluid-qr-logo-bg, var(--fluid-surface-base, #ffffff))";
    const radius = this.logoRadius;
    return svg`<g part="logo">
      <rect
        x=${plateX}
        y=${plateY}
        width=${plate}
        height=${plate}
        rx=${radius}
        ry=${radius}
        fill=${plateColor}
      />
      <image
        part="logo-image"
        href=${this.logo}
        x=${imgX}
        y=${imgY}
        width=${logoSpan}
        height=${logoSpan}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>`;
  }

  /** Module coords covered by the logo knockout, so we skip drawing them. */
  private logoKnockout(count: number): { x0: number; y0: number; x1: number; y1: number } | null {
    if (!this.logo) return null;
    const frac = Math.min(Math.max(this.logoSize, 0.05), 0.3);
    const logoSpan = count * frac;
    const pad = this.logoPadding;
    const plate = logoSpan + pad * 2;
    const center = count / 2;
    return {
      x0: center - plate / 2,
      y0: center - plate / 2,
      x1: center + plate / 2,
      y1: center + plate / 2
    };
  }

  override render(): TemplateResult {
    const qr = this.build();
    const bg = this.background || "var(--fluid-qr-bg, var(--fluid-surface-base, transparent))";
    const name = this.label || (this.value ? `QR code for ${this.value}` : "Empty QR code");
    if (!qr) {
      return html`<svg
        part="base svg"
        viewBox="0 0 1 1"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Empty QR code"
      ></svg>`;
    }
    const count = qr.getModuleCount();
    const total = count + this.margin * 2;
    const paint = this.modulePaint();
    const knockout = this.logoKnockout(count);
    const moduleEls: TemplateResult[] = [];
    const opacity = this.artistic ? this.artisticOpacity : 1;
    const gap = this.artistic ? 0.18 : this.resolveGap();

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Guard indexed access: isDark may throw outside range; we stay in range
        // by construction, but keep the call defensive.
        if (!qr.isDark(r, c)) continue;
        if (this.isInEye(r, c, count)) continue; // eyes drawn separately
        if (knockout) {
          if (r >= knockout.y0 && r <= knockout.y1 && c >= knockout.x0 && c <= knockout.x1) {
            continue;
          }
        }
        moduleEls.push(this.renderModule(c + this.margin, r + this.margin, paint, opacity, gap));
      }
    }

    const eyes = this.eyeOrigins(count).map((eye) => this.renderEye(eye));
    const gradientDef = this.renderGradientDef();
    const logoEl = this.renderLogo(count, total);

    const bgImage = this.artistic && this.logo
      ? svg`<image
          part="image"
          href=${this.logo}
          x="0"
          y="0"
          width=${total}
          height=${total}
          preserveAspectRatio="xMidYMid slice"
        />`
      : null;

    return html`<svg
      part="base svg"
      ?data-smooth=${this.smoothing}
      viewBox="0 0 ${total} ${total}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label=${name}
    >
      ${gradientDef ? svg`<defs>${gradientDef}</defs>` : null}
      <rect part="background" width=${total} height=${total} fill=${bg} />
      ${bgImage}
      <g part="modules">${moduleEls}</g>
      <g part="eyes">${eyes}</g>
      ${logoEl}
    </svg>`;
  }

  /** Serialize the current shadow-DOM SVG to a standalone markup string. */
  private serializeSvg(): string | null {
    const svgEl = this.shadowRoot?.querySelector("svg");
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(this.size));
    clone.setAttribute("height", String(this.size));
    return new XMLSerializer().serializeToString(clone);
  }

  /**
   * Rasterize the rendered SVG to a PNG data URL. Resolves to an empty-string
   * fallback only if there is nothing to render. Note: when the SVG embeds a
   * cross-origin `logo`/image without CORS headers, the canvas becomes tainted
   * and export will reject; serve such images same-origin or with CORS.
   */
  async toDataURL(scale = 2): Promise<string> {
    const markup = this.serializeSvg();
    if (!markup) return "";
    const px = Math.max(1, Math.round(this.size * scale));
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG for rasterization"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.drawImage(img, 0, 0, px, px);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Rasterize and trigger a browser download of the PNG. */
  async download(filename = "qr-code.png"): Promise<void> {
    const dataUrl = await this.toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
