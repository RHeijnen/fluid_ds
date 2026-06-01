import type { Meta, StoryObj } from "@storybook/web-components";
import { html, type TemplateResult } from "lit";
import "./define.js";
import type { FluidTourStep } from "./fluid-tour.js";

const steps: FluidTourStep[] = [
  {
    target: "#tour-search",
    title: "Search everything",
    body: "Type here to jump to any project, person, or setting. Try a name.",
    placement: "bottom-start"
  },
  {
    target: "#tour-new",
    title: "Create in one click",
    body: "This button starts a brand-new project from your last template.",
    placement: "bottom"
  },
  {
    target: "#tour-profile",
    title: "Your account",
    body: "Billing, theme, and sign-out all live behind your avatar.",
    placement: "left"
  }
];

/**
 * A demo toolbar plus a fluid-tour. The "Start tour" button opens the tour;
 * Back / Next / Done / Skip and the arrow keys drive it.
 */
const demoLayout = (extra: TemplateResult | string = "") => html`
  <div
    style="display:flex; align-items:center; gap:1rem; padding:1rem; border:1px solid var(--fluid-border-default); border-radius:0.75rem;"
  >
    <input
      id="tour-search"
      placeholder="Search..."
      style="flex:1; padding:0.5rem 0.75rem; border:1px solid var(--fluid-border-default); border-radius:0.5rem;"
    />
    <button id="tour-new" style="padding:0.5rem 1rem;">New project</button>
    <button id="tour-profile" aria-label="Account" style="width:2.5rem; height:2.5rem; border-radius:999px;">
      RH
    </button>
  </div>
  ${extra}
`;

const meta: Meta = {
  title: "Components/Feedback/Tour",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    ${demoLayout(html`
      <p style="margin-top:1rem;">
        <button
          @click=${() => {
            const tour = document.querySelector<HTMLElement & { show(): void }>("#demo-tour");
            tour?.show();
          }}
          style="padding:0.5rem 1rem;"
        >
          Start tour
        </button>
      </p>
    `)}
    <fluid-tour id="demo-tour" .steps=${steps}></fluid-tour>
  `
};

export const OpenOnLoad: Story = {
  render: () => html`
    ${demoLayout()}
    <fluid-tour open .steps=${steps}></fluid-tour>
  `
};

export const StartOnLastStep: Story = {
  render: () => html`
    ${demoLayout()}
    <fluid-tour open index="2" .steps=${steps}></fluid-tour>
  `
};
