# Media localization contract, 27 August 2026

## Outcome

The bounded media tranche migrates Fluid-owned defaults for animated image,
audio, video, video playlist, lightbox and zoomable frame to the shared typed
localization registry.

- Play/pause, seek, mute, player/group, playlist, track, lightbox, position,
  close, zoom/reset and physical pan defaults react to inherited language.
- Media display counters and audio time numerals use the active locale while
  native seek values and emitted event payloads remain canonical numbers.
- Explicit label, title and alt overrides remain authoritative, including
  intentional empty strings. Caller track titles, image alt text and media
  metadata are preserved verbatim.
- Pan-left/right/up/down actions remain physical operations in RTL and are not
  reversed merely because their labels use Arabic.
- Native video playback chrome remains browser-owned.

The package now declares its existing workspace dependency on
`@fluid-ds/components` and imports the supported internal base-element export.
Components does not depend on media, so this introduces no dependency cycle.

## Verification

On the synchronized Linux snapshot, components and media typechecking pass,
the media build passes, and the built package index plus all six definition
entry points import independently. The complete media browser suite passes
60/60 tests in Chromium, Firefox and WebKit: 180 executions with normal
lifecycle shutdown. Retained lifecycle evidence is
`2026-08-27T10-43-30-334Z-83493.json`.

The five non-English dictionary additions remain drafts pending fluent-speaker
review. Manual assistive-technology review, visual RTL/pseudo-locale approval
and target-browser native playback review remain open human/platform gates.
