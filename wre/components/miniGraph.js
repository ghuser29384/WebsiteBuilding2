const SUPPORT_COLOR = "#0a6";
const CONFLICT_COLOR = "#d23";
const SVG_NS = "http://www.w3.org/2000/svg";

const NODE_DIMENSIONS = {
  case: { radius: 22 },
  principle: { radius: 16 },
  theory: { width: 124, height: 36, radius: 28 },
};

function signOf(weight) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric)) return 1;
  return numeric < 0 ? -1 : 1;
}

function edgeMagnitude(weight) {
  const numeric = Math.abs(Number(weight));
  if (!Number.isFinite(numeric) || numeric === 0) return 1;
  return numeric;
}

function edgeId(edge, index) {
  if (edge && edge.id) return String(edge.id);
  return String(edge.from) + "->" + String(edge.to) + "#" + String(index);
}

function isEdgeSatisfied(weight, stateA, stateB) {
  return signOf(weight) * stateA * stateB === 1;
}

function normalizeState(value) {
  if (value === 1 || value === -1 || value === 0) return value;
  return 0;
}

function nodeFillForState(state) {
  if (state === 1) return "#0e8a60";
  if (state === -1) return "#d23";
  return "#d6dde6";
}

function relationForEdge(edge) {
  if (edge && String(edge.relation || "").toLowerCase() === "conflict") return "conflict";
  if (signOf(edge && edge.weight) < 0) return "conflict";
  return "support";
}

function distributedY(index, count, top, height, bottom) {
  const usable = Math.max(1, height - top - bottom);
  if (count <= 1) return top + usable / 2;
  return top + (index / (count - 1)) * usable;
}

function truncateLabel(label, maxChars) {
  const text = String(label || "").trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "...";
}

function normalizeNodeType(node, focusCaseId) {
  const raw = String(node && node.type ? node.type : "").toLowerCase();
  if (raw === "case" || (node && node.id === focusCaseId)) return "case";
  if (raw === "theory") return "theory";
  return "principle";
}

function stateLabel(state) {
  if (state === 1) return "accepted";
  if (state === -1) return "rejected";
  return "undecided";
}

function principleNameForEdge(edge, nodeLookup) {
  const from = nodeLookup[String(edge.from)];
  const to = nodeLookup[String(edge.to)];
  if (from && from.type === "principle") return from.label || from.id;
  if (to && to.type === "principle") return to.label || to.id;
  return (from && (from.label || from.id)) || (to && (to.label || to.id)) || String(edge.to || edge.from || "");
}

function desiredXForType(type, width) {
  if (type === "case") return width * 0.18;
  if (type === "theory") return width * 0.82;
  return width * 0.52;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function hashToUnit(input) {
  const text = String(input || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

function vectorNormal(dx, dy) {
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: -dy / length,
    y: dx / length,
  };
}

function trimEndpoint(start, end, trim) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const scale = clamp(trim / distance, 0, 0.45);
  return {
    x: start.x + dx * scale,
    y: start.y + dy * scale,
  };
}

function nodeRadius(nodeType) {
  const dims = NODE_DIMENSIONS[nodeType] || NODE_DIMENSIONS.principle;
  return Number(dims.radius) || 16;
}

function pairKey(from, to) {
  const a = String(from);
  const b = String(to);
  return a < b ? a + "|" + b : b + "|" + a;
}

export function computeCoherence(nodeStates, edges) {
  const safeEdges = Array.isArray(edges) ? edges : [];
  let satisfiedEdgeWeights = 0;
  let totalAbsoluteWeights = 0;

  const perEdge = safeEdges.map(function (edge, index) {
    const id = edgeId(edge, index);
    const weight = Number(edge.weight);
    const normalizedWeight = Number.isFinite(weight) ? weight : 1;
    const absWeight = edgeMagnitude(normalizedWeight);
    totalAbsoluteWeights += absWeight;

    const fromState = normalizeState(nodeStates && nodeStates[edge.from]);
    const toState = normalizeState(nodeStates && nodeStates[edge.to]);
    const satisfied = isEdgeSatisfied(normalizedWeight, fromState, toState);
    const contribution = satisfied ? normalizedWeight : 0;
    if (satisfied) {
      satisfiedEdgeWeights += normalizedWeight;
    }

    return {
      id: id,
      from: String(edge.from),
      to: String(edge.to),
      relation: relationForEdge(edge),
      weight: normalizedWeight,
      absWeight: absWeight,
      satisfied: satisfied,
      contribution: contribution,
      basis: String(edge.basis || ""),
      source: String(edge.source || ""),
    };
  });

  const denominator = totalAbsoluteWeights === 0 ? 1 : totalAbsoluteWeights;
  const score = 100 * (satisfiedEdgeWeights / denominator);

  const topContributors = perEdge
    .slice()
    .sort(function (a, b) {
      return Math.abs(b.contribution) - Math.abs(a.contribution);
    })
    .slice(0, 3);

  return {
    score: score,
    satisfiedEdgeWeights: satisfiedEdgeWeights,
    totalAbsoluteWeights: totalAbsoluteWeights,
    perEdge: perEdge,
    topContributors: topContributors,
  };
}

export function computeContributions(beforeStates, afterStates, edges) {
  const safeEdges = Array.isArray(edges) ? edges : [];
  const perEdge = safeEdges.map(function (edge, index) {
    const id = edgeId(edge, index);
    const weight = Number(edge.weight);
    const normalizedWeight = Number.isFinite(weight) ? weight : 1;

    const beforeFrom = normalizeState(beforeStates && beforeStates[edge.from]);
    const beforeTo = normalizeState(beforeStates && beforeStates[edge.to]);
    const afterFrom = normalizeState(afterStates && afterStates[edge.from]);
    const afterTo = normalizeState(afterStates && afterStates[edge.to]);

    const beforeSatisfied = isEdgeSatisfied(normalizedWeight, beforeFrom, beforeTo);
    const afterSatisfied = isEdgeSatisfied(normalizedWeight, afterFrom, afterTo);

    const beforeContribution = beforeSatisfied ? normalizedWeight : 0;
    const afterContribution = afterSatisfied ? normalizedWeight : 0;
    const delta = afterContribution - beforeContribution;

    return {
      id: id,
      from: String(edge.from),
      to: String(edge.to),
      relation: relationForEdge(edge),
      weight: normalizedWeight,
      beforeSatisfied: beforeSatisfied,
      afterSatisfied: afterSatisfied,
      beforeContribution: beforeContribution,
      afterContribution: afterContribution,
      delta: delta,
      basis: String(edge.basis || ""),
      source: String(edge.source || ""),
    };
  });

  const topContributors = perEdge
    .filter(function (item) {
      return item.delta !== 0;
    })
    .sort(function (a, b) {
      return Math.abs(b.delta) - Math.abs(a.delta);
    })
    .slice(0, 3);

  return {
    perEdge: perEdge,
    topContributors: topContributors,
  };
}

export function deriveSubgraph(caseId, allEdges, depth) {
  const safeDepth = Math.max(1, Number(depth) || 1);
  const safeEdges = Array.isArray(allEdges) ? allEdges : [];
  const visited = new Set([String(caseId)]);
  let frontier = new Set([String(caseId)]);
  const selectedEdges = [];
  const selectedEdgeIds = new Set();

  for (let level = 0; level < safeDepth; level += 1) {
    const next = new Set();
    safeEdges.forEach(function (edge, index) {
      const from = String(edge.from);
      const to = String(edge.to);
      if (!frontier.has(from) && !frontier.has(to)) return;

      const id = edgeId(edge, index);
      if (!selectedEdgeIds.has(id)) {
        selectedEdgeIds.add(id);
        selectedEdges.push(
          Object.assign({}, edge, {
            id: id,
            from: from,
            to: to,
          })
        );
      }

      if (!visited.has(from)) {
        visited.add(from);
        next.add(from);
      }
      if (!visited.has(to)) {
        visited.add(to);
        next.add(to);
      }
    });
    frontier = next;
    if (frontier.size === 0) break;
  }

  return {
    nodeIds: Array.from(visited),
    edges: selectedEdges,
  };
}

export class MiniGraph {
  constructor(container, options) {
    this.container = container;
    this.options = Object.assign(
      {
        width: 560,
        height: 320,
        iterations: 160,
      },
      options || {}
    );
    this.onNodeToggle = null;
    this.onEdgeHover = null;
    this.svg = null;
    this.positions = new Map();
  }

  ensureSvg() {
    if (this.svg) return this.svg;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "mini-graph-svg");
    svg.setAttribute("viewBox", "0 0 " + this.options.width + " " + this.options.height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Lesson coherence graph");
    this.container.innerHTML = "";
    this.container.appendChild(svg);
    this.svg = svg;
    return svg;
  }

  seedNodePositions(nodes, focusCaseId) {
    const width = this.options.width;
    const height = this.options.height;
    const top = 28;
    const bottom = 24;

    const groups = {
      case: nodes.filter((node) => node.type === "case"),
      principle: nodes.filter((node) => node.type === "principle"),
      theory: nodes.filter((node) => node.type === "theory"),
    };

    groups.case.sort((a, b) => {
      if (a.id === focusCaseId) return -1;
      if (b.id === focusCaseId) return 1;
      return a.label.localeCompare(b.label);
    });
    groups.principle.sort((a, b) => a.label.localeCompare(b.label));
    groups.theory.sort((a, b) => a.label.localeCompare(b.label));

    const seeded = new Map();
    ["case", "principle", "theory"].forEach((type) => {
      const typeNodes = groups[type];
      typeNodes.forEach((node, index) => {
        const existing = this.positions.get(node.id);
        if (existing && Number.isFinite(existing.x) && Number.isFinite(existing.y)) {
          seeded.set(node.id, {
            id: node.id,
            type: node.type,
            x: existing.x,
            y: existing.y,
            vx: existing.vx || 0,
            vy: existing.vy || 0,
            fx: 0,
            fy: 0,
          });
          return;
        }

        const baseX = desiredXForType(node.type, width);
        const baseY = distributedY(index, typeNodes.length, top, height, bottom);
        const jitterX = (hashToUnit(node.id + "x") - 0.5) * 30;
        const jitterY = (hashToUnit(node.id + "y") - 0.5) * 36;

        seeded.set(node.id, {
          id: node.id,
          type: node.type,
          x: baseX + jitterX,
          y: baseY + jitterY,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
        });
      });
    });

    return seeded;
  }

  runForceLayout(nodes, edges, focusCaseId) {
    const width = this.options.width;
    const height = this.options.height;
    const margin = 18;
    const iterations = Math.max(60, Number(this.options.iterations) || 160);

    const layout = this.seedNodePositions(nodes, focusCaseId);
    const nodeList = nodes
      .map((node) => {
        const positioned = layout.get(node.id);
        return positioned ? positioned : null;
      })
      .filter(Boolean);

    for (let step = 0; step < iterations; step += 1) {
      const alpha = 1 - step / iterations;

      nodeList.forEach((node) => {
        node.fx = 0;
        node.fy = 0;
      });

      for (let i = 0; i < nodeList.length; i += 1) {
        const a = nodeList[i];
        for (let j = i + 1; j < nodeList.length; j += 1) {
          const b = nodeList[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = Math.max(36, dx * dx + dy * dy);
          const dist = Math.sqrt(distSq);
          const force = (4300 * alpha) / distSq;
          const ux = dx / dist;
          const uy = dy / dist;

          a.fx -= ux * force;
          a.fy -= uy * force;
          b.fx += ux * force;
          b.fy += uy * force;
        }
      }

      edges.forEach((edge) => {
        const from = layout.get(String(edge.from));
        const to = layout.get(String(edge.to));
        if (!from || !to) return;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy) || 1;
        const desiredLength = 110 + edgeMagnitude(edge.weight) * 6;
        const springStrength = 0.018 + edgeMagnitude(edge.weight) * 0.004;
        const pull = (dist - desiredLength) * springStrength * alpha;
        const ux = dx / dist;
        const uy = dy / dist;

        from.fx += ux * pull;
        from.fy += uy * pull;
        to.fx -= ux * pull;
        to.fy -= uy * pull;
      });

      nodeList.forEach((node) => {
        const targetX = desiredXForType(node.type, width);
        const columnStrength = node.id === focusCaseId ? 0.1 : 0.06;
        const centerStrengthY = 0.003;

        node.fx += (targetX - node.x) * columnStrength;
        node.fy += (height * 0.5 - node.y) * centerStrengthY;
      });

      nodeList.forEach((node) => {
        const damping = 0.84;
        node.vx = (node.vx + node.fx) * damping;
        node.vy = (node.vy + node.fy) * damping;
        node.x += node.vx;
        node.y += node.vy;

        const r = nodeRadius(node.type);
        node.x = clamp(node.x, margin + r, width - margin - r);
        node.y = clamp(node.y, margin + r, height - margin - r);
      });
    }

    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < nodeList.length; i += 1) {
        const a = nodeList[i];
        for (let j = i + 1; j < nodeList.length; j += 1) {
          const b = nodeList[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = nodeRadius(a.type) + nodeRadius(b.type) + 12;
          if (dist >= minDist) continue;
          const overlap = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;

          a.x -= ux * overlap;
          a.y -= uy * overlap;
          b.x += ux * overlap;
          b.y += uy * overlap;
        }
      }
    }

    nodeList.forEach((node) => {
      this.positions.set(node.id, {
        x: node.x,
        y: node.y,
        vx: node.vx,
        vy: node.vy,
      });
    });

    return Object.fromEntries(
      nodeList.map((node) => [
        node.id,
        {
          x: node.x,
          y: node.y,
        },
      ])
    );
  }

  buildEdgeCurvatureMap(edges) {
    const grouped = new Map();
    edges.forEach((edge, index) => {
      const key = pairKey(edge.from, edge.to);
      const list = grouped.get(key) || [];
      list.push({ edge: edge, index: index });
      grouped.set(key, list);
    });

    const curveMap = new Map();
    grouped.forEach((entries) => {
      const count = entries.length;
      entries.forEach((entry, offsetIndex) => {
        const centeredIndex = offsetIndex - (count - 1) / 2;
        curveMap.set(edgeId(entry.edge, entry.index), centeredIndex);
      });
    });

    return curveMap;
  }

  ensureDefs(svg) {
    const defs = document.createElementNS(SVG_NS, "defs");

    const supportMarker = document.createElementNS(SVG_NS, "marker");
    supportMarker.setAttribute("id", "edge-arrow-support");
    supportMarker.setAttribute("viewBox", "0 0 10 10");
    supportMarker.setAttribute("markerWidth", "7");
    supportMarker.setAttribute("markerHeight", "7");
    supportMarker.setAttribute("refX", "9");
    supportMarker.setAttribute("refY", "5");
    supportMarker.setAttribute("orient", "auto-start-reverse");
    const supportArrow = document.createElementNS(SVG_NS, "path");
    supportArrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    supportArrow.setAttribute("fill", SUPPORT_COLOR);
    supportMarker.appendChild(supportArrow);

    const conflictMarker = document.createElementNS(SVG_NS, "marker");
    conflictMarker.setAttribute("id", "edge-arrow-conflict");
    conflictMarker.setAttribute("viewBox", "0 0 10 10");
    conflictMarker.setAttribute("markerWidth", "7");
    conflictMarker.setAttribute("markerHeight", "7");
    conflictMarker.setAttribute("refX", "9");
    conflictMarker.setAttribute("refY", "5");
    conflictMarker.setAttribute("orient", "auto-start-reverse");
    const conflictArrow = document.createElementNS(SVG_NS, "path");
    conflictArrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    conflictArrow.setAttribute("fill", CONFLICT_COLOR);
    conflictMarker.appendChild(conflictArrow);

    defs.appendChild(supportMarker);
    defs.appendChild(conflictMarker);
    svg.appendChild(defs);
  }

  render(config) {
    const svg = this.ensureSvg();
    const nodes = Array.isArray(config && config.nodes) ? config.nodes : [];
    const edges = Array.isArray(config && config.edges) ? config.edges : [];
    const nodeStates = (config && config.nodeStates) || {};
    const changedEdgeIds = (config && config.changedEdgeIds) || new Set();
    const focusCaseId = config && config.focusCaseId ? String(config.focusCaseId) : "";
    this.onNodeToggle = config && typeof config.onNodeToggle === "function" ? config.onNodeToggle : null;
    this.onEdgeHover = config && typeof config.onEdgeHover === "function" ? config.onEdgeHover : null;

    const normalizedNodes = nodes.map((node) => {
      const type = normalizeNodeType(node, focusCaseId);
      return {
        id: String(node.id),
        label: String(node.label || node.id),
        type: type,
      };
    });

    const nodeLookup = {};
    normalizedNodes.forEach((node) => {
      nodeLookup[node.id] = node;
    });

    const positions = this.runForceLayout(normalizedNodes, edges, focusCaseId);
    const curvatureMap = this.buildEdgeCurvatureMap(edges);

    svg.textContent = "";
    this.ensureDefs(svg);

    edges.forEach(
      function (edge, index) {
        const fromId = String(edge.from);
        const toId = String(edge.to);
        const p1 = positions[fromId];
        const p2 = positions[toId];
        if (!p1 || !p2) return;

        const relation = relationForEdge(edge);
        const thisEdgeId = edgeId(edge, index);
        const stroke = relation === "conflict" ? CONFLICT_COLOR : SUPPORT_COLOR;
        const strokeWidth = 1.4 + edgeMagnitude(edge.weight) * 1.55;
        const curveOffsetIndex = Number(curvatureMap.get(thisEdgeId) || 0);

        const startTrim = nodeRadius(nodeLookup[fromId] && nodeLookup[fromId].type) + 2;
        const endTrim = nodeRadius(nodeLookup[toId] && nodeLookup[toId].type) + 6;

        const start = trimEndpoint(p1, p2, startTrim);
        const end = trimEndpoint(p2, p1, endTrim);

        const mid = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
        };
        const normal = vectorNormal(end.x - start.x, end.y - start.y);
        const relationOffset = relation === "conflict" ? 10 : -10;
        const multiEdgeOffset = curveOffsetIndex * 17;
        const control = {
          x: mid.x + normal.x * (relationOffset + multiEdgeOffset),
          y: mid.y + normal.y * (relationOffset + multiEdgeOffset),
        };

        const pathD =
          "M " +
          start.x.toFixed(2) +
          " " +
          start.y.toFixed(2) +
          " Q " +
          control.x.toFixed(2) +
          " " +
          control.y.toFixed(2) +
          " " +
          end.x.toFixed(2) +
          " " +
          end.y.toFixed(2);

        const visiblePath = document.createElementNS(SVG_NS, "path");
        visiblePath.setAttribute("class", "graph-edge-path" + (changedEdgeIds.has(thisEdgeId) ? " is-changed" : "") + (relation === "conflict" ? " is-conflict" : " is-support"));
        visiblePath.setAttribute("d", pathD);
        visiblePath.setAttribute("stroke", stroke);
        visiblePath.setAttribute("stroke-width", strokeWidth.toFixed(2));
        visiblePath.setAttribute("fill", "none");
        visiblePath.setAttribute("opacity", "0.9");
        visiblePath.setAttribute("marker-end", relation === "conflict" ? "url(#edge-arrow-conflict)" : "url(#edge-arrow-support)");
        visiblePath.setAttribute("pointer-events", "none");

        const hitPath = document.createElementNS(SVG_NS, "path");
        hitPath.setAttribute("class", "graph-edge-hit");
        hitPath.setAttribute("d", pathD);
        hitPath.setAttribute("stroke", "transparent");
        hitPath.setAttribute("stroke-width", Math.max(12, strokeWidth + 9).toFixed(2));
        hitPath.setAttribute("fill", "none");
        hitPath.setAttribute("tabindex", "0");
        hitPath.setAttribute("role", "button");
        hitPath.setAttribute(
          "aria-label",
          "Edge from " +
            (nodeLookup[fromId] ? nodeLookup[fromId].label : fromId) +
            " to " +
            (nodeLookup[toId] ? nodeLookup[toId].label : toId) +
            ", " +
            relation +
            "."
        );

        const title = document.createElementNS(SVG_NS, "title");
        title.textContent = (edge.basis ? edge.basis + " " : "") + (edge.source ? edge.source : "");
        hitPath.appendChild(title);

        const hoverPayload = Object.assign({}, edge, {
          id: thisEdgeId,
          relation: relation,
          principleName: principleNameForEdge(edge, nodeLookup),
        });

        const onHover = () => {
          if (this.onEdgeHover) this.onEdgeHover(hoverPayload);
        };
        const onBlur = () => {
          if (this.onEdgeHover) this.onEdgeHover(null);
        };

        hitPath.addEventListener("mouseenter", onHover);
        hitPath.addEventListener("mouseleave", onBlur);
        hitPath.addEventListener("focus", onHover);
        hitPath.addEventListener("blur", onBlur);

        svg.appendChild(visiblePath);
        svg.appendChild(hitPath);
      }.bind(this)
    );

    normalizedNodes.forEach(
      function (node) {
        const pos = positions[node.id];
        if (!pos) return;

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "graph-node");
        group.setAttribute("tabindex", "0");
        group.setAttribute("role", "button");
        group.setAttribute(
          "aria-label",
          node.type +
            " node " +
            node.label +
            ", currently " +
            stateLabel(normalizeState(nodeStates[node.id])) +
            ". Press Enter to toggle."
        );
        group.setAttribute("data-node-id", node.id);

        const state = normalizeState(nodeStates[node.id]);
        const fill = nodeFillForState(state);
        const stroke = "#324255";

        let shape;
        if (node.type === "theory") {
          shape = document.createElementNS(SVG_NS, "rect");
          shape.setAttribute("x", (pos.x - 62).toFixed(2));
          shape.setAttribute("y", (pos.y - 18).toFixed(2));
          shape.setAttribute("width", "124");
          shape.setAttribute("height", "36");
          shape.setAttribute("rx", "8");
          shape.setAttribute("ry", "8");
        } else {
          shape = document.createElementNS(SVG_NS, "circle");
          shape.setAttribute("cx", pos.x.toFixed(2));
          shape.setAttribute("cy", pos.y.toFixed(2));
          shape.setAttribute("r", node.type === "case" ? "22" : "16");
        }

        shape.setAttribute("class", "graph-node-shape");
        shape.setAttribute("fill", fill);
        shape.setAttribute("stroke", stroke);
        shape.setAttribute("stroke-width", "1.5");

        const label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("class", "graph-node-label");
        label.setAttribute("x", pos.x.toFixed(2));
        label.setAttribute("y", (pos.y + 3.5).toFixed(2));
        label.setAttribute("text-anchor", "middle");
        label.textContent = truncateLabel(node.label, node.type === "theory" ? 16 : 12);

        const title = document.createElementNS(SVG_NS, "title");
        title.textContent = node.label + " (" + node.type + ", " + stateLabel(state) + ")";
        group.appendChild(title);
        group.appendChild(shape);
        group.appendChild(label);

        const toggle = () => {
          if (this.onNodeToggle) this.onNodeToggle(node.id);
        };
        group.addEventListener("click", toggle);
        group.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggle();
        });

        svg.appendChild(group);
      }.bind(this)
    );
  }
}
