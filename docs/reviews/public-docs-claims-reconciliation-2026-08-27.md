# Public documentation claims reconciliation — 2026-08-27

## Outcome

The public README, feature list, landing page, documentation index, and framework,
SSR, localization, and accessibility guides now describe the current repository
evidence without turning automated coverage into release, conformance, visual,
assistive-technology, or deployed-environment approval.

The reconciliation uses these current evidence boundaries:

- 155 published custom elements;
- no confirmed machine-actionable Fluid-owned string migration in the guarded
  155-element and 12-surface localization inventory;
- seven representative packed consumers with a final synchronized relocated
  Linux offline/frozen replay: React, Astro, Next.js, SvelteKit, Vue, Angular,
  and plain TypeScript/HTML; selected-artifact replay and raw React pack
  reproducibility pass;
- CSR for React, Vue, Angular, and plain TypeScript/HTML; build-time static DSD
  for Astro, Next.js, and SvelteKit; a separate packed Next production-server
  gate covers local request-time SSR without claiming a deployed adapter;
- a current 642/642 broad accessibility matrix, 214 per installed Playwright
  engine, plus the retained 765/765 stable-depth matrix, 255 per engine;
- 60 generated visual candidates that remain outside the accepted baseline and
  require human review; the old exact-hash history retains 1/86 flaky executions,
  while the replacement full-catalog machine window passes 50/50 exact runs under
  the attested single-raster-thread policy.

The primary retained evidence is the
[localization/RTL integration reconciliation](./localization-rtl-integration-reconciliation-2026-08-27.md),
[pinned framework replay](./framework-pinned-reproducibility-2026-08-27.md),
[complete automated accessibility regression](./complete-accessibility-regression-2026-08-27.md),
and
[visual-regression platform review](./visual-regression-platform-baseline-readiness-2026-08-27.md).

## Corrected claims

- The framework guide no longer describes six consumers as build-only or says
  the pinned profile is pending. It states the seven-lane runtime/replay result,
  separates CSR from static DSD, and distinguishes the local packed Next
  request-time gate from deployed adapters, catalog-wide framework proof, and
  cross-platform certification. Its SvelteKit
  section now distinguishes the compiler-checked binding recipe from the separate
  static-DSD hydration fixture.
- React event metadata now reports 38 explicitly typed element/event pairs and
  128 deliberate `CustomEvent<unknown>` pairs, rather than the earlier 21/145
  snapshot.
- The SSR guide shows the seven-consumer rendering matrix and keeps build-time
  output distinct from the separate local packed Next request-time evidence.
- The localization guide no longer says known Fluid-owned migration remains.
  It preserves the application, native/browser, dependency, and canonical-data
  ownership boundaries and retains fluent-language, visual RTL, and manual AT
  approval as human gates.
- The accessibility guide replaces its old 380+ two-engine statement with the
  frozen-source 765-case three-engine result. It records forced-colors, RTL, reduced-
  motion, reflow, keyboard, lifecycle, and recovery automation while explicitly
  withholding conformance, native Safari/mobile, human visual, and AT claims.
- Landing and README language no longer says frameworks are generically
  “proven,” calls the Next demo “SSR-safe,” promises identical results, or uses
  “accessible out of the box” as an unqualified certification claim.
- The canonical feature list advances its dated checkpoint from the superseded
  621-case/React-only/21-typed-event snapshot to the current accessibility,
  seven-consumer, 38/128 event, and 1,009-accepted/60-candidate boundaries.

## Current-source follow-up

Later source and lock changes were synchronized into the retained Linux workspace.
The accessibility and selected-artifact framework results now have the following
boundaries:

- The stable-depth matrix passes 255/255 in Chromium, Firefox, and WebKit
  (765/765 executions) with clean supervised teardown. This does not promote
  maturity or replace manual AT and native Safari/mobile evidence.
- The broad accessibility suite passes 214/214 in Chromium, Firefox, and WebKit
  (642/642 executions) on the current synchronized tree.
- The final selected-artifact seven-consumer packed/offline replay passes all
  lanes against root-lock `17ec483e…`. Exact `0.4.0` internal React development
  ranges make 10/10 initial and 5/5 final raw packs byte-identical; a newly packed
  consumer also passes install, typecheck, build and all-engine runtime.
- The separate packed Next production-server gate passes concurrent request
  isolation, private/no-store semantics and the three-engine hydration contract.
  It does not certify deployed ingress, CDN or hosting-adapter behavior.

The public README, feature list, accessibility guide, framework guide, SSR guide,
and landing statistics now preserve those distinctions. They do not promote a
maturity label or infer request-time SSR, manual AT, native Safari/mobile, or
owner approval.

The operational handoff, implementation plan, and defect register additionally
record:

- retained 27 August live security-audit counts of 0 critical / 1 high / 20
  moderate / 6 low, zero
  publishable production/optional paths, and zero unaccepted high/critical paths
  on lock `17ec483e…`; Linux proof credits exactly 14 development-only
  `extract-zip` paths behind the sole raw high finding as locally patched, and the
  dependency-risk gate passes;
- the repeated seven-surface expansion performance profile and retained-root Map
  repair; old Leaflet Maps are 0/20 with a 5,664 B steady-state heap p95. Chart
  also retains 0/20 old Chart.js instances but has a 45,448 B positive heap p95,
  so no expansion budget, broad leak-freedom claim or multi-date trend is inferred;
- cumulative unchanged-harness visual history retains the historical 1/86
  (1.163%) result and the proposed prepaint was disproved and reverted. The
  replacement window passes 50/50 exact full-catalog runs under the fail-closed
  `--num-raster-threads=1` policy with zero flakes and zero fresh-capture
  variance; all 60 candidates still require human approval.

## Focused verification

- `node scripts/check-website-surfaces.test.mjs`: passing.
- `node scripts/check-website-surfaces.mjs`: zero failures across four website
  source inputs plus seven central public claim sources; route counts remain
  source inventory, not reachability proof.
- `node scripts/framework-pinned-profile.test.mjs` and the profile guard pass for
  the final seven-lane profile, including result shape, relocated replay,
  integrity, lock binding and negative controls. Raw React packing separately
  passes 10/10 initial and 5/5 final exact-byte comparisons.
- Stale-claim search across the edited public surfaces: zero matching retired
  statements.
- Markdown/MDX/TypeScript formatting and `git diff --check`: required before
  handoff.

The website guard now also rejects the newly retired landing phrases. Canonical
manifests were regenerated after the first fail-closed check detected stale output;
the rerun verifies 14 manifests and 155 elements. No dependency, lock, accepted
screenshot, deployment, commit, push, section sign-off, or human approval is part
of this pass.

## Final local executable validation

- The root-mounted docs gate builds 136 pages, passes all seven link-checker tests,
  and checks 24,231 links/fragments with zero failures.
- The production-mounted `DOCS_BASE=/docs/` build also emits 136 pages; its link
  traversal checks 24,230 links/fragments with zero failures.
- The landing production build passes (175 modules). The focused website/link/
  harness suite passes 16/16 and the 11-source claim guard reports zero failures.
- Eight landing/docs journeys pass in each of Chromium, Firefox, and WebKit:
  24 journey executions, 233 HTTP requests, zero diagnostics, and closed browser
  and preview lifecycles.
- The current browser/unit inventory contains 2,490 assertions per engine
  (7,470 executions across Chromium, Firefox, and WebKit). The separate
  14-package Chromium coverage run passes every configured threshold; it is a
  coverage replay of those tests, not another unique test denominator.
- The current Node SSR gate passes 1,903 isolated cold imports and all 155
  element renders. Browser hydration passes 231/231 across Chromium, Firefox and
  WebKit in 6.5 minutes. The first attempt exposed a time-dependent Scheduler
  validity-focus defect when the late-day roving calendar day was disabled; the
  implementation now falls back to the first enabled day and the Scheduler unit
  suite passes 68/68. The grown browser matrix uses a 600-second suite timeout,
  while per-test and server timeouts remain 60 seconds.
- Packed publication validation is current: 14/14 CEM manifests pass; artifact
  policy is 32/32; all resolved targets exist in 18 tarballs and installed
  packages; and packed-consumer runtime and type roots pass 16/16 each. The
  supply-chain workflow guard also passes all 11 workflows. These checks do not
  constitute release approval or waive external/human gates.

The first journey attempt correctly failed because it followed the preceding
root-mounted docs build, whose assets are not valid under `/docs/`. Rebuilding with
the required production mount made the same harness green; no source defect or gate
waiver was inferred. External/deployed URLs and the 17 separately built application
surfaces remain outside this local two-surface harness.
