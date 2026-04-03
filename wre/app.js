import { MiniGraph, computeCoherence, computeContributions, deriveSubgraph } from "/wre/components/MiniGraph.js";
import { CoherenceGauge } from "/wre/components/CoherenceGauge.js";
import { EdgeInspector } from "/wre/components/EdgeInspector.js";
import { LessonCard } from "/wre/components/LessonCard.js";

const MAX_NODES_COLLAPSED = 12;
const MAX_NODES_EXPANDED = 20;
const CONFIDENCE_STORAGE_PREFIX = "wre:confidence:";
const LEGACY_CHOICE_STORAGE_KEYS = ["choice", "wre:choice", "wre:answer", "wre:selectedAnswer"];

const state = {
  lessonPaths: [],
  lessonCache: new Map(),
  currentLessonPath: "",
  lesson: null,
  graphData: null,
  graphDataPromise: null,
  subgraphCache: new Map(),
  subgraph: {
    nodes: [],
    edges: [],
    nodeLookup: {},
  },
  subgraphEdgeSignature: "",
  coherenceMemo: new Map(),
  nodeStates: {},
  selectedAnswer: "",
  confidence: 50,
  revisionUsed: false,
  interactionStage: 0,
  expanded: false,
  hoveredEdge: null,
  inspectorFocusedEdgeId: "",
  focusedEdgeIds: new Set(),
  recommendedRevisionId: "",
  coherence: {
    score: 0,
    satisfiedEdgeWeights: 0,
    totalAbsoluteWeights: 0,
    perEdge: [],
    topContributors: [],
  },
  contribution: {
    perEdge: [],
    topContributors: [],
  },
  deltaScore: 0,
  changedEdgeIds: new Set(),
  changedEdgeTimer: 0,
};

const el = {
  lessonPicker: document.getElementById("lessonPicker"),
  progressLabel: document.getElementById("progressLabel"),
  progressTitle: document.getElementById("progressTitle"),
  progressFill: document.getElementById("progressFill"),
  progressTrack: document.querySelector(".progress-track"),
  expandGraphBtn: document.getElementById("expandGraphBtn"),
  lessonCardHost: document.getElementById("lessonCardHost"),
  graphHost: document.getElementById("graphHost"),
  gaugeHost: document.getElementById("gaugeHost"),
  inspectorHost: document.getElementById("inspectorHost"),
};

const miniGraph = new MiniGraph(el.graphHost);
const gauge = new CoherenceGauge(el.gaugeHost);
const inspector = new EdgeInspector(el.inspectorHost, {
  onEdgeFocus: handleInspectorEdgeFocus,
});
const lessonCard = new LessonCard(el.lessonCardHost, {
  onAnswer: handleAnswer,
  onConfidence: handleConfidenceChange,
  onAutoRevision: handleAutoRevision,
  onContinue: handleContinueStep,
});

const renderDebounced = debounce(renderNow, 22);
const renderInspectorDebounced = debounce(renderInspector, 14);

init().catch(function (error) {
  renderFatalError(error);
});

async function init() {
  bindEvents();
  state.lessonPaths = await fetchJson("/data/lessons/index.json");
  if (!Array.isArray(state.lessonPaths) || state.lessonPaths.length === 0) {
    throw new Error("No lessons found at /data/lessons/index.json");
  }
  renderLessonPicker();
  await loadLesson(state.lessonPaths[0]);
}

function bindEvents() {
  if (el.lessonPicker) {
    el.lessonPicker.addEventListener("change", function (event) {
      const nextPath = String(event.target.value || "");
      if (!nextPath) return;
      loadLesson(nextPath).catch(renderFatalError);
    });
  }

  if (el.expandGraphBtn) {
    el.expandGraphBtn.addEventListener("click", function () {
      state.expanded = !state.expanded;
      rebuildSubgraph();
      recomputeAndRender(state.nodeStates, false);
    });
  }
}

async function loadLesson(path) {
  const normalizedPath = String(path || "");
  if (!normalizedPath) return;

  let raw = state.lessonCache.get(normalizedPath);
  if (!raw) {
    raw = await fetchJson(normalizedPath);
    state.lessonCache.set(normalizedPath, raw);
  }

  const lesson = normalizeLesson(raw, normalizedPath);
  state.currentLessonPath = normalizedPath;
  state.lesson = lesson;
  clearLegacyUnsureChoiceStorage(lesson.id);
  state.selectedAnswer = "";
  state.confidence = loadStoredConfidence(lesson.id);
  state.revisionUsed = false;
  state.interactionStage = 0;
  state.expanded = false;
  state.hoveredEdge = null;
  state.inspectorFocusedEdgeId = "";
  state.focusedEdgeIds = new Set();
  state.nodeStates = {};
  state.changedEdgeIds = new Set();
  state.deltaScore = 0;
  state.subgraphCache = new Map();
  state.coherenceMemo.clear();
  if (state.changedEdgeTimer) {
    clearTimeout(state.changedEdgeTimer);
    state.changedEdgeTimer = 0;
  }

  await ensureGraphData();
  rebuildSubgraph();
  state.coherence = computeCoherenceMemoized(state.nodeStates);
  state.contribution = { perEdge: [], topContributors: [] };
  if (el.lessonPicker) {
    el.lessonPicker.value = normalizedPath;
  }
  renderNow();
}

function rebuildSubgraph() {
  if (!state.lesson || !state.graphData) return;

  const depth = state.expanded ? 2 : 1;
  const cap = state.expanded ? MAX_NODES_EXPANDED : MAX_NODES_COLLAPSED;
  const caseId = state.lesson.caseId;
  const cacheKey = String(depth) + ":" + String(cap);

  let derived = state.subgraphCache.get(cacheKey);
  if (!derived) {
    derived = deriveSubgraph(caseId, state.graphData.edges, depth, cap);
    state.subgraphCache.set(cacheKey, derived);
  }

  const pinned = [caseId].concat(state.lesson.principleIds, state.lesson.theoryIds).filter(Boolean);
  const mergedNodeIds = mergeCappedNodeIds(derived.nodeIds, pinned, cap);
  const nodeSet = new Set(mergedNodeIds);
  const filteredEdges = derived.edges.filter(function (edge) {
    return nodeSet.has(String(edge.from)) && nodeSet.has(String(edge.to));
  });

  const nodeLookup = {};
  const nodes = mergedNodeIds.map(function (nodeId) {
    const resolved = resolveNode(nodeId, caseId);
    nodeLookup[resolved.id] = resolved;
    if (!Object.prototype.hasOwnProperty.call(state.nodeStates, resolved.id)) {
      state.nodeStates[resolved.id] = 0;
    }
    return resolved;
  });

  state.subgraph = {
    nodes: nodes,
    edges: filteredEdges,
    nodeLookup: nodeLookup,
  };
  state.subgraphEdgeSignature = buildEdgeSignature(filteredEdges);
  state.coherenceMemo.clear();
  state.recommendedRevisionId = findRecommendedRevisionId();
}

function resolveNode(nodeId, caseId) {
  const graph = state.graphData || {};
  const casesById = graph.casesById || {};
  const principlesById = graph.principlesById || {};
  const theoriesById = graph.theoriesById || {};
  const id = String(nodeId);

  if (id === String(caseId) || casesById[id]) {
    return {
      id: id,
      label: (casesById[id] && casesById[id].title) || beautifyId(id),
      type: "case",
    };
  }
  if (principlesById[id]) {
    return {
      id: id,
      label: principlesById[id].name || beautifyId(id),
      type: "principle",
    };
  }
  if (theoriesById[id]) {
    return {
      id: id,
      label: theoriesById[id].name || beautifyId(id),
      type: "theory",
    };
  }
  if (state.lesson && state.lesson.theoryIds.indexOf(id) >= 0) {
    return { id: id, label: beautifyId(id), type: "theory" };
  }
  return { id: id, label: beautifyId(id), type: "principle" };
}

async function ensureGraphData() {
  if (state.graphData) return state.graphData;
  if (!state.graphDataPromise) {
    state.graphDataPromise = Promise.all([
      fetchJson("/data/graph-edges.json"),
      fetchJson("/data/cases.json"),
      fetchJson("/data/principles.json"),
      fetchJson("/data/theories.json"),
    ]).then(function (results) {
      const edges = Array.isArray(results[0]) ? results[0] : [];
      const cases = Array.isArray(results[1]) ? results[1] : [];
      const principles = Array.isArray(results[2]) ? results[2] : [];
      const theories = Array.isArray(results[3]) ? results[3] : [];
      return {
        edges: edges,
        casesById: indexById(cases),
        principlesById: indexById(principles),
        theoriesById: indexById(theories),
      };
    });
  }
  state.graphData = await state.graphDataPromise;
  return state.graphData;
}

function handleAnswer(answer, confidence) {
  if (!state.lesson) return;
  const normalized = normalizeSubmittedAnswer(answer, confidence, state.lesson.options);
  if (!normalized.answer) return;
  const previousStates = cloneStates(state.nodeStates);
  state.selectedAnswer = normalized.answer;
  state.confidence = normalized.confidence;
  saveStoredConfidence(state.lesson.id, state.confidence);
  state.revisionUsed = false;

  const caseState = inferCaseState(state.selectedAnswer);
  state.nodeStates[state.lesson.caseId] = caseState;

  state.subgraph.nodes.forEach(function (node) {
    if (node.id === state.lesson.caseId) return;
    if (state.nodeStates[node.id] === 0) {
      state.nodeStates[node.id] = 1;
    }
  });

  recomputeAndRender(previousStates, true);
}

function handleConfidenceChange(nextConfidence) {
  if (hasSelectedAnswer()) {
    const normalized = normalizeSubmittedAnswer(state.selectedAnswer, nextConfidence, state.lesson.options);
    state.selectedAnswer = normalized.answer;
    state.confidence = normalized.confidence;
  } else {
    state.confidence = clamp(Number(nextConfidence), 0, 100);
  }
  if (state.lesson) {
    saveStoredConfidence(state.lesson.id, state.confidence);
  }
  if (hasSelectedAnswer()) {
    const previousStates = cloneStates(state.nodeStates);
    state.nodeStates[state.lesson.caseId] = inferCaseState(state.selectedAnswer);
    recomputeAndRender(previousStates, true);
  } else {
    renderLessonFlowOnly();
  }
}

function handleAutoRevision() {
  if (!state.lesson || !hasSelectedAnswer() || state.interactionStage < 1 || state.revisionUsed) return;
  const targetId = state.recommendedRevisionId || firstPrincipleId();
  if (!targetId) return;
  const previousStates = cloneStates(state.nodeStates);
  state.nodeStates[targetId] = cycleState(state.nodeStates[targetId]);
  state.revisionUsed = true;
  recomputeAndRender(previousStates, true);
}

function handleContinueStep() {
  if (state.interactionStage === 0) {
    if (!hasSelectedAnswer()) return;
    state.interactionStage = 1;
    renderLessonFlowOnly();
    return;
  }
  if (state.interactionStage === 1) {
    state.interactionStage = 2;
    renderLessonFlowOnly();
  }
}

function handleGraphNodeToggle(nodeId) {
  const id = String(nodeId || "");
  if (!id || !state.subgraph.nodeLookup[id]) return;
  const node = state.subgraph.nodeLookup[id];

  if (node.type === "principle" && state.interactionStage === 0) {
    return;
  }
  if (hasSelectedAnswer() && node.type === "principle" && state.revisionUsed) {
    return;
  }

  const previousStates = cloneStates(state.nodeStates);
  state.nodeStates[id] = cycleState(state.nodeStates[id]);

  if (hasSelectedAnswer() && node.type === "principle" && !state.revisionUsed) {
    state.revisionUsed = true;
  }

  recomputeAndRender(previousStates, true);
}

function handleEdgeHover(edge) {
  state.hoveredEdge = edge || null;
  if (state.inspectorFocusedEdgeId) {
    state.focusedEdgeIds = new Set([state.inspectorFocusedEdgeId]);
  } else if (state.hoveredEdge && state.hoveredEdge.id) {
    state.focusedEdgeIds = new Set([state.hoveredEdge.id]);
  } else {
    state.focusedEdgeIds = new Set();
  }
  miniGraph.setFocusedEdges(state.focusedEdgeIds);
  renderInspectorDebounced();
}

function handleInspectorEdgeFocus(edgeId) {
  const id = String(edgeId || "");
  state.inspectorFocusedEdgeId = id;
  if (id) {
    state.focusedEdgeIds = new Set([id]);
    const matched = findEdgePayloadById(id);
    if (matched) {
      state.hoveredEdge = matched;
    }
  } else {
    state.hoveredEdge = null;
    state.focusedEdgeIds = new Set();
  }
  miniGraph.setFocusedEdges(state.focusedEdgeIds);
  renderInspectorDebounced();
}

function recomputeAndRender(previousStates, highlightChanges) {
  const before = previousStates || cloneStates(state.nodeStates);
  const beforeCoherence = computeCoherenceMemoized(before);
  const afterCoherence = computeCoherenceMemoized(state.nodeStates);
  const delta = computeContributions(before, state.nodeStates, state.subgraph.edges);

  state.coherence = afterCoherence;
  state.contribution = delta;
  state.deltaScore = afterCoherence.score - beforeCoherence.score;
  state.changedEdgeIds = highlightChanges
    ? new Set(
        delta.perEdge
          .filter(function (edge) {
            return edge.delta !== 0;
          })
          .map(function (edge) {
            return edge.id;
          })
      )
    : new Set();

  state.recommendedRevisionId = findRecommendedRevisionId();
  renderDebounced();

  if (highlightChanges && state.changedEdgeIds.size > 0) {
    if (state.changedEdgeTimer) {
      clearTimeout(state.changedEdgeTimer);
    }
    state.changedEdgeTimer = window.setTimeout(function () {
      state.changedEdgeIds = new Set();
      renderDebounced();
    }, 650);
  }
}

function renderNow() {
  if (!state.lesson) return;
  updateProgress();
  renderLessonCard();
  renderGraph();
  renderGauge();
  renderInspector();
  if (el.expandGraphBtn) {
    el.expandGraphBtn.textContent = state.expanded ? "Collapse graph" : "Expand graph";
    el.expandGraphBtn.setAttribute("aria-label", state.expanded ? "Collapse to one hop graph" : "Expand graph to deeper neighborhood");
  }
}

function renderLessonFlowOnly() {
  if (!state.lesson) return;
  updateProgress();
  renderLessonCard();
  renderInspector();
}

function renderLessonCard() {
  lessonCard.render({
    lessonTitle: state.lesson.title,
    caseTitle: state.lesson.caseTitle,
    caseText: state.lesson.caseText,
    prompt: state.lesson.prompt,
    options: state.lesson.options,
    selectedAnswer: state.selectedAnswer,
    confidence: state.confidence,
    interactionStage: state.interactionStage,
    answerSummary: answerSummaryText(),
    revisionUsed: state.revisionUsed,
    revisionTargetLabel: revisionTargetLabel(),
    sourceContext: buildLessonSourceContext(),
    sepDiagnostic: buildSepDiagnosticReport(),
  });
}

function renderGraph() {
  miniGraph.render({
    nodes: state.subgraph.nodes,
    edges: state.subgraph.edges,
    nodeStates: state.nodeStates,
    changedEdgeIds: state.changedEdgeIds,
    focusedEdgeIds: state.focusedEdgeIds,
    focusCaseId: state.lesson.caseId,
    onNodeToggle: handleGraphNodeToggle,
    onEdgeHover: handleEdgeHover,
  });
}

function renderGauge() {
  const coherenceDetail =
    "sum satisfied w = " +
    state.coherence.satisfiedEdgeWeights.toFixed(2) +
    " | sum |w| = " +
    state.coherence.totalAbsoluteWeights.toFixed(2);
  gauge.setValue(state.coherence.score, coherenceDetail);
}

function renderInspector() {
  inspector.render({
    hoveredEdge: state.hoveredEdge,
    topEdges: state.contribution.topContributors,
    nodeLookup: state.subgraph.nodeLookup,
    deltaScore: state.deltaScore,
    focusedEdgeId: state.inspectorFocusedEdgeId || firstSetValue(state.focusedEdgeIds),
  });
}

function updateProgress() {
  if (!state.lesson) return;
  const total = Math.max(1, state.lesson.totalSteps);
  let current = Math.max(1, state.lesson.caseStep);
  if (state.interactionStage === 0 && hasSelectedAnswer()) {
    current = Math.max(1, state.lesson.questionStep);
  } else if (state.interactionStage === 1) {
    current = Math.max(1, state.lesson.coherenceStep);
  } else if (state.interactionStage >= 2) {
    current = Math.max(1, state.lesson.revisionStep);
  }
  const percent = clamp((current / total) * 100, 0, 100);
  if (el.progressLabel) {
    el.progressLabel.textContent = "Step " + String(current) + " / " + String(total);
  }
  if (el.progressTitle) {
    el.progressTitle.textContent = state.lesson.title;
  }
  if (el.progressFill) {
    el.progressFill.style.width = percent.toFixed(2) + "%";
  }
  if (el.progressTrack) {
    el.progressTrack.setAttribute("aria-valuenow", percent.toFixed(1));
  }
}

function renderLessonPicker() {
  if (!el.lessonPicker) return;
  el.lessonPicker.innerHTML = "";
  state.lessonPaths.forEach(function (path) {
    const option = document.createElement("option");
    option.value = path;
    option.textContent = prettifyLessonPath(path);
    el.lessonPicker.appendChild(option);
  });
}

function computeCoherenceMemoized(states) {
  const key = state.subgraphEdgeSignature + "::" + serializeNodeStates(states, state.subgraph.nodes);
  if (state.coherenceMemo.has(key)) {
    return state.coherenceMemo.get(key);
  }
  const computed = computeCoherence(states, state.subgraph.edges);
  state.coherenceMemo.set(key, computed);
  return computed;
}

function serializeNodeStates(nodeStates, nodes) {
  return nodes
    .map(function (node) {
      return node.id + ":" + String(normalizeState(nodeStates[node.id]));
    })
    .join("|");
}

function buildEdgeSignature(edges) {
  return edges
    .map(function (edge, index) {
      return String(edge.id || edge.from + "->" + edge.to + "#" + index);
    })
    .join("|");
}

function findRecommendedRevisionId() {
  if (!state.lesson) return "";
  const caseId = state.lesson.caseId;
  const candidates = state.subgraph.edges
    .map(function (edge) {
      const from = String(edge.from);
      const to = String(edge.to);
      if (from !== caseId && to !== caseId) return null;
      const other = from === caseId ? to : from;
      const node = state.subgraph.nodeLookup[other];
      if (!node || node.type !== "principle") return null;
      return {
        id: other,
        weight: Math.abs(Number(edge.weight) || 1),
      };
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return b.weight - a.weight;
    });
  if (candidates.length > 0) {
    return candidates[0].id;
  }
  return firstPrincipleId();
}

function firstPrincipleId() {
  const first = state.subgraph.nodes.find(function (node) {
    return node.type === "principle";
  });
  return first ? first.id : "";
}

function revisionTargetLabel() {
  const target = state.subgraph.nodeLookup[state.recommendedRevisionId];
  return target ? target.label : "connected principle";
}

function answerSummaryText() {
  if (!hasSelectedAnswer()) return "";
  return String(state.selectedAnswer) + " (" + String(Math.round(state.confidence)) + "% confidence)";
}

function buildLessonSourceContext() {
  if (!state.lesson || !state.graphData) return null;
  const caseEntry = state.graphData.casesById && state.graphData.casesById[state.lesson.caseId];
  const caseCitation = caseEntry && caseEntry.sep_citation
    ? {
        title: String(caseEntry.sep_citation.title || "reference source"),
        url: String(caseEntry.sep_citation.url || ""),
      }
    : null;

  const principleCitations = (state.lesson.principleIds || [])
    .map(function (id) {
      const entry = state.graphData.principlesById && state.graphData.principlesById[id];
      if (!entry || !entry.sep_citation || !entry.sep_citation.url) return null;
      return {
        id: String(id),
        label: String(entry.name || beautifyId(id)),
        title: String(entry.sep_citation.title || "reference source"),
        url: String(entry.sep_citation.url || ""),
      };
    })
    .filter(Boolean);

  const theoryCitations = (state.lesson.theoryIds || [])
    .map(function (id) {
      const entry = state.graphData.theoriesById && state.graphData.theoriesById[id];
      if (!entry || !entry.sep_citation || !entry.sep_citation.url) return null;
      return {
        id: String(id),
        label: String(entry.name || beautifyId(id)),
        title: String(entry.sep_citation.title || "reference source"),
        url: String(entry.sep_citation.url || ""),
      };
    })
    .filter(Boolean);

  return {
    caseCitation: caseCitation,
    principleCitations: principleCitations,
    theoryCitations: theoryCitations,
    methodLinks: [
      {
        label: "Reflective Equilibrium",
        title: "Reflective Equilibrium",
        url: "https://plato.stanford.edu/entries/reflective-equilibrium/",
      },
      {
        label: "Moral Epistemology",
        title: "Moral Epistemology",
        url: "https://plato.stanford.edu/entries/moral-epistemology/",
      },
      {
        label: "Moral Disagreement",
        title: "Moral Disagreement",
        url: "https://plato.stanford.edu/entries/disagreement-moral/",
      },
    ],
    caveat:
      "Caution: higher coherence means better fit among current commitments; it does not by itself prove moral truth.",
  };
}

function buildSepDiagnosticReport() {
  if (!state.lesson || !state.graphData || !hasSelectedAnswer()) return null;

  const activeUnsatisfied = state.coherence.perEdge.filter(function (edge) {
    if (edge.satisfied) return false;
    const fromState = normalizeState(state.nodeStates[edge.from]);
    const toState = normalizeState(state.nodeStates[edge.to]);
    return fromState !== 0 && toState !== 0;
  });

  const counts = {
    case: 0,
    principle: 0,
    theory: 0,
  };

  activeUnsatisfied.forEach(function (edge) {
    const fromNode = state.subgraph.nodeLookup[String(edge.from)];
    const toNode = state.subgraph.nodeLookup[String(edge.to)];
    const fromType = fromNode ? fromNode.type : "";
    const toType = toNode ? toNode.type : "";
    if (fromType === "theory" || toType === "theory") {
      counts.theory += 1;
      return;
    }
    if (String(edge.from) === state.lesson.caseId || String(edge.to) === state.lesson.caseId || fromType === "case" || toType === "case") {
      counts.case += 1;
      return;
    }
    counts.principle += 1;
  });

  let tensionLabel = "No active unresolved tension";
  if (counts.case > 0 && counts.theory > 0) {
    tensionLabel = "Mixed case and background-theory tension";
  } else if (counts.theory > 0) {
    tensionLabel = "Background-theory tension";
  } else if (counts.case > 0) {
    tensionLabel = "Case-principle tension";
  } else if (counts.principle > 0) {
    tensionLabel = "Principle-level tension";
  }

  const hasTheoryNode = state.subgraph.nodes.some(function (node) {
    return node.type === "theory";
  });
  const theoryStateActive = state.subgraph.nodes.some(function (node) {
    return node.type === "theory" && normalizeState(state.nodeStates[node.id]) !== 0;
  });

  let scopeLabel = "Narrow RE pass";
  if (hasTheoryNode && theoryStateActive) {
    scopeLabel = "Wide RE pass";
  } else if (hasTheoryNode) {
    scopeLabel = "Narrow RE pass (wide links available)";
  }

  const confidence = canonicalizeConfidence(state.confidence);
  const contradictionLoad = activeUnsatisfied.length;
  let stanceLabel = "Calibration mode";
  let confidenceAdvice = "Keep confidence provisional while tracking unresolved tensions.";
  if (contradictionLoad === 0 && state.coherence.score >= 35) {
    stanceLabel = "Provisional stability";
    confidenceAdvice = "You may hold steady, but continue stress-testing with counter-cases.";
  } else if (confidence >= 80) {
    stanceLabel = "Steadfast-with-audit";
    confidenceAdvice = "High confidence under unresolved conflict: run at least one explicit peer-disagreement audit.";
  } else if (confidence >= 65) {
    stanceLabel = "Conciliation-leaning";
    confidenceAdvice = "Moderate confidence plus disagreement: reduce confidence slightly or add counterevidence checks.";
  }

  const points = [];
  if (counts.case > 0) {
    points.push("Re-check your considered judgment under Rawls' confidence and epistemic constraints before changing theory.");
  }
  if (counts.theory > 0) {
    points.push("Test independence: avoid reusing the same judgment to justify both principle and background theory.");
  }
  if (counts.principle > 0 || (counts.case === 0 && counts.theory === 0)) {
    points.push("Use analogical case comparison (casuistry) to see whether the current principle generalizes cleanly.");
  }
  if (points.length < 3) {
    points.push("Treat disagreement as information about reliability, not automatic refutation.");
  }
  points.push("Coherence gain tracks fit among commitments, not proof of moral truth.");

  return {
    scopeLabel: scopeLabel,
    tensionLabel: tensionLabel,
    stanceLabel: stanceLabel,
    confidenceAdvice: confidenceAdvice,
    points: points.slice(0, 4),
    links: [
      {
        label: "Reflective Equilibrium",
        url: "https://plato.stanford.edu/entries/reflective-equilibrium/",
      },
      {
        label: "Moral Disagreement",
        url: "https://plato.stanford.edu/entries/disagreement-moral/",
      },
      {
        label: "Moral Reasoning",
        url: "https://plato.stanford.edu/entries/reasoning-moral/",
      },
      {
        label: "Moral Epistemology",
        url: "https://plato.stanford.edu/entries/moral-epistemology/",
      },
    ],
  };
}

function hasSelectedAnswer() {
  if (!state.lesson) return false;
  return Boolean(normalizeSelectedAnswer(state.selectedAnswer, state.lesson.options));
}

function normalizeAnswer(answer, confidence) {
  let a = String(answer || "")
    .trim()
    .toLowerCase();
  let c = Number(confidence);
  if (!Number.isFinite(c)) c = 50;
  c = clamp(c, 0, 100);

  if (c < 50 && (a === "yes" || a === "no")) {
    return {
      answer: a === "yes" ? "no" : "yes",
      confidence: 100 - c,
    };
  }

  return { answer: a, confidence: c };
}

function normalizeSubmittedAnswer(answer, confidence, allowedOptions) {
  const options = sanitizeAnswerOptions(allowedOptions);
  const selected = normalizeSelectedAnswer(answer, options);
  if (!selected) {
    return { answer: "", confidence: canonicalizeConfidence(confidence) };
  }

  let normalizedConfidence = canonicalizeConfidence(confidence);
  let normalizedAnswer = selected;

  if (Number(confidence) < 50) {
    const yesNo = normalizeAnswer(selected, confidence);
    const selectedPolarity = inferCaseState(selected);
    const targetPolarity = selectedPolarity === 1 || selectedPolarity === -1 ? -selectedPolarity : inferCaseState(yesNo.answer);
    const opposite = findOppositeOption(selected, options, targetPolarity);
    if (opposite) {
      normalizedAnswer = opposite;
    }
    normalizedConfidence = yesNo.confidence;
  }

  return {
    answer: normalizeSelectedAnswer(normalizedAnswer, options),
    confidence: canonicalizeConfidence(normalizedConfidence),
  };
}

function findOppositeOption(selectedAnswer, options, targetPolarity) {
  const selected = String(selectedAnswer || "");
  const source = Array.isArray(options) ? options : [];
  if (source.length === 0) return "";
  if (source.length === 1) return source[0];

  if (targetPolarity === 1 || targetPolarity === -1) {
    const byPolarity = source.find(function (option) {
      return option !== selected && inferCaseState(option) === targetPolarity;
    });
    if (byPolarity) return byPolarity;
  }

  const fallback = source.find(function (option) {
    return option !== selected;
  });
  return fallback || "";
}

function findEdgePayloadById(edgeIdText) {
  const id = String(edgeIdText || "");
  if (!id) return null;
  const fromDelta = state.contribution.perEdge.find(function (edge) {
    return String(edge.id) === id;
  });
  if (fromDelta) return fromDelta;
  const fromSubgraph = state.subgraph.edges.find(function (edge) {
    return String(edge.id) === id;
  });
  if (!fromSubgraph) return null;
  return Object.assign({}, fromSubgraph, {
    id: id,
    relation: String(fromSubgraph.relation || (Number(fromSubgraph.weight) < 0 ? "conflict" : "support")),
  });
}

function normalizeLesson(raw, path) {
  const stepsRaw = Array.isArray(raw && raw.interactions)
    ? raw.interactions
    : Array.isArray(raw && raw.steps)
    ? raw.steps
    : [];

  const steps = stepsRaw.map(function (step) {
    const type = String(step && step.type ? step.type : "").toLowerCase();
    if (type === "case") {
      return {
        type: "case",
        caseId: String(step.caseId || step.case_id || step.id || ""),
        text: String(step.text || step.description || ""),
      };
    }
    if (type === "judgment" || type === "question") {
      const normalizedOptions = sanitizeAnswerOptions(
        Array.isArray(step.options) ? step.options : Array.isArray(step.choices) ? step.choices : ["Yes", "No"]
      );
      return {
        type: "question",
        prompt: String(step.prompt || step.text || "Choose your judgment."),
        options: normalizedOptions.length > 0 ? normalizedOptions : ["Yes", "No"],
      };
    }
    if (type === "principle") {
      return {
        type: "principle",
        principleId: String(step.principleId || step.principle_id || step.id || ""),
      };
    }
    if (type === "theory") {
      return {
        type: "theory",
        theoryId: String(step.theoryId || step.theory_id || step.id || ""),
      };
    }
    if (type === "coherence" || type === "recompute") {
      return { type: "coherence" };
    }
    if (type === "revision" || type === "reflection") {
      return { type: "revision" };
    }
    return { type: type || "other" };
  });

  const caseStep = steps.find(function (step) {
    return step.type === "case";
  });
  const questionStep = steps.find(function (step) {
    return step.type === "question";
  });

  const principleIds = unique(
    steps
      .filter(function (step) {
        return step.type === "principle";
      })
      .map(function (step) {
        return step.principleId;
      })
      .filter(Boolean)
  );

  const theoryIds = unique(
    steps
      .filter(function (step) {
        return step.type === "theory";
      })
      .map(function (step) {
        return step.theoryId;
      })
      .filter(Boolean)
  );

  const caseId = (caseStep && caseStep.caseId) || String(raw && raw.case_id ? raw.case_id : "");
  const caseTitle = caseId ? beautifyId(caseId) : "Case";
  const questionPrompt = (questionStep && questionStep.prompt) || "What is your judgment?";
  const options =
    (questionStep &&
      Array.isArray(questionStep.options) &&
      questionStep.options.length > 0 &&
      sanitizeAnswerOptions(questionStep.options)) ||
    ["Yes", "No"];

  const totalSteps = Math.max(1, steps.length);
  const questionIndex = Math.max(
    0,
    steps.findIndex(function (step) {
      return step.type === "question";
    })
  );
  const caseIndex = Math.max(
    0,
    steps.findIndex(function (step) {
      return step.type === "case";
    })
  );
  const coherenceIndex = steps.findIndex(function (step) {
    return step.type === "coherence";
  });
  const revisionIndex = steps.findIndex(function (step) {
    return step.type === "revision";
  });

  return {
    id: String(raw && raw.id ? raw.id : path),
    title: String(raw && raw.title ? raw.title : prettifyLessonPath(path)),
    caseId: caseId,
    caseTitle: caseTitle,
    caseText: (caseStep && caseStep.text) || String(raw && raw.description ? raw.description : ""),
    prompt: questionPrompt,
    options: options,
    principleIds: principleIds,
    theoryIds: theoryIds,
    totalSteps: totalSteps,
    caseStep: caseIndex + 1,
    questionStep: questionIndex + 1,
    coherenceStep: coherenceIndex >= 0 ? coherenceIndex + 1 : Math.min(totalSteps, questionIndex + 2),
    revisionStep:
      revisionIndex >= 0 ? revisionIndex + 1 : Math.min(totalSteps, (coherenceIndex >= 0 ? coherenceIndex + 1 : questionIndex + 2) + 1),
  };
}

function inferCaseState(answer) {
  const text = String(answer || "").trim().toLowerCase();
  if (!text) return 0;
  if (isUnsureOption(text) || text.indexOf("uncertain") >= 0) return 0;
  if (text.indexOf("yes") >= 0 || text.indexOf("permissible") >= 0 || text.indexOf("true") >= 0 || text.indexOf("cooperate") >= 0) {
    return 1;
  }
  if (text.indexOf("no") >= 0 || text.indexOf("impermissible") >= 0 || text.indexOf("not true") >= 0 || text.indexOf("false") >= 0) {
    return -1;
  }
  return 0;
}

function cycleState(current) {
  const safe = normalizeState(current);
  if (safe === 0) return 1;
  if (safe === 1) return -1;
  return 0;
}

function normalizeState(value) {
  if (value === 1 || value === -1 || value === 0) return value;
  return 0;
}

function cloneStates(input) {
  const source = input || {};
  const copy = {};
  Object.keys(source).forEach(function (key) {
    copy[key] = normalizeState(source[key]);
  });
  return copy;
}

function indexById(items) {
  const index = {};
  (Array.isArray(items) ? items : []).forEach(function (item) {
    if (!item || !item.id) return;
    index[String(item.id)] = item;
  });
  return index;
}

function mergeCappedNodeIds(baseNodeIds, pinnedIds, cap) {
  const seen = new Set();
  const merged = [];
  const limit = Math.max(1, Number(cap) || 1);

  function add(id) {
    const text = String(id || "");
    if (!text || seen.has(text) || merged.length >= limit) return;
    seen.add(text);
    merged.push(text);
  }

  (Array.isArray(pinnedIds) ? pinnedIds : []).forEach(add);
  (Array.isArray(baseNodeIds) ? baseNodeIds : []).forEach(add);
  return merged;
}

function unique(values) {
  const seen = new Set();
  const out = [];
  values.forEach(function (value) {
    const text = String(value || "");
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out;
}

function sanitizeAnswerOptions(options) {
  const source = Array.isArray(options) ? options : [];
  const seen = new Set();
  const sanitized = [];

  source.forEach(function (option) {
    const value = String(option || "").trim();
    if (!value || isUnsureOption(value)) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sanitized.push(value);
  });

  return sanitized;
}

function normalizeSelectedAnswer(answer, allowedOptions) {
  const value = String(answer || "").trim();
  if (!value || isUnsureOption(value)) return "";
  const normalizedAllowed = sanitizeAnswerOptions(allowedOptions);
  if (normalizedAllowed.length === 0) return value;
  return normalizedAllowed.some(function (option) {
    return option.toLowerCase() === value.toLowerCase();
  })
    ? value
    : "";
}

function isUnsureOption(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  return text === "unsure" || text === "not sure";
}

function firstSetValue(values) {
  if (!(values instanceof Set)) return "";
  const iterator = values.values();
  const first = iterator.next();
  return first && !first.done ? String(first.value) : "";
}

function beautifyId(id) {
  return String(id || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
}

function prettifyLessonPath(path) {
  const base = String(path || "")
    .split("/")
    .pop()
    .replace(/\.json$/i, "");
  return beautifyId(base);
}

function confidenceStorageKey(lessonId) {
  return CONFIDENCE_STORAGE_PREFIX + String(lessonId || "default");
}

function canonicalizeConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  const safe = clamp(parsed, 0, 100);
  if (safe < 50) return 100 - safe;
  return safe;
}

function legacyChoiceStorageKeys(lessonId) {
  const suffix = String(lessonId || "default");
  return LEGACY_CHOICE_STORAGE_KEYS.concat([
    "choice:" + suffix,
    "wre:choice:" + suffix,
    "wre:answer:" + suffix,
    "wre:selectedAnswer:" + suffix,
  ]);
}

function clearLegacyUnsureChoiceStorage(lessonId) {
  try {
    legacyChoiceStorageKeys(lessonId).forEach(function (key) {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      if (isUnsureOption(raw)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch (error) {
    // Ignore storage access failures.
  }
}

function loadStoredConfidence(lessonId) {
  try {
    const key = confidenceStorageKey(lessonId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return 50;
    const parsed = Number(raw);
    const normalized = canonicalizeConfidence(parsed);
    if (normalized !== parsed) {
      window.localStorage.setItem(key, String(normalized));
    }
    return normalized;
  } catch (error) {
    return 50;
  }
}

function saveStoredConfidence(lessonId, confidence) {
  try {
    const key = confidenceStorageKey(lessonId);
    window.localStorage.setItem(key, String(canonicalizeConfidence(confidence)));
  } catch (error) {
    // Ignore write failures (private mode / disabled storage).
  }
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function debounce(fn, waitMs) {
  let timer = 0;
  return function () {
    const args = arguments;
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(function () {
      timer = 0;
      fn.apply(null, args);
    }, waitMs);
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Failed to load " + url + " (" + response.status + ")");
  }
  return response.json();
}

function renderFatalError(error) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  if (el.lessonCardHost) {
    el.lessonCardHost.innerHTML =
      '<article class="lesson-card"><h2>WRE lesson loader error</h2><p class="lesson-hint">' + escapeHtml(message) + "</p></article>";
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
