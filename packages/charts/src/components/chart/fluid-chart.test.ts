import { expect, fixture, html } from "@open-wc/testing";
import { Chart } from "chart.js";
import "./define.js";
import "../sparkline/define.js";
import type { FluidChart } from "./fluid-chart.js";
import type { FluidSparkline } from "../sparkline/fluid-sparkline.js";

const sampleData = {
  labels: ["A", "B", "C"],
  datasets: [{ label: "Series", data: [3, 7, 5] }]
};

describe("<fluid-chart>", () => {
  it("creates a live Chart.js instance after firstUpdated", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart .data=${sampleData}></fluid-chart>`
    );
    expect(el.instance).to.not.equal(null);
    // A live Chart.js instance exposes a canvas and an update() method.
    expect(el.instance!.canvas).to.be.instanceOf(HTMLCanvasElement);
    expect(typeof el.instance!.update).to.equal("function");
  });

  it("destroys the Chart.js instance on disconnect", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart .data=${sampleData}></fluid-chart>`
    );
    const chart = el.instance as Chart;
    expect(chart).to.not.equal(null);

    el.remove();

    // Reference is cleared and the underlying Chart.js instance is destroyed
    // (Chart.js nulls its canvas reference on destroy()).
    expect(el.instance).to.equal(null);
    expect(chart.canvas).to.equal(null);
  });

  it("disconnects the theme MutationObserver on disconnect (no re-theme after removal)", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart .data=${sampleData}></fluid-chart>`
    );
    expect(el.instance).to.not.equal(null);

    el.remove();
    expect(el.instance).to.equal(null);

    // Flipping a watched attribute would call retheme() -> render2d() if the
    // observer were still live, recreating the chart. Assert it stays null.
    const prev = document.documentElement.getAttribute("data-fluid-theme");
    document.documentElement.setAttribute("data-fluid-theme", "dark");
    // Let any pending observer microtask flush.
    await Promise.resolve();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(el.instance).to.equal(null);

    if (prev === null) document.documentElement.removeAttribute("data-fluid-theme");
    else document.documentElement.setAttribute("data-fluid-theme", prev);
  });

  it("re-themes data/options updates in place without recreating the instance", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart .data=${sampleData}></fluid-chart>`
    );
    const before = el.instance;
    expect(before).to.not.equal(null);

    el.data = { labels: ["A", "B", "C"], datasets: [{ label: "Series", data: [9, 1, 4] }] };
    await el.updateComplete;

    // Same instance object, updated data.
    expect(el.instance).to.equal(before);
    expect(el.instance!.data.datasets[0]!.data).to.deep.equal([9, 1, 4]);
  });
});

describe("<fluid-sparkline>", () => {
  it("renders a live Chart.js instance from values", async () => {
    const el = await fixture<FluidSparkline>(
      html`<fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>`
    );
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas).to.be.instanceOf(HTMLCanvasElement);
    // The canvas should be controlled by a live Chart.js instance with our data.
    const chart = Chart.getChart(canvas);
    expect(chart, "a chart should control the canvas").to.not.equal(undefined);
    expect(chart!.data.datasets[0]!.data).to.deep.equal([1, 4, 2, 8, 5]);
  });

  it("tears down on disconnect (no leaked Chart.js instance)", async () => {
    const el = await fixture<FluidSparkline>(
      html`<fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>`
    );
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    expect(Chart.getChart(canvas), "a chart should control the canvas before removal").to.not.equal(
      undefined
    );

    el.remove();

    // After disconnect the chart is destroyed, so Chart.js no longer tracks it.
    expect(Chart.getChart(canvas)).to.equal(undefined);
  });
});
