import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidTransfer, FluidTransferItem } from "./fluid-transfer.js";

const items: FluidTransferItem[] = [
  { id: "a", label: "Apple" },
  { id: "b", label: "Banana" },
  { id: "c", label: "Cherry" },
  { id: "d", label: "Date", disabled: true }
];

async function makeTransfer(value: string[] = []): Promise<FluidTransfer> {
  const el = await fixture<FluidTransfer>(html`<fluid-transfer></fluid-transfer>`);
  el.items = items;
  el.value = value;
  await elementUpdated(el);
  return el;
}

const sourceList = (el: FluidTransfer) =>
  el.shadowRoot!.querySelector<HTMLElement>("#transfer-source")!;
const targetList = (el: FluidTransfer) =>
  el.shadowRoot!.querySelector<HTMLElement>("#transfer-target")!;
const moveRightBtn = (el: FluidTransfer) =>
  el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".button")[0]!;
const moveLeftBtn = (el: FluidTransfer) =>
  el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".button")[1]!;
const optionsIn = (list: HTMLElement) =>
  Array.from(list.querySelectorAll<HTMLElement>('[role="option"]'));

describe("<fluid-transfer>", () => {
  it("renders two multi-selectable listboxes", async () => {
    const el = await makeTransfer();
    const lists = el.shadowRoot!.querySelectorAll('[role="listbox"]');
    expect(lists.length).to.equal(2);
    lists.forEach((l) => expect(l.getAttribute("aria-multiselectable")).to.equal("true"));
  });

  it("splits items into source and target by value", async () => {
    const el = await makeTransfer(["b"]);
    expect(optionsIn(sourceList(el)).map((o) => o.textContent?.trim())).to.deep.equal([
      "Apple",
      "Cherry",
      "Date"
    ]);
    expect(optionsIn(targetList(el)).map((o) => o.textContent?.trim())).to.deep.equal([
      "Banana"
    ]);
  });

  it("labels each listbox via aria-labelledby", async () => {
    const el = await fixture<FluidTransfer>(
      html`<fluid-transfer source-label="Available" target-label="Chosen"></fluid-transfer>`
    );
    el.items = items;
    await elementUpdated(el);
    const src = sourceList(el);
    const labelId = src.getAttribute("aria-labelledby")!;
    expect(el.shadowRoot!.getElementById(labelId)?.textContent?.trim()).to.equal("Available");
  });

  it("toggles aria-selected on option click", async () => {
    const el = await makeTransfer();
    const first = optionsIn(sourceList(el))[0]!;
    first.click();
    await elementUpdated(el);
    expect(first.getAttribute("aria-selected")).to.equal("true");
  });

  it("does not select a disabled item", async () => {
    const el = await makeTransfer();
    const disabledOpt = optionsIn(sourceList(el)).find((o) => o.textContent?.trim() === "Date")!;
    disabledOpt.click();
    await elementUpdated(el);
    expect(disabledOpt.getAttribute("aria-selected")).to.equal("false");
  });

  it("moves a selected item to the target and fires fluid-change", async () => {
    const el = await makeTransfer();
    optionsIn(sourceList(el))[0]!.click(); // Apple
    await elementUpdated(el);
    setTimeout(() => moveRightBtn(el).click());
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.value).to.deep.equal(["a"]);
    expect(el.value).to.deep.equal(["a"]);
  });

  it("moves a selected item back to the source", async () => {
    const el = await makeTransfer(["a", "b"]);
    optionsIn(targetList(el))[0]!.click(); // Apple
    await elementUpdated(el);
    moveLeftBtn(el).click();
    await elementUpdated(el);
    expect(el.value).to.deep.equal(["b"]);
  });

  it("disables the move buttons when no movable item is selected", async () => {
    const el = await makeTransfer();
    expect(moveRightBtn(el).disabled).to.be.true;
    expect(moveLeftBtn(el).disabled).to.be.true;
  });

  it("Space toggles selection on the active option", async () => {
    const el = await makeTransfer();
    const list = sourceList(el);
    list.focus();
    await elementUpdated(el);
    list.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await elementUpdated(el);
    expect(optionsIn(list)[0]!.getAttribute("aria-selected")).to.equal("true");
  });

  it("ArrowDown moves the active option and updates aria-activedescendant", async () => {
    const el = await makeTransfer();
    const list = sourceList(el);
    list.focus();
    await elementUpdated(el);
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await elementUpdated(el);
    expect(list.getAttribute("aria-activedescendant")).to.equal("transfer-source-opt-b");
  });

  it("Shift+ArrowDown extends the selection range", async () => {
    const el = await makeTransfer();
    const list = sourceList(el);
    list.focus();
    await elementUpdated(el);
    // active starts at first option (a)
    list.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    list.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true })
    );
    await elementUpdated(el);
    const selected = optionsIn(list)
      .filter((o) => o.getAttribute("aria-selected") === "true")
      .map((o) => o.textContent?.trim());
    expect(selected).to.deep.equal(["Apple", "Banana"]);
  });

  it("serializes the form value to a comma string", async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fluid-transfer name="picks"></fluid-transfer>
      </form>
    `);
    const el = form.querySelector<FluidTransfer>("fluid-transfer")!;
    el.items = items;
    el.value = ["a", "c"];
    await elementUpdated(el);
    const data = new FormData(form);
    expect(data.get("picks")).to.equal("a,c");
  });

  it("does not move when disabled", async () => {
    const el = await makeTransfer(["a"]);
    el.disabled = true;
    await elementUpdated(el);
    expect(moveRightBtn(el).disabled).to.be.true;
    expect(moveLeftBtn(el).disabled).to.be.true;
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture(html`
      <div
        style="
          --fluid-surface-base:#ffffff;
          --fluid-surface-muted:#f4f4f5;
          --fluid-text-primary:#18181b;
          --fluid-text-secondary:#3f3f46;
          --fluid-border-default:#e4e4e7;
          --fluid-accent-base:#4f46e5;
          --fluid-accent-text:#ffffff;
          --fluid-motion:0;
        "
      >
        <fluid-transfer source-label="Available" target-label="Selected"></fluid-transfer>
      </div>
    `);
    const el = wrapper.querySelector<FluidTransfer>("fluid-transfer")!;
    el.items = items;
    el.value = ["b"];
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
