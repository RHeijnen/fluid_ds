import { expect } from "@open-wc/testing";
import { detectFormat, parseJson, gridToTable, parseFile } from "./parse-file.js";
import { parseDelimited } from "./csv.js";

function file(name: string, content: string, type = "text/plain"): File {
  return new File([content], name, { type });
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
    expect(() => parseJson("{not json")).to.throw(/Invalid JSON/);
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
});
