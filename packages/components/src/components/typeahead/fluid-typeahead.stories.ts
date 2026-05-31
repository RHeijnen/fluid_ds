import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Typeahead",
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
