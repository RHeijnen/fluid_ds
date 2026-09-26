# @fluid-ds/themes

Drop-in brand presets for [Fluid](https://github.com/RHeijnen/fluid_ds).
Pure CSS, no build step, apply via the `data-fluid-brand` attribute to
swap brands at runtime.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@fluid-ds/themes@latest/src/midnight.css"
/>

<body data-fluid-brand="midnight">
  <!-- everything inside uses the midnight theme -->
</body>
```

## Install

```bash
pnpm add @fluid-ds/themes
```

```ts
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";
import "@fluid-ds/themes/titanium.css";
import "@fluid-ds/themes/glass.css";
import "@fluid-ds/themes/orchid.css";
import "@fluid-ds/themes/rainbow.css";
```

## What's in the box

- `src/midnight.css`: dark, deep-purple accent
- `src/corporate.css`: neutral, slate accent
- `src/titanium.css`: metallic graphite chrome, gray data, colour kept for status
- `src/glass.css`: frosted translucent surfaces over a colour wash (apply to a
  container, not `<html>`, so the frost has something to blur). Composes with the
  light/dark colour scheme: the wash and frost invert to a dark material under
  `data-fluid-theme="dark"`.
- `src/orchid.css`: airy spacing, soft round corners, slower motion
- `src/rainbow.css`: playful pastels, cream paper, 3px ink outlines, squircle
  corners and solid offset "pop" shadows. Names Fredoka (display) and Nunito
  (body); your app loads them, for example from `@fontsource-variable/fredoka`
  and `@fontsource-variable/nunito`.

Each theme is a `[data-fluid-brand="..."]` rule set that overrides the
semantic tokens. Pair with [`@fluid-ds/tokens`](../tokens) as the base.

### Glass: frosting your own chrome

Glass frosts every Fluid component automatically. For markup the component
`::part` selectors can't reach (a hand-rolled panel, a header strip, your app's
own window frame), add `class="fluid-glass-panel"` to any element inside the
glass container and it gets the same frosted material, in both schemes, from the
one definition in `glass.css`:

```html
<section data-fluid-brand="glass">
  <div class="fluid-glass-panel">Your own chrome, frosted to match.</div>
</section>
```

The frost is driven by `--glass-frost`, `--glass-frost-border` and
`--glass-blur`, so overriding those on the container retunes every frosted
surface at once.

### Rainbow: painting with the palette

Rainbow exposes its pastels as public custom properties on the themed element,
so your own markup can match: `--rainbow-blue`, `--rainbow-green`,
`--rainbow-yellow`, `--rainbow-pink`, `--rainbow-purple`, `--rainbow-coral`,
`--rainbow-tan`, plus `--rainbow-ink`, `--rainbow-cream` and `--rainbow-sand`.

```html
<html data-fluid-brand="rainbow">
  <div
    style="background: var(--rainbow-yellow); border: 3px solid var(--rainbow-ink)"
  >
    Sticker
  </div>
</html>
```

## Roll your own

Use the [theme builder](https://github.com/RHeijnen/fluid_ds#three-surfaces)
to edit tokens visually and export your own brand CSS, the output drops
straight into your app.

## License

[MIT](./LICENSE), © Fluid contributors
