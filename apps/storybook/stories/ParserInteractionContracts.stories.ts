import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { html } from "lit";
import "../../../packages/parser/src/components/file-parser/define.js";
import "../../../packages/parser/src/components/column-mapper/define.js";
import type { FluidFileParser } from "../../../packages/parser/src/components/file-parser/fluid-file-parser.js";
import type { FluidColumnMapper } from "../../../packages/parser/src/components/column-mapper/fluid-column-mapper.js";
import type { Blueprint } from "../../../packages/parser/src/core/types.js";

const meta: Meta = {
  title: "Quality/Parser interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;
const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Full name", type: "string", required: true, aliases: ["Name"] },
    { key: "email", label: "Email", type: "email", required: true, aliases: ["Email Address"] },
    { key: "age", label: "Age", type: "integer", min: 0 }
  ],
  dedupeBy: "email"
};
const renderParser = () =>
  html`<fluid-file-parser label="Choose import file" .blueprint=${blueprint}></fluid-file-parser>`;
const renderMapper = () => html`
  <fluid-column-mapper
    .blueprint=${blueprint}
    .columns=${["Name", "Email Address", "Age"]}
  ></fluid-column-mapper>
`;

function action(parser: FluidFileParser, name: string): HTMLButtonElement {
  const host = Array.from(parser.shadowRoot!.querySelectorAll("fluid-button")).find(
    (button) => button.textContent!.trim() === name
  )!;
  return host.shadowRoot!.querySelector("button")!;
}

export const FileImportContract: Story = {
  parameters: { quality: { componentTag: "fluid-file-parser" } },
  render: renderParser,
  play: async ({ canvasElement }) => {
    const parser = canvasElement.querySelector<FluidFileParser>("fluid-file-parser")!;
    await parser.updateComplete;
    const zone = parser.shadowRoot!.querySelector("fluid-dropzone")!;
    await (zone as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    const input = zone.shadowRoot!.querySelector<HTMLInputElement>('input[type="file"]')!;
    const loaded: CustomEvent[] = [];
    const parsed: CustomEvent[] = [];
    const errors: CustomEvent[] = [];
    const onLoaded = (event: Event) => loaded.push(event as CustomEvent);
    const onParsed = (event: Event) => parsed.push(event as CustomEvent);
    const onError = (event: Event) => errors.push(event as CustomEvent);
    parser.addEventListener("fluid-file-loaded", onLoaded);
    parser.addEventListener("fluid-parse", onParsed);
    parser.addEventListener("fluid-parse-error", onError);
    try {
      const file = new File(
        [
          "Name,Email Address,Age\nAda,ada@example.com,30\nDuplicate,ada@example.com,bad\nBo,bo@example.com,20"
        ],
        "people.csv",
        { type: "text/csv" }
      );
      await userEvent.upload(input, file);
      await waitFor(() =>
        expect(parser.currentResult?.stats).toEqual({
          total: 3,
          kept: 2,
          duplicates: 1,
          truncated: 0,
          errorCount: 0
        })
      );
      await expect(loaded).toHaveLength(1);
      await expect(loaded[0]!.detail.file).toBe(file);
      await expect(loaded[0]!.detail.raw.columns).toEqual(["Name", "Email Address", "Age"]);
      const confirm = action(parser, "Import 2 rows");
      confirm.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(parsed).toHaveLength(1));
      await expect(parsed[0]!.detail).toMatchObject({
        valid: true,
        errors: [],
        rows: [
          { name: "Ada", email: "ada@example.com", age: 30 },
          { name: "Bo", email: "bo@example.com", age: 20 }
        ]
      });
      await expect(parsed[0]!.bubbles).toBe(true);
      await expect(parsed[0]!.composed).toBe(true);
      await userEvent.click(action(parser, "Reset"));
      await waitFor(() => expect(parser.currentResult).toBeNull());
      await expect(parser.shadowRoot!.querySelector("table")).toBeNull();
      await userEvent.upload(
        input,
        new File(["{invalid"], "broken.json", { type: "application/json" })
      );
      await waitFor(() => expect(errors).toHaveLength(1));
      await expect(errors[0]!.detail.message).toMatch(/Invalid JSON/);
      await expect(errors[0]!.bubbles).toBe(true);
      await expect(errors[0]!.composed).toBe(true);
      const errorCallout = parser.shadowRoot!.querySelector("fluid-callout")!;
      await errorCallout.updateComplete;
      await expect(errorCallout.shadowRoot!.querySelectorAll('[role="alert"]')).toHaveLength(1);
      await expect(parser.shadowRoot!.querySelector('[role="alert"]')).toBeNull();
      await userEvent.upload(
        input,
        new File(['[{"Name":"Cy","Email Address":"cy@example.com","Age":40}]'], "recovery.json", {
          type: "application/json"
        })
      );
      await waitFor(() => expect(parser.currentResult?.rows[0]?.name).toBe("Cy"));
      await expect(loaded).toHaveLength(2);
      const remove = within(zone.shadowRoot! as unknown as HTMLElement).getByRole("button", {
        name: "Remove recovery.json"
      });
      await userEvent.click(remove);
      await waitFor(() => expect(parser.currentResult).toBeNull());
    } finally {
      parser.removeEventListener("fluid-file-loaded", onLoaded);
      parser.removeEventListener("fluid-parse", onParsed);
      parser.removeEventListener("fluid-parse-error", onError);
    }
  }
};

export const ColumnMappingContract: Story = {
  parameters: { quality: { componentTag: "fluid-column-mapper" } },
  render: renderMapper,
  play: async ({ canvasElement }) => {
    const mapper = canvasElement.querySelector<FluidColumnMapper>("fluid-column-mapper")!;
    await mapper.updateComplete;
    const root = within(mapper.shadowRoot! as unknown as HTMLElement);
    const name = root.getByRole("combobox", { name: "Full name" }) as HTMLSelectElement;
    const email = root.getByRole("combobox", { name: "Email" }) as HTMLSelectElement;
    const changes: CustomEvent[] = [];
    const record = (event: Event) => changes.push(event as CustomEvent);
    mapper.addEventListener("fluid-mapping-change", record);
    try {
      await expect(name.value).toBe("Name");
      await expect(email.value).toBe("Email Address");
      await expect(name.required).toBe(true);
      await userEvent.selectOptions(name, "");
      await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
      await expect(name.validity.valueMissing).toBe(true);
      await expect(changes[0]!.detail.mapping).toEqual({
        name: null,
        email: "Email Address",
        age: "Age"
      });
      await userEvent.selectOptions(name, "Name");
      await userEvent.selectOptions(email, "Name");
      await waitFor(() =>
        expect(mapper.mapping).toEqual({ name: "Name", email: "Name", age: "Age" })
      );
      await expect(changes).toHaveLength(3);
      await expect(changes[2]!.bubbles).toBe(true);
      await expect(changes[2]!.composed).toBe(true);
      changes[2]!.detail.mapping.name = null;
      await expect(mapper.mapping.name).toBe("Name");
      mapper.columns = ["Email Address", "Age"];
      await mapper.updateComplete;
      await expect(mapper.mapping).toEqual({ name: null, email: null, age: "Age" });
      await expect(name).toHaveAttribute("aria-invalid", "true");
      await expect(email).toHaveAttribute("aria-invalid", "true");
    } finally {
      mapper.removeEventListener("fluid-mapping-change", record);
    }
  }
};

export const NativeParserFixture: Story = { tags: ["!interaction-contract"], render: renderParser };
export const NativeMapperFixture: Story = { tags: ["!interaction-contract"], render: renderMapper };
