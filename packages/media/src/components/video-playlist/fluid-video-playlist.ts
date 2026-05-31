import { LitElement, html, css, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import "../video/define.js";
import type { FluidVideo } from "../video/fluid-video.js";

export interface PlaylistEntry {
  src: string;
  title?: string;
  poster?: string;
}

/**
 * Playlist-driven video player. Pass a list of entries via the `entries`
 * property and the component renders a `<fluid-video>` plus a clickable
 * track list. Advances to the next entry automatically when each clip ends.
 *
 * @summary Playlist video player.
 *
 * @csspart base - Outer container.
 * @csspart video - The video element.
 * @csspart list - The playlist sidebar.
 * @csspart item - A playlist row.
 *
 * @cssproperty --fluid-video-playlist-fg - Default text color.
 * @cssproperty --fluid-video-playlist-list-border - Playlist border + row separator color.
 * @cssproperty --fluid-video-playlist-item-hover-bg - Hover background for inactive rows.
 * @cssproperty --fluid-video-playlist-active-accent - Active row accent color.
 *
 * @uses-token --fluid-color-primary - Active row tint.
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-border-default - Row separator.
 *
 * @fires fluid-change - Fired when the active index changes; detail = { index, entry }.
 */
export class FluidVideoPlaylist extends LitElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--fluid-space-3);
      width: 100%;
      max-width: 60rem;
      color: var(--fluid-video-playlist-fg, var(--fluid-text-primary));
      font-family: var(--fluid-font-family-sans);
    }

    .list {
      max-height: 28rem;
      overflow-y: auto;
      border: 1px solid var(--fluid-video-playlist-list-border, var(--fluid-border-default));
      border-radius: var(--fluid-radius-md);
    }

    .item {
      all: unset;
      display: block;
      padding: var(--fluid-space-3);
      cursor: pointer;
      border-bottom: 1px solid var(--fluid-video-playlist-list-border, var(--fluid-border-default));
    }
    .item:last-child {
      border-bottom: none;
    }
    .item:hover {
      background: var(--fluid-video-playlist-item-hover-bg, var(--fluid-surface-muted));
    }
    .item[aria-current="true"] {
      background: color-mix(
        in srgb,
        var(--fluid-video-playlist-active-accent, var(--fluid-color-primary)) 15%,
        transparent
      );
      color: var(--fluid-video-playlist-active-accent, var(--fluid-color-primary));
      font-weight: var(--fluid-font-weight-medium);
    }

    @media (max-width: 720px) {
      :host {
        grid-template-columns: 1fr;
      }
    }
  `;

  /** Playlist entries. */
  @property({ attribute: false }) entries: PlaylistEntry[] = [];

  /** Auto-advance when the current clip ends. */
  @property({ type: Boolean, attribute: "auto-advance" }) autoAdvance = true;

  /** Loop the playlist. */
  @property({ type: Boolean }) loop = false;

  @state() private activeIndex = 0;

  private videoEl: FluidVideo | null = null;

  protected override firstUpdated(): void {
    this.videoEl = this.renderRoot.querySelector("fluid-video") as FluidVideo | null;
    this.videoEl?.addEventListener("fluid-ended", this.onEnded);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.videoEl?.removeEventListener("fluid-ended", this.onEnded);
  }

  protected override updated(): void {
    this.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { index: this.activeIndex, entry: this.entries[this.activeIndex] },
        bubbles: true,
        composed: true
      })
    );
  }

  private onEnded = () => {
    if (!this.autoAdvance) return;
    const next = this.activeIndex + 1;
    if (next < this.entries.length) {
      this.activeIndex = next;
    } else if (this.loop) {
      this.activeIndex = 0;
    }
  };

  /** Jump to a specific entry. */
  goTo(index: number): void {
    if (index < 0 || index >= this.entries.length) return;
    this.activeIndex = index;
  }

  override render(): TemplateResult {
    const active = this.entries[this.activeIndex];
    return html`
      <fluid-video
        part="video"
        src=${active?.src ?? ""}
        poster=${active?.poster ?? ""}
        controls
        autoplay
        muted
        plays-inline
      ></fluid-video>
      <div part="list" class="list" role="listbox" aria-label="Playlist">
        ${this.entries.map(
          (e, i) => html`
            <button
              part="item"
              class="item"
              role="option"
              aria-current=${i === this.activeIndex ? "true" : "false"}
              @click=${() => this.goTo(i)}
            >
              ${e.title ?? `Track ${i + 1}`}
            </button>
          `
        )}
      </div>
    `;
  }
}
