import { expect } from "@open-wc/testing";
import { toCSV, toJSON } from "./export.js";

describe("toCSV", () => {
  it("writes a header from field keys and rows in order", () => {
    const csv = toCSV(
      [
        { a: 1, b: "x" },
        { a: 2, b: "y" }
      ],
      [
        { key: "a", type: "number" },
        { key: "b", type: "string" }
      ]
    );
    expect(csv).to.equal("a,b\r\n1,x\r\n2,y");
  });

  it("quotes cells with commas, quotes, or newlines", () => {
    const csv = toCSV([{ a: "x,y", b: 'he said "hi"' }]);
    expect(csv.split("\r\n")[1]).to.equal('"x,y","he said ""hi"""');
  });

  it("serializes object cells as JSON", () => {
    const csv = toCSV([{ meta: { n: 1 } }]);
    expect(csv.split("\r\n")[1]).to.equal('"{""n"":1}"');
  });
});

describe("toJSON", () => {
  it("pretty-prints rows", () => {
    expect(toJSON([{ a: 1 }])).to.equal('[\n  {\n    "a": 1\n  }\n]');
  });
});
