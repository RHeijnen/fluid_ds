# Plain TypeScript/HTML packed runtime contract review — 2026-08-27

## Outcome

A new no-framework fixture now proves direct Fluid consumption from plain authored HTML and a
TypeScript client entry. An isolated latest-compatible consumer installed packed Fluid artifacts,
passed strict peer resolution, TypeScript, and the Vite production build, then passed runtime
assertions in Chromium, Firefox, and WebKit with no captured page, console, HTTP, or network
errors.

This is not SSR. The production response contains four authored Fluid light-DOM hosts but zero
declarative shadow roots. The hosts become functional only when the client explicitly imports the
definition modules. There is no server renderer or hydration path.

## Owned changes

- `apps/framework-vanilla/` is a self-contained package with plain `index.html`, strict
  `tsconfig.json`, a minimal Vite build, and no framework dependency.
- `apps/framework-vanilla/src/main.ts` holds stable direct element references, performs direct
  property writes before and after upgrade, verifies typed custom-event payloads, and exposes an
  explicit lazy registration boundary.
- `scripts/check-framework-vanilla-runtime.mjs` packs and installs the fixture, verifies isolation,
  builds it, serves only `dist`, and drives the three browser engines.

## Root importer reconciliation required

Because `apps/framework-vanilla` is a new workspace package, the integration owner must add its
importer to `pnpm-lock.yaml`. The importer must reflect exactly:

```text
dependencies:
  @fluid-ds/components: workspace:*
  @fluid-ds/tokens: workspace:*
devDependencies:
  typescript: ^5.7.2
  vite: ^7.1.3
```

No existing root manifest entry is required; the current workspace glob already includes
`apps/*`. This ownership slice did not edit the shared lockfile.

## Packed-artifact boundary

The runner packs `@fluid-ds/tokens`, `@fluid-ds/icons`, and `@fluid-ds/components`. The copied
consumer replaces its token and component workspace specs with sibling retained tarballs, while a
package-level override resolves the component package's real icons dependency to the retained
icons tarball.

The portable lock may contain neither `workspace:` nor `link:` resolution. Installed Fluid
realpaths must remain inside the copied consumer, and component exports must not expose workspace
TypeScript. Installation uses `--ignore-scripts --strict-peer-dependencies`, so no workspace
lifecycle or symlink can prepare the consumer.

## Runtime contract proved

The production assertions prove:

- all four custom elements remain undefined with no shadow roots after the plain module loads;
- direct input `value` and `label` property writes made while the element is undefined survive the
  platform upgrade and render inside the new shadow root;
- explicit lazy registration loads button, card, checkbox, and input through public `define/*`
  entries;
- the four direct `querySelector` references continue to identify the same connected hosts after
  upgrade, interaction, submit, and reset;
- card header/default/footer and input prefix nodes project through the expected slots;
- direct post-upgrade `value` and `label` writes render;
- typed input/change and checkbox-change listeners receive the exact `{ value }` and `{ checked }`
  payloads;
- the form-associated input and checkbox produce the expected `FormData`, and the Fluid submit
  button reaches the native form listener;
- native reset restores the authored `value="Reset value"` and `checked` defaults;
- external requests, failed requests, HTTP 4xx/5xx, page exceptions, and error/warning console
  entries are rejected.

The served response is also rejected if it leaks workspace source, `node_modules`, or component
source paths.

## Retained evidence

Green evidence is retained at
`quality/evidence/framework-vanilla/2026-08-27T12-42-37-799Z/` (gitignored). It contains the three
tarballs, copied fixture, portable consumer lock, eight SHA-256 records, command logs and child-exit
records, production response, runtime result, and traces for Chromium 148.0.7778.96, Firefox
150.0.2, and WebKit 26.4. All engines passed and every browser-server exit was observed.

The causal workspace red is retained at
`quality/evidence/framework-vanilla/2026-08-27-workspace-importer-red/result.json`. Before shared
lock reconciliation, a scoped workspace typecheck correctly failed because the newly introduced
package had no dependency links and pnpm reported the local package without `node_modules`. The
authoritative isolated lane then replaced workspace specs with retained tarballs, installed the
fixture independently, and passed typecheck/build/runtime. The red remains replayable until the
integration owner adds the importer.

The green evidence's `runtime/ssr-negative-control.json` records the expected-negative SSR
assertion: the response contains the four authored hosts but zero DSD because no server renderer is
configured.

## Commands and results

The authoritative run used the repository Linux browser container with Node v22.22.2 and pnpm
9.15.0:

```text
node scripts/check-framework-vanilla-runtime.mjs
```

The runner internally executed three `pnpm pack --pack-destination ...` commands and then, inside
the copied consumer:

```text
pnpm install --no-frozen-lockfile --ignore-scripts --strict-peer-dependencies
pnpm run typecheck
pnpm run build
```

Formatting and source validation:

```text
pnpm exec eslint apps/framework-vanilla/src/main.ts scripts/check-framework-vanilla-runtime.mjs
pnpm exec prettier --check apps/framework-vanilla/package.json apps/framework-vanilla/tsconfig.json apps/framework-vanilla/index.html apps/framework-vanilla/src/main.ts scripts/check-framework-vanilla-runtime.mjs docs/reviews/framework-vanilla-packed-runtime-contract-2026-08-27.md
git diff --check -- apps/framework-vanilla scripts/check-framework-vanilla-runtime.mjs docs/reviews/framework-vanilla-packed-runtime-contract-2026-08-27.md
```

A scoped workspace typecheck/build should be replayed only after the root lock importer is
reconciled; claiming it green beforehand would conceal the missing workspace installation.

## Explicit limitations

- The fixture has no server renderer, DSD, or hydration contract. It proves static authored HTML
  plus client-side custom-element upgrade.
- This is a latest-compatible lane. The retained lock and tarballs permit a later frozen replay,
  but the runner does not perform a second frozen install.
- Four representative core elements do not certify the full catalog or framework integrations.
- The tarballs contain the repository's existing built `dist`; source-to-dist equivalence belongs
  to the separate package build and artifact gates.
