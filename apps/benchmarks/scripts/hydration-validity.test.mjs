import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import {
  assertHydrationNodes,
  captureHydrationNodes,
  heapSampler
} from "./measurement-validity.mjs";

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

async function fixture(
  action,
  markup = '<fluid-button><template shadowrootmode="open"><button>Server action</button></template></fluid-button>'
) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.route("https://fluid-measurement.invalid/", (route) =>
      route.fulfill({ contentType: "text/html", body: `<!doctype html><body>${markup}</body>` })
    );
    await page.goto("https://fluid-measurement.invalid/");
    await action(page, context);
  } finally {
    await context.close();
  }
}

test("fresh parsed DSD has retained native nodes after a preserving upgrade", () =>
  fixture(async (page) => {
    const state = await page.evaluateHandle(captureHydrationNodes, 1);
    await page.evaluate(() => customElements.define("fluid-button", class extends HTMLElement {}));
    await page.evaluate(assertHydrationNodes, state);
    await state.dispose();
  }));
test("a registered realm cannot be presented as prehydration", () =>
  fixture(async (page) => {
    await page.evaluate(() => customElements.define("fluid-button", class extends HTMLElement {}));
    await assert.rejects(page.evaluate(captureHydrationNodes, 1), /unregistered realm/);
  }));
test("empty fixtures and host-only markup cannot pass hydration preconditions", async () => {
  await fixture(
    (page) => assert.rejects(page.evaluate(captureHydrationNodes, 1), /host count/),
    ""
  );
  await fixture(
    (page) => assert.rejects(page.evaluate(captureHydrationNodes, 1), /native button is absent/),
    "<fluid-button></fluid-button>"
  );
});
test("recreating a visually identical server button is rejected", () =>
  fixture(async (page) => {
    const state = await page.evaluateHandle(captureHydrationNodes, 1);
    await page.evaluate(() => {
      customElements.define("fluid-button", class extends HTMLElement {});
      const root = document.querySelector("fluid-button").shadowRoot;
      root.querySelector("button").replaceWith(root.querySelector("button").cloneNode(true));
    });
    await assert.rejects(page.evaluate(assertHydrationNodes, state), /replaced/);
    await state.dispose();
  }));
test("real heap telemetry detects deliberately retained JavaScript memory", () =>
  fixture(async (page, context) => {
    const sample = await heapSampler(await context.newCDPSession(page));
    const before = await sample();
    await page.evaluate(() => {
      window.retainedMeasurementControl = new Array(1_000_000).fill(17);
    });
    const after = await sample();
    assert.ok(
      after - before > 1_000_000,
      `allocation must be observed, measured ${after - before}`
    );
  }));
