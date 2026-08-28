# Stable-candidate accessibility environment matrix — 2026-08-27

## Scope and status

This is a bounded automated browser check for five representative components
listed as proposed stable candidates in `quality/certification-scope.json`:
`fluid-button`, `fluid-input`, `fluid-checkbox`, `fluid-dialog`, and
`fluid-tabs`. It does not promote their status or convert source/story presence
into accessibility coverage.

The executable matrix is
`apps/a11y/tests/stable-candidate-environment-matrix.spec.ts`. Each loaded story
must return HTTP 200, render its named host, register its custom-element
definition, upgrade the actual instance, and complete its initial update. Page
errors, warning/error console messages, failed requests, and HTTP error
responses fail the case.

Six contracts run in Chromium, Firefox, and Playwright WebKit:

- light and dark rendered-token adoption across all five candidates;
- forced-colors activation plus a visible keyboard focus indicator;
- RTL tab geometry and logical arrow navigation without changing DOM order;
- reduced-motion activation and removal of a non-zero control transition;
- 640 CSS-pixel reflow for all five candidates, as the layout equivalent of the
  1280px baseline at 200% zoom; and
- native keyboard operation for button, input, checkbox, and tabs.

Playwright has no single cross-engine native browser-chrome zoom control, so
the reflow case is deliberately not described as native zoom-UI certification.

## Retained failure evidence

The first run produced 12 passes and 6 failures. Three failures were caused by
an invalid nested shadow selector for the tab appearance probe; changing the
probe to the real `fluid-tab` host corrected that harness error.

The next run produced 15 passes and 3 failures and reproduced the same Dialog
story defect in every engine. Keyboard Enter activates the visible “Open
dialog” button, but the handler in
`packages/components/src/components/dialog/fluid-dialog.stories.ts` searches
`e.target.closest("[data-story]")`; the button is a sibling outside the only
`[data-story]` container, so the lookup is always null and the dialog never
opens. Pointer activation follows the same handler. Product story sources were
outside the initial tranche, so the matrix did not mask this by scripting the
component open. The focused follow-up below repairs and verifies that story.

## Dialog story follow-up

The focused follow-up moved both the Default and Sizes story openers inside the
same `[data-story]` containers as their dialogs. The causal `closest` lookup now
finds the intended dialog for actual pointer and keyboard click events without
changing the component API.

Two complementary guards were added:

- `apps/a11y/scripts/dialog-story-structure.test.mjs` checks both story templates
  and would fail the old sibling layout. This is intentionally only a source
  structure guard.
- `apps/a11y/tests/dialog-story-lifecycle.spec.ts` uses the actual built Default
  story. In each browser it requires the opener to be inside the lookup scope,
  verifies the real host upgrade, exercises pointer and keyboard opening, checks
  focus moves to the modal close control, closes with Escape, and checks focus
  returns to the opener.

## Verification

All commands used already-installed direct binaries; no dependency-resolution
or install path ran.

- Focused matrix: **18 passed** (6 contracts in each of Chromium, Firefox, and
  Playwright WebKit), exit 0 both before and after the Dialog repair.
- Dialog story lifecycle: **3 passed** (Chromium, Firefox, and Playwright
  WebKit), exit 0 after rebuilding Storybook from the repaired source. Pointer
  and keyboard open, modal focus, Escape close, and opener focus return passed
  in every engine.
- Storybook production build — exit 0 in the reconciled Linux workspace.
- Focused TypeScript:
  `node ../../node_modules/typescript/bin/tsc -p tsconfig.environment-matrix.json`
  — exit 0.
- Full `apps/a11y` and `packages/components` TypeScript checks — exit 0 in the
  reconciled Linux workspace.
- Dialog structure and fixture selection guards — **11 passed**, exit 0.
- ESLint for the changed TypeScript files — exit 0 with no warnings.
- Prettier check for the changed a11y files — exit 0.
- Both Playwright runs used the managed preview lifecycle and left **0**
  listeners on port 6008.

## Boundaries

This evidence is automated and representative. It is not manual screen-reader
or other assistive-technology acceptance, desktop Safari certification,
physical mobile-device certification, human visual acceptance, exhaustive
state coverage, or a release/deployment claim. Existing visual-regression
snapshots remain a separate Chromium screenshot signal; no unreviewed
cross-browser baselines were generated in this tranche.
