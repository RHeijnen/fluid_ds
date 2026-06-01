import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidSelect } from "./fluid-select.js";

type Args = Pick<FluidSelect, "value" | "size" | "placeholder" | "disabled" | "required">;

const meta: Meta<Args> = {
  title: "Components/Forms/Select",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    value: { control: "text" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    value: "",
    size: "md",
    placeholder: "Choose a country…",
    disabled: false,
    required: false
  },
  render: (args) => html`
    <div style="max-width: 320px;">
      <fluid-select
        .value=${args.value}
        size=${args.size}
        placeholder=${args.placeholder}
        ?disabled=${args.disabled}
        ?required=${args.required}
        aria-label="Country"
      >
        <fluid-option value="nl">Netherlands</fluid-option>
        <fluid-option value="be">Belgium</fluid-option>
        <fluid-option value="de">Germany</fluid-option>
        <fluid-option value="fr">France</fluid-option>
        <fluid-option value="es">Spain</fluid-option>
        <fluid-option value="it">Italy</fluid-option>
        <fluid-option value="uk">United Kingdom</fluid-option>
        <fluid-option value="us">United States</fluid-option>
      </fluid-select>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
    >
      <fluid-select size="sm" aria-label="Small" placeholder="Small">
        <fluid-option value="a">Apple</fluid-option>
        <fluid-option value="b">Banana</fluid-option>
      </fluid-select>
      <fluid-select size="md" aria-label="Medium" placeholder="Medium">
        <fluid-option value="a">Apple</fluid-option>
        <fluid-option value="b">Banana</fluid-option>
      </fluid-select>
      <fluid-select size="lg" aria-label="Large" placeholder="Large">
        <fluid-option value="a">Apple</fluid-option>
        <fluid-option value="b">Banana</fluid-option>
      </fluid-select>
    </div>
  `
};

export const WithDisabledOption: Story = {
  render: () => html`
    <fluid-select aria-label="Plan" style="max-width:320px;">
      <fluid-option value="free">Free</fluid-option>
      <fluid-option value="pro">Pro</fluid-option>
      <fluid-option value="enterprise" disabled>Enterprise (contact sales)</fluid-option>
    </fluid-select>
  `
};
