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
  it("passes an a11y audit with titled playlist entries", async () => {
    const el = await fixture<FluidVideoPlaylist>(html`
      <fluid-video-playlist></fluid-video-playlist>
    `);
    // Keep the audit deterministic: no network or media decoder activity is
    // needed to verify the playlist's roles, names, and pressed states.
    el.entries = [
      { src: "", title: "Introduction" },
      { src: "", title: "Configuration" }
    ];
    await elementUpdated(el);
    await expect(el).to.be.accessible();
  });

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

  it("resumes auto-advance after reconnect without duplicate change events", async () => {
    const el = await makePlaylist();
    const parent = el.parentElement!;
    const seen: number[] = [];
    el.addEventListener("fluid-change", (event) => seen.push((event as CustomEvent).detail.index));
    el.remove();
    endCurrentClip(el);
    parent.append(el);
    endCurrentClip(el);
    await elementUpdated(el);
    expect(seen).to.deep.equal([1]);
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal("Two");
  });

  it("rejects fractional and non-finite indexes without emitting change", async () => {
    const el = await makePlaylist();
    const seen: Event[] = [];
    el.addEventListener("fluid-change", (event) => seen.push(event));
    for (const index of [0.5, NaN, Infinity, -Infinity]) el.goTo(index);
    await elementUpdated(el);
    expect(seen).to.deep.equal([]);
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal("One");
  });

  it("keeps selection and the player name valid when entries shrink", async () => {
    const el = await makePlaylist();
    el.goTo(2);
    await elementUpdated(el);
    el.entries = [ENTRIES[0]!];
    await elementUpdated(el);
    const player = el.shadowRoot!.querySelector("fluid-video")!;
    expect(player.getAttribute("label")).to.equal("One");
    expect(player.getAttribute("src")).to.equal("a.mp4");
    expect(el.shadowRoot!.querySelectorAll('[aria-pressed="true"]').length).to.equal(1);
  });
});
