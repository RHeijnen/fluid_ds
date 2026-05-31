import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTypeahead } from "./fluid-typeahead.js";

const FRUITS = ["Apple", "Apricot", "Banana", "Blackberry", "Cherry", "Cranberry", "Date"];

describe("<fluid-typeahead>", () => {
  it("accepts options as an array property", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    await el.updateComplete;
    expect(el.options).to.have.lengthOf(7);
  });

  it("accepts options as a JSON-string attribute", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" options='["A","B","C"]'></fluid-typeahead>
    `);
    await el.updateComplete;
    expect(el.options).to.deep.equal(["A", "B", "C"]);
  });

  it("opens and filters on typing", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "Ap";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    const opts = el.shadowRoot!.querySelectorAll(".option");
    expect(opts.length).to.equal(2);
  });

  it("highlights the matching substring in labels", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    // Simulate user typing, set the input element's value and fire the
    // native input event so the component goes through the same path it
    // would for real keystrokes.
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "Ap";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    const match = el.shadowRoot!.querySelector(".option .match");
    expect(match?.textContent).to.equal("Ap");
  });

  it("commits an option on Enter", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    el.focus();
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "Ban";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    setTimeout(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("Banana");
    expect(el.value).to.equal("Banana");
    expect(el.open).to.be.false;
  });

  it("ArrowDown opens and moves through options", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    el.focus();
    const input = el.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.true;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    const active = el.shadowRoot!.querySelector(".option.active");
    expect(active?.textContent?.trim()).to.equal("Apricot");
  });

  it("supports objects with {value, label}", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead
        aria-label="Country"
        .options=${[
          { value: "us", label: "United States" },
          { value: "uk", label: "United Kingdom" }
        ]}
      ></fluid-typeahead>
    `);
    el.value = "United";
    el.shadowRoot!
      .querySelector("input")!
      .dispatchEvent(new Event("input", { bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".option").length).to.equal(2);
  });

  it("calls loadOptions for async data with debounce", async () => {
    const loader = async (q: string) => [`${q}-result-1`, `${q}-result-2`];
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Search" .loadOptions=${loader} debounce="0"></fluid-typeahead>
    `);
    el.focus();
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "foo";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await aTimeout(30);
    await el.updateComplete;
    const opts = Array.from(el.shadowRoot!.querySelectorAll(".option")).map(
      (o) => o.textContent?.trim()
    );
    expect(opts).to.deep.equal(["foo-result-1", "foo-result-2"]);
  });

  it("Escape closes the listbox", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    el.open = true;
    await el.updateComplete;
    el.shadowRoot!
      .querySelector("input")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await el.updateComplete;
    expect(el.open).to.be.false;
  });

  it("strict mode clears free text on blur", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" strict .options=${FRUITS}></fluid-typeahead>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "not a fruit";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(el.value).to.equal("");
  });

  it("participates in form submission", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-typeahead
          name="fruit"
          aria-label="Fruit"
          value="Apple"
          .options=${FRUITS}
        ></fluid-typeahead>
      </form>
    `);
    const data = new FormData(form);
    expect(data.get("fruit")).to.equal("Apple");
  });

  it("passes a11y audit (closed)", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("input-wrap background reads the --fluid-typeahead-* override ladder", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="x" .options=${FRUITS}></fluid-typeahead>
    `);
    el.style.setProperty("--fluid-typeahead-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const wrap = el.shadowRoot!.querySelector<HTMLElement>(".input-wrap")!;
    expect(getComputedStyle(wrap).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("field min-height respects --fluid-target-min (AAA scaling)", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead size="sm" aria-label="x" .options=${FRUITS}></fluid-typeahead>
    `);
    el.style.setProperty("--fluid-target-min", "60px");
    await el.updateComplete;
    const wrap = el.shadowRoot!.querySelector<HTMLElement>(".input-wrap")!;
    expect(wrap.getBoundingClientRect().height).to.be.greaterThanOrEqual(60);
  });
});
