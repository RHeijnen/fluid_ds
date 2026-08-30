import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidSegmentedControl } from "./fluid-segmented-control.js";
import type { FluidSegment } from "./fluid-segment.js";

const sample = html`
  <fluid-segmented-control aria-label="View" value="grid">
    <fluid-segment value="list">List</fluid-segment>
    <fluid-segment value="grid">Grid</fluid-segment>
    <fluid-segment value="kanban" disabled>Kanban</fluid-segment>
  </fluid-segmented-control>
`;

describe("<fluid-segmented-control>", () => {
  it("renders with the value's segment selected", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const selected = el.querySelector("fluid-segment[selected]");
    expect(selected?.getAttribute("value")).to.equal("grid");
  });

  it("clicking a segment updates the value", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const list = el.querySelector<HTMLElement>('fluid-segment[value="list"]')!;
    setTimeout(() => list.click());
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.value).to.equal("list");
    expect(el.value).to.equal("list");
  });

  it("does not fire fluid-change when the default value is auto-seeded on mount", async () => {
    let fired = false;
    const el = await fixture<FluidSegmentedControl>(html`
      <fluid-segmented-control aria-label="View" @fluid-change=${() => (fired = true)}>
        <fluid-segment value="list">List</fluid-segment>
        <fluid-segment value="grid">Grid</fluid-segment>
      </fluid-segmented-control>
    `);
    await el.updateComplete;
    // The control seeds value="list" (first enabled segment) internally, but the
    // user never made that choice, so no change event should be emitted.
    expect(el.value).to.equal("list");
    expect(fired).to.equal(false);
  });

  it("ArrowRight cycles to next non-disabled segment", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    // disabled "kanban" should be skipped, wrap back to list
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("list");
  });

  it("Home jumps to first segment", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await el.updateComplete;
    expect(el.value).to.equal("list");
  });

  it("ignores clicks on disabled segments", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    const kanban = el.querySelector<HTMLElement>('fluid-segment[value="kanban"]')!;
    kanban.click();
    await el.updateComplete;
    expect(el.value).to.equal("grid");
  });

  it("falls back without emitting when the selected segment is disabled or removed", async () => {
    let changes = 0;
    const el = await fixture<FluidSegmentedControl>(html`
      <fluid-segmented-control aria-label="View" value="grid" @fluid-change=${() => changes++}>
        <fluid-segment value="list">List</fluid-segment>
        <fluid-segment value="grid">Grid</fluid-segment>
        <fluid-segment value="board">Board</fluid-segment>
      </fluid-segmented-control>
    `);
    const segments = Array.from(el.querySelectorAll("fluid-segment"));

    segments[1]!.setAttribute("disabled", "");
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("list");
    expect(segments[0]!.getAttribute("aria-checked")).to.equal("true");
    expect(segments[1]!.getAttribute("aria-checked")).to.equal("false");
    expect(changes).to.equal(0);

    segments[0]!.remove();
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("board");
    expect(segments[2]!.getAttribute("aria-checked")).to.equal("true");
    expect(segments[2]!.tabIndex).to.equal(0);
    expect(changes).to.equal(0);
  });

  it("recovers selection after every option is disabled and after reconnect", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    const segments = Array.from(el.querySelectorAll("fluid-segment"));
    segments[0]!.setAttribute("disabled", "");
    segments[1]!.setAttribute("disabled", "");
    await aTimeout(0);
    await el.updateComplete;

    expect(el.value).to.equal("");
    expect(segments.every((segment) => segment.getAttribute("aria-checked") === "false")).to.equal(
      true
    );

    el.remove();
    segments[2]!.removeAttribute("disabled");
    document.body.append(el);
    await el.updateComplete;

    expect(el.value).to.equal("kanban");
    expect(segments[2]!.getAttribute("aria-checked")).to.equal("true");
    expect(segments[2]!.tabIndex).to.equal(0);
  });

  it("keeps a standalone segment inert through removal and reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><fluid-segment value="orphan" selected>Orphan</fluid-segment></div>
    `);
    const segment = wrapper.querySelector<FluidSegment>("fluid-segment")!;
    await segment.updateComplete;
    expect(segment.selected).to.be.false;
    expect(segment.getAttribute("aria-checked")).to.equal("false");
    expect(segment.tabIndex).to.equal(-1);

    segment.remove();
    segment.selected = true;
    wrapper.append(segment);
    await segment.updateComplete;
    expect(segment.selected).to.be.false;
    expect(segment.getAttribute("aria-checked")).to.equal("false");
    expect(segment.tabIndex).to.equal(-1);
  });

  it("releases a selected segment removed from its controlling group", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    const selected = el.querySelector<FluidSegment>('[value="grid"]')!;
    selected.remove();
    await aTimeout(0);
    await selected.updateComplete;

    expect(selected.selected).to.be.false;
    expect(selected.getAttribute("aria-checked")).to.equal("false");
    expect(selected.tabIndex).to.equal(-1);
    expect(el.value).to.equal("list");
  });

  for (const [key, expected] of [
    ["ArrowRight", "board"],
    ["ArrowLeft", "list"],
    ["ArrowDown", "board"],
    ["ArrowUp", "list"],
    ["Home", "list"],
    ["End", "board"]
  ] as const) {
    it(`${key} selects and focuses the expected enabled segment`, async () => {
      const el = await fixture<FluidSegmentedControl>(html`
        <fluid-segmented-control aria-label="View" value="grid">
          <fluid-segment value="list">List</fluid-segment>
          <fluid-segment value="grid">Grid</fluid-segment>
          <fluid-segment value="disabled" disabled>Disabled</fluid-segment>
          <fluid-segment value="board">Board</fluid-segment>
        </fluid-segmented-control>
      `);
      const current = el.querySelector<FluidSegment>('[value="grid"]')!;
      const changes: CustomEvent[] = [];
      el.addEventListener("fluid-change", (event) => changes.push(event as CustomEvent));
      current.focus();
      current.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      await el.updateComplete;

      const selected = el.querySelector<FluidSegment>(`[value="${expected}"]`)!;
      expect(el.value).to.equal(expected);
      expect(document.activeElement).to.equal(selected);
      expect(selected.selected).to.be.true;
      expect(selected.tabIndex).to.equal(0);
      expect(changes.map((event) => event.detail)).to.deep.equal([{ value: expected }]);
    });
  }

  for (const [key, expected] of [
    ["ArrowRight", "list"],
    ["ArrowLeft", "board"]
  ] as const) {
    it(`${key} follows the rendered segment order in inherited RTL`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div dir="rtl">
          <fluid-segmented-control aria-label="View" value="grid">
            <fluid-segment value="list">List</fluid-segment>
            <fluid-segment value="grid">Grid</fluid-segment>
            <fluid-segment value="board">Board</fluid-segment>
          </fluid-segmented-control>
        </div>
      `);
      const el = wrapper.querySelector<FluidSegmentedControl>("fluid-segmented-control")!;
      const current = el.querySelector<FluidSegment>('[value="grid"]')!;
      await aTimeout(0);
      current.focus();
      current.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      await el.updateComplete;

      const selected = el.querySelector<FluidSegment>(`[value="${expected}"]`)!;
      expect(el.value).to.equal(expected);
      expect(document.activeElement).to.equal(selected);
      expect(selected.selected).to.be.true;
    });
  }

  it("passes a11y audit", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("the sliding thumb fill reads --fluid-segmented-thumb-bg", async () => {
    // The selected "raised" surface is now the sliding .thumb (so it animates
    // between segments), not a per-segment background.
    const el = await fixture<FluidSegmentedControl>(sample);
    el.style.setProperty("--fluid-segmented-thumb-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const thumb = el.shadowRoot!.querySelector<HTMLElement>('[part="thumb"]')!;
    expect(getComputedStyle(thumb).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("spaces adjacent icon and label content with the segment gap token", async () => {
    const el = await fixture<FluidSegmentedControl>(html`
      <fluid-segmented-control aria-label="View" value="list">
        <fluid-segment value="list"><fluid-icon name="list"></fluid-icon>List</fluid-segment>
        <fluid-segment value="grid"><fluid-icon name="grid"></fluid-icon>Grid</fluid-segment>
      </fluid-segmented-control>
    `);
    const segment = el.querySelector<HTMLElement>("fluid-segment")!;
    segment.style.setProperty("--fluid-segment-gap", "11px");

    expect(getComputedStyle(segment).gap).to.equal("11px");
  });

  it("each segment respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidSegmentedControl>(sample);
    el.style.setProperty("--fluid-target-min", "44px");
    await el.updateComplete;
    const seg = el.querySelector<HTMLElement>("fluid-segment")!;
    expect(seg.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });

  /* Regression: markup parsed into a CONNECTED container upgrades in tree
     order, so the group used to reconcile against not-yet-upgraded segments
     (no `value` accessor), find no match for a non-first authored value, and
     stomp it with the first segment. `fixture()` renders through a template
     and hides this; the test must assign innerHTML on a live element. */

  it("keeps a non-first authored value when parsed into a connected container", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    try {
      host.innerHTML = `
        <fluid-segmented-control value="rounded" aria-label="Module shape">
          <fluid-segment value="square">Square</fluid-segment>
          <fluid-segment value="dots">Dots</fluid-segment>
          <fluid-segment value="rounded">Rounded</fluid-segment>
        </fluid-segmented-control>
      `;
      const control = host.querySelector<FluidSegmentedControl>("fluid-segmented-control")!;
      await control.updateComplete;
      await aTimeout(0);
      expect(control.value).to.equal("rounded");
      const selected = [...host.querySelectorAll<FluidSegment>("fluid-segment")].map(
        (segment) => segment.selected
      );
      expect(selected).to.deep.equal([false, false, true]);
    } finally {
      host.remove();
    }
  });

  it("waits for a late-arriving segment instead of stomping the authored value", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    try {
      host.innerHTML = `
        <fluid-segmented-control value="late" aria-label="Late option">
          <fluid-segment value="first">First</fluid-segment>
        </fluid-segmented-control>
      `;
      const control = host.querySelector<FluidSegmentedControl>("fluid-segmented-control")!;
      await control.updateComplete;
      await aTimeout(0);
      // The authored value has no segment yet; it must not fall back to
      // "first" because the parser may still be streaming children in.
      expect(control.value).to.equal("late");
      const late = document.createElement("fluid-segment") as FluidSegment;
      late.setAttribute("value", "late");
      late.textContent = "Late";
      control.appendChild(late);
      await aTimeout(0);
      await control.updateComplete;
      expect(control.value).to.equal("late");
      expect(late.selected).to.equal(true);
    } finally {
      host.remove();
    }
  });
});
