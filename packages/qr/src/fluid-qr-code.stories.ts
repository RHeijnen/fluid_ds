import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";

/** A tiny inline SVG mark used as the demo logo (no network needed). */
const LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#4f46e5"/><path d="M16 30c4-12 12-12 16 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`
  );

const meta: Meta = {
  title: "QR/QR code",
  tags: ["autodocs"],
  parameters: {
    status: { type: "experimental" }
  },
  argTypes: {
    value: { control: "text" },
    size: { control: { type: "number", min: 80, max: 480, step: 10 } },
    ecLevel: { control: "inline-radio", options: ["L", "M", "Q", "H"] },
    moduleShape: { control: "inline-radio", options: ["square", "dots", "rounded"] },
    eyeShape: { control: "inline-radio", options: ["square", "rounded", "circle"] },
    eyeColor: { control: "color" },
    fill: { control: "color" },
    background: { control: "color" }
  },
  render: (args) => html`
    <fluid-qr-code
      value=${args.value ?? "https://fluid.example.com"}
      size=${args.size ?? 200}
      ec-level=${args.ecLevel ?? "M"}
      module-shape=${args.moduleShape ?? "square"}
      eye-shape=${args.eyeShape ?? "square"}
      eye-color=${args.eyeColor ?? ""}
      fill=${args.fill ?? ""}
      background=${args.background ?? ""}
    ></fluid-qr-code>
  `
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

/** A center logo automatically bumps error correction to H so it still scans. */
export const WithLogo: Story = {
  render: () => html`
    <fluid-qr-code
      value="https://fluid.example.com"
      size="220"
      logo=${LOGO}
      logo-size="0.24"
    ></fluid-qr-code>
  `
};

/** Dot modules with rounded eyes for a softer look. */
export const DotModules: Story = {
  render: () => html`
    <fluid-qr-code
      value="https://fluid.example.com"
      size="220"
      module-shape="dots"
      eye-shape="rounded"
    ></fluid-qr-code>
  `
};

/** Distinctly colored finder eyes, including a per-eye override. */
export const ColoredEyes: Story = {
  render: () => html`
    <fluid-qr-code
      value="https://fluid.example.com"
      size="220"
      module-shape="rounded"
      eye-shape="circle"
      eye-color="#4f46e5"
      eye-color-top-left="#db2777"
    ></fluid-qr-code>
  `
};

/** A linear gradient module fill. */
export const Gradient: Story = {
  render: () => html`
    <fluid-qr-code
      value="https://fluid.example.com"
      size="220"
      module-shape="dots"
      gradient-from="#4f46e5"
      gradient-to="#db2777"
      gradient-angle="45"
    ></fluid-qr-code>
  `
};

/** Artistic mode: the image sits behind semi-opaque dot modules. Decorative-first,
 *  always scan-test before shipping. */
export const Artistic: Story = {
  render: () => html`
    <fluid-qr-code
      value="https://fluid.example.com"
      size="240"
      artistic
      logo=${LOGO}
      artistic-opacity="0.85"
    ></fluid-qr-code>
  `
};

/** Rasterize to PNG and download via the imperative API. */
export const Export: Story = {
  render: () => html`
    <div style="display: grid; gap: 1rem; justify-items: start;">
      <fluid-qr-code id="export-demo" value="https://fluid.example.com" size="200" logo=${LOGO}></fluid-qr-code>
      <button
        @click=${async () => {
          const el = document.querySelector<HTMLElement & { download: (f?: string) => Promise<void> }>(
            "#export-demo"
          );
          if (el) await el.download("fluid-qr.png");
        }}
      >
        Download PNG
      </button>
    </div>
  `
};
