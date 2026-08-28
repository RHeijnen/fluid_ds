# Next.js packed SSR contract review — 2026-08-27

## Outcome

The designated Next.js App Router fixture now contains a focused Fluid SSR contract route. An
isolated latest-compatible consumer installed six packed Fluid packages, passed strict peer
resolution, typecheck, and a production build, then passed the runtime contract in Chromium,
Firefox, and WebKit with no captured hydration, page, console, HTTP, or network errors.

This closes the Next.js static-export slice of production-readiness plan item 4. The app's
configured deployment mode is `output: "export"`; the result proves server rendering performed
during `next build`, not request-time rendering by a Node or edge adapter.

## Owned changes

- `apps/admin-next/app/ssr-contract/page.tsx` is a server component that loads Fluid's SSR shim
  before four public definition entries and renders the Lit template through
  `renderFluidToString`.
- `apps/admin-next/app/ssr-contract/contract-client.tsx` loads only the SSR hydration support at
  startup. It captures original server hosts and roots, exposes explicit delayed registration,
  and observes properties, events, slots, and forms.
- `apps/admin-next/src/Shell.tsx` excludes the contract route from the demo shell's normal eager
  post-mount registration while preserving that behavior for every other route.
- `apps/admin-next/package.json` declares `lit` directly because the server contract directly
  imports `html` from `lit`.
- `scripts/check-framework-next-ssr.mjs` packs and installs the fixture, verifies artifact
  isolation, builds it, serves only its production export (including Next RSC `.txt` assets), and
  drives the cross-browser contract.

The shared root lockfile was intentionally not edited. The integration owner must add the direct
`lit` dependency to the `apps/admin-next` importer while reconciling the other concurrent lockfile
changes.

## Packed-artifact boundary

The retained consumer installs tarballs for:

- `@fluid-ds/tokens`
- `@fluid-ds/themes`
- `@fluid-ds/icons`
- `@fluid-ds/components`
- `@fluid-ds/charts`
- `@fluid-ds/react`

All direct Fluid dependency specs must point to sibling retained tarballs, all installed realpaths
must remain inside the copied consumer, and the lock must contain no `workspace:` or `link:`
resolution. Components, charts, and React exports must not expose workspace TypeScript; the
component SSR and SSR-client entries must resolve to published `dist` JavaScript.

Install uses `--ignore-scripts --strict-peer-dependencies`, and workspace lifecycle hooks are
removed from the copied manifest. Build success therefore cannot be supplied by a root prebuild or
workspace symlink.

## Runtime contract proved

The production HTTP response and live page prove:

- exactly four open declarative shadow roots are present before client registration, including
  delegated focus for `fluid-input`;
- button, card, checkbox, and input definitions are absent after React hydration and remain absent
  until the probe explicitly registers them;
- the original four hosts and their four server-created shadow roots retain identity through Fluid
  hydration;
- card header/default/footer and input prefix slots keep their server-assigned nodes;
- native input value, checkbox state, focus, and text selection edited before registration survive
  capture, upgrade, and restoration;
- post-hydration `label` and `helpText` property assignments render;
- the Fluid input event crosses the Next client-component boundary;
- Fluid submit participation produces the expected `FormData`, and native reset restores the
  server defaults;
- no external request, failed request, HTTP 4xx/5xx, page exception, or error/warning console entry
  occurs.

The response is also rejected if it exposes workspace source, `node_modules`, or component source
paths.

## Retained evidence

Green evidence is retained at
`quality/evidence/framework-next/2026-08-27T12-12-18-916Z/` (gitignored). It includes the six
tarballs, copied fixture, consumer lock, 66 SHA-256 records, individual command logs and child-exit
records, production response, runtime result, and traces for Chromium 148.0.7778.96, Firefox
150.0.2, and WebKit 26.4. All three engine records passed and all browser-server exits were
observed.

The genuine initial red evidence is retained at
`quality/evidence/framework-next/2026-08-27T12-06-57-997Z/`. It found two incomplete assumptions in
the first production harness: the default slot probe queried a named empty slot instead of
`slot:not([name])`, and the generic static server rejected Next's exported RSC `.txt` prefetch
assets, producing visible 404s. The final runner serves the complete allowlisted Next export and
uses the correct default-slot selector. A later intermediate red also exposed that testing the
physical `index.html` URL changes `usePathname()` semantics and accidentally enables normal demo
registration; the green lane uses the deployed `/ssr-contract/` route URL.

## Commands and results

The authoritative run used the repository Linux browser container with Node v22.22.2 and pnpm
9.15.0:

```text
node scripts/check-framework-next-ssr.mjs
```

The runner internally executed six `pnpm pack --pack-destination ...` commands and then, inside the
copied consumer:

```text
pnpm install --no-frozen-lockfile --ignore-scripts --strict-peer-dependencies
pnpm run typecheck
pnpm run build
```

Focused workspace verification also passed:

```text
pnpm --filter @fluid-ds/admin-next typecheck
pnpm --filter @fluid-ds/admin-next build
pnpm exec eslint apps/admin-next/src/Shell.tsx apps/admin-next/app/ssr-contract/page.tsx apps/admin-next/app/ssr-contract/contract-client.tsx scripts/check-framework-next-ssr.mjs
pnpm exec prettier --check apps/admin-next/package.json apps/admin-next/src/Shell.tsx apps/admin-next/app/ssr-contract/page.tsx apps/admin-next/app/ssr-contract/contract-client.tsx scripts/check-framework-next-ssr.mjs docs/reviews/framework-next-packed-ssr-contract-2026-08-27.md
git diff --check -- apps/admin-next scripts/check-framework-next-ssr.mjs docs/reviews/framework-next-packed-ssr-contract-2026-08-27.md
```

## Explicit limitations

- This fixture does not configure a Next Node, serverless, or edge adapter. Request-time DSD needs
  a separate deployment fixture before it can be claimed.
- This is a latest-compatible lane. The retained lock and tarballs permit later frozen replay, but
  the runner does not perform a second frozen install.
- Four representative core elements are not catalog-wide certification.
- The tarballs contain the repository's existing built `dist`; source-to-dist equivalence belongs
  to the separate package build and artifact gates.
- Static App Router export generates RSC `.txt` navigation assets. They are part of the production
  output and must be served by the deployment host; treating the export as HTML/JS/CSS only is an
  invalid hosting configuration.
