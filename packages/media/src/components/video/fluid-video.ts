import { LitElement, html, css, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";

/**
 * Themed wrapper around the native `<video>` element. Forwards the most
 * commonly used attributes and exposes a few helpers (`play`, `pause`,
 * `load`) so it behaves like a Fluid component while still leaning on
 * the platform for actual playback.
 *
 * @summary Themed HTML5 video player.
 *
 * @slot - Additional `<source>` and `<track>` elements (passed straight to the inner video).
 *
 * @csspart base - The inner native video element.
 *
 * @cssproperty --fluid-video-radius - Border radius applied to the player.
 *
 * @uses-token --fluid-radius-md - Default border radius.
 *
 * @fires fluid-play - Fired when playback starts.
 * @fires fluid-pause - Fired when playback pauses.
 * @fires fluid-ended - Fired when playback ends.
 */
export class FluidVideo extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 100%;
    }
    video {
      width: 100%;
      height: auto;
      display: block;
      border-radius: var(--fluid-video-radius, var(--fluid-radius-md));
      background: black;
    }
  `;

  /** Video source URL. */
  @property() src: string | null = null;

  /** Poster image URL. */
  @property() poster: string | null = null;

  /** Native controls. */
  @property({ type: Boolean }) controls = true;

  /** Autoplay (most browsers require muted). */
  @property({ type: Boolean }) autoplay = false;

  /** Loop. */
  @property({ type: Boolean }) loop = false;

  /** Muted. */
  @property({ type: Boolean }) muted = false;

  /** Preload behavior. */
  @property() preload: "auto" | "metadata" | "none" = "metadata";

  /** Inline playback on mobile. */
  @property({ type: Boolean, attribute: "plays-inline" }) playsInline = false;

  @query("video") private videoEl!: HTMLVideoElement;

  /** Play the video. */
  play(): Promise<void> | void {
    return this.videoEl?.play();
  }

  /** Pause the video. */
  pause(): void {
    this.videoEl?.pause();
  }

  /** Reload the source. */
  load(): void {
    this.videoEl?.load();
  }

  /** Underlying native element (for advanced consumers). */
  get nativeElement(): HTMLVideoElement | null {
    return this.videoEl ?? null;
  }

  private onPlay = () =>
    this.dispatchEvent(new CustomEvent("fluid-play", { bubbles: true, composed: true }));
  private onPause = () =>
    this.dispatchEvent(new CustomEvent("fluid-pause", { bubbles: true, composed: true }));
  private onEnded = () =>
    this.dispatchEvent(new CustomEvent("fluid-ended", { bubbles: true, composed: true }));

  override render(): TemplateResult {
    return html`
      <video
        part="base"
        src=${this.src ?? ""}
        poster=${this.poster ?? ""}
        ?controls=${this.controls}
        ?autoplay=${this.autoplay}
        ?loop=${this.loop}
        ?muted=${this.muted}
        ?playsinline=${this.playsInline}
        preload=${this.preload}
        @play=${this.onPlay}
        @pause=${this.onPause}
        @ended=${this.onEnded}
      >
        <slot></slot>
      </video>
    `;
  }
}
