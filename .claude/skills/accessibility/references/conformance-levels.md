# Conformance levels: AA baseline + the AAA delta + the switchable architecture

Fluid targets **WCAG 2.2 Level AA** by default and offers an opt-in
**Level AAA** mode via a `data-fluid-conformance` attribute. This file is the
reference for what changes between the two levels, which AAA criteria a
component library can actually control, and how the switchable architecture is
built.

Sourced from a verified deep-research pass (8 high-confidence claims, all from
W3C primary sources). Where a fact was NOT deep-verified in that pass it is
marked **[unverified, confirm at source]** so a future editor re-fetches
rather than trusting a paraphrase.

## The one correction everyone gets wrong

**SC 2.4.13 Focus Appearance is Level AAA in published WCAG 2.2, NOT AA.**
It was proposed at AA in an earlier editor's draft, marked "at risk", and moved
to AAA before the final Recommendation. Any doc, lint rule, or skill that calls
it AA is wrong. (Verified 3-0 against the spec.)
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance

## AA baseline vs AAA delta (the criteria a component can control)

| Concern | AA criterion (default) | AAA criterion (opt-in) | The delta |
| --- | --- | --- | --- |
| Target size | **2.5.8** Target Size (Minimum), 24×24 CSS px | **2.5.5** Target Size (Enhanced), 44×44 CSS px | 24 → 44 |
| Focus obscured | **2.4.11** Focus Not Obscured (Minimum), not *entirely* hidden | **2.4.12** Focus Not Obscured (Enhanced), not hidden *at all* | partial → none |
| Focus indicator | (2.4.7 Focus Visible, AA, must be visible) | **2.4.13** Focus Appearance (AAA), area + contrast math | adds a size/contrast floor |
| Text contrast | **1.4.3** Contrast (Minimum), 4.5:1 / 3:1 large | **1.4.6** Contrast (Enhanced), 7:1 / 4.5:1 large | 4.5 → 7 |
| Text blocks |, | **1.4.8** Visual Presentation (AAA) | mostly author-owned |

Primary sources:
- 2.5.5 https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- 2.5.8 https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- 2.4.12 https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced
- 2.4.13 https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- 1.4.6 https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced
- 1.4.8 https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation

## AAA criterion triage for a component library

### Component-controllable (the design system can satisfy these)
- **2.5.5 Target Size (Enhanced)**: 44×44 via `--fluid-target-min`.
- **2.4.12 Focus Not Obscured (Enhanced)**: don't let sticky chrome / popovers
  cover a focused element at all (vs "not entirely" for AA).
- **2.4.13 Focus Appearance**: focus indicator meets the area + contrast math.
- **1.4.6 Contrast (Enhanced)**: 7:1 text; needs an AAA-validated palette
  (the hard one, see "the contrast problem").
- **1.4.8 Visual Presentation**: only for text-block components; mostly
  author-owned (line length, justification, resize).

### Author / content responsibility (the consumer owns these; we just don't block them)
1.2.x media alternatives, 2.4.9 Link Purpose (Link Only), 2.4.10 Section
Headings, 2.2.3 No Timing, 2.2.6 Timeouts, 3.1.3–3.1.6 reading level /
pronunciation / abbreviations, 3.2.5 Change on Request, 3.3.5 Help,
3.3.6 Error Prevention (All). The design system's job: provide the primitives
(accessible name slots, heading-level props, no surprise context changes) so a
consumer *can* meet these, and document the handoff.

### Not applicable to components
Page-level / site-level AAA criteria (e.g. 2.4.8 Location, 3.2.5 site-wide
behavior), out of scope.

## The numbers (verbatim-grounded)

### 2.5.5 / 2.5.8: "target" is the hit area, not the visible graphic
WCAG defines **target** as "region of the display that will accept a pointer
action, such as the interactive area of a user interface component." This is the
normative basis for the hit-area-vs-visible technique: a 16×16 visible icon with
padding can present a **24×24 (AA)** or **44×44 (AAA)** interactive target and
still satisfy the criterion. The visible chrome does not have to grow.

**2.5.5 exceptions (AAA, 44×44):** Equivalent (an alternative target meeting the
size exists on the page), Inline (target is inline and constrained by the
line-height of surrounding non-target text, use the normative "inline" wording,
not a loose "in a sentence" gloss), User Agent Control (UA-set, author
un-modified), Essential.

**2.5.8 spacing exception (AA, 24×24):** an undersized target passes if a
24-CSS-pixel-diameter circle centered on its bounding box does **not** intersect
another target **or** the 24px circle of another undersized target. (Full
compound condition, both clauses.)

### 2.4.13 Focus Appearance (AAA): area + contrast
The focus indicator must have an **area at least as large as a 2-CSS-px-thick
perimeter** of the unfocused component, **and** a **contrast ratio ≥ 3:1**
between the focused and unfocused states of those same pixels. It is a minimum
**area** requirement, a thicker outline, a 2px ring, or an inset indicator that
meets the area all qualify; it does not mandate a literal 2px outline.

Worked example for a 100×32 button: a 2px perimeter ≈ `2·(100+32)·2 = 528` px²
of indicator. A 2px solid outline around the full button trivially clears this.

### 1.4.6 Contrast (Enhanced, AAA): 7:1
≥ 7:1 for normal text, ≥ 4.5:1 for large text (≥18pt / ≥14pt bold), vs 1.4.3's
4.5:1 / 3:1.

## The dual-conformance architecture

### `data-fluid-conformance`: a fourth axis
Composes with the existing three (`data-fluid-theme`, `data-fluid-brand`, and
the implicit scheme). Default is AA (attribute absent). Set `aaa` on `<html>`
or any subtree:

```html
<html data-fluid-conformance="aaa">            <!-- whole app -->
<section data-fluid-conformance="aaa"> … </section>  <!-- one region -->
```

Because CSS custom properties inherit and re-resolve at their declaration scope,
an attribute-scoped block re-defines the conformance tokens for that subtree
only, leaving the rest of the page at AA. **[unverified, confirm the exact
cascade/inheritance wording at MDN CSS custom properties before citing it
normatively; note the project's existing semantic-token-resolution gotcha in
memory applies here too.]**

### The conformance token spec (what the axis swaps)

| Token | AA value | AAA value | Drives | SC |
| --- | --- | --- | --- | --- |
| `--fluid-target-min` | `24px` | `44px` | min hit target of icon buttons, checkbox, radio, switch, close buttons | 2.5.8 → 2.5.5 |
| `--fluid-focus-ring-width` | `2px` | `3px` | every focusable control's ring | 2.4.7 / 2.4.13 |
| `--fluid-focus-ring-offset` | `2px` | `2px` (keep ≥2 so the ring clears busy borders) | ring offset | 2.4.13 |
| contrast stops | 4.5:1 pairs | 7:1 pairs | text-on-surface token pairs | 1.4.3 → 1.4.6 |

Implementation: define these under a base layer at AA values, then re-declare
under `[data-fluid-conformance="aaa"]` at AAA values. Components read the tokens
and never branch on conformance themselves.

```css
/* base, AA defaults */
:root {
  --fluid-target-min: 24px;
  --fluid-focus-ring-width: 2px;
  --fluid-focus-ring-offset: 2px;
}
/* opt-in AAA, re-declares only the deltas, composes with theme + brand */
[data-fluid-conformance="aaa"] {
  --fluid-target-min: 44px;
  --fluid-focus-ring-width: 3px;
}
```

**Status (implemented).** `--fluid-target-min` (default 24px) and the
`[data-fluid-conformance="aaa"]` override (44px + 3px ring) ship in
`@fluid-ds/tokens` `base.css`. `fluid-button` reads `--fluid-target-min` for
its min target and the focus-ring tokens for its ring, so it scales AA→AAA with
no per-component branching, the button + button-group docs pages carry a live
AA⇄AAA toggle that proves it. When you bring a new component to standard, read
these tokens the same way (don't hard-code 24/44 or 2/3). The 7:1 contrast
track (1.4.6) is a brand-palette concern and is not yet built.

### The hit-area technique (icon buttons reach 44 without bloating)
The visible button stays its design size; a centered overlay grows the
*interactive* target to `--fluid-target-min` without affecting layout:

```css
.button.icon-only {
  position: relative;
}
.button.icon-only::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--fluid-target-min, 24px);
  height: var(--fluid-target-min, 24px);
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
}
```

This satisfies 2.5.5/2.5.8 because the "target" is the hit region, not the
visible graphic (verified). **Overlap caveat:** expanded hit areas can collide
in dense rows; when they do, rely on the 2.5.8 spacing math or group the
controls. Whether to gate the expansion behind `@media (pointer: coarse)` is a
judgment call, note that **2.5.5 itself makes no distinction by pointer
precision**, so touch-only gating is a pragmatic choice, not a spec requirement.
**[unverified, confirm `pointer: coarse/fine` semantics at MDN Media Queries
Level 5 before relying on it.]**

### The contrast problem (why AAA contrast is a separate, harder track)
7:1 (1.4.6) can be guaranteed for the **built-in brands** by choosing
AAA-passing stops, but **cannot** be guaranteed for **consumer-supplied custom
brand colors**, we don't control those values. Honest stance: ship AAA-valid
stops for default/midnight/corporate, and document that a custom brand under
`data-fluid-conformance="aaa"` must self-validate its pairs at 7:1. A build-time
token-contrast validator (sketched in `tokens.md`) should check both the 4.5:1
(AA) and 7:1 (AAA) thresholds per pair.

### prefers-contrast / forced-colors interaction
Whether `prefers-contrast: more` should auto-engage AAA contrast, and how
`forced-colors` (Windows High Contrast) interacts with the manual toggle, is a
real design question. Leaning: keep the manual `data-fluid-conformance` toggle
**orthogonal** to the media queries (explicit author intent), but consider
auto-bumping contrast under `prefers-contrast: more`. **[unverified, confirm
`prefers-contrast` / `forced-colors` semantics at MDN before implementing.]**

## Prior art

**No confirmed prior art found** for a runtime-switchable AA↔AAA conformance
level in a mainstream design system. The deep-research pass did not verify any
of USWDS, GOV.UK, Adobe Spectrum, Material 3, Carbon, Atlassian, Fluent 2, or
Salesforce Lightning shipping this, most target a single level (typically AA).
Treat switchable conformance as **likely novel ground**, but this is an
**[unverified]** negative, a dedicated search of each system's a11y docs is
needed before claiming "first" publicly.

## 5-minute AAA review checklist (delta over the AA checklist)

Run this *in addition* to the AA checklist in `SKILL.md` when a component must
work at AAA:

1. Does every pointer target reach **44×44** via `--fluid-target-min` (not a
   hard-coded 24/44)? (2.5.5)
2. Is the focus indicator area ≥ a 2px perimeter of the component, with ≥3:1
   between focused/unfocused states? (2.4.13)
3. When focused, is the element **fully** visible: not even partially covered
   by sticky chrome or the component's own popup? (2.4.12)
4. Do text-on-surface pairs hit **7:1** (4.5:1 large) in this brand + scheme?
   (1.4.6)
5. Does the component read the conformance tokens rather than hard-coding sizes,
   so it scales when `data-fluid-conformance="aaa"` is set on an ancestor?

## What the design system owns vs the consumer (at AAA)

- **We own:** target sizing tokens, focus-appearance tokens + ring, built-in
  brand 7:1 stops, not-obscuring focus in our own overlays.
- **Consumer owns:** 7:1 for custom brand colors, content-level AAA (reading
  level, link-only purpose, section headings, timing, help, media
  alternatives), and not placing our components under their own sticky chrome
  that obscures focus.

## Follow-ups (the unverified bits, for a future pass)
- Confirm CSS custom-property cascade wording at MDN for the attribute-scoped
  override claim.
- Confirm `prefers-contrast: more` / `forced-colors` / `pointer: coarse`
  semantics at MDN Media Queries Level 5.
- Dedicated prior-art search across the named design systems.
- Apple HIG (44pt) and Material (48dp) official citations for the
  visible-vs-touch-target framing.
