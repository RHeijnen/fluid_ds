# Dependency patches

## @storybook/test-runner 0.20.1: view mode and completed-story synchronization

The published setup script contains `{{viewMode}}`, but both distributed
`setupPage` implementations omit that substitution. During consecutive story
runs, Storybook 8.6.18 receives the placeholder as the view mode. Separately, the
runner advances on `storyRendered`, before post-story hooks finish. Storybook
reloads when that pending work cannot be torn down, and the runner retries after
the resulting destroyed execution context. Fixing the placeholder alone did not
eliminate the reload; both causes were isolated with a two-story browser probe.

The patch adds the missing substitution in the CommonJS and ESM builds, waits
for Storybook 8.6's `storyFinished` event, and rejects an error completion status.
Waiting for completion follows the newer upstream runner. It does not relax play
assertions or alter the Storybook runtime or the runner's retry mechanism.
pnpm applies the version-specific patch during installation using the checked-in
lockfile. The `patch-commit` pnpm command generates this dependency patch; it does
not create a Git commit.

Run `pnpm --filter @fluid-ds/storybook test:runner` against built Storybook
(`TARGET_URL` defaults to `http://127.0.0.1:6006`). It requires four consecutive
story executions with no iframe navigations and verifies that an intentionally
failing play function is still rejected in a disposable browser context.

Remove the patch only when an explicitly tested compatible runner version
performs correct view-mode substitution, waits for completion, and passes this regression check.
Upstream references: [runner repository](https://github.com/storybookjs/test-runner)
and [setup source](https://github.com/storybookjs/test-runner/blob/v0.20.1/src/setup-page.ts).
