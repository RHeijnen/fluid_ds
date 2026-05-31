// Register the default icon set up front.
import "@fluid-ds/icons/register-defaults";

// Register every component used in the playground.
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
import "@fluid-ds/components/define/file-input";
import "@fluid-ds/components/define/format-bytes";
import "@fluid-ds/components/define/format-date";
import "@fluid-ds/components/define/format-number";
import "@fluid-ds/components/define/icon";
import "@fluid-ds/components/define/include";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/intersection-observer";
import "@fluid-ds/components/define/mutation-observer";
import "@fluid-ds/components/define/number-input";
import "@fluid-ds/components/define/page";
import "@fluid-ds/components/define/popover";
import "@fluid-ds/components/define/popup";
import "@fluid-ds/components/define/progress-bar";
import "@fluid-ds/components/define/progress-ring";
import "@fluid-ds/components/define/radio";
import "@fluid-ds/components/define/rating";
import "@fluid-ds/components/define/relative-time";
import "@fluid-ds/components/define/resize-observer";
import "@fluid-ds/components/define/scroller";
import "@fluid-ds/components/define/segmented-control";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/skeleton";
import "@fluid-ds/components/define/slider";
import "@fluid-ds/components/define/spinner";
import "@fluid-ds/components/define/split-panel";
import "@fluid-ds/components/define/steps";
import "@fluid-ds/components/define/switch";
import "@fluid-ds/components/define/tabs";
import "@fluid-ds/components/define/tag";
import "@fluid-ds/components/define/textarea";
import "@fluid-ds/components/define/toast";
import "@fluid-ds/components/define/tooltip";
import "@fluid-ds/components/define/tree";
import "@fluid-ds/components/define/typeahead";

// Expansion packs.
import "@fluid-ds/charts/define/chart";
import "@fluid-ds/charts/define/bar-chart";
import "@fluid-ds/charts/define/line-chart";
import "@fluid-ds/charts/define/pie-chart";
import "@fluid-ds/charts/define/doughnut-chart";
import "@fluid-ds/charts/define/scatter-chart";
import "@fluid-ds/charts/define/bubble-chart";
import "@fluid-ds/charts/define/radar-chart";
import "@fluid-ds/charts/define/polar-area-chart";
import "@fluid-ds/charts/define/sparkline";
import "@fluid-ds/markdown/define";
// `fluid-animation` exists in @fluid-ds/media for programmatic transitions but
// isn't surfaced in the playground, animation knobs will be built into each
// component's own transitions instead of being a separate primitive.
import "@fluid-ds/media/define/animated-image";
import "@fluid-ds/media/define/video";
import "@fluid-ds/media/define/video-playlist";
import "@fluid-ds/media/define/zoomable-frame";
import "@fluid-ds/qr/define";

import "./playground.js";
