import { elementUpdated, expect, fixture, html } from "@open-wc/testing";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/ar";
import "./components/animated-image/define.js";
import "./components/audio/define.js";
import "./components/video/define.js";
import "./components/video-playlist/define.js";
import "./components/lightbox/define.js";
import "./components/zoomable-frame/define.js";
import type { FluidAnimatedImage } from "./components/animated-image/fluid-animated-image.js";
import type { FluidAudio } from "./components/audio/fluid-audio.js";
import type { FluidVideo } from "./components/video/fluid-video.js";
import type { FluidVideoPlaylist } from "./components/video-playlist/fluid-video-playlist.js";
import type { FluidLightbox } from "./components/lightbox/fluid-lightbox.js";
import type { FluidZoomableFrame } from "./components/zoomable-frame/fluid-zoomable-frame.js";

describe("media owned-string localization", () => {
  it("updates animated-image controls when inherited language changes", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="en"><fluid-animated-image alt="Caller alt"></fluid-animated-image></div>
    `);
    const el = root.querySelector<FluidAnimatedImage>("fluid-animated-image")!;
    const label = () => el.shadowRoot!.querySelector("button")!.getAttribute("aria-label");
    expect(label()).to.equal("Pause animation");
    expect(el.shadowRoot!.querySelector("img")!.alt).to.equal("Caller alt");

    root.lang = "nl";
    await elementUpdated(el);
    expect(label()).to.equal("Animatie pauzeren");
    el.paused = true;
    await elementUpdated(el);
    expect(label()).to.equal("Animatie afspelen");
  });

  it("localizes audio defaults and display numbers while preserving an empty group label", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-audio label=""></fluid-audio></div>
    `);
    const el = root.querySelector<FluidAudio>("fluid-audio")!;
    const audio = el.shadowRoot!.querySelector("audio")!;
    Object.defineProperty(audio, "duration", { configurable: true, value: 65 });
    Object.defineProperty(audio, "currentTime", { configurable: true, writable: true, value: 5 });
    audio.dispatchEvent(new Event("loadedmetadata"));
    audio.dispatchEvent(new Event("timeupdate"));
    await elementUpdated(el);
    const format = (value: number, minimumIntegerDigits = 1) =>
      new Intl.NumberFormat("ar", { useGrouping: false, minimumIntegerDigits }).format(value);

    expect(el.shadowRoot!.querySelector('[role="group"]')!.getAttribute("aria-label")).to.equal("");
    expect(
      el.shadowRoot!.querySelector('[part="play-button"]')!.getAttribute("aria-label")
    ).to.equal("تشغيل");
    expect(el.shadowRoot!.querySelector('[part="scrubber"]')!.getAttribute("aria-label")).to.equal(
      "موضع التشغيل"
    );
    expect(el.shadowRoot!.querySelector('[part="time"]')!.textContent).to.equal(
      `${format(0)}:${format(5, 2)} / ${format(1)}:${format(5, 2)}`
    );
    expect(el.shadowRoot!.querySelector<HTMLInputElement>('[part="scrubber"]')!.value).to.equal(
      "5"
    );
    root.lang = "nl";
    await elementUpdated(el);
    expect(
      el.shadowRoot!.querySelector('[part="play-button"]')!.getAttribute("aria-label")
    ).to.equal("Afspelen");
  });

  it("localizes the video default without replacing explicit empty labels", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="nl">
        <fluid-video></fluid-video>
        <fluid-video label=""></fluid-video>
      </div>
    `);
    const videos = root.querySelectorAll<FluidVideo>("fluid-video");
    expect(videos[0]!.shadowRoot!.querySelector("video")!.getAttribute("aria-label")).to.equal(
      "Video"
    );
    expect(videos[1]!.shadowRoot!.querySelector("video")!.getAttribute("aria-label")).to.equal("");
    root.lang = "ar";
    await elementUpdated(videos[0]!);
    expect(videos[0]!.shadowRoot!.querySelector("video")!.getAttribute("aria-label")).to.equal(
      "فيديو"
    );
  });

  it("localizes playlist defaults but preserves caller titles and empty titles", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-video-playlist></fluid-video-playlist></div>
    `);
    const el = root.querySelector<FluidVideoPlaylist>("fluid-video-playlist")!;
    el.entries = [
      { src: "one.mp4" },
      { src: "two.mp4", title: "Caller title" },
      { src: "three.mp4", title: "" }
    ];
    await elementUpdated(el);
    const list = el.shadowRoot!.querySelector('[part="list"]')!;
    const items = [...el.shadowRoot!.querySelectorAll("button")];
    expect(list.getAttribute("aria-label")).to.equal("قائمة التشغيل");
    expect(items.map((item) => item.textContent?.trim())).to.deep.equal([
      `المقطع ${new Intl.NumberFormat("ar", { useGrouping: false }).format(1)}`,
      "Caller title",
      ""
    ]);
    expect(el.shadowRoot!.querySelector("fluid-video")!.getAttribute("label")).to.equal("فيديو");
    root.lang = "nl";
    await elementUpdated(el);
    expect(list.getAttribute("aria-label")).to.equal("Afspeellijst");
  });

  it("localizes lightbox chrome and fallback alt while preserving authored empty alt", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="nl">
        <fluid-lightbox>
          <img src="one.png" />
          <img src="two.png" alt="" />
        </fluid-lightbox>
      </div>
    `);
    const el = root.querySelector<FluidLightbox>("fluid-lightbox")!;
    await elementUpdated(el);
    el.openAt(0);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("dialog")!.getAttribute("aria-label")).to.equal(
      "Afbeeldingsviewer"
    );
    expect(el.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')!.alt).to.equal(
      "Afbeelding 1 van 2"
    );
    expect(el.shadowRoot!.querySelector('[part="counter"]')!.textContent).to.equal("1 van 2");
    expect(el.shadowRoot!.querySelector('[part="prev"]')!.getAttribute("aria-label")).to.equal(
      "Vorige afbeelding"
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!.click();
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector<HTMLImageElement>('[part="image"]')!.alt).to.equal("");
    root.lang = "ar";
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector("dialog")!.getAttribute("aria-label")).to.equal(
      "عارض الصور"
    );
  });

  it("localizes zoom labels live without reversing physical pan operations", async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div lang="en"><fluid-zoomable-frame></fluid-zoomable-frame></div>
    `);
    const el = root.querySelector<FluidZoomableFrame>("fluid-zoomable-frame")!;
    el.panRightLabel = "";
    await elementUpdated(el);
    root.lang = "ar";
    await elementUpdated(el);
    const labels = [...el.shadowRoot!.querySelectorAll("button")].map((button) =>
      button.getAttribute("aria-label")
    );
    expect(labels).to.deep.equal([
      "تصغير",
      "إعادة ضبط التكبير",
      "تكبير",
      "تحريك إلى اليسار",
      "",
      "تحريك إلى الأعلى",
      "تحريك إلى الأسفل"
    ]);

    const content = el.shadowRoot!.querySelector<HTMLElement>(".content")!;
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")[3]!.click();
    expect(new DOMMatrixReadOnly(getComputedStyle(content).transform).m41).to.equal(-40);
  });
});
