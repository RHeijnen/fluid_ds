// Side-effect module: load Fluid tokens + brand themes, register the icon set
// and the components the portal uses. Importing a `define/*` module registers
// that custom element; importing a token/theme CSS file injects it (Vite bundles
// it). Consumed once from main.tsx.
//
// Local now via workspace:*. To use the published packages, the specifiers are
// already the public ones — just `pnpm add @fluid-ds/*` from npm.
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

import "@fluid-ds/icons/register-defaults";
import "@fluid-ds/icons/lucide/sun-moon";
import "@fluid-ds/icons/lucide/layout-dashboard";

import "@fluid-ds/components/define/avatar";
import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/breadcrumb";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/dialog";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/progress-bar";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/toast";
import "@fluid-ds/components/define/tooltip";
import "@fluid-ds/components/define/typeahead";

import "@fluid-ds/charts/define/line-chart";
import "@fluid-ds/charts/define/doughnut-chart";
