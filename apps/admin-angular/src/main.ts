// Register Fluid (icons + component/chart defines) before the app bootstraps,
// then start Angular. Token + brand-theme CSS is loaded via angular.json
// "styles". This is the only Fluid-specific wiring an app needs.
import "./register-fluid";

import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withHashLocation } from "@angular/router";
import { AppComponent } from "./app.component";
import { routes } from "./app.routes";

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withHashLocation())]
}).catch((err) => console.error(err));
