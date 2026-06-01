# @fluid-ds/animations

Attribute-driven animation system for Fluid. A registry of named
keyframes plus a global controller that watches
`data-fluid-animation` attributes on any element and runs the animation
through the Web Animations API.

Framework-agnostic, works on `fluid-*` components, plain HTML, and
elements rendered by any framework.

## Quick start

### CDN

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/animations@latest/dist/define/controller.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/animations@latest/dist/register-defaults.js"></script>

<fluid-card
  data-fluid-animation="fade-in"
  data-fluid-animation-trigger="in-view">
  Fades in when scrolled into view.
</fluid-card>
```

### npm

```bash
pnpm add @fluid-ds/animations
```

```ts
import "@fluid-ds/animations/define/controller"; // boot the controller
import "@fluid-ds/animations/register-defaults"; // ~12 common animations
```

To stay tree-shaken, register only what you use:

```ts
import "@fluid-ds/animations/define/controller";
import "@fluid-ds/animations/animations/fade-in";
import "@fluid-ds/animations/animations/slide-up";
```

## Attributes

| Attribute                            | Purpose                                              | Default      |
| ------------------------------------ | ---------------------------------------------------- | ------------ |
| `data-fluid-animation`               | Animation name from the registry                     | required     |
| `data-fluid-animation-trigger`       | `mount` / `in-view` / `hover` / `click` / `manual`   | `mount`      |
| `data-fluid-animation-duration`      | Milliseconds                                         | per-anim     |
| `data-fluid-animation-delay`         | Milliseconds                                         | `0`          |
| `data-fluid-animation-easing`        | Any CSS easing function                              | per-anim     |
| `data-fluid-animation-iterations`    | Integer or `infinite`                                | per-anim     |

## Included defaults

`fade-in`, `fade-out`, `slide-up`, `slide-down`, `slide-left`,
`slide-right`, `scale-in`, `zoom-in`, `pulse`, `shake`, `bounce`,
`flash`, `spin`.

## Custom animations

```ts
import { registerAnimation } from "@fluid-ds/animations";

registerAnimation("blur-in", {
  keyframes: [
    { opacity: 0, filter: "blur(8px)" },
    { opacity: 1, filter: "blur(0)" }
  ],
  defaults: { duration: 600, easing: "ease-out", fill: "forwards" }
});
```

After registration `data-fluid-animation="blur-in"` just works.

## Effects: imperative celebrations

Alongside the attribute-driven keyframe registry, the pack ships an
imperative **effects** subsystem for "event" celebrations (confetti,
fireworks, snow, and friends). It is a tiny self-contained canvas
particle engine with zero third-party dependencies: one pooled
full-viewport `<canvas>` (fixed, click-through, top layer, decorative)
shared by every active burst and driven by a single
`requestAnimationFrame` loop. The canvas is removed automatically when no
effect is running.

```ts
import { confetti, fireworks } from "@fluid-ds/animations/effects";

// Fire from the clicked button
buyButton.addEventListener("click", () => confetti({ origin: buyButton }));

// Two-sided cannons
confetti({ cannons: true, count: 160 });

// Fireworks return a handle with a finished promise
const show = fireworks({ shells: 8 });
await show.finished;
```

Every effect returns `{ stop(): void; finished: Promise<void> }`.

### Effect functions

`confetti`, `fireworks`, `emojiBurst`, `emojiRain`, `snow`, `sparkles`,
`streamers`, `pulse`, `stars`, `hearts`, `pride`.

`emojiBurst` / `emojiRain` accept a custom `emojis` array OR `images`
(an array of loaded `HTMLImageElement` / rasterized SVG) to use as
particles. `snow`, `sparkles`, and `emojiRain` are ambient: they run
until you call `stop()` (or pass a `duration`).

Colors default to the live Fluid brand accent plus the semantic status
tones (read from CSS custom properties on the document) and are fully
overridable via an `colors` array.

### `<fluid-celebrate>`

A declarative wrapper that renders nothing visible and draws on the
shared canvas:

```ts
import "@fluid-ds/animations/define/celebrate";
```

```html
<fluid-celebrate effect="confetti" auto></fluid-celebrate>

<fluid-celebrate id="party" effect="fireworks"></fluid-celebrate>
<script type="module">
  document.getElementById("party").fire();
</script>
```

It exposes `fire()` / `stop()` and emits `fluid-celebrate-end` when a
burst finishes. See the
[effects docs](https://rheijnen.github.io/fluid_ds/expansion/animations-effects/)
for the full option reference.

## Accessibility

The controller respects `prefers-reduced-motion: reduce`, every
animation collapses to a 0ms tick that lands on the final frame. Users
who opt out of motion get the static end state. The effects engine is
equally reduced-motion aware: under `reduce` nothing animates and ambient
effects resolve immediately. Its canvas is `aria-hidden`, click-through,
and never focusable.

## License

MIT
