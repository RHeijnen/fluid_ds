# Localization completeness audit, 2026-08-26

## Outcome and limits

Fluid is not yet localization-complete. All 155 catalog elements (124 core and 31 expansion) were included in source discovery. Remaining English strings occur in validation, accessible defaults, live announcements, loading/empty/error states, navigation, and data tools. Some are configurable today; configurability does not make their default follow the language registry.

This is a source-backed implementation inventory, not an exhaustive language certification, new execution result, or competitor score. No runtime, dictionary, test, baseline, or shared quality-report changes were made for this audit. Source was changing elsewhere during review; line numbers identify the inspected working-tree snapshot and can drift.

### Method

1. Read the repository component-authoring and accessibility instructions. Resolve each tag from `quality/component-quality.json` to its actual TypeScript runtime implementation, including child elements and chart subclasses. All 155 resolve.
2. Scan runtime TypeScript string literals and template fragments with TypeScript parsing, and search attributes, defaults, validation, announcements, formatter calls, and direction handling. Exclude test/story files, CSS templates, generated builds and dependency trees from the owned-string scan.
3. Manually inspect candidate strings in rendering and state-update context, including shared helpers, inherited chart rendering, and composition such as tag-input's removable tags.
4. Inspect existing localization implementation, guide, dictionaries, focused tests, and browser/SSR fixture configuration. No tests were run for this read-only audit.

A zero-match result is not proof of completeness: dynamic assembly, CSS-generated content, third-party widgets, uncommon error paths, and consumer-provided render functions need additional runtime review. Source heuristics such as `usesRegistry` or `directionAware` indicate implementation presence, not translated-string completeness, correct live updates, or RTL usability.

An additional source-discovery obstacle was found: infinite-table contained two literal NUL characters in string separators, making ordinary `rg` treat it as binary. Binary-safe reads were used. Root confirmed these existed in HEAD and replaced them with equivalent textual `\0` escapes. That correction earns no localization or interaction coverage credit.

### Ownership categories

- **Owned internal text:** library-rendered copy, accessible names, validation messages, and announcements. Needs registry-backed defaults and live locale updates.
- **Localizable default:** a public label/message property or slot has an English fallback. Preserve explicit application overrides, including deliberately English text, while translating only the default.
- **Application content:** slot text, titles, data labels, filenames, imported values, custom validation responses, caller presets, and custom messages. Do not silently translate or replace it.
- **Native/browser text:** HTML validation, media control chrome, file pickers, and prompt chrome are browser-owned. Library-written prompt text or custom validity is still Fluid-owned.
- **Dependency-owned UI:** a third-party widget's default control titles remain a product integration concern even when the literal lives outside Fluid.
- **Non-user text:** event names, enum values, keyboard identifiers, CSS, developer-only exceptions, and debug logs are not translation candidates unless surfaced in UI.

## Existing work that must not be reopened as a missing feature

`packages/components/src/internal/localization.ts` already provides typed English terms, registration, English/regional fallback, reactive language and direction context, and reference-counted observer cleanup. The recent inheritance fix traverses DOM ancestors across shadow hosts, including closed-shadow contexts. Slotted elements retain light-DOM language ancestry; following assigned slots instead would change that behavior.

The five official dictionaries (`nl`, `de`, `fr`, `es`, `ar`) and diagnostic `en-XA`/`ar-XB` packs cover the current typed contract. This is dictionary parity, not proof that every component-owned string uses the contract.

Recent migration covers required switch/radio-group/OTP messages and truncate more/less defaults, preserving custom validity and explicit labels while responding to locale changes. Checkbox now uses the shared `checkThisBox` term through the separate SSR/form-state work. Typeahead already uses `fillOutField`.

Focused localization evidence retained before this audit:

- Final five-file matrix: 104 cases in each of Chromium, Firefox and WebKit, 312 passes total. Evidence directory: `quality/evidence/2026-08-26T12-43-27-640Z-localization-validation-confirmed-matrix`.
- Its repository fingerprint changed during execution because the shared worktree remained active; it is implementation evidence, not a frozen release-candidate run.
- Prior failed evidence remains: one switch accessibility timeout in an earlier run, and a Firefox synthetic OTP ClipboardEvent payload failure in the first full matrix. The latter was diagnosed before dispatch and replaced with a genuine native clipboard regression. OTP production code was not changed to satisfy that fixture.
- These 104 cases cover the controller plus switch, radio-group, OTP, and truncate. They are not a 155-element locale matrix.

The localization guide already distinguishes registry-backed labels from remaining strings. Do not replace that honest boundary with an “all components localized” claim.

## Core inventory: form validation and date/time controls

All paths below are repository-relative. Line numbers locate the actual candidate, not a generic family directory.

| Element / surface   | Evidence and owned text                                                                                                                         | Override and implementation concerns                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| color-picker        | `packages/components/src/components/color-picker/fluid-color-picker.ts:200` invalid hexadecimal color; `:203` required color                    | Custom validity is application-owned. Existing update guard at 188 checks value/required, so locale-only changes must refresh an already-invalid message.  |
| select              | `packages/components/src/components/select/fluid-select.ts:375` “Please choose an option.”                                                      | Preserve custom validity; guard at 372 currently checks required/value.                                                                                    |
| masked-input        | `packages/components/src/components/masked-input/fluid-masked-input.ts:327` empty/incomplete field messages                                     | Distinguish missing input from a partial mask. Guard at 305 checks value/required/mask, not locale-only updates.                                           |
| file-input          | `packages/components/src/components/file-input/fluid-file-input.ts:272` required file; `:374` “Multiple files supported” / “One file at a time” | Hint slot is an explicit override. Existing form-value refresh can be reused, but translated invalid state still needs direct tests.                       |
| date-picker         | `packages/components/src/components/date-picker/fluid-date-picker.ts:263` required date                                                         | Guard at 259 checks value. Test required toggles as well as live locale changes, custom validity, and reset.                                               |
| date-range-picker   | `packages/components/src/components/date-range-picker/fluid-date-range-picker.ts:394` required range; `:702` “Select a range”                   | Guard at 390 checks start/end. Caller-provided range labels and presets must remain untouched.                                                             |
| shared date presets | `packages/components/src/internal/date-utils.ts:150`: Today, Yesterday, Last 7 days, Last 30 days, This month, Last month                       | Exported default array has static English labels. Resolve built-in labels per instance/context without mutating caller arrays or replacing caller presets. |
| time-picker         | `packages/components/src/components/time-picker/fluid-time-picker.ts:379` required time; `:51` manually generated AM/PM labels                  | Guard at 375 checks value. Localized day periods/hour-cycle formatting are distinct from required-message translation.                                     |

Native validation is a separate policy boundary: `input/fluid-input.ts:423`, `number-input/fluid-number-input.ts:288`, and `textarea/fluid-textarea.ts:263` (under `packages/components/src/components/`) forward an inner native control's `validationMessage`. Those are not remaining hardcoded English literals. They also do not prove the message language follows a nearest Fluid `lang` context. Document and test native-language behavior before promising uniform validation localization.

## Core inventory: labels, status and announcements

In this table the source prefix is `packages/components/src/components/`.

| Element                      | Exact source suffix and candidate                                                                                       | Ownership / migration note                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anchor-nav                   | `anchor-nav/fluid-anchor-nav.ts:157`, “On this page”                                                                    | Public `navLabel` English default.                                                                                                                             |
| app-bar                      | `app-bar/fluid-app-bar.ts:191`, “Open menu”                                                                             | Public `menuLabel` default.                                                                                                                                    |
| banner                       | `banner/fluid-banner.ts:207`, “Alert” / “Notification”                                                                  | Internal fallback; explicit `label` remains authoritative. Dismiss already uses registry.                                                                      |
| code-block                   | `code-block/fluid-code-block.ts:216`, “Copied”; `:218`, “Copy [language] code”; `:219`, “Copy code”                     | Internal icon labels. Language name is caller content inside a translated phrase.                                                                              |
| countdown                    | `countdown/fluid-countdown.ts:265`, completion; `:275`, English unit plurals; `:281`, comma-joined “remaining” sentence | Visible short unit labels already use terms, but spoken announcements do not. Requires localized plural, list, and number formatting; not just one new string. |
| dropzone                     | `dropzone/fluid-dropzone.ts:302`, drag/browse default                                                                   | Public label feeds visible fallback and accessible name. File size formatting is a separate numeric/unit concern.                                              |
| fold                         | `fold/fluid-fold.ts:158`, “Show more”                                                                                   | Public default, potentially shares existing `showMore` term. Preserve explicit values.                                                                         |
| loading-overlay              | `loading-overlay/fluid-loading-overlay.ts:141`, “Loading”                                                               | Fallback forwarded to spinner. Consumer label remains authoritative.                                                                                           |
| meter                        | `meter/fluid-meter.ts:302`, “Meter”                                                                                     | Fallback after label/slotted label. Track ownership when writing host `aria-label` so updates do not overwrite explicit application naming.                    |
| popconfirm                   | `popconfirm/fluid-popconfirm.ts:198`, “Are you sure?”; `:201`, Confirm; `:204`, Cancel                                  | Three configurable defaults; user text is not a missing translation.                                                                                           |
| pricing-table / pricing-tier | `pricing-table/fluid-pricing-table.ts:44`, “Pricing plans”; `pricing-table/fluid-pricing-tier.ts:189`, “Most popular”   | Defaults are owned; plan names, price display strings, periods and features are application content.                                                           |
| progress-ring                | `progress-ring/fluid-progress-ring.ts:101`, “Progress”                                                                  | Host label set only when absent. Need a default-ownership mechanism for live changes without overwriting caller `aria-label`.                                  |
| range-slider                 | `range-slider/fluid-range-slider.ts:377`, “Minimum” / “Maximum”                                                         | Internal thumb names, combined with values. Test each thumb and overall consumer label.                                                                        |
| signature-pad                | `signature-pad/fluid-signature-pad.ts:88`, Clear / Undo / Upload / Fit                                                  | Four public label overrides, English defaults.                                                                                                                 |
| skeleton                     | `skeleton/fluid-skeleton.ts:106`, “Loading”                                                                             | Initial host attribute fallback has the same ownership problem as progress-ring.                                                                               |
| speed-dial                   | `speed-dial/fluid-speed-dial.ts:234`, “Actions”                                                                         | Public default.                                                                                                                                                |
| split-panel                  | `split-panel/fluid-split-panel.ts:97`, “Resize panels”                                                                  | Public default.                                                                                                                                                |
| tag / tag-input composition  | `tag/fluid-tag.ts:174`, “Remove”; `tag-input/fluid-tag-input.ts:359`, child removable tag                               | Tag-input may use registry elsewhere and still inherit the child's English remove label.                                                                       |
| toast                        | `toast/fluid-toast.ts:83`, “Notifications”                                                                              | Internal region label written on the host; test explicit caller labeling as well as locale changes.                                                            |
| tour                         | `tour/fluid-tour.ts:432`, “Step N of N” announcement; `:573`, Skip; `:586`, Back; `:598`, Done / Next                   | Step title/body are caller content. Translate the surrounding sentence, controls and step counter.                                                             |
| transfer                     | `transfer/fluid-transfer.ts:263`, “Available”; `:266`, “Selected”                                                       | Move button phrase already uses `moveSelectedTo`, but English default panel names are interpolated into it. Preserve caller panel/item labels.                 |

## Expansion inventory

No expansion package should be marked complete merely because its central accessible label is configurable.

| Package / tags                           | Exact evidence                                                                                                                                                                                  | Remaining owned surface and exclusions                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| media: animated-image                    | `packages/media/src/components/animated-image/fluid-animated-image.ts:145`                                                                                                                      | Play/Pause animation. Image alt is application-owned.                                                                                                                                                                                                                                                                                                       |
| media: audio                             | `packages/media/src/components/audio/fluid-audio.ts:105`, `:162`, `:177`, `:182`                                                                                                                | Audio player, Play/Pause, Seek, Mute/Unmute. Time display/announcement formatting needs a separate decision.                                                                                                                                                                                                                                                |
| media: video                             | `packages/media/src/components/video/fluid-video.ts:44`                                                                                                                                         | “Video” default label. Browser-native playback controls are not Fluid translation strings. Track labels/caption contents are caller content.                                                                                                                                                                                                                |
| media: video-playlist                    | `packages/media/src/components/video-playlist/fluid-video-playlist.ts:148`, `:155`, `:165`                                                                                                      | Video, Playlist, Track N fallback. Item titles are caller content.                                                                                                                                                                                                                                                                                          |
| media: lightbox                          | `packages/media/src/components/lightbox/fluid-lightbox.ts:185`, `:193`, `:206`, `:209`, `:215`                                                                                                  | Image N fallback, Image viewer, Previous/Next image, Close. Caller alt/title preserved.                                                                                                                                                                                                                                                                     |
| media: zoomable-frame                    | `packages/media/src/components/zoomable-frame/fluid-zoomable-frame.ts:117`                                                                                                                      | Zoom in/out, Reset zoom, four pan labels are configurable English defaults. Pan directions are physical operations, not strings that imply automatic direction reversal.                                                                                                                                                                                    |
| calendar: event-calendar                 | `packages/calendar/src/components/event-calendar/fluid-event-calendar.ts:505`, `:514`, `:557`, `:596`                                                                                           | Previous/Next month, count-based event text, show-all/overflow labels. Event titles are caller content.                                                                                                                                                                                                                                                     |
| scheduler: scheduler                     | `packages/scheduler/src/components/scheduler/fluid-scheduler.ts:181`, `:182`, `:314`, `:316`                                                                                                    | Required appointment, unavailable selection, select-day prompt, loading availability. Provider data/errors require an explicit ownership policy.                                                                                                                                                                                                            |
| scheduler: time-slots                    | `packages/scheduler/src/components/time-slots/fluid-time-slots.ts:273`, `:280`, `:311`                                                                                                          | Time-slots-for date, empty/select-date prompts, unavailable suffix.                                                                                                                                                                                                                                                                                         |
| scheduler: availability-editor           | `packages/scheduler/src/components/availability-editor/fluid-availability-editor.ts:295`, `:319`, `:329`, `:344`, `:362`, `:367`, `:376`, `:382`, `:402`                                        | Slot rules, numeric setting labels, weekly hours, open-on-day, indexed opening/closing times, remove-window names, invalid time range, Closed, closed-date controls, add hours/date. These include both visible labels and aria labels.                                                                                                                     |
| editor: rich-text-editor                 | `packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.ts:28`, `:167`, `:228`, `:297`                                                                                          | Formatting command names, editor/toolbar labels, “Link URL” prompt text. Native prompt chrome is browser-owned; initial prompt text is not. Document content and custom placeholder remain caller-owned.                                                                                                                                                    |
| kanban                                   | `packages/kanban/src/components/kanban/fluid-kanban.ts:198`, `:263`, `:329`, `:337`, `:352`, `:401`, `:458`                                                                                     | Four configurable move labels plus hardcoded picked-up/moved/dropped/cancelled instructions, card role description and board label. Card and column names are caller content interpolated into library sentences.                                                                                                                                           |
| node-graph                               | `packages/node-graph/src/components/node-graph/fluid-node-graph.ts:75`, `:426`, `:429`, `:1048`                                                                                                 | Existing typed partial `messages` object is a useful override seam. English move/select/connect/cancel/zoom/port messages, default graph label and separate “node graph editor” role description still need registry integration.                                                                                                                           |
| parser: column-mapper                    | `packages/parser/src/components/column-mapper/fluid-column-mapper.ts:173`, `:184`                                                                                                               | Required title, Select a column, not-mapped option. Field/source labels are caller data.                                                                                                                                                                                                                                                                    |
| parser: file-parser                      | `packages/parser/src/components/file-parser/fluid-file-parser.ts:185`, `:238`, `:322`, `:334`, `:355`, `:424`, `:436`, `:442`, `:445`, `:451`                                                   | Upload/error defaults, row counts, error/valid summaries, preview, map/import/export/reset UI. File names and rows remain caller data. Raw engine/parser error text can cross into visible UI.                                                                                                                                                              |
| parser shared coercion                   | `packages/parser/src/core/coerce.ts:92`, `:100`, `:111`, `:131`, `:137`, `:148`, `:158`, `:172`, `:180`; `apply-blueprint.ts:54`, `:80`, `:92`; `parse-file.ts:82`, `:99` in the same directory | Required, length, pattern, number/integer/range, boolean, date, email, URL, enum and JSON messages. Field names/raw values/custom validators are application content; surrounding built-in sentences are owned. Prefer structured error keys/parameters with message overrides over attempting to translate assembled English strings.                      |
| table: table                             | `packages/table/src/components/table/fluid-table.ts:340`, `:380`                                                                                                                                | Select-all / indexed row labels. Headers, cell data, and caller renderers are application content.                                                                                                                                                                                                                                                          |
| table: infinite-table                    | `packages/table/src/components/infinite-table/fluid-infinite-table.ts:715`, `:1697`, `:1700`, `:1726`, `:1734`, `:1746`, `:1767`, `:1783`, `:1938`, `:1949`                                     | Configurable resize/reorder/position templates; internal column dialog/actions, result-count sentence fragments, empty/loading/end states. Empty slot/custom error props are caller overrides, not justification for English defaults.                                                                                                                      |
| charts: chart and eight chart subclasses | `packages/charts/src/components/chart/fluid-chart.ts:158`, `:319`, `:344`                                                                                                                       | Chart label, doughnut “Total”, number formatting. bar/bubble/doughnut/line/pie/polar-area/radar/scatter inherit this base; do not count fixing the base as nine independently tested locale contracts. Dataset names are caller content.                                                                                                                    |
| map                                      | `packages/map/src/components/map/fluid-map.ts:179`, `:355`                                                                                                                                      | “Map” default and Leaflet-created zoom titles. Installed Leaflet evidence: `packages/map/node_modules/leaflet/src/control/Control.Zoom.js:27`, `:35`. Configure owned integration options instead of editing dependency files. Marker labels/popups are caller content; attribution has separate legal/content requirements and must not simply be removed. |
| markdown                                 | `packages/markdown/src/fluid-markdown.ts:141`, `:153`                                                                                                                                           | “Failed to load markdown” with error detail is rendered, not merely a developer exception. Caller Markdown is not translation input.                                                                                                                                                                                                                        |
| qr-code                                  | `packages/qr/src/fluid-qr-code.ts:427`, `:434`                                                                                                                                                  | “QR code for [value]”, “Empty QR code”. Empty/invalid branch separately hardcodes the latter, so verify explicit label behavior there. Encoded value remains caller content.                                                                                                                                                                                |

`fluid-celebrate` has no confirmed owned user-facing copy in this pass. `fluid-sparkline` renders an aria-hidden canvas with disabled tooltip/legend (`packages/charts/src/components/sparkline/fluid-sparkline.ts:111`, `:125`); it is not an independently translated textual chart. Neither observation certifies accessibility or removes the need for appropriate surrounding application content.

## Formatting, plural and direction gaps

### One coherent formatting context is still missing

The registry resolves language for labels, while multiple components independently use an optional `locale` property or the browser default:

- `packages/components/src/components/format-date/fluid-format-date.ts:78`, `format-number/fluid-format-number.ts:76`, `format-bytes/fluid-format-bytes.ts:58`, `relative-time/fluid-relative-time.ts:98`.
- `packages/components/src/internal/date-utils.ts:111`, `:122`; event-calendar formatters at 366, 375 and 550; time-slots at 211 and 222.
- Table collation at `packages/table/src/components/table/fluid-table.ts:246` uses an unspecified locale. Chart totals and infinite-table counts use `toLocaleString()` without the component language context.
- Binary long byte/bit unit names at `packages/components/src/components/format-bytes/fluid-format-bytes.ts:74` are English and do not select singular forms. Standard short IEC symbols are not equivalent to untranslated prose.
- Time-picker's AM/PM generation is not locale-aware day-period formatting.
- Parser number/date interpretation uses explicit coercion rules and date hints. Changing display locale must not silently change data parsing or serialize localized numerals into canonical values.

Define precedence explicitly: explicit formatter locale/options first, inherited language otherwise, documented fallback on invalid/unsupported locale. Keep ISO/date/time storage and form values locale-neutral. Add timezone, daylight-saving, hour-cycle, calendar, numbering-system and invalid-input cases where applicable.

### Plural and sentence composition

No production use of `Intl.PluralRules` or `Intl.ListFormat` was found in the owned package scan. That observation alone is not a defect, but the English suffix/fragment construction above confirms missing grammar handling. Countdown, event counts, parser counts and infinite-table progress need whole-message contracts, localized numbers, and plural categories. Arabic needs more than singular-versus-plural. Existing dictionary callbacks that interpolate raw numeric arguments also need an explicit formatting policy; dictionary parity does not prove localized digits.

### RTL needs behavioral proof, not a literal search verdict

Source candidates requiring targeted RTL behavior review include:

- range-slider `fluid-range-slider.ts:311` / 315, and physical left-positioned thumb painting;
- split-panel `fluid-split-panel.ts:152`, keyboard delta versus actual rendered pane direction;
- event-calendar `fluid-event-calendar.ts:431` / 434;
- rich-text-editor `fluid-rich-text-editor.ts:275` / 277;
- time-slots `fluid-time-slots.ts:241` / 245;
- kanban column traversal and infinite-table reorder/resize interactions.

These are review candidates, not verified browser failures. Logical visual order, physical spatial controls, and text editing have different semantics. Do not blindly reverse node-graph coordinates, map panning, media seek time, or zoomable-frame pan movement. Test their stated operation against actual movement.

The localization controller's `dir=auto` behavior still resolves through dictionary direction rather than detecting content direction. Decide and document this boundary before presenting it as full automatic-direction support. Explicit `lang` and `dir` overrides and the repaired shadow inheritance must remain intact.

## Remaining architecture and evidence gaps

- Registration is a shared module-level registry. Do not mutate global dictionaries per SSR request and assume concurrent isolation. Request-safe locale/translation context needs a deliberate contract and parallel-request regression before deployment guidance recommends it.
- Locale normalization is not full BCP 47 validation. Missing-term and malformed-locale diagnostics are not a complete developer-facing policy.
- The terms are typed, but controller rest parameters do not themselves prove formatter argument shape/grammar correctness for every callback.
- Late registration and scoped/shadow context now have focused regressions; broader migrations must preserve them rather than adding disconnected per-component locale caches.
- Storybook loads official and pseudo packs, but its language toolbar is not execution coverage.
- Visual configuration currently lists light, dark, forced-colors, rtl, and reduced-motion. The catalog RTL fixture sets Arabic language/direction; there are no dedicated pseudo-locale projects in this configuration. Existing or missing PNG files must not be counted as new verified outcomes from this audit.
- `apps/ssr-tests/scripts/generate-fixture.mjs:104` generates an English document. Current catalog SSR existence is not an all-five-language hydration and concurrent-request gate.
- Each next migration needs locale-aware assertions for rendered text, accessible names, live announcements, errors, explicit overrides, reconnect, and language changes. Add representative Arabic keyboard/visual coverage and pseudo-localized overflow checks, not only dictionary-key tests.
- Fluent-speaker review, especially Arabic grammar and terminology, remains a release requirement beyond automated parity checks.

## Recommended bounded implementation sequence

1. **Remaining core form messages:** color-picker, select, masked-input and file-input; then date-picker, date-range-picker and time-picker in the same ownership window if manageable. Reuse existing generic terms where meaning matches, add typed distinct terms only where necessary, populate all five official dictionaries and English/pseudo parity. Prove invalid-message locale updates, required toggles, custom validity preservation/clearing, explicit hints and reset. Do not turn native browser messages into a new custom policy accidentally.
2. **Core default-label batches:** first tag/tag-input, fold, banner, code-block and loading-overlay; then host-attribute defaults (meter, progress-ring, skeleton, toast) with an explicit ownership strategy; then navigation, confirmation, pricing, signature and transfer labels. Preserve property/attribute/slot overrides and test their removal restoring the localized default.
3. **Shared formatter context and date presets:** establish locale precedence and safe formatting helpers; migrate built-in date presets, date/time displays, binary long units and collation independently of form-value serialization.
4. **Core announcements:** countdown and tour first. Use complete typed message contracts, number/list/plural handling, and controlled live-region timing; avoid fragment concatenation.
5. **Media defaults:** migrate all six media tags while preserving explicit labels, real native-control boundaries, reconnect and live locale behavior.
6. **Calendar/scheduler:** all four expansion tags, shared date/slot formatting, availability editor messages, plural counts and actual RTL navigation.
7. **Complex data tools:** table/infinite-table, editor, kanban and node-graph as separate slices with typed default-message integration and movement announcements. Preserve existing override APIs.
8. **Parser:** structured built-in validation/error codes and parameters, translated UI summaries/actions, explicit custom-validator ownership, and imported-data parsing policy.
9. **Remaining expansion wrappers:** chart base/subclasses, map dependency controls, Markdown error fallback and QR-code fallback labels; test inherited surfaces rather than counting base migration as per-tag execution.
10. **Product gate:** all-five-language representative browser and SSR/hydration tests, concurrent request isolation, pseudo-locale overflow/RTL verification, fluent review, documented native/dependency boundaries, and a maintained string inventory/allowlist that does not confuse caller content with internal copy.

A slice is checked off only after implementation, focused regressions and honest evidence. No item above is claimed complete by this source audit.

## Catalog traceability appendix

### Subsequent implementation: core forms, 2026-08-26

The inventory above records the pre-migration audit snapshot. The first recommended
slice has since been implemented for select, color-picker, masked-input, file-input,
date-picker, date-range-picker and time-picker validation, plus file-input's single
and multiple upload hints. Nine typed terms were added across English and the five
official dictionaries; existing generic terms are reused. Current invalid messages
now follow live language changes. Date/time required validity also responds when
`required` changes without a value change. Explicit labels, hint slots, custom errors
and canonical form values are preserved by regression tests.

The tests-first record has 121 existing passes and 89 new failures before the fix:
`quality/evidence/2026-08-26T13-02-14-078Z-core-forms-localization-red`.
The completed three-engine record has 210 passes per engine, 630 total, without
retries: `quality/evidence/2026-08-26T13-04-39-666Z-core-forms-localization-green-matrix`.
Both recorded source fingerprints remained stable. Core typecheck and scoped lint
also passed. This does not certify all core text: date presets, date/time formatting,
other labels and announcements remain in the inventory. The new translation prose
is machine-assisted draft copy awaiting fluent-speaker review.

### Subsequent implementation: core default labels, 2026-08-26

The next bounded slice migrates owned default labels for anchor-nav, app-bar,
banner, code-block, dropzone, fold, loading-overlay, popconfirm, range-slider,
speed-dial, split-panel, tag, transfer, pricing-table, pricing-tier and signature-pad.
Twenty-two typed terms were added to English and all five official dictionaries;
existing terms are reused where their meaning matches. Explicit property and
attribute values remain application-owned, including values equal to the English
default and empty strings. Removing an override restores the live locale default.
The existing English dropzone copy is preserved. This is not a claim that these
components' application content or native browser surfaces are library-translated.

There are 151 new cases, bringing this 16-file focused suite to 359 cases per
engine. They cover the five official locales, `fr-CA` fallback, live closed-shadow
language changes, reconnect, explicit overrides, parameterized copy-code labels,
copied state and actual local-image signature actions. The tests-first record is
`quality/evidence/2026-08-26T13-17-27-257Z-core-labels-localization-red`: 214 passes
and 145 failures. Six new cases legitimately passed before migration because the
expected translated words already equal their English defaults.

The first implementation matrix exposed an absent-versus-explicit-empty loading
label invalidation defect and an incorrect pseudo-locale expectation. Both were
corrected with the assertions retained. Older signature tests used fabricated
pointer IDs, which Firefox rejected. Replacing their gesture fixture with trusted
native pointer input then revealed a genuine canvas-focus defect caused by
preventing pointer defaults. The runtime now explicitly focuses the drawing
surface. The fixture checks trusted down/move/up events, capture and release,
focus, plus the existing ink, event and image-state assertions. Disabled hit
testing remains disabled. The focused corrections passed 85 cases in each engine:
`quality/evidence/2026-08-26T13-29-24-468Z-core-labels-focused-corrections`.

The combined 359-by-three matrix subsequently passed all 1,077 assertions but
failed to exit normally. It is retained as a failed gate, not a clean pass:
`quality/evidence/2026-08-26T13-31-30-112Z-core-labels-localization-confirmed-matrix`.
Its `teardown-forensics.md` records remaining WebKit network-process/TCP records
and the verified WTR/esbuild processes that required termination. The original
failed matrix and the 120-second, zero-result Firefox native-fixture diagnostic
are also retained. No retries or timeout increases were used to certify success.

Running the unchanged suite in three separate engine processes produced normal
exit-zero passes, 359 per engine, 1,077 total:

- Chromium: `quality/evidence/2026-08-26T13-36-35-577Z-core-labels-localization-chromium-serial`, 15.2 seconds; stable source fingerprint.
- Firefox: `quality/evidence/2026-08-26T13-37-03-098Z-core-labels-localization-firefox-serial`, 26.2 seconds; global source fingerprint changed during other work, while the owned files remained frozen.
- WebKit: `quality/evidence/2026-08-26T13-37-51-690Z-core-labels-localization-webkit-serial`, 31.7 seconds; stable source fingerprint.

Core typecheck and scoped lint of 38 changed TypeScript files also passed. Separate
process success narrows the teardown investigation but does not establish its root
cause or erase the failed combined-run gate. Host-attribute ownership for meter,
progress-ring, skeleton and toast, shared locale-aware formatting, countdown/tour
announcements, expansion-package strings, locale SSR isolation and fluent-speaker
review remain open. The new translation prose is machine-assisted draft copy.

Every catalog tag was resolved and included in discovery. “No additional candidate” means this pass did not confirm another owned English string; it is not a completeness verdict. “Registry source signal” comes from the existing quality attribution, not a new execution measurement. Shared helper and inherited gaps are described above, and candidate categories deliberately do not produce a localization percentage.

| Tag                           | Runtime source                                                                            | Audit trace                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `fluid-accordion`             | `packages/components/src/components/accordion/fluid-accordion.ts`                         | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-anchor-nav`            | `packages/components/src/components/anchor-nav/fluid-anchor-nav.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-animated-image`        | `packages/media/src/components/animated-image/fluid-animated-image.ts`                    | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-animation`             | `packages/components/src/components/animation/fluid-animation.ts`                         | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-app-bar`               | `packages/components/src/components/app-bar/fluid-app-bar.ts`                             | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-aspect-ratio`          | `packages/components/src/components/aspect-ratio/fluid-aspect-ratio.ts`                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-audio`                 | `packages/media/src/components/audio/fluid-audio.ts`                                      | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-availability-editor`   | `packages/scheduler/src/components/availability-editor/fluid-availability-editor.ts`      | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-avatar`                | `packages/components/src/components/avatar/fluid-avatar.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-avatar-group`          | `packages/components/src/components/avatar-group/fluid-avatar-group.ts`                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-badge`                 | `packages/components/src/components/badge/fluid-badge.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-banner`                | `packages/components/src/components/banner/fluid-banner.ts`                               | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-bar-chart`             | `packages/charts/src/components/bar-chart/fluid-bar-chart.ts`                             | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-breadcrumb`            | `packages/components/src/components/breadcrumb/fluid-breadcrumb.ts`                       | Registry source signal; not full-string or behavioral certification             |
| `fluid-breadcrumb-item`       | `packages/components/src/components/breadcrumb/fluid-breadcrumb-item.ts`                  | Registry source signal; not full-string or behavioral certification             |
| `fluid-bubble-chart`          | `packages/charts/src/components/bubble-chart/fluid-bubble-chart.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-button`                | `packages/components/src/components/button/fluid-button.ts`                               | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-button-group`          | `packages/components/src/components/button-group/fluid-button-group.ts`                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-calendar`              | `packages/components/src/components/calendar/fluid-calendar.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-callout`               | `packages/components/src/components/callout/fluid-callout.ts`                             | Registry source signal; not full-string or behavioral certification             |
| `fluid-card`                  | `packages/components/src/components/card/fluid-card.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-carousel`              | `packages/components/src/components/carousel/fluid-carousel.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-carousel-item`         | `packages/components/src/components/carousel/fluid-carousel-item.ts`                      | Registry source signal; not full-string or behavioral certification             |
| `fluid-celebrate`             | `packages/animations/src/effects/fluid-celebrate.ts`                                      | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-chart`                 | `packages/charts/src/components/chart/fluid-chart.ts`                                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-checkbox`              | `packages/components/src/components/checkbox/fluid-checkbox.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-code-block`            | `packages/components/src/components/code-block/fluid-code-block.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-col`                   | `packages/components/src/components/grid/fluid-col.ts`                                    | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-color-picker`          | `packages/components/src/components/color-picker/fluid-color-picker.ts`                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-column-mapper`         | `packages/parser/src/components/column-mapper/fluid-column-mapper.ts`                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-command-palette`       | `packages/components/src/components/command-palette/fluid-command-palette.ts`             | Registry source signal; not full-string or behavioral certification             |
| `fluid-comparison`            | `packages/components/src/components/comparison/fluid-comparison.ts`                       | Registry source signal; not full-string or behavioral certification             |
| `fluid-context-menu`          | `packages/components/src/components/context-menu/fluid-context-menu.ts`                   | Registry source signal; not full-string or behavioral certification             |
| `fluid-copy-button`           | `packages/components/src/components/copy-button/fluid-copy-button.ts`                     | Registry source signal; not full-string or behavioral certification             |
| `fluid-countdown`             | `packages/components/src/components/countdown/fluid-countdown.ts`                         | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-date-picker`           | `packages/components/src/components/date-picker/fluid-date-picker.ts`                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-date-range-picker`     | `packages/components/src/components/date-range-picker/fluid-date-range-picker.ts`         | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-description-item`      | `packages/components/src/components/description-list/fluid-description-item.ts`           | Registry source signal; not full-string or behavioral certification             |
| `fluid-description-list`      | `packages/components/src/components/description-list/fluid-description-list.ts`           | Registry source signal; not full-string or behavioral certification             |
| `fluid-details`               | `packages/components/src/components/accordion/fluid-details.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-dialog`                | `packages/components/src/components/dialog/fluid-dialog.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-divider`               | `packages/components/src/components/divider/fluid-divider.ts`                             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-doughnut-chart`        | `packages/charts/src/components/doughnut-chart/fluid-doughnut-chart.ts`                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-drawer`                | `packages/components/src/components/drawer/fluid-drawer.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-dropdown`              | `packages/components/src/components/dropdown/fluid-dropdown.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-dropdown-item`         | `packages/components/src/components/dropdown/fluid-dropdown-item.ts`                      | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-dropzone`              | `packages/components/src/components/dropzone/fluid-dropzone.ts`                           | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-empty-state`           | `packages/components/src/components/empty-state/fluid-empty-state.ts`                     | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-event-calendar`        | `packages/calendar/src/components/event-calendar/fluid-event-calendar.ts`                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-field`                 | `packages/components/src/components/field/fluid-field.ts`                                 | Registry source signal; not full-string or behavioral certification             |
| `fluid-fieldset`              | `packages/components/src/components/fieldset/fluid-fieldset.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-file-input`            | `packages/components/src/components/file-input/fluid-file-input.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-file-parser`           | `packages/parser/src/components/file-parser/fluid-file-parser.ts`                         | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-fold`                  | `packages/components/src/components/fold/fluid-fold.ts`                                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-form`                  | `packages/components/src/components/form/fluid-form.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-format-bytes`          | `packages/components/src/components/format-bytes/fluid-format-bytes.ts`                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-format-date`           | `packages/components/src/components/format-date/fluid-format-date.ts`                     | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-format-number`         | `packages/components/src/components/format-number/fluid-format-number.ts`                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-grid`                  | `packages/components/src/components/grid/fluid-grid.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-hero`                  | `packages/components/src/components/hero/fluid-hero.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-hotkey`                | `packages/components/src/components/hotkey/fluid-hotkey.ts`                               | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-icon`                  | `packages/components/src/components/icon/fluid-icon.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-image`                 | `packages/components/src/components/image/fluid-image.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-include`               | `packages/components/src/components/include/fluid-include.ts`                             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-infinite-table`        | `packages/table/src/components/infinite-table/fluid-infinite-table.ts`                    | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-input`                 | `packages/components/src/components/input/fluid-input.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-intersection-observer` | `packages/components/src/components/intersection-observer/fluid-intersection-observer.ts` | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-kanban`                | `packages/kanban/src/components/kanban/fluid-kanban.ts`                                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-kbd`                   | `packages/components/src/components/kbd/fluid-kbd.ts`                                     | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-lightbox`              | `packages/media/src/components/lightbox/fluid-lightbox.ts`                                | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-line-chart`            | `packages/charts/src/components/line-chart/fluid-line-chart.ts`                           | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-list`                  | `packages/components/src/components/list/fluid-list.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-list-item`             | `packages/components/src/components/list/fluid-list-item.ts`                              | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-loading-overlay`       | `packages/components/src/components/loading-overlay/fluid-loading-overlay.ts`             | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-map`                   | `packages/map/src/components/map/fluid-map.ts`                                            | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-markdown`              | `packages/markdown/src/fluid-markdown.ts`                                                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-masked-input`          | `packages/components/src/components/masked-input/fluid-masked-input.ts`                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-menu`                  | `packages/components/src/components/menu/fluid-menu.ts`                                   | Registry source signal; not full-string or behavioral certification             |
| `fluid-menu-item`             | `packages/components/src/components/menu/fluid-menu-item.ts`                              | Registry source signal; not full-string or behavioral certification             |
| `fluid-menu-label`            | `packages/components/src/components/menu/fluid-menu-label.ts`                             | Registry source signal; not full-string or behavioral certification             |
| `fluid-meter`                 | `packages/components/src/components/meter/fluid-meter.ts`                                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-mosaic`                | `packages/components/src/components/mosaic/fluid-mosaic.ts`                               | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-mosaic-item`           | `packages/components/src/components/mosaic/fluid-mosaic-item.ts`                          | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-mutation-observer`     | `packages/components/src/components/mutation-observer/fluid-mutation-observer.ts`         | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-nav-item`              | `packages/components/src/components/nav-list/fluid-nav-item.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-nav-list`              | `packages/components/src/components/nav-list/fluid-nav-list.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-node-graph`            | `packages/node-graph/src/components/node-graph/fluid-node-graph.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-number-input`          | `packages/components/src/components/number-input/fluid-number-input.ts`                   | Registry source signal; not full-string or behavioral certification             |
| `fluid-option`                | `packages/components/src/components/select/fluid-option.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-otp`                   | `packages/components/src/components/otp/fluid-otp.ts`                                     | Registry source signal; not full-string or behavioral certification             |
| `fluid-page`                  | `packages/components/src/components/page/fluid-page.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-pagination`            | `packages/components/src/components/pagination/fluid-pagination.ts`                       | Registry source signal; not full-string or behavioral certification             |
| `fluid-pie-chart`             | `packages/charts/src/components/pie-chart/fluid-pie-chart.ts`                             | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-polar-area-chart`      | `packages/charts/src/components/polar-area-chart/fluid-polar-area-chart.ts`               | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-popconfirm`            | `packages/components/src/components/popconfirm/fluid-popconfirm.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-popover`               | `packages/components/src/components/popover/fluid-popover.ts`                             | Registry source signal; not full-string or behavioral certification             |
| `fluid-popup`                 | `packages/components/src/components/popup/fluid-popup.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-pricing-table`         | `packages/components/src/components/pricing-table/fluid-pricing-table.ts`                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-pricing-tier`          | `packages/components/src/components/pricing-table/fluid-pricing-tier.ts`                  | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-progress-bar`          | `packages/components/src/components/progress-bar/fluid-progress-bar.ts`                   | Registry source signal; not full-string or behavioral certification             |
| `fluid-progress-ring`         | `packages/components/src/components/progress-ring/fluid-progress-ring.ts`                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-qr-code`               | `packages/qr/src/fluid-qr-code.ts`                                                        | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-radar-chart`           | `packages/charts/src/components/radar-chart/fluid-radar-chart.ts`                         | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-radio`                 | `packages/components/src/components/radio/fluid-radio.ts`                                 | Registry source signal; not full-string or behavioral certification             |
| `fluid-radio-group`           | `packages/components/src/components/radio/fluid-radio-group.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-range-slider`          | `packages/components/src/components/range-slider/fluid-range-slider.ts`                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-rating`                | `packages/components/src/components/rating/fluid-rating.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-relative-time`         | `packages/components/src/components/relative-time/fluid-relative-time.ts`                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-resize-observer`       | `packages/components/src/components/resize-observer/fluid-resize-observer.ts`             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-result`                | `packages/components/src/components/result/fluid-result.ts`                               | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-rich-text-editor`      | `packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.ts`               | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-scatter-chart`         | `packages/charts/src/components/scatter-chart/fluid-scatter-chart.ts`                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-scheduler`             | `packages/scheduler/src/components/scheduler/fluid-scheduler.ts`                          | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-scroller`              | `packages/components/src/components/scroller/fluid-scroller.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-segment`               | `packages/components/src/components/segmented-control/fluid-segment.ts`                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-segmented-control`     | `packages/components/src/components/segmented-control/fluid-segmented-control.ts`         | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-select`                | `packages/components/src/components/select/fluid-select.ts`                               | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-sidebar`               | `packages/components/src/components/sidebar/fluid-sidebar.ts`                             | Registry source signal; not full-string or behavioral certification             |
| `fluid-signature-pad`         | `packages/components/src/components/signature-pad/fluid-signature-pad.ts`                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-skeleton`              | `packages/components/src/components/skeleton/fluid-skeleton.ts`                           | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-slider`                | `packages/components/src/components/slider/fluid-slider.ts`                               | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-sparkline`             | `packages/charts/src/components/sparkline/fluid-sparkline.ts`                             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-speed-dial`            | `packages/components/src/components/speed-dial/fluid-speed-dial.ts`                       | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-spinner`               | `packages/components/src/components/spinner/fluid-spinner.ts`                             | Registry source signal; not full-string or behavioral certification             |
| `fluid-split-panel`           | `packages/components/src/components/split-panel/fluid-split-panel.ts`                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-stack`                 | `packages/components/src/components/stack/fluid-stack.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-stat`                  | `packages/components/src/components/stat/fluid-stat.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-step`                  | `packages/components/src/components/steps/fluid-step.ts`                                  | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-steps`                 | `packages/components/src/components/steps/fluid-steps.ts`                                 | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-switch`                | `packages/components/src/components/switch/fluid-switch.ts`                               | Registry source signal; not full-string or behavioral certification             |
| `fluid-tab`                   | `packages/components/src/components/tabs/fluid-tab.ts`                                    | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-tab-panel`             | `packages/components/src/components/tabs/fluid-tab-panel.ts`                              | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-table`                 | `packages/table/src/components/table/fluid-table.ts`                                      | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-tabs`                  | `packages/components/src/components/tabs/fluid-tabs.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-tag`                   | `packages/components/src/components/tag/fluid-tag.ts`                                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-tag-input`             | `packages/components/src/components/tag-input/fluid-tag-input.ts`                         | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-textarea`              | `packages/components/src/components/textarea/fluid-textarea.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-theme-toggle`          | `packages/components/src/components/theme-toggle/fluid-theme-toggle.ts`                   | Registry source signal; not full-string or behavioral certification             |
| `fluid-time-picker`           | `packages/components/src/components/time-picker/fluid-time-picker.ts`                     | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-time-slots`            | `packages/scheduler/src/components/time-slots/fluid-time-slots.ts`                        | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-timeline`              | `packages/components/src/components/timeline/fluid-timeline.ts`                           | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-timeline-item`         | `packages/components/src/components/timeline/fluid-timeline-item.ts`                      | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-toast`                 | `packages/components/src/components/toast/fluid-toast.ts`                                 | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-toast-item`            | `packages/components/src/components/toast/fluid-toast-item.ts`                            | Registry source signal; not full-string or behavioral certification             |
| `fluid-toolbar`               | `packages/components/src/components/toolbar/fluid-toolbar.ts`                             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-tooltip`               | `packages/components/src/components/tooltip/fluid-tooltip.ts`                             | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-tour`                  | `packages/components/src/components/tour/fluid-tour.ts`                                   | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-transfer`              | `packages/components/src/components/transfer/fluid-transfer.ts`                           | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-tree`                  | `packages/components/src/components/tree/fluid-tree.ts`                                   | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-tree-item`             | `packages/components/src/components/tree/fluid-tree-item.ts`                              | No additional owned English candidate confirmed in this pass; not certification |
| `fluid-truncate`              | `packages/components/src/components/truncate/fluid-truncate.ts`                           | Registry source signal; not full-string or behavioral certification             |
| `fluid-typeahead`             | `packages/components/src/components/typeahead/fluid-typeahead.ts`                         | Registry source signal; not full-string or behavioral certification             |
| `fluid-video`                 | `packages/media/src/components/video/fluid-video.ts`                                      | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-video-playlist`        | `packages/media/src/components/video-playlist/fluid-video-playlist.ts`                    | Confirmed owned default/message or inherited gap; see inventory                 |
| `fluid-zoomable-frame`        | `packages/media/src/components/zoomable-frame/fluid-zoomable-frame.ts`                    | Confirmed owned default/message or inherited gap; see inventory                 |
