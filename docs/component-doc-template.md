# Component documentation page: requirement

Every `apps/docs/src/content/docs/components/<name>.mdx` page **MUST** follow
this requirement. It is derived from the two reference pages, which are the
gold standard and **MUST stay 1:1 in structure and convention with each other
and with this document**:

- [`button.mdx`](../apps/docs/src/content/docs/components/button.mdx): the
  lead page (full feature set: states, events, form, composition).
- [`button-group.mdx`](../apps/docs/src/content/docs/components/button-group.mdx)
, the same shape for a composition/layout component (skips the sections that
  don't apply, see [§ When a section doesn't apply](#when-a-section-doesnt-apply)).

This is a hard expectation, enforced by review. The build's coverage gate
(`pnpm check:coverage`) only checks that a page *exists* per component; the
*shape* below is your responsibility and a reviewer's (or the
[`component-authoring`](../.claude/skills/component-authoring/SKILL.md) skill's)
checklist item.

> **Always run `pnpm docs:build` after editing any `.mdx`.** `pnpm verify` does
> **not** compile the docs site, its `build` step only builds the component
> packages, so MDX/JSX errors (a stray backtick inside a `css``` comment, an
> unclosed inline-code span that makes MDX parse a later `<fluid-*>` as JSX)
> slip past a green `verify`. `docs:build` is the only gate that catches them.

---

## Required section order

Pages are read top-to-bottom; the order is **fixed** so anyone landing on any
component page knows where to look. `MUST` = always present (unless the
[doesn't-apply](#when-a-section-doesnt-apply) rules exempt it). `SHOULD` =
present whenever the component has the relevant surface.

0. **No per-page conformance toggle.** The AA⇄AAA segmented control is **global**
, it lives in the docs **header** (`HeaderConformanceToggle.astro`, rendered
   via the `SocialIcons` override) and persists across every page via
   `localStorage` + a pre-paint restore in `Head.astro`. Pages MUST NOT import
   or render their own toggle. The "what AA/AAA means" explanation belongs in the
   page's **AA vs AAA** accessibility subsection (§10b), and only on pages where
   the conformance axis actually applies.
1. **Lead paragraph** (MUST): one or two sentences: what the component *does*
   and what's notable. Lead with the job, not the title; don't restate the
   name or open with filler ("the workhorse of…").
2. **Hero `<Demo>`** (MUST): a small, representative example right under the
   lead. Visual first, prose later.
3. **`## Install`** (MUST): `<Tabs syncKey="install">` with `CDN` and `npm`
   tabs, showing the one-line setup for *just this component* (and any
   companions it composes with, e.g. a split button registers button + group +
   dropdown).
4. **`## Examples`** (MUST): then one `###` subsection per axis
   (variants → sizes → tones → states → composition), in increasing
   specialization. **Every `<Demo>` is immediately followed by a copyable
   snippet, and that snippet MUST be a `<ConformanceCode code={`…`} />`**, not a
   static ```html fence. `ConformanceCode` renders the markup twice, plain (AA)
   and wrapped in `data-fluid-conformance="aaa"` (AAA), and shows the one
   matching the header toggle, so the code a reader copies always reproduces what
   the live `<Demo>` is showing. A plain fence would silently stay AA even when
   the header toggle is on AAA, a correctness bug, not a style nit. (Only on
   pages whose component actually has a conformance delta, see §0 / §10b.) (Snippets that are
   *not* component markup, a JS handler, a `<script>`, a CSS block, stay
   ordinary fences.) Demonstrate every public prop / state at least once across
   the examples.
5. **`## Listening for <event>`** (SHOULD: when the component fires an event)
, `## Listening for clicks` / `for fluid-change` / `for fluid-input`, using
   `<Tabs syncKey="framework">` with **HTML / React / Vue / Angular / Svelte**
   tabs in that exact order, each showing the same handler. If a custom
   `fluid-*` event sits alongside a native one, end with a short
   `### <native> vs <fluid-event>` callout on when to pick each.
6. **`## Inside a form`** (SHOULD: form-associated components only), a live
   `<Demo>` of field + submit, then a link to [`/guides/forms/`](/guides/forms/).
7. **Composition** (SHOULD: where useful), `## As a link`, `## Inside a
   button group`, `## As a popover trigger`, etc. A `<Demo>` + snippet each.
8. **`## Theming`** (MUST): explain the **override ladder**: every styled
   property reads a component-scoped `--fluid-<name>-*` token that falls back
   to a main semantic var, giving brand → component → instance overrides for
   free. Name the most-overridden tokens, show a CSS block with a brand-wide
   override AND a per-instance (`[data-fluid-id]`) override, and **point at the
   [API tables](#api) as the complete, authoritative variable list** (don't
   hand-maintain a second list that can drift). End with an `<Aside type="tip">`
   pointing at the [Theme builder](/playground/). A component with no styling of
   its own (pure layout) states it exposes no tokens and links to the parts that
   do. **This section is only honest if the component actually follows the
   ladder + annotates it, see the next rule.** End the section with a
   **`### Beyond tokens: \`::part()\`` note**: every component MUST expose its
   inner root as `part="base"` (plus any meaningful sub-parts), annotated with
   `@csspart`, and the docs MUST point at `::part()` as the escape hatch for
   anything not tokenized. Tokens for the intended knobs **+** `::part()` for
   the long tail is the contract that makes the system "change anything"
   *without* exploding into a token per CSS sub-property. Corollary: **don't
   split a shorthand (border-radius, padding, border-width, inset) into
   per-side/per-corner tokens**, the single token already accepts the
   shorthand value, and `::part()` covers the rest. Per-side control becomes a
   token only when it's an intentional, designed feature (then it's a prop or
   variant, not raw sub-tokens).
9. **`## When to use`** + **`### When *not* to use`** (MUST): bulleted and
   prescriptive; the "not" list cross-links the component you *should* reach
   for instead.
10. **`## Accessibility`** (MUST): this is a first-class section, not a
    footnote. Open with one sentence on the underlying semantics (native
    element / APG pattern, what's free, what the component adds), then a link
    to [`/guides/accessibility/`](/guides/accessibility/) for the
    cross-component contract, and don't restate that contract here. Then cover
    the component's specifics under `###` subsections (include the ones that
    apply; the button page is the model):
    - **`### Keyboard`**: a **table** of key → action, plus a note on the
      focus indicator (`:focus-visible`, reads the focus-ring tokens).
    - **`### Names`**: how the accessible name is derived; icon-only / empty-
      label requirements; label-in-name stability across states.
    - **`### State semantics`**: what each state attribute does to ARIA
      (`disabled` vs `aria-disabled`, `loading` → `aria-busy`, `toggle` →
      `aria-pressed`, popup wiring, …).
    - **`### Motion & target size`**: `prefers-reduced-motion` behavior and
      the default 24×24 (AA) target floor.
    - **`### AA vs AAA`** (MUST *when the component has a conformance delta*;
      omit otherwise, see [§ doesn't-apply](#when-a-section-doesnt-apply)):
      explain that the component ships WCAG 2.2 AA by default and scales to AAA
      via `data-fluid-conformance="aaa"` (the **header** toggle is live, and the
      example snippets switch with it). Include the token-delta table for the
      dimensions the component exposes:

      | Token | AA | AAA | Criterion |
      | --- | --- | --- | --- |
      | `--fluid-target-min` | 24px | **44px** | 2.5.8 → 2.5.5 |
      | `--fluid-focus-ring-width` | 2px | **3px** | 2.4.7 → 2.4.13 |

      A composition/layout component whose targets come from its children
      (e.g. button-group) instead adds a one-line note that the toggle applies
      through the members and links to the lead page's table.
11. **`## API`** (MUST): `<ComponentApi tag="fluid-<name>" />`. The Custom
    Elements Manifest populates it; keep it auto-generated (pass editorial
    overrides as props rather than hand-writing tables). **The CSS-variable
    listing must be COMPLETE**, which is a property of the *component source*,
    not the page: annotate **every** component-scoped token with
    `@cssproperty` and **every** main var the component reads with
    `@uses-token` in the element's JSDoc. The page just renders them, but if a
    `var(--fluid-…)` in the component isn't annotated, it silently won't appear,
    so the "list every overridable variable" promise is only kept when the
    annotations match the stylesheet. (Quick audit:
    `grep -oE "var\(--fluid-[a-z0-9-]+" <component>.ts | sort -u` should be
    covered by the `@cssproperty` + `@uses-token` tags.)
12. **`## Related`** (MUST): `<CardGrid>` of `<LinkCard>`s: sibling
    components, the most relevant guide, and a **Framework integrations** card.
    Keep it to ≤ 5 entries.

---

## Framework-tabs convention

When a section shows the same code across frameworks, use
**`<Tabs syncKey="framework">`** with these tabs *exactly* in this order:

- `HTML`
- `React`
- `Vue`
- `Angular`
- `Svelte`

`syncKey="framework"` makes the reader's framework choice persist across every
page. The order matches the [Framework integrations
guide](/guides/frameworks/). Each tab shows the *simplest* handler; deeper
setup (TypeScript types, custom-element compiler hints) lives in the framework
guide, link to it from an `<Aside type="note">` inside the tab when a snippet
relies on something non-obvious. Don't pad snippets with default props
(`variant="primary"` etc.) the reader doesn't need.

## Imports cheat sheet

Top of every component page (drop the ones a given page doesn't use):

```mdx
import Demo from "../../../components/Demo.astro";
import ComponentApi from "../../../components/ComponentApi.astro";
import ConformanceCode from "../../../components/ConformanceCode.astro";
import { Tabs, TabItem, Aside, Card, CardGrid, LinkCard } from "@astrojs/starlight/components";
```

There is **no** per-page conformance toggle, it's global (docs header). Import
`ConformanceCode` only on pages whose examples actually change between AA and
AAA; `<ConformanceCode code={`…`} />` renders an example's copyable markup so it
tracks the header switch, use it for every component-markup snippet on those
pages (see §4).

## Style rules

- **Lead with the visual, then explain.** Hero demo before prose.
- **Every `<Demo>` is followed by a copyable snippet.** Never make a reader
  View Source to grab the markup.
- `<Aside type="tip">` for opt-in extras, `<Aside type="note">` for must-know
  caveats, `caution` only for "this can break things".
- Cross-link freely: component pages are leaves; the guides are the roots.
- Keep the tone informative and concrete; trim marketing adjectives.
- Match what Storybook shows; the two surfaces must not diverge.

## When a section doesn't apply

Keep the order intact, but omit a section when its surface doesn't exist:

- **No events** (pure layout: divider, page, split-panel, button-group) → skip
  §5 (Listening), there's nothing to listen for.
- **Not form-associated** → skip §6 (Inside a form).
- **No themable tokens** (format-bytes/number/date, relative-time) → §8
  Theming may be a one-liner noting it inherits text color; don't invent
  tokens.
- **No interactive target of its own** (composition/layout) → §10b is a
  one-line pointer to the lead page's AA/AAA table instead of a full table.
- **No conformance axis** (the component exposes no target-size / focus-ring
  surface that AAA changes, e.g. progress bar/ring, spinner, skeleton, badge,
  tag, divider, format-*, observers) → **omit the `### AA vs AAA` subsection
  entirely.** A toggle that does nothing to the component is noise; don't
  document a delta that isn't there.
- **Accessibility section only when applicable.** Components that render a UI
  surface or take focus keep a full `## Accessibility` section. **Pure
  utilities that render no UI of their own** (format-bytes/number/date,
  relative-time, the observers, include) reduce it to a one-line note (e.g.
  "renders inline text only; inherits the surrounding semantics") or omit it:
  don't manufacture keyboard tables or ARIA notes for a component that has
  neither.

Everything else, lead, hero demo, Install, Examples, When-to-use, Theming,
API, Related, is **always required**. Use judgment on content, never on the
skeleton.
