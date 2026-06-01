import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import type { FluidToast } from "./fluid-toast.js";

const meta: Meta = {
  title: "Components/Feedback/Toast",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

const launchToast = (e: Event, variant: "neutral" | "info" | "success" | "warning" | "danger") => {
  const stack = (e.target as HTMLElement)
    .closest("[data-story]")
    ?.querySelector<FluidToast>("fluid-toast");
  stack?.toast({
    message: `${variant[0]!.toUpperCase()}${variant.slice(1)} toast at ${new Date().toLocaleTimeString()}`,
    variant
  });
};

export const Default: Story = {
  render: () => html`
    <div data-story style="position: relative; min-height: 12rem;">
      <div style="display:flex; gap: var(--fluid-space-2); flex-wrap: wrap;">
        ${(["neutral", "info", "success", "warning", "danger"] as const).map(
          (v) => html`
            <fluid-button @click=${(e: Event) => launchToast(e, v)}>${v}</fluid-button>
          `
        )}
      </div>
      <fluid-toast placement="top-end"></fluid-toast>
    </div>
  `
};

export const AllPlacements: Story = {
  render: () => html`
    <div data-story style="position: relative; min-height: 16rem;">
      <div style="display:flex; flex-wrap: wrap; gap: var(--fluid-space-2);">
        ${(["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end"] as const).map(
          (p) => html`
            <fluid-button
              @click=${(e: Event) =>
                (e.target as HTMLElement)
                  .closest("[data-story]")!
                  .querySelector<FluidToast>(`fluid-toast[placement="${p}"]`)!
                  .toast({ message: `At ${p}`, variant: "info" })}
            >
              ${p}
            </fluid-button>
          `
        )}
      </div>
      ${(["top-start", "top", "top-end", "bottom-start", "bottom", "bottom-end"] as const).map(
        (p) => html`<fluid-toast placement=${p}></fluid-toast>`
      )}
    </div>
  `
};
