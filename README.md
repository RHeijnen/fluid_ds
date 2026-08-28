<p align="center">
  <img src="assets/fluid-logo.svg" width="88" height="88" alt="Fluid logo" />
</p>

<h1 align="center">Fluid</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@fluid-ds/components"><img src="https://img.shields.io/npm/v/@fluid-ds/components?color=6366f1&amp;label=npm%20%40fluid-ds%2Fcomponents" alt="npm version" /></a>
  <a href="https://github.com/RHeijnen/fluid_ds/actions/workflows/verify.yml"><img src="https://github.com/RHeijnen/fluid_ds/actions/workflows/verify.yml/badge.svg" alt="CI status" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@fluid-ds/components?color=blue" alt="License" /></a>
</p>

**Framework-agnostic web-component design system.** Drop the same components
into React, Vue, Angular, Svelte, or plain HTML. React 19 consumers can use
generated typed wrappers; every framework can use the standard custom elements
directly. Light by default, fully themable via CSS custom properties, and backed
by catalog-wide automated accessibility coverage.

> Status: **pre-1.0**. Each element has an explicit experimental, beta, stable,
> or deprecated status in `quality/maturity.json`. Stable elements follow the
> published support and deprecation policy; other tiers may change in a minor
> release.

---

## Highlights

- **No framework required.** Drop a `<script>` tag from a CDN and use the
  `<fluid-*>` tags in any HTML page, React, Vue, Angular, Svelte, Solid,
  or plain HTML. Generated React wrappers are an optional typed integration.
- **124 core elements in 103 component families**: buttons, inputs, date pickers, menus,
  command palette, dialogs, drawers, tooltips, tabs, trees, pagination, timeline,
  and a lot more, each one a standard custom element.
- **13 expansion packs** so the core stays lean: `@fluid-ds/charts` (Chart.js),
  `@fluid-ds/scheduler` (appointment booking), `@fluid-ds/table` (data grid),
  `@fluid-ds/calendar` (event calendar), `@fluid-ds/editor` (rich text),
  `@fluid-ds/kanban` (drag-and-drop board), `@fluid-ds/map` (Leaflet),
  `@fluid-ds/node-graph` (node graph editor),
  `@fluid-ds/markdown` (marked), `@fluid-ds/qr` (QR codes, incl. logo-embedded
  fancy codes), `@fluid-ds/parser` (blueprint-driven file import),
  `@fluid-ds/media` (video, audio, animated images, zoomable frames, lightbox),
  and `@fluid-ds/animations` (keyframe animations + event effects).
- **Three layers of theming.** Override a brand-wide token with one rule,
  scope changes to one component type, or isolate a single instance, they
  compose.
- **Accessibility first.** Every published element has automated axe coverage;
  interactive components add keyboard, focus, form, target-size, environment,
  lifecycle, and recovery contracts. The frozen-source stable-depth matrix passes
  765 cases, 255 in each of Chromium, Firefox, and Playwright WebKit. Manual
  assistive-technology and native Safari/mobile review remain separate gates.
- **A real icon set.** 1,500+ [lucide][lucide] icons available as per-icon
  tree-shakable modules, plus a curated default subset and a
  `loadIcon(name)` lazy loader.
- **Lit 3 + TypeScript**: every component is a `LitElement` subclass with
  strict typed properties, decorated reactive state, and a published Custom
  Elements Manifest so consumers (and our own docs) auto-generate API docs.

---

## Quick start

### The fastest path: CDN + HTML

Paste this into a blank `.html` file and open it in your browser. No build
step, no framework, no package manager.

```html
<!doctype html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css"
    />

    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@fluid-ds/icons@latest/dist/register-defaults.js"
    ></script>
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/button/define.js"
    ></script>
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/card/define.js"
    ></script>
  </head>
  <body>
    <fluid-card style="max-width: 24rem; margin: 4rem auto;">
      <h3 slot="header">Welcome to Fluid</h3>
      <p>Drop these tags anywhere, no framework wrapper needed.</p>
      <fluid-button>Get started</fluid-button>
    </fluid-card>
  </body>
</html>
```

> The URLs above use the stable `latest` channel. Pin an exact version in
> production when you need fully repeatable builds.

### With a bundler

```bash
pnpm add @fluid-ds/components@latest @fluid-ds/tokens@latest @fluid-ds/icons@latest
```

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
  <h3 slot="header">Welcome to Fluid</h3>
  <fluid-button>Get started</fluid-button>
</fluid-card>
```

Full installation guide (CDN, bundlers, frameworks):
**[docs → Installation][installation]**.

---

## Theming in one example

Three layers, pick whichever scope you need.

```css
/* 1. Brand-wide: swap the accent across every component */
[data-fluid-brand="custom"] {
  --fluid-color-primary: #6366f1;
}

/* 2. Component-wide: only buttons */
[data-fluid-brand="custom"] {
  --fluid-button-bg: #db2777;
}

/* 3. One specific element (after isolating in the Theme builder) */
[data-fluid-id="primary-cta"] {
  --fluid-button-bg: linear-gradient(to right, #6366f1, #22d3ee);
}
```

See [docs → Theming basics][theming] for the full breakdown.

---

## Packages

| Package                                         | Purpose                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@fluid-ds/components`](./packages/components) | The web components themselves. 103 component families (124 elements), one `/define/<name>` import each so unused components stay shakable.                               |
| [`@fluid-ds/react`](./packages/react)           | Generated React 19 wrappers and raw-tag JSX declarations for all 155 published elements.                                                                                 |
| [`@fluid-ds/tokens`](./packages/tokens)         | Design tokens, primitives, semantics (light + dark), generated CSS files, and a JSON manifest the theme builder consumes.                                                |
| [`@fluid-ds/themes`](./packages/themes)         | Pre-baked brand themes (CSS only, no JS).                                                                                                                                |
| [`@fluid-ds/icons`](./packages/icons)           | Icon registry. Pre-registers a curated lucide subset + exposes `loadIcon(name)` and per-icon modules under `@fluid-ds/icons/lucide/<name>`.                              |
| [`@fluid-ds/charts`](./packages/charts)         | Chart.js wrappers, bar, line, pie, doughnut, scatter, bubble, radar, polar area, sparkline.                                                                              |
| [`@fluid-ds/scheduler`](./packages/scheduler)   | Accessible appointment scheduler, time-slot radiogroup, availability editor + engine.                                                                                    |
| [`@fluid-ds/table`](./packages/table)           | Accessible data grid (sortable, selectable, semantic `<table>`), plus `fluid-infinite-table`: infinite loading, virtual rows, column reorder/resize, persistable layout. |
| [`@fluid-ds/calendar`](./packages/calendar)     | Event calendar (month view of events).                                                                                                                                   |
| [`@fluid-ds/editor`](./packages/editor)         | Lightweight accessible rich-text editor.                                                                                                                                 |
| [`@fluid-ds/kanban`](./packages/kanban)         | Drag-and-drop board with a full keyboard path.                                                                                                                           |
| [`@fluid-ds/node-graph`](./packages/node-graph) | Node graph editor: typed ports, Bezier edges, full keyboard support.                                                                                                     |
| [`@fluid-ds/map`](./packages/map)               | Themed Leaflet map wrapper with markers.                                                                                                                                 |
| [`@fluid-ds/markdown`](./packages/markdown)     | `<fluid-markdown>`, renders Markdown to themed HTML.                                                                                                                     |
| [`@fluid-ds/qr`](./packages/qr)                 | `<fluid-qr-code>`, themable QR codes incl. logo-embedded fancy codes.                                                                                                    |
| [`@fluid-ds/parser`](./packages/parser)         | Blueprint-driven JSON / CSV / Excel file import (`<fluid-file-parser>` / `<fluid-column-mapper>`).                                                                       |
| [`@fluid-ds/media`](./packages/media)           | Video player, video playlist, animated image, zoomable frame, audio player, lightbox gallery.                                                                            |
| [`@fluid-ds/animations`](./packages/animations) | Attribute-driven keyframe animations + an event-effects engine (confetti, fireworks, `<fluid-celebrate>`).                                                               |

---

## Five surfaces

Fluid is documented across five apps that work together:

| Surface                            | What it's for                                                                                                     | Path                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 📚 **Docs site** (Astro Starlight) | First impression, getting started, conceptual guides, recipes, per-component pages with auto-generated API tables | [`apps/docs`](./apps/docs)             |
| 🎨 **Theme builder** (Lit + Vite)  | Live token editor with per-element isolation. Exports brand CSS you drop into your app.                           | [`apps/playground`](./apps/playground) |
| 🔬 **Storybook**                   | Interactive props/states/a11y reference for every component                                                       | [`apps/storybook`](./apps/storybook)   |
| 🧪 **Demos**                       | Sample apps plus the same admin portal built in native HTML, React, Next.js, and Angular                          | [`apps/demos`](./apps/demos)           |
| 📦 **Bundle builder**              | Pick the components you need and generate a custom bundle                                                         | [`apps/wizard`](./apps/wizard)         |

Run them locally with `pnpm dev`, which starts six apps in parallel (these
five plus the landing page).

---

## Development

```bash
# Bootstrap (Node 20+, pnpm 9+)
corepack pnpm install

# Build packages once (icons/tokens need to be on disk for the apps)
pnpm build

# Run all six apps concurrently (landing, Storybook, theme builder, docs, demos, wizard)
pnpm dev

# Run them individually
pnpm storybook
pnpm playground
pnpm docs

# CI gate: types, lint, quality, tests, build, SSR, and docs
pnpm verify
```

`pnpm verify` is the canonical "is the workspace healthy?" command. It runs:

1. `pnpm typecheck`: `tsc --noEmit` across every package and app
2. `pnpm lint`: flat-config ESLint with the Lit a11y plugin
3. `pnpm check:coverage` and `pnpm check:quality`: enforce catalog, maturity,
   unit accessibility, browser accessibility, visual, and SSR inventory
4. `pnpm check:tokens`: verifies generated token artifacts
5. `pnpm test`: `@web/test-runner` + Playwright, 1,000+ component tests
6. `pnpm build`, `pnpm check:ssr`, and `pnpm check:docs`: verify packages,
   server rendering, hydration prerequisites, and documentation output

See **[`docs/HANDOFF.md`](./docs/HANDOFF.md)** for the cross-device session
notebook that tracks where the last work session left off.

---

## Architecture conventions

These are the rules that keep the codebase coherent. Most are enforced by
`pnpm verify`; the rest are habits we lean on.

- **Component-scoped tokens**: every styled component declares its own
  `--fluid-{tag}-{role}` CSS custom properties that default to semantic
  tokens. Designers can override per-component or fall back to the global
  semantic. See [`docs/component-token-convention.md`](./docs/component-token-convention.md).
- **Custom Elements Manifest** drives the docs API tables. New component
  tokens get annotated with `@cssproperty` and semantic dependencies with
  `@uses-token` in JSDoc; the analyzer extracts them.
- **Side-effect-free imports**: `@fluid-ds/components` exports classes but
  importing the root **does not** register custom elements. Use
  `@fluid-ds/components/define/<name>` for registration so unused components
  stay shakable.
- **Coverage check** (`pnpm check:coverage`) enforces that every component
  has both a `*.stories.ts` next to its source and a card in the theme
  builder, or is on the exempt list (internal sub-components, or non-visual
  helpers like format-bytes whose home is the docs site).

---

## Contributing

Issues, ideas, and PRs are welcome, especially component coverage gaps,
accessibility findings, and theming edge cases.

For local setup, see the **Development** section above. The `HANDOFF.md`
file is the source of truth for "what's queued next."

---

## Links

- **npm:** [`@fluid-ds/components`][npm] and the rest of the `@fluid-ds/*` scope.
- **Source:** [github.com/RHeijnen/fluid_ds](https://github.com/RHeijnen/fluid_ds)
- **Author:** [René Heijnen — rheijnen.github.io][portfolio]
- **Website:** [fluid-web.dev](https://fluid-web.dev) — docs + theme builder +
  Storybook + demos, one deploy.

---

## License

MIT © [René Heijnen][portfolio]

[owc]: https://open-wc.org/
[lucide]: https://lucide.dev/
[npm]: https://www.npmjs.com/package/@fluid-ds/components
[portfolio]: https://rheijnen.github.io
[installation]: ./apps/docs/src/content/docs/getting-started/installation.mdx
[theming]: ./apps/docs/src/content/docs/theming/basics.mdx
