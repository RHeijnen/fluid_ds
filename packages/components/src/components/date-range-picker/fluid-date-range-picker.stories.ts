import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidDateRangePicker } from "./fluid-date-range-picker.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidDateRangePicker,
  | "start"
  | "end"
  | "format"
  | "size"
  | "placeholder"
  | "min"
  | "max"
  | "disabled"
  | "required"
  | "readonly"
  | "typeable"
  | "noPresets"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/Date Range Picker",
  component: "fluid-date-range-picker",
  parameters: { status: { type: "experimental" } },
  argTypes: {
    start: { control: "text" },
    end: { control: "text" },
    format: { control: "select", options: ["short", "medium", "long", "numeric", "iso"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    placeholder: { control: "text" },
    min: { control: "text" },
    max: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readonly: { control: "boolean" },
    typeable: { control: "boolean" },
    noPresets: { control: "boolean" }
  },
  args: {
    start: "2026-06-08",
    end: "2026-06-19",
    format: "medium",
    size: "md",
    placeholder: "Pick a range…",
    min: null,
    max: null,
    disabled: false,
    required: false,
    readonly: false,
    typeable: false,
    noPresets: false
  },
  render: (args) => renderRange(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Empty: Story = {
  args: { start: null, end: null }
};

export const WithDescription: Story = {
  render: (args) => html`
    <fluid-field
      style="max-width:22rem;"
      label="Reporting period"
      description="Choose the first and last day included in the report."
    >
      ${renderRange(args)}
    </fluid-field>
  `
};

export const Typeable: Story = {
  args: { typeable: true },
  render: (args) => html`
    <div style="max-width:22rem;">
      ${renderRange(args)}
      <p
        style="margin-top:var(--fluid-space-2); color:var(--fluid-text-secondary); font-size:var(--fluid-font-size-sm);"
      >
        Type a localized range or open the calendar to select it visually.
      </p>
    </div>
  `
};

export const NoPresets: Story = {
  args: { noPresets: true }
};

export const WithMinMax: Story = {
  args: { min: "2026-06-01", max: "2026-07-31" }
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; align-items:center; gap:var(--fluid-space-4); flex-wrap:wrap;">
      <fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        size="sm"
      ></fluid-date-range-picker>
      <fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        size="md"
      ></fluid-date-range-picker>
      <fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        size="lg"
      ></fluid-date-range-picker>
    </div>
  `
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; gap:var(--fluid-space-3); max-width:22rem;">
      <fluid-date-range-picker start="2026-06-08" end="2026-06-19"></fluid-date-range-picker>
      <fluid-date-range-picker placeholder="Empty"></fluid-date-range-picker>
      <fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        readonly
      ></fluid-date-range-picker>
      <fluid-date-range-picker
        start="2026-06-08"
        end="2026-06-19"
        disabled
      ></fluid-date-range-picker>
      <fluid-date-range-picker
        required
        placeholder="Required (untouched)"
      ></fluid-date-range-picker>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:22rem;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Reporting period"
        description="Choose the first and last day included in the report."
        required
      >
        <fluid-date-range-picker
          name="reporting-period"
          required
          @invalid=${showValidationError}
          @fluid-change=${clearValidationError}
        ></fluid-date-range-picker>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderRange(args: Args) {
  return html`
    <fluid-date-range-picker
      style="max-width:22rem;"
      .start=${args.start}
      .end=${args.end}
      format=${args.format}
      size=${args.size}
      placeholder=${args.placeholder}
      .min=${args.min}
      .max=${args.max}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?readonly=${args.readonly}
      ?typeable=${args.typeable}
      ?no-presets=${args.noPresets}
    ></fluid-date-range-picker>
  `;
}

function showValidationError(event: Event): void {
  const range = event.currentTarget as FluidDateRangePicker;
  const field = range.closest("fluid-field") as FluidField | null;
  if (field) field.error = range.validationMessage;
}

function clearValidationError(event: Event): void {
  const range = event.currentTarget as FluidDateRangePicker;
  const field = range.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
