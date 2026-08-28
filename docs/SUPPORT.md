# Support policy

Fluid publishes the support contract below for components marked `stable` in
`quality/maturity.json`. Beta and experimental components remain available for
evaluation, but do not receive the same compatibility guarantee.

Certification status (2026-08-26): the catalog currently has no stable elements,
145 experimental elements and 10 beta elements. The combinations below are
release targets, not a claim that all manual and runtime checks are complete.
Consult [the execution evidence](../quality/baselines/2026-08-26-section-2-parallel.md)
and [open defects](../quality/defects.md) before adopting a support claim.

## Platforms

- Browsers: the latest two stable releases of Chrome, Edge, Firefox, and Safari.
- Mobile: current Safari on iOS and current Chrome on Android.
- Server rendering target: maintained Node.js LTS lines. Node 22 is the current
  local verification runtime; Node 24 certification remains pending. Node 20
  is end-of-life and is not a maintained-LTS target. Check the
  [upstream release schedule](https://nodejs.org/en/about/previous-releases).
- React integration: React 19 for generated wrappers and JSX declarations.
- Baseline platform features: custom elements, declarative shadow DOM, form-associated
  custom elements, CSS custom properties, and native popover where used.

Older browsers may work, but are outside the tested support contract. Fluid does
not ship a general custom-elements or declarative-shadow-DOM polyfill.

## Accessibility

Stable interactive components must pass automated WCAG 2.2 AA audits,
keyboard interaction contracts, forced-colors rendering, reduced motion, and
browser hydration. Required manual release checks include NVDA with Chrome and
Firefox, and VoiceOver with Safari on macOS. These reviewer records are still
pending for the proposed stable cohort.

The local catalog axe matrix passes in Chromium, Firefox and Windows WebKit.
The broader native matrix retains four Windows WebKit link/media failures;
equivalent native controls reproduce platform limitations. Bundled WebKit on
Windows is not evidence for Safari on macOS or iOS. No test exemption turns
these failures into support certification.

Automated checks do not replace product-level testing with the content,
languages, and assistive technology used by an adopting application.

## Compatibility and deprecation

- Stable APIs follow semantic versioning.
- A stable API is deprecated before removal and remains available for at least
  one minor release or 90 days, whichever is longer.
- Security and severe accessibility fixes may require an exceptional breaking
  change. Release notes must explain the impact and migration.
- Beta and experimental changes are listed in release notes but may change in a
  minor release.

## Release cadence

Patch releases are made as needed for defects and security fixes. Feature
releases target a monthly cadence. A release is cut only after the blocking
quality, accessibility, SSR, documentation, and package checks pass.

Security reports should use GitHub's private vulnerability reporting channel.
