# Request-time SSR validation, 2026-08-27

The retained packed Next.js consumer now has an executable local production
request-time SSR gate. `pnpm test:ssr-request-time` installs its frozen portable
lock offline, type-checks it, builds it with the `/ssr-contract` route marked
dynamic, and starts `next start` rather than serving a static export.

The gate sends two concurrent requests carrying distinct request identifiers.
Each response must contain only its own identifier inside the Lit-rendered
payload, four declarative shadow roots, and private/no-store cache semantics.
This fails closed if the route is accidentally prerendered or request context
leaks between responses.

The same running production server then executes the established delayed-client
registration contract in Chromium, Firefox, and WebKit. It verifies retained
server hosts and shadow roots, slots, pre-hydration input value/focus/selection,
form state, property updates, Fluid events, submission/reset behavior, and an
empty console/page/network error ledger.

Fresh evidence is retained at
`quality/evidence/framework-next-request-time/2026-08-27T20-01-19-288Z`:

- frozen offline install, type-check and production build passed;
- Next classified `/ssr-contract` as dynamic and server-rendered on demand;
- distinct request isolation passed;
- the three-engine browser runtime passed;
- direct browser child exits were observed for all engines.

This closes the locally executable request-time framework SSR boundary. It does
not validate a deployed ingress, CDN, hosting adapter, remote cache policy, or
external URL; those remain deployment-stage checks. The consumer exercises four
representative Fluid elements. Catalog-wide coverage remains provided separately
by the 155-element Node render and browser hydration gates.
