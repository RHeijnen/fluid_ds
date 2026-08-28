import { expect } from "@open-wc/testing";
import { applyBlueprint } from "./apply-blueprint.js";
import type { Blueprint, RawTable } from "./types.js";

const blueprint: Blueprint = {
  fields: [
    { key: "name", label: "Name", type: "string", required: true, aliases: ["full name"] },
    { key: "age", type: "integer", min: 0 },
    { key: "email", type: "email", required: true },
    { key: "status", type: "enum", options: ["active", "closed"], default: "active" }
  ]
};

function raw(rows: Record<string, unknown>[], columns?: string[]): RawTable {
  return { columns: columns ?? Object.keys(rows[0] ?? {}), rows };
}

describe("applyBlueprint", () => {
  it("maps, coerces, and validates clean rows", () => {
    const result = applyBlueprint(
      raw([{ name: "Ada", age: "30", email: "ada@x.dev", status: "active" }]),
      blueprint
    );
    expect(result.errors).to.deep.equal([]);
    expect(result.rows[0]).to.deep.equal({
      name: "Ada",
      age: 30,
      email: "ada@x.dev",
      status: "active"
    });
    expect(result.stats.kept).to.equal(1);
  });

  it("reports a cell error with row, field, value, and message", () => {
    const result = applyBlueprint(
      raw([{ name: "Ada", age: "oops", email: "ada@x.dev" }]),
      blueprint
    );
    const ageError = result.errors.find((e) => e.field === "age");
    expect(ageError).to.exist;
    expect(ageError?.row).to.equal(0);
    expect(ageError?.value).to.equal("oops");
    expect(ageError?.message).to.match(/not a number/);
    expect(ageError?.diagnostic).to.deep.equal({
      code: "invalidNumber",
      parameters: { label: "age", value: "oops" }
    });
  });

  it("still emits a row object even when a cell errors", () => {
    const result = applyBlueprint(raw([{ name: "Ada", email: "bad" }]), blueprint);
    expect(result.rows.length).to.equal(1);
    expect(result.stats.errorCount).to.be.greaterThan(0);
  });

  it("applies a default when the source cell is empty", () => {
    const result = applyBlueprint(
      raw([{ name: "Ada", email: "ada@x.dev", status: "" }]),
      blueprint
    );
    expect(result.rows[0]?.status).to.equal("active");
  });

  it("errors when a required field has no mapped column", () => {
    const result = applyBlueprint(raw([{ age: "30" }], ["age"]), blueprint);
    const required = result.errors.filter((e) => /required but no column/.test(e.message));
    expect(required.length).to.be.greaterThan(0);
  });

  it("respects an explicit mapping override", () => {
    const r = raw([{ moniker: "Ada", email: "ada@x.dev" }], ["moniker", "email"]);
    const result = applyBlueprint(r, blueprint, { mapping: { name: "moniker" } });
    expect(result.mapping.name).to.equal("moniker");
    expect(result.rows[0]?.name).to.equal("Ada");
  });

  it("dedupes on dedupeBy", () => {
    const bp: Blueprint = { ...blueprint, dedupeBy: "email" };
    const result = applyBlueprint(
      raw([
        { name: "Ada", email: "a@x.dev" },
        { name: "Ada2", email: "a@x.dev" },
        { name: "Bo", email: "b@x.dev" }
      ]),
      bp
    );
    expect(result.stats.kept).to.equal(2);
    expect(result.stats.duplicates).to.equal(1);
  });

  it("caps at maxRows and counts the overflow", () => {
    const bp: Blueprint = { ...blueprint, maxRows: 1 };
    const result = applyBlueprint(
      raw([
        { name: "Ada", email: "a@x.dev" },
        { name: "Bo", email: "b@x.dev" }
      ]),
      bp
    );
    expect(result.stats.kept).to.equal(1);
    expect(result.stats.truncated).to.equal(1);
  });

  it("does not attach discarded duplicate-row errors to the next kept row", () => {
    const result = applyBlueprint(
      raw([
        { name: "Ada", age: "30", email: "a@x.dev" },
        { name: "Duplicate", age: "invalid", email: "a@x.dev" },
        { name: "Bo", age: "20", email: "b@x.dev" }
      ]),
      { ...blueprint, dedupeBy: "email" }
    );
    expect(result.rows).to.have.length(2);
    expect(result.errors).to.deep.equal([]);
    expect(result.stats.duplicates).to.equal(1);
  });

  it("counts duplicate rows before applying the row cap", () => {
    const result = applyBlueprint(
      raw([
        { name: "Ada", email: "a@x.dev" },
        { name: "Duplicate", email: "a@x.dev" },
        { name: "Bo", email: "b@x.dev" }
      ]),
      { ...blueprint, dedupeBy: "email", maxRows: 1 }
    );
    expect(result.stats).to.deep.equal({
      total: 3,
      kept: 1,
      duplicates: 1,
      truncated: 1,
      errorCount: 0
    });
  });

  it("runs transform then validate", () => {
    const bp: Blueprint = {
      fields: [
        {
          key: "code",
          type: "string",
          transform: (v) => String(v).toUpperCase(),
          validate: (v) => (String(v).length === 3 ? true : "must be 3 chars")
        }
      ]
    };
    const okResult = applyBlueprint(raw([{ code: "abc" }]), bp);
    expect(okResult.rows[0]?.code).to.equal("ABC");
    expect(okResult.errors).to.deep.equal([]);

    const badResult = applyBlueprint(raw([{ code: "ab" }]), bp);
    expect(badResult.errors[0]?.message).to.equal("must be 3 chars");
  });

  it("reports a throwing transform without losing the coerced value or later rows", () => {
    const validated: unknown[] = [];
    const result = applyBlueprint(raw([{ count: "2" }, { count: "3" }]), {
      fields: [
        {
          key: "count",
          label: "Item count",
          type: "integer",
          transform: (value) => {
            if (value === 2) throw new Error("source rejected");
            return Number(value) * 10;
          },
          validate: (value) => {
            validated.push(value);
            return true;
          }
        }
      ]
    });
    expect(result.rows).to.deep.equal([{ count: 2 }, { count: 30 }]);
    expect(validated).to.deep.equal([2, 30]);
    expect(result.errors).to.deep.equal([
      {
        row: 0,
        field: "count",
        value: "2",
        message: "Item count transform failed: source rejected",
        diagnostic: {
          code: "transformFailed",
          parameters: { label: "Item count", reason: "source rejected" }
        }
      }
    ]);
    expect(result.stats).to.deep.equal({
      total: 2,
      kept: 2,
      duplicates: 0,
      truncated: 0,
      errorCount: 1
    });
  });

  it("normalizes non-Error transform throws into typed string diagnostics", () => {
    const result = applyBlueprint(raw([{ value: "x" }]), {
      fields: [
        {
          key: "value",
          type: "string",
          transform: () => {
            throw "plain failure";
          }
        }
      ]
    });
    expect(result.errors[0]?.message).to.equal("value transform failed: plain failure");
    expect(result.errors[0]?.diagnostic).to.deep.equal({
      code: "transformFailed",
      parameters: { label: "value", reason: "plain failure" }
    });
  });

  it("distinguishes parser-owned fallbacks from caller-owned validation messages", () => {
    const result = applyBlueprint(raw([{ value: "x" }]), {
      fields: [
        { key: "missing", label: "Required field", type: "string", required: true },
        { key: "value", label: "Custom field", type: "string", validate: () => "keep me verbatim" }
      ]
    });

    expect(result.errors[0]?.diagnostic).to.deep.equal({
      code: "unmappedRequired",
      parameters: { label: "Required field" }
    });
    expect(result.errors[1]).to.include({ message: "keep me verbatim" });
    expect(result.errors[1]?.diagnostic).to.deep.equal({
      code: "customValidation",
      parameters: { label: "Custom field" }
    });
  });

  it("does not invoke transform or validation when coercion fails", () => {
    let transformed = false;
    let validated = false;
    const result = applyBlueprint(raw([{ count: "not numeric" }]), {
      fields: [
        {
          key: "count",
          type: "integer",
          transform: (value) => {
            transformed = true;
            return value;
          },
          validate: () => {
            validated = true;
            return true;
          }
        }
      ]
    });
    expect(transformed).to.equal(false);
    expect(validated).to.equal(false);
    expect(result.rows).to.deep.equal([{ count: "not numeric" }]);
    expect(result.errors).to.have.length(1);
    expect(result.errors[0]).to.include({ row: 0, field: "count", value: "not numeric" });
    expect(result.errors[0]?.message).to.match(/not a number/);
    expect(result.stats.errorCount).to.equal(1);
  });
});
