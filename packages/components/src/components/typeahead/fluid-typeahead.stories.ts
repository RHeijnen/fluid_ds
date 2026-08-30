import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "@fluid-ds/icons/register-defaults";
import "./define.js";
import "../badge/define.js";
import "../button/define.js";
import "../field/define.js";
import "../icon/define.js";
import type {
  FluidTypeahead,
  TypeaheadOption,
  TypeaheadOptionRenderer
} from "./fluid-typeahead.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidTypeahead,
  | "value"
  | "size"
  | "placeholder"
  | "disabled"
  | "required"
  | "strict"
  | "keepOpen"
  | "minQuery"
  | "maxOptions"
  | "debounceMs"
  | "label"
  | "helpText"
>;

const COUNTRIES: TypeaheadOption[] = [
  { value: "nl", label: "Netherlands" },
  { value: "be", label: "Belgium" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "uk", label: "United Kingdom" },
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "jp", label: "Japan" }
];

const meta: Meta<Args> = {
  title: "Components/Forms/Typeahead",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  argTypes: {
    value: { control: "text" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    strict: { control: "boolean" },
    keepOpen: { control: "boolean" },
    minQuery: { control: "number" },
    maxOptions: { control: "number" },
    debounceMs: { control: "number" },
    label: { control: "text" },
    helpText: { control: "text" }
  },
  args: {
    value: "",
    size: "md",
    placeholder: "Pick a country…",
    disabled: false,
    required: false,
    strict: false,
    keepOpen: false,
    minQuery: 0,
    maxOptions: 50,
    debounceMs: 200,
    label: "",
    helpText: ""
  },
  render: (args) => renderTypeahead(args)
};

export default meta;
type Story = StoryObj<Args>;

export const FromArray: Story = {};

export const WithDescription: Story = {
  args: { placeholder: "Search countries…" },
  render: (args) => html`
    <fluid-field
      style="max-width:320px;"
      label="Country"
      description="Search by country name, then choose a matching result."
    >
      ${renderTypeahead(args)}
    </fluid-field>
  `
};

export const WithLabelAndHelpText: Story = {
  args: {
    label: "Deployment country",
    helpText: "Start typing to narrow the available countries.",
    placeholder: "Search countries…"
  }
};

export const WithIconPrefix: Story = {
  args: { label: "Country", placeholder: "Search countries…" },
  render: (args) =>
    renderTypeahead(
      args,
      COUNTRIES,
      html`<fluid-icon slot="prefix" name="search" aria-hidden="true"></fluid-icon>`
    )
};

export const WithTextSuffix: Story = {
  args: { label: "Country", placeholder: "Search countries…" },
  render: (args) => renderTypeahead(args, COUNTRIES, html`<span slot="suffix">Global</span>`)
};

export const FromJSONAttribute: Story = {
  args: { placeholder: "Pick a fruit…" },
  render: (args) => html`
    <fluid-typeahead
      style="max-width:320px;"
      aria-label="Fruit"
      options='["Apple","Apricot","Banana","Blackberry","Cherry","Date","Fig"]'
      .value=${args.value}
      size=${args.size}
      placeholder=${args.placeholder}
      label=${args.label}
      help-text=${args.helpText}
      .minQuery=${args.minQuery}
      .maxOptions=${args.maxOptions}
      .debounceMs=${args.debounceMs}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?strict=${args.strict}
      ?keep-open=${args.keepOpen}
    ></fluid-typeahead>
  `
};

export const AsyncLoader: Story = {
  args: {
    placeholder: "Type at least 2 characters…",
    minQuery: 2,
    debounceMs: 200
  },
  render: (args) => {
    const loader = async (query: string) => {
      if (!query) return [];
      await new Promise((resolve) => setTimeout(resolve, 250));
      return Array.from({ length: 5 }, (_, index) => `${query} result ${index + 1}`);
    };
    return renderTypeahead(args, [], undefined, loader, undefined, "Search", "360px");
  }
};

export const StrictSelection: Story = {
  args: { strict: true, placeholder: "Must pick from the list…" },
  render: (args) => html`
    ${renderTypeahead(args)}
    <p
      style="margin-top:var(--fluid-space-2); color:var(--fluid-text-secondary); font-size:var(--fluid-font-size-sm);"
    >
      Free text clears on blur; only listed options are accepted.
    </p>
  `
};

const TERMINALS: TypeaheadOption[] = [
  { value: "t1", label: "APO0Q25L017092", data: { product: "Apollo CLO Dev", domain: "CURO" } },
  {
    value: "t2",
    label: "APO20204800024",
    data: { product: "Apollo CLO Dev", domain: "PAYTER_RD" }
  },
  { value: "t3", label: "APO20204800068", data: { product: "Apollo CLO Dev", domain: "CURO" } },
  { value: "t4", label: "APO20213900004", data: { product: "Apollo CLO Dev", domain: "PAYTER" } },
  { value: "t5", label: "APO20222000120", data: { product: "Apollo CLO Dev", domain: "M6" } }
];

const terminalRenderer: TypeaheadOptionRenderer = (option, context) => {
  const detail = option.data as { product: string; domain: string };
  return html`
    <span>${context.highlight(option.label)}</span>
    <small style="margin-inline-start:var(--fluid-space-2); color:var(--fluid-text-secondary);"
      >${detail.product}</small
    >
    <fluid-badge style="margin-inline-start:auto;">${detail.domain}</fluid-badge>
  `;
};

export const CustomRows: Story = {
  name: "Custom option rows",
  args: { placeholder: "Search terminals…" },
  render: (args) => html`
    ${renderTypeahead(args, TERMINALS, undefined, undefined, terminalRenderer, "Terminal", "520px")}
    <p
      style="margin-top:var(--fluid-space-2); color:var(--fluid-text-secondary); font-size:var(--fluid-font-size-sm);"
    >
      Custom rows keep metadata as separate elements and support highlighted matches.
    </p>
  `
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; gap:var(--fluid-space-3); max-width:320px;">
      <fluid-typeahead
        aria-label="Default"
        placeholder="Default"
        .options=${COUNTRIES}
      ></fluid-typeahead>
      <fluid-typeahead
        aria-label="Filled"
        value="Netherlands"
        .options=${COUNTRIES}
      ></fluid-typeahead>
      <fluid-typeahead
        aria-label="Disabled"
        value="Netherlands"
        disabled
        .options=${COUNTRIES}
      ></fluid-typeahead>
      <fluid-typeahead
        aria-label="Required"
        required
        placeholder="Required (untouched)"
        .options=${COUNTRIES}
      ></fluid-typeahead>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:320px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Country"
        description="Search by country name and select a result."
        required
      >
        <fluid-typeahead
          name="country"
          required
          strict
          .options=${COUNTRIES}
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
          @fluid-change=${clearValidationError}
        ></fluid-typeahead>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderTypeahead(
  args: Args,
  options: TypeaheadOption[] = COUNTRIES,
  slotted?: unknown,
  loader?: (query: string) => Promise<string[]>,
  optionRenderer?: TypeaheadOptionRenderer,
  ariaLabel = "Country",
  maxWidth = "320px"
) {
  return html`
    <fluid-typeahead
      style=${`max-width:${maxWidth};`}
      aria-label=${ariaLabel}
      .options=${options}
      .loadOptions=${loader}
      .renderOption=${optionRenderer}
      .value=${args.value}
      size=${args.size}
      placeholder=${args.placeholder}
      label=${args.label}
      help-text=${args.helpText}
      .minQuery=${args.minQuery}
      .maxOptions=${args.maxOptions}
      .debounceMs=${args.debounceMs}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?strict=${args.strict}
      ?keep-open=${args.keepOpen}
    >
      ${slotted}
    </fluid-typeahead>
  `;
}

function showValidationError(event: Event): void {
  const typeahead = event.currentTarget as FluidTypeahead;
  const field = typeahead.closest("fluid-field") as FluidField | null;
  if (field) field.error = typeahead.validationMessage;
}

function clearValidationError(event: Event): void {
  const typeahead = event.currentTarget as FluidTypeahead;
  const field = typeahead.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
