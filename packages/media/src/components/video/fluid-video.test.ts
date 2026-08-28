import { expect, fixture, html, oneEvent, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidVideo } from "./fluid-video.js";

describe("<fluid-video>", () => {
  it("passes an a11y audit when the media control is named", async () => {
    const el = await fixture<FluidVideo>(html`
      <fluid-video label="Product demonstration"></fluid-video>
    `);
    expect(el.shadowRoot!.querySelector("video")!.getAttribute("aria-label")).to.equal(
      "Product demonstration"
    );
    await expect(el).to.be.accessible();
  });

  it("forwards src + poster + preload to the inner video element", async () => {
    const el = await fixture<FluidVideo>(
      html`<fluid-video src="clip.mp4" poster="poster.jpg" preload="auto"></fluid-video>`
    );
    const video = el.shadowRoot!.querySelector("video")!;
    expect(video.getAttribute("src")).to.equal("clip.mp4");
    expect(video.getAttribute("poster")).to.equal("poster.jpg");
    expect(video.getAttribute("preload")).to.equal("auto");
  });

  it("omits empty media URLs instead of loading the current document as media", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video src="" poster=""></fluid-video>`);
    const video = el.shadowRoot!.querySelector("video")!;
    expect(video.hasAttribute("src")).to.be.false;
    expect(video.hasAttribute("poster")).to.be.false;
  });

  it("forwards boolean settings and matches native playsinline reflection", async () => {
    const el = await fixture<FluidVideo>(
      html`<fluid-video autoplay loop muted plays-inline></fluid-video>`
    );
    const video = el.shadowRoot!.querySelector("video")!;
    expect(video.autoplay).to.be.true;
    expect(video.loop).to.be.true;
    expect(video.muted).to.be.true;
    expect(video.hasAttribute("playsinline")).to.be.true;
    // The attribute is portable; Firefox does not expose the corresponding IDL
    // property. Compare with native reflection without inventing that support.
    const native = document.createElement("video");
    native.setAttribute("playsinline", "");
    expect(video.playsInline).to.equal(native.playsInline);
    el.autoplay = false;
    el.loop = false;
    el.muted = false;
    el.playsInline = false;
    await elementUpdated(el);
    expect(video.autoplay).to.be.false;
    expect(video.loop).to.be.false;
    expect(video.muted).to.be.false;
    expect(video.hasAttribute("playsinline")).to.be.false;
    native.removeAttribute("playsinline");
    expect(video.playsInline).to.equal(native.playsInline);
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

  it("preserves a rejected native play promise for consumers to handle", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    const error = new DOMException("Playback denied", "NotAllowedError");
    el.nativeElement!.play = () => Promise.reject(error);
    let caught: unknown;
    try {
      await el.play();
    } catch (reason) {
      caught = reason;
    }
    expect(caught).to.equal(error);
  });

  it("pauses native playback when disconnected", async () => {
    const el = await fixture<FluidVideo>(html`<fluid-video></fluid-video>`);
    let pauses = 0;
    el.nativeElement!.pause = () => pauses++;
    el.remove();
    expect(pauses).to.equal(1);
  });

  it("mirrors source and caption children into native media while preserving consumer nodes", async () => {
    const el = await fixture<FluidVideo>(html`
      <fluid-video preload="none">
        <source src="a.webm" type="video/webm" />
        <track kind="captions" src="a.vtt" srclang="en" label="English" />
      </fluid-video>
    `);
    const source = el.querySelector("source")!;
    const native = el.nativeElement!;
    expect(native.querySelector("source")!.getAttribute("src")).to.equal("a.webm");
    expect(native.querySelector("track")!.getAttribute("srclang")).to.equal("en");
    expect(source.parentElement).to.equal(el);
    source.setAttribute("src", "b.webm");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(native.querySelector("source")!.getAttribute("src")).to.equal("b.webm");
    const parent = el.parentElement!;
    el.remove();
    source.setAttribute("src", "c.webm");
    parent.append(el);
    expect(native.querySelector("source")!.getAttribute("src")).to.equal("c.webm");
    expect(native.querySelectorAll("source").length).to.equal(1);
  });
});
