# Visual regression platform and baseline readiness review — 2026-08-27

## Disposition

The visual platform is now explicit and candidate generation is fail-closed, but no image in this review is an accepted baseline and no human visual, assistive-technology, or cross-platform approval is claimed.

## Continuation, 28 August 2026

The retained 50/50 raster1 window remains valid for its declared scope: 60
candidate images plus five accepted-smoke captures per execution. It did not run
the complete 1,009-image accepted set. A later partial normal run observed 18
accepted-baseline diffs before it was deliberately cancelled when source changed;
18 is therefore a partial observation, not a final normal-gate denominator.

Two machine causes are now bounded in `8defff0`. The nine animated
FluidChart-based fixtures require a live public Chart.js instance, call `stop()`
and `update("none")`, and await the host update before capture; sparkline is
excluded because it already disables animation. Fixture selection passes 9/9,
visual TypeScript and 513-story generation pass, and the fail-closed lifecycle
contract passes 42/42 across Chromium, Firefox and WebKit. Separately,
AspectRatio, Lightbox and all seven Map stories avoid remote pixels through
deterministic inline assets where applicable and locally served Leaflet CSS.

These repairs intentionally reveal accepted-image provenance debt rather than
approving it. Human review must treat three groups separately: the 60 never-
accepted candidates; Chart baselines created in `5957252` from stale built story
output (including an accepted doughnut frozen mid-animation and old legend
presentation); and accepted AspectRatio/Lightbox/Map images whose remote assets
were replaced by hermetic fixtures. Focused post-fix captures show complete Chart
datasets but still differ from the accepted images. A transient focused run
observed Bar light 18,478 pixels, Bar dark 18,567, Pie light 17,968 and Doughnut
light 23,660; those exact pixel counts were not retained as a durable artifact
and are not release evidence. No baseline was updated.
The policy-correct next step is owner review/replacement on canonical raster1,
then the normal suite with `updateSnapshots: "none"`.

The executable catalog contains 513 retained stories, 139 representative stories, and verified attribution for all 155 catalog elements. Its expected active set is 1,069 images. The accepted active set remains unchanged at 1,009 images, with 60 exact filenames missing and no orphaned active filename. The old non-catalog screenshot tree is outside this reconciliation.

## Canonical executable platform

`apps/visual-regression/visual-platform.ts` records the screenshot contract used by Playwright:

- Ubuntu 24.04 x64, Node 22, Playwright 1.60.0, Chromium;
- viewport 1024 × 768 at device scale factor 1;
- UTC timezone, `en-US` for LTR and `ar-EG` for RTL;
- explicit light, dark, forced-colors, RTL, and reduced-motion projects;
- fixed `2026-08-27T12:00:00.000Z` wall time and seeded randomness;
- Storybook's repository-local Inter and JetBrains Mono fonts, awaited before capture;
- disabled screenshot animations, hidden carets, and two settled animation frames.

The dated Linux capture reported Ubuntu 24.04 userspace on WSL2 kernel `6.6.87.2-microsoft-standard-WSL2`, Node `v22.22.2`, Playwright `1.60.0`, and Chromium. Kernel attribution is retained because it is material provenance rather than being normalized away.

## Gap and state coverage

The exact 60-image gap is 4 light images plus 14 images in each of dark, forced-colors, RTL, and reduced-motion. It affects 14 attributed tags: `fluid-bubble-chart`, `fluid-button`, `fluid-celebrate`, `fluid-chart`, `fluid-col`, `fluid-doughnut-chart`, `fluid-line-chart`, `fluid-menu-label`, `fluid-pie-chart`, `fluid-polar-area-chart`, `fluid-radar-chart`, `fluid-scatter-chart`, `fluid-sparkline`, and `fluid-toast-item`.

The retained catalog has executable accepted light-state evidence for the supported static open fixtures (`speed-dial--open`, `tour--open-on-load`) and invalid/error fixtures (input, masked input, textarea, field, and fieldset states). It now also has an explicitly attributed `fluid-button` keyboard-focus fixture. The runner sends a real Tab key, verifies the upgraded host, proves that the uniquely accessible-named native shadow button is the exact active target, requires `:focus-visible`, and rechecks the same target identity after capture. This contract passed in Chromium, Firefox, and WebKit. Its five mode images remain candidates and do not establish human visual or assistive-technology approval.

## Candidate evidence and controls

Candidate output lives under `apps/visual-regression/candidate-evidence/2026-08-27-ubuntu-24.04-x64-pw1.60.0/`, separate from accepted `__screenshots__`. Its manifest declares `accepted: false` and `humanAccepted: false`, records the source revision, platform, catalog hash, deterministic inputs, per-file SHA-256 and byte length, and proves the 60 candidate filenames exactly equal the accepted gap (zero missing, zero unexpected).

Candidate configuration refuses the evidence root itself, paths outside it, and accepted snapshot paths. Candidate runs skip every fixture with an existing accepted filename. Normal verification keeps `updateSnapshots: "none"`; candidate generation alone uses an isolated `updateSnapshots: "all"` directory. Trace, screenshot, HTML, and JSON artifacts remain configured for failures. Unit controls reject count-only reconciliation, wrong candidate roots, missing files, and unexpected files.

These candidate PNGs must not be copied into `__screenshots__` until an owner follows the repository's explicit review workflow and visually accepts them on the canonical platform.

## Repeated-run stability

The first three-run measurement is retained under `candidate-evidence/stability/2026-08-27-red-nondeterministic-dark/` with `stable: false`. Exact SHA-256 comparison found four variances: the dark `animations-effects--declarative-auto` and `components-forms-button--keyboard-focus` captures in runs 2 and 3 differed from run 1. This was a real harness defect, not waived renderer noise.

Two bounded harness fixes address the reproduced causes. Theme, language, and direction are now installed before story code runs, eliminating the dark-theme transition race. The attributed live `fluid-celebrate` controller is stopped through its public lifecycle before capture, eliminating canvas-frame timing; guards require that the attributed controller actually exposes `stop()`. No animation runtime or product story was changed.

The first long exact-hash window is retained separately under `candidate-evidence/stability/2026-08-27-canonical-50-run-stable/` and is deliberately red. Runs 1–33 were exact, but run 34 changed one color channel by one value at pixel `(14, 23)` on the left rounded edge of `components-forms-button--keyboard-focus-reduced-motion.png`. That is one flaky execution in 34 (2.94%), so it was not excluded, rounded away, or counted as passing. The candidate runner stopped before run 35 and retained `stability-failure.json`.

An attempted focus-only prepaint was then evaluated. The first implementation referenced the wrong fixture level, so its branch never executed. Its exact 50-by-five control result and the following 52 exact full-suite executions are therefore unchanged-harness evidence, not post-fix evidence. Those 52 executions produced zero variance across 3,060 candidate comparisons and 255 accepted-smoke comparisons, but the cumulative unchanged-harness history remains one flaky execution in 86 (1.163%), above the required less-than-1% threshold.

The branch was corrected with fail-closed counters proving exactly one prepaint for the intended focus fixture in each of the five modes and zero for all other fixtures. That causal stress was stopped at iteration 23 when the RTL focus image reproduced the same class of one-pixel, one-channel, one-value rounded-edge variance. The proposed prepaint was therefore not causal and was reverted. No tolerance, hash policy, pixels, or denominator was weakened or hidden, and no new post-fix 50-run window was claimed.

Product and lock changes landed while the immutable-build continuation was running. After that source freeze, the complete 4,582-file host set was synchronized to Linux with matching aggregate `4c734756c6e9ea544ed2db43c873c054b36ec436`; the then-current lock SHA-256 was `768ad80fc2a8b1ecf4f80cde725a9bf9e56e1cd860adf5e0b59e591dd5e4f96a`. An offline frozen install passed and Storybook rebuilt successfully. Run 52 against that exact historical build remained identical: zero candidate variance across 3,060 comparisons and zero accepted-smoke variance across 255 comparisons. This retained result did not by itself satisfy the stability gate.

A later replacement window is the current machine disposition. Under the
fail-closed, process-attested Chromium policy `--num-raster-threads=1`, 50/50
consecutive full-catalog executions passed with zero flaky executions, zero
cross-run variance, 2,940 candidate comparisons and 245 accepted-smoke
comparisons. It is bound to authoritative lock SHA-256
`17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0` and recorded
in `candidate-evidence/stability/2026-08-27-raster1-full-50/final-status.json`.
The 1/86 unchanged-harness result remains historical evidence; it is no longer
the current machine-gate disposition. This replacement does not accept any of
the 60 candidate images.

The 1,009 accepted active PNGs remained byte-identical throughout, with aggregate SHA-256 `369356a6da2903f0040998a59c00c370886e6c0e028362fe8b390bec61b01c0f` and no worktree changes. Fresh accordion bytes do not equal the historical accepted PNG bytes, so every per-run mismatch remains recorded rather than concealed. The repository's configured pixel comparison passes the current fresh accordion in all five modes. Neither the unchanged-harness continuation nor final run 52 authorizes rewriting historical baselines.

## Verification

- Initial gap candidate run: 125 passed, 2,505 skipped, 0 unexpected in Chromium; its 55 images remain in the candidate set.
- Focus candidate run: 5/5 passed in light, dark, forced-colors, RTL, and reduced-motion, bringing the exact candidate set to 60.
- Pre-fix long window: runs 1–33 exact; run 34 retained red for one one-channel/one-value focus-ring pixel, giving 1/34 flaky executions (2.94%).
- Unchanged-harness continuation: 52/52 full executions exact, with 3,060 candidate and 255 accepted-smoke comparisons; combined with the retained red execution, that historical window remained red at 1/86 flaky executions (1.163%).
- Corrected focus-prepaint causal stress: explicit branch counters passed, but RTL reproduced a one-pixel exact-hash variance at iteration 23; the prepaint was rejected and reverted.
- Frozen current-tree boundary: exact 4,582-file synchronization, final lock hash invariant, offline frozen install and Storybook build passed; run 52 added 60 candidate and five accepted-smoke captures with zero variance.
- Replacement exact window: 50/50 full-catalog executions passed under the
  attested single-raster-thread policy, with 60 candidate and 5 accepted-smoke
  captures per run, zero flakes and zero fresh-capture variance.
- Fixture failure controls: Chromium, Firefox, and WebKit, 36/36 passed, including real focus, target replacement rejection, live-controller settling, and missing lifecycle rejection in every engine.
- Inventory/selection/candidate/state/stability unit controls: 19/19 passed.
- TypeScript: `tsc --noEmit` passed in the canonical Linux container.
- Formatting and `git diff --check`: passed for the owned tranche.
- Accepted screenshot tree: no worktree changes.

During the original review, host `pnpm` commands were blocked before execution by
the then-current supply-chain policy treatment of the `xlsx@0.20.3` tarball. No
lockfile repair or mutation was attempted in that tranche. The pinned Linux
readiness container supplied the reported executable evidence.

## Remaining gates

- Human visual review of all 60 candidates, including focus visibility, chart meaning, RTL composition, forced colors, and reduced-motion presentation.
- Manual keyboard and assistive-technology review of the focused control; browser automation does not establish AT output or usability.
- Preserve and reproduce the 50/50 exact replacement window in hosted CI; the
  older 1/86 result remains retained history and the exact-hash contract was not
  weakened.
- Hosted-CI recurrence and comparison against any additional supported production platform after the local stability gate passes.
- Manual assistive-technology review and product-owner acceptance.

Until those gates pass, this work improves baseline readiness and reproducibility only; it does not promote visual-regression maturity or release readiness.
