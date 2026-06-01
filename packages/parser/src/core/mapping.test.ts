import { expect } from "@open-wc/testing";
import { autoMap, normalize } from "./mapping.js";
import type { Blueprint } from "./types.js";

describe("normalize", () => {
  it("collapses case + punctuation", () => {
    expect(normalize("First Name")).to.equal("firstname");
    expect(normalize("first_name")).to.equal("firstname");
    expect(normalize("firstName")).to.equal("firstname");
  });
});

const blueprint: Blueprint = {
  fields: [
    { key: "firstName", label: "First name", type: "string", aliases: ["given name", "fname"] },
    { key: "email", type: "email" },
    { key: "age", type: "integer" }
  ]
};

describe("autoMap", () => {
  it("maps exact (normalized) matches", () => {
    const m = autoMap(["First Name", "email", "age"], blueprint);
    expect(m.firstName).to.equal("First Name");
    expect(m.email).to.equal("email");
    expect(m.age).to.equal("age");
  });

  it("maps via aliases", () => {
    const m = autoMap(["fname", "e-mail address", "Age"], blueprint);
    expect(m.firstName).to.equal("fname");
  });

  it("leaves unmatched fields null", () => {
    const m = autoMap(["totally", "unrelated"], blueprint);
    expect(m.firstName).to.equal(null);
    expect(m.email).to.equal(null);
  });

  it("uses each source column at most once", () => {
    // Two fields could both fuzzy-match "name"; only one wins it.
    const bp: Blueprint = {
      fields: [
        { key: "firstName", type: "string" },
        { key: "lastName", type: "string" }
      ]
    };
    const m = autoMap(["name"], bp);
    const claimed = [m.firstName, m.lastName].filter((c) => c === "name");
    expect(claimed.length).to.equal(1);
  });
});
