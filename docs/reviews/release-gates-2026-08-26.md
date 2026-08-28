# Release gate wiring, 26 August 2026

Status: locally reviewed configuration and regression guards. No workflow was
dispatched, no release was attempted, and no change was committed.

## Reproduced gap

The release workflow claimed its concurrency group waited for verification, but
the group was independent of every quality workflow. Both main pushes and manual
dispatch could reach Changesets after installation and build alone. This is an
unsafe configuration path, not evidence that a defective release occurred.

## Repair

Release now invokes nine existing workflows as local reusable dependencies:
verify, measured coverage, SSR hydration, accessibility, Storybook interactions,
performance, package contracts, framework contracts and visual regression. Their
budgets and matrix members remain intact. The package lane additionally checks
packed CEM publication and retains archives, consumer inputs and failed-command
logs. Together the lanes contain 15
underlying jobs, including both Node versions and all six framework jobs.

Local workflow references use the caller's commit. Default checkout also uses
the event commit, rather than floating main. GitHub's normal successful-dependency
condition prevents publication after failed, skipped or cancelled gates. Manual
dispatch uses exactly the same dependencies, and a context job rejects non-main
refs. Immediately before Changesets, release checks the local HEAD and current
remote main against the event SHA; a superseded run must start again. This last
check is not an atomic lock on future changes to main.

Caller-aware concurrency separates reused gates from their standalone runs. Only
the final Changesets job receives contents/OIDC publication permissions. Visual
retains an explicit narrow PR-write permission for its pre-existing comment
step, which is inactive for release events. No general secret inheritance was
added. Existing main triggers remain, so main pushes temporarily duplicate gate
execution; consolidating those triggers is a separate cost optimization.

The dependencies also remove the visual push-path-filter bypass: release calls
the visual workflow even for commits whose normal push would not trigger it.
Missing/unapproved baselines therefore block release rather than count as
success. These automated gates do not grant manual accessibility, translation,
security-risk or maturity sign-off.

## Local evidence and limits

`scripts/release-gates.test.mjs` parses the actual YAML with the existing ESLint
toolchain's YAML parser. Twelve tests pass in
`2026-08-26T16-43-49-796Z-package-lane-workflow-guards`, with unchanged source.
They check the nine dependencies, same-commit references, context and permission
boundaries, exact matrix membership, reusable concurrency, and rejection of
omitted gates, skipped test steps, matrix exclusions, ignored failures and
publication bypasses. The last two tests also reject eleven mutations of the
packed/CEM command sequence and always-retained artifact paths. The preceding
failing configuration is retained under
`2026-08-26T16-23-53-616Z-release-gates-red`; repeated failures of its shared
precondition are not nine distinct production bugs.

Independent review found no blocking wiring defect and identified the matrix
exclusion and conditional-step guard gaps, which were then added to the tests.
This is static local evidence, not an executed GitHub Actions or npm OIDC
certification. Branch protection, environment approvals, trusted-publisher
settings, human sign-offs and the actual remote run remain outside this result.

All ten affected workflow files also pass Actionlint 1.7.12 in
`2026-08-26T16-42-41-649Z-release-final-workflows-actionlint`, including the final
package evidence paths. The official
Windows archive was checked against its release asset SHA-256,
`6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9`.
ShellCheck and Pyflakes were not available and were explicitly disabled; this
result covers Actionlint's workflow checks, not those tools' additional checks.
An earlier recorder attempt used a Unix-style executable path in the Windows
shell and failed before launching Actionlint; that failed command is retained.

GitHub documents same-commit local calls and permission inheritance in
[reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
caller context/concurrency in
[workflow configurations](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations),
and dependency failure propagation in
[job dependencies](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs).
