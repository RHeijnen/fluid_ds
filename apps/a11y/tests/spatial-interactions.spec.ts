import { test, expect } from "@playwright/test";
import type { FluidMap } from "../../../packages/map/src/components/map/fluid-map.js";
import type { FluidNodeGraph } from "../../../packages/node-graph/src/components/node-graph/fluid-node-graph.js";

test("offline map supports native marker activation, keyboard pan, zoom and reconnect", async ({
  page
}) => {
  const errors: string[] = [];
  const remoteMapRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/unpkg\.com|tile\.openstreetmap\.org/.test(request.url()))
      remoteMapRequests.push(request.url());
  });
  await page.goto("/iframe.html?id=map-map--offline&viewMode=story");
  const map = page.locator("fluid-map");
  const region = page.getByRole("region", { name: "Offline delivery locations" });
  const depot = map.locator('.leaflet-marker-icon[aria-label="Depot"]');
  await expect(depot).toBeVisible();
  await expect(depot).toHaveCSS("position", "absolute");
  await map.evaluate((host) => {
    host.addEventListener("fluid-marker-click", (event) => {
      host.setAttribute("data-marker", JSON.stringify((event as CustomEvent).detail));
      host.setAttribute(
        "data-click-count",
        String(Number(host.getAttribute("data-click-count") ?? 0) + 1)
      );
    });
    host.addEventListener("fluid-move", (event) =>
      host.setAttribute("data-view", JSON.stringify((event as CustomEvent).detail))
    );
  });
  await depot.focus();
  await page.keyboard.press("Enter");
  await expect(map.locator(".leaflet-popup-content")).toHaveText("Depot");
  await expect(map).toHaveAttribute(
    "data-marker",
    JSON.stringify({ marker: { lat: 51.505, lng: -0.09, label: "Depot", tone: "info" } })
  );
  await map.locator(".leaflet-popup-close-button").click();
  await depot.click();
  await expect(map.locator(".leaflet-popup-content")).toHaveText("Depot");
  await expect(map).toHaveAttribute("data-click-count", "2");
  await map.locator(".leaflet-popup-close-button").click();
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(
      async () => JSON.parse((await map.getAttribute("data-view")) ?? '{"center":[0,-1]}').center[1]
    )
    .toBeGreaterThan(-0.09);
  await map.getByRole("button", { name: "Zoom in" }).click();
  await expect
    .poll(async () => JSON.parse((await map.getAttribute("data-view")) ?? '{"zoom":0}').zoom)
    .toBe(14);
  await map.evaluate(async (host) => {
    const element = host as FluidMap;
    element.center = [52, 0.5];
    element.zoom = 10;
    element.markers = [{ lat: 52, lng: 0.5, label: "<strong>New depot</strong>", tone: "warning" }];
    await element.updateComplete;
    const parent = element.parentElement!;
    element.remove();
    parent.append(element);
  });
  const replacement = map.locator(".leaflet-marker-icon");
  await expect(replacement).toHaveCount(1);
  await expect(replacement).toHaveAttribute("aria-label", "<strong>New depot</strong>");
  await replacement.focus();
  await page.keyboard.press("Enter");
  await expect(map.locator(".leaflet-popup-content")).toHaveText("<strong>New depot</strong>");
  await expect(map.locator(".leaflet-popup-content strong")).toHaveCount(0);
  await expect(map).toHaveAttribute("data-click-count", "3");
  await expect(map.locator("img.leaflet-tile")).toHaveCount(0);
  expect(remoteMapRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("node graph preserves keyboard editing, pointer movement and nested input ownership", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/iframe.html?id=node-graph-editor--editor&viewMode=story");
  const graph = page.locator("fluid-node-graph");
  await expect(graph).toBeVisible();
  await graph.evaluate(async (host) => {
    const element = host as FluidNodeGraph;
    element.style.width = "960px";
    element.nodeTypes = {
      start: { label: "Start", input: false, removable: false, outputs: [{ id: "next" }] },
      task: { label: "Task", height: 116, outputs: [{ id: "done", label: "Done" }] },
      end: { label: "End", outputs: [] }
    };
    element.nodes = [
      { id: "start", type: "start", x: 24, y: 80 },
      { id: "sync", type: "task", x: 320, y: 64, label: "Sync data" },
      { id: "end", type: "end", x: 620, y: 80 }
    ];
    element.edges = [{ id: "initial", from: "start", port: "next", to: "sync" }];
    element.resetViewport();
    for (const type of [
      "fluid-node-move",
      "fluid-connect",
      "fluid-selection-change",
      "fluid-edge-remove"
    ]) {
      element.addEventListener(type, (event) =>
        element.setAttribute(`data-${type}`, JSON.stringify((event as CustomEvent).detail))
      );
    }
    await element.updateComplete;
  });
  const sync = graph.locator('[data-node-id="sync"]');
  await sync.focus();
  await page.keyboard.press("Enter");
  await expect(graph).toHaveAttribute(
    "data-fluid-selection-change",
    '{"nodeId":"sync","edgeId":null}'
  );
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(graph).toHaveAttribute("data-fluid-node-move", '{"id":"sync","x":328,"y":96}');
  await expect(sync).toBeFocused();
  const rect = (await sync.boundingBox())!;
  await page.mouse.move(rect.x + 100, rect.y + 20);
  await page.mouse.down();
  await page.mouse.move(rect.x + 132, rect.y + 36, { steps: 4 });
  await page.mouse.up();
  await expect(graph).toHaveAttribute("data-fluid-node-move", '{"id":"sync","x":360,"y":112}');
  const output = graph.locator('[data-out-node="sync"]');
  await output.focus();
  await page.keyboard.press("Enter");
  await expect(graph.locator(".edge-preview")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(graph.locator(".edge-preview")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect.poll(() => graph.evaluate((host) => (host as FluidNodeGraph).edges.length)).toBe(2);
  const connected = JSON.parse((await graph.getAttribute("data-fluid-connect"))!);
  expect(connected).toMatchObject({ from: "sync", port: "done", to: "end" });
  await graph.locator('[data-in-node="end"]').focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Delete");
  await expect(graph).toHaveAttribute("data-fluid-edge-remove", JSON.stringify(connected));

  await graph.evaluate(async (host) => {
    const element = host as FluidNodeGraph;
    element.renderNode = (node) => {
      const input = document.createElement("input");
      input.setAttribute("aria-label", `${node.id} editable label`);
      input.value = "Editable";
      return input;
    };
    await element.updateComplete;
  });
  await graph.locator('[data-in-node="sync"]').focus();
  await page.keyboard.press("Enter");
  const input = graph.getByRole("textbox", { name: "sync editable label" });
  await input.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await expect(input).toHaveValue("Editabl");
  await expect.poll(() => graph.evaluate((host) => (host as FluidNodeGraph).edges.length)).toBe(1);
  const inputRect = (await input.boundingBox())!;
  await page.mouse.move(inputRect.x + 15, inputRect.y + 10);
  await page.mouse.down();
  await page.mouse.move(inputRect.x + 55, inputRect.y + 10, { steps: 3 });
  await page.mouse.up();
  expect(
    await graph.evaluate(
      (host) => (host as FluidNodeGraph).nodes.find((node) => node.id === "sync")!.x
    )
  ).toBe(360);
  await output.focus();
  await page.keyboard.press("Enter");
  await expect(graph.locator(".edge-preview")).toHaveCount(1);
  await graph.evaluate((host) => {
    const parent = host.parentElement!;
    host.remove();
    parent.append(host);
  });
  await expect(graph.locator(".edge-preview")).toHaveCount(0);
  await graph.evaluate(async (host) => {
    const element = host as FluidNodeGraph;
    element.readonly = true;
    await element.updateComplete;
  });
  await sync.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Delete");
  expect(
    await graph.evaluate(
      (host) => (host as FluidNodeGraph).nodes.find((node) => node.id === "sync")!.x
    )
  ).toBe(360);
  expect(errors).toEqual([]);
});
