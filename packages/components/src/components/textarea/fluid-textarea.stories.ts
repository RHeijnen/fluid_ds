import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidTextarea } from "./fluid-textarea.js";
import type { FluidField } from "../field/fluid-field.js";

type Args = Pick<
  FluidTextarea,
  | "placeholder"
  | "rows"
  | "resize"
  | "maxlength"
  | "disabled"
  | "readonly"
  | "required"
  | "size"
  | "label"
  | "helpText"
  | "autocomplete"
>;

const meta: Meta<Args> = {
  title: "Components/Forms/Textarea",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    placeholder: { control: "text" },
    rows: { control: "number" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    resize: {
      control: "inline-radio",
      options: ["none", "vertical", "horizontal", "both", "auto"]
    },
    maxlength: { control: "number" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    required: { control: "boolean" },
    label: { control: "text" },
    helpText: { control: "text" },
    autocomplete: { control: "text" }
  },
  args: {
    placeholder: "Type your comment…",
    rows: 4,
    size: "md",
    resize: "vertical",
    maxlength: 200,
    disabled: false,
    readonly: false,
    required: false,
    label: "",
    helpText: "",
    autocomplete: ""
  },
  render: (args) => renderTextarea(args)
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { placeholder: "Add notes…" },
  render: (args) => html`
    <fluid-field
      style="max-width: 420px;"
      label="Project notes"
      description="Include the context another team member would need to continue this work."
    >
      ${renderTextarea(args, "Project notes")}
    </fluid-field>
  `
};

export const WithLabelAndHelpText: Story = {
  args: {
    label: "Release notes",
    helpText: "Markdown is supported. Keep the first paragraph suitable for a changelog.",
    placeholder: "What changed?"
  },
  render: (args) => renderTextarea(args, "Release notes")
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width:420px;">
      <fluid-textarea
        size="sm"
        rows="2"
        placeholder="Small"
        aria-label="Small notes"
      ></fluid-textarea>
      <fluid-textarea
        size="md"
        rows="2"
        placeholder="Medium"
        aria-label="Medium notes"
      ></fluid-textarea>
      <fluid-textarea
        size="lg"
        rows="2"
        placeholder="Large"
        aria-label="Large notes"
      ></fluid-textarea>
    </div>
  `
};

export const Autosize: Story = {
  args: { resize: "auto", placeholder: "Grows as you type…" }
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width:420px;">
      <fluid-textarea aria-label="a" placeholder="Default"></fluid-textarea>
      <fluid-textarea aria-label="b" value="With value"></fluid-textarea>
      <fluid-textarea aria-label="c" disabled value="Disabled"></fluid-textarea>
      <fluid-textarea aria-label="d" readonly value="Read-only"></fluid-textarea>
      <fluid-textarea aria-label="e" required placeholder="Required (untouched)"></fluid-textarea>
    </div>
  `
};

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width:420px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field label="Comment" description="Describe the reason for this change." required>
        <fluid-textarea
          name="comment"
          autocomplete="off"
          required
          minlength="10"
          maxlength="200"
          @invalid=${showValidationError}
          @fluid-input=${clearValidationError}
        ></fluid-textarea>
      </fluid-field>
      <fluid-button style="align-self:flex-start;" type="submit">Submit</fluid-button>
    </form>
  `
};

function renderTextarea(args: Args, ariaLabel = "Comment") {
  return html`
    <fluid-textarea
      aria-label=${ariaLabel}
      placeholder=${args.placeholder}
      size=${args.size}
      label=${args.label}
      help-text=${args.helpText}
      autocomplete=${args.autocomplete}
      .rows=${args.rows}
      resize=${args.resize}
      .maxlength=${args.maxlength}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      ?required=${args.required}
      style="max-width: 420px;"
    ></fluid-textarea>
  `;
}

function showValidationError(event: Event): void {
  const textarea = event.currentTarget as FluidTextarea;
  const field = textarea.closest("fluid-field") as FluidField | null;
  if (field) field.error = textarea.validationMessage;
}

function clearValidationError(event: Event): void {
  const textarea = event.currentTarget as FluidTextarea;
  const field = textarea.closest("fluid-field") as FluidField | null;
  if (field) field.error = "";
}
