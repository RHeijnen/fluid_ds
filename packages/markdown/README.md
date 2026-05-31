# @fluid-ds/markdown

Themable Markdown rendering web component for
[Fluid](https://github.com/RHeijnen/fluid_ds), backed by
[marked](https://marked.js.org/). Expansion pack.

```html
<fluid-markdown>
  ### Hello

  This is **markdown** with [links](https://example.com).
</fluid-markdown>
```

## Install

```bash
pnpm add @fluid-ds/markdown
```

```ts
import "@fluid-ds/markdown/define";
```

## Use

Three ways to supply content:

```html
<!-- Inline text -->
<fluid-markdown>### Inline</fluid-markdown>

<!-- value property -->
<fluid-markdown value="### From a property"></fluid-markdown>

<!-- Remote URL -->
<fluid-markdown src="/CHANGELOG.md"></fluid-markdown>
```

The rendered output respects the Fluid tokens, headings, code, links,
blockquotes, and tables all adopt your brand colors. Override the
component tokens to restyle:

```css
[data-fluid-brand="custom"] {
  --fluid-markdown-link-fg: var(--fluid-color-primary);
  --fluid-markdown-code-bg: var(--fluid-surface-muted);
}
```

## License

[MIT](./LICENSE), © Fluid contributors. marked is MIT-licensed.
