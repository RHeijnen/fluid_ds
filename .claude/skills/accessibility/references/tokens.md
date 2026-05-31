# Design-token accessibility validation

Reference for reviewing the `@fluid-ds/tokens` and `@fluid-ds/themes` packages
against WCAG 2.2 AA. Tokens are upstream of every component, a token that
encodes a WCAG failure propagates to ~50 components at once, so the validation
gate belongs at the token-manifest level, not the component level.

Normative sources cited inline. When a rule is paraphrased, the SC number lets
the reviewer re-fetch the verbatim text from
<https://www.w3.org/WAI/WCAG22/Understanding/>.

---

## Color tokens

### Text-on-surface pairs (1.4.3 Contrast (Minimum), AA)

<https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>

Every "text on surface" combination authorised by the semantic-token system
MUST meet:

| Text classification | Min contrast | Definition |
|---|---|---|
| Normal text | 4.5:1 | Less than 18pt (~24 px), or less than 14pt (~18.66 px) bold |
| Large text | 3:1 | At least 18pt / 24 px, or 14pt / 18.66 px bold |
| Incidental | exempt | Inactive UI, pure decoration, not visible, part of a picture with significant other content |
| Logotypes | exempt | Text that is part of a logo or brand name |
| Disabled | exempt | Per SC 1.4.3, controls that are inactive |

Disabled-control text is exempt but should still be distinguishable from
enabled text, otherwise users cannot tell what is interactive (perception
issue covered indirectly by 1.3.3 and 3.2 consistency SCs).

Concretely, for Fluid's semantic palette this means enumerating every
`--fluid-color-text-*` × `--fluid-color-surface-*` pair that the design
system documents as legal (e.g. `text-default` on `surface-base`,
`text-on-accent` on `accent-base`, `text-muted` on `surface-raised`, etc.)
and asserting the contrast. Pairs that are NOT documented as legal must
either be added to the validator's deny-list or simply not exist as semantic
tokens.

### Non-text pairs (1.4.11 Non-text Contrast, AA)

<https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>

3:1 minimum against ADJACENT colors for:

- **UI components and their states**: focus rings, form-field borders,
  checkbox/radio glyphs, selected-row indicators, the "thumb" of a switch
  vs its track, the visual boundary that identifies a control.
- **Graphical objects required to understand the content**: icon-only
  glyphs that carry meaning (an alone "X" close button), chart strokes,
  the line in a sparkline, the bar fill of a `<meter>` against its track.

Exempt: invisible / disabled controls, glyphs whose information is also
available in text, controls styled solely by the UA default.

For Fluid: validate `--fluid-color-border-*` vs surrounding
`--fluid-color-surface-*`, `--fluid-color-focus-ring` vs every surface,
`--fluid-color-icon-*` vs the surface it sits on.

### Build-time validation recipe

The W3C contrast formula (relative luminance, +0.05 offset) is normative;
APCA / WCAG 3 Lc values are NOT normative and MUST NOT gate conformance.
See WebAIM's explanation: <https://webaim.org/articles/contrast/>.

The manifest at `@fluid-ds/tokens/manifest.json` already lists primitives
and semantic references. A token validator should:

1. Resolve each semantic color to a primitive hex.
2. Iterate the documented foreground-on-background pairs (text + non-text).
3. Compute WCAG2 contrast.
4. Fail the build below threshold; pass with the full table logged.

The axe-core `color-contrast` rule
(<https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>)
checks the same computation at runtime against rendered DOM, useful as a
second line of defence in component tests, but cannot see un-instantiated
combinations.

### Brand-override safety

When consumers override `--fluid-color-primary` (or any brand primitive)
they invalidate every derived semantic pair the design system pre-computed.
Document this contract in the theming guide:

> "Overriding any `--fluid-color-*` primitive transfers WCAG 1.4.3 / 1.4.11
> conformance responsibility to the consumer for every semantic pair
> derived from that primitive. Re-run the token validator against your
> brand to confirm 4.5:1 (text) and 3:1 (non-text)."

The validator script SHOULD be exported from `@fluid-ds/tokens` so
consumers can run it against their own brand layer.

---

## Typography tokens

### 1.4.4 Resize Text (AA)

<https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html>

Text must scale to 200% without loss of content or function. Do:

- Define `--fluid-font-size-*` in `rem` (or `em` where component-relative
  scaling is intentional). Never in raw `px`.
- Set `font-size` on `:root` / `html` to `100%` (16px UA default) rather
  than overriding to a px value.

Don't:

- Bake `px` font-sizes into component shells.
- Use `vw`-based font-sizes for body text (200% page zoom does not scale
  viewport units the same way).

### 1.4.12 Text Spacing (AA)

<https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html>

Verbatim: content must remain functional when a user applies all four:

| Property | User-applied value |
|---|---|
| `line-height` | at least 1.5× the font size |
| spacing following paragraphs | at least 2× the font size |
| `letter-spacing` | at least 0.12× the font size |
| `word-spacing` | at least 0.16× the font size |

Token-system implications:

- Component shells (buttons, chips, tags, inputs) MUST NOT have a fixed
  `height`. Use `min-height` paired with vertical padding tokens so
  increased `line-height` grows the box instead of clipping.
- Single-line truncation (`white-space: nowrap; overflow: hidden`) on
  static text is a 1.4.12 risk, avoid in defaults, opt-in only.
- `letter-spacing` overrides will increase the rendered width of every
  control with text; reflow must still work (see 1.4.10).

Test by injecting the four overrides via the bookmarklet referenced from
the Understanding page and visually scanning the playground.

### 1.4.10 Reflow (AA)

<https://www.w3.org/WAI/WCAG22/Understanding/reflow.html>

Content must reflow at 320 CSS px width (or 256 CSS px tall for horizontal
content) without two-dimensional scrolling, except where the content
requires it (tables, maps, diagrams, video, games, toolbars).

Token-system implications:

- Avoid `--fluid-size-*` tokens that hard-code component widths in px.
- Container queries are preferred over media queries for component
  responsiveness so components reflow inside arbitrarily narrow parents.
- Tables get the dispensation, but the design system should provide an
  overflow-wrapper pattern so the table itself is the only thing that
  scrolls horizontally, not the page.

---

## Spacing tokens

### 2.5.8 Target Size (Minimum) [NEW in 2.2] (AA)

<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>

Every pointer target ≥ 24×24 CSS px, with these documented exceptions:

| Exception | Meaning |
|---|---|
| Spacing | A 24-CSS-px-diameter circle centred on the target does not intersect any other target's bounding box (or its own 24-px circle). |
| Equivalent | Another target on the same page achieves the same function and meets 24×24. |
| Inline | The target is in a sentence or block of text. |
| User-agent | Size is determined by the UA and not modified by the author. |
| Essential | A particular presentation is essential or legally required. |

Token-system implications:

- The "small" / `sm` size variant of every interactive control
  (Button, IconButton, Checkbox, Radio, Switch, Tab, Chip, Pagination
  page-number, Tree expand-toggle, Combobox clear-button, etc.) MUST
  either:
  - have an effective hit-area ≥ 24×24 CSS px on its own, OR
  - be documented as relying on the "spacing" exception, with the minimum
    surrounding gap explicitly stated and enforced by a spacing token.
- The "medium" / `md` size variant should target 44×44 (which is the
  AAA-level SC 2.5.5 threshold and matches platform HIG minimums) so
  designers picking the default are not on the edge.

Document per-variant hit-areas in the component reference table, e.g.:

```
Button
  sm  height 24, min-width 24  (meets 2.5.8 directly)
  md  height 40                 (well above 2.5.8)
  lg  height 48                 (well above 2.5.8)
IconButton
  sm  24×24                     (meets 2.5.8 at the limit; consumers must
                                  ensure 24-px spacing exception when
                                  packed in toolbars)
```

If a sub-24 target is unavoidable for visual reasons (e.g. a 16-px
"clear" affordance inside a 32-px-tall input), expand the hit area
beyond the visible glyph using padding + `::before` overlay so the
testable target, not the painted icon, is ≥ 24×24.

---

## Motion tokens

### 2.3.3 Animation from Interactions (AAA: adopted as practical AA baseline)

<https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>

2.3.3 is Level AAA, so it is informative for an AA-target design system.
But because motion preferences are surfaced by every modern OS and most
WCAG audits flag missing reduced-motion handling, treat it as required
for Fluid's defaults.

Required pattern:

- Every motion-related token (`--fluid-duration-*`, `--fluid-easing-*`,
  any `transition`/`animation` shorthand token) MUST be neutralised under
  `@media (prefers-reduced-motion: reduce)`.
- Provide a single `--fluid-duration-instant: 0ms` (or `0.01ms` to keep
  transitionend events firing) that the reduced-motion media query swaps
  every other duration to.

```css
:root {
  --fluid-duration-fast: 120ms;
  --fluid-duration-base: 200ms;
  --fluid-duration-slow: 320ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --fluid-duration-fast: 0.01ms;
    --fluid-duration-base: 0.01ms;
    --fluid-duration-slow: 0.01ms;
  }
}
```

MDN: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>.

Vestibular safety (also covered by 2.3.3 + 2.2.2 Pause, Stop, Hide):

- Don't ship parallax, large-area scale animations, screen-wide slide
  transitions, or auto-playing loops in defaults.
- A `Carousel` component (APG pattern) MUST default to no auto-rotation;
  if a consumer opts in, the carousel MUST expose pause/stop and respect
  `prefers-reduced-motion`.

---

## Focus-indicator tokens

### 2.4.7 Focus Visible (AA) + 1.4.11 Non-text Contrast (AA)

<https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html>
<https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>

2.4.7 requires that keyboard focus has a visible indicator. F78 documents
the specific failure of removing the UA outline without providing a
replacement. 1.4.11 requires the indicator itself meets 3:1 against
adjacent colors.

For a multi-surface design system the focus-ring token MUST satisfy 3:1
against EVERY surface a focusable element can sit on, in EVERY theme:

- Light theme: ring vs `surface-base`, `surface-raised`,
  `surface-sunken`, `accent-base`, `danger-base`, `success-base`,
  `warning-base`, plus any "on-accent" surfaces.
- Dark theme: the same enumeration, with a re-validated ring color
  (typically inverted).
- Brand themes: every brand-override surface.

This usually means the ring needs an inner-and-outer construction (two
strokes of contrasting colors) or an offset so it sits on a known
surface, not on the variable component fill.

Recommended dimensions:

| Token | Minimum | Rationale |
|---|---|---|
| `--fluid-focus-ring-width` | ≥ 2 CSS px | <2 px disappears on high-DPI displays and at high zoom. |
| `--fluid-focus-ring-offset` | ≥ 2 CSS px | Keeps the ring visible against busy component borders. |
| `--fluid-focus-ring-color` | passes 3:1 vs every documented surface | Validated by the token script. |

AAA SCs 2.4.12 Focus Not Obscured (Enhanced) and 2.4.13 Focus Appearance
are informative for an AA-target system, but 2.4.13's geometric
definition (≥ 2 px perimeter, ≥ 3:1 contrast change) is a useful
sanity-check spec for the focus-ring token even when not gating.

Don't:

- `outline: none` without a replacement (F78).
- Rely on a 1-CSS-px outline.
- Use a focus color that only contrasts against the default surface.

---

## Token-validation script outline

A ~20-line sketch the reviewer can adapt. Run from `pnpm verify` so the
build fails on regressions, log the full table on success so reviewers
can see safety margins.

```js
import manifest from "@fluid-ds/tokens/manifest.json" with { type: "json" };

const PAIRS = manifest.a11yPairs; // [{ fg, bg, kind, label, large? }, ...]

const lum = (hex) => {
  const c = hex.match(/[\da-f]{2}/gi).map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [L1, L2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (L1 + 0.05) / (L2 + 0.05);
};

const min = (p) =>
  p.kind === "text" ? (p.large ? 3 : 4.5) : 3; // non-text + focus-ring

const rows = PAIRS.map((p) => ({
  ...p,
  ratio: +contrast(manifest.resolve(p.fg), manifest.resolve(p.bg)).toFixed(2),
  required: min(p),
})).map((r) => ({ ...r, pass: r.ratio >= r.required }));

console.table(rows);
const fails = rows.filter((r) => !r.pass);
if (fails.length) {
  console.error(`${fails.length} contrast failures`);
  process.exit(1);
}
```

What the script enforces, mapped to SCs:

- text pair < 4.5:1 (or < 3:1 if `large`) → 1.4.3 fail
- non-text pair < 3:1 → 1.4.11 fail
- focus-ring pair < 3:1 → 2.4.7 + 1.4.11 fail (the indicator is
  unperceivable on that surface)

What the script CANNOT enforce, and therefore must be reviewed manually
or by component-level axe runs:

- Rendered combinations the manifest didn't anticipate (consumer puts a
  `text-muted` token on a non-documented surface).
- Contrast against gradient or image backgrounds.
- Contrast under user stylesheet overrides.
- Disabled-state intentional fades (exempt by 1.4.3 but still need
  perceptual distinctness for 3.2 consistency).

For those, rely on `@open-wc/testing`'s axe audit in component tests
and the Storybook a11y addon during authoring:
<https://storybook.js.org/docs/writing-tests/accessibility-testing>.

---

## Quick checklist for token PRs

- [ ] New color token: added to the manifest's `a11yPairs` for every
      surface it can appear on; passes the validator.
- [ ] New typography token: uses `rem`/`em`, not `px`; does not lock a
      fixed height anywhere downstream.
- [ ] New spacing / size token: smallest interactive variant ≥ 24×24
      or documented under the 2.5.8 spacing exception.
- [ ] New motion token: paired with a `prefers-reduced-motion: reduce`
      override.
- [ ] New focus-related token: ring passes 3:1 against every surface in
      every theme; width ≥ 2 px; offset ≥ 2 px.
- [ ] Brand-override doc updated if the new token participates in
      consumer-overridable derivations.
