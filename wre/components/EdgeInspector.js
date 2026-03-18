function trimWords(text, maxWords) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "...";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relationLabel(edge) {
  const relation = String(edge && edge.relation ? edge.relation : "");
  if (relation.toLowerCase() === "conflict") return "conflict";
  return "support";
}

function principleName(edge, nodeLookup) {
  const from = nodeLookup && nodeLookup[String(edge.from)];
  const to = nodeLookup && nodeLookup[String(edge.to)];
  if (from && from.type === "principle") return from.label;
  if (to && to.type === "principle") return to.label;
  return (to && to.label) || (from && from.label) || String(edge.to || edge.from || "Unknown");
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function signed(value) {
  const n = numeric(value);
  if (n > 0) return "+" + n.toFixed(2);
  if (n < 0) return n.toFixed(2);
  return "0.00";
}

function deltaClassName(delta) {
  if (delta > 0) return "delta-positive";
  if (delta < 0) return "delta-negative";
  return "delta-neutral";
}

export class EdgeInspector {
  constructor(container, options) {
    this.container = container;
    this.onEdgeFocus = options && typeof options.onEdgeFocus === "function" ? options.onEdgeFocus : null;
  }

  render(payload) {
    const hoveredEdge = payload && payload.hoveredEdge ? payload.hoveredEdge : null;
    const topEdges = Array.isArray(payload && payload.topEdges) ? payload.topEdges : [];
    const nodeLookup = (payload && payload.nodeLookup) || {};
    const delta = Number(payload && payload.deltaScore);
    const focusedEdgeId = String((payload && payload.focusedEdgeId) || (hoveredEdge && hoveredEdge.id) || "");

    const why =
      Number.isFinite(delta) && delta !== 0
        ? "Coherence changed by " + delta.toFixed(1) + " points based on updated node commitments."
        : "Coherence is unchanged until commitments shift.";

    const hoverHtml = hoveredEdge
      ? '<h3>Hovered edge</h3><p><strong>' +
        escapeHtml(principleName(hoveredEdge, nodeLookup)) +
        "</strong> (" +
        escapeHtml(relationLabel(hoveredEdge)) +
        ')</p><p class="edge-basis">' +
        escapeHtml(trimWords(hoveredEdge.basis || "", 25) || "No basis provided.") +
        "</p>" +
        (hoveredEdge.source
          ? '<p><a class="edge-link" target="_blank" rel="noopener noreferrer" href="' +
            escapeHtml(hoveredEdge.source) +
            '">Source</a></p>'
          : "")
      : '<h3>Hovered edge</h3><p class="empty-note">Hover an edge in the graph to inspect its basis and source.</p>';

    const ranked = topEdges
      .map(function (edge) {
        return Object.assign({}, edge, {
          delta: numeric(edge.delta),
          beforeContribution: numeric(edge.beforeContribution),
          afterContribution: numeric(edge.afterContribution),
        });
      })
      .sort(function (a, b) {
        return Math.abs(b.delta) - Math.abs(a.delta);
      });

    const maxAbsDelta = ranked.reduce(function (acc, edge) {
      return Math.max(acc, Math.abs(edge.delta));
    }, 0);

    const listHtml =
      topEdges.length === 0
        ? '<p class="empty-note">No contribution deltas yet. Answer the prompt to compute edge-level explanations.</p>'
        : '<ol class="edge-rank-list">' +
          ranked
            .map(function (edge, index) {
              const relation = relationLabel(edge);
              const basis = trimWords(edge.basis || "", 25) || "No basis provided.";
              const src = edge.source
                ? '<a class="edge-link" target="_blank" rel="noopener noreferrer" href="' +
                  escapeHtml(edge.source) +
                  '">link</a>'
                : "no link";
              const delta = numeric(edge.delta);
              const barWidth = Math.max(8, Math.round((Math.abs(delta) / (maxAbsDelta || 1)) * 100));
              const deltaClass = deltaClassName(delta);
              const edgeItemId = String(edge.id || "");
              const activeClass = edgeItemId && edgeItemId === focusedEdgeId ? " is-active" : "";
              return (
                '<li class="edge-rank-item' +
                activeClass +
                '" data-edge-id="' +
                escapeHtml(edgeItemId) +
                '">' +
                '<div class="edge-rank-head">' +
                '<span class="edge-rank-badge">#' +
                String(index + 1) +
                "</span>" +
                '<strong class="edge-rank-principle">' +
                escapeHtml(principleName(edge, nodeLookup)) +
                "</strong> (" +
                '<span class="edge-rank-relation">' +
                escapeHtml(relation) +
                "</span>" +
                ")" +
                '<span class="edge-rank-delta ' +
                deltaClass +
                '">' +
                escapeHtml(signed(delta)) +
                "</span>" +
                "</div>" +
                '<div class="edge-delta-track" aria-hidden="true">' +
                '<span class="edge-delta-fill ' +
                deltaClass +
                '" style="width:' +
                String(barWidth) +
                '%"></span>' +
                "</div>" +
                '<p class="edge-contrib-meta">before: ' +
                escapeHtml(signed(edge.beforeContribution)) +
                " | after: " +
                escapeHtml(signed(edge.afterContribution)) +
                "</p>" +
                '<p class="edge-basis">' +
                escapeHtml(basis) +
                "</p>" +
                '<p class="edge-source">source: ' +
                src +
                "</p>" +
                "</li>"
              );
            })
            .join("") +
          "</ol>";

    this.container.innerHTML =
      '<div class="inspector-wrap">' +
      '<p class="lesson-hint">' +
      escapeHtml(why) +
      "</p>" +
      '<section class="inspect-hover">' +
      hoverHtml +
      "</section>" +
      '<section class="inspect-list">' +
      "<h3>Top contributing edges (ranked by |Δ|)</h3>" +
      listHtml +
      "</section>" +
      "</div>";

    this.bindEdgeFocusEvents();
  }

  bindEdgeFocusEvents() {
    if (!this.container || !this.onEdgeFocus) return;
    const items = this.container.querySelectorAll("[data-edge-id]");
    items.forEach((item) => {
      const edgeId = String(item.getAttribute("data-edge-id") || "");
      if (!edgeId) return;
      const focus = () => this.onEdgeFocus(edgeId);
      const blur = () => this.onEdgeFocus(null);
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "Highlight edge " + edgeId);
      item.addEventListener("mouseenter", focus);
      item.addEventListener("mouseleave", blur);
      item.addEventListener("focus", focus);
      item.addEventListener("blur", blur);
    });
  }
}
