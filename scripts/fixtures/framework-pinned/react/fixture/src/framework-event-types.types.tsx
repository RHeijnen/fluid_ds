import type { ComponentProps, JSX } from "react";
import type {
  FluidCheckboxValueDetail,
  FluidCheckboxChangeEvent,
  FluidSwitchValueDetail,
  FluidSwitchChangeEvent,
  FluidRadioGroupValueDetail,
  FluidRadioGroupChangeEvent,
  FluidSelectValueDetail,
  FluidSelectChangeEvent,
  FluidTextareaValueDetail,
  FluidTextareaInputEvent,
  FluidTextareaChangeEvent,
  FluidTagInputValueDetail,
  FluidTagInputChangeEvent,
  FluidSliderValueDetail,
  FluidSliderInputEvent,
  FluidSliderChangeEvent,
  FluidDialogShowEvent,
  FluidDialogHideEvent,
  FluidDrawerShowEvent,
  FluidDrawerHideEvent,
  FluidPopoverShowEvent,
  FluidPopoverHideEvent
} from "@fluid-ds/components";
import type { FluidCheckbox } from "@fluid-ds/react/checkbox";
import type { FluidSwitch } from "@fluid-ds/react/switch";
import type { FluidRadioGroup } from "@fluid-ds/react/radio-group";
import type { FluidSelect } from "@fluid-ds/react/select";
import type { FluidTextarea } from "@fluid-ds/react/textarea";
import type { FluidTagInput } from "@fluid-ds/react/tag-input";
import type { FluidSlider } from "@fluid-ds/react/slider";
import type { FluidDialog } from "@fluid-ds/react/dialog";
import type { FluidDrawer } from "@fluid-ds/react/drawer";
import type { FluidPopover } from "@fluid-ds/react/popover";
import "@fluid-ds/react/jsx";

// Compiled in the isolated consumer: no workspace-source type imports.
const checkbox: ComponentProps<typeof FluidCheckbox> = {
  onFluidChange: (event) => {
    const actual: FluidCheckboxChangeEvent = event;
    // @ts-expect-error The checked payload retains its actual type.
    const wrong: string = event.detail.checked;
    void actual;
    void wrong;
  }
};
const checkboxNative: JSX.IntrinsicElements["fluid-checkbox"] = {
  "onfluid-change": checkbox.onFluidChange
};
void checkboxNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidCheckbox detail shape.
new CustomEvent<FluidCheckboxValueDetail>("fluid-change", { detail: { checked: "yes" } });

const switchProps: ComponentProps<typeof FluidSwitch> = {
  onFluidChange: (event) => {
    const actual: FluidSwitchChangeEvent = event;
    // @ts-expect-error The checked payload retains its actual type.
    const wrong: string = event.detail.checked;
    void actual;
    void wrong;
  }
};
const switchNative: JSX.IntrinsicElements["fluid-switch"] = {
  "onfluid-change": switchProps.onFluidChange
};
void switchNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidSwitch detail shape.
new CustomEvent<FluidSwitchValueDetail>("fluid-change", { detail: { checked: "yes" } });

const radio_group: ComponentProps<typeof FluidRadioGroup> = {
  onFluidChange: (event) => {
    const actual: FluidRadioGroupChangeEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  }
};
const radio_groupNative: JSX.IntrinsicElements["fluid-radio-group"] = {
  "onfluid-change": radio_group.onFluidChange
};
void radio_groupNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidRadioGroup detail shape.
new CustomEvent<FluidRadioGroupValueDetail>("fluid-change", { detail: { value: 42 } });

const select: ComponentProps<typeof FluidSelect> = {
  onFluidChange: (event) => {
    const actual: FluidSelectChangeEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  }
};
const selectNative: JSX.IntrinsicElements["fluid-select"] = {
  "onfluid-change": select.onFluidChange
};
void selectNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidSelect detail shape.
new CustomEvent<FluidSelectValueDetail>("fluid-change", { detail: { value: 42 } });

const textarea: ComponentProps<typeof FluidTextarea> = {
  onFluidInput: (event) => {
    const actual: FluidTextareaInputEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  },
  onFluidChange: (event) => {
    const actual: FluidTextareaChangeEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  }
};
const textareaNative: JSX.IntrinsicElements["fluid-textarea"] = {
  "onfluid-input": textarea.onFluidInput,
  "onfluid-change": textarea.onFluidChange
};
void textareaNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidTextarea detail shape.
new CustomEvent<FluidTextareaValueDetail>("fluid-input", { detail: { value: 42 } });

const tag_input: ComponentProps<typeof FluidTagInput> = {
  onFluidChange: (event) => {
    const actual: FluidTagInputChangeEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: string = event.detail.value;
    void actual;
    void wrong;
  }
};
const tag_inputNative: JSX.IntrinsicElements["fluid-tag-input"] = {
  "onfluid-change": tag_input.onFluidChange
};
void tag_inputNative;
new CustomEvent<FluidTagInputValueDetail>("fluid-change", {
  // @ts-expect-error Dispatch generic rejects an incompatible FluidTagInput detail shape.
  detail: { value: "csv,is,not,an,array" }
});

const slider: ComponentProps<typeof FluidSlider> = {
  onFluidInput: (event) => {
    const actual: FluidSliderInputEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  },
  onFluidChange: (event) => {
    const actual: FluidSliderChangeEvent = event;
    // @ts-expect-error The value payload retains its actual type.
    const wrong: number = event.detail.value;
    void actual;
    void wrong;
  }
};
const sliderNative: JSX.IntrinsicElements["fluid-slider"] = {
  "onfluid-input": slider.onFluidInput,
  "onfluid-change": slider.onFluidChange
};
void sliderNative;
// @ts-expect-error Dispatch generic rejects an incompatible FluidSlider detail shape.
new CustomEvent<FluidSliderValueDetail>("fluid-input", { detail: { value: 42 } });

const dialog: ComponentProps<typeof FluidDialog> = {
  onFluidShow: (event) => {
    const actual: FluidDialogShowEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  },
  onFluidHide: (event) => {
    const actual: FluidDialogHideEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  }
};
const dialogNative: JSX.IntrinsicElements["fluid-dialog"] = {
  "onfluid-show": dialog.onFluidShow,
  "onfluid-hide": dialog.onFluidHide
};
void dialogNative;

const drawer: ComponentProps<typeof FluidDrawer> = {
  onFluidShow: (event) => {
    const actual: FluidDrawerShowEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  },
  onFluidHide: (event) => {
    const actual: FluidDrawerHideEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  }
};
const drawerNative: JSX.IntrinsicElements["fluid-drawer"] = {
  "onfluid-show": drawer.onFluidShow,
  "onfluid-hide": drawer.onFluidHide
};
void drawerNative;

const popover: ComponentProps<typeof FluidPopover> = {
  onFluidShow: (event) => {
    const actual: FluidPopoverShowEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  },
  onFluidHide: (event) => {
    const actual: FluidPopoverHideEvent = event;
    // @ts-expect-error Lifecycle detail is null, not a close-reason object.
    const wrong: string = event.detail.reason;
    void actual;
    void wrong;
  }
};
const popoverNative: JSX.IntrinsicElements["fluid-popover"] = {
  "onfluid-show": popover.onFluidShow,
  "onfluid-hide": popover.onFluidHide
};
void popoverNative;
