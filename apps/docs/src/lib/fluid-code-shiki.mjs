/**
 * Shiki transformer that wraps every highlighted code block in our own
 * `<fluid-code-block>` component, so the docs portal dogfoods the design
 * system instead of rendering Astro/Starlight's stock code frames.
 *
 * How it fits together:
 *   - Expressive Code is disabled (see astro.config.mjs), so Astro falls back
 *     to its built-in Shiki highlighter for fenced code blocks.
 *   - Shiki emits a `<pre class="astro-code"><code>…tokens…</code></pre>` tree.
 *   - This transformer's `root` hook runs once per block: it tags that `<pre>`
 *     as the component's `highlighted` slot and nests it inside a
 *     `<fluid-code-block>` element, forwarding the language and the fence
 *     `title="…"` (filename) as attributes.
 *   - On the client, `<fluid-code-block>` upgrades and paints the header bar +
 *     copy button around the already-rendered, highlighted `<pre>`. The copy
 *     button reads the block's text content, so no raw-code attribute (and its
 *     escaping headaches) is needed.
 *
 * Dual-theme: the highlighter is configured with light + dark themes and
 * `defaultColor: "light"`, so each token carries a `--shiki-dark` CSS var.
 * `custom.css` flips the color under `[data-theme="dark"]`. The component
 * strips the `<pre>` background so only token colors come through and our
 * surface tokens own the frame.
 */
export function fluidCodeBlockTransformer() {
  return {
    name: "fluid-code-block-wrap",
    root(root) {
      const pre = root.children.find(
        (node) => node.type === "element" && node.tagName === "pre"
      );
      if (!pre) return;

      const lang = this.options?.lang;
      const rawMeta = this.options?.meta?.__raw ?? "";
      const titleMatch = /(?:title|filename)="([^"]*)"/.exec(rawMeta);

      pre.properties = pre.properties || {};
      pre.properties.slot = "highlighted";

      const properties = {};
      if (lang && lang !== "plaintext" && lang !== "text") {
        properties.language = lang;
      }
      if (titleMatch) {
        properties.filename = titleMatch[1];
      }

      root.children = [
        {
          type: "element",
          tagName: "fluid-code-block",
          properties,
          children: [pre]
        }
      ];
    }
  };
}
