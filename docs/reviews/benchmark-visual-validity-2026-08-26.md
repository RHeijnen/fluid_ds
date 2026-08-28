# Benchmark and visual evidence audit

Read-only audit date: 2026-08-26. The bounded visual presence repair below is
separate from benchmark remediation and from human approval of screenshot
baselines. No performance budgets or screenshot tolerances were changed.

## Findings

Follow-up: the root task has since repaired the heap sampler and fresh-realm
hydration measurement, with negative controls and unchanged budgets. The first
corrected hydration run exposed a real tree-shaking defect in the `ssr-client`
entry; declaring its source/built imports side-effectful restored server-node
adoption. See `quality/baselines/2026-08-26-section-2-parallel.md` and CERT-021.
The findings below preserve the audited pre-fix state. Repeated performance,
broader runtime cases and the remaining visual items are not certified.

1. **CERT-003, assurance P1, open.** `apps/benchmarks/scripts/run.mjs` enables
   HeapProfiler but requests Performance metrics without enabling that domain.
   Missing `JSHeapUsedSize` becomes zero. The retained result at
   `2026-08-26T07:24:23.329Z` reports zero lifecycle growth and cannot certify
   memory retention. Enable the domain, reject missing/non-finite samples,
   retain raw before/after values, and demonstrate detection of an intentionally
   retained allocation before assessing the unchanged 3,000,000-byte budget.
2. **CERT-004, assurance P1, open.** The same benchmark page has already
   registered `fluid-button` when `setContent` installs server markup. The timer
   starts afterwards; registration plus `.every(element.shadowRoot)` neither
   proves hydration nor rejects an empty collection. Use a fresh realm, require
   exactly 100 unregistered server-rendered hosts, retain their server shadow
   nodes, load hydration support before definitions, wait for updates, and
   verify preserved node identity and the first native interaction. Keep the
   existing 500 ms budget; report any valid failure instead of silently widening it.
3. **Visual attribution, assurance P1.** The old generator credited every
   element sharing a source file to every story in that file. The screenshot
   test discovered only tags that happened to exist, so an absent advertised
   element did not fail. It also checked runtime errors only before capture.
   The bounded repair uses the accessibility suite's explicit positive fixture
   selection and setup, proves every claimed host is attached and upgraded,
   waits for its update, and retains the host identity through capture. Stories
   without an element attribution remain visual stories, not element evidence.
4. **Visual CI trigger gap, P2.** Expansion-package-only edits did not trigger
   the workflow. The bounded repair includes all packages, shared fixture
   selection/helpers, the quality inventory and dependency lock.
5. **Visual sensitivity and states, P2, open.** A 1% allowance on a 1024 by 768
   viewport allows roughly 7,864 differing pixels; a small control or focus ring
   can disappear below that threshold. `fullPage: false` excludes off-screen
   content. Default state screenshots do not prove hover, pressed, focused,
   invalid, disabled or open-state coverage. Add explicitly prepared states and
   scoped captures with negative controls in a separately reviewed slice.
   Do not silently tighten thresholds or accept new baselines.
6. **Visual reproducibility, P2, open.** Baseline paths omit OS/browser version,
   while developer generation and Ubuntu CI can use different renderers. The
   old generated inventory had 509 stories and 125 representatives: 1,009
   planned captures and 1,536 intentional mode skips, not a full catalog/state
   matrix. There were also 142 legacy images outside the active snapshot path.
   These are dated inventory facts, not claims about current executions. Pin a
   review environment, record baseline provenance, and review any cleanup.
7. **Other timing assurance, P2, open.** Browser timings are single samples;
   definition/hydration timings include host-to-browser automation overhead.
   Locale-switch timing does not assert a translated label. Runtime errors,
   missing budget metrics and non-finite values need fail-closed validation.
   Successful screenshot capture also does not yet prove Storybook play-function
   completion or the completion of every asynchronous dependency.

## Bounded visual repair and follow-up

The visual generator preserves every existing source-matched story. Only the
selected per-element fixtures receive `tags` coverage attribution. Existing
representative stories remain; explicit positive fixtures also run in each of
the five modes. This deliberately exposes additional missing baselines and
changed action-created content for human review. A fixture guard accepts hidden
utilities, traverses open shadow roots, performs shared setup actions once, and
rejects absent, unregistered or replaced hosts. Guard tests do not take images.

No baseline is approved by this repair, and no benchmark result is recertified.
Next implement benchmark instrumentation/negative controls with the existing
numeric budgets, then plan visual state coverage and baseline review in the
chosen deterministic rendering environment. Preserve unexpected failures as
evidence rather than treating a budget pass or image-file count as certification.
