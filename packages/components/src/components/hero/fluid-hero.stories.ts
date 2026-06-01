import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../badge/define.js";

const meta: Meta = {
  title: "Components/Layout/Hero",
  component: "fluid-hero",
  tags: ["autodocs"],
  argTypes: {
    align: {
      control: { type: "inline-radio" },
      options: ["start", "center"],
      description: "Horizontal alignment of the content column.",
    },
    mediaPosition: {
      control: { type: "inline-radio" },
      options: ["end", "start", "background"],
      description: "Where the media sits relative to the content.",
    },
    size: {
      control: { type: "inline-radio" },
      options: ["sm", "md", "lg"],
      description: "Overall scale (heading size + padding feel).",
    },
  },
  args: { align: "start", mediaPosition: "end", size: "md" },
};
export default meta;

type Story = StoryObj;

const media = html`
  <img
    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900"
    alt="Abstract gradient artwork"
  />
`;

export const Default: Story = {
  render: (args) => html`
    <fluid-hero align=${args.align} media-position=${args.mediaPosition} size=${args.size}>
      <span slot="eyebrow">New in 0.1</span>
      <h1>Build interfaces that flow</h1>
      <p slot="description">
        A framework-agnostic design system of accessible web components. Drop the tags into any
        stack and theme with a single CSS variable.
      </p>
      <div slot="actions">
        <fluid-button variant="primary">Get started</fluid-button>
        <fluid-button variant="ghost">View on GitHub</fluid-button>
      </div>
      <div slot="media">${media}</div>
    </fluid-hero>
  `,
};

export const Centered: Story = {
  args: { align: "center", mediaPosition: "background" },
  render: (args) => html`
    <fluid-hero align=${args.align} media-position=${args.mediaPosition} size=${args.size}>
      <span slot="eyebrow">WCAG 2.2 AA</span>
      <h1>Accessible by default</h1>
      <p slot="description">
        Every component ships keyboard support, visible focus, and verified contrast across three
        brands in light and dark.
      </p>
      <div slot="actions">
        <fluid-button variant="primary">Read the docs</fluid-button>
      </div>
      <div slot="media">${media}</div>
    </fluid-hero>
  `,
};

export const TextOnly: Story = {
  render: () => html`
    <fluid-hero align="center">
      <h1>No media, no problem</h1>
      <p slot="description">Empty regions collapse, so a text-only hero stays tight.</p>
      <div slot="actions">
        <fluid-button variant="primary">Primary action</fluid-button>
        <fluid-button variant="ghost">Secondary</fluid-button>
      </div>
    </fluid-hero>
  `,
};

export const MediaStart: Story = {
  args: { mediaPosition: "start" },
  render: (args) => html`
    <fluid-hero media-position=${args.mediaPosition} size=${args.size}>
      <span slot="eyebrow">Layout</span>
      <h1>Media on the left</h1>
      <p slot="description">Set <code>media-position="start"</code> to lead with the visual.</p>
      <div slot="actions"><fluid-button variant="primary">Try it</fluid-button></div>
      <div slot="media">${media}</div>
    </fluid-hero>
  `,
};
