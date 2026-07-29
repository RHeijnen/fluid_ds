import { expect, fixture, html, elementUpdated } from "@open-wc/testing";
import "./define.js";
import type { FluidVideoPlaylist, PlaylistEntry } from "./fluid-video-playlist.js";

const ENTRIES: PlaylistEntry[] = [
  { src: "a.mp4", title: "One" },
  { src: "b.mp4", title: "Two" },
  { src: "c.mp4", title: "Three" }
];

async function makePlaylist(
  props: Partial<Pick<FluidVideoPlaylist, "autoAdvance" | "loop">> = {}
): Promise<FluidVideoPlaylist> {
  const el = await fixture<FluidVideoPlaylist>(html`<fluid-video-playlist></fluid-video-playlist>`);
  el.entries = ENTRIES;
  if (props.autoAdvance !== undefined) el.autoAdvance = props.autoAdvance;
  if (props.loop !== undefined) el.loop = props.loop;
  await elementUpdated(el);
  return el;
}

function endCurrentClip(el: FluidVideoPlaylist): void {
  const video = el.shadowRoot!.querySelector("fluid-video")!;
  video.dispatchEvent(new CustomEvent("fluid-ended"));
}

describe("<fluid-video-playlist>", () => {
  it("auto-advances to the next entry when the current clip ends", async () => {
    const el = await makePlaylist();
    endCurrentClip(el);
    await elementUpdated(el);
    const active = el.shadowRoot!.querySelector('[aria-pressed="true"]')!;
    expect(active.textContent!.trim()).to.equal("Two");
  });

  it("does not advance past the end when loop is off", async () => {
    const el = await makePlaylist();
    el.goTo(2);
    await elementUpdated(el);
    endCurrentClip(el);
    await elementUpdated(el);
    const active = el.shadowRoot!.querySelector('[aria-pressed="true"]')!;
    expect(active.textContent!.trim()).to.equal("Three");
  });

  it("wraps back to the first entry when loop is on", async () => {
    const el = await makePlaylist({ loop: true });
    el.goTo(2);
    await elementUpdated(el);
    endCurrentClip(el);
    await elementUpdated(el);
    const active = el.shadowRoot!.querySelector('[aria-pressed="true"]')!;
    expect(active.textContent!.trim()).to.equal("One");
  });

  it("does not auto-advance when autoAdvance is false", async () => {
    const el = await makePlaylist({ autoAdvance: false });
    endCurrentClip(el);
    await elementUpdated(el);
    const active = el.shadowRoot!.querySelector('[aria-pressed="true"]')!;
    expect(active.textContent!.trim()).to.equal("One");
  });

  it("clamps goTo to valid bounds", async () => {
    const el = await makePlaylist();
    el.goTo(-1);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal(
      "One"
    );
    el.goTo(99);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal(
      "One"
    );
  });

  it("does NOT emit fluid-change on initial mount", async () => {
    const el = await fixture<FluidVideoPlaylist>(html`<fluid-video-playlist></fluid-video-playlist>`);
    let fired = false;
    el.addEventListener("fluid-change", () => (fired = true));
    el.entries = ENTRIES;
    await elementUpdated(el);
    // setting an unrelated property must not emit either
    el.loop = true;
    await elementUpdated(el);
    expect(fired).to.be.false;
  });

  it("emits fluid-change only when the active index changes", async () => {
    const el = await makePlaylist();
    const seen: number[] = [];
    el.addEventListener("fluid-change", (e) => seen.push((e as CustomEvent).detail.index));
    el.goTo(1);
    await elementUpdated(el);
    el.goTo(2);
    await elementUpdated(el);
    expect(seen).to.deep.equal([1, 2]);
  });

  it("removes the fluid-ended listener on disconnect (no advance after removal)", async () => {
    const el = await makePlaylist();
    const video = el.shadowRoot!.querySelector("fluid-video")!;
    el.remove();
    await elementUpdated(el);
    video.dispatchEvent(new CustomEvent("fluid-ended"));
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal(
      "One"
    );
  });

  it("uses a labelled group with aria-pressed buttons, not a listbox", async () => {
    const el = await makePlaylist();
    const list = el.shadowRoot!.querySelector('[part="list"]')!;
    expect(list.getAttribute("role")).to.equal("group");
    expect(list.getAttribute("aria-label")).to.equal("Playlist");
    expect(el.shadowRoot!.querySelector('[role="listbox"]')).to.be.null;
    expect(el.shadowRoot!.querySelector('[role="option"]')).to.be.null;
    const items = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="item"]');
    expect(items.length).to.equal(3);
    items.forEach((item) => {
      expect(item.tagName).to.equal("BUTTON");
      expect(item.hasAttribute("aria-pressed")).to.be.true;
      expect(item.hasAttribute("aria-current")).to.be.false;
    });
  });
});
