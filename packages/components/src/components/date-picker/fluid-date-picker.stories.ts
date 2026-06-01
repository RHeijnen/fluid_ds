import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Forms/Date Picker",
  component: "fluid-date-picker",
  argTypes: {
    value: { control: "text" },
    format: { control: "select", options: ["short", "medium", "long", "numeric", "iso"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    min: { control: "text" },
    max: { control: "text" },
    disabled: { control: "boolean" }
  }
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: { value: "2026-06-15", format: "medium", size: "md" },
  render: (a) =>
    html`<fluid-date-picker
      .value=${a.value}
      format=${a.format}
      size=${a.size}
      ?disabled=${a.disabled}
      min=${a.min ?? ""}
      max=${a.max ?? ""}
    ></fluid-date-picker>`
};

export const Empty: Story = {
  render: () => html`<fluid-date-picker placeholder="Pick a date…"></fluid-date-picker>`
};

export const WithMinMax: Story = {
  render: () => html`<fluid-date-picker value="2026-06-15" min="2026-06-10" max="2026-06-25"></fluid-date-picker>`
};

export const Formats: Story = {
  render: () => html`
    <div style="display:flex; flex-wrap:wrap; gap:1rem;">
      <fluid-date-picker value="2026-06-15" format="short"></fluid-date-picker>
      <fluid-date-picker value="2026-06-15" format="medium"></fluid-date-picker>
      <fluid-date-picker value="2026-06-15" format="long"></fluid-date-picker>
      <fluid-date-picker value="2026-06-15" format="iso"></fluid-date-picker>
    </div>`
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; align-items:center; gap:1rem;">
      <fluid-date-picker value="2026-06-15" size="sm"></fluid-date-picker>
      <fluid-date-picker value="2026-06-15" size="md"></fluid-date-picker>
      <fluid-date-picker value="2026-06-15" size="lg"></fluid-date-picker>
    </div>`
};

export const InAForm: Story = {
  render: () => html`
    <form @submit=${(e: Event) => { e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); alert(`due = ${fd.get("due")}`); }}>
      <label style="display:flex; flex-direction:column; gap:0.35rem; max-width:18rem;">
        Due date
        <fluid-date-picker name="due" value="2026-06-15" required></fluid-date-picker>
      </label>
      <fluid-button type="submit" style="margin-top:0.75rem;">Submit</fluid-button>
    </form>`
};
