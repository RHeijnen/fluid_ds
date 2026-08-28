# Editor selection and coverage repair, 2026-08-26

This is a bounded repair report, not production certification. The baseline
Linux editor coverage gate failed at 75% branches against the unchanged 83%
minimum, despite all 15 existing assertions passing. The threshold was not
lowered. The final suite has 43 cases: 15 existing cases with their assertions
preserved, plus 28 new behavior cases. Two existing fixtures now establish
native keyboard selection rather than assuming that adding a DOM Range creates
a usable browser editing selection.

## Confirmed defects and repairs

1. Native selection endpoints inside shadow DOM can be retargeted outside the
   editable region. Capture now uses `Selection.getComposedRanges()` with the
   editor's own and containing shadow roots. Both endpoints must be contained
   by this editor. A native keyboard regression also covers an editor inside a
   consumer's shadow root. The legacy fallback accepts only a genuinely
   contained `getRangeAt()` result.
2. Replacing public `value` relocated the saved live Range without making its
   common ancestor external. Restoring it collapsed the user's new selection.
   Actual DOM replacement now clears the saved range. Equal sanitized value
   assignment preserves the DOM and saved selection.
3. Restoring ordered start/end points made backward native selections forward.
   Capture now preserves direction, with a contained-anchor fallback where the
   direction API is unavailable. A real Shift+ArrowLeft selection remains
   backward after canceling Link; another Shift+ArrowLeft extends left rather
   than shrinking from the right.
4. Sanitization and read-only rollback also replaced the editable DOM while
   retaining a relocated range. Both paths now clear it on actual replacement.
   Read-only rollback avoids replacing already-identical HTML.

The capture/restoration implementation is in
`packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.ts`
(value setter at line 161, capture at line 208, restoration at line 250,
sanitization at line 272, read-only input at line 291). Regressions are in the
adjacent `.test.ts`: native backward selection at line 461, sanitizer/rollback
at line 489, controlled API branches at line 519.

The [Selection API specification](https://www.w3.org/TR/selection-api/#dom-selection-getcomposedranges)
defines explicit shadow-root exposure for composed ranges. The implementation
does not infer hidden endpoints from retargeted hosts or use private selection
state. `setBaseAndExtent()` restores the saved anchor/focus ordering.

## Evidence and causal failures

All entries below are retained under `quality/evidence/`. No assertion failure
was hidden by increasing runner deadlines or lowering coverage requirements.

| Evidence directory suffix | Result and interpretation |
| --- | --- |
| `15-28-46-510Z-editor-behavior-coverage-chromium` | 33 pass, 1 fail: stale range after replacing value. |
| `15-30-02-490Z-editor-selection-fix-chromium` | 35 pass using the earlier DOM Range fixtures. This did not establish native cross-engine selection behavior. |
| `15-30-21-926Z-editor-selection-fix-firefox` | 34 pass, 1 fail: synthetic HTML paste setup. |
| `15-31-36-525Z-editor-selection-fix-webkit` | 26 pass, 9 fail: old selection/caret fixture assumptions. |
| `15-35-34-430Z-editor-native-driver-stale-range-red` | 33 pass, 2 fail: native capture failed before the setter mutation could prove causality. Not counted as successful setter-mutation proof. |
| `15-36-14-355Z-editor-native-selection-diagnostic` | 33 pass, 2 fail: selected text was Beta, but document range endpoints were outside the editor. |
| `15-40-40-896Z-editor-composed-stale-range-mutation-red` | After composed capture was fixed, removing only the setter's range-clear lines caused exactly the stale-value test to fail: 39 pass, 1 fail. The clear was restored. |
| `15-41-03-374Z-editor-composed-selection-firefox` | 39 pass, 1 fail: paste fixture still lacked a usable HTML payload. |
| `15-42-03-807Z-editor-firefox-paste-diagnostic` | Before dispatch, the constructed event's HTML payload was empty. Native selected text was correct; the no-HTML delegation branch was behaving correctly. |
| `15-42-38-385Z-editor-firefox-explicit-paste-payload` | 40 pass after supplying and asserting the handler fixture's DataTransfer payload explicitly. No paste runtime change. |
| `15-43-18-394Z-editor-final-native-chromium-coverage` | 39 pass, 1 fail after strengthening the legacy control to select Gamma instead of reusing Beta. Focusout overwrote the controlled capture; setup was corrected. |
| `15-44-32-422Z-editor-final-native-webkit` | 39 pass, 1 fail in that controlled legacy branch: focus could empty the native selection. The unit fixture now explicitly controls rangeCount and verifies exactly one API read. |
| `15-45-36-214Z-editor-final-explicit-legacy-webkit` | 40 pass, including the strengthened legacy control. |
| `15-47-03-030Z-editor-backward-selection-red` | 40 pass, 1 fail: backward became forward after canceling Link. |
| `15-47-52-014Z-editor-selection-direction-and-rewrites-red` | 40 pass, 3 fail: direction plus both sanitizer/read-only DOM replacement paths. |

Each suffix above has the prefix `2026-08-26T`. Additional intermediate passing
runs remain beside these records; they are historical checkpoints, not extra
unique test coverage.

## Final targeted results

| Engine | Cases | Evidence directory | Process result |
| --- | --- | --- | --- |
| Chromium | 43/43 | `2026-08-26T15-48-51-648Z-editor-direction-rewrite-chromium-coverage` | Normal exit 0; source-stable during run. |
| Firefox | 43/43 | `2026-08-26T15-49-15-099Z-editor-direction-rewrite-firefox` | Normal exit 0; global source hash changed because the root agent updated `quality/defects.md`. Editor source/tests were frozen. Do not label this run globally source-stable. |
| WebKit | 43/43 | `2026-08-26T15-49-45-106Z-editor-direction-rewrite-webkit` | Normal exit 0; source-stable during run. |

This is 129 executed cases, not 129 different tests. Each browser ran in a
separate supervised process with concurrency 1 and port 8017. Lifecycle records
are `15-48-53-507Z-21428`, `15-49-16-912Z-8516`, and
`15-49-47-017Z-22028` under `quality/evidence/wtr-lifecycle/`, with the same date
prefix and `.json` suffix. All recorded descendants exited; no forced cleanup
or ownership uncertainty was reported.

Chromium's measured coverage is **375/375 statements and lines (100%), 93/95
branches (97.89%), and 17/17 functions (100%)**. The branch minimum remains 83%.
LCOV and coverage-summary JSON were copied into that run's `coverage/` directory.
Firefox and WebKit results above are assertion runs, not coverage measurements.
Fresh integrated Linux coverage and the complete workspace gate remain the
root agent's next checkpoint.

The initial scoped ESLint, editor source check using the workspace TypeScript
5.9.3 compiler, and browser-test TypeScript program (one test file) passed.
That source check did not use the editor package's own TypeScript 5.8.3 compiler;
the integrated gate subsequently caught this verification gap, detailed below.
No broad formatter rewrite
was applied to the pre-existing files. The editor documentation was corrected
in `apps/docs/src/content/docs/expansion/editor.mdx`; its MDX build is delegated
to the integrated root gate, not claimed by these targeted checks.

## Proof boundaries

- Native WTR keyboard commands establish and extend real selections. Formatting
  and link insertion use the browser's actual editing commands.
- Synthetic pointer/key/input events are handler checks, not trusted pointer or
  operating-system input proof.
- The HTML paste fixture explicitly supplies a DataTransfer payload because
  Firefox did not retain it in the constructed ClipboardEvent. Sanitization,
  actual insertion and one-event emission are asserted. Native clipboard
  permissions and trusted paste gestures are not covered by this fixture.
- Legacy, empty and cross-boundary selection API controls are restored in
  `finally` and assert observable selection/formatting results. They do not
  establish support for old browser releases.
- The suite does not certify all editing operations, localization, every
  assistive-technology combination, or complete production readiness.

No commits were created. The setter range-clear is restored, with no temporary
runtime mutation left in place.

## Compiler-version correction

After the targeted matrix, the integrated Linux coverage gate passed all 2,293
assertions, but full verification failed during the editor's package-level
typecheck. TypeScript 5.8.3 does not declare `Selection.getComposedRanges()`;
the earlier direct workspace check used TypeScript 5.9.3, which does. The same
failure was reproduced on Windows using the actual package command:

```text
pnpm --filter @fluid-ds/editor typecheck
```

`2026-08-26T15-55-56-165Z-editor-leaf-typecheck-red` retains the two TS2339
errors, source-stable. A local `Selection & { getComposedRanges?: ... }`
capability type now describes the optional browser API without global DOM
augmentation, `any`, dependency upgrades, or changing the runtime feature guard.
`2026-08-26T15-56-27-958Z-editor-leaf-typecheck-green` records the package's
TypeScript 5.8.3 check passing, source-stable. The workspace TypeScript 5.9.3
source check, browser-test program and scoped ESLint also pass after this change.

Before and after transpilation with the same TypeScript 5.9.3 options and
comments removed produced identical JavaScript SHA256:
`bca802bdecb5f86aa350b765172f7ecc7624b6f60e8de1b3752d6c3b5760a6af`.
This verifies that the bounded correction changes typing, not executable code;
it does not replace the pending fresh integrated verification. No browser tests
were rerun solely for this type-only correction.
