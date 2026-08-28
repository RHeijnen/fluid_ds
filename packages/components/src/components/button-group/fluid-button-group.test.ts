import { expect, fixture, html, waitUntil, aTimeout } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import "./define.js";
import "../button/define.js";
import "../dropdown/define.js";
import type { FluidButtonGroup } from "./fluid-button-group.js";

describe("<fluid-button-group>", () => {
  it("renders as role=group", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
      </fluid-button-group>
    `);
    expect(el.getAttribute("role")).to.equal("group");
  });

  it("renders children inside the slot", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
        <fluid-button>Three</fluid-button>
      </fluid-button-group>
    `);
    expect(el.querySelectorAll("fluid-button").length).to.equal(3);
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
      </fluid-button-group>
    `);
    await expect(el).to.be.accessible();
  });

  it("stamps data-fluid-group position on each member button", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
        <fluid-button>Three</fluid-button>
      </fluid-button-group>
    `);
    const btns = el.querySelectorAll("fluid-button");
    await waitUntil(() => btns[0]!.hasAttribute("data-fluid-group"));
    expect(btns[0]!.getAttribute("data-fluid-group")).to.equal("first");
    expect(btns[1]!.getAttribute("data-fluid-group")).to.equal("inner");
    expect(btns[2]!.getAttribute("data-fluid-group")).to.equal("last");
  });

  it("a single member is stamped 'only'", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>Solo</fluid-button>
      </fluid-button-group>
    `);
    const btn = el.querySelector("fluid-button")!;
    await waitUntil(() => btn.hasAttribute("data-fluid-group"));
    expect(btn.getAttribute("data-fluid-group")).to.equal("only");
  });

  it("vertical orientation stamps the orientation attribute", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group orientation="vertical" aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
      </fluid-button-group>
    `);
    const btn = el.querySelector("fluid-button")!;
    await waitUntil(() => btn.hasAttribute("data-fluid-group-orientation"));
    expect(btn.getAttribute("data-fluid-group-orientation")).to.equal("vertical");
  });

  it("reaches a split-button caret trigger nested inside a fluid-dropdown", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Save options">
        <fluid-button>Save</fluid-button>
        <fluid-dropdown>
          <fluid-button slot="trigger" caret aria-label="More"></fluid-button>
          <fluid-dropdown-item value="draft">Draft</fluid-dropdown-item>
        </fluid-dropdown>
      </fluid-button-group>
    `);
    const action = el.querySelector("fluid-button")!;
    const trigger = el.querySelector('fluid-button[slot="trigger"]')!;
    await waitUntil(() => trigger.hasAttribute("data-fluid-group"));
    // The action button is first; the dropdown's trigger is the last member.
    expect(action.getAttribute("data-fluid-group")).to.equal("first");
    expect(trigger.getAttribute("data-fluid-group")).to.equal("last");
  });

  it("clears removed member stamps and restamps the remaining membership", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Actions">
        <fluid-button>One</fluid-button>
        <fluid-button>Two</fluid-button>
      </fluid-button-group>
    `);
    const [first, second] = el.querySelectorAll<HTMLElement>("fluid-button");
    await waitUntil(() => second!.getAttribute("data-fluid-group") === "last");
    second!.remove();
    await aTimeout(0);
    expect(first!.getAttribute("data-fluid-group")).to.equal("only");
    expect(second!.hasAttribute("data-fluid-group")).to.be.false;
    expect(second!.hasAttribute("data-fluid-group-orientation")).to.be.false;
  });

  it("adopts a replaced nested dropdown trigger without a top-level slot change", async () => {
    const el = await fixture<FluidButtonGroup>(html`
      <fluid-button-group aria-label="Save options">
        <fluid-button>Save</fluid-button>
        <fluid-dropdown>
          <fluid-button slot="trigger" caret aria-label="Old more"></fluid-button>
          <fluid-dropdown-item value="draft">Draft</fluid-dropdown-item>
        </fluid-dropdown>
      </fluid-button-group>
    `);
    const dropdown = el.querySelector("fluid-dropdown")!;
    const oldTrigger = dropdown.querySelector<HTMLElement>('[slot="trigger"]')!;
    await waitUntil(() => oldTrigger.getAttribute("data-fluid-group") === "last");
    const replacement = document.createElement("fluid-button");
    replacement.slot = "trigger";
    replacement.setAttribute("aria-label", "New more");
    oldTrigger.replaceWith(replacement);
    await aTimeout(0);

    expect(oldTrigger.hasAttribute("data-fluid-group")).to.be.false;
    expect(replacement.getAttribute("data-fluid-group")).to.equal("last");
  });

  it("keeps disabled children out of the composed focus and Tab order", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div>
        <button data-boundary="before">Before</button>
        <fluid-button-group aria-label="Actions">
          <fluid-button>First</fluid-button>
          <fluid-button disabled>Unavailable</fluid-button>
          <fluid-dropdown>
            <fluid-button slot="trigger" caret aria-label="More"></fluid-button>
            <fluid-dropdown-item value="archive">Archive</fluid-dropdown-item>
          </fluid-dropdown>
        </fluid-button-group>
        <button data-boundary="after">After</button>
      </div>
    `);
    const el = wrapper.querySelector<FluidButtonGroup>("fluid-button-group")!;
    const [first, disabled, trigger] = el.querySelectorAll<HTMLElement>("fluid-button");
    await waitUntil(() => trigger!.getAttribute("data-fluid-group") === "last");
    const before = wrapper.querySelector<HTMLButtonElement>("[data-boundary='before']")!;
    const after = wrapper.querySelector<HTMLButtonElement>("[data-boundary='after']")!;

    before.focus();
    await sendKeys({ press: "Tab" });
    expect(document.activeElement).to.equal(first);
    await sendKeys({ press: "Tab" });
    expect(document.activeElement).to.equal(trigger);
    await sendKeys({ press: "Tab" });
    expect(document.activeElement).to.equal(after);

    await sendKeys({ press: "Shift+Tab" });
    expect(document.activeElement).to.equal(trigger);
    await sendKeys({ press: "Shift+Tab" });
    expect(document.activeElement).to.equal(first);
    expect(document.activeElement).not.to.equal(disabled);
  });
});
