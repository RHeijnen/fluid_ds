"use client";

import { useEffect } from "react";
import { captureFluidFormState } from "@fluid-ds/components/ssr-client";

type ContractHost = HTMLElement & {
  checked?: boolean;
  helpText?: string;
  label?: string;
  updateComplete?: Promise<boolean>;
  value?: string;
};

interface NextFluidContract {
  definitionsBeforeRegistration: Record<string, boolean>;
  events: Array<{ type: string; value: string }>;
  hydrated: boolean;
  hydrationError: string | null;
  ready: boolean;
  submissions: Array<Array<[string, FormDataEntryValue]>>;
  assertServerNodes(): number;
  register(): Promise<void>;
  slotAssignments(): Record<string, string[]>;
}

declare global {
  interface Window {
    nextFluid?: NextFluidContract;
  }
}

const tags = ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"] as const;

function assignedIds(host: Element, slotName: string): string[] {
  const selector = slotName ? `slot[name="${slotName}"]` : "slot:not([name])";
  const slot = host.shadowRoot?.querySelector<HTMLSlotElement>(selector);
  return slot?.assignedElements().map((element) => element.id) ?? [];
}

export function ContractClient() {
  useEffect(() => {
    const hosts = new Map(
      tags.map((tag) => {
        const host = document.querySelector<ContractHost>(`#server-contract ${tag}`);
        if (!host?.shadowRoot) throw new Error(`Missing server declarative shadow root: ${tag}`);
        return [tag, { host, shadowRoot: host.shadowRoot }] as const;
      })
    );
    const events: NextFluidContract["events"] = [];
    const submissions: NextFluidContract["submissions"] = [];
    const form = document.querySelector<HTMLFormElement>("#contract-form");
    const output = document.querySelector<HTMLOutputElement>("#contract-output");
    if (!form || !output) throw new Error("Missing Next contract form boundary");

    document.querySelector("#project")?.addEventListener("fluid-input", (event) => {
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      events.push({ type: event.type, value: String(detail?.value ?? "") });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = [...new FormData(form).entries()];
      submissions.push(data);
      output.value = JSON.stringify(data);
    });

    const contract: NextFluidContract = {
      definitionsBeforeRegistration: Object.fromEntries(
        tags.map((tag) => [tag, customElements.get(tag) !== undefined])
      ),
      events,
      hydrated: false,
      hydrationError: null,
      ready: true,
      submissions,
      assertServerNodes() {
        let retained = 0;
        for (const { host, shadowRoot } of hosts.values()) {
          if (host.isConnected && host.shadowRoot === shadowRoot) retained += 1;
        }
        return retained;
      },
      async register() {
        try {
          const restoreFormState = captureFluidFormState(document);
          await Promise.all([
            import("@fluid-ds/components/define/button"),
            import("@fluid-ds/components/define/card"),
            import("@fluid-ds/components/define/checkbox"),
            import("@fluid-ds/components/define/input")
          ]);
          await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
          await restoreFormState();
          await Promise.all(
            [...hosts.values()].map(({ host }) => host.updateComplete ?? Promise.resolve(true))
          );
          if (contract.assertServerNodes() !== tags.length) {
            throw new Error("Next hydration replaced a server host or declarative shadow root");
          }
          contract.hydrated = true;
        } catch (error) {
          contract.hydrationError = String(error instanceof Error ? error.stack : error);
          throw error;
        }
      },
      slotAssignments() {
        const card = hosts.get("fluid-card")?.host;
        const input = hosts.get("fluid-input")?.host;
        if (!card || !input) throw new Error("Missing retained slot hosts");
        return {
          header: assignedIds(card, "header"),
          body: assignedIds(card, ""),
          footer: assignedIds(card, "footer"),
          prefix: assignedIds(input, "prefix")
        };
      }
    };
    window.nextFluid = contract;

    return () => {
      delete window.nextFluid;
    };
  }, []);

  return <output id="contract-output" aria-live="polite" />;
}
