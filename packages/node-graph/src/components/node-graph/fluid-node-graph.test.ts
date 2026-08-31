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

const key = (target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init
  });
  target.dispatchEvent(event);
  return event;
};

const canvasOf = (el: FluidNodeGraph): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(".canvas")!;

const outPortEl = (el: FluidNodeGraph, node: string, port: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(`[data-out-node="${node}"][data-out-port="${port}"]`)!;

const inPortEl = (el: FluidNodeGraph, node: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(`[data-in-node="${node}"]`)!;

const live = (el: FluidNodeGraph): string =>
  el.shadowRoot!.querySelector('[role="status"]')!.textContent!.trim();

/** Viewport-space center of a rendered element, for hit-tested pointer gestures. */
const at = (target: Element): { clientX: number; clientY: number } => {
  const rect = target.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
};

/** A point inside the canvas, in canvas-relative pixels. */
const inCanvas = (
  el: FluidNodeGraph,
  x: number,
  y: number
): { clientX: number; clientY: number } => {
  const rect = canvasOf(el).getBoundingClientRect();
  return { clientX: rect.left + x, clientY: rect.top + y };
};

const pointer = (
  target: EventTarget,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  init: PointerEventInit = {}
): PointerEvent => {
  const event = new PointerEvent(type, {
    button: 0,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init
  });
  target.dispatchEvent(event);
  return event;
};

const dragEvent = (
  type: "dragover" | "drop",
  transfer: DataTransfer,
  init: { clientX?: number; clientY?: number } = {}
): DragEvent => {
  const event = new DragEvent(type, { bubbles: true, composed: true, cancelable: true, ...init });
  Object.defineProperty(event, "dataTransfer", { value: transfer });
  return event;
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

  describe("owned strings", () => {
    const hudSegments = (el: FluidNodeGraph): (string | null)[] =>
      [...el.shadowRoot!.querySelectorAll(".hud span")].map((span) => span.textContent);

    it("names the canvas role and the summary chip from the active dictionary", async () => {
      const el = await graphFixture();
      expect(
        el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-roledescription")
      ).to.equal("node graph editor");
      expect(hudSegments(el)).to.deep.equal(["3 nodes", "·", "1 edge", "·", "100%"]);
    });

    it("localizes the summary chip through the built-in plural rules", async () => {
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
      // Arabic puts 3 in "few" and 1 in "one": both forms come from the dictionary.
      expect(hudSegments(el)).to.deep.equal([
        `${new Intl.NumberFormat("ar", { useGrouping: false }).format(3)} عقد`,
        "·",
        "اتصال واحد",
        "·",
        `${new Intl.NumberFormat("ar", { useGrouping: false }).format(100)}%`
      ]);
    });

    it("overrides the canvas role description, node name and every summary segment", async () => {
      const el = await graphFixture();
      el.messages = {
        editorRole: "knooppuntgrafiek-editor",
        nodeName: "{node} ({type})",
        nodeCount: "{count} knopen",
        nodeCountOne: "{count} knoop",
        edgeCount: "{count} verbindingen",
        edgeCountOne: "{count} verbinding",
        zoomLevel: "zoom {percent} procent",
        hudSeparator: "|"
      };
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-roledescription")
      ).to.equal("knooppuntgrafiek-editor");
      expect(nodeEl(el, "b").getAttribute("aria-label")).to.equal("Sync data (Task)");
      // Three nodes take the general form; the single edge takes the singular.
      expect(hudSegments(el)).to.deep.equal([
        "3 knopen",
        "|",
        "1 verbinding",
        "|",
        "zoom 100 procent"
      ]);
    });

    it("falls back to the general tally when no singular override is supplied", async () => {
      const el = await graphFixture();
      el.messages = { nodeCount: "{count} knopen", edgeCount: "{count} verbindingen" };
      await el.updateComplete;
      expect(hudSegments(el)).to.deep.equal(["3 knopen", "·", "1 verbindingen", "·", "100%"]);
    });

    it("selects the singular tally by the active locale's plural rules", async () => {
      const wrapper = await fixture<HTMLDivElement>(html`
        <div lang="ar">
          <fluid-node-graph style="width: 800px; height: 500px"></fluid-node-graph>
        </div>
      `);
      const el = wrapper.querySelector<FluidNodeGraph>("fluid-node-graph")!;
      el.nodeTypes = TYPES;
      el.nodes = NODES.map((node) => ({ ...node }));
      el.edges = EDGES.map((edge) => ({ ...edge }));
      el.messages = {
        nodeCount: "{count} عقد",
        nodeCountOne: "عقدة واحدة",
        edgeCount: "{count} اتصالات",
        edgeCountOne: "اتصال واحد"
      };
      await el.updateComplete;
      // The invariant is "the One key answers exactly when the RUNTIME's
      // plural rules classify the count as one", so the expectation must be
      // derived from the same Intl data the component consults. Hardcoding
      // CLDR ("3 is few in Arabic") breaks on engines shipping reduced ICU:
      // CI's Linux WebKit classifies 3 as one and the test lied red.
      const rules = new Intl.PluralRules("ar");
      const format = (count: number) =>
        new Intl.NumberFormat("ar", { useGrouping: false }).format(count);
      expect(hudSegments(el)[0], "node tally must follow the runtime plural category").to.equal(
        rules.select(3) === "one" ? "عقدة واحدة" : `${format(3)} عقد`
      );
      expect(hudSegments(el)[2], "edge tally must follow the runtime plural category").to.equal(
        rules.select(1) === "one" ? "اتصال واحد" : `${format(1)} اتصالات`
      );
    });

    it("honours intentional empty overrides for the role description and separator", async () => {
      const el = await graphFixture();
      el.messages = { editorRole: "", hudSeparator: "", zoomLevel: "" };
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-roledescription")
      ).to.equal("");
      expect(hudSegments(el)).to.deep.equal(["3 nodes", "", "1 edge", "", ""]);
    });

    it("relocalizes the canvas role and summary chip when the language changes", async () => {
      const el = await graphFixture();
      el.lang = "fr";
      await aTimeout(0);
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector('[part="base"]')!.getAttribute("aria-roledescription")
      ).to.equal("éditeur de graphe de nœuds");
      expect(hudSegments(el)).to.deep.equal(["3 nœuds", "·", "1 connexion", "·", "100%"]);
    });

    it("stays accessible with every owned string overridden", async () => {
      const el = await graphFixture();
      el.messages = {
        editorRole: "knooppuntgrafiek-editor",
        nodeRole: "knooppunt",
        nodeName: "{node} ({type})",
        inputPort: "ingang van {node}",
        outputPort: "{port}, uitgang van {node}",
        nodeCount: "{count} knopen",
        edgeCount: "{count} verbindingen",
        zoomLevel: "zoom {percent}%",
        hudSeparator: "|"
      };
      await el.updateComplete;
      await expect(el).to.be.accessible();
    });
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

  describe("pointer panning", () => {
    it("pans with a drag on empty canvas and settles the viewport on release", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const world = el.shadowRoot!.querySelector<HTMLElement>(".world")!;

      pointer(canvas, "pointerdown", inCanvas(el, 40, 420));
      expect(canvas.classList.contains("panning"), "grabbing cursor while panning").to.equal(true);
      pointer(canvas, "pointermove", inCanvas(el, 100, 450));
      await el.updateComplete;
      expect(world.getAttribute("style")).to.equal("transform:translate(100px,50px) scale(1)");

      setTimeout(() => pointer(canvas, "pointerup", inCanvas(el, 100, 450)));
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail).to.deep.equal({ x: 100, y: 50, zoom: 1 });
      expect(canvas.classList.contains("panning"), "cursor released").to.equal(false);
    });

    it("clears the selection when the drag starts on empty canvas", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      pointer(node, "pointerdown", at(node));
      pointer(canvas, "pointerup", at(node));
      await el.updateComplete;
      expect(nodeEl(el, "b").classList.contains("selected")).to.equal(true);

      setTimeout(() => pointer(canvas, "pointerdown", inCanvas(el, 40, 420)));
      const event = await oneEvent(el, "fluid-selection-change");
      expect(event.detail).to.deep.equal({ nodeId: null, edgeId: null });
    });

    it("ignores a non-primary pointer button", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      pointer(canvas, "pointerdown", { ...inCanvas(el, 40, 420), button: 2 });
      expect(canvas.classList.contains("panning")).to.equal(false);
      pointer(canvas, "pointermove", inCanvas(el, 300, 420));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector<HTMLElement>(".world")!.getAttribute("style")).to.equal(
        "transform:translate(40px,20px) scale(1)"
      );
    });

    it("ignores a pointer release that no gesture started", async () => {
      const el = await graphFixture();
      const seen: unknown[] = [];
      el.addEventListener("fluid-viewport-change", (event) =>
        seen.push((event as CustomEvent).detail)
      );
      pointer(canvasOf(el), "pointerup", inCanvas(el, 40, 420));
      await el.updateComplete;
      expect(seen).to.deep.equal([]);
    });

    it("does not emit a move for a press that never moved the node", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      const moves: unknown[] = [];
      const selections: unknown[] = [];
      el.addEventListener("fluid-node-move", (event) => moves.push((event as CustomEvent).detail));
      el.addEventListener("fluid-selection-change", (event) =>
        selections.push((event as CustomEvent).detail)
      );

      pointer(node, "pointerdown", at(node));
      pointer(canvas, "pointerup", at(node));
      // Pressing the already selected node must not re-announce the selection.
      pointer(node, "pointerdown", at(node));
      pointer(canvas, "pointerup", at(node));
      await el.updateComplete;

      expect(moves, "a press without movement is not a move").to.deep.equal([]);
      expect(selections).to.deep.equal([{ nodeId: "b", edgeId: null }]);
    });
  });

  describe("wheel zoom", () => {
    it("zooms toward the pointer and announces the new level", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const point = inCanvas(el, 400, 250);
      const rect = canvas.getBoundingClientRect();
      const factor = Math.exp(100 * 0.0012);
      const wheel = new WheelEvent("wheel", {
        deltaY: -100,
        bubbles: true,
        composed: true,
        cancelable: true,
        ...point
      });

      setTimeout(() => canvas.dispatchEvent(wheel));
      const event = await oneEvent(el, "fluid-viewport-change");
      await el.updateComplete;

      const cx = point.clientX - rect.left;
      const cy = point.clientY - rect.top;
      expect(wheel.defaultPrevented, "the page must not scroll").to.equal(true);
      expect(event.detail.zoom).to.be.closeTo(factor, 1e-9);
      expect(event.detail.x, "the point under the cursor stays put").to.be.closeTo(
        cx - (cx - 40) * factor,
        1e-9
      );
      expect(event.detail.y).to.be.closeTo(cy - (cy - 20) * factor, 1e-9);
      expect(live(el)).to.equal(`Zoom ${Math.round(factor * 100)} percent`);
    });

    it("zooms out on a downward wheel", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      setTimeout(() =>
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: 200,
            bubbles: true,
            composed: true,
            cancelable: true,
            ...inCanvas(el, 400, 250)
          })
        )
      );
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail.zoom).to.be.closeTo(Math.exp(-200 * 0.0012), 1e-9);
    });
  });

  describe("pointer connections", () => {
    it("drags from an output port onto an input port to connect", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const port = outPortEl(el, "b", "done");
      const target = inPortEl(el, "c");

      pointer(port, "pointerdown", at(port));
      await el.updateComplete;
      expect(canvas.classList.contains("linking"), "crosshair cursor").to.equal(true);
      expect(el.shadowRoot!.querySelector(".edge-preview"), "preview follows the cursor").to.exist;
      const first = el.shadowRoot!.querySelector(".edge-preview")!.getAttribute("d");
      pointer(canvas, "pointermove", at(target));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")!.getAttribute("d")).not.to.equal(first);

      setTimeout(() => pointer(canvas, "pointerup", at(target)));
      const event = await oneEvent(el, "fluid-connect");
      await el.updateComplete;
      expect(event.detail).to.include({ from: "b", port: "done", to: "c" });
      expect(el.edges.length).to.equal(2);
      expect(el.shadowRoot!.querySelector(".edge-preview"), "preview cleared").to.equal(null);
      expect(canvas.classList.contains("linking")).to.equal(false);
    });

    it("drops on a node body to connect, not only on its port", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const canvas = canvasOf(el);
      const port = outPortEl(el, "a", "next");

      pointer(port, "pointerdown", at(port));
      setTimeout(() => pointer(canvas, "pointerup", at(nodeEl(el, "b"))));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail).to.include({ from: "a", port: "next", to: "b" });
    });

    it("drops on empty canvas without connecting", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const port = outPortEl(el, "b", "done");
      pointer(port, "pointerdown", at(port));
      pointer(canvas, "pointerup", inCanvas(el, 40, 420));
      await el.updateComplete;
      expect(el.edges.map((edge) => edge.id)).to.deep.equal(["e1"]);
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
    });

    it("picks a connected input port back up and reroutes it", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const grabbed = inPortEl(el, "b");

      const removed = oneEvent(el, "fluid-edge-remove");
      pointer(grabbed, "pointerdown", at(grabbed));
      expect((await removed).detail.id, "the edge detaches on grab").to.equal("e1");
      await el.updateComplete;
      expect(el.edges).to.deep.equal([]);
      expect(el.shadowRoot!.querySelector(".edge-preview"), "it now follows the cursor").to.exist;

      setTimeout(() => pointer(canvas, "pointerup", at(inPortEl(el, "c"))));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail).to.include({ from: "a", port: "next", to: "c" });
    });

    it("dropping a picked-up connection on empty canvas removes it", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const grabbed = inPortEl(el, "b");
      pointer(grabbed, "pointerdown", at(grabbed));
      pointer(canvas, "pointerup", inCanvas(el, 40, 420));
      await el.updateComplete;
      expect(el.edges).to.deep.equal([]);
      expect(live(el)).to.equal("Connection from Start to Sync data removed");
    });

    it("grabbing an input port with no incoming connection drags the node instead", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const grabbed = inPortEl(el, "c");
      const start = at(grabbed);

      pointer(grabbed, "pointerdown", start);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview"), "no connection to pick up").to.equal(
        null
      );
      const moved = { clientX: start.clientX + 40, clientY: start.clientY };
      pointer(canvas, "pointermove", moved);
      await el.updateComplete;
      setTimeout(() => pointer(canvas, "pointerup", moved));
      const event = await oneEvent(el, "fluid-node-move");
      expect(event.detail).to.deep.equal({ id: "c", x: 680, y: 80 });
    });

    it("selects an edge by pressing its hit area without clearing it again", async () => {
      const el = await graphFixture();
      const hit = el.shadowRoot!.querySelector<SVGPathElement>("path.edge-hit")!;
      setTimeout(() =>
        hit.dispatchEvent(
          new PointerEvent("pointerdown", { button: 0, bubbles: true, composed: true })
        )
      );
      const event = await oneEvent(el, "fluid-selection-change");
      await el.updateComplete;
      expect(event.detail).to.deep.equal({ nodeId: null, edgeId: "e1" });
      expect(el.shadowRoot!.querySelector("path.edge.selected"), "press does not bubble to the pan")
        .to.exist;
    });
  });

  describe("readonly", () => {
    it("leaves every pointer mutation inert", async () => {
      const el = await graphFixture();
      el.readonly = true;
      await el.updateComplete;
      const canvas = canvasOf(el);
      const port = outPortEl(el, "b", "done");
      const start = at(port);

      pointer(port, "pointerdown", start);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview"), "no link starts").to.equal(null);
      pointer(canvas, "pointermove", { clientX: start.clientX + 80, clientY: start.clientY });
      await el.updateComplete;
      expect(el.nodes.find((node) => node.id === "b")!.x, "no node moves").to.equal(336);
      pointer(canvas, "pointerup", at(inPortEl(el, "c")));

      const grabbed = inPortEl(el, "b");
      pointer(grabbed, "pointerdown", at(grabbed));
      pointer(canvas, "pointerup", at(grabbed));
      await el.updateComplete;
      expect(
        el.edges.map((edge) => edge.id),
        "no connection is detached"
      ).to.deep.equal(["e1"]);
    });

    it("abandons an in-flight connection when the graph turns readonly mid-drag", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const port = outPortEl(el, "b", "done");
      pointer(port, "pointerdown", at(port));
      el.readonly = true;
      await el.updateComplete;
      pointer(canvas, "pointerup", at(inPortEl(el, "c")));
      await el.updateComplete;
      expect(el.edges.map((edge) => edge.id)).to.deep.equal(["e1"]);
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
    });

    it("refuses keyboard removal of a node and of a selected connection", async () => {
      const el = await graphFixture();
      key(inPortEl(el, "b"), "Enter");
      await el.updateComplete;
      el.readonly = true;
      await el.updateComplete;

      key(canvasOf(el), "Delete");
      await el.updateComplete;
      expect(
        el.edges.map((edge) => edge.id),
        "connection kept"
      ).to.deep.equal(["e1"]);

      key(nodeEl(el, "b"), "Delete");
      await el.updateComplete;
      expect(el.nodes.length, "node kept").to.equal(3);
    });

    it("refuses to start a keyboard connection", async () => {
      const el = await graphFixture();
      el.readonly = true;
      await el.updateComplete;
      key(outPortEl(el, "b", "done"), "Enter");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
      expect(live(el)).to.equal("");
    });

    it("ignores drops from a palette", async () => {
      const el = await graphFixture();
      el.readonly = true;
      await el.updateComplete;
      const canvas = canvasOf(el);
      const transfer = new DataTransfer();
      transfer.setData(el.dropFormat, "task");
      const drops: unknown[] = [];
      el.addEventListener("fluid-node-drop", (event) => drops.push((event as CustomEvent).detail));

      const over = dragEvent("dragover", transfer, inCanvas(el, 240, 220));
      canvas.dispatchEvent(over);
      canvas.dispatchEvent(dragEvent("drop", transfer, inCanvas(el, 240, 220)));
      await aTimeout(0);
      expect(over.defaultPrevented, "the drop is not advertised").to.equal(false);
      expect(drops).to.deep.equal([]);
    });
  });

  describe("palette drops", () => {
    it("accepts a matching payload and reports world coordinates", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const transfer = new DataTransfer();
      transfer.setData(el.dropFormat, "task:email");

      const over = dragEvent("dragover", transfer, inCanvas(el, 240, 220));
      canvas.dispatchEvent(over);
      expect(over.defaultPrevented, "advertises the drop target").to.equal(true);

      const drop = dragEvent("drop", transfer, inCanvas(el, 240, 220));
      setTimeout(() => canvas.dispatchEvent(drop));
      const event = await oneEvent(el, "fluid-node-drop");
      expect(drop.defaultPrevented).to.equal(true);
      expect(event.detail.data).to.equal("task:email");
      expect(event.detail.x, "world x, not client x").to.equal(200);
      expect(event.detail.y).to.equal(200);
    });

    it("reports world coordinates through the current pan and zoom", async () => {
      const el = await graphFixture();
      el.resetViewport();
      el.zoomBy(2);
      await el.updateComplete;
      const canvas = canvasOf(el);
      const rect = canvas.getBoundingClientRect();
      const transfer = new DataTransfer();
      transfer.setData(el.dropFormat, "task");
      const drop = dragEvent("drop", transfer, inCanvas(el, 240, 220));
      setTimeout(() => canvas.dispatchEvent(drop));
      const event = await oneEvent(el, "fluid-node-drop");
      // zoomBy(2) around the canvas center leaves viewX = w/2 - (w/2 - 40) * 2.
      const viewX = rect.width / 2 - (rect.width / 2 - 40) * 2;
      const viewY = rect.height / 2 - (rect.height / 2 - 20) * 2;
      expect(event.detail.x).to.be.closeTo((240 - viewX) / 2, 1e-6);
      expect(event.detail.y).to.be.closeTo((220 - viewY) / 2, 1e-6);
    });

    it("ignores a payload the drop format does not cover", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const transfer = new DataTransfer();
      transfer.setData("text/plain", "not ours");
      const drops: unknown[] = [];
      el.addEventListener("fluid-node-drop", (event) => drops.push((event as CustomEvent).detail));

      const over = dragEvent("dragover", transfer, inCanvas(el, 240, 220));
      canvas.dispatchEvent(over);
      const drop = dragEvent("drop", transfer, inCanvas(el, 240, 220));
      canvas.dispatchEvent(drop);
      await aTimeout(0);
      expect(over.defaultPrevented).to.equal(false);
      expect(drop.defaultPrevented).to.equal(false);
      expect(drops).to.deep.equal([]);
    });

    it("honours a custom drop-format", async () => {
      const el = await graphFixture();
      el.dropFormat = "application/x-my-palette";
      await el.updateComplete;
      const transfer = new DataTransfer();
      transfer.setData("application/x-my-palette", "step");
      setTimeout(() =>
        canvasOf(el).dispatchEvent(dragEvent("drop", transfer, inCanvas(el, 240, 220)))
      );
      const event = await oneEvent(el, "fluid-node-drop");
      expect(event.detail.data).to.equal("step");
    });
  });

  describe("keyboard on the canvas", () => {
    it("pans in every direction and returns to where it started", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const seen: unknown[] = [];
      el.addEventListener("fluid-viewport-change", (event) =>
        seen.push((event as CustomEvent).detail)
      );

      expect(key(canvas, "ArrowLeft").defaultPrevented, "the page must not scroll").to.equal(true);
      key(canvas, "ArrowUp");
      key(canvas, "ArrowRight");
      key(canvas, "ArrowDown");
      await el.updateComplete;

      expect(seen).to.deep.equal([
        { x: 80, y: 20, zoom: 1 },
        { x: 80, y: 60, zoom: 1 },
        { x: 40, y: 60, zoom: 1 },
        { x: 40, y: 20, zoom: 1 }
      ]);
    });

    it("zooms in and out with both plus and both minus keys", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const seen: number[] = [];
      el.addEventListener("fluid-viewport-change", (event) =>
        seen.push((event as CustomEvent).detail.zoom)
      );

      key(canvas, "+");
      key(canvas, "=");
      key(canvas, "-");
      key(canvas, "_");
      await el.updateComplete;

      expect(seen.length).to.equal(4);
      expect(seen[0]).to.be.closeTo(1.2, 1e-9);
      expect(seen[1]).to.be.closeTo(1.44, 1e-9);
      expect(seen[2]).to.be.closeTo(1.2, 1e-9);
      expect(seen[3]).to.be.closeTo(1, 1e-9);
      expect(el.shadowRoot!.querySelector(".hud")!.textContent).to.contain("100%");
      expect(live(el)).to.equal("Zoom 100 percent");
    });

    it("Home fits every node into view", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const rect = canvas.getBoundingClientRect();
      // Bounds of the three fixture nodes, padded by the component's own 40px.
      const minX = 40 - 40;
      const minY = 64 - 40;
      const spanX = 640 + el.nodeWidth + 40 - minX;
      const spanY = 64 + 116 + 40 - minY;
      const zoom = Math.min(
        2,
        Math.max(0.4, Math.min(rect.width / spanX, rect.height / spanY, 1.25))
      );
      const seen: { x: number; y: number; zoom: number }[] = [];
      el.addEventListener("fluid-viewport-change", (event) =>
        seen.push((event as CustomEvent).detail)
      );

      const event = key(canvas, "Home");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(true);
      expect(seen.length).to.equal(1);
      expect(seen[0]!.zoom).to.be.closeTo(zoom, 1e-9);
      expect(seen[0]!.x).to.be.closeTo((rect.width - spanX * zoom) / 2 - minX * zoom, 1e-9);
      expect(seen[0]!.y).to.be.closeTo((rect.height - spanY * zoom) / 2 - minY * zoom, 1e-9);
    });

    it("leaves unrelated keys to the page", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const seen: unknown[] = [];
      el.addEventListener("fluid-viewport-change", (event) => seen.push(event));
      const event = key(canvas, "q");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(false);
      expect(seen).to.deep.equal([]);
    });

    it("ignores canvas keys pressed on a node", async () => {
      const el = await graphFixture();
      const seen: unknown[] = [];
      el.addEventListener("fluid-viewport-change", (event) => seen.push(event));
      key(nodeEl(el, "b"), "Home");
      await el.updateComplete;
      expect(seen, "Home on a node is not a fit").to.deep.equal([]);
    });

    it("Delete removes the selected node and returns focus to the canvas", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      pointer(node, "pointerdown", at(node));
      pointer(canvas, "pointerup", at(node));
      await el.updateComplete;

      const event = key(canvas, "Delete");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(true);
      expect(el.nodes.map((entry) => entry.id)).to.deep.equal(["a", "c"]);
      expect(el.shadowRoot!.activeElement, "focus stays inside the editor").to.equal(canvas);
      expect(live(el)).to.equal("Sync data removed");
    });

    it("survives a Delete aimed at data the host already removed", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      pointer(node, "pointerdown", at(node));
      pointer(canvas, "pointerup", at(node));
      await el.updateComplete;
      const removals: unknown[] = [];
      el.addEventListener("fluid-node-remove", (event) => removals.push(event));

      el.nodes = el.nodes.filter((entry) => entry.id !== "b");
      key(canvas, "Delete");
      await el.updateComplete;
      expect(removals).to.deep.equal([]);
      expect(el.nodes.map((entry) => entry.id)).to.deep.equal(["a", "c"]);
    });

    it("survives a Delete aimed at a connection the host already removed", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      key(inPortEl(el, "b"), "Enter");
      await el.updateComplete;
      const removals: unknown[] = [];
      el.addEventListener("fluid-edge-remove", (event) => removals.push(event));

      el.edges = [];
      key(canvas, "Delete");
      await el.updateComplete;
      expect(removals).to.deep.equal([]);
    });
  });

  describe("keyboard on a node, continued", () => {
    it("nudges left and up", async () => {
      const el = await graphFixture();
      key(nodeEl(el, "b"), "ArrowLeft");
      await el.updateComplete;
      key(nodeEl(el, "b"), "ArrowUp");
      await el.updateComplete;
      const node = el.nodes.find((entry) => entry.id === "b")!;
      expect(node.x).to.equal(336 - el.grid);
      expect(node.y).to.equal(64 - el.grid);
    });

    it("rounds to whole pixels when grid snapping is disabled", async () => {
      const el = await graphFixture();
      el.grid = 0;
      el.nodes = el.nodes.map((node) => (node.id === "b" ? { ...node, x: 336.6 } : node));
      await el.updateComplete;
      setTimeout(() => key(nodeEl(el, "b"), "ArrowRight"));
      const event = await oneEvent(el, "fluid-node-move");
      expect(event.detail).to.deep.equal({ id: "b", x: 338, y: 64 });
    });

    it("Enter and Space select the node and announce it", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      const enter = key(node, "Enter");
      await el.updateComplete;
      expect(enter.defaultPrevented).to.equal(true);
      expect(node.classList.contains("selected")).to.equal(true);
      expect(live(el)).to.equal("Sync data selected");

      const seen: unknown[] = [];
      el.addEventListener("fluid-selection-change", (event) => seen.push(event));
      key(node, " ");
      await el.updateComplete;
      expect(live(el)).to.equal("Sync data selected");
      expect(seen, "re-selecting the same node is not a change").to.deep.equal([]);
    });

    it("leaves unrelated keys to the page", async () => {
      const el = await graphFixture();
      const event = key(nodeEl(el, "b"), "x");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(false);
      expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336);
    });

    it("survives an arrow aimed at data the host already removed", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      const moves: unknown[] = [];
      el.addEventListener("fluid-node-move", (event) => moves.push(event));
      el.nodes = el.nodes.filter((entry) => entry.id !== "b");
      key(node, "ArrowRight");
      await el.updateComplete;
      expect(moves).to.deep.equal([]);
    });

    it("survives a press aimed at data the host already removed", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      const seen: unknown[] = [];
      el.addEventListener("fluid-selection-change", (event) => seen.push(event));
      el.nodes = el.nodes.filter((entry) => entry.id !== "b");
      pointer(node, "pointerdown", at(node));
      pointer(canvasOf(el), "pointerup", at(node));
      await el.updateComplete;
      expect(seen).to.deep.equal([]);
    });

    it("clears the selection when the selected node is removed", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      pointer(node, "pointerdown", at(node));
      pointer(canvasOf(el), "pointerup", at(node));
      await el.updateComplete;
      setTimeout(() => key(nodeEl(el, "b"), "Delete"));
      const event = await oneEvent(el, "fluid-selection-change");
      expect(event.detail).to.deep.equal({ nodeId: null, edgeId: null });
    });
  });

  describe("keyboard connect, continued", () => {
    it("cycles candidates in both directions and wraps around", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      const candidate = (): string | undefined =>
        el.shadowRoot!.querySelector<HTMLElement>(".connect-candidate")?.dataset["nodeId"];

      key(port, "Enter");
      await el.updateComplete;
      // Candidates are ordered by distance from the source: b (296px) then c (600px).
      expect(candidate()).to.equal("b");
      expect(live(el)).to.equal("Sync data, 1 of 2");

      key(port, "ArrowDown");
      await el.updateComplete;
      expect(candidate()).to.equal("c");
      expect(live(el)).to.equal("End, 2 of 2");

      key(port, "ArrowDown");
      await el.updateComplete;
      expect(candidate(), "forward wraps to the first").to.equal("b");

      key(port, "ArrowUp");
      await el.updateComplete;
      expect(candidate(), "backward wraps to the last").to.equal("c");

      key(port, "ArrowLeft");
      await el.updateComplete;
      expect(candidate()).to.equal("b");
    });

    it("Space starts and commits a connection", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      const start = key(port, " ");
      await el.updateComplete;
      expect(start.defaultPrevented).to.equal(true);
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.exist;

      setTimeout(() => key(port, " "));
      const event = await oneEvent(el, "fluid-connect");
      expect(event.detail).to.include({ from: "a", port: "next", to: "b" });
    });

    it("Tab cancels the link but still moves focus", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      key(port, "Enter");
      await el.updateComplete;
      const tab = key(port, "Tab");
      await el.updateComplete;
      expect(tab.defaultPrevented, "Tab must reach the focus manager").to.equal(false);
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
      expect(live(el)).to.equal("Connection cancelled");
    });

    it("leaves unrelated keys alone while a link is live", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      key(port, "Enter");
      await el.updateComplete;
      const event = key(port, "z");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(false);
      expect(el.shadowRoot!.querySelector(".edge-preview"), "the link survives").to.exist;
    });

    it("cancels the link when the output port loses focus", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      port.focus();
      key(port, "Enter");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.exist;

      canvasOf(el).focus();
      await el.updateComplete;
      expect(
        el.shadowRoot!.querySelector(".edge-preview"),
        "an abandoned link does not linger"
      ).to.equal(null);
      expect(live(el), "a silent cancel does not interrupt the reader").to.equal(
        "Sync data, 1 of 2"
      );
    });

    it("announces a refusal when the target stops being valid mid-link", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      key(port, "Enter");
      await el.updateComplete;

      // The host connects the same pair from elsewhere; the pending target is
      // now a duplicate and commit must fail loudly rather than silently.
      el.edges = [{ id: "e9", from: "a", port: "next", to: "b" }];
      await el.updateComplete;
      key(port, "Enter");
      await el.updateComplete;
      expect(live(el)).to.equal("Could not connect");
      expect(el.edges.map((edge) => edge.id)).to.deep.equal(["e9"]);
    });

    it("drops the preview when the pending target disappears", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      const port = outPortEl(el, "a", "next");
      key(port, "Enter");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.exist;

      el.nodes = el.nodes.filter((node) => node.id !== "b");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);

      // Cycling back onto the vanished candidate must not re-announce it.
      key(port, "ArrowDown");
      await el.updateComplete;
      expect(live(el)).to.equal("End, 2 of 2");
      key(port, "ArrowUp");
      await el.updateComplete;
      expect(live(el)).to.equal("End, 2 of 2");
    });

    it("reports no targets when the host emptied the graph under the port", async () => {
      const el = await graphFixture();
      const port = outPortEl(el, "b", "done");
      el.nodes = [];
      key(port, "Enter");
      await el.updateComplete;
      expect(live(el)).to.equal("No available targets to connect to");
    });

    it("clears a pending link when a pointer gesture starts", async () => {
      const el = await graphFixture();
      el.edges = [];
      await el.updateComplete;
      key(outPortEl(el, "a", "next"), "Enter");
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.exist;

      const canvas = canvasOf(el);
      pointer(canvas, "pointerdown", inCanvas(el, 40, 420));
      pointer(canvas, "pointerup", inCanvas(el, 40, 420));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector(".edge-preview")).to.equal(null);
    });
  });

  describe("connections through the input port", () => {
    it("Space selects the newest incoming connection", async () => {
      const el = await graphFixture();
      el.edges = [
        { id: "e1", from: "a", port: "next", to: "b" },
        { id: "e2", from: "c", port: "next", to: "b" }
      ];
      el.nodeTypes = { ...TYPES, end: { label: "End", outputs: [{ id: "next" }] } };
      await el.updateComplete;
      const event = key(inPortEl(el, "b"), " ");
      await el.updateComplete;
      expect(event.defaultPrevented).to.equal(true);
      expect(live(el)).to.equal(
        "Connection from End to Sync data selected. Press Delete to remove it."
      );
    });

    it("does nothing on an input port with no incoming connection", async () => {
      const el = await graphFixture();
      const seen: unknown[] = [];
      el.addEventListener("fluid-selection-change", (event) => seen.push(event));
      key(inPortEl(el, "c"), "Enter");
      await el.updateComplete;
      expect(seen).to.deep.equal([]);
      expect(live(el)).to.equal("");
    });

    it("names a connection by raw id when its source node is gone", async () => {
      const el = await graphFixture();
      el.edges = [{ id: "orphan", from: "vanished", port: "next", to: "c" }];
      await el.updateComplete;
      expect(el.shadowRoot!.querySelectorAll("path.edge").length, "undrawable edge").to.equal(0);

      key(inPortEl(el, "c"), "Enter");
      await el.updateComplete;
      expect(live(el)).to.equal(
        "Connection from vanished to End selected. Press Delete to remove it."
      );

      setTimeout(() => key(inPortEl(el, "c"), "Delete"));
      const event = await oneEvent(el, "fluid-edge-remove");
      await el.updateComplete;
      expect(event.detail.id).to.equal("orphan");
      expect(live(el)).to.equal("Connection from vanished to End removed");
    });

    it("names a connection by raw id when its target node is gone", async () => {
      const el = await graphFixture();
      key(inPortEl(el, "b"), "Enter");
      await el.updateComplete;
      el.nodes = el.nodes.filter((node) => node.id !== "b");
      key(canvasOf(el), "Delete");
      await el.updateComplete;
      expect(live(el)).to.equal("Connection from Start to b removed");
    });
  });

  describe("viewport API", () => {
    it("resetViewport returns to the initial pan and zoom", async () => {
      const el = await graphFixture();
      el.zoomBy(1.5);
      key(canvasOf(el), "ArrowLeft");
      await el.updateComplete;
      setTimeout(() => el.resetViewport());
      const event = await oneEvent(el, "fluid-viewport-change");
      await el.updateComplete;
      expect(event.detail).to.deep.equal({ x: 40, y: 20, zoom: 1 });
      expect(el.shadowRoot!.querySelector(".hud")!.textContent).to.contain("100%");
    });

    it("fitView falls back to the reset viewport for an empty graph", async () => {
      const el = await graphFixture();
      el.nodes = [];
      el.zoomBy(1.5);
      await el.updateComplete;
      setTimeout(() => el.fitView());
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail).to.deep.equal({ x: 40, y: 20, zoom: 1 });
    });

    it("centerOn puts a node in the middle at the current zoom", async () => {
      const el = await graphFixture();
      const rect = canvasOf(el).getBoundingClientRect();
      setTimeout(() => el.centerOn("b"));
      const event = await oneEvent(el, "fluid-viewport-change");
      expect(event.detail.zoom).to.equal(1);
      expect(event.detail.x).to.be.closeTo(rect.width / 2 - (336 + el.nodeWidth / 2), 1e-9);
      expect(event.detail.y).to.be.closeTo(rect.height / 2 - (64 + 116 / 2), 1e-9);
    });

    it("centerOn ignores an unknown node", async () => {
      const el = await graphFixture();
      const seen: unknown[] = [];
      el.addEventListener("fluid-viewport-change", (event) => seen.push(event));
      el.centerOn("nowhere");
      await el.updateComplete;
      expect(seen).to.deep.equal([]);
    });
  });

  describe("node type catalog", () => {
    it("falls back to the default type for an unregistered node type", async () => {
      const el = await graphFixture();
      el.nodes = [...el.nodes, { id: "d", type: "mystery", x: 40, y: 300 }];
      await el.updateComplete;
      const node = nodeEl(el, "d");
      expect(node.getAttribute("aria-label"), "the raw type names it").to.equal("mystery");
      expect(node.style.height, "default height").to.equal("92px");
      expect(node.querySelector("[data-in-node]"), "accepts input by default").to.exist;
      expect(node.querySelectorAll("[data-out-port]").length, "one default output").to.equal(1);
    });

    it("renders no output ports for a type that declares none", async () => {
      const el = await graphFixture();
      el.nodeTypes = { ...TYPES, task: { label: "Task", height: 116, outputs: undefined } };
      await el.updateComplete;
      expect(nodeEl(el, "b").querySelectorAll("[data-out-port]").length).to.equal(0);
      expect(el.connectNodes("b", "done", "c"), "and refuses to connect from one").to.equal(null);
    });

    it("draws an edge from the first port when its port id left the catalog", async () => {
      const el = await graphFixture();
      el.edges = [{ id: "stale", from: "b", port: "retired", to: "c" }];
      await el.updateComplete;
      const path = el.shadowRoot!.querySelector<SVGPathElement>("path.edge")!;
      expect(path.classList.contains("tone-neutral"), "an unknown port has no tone").to.equal(true);
      // Port row 0 of b: height 116 - 20 bottom - one 26px gap = 70.
      expect(path.getAttribute("d")).to.contain(`M ${336 + el.nodeWidth} ${64 + 70}`);
    });

    it("names a node by its title when the type label matches", async () => {
      const el = await graphFixture();
      el.nodes = el.nodes.map((node) => (node.id === "b" ? { ...node, label: "Task" } : node));
      await el.updateComplete;
      expect(nodeEl(el, "b").getAttribute("aria-label")).to.equal("Task");
    });

    it("falls back to the type label for a blank node title", async () => {
      const el = await graphFixture();
      el.nodes = el.nodes.map((node) => (node.id === "b" ? { ...node, label: "   " } : node));
      await el.updateComplete;
      expect(nodeEl(el, "b").getAttribute("aria-label")).to.equal("Task");
    });
  });

  describe("node dragging", () => {
    it("ignores a drag that stays inside one grid cell", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      const start = at(node);
      const moves: unknown[] = [];
      el.addEventListener("fluid-node-move", (event) => moves.push(event));

      pointer(node, "pointerdown", start);
      const nudged = { clientX: start.clientX + 2, clientY: start.clientY + 2 };
      pointer(canvas, "pointermove", nudged);
      pointer(canvas, "pointerup", nudged);
      await el.updateComplete;

      expect(moves, "a sub-grid twitch is not a move").to.deep.equal([]);
      expect(el.nodes.find((entry) => entry.id === "b")!.x).to.equal(336);
      expect(el.nodes.find((entry) => entry.id === "b")!.y).to.equal(64);
    });

    it("abandons a drag when the host removes the node mid-gesture", async () => {
      const el = await graphFixture();
      const canvas = canvasOf(el);
      const node = nodeEl(el, "b");
      const start = at(node);
      const moves: unknown[] = [];
      el.addEventListener("fluid-node-move", (event) => moves.push(event));

      pointer(node, "pointerdown", start);
      el.nodes = el.nodes.filter((entry) => entry.id !== "b");
      const away = { clientX: start.clientX + 80, clientY: start.clientY };
      pointer(canvas, "pointermove", away);
      pointer(canvas, "pointerup", away);
      await el.updateComplete;

      expect(moves).to.deep.equal([]);
      expect(el.nodes.map((entry) => entry.id)).to.deep.equal(["a", "c"]);
    });

    it("does not repeat a move for two arrow presses in the same frame", async () => {
      const el = await graphFixture();
      const node = nodeEl(el, "b");
      const moves: unknown[] = [];
      el.addEventListener("fluid-node-move", (event) => moves.push((event as CustomEvent).detail));

      key(node, "ArrowUp");
      // Before the re-render the handler still holds the pre-move node, so the
      // second press resolves to the position the first one already reached.
      key(node, "ArrowUp");
      await el.updateComplete;

      expect(moves).to.deep.equal([{ id: "b", x: 336, y: 64 - el.grid }]);
      expect(el.nodes.find((entry) => entry.id === "b")!.y).to.equal(64 - el.grid);
    });
  });

  it("starts a keyboard link from a port id the catalog no longer lists", async () => {
    const el = await graphFixture();
    el.edges = [];
    await el.updateComplete;
    const port = outPortEl(el, "b", "done");
    // The host swaps the type catalog under an already rendered graph.
    el.nodeTypes = {
      ...TYPES,
      task: { label: "Task", height: 116, outputs: [{ id: "resolved", label: "Resolved" }] }
    };
    key(port, "Enter");
    await el.updateComplete;
    expect(live(el)).to.equal("End, 1 of 1");
    expect(el.shadowRoot!.querySelector(".edge-preview")).to.exist;
  });

  it("keeps formatting and tallying when the engine rejects the active locale", async () => {
    const el = await graphFixture();
    const numberFormat = Object.getOwnPropertyDescriptor(Intl, "NumberFormat")!;
    const pluralRules = Object.getOwnPropertyDescriptor(Intl, "PluralRules")!;
    // A reduced-ICU build carries English only and throws for anything else.
    const englishOnly = (actual: unknown): unknown =>
      new Proxy(actual as new (...args: unknown[]) => object, {
        construct(target, args) {
          const locale = args[0];
          if (typeof locale === "string" && !locale.startsWith("en")) {
            throw new RangeError(`Incorrect locale information provided: ${locale}`);
          }
          return Reflect.construct(target, args) as object;
        }
      });
    try {
      Object.defineProperty(Intl, "NumberFormat", {
        ...numberFormat,
        value: englishOnly(numberFormat.value)
      });
      Object.defineProperty(Intl, "PluralRules", {
        ...pluralRules,
        value: englishOnly(pluralRules.value)
      });
      el.messages = { nodeCountOne: "één knooppunt", edgeCountOne: "één verbinding" };
      el.lang = "nl";
      await aTimeout(0);
      await el.updateComplete;

      // Digits fall back to English formatting; the plural category falls back
      // to the English rules, which still put 1 in `one` and 3 in `other`.
      expect(
        [...el.shadowRoot!.querySelectorAll(".hud span")].map((span) => span.textContent)
      ).to.deep.equal(["3 knooppunten", "·", "één verbinding", "·", "100%"]);
    } finally {
      Object.defineProperty(Intl, "NumberFormat", numberFormat);
      Object.defineProperty(Intl, "PluralRules", pluralRules);
    }
  });

  it("generates connection ids without crypto.randomUUID", async () => {
    const el = await graphFixture();
    const descriptor = Object.getOwnPropertyDescriptor(Crypto.prototype, "randomUUID");
    try {
      if (descriptor) Reflect.deleteProperty(Crypto.prototype, "randomUUID");
      const first = el.connectNodes("b", "done", "c");
      const second = el.connectNodes("b", "failed", "c");
      expect(first, "a connection is still made").not.to.equal(null);
      expect(first!.id, "the timestamp fallback names it").to.match(/^ng-[a-z0-9]+-[a-z0-9]+$/);
      expect(second!.id, "ids stay unique").not.to.equal(first!.id);
    } finally {
      if (descriptor) Object.defineProperty(Crypto.prototype, "randomUUID", descriptor);
    }
  });
});
