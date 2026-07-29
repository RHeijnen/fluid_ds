import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidVideo } from "./fluid-video.js";

describe("<fluid-video>", () => {
  it("forwards src + poster + preload to the inner video element", async () => {
    const el = await fixture<FluidVideo>(
      html`<fluid-video src="clip.mp4" poster="poster.jpg" preload="auto"></fluid-video>`
    );
    const video = el.shadowRoot!.querySelector("video")!;
    expect(video.getAttribute("src")).to.equal("clip.mp4");
    expect(video.getAttribute("poster")).to.equal("poster.jpg");
    expect(video.getAttribute("preload")).to.equal("auto");
  });

  it("forwards the boolean attributes to the inner video element", async () => {
    const el = await fixture<FluidVideo>(
      html`<fluid-video autoplay loop muted plays-inline></fluid-video>`
    );
    const video = el.shadowRoot!.querySelector("video")!;
    expect(video.autoplay).to.be.true;
    expect(video.loop).to.be.true;
    expect(video.muted).to.be.true;
    expect(video.playsInline).to.be.true;
  });

  it("renders native controls by default and can opt out", async () => {
    const withControls = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    expect(withControls.shadowRoot!.querySelector("video")!.controls).to.be.true;

    const without = await fixture<FluidVideo>(html`<fluid-video .controls=${false}></fluid-video>`);
    expect(without.shadowRoot!.querySelector("video")!.controls).to.be.false;
  });

  it("re-dispatches fluid-play when the inner video plays", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    const video = el.shadowRoot!.querySelector("video")!;
    setTimeout(() => video.dispatchEvent(new Event("play")));
    const ev = await oneEvent(el, "fluid-play");
    expect(ev).to.exist;
    expect((ev as CustomEvent).bubbles).to.be.true;
    expect((ev as CustomEvent).composed).to.be.true;
  });

  it("re-dispatches fluid-pause when the inner video pauses", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    const video = el.shadowRoot!.querySelector("video")!;
    setTimeout(() => video.dispatchEvent(new Event("pause")));
    const ev = await oneEvent(el, "fluid-pause");
    expect(ev).to.exist;
  });

  it("re-dispatches fluid-ended when the inner video ends", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    const video = el.shadowRoot!.querySelector("video")!;
    setTimeout(() => video.dispatchEvent(new Event("ended")));
    const ev = await oneEvent(el, "fluid-ended");
    expect(ev).to.exist;
  });

  it("exposes the underlying native element via nativeElement", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    expect(el.nativeElement).to.equal(el.shadowRoot!.querySelector("video"));
  });

  it("delegates play/pause/load to the native element", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    const video = el.shadowRoot!.querySelector("video")!;
    let played = false;
    let paused = false;
    let loaded = false;
    video.play = () => {
      played = true;
      return Promise.resolve();
    };
    video.pause = () => {
      paused = true;
    };
    video.load = () => {
      loaded = true;
    };
    el.play();
    el.pause();
    el.load();
    expect(played).to.be.true;
    expect(paused).to.be.true;
    expect(loaded).to.be.true;
  });
});
