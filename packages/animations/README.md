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

## Accessibility

The controller respects `prefers-reduced-motion: reduce`, every
animation collapses to a 0ms tick that lands on the final frame. Users
who opt out of motion get the static end state.

## License

MIT
