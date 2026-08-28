# Vue packed runtime contract review — 2026-08-27

## Outcome

The Vue fixture now exercises a representative production consumer contract against packed Fluid
artifacts. An isolated latest-compatible consumer passed strict peer installation, `vue-tsc`, the
Vite production build, and the runtime contract in Chromium, Firefox, and WebKit with no captured
page, console, HTTP, or network errors.

This is explicitly a CSR contract. The fixture uses `createApp` from a Vite client entry and has no
Vue server renderer, SSR entry, or hydration call. Its production HTML contains an empty
`<div id="app"></div>`, zero Fluid hosts, and zero declarative shadow roots. No SSR or hydration
claim is made.

## Owned changes

- `apps/framework-vue/src/App.vue` now covers typed Fluid event handlers and payloads, Vue `.prop`
  binding, element refs, named/default slots, form association, submit, and reset.
- `apps/framework-vue/src/main.ts` mounts Vue while the Fluid tags are still undefined, exposes an
  explicit lazy registration operation, imports four public definition entries only when asked,
  and observes upgrade completion.
- `scripts/check-framework-vue-runtime.mjs` packs and installs the consumer, verifies isolation,
  builds it, serves only `dist`, and drives the three browser engines.

No dependency entry changed in `apps/framework-vue/package.json`; therefore this lane requires no
root `pnpm-lock.yaml` importer edit. The shared lockfile was not touched.

## Packed-artifact boundary

The runner packs `@fluid-ds/tokens`, `@fluid-ds/icons`, and `@fluid-ds/components`. The copied
consumer references tokens and components through sibling retained tarballs, and an exact
package-level override resolves the component package's real icons dependency from the retained
icons tarball.

The retained lock may contain neither `workspace:` nor `link:` resolution. Installed Fluid
realpaths must stay inside the copied consumer, and component exports must not expose workspace
TypeScript. Installation uses `--ignore-scripts --strict-peer-dependencies`, preventing workspace
lifecycle preparation from supplying the result.

## Runtime contract proved

The production build and browser assertions prove:

- Vue mounts the four Fluid hosts while their custom-element definitions are still absent and the
  hosts still have no shadow roots;
- explicit lazy registration upgrades button, card, checkbox, and input through public
  `define/*` entries;
- Vue template refs resolve to the actual `fluid-input` and `fluid-checkbox` DOM elements and
  remain stable after interaction and reset;
- card header/default/footer and input prefix slots retain the expected assigned nodes;
- the initial `.prop` input binding reaches the upgraded `FluidInput`, a Vue reactive state update
  changes the property and rendered native input, and a direct typed element-ref label update
  renders;
- typed `FluidInputInputEvent`, `FluidInputChangeEvent`, and `FluidCheckboxChangeEvent` handlers
  receive their exact `{ value }` and `{ checked }` payloads across the Vue template boundary;
- the input and checkbox participate in native `FormData`, and a Fluid submit button triggers the
  Vue form handler with the expected values;
- native form reset executes the components' reset callbacks. Because Vue supplied the initial
  values as live `.prop` state rather than reset-defining HTML attributes, the proven reset defaults
  are empty input and unchecked checkbox;
- external requests, failed requests, HTTP 4xx/5xx, page exceptions, and error/warning console
  entries are rejected.

The served HTML is also rejected if it leaks workspace source, `node_modules`, or component source
paths.

## Retained evidence

Evidence is retained at `quality/evidence/framework-vue/2026-08-27T12-28-38-622Z/` (gitignored).
It contains the three tarballs, copied fixture, portable consumer lock, 11 SHA-256 records,
individual command logs and child-exit records, production response, runtime result, and traces
for Chromium 148.0.7778.96, Firefox 150.0.2, and WebKit 26.4. All engines passed and every
browser-server exit was observed.

The required causal red boundary is retained as
`runtime/ssr-negative-control.json`. It records an expected-negative SSR assertion against the
actual production response: Fluid host count is 0 and declarative-shadow-root count is 0 because
the designated fixture has only a client entry. The packed browser implementation itself passed on
its first run, so no failing hydration trace is presented as though one existed.

## Commands and results

The authoritative run used the repository Linux browser container with Node v22.22.2 and pnpm
9.15.0:

```text
node scripts/check-framework-vue-runtime.mjs
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
pnpm --filter @fluid-ds/framework-vue typecheck
pnpm --filter @fluid-ds/framework-vue build
pnpm exec eslint apps/framework-vue/src/main.ts scripts/check-framework-vue-runtime.mjs
pnpm exec prettier --check apps/framework-vue/src/main.ts scripts/check-framework-vue-runtime.mjs docs/reviews/framework-vue-packed-runtime-contract-2026-08-27.md
git diff --check -- apps/framework-vue scripts/check-framework-vue-runtime.mjs docs/reviews/framework-vue-packed-runtime-contract-2026-08-27.md
```

The Vite log records only a client production environment, reinforcing the CSR boundary.

## Explicit limitations

- SSR, declarative shadow DOM, server-node retention, and framework hydration are unsupported by
  this fixture. A Vue SSR/Nuxt fixture would be required for those claims.
- This is a latest-compatible lane. The retained lock and tarballs permit later frozen replay, but
  the runner does not perform a second frozen install.
- Four representative core elements do not certify the full catalog or other frameworks.
- The tarballs contain the repository's existing built `dist`; source-to-dist equivalence belongs
  to the separate package build and artifact gates.
- Vue live property bindings do not automatically establish native form reset defaults. Consumers
  that require non-empty/non-false reset values should also provide reset-defining attributes or
  handle reset in application state.
