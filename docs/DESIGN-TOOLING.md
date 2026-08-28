# Design tooling and token synchronization

Fluid's versioned design-token artifacts are the source of truth. The token
build emits CSS and machine-readable JSON from the same definitions, so design
tools must consume or transform those outputs rather than maintain an unrelated
palette by hand.

The supported synchronization path is:

1. Build `@fluid-ds/tokens`.
2. Import the generated JSON token artifact into a Tokens Studio-compatible
   Figma workflow.
3. Review semantic aliases, light and dark values, and component token names.
4. Propose source-token changes in the repository and regenerate artifacts.

There is not yet an official public Figma component library. Until one is
published and release-automated, Fluid describes token synchronization as
supported and component-library synchronization as planned. This distinction is
intentional so design assets cannot silently drift from shipped code.
