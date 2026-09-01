import { expect, fixture, html, waitUntil, aTimeout } from "@open-wc/testing";
import { Chart } from "chart.js";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import "../bar-chart/define.js";
import "../bubble-chart/define.js";
import "../doughnut-chart/define.js";
import "../line-chart/define.js";
import "../pie-chart/define.js";
import "../polar-area-chart/define.js";
import "../radar-chart/define.js";
import "../scatter-chart/define.js";
import "../sparkline/define.js";
import type { FluidChart } from "./fluid-chart.js";
import type { FluidSparkline } from "../sparkline/fluid-sparkline.js";

const sampleData = {
  labels: ["A", "B", "C"],
  datasets: [{ label: "Series", data: [3, 7, 5] }]
};

/** A full brand ramp, so the palette has real tokens to read. */
const brandRamp: Record<string, string> = {
  "200": "#eef2ff",
  "300": "#c7d2fe",
  "400": "#a5b4fc",
  "500": "#818cf8",
  "600": "#6366f1",
  "700": "#4f46e5",
  "800": "#4338ca",
  "900": "#3730a3"
};

const brandRampStyle = Object.entries(brandRamp)
  .map(([step, value]) => `--fluid-color-brand-${step}: ${value}`)
  .join("; ");

/** The y grid line color, which is the only themed value built through rgba(). */
const gridColor = (el: FluidChart): unknown =>
  (el.instance!.scales["y"]!.options as unknown as { grid: { color: unknown } }).grid.color;

/** Record every string painted into any canvas while `run` executes. */
async function withFillTextSpy<T>(run: (calls: string[]) => Promise<T> | T): Promise<T> {
  const calls: string[] = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (
    text: string,
    x: number,
    y: number,
    maxWidth?: number
  ): void {
    calls.push(String(text));
    if (maxWidth === undefined) original.call(this, text, x, y);
    else original.call(this, text, x, y, maxWidth);
  };
  try {
    return await run(calls);
  } finally {
    CanvasRenderingContext2D.prototype.fillText = original;
  }
}

/** Run `body` while every canvas refuses to hand out a 2D context. */
async function withoutCanvasContext<T>(body: () => Promise<T> | T): Promise<T> {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    id: string,
    ...rest: unknown[]
  ): unknown {
    if (id === "2d") return null;
    return (original as unknown as (...args: unknown[]) => unknown).call(this, id, ...rest);
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
  try {
    return await body();
  } finally {
    HTMLCanvasElement.prototype.getContext = original;
  }
}

describe("<fluid-chart>", () => {
  it("recreates a disconnected chart without requiring a property change", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div>
        <fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>
      </div>`
    );
    const el = wrapper.querySelector<FluidChart>("fluid-chart")!;
    await el.updateComplete;
    const before = el.instance;
    el.remove();
    wrapper.append(el);
    await el.updateComplete;
    expect(el.instance).to.not.equal(null);
    expect(el.instance).to.not.equal(before);
    expect(el.instance!.data.datasets[0]!.data).to.deep.equal([3, 7, 5]);
  });

  it("insets radial charts by default so the ring is not flush to the canvas", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart type="doughnut" .data=${sampleData}></fluid-chart>`
    );
    /* Without an inset a doughnut fits its ring to the canvas edges (verified:
       outerRadius == canvas half-height), which reads as cramped in a card. */
    expect(el.instance!.options.layout!.padding).to.equal(10);

    const bar = await fixture<FluidChart>(
      html`<fluid-chart type="bar" .data=${sampleData}></fluid-chart>`
    );
    // Cartesian charts space their plot with axes, so they default to no inset.
    expect(bar.instance!.options.layout!.padding).to.equal(0);
  });

  it("lets --fluid-chart-padding override the drawing-area inset", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart
        type="doughnut"
        style="--fluid-chart-padding: 24"
        .data=${sampleData}
      ></fluid-chart>`
    );
    expect(el.instance!.options.layout!.padding).to.equal(24);
  });

  it("draws no doughnut ring shadow by default, and one when the token is set", async () => {
    /*
     * The shadow is drawn on the canvas and spills past the plot area, so on by
     * default it gets clipped by the tight edge and looks broken. It is now
     * opt-in via --fluid-chart-doughnut-shadow. Spy on the 2D context's
     * shadowColor to see whether the arc-decor plugin sets an opaque shadow
     * during a redraw.
     */
    const spyShadow = (chart: FluidChart) => {
      const ctx = chart.shadowRoot!.querySelector("canvas")!.getContext("2d")!;
      const applied: string[] = [];
      const proto = Object.getOwnPropertyDescriptor(
        CanvasRenderingContext2D.prototype,
        "shadowColor"
      )!;
      Object.defineProperty(ctx, "shadowColor", {
        configurable: true,
        get() {
          return proto.get!.call(this);
        },
        set(value: string) {
          if (value && value !== "rgba(0, 0, 0, 0)") applied.push(value);
          proto.set!.call(this, value);
        }
      });
      chart.instance!.draw();
      return applied;
    };

    const plain = await fixture<FluidChart>(
      html`<fluid-chart type="doughnut" .data=${sampleData}></fluid-chart>`
    );
    expect(spyShadow(plain), "no shadow by default").to.have.lengthOf(0);

    const shadowed = await fixture<FluidChart>(
      html`<fluid-chart
        type="doughnut"
        style="--fluid-chart-doughnut-shadow: rgba(2, 6, 23, 0.2)"
        .data=${sampleData}
      ></fluid-chart>`
    );
    expect(spyShadow(shadowed).length, "shadow drawn when the token is set").to.be.greaterThan(0);
  });

  it("respects custom legend callbacks and explicit legend suppression", async () => {
    let called = 0;
    const el = await fixture<FluidChart>(
      html`<fluid-chart
        .data=${sampleData}
        .options=${{
          animation: false,
          plugins: {
            legend: {
              onClick: () => {
                called++;
              }
            }
          }
        }}
      ></fluid-chart>`
    );
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "HTML legend exists");
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(called).to.equal(1);
    expect(el.instance!.isDatasetVisible(0)).to.equal(true);
    el.options = { animation: false, plugins: { legend: { display: false } } };
    await el.updateComplete;
    await waitUntil(
      () => el.shadowRoot!.querySelectorAll("button").length === 0,
      "explicit suppression removes legend controls"
    );
  });

  it("keeps filtered and reversed HTML legends in the same order as Chart.js", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart
        .data=${{
          labels: ["A"],
          datasets: [
            { label: "First", data: [1] },
            { label: "Excluded", data: [2] },
            { label: "Last", data: [3] }
          ]
        }}
        .options=${{
          animation: false,
          plugins: {
            legend: {
              reverse: true,
              labels: { filter: (item: { text: string }) => item.text !== "Excluded" }
            }
          }
        }}
      ></fluid-chart>`
    );
    await waitUntil(
      () => el.shadowRoot!.querySelectorAll("button").length === 2,
      "filtered legend exists"
    );
    expect(
      [...el.shadowRoot!.querySelectorAll("button")].map((button) => button.textContent!.trim())
    ).to.deep.equal(["Last", "First"]);
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(el.instance!.isDatasetVisible(2)).to.equal(false);
    expect(el.instance!.isDatasetVisible(0)).to.equal(true);
  });

  it("names unlabeled series controls and reflects programmatic visibility changes", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart
        label="Results"
        .data=${{
          labels: ["A"],
          datasets: [{ data: [1] }, { data: [2] }]
        }}
        .options=${{ animation: false }}
      ></fluid-chart>`
    );
    await waitUntil(() => el.shadowRoot!.querySelectorAll("button").length === 2);
    const buttons = [...el.shadowRoot!.querySelectorAll("button")];
    expect(buttons.map((button) => button.textContent!.trim())).to.deep.equal([
      "Results 1",
      "Results 2"
    ]);
    el.instance!.hide(0);
    await el.updateComplete;
    expect(buttons[0]!.getAttribute("aria-pressed")).to.equal("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).to.equal("true");
    await expect(el).to.be.accessible();
  });

  it("preserves hidden series across theme changes and reconnect, then resets on type change", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div>
        <fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>
      </div>`
    );
    const el = wrapper.querySelector<FluidChart>("fluid-chart")!;
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")));
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(el.instance!.isDatasetVisible(0)).to.equal(false);
    const originalTheme = document.documentElement.getAttribute("data-fluid-theme");
    try {
      const beforeTheme = el.instance;
      document.documentElement.setAttribute(
        "data-fluid-theme",
        originalTheme === "dark" ? "light" : "dark"
      );
      await waitUntil(() => el.instance !== beforeTheme);
      expect(el.instance!.isDatasetVisible(0)).to.equal(false);
      el.remove();
      wrapper.append(el);
      await el.updateComplete;
      expect(el.instance!.isDatasetVisible(0)).to.equal(false);
      el.type = "line";
      await el.updateComplete;
      expect(el.instance!.isDatasetVisible(0)).to.equal(true);
    } finally {
      if (originalTheme === null) document.documentElement.removeAttribute("data-fluid-theme");
      else document.documentElement.setAttribute("data-fluid-theme", originalTheme);
    }
  });

  it("honors reduced motion changes and removes its media listener on disconnect", async () => {
    const originalMatchMedia = window.matchMedia;
    const media = originalMatchMedia.call(window, "(prefers-reduced-motion: reduce)");
    let reduced = true;
    Object.defineProperty(media, "matches", { get: () => reduced });
    window.matchMedia = (query: string) =>
      query === "(prefers-reduced-motion: reduce)" ? media : originalMatchMedia.call(window, query);
    try {
      const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
      expect(el.instance!.options.animation).to.equal(false);
      reduced = false;
      media.dispatchEvent(new Event("change"));
      expect(el.instance!.options.animation).not.to.equal(false);
      el.remove();
      reduced = true;
      media.dispatchEvent(new Event("change"));
      expect(el.instance).to.equal(null);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("exposes an accessible canvas name and a slotted data alternative", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart label="Quarterly revenue" .data=${sampleData}>
        <table slot="fallback">
          <caption>
            Quarterly revenue data
          </caption>
          <tbody>
            <tr>
              <th>A</th>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </fluid-chart>
    `);
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    expect(canvas.getAttribute("role")).to.equal("img");
    expect(canvas.getAttribute("aria-label")).to.equal("Quarterly revenue");
    await expect(el).to.be.accessible();
  });

  it("creates a live Chart.js instance after firstUpdated", async () => {
    const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
    expect(el.instance).to.not.equal(null);
    // A live Chart.js instance exposes a canvas and an update() method.
    expect(el.instance!.canvas).to.be.instanceOf(HTMLCanvasElement);
    expect(typeof el.instance!.update).to.equal("function");
  });

  it("refresh() repaints in place so ancestor token changes reach the canvas", async () => {
    const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
    const before = el.instance as Chart;
    expect(before).to.not.equal(null);

    /* A canvas reads its colors once, at draw time. Theming that writes custom
       properties onto an ancestor mutates no attribute the chart can observe,
       so refresh() is the only way the repaint happens; a broken one leaves the
       old instance in place and the chart keeps its stale palette until a full
       page reload. */
    el.refresh();
    await aTimeout(0);

    const after = el.instance as Chart;
    expect(after, "refresh must leave a live instance behind").to.not.equal(null);
    expect(after).to.not.equal(before);
    expect(before.canvas, "the superseded instance must be destroyed").to.equal(null);
  });

  it("rounds only the outer edges of a stacked bar column", async () => {
    const stacked = {
      labels: ["Q1", "Q2"],
      datasets: [
        { label: "A", data: [1, 2] },
        { label: "B", data: [3, 4] },
        { label: "C", data: [5, 6] }
      ]
    };
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        type="bar"
        .data=${stacked}
        .options=${{ scales: { x: { stacked: true }, y: { stacked: true } } }}
      ></fluid-chart>
    `);
    const chart = el.instance as Chart;
    const radius = (chart.data.datasets[0] as { borderRadius?: unknown }).borderRadius;
    expect(typeof radius, "stacked bars need a scriptable borderRadius").to.equal("function");

    const cornersFor = (datasetIndex: number) =>
      (radius as (c: object) => Record<string, number>)({ chart, datasetIndex, dataIndex: 0 });

    /* Rounding every segment would put caps in the middle of the column. Only
       the bottom of the first segment and the top of the last are rounded, so
       the stack reads as one bar. */
    const bottom = cornersFor(0);
    const middle = cornersFor(1);
    const top = cornersFor(2);

    expect(bottom.bottomLeft).to.be.greaterThan(0);
    expect(bottom.topLeft).to.equal(0);
    expect(middle.topLeft).to.equal(0);
    expect(middle.bottomLeft).to.equal(0);
    expect(top.topLeft).to.be.greaterThan(0);
    expect(top.bottomLeft).to.equal(0);
  });

  it("destroys the Chart.js instance on disconnect", async () => {
    const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
    const chart = el.instance as Chart;
    expect(chart).to.not.equal(null);

    el.remove();

    // Reference is cleared and the underlying Chart.js instance is destroyed
    // (Chart.js nulls its canvas reference on destroy()).
    expect(el.instance).to.equal(null);
    expect(chart.canvas).to.equal(null);
  });

  it("disconnects the theme MutationObserver on disconnect (no re-theme after removal)", async () => {
    const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
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
    const el = await fixture<FluidChart>(html`<fluid-chart .data=${sampleData}></fluid-chart>`);
    const before = el.instance;
    expect(before).to.not.equal(null);

    el.data = { labels: ["A", "B", "C"], datasets: [{ label: "Series", data: [9, 1, 4] }] };
    await el.updateComplete;

    // Same instance object, updated data.
    expect(el.instance).to.equal(before);
    expect(el.instance!.data.datasets[0]!.data).to.deep.equal([9, 1, 4]);
  });

  it("updates inherited Arabic and regional French wrapper text without changing chart data or visibility", async () => {
    const data = {
      labels: ["A"],
      datasets: [{ data: [1] }, { label: "<Caller series>", data: [2] }]
    };
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar-EG">
        <fluid-chart .data=${data} .options=${{ animation: false }}></fluid-chart>
      </div>
    `);
    const el = wrapper.querySelector<FluidChart>("fluid-chart")!;
    await waitUntil(() => el.shadowRoot!.querySelectorAll("button").length === 2);
    const instance = el.instance!;
    instance.hide(0);
    await el.updateComplete;
    const events: Event[] = [];
    el.addEventListener("fluid-legend-change", (event) => events.push(event));
    const arabicOne = new Intl.NumberFormat("ar-EG").format(1);
    expect(el.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).to.equal("مخطط");
    expect(el.shadowRoot!.querySelector<HTMLElement>(".plot")!.dir).to.equal("rtl");
    expect(
      [...el.shadowRoot!.querySelectorAll("button")].map((button) => button.textContent!.trim())
    ).to.deep.equal([`مخطط ${arabicOne}`, "<Caller series>"]);

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.instance).to.equal(instance);
    expect(el.data).to.equal(data);
    expect(instance.isDatasetVisible(0)).to.equal(false);
    expect(instance.data.datasets[1]!.label).to.equal("<Caller series>");
    expect(el.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).to.equal(
      "Graphique"
    );
    expect(el.shadowRoot!.querySelector<HTMLElement>(".plot")!.dir).to.equal("ltr");
    expect(
      [...el.shadowRoot!.querySelectorAll("button")].map((button) => button.textContent!.trim())
    ).to.deep.equal(["Graphique 1", "<Caller series>"]);
    expect(events).to.deep.equal([]);
  });

  it("localizes doughnut center totals in place and preserves explicit labels, including empty", async () => {
    const calls: string[] = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      text: string,
      x: number,
      y: number,
      maxWidth?: number
    ): void {
      calls.push(String(text));
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
    try {
      const data = { labels: ["A", "B"], datasets: [{ label: "<Caller>", data: [1200, 34] }] };
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="ar-EG">
          <fluid-doughnut-chart
            .data=${data}
            .options=${{ animation: false }}
          ></fluid-doughnut-chart>
        </div>
      `);
      const el = wrapper.querySelector<FluidChart>("fluid-doughnut-chart")!;
      const instance = el.instance!;
      expect(calls).to.include(new Intl.NumberFormat("ar-EG").format(1234));
      expect(calls).to.include("الإجمالي");

      wrapper.lang = "fr-CA";
      await aTimeout(0);
      await el.updateComplete;
      expect(el.instance).to.equal(instance);
      expect(el.data).to.equal(data);
      expect(calls).to.include(new Intl.NumberFormat("fr-CA").format(1234));
      expect(calls).to.include("Total");

      const custom = await fixture<FluidChart>(html`
        <fluid-doughnut-chart
          .data=${data}
          .options=${{
            animation: false,
            plugins: { fluidCenterText: { label: "<Caller total>" } }
          }}
        ></fluid-doughnut-chart>
      `);
      expect(custom.instance!.data.datasets[0]!.label).to.equal("<Caller>");
      expect(calls).to.include("<Caller total>");

      await fixture<FluidChart>(html`
        <fluid-doughnut-chart
          .data=${data}
          .options=${{ animation: false, plugins: { fluidCenterText: { label: "" } } }}
        ></fluid-doughnut-chart>
      `);
      expect(calls).to.include("");
    } finally {
      CanvasRenderingContext2D.prototype.fillText = original;
    }
  });

  it("preserves an explicitly empty accessible name", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart label="" .data=${sampleData} .options=${{ animation: false }}></fluid-chart>
    `);
    expect(el.label).to.equal("");
    expect(el.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).to.equal("");
  });

  it("expands a short hex token and passes a non-hex color through untouched", async () => {
    const short = await fixture<FluidChart>(html`
      <fluid-chart
        type="bar"
        style="--fluid-border-default: #abc"
        .data=${sampleData}
        .options=${{ animation: false }}
      ></fluid-chart>
    `);
    // #abc has to become #aabbcc before the grid alpha can be applied to it.
    expect(gridColor(short), "a three digit hex still yields a real rgba()").to.equal(
      "rgba(170, 187, 204, 0.6)"
    );

    const functional = await fixture<FluidChart>(html`
      <fluid-chart
        type="bar"
        style="--fluid-border-default: rgb(2, 6, 23)"
        .data=${sampleData}
        .options=${{ animation: false }}
      ></fluid-chart>
    `);
    /* A border token is any CSS color, not necessarily a hex one. Anything the
       alpha helper cannot parse must survive verbatim instead of being turned
       into a broken rgba() string. */
    expect(gridColor(functional), "a non-hex token is left alone").to.equal("rgb(2, 6, 23)");
  });

  it("colors series from the brand ramp when the brand tokens resolve", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        type="bar"
        style=${brandRampStyle}
        .data=${{
          labels: ["A"],
          datasets: [{ data: [1] }, { data: [2] }, { data: [3] }]
        }}
        .options=${{ animation: false }}
      ></fluid-chart>
    `);
    /* The ramp is walked 600, 400, 800 first so neighbouring series stay far
       apart in lightness. Without any brand tokens in scope the component falls
       back to a fixed palette, which every other test in this file exercises. */
    expect(el.instance!.data.datasets.map((dataset) => dataset.backgroundColor)).to.deep.equal([
      brandRamp["600"],
      brandRamp["400"],
      brandRamp["800"]
    ]);
  });

  it("fills a line series with a fading gradient and a flat color before layout", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        type="line"
        style="--fluid-accent-base: #6366f1"
        .data=${{
          labels: ["A", "B", "C"],
          datasets: [{ label: "Series", data: [3, 7, 5], fill: true }]
        }}
        .options=${{ animation: false }}
      ></fluid-chart>
    `);
    const dataset = el.instance!.data.datasets[0] as {
      borderColor?: unknown;
      backgroundColor?: unknown;
    };
    expect(dataset.borderColor).to.equal("#6366f1");
    const paint = dataset.backgroundColor as (context: { chart: unknown }) => unknown;
    // The gradient spans the plot height, so it has to be resolved per draw.
    expect(typeof paint, "the area fill is scriptable").to.equal("function");
    expect(paint({ chart: el.instance }), "a laid out chart gets a gradient").to.be.instanceOf(
      CanvasGradient
    );
    /* Chart.js also resolves scriptable colors before the first layout, when
       there is no plot area to build a gradient in. */
    expect(paint({ chart: { chartArea: null } }), "no plot area means a flat wash").to.equal(
      "rgba(99, 102, 241, 0.15)"
    );
  });

  it("falls back to the first palette color when an arc fill has no data index", async () => {
    const stops: string[] = [];
    const original = CanvasGradient.prototype.addColorStop;
    CanvasGradient.prototype.addColorStop = function (offset: number, color: string): void {
      stops.push(color);
      original.call(this, offset, color);
    };
    try {
      const el = await fixture<FluidChart>(html`
        <fluid-pie-chart
          style=${brandRampStyle}
          .data=${sampleData}
          .options=${{ animation: false }}
        ></fluid-pie-chart>
      `);
      const chart = el.instance!;
      /* Chart.js resolves an option in dataset scope (no data index) whenever
         it asks for the series rather than one arc. The arc gradient has to
         survive that instead of indexing the palette with undefined. */
      const controller = chart.getDatasetMeta(0).controller as unknown as {
        getContext(): { dataIndex?: number };
      };
      const context = controller.getContext();
      expect(context.dataIndex, "a dataset scoped context has no data index").to.equal(undefined);
      const paint = chart.data.datasets[0]!.backgroundColor as (value: unknown) => unknown;
      stops.length = 0;
      expect(paint(context)).to.be.instanceOf(CanvasGradient);
      expect(stops).to.deep.equal(["rgba(99, 102, 241, 0.72)", brandRamp["600"]]);
    } finally {
      CanvasGradient.prototype.addColorStop = original;
    }
  });

  it("leaves an empty stacked segment unrounded so the column keeps one cap", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        type="bar"
        .data=${{
          labels: ["Q1"],
          datasets: [
            { label: "A", data: [0] },
            { label: "B", data: [4] },
            { label: "C", data: [2] }
          ]
        }}
        .options=${{ animation: false, scales: { x: { stacked: true }, y: { stacked: true } } }}
      ></fluid-chart>
    `);
    const chart = el.instance as Chart;
    const radius = (chart.data.datasets[0] as { borderRadius?: unknown }).borderRadius as (
      context: object
    ) => unknown;

    /* A zero value draws no segment at all, so it must not claim the rounded
       bottom of the column; the first segment that actually has height does. */
    expect(radius({ chart, datasetIndex: 0, dataIndex: 0 })).to.equal(0);
    const bottom = radius({ chart, datasetIndex: 1, dataIndex: 0 }) as Record<string, number>;
    expect(bottom.bottomLeft).to.be.greaterThan(0);
    expect(bottom.topLeft).to.equal(0);
    const top = radius({ chart, datasetIndex: 2, dataIndex: 0 }) as Record<string, number>;
    expect(top.topLeft).to.be.greaterThan(0);
  });

  it("draws no doughnut center text when fluidCenterText is disabled", async () => {
    await withFillTextSpy(async (calls) => {
      const el = await fixture<FluidChart>(html`
        <fluid-doughnut-chart
          .data=${{ labels: ["A", "B"], datasets: [{ data: [1200, 34] }] }}
          .options=${{ animation: false, plugins: { fluidCenterText: false } }}
        ></fluid-doughnut-chart>
      `);
      calls.length = 0;
      el.instance!.draw();
      expect(calls, "opting out drops the whole center decoration").to.deep.equal([]);
    });
  });

  it("renders a doughnut with no datasets at all without painting a total", async () => {
    await withFillTextSpy(async (calls) => {
      const el = await fixture<FluidChart>(html`
        <fluid-doughnut-chart
          .data=${{ labels: ["A", "B"] }}
          .options=${{ animation: false }}
        ></fluid-doughnut-chart>
      `);
      // Data that carries labels but no series is a normal loading state.
      expect(el.instance, "a dataset-less chart still renders").to.not.equal(null);
      expect(el.instance!.data.datasets).to.deep.equal([]);
      calls.length = 0;
      el.instance!.draw();
      expect(calls, "an empty ring has no total to paint").to.deep.equal([]);
    });
  });

  it("renders no HTML legend when the Chart.js legend plugin is switched off", async () => {
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        .data=${sampleData}
        .options=${{ animation: false, plugins: { legend: false } }}
      ></fluid-chart>
    `);
    await aTimeout(0);
    /* `legend: false` removes the plugin outright, so there is no legend object
       to mirror. That must read as "no controls", not as a crash. */
    expect(el.instance!.legend).to.equal(undefined);
    expect(el.shadowRoot!.querySelectorAll("button")).to.have.lengthOf(0);
  });

  it("reports dataset visibility for a custom legend item that names no dataset", async () => {
    let clicks = 0;
    const el = await fixture<FluidChart>(html`
      <fluid-chart
        label="Results"
        .data=${sampleData}
        .options=${{
          animation: false,
          plugins: {
            legend: {
              onClick: () => {
                clicks++;
              },
              labels: { generateLabels: () => [{ text: "All series" }] }
            }
          }
        }}
      ></fluid-chart>
    `);
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "custom legend exists");
    const events: CustomEvent[] = [];
    el.addEventListener("fluid-legend-change", (event) => events.push(event as CustomEvent));
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(clicks).to.equal(1);
    // A grouped control names neither a dataset nor an arc, so the reported
    // visibility falls back to the first series.
    expect(events).to.have.lengthOf(1);
    expect(events[0]!.detail).to.deep.equal({
      label: "All series",
      datasetIndex: undefined,
      index: undefined,
      visible: true
    });
  });

  it("ignores a legend control clicked after the chart is torn down", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>`
    );
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "HTML legend exists");
    const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
    const events: Event[] = [];
    el.addEventListener("fluid-legend-change", (event) => events.push(event));

    el.remove();
    expect(el.instance).to.equal(null);
    // The rendered controls outlive the Chart.js instance; clicking one must
    // not throw or announce a change that never happened.
    expect(() => button.click()).to.not.throw();
    expect(events).to.deep.equal([]);
  });

  it("refresh() is a no-op once the chart is torn down", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div>
        <fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>
      </div>`
    );
    const el = wrapper.querySelector<FluidChart>("fluid-chart")!;
    await el.updateComplete;
    el.remove();
    expect(el.instance).to.equal(null);

    // A theme controller that fans refresh() out over every chart it knows
    // about will reach detached ones too; they must stay detached.
    expect(() => el.refresh()).to.not.throw();
    await aTimeout(0);
    expect(el.instance, "a detached chart is not resurrected by a refresh").to.equal(null);

    wrapper.append(el);
    await el.updateComplete;
    expect(el.instance, "reattaching still rebuilds it").to.not.equal(null);
  });

  it("survives a mount and unmount inside one task, before the first render", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div></div>`);
    const el = document.createElement("fluid-chart") as FluidChart;
    el.data = sampleData;
    el.options = { animation: false };

    // Frameworks routinely attach and detach a node in the same task, before
    // Lit has rendered anything, so teardown runs with no chart to save.
    wrapper.append(el);
    el.remove();
    expect(el.instance).to.equal(null);

    wrapper.append(el);
    await el.updateComplete;
    expect(el.instance, "the remount still renders").to.not.equal(null);
    expect(el.instance!.data.datasets[0]!.data).to.deep.equal([3, 7, 5]);
  });

  it("restarts series visibility when the datasets are replaced wholesale", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div>
        <fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>
      </div>`
    );
    const el = wrapper.querySelector<FluidChart>("fluid-chart")!;
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "HTML legend exists");
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(el.instance!.isDatasetVisible(0)).to.equal(false);

    /* A data swap can legitimately arrive without labels (a scatter feed, a
       stripped API payload); Chart.js backfills an empty labels array. New
       dataset objects describe new series, so they start visible again: only a
       repaint of the same data (a theme flip, a reconnect) keeps a series
       hidden. */
    el.data = { datasets: [{ label: "Series", data: [3, 7, 5] }] };
    await el.updateComplete;
    expect(el.instance!.data.labels).to.deep.equal([]);
    expect(el.instance!.isDatasetVisible(0)).to.equal(true);

    el.remove();
    wrapper.append(el);
    await el.updateComplete;
    expect(el.instance, "the chart comes back").to.not.equal(null);
    expect(el.instance!.isDatasetVisible(0), "and its series stays visible").to.equal(true);
    expect(el.instance!.data.datasets[0]!.data).to.deep.equal([3, 7, 5]);
  });

  it("preserves a hidden pie arc across a brand change", async () => {
    const el = await fixture<FluidChart>(
      html`<fluid-pie-chart .data=${sampleData} .options=${{ animation: false }}></fluid-pie-chart>`
    );
    await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "HTML legend exists");
    el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    // A pie legend toggles one arc, not a whole series.
    expect(el.instance!.getDataVisibility(0)).to.equal(false);

    const before = el.instance;
    const original = document.documentElement.getAttribute("data-fluid-brand");
    try {
      document.documentElement.setAttribute(
        "data-fluid-brand",
        original === "forest" ? "ocean" : "forest"
      );
      await waitUntil(() => el.instance !== before, "a brand change repaints the chart");
      expect(el.instance!.getDataVisibility(0), "the hidden arc survives the repaint").to.equal(
        false
      );
      expect(el.instance!.getDataVisibility(1)).to.equal(true);
    } finally {
      if (original === null) document.documentElement.removeAttribute("data-fluid-brand");
      else document.documentElement.setAttribute("data-fluid-brand", original);
    }
  });

  it("renders nothing rather than throwing when the canvas has no 2D context", async () => {
    const el = await withoutCanvasContext(async () => {
      const chart = await fixture<FluidChart>(
        html`<fluid-chart .data=${sampleData} .options=${{ animation: false }}></fluid-chart>`
      );
      // A canvas whose context was already taken by another API cannot be
      // painted; that has to degrade quietly instead of throwing.
      expect(chart.instance, "no context means no chart").to.equal(null);
      return chart;
    });

    el.data = { labels: ["A", "B", "C"], datasets: [{ label: "Series", data: [1, 2, 3] }] };
    await el.updateComplete;
    expect(el.instance, "the next update recovers once a context is available").to.not.equal(null);
  });
});

const typedCharts = [
  "fluid-bar-chart",
  "fluid-bubble-chart",
  "fluid-doughnut-chart",
  "fluid-line-chart",
  "fluid-pie-chart",
  "fluid-polar-area-chart",
  "fluid-radar-chart",
  "fluid-scatter-chart"
] as const;

describe("typed chart wrappers", () => {
  for (const tag of ["fluid-chart", ...typedCharts]) {
    it(`${tag} inherits the localized default accessible name`, async () => {
      const el = document.createElement(tag) as FluidChart;
      el.lang = "nl-BE";
      el.data = sampleData;
      el.options = { animation: false };
      await fixture<FluidChart>(el);
      expect(el.label).to.equal("Grafiek");
      expect(el.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).to.equal(
        "Grafiek"
      );
    });
  }

  for (const tag of ["fluid-chart", ...typedCharts]) {
    it(`${tag} legend toggles the correct visibility and updates its pressed state`, async () => {
      const el = document.createElement(tag) as FluidChart;
      el.label = "Quarterly results";
      el.data = sampleData;
      el.options = { animation: false };
      await fixture<FluidChart>(el);
      await waitUntil(() => Boolean(el.shadowRoot!.querySelector("button")), "HTML legend exists");
      const button = el.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
      const arc = ["fluid-pie-chart", "fluid-doughnut-chart", "fluid-polar-area-chart"].includes(
        tag
      );
      expect(button.textContent!.trim()).to.equal(arc ? "A" : "Series");
      expect(button.getAttribute("aria-pressed")).to.equal("true");
      button.click();
      await el.updateComplete;
      expect(arc ? el.instance!.getDataVisibility(0) : el.instance!.isDatasetVisible(0)).to.equal(
        false
      );
      expect(button.getAttribute("aria-pressed")).to.equal("false");
      button.click();
      await el.updateComplete;
      expect(arc ? el.instance!.getDataVisibility(0) : el.instance!.isDatasetVisible(0)).to.equal(
        true
      );
      expect(button.getAttribute("aria-pressed")).to.equal("true");
    });
  }

  for (const tag of typedCharts) {
    it(`${tag} renders and passes an a11y audit`, async () => {
      const el = document.createElement(tag) as FluidChart;
      el.label = `${tag} example`;
      el.data = sampleData;
      const mounted = await fixture<FluidChart>(el);
      expect(mounted.instance).to.not.equal(null);
      await expect(mounted).to.be.accessible();
    });
  }
});

describe("<fluid-sparkline>", () => {
  it("passes an a11y audit with an accessible name", async () => {
    const el = await fixture<FluidSparkline>(html`
      <fluid-sparkline label="Weekly signups" .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>
    `);
    await expect(el).to.be.accessible();
  });

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

  it("refresh() repaints without reusing an occupied canvas", async () => {
    const el = await fixture<FluidSparkline>(
      html`<fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>`
    );
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    const before = Chart.getChart(canvas);
    expect(before).to.not.equal(undefined);

    /* Chart.js throws "Canvas is already in use" when a second instance is
       constructed on a canvas it still owns, so refresh() has to destroy the
       previous one first. When this threw, the sparkline aborted the theme
       repaint loop for every chart after it in DOM order. */
    expect(() => el.refresh()).to.not.throw();
    await aTimeout(0);

    const after = Chart.getChart(canvas);
    expect(after, "refresh must leave a live chart on the canvas").to.not.equal(undefined);
    expect(after).to.not.equal(before);
    expect(after!.data.datasets[0]!.data).to.deep.equal([1, 4, 2, 8, 5]);
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

  it("toggles the area fill in place when no-fill flips", async () => {
    const el = await fixture<FluidSparkline>(
      html`<fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>`
    );
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    const chart = Chart.getChart(canvas)!;
    const dataset = () => chart.data.datasets[0] as { fill?: unknown };
    expect(dataset().fill).to.equal(true);

    el.noFill = true;
    await el.updateComplete;
    // The flag is a paint change, not a reason to rebuild the chart.
    expect(Chart.getChart(canvas), "the same chart keeps the canvas").to.equal(chart);
    expect(dataset().fill).to.equal(false);

    el.requestUpdate();
    await el.updateComplete;
    expect(Chart.getChart(canvas), "an unrelated re-render leaves it alone").to.equal(chart);
    expect(dataset().fill).to.equal(false);
  });

  it("applies values set while detached and shows them on reattach", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div><fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline></div>`
    );
    const el = wrapper.querySelector<FluidSparkline>("fluid-sparkline")!;
    await el.updateComplete;
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;

    el.remove();
    expect(Chart.getChart(canvas), "teardown releases the canvas").to.equal(undefined);

    /* A metric that keeps streaming while its row is detached (a virtualized
       list, a route transition) must not lose the update, and must not build
       a chart while detached: Chart.js registers every instance in a
       module-level map that only destroy() removes, so drawing here leaks. */
    el.values = [9, 3, 7];
    await el.updateComplete;
    expect(Chart.getChart(canvas), "no chart is built while detached").to.equal(undefined);
    wrapper.append(el);
    await el.updateComplete;

    const chart = Chart.getChart(canvas);
    expect(chart, "a reattached sparkline owns its canvas again").to.not.equal(undefined);
    expect(chart!.data.datasets[0]!.data).to.deep.equal([9, 3, 7]);
  });

  it("refresh() before the first render is a no-op", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div></div>`);
    const el = document.createElement("fluid-sparkline") as FluidSparkline;
    el.values = [1, 2, 3];

    // A theme controller can reach a sparkline that has not rendered yet.
    expect(() => el.refresh()).to.not.throw();

    wrapper.append(el);
    await el.updateComplete;
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    expect(Chart.getChart(canvas)!.data.datasets[0]!.data).to.deep.equal([1, 2, 3]);
  });

  it("renders nothing rather than throwing when the canvas has no 2D context", async () => {
    const el = await withoutCanvasContext(async () => {
      const sparkline = await fixture<FluidSparkline>(
        html`<fluid-sparkline .values=${[1, 4, 2, 8, 5]}></fluid-sparkline>`
      );
      const blocked = sparkline.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
      expect(Chart.getChart(blocked), "no context means no chart").to.equal(undefined);
      return sparkline;
    });

    el.values = [2, 4, 6];
    await el.updateComplete;
    const canvas = el.shadowRoot!.querySelector("canvas") as HTMLCanvasElement;
    expect(Chart.getChart(canvas)!.data.datasets[0]!.data).to.deep.equal([2, 4, 6]);
  });
});
