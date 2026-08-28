# Performance history and variance — 2026-08-27

## Outcome

The corrected benchmark harness now measures repeated fresh-context browser
runs, repeated SSR runs, real CDP performance metrics, heap telemetry, and
fresh-realm hydration. It retains raw samples and environment metadata in schema
version 3. Existing budgets were not changed.

The first measured Linux run was valid but failed the overall budget gate:
Dialog and Input exceeded their existing gzip limits. A focused bundle-analysis
follow-up removed avoidable component-internal dependency and decorator code;
the same declared profile now **passes without changing any budget**. All timing
and heap budgets also pass at the conservative seven-run nearest-rank p95.

Raw evidence:

- `apps/benchmarks/results.json` and
  `quality/baselines/2026-08-27-performance-linux-repeated.json`: declared
  2-warmup/7-sample profile.
- `quality/baselines/2026-08-27-performance-linux-no-warmup-control.json`:
  deliberately noisy 0-warmup/3-sample negative control.
- `quality/baselines/2026-08-27-performance-linux-after-bundle-reduction.json`:
  declared 2-warmup/7-sample profile after the scoped Dialog/Input reduction.

## Measurement contract

- Browser: two discarded warmup runs followed by seven retained runs. Every run
  creates a fresh context, a new runtime page, and a separate unregistered
  hydration document realm.
- SSR: 50 discarded warmup renders followed by seven runs of 100 retained
  renders (700 raw observations).
- Summaries: count, minimum, median, p90, p95, p99, maximum, mean, population
  variance, standard deviation, and coefficient of variation. Missing, extra,
  non-numeric, negative, or non-finite samples fail closed.
- Browser budgets: nearest-rank p95. At seven observations this equals the
  maximum retained run; medians and variance remain visible to prevent a lone
  tail from being mistaken for typical behavior.
- CDP: `Performance.enable` precedes every retained metric sample;
  `TaskDuration`, `ScriptDuration`, `LayoutDuration`, and
  `RecalcStyleDuration` are required before runtime and hydration deltas are
  accepted. `HeapProfiler` collection and the retained-allocation calibration
  remain mandatory.
- Hydration: exactly 100 unregistered parser-created DSD hosts must retain their
  original shadow roots and native buttons through upgrade, then pass the first
  keyboard interaction.

## Measured environment

- Linux 6.6.87.2 under WSL2, x64
- Node 22.22.2
- headless Chromium 148.0.7778.96 with precise memory information enabled
- Intel Core i5-8600K, 6 visible CPUs, 4 available parallel workers
- approximately 8.29 GB container-visible memory

This is one machine and one time window, not a cross-platform history.

## Repeated-run results

| Measurement                 |   Median |      p95 |     CV |         Existing budget | Outcome |
| --------------------------- | -------: | -------: | -----: | ----------------------: | ------- |
| SSR render                  | 0.114 ms | 0.230 ms | 133.6% | mean 0.5 ms; p95 1.5 ms | Pass    |
| Define runtime bundle       |   6.4 ms |   8.4 ms |  12.3% |                  250 ms | Pass    |
| Create 100 buttons          |  21.3 ms |  25.5 ms |  15.0% |                  150 ms | Pass    |
| Update 100 inputs           |   2.6 ms |   4.6 ms |  27.0% |                  100 ms | Pass    |
| Switch 100 localized labels |   9.4 ms |  31.5 ms |  63.1% |                  120 ms | Pass    |
| Hydrate 100 buttons         |  22.9 ms |  30.1 ms |  12.6% |                  500 ms | Pass    |
| Lifecycle heap growth       |    756 B |    852 B |   5.2% |             3,000,000 B | Pass    |

SSR's high CV is driven by a small number of sub-5 ms outliers against a very
small median; the retained p95 remains below budget. This run is evidence of
the observed distribution, not proof that future runs will have the same tail.

The CDP samples are non-zero and retained per run. Runtime TaskDuration had a
0.247 s median and 0.380 s p95; hydration TaskDuration had a 0.055 s median and
0.062 s p95. These cover the whole instrumented runtime/hydration phases and
are diagnostic history, not additional budgets.

## Initial bundle outcomes

| Scenario     | Gzip bytes | Existing budget | Outcome                  |
| ------------ | ---------: | --------------: | ------------------------ |
| Button       |     18,883 |          19,000 | Pass                     |
| Dialog       |     14,770 |          14,000 | **Fail by 770 B (5.5%)** |
| Input        |     16,533 |          16,000 | **Fail by 533 B (3.3%)** |
| React Button |     22,397 |          23,000 | Pass                     |
| Kanban       |     14,921 |            None | Informational            |
| Node Graph   |     18,698 |            None | Informational            |

Kanban and Node Graph use the same minified esbuild/gzip procedure, but were
added as expansion-package observations rather than silently assigning budgets.
The Dialog/Input limits were not widened to make this run pass.

## Dialog/Input bundle follow-up

`scripts/analyze-bundles.mjs` uses the benchmark's minified esbuild settings and
retains per-module output contributions plus level-9 gzip bytes. It showed that
both entries carry the expanded 12.8 KB minified English localization runtime;
that is legitimate shared behavior and was not removed or split for the
benchmark. The avoidable costs were instead local:

- Dialog instantiated the complete icon custom element, icon registry, and
  unsafe-HTML directive for its fixed decorative close glyph. The glyph is now
  an equivalent internal SVG inside the same translated, focusable button.
- Dialog and Input each used Lit's query decorator for one private shadow-root
  lookup. Equivalent SSR-safe getters remove that decorator boundary.
- Input used `classMap` for deterministic classes and `ifDefined` where Lit's
  existing `nothing` sentinel is sufficient. Focus styling now uses native
  `:focus-within`, and repeated handlers/update gates were consolidated without
  changing form values, native validity flags, event payloads, or public APIs.
- Shared field chrome no longer imports `ifDefined` solely for its optional
  `for` attribute. Its exported helper/API remains intact.

| Scenario | Before gzip | After gzip | Change | Existing budget | Outcome |
| -------- | ----------: | ---------: | -----: | --------------: | ------- |
| Dialog   |    14,770 B |   13,907 B | -863 B |        14,000 B | Pass    |
| Input    |    16,533 B |   15,987 B | -546 B |        16,000 B | Pass    |

The post-reduction run also retains Button at 18,883 B and React Button at
22,397 B; the informational Kanban and Node Graph observations remain 14,921 B
and 18,698 B. The narrow remaining Input headroom is recorded honestly rather
than hidden by widening its limit.

### Integration follow-up

The first post-reduction full browser/SSR runs exposed two integration issues;
both were investigated rather than excluded:

- Dropdown initialized its first active item inside a `requestAnimationFrame`.
  Under full-suite WebKit load, ArrowDown could arrive after `fluid-show` but
  before that frame, move from no active item to the first item, and then be
  reset there by the frame. Initial roving state is now established before
  asynchronous positioning and the public show event. The guard sends
  ArrowDown immediately after `fluid-show` and no longer relies on a timeout.
- The SSR fixture's fixed expectation of 234 shadow roots included Dialog's
  former nested `fluid-icon` shadow root. The inline decorative SVG correctly
  reduced the generated page to 233 roots while the catalog remained complete
  at 155 tags. Generation now asserts exact tag equality with
  `quality/component-quality.json`, independently totals the rendered catalog
  and state fixture shadow roots, and embeds that generated inventory for the
  response-integrity assertion. It therefore detects missing catalog entries
  or omitted rendered roots without hardcoding implementation depth.

## Negative controls

The statistics guards reject missing/extra samples and invalid values. CDP
guards reject a missing required metric, an absent end metric, and negative or
non-finite deltas. Existing hydration controls reject registered realms, empty
or host-only fixtures, and visually identical replacement nodes. Heap controls
retain a deliberate allocation and require visible growth.

The measured no-warmup control used three browser runs and three SSR runs of ten
iterations. SSR rose to a 0.351 ms median, 0.969 ms p95, 0.861 ms mean, and
272.6% CV, correctly failing the mean SSR budget. This demonstrates why the
declared warmup/sample profile and retained tails matter; it is not a baseline.

## Verification

- Initial declared Linux measurement: completed in about 14 seconds;
  `--check` exited 1 for the two retained bundle-budget failures.
- Post-reduction declared Linux measurement: completed in about 12 seconds;
  `--check` exited 0. Dialog is 13,907 B gzip and Input is 15,987 B gzip.
- No-warmup control: completed in about 11 seconds and retained failed status.
- Measurement/hydration guards: **13 passed**, including real Chromium heap and
  hydration controls plus missing-sample and CDP negative tests.
- Components and benchmark app TypeScript plus the Components build: exit 0.
- Focused Dialog/Input browser matrix: **36/36 passed** in Chromium, Firefox,
  and WebKit with clean supervised lifecycle. After the Dropdown race repair,
  the full Components matrix passed **1,861/1,861 in each engine** with clean
  supervised lifecycle.
- Focused Dropdown passed 16/16 in each engine, including the immediate
  post-`fluid-show` ArrowDown race guard.
- SSR generation proved exact equality with the 155-tag canonical catalog. The
  complete hydration spec passed **45/45** across Chromium, Firefox, and WebKit;
  the generated page currently contains the independently derived 233 DSD
  roots. The earlier focused Input client/DSD form-focus cases also passed.
- Scoped ESLint: exit 0 with no warnings.
- Prettier and evidence-shape checks: exit 0 after formatting the retained JSON.
- The original core benchmark tranche changed no budgets, manifests,
  dependency state, or lockfiles. The later expansion tranche's lock repair is
  recorded below.

## Expansion runtime and reconnect tranche

A separate informational harness now covers the plan-named Table, Chart,
Scheduler, Rich Text Editor, File Parser, Map, and Node Graph surfaces. Each
fresh Chromium context performs one discarded warmup plus five retained runs.
Every retained run records a minified bundle observation, initial render, a
representative update, and 20 disconnect/reconnect cycles of the same initialized
element. Parser's update parses a real 100-row CSV; Map runs without tile or CSS
network requests.

The original heap interval retained the already-initialized disconnected element
across a forced-GC baseline and reconnected that exact object 20 times. Follow-up
work showed that a first reconnect window still includes per-object warm-up
allocation. The current runner therefore records one 20-cycle warm-up window and
then measures an equal 20-cycle steady-state window on the same object. It also
records weak-reference survival for Chart.js and Leaflet instances, waits for
browser teardown before forced GC, and runs a raw-equivalent Leaflet control.
Missing cases/samples, non-finite values, an ineffective heap calibration, the
wrong reconnect count, or a missing rendered marker fail closed. Six report-
shape/negative-control tests pass.

Raw evidence is retained in
`quality/baselines/2026-08-27-performance-expansion-linux-repeated.json` (SHA-256
`54231605cffae561c88f530a570b207d127015bb341cbf2e47dfe5bb4ac8a2a1`). This
run used the same Linux/WSL2 hardware and Chromium 148 family described above,
inside a separate Node 22.22.2 container. Another container was producing the
visual history on the same host, so the timing values are useful reproducible
diagnostics but are **not** an uncontended baseline or a blocking budget.
Exact host/container hashes matched for the runner
(`27025a72ca77c464956908d3c818bd1a6aaa6159fe4d69340c267c11ac394a8d`),
report validator
(`d5516f9797d275496b2ca30c97ca92e90b1de3176a5389290991af428fa5684d`),
Map implementation
(`38f8cda5e020115c77452d8516ee359e074f4925a9299f2c3f6a9412c14d60c8`),
and final lock
(`0ef68fff3b69e094c7b3880a2aaf6715fc24e5dbb6b1c5d6b9f5d14da47d0c0d`).

| Case       | Bundle gzip | Render median / p95 | Update median / p95 | 20 reconnects median / p95 | Reconnect heap median / p95 |
| ---------- | ----------: | ------------------: | ------------------: | -------------------------: | --------------------------: |
| Table      |    13,996 B |      47.4 / 85.7 ms |     61.9 / 119.7 ms |           691.4 / 745.1 ms |           47,796 / 47,856 B |
| Chart      |    85,296 B |      68.3 / 94.9 ms |      29.1 / 40.8 ms |           662.3 / 680.8 ms |         434,008 / 434,132 B |
| Scheduler  |    20,864 B |      63.5 / 73.0 ms |      35.0 / 47.6 ms |           656.5 / 672.5 ms |         121,428 / 121,428 B |
| Editor     |    25,551 B |      20.8 / 22.7 ms |      33.2 / 40.6 ms |           649.5 / 674.5 ms |           54,380 / 54,380 B |
| Parser     |   195,461 B |      13.2 / 21.3 ms |     58.5 / 118.7 ms |           651.6 / 658.9 ms |           41,148 / 45,516 B |
| Map        |    57,603 B |      36.2 / 50.1 ms |      24.4 / 29.7 ms |           654.5 / 656.0 ms |         465,268 / 465,668 B |
| Node Graph |    18,698 B |      54.2 / 63.9 ms |      36.0 / 39.5 ms |           653.5 / 658.6 ms |           81,736 / 81,760 B |

That table remains the historical first-window observation and is superseded for
retention interpretation by
`quality/baselines/2026-08-27-performance-expansion-linux-steady-state.json`
(SHA-256
`b01c0107e13e82d17e4a10e171657bc30d6fa4ed715363b638e9a4819d9e67c7`).
The current five-sample steady-state profile reports Chart at 45,448 B p95 and
Map at 5,664 B p95. Weak references show 0/20 old Chart.js instances and 0/20
old Leaflet Maps in every measured window after the repair.

Before repair, Map was 20/20 retained immediately and after a one-second delayed
forced GC, with a 154,956 B steady-state p95. An opt-in run with
`BENCHMARK_EXPANSION_HEAP_SNAPSHOT=1 pnpm --filter @fluid-ds/benchmarks benchmark:expansion`
tags the old Maps and writes the intentionally untracked
`apps/benchmarks/map-retention.heapsnapshot`; `pnpm --filter
@fluid-ds/benchmarks analyze:map-retention` walks strong edges. The captured
path was Window -> live `fluid-map` -> viewport -> `_leaflet_events` ->
`scroll1_358` -> closure/context -> old Leaflet Map. Leaflet 1.9.4 registers that
scroll guard outside `_initEvents`, so normal `Map.remove()` omitted it. Clearing
Leaflet-owned events from the component-private viewport after normal teardown
closes this retained-object defect.

No expansion budget was created. Chart's old third-party instances collect, but
its small positive heap slope is still an observation rather than a silently
accepted limit. Cycle-count analysis, uncontended pinned CI across dates and
cross-engine profiles remain required; broad leak-freedom and trend claims stay
open.

The first expansion run also found a real Map lifecycle failure: Leaflet 1.9's
untracked 250 ms zoom-transition fallback could execute after `remove()` and
read a deleted map pane. The component now disables Leaflet's optional zoom
animation at initialization and calls its public `stop()` before removal. A
rapid zoom/disconnect/reconnect regression passes with the Map package's 26
Chromium assertions. The disposable container lacks an init/reaper, so the WTR
supervisor separately and correctly reported orphaned Chrome/esbuild children
after those passing assertions; restarting the owned disposable container
removed them before the retained benchmark run.

The run also exposed and repaired a stale workspace lock: the prior lock omitted
53 importer lines and contained seven Vite 7.3.2 nested references without a
matching package entry. The minimal lock reconciliation preserves Vite 7.3.5,
Wrangler 4.127.0, and the SheetJS SHA-512 integrity, introduces no package
version churn, and passes a frozen install for all 37 workspace projects. Lock
SHA-256 changed from
`8bdaee90a30f629dc4faa122fbbff5570d733dcaf611e47b2e805886b56a6f4d` to
`0ef68fff3b69e094c7b3880a2aaf6715fc24e5dbb6b1c5d6b9f5d14da47d0c0d`.

## Remaining history

Repeat the declared profile on pinned native Linux CI and over multiple dates
before treating variance as a trend. Separate histories remain needed for
native Windows and macOS, ARM, browser-version changes, CPU throttling, and
representative low-memory/mobile hardware. This tranche measured Chromium only;
it does not claim Firefox, WebKit/Safari, field Core Web Vitals, network-load,
user-device, or production performance coverage.
