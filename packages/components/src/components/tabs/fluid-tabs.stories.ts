import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTabs } from "./fluid-tabs.js";

type Args = Pick<FluidTabs, "value" | "activation">;

const meta: Meta<Args> = {
  title: "Components/Tabs",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    value: { control: "text" },
    activation: { control: "inline-radio", options: ["auto", "manual"] }
  },
  args: { value: "overview", activation: "auto" },
  render: (args) => html`
    <fluid-tabs .value=${args.value} activation=${args.activation}>
      <fluid-tab slot="nav" panel="overview">Overview</fluid-tab>
      <fluid-tab slot="nav" panel="usage">Usage</fluid-tab>
      <fluid-tab slot="nav" panel="api">API</fluid-tab>
      <fluid-tab slot="nav" panel="changelog" disabled>Changelog</fluid-tab>
      <fluid-tab-panel name="overview">
        <p>The overview describes what this component does at a glance.</p>
      </fluid-tab-panel>
      <fluid-tab-panel name="usage">
        <p>How to use it. Try keyboard navigation (Arrow keys, Home, End).</p>
      </fluid-tab-panel>
      <fluid-tab-panel name="api">
        <p>API reference for properties, events, slots, and parts.</p>
      </fluid-tab-panel>
      <fluid-tab-panel name="changelog">
        <p>Not yet.</p>
      </fluid-tab-panel>
    </fluid-tabs>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Manual: Story = {
  args: { activation: "manual" }
};
