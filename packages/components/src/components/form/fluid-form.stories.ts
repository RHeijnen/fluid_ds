import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../field/define.js";
import "../input/define.js";
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
      <fluid-field label="Name" for="form-name" required>
        <fluid-input id="form-name" name="name" required placeholder="Ada Lovelace"></fluid-input>
      </fluid-field>
      <fluid-field
        label="Email"
        for="form-email"
        description="We will send the confirmation to this address."
        required
      >
        <fluid-input
          id="form-email"
          name="email"
          type="email"
          required
          placeholder="ada@example.com"
        ></fluid-input>
      </fluid-field>
      <fluid-button slot="actions" type="submit">Submit</fluid-button>
      <fluid-button slot="actions" type="reset" variant="secondary">Reset</fluid-button>
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
      <fluid-field label="Username" for="form-username" required>
        <fluid-input id="form-username" name="username" required placeholder="ada"></fluid-input>
      </fluid-field>
      <fluid-field label="Volume" description="Choose the playback volume.">
        <fluid-slider name="volume" value="40" aria-label="Volume"></fluid-slider>
      </fluid-field>
      <fluid-button slot="actions" type="submit">Save</fluid-button>
      <fluid-button slot="actions" type="reset" variant="secondary">Reset</fluid-button>
    </fluid-form>
  `
};
