/**
 * Side-effect entry for the landing. Imports tokens + brand presets,
 * registers the default icon set, then registers every Fluid component
 * the (deliberately component-heavy) marketing page shows off live.
 *
 * The landing dogfoods the library: the page IS the demo, and the theme
 * switcher in the hero re-themes every element below by flipping
 * `data-fluid-brand` / `data-fluid-theme` on <html>.
 */
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";

// Brand presets. Each declares its overrides under `[data-fluid-brand="..."]`,
// so the switcher just toggles the attribute on <html>. (The "neon" brand is
// defined in styles.css, not shipped as a preset.)
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

import "@fluid-ds/icons/register-defaults";
// Extra icons the page uses that aren't in the curated default set.
import "@fluid-ds/icons/lucide/github";
import "@fluid-ds/icons/lucide/sparkles";
import "@fluid-ds/icons/lucide/palette";
import "@fluid-ds/icons/lucide/blocks";
import "@fluid-ds/icons/lucide/mail";
import "@fluid-ds/icons/lucide/wallet";
import "@fluid-ds/icons/lucide/zap";
import "@fluid-ds/icons/lucide/shield-check";
import "@fluid-ds/icons/lucide/arrow-right-left";
import "@fluid-ds/icons/lucide/sun-moon";

import "@fluid-ds/components/define/app-bar";
import "@fluid-ds/components/define/avatar";
import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/breadcrumb";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/button-group";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/checkbox";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/copy-button";
import "@fluid-ds/components/define/description-list";
import "@fluid-ds/components/define/divider";
import "@fluid-ds/components/define/dropdown";
import "@fluid-ds/components/define/fold";
import "@fluid-ds/components/define/hero";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/pagination";
import "@fluid-ds/components/define/progress-bar";
import "@fluid-ds/components/define/progress-ring";
import "@fluid-ds/components/define/rating";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/signature-pad";
import "@fluid-ds/components/define/skeleton";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/stat";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tabs";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/theme-toggle";
import "@fluid-ds/components/define/timeline";
import "@fluid-ds/components/define/tooltip";
import "@fluid-ds/components/define/tour";
import "@fluid-ds/components/define/typeahead";

// Table expansion pack: the demo portal showcases the sortable data grid.
import "@fluid-ds/table/define/infinite-table";

// Charts expansion pack. The line + doughnut on the page read Fluid tokens and
// re-theme themselves when the switcher flips the brand.
import "@fluid-ds/charts/define/line-chart";
import "@fluid-ds/charts/define/doughnut-chart";
import "@fluid-ds/charts/define/sparkline";
