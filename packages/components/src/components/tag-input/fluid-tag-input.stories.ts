import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { FluidTagInput } from "./fluid-tag-input.js";

type Args = Pick<
  FluidTagInput,
  "name" | "placeholder" | "disabled" | "max" | "allowDuplicates"
> & { value: string };

const meta: Meta<Args> = {
  title: "Components/Forms/Tag input",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
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
      max=${args.max ?? ""}
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

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const data = new FormData(e.target as HTMLFormElement);
        alert(`tags = ${data.get("tags")}`);
      }}
      style="display:flex; flex-direction:column; gap: var(--fluid-space-3); max-width: 24rem;"
    >
      <fluid-tag-input
        aria-label="Tags"
        name="tags"
        value="alpha,beta"
        placeholder="Add a tag…"
      ></fluid-tag-input>
      <button type="submit">Submit</button>
    </form>
  `
};
