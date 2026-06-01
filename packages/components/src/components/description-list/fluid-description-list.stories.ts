import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidDescriptionList } from "./fluid-description-list.js";

type Args = Pick<FluidDescriptionList, "columns" | "divider">;

const meta: Meta<Args> = {
  title: "Components/Content/Description list",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    columns: { control: { type: "number", min: 1, max: 4 } },
    divider: { control: "boolean" }
  },
  args: { columns: 1, divider: false },
  render: (args) => html`
    <fluid-description-list
      columns=${args.columns}
      ?divider=${args.divider}
      aria-label="Account details"
      style="max-width: 32rem;"
    >
      <fluid-description-item>
        <span slot="term">Name</span>
        Ada Lovelace
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Email</span>
        ada@example.com
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Role</span>
        Administrator
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Member since</span>
        March 2021
      </fluid-description-item>
    </fluid-description-list>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDivider: Story = {
  name: "With dividers",
  args: { divider: true }
};

export const TwoColumns: Story = {
  name: "Two columns",
  render: () => html`
    <fluid-description-list columns="2" aria-label="Order summary" style="max-width: 44rem;">
      <fluid-description-item>
        <span slot="term">Order number</span>
        #10482
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Status</span>
        Shipped
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Placed</span>
        12 May 2024
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Total</span>
        $128.00
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Payment</span>
        Visa ending 4242
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Carrier</span>
        Express courier
      </fluid-description-item>
    </fluid-description-list>
  `
};

export const ColumnsWithDivider: Story = {
  name: "Two columns with dividers",
  render: () => html`
    <fluid-description-list
      columns="2"
      divider
      aria-label="Specifications"
      style="max-width: 44rem;"
    >
      <fluid-description-item>
        <span slot="term">Display</span>
        13.3-inch Retina
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Processor</span>
        8-core CPU
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Memory</span>
        16 GB unified
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Storage</span>
        512 GB SSD
      </fluid-description-item>
    </fluid-description-list>
  `
};

export const RichDetail: Story = {
  name: "Rich detail content",
  render: () => html`
    <fluid-description-list divider aria-label="Profile" style="max-width: 32rem;">
      <fluid-description-item>
        <span slot="term">Bio</span>
        <span>
          Mathematician and writer, known for early work on Charles Babbage's
          proposed mechanical general-purpose computer.
        </span>
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Website</span>
        <a href="https://example.com">example.com</a>
      </fluid-description-item>
      <fluid-description-item>
        <span slot="term">Tags</span>
        <span>analysis, computing, history</span>
      </fluid-description-item>
    </fluid-description-list>
  `
};
