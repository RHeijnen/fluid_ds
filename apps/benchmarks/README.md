# Fluid benchmark harness

The benchmark runner records deterministic bundle sizes, repeated SSR timings,
and repeated Chromium runtime/hydration measurements in `results.json`. The
default measured profile uses two discarded browser warmup runs, seven retained
fresh-context browser runs, 50 SSR warmup iterations, and seven retained SSR
runs of 100 iterations each.

Browser budgets are evaluated against the retained-run p95. With seven runs the
nearest-rank p95 is the maximum observation, which is intentionally conservative
and must be interpreted alongside the median, standard deviation, coefficient
of variation, and raw samples. Existing budgets are not recalibrated by the
runner.

The following environment variables support bounded controls without changing
the checked-in budgets:

- `BENCHMARK_BROWSER_WARMUPS` (0–10, default 2)
- `BENCHMARK_BROWSER_SAMPLES` (3–20, default 7)
- `BENCHMARK_SSR_WARMUPS` (0–1000, default 50)
- `BENCHMARK_SSR_RUNS` (3–20, default 7)
- `BENCHMARK_SSR_ITERATIONS` (10–1000, default 100)

Each browser sample uses a new context. Hydration uses a second, unregistered
document realm with parser-created declarative shadow roots and verifies server
node identity plus the first native interaction. CDP `Performance` and
`HeapProfiler` domains are explicitly enabled. Missing/non-finite samples,
missing CDP metrics, ineffective heap calibration, registered hydration realms,
and replaced server nodes fail closed.

Kanban and node-graph bundle scenarios use the same esbuild settings as the core
cases but remain informational. They do not acquire budgets implicitly.

## Expansion history

`pnpm benchmark:expansion` records a separate informational history for Table,
Chart, Scheduler, Rich Text Editor, File Parser, Map, and Node Graph. For each
case it retains a minified bundle observation and fresh-context samples for
initial render, a representative property update, and 20 disconnect/reconnect
cycles. The lifecycle memory interval retains the same already-initialized,
disconnected element across its forced-GC baseline and reconnects that exact
object, so first-use caches and allocation of another instance are not
mislabelled as reconnect growth. A retained-allocation calibration must be
visible in every sample or the run fails closed.

The default expansion profile uses one discarded warmup and five retained
samples per case. `BENCHMARK_EXPANSION_WARMUPS` accepts 0–5 and
`BENCHMARK_EXPANSION_SAMPLES` accepts 3–20. These measurements have no implicit
budgets: a single machine/time-window result is history, not a release limit or
a trend. Use `pnpm test:expansion` for the report-shape and negative controls.
