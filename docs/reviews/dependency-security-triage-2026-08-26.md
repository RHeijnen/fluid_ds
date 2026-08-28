# Dependency security triage - 26 August 2026

Status: audit and source-path triage only. No dependencies were installed,
upgraded, overridden, or waived. Advisory presence is not proof that a deployed
application is exploitable, and this review is not a security certification.

## Retained evidence and count definitions

The fresh `corepack pnpm audit --json` ran on Node 22.22.2 / pnpm 9.15.0 from
14:55:50 to 14:57:09 UTC. Its exit code was 1 because findings remain. The
[recorder result](../../quality/evidence/2026-08-26T14-55-50-731Z-dependency-audit-readonly/result.json)
and [full registry response](../../quality/evidence/2026-08-26T14-55-50-731Z-dependency-audit-readonly/output.log)
are retained unchanged. Before/after source fingerprints match; the lockfile
SHA-256 is `a4c0bbccc7738c7620883383839cc3446fabd52c14116764eb7689181878277c`.
This is a dated registry/lockfile snapshot, not a promise about later advisories.

| Measure                         | Count | Definition                                                  |
| ------------------------------- | ----: | ----------------------------------------------------------- |
| Advisory entries                |   108 | Entries in the response's `advisories` object               |
| Distinct advisories             |    99 | Unique `github_advisory_id` values                          |
| Affected module names           |    33 | Unique `module_name` values                                 |
| Vulnerable occurrences          |   126 | Registry metadata: 2 critical, 50 high, 62 moderate, 12 low |
| Published-package finding paths |   171 | Unique finding paths whose importer starts with `packages\` |

The previous “46 advisories” figure must not be reused as a current count.
The response reports 1,994 dependencies and zero dev dependencies: that flattened
metadata, and individual `dev: false` flags, are **not** a reliable workspace
production/development classification.

For each of those 171 paths, the importer and first dependency edge were checked
against its actual `packages/*/package.json` (removing the edge's version suffix).
All 171 enter `devDependencies`; none enter `dependencies` or
`optionalDependencies`, and none were unclassified. These include test-runner,
Open WC, tsx, and esbuild paths. This report therefore identifies no advisory
path through a published library's production/optional dependency edges. That
does not establish absence of vulnerabilities, assess every executable path, or
dismiss installation/build-tool risks. App dependencies are assessed separately.

## Bounded remediation candidates

Versions below come from the retained response's `findings[].version` and
`patched_versions`, not an executed upgrade or an assurance of compatibility.

| Priority / owner                                           | Candidate                                                                                                                                                                      | Required decision or verification                                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First patch batch / framework maintainer                   | Align Angular common/core/compiler 20.3.23 to at least 20.3.27; Next 15.5.18 to at least 15.5.21                                                                               | Existing app ranges permit these patches; regenerate a reviewed lock and rerun isolated builds/runtime contracts.                                                               |
| First patch batch / tooling maintainer                     | tar 7.5.15 to at least 7.5.21; axios 1.16.1 to at least 1.18.0; form-data 4.0.5 to at least 4.0.6                                                                              | Review parent ranges and all resolved copies. Installed pacote allows tar `^7.4.3`; wait-on allows axios `^1.12.1`.                                                             |
| Explicit pin / tooling maintainer                          | shell-quote 1.8.3 to at least 1.9.0                                                                                                                                            | concurrently 9.2.1 pins **exactly** 1.8.3; a lock refresh alone cannot fix this edge. Choose a compatible parent update or reviewed override, not blanket force fixing.         |
| Additional patch review / tooling maintainer               | postcss 8.5.15 to at least 8.5.23; yaml 2.7.1 to at least 2.8.3; svgo 4.0.1 to at least 4.0.2; undici 6.26.0 to at least 6.28.0; js-yaml 3.14.2/4.1.1 to at least 3.15.1/4.3.1 | The separate Next-associated postcss 8.4.31 copy needs parent review; do not override every branch indiscriminately.                                                            |
| Compatibility projects / framework and tooling maintainers | Vite 5.4.21 to a supported patched line (reported 6.4.3 / 7.3.5); Astro 5.18.2 to at least 7.1.0; React Router 6 to at least 7.18.0                                            | Major-version changes require their own integration review, including Astro/Starlight compatibility and all affected apps.                                                      |
| Upstream decision / browser-tooling maintainer             | extract-zip 2.0.1                                                                                                                                                              | Report gives no patched version (`<0.0.0`). Trace is browser-download tooling through Puppeteer/WTR; assess upstream replacement or a time-limited, explicitly owned exception. |

Examples: the two shell-quote entries are
[GHSA-w7jw-789q-3m8p](https://github.com/advisories/GHSA-w7jw-789q-3m8p) and
[GHSA-395f-4hp3-45gv](https://github.com/advisories/GHSA-395f-4hp3-45gv).
The tar ceiling in this response is
[GHSA-r292-9mhp-454m](https://github.com/advisories/GHSA-r292-9mhp-454m).
The unpatched extract-zip entry is
[GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv).

## Reachability evidence and limits

- **Next demo:** `apps/admin-next/next.config.mjs` uses `output: "export"` and
  unoptimized images. The reviewed app has no discovered Server Actions, cache
  directive, or request-time rewrite use. The reported server/cache/image attack
  paths are not demonstrated in this static deployment; vulnerable package
  versions still need patching.
- **React demo:** `apps/admin-react/src/App.tsx` uses HashRouter and fixed local
  navigation entries. No manual SSR error deserialization or attacker-controlled
  navigation target was found. Those are relevant preconditions for the two
  [React Router advisories](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6),
  [including SSR error handling](https://github.com/advisories/GHSA-337j-9hxr-rhxg).
  A retained isolated fixture resolving 6.30.6 is outside the older
  react-router-dom 6.30.2–6.30.4 advisory range but still inside the two router
  ranges; a successful runtime test is not a security clearance.
- **Angular demo:** `apps/admin-angular/src/main.ts` bootstraps a client app with
  routing. No hydration transfer cache, translated event attribute, two-way
  innerHTML binding, or date-formatting use was found in the reviewed app. This
  narrows observed use, not the installed affected range.
- **Astro:** the docs and framework fixture are static sites. No request-driven
  server-island/transition use was found. Internal Astro-prop spreads do not by
  themselves prove attacker-controlled attributes. Asset processing and future
  server deployment remain separate trust boundaries.
- **Development tooling:** concurrently's installed argument-expansion path
  quotes strings; the root `dev` command uses fixed commands without argument
  placeholders. No malicious shell-quote object/parse path was demonstrated.
  Archive/image tooling processes build inputs; that remains security relevant.
  Localhost-only Vite binding is not a blanket defense against malicious web
  pages targeting a local development server.

No exploit or hostile archive/browser proof of concept was executed. The above
is source/configuration triage, not a full dynamic reachability analysis.

## Remaining owner decisions

1. Implement and verify a compatible patch batch within the already approved
   readiness work. Routine patch updates do not require fresh approval. Keep
   exact pins, major-version compatibility changes, and acceptance of unpatched
   risk as separate reviewed decisions.
2. Establish an audit gate and an exception policy with named accountable owners,
   affected environments, expiry, and remediation links. No automated dependency
   audit gate was found in the reviewed workflows; “dev-only” is not an automatic
   exception. The owner roles above are proposed, not assigned individuals.
3. Align `SECURITY.md`'s latest `0.x.x-alpha.*` support claim and `alpha` release
   language with current 0.4.0 packages/publication policy. Choose a concrete
   private reporting route; the present “email via the GitHub Security Advisories
   tab” wording is ambiguous. Do not invent a contact address.
4. The earlier Markdown scope drift has now been corrected in `SECURITY.md`:
   default sanitizer bypasses are in scope, while deliberate `trusted` opt-out
   remains a consumer trust boundary. This matches
   `packages/markdown/src/fluid-markdown.ts` and the Markdown guide. No dependency
   finding was closed by that documentation correction.

This review grants no risk waiver or release sign-off. Routine verified patch
updates remain within the approved readiness work. Final production-readiness
sign-off still requires the selected fixes and fresh evidence against their
resulting dependency graph.
