/**
 * Side-effect entry for the wizard. Loads tokens + brand presets, registers
 * the default icon set, and pulls in only the Fluid components the wizard
 * chrome itself uses. Step content can import additional defines as needed.
 */
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";

import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

import "@fluid-ds/icons/register-defaults";

import "@fluid-ds/components/define/badge";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/callout";
import "@fluid-ds/components/define/card";
import "@fluid-ds/components/define/code-block";
import "@fluid-ds/components/define/color-picker";
import "@fluid-ds/components/define/copy-button";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/typeahead";
