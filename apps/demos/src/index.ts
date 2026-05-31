import "./shared/register-fluid.js";
import { mountShell } from "./shared/shell.js";
import { mountDesignOverlay } from "./shared/design-overlay.js";

const main = mountShell({ title: "Demos", currentRoute: "index" });
mountDesignOverlay();

main.innerHTML = `
  <h1 style="margin-top:0;">Fluid · Demos</h1>
  <p style="color: var(--fluid-text-secondary); max-width: 36rem;">
    End-to-end demos showing Fluid in real-feeling app shapes.
    Open one, switch the brand in the top-right header, and watch every
    component re-theme together.
  </p>

  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; margin-top: 1.5rem;">
    <fluid-card>
      <h3 slot="header" style="margin: 0;">Settings dashboard</h3>
      <p>SaaS-style settings page. Profile, notifications, billing chart, form fields, save / cancel footer.</p>
      <div slot="footer">
        <a href="./settings/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>

    <fluid-card>
      <h3 slot="header" style="margin: 0;">Admin / data</h3>
      <p>Table-style admin: filter bar, data rows, bulk action dropdown, confirm-delete dialog, status badges.</p>
      <div slot="footer">
        <a href="./admin/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>
  </div>

  <h2 style="margin-top: 2.5rem;">Framework integration portals</h2>
  <p style="color: var(--fluid-text-secondary); max-width: 38rem;">
    The same admin portal, built four ways. Each consumes the very same
    Fluid web components, charts, and tokens — only the host framework
    differs. Open any two side by side: they're pixel-for-pixel the same.
  </p>

  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; margin-top: 1.5rem;">
    <fluid-card>
      <h3 slot="header" style="margin: 0;">Native HTML</h3>
      <p>Zero build step. Loaded with an import map (CDN-swappable) over plain ES modules and hash routing.</p>
      <div slot="footer">
        <a href="./native/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>

    <fluid-card>
      <h3 slot="header" style="margin: 0;">React</h3>
      <p>React 19 + Vite. Custom-element props via refs, events via native handlers, charts wrapped as components.</p>
      <div slot="footer">
        <a href="./react/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>

    <fluid-card>
      <h3 slot="header" style="margin: 0;">Next.js</h3>
      <p>Next.js 15 App Router. SSR-safe: the server emits HTML, the client registers the elements. Statically exported.</p>
      <div slot="footer">
        <a href="./next/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>

    <fluid-card>
      <h3 slot="header" style="margin: 0;">Angular</h3>
      <p>Angular 20 standalone with CUSTOM_ELEMENTS_SCHEMA and [prop] / (event) bindings to the custom elements.</p>
      <div slot="footer">
        <a href="./angular/" style="text-decoration: none;">
          <fluid-button>Open</fluid-button>
        </a>
      </div>
    </fluid-card>
  </div>

  <p style="margin-top: 2rem; color: var(--fluid-text-secondary); font-size: 0.95rem;">
    Looking for the marketing landing page? That's now the
    <a href="../" style="color: var(--fluid-color-primary);">site root</a>:
    it's the real homepage for the whole project.
  </p>
`;
