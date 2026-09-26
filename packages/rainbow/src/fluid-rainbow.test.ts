import { expect, fixture, html, elementUpdated } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import { getIcon } from "@fluid-ds/icons/registry";
import { rainbowIconNames, registerRainbowIcons } from "./icons.js";
import type { FluidRainbowBattery } from "./fluid-rainbow-battery.js";
import type { FluidRainbowClock } from "./fluid-rainbow-clock.js";
import type { FluidRainbowLandscape } from "./fluid-rainbow-landscape.js";

describe("<fluid-rainbow-landscape>", () => {
  it("hides the decorative scene and keeps slotted content", async () => {
    const el = await fixture<FluidRainbowLandscape>(
      html`<fluid-rainbow-landscape><h2>Hello</h2></fluid-rainbow-landscape>`
    );
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).to.equal("true");
    expect(svg.hasAttribute("role")).to.equal(false);
    await expect(el).to.be.accessible();
  });

  it("exposes the scene as an image when labelled", async () => {
    const el = await fixture<FluidRainbowLandscape>(
      html`<fluid-rainbow-landscape label="Hills at dawn"></fluid-rainbow-landscape>`
    );
    const svg = el.shadowRoot!.querySelector("svg")!;
    expect(svg.getAttribute("role")).to.equal("img");
    expect(svg.getAttribute("aria-label")).to.equal("Hills at dawn");
    expect(svg.hasAttribute("aria-hidden")).to.equal(false);
  });

  it("stops all motion with the still attribute", async () => {
    const el = await fixture<FluidRainbowLandscape>(
      html`<fluid-rainbow-landscape still></fluid-rainbow-landscape>`
    );
    const base = el.shadowRoot!.querySelector<HTMLElement>(".base")!;
    const cloud = el.shadowRoot!.querySelector<SVGElement>(".cloud")!;
    expect(getComputedStyle(base).animationName).to.equal("none");
    expect(getComputedStyle(cloud).animationName).to.equal("none");
  });

  it("reads its outline from the component knob", async () => {
    const el = await fixture<FluidRainbowLandscape>(
      html`<fluid-rainbow-landscape
        style="--fluid-rainbow-landscape-border-width: 4px; --fluid-rainbow-landscape-ink: rgb(1, 2, 3)"
      ></fluid-rainbow-landscape>`
    );
    const base = getComputedStyle(el.shadowRoot!.querySelector<HTMLElement>(".base")!);
    expect(base.borderTopWidth).to.equal("4px");
    expect(base.borderTopColor).to.equal("rgb(1, 2, 3)");
  });
});

describe("<fluid-rainbow-clock>", () => {
  it("renders a fixed moment as a machine-readable <time>", async () => {
    const el = await fixture<FluidRainbowClock>(
      html`<fluid-rainbow-clock
        datetime="2026-04-28T04:09:00"
        hour-cycle="h23"
      ></fluid-rainbow-clock>`
    );
    const time = el.shadowRoot!.querySelector("time")!;
    expect(time.getAttribute("datetime")).to.equal(new Date("2026-04-28T04:09:00").toISOString());
    expect(el.shadowRoot!.querySelector(".time")!.textContent!.trim()).to.equal("04:09");
    expect(el.shadowRoot!.querySelector(".date")!.textContent).to.contain("Tuesday");
    expect(time.hasAttribute("aria-live")).to.equal(false);
    await expect(el).to.be.accessible();
  });

  it("localizes the weekday from the Fluid locale", async () => {
    const el = await fixture<FluidRainbowClock>(
      html`<fluid-rainbow-clock lang="nl" datetime="2026-04-28T04:09:00"></fluid-rainbow-clock>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".date")!.textContent).to.contain("dinsdag");
  });

  it("switches to a 12-hour face and can hide the date", async () => {
    const el = await fixture<FluidRainbowClock>(
      html`<fluid-rainbow-clock
        datetime="2026-04-28T16:45:00"
        hour-cycle="h12"
        hide-date
      ></fluid-rainbow-clock>`
    );
    expect(el.shadowRoot!.querySelector(".time")!.textContent).to.match(/04:45\s?PM/i);
    expect(el.shadowRoot!.querySelector(".date")).to.equal(null);
  });

  it("shows the current time when live and stops ticking when removed", async () => {
    const el = await fixture<FluidRainbowClock>(html`<fluid-rainbow-clock></fluid-rainbow-clock>`);
    const shown = new Date(el.shadowRoot!.querySelector("time")!.getAttribute("datetime")!);
    expect(Math.abs(Date.now() - shown.getTime())).to.be.lessThan(60_000);
    const timer = (el as unknown as { timer?: unknown }).timer;
    expect(timer).to.not.equal(undefined);
    el.remove();
    expect((el as unknown as { timer?: unknown }).timer).to.equal(undefined);
  });
});

describe("<fluid-rainbow-battery>", () => {
  it("is a meter with range, value and a localized percentage", async () => {
    const el = await fixture<FluidRainbowBattery>(
      html`<fluid-rainbow-battery value="95">Battery</fluid-rainbow-battery>`
    );
    expect(el.getAttribute("role")).to.equal("meter");
    expect(el.getAttribute("aria-valuemin")).to.equal("0");
    expect(el.getAttribute("aria-valuemax")).to.equal("100");
    expect(el.getAttribute("aria-valuenow")).to.equal("95");
    expect(el.getAttribute("aria-valuetext")).to.equal("95%");
    await expect(el).to.be.accessible();
  });

  it("clamps the level and sizes the cell", async () => {
    const el = await fixture<FluidRainbowBattery>(
      html`<fluid-rainbow-battery value="140" label="Level"></fluid-rainbow-battery>`
    );
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
    const cell = el.shadowRoot!.querySelector<HTMLElement>(".cell")!;
    expect(cell.style.inlineSize).to.equal("100%");
  });

  it("takes its name from label, then slotted text", async () => {
    const el = await fixture<FluidRainbowBattery>(
      html`<fluid-rainbow-battery value="50">Uptime</fluid-rainbow-battery>`
    );
    expect(el.getAttribute("aria-label")).to.equal("Uptime");
    el.label = "Service uptime";
    await elementUpdated(el);
    expect(el.getAttribute("aria-label")).to.equal("Service uptime");
  });

  it("renders the charging cord and heartbeat only on request, hidden from AT", async () => {
    const el = await fixture<FluidRainbowBattery>(
      html`<fluid-rainbow-battery value="50" label="Uptime"></fluid-rainbow-battery>`
    );
    expect(el.shadowRoot!.querySelector(".cord")).to.equal(null);
    expect(el.shadowRoot!.querySelector(".pulse")).to.equal(null);
    el.charging = true;
    el.pulse = true;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".cord")!.getAttribute("aria-hidden")).to.equal("true");
    expect(el.shadowRoot!.querySelector(".pulse")!.getAttribute("aria-hidden")).to.equal("true");
    await expect(el).to.be.accessible();
  });

  it("formats the shown value in the element's locale", async () => {
    const el = await fixture<FluidRainbowBattery>(
      html`<fluid-rainbow-battery lang="nl" value="99.5" show-value>Uptime</fluid-rainbow-battery>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".value")!.textContent).to.equal("99,5%");
  });
});

describe("rainbow icons", () => {
  it("registers every icon with the shared registry", () => {
    registerRainbowIcons();
    expect(rainbowIconNames.length).to.equal(14);
    for (const name of rainbowIconNames) {
      const svg = getIcon(name)!;
      expect(svg, name).to.contain("<svg");
      expect(svg, name).to.contain('aria-hidden="true"');
    }
  });
});
