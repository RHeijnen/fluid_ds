# accessibility skill: open follow-ups

The skill was authored from a deep-research pass that verified 22 claims from
W3C primary sources. The cross-check agent then read the draft files and flagged
17 minor issues, listed below so a future polish pass can close them out one at
a time. None block using the skill today.

## Citation tightening (re-fetch primary source, replace paraphrase with quote)

- **wcag22-aa-matrix.md**: several SC rows (1.1.1, 1.3.1, 1.3.2, 1.3.4, 1.3.5,
  1.4.1, 1.4.4, 1.4.5, 1.4.10, 1.4.12, 1.4.13, 2.x, 3.x, 4.1.2, 4.1.3) use
  paraphrased "what it requires" text. The verified-research batch only quoted
  1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.5.8 verbatim. For each remaining row, re-fetch
  `https://www.w3.org/WAI/WCAG22/Understanding/<sc-name>.html` and replace the
  one-sentence summary with a direct quote.
- **common-bugs.md**: the 1.4.11 row cites the WCAG 2.1 Understanding URL;
  swap it for the 2.2 version (`https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html`).
- **shadow-dom-ce.md**: Cross-root ARIA references link to `WICG/aom`; double-
  check that the explainer is actually still in `WICG/aom` and not moved to a
  separate `WICG/cross-root-aria` repo.
- **aria-patterns.md**: three paraphrased APG claims should be quoted with the
  pattern-page URL: Switch ("Enter also toggles"), Alert (`role="alert"` ≡
  `aria-live="assertive" + aria-atomic="true"`), and Carousel (`aria-live` on
  slide container). Refetch the relevant APG pages and quote.

## Internal consistency

- **SKILL.md vs wcag22-aa-matrix.md**: 3.2.6 Consistent Help is "Level A
  inherited at AA, NEW in 2.2". Make sure both files state it the same way.
- **SKILL.md date format**: uses `2023-10-05 / 2024-12-12` for the WCAG 2.2
  publication / update; align other files to the same format.

## Soft claims that should be softened

- **testing.md**: the "axe catches roughly 30–50%" line should be replaced
  with "commonly cited as a partial check, never a conformance gate" without
  the specific percentage (or cited to a public Deque statement with a URL).
- **tokens.md**: the "APCA / WCAG 3 are NOT normative" line is correct but
  the language is over-strong; soften to "APCA is not part of WCAG 2.x
  conformance; do not gate on it for AA work today" and link to W3C's WCAG 3
  status page.
- **common-bugs.md**: toast-persistence duration ("min ~6s") is uncited;
  either link to a primary recommendation or drop the number and say
  "long enough to read; user-pausable for SC 2.2.1 conformance".

## Open research questions for the next pass

- Current state of the Cross-root ARIA proposal (Chromium / Safari / Firefox
  intent-to-ship).
- Exact axe-core rule IDs mapped to each WCAG 2.2 AA SC at a pinned axe-core
  version (`deque-systems/axe-core/blob/develop/doc/rule-descriptions.md`).
- Playwright API surface for accessibility-tree assertions
  (`page.locator(...).accessibleName()` etc.), confirm method names against
  current docs.
- WAI-ARIA 1.3 deltas vs 1.2 that change required attributes on existing
  patterns (combobox `aria-controls` is the known one).
