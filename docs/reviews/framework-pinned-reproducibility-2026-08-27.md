# Framework pinned reproducibility certification — 2026-08-27

## Outcome

The representative framework matrix now has an explicit seven-consumer pinned
profile and a fail-closed relocated replay lane. The profile binds the exact
successful latest-compatible evidence result, portable consumer lock, retained
Fluid tarballs, consumer source files, root lock and pnpm 9.15.0. The replay
copies each bundle to a newly created operating-system temporary path, installs
offline with a frozen lock and strict peers, checks isolation and installed
package realpaths, runs typecheck and production build, and then reruns the
existing Chromium, Firefox and WebKit contract for that consumer.

The final synchronized Linux replay passed all seven lanes against root-lock
SHA-256
`17ec483e01ecc1fc4cb109ecf076428b640fd62a3541842516277755e1a0eec0`.
Every frozen install, typecheck, production build, three-engine runtime,
immutable-byte comparison and owned cleanup passed. The retained result is
`quality/evidence/framework-pinned/2026-08-27T17-38-31-941Z/`.

This certifies the exact selected archive and lock bytes in the tracked corpus.
The earlier raw React mismatch was traced to pnpm asynchronously rewriting 14
internal `workspace:*` development ranges. Those development-only ranges are now
exact `0.4.0` while the workspace lock retains local links. Ten initial and five
final raw packs are byte-identical at SHA-256
`98c3ffe6100e955906b1a4612778c334fd379c3bde0fda591e6c5cf92fc939d9`.

## Pinned profile

`scripts/framework-pinned-profile.json` is the executable profile. It points to
the minimal tracked corpus under `scripts/fixtures/framework-pinned/`, prepared
from the last passing latest-compatible bundle for each consumer, and pins a
SHA-256 over every retained tarball, consumer source file and consumer lock. The
replay also writes the complete per-file hash map to each lane result rather
than relying on counts.

| Consumer              | Latest-compatible comparison                                        | Rendering contract    |
| --------------------- | ------------------------------------------------------------------- | --------------------- |
| React                 | `framework-fixtures/2026-08-27T17-32-28-943Z--fluid-ds-admin-react` | CSR                   |
| Astro                 | `framework-astro/2026-08-27T17-33-24-065Z`                          | Build-time static DSD |
| Next                  | `framework-next/2026-08-27T17-33-48-123Z`                           | Build-time static DSD |
| SvelteKit             | `framework-sveltekit/2026-08-27T17-34-34-613Z`                      | Build-time static DSD |
| Vue                   | `framework-vue/2026-08-27T17-34-59-087Z`                            | CSR                   |
| Angular               | `framework-angular/2026-08-27T17-35-18-830Z`                        | CSR                   |
| Plain TypeScript/HTML | `framework-vanilla/2026-08-27T17-35-44-996Z`                        | CSR                   |

The profile is intentionally not a second dependency-resolution lane. It
certifies that an exact graph which passed the latest-compatible lane remains
portable and replayable without registry access or workspace source. A future
dependency update must first create new successful latest-compatible evidence,
then deliberately update the pinned hashes and retain the old profile result as
history.

The profile's `rootBaseRevision` is the committed base of the dirty source tree
used during this work, not a claim that the retained archives came from a clean
commit. Exact replay identity comes from the per-result, archive, fixture, and
consumer-lock hashes. Before the final replay, a separate fail-closed comparison
must match every retained archive to the explicitly designated final-source
package set.

React needed one explicit artifact reconciliation after the original
workspace-rewrite ordering defect. Exact internal development ranges remove that
rewrite path. The final archive is copied into both the React and Next retained
graphs; both portable consumer locks resolve offline against those exact bytes.
The consolidated replay proves the chosen bytes and lock integrities, while the
15 exact raw comparisons separately prove repeatable archive creation.

## Fail-closed boundaries

- Seven lane IDs and seven distinct fixture package names are required.
- Replay source must stay below `scripts/fixtures/framework-pinned`; traversal,
  symlinks, workspace/link resolutions, generated build output and non-tarball
  Fluid resolutions fail.
- The original latest-compatible result must be byte-identical and have status
  `passed` before its graph can be replayed.
- Root lock drift fails before install. Root lock bytes are checked again after
  all lanes, and the runner never writes the root lock.
- Copy identity is checked before installation. The original and relocated
  retained files are checked again after build and runtime; installed/build
  outputs are intentionally excluded from the immutable-source map.
- Installation is exactly `pnpm install --offline --frozen-lockfile
--ignore-scripts --strict-peer-dependencies` through the bounded direct-Node
  command runner.
- Typecheck, build, browser startup, each runtime contract, tracing, server and
  browser teardown are bounded. Each lane is retained on failure, and later
  lanes still run so one failure cannot conceal the rest of the matrix.
- Every runtime keeps the existing external-request, failed-request, HTTP,
  console-error/warning, page-error, host-upgrade and cleanup checks.

## Runtime truth

React, Vue, Angular and plain TypeScript/HTML are client-rendered fixture
contracts. Their production responses intentionally contain no Fluid DSD, and
their negative controls enforce that boundary.

Astro, Next and SvelteKit generate Fluid DSD during their production build and
serve that static output. Their contracts verify pre-registration DSD,
registration/hydration, retained server-node identity, form/property/event/slot
behavior as applicable, and clean browser/server lifecycle. This is not
request-time SSR.

A separate packed Next production-server gate now proves request-time rendering,
concurrent request isolation, private/no-store semantics and the established
hydration contract in Chromium, Firefox and WebKit. It does not certify deployed
ingress, CDN or hosting-adapter behavior. Adapter-backed Astro or SvelteKit
servers, Angular SSR and Vue/Nuxt SSR remain optional future depth and must not be
inferred from the build-time static DSD results.

## Verification

Focused guard command:

```text
node --test scripts/framework-pinned-profile.test.mjs \
  scripts/framework-packing.test.mjs \
  scripts/framework-commands.test.mjs \
  scripts/framework-runtime.test.mjs
```

Result: 18/18 passing, including exact seven-lane profile shape, original result
hash/status, full bundle hashes, consumer-lock hashes, portable-lock rules,
tamper detection, finite command deadlines, isolation and runtime lifecycle
controls.

Consolidated replay command:

```text
node scripts/check-framework-pinned-profile.mjs
```

Final retained result:

- React: frozen install, typecheck and build passed; 21/21 runtime contract
  records passed across Chromium, Firefox and WebKit.
- Astro, Next, SvelteKit, Vue, Angular and plain TypeScript/HTML: frozen install,
  typecheck and build passed; each retained three passing engine records with no
  runtime failure.
- Aggregate runtime result: 39/39 passing records, zero failures.
- All seven relocated consumers retained identical tarball, lock and source
  hashes before and after installation, build and runtime. All seven owned
  temporary roots and browser/server lifecycles closed.
- The root lock matched the pinned hash before and after the matrix. No root
  dependency state changed.

The original raw-pack failure remains retained as causal evidence under
`quality/evidence/framework-pinned/2026-08-27T17-38-31-941Z/raw-pack-reproducibility/`:

- designated React archive: `bd18b7187e64acdedd8d03a77504934751df931f159ea264c911e1fcfbd44945`;
- immediate repack A: `07aa6d7ff12c6889a3192c09d568908dcfbbb7ce3571b461152a7222c7264366`;
- immediate repack B: `6883244aae707f0a3a3264e61dcb09979ea1c7312f906404edf7be06d9b80719`;
- both original strict final-source comparisons exited 1. Extracted comparison localized
  the observed content drift to key ordering in packed React `package.json`,
  but no normalized-content certification was claimed. The exact-range correction
  subsequently produced 10/10 initial and 5/5 final byte-identical archives at
  SHA-256 `98c3ffe6100e955906b1a4612778c334fd379c3bde0fda591e6c5cf92fc939d9`.

Two earlier causal failures also remain retained:

- `2026-08-27T14-24-35-571Z` rejected a changing root lock before install.
- `2026-08-27T14-47-13-677Z` drained all seven lanes and exposed the missing
  React offline package, a React-specific assertion incorrectly reused by six
  consumers, and Next generated `out/` being mistaken for immutable source.
  React's final-root pin, the generic Fluid-package containment assertion and
  exclusion of generated `out/` close those exact causes. The red result remains
  failed evidence.

The final run used the synchronized pinned Linux container with Node 22.22.2,
pnpm 9.15.0 and the installed Chromium, Firefox and WebKit engines. Every install
command included `--offline`; the earlier missing-package result proves the
runner does not silently fall back to registry access. pnpm's progress label
`downloaded` during successful offline installs refers to importing bytes from
its local content-addressable store, not network resolution.

Scoped ESLint and Prettier pass for the owned scripts/profile and the six
existing runners made import-safe for reuse. `git diff --check` passes. No root
lock, manifest, product runtime, localization source, public documentation,
remote action, commit, tag, push or release was changed by this tranche.

This result closes portable replay for the selected exact artifacts across the
seven representative fixtures and repeatable raw React packing. The separate
packed Next gate adds local request-time SSR evidence. These results do not
certify every catalog element in each framework, approve pinned dependency
versions for security support, or prove deployed hosting adapters.
