import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidSelect } from "./fluid-select.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidSelect,
  "value" | "size" | "placeholder" | "disabled" | "required" | "label" | "helpText"
>;

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
    required: { control: "boolean" },
    label: { control: "text" },
    helpText: { control: "text" }
  },
  args: {
    value: "",
    size: "md",
    placeholder: "Choose a country…",
    disabled: false,
    required: false,
    label: "",
    helpText: ""
  },
  render: (args) => renderSelect(args, countryOptions)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { placeholder: "Choose a country…" },
  render: (args) => html`
    <fluid-field
      style="max-width:320px;"
      label="Country"
      description="Choose the country used for billing and tax calculations."
    >
      ${renderSelect(args, countryOptions)}
    </fluid-field>
  `
};

export const WithLabelAndHelpText: Story = {
  args: {
    label: "Deployment region",
    helpText: "This controls where new workloads are provisioned.",
    placeholder: "Choose a region…"
  },
  render: (args) => renderSelect(args, regionOptions, undefined, "Deployment region")
};

export const WithTextPrefix: Story = {
  args: { label: "Billing currency", placeholder: "Choose a currency…" },
  render: (args) =>
    renderSelect(
      args,
      currencyOptions,
      html`<span slot="prefix">Currency</span>`,
      "Billing currency"
    )
};

export const WithIconPrefix: Story = {
  args: { label: "Country", placeholder: "Search countries…" },
  render: (args) =>
    renderSelect(
      args,
      countryOptions,
      html`<fluid-icon slot="prefix" name="search" aria-hidden="true"></fluid-icon>`
    )
};

export const WithTextSuffix: Story = {
  args: { label: "Billing cycle", placeholder: "Choose a cycle…" },
  render: (args) =>
    renderSelect(args, cycleOptions, html`<span slot="suffix">per plan</span>`, "Billing cycle")
};

export const WithIconSuffix: Story = {
  args: { label: "Approval state", placeholder: "Choose a state…" },
  render: (args) =>
    renderSelect(
      args,
      approvalOptions,
      html`<fluid-icon slot="suffix" name="check" aria-hidden="true"></fluid-icon>`,
      "Approval state"
    )
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 320px;">
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
  args: { placeholder: "Choose a plan…" },
  render: (args) =>
    renderSelect(
      args,
      html`
        <fluid-option value="free">Free</fluid-option>
        <fluid-option value="pro">Pro</fluid-option>
        <fluid-option value="enterprise" disabled>Enterprise (contact sales)</fluid-option>
      `,
      undefined,
      "Plan"
    )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:var(--fluid-space-3); max-width:320px;">
      <fluid-select placeholder="Default" aria-label="Default">
        <fluid-option value="a">Apple</fluid-option>
        <fluid-option value="b">Banana</fluid-option>
      </fluid-select>
      <fluid-select value="b" aria-label="Selected">
        <fluid-option value="a">Apple</fluid-option>
        <fluid-option value="b">Banana</fluid-option>
      </fluid-select>
      <fluid-select value="a" disabled aria-label="Disabled">
        <fluid-option value="a">Apple</fluid-option>
      </fluid-select>
      <fluid-select required placeholder="Required (untouched)" aria-label="Required">
        <fluid-option value="a">Apple</fluid-option>
      </fluid-select>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap:var(--fluid-space-3); max-width:320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field label="Country" description="Choose the country used for billing." required>
        <fluid-select
          name="country"
          placeholder="Choose a country…"
          required
          @invalid=${showValidationError}
          @fluid-change=${clearValidationError}
        >
          <fluid-option value="nl">Netherlands</fluid-option>
          <fluid-option value="be">Belgium</fluid-option>
          <fluid-option value="de">Germany</fluid-option>
        </fluid-select>
      </fluid-field>
      <fluid-button style="align-self:flex-start;" type="submit">Submit</fluid-button>
    </form>
  `
};

/** Regression fixture: the option list must escape this deliberately short,
 * overflow-hidden container instead of being cropped at its lower edge. */
export const InsideClippingContainer: Story = {
  args: { placeholder: "Choose an action" },
  render: (args) => html`
    <div
      style="height: 8rem; max-width: 360px; overflow: hidden; padding: var(--fluid-space-4); border: 1px solid var(--fluid-border-default); border-radius: var(--fluid-radius-lg);"
    >
      <p style="margin: 0 0 var(--fluid-space-5);">Clipping boundary</p>
      ${renderSelect(args, actionOptions, undefined, "Deployment action")}
    </div>
  `
};

const countryOptions = html`
  <fluid-option value="nl">Netherlands</fluid-option>
  <fluid-option value="be">Belgium</fluid-option>
  <fluid-option value="de">Germany</fluid-option>
  <fluid-option value="fr">France</fluid-option>
  <fluid-option value="es">Spain</fluid-option>
  <fluid-option value="it">Italy</fluid-option>
  <fluid-option value="uk">United Kingdom</fluid-option>
  <fluid-option value="us">United States</fluid-option>
`;
const regionOptions = html`
  <fluid-option value="eu-west">Europe West</fluid-option>
  <fluid-option value="us-east">US East</fluid-option>
  <fluid-option value="ap-south">Asia Pacific South</fluid-option>
`;
const currencyOptions = html`
  <fluid-option value="eur">Euro</fluid-option>
  <fluid-option value="usd">US dollar</fluid-option>
  <fluid-option value="gbp">Pound sterling</fluid-option>
`;
const cycleOptions = html`
  <fluid-option value="monthly">Monthly</fluid-option>
  <fluid-option value="quarterly">Quarterly</fluid-option>
  <fluid-option value="yearly">Yearly</fluid-option>
`;
const approvalOptions = html`
  <fluid-option value="draft">Draft</fluid-option>
  <fluid-option value="review">In review</fluid-option>
  <fluid-option value="approved">Approved</fluid-option>
`;
const actionOptions = html`
  <fluid-option value="deploy">Deploy configuration</fluid-option>
  <fluid-option value="force">Force deploy configuration</fluid-option>
  <fluid-option value="restart">Restart terminals</fluid-option>
  <fluid-option value="cancel">Cancel pending deployment</fluid-option>
  <fluid-option value="current">Use current terminal configuration</fluid-option>
`;

function renderSelect(args: Args, options: unknown, affix?: unknown, ariaLabel = "Country") {
  return html`
    <fluid-select
      style="max-width:320px;"
      .value=${args.value}
      size=${args.size}
      placeholder=${args.placeholder}
      label=${args.label}
      help-text=${args.helpText}
      ?disabled=${args.disabled}
      ?required=${args.required}
      aria-label=${ariaLabel}
    >
      ${affix} ${options}
    </fluid-select>
  `;
}

function showValidationError(event: Event): void {
  const select = event.currentTarget as FluidSelect;
  const field = select.closest("fluid-field") as FluidField | null;
  if (field) field.error = select.validationMessage;
}

function clearValidationError(event: Event): void {
  const select = event.currentTarget as FluidSelect;
  const field = select.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
