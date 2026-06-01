import { LitElement, html, css, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";

/**
 * An image gallery with a full-screen lightbox. Slot in `<img>` thumbnails;
 * clicking (or pressing Enter / Space on) one opens it large in a modal
 * `<dialog>` (native top layer, focus trap, Escape to close, backdrop) with
 * previous / next navigation and a position counter.
 *
 * Each thumbnail becomes a focusable button; its `alt` is reused as the
 * accessible name and the enlarged image's alt text. Set `data-full` on a
 * thumbnail to load a higher-resolution source in the lightbox.
 *
 * @summary Thumbnail gallery with a modal lightbox.
 *
 * @slot - One or more `<img>` thumbnails.
 *
 * @csspart base - The thumbnail grid.
 * @csspart dialog - The modal dialog.
 * @csspart image - The enlarged image.
 * @csspart prev - The previous button.
 * @csspart next - The next button.
 * @csspart close - The close button.
 * @csspart counter - The "n of m" position label.
 *
 * @cssproperty --fluid-lightbox-gap - Gap between thumbnails. Falls back to 0.5rem.
 * @cssproperty --fluid-lightbox-thumb-size - Thumbnail track size. Falls back to 7rem.
 * @cssproperty --fluid-lightbox-thumb-radius - Thumbnail corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-lightbox-backdrop - Backdrop color. Falls back to a 80% black scrim.
 * @cssproperty --fluid-lightbox-control-bg - Control button background. Falls back to a translucent surface.
 * @cssproperty --fluid-lightbox-control-fg - Control button color. Falls back to white.
 *
 * @uses-token --fluid-radius-md - Thumbnail radius.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum control target (24px AA / 44px AAA).
 *
 * @fires fluid-open - The lightbox opened. `detail: { index }`.
 * @fires fluid-change - The shown image changed. `detail: { index }`.
 * @fires fluid-close - The lightbox closed.
 */
export class FluidLightbox extends LitElement {
  static override styles = css`
    :host { display: block; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--fluid-lightbox-thumb-size, 7rem), 1fr));
      gap: var(--fluid-lightbox-gap, 0.5rem);
    }
    ::slotted(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      aspect-ratio: 1;
      border-radius: var(--fluid-lightbox-thumb-radius, var(--fluid-radius-md, 0.5rem));
      cursor: pointer;
    }
    ::slotted(img:focus-visible) {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base);
      outline-offset: 2px;
    }
    dialog {
      padding: 0;
      border: 0;
      background: transparent;
      max-width: 100vw;
      max-height: 100vh;
      overflow: visible;
    }
    dialog::backdrop {
      background: var(--fluid-lightbox-backdrop, rgba(0, 0, 0, 0.8));
    }
    .stage {
      position: relative;
      display: grid;
      place-items: center;
      padding: 2.5rem;
    }
    .stage img {
      max-width: 90vw;
      max-height: 85vh;
      object-fit: contain;
      border-radius: var(--fluid-radius-md, 0.5rem);
    }
    .control {
      position: absolute;
      display: inline-grid;
      place-items: center;
      min-width: max(2.75rem, var(--fluid-target-min, 0px));
      min-height: max(2.75rem, var(--fluid-target-min, 0px));
      border: 0;
      border-radius: var(--fluid-radius-full, 999px);
      background: var(--fluid-lightbox-control-bg, rgba(0, 0, 0, 0.5));
      color: var(--fluid-lightbox-control-fg, #fff);
      cursor: pointer;
    }
    .control:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid #fff;
      outline-offset: 2px;
    }
    .prev { left: 0.5rem; top: 50%; transform: translateY(-50%); }
    .next { right: 0.5rem; top: 50%; transform: translateY(-50%); }
    .close { top: 0.5rem; right: 0.5rem; }
    .counter {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.2rem 0.6rem;
      border-radius: var(--fluid-radius-full, 999px);
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-family: var(--fluid-font-family-sans);
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-variant-numeric: tabular-nums;
    }
    svg { width: 1.5rem; height: 1.5rem; }
  `;

  /** Wrap navigation past the first / last image. */
  @property({ type: Boolean }) loop = false;

  @state() private index = 0;
  @state() private open = false;
  private imgs: HTMLImageElement[] = [];

  @query("dialog") private dialog!: HTMLDialogElement;

  private onSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.imgs = slot.assignedElements({ flatten: true }).filter((el): el is HTMLImageElement => el.tagName === "IMG");
    this.imgs.forEach((img, i) => {
      img.setAttribute("role", "button");
      img.tabIndex = 0;
      if (!img.dataset.fluidWired) {
        img.dataset.fluidWired = "1";
        img.addEventListener("click", () => this.openAt(i));
        img.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            this.openAt(this.imgs.indexOf(img));
          }
        });
      }
    });
  }

  /** Open the lightbox at a given index. */
  openAt(i: number): void {
    if (i < 0 || i >= this.imgs.length) return;
    this.index = i;
    this.open = true;
    this.updateComplete.then(() => this.dialog?.showModal());
    this.dispatchEvent(new CustomEvent("fluid-open", { detail: { index: i }, bubbles: true, composed: true }));
  }

  /** Close the lightbox. */
  close(): void {
    this.dialog?.close();
  }

  private nav(delta: number): void {
    const n = this.imgs.length;
    if (!n) return;
    let next = this.index + delta;
    if (next < 0) next = this.loop ? n - 1 : 0;
    if (next >= n) next = this.loop ? 0 : n - 1;
    this.index = next;
    this.dispatchEvent(new CustomEvent("fluid-change", { detail: { index: next }, bubbles: true, composed: true }));
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.nav(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      this.nav(1);
    }
  }

  override render(): TemplateResult {
    const current = this.imgs[this.index];
    const total = this.imgs.length;
    const src = current?.dataset.full || current?.src || "";
    const alt = current?.alt || `Image ${this.index + 1} of ${total}`;
    return html`
      <div part="base" class="grid">
        <slot @slotchange=${this.onSlotChange}></slot>
      </div>

      <dialog
        part="dialog"
        aria-label="Image viewer"
        @keydown=${this.onKeydown}
        @close=${() => {
          this.open = false;
          this.dispatchEvent(new CustomEvent("fluid-close", { bubbles: true, composed: true }));
        }}
      >
        ${this.open
          ? html`
              <div class="stage">
                <img part="image" src=${src} alt=${alt} />
                ${total > 1
                  ? html`
                      <button part="prev" class="control prev" type="button" aria-label="Previous image" @click=${() => this.nav(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>
                      </button>
                      <button part="next" class="control next" type="button" aria-label="Next image" @click=${() => this.nav(1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
                      </button>
                      <span part="counter" class="counter" role="status" aria-live="polite">${this.index + 1} of ${total}</span>
                    `
                  : ""}
                <button part="close" class="control close" type="button" aria-label="Close" @click=${() => this.close()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                </button>
              </div>
            `
          : ""}
      </dialog>
    `;
  }
}
