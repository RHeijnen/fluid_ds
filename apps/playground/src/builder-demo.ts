import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";

/**
 * A miniature theme builder that themes itself.
 *
 * The builder teaches four moves, and all four are change over time: turning
 * Design Mode on, clicking a component and seeing the inspector claim it,
 * editing a token and watching everything that reads it follow, then scoping
 * that same edit to the selected component. A static diagram can label the
 * controls but not show the consequence, and the consequence is the whole
 * point: the difference between a shared edit and a scoped one is only visible
 * in what moves and what does not.
 *
 * Drawn at the builder's own proportions and scaled down as a whole rather
 * than redrawn smaller, so the swatch, the pill, the cards and the selection
 * ring keep the shapes of the things they are teaching. It also uses the real
 * tokens, which means the demo restyles itself along with the rest of the
 * page: an explanation painted in hard-coded colours would start lying the
 * moment someone changed the brand.
 *
 * The mini page contains two buttons on purpose, and they always move
 * together. Isolation is scoped to a component type, not an instance:
 * isolating a button writes one rule for fluid-button and restyles every
 * button on the page. Only the clicked one wears the selection ring, but
 * both keep the scoped edit; a button that stayed behind would teach the
 * opposite of what the product does.
 */

/** The miniature's own world, in pre-scale pixels. */
const WORLD_W = 680;
const WORLD_H = 294;
/** Drawn at world size and shrunk to fit the panel. */
const SCALE = 0.62;

/** How long each beat holds before the next begins. */
const BEAT_MS = 2800;
/** The finished state holds longer than a beat before the loop restarts. */
const REST_MS = 4400;
const BEATS = 4;

/**
 * A beat's consequence lands this long after the beat starts: after the
 * cursor's 0.7s travel and its press, so the click reads as causing the
 * change rather than trailing behind it. Beats 1 to 3 use it; Design Mode
 * flips at the beat boundary instead, because its press happens at the end
 * of beat 0 and the light coming on is what starts beat 1.
 */
const SETTLE_MS = 1200;

/**
 * Where the cursor rests on each beat, in world pixels.
 *
 * Derived from the same constants that place the controls, then corrected
 * against the rendered geometry, so the pointer lands on the thing it is
 * pointing at rather than near it.
 */
const RAIL_W = 168;
const TOPBAR_H = 40;
const CURSOR = [
  { x: 610, y: 20 }, // the Design Mode pill in the top bar
  { x: 228, y: 109 }, // the Save button in the preview
  { x: 25, y: 115 }, // the accent swatch in the rail
  { x: 43, y: 220 } // the Isolate control
] as const;

@customElement("builder-demo")
export class BuilderDemo extends LitElement {
  /** 0 design mode · 1 select · 2 shared edit · 3 scoped edit · 4 resting. */
  @state() private beat = 0;
  @state() private reduced = false;
  /** Suppresses transitions for the single frame the loop rewinds on. */
  @state() private snap = false;

  private timer?: ReturnType<typeof setTimeout>;

  static override styles = css`
    :host {
      display: block;
    }
    /* Content-box let the rail's padding spill past its set width and under
       the canvas, so the buttons sat on the rail. Border-box makes the width
       the canvas offsets from the same width the rail actually occupies. */
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    .demo {
      display: grid;
      gap: var(--fluid-space-3);
    }
    .stage {
      position: relative;
      /* Sized from the scaled world in render(), not guessed in rem: a frame
         that does not match its contents silently crops them. */
      justify-self: center;
      max-width: 100%;
      overflow: hidden;
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      background: var(--fluid-surface-subtle);
    }
    .world {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      transform-origin: top left;
    }

    /* Chrome: the shell the real builder has, at the same proportions. */
    .topbar {
      position: absolute;
      inset-inline: 0;
      inset-block-start: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-inline: 16px;
      background: var(--fluid-surface-base);
      border-block-end: 1px solid var(--fluid-border-default);
    }
    .mark {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      background: var(--fluid-border-strong);
    }
    .title-bar {
      width: 92px;
      height: 8px;
      border-radius: 999px;
      background: var(--fluid-surface-muted);
    }
    .pill {
      margin-inline-start: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid var(--fluid-border-default);
      background: var(--fluid-surface-base);
      color: var(--fluid-text-secondary);
      font-size: 11px;
      font-weight: 600;
      transition:
        background-color 0.35s ease,
        color 0.35s ease,
        border-color 0.35s ease;
    }
    .pill .bulb {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--fluid-border-strong);
      transition: background-color 0.35s ease;
    }
    .pill.on {
      background: var(--fluid-accent-base);
      border-color: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
    }
    .pill.on .bulb {
      background: var(--fluid-accent-text);
    }

    .rail {
      position: absolute;
      inset-block-start: ${TOPBAR_H}px;
      inset-block-end: 0;
      inset-inline-start: 0;
      background: var(--fluid-surface-base);
      border-inline-end: 1px solid var(--fluid-border-default);
      display: grid;
      align-content: start;
      justify-items: stretch;
      gap: 10px;
      padding: 14px;
    }
    .rail-title {
      width: 60%;
      height: 8px;
      border-radius: 999px;
      background: var(--fluid-border-strong);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .swatch {
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: var(--fluid-radius-sm);
      border: 1px solid var(--fluid-border-default);
      background: var(--fluid-border-strong);
      transition: background-color 0.5s ease ${SETTLE_MS}ms;
    }
    .swatch.accent {
      background: var(--fluid-accent-base);
    }
    /* The edited swatch, and the components, share this one colour so the
       cause and the effect are visibly the same value. */
    .swatch.accent.edited {
      background: var(--demo-edit);
    }
    .bar {
      height: 8px;
      border-radius: 999px;
      background: var(--fluid-surface-muted);
      flex: 1;
    }

    /* The Isolate control, quiet until its beat. */
    .isolate {
      margin-block-start: 6px;
      /* Hugs its label: stretched to the rail it reads as a text field rather
         than the control it is teaching. */
      justify-self: start;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: var(--fluid-radius-sm);
      border: 1px dashed var(--fluid-border-strong);
      color: var(--fluid-text-secondary);
      font-size: 11px;
      font-weight: 600;
      transition:
        background-color 0.35s ease ${SETTLE_MS}ms,
        border-color 0.35s ease ${SETTLE_MS}ms,
        color 0.35s ease ${SETTLE_MS}ms;
    }
    .isolate.on {
      background: color-mix(in srgb, var(--fluid-accent-base) 12%, transparent);
      border-style: solid;
      border-color: var(--fluid-accent-base);
      color: var(--fluid-text-primary);
    }

    /* The preview: a grid of cards, the shape the real preview has. */
    .canvas {
      position: absolute;
      inset-block-start: ${TOPBAR_H}px;
      inset-inline-start: ${RAIL_W}px;
      inset-inline-end: 0;
      inset-block-end: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      align-content: start;
      gap: 14px;
      padding: 20px;
      transition: background-color 0.35s ease;
    }
    /* Armed the way the real inspector arms the preview: a faint accent wash
       and a dashed edge, so "clicks now inspect" is visible before any click. */
    .canvas.armed {
      background: color-mix(in srgb, var(--fluid-accent-base) 4%, transparent);
      outline: 1px dashed color-mix(in srgb, var(--fluid-accent-base) 40%, transparent);
      outline-offset: -6px;
    }
    .tile {
      height: 100px;
      padding: 12px;
      display: grid;
      align-content: start;
      justify-items: start;
      gap: 10px;
      background: var(--fluid-surface-base);
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-md);
      box-shadow: var(--fluid-shadow-sm);
    }
    .tile-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--fluid-text-secondary);
    }

    .btn {
      padding: 7px 14px;
      border-radius: var(--fluid-radius-md);
      background: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
      font-size: 11px;
      font-weight: 600;
      transition: background-color 0.5s ease ${SETTLE_MS}ms;
    }
    .btn.edited {
      background: var(--demo-edit);
    }
    /* The inspector's anchored treatment, at world scale: solid accent ring,
       accent glow, and the tag name in a label above. It stays on accent even
       while the accent token is being edited, because here it is a marker of
       what is selected, and a marker that changed colour mid-explanation
       would read as one more thing being edited. */
    .select-wrap {
      position: relative;
      display: inline-flex;
    }
    .select-ring {
      position: absolute;
      inset: -6px;
      border: 2px solid var(--fluid-accent-base);
      border-radius: var(--fluid-radius-md);
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--fluid-accent-base) 20%, transparent),
        0 0 24px -4px color-mix(in srgb, var(--fluid-accent-base) 60%, transparent);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease ${SETTLE_MS}ms;
    }
    .select-ring.on {
      opacity: 1;
    }
    .select-ring .label {
      position: absolute;
      inset-block-start: -21px;
      inset-inline-start: -2px;
      padding: 2px 6px;
      border-radius: var(--fluid-radius-sm) var(--fluid-radius-sm) 0 0;
      background: var(--fluid-accent-base);
      color: var(--fluid-accent-text);
      font-family: var(--fluid-font-family-mono);
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
    }

    .field {
      justify-self: stretch;
      height: 28px;
      display: flex;
      align-items: center;
      padding-inline: 8px;
      border: 1px solid var(--fluid-border-default);
      border-radius: var(--fluid-radius-sm);
      background: var(--fluid-surface-base);
    }
    .field .ph {
      width: 60%;
      height: 8px;
      border-radius: 999px;
      background: var(--fluid-surface-muted);
    }

    .duo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toggle {
      position: relative;
      width: 36px;
      height: 20px;
      border-radius: 999px;
      background: var(--fluid-accent-base);
      transition: background-color 0.5s ease ${SETTLE_MS}ms;
    }
    .toggle.edited {
      background: var(--demo-edit);
    }
    .toggle .knob {
      position: absolute;
      inset-block-start: 3px;
      inset-inline-end: 3px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--fluid-surface-base);
    }
    .tag {
      padding: 5px 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--fluid-accent-base) 16%, transparent);
      color: var(--fluid-text-primary);
      font-size: 11px;
      font-weight: 600;
      transition: background-color 0.5s ease ${SETTLE_MS}ms;
    }
    .tag.edited {
      background: color-mix(in srgb, var(--demo-edit) 16%, transparent);
    }

    .bars {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 44px;
    }
    .bar-v {
      width: 16px;
      border-radius: var(--fluid-radius-sm) var(--fluid-radius-sm) 0 0;
      background: var(--fluid-accent-base);
      transition: background-color 0.5s ease ${SETTLE_MS}ms;
    }
    .bar-v.edited {
      background: var(--demo-edit);
    }

    /* The pointer. One transform, so moving between beats is a single travel
       rather than a jump plus a settle. */
    .cursor {
      position: absolute;
      width: 18px;
      height: 18px;
      margin: -2px 0 0 -2px;
      transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.25, 1);
      filter: drop-shadow(0 1px 2px rgb(0 0 0 / 35%));
    }
    .cursor svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .cursor .tip {
      fill: var(--fluid-surface-base);
      stroke: var(--fluid-text-primary);
      stroke-width: 1.5;
    }
    /* The press, timed to land after the travel and just before the beat's
       consequence. Two identical keyframes exist only so alternating the name
       restarts the animation every beat: replaying one name does nothing. */
    .cursor.press-a {
      animation: press-a 0.35s ease 1.05s;
    }
    .cursor.press-b {
      animation: press-b 0.35s ease 1.05s;
    }
    @keyframes press-a {
      50% {
        transform: translate(var(--cx), var(--cy)) scale(0.82);
      }
    }
    @keyframes press-b {
      50% {
        transform: translate(var(--cx), var(--cy)) scale(0.82);
      }
    }

    .caption {
      display: grid;
      gap: var(--fluid-space-1);
      min-height: 3rem;
    }
    .caption strong {
      font-size: 0.85rem;
    }
    .caption span {
      font-size: 0.78rem;
      color: var(--fluid-text-secondary);
      line-height: 1.5;
    }
    .foot {
      display: flex;
      align-items: center;
      gap: var(--fluid-space-2);
    }
    .steps {
      display: flex;
      gap: var(--fluid-space-1);
      align-items: center;
    }
    .dot {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--fluid-border-default);
    }
    .dot.on {
      background: var(--fluid-accent-base);
    }
    /* A statement of what happens next, not a control: the preview takes the
       click, so a button here would be a second way to do the same thing. */
    .hint {
      margin-inline-start: auto;
      font-size: 0.72rem;
      color: var(--fluid-text-secondary);
    }
    .static-list {
      display: grid;
      gap: var(--fluid-space-2);
      font-size: 0.8rem;
      line-height: 1.5;
    }

    .snap .btn,
    .snap .tag,
    .snap .toggle,
    .snap .bar-v,
    .snap .swatch,
    .snap .cursor,
    .snap .pill,
    .snap .pill .bulb,
    .snap .isolate,
    .snap .select-ring,
    .snap .canvas {
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .btn,
      .tag,
      .toggle,
      .bar-v,
      .swatch,
      .cursor,
      .pill,
      .pill .bulb,
      .isolate,
      .select-ring,
      .canvas {
        transition: none;
      }
      .cursor.press-a,
      .cursor.press-b {
        animation: none;
      }
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.play();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /**
   * Run the beats on a loop.
   *
   * Looping is what removes the replay control: someone who looked away comes
   * back to the explanation starting again rather than to a finished picture
   * and a button. Someone who asked for reduced motion gets the finished state
   * and the same four explanations as text, the information without the
   * movement that carried it, and without the repetition.
   */
  private play(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.reduced) {
      this.beat = BEATS;
      return;
    }
    this.beat = 0;
    const advance = (): void => {
      const looping = this.beat >= BEATS;
      /* Rewinding must not play backwards: the colour would drain back out and
         the pointer fly to the top, which reads as undoing rather than as
         starting over. Snap suppresses the transitions for that one frame. */
      this.snap = looping;
      this.beat = looping ? 0 : this.beat + 1;
      if (looping) requestAnimationFrame(() => (this.snap = false));
      this.timer = setTimeout(advance, this.beat === BEATS ? REST_MS : BEAT_MS);
    };
    this.timer = setTimeout(advance, BEAT_MS);
  }

  private caption(): { title: string; body: string } {
    if (this.beat === 0) {
      return {
        title: "Turn on Design Mode",
        body: "The switch lives in the top bar. It turns the preview from something you use into something you can inspect."
      };
    }
    if (this.beat === 1) {
      return {
        title: "Click a component to select it",
        body: "The inspector outlines the button and names it, and the sidebar narrows to the tokens it actually reads."
      };
    }
    if (this.beat === 2) {
      return {
        title: "Change a shared colour",
        body: "Everything that reads the token follows: the buttons, the tag, the toggle and the chart. This is the brand-wide edit."
      };
    }
    if (this.beat === 3) {
      return {
        title: "Or isolate it to one component",
        body: "Isolate scopes the edit to the selected component: every button keeps it, and everything else returns to the shared value."
      };
    }
    return {
      title: "That is the whole loop",
      body: "Inspect, edit, and decide how far the change should reach. Export it when it looks right."
    };
  }

  override render(): TemplateResult {
    const designOn = this.beat >= 1;
    const selected = this.beat >= 1;
    const scoped = this.beat >= 3;
    // Both buttons keep the edit through the isolate beat; the tag, toggle
    // and bars follow the shared edit and snap back when it is scoped. That
    // contrast is the only thing separating beat 2 from beat 3.
    const buttonEdited = this.beat >= 2;
    const othersEdited = this.beat === 2;
    const spot = CURSOR[Math.min(this.beat, CURSOR.length - 1)]!;
    const pressClass = this.beat < BEATS ? (this.beat % 2 ? "press-b" : "press-a") : "";
    const caption = this.caption();

    return html`<div class="demo">
      <div
        class="stage"
        style="width:${Math.ceil(WORLD_W * SCALE) + 2}px;height:${Math.ceil(WORLD_H * SCALE) + 2}px"
        role="img"
        aria-label="A miniature of this page theming itself: Design Mode is switched on, a button is selected, a shared colour is edited so every component follows, then the edit is isolated so only the buttons keep it."
      >
        <div
          class="world ${this.snap ? "snap" : ""}"
          style="width:${WORLD_W}px;height:${WORLD_H}px;transform:scale(${SCALE});--demo-edit:var(--fluid-success-base)"
        >
          <div class="topbar" style="height:${TOPBAR_H}px">
            <span class="mark"></span>
            <span class="title-bar"></span>
            <div class="pill ${designOn ? "on" : ""}">
              <span class="bulb"></span>
              Design Mode
            </div>
          </div>

          <div class="rail" style="width:${RAIL_W}px">
            <span class="rail-title"></span>
            <div class="row">
              <span class="swatch"></span>
              <span class="bar"></span>
            </div>
            <div class="row">
              <span class="swatch accent ${buttonEdited ? "edited" : ""}"></span>
              <span class="bar"></span>
            </div>
            <div class="row">
              <span class="swatch"></span>
              <span class="bar"></span>
            </div>
            <div class="row">
              <span class="swatch"></span>
              <span class="bar"></span>
            </div>
            <div class="isolate ${scoped ? "on" : ""}">Isolate</div>
          </div>

          <div class="canvas ${designOn ? "armed" : ""}">
            <div class="tile">
              <span class="tile-label">Buttons</span>
              <span class="duo">
                <span class="select-wrap">
                  <span class="btn ${buttonEdited ? "edited" : ""}">Save</span>
                  <span class="select-ring ${selected ? "on" : ""}" aria-hidden="true">
                    <span class="label">fluid-button</span>
                  </span>
                </span>
                <span class="btn ${buttonEdited ? "edited" : ""}">Publish</span>
              </span>
            </div>
            <div class="tile">
              <span class="tile-label">Input</span>
              <span class="field"><span class="ph"></span></span>
            </div>
            <div class="tile">
              <span class="tile-label">Toggle and tag</span>
              <span class="duo">
                <span class="toggle ${othersEdited ? "edited" : ""}"
                  ><span class="knob"></span
                ></span>
                <span class="tag ${othersEdited ? "edited" : ""}">Beta</span>
              </span>
            </div>
            <div class="tile">
              <span class="tile-label">Chart</span>
              <span class="bars">
                ${[22, 34, 26, 44].map(
                  (h) =>
                    html`<span
                      class="bar-v ${othersEdited ? "edited" : ""}"
                      style="height:${h}px"
                    ></span>`
                )}
              </span>
            </div>
          </div>

          ${this.reduced
            ? nothing
            : html`<div
                class="cursor ${pressClass}"
                style="--cx:${spot.x}px;--cy:${spot.y}px;transform:translate(${spot.x}px,${spot.y}px)"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24">
                  <path class="tip" d="M5 3l14 8-6 1.5L10 19z" />
                </svg>
              </div>`}
        </div>
      </div>

      ${this.reduced
        ? html`<div class="static-list">
            <div><strong>Turn on Design Mode</strong> to make the preview inspectable.</div>
            <div>
              <strong>Click a component</strong> to select it: the inspector outlines it, names it,
              and shows the tokens it reads.
            </div>
            <div><strong>Change a shared colour</strong> and everything that reads it follows.</div>
            <div>
              <strong>Isolate</strong> to scope the same edit to one component: every instance of it
              changes, and nothing else does.
            </div>
          </div>`
        : html`<div class="caption">
            <strong>${caption.title}</strong>
            <span>${caption.body}</span>
          </div>`}

      <div class="foot">
        ${this.reduced
          ? nothing
          : html`<div class="steps" aria-hidden="true">
              ${[0, 1, 2, 3].map(
                (index) => html`<span class="dot ${this.beat >= index ? "on" : ""}"></span>`
              )}
            </div>`}
        <span class="hint">Click anywhere in the preview to start.</span>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "builder-demo": BuilderDemo;
  }
}
