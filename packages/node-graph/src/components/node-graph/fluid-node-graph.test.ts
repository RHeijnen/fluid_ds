import { expect, fixture, html, oneEvent, aTimeout } from "@open-wc/testing";
import "./define.js";
import "@fluid-ds/components/locales/nl";
import "@fluid-ds/components/locales/de";
import "@fluid-ds/components/locales/fr";
import "@fluid-ds/components/locales/es";
import "@fluid-ds/components/locales/ar";
import type {
  FluidNodeGraph,
  NodeGraphEdge,
  NodeGraphNode,
  NodeGraphNodeType
} from "../../index.js";

const TYPES: Record<string, NodeGraphNodeType> = {
  start: { label: "Start", input: false, removable: false, outputs: [{ id: "next" }] },
  task: {
    label: "Task",
    height: 116,
    outputs: [
      { id: "done", label: "Done", tone: "success" },
      { id: "failed", label: "Failed", tone: "danger" }
    ]
  },
  end: { label: "End", outputs: [] }
};

const NODES: NodeGraphNode[] = [
  { id: "a", type: "start", x: 40, y: 80 },
  { id: "b", type: "task", x: 336, y: 64, label: "Sync data", summary: "Nightly" },
  { id: "c", type: "end", x: 640, y: 80 }
];

const EDGES: NodeGraphEdge[] = [{ id: "e1", from: "a", port: "next", to: "b" }];

async function graphFixture(): Promise<FluidNodeGraph> {
  const el = await fixture<FluidNodeGraph>(html`
    <fluid-node-graph style="width: 800px; height: 500px" label="Test graph"></fluid-node-graph>
  `);
  el.nodeTypes = TYPES;
  el.nodes = NODES.map((node) => ({ ...node }));
  el.edges = EDGES.map((edge) => ({ ...edge }));
  await el.updateComplete;
  return el;
}

const nodeEl = (el: FluidNodeGraph, id: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!;

const key = (target: HTMLElement, key: string, init: KeyboardEventInit = {}): void => {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...init })
  );
};

describe("fluid-node-graph", () => {
  it("does not delete selected graph edges while editing a custom node input", async () => {
    const el = await graphFixture();
    el.renderNode = () => html`<input aria-label="Node label" value="Editable" />`;
    await el.updateComplete;
    key(el.shadowRoot!.querySelector<HTMLElement>('[data-in-node="b"]')!, "Enter");
    const input = nodeEl(el, "b").querySelector("input")!;
    input.focus();
    key(input, "Backspace");
    await el.updateComplete;
    expect(el.edges.map((edge) => edge.id)).to.deep.equal(["e1"]);
  });

  it("does not start dragging a node from its custom text control", async () => {
    const el = await graphFixture();
    el.renderNode = () => html`<input aria-label="Node label" value="Editable" />`;
    await el.updateComplete;
    const input = nodeEl(el, "b").querySelector("input")!;
    input.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 0,
        clientX: 400,
        clientY: 100,
        bubbles: true,
        composed: true
      })
    );
    el.shadowRoot!.querySelector(".canvas")!.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 480, clientY: 100, bubbles: true, composed: true })
    );
    expect(el.nodes.find((node) => node.id === "b")!.x).to.equal(336);
  });

  it("cancels pointer gestures and keyboard connection previews on disconnect", async () => {
    const el = await graphFixture();
    const parent = el.parentElement!;
    const node = nodeEl(el, "b");
    node.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 0,
        clientX: 400,
        clientY: 100,
        bubbles: true,
        composed: true
      })
    );
    el.remove();
    parent.append(el);
    el.shadowRoot!.querySelector(".canvas")!.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 480, clientY: 100, bubbles: true, composed: true })
    );
    expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336);
    key(
      el.shadowRoot!.querySelector<HTMLElement>('[data-out-node="b"][data-out-port="done"]')!,
      "Enter"
    );
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".edge-preview")).not.to.equal(null);
    el.remove();
    parent.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
  });

  it("renders nodes, ports and edges from data", async () => {
    const el = await graphFixture();
    expect(el.shadowRoot!.querySelectorAll("[data-node-id]").length).to.equal(3);
    // start: no input, one output; task: input + two outputs; end: input only.
    expect(el.shadowRoot!.querySelectorAll("[data-in-node]").length).to.equal(2);
    expect(el.shadowRoot!.querySelectorAll("[data-out-port]").length).to.equal(3);
    expect(el.shadowRoot!.querySelectorAll("path.edge").length).to.equal(1);
  });

  it("is accessible", async () => {
    const el = await graphFixture();
    await expect(el).to.be.accessible();
  });

  it("every port meets the minimum target size", async () => {
    const el = await graphFixture();
    for (const port of el.shadowRoot!.querySelectorAll<HTMLElement>(".port")) {
      const rect = port.getBoundingClientRect();
      expect(rect.width, "port width").to.be.at.least(24);
      expect(rect.height, "port height").to.be.at.least(24);
    }
  });

  describe("connectNodes", () => {
    it("creates a valid edge and emits fluid-connect", async () => {
      const el = await graphFixture();
      setTimeout(() => el.connectNodes("b", "done", "c"));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail.from).to.equal("b");
      expect(event.detail.port).to.equal("done");
      expect(event.detail.to).to.equal("c");
      expect(el.edges.length).to.equal(2);
    });

    it("refuses self-links, duplicates, unknown ports, and targets without input", async () => {
      const el = await graphFixture();
      expect(el.connectNodes("b", "done", "b"), "self link").to.equal(null);
      expect(el.connectNodes("a", "next", "b"), "duplicate").to.equal(null);
      expect(el.connectNodes("b", "no-such-port", "c"), "unknown port").to.equal(null);
      expect(el.connectNodes("b", "done", "a"), "target without input").to.equal(null);
      expect(el.edges.length).to.equal(1);
    });

    it("does nothing when readonly", async () => {
      const el = await graphFixture();
      el.readonly = true;
      expect(el.connectNodes("b", "done", "c")).to.equal(null);
      expect(el.edges.length).to.equal(1);
    });
  });

  describe("keyboard on a node", () => {
    it("nudges by one grid step with arrows and emits fluid-node-move", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      setTimeout(() => key(node, "ArrowRight"));
      const event = await oneEvent(el, "fluid-node-move");
      expect(event.detail).to.deep.equal({ id: "b", x: 336 + el.grid, y: 64 });
      expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336 + el.grid);
    });

    it("nudges four grid steps with Shift", async () => {
      const el = await graphFixture();
      key(nodeEl(el, "b"), "ArrowDown", { shiftKey: true });
      await el.updateComplete;
      expect(el.nodes.find((entry) => entry.id === "b")!.y).to.equal(64 + el.grid * 4);
    });

    it("announces the move through the live region", async () => {
      const el = await graphFixture();
      key(nodeEl(el, "b"), "ArrowRight");
      await el.updateComplete;
      const live = el.shadowRoot!.querySelector('[role="status"]')!;
      expect(live.textContent).to.contain("Sync data");
      expect(live.textContent).to.contain("moved");
    });

    it("Delete removes the node and its edges and emits fluid-node-remove", async () => {
      const el = await graphFixture();
      setTimeout(() => key(nodeEl(el, "b"), "Delete"));
      const event = await oneEvent(el, "fluid-node-remove");
      expect(event.detail.id).to.equal("b");
      expect(el.nodes.length).to.equal(2);
      expect(el.edges.length, "edges touching the node go with it").to.equal(0);
    });

    it("refuses to remove a non-removable node", async () => {
      const el = await graphFixture();
      key(nodeEl(el, "a"), "Delete");
      await el.updateComplete;
      expect(el.nodes.length).to.equal(3);
    });

    it("arrows do not move the node when readonly", async () => {
      const el = await graphFixture();
      el.readonly = true;
      await el.updateComplete;
      key(nodeEl(el, "b"), "ArrowRight");
      await el.updateComplete;
      expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336);
    });

    it("keeps arrow movement in physical world coordinates in RTL", async () => {
      const el = await graphFixture();
      el.dir = "rtl";
      await el.updateComplete;
      const original = el.nodes.map((entry) => ({ ...entry }));

      setTimeout(() => key(nodeEl(el, "b"), "ArrowRight"));
      const event = await oneEvent(el, "fluid-node-move");

      expect(event.detail).to.deep.equal({ id: "b", x: 336 + el.grid, y: 64 });
      expect(el.nodes.map((entry) => entry.id)).to.deep.equal(original.map((entry) => entry.id));
      expect(el.nodes.find((entry) => entry.id === "a")).to.deep.equal(original[0]);
      expect(nodeEl(el, "b").getAttribute("aria-label")).to.equal("Sync data, Task");
    });
  });

  describe("keyboard connect from an output port", () => {
    const outPort = (el: FluidNodeGraph, node: string, port: string): HTMLElement =>
      el.shadowRoot!.querySelector<HTMLElement>(
        `[data-out-node="${node}"][data-out-port="${port}"]`
      )!;

    it("Enter starts, arrows cycle candidates, Enter connects", async () => {
      const el = await graphFixture();
      const port = outPort(el, "b", "done");
      key(port, "Enter");
      await el.updateComplete;
      // Candidates for b: a has no input, so only c qualifies.
      expect(el.shadowRoot!.querySelector(".connect-candidate")).to.exist;
      expect(el.shadowRoot!.querySelector(".edge-preview"), "preview edge drawn").to.exist;
      setTimeout(() => key(port, "Enter"));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail.to).to.equal("c");
      expect(el.edges.length).to.equal(2);
    });

    it("Escape cancels without connecting", async () => {
      const el = await graphFixture();
      const port = outPort(el, "b", "done");
      key(port, "Enter");
      await el.updateComplete;
      key(port, "Escape");
      await el.updateComplete;
      expect(el.edges.length).to.equal(1);
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
      const live = el.shadowRoot!.querySelector('[role="status"]')!;
      expect(live.textContent).to.contain("cancelled");
    });

    it("excludes targets the port already reaches from the candidate cycle", async () => {
      const el = await graphFixture();
      // b -> done -> c exists, so from b's done port only... nothing remains
      // (a has no input), and the silent-duplicate trap cannot occur.
      el.edges = [...el.edges, { id: "e2", from: "b", port: "done", to: "c" }];
      await el.updateComplete;
      key(outPort(el, "b", "done"), "Enter");
      await el.updateComplete;
      const live = el.shadowRoot!.querySelector('[role="status"]')!;
      expect(live.textContent).to.contain("No available targets");
      expect(el.edges.length).to.equal(2);
    });

    it("announces when there are no valid targets", async () => {
      const el = await graphFixture();
      // Only a and b on the canvas: a rejects input, so b's port has nowhere to go
      // once c is gone and a self-link is refused.
      el.nodes = el.nodes.filter((node) => node.id !== "c");
      await el.updateComplete;
      key(outPort(el, "b", "done"), "Enter");
      await el.updateComplete;
      const live = el.shadowRoot!.querySelector('[role="status"]')!;
      expect(live.textContent).to.contain("No available targets");
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
    });

    it("keeps the physical candidate cycle and canonical target ids in RTL", async () => {
      const el = await graphFixture();
      el.dir = "rtl";
      el.edges = [];
      await el.updateComplete;
      const port = outPort(el, "a", "next");

      key(port, "Enter");
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector<HTMLElement>(".connect-candidate")!.dataset.nodeId
      ).to.equal("b");

      key(port, "ArrowRight");
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector<HTMLElement>(".connect-candidate")!.dataset.nodeId
      ).to.equal("c");

      setTimeout(() => key(port, "Enter"));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail).to.include({ from: "a", port: "next", to: "c" });
    });
  });

  describe("edges via the input port", () => {
    it("Enter on an input port selects the newest incoming edge; Delete removes it", async () => {
      const el = await graphFixture();
      const inPort = el.shadowRoot!.querySelector<HTMLElement>('[data-in-node="b"]')!;
      key(inPort, "Enter");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector("path.edge.selected")).to.exist;
      setTimeout(() => key(inPort, "Delete"));
      const event = await oneEvent(el, "fluid-edge-remove");
      expect(event.detail.id).to.equal("e1");
      expect(el.edges.length).to.equal(0);
    });
  });

  describe("viewport", () => {
    it("zoomBy clamps to the configured range", async () => {
      const el = await graphFixture();
      el.zoomBy(100);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".hud")!.textContent).to.contain("200%");
      el.zoomBy(0.0001);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".hud")!.textContent).to.contain("40%");
    });

    it("fitView emits fluid-viewport-change", async () => {
      const el = await graphFixture();
      setTimeout(() => el.fitView());
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail.zoom).to.be.a("number");
    });

    it("keeps keyboard pan direction physical and viewport values canonical in RTL", async () => {
      const el = await graphFixture();
      el.dir = "rtl";
      await el.updateComplete;
      const canvas = el.shadowRoot!.querySelector<HTMLElement>(".canvas")!;

      setTimeout(() => key(canvas, "ArrowRight"));
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail).to.deep.equal({ x: 0, y: 20, zoom: 1 });
    });
  });

  it("keeps pointer movement in physical world coordinates in RTL", async () => {
    const el = await graphFixture();
    el.dir = "rtl";
    await el.updateComplete;
    const node = nodeEl(el, "b");
    const canvas = el.shadowRoot!.querySelector<HTMLElement>(".canvas")!;
    const originalX = el.nodes.find((entry) => entry.id === "b")!.x;

    node.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 0,
        clientX: 400,
        clientY: 100,
        bubbles: true,
        composed: true
      })
    );
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 480,
        clientY: 100,
        bubbles: true,
        composed: true
      })
    );
    setTimeout(() =>
      canvas.dispatchEvent(
        new PointerEvent("pointerup", {
          clientX: 480,
          clientY: 100,
          bubbles: true,
          composed: true
        })
      )
    );
    const event = await oneEvent(el, "fluid-node-move");

    expect(event.detail.id).to.equal("b");
    expect(event.detail.x - originalX).to.equal(80);
    expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(originalX + 80);
  });

  it("keeps input/output port geometry physical while preserving RTL application labels", async () => {
    const el = await graphFixture();
    el.dir = "rtl";
    await el.updateComplete;
    const node = nodeEl(el, "b");
    const input = node.querySelector<HTMLElement>('[data-in-node="b"]')!;
    const output = node.querySelector<HTMLElement>('[data-out-port="done"]')!;
    const label = node.querySelector<HTMLElement>(".port-label")!;
    const nodeRect = node.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const outputRect = output.getBoundingClientRect();

    const nodeCenter = nodeRect.left + nodeRect.width / 2;
    expect(inputRect.left + inputRect.width / 2).to.be.lessThan(nodeCenter);
    expect(outputRect.left + outputRect.width / 2).to.be.greaterThan(nodeCenter);
    expect(input.style.left).to.equal("0px");
    expect(output.style.left).to.equal(`${el.nodeWidth}px`);
    expect(getComputedStyle(label).right).to.equal("12px");
    expect(label.textContent).to.equal("Done");
    expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336);
  });

  it("paints run states and traversed edges from data", async () => {
    const el = await graphFixture();
    el.runStates = { a: "success", b: "running" };
    el.traversedEdges = ["e1"];
    await el.updateComplete;
    expect(nodeEl(el, "a").classList.contains("run-success")).to.equal(true);
    expect(nodeEl(el, "b").classList.contains("run-running")).to.equal(true);
    expect(el.shadowRoot!.querySelector("path.edge.traversed")).to.exist;
  });

  it("renderNode takes over the node body", async () => {
    const el = await graphFixture();
    el.renderNode = (node) => html`<em class="custom">${node.id.toUpperCase()}</em>`;
    await el.updateComplete;
    const custom = nodeEl(el, "a").querySelector(".custom");
    expect(custom).to.exist;
    expect(custom!.textContent).to.equal("A");
  });

  it("updates inherited Arabic and regional French defaults without changing graph data or events", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-node-graph style="width: 800px; height: 500px"></fluid-node-graph>
      </div>
    `);
    const el = wrapper.querySelector<FluidNodeGraph>("fluid-node-graph")!;
    el.nodeTypes = TYPES;
    el.nodes = NODES.map((node) => ({ ...node }));
    el.edges = EDGES.map((edge) => ({ ...edge }));
    await el.updateComplete;
    const nodes = el.nodes;
    const edges = el.edges;
    const events: Event[] = [];
    for (const name of ["fluid-node-move", "fluid-connect", "fluid-viewport-change"]) {
      el.addEventListener(name, (event) => events.push(event));
    }
    const canvas = el.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    expect(canvas.getAttribute("aria-label")).to.equal("رسم بياني للعقد");
    expect(canvas.getAttribute("aria-roledescription")).to.equal("محرر رسم بياني للعقد");
    expect(canvas.dir).to.equal("rtl");
    expect(nodeEl(el, "b").getAttribute("aria-roledescription")).to.equal("عقدة");
    expect(nodeEl(el, "b").getAttribute("aria-label")).to.equal("Sync data, Task");
    expect(nodeEl(el, "b").querySelector(".port-label")!.textContent).to.equal("Done");

    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(canvas.getAttribute("aria-label")).to.equal("Graphe de nœuds");
    expect(canvas.getAttribute("aria-roledescription")).to.equal("éditeur de graphe de nœuds");
    expect(nodeEl(el, "b").getAttribute("aria-roledescription")).to.equal("nœud");
    expect(el.nodes).to.equal(nodes);
    expect(el.edges).to.equal(edges);
    expect(events).to.deep.equal([]);
  });

  it("relocalizes an active connection candidate while preserving ids, focus and event silence", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-node-graph style="width: 800px; height: 500px"></fluid-node-graph>
      </div>
    `);
    const el = wrapper.querySelector<FluidNodeGraph>("fluid-node-graph")!;
    el.nodeTypes = TYPES;
    el.nodes = NODES.map((node) => ({ ...node }));
    el.edges = [];
    await el.updateComplete;
    const output = el.shadowRoot!.querySelector<HTMLElement>(
      '[data-out-node="a"][data-out-port="next"]'
    )!;
    output.focus();
    key(output, "Enter");
    await el.updateComplete;
    const status = el.shadowRoot!.querySelector<HTMLElement>('[role="status"]')!;
    expect(status.dir).to.equal("rtl");
    const arabicOne = new Intl.NumberFormat("ar", { useGrouping: false }).format(1);
    const arabicTwo = new Intl.NumberFormat("ar", { useGrouping: false }).format(2);
    expect(status.textContent).to.contain(`Sync data، ${arabicOne} من ${arabicTwo}`);
    const events: Event[] = [];
    el.addEventListener("fluid-connect", (event) => events.push(event));
    wrapper.lang = "fr-CA";
    await aTimeout(0);
    await el.updateComplete;
    expect(status.textContent).to.contain("Sync data, 1 sur 2");
    expect(el.shadowRoot!.activeElement).to.equal(output);
    expect(el.nodes.map((node) => node.id)).to.deep.equal(["a", "b", "c"]);
    expect(el.edges).to.deep.equal([]);
    expect(events).to.deep.equal([]);
  });

  it("preserves partial and intentional-empty message and label overrides", async () => {
    const el = await graphFixture();
    el.label = "";
    el.messages = {
      nodeMoved: "",
      nodeRole: "custom node",
      outputPort: "{port} => {node}"
    };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal("");
    expect(nodeEl(el, "b").getAttribute("aria-roledescription")).to.equal("custom node");
    expect(
      nodeEl(el, "b").querySelector('[data-out-port="done"]')!.getAttribute("aria-label")
    ).to.equal("Done => Sync data");
    const moved = oneEvent(el, "fluid-node-move");
    key(nodeEl(el, "b"), "ArrowRight");
    await moved;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent?.trim()).to.equal("");
    el.lang = "ar";
    await aTimeout(0);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-label")).to.equal("");
    expect(nodeEl(el, "b").getAttribute("aria-roledescription")).to.equal("custom node");
  });

  it("localizes numeric announcements while keeping physical coordinates and payloads canonical", async () => {
    const wrapper = await fixture<HTMLDivElement>(html`
      <div lang="ar">
        <fluid-node-graph style="width: 800px; height: 500px" grid="8"></fluid-node-graph>
      </div>
    `);
    const el = wrapper.querySelector<FluidNodeGraph>("fluid-node-graph")!;
    el.nodeTypes = TYPES;
    el.nodes = NODES.map((node) => ({ ...node }));
    el.edges = EDGES.map((edge) => ({ ...edge }));
    await el.updateComplete;
    const moved = oneEvent(el, "fluid-node-move") as Promise<CustomEvent>;
    key(nodeEl(el, "b"), "ArrowRight");
    const event = await moved;
    await el.updateComplete;
    expect(event.detail).to.deep.equal({ id: "b", x: 344, y: 64 });
    expect(el.nodes.find((node) => node.id === "b")!.x).to.equal(344);
    const x = new Intl.NumberFormat("ar", { useGrouping: false }).format(344);
    const y = new Intl.NumberFormat("ar", { useGrouping: false }).format(64);
    expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent).to.contain(
      `Sync data إلى ${x}، ${y}`
    );
  });
});
