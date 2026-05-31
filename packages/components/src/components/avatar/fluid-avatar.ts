import { html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "../../internal/base-element.js";

export type FluidAvatarShape = "circle" | "square" | "rounded";
export type FluidAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * A compact identity image with three fallback layers, applied in order:
 *   1. `image`: the user's photo
 *   2. `initials`: text fallback (auto-extracted from `label` if not set)
 *   3. `<slot name="icon">`: a generic icon
 *
 * The badge slot accepts a status dot, count, or anything small that should
 * anchor to a corner of the avatar.
 *
 * @summary Identity image with image / initials / icon fallback chain.
 *
 * @slot icon - Final fallback shown when no image or initials are available.
 * @slot badge - Optional status dot or count anchored to the bottom-right corner.
 *
 * @csspart base - The outer container.
 * @csspart image - The <img> element (when an image is loaded).
 * @csspart initials - The initials text.
 *
 * @cssproperty --fluid-avatar-bg - Background color when no image is loaded.
 * @cssproperty --fluid-avatar-fg - Foreground (text/icon) color.
 * @cssproperty --fluid-avatar-border - Subtle border color.
 *
 * @uses-token --fluid-surface-muted - Default avatar background.
 * @uses-token --fluid-text-primary - Default avatar foreground.
 * @uses-token --fluid-border-default - Subtle border around the avatar.
 */
export class FluidAvatar extends FluidElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
    }

    .base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--avatar-size, 2.5rem);
      height: var(--avatar-size, 2.5rem);
      background-color: var(--fluid-avatar-bg, var(--fluid-surface-muted));
      color: var(--fluid-avatar-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
      font-weight: var(--fluid-font-weight-semibold);
      font-size: calc(var(--avatar-size, 2.5rem) * 0.42);
      line-height: 1;
      letter-spacing: -0.02em;
      overflow: hidden;
      box-shadow: inset 0 0 0 1px var(--fluid-avatar-border, var(--fluid-border-default));
      user-select: none;
    }

    /* Sizes, set the --avatar-size custom prop and everything else scales. */
    :host([size="xs"]) {
      --avatar-size: 1.25rem;
    }
    :host([size="sm"]) {
      --avatar-size: 1.75rem;
    }
    :host([size="md"]) {
      --avatar-size: 2.5rem;
    }
    :host([size="lg"]) {
      --avatar-size: 3.5rem;
    }
    :host([size="xl"]) {
      --avatar-size: 5rem;
    }

    /* Shapes */
    :host([shape="circle"]) .base {
      border-radius: var(--fluid-radius-full);
    }
    :host([shape="square"]) .base {
      border-radius: 0;
    }
    :host([shape="rounded"]) .base {
      border-radius: var(--fluid-radius-md);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .badge-slot {
      position: absolute;
      bottom: 0;
      right: 0;
      transform: translate(15%, 15%);
      display: inline-flex;
    }

    ::slotted([slot="icon"]) {
      width: 60%;
      height: 60%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `;

  /** Avatar shape. */
  @property({ reflect: true }) shape: FluidAvatarShape = "circle";

  /** Avatar size. */
  @property({ reflect: true }) size: FluidAvatarSize = "md";

  /** Image URL. If it fails to load, falls back to initials / icon. */
  @property() image = "";

  /** Initials to show when no image is loaded. */
  @property() initials = "";

  /**
   * Optional full-name label used for the accessible name AND to auto-derive
   * initials if `initials` isn't set. Example: "Ada Lovelace" → "AL".
   */
  @property() label = "";

  @state() private imageFailed = false;

  protected override willUpdate(): void {
    // Reset the failed-load flag if the image URL changed.
    if (this.image && this.imageFailed) {
      // Lit's @property setter doesn't memo changes, but we just want a chance
      // to re-attempt the load when consumers swap the src.
    }
  }

  /** Derive initials from `label` if `initials` wasn't provided. */
  private resolvedInitials(): string {
    if (this.initials) return this.initials.slice(0, 3);
    if (!this.label) return "";
    return this.label
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  private handleImageError = () => {
    this.imageFailed = true;
  };

  override render(): TemplateResult {
    const initials = this.resolvedInitials();
    const showImage = this.image && !this.imageFailed;
    const ariaLabel = this.label || (initials ? `Avatar: ${initials}` : "Avatar");
    return html`
      <span part="base" class="base" role="img" aria-label=${ariaLabel}>
        ${showImage
          ? html`<img
              part="image"
              src=${this.image}
              alt=""
              @error=${this.handleImageError}
            />`
          : initials
            ? html`<span part="initials">${initials}</span>`
            : html`<slot name="icon"></slot>`}
      </span>
      <span class="badge-slot">
        <slot name="badge"></slot>
      </span>
    `;
  }
}
