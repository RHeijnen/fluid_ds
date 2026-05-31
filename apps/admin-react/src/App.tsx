import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Logo, useFluidEvent } from "./lib";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";

const NAV = [
  { to: "/", label: "Dashboard", icon: "layout-dashboard", end: true },
  { to: "/users", label: "Users", icon: "users", end: false },
  { to: "/settings", label: "Settings", icon: "settings", end: false }
];

function Shell() {
  const loc = useLocation();
  const title = NAV.find((n) => n.to === loc.pathname)?.label ?? "Dashboard";

  const toggleTheme = () => {
    const el = document.documentElement;
    el.setAttribute("data-fluid-theme", el.getAttribute("data-fluid-theme") === "dark" ? "light" : "dark");
  };

  // Brand picker → data-fluid-brand on <html> (light/dark stays the scheme).
  const brandRef = useFluidEvent<HTMLElement>("fluid-change", (e) => {
    const value = String((e.detail as { value?: string })?.value ?? "");
    const el = document.documentElement;
    if (!value || value === "default") el.removeAttribute("data-fluid-brand");
    else el.setAttribute("data-fluid-brand", value);
  });

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <Logo />
          <span>Fluid Admin</span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              <fluid-icon name={n.icon} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot muted">React 19 · Vite</div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="crumbs">
            <fluid-breadcrumb>
              <fluid-breadcrumb-item>Fluid</fluid-breadcrumb-item>
              <fluid-breadcrumb-item>{title}</fluid-breadcrumb-item>
            </fluid-breadcrumb>
          </div>
          <div className="topbar-actions">
            <fluid-select ref={brandRef} value="default" size="sm" aria-label="Brand theme" style={{ width: "9rem" }}>
              <fluid-option value="default">Default</fluid-option>
              <fluid-option value="midnight">Midnight</fluid-option>
              <fluid-option value="corporate">Corporate</fluid-option>
            </fluid-select>
            <fluid-tooltip content="Toggle light / dark">
              <fluid-button variant="ghost" size="sm" aria-label="Toggle theme" onClick={toggleTheme}>
                <fluid-icon name="sun-moon" />
              </fluid-button>
            </fluid-tooltip>
            <fluid-avatar size="sm" label="Ada Lovelace" />
          </div>
        </header>

        <main className="view">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      <fluid-toast id="app-toast" placement="bottom-end"></fluid-toast>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
