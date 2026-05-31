# Changesets

This directory holds [Changesets](https://github.com/changesets/changesets), small markdown files describing version bumps for each release.

## Workflow

1. After making changes to one or more packages, run `pnpm changeset` from the repo root.
2. Pick the packages that changed and the bump type (patch / minor / major).
3. Write a short summary describing the change from a consumer's perspective.
4. Commit the generated `.md` file alongside your code change.

When releasing, `pnpm changeset version` consumes all pending changesets, bumps the relevant `package.json` versions, and updates each package's `CHANGELOG.md`. `pnpm changeset publish` then publishes to npm.

The Storybook app is marked `ignore` because it isn't published.
