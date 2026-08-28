import { captureFluidFormState } from "@fluid-ds/components/ssr-client";

type UpdatingElement = HTMLElement & {
  isUpdatePending?: boolean;
  updateComplete?: Promise<boolean>;
};

type FluidInputHost = HTMLElement & {
  value: string;
};

interface AstroFluidContract {
  ready: boolean;
  hydrated: boolean;
  hydrationError: string | null;
  definitionsBeforeRegistration: Record<string, boolean>;
  events: Array<{ type: string; value?: string }>;
  submissions: Array<Array<[string, FormDataEntryValue]>>;
  register(): Promise<void>;
  assertServerNodes(): number;
  slotAssignments(): { header: string[]; body: string[]; footer: string[]; prefix: string[] };
}

declare global {
  interface Window {
    astroFluid: AstroFluidContract;
  }
}

const tags = ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"] as const;
const form = document.querySelector<HTMLFormElement>("#contract-form")!;
const project = document.querySelector<FluidInputHost>("#project")!;
const output = document.querySelector<HTMLOutputElement>("#contract-output")!;
const hosts = ["contract-card", "project", "approved", "save"].map(
  (id) => document.querySelector<HTMLElement>(`#${id}`)!
);
const serverNodes = hosts.map((host) => ({
  host,
  root: host.shadowRoot,
  node: host.shadowRoot?.querySelector("input, button, .base")
}));

function updatingElements(root: Document | ShadowRoot): UpdatingElement[] {
  const result: UpdatingElement[] = [];
  for (const element of root.querySelectorAll<UpdatingElement>("*")) {
    if (element.updateComplete) result.push(element);
    if (element.shadowRoot) result.push(...updatingElements(element.shadowRoot));
  }
  return result;
}

async function finishUpdates(): Promise<void> {
  for (let pass = 0; pass < 10; pass++) {
    const elements = updatingElements(document);
    const settled = await Promise.all(elements.map((element) => element.updateComplete));
    if (
      settled.every((result) => result !== false) &&
      updatingElements(document).every((element) => !element.isUpdatePending)
    ) {
      return;
    }
  }
  throw new Error("Astro Fluid hydration did not settle");
}

function assigned(name: string | null, host = hosts[0]!): string[] {
  const selector = name ? `slot[name="${name}"]` : "slot:not([name])";
  return (
    host.shadowRoot
      ?.querySelector<HTMLSlotElement>(selector)
      ?.assignedElements()
      .map((element) => element.id) ?? []
  );
}

const contract: AstroFluidContract = {
  ready: true,
  hydrated: false,
  hydrationError: null,
  definitionsBeforeRegistration: Object.fromEntries(
    tags.map((tag) => [tag, customElements.get(tag) !== undefined])
  ),
  events: [],
  submissions: [],
  async register() {},
  assertServerNodes() {
    for (const { host, root, node } of serverNodes) {
      if (!root || !node || !host.isConnected || host.shadowRoot !== root || !root.contains(node)) {
        throw new Error(`Astro hydration replaced or omitted a server node: ${host.id}`);
      }
    }
    return serverNodes.length;
  },
  slotAssignments() {
    return {
      header: assigned("header"),
      body: assigned(null),
      footer: assigned("footer"),
      prefix: assigned("prefix", project)
    };
  }
};

contract.assertServerNodes();
window.astroFluid = contract;

form.addEventListener("fluid-input", (event) => {
  contract.events.push({
    type: event.type,
    value: (event as CustomEvent<{ value?: string }>).detail?.value
  });
});
form.addEventListener("fluid-change", (event) => {
  contract.events.push({
    type: event.type,
    value: (event as CustomEvent<{ value?: string }>).detail?.value
  });
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  contract.submissions.push([...new FormData(form)]);
  output.value = JSON.stringify(contract.submissions.at(-1));
});

let registration: Promise<void> | undefined;
contract.register = () =>
  (registration ??= (async () => {
    const restoreFormState = captureFluidFormState(document);
    await Promise.all([
      import("@fluid-ds/components/define/button"),
      import("@fluid-ds/components/define/card"),
      import("@fluid-ds/components/define/checkbox"),
      import("@fluid-ds/components/define/input")
    ]);
    await finishUpdates();
    await restoreFormState();
    await finishUpdates();
    contract.assertServerNodes();
    contract.hydrated = true;
  })().catch((error: unknown) => {
    contract.hydrationError = String(error instanceof Error ? error.stack : error);
    throw error;
  }));
