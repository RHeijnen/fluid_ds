import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import type {
  FluidButton,
  FluidCard,
  FluidCheckbox,
  FluidCheckboxChangeEvent,
  FluidInput,
  FluidInputChangeEvent,
  FluidInputInputEvent
} from "@fluid-ds/components";

type ContractHost = HTMLElement & { updateComplete?: Promise<boolean> };

interface VanillaFluidContract {
  definitionsBeforeRegistration: Record<string, boolean>;
  events: Array<{ type: string; detail: unknown }>;
  ready: boolean;
  registered: boolean;
  registrationError: string | null;
  submissions: Array<Array<[string, FormDataEntryValue]>>;
  preRegistrationProperties: { value: string; label: string };
  references(): Record<string, unknown>;
  register(): Promise<void>;
  setLabel(value: string): Promise<void>;
  setProject(value: string): Promise<void>;
}

declare global {
  interface Window {
    vanillaFluid: VanillaFluidContract;
  }
}

const tags = ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"] as const;
const card = document.querySelector<FluidCard>("#contract-card")!;
const form = document.querySelector<HTMLFormElement>("#contract-form")!;
const project = document.querySelector<FluidInput>("#project")!;
const approved = document.querySelector<FluidCheckbox>("#approved")!;
const save = document.querySelector<FluidButton>("#save")!;
const output = document.querySelector<HTMLOutputElement>("#contract-output")!;
const hosts = [card, project, approved, save];
const events: VanillaFluidContract["events"] = [];
const submissions: VanillaFluidContract["submissions"] = [];

// Direct property writes before definition exercise the platform upgrade path.
project.value = "Direct property before registration";
project.label = "Pre-registration property label";

project.addEventListener("fluid-input", (event) => {
  const fluidEvent = event as FluidInputInputEvent;
  events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
});
project.addEventListener("fluid-change", (event) => {
  const fluidEvent = event as FluidInputChangeEvent;
  events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
});
approved.addEventListener("fluid-change", (event) => {
  const fluidEvent = event as FluidCheckboxChangeEvent;
  events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = [...new FormData(form).entries()];
  submissions.push(values);
  output.value = JSON.stringify(values);
});

const contract: VanillaFluidContract = {
  definitionsBeforeRegistration: Object.fromEntries(
    tags.map((tag) => [tag, customElements.get(tag) !== undefined])
  ),
  events,
  ready: true,
  registered: false,
  registrationError: null,
  submissions,
  preRegistrationProperties: { value: project.value, label: project.label },
  references() {
    return {
      cardMatchesDocument: card === document.querySelector("#contract-card"),
      inputMatchesDocument: project === document.querySelector("#project"),
      checkboxMatchesDocument: approved === document.querySelector("#approved"),
      buttonMatchesDocument: save === document.querySelector("#save")
    };
  },
  async register() {
    try {
      await Promise.all([
        import("@fluid-ds/components/define/button"),
        import("@fluid-ds/components/define/card"),
        import("@fluid-ds/components/define/checkbox"),
        import("@fluid-ds/components/define/input")
      ]);
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      await Promise.all(hosts.map((host: ContractHost) => host.updateComplete));
      contract.registered = true;
    } catch (error) {
      contract.registrationError = String(error instanceof Error ? error.stack : error);
      throw error;
    }
  },
  async setLabel(value: string) {
    project.label = value;
    await project.updateComplete;
  },
  async setProject(value: string) {
    project.value = value;
    await project.updateComplete;
  }
};

window.vanillaFluid = contract;
