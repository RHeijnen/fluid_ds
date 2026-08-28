import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type {
  FluidForm,
  FluidFormInvalidDetail,
  FluidFormInvalidEvent,
  FluidFormSubmitDetail,
  FluidFormSubmitEvent
} from "../../index.js";

const repeatedValues: FluidFormSubmitDetail = { values: { tag: ["a", "b"] } };
// @ts-expect-error Form values are strings or string arrays, never numbers.
const invalidSubmitDetail: FluidFormSubmitDetail = { values: { count: 2 } };
void invalidSubmitDetail;

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
    const event = (await oneEvent(el, "fluid-submit")) as FluidFormSubmitEvent;
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
    const event = (await oneEvent(el, "fluid-submit")) as FluidFormSubmitEvent;
    expect(event.detail.values.tag).to.deep.equal(["a", "b"]);
    expect(repeatedValues).to.deep.equal({ values: { tag: ["a", "b"] } });
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
    const event = (await oneEvent(el, "fluid-invalid")) as FluidFormInvalidEvent;
    const detail: FluidFormInvalidDetail = event.detail;
    expect(detail).to.deep.equal({ invalid: email });
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

  it("excludes controls disabled through a native fieldset from validity and values", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="active" value="included" />
        <fieldset disabled>
          <input name="email" type="email" required value="" />
          <input name="ignored" value="excluded" />
        </fieldset>
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    expect(el.checkValidity()).to.be.true;
    setTimeout(() => el.querySelector<HTMLButtonElement>("button")!.click());
    const event = (await oneEvent(el, "fluid-submit")) as FluidFormSubmitEvent;
    expect(event.detail.values).to.deep.equal({ active: "included" });
  });

  it("keeps nested fluid-form controls out of the outer validity and value contract", async () => {
    const outer = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="outer" value="parent" />
        <fluid-form>
          <input name="inner" required value="" />
        </fluid-form>
      </fluid-form>
    `);
    const inner = outer.querySelector<FluidForm>("fluid-form")!;
    expect(outer.checkValidity()).to.be.true;
    expect(inner.checkValidity()).to.be.false;
    setTimeout(() => outer.submit());
    const event = (await oneEvent(outer, "fluid-submit")) as FluidFormSubmitEvent;
    expect(event.detail.values).to.deep.equal({ outer: "parent" });
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

  it("clicking a type=reset action button restores controls to their initial values", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
        <button slot="actions" type="reset">Reset</button>
      </fluid-form>
    `);
    const input = el.querySelector<HTMLInputElement>("input")!;
    input.value = "Grace";
    el.querySelector<HTMLButtonElement>("button[type='reset']")!.click();
    expect(input.value).to.equal("Ada");
  });

  it("pressing Enter in a text input emits fluid-submit", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
      </fluid-form>
    `);
    const input = el.querySelector<HTMLInputElement>("input")!;
    setTimeout(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-submit")) as CustomEvent;
    expect(event.detail.values).to.deep.equal({ first: "Ada" });
  });

  it("does not fire fluid-submit from a former submit button after removal", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
        <button slot="actions" type="submit">Go</button>
      </fluid-form>
    `);
    const button = el.querySelector<HTMLButtonElement>("button")!;
    let submitted = false;
    el.addEventListener("fluid-submit", () => (submitted = true));
    el.remove();
    button.click();
    await aTimeout(20);
    expect(submitted).to.be.false;
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

  it("snapshots values when submission is requested rather than when the queued event runs", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
      </fluid-form>
    `);
    const input = el.querySelector<HTMLInputElement>("input")!;
    const submitted = oneEvent(el, "fluid-submit") as Promise<FluidFormSubmitEvent>;
    el.submit();
    input.value = "Grace";

    expect((await submitted).detail.values).to.deep.equal({ first: "Ada" });
  });

  it("does not deliver a queued submission after the form disconnects", async () => {
    const el = await fixture<FluidForm>(html`
      <fluid-form>
        <input name="first" value="Ada" />
      </fluid-form>
    `);
    let submissions = 0;
    el.addEventListener("fluid-submit", () => submissions++);
    el.submit();
    el.remove();
    await aTimeout(0);

    expect(submissions).to.equal(0);
  });

  it("reconnects without duplicating submit handling and resets live controls", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <fluid-form>
          <input name="first" value="Ada" />
          <button slot="actions" type="submit">Go</button>
        </fluid-form>
      </div>
    `);
    const el = wrapper.querySelector<FluidForm>("fluid-form")!;
    const input = el.querySelector<HTMLInputElement>("input")!;
    const button = el.querySelector<HTMLButtonElement>("button")!;
    el.remove();
    input.value = "Grace";
    wrapper.append(el);
    await el.updateComplete;

    let submissions = 0;
    el.addEventListener("fluid-submit", () => submissions++);
    el.reset();
    expect(input.value).to.equal("Ada");
    button.click();
    await aTimeout(0);
    expect(submissions).to.equal(1);
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
