# @fluid-ds/components

Framework-agnostic web components for [Fluid](https://github.com/RHeijnen/fluid_ds).
~50 standard custom elements, buttons, inputs, dialogs, drawers, tabs,
trees, tooltips, popovers, and more. Drop into any HTML page, React, Vue,
Angular, Svelte, or SolidJS.

```html
<fluid-button>Hello, Fluid</fluid-button>
```

## Install

```bash
pnpm add @fluid-ds/components @fluid-ds/tokens @fluid-ds/icons
```

Or load from a CDN, no build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css" />

<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/icons@latest/dist/register-defaults.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/button/define.js"></script>
```

## Use

Each component has a side-effect `define` entry that registers exactly one
custom element, import the ones you use so unused components stay
tree-shakable.

```ts
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";

import "@fluid-ds/icons/register-defaults";
import "@fluid-ds/components/define/button";
import "@fluid-ds/components/define/input";
import "@fluid-ds/components/define/card";
```

```html
<fluid-card>
  <h3 slot="header">Hello</h3>
  <fluid-input placeholder="Type something…" aria-label="demo"></fluid-input>
  <fluid-button>Save</fluid-button>
</fluid-card>
```

The root `@fluid-ds/components` entry **exports the classes but does not
register the elements**, always go through `/define/<name>` for
registration so unused components stay out of your bundle.

## What's in the box

Inputs · Layout · Feedback · Navigation · Content · Format helpers:
~50 elements total. Full reference at
[the docs site](https://github.com/RHeijnen/fluid_ds#three-surfaces).

## Documentation

- [Docs site](https://github.com/RHeijnen/fluid_ds#three-surfaces): guides + per-component pages
- [Storybook](https://github.com/RHeijnen/fluid_ds#three-surfaces): interactive props/states/a11y
- [Theme builder](https://github.com/RHeijnen/fluid_ds#three-surfaces): live token editor with CSS export

## License

[MIT](./LICENSE), © Fluid contributors
