import { test, expect } from "@playwright/test";
import { prepareVisualFixture } from "../fixtures/fixture-helpers.js";

const fixture = {
  id: "visual-guard",
  tags: ["fluid-probe"],
  fixtures: [{ tag: "fluid-probe", storyId: "visual-guard", setupButtons: [] as string[] }]
};

test("visual guard rejects absent claimed elements despite unrelated story content", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><button>Unrelated content</button></div>');
  await expect(prepareVisualFixture(page, fixture, 100)).rejects.toThrow(/must render fluid-probe/);
});

test("visual guard rejects unregistered claimed elements", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await expect(prepareVisualFixture(page, fixture, 100)).rejects.toThrow(/must be upgraded/);
});

test("visual guard accepts upgraded hidden utilities", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe hidden></fluid-probe></div>');
  await page.evaluate(() => customElements.define("fluid-probe", class extends HTMLElement {}));
  const guard = await prepareVisualFixture(page, fixture);
  await guard.assertAttached();
  await expect(page.locator("fluid-probe")).toBeHidden();
  await guard.dispose();
});

test("visual guard finds an upgraded child inside a shadow root", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><div id="parent"></div></div>');
  await page.evaluate(() => {
    customElements.define("fluid-probe", class extends HTMLElement {});
    document.querySelector("#parent")!.attachShadow({ mode: "open" }).innerHTML =
      "<fluid-probe></fluid-probe>";
  });
  const guard = await prepareVisualFixture(page, fixture);
  await guard.assertAttached();
  await guard.dispose();
});

test("visual guard performs shared creation actions once and validates every resulting tag", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><button>Show result</button></div>');
  await page.evaluate(() => {
    customElements.define("fluid-probe", class extends HTMLElement {});
    customElements.define("fluid-child", class extends HTMLElement {});
    document.querySelector("button")!.addEventListener("click", () => {
      const parent = document.createElement("fluid-probe");
      parent.attachShadow({ mode: "open" }).append(document.createElement("fluid-child"));
      document.querySelector("#storybook-root")!.append(parent);
    });
  });
  const guard = await prepareVisualFixture(page, {
    id: fixture.id,
    tags: ["fluid-probe", "fluid-child"],
    fixtures: ["fluid-probe", "fluid-child"].map((tag) => ({
      tag,
      storyId: fixture.id,
      setupButtons: ["Show result"]
    }))
  });
  await expect(page.locator("fluid-probe")).toHaveCount(1);
  await expect(page.locator("fluid-child")).toHaveCount(1);
  await guard.assertAttached();
  await guard.dispose();
});

test("visual guard rejects a creation action that leaves its advertised host absent", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><button>Show result</button></div>');
  await expect(
    prepareVisualFixture(
      page,
      {
        ...fixture,
        fixtures: [{ ...fixture.fixtures[0]!, setupButtons: ["Show result"] }]
      },
      3000
    )
  ).rejects.toThrow(/must render fluid-probe/);
});

test("visual guard rejects a host replaced during capture even by the same tag", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() => customElements.define("fluid-probe", class extends HTMLElement {}));
  const guard = await prepareVisualFixture(page, fixture);
  await page
    .locator("fluid-probe")
    .evaluate((element) => element.replaceWith(document.createElement("fluid-probe")));
  await expect(guard.assertAttached()).rejects.toThrow(/must remain attached/);
  await guard.dispose();
});

test("visual guard waits for the component update before accepting it", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() =>
    customElements.define(
      "fluid-probe",
      class extends HTMLElement {
        updateComplete = new Promise((resolve) =>
          requestAnimationFrame(() => {
            this.setAttribute("data-ready", "true");
            resolve(true);
          })
        );
      }
    )
  );
  const guard = await prepareVisualFixture(page, fixture);
  await expect(page.locator("fluid-probe")).toHaveAttribute("data-ready", "true");
  await guard.dispose();
});

test("visual guard rejects a claimed tag without a matching selected fixture", async ({ page }) => {
  await expect(prepareVisualFixture(page, { ...fixture, fixtures: [] })).rejects.toThrow(
    /inconsistent visual element attribution/
  );
});

test("visual guard uses real keyboard focus and retains the attributed shadow target", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() =>
    customElements.define(
      "fluid-probe",
      class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open", delegatesFocus: true }).innerHTML =
            "<button>Keyboard focus target</button>";
        }
      }
    )
  );
  const guard = await prepareVisualFixture(page, {
    ...fixture,
    fixtures: [
      {
        ...fixture.fixtures[0]!,
        focusTarget: {
          selector: "button",
          accessibleName: "Keyboard focus target",
          modality: "keyboard"
        }
      }
    ]
  });
  await guard.assertAttached();
  await page.locator("fluid-probe").evaluate((host) => {
    host.shadowRoot!.querySelector("button")!.replaceWith(document.createElement("button"));
  });
  await expect(guard.assertAttached()).rejects.toThrow(
    /retain the attributed focus-visible target/
  );
  await guard.dispose();
});

test("visual guard deterministically stops an attributed live controller", async ({ page }) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() =>
    customElements.define(
      "fluid-probe",
      class extends HTMLElement {
        stop() {
          this.dataset.stopped = "true";
        }
      }
    )
  );
  const guard = await prepareVisualFixture(page, {
    ...fixture,
    fixtures: [{ ...fixture.fixtures[0]!, settleMethod: "stop" }]
  });
  await expect(page.locator("fluid-probe")).toHaveAttribute("data-stopped", "true");
  await guard.assertAttached();
  await guard.dispose();
});

test("visual guard rejects a claimed stop lifecycle without a controller method", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() => customElements.define("fluid-probe", class extends HTMLElement {}));
  await expect(
    prepareVisualFixture(page, {
      ...fixture,
      fixtures: [{ ...fixture.fixtures[0]!, settleMethod: "stop" }]
    })
  ).rejects.toThrow(/Missing deterministic stop/);
});

test("visual guard advances an attributed Chart.js controller to its final frame", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() =>
    customElements.define(
      "fluid-probe",
      class extends HTMLElement {
        instance = {
          stop: () => {
            this.dataset.stopped = "true";
          },
          update: (mode?: string) => {
            this.dataset.updateMode = mode ?? "default";
          }
        };
        updateComplete = Promise.resolve();
      }
    )
  );
  const guard = await prepareVisualFixture(page, {
    ...fixture,
    fixtures: [{ ...fixture.fixtures[0]!, settleMethod: "finishChartAnimation" }]
  });
  await expect(page.locator("fluid-probe")).toHaveAttribute("data-stopped", "true");
  await expect(page.locator("fluid-probe")).toHaveAttribute("data-update-mode", "none");
  await guard.assertAttached();
  await guard.dispose();
});

test("visual guard rejects final-frame settling without a live Chart.js instance", async ({
  page
}) => {
  await page.setContent('<div id="storybook-root"><fluid-probe></fluid-probe></div>');
  await page.evaluate(() => customElements.define("fluid-probe", class extends HTMLElement {}));
  await expect(
    prepareVisualFixture(page, {
      ...fixture,
      fixtures: [{ ...fixture.fixtures[0]!, settleMethod: "finishChartAnimation" }]
    })
  ).rejects.toThrow(/Missing live Chart\.js instance/);
});
