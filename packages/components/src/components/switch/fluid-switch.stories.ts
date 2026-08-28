import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import type { FluidSwitch } from "./fluid-switch.js";

type Args = Pick<FluidSwitch, "checked" | "disabled" | "required"> & { label: string };

const meta: Meta<Args> = {
  title: "Components/Forms/Switch",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    label: { control: "text" }
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    label: "Enable notifications"
  },
  render: (args) => html`
    <fluid-switch ?checked=${args.checked} ?disabled=${args.disabled} ?required=${args.required}>
      ${args.label}
    </fluid-switch>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3);">
      <fluid-switch>Off</fluid-switch>
      <fluid-switch checked>On</fluid-switch>
      <fluid-switch disabled>Disabled (off)</fluid-switch>
      <fluid-switch disabled checked>Disabled (on)</fluid-switch>
    </div>
  `
};

export const NoLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<fluid-switch aria-label="Toggle"></fluid-switch>`
};

export const WithDescription: Story = {
  args: { label: "Send me product updates" },
  render: (args) => html`
    <fluid-field description="Occasional release notes and product announcements.">
      <fluid-switch .checked=${args.checked} ?disabled=${args.disabled} ?required=${args.required}>
        ${args.label}
      </fluid-switch>
    </fluid-field>
  `
};

export const InAForm: Story = {
  args: { checked: false, disabled: false, required: true, label: "Enable security alerts" },
  render: (args) => html`
    <form
      style="display:grid; gap:var(--fluid-space-3); max-width:380px;"
      @submit=${(event: Event) => event.preventDefault()}
    >
      <fluid-field
        label="Account notifications"
        description="Security alerts are recommended for every account."
        ?required=${args.required}
      >
        <fluid-switch
          name="security-alerts"
          .checked=${args.checked}
          ?disabled=${args.disabled}
          ?required=${args.required}
          aria-label=${args.label}
          @invalid=${(event: Event) => {
            const control = event.currentTarget as FluidSwitch;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            field.error = control.validationMessage;
          }}
          @fluid-change=${(event: Event) => {
            const control = event.currentTarget as FluidSwitch;
            const field = control.closest("fluid-field") as HTMLElement & { error: string };
            if (control.checked || !control.required) field.error = "";
          }}
        >
          ${args.label}
        </fluid-switch>
      </fluid-field>
      <fluid-button style="justify-self:start;" type="submit">Save preferences</fluid-button>
    </form>
  `
};
