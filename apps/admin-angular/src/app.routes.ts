import { Routes } from "@angular/router";
import { DashboardComponent } from "./pages/dashboard.component";
import { UsersComponent } from "./pages/users.component";
import { SettingsComponent } from "./pages/settings.component";

export const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "users", component: UsersComponent },
  { path: "settings", component: SettingsComponent },
  { path: "**", redirectTo: "" }
];
