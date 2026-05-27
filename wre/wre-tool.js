const STORAGE_KEY = "normativity-wre-dashboard-v4";
const DEFAULT_PRIVACY = {
  cloudSync: false,
  nliTriage: false,
  retention: "until-deleted",
};

const icons = {
  clipboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h3v16H5V5h3l1-2Z" /><path d="M9 7h6" /></svg>',
  database: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>',
  graph: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5" /><path d="m8 13 8 5" /></svg>',
  scales: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18" /><path d="M5 7h14" /><path d="m6 7-3 6h6L6 7Z" /><path d="m18 7-3 6h6l-3-6Z" /></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H7a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.8-1.8A4.8 4.8 0 0 1 17.5 19Z" /></svg>',
  sliders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><circle cx="8" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4Z" /></svg>',
  wrench: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.1 5.1L4 17v3h3l5.6-5.6a4 4 0 0 0 5.1-5.1L15 12l-3-3 2.7-2.7Z" /></svg>',
  history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /><path d="M12 7v5l3 2" /></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 5-4 14" /></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>',
};

const stages = [
  {
    id: "preparation",
    icon: "clipboard",
    label: "Preparation",
    copy: "Define scope, context, and initial framing.",
  },
  {
    id: "collection",
    icon: "database",
    label: "Collection",
    copy: "Gather judgments, principles, and background theories.",
  },
  {
    id: "integration",
    icon: "graph",
    label: "Integration",
    copy: "Normalize and integrate into a canonical representation.",
  },
  {
    id: "reflection",
    icon: "scales",
    label: "Reflection",
    copy: "Detect conflicts and evaluate repair options.",
  },
  {
    id: "action",
    icon: "check",
    label: "Action",
    copy: "Adopt revisions and track outcomes.",
  },
];

const seedBeliefs = [
  {
    id: "J1",
    layer: "judgment",
    text: "We should not reject candidates because of protected attributes.",
    domain: "normative",
    confidence: 88,
    timeScope: "Hiring policy review",
    provenance: "Considered case judgment",
    sensitivity: "private",
  },
  {
    id: "J2",
    layer: "judgment",
    text: "We may consider experience relevant to the role.",
    domain: "normative",
    confidence: 72,
    timeScope: "Hiring policy review",
    provenance: "Structured interview rubric",
    sensitivity: "private",
  },
  {
    id: "J3",
    layer: "judgment",
    text: "Transparency to candidates is required.",
    domain: "normative",
    confidence: 76,
    timeScope: "Candidate communications",
    provenance: "Fair process intuition",
    sensitivity: "private",
  },
  {
    id: "P1",
    layer: "principle",
    text: "Equal respect and non-discrimination",
    domain: "normative",
    confidence: 92,
    timeScope: "General hiring ethics",
    provenance: "Normative principle",
    sensitivity: "private",
  },
  {
    id: "P2",
    layer: "principle",
    text: "Proportionality",
    domain: "normative",
    confidence: 78,
    timeScope: "Selection criteria",
    provenance: "Normative principle",
    sensitivity: "private",
  },
  {
    id: "P3",
    layer: "principle",
    text: "Fair opportunity",
    domain: "normative",
    confidence: 86,
    timeScope: "General hiring ethics",
    provenance: "Normative principle",
    sensitivity: "private",
  },
  {
    id: "T1",
    layer: "theory",
    text: "Anti-discrimination law (Title VII)",
    domain: "empirical",
    confidence: 83,
    timeScope: "US hiring context",
    provenance: "Legal background",
    sensitivity: "private",
  },
  {
    id: "T2",
    layer: "theory",
    text: "Reliability of structured interviews",
    domain: "empirical",
    confidence: 70,
    timeScope: "Personnel selection evidence",
    provenance: "Background research",
    sensitivity: "private",
  },
  {
    id: "T3",
    layer: "theory",
    text: "Cognitive bias research",
    domain: "empirical",
    confidence: 74,
    timeScope: "Evaluator behavior",
    provenance: "Background research",
    sensitivity: "private",
  },
];

const seedConflicts = [
  {
    id: "C-001",
    title: "Non-discrimination vs. Experience Proxy",
    severity: "critical",
    summary: "J1 conflicts with P2 under T3",
    provenance: "J1, P2, T3",
    time: "May 15, 2025 10:58 AM",
    claimA: "J1",
    claimB: "P2",
    linked: ["P2", "T3"],
    kind: "hard",
    confidence: 0.86,
    core: ["J1", "P2", "T3"],
    engine: ["Rule constraint", "SMT unsat core", "Repair ranking"],
    why:
      "Considering experience may serve as a proxy for protected attributes, creating an unjustified disparate impact, violating non-discrimination under bias findings in T3.",
    repairs: [
      {
        id: "R-001",
        title: "Add Clarifying Constraint",
        text: "Add constraint to P2: consider experience only when job-relevant and validated.",
        cost: "0.62",
        badge: "Lowest",
        tone: "critical",
      },
      {
        id: "R-002",
        title: "Refine Judgment",
        text: "Refine J1 to allow consideration of validated, job-related experience only.",
        cost: "0.74",
        tone: "high",
      },
      {
        id: "R-003",
        title: "Reweight Principle",
        text: "Decrease weight of P2 in contexts with high proxy risk.",
        cost: "1.05",
        tone: "medium",
      },
    ],
  },
  {
    id: "C-002",
    title: "Transparency vs. Confidentiality",
    severity: "high",
    summary: "J3 conflicts with P3 under T1",
    provenance: "J3, P3, T1",
    time: "May 15, 2025 10:57 AM",
    claimA: "J3",
    claimB: "P3",
    linked: ["P3", "T1"],
    kind: "soft",
    confidence: 0.78,
    core: ["J3", "P3", "T1"],
    engine: ["Relation graph", "NLI triage", "Human review"],
    why:
      "Candidate transparency can conflict with confidential assessment notes when disclosure would expose trade secrets or private evaluator deliberation.",
    repairs: [
      {
        id: "R-004",
        title: "Scope Transparency",
        text: "Reveal decision criteria and summary rationale while withholding protected evaluator notes.",
        cost: "0.71",
        badge: "Lowest",
        tone: "high",
      },
      {
        id: "R-005",
        title: "Add Disclosure Layer",
        text: "Separate candidate-facing explanations from internal audit artifacts.",
        cost: "0.83",
        tone: "medium",
      },
    ],
  },
  {
    id: "C-003",
    title: "Fair Opportunity vs. Role Fit",
    severity: "high",
    summary: "P3 conflicts with P2 under T2",
    provenance: "P3, P2, T2",
    time: "May 15, 2025 10:55 AM",
    claimA: "P3",
    claimB: "P2",
    linked: ["P2", "T2"],
    kind: "soft",
    confidence: 0.74,
    core: ["P3", "P2", "T2"],
    engine: ["Argument graph", "Probabilistic tension score", "Repair ranking"],
    why:
      "Role-fit scoring can improve proportional selection, but it can also compress fair opportunity when the fit model inherits old performance assumptions.",
    repairs: [
      {
        id: "R-006",
        title: "Constrain Role Fit",
        text: "Use role-fit signals only after validation against subgroup fairness outcomes.",
        cost: "0.81",
        badge: "Lowest",
        tone: "high",
      },
    ],
  },
  {
    id: "C-004",
    title: "Proportionality vs. Data Breadth",
    severity: "medium",
    summary: "P2 conflicts with T2",
    provenance: "P2, T2",
    time: "May 15, 2025 10:54 AM",
    claimA: "P2",
    claimB: "T2",
    linked: ["P2", "T2"],
    kind: "soft",
    confidence: 0.67,
    core: ["P2", "T2"],
    engine: ["Rule constraint", "Probabilistic tension score"],
    why:
      "Structured interviews favor narrower validated evidence, while proportionality may invite broader context for borderline cases.",
    repairs: [
      {
        id: "R-007",
        title: "Limit Breadth",
        text: "Allow contextual evidence only when it is job-related and consistently available.",
        cost: "0.89",
        badge: "Lowest",
        tone: "medium",
      },
    ],
  },
  {
    id: "C-005",
    title: "Transparency vs. Trade Secrets",
    severity: "medium",
    summary: "J3 conflicts with T1",
    provenance: "J3, T1",
    time: "May 15, 2025 10:53 AM",
    claimA: "J3",
    claimB: "T1",
    linked: ["J3", "T1"],
    kind: "soft",
    confidence: 0.69,
    core: ["J3", "T1"],
    engine: ["NLI triage", "Human review"],
    why:
      "Some transparency claims should be satisfied with high-level reasons rather than disclosure of proprietary scoring implementation.",
    repairs: [
      {
        id: "R-008",
        title: "Summarize Without Revealing",
        text: "Provide reason categories and appeal paths without exposing proprietary weights.",
        cost: "0.92",
        badge: "Lowest",
        tone: "medium",
      },
    ],
  },
];

const pipeline = [
  { icon: "database", title: "Local Store", subtitle: "Indexed session", metric: "9 claims" },
  { icon: "sliders", title: "Normalizer", subtitle: "Typed records", metric: "6 fields" },
  { icon: "shield", title: "Rule Checks", subtitle: "Hard constraints", metric: "2 hard" },
  { icon: "code", title: "SMT Core", subtitle: "Unsat subset", metric: "1 core" },
  { icon: "graph", title: "Argument Graph", subtitle: "Attack/defense", metric: "5 links" },
  { icon: "cloud", title: "NLI Triage", subtitle: "Opt-in soft scan", metric: "off" },
  { icon: "wrench", title: "Repair Ranking", subtitle: "Lowest change", metric: "8 repairs" },
  { icon: "history", title: "Audit Log", subtitle: "Revision replay", metric: "0 revisions" },
];

const agentContract = {
  schemaVersion: "wre-2.5",
  claimFields: ["id", "layer", "text", "domain", "confidence", "timeScope", "provenance", "sensitivity"],
  relationTypes: ["supports", "conflicts", "neutral", "implies", "depends_on", "undercuts"],
  conflictKinds: ["hard", "soft", "nlp"],
  endpoints: [
    ["POST", "/v1/analyze", "Run rule, SMT, graph, NLI, and probabilistic checks."],
    ["GET", "/v1/conflicts", "Read explanation-first conflict reports."],
    ["POST", "/v1/conflicts/{id}/repair", "Preview or apply a ranked repair option."],
    ["GET", "/v1/export", "Export a portable JSON session archive."],
    ["DELETE", "/v1/sessions/{id}", "Delete a synced or local session record."],
  ],
};

const severityOrder = ["critical", "high", "medium", "low"];
const tabLabels = ["all", "critical", "high", "medium", "low"];

const els = {
  stageList: document.getElementById("stageList"),
  judgmentList: document.getElementById("judgmentList"),
  principleList: document.getElementById("principleList"),
  theoryList: document.getElementById("theoryList"),
  conflictTabs: document.getElementById("conflictTabs"),
  conflictQueue: document.getElementById("conflictQueue"),
  detailId: document.getElementById("detailId"),
  detailTitle: document.getElementById("detailTitle"),
  detailSeverity: document.getElementById("detailSeverity"),
  detailClaims: document.getElementById("detailClaims"),
  detailLinks: document.getElementById("detailLinks"),
  detailWhy: document.getElementById("detailWhy"),
  repairOptions: document.getElementById("repairOptions"),
  pipelineList: document.getElementById("pipelineList"),
  beliefForm: document.getElementById("beliefForm"),
  beliefText: document.getElementById("beliefText"),
  tokenCount: document.getElementById("tokenCount"),
  storageStatus: document.getElementById("storageStatus"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  resetLocalBtn: document.getElementById("resetLocalBtn"),
  clearComposerBtn: document.getElementById("clearComposerBtn"),
  insertReferenceBtn: document.getElementById("insertReferenceBtn"),
  assistBtn: document.getElementById("assistBtn"),
  applyRepairBtn: document.getElementById("applyRepairBtn"),
  guidanceBtn: document.getElementById("guidanceBtn"),
  editContextBtn: document.getElementById("editContextBtn"),
  cloudSyncToggle: document.getElementById("cloudSyncToggle"),
  llmTriageToggle: document.getElementById("llmTriageToggle"),
  retentionSelect: document.getElementById("retentionSelect"),
  sessionMode: document.getElementById("sessionMode"),
  sessionRetention: document.getElementById("sessionRetention"),
  claimKind: document.getElementById("claimKind"),
  claimDomain: document.getElementById("claimDomain"),
  confidenceInput: document.getElementById("confidenceInput"),
  confidenceOutput: document.getElementById("confidenceOutput"),
  timeScopeInput: document.getElementById("timeScopeInput"),
  provenanceInput: document.getElementById("provenanceInput"),
  sensitivityInput: document.getElementById("sensitivityInput"),
  claimWorkbenchPanel: document.getElementById("claimWorkbenchPanel"),
  detailCore: document.getElementById("detailCore"),
  detailEngine: document.getElementById("detailEngine"),
  graphBtn: document.getElementById("graphBtn"),
  viewAllConflictsBtn: document.getElementById("viewAllConflictsBtn"),
  reviewLatestBtn: document.getElementById("reviewLatestBtn"),
  copyContractBtn: document.getElementById("copyContractBtn"),
  revisionReplay: document.getElementById("revisionReplay"),
  revisionList: document.getElementById("revisionList"),
  agentContractPanel: document.getElementById("agentContractPanel"),
  agentContractList: document.getElementById("agentContractList"),
};

let state = loadState() || createState();

render();
bindEvents();

function createState() {
  return {
    activeStage: "preparation",
    activeNav: "intake",
    activeTab: "all",
    selectedConflictId: "C-001",
    selectedRepairId: "R-001",
    beliefs: clone(seedBeliefs),
    conflicts: clone(seedConflicts),
    revisions: [],
    privacy: { ...DEFAULT_PRIVACY },
    viewMode: "table",
    workbenchFilter: "all",
    graphFocusConflictId: "",
    createdAt: "2025-05-15T10:42:00.000Z",
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.beliefs) || !Array.isArray(parsed.conflicts)) return null;
    return {
      ...createState(),
      ...parsed,
      beliefs: parsed.beliefs.map(normalizeBelief),
      conflicts: parsed.conflicts.map(normalizeConflict),
      revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
      privacy: { ...DEFAULT_PRIVACY, ...(parsed.privacy || {}) },
      viewMode: parsed.viewMode === "graph" ? "graph" : "table",
      workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
      graphFocusConflictId: parsed.graphFocusConflictId || "",
    };
  } catch {
    return null;
  }
}

function saveState() {
  const serialized = JSON.stringify(state);
  if (state.privacy?.retention === "session-only") {
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, serialized);
  sessionStorage.removeItem(STORAGE_KEY);
}

function normalizeBelief(belief) {
  const layer = ["judgment", "principle", "theory"].includes(belief.layer) ? belief.layer : "judgment";
  return {
    id: belief.id || `${prefixForLayer(layer)}0`,
    layer,
    text: belief.text || "",
    domain: belief.domain || (layer === "theory" ? "empirical" : "normative"),
    confidence: Number.isFinite(Number(belief.confidence)) ? clamp(Number(belief.confidence), 1, 100) : 70,
    timeScope: belief.timeScope || belief.time_scope || "Unscoped",
    provenance: belief.provenance || belief.source_refs || "User supplied",
    sensitivity: belief.sensitivity || belief.sensitivity_tags || "private",
  };
}

function normalizeConflict(conflict) {
  return {
    ...conflict,
    kind: conflict.kind || "soft",
    confidence: Number.isFinite(Number(conflict.confidence)) ? Number(conflict.confidence) : 0.7,
    core: Array.isArray(conflict.core) ? conflict.core : [conflict.claimA, conflict.claimB].filter(Boolean),
    engine: Array.isArray(conflict.engine) ? conflict.engine : ["Rule constraint", "Human review"],
    repairs: Array.isArray(conflict.repairs) ? conflict.repairs : [],
    linked: Array.isArray(conflict.linked) ? conflict.linked : [],
  };
}

function normalizeRevision(revision) {
  return {
    time: revision.time || new Date().toISOString(),
    type: revision.type || "audit",
    text: revision.text || revision.reason || "Session updated.",
    conflictId: revision.conflictId || "",
    repairId: revision.repairId || "",
  };
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeNav = button.dataset.nav;
      saveState();
      syncNav();
      focusWorkflowNav(button.dataset.nav);
    });
  });

  document.querySelectorAll(".view-mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.viewMode = button.dataset.viewMode === "graph" ? "graph" : "table";
      saveState();
      syncViewMode();
      renderClaimWorkbench();
    });
  });

  document.querySelectorAll("[data-add-layer]").forEach((button) => {
    button.addEventListener("click", () => focusComposer(button.dataset.addLayer));
  });

  document.querySelectorAll("[data-filter-layer]").forEach((button) => {
    button.addEventListener("click", () => showWorkbenchLayer(button.dataset.filterLayer));
  });

  els.beliefText.addEventListener("input", updateTokenCount);
  els.confidenceInput.addEventListener("input", syncConfidenceOutput);

  els.beliefForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addBelief();
  });

  els.clearComposerBtn.addEventListener("click", () => {
    els.beliefText.value = "";
    updateTokenCount();
    els.beliefText.focus();
  });

  els.insertReferenceBtn.addEventListener("click", () => {
    insertAtCursor(els.beliefText, "@J1 ");
    updateTokenCount();
  });

  els.assistBtn.addEventListener("click", () => {
    const assisted =
      "We may consider @J2 only where @P2 is constrained by job relevance, validation evidence, and the proxy-risk findings in @T3.";
    els.beliefText.value = assisted;
    updateTokenCount();
    els.beliefText.focus();
  });

  els.applyRepairBtn.addEventListener("click", applySelectedRepair);

  els.graphBtn.addEventListener("click", () => {
    state.viewMode = "graph";
    state.activeNav = "conflicts";
    state.graphFocusConflictId = state.selectedConflictId;
    saveState();
    syncNav();
    syncViewMode();
    renderClaimWorkbench();
    focusElement(els.claimWorkbenchPanel);
  });

  els.viewAllConflictsBtn.addEventListener("click", () => {
    state.activeTab = "all";
    state.activeNav = "conflicts";
    saveState();
    renderTabs();
    renderConflicts();
    syncNav();
    focusElement(document.querySelector(".conflict-panel"));
  });

  els.guidanceBtn.addEventListener("click", () => {
    insertAtCursor(
      els.beliefText,
      "Balance judgments, principles, and background theories before changing confidence weights; mark hard conflicts separately from soft tensions. "
    );
    updateTokenCount();
  });

  els.editContextBtn.addEventListener("click", () => {
    state.activeStage = "collection";
    saveState();
    renderStages();
    focusComposer("judgment");
  });

  els.exportBtn.addEventListener("click", exportApi);
  els.importInput.addEventListener("change", importApi);
  els.resetLocalBtn.addEventListener("click", resetLocalSession);

  [els.cloudSyncToggle, els.llmTriageToggle, els.retentionSelect].forEach((control) => {
    control.addEventListener("change", updatePrivacyControls);
  });

  els.reviewLatestBtn.addEventListener("click", () => {
    state.activeNav = "replay";
    saveState();
    syncNav();
    focusElement(els.revisionReplay);
  });

  els.copyContractBtn.addEventListener("click", copyAgentContract);
}

function render() {
  renderStages();
  renderBeliefs();
  renderTabs();
  renderConflicts();
  renderDetail();
  renderClaimWorkbench();
  renderRevisionReplay();
  renderAgentContract();
  renderPipeline();
  syncNav();
  syncPrivacyControls();
  syncViewMode();
  syncConfidenceOutput();
  syncStorageStatus();
  updateTokenCount();
}

function renderStages() {
  replaceChildren(
    els.stageList,
    stages.map((stage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `stage-button${stage.id === state.activeStage ? " is-active" : ""}`;
      button.dataset.stage = stage.id;
      button.innerHTML = `
        <span class="stage-icon">${icons[stage.icon]}</span>
        <span class="stage-copy">
          <strong><span class="stage-number">${index + 1}</span>${escapeHtml(stage.label)}</strong>
          <span>${escapeHtml(stage.copy)}</span>
        </span>
        <span class="stage-chevron">${icons.chevron}</span>
      `;
      button.addEventListener("click", () => {
        state.activeStage = stage.id;
        saveState();
        renderStages();
        focusStage(stage.id);
      });
      return button;
    })
  );
}

function renderBeliefs() {
  renderBeliefLayer("judgment", els.judgmentList);
  renderBeliefLayer("principle", els.principleList);
  renderBeliefLayer("theory", els.theoryList);
  syncLayerCounts();
}

function renderBeliefLayer(layer, container) {
  const items = state.beliefs.filter((belief) => belief.layer === layer).slice(0, 3);
  replaceChildren(
    container,
    items.map((belief) => {
      const row = document.createElement("article");
      row.className = "belief-item";
      row.innerHTML = `
        <span class="belief-id">${escapeHtml(belief.id)}</span>
        <span class="belief-copy">
          <p>${escapeHtml(belief.text)}</p>
          <small>${escapeHtml(titleCase(belief.domain))} · ${escapeHtml(belief.confidence)}% · ${escapeHtml(titleCase(belief.sensitivity))}</small>
        </span>
        <button class="row-menu" type="button" aria-label="More actions for ${escapeHtml(belief.id)}">${icons.dots}</button>
      `;
      return row;
    })
  );
}

function renderTabs() {
  const counts = getCounts();
  replaceChildren(
    els.conflictTabs,
    tabLabels.map((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `queue-tab${state.activeTab === tab ? " is-active" : ""}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(state.activeTab === tab));
      button.textContent = `${titleCase(tab)} `;
      const count = document.createElement("span");
      count.textContent = counts[tab];
      button.append(count);
      button.addEventListener("click", () => {
        state.activeTab = tab;
        const firstVisible = getFilteredConflicts()[0];
        if (firstVisible) state.selectedConflictId = firstVisible.id;
        saveState();
        renderTabs();
        renderConflicts();
        renderDetail();
      });
      return button;
    })
  );
}

function renderConflicts() {
  const conflicts = getFilteredConflicts();
  replaceChildren(
    els.conflictQueue,
    conflicts.map((conflict) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `conflict-card${conflict.id === state.selectedConflictId ? " is-active" : ""}`;
      button.innerHTML = `
        <span class="conflict-card-top">
          <span class="conflict-card-id">${escapeHtml(conflict.id)}</span>
          <h3>${escapeHtml(conflict.title)}</h3>
          <span class="severity-pill ${escapeHtml(conflict.severity)}">${escapeHtml(titleCase(conflict.severity))}</span>
        </span>
        <p>${escapeHtml(conflict.summary)}</p>
        <p>Provenance: ${escapeHtml(conflict.provenance)}</p>
        <time>${escapeHtml(conflict.time)}</time>
        <span class="conflict-card-chevron">${icons.chevron}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedConflictId = conflict.id;
        state.selectedRepairId = conflict.repairs[0]?.id || "";
        state.activeNav = "conflicts";
        state.graphFocusConflictId = conflict.id;
        saveState();
        renderConflicts();
        renderDetail();
        renderClaimWorkbench();
        syncNav();
      });
      return button;
    })
  );
}

function renderDetail() {
  const conflict = getSelectedConflict();
  if (!conflict) return;
  state.selectedRepairId = state.selectedRepairId || conflict.repairs[0]?.id || "";

  els.detailId.textContent = conflict.id;
  els.detailTitle.textContent = conflict.title;
  els.detailSeverity.className = `severity-pill ${conflict.severity}`;
  els.detailSeverity.textContent = titleCase(conflict.severity);
  els.detailWhy.textContent = conflict.why;

  replaceChildren(
    els.detailCore,
    (conflict.core || []).map((id) => {
      const belief = findBelief(id);
      const item = document.createElement("article");
      item.className = "core-item";
      item.innerHTML = `
        <span class="belief-id">${escapeHtml(id)}</span>
        <span>
          <strong>${escapeHtml(labelForLayer(belief?.layer))}</strong>
          <small>${escapeHtml(belief?.domain ? titleCase(belief.domain) : "Unscoped")} · ${escapeHtml(belief?.confidence || "—")}%</small>
        </span>
      `;
      return item;
    })
  );

  replaceChildren(
    els.detailEngine,
    (conflict.engine || []).map((step, index) => {
      const item = document.createElement("span");
      item.className = "engine-chip";
      item.textContent = `${index + 1}. ${step}`;
      return item;
    })
  );

  replaceChildren(
    els.detailClaims,
    [
      { title: "Claim A", id: conflict.claimA },
      { title: "Claim B", id: conflict.claimB },
    ].map(({ title, id }) => {
      const belief = findBelief(id);
      const box = document.createElement("article");
      box.className = "claim-box";
      box.innerHTML = `
        <h4>${escapeHtml(title)}</h4>
        <div class="claim-box-row">
          <span class="belief-id">${escapeHtml(id)}</span>
          <p>${escapeHtml(belief?.text || "No linked claim available.")}</p>
        </div>
      `;
      return box;
    })
  );

  replaceChildren(
    els.detailLinks,
    conflict.linked.map((id) => {
      const belief = findBelief(id);
      const item = document.createElement("article");
      item.className = "linked-item";
      item.innerHTML = `
        <strong>${escapeHtml(labelForLayer(belief?.layer))}</strong>
        <div class="link-row">
          <span class="link-id">${escapeHtml(id)}</span>
          <p>${escapeHtml(belief?.text || "No linked item available.")}</p>
        </div>
      `;
      return item;
    })
  );

  replaceChildren(
    els.repairOptions,
    conflict.repairs.map((repair, index) => {
      const button = document.createElement("button");
      const selected = repair.id === state.selectedRepairId || (!state.selectedRepairId && index === 0);
      button.type = "button";
      button.className = `repair-card ${repair.tone || ""}${selected ? " is-selected" : ""}`;
      button.innerHTML = `
        <span class="repair-row">
          <span class="repair-icon">${icons.code}</span>
          <span>
            <h4>${escapeHtml(repair.id)} &nbsp; ${escapeHtml(repair.title)}</h4>
            <p>${escapeHtml(repair.text)}</p>
            <small>Cost: ${escapeHtml(repair.cost)}</small>
          </span>
          ${repair.badge ? `<span class="cost-pill">${escapeHtml(repair.badge)}</span>` : ""}
        </span>
      `;
      button.addEventListener("click", () => {
        state.selectedRepairId = repair.id;
        saveState();
        renderDetail();
      });
      return button;
    })
  );
}

function renderPipeline() {
  const revisionCount = state.revisions.length;
  const claimCount = state.beliefs.length;
  const hardCount = state.conflicts.filter((conflict) => conflict.kind === "hard").length;
  const softCount = state.conflicts.length - hardCount;
  replaceChildren(
    els.pipelineList,
    pipeline.map((step, index) => {
      const item = document.createElement("article");
      item.className = "pipeline-step";
      let metric = step.metric;
      if (step.title === "Local Store") metric = `${claimCount} claims`;
      if (step.title === "Rule Checks") metric = `${hardCount} hard`;
      if (step.title === "NLI Triage") metric = state.privacy.nliTriage ? `${softCount} soft` : "off";
      if (step.title === "Audit Log") metric = `${revisionCount} revisions`;
      item.innerHTML = `
        <span class="pipeline-check">${icons.check}</span>
        <span class="pipeline-icon">${icons[step.icon]}</span>
        <strong>${escapeHtml(step.title)}</strong>
        <span>${escapeHtml(step.subtitle)}</span>
        <em>${escapeHtml(metric)}</em>
      `;
      item.style.setProperty("--step-index", String(index));
      return item;
    })
  );
}

function renderClaimWorkbench() {
  if (state.viewMode === "graph") {
    renderGraphView();
    return;
  }
  renderTableView();
}

function renderTableView() {
  const visibleBeliefs = getVisibleBeliefs();
  const children = [];
  const filterBar = renderWorkbenchFilter();
  if (filterBar) children.push(filterBar);

  const table = document.createElement("table");
  table.className = "claim-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Kind</th>
        <th scope="col">Claim</th>
        <th scope="col">Domain</th>
        <th scope="col">Confidence</th>
        <th scope="col">Scope</th>
        <th scope="col">Provenance</th>
        <th scope="col">Sensitivity</th>
      </tr>
    </thead>
    <tbody>
      ${visibleBeliefs.map((belief) => `
        <tr>
          <td><span class="belief-id">${escapeHtml(belief.id)}</span></td>
          <td>${escapeHtml(labelForLayer(belief.layer))}</td>
          <td>${escapeHtml(belief.text)}</td>
          <td>${escapeHtml(titleCase(belief.domain))}</td>
          <td>${escapeHtml(belief.confidence)}%</td>
          <td>${escapeHtml(belief.timeScope)}</td>
          <td>${escapeHtml(belief.provenance)}</td>
          <td>${escapeHtml(titleCase(belief.sensitivity))}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
  children.push(table);
  replaceChildren(els.claimWorkbenchPanel, children);
}

function renderGraphView() {
  const graph = document.createElement("div");
  graph.className = "graph-view";
  const selectedConflict = state.conflicts.find((conflict) => conflict.id === state.graphFocusConflictId) || getSelectedConflict();
  const focusedIds = new Set([
    selectedConflict?.claimA,
    selectedConflict?.claimB,
    ...(selectedConflict?.core || []),
  ].filter(Boolean));
  const visibleBeliefs = getVisibleBeliefs();
  const visibleIds = new Set(visibleBeliefs.map((belief) => belief.id));
  const visibleConflicts = state.conflicts.filter((conflict) => {
    if (state.workbenchFilter === "all") return true;
    return visibleIds.has(conflict.claimA) || visibleIds.has(conflict.claimB) || (conflict.core || []).some((id) => visibleIds.has(id));
  });
  const layers = [
    ["judgment", "Judgments"],
    ["principle", "Principles"],
    ["theory", "Background Theories"],
  ];
  graph.innerHTML = `
    <div class="graph-grid">
      ${layers.map(([layer, label]) => `
        <section class="graph-lane" aria-label="${escapeHtml(label)}">
          <h3>${escapeHtml(label)}</h3>
          ${visibleBeliefs.filter((belief) => belief.layer === layer).map((belief) => `
            <article class="graph-node ${escapeHtml(layer)}${focusedIds.has(belief.id) ? " is-focus" : ""}">
              <span class="belief-id">${escapeHtml(belief.id)}</span>
              <p>${escapeHtml(belief.text)}</p>
              <small>${escapeHtml(belief.confidence)}% · ${escapeHtml(titleCase(belief.domain))}</small>
            </article>
          `).join("")}
        </section>
      `).join("")}
    </div>
    <div class="graph-relations" aria-label="Conflict relations">
      ${visibleConflicts.map((conflict) => `
        <article class="relation-row${conflict.id === selectedConflict?.id ? " is-selected" : ""}">
          <span class="severity-pill ${escapeHtml(conflict.severity)}">${escapeHtml(titleCase(conflict.kind))}</span>
          <strong>${escapeHtml(conflict.claimA)} → ${escapeHtml(conflict.claimB)}</strong>
          <p>${escapeHtml(conflict.summary)}</p>
        </article>
      `).join("")}
    </div>
  `;
  const children = [];
  const filterBar = renderWorkbenchFilter();
  if (filterBar) children.push(filterBar);
  children.push(graph);
  replaceChildren(els.claimWorkbenchPanel, children);
}

function renderWorkbenchFilter() {
  if (state.workbenchFilter === "all") return null;
  const bar = document.createElement("div");
  bar.className = "workbench-filter";
  bar.innerHTML = `
    <span>Showing ${escapeHtml(labelForLayer(state.workbenchFilter).toLowerCase())} claims</span>
    <button type="button">Clear filter</button>
  `;
  bar.querySelector("button").addEventListener("click", () => {
    state.workbenchFilter = "all";
    saveState();
    renderClaimWorkbench();
  });
  return bar;
}

function renderRevisionReplay() {
  const revisions = [...state.revisions].map(normalizeRevision).reverse();
  if (!revisions.length) {
    const empty = document.createElement("li");
    empty.className = "revision-empty";
    empty.innerHTML = `
      <strong>No revisions yet</strong>
      <span>Apply a repair, add a claim, or change privacy controls to create an auditable replay entry.</span>
    `;
    replaceChildren(els.revisionList, [empty]);
    return;
  }

  replaceChildren(
    els.revisionList,
    revisions.slice(0, 8).map((revision, index) => {
      const item = document.createElement("li");
      item.className = "revision-item";
      item.innerHTML = `
        <span class="revision-index">${index + 1}</span>
        <span class="revision-copy">
          <strong>${escapeHtml(revisionLabel(revision.type))}</strong>
          <span>${escapeHtml(revision.text)}</span>
          <time datetime="${escapeHtml(revision.time)}">${escapeHtml(formatTime(revision.time))}</time>
        </span>
      `;
      return item;
    })
  );
}

function renderAgentContract() {
  replaceChildren(
    els.agentContractList,
    [
      renderContractGroup("Claim fields", agentContract.claimFields),
      renderContractGroup("Relation types", agentContract.relationTypes),
      renderContractGroup("Conflict kinds", agentContract.conflictKinds),
      ...agentContract.endpoints.map(([method, path, copy]) => {
        const item = document.createElement("article");
        item.className = "contract-endpoint";
        item.innerHTML = `
          <span>${escapeHtml(method)}</span>
          <strong>${escapeHtml(path)}</strong>
          <p>${escapeHtml(copy)}</p>
        `;
        return item;
      }),
    ]
  );
}

function renderContractGroup(title, values) {
  const group = document.createElement("article");
  group.className = "contract-group";
  group.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <p>${values.map(escapeHtml).join(", ")}</p>
  `;
  return group;
}

function syncNav() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    const selected = button.dataset.nav === state.activeNav;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function syncViewMode() {
  document.querySelectorAll(".view-mode-button").forEach((button) => {
    const selected = button.dataset.viewMode === state.viewMode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}

function syncPrivacyControls() {
  els.cloudSyncToggle.checked = Boolean(state.privacy.cloudSync);
  els.llmTriageToggle.checked = Boolean(state.privacy.nliTriage);
  els.retentionSelect.value = state.privacy.retention || DEFAULT_PRIVACY.retention;
  els.sessionMode.textContent = state.privacy.cloudSync ? "Local + sync" : "Local-first";
  els.sessionRetention.textContent = retentionLabel(state.privacy.retention);
}

function syncConfidenceOutput() {
  els.confidenceOutput.textContent = `${els.confidenceInput.value}%`;
}

function syncStorageStatus() {
  const storageMode = state.privacy.retention === "session-only" ? "session" : "local";
  const syncMode = state.privacy.cloudSync ? "sync ready" : "local-only";
  els.storageStatus.textContent = `${titleCase(storageMode)} · ${syncMode}`;
}

function getCounts() {
  return tabLabels.reduce((counts, tab) => {
    counts[tab] = tab === "all"
      ? state.conflicts.length
      : state.conflicts.filter((conflict) => conflict.severity === tab).length;
    return counts;
  }, {});
}

function getFilteredConflicts() {
  const conflicts = state.activeTab === "all"
    ? state.conflicts
    : state.conflicts.filter((conflict) => conflict.severity === state.activeTab);

  return [...conflicts].sort((a, b) => {
    const severityDelta = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    if (severityDelta !== 0) return severityDelta;
    return a.id.localeCompare(b.id);
  });
}

function getSelectedConflict() {
  return state.conflicts.find((conflict) => conflict.id === state.selectedConflictId) || state.conflicts[0];
}

function findBelief(id) {
  return state.beliefs.find((belief) => belief.id === id);
}

function labelForLayer(layer) {
  if (layer === "principle") return "Principle";
  if (layer === "theory") return "Background Theory";
  if (layer === "judgment") return "Judgment";
  return "Linked Item";
}

function focusComposer(layer) {
  if (["judgment", "principle", "theory"].includes(layer)) {
    els.claimKind.value = layer;
    els.claimDomain.value = layer === "theory" ? "empirical" : "normative";
  }
  const prefix = layer === "principle" ? "@P2 " : layer === "theory" ? "@T3 " : "@J1 ";
  insertAtCursor(els.beliefText, prefix);
  updateTokenCount();
  els.beliefText.focus();
}

function addBelief() {
  const text = els.beliefText.value.trim();
  if (!text) {
    els.beliefText.focus();
    return;
  }

  const layer = els.claimKind.value || inferLayer(text);
  const prefix = prefixForLayer(layer);
  const belief = {
    id: nextBeliefId(layer),
    layer,
    text,
    domain: els.claimDomain.value,
    confidence: Number(els.confidenceInput.value),
    timeScope: els.timeScopeInput.value.trim() || "Unscoped",
    provenance: els.provenanceInput.value.trim() || "User supplied",
    sensitivity: els.sensitivityInput.value,
  };

  state.beliefs.push(belief);
  recordRevision("claim", `Added ${belief.id} to ${labelForLayer(layer).toLowerCase()} with ${belief.confidence}% confidence.`, {
    claimId: belief.id,
  });
  els.beliefText.value = "";
  els.timeScopeInput.value = "";
  els.provenanceInput.value = "";
  state.activeStage = "collection";
  saveState();
  render();
}

function inferLayer(text) {
  const lower = text.toLowerCase();
  if (lower.includes("principle") || lower.includes("@p")) return "principle";
  if (lower.includes("theory") || lower.includes("@t") || lower.includes("evidence")) return "theory";
  return "judgment";
}

function applySelectedRepair() {
  const conflict = getSelectedConflict();
  const repair = conflict?.repairs.find((item) => item.id === state.selectedRepairId);
  if (!conflict || !repair) return;

  recordRevision("repair", `${repair.id} applied to ${conflict.id}: ${repair.title}.`, {
    conflictId: conflict.id,
    repairId: repair.id,
  });
  state.activeStage = "action";
  state.activeNav = "replay";

  const revisionStep = pipeline.find((step) => step.title === "Audit Log");
  if (revisionStep) revisionStep.metric = `${state.revisions.length} revisions`;

  saveState();
  renderStages();
  renderPipeline();
  renderRevisionReplay();
  syncNav();
  focusElement(els.revisionReplay);
  els.applyRepairBtn.querySelector("span").textContent = "Repair Applied";
  window.setTimeout(() => {
    els.applyRepairBtn.querySelector("span").textContent = "Apply Repair";
  }, 1400);
}

function exportApi() {
  const payload = {
    schemaVersion: "wre-2.5",
    session: {
      id: "sess_7f2c9e7a",
      created: state.createdAt,
      scope: "AI hiring assistant",
      status: "active",
      privacy: state.privacy,
    },
    schema: {
      claimFields: agentContract.claimFields,
      relationTypes: agentContract.relationTypes,
      conflictKinds: agentContract.conflictKinds,
    },
    beliefs: state.beliefs.map(normalizeBelief),
    conflicts: state.conflicts,
    selectedConflictId: state.selectedConflictId,
    revisions: state.revisions,
    agentContract: buildAgentContractPayload(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "normativity-wre-session.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importApi(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const beliefs = Array.isArray(parsed.beliefs) ? parsed.beliefs : Array.isArray(parsed.claims) ? parsed.claims : [];
      const conflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
      if (!beliefs.length || !conflicts.length) return;
      state = {
        ...createState(),
        beliefs: beliefs.map(normalizeBelief),
        conflicts: conflicts.map(normalizeConflict),
        revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
        privacy: { ...DEFAULT_PRIVACY, ...(parsed.privacy || parsed.session?.privacy || {}) },
        selectedConflictId: parsed.selectedConflictId || conflicts[0]?.id || "C-001",
        viewMode: parsed.viewMode === "graph" ? "graph" : "table",
        workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
      };
      saveState();
      render();
    } catch {
      // Invalid files are ignored so the local session remains intact.
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function resetLocalSession() {
  const confirmed = window.confirm("Reset the local WRE session and restore the sample workspace?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  state = createState();
  render();
}

function updatePrivacyControls() {
  state.privacy = {
    cloudSync: Boolean(els.cloudSyncToggle.checked),
    nliTriage: Boolean(els.llmTriageToggle.checked),
    retention: els.retentionSelect.value || DEFAULT_PRIVACY.retention,
  };
  recordRevision(
    "privacy",
    `Updated privacy controls: ${state.privacy.cloudSync ? "sync eligible" : "local only"}, ${state.privacy.nliTriage ? "NLI triage on" : "NLI triage off"}, ${retentionLabel(state.privacy.retention)} retention.`
  );
  saveState();
  syncPrivacyControls();
  syncStorageStatus();
  renderPipeline();
  renderRevisionReplay();
}

function syncLayerCounts() {
  document.querySelectorAll("[data-filter-layer]").forEach((button) => {
    const layer = button.dataset.filterLayer;
    const count = state.beliefs.filter((belief) => belief.layer === layer).length;
    button.textContent = `View all (${count})`;
  });
}

function showWorkbenchLayer(layer) {
  if (!["judgment", "principle", "theory"].includes(layer)) return;
  state.workbenchFilter = layer;
  state.viewMode = "table";
  state.activeNav = "intake";
  saveState();
  syncNav();
  syncViewMode();
  renderClaimWorkbench();
  focusElement(els.claimWorkbenchPanel);
}

function getVisibleBeliefs() {
  if (state.workbenchFilter === "all") return state.beliefs;
  return state.beliefs.filter((belief) => belief.layer === state.workbenchFilter);
}

function focusWorkflowNav(nav) {
  const targets = {
    intake: document.getElementById("workspace"),
    conflicts: document.querySelector(".conflict-panel"),
    repair: document.querySelector(".detail-panel"),
    replay: els.revisionReplay,
  };
  focusElement(targets[nav]);
}

function focusStage(stageId) {
  const stageTargets = {
    preparation: document.querySelector(".session-card"),
    collection: document.querySelector(".compose-card"),
    integration: document.querySelector(".claim-workbench"),
    reflection: document.querySelector(".conflict-panel"),
    action: els.revisionReplay,
  };
  focusElement(stageTargets[stageId]);
}

function focusElement(element) {
  if (!element) return;
  if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
  element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  element.focus({ preventScroll: true });
}

function recordRevision(type, text, extra = {}) {
  state.revisions.push(
    normalizeRevision({
      time: new Date().toISOString(),
      type,
      text,
      ...extra,
    })
  );
}

function buildAgentContractPayload() {
  return {
    schemaVersion: agentContract.schemaVersion,
    claimFields: agentContract.claimFields,
    relationTypes: agentContract.relationTypes,
    conflictKinds: agentContract.conflictKinds,
    endpoints: agentContract.endpoints.map(([method, path, description]) => ({ method, path, description })),
  };
}

function copyAgentContract() {
  const text = JSON.stringify(buildAgentContractPayload(), null, 2);
  const buttonLabel = els.copyContractBtn.textContent;
  const markCopied = () => {
    els.copyContractBtn.textContent = "Copied";
    window.setTimeout(() => {
      els.copyContractBtn.textContent = buttonLabel;
    }, 1200);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(markCopied).catch(() => exportApi());
    return;
  }

  exportApi();
}

function revisionLabel(type) {
  if (type === "repair") return "Repair applied";
  if (type === "privacy") return "Privacy changed";
  if (type === "claim") return "Claim added";
  return "Session event";
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function updateTokenCount() {
  const tokens = els.beliefText.value.trim().split(/\s+/).filter(Boolean).length;
  els.tokenCount.textContent = `${tokens} token${tokens === 1 ? "" : "s"}`;
}

function insertAtCursor(input, value) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`;
  const next = start + value.length;
  input.setSelectionRange(next, next);
}

function titleCase(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function prefixForLayer(layer) {
  if (layer === "principle") return "P";
  if (layer === "theory") return "T";
  return "J";
}

function nextBeliefId(layer) {
  const prefix = prefixForLayer(layer);
  const max = state?.beliefs
    ? state.beliefs
        .filter((belief) => belief.layer === layer)
        .map((belief) => Number(String(belief.id).replace(/^[A-Z]+/, "")) || 0)
        .reduce((highest, value) => Math.max(highest, value), 0)
    : 0;
  return `${prefix}${max + 1}`;
}

function retentionLabel(value) {
  if (value === "session-only") return "Session only";
  if (value === "30-days") return "30 days";
  return "Until deleted";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function replaceChildren(container, children) {
  container.replaceChildren(...children);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
