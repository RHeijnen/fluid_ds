import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { STATS } from "../data";

const signups = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [{ label: "Signups", data: [320, 410, 380, 520, 610, 740], tension: 0.4, fill: true }]
};
const plans = {
  labels: ["Free", "Pro", "Enterprise"],
  datasets: [{ data: [62, 28, 10] }]
};

@Component({
  selector: "app-dashboard",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="cards">
      @for (s of stats; track s.label) {
        <fluid-card class="stat">
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-value">{{ s.value }}</span>
          <fluid-badge [attr.variant]="s.tone">{{ s.delta }}</fluid-badge>
        </fluid-card>
      }
    </section>

    <div class="grid-2">
      <fluid-card class="chart-card">
        <h3 slot="header">Signups · last 6 months</h3>
        <fluid-line-chart
          [data]="signups"
          [options]="lineOptions"
          [style.--fluid-chart-height.px]="260"
        ></fluid-line-chart>
      </fluid-card>
      <fluid-card class="chart-card">
        <h3 slot="header">Plan mix</h3>
        <fluid-doughnut-chart
          [data]="plans"
          [style.--fluid-chart-height.px]="260"
        ></fluid-doughnut-chart>
      </fluid-card>
    </div>

    <div class="grid-2">
      <fluid-card>
        <h3 slot="header">Onboarding</h3>
        <fluid-steps variant="chip" [current]="2" aria-label="Onboarding progress">
          <fluid-step>Create workspace</fluid-step>
          <fluid-step>Invite team</fluid-step>
          <fluid-step>Connect billing</fluid-step>
          <fluid-step>Go live</fluid-step>
        </fluid-steps>
        <p class="muted" style="margin: 1rem 0 0">Two steps left to finish setup.</p>
      </fluid-card>

      <fluid-card>
        <h3 slot="header">Storage</h3>
        <div class="usage">
          <div class="usage-row">
            <span>Documents</span>
            <span class="muted">62%</span>
          </div>
          <fluid-progress-bar [value]="62"></fluid-progress-bar>
          <div class="usage-row">
            <span>Media</span>
            <span class="muted">28%</span>
          </div>
          <fluid-progress-bar [value]="28"></fluid-progress-bar>
          <div class="usage-row">
            <span>Backups</span>
            <span class="muted">81%</span>
          </div>
          <fluid-progress-bar [value]="81"></fluid-progress-bar>
        </div>
      </fluid-card>
    </div>
  `
})
export class DashboardComponent {
  readonly stats = STATS;
  readonly signups = signups;
  readonly plans = plans;
  readonly lineOptions = { plugins: { legend: { display: false } } };
}
