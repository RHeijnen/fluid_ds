import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type {
  FluidFileInput,
  FluidFileInputChangeDetail,
  FluidFileInputChangeEvent
} from "../../index.js";

const fileInputDetail: FluidFileInputChangeDetail = { files: [], value: "" };
const invalidFileInputDetail: FluidFileInputChangeDetail = {
  // @ts-expect-error File input changes expose File[], not filename strings.
  files: ["file.txt"],
  value: "file.txt"
};
void invalidFileInputDetail;

describe("<fluid-file-input>", () => {
  describe("<fluid-file-input> localized validation", () => {
    for (const [locale, single, multiple] of [
      ["nl", "Eén bestand tegelijk", "Meerdere bestanden toegestaan"],
      ["de", "Eine Datei auf einmal", "Mehrere Dateien möglich"],
      ["fr", "Un fichier à la fois", "Plusieurs fichiers autorisés"],
      ["es", "Un archivo a la vez", "Se permiten varios archivos"],
      ["ar", "ملف واحد في كل مرة", "يمكن اختيار عدة ملفات"],
      ["fr-CA", "Un fichier à la fois", "Plusieurs fichiers autorisés"]
    ] as const) {
      it(`updates default single/multiple upload hints in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en"><fluid-file-input></fluid-file-input></div>
        `);
        const control = wrapper.querySelector<FluidFileInput>("fluid-file-input")!;
        const hint = () =>
          control.shadowRoot!.querySelector('slot[name="hint"]')!.textContent!.trim();
        expect(hint()).to.equal("One file at a time");
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(hint()).to.equal(single);
        control.multiple = true;
        await control.updateComplete;
        expect(hint()).to.equal(multiple);
        control.multiple = false;
        await control.updateComplete;
        expect(hint()).to.equal(single);
      });
    }

    it("preserves supplied upload label/hint slots and accessible name across locale changes", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="nl">
          <fluid-file-input aria-label="Application upload">
            <span slot="label">Application visible label</span>
            <span slot="hint">Application upload policy</span>
          </fluid-file-input>
        </div>
      `);
      const control = wrapper.querySelector<FluidFileInput>("fluid-file-input")!;
      wrapper.lang = "ar";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      const hintSlot = control.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="hint"]')!;
      const labelSlot = control.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
      expect(hintSlot.assignedElements()[0]!.textContent).to.equal("Application upload policy");
      expect(labelSlot.assignedElements()[0]!.textContent).to.equal("Application visible label");
      expect(control.shadowRoot!.querySelector(".dropzone")!.getAttribute("aria-label")).to.equal(
        "Application upload"
      );
      control.querySelector('[slot="hint"]')!.remove();
      await control.updateComplete;
      expect(hintSlot.assignedElements()).to.have.length(0);
      expect(hintSlot.textContent!.trim()).to.equal("ملف واحد في كل مرة");
    });

    it("localizes file-size punctuation live without changing filename or legacy unit semantics", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="en"><fluid-file-input></fluid-file-input></div>
      `);
      const control = wrapper.querySelector<FluidFileInput>("fluid-file-input")!;
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(1536)], "Application 1.5.txt"));
      control
        .shadowRoot!.querySelector(".dropzone")!
        .dispatchEvent(new DragEvent("drop", { dataTransfer: transfer }));
      await control.updateComplete;
      expect(control.shadowRoot!.querySelector(".file-name")!.textContent).to.equal(
        "Application 1.5.txt"
      );
      expect(control.shadowRoot!.querySelector(".file-size")!.textContent).to.equal("1.5 kB");
      wrapper.lang = "fr";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.shadowRoot!.querySelector(".file-size")!.textContent).to.equal("1,5 kB");
      expect(control.shadowRoot!.querySelector(".file-name")!.textContent).to.equal(
        "Application 1.5.txt"
      );
    });

    for (const [locale, message] of [
      ["nl", "Selecteer een bestand."],
      ["de", "Bitte wählen Sie eine Datei."],
      ["fr", "Veuillez sélectionner un fichier."],
      ["es", "Selecciona un archivo."],
      ["ar", "يرجى اختيار ملف."],
      ["fr-CA", "Veuillez sélectionner un fichier."]
    ] as const) {
      it(`refreshes current required validation in ${locale}`, async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
          <div lang="en">
            <fluid-file-input required aria-label="Application label"></fluid-file-input>
          </div>
        `);
        const control = wrapper.querySelector<FluidFileInput>("fluid-file-input")!;
        await control.updateComplete;
        expect(control.validity.valueMissing).to.equal(true);
        wrapper.lang = locale;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await control.updateComplete;
        expect(control.validationMessage).to.equal(message);
        expect(control.validity.valueMissing).to.equal(true);
        expect(control.checkValidity()).to.equal(false);
        expect(control.getAttribute("aria-label")).to.equal("Application label");
      });
    }

    it("tracks dynamic required and preserves custom validity in a changing closed-shadow language context", async () => {
      const host = await fixture<HTMLDivElement>(html`<div></div>`);
      const root = host.attachShadow({ mode: "closed" });
      const wrapper = document.createElement("section");
      wrapper.lang = "nl";
      const control = document.createElement("fluid-file-input") as FluidFileInput;
      control.setAttribute("aria-label", "Application label");

      wrapper.append(control);
      root.append(wrapper);
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      control.required = true;
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Selecteer een bestand.");
      control.setCustomValidity("Application validation");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Application validation");
      expect(control.validity.customError).to.equal(true);
      control.setCustomValidity("");
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Datei.");
      expect(control.validity.customError).to.equal(false);
      expect(control.validity.valueMissing).to.equal(true);
      control.required = false;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("");
      expect(control.checkValidity()).to.equal(true);
      expect(control.getAttribute("aria-label")).to.equal("Application label");
    });

    it("preserves a scoped language override and refreshes invalid text after reconnect", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="nl">
          <fluid-file-input lang="fr" required aria-label="Application label"></fluid-file-input>
        </div>
      `);
      const control = wrapper.querySelector<FluidFileInput>("fluid-file-input")!;
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez sélectionner un fichier.");
      wrapper.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Veuillez sélectionner un fichier.");
      control.removeAttribute("lang");
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Datei.");
      control.remove();
      wrapper.lang = "ar";
      wrapper.append(control);
      await control.updateComplete;
      expect(control.validationMessage).to.equal("يرجى اختيار ملف.");
      expect(control.validity.valueMissing).to.equal(true);
    });

    it("keeps submitted data canonical and restores current-language validation after form reset", async () => {
      const form = await fixture<HTMLFormElement>(html`
        <form lang="nl">
          <fluid-file-input
            name="control"
            required
            aria-label="Application label"
          ></fluid-file-input>
        </form>
      `);
      const control = form.querySelector<FluidFileInput>("fluid-file-input")!;
      await control.updateComplete;
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(["Application content"], "application.txt", { type: "text/plain" })
      );
      control
        .shadowRoot!.querySelector(".dropzone")!
        .dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
      await control.updateComplete;
      expect(control.checkValidity()).to.equal(true);
      expect((new FormData(form).get("control") as File).name).to.equal("application.txt");
      form.lang = "de";
      await new Promise((resolve) => setTimeout(resolve, 0));
      await control.updateComplete;
      form.reset();
      await control.updateComplete;
      expect(control.validity.valueMissing).to.equal(true);
      expect(control.validationMessage).to.equal("Bitte wählen Sie eine Datei.");
    });
  });

  it("renders a drop zone", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    expect(el.shadowRoot!.querySelector(".dropzone")).to.exist;
  });

  it("offers a compact form variant aligned to the medium field height", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input variant="compact"></fluid-file-input>`
    );
    el.style.setProperty("--fluid-field-height-md", "36px");
    await el.updateComplete;
    const picker = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    expect(picker.classList.contains("compact")).to.be.true;
    expect(picker.getBoundingClientRect().height).to.equal(38);

    const transfer = new DataTransfer();
    transfer.items.add(new File(["resume"], "resume.pdf"));
    picker.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".hint")!.textContent!.trim()).to.equal("resume.pdf");
    expect(el.shadowRoot!.querySelector(".file-list")).to.equal(null);
    expect(picker.getBoundingClientRect().height).to.equal(38);
  });

  it("gives the compact variant input-parity state styling with isolated hooks", async () => {
    const el = await fixture<FluidFileInput>(
      html`<fluid-file-input variant="compact" required></fluid-file-input>`
    );
    el.style.cssText = `
      --fluid-file-input-compact-bg: rgb(1, 2, 3);
      --fluid-file-input-compact-fg: rgb(4, 5, 6);
      --fluid-file-input-compact-border: rgb(7, 8, 9);
      --fluid-file-input-compact-border-focus: rgb(10, 11, 12);
      --fluid-file-input-compact-invalid-border: rgb(13, 14, 15);
      --fluid-file-input-compact-disabled-bg: rgb(16, 17, 18);
      --fluid-file-input-compact-disabled-fg: rgb(19, 20, 21);
      --fluid-file-input-compact-radius: 7px;
    `;
    await el.updateComplete;
    const picker = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    let style = getComputedStyle(picker);
    expect(style.backgroundColor).to.equal("rgb(1, 2, 3)");
    expect(style.color).to.equal("rgb(4, 5, 6)");
    expect(style.borderColor).to.equal("rgb(7, 8, 9)");
    expect(style.borderRadius).to.equal("7px");

    picker.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true }));
    await el.updateComplete;
    expect(getComputedStyle(picker).borderColor).to.equal("rgb(10, 11, 12)");

    picker.dispatchEvent(new DragEvent("dragleave", { bubbles: true }));
    el.reportValidity();
    await el.updateComplete;
    expect(picker.classList.contains("invalid")).to.be.true;
    expect(picker.getAttribute("aria-invalid")).to.equal("true");
    expect(getComputedStyle(picker).borderColor).to.equal("rgb(13, 14, 15)");

    el.disabled = true;
    await el.updateComplete;
    style = getComputedStyle(picker);
    expect(style.backgroundColor).to.equal("rgb(16, 17, 18)");
    expect(style.color).to.equal("rgb(19, 20, 21)");
    expect(style.opacity).to.equal("1");
    expect(style.boxShadow).to.equal("none");
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
    expect(zone.localName).to.equal("button");
    expect(input.getAttribute("tabindex")).to.equal("-1");
    el.focus();
    expect(el.shadowRoot!.activeElement).to.equal(zone);
  });

  it("uses a native non-submit button for keyboard activation", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLButtonElement>(".dropzone")!;
    expect(zone.localName).to.equal("button");
    expect(zone.type).to.equal("button");
    expect(zone.disabled).to.equal(false);
    // Synthetic KeyboardEvents do not activate native buttons. Real Enter and
    // Space release behavior is exercised through the browser file chooser.
    el.disabled = true;
    await el.updateComplete;
    expect(zone.disabled).to.equal(true);
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
    const el = await fixture<FluidFileInput>(html`<fluid-file-input multiple></fluid-file-input>`);
    const zone = el.shadowRoot!.querySelector<HTMLElement>(".dropzone")!;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    setTimeout(() => zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer })));
    const event = (await oneEvent(el, "fluid-change")) as FluidFileInputChangeEvent;
    expect(event.detail).to.deep.equal({ files: [file], value: "hello.txt" });
    expect(fileInputDetail).to.deep.equal({ files: [], value: "" });
  });

  it("replaces files in single mode", async () => {
    const single = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
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
    const el = await fixture<FluidFileInput>(html`<fluid-file-input multiple></fluid-file-input>`);
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
    const el = await fixture<FluidFileInput>(html`<fluid-file-input required></fluid-file-input>`);
    await el.updateComplete;
    expect(el.checkValidity()).to.be.false;
  });

  it("synchronizes multipart data before selection and removal events", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form><fluid-file-input name="upload" multiple></fluid-file-input></form>`
    );
    const el = form.querySelector<FluidFileInput>("fluid-file-input")!;
    const events: string[][] = [];
    el.addEventListener("fluid-change", () =>
      events.push(new FormData(form).getAll("upload").map((file) => (file as File).name))
    );
    for (const name of ["first.txt", "second.txt"]) {
      const transfer = new DataTransfer();
      transfer.items.add(new File([name], name));
      el.shadowRoot!.querySelector(".dropzone")!.dispatchEvent(
        new DragEvent("drop", { dataTransfer: transfer })
      );
    }
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>(".file-remove")!.click();
    expect(events).to.deep.equal([["first.txt"], ["first.txt", "second.txt"], ["second.txt"]]);
  });

  it("ignores a native selection arriving after the picker was disabled", async () => {
    const el = await fixture<FluidFileInput>(html`<fluid-file-input></fluid-file-input>`);
    let changes = 0;
    el.addEventListener("fluid-change", () => changes++);
    el.disabled = true;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    const transfer = new DataTransfer();
    transfer.items.add(new File(["late"], "late.txt"));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change"));
    await el.updateComplete;
    expect(changes).to.equal(0);
    expect(el.shadowRoot!.querySelectorAll(".file")).to.have.length(0);
  });

  it("does not steal focus assigned by a consumer during removal", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <button type="button">Continue</button><fluid-file-input></fluid-file-input>
      </form>`
    );
    const el = form.querySelector<FluidFileInput>("fluid-file-input")!;
    const next = form.querySelector("button")!;
    const transfer = new DataTransfer();
    transfer.items.add(new File(["one"], "one.txt"));
    el.shadowRoot!.querySelector(".dropzone")!.dispatchEvent(
      new DragEvent("drop", { dataTransfer: transfer })
    );
    await el.updateComplete;
    el.addEventListener("fluid-change", () => next.focus());
    const remove = el.shadowRoot!.querySelector<HTMLButtonElement>(".file-remove")!;
    remove.focus();
    remove.click();
    await el.updateComplete;
    expect(document.activeElement).to.equal(next);
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
