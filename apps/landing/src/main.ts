/**
 * Landing page entry. Builds the marketing page that lives at the root
 * of the unified website (`/`), with links into the four sub-surfaces
 * (docs, storybook, playground, demos).
 *
 * The page is intentionally innerHTML-driven, no framework, no
 * reactivity. Fluid components do the heavy lifting; everything
 * else is plain semantic HTML the browser styles via `styles.css`.
 *
 * The before/after comparison strip is the marketing centrepiece:
 * the same sign-in form rendered twice, once with raw `<input>` /
 * `<button>` (Times New Roman, browser defaults) and once with
 * `<fluid-input>` / `<fluid-button>` / `<fluid-switch>` (Fluid tokens).
 * Drag the divider to flip between them.
 */
import "./register-fluid.js";

const root = document.body;

root.innerHTML = `
  <!-- ====================================================== -->
  <!-- Top navigation -->
  <header class="site-nav">
    <a class="brand" href="/">
      <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#3b82f6"></stop>
            <stop offset="1" stop-color="#22d3ee"></stop>
          </linearGradient>
          <clipPath id="fluidLogoClip"><rect width="96" height="96" rx="22"></rect></clipPath>
        </defs>
        <g clip-path="url(#fluidLogoClip)">
          <rect width="96" height="96" fill="url(#fluidLogoGrad)"></rect>
          <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
            <path d="M-6,40 C12,30 26,50 44,40 S72,30 102,40" opacity="0.95"></path>
            <path d="M-6,58 C12,48 26,68 44,58 S72,48 102,58" opacity="0.65"></path>
            <path d="M-6,76 C12,66 26,86 44,76 S72,66 102,76" opacity="0.35"></path>
          </g>
        </g>
      </svg>
      <span>Fluid</span>
    </a>
    <nav class="primary" aria-label="Primary">
      <a href="/docs/">Docs</a>
      <a href="/storybook/">Storybook</a>
      <a href="/playground/">Theme builder</a>
      <a href="/demos/">Demos</a>
      <a class="cta" href="https://github.com/RHeijnen/fluid_ds" target="_blank" rel="noopener">
        <fluid-button size="sm" variant="secondary">
          GitHub
          <fluid-icon slot="suffix" name="external-link"></fluid-icon>
        </fluid-button>
      </a>
    </nav>
  </header>

  <!-- ====================================================== -->
  <!-- Hero -->
  <section class="hero">
    <fluid-badge variant="info">v0.1 alpha · public preview</fluid-badge>
    <h1>
      Build it once.<br />
      <span class="accent">Drop it anywhere.</span>
    </h1>
    <p class="lead">
      Standard web components that work in every framework, and every page that
      doesn't have one. Themable, accessible, and built on the platform you
      already trust.
    </p>
    <div class="hero-actions">
      <a href="/docs/" style="text-decoration: none;">
        <fluid-button>
          Get started
          <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
        </fluid-button>
      </a>
      <a href="/playground/" style="text-decoration: none;">
        <fluid-button variant="secondary">
          Try the theme builder
          <fluid-icon slot="suffix" name="arrow-right"></fluid-icon>
        </fluid-button>
      </a>
    </div>
  </section>

  <!-- ====================================================== -->
  <!-- Feature grid -->
  <section class="row">
    <h2>Drop in, look right, ship</h2>
    <p class="subhead">
      Four properties make Fluid different from every other component library
      you've considered this quarter.
    </p>
    <div class="feature-grid">
      ${[
        [
          "link",
          "No framework needed",
          "Tags work in any HTML page. Drop in via a CDN script tag or your bundler, same result."
        ],
        [
          "settings",
          "Theme with one variable",
          "A small palette of semantic tokens drives every component. Override one, retheme everything."
        ],
        [
          "circle-check",
          "Accessible by default",
          "Each component ships with the right ARIA pattern, keyboard support, and audited tests."
        ],
        [
          "star",
          "Lean by design",
          "Core stays small. Charts, markdown, media, QR codes live in opt-in packages."
        ]
      ]
        .map(
          ([icon, title, body]) => `
        <fluid-card variant="outline">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--fluid-color-primary);">
            <fluid-icon name="${icon}" style="--fluid-icon-size: 1.5rem;"></fluid-icon>
            <strong>${title}</strong>
          </div>
          <p style="margin: 0; color: var(--fluid-text-secondary);">${body}</p>
        </fluid-card>
      `
        )
        .join("")}
    </div>
  </section>

  <!-- ====================================================== -->
  <!-- Before / after comparison -->
  <section class="row">
    <h2>What theming gets you</h2>
    <p class="subhead">
      Same form. Same DOM. Drag the divider to see the difference between raw
      browser defaults and Fluid components.
    </p>

    <fluid-comparison style="border-radius: 0.75rem; overflow: hidden; border: 1px solid var(--fluid-border-default);">
      <!-- BEFORE: raw HTML elements, no Fluid components. The
           Times-New-Roman + light gray styling lives in styles.css. -->
      <div slot="before" class="compare-pane before">
        <span class="pane-label">Before</span>
        <div class="label-rough">Sign in to your account</div>
        <div>
          <label for="cmp-email-raw">Email address</label>
          <input id="cmp-email-raw" type="email" placeholder="you@example.com" style="width: 100%; padding: 4px 6px;" />
        </div>
        <div>
          <label for="cmp-pass-raw">Password</label>
          <input id="cmp-pass-raw" type="password" placeholder="••••••••" style="width: 100%; padding: 4px 6px;" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <input id="cmp-remember-raw" type="checkbox" />
          <label for="cmp-remember-raw">Remember me</label>
        </div>
        <button type="button" style="margin-top: 0.25rem; padding: 4px 10px;">Sign in</button>
        <div style="margin-top: auto; font-size: 0.8rem;">
          <a href="#" style="color: #1d4ed8;">Forgot password?</a>
        </div>
      </div>

      <!-- AFTER: same form, Fluid components. -->
      <div slot="after" class="compare-pane after">
        <span class="pane-label">After</span>
        <strong style="font-size: 1.05rem;">Sign in to your account</strong>
        <fluid-input label="Email address" type="email" placeholder="you@example.com"></fluid-input>
        <fluid-input label="Password" type="password" placeholder="••••••••"></fluid-input>
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
          <fluid-switch></fluid-switch>
          Remember me
        </label>
        <fluid-button style="margin-top: 0.25rem;">Sign in</fluid-button>
        <div class="compare-tag-row" style="margin-top: auto;">
          <fluid-tag size="sm">accessible</fluid-tag>
          <fluid-tag size="sm" variant="primary">themable</fluid-tag>
        </div>
      </div>
    </fluid-comparison>
  </section>

  <!-- ====================================================== -->
  <!-- Five-line setup -->
  <section class="row">
    <h2>Five-line setup</h2>
    <p class="subhead">
      Paste into any HTML page. That's the entire happy path, no bundler
      required.
    </p>
    <fluid-code-block language="html" code='<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/base.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fluid-ds/tokens@latest/dist/light.css" />

<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/icons@latest/dist/register-defaults.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@fluid-ds/components@latest/dist/components/button/define.js"></script>

<fluid-button>Hello, Fluid</fluid-button>'></fluid-code-block>
  </section>

  <!-- ====================================================== -->
  <!-- Themable callout -->
  <section class="row">
    <fluid-callout variant="info">
      <span slot="header">Switch the brand without recompiling</span>
      Every component on this page reads from a small palette of CSS variables.
      Set <code>data-fluid-brand="midnight"</code> on <code>&lt;html&gt;</code>
      and the whole page re-themes, buttons, inputs, focus rings, the
      comparison slider divider, everything. That's the entire theming model.
    </fluid-callout>
  </section>

  <!-- ====================================================== -->
  <!-- CTA -->
  <section class="row" style="text-align: center;">
    <h2>Ready to try it?</h2>
    <p class="subhead">
      Browse the docs, poke at the theme builder, or jump into Storybook to see
      every variant.
    </p>
    <fluid-button-group>
      <a href="/docs/" style="text-decoration: none;">
        <fluid-button>Docs</fluid-button>
      </a>
      <a href="/storybook/" style="text-decoration: none;">
        <fluid-button variant="secondary">Storybook</fluid-button>
      </a>
      <a href="/playground/" style="text-decoration: none;">
        <fluid-button variant="secondary">Theme builder</fluid-button>
      </a>
      <a href="/demos/" style="text-decoration: none;">
        <fluid-button variant="secondary">Demos</fluid-button>
      </a>
    </fluid-button-group>
  </section>

  <!-- ====================================================== -->
  <!-- Footer -->
  <footer class="site-footer">
    Fluid is open source, MIT-licensed, and built on standard web platform APIs.
    <br />
    <a href="https://github.com/RHeijnen/fluid_ds" target="_blank" rel="noopener">View source on GitHub</a>
    &middot;
    <a href="/docs/">Read the docs</a>
  </footer>
`;
