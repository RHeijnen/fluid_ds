# @fluid-ds/media

## 1.0.0-rc.0

### Minor Changes

- 4139c57: Add the Rainbow brand preset and the tokens it needs.
  - New `@fluid-ds/themes/rainbow.css`: playful pastels on cream paper, 3px ink
    outlines, squircle corners, solid offset "pop" shadows and a rounded display
    font, verified at AA and AAA in light and dark.
  - New tokens: `--fluid-border-width-default` and `--fluid-border-width-divider`
    (every literal 1px outline and divider in the catalog now reads them through a
    per-component knob such as `--fluid-card-border-width`),
    `--fluid-font-family-display`, `--fluid-easing-spring`, and the optional
    `--fluid-accent-fg` / `--fluid-<tone>-fg` roles for themes whose accent fill is
    too light to use as text.
  - New component knobs: button outline width, resting / pressed / toggled
    shadows and press depth; switch track and thumb size, outline and shadows;
    badge outline; card radius and header font; dialog outline and title font;
    input shadow. New `fluid-pop-in` keyframe.
  - New expansion pack `@fluid-ds/rainbow`: `<fluid-rainbow-landscape>`,
    `<fluid-rainbow-clock>` and `<fluid-rainbow-battery>` widgets plus fourteen
    illustrated app icons for the shared icon registry, with React wrappers.

  Every new token defaults to the previous value, so existing brands render
  unchanged.

### Patch Changes

- Updated dependencies [4139c57]
  - @fluid-ds/components@1.0.0-rc.0

## 0.4.0

### Minor Changes

- Add accessible pan controls and a public `panBy()` method to
  `fluid-zoomable-frame`, including configurable pan distance and control labels.
- Allow `fluid-video` to consume declarative light-DOM `<source>` and `<track>`
  children and expose an accessible player label.

### Patch Changes

- Localize Fluid-owned media controls, counters and time displays across audio,
  video, playlists, animated images, lightbox and zoomable frame while preserving
  caller content and physical pan behavior in RTL.
- Stop disconnected video playback and improve playlist focus treatment and
  lightbox override handling.

## 0.1.0

### Minor Changes

- db0556c: Add two components to the media pack:
  - **`fluid-audio`**: a themed audio player wrapping a native `<audio>` element
    with custom accessible controls (play/pause labelled by state, a seek slider
    with `aria-valuetext` time, mute toggle with `aria-pressed`).
  - **`fluid-lightbox`**: a thumbnail gallery that opens images in a modal
    lightbox. Each slotted `<img>` becomes a focusable button; the lightbox is a
    native top-layer `<dialog>` (focus trap, Escape to close, backdrop) with
    previous / next navigation, a position counter, and optional `data-full`
    high-resolution sources.

  The pack now ships its own test suite (web-test-runner), and both components
  ship stories + tests + docs.
