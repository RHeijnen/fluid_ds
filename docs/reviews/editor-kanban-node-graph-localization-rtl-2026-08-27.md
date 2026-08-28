# Editor, kanban and node-graph localization/RTL review — 2026-08-27

## Scope and outcome

This focused tranche integrates the rich-text editor, kanban board and node graph with the shared typed localization controller. English and draft Dutch, German, French, Spanish and Arabic terms now cover the Fluid-owned names, actions, prompts and complete announcements identified by the expansion reconciliation.

The three packages depend directly on `@fluid-ds/components: workspace:*`. The lockfile contains only the matching workspace importer entries. Components does not depend on editor, kanban or node-graph, so the dependency direction remains acyclic. Generated custom-element manifests were not changed.

## Preserved contracts

- Editor toolbar commands, toolbar name, default editor name and link prompt are localized live. Explicit editor labels and placeholders, including empty values, remain authoritative. Locale-only changes do not execute commands, open a prompt, alter selection, re-sanitize HTML, rewrite document content or emit `fluid-change`.
- The URL entered into the browser-owned prompt remains application data and is passed unchanged to the link command. DOMPurify continues to own HTML sanitization behavior; localized strings are not passed through document content.
- Kanban move-control defaults, accessible names, card role, board name and pickup/move/drop/cancel announcements are localized as complete messages. Card and column titles remain application content. Announcement state is semantic, allowing an active pickup announcement to relocalize without moving a card or emitting `fluid-move`.
- Kanban column arrays, card order and canonical move-event details remain unchanged. RTL horizontal keyboard movement still follows the rendered logical column track; up/down and previous/next data meanings are unchanged.
- Node-graph default messages, graph name, graph/node role descriptions, port names, movement/selection/removal/connection/zoom announcements and HUD counts are localized. Partial message overrides and intentional empty message/label values remain authoritative.
- Node ids, port ids, labels, summaries, node/edge arrays, coordinates and event payloads remain canonical. Arabic direction changes text flow only: graph movement, panning, port sides, edge geometry and connection-candidate order retain the reviewed physical-coordinate contract.
- `fr-CA` exercises regional message fallback while preserving its regional `Intl` number context. Live Arabic direction is applied to component surfaces and live regions.

## Verification

Linux container verification passed:

- Package typechecks: `@fluid-ds/components`, `@fluid-ds/editor`, `@fluid-ds/kanban`, `@fluid-ds/node-graph`.
- Repository browser-test typecheck: 143 files across 14 packages, zero diagnostics; typed localization contract tests: 5/5.
- Scoped ESLint across all affected runtimes, tests, shared contract and locale files.
- Full editor suite with `FLUID_BROWSERS=all`: 50/50 in Chromium, Firefox and WebKit (150 executions). Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T12-08-50-799Z-39964.json`.
- Full kanban suite with `FLUID_BROWSERS=all`: 20/20 in Chromium, Firefox and WebKit (60 executions). Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T12-11-05-580Z-42117.json`.
- Full node-graph suite with `FLUID_BROWSERS=all`: 33/33 in Chromium, Firefox and WebKit (99 executions). Lifecycle: `quality/evidence/wtr-lifecycle/2026-08-27T12-11-16-709Z-42601.json`.
- All three package builds and standalone built-definition imports.
- Package-to-components cycle check, exact manifest/lock review, Prettier on owned package files and `git diff --check`.

## Remaining human/platform boundaries

- All five translated dictionaries are functional drafts pending fluent-speaker review.
- Browser prompt buttons/title chrome and operating-system keyboard naming remain native/browser-owned; Fluid owns only the prompt text it supplies.
- Final target assistive-technology review should cover long Arabic pickup/connection instructions, role descriptions and live relocalization in supported browser/screen-reader pairs.
- Final visual review should cover long toolbar/action names, kanban overflow and node/port text in narrow Arabic layouts. Spatial graph geometry must not be mirrored as part of copy review.
