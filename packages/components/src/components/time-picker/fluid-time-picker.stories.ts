import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";

const meta: Meta = {
  title: "Components/Forms/Time picker",
  component: "fluid-time-picker",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    value: { control: "text" },
    format: { control: "inline-radio", options: ["12h", "24h"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    min: { control: "text" },
    max: { control: "text" },
    step: { control: "number" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    openOnInputClick: { control: "boolean" }
  }
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    value: "09:30",
    format: "24h",
    size: "md",
    step: 15,
    required: false,
    disabled: false,
    openOnInputClick: true
  },
  render: (a) =>
    html`<fluid-time-picker
      .value=${a.value}
      format=${a.format}
      size=${a.size}
      step=${a.step}
      ?required=${a.required}
      ?disabled=${a.disabled}
      ?open-on-input-click=${a.openOnInputClick}
      min=${a.min ?? "00:00"}
      max=${a.max ?? "23:59"}
    ></fluid-time-picker>`
};

export const Empty: Story = {
  render: () => html`<fluid-time-picker placeholder="Pick a time…"></fluid-time-picker>`
};

export const TwelveHour: Story = {
  render: () => html`<fluid-time-picker value="13:30" format="12h"></fluid-time-picker>`
};

export const Formats: Story = {
  render: () =>
    html` <div style="display:flex; flex-wrap:wrap; gap:1rem;">
      <fluid-time-picker value="13:30" format="24h"></fluid-time-picker>
      <fluid-time-picker value="13:30" format="12h"></fluid-time-picker>
    </div>`
};

export const Steps: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    html` <div style="display:flex; flex-wrap:wrap; gap:1rem;">
      ${[5, 10, 15, 30, 60].map(
        (step) => html`
          <div style="display:grid; gap:var(--fluid-space-1);">
            <strong style="font-size:var(--fluid-font-size-sm);">${step} minutes</strong>
            <fluid-time-picker
              value="09:00"
              min="09:00"
              max="12:00"
              .step=${step}
              open-on-input-click
            ></fluid-time-picker>
          </div>
        `
      )}
    </div>`
};

export const WithMinMax: Story = {
  render: () =>
    html`<fluid-time-picker value="10:00" min="09:00" max="17:00" step="30"></fluid-time-picker>`
};

export const Sizes: Story = {
  render: () =>
    html` <div style="display:flex; align-items:center; gap:1rem;">
      <fluid-time-picker value="09:30" size="sm"></fluid-time-picker>
      <fluid-time-picker value="09:30" size="md"></fluid-time-picker>
      <fluid-time-picker value="09:30" size="lg"></fluid-time-picker>
    </div>`
};

export const Disabled: Story = {
  render: () => html`<fluid-time-picker value="09:30" disabled></fluid-time-picker>`
};

export const InAForm: Story = {
  render: () =>
    html` <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        alert(`start = ${fd.get("start")}`);
      }}
    >
      <label style="display:flex; flex-direction:column; gap:0.35rem; max-width:18rem;">
        Start time
        <fluid-time-picker name="start" value="09:30" required></fluid-time-picker>
      </label>
      <fluid-button type="submit" style="margin-top:0.75rem;">Submit</fluid-button>
    </form>`
};
