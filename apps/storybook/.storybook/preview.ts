import type { Preview } from "@storybook/web-components";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

// Default icon set so component slots that take a `name="…"` icon
// render properly in stories without each story having to register.
import "@fluid-ds/icons/register-defaults";

// Boot the animation controller + register the 12 default animations so
// the Animations stories (and any per-component story demonstrating an
// animation) can use `data-fluid-animation="…"` directly.
import "@fluid-ds/animations/define/controller";
import "@fluid-ds/animations/register-defaults";

import "./preview.css";

const preview: Preview = {
  parameters: {
    // Sidebar order: core component categories first, then one header per
    // expansion pack (each `@fluid-ds/*` package gets its own top-level group).
    options: {
      storySort: {
        order: [
          // Core package first, with its sub-categories ordered.
          "Components",
          ["Forms", "Layout", "Navigation", "Feedback", "Content", "Utilities"],
          // Then one top-level header per expansion pack.
          "Animations",
          "Scheduler",
          "Charts",
          "Media",
          "Table",
          "Calendar",
          "Editor",
          "Kanban",
          "Map",
          "Parser",
          "QR",
          "*"
        ]
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: { disable: true },
    status: {
      statuses: {
        stable: {
          background: "#16a34a",
          color: "#ffffff",
          description: "Ready for production use."
        },
        beta: {
          background: "#2563eb",
          color: "#ffffff",
          description: "API mostly stable, minor breaking changes possible."
        },
        experimental: {
          background: "#d97706",
          color: "#ffffff",
          description: "Early access. API will change. Do not rely on for production."
        },
        deprecated: {
          background: "#dc2626",
          color: "#ffffff",
          description: "Slated for removal. Use the suggested replacement."
        }
      }
    },
    html: {
      root: "#storybook-root",
      removeEmptyAttributes: true,
      removeComments: true
    }
  },
  globalTypes: {
    brand: {
      description: "Brand preset",
      defaultValue: "default",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default (Blue)" },
          { value: "midnight", title: "Midnight (Violet)" },
          { value: "corporate", title: "Corporate (Slate)" }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-fluid-theme"
    }),
    (story, context) => {
      const brand = (context.globals.brand ?? "default") as string;
      if (brand === "default") {
        document.documentElement.removeAttribute("data-fluid-brand");
      } else {
        document.documentElement.setAttribute("data-fluid-brand", brand);
      }
      return story();
    }
  ]
};

export default preview;
