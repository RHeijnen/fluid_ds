import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidField } from "./fluid-field.js";

describe("<fluid-field>", () => {
  it("renders the label text in a <label>", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" for="e"><input id="e" /></fluid-field>`
    );
    const label = el.shadowRoot!.querySelector("label")!;
    expect(label).to.exist;
    expect(label.textContent).to.contain("Email");
    expect(label.getAttribute("for")).to.equal("e");
  });

  it("does not render a description when none is set", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email"><input /></fluid-field>`
    );
    expect(el.shadowRoot!.querySelector('[part="description"]')).to.be.null;
  });

  it("renders the description and links it via aria-describedby", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" description="Help text"
        ><input
      /></fluid-field>`
    );
    await elementUpdated(el);
    const desc = el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
    expect(desc).to.exist;
    expect(desc.textContent).to.contain("Help text");
    const input = el.querySelector("input")!;
    expect(input.getAttribute("aria-describedby")).to.equal(desc.id);
  });

  it("renders the error with role=alert and sets aria-invalid", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" error="Required"><input /></fluid-field>`
    );
    await elementUpdated(el);
    const err = el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
    expect(err).to.exist;
    expect(err.getAttribute("role")).to.equal("alert");
    const input = el.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).to.equal("true");
    expect(input.getAttribute("aria-describedby")).to.equal(err.id);
  });

  it("describes by both description and error when both are present", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" description="Help" error="Bad"
        ><input
      /></fluid-field>`
    );
    await elementUpdated(el);
    const desc = el.shadowRoot!.querySelector<HTMLElement>('[part="description"]')!;
    const err = el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
    const input = el.querySelector("input")!;
    expect(input.getAttribute("aria-describedby")).to.equal(`${desc.id} ${err.id}`);
  });

  it("clears aria-invalid and aria-describedby when the error is removed", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" error="Bad"><input /></fluid-field>`
    );
    await elementUpdated(el);
    el.error = "";
    await elementUpdated(el);
    const input = el.querySelector("input")!;
    expect(input.hasAttribute("aria-invalid")).to.be.false;
    expect(input.hasAttribute("aria-describedby")).to.be.false;
  });

  it("reflects required and shows a visual indicator plus sr-only text", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field label="Email" required><input /></fluid-field>`
    );
    expect(el.hasAttribute("required")).to.be.true;
    const indicator = el.shadowRoot!.querySelector<HTMLElement>('[part="required"]')!;
    expect(indicator).to.exist;
    expect(indicator.getAttribute("aria-hidden")).to.equal("true");
    expect(el.shadowRoot!.querySelector(".sr-only")!.textContent).to.contain("required");
  });

  it("supports rich slotted label, description, and error content", async () => {
    const el = await fixture<FluidField>(
      html`<fluid-field>
        <span slot="label">Name</span>
        <span slot="description">Your full name</span>
        <input />
        <span slot="error">Required</span>
      </fluid-field>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="label"]')).to.exist;
    expect(el.shadowRoot!.querySelector('[part="description"]')).to.exist;
    const err = el.shadowRoot!.querySelector<HTMLElement>('[part="error"]')!;
    expect(err).to.exist;
    expect(err.getAttribute("role")).to.equal("alert");
    const input = el.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).to.equal("true");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-danger-base:#b91c1c;
          --fluid-danger-text:#ffffff;
        "
      >
        <fluid-field
          label="Email"
          description="We'll never share it."
          error="Enter a valid email."
          required
          for="audit-email"
        >
          <input id="audit-email" type="email" />
        </fluid-field>
      </div>
    `);
    const field = el.querySelector<FluidField>("fluid-field")!;
    await elementUpdated(field);
    await aTimeout(20);
    await expect(field).to.be.accessible();
  });
});
