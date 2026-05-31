# @fluid-ds/icons

Icon registry for [Fluid](https://github.com/RHeijnen/fluid_ds). Curated
[lucide](https://lucide.dev) subset registered by default (~50 icons),
~1500 more available as per-icon side-effect modules or via the lazy
`loadIcon()` API.

```html
<fluid-icon name="rocket"></fluid-icon>
```

## Install

```bash
pnpm add @fluid-ds/icons
```

## Use

### Default icon set

```ts
import "@fluid-ds/icons/register-defaults";
```

Registers ~50 commonly-needed icons: chevrons, x, check, search, copy,
download, eye / eye-off, undo, plus, minus, alerts, common nouns
(user, settings, house, bell, …).

### Add more on demand

```ts
import "@fluid-ds/icons/lucide/rocket";   // side-effect import
import "@fluid-ds/icons/lucide/zap";
```

Or lazy-register at runtime:

```ts
import { loadIcon } from "@fluid-ds/icons";

await loadIcon("rocket");
// <fluid-icon name="rocket"> now works
```

### Custom SVG

```ts
import { registerIcon } from "@fluid-ds/icons";

registerIcon(
  "my-custom",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>`
);
```

## API

| Function | Purpose |
| --- | --- |
| `registerIcon(name, svg)` | Register a single icon |
| `registerIcons({name: svg, …})` | Batch-register |
| `getIcon(name)` | Read the SVG string |
| `hasIcon(name)` | Test for presence |
| `listIcons()` | All registered names |
| `loadIcon(name)` | Lazy-load from the bundled lucide set |
| `onIconRegistered(fn)` | Subscribe to registration events |

## License

[MIT](./LICENSE), © Fluid contributors. Icons by
[lucide](https://lucide.dev) under the ISC license.
