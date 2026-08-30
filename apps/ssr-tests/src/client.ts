import { captureFluidFormState } from "@fluid-ds/components/ssr-client";

declare global {
  interface Window {
    hydrateFluid(): Promise<void>;
    assertFluidServerNodes(): number;
    fluidHydrated: boolean;
    fluidHydrationError: string | null;
    fluidHydrationMismatches: string[];
    fluidFormEvents: { type: string; id: string; detail: unknown }[];
    fluidSubmissions: [string, FormDataEntryValue][][];
  }
}

const registrations = import.meta.glob([
  "../../../packages/**/src/**/define.ts",
  "../../../packages/**/src/define/*.ts"
]);
const localeRegistrations = import.meta.glob(
  "../../../packages/components/src/locales/{nl,de,fr,es,ar}.ts"
);

window.fluidHydrated = false;
window.fluidHydrationError = null;
window.fluidHydrationMismatches = [];
window.fluidFormEvents = [];
window.fluidSubmissions = [];
let activeRegistration = "before registration";
function recordHydrationMessage(message: string): void {
  if (/hydrat|mismatch/i.test(message)) {
    window.fluidHydrationMismatches.push(`${activeRegistration}: ${message}`);
  }
}
window.addEventListener("error", (event) => recordHydrationMessage(event.message));
window.addEventListener("unhandledrejection", (event) =>
  recordHydrationMessage(String(event.reason?.message ?? event.reason))
);
for (const level of ["error", "warn"] as const) {
  const original = console[level].bind(console);
  console[level] = (...values: unknown[]) => {
    recordHydrationMessage(values.map(String).join(" "));
    original(...values);
  };
}

const form = document.querySelector<HTMLFormElement>("#hydration-form")!;
const adoptionForm = document.querySelector<HTMLFormElement>("#adoption-form")!;
const compositeAdoptionForm = document.querySelector<HTMLFormElement>("#composite-adoption-form")!;
for (const target of [form, adoptionForm, compositeAdoptionForm]) {
  for (const type of ["fluid-input", "fluid-change"]) {
    target.addEventListener(type, (event) => {
      window.fluidFormEvents.push({
        type,
        id: (event.target as HTMLElement).id,
        detail: (event as CustomEvent).detail
      });
    });
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  window.fluidSubmissions.push([...new FormData(form)]);
});

// These are actual parser-created DSD nodes, captured before registration.
// Checking only shadowRoot presence also passes after destructive re-rendering.
const stateFixture = document.querySelector<HTMLElement>("#state-fixture")!;
const serverNodeIds = [
  "stateful",
  "choice",
  "amount",
  "contact",
  "action",
  "adopt-masked",
  "adopt-number",
  "adopt-slider",
  "adopt-switch",
  "adopt-textarea",
  "adopt-typeahead",
  "adopt-color",
  "adopt-date",
  "adopt-date-range",
  "adopt-otp",
  "adopt-tags",
  "adopt-time",
  "localized-pagination"
];
const serverNodes = serverNodeIds
  .map((id) => stateFixture.querySelector<HTMLElement>(`#${id}`)!)
  .map((host) => ({
    host,
    root: host.shadowRoot,
    control: host.shadowRoot?.querySelector("input, textarea, button")
  }));
window.assertFluidServerNodes = () => {
  for (const { host, root, control } of serverNodes) {
    if (
      !root ||
      !control ||
      !host.isConnected ||
      host.shadowRoot !== root ||
      !root.contains(control)
    ) {
      throw new Error(`Hydration replaced or omitted a server control: ${host.id}`);
    }
  }
  return serverNodes.length;
};
window.assertFluidServerNodes();

type UpdatingElement = HTMLElement & {
  updateComplete?: Promise<boolean>;
  isUpdatePending?: boolean;
};
function updatingElements(root: Document | ShadowRoot): UpdatingElement[] {
  const elements: UpdatingElement[] = [];
  for (const element of root.querySelectorAll<UpdatingElement>("*")) {
    if (element.updateComplete) elements.push(element);
    if (element.shadowRoot) elements.push(...updatingElements(element.shadowRoot));
  }
  return elements;
}

async function finishUpdates(): Promise<void> {
  for (let pass = 0; pass < 10; pass++) {
    const results = await Promise.all(
      updatingElements(document).map((element) => element.updateComplete)
    );
    if (
      results.every((result) => result !== false) &&
      updatingElements(document).every((element) => !element.isUpdatePending)
    )
      return;
  }
  throw new Error(`Hydration updates did not settle: ${activeRegistration}`);
}

async function hydrate(): Promise<void> {
  const restoreFormState = captureFluidFormState(document);
  for (const load of Object.values(localeRegistrations)) await load();
  for (const [module, load] of Object.entries(registrations)) {
    activeRegistration = module;
    await load();
  }
  // A registered nested element can remain defer-hydration until its parent
  // definition loads. Waiting globally inside the registration loop deadlocks.
  activeRegistration = "settling registered elements";
  await finishUpdates();
  activeRegistration = "restoring form state";
  await restoreFormState();
  await finishUpdates();
  window.assertFluidServerNodes();
  if (window.fluidHydrationMismatches.length)
    throw new Error(window.fluidHydrationMismatches.join("\n"));
  window.fluidHydrated = true;
  window.dispatchEvent(new Event("fluid-hydrated"));
}

let hydration: Promise<void> | undefined;
window.hydrateFluid = () =>
  (hydration ??= hydrate().catch((error: unknown) => {
    window.fluidHydrationError = String(error);
    throw error;
  }));
if (new URLSearchParams(location.search).get("hydrate") !== "manual") void window.hydrateFluid();
