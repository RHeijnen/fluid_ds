import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidFieldset } from "./fluid-fieldset.js";

describe("<fluid-fieldset>", () => {
  it("renders a native fieldset and legend", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="Account"><input /></fluid-fieldset>`
    );
    const fieldset = el.shadowRoot!.querySelector("fieldset");
    const legend = el.shadowRoot!.querySelector("legend");
    expect(fieldset).to.exist;
    expect(legend).to.exist;
    expect(legend!.textContent?.trim()).to.equal("Account");
  });

  it("uses the legend slot over the attribute", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="Attr"
        ><span slot="legend">Slotted</span><input
      /></fluid-fieldset>`
    );
    const legend = el.shadowRoot!.querySelector("legend")!;
    const legendSlot = legend.querySelector<HTMLSlotElement>('slot[name="legend"]')!;
    // The slot projects the light-DOM legend; textContent cannot cross the shadow
    // boundary, so read the assigned nodes. The attribute text must not leak into
    // the legend's own (fallback) content when the slot is filled.
    const assigned = legendSlot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent)
      .join("");
    expect(assigned).to.contain("Slotted");
    expect(legend.textContent).to.not.contain("Attr");
  });

  it("tracks live legend replacement and removal", async () => {
    const el = await fixture<FluidFieldset>(html`
      <fluid-fieldset><span slot="legend">Original legend</span><input /></fluid-fieldset>
    `);
    const legend = el.shadowRoot!.querySelector("legend")!;
    const slot = legend.querySelector<HTMLSlotElement>('slot[name="legend"]')!;
    expect(
      slot
        .assignedNodes({ flatten: true })
        .map((node) => node.textContent)
        .join("")
    ).to.contain("Original legend");

    const replacement = Object.assign(document.createElement("span"), {
      slot: "legend",
      textContent: "Replacement legend"
    });
    el.querySelector('[slot="legend"]')!.replaceWith(replacement);
    await aTimeout(0);
    await elementUpdated(el);
    expect(
      slot
        .assignedNodes({ flatten: true })
        .map((node) => node.textContent)
        .join("")
    ).to.contain("Replacement legend");
    expect(legend.hidden).to.be.false;

    replacement.remove();
    await aTimeout(0);
    await elementUpdated(el);
    expect(legend.hidden).to.be.true;
  });

  it("hides the legend region when there is no legend", async () => {
    const el = await fixture<FluidFieldset>(html`<fluid-fieldset><input /></fluid-fieldset>`);
    const legend = el.shadowRoot!.querySelector("legend")!;
    expect(legend.hasAttribute("hidden")).to.be.true;
  });

  it("renders the description when set", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L" description="Helpful text"><input /></fluid-fieldset>`
    );
    const desc = el.shadowRoot!.querySelector('[part="description"]');
    expect(desc).to.exist;
    expect(desc!.textContent?.trim()).to.equal("Helpful text");
  });

  it("does not render a description by default", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L"><input /></fluid-fieldset>`
    );
    expect(el.shadowRoot!.querySelector('[part="description"]')).to.be.null;
  });

  it("renders the error with role=alert when set", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L" error="Something went wrong"><input /></fluid-fieldset>`
    );
    const error = el.shadowRoot!.querySelector('[part="error"]')!;
    expect(error).to.exist;
    expect(error.getAttribute("role")).to.equal("alert");
    expect(error.textContent?.trim()).to.equal("Something went wrong");
  });

  it("wires aria-describedby to the description and error ids", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L" description="Desc" error="Err"><input /></fluid-fieldset>`
    );
    const fieldset = el.shadowRoot!.querySelector("fieldset")!;
    const desc = el.shadowRoot!.querySelector('[part="description"]')!;
    const error = el.shadowRoot!.querySelector('[part="error"]')!;
    const described = fieldset.getAttribute("aria-describedby") ?? "";
    expect(described).to.contain(desc.id);
    expect(described).to.contain(error.id);
  });

  it("reflects disabled onto the native fieldset", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L" disabled><input /></fluid-fieldset>`
    );
    expect(el.shadowRoot!.querySelector("fieldset")!.hasAttribute("disabled")).to.be.true;
  });

  it("propagates disabled onto slotted controls", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L"><input id="a" /><input id="b" /></fluid-fieldset>`
    );
    await elementUpdated(el);
    await aTimeout(20);

    el.disabled = true;
    await elementUpdated(el);
    await aTimeout(20);

    const a = el.querySelector<HTMLInputElement>("#a")!;
    const b = el.querySelector<HTMLInputElement>("#b")!;
    expect(a.hasAttribute("disabled")).to.be.true;
    expect(b.hasAttribute("disabled")).to.be.true;
  });

  it("removes propagated disabled when re-enabled but keeps author-disabled controls", async () => {
    const el = await fixture<FluidFieldset>(
      html`<fluid-fieldset legend="L" disabled
        ><input id="a" /><input id="b" disabled
      /></fluid-fieldset>`
    );
    await elementUpdated(el);
    await aTimeout(20);

    el.disabled = false;
    await elementUpdated(el);
    await aTimeout(20);

    const a = el.querySelector<HTMLInputElement>("#a")!;
    const b = el.querySelector<HTMLInputElement>("#b")!;
    expect(a.hasAttribute("disabled")).to.be.false;
    expect(b.hasAttribute("disabled")).to.be.true;
  });

  it("keeps group ownership effective while adopting authored disabled removal", async () => {
    const el = await fixture<FluidFieldset>(html`
      <fluid-fieldset legend="Options" disabled>
        <input id="owned" />
        <input id="authored" disabled />
      </fluid-fieldset>
    `);
    await elementUpdated(el);
    await aTimeout(0);
    const owned = el.querySelector<HTMLInputElement>("#owned")!;
    const authored = el.querySelector<HTMLInputElement>("#authored")!;
    expect(owned.hasAttribute("data-fluid-fieldset-disabled")).to.be.true;

    owned.removeAttribute("disabled");
    authored.removeAttribute("disabled");
    await aTimeout(0);
    expect(owned.disabled).to.be.true;
    expect(authored.disabled).to.be.true;

    el.disabled = false;
    await elementUpdated(el);
    await aTimeout(0);
    expect(owned.disabled).to.be.false;
    expect(authored.disabled).to.be.false;
  });

  it("preserves an authored same-value disabled claim made during group ownership", async () => {
    const el = await fixture<FluidFieldset>(html`
      <fluid-fieldset legend="Options" disabled><input id="control" /></fluid-fieldset>
    `);
    await elementUpdated(el);
    await aTimeout(0);
    const control = el.querySelector<HTMLInputElement>("#control")!;
    expect(control.hasAttribute("data-fluid-fieldset-disabled")).to.be.true;

    control.setAttribute("disabled", "");
    await aTimeout(0);
    el.disabled = false;
    await elementUpdated(el);
    await aTimeout(0);
    expect(control.disabled).to.be.true;
    expect(control.hasAttribute("data-fluid-fieldset-disabled")).to.be.false;
  });

  it("preserves an authored remove-and-readd disabled claim within one observer delivery", async () => {
    const el = await fixture<FluidFieldset>(html`
      <fluid-fieldset legend="Options" disabled><input id="control" /></fluid-fieldset>
    `);
    await elementUpdated(el);
    await aTimeout(0);
    const control = el.querySelector<HTMLInputElement>("#control")!;

    control.removeAttribute("disabled");
    control.setAttribute("disabled", "");
    await aTimeout(0);
    el.disabled = false;
    await elementUpdated(el);
    await aTimeout(0);
    expect(control.disabled).to.be.true;
    expect(control.hasAttribute("data-fluid-fieldset-disabled")).to.be.false;
  });

  it("adopts nested and dynamically inserted controls while disabled", async () => {
    const el = await fixture<FluidFieldset>(html`
      <fluid-fieldset legend="Preferences" disabled>
        <div class="wrapper"><input id="nested" /></div>
      </fluid-fieldset>
    `);
    await elementUpdated(el);
    await aTimeout(0);
    const nested = el.querySelector<HTMLInputElement>("#nested")!;
    expect(nested.disabled).to.be.true;

    const dynamic = document.createElement("fluid-range-slider");
    el.querySelector(".wrapper")!.append(dynamic);
    await aTimeout(0);
    expect(dynamic.hasAttribute("disabled")).to.be.true;
    expect(dynamic.hasAttribute("data-fluid-fieldset-disabled")).to.be.true;

    el.disabled = false;
    await elementUpdated(el);
    expect(nested.disabled).to.be.false;
    expect(dynamic.hasAttribute("disabled")).to.be.false;
    expect(dynamic.hasAttribute("data-fluid-fieldset-disabled")).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidFieldset>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff; --fluid-danger-base:#b91c1c; --fluid-danger-text:#ffffff;"
      >
        <fluid-fieldset legend="Contact details" description="We will only use this to reach you.">
          <label style="display:flex; flex-direction:column; gap:0.25rem;">
            <span>Email</span>
            <input type="email" name="email" />
          </label>
        </fluid-fieldset>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    const fieldset = el.querySelector<FluidFieldset>("fluid-fieldset")!;
    await expect(fieldset).to.be.accessible();
  });
});
