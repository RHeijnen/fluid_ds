/**
 * Registers every Fluid element the portal uses, straight from the CDN.
 *
 * There is NO build step here: each bare specifier below is resolved by the
 * `<script type="importmap">` in index.html to a jsDelivr URL (the published
 * `@fluid-ds/*@alpha` packages), and importing a `define.js` registers its
 * custom element as a side effect. This is the real "consume from the CDN"
 * path an end user would write, the only Fluid-specific setup is the import
 * map itself.
 */
import "@fluid-ds/icons/register-defaults.js";
// Two icons the portal uses that aren't in the curated default set. Importing
// a lucide module registers that icon as a side effect.
import "@fluid-ds/icons/lucide/sun-moon.js";
import "@fluid-ds/icons/lucide/layout-dashboard.js";

import "@fluid-ds/components/avatar/define.js";
import "@fluid-ds/components/badge/define.js";
import "@fluid-ds/components/breadcrumb/define.js";
import "@fluid-ds/components/button/define.js";
import "@fluid-ds/components/button-group/define.js";
import "@fluid-ds/components/callout/define.js";
import "@fluid-ds/components/card/define.js";
import "@fluid-ds/components/checkbox/define.js";
import "@fluid-ds/components/dialog/define.js";
import "@fluid-ds/components/divider/define.js";
import "@fluid-ds/components/drawer/define.js";
import "@fluid-ds/components/dropdown/define.js";
import "@fluid-ds/components/icon/define.js";
import "@fluid-ds/components/input/define.js";
import "@fluid-ds/components/number-input/define.js";
import "@fluid-ds/components/popover/define.js";
import "@fluid-ds/components/progress-bar/define.js";
import "@fluid-ds/components/radio/define.js";
import "@fluid-ds/components/segmented-control/define.js";
import "@fluid-ds/components/select/define.js";
import "@fluid-ds/components/skeleton/define.js";
import "@fluid-ds/components/slider/define.js";
import "@fluid-ds/components/spinner/define.js";
import "@fluid-ds/components/steps/define.js";
import "@fluid-ds/components/switch/define.js";
import "@fluid-ds/components/tabs/define.js";
import "@fluid-ds/components/tag/define.js";
import "@fluid-ds/components/textarea/define.js";
import "@fluid-ds/components/toast/define.js";
import "@fluid-ds/components/tooltip/define.js";
import "@fluid-ds/components/typeahead/define.js";

// Charts expansion pack (Chart.js-backed). Data is set as the `.data` property
// on each element from the page's mount() code.
import "@fluid-ds/charts/line-chart/define.js";
import "@fluid-ds/charts/bar-chart/define.js";
import "@fluid-ds/charts/doughnut-chart/define.js";
import "@fluid-ds/charts/sparkline/define.js";
