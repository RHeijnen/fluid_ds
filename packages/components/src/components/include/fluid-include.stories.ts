import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Content/Include",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

// In a real app, src would be a path to a static fragment. The stories use a
// data: URL so they're self-contained and don't depend on the dev server.
const dataFragment = (markup: string) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(markup)}`;

export const Default: Story = {
  render: () => html`
    <fluid-include
      src=${dataFragment(`
        <article style="padding: 1rem; background: #eef; border-radius: 8px;">
          <h3>Included fragment</h3>
          <p>This markup was fetched and rendered by <code>&lt;fluid-include&gt;</code>.</p>
        </article>
      `)}
    >
      <div>Loading…</div>
    </fluid-include>
  `
};

export const ErrorState: Story = {
  render: () => html`
    <fluid-include src="https://this-host-definitely-does-not-exist.invalid/fragment.html">
      <div style="color: var(--fluid-color-danger);">Fallback shown when the include fails.</div>
    </fluid-include>
  `
};
