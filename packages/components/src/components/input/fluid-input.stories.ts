import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/register-defaults";
import "./define.js";
import "../icon/define.js";
import type { FluidInput } from "./fluid-input.js";

type Args = Pick<
  FluidInput,
  "type" | "size" | "placeholder" | "value" | "disabled" | "readonly" | "required"
> & { label: string };

const meta: Meta<Args> = {
  title: "Components/Forms/Input",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "number", "email", "password", "search", "tel", "url"]
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    placeholder: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    type: "text",
    size: "md",
    placeholder: "Enter text…",
    value: "",
    disabled: false,
    readonly: false,
    required: false,
    label: "Field"
  },
  render: (args) => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2); max-width: 320px;">
      <label style="font-size: var(--fluid-font-size-sm); color: var(--fluid-text-secondary);"
        >${args.label}</label
      >
      <fluid-input
        type=${args.type}
        size=${args.size}
        placeholder=${args.placeholder}
        .value=${args.value}
        ?disabled=${args.disabled}
        ?readonly=${args.readonly}
        ?required=${args.required}
        aria-label=${args.label}
      ></fluid-input>
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
      <fluid-input size="sm" placeholder="Small" aria-label="Small input"></fluid-input>
      <fluid-input size="md" placeholder="Medium" aria-label="Medium input"></fluid-input>
      <fluid-input size="lg" placeholder="Large" aria-label="Large input"></fluid-input>
    </div>
  `
};

export const WithPrefixSuffix: Story = {
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
    >
      <fluid-input placeholder="Search…" aria-label="Search">
        <fluid-icon slot="prefix" name="search"></fluid-icon>
      </fluid-input>
      <fluid-input
        type="email"
        placeholder="your@email.com"
        aria-label="Email"
      >
        <span slot="prefix">@</span>
      </fluid-input>
      <fluid-input value="100" type="number" aria-label="Amount">
        <span slot="suffix">EUR</span>
      </fluid-input>
    </div>
  `
};

export const States: Story = {
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
    >
      <fluid-input placeholder="Default" aria-label="Default"></fluid-input>
      <fluid-input value="With value" aria-label="Filled"></fluid-input>
      <fluid-input disabled value="Disabled" aria-label="Disabled"></fluid-input>
      <fluid-input readonly value="Read-only" aria-label="Read-only"></fluid-input>
      <fluid-input required placeholder="Required (empty)" aria-label="Required"></fluid-input>
    </div>
  `
};

export const InAForm: Story = {
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert(JSON.stringify(Object.fromEntries(data.entries()), null, 2));
      }}
    >
      <fluid-input name="username" placeholder="Username" required aria-label="Username">
      </fluid-input>
      <fluid-input
        name="password"
        type="password"
        placeholder="Password"
        required
        aria-label="Password"
      >
      </fluid-input>
      <button type="submit">Submit</button>
    </form>
  `
};
