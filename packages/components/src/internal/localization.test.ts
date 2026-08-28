import { expect, fixture, html, aTimeout } from "@open-wc/testing";
import { FluidElement } from "./base-element.js";
import { english, registerTranslation, unregisterTranslation } from "./localization.js";
import { ar } from "../locales/ar.js";
import { arXB } from "../locales/ar-xb.js";
import { de } from "../locales/de.js";
import { es } from "../locales/es.js";
import { fr } from "../locales/fr.js";
import { nl } from "../locales/nl.js";
import { enXA } from "../locales/en-xa.js";

class LocalizationProbe extends FluidElement {
  renders = 0;

  override render() {
    this.renders++;
    return html`<span data-dir=${this.localize.dir} data-locale=${this.localize.locale}
      >${this.term("dismiss")} | ${this.term("page", 3)}</span
    >`;
  }
}

class LocalizationSurfaceProbe extends FluidElement {
  override render() {
    const caller = 'Caller <content> & "العربية"';
    return html`<div data-dir=${this.localize.dir}>
      <span>${this.term("chooseDateRequired")}</span>
      <span>${this.term("playbackPosition", "1:02", caller)}</span>
      <span>${this.term("eventsOnDate", 3, "٣", caller)}</span>
      <span>${this.term("openingTime", caller, "٢")}</span>
      <span>${this.term("editorLinkUrl")}</span>
      <span>${this.term("kanbanMovedCard", caller, "Column <A>", "٢", "٣")}</span>
      <span>${this.term("nodeGraphNodeMoved", caller, "١٫٥", "−٢")}</span>
      <span>${this.term("tableColumnPosition", caller, "٢", "٥")}</span>
      <span>${this.term("chartLegendItem", caller, "٢")}</span>
      <span>${this.term("map")}</span>
      <span>${this.term("markdownLoadFailed", caller)}</span>
      <span>${this.term("qrCodeFor", caller)}</span>
      <span>${this.term("parserTransformFailed", caller, "Caller <reason>")}</span>
    </div>`;
  }
}

if (!customElements.get("localization-probe")) {
  customElements.define("localization-probe", LocalizationProbe);
}
if (!customElements.get("localization-surface-probe")) {
  customElements.define("localization-surface-probe", LocalizationSurfaceProbe);
}

async function settle(probe: FluidElement): Promise<void> {
  await aTimeout(0);
  await probe.updateComplete;
}

function appendShadowProbe(host: HTMLElement, mode: ShadowRootMode = "open") {
  const root = host.attachShadow({ mode });
  const wrapper = document.createElement("section");
  const probe = document.createElement("localization-probe") as LocalizationProbe;
  wrapper.append(probe);
  root.append(wrapper);
  return { root, wrapper, probe };
}

describe("Fluid localization", () => {
  for (const dictionary of [english, nl, de, fr, es, ar, enXA, arXB]) {
    it(`executes every parameterized term in ${dictionary.$code}`, () => {
      for (const [key, value] of Object.entries(dictionary)) {
        if (typeof value !== "function") continue;

        // Most message parameters are application-owned display strings. The
        // binary-unit formatter is the sole callback with constrained enum
        // inputs, so give it a representative valid tuple explicitly.
        const args =
          key === "binaryUnit"
            ? ["one", "1", "byte"]
            : Array.from({ length: value.length }, (_, index) =>
                index === 0 ? 2 : `sentinel-${index}`
              );
        const message = Reflect.apply(value, dictionary, args);

        expect(message, `${dictionary.$code}: ${key} result`).to.be.a("string").and.not.be.empty;
      }
    });
  }

  for (const dictionary of [english, nl, de, fr, es, ar, enXA, arXB]) {
    it(`keeps exact key, value-kind, and callback-arity parity in ${dictionary.$code}`, () => {
      expect(Object.keys(dictionary).sort()).to.deep.equal(Object.keys(english).sort());
      for (const [key, englishValue] of Object.entries(english)) {
        const translated = Reflect.get(dictionary, key);
        expect(typeof translated, `${dictionary.$code}: ${key} value kind`).to.equal(
          typeof englishValue
        );
        if (typeof englishValue === "function") {
          expect(translated.length, `${dictionary.$code}: ${key} callback arity`).to.equal(
            englishValue.length
          );
        }
      }
    });
  }

  it("stresses representative localized surfaces in both pseudo locales without rewriting arguments", () => {
    const unusual = 'Caller <content> & "العربية"';
    const cases = [
      ["core", english.chooseDateRequired, enXA.chooseDateRequired, arXB.chooseDateRequired],
      [
        "media",
        english.playbackPosition("1:02", unusual),
        enXA.playbackPosition("1:02", unusual),
        arXB.playbackPosition("1:02", unusual)
      ],
      [
        "calendar",
        english.eventsOnDate(3, "٣", unusual),
        enXA.eventsOnDate(3, "٣", unusual),
        arXB.eventsOnDate(3, "٣", unusual)
      ],
      [
        "scheduler",
        english.openingTime(unusual, "٢"),
        enXA.openingTime(unusual, "٢"),
        arXB.openingTime(unusual, "٢")
      ],
      ["editor", english.editorLinkUrl, enXA.editorLinkUrl, arXB.editorLinkUrl],
      [
        "kanban",
        english.kanbanMovedCard(unusual, "Column <A>", "٢", "٣"),
        enXA.kanbanMovedCard(unusual, "Column <A>", "٢", "٣"),
        arXB.kanbanMovedCard(unusual, "Column <A>", "٢", "٣")
      ],
      [
        "node graph",
        english.nodeGraphNodeMoved(unusual, "١٫٥", "−٢"),
        enXA.nodeGraphNodeMoved(unusual, "١٫٥", "−٢"),
        arXB.nodeGraphNodeMoved(unusual, "١٫٥", "−٢")
      ],
      [
        "table",
        english.tableColumnPosition(unusual, "٢", "٥"),
        enXA.tableColumnPosition(unusual, "٢", "٥"),
        arXB.tableColumnPosition(unusual, "٢", "٥")
      ],
      [
        "charts",
        english.chartLegendItem(unusual, "٢"),
        enXA.chartLegendItem(unusual, "٢"),
        arXB.chartLegendItem(unusual, "٢")
      ],
      ["map", english.map, enXA.map, arXB.map],
      [
        "markdown",
        english.markdownLoadFailed(unusual),
        enXA.markdownLoadFailed(unusual),
        arXB.markdownLoadFailed(unusual)
      ],
      ["QR", english.qrCodeFor(unusual), enXA.qrCodeFor(unusual), arXB.qrCodeFor(unusual)],
      [
        "parser",
        english.parserTransformFailed(unusual, "Caller <reason>"),
        enXA.parserTransformFailed(unusual, "Caller <reason>"),
        arXB.parserTransformFailed(unusual, "Caller <reason>")
      ]
    ] as const;
    for (const [surface, source, expanded, mirrored] of cases) {
      expect(expanded, `${surface}: expansion marker`).to.match(/^\[!! .+ ~{3,} !!\]$/);
      expect(expanded.length, `${surface}: expanded length`).to.be.greaterThan(source.length);
      expect(mirrored, `${surface}: mirrored wrapper`).to.equal(`\u202e[${source}]\u202c`);
    }
    for (const argument of [unusual, "Column <A>", "Caller <reason>", "٣", "٢", "٥"]) {
      expect(enXA.qrCodeFor(argument)).to.include(argument);
      expect(arXB.qrCodeFor(argument)).to.include(argument);
    }
  });

  it("switches representative surface messages live between expanded LTR and mirrored RTL", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="en-XA"><localization-surface-probe></localization-surface-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationSurfaceProbe>("localization-surface-probe")!;
    await settle(probe);
    const spans = () =>
      [...probe.shadowRoot!.querySelectorAll("span")].map((span) => span.textContent!);
    expect(probe.shadowRoot!.querySelector("div")!.dataset.dir).to.equal("ltr");
    expect(spans()).to.have.length(13);
    expect(spans().every((message) => message.startsWith("[!! "))).to.equal(true);
    expect(probe.shadowRoot!.textContent).to.include('Caller <content> & "العربية"');

    wrapper.lang = "ar-XB";
    await settle(probe);
    expect(probe.shadowRoot!.querySelector("div")!.dataset.dir).to.equal("rtl");
    expect(
      spans().every((message) => message.startsWith("\u202e[") && message.endsWith("]\u202c"))
    ).to.equal(true);
    expect(probe.shadowRoot!.textContent).to.include('Caller <content> & "العربية"');
  });

  for (const dictionary of [english, nl, de, fr, es, ar, enXA, arXB]) {
    it(`supplies host-name defaults in ${dictionary.$code}`, () => {
      for (const key of ["meter", "notifications"]) {
        expect(Object.hasOwn(dictionary, key), `${dictionary.$code}: ${key}`).to.equal(true);
        expect(Reflect.get(dictionary, key)).to.be.a("string").and.not.equal("");
      }
    });
  }

  for (const dictionary of [nl, de, fr, es, ar, enXA, arXB]) {
    it(`supplies every core default-label term in ${dictionary.$code}`, () => {
      for (const key of [
        "onThisPage",
        "openMenu",
        "alert",
        "notification",
        "copyCode",
        "areYouSure",
        "confirm",
        "minimum",
        "maximum",
        "actions",
        "resizePanels",
        "remove",
        "available",
        "selected",
        "pricingPlans",
        "mostPopular",
        "clear",
        "undo",
        "upload",
        "fit",
        "copyLanguageCode",
        "dropFilesOrBrowse"
      ] as const) {
        expect(Object.hasOwn(english, key), `English contract: ${key}`).to.equal(true);
        expect(Object.hasOwn(dictionary, key), `${dictionary.$code}: ${key}`).to.equal(true);
        const value = Reflect.get(dictionary, key);
        if (key === "copyLanguageCode") {
          expect(value).to.be.a("function");
          if (typeof value !== "function") throw new TypeError("copyLanguageCode must be callable");
          const formatted = value("ApplicationLanguage");
          if (dictionary.$code === "en-XA") {
            expect(formatted).to.equal("[!! Côpÿ ApplicationLanguage côdë ~~~~~ !!]");
          } else if (dictionary.$code === "ar-XB") {
            expect(formatted).to.equal("\u202e[Copy ApplicationLanguage code]\u202c");
          } else {
            expect(formatted).to.be.a("string").and.contain("ApplicationLanguage");
          }
        } else {
          expect(value).to.be.a("string").and.not.equal("");
        }
      }
    });
  }

  for (const dictionary of [nl, de, fr, es, ar, enXA, arXB]) {
    it(`supplies every core-form validation and upload term in ${dictionary.$code}`, () => {
      for (const key of [
        "invalidHexColor",
        "chooseColorRequired",
        "completeField",
        "selectFileRequired",
        "chooseDateRequired",
        "chooseDateRangeRequired",
        "chooseTimeRequired",
        "multipleFilesHint",
        "singleFileHint"
      ] as const) {
        expect(Object.hasOwn(english, key), `English contract: ${key}`).to.equal(true);
        expect(Object.hasOwn(dictionary, key), `${dictionary.$code}: ${key}`).to.equal(true);
        const translated = Reflect.get(dictionary, key);
        expect(translated).to.be.a("string").and.not.equal("");
        expect(translated).not.to.equal(Reflect.get(english, key));
      }
    });
  }

  for (const dictionary of [nl, de, fr, es, ar, enXA, arXB]) {
    it(`keeps all registered keys and new validation/disclosure terms complete in ${dictionary.$code}`, () => {
      expect(Object.keys(dictionary).sort()).to.deep.equal(Object.keys(english).sort());
      for (const key of [
        "checkThisBox",
        "toggleThisSwitch",
        "pickAnOption",
        "completeCode",
        "showMore",
        "showLess"
      ] as const) {
        expect(dictionary[key]).to.be.a("string").and.not.equal("");
        expect(dictionary[key]).not.to.equal(english[key]);
      }
    });
  }

  it("uses English as the fallback", async () => {
    const el = await fixture<LocalizationProbe>(html`<localization-probe></localization-probe>`);
    expect(el.shadowRoot!.textContent).to.contain("Dismiss");
  });

  it("normalizes malformed HTML language values to the safe English formatter locale", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="undefined"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    const output = probe.shadowRoot!.querySelector("span")!;
    expect(output.dataset.locale).to.equal("en");
    expect(output.textContent).to.contain("Dismiss");
    expect(() => new Intl.NumberFormat(output.dataset.locale).format(1234)).not.to.throw();
  });

  it("keeps registered application dictionaries available while exposing a safe Intl locale", async () => {
    registerTranslation({ $code: "en-x-application-locale", dismiss: "Application close" });
    try {
      const probe = await fixture<LocalizationProbe>(html`
        <localization-probe lang="en-x-application-locale"></localization-probe>
      `);
      const output = probe.shadowRoot!.querySelector("span")!;
      expect(output.textContent).to.contain("Application close");
      expect(output.dataset.locale).to.equal("en");
      expect(() => new Intl.NumberFormat(output.dataset.locale).format(1234)).not.to.throw();
    } finally {
      unregisterTranslation("en-x-application-locale");
    }
  });

  it("uses the nearest registered language and its writing direction", async () => {
    registerTranslation({ $code: "ar-test", $dir: "rtl", dismiss: "إغلاق" });
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar-test"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    expect(probe.shadowRoot!.textContent).to.contain("إغلاق");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
    unregisterTranslation("ar-test");
  });

  it("reacts when an ancestor language changes", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    wrapper.lang = "nl";
    await aTimeout(0);
    await probe.updateComplete;
    expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    expect(probe.shadowRoot!.textContent).to.contain("Pagina 3");
  });

  for (const [locale, close, page] of [
    ["de", "Schließen", "Seite 3"],
    ["es", "Cerrar", "Página 3"],
    ["fr-CA", "Fermer", "Page 3"],
    ["nl-NL", "Sluiten", "Pagina 3"]
  ] as const) {
    it(`ships a complete ${locale} locale with regional fallback`, async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang=${locale}><localization-probe></localization-probe></div>
      `);
      const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
      await probe.updateComplete;
      expect(probe.shadowRoot!.textContent).to.contain(close);
      expect(probe.shadowRoot!.textContent).to.contain(page);
    });
  }

  it("uses Arabic strings and RTL direction", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    const output = probe.shadowRoot!.querySelector("span")!;
    expect(output.textContent).to.contain("إغلاق");
    expect(output.dataset.dir).to.equal("rtl");
  });

  it("ships an expanded accented pseudo-locale", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="en-XA"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    const output = probe.shadowRoot!.querySelector("span")!;
    expect(output.textContent).to.contain("Dïsmïss");
    expect(output.textContent).to.contain("~~~");
    expect(output.dataset.dir).to.equal("ltr");
  });

  it("ships a mirrored RTL pseudo-locale", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar-XB"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    const output = probe.shadowRoot!.querySelector("span")!;
    expect(output.textContent).to.contain("\u202e[Dismiss]\u202c");
    expect(output.dataset.dir).to.equal("rtl");
  });

  it("lets an explicit direction override the locale direction", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar" dir="ltr"><localization-probe></localization-probe></div>
    `);
    const probe = wrapper.querySelector<LocalizationProbe>("localization-probe")!;
    await probe.updateComplete;
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("ltr");
  });

  it("inherits language and explicit direction through nested open and closed shadow roots", async () => {
    const host = await fixture<HTMLDivElement>(html`<div lang="nl" dir="rtl"></div>`);
    const outer = host.attachShadow({ mode: "open" });
    const inner = document.createElement("div");
    outer.append(inner);
    const { probe } = appendShadowProbe(inner, "closed");
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
  });

  it("reacts to language and direction changes inside a containing shadow root", async () => {
    const host = await fixture<HTMLDivElement>(html`<div lang="en"></div>`);
    const { wrapper, probe } = appendShadowProbe(host);
    wrapper.lang = "nl";
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    wrapper.lang = "ar";
    wrapper.dir = "ltr";
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("إغلاق");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("ltr");
    wrapper.removeAttribute("dir");
    await settle(probe);
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
  });

  it("keeps inner overrides scoped and restores outer context when they are removed", async () => {
    const host = await fixture<HTMLDivElement>(html`<div lang="de" dir="rtl"></div>`);
    const { wrapper, probe } = appendShadowProbe(host);
    wrapper.lang = "nl";
    wrapper.dir = "ltr";
    await settle(probe);
    host.lang = "ar";
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("ltr");
    wrapper.removeAttribute("lang");
    wrapper.removeAttribute("dir");
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("إغلاق");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
  });

  it("observes a component's own lang and dir attributes inside a closed shadow root", async () => {
    const host = await fixture<HTMLDivElement>(html`<div lang="en"></div>`);
    const { probe } = appendShadowProbe(host, "closed");
    await settle(probe);
    probe.lang = "fr-CA";
    probe.dir = "rtl";
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Fermer");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
  });

  it("keeps slotted content in its light-DOM language and direction context", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div lang="nl" dir="ltr"><localization-probe></localization-probe></div>`
    );
    const root = host.attachShadow({ mode: "open" });
    const wrapper = document.createElement("section");
    wrapper.lang = "ar";
    wrapper.dir = "rtl";
    wrapper.append(document.createElement("slot"));
    root.append(wrapper);
    const probe = host.querySelector<LocalizationProbe>("localization-probe")!;
    await settle(probe);
    expect(probe.assignedSlot).not.to.equal(null);
    expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("ltr");
    host.lang = "de";
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Schließen");
  });

  it("rerenders on reconnect and releases observation of its former shadow context", async () => {
    const container = await fixture<HTMLDivElement>(
      html`<div>
        <div lang="nl"></div>
        <div lang="de"></div>
      </div>`
    );
    const first = appendShadowProbe(container.children[0] as HTMLElement, "closed");
    const secondRoot = container.children[1]!.attachShadow({ mode: "closed" });
    const next = document.createElement("section");
    secondRoot.append(next);
    await settle(first.probe);
    next.append(first.probe);
    await settle(first.probe);
    expect(first.probe.shadowRoot!.textContent).to.contain("Schließen");
    const renders = first.probe.renders;
    first.wrapper.lang = "ar";
    await settle(first.probe);
    expect(first.probe.renders).to.equal(renders);
    next.lang = "fr";
    await settle(first.probe);
    expect(first.probe.shadowRoot!.textContent).to.contain("Fermer");
  });

  it("shares root observers until the last subscriber disconnects and restarts on reconnect", async () => {
    const originalObserve = MutationObserver.prototype.observe;
    const originalDisconnect = MutationObserver.prototype.disconnect;
    const observed = new Map<MutationObserver, Node>();
    const disconnected = new Set<MutationObserver>();
    MutationObserver.prototype.observe = function (target, options) {
      observed.set(this, target);
      return originalObserve.call(this, target, options);
    };
    MutationObserver.prototype.disconnect = function () {
      disconnected.add(this);
      return originalDisconnect.call(this);
    };
    let host: HTMLDivElement | undefined;
    try {
      host = await fixture<HTMLDivElement>(html`<div lang="nl"></div>`);
      const { root, wrapper, probe } = appendShadowProbe(host);
      const sibling = document.createElement("localization-probe") as LocalizationProbe;
      wrapper.append(sibling);
      await settle(sibling);
      const rootObservers = [...observed].filter(([, target]) => target === root);
      expect(rootObservers).to.have.length(1);
      const shared = rootObservers[0]![0];
      probe.remove();
      expect(disconnected.has(shared)).to.equal(false);
      wrapper.lang = "de";
      await settle(sibling);
      expect(sibling.shadowRoot!.textContent).to.contain("Schließen");
      sibling.remove();
      expect(disconnected.has(shared)).to.equal(true);
      const documentObservers = [...observed].filter(
        ([, target]) => target === document || target === document.documentElement
      );
      expect(documentObservers).to.have.length(1);
      expect(disconnected.has(documentObservers[0]![0])).to.equal(true);
      wrapper.append(probe);
      await settle(probe);
      expect([...observed].filter(([, target]) => target === root)).to.have.length(2);
      wrapper.lang = "fr";
      await settle(probe);
      expect(probe.shadowRoot!.textContent).to.contain("Fermer");
    } finally {
      host?.remove();
      MutationObserver.prototype.observe = originalObserve;
      MutationObserver.prototype.disconnect = originalDisconnect;
    }
  });

  it("updates connected shadow descendants after late registration and unregister", async () => {
    const host = await fixture<HTMLDivElement>(html`<div lang="zz-fluid"></div>`);
    const { probe } = appendShadowProbe(host);
    await settle(probe);
    expect(probe.shadowRoot!.textContent).to.contain("Dismiss");
    try {
      registerTranslation({ $code: "zz-fluid", $dir: "rtl", dismiss: "Late translation" });
      await settle(probe);
      expect(probe.shadowRoot!.textContent).to.contain("Late translation");
      expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("rtl");
      unregisterTranslation("zz-fluid");
      await settle(probe);
      expect(probe.shadowRoot!.textContent).to.contain("Dismiss");
      expect(probe.shadowRoot!.querySelector("span")!.dataset.dir).to.equal("ltr");
    } finally {
      unregisterTranslation("zz-fluid");
    }
  });

  it("preserves exact regional overrides, English missing-term fallback, and base fallback after unregister", async () => {
    registerTranslation({ $code: "de-AT", dismiss: "Regional close" });
    try {
      const probe = await fixture<LocalizationProbe>(
        html`<localization-probe lang="de-AT"></localization-probe>`
      );
      expect(probe.shadowRoot!.textContent).to.contain("Regional close | Page 3");
      unregisterTranslation("de-AT");
      await settle(probe);
      expect(probe.shadowRoot!.textContent).to.contain("Schließen | Seite 3");
    } finally {
      unregisterTranslation("de-AT");
    }
  });

  it("does not rerender a disconnected component when dictionaries or ancestors change", async () => {
    const host = await fixture<HTMLDivElement>(
      html`<div lang="zz-detached"><localization-probe></localization-probe></div>`
    );
    const probe = host.querySelector<LocalizationProbe>("localization-probe")!;
    probe.remove();
    const renders = probe.renders;
    try {
      registerTranslation({ $code: "zz-detached", dismiss: "Detached translation" });
      host.lang = "nl";
      await settle(probe);
      expect(probe.renders).to.equal(renders);
      host.append(probe);
      await settle(probe);
      expect(probe.shadowRoot!.textContent).to.contain("Sluiten");
    } finally {
      unregisterTranslation("zz-detached");
    }
  });
});
