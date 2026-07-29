# @fluid-ds/animations

## 0.1.0

### Minor Changes

- 0aace0d: Add an imperative event-effects subsystem alongside the existing keyframe
  registry. A tiny zero-dependency canvas particle engine powers celebration and
  feedback effects exported from `@fluid-ds/animations/effects`: `confetti` (point
  burst + two-sided cannons), `fireworks`, `emojiBurst`, `emojiRain`, `snow`,
  `sparkles`, `streamers`, `pulse`, `stars`, `hearts`, and rainbow `pride`. Each
  returns a handle with `stop()` and a `finished` promise, accepts an element /
  point / viewport-relative origin, and themes from the brand accent + status
  tokens by default. A declarative `<fluid-celebrate effect="..." auto>` component
  (define entry `@fluid-ds/animations/define/celebrate`) exposes `fire()` and a
  `fluid-celebrate-end` event. All effects honor `prefers-reduced-motion`.
