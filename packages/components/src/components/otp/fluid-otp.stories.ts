import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidOtp } from "./fluid-otp.js";

type Args = Pick<FluidOtp, "length" | "value" | "type" | "mask" | "disabled" | "required">;

const meta: Meta<Args> = {
  title: "Components/Forms/OTP input",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    length: { control: { type: "number", min: 2, max: 10 } },
    value: { control: "text" },
    type: { control: "inline-radio", options: ["number", "text"] },
    mask: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    length: 6,
    value: "",
    type: "number",
    mask: false,
    disabled: false,
    required: false
  },
  render: (args) => html`
    <fluid-otp
      length=${args.length}
      value=${args.value}
      type=${args.type}
      ?mask=${args.mask}
      ?disabled=${args.disabled}
      ?required=${args.required}
    ></fluid-otp>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: { value: "1234" }
};

export const FourDigit: Story = {
  args: { length: 4 }
};

export const Alphanumeric: Story = {
  args: { type: "text", value: "AB" }
};

export const Masked: Story = {
  args: { mask: true, value: "1234" }
};

export const Disabled: Story = {
  args: { disabled: true, value: "1234" }
};

export const Required: Story = {
  args: { required: true }
};

export const Lengths: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4);">
      <fluid-otp length="4"></fluid-otp>
      <fluid-otp length="6"></fluid-otp>
      <fluid-otp length="8"></fluid-otp>
    </div>
  `
};
