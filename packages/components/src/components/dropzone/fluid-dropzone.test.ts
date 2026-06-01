import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidDropzone } from "./fluid-dropzone.js";

const TOKENS =
  "--fluid-surface-base:#ffffff;--fluid-surface-muted:#f4f4f5;" +
  "--fluid-text-primary:#18181b;--fluid-text-secondary:#3f3f46;" +
  "--fluid-border-default:#e4e4e7;--fluid-accent-base:#4f46e5;" +
  "--fluid-accent-text:#ffffff;--fluid-success-base:#16a34a;" +
  "--fluid-success-text:#ffffff;--fluid-danger-base:#dc2626;" +
  "--fluid-danger-text:#ffffff;--fluid-warning-base:#f59e0b;--fluid-motion:0;";

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

function dropFiles(el: FluidDropzone, files: File[]): void {
  const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
  const dataTransfer = new DataTransfer();
  for (const f of files) dataTransfer.items.add(f);
  const event = new DragEvent("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  zone.dispatchEvent(event);
}

describe("<fluid-dropzone>", () => {
  it("renders a focusable drop region with the button role", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
    const zone = el.shadowRoot!.querySelector(".dropzone")!;
    expect(zone.getAttribute("role")).to.equal("button");
    expect(zone.getAttribute("tabindex")).to.equal("0");
  });

  it("uses the label as the prompt and accessible name", async () => {
    const el = await fixture<FluidDropzone>(
      html`<fluid-dropzone label="Add files"></fluid-dropzone>`
    );
    const zone = el.shadowRoot!.querySelector(".dropzone")!;
    expect(zone.getAttribute("aria-label")).to.equal("Add files");
  });

  it("backs the region with a visually hidden file input", async () => {
    const el = await fixture<FluidDropzone>(
      html`<fluid-dropzone accept="image/*" multiple></fluid-dropzone>`
    );
    const input = el.shadowRoot!.querySelector<HTMLInputElement>(".input")!;
    expect(input.type).to.equal("file");
    expect(input.accept).to.equal("image/*");
    expect(input.multiple).to.be.true;
    expect(input.getAttribute("aria-hidden")).to.equal("true");
  });

  it("emits fluid-change with accepted files on drop", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone multiple></fluid-dropzone>`);
    setTimeout(() =>
      dropFiles(el, [makeFile("a.txt", "text/plain", 10), makeFile("b.txt", "text/plain", 20)])
    );
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.files).to.have.lengthOf(2);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll(".file")).to.have.lengthOf(2);
  });

  it("keeps only one file when not multiple", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
    setTimeout(() =>
      dropFiles(el, [makeFile("a.txt", "text/plain", 10), makeFile("b.txt", "text/plain", 20)])
    );
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.files).to.have.lengthOf(1);
    expect(event.detail.files[0].name).to.equal("a.txt");
  });

  it("rejects files that fail the accept type with reason 'type'", async () => {
    const el = await fixture<FluidDropzone>(
      html`<fluid-dropzone accept="image/*"></fluid-dropzone>`
    );
    setTimeout(() => dropFiles(el, [makeFile("doc.txt", "text/plain", 10)]));
    const event = await oneEvent(el, "fluid-reject");
    expect(event.detail.reason).to.equal("type");
    expect(event.detail.files).to.have.lengthOf(1);
  });

  it("rejects files larger than maxSize with reason 'size'", async () => {
    const el = await fixture<FluidDropzone>(
      html`<fluid-dropzone max-size="50"></fluid-dropzone>`
    );
    setTimeout(() => dropFiles(el, [makeFile("big.txt", "text/plain", 100)]));
    const event = await oneEvent(el, "fluid-reject");
    expect(event.detail.reason).to.equal("size");
  });

  it("matches an extension pattern in accept", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone accept=".png"></fluid-dropzone>`);
    setTimeout(() => dropFiles(el, [makeFile("photo.png", "", 10)]));
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.files[0].name).to.equal("photo.png");
  });

  it("renders a remove button per file and removes on click", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
    dropFiles(el, [makeFile("a.txt", "text/plain", 10)]);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll(".file")).to.have.lengthOf(1);
    const remove = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
    setTimeout(() => remove.click());
    const event = await oneEvent(el, "fluid-change");
    expect(event.detail.files).to.have.lengthOf(0);
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelectorAll(".file")).to.have.lengthOf(0);
  });

  it("activates the dialog on Enter and Space", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
    const input = el.shadowRoot!.querySelector<HTMLInputElement>(".input")!;
    let clicks = 0;
    input.addEventListener("click", () => (clicks += 1));
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    zone.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(clicks).to.equal(2);
  });

  it("does not ingest while disabled", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone disabled></fluid-dropzone>`);
    let fired = false;
    el.addEventListener("fluid-change", () => (fired = true));
    dropFiles(el, [makeFile("a.txt", "text/plain", 10)]);
    await elementUpdated(el);
    expect(fired).to.be.false;
    const zone = el.shadowRoot!.querySelector(".dropzone")!;
    expect(zone.getAttribute("tabindex")).to.equal("-1");
    expect(zone.getAttribute("aria-disabled")).to.equal("true");
  });

  it("adds a highlighted state on dragover", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const event = new DragEvent("dragover", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: new DataTransfer() });
    zone.dispatchEvent(event);
    await elementUpdated(el);
    expect(zone.classList.contains("dragover")).to.be.true;
  });

  it("passes a11y audit", async () => {
    const wrapper = await fixture(html`
      <div style=${TOKENS}>
        <fluid-dropzone label="Upload files" multiple></fluid-dropzone>
      </div>
    `);
    const el = wrapper.querySelector<FluidDropzone>("fluid-dropzone")!;
    dropFiles(el, [makeFile("photo.png", "image/png", 10)]);
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
