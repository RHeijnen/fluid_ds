import type { Meta, StoryObj } from "@storybook/web-components";
import "./define.js";
import type { PlaylistEntry } from "./fluid-video-playlist.js";

const ENTRIES: PlaylistEntry[] = [
  { src: "", title: "Big Buck Bunny" },
  { src: "", title: "Bear" }
];

const meta: Meta = {
  title: "Media/Video Playlist",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
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
