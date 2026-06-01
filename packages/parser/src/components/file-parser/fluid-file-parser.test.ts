import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import type { FluidFileParser } from "./fluid-file-parser.js";
import type { Blueprint } from "../../core/types.js";

const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Name", type: "string", required: true },
    { key: "age", type: "integer", min: 0 },
    { key: "email", type: "email", required: true }
  ]
};

function file(name: string, content: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

async function mount(): Promise<FluidFileParser> {
  const el = await fixture<FluidFileParser>(html`<fluid-file-parser></fluid-file-parser>`);
  el.blueprint = blueprint;
  await el.updateComplete;
  return el;
}

/** Drive a file through the parser by firing the dropzone's fluid-change. */
async function drop(el: FluidFileParser, f: File): Promise<void> {
  const dz = el.shadowRoot?.querySelector("fluid-dropzone");
  expect(dz).to.exist;
  const loaded = oneEvent(el, "fluid-file-loaded");
  dz?.dispatchEvent(
    new CustomEvent("fluid-change", { detail: { files: [f] }, bubbles: true, composed: true })
  );
  await loaded;
  await el.updateComplete;
}

describe("fluid-file-parser", () => {
  it("is accessible before a file loads", async () => {
    const el = await mount();
    await expect(el).to.be.accessible();
  });

  it("is accessible with a loaded preview", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    await expect(el).to.be.accessible();
  });

  it("emits fluid-file-loaded with the raw table", async () => {
    const el = await mount();
    const dz = el.shadowRoot?.querySelector("fluid-dropzone");
    const loaded = oneEvent(el, "fluid-file-loaded");
    dz?.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: [file("p.csv", "name,age,email\nAda,30,ada@x.dev")] },
        bubbles: true,
        composed: true
      })
    );
    const event = await loaded;
    expect(event.detail.raw.columns).to.deep.equal(["name", "age", "email"]);
  });

  it("renders a preview table with a sticky semantic header", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    const headers = el.shadowRoot?.querySelectorAll('th[scope="col"]');
    // row-index column + 3 fields
    expect(headers?.length).to.equal(4);
  });

  it("highlights an invalid cell with aria-invalid", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,notnum,ada@x.dev"));
    const invalid = el.shadowRoot?.querySelector('td[aria-invalid="true"]');
    expect(invalid).to.exist;
    expect(el.currentResult?.stats.errorCount).to.be.greaterThan(0);
  });

  it("announces the summary via a live region", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    const region = el.shadowRoot?.querySelector('[part="summary"]');
    expect(region?.getAttribute("role")).to.equal("status");
    expect(region?.getAttribute("aria-live")).to.equal("polite");
  });

  it("uses role=alert for an error summary", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,bad,not-an-email"));
    const region = el.shadowRoot?.querySelector('[part="summary"]');
    expect(region?.getAttribute("role")).to.equal("alert");
  });

  it("emits fluid-parse with valid + rows on confirm", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    const confirm = oneEvent(el, "fluid-parse");
    const button = el.shadowRoot?.querySelector("fluid-button");
    button?.dispatchEvent(new Event("click"));
    const event = await confirm;
    expect(event.detail.valid).to.be.true;
    expect(event.detail.rows[0].name).to.equal("Ada");
  });

  it("emits fluid-parse-error on unreadable input", async () => {
    const el = await mount();
    const dz = el.shadowRoot?.querySelector("fluid-dropzone");
    const errored = oneEvent(el, "fluid-parse-error");
    dz?.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: [file("p.json", "{not valid json", "application/json")] },
        bubbles: true,
        composed: true
      })
    );
    const event = await errored;
    expect(event.detail.message).to.match(/JSON/);
  });

  it("export('json') returns serialized cleaned rows", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    const json = el.export("json");
    expect(JSON.parse(json)[0].name).to.equal("Ada");
  });

  it("reset() returns to the intake step", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    el.reset();
    await el.updateComplete;
    expect(el.currentResult).to.equal(null);
    expect(el.shadowRoot?.querySelector('[part="table"]')).to.not.exist;
  });
});
