import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

const meta: Meta = {
  title: "Components/Utilities/Hotkey",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  argTypes: {
    keys: { control: "text", description: "Shortcut, e.g. mod+k, shift+?, or the sequence g h." },
    target: {
      control: "select",
      options: ["window", "document"],
      description: "Where the keydown listener attaches."
    },
    preventDefault: { control: "boolean", description: "Call preventDefault on a match." },
    whenInput: { control: "boolean", description: "Also fire while focus is in a text field." }
  }
};

export default meta;
type Story = StoryObj;

const log = (e: CustomEvent): void => {
  const out = (e.target as HTMLElement).parentElement?.querySelector("[data-out]");
  if (out) out.textContent = `Matched "${e.detail.keys}" at ${new Date().toLocaleTimeString()}`;
};

export const Default: Story = {
  args: { keys: "mod+k", target: "window", preventDefault: true, whenInput: false },
  render: (args) => html`
    <div>
      <fluid-hotkey
        keys=${args.keys}
        target=${args.target}
        ?prevent-default=${args.preventDefault}
        ?when-input=${args.whenInput}
        @fluid-hotkey=${log}
      ></fluid-hotkey>
      <p>
        Press <kbd>${args.keys}</kbd> anywhere on the page.
      </p>
      <p data-out style="font-family: monospace;">No match yet.</p>
    </div>
  `
};

export const Sequence: Story = {
  render: () => html`
    <div>
      <fluid-hotkey keys="g h" @fluid-hotkey=${log}></fluid-hotkey>
      <p>
        Press <kbd>g</kbd> then <kbd>h</kbd> in quick succession (a Gmail-style
        sequence).
      </p>
      <p data-out style="font-family: monospace;">No match yet.</p>
    </div>
  `
};

export const ShiftQuestionMark: Story = {
  name: "Shift + ?",
  render: () => html`
    <div>
      <fluid-hotkey keys="shift+?" prevent-default @fluid-hotkey=${log}></fluid-hotkey>
      <p>
        Press <kbd>?</kbd> to open a help overlay, the classic keyboard-shortcut
        cheat sheet trigger.
      </p>
      <p data-out style="font-family: monospace;">No match yet.</p>
    </div>
  `
};

export const WhenInput: Story = {
  name: "Inside inputs",
  render: () => html`
    <div>
      <fluid-hotkey keys="mod+s" prevent-default when-input @fluid-hotkey=${log}></fluid-hotkey>
      <p>
        With <code>when-input</code>, <kbd>mod+s</kbd> fires even while the text
        field below has focus.
      </p>
      <input type="text" placeholder="Focus me, then press mod+s" />
      <p data-out style="font-family: monospace;">No match yet.</p>
    </div>
  `
};
