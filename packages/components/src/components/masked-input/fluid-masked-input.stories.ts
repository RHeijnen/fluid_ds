import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidMaskedInput } from "./fluid-masked-input.js";

type Args = Pick<
  FluidMaskedInput,
  "mask" | "size" | "placeholder" | "value" | "disabled" | "readonly" | "required"
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
    required: { control: "boolean" }
  },
  args: {
    mask: "(###) ###-####",
    size: "md",
    placeholder: "",
    value: "",
    disabled: false,
    readonly: false,
    required: false,
    label: "Phone number"
  },
  render: (args) => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-2); max-width: 320px;">
      <label style="font-size: var(--fluid-font-size-sm); color: var(--fluid-text-secondary);"
        >${args.label}</label
      >
      <fluid-masked-input
        mask=${args.mask}
        size=${args.size}
        placeholder=${args.placeholder}
        .value=${args.value}
        ?disabled=${args.disabled}
        ?readonly=${args.readonly}
        ?required=${args.required}
        aria-label=${args.label}
      ></fluid-masked-input>
    </div>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Masks: Story = {
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
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-masked-input size="sm" mask="(###) ###-####" aria-label="Small"></fluid-masked-input>
      <fluid-masked-input size="md" mask="(###) ###-####" aria-label="Medium"></fluid-masked-input>
      <fluid-masked-input size="lg" mask="(###) ###-####" aria-label="Large"></fluid-masked-input>
    </div>
  `
};

export const States: Story = {
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
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert(JSON.stringify(Object.fromEntries(data.entries()), null, 2));
      }}
    >
      <fluid-masked-input
        name="phone"
        mask="(###) ###-####"
        required
        aria-label="Phone number"
      ></fluid-masked-input>
      <fluid-masked-input
        name="expiry"
        mask="##/##"
        required
        aria-label="Card expiry"
      ></fluid-masked-input>
      <button type="submit">Submit</button>
    </form>
  `
};
