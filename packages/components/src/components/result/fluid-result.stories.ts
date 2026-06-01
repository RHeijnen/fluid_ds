import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../icon/define.js";
import type { FluidResult } from "./fluid-result.js";

type Args = Pick<FluidResult, "status" | "title" | "subtitle">;

const meta: Meta<Args> = {
  title: "Components/Feedback/Result",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["success", "error", "info", "warning", "404"]
    },
    title: { control: "text" },
    subtitle: { control: "text" }
  },
  args: {
    status: "success",
    title: "Payment successful",
    subtitle: "Your order is confirmed. A receipt has been emailed to you."
  },
  render: (args) => html`
    <fluid-result
      status=${args.status}
      title=${args.title}
      subtitle=${args.subtitle}
    >
      <fluid-button slot="actions" variant="primary">View order</fluid-button>
      <fluid-button slot="actions" variant="secondary">Back home</fluid-button>
    </fluid-result>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Success: Story = {
  render: () => html`
    <fluid-result
      status="success"
      title="Payment successful"
      subtitle="Your order is confirmed. A receipt has been emailed to you."
    >
      <fluid-button slot="actions" variant="primary">View order</fluid-button>
      <fluid-button slot="actions" variant="secondary">Back home</fluid-button>
    </fluid-result>
  `
};

export const Error: Story = {
  render: () => html`
    <fluid-result
      status="error"
      title="Submission failed"
      subtitle="We couldn't process your request. Please try again."
    >
      <fluid-button slot="actions" variant="primary">Retry</fluid-button>
      <fluid-button slot="actions" variant="secondary">Contact support</fluid-button>
    </fluid-result>
  `
};

export const Info: Story = {
  render: () => html`
    <fluid-result
      status="info"
      title="Verification pending"
      subtitle="Your account is under review. This usually takes a few minutes."
    >
      <fluid-button slot="actions" variant="secondary">Refresh status</fluid-button>
    </fluid-result>
  `
};

export const Warning: Story = {
  render: () => html`
    <fluid-result
      status="warning"
      title="Subscription expiring"
      subtitle="Your plan ends in 3 days. Renew now to avoid losing access."
    >
      <fluid-button slot="actions" variant="primary">Renew plan</fluid-button>
    </fluid-result>
  `
};

export const NotFound: Story = {
  name: "404",
  render: () => html`
    <fluid-result
      status="404"
      title="Page not found"
      subtitle="The page you're looking for doesn't exist or has moved."
    >
      <fluid-button slot="actions" variant="primary">Go home</fluid-button>
    </fluid-result>
  `
};

export const CustomIcon: Story = {
  render: () => html`
    <fluid-result status="success" title="All set" subtitle="Everything is up to date.">
      <fluid-icon slot="icon" name="check"></fluid-icon>
    </fluid-result>
  `
};

export const TitleOnly: Story = {
  render: () =>
    html`<fluid-result status="info" title="Loading complete"></fluid-result>`
};
