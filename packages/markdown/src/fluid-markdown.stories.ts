import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const SAMPLE = `# Markdown

Some **strong** copy with a [link](https://fluid.example.com) and inline \`code\`.

> A blockquote that adopts your brand tokens.

\`\`\`ts
const fluid = "design system";
\`\`\`

| Feature | Status |
| ------- | ------ |
| Themable | yes |
| Sanitized | yes |
`;

const meta: Meta = {
  title: "Expansion/Markdown",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    value: { control: "text" },
    trusted: { control: "boolean" }
  },
  render: (args) => html`
    <fluid-markdown
      value=${args.value ?? SAMPLE}
      ?trusted=${args.trusted ?? false}
    ></fluid-markdown>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const FromValue: Story = {
  args: { value: "### Rendered from the `value` property\n\nWith **bold** copy." }
};

/**
 * Untrusted HTML is sanitized by default: `on*` handlers, `javascript:` URLs,
 * and script/iframe/style/object/embed/link/meta elements are stripped before
 * the output is inserted.
 */
export const Sanitized: Story = {
  args: {
    value:
      'Safe by default: `<img onerror>` and `javascript:` links are removed.\n\n<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onerror="alert(1)"> <a href="javascript:alert(1)">blocked link</a>'
  }
};
