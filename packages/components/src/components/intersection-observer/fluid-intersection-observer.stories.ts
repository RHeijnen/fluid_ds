import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Intersection observer",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <p>Scroll the box below, the target turns green when it enters the viewport.</p>
    <div
      style="height: 12rem; overflow: auto; border: 1px solid var(--fluid-border-default); padding: var(--fluid-space-3);"
    >
      <div style="height: 14rem;">(scroll down)</div>
      <fluid-intersection-observer
        threshold="0.5"
        @fluid-intersect=${(e: CustomEvent) => {
          const entries = e.detail.entries as IntersectionObserverEntry[];
          for (const entry of entries) {
            const el = entry.target as HTMLElement;
            el.style.background = entry.isIntersecting ? "#22c55e" : "var(--fluid-surface-muted)";
            el.textContent = entry.isIntersecting ? "Visible" : "Hidden";
          }
        }}
      >
        <div
          style="height: 4rem; display: flex; align-items: center; justify-content: center; background: var(--fluid-surface-muted); border-radius: var(--fluid-radius-md); color: white; font-weight: 600;"
        >
          Hidden
        </div>
      </fluid-intersection-observer>
      <div style="height: 14rem;"></div>
    </div>
  `
};
