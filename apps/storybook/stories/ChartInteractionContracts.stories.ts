import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html, unsafeStatic } from "lit/static-html.js";
import type { FluidChart } from "../../../packages/charts/src/components/chart/fluid-chart.js";
import "../../../packages/charts/src/components/chart/define.js";
import "../../../packages/charts/src/components/bar-chart/define.js";
import "../../../packages/charts/src/components/line-chart/define.js";
import "../../../packages/charts/src/components/pie-chart/define.js";
import "../../../packages/charts/src/components/doughnut-chart/define.js";
import "../../../packages/charts/src/components/radar-chart/define.js";
import "../../../packages/charts/src/components/polar-area-chart/define.js";
import "../../../packages/charts/src/components/scatter-chart/define.js";
import "../../../packages/charts/src/components/bubble-chart/define.js";

const meta: Meta = {
  title: "Quality/Chart interaction contracts",
  parameters: { controls: { disable: true }, status: { type: "beta" } }
};
export default meta;
type Story = StoryObj;
type ChartType = FluidChart["type"];
type ChartData = FluidChart["data"];

function chartType(tag: string): ChartType {
  if (tag === "fluid-chart" || tag === "fluid-bar-chart") return "bar";
  if (tag === "fluid-polar-area-chart") return "polarArea";
  return tag.replace("fluid-", "").replace("-chart", "") as ChartType;
}

function isArc(type: ChartType) { return ["pie", "doughnut", "polarArea"].includes(type); }

function chartData(type: ChartType, updated = false): ChartData {
  const values = type === "scatter" ? [{ x: 1, y: updated ? 9 : 3 }, { x: 2, y: 7 }]
    : type === "bubble" ? [{ x: 1, y: updated ? 9 : 3, r: 5 }, { x: 2, y: 7, r: 8 }]
    : [updated ? 9 : 3, 7, 5];
  return {
    labels: [updated ? "Updated North" : "North", "South", "West"],
    datasets: isArc(type) ? [{ data: values }] : [
      { label: updated ? "Updated revenue" : "Revenue", data: values },
      { label: "Costs", data: values }
    ]
  } as ChartData;
}

function renderChart(tag: string) {
  // Tag names are fixed call-site constants, never consumer-provided markup.
  const element = unsafeStatic(tag);
  const type = chartType(tag);
  return html`
    <section style="max-width:520px;">
      <button>Before chart</button>
      <${element} label="Regional results" .data=${chartData(type)} .options=${{ animation: false }}>
        <span slot="fallback">North: 3. South: 7. West: 5.</span>
      </${element}>
      <button>After chart</button>
      <button @click=${(event: Event) => {
        const chart = (event.currentTarget as HTMLElement).closest("section")!.querySelector<FluidChart>(tag)!;
        chart.data = chartData(type, true);
        chart.querySelector('[slot="fallback"]')!.textContent = "North: 9. South: 7. West: 5.";
      }}>Update chart data</button>
      <button @click=${(event: Event) => {
        const chart = (event.currentTarget as HTMLElement).closest("section")!.querySelector<FluidChart>(tag)!;
        const next = chart.nextSibling;
        const parent = chart.parentNode!;
        chart.remove();
        parent.insertBefore(chart, next);
      }}>Reconnect chart</button>
    </section>
  `;
}

async function exerciseChart(canvas: HTMLElement, tag: string) {
  const chart = canvas.querySelector<FluidChart>(tag)!;
  const button = () => chart.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
  const visible = () => isArc(chart.type) ? chart.instance!.getDataVisibility(0) : chart.instance!.isDatasetVisible(0);
  const events: CustomEvent<{ visible: boolean; label: string }>[] = [];
  const record = (event: Event) => events.push(event as CustomEvent<{ visible: boolean; label: string }>);
  chart.addEventListener("fluid-legend-change", record);
  try {
    await waitFor(() => expect(button()).not.toBeNull());
    await expect(chart.shadowRoot!.querySelector("canvas")!.getAttribute("aria-label")).toBe("Regional results");
    await expect(button().getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await expect(chart.shadowRoot!.querySelector("canvas")!.getBoundingClientRect().height).toBeGreaterThan(0);
    await userEvent.click(button());
    await waitFor(() => expect(button().getAttribute("aria-pressed")).toBe("false"));
    await expect(visible()).toBe(false);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(button().getAttribute("aria-pressed")).toBe("true"));
    await expect(visible()).toBe(true);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(button().getAttribute("aria-pressed")).toBe("false"));
    const prior = chart.instance;
    const controls = [...canvas.querySelectorAll("section > button")];
    await userEvent.click(controls.find((control) => control.textContent === "Reconnect chart")!);
    await waitFor(() => expect(chart.instance).not.toBe(prior));
    await expect(chart.instance).not.toBeNull();
    await expect(visible()).toBe(false);
    await expect(button().getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(button());
    await waitFor(() => expect(visible()).toBe(true));
    await userEvent.click(controls.find((control) => control.textContent === "Update chart data")!);
    await waitFor(() =>
      expect(button().textContent?.trim()).toBe(
        isArc(chart.type) ? "Updated North" : "Updated revenue"
      )
    );
    await expect(events.map((event) => event.detail.visible)).toEqual([false, true, false, true]);
    await expect(events.every((event) => event.target === chart && event.bubbles && event.composed)).toBe(true);
    await expect(chart.querySelector('[slot="fallback"]')!.textContent).toContain("North: 9");
  } finally { chart.removeEventListener("fluid-legend-change", record); }
}

export const GenericChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-chart" } },
  render: () => renderChart("fluid-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-chart"); }
};
export const BarChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-bar-chart" } },
  render: () => renderChart("fluid-bar-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-bar-chart"); }
};
export const LineChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-line-chart" } },
  render: () => renderChart("fluid-line-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-line-chart"); }
};
export const PieChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-pie-chart" } },
  render: () => renderChart("fluid-pie-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-pie-chart"); }
};
export const DoughnutChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-doughnut-chart" } },
  render: () => renderChart("fluid-doughnut-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-doughnut-chart"); }
};
export const RadarChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-radar-chart" } },
  render: () => renderChart("fluid-radar-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-radar-chart"); }
};
export const PolarAreaChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-polar-area-chart" } },
  render: () => renderChart("fluid-polar-area-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-polar-area-chart"); }
};
export const ScatterChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-scatter-chart" } },
  render: () => renderChart("fluid-scatter-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-scatter-chart"); }
};
export const BubbleChartContract: Story = {
  tags: ["interaction-contract"], parameters: { quality: { componentTag: "fluid-bubble-chart" } },
  render: () => renderChart("fluid-bubble-chart"),
  play: async ({ canvasElement }) => { await exerciseChart(canvasElement, "fluid-bubble-chart"); }
};

export const GenericKeyboardFixture: Story = { render: GenericChartContract.render };
export const BarKeyboardFixture: Story = { render: BarChartContract.render };
export const LineKeyboardFixture: Story = { render: LineChartContract.render };
export const PieKeyboardFixture: Story = { render: PieChartContract.render };
export const DoughnutKeyboardFixture: Story = { render: DoughnutChartContract.render };
export const RadarKeyboardFixture: Story = { render: RadarChartContract.render };
export const PolarAreaKeyboardFixture: Story = { render: PolarAreaChartContract.render };
export const ScatterKeyboardFixture: Story = { render: ScatterChartContract.render };
export const BubbleKeyboardFixture: Story = { render: BubbleChartContract.render };
