// Client-only: registers the icon set + component defines. These modules call
// customElements.define and touch `window`, so they MUST NOT run during SSR —
// they're imported via a dynamic import() inside a useEffect (see Shell). The
// token/theme CSS is separate and loaded server-side in app/layout.tsx.
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
