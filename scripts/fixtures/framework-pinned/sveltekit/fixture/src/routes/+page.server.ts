export async function load() {
  // This load runs during prerender for the configured static adapter. Loading
  // the shim before definitions makes Fluid's contextual Lit renderer active.
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
      <h1 id="slot-header" slot="header">SvelteKit packed SSR contract</h1>
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

  return { serverContract };
}
