import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/components/define/icon";
import { rainbowIllustrationGroups, registerRainbowIllustrations } from "./illustrations.js";

registerRainbowIllustrations();

const meta: Meta = {
  title: "Rainbow/Illustrations",
  parameters: { status: { type: "beta" } }
};

export default meta;
type Story = StoryObj;

const label = (group: string) => group.charAt(0).toUpperCase() + group.slice(1);
const caption = "font: 12px sans-serif; color: var(--fluid-text-secondary, #555)";

const figure = (name: string, size: string) => html`
  <figure style="display: grid; justify-items: center; gap: 0.35rem; margin: 0">
    <fluid-icon name=${name} style=${size}></fluid-icon>
    <figcaption style=${caption}>${name.replace("rainbow-", "")}</figcaption>
  </figure>
`;

const section = (group: string, names: readonly string[]) => {
  const spots = group === "spots";
  return html`
    <section style="display: grid; gap: 0.75rem">
      <h3 style="margin: 0; font: 600 14px sans-serif">${label(group)} (${names.length})</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem">
        ${names.map((name) =>
          figure(name, spots ? "width: 240px; height: 180px" : "--fluid-icon-size: 64px")
        )}
      </div>
    </section>
  `;
};

/**
 * The whole set, grouped: 64×64 app tiles by subject, then the wide spot
 * illustrations for empty states and results. Registered from
 * `@fluid-ds/rainbow/illustrations/register`.
 */
export const Gallery: Story = {
  render: () => html`
    <div style="display: grid; gap: 2rem">
      ${Object.entries(rainbowIllustrationGroups).map(([group, names]) => section(group, names))}
    </div>
  `
};

/** The app tiles at the sizes they ship at most, to check they stay readable when small. */
export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; gap: 1rem">
      ${[32, 48, 96].map(
        (size) => html`
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            ${Object.entries(rainbowIllustrationGroups)
              .filter(([group]) => group !== "spots")
              .flatMap(([, names]) => names)
              .map(
                (name) =>
                  html`<fluid-icon name=${name} style="--fluid-icon-size: ${size}px"></fluid-icon>`
              )}
          </div>
        `
      )}
    </div>
  `
};

/** Spot illustrations for empty states, errors and celebrations. */
export const Spots: Story = {
  render: () => section("spots", rainbowIllustrationGroups.spots ?? [])
};
