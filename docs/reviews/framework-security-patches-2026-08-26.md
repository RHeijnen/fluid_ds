# Framework security patch batch - 26 August 2026

Scope: the Angular and Next.js admin demos only. No major upgrades, dependency
overrides, publishing, deployment, or commits. This patch is not a clean audit,
an exploitability assessment, or production-readiness certification.

## Selected versions and compatibility

The seven aligned Angular framework packages move from 20.3.23 to 20.3.27:
`common`, `compiler`, `core`, `forms`, `platform-browser`, `router`, and
`compiler-cli`. Their manifest minimum becomes `^20.3.27`; the reviewed lockfile
selects exactly 20.3.27. Angular `build` and `cli` remain 20.3.26. TypeScript
remains 5.8.3, RxJS 7.8.2, and Zone.js 0.15.1.

Next.js moves from 15.5.18 to exactly 15.5.21 in the lockfile, with a manifest
minimum of `^15.5.21`. React and React DOM remain 19.2.6.

Angular's official
[transfer-cache advisory](https://github.com/angular/angular/security/advisories/GHSA-jhpw-976m-542j)
and [i18n advisory](https://github.com/angular/angular/security/advisories/GHSA-jj27-h5hq-8x99)
identify 20.3.27 as patched on the Angular 20 line. Next's official
[Server Actions advisory](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj)
identifies 15.5.21 as patched on the Next 15 line. The preceding
[dependency triage](dependency-security-triage-2026-08-26.md) retains the other
advisories and their application-path limitations.

Exact registry manifests were checked before resolution and retained afterward:
Angular framework peers require the matching 20.3.27 versions; the existing
build package accepts Angular `^20.0.0` and TypeScript `>=5.8 <6.0`.
`@angular/animations` is an optional platform-browser peer and was not added.
Next accepts the existing React 19 packages. Node 22.22.2 satisfies both engines.

## Narrow lockfile provenance

The pre-batch lockfile, including all previous work, has SHA-256
`42073752a521ec37aab35cbc56de83f781237a9d4be93b530ffe7fa67f93a91f`.
The final reviewed lockfile has SHA-256
`eb82ee9f7c82422aa6604af2f8a6b8ba9fb9465840e7ce109c119c550d3dd7af`.

Two normal-exit resolution attempts were rejected, not accepted as the patch:

1. Exact targeted `pnpm update --depth 0 --no-save --lockfile-only` produced the
   requested versions but rewrote unrelated dependency edges, including semver
   downgrades. Its resulting lockfile and structured delta are retained.
2. After restoring the exact captured baseline with a scoped inverse patch,
   `pnpm install --lockfile-only --prefer-offline` selected newer 20.3.29 and
   15.5.24 versions from the caret ranges and still rewrote unrelated edges.
   That result is also retained and rejected.

The approved constrained merge starts from the captured baseline. It copies
only pnpm-produced metadata for the selected versions from the first attempt,
without invented integrity values or package versions:

| Boundary                  | Exact change                                                                |
| ------------------------- | --------------------------------------------------------------------------- |
| Importers                 | Only `apps/admin-angular` and `apps/admin-next`                             |
| Package records           | 17 old-version records replaced by 17 selected-version records              |
| Snapshot records          | 18 replacements: those 17 packages and Angular build's updated peer context |
| Existing unrelated blocks | Byte-for-byte identical to the pre-batch lockfile                           |

The 17 package records are the seven Angular packages, `next`, `@next/env`, and
eight `@next/swc-*` packages: Darwin arm64/x64, Linux arm64/x64 with GNU/musl,
and Windows arm64/x64 MSVC. No unrelated orphan records were pruned. There are
no remaining references to the replaced Angular 20.3.23 or Next 15.5.18 targets.

Compiler-cli's required Babel core edge changes from 7.28.3 to the already
present 7.29.7 snapshot. Its existing semver 7.8.1 and yargs 18.0.0 edges remain
valid under unchanged upstream ranges. Next's existing caniuse-lite edge is
also retained. All 83 dependency/optional-dependency edges in the new target
snapshots resolve to known lockfile snapshots. The earlier editor test-helper
dependency and all other pre-batch lockfile work are preserved.

The [merge provenance](../../quality/evidence/framework-security-patches-2026-08-26/merge-provenance.json),
[rejected attempts and merge scripts](../../quality/evidence/framework-security-patches-2026-08-26/),
and [installed versions plus registry metadata](../../quality/evidence/framework-security-patches-2026-08-26/installed-and-registry.json)
are retained locally. All 17 new integrity values match the primary npm registry.

## Verification

| Check                                                           | Result                                     |
| --------------------------------------------------------------- | ------------------------------------------ |
| Host frozen install, strict peer dependencies, scripts disabled | Pass, normal exit, no lockfile rewrite     |
| Eight requested installed versions                              | Pass, exact 20.3.27 / 15.5.21              |
| Unchanged build/CLI/TypeScript/React versions                   | Pass                                       |
| Seventeen registry integrity comparisons                        | Pass                                       |
| Linux frozen install, strict peers, scripts disabled            | Pass, exact reviewed lock                  |
| Fresh Linux build of all 18 library packages                    | Pass, source-stable                        |
| Angular app typecheck                                           | Pass, source-stable                        |
| Angular production build, including declared prebuild           | Pass after bounded registry mapping repair |
| Next app typecheck and production build                         | Pass, source-stable                        |
| Linux installed versions and post-build lock immutability       | Pass                                       |
| Fresh isolated packed-framework runtime                         | Not run in this batch                      |

Passing source-stable evidence:

- `2026-08-26T17-03-30-891Z-framework-security-frozen-install`
- `2026-08-26T17-04-18-094Z-framework-security-installed-versions`
- `2026-08-26T17-08-40-005Z-linux-security-patches-frozen-install`
- `2026-08-26T17-10-04-368Z-linux-security-package-build-explicit-corepack`
- `2026-08-26T17-10-33-087Z-linux-security-angular-typecheck`
- `2026-08-26T17-11-05-641Z-linux-security-next-typecheck`
- `2026-08-26T17-11-21-988Z-linux-security-next-build`
- `2026-08-26T17-12-12-494Z-linux-security-installed-after-builds`
- `2026-08-26T17-18-02-571Z-linux-angular-registry-resolution-fixed`
- `2026-08-26T17-18-04-320Z-linux-angular-registry-production-build`

The frozen install used an owned direct-Node deadline of 180 seconds and exited
normally in about three seconds. No termination or PID-tree cleanup was needed.
The patched manifests and lockfile were subsequently copied into the private
Linux snapshot with source SHA-256
`050732453b66fe7fb51d9c8dd9a2b57db68d1d12c0588138d794077e7aac24bf`.
The package and app commands used finite 180-second owned-process deadlines;
all exited normally without termination. The package build regenerated all
canonical manifests and React wrappers without source drift. Next generated
six static pages and reported its existing ESLint-plugin configuration warning.
These are workspace builds, not isolated packed-consumer or browser evidence.

The first package-build attempt failed before compilation because this Docker
image's custom Node prefix did not contain Corepack at the supported helper
location. That failure is retained as
`2026-08-26T17-09-37-991Z-linux-security-package-build`. Subsequent commands used
the verified `/usr/bin/pnpm` symlink target
`/usr/lib/node_modules/corepack/dist/pnpm.js`, still with Node 22.22.2 and pnpm
9.15.0. The container layout was later aligned with the existing helper's
supported prefix; the repository helper was not weakened.

### Angular registry resolution repair

The source-stable failure
`2026-08-26T17-10-40-774Z-linux-security-angular-build` occurred after the
declared prebuild completed. Angular resolved the toast item's public
`@fluid-ds/icons/registry` import to workspace `src/registry.ts`, which is not
part of the app's TypeScript compilation. The app already maps other Fluid
entry points to built JavaScript, but this specific mapping was absent.
This is a reproduced workspace integration gap; no claim is made that the
Angular patch introduced it.

The bounded repair adds only the registry-to-`dist/registry.js` mapping.
The existing framework-configuration guard now checks actual TypeScript
resolution with the parsed app configuration, including a negative control
that removes the mapping and resolves back to the unsupported workspace source.
The completed guard passes all seven checks in source-stable evidence
`2026-08-26T17-17-21-076Z-angular-registry-built-module-green`.
Initial guard-authoring failures are also retained: the first helper omitted
TypeScript's parsed paths base and initially expected a declaration rather
than the explicitly mapped JavaScript module. Those helper corrections are
not additional application defects. A premature Docker copy also ran the
old helper and failed six-pass/one-fail in
`2026-08-26T17-16-41-424Z-linux-angular-registry-resolution`. This is retained
as a harness/sequencing failure, not another product regression.
The production-build failure above and the final negative control establish
the actual missing mapping.

After the final files were copied, the Linux configuration guard passed all
seven checks in `2026-08-26T17-18-02-571Z-linux-angular-registry-resolution-fixed`.
The actual Angular production build, including its declared prebuild, passed
normally in approximately 19 seconds in
`2026-08-26T17-18-04-320Z-linux-angular-registry-production-build`. Both runs
were source-stable; the production-build source SHA-256 was
`3ad5f0ee222088bfca6f7dc60b264618bbf4cbc5791af456abc0533ff53b91ca`, with the
same reviewed `eb82ee9f...` lockfile hash. All three Linux evidence directories
and the owned build outcome are retained locally. This closes the reproduced
workspace build gap, not the separate packed-framework runtime gate.

## Remaining limits

Next 15.5.21 still declares PostCSS 8.4.31. This batch intentionally does not
override that dependency or claim to resolve its separate advisory debt.
Other dependency findings, major-version decisions, and unsupported or
unpatched upstream paths remain in the preceding triage. A fresh whole-workspace
audit and framework runtime verification are separate gates, not implied by
these version and installation checks.
