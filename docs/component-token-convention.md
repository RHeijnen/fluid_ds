# Component-scoped tokens: convention

Every styled Fluid component declares its own CSS custom properties for the
things that designers will routinely want to override. Those properties
**default to the matching semantic token** but live in the component's own
namespace, so a designer can change either layer:

- Edit the semantic token to apply the change everywhere
  (e.g. `--fluid-color-primary` flips every accent in the app)
- Edit the component token to scope the change to one component
  (e.g. `--fluid-button-bg` changes buttons only)

## The pattern

In the CSS, **consume the component token first** with the semantic token as
fallback:

```css
.button {
  background-color: var(--fluid-button-bg, var(--fluid-accent-base));
  color: var(--fluid-button-fg, var(--fluid-accent-text));
}
```

Then document each component token with `@cssproperty` so the playground's
design panel picks it up:

```ts
/**
 * @cssproperty --fluid-button-bg - Background color override.
 * @cssproperty --fluid-button-fg - Foreground color override.
 *
 * @uses-token --fluid-accent-base - Primary variant background.
 * @uses-token --fluid-accent-text - Primary variant text color.
 */
```

## Naming

Component tokens follow `--fluid-{tag-without-prefix}-{role}`:

| Role                | Example                          |
| ------------------- | -------------------------------- |
| Background          | `--fluid-card-bg`                |
| Foreground / text   | `--fluid-card-fg`                |
| Border              | `--fluid-card-border`            |
| Accent / brand fill | `--fluid-card-accent`            |
| Specific surface    | `--fluid-card-header-bg`         |
| Sizing              | `--fluid-card-padding`           |
| Radius              | `--fluid-card-radius`            |

For multi-element components (e.g. a dialog has a header, body, footer) the
role goes after the element: `--fluid-dialog-header-bg`,
`--fluid-dialog-footer-bg`.

## Rules

1. Never read a semantic token (e.g. `--fluid-accent-base`) **directly** in a
   style declaration that could meaningfully be customized per-component.
   Always wrap it in the component token first.
2. Tokens that are purely structural (`--fluid-space-*`, `--fluid-radius-*`,
   `--fluid-font-size-*`) don't need wrapping, they're palette-level
   utilities, not roles.
3. Each new component token must be annotated with `@cssproperty` in the
   component's TypeScript JSDoc.
4. Variant-specific tokens use the variant suffix:
   `--fluid-callout-info-bg`, `--fluid-callout-danger-bg`.

## Why the fallback form, not host declaration?

You might see both forms in the codebase:

```css
/* Form A, inline fallback (preferred) */
.button { background: var(--fluid-button-bg, var(--fluid-accent-base)); }

/* Form B, :host declaration */
:host { --fluid-button-bg: var(--fluid-accent-base); }
.button { background: var(--fluid-button-bg); }
```

Form A is preferred because it doesn't pin the resolved value at the host
scope. With Form B, a wrapping override of `--fluid-accent-base` does **not**
flow through to `--fluid-button-bg` (the `:host` rule has already computed
it). Form A re-resolves on every use site, so global semantic overrides
keep working even when no component-scoped override is present.

See `feedback_semantic_token_resolution.md` in the memory for the underlying
CSS rule.
