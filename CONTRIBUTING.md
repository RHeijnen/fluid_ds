# Contributing to Fluid

Thanks for considering a contribution! This guide covers what to expect.

## Ground rules

- Be kind. See the [Code of Conduct](./CODE_OF_CONDUCT.md).
- **Open an issue first** for anything bigger than a one-line fix so we can
  agree on the shape before code is written.
- Don't disable lints or tests to make a change pass: fix the root cause
  or open an issue if you think a rule is wrong.

## Dev setup

```bash
# Node 20+, pnpm via corepack
corepack pnpm install
corepack pnpm build      # one-time: tokens + icons need to be on disk
corepack pnpm dev        # opens Storybook + theme builder + docs
```

## The verify chain

Every change must pass `pnpm verify` locally before pushing:

```bash
pnpm verify
```

It runs:

1. `pnpm typecheck`: `tsc --noEmit` across every package + app
2. `pnpm lint`: flat-config ESLint with the Lit a11y plugin
3. `pnpm check:coverage`: enforces every component has a Storybook story
   and a theme-builder card (or is on the visual-exempt list)
4. `pnpm test`: `@web/test-runner` + Playwright; 254 component tests
5. `pnpm build`: all packages

CI re-runs `pnpm verify` on every PR across Chromium + Firefox + WebKit.

## Adding a component

1. Create `packages/components/src/components/<name>/` with the four files:
   - `fluid-<name>.ts`: the component class (extends `FluidElement`)
   - `define.ts`: registers the custom element
   - `fluid-<name>.stories.ts`: Storybook entry (required)
   - `fluid-<name>.test.ts`: `@open-wc/testing` test (required)
2. Annotate every component-scoped CSS variable with `@cssproperty` and
   semantic tokens consumed with `@uses-token` in the class JSDoc. The CEM
   analyzer extracts these into `custom-elements.json`, which drives the
   docs API tables.
3. Add a preview card to `apps/playground/src/preview.ts` **if the
   component has meaningful visual customization**. Otherwise add the tag
   to `PREVIEW_EXEMPT` in `scripts/check-component-coverage.mjs` with a
   comment explaining why.
4. Re-run `pnpm verify`. The coverage check catches missing stories or
   missing preview cards.
5. Add a changeset: `pnpm changeset`: picks the affected packages and a
   minor/patch bump, generates an entry in `.changeset/`.

## Architecture conventions

These are the rules that keep things coherent. See
[`docs/component-token-convention.md`](./docs/component-token-convention.md)
for the long form.

- **Component-scoped tokens**: every styled component declares its own
  `--fluid-{tag}-{role}` custom properties that default to semantic tokens.
  Consumers can override per-component or fall back to global semantics.
- **Side-effect-free imports**: `@fluid-ds/components` exports classes but
  importing the root does **not** register elements. Always go through
  `@fluid-ds/components/define/<name>` for registration so unused
  components stay shakable.
- **No backticks inside `css\`...\`` comments.** Tagged-template literals
  terminate at the first backtick, including ones inside `/* */`. The lint
  doesn't catch this, be careful.
- **Form-associated components** extend `FluidFormAssociated` from
  `internal/form-associated.ts` so they participate in `<form>` /
  `FormData` natively.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(button): add ghost variant
fix(input): handle empty form-associated value
docs(theming): clarify per-element scope
chore: bump dependencies
```

Scope is the component or area touched.

## Releasing (maintainers)

Releases are automated via [Changesets](https://github.com/changesets/changesets):

1. Every PR with a feature or fix includes a `.changeset/*.md` entry.
2. On merge to `main`, all nine release prerequisite workflows must succeed for
   that commit before the Changesets bot can open or update a release PR.
3. Merging that PR runs the same prerequisites before publishing to npm with
   provenance. Manual dispatch is main-only and does not bypass those gates.

The prerequisites cover verification, measured coverage, browser SSR,
accessibility, Storybook interactions, performance, package and framework
contracts, and visual regression. Missing baselines or failed checks block
publication. See [release gate wiring](docs/reviews/release-gates-2026-08-26.md)
for local verification scope and the remaining remote/manual sign-offs.

The current workflow explicitly passes `--tag latest`. It does not implement an
automatic `alpha` channel based on a version suffix. A reviewed prerelease-channel
policy remains required before using this workflow for prereleases; do not assume
the earlier alpha-tag documentation describes the current command.
