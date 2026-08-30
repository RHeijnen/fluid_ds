import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidSlider } from "./fluid-slider.js";

type Args = Pick<FluidSlider, "value" | "min" | "max" | "step" | "disabled" | "showValue">;

const meta: Meta<Args> = {
  title: "Components/Forms/Slider",
  tags: ["autodocs"],
  parameters: {
    status: { type: "stable" }
  },
  argTypes: {
    value: { control: "text" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
    showValue: { control: "boolean" }
  },
  args: {
    value: "50",
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showValue: true
  },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-slider
        .value=${args.value}
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        ?disabled=${args.disabled}
        ?show-value=${args.showValue}
        aria-label="Demo slider"
      ></fluid-slider>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Spectrum: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4); max-width: 320px;">
      <fluid-slider value="20" show-value aria-label="Twenty"></fluid-slider>
      <fluid-slider value="50" show-value aria-label="Fifty"></fluid-slider>
      <fluid-slider value="85" show-value aria-label="Eighty-five"></fluid-slider>
    </div>
  `
};

export const NegativeRange: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <fluid-slider
      min="-50"
      max="50"
      step="5"
      value="0"
      show-value
      aria-label="Bias"
      style="max-width: 320px;"
    ></fluid-slider>
  `
};

export const WithDescription: Story = {
  args: { value: "65", showValue: true },
  render: (args) => html`
    <fluid-field
      label="Screen brightness"
      description="Adjust the display brightness to suit your environment."
      style="max-width:320px;"
    >
      <fluid-slider
        .value=${args.value}
        .min=${args.min}
        .max=${args.max}
        .step=${args.step}
        ?disabled=${args.disabled}
        ?show-value=${args.showValue}
        aria-label="Screen brightness"
      ></fluid-slider>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { value: "40", min: 0, max: 100, step: 5, showValue: true },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:360px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Notification volume"
        description="Set the volume used for alerts and reminders."
      >
        <fluid-slider
          name="notification-volume"
          .value=${args.value}
          .min=${args.min}
          .max=${args.max}
          .step=${args.step}
          ?disabled=${args.disabled}
          ?show-value=${args.showValue}
          aria-label="Notification volume"
        ></fluid-slider>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Save settings</fluid-button>
    </form>
  `
};
