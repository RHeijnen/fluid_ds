# Angular packed runtime contract review — 2026-08-27

## Outcome

The Angular app now has a dedicated production consumer configuration for a focused Fluid
contract. An isolated latest-compatible consumer installed five packed Fluid packages, passed
strict peer resolution, contract typecheck, and the Angular production build, then passed runtime
assertions in Chromium, Firefox, and WebKit with no captured page, console, HTTP, or network
errors.

This is explicitly a CSR contract. The configuration uses Angular's browser application builder
with `src/contract-main.ts` and has no server entry, Angular SSR application, or hydration provider.
Its production response contains an empty `<app-root></app-root>`, zero Fluid hosts, and zero
declarative shadow roots. No SSR or hydration claim is made.

## Owned changes

- `apps/admin-angular/src/contract-main.ts` defines a standalone Angular contract component with
  property binding, typed Fluid payload casts, `ElementRef` queries, content projection, and form
  behavior. Angular bootstraps while Fluid remains undefined and exposes explicit lazy
  registration.
- `apps/admin-angular/angular.json` adds an isolated `contract` production configuration with its
  own browser entry, TypeScript config, output directory, and only the token styles needed by the
  contract. The existing admin build remains unchanged.
- `apps/admin-angular/tsconfig.contract.json` points Angular's bundler at installed published
  definition JavaScript.
- `apps/admin-angular/tsconfig.contract-typecheck.json` points standalone typecheck at the matching
  published declarations.
- `apps/admin-angular/src/contract-fluid-defines.d.ts` declares the four side-effect-only lazy
  definition modules for Angular's compiler while element and event types still come from the
  published component index declarations.
- `scripts/check-framework-angular-runtime.mjs` packs and installs the consumer, rewrites only the
  copied manifest's scripts, verifies isolation, builds it, serves only the contract browser output,
  and drives all three engines.

No dependency entry changed in `apps/admin-angular/package.json`; this lane therefore requires no
root `pnpm-lock.yaml` importer edit. The shared lockfile was not touched.

## Packed-artifact boundary

The retained consumer installs tarballs for `@fluid-ds/tokens`, `@fluid-ds/themes`,
`@fluid-ds/icons`, `@fluid-ds/components`, and `@fluid-ds/charts`. Every direct Fluid spec must
point to a sibling retained tarball and every installed realpath must stay within the copied
consumer. Compiled component, chart, and icon exports must not expose workspace TypeScript.

The portable consumer lock may contain neither `workspace:` nor `link:` resolution. The copied
manifest removes `prebuild` and `predev`, then runs the contract-specific typecheck/build.
Installation uses `--ignore-scripts --strict-peer-dependencies`; neither workspace lifecycle
builds nor symlinks can provide the result.

## Runtime contract proved

The production browser assertions prove:

- Angular creates the four Fluid hosts while button, card, checkbox, and input remain undefined and
  have no shadow roots;
- explicit lazy registration loads four separate production chunks through public `define/*`
  entries and upgrades every host;
- the Angular property binding reaches the upgraded input, a signal update changes both the host
  property and native control, and a typed `ElementRef` label mutation renders;
- `@ViewChild` references resolve to the real input and checkbox hosts and remain stable after
  interaction and reset;
- card header/default/footer and input prefix nodes project through the expected slots;
- Angular handlers verify exact `{ value }` payloads for `fluid-input` and input `fluid-change`,
  plus `{ checked }` for checkbox `fluid-change`;
- the form-associated input and checkbox produce the expected `FormData`, and the Fluid submit
  button reaches the Angular submit handler;
- native reset calls the Fluid reset behavior. The input resets empty because its initial Angular
  binding is a live property rather than a reset-defining attribute; the checkbox returns checked
  because its template contains the static `checked` default;
- external requests, failed requests, HTTP 4xx/5xx, page exceptions, and error/warning console
  entries are rejected.

The production response is also rejected if it leaks workspace source, `node_modules`, or
component source paths.

## Retained evidence

Green evidence is retained at
`quality/evidence/framework-angular/2026-08-27T12-37-09-044Z/` (gitignored). It contains five
tarballs, the copied fixture, portable consumer lock, 29 SHA-256 records, individual command logs
and child-exit records, the production response, CSR negative control, runtime result, and traces
for Chromium 148.0.7778.96, Firefox 150.0.2, and WebKit 26.4. All three engines passed and every
browser-server exit was observed.

The causal packed red is retained at
`quality/evidence/framework-angular/2026-08-27T12-36-23-030Z/`. Its isolated install and typecheck
passed, but Angular's production compiler rejected all four packed lazy definition imports with
TS7016 because the runtime path mapping intentionally selected installed `.js` and the compiler did
not associate the adjacent declarations in pnpm's packed store. The narrow ambient declarations
resolve only those side-effect module types; the separate typecheck config continues to resolve
the real published `.d.ts` files. The subsequent packed run passed.

The green evidence's `runtime/ssr-negative-control.json` records the expected-negative SSR
assertion: both Fluid-host and declarative-shadow-root counts are zero because this configuration
has no Angular server entry.

## Commands and results

The authoritative run used the repository Linux browser container with Node v22.22.2 and pnpm
9.15.0:

```text
node scripts/check-framework-angular-runtime.mjs
```

The runner internally executed five `pnpm pack --pack-destination ...` commands and then, inside
the copied consumer:

```text
pnpm install --no-frozen-lockfile --ignore-scripts --strict-peer-dependencies
pnpm run typecheck
pnpm run build
```

Focused workspace and formatting verification:

```text
pnpm --filter @fluid-ds/admin-angular exec tsc --noEmit -p tsconfig.contract-typecheck.json
pnpm --filter @fluid-ds/admin-angular exec ng build --configuration contract
pnpm exec eslint apps/admin-angular/src/contract-main.ts scripts/check-framework-angular-runtime.mjs
pnpm exec prettier --check apps/admin-angular/angular.json apps/admin-angular/tsconfig.contract.json apps/admin-angular/tsconfig.contract-typecheck.json apps/admin-angular/src/contract-main.ts scripts/check-framework-angular-runtime.mjs docs/reviews/framework-angular-packed-runtime-contract-2026-08-27.md
git diff --check -- apps/admin-angular scripts/check-framework-angular-runtime.mjs docs/reviews/framework-angular-packed-runtime-contract-2026-08-27.md
```

The production build records four distinct lazy `define` chunks plus the shared component chunks.

## Explicit limitations

- Angular SSR, declarative shadow DOM, server-node retention, and Angular hydration are unsupported
  by this browser-only configuration. They require a separate Angular SSR fixture.
- This is a latest-compatible lane. The retained lock and tarballs permit a later frozen replay,
  but the runner does not perform a second frozen install.
- Four representative core elements do not certify the full catalog or other frameworks.
- The tarballs contain the repository's existing built `dist`; source-to-dist equivalence belongs
  to the separate package build and artifact gates.
- Angular live property bindings do not establish native form reset defaults. Consumers needing a
  non-empty reset value should also provide a reset-defining attribute or synchronize reset in
  application state.
