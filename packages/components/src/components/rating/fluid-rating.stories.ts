import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
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

export const WithDescription: Story = {
  args: { value: 4 },
  render: (args) => html`
    <fluid-field
      label="Product quality"
      description="Rate the overall quality of the product you received."
    >
      <fluid-rating
        .value=${args.value}
        .max=${args.max}
        .precision=${args.precision}
        ?readonly=${args.readonly}
        ?disabled=${args.disabled}
        aria-label="Product quality"
      ></fluid-rating>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { value: 3, max: 5, precision: 1, readonly: false, disabled: false },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:380px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Overall experience"
        description="Your rating helps us improve future visits."
      >
        <fluid-rating
          name="overall-experience"
          .value=${args.value}
          .max=${args.max}
          .precision=${args.precision}
          ?readonly=${args.readonly}
          ?disabled=${args.disabled}
          aria-label="Overall experience"
        ></fluid-rating>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Submit feedback</fluid-button>
    </form>
  `
};
