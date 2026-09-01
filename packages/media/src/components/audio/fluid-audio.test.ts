import { expect, fixture, html, elementUpdated, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidAudio } from "./fluid-audio.js";

/**
 * Headless browsers cannot decode a real stream, so the native transport is
 * driven by hand: the stub reports the same `paused` state the platform would
 * and fires the same events, which is all the component reads.
 */
function stubTransport(el: FluidAudio) {
  const audio = el.shadowRoot!.querySelector("audio")!;
  const calls = { play: 0, pause: 0 };
  let paused = true;
  Object.defineProperty(audio, "paused", { configurable: true, get: () => paused });
  audio.play = () => {
    calls.play += 1;
    paused = false;
    audio.dispatchEvent(new Event("play"));
    return Promise.resolve();
  };
  audio.pause = () => {
    calls.pause += 1;
    paused = true;
    audio.dispatchEvent(new Event("pause"));
  };
  return { audio, calls };
}

function timeLabel(el: FluidAudio): string {
  return el.shadowRoot!.querySelector('[part="time"]')!.textContent!;
}

describe("<fluid-audio>", () => {
  it("renders play, scrubber and mute controls in a labelled group", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio label="Track"></fluid-audio>`);
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-label")).to.equal("Track");
    expect(el.shadowRoot!.querySelector('[part="play-button"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="scrubber"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="mute-button"]')).to.exist;
  });

  it("forwards src + loop to the inner audio element", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="x.mp3" loop></fluid-audio>`);
    const audio = el.shadowRoot!.querySelector("audio")!;
    expect(audio.getAttribute("src")).to.equal("x.mp3");
    expect(audio.loop).to.be.true;
  });

  it("labels the play button by state", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio></fluid-audio>`);
    const btn = el.shadowRoot!.querySelector('[part="play-button"]')!;
    expect(btn.getAttribute("aria-label")).to.equal("Play");
  });

  it("toggles mute and reflects aria-pressed", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio></fluid-audio>`);
    const mute = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="mute-button"]')!;
    mute.click();
    await elementUpdated(el);
    expect(mute.getAttribute("aria-pressed")).to.equal("true");
    expect(el.shadowRoot!.querySelector("audio")!.muted).to.be.true;
  });

  it("starts and stops the native transport from the play button", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="track.mp3"></fluid-audio>`);
    const { calls } = stubTransport(el);
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>('[part="play-button"]')!;

    button.click();
    await elementUpdated(el);
    expect(calls.play).to.equal(1);
    expect(button.getAttribute("aria-label")).to.equal("Pause");
    // Two bars: the control shows what pressing it does next.
    expect(button.querySelectorAll("rect")).to.have.length(2);

    button.click();
    await elementUpdated(el);
    expect(calls.pause).to.equal(1);
    expect(button.getAttribute("aria-label")).to.equal("Play");
    expect(button.querySelectorAll("rect")).to.have.length(0);
    expect(button.querySelector("path")).to.exist;
  });

  it("drives the native transport from the imperative play and pause methods", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="track.mp3"></fluid-audio>`);
    const { calls } = stubTransport(el);

    el.play();
    await elementUpdated(el);
    expect(calls.play).to.equal(1);
    expect(
      el.shadowRoot!.querySelector('[part="play-button"]')!.getAttribute("aria-label")
    ).to.equal("Pause");

    el.pause();
    await elementUpdated(el);
    expect(calls.pause).to.equal(1);
  });

  it("re-dispatches native play, pause and ended as fluid events", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="track.mp3"></fluid-audio>`);
    const audio = el.shadowRoot!.querySelector("audio")!;

    setTimeout(() => audio.dispatchEvent(new Event("play")));
    expect(await oneEvent(el, "fluid-play")).to.exist;

    setTimeout(() => audio.dispatchEvent(new Event("pause")));
    expect(await oneEvent(el, "fluid-pause")).to.exist;

    setTimeout(() => audio.dispatchEvent(new Event("play")));
    await oneEvent(el, "fluid-play");
    setTimeout(() => audio.dispatchEvent(new Event("ended")));
    expect(await oneEvent(el, "fluid-ended")).to.exist;

    await elementUpdated(el);
    // Reaching the end returns the control to its idle "play" affordance.
    expect(
      el.shadowRoot!.querySelector('[part="play-button"]')!.getAttribute("aria-label")
    ).to.equal("Play");
  });

  it("seeks the native element and reports the position from the scrubber", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="track.mp3"></fluid-audio>`);
    const audio = el.shadowRoot!.querySelector("audio")!;
    Object.defineProperty(audio, "duration", { configurable: true, value: 90 });
    Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: 0 });
    audio.dispatchEvent(new Event("loadedmetadata"));
    await elementUpdated(el);

    const scrubber = el.shadowRoot!.querySelector<HTMLInputElement>('[part="scrubber"]')!;
    expect(scrubber.max).to.equal("90");

    scrubber.value = "42";
    scrubber.dispatchEvent(new Event("input"));
    expect(audio.currentTime).to.equal(42);

    audio.dispatchEvent(new Event("timeupdate"));
    await elementUpdated(el);
    expect(timeLabel(el)).to.equal("0:42 / 1:30");
    expect(scrubber.getAttribute("aria-valuetext")).to.equal("0:42 of 1:30");
  });

  it("shows a zero total for streams that report no finite duration", async () => {
    const el = await fixture<FluidAudio>(html`<fluid-audio src="live.mp3"></fluid-audio>`);
    const audio = el.shadowRoot!.querySelector("audio")!;
    // A live stream reports Infinity; the label must stay readable, not "NaN:NaN".
    Object.defineProperty(audio, "duration", { configurable: true, value: Infinity });
    audio.dispatchEvent(new Event("loadedmetadata"));
    await elementUpdated(el);
    expect(timeLabel(el)).to.equal("0:00 / 0:00");
  });

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidAudio>(html`
      <div
        style="--fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-accent-base:#4f46e5; --fluid-border-default:#e4e4e7;"
      >
        <fluid-audio label="Sample"></fluid-audio>
      </div>
    `);
    await expect(el.querySelector("fluid-audio")!).to.be.accessible();
  });
});
