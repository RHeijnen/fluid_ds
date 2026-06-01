import { expect } from "@open-wc/testing";
import { coerceCell, isEmpty } from "./coerce.js";
import type { FieldSpec } from "./types.js";

function field(spec: Partial<FieldSpec> & { type: FieldSpec["type"] }): FieldSpec {
  return { key: "f", ...spec };
}

function value(spec: Partial<FieldSpec> & { type: FieldSpec["type"] }, raw: unknown): unknown {
  const r = coerceCell(raw, field(spec));
  if (!r.ok) throw new Error(r.message);
  return r.value;
}

function message(spec: Partial<FieldSpec> & { type: FieldSpec["type"] }, raw: unknown): string {
  const r = coerceCell(raw, field(spec));
  if (r.ok) throw new Error("expected failure");
  return r.message;
}

describe("isEmpty", () => {
  it("treats null, undefined, and blank strings as empty", () => {
    expect(isEmpty(null)).to.be.true;
    expect(isEmpty(undefined)).to.be.true;
    expect(isEmpty("  ")).to.be.true;
    expect(isEmpty("x")).to.be.false;
    expect(isEmpty(0)).to.be.false;
  });
});

describe("coerceCell empties + defaults", () => {
  it("fails a required empty cell", () => {
    expect(message({ type: "string", required: true }, "")).to.match(/required/);
  });

  it("applies a default for an empty cell", () => {
    expect(value({ type: "number", default: 0 }, "")).to.equal(0);
  });

  it("returns null for optional empty non-string", () => {
    expect(value({ type: "number" }, "")).to.equal(null);
  });
});

describe("number / integer", () => {
  it("coerces numeric strings, stripping thousands separators", () => {
    expect(value({ type: "number" }, "1,234.5")).to.equal(1234.5);
  });
  it("rejects non-numbers", () => {
    expect(message({ type: "number" }, "abc")).to.match(/not a number/);
  });
  it("enforces integer-ness", () => {
    expect(message({ type: "integer" }, "1.5")).to.match(/whole number/);
  });
  it("enforces min / max", () => {
    expect(message({ type: "number", min: 10 }, "5")).to.match(/≥ 10/);
    expect(message({ type: "number", max: 10 }, "20")).to.match(/≤ 10/);
  });
});

describe("boolean", () => {
  it("coerces default truthy / falsy tokens", () => {
    expect(value({ type: "boolean" }, "yes")).to.equal(true);
    expect(value({ type: "boolean" }, "0")).to.equal(false);
  });
  it("honors a custom truthy set and rejects unknowns", () => {
    expect(value({ type: "boolean", truthy: ["paid"] }, "PAID")).to.equal(true);
    expect(message({ type: "boolean", truthy: ["paid"] }, "maybe")).to.match(/boolean/);
  });
});

describe("date", () => {
  it("passes through ISO date-only", () => {
    expect(value({ type: "date" }, "2026-06-15")).to.equal("2026-06-15");
  });
  it("parses US format", () => {
    expect(value({ type: "date", format: "us" }, "6/15/2026")).to.equal("2026-06-15");
  });
  it("parses EU format", () => {
    expect(value({ type: "date", format: "eu" }, "15/6/2026")).to.equal("2026-06-15");
  });
  it("rejects impossible dates", () => {
    expect(message({ type: "date", format: "us" }, "13/40/2026")).to.match(/valid date/);
  });
});

describe("email / url", () => {
  it("accepts + lower-cases a valid email", () => {
    expect(value({ type: "email" }, "Ada@Example.COM")).to.equal("ada@example.com");
  });
  it("rejects a bad email", () => {
    expect(message({ type: "email" }, "nope")).to.match(/valid email/);
  });
  it("normalizes a URL", () => {
    expect(value({ type: "url" }, "https://x.dev")).to.equal("https://x.dev/");
  });
  it("rejects a bad URL", () => {
    expect(message({ type: "url" }, "notaurl")).to.match(/valid URL/);
  });
});

describe("enum", () => {
  it("matches case-insensitively against string options", () => {
    expect(value({ type: "enum", options: ["Active", "Closed"] }, "active")).to.equal("Active");
  });
  it("rejects values outside the set", () => {
    expect(message({ type: "enum", options: ["a", "b"] }, "c")).to.match(/one of/);
  });
});

describe("json", () => {
  it("parses a JSON string", () => {
    expect(value({ type: "json" }, '{"a":1}')).to.deep.equal({ a: 1 });
  });
  it("rejects malformed JSON", () => {
    expect(message({ type: "json" }, "{bad")).to.match(/valid JSON/);
  });
});

describe("string constraints", () => {
  it("enforces length min / max", () => {
    expect(message({ type: "string", min: 3 }, "ab")).to.match(/at least 3/);
    expect(message({ type: "string", max: 2 }, "abc")).to.match(/at most 2/);
  });
  it("enforces a pattern", () => {
    expect(message({ type: "string", pattern: /^\d+$/ }, "x")).to.match(/required format/);
    expect(value({ type: "string", pattern: "^\\d+$" }, "42")).to.equal("42");
  });
});
