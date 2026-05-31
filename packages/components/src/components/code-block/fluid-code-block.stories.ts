import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/CodeBlock",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  }
};

export default meta;
type Story = StoryObj;

const CSS_SAMPLE = `:root {
  --fluid-color-brand-500: #3b82f6;
  --fluid-radius-md: 0.375rem;
  --fluid-font-family-sans: ui-sans-serif, system-ui;
}`;

const TS_SAMPLE = `import { FluidButton } from "@fluid-ds/components";
import "@fluid-ds/components/define/button";

const button = document.querySelector("fluid-button");
button.addEventListener("fluid-click", () => console.log("clicked"));`;

export const CSS: Story = {
  render: () => html`<fluid-code-block code=${CSS_SAMPLE} language="css"></fluid-code-block>`
};

export const TypeScript: Story = {
  render: () => html`<fluid-code-block code=${TS_SAMPLE} language="ts"></fluid-code-block>`
};

export const WithFilename: Story = {
  render: () =>
    html`<fluid-code-block filename="theme.css" code=${CSS_SAMPLE}></fluid-code-block>`
};

export const NoCopy: Story = {
  render: () => html`
    <fluid-code-block no-copy code="quick and quiet code"></fluid-code-block>
  `
};
