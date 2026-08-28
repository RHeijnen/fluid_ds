# SvelteKit packed SSR contract review — 2026-08-27

## Outcome

The SvelteKit fixture now renders a representative Fluid contract through its server load path and
ships declarative shadow DOM in the production artifact. A latest-compatible isolated consumer
installed packed Fluid tarballs, passed strict peer resolution, `svelte-check`, and the production
build, then passed the runtime contract in Chromium, Firefox, and WebKit with no captured
hydration, page, console, HTTP, or network errors.

This closes the SvelteKit static-adapter slice of production-readiness plan item 4. It does not
prove request-time SvelteKit SSR: this fixture explicitly uses `adapter-static` and
`prerender = true`, so its server load and SSR render execute during `vite build` and their result
is written to `build/index.html`.

## Owned changes

- `apps/framework-sveltekit/src/routes/+page.server.ts` loads Fluid's SSR shim before four public
  definition entries and creates the Lit SSR contract during SvelteKit prerender.
- `apps/framework-sveltekit/src/routes/+page.svelte` injects that trusted server result, loads only
  SSR hydration support initially, captures server nodes, and exposes explicit delayed
  registration plus the runtime probes.
- `apps/framework-sveltekit/package.json` declares `lit` directly because the server load directly
  imports `html` from `lit`.
- `scripts/check-framework-sveltekit-ssr.mjs` packs, installs, checks, builds, serves only the
  static-adapter output, and drives the three browser engines.

The shared root lockfile was not edited. The integration owner must add `lit: ^3.2.1` to the
`apps/framework-sveltekit` importer while reconciling the other concurrent lockfile changes.

## Packed-artifact boundary

The runner packs `@fluid-ds/tokens`, `@fluid-ds/icons`, and `@fluid-ds/components`. The copied
consumer references tokens and components through sibling retained tarballs, while a package-level
override forces the component package's real icons dependency to the retained icons tarball.

The portable consumer lock may contain neither `workspace:` nor `link:` resolution. Installed
Fluid realpaths must remain inside the copied consumer; component exports must contain published
`dist` JavaScript for SSR and SSR-client and must not expose workspace TypeScript. Installation
uses `--ignore-scripts --strict-peer-dependencies`, so workspace lifecycle hooks cannot prepare the
consumer implicitly.

## Runtime contract proved

The production response and live page prove:

- four open Fluid declarative shadow roots are present before client registration, including
  delegated focus on the input;
- button, card, checkbox, and input definitions remain absent after Svelte hydration until the
  explicit registration call;
- all four server hosts and their four server-created shadow roots retain identity through Fluid
  hydration;
- card header/default/footer and input prefix slots keep their assigned server nodes;
- native input value, checkbox checked state, focus, and text selection edited before registration
  survive capture, upgrade, and restoration;
- post-hydration `label` and `helpText` property changes render;
- a Fluid input event crosses the Svelte boundary;
- Fluid submit participation produces the expected `FormData`, and native reset restores server
  defaults;
- external requests, failed requests, HTTP 4xx/5xx, page exceptions, and error/warning console
  messages are rejected.

The response is also rejected if it leaks workspace source, `node_modules`, or component source
paths.

## Retained evidence

Green evidence is retained at
`quality/evidence/framework-sveltekit/2026-08-27T12-21-00-329Z/` (gitignored). It contains the
three tarballs, copied fixture, portable consumer lock, 12 SHA-256 records, individual command logs
and child-exit records, production response, runtime result, and traces for Chromium
148.0.7778.96, Firefox 150.0.2, and WebKit 26.4. All engines passed and all browser-server exits
were observed.

The causal implementation red is retained at
`quality/evidence/framework-sveltekit/2026-08-27-initial-typecheck-red/result.json`. The initial
component placed `declare global` inside a Svelte instance script. `svelte-check` rejected that
ambient declaration and the two resulting `window.svelteFluid` accesses. The final implementation
uses a local intersection type inside `onMount`, which keeps the browser probe typed without an
ambient declaration. The intermediate failing source was corrected before the packed run and is
therefore honestly marked non-replayable in the retained record. The first packed runtime run was
green; no failing browser trace is represented as though one occurred.

## Commands and results

The authoritative run used the repository Linux browser container with Node v22.22.2 and pnpm
9.15.0:

```text
node scripts/check-framework-sveltekit-ssr.mjs
```

The runner internally executed three `pnpm pack --pack-destination ...` commands and then, inside
the copied consumer:

```text
pnpm install --no-frozen-lockfile --ignore-scripts --strict-peer-dependencies
pnpm run typecheck
pnpm run build
```

Focused workspace and formatting verification:

```text
pnpm --filter @fluid-ds/framework-sveltekit typecheck
pnpm --filter @fluid-ds/framework-sveltekit build
pnpm exec eslint apps/framework-sveltekit/src/routes/+page.server.ts scripts/check-framework-sveltekit-ssr.mjs
pnpm exec prettier --check apps/framework-sveltekit/package.json apps/framework-sveltekit/src/routes/+page.server.ts scripts/check-framework-sveltekit-ssr.mjs docs/reviews/framework-sveltekit-packed-ssr-contract-2026-08-27.md
git diff --check -- apps/framework-sveltekit scripts/check-framework-sveltekit-ssr.mjs docs/reviews/framework-sveltekit-packed-ssr-contract-2026-08-27.md
```

`svelte-check` reported 0 errors and 0 warnings. The build log explicitly records separate SSR and
client compilation phases followed by `Using @sveltejs/adapter-static` and `Wrote site to
"build"`.

## Explicit limitations

- No request-time Node, serverless, or edge adapter is configured. Such deployment modes require a
  separate fixture and runtime server evidence.
- This is a latest-compatible lane. The retained lock and tarballs permit a later frozen replay,
  but the runner does not perform that second install.
- Four representative elements do not provide catalog-wide or cross-framework certification.
- The tarballs contain the repository's existing built `dist`; source-to-dist equivalence belongs
  to the separate package build and artifact gates.
- The `{@html ...}` boundary is appropriate only because the string is generated by Fluid's trusted
  server renderer. It must not be reused for untrusted application content.
