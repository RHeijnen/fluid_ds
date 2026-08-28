import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "../../../packages/map/src/components/map/define.js";
import "../../../packages/node-graph/src/components/node-graph/define.js";
import {
  ensureOfflineMapStyles,
  offlineMapMarkers
} from "../../../packages/map/src/components/map/offline-story-fixture.js";

const meta: Meta = {
  title: "Quality/Spatial interaction contracts",
  tags: ["interaction-contract"],
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

export const MapContract: Story = {
  parameters: { quality: { componentTag: "fluid-map" } },
  render: () => {
    ensureOfflineMapStyles();
    return html`
      <fluid-map
        label="Offline delivery locations"
        tile-url=""
        .center=${[51.505, -0.09]}
        .zoom=${13}
        .markers=${offlineMapMarkers}
        style="width:640px;max-width:100%;"
      ></fluid-map>
    `;
  },
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector("fluid-map")!;
    await waitFor(() => expect(map.querySelectorAll(".leaflet-marker-icon")).toHaveLength(2));
    const clicks: CustomEvent[] = [];
    const moves: CustomEvent[] = [];
    const onClick = (event: Event) => clicks.push(event as CustomEvent);
    const onMove = (event: Event) => moves.push(event as CustomEvent);
    map.addEventListener("fluid-marker-click", onClick);
    map.addEventListener("fluid-move", onMove);
    try {
      const depot = map.querySelector<HTMLElement>('.leaflet-marker-icon[aria-label="Depot"]')!;
      await waitFor(() => expect(getComputedStyle(depot).position).toBe("absolute"));
      // Leaflet enumerates/clones MouseEvent coordinates for its preclick event;
      // userEvent's non-enumerable overrides produce NaN coordinates there.
      // Native Playwright covers real mouse and Enter activation of these pins.
      depot.click();
      await waitFor(() =>
        expect(map.querySelector(".leaflet-popup-content")?.textContent).toBe("Depot")
      );
      await expect(clicks.map((event) => event.detail)).toEqual([{ marker: offlineMapMarkers[0] }]);
      await userEvent.click(map.querySelector<HTMLElement>(".leaflet-popup-close-button")!);
      await userEvent.click(map.querySelector<HTMLElement>(".leaflet-control-zoom-in")!);
      await waitFor(() => expect(moves.some((event) => event.detail.zoom === 14)).toBe(true));
      map.center = [52, 0.5];
      map.zoom = 10;
      map.markers = [{ lat: 52, lng: 0.5, label: "<strong>New depot</strong>", tone: "warning" }];
      await map.updateComplete;
      await waitFor(() => expect(moves.at(-1)?.detail.zoom).toBe(10));
      await expect(moves.at(-1)!.detail.center[0]).toBeCloseTo(52, 3);
      await expect(moves.at(-1)!.detail.center[1]).toBeCloseTo(0.5, 3);
      await expect(map.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1);
      map.querySelector<HTMLElement>(".leaflet-marker-icon")!.click();
      await waitFor(() =>
        expect(map.querySelector(".leaflet-popup-content")?.textContent).toBe(
          "<strong>New depot</strong>"
        )
      );
      await expect(map.querySelector(".leaflet-popup-content strong")).toBeNull();
      const parent = map.parentElement!;
      map.remove();
      parent.append(map);
      await waitFor(() => expect(map.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1));
      map.querySelector<HTMLElement>(".leaflet-marker-icon")!.click();
      await expect(clicks).toHaveLength(3);
      await expect(clicks[2]!.detail.marker).toEqual(map.markers[0]);
      await expect(map.querySelectorAll("img.leaflet-tile")).toHaveLength(0);
      await expect(
        [...clicks, ...moves].every(
          (event) => event.target === map && event.bubbles && event.composed
        )
      ).toBe(true);
    } finally {
      map.removeEventListener("fluid-marker-click", onClick);
      map.removeEventListener("fluid-move", onMove);
    }
  }
};

export const NodeGraphContract: Story = {
  parameters: { quality: { componentTag: "fluid-node-graph" } },
  render: () => html`
    <fluid-node-graph
      label="Delivery workflow"
      style="width:960px;max-width:100%;height:480px"
      .nodeTypes=${{
        start: { label: "Start", input: false, removable: false, outputs: [{ id: "next" }] },
        task: { label: "Task", height: 116, outputs: [{ id: "done", label: "Done" }] },
        end: { label: "End", outputs: [] }
      }}
      .nodes=${[
        { id: "start", type: "start", x: 24, y: 80 },
        { id: "sync", type: "task", x: 320, y: 64, label: "Sync data" },
        { id: "end", type: "end", x: 620, y: 80 }
      ]}
      .edges=${[{ id: "initial", from: "start", port: "next", to: "sync" }]}
    ></fluid-node-graph>
  `,
  play: async ({ canvasElement }) => {
    const graph = canvasElement.querySelector("fluid-node-graph")!;
    const root = graph.shadowRoot!;
    const events: { type: string; detail: Record<string, unknown>; event: Event }[] = [];
    const onEvent = (event: Event) =>
      events.push({ type: event.type, detail: (event as CustomEvent).detail, event });
    const eventTypes = [
      "fluid-node-move",
      "fluid-connect",
      "fluid-selection-change",
      "fluid-edge-remove",
      "fluid-node-remove"
    ];
    eventTypes.forEach((type) => graph.addEventListener(type, onEvent));
    try {
      const sync = root.querySelector<HTMLElement>('[data-node-id="sync"]')!;
      sync.focus();
      await userEvent.keyboard("{Enter}{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
      await waitFor(() =>
        expect(graph.nodes.find((node) => node.id === "sync")).toMatchObject({ x: 328, y: 96 })
      );
      await expect(root.activeElement).toBe(sync);
      await expect(events.find((entry) => entry.type === "fluid-selection-change")!.detail).toEqual(
        { nodeId: "sync", edgeId: null }
      );
      await expect(
        events.filter((entry) => entry.type === "fluid-node-move").map((entry) => entry.detail)
      ).toEqual([
        { id: "sync", x: 328, y: 64 },
        { id: "sync", x: 328, y: 96 }
      ]);
      const output = root.querySelector<HTMLButtonElement>('[data-out-node="sync"]')!;
      output.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(root.querySelector(".edge-preview")).not.toBeNull());
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(root.querySelector(".edge-preview")).toBeNull());
      await expect(graph.edges).toHaveLength(1);
      await userEvent.keyboard("{Enter}{Enter}");
      await waitFor(() => expect(graph.edges).toHaveLength(2));
      const edge = graph.edges[1]!;
      await expect(edge).toMatchObject({ from: "sync", port: "done", to: "end" });
      await expect(events.find((entry) => entry.type === "fluid-connect")!.detail).toEqual(edge);
      root.querySelector<HTMLButtonElement>('[data-in-node="end"]')!.focus();
      await userEvent.keyboard("{Enter}{Delete}");
      await waitFor(() => expect(graph.edges).toHaveLength(1));
      await expect(events.find((entry) => entry.type === "fluid-edge-remove")!.detail).toEqual(
        edge
      );
      graph.readonly = true;
      await graph.updateComplete;
      sync.focus();
      await userEvent.keyboard("{ArrowRight}{Delete}");
      await expect(graph.nodes.find((node) => node.id === "sync")).toMatchObject({ x: 328, y: 96 });
      await expect(graph.nodes).toHaveLength(3);
      graph.readonly = false;
      graph.nodes = [{ id: "replacement", type: "task", label: "Replacement job", x: 40, y: 40 }];
      graph.edges = [];
      await graph.updateComplete;
      const replacement = root.querySelector<HTMLElement>('[data-node-id="replacement"]')!;
      replacement.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(graph.nodes[0]!.x).toBe(48);
      await userEvent.keyboard("{Delete}");
      await waitFor(() => expect(graph.nodes).toHaveLength(0));
      await expect(root.activeElement).toBe(root.querySelector(".canvas"));
      await expect(events.find((entry) => entry.type === "fluid-node-remove")!.detail).toEqual({
        id: "replacement"
      });
      await expect(
        events.every(({ event }) => event.target === graph && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      eventTypes.forEach((type) => graph.removeEventListener(type, onEvent));
    }
  }
};
