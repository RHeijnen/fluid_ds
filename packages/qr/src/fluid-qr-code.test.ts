import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import type { FluidQrCode } from "./fluid-qr-code.js";

const LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#4f46e5"/></svg>`
  );

async function qr(markup: ReturnType<typeof html>): Promise<FluidQrCode> {
  const el = await fixture<FluidQrCode>(markup);
  await elementUpdated(el);
  return el;
}

function svgOf(el: FluidQrCode): SVGSVGElement {
  return el.shadowRoot!.querySelector("svg")!;
}

describe("<fluid-qr-code>", () => {
  it("renders a matrix of modules for a value", async () => {
    const el = await qr(html`<fluid-qr-code value="hello fluid"></fluid-qr-code>`);
    const modules = svgOf(el).querySelectorAll('[part="module"]');
    expect(modules.length).to.be.greaterThan(0);
  });

  it("renders an empty placeholder when value is blank", async () => {
    const el = await qr(html`<fluid-qr-code></fluid-qr-code>`);
    const svg = svgOf(el);
    expect(svg.getAttribute("aria-label")).to.equal("Empty QR code");
    expect(svg.querySelectorAll('[part="module"]').length).to.equal(0);
  });

  it("renders three finder-eye parts", async () => {
    const el = await qr(html`<fluid-qr-code value="hello"></fluid-qr-code>`);
    const eyes = svgOf(el).querySelectorAll('[part="eye"]');
    expect(eyes.length).to.equal(3);
    expect(svgOf(el).querySelectorAll('[part="eye-frame"]').length).to.equal(3);
    expect(svgOf(el).querySelectorAll('[part="eye-pupil"]').length).to.equal(3);
  });

  it("auto-bumps error correction to H when a logo is set", async () => {
    const el = await qr(html`<fluid-qr-code value="hi" ec-level="L" logo=${LOGO}></fluid-qr-code>`);
    // The public ec-level attribute stays as authored, but the encoder uses H.
    // We assert behavior: a logo group + image are present and modules render.
    const logo = svgOf(el).querySelector('[part="logo"]');
    expect(logo).to.exist;
    const image = svgOf(el).querySelector('[part="logo-image"]');
    expect(image).to.exist;
    expect(image!.getAttribute("href")).to.equal(LOGO);
  });

  it("auto-bumps to H in artistic mode and uses higher density than L", async () => {
    const low = await qr(html`<fluid-qr-code value="density check abcdef" ec-level="L"></fluid-qr-code>`);
    const art = await qr(
      html`<fluid-qr-code value="density check abcdef" ec-level="L" artistic logo=${LOGO}></fluid-qr-code>`
    );
    // H encodes the same data with more modules than L (denser viewBox span).
    const lowSpan = Number(low.shadowRoot!.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    const artSpan = Number(art.shadowRoot!.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    expect(artSpan).to.be.greaterThan(lowSpan);
  });

  it("knocks out the center modules behind a logo", async () => {
    const withLogo = await qr(html`<fluid-qr-code value="hello fluid world" logo=${LOGO}></fluid-qr-code>`);
    const without = await qr(html`<fluid-qr-code value="hello fluid world"></fluid-qr-code>`);
    // The knockout removes some center data modules; with H + knockout the
    // module count differs from the plain code. Assert the knockout plate exists.
    const plate = svgOf(withLogo).querySelector('[part="logo"] rect');
    expect(plate).to.exist;
    expect(svgOf(without).querySelector('[part="logo"]')).to.not.exist;
  });

  it("embeds a full-bleed background image in artistic mode", async () => {
    const el = await qr(html`<fluid-qr-code value="hi" artistic logo=${LOGO}></fluid-qr-code>`);
    const bg = svgOf(el).querySelector('[part="image"]');
    expect(bg).to.exist;
    expect(bg!.getAttribute("href")).to.equal(LOGO);
  });

  it("changes module geometry: square uses rect, dots uses circle", async () => {
    const square = await qr(html`<fluid-qr-code value="hello" module-shape="square"></fluid-qr-code>`);
    const dots = await qr(html`<fluid-qr-code value="hello" module-shape="dots"></fluid-qr-code>`);
    const squareMod = svgOf(square).querySelector('[part="module"]')!;
    const dotMod = svgOf(dots).querySelector('[part="module"]')!;
    expect(squareMod.tagName.toLowerCase()).to.equal("rect");
    expect(dotMod.tagName.toLowerCase()).to.equal("circle");
  });

  it("reshapes the eyes: circle eye-shape renders circles", async () => {
    const el = await qr(html`<fluid-qr-code value="hello" eye-shape="circle"></fluid-qr-code>`);
    const frame = svgOf(el).querySelector('[part="eye-frame"]')!;
    expect(frame.tagName.toLowerCase()).to.equal("circle");
  });

  it("applies a per-eye color override", async () => {
    const el = await qr(
      html`<fluid-qr-code value="hello" eye-color="#4f46e5" eye-color-top-left="#db2777"></fluid-qr-code>`
    );
    const frames = Array.from(svgOf(el).querySelectorAll('[part="eye-frame"]'));
    // top-left eye is rendered first.
    expect(frames[0]!.getAttribute("stroke")).to.equal("#db2777");
    expect(frames[1]!.getAttribute("stroke")).to.equal("#4f46e5");
  });

  it("emits a gradient def when both gradient ends are set", async () => {
    const el = await qr(
      html`<fluid-qr-code value="hello" gradient-from="#4f46e5" gradient-to="#db2777"></fluid-qr-code>`
    );
    expect(svgOf(el).querySelector("linearGradient#fluid-qr-grad")).to.exist;
    const mod = svgOf(el).querySelector('[part="module"]')!;
    expect(mod.getAttribute("fill")).to.equal("url(#fluid-qr-grad)");
  });

  it("uses the custom label as the accessible name when provided", async () => {
    const el = await qr(html`<fluid-qr-code value="https://x" label="Open the Fluid docs"></fluid-qr-code>`);
    expect(svgOf(el).getAttribute("aria-label")).to.equal("Open the Fluid docs");
  });

  it("toDataURL returns a PNG data URI", async () => {
    const el = await qr(html`<fluid-qr-code value="hello fluid" size="120"></fluid-qr-code>`);
    const url = await el.toDataURL();
    expect(url).to.match(/^data:image\/png;base64,/);
  });

  it("passes the a11y audit", async () => {
    const host = await fixture<HTMLElement>(html`
      <div
        style="
          --fluid-surface-base: #ffffff;
          --fluid-text-primary: #18181b;
        "
      >
        <fluid-qr-code value="https://fluid.example.com" size="200" label="Open Fluid"></fluid-qr-code>
      </div>
    `);
    const el = host.querySelector<FluidQrCode>("fluid-qr-code")!;
    await elementUpdated(el);
    await aTimeout(20);
    await expect(el).to.be.accessible();
  });
});
