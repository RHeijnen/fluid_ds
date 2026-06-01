import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidRating } from "./fluid-rating.js";

type Args = Pick<FluidRating, "value" | "max" | "precision" | "readonly" | "disabled">;

const meta: Meta<Args> = {
  title: "Components/Forms/Rating",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: "number" },
    max: { control: "number" },
    precision: { control: { type: "select" }, options: [0.5, 1] },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" }
  },
  args: { value: 3, max: 5, precision: 1, readonly: false, disabled: false },
  render: (args) => html`
    <fluid-rating
      .value=${args.value}
      .max=${args.max}
      .precision=${args.precision}
      ?readonly=${args.readonly}
      ?disabled=${args.disabled}
      aria-label="Rating"
    ></fluid-rating>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const HalfStars: Story = {
  args: { precision: 0.5, value: 3.5 }
};

export const ReadOnly: Story = {
  args: { readonly: true, value: 4 }
};

export const TenScale: Story = {
  args: { max: 10, value: 7 }
};
