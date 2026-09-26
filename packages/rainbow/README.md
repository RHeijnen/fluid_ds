# @fluid-ds/rainbow

The Rainbow expansion pack for [Fluid](https://github.com/RHeijnen/fluid_ds):
illustrated, home-screen style widgets and multi-color illustrations that pair with
the Rainbow brand preset (`@fluid-ds/themes/rainbow.css`). They work under any
brand too, falling back to Fluid's own palette.

```html
<fluid-rainbow-landscape>
  <fluid-rainbow-clock></fluid-rainbow-clock>
</fluid-rainbow-landscape>

<fluid-rainbow-battery value="99.98" show-value charging pulse
  >Uptime</fluid-rainbow-battery
>

<fluid-icon name="rainbow-chat"></fluid-icon>
```

## Install

```bash
pnpm add @fluid-ds/rainbow @fluid-ds/themes
```

```ts
import "@fluid-ds/themes/rainbow.css"; // the look
import "@fluid-ds/rainbow/define"; // <fluid-rainbow-landscape>, -clock, -battery
import "@fluid-ds/rainbow/illustrations/register"; // rainbow-chat, rainbow-spot-success, ...
```

Then set `data-fluid-brand="rainbow"` on `<html>` (or any subtree) and load the
Fredoka and Nunito fonts the preset names.

## What's in the box

- `<fluid-rainbow-landscape>`: sky, a drifting cloud, hills and trees in an
  outlined tile that frames slotted content. Decorative by default.
- `<fluid-rainbow-clock>`: a live, localized clock face (`<time>`), ticking on
  the minute, never a live region. `datetime` freezes it.
- `<fluid-rainbow-battery>`: a meter drawn as a battery with a rainbow cell,
  optional charging cord with a smiling plug, and an optional heartbeat trace.
- `rainbowIllustrations`: 84 app-tile illustrations (64×64 squircles, grouped
  by subject: communication, people, media, work, data, security, shopping,
  places, nature, fun, status and brand) plus 8 wide spot illustrations
  (`rainbow-spot-*`, 160×120) for empty states, errors and celebrations. They
  register with the shared icon registry and render through `<fluid-icon>`;
  `rainbowIllustrationGroups` lists the names by group.

All motion stops under `prefers-reduced-motion` and scales with
`--fluid-motion`. Full docs: the `@fluid-ds/rainbow` page on the Fluid docs site.

## License

[MIT](./LICENSE), © Fluid contributors
