import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/lucide/phone";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import "../icon/define.js";
import type { FluidMaskedInput } from "./fluid-masked-input.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidMaskedInput,
  | "mask"
  | "size"
  | "placeholder"
  | "value"
  | "disabled"
  | "readonly"
  | "required"
  | "autocomplete"
> & { label: string };

const meta: Meta<Args> = {
  title: "Components/Forms/Masked input",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    mask: { control: "text" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    placeholder: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    required: { control: "boolean" },
    autocomplete: { control: "text" },
    label: { control: "text" }
  },
  args: {
    mask: "(###) ###-####",
    size: "md",
    placeholder: "",
    value: "",
    disabled: false,
    readonly: false,
    required: false,
    autocomplete: "tel",
    label: "Phone number"
  },
  render: (args) => renderMaskedInput(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Masks: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-masked-input mask="(###) ###-####" aria-label="Phone"></fluid-masked-input>
      <fluid-masked-input mask="##/##/####" aria-label="Date"></fluid-masked-input>
      <fluid-masked-input mask="#### #### #### ####" aria-label="Card number"></fluid-masked-input>
      <fluid-masked-input mask="AA-####" aria-label="Postal code"></fluid-masked-input>
      <fluid-masked-input mask="***-***" aria-label="Alphanumeric code"></fluid-masked-input>
    </div>
  `
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-masked-input size="sm" mask="(###) ###-####" aria-label="Small"></fluid-masked-input>
      <fluid-masked-input size="md" mask="(###) ###-####" aria-label="Medium"></fluid-masked-input>
      <fluid-masked-input size="lg" mask="(###) ###-####" aria-label="Large"></fluid-masked-input>
    </div>
  `
};

export const WithIconPrefix: Story = {
  args: { label: "Phone number", mask: "(###) ###-####", autocomplete: "tel" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `prefix` slot accepts an icon or short text. Slotted content is presentation-only and is not included in the masked or submitted value."
      }
    }
  },
  render: (args) =>
    renderMaskedInput(
      args,
      html`<fluid-icon slot="prefix" name="phone" aria-hidden="true"></fluid-icon>`,
      "Phone number"
    )
};

export const WithTextSuffix: Story = {
  args: { label: "Postal code", mask: "#### AA", autocomplete: "postal-code" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `suffix` slot accepts short text or an icon. This country label remains separate from the postal code's masked and submitted value."
      }
    }
  },
  render: (args) => renderMaskedInput(args, html`<span slot="suffix">NL</span>`, "Postal code")
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-masked-input mask="(###) ###-####" aria-label="Default"></fluid-masked-input>
      <fluid-masked-input
        mask="(###) ###-####"
        .value=${"(555) 123-4567"}
        aria-label="Filled"
      ></fluid-masked-input>
      <fluid-masked-input
        mask="(###) ###-####"
        disabled
        .value=${"(555) 123-4567"}
        aria-label="Disabled"
      ></fluid-masked-input>
      <fluid-masked-input
        mask="(###) ###-####"
        readonly
        .value=${"(555) 123-4567"}
        aria-label="Read-only"
      ></fluid-masked-input>
      <fluid-masked-input
        mask="(###) ###-####"
        required
        aria-label="Required (empty)"
      ></fluid-masked-input>
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
      <fluid-field label="Phone number" required>
        <fluid-masked-input
          name="phone"
          mask="(###) ###-####"
          autocomplete="tel"
          required
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-masked-input>
      </fluid-field>
      <fluid-field label="Card expiry" description="Use MM/YY." required>
        <fluid-masked-input
          name="expiry"
          mask="##/##"
          autocomplete="cc-exp"
          required
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-masked-input>
      </fluid-field>
      <fluid-button style="align-self: flex-start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderMaskedInput(args: Args, slotted?: unknown, ariaLabel = "Phone number") {
  return html`
    <fluid-masked-input
      style="max-width: 320px;"
      mask=${args.mask}
      size=${args.size}
      placeholder=${args.placeholder}
      .value=${args.value}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      autocomplete=${args.autocomplete}
      aria-label=${args.label || ariaLabel}
    >
      ${slotted}
    </fluid-masked-input>
  `;
}

function showValidationError(event: Event): void {
  const input = event.currentTarget as FluidMaskedInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = input.validationMessage;
}

function clearValidationError(event: Event): void {
  const input = event.currentTarget as FluidMaskedInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
