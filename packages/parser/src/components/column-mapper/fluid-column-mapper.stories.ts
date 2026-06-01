import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { Blueprint } from "../../core/types.js";

const blueprint: Blueprint = {
  fields: [
    { key: "firstName", label: "First name", type: "string", required: true, aliases: ["fname", "given"] },
    { key: "lastName", label: "Last name", type: "string", required: true, aliases: ["lname", "surname"] },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "company", label: "Company", type: "string" }
  ]
};

const columns = ["Given Name", "Surname", "E-mail Address", "Org", "Notes"];

const meta: Meta = {
  title: "Parser/Column mapper",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  render: () => html`
    <fluid-column-mapper
      .blueprint=${blueprint}
      .columns=${columns}
      style="max-width: 36rem; display:block;"
      @fluid-mapping-change=${(e: CustomEvent) => console.log("mapping", e.detail.mapping)}
    ></fluid-column-mapper>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const UnmatchedColumns: Story = {
  name: "Required fields with no auto-match",
  render: () => html`
    <fluid-column-mapper
      .blueprint=${blueprint}
      .columns=${["alpha", "beta", "gamma"]}
      style="max-width: 36rem; display:block;"
    ></fluid-column-mapper>
  `
};
