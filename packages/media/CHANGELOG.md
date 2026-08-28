# @fluid-ds/media

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
