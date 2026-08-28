import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { html } from "lit";
import "../../../packages/media/src/components/video/define.js";
import "../../../packages/media/src/components/video-playlist/define.js";
import "../../../packages/media/src/components/zoomable-frame/define.js";
import type { FluidVideo } from "../../../packages/media/src/components/video/fluid-video.js";
import type { FluidVideoPlaylist } from "../../../packages/media/src/components/video-playlist/fluid-video-playlist.js";
import type { FluidZoomableFrame } from "../../../packages/media/src/components/zoomable-frame/fluid-zoomable-frame.js";

const meta: Meta = {
  title: "Quality/Media interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

const clip = "/media/contract-video.webm";
const entries = [
  { src: `${clip}?introduction`, title: "Introduction" },
  { src: `${clip}?configuration`, title: "Configuration" },
  { src: `${clip}?summary`, title: "Summary" }
];

function videoFromButton(event: Event): FluidVideo {
  return (event.currentTarget as HTMLElement)
    .closest("section")!
    .querySelector<FluidVideo>("fluid-video")!;
}

const renderVideo = () => html`
  <section aria-label="Offline video contract" style="max-width: 400px">
    <fluid-video src=${clip} label="Fluid generated test clip" muted plays-inline></fluid-video>
    <button type="button" @click=${(event: Event) => videoFromButton(event).play()}>
      Play clip
    </button>
    <button type="button" @click=${(event: Event) => videoFromButton(event).pause()}>
      Pause clip
    </button>
    <button type="button" @click=${(event: Event) => videoFromButton(event).load()}>
      Reload clip
    </button>
  </section>
`;

const renderPlaylist = () => html`
  <fluid-video-playlist .entries=${entries} .autoAdvance=${false}></fluid-video-playlist>
`;

const renderZoom = () => html`
  <button type="button">Before zoom</button>
  <fluid-zoomable-frame min-scale="0.5" max-scale="1.5" style="width:400px;height:250px">
    <svg role="img" aria-label="Diagram to inspect" viewBox="0 0 400 250" width="400" height="250">
      <rect width="400" height="250" fill="#dbeafe"></rect>
      <circle cx="200" cy="125" r="60" fill="#1e3a8a"></circle>
    </svg>
  </fluid-zoomable-frame>
  <button type="button">After zoom</button>
`;

export const VideoPlaybackContract: Story = {
  parameters: { quality: { componentTag: "fluid-video" } },
  render: renderVideo,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const player = canvasElement.querySelector<FluidVideo>("fluid-video")!;
    await player.updateComplete;
    const video = player.nativeElement!;
    const seen: string[] = [];
    const record = (event: Event) => {
      expect(event.target).toBe(player);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      seen.push(event.type);
    };
    for (const type of ["fluid-play", "fluid-pause", "fluid-ended"])
      player.addEventListener(type, record);
    try {
      await waitFor(() => expect(video.readyState).toBeGreaterThanOrEqual(2), { timeout: 5000 });
      await expect(video).toHaveAttribute("aria-label", "Fluid generated test clip");
      await userEvent.click(canvas.getByRole("button", { name: "Play clip" }));
      await waitFor(() => expect(video.currentTime).toBeGreaterThan(0));
      await userEvent.click(canvas.getByRole("button", { name: "Pause clip" }));
      await waitFor(() => expect(video.paused).toBe(true));
      await waitFor(() => expect(seen).toEqual(["fluid-play", "fluid-pause"]));
      await userEvent.click(canvas.getByRole("button", { name: "Reload clip" }));
      await waitFor(() => expect(video.currentTime).toBe(0));
      const play = canvas.getByRole("button", { name: "Play clip" });
      play.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(video.ended).toBe(true), { timeout: 5000 });
      await waitFor(() => expect(seen.filter((type) => type === "fluid-ended")).toHaveLength(1));
      await expect(seen.filter((type) => type === "fluid-play")).toHaveLength(2);
      await expect(video.error).toBeNull();
    } finally {
      for (const type of ["fluid-play", "fluid-pause", "fluid-ended"])
        player.removeEventListener(type, record);
      player.pause();
    }
  }
};

export const PlaylistSelectionContract: Story = {
  parameters: { quality: { componentTag: "fluid-video-playlist" } },
  render: renderPlaylist,
  play: async ({ canvasElement }) => {
    const playlist = canvasElement.querySelector<FluidVideoPlaylist>("fluid-video-playlist")!;
    await playlist.updateComplete;
    const root = within(playlist.shadowRoot! as unknown as HTMLElement);
    const player = playlist.shadowRoot!.querySelector<FluidVideo>("fluid-video")!;
    await player.updateComplete;
    const changes: number[] = [];
    const record = (event: Event) => {
      const change = event as CustomEvent;
      expect(change.bubbles).toBe(true);
      expect(change.composed).toBe(true);
      expect(change.detail.entry).toBe(entries[change.detail.index]);
      changes.push(change.detail.index);
    };
    playlist.addEventListener("fluid-change", record);
    try {
      const second = root.getByRole("button", { name: "Configuration" });
      second.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(second).toHaveAttribute("aria-pressed", "true"));
      await expect(player.nativeElement!).toHaveAttribute("aria-label", "Configuration");
      await userEvent.click(root.getByRole("button", { name: "Summary" }));
      await waitFor(() => expect(changes).toEqual([1, 2]));
      for (const index of [-1, 3, 0.5, NaN]) playlist.goTo(index);
      await playlist.updateComplete;
      await expect(changes).toEqual([1, 2]);
      const parent = playlist.parentElement!;
      playlist.remove();
      parent.append(playlist);
      playlist.goTo(0);
      await playlist.updateComplete;
      await player.updateComplete;
      playlist.autoAdvance = true;
      await player.play();
      await waitFor(() => expect(second).toHaveAttribute("aria-pressed", "true"), {
        timeout: 5000
      });
      playlist.autoAdvance = false;
      await waitFor(() => expect(changes).toEqual([1, 2, 0, 1]));
      await expect(player.nativeElement!.error).toBeNull();
      await expect(playlist.shadowRoot!.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
    } finally {
      playlist.autoAdvance = false;
      playlist.removeEventListener("fluid-change", record);
      player.pause();
    }
  }
};

export const ZoomControlsContract: Story = {
  parameters: { quality: { componentTag: "fluid-zoomable-frame" } },
  render: renderZoom,
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<FluidZoomableFrame>("fluid-zoomable-frame")!;
    await frame.updateComplete;
    const root = within(frame.shadowRoot! as unknown as HTMLElement);
    const changes: number[] = [];
    const record = (event: Event) => {
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
      changes.push((event as CustomEvent).detail.scale);
    };
    frame.addEventListener("fluid-zoom", record);
    try {
      const zoomIn = root.getByRole("button", { name: "Zoom in" });
      await userEvent.click(zoomIn);
      await waitFor(() => expect(frame.scale).toBe(1.25));
      await expect(frame.shadowRoot!.activeElement).toBe(zoomIn);
      await expect(frame).not.toHaveAttribute("data-dragging");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(frame.scale).toBe(1.5));
      await userEvent.click(zoomIn);
      await frame.updateComplete;
      await expect(frame.scale).toBe(1.5);
      await userEvent.click(root.getByRole("button", { name: "Zoom out" }));
      await waitFor(() => expect(frame.scale).toBe(1.25));
      root.getByRole("button", { name: "Reset zoom" }).focus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(frame.scale).toBe(1));
      await expect(changes).toEqual([1.25, 1.5, 1.25, 1]);
      await expect(frame.shadowRoot!.querySelector<HTMLElement>(".content")!.style.transform).toBe(
        "translate(0px, 0px) scale(1)"
      );
      await userEvent.click(root.getByRole("button", { name: "Pan right" }));
      root.getByRole("button", { name: "Pan up" }).focus();
      await userEvent.keyboard("{Enter}");
      await expect(frame.shadowRoot!.querySelector<HTMLElement>(".content")!.style.transform).toBe(
        "translate(40px, -40px) scale(1)"
      );
      await userEvent.click(root.getByRole("button", { name: "Reset zoom" }));
      await expect(frame.shadowRoot!.querySelector<HTMLElement>(".content")!.style.transform).toBe(
        "translate(0px, 0px) scale(1)"
      );
    } finally {
      frame.removeEventListener("fluid-zoom", record);
    }
  }
};

// Native Playwright fixtures intentionally have no play function, so there is
// no concurrent Storybook interaction driving the same player or focus state.
export const NativeVideoFixture: Story = { tags: ["!interaction-contract"], render: renderVideo };
export const NativePlaylistFixture: Story = {
  tags: ["!interaction-contract"],
  render: renderPlaylist
};
export const NativeZoomFixture: Story = { tags: ["!interaction-contract"], render: renderZoom };
export const NativeSlottedVideoFixture: Story = {
  tags: ["!interaction-contract"],
  render: () => html`
    <fluid-video label="Slotted source and captions" muted plays-inline style="max-width:400px">
      <source src=${clip} type="video/webm" />
      <track
        kind="captions"
        src="/media/contract-captions.vtt"
        srclang="en"
        label="English"
        default
      />
    </fluid-video>
  `
};
