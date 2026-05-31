---
name: component-authoring
description: The end-to-end standard for building or reworking a Fluid component, semantics + WCAG 2.2 AA accessibility, component-scoped tokens that fall back to the main semantic vars, light/dark + three-brand theming with verified contrast, plus the required Storybook story, docs page, playground card, and tests. Invoke whenever creating a new fluid-* component, reworking an existing one, or reviewing a component PR.
---

# Fluid component authoring standard

Every component in this library is held to the same bar. This skill is the
checklist that bar is made of. Follow it top to bottom when you create a new
`fluid-*` element or rework an existing one. Do not skip steps, the last one
(`pnpm verify`) will fail the build if stories, a playground card, or a docs
page is missing, and a reviewer (human or the `accessibility` skill) will catch
the rest.

## When to invoke

- Creating a new `fluid-*` component.
- Reworking / refactoring an existing component (bring it up to standard as you
  touch it, we migrate one component per session, not in a big bang).
- Reviewing a component PR.
- Deciding whether a visual or token change is allowed.

## The non-negotiables

A component is not "done" until ALL of these are true:

1. **Correct semantics**: native element or the right WAI-ARIA APG role.
2. **WCAG 2.2 Level AA**: keyboard, focus, names, contrast, target size.
3. **Component-scoped tokens that fall back to the main semantic vars**: so a
   consumer can override one instance, one component, or the whole brand.
4. **Works in all three brands (default / midnight / corporate) × light + dark**
   with contrast that meets AA in every combination.
5. **A Storybook story** (`*.stories.ts`) covering every variant + state.
6. **A docs page** (`apps/docs/src/content/docs/components/<name>.mdx`).
7. **A playground preview card** (unless internal/non-visual: see the exempt
   lists in `scripts/check-component-coverage.mjs`).
8. **Tests** (`*.test.ts`) including the `isAccessible()` audit and regression
   tests for the component's contract.
9. **`pnpm verify` green.**

## The lifecycle (do these in order)

### 1. Semantics first

- Pick the WAI-ARIA APG pattern (or native element) the component maps to.
  Open `.claude/skills/accessibility/references/aria-patterns.md` and copy the
  required ARIA + keyboard contract for that pattern.
- If no APG pattern fits, document why in the component's JSDoc and derive ARIA
  from the closest analog.
- Prefer wrapping a real native element inside the shadow DOM (e.g. button wraps
  `<button>`, input wraps `<input>`) so you inherit keyboard + form behavior.
- For form-bearing components, use form-associated custom elements
  (`static formAssociated = true` + `ElementInternals`). See
  `.claude/skills/accessibility/references/shadow-dom-ce.md`.
- Add `delegatesFocus: true` on the shadow root for any component that wraps a
  single focusable control.

### 2. Component-scoped tokens (the override ladder)

This is the rule the user cares most about: **every styled property reads a
component-scoped variable that falls back to a main semantic variable.**

```css
/* RIGHT, inline var() fallback, no :host declaration */
.button {
  background: var(--fluid-button-bg, var(--fluid-accent-base));
  color: var(--fluid-button-fg, var(--fluid-accent-text));
}
```

```css
/* WRONG, pinning the value on :host breaks global overrides */
:host {
  --fluid-button-bg: var(--fluid-accent-base); /* now consumers can't retheme */
}
```

Why: the fallback chain gives three override levels for free:
1. brand level: override `--fluid-accent-base` → every component reflows;
2. component level: override `--fluid-button-bg` → all buttons change;
3. instance level: set `--fluid-button-bg` inline / via `[data-fluid-id]` → one
   button changes.

Rules:
- Name component tokens `--fluid-<component>-<role>` (e.g. `--fluid-button-bg`).
- **Every** styled property reads a `--fluid-<component>-*` token (not a main
  var directly) so it's overridable per-component, not only globally.
- Annotate every component token with `@cssproperty` and every main semantic
  var the component reads with `@uses-token`, the CEM feeds these into the
  docs API tables AND the Theme Builder, so an un-annotated `var(--fluid-…)`
  silently won't appear in either. Audit:
  `grep -oE "var\(--fluid-[a-z0-9-]+" <component>.ts | sort -u` should be fully
  covered by the two tag sets.
- **Expose the inner root as `part="base"`** (+ any meaningful sub-parts, e.g.
  the button's `spinner` / `caret`), annotated with `@csspart`. `::part()` is
  the escape hatch for any CSS we didn't tokenize, tokens for the intended
  knobs + `::part()` for the long tail is what makes the system open-ended.
- **Don't split a shorthand** (border-radius, padding, border-width, inset)
  into per-side/per-corner tokens, the single token already accepts the
  shorthand value (`--fluid-button-radius: 12px 12px 0 0`) and `::part()` covers
  the rest. Per-side control is a token only when it's an intentional feature
  (then a prop/variant, not raw sub-tokens).
- Full rationale + the semantic-resolution gotcha:
  `docs/component-token-convention.md`.

### 3. Theming: three brands, light + dark, verified contrast, AA + AAA

- The component must look right under `data-fluid-brand` = unset (default),
  `midnight`, and `corporate`, in both `data-fluid-theme="light"` and `"dark"`.
- **Conformance levels.** The library ships AA by default and an opt-in AAA
  mode via `data-fluid-conformance="aaa"`. A component must read the
  conformance tokens (`--fluid-target-min`, `--fluid-focus-ring-width`,
  `--fluid-focus-ring-offset`) rather than hard-coding sizes, so it scales to
  44×44 targets + enhanced focus when an ancestor opts into AAA, with zero
  per-component branching. Full spec + the AAA review checklist:
  `.claude/skills/accessibility/references/conformance-levels.md`.
  (Note: 2.4.13 Focus Appearance is Level **AAA**, not AA, a common mislabel.)
- Semantic status tones (success / danger / warning / info) are
  **theme-independent**, they do not change when the brand changes. Brand
  themes only retune the `--fluid-accent-*` track. (See the button's `tone`
  prop for the reference implementation.)
- Every `(foreground, background)` pair the component renders: including
  hover / active / disabled and the focus ring, must meet:
  - **4.5:1** for normal text, **3:1** for large text (≥18pt / ≥14pt bold):
    [SC 1.4.3];
  - **3:1** for the focus ring, borders, and any state-conveying graphic:
    [SC 1.4.11].
- Validate the pairs against `.claude/skills/accessibility/references/tokens.md`.
  When in doubt, compute the ratio, do not eyeball it.
- **Slotted content inherits the host PAGE's CSS, not your shadow styles.** Any
  component that slots text MUST pin typography on `:host` (line-height, font,
  size via `:host([size])`) and reset `::slotted(*) { margin: 0 !important }`,
  or it will balloon in a prose context (this exact bug shipped on the button:
  fine in Storybook, 48px tall in the docs). Full explanation + the required
  regression tests: `.claude/skills/accessibility/references/shadow-dom-ce.md`
  → "Slotted content inherits the PAGE's CSS". Always test the component inside
  a large-line-height wrapper, not only in Storybook.

### 4. Accessibility review

Run the 5-minute component review checklist in
`.claude/skills/accessibility/SKILL.md` against the component. At minimum:
- Keyboard: every action reachable; Tab/arrow contract matches the APG pattern;
  Esc closes popups.
- Focus: visible indicator (never `outline: none` without a replacement);
  focus never fully obscured ([SC 2.4.11]); focus restored after dialogs.
- Names: accessible name present, matches visible label ([SC 2.5.3]); icon-only
  controls carry `aria-label`.
- Target size: ≥ 24×24 CSS px on every size variant ([SC 2.5.8]).
- Motion: honors `@media (prefers-reduced-motion: reduce)`.

### 5. Story (`*.stories.ts`)

- One story per variant + per state (default, hover-via-controls, disabled,
  loading, error, sizes, tones, with-icon, icon-only).
- Wire `argTypes` for every public prop so the controls panel works.
- Lean on the Storybook a11y addon (axe): a story that fails axe is a bug.
- Match what the docs page shows; the two should not diverge.

### 6. Docs page (`apps/docs/src/content/docs/components/<name>.mdx`)

- **`docs/component-doc-template.md` is the REQUIREMENT**: follow its fixed
  section order and conventions exactly: the page opens with
  `<ConformanceToggle />`, leads with a hero `<Demo>`, has Install, Examples
  (each Demo + copyable snippet), the framework-tabs convention (HTML / React /
  Vue / Angular / Svelte), Theming, When-to-use, Accessibility **with the
  required `### AA vs AAA` subsection**, the `<ComponentApi>` table, and a
  Related grid.
- The two reference pages: `button.mdx` (full feature set) and
  `button-group.mdx` (composition/layout), are the gold standard and stay 1:1
  with each other and the requirement. Skip only the sections the requirement's
  "when a section doesn't apply" rules exempt (events, form), never the
  skeleton.

### 7. Playground preview card

- Add a `<fluid-card>` demo to `apps/playground/src/preview.ts` so Design Mode
  can inspect + retheme the component, unless it's internal or non-visual
  (then add it to `PREVIEW_EXEMPT` in the coverage script with a reason).

### 8. Tests (`*.test.ts`)

- `@open-wc/testing` `isAccessible()` audit.
- Regression tests for the component's contract: events fire, attributes
  reflect, keyboard activates, focus delegates, ARIA state is correct.
- Pin the accessibility fixes specifically (e.g. "aria-label forwards to the
  inner control", "sm meets 24×24").

### 9. Verify

```
pnpm verify   # typecheck → lint → check:coverage → test → build
```

`check:coverage` is the machine half of this standard, it fails the build if a
component is missing a story, a playground card, or a docs page. The
accessibility + theming + token rules are not machine-checked yet (a build-time
token-contrast validator is sketched in the accessibility skill's tokens
reference and is a worthwhile follow-up); until then they are enforced by this
checklist + review.

### 10. See it rendered: measure, don't assume

`pnpm verify` proves logic, not pixels. Before calling the component done,
**look at it rendered and measure the real result**, in Storybook (HMR) and in
a prose context (the docs page), via the Chrome DevTools MCP. Confirm the
metric you changed actually moved (height, alignment, contrast, focus ring).
A visual claim you didn't measure isn't verified. See the
[`verify-in-browser`](../verify-in-browser/SKILL.md) skill.

## File layout for a component

```
packages/components/src/components/<name>/
  define.ts              # customElements.define("fluid-<name>", …)
  fluid-<name>.ts        # the FluidElement subclass
  fluid-<name>.stories.ts
  fluid-<name>.test.ts
apps/docs/src/content/docs/components/<name>.mdx
apps/playground/src/preview.ts   # add a card (unless exempt)
```

## Related references

- `.claude/skills/accessibility/SKILL.md`: the a11y bar + checklists.
- `.claude/skills/accessibility/references/aria-patterns.md`: APG per pattern.
- `.claude/skills/accessibility/references/tokens.md`: contrast / spacing /
  motion token rules + the validator sketch.
- `.claude/skills/accessibility/references/shadow-dom-ce.md`: form-associated
  custom elements, ElementInternals, focus delegation.
- `docs/component-token-convention.md`: the override-ladder rule in full.
- `docs/component-doc-template.md`: the docs-page shape.

## Spec-first principle

Conformance is determined by meeting the WCAG Success Criteria, not by following
a particular technique. When a rule here and a primary source disagree, the
primary source (W3C WCAG 2.2 / WAI-ARIA APG) wins, re-fetch and quote it rather
than trusting a paraphrase.
