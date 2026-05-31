# @fluid-ds/qr

Themable QR-code web component for
[Fluid](https://github.com/RHeijnen/fluid_ds), rendered as crisp inline
SVG so it scales without aliasing. Backed by
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

## Props

| Prop | Default | Description |
| --- | --- | --- |
| `value` | `""` | The data to encode |
| `size` | `160` | Pixel size of the rendered code |
| `ec-level` | `"M"` | Error correction: `L`, `M`, `Q`, `H` |
| `fill` | `currentColor` | Foreground color |
| `background` | `transparent` | Background color |
| `margin` | `2` | Module margin (in modules) |

The component inherits text color via `currentColor`, so a single CSS rule
themes every QR on the page:

```css
[data-fluid-brand="custom"] fluid-qr-code {
  color: var(--fluid-color-primary);
}
```

## License

[MIT](./LICENSE), © Fluid contributors. qrcode-generator is MIT-licensed.
