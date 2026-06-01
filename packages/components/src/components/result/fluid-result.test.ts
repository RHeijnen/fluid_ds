import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidResult } from "./fluid-result.js";

describe("<fluid-result>", () => {
  it("renders the title and subtitle", async () => {
    const el = await fixture<FluidResult>(
      html`<fluid-result
        status="success"
        title="Done"
        subtitle="It worked"
      ></fluid-result>`
    );
    const root = el.shadowRoot!;
    expect(root.querySelector(".title")?.textContent?.trim()).to.equal("Done");
    expect(root.querySelector(".subtitle")?.textContent?.trim()).to.equal("It worked");
  });

  it("renders a default status icon when no icon slot is provided", async () => {
    const el = await fixture<FluidResult>(
      html`<fluid-result status="error" title="Oops"></fluid-result>`
    );
    const icon = el.shadowRoot!.querySelector("fluid-icon");
    expect(icon).to.exist;
    expect(icon!.getAttribute("name")).to.equal("result-error");
  });

  it("uses role=status for success / info / 404 (polite)", async () => {
    for (const status of ["success", "info", "404"] as const) {
      const el = await fixture<FluidResult>(
        html`<fluid-result status=${status} title="x"></fluid-result>`
      );
      expect(el.shadowRoot!.querySelector(".base")?.getAttribute("role")).to.equal(
        "status"
      );
    }
  });

  it("uses role=alert for error / warning (assertive)", async () => {
    for (const status of ["error", "warning"] as const) {
      const el = await fixture<FluidResult>(
        html`<fluid-result status=${status} title="x"></fluid-result>`
      );
      expect(el.shadowRoot!.querySelector(".base")?.getAttribute("role")).to.equal(
        "alert"
      );
    }
  });

  it("reflects the status attribute", async () => {
    const el = await fixture<FluidResult>(
      html`<fluid-result status="warning" title="x"></fluid-result>`
    );
    expect(el.getAttribute("status")).to.equal("warning");
  });

  it("omits the title element when title is empty", async () => {
    const el = await fixture<FluidResult>(
      html`<fluid-result status="info"></fluid-result>`
    );
    expect(el.shadowRoot!.querySelector(".title")).to.be.null;
  });

  it("renders extra detail and actions through slots", async () => {
    const el = await fixture<FluidResult>(
      html`<fluid-result status="success" title="Done">
        <p>Extra detail here.</p>
        <button slot="actions">Continue</button>
      </fluid-result>`
    );
    await elementUpdated(el);
    const defaultSlot = el.shadowRoot!.querySelector<HTMLSlotElement>("slot:not([name])")!;
    const actionsSlot = el.shadowRoot!.querySelector<HTMLSlotElement>(
      'slot[name="actions"]'
    )!;
    expect(defaultSlot.assignedElements().length).to.equal(1);
    expect(actionsSlot.assignedElements().length).to.equal(1);
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidResult>(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-success-base:#15803d;
          --fluid-success-text:#ffffff;
          --fluid-danger-base:#b91c1c;
          --fluid-danger-text:#ffffff;
          --fluid-warning-base:#a16207;
          --fluid-info-base:#1d4ed8;
          --fluid-motion:0;
        "
      >
        <fluid-result
          status="success"
          title="Payment successful"
          subtitle="Your order is confirmed."
        >
          <button slot="actions">View order</button>
        </fluid-result>
      </div>
    `);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
