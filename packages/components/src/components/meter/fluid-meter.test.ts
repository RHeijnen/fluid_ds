import { expect, fixture, html, elementUpdated, aTimeout } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidMeter } from "./fluid-meter.js";

const tokens = [
  "--fluid-surface-base:#ffffff",
  "--fluid-surface-muted:#f4f4f5",
  "--fluid-text-primary:#18181b",
  "--fluid-text-secondary:#3f3f46",
  "--fluid-border-default:#e4e4e7",
  "--fluid-accent-base:#4f46e5",
  "--fluid-accent-text:#ffffff",
  "--fluid-success-base:#15803d",
  "--fluid-success-text:#ffffff",
  "--fluid-danger-base:#b91c1c",
  "--fluid-danger-text:#ffffff",
  "--fluid-warning-base:#a16207",
  "--fluid-motion:0"
].join(";");

describe("<fluid-meter> host label ownership", () => {
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () => fixture<HTMLDivElement>('<div lang="en"><fluid-meter></fluid-meter></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Meter"],
    ["de", "Messwert"],
    ["fr", "Jauge"],
    ["es", "Medidor"],
    ["ar", "مقياس"],
    ["fr-CA", "Jauge"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Meter");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Meter");
    });
  }

  for (const explicit of ["", "Meter", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-meter") as NamedControl;
      control.setAttribute("aria-label", explicit);
      const wrapper = await fixture<HTMLDivElement>('<div lang="nl"></div>');
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      wrapper.lang = "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.remove();
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
      control.removeAttribute("aria-label");
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Jauge");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Meter", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(wrapper.lang === "fr" ? "Jauge" : "Meter");
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Meter", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(wrapper.lang === "fr" ? "Jauge" : "Meter");
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-meter-label";
    label.textContent = "Application heading";
    wrapper.append(label);
    control.setAttribute("aria-labelledby", label.id);
    await settle(control);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-labelledby")).to.equal(label.id);
    expect(control.hasAttribute("aria-label")).to.equal(false);
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Jauge");
  });

  it("never removes an authored aria-label when aria-labelledby is added or removed", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    control.setAttribute("aria-label", "Author fallback");
    control.setAttribute("aria-labelledby", "application-external-label");
    wrapper.lang = "fr";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
    control.removeAttribute("aria-labelledby");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Author fallback");
  });

  it("retains ownership after detached edits and follows a closed-shadow locale context", async () => {
    const wrapper = await fixture<HTMLDivElement>('<div lang="en"></div>');
    const context = document.createElement("div");
    const root = context.attachShadow({ mode: "closed" });
    const control = document.createElement("fluid-meter") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Jauge");
    control.remove();
    control.setAttribute("aria-label", "Meter");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Meter");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Meter");
  });
});

describe("<fluid-meter>", () => {
  it("renders a plain-text slot label and updates its owned name when the text changes", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter lang="en">Disk usage</fluid-meter>`);
    const slot = el.shadowRoot!.querySelector("slot");
    expect(slot).to.not.equal(null);
    expect(
      slot!
        .assignedNodes()
        .map((node) => node.textContent)
        .join("")
    ).to.equal("Disk usage");
    expect(el.getAttribute("aria-label")).to.equal("Disk usage");
    el.firstChild!.textContent = "Battery charge";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Battery charge");
  });

  it("handles late slot insertion, replacement and removal without changing the measured value", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter lang="nl" value="42"></fluid-meter>`);
    const label = document.createElement("span");
    label.textContent = "Application reading";
    el.append(label);
    await aTimeout(0);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("slot")!.assignedElements()).to.deep.equal([label]);
    expect(el.getAttribute("aria-label")).to.equal("Application reading");
    label.firstChild!.textContent = "Changed reading";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Changed reading");
    label.remove();
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Meter");
    expect(el.getAttribute("aria-valuenow")).to.equal("42");
  });

  it("prioritizes author ARIA, explicit label including empty, then rendered slot text", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter lang="fr" label="Property label" aria-label="Author name"
        >Slot label</fluid-meter
      >`
    );
    expect(el.getAttribute("aria-label")).to.equal("Author name");
    el.removeAttribute("aria-label");
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Property label");
    el.label = "";
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("");
    el.removeAttribute("label");
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Slot label");
  });

  it("does not name itself from undistributed named-slot content", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter lang="fr"><span slot="unavailable">Not rendered</span></fluid-meter>`
    );
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Jauge");
  });

  it("stops slot observation while detached and refreshes derived text on reconnect", async () => {
    const wrapper = await fixture<HTMLDivElement>(
      html`<div>
        <fluid-meter lang="en"><span>Original</span></fluid-meter>
      </div>`
    );
    const el = wrapper.firstElementChild as FluidMeter;
    await aTimeout(0);
    await el.updateComplete;
    el.remove();
    el.querySelector("span")!.textContent = "Detached change";
    await aTimeout(0);
    expect(el.getAttribute("aria-label")).to.equal("Original");
    wrapper.append(el);
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Detached change");
    el.querySelector("span")!.textContent = "Reconnected change";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("Reconnected change");
  });

  it("keeps application formatting and numeric semantics while localizing its surrounding message", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter lang="en" value="6" max="8" show-value></fluid-meter>`
    );
    el.valueFormatter = (value) => `${value} application-units`;
    await el.updateComplete;
    expect(el.getAttribute("aria-valuetext")).to.equal(
      "6 application-units of 8 application-units"
    );
    el.lang = "ar";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-label")).to.equal("مقياس");
    expect(el.getAttribute("aria-valuenow")).to.equal("6");
    expect(el.getAttribute("aria-valuemax")).to.equal("8");
    expect(el.getAttribute("aria-valuetext")).to.equal(
      "6 application-units من 8 application-units"
    );
  });

  it("localizes default numerals and complete band descriptions on live language changes", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="en">
        <fluid-meter
          value="1.5"
          max="10.5"
          low="3"
          high="7"
          optimum="9"
          show-value
          label="x"
        ></fluid-meter>
      </div>
    `);
    const el = wrapper.querySelector<FluidMeter>("fluid-meter")!;
    expect(el.getAttribute("aria-valuetext")).to.equal("1.5 of 10.5, poor");
    wrapper.lang = "fr";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.getAttribute("aria-valuetext")).to.equal("1,5 sur 10,5, mauvais");
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal(
      "1,5 sur 10,5, mauvais"
    );
    wrapper.lang = "ar";
    await aTimeout(0);
    await el.updateComplete;
    const arabicValue = new Intl.NumberFormat("ar").format(1.5);
    const arabicMaximum = new Intl.NumberFormat("ar").format(10.5);
    expect(el.getAttribute("aria-valuetext")).to.equal(`${arabicValue} من ${arabicMaximum}، ضعيف`);
    expect(el.getAttribute("aria-valuenow")).to.equal("1.5");
    expect(el.getAttribute("aria-valuemax")).to.equal("10.5");
  });

  it("does not round precise default values while localizing decimal punctuation", async () => {
    const el = await fixture<FluidMeter>(html`
      <fluid-meter lang="fr" value="0.123456789" max="1.000000001" show-value></fluid-meter>
    `);
    expect(el.getAttribute("aria-valuetext")).to.equal("0,123456789 sur 1,000000001");
    expect(el.getAttribute("aria-valuenow")).to.equal("0.123456789");
    expect(el.getAttribute("aria-valuemax")).to.equal("1.000000001");
  });

  it("exposes role=meter and the aria value attributes", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="42" label="Score"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("role")).to.equal("meter");
    expect(el.getAttribute("aria-valuemin")).to.equal("0");
    expect(el.getAttribute("aria-valuemax")).to.equal("100");
    expect(el.getAttribute("aria-valuenow")).to.equal("42");
    expect(el.getAttribute("aria-label")).to.equal("Score");
  });

  it("derives the accessible name from a slotted label instead of the generic fallback", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter low="33" high="66" optimum="90">Disk usage</fluid-meter>`
    );
    await elementUpdated(el);
    // No `label` attr and no aria-labelledby: the visible slot text must win,
    // not the generic "Meter" fallback (visible-label / accessible-name match).
    expect(el.getAttribute("aria-label")).to.equal("Disk usage");
  });

  it("falls back to 'Meter' only when there is no slotted label and no label prop", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter value="40"></fluid-meter>`);
    await elementUpdated(el);
    expect(el.getAttribute("aria-label")).to.equal("Meter");
  });

  it("clamps the value into [min, max]", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="150" min="0" max="100" label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuenow")).to.equal("100");
  });

  it("honors a custom min/max range", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="3" min="0" max="8" label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuemin")).to.equal("0");
    expect(el.getAttribute("aria-valuemax")).to.equal("8");
    expect(el.getAttribute("aria-valuenow")).to.equal("3");
    const fill = el.shadowRoot!.querySelector<HTMLElement>(".fill")!;
    // 3 of [0,8] is 37.5%. The component writes "37.50%", but the CSSOM
    // serializes the inline width back without the trailing zero.
    expect(fill.style.width).to.equal("37.5%");
  });

  it("conveys the band in aria-valuetext, never color alone", async () => {
    // optimum high (90): value 85 in the high segment is good.
    const good = await fixture<FluidMeter>(
      html`<fluid-meter value="85" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(good);
    expect(good.getAttribute("aria-valuetext")).to.contain("good");

    // value 50 (medium segment) is one step from the high optimum: fair.
    const fair = await fixture<FluidMeter>(
      html`<fluid-meter value="50" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(fair);
    expect(fair.getAttribute("aria-valuetext")).to.contain("fair");

    // value 10 (low segment) is two steps from the high optimum: poor.
    const poor = await fixture<FluidMeter>(
      html`<fluid-meter value="10" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(poor);
    expect(poor.getAttribute("aria-valuetext")).to.contain("poor");
  });

  it("maps each band to a status-tone fill class", async () => {
    const poor = await fixture<FluidMeter>(
      html`<fluid-meter value="10" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(poor);
    expect(poor.shadowRoot!.querySelector(".fill")!.classList.contains("band-even-less-good")).to.be
      .true;

    const good = await fixture<FluidMeter>(
      html`<fluid-meter value="85" low="33" high="66" optimum="90" label="x"></fluid-meter>`
    );
    await elementUpdated(good);
    expect(good.shadowRoot!.querySelector(".fill")!.classList.contains("band-optimum")).to.be.true;
  });

  it("omits the band from value text when no banding is configured", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter value="40" label="x"></fluid-meter>`);
    await elementUpdated(el);
    expect(el.getAttribute("aria-valuetext")).to.equal("40 of 100");
  });

  it("shows the value text when show-value is set", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="33" show-value label="x"></fluid-meter>`
    );
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal("33 of 100");
  });

  it("applies a custom formatter to the value text", async () => {
    const el = await fixture<FluidMeter>(
      html`<fluid-meter value="6.2" min="0" max="8" show-value label="x"></fluid-meter>`
    );
    el.valueFormatter = (v) => `${v.toFixed(1)} V`;
    await elementUpdated(el);
    expect(el.shadowRoot!.querySelector(".value-text")!.textContent?.trim()).to.equal(
      "6.2 V of 8.0 V"
    );
  });

  it("fill reads the --fluid-meter-* override ladder", async () => {
    const el = await fixture<FluidMeter>(html`<fluid-meter value="50" label="x"></fluid-meter>`);
    el.style.setProperty("--fluid-meter-fill", "rgb(1, 2, 3)");
    await elementUpdated(el);
    const fill = el.shadowRoot!.querySelector<HTMLElement>(".fill")!;
    expect(getComputedStyle(fill).backgroundColor).to.equal("rgb(1, 2, 3)");
  });

  it("passes an a11y audit", async () => {
    const el = await fixture<FluidMeter>(html`
      <div style="${tokens}">
        <fluid-meter value="72" low="33" high="66" optimum="80" show-value label="Disk usage">
          Disk usage
        </fluid-meter>
      </div>
    `);
    const meter = el.querySelector<FluidMeter>("fluid-meter")!;
    await elementUpdated(meter);
    await aTimeout(20);
    await expect(meter).to.be.accessible();
  });
});
