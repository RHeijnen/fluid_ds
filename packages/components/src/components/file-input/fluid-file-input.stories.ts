import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidFileInput } from "./fluid-file-input.js";

type Args = Pick<FluidFileInput, "accept" | "multiple" | "disabled" | "required" | "variant">;

const meta: Meta<Args> = {
  title: "Components/Forms/FileInput",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    accept: { control: "text" },
    multiple: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    variant: { control: "inline-radio", options: ["dropzone", "compact"] }
  },
  args: {
    accept: "",
    multiple: false,
    disabled: false,
    required: false,
    variant: "dropzone"
  },
  render: (args) => html`
    <fluid-file-input
      accept=${args.accept}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      ?required=${args.required}
      variant=${args.variant}
      style="max-width: 420px;"
    ></fluid-file-input>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { multiple: true }
};

export const ImagesOnly: Story = {
  args: { accept: "image/*", multiple: true },
  render: (args) => html`
    <fluid-file-input accept=${args.accept} ?multiple=${args.multiple} style="max-width: 420px;">
      <span slot="label">Drop images here</span>
      <span slot="hint">PNG, JPG, or WEBP up to 5 MB</span>
    </fluid-file-input>
  `
};

export const Compact: Story = {
  args: { variant: "compact" },
  render: (args) => html`
    <fluid-file-input
      accept=${args.accept}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      ?required=${args.required}
      variant=${args.variant}
      style="max-width:420px;"
    >
      <span slot="label">Choose file</span>
      <span slot="hint">No file selected</span>
    </fluid-file-input>
  `
};

export const WithDescription: Story = {
  args: { accept: ".pdf", variant: "compact" },
  render: (args) => html`
    <fluid-field
      label="Supporting document"
      description="Upload one PDF document up to 10 MB."
      style="max-width:420px;"
    >
      <fluid-file-input
        aria-label="Supporting document"
        accept=${args.accept}
        ?multiple=${args.multiple}
        ?disabled=${args.disabled}
        ?required=${args.required}
        variant=${args.variant}
      >
        <span slot="label">Choose file</span>
        <span slot="hint">No file selected</span>
      </fluid-file-input>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { accept: ".pdf,.doc,.docx", required: true, variant: "compact" },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:420px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Résumé"
        description="Upload a PDF or Word document."
        ?required=${args.required}
      >
        <fluid-file-input
          name="resume"
          aria-label="Résumé"
          accept=${args.accept}
          ?multiple=${args.multiple}
          ?disabled=${args.disabled}
          ?required=${args.required}
          variant=${args.variant}
          @invalid=${(event: Event) => {
            const control = event.currentTarget as FluidFileInput;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            field.error = control.validationMessage;
          }}
          @fluid-change=${(event: Event) => {
            const control = event.currentTarget as FluidFileInput;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            if (control.validity.valid) field.error = "";
          }}
        >
          <span slot="label">Choose file</span>
          <span slot="hint">No file selected</span>
        </fluid-file-input>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Submit application</fluid-button>
    </form>
  `
};
