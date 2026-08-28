# Section 2 parallel implementation evidence, 2026-08-26

Status: integration in progress. All work remains uncommitted at the owner's
request. This record is not section sign-off or a production-readiness claim.

## Verified checkpoints

- The second built Storybook batch passes 95 attributed interaction contracts,
  with 125 non-contract cases excluded by tag. Evidence:
  `2026-08-26T11-58-24-790Z-section2-agent-wave2-stories`.
- Source attribution is 95/102 applicable elements (93.1 percent), 95/155
  catalog-wide (61.3 percent) at that checkpoint. Seven applicable tags were
  still being implemented. The floor was raised to 95 only after execution.
- Mosaic was corrected from composite to helper after inspecting its complete
  implementation: it has only layout properties and a slot. This reduces the
  denominator by one and adds **zero** covered interactions. Its native slotted
  focus-order and layout test remains, uncounted as an interaction contract.
- The scanner now parses exported story objects instead of matching a nearby
  `play` string. Five regression tests reject comments, neighboring plays,
  missing runner tags, non-functions and explicit tag opt-outs. This remains
  source attribution; browser execution is still required.

These runs overlap other agents' source edits. Their fingerprints explicitly
record that fact; they are implementation evidence, not immutable RC runs.

## Deterministic fonts (CERT-017)

Storybook now serves 13 unchanged WOFF2 assets locally: all original Inter and
JetBrains Mono subsets and requested weights. Licenses, source URLs and SHA-256
digests are retained in `apps/storybook/public/fonts/`. The build validates the
assets and does not download fonts. Arabic still uses the configured fallback;
this does not certify Arabic typography.

- Red browser test: blocking external requests leaves zero expected font faces
  in the previous build (`2026-08-26T11-44-36-166Z-section2-fonts-red`).
- Green browser test: all 31 declarations load from 13 local files, zero
  external requests, failed requests or page errors
  (`2026-08-26T11-45-46-068Z-section2-fonts-green`).
- Browser measurements before/after: primary button remains 89.625 by
  32.796875 CSS pixels, same computed font. Sample Inter text remains
  306.6640625 pixels wide; JetBrains Mono remains 335.9996643066406.
- The existing primary-button baselines pass in light, dark, forced-colors,
  RTL and reduced-motion modes, without updating any snapshots
  (`2026-08-26T11-46-37-466Z-section2-fonts-visual-button`). This is a sample,
  not the complete visual matrix or 50-run stability history.
- All three engines load the local faces in the later native run. The test
  normalizes CSSOM family quoting, keeps exact face/weight/asset assertions,
  and retains per-engine metrics. Chromium's measured-width baseline is not
  imposed on Firefox, whose text rounding differs by 0.036 pixels.

## Expanded browser matrix

Firefox and WebKit binaries are now installed. The a11y configuration and CI
install step run Chromium, Firefox and WebKit with no retries. The option/tree
native checks pass in all three. Zoom pointer, native keyboard and numeric
transform assertions also pass all three after removing browser-specific CSS
string serialization and click-focus assumptions:
`2026-08-26T11-56-57-766Z-section2-wave1-zoom-cross-engine`.

The full matrix is still being integrated. Failures are not skipped:

- Windows WebKit skips a plain native anchor in Tab order as well as the
  component links. A plain button/anchor/button probe reproduces this without
  Fluid; Alt+Tab does not change it in this build.
- Windows WebKit advances native WebM playback but leaves `readyState=0`,
  `duration=NaN`, and never reports `ended`. A bare native video reproduces it,
  including with a separately remuxed/re-encoded diagnostic asset. This is not
  evidence of successful playback, nor a reason to fake media events.
- Parser's nested live regions are a real runtime defect found by the native
  tests, not just ambiguous selectors. The redundant outer status/alert
  regions are removed; the callout remains the single live announcer.
- The infinite-table native test referenced a nonexistent default story. It
  now uses the built `template-columns` story; runtime assertions remain.

The Windows WebKit result is not a Safari-on-macOS result. Canonical Linux CI,
real supported browser versions, and manual assistive-technology review remain
required. The preceding failed attempts and traces are retained under ignored
`quality/evidence/`; they must not be counted as passing certification.

## Visual and localization limits

Charts now expose native HTML legend toggles; zoom and kanban add non-drag
controls. These are intentional UI changes requiring reviewed new visual
baselines, not automatic acceptance. Expansion-package shared localization and
fluent-speaker review are not solved by configurable English label properties.

Final integrated totals and unresolved defects will be appended after the
remaining agents and gates finish.

## Integration checkpoint

The wave-two native matrix finished with 581 passed and 13 failed of 594
executions. All 155 catalog axe audits passed in each of the three engines.
Six failures exposed parser live-region nesting, three used a nonexistent
table story, and four involved Windows WebKit native link/media behavior.
The WebKit navigation worker hung after its browser exited and was explicitly
terminated; its failed result is retained, not counted as a completed pass.
Artifacts: `2026-08-26T11-58-48-640Z-section2-wave2-browser-matrix`.

The complete source inventory now attributes 102/102 applicable elements, but
the first complete execution passes only 96 and fails six. The policy floor
remains 95. Source presence is not passing coverage. Integration failures
include shadow-DOM test-driver assumptions, editor HTML expectations, and map
behavior; the failed log remains in
`2026-08-26T12-10-29-512Z-section2-all-contracts`. Corrections require another
built run before any completion claim.

## Next-section audit findings

The subsequent built interaction run passes **102/102** applicable contracts
(102/155 catalog-wide, 65.8 percent), with 125 non-contract stories excluded by
tag and no retries. Evidence:
`2026-08-26T12-17-00-761Z-section2-all-contracts-recheck`. The policy floor is
now 102. The run's source fingerprint changed because independent next-section
work was underway; its static Storybook artifact was not rebuilt during the run.
This closes the representative applicability gap, not all behavioral states or
Section 2 certification. The full 621-case native matrix finishes with 617 passed
and four Windows WebKit failures: two native link-navigation cases and two media
cases. Chromium and Firefox pass all 207 cases each; WebKit passes 203. No test
skips or retries were introduced. Two WebKit workers hung after their browsers
exited and were terminated explicitly; those remain failed results, not passes.
Artifacts: `2026-08-26T12-20-25-840Z-section2-native-integrated`.

Parser's 98 unit tests pass in each engine (294 executions):
`2026-08-26T12-13-44-870Z-section2-parser-live-regions`. Native accessibility
subtree assertions check slotted callout text and exactly one live region.
The final reset flow activates a genuinely focused button with native Space,
avoiding the incorrect assumption that every browser focuses buttons on click.

The map keyboard test exposed a real omission: Leaflet's Enter activation
opened a popup without forwarding `fluid-marker-click`. A regression proves
the event is now emitted. Its 16 unit tests pass in each engine. Native tests
cover mouse and Enter independently; the Storybook play uses DOM click for
Leaflet because the installed synthetic pointer helper lacks enumerable event
coordinates needed by Leaflet's event copy. It is not claimed as native pointer
proof. Infinite-table index assertions read the current window atomically so
momentum cannot mix a key from one frame with an index from the next.

Read-only audits identified concrete work beyond representative contracts:

- SSR state restoration writes native controls but not Fluid host properties
  or submitted form values. Its selection restoration accepts null offsets for
  input types that do not support `setSelectionRange`. Browser reproduction
  and named-form, validation, reset and node-identity tests are required.
- Current full-catalog hydration asserts registration and shadow roots, not
  preserved server node identity or meaningful behavior for every component.
  Framework fixtures build but do not run production-browser contracts.
- Locale lookup stops at shadow-root boundaries; the document observer cannot
  see `lang`/`dir` changes inside shadow trees. Several core validation strings
  and expansion-package internal labels bypass the translation registry.
- These source findings are not yet verified fixes. Manual AT, fluent-speaker
  review, canonical browser/platform evidence, reviewed visual changes and
  release-candidate runs remain open.

## Subsequent certification work

The findings above led to the following bounded fixes, not whole-section sign-off:

- Localization now follows DOM ancestry across shadow hosts and observes locale
  changes inside shadow roots, with shared observer teardown. Six additional
  validation/truncate terms are present in English, Dutch, German, French,
  Spanish, Arabic and the pseudo locale. Switch, radio-group, OTP and truncate
  preserve explicit labels and custom errors. The complete targeted matrix
  passes 104 tests per engine, 312 total:
  `2026-08-26T12-43-27-640Z-localization-validation-confirmed-matrix`.
  Its shared-tree fingerprint changed during the run, so this is implementation
  evidence. The prior 311/312 result remains retained: Firefox discarded the
  constructor-supplied clipboard payload before the component handled it.
  A real keyboard copy/paste regression now checks the trusted event, payload,
  six boxes, emitted events, submitted value and focus. OTP runtime code was
  not changed to accommodate the test.
- An isolated React consumer successfully installs six Fluid tarballs, then
  typechecks and builds without the workspace base config. The exact consumer
  source, pnpm lock and tarballs are retained:
  `2026-08-26T12-35-22-847Z-framework-react-isolated-recheck`.
  This is latest-compatible build evidence, not a pinned framework runtime lane.
- Eight benchmark instrumentation and negative-control checks pass:
  `2026-08-26T12-40-13-013Z-benchmark-final-controls`. They reject missing or
  invalid metrics and detect native-node replacement and retained heap memory.
- Four browser-selection regressions pass. All 14 unit runners now reject
  unknown or partly invalid `FLUID_BROWSERS` selections instead of silently
  downgrading to Chromium-only. The root verification command runs these tests.
- Test CI now targets Node 22, with a Node 22/24 verification matrix. Workspace
  prerequisites build before downstream checks; browser system dependencies
  install even when binary caches hit. SSR CI installs all three engines and
  visual CI runs the fixture guards. These workflow edits are statically checked,
  not evidence of successful GitHub-hosted execution.
- A local integration attempt exposed nested bare `pnpm` resolving to 11.19.0
  even though the outer command used Corepack 9.15.0. That attempt was stopped
  and retained as failed (`2026-08-26T12-44-12-411Z-readiness-integrated-verify`).
  The evidence recorder now checks the resolved nested pnpm version before
  starting a pnpm gate. The replacement run uses Corepack shims on the process
  PATH; no global toolchain or dependency installation was changed.

Remaining work includes further core and expansion strings, date/number/plural
flows, real framework runtime contracts, canonical platform/visual evidence,
manual AT and fluent-speaker review. None of these is implied by a passing
representative interaction count.

The replacement full workspace gate passes in
`2026-08-26T12-45-57-272Z-readiness-pinned-toolchain-verify`: 1,661 Chromium unit
tests across 14 packages (1,221 core), workspace typechecks, lint, source-presence
and quality checks, 18 classification/scope tests, five compiler-isolation tests,
four browser-selector tests, tokens, all package builds, Node SSR (159 imports,
155 rendered elements, 154 DSD roots), and 136 documentation pages. The shared
tree changed while documentation/SSR integration continued, recorded explicitly.
This is not a three-engine full-unit run or immutable release-candidate proof.

## Later SSR, localization, React and documentation checkpoint

- SSR input/checkbox state reconciliation, selection safety, original checkbox
  reset defaults and native Firefox invalid-input focus pass 36 browser checks
  plus 162 targeted unit executions across three engines. Five server native
  controls retain identity. Evidence:
  `2026-08-26T12-59-00-532Z-ssr-form-browser-final-focus-fixed`.
  This is a Vite development DSD fixture, not packed framework SSR. Known exact
  Lit render-cycle warning debt remains recorded, not described as console-clean.
- Seven core form components gain live localized required messages, with nine
  additional typed terms in all five official draft dictionaries. The pre-fix
  Chromium run passes 121 existing tests and fails 89 new regressions:
  `2026-08-26T13-02-14-078Z-core-forms-localization-red`.
  The fixed matrix passes 210 per engine, 630 total, with stable fingerprints:
  `2026-08-26T13-04-39-666Z-core-forms-localization-green-matrix`.
  Custom errors, application labels/slots and canonical values are preserved.
  The catalog audit remains a historical inventory, not full localization proof.
- Native React JSX event props now preserve exact custom-event spelling, while
  wrappers retain their explicit camel-case mapping. Packed production CSR
  checks initially pass 20/21 and independently reproduce Firefox invalid-input
  focus. After the fix, a fresh consumer passes 21/21 across three engines,
  including negative controls and clean bounded teardown, without browser or
  network errors. Both consumers, locks, tarballs and traces are retained:
  `framework-fixtures/2026-08-26T12-56-16-818Z--fluid-ds-admin-react` and
  `framework-fixtures/2026-08-26T13-02-48-080Z--fluid-ds-admin-react`.
  These are latest-compatible React CSR checks; frozen portable replay, other
  framework runtimes and CEM-derived payload typing remain separate work.
- A parsed built-documentation audit fails on 13 broken internal destinations:
  `2026-08-26T12-59-30-316Z-docs-link-baseline`. Source links are corrected; the
  rebuilt site passes 24,214 local checks across 136 pages and seven checker
  regressions in `2026-08-26T13-06-01-575Z-docs-link-corrections-verify`.
  The gate explicitly reports 574 external/separate-application links as outside
  its validation scope. No external destination availability is claimed.
- Rebuilt Storybook passes all 102 contracts after the SSR/localization fixes:
  `2026-08-26T13-11-13-174Z-storybook-post-ssr-localization-contracts`.
  The 125 tag-excluded stories are not additional missing applicable components.
  The whole-tree fingerprint changed during parallel work, so this remains
  implementation evidence. Retained consumer package names exposed a Jest module
  map collision warning; evidence directories are now excluded from that map,
  without narrowing story selection or weakening browser assertions.

Strict-peer React follow-up removes global peer-rewriting overrides in favor of
actual parent-qualified dependency edges. A fresh runtime and a relocated frozen
replay each pass 21/21 with no peer warnings and clean teardown:
`framework-fixtures/2026-08-26T13-14-12-307Z--fluid-ds-admin-react` and
`framework-replays/2026-08-26T13-15-25-873Z`. Replay skips dependency resolution,
reuses 99 packages with no downloads, and retains identical SHA-256 hashes for
28 source/graph files including six tarballs and the lock. Original evidence is
unchanged. This is same-platform Windows/Node 22 replay, not cross-OS proof.
The CI command now requests both lanes and retains both evidence directories;
remote execution remains pending.

The React generated-output gate also now compares exact expected files and bytes
without regenerating first. Three negative-control regressions cover altered,
missing and unexpected output; the existing 155-wrapper output passes. Source
metadata and CEM-derived event payload types remain separate work.

The next native invalid-submission slice reproduces 40 Firefox console errors
across checkbox, switch, textarea, number-input and typeahead in both client and
DSD modes, while the input control passes. The red run is 2 passed / 10 failed:
`2026-08-26T13-12-35-551Z-native-form-focus-before-fix`. The fix adds native
shadow focus delegation only to the five confirmed controls, not their shared
base. The resulting evidence is:

- 384 targeted unit executions, 128 per engine, stable source fingerprint:
  `2026-08-26T13-18-49-179Z-native-form-focus-unit-after-fix`.
- 36 browser checks: six controls, client/DSD, three engines. Each checks four
  invalid and four valid native/Fluid button activations via pointer/keyboard,
  real editing, FormData and DSD native-node retention:
  `2026-08-26T13-19-41-438Z-native-form-focus-browser-after-fix`.
- Six browser negative controls for the extracted strict warning collector:
  `2026-08-26T13-21-07-666Z-ssr-warning-guards-after-extraction`.

The new form matrix has no unexpected warnings or native validation errors.
It retains six exact known render-cycle notices per engine (input, textarea,
number-input, two each), plus 12 Lit development notices. The explicit SSR debt
list now contains 14 tags. Further typeahead states emit the same class of
notice in unit logs but have no browser exemption. This is not a warning-clean
claim. Coverage is 6/16 required controls, not all 22 form-associated elements;
pre-hydration host reconciliation is still input/checkbox only. Existing and
new SSR suites total 72 cases; the complete 72-case run has not yet been made
at this checkpoint. All original failed evidence is retained.

A coverage-denominator audit compares current runtime source against retained
per-package loaded-module reports. Its failed comparison is retained as
`2026-08-26T13-25-48-484Z-coverage-denominator-baseline`. Fifteen animation
registration files, the client hydration helper and an offline map story helper
are absent. Importantly, the core report was written at 09:12 local time, before
the hydration-helper tests were authored; this is not evidence that the current
WTR test glob excludes those tests. The forthcoming coverage gate requires
reports newer than its run start and checks the runtime-file inventory after
all package tests succeed. Pure type/barrel files and the explicitly Node-only
SSR renderer are reported separately, never counted as executed browser code.
Fresh coverage and new animation/asset behavioral checks are pending here.

### Later source-stable checkpoint and test-integrity findings

The hydration-helper edge suite passes 26 cases per engine, 78 executions:
`2026-08-26T13-36-08-176Z-ssr-helper-unit-edge-matrix`. Animation registration/
entry behavior and offline map assets pass 45 and six executions respectively:
`2026-08-26T13-35-26-352Z-animation-entry-contracts` and
`2026-08-26T13-35-34-326Z-offline-map-asset-contracts`.

The 16-tag default-label migration adds 151 cases; all 359 cases pass in each
separate engine with normal shutdown. Evidence ends in
`core-labels-localization-chromium-serial`, `-firefox-serial`, and `-webkit-serial`
at 13:36:35, 13:37:03 and 13:37:51 UTC. The preceding combined 1,077-assertion
pass failed teardown and remains failed evidence.

The signature Storybook contract previously only placed an image. It now asserts
signed/cleared state, output and event counts. An executed no-op is rejected in
`2026-08-26T13-39-19-550Z-signature-story-mutant-executed`. The control must switch
stories before replay and assert the mutant was called; earlier same-story
attempts did neither and are not valid mutation evidence. No new tag is credited.

`2026-08-26T13-41-10-196Z-full-workspace-three-engine-checkpoint` is source-stable
and failed. Chromium packages pass, Firefox core has four assertion failures,
and WebKit stops after chart assertions because shutdown hangs. Later WebKit
packages and build/SSR/docs stages were not reached. Serial engines do not fix
the shutdown issue. Owned process/socket identities and cleanup are retained.

The image fixture contains invalid PNG data, not a component regression. Correct
PNG bytes, native decoder/dimension checks and listener-before-load ordering pass
33 executions: `2026-08-26T13-49-34-078Z-image-valid-decoder-and-events`. The input
failure exposes an unfinished-command hazard: a prior test starts typing `abc`
but awaits only the `a` event. Seven such detached commands are being corrected.
The failing run did not capture the final value, so its precise causality remains
unproven. No failures are waived and no runtime image behavior changed.
