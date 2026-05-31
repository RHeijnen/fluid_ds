/**
 * Side-effect entry for the landing. Imports tokens, registers the
 * default icon set, then registers every Fluid component the
 * landing actually uses. Kept tight so the bundle stays under control.
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

import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/button-group";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/comparison";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tag";
