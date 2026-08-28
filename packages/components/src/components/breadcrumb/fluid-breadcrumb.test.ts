import { expect, fixture, html } from "@open-wc/testing";
import "./define.js";
import "../../locales/nl.js";
import "../../locales/de.js";
import "../../locales/fr.js";
import "../../locales/es.js";
import "../../locales/ar.js";
import type { FluidBreadcrumb } from "./fluid-breadcrumb.js";
import type { FluidBreadcrumbItem } from "./fluid-breadcrumb-item.js";

describe("<fluid-breadcrumb> host label ownership", () => {
  it("keeps the published arialabel markup alias while exposing canonical host ARIA", async () => {
    const control = await fixture<HTMLElement & { updateComplete: Promise<boolean> }>(
      '<fluid-breadcrumb lang="nl" arialabel="Legacy application label"></fluid-breadcrumb>'
    );
    await control.updateComplete;
    expect(control.ariaLabel).to.equal("Legacy application label");
    expect(control.getAttribute("aria-label")).to.equal("Legacy application label");
    control.setAttribute("arialabel", "");
    await control.updateComplete;
    expect(control.getAttribute("aria-label")).to.equal("");
    control.removeAttribute("arialabel");
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
    expect(control.getAttribute("aria-label")).to.equal("Kruimelpad");
  });
  type NamedControl = HTMLElement & { updateComplete: Promise<boolean> };
  const mount = () =>
    fixture<HTMLDivElement>('<div lang="en"><fluid-breadcrumb></fluid-breadcrumb></div>');
  async function settle(control: NamedControl): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await control.updateComplete;
  }

  for (const [locale, expected] of [
    ["nl", "Kruimelpad"],
    ["de", "Brotkrümelnavigation"],
    ["fr", "Fil d’Ariane"],
    ["es", "Migas de pan"],
    ["ar", "مسار التنقل"],
    ["fr-CA", "Fil d’Ariane"]
  ] as const) {
    it(`updates the owned host name for ${locale} and after reconnect`, async () => {
      const wrapper = await mount();
      const control = wrapper.firstElementChild as NamedControl;
      expect(control.getAttribute("aria-label")).to.equal("Breadcrumb");
      wrapper.lang = locale;
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(expected);
      control.remove();
      wrapper.lang = "nl";
      wrapper.append(control);
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal("Kruimelpad");
    });
  }

  for (const explicit of ["", "Breadcrumb", "Application name"]) {
    it(`preserves initially authored ${JSON.stringify(explicit)} through locale changes and reconnect`, async () => {
      const control = document.createElement("fluid-breadcrumb") as NamedControl;
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
      expect(control.getAttribute("aria-label")).to.equal("Fil d’Ariane");
    });
  }

  it("recognizes late same-value writes as application ownership and restores removed overrides immediately", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Breadcrumb", "", "Application name"]) {
      control.setAttribute("aria-label", explicit);
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.removeAttribute("aria-label");
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Fil d’Ariane" : "Kruimelpad"
    );
  });

  it("preserves native ariaLabel property writes, including equal defaults, empty strings and null reset", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    for (const explicit of ["Breadcrumb", "", "Property name"]) {
      control.ariaLabel = explicit;
      wrapper.lang = wrapper.lang === "fr" ? "nl" : "fr";
      await settle(control);
      expect(control.ariaLabel).to.equal(explicit);
      expect(control.getAttribute("aria-label")).to.equal(explicit);
    }
    control.ariaLabel = null;
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal(
      wrapper.lang === "fr" ? "Fil d’Ariane" : "Kruimelpad"
    );
  });

  it("withdraws only its owned fallback while aria-labelledby exists and restores it on removal", async () => {
    const wrapper = await mount();
    const control = wrapper.firstElementChild as NamedControl;
    const label = document.createElement("span");
    label.id = "application-breadcrumb-label";
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
    expect(control.getAttribute("aria-label")).to.equal("Fil d’Ariane");
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
    const control = document.createElement("fluid-breadcrumb") as NamedControl;
    root.append(control);
    wrapper.append(context);
    await settle(control);
    context.lang = "fr-CA";
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Fil d’Ariane");
    control.remove();
    control.setAttribute("aria-label", "Breadcrumb");
    context.lang = "nl";
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Breadcrumb");
    control.remove();
    control.removeAttribute("aria-label");
    root.append(control);
    await settle(control);
    expect(control.getAttribute("aria-label")).to.equal("Kruimelpad");
  });
});

describe("<fluid-breadcrumb>", () => {
  it("renders a nav landmark with aria-label", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>Current</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    expect(el.getAttribute("aria-label")).to.equal("Breadcrumb");
    expect(el.shadowRoot!.querySelector("nav")).to.exist;
  });

  it("auto-marks the last item as current when none is explicit", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    const items = el.querySelectorAll("fluid-breadcrumb-item");
    expect(items[items.length - 1]!.getAttribute("aria-current")).to.equal("page");
  });

  it("respects an explicit current attribute", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item current>Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/d">Docs</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    const items = el.querySelectorAll("fluid-breadcrumb-item");
    expect(items[0]!.getAttribute("aria-current")).to.equal("page");
    expect(items[1]!.hasAttribute("aria-current")).to.be.false;
  });

  it("moves its automatic current marker when a later item is appended", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>Docs</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    const appended = document.createElement("fluid-breadcrumb-item") as FluidBreadcrumbItem;
    appended.textContent = "API";
    el.append(appended);
    await el.updateComplete;
    await appended.updateComplete;

    const items = Array.from(el.querySelectorAll<FluidBreadcrumbItem>("fluid-breadcrumb-item"));
    expect(items.map((item) => item.getAttribute("aria-current"))).to.deep.equal([
      null,
      null,
      "page"
    ]);
    expect(items.map((item) => item.hasAttribute("data-fluid-last"))).to.deep.equal([
      false,
      false,
      true
    ]);
  });

  it("keeps an authored current item while moving the visual-last marker", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item current>Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    const appended = document.createElement("fluid-breadcrumb-item") as FluidBreadcrumbItem;
    appended.href = "/api";
    appended.textContent = "API";
    el.append(appended);
    await el.updateComplete;
    await appended.updateComplete;

    const items = Array.from(el.querySelectorAll<FluidBreadcrumbItem>("fluid-breadcrumb-item"));
    expect(items.map((item) => item.getAttribute("aria-current"))).to.deep.equal([
      "page",
      null,
      null
    ]);
    expect(items.map((item) => item.hasAttribute("data-fluid-last"))).to.deep.equal([
      false,
      false,
      true
    ]);
  });

  it("reconciles current and separator ownership when the last item is hidden", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    const items = Array.from(el.querySelectorAll<FluidBreadcrumbItem>("fluid-breadcrumb-item"));
    items[2]!.hidden = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(items.map((item) => item.updateComplete));

    expect(items.map((item) => item.getAttribute("aria-current"))).to.deep.equal([
      null,
      "page",
      null
    ]);
    expect(items.map((item) => item.hasAttribute("data-fluid-last"))).to.deep.equal([
      false,
      true,
      false
    ]);
  });

  it("reacts to current and href transitions without leaving stale link semantics", async () => {
    const item = await fixture<FluidBreadcrumbItem>(html`
      <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
    `);
    expect(item.shadowRoot!.querySelector("a")?.getAttribute("href")).to.equal("/docs");
    item.current = true;
    await item.updateComplete;
    expect(item.getAttribute("aria-current")).to.equal("page");
    expect(item.shadowRoot!.querySelector("a")).to.equal(null);
    item.current = false;
    item.href = "/api";
    await item.updateComplete;
    expect(item.hasAttribute("aria-current")).to.equal(false);
    expect(item.shadowRoot!.querySelector("a")?.getAttribute("href")).to.equal("/api");
  });

  it("passes a11y audit", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it("hides the trailing separator on the last item only", async () => {
    const el = await fixture<FluidBreadcrumb>(html`
      <fluid-breadcrumb>
        <fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>
        <fluid-breadcrumb-item href="/docs">Docs</fluid-breadcrumb-item>
        <fluid-breadcrumb-item>API</fluid-breadcrumb-item>
      </fluid-breadcrumb>
    `);
    await el.updateComplete;
    const items = Array.from(el.querySelectorAll<FluidBreadcrumbItem>("fluid-breadcrumb-item"));
    await Promise.all(items.map((i) => i.updateComplete));

    const lastSep = items[items.length - 1]!.shadowRoot!.querySelector<HTMLElement>(".separator")!;
    const middleSep = items[1]!.shadowRoot!.querySelector<HTMLElement>(".separator")!;

    expect(getComputedStyle(lastSep).display).to.equal("none");
    expect(getComputedStyle(middleSep).display).to.not.equal("none");
  });

  /* Rework: override ladder. */

  it("link color reads the --fluid-breadcrumb-item-* override ladder", async () => {
    const el = await fixture<FluidBreadcrumbItem>(
      html`<fluid-breadcrumb-item href="/">Home</fluid-breadcrumb-item>`
    );
    el.style.setProperty("--fluid-breadcrumb-item-fg", "rgb(1, 2, 3)");
    await el.updateComplete;
    const link = el.shadowRoot!.querySelector<HTMLElement>("a.label")!;
    expect(getComputedStyle(link).color).to.equal("rgb(1, 2, 3)");
  });
});
