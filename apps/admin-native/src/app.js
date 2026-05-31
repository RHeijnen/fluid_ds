// Registers every Fluid element the portal uses, loaded from the CDN via the
// import map in index.html. Plain ESM, no framework, no app bundler.
import "./register.js";
import { PAGES } from "./pages.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "users", label: "Users", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" }
];

const FLUID_LOGO = `
  <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
    <defs>
      <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3b82f6"></stop><stop offset="1" stop-color="#22d3ee"></stop>
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
  </svg>`;

function currentRoute() {
  const id = (location.hash.replace(/^#\/?/, "") || "dashboard").toLowerCase();
  return PAGES[id] ? id : "dashboard";
}

const root = document.getElementById("app");

root.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#/dashboard">${FLUID_LOGO}<span>Fluid Admin</span></a>
      <nav class="nav" aria-label="Primary">
        ${NAV.map(
          (n) => `<a class="nav-link" href="#/${n.id}" data-route="${n.id}">
            <fluid-icon name="${n.icon}"></fluid-icon><span>${n.label}</span></a>`
        ).join("")}
      </nav>
      <div class="sidebar-foot muted">Native HTML · no framework</div>
    </aside>

    <div class="main-col">
      <header class="topbar">
        <div class="crumbs"><fluid-breadcrumb><fluid-breadcrumb-item>Fluid</fluid-breadcrumb-item><fluid-breadcrumb-item id="crumb-page">Dashboard</fluid-breadcrumb-item></fluid-breadcrumb></div>
        <div class="topbar-actions">
          <fluid-select id="brand" value="default" size="sm" aria-label="Brand theme" style="width:9rem;">
            <fluid-option value="default">Default</fluid-option>
            <fluid-option value="midnight">Midnight</fluid-option>
            <fluid-option value="corporate">Corporate</fluid-option>
          </fluid-select>
          <fluid-tooltip content="Toggle light / dark">
            <fluid-button id="theme" variant="ghost" size="sm" aria-label="Toggle theme">
              <fluid-icon name="sun-moon"></fluid-icon>
            </fluid-button>
          </fluid-tooltip>
          <fluid-avatar size="sm" label="Ada Lovelace"></fluid-avatar>
        </div>
      </header>
      <main id="view" class="view"></main>
    </div>
  </div>
  <fluid-toast id="app-toast" placement="bottom-end"></fluid-toast>
`;

const view = root.querySelector("#view");
const crumb = root.querySelector("#crumb-page");

function render() {
  const id = currentRoute();
  const page = PAGES[id];
  view.innerHTML = page.html;
  crumb.textContent = page.title;
  root.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === id);
    if (a.dataset.route === id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  page.mount(view);
  view.scrollTo?.(0, 0);
}

root.querySelector("#theme").addEventListener("click", () => {
  const el = document.documentElement;
  el.setAttribute(
    "data-fluid-theme",
    el.getAttribute("data-fluid-theme") === "dark" ? "light" : "dark"
  );
});

// Brand presets: light/dark is the scheme, brand retunes the accent track. The
// brand stylesheets are already loaded; we just flip the attribute on <html>.
root.querySelector("#brand").addEventListener("fluid-change", (e) => {
  const value = e.detail?.value;
  const el = document.documentElement;
  if (!value || value === "default") el.removeAttribute("data-fluid-brand");
  else el.setAttribute("data-fluid-brand", value);
});

window.addEventListener("hashchange", render);
if (!location.hash) location.replace("#/dashboard");
render();
root.removeAttribute("aria-busy");
