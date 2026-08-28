# Localization / RTL integration reconciliation (2026-08-27)

## Outcome

The current source and generated catalog were reconciled after all seven audited runtime groups landed. All 155 published custom elements remain assigned exactly once and all 12 cross-cutting surface records now describe the implemented runtime contract or an explicit preservation boundary. No confirmed Fluid-owned localization migration remains open in this audited scope.

This is a source-disposition and automated-contract result, not a claim that Dutch, German, French, Spanish or Arabic copy has fluent approval, that every layout has visual approval, or that supported browser/assistive-technology combinations have been manually certified.

## Re-audit method and dispositions

The audit compared every tag from the 12 package `custom-elements.json` catalogs with current component source, the shared localization contract, focused package tests, and the dated reviews. It separately searched current runtime source for hard-coded accessible labels, titles and visible English copy. Application examples, developer exceptions, canonical tokens, event names, CSS, native browser chrome and dependency-owned UI were not misclassified as Fluid-owned messages.

The catalog result is:

- 4 earlier completed bounded contracts: countdown, scheduler, time slots and tour
- 56 completed audited migrations, covering the core follow-up list and the seven runtime implementation groups
- 38 reviewed existing shared-registry contracts
- 57 reviewed elements with no additional Fluid-owned runtime-message candidate

The 12 surface records now comprise eight localized runtime contracts and four explicit preservation boundaries: application content, native/browser UI, dependency UI, and canonical/developer text. Evidence is retained for every catalog group and every surface disposition, including non-localization boundaries.

## Integration findings

Exact key and value-kind parity already followed from the typed complete dictionary contract. Integration testing now also enforces callback-argument arity across English, Dutch, German, French, Spanish, Arabic and both pseudo-locales.

One concrete pseudo-locale defect was found and fixed: pseudo callbacks previously used a rest-argument wrapper and transformed caller-provided string arguments along with Fluid-owned copy. The pseudo factory now preserves the English callback arity, masks interpolation arguments while transforming the owned message, and restores caller strings verbatim. Representative live rendering covers core, media, calendar, scheduler, editor, kanban, node graph, table, charts, map, Markdown, QR and parser messages while switching from expanded LTR `en-XA` to mirrored RTL `ar-XB`.

The broader regression pass found a second shared-context defect: rejecting malformed Intl tags at the context boundary also bypassed an explicitly registered application dictionary whose private-use code was not itself a valid Intl formatter locale. Dictionary lookup now retains the declared language code, while `localize.locale` independently exposes a safe canonical formatter fallback. Application registry overrides and number/date formatting safety therefore coexist.

The focused runtime suites remain the authority for component-specific override precedence, canonical state, event silence, logical versus physical direction behavior, network/render stability, native controls and third-party boundaries. The shared integration layer deliberately does not duplicate those package suites.

SSR request isolation is retained by the concurrent interleaved locale test in `scripts/ssr-renderer.test.mjs`. Standalone imports and builds remain package-level evidence because importing every package into one production graph would itself weaken the dependency-isolation contract.

## Automated evidence

- Exact published-catalog coverage: 155/155 elements, unique and sorted
- Surface reconciliation: 12/12 records with resolvable source and evidence paths
- English, nl, de, fr, es, ar, en-XA and ar-XB exact key/value-kind/callback-arity parity: passing
- Representative pseudo expansion, mirrored RTL, live switching, safe custom dictionary lookup and caller-argument preservation: 62/62 passing in Chromium, Firefox and WebKit
- Full components regression suite: 1,859/1,859 passing in Chromium
- Full focused affected-package browser suites and typechecks: retained in their dated reviews
- Components typecheck, scoped lint, formatting and inventory guard: passing
- Components build plus SSR request-isolation and standalone package import guards: passing

## Remaining gates

There is no confirmed machine-actionable Fluid-owned string migration remaining in the 155-element/12-surface audited scope. New source or catalog elements must update the guarded disposition inventory and supply resolvable evidence.

The remaining approval gates are human or platform-specific:

- fluent review of all Dutch, German, French, Spanish and Arabic drafts
- visual Arabic RTL and `en-XA` expansion review at supported breakpoints, including dense tables, graphs, calendars, media and parser previews
- manual screen-reader and keyboard review in supported browser/AT combinations
- product decisions for any future localization of dependency-owned Leaflet controls, browser/native chrome or raw dependency diagnostics; the current contract documents and preserves those boundaries without claiming translation
