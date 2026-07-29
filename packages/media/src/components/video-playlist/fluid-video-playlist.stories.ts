import type { Meta, StoryObj } from "@storybook/web-components";
import "./define.js";
import type { PlaylistEntry } from "./fluid-video-playlist.js";

const ENTRIES: PlaylistEntry[] = [
  { src: "https://www.w3schools.com/html/mov_bbb.mp4", title: "Big Buck Bunny" },
  { src: "https://www.w3schools.com/html/movie.mp4", title: "Bear" }
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
