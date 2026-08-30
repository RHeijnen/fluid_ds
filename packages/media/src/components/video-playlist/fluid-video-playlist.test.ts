import { expect, fixture, html, elementUpdated } from "@open-wc/testing";
import "./define.js";
import storyMeta from "./fluid-video-playlist.stories.js";
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

  it("does not autoplay on arrival, but does once an entry is chosen", async () => {
    const el = await fixture<FluidVideoPlaylist>(
      html`<fluid-video-playlist .entries=${ENTRIES}></fluid-video-playlist>`
    );
    const video = el.shadowRoot!.querySelector("fluid-video")!;

    /* A playlist that starts playing on mount makes any page carrying one begin
       moving on its own, and with auto-advance it then walks the whole list.
       Motion the viewer did not ask for is what WCAG 2.2.2 is about. */
    expect(video.hasAttribute("autoplay"), "must not autoplay on mount").to.be.false;

    el.goTo(1);
    await elementUpdated(el);
    expect(
      el.shadowRoot!.querySelector("fluid-video")!.hasAttribute("autoplay"),
      "a chosen entry should play"
    ).to.be.true;
  });

  it("keeps the entry list hugging its entries instead of stretching", async () => {
    const el = await fixture<FluidVideoPlaylist>(
      html`<fluid-video-playlist .entries=${ENTRIES}></fluid-video-playlist>`
    );
    await elementUpdated(el);
    const list = el.shadowRoot!.querySelector<HTMLElement>(".list")!;

    /* As a grid item the list stretched to the player's height, so a short
       playlist drew a tall bordered box with the entries huddled at the top and
       an empty region beneath them. */
    expect(getComputedStyle(list).alignSelf).to.equal("start");
    const items = [...el.shadowRoot!.querySelectorAll<HTMLElement>(".item")];
    const contentHeight = items.reduce((n, item) => n + item.getBoundingClientRect().height, 0);
    const slack = list.getBoundingClientRect().height - contentHeight;
    expect(
      slack,
      `the list has ${slack.toFixed(1)}px of dead space below its entries`
    ).to.be.at.most(4);
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
    const el = await fixture<FluidVideoPlaylist>(
      html`<fluid-video-playlist></fluid-video-playlist>`
    );
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
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal(
      "Two"
    );
  });

  it("rejects fractional and non-finite indexes without emitting change", async () => {
    const el = await makePlaylist();
    const seen: Event[] = [];
    el.addEventListener("fluid-change", (event) => seen.push(event));
    for (const index of [0.5, NaN, Infinity, -Infinity]) el.goTo(index);
    await elementUpdated(el);
    expect(seen).to.deep.equal([]);
    expect(el.shadowRoot!.querySelector('[aria-pressed="true"]')!.textContent!.trim()).to.equal(
      "One"
    );
  });

  it("ships demo entries that reach the native player, and switches them", async () => {
    // Regression guard. The demo fixtures used to carry sources the browser can
    // never fetch (empty strings in the story, a dead third-party bucket in the
    // playground). Both render as a black box with working controls and no
    // frame, because fluid-video drops an empty src and the native element
    // reports MEDIA_ERR_SRC_NOT_SUPPORTED for an unfetchable one.
    const renderStory = storyMeta.render as unknown as () => HTMLElement;
    const el = (await fixture(renderStory())) as FluidVideoPlaylist;
    await elementUpdated(el);
    const entries = el.entries;
    expect(entries.length).to.be.greaterThan(1);
    for (const entry of entries) {
      expect(entry.src, "demo entry src must not be empty").to.be.a("string").and.not.equal("");
      expect(entry.src.startsWith("/"), `${entry.src} must be a locally served asset`).to.be.true;
    }

    const player = el.shadowRoot!.querySelector("fluid-video")!;
    await elementUpdated(player);
    const native = player.shadowRoot!.querySelector("video")!;
    expect(native.getAttribute("src")).to.equal(entries[0]!.src);

    el.goTo(1);
    await elementUpdated(el);
    await elementUpdated(player);
    expect(native.getAttribute("src")).to.equal(entries[1]!.src);
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
