# @fluid-ds/tokens

Design tokens for [Fluid](https://github.com/RHeijnen/fluid_ds), typed
TypeScript source that generates CSS custom properties (one file per
scheme) and a JSON manifest. Drop the CSS into your `<head>` or import it
in your bundler.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/dark.css" />
```

## Install

```bash
pnpm add @fluid-ds/tokens
```

## Use

```ts
// Order matters: base before the schemes.
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
```

The CSS files declare every `--fluid-*` custom property at `:root`. Override
a single token to retheme an entire app:

```css
[data-fluid-brand="custom"] {
  --fluid-color-primary: #6366f1;
}
```

Toggle dark mode by setting `data-fluid-theme` on `<html>`:

```ts
document.documentElement.setAttribute("data-fluid-theme", "dark");
```

## What's in the box

- `dist/base.css`: primitives + layout vars (always load first)
- `dist/light.css`: semantic vars for the light scheme
- `dist/dark.css`: semantic vars for the dark scheme
- `dist/manifest.json`: programmatic catalog used by the theme builder
- `src/tokens.ts`: TypeScript source (re-exported via `./source`)

## Documentation

- [Theming basics](https://github.com/RHeijnen/fluid_ds): the three-layer
  model (brand, component, per-element)
- [Theme builder](https://github.com/RHeijnen/fluid_ds#three-surfaces):
  live token editor with brand-CSS export

## License

[MIT](./LICENSE), © Fluid contributors
