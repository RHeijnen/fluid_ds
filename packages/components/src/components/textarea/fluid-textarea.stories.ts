import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTextarea } from "./fluid-textarea.js";

type Args = Pick<
  FluidTextarea,
  "placeholder" | "rows" | "resize" | "maxlength" | "disabled" | "required"
>;

const meta: Meta<Args> = {
  title: "Components/Textarea",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    placeholder: { control: "text" },
    rows: { control: "number" },
    resize: {
      control: "inline-radio",
      options: ["none", "vertical", "horizontal", "both", "auto"]
    },
    maxlength: { control: "number" },
    disabled: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    placeholder: "Type your comment…",
    rows: 4,
    resize: "vertical",
    maxlength: 200,
    disabled: false,
    required: false
  },
  render: (args) => html`
    <fluid-textarea
      aria-label="Comment"
      placeholder=${args.placeholder}
      .rows=${args.rows}
      resize=${args.resize}
      .maxlength=${args.maxlength}
      ?disabled=${args.disabled}
      ?required=${args.required}
      style="max-width: 420px;"
    ></fluid-textarea>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Autosize: Story = {
  args: { resize: "auto", placeholder: "Grows as you type…" }
};

export const States: Story = {
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width:420px;">
      <fluid-textarea aria-label="a" placeholder="Default"></fluid-textarea>
      <fluid-textarea aria-label="b" value="With value"></fluid-textarea>
      <fluid-textarea aria-label="c" disabled value="Disabled"></fluid-textarea>
      <fluid-textarea aria-label="d" readonly value="Read-only"></fluid-textarea>
    </div>
  `
};
