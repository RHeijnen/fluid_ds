import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidDropzone } from "./fluid-dropzone.js";

type Args = Pick<FluidDropzone, "accept" | "multiple" | "maxSize" | "disabled" | "label">;

const meta: Meta<Args> = {
  title: "Components/Forms/Dropzone",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    accept: { control: "text" },
    multiple: { control: "boolean" },
    maxSize: { control: "number" },
    disabled: { control: "boolean" },
    label: { control: "text" }
  },
  args: {
    accept: "",
    multiple: false,
    maxSize: 0,
    disabled: false,
    label: "Drag files here or click to browse"
  },
  render: (args) => html`
    <div style="max-width: 28rem;">
      <fluid-dropzone
        accept=${args.accept}
        ?multiple=${args.multiple}
        max-size=${args.maxSize}
        ?disabled=${args.disabled}
        label=${args.label}
      ></fluid-dropzone>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { multiple: true, label: "Drop one or more files" }
};

export const ImagesOnly: Story = {
  args: { accept: "image/*", multiple: true, label: "Drop images here" }
};

export const SizeLimited: Story = {
  args: { maxSize: 1024 * 1024, label: "Up to 1 MB per file" }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const CustomPrompt: Story = {
  render: () => html`
    <div style="max-width: 28rem;">
      <fluid-dropzone multiple accept="image/*">
        <strong>Upload your photos</strong><br />
        PNG or JPG, drag and drop or click
      </fluid-dropzone>
    </div>
  `
};
