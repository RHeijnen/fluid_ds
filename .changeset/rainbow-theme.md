---
"@fluid-ds/tokens": minor
"@fluid-ds/themes": minor
"@fluid-ds/components": minor
"@fluid-ds/calendar": minor
"@fluid-ds/charts": minor
"@fluid-ds/editor": minor
"@fluid-ds/kanban": minor
"@fluid-ds/map": minor
"@fluid-ds/markdown": minor
"@fluid-ds/media": minor
"@fluid-ds/node-graph": minor
"@fluid-ds/parser": minor
"@fluid-ds/rainbow": minor
"@fluid-ds/react": minor
"@fluid-ds/scheduler": minor
"@fluid-ds/table": minor
---

Add the Rainbow brand preset and the tokens it needs.

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
