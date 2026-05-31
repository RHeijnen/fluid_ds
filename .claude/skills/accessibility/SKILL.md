---
name: accessibility
description: WCAG 2.2 Level AA and WAI-ARIA APG reference for the Fluid design system, invoke for any component review, design spec, token decision, page audit, or screen-reader / keyboard debugging where accessibility is in scope.
---

# Fluid accessibility skill

This skill is the source of truth for accessibility decisions in Fluid. It is
spec-first: it cites W3C normative documents and tells you when to re-fetch them
rather than paraphrasing from memory.

## When to invoke

Load this skill whenever any of the following is happening:

- Reviewing a component PR (new `fluid-*` element, or change to an existing one).
- Designing a new component or proposing a new pattern.
- Adding or renaming semantic tokens that affect contrast, focus, or state.
- Auditing a Storybook story, a playground card, or a docs page.
- Debugging a screen-reader, keyboard, or focus bug reported against a component.
- Preparing a release: running the AA checklist before tagging.

## Conformance baseline

Fluid targets **WCAG 2.2 Level AA**. WCAG 2.2 is the current W3C
Recommendation (published 2023-10-05, updated 2024-12-12) and is structured
around the four POUR principles: Perceivable, Operable, Understandable, Robust.
AA is the level required by Section 508, ADA Title II, EN 301 549, and AODA, so
it is the right bar for a library that other teams ship to production.

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/
- WAI-ARIA Authoring Practices Guide (APG): https://www.w3.org/WAI/ARIA/apg/

## How to use this skill

Layout of `.claude/skills/accessibility/`:

- `SKILL.md`: this file. The map and the fast checklists.
- `references/wcag22-aa-matrix.md`: every AA Success Criterion that matters to
  a component library, with the SC URL.
- `references/aria-patterns.md`: APG-mapped roles, keyboard contracts, and
  required ARIA per Fluid component family.
- `references/tokens.md`: contrast pairs, focus-ring rules, motion tokens, and
  the SCs they satisfy.
- `references/shadow-dom-ce.md`: shadow DOM, ARIA reflection, form-associated
  custom elements, slotted labels.
- `references/common-bugs.md`: failures we keep catching in review, mapped to
  the SC that flags them.
- `references/testing.md`: axe / @open-wc audit / Storybook a11y addon /
  Playwright accessibility-tree assertions / manual keyboard + screen-reader
  sweep checklists.
- `references/conformance-levels.md`: the AA baseline vs the AAA delta
  (2.5.5 / 2.4.12 / 2.4.13 / 1.4.6), the `data-fluid-conformance` switchable
  architecture, the conformance token spec, and the AAA review checklist.

**Do not dump every reference into context.** Open the one that matches the
work. PR review and design specs almost always need `wcag22-aa-matrix.md` plus
one of the others.

## 5-minute component review checklist

Run this on every interactive component PR.

**Semantics and roles**
- Native element used where possible? If not, is the ARIA role from APG? (4.1.2 Name, Role, Value; APG patterns)
- For a custom element, is the role exposed via `ElementInternals` / attribute, not just a class?

**Keyboard** (2.1.1 Keyboard, 2.1.2 No Keyboard Trap)
- Every action reachable without a mouse?
- Tab order matches DOM order, no positive `tabindex`? (APG keyboard interface)
- Composite widgets use roving tabindex or `aria-activedescendant`? Tab moves between widgets, arrows move within?
- Escape closes popups/dialogs?

**Focus** (2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum) [NEW in 2.2])
- Visible focus indicator on every focusable element: not removed without replacement (Failure F78).
- Focused element is never fully hidden by sticky headers, toasts, or the component's own popup.
- Focus is restored on dialog close.

**Labels and names** (1.3.1 Info and Relationships, 4.1.2, 2.5.3 Label in Name)
- Accessible name present and matches visible label text?
- Icon-only controls have `aria-label` or visually-hidden text?
- Errors/descriptions wired via `aria-describedby`?

**Color and contrast** (1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast)
- Text ≥ 4.5:1, large text ≥ 3:1.
- Focus ring, field borders, identifiable state changes ≥ 3:1 against adjacent colors.
- Information not conveyed by color alone (1.4.1).

**Sizing and spacing** (2.5.8 Target Size (Minimum) [NEW in 2.2])
- Pointer targets ≥ 24×24 CSS px, or the spacing/inline/equivalent/UA/essential exception applies.
- Layout still works at 200% zoom and 400% reflow (1.4.10, 1.4.4).

**States and live regions** (4.1.3 Status Messages, 1.3.1)
- Loading, success, error, empty states announced: `role="status"` or `role="alert"` as appropriate?
- Disabled vs read-only is the correct semantic choice.

**Motion** (2.3.3 Animation from Interactions, prefers-reduced-motion)
- Animations honor `@media (prefers-reduced-motion: reduce)`.
- No flashing > 3× per second (2.3.1).

## 5-minute design checklist

Answer before writing code.

- **Purpose and semantics**: which APG pattern (or native element) does this map to? If none, document why.
- **Keyboard model**: list every key and what it does in every state. Include Tab, Shift+Tab, Enter, Space, Esc, arrows, Home, End, PageUp/Down where relevant.
- **Focus order**: what receives focus on open, on close, on async update?
- **Accessible name**: where does the name come from: slotted text, `aria-label`, or associated `<label>`? Is it the same string a sighted user reads (2.5.3)?
- **Contrast pairs**: list every (foreground, background) pair the component uses, including hover/focus/active/disabled and dark theme. Note which need 4.5:1 vs 3:1.
- **Target size**: every clickable region ≥ 24×24 CSS px, or documented exception.
- **Error and loading states**: copy, role, and when it announces.

## What's new in WCAG 2.2 (vs 2.1)

AA-impacting deltas to review for every component:

- **2.4.11 Focus Not Obscured (Minimum)**: AA [NEW in 2.2]. Focused element must not be entirely hidden by author-created content.
- **2.5.7 Dragging Movements**: AA [NEW in 2.2]. Drag actions must have a single-pointer alternative.
- **2.5.8 Target Size (Minimum)**: AA [NEW in 2.2]. 24×24 CSS px, with spacing / inline / equivalent / UA-default / essential exceptions.
- **3.3.8 Accessible Authentication (Minimum)**: AA [NEW in 2.2]. No cognitive function test without an alternative.
- **3.2.6 Consistent Help**: Level A inherited at AA [NEW in 2.2].
- **3.3.7 Redundant Entry**: Level A inherited at AA [NEW in 2.2].
- **Removed: 4.1.1 Parsing**: obsolete. Residual concerns now fall under 1.3.1 and 4.1.2.

What's new summary: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## Pointers

For more detail, open:

- `references/wcag22-aa-matrix.md`: SC-by-SC obligations and how Fluid meets each.
- `references/aria-patterns.md`: APG roles and keyboard contracts per component family.
- `references/tokens.md`: contrast, focus, motion tokens and the SCs they back.
- `references/shadow-dom-ce.md`: shadow DOM ARIA, ElementInternals, FACE, slotted labels.
- `references/common-bugs.md`: recurring failures and the SC that flags them.
- `references/testing.md`: axe / Storybook / Playwright / manual keyboard + screen-reader patterns.
- `references/conformance-levels.md`: AA vs AAA, the `data-fluid-conformance` axis, conformance tokens.

## Spec-first principle

Conformance is determined by meeting **Success Criteria**, not by following any
particular technique. W3C techniques (sufficient / advisory / failure) are
informative, useful as evidence, not as the rule. When a reviewer and an author
disagree, resolve it by quoting the SC's normative text from
`https://www.w3.org/TR/WCAG22/` or its Understanding page, and the APG pattern
page from `https://www.w3.org/WAI/ARIA/apg/patterns/`. Do not paraphrase from
memory, re-fetch. APG and the Combobox guidance currently assume **WAI-ARIA
1.2**; ARIA 1.3 is a Working Draft and relaxes some requirements (e.g.
`aria-controls` on combobox becomes optional), so check which version is
Recommendation before flagging a violation.
