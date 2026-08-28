# Production-certification defect register

## Frozen-source continuation findings, 2026-08-27

- **CERT-060 (P1 security gate, machine remediation complete):**
  the fresh registry audit on lock
  `17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`
  reports 0 critical, 1 high, 20 moderate and 6 low occurrences, zero
  unaccepted high/critical paths, zero allowlist exceptions and zero findings rooted in a
  publishable package's production/optional dependencies. Exact transitive floors and
  verified Vite, Astro/Starlight, Sharp and PostCSS upgrades removed all blockers.
  Linux malicious/safe archive proof credits the sole remaining registry high across
  exactly 14 development-only `extract-zip` paths as locally patched while retaining
  the raw finding.
- **CERT-061 (P2 performance/lifecycle, Map retained-object defect closed; history open):** the
  repeated expansion profile now measures Table, Chart, Scheduler, Editor, Parser,
  Map and Node Graph. It reproduced a Leaflet zoom fallback firing after Map
  removal; stopping the map and disabling optional zoom animation repairs the
  focused lifecycle. A tagged CDP heap snapshot then proved the remaining Map
  retainer path through the reusable viewport's stale `_leaflet_events.scroll*`
  listener. Clearing Leaflet-owned listeners from that private viewport after
  normal teardown reduces the five-sample steady-state Map heap p95 from 154,956 B
  to 5,664 B and old Leaflet Maps from 20/20 to 0/20 per window; 26 Chromium Map
  assertions pass. Chart retains 0/20 old Chart.js instances but still has a
  45,448 B steady-state heap p95. No expansion budget was introduced, and the
  contended single-date Chromium host plus missing multi-date/cross-engine profiles
  keep broad leak-freedom and trend claims open.
- **CERT-062 (P1 visual stability, replacement machine window green; human acceptance open):** the cumulative
  unchanged-harness history retains one flaky execution in 86 runs (1.163%) from a
  one-pixel, one-channel focus-ring raster variance. The causal prepaint stress
  reproduced the same variance class, so the proposed change was reverted. A
  replacement window is now complete under the fail-closed, process-attested
  `--num-raster-threads=1` policy: 50/50 exact full-catalog executions, 0 flaky
  executions, 2,940 candidate comparisons and 245 accepted-smoke comparisons,
  with zero fresh-capture variance. Accepted baselines remain unchanged; 60
  candidates require human approval.
- **CERT-063 (P1 stable-depth assurance, machine matrix green):** nine new causal
  dynamic/recovery cohorts are implemented and the frozen-source combined matrix
  passes 255/255 in Chromium, Firefox, and WebKit (765/765 executions) with clean
  supervised teardown. Ledger depth markers and maturity stay unchanged. Manual AT
  and native Safari/mobile
  requirements remain separate.
- **CERT-064 (P2 framework reproducibility, machine gate green):**
  the final synchronized seven-consumer relocated replay passes against root-lock
  SHA-256 `17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`.
  All seven frozen installs, typechecks, production builds, immutable-byte checks
  and all-engine runtime lanes pass, totaling 39/39 runtime records. This certifies
  the selected archive and lock bytes. Exact `0.4.0` internal development ranges
  make 10/10 initial and 5/5 final React packs byte-identical at SHA-256
  `98c3ffe6100e955906b1a4612778c334fd379c3bde0fda591e6c5cf92fc939d9`.
  A newly packed consumer passes install, typecheck, build and all-engine runtime.
  The separate packed Next request-time gate passes concurrent isolation and the
  three-engine hydration contract; deployed adapter/ingress proof remains outside it.
- **CERT-065 (P1 coverage denominator, current machine gate green):** the current
  cross-browser unit matrix passes 2,490 assertions per engine, or 7,470 executions
  across 42 package/engine runs. Fresh Chromium measurement executes those 2,490
  assertions and passes every ratcheted statement, branch, function and line floor
  across all 14 packages, with no missing required runtime files. This is automated
  code coverage, not manual AT, visual, framework or release certification.
- **CERT-066 (P1 SSR focus correctness, fixed and current matrix green):** the
  expanded integrated browser matrix reproduced a scheduler defect when its
  late-day roving calendar day was disabled: validity focus delegated to the
  navigation button. Focus now falls back to the first enabled day, backed by a
  deterministic regression and a 68/68 scheduler unit run. The fresh serial SSR
  matrix passes 231/231 across Chromium, Firefox and WebKit in 6.5 minutes. Its
  global timeout increased from 420 to 600 seconds for the growth from 213 to 231
  cases; individual 60-second test and startup timeouts remain unchanged.
- **CERT-067 (P1 packed-artifact and supply-chain gates, machine green):** packed
  CEM validation passes 14/14. `test:packed` passes 32/32 policy guards, all 18
  tarballs and installed packages, and 16 runtime plus 16 declaration roots. The
  supply-chain gate passes 11/11. CERT-060's dependency-risk policy now passes with
  zero unaccepted high/critical paths; these results do not constitute release
  approval.

## Localization and RTL owned-string tranche, 2026-08-27

CERT-059 (P2 localization/RTL correctness and scope integrity, bounded tranche
verified): a machine-checked inventory now assigns all 155 published elements
to 12 localization surfaces and rejects missing paths, evidence and denominator
drift. This tranche localizes binary long-unit grammar, file-size punctuation,
meter descriptions and six media components; makes core calendar language and
direction reactive while preserving canonical ISO activation; and gives every
built-in parser error family a typed diagnostic without changing legacy display
messages. The complete components, media and parser browser suites pass 1,902,
60 and 119 tests per engine respectively across Chromium, Firefox and WebKit,
with normal lifecycle shutdown. Typecheck, lint, builds, canonical manifests,
quality guards, the 136-page/24,231-link docs gate and the SSR gate (1,903 cold
imports and all 155 renders) pass on the synchronized Linux snapshot. The guarded
machine inventory now assigns all 155 elements and all 12 cross-cutting surfaces
with no confirmed remaining Fluid-owned string migration. Pseudo-locale visual
review, fluent-speaker review, manual AT and owner acceptance remain open. No
Section 4 completion, owner sign-off or promotion.

The second parallel wave localizes core date-picker, date-range-picker and
time-picker display context, built-in presets and prompts while retaining
canonical ISO/range/`HH:MM` values and explicit overrides. Its focused suite
passes 68 tests per engine. Editor toolbar RTL passes 46 tests per engine;
kanban logical-track and node-graph physical-geometry RTL contracts pass 16 and
29 per engine. Subsequent waves completed event-calendar/availability,
expansion-package strings and parser UI localization at the machine-verifiable
layer. The human gates above remain open.

## SSR state adoption, request-local localization and warning-debt slice, 2026-08-27

CERT-058 (P1/P2 SSR correctness and evidence integrity, focused and integrated
verification passed): the machine-derived form-associated inventory initially
found only 2/14 applicable elements preserving user edits made in declarative
shadow DOM before definition. All 14/14 now have component and delayed-
registration contracts for host state, drafts, FormData, validity, focus,
selection and zero synthetic events; eight non-applicable elements retain
explicit interaction-boundary rationale. Native ancestor `lang` now reaches SSR
components through parser-correct, request-local context, including omitted
`li`/`p` end tags, table foster parenting, interleaved asynchronous requests and
three-engine hydration parity. The 14 exact Lit render-cycle exceptions were
removed; charts, anchor-nav, input, textarea and number-input were repaired and
all non-development warnings now fail. Component tests pass 1,825/1,825 per
engine, Node renderer tests pass 9/9 with 100% line, branch and function
coverage, the five-locale SSR audit passes, and the
strict integrated browser SSR gate passes 213/213 in 5.2 minutes across
Chromium, Firefox and WebKit. A preceding 198/213 run hit the obsolete 300-second
suite ceiling with no assertion failure and remains failed evidence; the serial
suite is now bounded at 420 seconds while each test and server startup remain at
60 seconds. The exact completed batch passes the coordinated pinned-Linux
`FLUID_BROWSERS=all pnpm verify` checkpoint: 6,978 unit executions across 42
package/engine runs, 18 builds, 1,903 isolated cold imports, all 155 server
renders, a 136-page documentation build and 24,224 checked local links. Retained
preflights also exposed and repaired a Linux same-tick process-ancestry false
positive without weakening the stricter Windows PID-reuse rule, plus two missing
SSR renderer branches. No owner sign-off or promotion.

## Scheduler form-contract and localization slice, 2026-08-27

CERT-057 (P2 form correctness, accessibility and localization, focused and
integrated SSR verification passed): scheduler had no state-dependent native
validation anchor, exposed stale FormData during `fluid-change`, omitted form
state restoration and shipped scheduler/time-slot UI strings outside the locale
registry. The repair passes 18 client/DSD checks, 186 scheduler-package unit
executions, 36 focused calendar executions and 150 localization-controller
executions across Chromium, Firefox and WebKit. The exact synchronized
pinned-Linux integrated gate passes 204/204 in 5.0 minutes with normal shutdown.
The completed batch then passes the coordinated all-engine full-workspace gate:
6,942 unit executions across 42 package/engine runs, 18 builds, 1,903 cold
imports, 155 renders, a 136-page documentation build and 24,224 local links in
605 seconds. Retained preflight failures exposed and repaired narrow restore
signatures, weak Playwright casts, stale quality attribution and stale CEMs.
See [retained scope, failures and limits](../docs/reviews/scheduler-form-contract-2026-08-27.md).
The scoped required-focus inventory is now 16/16; broader state adoption,
localization/RTL, visual/manual AT and release certification remain. No owner
sign-off or promotion.

## Date-range-picker form-contract slice, 2026-08-27

CERT-056 (P2 form correctness and render-cycle debt, focused and integrated SSR
verification passed): date-range-picker omitted delegated/native validation
focus, exposed stale FormData during `fluid-change`, did not restore canonical
interval form state and seeded open draft state after rendering. The scoped
repair passes 18 client/DSD checks and 60 unit executions across Chromium,
Firefox and WebKit. The synchronized pinned-Linux integrated gate passes 186/186
in 4.4 minutes with normal shutdown. See
[retained scope, failures and limits](../docs/reviews/date-range-picker-form-contract-2026-08-27.md).
Scheduler and the post-batch full-workspace checkpoint close in CERT-057 above;
broad state adoption and visual/manual AT review remain. No owner sign-off or
promotion.

## Radio-group form-contract slice, 2026-08-26

CERT-055 (P2 form correctness and dynamic-option behavior, focused and
integrated SSR verification passed): required radio groups had no native focus
anchor; every public change event exposed the previous FormData value; disabling
or removing the selected light-DOM radio left a stale selected/form value;
fieldset disable propagation erased authored option-disabled state; and a
required group with no enabled options produced a browser not-focusable error.
The scoped repair passes 18 client/DSD checks and 57 unit executions across
Chromium, Firefox and WebKit. The synchronized pinned-Linux integrated gate
passes 168/168 in 3.9 minutes with normal shutdown. See
[retained scope, failures and limits](../docs/reviews/radio-group-form-contract-2026-08-26.md).
This does not close date-range-picker, scheduler, state adoption or manual AT.
No owner sign-off or promotion.

## OTP form-contract slice, 2026-08-26

CERT-054 (P2 form correctness and render-cycle debt, focused and integrated SSR
verification passed): OTP omitted delegated focus from client and DSD roots,
anchored every required failure to the first box rather than the first missing
box, emitted public input/complete events before synchronizing FormData, and
clamped length plus invalid presentation after rendering. The scoped repair
passes 18 focused client/DSD checks and 90 unit executions across Chromium,
Firefox and WebKit. The synchronized pinned-Linux integrated gate passes 150/150
with normal shutdown. A Windows run reached 140/150 with no assertion failure
before its unchanged 300-second suite watchdog; it is retained as a timeout, not
relabeled green. See
[retained scope, failures and limits](../docs/reviews/otp-form-contract-2026-08-26.md).
This does not close the three remaining focus contracts, pre-registration OTP
state adoption, autofill/password-manager UI or manual AT. No owner sign-off or
promotion.

## File-input form-contract slice, 2026-08-26

CERT-053 (P2 form correctness, focused and integrated SSR verification passed):
native invalid submission did not focus the visible picker; selection/removal
events exposed stale FormData; disabled removal and a late native selection could
still modify the control; keyboard removal lost focus. The first explicit
validation-anchor repair also exposed a WebKit fallback that reduced the entire
focused picker to zero height. The final native-button, delegated-host-focus and
synchronous form repair passes 18 focused browser checks, 93 unit executions and
the 132-case integrated SSR gate. Full all-engine workspace verification passes
6,906 unit executions across 42 package/engine runs plus builds, cold imports,
renders and local documentation links. See
[retained failures, measurements, repairs and limits](../docs/reviews/file-input-form-contract-2026-08-26.md).
This does not close the four remaining focus contracts, unnamed-control parity,
pre-registration state adoption or manual AT. No owner sign-off or promotion.

## Color-picker form-contract slice, 2026-08-26

CERT-052 (P2 form correctness, focused and integrated SSR verification passed):
native required submission failed to focus the nested hex field; a single edit
leaked both canonical parent and raw child events; disabled native/preset editing
surfaces remained enabled. Follow-up checks exposed missing WebKit commit events
after normalization and Chromium warnings for shorthand native-color values.
The scoped repair passes 18 focused browser checks, 87 unit executions and the
114-case integrated SSR gate. Full workspace verification also passes: 6,897 unit
executions, package builds, cold imports, server renders and local docs links.
See [retained failures, repairs and limits](../docs/reviews/color-picker-form-contract-2026-08-26.md).
This does not close the five remaining required-focus contracts, broader color
accessibility or pre-hydration state adoption. No owner sign-off or promotion.

Baseline opened: 2026-08-26. Owner for engineering items: current readiness
implementation task. External reviews require an explicitly assigned human
reviewer before closure. A linked code location is evidence of scope, not a
claim that a fix has been verified.

Severity: P0 is a critical security or data-loss defect; P1 blocks a stated
production support or certification claim; P2 is a bounded correctness,
assurance, or documentation defect; P3 is non-blocking polish. An assurance P1
does not imply an exploitable vulnerability.

The first table preserves the initial baseline. Current scoped outcomes are in
the dated implementation updates immediately below it; historical gap counts
must not be read as the current inventory.

| ID       | Severity            | Finding and evidence                                                                                                                                                                                                                       | Assigned section | Closure requirement                                                                                                                                                              | Status                                                                |
| -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| CERT-001 | P1 assurance        | Interaction applicability omitted 21 elements with user behavior. See the [classification audit](../docs/reviews/interaction-classification-audit-2026-08-26.md).                                                                          | 1, then 2        | Correct the denominator without automatic coverage credit; add or explicitly attribute meaningful element assertions for all 39 current gaps.                                    | Classification corrected; coverage open                               |
| CERT-002 | P1 assurance        | The baseline audit found 13 absent elements despite 155 passing axe cases. The old runner did not assert host presence.                                                                                                                    | 2 and 3          | Correct mappings and setup, enforce presence and upgrade, and prove all 155 built fixtures.                                                                                      | Fixed and verified locally, 2026-08-26; see Section 2 evidence below. |
| CERT-003 | P1 assurance        | `apps/benchmarks/scripts/run.mjs` requests `Performance.getMetrics` without enabling the domain and defaults missing heap metrics to zero. The environment probe returned zero metrics before enabling, 36 after.                          | 6                | Enable metrics, fail on missing samples, validate against a deliberately retained allocation, and re-establish lifecycle budgets.                                                | Open                                                                  |
| CERT-004 | P1 assurance        | The benchmark reuses a registered page for `setContent` and calls the result hydration. The environment probe confirms custom-element registrations survive `setContent`; its assertion checks only registration and shadow-root presence. | 6                | Use a fresh browser realm, preserve actual server shadow nodes through hydration, assert successful first interaction, and remeasure.                                            | Open                                                                  |
| CERT-005 | P1 consumer gate    | Packed React fixture fails first with TS5083: copied `tsconfig.json` still extends a missing workspace-root `tsconfig.base.json`. See the packed React baseline log.                                                                       | 5                | Make the isolated fixture self-contained without workspace source access; pass clean typecheck, build, and browser contracts. Audit every copied framework for the same failure. | Open                                                                  |
| CERT-006 | P1 support evidence | Browser a11y and hydration configs and workflows select only Chromium. This machine lacks the required Firefox 1522 and WebKit 2287 binaries; launch evidence is failed, not a product test result.                                        | 3 and 4          | Install declared engines in a controlled environment, add the actual matrices, and retain passing runtime evidence for supported combinations.                                   | Open                                                                  |
| CERT-007 | P1 human evidence   | Stable-cohort assistive-technology and fluent-speaker locale sign-offs are absent. Automated tests cannot supply them.                                                                                                                     | 3 and 4          | Dated named-reviewer results, versions, findings, fixes, and retests for the published support matrix and official locales.                                                      | Open                                                                  |
| CERT-008 | P2 reproducibility  | Clean framework copies resolve unconstrained dependency ranges with `--no-frozen-lockfile`; the packed React install used React 19.2.8 versus workspace 19.2.6.                                                                            | 5 and 8          | Retain resolved consumer locks and run an explicitly pinned certification lane; keep latest-compatible testing separate.                                                         | Open                                                                  |
| CERT-009 | P2 release metadata | Public React integration is version 0.0.0 while the other 17 publishable packages are 0.4.0. Previous lockstep release prose is therefore incomplete.                                                                                      | 7 and 8          | Align release metadata with the owner-approved versioning policy and validate all 18 tarballs before a release.                                                                  | Open                                                                  |
| CERT-010 | P2 documentation    | Earlier prose reports 125 core plus 30 expansion elements; the definition inventory currently has 124 core plus 31 expansion elements. Source-presence metrics are also described as execution proof.                                      | 7                | Generate current counts and evidence-qualified claims; preserve old reviews as dated snapshots with corrections linked at the top.                                               | Open                                                                  |
| CERT-011 | P2 test stability   | Storybook runner passes 64 contracts but logs repeated navigation-related retries. These are not a zero-retry stability result.                                                                                                            | 2 and 6          | Determine whether they are runner navigation handling or real test instability; retain retry-aware results and remove unexplained failures.                                      | Fixed and verified locally; see follow-up evidence below.             |

## Parallel implementation updates, 2026-08-26

See [parallel evidence](baselines/2026-08-26-section-2-parallel.md). These updates
supersede the earlier baseline statuses for the stated defects, not whole-section
or production sign-off.

- CERT-001: the built Storybook gate now passes 102/102 applicable element
  contracts (102/155 catalog-wide), without retries. The floor is 102. Mosaic
  was corrected to a layout helper with a retained uncounted native layout
  test; that correction added zero covered interactions. Broader state and
  native platform certification remain open.
- CERT-001 continuation, 2026-08-28: the first five stable-foundation rows now
  have causal depth beyond catalog attribution. Aspect Ratio, Avatar, Avatar
  Group, Badge and Card pass 51 focused unit cases per engine (153/153 total),
  including five repaired recovery/reactivity defects. Their focused Storybook
  semantics, 640px reflow and badge forced-colors matrix passes 9/9 across
  Chromium, Firefox and WebKit. This closes only the five ledger gaps named in
  that evidence; it does not promote maturity or substitute for human AT review.
- CERT-001 continuation, 2026-08-28: rows 6–25 now have causal public-behavior
  coverage across 19 focused test files. The tranche passes 338/338 in Chromium,
  338/338 in Firefox and 338/338 in WebKit (1,014 executions), with clean
  supervised teardown recorded at
  `/workspace/quality/evidence/wtr-lifecycle/2026-08-28T12-29-40-498Z-98031.json`.
  The coverage includes layout-token and narrow-containment recovery,
  forced-colors/reduced-motion semantics, busy/focus and value recovery, dynamic
  field/form ownership, live constraints, option mutation/typeahead, and
  standalone-radio misuse. It closes only those 20 ledger gaps. Option grouping
  remains a policy boundary; manual AT, visual, external-platform and owner
  approval remain open, and no maturity promotion follows.
- CERT-001 continuation, 2026-08-28: the rows 26–40 tranche spans 13 focused
  test files and passes 275/275 in Chromium, 275/275 in Firefox and 275/275 in
  WebKit (825 executions). Clean supervised teardown is retained at
  `/workspace/quality/evidence/wtr-lifecycle/2026-08-28T13-29-59-792Z-16924.json`.
  Fourteen of the 15 row gaps close on causal behavior evidence covering required
  and form-owner recovery, RTL keyboard/pointer behavior, reconnect cleanup,
  live constraint/layout changes, composite reconciliation, live-region
  mutation, and modal focus recovery. Details retains browser-real collapse
  focus continuity, leaving 20 ledger-counted machine gaps. Rating `required`,
  Select grouping and Drawer nonmodal behavior remain API-policy decisions;
  Banner focus handoff, Drawer authored-autofocus Playwright coverage, manual AT,
  visual, external-platform and owner evidence remain open. No maturity promotion
  follows.
- CERT-003/004: corrected instrumentation and negative controls pass locally.
  Missing/non-finite heap data fails instead of becoming zero. The retained
  allocation control increases measured heap by 4,000,200 bytes; actual lifecycle
  samples are 1,549,112 and 1,549,888 bytes. Fresh-realm hydration preserves all
  100 native server buttons and passes its first keyboard interaction. The
  unchanged budgets pass locally (53.4 ms hydration, 776-byte heap growth).
  Evidence: `2026-08-26T12-28-34-857Z-benchmark-hydration-side-effect`.
  This is not broad expansion-package performance or repeated CI stability.
- CERT-005: React configuration is now self-contained; Angular compiler aliases
  target installed package output rather than workspace-relative paths. Both
  workspace typechecks and five isolation regression tests pass. A fresh React
  consumer installed six packed Fluid artifacts outside the workspace, then
  passed typecheck and production build (React 19.2.8, TypeScript 5.9.3).
  Evidence: `2026-08-26T12-35-22-847Z-framework-react-isolated-recheck`.
  The later packed React CSR runtime passes 21/21 across three engines:
  `framework-fixtures/2026-08-26T13-02-48-080Z--fluid-ds-admin-react`.
  Other packed consumers and framework SSR remain required before closure;
  peer warnings and nonportable local-tarball override metadata are corrected
  in the later strict-peer and frozen-replay runs, without rewriting historical evidence.
- CERT-006: all three browser binaries are installed and catalog axe audits pass
  in each engine. Native Windows WebKit link-tabbing and media tests remain red;
  bare native controls reproduce the platform behavior. No skips were added.
  Windows WebKit is not Safari-on-macOS certification.
- CERT-008: packed fixture runs now retain their exact resolved lock, consumer
  source and tarballs, including failed builds. The runner explicitly labels
  its initial resolution latest-compatible. A pinned certification lane is
  still open; keeping a lock does not make the initial resolution pinned.
  A later scoped dependency-override fix preserves genuine peer ranges. Fresh
  strict-peer React installation/runtime and a relocated frozen replay both pass
  21/21 with no peer warnings and unchanged hashes for 28 retained files,
  including six tarballs and the lock. Evidence: `framework-fixtures/2026-08-26T13-14-12-307Z--fluid-ds-admin-react`
  and `framework-replays/2026-08-26T13-15-25-873Z`. This proves replay on the same
  Windows/Node 22 platform, not cross-OS certification or the other frameworks.
- Benchmark validity follow-up: eight instrumentation/negative-control tests
  pass, including rejection of absent, non-finite, negative or non-numeric
  budget measurements. Evidence: `2026-08-26T12-40-13-013Z-benchmark-final-controls`.
  These controls validate the measuring system, not wider component performance.
  The final runtime recheck also passes unchanged budgets, including asserted
  pseudo-locale labels and rejection of browser runtime errors:
  `2026-08-26T12-53-34-938Z-benchmark-final-runtime-check` (34.2 ms hydration,
  968-byte lifecycle heap growth, 4,005,552-byte retained-allocation control).
  Raw before/after heap values and all 100 retained server nodes are recorded.
- CERT-017: local licensed, hashed font assets replace external requests. All
  three engines load every pinned face with external traffic blocked. Five
  primary-button mode snapshots pass unchanged. Whole-matrix visual review and
  repeated stability remain open. A later Linux run exposed a test assumption:
  Windows canvas widths were incorrectly treated as cross-platform constants.
  The corrected test independently loads hash-checked Latin reference bytes in
  the same browser and compares the actual families against those references,
  retaining the missing-family negative control and the Windows-only historical
  measurements. No font assets or font CSS changed. A separate caption test now
  explicitly selects the native track before requiring its fetched, parsed and
  active cues; a `default` attribute alone does not override browser/user caption
  preferences. No cues are fabricated. These two tests pass all six targeted
  engine executions in the run beginning `2026-08-26T16-45-13-606Z`. The complete
  621-case accessibility/native gate remains pending; this is not manual
  accessibility or whole-matrix visual certification.
- CERT-018 (P2 behavior, fixed locally for reproduced cases): child-control,
  navigation and media regressions exposed duplicate/incorrect activation,
  cross-shadow focus handling, nonmodal-tour semantics, reconnect listeners,
  source/track mirroring, zoom pointer ownership and missing non-drag controls.
  Targeted unit and built interaction checks pass; native platform limits above
  remain explicit.
- CERT-019 (P2 behavior, fixed locally): table stable identity, descending null
  order, shrinking virtual windows, reconnect observation and absolute row
  metadata; parser stale reads, duplicate-header collisions, dedupe validation
  and nested live-region announcements. Native tests assert actual state and
  slotted accessibility content, not merely tag presence.
- CERT-020 (P2 behavior, fixed locally): chart native legend controls and
  reconnect/visibility; editor readonly/event duplication; kanban non-drag moves,
  rollback and drop ordering; calendar/scheduler keyboard/form/editor flows;
  node-graph custom-input ownership and gesture cleanup; map plain-text labels
  and public Enter activation. Intentional UI changes need reviewed visuals.
- CERT-021 (P1 SSR packaging, fixed locally): a bare `ssr-client` import was
  dropped by production tree-shaking because its side effect was undeclared.
  The corrected benchmark first failed server-node identity, then passed after
  declaring both source and built hydration-client entries side-effectful.
  Full packed-consumer coverage is still required.
- CERT-022 (P1 localization, partially fixed): language/direction lookup stopped
  at shadow roots and the document observer missed shadow-context changes.
  Ten new regressions and 21 total tests pass in all three engines after shared
  root observation and teardown. The subsequent five-file validation/truncate
  matrix passes 312 tests across three engines after replacing a faulty Firefox
  synthetic-paste fixture with real keyboard paste. Seven additional core form
  components now pass 630 targeted tests (210 per engine), including 89 added
  regressions that failed before implementation. Evidence:
  `2026-08-26T13-04-39-666Z-core-forms-localization-green-matrix`.
  Broader internal strings,
  locale workflows and fluent review remain open.
  A subsequent 16-tag default-label slice adds 22 terms and 151 regressions.
  Separate engine processes pass 359 each (1,077 total) with normal teardown:
  `2026-08-26T13-36-35-577Z-core-labels-localization-chromium-serial`,
  `2026-08-26T13-37-03-098Z-core-labels-localization-firefox-serial`, and
  `2026-08-26T13-37-51-690Z-core-labels-localization-webkit-serial`.
  This fixes absent-versus-empty loading-label invalidation and native signature
  focus while preserving explicit application copy. Official translations remain
  draft pending fluent review.
- CERT-023 (P1 visual assurance, guard fixed locally): screenshot attribution
  could credit absent elements. Explicit positive fixtures now require attached,
  upgraded hosts retained through capture. Six generator and 42 browser guard
  checks pass. No PNGs were accepted; 55 additional required baselines are absent.
  [Audit](../docs/reviews/benchmark-visual-validity-2026-08-26.md).
- CERT-024 (P2 test integrity, fixed locally): invalid unit-browser selections
  silently dropped requested engines or fell back to Chromium. A shared
  fail-closed selector is used by all 14 packages; four regression tests pass.
  Test workflows now prepare clean-checkout outputs and Linux browser system
  dependencies, but remote execution remains pending.
- CERT-025 (P2 verification environment): an outer Corepack command could still
  resolve nested bare pnpm to an incompatible version. The mis-versioned run
  was stopped and retained as failed. Recording now rejects a mismatch before
  executing pnpm gates and includes the resolved version in the result.
- CERT-026 (P2 render-cycle debt, fixed locally): the development SSR fixture exposed
  Lit change-in-update notices for bar-chart, bubble-chart, chart,
  doughnut-chart, line-chart, pie-chart, polar-area-chart, radar-chart,
  scatter-chart, anchor-nav, rating and input. Deeper native form tests also
  reproduce the same exact notice for textarea and number-input, bringing the
  explicit debt list to 14 tags. Chart legend synchronization and anchor-nav
  heading resolution now defer reactive changes until the current update has
  completed; input, textarea and number-input evaluate native validity before
  rendering. Rating no longer reproduces the historical warning. The exact
  exceptions were deleted, the negative control proves render-cycle warnings
  fail, and CERT-058 records the strict 213-case integrated result.
- CERT-027 (P1 React contract, corrected locally): generated native JSX event
  props used wrapper-style `onFluidChange`, which does not subscribe to the
  exact `fluid-change` event on a React 19 custom element. Native declarations
  now use `onfluid-change`; wrappers retain their explicit camel-case mapping.
  Compile checks and semantic generator regressions cover the distinction.
  The first packed production runtime passed 20/21 checks and independently
  reproduced CERT-028 in Firefox; it is retained, not presented as green. After
  the native focus fix, a fresh packed runtime passes 21/21, including clean
  teardown and strict browser/network collection, in
  `framework-fixtures/2026-08-26T13-02-48-080Z--fluid-ds-admin-react`.
  This is React CSR, not framework SSR or fully typed event payloads.
- CERT-028 (P1 forms/SSR, bounded fixes verified): state restoration updated
  native DOM but omitted Fluid host/FormData state, attempted unsupported text
  selection on non-text inputs, and lost checkbox reset defaults. Firefox
  additionally reported an invalid input as not focusable during native form
  submission, even while its inner input was focused. Input now declares native
  shadow focus delegation, verified in the actual server DSD as well as client
  rendering. The final SSR matrix passes 36/36 and targeted units pass 162/162
  across three engines: `2026-08-26T12-59-00-532Z-ssr-form-browser-final-focus-fixed`.
  Five original server controls retain identity; no synthetic changes are
  emitted. Restoration adapters remain limited to input/checkbox, and other
  form controls require separate native invalid-submission coverage. The next
  native focus slice reproduces 40 Firefox errors across checkbox, switch,
  textarea, number-input and typeahead before adding native shadow delegation.
  It then passes 36 browser cases (six controls, client/DSD, three engines),
  384 targeted unit executions and six strict-warning negative controls.
  Evidence: `2026-08-26T13-19-41-438Z-native-form-focus-browser-after-fix`.
  Four invalid and four valid activations per browser case cover both native
  and Fluid submit buttons by pointer and keyboard. This covers 6/16 required
  controls, not all 22 form-associated elements or all hydration adapters.
  A further masked-input/select/time-picker slice now passes 18 client/DSD
  browser cases across three engines with clean exit and unchanged source:
  `2026-08-26T14-50-58-152Z-composite-form-focus-three-engine-final`.
  Native required and custom-error submission, locale changes, real value edits,
  reset and retained DSD nodes are asserted. Per-component delegation and
  post-render validity anchors fix actual focus failures. Deriving masked
  invalid state and popup active state before render removes newly reproduced
  lifecycle warnings without expanding the exact-warning allowlist. All 89
  targeted Chromium units pass in
  `2026-08-26T14-52-07-826Z-composite-form-focus-unit-regressions` (source stable).
  Native required-focus coverage is now 9/16; adapters still cover only
  input/checkbox. The preceding RED run fails 15 cases, leaves three incomplete
  and hits the existing Windows WebKit teardown deadline; no manual process
  termination was used. Full combined 90-case and all-engine unit gates remain.
- CERT-029 (P2 documentation, corrected and verified locally): a
  parsed built-HTML audit found 13 broken internal page/fragment links across
  136 documentation pages. The failed baseline is retained in
  `2026-08-26T12-59-30-316Z-docs-link-baseline`. Targets are corrected and seven
  checker regressions pass; the root docs gate now checks built local links.
  The rebuilt 136-page site passes all 24,214 local link checks in
  `2026-08-26T13-06-01-575Z-docs-link-corrections-verify`.
  External URLs and separately built application routes are explicitly
  unvalidated, not counted as verified destinations.
- CERT-030 (P2 generated-code integrity, corrected locally): the React output
  check counted 155 index exports but could miss altered or missing wrapper/JSX
  files, and its test regenerated before checking. The gate now compares exact
  expected bytes and file identities without writing first. Three regressions
  reject altered, absent and unexpected output while preserving evidence of
  drift. The current 155-wrapper output passes. This does not implement CEM
  event payload typing or certify the source metadata itself.
- CERT-031 (P1 measurement integrity, implementation in progress): browser
  coverage percentages aggregate loaded modules and did not cross-check the
  runtime source-file inventory. Comparing retained reports with current source
  finds unmeasured animation registration modules, the hydration helper and an
  offline story asset helper. The core report predates the hydration-helper
  tests, so that omission is not evidence the current test glob is broken.
  A new inventory gate requires fresh reports and accounts for every runtime
  file. Pure type/barrel modules are listed separately; the Node-only SSR renderer
  is explicitly outside browser percentages. Six separate Node renderer tests
  now measure its built wrapper at 100 percent lines/functions/branches, not the
  component catalog or Lit internals. New entry-point/asset tests and a fresh full coverage run are required
  before closure. Retained comparison: `2026-08-26T13-25-48-484Z-coverage-denominator-baseline`.
- CERT-032 (P2 harness teardown, open): the combined three-engine label matrix
  passes 1,077 assertions but fails to exit. Owned WebKit network processes and
  sockets are recorded in `2026-08-26T13-31-30-112Z-core-labels-localization-confirmed-matrix/teardown-forensics.md`.
  Only verified owned processes were stopped; that run remains failed. The same
  cases pass with normal exits in three separate engine processes. Isolation is
  useful isolation, not a proven root-cause fix. The wider checkpoint also hangs
  after 31 passing WebKit chart assertions in a single-engine process, so serial
  execution does not resolve the defect. Retained failed evidence and process
  identities: `2026-08-26T13-41-10-196Z-full-workspace-three-engine-checkpoint`.
  Workspace verification now
  runs one engine process at a time and serializes packages; no cases or engines
  are removed and no assertion failure becomes a retry.
  A lifecycle supervisor now records launcher/server/worker shutdown phases and
  verifies owned process identities. Eleven fault/ownership controls pass;
  actual chart tests pass 31 per engine with normal exits. A later source-stable
  host-ARIA WebKit run passes 249 assertions but fails the 30-second shutdown
  deadline inside `Webkit-1.stop`, before normal server closure:
  `2026-08-26T14-07-05-729Z-host-aria-ownership-webkit-native-motion`.
  It remains failed. Recorded process cleanup leaves a contradictory Windows
  CIM/TCP entry whose PID is absent from process APIs; forensic details are
  retained. The supervisor contains and diagnoses hangs, not their underlying cause.
  Independent Playwright SSR also passes all 72 assertions then exits 1 at its
  unchanged 300-second suite/plugin teardown deadline:
  `2026-08-26T14-20-26-786Z-ssr-full-72-integrated`. No WTR supervisor is used by
  that fixture. Worker/CLI exit and closed port 4178 were observed; two network
  processes remained in CIM without sufficient captured ancestry for manual
  cleanup. This narrows the issue beyond the WTR wrapper, without proving a
  WebKit root cause or certifying cleanup.
- CERT-033 (P1 interaction evidence, corrected locally): signature's existing
  attributed Storybook play only prepared an image and could return on a missing
  fixture. It now asserts signed state, PNG output, Clear activation and exact
  change events, then restores the original visual state. An executable no-op
  mutation is rejected in `2026-08-26T13-39-19-550Z-signature-story-mutant-executed`.
  Earlier negative-control attempts reused the same completed Storybook render;
  the corrected control switches stories and asserts one actual mutant call.
  This strengthens an existing attributed contract; it adds no covered element.
- CERT-034 (P1 test isolation, targeted repair verified): the wider Firefox unit run
  fails native input validation after an earlier test launches `abc` typing but
  finishes at the first `a` event without awaiting the command. Seven detached
  keyboard commands across input, menu, switch and tag-input can outlive their
  tests. The failing log does not capture the final input value, so the exact
  failure's cause is not conclusively attributed. Command ownership and stronger
  empty/invalid/focus preconditions must be tested, not hidden with retries.
  All seven commands are now owned by their tests, clipboard descriptors are
  restored, and the six affected test files pass 105 cases per engine (315 total)
  with normal shutdown. Eleven ownership guards reject the original detached forms
  and cover all 18 installed asynchronous browser-command APIs, including media
  emulation. The declaration inventory prevents silent API coverage drift.
  Evidence: `2026-08-26T13-57-16-031Z-command-ownership-chromium`,
  `2026-08-26T13-57-42-491Z-command-ownership-firefox`, and
  `2026-08-26T13-58-10-732Z-command-ownership-webkit`. The first two runs overlapped
  unrelated edits; the WebKit fingerprint is stable. The full rerun is pending.
- CERT-035 (P2 fixture integrity, corrected locally): image tests claim a valid
  PNG but its IDAT length/CRC and compressed stream are invalid. Firefox rejects
  it, causing two event timeouts and a missing image in the motion test. The
  fixture is now a complete PNG, guarded by native decoding and dimensions.
  Event listeners are registered before starting loads, avoiding cached-load
  races. All 11 image tests pass in each engine with normal shutdown:
  `2026-08-26T13-49-34-078Z-image-valid-decoder-and-events`. Runtime code is unchanged.
- CERT-036 (P1 SSR evidence integrity, corrected locally): the old import gate
  loaded the SSR registry before all other entries, so it did not prove cold
  imports. Each of 161 listed built entries now runs in a separate fresh Node
  process without preloaded browser globals. Six negative-control tests reject
  unsafe DOM access, cross-entry priming, early exit and hangs. Six server-wrapper
  behavior tests cover ordered nested async chunks, escaping, failure propagation
  and separate caller render contexts; built-wrapper line/function/branch coverage
  is 100 percent. The combined gate also renders 155 tags (154 DSD roots):
  `2026-08-26T13-53-51-455Z-isolated-node-ssr-import-and-renderer`. Source changed
  during parallel test authoring, so this is integration evidence, not frozen RC
  certification. It does not certify every export, packed imports, locale request
  isolation, Lit internals, or all component server behavior.
  The import deadline now uses a non-interceptable child termination signal;
  a SIGTERM-handler negative control passes on Windows. POSIX execution remains
  pending, and arbitrary spawned descendants are not an import-safety guarantee.
  Export-map auditing now expands every published JS target and wildcard,
  including helper/animation, icon and React subpaths. A further three inventory
  guards reject missing targets, invalid paths and disagreement between literal
  registrations and the independent catalog. The expanded run passes 1,903 cold
  imports and 155 renders in `2026-08-26T14-16-43-082Z-exhaustive-built-ssr-entries`
  (global source changed). CSS/JSON/declaration assets and the explicit token
  TypeScript-source export are classified outside plain-Node JS certification.
  This imports built file targets, not installed-package conditional resolution.
- CERT-037 (P2 test type integrity, corrected locally): package source typechecks
  excluded browser tests, which WTR transpiles without TypeScript validation.
  A separate strict, non-emitting gate now checks all 141 test files across 14
  catalog packages with official Mocha types. Fixture lookups now fail explicitly
  when missing instead of relying on unproven array accesses; localization's
  string/function union is narrowed before invocation. Three guard tests prove
  excluded tests are selected, incorrect typed arguments fail, and empty/broken
  configurations fail. Fresh result: `2026-08-26T14-00-46-268Z-browser-test-typecheck-corrected`
  (source changed during unrelated parallel edits). This is type verification,
  not new executed behavioral coverage. The 13-diagnostic expansion baseline is
  retained; no compiler strictness was relaxed.
- CERT-038 (P1 SSR localization, fixed locally): native HTML ancestor language was not
  available to server component locale lookup. A source-stable built pagination
  probe renders correct previous-page labels with explicit host `lang`, but
  English beneath native `div lang` for all five official locales. Evidence:
  `2026-08-26T14-06-33-197Z-ssr-ancestor-locale-baseline`; reproduce with
  `node scripts/audit-ssr-localization.mjs` (intentionally failing baseline,
  not a passing verification gate). Docs now disclose the explicit-host
  requirement. Closure needs server ancestry/request context, concurrent-request
  isolation and browser hydration parity tests; no global current-locale mutation.
  The later request-local feasibility probes in
  `quality/evidence/ssr-native-context-feasibility-2026-08-26/` establish that
  context can be bound before server `connectedCallback` rendering, not during
  construction: Lit can construct a custom element before emitting its native
  ancestor prefix. Ordered async/interleaved probes pass, but structural negative
  controls show that a lexical tag stack misidentifies ancestry for omitted
  `li`/`p` end tags and table foster-parenting. The production renderer now parses
  each request-local emitted prefix and binds the resulting native ancestry to
  the exact server element without shared current-locale state. Those structural
  negatives, interleaved async isolation, the five-locale audit and three-engine
  SSR/hydration/reactive-language parity all pass; see CERT-058.
- CERT-039 (P1 harness safety, scoped local repair): the initial lifecycle supervisor matched
  a process's parent PID without proving that the child was created after that
  parent. In `2026-08-26T14-11-32-004Z-coverage-runtime-denominator-integrated`,
  Chromium media assertions pass but cleanup wrongly classifies and terminates
  older Windows notification process 16672. Its recorded creation predates the
  new esbuild process whose reused PID is 15504. The exact evidence is
  `wtr-lifecycle/2026-08-26T14-12-29-014Z-15772.json`.
  Creation identity at termination alone is insufficient
  when initial ownership attribution is wrong. No passing coverage claim follows
  from this interrupted run; production process cleanup must fail safely on
  ambiguous ownership and never terminate unrelated processes.
  The repaired supervisor proves root identity within a native-clock spawn window
  and every child-after-parent creation edge before cleanup. Ambiguous ancestry
  fails closed. Windows cleanup binds a process handle before identity validation;
  Linux uses pidfds, with no numeric-PID fallback. Fourteen ancestry guards, three
  native/mock handle tests and twelve lifecycle tests pass. An actual 53-test
  Chromium media run exits normally with no cleanup or remaining resources:
  `2026-08-26T14-32-39-794Z-wtr-media-chromium-after-ownership-fix` (source stable).
  Browser jobs resumed after this check. The retained-artifact audit still fails
  for the historical incident; the record is not erased. Native Linux pidfd and
  expanded watchdog controls subsequently pass (39 applicable checks, one
  Windows-only skip). Other operating systems and a fresh complete passing
  coverage run remain unverified.
- CERT-040 (P2 ARIA/localization, scoped runtime repair): four additional
  components now use owned localized host defaults. Explicit author names,
  including empty or equal-English values, survive locale changes; removing an
  override restores defaults, and native `ariaLabel` and legacy `arialabel`
  behavior are covered. Meter slot text now renders and updates its accessible
  name. The ten-file suite adds 137 regressions and passes 249 assertions each
  in Chromium and Firefox with normal exits. A corrected native reduced-motion
  test passes within the 249-assertion WebKit run, but that run fails shutdown
  under CERT-032. Broader meter value grammar, SSR default ownership provenance,
  all-browser integration and fluent translation review remain open.
- CERT-041 (P2 formatter localization, scoped repair): four formatter components
  ignored inherited language when `locale` was absent. The new deterministic
  explicit-locale / inherited-lang / English policy preserves explicit options,
  existing malformed-locale behavior and relative-time timer ownership. Ninety-eight
  added regressions first produce 72 failures among 136 cases. All 136 then pass
  separately in Chromium, Firefox and WebKit with source-stable fingerprints,
  normal exits, no forced cleanup and no retries. Evidence runs:
  `2026-08-26T14-34-16-207Z-formatter-context-chromium`,
  `2026-08-26T14-34-34-395Z-formatter-context-firefox`, and
  `2026-08-26T14-35-10-567Z-formatter-context-webkit`.
  This is not calendar/time-picker, binary long-unit grammar or native-ancestor
  server-language certification.
- CERT-042 (P2 localization type contract, corrected locally): translation keys
  were typed but parameterized messages accepted `unknown[]` at call sites.
  Controller and base-element methods now require each selected message's tuple;
  string terms accept no arguments. Two compiler tests cover both public surfaces
  and eleven invalid-call families. Retained RED and GREEN evidence:
  `2026-08-26T14-33-40-370Z-localization-call-types-red` and
  `2026-08-26T14-34-04-085Z-localization-call-types-green` (both source stable).
  No untyped-JavaScript validation or fluent-language review is implied.
- CERT-043 (P2 framework documentation, corrected locally): the Svelte recipe
  used `bind:value` on a custom element, which the installed Svelte compiler
  rejects. The published example now uses a controlled value and custom-event
  listener with browser-only registration. Two tests compile the exact guide
  snippet for client/server and reject the former invalid binding. This checks
  compilation, not installed Svelte runtime or DSD hydration. The framework
  guide also now distinguishes verified CEM payload types, unverified recipes
  and host-only framework build contracts from executed browser support.

- CERT-044 (P1 test-harness containment, local repair under verification): a worker
  that never became ready, hanging configuration evaluation and never-settling
  process probes/cleanup could outlive the existing shutdown protection. New
  negative controls reproduce these failures. Batch execution now separately
  bounds startup, inventory and cleanup, latches failure and cancels native
  cleanup before dispatch. Unknown inventory is not represented as an empty
  process list. Independent review also found and reproduced an awaited-inventory
  race that could finalize before cleanup; the post-await guard and retained
  causal regression close that race. Windows passes 40 native guards; Linux
  passes 39 applicable guards with one Windows-only skip. A Linux-specific
  failure exposed a probe-ordinal assumption in the race fixture; it now proves
  the actual observed-worker-to-absent transition. The corrected targeted
  Windows case and complete Linux suite pass, with the failed baseline retained.
  This does not establish the cause of Windows WebKit shutdown hangs.

- CERT-045 (P2 editor selection correctness, local repair under verification):
  document-level range endpoints can be retargeted outside the editor's shadow
  tree, so the earlier selection capture missed genuine native selections.
  Live ranges also relocate when programmatic values, sanitization or readonly
  rollback replace their nodes, allowing an obsolete collapsed range to be
  restored. Independent review additionally found backward selections restored
  forward. Native-keyboard regressions reproduce these behaviors, including a
  containing consumer shadow root. The retained baseline
  `2026-08-26T15-47-52-014Z-editor-selection-direction-and-rewrites-red` has 40
  passes and three exact direction/rewrite failures; an earlier controlled
  setter-clear removal also fails its stale-range contract. Repairs preserve
  composed endpoints and selection direction and invalidate replaced ranges.
  A fresh exact-source rerun on 2026-08-27 passes the current 50-case editor
  suite in Chromium, Firefox and WebKit (150 executions), with normal exit and
  clean supervised lifecycle
  `2026-08-27T14-59-31-957Z-15397.json`; the editor package TypeScript check also
  passes. The exact three regressions remain covered by causal public-behavior
  assertions rather than private-state inspection. The coordinated current-tree
  integrated Linux verification remains required before closure. Explicit
  simulated clipboard/legacy-API branch tests are not operating-system clipboard
  or older-browser compatibility certification.

- CERT-046 (P2 native form focus, scoped date-picker repair): required invalid
  submissions did not focus date-picker's visible input in either client-rendered
  or DSD mode. All six browser/route combinations reproduce the failure in
  `2026-08-26T15-56-52-992Z-linux-date-picker-form-focus-baseline`.
  The repair delegates shadow focus and refreshes the input validation anchor
  after the first render, retaining it for application errors. The intermediate
  fix exposed a null pre-render query passed to native `setValidity`; it now
  normalizes absence to `undefined`. The fixture awaits the parent render before
  checking its nested calendar. Both failed intermediate runs remain retained.
  `2026-08-26T16-03-14-263Z-linux-date-picker-null-safe-anchor` passes six cases
  with stable source and normal exit, including real form values, custom-error
  persistence across locale changes, reset and original DSD node identities.
  Required-focus coverage is now 10/16. This does not add date-picker state
  restoration before hydration or complete calendar localization.

- CERT-047 (P1 verification orchestration, scoped repair verified locally): pnpm's
  default recursive bail can reject while the next queued package is already
  running. In `2026-08-26T16-04-58-131Z-linux-integrated-verify-editor-date`, only
  five of fourteen packages run per engine, and Firefox editor overlaps WebKit
  animations despite workspace concurrency one. The overall gate correctly
  fails, but its promised complete, serial matrix is not delivered. Two new
  date-picker tests exposed this path with an unsupported `ENTER` driver key;
  correcting it to `Enter` passes all 19 date-picker units separately in each
  engine. The orchestration repair must drain every selected package before
  advancing engines and still return nonzero for any failure. A generated-argv
  assertion alone is insufficient evidence. Coverage shares the recursive
  early-return risk and needs the same failure-path verification.
  Both commands now use `--no-bail`. The actual installed-pnpm regression has
  six passing checks (`2026-08-26T16-18-26-240Z-unit-matrix-drain-green`), after
  the retained causal baseline fails both queue-draining checks. The fixture
  observes every package start/end in order across two phases, retains the
  nonzero aggregate, rejects advancement to coverage certification on failure,
  and proves a wholly successful run still exits zero. Complete Linux verification
  `2026-08-26T17-20-04-765Z-linux-final-batch-complete-verify` now passes all 42
  package/engine runs and 6,888 executions, with normal shutdown and stable source.
  Fresh coverage `2026-08-26T17-30-37-443Z-linux-final-measured-coverage` passes all
  14 packages and 2,296 cases with no missing required runtime files. The earlier
  failed full run also proves later packages and engines drain after a real failure.

- CERT-048 (P2 unit evidence integrity, scoped repair verified locally): all
  fourteen Mocha configurations permitted focused and pending tests, allowing an
  accidental `.only` or `.skip` to narrow a passing run. No such exclusions were
  found in the current component tests. The shared Mocha policy rejects both,
  preserving ordinary interactive flexibility and existing timeouts. Actual
  browser execution then exposed an upstream `@web/test-runner-mocha@0.9.0`
  collector gap: Mocha attaches a forbidden-pending error, but WTR accepts the
  still-pending test and discards Mocha's failure count. The full verification
  failure `2026-08-26T16-53-41-798Z` retains this causal evidence. The supervisor
  now reconciles public session results recursively, rejecting any retained test
  error regardless of passed/skipped flags. Eight actual browser controls and
  five Node controls pass in
  `2026-08-26T16-57-50-034Z-linux-mocha-result-reconciliation`, including normal
  execution, old-policy negative controls, focused tests/suites and pending
  tests/suites/runtime skips. Ordinary unsupervised WTR remains outside this
  certification boundary and retains the upstream collector bug. The subsequent
  full verification gate `2026-08-26T17-20-04-765Z` passes these actual execution
  controls and all 6,888 component-test executions with unchanged source.

- CERT-049 (P2 packed export completeness, scoped repair verified locally): the
  package gate checked export files in the workspace and imported only packed
  roots. Omitted non-root JavaScript, CSS and declarations could escape. Actual
  archive and installed-file checks now reject those omissions in local fixtures.
  Independent review also found missing wildcard conditional counterparts could
  escape when absent from both workspace and archive. Concrete public keys now
  require every conditional target, respecting exact overrides, null exclusions
  and repeated wildcard captures. Installed package roots must resolve inside
  the fresh consumer before their files are inspected. The retained causal run
  `2026-08-26T16-29-27-081Z-packed-public-key-red` has 15 passes and three failures;
  `2026-08-26T16-33-30-614Z-packed-containment-before-read` passes all 24 fixtures
  with stable source. Those controls also prove actual archive-byte retention,
  consumer files and command logs survive failed commands, and failed retention
  preserves the original temporary artifacts. Dependencies are not copied into
  evidence. Workspace target validation separately passes all 18 publishable
  packages in `2026-08-26T16-32-47-959Z-package-public-key-workspace`.
  A subsequent audit finds the consumer still used global tarball overrides,
  which pnpm 9 can copy into peer metadata as temporary absolute paths, and
  unbounded shell-launched commands. The gate now uses parent-qualified
  dependency overrides, preserves semver peers, rejects dependency/peer overlap,
  installs with strict peer checking and rejects nonportable or registry-resolved
  Fluid lockfile edges. Reviewed direct-Node execution supplies finite command
  deadlines without shell/PID-tree cleanup. A timed-out command stays failed;
  original temporary artifacts are preserved when termination is requested or
  direct-child exit is unobserved, and descendant cleanup is explicitly unknown.
  The initial 30 guards pass in
  `quality/evidence/package-artifact-tests/2026-08-26T17-19-04-929Z/`.
  Two additional cleanup-failure controls bring the total to 32: success is now
  finalized only after cleanup, and failed cleanup retains both its error and
  any original command failure. All 32 guards and the fresh actual 18-package
  packing/install gate pass in
  `2026-08-26T17-43-12-241Z-linux-final-actual-packed-consumer` (62.117 seconds,
  stable source `6cb3edac96a05f948c6008f69a78661fde2fac3e74234e96e41fa2250a1267fa`).
  Every resolved export target is present in the actual archives and fresh
  installed packages; 16 runtime roots and 16 declaration roots pass. The
  retained bundle is
  `quality/evidence/linux-verification-2026-08-26/final-packed-consumer/`:
  18 tarballs, five consumer files and 21 command logs/outcomes. All commands
  exit normally with zero status, without truncation or forced termination;
  cleanup completes. Independent review confirms strict peer installation and
  a portable retained lock, with no peer warnings. The install still reports
  one deprecated transitive dependency, `node-domexception@1.0.0`; this is not
  a warning-free dependency or security certification. Fresh CEM publication
  checks separately pass all 14 component packages and 155 tags in
  `2026-08-26T17-44-14-843Z-linux-final-cem-packed`, retaining exact manifest and
  archive hashes in `2026-08-26T17-44-16-518Z-cem-publication`.
  CEM checks also pass against the same consumer archives in
  `2026-08-26T17-45-20-055Z-linux-final-cem-same-consumer-archives`; independent
  hash comparison matches all 14 inspected tarballs to the retained consumer
  bundle (`2026-08-26T17-45-21-178Z-cem-publication`).
  These results verify the stated archive/install/root-import boundaries,
  not browser execution of every subpath or framework. No peer failure or
  deadline has been waived.

- CERT-050 (P1 release ordering, locally guarded configuration): the release
  workflow's separate concurrency group did not wait for verification. Main and
  manual runs could reach publication after build alone. Release now depends on
  all nine same-commit quality workflows, rejects non-main/superseded contexts and
  retains publication permissions only in its final job. Twelve parsed-YAML guards
  pass, including deliberate bypass mutations. No remote workflow or release was
  executed. Existing missing visual baselines and other failed gates remain
  release blockers. See `docs/reviews/release-gates-2026-08-26.md` for scope,
  permissions, duplicate-run costs and independent-review limitations.

- CERT-051 (P2 native zoom focus, scoped repair verified locally): clicking
  decorative descendants of the zoom controls could restart WebKit shadow-root
  Tab navigation instead of continuing from the clicked native button. The
  independent native probe isolates an unstyled inner `span` versus plain
  button text, supporting descendant hit targeting as the cause. The repair
  applies `pointer-events: none` only to the component-owned direct SVG and span
  decorations. It does not add focus calls or keyboard-navigation interception.
  The 12 zoom unit cases pass separately in all three engines (36 executions)
  in the run beginning `2026-08-26T16-49-17-404Z`, including computed hit testing
  that resolves decoration centers to their buttons. The native media/font gate
  subsequently passes all 18 cases across three engines in
  `2026-08-26T16-49-56-414Z`, including the original mixed pointer/keyboard zoom
  flow. The fresh complete gate
  `2026-08-26T17-34-30-709Z-linux-final-a11y-621` subsequently passes all 621 cases,
  including the unchanged native zoom sequence in each engine, with zero retries,
  normal exit and stable source. Human keyboard/AT review and visual certification
  remain separate requirements.

## Earlier Section 2 keyboard and runner follow-up

See the [follow-up evidence](baselines/2026-08-26-section-2-follow-up.md).

- CERT-011: traced passing-story reloads to missing view-mode substitution and
  completion before Storybook's post-story hooks. A version-specific runner patch
  and CI regression preserve failure detection. All 69 tagged contracts pass
  with zero retry messages. Four consecutive raw runner executions have zero
  navigations, and an intentionally failing play function is rejected. The
  runner's failure-path retry mechanism remains unchanged.
- CERT-013 (P2, Section 2, fixed locally): manual tabs used selection rather than
  focus for navigation, left stale roving tab stops, mishandled activation inside
  consumer shadow roots, intercepted panel-input arrows, and omitted a default
  tab stop for text panels. Four core and three native browser regressions plus
  the explicit tab interaction contract pass. Consumer tabindex is preserved.
- CERT-014 (P2, Section 2, fixed locally): menu arrows used hover state instead of
  keyboard focus, and item activation Space contaminated typeahead. Two core
  regressions, the menu-item interaction contract, and native browser keys pass.

These findings were closed for the reproduced defects, not for every keyboard
state or browser. At that checkpoint CERT-001 still had 34 representative
interaction gaps; the later 102-contract result supersedes that count.

## Section 2 fixture repair evidence, 2026-08-26

The later [option/tree slice](baselines/2026-08-26-section-2-option-tree.md) records:

- CERT-015 (P1 correctness, Section 2, fixed locally): tree selection recursively
  redispatched its own event. Native Tab entry/re-entry also failed through
  negative-tabindex shadow hosts, disabled items could activate, rapid selection
  left stale state, and child observation did not restart after reconnect.
  Targeted core regressions, the attributed tree-item contract, and native
  Chromium selection/focus checks pass. Leaf expansion and level semantics were
  corrected against the APG tree contract (WCAG 2.1.1 Keyboard, 2.4.3 Focus Order,
  and 4.1.2 Name, Role, Value).
- CERT-016 (P1 accessibility, Sections 2/3, fixed locally): select's shadow-button
  `aria-activedescendant` could not resolve the light-DOM option. A Chromium probe
  returned a null reflected reference even though the option ID existed. It now
  uses ARIA element reflection, tested for resolution and clearing on close.
  Disabled initial/hover options are also rejected. Older browsers without the
  reflection API are not claimed as supported; cross-engine/AT review is still
  required under CERT-006/007. See
  [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).
- CERT-017 (P2 test stability, Sections 2/6, open): Storybook loads external Google
  Fonts CSS in `preview-head.html`. The retained field-audit trace identifies
  `fonts.googleapis.com` with `net::ERR_TIMED_OUT`; a concurrent Storybook run
  also timed out during initial iframe loading. Later reruns pass, but do not
  close the dependency. Closure requires deterministic, licensed local font
  assets and repeated browser runs without external font-network dependence,
  plus visual-baseline review. Do not suppress console errors or merely increase
  timeouts to close it.

CERT-002 is closed for the identified mapping defect. This is not full
accessibility certification. The Chromium gate passed all 155 catalog audits
and six browser guard regression tests; nine generator regression tests also
passed. The independent presence audit found all 155 tags across 137 stories.
No absent-host exemptions or axe-rule suppressions were added.

Raw evidence is retained under `quality/evidence/`:

- `2026-08-26T09-55-50-155Z-section2-a11y-fixtures`
- `2026-08-26T10-00-05-963Z-section2-fixture-presence`

The first run overlaps test-authoring changes and catalog generation, so its
source fingerprint changed. It is implementation evidence, not an immutable
release-candidate run. Cross-browser and human certification defects remain open.

## Additional localization finding

CERT-012 (P2, Section 4, open): the source audit found registry-bypassing English
defaults in `fluid-truncate` (`moreLabel` / `lessLabel`) and `fluid-chart`
(`label` and the doughnut center text). Application-overridable properties are
not automatic locale switching. Closure requires a full internal-string audit,
registry-backed defaults that preserve explicit application overrides, and
locale-change regression tests. These examples are not the complete audit.

## CERT-002 affected mappings

`fluid-bubble-chart`, `fluid-chart`, `fluid-doughnut-chart`, `fluid-line-chart`,
`fluid-pie-chart`, `fluid-polar-area-chart`, `fluid-radar-chart`,
`fluid-scatter-chart`, and `fluid-sparkline` all map to `charts-gallery--bar`.
That story does not render those nine elements.

Additional absent elements are `fluid-celebrate` in `animations-effects--gallery`,
`fluid-col` in `components-layout-grid--intrinsic`, `fluid-menu-label` in
`components-navigation-menu--default`, and `fluid-toast-item` in
`components-feedback-toast--default`. Action-created content must be created
before its accessibility audit; its absence is not a valid exemption.

This register is a baseline, not an exhaustive security or component review.
New failures from the full baseline matrix are added before Section 1 sign-off.
