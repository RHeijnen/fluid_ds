# Competitive review: Fluid, Web Awesome, and Spectrum Web Components

Date: 2026-08-25  
Fluid revision: current uncommitted working tree  
Comparison set: Web Awesome 3.12 and Spectrum Web Components 1.x

> Certification correction, 2026-08-26: this is a historical review, not release
> certification. A later baseline audit found 21 omitted interaction-applicable
> elements (now 64/103), 13 browser accessibility story mappings that do not
> render the named element, invalid heap/hydration benchmark measurements, and a
> failing packed React consumer fixture. The grades and broad proof claims below
> must not be used as current release assurances. See
> [the defect register](../../quality/defects.md) and
> [the baseline](../../quality/baselines/2026-08-26.md).

## Executive verdict

Fluid has moved from the earlier C+/B- architecture assessment to an **A- engineering
foundation and B+ production readiness**. Its automated evidence is now unusually broad:
all 155 published elements have unit accessibility, browser accessibility, visual, SSR,
and hydration fixtures. Fluid now has stronger catalog-wide SSR and hydration proof than
either comparison library exposes publicly.

Fluid is not ready to claim the same release maturity as the competitors. Most of its
components are still marked experimental, Storybook interaction depth covers only 64 of the
82 elements explicitly classified as interactive or composite, and manual
assistive-technology, fluent-speaker, cross-browser, visual-flake, and release-candidate
certification remain incomplete.

The practical grade change is:

- Earlier review: C+/B-, with SSR, localization, RTL, framework, and system-test gaps.
- Current engineering foundation: A-.
- Current production readiness: B+.
- Credible grade after the remaining certification program: A-/A.

## Method

Fluid is graded from executable local gates in this working tree, not documentation claims.
Competitors are graded from their official documentation and public repositories as they
exist on the review date. An absent public gate is treated as unverified, not as proof that
the competitor does no internal testing.

Spectrum Web Components is the third comparison because it is a mature, production web
component implementation of Adobe Spectrum, has a public 1.x compatibility policy, and is
technically closer to Fluid than a React-only component library.

## Scorecard

| Dimension                        | Fluid | Web Awesome | Spectrum WC | Current leader        |
| -------------------------------- | ----- | ----------- | ----------- | --------------------- |
| Catalog breadth and value        | A+    | A           | A-          | Fluid                 |
| Unit and automated accessibility | A-    | B+          | A           | Fluid / Spectrum      |
| SSR and browser hydration proof  | A     | B+          | C           | Fluid                 |
| Localization and RTL             | B+    | A-          | B+          | Web Awesome           |
| Framework developer experience   | A-    | A-          | B+          | Fluid / Web Awesome   |
| Visual and interaction testing   | B+    | B           | A           | Spectrum              |
| Packaging and performance gates  | A-    | B+          | B+          | Fluid                 |
| Documentation and ecosystem      | B     | A           | A           | Competitors           |
| Governance and release maturity  | C+    | A-          | A           | Spectrum              |
| Overall production readiness     | B+    | A-          | A-          | Competitors, narrowly |

Grades represent evidence and maturity, not visual-design preference.

## Where Fluid now leads

### Catalog-wide SSR and hydration

Fluid renders all 155 elements through its server renderer, produces declarative shadow
DOM for 154 eligible elements, and hydrates the complete catalog in Playwright. The browser
gate rejects console and page errors, preserves pre-hydration form state, and verifies
deterministic reload behavior. Import safety is separately tested against built Node entries.

Web Awesome has real Lit SSR, separate server and hydration entries, and runs component tests
in both client-only and hydrated modes. Its own documentation still labels SSR experimental,
describes the current goal as layout-shift reduction rather than progressive enhancement,
and delegates backend integration to Lit documentation. See the official
[Web Awesome SSR guide](https://webawesome.com/docs/ssr) and
[package test scripts](https://github.com/shoelace-style/webawesome/blob/next/packages/webawesome/package.json).

No equivalent supported SSR and hydration contract was found in Spectrum Web Components'
official documentation. This is an evidence gap, not a claim that server rendering is
impossible.

### Automated catalog coverage

Fluid's generated quality inventory reports:

- 155/155 elements with unit tests and unit accessibility audits;
- 155/155 dedicated Playwright axe fixtures;
- 155/155 SSR, hydration, Storybook, and visual fixtures;
- zero blocking inventory gaps;
- 1,128 core tests;
- 95.79 percent core statements and lines, 83.88 percent branches, and 83.79 percent
  functions in the latest full coverage run.

Spectrum is the strongest external reference here. Its current testing model explicitly uses
Storybook play functions, dedicated Playwright plus axe tests, and Storybook plus Chromatic
visual regression, with coverage and flake guidance in the same program. See Spectrum's
[testing guide](https://github.com/adobe/spectrum-web-components/blob/main/CONTRIBUTOR-DOCS/02_style-guide/04_testing/README.md)
and public [Playwright accessibility scripts](https://github.com/adobe/spectrum-web-components/blob/main/package.json).

Web Awesome's contributor guide requires per-component accessibility assertions and runs its
unit suite in hydrated and client-only modes. Its public visual-test page is a valuable design
conformance surface, but the public repository does not expose a Spectrum-style dedicated
Playwright accessibility program. See the official
[contributor testing guidance](https://webawesome.com/docs/resources/contributing) and
[visual tests](https://webawesome.com/docs/resources/visual-tests).

### Breadth without a paid catalog split

Fluid publishes 155 elements across core and expansion packages. Web Awesome advertises over
80 components, but marks several complex form, media, and data-visualization components as Pro.
See the official [Web Awesome catalog](https://webawesome.com/docs/components). Fluid's
charts, parser, scheduler, table, editor, media, map, kanban, QR, markdown, and node graph
remain part of the open package set.

### Consumer and package verification

Fluid now verifies all 18 publishable packages from packed tarballs outside the workspace,
including runtime entries, declarations, exports, dependency closure, and representative
bundle budgets. React 19 wrappers and custom-event props are generated from the CEM for all
155 elements. React, Next.js, Vue, Angular, Astro, and SvelteKit fixtures typecheck and build;
clean packed-fixture verification is wired into CI, with Vue and Astro also proven locally.

Web Awesome remains excellent for adoption: it ships CEM, JSX types, React entries, framework
guides, a CDN loader, and a separate SSR loader. React 19 can use its custom elements directly,
while legacy React wrappers remain available. See its
[React integration](https://webawesome.com/docs/frameworks/react),
[framework index](https://webawesome.com/docs/frameworks/), and
[package exports](https://github.com/shoelace-style/webawesome/blob/next/packages/webawesome/package.json).

Spectrum ships official `@swc-react/*` wrappers based on `@lit/react`, including typed element
references and Next.js guidance. Its public guide also calls out wrapper metadata gaps and asks
for broader end-to-end wrapper coverage. See
[Using SWC React](https://opensource.adobe.com/spectrum-web-components/using-swc-react/).

## Where the competitors still lead

### Localization product depth

Fluid now ships Dutch, German, French, Spanish, Arabic, and two diagnostic pseudo-locales. It
supports regional and English fallback, partial application overrides, nearest ancestor
language contexts, reactive `lang` and `dir`, RTL, and locale-aware date and number behavior.
That closes the original architecture gap.

Web Awesome still has the more mature translation product and contributor ecosystem. It ships
a broad translation catalog, lazy registration, regional fallback, per-component locale
selection, and public contribution guidance. Its documented limitation is that nested ancestor
languages are ignored unless placed directly on the component. Fluid's nearest-context behavior
is stronger in that specific case. See
[Web Awesome localization](https://webawesome.com/docs/localization).

Spectrum's modern language-resolution controller is structurally excellent: it tracks nearest
language context across normal and shadow DOM, validates locales with `Intl`, and reacts to
changes. Its base class uses `:dir()` for inherited directionality. See
[language resolution](https://opensource.adobe.com/spectrum-web-components/tools/language-resolution/)
and [base direction support](https://opensource.adobe.com/spectrum-web-components/tools/base/).

Fluid cannot mark its human locale packs stable until fluent speakers review them.

### Interaction and visual maturity

Fluid's visual runner covers 2,545 catalog/environment combinations across light, dark,
forced-colors, RTL, and reduced motion. The zero-retry full run passed 1,007 applicable
scenarios, explicitly skipped 1,536 irrelevant combinations, and exposed two failures. Both
were reviewed and corrected: one remote media fixture became deterministic and one RTL popup
race was fixed in the component. The media matrix then passed its targeted rerun, and the popup
passed 10 consecutive zero-retry captures against a rebuilt Storybook artifact.

The remaining weakness is depth, not infrastructure. The built Storybook gate now runs 64
passing browser interaction contracts, covering 64 of the 82 elements explicitly classified as
interactive or composite. That is 78 percent of the relevant denominator and 41.3 percent of
the complete 155-element catalog, with 18 applicable gaps
reported explicitly. Spectrum's declared model makes interaction stories, dedicated
accessibility tests, and Chromatic visual regression standard component deliverables. Fluid
needs that expectation for every stable interactive element before it matches Spectrum.

Web Awesome has a strong public visual-conformance page, but does not currently offer an
official Storybook experience; the maintainer has explicitly said the project does not plan to
own one in the near term. See the
[official discussion](https://github.com/shoelace-style/webawesome/discussions/2741).

### Release trust and ecosystem

Fluid is version 0.4 and its maturity manifest intentionally marks most components experimental.
That honesty is good governance, but it prevents a production-grade compatibility claim.

Spectrum 1.x publishes a detailed semver, beta, browser, API, severity, and deprecation policy.
See [Spectrum support and compatibility](https://opensource.adobe.com/spectrum-web-components/support-and-compatibility/)
and its [deprecation guide](https://opensource.adobe.com/spectrum-web-components/deprecation/).
Web Awesome 3.12 exposes stable and experimental labels, a maintained changelog, browser policy,
Figma offering, established CDN distribution, and a larger consumer history.

Fluid now documents support, governance, maturity, security, SSR, localization, frameworks,
and design-token synchronization, but those policies still need release history and external
validation behind them. A repository token export is not a substitute for a maintained Figma
component library.

## Updated risk assessment

The original blockers are no longer architectural unknowns. SSR, hydration, localization,
RTL, framework typing, catalog accessibility, visual testing, benchmarks, packaging checks,
and documentation now have concrete implementations and CI workflows.

The remaining risks are certification and depth risks:

1. Most public elements have no stability promise yet.
2. Storybook interaction coverage is 64/82 relevant elements, or 64/155 across the complete
   catalog, and does not yet represent all
   critical workflows. Presentational and helper elements are classified separately rather than
   diluting the denominator.
3. Framework fixtures primarily prove typecheck and build; browser runtime behavior is not yet
   exercised for every packed fixture.
4. Chromium is the locally proven browser gate; Firefox, WebKit, mobile, and the documented AT
   matrix still need evidence.
5. Official locale packs have engineering completeness but no fluent-speaker sign-off.
6. Visual correctness has a comprehensive current baseline, but no retained 50-run flake history.
7. Benchmarks cover representative core paths but not every complex expansion workflow.
8. Two independent release-candidate certification runs have not happened.
9. No public Figma component library or proven design-to-code component synchronization exists.

## Next build program

### P0: define and certify the first stable cohort

Select the production-critical component cohort rather than declaring all 155 stable at once.
For each selected element, require complete docs, event and keyboard tests, browser axe,
hydration, localization and RTL where relevant, visual states, interaction stories, performance
budget, and no open P0/P1 defect. Drive docs and Storybook status from the existing maturity
manifest.

### P0: browser runtime framework contracts

Extend each packed React, Next.js, Vue, Angular, Astro, and SvelteKit fixture with Playwright
runtime tests for registration, properties, typed custom events, form submission, slots,
hydration where applicable, and console/page errors. Run them against tarballs only.

### P0: interaction depth

Add Storybook play coverage to every interactive element in the stable cohort. Prioritize forms,
validation, overlays, focus restoration, keyboard navigation, date/time controls, tables,
scheduler, editor, parser, kanban, and node graph. Reuse accessible queries and assert public
events and states.

### P0: cross-browser and human accessibility certification

Run hydration and browser accessibility in Chromium, Firefox, and WebKit. Complete the public
manual matrix with NVDA plus Chrome and VoiceOver plus Safari for stable interactive elements.
Record tester, browser, AT version, result, defect, and retest evidence.

### P1: localization release certification

Have fluent speakers review Dutch, German, French, Spanish, and Arabic. Add representative full
interaction flows in each official locale, retain pseudo-locale diagnostics, and document
translation ownership and correction cadence.

### P1: visual and performance history

Run the canonical pinned visual suite 50 times, store run metadata, and require a measured flake
rate below one percent. Expand performance cases for table virtualization, chart update,
scheduler layout, editor input, parser throughput, map lifecycle, and node-graph interaction.

### P1: design tooling

Publish the Figma-compatible token export as a documented artifact, then create or synchronize
a stable-cohort Figma component library with explicit ownership and drift checks.

### P1: release candidates

Run the full certification matrix twice from clean checkouts and packed artifacts. Include audit,
unit and coverage, a11y, SSR and hydration, frameworks, interactions, visuals, performance,
docs, packages, manual AT, locale sign-off, migration notes, rollback, and hotfix rehearsal.

## Final assessment

Fluid is no longer catching up at the architecture level. It now has a broader and, in several
areas, more systematic automated foundation than Web Awesome and Spectrum Web Components. Its
strongest differentiator is the combination of catalog breadth, open availability, generated
quality inventory, and complete SSR/hydration verification.

The next phase should not add another horizontal test harness. It should use the harnesses that
now exist to certify a deliberate stable cohort, deepen real interactions, prove consumer
runtime behavior across browsers and frameworks, complete human review, and build release
history. Finishing that work would justify an A-/A production grade without relying on catalog
size as a proxy for maturity.
