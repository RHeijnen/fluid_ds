import { expect } from "@open-wc/testing";
import { detectFormat, parseJson, gridToTable, parseFile, ParserFileError } from "./parse-file.js";
import { parseDelimited } from "./csv.js";

function file(name: string, content: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

async function workbookFile(
  name: string,
  cells: (string | number | boolean | null)[][]
): Promise<File> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(cells), "Import");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([["ignored"], ["other sheet"]]),
    "Other"
  );
  const bytes: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([bytes], name, { type: "application/octet-stream" });
}

describe("detectFormat", () => {
  it("uses the extension first", () => {
    expect(detectFormat("data.json", "")).to.equal("json");
    expect(detectFormat("data.csv", "")).to.equal("csv");
    expect(detectFormat("data.tsv", "")).to.equal("tsv");
    expect(detectFormat("data.xlsx", "")).to.equal("xlsx");
  });

  it("sniffs JSON content when no extension", () => {
    expect(detectFormat("blob", '[{"a":1}]')).to.equal("json");
    expect(detectFormat("blob", '  {"a":1}')).to.equal("json");
  });

  it("sniffs TSV vs CSV from the first line", () => {
    expect(detectFormat("blob", "a\tb\tc\n1\t2\t3")).to.equal("tsv");
    expect(detectFormat("blob", "a,b,c")).to.equal("csv");
  });
});

describe("parseJson", () => {
  it("reads an array of objects, unioning keys in first-seen order", () => {
    const raw = parseJson('[{"a":1,"b":2},{"a":3,"c":4}]');
    expect(raw.columns).to.deep.equal(["a", "b", "c"]);
    expect(raw.rows.length).to.equal(2);
    expect(raw.rows[0]).to.deep.equal({ a: 1, b: 2 });
  });

  it("unwraps a { rows: [...] } envelope", () => {
    const raw = parseJson('{"rows":[{"x":1}]}');
    expect(raw.columns).to.deep.equal(["x"]);
  });

  it("unwraps a { data: [...] } envelope", () => {
    const raw = parseJson('{"data":[{"y":2}]}');
    expect(raw.columns).to.deep.equal(["y"]);
  });

  it("wraps a single object as one row", () => {
    const raw = parseJson('{"a":1}');
    expect(raw.rows.length).to.equal(1);
  });

  it("throws a friendly error on invalid JSON", () => {
    let failure: unknown;
    try {
      parseJson("{not json");
    } catch (error) {
      failure = error;
    }
    expect(failure).to.be.instanceOf(ParserFileError);
    expect(failure).to.include({ code: "invalidJsonSyntax" });
    expect((failure as ParserFileError<"invalidJsonSyntax">).parameters.reason).to.be.a("string");
    expect((failure as Error).message).to.match(/Invalid JSON/);
  });

  it("preserves mixed JSON entries as usable rows without duplicating the value column", () => {
    expect(
      parseJson('[{"name":"Ada"},0,false,null,["nested"],{"value":"explicit","age":30}]')
    ).to.deep.equal({
      columns: ["name", "value", "age"],
      rows: [
        { name: "Ada" },
        { value: 0 },
        { value: false },
        { value: null },
        { value: ["nested"] },
        { value: "explicit", age: 30 }
      ]
    });
  });

  it("rejects scalar JSON documents instead of silently returning an empty table", () => {
    for (const document of ["null", "false", "42", '"text"']) {
      let failure: unknown;
      try {
        parseJson(document);
      } catch (error) {
        failure = error;
      }
      expect(failure).to.be.instanceOf(ParserFileError);
      expect(failure).to.include({ code: "invalidJsonShape" });
      expect((failure as ParserFileError<"invalidJsonShape">).parameters).to.deep.equal({});
      expect((failure as Error).message).to.equal(
        "JSON must be an array of objects or an object with a rows/data array."
      );
    }
  });
});

describe("gridToTable", () => {
  it("auto-detects the header row, skipping leading blank lines", () => {
    const grid = parseDelimited("\n\nname,age\nAda,30", ",");
    const raw = gridToTable(grid, "auto");
    expect(raw.columns).to.deep.equal(["name", "age"]);
    expect(raw.rows[0]).to.deep.equal({ name: "Ada", age: "30" });
  });

  it("honors an explicit header row index", () => {
    const grid = parseDelimited("junk\nname,age\nAda,30", ",");
    const raw = gridToTable(grid, 1);
    expect(raw.columns).to.deep.equal(["name", "age"]);
    expect(raw.rows.length).to.equal(1);
  });

  it("dedupes duplicate header names", () => {
    const grid = parseDelimited("a,a,b\n1,2,3", ",");
    const raw = gridToTable(grid, "auto");
    expect(raw.columns).to.deep.equal(["a", "a_2", "b"]);
  });

  it("never overwrites a column when duplicate suffixes already exist", () => {
    const raw = gridToTable(parseDelimited("a,a,a_2,a\n1,2,3,4", ","), "auto");
    expect(raw.columns).to.deep.equal(["a", "a_3", "a_2", "a_4"]);
    expect(raw.rows[0]).to.deep.equal({ a: "1", a_3: "2", a_2: "3", a_4: "4" });
  });

  it("names empty header cells", () => {
    const grid = parseDelimited("a,,c\n1,2,3", ",");
    const raw = gridToTable(grid, "auto");
    expect(raw.columns).to.deep.equal(["a", "column_2", "c"]);
  });

  it("skips fully blank data rows", () => {
    const grid = parseDelimited("a,b\n1,2\n,\n3,4", ",");
    const raw = gridToTable(grid, "auto");
    expect(raw.rows.length).to.equal(2);
  });
});

describe("parseFile (integration)", () => {
  it("parses a CSV File with sniffed delimiter", async () => {
    const raw = await parseFile(file("p.csv", "name;age\nAda;30"));
    expect(raw.columns).to.deep.equal(["name", "age"]);
    expect(raw.rows[0]).to.deep.equal({ name: "Ada", age: "30" });
  });

  it("parses a TSV File", async () => {
    const raw = await parseFile(file("p.tsv", "name\tage\nAda\t30"));
    expect(raw.rows[0]).to.deep.equal({ name: "Ada", age: "30" });
  });

  it("parses a JSON File", async () => {
    const raw = await parseFile(file("p.json", '[{"name":"Ada"}]', "application/json"));
    expect(raw.rows[0]).to.deep.equal({ name: "Ada" });
  });

  it("reads the first real workbook sheet with blank rows, duplicate headers and typed cells", async () => {
    const source = await workbookFile("people.XLSX", [
      [],
      ["name", "score", "active", "name"],
      ["Ada", 12.5, true, "Ada Lovelace"],
      [],
      ["Bo", 0, false, null]
    ]);
    expect(await parseFile(source)).to.deep.equal({
      columns: ["name", "score", "active", "name_2"],
      rows: [
        { name: "Ada", score: "12.5", active: "true", name_2: "Ada Lovelace" },
        { name: "Bo", score: "0", active: "false", name_2: "" }
      ]
    });
  });

  it("honors an explicit workbook format and header row despite a misleading text extension", async () => {
    const source = await workbookFile("people.csv", [
      ["Import notes", "not a header"],
      [" name ", null, "count"],
      ["Ada", "note", 2]
    ]);
    expect(await parseFile(source, { format: "xlsx", headerRow: 1 })).to.deep.equal({
      columns: ["name", "column_2", "count"],
      rows: [{ name: "Ada", column_2: "note", count: "2" }]
    });
  });

  it("sniffs workbook ZIP bytes when the uploaded filename has no recognized extension", async () => {
    const source = await workbookFile("uploaded-document", [["name"], ["Ada"]]);
    expect(await parseFile(source)).to.deep.equal({
      columns: ["name"],
      rows: [{ name: "Ada" }]
    });
  });

  it("returns an empty table for an empty first worksheet without importing a later sheet", async () => {
    expect(await parseFile(await workbookFile("empty.xlsx", []))).to.deep.equal({
      columns: [],
      rows: []
    });
  });
});
