import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { Blueprint } from "../../core/types.js";

const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Full name", type: "string", required: true, aliases: ["name", "full name"] },
    { key: "email", label: "Email", type: "email", required: true, aliases: ["e-mail", "mail"] },
    { key: "age", label: "Age", type: "integer", min: 0, max: 120 },
    {
      key: "role",
      label: "Role",
      type: "enum",
      options: ["engineer", "designer", "manager"],
      default: "engineer"
    },
    { key: "joined", label: "Joined", type: "date", format: "iso" },
    { key: "active", label: "Active", type: "boolean", default: true }
  ],
  dedupeBy: "email",
  maxRows: 1000
};

const meta: Meta = {
  title: "Parser/File parser",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-file-parser
      .blueprint=${blueprint}
      style="max-width: 48rem; display:block;"
      @fluid-parse=${(e: CustomEvent) => console.log("fluid-parse", e.detail)}
    ></fluid-file-parser>
    <p style="color: var(--fluid-text-secondary); font-size: 0.875rem; max-width: 48rem;">
      Drop a CSV, JSON, or Excel file. Try one with columns like
      <code>name, email, age, role, joined, active</code> in any order or casing,
      the auto-mapper will line them up. Bad cells are highlighted in the preview.
    </p>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const MappingHidden: Story = {
  name: "Auto-map only (no mapping UI)",
  render: () => html`
    <fluid-file-parser
      .blueprint=${blueprint}
      hide-mapping
      style="max-width: 48rem; display:block;"
    ></fluid-file-parser>
  `
};

export const PreCleaned: Story = {
  name: "Tight blueprint (required + ranges)",
  render: () => html`
    <fluid-file-parser
      .blueprint=${{
        fields: [
          { key: "sku", label: "SKU", type: "string", required: true, pattern: "^[A-Z]{3}-\\d{4}$" },
          { key: "price", label: "Price", type: "number", required: true, min: 0 },
          { key: "stock", label: "In stock", type: "integer", min: 0, default: 0 }
        ]
      } satisfies Blueprint}
      label="Drop a product CSV here"
      style="max-width: 48rem; display:block;"
    ></fluid-file-parser>
  `
};
