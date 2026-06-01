import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidCopyButton } from "./fluid-copy-button.js";

type Args = Pick<FluidCopyButton, "value" | "disabled">;

const meta: Meta<Args> = {
  title: "Components/Content/CopyButton",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: "text" },
    disabled: { control: "boolean" }
  },
  args: { value: "Hello, clipboard!", disabled: false },
  render: (args) => html`
    <fluid-copy-button value=${args.value} ?disabled=${args.disabled}>
      Copy
    </fluid-copy-button>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const IconOnly: Story = {
  render: () => html`<fluid-copy-button value="hello"></fluid-copy-button>`
};

export const FromAnotherElement: Story = {
  render: () => html`
    <code id="my-code">npm install @fluid-ds/components</code>
    <fluid-copy-button from="my-code">Copy command</fluid-copy-button>
  `
};
