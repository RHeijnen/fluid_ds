/**
 * Vendor entry. This file imports every Fluid element the admin portal uses
 * (each `define/*` module registers its custom element as a side effect) plus
 * the default icon set. `scripts/build-vendor.mjs` runs Vite over this entry to
 * produce a single self-contained ESM bundle at `public/vendor/fluid.js` (Lit
 * and the other deps inlined), so the buildless page can load the whole library
 * from one file via the import map.
 *
 * This is the "consume the local build" step: Vite resolves `@fluid-ds/*` from
 * the workspace, so we're testing the real packages before they're published.
 * To switch to the CDN later, drop this bundle and point the import map in
 * index.html at jsDelivr / esm.run instead (see the commented block there).
 */
import "@fluid-ds/icons/register-defaults";
// Two icons the portal uses that aren't in the curated default set. Importing a
// lucide module registers that icon as a side effect.
import "@fluid-ds/icons/lucide/sun-moon";
import "@fluid-ds/icons/lucide/layout-dashboard";

import "@fluid-ds/components/define/avatar";
import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/breadcrumb";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/button-group";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/checkbox";
import "@fluid-ds/components/define/dialog";
import "@fluid-ds/components/define/divider";
import "@fluid-ds/components/define/drawer";
import "@fluid-ds/components/define/dropdown";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/number-input";
import "@fluid-ds/components/define/popover";
import "@fluid-ds/components/define/progress-bar";
import "@fluid-ds/components/define/radio";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/skeleton";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/spinner";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tabs";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/textarea";
import "@fluid-ds/components/define/toast";
import "@fluid-ds/components/define/tooltip";
import "@fluid-ds/components/define/typeahead";

// Charts expansion pack (Chart.js-backed). Data is set as the `.data` property
// on each element from the page's mount() code.
import "@fluid-ds/charts/define/line-chart";
import "@fluid-ds/charts/define/bar-chart";
import "@fluid-ds/charts/define/doughnut-chart";
import "@fluid-ds/charts/define/sparkline";
