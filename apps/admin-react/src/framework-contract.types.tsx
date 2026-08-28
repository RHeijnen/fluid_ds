import type { ComponentProps, JSX } from "react";
import { createRef } from "react";
import type {
  FluidInput as InputElement,
  FluidInputValueDetail,
  FluidInputInputEvent,
  FluidInputChangeEvent,
  FluidTypeaheadInputEvent,
  FluidTypeaheadChangeEvent,
  TypeaheadOption,
  FluidButtonChangeEvent,
  FluidButtonClickEvent
} from "@fluid-ds/components";
import type { FluidInput } from "@fluid-ds/react/input";
import type { FluidTypeahead } from "@fluid-ds/react/typeahead";
import type { FluidButton } from "@fluid-ds/react/button";
import "@fluid-ds/react/jsx";

// Compile-only assertions run in the isolated packed consumer's own typecheck.
const native: JSX.IntrinsicElements["fluid-input"] = {
  "onfluid-change": (event) => {
    const value: string = event.detail.value;
    // @ts-expect-error Input change is not a button toggle payload.
    void event.detail.pressed;
    void value;
  }
};
const wrapper: ComponentProps<typeof FluidInput> = {
  ref: createRef<InputElement>(),
  value: "typed",
  required: true,
  onFluidChange: (event) => {
    const value: string = event.detail.value;
    // @ts-expect-error A typed input value is not a number.
    const invalidValue: number = event.detail.value;
    void value;
    void invalidValue;
  }
};
const options: ComponentProps<typeof FluidTypeahead> = {
  options: [{ value: "nl", label: "Netherlands" }],
  onFluidInput: (event) => {
    const value: string = event.detail.value;
    // @ts-expect-error Query input does not include a selected option.
    void event.detail.option;
    void value;
  },
  onFluidChange: (event) => {
    const option: TypeaheadOption = event.detail.option;
    const label: string = event.detail.label;
    // @ts-expect-error Application option data deliberately remains unknown.
    const region: string = option.data.region;
    void label;
    void region;
  }
};
const button: ComponentProps<typeof FluidButton> = {
  onFluidChange: (event) => {
    const pressed: boolean = event.detail.pressed;
    // @ts-expect-error Button change does not promise an input value.
    void event.detail.value;
    void pressed;
  },
  onFluidClick: (event) => {
    const detail: null = event.detail;
    event.preventDefault();
    // @ts-expect-error Activation detail is null, not a pressed object.
    void event.detail.pressed;
    void detail;
  }
};
const unverified: JSX.IntrinsicElements["fluid-color-picker"] = {
  "onfluid-change": (event) => {
    // @ts-expect-error Untyped catalog payloads must not silently become any.
    void event.detail.value;
  }
};
// Public event aliases must be importable from the packed package, not source paths.
const eventTypes: [
  FluidInputInputEvent,
  FluidInputChangeEvent,
  FluidTypeaheadInputEvent,
  FluidTypeaheadChangeEvent,
  FluidButtonChangeEvent,
  FluidButtonClickEvent
] = [
  new CustomEvent("fluid-input", { detail: { value: "a" } }),
  new CustomEvent("fluid-change", { detail: { value: "a" } }),
  new CustomEvent("fluid-input", { detail: { value: "query" } }),
  new CustomEvent("fluid-change", {
    detail: {
      value: "nl",
      label: "Netherlands",
      option: { value: "nl", label: "Netherlands", data: { region: "EU" } }
    }
  }),
  new CustomEvent("fluid-change", { detail: { pressed: true } }),
  new CustomEvent("fluid-click", { detail: null, cancelable: true })
];
// The same detail generic used at dispatch must reject incompatible payloads.
// @ts-expect-error Explicit input dispatch contract rejects a numeric value.
new CustomEvent<FluidInputValueDetail>("fluid-input", { detail: { value: 42 } });
// @ts-expect-error Native JSX must not promise the wrapper's mapped event spelling.
native.onFluidChange = () => {};
// @ts-expect-error Wrapper value is a string property, not an arbitrary attribute.
wrapper.value = 42;
// @ts-expect-error Refs point to FluidInput, not a native button.
wrapper.ref = createRef<HTMLButtonElement>();
// @ts-expect-error Complex properties must not be passed as serialized JSON strings.
options.options = '["Netherlands"]';
void native;
void wrapper;
void options;
void button;
void unverified;
void eventTypes;
