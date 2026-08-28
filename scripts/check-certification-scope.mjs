import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function checkScope(quality, maturity, scope) {
  const catalog = new Set(quality.components.map(({ tag }) => tag));
  assert.equal(catalog.size, quality.components.length, "Duplicate catalog elements");
  assert.deepEqual(
    Object.keys(maturity.components).sort(),
    [...catalog].sort(),
    "Maturity must cover exactly the catalog"
  );
  for (const tags of Object.values(scope.candidateGroups))
    assert.ok(Array.isArray(tags), "Candidate groups must be arrays");
  const candidates = Object.values(scope.candidateGroups).flat();
  assert.ok(candidates.length, "A stable cohort must not be empty");
  assert.equal(new Set(candidates).size, candidates.length, "Duplicate stable candidates");
  for (const tag of candidates) assert.ok(catalog.has(tag), `Unknown stable candidate: ${tag}`);
  for (const component of quality.components) {
    const record = maturity.components[component.tag];
    assert.ok(
      Object.hasOwn(maturity.statuses, record.status),
      `Invalid maturity: ${component.tag}`
    );
    assert.ok(record.since && record.support, `Missing support record: ${component.tag}`);
    assert.equal(record.status, component.maturity, `Stale maturity: ${component.tag}`);
  }
  assert.ok(
    scope.remainder.core && scope.remainder.expansion,
    "Unassigned elements need a scope rationale"
  );
  assert.ok(scope.requiredEvidenceForPromotion.length, "Promotion criteria are required");
  const candidateSet = new Set(candidates);
  return {
    catalog: catalog.size,
    maturity: quality.components.reduce(
      (counts, item) => ({ ...counts, [item.maturity]: (counts[item.maturity] ?? 0) + 1 }),
      {}
    ),
    candidateGroups: Object.fromEntries(
      Object.entries(scope.candidateGroups).map(([group, tags]) => [group, tags.length])
    ),
    stableCandidates: candidates.length,
    remainingCore: quality.components.filter(
      (item) => item.package === "@fluid-ds/components" && !candidateSet.has(item.tag)
    ).length,
    remainingExpansion: quality.components.filter(
      (item) => item.package !== "@fluid-ds/components" && !candidateSet.has(item.tag)
    ).length,
    approval: scope.status,
    promoted: 0
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const root = new URL("../", import.meta.url);
  const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
  console.log(
    JSON.stringify(
      checkScope(
        await json("quality/component-quality.json"),
        await json("quality/maturity.json"),
        await json("quality/certification-scope.json")
      ),
      null,
      2
    )
  );
}
