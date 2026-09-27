# @fluid-ds/react

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

- Updated dependencies [9b3167a]
- Updated dependencies [4139c57]
  - @fluid-ds/animations@1.0.0-rc.0
  - @fluid-ds/components@1.0.0-rc.0
  - @fluid-ds/calendar@1.0.0-rc.0
  - @fluid-ds/charts@1.0.0-rc.0
  - @fluid-ds/editor@1.0.0-rc.0
  - @fluid-ds/kanban@1.0.0-rc.0
  - @fluid-ds/map@1.0.0-rc.0
  - @fluid-ds/markdown@1.0.0-rc.0
  - @fluid-ds/media@1.0.0-rc.0
  - @fluid-ds/node-graph@1.0.0-rc.0
  - @fluid-ds/parser@1.0.0-rc.0
  - @fluid-ds/rainbow@1.0.0-rc.0
  - @fluid-ds/scheduler@1.0.0-rc.0
  - @fluid-ds/table@1.0.0-rc.0
  - @fluid-ds/qr@1.0.0-rc.0

## 0.4.0

### Minor Changes

- Add generated React 19 wrappers for all 155 Fluid custom elements, with tree-shakable
  component subpaths and typed custom-event callback props.
- Add raw JSX declarations for the complete catalog, including package-scoped JSX subpaths for
  applications that use custom elements directly.
