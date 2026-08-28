# Linux verification, 26 August 2026

Status: bounded local verification, not CI, Safari or production certification.
The owner opened Docker and authorized this run. Existing project containers
were not started, stopped or modified. No commits occurred. The initial baseline
made no dependency upgrades; the later scoped security-patch snapshot is recorded
separately below.

## Latest completed local checkpoint

| Gate | Verified result |
| --- | --- |
| Full `verify` | Pass; 6,888 unit executions across 42 package/engine runs, 18 builds, 1,903 cold imports, 155 renders and 24,224 local docs links |
| Measured coverage | Pass; 2,296 cases, 14 unchanged package floors, all 202 required runtime files measured |
| Rebuilt Storybook | 102 tagged contracts pass; 125 untagged stories are outside that count |
| Browser accessibility | 621/621 pass, 207 per engine, one attempt each, including all 465 catalog axe audits |
| Angular and Next | Typechecks and actual production builds pass after compatible patches and the Angular registry mapping repair |
| Actual packed consumer | 18 archives installed with strict peers; all public-file targets and 16 runtime/type roots pass |
| Packed manifests | 14 manifests / 155 tags pass, both freshly packed and in the exact consumer archives |
| Performance | Eight measurement guards and all existing budgets pass; representative single-run evidence only |

The complete verification uses source `fa4e48a8...`. The separately checked
package-evidence cleanup repair, coverage, rebuilt Storybook, accessibility,
packing and benchmarks use `6cb3edac...`. Their exact three-file delta is retained
below; no component or dependency changes separate those snapshots. All named
completed gates have stable before/after source fingerprints and normal exits.
Current host-only changes after these runs document the results.

This closes the local repair/verification batch, not the production program.
Six required native form-focus contracts, broader pre-hydration state adoption,
framework SSR/runtime coverage, localization completion, visual acceptance and
history, unresolved security findings and human certification remain open.
No owner sign-off, component promotion, commit or publication is implied.

## Reproducible environment

- Docker Desktop Linux/amd64 on WSL2 kernel `6.6.87.2-microsoft-standard-WSL2`.
- Playwright 1.60.0 Ubuntu Noble image pinned to
  `sha256:83192064c7510f7ee73dd63dc5f22a5e01a92c81a2e6a9c715d9e3fe55471fd9`.
- Node 22.22.2 copied from the official image pinned to
  `sha256:868499d55378719bffa87b0ed1f099591823c029b543043c09c2483468e93201`.
- pnpm 9.15.0; Python 3.12.3 with native pidfd support.
- Four CPUs, 6 GiB memory, 1 GiB shared memory, init process, no exposed ports.
- A private Linux filesystem copy of 4,264 source entries, including uncommitted
  changes; no Windows dependencies or build outputs copied. Git metadata is
  mounted read-only. Dependency installation used the unchanged frozen lockfile.

The recipe, per-file snapshot hashes and retained raw results are under
`quality/evidence/linux-verification-2026-08-26/`. Initial source SHA-256:
`68ff60e134f4828d99c3656c89960f99b1c72f065d038a1c6c533d5d0f487c8c`.
Lock SHA-256:
`a4c0bbccc7738c7620883383839cc3446fabd52c14116764eb7689181878277c`.

## Executed baseline

All three records below have unchanged before/after source fingerprints and
normal zero exits. Failed historical Windows gates remain failed evidence.

| Gate | Result | Retained record suffix |
| --- | --- | --- |
| All 18 package builds | Pass | `15-09-36-462Z-linux-build-baseline` |
| Native ownership/lifecycle | 28 pass, one Windows-only test skipped | `15-10-03-085Z-linux-native-safety-baseline` |
| Combined SSR browser gate | 90 pass: 30 per engine; normal shutdown in 273.482 seconds | `15-10-43-773Z-linux-ssr-90-integrated` |

The native run exercises actual Linux pidfd identity rejection and termination
of a freshly spawned owned child, in addition to mock and lifecycle controls.
It precedes the newer startup/inventory/cleanup watchdog work; those new guards
need their own native run. Same-tick ownership ambiguity remains a failure, not
permission to terminate a process.

The SSR run includes the full catalog response/registration checks and named
form-state/node-retention contracts, including nine required-focus controls.
It does not establish pre-hydration restoration for all form controls, framework
DSD compatibility, native ancestor-language inheritance or assistive-technology
support. Windows typecheck/docs work overlapped part of the run; this is not a
controlled timing benchmark or a direct Windows-versus-Linux speed comparison.

## Remaining verification

The expanded watchdog subsequently passed 39 applicable checks with one
Windows-only skip, normally and with stable source:
`15-23-09-093Z-linux-watchdog-stage-corrected-forty`. The preceding run failed
because its race fixture assumed an inventory-probe ordinal. The corrected
fixture observes the real worker identity disappearing and proves the deadline
falls inside the held inventory operation. Production ownership rules were not
weakened. Windows separately passed 40 checks before this fixture correction,
then passed the corrected targeted race. Raw results are retained in
`watchdog-first-results/` and `watchdog-corrected-results/` beneath the evidence
directory above. No test/browser processes remained in the container afterward.

Two coverage batches then exercised all 14 component packages. All 2,254
assertions passed, but coverage gates correctly failed for three packages:

| Package | Measured | Unchanged requirement |
| --- | --- | --- |
| Editor | 75% branches (42/56) | 83% |
| Map | 93.67% lines/statements; 94.73% functions | 99% each |
| Parser | 94.86% lines/statements (1,386/1,461) | 95% |

The initial batch (`15-21-16-960Z-linux-runtime-coverage-integrated`) stopped
after editor, with the queued kanban package also completing. A second explicit
seven-package diagnostic batch used pnpm's `--no-bail` to expose all remaining
failures (`15-27-52-040Z-linux-remaining-seven-coverage`). Both exited nonzero
with stable source. A read-only inventory check found no missing runtime files
across their fresh reports; that does not turn failed thresholds into a pass.
The core result alone is 1,797 passing assertions, 96.35% lines/statements,
86.07% branches and 87.89% functions. It is not a catalog-wide coverage score.

Behavior-focused repairs and tests subsequently close all three floors in a
single fresh 14-package Chromium run:
`15-53-17-983Z-linux-frozen-complete-coverage`. All 2,293 cases pass, all package
thresholds pass, and the runtime-file inventory has no unexplained omissions.
The process exits normally in 94.3 seconds with unchanged source before/after.
The 4,268-entry snapshot is `full-2026-08-26T15-51-21-070Z`, SHA-256
`6b0527f7e1ec89163fc0f088743ee19da6b2872fdbc795c6aa92741363646514`.
The new lock SHA-256 is
`42073752a521ec37aab35cbc56de83f781237a9d4be93b530ffe7fa67f93a91f`:
the only additional change is three importer lines declaring editor's already
resolved browser-command test helper, with no version upgrades.

| Repaired package | Cases | Lines/statements | Branches | Functions |
| --- | ---: | ---: | ---: | ---: |
| Editor | 43 | 100% | 97.89% | 100% |
| Map | 21 | 100% | 92.95% | 100% |
| Parser | 106 | 97.6% | 85% | 97.77% |

Raw coverage reports are retained in `frozen-coverage-reports/`; gate logs and
the inventory are in `frozen-coverage-and-types-results/`. This is measured
browser-loaded runtime coverage for the 14 component packages, with explicit
registration/SSR boundaries, not coverage of every published package or every
behavior. The core-only result is 1,797 cases, 96.35% lines/statements, 86.02%
branches and 87.89% functions.

The next full verification correctly fails at editor's package TypeScript 5.8.3
declarations, which lack `getComposedRanges`: `15-55-07-526Z-linux-frozen-full-verify`.
Both Windows and Linux have that leaf compiler; the earlier targeted check used
the workspace's 5.9.3 compiler. A local optional capability type fixes both
versions without changing emitted JavaScript, global DOM types or dependencies.
The [editor review](editor-selection-2026-08-26.md) retains the actual leaf
compiler RED/GREEN records. A new complete verification remains required.

The next complete attempt, `16-04-58-131Z-linux-integrated-verify-editor-date`,
passes typechecks, lint and the pre-matrix guards but exposes two unsupported
`ENTER` driver commands in new date-picker tests. All 1,797 preceding core cases
still pass in each engine. Correcting the driver key to `Enter` passes all 19
date-picker units separately in Chromium, Firefox and WebKit, with stable source
and normal exits (`16-11-59-650Z`, `16-12-04-236Z`, `16-12-11-106Z`).

That failure also exposes CERT-047: recursive pnpm bail starts a queued package
before rejecting, so later packages are skipped and successive engine phases can
overlap. Only five of fourteen packages run per engine in that failed attempt;
it is not a complete matrix. Both the matrix and coverage runners now drain
selected packages with `--no-bail`, retaining nonzero failure. Actual installed
pnpm regression fixtures pass six checks after two causal baseline failures.
The later complete matrix below demonstrates all 42 package/engine runs draining
despite a retained failure; it does not establish a passing full verification.

The separate complete SSR gate subsequently passes all 96 cases with stable
source and normal shutdown in 180.961 seconds:
`16-16-20-848Z-linux-integrated-ssr-96`. Its snapshot is
`1674fdbabe0c9bc244619558ba5c1959c45537a70f048d4bc5ea46077814d299`, with the same
new lock hash above. This includes ten of sixteen required-focus controls,
not all form-state restoration or calendar popup behavior. The report and logs
are retained in `ssr-96-passed-playwright-report/` and `ssr-96-passed-results/`.
The full source-stable Storybook rebuild and its 102 tagged representative
interaction contracts also pass (`16-19-58-433Z-linux-current-storybook-build`,
`16-20-51-509Z-linux-current-storybook-102`). Untagged stories remain outside that
contract run; it is not a claim that every Storybook entry or state was tested.

## Accessibility gate and bounded diagnostics

The full Linux accessibility run fails normally with stable source: 618 of 621
checks pass, including all 465 catalog axe checks (155 elements in three engines).
The three failures are Chromium's font-width expectation and WebKit's zoom
keyboard exit and caption-cue expectations. This is not a green accessibility
gate. The exact record, including `result.json` and `output.log`, is
`quality/evidence/linux-verification-2026-08-26/a11y-621-failed-results/2026-08-26T16-22-12-937Z-linux-current-a11y-621/`.
Traces and screenshots are in the sibling `a11y-621-failed-test-results/` folder.
The run takes 562.027 seconds and retains the `1674fdb...` snapshot above.

The font diagnostic independently loads the same bundled bytes under reference
font-family names. Actual and reference canvas widths match within each engine:
Chromium 307/350, Firefox about 306.700/336 and WebKit about 306.664/336.001
for Inter/JetBrains Mono. Fallback widths differ. The hard-coded Windows widths
therefore do not establish a missing font on Linux. Retained evidence is
`quality/evidence/2026-08-26T16-34-59-028Z-linux-font-same-bytes-probe/` and
`quality/evidence/font-platform-probe-results.json` in the private Linux workspace.
The same-platform reference assertion repair and selected-caption contract
subsequently pass six targeted browser cases across all three engines:
`16-45-13-606Z-linux-font-caption-targeted`. This does not turn the failed full
gate green.

Two source-stable WebKit zoom probes retain the original mixed pointer/keyboard
failure. Moving the pointer away does not repair it; an equivalent bare native
button group inside a shadow root also fails, while the light-DOM equivalent
and a keyboard-only sequence exit correctly. The follow-up explicitly verifies
that Pan down has deep focus before Tab: both a single native `focus()` and
Playwright's focus operation still move to Zoom out, not After zoom. A genuine
native blur/refocus transition restores the expected exit in both Fluid and the
bare-shadow control. That bare fixture copied the component's CSS and decoration,
so it did not isolate a general shadow-root defect.
Exact records are
`quality/evidence/2026-08-26T16-36-33-989Z-zoom-focus-linux-diagnostic/` and
`quality/evidence/2026-08-26T16-37-59-839Z-zoom-focus-linux-native-methods/`.
The next causal probe narrows the failure further: an unstyled plain-text native
button passes, adding only an inner `span` reproduces the failure, and applying
`pointer-events: none` to the owned decoration restores the expected exit. The
runtime CSS now makes pointer hits land on the actual control. A new unit checks
`elementFromPoint()` against each of the seven decorated buttons; transform
assertions inspect actual `DOMMatrix` x/y/scale rather than engine-specific
serialized strings. All 12 units pass in each of the three engines:
`16-49-17-404Z-linux-zoom-complete-transform-assertions`.

The preceding `16-48-10` run retains four old CSS-serialization assertion failures
per Firefox/WebKit, and `16-48-59` retains one missed final-reset assertion per
engine. Those failures are not relabeled as passes. The original mixed
pointer/keyboard Playwright contract subsequently passes within the rebuilt
18-case media/font run, `16-49-56-414Z`. This targeted result does not replace a
fresh complete accessibility gate.

The caption diagnostic also reproduces disabled-by-default native tracks with
no loaded cues in bare and Fluid fixtures. Explicitly selecting the native track
loads the real cue and exposes its active playback state. The test now exercises
that selection without a component runtime change and passes in the six-case
targeted run above. A fresh complete accessibility gate remains pending.

## Complete matrix failure and next frozen snapshot

The hardened verification first rejects stale generated quality evidence in
`16-51-22-143Z-linux-hardened-complete-verify`. Regeneration changes the zoom
unit count from 11 to 12; it does not change a coverage floor. The next run,
`16-53-41-798Z-linux-hardened-fresh-inventory-verify`, exposes the Mocha adapter's
pending-test false positive: Mocha records a forbidden-pending error, but the
upstream collector treats the still-pending test as acceptable and ignores
Mocha's failure count. The supervisor now recursively reconciles public test
results and rejects retained errors regardless of passed/skipped flags. Eight
actual browser policy controls and five Node controls pass in
`16-57-50-034Z-linux-mocha-result-reconciliation`. Ordinary unsupervised WTR
remains outside this certification boundary and retains the upstream defect.

The next complete verification drains all 14 packages in each engine, retaining
one genuine failed assertion rather than stopping or overlapping engine phases:

| Engine | Package runs | Passed cases | Failed cases |
| --- | ---: | ---: | ---: |
| Chromium | 14 | 2,296 | 0 |
| Firefox | 14 | 2,295 | 1 |
| WebKit | 14 | 2,296 | 0 |
| Total | 42 | 6,887 | 1 |

Record:
`quality/evidence/2026-08-26T16-58-40-877Z-linux-complete-reconciled-verify/`.
It exits normally with code 1 after 531.06 seconds, with unchanged source
`6d8387e2f891f7a7c6ebcc23a2dadaced456edbee834027c38c245e26406a250`.
All 42 lifecycle runs finish: 41 pass and the Firefox media run retains its test
failure. The subsequent build, cold SSR and documentation stages are not reached.
This proves the repaired `--no-bail` orchestration drains the full matrix, not
that the full gate passes.

The sole assertion assumes Firefox exposes native `video.playsInline` as a
boolean; it observes `undefined`. The corrected test requires `playsinline`
attribute presence and removal, compares IDL reflection with a plain native
video, and still asserts autoplay/loop/muted on and off. All 13 video cases pass
in each engine, 39 executions total, in
`quality/evidence/2026-08-26T17-07-52-107Z-linux-native-video-boolean-reflection/`.
That run exits normally in 5.367 seconds with unchanged source
`26ac844a41dda8a37932e27bfe44dc4251802d951a50829133b1f9c6a4a19eed`.
Both records retain lock hash `42073752...` above. The targeted repair does not
relabel the failed complete run.

The next private copy, `full-2026-08-26T17-08-07-625Z`, includes the narrow
Angular/Next security patches and has source SHA-256
`050732453b66fe7fb51d9c8dd9a2b57db68d1d12c0588138d794077e7aac24bf` and lock SHA-256
`eb82ee9f7c82422aa6604af2f8a6b8ba9fb9465840e7ce109c119c550d3dd7af`.
Linux installation with `--frozen-lockfile --strict-peer-dependencies
--ignore-scripts` passes normally in 11.662 seconds with stable source:
`17-08-40-005Z-linux-security-patches-frozen-install`. Final combined verification,
coverage, full accessibility and packed-consumer gates on this snapshot remain
pending. Installation success is not runtime verification.

All-engine unit matrices and platform-specific evidence remain separate gates.
Fresh Windows packed React and its relocated frozen
replay each passed 21 checks (seven representative contracts per engine), with
29 artifact hashes matching; this is not individual installed-browser coverage
of all 21 typed event mappings. See `15-24-38-058Z-react-current-packed-runtime-replay`.

The clean Linux SSR exit does not identify the cause of the historical Windows
WebKit shutdown failures. No timeout, warning allowlist, assertion, threshold
or retry policy was relaxed for these runs.

## Latest complete verification passes

The fresh `pnpm verify` checkpoint passes normally with exit code 0 in 610.155
seconds: `2026-08-26T17-20-04-765Z-linux-final-batch-complete-verify`. The retained
raw log and result are under `quality/evidence/` with that full directory name.
Before/after source SHA-256 is unchanged:
`fa4e48a8407bbe3ef06fa4e9545936c876c2fcd5e5968d7cc74d41411278f8e7`.
The reviewed security-patch lock remains
`eb82ee9f7c82422aa6604af2f8a6b8ba9fb9465840e7ce109c119c550d3dd7af`.

An independent count of the final package summaries confirms all 14 packages
ran in Chromium, Firefox and WebKit: 42 runs, each engine passing 2,296 cases,
for 6,888 case executions and zero failures. These are repeated cross-engine
executions, not 6,888 distinct tests. All 42 referenced lifecycle records have
normal zero worker exits, stopped launchers, closed servers, zero remaining
sockets or observed processes, no ownership uncertainty and no forced cleanup.
The earlier failed full gates above remain failed historical evidence.

The same log confirms all 18 package builds complete, followed by 1,903 isolated
cold Node imports and 155 rendered elements, 154 with declarative shadow DOM.
The separate Node renderer module reports 100% measured lines, branches and
functions; this is not browser hydration or whole-library coverage. The docs
build produces 136 pages and validates 24,224 local links with no failures;
574 external or separately built application links remain outside that gate.

The later private snapshot
`6cb3edac96a05f948c6008f69a78661fde2fac3e74234e96e41fa2250a1267fa`
is not the source hash of this complete run. The retained
`quality/evidence/linux-verification-2026-08-26/final-batch-source-delta.json`
compares both 4,282-entry manifests and identifies exactly three changed files:
`quality/defects.md`, `scripts/check-package-artifacts.mjs`, and its test file.
Those changes finalize package-evidence cleanup and its 32-guard suite; no
component, browser fixture, package manifest or lockfile changes are present.
Their guards and actual packed-consumer gate require separate evidence.

Fresh measured runtime coverage and the complete accessibility gate remain
pending at this checkpoint. This passing `verify` record does not replace
those gates, packed-framework runtime checks, visual regression, manual
assistive-technology testing or production-readiness review.

## Fresh measured coverage passes

The subsequent Chromium coverage gate passes normally in 92.745 seconds:
`2026-08-26T17-30-37-443Z-linux-final-measured-coverage`. Its before/after source
hash is the unchanged `6cb3edac...` snapshot above, with the same reviewed lock.
Independent counting of final package summaries confirms all 14 component
packages and 2,296 passing cases, zero failures. All unchanged package floors
pass. The retained inventory contains all 202 required runtime files, with no
missing files or reconciliation failures. Raw reports and `inventory.json` are
under `quality/evidence/linux-verification-2026-08-26/final-coverage-2026-08-26T17-30-37/`.

The core package alone measures 96.36% lines/statements, 86.08% branches and
87.9% functions. These are core-only percentages, not an aggregate score for
the entire catalog. The measurement remains browser-loaded runtime coverage
for the 14 component packages, with explicit non-runtime and separate SSR/
registration boundaries; it does not claim every exported package or behavior.

The changed package-cleanup checker separately passes all 32 guards in
`2026-08-26T17-30-29-916Z-linux-final-packed-cleanup-guards`; its targeted lint
passes in `2026-08-26T17-30-34-632Z-linux-final-packed-cleanup-lint`. Both have
normal zero exits and the same stable `6cb3edac...` source. They validate the
checker, not completion of the actual packed-consumer gate. At that checkpoint,
accessibility was still pending; its subsequent complete result follows.

## Fresh accessibility and served Storybook gates pass

The complete accessibility gate subsequently passes 621 of 621 cases in
508.693 seconds with a normal zero exit:
`2026-08-26T17-34-30-709Z-linux-final-a11y-621`. Its source remains unchanged
at `6cb3edac...`, with the reviewed security-patch lock. Independent raw-log
counts confirm 207 cases per engine, including 155 catalog axe checks each:
465 catalog checks plus 156 interaction/font/media checks across Chromium,
Firefox and WebKit. The retained HTML report contains 621 expected outcomes,
zero unexpected, flaky or skipped cases, no global errors, and exactly one
attempt per case. No retry supplied the pass.

The report and attachments are retained under
`quality/evidence/linux-verification-2026-08-26/final-a11y-621-passed-report/`
and `final-a11y-621-passed-results/`. This closes the fresh automated gate;
it does not establish manual assistive-technology support or every component
state. The preceding 618-pass/three-failure full gate remains retained.

The fresh Storybook build passes in 18.842 seconds:
`2026-08-26T17-32-20-770Z-linux-final-storybook-build`. An initial runner launch
then fails before story execution because its server was omitted:
`2026-08-26T17-32-40-206Z-linux-final-storybook-interactions`, with
`ERR_CONNECTION_REFUSED` at port 6006. That orchestration failure remains
failed evidence; no story assertion was changed to address it.

The correctly served run passes normally in 57.117 seconds with the same stable
`6cb3edac...` source:
`2026-08-26T17-33-33-074Z-linux-final-served-storybook-102`. It executes all 102
tagged interaction contracts in Chromium with `--failOnConsole`; the report
explicitly excludes 125 untagged tests from its 227-test discovery count.
Those exclusions are not additional passing coverage. The owned static server
is stopped after the successful runner exits. The separate packed-consumer and
benchmark outcomes follow below.

## Actual packed consumers and performance budgets pass

`2026-08-26T17-43-12-241Z-linux-final-actual-packed-consumer` passes in 62.117
seconds, including 32 checker guards, fresh package builds, actual packing and
installation. All 18 archives and installed packages contain their effective
public targets, and all 16 JavaScript/type roots pass with declaration checking
enabled. The consumer installs with strict peers and a portable lockfile;
dependency-scoped overrides do not rewrite peer ranges. All 21 owned commands
exit normally without forced termination, and scoped temporary cleanup completes
before passing evidence is finalized. One `node-domexception@1.0.0` deprecation
warning remains in the install log; there are no peer-dependency warnings.

The 18 archives, five consumer files and command logs are retained under
`quality/evidence/linux-verification-2026-08-26/final-packed-consumer/`.
This is not browser verification of every subpath or every supported framework,
nor a claim that a relocated frozen replay of this 18-package consumer was run.

The actual fresh-pack CEM route passes all 14 manifests and 155 tags in
`2026-08-26T17-44-14-843Z-linux-final-cem-packed` (11.511 seconds).
`2026-08-26T17-45-20-055Z-linux-final-cem-same-consumer-archives` separately
passes those manifests in the exact installed-consumer archives (4.236 seconds).
Independent SHA-256 comparisons match all 14 inspected archives to the retained
consumer bundle. Nothing was published.

Eight measurement guards pass in
`2026-08-26T17-44-26-790Z-linux-final-benchmark-measurement-guards`.
`2026-08-26T17-44-29-494Z-linux-final-performance-budgets` then passes every
unchanged budget, with valid measurements and stable source:

- Gzip bytes: button 16,152; dialog 12,021; input 13,650; React button 19,659.
- Server rendering, 500 iterations: 0.131 ms average and 0.230 ms p95.
- Browser: definition 41.6 ms, create 100 controls 21.6 ms, update 100 controls
  3.1 ms, hydrate 100 controls 41.7 ms, locale switch 100 controls 10.7 ms.
- All 100 original server nodes survive hydration and the first interaction
  passes. Lifecycle heap growth is 1,208 bytes; the deliberately retained-memory
  calibration grows by 4,005,552 bytes, proving nonzero telemetry.

The JSON measurements are retained alongside that gate's log. These are
representative core/React measurements in one local Linux environment, not
whole-catalog/expansion performance, a variance history or a controlled competitor
comparison. Earlier Windows timings are not a same-environment comparison.
All completed records in this section retain source `6cb3edac...` and the same
reviewed `eb82ee9f...` lock.

## Retained lifecycle evidence and remaining boundaries

All 42 unit-matrix and 14 coverage lifecycle JSON files are retained under
`final-unit-lifecycle/` and `final-coverage-lifecycle/` in the Linux evidence
directory. Every worker exits normally, with no remaining observed owned
processes, uncertainty or forced cleanup. The 42 unit completion snapshots also
report zero sockets. Coverage completion snapshots report one to three sockets;
that counter is sampled before worker exit and is not a post-exit OS socket
inventory. The supervisor observes worker exit and a fresh process snapshot
afterward. The retained audit does not invent a zero pre-exit socket count or
claim to have established why those close callbacks were still pending.

The final container process inspection contains only its init and intentional
keepalive, plus the inspection command. This is separate from the historical
Windows cleanup incident, which remains documented. After artifact export and
identity/owner-label verification, only the dedicated container was stopped.
Its intentional keepalive exits from SIGTERM (143); this is not a test-gate exit.
The stopped container and image remain available for reproduction. Other project
containers were not modified.
