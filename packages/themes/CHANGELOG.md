# @fluid-ds/themes

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
  - @fluid-ds/tokens@1.0.0-rc.0

## 0.4.0

### Patch Changes

- Align the drop-in brand presets with the 0.4 token contract while retaining the existing
  runtime-switchable, pure-CSS `data-fluid-brand` interface.
- Updated dependencies
  - @fluid-ds/tokens@0.4.0

## 0.0.3

### Patch Changes

- Promote the foundational icon, theme, and token packages from the alpha
  prerelease line alongside the first stable component and expansion releases.
- Updated dependencies
  - @fluid-ds/tokens@0.0.3
