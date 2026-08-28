# Fluid production-readiness plan

Status: approved implementation program; implementation resumed at the owner's request  
Target: Fluid 1.0 production readiness  
Baseline date: 2026-08-25  
Scope: all published core components and expansion packages

## Current certification status, 2026-08-28

The project owner approved the eight-section execution plan on 2026-08-26.
Section 1 is ready for owner sign-off; no section completion or component promotion has been
signed off. The owner subsequently authorized local WIP checkpoints through
`5ef233a` (`docs: refresh production readiness handoff`). None was pushed.

Current continuation note: machine localization scope is reconciled at 155/155
elements and 12/12 surfaces, while fluent-language, visual RTL and manual AT
approval remain open. The final synchronized seven-consumer packed matrix and
relocated offline/frozen replay pass against the current root lock: all seven
install, typecheck and production-build lanes pass, with 39/39 retained runtime
records across Chromium, Firefox and WebKit. The selected archive bytes are
portable and reproducible. React's 14 internal development ranges are now exact
`0.4.0`; 10/10 initial and 5/5 final raw packs are byte-identical, and a newly
packed consumer passes install, typecheck, build and all-engine runtime. A separate
packed Next production-server gate passes concurrent request isolation and the
three-engine hydration contract. The retained complete browser
stable-depth matrix now passes 765/765 (255 per installed Playwright engine),
including the nine additional causal depth cohorts, with clean supervised teardown.
This machine result does not promote a depth marker or maturity label and does not
close manual AT or native Safari/mobile gates.

The retained 27 August live dependency audit on lock
`17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`
reports 0 critical, 1 high, 20 moderate and 6 low occurrences, with no finding
rooted in a publishable package's production/optional dependency. The gate passes
with zero unaccepted high/critical paths. Linux malicious/safe archive proof
credits exactly 14 development-only `extract-zip` paths behind the sole retained
raw high finding as locally patched.

Expansion performance now has a repeated seven-case Chromium profile for Table,
Chart, Scheduler, Editor, Parser, Map and Node Graph. It exposed and repaired a
real Map disconnect/zoom lifecycle defect; the focused Map suite passes 26 Chromium
assertions. No expansion budget, leak-freedom, cross-browser performance, or trend
claim follows from that contended single-date run. The old cumulative visual history
retains one flaky execution in 86 runs (1.163%), but its replacement machine window
completed 50/50 exact full-catalog executions under the fail-closed
`--num-raster-threads=1` policy with zero flaky executions and zero fresh-capture
variance. Sixty candidate images remain outside the accepted baseline and require
human approval.

The core bundle ceilings remain unchanged: Button 19,000 B, Dialog 14,000 B,
Input 16,000 B and React Button 23,000 B. Commit `9ae245e` restored compliance
without rebasing them by moving disabled-fieldset preservation from universal
`FluidElement` into an opt-in controller on seven affected form controls. Its
nested-fieldset checkbox regression covers disconnect release, detached authored
edits and reconnect reacquisition. Commit `8defff0` adds deterministic final-frame
settling to the nine animated Chart fixtures and replaces network-dependent
AspectRatio, Lightbox and Map story pixels with inline/local assets. Selection is
9/9 and the fail-closed visual lifecycle contract is 42/42 across three engines.
The authoritative exact-tree `FLUID_BROWSERS=all corepack pnpm@9.15.0 verify`
passed on `0879c8b` in 789 seconds. Its retained log SHA-256 is
`792e65305237cd332dd6a4e5a146145b590d192b6686bce345490c2e6b0de0ec`.
On clean HEAD `5ef233a`, the pinned framework profile and every explicit
serialized framework lane pass in 400 seconds summed lane time and 493 seconds
wall time. The retained framework log SHA-256 is
`14741619b0ec10ccf8adf3df1c0469a5cbb00fa497b1c31503711b88681d5054`.
The exact `corepack pnpm@9.15.0 publish:dry` rehearsal also exits 0; its retained
JSON records 18 packages at `0.4.0` and empty failure, network-command and
publish-command arrays. No publication, push, deployment or tag occurred.

Current machine checkpoints: the cross-browser unit matrix passes 2,501 assertions
per engine, or 7,503 executions across all 42 package/engine runs. Fresh measured
Chromium coverage executes the same 2,501 assertions and passes every ratcheted
floor across all 14 packages, with no missing required runtime files. The Node SSR
gate passes 1,904 isolated cold built-JavaScript imports and all 155 catalog renders;
the fresh integrated browser SSR gate passes 231/231 across Chromium, Firefox and
WebKit in 6.5 minutes. The 136-page docs
build checks 26,043 local links/fragments with zero failures. The rebuilt Storybook passes 102 tagged
representative contracts; 125 untagged stories are outside that execution count.
The SSR expansion reproduced a scheduler focus defect when the late-day roving
calendar day was disabled: validity focus delegated to the navigation button. It
now falls back to the first enabled day, with a deterministic regression and the
scheduler unit suite passing 68/68. The serial matrix's global timeout increased
from 420 to 600 seconds as it grew from 213 to 231 cases; individual 60-second
timeouts are unchanged. Node renderer coverage is 100% for lines, branches and
functions. Native required-focus coverage is 16/16; pre-hydration
state adoption is 14/14 applicable elements with eight explicit non-applicable
boundaries. Fresh packed React passes 21 representative records across three engines, and
the complete seven-consumer frozen replay passes 39/39 aggregate runtime records.
The complete accessibility rerun passes 642/642 cases (214 per engine) with zero
retries, skips or flakes; retained preceding failures remain evidence. Compatible Angular/Next patches pass frozen installs,
typechecks and production builds. The final package-evidence cleanup repair passes 32 guards
and targeted lint separately from the full verification snapshot. Actual fresh
packing/install passes all 18 packages, strict peers, public-file checks and 16
runtime/type roots; 14 canonical manifests pass in the exact consumer archives.
The final packed CEM gate passes 14/14, `test:packed` passes 32/32 policy guards,
18 tarballs and installed packages, and 16 runtime plus 16 type roots, and the
supply-chain gate passes 11/11. These machine gates do not waive the open audit.
Eight benchmark measurement guards and the unchanged budgets pass on Linux,
without claiming complete catalog coverage or repeated-run stability.
These results do not close localization, framework runtime, remaining security,
visual or manual certification gaps. The
[Linux review](../reviews/linux-verification-2026-08-26.md) retains exact scope
and failing evidence. The earlier checkpoints below are historical, not current
coverage denominators or release approval.

Completed slices: color-picker passes 18 focused browser checks and 87 unit
executions; file-input passes 18 focused browser checks and 93 unit executions;
OTP passes 18 focused browser checks and 90 unit executions; radio-group passes
18 focused browser checks and 57 unit executions; date-range-picker passes 18
focused browser checks and 60 unit executions; scheduler passes 18 focused
browser checks, 186 package-unit executions, 36 focused calendar executions and
150 localization executions. The integrated SSR gate now passes 213 cases after
the subsequent SSR state/context batch.
Color-picker's full workspace
verification passed; file-input's all-engine full workspace checkpoint also
passes 6,906 unit executions across 42 package/engine runs, 18 package builds,
1,903 cold imports, 155 renders and 24,224 local documentation links.
Dedicated coverage, Storybook, accessibility, packed-consumer and performance
results above remain the earlier checkpoint, not reruns of this slice. See the
[color-picker evidence](../reviews/color-picker-form-contract-2026-08-26.md) and
[file-input evidence](../reviews/file-input-form-contract-2026-08-26.md), plus the
[OTP evidence](../reviews/otp-form-contract-2026-08-26.md) and
[radio-group evidence](../reviews/radio-group-form-contract-2026-08-26.md) and
[date-range evidence](../reviews/date-range-picker-form-contract-2026-08-27.md) and
[scheduler evidence](../reviews/scheduler-form-contract-2026-08-27.md).
The scoped native-focus and SSR state/request-context inventories and their
coordinated full-workspace checkpoints are complete; the next implementation
batch is localization and RTL. No section sign-off has been granted.

## Resume plan, 27 August 2026

Recorded on 26 August at the owner's request; the owner subsequently resumed
implementation in this task. No overnight work or reminder is scheduled.
This sequence implements the existing
eight approved sections below, not a replacement scope or a new sign-off.
Local WIP checkpoints exist through `0879c8b`; nothing has been pushed. Preserve
the current branch and all subsequent changes.

### Starting point and completion rules

Today's passing checkpoint is recorded above and in the
[Linux verification review](../reviews/linux-verification-2026-08-26.md).
It establishes a working baseline, not a production-ready release. In particular,
102 representative interaction contracts are not exhaustive behavior coverage;
642 automated accessibility cases are not manual assistive-technology approval;
16/16 native required-focus contracts are not pre-hydration state adoption.
Pre-hydration state adoption now passes for all 14 applicable elements, but it
does not replace request-time SSR verification or deployed consumer validation.

Keep the eight-section sign-off ledger authoritative. Section 1 is ready for
owner review; Sections 2 through 7 still have engineering or acceptance work;
Section 8 follows their acceptance. No owner checkbox, stable promotion, release,
commit or publication is authorized by this continuation plan.

### Ordered engineering batches

Each unchecked batch needs linked execution evidence and an explicit statement
of remaining scope before it can be marked complete. Use smaller component-level
slices within a batch, reporting done, blocked and next after each slice.

1. [x] **Native form-focus completion (Sections 2, 3 and 4).** Start with
       color-picker, then file-input in a separate slice. Continue with OTP,
       radio-group, date-range-picker and scheduler. These six are evidence gaps,
       not six established bugs. Read the
       [native-focus review](../reviews/native-form-focus-2026-08-26.md) first.
       For each control, test actual pointer/keyboard interaction, required and custom
       invalid-submit focus, valid submission and FormData, reset, applicable
       disabled/read-only behavior, emitted events and retained DSD server nodes.
       File-input must use real file selection, not a synthetic host-value shortcut.
       Exit: all 16 required controls have meaningful passing client/DSD focus
       contracts in Chromium, Firefox and WebKit, with normal shutdown and no new
       console allowances. State-adoption coverage remains a separate inventory.
   - [x] Color-picker focused client/DSD contracts and repairs: 18 browser checks,
         87 unit executions, the integrated SSR gate and full workspace verification
         pass. See linked evidence above.
   - [x] File-input native form/SSR contract and reproduced repairs: 18 browser
         checks, 93 unit executions and the integrated 132-case SSR gate pass. See
         [the retained evidence](../reviews/file-input-form-contract-2026-08-26.md).
   - [x] OTP native form/SSR contract and reproduced repairs: 18 browser checks,
         90 unit executions and the integrated 150-case SSR gate pass. See
         [the retained evidence](../reviews/otp-form-contract-2026-08-26.md).
   - [x] Radio-group native form/SSR contract and reproduced repairs: 18 browser
         checks, 57 unit executions and the integrated 168-case SSR gate pass.
         See [the retained evidence](../reviews/radio-group-form-contract-2026-08-26.md).
   - [x] Date-range-picker native form/SSR contract and reproduced repairs: 18
         browser checks, 60 unit executions and the integrated 186-case SSR gate
         pass. See
         [the retained evidence](../reviews/date-range-picker-form-contract-2026-08-27.md).
   - [x] Scheduler native form/SSR/localization contract and reproduced repairs:
         18 browser checks, 186 scheduler-package unit executions, 36 focused
         calendar executions, 150 localization executions and the exact
         integrated 204-case SSR gate pass. See
         [the retained evidence](../reviews/scheduler-form-contract-2026-08-27.md).

2. [x] **SSR state, request context and warning debt (Section 4).** Inventory
       applicable pre-registration state adoption beyond input/checkbox, recording
       unsupported boundaries. Cover delayed registration, reload/history behavior,
       edited values, form state, custom errors, node identity and duplicate events.
       Repair native-ancestor SSR locale inheritance with parser-correct,
       request-isolated context, including concurrent requests and malformed HTML
       tree-construction cases. Resolve the 14 named render-cycle warning allowances
       without broadening the allowlist. Exit: the applicable adoption matrix and
       ancestor-locale regressions pass, errors remain observable, and supported versus
       unsupported SSR behavior is explicit and tested.

   Completed 2026-08-27: the machine-derived matrix is 14/14 applicable,
   parser-correct request-local ancestor localization passes malformed-tree
   and interleaved-request controls, the 14 warning exceptions are deleted,
   and the strict integrated browser gate passes 213/213 across all engines.
   The exact completed batch also passes `FLUID_BROWSERS=all pnpm verify`:
   6,978 unit executions across 42 package/engine runs, 18 builds, 1,903
   isolated cold imports, all 155 server renders, the 136-page docs build and
   24,224 local links. Node renderer coverage is 100% for lines, branches and
   functions.
   See the [state-adoption inventory](../reviews/ssr-state-adoption-inventory-2026-08-27.md)
   and CERT-058. This completes the batch, not all of Section 4; localization
   and RTL product completion remains item 3.

   Current follow-up: after the matrix grew from 213 to 231 cases, the fresh
   all-engine run passes 231/231 in 6.5 minutes. It includes the deterministic
   scheduler disabled-roving-day focus repair recorded in CERT-066.

3. [ ] **Finish localization and RTL (Section 4).** Use the
       [remaining-localization audit](../reviews/localization-remaining-2026-08-26.md);
       do not redo completed formatter, countdown/tour or typed-callback work.
       Complete core calendar/date/time context and presets, file-size text,
       binary long-unit grammar, meter descriptions and expansion-package strings.
       Preserve application-provided text, explicit locale overrides and canonical
       form values. Cover structured validation messages, plural/date/number output,
       locale fallback, live language changes, standalone imports, SSR isolation and
       actual RTL keyboard/layout workflows. Existing nl/de/fr/es/ar dictionaries and
       pseudo-locales need completeness and quality review, not merely file presence.
       Exit: every owned internal string has a disposition, relevant runtime and RTL
       tests pass, and the localization/RTL guide matches them. Fluent-speaker review
       is a separate required human gate, not inferred from dictionary parity.
       **27 August progress:** a guarded 155-element owned-string inventory now
       prevents denominator drift. Core binary-unit/file-size/meter output, core
       calendar language/direction behavior, six media components and the parser's
       structured error boundary are implemented and verified across all three
       engines. The localization/RTL and SSR guidance now documents ownership,
       canonical-value and request-isolation boundaries. A second parallel wave adds
       localized core date/range/time presets and prompts plus explicit editor,
       kanban and node-graph RTL behavior contracts. Event-calendar/availability,
       remaining expansion-package strings, localized parser UI, pseudo-locale
       visual approval, fluent review and manual AT remain open; this
       progress does not complete the item or Section 4. See the dated reviews in
       `docs/reviews/` and CERT-059.

   Current machine disposition: the guarded integration audit now assigns all
   155 elements and all 12 cross-cutting surfaces, with no confirmed remaining
   Fluid-owned string migration. This closes the implementation inventory, not
   the fluent-speaker, visual Arabic/RTL, manual AT or owner-acceptance gates;
   therefore the batch and Section 4 remain unchecked.

4. [ ] **Packed framework matrix (Section 5).** Build a reference Astro SSR
       fixture, then Next.js and SvelteKit server fixtures. Prove real server DSD,
       delayed registration, retained nodes, applicable pre-hydration edits, forms,
       events and absence of hydration/page/console errors. Expand packed React,
       Vue, Angular and plain TypeScript consumer contracts for properties, events,
       slots, references, forms and lazy registration. Generate wrappers/types from
       CEM; replace the remaining 128 unknown event mappings only with verified
       payload contracts. Exit: each supported framework-matrix claim maps to
       passing installed-artifact build/type/runtime tests and reproducible strict-peer
       frozen replays. Generic package installation or CSR alone does not certify SSR.

   Current machine disposition: representative React, Vue, Angular and plain
   TypeScript/HTML CSR plus Astro, Next.js and SvelteKit build-time static DSD
   contracts have current retained all-engine evidence. The final synchronized
   seven-consumer relocated replay passes every frozen install, typecheck, build,
   immutable-byte check and runtime lane (39/39 aggregate runtime records). It
   certifies the selected corpus bytes. Exact internal development ranges also
   make 10/10 initial and 5/5 final React packs byte-identical. A separate packed
   Next production-server gate proves request-time isolation and the three-engine
   hydration contract; deployed hosting adapters remain outside that evidence.
   A final pinned-profile plus explicit serialized-lane replay on clean
   `5ef233a` passes in 400 seconds summed lane time and 493 seconds wall time;
   this confirms the declared representative lanes, not catalog-wide framework
   coverage or deployed adapters.

5. [ ] **Critical behavioral and accessibility depth (Sections 2 and 3).**
       Map stable-candidate critical modes to real assertions: error/recovery paths,
       disabled/read-only states, dynamic children, reconnects and complete keyboard
       and form workflows. Expand Storybook interactions where useful without treating
       one play function as complete coverage. Add dedicated browser accessibility
       checks across light/dark, forced colors, RTL, reduced motion and zoom/reflow.
       Exit: each agreed critical scenario has passing evidence or a release-blocking
       defect; manual NVDA with Chrome/Firefox, VoiceOver with actual Safari/macOS,
       and mobile/touch checks have named reviewers, versions, findings and retests.
       Automated WebKit is not Safari assistive-technology certification.

   Current machine disposition: the 59-row ledger and nine additional causal
   depth cohorts are implemented, and the frozen-source combined suite passes
   255/255 in each installed engine (765/765 executions) with clean supervised
   teardown. Existing depth markers and maturity remain unchanged. Manual AT and
   native Safari/mobile evidence remain separate.

6. [ ] **Visual acceptance and performance history (Section 6).** Confirm the
       canonical visual platform before proposing the 60 currently missing PNGs.
       Cover five environment modes and relevant hover, pressed, focus, invalid,
       disabled and open states, with deterministic fonts/data/time. Do not silently
       accept generated baselines. Establish 50 canonical runs and the agreed below-1%
       flake target. Extend representative budgets to expansion workloads, including
       virtualized tables, charts, scheduler/editor/parser/map/node-graph behavior and
       memory retention. Exit: human-reviewed visual baselines plus retained stability
       history, repeatable measurements and justified budgets. A passing bounded
       performance sample is not history, leak freedom or competitor parity.

   Current machine disposition: the 60 candidates remain unaccepted. The pre-fix
   exact-hash history retains 1 flaky execution in 86 runs (1.163%), and the
   proposed prepaint reproduced the same variance class, was disproved, and was
   reverted. The replacement full-catalog machine window passes 50/50 exact runs
   under the fail-closed `--num-raster-threads=1` policy, with zero flaky
   executions and zero fresh-capture variance. That window covered the candidates
   plus five accepted smoke images, not the complete 1,009 accepted set. A partial
   normal run observed 18 accepted-baseline diffs before cancellation on a changing
   tree; that is not an exhaustive final count. Human review must reconcile the 60
   candidates, stale Chart captures (including a mid-animation doughnut and old
   legend presentation), and accepted AspectRatio/Lightbox/Map pixels changed by
   hermetic story fixtures. The
   expansion profile now covers the seven named complex surfaces. Tagged CDP
   retained-root evidence found and repaired the Map viewport scroll-listener
   leak; old Leaflet Maps are 0/20 and the steady-state heap p95 is 5,664 B.
   Chart old instances are also 0/20, but its 45,448 B positive heap p95 plus
   multi-date, uncontended and cross-engine history remain open.

7. [ ] **Website, documentation, security and release operations (Section 7).** Refresh
       dependency triage and apply verified compatible fixes; separate major upgrades
       and unresolved advisories for explicit decisions. Angular/Next patches are not
       blanket security clearance. Close documentation drift against executable SSR,
       ssr-client, registration/hydration, localization and framework examples.
       Complete the explicit [website and documentation readiness deliverable](#website-and-documentation-readiness):
       update landing-page content, repair navigation and links across public surfaces,
       verify examples/demos, and review responsive, keyboard and light/dark journeys.
       Finalize stable/experimental status, browser/AT support, private security contact,
       response ownership, support windows, release cadence, rollback/hotfix policy
       and package version alignment. Decide the Figma/token synchronization scope.
       Exit: public website/documentation journeys and link gates pass, public claims
       match tested support, remaining risks have explicit owners and dispositions,
       and release/support procedures are usable and reviewed.

   Current machine disposition: the fresh audit has zero critical occurrences,
   zero publishable production/optional paths and zero unaccepted high/critical
   paths, so the dependency-risk gate passes. Linux proof credits exactly 14
   development-only `extract-zip` paths as locally patched without removing the
   sole raw high finding.
   Public source claims, local docs build, mounted-base links, and eight local
   landing/docs journeys in each installed engine pass. Unified staged-application,
   deployed/external route validation and owner review remain open.

8. [ ] **Independent release-candidate gates and competitor re-review
       (Section 8).** After Sections 1 through 7 are accepted, complete two independent
       full candidate runs from frozen source/lock and retained packed artifacts.
       Include the framework, accessibility, SSR, localization, visual, performance,
       package and documentation evidence, not just today's baseline suites.
       Re-review Fluid against current Web Awesome and Spectrum Web Components using
       primary sources and matched scenarios; label unknown or unmeasured dimensions
       explicitly. Exit: an evidence-backed comparison, no unresolved release blockers,
       and the owner's final readiness decision. Publication remains separately
       authorized; this plan does not authorize it.

The order above prioritizes known gaps. Security triage, reviewer scheduling and
documentation can proceed alongside isolated engineering slices where files and
evidence do not conflict. Visual-history collection should start once its platform
and baselines are approved, rather than waiting until the final candidate.

### Owner decisions and human gates

These do not block starting the next engineering slice, but they do block the
associated acceptance or final release decision.

- [ ] Accept Section 1's evidence and proposed stable-candidate cohort.
- [ ] Assign manual accessibility reviewers and required hardware/browser access.
- [ ] Assign fluent nl/de/fr/es/ar reviewers and ongoing translation ownership.
- [ ] Choose the canonical visual platform and approve proposed image baselines.
- [ ] Confirm security contacts, responders, support policy and any bounded risk
      acceptance. Do not treat an unresolved advisory as implicitly waived.
- [ ] Decide whether a complete Figma component library blocks 1.0 or is a
      separately owned track alongside token synchronization.
- [ ] Review each completed section and make the final release/maturity decision.

### Next task and operating limits

1. Read this continuation block, HANDOFF and the native-focus review. Inspect
   branch/HEAD and dirty changes; do not switch, reset, commit or discard anything.
2. Read the applicable component-authoring/accessibility instructions. Inspect
   date-range-picker and the existing SSR form-focus generator, browser tests and
   client fixture. Add the missing typeable/non-typeable range-selection policy
   contract first, then fix only
   any reproduced defect. Preserve failure evidence when a defect is found.
3. Run the focused component and three-engine client/DSD checks, with causal
   negative controls for any new gate. Record scope, result and normal teardown;
   then select the next unchecked control as a separate bounded slice.
4. The dedicated `fluid-readiness-linux-20260826` container is retained and was
   restarted for this slice. Check the handoff for its latest running/stopped state.
   Before reuse, verify its identity, pinned runtime and source/lock snapshot
   against the host. Run one heavy browser/Docker verification job at a time.
   Freeze shared edits before coordinated gates; any delegated work needs
   non-overlapping file ownership.
5. Use focused checks while iterating and a coordinated full checkpoint after a
   coherent implementation batch. Retain failing and passing artifacts; never
   lower thresholds, weaken assertions or increase retries to manufacture a pass.
   Do not rerun the entire workspace for planning-only documentation changes.

The original section estimates below describe the programme, not a forecast of
remaining hours. Re-estimate each bounded slice after inspecting its current
contracts, separating engineering time, machine runtime and human/history waits.
No precise overall completion percentage or promise to finish tomorrow is made.
The later 15-to-30-day conversational estimate did not adequately scope a full
website refresh. The owner has now explicitly included website and documentation
readiness; audit its bounded backlog and revise the estimate before treating that
range as covering the expanded work.
Update this checklist and the handoff after each meaningful checkpoint.

## Historical implementation checkpoints

Section 2 execution started at the owner's instruction on 2026-08-26. Its first
slice repairs the 13 absent accessibility fixtures and adds regression tests for
fixture selection and browser presence. This does not imply section completion.
All 155 catalog audits now pass with presence and upgrade checks, plus six browser
guard tests, eight native keyboard regressions, and nine generator tests. Seven
additional verified contracts across the first three slices bring interaction
attribution to 71/103 (68.9 percent), with 32 applicable gaps; catalog-wide
attribution is 71/155 (45.8 percent). The systematic passing-story navigation
retries are fixed: the latest 71-contract run logs zero retries, and a separate
runner regression proves consecutive execution and failure detection. Manual
tabs and menu keyboard defects discovered by the new contracts are also fixed.
See the [first slice](../../quality/baselines/2026-08-26-section-2.md) and
[follow-up evidence](../../quality/baselines/2026-08-26-section-2-follow-up.md), and
[option/tree evidence](../../quality/baselines/2026-08-26-section-2-option-tree.md).
The latter closes reproduced tree selection/focus and select active-option
defects. External Google Fonts loading caused a separately retained failed run;
CERT-017 tracks deterministic Storybook assets. Local fonts are now joined by
inline/local AspectRatio, Lightbox and Map assets, and animated Chart fixtures
advance to their final frame through a fail-closed live-instance guard. The
machine controls pass, but accepted-image review remains open.

Later parallel implementation replaces that checkpoint: all 102 applicable
elements now have passing built contracts, 102/155 catalog-wide (65.8 percent).
The first complete run passed 96 and failed six; those integration failures
were corrected and the subsequent full contract run passes 102 without retries.
The policy floor is now 102. Mosaic was reclassified as a layout
helper after source inspection, reducing 103 to 102 without adding a covered
interaction. All 155 catalog axe audits pass in Chromium, Firefox and WebKit;
native interaction failures and Windows WebKit platform limits remain open.
See the [parallel integration evidence](../../quality/baselines/2026-08-26-section-2-parallel.md).
Local fonts now replace external font requests, with offline-loading tests in
all three engines and unchanged primary-button snapshots in five modes. Full
visual review and stability history remain open.

The next-section audits found gaps that coverage counts do not capture:
native-state restoration omitted host/submitted form values, hydration tests
did not assert retained server nodes, and locale lookup stopped at shadow roots.
SSR fixes and negative controls pass 36 browser cases and 162 targeted unit
executions across three engines, with input/checkbox adapters only. Named
render-cycle warning debt remains open. Five more native focus fixes pass another
36 client/DSD browser cases and 384 targeted units, covering 6/16 required controls;
the combined 72-case SSR run passes assertions but fails teardown. Shadow-context localization
and the initial validation/truncate migration pass 312 targeted tests across
three engines. Seven more core form components pass 630 targeted localization
executions (210 per engine), after 89 new regressions failed before implementation.
Packed React now passes 21 production CSR browser checks across three engines,
including teardown, following an independently reproduced Firefox form-focus failure.
An exact frozen React replay also passes 21/21 with identical source, lock and
tarball hashes, using strict peers in a different directory on Windows/Node 22.
Other framework runtime/SSR contracts, cross-platform replay and CEM-derived event
payload types remain open. A built documentation link gate fixes 13 broken links
and now passes all 24,214 local links across 136 pages; external URLs are not checked.
These bounded fixes are not completion of Sections 4 or 5.

Sixteen further tags have localized defaults, with 359 tests passing separately
in each engine (1,077 executions). A combined assertion pass still failed shutdown.
The wider source-stable workspace checkpoint also fails: Firefox exposes a corrupt
image fixture and a detached-keyboard-command race risk; WebKit chart teardown
hangs even in a single-engine process. The image repair passes 33 targeted tests.
The command-ownership repair passes 315 targeted executions and 11 guards.
Teardown hardening remains active, not a passing integrated gate.
The SSR helper adds 78 edge-case executions and animation/map entry assets add 51. Fresh runtime-file-complete coverage fails in supervisor cleanup (CERT-039),
not component assertions. The combined 72-case SSR run passes assertions but
fails independent Playwright teardown at its unchanged deadline (CERT-032).
Neither is a passing production gate. The signature Storybook contract now rejects an actually executed no-op;
this improves behavioral depth without increasing attributed component coverage.

Canonical manifests now cover all 14 component packages and generate 155 React
wrappers. Twenty-one of 166 event mappings carry verified public payload types; 145
remain unknown. Actual tarballs pass canonical-manifest checks for all 14
packages and 155 elements, including 352 referenced source modules in the latest
21-typed-event archive check. This is
archive contents verification, not complete installed-framework runtime or
source/built-module equivalence. The expanded Node gate passes 1,903 isolated
published-JS target imports and 155 catalog renders. Native SSR ancestor language
still fails all five locale probes. Remaining strings and formatter context are
tracked in the [localization audit](../reviews/localization-remaining-2026-08-26.md).

The four-formatter follow-up now passes 136 cases separately in each engine,
including clean exits, after 72 pre-fix failures. Translation method arguments
also have strict tuple types with passing negative compiler controls. The fresh
102-contract Storybook rerun passes after signature strengthening and host-label
changes. Supervisor safety repairs pass temporal ancestry, stable-handle and
lifecycle controls plus an actual clean media run; the historical wrong-process
termination stays recorded. Fresh whole-workspace coverage remains required.
The latest fifteen typed event mappings pass static and actual-manifest packaging
checks, but their browser payload/replay gates are not yet credited. None of these
bounded results signs off a section or substitutes for human certification.

The next three-control SSR focus slice passes 18 cases in all three engines with
source-stable fingerprints and normal exit, plus 89 targeted Chromium units.
It covers required/custom validity, real submitted values, locale changes,
reset and retained DSD nodes for masked-input/select/time-picker. New render-cycle
warnings were fixed causally, not added to the allowlist. Required-focus coverage
is now 9/16, while pre-hydration restoration adapters remain input/checkbox only.
The full 90-case SSR integration now passes on pinned Linux across all three
engines with normal exit and unchanged source. The all-engine unit checkpoint
and Windows teardown investigation remain open. See the
[Linux evidence](../reviews/linux-verification-2026-08-26.md).

Countdown and tour now use eight additional typed translation terms. Their
106-case suite passes separately in Chromium, Firefox and WebKit (318 executions,
normal exits and unchanged source fingerprints). New negative tests also exposed
and fixed countdown completion/reconnection/initialization defects. Fluent
translation review and remaining internal strings are still open. A dedicated
Linux Docker verification environment is now authorized and provisioned; its
baseline native safety and 90-case SSR gates now pass; the newer watchdog and
remaining integrated gates require their own evidence.

The Section 1 applicability audit corrected the interaction baseline to 64/103
(62.1 percent), with 39 gaps. Catalog-wide attribution remains 64/155 (41.3
percent). Interactive children, chart interaction, keyboard scrolling, and the
truncate disclosure had been excluded. See
`docs/reviews/interaction-classification-audit-2026-08-26.md` for the rationale.

The baseline and exact command index are in
[`quality/baselines/2026-08-26.md`](../../quality/baselines/2026-08-26.md).
The [defect register](../../quality/defects.md) records the gaps that later
sections must close, including false-positive fixtures and benchmark validity.

The proposed first stable cohort is defined in `quality/certification-scope.json`:
59 core elements, with 65 remaining core elements and 31 expansion elements
retaining their existing maturity labels. This is a certification target, not a
promotion. The original 18-gap effort estimate predates the corrected scope and
will be refined from Section 1 evidence.

## Implementation status, 2026-08-25

Historical implementation snapshot, not current certification. The 2026-08-26
baseline corrected false-positive fixtures, applicability counts and benchmark
claims, and reproduced a packed-consumer failure. Consult the current status
and defect register above before relying on the following original claims or
competitive grades.

The program is active on the current work branch. The following gates now exist and have
passed locally:

- A generated inventory covers 155 published elements in 14 component packages.
- All 155 elements have unit accessibility, browser accessibility, visual, and SSR fixtures.
- Browser-native code coverage is measured for 14 packages with per-package ratchets and
  HTML plus JSON reports. Core currently measures 95.78 percent statements and lines,
  83.84 percent branches, and 83.75 percent functions.
- Catalog SSR renders every element and the browser gate hydrates all 155 elements, checks
  console and page errors, preserves pre-hydration form state, and reloads deterministically.
- Dutch, German, French, Spanish, Arabic, expanded LTR, and mirrored RTL locale packs ship
  with reactive locale tests and Storybook locale controls.
- React 19 wrappers and JSX types are generated for all 155 elements. React, Next.js,
  Vue, Angular, Astro, and SvelteKit consumer fixtures typecheck and build.
- A clean tarball consumer verifies all 18 publishable packages outside the workspace,
  including runtime imports and declaration-file typechecking.
- The framework-contract workflow copies each supported consumer into a clean temporary
  project, replaces workspace dependencies with packed tarballs, then typechecks and builds it.
- Storybook has 64 passing browser interaction contracts covering 64 of the 82 elements
  explicitly classified as interactive or composite, and 64 of all 155 published elements.
  The remaining 18 applicable elements are reported as an
  open depth gap, and the passing count is protected by a non-decreasing quality ratchet.
- Bundle, SSR, browser definition, bulk creation, updates, hydration, locale switching, and
  lifecycle heap growth have explicit performance budgets.
- Public SSR, localization, support, governance, maturity, framework, and design-tooling
  documentation has been brought in line with executable behavior.
- A second competitive review against Web Awesome and Spectrum Web Components now grades the
  engineering foundation A- and production readiness B+. The remaining work is concentrated in
  certification depth rather than missing architecture. See
  `docs/reviews/competitive-review-2026-08-25.md`.

Remaining production-certification work is tracked below. The largest open areas are manual
assistive-technology sign-off, broader interaction depth, browser runtime smoke tests for every
supported framework, deeper expansion-package performance cases, visual flake history, locale
review by fluent speakers, and two complete release-candidate runs.

## Purpose

This plan closes the remaining gap between Fluid's strong component catalog and
the system-level maturity expected from a production component library. It
covers accessibility, behavioral tests, server-side rendering and hydration,
localization, framework integration, Storybook interactions, visual regression,
performance benchmarking, documentation accuracy, and release governance.

The goal is not to maximize test counts. The goal is to make every supported
contract observable, reproducible, and enforced in CI.

## Original review baseline (before implementation)

The current working tree already contains substantial foundations:

- 103 core component families and 125 core custom elements.
- 13 expansion packages with 30 registration entries.
- 104 component-level core test files plus internal utility tests.
- 90 core component test files with an automated accessibility audit.
- 1,100 core behavioral test cases.
- A Node SSR gate that checks guarded definitions, imports built entries, and
  renders declarative shadow DOM for representative components.
- A reactive localization registry with English fallback, regional fallback,
  dynamic registration, nearest-context language resolution, and RTL direction
  support.
- A Playwright visual-regression application with 52 generated specs and 142
  committed Chromium snapshots.
- Storybook with a11y, interactions, themes, pseudo states, status, and HTML
  addons.
- 125 story files, of which one currently contains a `play` interaction.
- A full verify pipeline for types, lint, catalog coverage, tokens, unit tests,
  builds, and SSR import safety.

Known infrastructure gaps:

- Fourteen rendered or behavior-oriented core test files do not yet contain an
  accessibility audit. Non-rendering utilities need explicit exemptions rather
  than silent omission.
- Expansion-package accessibility coverage is inconsistent.
- There is no dedicated Playwright accessibility suite that scans real browser
  pages after interaction.
- SSR verification does not yet hydrate the whole catalog in browsers.
- Only English is bundled and the public term catalog is still small.
- Framework examples exist, but generated framework bindings and installed
  package contract tests do not.
- Storybook interaction coverage is nearly empty.
- Visual coverage is partial, mostly default/light-state coverage, and existing
  snapshot names show developer-platform coupling while CI runs on Linux.
- There are no repeatable bundle, runtime, memory, SSR, or hydration benchmarks.
- The SSR documentation describes behavior that the current implementation has
  already superseded.
- Localization exists in the package README but not as a complete documentation
  section.
- The docs build is not part of the root `verify` command.

## Production-ready definition

Fluid is production-ready when all of the following are true:

1. Every published component has an explicit maturity status and a documented
   support contract.
2. Every eligible rendered component has automated accessibility coverage in
   unit tests and in a dedicated browser-level accessibility suite.
3. Every interactive component has tested keyboard, pointer, focus, event, and
   disabled behavior for its supported states.
4. Every supported component can be server-rendered and hydrated without page,
   console, registration, or hydration errors.
5. Shipped locales have complete translation-key parity, and RTL behavior is
   tested structurally, interactively, and visually.
6. Supported frameworks are tested against packed, installable artifacts rather
   than workspace source imports.
7. Stable components have representative Storybook interaction tests and visual
   baselines for their critical states.
8. Bundle, render, update, hydration, and memory budgets are measured and gated.
9. Documentation claims, examples, framework recipes, and public API tables are
   generated or executable wherever practical.
10. The release candidate has no open P0 or P1 defects, all required CI gates are
    green, and required manual accessibility checks have been recorded.

## Guiding rules

- Keep unit, browser integration, visual, and performance tests separate. They
  answer different questions and should fail with different diagnostics.
- Generate inventories from the Custom Elements Manifest and Storybook index.
  Do not maintain parallel hand-written lists of 125 elements.
- Test meaningful states, not every Cartesian combination of properties.
- Run a fast deterministic subset on pull requests and broader matrices on main
  and scheduled builds.
- Do not permit permanent unowned skips. Every skip requires a reason, issue,
  owner, and expiry or review date.
- Treat expansion packages as first-class published products. Their maturity
  gates may be `experimental`, but their stated contracts still need tests.
- Prefer relative performance budgets established from controlled baselines.
  Absolute timing budgets are added only where the CI environment is stable.
- A generated count in documentation is preferable to a hardcoded count that
  will drift.

## Program structure

The work is split into eleven workstreams. They are sequenced into phases later
in this document, but several can proceed in parallel after the shared inventory
and fixture format exist.

## PR-01: Shared quality inventory and fixture contract

### Deliverables

- Add a machine-readable component quality manifest generated from the Custom
  Elements Manifest, package metadata, and story metadata.
- Record, per custom element:
  - package and family;
  - maturity status;
  - minimal valid fixture;
  - meaningful interactive states;
  - form-associated status;
  - SSR eligibility and any deterministic server fixture requirements;
  - localization and RTL relevance;
  - required accessibility, interaction, and visual scenarios;
  - benchmark tier;
  - documented exceptions.
- Extend `check:coverage` or add `check:quality-manifest` so every published
  element appears exactly once.
- Generate summary reports for missing unit, a11y, interaction, SSR, visual, and
  documentation coverage.
- Define P0, P1, P2, and P3 defect severity and CI blocking behavior.

### Acceptance criteria

- Adding a new published custom element without quality metadata fails CI.
- Renaming or removing an element cannot leave an orphan quality entry.
- All later suites consume the same fixture identifiers.
- The report distinguishes a supported scenario, a temporary skip, and a valid
  non-rendering exemption.

## PR-02: Behavioral test depth and code coverage

### Deliverables

- Introduce browser-native code coverage for core and every expansion package.
- Publish HTML and machine-readable coverage artifacts per package.
- Establish initial package thresholds after measuring the real baseline.
- Raise thresholds incrementally toward these 1.0 targets:
  - statements: 90 percent;
  - lines: 90 percent;
  - functions: 90 percent;
  - branches: 85 percent;
  - forms, overlays, localization, and SSR helpers: 95 percent for statements,
    lines, and functions, with 90 percent branches.
- Build a public-contract test matrix for every component:
  - construction and first render;
  - documented defaults and reflected attributes;
  - public properties and methods;
  - documented custom events, including payload and timing;
  - keyboard and pointer behavior;
  - focus entry, movement, restoration, and trapping where applicable;
  - disabled, readonly, loading, invalid, open, selected, and empty states;
  - slot changes and dynamic children;
  - disconnect, reconnect, observer teardown, and pending async work;
  - form association, reset, disabled propagation, restore, submission, and
    custom validity for form controls;
  - security boundaries for HTML, URLs, fetched content, files, and markdown.
- Add regression tests for every production defect fixed during the program.
- Add a small mutation-testing pilot for high-risk pure logic such as form
  validity, date calculations, positioning, localization fallback, parsers, and
  scheduler algorithms. Expand it only if signal justifies runtime cost.
- Add `test:changed`, `test:unit`, `test:all`, and coverage scripts with clear
  local and CI responsibilities.

### Acceptance criteria

- Every stable component has tests for every documented event and keyboard
  interaction.
- Coverage cannot fall below the ratcheted baseline on a pull request.
- Critical internal helpers meet the higher 1.0 threshold.
- Tests verify observable contracts rather than implementation-private markup,
  except where shadow structure itself is a public CSS-part contract.
- CI publishes useful coverage reports on failure.

## PR-03: Accessibility program

### Unit-level accessibility

- Add an accessibility audit to every eligible core component test file.
- Resolve the current fourteen missing core files:
  - animation;
  - dialog;
  - drawer;
  - dropdown;
  - include;
  - intersection observer;
  - mutation observer;
  - popover;
  - popup;
  - relative time;
  - resize observer;
  - option;
  - signature pad;
  - toast.
- Where a utility has no meaningful rendered UI, record a checked exemption and
  test the UI it affects through its consumer fixture.
- Require audits for meaningful closed/open, valid/invalid, populated/empty, and
  enabled/disabled states rather than only a default state.
- Bring expansion packages to the same policy. Current gaps in animations,
  charts, markdown, parts of media, and parser need explicit treatment.

### Dedicated Playwright accessibility application

- Add a dedicated browser-level a11y test application and Playwright config.
- Use axe against the built Storybook or dedicated fixture pages after custom
  elements settle and after scenario interactions complete.
- Capture DOM snapshots, axe results, console messages, and traces on failure.
- Test these modes where relevant:
  - default and dark color scheme;
  - forced colors;
  - reduced motion;
  - LTR and RTL;
  - 200 percent zoom/reflow viewport;
  - keyboard-only interaction;
  - open overlays and validation messages.
- Run Chromium for the pull-request gate and Chromium, Firefox, and WebKit on
  main or a scheduled build.
- Fail on critical and serious violations. Moderate findings require explicit
  triage and may not become an unbounded ignore list.
- Add keyboard smoke helpers for tab order, focus visibility, Escape behavior,
  arrow-key models, focus restoration, and disabled-item exclusion.
- Add test helpers for accessible names, descriptions, roles, live-region
  announcements, and target size.

### Manual accessibility verification

- Publish a repeatable manual checklist for stable interactive components.
- Define supported assistive-technology combinations, initially:
  - NVDA with Chrome and Firefox on Windows;
  - VoiceOver with Safari on macOS;
  - VoiceOver with Safari on iOS for touch-critical controls.
- Require manual checks for dialogs, menus, selects, combobox/typeahead, trees,
  tabs, date and time controls, tables, node graph, scheduler, editor, and all
  form controls before stable status.
- Store dated results and known limitations in the repository.

### Acceptance criteria

- One hundred percent of eligible stable components have unit and browser a11y
  audits for their critical states.
- No untriaged critical or serious axe violations remain.
- Keyboard smoke tests cover every stable interactive component.
- Required manual screen-reader checks are recorded for the release candidate.
- The public browser and assistive-technology support policy matches what CI and
  the manual matrix actually test.

## PR-04: SSR and hydration at or beyond Web Awesome

### Define the supported SSR contracts

Document and separately test four modes:

1. Plain server HTML containing unregistered `fluid-*` tags.
2. Node import safety for package roots, class entries, and definition entries.
3. Lit server rendering with declarative shadow DOM.
4. Browser hydration of declarative shadow DOM using the public client entry.

### Catalog-wide server rendering

- Generate a deterministic SSR fixture for every published element from the
  shared quality manifest.
- Render every eligible fixture through Lit SSR.
- Assert valid declarative shadow DOM, expected light-DOM preservation, stable
  attributes, no browser-global access, and no accidental custom-element
  registration on the server.
- Give browser-oriented components such as maps and media deterministic server
  placeholders rather than exempting them from the SSR contract.
- Test nested components, slots, forms, translated terms, RTL, themes, and
  expansion-package imports.
- Test streamed/chunked output, repeated rendering, and concurrent requests to
  catch request-global state leaks.
- Verify server output is deterministic across repeated runs.

### Catalog-wide browser hydration

- Add a Playwright hydration crawler inspired by, and stricter than, Web
  Awesome's current check.
- For every fixture:
  - load server-rendered markup before registration;
  - capture page and console errors;
  - load definitions and the hydration client;
  - wait for all nested custom elements and Lit updates;
  - assert that hydration completes without mismatch or fallback rendering;
  - assert there is exactly one shadow root and no duplicated content;
  - run the component's post-hydration interaction smoke test;
  - reload and repeat to expose timing and cached-module failures.
- Test preservation of authored and user-modified state:
  - input values, selection, checked state, and files where browser APIs allow;
  - open/closed state where restoration is part of the contract;
  - focus and active descendant;
  - locale and direction;
  - slotted and dynamically inserted content.
- Run Chromium on pull requests and all three browser engines on main or a
  scheduled build.
- Treat hydration warnings as failures, not only thrown exceptions.

### Framework SSR fixtures

- Add minimal installed-package fixtures for:
  - Next.js App Router with React server and client components;
  - Astro with islands;
  - SvelteKit with SSR enabled.
- Add Nuxt and Remix after the core three are stable, or classify them as
  documented community integrations for 1.0.
- Build, start, render, hydrate, interact, reload, and inspect each fixture in
  CI.
- Test both per-component registration and a documented loader path.
- Pack workspace packages into tarballs and install those tarballs in fixtures
  so source-only workspace behavior cannot hide publishing defects.

### SSR performance and resilience

- Benchmark render throughput, rendered bytes, time to definition, hydration
  duration, and post-hydration interaction readiness.
- Test aborts, slow dynamic imports, multiple components registering at once,
  and hydration under a strict Content Security Policy.
- Ensure request-specific locale or theme state never leaks between renders.

### Acceptance criteria

- Every published stable component has a deterministic SSR and hydration
  fixture.
- Catalog-wide hydration produces zero page errors, console errors, hydration
  warnings, duplicate shadow roots, or unexpected client rerenders.
- Next.js, Astro, and SvelteKit build and pass browser interaction tests using
  packed Fluid artifacts.
- Forms retain pre-hydration user values and remain form-associated afterward.
- SSR and hydration are required CI gates for stable components.

## PR-05: Localization and RTL as a product

### Translation architecture

- Audit all user-facing strings in core and expansion packages.
- Expand the translation contract to cover labels, validation, dates, time,
  tables, pagination, uploads, media, editor, scheduler, kanban, maps, charts,
  parser, node graph, and dynamic announcements.
- Separate reusable platform terms from component-specific terms while keeping
  one typed public registration surface.
- Preserve English fallback and regional fallback.
- Ensure shipped dictionaries have complete key parity at compile time.
- Allow consumer dictionaries to extend or partially override a locale without
  weakening completeness checks for official locale packs.
- Export each locale through a tree-shakable subpath and support dynamic import.
- Define a formatter context for plural rules, number/date/time formatting,
  list formatting, and parameterized messages using platform `Intl` APIs.
- Add development-only diagnostics for missing terms, invalid locale codes, and
  formatter failures.
- Confirm localization state is request-safe under SSR.

### Official locale packs

- Ship complete reviewed packs for:
  - English (`en`);
  - Dutch (`nl`);
  - German (`de`);
  - French (`fr`);
  - Spanish (`es`);
  - Arabic (`ar`).
- Add pseudo-locales:
  - expanded/accented LTR to expose clipping and hardcoded strings;
  - mirrored RTL to expose physical layout and direction assumptions.
- Require language review by a fluent speaker before marking a locale stable.

### RTL and locale testing

- Test live language switching without reconnecting components.
- Test nearest nested language and direction contexts.
- Test regional fallback and late dynamic registration.
- Test keyboard behavior where visual direction affects Left/Right semantics.
- Add RTL interaction and visual scenarios for navigation, overlays, carousels,
  tabs, sliders, ranges, date/time controls, tables, scheduler, editor, kanban,
  and node graph.
- Add pseudo-locale Storybook globals and use them in a11y and visual suites.
- Add a CI string-literal scanner with a narrow reviewed allowlist to detect new
  hardcoded user-facing text.

### Documentation

- Add a first-class localization and RTL guide.
- Document bundled locales, dynamic imports, custom translations, partial
  overrides, nested locales, direction, SSR usage, and application-i18n
  boundaries.
- Add live locale switching and RTL examples.

### Acceptance criteria

- All official dictionaries have complete compile-time key parity.
- No known user-facing internal English string bypasses the registry without a
  documented reason.
- `nl`, `de`, `fr`, `es`, and `ar` pass unit, SSR, hydration, a11y, interaction,
  and representative visual tests.
- Locale changes are reactive and do not leak across SSR requests.
- Stable components render correctly under both pseudo-locales.

## PR-06: Framework developer experience

### Generated integrations

- Generate integrations from the Custom Elements Manifest rather than
  hand-maintaining 125 wrappers.
- Publish a React package or split React packages that provide:
  - React 19-compatible component exports;
  - typed properties and methods;
  - typed `fluid-*` custom-event props;
  - ref forwarding;
  - correct boolean, object, array, and form-value handling;
  - server-safe module imports.
- Publish or generate framework metadata for:
  - Vue custom-element recognition and event typing;
  - Angular element schemas/directives and event typing;
  - Svelte element and event typings;
  - JSX intrinsic elements for consumers that want raw custom elements.
- Keep wrappers thin and generated. Component behavior remains in the custom
  element implementation.

### Framework contract fixtures

- Maintain small consumer applications for React, Next.js, Vue, Nuxt, Angular,
  Svelte, SvelteKit, Astro, and plain TypeScript.
- Define a required 1.0 support matrix. At minimum, fully gate:
  - plain HTML/TypeScript;
  - React 19;
  - Next.js;
  - Vue 3;
  - Angular;
  - Svelte/SvelteKit;
  - Astro.
- Install packed package tarballs in every fixture.
- Test registration, properties, custom events, forms, slots, lazy loading,
  types, production builds, and framework SSR where applicable.
- Add compile-only tests for framework types and browser interaction smoke tests
  for runtime behavior.
- Test Content Security Policy-friendly loading and bundler tree-shaking.

### Package quality

- Add packed-artifact checks for exports, types, side effects, files, source
  maps, license, README, CEM, and dependency declarations.
- Add a bundle graph check proving that one component import does not pull the
  full icon catalog or unrelated components.
- Set bundle-size budgets for representative imports and generated wrappers.

### Acceptance criteria

- Supported framework fixtures build and test only against packed artifacts.
- Framework-specific event and property typing works without consumer-authored
  global declarations.
- React wrappers are generated deterministically from the CEM.
- Per-component imports remain tree-shakable in every supported bundler fixture.
- Framework documentation is linked directly to executable fixtures.

## PR-07: Storybook interaction testing

### Deliverables

- Classify stories as presentational, interactive, integration, visual-only, or
  documentation-only.
- Add `play` interactions to every stable interactive component, prioritizing:
  - forms and validation;
  - dialogs, drawers, popovers, dropdowns, menus, tooltips, and toasts;
  - tabs, trees, navigation, carousel, tour, and command palette;
  - date/time, typeahead, select, transfer, upload, and signature controls;
  - table, scheduler, editor, kanban, map, parser, and node graph.
- Verify user-visible behavior through accessibility queries rather than shadow
  DOM selectors where possible.
- Assert events, accessible state, keyboard movement, focus restoration, form
  submission, and dynamic content.
- Run Storybook interaction tests against the built Storybook in CI.
- Add a coverage gate: an interactive stable component must have at least one
  successful interaction scenario and all critical interaction modes listed in
  its quality manifest.
- Reuse interaction drivers in hydration, a11y, and visual suites where the
  runner boundaries allow it. Keep assertions local to each suite.

### Acceptance criteria

- Every stable interactive component has Storybook interaction coverage.
- All required scenarios are discoverable from the generated quality report.
- Interaction tests run on pull requests and publish traces on failure.
- Presentational components are explicitly classified rather than appearing as
  missing coverage.

## PR-08: Visual-regression hardening

### Stabilize the existing system

- Choose one canonical baseline platform, preferably a pinned Linux container
  identical locally and in CI.
- Regenerate baselines on that platform and remove developer-OS coupling.
- Pin browser versions through the lockfile/container and record them in reports.
- Add font readiness, image readiness, Lit update completion, and nested custom
  element settlement before screenshots.
- Disable or deterministically control animations, clocks, random values,
  network requests, maps, and media.
- Replace broad percentage tolerance with the lowest demonstrated stable
  tolerance. Permit per-scenario exceptions only with a recorded reason.

### Expand coverage

- Cover every stable component and expansion-package component.
- Screenshot critical states, not just default stories:
  - hover, active, focus-visible, disabled, loading, invalid, selected, open;
  - empty, populated, overflow, long translated text, and error states;
  - overlays after positioning and collision handling;
  - form controls with labels, help text, and validation;
  - responsive layouts at narrow and wide viewports.
- Apply a curated environment matrix:
  - all stable components in default light/LTR;
  - all color-sensitive components in dark mode;
  - all directional components in RTL;
  - all motion components under reduced motion;
  - all native-control and focus-critical components under forced colors;
  - representative components under every Fluid brand.
- Avoid multiplying every component by every axis. The quality manifest defines
  which axes are relevant.
- Add visual diff artifacts and an intentional-baseline update workflow that
  cannot silently approve unexpected output.

### Acceptance criteria

- Every stable component has at least one canonical visual baseline.
- Critical states and relevant environment axes are covered.
- Baselines reproduce locally and in CI through the same pinned environment.
- The suite has an observed flake rate below one percent over 50 consecutive
  runs before it becomes a required 1.0 gate.
- Baseline updates are explicit and reviewable.

## PR-09: Performance and bundle benchmarking

### Bundle benchmarks

- Measure minified and compressed size for:
  - one simple component;
  - one form control;
  - one overlay;
  - one complex core component;
  - each expansion package entry;
  - all-core and all-package loader paths;
  - generated framework wrappers.
- Capture module counts and duplicate runtime dependencies.
- Add budgets that prevent unrelated component or icon leakage.
- Store a machine-readable baseline and post pull-request comparisons as CI
  artifacts or comments.

### Runtime benchmarks

- Build deterministic browser benchmarks for representative tiers:
  - definition/import time;
  - upgrade and first render;
  - bulk creation of 100 and 1,000 lightweight elements;
  - property update and rerender;
  - overlay open and reposition;
  - table render, sort, virtual scroll, and append;
  - chart render/update;
  - scheduler layout;
  - editor input;
  - node-graph pan/zoom/connect;
  - localization switch across many components.
- Measure median and tail latency over repeated runs after warm-up.
- Add memory and lifecycle tests that create, connect, disconnect, and release
  many elements. Track detached nodes, listeners, observers, and heap growth.

### SSR benchmarks

- Measure server render throughput and output bytes for simple, form, overlay,
  complex, and page-level fixtures.
- Measure hydration duration and time to first successful interaction.
- Test concurrent request rendering for contention or leaked global state.

### CI strategy

- Run bundle budgets and a small deterministic runtime smoke benchmark on pull
  requests.
- Run the full browser, memory, and SSR suite on main and on a schedule in a
  pinned environment.
- Begin with reporting-only baselines, then ratchet to blocking budgets after
  variance is understood.
- Require an explicit performance note for an intentional budget increase.

### Acceptance criteria

- Representative imports have explicit bundle budgets.
- No stable component change can accidentally import the entire component or
  icon catalog.
- Runtime, SSR, hydration, and memory trends are retained between runs.
- Blocking budgets have demonstrated stable variance and actionable failure
  output.
- Disconnect/reconnect stress tests show no sustained resource growth beyond a
  documented tolerance.

## PR-10: Documentation truth and executable examples

### Immediate drift corrections

- Rewrite the SSR guide around the current implementation:
  - guarded server imports;
  - plain custom-element HTML;
  - Lit declarative shadow DOM rendering;
  - the public hydration client entry;
  - registration timing;
  - framework SSR recipes;
  - state preservation and troubleshooting.
- Remove the obsolete claim that Fluid has not opted into declarative shadow
  DOM.
- Add the complete localization and RTL guide from PR-05.
- Document the distinction between import safety, server rendering, component
  definition, upgrade, and hydration.
- Publish the tested framework support matrix.

### Prevent future drift

- Add the docs build to the required CI/verify path when docs or public APIs
  change.
- Add internal-link and external-link validation.
- Compile or execute documentation code examples where practical.
- Source component counts, package versions, maturity status, API tables,
  events, slots, CSS parts, CSS properties, and support matrices from generated
  data.
- Link framework examples to the exact tested fixture source.
- Add documentation for:
  - accessibility support and known limitations;
  - browser policy;
  - testing philosophy;
  - visual and performance budgets;
  - security and trusted-content boundaries;
  - deprecation and migration policy;
  - release cadence and long-term support expectations.
- Add a documentation freshness check that flags generated sections changed by
  the CEM or quality manifest.

### Website and documentation readiness

Explicitly added to production-readiness scope at the owner's request on
26 August 2026. This is a required Section 7 deliverable, not optional post-release
polish. Start with a bounded audit of the landing website, documentation and their
linked Storybook, playground and demo destinations; record findings and effort
before implementation. An unrelated visual redesign is not implied.

- [ ] Update landing-page copy, capability claims, component/package counts,
      maturity labels and calls to action against `docs/FEATURES.md` and verified
      release evidence. Do not maintain competing claims across public surfaces.
- [ ] Update component/API documentation, installation instructions, examples,
      migration guidance and SSR/framework/localization guides to match supported
      behavior and actual package exports.
- [ ] Inventory and repair navigation, buttons, anchors, redirects, assets and
      links within and between the website, docs, Storybook, playground and demos.
      Check production base paths and direct-entry routes, not only development URLs.
- [ ] Extend link verification to separately built public applications and
      external destinations. The exact `0879c8b` root-mounted gate checks 26,043
      links; the earlier production `/docs` traversal checked 24,230. Neither covers
      the 572 external or separately
      built application links outside that gate. Inventory entries are not necessarily
      distinct URLs or defects.
      Record inaccessible or rate-limited destinations as unresolved, not successful;
      make every exclusion explicit and reviewable.
- [ ] Execute advertised examples and demos, including copyable installation
      and import recipes, and verify that cross-surface links reach the intended
      component/story rather than merely any page returning a successful status.
- [ ] Inspect the built website/docs in browsers at desktop and mobile sizes,
      checking keyboard navigation, visible focus, readable content, light/dark
      presentation and usable navigation. Retain findings and regression evidence.
- [ ] Automate main visitor journeys: landing page to installation and first
      component; component reference to its live story/demo; framework selection to
      the matching integration recipe; SSR/localization guidance and return navigation.
      Assert meaningful destination content and capture console/page errors.

Completion requires passing website/docs builds, link and executable-example
checks, retained browser walkthrough evidence and owner review of the public
experience. No known broken in-scope internal navigation or unresolved blocking
visitor-journey defect may remain. External checks need recorded results and
explicit dispositions for exceptions. A successful docs build alone is not
website acceptance. This authorizes readiness work, not deployment or publication.

### Acceptance criteria

- Documentation builds and link checks are required gates.
- Website/documentation readiness checks and the main visitor journeys pass;
  public-experience review is recorded, with all link exclusions disclosed.
- No SSR or localization statement contradicts executable tests.
- Every public code recipe either executes in CI or points to an executable
  fixture.
- Counts and maturity labels are generated, not duplicated manually.
- Known browser, framework, SSR, and accessibility limitations are public.

## PR-11: Release maturity and production certification

### Component maturity

- Define `experimental`, `beta`, `stable`, and `deprecated` requirements.
- Drive Storybook badges, docs badges, CEM metadata, and catalog filters from one
  maturity source.
- Require the following before `stable`:
  - complete public API documentation;
  - unit and code-coverage thresholds;
  - browser a11y and keyboard tests;
  - manual accessibility sign-off where required;
  - SSR and hydration coverage;
  - localization/RTL review where relevant;
  - Storybook interactions for interactive components;
  - visual baselines;
  - bundle and runtime budget assignment;
  - no open P0 or P1 defects.

### Public policies

- Publish:
  - browser and assistive-technology support;
  - supported framework versions;
  - SSR support contract;
  - semantic-versioning and deprecation policy;
  - security reporting and supported release policy;
  - governance, maintainers, and contribution expectations;
  - release cadence and changelog policy.
- Define how experimental expansion packages relate to the core 1.0 promise.

### Design-tooling track

- Export canonical design tokens in a Figma-compatible format.
- Define synchronization ownership between repository tokens and design files.
- Build or publish a Figma library for stable foundations and components.
- Record component variants and status in a way that maps to Storybook and code.
- Treat the hosted Figma asset and its access permissions as an external design
  deliverable, while keeping token export and drift validation in the repo.

### Release-candidate certification

- Pack and install all public packages in clean consumer fixtures.
- Run the full test, a11y, SSR, hydration, framework, interaction, visual,
  performance, docs, audit, and package-quality matrices.
- Run two release candidates through the complete process.
- Require:
  - no open P0 or P1 defects;
  - all required gates green;
  - visual flake rate below one percent over 50 runs;
  - no unexplained performance regression;
  - completed manual accessibility matrix;
  - reviewed locale packs;
  - current migration and release notes;
  - rollback and hotfix procedure documented.

### Acceptance criteria

- The same source of truth drives package, documentation, Storybook, and release
  maturity status.
- The public support policies match the automated and manual matrices.
- Packed-artifact consumer tests pass in a clean environment.
- The release checklist is reproducible by someone other than the original
  implementer.

## Delivery phases and dependencies

### Phase 0: Inventory and guardrails

Complete PR-01 first. Establish the shared manifest, fixture format, coverage
reports, severity model, and skip policy.

Exit gate:

- Every published element and package is represented.
- Current gaps can be generated as a report.
- Later suites can consume the same fixtures.

### Phase 1: Trust foundation

Run these in parallel after Phase 0:

- PR-02 behavioral tests and code coverage.
- PR-03 unit-level accessibility plus the first dedicated Playwright a11y gate.
- PR-10 immediate SSR documentation correction and docs-build CI gate.
- PR-08 canonical visual baseline environment.

Exit gate:

- No silent accessibility omissions for stable components.
- Code coverage is measured and ratcheted.
- Documentation no longer contradicts current SSR behavior.
- Visual baselines reproduce on the canonical platform.

### Phase 2: Platform hardening

Run PR-04 SSR/hydration and PR-05 localization/RTL in parallel. They share
fixtures and must integrate before either is considered complete.

Exit gate:

- Catalog-wide SSR and hydration pass in browsers.
- Official locale packs and pseudo-locales pass SSR, hydration, interaction,
  a11y, and representative visual tests.
- Next.js, Astro, and SvelteKit fixtures pass using packed artifacts.

### Phase 3: Consumer experience

Complete PR-06 framework DX and PR-07 Storybook interactions. Expand PR-03 and
PR-08 using the reusable interaction scenarios.

Exit gate:

- Supported frameworks have typed, installable, tested integrations.
- Every stable interactive component has a Storybook interaction scenario.
- Browser a11y and visual suites exercise post-interaction states.

### Phase 4: Performance and complete visual matrix

Complete PR-08 and PR-09 after functional behavior is stable enough that
baselines will not churn continuously.

Exit gate:

- All stable components have visual baselines and relevant environmental axes.
- Bundle, runtime, memory, SSR, and hydration baselines are retained.
- Stable performance budgets are blocking where variance permits.

### Phase 5: Production certification

Complete PR-10 and PR-11. Resolve remaining generated quality-report gaps and
run the full release-candidate process twice.

Exit gate:

- Every stable component meets its maturity contract.
- Public policies and docs reflect executable reality.
- No P0/P1 issues remain.
- Fluid 1.0 can be installed, built, rendered, hydrated, localized, tested, and
  upgraded through documented supported paths.

## CI topology

### Pull-request required gates

- format and lint;
- typecheck;
- token and quality-manifest checks;
- affected unit tests and ratcheted code coverage;
- core Chromium browser a11y;
- catalog SSR render and Chromium hydration;
- supported framework build and smoke fixtures for affected surfaces;
- Storybook interaction tests for affected stories;
- affected canonical visual snapshots;
- bundle budgets and performance smoke checks;
- package tarball contract tests;
- docs build, generated-content check, and link check.

### Main-branch gates

- full unit and coverage matrix across every package;
- full Storybook interactions;
- complete Chromium visual suite;
- all supported framework fixtures;
- full package audit and packed-consumer tests.

### Scheduled broad matrix

- Chromium, Firefox, and WebKit hydration;
- Chromium, Firefox, and WebKit browser a11y;
- full runtime, memory, SSR, and hydration benchmarks;
- dependency and supply-chain audit;
- external-link checks;
- flake-rate tracking and quarantine-expiry enforcement.

## Required program artifacts

- Generated quality dashboard or Markdown summary.
- Accessibility support matrix and manual-test records.
- SSR/hydration support matrix.
- Localization key and locale coverage report.
- Framework support matrix with fixture links.
- Storybook interaction coverage report.
- Visual scenario coverage report.
- Bundle and performance history.
- Component maturity manifest.
- Production release checklist.

## Risks and controls

### Runtime explosion

Risk: catalog size multiplied by browsers, themes, locales, viewports, and states
can make CI unusably slow.

Control: use manifest-driven relevant axes, affected pull-request tests, full
main/scheduled matrices, sharding, cached builds, and reusable fixture servers.

### Flaky visual and timing tests

Risk: fonts, animations, network calls, maps, media, clocks, and asynchronous
registration can create noisy failures.

Control: canonical container, pinned browser, deterministic data, readiness
helpers, frozen time, disabled motion, local assets, traces, and a measured
flake-rate gate.

### Test-count vanity

Risk: adding shallow cases increases totals without improving confidence.

Control: quality-manifest contracts, code/branch coverage, mutation sampling,
defect regressions, and behavioral acceptance criteria.

### Wrapper maintenance

Risk: manually maintained framework wrappers drift from the web components.

Control: generate from the CEM and verify clean deterministic output in CI.

### Translation correctness

Risk: type-complete dictionaries can still be linguistically wrong.

Control: pseudo-locales for engineering defects and fluent-speaker review for
official stable locale packs.

### Permanent exceptions

Risk: temporary skips become invisible permanent gaps.

Control: structured exceptions with issue, owner, reason, and review/expiry,
plus scheduled enforcement.

## Execution and sign-off plan

This is the operational checklist for the remainder of the program. The detailed
PR-01 through PR-11 requirements above remain the technical specification. These
eight sections are the units that are implemented, evidenced, reviewed, and
signed off.

A section is not complete because files or CI workflows exist. It is complete
only when its exit evidence has passed from a clean or documented environment,
remaining limitations are recorded, and the sign-off ledger is updated.

Status values:

- `awaiting approval`: scope has not yet been approved for implementation;
- `in progress`: implementation or verification is active;
- `approved, queued`: execution is approved, awaiting its dependencies and turn;
- `ready for sign-off`: exit evidence is complete and presented for review;
- `signed off`: accepted, with any limitations recorded;
- `reopened`: later evidence invalidated an earlier sign-off.

### Scope contract

- All 155 published elements must satisfy catalog-wide inventory, import,
  packaging, SSR, hydration, baseline accessibility, and visual-fixture
  requirements unless a reviewed exemption is structurally valid.
- All elements currently classified as interactive or composite must have at
  least one representative browser interaction contract. The classification is
  audited as the catalog evolves.
- Interaction depth is judged against documented behavior, not merely the
  presence of a `play` function.
- Only components that pass every stable-maturity requirement may be labeled
  stable. Expansion packages may ship as experimental when their limitations are
  public and their experimental contract is met.
- Counts are regenerated from the quality inventory. They are never used as a
  substitute for scenario quality or human review.

### Section 1: baseline, scope, and stable cohort

Status: ready for sign-off
Estimated focused engineering effort: 1 day

Work:

- Re-run and archive the current quality, coverage, package, SSR, hydration,
  accessibility, interaction, visual, framework, and performance baselines.
- Reconcile the published catalog and audit the interaction
  classification.
- Define the first stable cohort using product-critical primitives, forms,
  overlays, and navigation. Record all other elements as beta, experimental, or
  deprecated with an explicit reason.
- Create the evidence index and defect register used by every later section.
- Record exact browser, runtime, operating-system, and fixture versions.

Exit evidence:

- [x] The generated inventory has no unknown, duplicate, or silently omitted
      published elements.
- [x] Every element has one maturity classification and applicable quality axes.
- [x] The stable cohort and experimental-package boundary are documented.
- [x] Baseline results and known failures are reproducible and indexed.
- [ ] Section 1 is reviewed and signed off.

### Section 2: behavioral and Storybook interaction depth

Status: in progress  
Dependency: Section 1  
Estimated focused engineering effort: 5 to 10 days

Work:

- Repair the 13 false-positive accessibility fixtures without weakening the
  presence assertion; add generator and browser guard regression tests.
- Close the representative interaction gaps in the generated report. The
  Section 1 baseline had 39 gaps across 103 applicable elements. After the
  documented Mosaic classification correction and implementation, all 102
  applicable elements have passing representative contracts.
- Deepen stable-cohort scenarios for keyboard, pointer, focus, public events,
  validation, forms, disabled and readonly behavior, dynamic children,
  reconnect, and error states.
- Prioritize the complex remaining products: scheduler, event calendar, editor,
  parser, table, infinite table, kanban, map, node graph, and media controls.
- Add regression tests for defects found while exercising those flows.
- Raise code and branch ratchets only from measured, stable results.

Exit evidence:

- [x] Interaction classification has been re-audited after implementation.
- [x] All applicable elements have a passing representative interaction contract.
- [ ] Every stable interactive element has all documented critical modes tested.
- [ ] Tests assert public behavior and accessible state, not private markup alone.
- [x] Built-Storybook interaction runs pass without unexplained skips or flakes.
- [ ] Section 2 is reviewed and signed off.

### Section 3: accessibility and cross-browser certification

Status: in progress (automated matrix; manual certification pending)  
Dependency: Sections 1 and 2 for stable-cohort manual certification  
Estimated engineering effort: 4 to 7 days, plus access to required hardware and
assistive-technology reviewers

Work:

- Verify catalog accessibility fixtures after meaningful interactions and in
  dark mode, forced colors, reduced motion, RTL, zoom/reflow, and keyboard-only
  modes where applicable.
- Run the browser accessibility and hydration gates in Chromium, Firefox, and
  WebKit and resolve browser-specific failures.
- Complete manual stable-cohort checks for NVDA with Chrome and Firefox, and
  VoiceOver with Safari on macOS. Add iOS checks for touch-critical controls.
- Store tester, browser, assistive-technology version, result, defect, fix, and
  retest evidence.
- Publish supported combinations and known limitations.

Exit evidence:

- [ ] Automated serious and critical accessibility findings are zero.
- [ ] Moderate findings are fixed or have bounded, owned dispositions.
- [ ] Keyboard and focus contracts pass in all supported browser engines.
- [ ] Required manual assistive-technology records are complete for the stable
      cohort.
- [ ] Public accessibility claims match the recorded evidence.
- [ ] Section 3 is reviewed and signed off.

### Section 4: SSR, hydration, localization, and RTL hardening

Status: in progress  
Dependency: Section 1  
Estimated engineering effort: 4 to 7 days, plus fluent-speaker review

Work:

- Stress catalog SSR and hydration under concurrent requests, delayed
  registration, reload, pre-hydration input, locale switching, and failure
  isolation.
- Verify no request-level locale or rendered-state leakage.
- Audit every user-facing internal string and translation key.
- Exercise Dutch, German, French, Spanish, and Arabic through representative
  full workflows, including validation, dates, numbers, plurals, overflow, and
  RTL interaction.
- Obtain fluent-speaker review for official locale packs and document translation
  ownership and correction cadence.

Exit evidence:

- [ ] All 155 catalog fixtures render and hydrate without unexplained page,
      console, registration, or hydration errors.
- [ ] Pre-hydration user state and documented form behavior are preserved.
- [ ] Locale parity, fallback, reactivity, request isolation, and RTL tests pass.
- [ ] Official locale packs have recorded fluent-speaker review.
- [ ] SSR and localization documentation matches executable behavior.
- [ ] Section 4 is reviewed and signed off.

### Section 5: framework, package, and consumer experience

Status: in progress (packed runtime/reproducibility and local Next request-time gates green; external and owner gates open)
Dependencies: Sections 1 and 4  
Estimated focused engineering effort: 5 to 8 days

Work:

- Add packed-artifact browser runtime contracts for plain TypeScript, React 19,
  Next.js, Vue, Angular, SvelteKit, and Astro.
- Verify registration, properties, typed custom events, forms, slots, lazy
  loading, SSR and hydration where applicable, and console/page errors.
- Confirm generated React wrappers and framework types remain deterministic from
  the Custom Elements Manifest.
- Test tree-shaking, Content Security Policy-friendly loading, exports,
  declarations, source maps, dependency closure, and representative bundles.
- Make framework documentation point to the exact tested fixtures.

Exit evidence:

- [ ] Every supported framework passes build, type, and browser runtime tests
      against packed tarballs rather than workspace source.
- [ ] Event, property, form, slot, and ref behavior passes in applicable fixtures.
- [ ] Server frameworks pass documented SSR and hydration flows.
- [ ] Package and bundle gates detect dependency or catalog leakage.
- [ ] The published framework matrix matches the executable matrix.
- [ ] Section 5 is reviewed and signed off.

### Section 6: visual regression and performance history

Status: in progress (measurement/fixture validity; canonical history pending)  
Dependencies: Sections 2 through 5  
Estimated focused engineering effort: 5 to 8 days, plus elapsed time for repeated
flake-history runs

Work:

- Validate canonical light, dark, forced-colors, RTL, and reduced-motion
  baselines for applicable components and critical interaction states.
- Pin browser, fonts, assets, time, data, and animation behavior.
- Run and retain 50 canonical visual executions, investigate every failure, and
  calculate the actual flake rate.
- Expand performance cases for table virtualization, chart updates, scheduler
  layout, editor input, parser throughput, map lifecycle, node graph interaction,
  hydration, locale switching, and disconnect/reconnect memory behavior.
- Convert stable measurements into blocking budgets with intentional override
  records.

Exit evidence:

- [ ] Every stable component has canonical baselines for applicable critical
      states and environment axes.
- [ ] The retained 50-run visual history has a flake rate below 1 percent.
- [ ] Bundle, runtime, SSR, hydration, and memory trends are retained and
      reproducible.
- [ ] Blocking budgets have demonstrated stable variance and useful diagnostics.
- [ ] No unexplained resource growth or performance regression remains.
- [ ] Section 6 is reviewed and signed off.

### Section 7: documentation, governance, security, and design tooling

Status: in progress (website/docs readiness explicitly included; final checks pending)  
Dependencies: Sections 1 through 6 for final truth checks  
Original focused engineering estimate: 4 to 7 days, excluding creation of a full
external Figma component library. Re-estimate after the website/docs audit; the
original range did not adequately scope the now-explicit website refresh.

Work:

- Complete the [website and documentation readiness deliverable](#website-and-documentation-readiness),
  including landing content, cross-surface links, working demos and browser journeys.
- Generate or execute public API tables, counts, maturity labels, support
  matrices, and code examples wherever practical.
- Verify links, examples, migration guidance, browser and framework policies,
  accessibility limitations, SSR, localization, security boundaries,
  deprecation, release cadence, rollback, and hotfix procedures.
- Resolve all known security findings and run dependency and supply-chain audits.
- Publish and validate the Figma-compatible token export and document design-file
  ownership and synchronization.
- Decide whether the external Figma component library is a 1.0 blocker or a
  separately owned ecosystem deliverable. Record the decision explicitly.

Exit evidence:

- [ ] Documentation build, link, generated-content, and executable-example gates
      pass.
- [ ] Website content and navigation are current; internal, cross-surface and
      external link results and exclusions are recorded and reviewed.
- [ ] Main website/docs visitor journeys pass automated checks and desktop/mobile,
      keyboard and light/dark browser review; owner acceptance is recorded.
- [ ] No public claim exceeds the automated or manual evidence.
- [ ] No open P0 or P1 security, correctness, accessibility, or compatibility
      defect remains.
- [ ] Governance, support, release, rollback, and hotfix policies are actionable.
- [ ] Design-token export and design ownership are documented and reproducible.
- [ ] Section 7 is reviewed and signed off.

### Section 8: release candidates and final competitive review

Status: approved, queued  
Dependencies: Sections 1 through 7 signed off  
Estimated focused engineering effort: 3 to 5 days across two independent runs,
plus elapsed CI and review time

Work:

- Produce two release candidates from clean checkouts and packed artifacts.
- Run the complete audit, unit, coverage, accessibility, SSR, hydration,
  framework, interaction, visual, performance, documentation, and package
  matrices for each candidate.
- Rehearse install, upgrade, rollback, and hotfix procedures.
- Confirm maturity labels, migration notes, changelog, known limitations, and
  release evidence.
- Repeat the structured competitive review against current Web Awesome and
  Spectrum Web Components releases, using the same evidence-based scorecard.
- Make and record the Fluid 1.0 release decision.

Exit evidence:

- [ ] Release candidate 1 completes with all required evidence retained.
- [ ] Defects found in candidate 1 are fixed and regression-tested.
- [ ] Release candidate 2 completes independently with all required gates green.
- [ ] No unexplained performance regression or visual instability remains.
- [ ] The final competitive review is published with claims linked to evidence.
- [ ] Fluid 1.0 release decision is reviewed and signed off.

## Sign-off ledger

The implementation agent may mark objective evidence checkboxes complete. The
section-level sign-off checkbox is only marked after the evidence summary has
been presented for review and accepted by the project owner.

| Section                                  | Status             | Evidence summary                                                                                                                                                                                                   | Owner sign-off | Date |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---- |
| 1. Baseline and stable cohort            | ready for sign-off | [Baseline](../../quality/baselines/2026-08-26.md)                                                                                                                                                                  | [ ]            |      |
| 2. Behavior and interactions             | in progress        | [102-contract checkpoint](../../quality/baselines/2026-08-26-section-2-parallel.md)                                                                                                                                | [ ]            |      |
| 3. Accessibility and browsers            | in progress        | [Three-engine evidence and limits](../../quality/baselines/2026-08-26-section-2-parallel.md)                                                                                                                       | [ ]            |      |
| 4. SSR and localization                  | in progress        | [Implementation checkpoint](../../quality/baselines/2026-08-26-section-2-parallel.md)                                                                                                                              | [ ]            |      |
| 5. Frameworks and packages               | in progress        | [Seven-consumer packed/offline replay and raw React reproducibility green; final clean-tree serialized lanes green; local Next request-time gate green](../reviews/framework-pinned-reproducibility-2026-08-27.md) | [ ]            |      |
| 6. Visuals and performance               | in progress        | [Measurement and fixture audit](../reviews/benchmark-visual-validity-2026-08-26.md)                                                                                                                                | [ ]            |      |
| 7. Website, docs, governance, and design | in progress        | 136-page/26,043-link machine gate green; external review, governance and acceptance pending                                                                                                                        | [ ]            |      |
| 8. Release candidates and review         | approved, queued   | pending                                                                                                                                                                                                            | [ ]            |      |

## Overall completion checklist

- [x] Shared quality inventory and fixture foundation exists.
- [ ] Website and documentation readiness, including links and visitor journeys,
      is verified and accepted under Section 7.
- [ ] Sections 1 through 7 are signed off.
- [ ] Two complete release-candidate certification runs pass.
- [ ] Final competitive review is complete.
- [ ] Fluid 1.0 production-readiness decision is signed off.
