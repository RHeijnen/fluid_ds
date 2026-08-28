# Rich-text editor RTL contract, 27 August 2026

## Outcome

The rich-text editor toolbar now follows its live rendered direction for
horizontal keyboard navigation without changing command order or editor content.
In LTR, Right advances and Left goes back. In RTL, Left advances through the
visually right-to-left command row and Right goes back. Up/Down continue to move
through command order, and Home/End continue to select the first/last command.

The implementation reads the toolbar's computed direction for each key event.
It therefore follows `dir` inherited from a native ancestor, an explicit host
direction and a direction changed after connection without a separate reflected
state or module-global direction.

## Compatibility boundaries

- The command array and DOM order are unchanged. Bold remains the first command
  and Clear formatting remains the last.
- CSS direction naturally determines the rendered flex order. JavaScript only
  maps horizontal arrow intent onto that rendered order.
- Vertical arrows remain command-order navigation; direction does not reverse
  them. Home and End retain endpoint semantics.
- Toolbar navigation does not execute a command, modify or sanitize application
  HTML, emit `fluid-change`, open the link prompt or alter a saved selection.
- Readonly and deferred-focus guards are unchanged.
- Toolbar labels, the editor default name, `Formatting` and the Fluid-supplied
  link-prompt text remain a localization follow-up. This slice does not create a
  package-local registry or add a dependency on components internals.

Current implementation:
[fluid-rich-text-editor.ts](../../packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.ts).
Focused regressions:
[fluid-rich-text-editor.test.ts](../../packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.test.ts).

## Focused evidence

The Chromium pre-implementation run retained the causal baseline: 44 tests
passed and the two new horizontal RTL assertions failed. The vertical/endpoint
RTL contract already passed. Lifecycle evidence:
`quality/evidence/wtr-lifecycle/2026-08-27T11-06-04-585Z-14499.json` in the
dedicated Linux verification container.

After the runtime change, the complete editor suite passed 46 tests in each of
Chromium, Firefox and WebKit, 138 executions total, with normal lifecycle
shutdown. Evidence:
`quality/evidence/wtr-lifecycle/2026-08-27T11-07-36-162Z-15173.json` in the
container.

The added contracts prove:

- inherited RTL produces right-to-left visual placement without reordering the
  command DOM or accessible names;
- Left advances and Right retreats/wraps in that rendered RTL row;
- Up/Down and Home/End retain their direction-independent meanings;
- changing a connected editor from LTR to RTL immediately changes horizontal
  navigation; and
- direction-only navigation preserves application HTML and emits no content
  changes.

The editor package typecheck and scoped ESLint checks for the runtime and test
file pass in the synchronized Linux container. This automated slice does not
replace manual assistive-technology or visual RTL approval.
