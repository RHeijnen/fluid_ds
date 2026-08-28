# Supply-chain and workflow hardening — 2026-08-27

## Outcome

The repository now has an offline, fail-closed audit for all 11 GitHub Actions workflows, 46 external action invocations, nine local reusable-workflow calls, package-manager installation commands, dependency execution outside the lockfile, and the known xlsx remote-tarball boundary. The release workflow runs this audit after its frozen install and before any build or publication-capable step.

The latest audit is green. The former floating Wrangler blocker is resolved by the exact root `wrangler` 4.127.0 declaration, its integrity-bound pnpm lock entry, and a `pnpm exec` deployment. Remote token, signing, provenance-verification, and environment-protection policy remain owner/external decisions.

## Current primary guidance

The implementation follows current primary documentation checked on 2026-08-27:

- GitHub says a full commit SHA is the only immutable way to reference an action and recommends default read-only `GITHUB_TOKEN` permissions: [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use).
- GitHub identifies direct `${{ }}` interpolation of attacker-controlled contexts into `run` scripts as a command-injection surface: [Script injections](https://docs.github.com/en/actions/concepts/security/script-injections).
- GitHub documents that build attestations require explicit OIDC and attestation permissions and that attestations must be verified to provide a security benefit: [Using artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations) and [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations).
- npm's current trusted-publishing guidance requires GitHub-hosted runners, `id-token: write`, Node 22.14 or newer, and npm 11.5.1 or newer; eligible public packages receive npm provenance automatically: [Trusted publishing](https://docs.npmjs.com/trusted-publishers/).
- pnpm documents frozen lockfile installation for CI and honors the exact root `packageManager` selection: [Continuous integration](https://pnpm.io/continuous-integration).
- SheetJS identifies its CDN as the authoritative package source but recommends vendoring for stability: [Frameworks and bundlers](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/).

These citations support the boundary decisions; they are not evidence that remote repository, npm, or Cloudflare settings are configured correctly.

## Immutable action inventory

The former movable major references were resolved read-only against the official repositories and replaced with full commit identifiers. Comments retain the human-readable major line.

| Action                    | Reviewed commit                            | Line      |
| ------------------------- | ------------------------------------------ | --------- |
| `actions/checkout`        | `11d5960a326750d5838078e36cf38b85af677262` | v4        |
| `actions/checkout`        | `d23441a48e516b6c34aea4fa41551a30e30af803` | v6        |
| `actions/setup-node`      | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4        |
| `actions/setup-node`      | `249970729cb0ef3589644e2896645e5dc5ba9c38` | v6        |
| `actions/setup-python`    | `5fda3b95a4ea91299a34e894583c3862153e4b97` | v7        |
| `actions/cache`           | `0057852bfaa89a56745cba8c7296529d2fc39830` | v4        |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4        |
| `actions/github-script`   | `f28e40c7f34bde8b3046d885e986cb6290c5673b` | v7        |
| `pnpm/action-setup`       | `f40ffcd9367d9f12939873eb1018b921a783ffaa` | v4        |
| `changesets/action`       | `a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d` | v1 branch |

The guard rejects movable tags, shortened SHAs, unknown actions, and revisions outside this reviewed allowlist. Future action updates therefore require an explicit allowlist review rather than silently following a moved major tag.

## Permission and untrusted-input boundaries

Every workflow now declares top-level `contents: read`. The only write-capable jobs are:

- website deployment, restricted to `push` on main and manual dispatch, with `deployments: write`;
- release, restricted to main push/manual dispatch, with contents and pull-request write plus OIDC token creation;
- the visual-failure comment job, with only `pull-requests: write`.

The visual build previously ran checked-out PR code and package scripts in the same write-capable job that posted comments. It is now split: the build job remains read-only, while the comment job neither checks out nor executes repository/PR content and invokes only the pinned GitHub Script action. Fork PR token downgrades may still prevent a comment; the diagnostic artifacts remain available and the workflow does not switch to `pull_request_target` to bypass that protection.

There are no `pull_request_target` or `workflow_run` triggers, no secret references in pull-request workflows, and no untrusted GitHub context expressions embedded directly in shell scripts. The static framework matrix value is passed through an environment variable before shell use.

## Install, package-manager, and script execution

- Root `packageManager` remains exactly `pnpm@9.15.0`.
- All workspace dependency installations use `--frozen-lockfile`.
- Explicit pnpm setup versions, where present, agree with the root pin.
- Pipe-to-shell installers and `npx`/`pnpm dlx` execution are rejected.
- Website deployment uses exact, lockfile-owned Wrangler 4.127.0 on its required Node 22 runtime.
- The exact npm `11.18.0` release bootstrap remains a reviewed release-workflow assumption; changing how npm itself is installed belongs with the remote trusted-publishing decision.

The deployment guard also binds the complete Pages command, including output directory, project, and branch. See [Wrangler lock resolution](./wrangler-lock-resolution-2026-08-27.md) for the primary Cloudflare guidance, lock audit, and offline installation proof.

## xlsx integrity resolution

`@fluid-ds/parser` continues to depend on the official `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, without a version or API change. SheetJS's maintainer-published tarball checksum for 0.20.3 is MD5 `aac39517149362ea8123d8a303486c3c`. Two independent HTTPS fetch/hash implementations reproduced that checksum and produced SHA-512 SRI `sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==` for 2,409,319 bytes.

The lock resolution now binds that exact URL, version `0.20.3`, and full SHA-512. The offline guard contains the same reviewed constants and rejects a changed declaration, URL, version, missing hash, or one-byte/hash tamper. The package manifest, xlsx version, parser runtime, and public API are unchanged. Vendoring remains a possible future stability choice, not a prerequisite for integrity enforcement.

## Artifact and provenance boundary

Uploaded workflow artifacts are diagnostics only. No privileged workflow downloads or republishes artifacts produced by a pull request, and the release job rebuilds after all same-commit gates. The local audit can verify those repository facts but cannot prove GitHub's remote environment protection, npm trusted-publisher registration, an issued npm provenance statement, artifact-attestation verification, organization signing policy, or Cloudflare token scope.

GitHub artifact attestation for retained test evidence is not added here: those artifacts are not release inputs, and signing without a verification policy would not close a consumer trust boundary. npm package provenance remains an external release-owner verification because trusted publishing generates it remotely under documented eligibility conditions.

## Evidence and verification

The current passing result is retained at `quality/evidence/supply-chain/2026-08-27T14-11-04-780Z/result.json`. It records 11 workflows, 46 external action uses, nine local reusable-workflow calls, exact `pnpm@9.15.0`, and zero failures. The earlier red result at `quality/evidence/supply-chain/2026-08-27T13-54-28-123Z/result.json` remains as causal evidence of the resolved floating-Wrangler blocker.

Focused commands:

```text
node --test scripts/check-supply-chain.test.mjs
  7 passed; the xlsx and Wrangler network/store proofs are skipped by default.

FLUID_VERIFY_XLSX_INSTALL=1 node --test scripts/check-supply-chain.test.mjs
  7/7 passed: current-policy frozen install, pnpm 9.15.0 frozen seed, then pnpm 9.15.0 frozen offline install; neither fixture lock changed.

node --test scripts/check-supply-chain.test.mjs scripts/release-gates.test.mjs scripts/dry-run-publish.test.mjs
  25 passed, 2 opt-in install proofs skipped, including all 18 package archive dry-runs.

node scripts/check-supply-chain.mjs
  passed for all 11 workflows.
```

No publish, tag, push, release, secret read, deployment, attestation, or other remote mutation was performed.
