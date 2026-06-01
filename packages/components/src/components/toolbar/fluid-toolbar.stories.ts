import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidToolbar } from "./fluid-toolbar.js";

type Args = Pick<FluidToolbar, "orientation">;

const meta: Meta<Args> = {
  title: "Components/Navigation/Toolbar",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] }
  },
  args: { orientation: "horizontal" },
  render: (args) => html`
    <fluid-toolbar orientation=${args.orientation} aria-label="Text formatting">
      <fluid-button variant="ghost">Bold</fluid-button>
      <fluid-button variant="ghost">Italic</fluid-button>
      <fluid-button variant="ghost">Underline</fluid-button>
    </fluid-toolbar>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Horizontal: Story = {
  render: () => html`
    <fluid-toolbar aria-label="Document actions">
      <fluid-button variant="ghost">Cut</fluid-button>
      <fluid-button variant="ghost">Copy</fluid-button>
      <fluid-button variant="ghost">Paste</fluid-button>
    </fluid-toolbar>
  `
};

export const Vertical: Story = {
  render: () => html`
    <fluid-toolbar orientation="vertical" aria-label="Canvas tools">
      <fluid-button variant="ghost">Select</fluid-button>
      <fluid-button variant="ghost">Pen</fluid-button>
      <fluid-button variant="ghost">Erase</fluid-button>
    </fluid-toolbar>
  `
};

export const WithDisabledControl: Story = {
  render: () => html`
    <fluid-toolbar aria-label="Edit history">
      <fluid-button variant="ghost">Undo</fluid-button>
      <fluid-button variant="ghost" disabled>Redo</fluid-button>
      <fluid-button variant="ghost">Clear</fluid-button>
    </fluid-toolbar>
  `
};

export const MixedControls: Story = {
  render: () => html`
    <fluid-toolbar aria-label="Playback">
      <fluid-button variant="ghost">Play</fluid-button>
      <fluid-button variant="ghost">Pause</fluid-button>
      <a href="#stop">Stop</a>
    </fluid-toolbar>
  `
};
