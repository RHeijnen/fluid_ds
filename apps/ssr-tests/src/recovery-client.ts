import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/accordion";
import "@fluid-ds/components/define/select";
import "@fluid-ds/components/define/dialog";
import "@fluid-ds/components/define/pagination";
import "@fluid-ds/components/define/tabs";

declare global {
  interface Window {
    fluidRecoveryReady: boolean;
    candidateEvents: Array<{ type: string; value: string }>;
    detailsEvents: boolean[];
    tabEvents: string[];
    selectEvents: string[];
    dialogEvents: string[];
    paginationEvents: number[];
  }
}

window.fluidRecoveryReady = true;
