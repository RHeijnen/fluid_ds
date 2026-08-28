# @fluid-ds/node-graph

An accessible node graph editor for Fluid: draggable nodes with typed
connection ports, joined by Bezier edges, with pan, zoom, fit-to-view and a
full keyboard equivalent for every gesture. Expansion pack.

The graph knows nothing about what a node means. A `nodeTypes` registry
supplies each type's label, accent, height and port topology, and a
`renderNode` callback can take over the node body entirely, so the same
component draws a workflow builder, a pipeline editor or an audio patch bay.

```bash
pnpm add @fluid-ds/node-graph
```

```ts
import "@fluid-ds/node-graph/define/node-graph";

const graph = document.querySelector("fluid-node-graph");
graph.nodeTypes = {
  start: { label: "Start", input: false, removable: false, outputs: [{ id: "next" }] },
  task: { label: "Task", outputs: [{ id: "done", label: "Done", tone: "success" }, { id: "failed", label: "Failed", tone: "danger" }], height: 116 },
  end: { label: "End", outputs: [] }
};
graph.nodes = [
  { id: "a", type: "start", x: 40, y: 80 },
  { id: "b", type: "task", x: 340, y: 60, label: "Sync data" },
  { id: "c", type: "end", x: 640, y: 80 }
];
graph.edges = [{ id: "e1", from: "a", port: "next", to: "b" }];
graph.addEventListener("fluid-connect", (event) => console.log(event.detail));
```

Every mutation (move, connect, disconnect, remove) is applied to the
component's own state and emitted as an event, is fully keyboard-operable, and
is announced through a polite live region. Traversal display (running /
success / error badges and marching-ants edges) is driven by data through the
`runStates` and `traversedEdges` properties.

Docs: https://fluid-web.dev/docs/expansion/node-graph/
