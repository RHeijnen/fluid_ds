// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { fluidCodeBlockTransformer } from "./src/lib/fluid-code-shiki.mjs";

/**
 * Docs site for Fluid, built on Astro Starlight.
 *
 * Three architecture choices worth knowing about:
 *
 * 1. **Sidebar is hand-curated** (not auto-generated from filesystem). The
 *    component count is ~50 across a few categories, and the order matters
 *    for getting-started flow, so explicit `items` here are clearer than
 *    relying on file order.
 * 2. **Component web components register globally** via
 *    `src/scripts/register-fluid.ts` injected into every page's <head>.
 *    Starlight pages are static HTML, so a single side-effect import at
 *    the top of every page boots the registry.
 * 3. **CSS theming layers Fluid tokens on top of Starlight's design
 *    tokens** through `src/styles/custom.css` so the site uses the
 *    same palette + fonts as the components it documents, a
 *    self-dogfooding test that the tokens look good outside the
 *    playground.
 */
/**
 * `DOCS_BASE` lets the unified website build mount the docs site at a
 * sub-path (`/docs/`). For local dev it stays at the root. Starlight
 * automatically prefixes every internal link with this base, so
 * `/getting-started/installation/` becomes `/docs/getting-started/...`
 * in the production bundle.
 */
const base = process.env.DOCS_BASE ?? "/";

export default defineConfig({
  base,
  // Disable Expressive Code (in the Starlight block) so Astro's built-in
  // Shiki highlights fenced blocks, then a transformer wraps each highlighted
  // <pre> in our own <fluid-code-block>, the docs dogfood the component.
  // Dual theme + defaultColor:"light" emits a --shiki-dark var per token;
  // custom.css flips it under [data-theme="dark"].
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light",
      transformers: [fluidCodeBlockTransformer()]
    }
  },
  integrations: [
    starlight({
      title: "Fluid",
      // Turn off Starlight's Expressive Code code blocks; we render our own.
      expressiveCode: false,
      description: "Framework-agnostic web-component design system.",
      favicon: "/favicon.svg",
      logo: {
        src: "./src/assets/wordmark.svg",
        // The wordmark already spells out "Fluid"; without this the
        // site title renders a second "Fluid" next to it.
        replacesTitle: true
      },
      social: {
        github: "https://github.com/RHeijnen/fluid_ds"
      },
      customCss: ["./src/styles/custom.css"],
      components: {
        // Custom <Head> wraps Starlight's default and adds a single
        // <script> block where every Fluid component define-module is
        // imported. Astro processes the script and emits a bundled,
        // code-split module per page.
        Head: "./src/components/Head.astro",
        // Custom <SocialIcons> wraps the default and prepends a brand
        // preset picker (default / midnight / corporate) so the docs
        // dogfood the same theming model the components ship.
        SocialIcons: "./src/components/SocialIcons.astro"
      },
      sidebar: [
        {
          label: "🚀 Getting started",
          items: [
            { label: "Overview", link: "/" },
            { label: "Installation", link: "/getting-started/installation/" },
            { label: "First component", link: "/getting-started/first-component/" },
            { label: "CDN reference", link: "/getting-started/cdn/" },
            { label: "Framework integrations", link: "/guides/frameworks/" },
            { label: "Theming basics", link: "/theming/basics/" }
          ]
        },
        {
          label: "📦 Concepts",
          items: [
            { label: "Web components", link: "/concepts/web-components/" },
            { label: "Slots & shadow DOM", link: "/concepts/slots-and-shadow-dom/" },
            { label: "Build your own", link: "/concepts/build-your-own/" }
          ]
        },
        {
          label: "🎨 Theming",
          items: [
            { label: "Brand attribute", link: "/theming/brand/" },
            { label: "Semantic vs component tokens", link: "/theming/tokens/" },
            { label: "Per-element overrides", link: "/theming/per-element/" },
            { label: "Dark mode", link: "/theming/dark-mode/" }
          ]
        },
        {
          label: "✏️ Inputs & forms",
          items: [
            { label: "Button", link: "/components/button/" },
            { label: "Button group", link: "/components/button-group/" },
            { label: "Input", link: "/components/input/" },
            { label: "Number input", link: "/components/number-input/" },
            { label: "Textarea", link: "/components/textarea/" },
            { label: "Switch", link: "/components/switch/" },
            { label: "Checkbox", link: "/components/checkbox/" },
            { label: "Radio", link: "/components/radio/" },
            { label: "Select", link: "/components/select/" },
            { label: "Typeahead", link: "/components/typeahead/" },
            { label: "Slider", link: "/components/slider/" },
            { label: "Color picker", link: "/components/color-picker/" },
            { label: "Rating", link: "/components/rating/" },
            { label: "File input", link: "/components/file-input/" }
          ]
        },
        {
          label: "🧱 Layout",
          items: [
            { label: "Page", link: "/components/page/" },
            { label: "Grid", link: "/components/grid/" },
            { label: "Mosaic", link: "/components/mosaic/" },
            { label: "Stack", link: "/components/stack/" },
            { label: "Card", link: "/components/card/" },
            { label: "Split panel", link: "/components/split-panel/" },
            { label: "Scroller", link: "/components/scroller/" },
            { label: "Divider", link: "/components/divider/" },
            { label: "Carousel", link: "/components/carousel/" }
          ]
        },
        {
          label: "💬 Feedback",
          items: [
            { label: "Toast", link: "/components/toast/" },
            { label: "Dialog", link: "/components/dialog/" },
            { label: "Drawer", link: "/components/drawer/" },
            { label: "Callout", link: "/components/callout/" },
            { label: "Tooltip", link: "/components/tooltip/" },
            { label: "Progress bar", link: "/components/progress-bar/" },
            { label: "Progress ring", link: "/components/progress-ring/" },
            { label: "Spinner", link: "/components/spinner/" },
            { label: "Skeleton", link: "/components/skeleton/" }
          ]
        },
        {
          label: "🧭 Navigation",
          items: [
            { label: "Tabs", link: "/components/tabs/" },
            { label: "Breadcrumb", link: "/components/breadcrumb/" },
            { label: "Tree", link: "/components/tree/" },
            { label: "Dropdown", link: "/components/dropdown/" },
            { label: "Popover", link: "/components/popover/" },
            { label: "Popup", link: "/components/popup/" },
            { label: "Accordion", link: "/components/accordion/" },
            { label: "Segmented control", link: "/components/segmented-control/" },
            { label: "Steps", link: "/components/steps/" }
          ]
        },
        {
          label: "🔖 Content",
          items: [
            { label: "Avatar", link: "/components/avatar/" },
            { label: "Badge", link: "/components/badge/" },
            { label: "Tag", link: "/components/tag/" },
            { label: "Icon", link: "/components/icon/" },
            { label: "Copy button", link: "/components/copy-button/" },
            { label: "Code block", link: "/components/code-block/" },
            { label: "Comparison", link: "/components/comparison/" },
            { label: "Include", link: "/components/include/" }
          ]
        },
        {
          label: "⚙️ Utilities & motion",
          items: [
            { label: "Animation", link: "/components/animation/" },
            { label: "Format bytes", link: "/components/format-bytes/" },
            { label: "Format number", link: "/components/format-number/" },
            { label: "Format date", link: "/components/format-date/" },
            { label: "Relative time", link: "/components/relative-time/" },
            { label: "Mutation observer", link: "/components/mutation-observer/" },
            { label: "Resize observer", link: "/components/resize-observer/" },
            { label: "Intersection observer", link: "/components/intersection-observer/" }
          ]
        },
        {
          label: "📦 Expansion packs",
          items: [
            { label: "@fluid-ds/charts", link: "/expansion/charts/" },
            { label: "@fluid-ds/markdown", link: "/expansion/markdown/" },
            { label: "@fluid-ds/qr", link: "/expansion/qr/" },
            { label: "@fluid-ds/media", link: "/expansion/media/" }
          ]
        },
        {
          label: "📚 Guides",
          items: [
            { label: "Forms", link: "/guides/forms/" },
            { label: "Accessibility model", link: "/guides/accessibility/" },
            { label: "Animations", link: "/guides/animations/" },
            { label: "Framework wrappers", link: "/guides/frameworks/" },
            { label: "SSR", link: "/guides/ssr/" }
          ]
        }
      ]
    })
  ]
});
