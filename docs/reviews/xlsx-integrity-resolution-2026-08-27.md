# xlsx 0.20.3 integrity resolution — 2026-08-27

## Result

The existing SheetJS Community Edition dependency is now cryptographically bound without changing its source URL, `0.20.3` version, parser runtime, or public API.

```text
URL       https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
Version   0.20.3
Bytes     2,409,319
MD5       aac39517149362ea8123d8a303486c3c
SHA-512   a0b0eade3c3b01c2ea2961f60210a9553665f267fa5f661178ff8d7a1d12254cd5fc1759623b61f78b46e6da22301d4f3eb62dc4e09f6a850292fb6e1fedc024
SRI       sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==
```

## Authentication chain

SheetJS documents the 0.20.3 CDN tarball as its authoritative package source and recommends vendoring for stability: [Frameworks and bundlers](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/). In an official SheetJS issue, a maintainer published MD5 `aac39517149362ea8123d8a303486c3c` for the exact 0.20.3 tarball: [SheetJS issue 3283](https://git.sheetjs.com/sheetjs/sheetjs/issues/3283). The official 0.20.3 source tag resolves to release commit `8a7cfd47bde8258c0d91df6a737bf0136699cdf8`: [SheetJS v0.20.3 source](https://git.sheetjs.com/sheetjs/sheetjs/src/tag/v0.20.3).

The tarball was fetched twice over HTTPS using independent clients (`curl` and Node's Fetch implementation). Both downloads were 2,409,319 bytes, both matched the maintainer MD5, and both independently produced the SHA-512/SRI above. The temporary artifacts were removed after hashing.

MD5 is used only to authenticate the fetched bytes against the upstream-published value. The lock and enforcement use SHA-512.

## Binding and negative controls

The only lockfile change is the addition of the SHA-512 `integrity` field to the existing xlsx resolution. No importer, dependency specifier, package snapshot, or version changed.

The supply-chain guard requires all of these exact values together:

- parser dependency URL;
- lock package key and tarball URL;
- lock version `0.20.3`;
- complete SHA-512 SRI.

Tests reject a changed dependency source, missing or tampered SRI, changed lock version, inexact pnpm pin, and the original missing-integrity state.

## Install proof

The opt-in install contract creates isolated temporary projects with the exact production declaration and lock resolution. It proves:

1. the current pnpm policy accepts a frozen install and verifies the downloaded tarball;
2. Corepack selects exact pnpm `9.15.0` and performs a frozen integrity-checked seed install;
3. a second exact pnpm `9.15.0` install succeeds with `--offline --frozen-lockfile` from the authenticated store;
4. neither install changes its fixture lock, and installed `xlsx/package.json` reports `0.20.3`.

```text
FLUID_VERIFY_XLSX_INSTALL=1 node --test scripts/check-supply-chain.test.mjs
  7/7 passed.
```

The repository lock diff is exactly one replacement line: the existing tarball resolution gains `integrity`. There is no importer or version churn.

The broader supply-chain audit now refuses only the separately owned floating `pnpm dlx wrangler@3` deployment command. No commit, push, publish, runtime edit, generated output, or remote mutation was performed.
