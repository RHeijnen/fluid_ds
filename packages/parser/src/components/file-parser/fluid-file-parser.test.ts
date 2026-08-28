import { aTimeout, expect, fixture, html, oneEvent } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type { FluidFileParser } from "./fluid-file-parser.js";
import type { Blueprint, CellError, ParserDiagnostic } from "../../core/types.js";

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

async function dropError(el: FluidFileParser, f: File): Promise<CustomEvent> {
  const errored = oneEvent(el, "fluid-parse-error");
  el.shadowRoot!.querySelector("fluid-dropzone")!.dispatchEvent(
    new CustomEvent("fluid-change", {
      detail: { files: [f] },
      bubbles: true,
      composed: true
    })
  );
  const event = await errored;
  await el.updateComplete;
  return event;
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
    const callout = el.shadowRoot!.querySelector("fluid-callout")!;
    await callout.updateComplete;
    const region = callout.shadowRoot!.querySelector('[role="status"]');
    expect(region?.getAttribute("role")).to.equal("status");
    // role=status carries implicit polite live-region semantics.
    expect(region?.getAttribute("aria-live")).not.to.equal("off");
  });

  it("uses role=alert for an error summary", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,bad,not-an-email"));
    const callout = el.shadowRoot!.querySelector("fluid-callout")!;
    await callout.updateComplete;
    const region = callout.shadowRoot!.querySelector('[role="alert"]');
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

  it("exposes one live region for results and errors, without nesting announcements", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    await el.updateComplete;
    const resultCallout = el.shadowRoot!.querySelector("fluid-callout")!;
    await resultCallout.updateComplete;
    expect(
      el.shadowRoot!.querySelectorAll('[role="status"], [role="alert"], [aria-live]')
    ).to.have.length(0);
    expect(resultCallout.shadowRoot!.querySelectorAll('[role="status"]')).to.have.length(1);
    const errored = oneEvent(el, "fluid-parse-error");
    el.shadowRoot!.querySelector("fluid-dropzone")!.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: [file("broken.json", "{invalid", "application/json")] },
        bubbles: true,
        composed: true
      })
    );
    await errored;
    await el.updateComplete;
    const errorCallout = el.shadowRoot!.querySelector("fluid-callout")!;
    await errorCallout.updateComplete;
    expect(
      el.shadowRoot!.querySelectorAll('[role="status"], [role="alert"], [aria-live]')
    ).to.have.length(0);
    expect(errorCallout.shadowRoot!.querySelectorAll('[role="alert"]')).to.have.length(1);
  });

  it("export('json') returns serialized cleaned rows", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    const json = el.export("json");
    expect(JSON.parse(json)[0].name).to.equal("Ada");
  });

  it("keeps export formats, MIME types, filenames, and canonical rows stable in Arabic", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-file-parser></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    el.blueprint = blueprint;
    await drop(el, file('caller <file> & "العربية".csv', "name,age,email\nAda,30,ada@x.dev"));
    const rows = el.currentResult!.rows;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    const blobs: Blob[] = [];
    const downloads: string[] = [];
    URL.createObjectURL = (blob: Blob | MediaSource): string => {
      blobs.push(blob as Blob);
      return `blob:parser-${blobs.length}`;
    };
    URL.revokeObjectURL = () => undefined;
    HTMLAnchorElement.prototype.click = function (): void {
      downloads.push(this.download);
    };
    try {
      const csv = el.export("csv");
      const json = el.export("json");
      expect(csv).to.include("Ada,30,ada@x.dev");
      expect(JSON.parse(json)).to.deep.equal(rows);
      expect(blobs.map((blob) => blob.type)).to.deep.equal([
        "text/csv;charset=utf-8",
        "application/json;charset=utf-8"
      ]);
      expect(downloads).to.deep.equal([
        'caller <file> & "العربية".cleaned.csv',
        'caller <file> & "العربية".cleaned.json'
      ]);
      expect(el.currentResult!.rows).to.equal(rows);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      HTMLAnchorElement.prototype.click = originalClick;
    }
  });

  it("reset() returns to the intake step", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,age,email\nAda,30,ada@x.dev"));
    el.reset();
    await el.updateComplete;
    expect(el.currentResult).to.equal(null);
    expect(el.shadowRoot?.querySelector('[part="table"]')).to.not.exist;
  });

  it("clears the preview when the selected file is removed", async () => {
    const el = await mount();
    await drop(el, file("p.csv", "name,email\nAda,ada@x.dev"));
    el.shadowRoot!.querySelector("fluid-dropzone")!.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: [] },
        bubbles: true,
        composed: true
      })
    );
    await el.updateComplete;
    expect(el.currentResult).to.equal(null);
    expect(el.shadowRoot!.querySelector("table")).to.equal(null);
  });

  it("does not resurrect an in-flight result after reset", async () => {
    const el = await mount();
    const slow = file("slow.csv", "");
    let finish!: (text: string) => void;
    slow.text = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const events: Event[] = [];
    el.addEventListener("fluid-file-loaded", (event) => events.push(event));
    el.shadowRoot!.querySelector("fluid-dropzone")!.dispatchEvent(
      new CustomEvent("fluid-change", {
        detail: { files: [slow] },
        bubbles: true,
        composed: true
      })
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[aria-busy="true"]')).to.exist;
    el.reset();
    finish("name,email\nStale,stale@x.dev");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;
    expect(el.currentResult).to.equal(null);
    expect(events).to.have.length(0);
    expect(el.shadowRoot!.querySelector('[aria-busy="true"]')).not.to.exist;
  });

  it("only accepts the newest concurrent read and ignores completion after disconnect", async () => {
    const el = await mount();
    const slow = file("slow.csv", "");
    let finish!: (text: string) => void;
    slow.text = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const zone = el.shadowRoot!.querySelector("fluid-dropzone")!;
    zone.dispatchEvent(new CustomEvent("fluid-change", { detail: { files: [slow] } }));
    await drop(el, file("latest.csv", "name,email\nLatest,latest@x.dev"));
    finish("name,email\nStale,stale@x.dev");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.currentResult!.rows[0]!.name).to.equal("Latest");
    zone.dispatchEvent(new CustomEvent("fluid-change", { detail: { files: [slow] } }));
    el.remove();
    finish("name,email\nDetached,detached@x.dev");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.currentResult).to.equal(null);
  });

  it("uses a localized dropzone default while preserving explicit labels, empty strings, and accept tokens", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-file-parser></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    await aTimeout(0);
    await el.updateComplete;
    const dropzone = el.shadowRoot!.querySelector("fluid-dropzone") as HTMLElement & {
      label: string;
      accept: string;
    };
    expect(dropzone.label).to.equal("أفلت ملف CSV أو JSON أو Excel هنا، أو انقر للاستعراض");
    expect(dropzone.accept).to.equal(".csv,.tsv,.json,.xlsx,.xls");
    el.label = "";
    await el.updateComplete;
    expect(dropzone.label).to.equal("");
    el.label = 'Caller <drop> & "label"';
    await el.updateComplete;
    expect(dropzone.label).to.equal('Caller <drop> & "label"');
  });

  for (const [content, expectedRaw, expectedLocalized] of [
    ["{not valid", /Invalid JSON:/, "JSON غير صالح:"],
    ["42", /JSON must be/, "يجب أن يكون JSON"]
  ] as const) {
    it(`localizes structured file errors while preserving the ${expectedRaw.source} event contract`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="ar"><fluid-file-parser></fluid-file-parser></div>
      `);
      const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
      const unusualName = 'caller <file> & "العربية".json';
      const event = await dropError(el, file(unusualName, content, "application/json"));
      const text = el.shadowRoot!.querySelector("fluid-callout")!.textContent!;
      expect(event.detail.message).to.match(expectedRaw);
      expect(text).to.include(expectedLocalized);
      expect(text).to.include(unusualName);
    });
  }

  it("preserves compatibility error detail and localizes only parser-owned fallback text", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="fr"><fluid-file-parser></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    const legacy = file("legacy.csv", "");
    legacy.text = async () => {
      throw new Error('Caller <validator> & "detail"');
    };
    const event = await dropError(el, legacy);
    expect(event.detail.message).to.equal('Caller <validator> & "detail"');
    expect(el.shadowRoot!.querySelector("fluid-callout")!.textContent).to.include(
      'Caller <validator> & "detail"'
    );

    const empty = file("empty.csv", "");
    empty.text = async () => {
      throw new Error("");
    };
    const fallbackEvent = await dropError(el, empty);
    expect(fallbackEvent.detail.message).to.equal("Could not parse the file.");
    expect(el.shadowRoot!.querySelector("fluid-callout")!.textContent).to.include(
      "Impossible d’analyser le fichier."
    );
  });

  it("localizes every structured cell diagnostic while retaining caller arguments and compatibility messages", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-file-parser></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    await aTimeout(0);
    const label = 'Caller <field> & "العربية"';
    const value = '<raw> & "value"';
    const reason = '<reason> & "detail"';
    const diagnostics: ParserDiagnostic[] = [
      { code: "required", parameters: { label } },
      { code: "stringTooShort", parameters: { label, minimum: 1234 } },
      { code: "stringTooLong", parameters: { label, maximum: 5678 } },
      { code: "patternMismatch", parameters: { label } },
      { code: "invalidNumber", parameters: { label, value } },
      { code: "invalidInteger", parameters: { label, value } },
      { code: "numberBelowMinimum", parameters: { label, minimum: 1234 } },
      { code: "numberAboveMaximum", parameters: { label, maximum: 5678 } },
      { code: "invalidBoolean", parameters: { label, value } },
      { code: "invalidDate", parameters: { label, value } },
      { code: "dateBeforeMinimum", parameters: { label } },
      { code: "dateAfterMaximum", parameters: { label } },
      { code: "invalidEmail", parameters: { label, value } },
      { code: "invalidUrl", parameters: { label, value } },
      { code: "invalidEnum", parameters: { label, options: ["one", '<two> & "ثلاثة"', 7] } },
      { code: "invalidJson", parameters: { label } },
      { code: "unmappedRequired", parameters: { label } },
      { code: "transformFailed", parameters: { label, reason } }
    ];
    const localize = (error: CellError): string =>
      (
        el as unknown as {
          localizedCellError(value: CellError): string;
        }
      ).localizedCellError(error);
    for (const diagnostic of diagnostics) {
      const message = localize({
        row: 0,
        field: "caller-key",
        value,
        message: "English sentinel",
        diagnostic
      });
      expect(message).not.to.equal("English sentinel");
      expect(message).to.include(label);
    }
    expect(
      localize({ row: 0, field: "x", value, message: "English", diagnostic: diagnostics[4] })
    ).to.include(value);
    expect(
      localize({ row: 0, field: "x", value, message: "English", diagnostic: diagnostics[14] })
    ).to.include('<two> & "ثلاثة"');
    expect(
      localize({ row: 0, field: "x", value, message: "English", diagnostic: diagnostics[17] })
    ).to.include(reason);
    expect(
      localize({
        row: 0,
        field: "x",
        value,
        message: 'Caller custom <validation> & "detail"',
        diagnostic: { code: "customValidation", parameters: { label } }
      })
    ).to.equal('Caller custom <validation> & "detail"');
    expect(
      localize({ row: 0, field: "x", value, message: "Legacy compatibility detail" })
    ).to.equal("Legacy compatibility detail");
  });

  it("switches inherited locale and direction live without reparsing, data mutation, or business events", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-file-parser preview-rows="1"></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    el.blueprint = {
      fields: [{ key: "caller-key", label: 'Caller <field> & "العربية"', type: "integer" }]
    };
    let reads = 0;
    const source = file('caller <file> & "العربية".csv', "");
    source.text = async () => {
      reads += 1;
      return 'caller-key\n"<raw> & العربية"';
    };
    await drop(el, source);
    const result = el.currentResult!;
    const rows = result.rows;
    const events: Event[] = [];
    for (const name of [
      "fluid-file-loaded",
      "fluid-parse-error",
      "fluid-parse",
      "fluid-mapping-change"
    ]) {
      el.addEventListener(name, (event) => events.push(event));
    }
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("dir")).to.equal("rtl");
    expect(el.shadowRoot!.textContent).to.include("تعيين الأعمدة");
    expect(el.shadowRoot!.textContent).to.include("معاينة");
    expect(
      el.shadowRoot!.querySelector('td[aria-invalid="true"]')!.getAttribute("title")
    ).to.include("<raw> & العربية");

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".base")!.getAttribute("dir")).to.equal("ltr");
    expect(el.shadowRoot!.textContent).to.include("Associer les colonnes");
    expect(el.shadowRoot!.textContent).to.include("Aperçu");
    expect(el.currentResult).to.equal(result);
    expect(el.currentResult!.rows).to.equal(rows);
    expect(reads).to.equal(1);
    expect(events).to.deep.equal([]);
  });

  it("formats Arabic counts and complete duplicate, truncation, error, preview, and action summaries", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><fluid-file-parser></fluid-file-parser></div>
    `);
    const el = wrapper.querySelector<FluidFileParser>("fluid-file-parser")!;
    el.blueprint = {
      fields: [{ key: "id", label: "Caller ID", type: "integer", required: true }],
      dedupeBy: "id",
      maxRows: 3
    };
    await drop(el, file("counts.csv", "id\n1\n1\nbad\n2\n3"));
    const text = el.shadowRoot!.textContent!;
    const number = new Intl.NumberFormat("ar");
    expect(el.currentResult!.stats).to.deep.equal({
      total: 5,
      kept: 3,
      duplicates: 1,
      truncated: 1,
      errorCount: 1
    });
    expect(text).to.include(number.format(5));
    expect(text).to.include(number.format(3));
    expect(text).to.include("تمت إزالة");
    expect(text).to.include("فوق حد الصفوف");
    expect(text).to.include("تم العثور على خطأ خلية واحد");
    expect(text).to.include("معاينة");
    expect(text).to.include("استيراد");
    expect(text).to.include("تنزيل CSV");
    expect(text).to.include("تنزيل JSON");
    expect(text).to.include("إعادة ضبط");
    expect(el.currentResult!.rows.map((row) => row.id)).to.deep.equal([1, "bad", 2]);
  });
});
