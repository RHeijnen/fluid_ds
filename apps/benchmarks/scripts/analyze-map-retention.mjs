import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const snapshotPath = process.argv[2] ?? join(here, "..", "map-retention.heapsnapshot");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const { nodes, edges, strings } = snapshot;
const nodeFields = snapshot.snapshot.meta.node_fields;
const edgeFields = snapshot.snapshot.meta.edge_fields;
const nodeTypes = snapshot.snapshot.meta.node_types[0];
const edgeTypes = snapshot.snapshot.meta.edge_types[0];
const nodeWidth = nodeFields.length;
const edgeWidth = edgeFields.length;
const nodeTypeOffset = nodeFields.indexOf("type");
const nodeNameOffset = nodeFields.indexOf("name");
const nodeIdOffset = nodeFields.indexOf("id");
const nodeEdgeCountOffset = nodeFields.indexOf("edge_count");
const edgeTypeOffset = edgeFields.indexOf("type");
const edgeNameOffset = edgeFields.indexOf("name_or_index");
const edgeTargetOffset = edgeFields.indexOf("to_node");
const weakEdgeType = edgeTypes.indexOf("weak");
const nodeCount = nodes.length / nodeWidth;
const edgeStarts = new Uint32Array(nodeCount + 1);

for (let node = 0, edge = 0; node < nodeCount; node += 1) {
  edgeStarts[node] = edge;
  edge += nodes[node * nodeWidth + nodeEdgeCountOffset];
}
edgeStarts[nodeCount] = edges.length / edgeWidth;

function nodeLabel(node) {
  const offset = node * nodeWidth;
  return `${nodeTypes[nodes[offset + nodeTypeOffset]]} ${JSON.stringify(strings[nodes[offset + nodeNameOffset]])} #${nodes[offset + nodeIdOffset]}`;
}

function edgeLabel(edge) {
  const offset = edge * edgeWidth;
  const type = edgeTypes[edges[offset + edgeTypeOffset]];
  const rawName = edges[offset + edgeNameOffset];
  const name = type === "element" || type === "hidden" ? rawName : strings[rawName];
  return `${type} ${JSON.stringify(name)}`;
}

const targets = new Set();
for (let source = 0; source < nodeCount; source += 1) {
  for (let edge = edgeStarts[source]; edge < edgeStarts[source + 1]; edge += 1) {
    const offset = edge * edgeWidth;
    const type = edgeTypes[edges[offset + edgeTypeOffset]];
    if (type !== "property") continue;
    if (strings[edges[offset + edgeNameOffset]] !== "__fluidExpansionRetainedMap") continue;
    targets.add(source);
  }
}

if (!targets.size) {
  console.log("Tagged maps: 0");
  console.log("No tagged Leaflet Map survived the benchmark's forced-GC window.");
  process.exit(0);
}

let frontier = targets;
const childByParent = new Map();
let root;
for (let depth = 0; depth < 16 && !root; depth += 1) {
  const next = new Set();
  for (let source = 0; source < nodeCount; source += 1) {
    for (let edge = edgeStarts[source]; edge < edgeStarts[source + 1]; edge += 1) {
      const offset = edge * edgeWidth;
      if (edges[offset + edgeTypeOffset] === weakEdgeType) continue;
      const target = edges[offset + edgeTargetOffset] / nodeWidth;
      if (!frontier.has(target) || childByParent.has(source)) continue;
      childByParent.set(source, { child: target, edge });
      next.add(source);
      if (source === 0) {
        root = source;
        break;
      }
    }
    if (root !== undefined) break;
  }
  if (!next.size) break;
  frontier = next;
}

if (root === undefined) {
  console.error(`Tagged maps: ${targets.size}; no root path found within 16 reverse levels.`);
  process.exitCode = 1;
} else {
  const path = [];
  let current = root;
  while (!targets.has(current)) {
    const step = childByParent.get(current);
    if (!step) throw new Error(`Broken retaining path at node ${current}`);
    path.push(`${nodeLabel(current)} --${edgeLabel(step.edge)}-->`);
    current = step.child;
  }
  path.push(nodeLabel(current));
  console.log(`Tagged maps: ${targets.size}`);
  console.log(path.join("\n"));
}
