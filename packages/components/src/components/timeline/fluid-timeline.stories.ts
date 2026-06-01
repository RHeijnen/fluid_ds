import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../icon/define.js";

const meta: Meta = {
  title: "Components/Content/Timeline",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-timeline aria-label="Order history">
      <fluid-timeline-item>
        <span slot="time">09:24</span>
        <strong>Order placed</strong>
      </fluid-timeline-item>
      <fluid-timeline-item>
        <span slot="time">10:02</span>
        <strong>Payment confirmed</strong>
      </fluid-timeline-item>
      <fluid-timeline-item>
        <span slot="time">14:51</span>
        <strong>Shipped</strong>
      </fluid-timeline-item>
    </fluid-timeline>
  `
};

export const WithContent: Story = {
  name: "With rich content",
  render: () => html`
    <fluid-timeline aria-label="Project activity">
      <fluid-timeline-item>
        <span slot="time">Mon, 9:24 AM</span>
        <strong>Repository created</strong>
        <span>Initialized the monorepo and added the first package.</span>
      </fluid-timeline-item>
      <fluid-timeline-item>
        <span slot="time">Tue, 2:10 PM</span>
        <strong>First component merged</strong>
        <span>The button landed with full theming and tests.</span>
      </fluid-timeline-item>
      <fluid-timeline-item>
        <span slot="time">Wed, 4:45 PM</span>
        <strong>Docs site published</strong>
        <span>Component pages are now live for the whole team.</span>
      </fluid-timeline-item>
    </fluid-timeline>
  `
};

export const Tones: Story = {
  render: () => html`
    <fluid-timeline aria-label="Deployment log">
      <fluid-timeline-item tone="info">
        <span slot="time">Step 1</span>
        <strong>Build started</strong>
      </fluid-timeline-item>
      <fluid-timeline-item tone="success">
        <span slot="time">Step 2</span>
        <strong>Tests passed</strong>
      </fluid-timeline-item>
      <fluid-timeline-item tone="warning">
        <span slot="time">Step 3</span>
        <strong>Slow response detected</strong>
      </fluid-timeline-item>
      <fluid-timeline-item tone="danger">
        <span slot="time">Step 4</span>
        <strong>Rollout halted</strong>
      </fluid-timeline-item>
    </fluid-timeline>
  `
};

export const WithIcons: Story = {
  name: "With marker icons",
  render: () => html`
    <fluid-timeline aria-label="Account activity">
      <fluid-timeline-item tone="success">
        <fluid-icon slot="icon" name="check"></fluid-icon>
        <span slot="time">Just now</span>
        <strong>Profile verified</strong>
      </fluid-timeline-item>
      <fluid-timeline-item tone="info">
        <fluid-icon slot="icon" name="user"></fluid-icon>
        <span slot="time">Yesterday</span>
        <strong>Account created</strong>
      </fluid-timeline-item>
    </fluid-timeline>
  `
};

export const NoTime: Story = {
  name: "Without time stamps",
  render: () => html`
    <fluid-timeline aria-label="Steps">
      <fluid-timeline-item><strong>Clone the repository</strong></fluid-timeline-item>
      <fluid-timeline-item><strong>Install dependencies</strong></fluid-timeline-item>
      <fluid-timeline-item><strong>Run the build</strong></fluid-timeline-item>
    </fluid-timeline>
  `
};
