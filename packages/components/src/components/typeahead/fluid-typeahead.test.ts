import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTypeahead } from "./fluid-typeahead.js";

const FRUITS = ["Apple", "Apricot", "Banana", "Blackberry", "Cherry", "Cranberry", "Date"];

describe("<fluid-typeahead>", () => {
  it("platform focus reaches the combobox without the JavaScript focus override", async () => {
    const el = await fixture<FluidTypeahead>(
      html`<fluid-typeahead label="Search"></fluid-typeahead>`
    );
    HTMLElement.prototype.focus.call(el);
    expect(el.shadowRoot!.activeElement).to.equal(el.shadowRoot!.querySelector("input"));
  });

  it("forwards its form name to the internal combobox for autofill metadata", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead name="domain" aria-label="Domain" .options=${FRUITS}></fluid-typeahead>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.id).to.equal("input");
    expect(input.name).to.equal("domain");
  });

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

  it("marks the aria-activedescendant option as aria-selected (APG contract)", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    el.focus();
    const input = el.shadowRoot!.querySelector("input")!;
    // Open and move the active highlight to the second option.
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await el.updateComplete;

    const activeId = input.getAttribute("aria-activedescendant");
    expect(activeId).to.be.a("string");
    const activeOption = el.shadowRoot!.querySelector(`#${activeId}`)!;
    // The option referenced by aria-activedescendant must be aria-selected.
    expect(activeOption.getAttribute("aria-selected")).to.equal("true");
    expect(activeOption).to.have.class("active");

    // Every other option must report aria-selected="false".
    const others = Array.from(el.shadowRoot!.querySelectorAll(".option")).filter(
      (o) => o.id !== activeId
    );
    for (const o of others) {
      expect(o.getAttribute("aria-selected")).to.equal("false");
    }
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
    el.shadowRoot!.querySelector("input")!.dispatchEvent(new Event("input", { bubbles: true }));
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
    const opts = Array.from(el.shadowRoot!.querySelectorAll(".option")).map((o) =>
      o.textContent?.trim()
    );
    expect(opts).to.deep.equal(["foo-result-1", "foo-result-2"]);
  });

  it("Escape closes the listbox", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" .options=${FRUITS}></fluid-typeahead>
    `);
    el.open = true;
    await el.updateComplete;
    el.shadowRoot!.querySelector("input")!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
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

  it("reports valueMissing when required and empty", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead
        required
        name="fruit"
        aria-label="Fruit"
        .options=${FRUITS}
      ></fluid-typeahead>
    `);
    await el.updateComplete;
    expect(el.validity.valueMissing).to.equal(true);
    expect(el.checkValidity()).to.equal(false);

    el.value = "Apple";
    await el.updateComplete;
    expect(el.validity.valid).to.equal(true);
  });

  it("keeps an untouched required field visually neutral, then shows and clears invalid state", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead
        required
        name="fruit"
        aria-label="Fruit"
        .options=${FRUITS}
      ></fluid-typeahead>
    `);
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const wrap = el.shadowRoot!.querySelector<HTMLElement>(".input-wrap")!;

    expect(wrap).not.to.have.class("invalid");
    expect(input.getAttribute("aria-invalid")).to.equal("false");
    input.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(wrap).to.have.class("invalid");
    expect(input.getAttribute("aria-invalid")).to.equal("true");
    el.value = "Apple";
    await el.updateComplete;
    expect(wrap).not.to.have.class("invalid");
    expect(input.getAttribute("aria-invalid")).to.equal("false");
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

  it("component-scoped sizing and typography hooks stay isolated to typeahead", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead size="sm" aria-label="x" .options=${FRUITS}></fluid-typeahead>
    `);
    el.style.setProperty("--fluid-typeahead-height-sm", "44px");
    el.style.setProperty("--fluid-typeahead-font-size-sm", "13px");
    el.style.setProperty("--fluid-typeahead-padding-x-sm", "17px");
    await el.updateComplete;

    const wrap = el.shadowRoot!.querySelector<HTMLElement>(".input-wrap")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(wrap.getBoundingClientRect().height).to.equal(44);
    expect(getComputedStyle(wrap).fontSize).to.equal("13px");
    expect(getComputedStyle(input).paddingInlineStart).to.equal("17px");
  });

  it("renders slotted prefix and suffix as full-height affixes", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="x" .options=${FRUITS}>
        <span slot="prefix">Find</span>
        <span slot="suffix">Global</span>
      </fluid-typeahead>
    `);
    await el.updateComplete;

    const wrap = el.shadowRoot!.querySelector<HTMLElement>(".input-wrap")!;
    const prefix = el.shadowRoot!.querySelector<HTMLElement>(".prefix")!;
    const suffix = el.shadowRoot!.querySelector<HTMLElement>(".suffix")!;
    expect(prefix.hidden).to.equal(false);
    expect(suffix.hidden).to.equal(false);
    expect(prefix.getBoundingClientRect().height).to.equal(wrap.getBoundingClientRect().height);
    expect(suffix.getBoundingClientRect().height).to.equal(wrap.getBoundingClientRect().height);
    expect(getComputedStyle(wrap).overflow).to.equal("hidden");
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
  describe("keep-open", () => {
    const openWith = async (el: FluidTypeahead, query: string) => {
      const input = el.shadowRoot!.querySelector("input")!;
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await aTimeout(260);
      await el.updateComplete;
    };
    const pickFirst = async (el: FluidTypeahead) => {
      el.shadowRoot!.querySelector<HTMLElement>(".option")!.click();
      await el.updateComplete;
    };

    it("closes and adopts the label by default", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead aria-label="Fruit" debounce="0" .options=${FRUITS}></fluid-typeahead>
      `);
      await openWith(el, "Ap");
      await pickFirst(el);
      expect(el.open).to.be.false;
      expect(el.value).to.equal("Apple");
    });

    it("stays open and leaves the query alone when gathering several", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Fruit"
          keep-open
          debounce="0"
          .options=${FRUITS}
        ></fluid-typeahead>
      `);
      await openWith(el, "Ap");
      await pickFirst(el);
      // Closing after every pick would mean reopening and retyping to add the
      // next one, and taking the label would throw away the search that found
      // this one.
      expect(el.open).to.be.true;
      expect(el.value).to.equal("Ap");
      expect(el.shadowRoot!.querySelectorAll(".option").length).to.be.greaterThan(0);
    });

    it("still reports every pick", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Fruit"
          keep-open
          debounce="0"
          .options=${FRUITS}
        ></fluid-typeahead>
      `);
      await openWith(el, "Ap");
      const picked: string[] = [];
      el.addEventListener("fluid-change", (event) => {
        picked.push((event as CustomEvent<{ value: string }>).detail.value);
      });
      const rows = el.shadowRoot!.querySelectorAll<HTMLElement>(".option");
      const first = rows[0];
      const second = rows[1];
      if (!first || !second) throw new Error("Expected both matching fruit options");
      first.click();
      await el.updateComplete;
      second.click();
      await el.updateComplete;
      expect(picked).to.deep.equal(["Apple", "Apricot"]);
    });

    it("still closes on Escape", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Fruit"
          keep-open
          debounce="0"
          .options=${FRUITS}
        ></fluid-typeahead>
      `);
      await openWith(el, "Ap");
      const input = el.shadowRoot!.querySelector("input")!;
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await el.updateComplete;
      // Staying open is about picking, not about refusing to be dismissed.
      expect(el.open).to.be.false;
    });
  });

  describe("renderOption", () => {
    const TERMINALS = [
      { value: "t1", label: "APO0Q25L017092", data: { product: "Apollo CLO Dev", domain: "CURO" } },
      {
        value: "t2",
        label: "APO20204800024",
        data: { product: "Apollo CLO Dev", domain: "PAYTER_RD" }
      }
    ];

    const open = async (el: FluidTypeahead, query: string) => {
      const input = el.shadowRoot!.querySelector("input")!;
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await aTimeout(260);
      await el.updateComplete;
    };

    it("draws each row from the callback instead of the label", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Terminal"
          debounce="0"
          .options=${TERMINALS}
          .renderOption=${(option: { label: string; data?: unknown }) => html`
            <span class="serial">${option.label}</span>
            <small class="domain">${(option.data as { domain: string }).domain}</small>
          `}
        ></fluid-typeahead>
      `);
      await open(el, "APO");
      const rows = el.shadowRoot!.querySelectorAll(".option");
      expect(rows).to.have.lengthOf(2);
      const first = rows[0];
      if (!first) throw new Error("Expected a rendered terminal option");
      expect(first.querySelector(".serial")!.textContent).to.equal("APO0Q25L017092");
      // Data an option carries alongside its label is what a row is usually
      // built from; pasting it into the label was the only way before.
      expect(first.querySelector(".domain")!.textContent).to.equal("CURO");
    });

    it("hands the row its position, state and the query", async () => {
      const seen: Array<Record<string, unknown>> = [];
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Terminal"
          debounce="0"
          .options=${TERMINALS}
          .renderOption=${(option: { label: string }, context: Record<string, unknown>) => {
            seen.push({
              label: option.label,
              index: context.index,
              active: context.active,
              query: context.query
            });
            return html`${option.label}`;
          }}
        ></fluid-typeahead>
      `);
      await open(el, "APO");
      // The renderer runs on every render, so only the most recent pass
      // describes what is on screen now.
      const latest = seen.slice(-TERMINALS.length);
      expect(latest.map((row) => row.index)).to.deep.equal([0, 1]);
      expect(latest.every((row) => row.query === "APO")).to.be.true;
      expect(latest.filter((row) => row.active)).to.have.lengthOf(1);
    });

    it("offers the same match highlighting the default row uses", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead
          aria-label="Terminal"
          debounce="0"
          .options=${TERMINALS}
          .renderOption=${(
            option: { label: string },
            context: { highlight: (t: string) => unknown }
          ) => html`<span class="wrapped">${context.highlight(option.label)}</span>`}
        ></fluid-typeahead>
      `);
      await open(el, "APO");
      // A custom row still wants the query marked somewhere, so the highlighter
      // is handed over rather than reimplemented by every consumer.
      const match = el.shadowRoot!.querySelector(".option .wrapped .match")!;
      expect(match.textContent).to.equal("APO");
    });

    it("falls back to the highlighted label when no callback is given", async () => {
      const el = await fixture<FluidTypeahead>(html`
        <fluid-typeahead aria-label="Fruit" debounce="0" .options=${FRUITS}></fluid-typeahead>
      `);
      await open(el, "Ap");
      const row = el.shadowRoot!.querySelector(".option")!;
      expect(row.textContent!.trim()).to.equal("Apple");
      expect(row.querySelector(".match")!.textContent).to.equal("Ap");
    });
  });
});

describe("<fluid-typeahead> opening onto the whole list", () => {
  it("opens on click so a zero min-query field behaves like a select", async () => {
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead aria-label="Fruit" min-query="0" .options=${FRUITS}></fluid-typeahead>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.dispatchEvent(new Event("focus"));
    await el.updateComplete;
    // Focus alone does not open: tabbing through a form would drop a list on
    // every field it passed.
    expect(el.open).to.be.false;

    input.click();
    await el.updateComplete;
    expect(el.open).to.be.true;
    expect(el.shadowRoot!.querySelectorAll(".option").length).to.equal(FRUITS.length);
  });

  it("asks for the list again after one has been chosen", async () => {
    // The chosen label sits in the field, and the field is the query. Loading
    // is guarded against results for anything but the last thing typed, and a
    // label arriving by selection rather than by keystroke used to fail that
    // guard, so the reload was dropped: reopening showed whatever the last
    // keystroke had narrowed the list to, however the value had changed since.
    const asked: string[] = [];
    const el = await fixture<FluidTypeahead>(html`
      <fluid-typeahead
        aria-label="Fruit"
        min-query="0"
        debounce="0"
        .loadOptions=${(query: string) => {
          asked.push(query);
          return FRUITS.filter((fruit) => fruit.toLowerCase().includes(query.trim().toLowerCase()));
        }}
      ></fluid-typeahead>
    `);
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "Ban";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await aTimeout(20);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".option").length).to.equal(1);

    (el.shadowRoot!.querySelector(".option") as HTMLElement).click();
    await el.updateComplete;
    expect(el.value).to.equal("Banana");

    asked.length = 0;
    input.click();
    await aTimeout(20);
    await el.updateComplete;
    expect(el.open).to.be.true;
    expect(asked).to.deep.equal(["Banana"]);
  });
});
