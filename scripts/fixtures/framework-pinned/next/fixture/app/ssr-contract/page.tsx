import { ContractClient } from "./contract-client";

export const dynamic = "force-static";

export default async function SsrContractPage() {
  // Load the server shim before definitions so Lit uses Fluid's contextual
  // renderer. The packed lane verifies these imports resolve from published
  // dist entries in the isolated consumer.
  const { renderFluidToString } = await import("@fluid-ds/components/ssr");
  await Promise.all([
    import("@fluid-ds/components/define/button"),
    import("@fluid-ds/components/define/card"),
    import("@fluid-ds/components/define/checkbox"),
    import("@fluid-ds/components/define/input")
  ]);
  const { html } = await import("lit");
  const serverContract = await renderFluidToString(html`
    <fluid-card id="contract-card">
      <h1 id="slot-header" slot="header">Next packed SSR contract</h1>
      <form id="contract-form">
        <fluid-input id="project" name="project" label="Project name" value="Server value" required>
          <span id="slot-prefix" slot="prefix">Prefix</span>
        </fluid-input>
        <fluid-checkbox id="approved" name="approved" value="yes" checked required>
          Approved
        </fluid-checkbox>
        <fluid-button id="save" type="submit">Save project</fluid-button>
        <button id="reset" type="reset">Reset project</button>
      </form>
      <p id="slot-footer" slot="footer">Server footer</p>
    </fluid-card>
  `);

  return (
    <section aria-label="Packed SSR contract">
      <div id="server-contract" dangerouslySetInnerHTML={{ __html: serverContract }} />
      <ContractClient />
    </section>
  );
}
