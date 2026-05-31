# @fluid-ds/charts

Chart web components for [Fluid](https://github.com/RHeijnen/fluid_ds),
backed by [Chart.js](https://www.chartjs.org/). Expansion pack, install on
top of `@fluid-ds/components`.

```html
<fluid-bar-chart></fluid-bar-chart>
```

## Install

```bash
pnpm add @fluid-ds/charts
```

## Use

```ts
import "@fluid-ds/charts/define/bar-chart";

const chart = document.querySelector("fluid-bar-chart");
chart.data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [{ label: "Revenue", data: [12, 19, 15, 22, 28] }]
};
```

## Components

| Tag | Use case |
| --- | --- |
| `<fluid-chart>` | Generic Chart.js wrapper, set `type` to any Chart.js type |
| `<fluid-bar-chart>` | Bar (vertical or horizontal via Chart.js options) |
| `<fluid-line-chart>` | Line |
| `<fluid-pie-chart>` | Pie |
| `<fluid-doughnut-chart>` | Doughnut |
| `<fluid-scatter-chart>` | Scatter |
| `<fluid-bubble-chart>` | Bubble |
| `<fluid-radar-chart>` | Radar |
| `<fluid-polar-area-chart>` | Polar area |
| `<fluid-sparkline>` | Inline mini-line chart for metric callouts |

Each typed variant is a thin subclass that locks the chart type, pass
`data` and `options` exactly as you would to Chart.js.

## License

[MIT](./LICENSE), © Fluid contributors. Chart.js is MIT-licensed.
