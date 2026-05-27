const STORAGE_KEY = "normativity-wre-dashboard-v4";
const INDEXED_DB_NAME = "normativity-wre-local-first";
const INDEXED_DB_VERSION = 1;
const INDEXED_DB_STORE = "sessions";
const INDEXED_DB_SESSION_ID = "sess_7f2c9e7a";
const DEFAULT_PRIVACY = {
  cloudSync: false,
  nliTriage: false,
  retention: "until-deleted",
};

const DEFAULT_SECURITY_CONTROLS = {
  quotaPerHour: 60,
  bodyLimitKb: 256,
  analysisClaimCap: 250,
  nliPairCap: 25,
  monthlyBudgetUsd: 50,
  telemetryMode: "otlp-ready",
  complianceStatus: "mapped",
  syncAuthRequired: true,
  restoreDrillCadence: "monthly",
  dpiaReview: "DPIA-style privacy review mapped before sync or third-party processing.",
  asvsMapping: "OWASP ASVS control map drafted for auth, session handling, uploads, secrets, and logging.",
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

const seedRelations = [
  {
    id: "L-001",
    source: "J1",
    target: "P1",
    type: "supports",
    weight: 0.88,
    rationale: "The judgment is a concrete application of equal respect and non-discrimination.",
  },
  {
    id: "L-002",
    source: "J2",
    target: "P2",
    type: "supports",
    weight: 0.72,
    rationale: "Experience can be relevant when proportionality is constrained by validation evidence.",
  },
  {
    id: "L-003",
    source: "T3",
    target: "P2",
    type: "undercuts",
    weight: 0.74,
    rationale: "Bias research undercuts broad use of experience where it operates as a proxy.",
  },
  {
    id: "L-004",
    source: "J3",
    target: "P3",
    type: "supports",
    weight: 0.76,
    rationale: "Candidate transparency is part of fair opportunity.",
  },
  {
    id: "L-005",
    source: "T1",
    target: "J3",
    type: "depends_on",
    weight: 0.69,
    rationale: "Disclosure duties depend on legal constraints around protected notes and trade secrets.",
  },
];

const seedConstraints = [
  {
    id: "K-001",
    name: "Protected Attribute Proxy Rule",
    language: "rule",
    severity: "critical",
    body:
      "If a selection criterion risks acting as a protected-attribute proxy, require validated and job-related scope before it can support a hiring principle.",
    enabled: true,
  },
  {
    id: "K-002",
    name: "Transparency Boundary Rule",
    language: "smt",
    severity: "high",
    body:
      "Transparency duties and confidentiality duties are jointly satisfiable only when candidate-facing reasons are separated from protected internal notes.",
    enabled: true,
  },
  {
    id: "K-003",
    name: "Fair Opportunity Validation Rule",
    language: "shacl",
    severity: "medium",
    body:
      "Role-fit or experience claims need validation evidence before they can outweigh fair-opportunity principles.",
    enabled: true,
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
  relationFields: ["id", "source", "target", "type", "weight", "rationale"],
  constraintFields: ["id", "name", "language", "body", "severity", "enabled"],
  repairOptionFields: ["id", "conflictId", "actionType", "affectedClaims", "predictedResolutionScore", "disruptionCost", "explanation"],
  exportFormats: ["application/json", "application/ld+json", "text/csv"],
  relationTypes: ["supports", "conflicts", "neutral", "implies", "depends_on", "undercuts"],
  conflictKinds: ["hard", "soft", "nlp"],
  endpoints: [
    ["POST", "/v1/sessions", "Create a local or synced WRE session with explicit privacy mode."],
    ["POST", "/v1/beliefs", "Add or batch import typed judgments, principles, and background theories."],
    ["POST", "/v1/relations", "Add or batch import support, conflict, neutral, implication, dependency, and undercut links."],
    ["POST", "/v1/constraints", "Add rule, SHACL, or SMT templates for deterministic hard-conflict checks."],
    ["POST", "/v1/analyze", "Run rule, SMT, graph, NLI, and probabilistic checks."],
    ["GET", "/v1/conflicts", "Read explanation-first conflict reports."],
    ["POST", "/v1/conflicts/{id}/repair", "Preview or apply a ranked repair option."],
    ["GET", "/v1/export", "Export a portable JSON, JSON-LD, or CSV session archive."],
    ["GET", "/v1/benchmarks/latest", "Read evaluation targets and the latest local analysis run."],
    ["GET", "/v1/calibration-rounds", "Read case-loop calibration and disagreement rounds."],
    ["DELETE", "/v1/sessions/{id}", "Delete a synced or local session record."],
  ],
};

const benchmarkTargets = [
  {
    id: "precisionTop5",
    label: "Conflict precision at top 5",
    target: ">= 0.80",
    value: "0.80",
    copy: "Human-adjudicated review set",
  },
  {
    id: "explanationUsefulness",
    label: "Hard-conflict explanation usefulness",
    target: ">= 4/5",
    value: "4.0",
    copy: "User rating after repair preview",
  },
  {
    id: "repairAcceptance",
    label: "Repair acceptance rate",
    target: ">= 0.35",
    value: "0.35",
    copy: "Accepted or lightly edited repairs",
  },
  {
    id: "ruleLatency",
    label: "Rule-only latency",
    target: "p95 < 1.5s",
    value: "1.5s",
    copy: "Local deterministic checks",
  },
  {
    id: "hybridLatency",
    label: "Hybrid latency",
    target: "p95 < 7s",
    value: "7s",
    copy: "Optional NLI enabled",
  },
  {
    id: "criticalA11y",
    label: "Critical accessibility violations",
    target: "0",
    value: "0",
    copy: "Automated scan plus manual keyboard pass",
  },
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
  repairPreview: document.getElementById("repairPreview"),
  pipelineList: document.getElementById("pipelineList"),
  beliefForm: document.getElementById("beliefForm"),
  beliefText: document.getElementById("beliefText"),
  tokenCount: document.getElementById("tokenCount"),
  storageStatus: document.getElementById("storageStatus"),
  screenReaderSummary: document.getElementById("screenReaderSummary"),
  commandPaletteBtn: document.getElementById("commandPaletteBtn"),
  commandPalette: document.getElementById("commandPalette"),
  commandSearch: document.getElementById("commandSearch"),
  commandList: document.getElementById("commandList"),
  commandStatus: document.getElementById("commandStatus"),
  exportBtn: document.getElementById("exportBtn"),
  exportPrivacyBtn: document.getElementById("exportPrivacyBtn"),
  exportLocalStoreBtn: document.getElementById("exportLocalStoreBtn"),
  deleteLocalDataBtn: document.getElementById("deleteLocalDataBtn"),
  archivePassphraseInput: document.getElementById("archivePassphraseInput"),
  exportEncryptedBtn: document.getElementById("exportEncryptedBtn"),
  encryptedArchiveInput: document.getElementById("encryptedArchiveInput"),
  encryptedArchiveStatus: document.getElementById("encryptedArchiveStatus"),
  importInput: document.getElementById("importInput"),
  resetLocalBtn: document.getElementById("resetLocalBtn"),
  clearComposerBtn: document.getElementById("clearComposerBtn"),
  insertReferenceBtn: document.getElementById("insertReferenceBtn"),
  assistBtn: document.getElementById("assistBtn"),
  applyRepairBtn: document.getElementById("applyRepairBtn"),
  guidanceBtn: document.getElementById("guidanceBtn"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  runEvaluationBtn: document.getElementById("runEvaluationBtn"),
  exportBenchmarkBtn: document.getElementById("exportBenchmarkBtn"),
  exportEvaluationBtn: document.getElementById("exportEvaluationBtn"),
  exportConstraintsBtn: document.getElementById("exportConstraintsBtn"),
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
  exportOpenApiBtn: document.getElementById("exportOpenApiBtn"),
  exportJsonLdBtn: document.getElementById("exportJsonLdBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  revisionReplay: document.getElementById("revisionReplay"),
  revisionList: document.getElementById("revisionList"),
  agentContractPanel: document.getElementById("agentContractPanel"),
  agentContractList: document.getElementById("agentContractList"),
  agentExampleList: document.getElementById("agentExampleList"),
  analysisPanel: document.getElementById("analysisPanel"),
  analysisSummary: document.getElementById("analysisSummary"),
  benchmarkList: document.getElementById("benchmarkList"),
  evaluationList: document.getElementById("evaluationList"),
  constraintForm: document.getElementById("constraintForm"),
  constraintNameInput: document.getElementById("constraintNameInput"),
  constraintLanguageInput: document.getElementById("constraintLanguageInput"),
  constraintSeverityInput: document.getElementById("constraintSeverityInput"),
  constraintBodyInput: document.getElementById("constraintBodyInput"),
  constraintList: document.getElementById("constraintList"),
  dataRightsPanel: document.getElementById("dataRightsPanel"),
  privacyReceiptList: document.getElementById("privacyReceiptList"),
  migrationReportList: document.getElementById("migrationReportList"),
  exportSecurityBtn: document.getElementById("exportSecurityBtn"),
  securityControlsForm: document.getElementById("securityControlsForm"),
  quotaPerHourInput: document.getElementById("quotaPerHourInput"),
  bodyLimitInput: document.getElementById("bodyLimitInput"),
  analysisCapInput: document.getElementById("analysisCapInput"),
  nliCapInput: document.getElementById("nliCapInput"),
  budgetCapInput: document.getElementById("budgetCapInput"),
  telemetryModeInput: document.getElementById("telemetryModeInput"),
  complianceStatusInput: document.getElementById("complianceStatusInput"),
  syncAuthRequiredInput: document.getElementById("syncAuthRequiredInput"),
  securityControlList: document.getElementById("securityControlList"),
  calibrationPanel: document.getElementById("calibrationPanel"),
  calibrationForm: document.getElementById("calibrationForm"),
  casePrincipleInput: document.getElementById("casePrincipleInput"),
  caseIntuitionInput: document.getElementById("caseIntuitionInput"),
  caseVerdictInput: document.getElementById("caseVerdictInput"),
  caseEvidenceInput: document.getElementById("caseEvidenceInput"),
  caseDisagreementInput: document.getElementById("caseDisagreementInput"),
  caseConfidenceInput: document.getElementById("caseConfidenceInput"),
  caseConfidenceOutput: document.getElementById("caseConfidenceOutput"),
  caseUpdatedPrincipleInput: document.getElementById("caseUpdatedPrincipleInput"),
  seedCalibrationBtn: document.getElementById("seedCalibrationBtn"),
  clearCalibrationBtn: document.getElementById("clearCalibrationBtn"),
  exportCalibrationBtn: document.getElementById("exportCalibrationBtn"),
  calibrationCount: document.getElementById("calibrationCount"),
  calibrationList: document.getElementById("calibrationList"),
};

let state = loadState() || createState();
let storageInfo = {
  indexedDb: "pending",
  primary: state.privacy?.retention === "session-only" ? "sessionStorage" : "localStorage",
  fallback: "webStorage",
  lastSavedAt: state.updatedAt || "",
  lastHydratedAt: "",
};
let activeCommandIndex = 0;
let lastCommandFocus = null;

render();
bindEvents();
hydrateIndexedDbState();

function createState() {
  return {
    activeStage: "preparation",
    activeNav: "intake",
    activeTab: "all",
    selectedConflictId: "C-001",
    selectedRepairId: "R-001",
    beliefs: clone(seedBeliefs),
    relations: clone(seedRelations),
    constraints: clone(seedConstraints),
    conflicts: clone(seedConflicts),
    revisions: [],
    analysisRuns: [],
    evaluationRuns: [],
    calibrationRounds: [],
    repairApplications: [],
    migrationReport: null,
    privacy: { ...DEFAULT_PRIVACY },
    securityControls: { ...DEFAULT_SECURITY_CONTROLS },
    viewMode: "table",
    workbenchFilter: "all",
    graphFocusConflictId: "",
    createdAt: "2025-05-15T10:42:00.000Z",
    updatedAt: new Date().toISOString(),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStatePayload(parsed) {
  if (!parsed || !Array.isArray(parsed.beliefs) || !Array.isArray(parsed.conflicts)) return null;
  const beliefs = parsed.beliefs.map(normalizeBelief);
  return {
    ...createState(),
    ...parsed,
    beliefs,
    relations: normalizeRelationSet(parsed.relations, beliefs, parsed.conflicts),
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(normalizeConstraint) : clone(seedConstraints),
    conflicts: parsed.conflicts.map(normalizeConflict),
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
    analysisRuns: Array.isArray(parsed.analysisRuns) ? parsed.analysisRuns.map(normalizeAnalysisRun) : [],
    evaluationRuns: Array.isArray(parsed.evaluationRuns) ? parsed.evaluationRuns.map(normalizeEvaluationRun) : [],
    calibrationRounds: Array.isArray(parsed.calibrationRounds) ? parsed.calibrationRounds.map(normalizeCalibrationRound) : [],
    repairApplications: Array.isArray(parsed.repairApplications) ? parsed.repairApplications.map(normalizeRepairApplication) : [],
    migrationReport: parsed.migrationReport || null,
    privacy: { ...DEFAULT_PRIVACY, ...(parsed.privacy || {}) },
    securityControls: normalizeSecurityControls(parsed.securityControls),
    viewMode: parsed.viewMode === "graph" ? "graph" : "table",
    workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
    graphFocusConflictId: parsed.graphFocusConflictId || "",
    updatedAt: parsed.updatedAt || parsed.savedAt || parsed.createdAt || new Date().toISOString(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeStatePayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(state);
  if (state.privacy?.retention === "session-only") {
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.removeItem(STORAGE_KEY);
    storageInfo.primary = "sessionStorage";
    storageInfo.lastSavedAt = state.updatedAt;
    deleteIndexedDbState().then(() => {
      storageInfo.indexedDb = "session-bypassed";
      syncStorageStatus();
    }).catch(() => {
      storageInfo.indexedDb = "unavailable";
      syncStorageStatus();
    });
    return;
  }
  localStorage.setItem(STORAGE_KEY, serialized);
  sessionStorage.removeItem(STORAGE_KEY);
  storageInfo.primary = storageInfo.indexedDb === "active" ? "IndexedDB" : "localStorage";
  storageInfo.lastSavedAt = state.updatedAt;
  writeIndexedDbState(state).then(() => {
    storageInfo.indexedDb = "active";
    storageInfo.primary = "IndexedDB";
    storageInfo.lastSavedAt = state.updatedAt;
    syncStorageStatus();
  }).catch(() => {
    storageInfo.indexedDb = "unavailable";
    storageInfo.primary = "localStorage";
    syncStorageStatus();
  });
}

async function hydrateIndexedDbState() {
  if (!window.indexedDB || state.privacy?.retention === "session-only") {
    storageInfo.indexedDb = window.indexedDB ? "session-bypassed" : "unavailable";
    storageInfo.primary = state.privacy?.retention === "session-only" ? "sessionStorage" : "localStorage";
    syncStorageStatus();
    renderDataRightsPanel();
    return;
  }

  try {
    const indexedState = await readIndexedDbState();
    const normalized = normalizeStatePayload(indexedState);
    const currentTime = Date.parse(state.updatedAt || state.createdAt || 0) || 0;
    const indexedTime = normalized ? Date.parse(normalized.updatedAt || normalized.createdAt || 0) || 0 : 0;
    if (normalized && indexedTime > currentTime) {
      state = normalized;
      storageInfo.lastHydratedAt = new Date().toISOString();
      storageInfo.lastSavedAt = normalized.updatedAt || "";
      storageInfo.indexedDb = "active";
      storageInfo.primary = "IndexedDB";
      render();
      return;
    }

    await writeIndexedDbState(state);
    storageInfo.indexedDb = "active";
    storageInfo.primary = "IndexedDB";
    storageInfo.lastSavedAt = state.updatedAt || "";
    syncStorageStatus();
    renderDataRightsPanel();
  } catch {
    storageInfo.indexedDb = "unavailable";
    storageInfo.primary = state.privacy?.retention === "session-only" ? "sessionStorage" : "localStorage";
    syncStorageStatus();
    renderDataRightsPanel();
  }
}

function openWreDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) db.createObjectStore(INDEXED_DB_STORE, { keyPath: "id" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function withWreStore(mode, action) {
  return openWreDatabase().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB_STORE, mode);
    const store = transaction.objectStore(INDEXED_DB_STORE);
    const request = action(store);
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
    transaction.addEventListener("complete", () => db.close());
    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error);
    });
  }));
}

function readIndexedDbState() {
  return withWreStore("readonly", (store) => store.get(INDEXED_DB_SESSION_ID)).then((record) => record?.payload || null);
}

function writeIndexedDbState(payload) {
  return withWreStore("readwrite", (store) => store.put({
    id: INDEXED_DB_SESSION_ID,
    savedAt: payload.updatedAt || new Date().toISOString(),
    payload,
  }));
}

function deleteIndexedDbState() {
  if (!window.indexedDB) return Promise.resolve();
  return withWreStore("readwrite", (store) => store.delete(INDEXED_DB_SESSION_ID));
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
    constraintId: conflict.constraintId || "",
    repairs: Array.isArray(conflict.repairs) ? conflict.repairs : [],
    linked: Array.isArray(conflict.linked) ? conflict.linked : [],
  };
}

function normalizeRelation(relation, fallbackIndex = 0) {
  const type = agentContract.relationTypes.includes(relation.type) ? relation.type : "neutral";
  const source = relation.source || relation.source_claim_id || relation.sourceClaimId || relation.from || "";
  const target = relation.target || relation.target_claim_id || relation.targetClaimId || relation.to || "";
  return {
    id: relation.id || relation.relationId || `L-${String(fallbackIndex + 1).padStart(3, "0")}`,
    source,
    target,
    type,
    weight: Number.isFinite(Number(relation.weight)) ? clamp(Number(relation.weight), 0, 1) : 0.5,
    rationale: relation.rationale || relation.reason || "",
  };
}

function normalizeConstraint(constraint, fallbackIndex = 0) {
  const language = ["rule", "smt", "shacl"].includes(constraint.language) ? constraint.language : "rule";
  const severity = severityOrder.includes(constraint.severity) ? constraint.severity : "medium";
  return {
    id: constraint.id || constraint.constraint_id || `K-${String(fallbackIndex + 1).padStart(3, "0")}`,
    name: constraint.name || constraint.title || "Untitled constraint",
    language,
    body: constraint.body || constraint.formula || constraint.description || "",
    severity,
    enabled: constraint.enabled !== false,
    createdAt: constraint.createdAt || constraint.created_at || new Date().toISOString(),
  };
}

function normalizeRelationSet(relations, beliefs, conflicts = []) {
  const beliefIds = new Set((beliefs || []).map((belief) => belief.id));
  const sourceRelations = Array.isArray(relations) && relations.length
    ? relations.map(normalizeRelation)
    : deriveRelationsFromClaimsAndConflicts(beliefs || [], conflicts || []);
  const seen = new Set();
  return sourceRelations.filter((relation) => {
    const key = `${relation.source}:${relation.type}:${relation.target}`;
    if (!beliefIds.has(relation.source) || !beliefIds.has(relation.target) || relation.source === relation.target || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeRevision(revision) {
  return {
    time: revision.time || new Date().toISOString(),
    type: revision.type || "audit",
    text: revision.text || revision.reason || "Session updated.",
    conflictId: revision.conflictId || "",
    repairId: revision.repairId || "",
    affectedClaims: Array.isArray(revision.affectedClaims) ? revision.affectedClaims : [],
    predictedResolutionScore: Number.isFinite(Number(revision.predictedResolutionScore)) ? Number(revision.predictedResolutionScore) : null,
    disruptionCost: Number.isFinite(Number(revision.disruptionCost)) ? Number(revision.disruptionCost) : null,
    beforeSnapshot: revision.beforeSnapshot || null,
    afterSnapshot: revision.afterSnapshot || null,
  };
}

function normalizeRepairApplication(application) {
  return {
    id: application.id || `RA-${Date.now()}`,
    time: application.time || new Date().toISOString(),
    conflictId: application.conflictId || "",
    repairId: application.repairId || "",
    actionType: application.actionType || "scope_boundary",
    affectedClaims: Array.isArray(application.affectedClaims) ? application.affectedClaims : [],
    predictedResolutionScore: Number.isFinite(Number(application.predictedResolutionScore)) ? Number(application.predictedResolutionScore) : 0,
    disruptionCost: Number.isFinite(Number(application.disruptionCost)) ? Number(application.disruptionCost) : 0,
    beforeSnapshot: application.beforeSnapshot || null,
    afterSnapshot: application.afterSnapshot || null,
    explanation: application.explanation || "",
  };
}

function normalizeAnalysisRun(run) {
  return {
    id: run.id || `A-${Date.now()}`,
    time: run.time || new Date().toISOString(),
    claimCount: Number.isFinite(Number(run.claimCount)) ? Number(run.claimCount) : seedBeliefs.length,
    candidatePairs: Number.isFinite(Number(run.candidatePairs)) ? Number(run.candidatePairs) : 0,
    constraintCount: Number.isFinite(Number(run.constraintCount)) ? Number(run.constraintCount) : 0,
    constraintMatches: Number.isFinite(Number(run.constraintMatches)) ? Number(run.constraintMatches) : 0,
    hardCount: Number.isFinite(Number(run.hardCount)) ? Number(run.hardCount) : 0,
    softCount: Number.isFinite(Number(run.softCount)) ? Number(run.softCount) : 0,
    generatedCount: Number.isFinite(Number(run.generatedCount)) ? Number(run.generatedCount) : 0,
    nliQueued: Number.isFinite(Number(run.nliQueued)) ? Number(run.nliQueued) : 0,
    estimatedRuleLatency: Number.isFinite(Number(run.estimatedRuleLatency)) ? Number(run.estimatedRuleLatency) : 0,
    estimatedHybridLatency: Number.isFinite(Number(run.estimatedHybridLatency)) ? Number(run.estimatedHybridLatency) : 0,
    precisionReadiness: Number.isFinite(Number(run.precisionReadiness)) ? Number(run.precisionReadiness) : 0,
    engines: Array.isArray(run.engines) ? run.engines : ["Rule checks", "Argument graph", "Repair ranking"],
    generatedConflictIds: Array.isArray(run.generatedConflictIds) ? run.generatedConflictIds : [],
  };
}

function normalizeEvaluationRun(run) {
  return {
    id: run.id || `E-${Date.now()}`,
    time: run.time || new Date().toISOString(),
    overallStatus: run.overallStatus || "review",
    passed: Number.isFinite(Number(run.passed)) ? Number(run.passed) : 0,
    warning: Number.isFinite(Number(run.warning)) ? Number(run.warning) : 0,
    failed: Number.isFinite(Number(run.failed)) ? Number(run.failed) : 0,
    total: Number.isFinite(Number(run.total)) ? Number(run.total) : 0,
    readinessScore: Number.isFinite(Number(run.readinessScore)) ? Number(run.readinessScore) : 0,
    metrics: Array.isArray(run.metrics) ? run.metrics : [],
    launchReadiness: Array.isArray(run.launchReadiness) ? run.launchReadiness : [],
    evidence: run.evidence || {},
  };
}

function normalizeSecurityControls(controls = {}) {
  const source = { ...DEFAULT_SECURITY_CONTROLS, ...(controls || {}) };
  return {
    quotaPerHour: clampInteger(source.quotaPerHour, 1, 1000, DEFAULT_SECURITY_CONTROLS.quotaPerHour),
    bodyLimitKb: clampInteger(source.bodyLimitKb, 16, 2048, DEFAULT_SECURITY_CONTROLS.bodyLimitKb),
    analysisClaimCap: clampInteger(source.analysisClaimCap, 10, 5000, DEFAULT_SECURITY_CONTROLS.analysisClaimCap),
    nliPairCap: clampInteger(source.nliPairCap, 0, 250, DEFAULT_SECURITY_CONTROLS.nliPairCap),
    monthlyBudgetUsd: clampInteger(source.monthlyBudgetUsd, 0, 500, DEFAULT_SECURITY_CONTROLS.monthlyBudgetUsd),
    telemetryMode: ["off", "local", "otlp-ready"].includes(source.telemetryMode) ? source.telemetryMode : DEFAULT_SECURITY_CONTROLS.telemetryMode,
    complianceStatus: ["draft", "mapped", "launch-ready"].includes(source.complianceStatus) ? source.complianceStatus : DEFAULT_SECURITY_CONTROLS.complianceStatus,
    syncAuthRequired: source.syncAuthRequired !== false,
    restoreDrillCadence: source.restoreDrillCadence || DEFAULT_SECURITY_CONTROLS.restoreDrillCadence,
    dpiaReview: source.dpiaReview || DEFAULT_SECURITY_CONTROLS.dpiaReview,
    asvsMapping: source.asvsMapping || DEFAULT_SECURITY_CONTROLS.asvsMapping,
  };
}

function normalizeCalibrationRound(round) {
  return {
    id: round.id || `Q-${Date.now()}`,
    time: round.time || new Date().toISOString(),
    principle: round.principle || "",
    intuition: round.intuition || "",
    verdict: round.verdict || "",
    evidence: round.evidence || "unclear",
    disagreement: round.disagreement || "none",
    confidence: Number.isFinite(Number(round.confidence)) ? clamp(Number(round.confidence), 1, 100) : 70,
    updatedPrinciple: round.updatedPrinciple || round.updated_principle || "",
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
      setWorkbenchView(button.dataset.viewMode === "graph" ? "graph" : "table");
    });
  });

  document.querySelectorAll("[data-add-layer]").forEach((button) => {
    button.addEventListener("click", () => focusComposer(button.dataset.addLayer));
  });

  document.querySelectorAll("[data-filter-layer]").forEach((button) => {
    button.addEventListener("click", () => showWorkbenchLayer(button.dataset.filterLayer));
  });

  els.commandPaletteBtn.addEventListener("click", openCommandPalette);
  els.commandSearch.addEventListener("input", () => {
    activeCommandIndex = 0;
    renderCommandPalette();
  });
  els.commandSearch.addEventListener("keydown", handleCommandSearchKeydown);
  document.querySelectorAll("[data-close-command]").forEach((element) => {
    element.addEventListener("click", closeCommandPalette);
  });
  document.addEventListener("keydown", handleGlobalKeydown);

  els.beliefText.addEventListener("input", updateTokenCount);
  els.confidenceInput.addEventListener("input", syncConfidenceOutput);
  els.caseConfidenceInput.addEventListener("input", syncCaseConfidenceOutput);

  els.beliefForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addBelief();
  });

  els.calibrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    recordCalibrationRound();
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
  els.analyzeBtn.addEventListener("click", runLocalAnalysis);
  els.runEvaluationBtn.addEventListener("click", runLocalEvaluation);
  els.exportBenchmarkBtn.addEventListener("click", exportBenchmark);
  els.exportEvaluationBtn.addEventListener("click", exportEvaluationReport);
  els.exportConstraintsBtn.addEventListener("click", exportConstraints);
  els.constraintForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addConstraintFromForm();
  });

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
    viewAllConflicts();
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
  els.exportPrivacyBtn.addEventListener("click", exportPrivacyReceipt);
  els.exportLocalStoreBtn.addEventListener("click", exportLocalStoreExtractor);
  els.deleteLocalDataBtn.addEventListener("click", deleteLocalData);
  els.exportSecurityBtn.addEventListener("click", exportSecurityReport);
  els.securityControlsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSecurityControls();
  });
  els.exportEncryptedBtn.addEventListener("click", exportEncryptedArchive);
  els.encryptedArchiveInput.addEventListener("change", importEncryptedArchive);
  els.exportCalibrationBtn.addEventListener("click", exportCalibrationRounds);
  els.importInput.addEventListener("change", importApi);
  els.resetLocalBtn.addEventListener("click", resetLocalSession);

  [els.cloudSyncToggle, els.llmTriageToggle, els.retentionSelect].forEach((control) => {
    control.addEventListener("change", updatePrivacyControls);
  });

  els.reviewLatestBtn.addEventListener("click", () => {
    reviewReplay();
  });

  els.copyContractBtn.addEventListener("click", copyAgentContract);
  els.exportOpenApiBtn.addEventListener("click", exportOpenApiContract);
  els.exportJsonLdBtn.addEventListener("click", exportJsonLd);
  els.exportCsvBtn.addEventListener("click", exportCsvSummary);
  els.seedCalibrationBtn.addEventListener("click", seedCalibrationFromConflict);
  els.clearCalibrationBtn.addEventListener("click", clearCalibrationForm);
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
  renderDataRightsPanel();
  renderAnalysisPanel();
  renderCalibrationPanel();
  renderPipeline();
  renderAccessibleSummary();
  syncNav();
  syncPrivacyControls();
  syncViewMode();
  syncConfidenceOutput();
  syncCaseConfidenceOutput();
  syncStorageStatus();
  updateTokenCount();
}

function openCommandPalette() {
  lastCommandFocus = document.activeElement;
  activeCommandIndex = 0;
  els.commandSearch.value = "";
  els.commandPalette.hidden = false;
  renderCommandPalette();
  window.setTimeout(() => els.commandSearch.focus(), 0);
}

function closeCommandPalette(options = {}) {
  if (els.commandPalette.hidden) return;
  els.commandPalette.hidden = true;
  els.commandSearch.value = "";
  activeCommandIndex = 0;
  if (options.restoreFocus === false) return;
  if (lastCommandFocus && typeof lastCommandFocus.focus === "function") {
    lastCommandFocus.focus();
  } else {
    els.commandPaletteBtn.focus();
  }
}

function renderCommandPalette() {
  const commands = getFilteredCommands();
  activeCommandIndex = clamp(activeCommandIndex, 0, Math.max(commands.length - 1, 0));
  els.commandStatus.textContent = `${commands.length} command${commands.length === 1 ? "" : "s"}`;
  els.commandSearch.setAttribute("aria-activedescendant", commands[activeCommandIndex] ? `command-${commands[activeCommandIndex].id}` : "");

  if (!commands.length) {
    const empty = document.createElement("article");
    empty.className = "command-empty";
    empty.textContent = "No matching commands.";
    replaceChildren(els.commandList, [empty]);
    return;
  }

  replaceChildren(
    els.commandList,
    commands.map((command, index) => {
      const button = document.createElement("button");
      button.id = `command-${command.id}`;
      button.type = "button";
      button.className = `command-option${index === activeCommandIndex ? " is-active" : ""}`;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === activeCommandIndex));
      button.disabled = Boolean(command.disabled);
      button.innerHTML = `
        <span>
          <strong>${escapeHtml(command.label)}</strong>
          <small>${escapeHtml(command.group)}</small>
        </span>
        ${command.disabled ? '<em>Done</em>' : ""}
      `;
      button.addEventListener("mouseenter", () => {
        activeCommandIndex = index;
        renderCommandPalette();
      });
      button.addEventListener("click", () => executeCommand(command));
      return button;
    })
  );
}

function handleCommandSearchKeydown(event) {
  const commands = getFilteredCommands();
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeCommandIndex = commands.length ? (activeCommandIndex + 1) % commands.length : 0;
    renderCommandPalette();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeCommandIndex = commands.length ? (activeCommandIndex - 1 + commands.length) % commands.length : 0;
    renderCommandPalette();
  } else if (event.key === "Home") {
    event.preventDefault();
    activeCommandIndex = 0;
    renderCommandPalette();
  } else if (event.key === "End") {
    event.preventDefault();
    activeCommandIndex = Math.max(commands.length - 1, 0);
    renderCommandPalette();
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (commands[activeCommandIndex]) executeCommand(commands[activeCommandIndex]);
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeCommandPalette();
  }
}

function handleGlobalKeydown(event) {
  const isCommandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (isCommandShortcut) {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (els.commandPalette.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeCommandPalette();
    return;
  }
  if (event.key === "Tab") {
    trapCommandPaletteFocus(event);
  }
}

function trapCommandPaletteFocus(event) {
  const focusable = [...els.commandPalette.querySelectorAll("button:not(:disabled), input:not(:disabled)")].filter((element) => {
    return element && element.offsetParent !== null;
  });
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFilteredCommands() {
  const query = els.commandSearch.value.trim().toLowerCase();
  return getCommandDefinitions().filter((command) => {
    if (!query) return true;
    return `${command.label} ${command.group} ${command.keywords || ""}`.toLowerCase().includes(query);
  });
}

function executeCommand(command) {
  if (!command || command.disabled) return;
  closeCommandPalette({ restoreFocus: false });
  command.run();
  renderAccessibleSummary();
}

function getCommandDefinitions() {
  const selectedConflict = getSelectedConflict();
  const selectedRepairId = state.selectedRepairId || selectedConflict?.repairs[0]?.id || "";
  const repairApplied = selectedConflict?.status === "repaired" && selectedConflict?.appliedRepairId === selectedRepairId;
  return [
    { id: "add-judgment", label: "Add judgment", group: "Intake", keywords: "case claim", run: () => focusComposer("judgment") },
    { id: "add-principle", label: "Add principle", group: "Intake", keywords: "normative claim", run: () => focusComposer("principle") },
    { id: "add-theory", label: "Add background theory", group: "Intake", keywords: "empirical conceptual claim", run: () => focusComposer("theory") },
    { id: "table-view", label: "Table view", group: "Workspace", keywords: "linear claims", run: () => setWorkbenchView("table") },
    { id: "graph-view", label: "Graph view", group: "Workspace", keywords: "relations links", run: () => setWorkbenchView("graph") },
    { id: "all-conflicts", label: "View conflict queue", group: "Conflicts", keywords: "review", run: viewAllConflicts },
    { id: "next-conflict", label: "Next conflict", group: "Conflicts", keywords: "review queue", run: () => selectRelativeConflict(1) },
    { id: "previous-conflict", label: "Previous conflict", group: "Conflicts", keywords: "review queue", run: () => selectRelativeConflict(-1) },
    { id: "repair-detail", label: "View repair detail", group: "Repair", keywords: "simulation preview", run: focusRepairDetail },
    { id: "apply-repair", label: "Apply selected repair", group: "Repair", keywords: "revision", disabled: repairApplied, run: applySelectedRepair },
    { id: "analyze-session", label: "Analyze session", group: "Analysis", keywords: "rule smt nli", run: runLocalAnalysis },
    { id: "run-evaluation", label: "Run local evaluation", group: "Analysis", keywords: "benchmark readiness launch", run: runLocalEvaluation },
    { id: "export-evaluation", label: "Export evaluation report", group: "Export", keywords: "benchmark readiness launch", run: exportEvaluationReport },
    { id: "focus-constraints", label: "Edit constraints", group: "Analysis", keywords: "rule shacl smt hard conflict", run: focusConstraintWorkbench },
    { id: "export-constraints", label: "Export constraints", group: "Export", keywords: "rule shacl smt schema", run: exportConstraints },
    { id: "replay", label: "Review replay", group: "Replay", keywords: "revision audit log", run: reviewReplay },
    { id: "calibration", label: "Open calibration loop", group: "Calibration", keywords: "case disagreement confidence", run: focusCalibrationLoop },
    { id: "export-session", label: "Export session JSON", group: "Export", keywords: "api archive", run: exportApi },
    { id: "export-jsonld", label: "Export JSON-LD graph", group: "Export", keywords: "linked data archive agent", run: exportJsonLd },
    { id: "export-csv", label: "Export CSV summary", group: "Export", keywords: "spreadsheet archive summary", run: exportCsvSummary },
    { id: "export-security", label: "Export security report", group: "Privacy", keywords: "owasp asvs quota abuse dpia", run: exportSecurityReport },
    { id: "export-local-store", label: "Export local store", group: "Privacy", keywords: "indexeddb localstorage migration extractor", run: exportLocalStoreExtractor },
    { id: "security-controls", label: "Open security controls", group: "Privacy", keywords: "quota abuse body size budget", run: focusSecurityControls },
    { id: "encrypted-archive", label: "Focus encrypted archive", group: "Privacy", keywords: "backup sync passphrase", run: focusEncryptedArchive },
    { id: "export-openapi", label: "Export OpenAPI contract", group: "Export", keywords: "agent schema endpoint json", run: exportOpenApiContract },
    { id: "export-accessibility", label: "Export accessibility report", group: "Export", keywords: "wcag keyboard screen reader", run: exportAccessibilityReport },
  ];
}

function renderAccessibleSummary() {
  if (!els.screenReaderSummary) return;
  els.screenReaderSummary.textContent = buildAccessibleSummaryText();
}

function buildAccessibleSummaryText() {
  const selectedConflict = getSelectedConflict();
  const hardCount = state.conflicts.filter((conflict) => conflict.kind === "hard").length;
  const repairedCount = state.conflicts.filter((conflict) => conflict.status === "repaired").length;
  const latestRun = getLatestAnalysisRun();
  const security = buildSecurityReportPayload();
  return [
    `WRE session has ${state.beliefs.length} claims, ${state.relations.length} relations, ${state.constraints.length} constraints, and ${state.conflicts.length} conflicts.`,
    `${hardCount} hard conflicts and ${state.conflicts.length - hardCount} soft tensions are currently tracked.`,
    `${repairedCount} conflicts are marked repaired.`,
    `Security launch gate is ${security.summary.launchGate}.`,
    `Selected conflict ${selectedConflict?.id || "none"}: ${selectedConflict?.title || "none selected"}.`,
    `Workspace view is ${state.viewMode}.`,
    latestRun ? `Latest analysis ${latestRun.id} reviewed ${latestRun.candidatePairs} candidate pairs.` : "No analysis run has been recorded in this session.",
  ].join(" ");
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
          ${conflict.status === "repaired" ? '<span class="repair-status-pill">Repaired</span>' : ""}
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

  renderRepairPreview(conflict);
  syncRepairAction(conflict);
  renderAccessibleSummary();
}

function syncRepairAction(conflict) {
  const alreadyApplied = conflict.status === "repaired" && conflict.appliedRepairId === state.selectedRepairId;
  els.applyRepairBtn.disabled = alreadyApplied;
  els.applyRepairBtn.querySelector("span").textContent = alreadyApplied ? "Repair Applied" : "Apply Repair";
}

function renderRepairPreview(conflict) {
  const repair = conflict.repairs.find((item) => item.id === state.selectedRepairId) || conflict.repairs[0];
  if (!repair) {
    els.repairPreview.textContent = "No repair option selected.";
    return;
  }
  const simulation = buildRepairSimulation(conflict, repair);
  const targetBefore = simulation.beforeSnapshot.claims.find((claim) => claim.id === simulation.targetClaimId);
  const targetAfter = simulation.afterSnapshot.claims.find((claim) => claim.id === simulation.targetClaimId);
  const resolution = `${Math.round(simulation.predictedResolutionScore * 100)}%`;
  const dependencyText = simulation.dependencyImpact
    ? `${simulation.dependencyImpact} graph link${simulation.dependencyImpact === 1 ? "" : "s"} touch affected claims`
    : "No explicit relation links touched";

  els.repairPreview.innerHTML = `
    <div class="repair-preview-metrics">
      <article>
        <span>Action type</span>
        <strong>${escapeHtml(actionTypeLabel(simulation.actionType))}</strong>
      </article>
      <article>
        <span>Predicted resolution</span>
        <strong>${escapeHtml(resolution)}</strong>
      </article>
      <article>
        <span>Disruption cost</span>
        <strong>${escapeHtml(simulation.disruptionCost.toFixed(2))}</strong>
      </article>
    </div>
    <div class="repair-diff">
      <article>
        <span>Before</span>
        <p>${escapeHtml(targetBefore?.text || "No target claim found.")}</p>
      </article>
      <article>
        <span>After</span>
        <p>${escapeHtml(targetAfter?.text || "No target claim found.")}</p>
      </article>
    </div>
    <div class="repair-impact">
      <span>Affected: ${simulation.affectedClaims.map((id) => `<strong>${escapeHtml(id)}</strong>`).join(" ")}</span>
      <small>${escapeHtml(dependencyText)}</small>
      <p>${escapeHtml(simulation.explanation)}</p>
    </div>
  `;
}

function renderPipeline() {
  const revisionCount = state.revisions.length;
  const claimCount = state.beliefs.length;
  const relationCount = state.relations.length;
  const constraintCount = state.constraints.filter((constraint) => constraint.enabled).length;
  const hardCount = state.conflicts.filter((conflict) => conflict.kind === "hard").length;
  const softCount = state.conflicts.length - hardCount;
  const latestRun = getLatestAnalysisRun();
  replaceChildren(
    els.pipelineList,
    pipeline.map((step, index) => {
      const item = document.createElement("article");
      item.className = "pipeline-step";
      let metric = step.metric;
      if (step.title === "Local Store") metric = `${claimCount} claims`;
      if (step.title === "Rule Checks") metric = latestRun ? `${latestRun.constraintMatches} hits` : `${constraintCount} rules`;
      if (step.title === "SMT Core") metric = latestRun ? `${latestRun.generatedCount} new` : "1 core";
      if (step.title === "Argument Graph") metric = latestRun ? `${latestRun.candidatePairs} pairs` : `${relationCount} links`;
      if (step.title === "NLI Triage") metric = state.privacy.nliTriage ? `${latestRun?.nliQueued || softCount} queued` : "off";
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
  children.push(renderRelationEditor());
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
  const visibleRelations = state.relations.filter((relation) => {
    if (state.workbenchFilter === "all") return true;
    return visibleIds.has(relation.source) || visibleIds.has(relation.target);
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
    <div class="graph-relations" aria-label="Claim and conflict relations">
      <h3>Claim Relations</h3>
      ${visibleRelations.length ? visibleRelations.map((relation) => `
        <article class="relation-row relation-row-explicit">
          <span class="relation-type-pill ${escapeHtml(relation.type)}">${escapeHtml(relationTypeLabel(relation.type))}</span>
          <strong>${escapeHtml(relation.source)} → ${escapeHtml(relation.target)}</strong>
          <p>${escapeHtml(relation.rationale || "No rationale recorded.")}</p>
          <small>${escapeHtml(Math.round(relation.weight * 100))}% weight</small>
        </article>
      `).join("") : '<article class="relation-empty">No explicit relations match this filter.</article>'}
      <h3>Conflict Relations</h3>
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
  children.push(renderRelationEditor());
  replaceChildren(els.claimWorkbenchPanel, children);
}

function renderRelationEditor() {
  const section = document.createElement("section");
  section.className = "relation-editor";
  section.setAttribute("aria-labelledby", "relationEditorTitle");
  const sourceId = state.beliefs[0]?.id || "";
  const targetId = state.beliefs[1]?.id || sourceId;
  const relationRows = state.relations.map((relation) => {
    const source = findBelief(relation.source);
    const target = findBelief(relation.target);
    return `
      <article class="relation-editor-row" role="listitem">
        <span class="relation-type-pill ${escapeHtml(relation.type)}">${escapeHtml(relationTypeLabel(relation.type))}</span>
        <span class="relation-editor-copy">
          <strong>${escapeHtml(relation.source)} → ${escapeHtml(relation.target)}</strong>
          <span>${escapeHtml(source?.text || "Missing source claim")} / ${escapeHtml(target?.text || "Missing target claim")}</span>
          <small>${escapeHtml(relation.rationale || "No rationale recorded.")} · ${escapeHtml(Math.round(relation.weight * 100))}% weight</small>
        </span>
        <button class="relation-remove-button" type="button" data-remove-relation="${escapeHtml(relation.id)}" aria-label="Remove relation ${escapeHtml(relation.id)}">Remove</button>
      </article>
    `;
  }).join("");

  section.innerHTML = `
    <div class="relation-editor-head">
      <div>
        <h3 id="relationEditorTitle">Relation Editor</h3>
        <p>Create keyboard-editable support, conflict, neutral, implication, dependency, and undercut links for the agent graph.</p>
      </div>
      <span>${escapeHtml(state.relations.length)} links</span>
    </div>
    <form class="relation-form">
      <label>
        <span>Source claim</span>
        <select name="source" ${state.beliefs.length < 2 ? "disabled" : ""}>${renderBeliefOptions(sourceId)}</select>
      </label>
      <label>
        <span>Relation type</span>
        <select name="type">
          ${agentContract.relationTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(relationTypeLabel(type))}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Target claim</span>
        <select name="target" ${state.beliefs.length < 2 ? "disabled" : ""}>${renderBeliefOptions(targetId)}</select>
      </label>
      <label>
        <span>Weight <output name="weightOutput">65%</output></span>
        <input name="weight" type="range" min="0" max="100" value="65">
      </label>
      <label class="relation-rationale-field">
        <span>Rationale</span>
        <input name="rationale" type="text" placeholder="Why does this link matter?">
      </label>
      <button class="primary-button" type="submit" ${state.beliefs.length < 2 ? "disabled" : ""}>Add Relation</button>
    </form>
    <div class="relation-editor-list" role="list">
      ${relationRows || '<article class="relation-empty" role="listitem">No explicit relations yet. Add at least two claims, then link them here.</article>'}
    </div>
  `;

  const form = section.querySelector(".relation-form");
  const weightInput = form.querySelector("[name='weight']");
  const weightOutput = form.querySelector("[name='weightOutput']");
  weightInput.addEventListener("input", () => {
    weightOutput.textContent = `${weightInput.value}%`;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addRelationFromForm(form);
  });
  section.querySelectorAll("[data-remove-relation]").forEach((button) => {
    button.addEventListener("click", () => removeRelation(button.dataset.removeRelation));
  });
  return section;
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
          ${renderRevisionEvidence(revision)}
          <time datetime="${escapeHtml(revision.time)}">${escapeHtml(formatTime(revision.time))}</time>
        </span>
      `;
      return item;
    })
  );
}

function renderRevisionEvidence(revision) {
  if (!revision.affectedClaims?.length && revision.predictedResolutionScore === null && revision.disruptionCost === null) return "";
  const bits = [];
  if (revision.affectedClaims?.length) bits.push(`Affected ${revision.affectedClaims.join(", ")}`);
  if (revision.predictedResolutionScore !== null) bits.push(`Resolution ${Math.round(revision.predictedResolutionScore * 100)}%`);
  if (revision.disruptionCost !== null) bits.push(`Cost ${Number(revision.disruptionCost).toFixed(2)}`);
  return `<small class="revision-evidence">${escapeHtml(bits.join(" | "))}</small>`;
}

function renderAgentContract() {
  const examples = buildAgentRequestExamples();
  replaceChildren(
    els.agentContractList,
    [
      renderContractGroup("Claim fields", agentContract.claimFields),
      renderContractGroup("Relation fields", agentContract.relationFields),
      renderContractGroup("Constraint fields", agentContract.constraintFields),
      renderContractGroup("Repair option fields", agentContract.repairOptionFields),
      renderContractGroup("Export formats", agentContract.exportFormats),
      renderContractGroup("Local storage", [buildStorageReportPayload().summary]),
      renderContractGroup("Relation types", agentContract.relationTypes),
      renderContractGroup("Conflict kinds", agentContract.conflictKinds),
      renderContractGroup("JSON schemas", Object.keys(buildJsonSchemasPayload().schemas)),
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

  replaceChildren(
    els.agentExampleList,
    examples.map((example) => {
      const item = document.createElement("article");
      item.className = "agent-example";
      item.innerHTML = `
        <div>
          <span>${escapeHtml(example.method)}</span>
          <strong>${escapeHtml(example.path)}</strong>
          <p>${escapeHtml(example.description)}</p>
        </div>
        <pre><code>${escapeHtml(JSON.stringify(example.body, null, 2))}</code></pre>
      `;
      return item;
    })
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

function renderAnalysisPanel() {
  const latest = getLatestAnalysisRun() || buildAnalysisReport({ preview: true });
  const runLabel = getLatestAnalysisRun() ? `Run ${latest.id}` : "Ready to run";
  const summary = [
    ["Claims", latest.claimCount],
    ["Candidate pairs", latest.candidatePairs],
    ["Constraint hits", latest.constraintMatches || 0],
    ["Hard conflicts", latest.hardCount],
    ["Soft tensions", latest.softCount],
    ["NLI queued", latest.nliQueued],
    ["Hybrid p95", `${latest.estimatedHybridLatency}s`],
  ];

  replaceChildren(
    els.analysisSummary,
    summary.map(([label, value]) => {
      const item = document.createElement("article");
      item.className = "analysis-metric";
      item.innerHTML = `
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(runLabel)}</small>
      `;
      return item;
    })
  );

  replaceChildren(
    els.benchmarkList,
    benchmarkTargets.map((target) => {
      const item = document.createElement("article");
      item.className = "benchmark-item";
      item.innerHTML = `
        <span class="benchmark-target">${escapeHtml(target.target)}</span>
        <span>
          <strong>${escapeHtml(target.label)}</strong>
          <small>${escapeHtml(target.copy)}</small>
        </span>
      `;
      return item;
    })
  );

  const evaluation = getLatestEvaluationRun() || buildEvaluationReport({ preview: true });
  const evaluationItems = [
    {
      label: "Launch readiness",
      value: `${Math.round(evaluation.readinessScore * 100)}%`,
      status: evaluation.overallStatus,
      evidence: `${evaluation.passed}/${evaluation.total} checks passing`,
    },
    ...evaluation.metrics,
  ];

  replaceChildren(
    els.evaluationList,
    evaluationItems.map((metric) => {
      const item = document.createElement("article");
      item.className = `evaluation-item is-${String(metric.status).replace(/\s+/g, "-")}`;
      item.innerHTML = `
        <span>${escapeHtml(metric.label)}</span>
        <strong>${escapeHtml(metric.value)}${metric.unit ? escapeHtml(metric.unit) : ""}</strong>
        <small>${escapeHtml(metric.evidence || metric.target || "Ready for local review")}</small>
      `;
      return item;
    })
  );

  renderConstraintWorkbench();
}

function renderConstraintWorkbench() {
  if (!state.constraints.length) {
    const empty = document.createElement("article");
    empty.className = "constraint-empty";
    empty.innerHTML = `
      <strong>No constraints yet</strong>
      <span>Add a rule, SHACL shape, or SMT template to make deterministic checks inspectable.</span>
    `;
    replaceChildren(els.constraintList, [empty]);
    return;
  }

  replaceChildren(
    els.constraintList,
    state.constraints.map((constraint) => {
      const item = document.createElement("article");
      item.className = `constraint-item severity-${constraint.severity}${constraint.enabled ? "" : " is-disabled"}`;
      item.innerHTML = `
        <div>
          <span class="constraint-meta">${escapeHtml(constraint.language.toUpperCase())} · ${escapeHtml(titleCase(constraint.severity))}</span>
          <strong>${escapeHtml(constraint.name)}</strong>
          <p>${escapeHtml(constraint.body)}</p>
        </div>
        <button class="utility-button compact" type="button" data-remove-constraint="${escapeHtml(constraint.id)}">Remove</button>
      `;
      item.querySelector("[data-remove-constraint]").addEventListener("click", () => removeConstraint(constraint.id));
      return item;
    })
  );
}

function renderCalibrationPanel() {
  const rounds = [...state.calibrationRounds].map(normalizeCalibrationRound).reverse();
  els.calibrationCount.textContent = `${state.calibrationRounds.length} round${state.calibrationRounds.length === 1 ? "" : "s"}`;

  if (!rounds.length) {
    const empty = document.createElement("li");
    empty.className = "calibration-empty";
    empty.innerHTML = `
      <strong>No calibration rounds yet</strong>
      <span>Seed from the selected conflict or record a fresh case intuition to track disagreement pressure.</span>
    `;
    replaceChildren(els.calibrationList, [empty]);
    return;
  }

  replaceChildren(
    els.calibrationList,
    rounds.slice(0, 6).map((round) => {
      const item = document.createElement("li");
      item.className = "calibration-item";
      item.innerHTML = `
        <span class="calibration-score">${escapeHtml(round.confidence)}%</span>
        <span class="calibration-copy">
          <strong>${escapeHtml(round.principle || "Untitled principle")}</strong>
          <span>${escapeHtml(evidenceLabel(round.evidence))} · ${escapeHtml(disagreementLabel(round.disagreement))}</span>
          <p>${escapeHtml(round.updatedPrinciple || round.intuition || "No rationale recorded.")}</p>
          <time datetime="${escapeHtml(round.time)}">${escapeHtml(formatTime(round.time))}</time>
        </span>
      `;
      return item;
    })
  );
}

function renderDataRightsPanel() {
  const receipt = buildPrivacyReceiptPayload();
  const migration = state.migrationReport || buildDefaultMigrationReport();
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  syncSecurityControlsForm();
  replaceChildren(
    els.privacyReceiptList,
    [
      ["Storage", receipt.processing.storageMode],
      ["Persistence", storage.summary],
      ["Cloud sync", receipt.processing.cloudSync ? "Opted in" : "Off"],
      ["Model triage", receipt.processing.nliTriage ? "Opted in" : "Off"],
      ["Retention", retentionLabel(receipt.processing.retention)],
      ["Encrypted archive", receipt.processing.encryptedArchive],
      ["API abuse controls", security.summary.abuseResistance],
      ["Sensitive claims", `${receipt.classification.potentiallySensitive} flagged`],
      ["User rights", "Access, export, delete, correction"],
    ].map(([label, value]) => renderReceiptItem(label, value))
  );

  replaceChildren(
    els.migrationReportList,
    [
      ["Status", migration.status],
      ["Mapped claims", String(migration.mappedClaims)],
      ["Mapped relations", String(migration.mappedRelations || 0)],
      ["Mapped constraints", String(migration.mappedConstraints || 0)],
      ["Mapped conflicts", String(migration.mappedConflicts)],
      ["Legacy conflicts", String(migration.legacyUnverified)],
      ["Storage extractor", storage.extractorStatus],
      ["Ambiguous fields", String(migration.ambiguousFields.length)],
      ["Generated", formatTime(migration.generatedAt)],
    ].map(([label, value]) => renderReceiptItem(label, value))
  );

  replaceChildren(
    els.securityControlList,
    [
      ["API quota", `${security.controls.quotaPerHour} requests/hour`],
      ["Body limit", `${security.controls.bodyLimitKb} KB per request`],
      ["Analysis caps", `${security.controls.analysisClaimCap} claims, ${security.controls.nliPairCap} NLI pairs`],
      ["Budget cap", `$${security.controls.monthlyBudgetUsd}/month`],
      ["Sync auth", security.controls.syncAuthRequired ? "Required before sync" : "Not required"],
      ["Compliance", `${security.summary.complianceStatus} (${security.summary.launchGate})`],
      ["Telemetry", security.controls.telemetryMode],
      ["Restore drill", security.controls.restoreDrillCadence],
    ].map(([label, value]) => renderReceiptItem(label, value))
  );
}

function renderReceiptItem(label, value) {
  const item = document.createElement("article");
  item.className = "receipt-item";
  item.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  `;
  return item;
}

function syncSecurityControlsForm() {
  const controls = normalizeSecurityControls(state.securityControls);
  els.quotaPerHourInput.value = controls.quotaPerHour;
  els.bodyLimitInput.value = controls.bodyLimitKb;
  els.analysisCapInput.value = controls.analysisClaimCap;
  els.nliCapInput.value = controls.nliPairCap;
  els.budgetCapInput.value = controls.monthlyBudgetUsd;
  els.telemetryModeInput.value = controls.telemetryMode;
  els.complianceStatusInput.value = controls.complianceStatus;
  els.syncAuthRequiredInput.checked = controls.syncAuthRequired;
}

function runLocalAnalysis() {
  const report = buildAnalysisReport();
  const generatedConflicts = report.generatedConflicts.filter((conflict) => !hasConflictBetween(conflict.claimA, conflict.claimB));
  if (generatedConflicts.length) {
    state.conflicts.push(...generatedConflicts);
    state.selectedConflictId = generatedConflicts[0].id;
    state.selectedRepairId = generatedConflicts[0].repairs[0]?.id || "";
  }

  const run = normalizeAnalysisRun({
    ...report,
    generatedCount: generatedConflicts.length,
    generatedConflictIds: generatedConflicts.map((conflict) => conflict.id),
  });
  state.analysisRuns.push(run);
  state.activeStage = "reflection";
  state.activeNav = "conflicts";
  recordRevision(
    "analysis",
    `${run.id} analyzed ${run.claimCount} claims, ${run.constraintCount} constraints, ${run.candidatePairs} candidate pairs, ${run.hardCount} hard conflicts, and ${run.softCount} soft tensions.`
  );
  saveState();
  render();
  focusElement(els.analysisPanel);

  els.analyzeBtn.querySelector("span").textContent = "Analysis Complete";
  window.setTimeout(() => {
    els.analyzeBtn.querySelector("span").textContent = "Analyze Session";
  }, 1400);
}

function runLocalEvaluation() {
  const report = buildEvaluationReport();
  state.evaluationRuns.push(report);
  recordRevision(
    "evaluation",
    `${report.id} checked ${report.total} WRE launch metrics: ${report.passed} pass, ${report.warning} review, ${report.failed} need evidence.`
  );
  saveState();
  render();
  focusElement(els.analysisPanel);

  const originalLabel = els.runEvaluationBtn.textContent;
  els.runEvaluationBtn.textContent = "Evaluation Saved";
  window.setTimeout(() => {
    els.runEvaluationBtn.textContent = originalLabel;
  }, 1400);
}

function buildAnalysisReport() {
  const claimCount = state.beliefs.length;
  const candidatePairs = getCandidatePairs().length;
  const generatedConflicts = detectCandidateConflicts();
  const constraintMatches = countConstraintMatches();
  const security = buildSecurityReportPayload();
  const hardCount = state.conflicts.filter((conflict) => conflict.kind === "hard").length
    + generatedConflicts.filter((conflict) => conflict.kind === "hard").length;
  const softCount = state.conflicts.filter((conflict) => conflict.kind !== "hard").length
    + generatedConflicts.filter((conflict) => conflict.kind !== "hard").length;
  const nliQueued = state.privacy.nliTriage ? Math.min(candidatePairs, security.controls.nliPairCap) : 0;
  const explanationCoverage = state.conflicts.filter((conflict) => conflict.why && conflict.core?.length && conflict.repairs?.length).length;
  const precisionReadiness = roundNumber(clamp((explanationCoverage + generatedConflicts.length) / Math.max(1, state.conflicts.length + generatedConflicts.length), 0, 1));
  const activeConstraintCount = state.constraints.filter((constraint) => constraint.enabled).length;
  const estimatedRuleLatency = roundNumber(0.12 + claimCount * 0.03 + activeConstraintCount * 0.04 + hardCount * 0.02);
  const estimatedHybridLatency = roundNumber(estimatedRuleLatency + (state.privacy.nliTriage ? nliQueued * 0.18 : 0));

  return {
    id: nextAnalysisRunId(),
    time: new Date().toISOString(),
    claimCount,
    candidatePairs,
    constraintCount: activeConstraintCount,
    constraintMatches,
    hardCount,
    softCount,
    generatedCount: generatedConflicts.length,
    nliQueued,
    estimatedRuleLatency,
    estimatedHybridLatency,
    precisionReadiness,
    engines: [
      "Rule checks",
      "SMT core template",
      "Argument graph",
      state.privacy.nliTriage ? "NLI triage" : "NLI gated off",
      "Probabilistic tension scoring",
      "Repair ranking",
    ],
    generatedConflicts,
    generatedConflictIds: generatedConflicts.map((conflict) => conflict.id),
  };
}

function buildEvaluationReport({ preview = false } = {}) {
  const latestAnalysis = getLatestAnalysisRun() || buildAnalysisReport({ preview: true });
  const explanationReady = state.conflicts.filter((conflict) => conflict.why && conflict.core?.length && conflict.repairs?.length).length;
  const explanationCoverage = explanationReady / Math.max(1, state.conflicts.length);
  const explanationUsefulness = roundNumber(clamp(1 + explanationCoverage * 4, 1, 5));
  const repairedConflicts = state.conflicts.filter((conflict) => conflict.status === "repaired").length;
  const repairAcceptance = roundNumber((repairedConflicts + state.repairApplications.length) / Math.max(1, state.conflicts.length));
  const accessibility = buildAccessibilityReportPayload();
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const criticalA11y = Object.values(accessibility.checks).filter((value) => value === false).length;
  const restoreReady = hasWebCrypto() && Boolean(els.exportEncryptedBtn && els.encryptedArchiveInput);
  const storageReady = storage.indexedDb.primary || state.privacy.retention === "session-only";
  const abuseReadiness = roundNumber([
    security.controls.quotaPerHour > 0,
    security.controls.bodyLimitKb <= 512,
    security.controls.analysisClaimCap <= 1000,
    security.controls.nliPairCap <= 50,
    security.controls.monthlyBudgetUsd <= 100,
  ].filter(Boolean).length / 5);
  const sessionCompletion = roundNumber(clamp(
    (state.beliefs.length ? 0.2 : 0)
      + (state.relations.length ? 0.15 : 0)
      + (state.constraints.length ? 0.1 : 0)
      + (state.conflicts.length ? 0.2 : 0)
      + (state.analysisRuns.length ? 0.15 : 0)
      + (state.revisions.length ? 0.1 : 0)
      + (state.privacy.retention ? 0.1 : 0),
    0,
    1
  ));

  const metrics = [
    buildEvaluationMetric("precisionTop5", "Conflict precision at top 5", latestAnalysis.precisionReadiness, 0.8, ">=", "", "Explanation coverage plus generated conflict evidence."),
    buildEvaluationMetric("explanationUsefulness", "Explanation usefulness", explanationUsefulness, 4, ">=", "/5", `${explanationReady}/${state.conflicts.length} conflicts have why, core, and repair context.`),
    buildEvaluationMetric("repairAcceptance", "Repair acceptance", repairAcceptance, 0.35, ">=", "", `${repairedConflicts} repaired conflicts and ${state.repairApplications.length} recorded applications.`),
    buildEvaluationMetric("ruleLatency", "Rule-only latency", latestAnalysis.estimatedRuleLatency, 1.5, "<", "s", `${latestAnalysis.candidatePairs} candidate pairs in the local deterministic pass.`),
    buildEvaluationMetric("hybridLatency", "Hybrid latency", latestAnalysis.estimatedHybridLatency, 7, "<", "s", `${latestAnalysis.nliQueued} NLI items queued under current privacy settings.`),
    buildEvaluationMetric("apiAbuseResistance", "API abuse resistance", abuseReadiness, 0.8, ">=", "", security.summary.abuseResistance),
    buildEvaluationMetric("localFirstPersistence", "Local-first persistence", storageReady ? 1 : 0.5, 1, ">=", "", storage.summary),
    buildEvaluationMetric("criticalA11y", "Critical accessibility", criticalA11y, 0, "===", "", "Skip link, command palette, graph/table mode, and screen-reader summary are checked."),
  ];
  const launchReadiness = [
    { label: "Session completion", status: sessionCompletion >= 0.75 ? "pass" : "warning", value: sessionCompletion, evidence: "Claims, relations, constraints, conflicts, analysis, revisions, and privacy controls present." },
    { label: "Encrypted archive restore", status: restoreReady ? "pass" : "warning", value: restoreReady ? 1 : 0, evidence: restoreReady ? "AES-GCM archive controls are available." : "Web Crypto or archive controls unavailable in this browser." },
    { label: "Security launch gate", status: security.summary.launchGate === "ready-for-beta" ? "pass" : "warning", value: security.summary.launchGate, evidence: `${security.summary.complianceStatus}; ${security.summary.syncAuth}.` },
    { label: "Local cost control", status: "pass", value: 0, evidence: "Static local evaluation runs without paid model calls." },
  ];
  const allChecks = [...metrics, ...launchReadiness];
  const passed = allChecks.filter((metric) => metric.status === "pass").length;
  const warning = allChecks.filter((metric) => metric.status === "warning").length;
  const failed = allChecks.filter((metric) => metric.status === "fail").length;

  return normalizeEvaluationRun({
    id: preview ? "E-preview" : nextEvaluationRunId(),
    time: new Date().toISOString(),
    overallStatus: failed ? "needs-evidence" : warning ? "review" : "pass",
    passed,
    warning,
    failed,
    total: allChecks.length,
    readinessScore: roundNumber((passed + warning * 0.5) / Math.max(1, allChecks.length)),
    metrics,
    launchReadiness,
    evidence: {
      analysisRunId: latestAnalysis.id,
      claimCount: state.beliefs.length,
      relationCount: state.relations.length,
      constraintCount: state.constraints.length,
      conflictCount: state.conflicts.length,
      repairedConflicts,
      accessibility,
      security,
      storage,
      privacyReceipt: buildPrivacyReceiptPayload(),
    },
  });
}

function buildEvaluationMetric(id, label, value, target, comparator, unit, evidence) {
  const normalizedValue = roundNumber(Number(value));
  const passes = comparator === ">="
    ? normalizedValue >= target
    : comparator === "<"
      ? normalizedValue < target
      : normalizedValue === target;
  const close = comparator === ">="
    ? normalizedValue >= target * 0.8
    : comparator === "<"
      ? normalizedValue < target * 1.25
      : Math.abs(normalizedValue - target) <= 1;
  return {
    id,
    label,
    value: normalizedValue,
    target: `${comparator} ${target}${unit}`,
    unit,
    status: passes ? "pass" : close ? "warning" : "fail",
    evidence,
  };
}

function detectCandidateConflicts() {
  const generated = [];
  const nextNumber = nextConflictNumber();
  for (const { claimA, claimB } of getCandidatePairs()) {
    if (hasConflictBetween(claimA.id, claimB.id)) continue;
    const signal = scoreBeliefPair(claimA, claimB);
    if (!signal) continue;
    generated.push(createGeneratedConflict(claimA, claimB, signal, nextNumber + generated.length));
  }
  return generated.slice(0, 3);
}

function countConstraintMatches() {
  return getCandidatePairs().filter(({ claimA, claimB }) => {
    const joined = `${claimA.text.toLowerCase()} ${claimB.text.toLowerCase()}`;
    return Boolean(scoreConstraintPair(claimA, claimB, joined));
  }).length;
}

function scoreBeliefPair(claimA, claimB) {
  const a = claimA.text.toLowerCase();
  const b = claimB.text.toLowerCase();
  const joined = `${a} ${b}`;
  const overlap = tokenOverlap(a, b);
  const relationContext = getRelationsBetween(claimA.id, claimB.id);
  const constraintSignal = scoreConstraintPair(claimA, claimB, joined);
  if (constraintSignal) return constraintSignal;
  const explicitConflict = relationContext.find((relation) => relation.type === "conflicts" || relation.type === "undercuts");

  if (explicitConflict && explicitConflict.weight >= 0.55) {
    return {
      kind: explicitConflict.type === "conflicts" ? "hard" : "soft",
      severity: explicitConflict.weight >= 0.78 ? "high" : "medium",
      confidence: roundNumber(clamp(explicitConflict.weight, 0.55, 0.95)),
      engine: ["Argument graph", "Rule constraint", "Repair ranking"],
      why: `The explicit ${relationTypeLabel(explicitConflict.type).toLowerCase()} relation between ${claimA.id} and ${claimB.id} is strong enough to require review: ${explicitConflict.rationale}`,
    };
  }

  if (joined.includes("protected attribute") && (joined.includes("reject") || joined.includes("proxy"))) {
    return {
      kind: "hard",
      severity: "high",
      confidence: 0.82,
      engine: ["Rule constraint", "SMT core template", "Repair ranking"],
      why: "Protected-attribute language appears in a candidate exclusion context; this should be treated as a hard rule-check candidate.",
    };
  }

  if (joined.includes("transparen") && (joined.includes("confidential") || joined.includes("trade secret"))) {
    return {
      kind: "soft",
      severity: "medium",
      confidence: 0.76,
      engine: ["Argument graph", "NLI triage", "Human review"],
      why: "Transparency and confidentiality/trade-secret claims appear in the same scope and should be reconciled with a disclosure boundary.",
    };
  }

  if (overlap > 0.42 && claimA.layer !== claimB.layer && Math.abs(claimA.confidence - claimB.confidence) <= 20) {
    return {
      kind: "soft",
      severity: "low",
      confidence: roundNumber(0.58 + overlap * 0.32),
      engine: ["Argument graph", "Probabilistic tension score", "Human review"],
      why: "These claims share enough concepts across WRE layers to deserve a soft-tension review before they are used as mutual support.",
    };
  }

  return null;
}

function scoreConstraintPair(claimA, claimB, joinedText) {
  const activeConstraints = state.constraints.filter((constraint) => constraint.enabled);
  for (const constraint of activeConstraints) {
    const score = constraintMatchScore(constraint, claimA, claimB, joinedText);
    if (!score) continue;
    const hard = constraint.severity === "critical" || constraint.language === "smt";
    return {
      kind: hard ? "hard" : "soft",
      severity: constraint.severity,
      confidence: roundNumber(clamp(score, 0.58, 0.96)),
      constraintId: constraint.id,
      engine: ["Rule constraint", `${constraint.language.toUpperCase()} template`, "Unsat core preview"],
      why: `${constraint.id} ${constraint.name}: ${constraint.body}`,
    };
  }
  return null;
}

function constraintMatchScore(constraint, claimA, claimB, joinedText) {
  const body = constraint.body.toLowerCase();
  const explicitRefs = extractClaimRefs(constraint.body);
  if (explicitRefs.length >= 2) {
    const pair = new Set([claimA.id, claimB.id]);
    const matchingRefs = explicitRefs.filter((id) => pair.has(id)).length;
    if (matchingRefs >= 2) return 0.94;
  }

  if (body.includes("protected") && body.includes("proxy")) {
    if (joinedText.includes("protected") && (joinedText.includes("experience") || joinedText.includes("proxy") || joinedText.includes("bias"))) return 0.88;
  }

  if (body.includes("transparen") && (body.includes("confidential") || body.includes("internal notes"))) {
    if (joinedText.includes("transparen") && (joinedText.includes("confidential") || joinedText.includes("trade secret") || joinedText.includes("proprietary"))) return 0.82;
  }

  if (body.includes("validation") || body.includes("validated")) {
    if ((joinedText.includes("role-fit") || joinedText.includes("experience") || joinedText.includes("structured interview")) && joinedText.includes("fair")) return 0.74;
  }

  const bodyOverlap = tokenOverlap(body, joinedText);
  return bodyOverlap >= 0.28 ? 0.58 + bodyOverlap * 0.24 : 0;
}

function extractClaimRefs(value) {
  return [...String(value || "").matchAll(/\b[JPTB]\d+\b/gi)].map((match) => match[0].toUpperCase());
}

function getCandidatePairs() {
  const pairs = new Map();
  const addPair = (sourceId, targetId, reason) => {
    const claimA = findBelief(sourceId);
    const claimB = findBelief(targetId);
    if (!claimA || !claimB || claimA.id === claimB.id) return;
    const key = [claimA.id, claimB.id].sort().join(":");
    if (!pairs.has(key)) pairs.set(key, { claimA, claimB, reason });
  };

  state.relations.forEach((relation) => addPair(relation.source, relation.target, relation.type));
  state.constraints.forEach((constraint) => {
    const refs = extractClaimRefs(constraint.body);
    for (let i = 0; i < refs.length; i += 1) {
      for (let j = i + 1; j < refs.length; j += 1) addPair(refs[i], refs[j], "constraint-reference");
    }
  });
  state.conflicts.forEach((conflict) => {
    addPair(conflict.claimA, conflict.claimB, "existing-conflict");
    (conflict.core || []).forEach((id) => addPair(conflict.claimA, id, "conflict-core"));
  });

  for (let i = 0; i < state.beliefs.length; i += 1) {
    for (let j = i + 1; j < state.beliefs.length; j += 1) {
      const claimA = state.beliefs[i];
      const claimB = state.beliefs[j];
      const overlap = tokenOverlap(claimA.text.toLowerCase(), claimB.text.toLowerCase());
      if (overlap > 0.32 || claimA.layer !== claimB.layer) addPair(claimA.id, claimB.id, "lexical-or-cross-layer");
    }
  }

  return [...pairs.values()];
}

function getRelationsBetween(claimA, claimB) {
  return state.relations.filter((relation) => {
    return (relation.source === claimA && relation.target === claimB) || (relation.source === claimB && relation.target === claimA);
  });
}

function createGeneratedConflict(claimA, claimB, signal, number) {
  const id = `C-${String(number).padStart(3, "0")}`;
  const repairId = `R-${String(number).padStart(3, "0")}`;
  const constraint = signal.constraintId ? state.constraints.find((item) => item.id === signal.constraintId) : null;
  return normalizeConflict({
    id,
    title: constraint ? `${constraint.name} Violation` : `${claimA.id} / ${claimB.id} Analysis Candidate`,
    severity: signal.severity,
    summary: `${claimA.id} ${signal.kind === "hard" ? "hard-conflicts" : "soft-tensions"} with ${claimB.id}`,
    provenance: `${claimA.id}, ${claimB.id}`,
    time: formatTime(new Date().toISOString()),
    claimA: claimA.id,
    claimB: claimB.id,
    linked: [claimA.id, claimB.id],
    kind: signal.kind,
    confidence: signal.confidence,
    core: [claimA.id, claimB.id],
    engine: signal.engine,
    why: signal.why,
    constraintId: signal.constraintId || "",
    generated: true,
    repairs: [
      {
        id: repairId,
        title: "Add Scope Boundary",
        text: "Clarify scope, confidence, or exception conditions before this pair is used as support.",
        cost: "0.68",
        badge: "Lowest",
        tone: signal.severity === "high" ? "high" : "medium",
      },
    ],
  });
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

function syncCaseConfidenceOutput() {
  els.caseConfidenceOutput.textContent = `${els.caseConfidenceInput.value}%`;
}

function syncStorageStatus() {
  const storageMode = state.privacy.retention === "session-only"
    ? "session"
    : storageInfo.indexedDb === "active"
      ? "indexeddb"
      : "local";
  const syncMode = state.privacy.cloudSync ? "sync ready" : "local-only";
  els.storageStatus.textContent = `${storageLabel(storageMode)} · ${syncMode}`;
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

function addRelationFromForm(form) {
  const data = new FormData(form);
  const source = String(data.get("source") || "");
  const target = String(data.get("target") || "");
  const type = String(data.get("type") || "neutral");
  const weight = Number(data.get("weight") || 65) / 100;
  const rationale = String(data.get("rationale") || "").trim();

  if (!source || !target || source === target) {
    form.querySelector("[name='target']").focus();
    return;
  }

  const existing = state.relations.find((relation) => {
    return relation.source === source && relation.target === target && relation.type === type;
  });
  if (existing) {
    form.querySelector("[name='type']").focus();
    return;
  }

  const relation = normalizeRelation({
    id: nextRelationId(),
    source,
    target,
    type,
    weight,
    rationale: rationale || `${source} ${relationTypeLabel(type).toLowerCase()} ${target}.`,
  });
  state.relations.push(relation);
  state.activeStage = "integration";
  recordRevision("relation", `Added ${relation.id}: ${source} ${relationTypeLabel(type).toLowerCase()} ${target}.`, {
    relationId: relation.id,
  });
  saveState();
  render();
  focusElement(els.claimWorkbenchPanel);
}

function removeRelation(relationId) {
  const relation = state.relations.find((item) => item.id === relationId);
  if (!relation) return;
  state.relations = state.relations.filter((item) => item.id !== relationId);
  recordRevision("relation", `Removed ${relation.id}: ${relation.source} ${relationTypeLabel(relation.type).toLowerCase()} ${relation.target}.`, {
    relationId: relation.id,
  });
  saveState();
  render();
  focusElement(els.claimWorkbenchPanel);
}

function addConstraintFromForm() {
  const data = new FormData(els.constraintForm);
  const constraint = normalizeConstraint({
    id: nextConstraintId(),
    name: String(data.get("name") || "").trim(),
    language: String(data.get("language") || "rule"),
    severity: String(data.get("severity") || "medium"),
    body: String(data.get("body") || "").trim(),
    enabled: true,
  });

  if (!constraint.name || !constraint.body) {
    if (!constraint.name) els.constraintNameInput.focus();
    else els.constraintBodyInput.focus();
    return;
  }

  state.constraints.push(constraint);
  state.activeStage = "integration";
  recordRevision("constraint", `Added ${constraint.id}: ${constraint.name} (${constraint.language.toUpperCase()}).`, {
    constraintId: constraint.id,
  });
  els.constraintForm.reset();
  saveState();
  render();
  focusElement(els.analysisPanel);
}

function removeConstraint(constraintId) {
  const constraint = state.constraints.find((item) => item.id === constraintId);
  if (!constraint) return;
  state.constraints = state.constraints.filter((item) => item.id !== constraintId);
  recordRevision("constraint", `Removed ${constraint.id}: ${constraint.name}.`, {
    constraintId: constraint.id,
  });
  saveState();
  render();
  focusElement(els.analysisPanel);
}

function recordCalibrationRound() {
  const round = normalizeCalibrationRound({
    id: nextCalibrationRoundId(),
    time: new Date().toISOString(),
    principle: els.casePrincipleInput.value.trim(),
    intuition: els.caseIntuitionInput.value.trim(),
    verdict: els.caseVerdictInput.value.trim(),
    evidence: els.caseEvidenceInput.value,
    disagreement: els.caseDisagreementInput.value,
    confidence: Number(els.caseConfidenceInput.value),
    updatedPrinciple: els.caseUpdatedPrincipleInput.value.trim(),
  });

  if (!round.principle || !round.intuition || !round.updatedPrinciple) {
    if (!round.principle) els.casePrincipleInput.focus();
    else if (!round.intuition) els.caseIntuitionInput.focus();
    else els.caseUpdatedPrincipleInput.focus();
    return;
  }

  state.calibrationRounds.push(round);
  state.activeStage = "reflection";
  state.activeNav = "replay";
  recordRevision(
    "calibration",
    `${round.id} recorded ${evidenceLabel(round.evidence).toLowerCase()} with ${disagreementLabel(round.disagreement).toLowerCase()} and ${round.confidence}% confidence.`
  );
  saveState();
  render();
  focusElement(els.calibrationPanel);
}

function seedCalibrationFromConflict() {
  const conflict = getSelectedConflict();
  if (!conflict) return;
  const claimA = findBelief(conflict.claimA);
  const claimB = findBelief(conflict.claimB);
  els.casePrincipleInput.value = claimB?.layer === "principle" ? claimB.text : claimA?.text || conflict.title;
  els.caseIntuitionInput.value = claimA?.text || conflict.summary;
  els.caseVerdictInput.value = conflict.why || conflict.summary;
  els.caseEvidenceInput.value = conflict.kind === "hard" ? "weakens" : "unclear";
  els.caseDisagreementInput.value = conflict.severity === "critical" || conflict.severity === "high" ? "moderate" : "low";
  els.caseConfidenceInput.value = String(Math.round((conflict.confidence || 0.7) * 100));
  els.caseUpdatedPrincipleInput.value = conflict.repairs[0]?.text || "";
  syncCaseConfidenceOutput();
  els.caseUpdatedPrincipleInput.focus();
}

function clearCalibrationForm() {
  [
    els.casePrincipleInput,
    els.caseIntuitionInput,
    els.caseVerdictInput,
    els.caseUpdatedPrincipleInput,
  ].forEach((field) => {
    field.value = "";
  });
  els.caseEvidenceInput.value = "supports";
  els.caseDisagreementInput.value = "none";
  els.caseConfidenceInput.value = "70";
  syncCaseConfidenceOutput();
  els.casePrincipleInput.focus();
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
  if (conflict.status === "repaired" && conflict.appliedRepairId === repair.id) {
    state.activeNav = "replay";
    saveState();
    syncNav();
    focusElement(els.revisionReplay);
    return;
  }
  const simulation = buildRepairSimulation(conflict, repair);
  const targetIndex = state.beliefs.findIndex((belief) => belief.id === simulation.targetClaimId);
  if (targetIndex >= 0) {
    const nextClaim = simulation.afterSnapshot.claims.find((claim) => claim.id === simulation.targetClaimId);
    if (nextClaim) {
      state.beliefs[targetIndex] = {
        ...state.beliefs[targetIndex],
        ...nextClaim,
      };
    }
  }

  const conflictIndex = state.conflicts.findIndex((item) => item.id === conflict.id);
  if (conflictIndex >= 0) {
    state.conflicts[conflictIndex] = {
      ...state.conflicts[conflictIndex],
      status: "repaired",
      appliedRepairId: repair.id,
      repairedAt: new Date().toISOString(),
      repairSummary: simulation.explanation,
    };
  }

  const application = normalizeRepairApplication({
    id: nextRepairApplicationId(),
    time: new Date().toISOString(),
    conflictId: conflict.id,
    repairId: repair.id,
    actionType: simulation.actionType,
    affectedClaims: simulation.affectedClaims,
    predictedResolutionScore: simulation.predictedResolutionScore,
    disruptionCost: simulation.disruptionCost,
    beforeSnapshot: simulation.beforeSnapshot,
    afterSnapshot: simulation.afterSnapshot,
    explanation: simulation.explanation,
  });
  state.repairApplications.push(application);

  recordRevision("repair", `${repair.id} applied to ${conflict.id}: ${repair.title}.`, {
    conflictId: conflict.id,
    repairId: repair.id,
    affectedClaims: simulation.affectedClaims,
    predictedResolutionScore: simulation.predictedResolutionScore,
    disruptionCost: simulation.disruptionCost,
    beforeSnapshot: simulation.beforeSnapshot,
    afterSnapshot: simulation.afterSnapshot,
  });
  state.activeStage = "action";
  state.activeNav = "replay";

  const revisionStep = pipeline.find((step) => step.title === "Audit Log");
  if (revisionStep) revisionStep.metric = `${state.revisions.length} revisions`;

  saveState();
  render();
  focusElement(els.revisionReplay);
  els.applyRepairBtn.querySelector("span").textContent = "Repair Applied";
  window.setTimeout(() => {
    els.applyRepairBtn.querySelector("span").textContent = "Apply Repair";
  }, 1400);
}

function buildRepairSimulation(conflict, repair) {
  const targetClaimId = inferRepairTargetClaimId(conflict, repair);
  const affectedClaims = [...new Set([targetClaimId, ...(conflict.core || []), conflict.claimA, conflict.claimB].filter(Boolean))];
  const beforeSnapshot = buildRepairSnapshot(conflict, affectedClaims);
  const targetClaim = findBelief(targetClaimId);
  const actionType = inferRepairActionType(repair);
  const disruptionCost = Number.isFinite(Number(repair.cost)) ? Number(repair.cost) : 0.75;
  const predictedResolutionScore = roundNumber(clamp(0.96 - disruptionCost * 0.25 + (conflict.kind === "hard" ? 0.03 : 0), 0.42, 0.94));
  const dependencyImpact = state.relations.filter((relation) => {
    return affectedClaims.includes(relation.source) || affectedClaims.includes(relation.target);
  }).length;
  const afterClaims = beforeSnapshot.claims.map((claim) => {
    if (claim.id !== targetClaimId) return claim;
    return buildRepairedClaim(claim, repair, actionType);
  });

  return {
    conflictId: conflict.id,
    repairId: repair.id,
    targetClaimId,
    actionType,
    affectedClaims,
    disruptionCost,
    predictedResolutionScore,
    dependencyImpact,
    beforeSnapshot,
    afterSnapshot: {
      ...beforeSnapshot,
      conflictStatus: "repaired",
      appliedRepairId: repair.id,
      claims: afterClaims,
    },
    explanation: `${repair.title} changes ${targetClaim?.id || targetClaimId} with minimal disruption to ${affectedClaims.length} claim${affectedClaims.length === 1 ? "" : "s"}.`,
  };
}

function buildRepairSnapshot(conflict, affectedClaims) {
  const affectedSet = new Set(affectedClaims);
  return {
    conflict: {
      id: conflict.id,
      title: conflict.title,
      kind: conflict.kind,
      severity: conflict.severity,
      status: conflict.status || "open",
      core: conflict.core || [],
    },
    claims: affectedClaims.map((id) => normalizeBelief(findBelief(id) || { id, text: "", layer: "judgment" })),
    relations: state.relations.filter((relation) => affectedSet.has(relation.source) || affectedSet.has(relation.target)).map(normalizeRelation),
  };
}

function buildRepairedClaim(claim, repair, actionType) {
  const repaired = { ...claim };
  if (actionType === "adjust_confidence") {
    repaired.confidence = clamp(Number(claim.confidence) - 8, 1, 100);
  } else {
    repaired.text = buildRepairedClaimText(claim, repair);
  }
  repaired.provenance = appendAuditNote(claim.provenance, `repaired via ${repair.id}`);
  return repaired;
}

function buildRepairedClaimText(claim, repair) {
  const text = repair.text || "";
  const scopeNote = `Scope note: ${text}`;
  if (claim.text.includes(text) || claim.text.includes(scopeNote)) return claim.text;
  const addConstraint = text.match(/^Add constraint to [A-Z]\d+:\s*(.+)$/i);
  if (addConstraint) {
    const constraint = `Scope constraint: ${addConstraint[1]}`;
    return claim.text.includes(constraint) ? claim.text : `${claim.text} ${constraint}`;
  }
  const refine = text.match(/^Refine [A-Z]\d+ to\s*(.+)$/i);
  if (refine) return refine[1];
  const decrease = text.match(/^Decrease weight of [A-Z]\d+\s*(.+)$/i);
  if (decrease) {
    const weightNote = `Weight note: decrease confidence ${decrease[1]}`;
    return claim.text.includes(weightNote) ? claim.text : `${claim.text} ${weightNote}`;
  }
  return `${claim.text} ${scopeNote}`;
}

function inferRepairTargetClaimId(conflict, repair) {
  const mentioned = String(repair.text || "").match(/\b([JPT]\d+)\b/i)?.[1]?.toUpperCase();
  if (mentioned && findBelief(mentioned)) return mentioned;
  if (repair.title?.toLowerCase().includes("judgment")) return conflict.claimA;
  if (repair.title?.toLowerCase().includes("principle")) return conflict.claimB;
  return conflict.claimB || conflict.claimA || conflict.core?.[0] || state.beliefs[0]?.id || "";
}

function inferRepairActionType(repair) {
  const source = `${repair.title || ""} ${repair.text || ""}`.toLowerCase();
  if (source.includes("reweight") || source.includes("decrease weight")) return "adjust_confidence";
  if (source.includes("refine")) return "refine_claim";
  if (source.includes("separate") || source.includes("split")) return "split_context";
  if (source.includes("constraint") || source.includes("scope") || source.includes("limit")) return "add_scope_constraint";
  return "scope_boundary";
}

function actionTypeLabel(actionType) {
  return titleCase(String(actionType || "scope_boundary").replace(/_/g, " "));
}

function appendAuditNote(value, note) {
  const base = String(value || "User supplied").trim();
  return base.toLowerCase().includes(note.toLowerCase()) ? base : `${base}; ${note}`;
}

function exportApi() {
  downloadJson(buildSessionPayload(), "normativity-wre-session.json");
}

function exportJsonLd() {
  downloadJson(buildJsonLdPayload(), "normativity-wre-session.jsonld", "application/ld+json");
}

function exportCsvSummary() {
  downloadText(buildCsvSummaryPayload(), "normativity-wre-summary.csv", "text/csv;charset=utf-8");
}

async function exportLocalStoreExtractor() {
  let indexedDbPayload = null;
  let indexedDbError = "";
  try {
    indexedDbPayload = await readIndexedDbState();
  } catch (error) {
    indexedDbError = error?.message || "IndexedDB read failed";
  }

  downloadJson(
    {
      schemaVersion: "wre-2.5-local-store-extractor",
      generatedAt: new Date().toISOString(),
      sessionId: INDEXED_DB_SESSION_ID,
      storage: buildStorageReportPayload(),
      indexedDb: {
        available: Boolean(window.indexedDB),
        database: INDEXED_DB_NAME,
        store: INDEXED_DB_STORE,
        hasRecord: Boolean(indexedDbPayload),
        error: indexedDbError,
        payload: indexedDbPayload,
      },
      webStorage: {
        localStorage: readWebStorageSnapshot(localStorage),
        sessionStorage: readWebStorageSnapshot(sessionStorage),
      },
      currentSession: buildSessionPayload(),
    },
    "normativity-wre-local-store-extractor.json"
  );
}

function buildSessionPayload() {
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
      relationFields: agentContract.relationFields,
      constraintFields: agentContract.constraintFields,
      repairOptionFields: agentContract.repairOptionFields,
      exportFormats: agentContract.exportFormats,
      relationTypes: agentContract.relationTypes,
      conflictKinds: agentContract.conflictKinds,
    },
    jsonSchemas: buildJsonSchemasPayload(),
    openApi: buildOpenApiPayload(),
    beliefs: state.beliefs.map(normalizeBelief),
    relations: state.relations.map(normalizeRelation),
    constraints: state.constraints.map(normalizeConstraint),
    conflicts: state.conflicts,
    selectedConflictId: state.selectedConflictId,
    revisions: state.revisions,
    analysisRuns: state.analysisRuns,
    evaluationRuns: state.evaluationRuns,
    calibrationRounds: state.calibrationRounds,
    repairApplications: state.repairApplications,
    securityControls: normalizeSecurityControls(state.securityControls),
    securityReport: buildSecurityReportPayload(),
    storageReport: buildStorageReportPayload(),
    privacyReceipt: buildPrivacyReceiptPayload(),
    accessibilityReport: buildAccessibilityReportPayload(),
    migrationReport: state.migrationReport || buildDefaultMigrationReport(),
    benchmarkTargets,
    agentContract: buildAgentContractPayload(),
  };
  return payload;
}

function buildJsonLdPayload() {
  const sessionId = "sess_7f2c9e7a";
  const sessionNode = `urn:wre:session:${sessionId}`;
  const claimNode = (id) => `urn:wre:claim:${id}`;
  const relationNode = (id) => `urn:wre:relation:${id}`;
  const constraintNode = (id) => `urn:wre:constraint:${id}`;
  const conflictNode = (id) => `urn:wre:conflict:${id}`;
  const revisionNode = (index) => `urn:wre:revision:${sessionId}:${index + 1}`;
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();

  return {
    "@context": {
      wre: "https://normativity.dev/wre#",
      schema: "https://schema.org/",
      id: "@id",
      type: "@type",
      text: "schema:text",
      name: "schema:name",
      created: "schema:dateCreated",
      confidence: "wre:confidence",
      domain: "wre:domain",
      layer: "wre:layer",
      severity: "wre:severity",
      source: { "@id": "wre:source", "@type": "@id" },
      target: { "@id": "wre:target", "@type": "@id" },
      member: { "@id": "wre:member", "@type": "@id" },
      generatedBy: { "@id": "wre:generatedBy", "@type": "@id" },
    },
    "@id": sessionNode,
    "@type": "wre:SessionExport",
    schemaVersion: "wre-2.5-jsonld",
    generatedAt: new Date().toISOString(),
    exportFormats: agentContract.exportFormats,
    "@graph": [
      {
        "@id": sessionNode,
        "@type": "wre:Session",
        name: "AI hiring assistant",
        created: state.createdAt,
        privacyMode: state.privacy.cloudSync ? "local-plus-sync" : "local-first",
        retention: state.privacy.retention,
        apiAbuseResistance: security.summary.abuseResistance,
        persistence: storage.summary,
      },
      {
        "@id": `urn:wre:storage:${sessionId}`,
        "@type": "wre:StorageReport",
        name: storage.summary,
        indexedDbStatus: storage.indexedDb.status,
        localStorageKey: storage.fallback.localStorageKey,
        retention: storage.retention,
        generatedBy: sessionNode,
      },
      {
        "@id": `urn:wre:security:${sessionId}`,
        "@type": "wre:SecurityReport",
        quotaPerHour: security.controls.quotaPerHour,
        bodyLimitKb: security.controls.bodyLimitKb,
        analysisClaimCap: security.controls.analysisClaimCap,
        nliPairCap: security.controls.nliPairCap,
        monthlyBudgetUsd: security.controls.monthlyBudgetUsd,
        complianceStatus: security.summary.complianceStatus,
        launchGate: security.summary.launchGate,
        generatedBy: sessionNode,
      },
      ...state.beliefs.map((belief) => {
        const normalized = normalizeBelief(belief);
        return {
          "@id": claimNode(normalized.id),
          "@type": "wre:Claim",
          claimId: normalized.id,
          layer: normalized.layer,
          domain: normalized.domain,
          confidence: normalized.confidence,
          timeScope: normalized.timeScope,
          provenance: normalized.provenance,
          sensitivity: normalized.sensitivity,
          text: normalized.text,
          generatedBy: sessionNode,
        };
      }),
      ...state.relations.map((relation) => {
        const normalized = normalizeRelation(relation);
        return {
          "@id": relationNode(normalized.id),
          "@type": "wre:Relation",
          relationId: normalized.id,
          relationType: normalized.type,
          weight: normalized.weight,
          source: claimNode(normalized.source),
          target: claimNode(normalized.target),
          rationale: normalized.rationale,
          generatedBy: sessionNode,
        };
      }),
      ...state.constraints.map((constraint) => {
        const normalized = normalizeConstraint(constraint);
        return {
          "@id": constraintNode(normalized.id),
          "@type": "wre:Constraint",
          constraintId: normalized.id,
          name: normalized.name,
          language: normalized.language,
          severity: normalized.severity,
          enabled: normalized.enabled,
          text: normalized.body,
          generatedBy: sessionNode,
        };
      }),
      ...state.conflicts.map((conflict) => ({
        "@id": conflictNode(conflict.id),
        "@type": "wre:Conflict",
        conflictId: conflict.id,
        name: conflict.title,
        severity: conflict.severity,
        kind: conflict.kind,
        confidence: conflict.confidence,
        member: (conflict.core || []).map(claimNode),
        source: conflict.claimA ? claimNode(conflict.claimA) : undefined,
        target: conflict.claimB ? claimNode(conflict.claimB) : undefined,
        explanation: conflict.why,
        constraint: conflict.constraintId ? constraintNode(conflict.constraintId) : undefined,
        generatedBy: sessionNode,
      })),
      ...state.revisions.map((revision, index) => ({
        "@id": revisionNode(index),
        "@type": "wre:RevisionLog",
        revisionType: revision.type,
        text: revision.text,
        created: revision.time,
        conflict: revision.conflictId ? conflictNode(revision.conflictId) : undefined,
        repairId: revision.repairId || undefined,
        generatedBy: sessionNode,
      })),
    ],
  };
}

function buildCsvSummaryPayload() {
  const columns = ["record_type", "id", "label", "kind_or_type", "source", "target", "severity", "confidence", "text", "evidence"];
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const rows = [
    ...state.beliefs.map((belief) => {
      const normalized = normalizeBelief(belief);
      return ["claim", normalized.id, labelForLayer(normalized.layer), normalized.domain, "", "", "", normalized.confidence, normalized.text, `${normalized.timeScope}; ${normalized.provenance}; ${normalized.sensitivity}`];
    }),
    ...state.relations.map((relation) => {
      const normalized = normalizeRelation(relation);
      return ["relation", normalized.id, relationTypeLabel(normalized.type), normalized.type, normalized.source, normalized.target, "", normalized.weight, normalized.rationale, ""];
    }),
    ...state.constraints.map((constraint) => {
      const normalized = normalizeConstraint(constraint);
      return ["constraint", normalized.id, normalized.name, normalized.language, "", "", normalized.severity, normalized.enabled ? 1 : 0, normalized.body, "local deterministic template"];
    }),
    ...state.conflicts.map((conflict) => ["conflict", conflict.id, conflict.title, conflict.kind, conflict.claimA || "", conflict.claimB || "", conflict.severity, conflict.confidence, conflict.why || conflict.summary || "", (conflict.core || []).join(" ")]),
    ["security", "SEC-001", "API abuse resistance", security.summary.abuseResistance, "", "", security.summary.launchGate, security.controls.quotaPerHour, `Body ${security.controls.bodyLimitKb} KB; claims ${security.controls.analysisClaimCap}; NLI ${security.controls.nliPairCap}`, security.summary.complianceStatus],
    ["storage", "STORE-001", "Local-first persistence", storage.summary, "", "", storage.indexedDb.status, storage.indexedDb.primary ? 1 : 0, storage.extractorStatus, storage.lastSavedAt],
    ...state.revisions.map((revision, index) => ["revision", `REV-${index + 1}`, revisionLabel(revision.type), revision.type, revision.conflictId || "", revision.repairId || "", "", "", revision.text, revision.time]),
  ];
  return [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function exportPrivacyReceipt() {
  const payload = buildPrivacyReceiptPayload();
  recordRevision("privacy", "Exported a local privacy receipt for the current WRE session.");
  saveState();
  renderRevisionReplay();
  downloadJson(payload, "normativity-wre-privacy-receipt.json");
}

function exportBenchmark() {
  const latest = getLatestAnalysisRun() || buildAnalysisReport({ preview: true });
  const latestEvaluation = getLatestEvaluationRun() || buildEvaluationReport({ preview: true });
  downloadJson(
    {
      schemaVersion: "wre-2.5-benchmark",
      generatedAt: new Date().toISOString(),
      latestAnalysis: latest,
      latestEvaluation,
      benchmarkTargets,
      notes: "Local benchmark export for precision, explanation, latency, repair acceptance, and accessibility review.",
    },
    "normativity-wre-benchmark.json"
  );
}

function exportEvaluationReport() {
  const payload = getLatestEvaluationRun() || buildEvaluationReport({ preview: true });
  downloadJson(
    {
      schemaVersion: "wre-2.5-evaluation",
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      evaluation: payload,
      benchmarkTargets,
    },
    "normativity-wre-evaluation-report.json"
  );
}

function exportConstraints() {
  downloadJson(
    {
      schemaVersion: "wre-2.5-constraints",
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      constraints: state.constraints.map(normalizeConstraint),
      latestAnalysis: getLatestAnalysisRun() || buildAnalysisReport({ preview: true }),
    },
    "normativity-wre-constraints.json"
  );
}

function exportSecurityReport() {
  downloadJson(buildSecurityReportPayload(), "normativity-wre-security-report.json");
}

function exportAccessibilityReport() {
  downloadJson(buildAccessibilityReportPayload(), "normativity-wre-accessibility-report.json");
}

function exportOpenApiContract() {
  downloadJson(buildOpenApiPayload(), "normativity-wre-openapi.json");
}

async function exportEncryptedArchive() {
  const passphrase = getArchivePassphrase();
  if (!passphrase) return;
  if (!hasWebCrypto()) {
    showEncryptedArchiveStatus("Web Crypto is unavailable in this browser context.", "error");
    return;
  }

  try {
    recordRevision("privacy", "Exported an AES-GCM encrypted WRE session archive.");
    saveState();
    renderRevisionReplay();
    const archive = await encryptSessionPayload(buildSessionPayload(), passphrase);
    downloadJson(archive, "normativity-wre-encrypted-archive.json");
    showEncryptedArchiveStatus("Encrypted archive exported with AES-GCM and PBKDF2.", "success");
  } catch {
    showEncryptedArchiveStatus("Encrypted export failed. Check browser crypto support and try again.", "error");
  }
}

async function importEncryptedArchive(event) {
  const [file] = event.target.files;
  if (!file) return;
  const passphrase = getArchivePassphrase();
  if (!passphrase) {
    event.target.value = "";
    return;
  }
  if (!hasWebCrypto()) {
    showEncryptedArchiveStatus("Web Crypto is unavailable in this browser context.", "error");
    event.target.value = "";
    return;
  }

  try {
    const archive = JSON.parse(await readFileAsText(file));
    const payload = await decryptSessionPayload(archive, passphrase);
    applyImportedPayload(payload);
    recordRevision("privacy", "Imported an AES-GCM encrypted WRE session archive.");
    saveState();
    render();
    showEncryptedArchiveStatus("Encrypted archive imported and rehydrated locally.", "success");
    focusElement(els.dataRightsPanel);
  } catch {
    showEncryptedArchiveStatus("Encrypted import failed. Check the passphrase and archive file.", "error");
  } finally {
    event.target.value = "";
  }
}

function buildSecurityReportPayload() {
  const controls = normalizeSecurityControls(state.securityControls);
  const quotaReady = controls.quotaPerHour > 0 && controls.bodyLimitKb <= 512 && controls.analysisClaimCap <= 1000;
  const nliReady = !state.privacy.nliTriage || controls.nliPairCap <= 50;
  const syncReady = !state.privacy.cloudSync || controls.syncAuthRequired;
  const budgetReady = controls.monthlyBudgetUsd <= 100;
  const mapped = controls.complianceStatus === "mapped" || controls.complianceStatus === "launch-ready";
  const launchGate = quotaReady && nliReady && syncReady && budgetReady && mapped ? "ready-for-beta" : "needs-security-review";

  return {
    schemaVersion: "wre-2.5-security-report",
    generatedAt: new Date().toISOString(),
    sessionId: "sess_7f2c9e7a",
    standards: {
      privacyByDesign: "DPIA-style review before sync, analytics, or third-party LLM processing",
      applicationSecurity: "OWASP ASVS mapping for auth, session handling, secrets, uploads, and logging",
      apiAbuse: "OWASP API Top 10 guardrails for quotas, body-size limits, and execution caps",
      observability: "OpenTelemetry-compatible event vocabulary without mandatory third-party telemetry",
      restoreDrills: `${controls.restoreDrillCadence} encrypted archive restore drill`,
    },
    controls,
    summary: {
      abuseResistance: quotaReady && nliReady ? "quota-gated" : "needs tighter caps",
      complianceStatus: controls.complianceStatus,
      syncAuth: syncReady ? "auth required when sync is enabled" : "sync auth missing",
      budgetStatus: budgetReady ? "within low-cost guardrail" : "budget cap exceeds MVP guardrail",
      launchGate,
    },
    evidence: {
      localFirstDefault: !state.privacy.cloudSync,
      nliOptIn: Boolean(state.privacy.nliTriage),
      encryptedArchiveAvailable: hasWebCrypto(),
      exportDeleteCorrection: true,
      telemetryMode: controls.telemetryMode,
      dpiaReview: controls.dpiaReview,
      asvsMapping: controls.asvsMapping,
    },
  };
}

function buildStorageReportPayload() {
  const sessionOnly = state.privacy.retention === "session-only";
  const indexedActive = storageInfo.indexedDb === "active" && !sessionOnly;
  return {
    schemaVersion: "wre-2.5-storage-report",
    generatedAt: new Date().toISOString(),
    sessionId: INDEXED_DB_SESSION_ID,
    summary: indexedActive ? "IndexedDB primary with webStorage fallback" : sessionOnly ? "Session-only webStorage" : "webStorage fallback",
    extractorStatus: "localStorage/sessionStorage/IndexedDB extractor available",
    indexedDb: {
      database: INDEXED_DB_NAME,
      store: INDEXED_DB_STORE,
      key: INDEXED_DB_SESSION_ID,
      status: storageInfo.indexedDb,
      available: Boolean(window.indexedDB),
      primary: indexedActive,
    },
    fallback: {
      localStorageKey: STORAGE_KEY,
      sessionStorageKey: STORAGE_KEY,
      active: !indexedActive || sessionOnly,
    },
    retention: state.privacy.retention,
    cloudSync: Boolean(state.privacy.cloudSync),
    lastSavedAt: storageInfo.lastSavedAt || state.updatedAt || "",
    lastHydratedAt: storageInfo.lastHydratedAt,
  };
}

function readWebStorageSnapshot(store) {
  try {
    const raw = store.getItem(STORAGE_KEY);
    return {
      hasRecord: Boolean(raw),
      byteLength: raw ? raw.length : 0,
      payload: raw ? JSON.parse(raw) : null,
    };
  } catch (error) {
    return {
      hasRecord: false,
      byteLength: 0,
      error: error?.message || "Storage read failed",
      payload: null,
    };
  }
}

function buildPrivacyReceiptPayload() {
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const sensitivityCounts = state.beliefs.reduce((counts, belief) => {
    const key = belief.sensitivity || "private";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const potentiallySensitive = state.beliefs.filter((belief) => {
    return belief.sensitivity === "private" || belief.domain === "normative" || belief.domain === "meta";
  }).length;

  return {
    schemaVersion: "wre-2.5-privacy-receipt",
    generatedAt: new Date().toISOString(),
    sessionId: "sess_7f2c9e7a",
    classification: {
      beliefContent: "potentially-sensitive philosophical, political, religious, or moral commitments",
      potentiallySensitive,
      sensitivityCounts,
      claimCount: state.beliefs.length,
      relationCount: state.relations.length,
      conflictCount: state.conflicts.length,
      calibrationRounds: state.calibrationRounds.length,
      repairApplications: state.repairApplications.length,
    },
    processing: {
      storageMode: state.privacy.retention === "session-only" ? "sessionStorage" : storage.indexedDb.primary ? "IndexedDB" : "localStorage",
      persistence: storage.summary,
      indexedDbStatus: storage.indexedDb.status,
      retention: state.privacy.retention,
      cloudSync: Boolean(state.privacy.cloudSync),
      nliTriage: Boolean(state.privacy.nliTriage),
      encryptedArchive: hasWebCrypto() ? "AES-GCM available locally" : "unavailable in this browser",
      thirdPartyProcessing: state.privacy.cloudSync || state.privacy.nliTriage ? "opt-in only" : "none selected",
    },
    security: {
      apiAbuseResistance: security.summary.abuseResistance,
      quotaPerHour: security.controls.quotaPerHour,
      bodyLimitKb: security.controls.bodyLimitKb,
      analysisClaimCap: security.controls.analysisClaimCap,
      nliPairCap: security.controls.nliPairCap,
      monthlyBudgetUsd: security.controls.monthlyBudgetUsd,
      complianceStatus: security.summary.complianceStatus,
      launchGate: security.summary.launchGate,
    },
    userRights: {
      access: "Export API or privacy receipt",
      export: "JSON session, JSON-LD graph, CSV summary, benchmark, and calibration exports",
      delete: "Delete Local Data removes WRE local/session storage keys",
      correction: "Edit by importing corrected JSON or adding revised claims/rounds",
    },
  };
}

function buildAccessibilityReportPayload() {
  const commands = getCommandDefinitions();
  return {
    schemaVersion: "wre-2.5-accessibility-report",
    generatedAt: new Date().toISOString(),
    target: "WCAG 2.2 AA",
    sessionId: "sess_7f2c9e7a",
    keyboardWorkflows: commands.map((command) => ({
      id: command.id,
      label: command.label,
      group: command.group,
      enabled: !command.disabled,
    })),
    screenReaderSummary: buildAccessibleSummaryText(),
    checks: {
      skipLink: Boolean(document.querySelector(".skip-link")),
      dualGraphTableMode: Boolean(els.claimWorkbenchPanel && document.querySelector("[data-view-mode='table']") && document.querySelector("[data-view-mode='graph']")),
      keyboardCommandPalette: Boolean(els.commandPalette),
      screenReaderSummaryRegion: Boolean(els.screenReaderSummary),
      textConstraintEditor: Boolean(els.constraintForm && els.constraintList),
      securityControlsForm: Boolean(els.securityControlsForm && els.securityControlList),
      dialogUsesAriaModal: els.commandPalette?.getAttribute("aria-modal") === "true",
      automatedAxeScan: "not-run-in-static-session",
      manualKeyboardPass: "command palette, table/graph switch, conflict navigation, repair focus, and replay focus",
    },
  };
}

function exportCalibrationRounds() {
  downloadJson(
    {
      schemaVersion: "wre-2.5-calibration",
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      calibrationRounds: state.calibrationRounds.map(normalizeCalibrationRound),
      summary: {
        rounds: state.calibrationRounds.length,
        averageConfidence: averageConfidence(state.calibrationRounds),
        highDisagreement: state.calibrationRounds.filter((round) => round.disagreement === "high").length,
      },
    },
    "normativity-wre-calibration-rounds.json"
  );
}

function downloadJson(payload, filename, type = "application/json") {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadText(payload, filename, type) {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function importApi(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      applyImportedPayload(parsed);
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

function applyImportedPayload(parsed) {
  const beliefs = Array.isArray(parsed.beliefs) ? parsed.beliefs : Array.isArray(parsed.claims) ? parsed.claims : [];
  const conflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
  if (!beliefs.length || !conflicts.length) throw new Error("Import requires beliefs and conflicts.");
  const normalizedBeliefs = beliefs.map(normalizeBelief);
  const relations = normalizeRelationSet(parsed.relations, normalizedBeliefs, conflicts);
  const migrationReport = buildMigrationReport(parsed, beliefs, conflicts, relations);
  state = {
    ...createState(),
    beliefs: normalizedBeliefs,
    relations,
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(normalizeConstraint) : clone(seedConstraints),
    conflicts: conflicts.map((conflict) => normalizeImportedConflict(conflict, migrationReport)),
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
    analysisRuns: Array.isArray(parsed.analysisRuns) ? parsed.analysisRuns.map(normalizeAnalysisRun) : [],
    evaluationRuns: Array.isArray(parsed.evaluationRuns) ? parsed.evaluationRuns.map(normalizeEvaluationRun) : [],
    calibrationRounds: Array.isArray(parsed.calibrationRounds) ? parsed.calibrationRounds.map(normalizeCalibrationRound) : [],
    repairApplications: Array.isArray(parsed.repairApplications) ? parsed.repairApplications.map(normalizeRepairApplication) : [],
    migrationReport,
    privacy: { ...DEFAULT_PRIVACY, ...(parsed.privacy || parsed.session?.privacy || {}) },
    securityControls: normalizeSecurityControls(parsed.securityControls || parsed.securityReport?.controls),
    selectedConflictId: parsed.selectedConflictId || conflicts[0]?.id || "C-001",
    viewMode: parsed.viewMode === "graph" ? "graph" : "table",
    workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
  };
}

async function encryptSessionPayload(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveArchiveKey(passphrase, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    schemaVersion: "wre-2.5-encrypted-archive",
    encryptedAt: new Date().toISOString(),
    manifest: {
      exportSchemaVersion: payload.schemaVersion,
      claimCount: payload.beliefs?.length || 0,
      relationCount: payload.relations?.length || 0,
      conflictCount: payload.conflicts?.length || 0,
      localFirst: true,
    },
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 210000,
      salt: arrayBufferToBase64(salt),
    },
    cipher: {
      name: "AES-GCM",
      iv: arrayBufferToBase64(iv),
    },
    payload: arrayBufferToBase64(ciphertext),
  };
}

async function decryptSessionPayload(archive, passphrase) {
  if (archive.schemaVersion !== "wre-2.5-encrypted-archive") throw new Error("Unsupported archive.");
  const salt = base64ToArrayBuffer(archive.kdf?.salt || "");
  const iv = base64ToArrayBuffer(archive.cipher?.iv || "");
  const ciphertext = base64ToArrayBuffer(archive.payload || "");
  const key = await deriveArchiveKey(passphrase, new Uint8Array(salt), archive.kdf?.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

async function deriveArchiveKey(passphrase, salt, iterations = 210000) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function getArchivePassphrase() {
  const passphrase = els.archivePassphraseInput.value;
  if (passphrase.length < 8) {
    showEncryptedArchiveStatus("Enter a passphrase with at least 8 characters.", "error");
    els.archivePassphraseInput.focus();
    return "";
  }
  return passphrase;
}

function hasWebCrypto() {
  return Boolean(window.crypto?.subtle && window.crypto.getRandomValues);
}

function showEncryptedArchiveStatus(message, tone = "default") {
  els.encryptedArchiveStatus.textContent = message;
  els.encryptedArchiveStatus.dataset.tone = tone;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(file);
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToArrayBuffer(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function normalizeImportedConflict(conflict, migrationReport) {
  const normalized = normalizeConflict(conflict);
  if (migrationReport.status !== "native-wre-2.5") {
    normalized.verification = "legacy-unverified";
    normalized.engine = [...new Set([...(normalized.engine || []), "Legacy import review"])];
  }
  return normalized;
}

function buildMigrationReport(parsed, beliefs, conflicts, relations = []) {
  const schemaVersion = parsed.schemaVersion || parsed.version || "legacy/unknown";
  const native = schemaVersion === "wre-2.5";
  const constraints = Array.isArray(parsed.constraints) ? parsed.constraints : seedConstraints;
  const ambiguousFields = [];
  if (!parsed.schemaVersion) ambiguousFields.push("schemaVersion");
  if (Array.isArray(parsed.claims) && !Array.isArray(parsed.beliefs)) ambiguousFields.push("claims mapped to beliefs");
  if (!Array.isArray(parsed.relations)) ambiguousFields.push("relations derived from references/conflicts");
  if (!Array.isArray(parsed.constraints)) ambiguousFields.push("constraints defaulted to local WRE templates");
  if (!parsed.agentContract) ambiguousFields.push("agentContract");
  if (!parsed.session?.privacy && !parsed.privacy) ambiguousFields.push("privacy");
  return {
    generatedAt: new Date().toISOString(),
    sourceSchemaVersion: schemaVersion,
    status: native ? "native-wre-2.5" : "legacy-imported",
    mappedClaims: beliefs.length,
    mappedRelations: relations.length,
    mappedConstraints: constraints.length,
    mappedConflicts: conflicts.length,
    legacyUnverified: native ? 0 : conflicts.length,
    ambiguousFields,
    notes: native
      ? "Imported data already declares WRE 2.5 schema."
      : "Legacy conflicts are marked legacy-unverified until a local analysis run re-checks them.",
  };
}

function buildDefaultMigrationReport() {
  return {
    generatedAt: state.createdAt,
    sourceSchemaVersion: "seed",
    status: "native-seed",
    mappedClaims: state.beliefs.length,
    mappedRelations: state.relations.length,
    mappedConstraints: state.constraints.length,
    mappedConflicts: state.conflicts.length,
    legacyUnverified: state.conflicts.filter((conflict) => conflict.verification === "legacy-unverified").length,
    ambiguousFields: [],
    notes: "Current sample session is already normalized into the local WRE 2.5 model.",
  };
}

function resetLocalSession() {
  const confirmed = window.confirm("Reset the local WRE session and restore the sample workspace?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  deleteIndexedDbState().catch(() => {});
  state = createState();
  storageInfo.indexedDb = window.indexedDB ? "pending" : "unavailable";
  storageInfo.primary = "localStorage";
  storageInfo.lastSavedAt = "";
  storageInfo.lastHydratedAt = "";
  render();
}

function deleteLocalData() {
  const confirmed = window.confirm("Delete local WRE data from this browser and restore the sample workspace?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  deleteIndexedDbState().catch(() => {});
  state = createState();
  storageInfo.indexedDb = window.indexedDB ? "pending" : "unavailable";
  storageInfo.primary = "localStorage";
  storageInfo.lastSavedAt = "";
  storageInfo.lastHydratedAt = "";
  render();
  focusElement(els.dataRightsPanel);
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
  renderDataRightsPanel();
  renderAnalysisPanel();
  renderPipeline();
  renderRevisionReplay();
}

function updateSecurityControls() {
  state.securityControls = normalizeSecurityControls({
    quotaPerHour: els.quotaPerHourInput.value,
    bodyLimitKb: els.bodyLimitInput.value,
    analysisClaimCap: els.analysisCapInput.value,
    nliPairCap: els.nliCapInput.value,
    monthlyBudgetUsd: els.budgetCapInput.value,
    telemetryMode: els.telemetryModeInput.value,
    complianceStatus: els.complianceStatusInput.value,
    syncAuthRequired: els.syncAuthRequiredInput.checked,
  });
  recordRevision(
    "security",
    `Updated API abuse controls: ${state.securityControls.quotaPerHour}/hr quota, ${state.securityControls.bodyLimitKb} KB body cap, ${state.securityControls.analysisClaimCap} claim analysis cap.`
  );
  saveState();
  renderDataRightsPanel();
  renderAnalysisPanel();
  renderRevisionReplay();
  focusElement(els.dataRightsPanel);
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

function setWorkbenchView(mode) {
  state.viewMode = mode === "graph" ? "graph" : "table";
  state.activeStage = "integration";
  saveState();
  syncViewMode();
  renderClaimWorkbench();
  renderAccessibleSummary();
  focusElement(els.claimWorkbenchPanel);
}

function viewAllConflicts() {
  state.activeTab = "all";
  state.activeNav = "conflicts";
  saveState();
  renderTabs();
  renderConflicts();
  renderDetail();
  syncNav();
  focusElement(document.querySelector(".conflict-panel"));
}

function selectRelativeConflict(delta) {
  const conflicts = getFilteredConflicts();
  if (!conflicts.length) return;
  const currentIndex = conflicts.findIndex((conflict) => conflict.id === state.selectedConflictId);
  const nextIndex = (Math.max(currentIndex, 0) + delta + conflicts.length) % conflicts.length;
  const nextConflict = conflicts[nextIndex];
  state.selectedConflictId = nextConflict.id;
  state.selectedRepairId = nextConflict.repairs[0]?.id || "";
  state.activeNav = "conflicts";
  state.graphFocusConflictId = nextConflict.id;
  saveState();
  renderTabs();
  renderConflicts();
  renderDetail();
  renderClaimWorkbench();
  syncNav();
  focusElement(document.querySelector(".detail-panel"));
}

function focusRepairDetail() {
  state.activeNav = "repair";
  saveState();
  syncNav();
  focusElement(document.querySelector(".detail-panel"));
}

function reviewReplay() {
  state.activeNav = "replay";
  saveState();
  syncNav();
  focusElement(els.revisionReplay);
}

function focusCalibrationLoop() {
  state.activeStage = "reflection";
  saveState();
  renderStages();
  focusElement(els.calibrationPanel);
}

function focusConstraintWorkbench() {
  state.activeStage = "integration";
  saveState();
  renderStages();
  focusElement(els.analysisPanel);
  els.constraintNameInput.focus();
}

function focusEncryptedArchive() {
  focusElement(els.dataRightsPanel);
  els.archivePassphraseInput.focus();
}

function focusSecurityControls() {
  focusElement(els.dataRightsPanel);
  els.quotaPerHourInput.focus();
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
    relationFields: agentContract.relationFields,
    constraintFields: agentContract.constraintFields,
    repairOptionFields: agentContract.repairOptionFields,
    exportFormats: agentContract.exportFormats,
    relationTypes: agentContract.relationTypes,
    conflictKinds: agentContract.conflictKinds,
    jsonSchemas: buildJsonSchemasPayload(),
    examples: buildAgentRequestExamples(),
    endpoints: agentContract.endpoints.map(([method, path, description]) => ({ method, path, description })),
    exportFormats: agentContract.exportFormats,
    securityControls: normalizeSecurityControls(state.securityControls),
    securityReport: buildSecurityReportPayload(),
    storageReport: buildStorageReportPayload(),
  };
}

function buildJsonSchemasPayload() {
  return {
    schemaVersion: "wre-2.5-json-schema",
    generatedAt: new Date().toISOString(),
    schemas: {
      Claim: {
        type: "object",
        required: ["id", "layer", "text", "domain", "confidence", "timeScope", "provenance", "sensitivity"],
        properties: {
          id: { type: "string", pattern: "^[JPTB][0-9]+$" },
          layer: { type: "string", enum: ["judgment", "principle", "theory"] },
          text: { type: "string", minLength: 1 },
          domain: { type: "string", enum: ["normative", "empirical", "conceptual", "meta"] },
          confidence: { type: "number", minimum: 1, maximum: 100 },
          timeScope: { type: "string" },
          provenance: { type: "string" },
          sensitivity: { type: "string", enum: ["private", "pseudonymous", "public"] },
        },
      },
      Relation: {
        type: "object",
        required: ["id", "source", "target", "type", "weight", "rationale"],
        properties: {
          id: { type: "string", pattern: "^L-[0-9]+$" },
          source: { type: "string" },
          target: { type: "string" },
          type: { type: "string", enum: agentContract.relationTypes },
          weight: { type: "number", minimum: 0, maximum: 1 },
          rationale: { type: "string" },
        },
      },
      Constraint: {
        type: "object",
        required: ["id", "name", "language", "body", "severity", "enabled"],
        properties: {
          id: { type: "string", pattern: "^K-[0-9]+$" },
          name: { type: "string" },
          language: { type: "string", enum: ["rule", "smt", "shacl"] },
          body: { type: "string" },
          severity: { type: "string", enum: severityOrder },
          enabled: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Conflict: {
        type: "object",
        required: ["id", "title", "severity", "claimA", "claimB", "kind", "core", "why", "repairs"],
        properties: {
          id: { type: "string", pattern: "^C-[0-9]+$" },
          title: { type: "string" },
          severity: { type: "string", enum: severityOrder },
          claimA: { type: "string" },
          claimB: { type: "string" },
          linked: { type: "array", items: { type: "string" } },
          kind: { type: "string", enum: agentContract.conflictKinds },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          constraintId: { type: "string" },
          core: { type: "array", items: { type: "string" } },
          engine: { type: "array", items: { type: "string" } },
          why: { type: "string" },
          status: { type: "string", enum: ["open", "repaired", "ignored"] },
          repairs: { type: "array", items: { $ref: "#/schemas/RepairOption" } },
        },
      },
      RepairOption: {
        type: "object",
        required: ["id", "title", "text", "cost"],
        properties: {
          id: { type: "string", pattern: "^R-[0-9]+$" },
          conflictId: { type: "string" },
          title: { type: "string" },
          text: { type: "string" },
          actionType: { type: "string" },
          affectedClaims: { type: "array", items: { type: "string" } },
          predictedResolutionScore: { type: "number", minimum: 0, maximum: 1 },
          disruptionCost: { type: "number", minimum: 0 },
          explanation: { type: "string" },
          cost: { type: "string" },
        },
      },
      AnalysisRun: {
        type: "object",
        required: ["id", "claimCount", "candidatePairs", "hardCount", "softCount", "engines"],
        properties: {
          id: { type: "string", pattern: "^A-[0-9]+$" },
          time: { type: "string", format: "date-time" },
          claimCount: { type: "number" },
          candidatePairs: { type: "number" },
          constraintCount: { type: "number" },
          constraintMatches: { type: "number" },
          hardCount: { type: "number" },
          softCount: { type: "number" },
          nliQueued: { type: "number" },
          estimatedHybridLatency: { type: "number" },
          engines: { type: "array", items: { type: "string" } },
        },
      },
      EvaluationRun: {
        type: "object",
        required: ["id", "overallStatus", "passed", "warning", "failed", "metrics"],
        properties: {
          id: { type: "string", pattern: "^E-[0-9]+$" },
          time: { type: "string", format: "date-time" },
          overallStatus: { type: "string", enum: ["pass", "review", "needs-evidence"] },
          passed: { type: "number" },
          warning: { type: "number" },
          failed: { type: "number" },
          total: { type: "number" },
          readinessScore: { type: "number", minimum: 0, maximum: 1 },
          metrics: { type: "array", items: { type: "object" } },
          launchReadiness: { type: "array", items: { type: "object" } },
        },
      },
      SecurityControls: {
        type: "object",
        required: ["quotaPerHour", "bodyLimitKb", "analysisClaimCap", "nliPairCap", "monthlyBudgetUsd", "telemetryMode", "complianceStatus", "syncAuthRequired"],
        properties: {
          quotaPerHour: { type: "number", minimum: 1 },
          bodyLimitKb: { type: "number", minimum: 16 },
          analysisClaimCap: { type: "number", minimum: 10 },
          nliPairCap: { type: "number", minimum: 0 },
          monthlyBudgetUsd: { type: "number", minimum: 0 },
          telemetryMode: { type: "string", enum: ["off", "local", "otlp-ready"] },
          complianceStatus: { type: "string", enum: ["draft", "mapped", "launch-ready"] },
          syncAuthRequired: { type: "boolean" },
        },
      },
      SessionExport: {
        type: "object",
        required: ["schemaVersion", "session", "beliefs", "relations", "conflicts"],
        properties: {
          schemaVersion: { type: "string", const: "wre-2.5" },
          session: { type: "object" },
          beliefs: { type: "array", items: { $ref: "#/schemas/Claim" } },
          relations: { type: "array", items: { $ref: "#/schemas/Relation" } },
          constraints: { type: "array", items: { $ref: "#/schemas/Constraint" } },
          conflicts: { type: "array", items: { $ref: "#/schemas/Conflict" } },
          schema: {
            type: "object",
            properties: {
              exportFormats: { type: "array", items: { type: "string", enum: agentContract.exportFormats } },
            },
          },
          analysisRuns: { type: "array", items: { $ref: "#/schemas/AnalysisRun" } },
          evaluationRuns: { type: "array", items: { $ref: "#/schemas/EvaluationRun" } },
          securityControls: { $ref: "#/schemas/SecurityControls" },
        },
      },
    },
  };
}

function buildOpenApiPayload() {
  const schemas = buildJsonSchemasPayload().schemas;
  return {
    openapi: "3.1.0",
    info: {
      title: "Normativity WRE Agent API",
      version: agentContract.schemaVersion,
      description: "Deterministic WRE 2.5 contract for local-first belief graph agents.",
    },
    paths: Object.fromEntries(agentContract.endpoints.map(([method, path, description]) => {
      const operation = method.toLowerCase();
      return [
        path,
        {
          [operation]: {
            summary: description,
            operationId: operationIdFor(method, path),
            security: state.securityControls.syncAuthRequired ? [{ bearerAuth: [] }] : [],
            "x-wre-rate-limit": `${state.securityControls.quotaPerHour} requests/hour`,
            "x-wre-body-limit-kb": state.securityControls.bodyLimitKb,
            requestBody: requestBodyForEndpoint(method, path),
            responses: responseForEndpoint(method, path),
          },
        },
      ];
    })),
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Required for synced workspaces; local-only exports do not transmit data.",
        },
      },
    },
    "x-wre-examples": buildAgentRequestExamples(),
    "x-wre-security": buildSecurityReportPayload(),
    "x-wre-storage": buildStorageReportPayload(),
  };
}

function requestBodyForEndpoint(method, path) {
  if (method === "GET" || method === "DELETE") return undefined;
  if (path === "/v1/beliefs") return jsonRequestBody("Claim batch", { type: "object", properties: { beliefs: { type: "array", items: { $ref: "#/components/schemas/Claim" } } } });
  if (path === "/v1/relations") return jsonRequestBody("Relation batch", { type: "object", properties: { relations: { type: "array", items: { $ref: "#/components/schemas/Relation" } } } });
  if (path === "/v1/constraints") return jsonRequestBody("Constraint batch", { type: "object", properties: { constraints: { type: "array", items: { $ref: "#/components/schemas/Constraint" } } } });
  if (path === "/v1/conflicts/{id}/repair") return jsonRequestBody("Repair application", { type: "object", properties: { repairId: { type: "string" }, mode: { type: "string", enum: ["preview", "apply"] } } });
  if (path === "/v1/analyze") return jsonRequestBody("Analysis request", {
    type: "object",
    properties: {
      engineMode: { type: "string", enum: ["rule-only", "hybrid"] },
      nliTriage: { type: "boolean" },
      candidateLimit: { type: "number", maximum: state.securityControls.nliPairCap },
      maxClaims: { type: "number", maximum: state.securityControls.analysisClaimCap },
      maxBodyKb: { type: "number", maximum: state.securityControls.bodyLimitKb },
    },
  });
  if (path === "/v1/sessions") return jsonRequestBody("Session create", { type: "object", properties: { scope: { type: "string" }, privacy: { type: "object" } } });
  return jsonRequestBody("WRE request", { type: "object" });
}

function jsonRequestBody(description, schema) {
  return {
    required: true,
    content: {
      "application/json": {
        schema,
        examples: {
          current: {
            summary: description,
            value: buildAgentRequestExamples()[0]?.body || {},
          },
        },
      },
    },
  };
}

function responseForEndpoint(method, path) {
  if (path === "/v1/export") {
    return {
      "200": {
        description: "Portable WRE session archive in JSON, JSON-LD, or CSV summary form.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SessionExport" },
          },
          "application/ld+json": {
            schema: { type: "object" },
          },
          "text/csv": {
            schema: { type: "string" },
          },
        },
      },
    };
  }

  const schema = path.includes("constraints")
      ? { type: "object", properties: { constraints: { type: "array", items: { $ref: "#/components/schemas/Constraint" } } } }
    : path.includes("conflicts")
      ? { type: "object", properties: { conflicts: { type: "array", items: { $ref: "#/components/schemas/Conflict" } } } }
      : { type: "object" };
  return {
    "200": {
      description: `${method} ${path} response`,
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
}

function buildAgentRequestExamples() {
  const selectedConflict = getSelectedConflict();
  const selectedRepair = selectedConflict?.repairs.find((repair) => repair.id === state.selectedRepairId) || selectedConflict?.repairs[0];
  return [
    {
      method: "POST",
      path: "/v1/beliefs",
      description: "Batch add the current focused claims as typed WRE records.",
      body: {
        beliefs: state.beliefs.slice(0, 2).map(normalizeBelief),
      },
    },
    {
      method: "POST",
      path: "/v1/relations",
      description: "Batch add support, dependency, conflict, or undercut links.",
      body: {
        relations: state.relations.slice(0, 2).map(normalizeRelation),
      },
    },
    {
      method: "POST",
      path: "/v1/constraints",
      description: "Batch add transparent rule, SHACL, or SMT templates before local analysis.",
      body: {
        constraints: state.constraints.slice(0, 2).map(normalizeConstraint),
      },
    },
    {
      method: "POST",
      path: "/v1/analyze",
      description: "Run the local hybrid analysis profile currently selected in privacy controls.",
      body: {
        sessionId: "sess_7f2c9e7a",
        engineMode: state.privacy.nliTriage ? "hybrid" : "rule-only",
        nliTriage: Boolean(state.privacy.nliTriage),
        candidateLimit: state.securityControls.nliPairCap,
        maxClaims: state.securityControls.analysisClaimCap,
        maxBodyKb: state.securityControls.bodyLimitKb,
      },
    },
    {
      method: "GET",
      path: "/v1/export",
      description: "Request a portable archive as JSON, linked data, or a spreadsheet-safe summary.",
      body: {
        accept: agentContract.exportFormats,
        includes: ["claims", "relations", "constraints", "conflicts", "revisions"],
      },
    },
    {
      method: "POST",
      path: `/v1/conflicts/${selectedConflict?.id || "C-001"}/repair`,
      description: "Preview or apply the selected minimal-change repair option.",
      body: {
        repairId: selectedRepair?.id || "R-001",
        mode: "preview",
        requireBeforeAfterSnapshot: true,
      },
    },
  ];
}

function operationIdFor(method, path) {
  return `${method.toLowerCase()}_${path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "")}`;
}

function getLatestAnalysisRun() {
  return state.analysisRuns[state.analysisRuns.length - 1] || null;
}

function getLatestEvaluationRun() {
  return state.evaluationRuns[state.evaluationRuns.length - 1] || null;
}

function nextAnalysisRunId() {
  const max = state?.analysisRuns
    ? state.analysisRuns
        .map((run) => Number(String(run.id).replace(/^[A-Z-]+/, "")) || 0)
        .reduce((highest, value) => Math.max(highest, value), 0)
    : 0;
  return `A-${String(max + 1).padStart(3, "0")}`;
}

function nextEvaluationRunId() {
  const max = state?.evaluationRuns
    ? state.evaluationRuns
        .map((run) => Number(String(run.id).replace(/^[A-Z-]+/, "")) || 0)
        .reduce((highest, value) => Math.max(highest, value), 0)
    : 0;
  return `E-${String(max + 1).padStart(3, "0")}`;
}

function nextCalibrationRoundId() {
  const max = state?.calibrationRounds
    ? state.calibrationRounds
        .map((round) => Number(String(round.id).replace(/^[A-Z-]+/, "")) || 0)
        .reduce((highest, value) => Math.max(highest, value), 0)
    : 0;
  return `Q-${String(max + 1).padStart(3, "0")}`;
}

function nextRelationId() {
  const max = state.relations
    .map((relation) => Number(String(relation.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `L-${String(max + 1).padStart(3, "0")}`;
}

function nextConstraintId() {
  const max = state.constraints
    .map((constraint) => Number(String(constraint.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `K-${String(max + 1).padStart(3, "0")}`;
}

function nextRepairApplicationId() {
  const max = state.repairApplications
    .map((application) => Number(String(application.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `RA-${String(max + 1).padStart(3, "0")}`;
}

function nextConflictNumber() {
  return state.conflicts
    .map((conflict) => Number(String(conflict.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0) + 1;
}

function deriveRelationsFromClaimsAndConflicts(beliefs, conflicts) {
  const beliefIds = new Set(beliefs.map((belief) => belief.id));
  const relations = [];
  const seen = new Set();
  const addDerived = (source, target, type, weight, rationale) => {
    const key = `${source}:${type}:${target}`;
    if (!beliefIds.has(source) || !beliefIds.has(target) || source === target || seen.has(key)) return;
    seen.add(key);
    relations.push({
      id: `L-${String(relations.length + 1).padStart(3, "0")}`,
      source,
      target,
      type,
      weight,
      rationale,
    });
  };

  beliefs.forEach((belief) => {
    extractClaimReferences(belief.text).forEach((reference) => {
      addDerived(
        belief.id,
        reference,
        "depends_on",
        0.62,
        `Derived from ${belief.id}'s natural-language reference to @${reference}.`
      );
    });
  });

  conflicts.forEach((conflict) => {
    addDerived(
      conflict.claimA,
      conflict.claimB,
      "conflicts",
      Number.isFinite(Number(conflict.confidence)) ? clamp(Number(conflict.confidence), 0, 1) : 0.7,
      conflict.summary || `Derived from legacy conflict ${conflict.id || "record"}.`
    );
    (conflict.linked || []).forEach((linkedId) => {
      addDerived(
        conflict.claimA,
        linkedId,
        "depends_on",
        0.58,
        `Derived from ${conflict.id || "legacy conflict"} linked context.`
      );
    });
  });

  return relations.map(normalizeRelation);
}

function extractClaimReferences(text) {
  return [...String(text || "").matchAll(/@([JPT]\d+)/gi)].map((match) => match[1].toUpperCase());
}

function hasConflictBetween(claimA, claimB) {
  return state.conflicts.some((conflict) => {
    const members = new Set([conflict.claimA, conflict.claimB, ...(conflict.core || [])].filter(Boolean));
    return members.has(claimA) && members.has(claimB);
  });
}

function tokenOverlap(textA, textB) {
  const stopWords = new Set(["the", "and", "for", "that", "with", "only", "when", "from", "this", "should", "may", "not"]);
  const tokensA = new Set(textA.split(/[^a-z0-9]+/).filter((token) => token.length > 2 && !stopWords.has(token)));
  const tokensB = new Set(textB.split(/[^a-z0-9]+/).filter((token) => token.length > 2 && !stopWords.has(token)));
  if (!tokensA.size || !tokensB.size) return 0;
  const shared = [...tokensA].filter((token) => tokensB.has(token)).length;
  return shared / Math.min(tokensA.size, tokensB.size);
}

function roundNumber(value) {
  return Math.round(value * 100) / 100;
}

function averageConfidence(rounds) {
  if (!rounds.length) return 0;
  const total = rounds.reduce((sum, round) => sum + Number(round.confidence || 0), 0);
  return Math.round(total / rounds.length);
}

function evidenceLabel(value) {
  if (value === "supports") return "Supports principle";
  if (value === "weakens") return "Weakens principle";
  if (value === "undercuts") return "Undercuts background assumption";
  return "Unclear pressure";
}

function disagreementLabel(value) {
  if (value === "low") return "Low disagreement";
  if (value === "moderate") return "Moderate disagreement";
  if (value === "high") return "High disagreement";
  return "No peer disagreement";
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
  if (type === "security") return "Security controls";
  if (type === "claim") return "Claim added";
  if (type === "relation") return "Relation updated";
  if (type === "constraint") return "Constraint updated";
  if (type === "analysis") return "Analysis run";
  if (type === "evaluation") return "Evaluation run";
  if (type === "calibration") return "Calibration round";
  return "Session event";
}

function relationTypeLabel(type) {
  if (type === "depends_on") return "Depends on";
  return titleCase(String(type || "neutral").replace(/_/g, " "));
}

function renderBeliefOptions(selectedId) {
  return state.beliefs.map((belief) => {
    const selected = belief.id === selectedId ? " selected" : "";
    return `<option value="${escapeHtml(belief.id)}"${selected}>${escapeHtml(belief.id)} · ${escapeHtml(labelForLayer(belief.layer))}</option>`;
  }).join("");
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

function storageLabel(value) {
  if (value === "indexeddb") return "IndexedDB";
  if (value === "session") return "Session";
  return "Local";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(clamp(parsed, min, max));
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
