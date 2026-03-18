import { MiniGraph, computeCoherence, computeContributions, deriveSubgraph } from "/wre/components/MiniGraph.js";
import { CoherenceGauge } from "/wre/components/CoherenceGauge.js";
import { EdgeInspector } from "/wre/components/EdgeInspector.js";
import { LessonCard } from "/wre/components/LessonCard.js";

const state = {
  lessonPaths: [],
  lessonCache: new Map(),
  currentLessonPath: "",
  lesson: null,
  graphData: null,
  graphDataPromise: null,
  subgraph: {
    nodes: [],
    edges: [],
    nodeLookup: {},
  },
  nodeStates: {},
  selectedAnswer: "",
  confidence: 50,
  revisionUsed: false,
  expanded: false,
  hoveredEdge: null,
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
const inspector = new EdgeInspector(el.inspectorHost);
const lessonCard = new LessonCard(el.lessonCardHost, {
  onAnswer: handleAnswer,
  onConfidence: handleConfidenceChange,
  onRevision: handleRevisionToggle,
});

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
  state.selectedAnswer = "";
  state.confidence = 50;
  state.revisionUsed = false;
  state.expanded = false;
  state.hoveredEdge = null;
  state.nodeStates = {};
  state.changedEdgeIds = new Set();
  state.deltaScore = 0;

  await ensureGraphData();
  rebuildSubgraph();
  state.coherence = computeCoherence(state.nodeStates, state.subgraph.edges);
  state.contribution = { perEdge: [], topContributors: [] };
  render();
}

function rebuildSubgraph() {
  if (!state.lesson || !state.graphData) return;
  const depth = state.expanded ? 2 : 1;
  const caseId = state.lesson.caseId;
  const derived = deriveSubgraph(caseId, state.graphData.edges, depth);
  const nodeIds = new Set(derived.nodeIds);
  nodeIds.add(caseId);

  state.lesson.principleIds.forEach(function (id) {
    if (id) nodeIds.add(id);
  });
  state.lesson.theoryIds.forEach(function (id) {
    if (id) nodeIds.add(id);
  });

  const nodeLookup = {};
  const nodes = Array.from(nodeIds).map(function (nodeId) {
    const resolved = resolveNode(nodeId, caseId);
    nodeLookup[resolved.id] = resolved;
    if (!Object.prototype.hasOwnProperty.call(state.nodeStates, resolved.id)) {
      state.nodeStates[resolved.id] = 0;
    }
    return resolved;
  });

  state.subgraph = {
    nodes: nodes,
    edges: derived.edges,
    nodeLookup: nodeLookup,
  };
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
  const previousStates = cloneStates(state.nodeStates);
  state.selectedAnswer = String(answer || "");
  state.confidence = clamp(Number(confidence), 0, 100);
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
  state.confidence = clamp(Number(nextConfidence), 0, 100);
}

function handleRevisionToggle(principleId) {
  if (!state.selectedAnswer || !state.lesson) return;
  if (state.revisionUsed) return;
  const node = state.subgraph.nodeLookup[String(principleId)];
  if (!node || node.type !== "principle") return;

  const previousStates = cloneStates(state.nodeStates);
  state.nodeStates[String(principleId)] = cycleState(state.nodeStates[String(principleId)]);
  state.revisionUsed = true;
  recomputeAndRender(previousStates, true);
}

function handleGraphNodeToggle(nodeId) {
  const id = String(nodeId || "");
  if (!id || !state.subgraph.nodeLookup[id]) return;
  const node = state.subgraph.nodeLookup[id];

  if (state.selectedAnswer && node.type === "principle" && state.revisionUsed) {
    return;
  }

  const previousStates = cloneStates(state.nodeStates);
  state.nodeStates[id] = cycleState(state.nodeStates[id]);

  if (state.selectedAnswer && node.type === "principle" && !state.revisionUsed) {
    state.revisionUsed = true;
  }

  recomputeAndRender(previousStates, true);
}

function recomputeAndRender(previousStates, highlightChanges) {
  const before = previousStates || cloneStates(state.nodeStates);
  const beforeCoherence = computeCoherence(before, state.subgraph.edges);
  const afterCoherence = computeCoherence(state.nodeStates, state.subgraph.edges);
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

  render();
}

function render() {
  if (!state.lesson) return;
  updateProgress();

  const principleItems = state.subgraph.nodes
    .filter(function (node) {
      return node.type === "principle";
    })
    .map(function (node) {
      return {
        id: node.id,
        label: node.label,
        state: normalizeState(state.nodeStates[node.id]),
      };
    });

  lessonCard.render({
    lessonTitle: state.lesson.title,
    caseTitle: state.lesson.caseTitle,
    caseText: state.lesson.caseText,
    prompt: state.lesson.prompt,
    options: state.lesson.options,
    selectedAnswer: state.selectedAnswer,
    confidence: state.confidence,
    principles: principleItems,
    revisionUsed: state.revisionUsed,
  });

  miniGraph.render({
    nodes: state.subgraph.nodes,
    edges: state.subgraph.edges,
    nodeStates: state.nodeStates,
    changedEdgeIds: state.changedEdgeIds,
    focusCaseId: state.lesson.caseId,
    onNodeToggle: handleGraphNodeToggle,
    onEdgeHover: handleEdgeHover,
  });

  const coherenceDetail =
    "sum satisfied w = " +
    state.coherence.satisfiedEdgeWeights.toFixed(2) +
    " | sum |w| = " +
    state.coherence.totalAbsoluteWeights.toFixed(2);
  gauge.setValue(state.coherence.score, coherenceDetail);

  inspector.render({
    hoveredEdge: state.hoveredEdge,
    topEdges: state.contribution.topContributors,
    nodeLookup: state.subgraph.nodeLookup,
    deltaScore: state.deltaScore,
  });

  if (el.expandGraphBtn) {
    el.expandGraphBtn.textContent = state.expanded ? "Collapse graph" : "Expand graph";
    el.expandGraphBtn.setAttribute("aria-label", state.expanded ? "Collapse to one hop graph" : "Expand graph to deeper neighborhood");
  }
}

function handleEdgeHover(edge) {
  state.hoveredEdge = edge || null;
  inspector.render({
    hoveredEdge: state.hoveredEdge,
    topEdges: state.contribution.topContributors,
    nodeLookup: state.subgraph.nodeLookup,
    deltaScore: state.deltaScore,
  });
}

function updateProgress() {
  if (!state.lesson) return;
  const total = Math.max(1, state.lesson.totalSteps);
  const questionStep = Math.max(1, state.lesson.questionStep);
  const coherenceStep = Math.max(questionStep, state.lesson.coherenceStep);
  const revisionStep = Math.max(coherenceStep, state.lesson.revisionStep);

  let current = questionStep;
  if (state.selectedAnswer) {
    current = coherenceStep;
  }
  if (state.revisionUsed) {
    current = revisionStep;
  }

  const percent = (current / total) * 100;
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
      return {
        type: "question",
        prompt: String(step.prompt || step.text || "Choose your judgment."),
        options: Array.isArray(step.options)
          ? step.options
          : Array.isArray(step.choices)
          ? step.choices
          : ["Yes", "No", "Unsure"],
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
    (questionStep && Array.isArray(questionStep.options) && questionStep.options.length > 0 && questionStep.options) ||
    ["Yes", "No", "Unsure"];

  const totalSteps = Math.max(1, steps.length);
  const questionIndex = Math.max(
    0,
    steps.findIndex(function (step) {
      return step.type === "question";
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
    questionStep: questionIndex + 1,
    coherenceStep: coherenceIndex >= 0 ? coherenceIndex + 1 : Math.min(totalSteps, questionIndex + 2),
    revisionStep:
      revisionIndex >= 0 ? revisionIndex + 1 : Math.min(totalSteps, (coherenceIndex >= 0 ? coherenceIndex + 1 : questionIndex + 2) + 1),
  };
}

function inferCaseState(answer) {
  const text = String(answer || "").trim().toLowerCase();
  if (!text) return 0;
  if (text.indexOf("unsure") >= 0 || text.indexOf("uncertain") >= 0) return 0;
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

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
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
