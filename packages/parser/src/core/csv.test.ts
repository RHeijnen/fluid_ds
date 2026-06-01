import { expect } from "@open-wc/testing";
import { parseDelimited, sniffDelimiter } from "./csv.js";

describe("parseDelimited (RFC 4180)", () => {
  it("parses a simple comma grid", () => {
    const grid = parseDelimited("a,b,c\n1,2,3", ",");
    expect(grid).to.deep.equal([
      ["a", "b", "c"],
      ["1", "2", "3"]
    ]);
  });

  it("handles \\r\\n line endings", () => {
    const grid = parseDelimited("a,b\r\n1,2\r\n3,4", ",");
    expect(grid).to.deep.equal([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"]
    ]);
  });

  it("keeps quoted fields containing the delimiter", () => {
    const grid = parseDelimited('name,note\n"Doe, John","hi"', ",");
    expect(grid[1]).to.deep.equal(["Doe, John", "hi"]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    const grid = parseDelimited('q\n"she said ""hi"""', ",");
    expect(grid[1]).to.deep.equal(['she said "hi"']);
  });

  it("keeps newlines inside a quoted field", () => {
    const grid = parseDelimited('a,b\n"line1\nline2",x', ",");
    expect(grid[1]).to.deep.equal(["line1\nline2", "x"]);
  });

  it("does not emit a spurious trailing empty row", () => {
    const grid = parseDelimited("a,b\n1,2\n", ",");
    expect(grid.length).to.equal(2);
  });

  it("preserves empty fields", () => {
    const grid = parseDelimited("a,,c", ",");
    expect(grid[0]).to.deep.equal(["a", "", "c"]);
  });

  it("parses tab-delimited content", () => {
    const grid = parseDelimited("a\tb\n1\t2", "\t");
    expect(grid).to.deep.equal([
      ["a", "b"],
      ["1", "2"]
    ]);
  });
});

describe("sniffDelimiter", () => {
  it("detects commas", () => {
    expect(sniffDelimiter("a,b,c\n1,2,3")).to.equal(",");
  });

  it("detects semicolons", () => {
    expect(sniffDelimiter("a;b;c\n1;2;3")).to.equal(";");
  });

  it("detects tabs", () => {
    expect(sniffDelimiter("a\tb\tc\n1\t2\t3")).to.equal("\t");
  });

  it("ignores delimiters inside quotes when scoring", () => {
    // Semicolon is the real delimiter; the commas live inside quotes.
    expect(sniffDelimiter('"a,a";"b,b";c\n"1,1";"2,2";3')).to.equal(";");
  });

  it("defaults to comma on ambiguous single-column input", () => {
    expect(sniffDelimiter("hello\nworld")).to.equal(",");
  });
});
