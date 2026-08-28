// Side-effect module: register the Fluid icon set and the custom elements the
// portal uses. Importing a `define/*` module registers that custom element.
//
// Token + brand-theme CSS is loaded globally via angular.json "styles"
// (base/light/dark from @fluid-ds/tokens, then the midnight + corporate brand
// themes), so this module only registers behaviour. Consumed once from main.ts.
//
// Resolution note: these `@fluid-ds/...` specifiers are aliased to each
// package's BUILT `dist/*.js` via tsconfig `paths` (see tsconfig.json). The
// Fluid packages export Lit TS *source* with NodeNext-style `.js` import
// specifiers + experimental decorators on their default `exports`; Angular's
// esbuild builder does not rewrite those `.js`->`.ts` specifiers, so we point
// at the pre-built JS instead (run the package builds first — `pnpm prebuild`).
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
