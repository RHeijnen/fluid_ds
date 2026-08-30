import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/lucide/calculator";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import "../icon/define.js";
import type { FluidNumberInput } from "./fluid-number-input.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidNumberInput,
  | "value"
  | "min"
  | "max"
  | "step"
  | "placeholder"
  | "noSteppers"
  | "disabled"
  | "readonly"
  | "required"
  | "autocomplete"
  | "size"
  | "label"
  | "helpText"
  | "stepperVariant"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/NumberInput",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  argTypes: {
    value: { control: "text" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    noSteppers: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    stepperVariant: { control: "inline-radio", options: ["plus-minus", "chevrons"] },
    label: { control: "text" },
    helpText: { control: "text" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    required: { control: "boolean" },
    autocomplete: { control: "text" }
  },
  args: {
    value: "5",
    min: 0,
    max: 100,
    step: 1,
    placeholder: "Quantity",
    noSteppers: false,
    size: "md",
    stepperVariant: "plus-minus",
    label: "",
    helpText: "",
    disabled: false,
    readonly: false,
    required: false,
    autocomplete: ""
  },
  render: (args) => renderNumberInput(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithoutSteppers: Story = {
  args: { noSteppers: true }
};

export const Bounded: Story = {
  args: { min: 1, max: 10, value: "5" }
};

export const WithDescription: Story = {
  args: { value: "5", min: 1, max: 100 },
  render: (args) => html`
    <fluid-field
      style="max-width: 320px;"
      label="Quantity"
      description="Choose how many items should be included in this order."
    >
      ${renderNumberInput(args, undefined, "Quantity", "320px")}
    </fluid-field>
  `
};

export const WithLabelAndHelpText: Story = {
  args: {
    label: "Retry limit",
    helpText: "Use a value from 0 through 10.",
    value: "3",
    min: 0,
    max: 10
  },
  render: (args) => renderNumberInput(args, undefined, "Retry limit", "320px")
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
      <fluid-number-input size="sm" value="5" aria-label="Small quantity"></fluid-number-input>
      <fluid-number-input size="md" value="5" aria-label="Medium quantity"></fluid-number-input>
      <fluid-number-input size="lg" value="5" aria-label="Large quantity"></fluid-number-input>
    </div>
  `
};

export const WithIconPrefix: Story = {
  args: { value: "12", label: "Calculated amount" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `prefix` slot accepts an icon or short text. The decorative calculator is separate from the numeric and submitted value."
      }
    }
  },
  render: (args) =>
    renderNumberInput(
      args,
      html`<fluid-icon slot="prefix" name="calculator" aria-hidden="true"></fluid-icon>`,
      "Calculated amount",
      "320px"
    )
};

export const WithTextSuffix: Story = {
  args: { value: "25", label: "Package weight" },
  parameters: {
    docs: {
      description: {
        story:
          "The generic `suffix` slot accepts short text or an icon. The unit remains separate from the numeric and submitted value."
      }
    }
  },
  render: (args) =>
    renderNumberInput(args, html`<span slot="suffix">kg</span>`, "Package weight", "320px")
};

export const StepperVariants: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "The default uses two full-height accessible targets. The compact variant mirrors a native HTML number input with stacked chevrons while keeping the complete field the same height; its half-height buttons do not meet the component's normal 24px target-size floor."
      }
    }
  },
  render: () => html`
    <div
      style="display:grid; grid-template-columns: repeat(2, minmax(240px, 320px)); gap: var(--fluid-space-6); align-items:end;"
    >
      <fluid-number-input label="Plus / minus" value="5"></fluid-number-input>
      <fluid-number-input
        label="Chevrons"
        stepper-variant="chevrons"
        value="5"
      ></fluid-number-input>
    </div>
  `
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 240px;">
      <fluid-number-input aria-label="Default quantity"></fluid-number-input>
      <fluid-number-input aria-label="Filled quantity" value="5"></fluid-number-input>
      <fluid-number-input aria-label="Disabled quantity" value="5" disabled></fluid-number-input>
      <fluid-number-input aria-label="Read-only quantity" value="5" readonly></fluid-number-input>
      <fluid-number-input aria-label="Required quantity" required></fluid-number-input>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 240px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field label="Quantity" description="Choose between 1 and 10." required>
        <fluid-number-input
          name="quantity"
          min="1"
          max="10"
          required
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-number-input>
      </fluid-field>
      <fluid-button style="align-self: flex-start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderNumberInput(
  args: Args,
  slotted?: unknown,
  ariaLabel = "Quantity",
  maxWidth = "240px"
) {
  return html`
    <fluid-number-input
      style=${`max-width:${maxWidth};`}
      aria-label=${ariaLabel}
      size=${args.size}
      stepper-variant=${args.stepperVariant}
      label=${args.label}
      help-text=${args.helpText}
      .value=${args.value}
      .min=${args.min}
      .max=${args.max}
      .step=${args.step}
      placeholder=${args.placeholder}
      ?no-steppers=${args.noSteppers}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      autocomplete=${args.autocomplete}
    >
      ${slotted}
    </fluid-number-input>
  `;
}

function showValidationError(event: Event): void {
  const input = event.currentTarget as FluidNumberInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = input.validationMessage;
}

function clearValidationError(event: Event): void {
  const input = event.currentTarget as FluidNumberInput;
  const field = input.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
