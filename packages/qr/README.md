# @fluid-ds/qr

Fancy, logo-embeddable QR-code web component for
[Fluid](https://github.com/RHeijnen/fluid_ds), rendered as crisp inline
SVG so it scales without aliasing. Embed a center logo, reshape the modules
and finder eyes, paint a gradient, drop the code over a background image
(artistic mode), and export to PNG. Backed by
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator).
Expansion pack.

```html
<fluid-qr-code value="https://example.com" size="200"></fluid-qr-code>
```

## Install

```bash
pnpm add @fluid-ds/qr
```

```ts
import "@fluid-ds/qr/define";
```

## Logo overlay

Setting `logo` knocks out a padded quiet area in the center and draws the
image on top. It **automatically raises error correction to `H`** so the
covered modules still scan.

```html
<fluid-qr-code
  value="https://example.com"
  logo="/brand-mark.svg"
  logo-size="0.24"
></fluid-qr-code>
```

## Module and eye styling

```html
<fluid-qr-code
  value="https://example.com"
  module-shape="dots"
  eye-shape="circle"
  eye-color="#4f46e5"
  eye-color-top-left="#db2777"
  gradient-from="#4f46e5"
  gradient-to="#db2777"
></fluid-qr-code>
```

## Artistic mode

Renders `logo` full-bleed behind semi-opaque dotted modules. Forces `ec-level`
to `H`. Decorative-first: scan-test on a real phone before shipping.

```html
<fluid-qr-code value="https://example.com" artistic logo="/photo.jpg"></fluid-qr-code>
```

## Export

```ts
const el = document.querySelector("fluid-qr-code");
const dataUrl = await el.toDataURL(); // PNG data URL
await el.download("my-qr.png");        // browser download
```

## Props

| Prop | Default | Description |
| --- | --- | --- |
| `value` | `""` | The data to encode |
| `size` | `160` | Pixel size of the rendered code |
| `ec-level` | `"M"` | Error correction: `L`, `M`, `Q`, `H` (forced to `H` with `logo`/`artistic`) |
| `fill` | token | Module color (falls back to `--fluid-qr-color`) |
| `background` | token | Background color (falls back to `--fluid-qr-bg`) |
| `margin` | `2` | Quiet-zone margin, in modules |
| `label` | `""` | Accessible name; derived from `value` when empty |
| `module-shape` | `"square"` | `square`, `dots`, `rounded` |
| `eye-shape` | `"square"` | `square`, `rounded`, `circle` |
| `eye-color` | token | Finder-eye color (falls back to `--fluid-qr-eye-color`) |
| `eye-color-top-left` / `-top-right` / `-bottom-left` | `""` | Per-eye color override |
| `gradient-from` / `gradient-to` / `gradient-angle` | `""` / `""` / `45` | Linear gradient module fill |
| `logo` | `""` | Center logo URL / data URI (forces `ec-level=H`) |
| `logo-size` | `0.22` | Logo fraction of the code (clamped to `0.3`) |
| `logo-padding` | `0.5` | Knockout padding, in modules |
| `logo-background` | token | Knockout plate color (falls back to `--fluid-qr-logo-bg`) |
| `logo-radius` | `1` | Knockout plate corner radius, in modules |
| `artistic` | `false` | Full-bleed background image behind dotted modules |
| `artistic-opacity` | `0.85` | Module opacity in artistic mode |

## Theming

Every painted role reads a component-scoped token that falls back to a Fluid
semantic variable, so one rule themes every QR on the page:

```css
[data-fluid-brand="custom"] fluid-qr-code {
  --fluid-qr-color: var(--fluid-color-primary);
}
```

Tokens: `--fluid-qr-color`, `--fluid-qr-bg`, `--fluid-qr-eye-color`,
`--fluid-qr-logo-bg`, `--fluid-qr-logo-radius`, `--fluid-qr-gap`.

## License

[MIT](./LICENSE), © Fluid contributors. qrcode-generator is MIT-licensed.
