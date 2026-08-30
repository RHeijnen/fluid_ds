import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidTagInput } from "./fluid-tag-input.js";

type Args = Pick<FluidTagInput, "name" | "placeholder" | "disabled" | "max" | "allowDuplicates"> & {
  value: string;
};

const meta: Meta<Args> = {
  title: "Components/Forms/Tag input",
  tags: ["autodocs"],
  parameters: { status: { type: "stable" } },
  argTypes: {
    name: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    max: { control: "number" },
    allowDuplicates: { control: "boolean" },
    value: { control: "text", description: "Comma-separated initial tokens." }
  },
  args: {
    name: "tags",
    placeholder: "Add a tag…",
    disabled: false,
    allowDuplicates: false,
    value: "react,typescript"
  },
  render: (args) => html`
    <fluid-tag-input
      aria-label="Tags"
      name=${args.name}
      placeholder=${args.placeholder}
      value=${args.value}
      max=${ifDefined(args.max)}
      ?disabled=${args.disabled}
      ?allow-duplicates=${args.allowDuplicates}
    ></fluid-tag-input>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Empty: Story = {
  args: { value: "", placeholder: "Type and press Enter…" }
};

export const Prefilled: Story = {
  args: { value: "design,systems,web components,lit" }
};

export const Capped: Story = {
  args: { value: "one,two", max: 3, placeholder: "Up to 3 tags" }
};

export const AllowDuplicates: Story = {
  args: { value: "react,react", allowDuplicates: true }
};

export const Disabled: Story = {
  args: { value: "frozen,locked", disabled: true }
};

export const WithDescription: Story = {
  args: { value: "accessibility,design-systems", placeholder: "Add another topic…" },
  render: (args) => html`
    <fluid-field
      label="Topics"
      description="Press Enter after each topic to add it to the list."
      style="max-width:24rem;"
    >
      <fluid-tag-input
        aria-label="Topics"
        name=${args.name}
        placeholder=${args.placeholder}
        value=${args.value}
        max=${ifDefined(args.max)}
        ?disabled=${args.disabled}
        ?allow-duplicates=${args.allowDuplicates}
      ></fluid-tag-input>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { name: "skills", value: "typescript,web components", placeholder: "Add a skill…" },
  render: (args) => html`
    <form
      @submit=${(event: Event) => event.preventDefault()}
      style="display:grid; gap:var(--fluid-space-3); max-width:24rem;"
    >
      <fluid-field
        label="Skills"
        description="Add the skills you want to highlight on your profile."
      >
        <fluid-tag-input
          aria-label="Skills"
          name=${args.name}
          placeholder=${args.placeholder}
          value=${args.value}
          max=${ifDefined(args.max)}
          ?disabled=${args.disabled}
          ?allow-duplicates=${args.allowDuplicates}
        ></fluid-tag-input>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Save profile</fluid-button>
    </form>
  `
};
