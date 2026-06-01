import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidFileInput } from "./fluid-file-input.js";

type Args = Pick<FluidFileInput, "accept" | "multiple" | "disabled" | "required">;

const meta: Meta<Args> = {
  title: "Components/Forms/FileInput",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    accept: { control: "text" },
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: { accept: "", multiple: false, disabled: false, required: false },
  render: (args) => html`
    <fluid-file-input
      accept=${args.accept}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      ?required=${args.required}
      style="max-width: 420px;"
    ></fluid-file-input>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { multiple: true }
};

export const ImagesOnly: Story = {
  args: { accept: "image/*", multiple: true },
  render: (args) => html`
    <fluid-file-input
      accept=${args.accept}
      ?multiple=${args.multiple}
      style="max-width: 420px;"
    >
      <span slot="label">Drop images here</span>
      <span slot="hint">PNG, JPG, or WEBP up to 5 MB</span>
    </fluid-file-input>
  `
};
