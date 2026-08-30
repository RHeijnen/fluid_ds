import { html, css, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";
import "../video/define.js";
import { formatMediaNumber } from "../../internal/format.js";

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
 * @cssproperty --fluid-video-playlist-focus-ring - Keyboard focus ring color.
 *
 * @uses-token --fluid-accent-base - Active row tint.
 * @uses-token --fluid-surface-base - Default background.
 * @uses-token --fluid-border-default - Row separator.
 * @uses-token --fluid-focus-ring-color - Keyboard focus ring.
 * @uses-token --fluid-focus-ring-width - Conformance-aware focus ring width.
 *
 * @fires fluid-change - Fired when the active index changes; detail = { index, entry }.
 */
export class FluidVideoPlaylist extends FluidElement {
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
      /* Hugs its entries rather than stretching to the player's height. As a
         grid item it stretched by default, so a short playlist drew a tall
         bordered box with the entries huddled at the top and dead space under
         them. Long playlists still cap and scroll. */
      align-self: start;
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
    .item:focus-visible {
      outline: var(--fluid-focus-ring-width) solid
        var(--fluid-video-playlist-focus-ring, var(--fluid-focus-ring-color));
      outline-offset: calc(-1 * var(--fluid-focus-ring-width));
    }
    .item[aria-pressed="true"] {
      background: color-mix(
        in srgb,
        var(--fluid-video-playlist-active-accent, var(--fluid-accent-base)) 15%,
        transparent
      );
      color: var(--fluid-video-playlist-active-fg, var(--fluid-accent-active));
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
  /**
   * Whether the viewer has actually asked for playback.
   *
   * The player autoplays a clip the viewer picked, and the next one when the
   * current ends, but not on arrival. Autoplaying on mount meant a page
   * carrying a playlist started moving on its own, and with auto-advance it
   * then walked itself through the whole list, which reads as a fault rather
   * than a feature. It is also the behaviour WCAG 2.2.2 is about: motion that
   * starts without being asked for.
   */
  @state() private started = false;

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("entries") && this.activeIndex >= this.entries.length) {
      this.activeIndex = Math.max(0, this.entries.length - 1);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    // Fire fluid-change only on a genuine activeIndex change, never on initial
    // mount: on the first render Lit records activeIndex with an undefined old
    // value (hasUpdated is already true inside updated(), so it can't gate this).
    // activeIndex is private @state, so read changed as a plain Map to sidestep
    // the keyof-this key constraint.
    const ch = changed as Map<PropertyKey, unknown>;
    if (ch.has("activeIndex") && ch.get("activeIndex") !== undefined) {
      this.dispatchEvent(
        new CustomEvent("fluid-change", {
          detail: { index: this.activeIndex, entry: this.entries[this.activeIndex] },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  private onEnded = () => {
    if (!this.isConnected || !this.autoAdvance || this.entries.length === 0) return;
    // Reaching the end of a clip is itself engagement: the next one may play.
    this.started = true;
    const next = this.activeIndex + 1;
    if (next < this.entries.length) {
      this.activeIndex = next;
    } else if (this.loop) {
      this.activeIndex = 0;
    }
  };

  /** Jump to a specific entry. */
  goTo(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.entries.length) return;
    this.started = true;
    this.activeIndex = index;
  }

  override render(): TemplateResult {
    const active = this.entries[this.activeIndex];
    return html`
      <fluid-video
        part="video"
        src=${active?.src ?? ""}
        poster=${active?.poster ?? ""}
        label=${active?.title ?? this.term("video")}
        controls
        ?autoplay=${this.started}
        muted
        plays-inline
        @fluid-ended=${this.onEnded}
      ></fluid-video>
      <div part="list" class="list" role="group" aria-label=${this.term("playlist")}>
        ${this.entries.map(
          (e, i) => html`
            <button
              type="button"
              part="item"
              class="item"
              aria-pressed=${i === this.activeIndex ? "true" : "false"}
              @click=${() => this.goTo(i)}
            >
              ${e.title ?? this.term("trackNumber", formatMediaNumber(i + 1, this.localize.locale))}
            </button>
          `
        )}
      </div>
    `;
  }
}
