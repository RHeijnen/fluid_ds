# Astro packed SSR contract review — 2026-08-27

## Outcome

The Astro fixture now exercises a real production static-SSR path against packed
`@fluid-ds/tokens`, `@fluid-ds/icons`, and `@fluid-ds/components` tarballs. The retained green
run passed install, typecheck, build, and runtime assertions in Chromium, Firefox, and WebKit.

This closes the first Astro slice of production-readiness plan item 4. It does not certify an
on-demand Astro adapter, the full component catalog, or the other framework fixtures.

## Owned changes

- `apps/framework-astro/src/pages/index.astro` renders four Fluid elements on the server through
  the public `@fluid-ds/components/ssr` entry and emits declarative shadow DOM.
- `apps/framework-astro/src/client.ts` deliberately delays custom-element registration, captures
  server nodes and native form state, registers only through public `define/*` entries, restores
  form state, and exposes a narrow runtime probe for the packed check.
- `apps/framework-astro/package.json` declares `lit` directly because the Astro server template
  imports it directly.
- `scripts/check-framework-astro-ssr.mjs` packs the three publishable packages, installs a copied
  consumer with strict peers and lifecycle scripts disabled, validates package isolation and
  public built exports, runs Astro checks/build, serves `dist`, and drives all browser engines.

The shared root lockfile was intentionally not edited in this ownership slice. Its already-dirty
workspace reconciliation remains with the integration owner; the retained consumer lock proves
the fixture resolves independently from packed artifacts.

## Contract proved

The browser assertions cover all of the following on the production build:

- the HTTP response contains exactly four open declarative shadow roots, including delegated
  focus on the input;
- `fluid-button`, `fluid-card`, `fluid-checkbox`, and `fluid-input` remain undefined until an
  explicit delayed registration call;
- the four original hosts and their four server-created shadow roots retain object identity after
  registration/hydration;
- header, body, footer, and input-prefix slots retain their assigned nodes;
- native input value, checkbox checked state, focus, and selection edited before registration are
  captured and restored through the public SSR client helper;
- post-hydration `label` and `helpText` property updates render;
- the Fluid input event crosses the Astro boundary;
- Fluid submit participation produces the expected `FormData`, and a native form reset restores
  server defaults;
- page errors, error/warning console messages, failed requests, external requests, and HTTP 4xx/5xx
  responses are all rejected.

The response is also checked for workspace source-path leakage. Installed package realpaths must
stay inside the copied consumer, and the packed component manifest must expose built `dist` SSR
and SSR-client entries rather than source files.

## Retained evidence

Green evidence is retained at
`quality/evidence/framework-astro/2026-08-27T12-01-00-412Z/` (gitignored). It includes:

- the three exact tarballs and their SHA-256 hashes;
- the copied fixture, generated consumer lock, and their SHA-256 hashes (nine hash records total);
- pack/install/typecheck/build logs plus direct-child exit records;
- the production server response;
- Chromium 148.0.7778.96, Firefox 150.0.2, and WebKit 26.4 traces;
- `runtime/runtime.json` with three passes, no failures, and observed browser-server exits.

The causal red run is retained at
`quality/evidence/framework-astro/2026-08-27T11-53-00-189Z/`. It demonstrated that assigning a
render-affecting Fluid property (`helpText`) before registration changes the client template ahead
of Lit hydration and causes `Hydration value mismatch: Unexpected TemplateResult rendered to
part` in all three engines. The final contract therefore applies pre-registration edits only to
native form state, which is the supported capture/restore boundary, and tests Fluid properties
after hydration.

## Commands and results

Run in the repository Linux browser container with Node v22.22.2 and pnpm 9.15.0:

```text
node scripts/check-framework-astro-ssr.mjs
```

The runner internally executed three `pnpm pack --pack-destination ...` commands followed by:

```text
pnpm install --no-frozen-lockfile --ignore-scripts --strict-peer-dependencies
pnpm run typecheck
pnpm run build
```

Final focused workspace verification also passed:

```text
pnpm --filter @fluid-ds/framework-astro typecheck
pnpm --filter @fluid-ds/framework-astro build
pnpm exec eslint apps/framework-astro/src/client.ts scripts/check-framework-astro-ssr.mjs
```

`astro check` reported 0 errors, 0 warnings, and 0 hints. The production static build generated
one route successfully. ESLint reported no findings.

## Explicit limitations and follow-up

- Astro currently emits production static SSR during `astro build`; an adapter-backed on-demand
  server needs its own fixture and evidence if that deployment mode is supported.
- This is a latest-compatible installation lane. The retained lock and tarballs make a frozen
  replay possible, but this runner does not perform a second frozen install.
- Four representative core elements do not replace catalog-wide SSR or framework coverage.
- Tarballs package the repository's existing built `dist`; source-to-dist equivalence remains the
  responsibility of the separate package build and artifact gates.
- The integration owner must reconcile the root `pnpm-lock.yaml` entry for the fixture's direct
  `lit` dependency together with the other concurrent lockfile changes.
