# Kanban and node-graph RTL contract, 27 August 2026

## Outcome

The bounded spatial-tools tranche now distinguishes logical board navigation
from physical graph geometry without changing application data or introducing a
package-local localization system.

Kanban columns retain their public array order and `fluid-move` destination
semantics. Flexbox renders that logical order from the appropriate inline start,
so RTL places the first array column on the right. Horizontal pickup keys follow
the rendered track: Left advances to the next array column in RTL and Right
returns to the previous one. Previous/next button meanings stay logical while
their arrow glyphs mirror through inherited-direction CSS. Up/down card order,
card and column content, indices, and event payloads are unchanged.

Node graph deliberately keeps a physical coordinate system. Right-arrow node
movement increases world X, canvas panning retains its physical direction,
pointer deltas map to the same world-coordinate deltas, and keyboard connection
candidate order remains stable. Input ports stay on the physical left, output
ports and their labels stay on the physical right, and edge paths continue to
use the same coordinates. RTL still applies to application-authored node and
port text; labels, node ids, port ids, coordinates, and emitted payloads are not
reversed or translated.

## Compatibility boundaries

- No public property, data shape, event name, event detail, graph coordinate,
  card order, or column order changed.
- Kanban's explicit move-label properties, including empty strings, remain
  authoritative.
- Node-graph `messages`, `label`, node titles, summaries, types, and port labels
  retain their existing ownership and fallback behavior.
- Localizable defaults and announcements remain assigned to the shared
  dictionary owner; this tranche does not create an expansion-package fork.
- Fluent-language, assistive-technology, and visual RTL approval remain human
  gates.

## Verification

The complete Kanban browser suite passes 16 tests per engine in Chromium,
Firefox, and WebKit: 48 executions with normal lifecycle shutdown. The complete
node-graph suite passes 29 tests per engine: 87 executions with normal lifecycle
shutdown. Tests cover inherited direction changes during pickup, rendered RTL
column order, canonical move events, physical keyboard and pointer coordinates,
viewport pan, candidate ids, port placement, and preservation of application
labels.

Both package source typechecks pass, scoped ESLint passes, Prettier is clean, and
`git diff --check` passes. No generated manifest was changed.
