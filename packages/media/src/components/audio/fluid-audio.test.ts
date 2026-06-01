import { expect, fixture, html, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidAudio } from "./fluid-audio.js";

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

  it("passes the a11y audit", async () => {
    const el = await fixture<FluidAudio>(html`
      <div style="--fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-accent-base:#4f46e5; --fluid-border-default:#e4e4e7;">
        <fluid-audio label="Sample"></fluid-audio>
      </div>
    `);
    await expect(el.querySelector("fluid-audio")!).to.be.accessible();
  });
});
