import assert from "node:assert/strict";
import test from "node:test";
import { stateCoverage } from "./state-coverage.mjs";

test("supported open and invalid fixtures have retained accepted light baselines", async () => {
  const coverage = await stateCoverage();
  for (const fixture of [...coverage.open, ...coverage.invalid]) {
    assert.equal(fixture.present, true, fixture.fixtureId);
    assert.equal(fixture.acceptedLightBaseline, true, fixture.fixtureId);
  }
});

test("focus-state visual support is attributed but remains unaccepted", async () => {
  const coverage = await stateCoverage();
  assert.equal(coverage.focus.automatedStaticFixture, true);
  assert.equal(coverage.focus.acceptedLightBaseline, false);
  assert.match(coverage.focus.disposition, /real Tab key/i);
});
