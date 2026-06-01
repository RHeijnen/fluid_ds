import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../avatar/define.js";
import type { FluidAvatarGroup } from "./fluid-avatar-group.js";

const five = html`
  <fluid-avatar-group>
    <fluid-avatar label="Ada Lovelace"></fluid-avatar>
    <fluid-avatar label="Grace Hopper"></fluid-avatar>
    <fluid-avatar label="Alan Turing"></fluid-avatar>
    <fluid-avatar label="Katherine Johnson"></fluid-avatar>
    <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
  </fluid-avatar-group>
`;

describe("<fluid-avatar-group>", () => {
  it("exposes role=group on the base part", async () => {
    const el = await fixture<FluidAvatarGroup>(five);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("role")).to.equal("group");
  });

  it("derives an 'N members' accessible name from the count", async () => {
    const el = await fixture<FluidAvatarGroup>(five);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("5 members");
  });

  it("uses the singular 'member' for a single avatar", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group>
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
      </fluid-avatar-group>
    `);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("1 member");
  });

  it("honors an explicit label", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group label="Reviewers">
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
        <fluid-avatar label="Grace Hopper"></fluid-avatar>
      </fluid-avatar-group>
    `);
    await elementUpdated(el);
    const base = el.shadowRoot!.querySelector('[part="base"]')!;
    expect(base.getAttribute("aria-label")).to.equal("Reviewers");
  });

  it("shows all avatars and no overflow when max is 0", async () => {
    const el = await fixture<FluidAvatarGroup>(five);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector('[part="overflow"]')).to.be.null;
    const hidden = el.querySelectorAll("fluid-avatar[data-fluid-overflow]");
    expect(hidden.length).to.equal(0);
  });

  it("hides avatars beyond max and renders a +N overflow chip", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group max="3">
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
        <fluid-avatar label="Grace Hopper"></fluid-avatar>
        <fluid-avatar label="Alan Turing"></fluid-avatar>
        <fluid-avatar label="Katherine Johnson"></fluid-avatar>
        <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
      </fluid-avatar-group>
    `);
    await elementUpdated(el);
    const overflow = el.shadowRoot!.querySelector('[part="overflow"]')!;
    expect(overflow).to.exist;
    expect(overflow.textContent?.trim()).to.equal("+2");

    const hidden = el.querySelectorAll("fluid-avatar[data-fluid-overflow]");
    expect(hidden.length).to.equal(2);
  });

  it("marks overflowed avatars aria-hidden and the chip aria-hidden", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group max="2">
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
        <fluid-avatar label="Grace Hopper"></fluid-avatar>
        <fluid-avatar label="Alan Turing"></fluid-avatar>
      </fluid-avatar-group>
    `);
    await elementUpdated(el);
    const hidden = el.querySelectorAll(
      'fluid-avatar[data-fluid-overflow][aria-hidden="true"]'
    );
    expect(hidden.length).to.equal(1);
    const overflow = el.shadowRoot!.querySelector('[part="overflow"]')!;
    expect(overflow.getAttribute("aria-hidden")).to.equal("true");
  });

  it("forwards its size to avatars that have not set their own", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group size="lg">
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
        <fluid-avatar size="xs" label="Grace Hopper"></fluid-avatar>
      </fluid-avatar-group>
    `);
    await elementUpdated(el);
    const avatars = el.querySelectorAll("fluid-avatar");
    expect(avatars[0]!.getAttribute("size")).to.equal("lg");
    // An avatar with its own size is left untouched.
    expect(avatars[1]!.getAttribute("size")).to.equal("xs");
  });

  it("reflects size and max attributes", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <fluid-avatar-group size="sm" max="2">
        <fluid-avatar label="Ada Lovelace"></fluid-avatar>
      </fluid-avatar-group>
    `);
    expect(el.getAttribute("size")).to.equal("sm");
    expect(el.getAttribute("max")).to.equal("2");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidAvatarGroup>(html`
      <div
        style="--fluid-surface-base:#ffffff; --fluid-surface-muted:#e4e4e7; --fluid-text-primary:#18181b; --fluid-text-secondary:#3f3f46; --fluid-border-default:#e4e4e7; --fluid-accent-base:#4f46e5; --fluid-accent-text:#ffffff;"
      >
        <fluid-avatar-group max="3">
          <fluid-avatar label="Ada Lovelace"></fluid-avatar>
          <fluid-avatar label="Grace Hopper"></fluid-avatar>
          <fluid-avatar label="Alan Turing"></fluid-avatar>
          <fluid-avatar label="Katherine Johnson"></fluid-avatar>
          <fluid-avatar label="Edsger Dijkstra"></fluid-avatar>
        </fluid-avatar-group>
      </div>
    `);
    const group = el.querySelector<FluidAvatarGroup>("fluid-avatar-group")!;
    await elementUpdated(group);
    await aTimeout(20);
    await expect(group).to.be.accessible();
  });
});
