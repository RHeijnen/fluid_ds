# React event-payload mapping tranche — 2026-08-27

## Outcome

The initial audit found one narrow source contract that could be completed without inference. Follow-up batches added anchor-nav, eight core-form contracts, and eight overlay/navigation lifecycle contracts. The current source-derived canonical inventory has 166 events: 38 have a named, exported event alias plus verified dispatch evidence, and 128 remain `CustomEvent<unknown>`.

| State | Before | After |
| --- | ---: | ---: |
| Verified typed event contracts | 21 | 38 |
| Honest `CustomEvent<unknown>` contracts | 145 | 128 |
| Total events | 166 | 166 |

Seventeen events have now been promoted across the implementation tranches. Changing the remaining denominator safely requires separate product-source contract work.

## Evidence boundary

The canonical analyzer in `scripts/cem/event-contracts.mjs` promotes an event only when all of these facts agree:

1. The public event annotation names an event alias.
2. The alias is exported from the package barrel and explicitly aliases `CustomEvent<Detail>`.
3. Every referenced detail type is public and does not conceal `any`.
4. At least one literal dispatch exists.
5. Every matching dispatch has an explicit, compatible generic and exactly one explicit object-literal or `null` detail initializer.
6. Canonical CEM records the exact public reference and `x-fluid-event-contract` verification evidence consumed by React generation.

The audit searched all non-test package sources for explicit `new CustomEvent<...>` dispatches. The one additional generic dispatch was anchor-nav's `fluid-active-change`. Its runtime payload was already exactly `{ id: string | null }`; this tranche named that shape `FluidAnchorNavActiveChangeDetail`, added `FluidAnchorNavActiveChangeEvent`, exported both from the public component barrel, changed the public `@fires` annotation and dispatch generic to those names, and preserved the emitted object literal unchanged.

Canonical analysis now proves one literal dispatch, the exact detail alias, the public event reference, and `explicit-dispatch-generic` verification metadata. React generation consumes that evidence and emits `FluidAnchorNavActiveChangeEvent` for both the wrapper's `onFluidActiveChange` callback and intrinsic JSX's `onfluid-active-change` callback.

The core-forms batch adds these exact contracts without changing any dispatched object:

| Component | Events | Exact detail shape |
| --- | --- | --- |
| `fluid-file-input` | `fluid-change` | `{ files: File[]; value: string }` |
| `fluid-dropzone` | `fluid-change` | `{ files: File[] }` |
| `fluid-dropzone` | `fluid-reject` | `{ files: File[]; reason: "type" \| "size" }` |
| `fluid-form` | `fluid-submit` | `{ values: { [name: string]: string \| string[] } }` |
| `fluid-form` | `fluid-invalid` | `{ invalid: HTMLElement }` |
| `fluid-rating` | `fluid-change` | `{ value: number }` |
| `fluid-otp` | `fluid-input`, `fluid-complete` | `{ value: string }` |

The CEM validator's closed platform-type allowlist now recognizes `File` and `HTMLElement`; arbitrary external or application types still fail closed. Events with omitted detail, dynamic names, application-generic data, or ambiguous payloads remain unknown.

The overlay/navigation batch adds eight exact `CustomEvent<null>` contracts: tooltip show/hide, dropdown show/hide, context-menu show/hide, callout dismiss, and banner dismiss. These events previously relied on the platform's omitted-detail default, which is observably `null`; their dispatches now state `detail: null` explicitly while preserving event timing, names, bubbling, composition, and runtime detail. Dropdown selection remains unknown because its payload includes a component instance, and context-menu selection remains unknown because it re-bubbles a child event rather than owning a literal dispatch.

The other unknown events either have no explicit dispatch generic or use dynamic dispatch names. Prose descriptions and object-literal shapes were not treated as public type evidence.

## Regression coverage added

- `packages/react/scripts/event-props.test.mjs` now checks all 38 typed wrapper and intrinsic JSX mappings, not only a 15-event subset.
- The same test counts exactly 128 remaining unknown generated wrapper mappings.
- Anchor-nav's browser test imports the types through the public barrel, verifies the runtime detail remains exactly `{ id: "details" }`, proves the nullable-string shape, and includes a TypeScript negative assertion for numeric ids.
- The canonical repository test verifies anchor-nav's exact public reference and detail metadata.
- Each affected form-control browser test imports its new contract through the public barrel, asserts the existing runtime payload shape, and rejects an incompatible assignment with `@ts-expect-error`.
- The canonical repository test verifies all eight form contracts, their exact public references and detail types, and the expected literal dispatch counts.
- Each affected overlay/navigation browser test imports its lifecycle alias from the public barrel, verifies `detail === null`, and rejects non-null assignments.
- Canonical analysis verifies all eight lifecycle aliases as public `null` contracts with one literal dispatch each.
- `scripts/cem/canonical.test.mjs` now has a literal absent-dispatch negative fixture in addition to its untyped dispatch, incompatible generic, missing detail, dynamic-name, inline annotation, hidden `any`, and hidden `unknown` guards.
- React generation was rerun from current source-derived canonical manifests in the isolated Linux verification copy. Generated wrapper changes are limited to the promoted component set plus the components intrinsic JSX declaration.

## Verification

Green in the isolated Linux workspace after synchronizing current package sources and generating canonical manifests only in that disposable verification copy:

```text
node scripts/cem/generate.mjs
  Generated 14 canonical manifests for 155 registered elements.

FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs --config web-test-runner.config.js --files src/components/anchor-nav/fluid-anchor-nav.test.ts
  Chromium: 16 passed; Firefox: 16 passed; WebKit: 16 passed.

FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs --config web-test-runner.config.js --files "src/components/{file-input,dropzone,form,rating,otp}/*.test.ts"
  Chromium: 126 passed; Firefox: 126 passed; WebKit: 126 passed.

FLUID_BROWSERS=all node ../../scripts/run-web-tests.mjs --config web-test-runner.config.js --files "src/components/{tooltip,dropdown,context-menu,callout,banner}/*.test.ts"
  Chromium: 72 passed; Firefox: 72 passed; WebKit: 72 passed.

pnpm --filter @fluid-ds/components typecheck
pnpm --filter @fluid-ds/components build
  source typecheck and package build passed; canonical analysis completed.

pnpm --filter @fluid-ds/react test
  Verified exact output for 155 React wrappers from 14 source-verified canonical CEMs.
  9 tests passed; TypeScript no-emit passed.

pnpm --filter @fluid-ds/react build
  Generated 155 React wrappers; build passed.

node --test scripts/cem/canonical.test.mjs
  17 tests passed, including the narrow platform-type allowlist guard.

pnpm test:package-artifacts
  32 tests passed.

pnpm check:packages
  18 publishable package targets passed.

pnpm exec eslint <owned component sources/tests, barrel, React event test, CEM contract files>
  passed with no findings.

pnpm check:docs
  documentation build passed; 7 link-check unit tests and 24,231 rendered links passed.
```

A direct host `pnpm --filter @fluid-ds/react test` was blocked before project tests by the repository dependency guard because the concurrently modified `pnpm-lock.yaml` contains `xlsx@0.20.3` without integrity metadata. Direct Node execution of the owned React and canonical suites passed 25/25 before this follow-up. The repository's persisted canonical manifests were deliberately not changed here; concurrent product-source work currently makes them stale, so root reconciliation must regenerate/check those manifests before the normal host React generation gate can pass.

## Follow-up ownership

Product-package owners must establish future event contracts at the dispatch source: exported detail types, exported `CustomEvent<Detail>` aliases, matching public annotations, explicit literal dispatch generics, and explicit checked detail initialization. Once canonical CEM carries that evidence, the existing React generator will import and emit the precise alias automatically. No package-local React override table should be introduced.
