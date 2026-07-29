import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidFileInput } from "./fluid-file-input.js";

describe("<fluid-file-input>", () => {
  it("renders a drop zone", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    expect(el.shadowRoot!.querySelector(".dropzone")).to.exist;
  });

  it("clicking the drop zone activates the file input", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    let clicked = false;
    input.addEventListener("click", () => (clicked = true));
    zone.click();
    expect(clicked).to.be.true;
  });

  it("the visible drop zone is the keyboard focus target", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    // The styled label is in the tab order; the 1px hidden input is removed from it.
    expect(zone.getAttribute("tabindex")).to.equal("0");
    expect(zone.getAttribute("role")).to.equal("button");
    expect(input.getAttribute("tabindex")).to.equal("-1");
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(zone);
  });

  it("Enter and Space on the drop zone activate the file input", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    let clicks = 0;
    input.addEventListener("click", () => (clicks += 1));
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(clicks).to.equal(2);
  });

  it("disabled drops the drop zone out of the tab order and ignores keys", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input disabled></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    expect(zone.getAttribute("tabindex")).to.equal("-1");
    let clicked = false;
    input.addEventListener("click", () => (clicked = true));
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(clicked).to.be.false;
  });

  it("emits fluid-change when files are dropped", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input multiple></fluid-file-input>`
    );
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    setTimeout(() =>
      zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }))
    );
    const event = (await oneEvent(el, "fluid-change")) as CustomEvent;
    expect(event.detail.files.length).to.equal(1);
    expect(event.detail.value).to.equal("hello.txt");
  });

  it("appends files in multiple mode, replaces in single mode", async () => {
    const single = await fixture<FluidFileInput>(
      html`<fluid-file-input></fluid-file-input>`
    );
    const zoneS = single.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const dt1 = new DataTransfer();
    dt1.items.add(new File(["a"], "a.txt"));
    zoneS.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt1 }));
    const dt2 = new DataTransfer();
    dt2.items.add(new File(["b"], "b.txt"));
    zoneS.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt2 }));
    await single.updateComplete;
    expect(single.shadowRoot!.querySelectorAll(".file").length).to.equal(1);
  });

  it("removing a file updates the list", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input multiple></fluid-file-input>`
    );
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const dt = new DataTransfer();
    dt.items.add(new File(["a"], "a.txt"));
    dt.items.add(new File(["b"], "b.txt"));
    zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".file").length).to.equal(2);
    el.shadowRoot!.querySelector<HTMLButtonElement>(".file-remove")!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".file").length).to.equal(1);
  });

  it("reports invalid when required and empty", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input required></fluid-file-input>`
    );
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input aria-label="Upload photos"></fluid-file-input>`
    );
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  /* Rework: override ladder + AAA target floor. */

  it("drop zone background reads the --fluid-file-input-* override ladder", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    el.style.setProperty("--fluid-file-input-bg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    expect(getComputedStyle(zone).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("the remove button respects --fluid-target-min (AAA hit area)", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input multiple></fluid-file-input>`);
    el.style.setProperty("--fluid-target-min", "44px");
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const dt = new DataTransfer();
    dt.items.add(new File(["a"], "a.txt"));
    zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt }));
    await el.updateComplete;
    const remove = el.shadowRoot!.querySelector<HTMLElement>(".file-remove")!;
    expect(remove.getBoundingClientRect().height).to.be.greaterThanOrEqual(44);
  });
});
