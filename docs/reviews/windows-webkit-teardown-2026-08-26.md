# Windows WebKit teardown investigation

## Verified observations

Separate WTR label, chart and host-ARIA runs and an independent Playwright SSR
run have completed their assertions but failed shutdown. They remain failed
gates. Serializing engines helps isolate evidence but has not fixed the issue.

The full SSR run `2026-08-26T14-20-26-786Z-ssr-full-72-integrated` completed
72 assertions, then exited 1 at the unchanged 300-second deadline. Its runner
does not use Fluid's WTR supervisor. The WTR host-ARIA artifact records a hang
inside `Webkit-1.stop` before normal server shutdown. Neither observation is a
proven underlying engine root cause.

After the SSR worker and browser parent exited, Windows CIM retained network
entries 8584 and 19972 with parent 21272. At 16:28 local time, both reported
one thread and nonzero working sets/handle counts, while `Get-Process` did not
return either PID. The earlier host-ARIA network entry 24432 had the same
contradictory API behavior. These are historical identities, not cleanup targets.
See each evidence directory's forensic notes for creation times and scope.

## Separate harness defect

CERT-039 is a defect in Fluid's initial supervisor, not a WebKit diagnosis.
Its ownership scan incorrectly accepted a process older than a newly reused
parent PID and terminated an unrelated Windows notification process. Browser
jobs using that supervisor were paused. The repair requires temporal ancestry,
root creation identity, explicit ambiguity failure and bound native handles
before cleanup. A process-name match or PID-only tree kill is not acceptable.
Those local guards now pass, and a source-stable 53-case Chromium media run plus
three separate 136-case formatter runs exit normally without forced cleanup.
Supervised browser jobs resumed. This scopes the harness repair; it neither
erases the incident nor explains the independently observed WebKit hangs.

Framework runners now avoid their own recursive PID cleanup. Installed
Playwright 1.60.0 still has an upstream Windows recursive force-close fallback
in `playwright-core/lib/coreBundle.js` (`killProcess`). Normal public browser
closure is used; this dependency boundary is not a guarantee about every
upstream emergency-cleanup path. No dependency files were patched.

## Related upstream report, not an attribution

[Playwright issue 42109](https://github.com/microsoft/playwright/issues/42109)
reports a different Windows close hang involving Chromium temporary-profile
permissions and recursive filesystem cleanup. It is useful as a diagnostic
alternative, but its browser/version and symptom details do not establish the
cause of Fluid's observed WebKit network-process shutdown. No profile deletion,
ACL change, timeout increase or proposed upstream patch was applied here.

## Required next evidence

A read-only local environment check found only the `docker-desktop` WSL
distribution, no general Linux development distribution. Docker's client is
installed, but its Linux engine endpoint is unavailable. No daemon, containers,
new distribution or operating-system installation was started for this check.
The configured Linux CI lanes remain unexecuted from this uncommitted worktree.

At 15:07 UTC the owner opened Docker and authorized isolated Linux verification.
A dedicated labeled container was created without starting or modifying any
existing project container. It uses Playwright 1.60.0's pinned Ubuntu image,
Node 22.22.2 and pnpm 9.15.0, with four CPUs, 6 GiB RAM and 1 GiB shared memory.
Dependencies installed from the unchanged frozen lockfile. Source snapshot and
native process-safety verification precede browser execution; provisioning is
not a passing Linux gate. The Docker recipe and snapshot manifests are retained
under `quality/evidence/linux-verification-2026-08-26/`.

- Retain browser debug lifecycle logs and native process identities on a bounded
  reproduction, distinguishing browser protocol closure from profile cleanup.
- Compare the same frozen test graph on Linux and actual macOS Safari/WebKit.
  Windows WebKit is not Safari certification.
- Re-run complete gates after fixes. Passing assertions, cleanup attempts and a
  subsequent successful run must remain distinct facts.
