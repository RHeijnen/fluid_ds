"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, useFluidEvent } from "./lib";

const NAV = [
  { href: "/", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/settings", label: "Settings", icon: "settings" }
];

export function Shell({ children }: { children: ReactNode }) {
  // SSR-safe registration: the define modules touch customElements/window, so
  // we import them only in the browser, after mount. The server already sent the
  // <fluid-*> tags + token CSS; the elements upgrade once this resolves.
  useEffect(() => {
    void import("./register-fluid");
  }, []);

  const path = usePathname();
  const title = NAV.find((n) => n.href === path)?.label ?? "Dashboard";

  const toggleTheme = () => {
    const el = document.documentElement;
    el.setAttribute("data-fluid-theme", el.getAttribute("data-fluid-theme") === "dark" ? "light" : "dark");
  };

  const brandRef = useFluidEvent<HTMLElement>("fluid-change", (e) => {
    const value = String((e.detail as { value?: string })?.value ?? "");
    const el = document.documentElement;
    if (!value || value === "default") el.removeAttribute("data-fluid-brand");
    else el.setAttribute("data-fluid-brand", value);
  });

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Logo />
          <span>Fluid Admin</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link${n.href === path ? " active" : ""}`}
              aria-current={n.href === path ? "page" : undefined}
            >
              <fluid-icon name={n.icon} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot muted">Next.js · App Router</div>
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

        <main className="view">{children}</main>
      </div>

      <fluid-toast id="app-toast" placement="bottom-end"></fluid-toast>
    </div>
  );
}
