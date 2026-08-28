import { aTimeout, expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import type { FluidOption } from "./fluid-option.js";
import type { FluidSelect } from "./fluid-select.js";

describe("<fluid-option>", () => {
  it("establishes its option role and a stable generated id", async () => {
    const el = await fixture<FluidOption>(html`<fluid-option>Apple</fluid-option>`);
    expect(el.getAttribute("role")).to.equal("option");
    expect(el.id).to.match(/^fluid-option-/);
    expect(el.label).to.equal("Apple");
  });

  it("keeps selected and disabled ARIA state synchronized", async () => {
    const el = await fixture<FluidOption>(html`<fluid-option>Apple</fluid-option>`);
    el.selected = true;
    el.disabled = true;
    await el.updateComplete;
    expect(el.getAttribute("aria-selected")).to.equal("true");
    expect(el.getAttribute("aria-disabled")).to.equal("true");
    el.selected = false;
    el.disabled = false;
    await el.updateComplete;
    expect(el.getAttribute("aria-selected")).to.equal("false");
    expect(el.getAttribute("aria-disabled")).to.equal("false");
  });

  it("passes an a11y audit in its required listbox context", async () => {
    const el = await fixture(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="apple">Apple</fluid-option>
      </fluid-select>
    `);
    await expect(el).to.be.accessible();
  });

  it("selected background reads the --fluid-option-selected-bg override", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    el.style.setProperty("--fluid-option-selected-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    expect(getComputedStyle(el).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("selected foreground reads the --fluid-option-selected-fg override", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    el.style.setProperty("--fluid-option-selected-fg", "rgb(4, 5, 6)");
    await el.updateComplete;
    expect(getComputedStyle(el).color).to.equal("rgb(4, 5, 6)");
  });

  it("selected default background is a theme-aware accent tint, not raw brand-50", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option value="apple" selected>Apple</fluid-option>
    `);
    await el.updateComplete;
    // The fallback resolves through --fluid-accent-base via color-mix, so it
    // must NOT paint the raw light brand-50 primitive (#eff6ff). Regression
    // guard for the dark-theme contrast break.
    expect(getComputedStyle(el).backgroundColor).to.not.equal("rgb(239, 246, 255)");
  });

  it("isolates option geometry, typography, state and disabled styling", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option
        selected
        disabled
        style="
          --fluid-option-padding-block: 7px;
          --fluid-option-padding-inline: 13px;
          --fluid-option-font-family: serif;
          --fluid-option-font-size: 17px;
          --fluid-option-radius: 9px;
          --fluid-option-selected-bg: rgb(1, 2, 3);
          --fluid-option-selected-font-weight: 700;
          --fluid-option-disabled-opacity: 0.65;
          --fluid-option-duration: 2s;
        "
        >Apple</fluid-option
      >
    `);
    await el.updateComplete;
    const styles = getComputedStyle(el);
    expect(styles.paddingBlockStart).to.equal("7px");
    expect(styles.paddingInlineStart).to.equal("13px");
    expect(styles.fontFamily).to.contain("serif");
    expect(styles.fontSize).to.equal("17px");
    expect(styles.borderRadius).to.equal("9px");
    expect(styles.backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(styles.fontWeight).to.equal("700");
    expect(styles.opacity).to.equal("0.65");
    expect(styles.getPropertyValue("--fluid-option-duration").trim()).to.equal("2s");
  });

  it("isolates the keyboard-active background", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option active style="--fluid-option-active-bg: rgb(9, 8, 7);"
        >Apple</fluid-option
      >
    `);
    expect(getComputedStyle(el).backgroundColor).to.equal("rgb(9, 8, 7)");
  });

  it("isolates active rail geometry and uses logical inline positioning", async () => {
    const el = await fixture<FluidOption>(html`
      <fluid-option
        active
        dir="rtl"
        style="
          --fluid-option-active-rail-width: 5px;
          --fluid-option-active-rail-inset: 6px;
          --fluid-option-active-rail-radius: 8px;
        "
        >Apple</fluid-option
      >
    `);
    await el.updateComplete;
    const rail = getComputedStyle(el, "::before");
    expect(rail.width).to.equal("5px");
    expect(rail.top).to.equal("6px");
    expect(rail.bottom).to.equal("6px");
    expect(rail.borderRadius).to.equal("8px");
    expect(rail.right).to.equal("0px");
  });

  it("includes a dynamically inserted enabled option in typeahead", async () => {
    const select = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="apple">Apple</fluid-option>
      </fluid-select>
    `);
    const banana = document.createElement("fluid-option") as FluidOption;
    banana.value = "banana";
    banana.textContent = "Banana";
    select.append(banana);
    await aTimeout(0);

    select
      .shadowRoot!.querySelector<HTMLButtonElement>("button")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
    await select.updateComplete;
    expect(select.open).to.equal(true);
    expect(banana.active).to.equal(true);
  });

  it("skips an option that becomes disabled during an open typeahead session", async () => {
    const select = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="banana">Banana</fluid-option>
        <fluid-option value="blueberry">Blueberry</fluid-option>
      </fluid-select>
    `);
    const [banana, blueberry] = Array.from(select.querySelectorAll<FluidOption>("fluid-option"));
    const trigger = select.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await select.updateComplete;
    expect(select.open).to.equal(true);
    expect(banana!.active).to.equal(true);

    banana!.disabled = true;
    await banana!.updateComplete;
    await aTimeout(0);
    expect(banana!.active).to.equal(false);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
    await select.updateComplete;

    expect(banana!.active).to.equal(false);
    expect(blueberry!.active).to.equal(true);
  });

  it("keeps selection canonical when the selected option value changes", async () => {
    const select = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit" value="apple">
        <fluid-option value="apple">Apple</fluid-option>
        <fluid-option value="banana">Banana</fluid-option>
      </fluid-select>
    `);
    const apple = select.querySelector<FluidOption>("fluid-option")!;
    apple.value = "apricot";
    await apple.updateComplete;
    await aTimeout(0);

    expect(select.value).to.equal("apricot");
    expect(apple.selected).to.equal(true);
    expect(select.querySelector<FluidOption>("[value='banana']")!.selected).to.equal(false);
  });

  it("uses a live option label for typeahead after text replacement", async () => {
    const select = await fixture<FluidSelect>(html`
      <fluid-select aria-label="Fruit">
        <fluid-option value="pear">Pear</fluid-option>
        <fluid-option value="plum">Plum</fluid-option>
      </fluid-select>
    `);
    const pear = select.querySelector<FluidOption>("fluid-option")!;
    pear.textContent = "Apricot";
    await aTimeout(0);
    select
      .shadowRoot!.querySelector<HTMLButtonElement>("button")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    await select.updateComplete;

    expect(pear.active).to.equal(true);
    expect(pear.title).to.equal("Apricot");
  });
});
