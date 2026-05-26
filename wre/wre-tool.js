const STORAGE_KEY = "normativity-wre-agent-tool-v1";

const stages = [
  {
    id: "preparation",
    label: "Preparation",
    short: "Scope and privacy",
    summary:
      "Scope the belief base before revision: users, source policy, privacy limits, and what counts as an acceptable tension.",
  },
  {
    id: "collection",
    label: "Collection",
    short: "Belief intake",
    summary:
      "Capture judgments, principles, and background assumptions in a typed object with source, scope, confidence, and provenance.",
  },
  {
    id: "integration",
    label: "Integration",
    short: "Candidate detection",
    summary:
      "Use embeddings and NLI for candidate retrieval only, then ask symbolic checks and schema validation to decide what should be reviewed.",
  },
  {
    id: "reflection",
    label: "Reflection",
    short: "Conflict review",
    summary:
      "Inspect the smallest useful conflict set, the linked principle or background theory, and the reason it was flagged.",
  },
  {
    id: "action",
    label: "Action",
    short: "Repair and replay",
    summary:
      "Revise locally, defer, or explicitly accept a stable tension while keeping every step replayable and reversible.",
  },
];

const initialClaims = [
  {
    id: "j-autonomy",
    layer: "judgment",
    text: "I preserve user autonomy whenever feasible.",
    confidence: 82,
    source: "agent policy self-report",
    scope: "general assistance",
    createdAt: "seed",
  },
  {
    id: "j-override",
    layer: "judgment",
    text: "In high-uncertainty safety contexts, I override user choice.",
    confidence: 76,
    source: "agent behavior log",
    scope: "high-stakes tasks",
    createdAt: "seed",
  },
  {
    id: "j-openness",
    layer: "judgment",
    text: "I value open peer critique during research work.",
    confidence: 69,
    source: "human reviewer",
    scope: "research drafts",
    createdAt: "seed",
  },
  {
    id: "p-safety-threshold",
    layer: "principle",
    text: "Safety overrides autonomy only under severe risk with a documented threshold.",
    confidence: 88,
    source: "policy draft",
    scope: "agent control decisions",
    createdAt: "seed",
  },
  {
    id: "p-no-truth-claim",
    layer: "principle",
    text: "The system labels tensions and repair suggestions, not objective moral error.",
    confidence: 93,
    source: "governance rule",
    scope: "all reviews",
    createdAt: "seed",
  },
  {
    id: "p-privacy",
    layer: "principle",
    text: "Sensitive belief stores require access control, deletion, and export support.",
    confidence: 91,
    source: "security baseline",
    scope: "stored beliefs",
    createdAt: "seed",
  },
  {
    id: "b-uncertainty",
    layer: "background",
    text: "Model uncertainty rises when source reliability is low or stakes are high.",
    confidence: 84,
    source: "background reliability model",
    scope: "agent evaluation",
    createdAt: "seed",
  },
  {
    id: "b-coherence",
    layer: "background",
    text: "Coherence management does not guarantee truth.",
    confidence: 95,
    source: "WRE design note",
    scope: "method framing",
    createdAt: "seed",
  },
  {
    id: "b-defensive",
    layer: "background",
    text: "Inconsistency surfacing can trigger defensiveness, so users need control and exits.",
    confidence: 79,
    source: "reflection-support evidence",
    scope: "user experience",
    createdAt: "seed",
  },
];

const initialConflicts = [
  {
    id: "c-autonomy-threshold",
    title: "Autonomy override lacks threshold",
    type: "Missing threshold conflict",
    severity: 84,
    status: "open",
    claimAId: "j-autonomy",
    claimBId: "j-override",
    linkedIds: ["p-safety-threshold", "b-uncertainty"],
    why:
      "The first judgment treats autonomy as the default. The second permits overrides under high uncertainty without the severe-risk threshold required by the linked principle.",
    methods: ["NLI screening", "SHACL scope shape", "Argumentation graph"],
    repairs: [
      "Define severe-risk threshold",
      "Scope autonomy to low-risk cases",
      "Lower confidence in override policy",
      "Accept as monitored tension",
    ],
  },
  {
    id: "c-coherence-truth",
    title: "Coherence could be overclaimed",
    type: "Governance framing risk",
    severity: 58,
    status: "open",
    claimAId: "p-no-truth-claim",
    claimBId: "b-coherence",
    linkedIds: ["b-defensive"],
    why:
      "The method is permitted to surface tensions, but the review copy must not imply that a coherent belief set is thereby true.",
    methods: ["SHACL label validation", "Governance rule"],
    repairs: [
      "Keep tension language",
      "Show provenance before urgency",
      "Require reviewer confirmation",
      "Accept caveat as stable",
    ],
  },
  {
    id: "c-openness-privacy",
    title: "Open critique meets sensitive drafts",
    type: "Scope mismatch",
    severity: 67,
    status: "open",
    claimAId: "j-openness",
    claimBId: "p-privacy",
    linkedIds: ["b-defensive"],
    why:
      "Open peer critique supports reflection, but sensitive belief stores and private drafts need explicit confidentiality scope.",
    methods: ["NLI screening", "PROV source check"],
    repairs: [
      "Add confidentiality scope",
      "Separate public and private drafts",
      "Lower sharing confidence",
      "Defer until policy review",
    ],
  },
];

const initialRevisions = [
  {
    id: "r-seed",
    time: "08:00",
    text: "Seeded WRE workspace with judgments, principles, background theories, and three reviewable tensions.",
  },
];

const els = {
  stageList: document.getElementById("stageList"),
  stageKicker: document.getElementById("stageKicker"),
  stageSummary: document.getElementById("stageSummary"),
  claimCount: document.getElementById("claimCount"),
  conflictCount: document.getElementById("conflictCount"),
  coherenceScore: document.getElementById("coherenceScore"),
  resolvedCount: document.getElementById("resolvedCount"),
  judgmentClaims: document.getElementById("judgmentClaims"),
  principleClaims: document.getElementById("principleClaims"),
  backgroundClaims: document.getElementById("backgroundClaims"),
  conflictQueue: document.getElementById("conflictQueue"),
  queueState: document.getElementById("queueState"),
  detailSeverity: document.getElementById("detailSeverity"),
  detailClaimA: document.getElementById("detailClaimA"),
  detailClaimB: document.getElementById("detailClaimB"),
  detailLinked: document.getElementById("detailLinked"),
  detailWhy: document.getElementById("detailWhy"),
  repairOptions: document.getElementById("repairOptions"),
  revisionTimeline: document.getElementById("revisionTimeline"),
  claimForm: document.getElementById("claimForm"),
  claimText: document.getElementById("claimText"),
  claimLayer: document.getElementById("claimLayer"),
  claimScope: document.getElementById("claimScope"),
  claimSource: document.getElementById("claimSource"),
  claimConfidence: document.getElementById("claimConfidence"),
  confidenceValue: document.getElementById("confidenceValue"),
  composerStatus: document.getElementById("composerStatus"),
  runDetectorsBtn: document.getElementById("runDetectorsBtn"),
  loadScenarioBtn: document.getElementById("loadScenarioBtn"),
  applyRepairBtn: document.getElementById("applyRepairBtn"),
  acceptBtn: document.getElementById("acceptBtn"),
  deferBtn: document.getElementById("deferBtn"),
  resetBtn: document.getElementById("resetBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  sessionStamp: document.getElementById("sessionStamp"),
};

let state = loadState() || createInitialState();

function createInitialState() {
  return {
    activeStage: "preparation",
    selectedConflictId: "c-autonomy-threshold",
    selectedRepair: "Define severe-risk threshold",
    claims: structuredCloneSafe(initialClaims),
    conflicts: structuredCloneSafe(initialConflicts),
    revisions: structuredCloneSafe(initialRevisions),
    createdAt: new Date().toISOString(),
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.claims) || !Array.isArray(parsed.conflicts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app remains usable without persistence.
  }
}

function render() {
  renderStages();
  renderMetrics();
  renderClaims();
  renderQueue();
  renderDetail();
  renderTimeline();
  saveState();
}

function renderStages() {
  const active = stages.find((stage) => stage.id === state.activeStage) || stages[0];
  els.stageKicker.textContent = active.label;
  els.stageSummary.textContent = active.summary;
  els.stageList.textContent = "";

  stages.forEach((stage, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stage-item" + (stage.id === state.activeStage ? " is-active" : "");
    button.dataset.stage = stage.id;

    const number = document.createElement("span");
    number.textContent = String(index + 1);

    const label = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = stage.label;
    const small = document.createElement("small");
    small.textContent = stage.short;
    label.append(strong, small);

    button.append(number, label);
    button.addEventListener("click", () => setStage(stage.id));
    els.stageList.append(button);
  });

  document.querySelectorAll(".top-tab").forEach((button) => {
    const activeByGroup = button.dataset.stage === "preparation" && state.activeStage === "collection";
    button.classList.toggle("is-active", button.dataset.stage === state.activeStage || activeByGroup);
  });
}

function setStage(stageId) {
  state.activeStage = stageId;
  const focusMap = {
    preparation: ".workspace-hero",
    collection: ".composer-panel",
    integration: ".pipeline-panel",
    reflection: ".queue-panel",
    action: ".replay-panel",
  };
  render();
  const selector = focusMap[stageId];
  const target = selector ? document.querySelector(selector) : null;
  if (target && window.matchMedia("(max-width: 940px)").matches) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderMetrics() {
  const openConflicts = state.conflicts.filter((conflict) => conflict.status === "open");
  const resolved = state.conflicts.filter((conflict) => conflict.status === "resolved").length;
  const activeSeverity = openConflicts.reduce((sum, conflict) => sum + conflict.severity, 0);
  const averageSeverity = openConflicts.length ? activeSeverity / openConflicts.length : 0;
  const coherence = Math.max(5, Math.round(100 - averageSeverity * 0.72 - openConflicts.length * 2));

  els.claimCount.textContent = String(state.claims.length);
  els.conflictCount.textContent = String(openConflicts.length);
  els.coherenceScore.textContent = coherence + "%";
  els.resolvedCount.textContent = String(resolved);
  els.queueState.textContent = openConflicts.length + " open";
  els.sessionStamp.textContent = formatSessionDate(state.createdAt);
}

function renderClaims() {
  renderClaimLane("judgment", els.judgmentClaims);
  renderClaimLane("principle", els.principleClaims);
  renderClaimLane("background", els.backgroundClaims);
}

function renderClaimLane(layer, container) {
  container.textContent = "";
  const claims = state.claims.filter((claim) => claim.layer === layer);
  if (!claims.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No claims in this layer.";
    container.append(empty);
    return;
  }

  claims.forEach((claim) => {
    const article = document.createElement("article");
    article.className = "claim-card";

    const text = document.createElement("p");
    text.textContent = claim.text;

    const meta = document.createElement("div");
    meta.className = "claim-meta";

    const source = document.createElement("span");
    source.textContent = claim.source + " / " + claim.scope;

    const confidence = document.createElement("b");
    confidence.className = "confidence-chip";
    confidence.textContent = claim.confidence + "%";

    meta.append(source, confidence);
    article.append(text, meta);
    container.append(article);
  });
}

function renderQueue() {
  els.conflictQueue.textContent = "";
  const conflicts = [...state.conflicts].sort((a, b) => {
    const statusRank = (status) => (status === "open" ? 0 : status === "deferred" ? 1 : status === "accepted" ? 2 : 3);
    return statusRank(a.status) - statusRank(b.status) || b.severity - a.severity;
  });

  if (!conflicts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No conflicts have been detected.";
    els.conflictQueue.append(empty);
    return;
  }

  conflicts.forEach((conflict) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "queue-item";
    if (conflict.id === state.selectedConflictId) button.classList.add("is-active");
    if (conflict.status !== "open") button.classList.add("is-" + conflict.status);

    const titleRow = document.createElement("div");
    titleRow.className = "queue-title-row";
    const title = document.createElement("strong");
    title.textContent = conflict.title;
    const severity = document.createElement("span");
    severity.className = "severity-chip";
    severity.textContent = String(conflict.severity);
    titleRow.append(title, severity);

    const body = document.createElement("p");
    body.textContent = conflict.type;

    const meta = document.createElement("div");
    meta.className = "queue-meta";
    [conflict.status, ...conflict.methods.slice(0, 2)].forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      meta.append(chip);
    });

    button.append(titleRow, body, meta);
    button.addEventListener("click", () => {
      state.selectedConflictId = conflict.id;
      state.selectedRepair = conflict.repairs[0] || "";
      render();
    });
    els.conflictQueue.append(button);
  });
}

function renderDetail() {
  const conflict = getSelectedConflict();
  if (!conflict) {
    els.detailSeverity.textContent = "Severity 0";
    els.detailClaimA.textContent = "No conflict selected.";
    els.detailClaimB.textContent = "";
    els.detailLinked.textContent = "";
    els.detailWhy.textContent = "";
    els.repairOptions.textContent = "";
    els.applyRepairBtn.disabled = true;
    els.acceptBtn.disabled = true;
    els.deferBtn.disabled = true;
    return;
  }

  const claimA = getClaim(conflict.claimAId);
  const claimB = getClaim(conflict.claimBId);
  const linked = conflict.linkedIds.map((id) => getClaim(id)).filter(Boolean);

  els.detailSeverity.textContent = conflict.status === "open" ? "Severity " + conflict.severity : titleCase(conflict.status);
  els.detailClaimA.textContent = claimA ? claimA.text : "Missing claim.";
  els.detailClaimB.textContent = claimB ? claimB.text : "Missing claim.";
  els.detailLinked.textContent = linked.map((claim) => claim.text).join(" ");
  els.detailWhy.textContent = conflict.why;
  els.repairOptions.textContent = "";

  conflict.repairs.forEach((repair) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "repair-chip" + (repair === state.selectedRepair ? " is-active" : "");
    button.textContent = repair;
    button.addEventListener("click", () => {
      state.selectedRepair = repair;
      renderDetail();
    });
    els.repairOptions.append(button);
  });

  els.applyRepairBtn.disabled = false;
  els.acceptBtn.disabled = conflict.status !== "open";
  els.deferBtn.disabled = conflict.status !== "open";
  els.applyRepairBtn.textContent = conflict.status === "open" ? "Apply repair" : "Reopen conflict";
}

function renderTimeline() {
  els.revisionTimeline.textContent = "";
  if (!state.revisions.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No revisions yet.";
    els.revisionTimeline.append(empty);
    return;
  }

  [...state.revisions].reverse().forEach((revision) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    const time = document.createElement("time");
    time.textContent = revision.time;
    const text = document.createElement("p");
    text.textContent = revision.text;
    item.append(time, text);
    els.revisionTimeline.append(item);
  });
}

function getSelectedConflict() {
  let conflict = state.conflicts.find((item) => item.id === state.selectedConflictId);
  if (!conflict) {
    conflict = state.conflicts.find((item) => item.status === "open") || state.conflicts[0] || null;
    state.selectedConflictId = conflict ? conflict.id : "";
  }
  return conflict;
}

function getClaim(id) {
  return state.claims.find((claim) => claim.id === id) || null;
}

function addClaimFromForm(event) {
  event.preventDefault();
  const text = els.claimText.value.trim();
  if (!text) return;

  const claim = {
    id: uniqueId("cl"),
    layer: els.claimLayer.value,
    text,
    confidence: Number(els.claimConfidence.value),
    source: els.claimSource.value.trim() || "manual entry",
    scope: els.claimScope.value.trim() || "workspace",
    createdAt: new Date().toISOString(),
  };

  state.claims.push(claim);
  const generated = generateConflictsForClaim(claim);
  state.conflicts.push(...generated);
  if (generated.length) {
    state.selectedConflictId = generated[0].id;
    state.selectedRepair = generated[0].repairs[0];
  }
  addRevision(
    generated.length
      ? "Added claim and surfaced " + generated.length + " candidate tension."
      : "Added claim to the canonical belief store."
  );

  els.claimText.value = "";
  els.composerStatus.textContent = generated.length
    ? "Candidate tension added to the review queue."
    : "Claim added without a high-severity candidate.";
  state.activeStage = generated.length ? "reflection" : "collection";
  render();
}

function generateConflictsForClaim(claim) {
  const text = normalize(claim.text);
  const conflicts = [];

  if ((text.includes("always") || text.includes("never")) && claim.layer !== "principle") {
    const principle = findClaimByWords(["only", "threshold", "scope"], "principle") || findAnyClaim("principle");
    const background = findAnyClaim("background");
    conflicts.push({
      id: uniqueId("c"),
      title: "Absolute claim needs scope",
      type: "Scope mismatch",
      severity: 63,
      status: "open",
      claimAId: claim.id,
      claimBId: principle ? principle.id : claim.id,
      linkedIds: [principle && principle.id, background && background.id].filter(Boolean),
      why:
        "The new claim uses absolute language. Wide reflective equilibrium treats that as a scope question before treating it as a final rule.",
      methods: ["NLI screening", "SHACL scope shape"],
      repairs: ["Add scope qualifier", "Lower confidence", "Mark as provisional", "Accept as monitored tension"],
    });
  }

  if (text.includes("override") || text.includes("ignore") || text.includes("bypass")) {
    const autonomy = findClaimByWords(["autonomy", "choice"], "judgment") || findAnyClaim("judgment");
    const threshold = findClaimByWords(["severe", "threshold"], "principle") || findAnyClaim("principle");
    conflicts.push({
      id: uniqueId("c"),
      title: "Override policy needs priority rule",
      type: "Missing priority rule",
      severity: 74,
      status: "open",
      claimAId: autonomy ? autonomy.id : claim.id,
      claimBId: claim.id,
      linkedIds: [threshold && threshold.id].filter(Boolean),
      why:
        "The new claim permits an override. The store needs a priority rule that says when that override is allowed and how it is audited.",
      methods: ["NLI screening", "SAT/SMT policy check", "Argumentation graph"],
      repairs: ["Define priority rule", "Add audit condition", "Lower override confidence", "Defer until policy review"],
    });
  }

  if (text.includes("share") && !text.includes("consent") && !text.includes("confidential")) {
    const privacy = findClaimByWords(["privacy", "sensitive", "access"], "principle") || findAnyClaim("principle");
    conflicts.push({
      id: uniqueId("c"),
      title: "Sharing claim lacks consent boundary",
      type: "Privacy tension",
      severity: 69,
      status: "open",
      claimAId: claim.id,
      claimBId: privacy ? privacy.id : claim.id,
      linkedIds: [privacy && privacy.id].filter(Boolean),
      why:
        "The claim points toward disclosure but does not specify consent, access control, deletion, or export conditions.",
      methods: ["SHACL privacy shape", "PROV access check"],
      repairs: ["Add consent boundary", "Limit to anonymized exports", "Restrict workspace access", "Accept caveat as stable"],
    });
  }

  return conflicts;
}

function runDetectors() {
  const openCount = state.conflicts.filter((conflict) => conflict.status === "open").length;
  if (openCount) {
    addRevision("Ran detector pass across " + state.claims.length + " claims and kept " + openCount + " open tensions ranked by severity.");
    els.composerStatus.textContent = "Detector pass complete. Queue ranking refreshed.";
  } else {
    const firstJudgment = findAnyClaim("judgment");
    const firstPrinciple = findAnyClaim("principle");
    if (firstJudgment && firstPrinciple) {
      const conflict = {
        id: uniqueId("c"),
        title: "Low-severity calibration check",
        type: "Confidence coherence",
        severity: 37,
        status: "open",
        claimAId: firstJudgment.id,
        claimBId: firstPrinciple.id,
        linkedIds: [firstPrinciple.id],
        why:
          "The hard checks are quiet, but the confidence layer still asks whether the example-level judgment should be this close to the governing principle.",
        methods: ["LP coherence", "Calibration check"],
        repairs: ["Keep current confidence", "Lower judgment confidence", "Add background model", "Defer"],
      };
      state.conflicts.push(conflict);
      state.selectedConflictId = conflict.id;
      state.selectedRepair = conflict.repairs[0];
      addRevision("Ran detector pass and created a low-severity calibration check.");
    }
  }
  state.activeStage = "integration";
  render();
}

function loadScenario() {
  const additions = [
    {
      id: "j-library-stable",
      layer: "judgment",
      text: "Library X is stable enough for production use.",
      confidence: 73,
      source: "coding-agent task log",
      scope: "dependency choice",
      createdAt: new Date().toISOString(),
    },
    {
      id: "j-type-error",
      layer: "judgment",
      text: "I overrode a type error because tests passed and the patch was urgent.",
      confidence: 66,
      source: "coding-agent task log",
      scope: "urgent patch",
      createdAt: new Date().toISOString(),
    },
    {
      id: "p-type-safety",
      layer: "principle",
      text: "Security and type safety override speed when user data or reliability is at stake.",
      confidence: 87,
      source: "engineering policy",
      scope: "software agents",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b-tests-limited",
      layer: "background",
      text: "Passing tests do not establish security or long-term dependency stability.",
      confidence: 80,
      source: "software reliability model",
      scope: "test evidence",
      createdAt: new Date().toISOString(),
    },
  ];

  additions.forEach((claim) => {
    if (!state.claims.some((existing) => existing.id === claim.id)) {
      state.claims.push(claim);
    }
  });

  const conflict = {
    id: "c-type-safety-tests",
    title: "Tests passed but safety principle still applies",
    type: "Rule/example tension",
    severity: 78,
    status: "open",
    claimAId: "j-type-error",
    claimBId: "p-type-safety",
    linkedIds: ["b-tests-limited", "j-library-stable"],
    why:
      "The example relies on passing tests as sufficient reason to bypass a type error, while the principle treats reliability and safety as stronger than speed in risky contexts.",
    methods: ["NLI screening", "SMT policy check", "PROV task log"],
    repairs: [
      "Add emergency exception threshold",
      "Require reviewer signoff",
      "Lower confidence in test evidence",
      "Retract override judgment",
    ],
  };

  const existing = state.conflicts.find((item) => item.id === conflict.id);
  if (!existing) {
    state.conflicts.push(conflict);
  } else {
    existing.status = "open";
    existing.severity = conflict.severity;
  }

  state.selectedConflictId = conflict.id;
  state.selectedRepair = conflict.repairs[0];
  state.activeStage = "reflection";
  els.composerStatus.textContent = "Coding-agent case loaded.";
  addRevision("Loaded coding-agent case with dependency, type-safety, and test-evidence claims.");
  render();
}

function applyRepair() {
  const conflict = getSelectedConflict();
  if (!conflict) return;

  if (conflict.status !== "open") {
    conflict.status = "open";
    addRevision("Reopened " + conflict.title + " for another review pass.");
    state.activeStage = "reflection";
    render();
    return;
  }

  const repair = state.selectedRepair || conflict.repairs[0] || "Local revision";
  conflict.status = repair.toLowerCase().includes("accept") ? "accepted" : "resolved";
  conflict.resolution = repair;
  conflict.resolvedAt = new Date().toISOString();
  maybeAddRepairClaim(conflict, repair);
  addRevision("Resolved " + conflict.title + " by choosing: " + repair + ".");
  selectNextConflict();
  state.activeStage = "action";
  render();
}

function acceptTension() {
  const conflict = getSelectedConflict();
  if (!conflict || conflict.status !== "open") return;
  conflict.status = "accepted";
  conflict.resolution = "Accepted as stable tension";
  conflict.resolvedAt = new Date().toISOString();
  addRevision("Accepted stable tension: " + conflict.title + ".");
  selectNextConflict();
  state.activeStage = "action";
  render();
}

function deferConflict() {
  const conflict = getSelectedConflict();
  if (!conflict || conflict.status !== "open") return;
  conflict.status = "deferred";
  conflict.resolution = "Deferred for later review";
  conflict.resolvedAt = new Date().toISOString();
  addRevision("Deferred conflict for later review: " + conflict.title + ".");
  selectNextConflict();
  state.activeStage = "action";
  render();
}

function maybeAddRepairClaim(conflict, repair) {
  const lower = repair.toLowerCase();
  let text = "";
  if (lower.includes("threshold") || lower.includes("priority")) {
    text = "Override decisions require an explicit threshold, source record, and post-hoc review before they count as settled.";
  } else if (lower.includes("scope") || lower.includes("confidential")) {
    text = "The repaired claim applies only within the stated scope and remains private unless consent is recorded.";
  } else if (lower.includes("confidence")) {
    text = "The repaired claim keeps its content but lowers confidence until better evidence is attached.";
  } else if (lower.includes("reviewer") || lower.includes("signoff")) {
    text = "High-stakes exceptions require reviewer signoff before the agent treats them as justified.";
  }

  if (!text) return;
  const alreadyExists = state.claims.some((claim) => claim.text === text);
  if (alreadyExists) return;

  state.claims.push({
    id: uniqueId("cl"),
    layer: "principle",
    text,
    confidence: 78,
    source: "repair action: " + conflict.id,
    scope: "local conflict set",
    createdAt: new Date().toISOString(),
  });
}

function selectNextConflict() {
  const next = state.conflicts.find((conflict) => conflict.status === "open");
  if (next) {
    state.selectedConflictId = next.id;
    state.selectedRepair = next.repairs[0] || "";
  }
}

function exportPayload() {
  const payload = {
    schema: "normativity.wre.session.v1",
    exportedAt: new Date().toISOString(),
    summary: {
      claims: state.claims.length,
      conflicts: state.conflicts.length,
      openConflicts: state.conflicts.filter((conflict) => conflict.status === "open").length,
    },
    claims: state.claims,
    conflicts: state.conflicts,
    revisions: state.revisions,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wre-session-export.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  addRevision("Exported API payload with claims, conflicts, and revision history.");
  render();
}

function importPayload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      if (!Array.isArray(payload.claims) || !Array.isArray(payload.conflicts)) {
        throw new Error("Missing claims or conflicts.");
      }
      state = {
        activeStage: "collection",
        selectedConflictId: payload.conflicts[0] ? payload.conflicts[0].id : "",
        selectedRepair: payload.conflicts[0] && payload.conflicts[0].repairs ? payload.conflicts[0].repairs[0] : "",
        claims: payload.claims,
        conflicts: payload.conflicts,
        revisions: Array.isArray(payload.revisions) ? payload.revisions : [],
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      addRevision("Imported WRE session payload.");
      render();
    } catch (error) {
      els.composerStatus.textContent = "Import failed: " + error.message;
    }
  });
  reader.readAsText(file);
}

function resetSession() {
  state = createInitialState();
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function addRevision(text) {
  state.revisions.push({
    id: uniqueId("r"),
    time: formatTime(new Date()),
    text,
  });
}

function findClaimByWords(words, layer) {
  return state.claims.find((claim) => claim.layer === layer && words.some((word) => normalize(claim.text).includes(word))) || null;
}

function findAnyClaim(layer) {
  return state.claims.find((claim) => claim.layer === layer) || null;
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function uniqueId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatSessionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Local session";
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " at " + formatTime(date);
}

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bindEvents() {
  document.querySelectorAll(".top-tab").forEach((button) => {
    button.addEventListener("click", () => setStage(button.dataset.stage));
  });
  els.claimForm.addEventListener("submit", addClaimFromForm);
  els.claimConfidence.addEventListener("input", () => {
    els.confidenceValue.textContent = els.claimConfidence.value + "%";
  });
  els.runDetectorsBtn.addEventListener("click", runDetectors);
  els.loadScenarioBtn.addEventListener("click", loadScenario);
  els.applyRepairBtn.addEventListener("click", applyRepair);
  els.acceptBtn.addEventListener("click", acceptTension);
  els.deferBtn.addEventListener("click", deferConflict);
  els.resetBtn.addEventListener("click", resetSession);
  els.exportBtn.addEventListener("click", exportPayload);
  els.importInput.addEventListener("change", () => importPayload(els.importInput.files[0]));
}

bindEvents();
render();
