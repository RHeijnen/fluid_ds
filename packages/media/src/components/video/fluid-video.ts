import { html, css, type TemplateResult } from "lit";
import { property, query } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

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
export class FluidVideo extends FluidElement {
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

  /** Accessible name forwarded to the native video control. */
  @property()
  get label(): string {
    return this.labelOverride ?? this.term("video");
  }
  set label(value: string | null) {
    this.labelOverride = value;
  }
  private labelOverride: string | null = null;

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

  private mediaChildrenObserver?: MutationObserver;
  private sourceMarkup = "";
  private trackMarkup = "";

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof MutationObserver !== "undefined") {
      this.mediaChildrenObserver ??= new MutationObserver(() => this.syncMediaChildren());
      this.mediaChildrenObserver.observe(this, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    if (this.hasUpdated) this.syncMediaChildren();
  }

  protected override firstUpdated(): void {
    this.syncMediaChildren();
  }

  private syncMediaChildren(): void {
    const video = this.videoEl;
    if (!video) return;
    // Native media resource selection does not traverse slots. Preserve the
    // consumer-owned light DOM and mirror direct source/track children into
    // the native element, where the browser can actually consume them.
    const sources = Array.from(this.children).filter((child) => child.tagName === "SOURCE");
    const tracks = Array.from(this.children).filter((child) => child.tagName === "TRACK");
    const sourceMarkup = sources.map((source) => source.outerHTML).join("");
    const trackMarkup = tracks.map((track) => track.outerHTML).join("");
    const sourcesChanged = sourceMarkup !== this.sourceMarkup;
    if (!sourcesChanged && trackMarkup === this.trackMarkup) return;
    this.sourceMarkup = sourceMarkup;
    this.trackMarkup = trackMarkup;
    for (const child of Array.from(video.children)) {
      if (child.tagName === "SOURCE" || child.tagName === "TRACK") child.remove();
    }
    for (const child of [...sources, ...tracks]) video.append(child.cloneNode(true));
    if (sourcesChanged && !this.src) video.load();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mediaChildrenObserver?.disconnect();
    // A removed player must not keep playing audio or consuming decoder work.
    this.pause();
  }

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
        aria-label=${this.label}
        src=${ifDefined(this.src || undefined)}
        poster=${ifDefined(this.poster || undefined)}
        ?controls=${this.controls}
        ?autoplay=${this.autoplay}
        ?loop=${this.loop}
        .muted=${this.muted}
        ?playsinline=${this.playsInline}
        preload=${this.preload}
        @play=${this.onPlay}
        @pause=${this.onPause}
        @ended=${this.onEnded}
      >
        <slot @slotchange=${this.syncMediaChildren}></slot>
      </video>
    `;
  }
}
