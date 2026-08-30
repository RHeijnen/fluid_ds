/**
 * Enables LitElement hydration for server-rendered declarative shadow roots.
 * Import this entry before any Fluid component definition on the client.
 */
import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import type { FluidInput } from "./components/input/fluid-input.js";
import type { FluidCheckbox } from "./components/checkbox/fluid-checkbox.js";
import type { FluidMaskedInput } from "./components/masked-input/fluid-masked-input.js";
import type { FluidNumberInput } from "./components/number-input/fluid-number-input.js";
import type { FluidSlider } from "./components/slider/fluid-slider.js";
import type { FluidSwitch } from "./components/switch/fluid-switch.js";
import type { FluidTextarea } from "./components/textarea/fluid-textarea.js";
import type { FluidTypeahead } from "./components/typeahead/fluid-typeahead.js";

type FluidHydrationRoot = Document | DocumentFragment | Element;
type StatefulControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface ControlState {
  control: StatefulControl;
  value: string;
  checked?: boolean;
  indeterminate?: boolean;
  selected?: boolean[];
  focused: boolean;
  selectionDirection?: "backward" | "forward" | "none" | null;
  selectionEnd?: number | null;
  selectionStart?: number | null;
}

type ValueOwner =
  | FluidInput
  | FluidMaskedInput
  | FluidNumberInput
  | FluidSlider
  | FluidTextarea
  | FluidTypeahead;
interface DraftOwner extends HTMLElement {
  typed: string;
  updateComplete: Promise<boolean>;
}
interface TagInputOwner extends HTMLElement {
  draft: string;
  updateComplete: Promise<boolean>;
}
interface ColorPickerOwner extends HTMLElement {
  value: string;
  updateComplete: Promise<boolean>;
}
interface OtpOwner extends HTMLElement {
  length: number;
  type: "number" | "text";
  value: string;
  updateComplete: Promise<boolean>;
}
type FluidHydrationOwner =
  | ValueOwner
  | FluidCheckbox
  | FluidSwitch
  | DraftOwner
  | TagInputOwner
  | ColorPickerOwner
  | OtpOwner;

const valueOwnerTags = new Set([
  "fluid-input",
  "fluid-masked-input",
  "fluid-number-input",
  "fluid-slider",
  "fluid-textarea",
  "fluid-typeahead"
]);

function deepActiveElement(root: Document | ShadowRoot): Element | null {
  let active = root.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

function collectControls(root: FluidHydrationRoot, controls: StatefulControl[]): void {
  if (root.nodeType === 1) {
    const element = root as Element;
    if (element.matches("input, select, textarea")) controls.push(element as StatefulControl);
    if (element.shadowRoot) collectControls(element.shadowRoot, controls);
  }
  for (const control of root.querySelectorAll<StatefulControl>("input, select, textarea")) {
    controls.push(control);
  }
  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (element.shadowRoot) collectControls(element.shadowRoot, controls);
  }
}

function fluidOwner(control: StatefulControl): FluidHydrationOwner | undefined {
  const root = control.getRootNode();
  const host = root instanceof ShadowRoot ? root.host : undefined;
  if (!host || !host.matches(":defined")) return;
  const parentRoot = host.getRootNode();
  const parentHost = parentRoot instanceof ShadowRoot ? parentRoot.host : undefined;
  if (
    control.localName === "input" &&
    host.localName === "fluid-input" &&
    parentHost?.localName === "fluid-color-picker" &&
    parentHost.matches(":defined")
  ) {
    return parentHost as ColorPickerOwner;
  }
  // Do not guess the value model of composite controls or third-party elements.
  if (control.localName === "input" && valueOwnerTags.has(host.localName)) {
    return host as ValueOwner;
  }
  if (control.localName === "input" && host.localName === "fluid-checkbox") {
    return host as FluidCheckbox;
  }
  if (control.localName === "input" && host.localName === "fluid-switch") {
    return host as FluidSwitch;
  }
  if (control.localName === "textarea" && host.localName === "fluid-textarea") {
    return host as FluidTextarea;
  }
  if (
    control.localName === "input" &&
    ["fluid-date-picker", "fluid-date-range-picker", "fluid-time-picker"].includes(host.localName)
  ) {
    return host as DraftOwner;
  }
  if (control.localName === "input" && host.localName === "fluid-otp") {
    return host as OtpOwner;
  }
  if (control.localName === "input" && host.localName === "fluid-tag-input") {
    return host as TagInputOwner;
  }
}

async function finishUpdates(host: FluidHydrationOwner): Promise<void> {
  // Lit resolves false when updated() scheduled another update.
  for (let pass = 0; pass < 10; pass++) {
    if (await host.updateComplete) return;
  }
  throw new Error(`Form state updates did not settle: ${host.localName}`);
}

/**
 * Captures editable native state before custom element registration and returns
 * an async function to call after definitions load. Await it before using forms.
 * Reconciles supported scalar/boolean Fluid properties, validity and form values
 * through their normal reactive updates, without dispatching synthetic events.
 * Other native controls retain DOM state only; composite Fluid controls need
 * component-specific adapters. Removed nodes are skipped, never replaced.
 */
export function captureFluidFormState(root: FluidHydrationRoot = document): () => Promise<void> {
  const controls: StatefulControl[] = [];
  collectControls(root, controls);
  const ownerDocument = root.nodeType === 9 ? (root as Document) : root.ownerDocument;
  const active = ownerDocument ? deepActiveElement(ownerDocument) : null;
  const states: ControlState[] = controls.map((control) => ({
    control,
    value: control.value,
    checked: control instanceof HTMLInputElement ? control.checked : undefined,
    indeterminate: control instanceof HTMLInputElement ? control.indeterminate : undefined,
    selected:
      control instanceof HTMLSelectElement
        ? [...control.options].map((option) => option.selected)
        : undefined,
    focused: control === active,
    selectionDirection:
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.selectionDirection
        : undefined,
    selectionEnd:
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.selectionEnd
        : undefined,
    selectionStart:
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.selectionStart
        : undefined
  }));

  let restoration: Promise<void> | undefined;
  const restore = async () => {
    const owners = new Set(
      states
        .filter(({ control }) => control.isConnected)
        .map(({ control }) => fluidOwner(control))
        .filter((host) => host !== undefined)
    );
    // First adopt the unchanged server template, then apply the captured edits.
    await Promise.all([...owners].map(finishUpdates));
    const ownerStates = new Map<FluidHydrationOwner, ControlState[]>();
    for (const state of states) {
      if (!state.control.isConnected) continue;
      const host = fluidOwner(state.control);
      if (!host) continue;
      const captured = ownerStates.get(host) ?? [];
      captured.push(state);
      ownerStates.set(host, captured);
    }
    for (const [host, captured] of ownerStates) {
      const state = captured[0]!;
      if (host && valueOwnerTags.has(host.localName)) {
        (host as ValueOwner).value = state.value;
      } else if (host?.localName === "fluid-checkbox") {
        (host as FluidCheckbox).checked = state.checked ?? false;
        (host as FluidCheckbox).indeterminate = state.indeterminate ?? false;
      } else if (host?.localName === "fluid-switch") {
        (host as FluidSwitch).checked = state.checked ?? false;
      } else if (host?.localName === "fluid-color-picker") {
        const raw = state.value.trim();
        (host as ColorPickerOwner).value = raw.startsWith("#") || !raw ? raw : `#${raw}`;
      } else if (
        ["fluid-date-picker", "fluid-date-range-picker", "fluid-time-picker"].includes(
          host.localName
        )
      ) {
        (host as DraftOwner).typed = state.value;
      } else if (host?.localName === "fluid-otp") {
        const otp = host as OtpOwner;
        const combined = captured.map(({ value }) => value).join("");
        otp.value = (
          otp.type === "number" ? combined.replace(/[^0-9]/g, "") : combined.replace(/\s/g, "")
        ).slice(0, otp.length);
      } else if (host?.localName === "fluid-tag-input") {
        (host as TagInputOwner).draft = state.value;
      }
    }
    await Promise.all([...owners].map(finishUpdates));
    for (const state of states) {
      const { control } = state;
      if (!control.isConnected) continue;
      if (!(control instanceof HTMLInputElement && control.type === "file")) {
        control.value = state.value;
      }
      if (control instanceof HTMLInputElement && state.checked !== undefined) {
        control.checked = state.checked;
        control.indeterminate = state.indeterminate ?? false;
      }
      if (control instanceof HTMLSelectElement && state.selected) {
        [...control.options].forEach((option, index) => {
          option.selected = state.selected?.[index] ?? false;
        });
      }
      if (state.focused) {
        control.focus({ preventScroll: true });
        if (
          (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) &&
          typeof state.selectionStart === "number" &&
          typeof state.selectionEnd === "number" &&
          control.selectionStart !== null
        ) {
          control.setSelectionRange(
            state.selectionStart,
            state.selectionEnd,
            state.selectionDirection ?? undefined
          );
        }
      }
    }
  };
  // Repeated calls must not overwrite edits made after hydration.
  return () => (restoration ??= restore());
}
