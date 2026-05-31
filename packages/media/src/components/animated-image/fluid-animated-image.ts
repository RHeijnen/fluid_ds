import { LitElement, html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";

/**
 * Plays/pauses animated images (GIF, APNG, WebP). When paused, draws the
 * current frame to a canvas so the image looks frozen even though the
 * source keeps animating in the background.
 *
 * @summary Animated image with play/pause.
 *
 * @csspart base - The wrapper.
 * @csspart image - The underlying <img>.
 * @csspart canvas - The pause-frame canvas.
 * @csspart control - The play/pause overlay button.
 *
 * @fires fluid-load - Fired when the image finishes loading.
 * @fires fluid-error - Fired when the image fails to load.
 */
export class FluidAnimatedImage extends LitElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-block;
      line-height: 0;
    }
    img,
    canvas {
      display: block;
      max-width: 100%;
      height: auto;
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: none;
    }
    :host([paused]) canvas {
      display: block;
    }
    .control {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: rgb(0 0 0 / 0.5);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    :host(:hover) .control,
    .control:focus-visible {
      opacity: 1;
    }
    .control:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  `;

  /** Image source URL. */
  @property() src = "";

  /** Accessible alt text. */
  @property() alt = "";

  /** Paused state. */
  @property({ type: Boolean, reflect: true }) paused = false;

  /** Hide the play/pause control overlay. */
  @property({ type: Boolean, attribute: "no-control" }) noControl = false;

  @query("img") private imgEl!: HTMLImageElement;
  @query("canvas") private canvasEl!: HTMLCanvasElement;

  @state() private loaded = false;

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("paused") && this.loaded) {
      if (this.paused) this.snapshot();
    }
  }

  private onLoad = () => {
    this.loaded = true;
    if (this.imgEl) {
      this.canvasEl.width = this.imgEl.naturalWidth;
      this.canvasEl.height = this.imgEl.naturalHeight;
    }
    if (this.paused) this.snapshot();
    this.dispatchEvent(new CustomEvent("fluid-load", { bubbles: true, composed: true }));
  };

  private onError = () => {
    this.dispatchEvent(new CustomEvent("fluid-error", { bubbles: true, composed: true }));
  };

  private snapshot(): void {
    const ctx = this.canvasEl.getContext("2d");
    if (!ctx) return;
    try {
      ctx.drawImage(this.imgEl, 0, 0, this.canvasEl.width, this.canvasEl.height);
    } catch {
      // Cross-origin images without CORS will taint the canvas, silently keep playing.
    }
  }

  /** Toggle paused state. */
  toggle(): void {
    this.paused = !this.paused;
  }

  override render(): TemplateResult {
    return html`
      <img
        part="image"
        src=${this.src}
        alt=${this.alt}
        @load=${this.onLoad}
        @error=${this.onError}
        crossorigin="anonymous"
      />
      <canvas part="canvas"></canvas>
      ${this.noControl
        ? ""
        : html`
            <button
              part="control"
              class="control"
              type="button"
              aria-label=${this.paused ? "Play animation" : "Pause animation"}
              @click=${() => this.toggle()}
            >
              ${this.paused
                ? html`<svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>`
                : html`<svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                  >
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>`}
            </button>
          `}
    `;
  }
}
