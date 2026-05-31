import { expect, fixture, html, waitUntil } from "@open-wc/testing";
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
});
