import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";

const meta: Meta = {
  title: "Components/Dialog",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <fluid-button
      @click=${(e: Event) => {
        const dialog = (e.target as HTMLElement)
          .closest("[data-story]")
          ?.querySelector<HTMLElement & { show: () => void }>("fluid-dialog");
        dialog?.show();
      }}
    >
      Open dialog
    </fluid-button>
    <div data-story>
      <fluid-dialog>
        <span slot="label">Confirm action</span>
        <p>This will permanently delete the item. This cannot be undone.</p>
        <div slot="footer">
          <fluid-button
            variant="ghost"
            @click=${(e: Event) =>
              (e.target as HTMLElement)
                .closest("fluid-dialog")!
                .dispatchEvent(new CustomEvent("close-request"))}
          >
            Cancel
          </fluid-button>
          <fluid-button>Delete</fluid-button>
        </div>
      </fluid-dialog>
    </div>
  `
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-2);">
      ${(["sm", "md", "lg", "xl"] as const).map(
        (size) => html`
          <fluid-button
            @click=${(e: Event) =>
              (e.target as HTMLElement)
                .closest("[data-story]")
                ?.querySelector<HTMLElement & { show: () => void; size: string }>(
                  `fluid-dialog[data-size="${size}"]`
                )
                ?.show()}
          >
            ${size}
          </fluid-button>
        `
      )}
    </div>
    <div data-story>
      ${(["sm", "md", "lg", "xl"] as const).map(
        (size) => html`
          <fluid-dialog data-size=${size} size=${size}>
            <span slot="label">Size: ${size}</span>
            <p>Dialog at the <strong>${size}</strong> size variant.</p>
          </fluid-dialog>
        `
      )}
    </div>
  `
};
