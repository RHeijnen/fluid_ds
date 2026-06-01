import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Navigation/Accordion",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-accordion>
      <fluid-details open>
        <span slot="summary">What is Fluid?</span>
        <p>
          A framework-agnostic design system built on web components. Drop it into React, Vue,
          Svelte, or plain HTML.
        </p>
      </fluid-details>
      <fluid-details>
        <span slot="summary">How do I theme it?</span>
        <p>Override CSS custom properties. See the Theming guide.</p>
      </fluid-details>
      <fluid-details>
        <span slot="summary">Is it framework-specific?</span>
        <p>No. It uses the Web Components standard, so it works anywhere.</p>
      </fluid-details>
    </fluid-accordion>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Single: Story = {
  render: () => html`
    <fluid-accordion single>
      <fluid-details open>
        <span slot="summary">Step 1: Install</span>
        <p>npm install @fluid-ds/components</p>
      </fluid-details>
      <fluid-details>
        <span slot="summary">Step 2: Import tokens</span>
        <p>Add the base + light/dark CSS files to your app.</p>
      </fluid-details>
      <fluid-details>
        <span slot="summary">Step 3: Use components</span>
        <p>Use them anywhere as <code>&lt;fluid-*&gt;</code> tags.</p>
      </fluid-details>
    </fluid-accordion>
  `
};

export const Disabled: Story = {
  render: () => html`
    <fluid-details disabled>
      <span slot="summary">Disabled (cannot open)</span>
      <p>Hidden content.</p>
    </fluid-details>
  `
};
