import { css, html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { FluidElement } from "@fluid-ds/components/internal/base-element";

/** Tone of a port and the edges drawn from it. Status tones are theme-independent. */
export type NodeGraphTone = "neutral" | "accent" | "success" | "danger" | "warning" | "info";

/** Paint state of a node during a traversal (set via the `runStates` property). */
export type NodeGraphRunState = "idle" | "running" | "success" | "error";

/** An output connection point on a node type. */
export interface NodeGraphPort {
  id: string;
  /** Short label rendered beside the port and used in accessible names. */
  label?: string;
  tone?: NodeGraphTone;
}

/**
 * Describes one kind of node. Port topology is a property of the TYPE, not of
 * individual nodes: every node of a type has the same connection points, which
 * is what keeps a serialized graph replayable against a changed catalog.
 */
export interface NodeGraphNodeType {
  /** Human label for the type, used in default rendering and accessible names. */
  label?: string;
  /** Accent color for the node's leading edge and icon slot. Any CSS color. */
  accent?: string;
  /** Node height in world pixels. Defaults to 92. */
  height?: number;
  /** Whether nodes of this type accept incoming connections. Defaults to true. */
  input?: boolean;
  /** Output ports, in top-to-bottom order. Defaults to a single "next" port. */
  outputs?: readonly NodeGraphPort[];
  /** Whether nodes of this type can be deleted. Defaults to true. */
  removable?: boolean;
}

/** A node instance on the canvas. Positions are world-space pixels. */
export interface NodeGraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  summary?: string;
}

/** A directed connection from an output port to a node's input. */
export interface NodeGraphEdge {
  id: string;
  from: string;
  port: string;
  to: string;
}

/**
 * Every string the graph itself owns: live-region announcements, accessible
 * names, role descriptions and the visual summary chip. All of them are
 * overridable for localization through the `messages` property.
 *
 * Values are templates. A `{name}` placeholder is replaced with the variable
 * documented for that key, and a placeholder with no matching variable is left
 * verbatim. Numbers arrive already formatted for the active locale. A key left
 * unset resolves against the built-in dictionary for the nearest `lang`, so
 * `messages` refines one editor rather than standing in for a locale.
 *
 * Node titles, node-type labels and port labels are application data: the
 * component places them into these templates but never translates them.
 */
export interface NodeGraphMessages {
  /** A node moved. Vars: `node`, `x`, `y`. */
  nodeMoved: string;
  /** A node and its connections were removed. Vars: `node`. */
  nodeRemoved: string;
  /** A node was selected. Vars: `node`. */
  nodeSelected: string;
  /** An incoming connection was selected. Vars: `from`, `to`. */
  edgeSelected: string;
  /** A connection was removed. Vars: `from`, `to`. */
  edgeRemoved: string;
  /** A keyboard connection started from an output port. Vars: `node`, `port`. */
  connectStart: string;
  /** The previewed connection target changed. Vars: `node`, `index`, `count`. */
  connectCandidate: string;
  /** A connection was made. Vars: `from`, `to`. */
  connected: string;
  /** A keyboard connection was cancelled. No vars. */
  connectCancelled: string;
  /** A connection was refused by the validity guards. No vars. */
  connectFailed: string;
  /** An output port has no valid target left. No vars. */
  connectNoTargets: string;
  /** The zoom changed. Vars: `percent`. */
  zoomChanged: string;
  /** Accessible name of a node's input port. Vars: `node`. */
  inputPort: string;
  /** Accessible name of an output port. Vars: `port`, `node`. */
  outputPort: string;
  /** `aria-roledescription` of a node. No vars. */
  nodeRole: string;
  /** `aria-roledescription` of the canvas. No vars. */
  editorRole: string;
  /**
   * Accessible name of a node whose type label differs from its own title, so
   * the type is spoken after the title. Vars: `node`, `type`. A node with no
   * distinct type label is named by its title alone and never reaches this
   * template.
   */
  nodeName: string;
  /**
   * Node tally in the visual summary chip. Vars: `count`. Answers for every
   * plural category except `one`, which prefers `nodeCountOne` when it is set.
   */
  nodeCount: string;
  /**
   * Node tally when the active locale puts the count in the `one` plural
   * category. Unset, the count falls back to `nodeCount`. Vars: `count`.
   */
  nodeCountOne: string;
  /** Connection tally in the visual summary chip. Vars: `count`. */
  edgeCount: string;
  /** Connection tally for the `one` plural category. Vars: `count`. */
  edgeCountOne: string;
  /** Zoom readout in the visual summary chip. Vars: `percent`. */
  zoomLevel: string;
  /** Separator drawn between the summary chip's segments. No vars. */
  hudSeparator: string;
}

const format = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));

interface NodeGraphAnnouncement {
  key: keyof NodeGraphMessages;
  vars: Record<string, string | number>;
}

const DEFAULT_TYPE: Required<Pick<NodeGraphNodeType, "height" | "input" | "removable">> &
  NodeGraphNodeType = {
  height: 92,
  input: true,
  removable: true,
  outputs: [{ id: "next" }]
};

/** Vertical center of the input port, in node-local pixels. */
const IN_Y = 30;
/** Vertical gap between stacked output ports. */
const PORT_GAP = 26;
/** Distance from the node's bottom edge to the last output port. */
const PORT_BOTTOM = 20;

const graphId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ng-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;

type DragState =
  | { mode: "node"; nodeId: string; offsetX: number; offsetY: number; moved: boolean }
  | { mode: "pan"; startX: number; startY: number; viewX: number; viewY: number }
  | { mode: "link"; from: string; port: string };

interface KeyboardLink {
  from: string;
  port: string;
  candidates: string[];
  index: number;
}

/**
 * An editable node graph: draggable nodes with typed connection ports, joined
 * by Bezier edges. The graph knows nothing about what a node MEANS; a
 * `nodeTypes` registry supplies each type's label, accent, height and port
 * topology, and a `renderNode` callback can take over the node body entirely.
 * Everything domain-shaped stays in the consumer.
 *
 * Pointer: drag a node by its body to move it (grid-snapped), drag empty
 * canvas to pan, wheel to zoom at the pointer, drag from an output port to a
 * node to connect, grab a connected input port to pick the connection up again
 * (drop on empty canvas to remove it). Click a node or an edge to select it;
 * Delete removes the selection.
 *
 * Keyboard, at full parity: Tab reaches every node and port. On a node, arrow
 * keys nudge by one grid step (Shift for four), Enter or Space selects, Delete
 * removes. On an output port, Enter starts a connection, ArrowUp / ArrowDown
 * cycle through valid targets (previewed on the canvas), Enter connects and
 * Escape cancels. On an input port, Enter selects the newest incoming
 * connection so Delete can remove it. On the canvas itself, arrows pan, plus
 * and minus zoom, and Home fits the graph. Arrow movement, panning, ports and
 * graph coordinates are physical and remain unchanged in RTL. Every mutation
 * is announced through a polite live region.
 *
 * Every string the component owns (announcements, accessible names, both role
 * descriptions and the visual summary chip) resolves from the dictionary for
 * the nearest `lang` and can be replaced per instance through `messages`.
 * Node, type and port labels stay application data.
 *
 * The component applies mutations to its own `nodes` / `edges` state and
 * emits an event for each one, so a consumer can either treat it as the owner
 * of the drawing or mirror every event into an external store.
 *
 * Traversal display is data, not behavior: paint per-node badges via
 * `runStates` and dashed marching-ants edges via `traversedEdges`; the
 * component never runs a traversal itself.
 *
 * @summary Accessible node graph editor with typed ports and Bezier edges.
 *
 * @csspart base - The canvas viewport (the focusable, pannable surface).
 * @csspart node - A single node.
 * @csspart node-body - The content area of a node.
 * @csspart port - Every connection point button.
 * @csspart edge - Every visible edge path.
 * @csspart hud - The node / edge / zoom readout overlay.
 *
 * @cssproperty --fluid-node-graph-bg - Canvas background. Falls back to --fluid-surface-subtle.
 * @cssproperty --fluid-node-graph-grid-color - Dot grid color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-node-graph-node-bg - Node background. Falls back to --fluid-surface-base.
 * @cssproperty --fluid-node-graph-node-border - Node border color. Falls back to --fluid-border-default.
 * @cssproperty --fluid-node-graph-node-radius - Node corner radius. Falls back to --fluid-radius-md.
 * @cssproperty --fluid-node-graph-edge-color - Default edge stroke. Falls back to --fluid-text-secondary.
 * @cssproperty --fluid-node-graph-edge-width - Edge stroke width. Defaults to 2px.
 * @cssproperty --fluid-node-graph-fg - Node text color. Falls back to --fluid-text-primary.
 *
 * @uses-token --fluid-surface-subtle - Default canvas background.
 * @uses-token --fluid-surface-base - Default node background.
 * @uses-token --fluid-border-default - Default node border and grid dots.
 * @uses-token --fluid-text-primary - Default node text.
 * @uses-token --fluid-text-secondary - Default edge stroke, summaries, HUD.
 * @uses-token --fluid-accent-base - Selection, focus rings, accent-toned ports.
 * @uses-token --fluid-success-base - Success-toned ports and edges.
 * @uses-token --fluid-danger-base - Danger-toned ports and edges.
 * @uses-token --fluid-warning-base - Warning-toned ports and edges.
 * @uses-token --fluid-info-base - Info-toned ports, edges and running badges.
 * @uses-token --fluid-radius-md - Default node radius.
 * @uses-token --fluid-radius-full - HUD pill radius.
 * @uses-token --fluid-space-1 - Small gaps.
 * @uses-token --fluid-space-2 - Node padding.
 * @uses-token --fluid-space-3 - HUD placement.
 * @uses-token --fluid-shadow-sm - Node elevation.
 * @uses-token --fluid-font-family-sans - Typography.
 * @uses-token --fluid-font-size-sm - Node titles.
 * @uses-token --fluid-font-size-xs - Summaries, port labels, HUD.
 * @uses-token --fluid-focus-ring-width - Focus ring width (2px AA / 3px AAA).
 * @uses-token --fluid-focus-ring-offset - Focus ring offset (scales with conformance).
 * @uses-token --fluid-target-min - Minimum port target size (24px AA / 44px AAA).
 *
 * @fires fluid-node-move - A node moved. detail: { id, x, y }.
 * @fires fluid-node-remove - A node (and its edges) was removed. detail: { id }.
 * @fires fluid-connect - An edge was created. detail: { id, from, port, to }.
 * @fires fluid-edge-remove - An edge was removed. detail: { id, from, port, to }.
 * @fires fluid-selection-change - Selection changed. detail: { nodeId, edgeId } (either or both null).
 * @fires fluid-viewport-change - Pan or zoom settled. detail: { x, y, zoom }.
 * @fires fluid-node-drop - Something was dropped on the canvas (see drop-format). detail: { data, x, y } in world coordinates.
 */
export class FluidNodeGraph extends FluidElement {
  static override styles = css`
    :host {
      display: block;
      color: var(--fluid-node-graph-fg, var(--fluid-text-primary, #18181b));
      font-family: var(--fluid-font-family-sans, system-ui, sans-serif);
    }
    .canvas {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 20rem;
      overflow: hidden;
      cursor: grab;
      touch-action: none;
      border-radius: var(--fluid-node-graph-node-radius, var(--fluid-radius-md, 0.5rem));
      background-color: var(--fluid-node-graph-bg, var(--fluid-surface-subtle, #fafafa));
      background-image: radial-gradient(
        circle,
        var(--fluid-node-graph-grid-color, var(--fluid-border-default, #e4e4e7)) 1px,
        transparent 1px
      );
      background-size: 24px 24px;
    }
    .canvas:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: calc(-1 * var(--fluid-focus-ring-width, 2px));
    }
    .canvas.panning {
      cursor: grabbing;
    }
    .canvas.linking {
      cursor: crosshair;
    }
    .world {
      position: absolute;
      inset: 0;
      transform-origin: 0 0;
      pointer-events: none;
    }
    .edges {
      position: absolute;
      top: 0;
      left: 0;
      overflow: visible;
      pointer-events: none;
    }
    .edges path {
      pointer-events: auto;
    }
    .edge-hit {
      fill: none;
      stroke: transparent;
      stroke-width: 14;
      cursor: pointer;
    }
    .edge {
      fill: none;
      stroke: var(--fluid-node-graph-edge-color, var(--fluid-text-secondary, #52525b));
      stroke-width: var(--fluid-node-graph-edge-width, 2px);
      pointer-events: none;
    }
    .edge.tone-accent {
      stroke: var(--fluid-accent-base, #4f46e5);
    }
    .edge.tone-success {
      stroke: var(--fluid-success-base, #16a34a);
    }
    .edge.tone-danger {
      stroke: var(--fluid-danger-base, #dc2626);
    }
    .edge.tone-warning {
      stroke: var(--fluid-warning-base, #d97706);
    }
    .edge.tone-info {
      stroke: var(--fluid-info-base, #2563eb);
    }
    .edge.selected {
      stroke: var(--fluid-accent-base, #4f46e5);
      stroke-width: calc(var(--fluid-node-graph-edge-width, 2px) + 1px);
    }
    .edge.traversed {
      stroke-dasharray: 8 6;
      animation: march 1s linear infinite;
    }
    .edge-preview {
      fill: none;
      stroke: var(--fluid-accent-base, #4f46e5);
      stroke-width: var(--fluid-node-graph-edge-width, 2px);
      stroke-dasharray: 6 6;
      pointer-events: none;
    }
    @keyframes march {
      to {
        stroke-dashoffset: -28;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .edge.traversed {
        animation: none;
      }
    }

    .nodes {
      position: absolute;
      top: 0;
      left: 0;
    }
    .node {
      position: absolute;
      pointer-events: auto;
      border: 1px solid var(--fluid-node-graph-node-border, var(--fluid-border-default, #e4e4e7));
      /* Graph ports and edge coordinates are physical: input remains on the
         left and output remains on the right in every writing direction. */
      border-left: 4px solid var(--node-accent, var(--fluid-accent-base, #4f46e5));
      border-radius: var(--fluid-node-graph-node-radius, var(--fluid-radius-md, 0.5rem));
      background: var(--fluid-node-graph-node-bg, var(--fluid-surface-base, #ffffff));
      box-shadow: var(--fluid-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12));
      cursor: move;
      user-select: none;
    }
    .node:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: var(--fluid-focus-ring-offset, 2px);
    }
    .node.selected {
      box-shadow: 0 0 0 2px var(--fluid-accent-base, #4f46e5);
    }
    .node.connect-candidate {
      box-shadow: 0 0 0 2px var(--fluid-accent-base, #4f46e5);
    }
    .node.run-running {
      box-shadow: 0 0 0 2px var(--fluid-info-base, #2563eb);
    }
    .node.run-success {
      box-shadow: 0 0 0 2px var(--fluid-success-base, #16a34a);
    }
    .node.run-error {
      box-shadow: 0 0 0 2px var(--fluid-danger-base, #dc2626);
    }
    .node-body {
      display: grid;
      gap: var(--fluid-space-1, 0.25rem);
      padding: var(--fluid-space-2, 0.5rem);
      overflow: hidden;
    }
    .node-title {
      font-size: var(--fluid-font-size-sm, 0.875rem);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .node-summary {
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-text-secondary, #52525b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .run-badge {
      position: absolute;
      inset-block-start: -9px;
      inset-inline-end: -9px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--fluid-node-graph-node-bg, var(--fluid-surface-base, #ffffff));
      pointer-events: none;
    }
    .run-badge.running {
      border: 2px solid var(--fluid-info-base, #2563eb);
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
    }
    .run-badge.success {
      border: 2px solid var(--fluid-success-base, #16a34a);
    }
    .run-badge.error {
      border: 2px solid var(--fluid-danger-base, #dc2626);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .run-badge.running {
        animation: none;
        border-top-color: var(--fluid-info-base, #2563eb);
        border-style: dashed;
      }
    }

    /* The button is the target (>= 24px, scaling to 44px under AAA); the
       visible dot inside stays small so the geometry reads as a port. */
    .port {
      position: absolute;
      display: grid;
      place-items: center;
      width: max(24px, var(--fluid-target-min, 24px));
      height: max(24px, var(--fluid-target-min, 24px));
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      transform: translate(-50%, -50%);
      cursor: crosshair;
      z-index: 2;
    }
    .port .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid var(--fluid-node-graph-node-bg, var(--fluid-surface-base, #ffffff));
      background: var(--fluid-node-graph-edge-color, var(--fluid-text-secondary, #52525b));
    }
    .port:hover .dot {
      transform: scale(1.35);
    }
    .port:focus-visible {
      outline: var(--fluid-focus-ring-width, 2px) solid var(--fluid-accent-base, #4f46e5);
      outline-offset: var(--fluid-focus-ring-offset, 2px);
      border-radius: 50%;
    }
    .port.linking .dot {
      background: var(--fluid-accent-base, #4f46e5);
    }
    .port.tone-accent .dot {
      background: var(--fluid-accent-base, #4f46e5);
    }
    .port.tone-success .dot {
      background: var(--fluid-success-base, #16a34a);
    }
    .port.tone-danger .dot {
      background: var(--fluid-danger-base, #dc2626);
    }
    .port.tone-warning .dot {
      background: var(--fluid-warning-base, #d97706);
    }
    .port.tone-info .dot {
      background: var(--fluid-info-base, #2563eb);
    }
    .port-label {
      position: absolute;
      right: 12px;
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-text-secondary, #52525b);
      transform: translateY(-50%);
      pointer-events: none;
      white-space: nowrap;
    }

    .hud {
      position: absolute;
      inset-block-end: var(--fluid-space-3, 0.75rem);
      inset-inline-start: var(--fluid-space-3, 0.75rem);
      display: flex;
      gap: var(--fluid-space-2, 0.5rem);
      align-items: center;
      font-size: var(--fluid-font-size-xs, 0.75rem);
      color: var(--fluid-text-secondary, #52525b);
      background: var(--fluid-node-graph-node-bg, var(--fluid-surface-base, #ffffff));
      border: 1px solid var(--fluid-node-graph-node-border, var(--fluid-border-default, #e4e4e7));
      border-radius: var(--fluid-radius-full, 999px);
      padding: var(--fluid-space-1, 0.25rem) var(--fluid-space-2, 0.5rem);
      pointer-events: none;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  /** The nodes on the canvas. Set as a property. */
  @property({ attribute: false }) nodes: NodeGraphNode[] = [];

  /** The connections between nodes. Set as a property. */
  @property({ attribute: false }) edges: NodeGraphEdge[] = [];

  /** Registry mapping a node's `type` to its label, accent, height and ports. */
  @property({ attribute: false }) nodeTypes: Record<string, NodeGraphNodeType> = {};

  /** Optional renderer for a node's body. Receives the node, returns Lit-renderable content. */
  @property({ attribute: false }) renderNode?: (node: NodeGraphNode) => unknown;

  /** Per-node traversal paint state. Display only; the host runs the traversal. */
  @property({ attribute: false }) runStates: Record<string, NodeGraphRunState> = {};

  /** Ids of edges to paint with the traversed (marching ants) style. */
  @property({ attribute: false }) traversedEdges: string[] = [];

  /**
   * Overrides for every string the graph owns: announcements, accessible
   * names, role descriptions and the visual summary chip. See
   * `NodeGraphMessages` for the keys, their variables and their defaults.
   */
  @property({ attribute: false }) messages: Partial<NodeGraphMessages> = {};

  /** Accessible name of the editor. */
  @property()
  get label(): string {
    return this.labelOverride ?? this.term("nodeGraph");
  }
  set label(value: string | null) {
    this.labelOverride = value;
  }
  private labelOverride: string | null = null;

  /** Grid snap step in world pixels. 0 disables snapping. */
  @property({ type: Number }) grid = 8;

  /** Node width in world pixels. All nodes share one width. */
  @property({ type: Number, attribute: "node-width" }) nodeWidth = 230;

  @property({ type: Number, attribute: "min-zoom" }) minZoom = 0.4;

  @property({ type: Number, attribute: "max-zoom" }) maxZoom = 2;

  /** Blocks every mutation (move, connect, remove, drop). Pan, zoom and selection stay live. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** The dataTransfer type accepted on drop; matching drops emit fluid-node-drop. */
  @property({ attribute: "drop-format" }) dropFormat = "text/fluid-node-graph";

  @state() private viewX = 40;
  @state() private viewY = 20;
  @state() private zoom = 1;
  @state() private selectedNodeId = "";
  @state() private selectedEdgeId = "";
  @state() private linkPointer: { x: number; y: number } | null = null;
  @state() private keyboardLink: KeyboardLink | null = null;
  @state() private liveAnnouncements: NodeGraphAnnouncement[] = [];

  /** False while `liveAnnouncements` holds lines the live region has not rendered yet. */
  private liveAnnouncementsFlushed = true;

  private drag: DragState | null = null;

  override disconnectedCallback(): void {
    this.drag = null;
    this.keyboardLink = null;
    this.linkPointer = null;
    this.renderRoot.querySelector(".canvas")?.classList.remove("panning");
    super.disconnectedCallback();
  }

  private isCustomControl(event: Event): boolean {
    return event
      .composedPath()
      .some(
        (entry) =>
          entry instanceof HTMLElement &&
          !entry.matches(".port") &&
          (entry.isContentEditable ||
            entry.matches("input,textarea,select,button,a[href],[role='textbox']"))
      );
  }

  /* ------------------------------------------------------------ model helpers */

  private typeOf(node: NodeGraphNode): NodeGraphNodeType & typeof DEFAULT_TYPE {
    return { ...DEFAULT_TYPE, ...(this.nodeTypes[node.type] ?? {}) };
  }

  private nodeById(id: string): NodeGraphNode | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  private nodeTitle(node: NodeGraphNode): string {
    return node.label?.trim() || this.typeOf(node).label || node.type;
  }

  private nodeHeight(node: NodeGraphNode): number {
    return this.typeOf(node).height;
  }

  private outPorts(node: NodeGraphNode): readonly NodeGraphPort[] {
    return this.typeOf(node).outputs ?? [];
  }

  private hasInput(node: NodeGraphNode): boolean {
    return this.typeOf(node).input;
  }

  private portY(node: NodeGraphNode, portId: string): number {
    const ports = this.outPorts(node);
    const index = Math.max(
      0,
      ports.findIndex((port) => port.id === portId)
    );
    const height = this.nodeHeight(node);
    return height - PORT_BOTTOM - (ports.length - 1 - index) * PORT_GAP;
  }

  private portTone(node: NodeGraphNode, portId: string): NodeGraphTone {
    return this.outPorts(node).find((port) => port.id === portId)?.tone ?? "neutral";
  }

  private portLabel(node: NodeGraphNode, portId: string): string {
    const port = this.outPorts(node).find((entry) => entry.id === portId);
    return port?.label ?? port?.id ?? portId;
  }

  private snap(value: number): number {
    return this.grid > 0 ? Math.round(value / this.grid) * this.grid : Math.round(value);
  }

  /**
   * A tally message carries an optional singular companion. It answers only
   * when the consumer supplied it AND the active locale puts the count in the
   * `one` plural category; every other category takes the general key, which
   * is how the built-in dictionaries phrase their own fallback form.
   */
  private pluralVariant(
    key: keyof NodeGraphMessages,
    vars: Record<string, string | number>
  ): keyof NodeGraphMessages {
    if (key !== "nodeCount" && key !== "edgeCount") return key;
    const singular = key === "nodeCount" ? "nodeCountOne" : "edgeCountOne";
    if (this.messages[singular] === undefined) return key;
    return this.pluralCategory(Number(vars["count"] ?? 0)) === "one" ? singular : key;
  }

  private pluralCategory(value: number): Intl.LDMLPluralRule {
    try {
      return new Intl.PluralRules(this.localize.locale || undefined).select(value);
    } catch {
      return new Intl.PluralRules("en").select(value);
    }
  }

  private msg(key: keyof NodeGraphMessages, vars: Record<string, string | number> = {}): string {
    const override = this.messages[this.pluralVariant(key, vars)];
    if (override !== undefined) {
      // The messages contract promises "numbers arrive already formatted for
      // the active locale"; interpolate numeric vars through the same
      // formatter the built-in dictionary path uses, so an override template
      // renders the same digits (for example Arabic-Indic) as the defaults.
      const localized = Object.fromEntries(
        Object.entries(vars).map(([name, value]) => [
          name,
          typeof value === "number" ? this.formatNumber(value) : value
        ])
      );
      return format(override, localized);
    }
    const text = (name: string): string => String(vars[name] ?? "");
    const number = (name: string): string => this.formatNumber(Number(vars[name] ?? 0));
    const count = (): number => Number(vars["count"] ?? 0);
    switch (key) {
      case "nodeMoved":
        return this.term("nodeGraphNodeMoved", text("node"), number("x"), number("y"));
      case "nodeRemoved":
        return this.term("nodeGraphNodeRemoved", text("node"));
      case "nodeSelected":
        return this.term("nodeGraphNodeSelected", text("node"));
      case "edgeSelected":
        return this.term("nodeGraphEdgeSelected", text("from"), text("to"));
      case "edgeRemoved":
        return this.term("nodeGraphEdgeRemoved", text("from"), text("to"));
      case "connectStart":
        return this.term("nodeGraphConnectStart", text("node"), text("port"));
      case "connectCandidate":
        return this.term(
          "nodeGraphConnectCandidate",
          text("node"),
          number("index"),
          number("count")
        );
      case "connected":
        return this.term("nodeGraphConnected", text("from"), text("to"));
      case "connectCancelled":
        return this.term("nodeGraphConnectCancelled");
      case "connectFailed":
        return this.term("nodeGraphConnectFailed");
      case "connectNoTargets":
        return this.term("nodeGraphConnectNoTargets");
      case "zoomChanged":
        return this.term("nodeGraphZoomChanged", number("percent"));
      case "inputPort":
        return this.term("nodeGraphInputPort", text("node"));
      case "outputPort":
        return this.term("nodeGraphOutputPort", text("port"), text("node"));
      case "nodeRole":
        return this.term("nodeGraphNodeRole");
      case "editorRole":
        return this.term("nodeGraphEditorRole");
      case "nodeName":
        return `${text("node")}, ${text("type")}`;
      case "nodeCount":
      case "nodeCountOne":
        return this.term("nodeGraphNodeCount", count(), number("count"));
      case "edgeCount":
      case "edgeCountOne":
        return this.term("nodeGraphEdgeCount", count(), number("count"));
      case "zoomLevel":
        return `${number("percent")}%`;
      case "hudSeparator":
        return "·";
    }
  }

  private formatNumber(value: number): string {
    try {
      return new Intl.NumberFormat(this.localize.locale || undefined, {
        useGrouping: false
      }).format(value);
    } catch {
      return new Intl.NumberFormat("en", { useGrouping: false }).format(value);
    }
  }

  private announce(key: keyof NodeGraphMessages, vars: Record<string, string | number> = {}): void {
    // Announcements raised in the same tick compose into one live-region
    // update. Overwriting instead would drop every line but the last before
    // the render assistive technology observes: keyboard linking raises
    // "connectStart" and the first candidate back to back. A repeat of the
    // same key does replace its pending line, though: of one fact (say the
    // zoom level), only the newest value is worth hearing.
    const pending = this.liveAnnouncementsFlushed
      ? []
      : this.liveAnnouncements.filter((entry) => entry.key !== key);
    this.liveAnnouncements = [...pending, { key, vars }];
    this.liveAnnouncementsFlushed = false;
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.liveAnnouncementsFlushed = true;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  /* ------------------------------------------------------------ mutations */

  private moveNode(id: string, x: number, y: number, announce = false): void {
    if (this.readonly) return;
    const node = this.nodeById(id);
    if (!node) return;
    const nx = this.snap(x);
    const ny = this.snap(y);
    if (node.x === nx && node.y === ny) return;
    this.nodes = this.nodes.map((entry) => (entry.id === id ? { ...entry, x: nx, y: ny } : entry));
    this.emit("fluid-node-move", { id, x: nx, y: ny });
    if (announce) this.announce("nodeMoved", { node: this.nodeTitle(node), x: nx, y: ny });
  }

  private removeNode(id: string): void {
    if (this.readonly) return;
    const node = this.nodeById(id);
    if (!node || !this.typeOf(node).removable) return;
    this.nodes = this.nodes.filter((entry) => entry.id !== id);
    this.edges = this.edges.filter((edge) => edge.from !== id && edge.to !== id);
    if (this.selectedNodeId === id) this.setSelection("", "");
    this.emit("fluid-node-remove", { id });
    this.announce("nodeRemoved", { node: this.nodeTitle(node) });
    // The removed node held focus; without a new home focus falls to <body>
    // and a keyboard user is dropped out of the editor entirely.
    this.renderRoot.querySelector<HTMLElement>(".canvas")?.focus();
  }

  private removeEdge(id: string): void {
    if (this.readonly) return;
    const edge = this.edges.find((entry) => entry.id === id);
    if (!edge) return;
    this.edges = this.edges.filter((entry) => entry.id !== id);
    if (this.selectedEdgeId === id) this.setSelection(this.selectedNodeId, "");
    this.emit("fluid-edge-remove", { ...edge });
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    this.announce("edgeRemoved", {
      from: from ? this.nodeTitle(from) : edge.from,
      to: to ? this.nodeTitle(to) : edge.to
    });
  }

  /**
   * Create an edge if it is valid: the target must exist, accept input, not be
   * the source itself, and not already have this exact connection. Returns the
   * created edge or null. Public so a consumer can connect programmatically
   * through the same guards the gestures use.
   */
  connectNodes(from: string, port: string, to: string): NodeGraphEdge | null {
    if (this.readonly) return null;
    if (from === to) return null;
    const source = this.nodeById(from);
    const target = this.nodeById(to);
    if (!source || !target || !this.hasInput(target)) return null;
    if (!this.outPorts(source).some((entry) => entry.id === port)) return null;
    if (this.edges.some((edge) => edge.from === from && edge.port === port && edge.to === to))
      return null;
    const edge: NodeGraphEdge = { id: graphId(), from, port, to };
    this.edges = [...this.edges, edge];
    this.emit("fluid-connect", { ...edge });
    this.announce("connected", {
      from: this.nodeTitle(source),
      to: this.nodeTitle(target)
    });
    return edge;
  }

  private setSelection(nodeId: string, edgeId: string): void {
    if (nodeId === this.selectedNodeId && edgeId === this.selectedEdgeId) return;
    this.selectedNodeId = nodeId;
    this.selectedEdgeId = edgeId;
    this.emit("fluid-selection-change", { nodeId: nodeId || null, edgeId: edgeId || null });
  }

  /* ------------------------------------------------------------ viewport */

  private canvasRect(): DOMRect | undefined {
    return this.renderRoot.querySelector(".canvas")?.getBoundingClientRect();
  }

  private toWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvasRect();
    return {
      x: (clientX - (rect?.left ?? 0) - this.viewX) / this.zoom,
      y: (clientY - (rect?.top ?? 0) - this.viewY) / this.zoom
    };
  }

  private emitViewport(): void {
    this.emit("fluid-viewport-change", { x: this.viewX, y: this.viewY, zoom: this.zoom });
  }

  /** Reset pan and zoom to the initial viewport. */
  resetViewport(): void {
    this.viewX = 40;
    this.viewY = 20;
    this.zoom = 1;
    this.emitViewport();
  }

  /** Multiply the zoom by a factor, keeping the given canvas point (or the center) fixed. */
  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    const rect = this.canvasRect();
    const cx = centerX ?? (rect ? rect.width / 2 : 0);
    const cy = centerY ?? (rect ? rect.height / 2 : 0);
    const next = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    this.viewX = cx - ((cx - this.viewX) * next) / this.zoom;
    this.viewY = cy - ((cy - this.viewY) * next) / this.zoom;
    this.zoom = next;
    this.emitViewport();
    this.announce("zoomChanged", { percent: Math.round(this.zoom * 100) });
  }

  /** Fit every node into view, clamped to the zoom range (and never past 1.25x). */
  fitView(): void {
    const rect = this.canvasRect();
    if (!this.nodes.length || !rect) {
      this.resetViewport();
      return;
    }
    const minX = Math.min(...this.nodes.map((node) => node.x)) - 40;
    const minY = Math.min(...this.nodes.map((node) => node.y)) - 40;
    const maxX = Math.max(...this.nodes.map((node) => node.x + this.nodeWidth)) + 40;
    const maxY = Math.max(...this.nodes.map((node) => node.y + this.nodeHeight(node))) + 40;
    const zoom = Math.min(
      this.maxZoom,
      Math.max(
        this.minZoom,
        Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY), 1.25)
      )
    );
    this.zoom = zoom;
    this.viewX = (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom;
    this.viewY = (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom;
    this.emitViewport();
  }

  /** Center the viewport on a node at the current zoom. */
  centerOn(nodeId: string): void {
    const node = this.nodeById(nodeId);
    const rect = this.canvasRect();
    if (!node || !rect) return;
    this.viewX = rect.width / 2 - (node.x + this.nodeWidth / 2) * this.zoom;
    this.viewY = rect.height / 2 - (node.y + this.nodeHeight(node) / 2) * this.zoom;
    this.emitViewport();
  }

  /* ------------------------------------------------------------ pointer interaction */

  private onCanvasPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (this.isCustomControl(event)) return;
    this.cancelKeyboardLink(false);
    const path = event
      .composedPath()
      .filter((entry): entry is HTMLElement => entry instanceof HTMLElement);
    const outPort = path.find((element) => element.dataset.outPort !== undefined);
    const inPort = path.find((element) => element.dataset.inNode !== undefined);
    const nodeElement = path.find((element) => element.dataset.nodeId !== undefined);
    const canvas = event.currentTarget as HTMLElement;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic pointers cannot be captured */
    }
    if (outPort && !this.readonly) {
      const nodeId = outPort.dataset.outNode ?? "";
      this.drag = { mode: "link", from: nodeId, port: outPort.dataset.outPort ?? "" };
      this.linkPointer = this.toWorld(event.clientX, event.clientY);
      this.setSelection(nodeId, "");
      return;
    }
    // Grabbing a connected input port picks the newest connection up again: it
    // detaches immediately and follows the cursor from its source port, so a
    // drop on another node relinks it and a drop on empty canvas removes it.
    if (inPort && !this.readonly) {
      const targetId = inPort.dataset.inNode ?? "";
      const incoming = this.edges.filter((edge) => edge.to === targetId);
      const edge = incoming[incoming.length - 1];
      if (edge) {
        this.removeEdge(edge.id);
        this.drag = { mode: "link", from: edge.from, port: edge.port };
        this.linkPointer = this.toWorld(event.clientX, event.clientY);
        this.setSelection("", "");
        return;
      }
    }
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId ?? "";
      const node = this.nodeById(nodeId);
      if (!node) return;
      const world = this.toWorld(event.clientX, event.clientY);
      this.drag = {
        mode: "node",
        nodeId,
        offsetX: world.x - node.x,
        offsetY: world.y - node.y,
        moved: false
      };
      this.setSelection(nodeId, "");
      return;
    }
    this.drag = {
      mode: "pan",
      startX: event.clientX,
      startY: event.clientY,
      viewX: this.viewX,
      viewY: this.viewY
    };
    this.setSelection("", "");
    canvas.classList.add("panning");
  }

  private onCanvasPointerMove(event: PointerEvent): void {
    if (!this.drag) return;
    if (this.drag.mode === "pan") {
      this.viewX = this.drag.viewX + (event.clientX - this.drag.startX);
      this.viewY = this.drag.viewY + (event.clientY - this.drag.startY);
      return;
    }
    if (this.drag.mode === "node") {
      if (this.readonly) return;
      const world = this.toWorld(event.clientX, event.clientY);
      const node = this.nodeById(this.drag.nodeId);
      if (!node) return;
      const nx = this.snap(world.x - this.drag.offsetX);
      const ny = this.snap(world.y - this.drag.offsetY);
      if (nx === node.x && ny === node.y) return;
      this.drag.moved = true;
      // Live position while dragging; the event fires once, on release.
      this.nodes = this.nodes.map((entry) =>
        entry.id === (this.drag as { nodeId: string }).nodeId ? { ...entry, x: nx, y: ny } : entry
      );
      return;
    }
    this.linkPointer = this.toWorld(event.clientX, event.clientY);
  }

  private onCanvasPointerUp(event: PointerEvent): void {
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.remove("panning");
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    if (drag.mode === "pan") {
      this.emitViewport();
      return;
    }
    if (drag.mode === "node") {
      const node = this.nodeById(drag.nodeId);
      if (node && drag.moved) this.emit("fluid-node-move", { id: node.id, x: node.x, y: node.y });
      return;
    }
    this.linkPointer = null;
    if (this.readonly) return;
    const hits =
      this.renderRoot instanceof ShadowRoot
        ? this.renderRoot.elementsFromPoint(event.clientX, event.clientY)
        : document.elementsFromPoint(event.clientX, event.clientY);
    const inPort = hits.find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.dataset.inNode !== undefined
    );
    const nodeHit = hits.find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.dataset.nodeId !== undefined
    );
    const targetId = inPort?.dataset.inNode ?? nodeHit?.dataset.nodeId;
    if (targetId) this.connectNodes(drag.from, drag.port, targetId);
  }

  private onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.canvasRect();
    this.zoomBy(
      Math.exp(-event.deltaY * 0.0012),
      event.clientX - (rect?.left ?? 0),
      event.clientY - (rect?.top ?? 0)
    );
  }

  private onCanvasDragOver(event: DragEvent): void {
    if (this.readonly) return;
    if (event.dataTransfer?.types.includes(this.dropFormat)) event.preventDefault();
  }

  private onCanvasDrop(event: DragEvent): void {
    if (this.readonly) return;
    const data = event.dataTransfer?.getData(this.dropFormat);
    if (!data) return;
    event.preventDefault();
    const world = this.toWorld(event.clientX, event.clientY);
    this.emit("fluid-node-drop", { data, x: world.x, y: world.y });
  }

  /* ------------------------------------------------------------ keyboard interaction */

  private onCanvasKeyDown(event: KeyboardEvent): void {
    if (this.isCustomControl(event)) return;
    // Selection deletion works wherever focus sits inside the editor.
    if (event.key === "Delete" || event.key === "Backspace") {
      if (this.selectedEdgeId) {
        this.removeEdge(this.selectedEdgeId);
        event.preventDefault();
        return;
      }
      if (this.selectedNodeId && event.target === event.currentTarget) {
        this.removeNode(this.selectedNodeId);
        event.preventDefault();
        return;
      }
    }
    // The rest only when the canvas itself has focus.
    if (event.target !== event.currentTarget) return;
    const pan = 40;
    switch (event.key) {
      case "ArrowLeft":
        this.viewX += pan;
        break;
      case "ArrowRight":
        this.viewX -= pan;
        break;
      case "ArrowUp":
        this.viewY += pan;
        break;
      case "ArrowDown":
        this.viewY -= pan;
        break;
      case "+":
      case "=":
        this.zoomBy(1.2);
        return;
      case "-":
      case "_":
        this.zoomBy(1 / 1.2);
        return;
      case "Home":
        this.fitView();
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.emitViewport();
  }

  private onNodeKeyDown(event: KeyboardEvent, node: NodeGraphNode): void {
    // Keys pressed on a port inside the node are the port's business.
    if (event.target !== event.currentTarget) return;
    const step = (this.grid > 0 ? this.grid : 1) * (event.shiftKey ? 4 : 1);
    switch (event.key) {
      case "ArrowLeft":
        this.moveNode(node.id, node.x - step, node.y, true);
        break;
      case "ArrowRight":
        this.moveNode(node.id, node.x + step, node.y, true);
        break;
      case "ArrowUp":
        this.moveNode(node.id, node.x, node.y - step, true);
        break;
      case "ArrowDown":
        this.moveNode(node.id, node.x, node.y + step, true);
        break;
      case "Enter":
      case " ":
        this.setSelection(node.id, "");
        this.announce("nodeSelected", { node: this.nodeTitle(node) });
        break;
      case "Delete":
      case "Backspace":
        this.removeNode(node.id);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private candidateTargets(from: string, port: string): string[] {
    const source = this.nodeById(from);
    if (!source) return [];
    const distance = (node: NodeGraphNode): number =>
      Math.hypot(node.x - source.x, node.y - source.y);
    // A target this port already reaches would be refused as a duplicate on
    // commit; offering it as a candidate would make Enter fail silently.
    const taken = new Set(
      this.edges.filter((edge) => edge.from === from && edge.port === port).map((edge) => edge.to)
    );
    return this.nodes
      .filter((node) => node.id !== from && this.hasInput(node) && !taken.has(node.id))
      .sort((a, b) => distance(a) - distance(b))
      .map((node) => node.id);
  }

  private startKeyboardLink(from: string, port: string): void {
    if (this.readonly) return;
    const candidates = this.candidateTargets(from, port);
    if (!candidates.length) {
      this.announce("connectNoTargets");
      return;
    }
    this.keyboardLink = { from, port, candidates, index: 0 };
    const source = this.nodeById(from);
    this.announce("connectStart", {
      node: source ? this.nodeTitle(source) : from,
      port: source ? this.portLabel(source, port) : port
    });
    this.announceCandidate();
  }

  private announceCandidate(): void {
    const link = this.keyboardLink;
    if (!link) return;
    const candidateId = link.candidates[link.index];
    const candidate = candidateId ? this.nodeById(candidateId) : undefined;
    if (!candidate) return;
    this.announce("connectCandidate", {
      node: this.nodeTitle(candidate),
      index: link.index + 1,
      count: link.candidates.length
    });
  }

  private cancelKeyboardLink(announce = true): void {
    if (!this.keyboardLink) return;
    this.keyboardLink = null;
    if (announce) this.announce("connectCancelled");
  }

  private onOutPortKeyDown(event: KeyboardEvent, node: NodeGraphNode, portId: string): void {
    const link = this.keyboardLink;
    if (!link || link.from !== node.id || link.port !== portId) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.startKeyboardLink(node.id, portId);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        this.keyboardLink = { ...link, index: (link.index + 1) % link.candidates.length };
        this.announceCandidate();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        this.keyboardLink = {
          ...link,
          index: (link.index - 1 + link.candidates.length) % link.candidates.length
        };
        this.announceCandidate();
        break;
      case "Enter":
      case " ": {
        const targetId = link.candidates[link.index];
        this.keyboardLink = null;
        if (!targetId || !this.connectNodes(node.id, portId, targetId)) {
          this.announce("connectFailed");
        }
        break;
      }
      case "Escape":
      case "Tab":
        this.cancelKeyboardLink();
        if (event.key === "Escape") break;
        return; // Let Tab move focus after cancelling.
      default:
        return;
    }
    event.preventDefault();
  }

  private onInPortKeyDown(event: KeyboardEvent, node: NodeGraphNode): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const incoming = this.edges.filter((edge) => edge.to === node.id);
    const edge = incoming[incoming.length - 1];
    if (!edge) return;
    this.setSelection("", edge.id);
    const from = this.nodeById(edge.from);
    this.announce("edgeSelected", {
      from: from ? this.nodeTitle(from) : edge.from,
      to: this.nodeTitle(node)
    });
  }

  /* ------------------------------------------------------------ render */

  private edgePathFor(edge: NodeGraphEdge): string | null {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    if (!from || !to) return null;
    const x1 = from.x + this.nodeWidth;
    const y1 = from.y + this.portY(from, edge.port);
    const x2 = to.x;
    const y2 = to.y + IN_Y;
    const bend = Math.max(40, Math.min(160, Math.abs(x2 - x1) / 2));
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }

  private previewPath(): string | null {
    let from: NodeGraphNode | undefined;
    let port = "";
    let tx = 0;
    let ty = 0;
    if (this.drag?.mode === "link" && this.linkPointer) {
      from = this.nodeById(this.drag.from);
      port = this.drag.port;
      tx = this.linkPointer.x;
      ty = this.linkPointer.y;
    } else if (this.keyboardLink) {
      from = this.nodeById(this.keyboardLink.from);
      port = this.keyboardLink.port;
      const target = this.nodeById(this.keyboardLink.candidates[this.keyboardLink.index] ?? "");
      if (!target) return null;
      tx = target.x;
      ty = target.y + IN_Y;
    }
    if (!from) return null;
    const x1 = from.x + this.nodeWidth;
    const y1 = from.y + this.portY(from, port);
    const bend = Math.max(40, Math.abs(tx - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${tx - bend} ${ty}, ${tx} ${ty}`;
  }

  private renderEdges(): TemplateResult {
    const traversed = new Set(this.traversedEdges);
    const preview = this.previewPath();
    return html`<svg class="edges" width="1" height="1" aria-hidden="true">
      ${this.edges.map((edge) => {
        const path = this.edgePathFor(edge);
        if (!path) return nothing;
        const from = this.nodeById(edge.from);
        const tone = from ? this.portTone(from, edge.port) : "neutral";
        return svg`
          <path class="edge-hit" d=${path}
            @pointerdown=${(event: Event) => {
              event.stopPropagation();
              this.setSelection("", edge.id);
            }}></path>
          <path part="edge"
            class="edge tone-${tone} ${this.selectedEdgeId === edge.id ? "selected" : ""} ${traversed.has(edge.id) ? "traversed" : ""}"
            d=${path}></path>`;
      })}
      ${preview ? svg`<path class="edge-preview" d=${preview}></path>` : nothing}
    </svg>`;
  }

  private renderNodeElement(node: NodeGraphNode): TemplateResult {
    const type = this.typeOf(node);
    const title = this.nodeTitle(node);
    const runState = this.runStates[node.id] ?? "idle";
    const ports = this.outPorts(node);
    const candidateId = this.keyboardLink?.candidates[this.keyboardLink.index];
    const linking = this.keyboardLink?.from === node.id;
    return html`<div
      part="node"
      class="node ${this.selectedNodeId === node.id ? "selected" : ""} ${candidateId === node.id
        ? "connect-candidate"
        : ""} run-${runState}"
      data-node-id=${node.id}
      role="listitem"
      tabindex="0"
      aria-roledescription=${this.msg("nodeRole")}
      aria-label=${type.label && type.label !== title
        ? this.msg("nodeName", { node: title, type: type.label })
        : title}
      style="left:${node.x}px;top:${node.y}px;width:${this.nodeWidth}px;height:${this.nodeHeight(
        node
      )}px;--node-accent:${type.accent ?? "var(--fluid-accent-base, #4f46e5)"}"
      @keydown=${(event: KeyboardEvent) => this.onNodeKeyDown(event, node)}
    >
      ${runState !== "idle" ? html`<span class="run-badge ${runState}"></span>` : nothing}
      <div part="node-body" class="node-body">
        ${this.renderNode
          ? this.renderNode(node)
          : html`<span class="node-title">${title}</span> ${node.summary
                ? html`<span class="node-summary">${node.summary}</span>`
                : nothing}`}
      </div>
      ${this.hasInput(node)
        ? html`<button
            type="button"
            part="port"
            class="port in"
            data-in-node=${node.id}
            style="left:0;top:${IN_Y}px"
            aria-label=${this.msg("inputPort", { node: title })}
            @keydown=${(event: KeyboardEvent) => this.onInPortKeyDown(event, node)}
          >
            <span class="dot"></span>
          </button>`
        : nothing}
      ${ports.map(
        (port) =>
          html` ${ports.length > 1 || port.label
              ? html`<span class="port-label" style="top:${this.portY(node, port.id)}px"
                  >${this.portLabel(node, port.id)}</span
                >`
              : nothing}
            <button
              type="button"
              part="port"
              class="port out tone-${port.tone ?? "neutral"} ${linking &&
              this.keyboardLink?.port === port.id
                ? "linking"
                : ""}"
              data-out-node=${node.id}
              data-out-port=${port.id}
              style="left:${this.nodeWidth}px;top:${this.portY(node, port.id)}px"
              aria-label=${this.msg("outputPort", {
                port: this.portLabel(node, port.id),
                node: title
              })}
              @keydown=${(event: KeyboardEvent) => this.onOutPortKeyDown(event, node, port.id)}
              @blur=${() => {
                if (this.keyboardLink?.from === node.id) this.cancelKeyboardLink(false);
              }}
            >
              <span class="dot"></span>
            </button>`
      )}
    </div>`;
  }

  override render(): TemplateResult {
    return html`
      <div
        part="base"
        class="canvas ${this.drag?.mode === "link" || this.keyboardLink ? "linking" : ""}"
        role="application"
        aria-roledescription=${this.msg("editorRole")}
        aria-label=${this.label}
        dir=${this.localize.dir}
        tabindex="0"
        @pointerdown=${this.onCanvasPointerDown}
        @pointermove=${this.onCanvasPointerMove}
        @pointerup=${this.onCanvasPointerUp}
        @pointercancel=${this.onCanvasPointerUp}
        @wheel=${this.onCanvasWheel}
        @keydown=${this.onCanvasKeyDown}
        @dragover=${this.onCanvasDragOver}
        @drop=${this.onCanvasDrop}
      >
        <div
          class="world"
          style="transform:translate(${this.viewX}px,${this.viewY}px) scale(${this.zoom})"
        >
          ${this.renderEdges()}
          <div class="nodes" role="list" aria-label=${this.label}>
            ${this.nodes.map((node) => this.renderNodeElement(node))}
          </div>
        </div>
        <div part="hud" class="hud" aria-hidden="true">
          <span>${this.msg("nodeCount", { count: this.nodes.length })}</span
          ><span>${this.msg("hudSeparator")}</span>
          <span>${this.msg("edgeCount", { count: this.edges.length })}</span
          ><span>${this.msg("hudSeparator")}</span>
          <span>${this.msg("zoomLevel", { percent: Math.round(this.zoom * 100) })}</span>
        </div>
      </div>
      <div
        class="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        dir=${this.localize.dir}
      >
        ${this.liveAnnouncements.map((entry) => this.msg(entry.key, entry.vars)).join(" ")}
      </div>
    `;
  }
}
