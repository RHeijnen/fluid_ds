"use client";
import { STATS } from "../src/data";
import { FluidChart } from "../src/lib";

const signups = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [{ label: "Signups", data: [320, 410, 380, 520, 610, 740], tension: 0.4, fill: true }]
};
const plans = { labels: ["Free", "Pro", "Enterprise"], datasets: [{ data: [62, 28, 10] }] };

export default function DashboardPage() {
  return (
    <>
      <section className="cards">
        {STATS.map((s) => (
          <fluid-card className="stat" key={s.label}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <fluid-badge variant={s.tone}>{s.delta}</fluid-badge>
          </fluid-card>
        ))}
      </section>

      <div className="grid-2">
        <fluid-card class="chart-card">
          <h3 slot="header">Signups · last 6 months</h3>
          <FluidChart kind="line" data={signups} options={{ plugins: { legend: { display: false } } }} />
        </fluid-card>
        <fluid-card class="chart-card">
          <h3 slot="header">Plan mix</h3>
          <FluidChart kind="doughnut" data={plans} />
        </fluid-card>
      </div>

      <div className="grid-2">
        <fluid-card>
          <h3 slot="header">Onboarding</h3>
          <fluid-steps variant="chip" current={2} aria-label="Onboarding progress">
            <fluid-step>Create workspace</fluid-step>
            <fluid-step>Invite team</fluid-step>
            <fluid-step>Connect billing</fluid-step>
            <fluid-step>Go live</fluid-step>
          </fluid-steps>
          <p className="muted" style={{ margin: "1rem 0 0" }}>
            Two steps left to finish setup.
          </p>
        </fluid-card>

        <fluid-card>
          <h3 slot="header">Storage</h3>
          <div className="usage">
            <div className="usage-row">
              <span>Documents</span>
              <span className="muted">62%</span>
            </div>
            <fluid-progress-bar value={62} />
            <div className="usage-row">
              <span>Media</span>
              <span className="muted">28%</span>
            </div>
            <fluid-progress-bar value={28} />
            <div className="usage-row">
              <span>Backups</span>
              <span className="muted">81%</span>
            </div>
            <fluid-progress-bar value={81} />
          </div>
        </fluid-card>
      </div>
    </>
  );
}
