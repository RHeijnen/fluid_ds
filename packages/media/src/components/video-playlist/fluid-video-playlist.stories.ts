import type { Meta, StoryObj } from "@storybook/web-components";
import "./define.js";
import type { PlaylistEntry } from "./fluid-video-playlist.js";

// Locally generated clips (see apps/playground/public/media/generate-sample-clips.mjs).
// An empty src can never load, which hides real playback and source-switching bugs.
const ENTRIES: PlaylistEntry[] = [
  { src: "/media/sample-clip-1.webm", title: "Chapter 1: Setup" },
  { src: "/media/sample-clip-2.webm", title: "Chapter 2: Theming" }
];

const meta: Meta = {
  title: "Media/Video Playlist",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  render: () => {
    const el = document.createElement("fluid-video-playlist");
    (el as HTMLElement & { entries: PlaylistEntry[] }).entries = ENTRIES;
    return el;
  }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Looping: Story = {
  render: () => {
    const el = document.createElement("fluid-video-playlist");
    Object.assign(el as HTMLElement & { entries: PlaylistEntry[]; loop: boolean }, {
      entries: ENTRIES,
      loop: true
    });
    return el;
  }
};
