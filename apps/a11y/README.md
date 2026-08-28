# Fluid browser accessibility gate

Build Storybook, then run the gate from the workspace root:

```sh
pnpm --filter @fluid-ds/storybook build
pnpm test:a11y --workers=2
```

The generated catalog contains one fixture for every published element in
`quality/component-quality.json`. This is representative fixture coverage, not
exhaustive state coverage or accessibility certification. The current runner
uses Chromium, Firefox, and Playwright WebKit. Manual assistive-technology,
desktop Safari, physical mobile-device, and human visual reviews remain
separate readiness requirements.

## Choosing a fixture

The default is the first built story matching an element's attributed story
source. Shared story files and action-created children need explicit overrides
in `scripts/fixture-selection.mjs`. An override must reference a real story in
that same source file. Stale tags, missing story IDs, wrong-source stories, and
invalid setup actions fail generation.

`setupButtons` names buttons to click, in order, using exact accessible names
within the story root. Use persistent states where an automatic dismissal could
remove the subject during an audit. The toast-item fixture uses the public toast
API through a visible story button and sets duration to zero.

The browser runner verifies that the named host exists, is upgraded, and has
finished its Lit update before scanning the story root with axe. It keeps
collecting console and page errors through the scan and verifies the same host
remains connected afterward. Hidden utility hosts are allowed; an absent or
unregistered custom element is not. There are no absent-host exemptions.

## Guard regression tests

`pnpm --filter @fluid-ds/a11y test:fixtures` checks generator selection failures.
The normal browser suite also runs `tests/fixture-contract.spec.ts`, proving
that unrelated markup, undefined custom elements, and ineffective setup actions
are rejected while upgraded hidden utilities and shadow-root children work.
Those guard tests are reported separately from the 155 catalog fixtures.

## Native keyboard regression tests

The same suite includes eight native Playwright keyboard cases in
`tests/tabs-keyboard.spec.ts`, `tests/child-keyboard.spec.ts`, and
`tests/option-tree-keyboard.spec.ts`. They verify
manual tab focus versus selection, disabled-item skipping, text-panel Tab access,
native input caret movement, activation inside a consumer shadow root, menu
activation followed by typeahead, segmented-control selection, disabled select
options, resolved active-option references, and tree selection/Tab re-entry
including nested items and consumer shadow roots.

These complement the explicitly attributed menu-item, tab, and segment Storybook
contracts. Those stories dispatch keys to an asserted focused host because the
installed user-event version misroutes keys for hosts with empty shadow-root
focus. The Playwright tests use native browser keys; neither test count is a
claim of exhaustive component coverage.

## Stable-candidate environment matrix

`tests/stable-candidate-environment-matrix.spec.ts` exercises representative
proposed stable candidates in Chromium, Firefox, and Playwright WebKit. It
requires real upgraded hosts and checks light/dark token adoption, forced-color
focus visibility, RTL tab geometry and logical navigation without DOM-order
mutation, reduced-motion transitions, keyboard-only control operation, and
reflow in a 640 CSS-pixel viewport.

The narrow viewport is the layout equivalent of viewing the 1280px desktop
baseline at 200% zoom. Playwright does not provide one cross-engine native page
zoom API, so the test deliberately does not claim browser-chrome zoom coverage.
These automated checks also do not certify screen-reader behavior or subjective
visual quality.

`tests/dialog-story-lifecycle.spec.ts` separately proves that the real Dialog
story opener works with pointer and keyboard activation, moves focus into the
modal, closes with Escape, and returns focus to its opener. The source-level
`scripts/dialog-story-structure.test.mjs` guard prevents the opener from moving
outside the `[data-story]` scope used by the story handler; it is a structural
regression guard, not a substitute for the browser lifecycle test.

Generated files are not edited manually. Runtime presence remains essential:
source attribution and a valid Storybook ID alone cannot prove that a fixture
contains its advertised component.
