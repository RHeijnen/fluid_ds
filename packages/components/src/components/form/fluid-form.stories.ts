import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../slider/define.js";
import type { FluidForm } from "./fluid-form.js";

type Args = Pick<FluidForm, "novalidate">;

const onSubmit = (e: Event) => {
  const detail = (e as CustomEvent).detail as { values: Record<string, unknown> };
  console.log("fluid-submit", detail.values);
};

const onInvalid = (e: Event) => {
  const detail = (e as CustomEvent).detail as { invalid: HTMLElement };
  console.log("fluid-invalid", detail.invalid);
};

const meta: Meta<Args> = {
  title: "Components/Forms/Form",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    novalidate: { control: "boolean" }
  },
  args: { novalidate: false },
  render: (args) => html`
    <fluid-form
      ?novalidate=${args.novalidate}
      @fluid-submit=${onSubmit}
      @fluid-invalid=${onInvalid}
      style="max-width: 24rem;"
    >
      <label>
        Name
        <input name="name" required placeholder="Ada Lovelace" />
      </label>
      <label>
        Email
        <input name="email" type="email" required placeholder="ada@example.com" />
      </label>
      <button slot="actions" type="submit">Submit</button>
      <button slot="actions" type="reset">Reset</button>
    </fluid-form>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const NoValidate: Story = {
  args: { novalidate: true }
};

export const WithFluidControls: Story = {
  render: () => html`
    <fluid-form @fluid-submit=${onSubmit} @fluid-invalid=${onInvalid} style="max-width: 24rem;">
      <label>
        Username
        <input name="username" required placeholder="ada" />
      </label>
      <label>
        Volume
        <fluid-slider name="volume" value="40" aria-label="Volume"></fluid-slider>
      </label>
      <button slot="actions" type="submit">Save</button>
      <button slot="actions" type="reset">Reset</button>
    </fluid-form>
  `
};
