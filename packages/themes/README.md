# @fluid-ds/themes

Drop-in brand presets for [Fluid](https://github.com/RHeijnen/fluid_ds).
Pure CSS, no build step, apply via the `data-fluid-brand` attribute to
swap brands at runtime.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/themes@latest/src/midnight.css" />

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
```

## What's in the box

- `src/midnight.css`: dark, deep-purple accent
- `src/corporate.css`: neutral, blue accent

Each theme is a single `[data-fluid-brand="..."]` rule that overrides the
semantic tokens. Pair with [`@fluid-ds/tokens`](../tokens) as the base.

## Roll your own

Use the [theme builder](https://github.com/RHeijnen/fluid_ds#three-surfaces)
to edit tokens visually and export your own brand CSS, the output drops
straight into your app.

## License

[MIT](./LICENSE), © Fluid contributors
