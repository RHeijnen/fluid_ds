# Wrangler lock resolution — 2026-08-27

## Outcome

The website deployment no longer downloads or selects a CLI at execution time. The root now declares exact `wrangler` `4.127.0`, pnpm 9.15.0 records that version and its registry SHA-512 in the shared lockfile, and the deployment runs the installed binary through `pnpm exec`.

The existing Cloudflare Pages contract is unchanged: the workflow deploys `website`, targets project `fluid-25z`, sets branch `main`, and passes only the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. The job retains `contents: read` and `deployments: write`; no additional permission was introduced.

Wrangler 4.127.0 declares Node `>=22.0.0`, so the deploy job's Node runtime moved from 20 to 22. The repository-wide Node engine remains unchanged.

## Current primary guidance

Cloudflare documentation checked on 2026-08-27 says Wrangler should be installed locally in each project so collaborators use the same version and can roll it back. Its v3-to-v4 guide identifies v4 as the current major. The Pages Direct Upload documentation confirms `wrangler pages deploy <directory>` and the `--branch` option, while the current continuous-integration guide confirms `--project-name` and the same `CLOUDFLARE_ACCOUNT_ID` authentication boundary.

- [Install and update Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Migrate from Wrangler v3 to v4](https://developers.cloudflare.com/workers/wrangler/migration/update-v3-to-v4/)
- [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Direct Upload with continuous integration](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)

The npm registry metadata fetched read-only for `wrangler/latest` identified 4.127.0, Node `>=22.0.0`, tarball integrity `sha512-4dPqcBEMJfGeZeNnjHT7ThNJs+EiNYxUTg4ywqIdQubcXHBhFeVMQyHV4A9AOhZRFr83cckqdds034KGcr/dtw==`, and npm provenance metadata. The local guard binds the version and integrity but does not claim that remote provenance was independently verified.

## Fail-closed contract

The supply-chain audit now rejects:

- a missing, ranged, or changed root Wrangler declaration;
- a missing or changed root lock importer;
- a changed registry integrity, engine declaration, or binary marker;
- `pnpm dlx`, `npx`, and other execution outside the frozen graph;
- a Pages deployment command that differs from the reviewed directory, project, or branch;
- a deploy runtime below Node 22.

The exact reviewed invocation is:

```text
pnpm exec wrangler pages deploy website --project-name=fluid-25z --branch=main
```

## Lockfile audit

Compared with the pre-Wrangler lockfile, the generated change is 796 additions and two deletions. The only importer change is the root `wrangler: 4.127.0` entry. The package additions are Wrangler 4.127.0 and its resolved dependency/platform graph. The two removed lines change the existing `@img/colour@1.1.0` snapshot from optional-only to shared mandatory use because Wrangler's Miniflare dependency introduces Sharp 0.35.2. The previously reviewed xlsx URL/version/SHA-512 binding remains byte-for-byte present.

No other importer, declared package version, patch, or package-manager policy changed.

## Verification

All installation work ran in disposable workspace mirrors. No install rewrote the repository's `node_modules`, and package scripts were disabled.

```text
corepack pnpm@9.15.0 install --frozen-lockfile --ignore-scripts
  passed; lockfile resolution was skipped as up to date.

corepack pnpm@9.15.0 install --frozen-lockfile --offline --ignore-scripts
  passed from an empty mirror; 1,727 packages added with zero downloads.

node_modules/.bin/wrangler --version
  4.127.0

node_modules/.bin/wrangler pages deploy --help
  passed; confirmed directory, --project-name, and --branch syntax.

node --test scripts/check-supply-chain.test.mjs
  7 passed, 2 opt-in install proofs skipped.

FLUID_VERIFY_WRANGLER_INSTALL=1 node --test scripts/check-supply-chain.test.mjs
  8 passed, 1 unrelated xlsx proof skipped; pnpm 9.15.0 frozen seed and offline reinstall both retained the lock and executed Wrangler 4.127.0 help locally.

node scripts/check-supply-chain.mjs
  passed for all 11 workflows.
```

The passing audit evidence is retained under `quality/evidence/supply-chain/2026-08-27T14-11-04-780Z/result.json`. No Wrangler login, account query, Pages request, deployment, tag, publish, commit, push, secret read, or other remote mutation was performed.
