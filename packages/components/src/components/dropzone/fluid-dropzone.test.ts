import { expect, fixture, html, oneEvent, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type {
  FluidDropzone,
  FluidDropzoneChangeDetail,
  FluidDropzoneChangeEvent,
  FluidDropzoneRejectDetail,
  FluidDropzoneRejectEvent
} from "../../index.js";

const emptyDropzoneChange: FluidDropzoneChangeDetail = { files: [] };
const emptyDropzoneReject: FluidDropzoneRejectDetail = { files: [], reason: "type" };
// @ts-expect-error Reject reasons are the closed public type/size union.
const invalidDropzoneReject: FluidDropzoneRejectDetail = { files: [], reason: "application" };
void invalidDropzoneReject;

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
  describe("<fluid-dropzone> localized defaults", () => {
    it("preserves application slot content while translating its default accessible label", async () => {
      const control = await fixture<FluidDropzone>(
        html`<fluid-dropzone lang="nl"><span>Application upload policy</span></fluid-dropzone>`
      );
      control.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      const slot = control.shadowRoot!.querySelector("slot")!;
      expect(slot.assignedElements()[0]!.textContent).to.equal("Application upload policy");
      expect(control.shadowRoot!.querySelector(".dropzone")!.getAttribute("aria-label")).to.equal(
        "اسحب الملفات إلى هنا أو انقر لتصفحها"
      );
      control.querySelector("span")!.remove();
      expect(slot.assignedElements()).to.have.length(0);
      expect(slot.textContent!.trim()).to.equal("اسحب الملفات إلى هنا أو انقر لتصفحها");
    });

    const readLabels = (control: FluidDropzone) => [
      control.shadowRoot!.querySelector(".dropzone")!.getAttribute("aria-label")
    ];
    for (const [locale, expected] of [
      ["nl", ["Sleep bestanden hierheen of klik om te bladeren"]],
      ["de", ["Dateien hierher ziehen oder zum Auswählen klicken"]],
      ["fr", ["Déposez des fichiers ici ou cliquez pour parcourir"]],
      ["es", ["Arrastra archivos aquí o haz clic para buscarlos"]],
      ["ar", ["اسحب الملفات إلى هنا أو انقر لتصفحها"]],
      ["fr-CA", ["Déposez des fichiers ici ou cliquez pour parcourir"]]
    ] as const) {
      it(`updates owned labels in ${locale} without treating defaults as application overrides`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-dropzone></fluid-dropzone></div>
        `);
        const control = wrapper.querySelector<FluidDropzone>("fluid-dropzone")!;
        await control.updateComplete;
        expect(control.hasAttribute("label")).to.equal(false);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(readLabels(control)).to.deep.equal(expected);
        expect(control.label).to.equal(expected[0]);
        expect(control.hasAttribute("label")).to.equal(false);
      });
    }

    it("refreshes defaults in a closed shadow context and after reconnect", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const context = document.createElement("section");
      context.lang = "nl";
      host.attachShadow({ mode: "closed" }).append(context);
      const control = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([
        "Sleep bestanden hierheen of klik om te bladeren"
      ]);
      context.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([
        "Dateien hierher ziehen oder zum Auswählen klicken"
      ]);
      control.remove();
      context.lang = "ar";
      context.append(control);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["اسحب الملفات إلى هنا أو انقر لتصفحها"]);
    });

    it("preserves explicit English and empty overrides, and restores defaults when overrides are removed", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-dropzone></fluid-dropzone></div>
      `);
      const control = wrapper.querySelector<FluidDropzone>("fluid-dropzone")!;
      control.label = "Drag files here or click to browse";
      wrapper.lang = "nl";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Drag files here or click to browse"]);
      control.setAttribute("label", "Drag files here or click to browse");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["Drag files here or click to browse"]);
      control.removeAttribute("label");
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([
        "Déposez des fichiers ici ou cliquez pour parcourir"
      ]);
      control.label = "";
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal([""]);
      Reflect.set(control, "label", null);
      await control.updateComplete;
      expect(readLabels(control)).to.deep.equal(["اسحب الملفات إلى هنا أو انقر لتصفحها"]);
    });

    it("localizes file-size punctuation live without changing filename or legacy unit semantics", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-dropzone></fluid-dropzone></div>
      `);
      const control = wrapper.querySelector<FluidDropzone>("fluid-dropzone")!;
      dropFiles(control, [makeFile("Application 1.5.txt", "text/plain", 1536)]);
      await elementUpdated(control);
      expect(control.shadowRoot!.querySelector(".name")!.textContent).to.equal(
        "Application 1.5.txt"
      );
      expect(control.shadowRoot!.querySelector(".size")!.textContent).to.equal("1.5 KB");
      wrapper.lang = "fr";
      await aTimeout(0);
      await elementUpdated(control);
      expect(control.shadowRoot!.querySelector(".size")!.textContent).to.equal("1,5 KB");
      expect(control.shadowRoot!.querySelector(".name")!.textContent).to.equal(
        "Application 1.5.txt"
      );
    });
  });

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
    const event = (await oneEvent(el, "fluid-change")) as FluidDropzoneChangeEvent;
    expect(event.detail.files).to.have.lengthOf(2);
    expect(emptyDropzoneChange).to.deep.equal({ files: [] });
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
    const event = (await oneEvent(el, "fluid-reject")) as FluidDropzoneRejectEvent;
    expect(event.detail).to.deep.equal({
      files: [event.detail.files[0]],
      reason: "type"
    });
    expect(emptyDropzoneReject).to.deep.equal({ files: [], reason: "type" });
  });

  it("rejects files larger than maxSize with reason 'size'", async () => {
    const el = await fixture<FluidDropzone>(html`<fluid-dropzone max-size="50"></fluid-dropzone>`);
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

  it("revokes the thumbnail object URL when an image file is removed", async () => {
    const created: string[] = [];
    const revoked: string[] = [];
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    let counter = 0;
    URL.createObjectURL = () => {
      const url = `blob:mock-${(counter += 1)}`;
      created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url);
    };
    try {
      const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
      dropFiles(el, [makeFile("photo.png", "image/png", 10)]);
      await elementUpdated(el);
      expect(created).to.have.lengthOf(1);
      const remove = el.shadowRoot!.querySelector<HTMLButtonElement>(".remove")!;
      remove.click();
      await elementUpdated(el);
      expect(revoked).to.include(created[0]);
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });

  it("revokes outstanding thumbnail object URLs on disconnect", async () => {
    const created: string[] = [];
    const revoked: string[] = [];
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    let counter = 0;
    URL.createObjectURL = () => {
      const url = `blob:mock-${(counter += 1)}`;
      created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url);
    };
    try {
      const el = await fixture<FluidDropzone>(html`<fluid-dropzone></fluid-dropzone>`);
      dropFiles(el, [makeFile("photo.png", "image/png", 10)]);
      await elementUpdated(el);
      expect(created).to.have.lengthOf(1);
      // Remove before the image ever fires `load`: the URL must still be freed.
      el.remove();
      expect(revoked).to.include(created[0]);
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
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
