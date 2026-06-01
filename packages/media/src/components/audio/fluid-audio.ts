import { LitElement, html, css, type TemplateResult } from "lit";
import { property, state, query } from "lit/decorators.js";

const pad = (n: number): string => String(Math.floor(n)).padStart(2, "0");
function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${pad(s % 60)}`;
}

/**
 * A themed audio player with custom, accessible controls (play/pause, a seek
 * slider with elapsed / total time, and mute). It wraps a native `<audio>`
 * element for playback, so format support and buffering are the platform's.
 *
 * @summary Themed audio player.
 *
 * @csspart base - The player container.
 * @csspart play-button - The play / pause toggle.
 * @csspart scrubber - The seek slider.
 * @csspart time - The elapsed / total time label.
 * @csspart mute-button - The mute toggle.
 *
 * @cssproperty --fluid-audio-bg - Player background. Falls back to --fluid-surface-muted.
 * @cssproperty --fluid-audio-fg - Control + text color. Falls back to --fluid-text-primary.
 * @cssproperty --fluid-audio-accent - Played-progress + focus color. Falls back to --fluid-accent-base.
 * @cssproperty --fluid-audio-track - Unplayed track color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-audio-radius - Corner radius. Falls back to --fluid-radius-md.
 *
 * @uses-token --fluid-surface-muted - Player background.
 * @uses-token --fluid-text-primary - Controls + time.
 * @uses-token --fluid-accent-base - Progress + focus ring.
 * @uses-token --fluid-border-default - Unplayed track.
 * @uses-token --fluid-radius-md - Corner radius.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-target-min - Minimum control target (24px AA / 44px AAA).
 *
 * @fires fluid-play - Playback started.
 * @fires fluid-pause - Playback paused.
 * @fires fluid-ended - Playback reached the end.
 */
export class FluidAudio extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--fluid-font-family-sans);
      color: var(--fluid-audio-fg, var(--fluid-text-primary));
    }
    .base {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.75rem;
      background: var(--fluid-audio-bg, var(--fluid-surface-muted));
      border-radius: var(--fluid-audio-radius, var(--fluid-radius-md, 0.5rem));
    }
    audio { display: none; }
    button {
      display: inline-grid;
      place-items: center;
      min-width: max(2rem, var(--fluid-target-min, 0px));
      min-height: max(2rem, var(--fluid-target-min, 0px));
      padding: 0;
      border: 0;
      border-radius: var(--fluid-radius-full, 999px);
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
    button:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
    button:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-audio-accent, var(--fluid-accent-base));
      outline-offset: 2px;
    }
    svg { width: 1.25rem; height: 1.25rem; }
    .time {
      font-variant-numeric: tabular-nums;
      font-size: var(--fluid-font-size-sm, 0.875rem);
      white-space: nowrap;
    }
    input[type="range"] {
      flex: 1;
      min-width: 4rem;
      height: 1.25rem;
      accent-color: var(--fluid-audio-accent, var(--fluid-accent-base));
      cursor: pointer;
    }
    input[type="range"]:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-audio-accent, var(--fluid-accent-base));
      outline-offset: 2px;
      border-radius: 4px;
    }
  `;

  /** Audio source URL. */
  @property() src = "";

  /** Loop playback. */
  @property({ type: Boolean }) loop = false;

  /** Preload strategy passed to the native audio element. */
  @property() preload: "none" | "metadata" | "auto" = "metadata";

  /** Accessible name for the player group. */
  @property() label = "Audio player";

  @state() private playing = false;
  @state() private current = 0;
  @state() private duration = 0;
  @state() private muted = false;

  @query("audio") private audio!: HTMLAudioElement;

  /** Start playback. */
  play(): void {
    void this.audio?.play();
  }
  /** Pause playback. */
  pause(): void {
    this.audio?.pause();
  }

  private toggle(): void {
    if (this.audio.paused) this.play();
    else this.pause();
  }

  private onSeek(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    if (this.audio) this.audio.currentTime = v;
  }

  private toggleMute(): void {
    this.audio.muted = !this.audio.muted;
    this.muted = this.audio.muted;
  }

  override render(): TemplateResult {
    const remaining = this.duration || 0;
    return html`
      <div part="base" class="base" role="group" aria-label=${this.label}>
        <audio
          src=${this.src}
          ?loop=${this.loop}
          preload=${this.preload}
          @loadedmetadata=${() => (this.duration = this.audio.duration)}
          @timeupdate=${() => (this.current = this.audio.currentTime)}
          @play=${() => {
            this.playing = true;
            this.dispatchEvent(new CustomEvent("fluid-play", { bubbles: true, composed: true }));
          }}
          @pause=${() => {
            this.playing = false;
            this.dispatchEvent(new CustomEvent("fluid-pause", { bubbles: true, composed: true }));
          }}
          @ended=${() => {
            this.playing = false;
            this.dispatchEvent(new CustomEvent("fluid-ended", { bubbles: true, composed: true }));
          }}
        ></audio>

        <button part="play-button" type="button" aria-label=${this.playing ? "Pause" : "Play"} @click=${() => this.toggle()}>
          ${this.playing
            ? html`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>`
            : html`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>`}
        </button>

        <span part="time" class="time">${formatTime(this.current)} / ${formatTime(remaining)}</span>

        <input
          part="scrubber"
          type="range"
          min="0"
          max=${remaining || 0}
          step="0.1"
          .value=${String(this.current)}
          aria-label="Seek"
          aria-valuetext=${`${formatTime(this.current)} of ${formatTime(remaining)}`}
          @input=${this.onSeek}
        />

        <button part="mute-button" type="button" aria-label=${this.muted ? "Unmute" : "Mute"} aria-pressed=${this.muted ? "true" : "false"} @click=${() => this.toggleMute()}>
          ${this.muted
            ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="m23 9-6 6"></path><path d="m17 9 6 6"></path></svg>`
            : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>`}
        </button>
      </div>
    `;
  }
}
