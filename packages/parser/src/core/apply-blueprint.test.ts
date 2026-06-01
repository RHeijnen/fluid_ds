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
    expect(result.rows[0]).to.deep.equal({ name: "Ada", age: 30, email: "ada@x.dev", status: "active" });
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
  });

  it("still emits a row object even when a cell errors", () => {
    const result = applyBlueprint(raw([{ name: "Ada", email: "bad" }]), blueprint);
    expect(result.rows.length).to.equal(1);
    expect(result.stats.errorCount).to.be.greaterThan(0);
  });

  it("applies a default when the source cell is empty", () => {
    const result = applyBlueprint(raw([{ name: "Ada", email: "ada@x.dev", status: "" }]), blueprint);
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
});
