# Security policy

## Supported versions

Until Fluid reaches `1.0.0`, security fixes land in the latest
pre-release (`0.x.x-alpha.*`) only. Once a stable line exists, this
section will list which versions receive backports.

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Please email the maintainers via the GitHub Security Advisories tab
(<https://github.com/RHeijnen/fluid_ds/security/advisories>) or send an
encrypted message to the address listed in the repository profile.

You should receive an acknowledgement within **72 hours**. We'll work with
you to confirm the issue, prepare a fix, and coordinate disclosure.

## Scope

The following are in scope:

- Anything in `@fluid-ds/components` and the expansion packs that could
  let an attacker run JavaScript, leak data, or break shadow-DOM
  encapsulation when a consumer follows the documented usage.
- Anything in `@fluid-ds/tokens` / `@fluid-ds/icons` that could let a
  build-time supply-chain attack flow through to consumers.

The following are out of scope:

- Issues that require a malicious consumer to deliberately pass attacker-
  controlled HTML/SVG to components designed for trusted markup (e.g.
  `<fluid-include allow-scripts>`, `<fluid-markdown>` with a hostile
  source). These are documented as trust requirements.
- Visual / UX issues that don't affect security.
- Cross-browser quirks that don't expose a vulnerability.

## After disclosure

Confirmed vulnerabilities will get:

- A GitHub Security Advisory with credit to the reporter (if desired)
- A CVE if applicable
- A patched release on the `alpha` (or eventually `latest`) dist-tag
- A retrospective entry in the changelog
