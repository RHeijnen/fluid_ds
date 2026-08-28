import assert from "node:assert/strict";
import test from "node:test";
import { checkScope } from "./check-certification-scope.mjs";

function fixture() {
  return {
    quality: {
      components: [
        { tag: "fluid-button", package: "@fluid-ds/components", maturity: "experimental" },
        { tag: "fluid-chart", package: "@fluid-ds/charts", maturity: "beta" }
      ]
    },
    maturity: {
      statuses: { experimental: "Experimental", beta: "Beta" },
      components: {
        "fluid-button": { status: "experimental", since: "0.4.0", support: "best-effort" },
        "fluid-chart": { status: "beta", since: "0.4.0", support: "best-effort" }
      }
    },
    scope: {
      status: "proposed",
      candidateGroups: { forms: ["fluid-button"] },
      remainder: { core: "Not certified", expansion: "Not certified" },
      requiredEvidenceForPromotion: ["manual-review"]
    }
  };
}
test("reports a cohort without promoting its public maturity", () => {
  const { quality, maturity, scope } = fixture();
  const before = JSON.stringify(maturity);
  const result = checkScope(quality, maturity, scope);
  assert.equal(result.catalog, 2);
  assert.equal(result.stableCandidates, 1);
  assert.equal(result.remainingExpansion, 1);
  assert.equal(result.promoted, 0);
  assert.equal(JSON.stringify(maturity), before);
});
for (const [name, mutate, message] of [
  [
    "duplicate catalog",
    (f) => f.quality.components.push(f.quality.components[0]),
    /Duplicate catalog/
  ],
  ["missing maturity", (f) => delete f.maturity.components["fluid-chart"], /exactly the catalog/],
  ["orphan maturity", (f) => (f.maturity.components["fluid-missing"] = {}), /exactly the catalog/],
  [
    "invalid maturity",
    (f) => (f.maturity.components["fluid-chart"].status = "imaginary"),
    /Invalid maturity/
  ],
  ["stale maturity", (f) => (f.quality.components[0].maturity = "beta"), /Stale maturity/],
  [
    "missing support",
    (f) => delete f.maturity.components["fluid-chart"].support,
    /Missing support/
  ],
  [
    "duplicate cohort",
    (f) => f.scope.candidateGroups.forms.push("fluid-button"),
    /Duplicate stable/
  ],
  [
    "unknown candidate",
    (f) => f.scope.candidateGroups.forms.push("fluid-missing"),
    /Unknown stable/
  ],
  ["empty cohort", (f) => (f.scope.candidateGroups.forms = []), /must not be empty/],
  ["invalid group", (f) => (f.scope.candidateGroups.forms = "fluid-button"), /must be arrays/],
  ["missing remainder rationale", (f) => delete f.scope.remainder.expansion, /scope rationale/],
  [
    "missing promotion evidence",
    (f) => (f.scope.requiredEvidenceForPromotion = []),
    /Promotion criteria/
  ]
]) {
  test(`rejects ${name}`, () => {
    const f = fixture();
    mutate(f);
    assert.throws(() => checkScope(f.quality, f.maturity, f.scope), message);
  });
}
