# Canonical CEM / React event foundation — 2026-08-26

Status: canonical generation and 21 typed event contracts are integrated locally.
The initial six-contract batch passed fresh packed React browser and exact-artifact
frozen replay (21 checks each). The subsequent fifteen contracts pass static
checks, core/React builds, and fresh fourteen-package tarball verification; their
browser and packed-consumer rerun is pending. Historical runtime evidence below
does not certify this newer batch. Nothing has been published.
This slice makes no dependency/version updates and does not alter old evidence.

## Baseline audit findings, before integration

The independent quality catalog contains 155 registered elements across 14
component packages. Previously only `packages/components/custom-elements.json`
existed: it covered 124 tagged core classes, not the complete library.

The previous React generation input was the quality catalog plus source `@fires`
annotations. Its 89 eventful elements exposed 156 component/event pairs, all with
`CustomEvent<unknown>`. That is a useful honest fallback, not typed payload support.

The installed analyzer's raw event discovery treats identifier arguments to
`new CustomEvent(name)` / `new CustomEvent(type)` as event names. This creates
phantom `name` events on color-picker and number-input, and `type` on range-slider.
Its method-only discovery also misses arrow-member event dispatches. Separately,
its inheritance merge overwrites an explicitly declared member type with the
base type: `FluidInput.value` becomes the base `string | string[] | null`, despite
the concrete class declaring `string`.

Eight typed chart elements use a constructor-only class factory. Raw analyzer
output records their registrations but not class declarations, so inherited
`fluid-legend-change` events are absent. React's source-only event extraction also
misses `fluid-celebrate-end` and the tree-item's original `fluid-select` event.

These are metadata gaps; their discovery does not itself certify runtime behavior.
Local implementation references are the analyzer's `eventsVisitor` in
`src/features/analyse-phase/creators/createClass.js` and inheritance merge in
`src/features/post-processing/apply-inheritance.js` beneath the components package's
locked analyzer dependency. The official analyzer supports programmatic AST
plugins and typed `@fires` annotations; a typed annotation alone does not prove
that a dispatch supplies that payload. See the [analyzer documentation](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/).

## Implemented foundation and integration

`scripts/cem/canonical.mjs` uses the components package's existing declared analyzer
and its own exported TypeScript AST implementation. It does not introduce a new
dependency or evaluate component code.

- Normalize package-local module identity and resolve registered tags to concrete,
  publicly exported class declarations. Cross-check exact package/tag membership
  against the quality catalog, rather than treating an output count as proof.
- Adapt the existing constructor-only chart factory, including renamed imports.
  Unrecognized factories, additional subclass members, conditional factory shapes,
  duplicate identities, and cyclic inheritance fail closed.
- Preserve concrete members and event annotations over inherited metadata, while
  retaining inherited events and distinguishing static from instance members.
- Discover literal events actually passed to `this.dispatchEvent`, including arrow
  members and immutable local variables dispatched in the same lexical block.
  Dynamic parameter names never become public event names. Honor `@internal` and
  `@ignore`, including inline statement comments.
- Keep absent/bare custom-event payload types as `CustomEvent<unknown>`. Do not infer
  payload types from descriptions or object shapes.
- Provide deterministic manifest bytes and read-only missing/tampered output
  checks. The initial foundation wrote no outputs; phase two adds an explicit
  generation command and fourteen persisted manifests.
- Generate React wrappers and native JSX props from source-verified canonical
  CEM metadata, preserving exact generated-file drift checks. The old registration
  and `@fires` regular-expression input is removed.
- Require public barrel exports for named event aliases and their detail-type
  dependencies. Match each typed event to an actual literal dispatch with the
  same explicit generic. Because DOM event options permit omitted detail, also
  require an explicit object-literal detail (or explicit `null`). TypeScript checks
  those object literals against their exported detail contracts.
- Add six typed pairs: input input/change, typeahead input/change, button
  change/click. `TypeaheadOption` is publicly exported and its application `data`
  stays `unknown`. Button activation retains cancelability with explicit null detail.
- Include each manifest in package metadata, both export maps, and the published
  file list. Metadata validation is not a substitute for inspecting actual tarballs.

Read-only analysis of the current source resolves **14 packages, 155 registered
elements, 98 eventful elements, and 166 component/event pairs**. Twenty-one payload types
are explicit public contracts; **145 remain unknown**. The ten additional pairs are eight inherited chart legend
events, celebrate-end, and tree-item select.

## Verification and limits

Run `node --test scripts/cem/canonical.test.mjs` for fixture regressions and the
real-repository inventory check. Negative controls cover dynamic event arguments,
undispatched/shadowed/reassigned locals, internal events, unsupported factories,
cycles, duplicate identities, absent public exports, source-path escapes,
inventory mismatch, missing output, tampered output, inaccessible event/detail
types, missing or incompatible dispatch generics, omitted detail, and hidden `any`.
Shuffled source order
must produce identical bytes; output checks must not rewrite artifacts.

Run `node scripts/cem/audit.mjs` for current read-only counts;
`node scripts/cem/generate.mjs --check` verifies exact manifest bytes. The existing
components `analyze` command now generates all fourteen canonical manifests.
React generation rejects stale/tampered manifests before generating consumer types.

The initial six-contract checkpoint verified locally: 15 CEM tests, 5 publication-content tests, 5 owned-process tests,
7 React generation tests, 7 packed-runtime helper tests, and 3 framework-command
tests (42 total); scoped ESLint; core/React/admin-React typechecks; core and React
builds. The React fixture includes positive public imports and compile-negative
wrong-field, wrong-value, unknown application-data, and unknown fallback assertions.
The publication checker also rejected the retained pre-integration core tarball's
stale manifest in a read-only probe. No old archive was changed. Fresh fourteen-
package packing passed; its command is
`node scripts/cem/check-publication.mjs --pack` (no install or publish). Existing
archives can instead be checked with `--packs <directory>`.

Actual pack evidence: `quality/evidence/2026-08-26T14-20-00-162Z-cem-publication`.
All 14 archives (1,752,157 bytes total) contain the exact canonical manifests for
155 tags, correct publication metadata, and all 351 manifest-referenced source
module paths. Per-archive and manifest SHA-256 hashes are retained in `result.json`.
The enclosing recorder at
`quality/evidence/2026-08-26T14-19-58-515Z-cem-publication-actual` passed with
`sourceChanged: false`. This is before/after fingerprint evidence, not an atomic
filesystem snapshot or proof of every source byte inside each archived module.

The pack runner launches the known Node executable and a validated Corepack pnpm
entry without a shell. Supported layouts are sibling `node_modules` and the Unix
Node prefix's `lib/node_modules`; missing Corepack fails explicitly. Layout tests
pass, but remote CI execution is not yet verified. Deadline cleanup owns only the direct child handle, never a
PID tree. All fourteen children exited normally; descendant cleanup is recorded
as unknown, not claimed. Archive inspection checks module presence and exact CEM
bytes, not runtime behavior or successful registry publication.

Fresh React evidence:
`quality/evidence/framework-fixtures/2026-08-26T14-27-01-420Z--fluid-ds-admin-react`.
The six local archives passed strict-peer installation, isolated positive/negative
typechecking, production build, and 21 browser checks (seven per Chromium, Firefox,
and WebKit, including one missing-listener negative control per engine). The new
payload assertions cover typeahead query/selection and preserved application data,
boolean toggle state, and null/cancelable activation blocking submission. Runtime
console/page/network checks and teardown are clean. The initial resolution used
React 19.2.8 and is explicitly latest-compatible, not pinned certification. Its
install reported one transitive deprecation (`node-domexception@1.0.0`), not a peer
warning; no warning suppression was introduced.

Frozen replay evidence:
`quality/evidence/framework-replays/2026-08-26T14-28-15-794Z`.
A second temporary consumer passed frozen strict-peer installation, typecheck,
production build, and the same 21 browser checks. Hash verification passed for all
28 retained files (six tarballs plus consumer source/configuration/lock), before
and after replay, without modifying the original evidence. This proves relocation
on this Windows/Node 22 toolchain, not cross-platform execution or offline install.

The enclosing recorder
`quality/evidence/2026-08-26T14-26-59-508Z-react-cem-typed-runtime-replay` passed but
reported `sourceChanged: true` during concurrent work. The retained exact-graph
replay remains valid; this run is not a source-stable whole-workspace checkpoint.
Fresh/replay command logs now retain finite stage deadlines and direct-child exit
outcomes. Our cleanup has no recursive PID-tree fallback. Standard Playwright
close remains an upstream boundary: installed Playwright 1.60.0 can internally
use Windows `taskkill /T` after a graceful-close failure. No dependency patch or
absolute descendant-cleanup guarantee is claimed; neither run needed our emergency
cleanup, and any teardown timeout remains a failed runtime gate.

## Subsequent fifteen-contract batch (browser verification pending)

Ten additional components now expose explicit public aliases with typed actual
dispatches and CEM-backed native JSX/wrapper event props:

- Checkbox and switch change: `{ checked: boolean }`.
- Radio-group and select change: `{ value: string }`; both select dispatch sites
  (pointer and keyboard) are checked, not just one occurrence.
- Textarea and slider input/change: `{ value: string }`. A slider payload is not
  silently converted to a number.
- Tag-input change: `{ value: string[] }`, not its serialized form-submission value.
- Dialog, drawer, and popover show/hide: `null`. Explicit null preserves the prior
  CustomEvent default; no close reason or cancelable pre-event is invented.

All existing payloads, bubbling/composition, and cancellation flags are preserved.
The new public aliases/details are exported from the package barrel. The root's
`FluidTranslationArguments` type was also re-exported there on request, without
altering localization behavior. Number-input, range-slider, color-picker dynamic
emitters and Date-bearing contracts remain outside this bounded batch.

Static verification passed: 16 CEM plus 8 React generation tests (24 total), core/
React/admin-React typechecks, all 108 core browser-test files' typecheck, scoped
ESLint/format/diff checks, core and React builds, and exact 14-CEM/155-wrapper
generation checks. A new compiler fixture checks all fifteen native/wrapper event
aliases and invalid string/boolean/array/null assumptions. Four deliberately wrong
dispatch shapes produce exactly four TypeScript assignment diagnostics. Unknown
application data remains unknown; the untyped fallback assertion now uses the
still-untyped color-picker instead of the newly typed checkbox.

Existing component tests now assert exact payload shapes and original event flags
for these fifteen pairs, including both select dispatch paths. A missing textarea
committed-change assertion was added. These are authored, typechecked tests, not
yet claimed as executed browser evidence for the new batch.

Fresh actual-package inspection passed 14/14 with 155 tags, 1,764,145 archive bytes,
and all 352 referenced source-module paths present:
`quality/evidence/2026-08-26T14-39-01-157Z-cem-publication`.
The enclosing recorder
`quality/evidence/2026-08-26T14-38-59-340Z-cem-publication-21-typed` passed with
`sourceChanged: false`. The earlier fourteen archives and six-contract React
evidence are retained unchanged, not rewritten to match the new manifests.

This is not a general TypeScript control-flow/type checker. Complex event aliases,
cross-block local dispatch, and unrecognized factory patterns require explicit
annotations or an adapter. Package scope currently comes from the independently
generated quality catalog; catalog freshness remains a prerequisite. The bounded
typed-dispatch validator does not replace the TypeScript compiler or browser
payload checks. These static tests do not prove assistive-technology behavior.

## Remaining verification for this integration

1. Run an integrated checkpoint with stable source, including documentation and
   generation checks. The fresh retained evidence certifies only this bounded
   React CSR contract, not React SSR or the other five framework integrations.
2. Execute the new event assertions and rerun packed React typecheck/runtime plus
   exact-artifact replay for the additional fifteen contracts.
3. Extend explicit public payload contracts beyond the current 21 pairs. The
   remaining 145 pairs intentionally retain `CustomEvent<unknown>` until actual
   dispatch types and consumer checks are implemented.
