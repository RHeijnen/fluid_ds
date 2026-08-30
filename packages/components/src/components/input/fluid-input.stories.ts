import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/register-defaults";
import "./define.js";
import "../icon/define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidInput } from "./fluid-input.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidInput,
  | "type"
  | "size"
  | "placeholder"
  | "value"
  | "disabled"
  | "readonly"
  | "required"
  | "label"
  | "helpText"
  | "autocomplete"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/Input",
  tags: ["autodocs"],
  parameters: {
    status: { type: "stable" }
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
    required: { control: "boolean" },
    label: { control: "text" },
    helpText: { control: "text" },
    autocomplete: { control: "text" }
  },
  args: {
    type: "text",
    size: "md",
    placeholder: "Enter text…",
    value: "",
    disabled: false,
    readonly: false,
    required: false,
    label: "",
    helpText: "",
    autocomplete: ""
  },
  render: (args) => renderInput(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { placeholder: "Ada Lovelace" },
  render: (args) => html`
    <fluid-field
      style="max-width: 320px;"
      label="Account name"
      description="Use the name shown on your company account."
    >
      ${renderInput(args, undefined, "Account name")}
    </fluid-field>
  `
};

export const WithLabelAndHelpText: Story = {
  args: {
    label: "Serial number",
    helpText: "Resolved against the active domain.",
    placeholder: "APO-100001"
  },
  render: (args) => renderInput(args, undefined, "Serial number")
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-input size="sm" placeholder="Small" aria-label="Small input"></fluid-input>
      <fluid-input size="md" placeholder="Medium" aria-label="Medium input"></fluid-input>
      <fluid-input size="lg" placeholder="Large" aria-label="Large input"></fluid-input>
    </div>
  `
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    value: "correct horse battery staple",
    autocomplete: "current-password"
  },
  parameters: {
    docs: {
      description: {
        story:
          "Password entry is a `fluid-input` type, not a separate component. Its built-in eye button reveals or conceals the value, while `autocomplete` identifies the field to password managers."
      }
    }
  },
  render: (args) => renderInput(args, undefined, "Password")
};

export const WithIconPrefix: Story = {
  args: { placeholder: "Search…", label: "Search" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `prefix` slot can contain an icon or short text. This example uses a search icon; the icon is decorative because the input already has an accessible name."
      }
    }
  },
  render: (args) =>
    renderInput(
      args,
      html`<fluid-icon slot="prefix" name="search" aria-hidden="true"></fluid-icon>`,
      "Search"
    )
};

export const WithTextSuffix: Story = {
  args: { value: "fluid-design", label: "Domain name" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `suffix` slot can contain short text or an icon. This example displays a fixed domain ending without changing the input's submitted value."
      }
    }
  },
  render: (args) => renderInput(args, html`<span slot="suffix">.com</span>`, "Domain name")
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-input placeholder="Default" aria-label="Default"></fluid-input>
      <fluid-input value="With value" aria-label="Filled"></fluid-input>
      <fluid-input disabled value="Disabled" aria-label="Disabled"></fluid-input>
      <fluid-input readonly value="Read-only" aria-label="Read-only"></fluid-input>
      <fluid-input required placeholder="Required (empty)" aria-label="Required"></fluid-input>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert(JSON.stringify(Object.fromEntries(data.entries()), null, 2));
      }}
    >
      <fluid-field label="Username" required>
        <fluid-input
          name="username"
          autocomplete="username"
          required
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-input>
      </fluid-field>
      <fluid-field label="Password" required>
        <fluid-input
          name="password"
          type="password"
          autocomplete="current-password"
          required
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-input>
      </fluid-field>
      <fluid-button style="align-self: flex-start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderInput(args: Args, slotted?: unknown, ariaLabel = "Field") {
  return html`
    <fluid-input
      style="max-width: 320px;"
      type=${args.type}
      size=${args.size}
      placeholder=${args.placeholder}
      .value=${args.value}
      label=${args.label}
      help-text=${args.helpText}
      autocomplete=${args.autocomplete}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      aria-label=${ariaLabel}
    >
      ${slotted}
    </fluid-input>
  `;
}

function showValidationError(event: Event): void {
  const input = event.currentTarget as FluidInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = input.validationMessage;
}

function clearValidationError(event: Event): void {
  const input = event.currentTarget as FluidInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
