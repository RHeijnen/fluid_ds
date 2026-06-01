import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidForm } from "./fluid-form.js";

describe("<fluid-form>", () => {
  it("renders an inner native form", async () => {
    const el = await fixture<FluidForm>(html`<fluid-form></fluid-form>`);
    const inner = el.shadowRoot!.querySelector("form");
    expect(inner).to.exist;
    expect(inner!.getAttribute("part")).to.equal("base");
    expect(el.nativeForm).to.equal(inner);
  });

  it("emits fluid-submit with FormData-derived values when valid", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
        <input name="last" value="Lovelace" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    const button = el.querySelector("button")!;
    setTimeout(() => button.click());
    const event = (await oneEvent(el, "fluid-submit")) as CustomEvent;
    expect(event.detail.values).to.deep.equal({ first: "Ada", last: "Lovelace" });
  });

  it("collapses repeated field names into an array", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="tag" value="a" />
        <input name="tag" value="b" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    const button = el.querySelector("button")!;
    setTimeout(() => button.click());
    const event = (await oneEvent(el, "fluid-submit")) as CustomEvent;
    expect(event.detail.values.tag).to.deep.equal(["a", "b"]);
  });

  it("emits fluid-invalid and focuses the first invalid control when invalid", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
        <input name="email" type="email" required value="" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    const button = el.querySelector("button")!;
    const email = el.querySelector<HTMLInputElement>("input[name='email']")!;
    setTimeout(() => button.click());
    const event = (await oneEvent(el, "fluid-invalid")) as CustomEvent;
    expect(event.detail.invalid).to.equal(email);
    expect(el.ownerDocument.activeElement).to.equal(email);
  });

  it("does NOT emit fluid-submit when a control is invalid", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="email" type="email" required value="" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    let submitted = false;
    el.addEventListener("fluid-submit", () => (submitted = true));
    el.querySelector("button")!.click();
    await aTimeout(20);
    expect(submitted).to.be.false;
  });

  it("skips the validity gate when novalidate is set", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form novalidate>
        <input name="email" type="email" required value="" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    el.querySelector("button")!.click();
    const event = (await oneEvent(el, "fluid-submit")) as CustomEvent;
    expect(event.detail.values).to.deep.equal({ email: "" });
  });

  it("reset() restores controls to their initial values", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
      </fluid-form>
    `);
    const input = el.querySelector<HTMLInputElement>("input")!;
    input.value = "Grace";
    el.reset();
    expect(input.value).to.equal("Ada");
  });

  it("checkValidity() reflects child control validity", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="email" type="email" required value="" />
      </fluid-form>
    `);
    await elementUpdated(el);
    expect(el.checkValidity()).to.be.false;
    el.querySelector<HTMLInputElement>("input")!.value = "ada@example.com";
    expect(el.checkValidity()).to.be.true;
  });

  it("submit() drives the same gate as a user submit", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
      </fluid-form>
    `);
    setTimeout(() => el.submit());
    const event = (await oneEvent(el, "fluid-submit")) as CustomEvent;
    expect(event.detail.values).to.deep.equal({ first: "Ada" });
  });

  it("the actions region exposes part=actions", async () => {
    const el = await fixture<FluidForm>(html`<fluid-form></fluid-form>`);
    expect(el.shadowRoot!.querySelector("[part='actions']")).to.exist;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidForm>(html`
      <div
        style="
          --fluid-surface-base:#ffffff; --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff; --fluid-success-base:#16a34a;
          --fluid-success-text:#ffffff; --fluid-danger-base:#dc2626;
          --fluid-danger-text:#ffffff; --fluid-warning-base:#f59e0b;"
      >
        <fluid-form>
          <label>
            Name
            <input name="name" required />
          </label>
          <button slot="actions" type="submit">Submit</button>
        </fluid-form>
      </div>
    `);
    const form = el.querySelector<FluidForm>("fluid-form")!;
    await elementUpdated(form);
    await aTimeout(20);
    await expect(form).to.be.accessible();
  });
});
