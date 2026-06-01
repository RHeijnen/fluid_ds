import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidColorPicker } from "./fluid-color-picker.js";

type Args = Pick<FluidColorPicker, "value" | "disabled" | "required" | "palette">;

const BRAND_PRESETS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#64748b",
  "#000000"
];

const meta: Meta<Args> = {
  title: "Components/Forms/ColorPicker",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    value: { control: "color" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    value: "#3b82f6",
    disabled: false,
    required: false,
    palette: []
  },
  render: (args) => html`
    <fluid-color-picker
      .value=${args.value}
      .palette=${args.palette}
      ?disabled=${args.disabled}
      ?required=${args.required}
      aria-label="Accent color"
    ></fluid-color-picker>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithPalette: Story = {
  args: { palette: BRAND_PRESETS }
};

export const InAForm: Story = {
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert(JSON.stringify(Object.fromEntries(data.entries()), null, 2));
      }}
    >
      <fluid-color-picker
        name="accent"
        .palette=${BRAND_PRESETS}
        aria-label="Accent color"
      ></fluid-color-picker>
      <button type="submit">Submit</button>
    </form>
  `
};
