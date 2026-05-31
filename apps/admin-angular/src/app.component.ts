import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { filter } from "rxjs/operators";
import { LogoComponent } from "./logo.component";
import { eventValue } from "./lib";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { path: "/", label: "Dashboard", icon: "layout-dashboard" },
  { path: "/users", label: "Users", icon: "users" },
  { path: "/settings", label: "Settings", icon: "settings" }
];

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a routerLink="/" class="brand">
          <app-logo />
          <span>Fluid Admin</span>
        </a>
        <nav class="nav" aria-label="Primary">
          @for (n of nav; track n.path) {
            <a
              [routerLink]="n.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: n.path === '/' }"
              class="nav-link"
            >
              <fluid-icon [attr.name]="n.icon"></fluid-icon>
              <span>{{ n.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-foot muted">Angular 20 · standalone</div>
      </aside>

      <div class="main-col">
        <header class="topbar">
          <div class="crumbs">
            <fluid-breadcrumb>
              <fluid-breadcrumb-item>Fluid</fluid-breadcrumb-item>
              <fluid-breadcrumb-item>{{ title() }}</fluid-breadcrumb-item>
            </fluid-breadcrumb>
          </div>
          <div class="topbar-actions">
            <fluid-select
              value="default"
              size="sm"
              aria-label="Brand theme"
              style="width: 9rem"
              (fluid-change)="onBrand($event)"
            >
              <fluid-option value="default">Default</fluid-option>
              <fluid-option value="midnight">Midnight</fluid-option>
              <fluid-option value="corporate">Corporate</fluid-option>
            </fluid-select>
            <fluid-tooltip content="Toggle light / dark">
              <fluid-button variant="ghost" size="sm" aria-label="Toggle theme" (click)="toggleTheme()">
                <fluid-icon name="sun-moon"></fluid-icon>
              </fluid-button>
            </fluid-tooltip>
            <fluid-avatar size="sm" label="Ada Lovelace"></fluid-avatar>
          </div>
        </header>

        <main class="view">
          <router-outlet></router-outlet>
        </main>
      </div>

      <fluid-toast id="app-toast" placement="bottom-end"></fluid-toast>
    </div>
  `
})
export class AppComponent {
  readonly nav = NAV;
  readonly title = signal<string>("Dashboard");

  constructor(private readonly router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split("?")[0] || "/";
        this.title.set(NAV.find((n) => n.path === path)?.label ?? "Dashboard");
      });
  }

  toggleTheme(): void {
    const el = document.documentElement;
    el.setAttribute(
      "data-fluid-theme",
      el.getAttribute("data-fluid-theme") === "dark" ? "light" : "dark"
    );
  }

  // Brand picker -> data-fluid-brand on <html> (light/dark stays the scheme).
  onBrand(e: Event): void {
    const value = eventValue(e);
    const el = document.documentElement;
    if (!value || value === "default") el.removeAttribute("data-fluid-brand");
    else el.setAttribute("data-fluid-brand", value);
  }
}
