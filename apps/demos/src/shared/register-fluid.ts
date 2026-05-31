/**
 * Side-effect entry that every demo imports first. Registers the
 * default icon set and every Fluid component the demos rely on.
 *
 * Splitting the imports into this single module (rather than inlining
 * them in each demo) lets Vite hoist them into a shared chunk, each
 * demo HTML entry pays for the registration once, then loads its
 * own page-specific JS on top.
 */
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";

// Brand presets. Each CSS file declares its overrides under a
// `[data-fluid-brand="<name>"]` selector, so the picker just toggles
// the attribute on <html> and the right block wins by specificity.
// Without these imports the `data-fluid-brand` attribute lands on the
// page but has no styles to apply, so switching brands does nothing.
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

import "@fluid-ds/icons/register-defaults";

import "@fluid-ds/components/define/accordion";
import "@fluid-ds/components/define/avatar";
import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/breadcrumb";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/button-group";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/carousel";
import "@fluid-ds/components/define/checkbox";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/color-picker";
import "@fluid-ds/components/define/comparison";
import "@fluid-ds/components/define/copy-button";
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
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tabs";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/textarea";
import "@fluid-ds/components/define/toast";
import "@fluid-ds/components/define/tooltip";

import "@fluid-ds/charts/define/bar-chart";
import "@fluid-ds/charts/define/line-chart";
import "@fluid-ds/charts/define/doughnut-chart";
import "@fluid-ds/charts/define/sparkline";
