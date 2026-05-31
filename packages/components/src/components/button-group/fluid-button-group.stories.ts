import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import "../button/define.js";
import "../dropdown/define.js";
import "../icon/define.js";
import type { FluidButtonGroup } from "./fluid-button-group.js";

type Args = Pick<FluidButtonGroup, "orientation">;

const meta: Meta<Args> = {
  title: "Components/ButtonGroup",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" },
    docs: {
      description: {
        component: `Visually fuses a row (or column) of buttons into one shape, toolbars, segmented actions, and **split buttons**. The group only does layout + fusion; it stamps position data-attributes onto its member buttons, and each \`<fluid-button>\` flattens its own interior corners. That indirection is what lets a split button's caret trigger fuse even though it lives inside a \`<fluid-dropdown>\`.`
      }
    }
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] }
  },
  args: { orientation: "horizontal" },
  render: (args) => html`
    <fluid-button-group orientation=${args.orientation} aria-label="Format">
      <fluid-button variant="secondary">Bold</fluid-button>
      <fluid-button variant="secondary">Italic</fluid-button>
      <fluid-button variant="secondary">Underline</fluid-button>
    </fluid-button-group>
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" }
};

export const PrimaryEnd: Story = {
  parameters: {
    docs: {
      description: {
        story: `Mixed variants fuse cleanly, the group fuses borders, not colors.`
      }
    }
  },
  render: () => html`
    <fluid-button-group aria-label="Save">
      <fluid-button variant="secondary">Cancel</fluid-button>
      <fluid-button variant="secondary">Save draft</fluid-button>
      <fluid-button>Publish</fluid-button>
    </fluid-button-group>
  `
};

export const SplitButton: Story = {
  parameters: {
    docs: {
      description: {
        story: `**Split button.** A primary action fused to a caret trigger that opens a menu of related actions. The action button (\`Save\`) runs the default action on click; the caret button (\`<fluid-button caret>\`, wrapped in a \`<fluid-dropdown>\`) opens the stylised menu, the same menu surface as \`fluid-select\` / \`fluid-typeahead\`. The group fuses the two into one shape even though the trigger sits inside the dropdown.`
      }
    }
  },
  render: () => html`
    <fluid-button-group aria-label="Save options">
      <fluid-button>Save</fluid-button>
      <fluid-dropdown placement="bottom-end">
        <fluid-button slot="trigger" caret aria-label="More save options"></fluid-button>
        <fluid-dropdown-item value="draft">
          <fluid-icon slot="prefix" name="save"></fluid-icon>
          Save as draft
        </fluid-dropdown-item>
        <fluid-dropdown-item value="copy">
          <fluid-icon slot="prefix" name="copy"></fluid-icon>
          Save a copy
        </fluid-dropdown-item>
        <fluid-dropdown-item type="separator"></fluid-dropdown-item>
        <fluid-dropdown-item value="template">Save as template…</fluid-dropdown-item>
      </fluid-dropdown>
    </fluid-button-group>
  `
};

export const SplitButtonTones: Story = {
  parameters: {
    docs: {
      description: {
        story: `The caret trigger inherits the same \`variant\` + \`tone\` as the action button so the split reads as one control.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-4); align-items:center; flex-wrap: wrap;">
      <fluid-button-group aria-label="Approve options">
        <fluid-button tone="success">Approve</fluid-button>
        <fluid-dropdown placement="bottom-end">
          <fluid-button slot="trigger" tone="success" caret aria-label="More approve options"></fluid-button>
          <fluid-dropdown-item value="approve-comment">Approve with comment…</fluid-dropdown-item>
          <fluid-dropdown-item value="approve-all">Approve all</fluid-dropdown-item>
        </fluid-dropdown>
      </fluid-button-group>

      <fluid-button-group aria-label="Delete options">
        <fluid-button variant="secondary" tone="danger">Delete</fluid-button>
        <fluid-dropdown placement="bottom-end">
          <fluid-button slot="trigger" variant="secondary" tone="danger" caret aria-label="More delete options"></fluid-button>
          <fluid-dropdown-item value="delete-archive">Delete &amp; archive</fluid-dropdown-item>
          <fluid-dropdown-item value="delete-permanent">Delete permanently</fluid-dropdown-item>
        </fluid-dropdown>
      </fluid-button-group>
    </div>
  `
};

export const MenuButton: Story = {
  parameters: {
    docs: {
      description: {
        story: `A standalone **menu button**, a single \`<fluid-button caret>\` that opens the menu (no group, no split). The built-in caret rotates while the menu is open.`
      }
    }
  },
  render: () => html`
    <fluid-dropdown>
      <fluid-button slot="trigger" variant="secondary" caret>Actions</fluid-button>
      <fluid-dropdown-item value="rename">
        <fluid-icon slot="prefix" name="pencil"></fluid-icon>
        Rename
      </fluid-dropdown-item>
      <fluid-dropdown-item value="duplicate">
        <fluid-icon slot="prefix" name="copy"></fluid-icon>
        Duplicate
      </fluid-dropdown-item>
      <fluid-dropdown-item type="separator"></fluid-dropdown-item>
      <fluid-dropdown-item value="delete">
        <fluid-icon slot="prefix" name="trash-2"></fluid-icon>
        Delete
      </fluid-dropdown-item>
    </fluid-dropdown>
  `
};

export const IconToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story: `Icon-only buttons fused into a toolbar. Each carries an \`aria-label\` so screen readers announce it (the icon is decorative).`
      }
    }
  },
  render: () => html`
    <fluid-button-group aria-label="Row actions">
      <fluid-button variant="secondary" aria-label="Edit">
        <fluid-icon name="pencil"></fluid-icon>
      </fluid-button>
      <fluid-button variant="secondary" aria-label="Duplicate">
        <fluid-icon name="copy"></fluid-icon>
      </fluid-button>
      <fluid-button variant="secondary" aria-label="Delete">
        <fluid-icon name="trash-2"></fluid-icon>
      </fluid-button>
    </fluid-button-group>
  `
};
