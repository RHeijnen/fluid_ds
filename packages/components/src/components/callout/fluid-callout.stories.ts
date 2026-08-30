import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidCallout } from "./fluid-callout.js";

type Args = Pick<FluidCallout, "variant" | "dismissible"> & {
  header: string;
  body: string;
};

const meta: Meta<Args> = {
  title: "Components/Feedback/Callout",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "danger"]
    },
    dismissible: { control: "boolean" }
  },
  args: {
    variant: "info",
    dismissible: false,
    header: "Heads up",
    body: "This is an informational message you should probably read."
  },
  render: (args) => html`
    <fluid-callout variant=${args.variant} ?dismissible=${args.dismissible}>
      <span slot="header">${args.header}</span>
      ${args.body}
    </fluid-callout>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <fluid-callout>
        <span slot="header">Neutral</span>
        Default styling, no specific intent.
      </fluid-callout>
      <fluid-callout variant="info">
        <span slot="header">Info</span>
        Helpful information you might want to know.
      </fluid-callout>
      <fluid-callout variant="success">
        <span slot="header">Success</span>
        Your changes were saved.
      </fluid-callout>
      <fluid-callout variant="warning">
        <span slot="header">Warning</span>
        This action cannot be undone.
      </fluid-callout>
      <fluid-callout variant="danger">
        <span slot="header">Error</span>
        Something went wrong. Please try again.
      </fluid-callout>
    </div>
  `
};

export const Dismissible: Story = {
  args: { dismissible: true }
};

/** Prose with inline links must flow as one paragraph, links do not get their
 *  own lines. Regression story for the slot-in-flex blockification bug. */
export const InlineLinks: Story = {
  render: () => html`
    <fluid-callout variant="info">
      <span slot="header">Theming is the whole point</span>
      Change a brand variable and everything reflows. The
      <a href="#theming">theming guide</a> has the full model, and the
      <a href="#builder">theme builder</a> lets you design a brand right in the browser.
    </fluid-callout>
  `
};

/** No header slotted: the body must sit flush, with no phantom gap row. */
export const BodyOnly: Story = {
  render: () => html`
    <fluid-callout variant="success">Saved. Your changes are live.</fluid-callout>
  `
};
