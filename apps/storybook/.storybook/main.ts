import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|ts)",
    "../../../packages/components/src/**/*.stories.@(js|ts)",
    "../../../packages/charts/src/**/*.stories.@(js|ts)",
    "../../../packages/animations/src/**/*.stories.@(js|ts)",
    "../../../packages/qr/src/**/*.stories.@(js|ts)",
    "../../../packages/parser/src/**/*.stories.@(js|ts)",
    "../../../packages/scheduler/src/**/*.stories.@(js|ts)",
    "../../../packages/media/src/**/*.stories.@(js|ts)",
    "../../../packages/table/src/**/*.stories.@(js|ts)",
    "../../../packages/calendar/src/**/*.stories.@(js|ts)",
    "../../../packages/editor/src/**/*.stories.@(js|ts)",
    "../../../packages/kanban/src/**/*.stories.@(js|ts)",
    "../../../packages/map/src/**/*.stories.@(js|ts)"
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
    "storybook-addon-pseudo-states",
    "@etchteam/storybook-addon-status",
    "@whitespace/storybook-addon-html"
  ],
  framework: {
    name: "@storybook/web-components-vite",
    options: {}
  },
  docs: {
    autodocs: "tag"
  }
};

export default config;
