import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidImage } from "./fluid-image.js";

type Args = Pick<
  FluidImage,
  "src" | "alt" | "width" | "height" | "aspectRatio" | "loading" | "fit" | "placeholder" | "fallback"
>;

const sample = "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=640&q=80";
const broken = "https://example.com/this-image-does-not-exist.jpg";

const meta: Meta<Args> = {
  title: "Components/Content/Image",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    src: { control: "text" },
    alt: { control: "text" },
    width: { control: "text" },
    height: { control: "text" },
    aspectRatio: { control: "text" },
    loading: { control: "inline-radio", options: ["lazy", "eager"] },
    fit: { control: "inline-radio", options: ["cover", "contain"] },
    placeholder: { control: "color" },
    fallback: { control: "text" }
  },
  args: {
    src: sample,
    alt: "A scenic mountain landscape",
    width: "320",
    aspectRatio: "16/9",
    loading: "lazy",
    fit: "cover",
    placeholder: "#e4e4e7"
  },
  render: (args) => html`
    <fluid-image
      src=${args.src}
      alt=${args.alt}
      width=${args.width ?? ""}
      height=${args.height ?? ""}
      aspect-ratio=${args.aspectRatio ?? ""}
      loading=${args.loading}
      fit=${args.fit}
      placeholder=${args.placeholder ?? ""}
      fallback=${args.fallback ?? ""}
    ></fluid-image>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const AspectRatio: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:flex-start;">
      <fluid-image
        src=${sample}
        alt="Landscape, 16 by 9"
        width="240"
        aspect-ratio="16/9"
      ></fluid-image>
      <fluid-image
        src=${sample}
        alt="Square crop"
        width="160"
        aspect-ratio="1/1"
      ></fluid-image>
    </div>
  `
};

export const Fit: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:flex-start;">
      <fluid-image src=${sample} alt="Cover fit" width="200" height="200" fit="cover"></fluid-image>
      <fluid-image src=${sample} alt="Contain fit" width="200" height="200" fit="contain"></fluid-image>
    </div>
  `
};

export const Placeholder: Story = {
  render: () => html`
    <fluid-image
      src=${sample}
      alt="Loads over a tinted placeholder"
      width="320"
      aspect-ratio="16/9"
      placeholder="#c7d2fe"
    ></fluid-image>
  `
};

export const Decorative: Story = {
  render: () => html`
    <fluid-image src=${sample} alt="" width="320" aspect-ratio="16/9"></fluid-image>
  `
};

export const ErrorWithFallback: Story = {
  render: () => html`
    <fluid-image
      src=${broken}
      fallback=${sample}
      alt="Falls back to a working image"
      width="320"
      aspect-ratio="16/9"
    ></fluid-image>
  `
};

export const ErrorSlot: Story = {
  render: () => html`
    <fluid-image
      src=${broken}
      alt="Could not load"
      width="320"
      aspect-ratio="16/9"
    >
      <span slot="fallback">Image unavailable</span>
    </fluid-image>
  `
};
