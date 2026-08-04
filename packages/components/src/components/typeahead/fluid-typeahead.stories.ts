import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../badge/define.js";

const meta: Meta = {
  title: "Components/Forms/Typeahead",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  }
};

export default meta;
type Story = StoryObj;

const COUNTRIES = [
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

export const FromArray: Story = {
  render: () => html`
    <fluid-typeahead
      aria-label="Country"
      placeholder="Pick a country…"
      .options=${COUNTRIES}
      style="max-width: 320px;"
    ></fluid-typeahead>
  `
};

export const FromJSONAttribute: Story = {
  render: () => html`
    <fluid-typeahead
      aria-label="Fruit"
      placeholder="Pick a fruit…"
      options='["Apple","Apricot","Banana","Blackberry","Cherry","Date","Fig"]'
      style="max-width: 320px;"
    ></fluid-typeahead>
  `
};

export const AsyncLoader: Story = {
  render: () => {
    const loader = async (q: string) => {
      if (!q) return [];
      await new Promise((r) => setTimeout(r, 250));
      return Array.from({ length: 5 }, (_, i) => `${q} result ${i + 1}`);
    };
    return html`
      <fluid-typeahead
        aria-label="Search"
        placeholder="Type at least 2 characters…"
        min-query="2"
        debounce="200"
        .loadOptions=${loader}
        style="max-width: 360px;"
      ></fluid-typeahead>
    `;
  }
};

export const StrictSelection: Story = {
  render: () => html`
    <fluid-typeahead
      aria-label="Country"
      placeholder="Must pick from the list…"
      strict
      .options=${COUNTRIES}
      style="max-width: 320px;"
    ></fluid-typeahead>
    <p
      style="margin-top: var(--fluid-space-2); color: var(--fluid-text-secondary); font-size: var(--fluid-font-size-sm);"
    >
      Free text clears on blur, only options from the list are accepted.
    </p>
  `
};

const TERMINALS = [
  { value: "t1", label: "APO0Q25L017092", data: { product: "Apollo CLO Dev", domain: "CURO" } },
  { value: "t2", label: "APO20204800024", data: { product: "Apollo CLO Dev", domain: "PAYTER_RD" } },
  { value: "t3", label: "APO20204800068", data: { product: "Apollo CLO Dev", domain: "CURO" } },
  { value: "t4", label: "APO20213900004", data: { product: "Apollo CLO Dev", domain: "PAYTER" } },
  { value: "t5", label: "APO20222000120", data: { product: "Apollo CLO Dev", domain: "M6" } }
];

export const CustomRows: Story = {
  name: "Custom option rows",
  render: () => html`
    <fluid-typeahead
      aria-label="Terminal"
      placeholder="Search terminals…"
      .options=${TERMINALS}
      .renderOption=${(
        option: { label: string; data?: unknown },
        context: { highlight: (text: string) => unknown }
      ) => {
        const meta = option.data as { product: string; domain: string };
        return html`
          <span>${context.highlight(option.label)}</span>
          <small style="margin-inline-start: var(--fluid-space-2); color: var(--fluid-text-secondary);"
            >${meta.product}</small
          >
          <fluid-badge style="margin-inline-start: auto;">${meta.domain}</fluid-badge>
        `;
      }}
      style="max-width: 520px;"
    ></fluid-typeahead>
    <p
      style="margin-top: var(--fluid-space-2); color: var(--fluid-text-secondary); font-size: var(--fluid-font-size-sm);"
    >
      Options fed as data render a plain label by default. Pass renderOption to draw the row
      instead, so fields stay separate elements rather than one string joined with separators. The
      row is a flex container, so margin-inline-start: auto pushes the trailing badge to the end.
    </p>
  `
};
