import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidColorPicker } from "./fluid-color-picker.js";

type Args = Pick<
  FluidColorPicker,
  "value" | "disabled" | "required" | "palette" | "colorizeBorder"
>;

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
    status: { type: "stable" }
  },
  argTypes: {
    value: { control: "color" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    colorizeBorder: { control: "boolean" },
    palette: {
      control: "object",
      description: "Optional list of color swatches; omit or use an empty array to hide them."
    }
  },
  args: {
    value: "#3b82f6",
    disabled: false,
    required: false,
    colorizeBorder: false,
    palette: []
  },
  render: (args) => html`
    <fluid-color-picker
      style="max-width:320px;"
      .value=${args.value}
      .palette=${args.palette}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?colorize-border=${args.colorizeBorder}
      aria-label="Accent color"
    ></fluid-color-picker>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const ColorizedBorder: Story = {
  args: { colorizeBorder: true }
};

export const WithPalette: Story = {
  args: { palette: BRAND_PRESETS }
};

export const WithDescription: Story = {
  render: (args) => html`
    <fluid-field
      style="max-width:320px;"
      label="Accent color"
      description="Enter a hex value, choose the swatch, or select a preset."
    >
      <fluid-color-picker
        .value=${args.value}
        .palette=${args.palette}
        ?disabled=${args.disabled}
        ?required=${args.required}
        ?colorize-border=${args.colorizeBorder}
        aria-label="Accent color"
      ></fluid-color-picker>
    </fluid-field>
  `
};

export const InAForm: Story = {
  render: () => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Accent color"
        description="Choose the accent used throughout the interface."
        required
      >
        <fluid-color-picker
          name="accent"
          required
          .palette=${BRAND_PRESETS}
          aria-label="Accent color"
        ></fluid-color-picker>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Submit</fluid-button>
    </form>
  `
};
