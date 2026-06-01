import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTransfer, FluidTransferItem } from "./fluid-transfer.js";

type Args = Pick<
  FluidTransfer,
  "sourceLabel" | "targetLabel" | "disabled"
> & { items: FluidTransferItem[]; value: string[] };

const sampleItems: FluidTransferItem[] = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "angular", label: "Angular" },
  { id: "svelte", label: "Svelte" },
  { id: "solid", label: "Solid" },
  { id: "qwik", label: "Qwik", disabled: true }
];

const meta: Meta<Args> = {
  title: "Components/Forms/Transfer",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    sourceLabel: { control: "text" },
    targetLabel: { control: "text" },
    disabled: { control: "boolean" }
  },
  args: {
    sourceLabel: "Available",
    targetLabel: "Selected",
    disabled: false,
    items: sampleItems,
    value: ["vue"]
  },
  render: (args) => html`
    <fluid-transfer
      source-label=${args.sourceLabel}
      target-label=${args.targetLabel}
      ?disabled=${args.disabled}
      .items=${args.items}
      .value=${args.value}
    ></fluid-transfer>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: [] }
};

export const WithDisabledItem: Story = {
  args: { value: ["react"] }
};

export const Disabled: Story = {
  args: { disabled: true, value: ["react", "vue"] }
};

export const CustomLabels: Story = {
  args: {
    sourceLabel: "All permissions",
    targetLabel: "Granted",
    items: [
      { id: "read", label: "Read" },
      { id: "write", label: "Write" },
      { id: "delete", label: "Delete" },
      { id: "admin", label: "Administer" }
    ],
    value: ["read"]
  }
};
