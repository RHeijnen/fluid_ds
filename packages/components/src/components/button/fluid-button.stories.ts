/**
 * Button stories.
 *
 * Storybook surface for `<fluid-button>`. Mirrors the docs site
 * (`/docs/components/button/`) so what a designer sees here matches
 * what's in the documentation, variants, sizes, icon slots, icon-only,
 * disabled, and the accessibility behaviors the component enforces
 * (24x24 target size, aria-label forwarding, reduced-motion).
 */
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "./define.js";
import "../icon/define.js";
import "../dropdown/define.js";
import type { FluidButton, FluidButtonTone } from "./fluid-button.js";

type Args = Pick<
  FluidButton,
  "variant" | "size" | "disabled" | "loading" | "toggle" | "pressed"
> & {
  tone?: FluidButtonTone;
  label: string;
};

const meta: Meta<Args> = {
  title: "Components/Forms/Button",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" },
    docs: {
      description: {
        component: `Primary interactive element. Wraps a native \`<button>\` inside shadow DOM and adds variants, sizes, icon slots, and the WCAG 2.2 AA guarantees (24×24 minimum target size, focus delegation, aria-label forwarding, reduced-motion honoring).`
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary", "ghost"]
    },
    size: {
      control: { type: "inline-radio" },
      options: ["sm", "md", "lg"]
    },
    tone: {
      control: { type: "select" },
      options: ["brand", "neutral", "success", "danger", "warning", "info"]
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    toggle: { control: "boolean" },
    pressed: { control: "boolean" },
    label: { control: "text" }
  },
  args: {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    toggle: false,
    pressed: false,
    label: "Click me"
  },
  render: (args) => html`
    <fluid-button
      variant=${args.variant}
      size=${args.size}
      tone=${ifDefined(args.tone)}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      ?toggle=${args.toggle}
      ?pressed=${args.pressed}
      >${args.label}</fluid-button
    >
  `
};

export default meta;
type Story = StoryObj<Args>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" }
};

export const Ghost: Story = {
  args: { variant: "ghost" }
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: `All three sizes line up at SC 2.5.8, even \`size="sm"\` is now ≥ 24 × 24 CSS pixels (the inner button enforces \`min-block-size: 24px\` / \`min-inline-size: 24px\`).`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center;">
      <fluid-button size="sm">Small</fluid-button>
      <fluid-button size="md">Medium</fluid-button>
      <fluid-button size="lg">Large</fluid-button>
    </div>
  `
};

export const WithPrefixIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: `Drop a \`<fluid-icon>\` into the \`prefix\` slot for icon-then-label buttons. The button auto-tightens the padding on the icon side so the icon doesn't drift away from the edge.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button>
        <fluid-icon slot="prefix" name="download"></fluid-icon>
        Download
      </fluid-button>
      <fluid-button variant="secondary">
        <fluid-icon slot="prefix" name="plus"></fluid-icon>
        New file
      </fluid-button>
      <fluid-button variant="ghost">
        <fluid-icon slot="prefix" name="settings"></fluid-icon>
        Settings
      </fluid-button>
    </div>
  `
};

export const WithSuffixIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: `Trailing icon for "go somewhere" or "show more" affordances.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button>
        Continue
        <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
      </fluid-button>
      <fluid-button variant="secondary">
        Open in new tab
        <fluid-icon slot="suffix" name="external-link"></fluid-icon>
      </fluid-button>
      <fluid-button variant="ghost">
        Cancel
        <fluid-icon slot="suffix" name="x"></fluid-icon>
      </fluid-button>
    </div>
  `
};

export const IconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: `Icon-only buttons MUST carry an \`aria-label\` on the host, the slotted icon is decorative (aria-hidden by default), so without a label the button has no accessible name. The host's aria-label is forwarded to the inner \`<button>\` (SC 4.1.2 Name, Role, Value). Geometry: the button auto-detects the empty default slot, switches to a near-square footprint (\`aspect-ratio: 1 / 1\`), and uses tight symmetric padding.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button size="sm" aria-label="Add item">
        <fluid-icon name="plus"></fluid-icon>
      </fluid-button>
      <fluid-button aria-label="Settings">
        <fluid-icon name="settings"></fluid-icon>
      </fluid-button>
      <fluid-button variant="secondary" aria-label="Close">
        <fluid-icon name="x"></fluid-icon>
      </fluid-button>
      <fluid-button variant="ghost" aria-label="More options">
        <fluid-icon name="ellipsis"></fluid-icon>
      </fluid-button>
      <fluid-button size="lg" aria-label="Save">
        <fluid-icon name="save"></fluid-icon>
      </fluid-button>
    </div>
  `
};

export const IconOnlyWithoutLabel: Story = {
  parameters: {
    docs: {
      description: {
        story: `**Intentional anti-pattern.** This story demonstrates the dev-time \`console.warn\` that fires once per icon-only button missing an accessible name. Open the browser console to see the message. SC 4.1.2.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); align-items:flex-start;">
      <fluid-button>
        <fluid-icon name="plus"></fluid-icon>
      </fluid-button>
      <p style="font-size: 0.85rem; color: var(--fluid-text-secondary); margin: 0;">
        ↑ Open DevTools console, Fluid warns at dev time when an icon-only
        button has no accessible name.
      </p>
    </div>
  `
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const DisabledWithIcons: Story = {
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button disabled>
        <fluid-icon slot="prefix" name="download"></fluid-icon>
        Download
      </fluid-button>
      <fluid-button variant="secondary" disabled>Edit</fluid-button>
      <fluid-button variant="ghost" disabled aria-label="More options">
        <fluid-icon name="ellipsis"></fluid-icon>
      </fluid-button>
    </div>
  `
};

export const FormSubmit: Story = {
  parameters: {
    docs: {
      description: {
        story: `\`type="submit"\` submits the enclosing form like a native button. \`disabled\` blocks the submission.`
      }
    }
  },
  render: () => html`
    <form
      style="display:flex; gap: var(--fluid-space-2); align-items:center;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const out = (e.currentTarget as HTMLFormElement).querySelector("output")!;
        out.textContent = "submitted at " + new Date().toLocaleTimeString();
      }}
    >
      <input
        name="email"
        type="email"
        placeholder="you@example.com"
        style="padding: 6px 8px; border-radius: 6px; border: 1px solid var(--fluid-border-default);"
      />
      <fluid-button type="submit">Subscribe</fluid-button>
      <output style="font-size: 0.85rem; color: var(--fluid-text-secondary);"></output>
    </form>
  `
};

export const Tones: Story = {
  parameters: {
    docs: {
      description: {
        story: `**Semantic action tones.** Bootstrap-style row of solid buttons in every shipped tone. Each tone is theme-independent, switching brand from default to Midnight or Corporate recolors **brand** but leaves success / danger / warning / info stable. Every base + text pair audited to meet WCAG 2.1 AA 1.4.3 (4.5:1).`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button tone="brand">Brand</fluid-button>
      <fluid-button tone="neutral">Neutral</fluid-button>
      <fluid-button tone="success">Success</fluid-button>
      <fluid-button tone="danger">Danger</fluid-button>
      <fluid-button tone="warning">Warning</fluid-button>
      <fluid-button tone="info">Info</fluid-button>
    </div>
  `
};

export const TonesOutline: Story = {
  parameters: {
    docs: {
      description: {
        story: `\`variant="secondary"\` × every tone. Border stays neutral so a row of outline buttons reads as a coherent family; the tone shows in the text + hover tint. To get a tone-colored border too, slide the (existing) \`--fluid-border-default\` CSS variable on the host.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button variant="secondary" tone="brand">Brand</fluid-button>
      <fluid-button variant="secondary" tone="neutral">Neutral</fluid-button>
      <fluid-button variant="secondary" tone="success">Success</fluid-button>
      <fluid-button variant="secondary" tone="danger">Danger</fluid-button>
      <fluid-button variant="secondary" tone="warning">Warning</fluid-button>
      <fluid-button variant="secondary" tone="info">Info</fluid-button>
    </div>
  `
};

export const TonesGhost: Story = {
  parameters: {
    docs: {
      description: {
        story: `\`variant="ghost"\` × every tone. Transparent background, tone-colored text, hover paints a 12%-mix wash in the same tone (color-mix). The default ghost (no tone) is "neutral" and matches the previous gray hover behavior.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button variant="ghost" tone="brand">Brand</fluid-button>
      <fluid-button variant="ghost" tone="neutral">Neutral</fluid-button>
      <fluid-button variant="ghost" tone="success">Success</fluid-button>
      <fluid-button variant="ghost" tone="danger">Danger</fluid-button>
      <fluid-button variant="ghost" tone="warning">Warning</fluid-button>
      <fluid-button variant="ghost" tone="info">Info</fluid-button>
    </div>
  `
};

export const ActionExamples: Story = {
  parameters: {
    docs: {
      description: {
        story: `Realistic combinations a product team would actually ship.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-4); align-items:flex-start;">
      <div style="display:flex; gap: var(--fluid-space-2);">
        <fluid-button tone="danger">
          <fluid-icon slot="prefix" name="trash-2"></fluid-icon>
          Delete account
        </fluid-button>
        <fluid-button variant="ghost">Cancel</fluid-button>
      </div>
      <div style="display:flex; gap: var(--fluid-space-2);">
        <fluid-button tone="success">
          <fluid-icon slot="prefix" name="check"></fluid-icon>
          Approve
        </fluid-button>
        <fluid-button variant="secondary" tone="danger">Reject</fluid-button>
      </div>
      <div style="display:flex; gap: var(--fluid-space-2);">
        <fluid-button variant="secondary" tone="warning">
          <fluid-icon slot="prefix" name="triangle-alert"></fluid-icon>
          Reset to defaults
        </fluid-button>
        <fluid-button variant="ghost" tone="info">
          <fluid-icon slot="prefix" name="info"></fluid-icon>
          Learn more
        </fluid-button>
      </div>
    </div>
  `
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: `Set \`loading\` to show an inline spinner and signal a pending action. The button stays **focusable** (it sets \`aria-disabled\` + \`aria-busy\`, not the native \`disabled\` attribute, so screen-reader users aren't dropped out of the tab order) but ignores clicks while busy. The visible label stays in place, so the accessible name never changes (SC 2.5.3). The spinner honors \`prefers-reduced-motion\`. Works across every variant, tone, and size.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button loading>Saving…</fluid-button>
      <fluid-button variant="secondary" loading>Loading</fluid-button>
      <fluid-button variant="ghost" loading>Refreshing</fluid-button>
      <fluid-button tone="success" loading>Approving</fluid-button>
      <fluid-button size="sm" loading>Small</fluid-button>
      <fluid-button size="lg" loading>Large</fluid-button>
    </div>
  `
};

export const Toggle: Story = {
  parameters: {
    docs: {
      description: {
        story: `Set \`toggle\` to turn the button into an on/off control. It exposes \`aria-pressed\` on the inner button and flips it on each activation (SC 4.1.2), fires a \`fluid-change\` event with \`{ pressed }\` in \`detail\`, and paints a subtle inset "pressed" state. Use \`pressed\` to set the initial state. This is the pattern for mute/unmute, bold/italic in a toolbar, or a favorite star, anything that's binary and lives in place rather than navigating away.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-button toggle>
        <fluid-icon slot="prefix" name="star"></fluid-icon>
        Favorite
      </fluid-button>
      <fluid-button toggle pressed>
        <fluid-icon slot="prefix" name="star"></fluid-icon>
        Favorited
      </fluid-button>
      <fluid-button variant="secondary" toggle aria-label="Show password">
        <fluid-icon name="eye"></fluid-icon>
      </fluid-button>
      <fluid-button variant="ghost" toggle pressed aria-label="Notifications">
        <fluid-icon name="bell"></fluid-icon>
      </fluid-button>
    </div>
  `
};

export const Caret: Story = {
  parameters: {
    docs: {
      description: {
        story: `Set \`caret\` to render a built-in chevron and mark the button as a dropdown/menu trigger, no hand-slotted icon needed. Pair it with a \`<fluid-dropdown>\` (the first example is live: click "Actions"). The chevron rotates 180° while the menu is open, driven by the \`aria-expanded\` the dropdown stamps on the host. A caret with no label collapses to a compact square trigger, the split-button pattern (see Button group).`
      }
    }
  },
  render: () => html`
    <div style="display:flex; gap: var(--fluid-space-3); align-items:center; flex-wrap: wrap;">
      <fluid-dropdown>
        <fluid-button slot="trigger" variant="secondary" caret>Actions</fluid-button>
        <fluid-dropdown-item value="rename">Rename</fluid-dropdown-item>
        <fluid-dropdown-item value="duplicate">Duplicate</fluid-dropdown-item>
        <fluid-dropdown-item type="separator"></fluid-dropdown-item>
        <fluid-dropdown-item value="delete">Delete</fluid-dropdown-item>
      </fluid-dropdown>
      <fluid-button caret>Menu</fluid-button>
      <fluid-button variant="ghost" caret>Options</fluid-button>
      <fluid-button caret aria-label="More options"></fluid-button>
    </div>
  `
};

export const ReducedMotionNote: Story = {
  parameters: {
    docs: {
      description: {
        story: `The button honors \`prefers-reduced-motion: reduce\`, its transitions and the 1-px settle-on-press transform are zeroed for users who opt out of motion. To verify locally: macOS → System Settings → Accessibility → Display → Reduce motion; Windows → Settings → Accessibility → Visual effects → Animation effects off. Refresh this story afterwards: hover transitions and the press effect should be instant.`
      }
    }
  },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap: var(--fluid-space-3); align-items:flex-start;">
      <fluid-button>Default</fluid-button>
      <fluid-button variant="secondary">Secondary</fluid-button>
      <p style="font-size: 0.85rem; color: var(--fluid-text-secondary); margin: 0; max-width: 36rem;">
        Toggle the OS-level "Reduce motion" setting and refresh this story.
        Animation tokens (durations, easings) collapse to instant via
        <code>@media (prefers-reduced-motion: reduce)</code>.
      </p>
    </div>
  `
};
