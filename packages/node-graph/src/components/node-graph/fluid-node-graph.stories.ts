import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./define.js";
import type { NodeGraphEdge, NodeGraphNode, NodeGraphNodeType } from "./fluid-node-graph.js";

const types: Record<string, NodeGraphNodeType> = {
  trigger: {
    label: "Trigger",
    accent: "var(--fluid-accent-base)",
    input: false,
    removable: false,
    outputs: [{ id: "next", label: "Next" }]
  },
  task: {
    label: "Task",
    accent: "var(--fluid-info-base)",
    height: 116,
    outputs: [
      { id: "success", label: "On success", tone: "success" },
      { id: "error", label: "On error", tone: "danger" }
    ]
  },
  delay: {
    label: "Delay",
    accent: "var(--fluid-warning-base)",
    outputs: [{ id: "next", label: "Next" }]
  },
  stop: {
    label: "Stop",
    accent: "var(--fluid-danger-base)",
    outputs: []
  }
};

const nodes: NodeGraphNode[] = [
  { id: "start", type: "trigger", x: 40, y: 120, label: "Every night", summary: "Daily at 02:00" },
  { id: "sync", type: "task", x: 344, y: 48, label: "Sync data", summary: "Pull the latest records" },
  { id: "retry", type: "delay", x: 344, y: 240, label: "Wait 10 minutes" },
  { id: "notify", type: "task", x: 648, y: 48, label: "Notify team", summary: "Email the summary" },
  { id: "halt", type: "stop", x: 648, y: 240, label: "Stop", summary: "Give up for tonight" }
];

const edges: NodeGraphEdge[] = [
  { id: "e1", from: "start", port: "next", to: "sync" },
  { id: "e2", from: "sync", port: "success", to: "notify" },
  { id: "e3", from: "sync", port: "error", to: "retry" },
  { id: "e4", from: "retry", port: "next", to: "halt" }
];

const meta: Meta = {
  title: "Node graph/Editor",
  tags: ["autodocs"],
  parameters: { status: { type: "experimental" } },
  render: (args) => html`
    <fluid-node-graph
      style="height: 480px"
      label="Workflow editor"
      ?readonly=${Boolean(args["readonly"])}
      grid=${args["grid"] as number}
      .nodeTypes=${types}
      .nodes=${structuredClone(nodes)}
      .edges=${structuredClone(edges)}
    ></fluid-node-graph>
  `,
  args: { readonly: false, grid: 8 },
  argTypes: {
    readonly: { control: "boolean" },
    grid: { control: { type: "number", min: 0, max: 32 } }
  }
};

export default meta;
type Story = StoryObj;

/**
 * Drag nodes to move them, drag from an output port to another node to
 * connect, grab a connected input port to pick the connection up again. The
 * same editing is available from the keyboard: Tab to a node (arrows nudge,
 * Delete removes) or to an output port (Enter starts a connection, arrows
 * choose the target, Enter connects, Escape cancels).
 */
export const Editor: Story = {};

/** Pan, zoom and selection stay live; every mutation is blocked. */
export const ReadOnly: Story = { args: { readonly: true } };

/**
 * Traversal display is data, not behavior: paint per-node run badges via
 * `runStates` and marching-ants edges via `traversedEdges`. The host runs the
 * traversal (or replays a server log); the graph only shows it.
 */
export const Traversal: Story = {
  render: () => html`
    <fluid-node-graph
      style="height: 480px"
      label="Workflow run"
      readonly
      .nodeTypes=${types}
      .nodes=${structuredClone(nodes)}
      .edges=${structuredClone(edges)}
      .runStates=${{ start: "success", sync: "error", retry: "running" }}
      .traversedEdges=${["e1", "e3"]}
    ></fluid-node-graph>
  `
};

/** A `renderNode` callback takes over the node body entirely. */
export const CustomNodeContent: Story = {
  render: () => html`
    <fluid-node-graph
      style="height: 480px"
      label="Custom nodes"
      .nodeTypes=${types}
      .nodes=${structuredClone(nodes)}
      .edges=${structuredClone(edges)}
      .renderNode=${(node: NodeGraphNode) => html`
        <span style="font-weight: 700; font-size: 0.85rem">${node.label ?? node.type}</span>
        <span style="font-size: 0.7rem; color: var(--fluid-text-secondary)">
          ${node.summary ?? "No description"} · id ${node.id}
        </span>
      `}
    ></fluid-node-graph>
  `
};

/**
 * Consumers add nodes by listening for `fluid-node-drop` (set `drop-format`
 * to your palette's dataTransfer type) or by pushing into `nodes` from any UI.
 * This story wires two buttons to show the data-driven path.
 */
export const AddingNodes: Story = {
  render: () => {
    let counter = 0;
    const add = (event: Event, type: string) => {
      const graph = (event.currentTarget as HTMLElement)
        .parentElement?.querySelector("fluid-node-graph");
      if (!graph) return;
      counter += 1;
      const jitter = (counter % 5) * 24;
      graph.nodes = [
        ...graph.nodes,
        { id: `new-${counter}`, type, x: 344 + jitter, y: 120 + jitter, label: `New ${type} ${counter}` }
      ];
    };
    return html`
      <div style="display: grid; gap: 0.5rem">
        <div style="display: flex; gap: 0.5rem">
          <button @click=${(event: Event) => add(event, "task")}>Add task</button>
          <button @click=${(event: Event) => add(event, "delay")}>Add delay</button>
        </div>
        <fluid-node-graph
          style="height: 420px"
          label="Palette wiring"
          .nodeTypes=${types}
          .nodes=${structuredClone(nodes).slice(0, 2)}
          .edges=${[structuredClone(edges)[0]!]}
        ></fluid-node-graph>
      </div>
    `;
  }
};
