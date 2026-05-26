const STORAGE_KEY = "normativity-wre-dashboard-v3";

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
  },
  {
    id: "J2",
    layer: "judgment",
    text: "We may consider experience relevant to the role.",
  },
  {
    id: "J3",
    layer: "judgment",
    text: "Transparency to candidates is required.",
  },
  {
    id: "P1",
    layer: "principle",
    text: "Equal respect and non-discrimination",
  },
  {
    id: "P2",
    layer: "principle",
    text: "Proportionality",
  },
  {
    id: "P3",
    layer: "principle",
    text: "Fair opportunity",
  },
  {
    id: "T1",
    layer: "theory",
    text: "Anti-discrimination law (Title VII)",
  },
  {
    id: "T2",
    layer: "theory",
    text: "Reliability of structured interviews",
  },
  {
    id: "T3",
    layer: "theory",
    text: "Cognitive bias research",
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
  { icon: "cloud", title: "Intake API", subtitle: "Ingest", metric: "142 items" },
  { icon: "sliders", title: "Normalizer", subtitle: "Normalize & Tag", metric: "142 items" },
  { icon: "database", title: "Canonical Store", subtitle: "Store & Index", metric: "142 items" },
  { icon: "graph", title: "Candidate Generator", subtitle: "Generate Candidates", metric: "68 candidates" },
  { icon: "shield", title: "Detectors", subtitle: "Detect Issues", metric: "12 conflicts" },
  { icon: "graph", title: "Conflict Graph", subtitle: "Build Graph", metric: "12 conflicts" },
  { icon: "wrench", title: "Repair Suggestions", subtitle: "Suggest Repairs", metric: "27 suggestions" },
  { icon: "history", title: "Revision History", subtitle: "Track Revisions", metric: "0 revisions" },
];

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
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearComposerBtn: document.getElementById("clearComposerBtn"),
  insertReferenceBtn: document.getElementById("insertReferenceBtn"),
  assistBtn: document.getElementById("assistBtn"),
  applyRepairBtn: document.getElementById("applyRepairBtn"),
  guidanceBtn: document.getElementById("guidanceBtn"),
  editContextBtn: document.getElementById("editContextBtn"),
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
    createdAt: "2025-05-15T10:42:00.000Z",
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.beliefs) || !Array.isArray(parsed.conflicts)) return null;
    return { ...createState(), ...parsed };
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeNav = button.dataset.nav;
      saveState();
      syncNav();
    });
  });

  document.querySelectorAll("[data-add-layer]").forEach((button) => {
    button.addEventListener("click", () => focusComposer(button.dataset.addLayer));
  });

  document.querySelectorAll("[data-filter-layer]").forEach((button) => {
    button.addEventListener("click", () => focusComposer(button.dataset.filterLayer));
  });

  els.beliefText.addEventListener("input", updateTokenCount);

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

  els.guidanceBtn.addEventListener("click", () => {
    insertAtCursor(
      els.beliefText,
      "Balance judgments, principles, and background theories before changing confidence weights. "
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
}

function render() {
  renderStages();
  renderBeliefs();
  renderTabs();
  renderConflicts();
  renderDetail();
  renderPipeline();
  syncNav();
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
      });
      return button;
    })
  );
}

function renderBeliefs() {
  renderBeliefLayer("judgment", els.judgmentList);
  renderBeliefLayer("principle", els.principleList);
  renderBeliefLayer("theory", els.theoryList);
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
        <p>${escapeHtml(belief.text)}</p>
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
        saveState();
        renderConflicts();
        renderDetail();
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
  replaceChildren(
    els.pipelineList,
    pipeline.map((step, index) => {
      const item = document.createElement("article");
      item.className = "pipeline-step";
      const metric = step.title === "Revision History" ? `${revisionCount} revisions` : step.metric;
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

function syncNav() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === state.activeNav);
  });
}

function getCounts() {
  return {
    all: 12,
    critical: 2,
    high: 4,
    medium: 4,
    low: 2,
  };
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

  const layer = inferLayer(text);
  const nextNumber = state.beliefs.filter((belief) => belief.layer === layer).length + 1;
  const prefix = layer === "principle" ? "P" : layer === "theory" ? "T" : "J";
  const belief = {
    id: `${prefix}${nextNumber}`,
    layer,
    text,
  };

  state.beliefs.push(belief);
  state.revisions.push({
    time: new Date().toISOString(),
    text: `Added ${belief.id} to ${labelForLayer(layer).toLowerCase()}.`,
  });
  els.beliefText.value = "";
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

  state.revisions.push({
    time: new Date().toISOString(),
    text: `${repair.id} applied to ${conflict.id}: ${repair.title}.`,
  });
  state.activeStage = "action";
  state.activeNav = "replay";

  const revisionStep = pipeline.find((step) => step.title === "Revision History");
  if (revisionStep) revisionStep.metric = `${state.revisions.length} revisions`;

  saveState();
  renderStages();
  renderPipeline();
  syncNav();
  els.applyRepairBtn.querySelector("span").textContent = "Repair Applied";
  window.setTimeout(() => {
    els.applyRepairBtn.querySelector("span").textContent = "Apply Repair";
  }, 1400);
}

function exportApi() {
  const payload = {
    session: {
      id: "sess_7f2c9e7a",
      created: state.createdAt,
      scope: "AI hiring assistant",
      status: "active",
    },
    beliefs: state.beliefs,
    conflicts: state.conflicts,
    selectedConflictId: state.selectedConflictId,
    revisions: state.revisions,
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
      if (!Array.isArray(parsed.beliefs) || !Array.isArray(parsed.conflicts)) return;
      state = {
        ...createState(),
        beliefs: parsed.beliefs,
        conflicts: parsed.conflicts,
        revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [],
        selectedConflictId: parsed.selectedConflictId || parsed.conflicts[0]?.id || "C-001",
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
