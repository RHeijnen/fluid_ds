# Accessibility testing: Fluid

Concrete testing patterns the design system runs on every PR and before each release.
WCAG 2.2 AA is the conformance target. Automated tools catch a floor of issues
(roughly 30–50% per Deque's own published figures); the rest is enforced by the
manual sweeps in this file. Treat green CI as necessary but not sufficient.

When a check fails, do not silence the rule. Fix the component, or, if the tool
is genuinely wrong, narrow the disable to the smallest scope with a comment that
names the SC the code does satisfy and how it satisfies it.

---

## Automated: every PR

### axe-core via @open-wc/testing

`@open-wc/testing` ships an `isAccessible()` audit that runs axe-core against the
rendered element. This is the per-component gate.

Rule families that matter for a design-system component test (full list at
<https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>):

| Rule ID | What it checks | Maps to SC |
|---|---|---|
| `color-contrast` | Text vs background ratio | 1.4.3 |
| `button-name` | `<button>` has an accessible name | 4.1.2 |
| `link-name` | `<a>` has an accessible name | 2.4.4, 4.1.2 |
| `image-alt` / `role-img-alt` | `<img>` and `role="img"` have alt text | 1.1.1 |
| `label` | Form controls have programmatic labels | 1.3.1, 4.1.2 |
| `aria-valid-attr` / `aria-valid-attr-value` | ARIA attribute names and values are valid | 4.1.2 |
| `aria-required-attr` | Required ARIA attributes for the role are present | 4.1.2 |
| `aria-allowed-attr` | ARIA attributes are valid on that role | 4.1.2 |
| `aria-roles` | Role values exist in the ARIA spec | 4.1.2 |
| `aria-required-children` / `aria-required-parent` | Composite-widget structure (e.g. `listbox` > `option`) | 1.3.1 |
| `focus-order-semantics` | Focusable elements have a role conveyable to AT | 1.3.1, 4.1.2 |
| `frame-title` | `<iframe>` has a title (rare in our components) | 4.1.2 |
| `duplicate-id-aria` | IDs referenced by ARIA are unique | 4.1.2 |

Shadow DOM caveat: axe walks shadow roots when invoked through
`@open-wc/testing` because it receives the host element directly. It will report
the offending node by its shadow path. Don't try to flatten the DOM to "help"
axe.

Example wiring inside a component test:

```ts
import { fixture, html, expect } from "@open-wc/testing";
import "../define.js";

it("is accessible in its default state", async () => {
  const el = await fixture(html`
    <fluid-button>Save changes</fluid-button>
  `);
  await expect(el).to.be.accessible();
});

it("is accessible while disabled", async () => {
  const el = await fixture(html`
    <fluid-button disabled>Save changes</fluid-button>
  `);
  // color-contrast is exempt for disabled controls per 1.4.3.
  await expect(el).to.be.accessible({
    ignoredRules: ["color-contrast"],
  });
});
```

`ignoredRules` is the narrow override. Never set it at the suite level.

### Storybook a11y addon

The addon runs axe on every story. Configure it to fail the build on `serious`
and `critical` violations; `moderate` and `minor` surface as warnings in the
panel and are reviewed at PR time.

Reference: <https://storybook.js.org/docs/writing-tests/accessibility-testing>

Every component needs at least one story per visually distinct state (default,
hover proxy, focus, disabled, error, loading, open / expanded). Each state is a
separate axe run.

### Playwright accessibility-tree assertions

For docs site + playground flows, drive the accessibility tree directly. This
catches name/role/value regressions that axe, which inspects DOM, not the
computed AT tree, can miss.

Reference: <https://playwright.dev/docs/accessibility-testing>

```ts
import { test, expect } from "@playwright/test";

test("primary CTA exposes name and role", async ({ page }) => {
  await page.goto("/components/button/");
  const cta = page.getByRole("button", { name: "Get started" });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAccessibleName("Get started");
});

test("combobox exposes description for the helper text", async ({ page }) => {
  await page.goto("/components/combobox/");
  const cb = page.getByRole("combobox", { name: "Country" });
  await expect(cb).toHaveAccessibleDescription(/required/i);
});
```

Prefer `getByRole` over `locator("css")` for anything user-facing, it is the
same query an AT user runs.

### Lighthouse caveat

Lighthouse a11y is a smoke check, not a gate. Its category surfaces only a
handful of axe rules and gives a single 0–100 score that masks which SC failed.
Run it for marketing pages if you must, but never as the per-component gate.

---

## Manual: every component before merge

A keyboard sweep, performed with the mouse pushed away from the keyboard.

- Tab through every interactive element in the story. Order matches visual
  reading order (1.3.2). Reverse with Shift+Tab and confirm symmetry.
- Focus is visible at every stop (2.4.7) and is not obscured by sticky headers,
  toasts, or the component's own popups (2.4.11 Focus Not Obscured (Minimum)
  [NEW in 2.2]). See
  <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>.
- Enter and Space activate buttons. Esc dismisses dialogs, popovers, menus, and
  tooltips. Arrow keys navigate composite widgets per the relevant APG pattern.
- Dialogs (APG <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>): focus
  moves into the dialog on open, is trapped inside while it is open, and returns
  to the trigger on close.
- Sliders and spinbuttons: Home and End jump to bounds; PageUp and PageDown step
  by a larger increment than the arrow keys.
- All pointer drag interactions have a non-drag keyboard equivalent (2.5.7
  Dragging Movements [NEW in 2.2]).
- Every interactive target is at least 24×24 CSS px, or has 24 px of clear
  spacing around it, or falls under the inline / UA-default / essential
  exceptions (2.5.8 Target Size (Minimum) [NEW in 2.2]).

---

## Manual: screen reader smoke test

The matrix below is the minimum sweep per release. For a PR that touches a
single component, the primary pair on each OS is enough.

| Combo | Role |
|---|---|
| NVDA + Firefox (Windows) | Primary desktop |
| JAWS + Chrome (Windows) | Secondary desktop |
| VoiceOver + Safari (macOS) | Primary desktop |
| TalkBack + Chrome (Android) | Mobile smoke |
| VoiceOver + Safari (iOS) | Mobile smoke |

What to verify per component:

- The accessible name, role, and current state (pressed, expanded, checked,
  selected, disabled, invalid) are announced on focus and re-announced on
  change. This is the 4.1.2 Name, Role, Value contract.
- Live regions (toast, form error summary) announce at the right verbosity:
  `polite` for non-urgent, `assertive` only when the user must act. Do not stack
  multiple assertive regions on one page.
- Focus moves audibly. If a click moves visible focus without the screen reader
  catching up, the component is at fault, usually a missing `.focus()` after a
  re-render.

---

## Build-time / pre-commit

- Token contrast validator (see `references/tokens.md`) blocks token pairs that
  fail 4.5:1 for text (1.4.3) or 3:1 for UI / focus rings (1.4.11).
- Coverage check: every component in `packages/components/src/components/` must
  expose at least one `isAccessible()` audit in its `.test.ts` and at least one
  story whose name contains `keyboard` or `focus` in its `.stories.ts`. The
  existing `pnpm check:coverage` rule is the place to extend this.
- Custom Elements Manifest: every `aria-*` attribute and every internal state
  surfaced via `ElementInternals` is documented in the component's JSDoc so the
  CEM analyzer picks it up. Consumers and the Design Mode inspector rely on
  this.

---

## Release-time / regression

- Full Playwright a11y suite across the docs site (Starlight) and the
  playground. Run the suite headed once locally before tagging; the CI run is
  headless.
- Visual regression for focus rings and disabled states across both color
  schemes and every brand theme. Focus indicators are a 1.4.11 surface, a
  theme that lowers contrast against an adjacent surface is a release blocker.
- Reduced-motion sweep: open every animated component with
  `prefers-reduced-motion: reduce` emulated, confirm transitions are removed or
  replaced with a cross-fade no longer than 200 ms.
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- Manual NVDA + VoiceOver sweep of every changed component, plus one untouched
  composite (combobox, dialog, tabs) as a canary against regressions in shared
  base classes.

---

## Output format for failures

When a check fails, in CI logs, in a PR review comment, or in a regression
report, the entry must contain:

1. The tool and rule ID (e.g. `axe-core: color-contrast`,
   `playwright: toHaveAccessibleName`).
2. The impact level reported by the tool (`critical`, `serious`, `moderate`,
   `minor`). Treat unlabelled Playwright failures as `serious`.
3. The affected element by component tag and shadow path, e.g.
   `fluid-button >> button.fluid-button__root`.
4. The WCAG 2.2 Success Criterion number and name it maps to.
5. A link to the W3C Understanding doc for that SC, of the form
   `https://www.w3.org/WAI/WCAG22/Understanding/<sc-name>.html`.

Do not paper over a failure with `disabledRules`, `ignoredRules`, or
`expect.soft`. If a rule is genuinely a false positive, narrow the disable to a
single test, comment with the SC the code satisfies and how a manual or
Playwright check verifies it, and open a follow-up issue against the tool
upstream.
