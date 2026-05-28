const STORAGE_KEY = "normativity-wre-dashboard-v5";
const PREVIOUS_STORAGE_KEY = "normativity-wre-dashboard-v4";
const INDEXED_DB_NAME = "normativity-wre-local-first";
const INDEXED_DB_VERSION = 1;
const INDEXED_DB_STORE = "sessions";
const INDEXED_DB_SESSION_ID = "sess_7f2c9e7a";
const WRE_SCHEMA_VERSION = "wre-5";
const PREVIOUS_SCHEMA_VERSION = "wre-4";
const LEGACY_SCHEMA_VERSION = "wre-3";
const OLDER_SCHEMA_VERSION = "wre-2.5";
const WRE_ENGINE_VERSION = "local-wre-engine-5.0.0";
const DEFAULT_SYNC_ENDPOINT = "http://127.0.0.1:8787";
const DEFAULT_PRIVACY = {
  privacyMode: "local_only",
  cloudSync: false,
  nliTriage: false,
  retention: "until-deleted",
  syncEndpoint: DEFAULT_SYNC_ENDPOINT,
  workspaceId: "",
  syncTokenCreatedAt: "",
  lastSyncStatus: "staged-local-only",
  lastSyncAt: "",
  lastRemoteClock: 0,
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
  incidentRunbook: "NIST-style incident runbook and contact path required before shared or public sync.",
  modelTrainingPolicy: "Default models are never trained on belief content without informed opt-in.",
  humanReviewPath: "Human review remains available for disputes, unclear explanations, and high-impact repairs.",
  cspMode: "meta-policy-for-static-wre",
  dependencyScanning: "dependabot-root-and-worker-npm",
  publicFormAbuse: "turnstile-ready-before-public-share-or-sign-up",
};

const DEFAULT_AGENT_PROFILE = {
  id: "agent-local-human",
  displayName: "Local decision-maker",
  actorKind: "individual_human",
  workflowMode: "individual",
  templateId: "individual_human",
  activeScope: "AI hiring assistant",
  jurisdiction: "US",
  timeHorizon: "2026 pilot",
  conditions: "Private local review",
  importTraceSource: "",
  sharedEquilibrium: false,
  permissionsModel: "private-by-default",
  canonicalStore: "local-indexeddb",
};

const setupTemplates = [
  {
    id: "individual_human",
    label: "Individual Human",
    actorKind: "individual_human",
    workflowMode: "individual",
    displayName: "Local decision-maker",
    activeScope: "Personal decision review",
    conditions: "Private local reflection",
    seedFocus: "judgments, principles, and background theories",
  },
  {
    id: "ai_agent",
    label: "AI Agent",
    actorKind: "ai_agent",
    workflowMode: "individual",
    displayName: "Normative assistant",
    activeScope: "Agent policy and response constraints",
    conditions: "Imported prompt, tool, and policy trace",
    seedFocus: "system commitments, task constraints, and observed reasoning trace",
  },
  {
    id: "team",
    label: "Team",
    actorKind: "team",
    workflowMode: "shared",
    displayName: "Team workspace",
    activeScope: "Team policy review",
    conditions: "Role-scoped shared equilibrium with private dissent preserved",
    seedFocus: "member commitments, live objections, and shared repair decisions",
  },
  {
    id: "institution",
    label: "Institution",
    actorKind: "institution",
    workflowMode: "shared",
    displayName: "Institutional policy owner",
    activeScope: "Institutional rule and policy review",
    conditions: "Permissioned audit, retention, and accountability requirements",
    seedFocus: "formal policy, legal constraints, stakeholder evidence, and exceptions",
  },
  {
    id: "import_trace",
    label: "Import Trace",
    actorKind: "ai_agent",
    workflowMode: "import_trace",
    displayName: "Imported reasoning trace",
    activeScope: "Reasoning-trace normalization",
    conditions: "Imported JSON, transcript, or model/tool trace awaiting typed claim extraction",
    seedFocus: "raw belief items, normalized claims, provenance gaps, and lazy enrichment",
  },
];

const domainRulePacks = [
  {
    id: "deontic-logic",
    label: "Deontic Logic",
    status: "available",
    engine: "rule",
    checks: ["permission-forbiddance clash", "obligation exception scope", "direct negation"],
  },
  {
    id: "probabilistic-coherence",
    label: "Probabilistic Coherence",
    status: "available",
    engine: "local-probability",
    checks: ["confidence threshold clash", "entrenchment-weight mismatch", "repair reversal risk"],
  },
  {
    id: "factual-evidence",
    label: "Factual Evidence",
    status: "available",
    engine: "evidence-request",
    checks: ["missing source", "unsupported empirical claim", "stale or ambiguous reference"],
  },
  {
    id: "organizational-policy",
    label: "Organizational Policy",
    status: "available",
    engine: "policy-constraint",
    checks: ["jurisdiction scope", "permission boundary", "audit-retention requirement"],
  },
];

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
    propositionObject: {
      actor: "hiring_decision",
      action: "uses_protected_attributes",
      object: "candidates",
      propositionType: "deontic",
      modality: "forbidden",
      polarity: "positive",
      scope: "general_hiring_policy",
      exceptions: [],
    },
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
    propositionObject: {
      actor: "hiring_decision",
      action: "uses_relevant_experience",
      object: "role_fit",
      propositionType: "deontic",
      modality: "permitted",
      polarity: "positive",
      scope: "validated_role_relevance",
      exceptions: ["proxy_for_protected_attributes"],
    },
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
    propositionObject: {
      actor: "employer",
      action: "discloses_decision_reasons",
      object: "candidates",
      propositionType: "deontic",
      modality: "must",
      polarity: "positive",
      scope: "candidate_communications",
      exceptions: ["protected_internal_notes"],
    },
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
    propositionObject: {
      actor: "hiring_decision",
      action: "respects_equal_status",
      object: "candidates",
      propositionType: "principle",
      modality: "must",
      polarity: "positive",
      scope: "general_hiring_ethics",
      exceptions: [],
    },
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
    propositionObject: {
      actor: "selection_criterion",
      action: "tracks_job_relevance",
      object: "candidate_evaluation",
      propositionType: "principle",
      modality: "must",
      polarity: "positive",
      scope: "selection_criteria",
      exceptions: ["unvalidated_proxy_signal"],
    },
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
    propositionObject: {
      actor: "hiring_process",
      action: "preserves_fair_opportunity",
      object: "candidates",
      propositionType: "principle",
      modality: "must",
      polarity: "positive",
      scope: "general_hiring_ethics",
      exceptions: [],
    },
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
    propositionObject: {
      actor: "title_vii",
      action: "constrains_protected_attribute_use",
      object: "hiring_decision",
      propositionType: "background_theory",
      modality: "is",
      polarity: "positive",
      scope: "us_hiring_context",
      exceptions: [],
    },
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
    propositionObject: {
      actor: "structured_interview",
      action: "predicts_role_performance",
      object: "candidate_evaluation",
      propositionType: "background_theory",
      modality: "is",
      polarity: "positive",
      scope: "personnel_selection_evidence",
      exceptions: ["poorly_validated_rubric"],
    },
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
    propositionObject: {
      actor: "cognitive_bias",
      action: "amplifies_proxy_risk",
      object: "experience_signals",
      propositionType: "background_theory",
      modality: "is",
      polarity: "positive",
      scope: "evaluator_behavior",
      exceptions: ["validated_structured_controls"],
    },
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
  {
    id: "L-006",
    source: "P1",
    target: "J1",
    type: "defines",
    weight: 0.81,
    rationale: "P1 defines the protected-attribute boundary used when J1 is normalized into a non-discrimination claim.",
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
  schemaVersion: WRE_SCHEMA_VERSION,
  beliefItemFields: ["id", "family", "rawText", "propositionObject", "confidence", "entrenchment", "scope", "provenance", "evidenceRefs", "references", "claimIds", "revisionStatus"],
  claimFields: ["id", "beliefItemId", "kind", "layer", "proposition", "propositionObject", "text", "canonicalForm", "domain", "modality", "polarity", "scope", "scopeObject", "exceptions", "confidence", "entrenchment", "provenance", "provenanceObject", "evidenceRefs", "references", "sensitivity", "status", "revisionStatus"],
  relationFields: ["id", "source", "target", "type", "weight", "rationale"],
  constraintFields: ["id", "name", "language", "body", "severity", "enabled"],
  agentProfileFields: ["id", "displayName", "actorKind", "workflowMode", "activeScope", "jurisdiction", "timeHorizon", "conditions", "permissionsModel", "canonicalStore"],
  formalRunFields: ["id", "analysisRunId", "status", "assertions", "constraints", "unsatCores", "repairRanking"],
  argumentationRunFields: ["id", "analysisRunId", "attackEdges", "defenseEdges", "admissibleSet", "vulnerableClaims", "groundedExtension"],
  triageRunFields: ["id", "analysisRunId", "nliMode", "candidateLimit", "reviewQueue", "formalizationCandidates", "probabilisticSummary"],
  syncPacketFields: ["workspace", "manifest", "mutationSet", "edgeContract", "conflictPolicy", "readiness", "backend"],
  repairOptionFields: ["id", "conflictId", "actionType", "targetId", "affectedClaims", "predictedResolutionScore", "estimatedCost", "disruptionCost", "explanation"],
  revisionEventFields: ["id", "time", "type", "text", "schemaVersion", "algorithmVersion", "affectedClaims", "beforeHash", "afterHash"],
  evidenceRequestFields: ["id", "targetType", "targetId", "priority", "prompt", "reason", "suggestedAction", "status"],
  rulePackFields: ["id", "label", "status", "engine", "checks"],
  exportFormats: ["application/json", "application/ld+json", "text/csv"],
  relationTypes: ["supports", "contradicts", "implies", "depends_on", "exception_to", "attacks", "entails", "undercuts", "scopes", "defines"],
  legacyRelationTypes: ["conflicts", "neutral"],
  conflictKinds: ["hard", "soft", "nlp", "accepted_tension"],
  conflictClasses: ["direct_contradiction", "principle_judgment_mismatch", "theory_judgment_mismatch", "deontic_clash", "scope_exception_mismatch", "unsupported_belief", "semantic_tension"],
  conflictSignals: ["direct_negation", "implication_conflict", "deontic_clash", "threshold_conflict", "scope_clash", "exception_mismatch", "rule_constraint", "semantic_tension", "unsupported_belief"],
  architecture: {
    frontend: "Static local-first frontend, TypeScript-ready without a mandatory framework migration",
    canonicalStore: "IndexedDB in the browser with webStorage fallback for session-only or degraded modes",
    syncArtifacts: "Optional Cloudflare Workers + D1/R2 encrypted packets after explicit user opt-in",
    deterministicAuthority: "Local rule, graph, scope, and evidence checks remain authoritative",
    optionalAssist: "LLM/NLI assists can draft normalization or explanation but cannot overrule deterministic checks",
  },
  publicArtifacts: ["wre/schema/wre5.schema.json", "wre/sdk/wre-client.mjs"],
  endpoints: [
    ["GET", "/health", "Check Worker health without reading or writing session data."],
    ["POST", "/v1/sessions", "Create a local or synced WRE session with explicit privacy mode."],
    ["POST", "/v1/belief-items", "Add raw belief items before deterministic normalization into typed claims."],
    ["POST", "/v1/beliefs", "Add or batch import typed judgments, principles, and background theories."],
    ["POST", "/v1/workspaces", "Create an encrypted sync workspace and token verifier."],
    ["POST", "/v1/relations", "Add or batch import support, attack, contradiction, entailment, undercut, scope, definition, dependency, and exception links."],
    ["POST", "/v1/constraints", "Add rule, SHACL, or SMT templates for deterministic hard-conflict checks."],
    ["POST", "/v1/analyze", "Run rule, SMT, graph, NLI, and probabilistic checks."],
    ["GET", "/v1/conflicts", "Read explanation-first conflict reports."],
    ["GET", "/v1/evidence-requests", "Read missing-information requests generated by local deterministic checks."],
    ["GET", "/v1/rule-packs", "Read available deterministic domain-rule pack hooks."],
    ["POST", "/v1/rule-packs/{id}/run", "Preview a deterministic domain-rule pack against the active claim graph."],
    ["GET", "/v1/formal-trace/latest", "Read the latest named-assertion trace with SMT-style unsat cores."],
    ["GET", "/v1/argumentation/latest", "Read attack, defense, vulnerability, and admissible-set analysis."],
    ["GET", "/v1/triage/latest", "Read NLI-style candidate-pair triage and probabilistic soft-tension scores."],
    ["POST", "/v1/sync/push", "Push an encrypted local mutation packet to an optional sync backend."],
    ["GET", "/v1/sync/pull", "Pull a remote manifest and tombstones for local merge review."],
    ["POST", "/v1/sync/resolve", "Submit a user-reviewed merge resolution after sync conflicts."],
    ["GET", "/v1/sessions/{id}/manifest", "Read opaque encrypted-packet manifest metadata."],
    ["POST", "/v1/conflicts/{id}/repair", "Preview or apply a ranked repair option."],
    ["GET", "/v1/export", "Export a portable JSON, JSON-LD, or CSV session archive."],
    ["GET", "/v1/schema/wre5", "Read the public WRE5 local-first belief graph schema and agent contract."],
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
    id: "taskCompletion",
    label: "Core task completion",
    target: ">= 0.80",
    value: "0.80",
    copy: "Enter case, link relation, understand conflict, decide repair or tension",
  },
  {
    id: "timeToFirstExplainedConflict",
    label: "Time to first explained conflict",
    target: "<= 180s",
    value: "180s",
    copy: "Private beta usability target",
  },
  {
    id: "sus",
    label: "System Usability Scale",
    target: ">= 75",
    value: "75",
    copy: "Post-task SUS target",
  },
  {
    id: "nasaTlx",
    label: "NASA-TLX workload",
    target: "<= 45",
    value: "45",
    copy: "Subjective workload target",
  },
  {
    id: "repairReversal",
    label: "Repair reversal rate",
    target: "<= 0.20",
    value: "0.20",
    copy: "Tracks whether accepted repairs later get undone",
  },
  {
    id: "aiOverride",
    label: "AI suggestion override tracking",
    target: "logged",
    value: "logged",
    copy: "Optional AI suggestions must remain user-overridable",
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
  detailRelationPath: document.getElementById("detailRelationPath"),
  detailDownstream: document.getElementById("detailDownstream"),
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
  exportSyncPacketBtn: document.getElementById("exportSyncPacketBtn"),
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
  acceptTensionBtn: document.getElementById("acceptTensionBtn"),
  tensionRationaleInput: document.getElementById("tensionRationaleInput"),
  guidanceBtn: document.getElementById("guidanceBtn"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  runEvaluationBtn: document.getElementById("runEvaluationBtn"),
  exportBenchmarkBtn: document.getElementById("exportBenchmarkBtn"),
  exportEvaluationBtn: document.getElementById("exportEvaluationBtn"),
  exportConstraintsBtn: document.getElementById("exportConstraintsBtn"),
  exportFormalTraceBtn: document.getElementById("exportFormalTraceBtn"),
  exportArgumentationBtn: document.getElementById("exportArgumentationBtn"),
  exportTriageBtn: document.getElementById("exportTriageBtn"),
  editContextBtn: document.getElementById("editContextBtn"),
  cloudSyncToggle: document.getElementById("cloudSyncToggle"),
  llmTriageToggle: document.getElementById("llmTriageToggle"),
  retentionSelect: document.getElementById("retentionSelect"),
  privacyModeSelect: document.getElementById("privacyModeSelect"),
  syncBackendForm: document.getElementById("syncBackendForm"),
  syncEndpointInput: document.getElementById("syncEndpointInput"),
  workspaceIdInput: document.getElementById("workspaceIdInput"),
  syncTokenInput: document.getElementById("syncTokenInput"),
  createWorkspaceBtn: document.getElementById("createWorkspaceBtn"),
  pushSyncBtn: document.getElementById("pushSyncBtn"),
  pullSyncBtn: document.getElementById("pullSyncBtn"),
  syncBackendStatus: document.getElementById("syncBackendStatus"),
  sessionMode: document.getElementById("sessionMode"),
  sessionRetention: document.getElementById("sessionRetention"),
  claimKind: document.getElementById("claimKind"),
  claimTypeInput: document.getElementById("claimTypeInput"),
  modalityInput: document.getElementById("modalityInput"),
  polarityInput: document.getElementById("polarityInput"),
  claimDomain: document.getElementById("claimDomain"),
  propositionActorInput: document.getElementById("propositionActorInput"),
  propositionActionInput: document.getElementById("propositionActionInput"),
  propositionObjectInput: document.getElementById("propositionObjectInput"),
  confidenceInput: document.getElementById("confidenceInput"),
  confidenceOutput: document.getElementById("confidenceOutput"),
  entrenchmentInput: document.getElementById("entrenchmentInput"),
  entrenchmentOutput: document.getElementById("entrenchmentOutput"),
  timeScopeInput: document.getElementById("timeScopeInput"),
  provenanceInput: document.getElementById("provenanceInput"),
  sourceTypeInput: document.getElementById("sourceTypeInput"),
  evidenceRefsInput: document.getElementById("evidenceRefsInput"),
  exceptionsInput: document.getElementById("exceptionsInput"),
  sensitivityInput: document.getElementById("sensitivityInput"),
  claimStatusInput: document.getElementById("claimStatusInput"),
  beliefErrorSummary: document.getElementById("beliefErrorSummary"),
  claimWorkbenchPanel: document.getElementById("claimWorkbenchPanel"),
  detailEvidenceRequests: document.getElementById("detailEvidenceRequests"),
  detailCore: document.getElementById("detailCore"),
  detailEngine: document.getElementById("detailEngine"),
  graphBtn: document.getElementById("graphBtn"),
  viewAllConflictsBtn: document.getElementById("viewAllConflictsBtn"),
  reviewLatestBtn: document.getElementById("reviewLatestBtn"),
  copyContractBtn: document.getElementById("copyContractBtn"),
  exportOpenApiBtn: document.getElementById("exportOpenApiBtn"),
  exportJsonSchemaBtn: document.getElementById("exportJsonSchemaBtn"),
  exportJsonLdBtn: document.getElementById("exportJsonLdBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  revisionReplay: document.getElementById("revisionReplay"),
  revisionList: document.getElementById("revisionList"),
  agentContractPanel: document.getElementById("agentContractPanel"),
  agentContractList: document.getElementById("agentContractList"),
  agentExampleList: document.getElementById("agentExampleList"),
  setupForm: document.getElementById("setupForm"),
  setupTemplateInput: document.getElementById("setupTemplateInput"),
  actorKindInput: document.getElementById("actorKindInput"),
  workflowModeInput: document.getElementById("workflowModeInput"),
  activeScopeInput: document.getElementById("activeScopeInput"),
  jurisdictionInput: document.getElementById("jurisdictionInput"),
  timeHorizonInput: document.getElementById("timeHorizonInput"),
  conditionsInput: document.getElementById("conditionsInput"),
  importTraceInput: document.getElementById("importTraceInput"),
  sharedEquilibriumInput: document.getElementById("sharedEquilibriumInput"),
  setupProfileList: document.getElementById("setupProfileList"),
  sessionScope: document.getElementById("sessionScope"),
  sessionActor: document.getElementById("sessionActor"),
  sessionWorkflow: document.getElementById("sessionWorkflow"),
  analysisPanel: document.getElementById("analysisPanel"),
  analysisSummary: document.getElementById("analysisSummary"),
  benchmarkList: document.getElementById("benchmarkList"),
  evaluationList: document.getElementById("evaluationList"),
  missingInfoList: document.getElementById("missingInfoList"),
  rulePackList: document.getElementById("rulePackList"),
  constraintForm: document.getElementById("constraintForm"),
  constraintNameInput: document.getElementById("constraintNameInput"),
  constraintLanguageInput: document.getElementById("constraintLanguageInput"),
  constraintSeverityInput: document.getElementById("constraintSeverityInput"),
  constraintBodyInput: document.getElementById("constraintBodyInput"),
  constraintList: document.getElementById("constraintList"),
  formalTraceList: document.getElementById("formalTraceList"),
  argumentationList: document.getElementById("argumentationList"),
  triageList: document.getElementById("triageList"),
  dataRightsPanel: document.getElementById("dataRightsPanel"),
  privacyReceiptList: document.getElementById("privacyReceiptList"),
  migrationReportList: document.getElementById("migrationReportList"),
  syncReadinessList: document.getElementById("syncReadinessList"),
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
    agentProfile: normalizeAgentProfile(DEFAULT_AGENT_PROFILE),
    beliefs: clone(seedBeliefs).map(normalizeBelief),
    relations: clone(seedRelations).map(normalizeRelation),
    constraints: clone(seedConstraints),
    conflicts: clone(seedConflicts).map(normalizeConflict),
    revisions: [],
    analysisRuns: [],
    formalRuns: [],
    argumentationRuns: [],
    triageRuns: [],
    evaluationRuns: [],
    calibrationRounds: [],
    repairApplications: [],
    migrationReport: null,
    privacy: { ...DEFAULT_PRIVACY },
    securityControls: { ...DEFAULT_SECURITY_CONTROLS },
    viewMode: "graph",
    workbenchFilter: "all",
    relationTypeFilter: "all",
    graphFocusConflictId: "",
    createdAt: "2025-05-15T10:42:00.000Z",
    updatedAt: new Date().toISOString(),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStatePayload(parsed) {
  if (!parsed || !Array.isArray(parsed.conflicts)) return null;
  const beliefSource = Array.isArray(parsed.beliefs)
    ? parsed.beliefs
    : Array.isArray(parsed.claims)
      ? parsed.claims
      : Array.isArray(parsed.beliefItems)
        ? parsed.beliefItems.map(beliefItemToClaim)
        : [];
  if (!beliefSource.length) return null;
  const beliefs = beliefSource.map(normalizeBelief);
  return {
    ...createState(),
    ...parsed,
    agentProfile: normalizeAgentProfile(parsed.agentProfile || parsed.session?.agentProfile || parsed.session),
    beliefs,
    relations: normalizeRelationSet(parsed.relations, beliefs, parsed.conflicts),
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(normalizeConstraint) : clone(seedConstraints),
    conflicts: parsed.conflicts.map(normalizeConflict),
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
    analysisRuns: Array.isArray(parsed.analysisRuns) ? parsed.analysisRuns.map(normalizeAnalysisRun) : [],
    formalRuns: Array.isArray(parsed.formalRuns) ? parsed.formalRuns.map(normalizeFormalRun) : [],
    argumentationRuns: Array.isArray(parsed.argumentationRuns) ? parsed.argumentationRuns.map(normalizeArgumentationRun) : [],
    triageRuns: Array.isArray(parsed.triageRuns) ? parsed.triageRuns.map(normalizeTriageRun) : [],
    evaluationRuns: Array.isArray(parsed.evaluationRuns) ? parsed.evaluationRuns.map(normalizeEvaluationRun) : [],
    calibrationRounds: Array.isArray(parsed.calibrationRounds) ? parsed.calibrationRounds.map(normalizeCalibrationRound) : [],
    repairApplications: Array.isArray(parsed.repairApplications) ? parsed.repairApplications.map(normalizeRepairApplication) : [],
    migrationReport: parsed.migrationReport || null,
    privacy: normalizePrivacy(parsed.privacy || parsed.session?.privacy),
    securityControls: normalizeSecurityControls(parsed.securityControls),
    viewMode: parsed.viewMode === "graph" ? "graph" : "table",
    workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
    relationTypeFilter: agentContract.relationTypes.includes(parsed.relationTypeFilter) ? parsed.relationTypeFilter : "all",
    graphFocusConflictId: parsed.graphFocusConflictId || "",
    updatedAt: parsed.updatedAt || parsed.savedAt || parsed.createdAt || new Date().toISOString(),
  };
}

function normalizePrivacy(privacy = {}) {
  const source = { ...DEFAULT_PRIVACY, ...(privacy || {}) };
  if (source.cloudSync && !source.privacyMode) source.privacyMode = "encrypted_sync";
  if (source.privacyMode === "local-plus-sync") source.privacyMode = "encrypted_sync";
  if (!["local_only", "encrypted_sync", "private_link", "workspace"].includes(source.privacyMode)) {
    source.privacyMode = source.cloudSync ? "encrypted_sync" : "local_only";
  }
  source.cloudSync = source.privacyMode !== "local_only" || Boolean(source.cloudSync);
  if (source.privacyMode === "local_only") source.cloudSync = false;
  if (!["until-deleted", "session-only", "30-days"].includes(source.retention)) source.retention = DEFAULT_PRIVACY.retention;
  source.syncEndpoint = String(source.syncEndpoint || DEFAULT_SYNC_ENDPOINT).trim() || DEFAULT_SYNC_ENDPOINT;
  source.workspaceId = String(source.workspaceId || "").trim();
  source.syncTokenCreatedAt = source.syncTokenCreatedAt || "";
  source.lastSyncStatus = source.lastSyncStatus || "staged-local-only";
  source.lastSyncAt = source.lastSyncAt || "";
  source.lastRemoteClock = Number.isFinite(Number(source.lastRemoteClock)) ? Number(source.lastRemoteClock) : 0;
  return source;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || sessionStorage.getItem(STORAGE_KEY)
      || localStorage.getItem(PREVIOUS_STORAGE_KEY)
      || sessionStorage.getItem(PREVIOUS_STORAGE_KEY);
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
    localStorage.removeItem(PREVIOUS_STORAGE_KEY);
    sessionStorage.removeItem(PREVIOUS_STORAGE_KEY);
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
  sessionStorage.removeItem(PREVIOUS_STORAGE_KEY);
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
  const layer = normalizeBeliefLayer(belief.layer || belief.family);
  const kind = normalizeClaimKind(belief.kind || belief.claimKind || belief.type || layer);
  const scope = normalizeScopeText(belief.scope || belief.scopeObject || belief.timeScope || belief.time_scope || "Unscoped");
  const scopeObject = normalizeScopeObject(belief.scopeObject || belief.scope, {
    layer,
    textScope: scope,
    domain: belief.domain || (layer === "theory" ? "empirical" : "normative"),
  });
  const provenanceObject = normalizeProvenanceObject(belief.provenanceObject || belief.provenance || belief.source_refs, belief);
  const evidenceRefs = normalizeEvidenceRefs(belief.evidenceRefs || belief.evidence_refs || belief.evidence || provenanceObject.evidenceRefs);
  const propositionSource = belief.proposition && typeof belief.proposition === "object" ? belief.proposition : belief.propositionObject || belief.structuredProposition || {};
  const text = typeof belief.proposition === "string"
    ? belief.proposition
    : belief.text || belief.rawText || belief.claimText || propositionSource.claimText || "";
  const propositionObject = normalizePropositionObject(propositionSource, {
    ...belief,
    text,
    layer,
    kind,
    domain: belief.domain || (layer === "theory" ? "empirical" : "normative"),
    scope,
  });
  const modality = normalizeClaimModality(belief.modality || propositionObject.modality, text);
  const polarity = normalizeClaimPolarity(belief.polarity || propositionObject.polarity, text);
  propositionObject.modality = modality;
  propositionObject.polarity = polarity;
  propositionObject.propositionType = normalizePropositionType(propositionObject.propositionType || kind || layer, layer);
  propositionObject.scope = propositionObject.scope || scope;
  return {
    id: belief.id || `${prefixForLayer(layer)}0`,
    beliefItemId: belief.beliefItemId || belief.belief_item_id || `BI-${belief.id || `${prefixForLayer(layer)}0`}`,
    kind,
    layer,
    proposition: text,
    propositionObject,
    structuredProposition: propositionObject,
    exceptions: propositionObject.exceptions,
    text,
    canonicalForm: belief.canonicalForm || canonicalizeClaimText(text),
    domain: belief.domain || (layer === "theory" ? "empirical" : "normative"),
    modality,
    polarity,
    confidence: Number.isFinite(Number(belief.confidence)) ? clamp(Number(belief.confidence), 1, 100) : 70,
    entrenchment: Number.isFinite(Number(belief.entrenchment)) ? clamp(Number(belief.entrenchment), 1, 100) : defaultEntrenchmentForLayer(layer),
    scope,
    scopeObject,
    timeScope: scope,
    provenance: provenanceObject.sourceRef || "User supplied",
    sourceType: provenanceObject.sourceType,
    provenanceObject: {
      ...provenanceObject,
      evidenceRefs,
    },
    evidenceRefs,
    references: Array.isArray(belief.references) ? belief.references : extractClaimReferences(text),
    sensitivity: belief.sensitivity || belief.sensitivity_tags || "private",
    status: normalizeClaimStatus(belief.status),
    revisionStatus: normalizeClaimStatus(belief.revisionStatus || belief.revision_status || belief.status),
  };
}

function normalizeAgentProfile(profile = {}) {
  const template = setupTemplates.find((item) => item.id === profile.templateId || item.id === profile.template_id)
    || setupTemplates.find((item) => item.id === DEFAULT_AGENT_PROFILE.templateId);
  const merged = { ...DEFAULT_AGENT_PROFILE, ...(template || {}), ...(profile || {}) };
  const actorKind = ["individual_human", "ai_agent", "team", "institution"].includes(merged.actorKind)
    ? merged.actorKind
    : DEFAULT_AGENT_PROFILE.actorKind;
  const workflowMode = ["individual", "shared", "import_trace"].includes(merged.workflowMode)
    ? merged.workflowMode
    : DEFAULT_AGENT_PROFILE.workflowMode;
  return {
    id: String(merged.id || DEFAULT_AGENT_PROFILE.id),
    displayName: String(merged.displayName || merged.name || template?.displayName || DEFAULT_AGENT_PROFILE.displayName),
    actorKind,
    workflowMode,
    templateId: setupTemplates.some((item) => item.id === merged.templateId) ? merged.templateId : template?.id || DEFAULT_AGENT_PROFILE.templateId,
    activeScope: String(merged.activeScope || merged.scope || DEFAULT_AGENT_PROFILE.activeScope).trim() || DEFAULT_AGENT_PROFILE.activeScope,
    jurisdiction: String(merged.jurisdiction || DEFAULT_AGENT_PROFILE.jurisdiction).trim() || DEFAULT_AGENT_PROFILE.jurisdiction,
    timeHorizon: String(merged.timeHorizon || merged.time || DEFAULT_AGENT_PROFILE.timeHorizon).trim() || DEFAULT_AGENT_PROFILE.timeHorizon,
    conditions: String(merged.conditions || DEFAULT_AGENT_PROFILE.conditions).trim() || DEFAULT_AGENT_PROFILE.conditions,
    importTraceSource: String(merged.importTraceSource || merged.import_trace_source || "").trim(),
    sharedEquilibrium: workflowMode === "shared" || Boolean(merged.sharedEquilibrium),
    permissionsModel: String(merged.permissionsModel || DEFAULT_AGENT_PROFILE.permissionsModel),
    canonicalStore: String(merged.canonicalStore || DEFAULT_AGENT_PROFILE.canonicalStore),
  };
}

function beliefItemToClaim(item = {}) {
  const family = normalizeBeliefLayer(item.family || item.layer);
  const claimId = Array.isArray(item.claimIds) && item.claimIds[0] ? item.claimIds[0] : item.claimId || item.id?.replace(/^BI-/, "") || `${prefixForLayer(family)}0`;
  const sourceClaim = Array.isArray(item.normalizedClaims) && item.normalizedClaims[0] ? item.normalizedClaims[0] : {};
  const propositionObject = item.propositionObject || item.structuredProposition || sourceClaim.propositionObject || sourceClaim.structuredProposition || (typeof sourceClaim.proposition === "object" ? sourceClaim.proposition : {});
  return {
    id: claimId,
    beliefItemId: item.id || `BI-${claimId}`,
    layer: family,
    kind: item.kind || family,
    proposition: typeof item.proposition === "string" ? item.proposition : item.rawText || item.text || sourceClaim.text || "",
    propositionObject,
    text: typeof item.proposition === "string" ? item.proposition : item.rawText || item.text || sourceClaim.text || "",
    confidence: item.confidence,
    entrenchment: item.entrenchment,
    scope: item.scope,
    provenance: item.provenance,
    evidenceRefs: item.evidenceRefs,
    references: item.references,
    status: item.revisionStatus || item.status,
  };
}

function normalizePropositionObject(value = {}, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const text = String(fallback.text || fallback.rawText || fallback.proposition || "").trim();
  const actor = normalizePropositionToken(source.actor || fallback.actor || inferActorFromText(text));
  const action = normalizePropositionToken(source.action || fallback.action || inferActionFromText(text));
  const object = normalizePropositionToken(source.object || fallback.object || inferObjectFromText(text));
  const scope = normalizeScopeText(source.scope || fallback.scope || fallback.timeScope || fallback.activeScope || DEFAULT_AGENT_PROFILE.activeScope);
  const exceptions = normalizeExceptionList(source.exceptions || fallback.exceptions || fallback.exception || fallback.exceptionList);
  return {
    actor: actor || "unspecified_actor",
    action: action || canonicalPredicateFromText(text) || "unspecified_action",
    object,
    propositionType: normalizePropositionType(source.propositionType || source.type || fallback.kind || fallback.layer, fallback.layer),
    modality: normalizeClaimModality(source.modality || fallback.modality, text),
    polarity: normalizeClaimPolarity(source.polarity || fallback.polarity, text),
    scope,
    exceptions,
  };
}

function normalizePropositionType(value, layer = "judgment") {
  const type = String(value || "").replace(/-/g, "_").toLowerCase();
  if (["judgment", "principle", "background_theory", "belief_statement", "exception", "empirical_premise", "meta", "deontic", "descriptive"].includes(type)) {
    return type;
  }
  if (layer === "theory") return "background_theory";
  if (layer === "principle") return "principle";
  return "judgment";
}

function normalizePropositionToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeExceptionList(value) {
  if (Array.isArray(value)) return value.map(normalizePropositionToken).filter(Boolean);
  return String(value || "")
    .split(/[\n,;]+/)
    .map(normalizePropositionToken)
    .filter(Boolean);
}

function inferActorFromText(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("candidate")) return "candidate";
  if (lower.includes("employer") || lower.includes("hiring")) return "hiring_decision";
  if (lower.includes("agent") || lower.includes("assistant")) return "agent";
  if (lower.includes("institution")) return "institution";
  return "";
}

function inferActionFromText(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("protected attribute") || lower.includes("protected trait")) return "uses_protected_attributes";
  if (lower.includes("experience")) return "uses_relevant_experience";
  if (lower.includes("transparent") || lower.includes("disclos")) return "discloses_decision_reasons";
  if (lower.includes("confidential") || lower.includes("trade secret")) return "withholds_confidential_information";
  if (lower.includes("bias")) return "amplifies_proxy_risk";
  return "";
}

function inferObjectFromText(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("candidate")) return "candidates";
  if (lower.includes("protected attribute") || lower.includes("protected trait")) return "protected_attributes";
  if (lower.includes("experience")) return "experience_signal";
  if (lower.includes("role")) return "role_fit";
  return "";
}

function canonicalPredicateFromText(text) {
  return predicateTokens(text).slice(0, 4).join("_");
}

function normalizeScopeText(value) {
  if (value && typeof value === "object") {
    const fields = [value.domain, value.actor, value.time, value.jurisdiction, value.conditions].filter(Boolean);
    return fields.join(" / ") || value.text || "Unscoped";
  }
  return String(value || "Unscoped").trim() || "Unscoped";
}

function normalizeScopeObject(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const textScope = normalizeScopeText(value || fallback.textScope || DEFAULT_AGENT_PROFILE.activeScope);
  return {
    domain: String(source.domain || fallback.domain || "general"),
    actor: String(source.actor || DEFAULT_AGENT_PROFILE.displayName),
    time: String(source.time || source.timeHorizon || DEFAULT_AGENT_PROFILE.timeHorizon),
    jurisdiction: String(source.jurisdiction || DEFAULT_AGENT_PROFILE.jurisdiction),
    conditions: String(source.conditions || textScope),
  };
}

function normalizeProvenanceObject(value, belief = {}) {
  const source = value && typeof value === "object" ? value : {};
  const sourceRef = typeof value === "string" ? value : source.sourceRef || source.source_ref || belief.provenance || belief.source_refs || "User supplied";
  return {
    sourceType: normalizeSourceType(source.sourceType || source.source_type || belief.sourceType || belief.source_type),
    sourceRef: String(sourceRef || "User supplied").trim() || "User supplied",
    importedAt: source.importedAt || source.imported_at || "",
    evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs || source.evidence_refs || belief.evidenceRefs || belief.evidence_refs),
  };
}

function normalizeSourceType(value) {
  const sourceType = String(value || "user_supplied").replace(/-/g, "_").toLowerCase();
  if (["user_supplied", "user", "agent", "import", "assistant", "document", "dataset", "ai_trace", "interview", "policy", "external_reference"].includes(sourceType)) return sourceType;
  return "user_supplied";
}

function normalizeEvidenceRefs(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBeliefLayer(value) {
  const layer = String(value || "").toLowerCase().replace(/-/g, "_").trim();
  if (layer === "principle") return "principle";
  if (layer === "theory" || layer === "background" || layer === "background_theory" || layer === "meta") return "theory";
  return "judgment";
}

function normalizeClaimKind(value) {
  const kind = String(value || "").replace(/-/g, "_").toLowerCase();
  if (["judgment", "principle", "background_theory", "belief_statement", "exception", "empirical_premise", "meta"].includes(kind)) {
    return kind;
  }
  if (kind === "theory") return "background_theory";
  if (kind === "background") return "background_theory";
  if (kind === "background theory") return "background_theory";
  return "belief_statement";
}

function normalizeClaimModality(value, text = "") {
  const modality = String(value || "").replace(/-/g, "_").toLowerCase();
  if (["is", "ought", "must", "must_not", "permitted", "forbidden"].includes(modality)) return modality;
  if (modality === "should") return "ought";
  if (modality === "permits" || modality === "permit" || modality === "may") return "permitted";
  if (modality === "forbids" || modality === "forbid" || modality === "prohibits") return "forbidden";
  if (modality === "causes") return "is";
  const lower = text.toLowerCase();
  if (lower.includes("must not") || lower.includes("should not") || lower.includes("forbid") || lower.includes("prohibit")) return "forbidden";
  if (lower.includes(" must ") || lower.startsWith("must ") || lower.includes("required")) return "must";
  if (lower.includes("may ") || lower.includes("permit")) return "permitted";
  if (lower.includes(" is ") || lower.includes(" are ")) return "is";
  return "ought";
}

function normalizeClaimPolarity(value, text = "") {
  const polarity = String(value || "").toLowerCase();
  if (["positive", "negative", "mixed", "unknown"].includes(polarity)) return polarity;
  return inferClaimPolarity(text);
}

function normalizeClaimStatus(value) {
  const status = String(value || "active").toLowerCase().replace(/-/g, "_");
  return ["active", "draft", "accepted_tension", "retired"].includes(status) ? status : "active";
}

function defaultEntrenchmentForLayer(layer) {
  if (layer === "principle") return 76;
  if (layer === "theory") return 58;
  return 62;
}

function canonicalizeClaimText(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeRelationType(value) {
  const type = String(value || "").replace(/-/g, "_").toLowerCase();
  if (agentContract.relationTypes.includes(type)) return type;
  if (type === "conflicts") return "contradicts";
  if (type === "entails" || type === "implies") return "implies";
  if (type === "neutral") return "depends_on";
  return "depends_on";
}

function normalizeConflict(conflict) {
  const status = ["open", "repaired", "ignored", "accepted_tension"].includes(conflict.status) ? conflict.status : "open";
  const core = Array.isArray(conflict.core) ? conflict.core : [conflict.claimA, conflict.claimB].filter(Boolean);
  const signalType = normalizeConflictSignal(conflict.signalType || conflict.signal_type || (conflict.kind === "hard" ? "rule_constraint" : "semantic_tension"));
  const conflictClass = normalizeConflictClass(conflict.conflictClass || conflict.conflict_class || conflict.class || signalType);
  return {
    ...conflict,
    kind: conflict.kind || "soft",
    conflictClass,
    signalType,
    confidence: Number.isFinite(Number(conflict.confidence)) ? Number(conflict.confidence) : 0.7,
    core,
    engine: Array.isArray(conflict.engine) ? conflict.engine : ["Rule constraint", "Human review"],
    constraintId: conflict.constraintId || "",
    repairs: ensureWre5RepairOptions({ ...conflict, core, signalType, conflictClass }, Array.isArray(conflict.repairs) ? conflict.repairs : []),
    linked: Array.isArray(conflict.linked) ? conflict.linked : [],
    status,
    minimalConflictSet: Array.isArray(conflict.minimalConflictSet) ? conflict.minimalConflictSet : core,
    evidencePath: Array.isArray(conflict.evidencePath) ? conflict.evidencePath : [],
    downstreamClaims: Array.isArray(conflict.downstreamClaims) ? conflict.downstreamClaims : [],
    evidenceRequests: Array.isArray(conflict.evidenceRequests) ? conflict.evidenceRequests : [],
    algorithmVersion: conflict.algorithmVersion || WRE_ENGINE_VERSION,
  };
}

function normalizeConflictSignal(value) {
  const signal = String(value || "").replace(/-/g, "_").toLowerCase();
  return agentContract.conflictSignals.includes(signal) ? signal : "semantic_tension";
}

function normalizeConflictClass(value) {
  const conflictClass = String(value || "").replace(/-/g, "_").toLowerCase();
  if (agentContract.conflictClasses.includes(conflictClass)) return conflictClass;
  if (conflictClass === "direct_negation") return "direct_contradiction";
  if (conflictClass === "scope_clash" || conflictClass === "exception_mismatch") return "scope_exception_mismatch";
  if (conflictClass === "threshold_conflict") return "deontic_clash";
  if (conflictClass === "rule_constraint") return "principle_judgment_mismatch";
  return "semantic_tension";
}

function ensureWre5RepairOptions(conflict, repairs) {
  const fallbackTargetId = conflict.claimB || conflict.core?.[1] || conflict.claimA || conflict.core?.[0] || "";
  const normalized = repairs.map((repair) => ({
    ...repair,
    targetId: repair.targetId || repair.target_id || repair.targetClaimId || fallbackTargetId,
    actionType: repair.actionType || inferRepairActionType(repair),
  }));
  const sourceText = normalized.map((repair) => `${repair.title || ""} ${repair.text || ""} ${repair.actionType || ""}`.toLowerCase()).join(" ");
  const conflictNumber = Number(String(conflict.id || "").replace(/^[A-Z-]+/, "")) || normalized.length + 1;
  const additions = [];
  if (!sourceText.includes("exception")) {
    additions.push({
      id: `R-${String(1000 + conflictNumber).padStart(4, "0")}`,
      title: "Add Exception",
      text: "Add a scoped exception to preserve the stronger commitment while preventing overgeneralization.",
      cost: "0.32",
      badge: "Lowest",
      tone: conflict.severity === "critical" ? "high" : "medium",
      targetId: conflict.claimB || conflict.core?.[1] || conflict.claimA || "",
      actionType: "add_exception",
    });
  }
  if (!sourceText.includes("scope")) {
    additions.push({
      id: `R-${String(2000 + conflictNumber).padStart(4, "0")}`,
      title: "Revise Scope",
      text: "Narrow the actor, object, or condition scope so both claims can remain true under distinct circumstances.",
      cost: "0.46",
      badge: "Scope",
      tone: "medium",
      targetId: conflict.claimB || conflict.claimA || "",
      actionType: "revise_scope",
    });
  }
  if (!sourceText.includes("confidence")) {
    additions.push({
      id: `R-${String(3000 + conflictNumber).padStart(4, "0")}`,
      title: "Lower Confidence",
      text: "Reduce confidence in the less-entrenched claim while preserving it for further evidence review.",
      cost: "0.51",
      badge: "Minimal change",
      tone: "medium",
      targetId: conflict.claimB || conflict.claimA || "",
      actionType: "lower_confidence",
    });
  }
  return [...normalized, ...additions];
}

function normalizeRelation(relation, fallbackIndex = 0) {
  const type = normalizeRelationType(relation.type);
  const source = relation.source || relation.source_claim_id || relation.sourceClaimId || relation.from || "";
  const target = relation.target || relation.target_claim_id || relation.targetClaimId || relation.to || "";
  return {
    id: relation.id || relation.relationId || `L-${String(fallbackIndex + 1).padStart(3, "0")}`,
    source,
    target,
    type,
    legacyType: relation.legacyType || (agentContract.legacyRelationTypes.includes(relation.type) ? relation.type : ""),
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
  const beforeHash = revision.beforeHash || (revision.beforeSnapshot ? hashPayload(revision.beforeSnapshot) : "");
  const afterHash = revision.afterHash || (revision.afterSnapshot ? hashPayload(revision.afterSnapshot) : "");
  return {
    id: revision.id || `RV-${Date.now()}`,
    time: revision.time || new Date().toISOString(),
    type: revision.type || "audit",
    text: revision.text || revision.reason || "Session updated.",
    schemaVersion: revision.schemaVersion || WRE_SCHEMA_VERSION,
    algorithmVersion: revision.algorithmVersion || WRE_ENGINE_VERSION,
    conflictId: revision.conflictId || "",
    repairId: revision.repairId || "",
    affectedClaims: Array.isArray(revision.affectedClaims) ? revision.affectedClaims : [],
    predictedResolutionScore: Number.isFinite(Number(revision.predictedResolutionScore)) ? Number(revision.predictedResolutionScore) : null,
    disruptionCost: Number.isFinite(Number(revision.disruptionCost)) ? Number(revision.disruptionCost) : null,
    beforeSnapshot: revision.beforeSnapshot || null,
    afterSnapshot: revision.afterSnapshot || null,
    beforeHash,
    afterHash,
  };
}

function normalizeRepairApplication(application) {
  return {
    id: application.id || `RA-${Date.now()}`,
    time: application.time || new Date().toISOString(),
    conflictId: application.conflictId || "",
    repairId: application.repairId || "",
    actionType: application.actionType || "revise_scope",
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
    missingInfoCount: Number.isFinite(Number(run.missingInfoCount)) ? Number(run.missingInfoCount) : 0,
    nliQueued: Number.isFinite(Number(run.nliQueued)) ? Number(run.nliQueued) : 0,
    estimatedRuleLatency: Number.isFinite(Number(run.estimatedRuleLatency)) ? Number(run.estimatedRuleLatency) : 0,
    estimatedHybridLatency: Number.isFinite(Number(run.estimatedHybridLatency)) ? Number(run.estimatedHybridLatency) : 0,
    precisionReadiness: Number.isFinite(Number(run.precisionReadiness)) ? Number(run.precisionReadiness) : 0,
    engines: Array.isArray(run.engines) ? run.engines : ["Rule checks", "Argument graph", "Repair ranking"],
    deterministicSignals: Array.isArray(run.deterministicSignals) ? run.deterministicSignals : [],
    generatedConflictIds: Array.isArray(run.generatedConflictIds) ? run.generatedConflictIds : [],
  };
}

function normalizeFormalRun(run = {}) {
  return {
    id: run.id || `F-${Date.now()}`,
    analysisRunId: run.analysisRunId || "",
    time: run.time || new Date().toISOString(),
    status: run.status || "sat-with-soft-tensions",
    satisfiable: run.satisfiable !== false,
    engineVersions: Array.isArray(run.engineVersions) ? run.engineVersions : ["local-rule-v1", "smt-template-v1", "unsat-core-preview-v1"],
    assertions: Array.isArray(run.assertions) ? run.assertions : [],
    constraints: Array.isArray(run.constraints) ? run.constraints : [],
    unsatCores: Array.isArray(run.unsatCores) ? run.unsatCores : [],
    softTensions: Array.isArray(run.softTensions) ? run.softTensions : [],
    repairRanking: Array.isArray(run.repairRanking) ? run.repairRanking : [],
    notes: run.notes || "Local deterministic formalization preview; external Z3 execution is not required for this static WRE session.",
  };
}

function normalizeArgumentationRun(run = {}) {
  return {
    id: run.id || `G-${Date.now()}`,
    analysisRunId: run.analysisRunId || "",
    time: run.time || new Date().toISOString(),
    attackEdges: Array.isArray(run.attackEdges) ? run.attackEdges : [],
    supportEdges: Array.isArray(run.supportEdges) ? run.supportEdges : [],
    defenseEdges: Array.isArray(run.defenseEdges) ? run.defenseEdges : [],
    admissibleSet: Array.isArray(run.admissibleSet) ? run.admissibleSet : [],
    groundedExtension: Array.isArray(run.groundedExtension) ? run.groundedExtension : [],
    vulnerableClaims: Array.isArray(run.vulnerableClaims) ? run.vulnerableClaims : [],
    contestedClaims: Array.isArray(run.contestedClaims) ? run.contestedClaims : [],
    summary: run.summary || "",
    engineVersions: Array.isArray(run.engineVersions) ? run.engineVersions : ["argumentation-graph-v1", "admissible-set-preview-v1"],
  };
}

function normalizeTriageRun(run = {}) {
  return {
    id: run.id || `N-${Date.now()}`,
    analysisRunId: run.analysisRunId || "",
    time: run.time || new Date().toISOString(),
    nliMode: run.nliMode || "local-preview",
    externalProcessing: Boolean(run.externalProcessing),
    candidateLimit: Number.isFinite(Number(run.candidateLimit)) ? Number(run.candidateLimit) : DEFAULT_SECURITY_CONTROLS.nliPairCap,
    queuedPairCount: Number.isFinite(Number(run.queuedPairCount)) ? Number(run.queuedPairCount) : 0,
    reviewQueue: Array.isArray(run.reviewQueue) ? run.reviewQueue : [],
    formalizationCandidates: Array.isArray(run.formalizationCandidates) ? run.formalizationCandidates : [],
    probabilisticSummary: run.probabilisticSummary || {},
    adapter: run.adapter || "local-heuristic-nli-v1",
    notes: run.notes || "Static local triage estimates contradiction probability without sending belief text to an external model.",
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
    incidentRunbook: source.incidentRunbook || DEFAULT_SECURITY_CONTROLS.incidentRunbook,
    modelTrainingPolicy: source.modelTrainingPolicy || DEFAULT_SECURITY_CONTROLS.modelTrainingPolicy,
    humanReviewPath: source.humanReviewPath || DEFAULT_SECURITY_CONTROLS.humanReviewPath,
    cspMode: source.cspMode || DEFAULT_SECURITY_CONTROLS.cspMode,
    dependencyScanning: source.dependencyScanning || DEFAULT_SECURITY_CONTROLS.dependencyScanning,
    publicFormAbuse: source.publicFormAbuse || DEFAULT_SECURITY_CONTROLS.publicFormAbuse,
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
  els.entrenchmentInput.addEventListener("input", syncEntrenchmentOutput);
  els.caseConfidenceInput.addEventListener("input", syncCaseConfidenceOutput);

  els.setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateAgentProfileFromForm();
  });
  els.setupForm.querySelector(".setup-submit")?.addEventListener("click", updateAgentProfileFromForm);
  els.setupTemplateInput.addEventListener("change", applySelectedSetupTemplate);
  els.workflowModeInput.addEventListener("change", syncSharedEquilibriumFromWorkflow);

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
  els.acceptTensionBtn.addEventListener("click", acceptUnresolvedTension);
  els.analyzeBtn.addEventListener("click", runLocalAnalysis);
  els.runEvaluationBtn.addEventListener("click", runLocalEvaluation);
  els.exportBenchmarkBtn.addEventListener("click", exportBenchmark);
  els.exportEvaluationBtn.addEventListener("click", exportEvaluationReport);
  els.exportConstraintsBtn.addEventListener("click", exportConstraints);
  els.exportFormalTraceBtn.addEventListener("click", exportFormalTrace);
  els.exportArgumentationBtn.addEventListener("click", exportArgumentationReport);
  els.exportTriageBtn.addEventListener("click", exportTriageReport);
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
  els.exportSyncPacketBtn.addEventListener("click", exportSyncPacket);
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

  [els.cloudSyncToggle, els.llmTriageToggle, els.retentionSelect, els.privacyModeSelect].forEach((control) => {
    control.addEventListener("change", updatePrivacyControls);
  });
  [els.syncEndpointInput, els.workspaceIdInput].forEach((control) => {
    control.addEventListener("change", updateSyncBackendSettings);
  });
  els.createWorkspaceBtn.addEventListener("click", createEncryptedWorkspace);
  els.pushSyncBtn.addEventListener("click", pushEncryptedSyncPacket);
  els.pullSyncBtn.addEventListener("click", pullSyncManifest);

  els.reviewLatestBtn.addEventListener("click", () => {
    reviewReplay();
  });

  els.copyContractBtn.addEventListener("click", copyAgentContract);
  els.exportOpenApiBtn.addEventListener("click", exportOpenApiContract);
  els.exportJsonSchemaBtn.addEventListener("click", exportJsonSchemaContract);
  els.exportJsonLdBtn.addEventListener("click", exportJsonLd);
  els.exportCsvBtn.addEventListener("click", exportCsvSummary);
  els.seedCalibrationBtn.addEventListener("click", seedCalibrationFromConflict);
  els.clearCalibrationBtn.addEventListener("click", clearCalibrationForm);
}

function render() {
  renderSetupProfile();
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
  syncSetupControls();
  syncViewMode();
  syncConfidenceOutput();
  syncEntrenchmentOutput();
  syncCaseConfidenceOutput();
  syncSyncBackendControls();
  syncStorageStatus();
  updateTokenCount();
}

function renderSetupProfile() {
  if (!els.setupProfileList) return;
  const profile = normalizeAgentProfile(state.agentProfile);
  const template = setupTemplates.find((item) => item.id === profile.templateId) || setupTemplates[0];
  const beliefItems = buildBeliefItems();
  const missingInfo = buildMissingInformationReport({ preview: true });
  replaceChildren(
    els.setupProfileList,
    [
      ["Actor", actorKindLabel(profile.actorKind)],
      ["Workflow", workflowModeLabel(profile.workflowMode)],
      ["Template", template.label],
      ["Active scope", profile.activeScope],
      ["Jurisdiction", profile.jurisdiction],
      ["Belief items", `${beliefItems.length} raw-to-claim records`],
      ["Evidence requests", `${missingInfo.requests.length} open`],
      ["Store target", "Local-first browser"],
    ].map(([label, value]) => renderReceiptItem(label, value))
  );
}

function syncSetupControls() {
  if (!els.setupForm) return;
  state.agentProfile = normalizeAgentProfile(state.agentProfile);
  const profile = state.agentProfile;
  els.setupTemplateInput.value = profile.templateId;
  els.actorKindInput.value = profile.actorKind;
  els.workflowModeInput.value = profile.workflowMode;
  els.activeScopeInput.value = profile.activeScope;
  els.jurisdictionInput.value = profile.jurisdiction;
  els.timeHorizonInput.value = profile.timeHorizon;
  els.conditionsInput.value = profile.conditions;
  els.importTraceInput.value = profile.importTraceSource;
  els.sharedEquilibriumInput.checked = Boolean(profile.sharedEquilibrium);
  if (els.sessionScope) els.sessionScope.textContent = `Sample scenario: ${profile.activeScope}`;
  if (els.sessionActor) els.sessionActor.textContent = actorKindLabel(profile.actorKind);
  if (els.sessionWorkflow) els.sessionWorkflow.textContent = workflowModeLabel(profile.workflowMode);
}

function updateAgentProfileFromForm() {
  const previous = normalizeAgentProfile(state.agentProfile);
  state.agentProfile = normalizeAgentProfile({
    ...previous,
    templateId: els.setupTemplateInput.value,
    actorKind: els.actorKindInput.value,
    workflowMode: els.workflowModeInput.value,
    activeScope: els.activeScopeInput.value,
    jurisdiction: els.jurisdictionInput.value,
    timeHorizon: els.timeHorizonInput.value,
    conditions: els.conditionsInput.value,
    importTraceSource: els.importTraceInput.value,
    sharedEquilibrium: Boolean(els.sharedEquilibriumInput.checked),
    canonicalStore: previous.canonicalStore,
  });
  recordRevision(
    "setup",
    `Updated ${actorKindLabel(state.agentProfile.actorKind).toLowerCase()} setup for ${workflowModeLabel(state.agentProfile.workflowMode).toLowerCase()} workflow in ${state.agentProfile.activeScope}.`
  );
  saveState();
  render();
  focusElement(els.setupProfileList);
}

function applySelectedSetupTemplate() {
  const template = setupTemplates.find((item) => item.id === els.setupTemplateInput.value);
  if (!template) return;
  els.actorKindInput.value = template.actorKind;
  els.workflowModeInput.value = template.workflowMode;
  els.activeScopeInput.value = template.activeScope;
  els.conditionsInput.value = template.conditions;
  els.sharedEquilibriumInput.checked = template.workflowMode === "shared";
  if (template.workflowMode === "import_trace" && !els.importTraceInput.value.trim()) {
    els.importTraceInput.value = "Imported trace pending";
  }
}

function syncSharedEquilibriumFromWorkflow() {
  els.sharedEquilibriumInput.checked = els.workflowModeInput.value === "shared";
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
    { id: "setup-profile", label: "Open setup profile", group: "Setup", keywords: "agent actor team institution import trace", run: focusSetupProfile },
    { id: "table-view", label: "Table view", group: "Workspace", keywords: "linear claims", run: () => setWorkbenchView("table") },
    { id: "graph-view", label: "Graph view", group: "Workspace", keywords: "relations links", run: () => setWorkbenchView("graph") },
    { id: "all-conflicts", label: "View conflict queue", group: "Conflicts", keywords: "review", run: viewAllConflicts },
    { id: "next-conflict", label: "Next conflict", group: "Conflicts", keywords: "review queue", run: () => selectRelativeConflict(1) },
    { id: "previous-conflict", label: "Previous conflict", group: "Conflicts", keywords: "review queue", run: () => selectRelativeConflict(-1) },
    { id: "repair-detail", label: "View repair detail", group: "Repair", keywords: "simulation preview", run: focusRepairDetail },
    { id: "apply-repair", label: "Apply selected repair", group: "Repair", keywords: "revision", disabled: repairApplied, run: applySelectedRepair },
    { id: "accept-tension", label: "Accept unresolved tension", group: "Repair", keywords: "known tension preserve", disabled: selectedConflict?.status === "accepted_tension", run: () => focusElement(els.tensionRationaleInput) },
    { id: "analyze-session", label: "Analyze session", group: "Analysis", keywords: "rule smt nli", run: runLocalAnalysis },
    { id: "run-evaluation", label: "Run local evaluation", group: "Analysis", keywords: "benchmark readiness launch", run: runLocalEvaluation },
    { id: "export-evaluation", label: "Export evaluation report", group: "Export", keywords: "benchmark readiness launch", run: exportEvaluationReport },
    { id: "focus-constraints", label: "Edit constraints", group: "Analysis", keywords: "rule shacl smt hard conflict", run: focusConstraintWorkbench },
    { id: "export-constraints", label: "Export constraints", group: "Export", keywords: "rule shacl smt schema", run: exportConstraints },
    { id: "focus-formal-trace", label: "View formal trace", group: "Analysis", keywords: "smt unsat core assertions", run: focusFormalTrace },
    { id: "export-formal-trace", label: "Export formal trace", group: "Export", keywords: "smt unsat core assertions repair", run: exportFormalTrace },
    { id: "focus-argumentation", label: "View argumentation review", group: "Analysis", keywords: "attack defense admissible vulnerable", run: focusArgumentationReview },
    { id: "export-argumentation", label: "Export argumentation report", group: "Export", keywords: "attack defense admissible graph", run: exportArgumentationReport },
    { id: "focus-triage", label: "View NLI triage", group: "Analysis", keywords: "nli probabilistic soft tension score", run: focusTriageReview },
    { id: "focus-evidence-requests", label: "View evidence requests", group: "Analysis", keywords: "missing information provenance evidence", run: focusEvidenceRequests },
    { id: "focus-rule-packs", label: "View rule packs", group: "Analysis", keywords: "deontic probabilistic factual policy plugin hooks", run: focusRulePacks },
    { id: "export-triage", label: "Export triage report", group: "Export", keywords: "nli probabilistic candidate pairs", run: exportTriageReport },
    { id: "replay", label: "Review replay", group: "Replay", keywords: "revision audit log", run: reviewReplay },
    { id: "calibration", label: "Open calibration loop", group: "Calibration", keywords: "case disagreement confidence", run: focusCalibrationLoop },
    { id: "export-session", label: "Export session JSON", group: "Export", keywords: "api archive", run: exportApi },
    { id: "export-jsonld", label: "Export JSON-LD graph", group: "Export", keywords: "linked data archive agent", run: exportJsonLd },
    { id: "export-csv", label: "Export CSV summary", group: "Export", keywords: "spreadsheet archive summary", run: exportCsvSummary },
    { id: "export-security", label: "Export security report", group: "Privacy", keywords: "owasp asvs quota abuse dpia", run: exportSecurityReport },
    { id: "export-local-store", label: "Export local store", group: "Privacy", keywords: "indexeddb localstorage migration extractor", run: exportLocalStoreExtractor },
    { id: "export-sync-packet", label: "Export sync packet", group: "Privacy", keywords: "cloud sync worker encrypted mutation manifest", run: exportSyncPacket },
    { id: "create-sync-workspace", label: "Create sync workspace", group: "Privacy", keywords: "cloudflare worker encrypted sync", run: createEncryptedWorkspace },
    { id: "push-encrypted-sync", label: "Push encrypted sync", group: "Privacy", keywords: "cloudflare worker r2 d1", disabled: state.privacy.privacyMode === "local_only", run: pushEncryptedSyncPacket },
    { id: "sync-readiness", label: "Review sync readiness", group: "Privacy", keywords: "cloud sync worker backend manifest", run: focusSyncReadiness },
    { id: "security-controls", label: "Open security controls", group: "Privacy", keywords: "quota abuse body size budget", run: focusSecurityControls },
    { id: "encrypted-archive", label: "Focus encrypted archive", group: "Privacy", keywords: "backup sync passphrase", run: focusEncryptedArchive },
    { id: "export-openapi", label: "Export OpenAPI contract", group: "Export", keywords: "agent schema endpoint json", run: exportOpenApiContract },
    { id: "export-json-schema", label: "Export WRE5 JSON schema", group: "Export", keywords: "public schema belief item claim sdk", run: exportJsonSchemaContract },
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
  const acceptedTensionCount = state.conflicts.filter((conflict) => conflict.status === "accepted_tension").length;
  const latestRun = getLatestAnalysisRun();
  const latestFormal = getLatestFormalRun();
  const latestArgumentation = getLatestArgumentationRun();
  const latestTriage = getLatestTriageRun();
  const syncPacket = buildSyncPacketPayload();
  const security = buildSecurityReportPayload();
  const missingInfo = buildMissingInformationReport({ preview: true });
  return [
    `WRE session has ${buildBeliefItems().length} belief items, ${state.beliefs.length} claims, ${state.relations.length} relations, ${state.constraints.length} constraints, and ${state.conflicts.length} conflicts.`,
    `Setup mode is ${actorKindLabel(state.agentProfile.actorKind)} with ${workflowModeLabel(state.agentProfile.workflowMode)} workflow.`,
    `${hardCount} hard conflicts and ${state.conflicts.length - hardCount} soft tensions are currently tracked.`,
    `${missingInfo.requests.length} missing-information requests are open.`,
    `${repairedCount} conflicts are marked repaired and ${acceptedTensionCount} known tensions are preserved.`,
    `Security launch gate is ${security.summary.launchGate}.`,
    `Selected conflict ${selectedConflict?.id || "none"}: ${selectedConflict?.title || "none selected"}.`,
    `Workspace view is ${state.viewMode}.`,
    latestRun ? `Latest analysis ${latestRun.id} reviewed ${latestRun.candidatePairs} candidate pairs.` : "No analysis run has been recorded in this session.",
    latestFormal ? `Latest formal trace ${latestFormal.id} is ${latestFormal.status} with ${latestFormal.unsatCores.length} unsat cores.` : "Formal trace preview is available before analysis.",
    latestArgumentation ? `Latest argumentation review ${latestArgumentation.id} has ${latestArgumentation.attackEdges.length} attacks and ${latestArgumentation.defenseEdges.length} defenses.` : "Argumentation review preview is available before analysis.",
    latestTriage ? `Latest triage ${latestTriage.id} queued ${latestTriage.queuedPairCount} candidate pairs and flagged ${latestTriage.formalizationCandidates.length} for formalization.` : "NLI and probabilistic triage preview is available before analysis.",
    `Optional sync packet is ${syncPacket.readiness.status} with ${syncPacket.readiness.score * 100}% readiness.`,
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
          <small>${escapeHtml(claimKindLabel(belief.kind || belief.layer))} · ${escapeHtml(titleCase(String(belief.modality || "ought").replace(/_/g, " ")))} · ${escapeHtml(belief.confidence)}% confidence · ${escapeHtml(belief.entrenchment || defaultEntrenchmentForLayer(layer))}% entrenched</small>
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
          ${conflict.status === "accepted_tension" ? '<span class="repair-status-pill accepted">Accepted tension</span>' : ""}
        </span>
        <p>${escapeHtml(conflict.summary)}</p>
        <p>Class: ${escapeHtml(conflictClassLabel(conflict.conflictClass))}</p>
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
  const explanation = buildConflictExplanation(conflict);

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
    [...(conflict.engine || []), explanation.algorithmVersion].map((step, index) => {
      const item = document.createElement("span");
      item.className = "engine-chip";
      item.textContent = `${index + 1}. ${step}`;
      return item;
    })
  );

  replaceChildren(
    els.detailRelationPath,
    explanation.relationPath.length
      ? explanation.relationPath.map((step) => {
          const item = document.createElement("article");
          item.className = "relation-path-item";
          item.innerHTML = `
            <header>
              <span>${escapeHtml(step.source)} → ${escapeHtml(step.target)}</span>
              <span class="relation-path-type">${escapeHtml(relationTypeLabel(step.type))}</span>
            </header>
            <p>${escapeHtml(step.rationale || step.evidence || "Relation contributes to this minimal conflict explanation.")}</p>
          `;
          return item;
        })
      : [emptyExplanationItem("No explicit relation path yet. Add support, attack, contradiction, entailment, undercut, scope, definition, dependency, or exception links to strengthen this explanation.")]
  );

  const evidenceRequests = buildEvidenceRequestsForConflict(conflict);
  replaceChildren(
    els.detailEvidenceRequests,
    evidenceRequests.length
      ? evidenceRequests.map(renderEvidenceRequestItem)
      : [emptyExplanationItem("No missing evidence request is attached to this conflict core.")]
  );

  replaceChildren(
    els.detailDownstream,
    explanation.downstreamClaims.length
      ? explanation.downstreamClaims.map((entry) => {
          const item = document.createElement("article");
          item.className = "downstream-item";
          item.innerHTML = `
            <header>
              <span>${escapeHtml(entry.id)}${entry.label ? ` · ${escapeHtml(entry.label)}` : ""}</span>
              <span class="downstream-hop">${escapeHtml(entry.via)}</span>
            </header>
            <p>${escapeHtml(entry.text || "No claim text available.")}</p>
          `;
          return item;
        })
      : [emptyExplanationItem("No downstream claim is currently supported by, dependent on, or scoped by this conflict core.")]
  );

  replaceChildren(
    els.detailClaims,
    [
      { title: "Claim A", id: conflict.claimA },
      { title: "Claim B", id: conflict.claimB },
    ].filter(({ id }) => Boolean(id)).map(({ title, id }) => {
      const belief = findBelief(id);
      const box = document.createElement("article");
      box.className = "claim-box";
      box.innerHTML = `
        <h4>${escapeHtml(title)}</h4>
        <div class="claim-box-row">
          <span class="belief-id">${escapeHtml(id)}</span>
          <p>${escapeHtml(belief?.text || "No linked claim available.")}</p>
          ${belief ? `<small>${escapeHtml(propositionCoreLabel(belief))}</small>` : ""}
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
  syncTensionAction(conflict);
  renderAccessibleSummary();
}

function syncRepairAction(conflict) {
  const alreadyApplied = conflict.status === "repaired" && conflict.appliedRepairId === state.selectedRepairId;
  els.applyRepairBtn.disabled = alreadyApplied;
  els.applyRepairBtn.querySelector("span").textContent = alreadyApplied ? "Repair Applied" : "Apply Repair";
}

function syncTensionAction(conflict) {
  const accepted = conflict.status === "accepted_tension";
  els.acceptTensionBtn.disabled = accepted;
  els.acceptTensionBtn.querySelector("span").textContent = accepted ? "Tension Accepted" : "Accept Unresolved Tension";
  els.tensionRationaleInput.value = accepted ? conflict.tensionRationale || "" : "";
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
        <th scope="col">Proposition</th>
        <th scope="col">Modality</th>
        <th scope="col">Polarity</th>
        <th scope="col">Domain</th>
        <th scope="col">Confidence</th>
        <th scope="col">Entrenchment</th>
        <th scope="col">Scope</th>
        <th scope="col">Provenance</th>
        <th scope="col">Sensitivity</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      ${visibleBeliefs.map((belief) => `
        <tr>
          <td><span class="belief-id">${escapeHtml(belief.id)}</span></td>
          <td>${escapeHtml(claimKindLabel(belief.kind || belief.layer))}</td>
          <td>
            <strong>${escapeHtml(belief.text)}</strong>
            <small class="claim-core">${escapeHtml(propositionCoreLabel(belief))}</small>
          </td>
          <td>${escapeHtml(titleCase(String(belief.modality || "ought").replace(/_/g, " ")))}</td>
          <td>${escapeHtml(titleCase(belief.polarity || "unknown"))}</td>
          <td>${escapeHtml(titleCase(belief.domain))}</td>
          <td>${escapeHtml(belief.confidence)}%</td>
          <td>${escapeHtml(belief.entrenchment || defaultEntrenchmentForLayer(belief.layer))}%</td>
          <td>${escapeHtml(belief.timeScope)}${belief.exceptions?.length ? `; exceptions: ${escapeHtml(belief.exceptions.join(", "))}` : ""}</td>
          <td>${escapeHtml(belief.provenance)}</td>
          <td>${escapeHtml(titleCase(belief.sensitivity))}</td>
          <td>${escapeHtml(claimStatusLabel(belief.status))}</td>
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
  const visibleRelations = getVisibleRelations().filter((relation) => {
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
              <small>${escapeHtml(propositionCoreLabel(belief))} · ${escapeHtml(belief.confidence)}% · ${escapeHtml(titleCase(belief.domain))}</small>
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
  const relationRows = getVisibleRelations().map((relation) => {
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
        <p>Create keyboard-editable support, attack, contradiction, entailment, undercut, scope, definition, dependency, and exception links for the agent graph.</p>
      </div>
      <span>${escapeHtml(getVisibleRelations().length)} / ${escapeHtml(state.relations.length)} links</span>
    </div>
    <form class="relation-form">
      <div class="error-summary relation-error-summary" role="alert" tabindex="-1" hidden></div>
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
  const bar = document.createElement("div");
  bar.className = "workbench-filter";
  const layerLabel = state.workbenchFilter === "all" ? "all claim families" : `${labelForLayer(state.workbenchFilter).toLowerCase()} claims`;
  bar.innerHTML = `
    <span>Showing ${escapeHtml(layerLabel)}</span>
    <label>
      <span class="visually-hidden">Relation type filter</span>
      <select name="relationTypeFilter">
        <option value="all">All relation types</option>
        ${agentContract.relationTypes.map((type) => `<option value="${escapeHtml(type)}"${state.relationTypeFilter === type ? " selected" : ""}>${escapeHtml(relationTypeLabel(type))}</option>`).join("")}
      </select>
    </label>
    <button type="button">Clear filters</button>
  `;
  bar.querySelector("select").addEventListener("change", (event) => {
    state.relationTypeFilter = event.target.value;
    saveState();
    renderClaimWorkbench();
  });
  bar.querySelector("button").addEventListener("click", () => {
    state.workbenchFilter = "all";
    state.relationTypeFilter = "all";
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
  if (!revision.affectedClaims?.length && revision.predictedResolutionScore === null && revision.disruptionCost === null && !revision.algorithmVersion) return "";
  const bits = [];
  if (revision.affectedClaims?.length) bits.push(`Affected ${revision.affectedClaims.join(", ")}`);
  if (revision.predictedResolutionScore !== null) bits.push(`Resolution ${Math.round(revision.predictedResolutionScore * 100)}%`);
  if (revision.disruptionCost !== null) bits.push(`Cost ${Number(revision.disruptionCost).toFixed(2)}`);
  if (revision.algorithmVersion) bits.push(revision.algorithmVersion);
  if (revision.beforeHash && revision.afterHash) bits.push(`${revision.beforeHash.slice(0, 8)} -> ${revision.afterHash.slice(0, 8)}`);
  return `<small class="revision-evidence">${escapeHtml(bits.join(" | "))}</small>`;
}

function renderAgentContract() {
  const examples = buildAgentRequestExamples();
  replaceChildren(
    els.agentContractList,
    [
      renderContractGroup("Architecture", Object.values(agentContract.architecture)),
      renderContractGroup("Public artifacts", agentContract.publicArtifacts),
      renderContractGroup("Agent profile fields", agentContract.agentProfileFields),
      renderContractGroup("Belief item fields", agentContract.beliefItemFields),
      renderContractGroup("Claim fields", agentContract.claimFields),
      renderContractGroup("Relation fields", agentContract.relationFields),
      renderContractGroup("Constraint fields", agentContract.constraintFields),
      renderContractGroup("Repair option fields", agentContract.repairOptionFields),
      renderContractGroup("Revision event fields", agentContract.revisionEventFields),
      renderContractGroup("Evidence request fields", agentContract.evidenceRequestFields),
      renderContractGroup("Rule-pack hooks", domainRulePacks.map((pack) => pack.id)),
      renderContractGroup("Export formats", agentContract.exportFormats),
      renderContractGroup("Local storage", [buildStorageReportPayload().summary]),
      renderContractGroup("Relation types", agentContract.relationTypes),
      renderContractGroup("Conflict kinds", agentContract.conflictKinds),
      renderContractGroup("Conflict classes", agentContract.conflictClasses),
      renderContractGroup("Conflict signals", agentContract.conflictSignals),
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
  const formal = getLatestFormalRun() || buildFormalTrace({ preview: true, analysisRun: latest });
  const argumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true, analysisRun: latest });
  const triage = getLatestTriageRun() || buildTriageRun({ preview: true, analysisRun: latest });
  const missingInfo = buildMissingInformationReport({ preview: true });
  const runLabel = getLatestAnalysisRun() ? `Run ${latest.id}` : "Ready to run";
  const summary = [
    ["Claims", latest.claimCount],
    ["Belief items", buildBeliefItems().length],
    ["Candidate pairs", latest.candidatePairs],
    ["Constraint hits", latest.constraintMatches || 0],
    ["Unsat cores", formal.unsatCores.length],
    ["Attack edges", argumentation.attackEdges.length],
    ["Evidence requests", missingInfo.requests.length],
    ["Rule packs", domainRulePacks.length],
    ["Triage flags", triage.formalizationCandidates.length],
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
  renderMissingInformationPanel(missingInfo);
  renderRulePackPanel();
  renderFormalTrace(formal);
  renderArgumentationReview(argumentation);
  renderTriageReview(triage);
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

function renderFormalTrace(formalRun = getLatestFormalRun() || buildFormalTrace({ preview: true })) {
  const statusItem = document.createElement("article");
  statusItem.className = `formal-trace-item is-${formalRun.status}`;
  statusItem.innerHTML = `
    <span class="formal-pill">${escapeHtml(formalRun.status.toUpperCase())}</span>
    <strong>${escapeHtml(formalRun.id)} · ${escapeHtml(formalRun.assertions.length)} named assertions</strong>
    <small>${escapeHtml(formalRun.unsatCores.length)} unsat core${formalRun.unsatCores.length === 1 ? "" : "s"} · ${escapeHtml(formalRun.constraints.length)} active templates</small>
  `;

  const coreItems = formalRun.unsatCores.slice(0, 3).map((core) => {
    const item = document.createElement("article");
    item.className = `formal-core-item severity-${core.severity || "medium"}`;
    item.innerHTML = `
      <span>${escapeHtml(core.id)} · ${escapeHtml(core.constraintId || core.conflictId || "tracked assertions")}</span>
      <strong>${escapeHtml((core.members || []).join(" + ") || "No named members")}</strong>
      <p>${escapeHtml(core.explanation || "No explanation recorded.")}</p>
      <small>${escapeHtml(core.repairRanking?.[0]?.title || "Repair ranking pending")}</small>
    `;
    return item;
  });

  if (!coreItems.length) {
    const empty = document.createElement("article");
    empty.className = "formal-core-empty";
    empty.innerHTML = `
      <strong>No hard unsat core found</strong>
      <span>Soft tensions remain reviewable through the conflict queue and probabilistic scoring.</span>
    `;
    coreItems.push(empty);
  }

  replaceChildren(els.formalTraceList, [statusItem, ...coreItems]);
}

function renderArgumentationReview(argumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true })) {
  const summaryItem = document.createElement("article");
  summaryItem.className = "argumentation-summary-item";
  summaryItem.innerHTML = `
    <span class="argumentation-pill">${escapeHtml(argumentation.id)}</span>
    <strong>${escapeHtml(argumentation.admissibleSet.length)} admissible claims</strong>
    <small>${escapeHtml(argumentation.attackEdges.length)} attacks · ${escapeHtml(argumentation.defenseEdges.length)} defenses · ${escapeHtml(argumentation.vulnerableClaims.length)} vulnerable</small>
  `;

  const defended = document.createElement("article");
  defended.className = "argumentation-item";
  defended.innerHTML = `
    <span>Grounded extension</span>
    <strong>${escapeHtml(argumentation.groundedExtension.join(" + ") || "No stable extension")}</strong>
    <p>${escapeHtml(argumentation.summary || "No argumentation summary recorded.")}</p>
  `;

  const vulnerable = document.createElement("article");
  vulnerable.className = "argumentation-item is-vulnerable";
  vulnerable.innerHTML = `
    <span>Vulnerable claims</span>
    <strong>${escapeHtml(argumentation.vulnerableClaims.map((item) => item.claimId).join(" + ") || "None")}</strong>
    <p>${escapeHtml(argumentation.vulnerableClaims[0]?.reason || "Every attacked claim has at least one visible counter-attack or support defense.")}</p>
  `;

  const topAttack = argumentation.attackEdges[0];
  const attacks = document.createElement("article");
  attacks.className = "argumentation-item";
  attacks.innerHTML = `
    <span>Strongest attack</span>
    <strong>${escapeHtml(topAttack ? `${topAttack.source} -> ${topAttack.target}` : "No attacks")}</strong>
    <p>${escapeHtml(topAttack?.rationale || "No conflict or undercut relation is active.")}</p>
  `;

  replaceChildren(els.argumentationList, [summaryItem, defended, vulnerable, attacks]);
}

function renderTriageReview(triage = getLatestTriageRun() || buildTriageRun({ preview: true })) {
  const summary = document.createElement("article");
  summary.className = "triage-summary-item";
  summary.innerHTML = `
    <span class="triage-pill">${escapeHtml(triage.nliMode)}</span>
    <strong>${escapeHtml(triage.queuedPairCount)} candidate pairs queued</strong>
    <small>${escapeHtml(triage.formalizationCandidates.length)} formalization flags · p95 ${escapeHtml(triage.probabilisticSummary?.estimatedLatency || 0)}s</small>
  `;

  const topItems = triage.reviewQueue.slice(0, 3).map((item) => {
    const article = document.createElement("article");
    article.className = `triage-item is-${item.priority || "review"}`;
    article.innerHTML = `
      <span>${escapeHtml(item.claimA)} / ${escapeHtml(item.claimB)} · ${escapeHtml(item.recommendation)}</span>
      <strong>${escapeHtml(Math.round(item.softTensionScore * 100))}% soft-tension score</strong>
      <p>${escapeHtml(item.explanation)}</p>
      <small>NLI ${escapeHtml(Math.round(item.contradictionProbability * 100))}% · overlap ${escapeHtml(Math.round(item.semanticOverlap * 100))}%</small>
    `;
    return article;
  });

  if (!topItems.length) {
    const empty = document.createElement("article");
    empty.className = "triage-empty";
    empty.innerHTML = `
      <strong>No candidate pairs queued</strong>
      <span>Add relations or cross-layer claims before running probabilistic triage.</span>
    `;
    topItems.push(empty);
  }

  replaceChildren(els.triageList, [summary, ...topItems]);
}

function renderMissingInformationPanel(report = buildMissingInformationReport({ preview: true })) {
  if (!els.missingInfoList) return;
  const requests = report.requests.slice(0, 8);
  replaceChildren(
    els.missingInfoList,
    requests.length
      ? requests.map(renderEvidenceRequestItem)
      : [emptyExplanationItem("No missing-information request is open for the current claim graph.")]
  );
}

function renderEvidenceRequestItem(request) {
  const item = document.createElement("article");
  item.className = `evidence-request-item is-${request.priority || "review"}`;
  item.innerHTML = `
    <span>${escapeHtml(request.id)} · ${escapeHtml(titleCase(String(request.priority || "review").replace(/_/g, " ")))}</span>
    <strong>${escapeHtml(request.targetId || request.targetType)}</strong>
    <p>${escapeHtml(request.prompt)}</p>
    <small>${escapeHtml(request.suggestedAction)} · ${escapeHtml(request.reason)}</small>
  `;
  return item;
}

function renderRulePackPanel() {
  if (!els.rulePackList) return;
  replaceChildren(
    els.rulePackList,
    domainRulePacks.map((pack) => {
      const item = document.createElement("article");
      item.className = "rule-pack-item";
      item.innerHTML = `
        <span>${escapeHtml(pack.engine)}</span>
        <strong>${escapeHtml(pack.label)}</strong>
        <p>${escapeHtml(pack.checks.join(", "))}</p>
        <small>${escapeHtml(pack.status)} · deterministic hook</small>
      `;
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
  const syncPacket = buildSyncPacketPayload();
  syncSecurityControlsForm();
  replaceChildren(
    els.privacyReceiptList,
    [
      ["Storage", receipt.processing.storageMode],
      ["Persistence", storage.summary],
      ["Privacy mode", privacyModeLabel(receipt.processing.privacyMode)],
      ["Cloud sync", receipt.processing.cloudSync ? "Opted in" : "Off"],
      ["Model triage", receipt.processing.nliTriage ? "Opted in" : "Off"],
      ["Retention", retentionLabel(receipt.processing.retention)],
      ["Encrypted archive", receipt.processing.encryptedArchive],
      ["Sync packet", syncPacket.readiness.status],
      ["Evidence requests", `${receipt.classification.evidenceRequests} open`],
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
    els.syncReadinessList,
    [
      ["Mode", syncPacket.workspace.mode],
      ["Readiness", `${Math.round(syncPacket.readiness.score * 100)}% · ${syncPacket.readiness.status}`],
      ["Consent", syncPacket.readiness.checks.cloudSyncConsent ? "Opted in" : "Local-only staged"],
      ["Encryption", syncPacket.manifest.encryption],
      ["Mutation set", `${syncPacket.mutationSet.count} changes`],
      ["Conflict policy", syncPacket.conflictPolicy.strategy],
      ["Workspace", syncPacket.backend.workspaceId || "not created"],
      ["Last sync", syncPacket.backend.lastStatus || "not synced"],
      ["Worker routes", `${syncPacket.edgeContract.routes.length} routes`],
      ["Delete support", syncPacket.edgeContract.deleteWorkflow],
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
      ["Incident runbook", security.controls.incidentRunbook],
      ["Model training", security.controls.modelTrainingPolicy],
      ["Human review", security.controls.humanReviewPath],
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
  const formalRun = buildFormalTrace({ analysisRun: run });
  state.formalRuns.push(formalRun);
  const argumentationRun = buildArgumentationRun({ analysisRun: run });
  state.argumentationRuns.push(argumentationRun);
  const triageRun = buildTriageRun({ analysisRun: run });
  state.triageRuns.push(triageRun);
  state.activeStage = "reflection";
  state.activeNav = "conflicts";
  recordRevision(
    "analysis",
    `${run.id} analyzed ${run.claimCount} claims, ${run.constraintCount} constraints, ${run.candidatePairs} candidate pairs, ${run.hardCount} hard conflicts, ${run.softCount} soft tensions, ${formalRun.unsatCores.length} formal unsat cores, ${argumentationRun.attackEdges.length} argumentation attacks, ${run.missingInfoCount} evidence requests, and ${triageRun.formalizationCandidates.length} NLI/probabilistic formalization flags.`
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
  const missingInfo = buildMissingInformationReport({ preview: true });
  const deterministicSignals = summarizeDeterministicSignals(generatedConflicts);
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
    missingInfoCount: missingInfo.requests.length,
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
      "Missing information requests",
    ],
    deterministicSignals,
    generatedConflicts,
    generatedConflictIds: generatedConflicts.map((conflict) => conflict.id),
  };
}

function buildBeliefItems() {
  return state.beliefs.map((belief) => {
    const claim = normalizeBelief(belief);
    return {
      id: claim.beliefItemId || `BI-${claim.id}`,
      family: claim.layer,
      rawText: claim.text,
      propositionObject: claim.propositionObject,
      confidence: claim.confidence,
      entrenchment: claim.entrenchment,
      scope: claim.scopeObject,
      provenance: claim.provenanceObject,
      evidenceRefs: claim.evidenceRefs,
      references: claim.references,
      claimIds: [claim.id],
      revisionStatus: claim.revisionStatus,
      normalizedClaims: [{
        id: claim.id,
        proposition: claim.proposition || claim.text,
        propositionObject: claim.propositionObject,
        canonicalForm: claim.canonicalForm,
        modality: claim.modality,
        polarity: claim.polarity,
        domain: claim.domain,
      }],
    };
  });
}

function buildMissingInformationReport({ preview = false } = {}) {
  const requests = detectMissingInformation();
  const grouped = requests.reduce((counts, request) => {
    counts[request.targetType] = (counts[request.targetType] || 0) + 1;
    return counts;
  }, {});
  return {
    id: preview ? "ER-preview" : `ER-${Date.now()}`,
    schemaVersion: `${WRE_SCHEMA_VERSION}-evidence-requests`,
    generatedAt: new Date().toISOString(),
    status: requests.length ? "needs-evidence" : "complete",
    requests,
    grouped,
  };
}

function detectMissingInformation() {
  const requests = [];
  const seen = new Set();
  const addRequest = (request) => {
    const key = `${request.targetType}:${request.targetId}:${request.reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    requests.push({
      id: `ER-${String(requests.length + 1).padStart(3, "0")}`,
      status: "open",
      ...request,
    });
  };

  state.beliefs.map(normalizeBelief).forEach((claim) => {
    if (!claim.scope || claim.scope === "Unscoped" || claim.scopeObject.conditions === "Unscoped") {
      addRequest({
        targetType: "claim",
        targetId: claim.id,
        priority: claim.entrenchment >= 75 ? "high" : "review",
        prompt: `Clarify the actor, time, jurisdiction, or conditions for ${claim.id}.`,
        reason: "scope-missing",
        suggestedAction: "add_scope_qualifier",
        targetClaims: [claim.id],
      });
    }
    if (!claim.provenance || claim.provenance === "User supplied") {
      addRequest({
        targetType: "claim",
        targetId: claim.id,
        priority: claim.confidence >= 80 ? "high" : "review",
        prompt: `Add provenance for ${claim.id} before using it as stable support.`,
        reason: "provenance-missing",
        suggestedAction: "request_missing_evidence",
        targetClaims: [claim.id],
      });
    }
    if (!claim.evidenceRefs.length && ["empirical", "conceptual"].includes(claim.domain)) {
      addRequest({
        targetType: "claim",
        targetId: claim.id,
        priority: claim.confidence >= 70 ? "high" : "review",
        prompt: `Attach evidence references for ${claim.id}.`,
        reason: "evidence-refs-missing",
        suggestedAction: "request_missing_evidence",
        targetClaims: [claim.id],
      });
    }
  });

  state.conflicts.map(normalizeConflict).forEach((conflict) => {
    const explanation = buildConflictExplanation(conflict);
    const priority = conflict.severity === "critical" || conflict.kind === "hard" ? "critical" : conflict.severity === "high" ? "high" : "review";
    if (!explanation.relationPath.length) {
      addRequest({
        targetType: "conflict",
        targetId: conflict.id,
        priority,
        prompt: `Add relation evidence for ${conflict.id}'s minimal conflict set.`,
        reason: "relation-path-missing",
        suggestedAction: "link_support_attack_or_definition",
        targetClaims: explanation.minimalConflictSet,
      });
    }
    if (!conflict.evidencePath.length && priority !== "review") {
      addRequest({
        targetType: "conflict",
        targetId: conflict.id,
        priority,
        prompt: `Attach evidence path or mark why ${conflict.id} should remain unresolved.`,
        reason: "conflict-evidence-missing",
        suggestedAction: "request_missing_evidence",
        targetClaims: explanation.minimalConflictSet,
      });
    }
  });

  return requests.slice(0, 16);
}

function buildEvidenceRequestsForConflict(conflict) {
  const explanation = buildConflictExplanation(conflict);
  const memberSet = new Set(explanation.minimalConflictSet);
  return buildMissingInformationReport({ preview: true }).requests.filter((request) => {
    if (request.targetType === "conflict" && request.targetId === conflict.id) return true;
    return (request.targetClaims || []).some((claimId) => memberSet.has(claimId));
  }).slice(0, 5);
}

function summarizeDeterministicSignals(generatedConflicts = []) {
  const counts = [...state.conflicts, ...generatedConflicts].reduce((summary, conflict) => {
    const signal = normalizeConflictSignal(conflict.signalType || (conflict.kind === "hard" ? "rule_constraint" : "semantic_tension"));
    summary[signal] = (summary[signal] || 0) + 1;
    return summary;
  }, {});
  return Object.entries(counts).map(([signal, count]) => ({ signal, count }));
}

function buildFormalTrace({ preview = false, analysisRun = null } = {}) {
  const run = analysisRun || getLatestAnalysisRun() || { id: preview ? "A-preview" : "" };
  const assertions = state.beliefs.map(buildNamedAssertion);
  const assertionByClaim = new Map(assertions.map((assertion) => [assertion.claimId, assertion]));
  const constraints = state.constraints
    .filter((constraint) => constraint.enabled)
    .map((constraint) => buildFormalConstraint(normalizeConstraint(constraint)));
  const unsatCores = collectFormalUnsatCores(assertionByClaim);
  const repairRanking = unsatCores
    .flatMap((core) => core.repairRanking.map((repair) => ({ ...repair, coreId: core.id })))
    .sort((a, b) => a.disruptionCost - b.disruptionCost || b.predictedResolutionScore - a.predictedResolutionScore)
    .slice(0, 8);
  const status = unsatCores.length ? "unsat" : "sat-with-soft-tensions";

  return normalizeFormalRun({
    id: preview ? "F-preview" : nextFormalRunId(),
    analysisRunId: run.id || "",
    time: new Date().toISOString(),
    status,
    satisfiable: !unsatCores.length,
    engineVersions: ["local-rule-v1", "smt-template-v1", "unsat-core-preview-v1", "repair-rank-v1"],
    assertions,
    constraints,
    unsatCores,
    softTensions: state.conflicts
      .filter((conflict) => conflict.kind !== "hard")
      .map((conflict) => ({
        conflictId: conflict.id,
        members: [...new Set([conflict.claimA, conflict.claimB, ...(conflict.core || [])].filter(Boolean))],
        confidence: Number(conflict.confidence || 0),
        explanation: conflict.why || conflict.summary || "",
      })),
    repairRanking,
  });
}

function buildNamedAssertion(claim) {
  const normalized = normalizeBelief(claim);
  return {
    id: `A-${normalized.id}`,
    claimId: normalized.id,
    smtName: claimSmtName(normalized.id),
    symbol: claimSymbol(normalized),
    literal: claimLiteral(normalized),
    propositionObject: normalized.propositionObject,
    exceptions: normalized.exceptions,
    polarity: normalized.polarity,
    modality: normalized.modality,
    layer: normalized.layer,
    kind: normalized.kind,
    domain: normalized.domain,
    scope: normalized.scope,
    scopeObject: normalized.scopeObject,
    confidence: normalized.confidence,
    entrenchment: normalized.entrenchment,
    source: normalized.provenance,
    sourceType: normalized.sourceType,
    evidenceRefs: normalized.evidenceRefs,
    sensitivity: normalized.sensitivity,
  };
}

function buildFormalConstraint(constraint) {
  const refs = extractClaimRefs(constraint.body);
  return {
    id: constraint.id,
    name: constraint.name,
    language: constraint.language,
    severity: constraint.severity,
    body: constraint.body,
    references: refs,
    smtTemplate: `(assert (! ${constraintFormula(constraint, refs)} :named ${constraint.id}))`,
  };
}

function collectFormalUnsatCores(assertionByClaim) {
  const cores = [];
  const seen = new Set();
  const addCore = (source, conflict, signal = {}) => {
    const members = [...new Set([conflict.claimA, conflict.claimB, ...(conflict.core || [])].filter(Boolean))];
    if (members.length < 2) return;
    const key = members.slice().sort().join(":");
    if (seen.has(key)) return;
    seen.add(key);
    const repairs = normalizeRepairsForCore(conflict);
    cores.push({
      id: `UC-${String(cores.length + 1).padStart(3, "0")}`,
      source,
      conflictId: conflict.id || "",
      constraintId: conflict.constraintId || signal.constraintId || inferConstraintForMembers(members)?.id || "",
      status: conflict.status || "open",
      severity: signal.severity || conflict.severity || "high",
      confidence: Number(signal.confidence || conflict.confidence || 0.8),
      members,
      namedAssertions: members.map((member) => assertionByClaim.get(member)?.id || `A-${member}`),
      explanation: signal.why || conflict.why || conflict.summary || "Tracked assertions cannot all remain active under the current hard constraints.",
      repairRanking: repairs,
    });
  };

  state.conflicts
    .filter((conflict) => conflict.kind === "hard" && conflict.status !== "ignored")
    .forEach((conflict) => addCore("conflict-queue", conflict));

  getCandidatePairs().forEach(({ claimA, claimB }) => {
    const signal = scoreConstraintPair(claimA, claimB, `${claimA.text.toLowerCase()} ${claimB.text.toLowerCase()}`);
    if (!signal || signal.kind !== "hard") return;
    addCore("constraint-workbench", {
      id: "",
      claimA: claimA.id,
      claimB: claimB.id,
      core: [claimA.id, claimB.id],
      kind: "hard",
      severity: signal.severity,
      confidence: signal.confidence,
      constraintId: signal.constraintId,
      why: signal.why,
      repairs: [{
        id: `R-${signal.constraintId || "K"}`,
        title: "Clarify Constraint Scope",
        text: "Add an exception, validation boundary, or confidence downgrade before using these assertions together.",
        cost: "0.62",
        badge: "Suggested",
        tone: "high",
      }],
    }, signal);
  });

  return cores;
}

function normalizeRepairsForCore(conflict) {
  const repairs = Array.isArray(conflict.repairs) && conflict.repairs.length
    ? conflict.repairs
    : [{
      id: `R-${conflict.id || "UC"}`,
      title: "Review Core Members",
      text: "Retract, weaken, split, or scope one assertion in the unsat core.",
      cost: "0.7",
      badge: "Fallback",
      tone: "medium",
    }];

  return repairs.map((repair) => {
    const actionType = inferRepairActionType(repair);
    const disruptionCost = Number.isFinite(Number(repair.cost)) ? Number(repair.cost) : 0.7;
    return {
      id: repair.id,
      title: repair.title || "Repair option",
      actionType,
      affectedClaims: [...new Set([inferRepairTargetClaimId(conflict, repair), ...(conflict.core || [])].filter(Boolean))],
      predictedResolutionScore: roundNumber(clamp(0.96 - disruptionCost * 0.25 + (conflict.kind === "hard" ? 0.03 : 0), 0.42, 0.94)),
      disruptionCost,
      explanation: repair.text || "Minimal-change repair candidate.",
    };
  }).sort((a, b) => a.disruptionCost - b.disruptionCost);
}

function inferConstraintForMembers(members) {
  return state.constraints.find((constraint) => {
    if (!constraint.enabled) return false;
    const refs = extractClaimRefs(constraint.body);
    return refs.length && refs.every((ref) => members.includes(ref));
  });
}

function claimSymbol(claim) {
  return `${claim.layer}_${claim.domain}_${claim.id}`.replace(/[^a-z0-9_]+/gi, "_").toLowerCase();
}

function claimLiteral(claim) {
  const tokens = claim.text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["should", "because", "where", "when", "only", "with"].includes(token))
    .slice(0, 5);
  return tokens.join("_") || claimSymbol(claim);
}

function inferClaimPolarity(text) {
  return /\b(no|not|never|without|prohibit|reject)\b/i.test(text) ? "negative" : "positive";
}

function constraintFormula(constraint, refs) {
  if (refs.length) return `(=> (and ${refs.map(claimSmtName).join(" ")}) ${constraint.severity === "critical" ? "false" : "review_required"})`;
  const name = constraint.name.replace(/[^a-z0-9_]+/gi, "_").toLowerCase();
  return `(${constraint.language}_${name || "constraint"} active)`;
}

function claimSmtName(claimId) {
  return `A_${String(claimId || "claim").replace(/[^a-z0-9_]+/gi, "_")}`;
}

function buildArgumentationRun({ preview = false, analysisRun = null } = {}) {
  const run = analysisRun || getLatestAnalysisRun() || { id: preview ? "A-preview" : "" };
  const claimIds = state.beliefs.map((belief) => belief.id);
  const supportEdges = buildSupportEdges();
  const attackEdges = buildAttackEdges();
  const defenseEdges = buildDefenseEdges(attackEdges, supportEdges);
  const vulnerableClaims = buildVulnerableClaims(claimIds, attackEdges, defenseEdges);
  const admissibleSet = buildAdmissibleSet(claimIds, attackEdges, defenseEdges);
  const groundedExtension = buildGroundedExtension(claimIds, attackEdges);
  const contestedClaims = claimIds
    .filter((claimId) => attackEdges.some((edge) => edge.source === claimId || edge.target === claimId))
    .map((claimId) => ({
      claimId,
      attacksOut: attackEdges.filter((edge) => edge.source === claimId).length,
      attacksIn: attackEdges.filter((edge) => edge.target === claimId).length,
      defended: defenseEdges.some((edge) => edge.defended === claimId),
    }));

  return normalizeArgumentationRun({
    id: preview ? "G-preview" : nextArgumentationRunId(),
    analysisRunId: run.id || "",
    time: new Date().toISOString(),
    attackEdges,
    supportEdges,
    defenseEdges,
    admissibleSet,
    groundedExtension,
    vulnerableClaims,
    contestedClaims,
    summary: `${admissibleSet.length}/${claimIds.length} claims are in the admissible working set; ${vulnerableClaims.length} attacked claim${vulnerableClaims.length === 1 ? "" : "s"} ${vulnerableClaims.length === 1 ? "lacks" : "lack"} a visible counter-attack or support defense.`,
    engineVersions: ["argumentation-graph-v1", "attack-defense-v1", "admissible-set-preview-v1"],
  });
}

function buildSupportEdges() {
  const edges = [];
  const seen = new Set();
  state.relations
    .filter((relation) => ["supports", "implies", "entails", "depends_on", "scopes", "defines", "exception_to"].includes(relation.type))
    .forEach((relation) => {
      addArgumentEdge(edges, seen, {
        id: `S-${relation.id}`,
        source: relation.source,
        target: relation.target,
        relationId: relation.id,
        type: relation.type,
        weight: Number(relation.weight || 0.6),
        rationale: relation.rationale || `${relation.source} ${relationTypeLabel(relation.type).toLowerCase()} ${relation.target}.`,
      });
    });
  return edges.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
}

function buildAttackEdges() {
  const edges = [];
  const seen = new Set();
  state.relations
    .filter((relation) => ["attacks", "contradicts", "undercuts"].includes(relation.type))
    .forEach((relation) => {
      addArgumentEdge(edges, seen, {
        id: `AT-${relation.id}`,
        source: relation.source,
        target: relation.target,
        relationId: relation.id,
        type: relation.type === "undercuts" ? "undercut" : "attack",
        weight: Number(relation.weight || 0.7),
        rationale: relation.rationale || `${relation.source} attacks ${relation.target}.`,
      });
      if (relation.type === "contradicts") {
        addArgumentEdge(edges, seen, {
          id: `AT-${relation.id}-R`,
          source: relation.target,
          target: relation.source,
          relationId: relation.id,
          type: "attack",
          weight: Number(relation.weight || 0.7),
          rationale: relation.rationale || `${relation.target} attacks ${relation.source}.`,
        });
      }
    });

  state.conflicts
    .filter((conflict) => conflict.status !== "ignored")
    .forEach((conflict) => {
      const weight = conflictWeight(conflict);
      addArgumentEdge(edges, seen, {
        id: `AT-${conflict.id}-A`,
        source: conflict.claimA,
        target: conflict.claimB,
        conflictId: conflict.id,
        type: conflict.kind === "hard" ? "hard-attack" : "soft-attack",
        weight,
        rationale: conflict.why || conflict.summary || `${conflict.claimA} conflicts with ${conflict.claimB}.`,
      });
      addArgumentEdge(edges, seen, {
        id: `AT-${conflict.id}-B`,
        source: conflict.claimB,
        target: conflict.claimA,
        conflictId: conflict.id,
        type: conflict.kind === "hard" ? "hard-attack" : "soft-attack",
        weight,
        rationale: conflict.why || conflict.summary || `${conflict.claimB} conflicts with ${conflict.claimA}.`,
      });
    });

  return edges.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
}

function buildDefenseEdges(attackEdges, supportEdges) {
  const defenses = [];
  const seen = new Set();
  attackEdges.forEach((attack) => {
    attackEdges
      .filter((counter) => counter.target === attack.source && counter.source !== attack.target)
      .forEach((counter) => {
        addDefenseEdge(defenses, seen, {
          id: `D-${counter.id}-${attack.id}`,
          defender: counter.source,
          defended: attack.target,
          attacker: attack.source,
          mode: "counter-attack",
          weight: roundNumber((counter.weight + attack.weight) / 2),
          rationale: `${counter.source} counter-attacks ${attack.source}, defending ${attack.target}.`,
        });
      });
    supportEdges
      .filter((support) => support.target === attack.target && support.source !== attack.source)
      .forEach((support) => {
        addDefenseEdge(defenses, seen, {
          id: `D-${support.id}-${attack.id}`,
          defender: support.source,
          defended: attack.target,
          attacker: attack.source,
          mode: "support-backed",
          weight: roundNumber((support.weight + attack.weight) / 2),
          rationale: `${support.source} supports ${attack.target} against ${attack.source}.`,
        });
      });
  });
  return defenses.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
}

function buildVulnerableClaims(claimIds, attackEdges, defenseEdges) {
  return claimIds
    .map((claimId) => {
      const incoming = attackEdges.filter((edge) => edge.target === claimId);
      if (!incoming.length) return null;
      const defended = incoming.every((attack) => {
        return defenseEdges.some((defense) => defense.defended === claimId && defense.attacker === attack.source);
      });
      if (defended) return null;
      const strongest = incoming[0];
      return {
        claimId,
        incomingAttacks: incoming.length,
        strongestAttack: strongest.id,
        reason: `${claimId} is attacked by ${strongest.source} without a complete visible defense set.`,
      };
    })
    .filter(Boolean);
}

function buildAdmissibleSet(claimIds, attackEdges, defenseEdges) {
  const defended = claimIds.filter((claimId) => {
    const incoming = attackEdges.filter((edge) => edge.target === claimId);
    if (!incoming.length) return true;
    return incoming.every((attack) => {
      return defenseEdges.some((defense) => defense.defended === claimId && defense.attacker === attack.source);
    });
  });

  return defended.filter((claimId) => {
    return !attackEdges.some((edge) => {
      if (edge.target !== claimId || !defended.includes(edge.source)) return false;
      return !defenseEdges.some((defense) => defense.defended === claimId && defense.attacker === edge.source);
    });
  });
}

function buildGroundedExtension(claimIds, attackEdges) {
  const accepted = new Set(claimIds.filter((claimId) => !attackEdges.some((edge) => edge.target === claimId)));
  const rejected = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    attackEdges.forEach((edge) => {
      if (accepted.has(edge.source) && !rejected.has(edge.target)) {
        rejected.add(edge.target);
        changed = true;
      }
    });
    claimIds.forEach((claimId) => {
      if (accepted.has(claimId) || rejected.has(claimId)) return;
      const attackers = attackEdges.filter((edge) => edge.target === claimId).map((edge) => edge.source);
      if (attackers.length && attackers.every((attacker) => rejected.has(attacker))) {
        accepted.add(claimId);
        changed = true;
      }
    });
  }
  return [...accepted];
}

function addArgumentEdge(edges, seen, edge) {
  if (!edge.source || !edge.target || edge.source === edge.target || !findBelief(edge.source) || !findBelief(edge.target)) return;
  const key = `${edge.source}:${edge.type}:${edge.target}:${edge.conflictId || edge.relationId || ""}`;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push({
    ...edge,
    weight: roundNumber(clamp(Number(edge.weight || 0.6), 0, 1)),
  });
}

function addDefenseEdge(edges, seen, edge) {
  if (!edge.defender || !edge.defended || !edge.attacker || edge.defender === edge.defended) return;
  const key = `${edge.defender}:${edge.mode}:${edge.defended}:${edge.attacker}`;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push(edge);
}

function conflictWeight(conflict) {
  const severityBoost = conflict.severity === "critical" ? 0.16 : conflict.severity === "high" ? 0.1 : conflict.severity === "medium" ? 0.04 : 0;
  return roundNumber(clamp(Number(conflict.confidence || 0.65) + severityBoost, 0.45, 0.98));
}

function leastEntrenchedClaimId(claims) {
  return claims
    .filter(Boolean)
    .map((claim) => normalizeBelief(claim))
    .sort((a, b) => {
      const aCost = Number(a.entrenchment || defaultEntrenchmentForLayer(a.layer)) + Number(a.confidence || 50) * 0.2;
      const bCost = Number(b.entrenchment || defaultEntrenchmentForLayer(b.layer)) + Number(b.confidence || 50) * 0.2;
      return aCost - bCost;
    })[0]?.id || "";
}

function buildTriageRun({ preview = false, analysisRun = null } = {}) {
  const run = analysisRun || getLatestAnalysisRun() || { id: preview ? "A-preview" : "" };
  const security = buildSecurityReportPayload();
  const candidateLimit = state.privacy.nliTriage
    ? security.controls.nliPairCap
    : Math.min(10, security.controls.nliPairCap || 10);
  const scored = getCandidatePairs()
    .map(({ claimA, claimB, reason }) => scoreTriagePair(claimA, claimB, reason))
    .filter(Boolean)
    .sort((a, b) => b.softTensionScore - a.softTensionScore || b.contradictionProbability - a.contradictionProbability)
    .slice(0, Math.max(candidateLimit, 0));
  const reviewQueue = scored.slice(0, 8);
  const formalizationCandidates = reviewQueue.filter((item) => {
    return item.contradictionProbability >= 0.72 && item.softTensionScore >= 0.24;
  }).map((item) => ({
    claimA: item.claimA,
    claimB: item.claimB,
    reason: item.explanation,
    suggestedConstraint: `If @${item.claimA} and @${item.claimB} remain active, require an explicit scope boundary before treating them as jointly stable.`,
    estimatedFormalizationConfidence: roundNumber(clamp((item.contradictionProbability + item.softTensionScore) / 2, 0, 1)),
  }));
  const averageScore = reviewQueue.length
    ? roundNumber(reviewQueue.reduce((sum, item) => sum + item.softTensionScore, 0) / reviewQueue.length)
    : 0;

  return normalizeTriageRun({
    id: preview ? "N-preview" : nextTriageRunId(),
    analysisRunId: run.id || "",
    time: new Date().toISOString(),
    nliMode: state.privacy.nliTriage ? "opt-in-selected-pairs" : "local-preview",
    externalProcessing: false,
    candidateLimit,
    queuedPairCount: scored.length,
    reviewQueue,
    formalizationCandidates,
    probabilisticSummary: {
      averageSoftTensionScore: averageScore,
      maxSoftTensionScore: reviewQueue[0]?.softTensionScore || 0,
      threshold: 0.24,
      estimatedLatency: roundNumber(0.16 + scored.length * (state.privacy.nliTriage ? 0.18 : 0.04)),
      scoringFormula: "contradiction_probability * semantic_overlap * confidence_weight * provenance_weight * relation_modifier",
      externalModelCalls: 0,
    },
    adapter: state.privacy.nliTriage ? "selected-pair-nli-adapter-ready-v1" : "local-heuristic-nli-v1",
  });
}

function scoreTriagePair(claimA, claimB, reason) {
  const relationContext = getRelationsBetween(claimA.id, claimB.id);
  const joined = `${claimA.text.toLowerCase()} ${claimB.text.toLowerCase()}`;
  const semanticOverlap = Math.max(tokenOverlap(claimA.text.toLowerCase(), claimB.text.toLowerCase()), relationContext.length ? 0.34 : 0);
  const contradictionProbability = estimateContradictionProbability(claimA, claimB, relationContext, joined);
  if (contradictionProbability < 0.32 && semanticOverlap < 0.32) return null;
  const confidenceWeight = roundNumber(((Number(claimA.confidence || 50) + Number(claimB.confidence || 50)) / 2) / 100);
  const provenanceWeight = roundNumber((provenanceScore(claimA) + provenanceScore(claimB)) / 2);
  const relationModifier = relationContext.some((relation) => ["supports", "implies", "entails"].includes(relation.type))
    ? 1.15
    : relationContext.some((relation) => ["attacks", "contradicts", "undercuts"].includes(relation.type))
      ? 1.1
      : 1;
  const softTensionScore = roundNumber(clamp(
    contradictionProbability * Math.max(semanticOverlap, 0.28) * confidenceWeight * provenanceWeight * relationModifier,
    0,
    1
  ));
  const recommendation = contradictionProbability >= 0.78
    ? "formalize"
    : softTensionScore >= 0.24
      ? "human-review"
      : "watch";
  const priority = recommendation === "formalize" ? "high" : recommendation === "human-review" ? "review" : "watch";

  return {
    id: `NLI-${claimA.id}-${claimB.id}`,
    claimA: claimA.id,
    claimB: claimB.id,
    retrievalReason: reason || "candidate-pair",
    semanticOverlap: roundNumber(semanticOverlap),
    contradictionProbability,
    entailmentProbability: estimateEntailmentProbability(relationContext, semanticOverlap, contradictionProbability),
    neutralityProbability: roundNumber(clamp(1 - Math.max(contradictionProbability, semanticOverlap * 0.65), 0, 1)),
    confidenceWeight,
    provenanceWeight,
    relationModifier,
    softTensionScore,
    recommendation,
    priority,
    explanation: explainTriagePair(claimA, claimB, contradictionProbability, softTensionScore, relationContext),
  };
}

function estimateContradictionProbability(claimA, claimB, relationContext, joined) {
  const explicitAttack = relationContext.find((relation) => ["attacks", "contradicts", "undercuts"].includes(relation.type));
  if (explicitAttack) return roundNumber(clamp(Number(explicitAttack.weight || 0.7) + 0.08, 0.55, 0.96));
  const existingConflict = state.conflicts.find((conflict) => {
    const members = new Set([conflict.claimA, conflict.claimB, ...(conflict.core || [])].filter(Boolean));
    return members.has(claimA.id) && members.has(claimB.id);
  });
  if (existingConflict) return roundNumber(clamp(Number(existingConflict.confidence || 0.7) + (existingConflict.kind === "hard" ? 0.1 : 0), 0.5, 0.96));
  if (joined.includes("protected attribute") && (joined.includes("reject") || joined.includes("proxy"))) return 0.86;
  if (joined.includes("transparen") && (joined.includes("confidential") || joined.includes("trade secret") || joined.includes("internal notes"))) return 0.76;
  if (inferClaimPolarity(claimA.text) !== inferClaimPolarity(claimB.text) && tokenOverlap(claimA.text.toLowerCase(), claimB.text.toLowerCase()) >= 0.24) return 0.7;
  if (claimA.layer !== claimB.layer && tokenOverlap(claimA.text.toLowerCase(), claimB.text.toLowerCase()) >= 0.4) return 0.58;
  return roundNumber(clamp(0.28 + tokenOverlap(claimA.text.toLowerCase(), claimB.text.toLowerCase()) * 0.52, 0.18, 0.68));
}

function estimateEntailmentProbability(relationContext, semanticOverlap, contradictionProbability) {
  const support = relationContext.find((relation) => ["supports", "implies", "entails", "depends_on", "scopes", "defines", "exception_to"].includes(relation.type));
  const base = support ? Number(support.weight || 0.62) : semanticOverlap * 0.45;
  return roundNumber(clamp(base * (1 - contradictionProbability * 0.5), 0, 0.92));
}

function provenanceScore(claim) {
  const source = `${claim.provenance || ""} ${claim.timeScope || ""}`.toLowerCase();
  if (source.includes("research") || source.includes("law") || source.includes("audit")) return 0.94;
  if (source.includes("rubric") || source.includes("structured") || source.includes("principle")) return 0.88;
  if (source.trim()) return 0.8;
  return 0.62;
}

function explainTriagePair(claimA, claimB, contradictionProbability, softTensionScore, relationContext) {
  const relationLabel = relationContext.length
    ? ` Existing relation context: ${relationContext.map((relation) => relationTypeLabel(relation.type)).join(", ")}.`
    : "";
  if (contradictionProbability >= 0.78) return `${claimA.id} and ${claimB.id} look like a high-contradiction pair and should be formalized before repair ranking.${relationLabel}`;
  if (softTensionScore >= 0.24) return `${claimA.id} and ${claimB.id} have enough semantic overlap, confidence, and provenance weight to enter human soft-tension review.${relationLabel}`;
  return `${claimA.id} and ${claimB.id} are related enough to watch, but current probability stays below the review threshold.${relationLabel}`;
}

function buildEvaluationReport({ preview = false } = {}) {
  const latestAnalysis = getLatestAnalysisRun() || buildAnalysisReport({ preview: true });
  const latestFormal = getLatestFormalRun() || buildFormalTrace({ preview: true, analysisRun: latestAnalysis });
  const latestArgumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true, analysisRun: latestAnalysis });
  const latestTriage = getLatestTriageRun() || buildTriageRun({ preview: true, analysisRun: latestAnalysis });
  const explanationReady = state.conflicts.filter((conflict) => conflict.why && conflict.core?.length && conflict.repairs?.length).length;
  const explanationCoverage = explanationReady / Math.max(1, state.conflicts.length);
  const explanationUsefulness = roundNumber(clamp(1 + explanationCoverage * 4, 1, 5));
  const repairedConflicts = state.conflicts.filter((conflict) => conflict.status === "repaired").length;
  const acceptedTensions = state.conflicts.filter((conflict) => conflict.status === "accepted_tension").length;
  const repairAcceptance = roundNumber((repairedConflicts + state.repairApplications.length) / Math.max(1, state.conflicts.length));
  const coreTaskCompletion = roundNumber([
    state.beliefs.length >= 3,
    state.relations.length >= 1,
    state.conflicts.some((conflict) => buildConflictExplanation(conflict).relationPath.length || conflict.why),
    state.conflicts.some((conflict) => conflict.repairs?.length),
    Boolean(repairedConflicts || acceptedTensions || state.revisions.length),
  ].filter(Boolean).length / 5);
  const firstExplainedConflictSeconds = state.conflicts.some((conflict) => conflict.why && conflict.core?.length) ? 90 : 240;
  const susProxy = roundNumber(clamp(68 + coreTaskCompletion * 18 - (state.conflicts.length > 12 ? 4 : 0), 0, 100));
  const nasaTlxProxy = roundNumber(clamp(58 - coreTaskCompletion * 18 + Math.max(0, state.conflicts.length - 8), 0, 100));
  const repairReversalRate = roundNumber(state.repairApplications.length
    ? state.revisions.filter((revision) => /revers|undo|rollback/i.test(revision.text || "")).length / state.repairApplications.length
    : 0);
  const aiSuggestionOverrideLogged = Boolean(state.triageRuns.length || state.revisions.some((revision) => /assist|suggest|override/i.test(revision.text || "")));
  const accessibility = buildAccessibilityReportPayload();
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const criticalA11y = Object.values(accessibility.checks).filter((value) => value === false).length;
  const restoreReady = hasWebCrypto() && Boolean(els.exportEncryptedBtn && els.encryptedArchiveInput);
  const storageReady = storage.indexedDb.primary || state.privacy.retention === "session-only";
  const syncPacket = buildSyncPacketPayload();
  const missingInfo = buildMissingInformationReport({ preview: true });
  const publicSchema = buildJsonSchemasPayload();
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
    buildEvaluationMetric("unsatCoreTrace", "Unsat-core trace", latestFormal.unsatCores.length ? 1 : 0.5, 1, ">=", "", `${latestFormal.id} is ${latestFormal.status} with ${latestFormal.assertions.length} assertions and ${latestFormal.unsatCores.length} core(s).`),
    buildEvaluationMetric("argumentationCoverage", "Argumentation coverage", latestArgumentation.attackEdges.length ? 1 : 0.5, 1, ">=", "", `${latestArgumentation.id} has ${latestArgumentation.attackEdges.length} attacks, ${latestArgumentation.defenseEdges.length} defenses, and ${latestArgumentation.admissibleSet.length} admissible claims.`),
    buildEvaluationMetric("triageCoverage", "NLI/probabilistic triage", latestTriage.reviewQueue.length ? 1 : 0.5, 1, ">=", "", `${latestTriage.id} scored ${latestTriage.reviewQueue.length} candidate pairs with ${latestTriage.formalizationCandidates.length} formalization flags and no external model calls.`),
    buildEvaluationMetric("missingInfoDetection", "Missing information detection", missingInfo.requests.length ? 1 : 0.5, 1, ">=", "", `${missingInfo.requests.length} claim/conflict evidence requests generated from provenance, scope, and relation gaps.`),
    buildEvaluationMetric("publicSchemaContract", "Public schema contract", publicSchema.schemas.BeliefItem && publicSchema.schemas.Claim && publicSchema.schemas.PropositionObject && publicSchema.schemas.EvidenceRequest ? 1 : 0, 1, "===", "", `${Object.keys(publicSchema.schemas).length} WRE5 JSON schemas available for export and SDK use.`),
    buildEvaluationMetric("repairAcceptance", "Repair acceptance", repairAcceptance, 0.35, ">=", "", `${repairedConflicts} repaired conflicts and ${state.repairApplications.length} recorded applications.`),
    buildEvaluationMetric("taskCompletion", "Core task completion", coreTaskCompletion, 0.8, ">=", "", "Covers entering claims, linking relations, seeing an explained conflict, and deciding repair or accepted tension."),
    buildEvaluationMetric("timeToFirstExplainedConflict", "Time to first explained conflict", firstExplainedConflictSeconds, 180, "<=", "s", "Proxy target for private-beta observation; conflict detail is visible immediately in the seeded session."),
    buildEvaluationMetric("sus", "System Usability Scale", susProxy, 75, ">=", "", "Proxy until private-beta SUS responses are imported."),
    buildEvaluationMetric("nasaTlx", "NASA-TLX workload", nasaTlxProxy, 45, "<=", "", "Proxy until private-beta NASA-TLX responses are imported."),
    buildEvaluationMetric("repairReversal", "Repair reversal rate", repairReversalRate, 0.2, "<=", "", `${state.repairApplications.length} repair application(s) and no explicit rollback unless revision text says so.`),
    buildEvaluationMetric("aiOverride", "AI suggestion override tracking", aiSuggestionOverrideLogged ? 1 : 0.8, 1, ">=", "", "Optional AI/NLI suggestions are surfaced as review queues and revision text can record override decisions."),
    buildEvaluationMetric("ruleLatency", "Rule-only latency", latestAnalysis.estimatedRuleLatency, 1.5, "<", "s", `${latestAnalysis.candidatePairs} candidate pairs in the local deterministic pass.`),
    buildEvaluationMetric("hybridLatency", "Hybrid latency", latestAnalysis.estimatedHybridLatency, 7, "<", "s", `${latestAnalysis.nliQueued} NLI items queued under current privacy settings.`),
    buildEvaluationMetric("apiAbuseResistance", "API abuse resistance", abuseReadiness, 0.8, ">=", "", security.summary.abuseResistance),
    buildEvaluationMetric("localFirstPersistence", "Local-first persistence", storageReady ? 1 : 0.5, 1, ">=", "", storage.summary),
    buildEvaluationMetric("syncPacketReadiness", "Optional sync packet", syncPacket.readiness.score, 0.8, ">=", "", `${syncPacket.readiness.status}; ${syncPacket.mutationSet.count} local changes packaged for Worker sync.`),
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
      syncPacket,
      formalTrace: latestFormal,
      argumentation: latestArgumentation,
      triage: latestTriage,
      missingInformation: missingInfo,
      privacyReceipt: buildPrivacyReceiptPayload(),
    },
  });
}

function buildEvaluationMetric(id, label, value, target, comparator, unit, evidence) {
  const normalizedValue = roundNumber(Number(value));
  const passes = comparator === ">="
    ? normalizedValue >= target
    : comparator === ">"
      ? normalizedValue > target
      : comparator === "<="
        ? normalizedValue <= target
        : comparator === "<"
          ? normalizedValue < target
          : normalizedValue === target;
  const close = comparator === ">="
    ? normalizedValue >= target * 0.8
    : comparator === ">"
      ? normalizedValue > target * 0.8
      : comparator === "<=" || comparator === "<"
        ? normalizedValue <= target * 1.25
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
  const unsupported = detectUnsupportedBeliefConflicts(nextNumber + generated.length);
  generated.push(...unsupported);
  return generated.slice(0, 5);
}

function detectUnsupportedBeliefConflicts(startNumber) {
  return state.beliefs
    .map(normalizeBelief)
    .filter((claim) => {
      if (state.conflicts.some((conflict) => conflict.conflictClass === "unsupported_belief" && conflict.core?.includes(claim.id))) return false;
      const centrality = state.relations.filter((relation) => relation.source === claim.id || relation.target === claim.id).length;
      return claim.status === "active" && claim.confidence >= 80 && centrality >= 1 && !claim.evidenceRefs.length && claim.provenance === "User supplied";
    })
    .slice(0, 2)
    .map((claim, index) => createUnsupportedBeliefConflict(claim, startNumber + index));
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
  const deterministicSignal = scoreDeterministicPair(claimA, claimB, overlap, relationContext);
  if (deterministicSignal) return deterministicSignal;
  const constraintSignal = scoreConstraintPair(claimA, claimB, joined);
  if (constraintSignal) return constraintSignal;
  const explicitConflict = relationContext.find((relation) => ["attacks", "contradicts", "undercuts"].includes(relation.type));

  if (explicitConflict && explicitConflict.weight >= 0.55) {
    return {
      kind: explicitConflict.type === "contradicts" ? "hard" : "soft",
      severity: explicitConflict.weight >= 0.78 ? "high" : "medium",
      confidence: roundNumber(clamp(explicitConflict.weight, 0.55, 0.95)),
      signalType: explicitConflict.type === "contradicts" ? "direct_negation" : "semantic_tension",
      conflictClass: explicitConflict.type === "contradicts" ? "direct_contradiction" : crossLayerConflictClass(claimA, claimB),
      engine: ["Argument graph", "Rule constraint", "Repair ranking"],
      why: `The explicit ${relationTypeLabel(explicitConflict.type).toLowerCase()} relation between ${claimA.id} and ${claimB.id} is strong enough to require review: ${explicitConflict.rationale}`,
    };
  }

  if (joined.includes("protected attribute") && (joined.includes("reject") || joined.includes("proxy"))) {
    return {
      kind: "hard",
      severity: "high",
      confidence: 0.82,
      signalType: "rule_constraint",
      conflictClass: crossLayerConflictClass(claimA, claimB),
      engine: ["Rule constraint", "SMT core template", "Repair ranking"],
      why: "Protected-attribute language appears in a candidate exclusion context; this should be treated as a hard rule-check candidate.",
    };
  }

  if (joined.includes("transparen") && (joined.includes("confidential") || joined.includes("trade secret"))) {
    return {
      kind: "soft",
      severity: "medium",
      confidence: 0.76,
      signalType: "scope_clash",
      conflictClass: "scope_exception_mismatch",
      engine: ["Argument graph", "NLI triage", "Human review"],
      why: "Transparency and confidentiality/trade-secret claims appear in the same scope and should be reconciled with a disclosure boundary.",
    };
  }

  if (overlap > 0.42 && claimA.layer !== claimB.layer && Math.abs(claimA.confidence - claimB.confidence) <= 20) {
    return {
      kind: "soft",
      severity: "low",
      confidence: roundNumber(0.58 + overlap * 0.32),
      signalType: "semantic_tension",
      conflictClass: crossLayerConflictClass(claimA, claimB),
      engine: ["Argument graph", "Probabilistic tension score", "Human review"],
      why: "These claims share enough concepts across WRE layers to deserve a soft-tension review before they are used as mutual support.",
    };
  }

  return null;
}

function scoreDeterministicPair(claimA, claimB, overlap, relationContext) {
  const polarityA = normalizeClaimPolarity(claimA.polarity, claimA.text);
  const polarityB = normalizeClaimPolarity(claimB.polarity, claimB.text);
  const modalityA = normalizeClaimModality(claimA.modality, claimA.text);
  const modalityB = normalizeClaimModality(claimB.modality, claimB.text);
  const samePredicate = sameCoreProposition(claimA, claimB) || samePredicateKey(claimA, claimB) || overlap >= 0.58;
  const explicitEntailment = relationContext.find((relation) => relation.type === "implies" || relation.type === "entails");
  const explicitDefinition = relationContext.find((relation) => relation.type === "defines");

  if (samePredicate && polarityA !== "mixed" && polarityB !== "mixed" && polarityA !== "unknown" && polarityB !== "unknown" && polarityA !== polarityB) {
    return {
      kind: "hard",
      severity: "critical",
      confidence: roundNumber(clamp(0.78 + overlap * 0.2, 0.78, 0.96)),
      signalType: "direct_negation",
      conflictClass: "direct_contradiction",
      engine: ["Direct contradiction", "Typed proposition check", "Repair ranking"],
      why: `${claimA.id} and ${claimB.id} share a typed actor/action/object scope but assert opposite polarity.`,
    };
  }

  if (samePredicate && isDeonticClash(modalityA, modalityB)) {
    return {
      kind: "hard",
      severity: "high",
      confidence: roundNumber(clamp(0.74 + overlap * 0.18, 0.74, 0.93)),
      signalType: "deontic_clash",
      conflictClass: "deontic_clash",
      engine: ["Deontic modality check", "Same-proposition check", "Repair ranking"],
      why: `${claimA.id} and ${claimB.id} assign incompatible deontic modalities to the same scoped proposition.`,
    };
  }

  if (explicitEntailment && polarityA !== polarityB && overlap >= 0.24) {
    return {
      kind: "hard",
      severity: "high",
      confidence: roundNumber(clamp(Number(explicitEntailment.weight || 0.7) + 0.1, 0.72, 0.95)),
      signalType: "implication_conflict",
      conflictClass: crossLayerConflictClass(claimA, claimB),
      engine: ["Implication conflict", "Relation graph", "Repair ranking"],
      why: `${explicitEntailment.source} implies ${explicitEntailment.target}, but the linked claims differ in polarity and need qualification.`,
    };
  }

  if (explicitDefinition && overlap >= 0.32 && hasScopeClash(claimA, claimB)) {
    return {
      kind: "soft",
      severity: "medium",
      confidence: roundNumber(clamp(Number(explicitDefinition.weight || 0.62) + 0.08, 0.62, 0.86)),
      signalType: "scope_clash",
      conflictClass: "scope_exception_mismatch",
      engine: ["Scope clash", "Definition relation", "Human review"],
      why: `${claimA.id} and ${claimB.id} share a definition relation but use different scope boundaries.`,
    };
  }

  return null;
}

function sameCoreProposition(claimA, claimB) {
  const a = normalizeBelief(claimA).propositionObject;
  const b = normalizeBelief(claimB).propositionObject;
  const sameActor = a.actor && b.actor && a.actor === b.actor;
  const sameAction = a.action && b.action && a.action === b.action;
  const sameObject = (a.object || "") === (b.object || "");
  const sameScope = normalizeScopeComparable(a.scope) === normalizeScopeComparable(b.scope);
  if (sameActor && sameAction && sameObject && sameScope) return true;
  return sameAction && sameObject && sameScope && Boolean(a.action);
}

function normalizeScopeComparable(value) {
  return normalizePropositionToken(value || "default");
}

function isDeonticClash(left, right) {
  const pair = new Set([left, right]);
  return (pair.has("must") && pair.has("must_not"))
    || (pair.has("must") && pair.has("forbidden"))
    || (pair.has("permitted") && pair.has("forbidden"))
    || (pair.has("ought") && pair.has("forbidden"));
}

function crossLayerConflictClass(claimA, claimB) {
  const layers = new Set([claimA.layer, claimB.layer]);
  if (layers.has("theory") && (layers.has("judgment") || layers.has("principle"))) return "theory_judgment_mismatch";
  if (layers.has("principle") && layers.has("judgment")) return "principle_judgment_mismatch";
  return "semantic_tension";
}

function samePredicateKey(claimA, claimB) {
  const a = predicateTokens(claimA.text);
  const b = predicateTokens(claimB.text);
  if (!a.length || !b.length) return false;
  const shared = a.filter((token) => b.includes(token));
  return shared.length >= Math.min(3, Math.min(a.length, b.length));
}

function predicateTokens(text) {
  const ignored = new Set(["should", "must", "may", "might", "could", "would", "not", "never", "without", "because", "only", "where", "when", "with", "from"]);
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3 && !ignored.has(token))
    .slice(0, 8);
}

function hasScopeClash(claimA, claimB) {
  const scopeA = normalizeScopeObject(claimA.scopeObject || claimA.scope || claimA.timeScope);
  const scopeB = normalizeScopeObject(claimB.scopeObject || claimB.scope || claimB.timeScope);
  const fields = ["actor", "time", "jurisdiction", "conditions"];
  return fields.filter((field) => {
    const left = String(scopeA[field] || "").toLowerCase();
    const right = String(scopeB[field] || "").toLowerCase();
    return left && right && left !== right && left !== "unscoped" && right !== "unscoped";
  }).length >= 2;
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
      signalType: hard ? "rule_constraint" : "semantic_tension",
      conflictClass: inferConstraintConflictClass(constraint, claimA, claimB),
      engine: ["Rule constraint", `${constraint.language.toUpperCase()} template`, "Unsat core preview"],
      why: `${constraint.id} ${constraint.name}: ${constraint.body}`,
    };
  }
  return null;
}

function inferConstraintConflictClass(constraint, claimA, claimB) {
  const body = String(constraint.body || "").toLowerCase();
  if (body.includes("evidence") || body.includes("source") || body.includes("provenance")) return "unsupported_belief";
  if (body.includes("exception") || body.includes("scope")) return "scope_exception_mismatch";
  return crossLayerConflictClass(claimA, claimB);
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

function buildConflictExplanation(conflict) {
  const normalized = normalizeConflict(conflict);
  const minimalConflictSet = [...new Set([
    ...(normalized.minimalConflictSet || []),
    ...(normalized.core || []),
    normalized.claimA,
    normalized.claimB,
  ].filter(Boolean))];
  const coreSet = new Set(minimalConflictSet);
  const linkedSet = new Set([...(normalized.linked || []), ...minimalConflictSet].filter(Boolean));
  const relationPath = normalized.evidencePath.length
    ? normalized.evidencePath
    : state.relations
        .filter((relation) => {
          const touchesCore = coreSet.has(relation.source) || coreSet.has(relation.target);
          const staysInExplanation = linkedSet.has(relation.source) && linkedSet.has(relation.target);
          return touchesCore && staysInExplanation;
        })
        .slice(0, 6)
        .map((relation) => ({
          id: relation.id,
          source: relation.source,
          target: relation.target,
          type: relation.type,
          weight: relation.weight,
          rationale: relation.rationale,
        }));

  if (!relationPath.length && normalized.constraintId) {
    const constraint = state.constraints.find((item) => item.id === normalized.constraintId);
    relationPath.push({
      id: normalized.constraintId,
      source: normalized.claimA,
      target: normalized.claimB,
      type: "contradicts",
      weight: normalized.confidence,
      evidence: constraint ? `${constraint.name}: ${constraint.body}` : normalized.why,
    });
  }

  return {
    algorithmVersion: normalized.algorithmVersion || WRE_ENGINE_VERSION,
    minimalConflictSet,
    relationPath,
    downstreamClaims: normalized.downstreamClaims.length
      ? normalized.downstreamClaims
      : collectDownstreamClaims(minimalConflictSet),
    reason: normalized.why,
  };
}

function collectDownstreamClaims(sourceIds) {
  const coreSet = new Set(sourceIds.filter(Boolean));
  const seen = new Set(coreSet);
  const queue = sourceIds.map((id) => ({ id, depth: 0, via: "core" }));
  const downstream = [];
  while (queue.length && downstream.length < 8) {
    const current = queue.shift();
    state.relations.forEach((relation) => {
      if (relation.source !== current.id && relation.target !== current.id) return;
      const nextId = relation.source === current.id ? relation.target : relation.source;
      if (seen.has(nextId)) return;
      seen.add(nextId);
      const belief = findBelief(nextId);
      if (belief) {
        downstream.push({
          id: belief.id,
          label: labelForLayer(belief.layer),
          text: belief.text,
          via: relationTypeLabel(relation.type),
        });
      }
      if (current.depth < 1) queue.push({ id: nextId, depth: current.depth + 1, via: relation.type });
    });
  }
  return downstream;
}

function emptyExplanationItem(message) {
  const item = document.createElement("article");
  item.className = "relation-path-item";
  item.innerHTML = `<p>${escapeHtml(message)}</p>`;
  return item;
}

function createGeneratedConflict(claimA, claimB, signal, number) {
  const id = `C-${String(number).padStart(3, "0")}`;
  const repairId = `R-${String(number).padStart(3, "0")}`;
  const constraint = signal.constraintId ? state.constraints.find((item) => item.id === signal.constraintId) : null;
  return normalizeConflict({
    id,
    title: constraint ? `${constraint.name} Violation` : `${conflictClassLabel(signal.conflictClass)}: ${claimA.id} / ${claimB.id}`,
    severity: signal.severity,
    summary: `${claimA.id} ${signal.kind === "hard" ? "hard-conflicts" : "soft-tensions"} with ${claimB.id}`,
    provenance: `${claimA.id}, ${claimB.id}`,
    time: formatTime(new Date().toISOString()),
    claimA: claimA.id,
    claimB: claimB.id,
    linked: [claimA.id, claimB.id],
    kind: signal.kind,
    conflictClass: signal.conflictClass || normalizeConflictClass(signal.signalType),
    signalType: signal.signalType || (signal.kind === "hard" ? "rule_constraint" : "semantic_tension"),
    confidence: signal.confidence,
    core: [claimA.id, claimB.id],
    engine: signal.engine,
    why: signal.why,
    constraintId: signal.constraintId || "",
    generated: true,
    repairs: [
      {
        id: repairId,
        title: signal.conflictClass === "direct_contradiction" ? "Revise Scope" : "Add Exception",
        text: signal.conflictClass === "direct_contradiction"
          ? "Revise one claim's actor, object, or scope if the two commitments are not meant to cover exactly the same case."
          : "Add a scoped exception before this pair is used as support.",
        cost: signal.conflictClass === "direct_contradiction" ? "0.44" : "0.36",
        badge: "Lowest",
        tone: signal.severity === "high" ? "high" : "medium",
        actionType: signal.conflictClass === "direct_contradiction" ? "revise_scope" : "add_exception",
        targetId: leastEntrenchedClaimId([claimA, claimB]),
      },
    ],
  });
}

function createUnsupportedBeliefConflict(claim, number) {
  const id = `C-${String(number).padStart(3, "0")}`;
  return normalizeConflict({
    id,
    title: `Unsupported central belief: ${claim.id}`,
    severity: claim.confidence >= 90 ? "high" : "medium",
    summary: `${claim.id} has high confidence and graph centrality but no evidence reference`,
    provenance: claim.id,
    time: formatTime(new Date().toISOString()),
    claimA: claim.id,
    claimB: "",
    linked: [claim.id],
    kind: "soft",
    conflictClass: "unsupported_belief",
    signalType: "unsupported_belief",
    confidence: roundNumber(clamp(claim.confidence / 100, 0.62, 0.92)),
    core: [claim.id],
    engine: ["Unsupported belief check", "Graph centrality", "Repair ranking"],
    why: `${claim.id} is comparatively central and confident, but lacks evidence references or non-default provenance. WRE5 treats this as a reviewable instability rather than a logical contradiction.`,
    generated: true,
    repairs: [
      {
        id: `R-${String(number).padStart(3, "0")}`,
        title: "Edit Text Or Evidence",
        text: "Add provenance/evidence or lower confidence before using this claim as stable support.",
        cost: "0.29",
        badge: "Evidence",
        tone: "medium",
        actionType: "edit_text",
        targetId: claim.id,
      },
      {
        id: `R-${String(4000 + number).padStart(4, "0")}`,
        title: "Lower Confidence",
        text: "Lower confidence until provenance or evidence is attached.",
        cost: "0.35",
        badge: "Minimal change",
        tone: "medium",
        actionType: "lower_confidence",
        targetId: claim.id,
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
  state.privacy = normalizePrivacy(state.privacy);
  els.cloudSyncToggle.checked = Boolean(state.privacy.cloudSync);
  els.llmTriageToggle.checked = Boolean(state.privacy.nliTriage);
  els.retentionSelect.value = state.privacy.retention || DEFAULT_PRIVACY.retention;
  els.privacyModeSelect.value = state.privacy.privacyMode || DEFAULT_PRIVACY.privacyMode;
  els.sessionMode.textContent = privacyModeLabel(state.privacy.privacyMode);
  els.sessionRetention.textContent = retentionLabel(state.privacy.retention);
}

function syncConfidenceOutput() {
  els.confidenceOutput.textContent = `${els.confidenceInput.value}%`;
}

function syncEntrenchmentOutput() {
  els.entrenchmentOutput.textContent = `${els.entrenchmentInput.value}%`;
}

function syncCaseConfidenceOutput() {
  els.caseConfidenceOutput.textContent = `${els.caseConfidenceInput.value}%`;
}

function syncSyncBackendControls() {
  if (!els.syncEndpointInput) return;
  els.syncEndpointInput.value = state.privacy.syncEndpoint || DEFAULT_SYNC_ENDPOINT;
  els.workspaceIdInput.value = state.privacy.workspaceId || "";
  const hasToken = Boolean(getStoredSyncToken());
  els.syncTokenInput.value = hasToken ? "••••••••••••" : "";
  els.syncTokenInput.placeholder = hasToken ? "Token stored locally" : "Stored locally only";
  const syncSelected = state.privacy.privacyMode !== "local_only";
  els.pushSyncBtn.disabled = !syncSelected;
  els.pullSyncBtn.disabled = !syncSelected || !state.privacy.workspaceId || !hasToken;
  els.createWorkspaceBtn.disabled = !syncSelected;
  els.syncBackendStatus.textContent = syncBackendStatusText();
}

function syncStorageStatus() {
  const storageMode = state.privacy.retention === "session-only"
    ? "session"
    : storageInfo.indexedDb === "active"
      ? "indexeddb"
      : "local";
  const syncMode = state.privacy.cloudSync ? privacyModeLabel(state.privacy.privacyMode).toLowerCase() : "local-only";
  els.storageStatus.textContent = `${storageLabel(storageMode)} · ${syncMode}`;
}

function validateBeliefForm(text) {
  const errors = [];
  if (!text) errors.push({ field: "beliefText", message: "Enter a belief statement before adding the claim." });
  if (text && text.length < 12) errors.push({ field: "beliefText", message: "Use a complete claim, not a fragment." });
  if (!els.propositionActorInput.value.trim()) errors.push({ field: "propositionActorInput", message: "Add the actor for the typed proposition." });
  if (!els.propositionActionInput.value.trim()) errors.push({ field: "propositionActionInput", message: "Add the action or predicate for the typed proposition." });
  if (!els.timeScopeInput.value.trim()) errors.push({ field: "timeScopeInput", message: "Add a scope so the claim is not treated as universal by accident." });
  if (!els.provenanceInput.value.trim()) errors.push({ field: "provenanceInput", message: "Record a provenance source for audit replay." });
  return { valid: errors.length === 0, errors };
}

function showBeliefErrors(errors) {
  setErrorSummary(els.beliefErrorSummary, errors);
  [els.beliefText, els.propositionActorInput, els.propositionActionInput, els.timeScopeInput, els.provenanceInput].forEach(clearFieldInvalid);
  errors.forEach((error) => {
    const field = els[error.field];
    if (field) markFieldInvalid(field, error.message);
  });
  els.beliefErrorSummary.focus();
}

function clearBeliefErrors() {
  setErrorSummary(els.beliefErrorSummary, []);
  [els.beliefText, els.propositionActorInput, els.propositionActionInput, els.timeScopeInput, els.provenanceInput].forEach(clearFieldInvalid);
}

function validateRelationForm({ source, target, rationale }) {
  const errors = [];
  if (!source) errors.push({ field: "source", message: "Choose a source claim." });
  if (!target) errors.push({ field: "target", message: "Choose a target claim." });
  if (source && target && source === target) errors.push({ field: "target", message: "A relation must connect two different claims." });
  if (!rationale) errors.push({ field: "rationale", message: "Add a rationale so the relation is explainable." });
  return { valid: errors.length === 0, errors };
}

function showInlineFormErrors(form, errors) {
  let summary = form.querySelector(".error-summary");
  if (!summary) {
    summary = document.createElement("div");
    summary.className = "error-summary";
    summary.setAttribute("role", "alert");
    summary.tabIndex = -1;
    form.prepend(summary);
  }
  setErrorSummary(summary, errors);
  form.querySelectorAll("[aria-invalid='true']").forEach(clearFieldInvalid);
  errors.forEach((error) => {
    const field = form.querySelector(`[name='${error.field}'], #${error.field}`);
    if (field) markFieldInvalid(field, error.message);
  });
  summary?.focus();
}

function clearInlineFormErrors(form) {
  setErrorSummary(form.querySelector(".error-summary"), []);
  form.querySelectorAll("[aria-invalid='true']").forEach(clearFieldInvalid);
}

function setErrorSummary(summary, errors) {
  if (!summary) return;
  if (!errors.length) {
    summary.hidden = true;
    summary.innerHTML = "";
    return;
  }
  summary.hidden = false;
  summary.innerHTML = `
    <strong>Review ${errors.length} field${errors.length === 1 ? "" : "s"}</strong>
    <ul>${errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join("")}</ul>
  `;
}

function markFieldInvalid(field, message) {
  field.setAttribute("aria-invalid", "true");
  field.dataset.error = message;
}

function clearFieldInvalid(field) {
  field.removeAttribute("aria-invalid");
  delete field.dataset.error;
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

function claimKindLabel(kind) {
  return titleCase(String(kind || "belief_statement").replace(/_/g, " "));
}

function claimStatusLabel(status) {
  return titleCase(normalizeClaimStatus(status).replace(/_/g, " "));
}

function conflictClassLabel(value) {
  const normalized = normalizeConflictClass(value);
  const labels = {
    direct_contradiction: "Direct contradiction",
    principle_judgment_mismatch: "Principle-judgment mismatch",
    theory_judgment_mismatch: "Theory-judgment mismatch",
    deontic_clash: "Deontic clash",
    scope_exception_mismatch: "Scope/exception mismatch",
    unsupported_belief: "Unsupported belief",
    semantic_tension: "Semantic tension",
  };
  return labels[normalized] || "Semantic tension";
}

function propositionCoreLabel(claim) {
  const proposition = normalizeBelief(claim).propositionObject;
  const object = proposition.object ? ` / ${proposition.object}` : "";
  const exceptions = proposition.exceptions?.length ? ` except ${proposition.exceptions.join(", ")}` : "";
  return `${proposition.actor} / ${proposition.action}${object} / ${proposition.scope}${exceptions}`;
}

function privacyModeLabel(mode) {
  if (mode === "encrypted_sync") return "Encrypted sync";
  if (mode === "private_link") return "Private link";
  if (mode === "workspace") return "Workspace";
  return "Local only";
}

function actorKindLabel(kind) {
  if (kind === "ai_agent") return "AI agent";
  if (kind === "team") return "Team";
  if (kind === "institution") return "Institution";
  return "Individual human";
}

function workflowModeLabel(mode) {
  if (mode === "shared") return "Shared equilibrium";
  if (mode === "import_trace") return "Import trace";
  return "Individual WRE";
}

function focusComposer(layer) {
  if (["judgment", "principle", "theory"].includes(layer)) {
    els.claimKind.value = layer;
    els.claimTypeInput.value = layer === "theory" ? "background_theory" : layer;
    els.claimDomain.value = layer === "theory" ? "empirical" : "normative";
  }
  const prefix = layer === "principle" ? "@P2 " : layer === "theory" ? "@T3 " : "@J1 ";
  insertAtCursor(els.beliefText, prefix);
  updateTokenCount();
  els.beliefText.focus();
}

function addBelief() {
  const text = els.beliefText.value.trim();
  const validation = validateBeliefForm(text);
  if (!validation.valid) {
    showBeliefErrors(validation.errors);
    return;
  }
  clearBeliefErrors();

  const layer = els.claimKind.value || inferLayer(text);
  const id = nextBeliefId(layer);
  const scopeText = els.timeScopeInput.value.trim() || state.agentProfile.activeScope || "Unscoped";
  const evidenceRefs = normalizeEvidenceRefs(els.evidenceRefsInput.value);
  const propositionObject = normalizePropositionObject({
    actor: els.propositionActorInput.value,
    action: els.propositionActionInput.value,
    object: els.propositionObjectInput.value,
    propositionType: els.claimTypeInput.value,
    modality: els.modalityInput.value,
    polarity: els.polarityInput.value,
    scope: scopeText,
    exceptions: normalizeExceptionList(els.exceptionsInput.value),
  }, { text, layer, kind: els.claimTypeInput.value, domain: els.claimDomain.value, scope: scopeText });
  const belief = {
    id,
    beliefItemId: `BI-${id}`,
    layer,
    kind: els.claimTypeInput.value,
    proposition: text,
    propositionObject,
    structuredProposition: propositionObject,
    exceptions: propositionObject.exceptions,
    text,
    canonicalForm: canonicalizeClaimText(text),
    domain: els.claimDomain.value,
    modality: els.modalityInput.value,
    polarity: els.polarityInput.value,
    confidence: Number(els.confidenceInput.value),
    entrenchment: Number(els.entrenchmentInput.value),
    scope: scopeText,
    scopeObject: {
      domain: els.claimDomain.value,
      actor: state.agentProfile.displayName,
      time: state.agentProfile.timeHorizon,
      jurisdiction: state.agentProfile.jurisdiction,
      conditions: scopeText,
    },
    timeScope: scopeText,
    provenance: els.provenanceInput.value.trim() || "User supplied",
    sourceType: els.sourceTypeInput.value,
    provenanceObject: {
      sourceType: els.sourceTypeInput.value,
      sourceRef: els.provenanceInput.value.trim() || "User supplied",
      evidenceRefs,
    },
    evidenceRefs,
    references: extractClaimReferences(text),
    sensitivity: els.sensitivityInput.value,
    status: els.claimStatusInput.value,
    revisionStatus: els.claimStatusInput.value,
  };

  state.beliefs.push(belief);
  recordRevision("claim", `Added ${belief.id} to ${labelForLayer(layer).toLowerCase()} with ${belief.confidence}% confidence.`, {
    claimId: belief.id,
  });
  els.beliefText.value = "";
  els.propositionActorInput.value = "";
  els.propositionActionInput.value = "";
  els.propositionObjectInput.value = "";
  els.timeScopeInput.value = "";
  els.provenanceInput.value = "";
  els.evidenceRefsInput.value = "";
  els.exceptionsInput.value = "";
  els.claimStatusInput.value = "active";
  state.activeStage = "collection";
  saveState();
  render();
}

function addRelationFromForm(form) {
  const data = new FormData(form);
  const source = String(data.get("source") || "");
  const target = String(data.get("target") || "");
  const type = String(data.get("type") || "depends_on");
  const weight = Number(data.get("weight") || 65) / 100;
  const rationale = String(data.get("rationale") || "").trim();
  const validation = validateRelationForm({ source, target, type, rationale });

  if (!validation.valid) {
    showInlineFormErrors(form, validation.errors);
    return;
  }

  const existing = state.relations.find((relation) => {
    return relation.source === source && relation.target === target && relation.type === type;
  });
  if (existing) {
    showInlineFormErrors(form, [{ field: "type", message: "This exact relation already exists." }]);
    return;
  }
  clearInlineFormErrors(form);

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
    showInlineFormErrors(els.constraintForm, [
      ...(!constraint.name ? [{ field: "name", message: "Name the constraint before adding it." }] : []),
      ...(!constraint.body ? [{ field: "body", message: "Add a rule, SMT, or SHACL body before saving the constraint." }] : []),
    ]);
    return;
  }
  clearInlineFormErrors(els.constraintForm);

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
    showInlineFormErrors(els.calibrationForm, [
      ...(!round.principle ? [{ field: "casePrincipleInput", message: "Record the principle under test." }] : []),
      ...(!round.intuition ? [{ field: "caseIntuitionInput", message: "Record the case intuition." }] : []),
      ...(!round.updatedPrinciple ? [{ field: "caseUpdatedPrincipleInput", message: "Record an updated principle, scope boundary, or rationale." }] : []),
    ]);
    return;
  }
  clearInlineFormErrors(els.calibrationForm);

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

function acceptUnresolvedTension() {
  const conflict = getSelectedConflict();
  if (!conflict || conflict.status === "accepted_tension") return;
  const rationale = els.tensionRationaleInput.value.trim();
  if (rationale.length < 12) {
    markFieldInvalid(els.tensionRationaleInput, "Add a short rationale before preserving this tension.");
    els.tensionRationaleInput.focus();
    return;
  }
  clearFieldInvalid(els.tensionRationaleInput);
  const conflictIndex = state.conflicts.findIndex((item) => item.id === conflict.id);
  if (conflictIndex >= 0) {
    state.conflicts[conflictIndex] = {
      ...state.conflicts[conflictIndex],
      status: "accepted_tension",
      tensionRationale: rationale,
      acceptedTensionAt: new Date().toISOString(),
    };
  }
  const acceptedClaimIds = new Set([conflict.claimA, conflict.claimB, ...(conflict.core || [])].filter(Boolean));
  state.beliefs = state.beliefs.map((belief) => (
    acceptedClaimIds.has(belief.id)
      ? normalizeBelief({ ...belief, status: "accepted_tension" })
      : belief
  ));
  recordRevision("tension", `${conflict.id} preserved as a known tension: ${rationale}`, {
    conflictId: conflict.id,
    affectedClaims: [...acceptedClaimIds],
  });
  state.activeStage = "action";
  state.activeNav = "replay";
  saveState();
  render();
  focusElement(els.revisionReplay);
}

function buildRepairSimulation(conflict, repair) {
  const targetClaimId = inferRepairTargetClaimId(conflict, repair);
  const affectedClaims = [...new Set([targetClaimId, ...(conflict.core || []), conflict.claimA, conflict.claimB].filter(Boolean))];
  const beforeSnapshot = buildRepairSnapshot(conflict, affectedClaims);
  const targetClaim = findBelief(targetClaimId);
  const actionType = inferRepairActionType(repair);
  const disruptionCost = weightedRevisionCost(targetClaim, repair, conflict);
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

function weightedRevisionCost(targetClaim, repair, conflict) {
  const base = Number.isFinite(Number(repair.estimatedCost))
    ? Number(repair.estimatedCost)
    : Number.isFinite(Number(repair.cost))
      ? Number(repair.cost)
      : 0.75;
  const normalized = targetClaim ? normalizeBelief(targetClaim) : null;
  const confidencePenalty = normalized ? Number(normalized.confidence || 50) / 500 : 0.1;
  const entrenchmentPenalty = normalized ? Number(normalized.entrenchment || defaultEntrenchmentForLayer(normalized.layer)) / 420 : 0.15;
  const classDiscount = conflict?.conflictClass === "scope_exception_mismatch" && inferRepairActionType(repair) === "add_exception" ? -0.1 : 0;
  return roundNumber(clamp(base + confidencePenalty + entrenchmentPenalty + classDiscount, 0, 1.4));
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
  const propositionObject = normalizePropositionObject(claim.propositionObject, claim);
  if (actionType === "archive_item") {
    repaired.status = "retired";
    repaired.revisionStatus = "retired";
  } else if (actionType === "request_missing_evidence") {
    repaired.status = "draft";
    repaired.revisionStatus = "draft";
  } else if (actionType === "lower_confidence" || actionType === "adjust_confidence" || actionType === "retract_or_lower_confidence") {
    repaired.confidence = clamp(Number(claim.confidence) - 8, 1, 100);
  } else if (actionType === "add_exception") {
    const nextException = normalizePropositionToken(repair.exception || repair.reason || repair.title || "reviewed_exception");
    propositionObject.exceptions = [...new Set([...(propositionObject.exceptions || []), nextException].filter(Boolean))];
    repaired.exceptions = propositionObject.exceptions;
    repaired.text = buildRepairedClaimText(claim, repair);
  } else if (actionType === "revise_scope") {
    propositionObject.scope = normalizePropositionToken(`${propositionObject.scope || claim.scope || "scope"}_qualified`);
    repaired.scope = propositionObject.scope;
    repaired.timeScope = propositionObject.scope;
    repaired.text = buildRepairedClaimText(claim, repair);
  } else {
    repaired.text = buildRepairedClaimText(claim, repair);
  }
  repaired.propositionObject = propositionObject;
  repaired.structuredProposition = propositionObject;
  repaired.canonicalForm = canonicalizeClaimText(repaired.text);
  repaired.scope = repaired.timeScope || repaired.scope || "Unscoped";
  repaired.scopeObject = normalizeScopeObject(repaired.scopeObject || repaired.scope);
  repaired.provenance = appendAuditNote(claim.provenance, `repaired via ${repair.id}`);
  repaired.provenanceObject = normalizeProvenanceObject(repaired.provenanceObject || repaired.provenance, repaired);
  repaired.revisionStatus = repaired.status || "active";
  return normalizeBelief(repaired);
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
  if (["revise_scope", "add_exception", "lower_confidence", "edit_text", "archive_item"].includes(repair.actionType)) return repair.actionType;
  if (source.includes("evidence") || source.includes("provenance") || source.includes("source")) return "request_missing_evidence";
  if (source.includes("archive") || source.includes("retire") || source.includes("delete")) return "archive_item";
  if (source.includes("retract") || source.includes("lower confidence") || source.includes("reweight") || source.includes("decrease weight")) return "lower_confidence";
  if (source.includes("exception")) return "add_exception";
  if (source.includes("scope") || source.includes("limit") || source.includes("constraint") || source.includes("qualifier") || source.includes("qualify")) return "revise_scope";
  return "edit_text";
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
      schemaVersion: `${WRE_SCHEMA_VERSION}-local-store-extractor`,
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

function exportSyncPacket() {
  const payload = buildSyncPacketPayload();
  recordRevision("privacy", `Exported optional sync packet (${payload.readiness.status}) with ${payload.mutationSet.count} local records.`);
  saveState();
  renderRevisionReplay();
  renderDataRightsPanel();
  downloadJson(payload, "normativity-wre-sync-packet.json");
}

function buildSessionPayload() {
  const payload = {
    schemaVersion: WRE_SCHEMA_VERSION,
    session: {
      id: "sess_7f2c9e7a",
      created: state.createdAt,
      scope: state.agentProfile.activeScope,
      status: "active",
      agentProfile: normalizeAgentProfile(state.agentProfile),
      privacy: state.privacy,
      algorithmVersion: WRE_ENGINE_VERSION,
    },
    schema: {
      beliefItemFields: agentContract.beliefItemFields,
      claimFields: agentContract.claimFields,
      relationFields: agentContract.relationFields,
      constraintFields: agentContract.constraintFields,
      agentProfileFields: agentContract.agentProfileFields,
      formalRunFields: agentContract.formalRunFields,
      argumentationRunFields: agentContract.argumentationRunFields,
      triageRunFields: agentContract.triageRunFields,
      syncPacketFields: agentContract.syncPacketFields,
      repairOptionFields: agentContract.repairOptionFields,
      revisionEventFields: agentContract.revisionEventFields,
      evidenceRequestFields: agentContract.evidenceRequestFields,
      rulePackFields: agentContract.rulePackFields,
      exportFormats: agentContract.exportFormats,
      relationTypes: agentContract.relationTypes,
      conflictKinds: agentContract.conflictKinds,
      conflictClasses: agentContract.conflictClasses,
      conflictSignals: agentContract.conflictSignals,
      architecture: agentContract.architecture,
    },
    jsonSchemas: buildJsonSchemasPayload(),
    openApi: buildOpenApiPayload(),
    agentProfile: normalizeAgentProfile(state.agentProfile),
    beliefItems: buildBeliefItems(),
    claims: state.beliefs.map(normalizeBelief),
    beliefs: state.beliefs.map(normalizeBelief),
    relations: state.relations.map(normalizeRelation),
    constraints: state.constraints.map(normalizeConstraint),
    conflicts: state.conflicts.map((conflict) => ({
      ...normalizeConflict(conflict),
      explanation: buildConflictExplanation(conflict),
    })),
    selectedConflictId: state.selectedConflictId,
    revisions: state.revisions.map(normalizeRevision),
    analysisRuns: state.analysisRuns,
    formalRuns: state.formalRuns,
    argumentationRuns: state.argumentationRuns,
    triageRuns: state.triageRuns,
    evaluationRuns: state.evaluationRuns,
    calibrationRounds: state.calibrationRounds,
    repairApplications: state.repairApplications,
    securityControls: normalizeSecurityControls(state.securityControls),
    securityReport: buildSecurityReportPayload(),
    storageReport: buildStorageReportPayload(),
    syncPacket: buildSyncPacketPayload(),
    privacyReceipt: buildPrivacyReceiptPayload(),
    accessibilityReport: buildAccessibilityReportPayload(),
    missingInformation: buildMissingInformationReport(),
    rulePacks: domainRulePacks,
    migrationReport: state.migrationReport || buildDefaultMigrationReport(),
    benchmarkTargets,
    agentContract: buildAgentContractPayload(),
  };
  return payload;
}

function buildJsonLdPayload() {
  const sessionId = "sess_7f2c9e7a";
  const sessionNode = `urn:wre:session:${sessionId}`;
  const beliefItemNode = (id) => `urn:wre:belief-item:${id}`;
  const claimNode = (id) => `urn:wre:claim:${id}`;
  const relationNode = (id) => `urn:wre:relation:${id}`;
  const constraintNode = (id) => `urn:wre:constraint:${id}`;
  const conflictNode = (id) => `urn:wre:conflict:${id}`;
  const formalNode = (id) => `urn:wre:formal-run:${id}`;
  const argumentationNode = (id) => `urn:wre:argumentation-run:${id}`;
  const triageNode = (id) => `urn:wre:triage-run:${id}`;
  const syncNode = (id) => `urn:wre:sync-packet:${id}`;
  const revisionNode = (index) => `urn:wre:revision:${sessionId}:${index + 1}`;
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const formal = getLatestFormalRun() || buildFormalTrace({ preview: true });
  const argumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true });
  const triage = getLatestTriageRun() || buildTriageRun({ preview: true });
  const syncPacket = buildSyncPacketPayload();

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
    schemaVersion: `${WRE_SCHEMA_VERSION}-jsonld`,
    generatedAt: new Date().toISOString(),
    exportFormats: agentContract.exportFormats,
    "@graph": [
      {
        "@id": sessionNode,
        "@type": "wre:Session",
        name: state.agentProfile.activeScope,
        created: state.createdAt,
        actorKind: state.agentProfile.actorKind,
        workflowMode: state.agentProfile.workflowMode,
        activeScope: state.agentProfile.activeScope,
        privacyMode: state.privacy.privacyMode,
        retention: state.privacy.retention,
        apiAbuseResistance: security.summary.abuseResistance,
        persistence: storage.summary,
        formalStatus: formal.status,
        argumentationAttacks: argumentation.attackEdges.length,
        triageFlags: triage.formalizationCandidates.length,
        syncReadiness: syncPacket.readiness.status,
      },
      {
        "@id": `urn:wre:agent-profile:${state.agentProfile.id}`,
        "@type": "wre:AgentProfile",
        name: state.agentProfile.displayName,
        actorKind: state.agentProfile.actorKind,
        workflowMode: state.agentProfile.workflowMode,
        activeScope: state.agentProfile.activeScope,
        jurisdiction: state.agentProfile.jurisdiction,
        generatedBy: sessionNode,
      },
      ...buildBeliefItems().map((item) => ({
        "@id": beliefItemNode(item.id),
        "@type": "wre:BeliefItem",
        name: item.id,
        family: item.family,
        text: item.rawText,
        confidence: item.confidence,
        entrenchment: item.entrenchment,
        evidenceRefs: item.evidenceRefs,
        generatedBy: sessionNode,
      })),
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
          beliefItem: beliefItemNode(normalized.beliefItemId),
          kind: normalized.kind,
          layer: normalized.layer,
          canonicalForm: normalized.canonicalForm,
          domain: normalized.domain,
          modality: normalized.modality,
          polarity: normalized.polarity,
          scope: normalized.scope,
          confidence: normalized.confidence,
          entrenchment: normalized.entrenchment,
          timeScope: normalized.timeScope,
          provenance: normalized.provenance,
          sourceType: normalized.sourceType,
          evidenceRefs: normalized.evidenceRefs,
          propositionObject: normalized.propositionObject,
          exceptions: normalized.exceptions,
          sensitivity: normalized.sensitivity,
          status: normalized.status,
          proposition: normalized.proposition,
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
      {
        "@id": formalNode(formal.id),
        "@type": "wre:FormalRun",
        formalRunId: formal.id,
        status: formal.status,
        satisfiable: formal.satisfiable,
        assertionCount: formal.assertions.length,
        unsatCoreCount: formal.unsatCores.length,
        engineVersions: formal.engineVersions,
        generatedBy: sessionNode,
      },
      ...formal.unsatCores.map((core) => ({
        "@id": `urn:wre:unsat-core:${core.id}`,
        "@type": "wre:UnsatCore",
        coreId: core.id,
        severity: core.severity,
        confidence: core.confidence,
        member: (core.members || []).map(claimNode),
        constraint: core.constraintId ? constraintNode(core.constraintId) : undefined,
        explanation: core.explanation,
        generatedBy: formalNode(formal.id),
      })),
      {
        "@id": argumentationNode(argumentation.id),
        "@type": "wre:ArgumentationRun",
        argumentationRunId: argumentation.id,
        attackCount: argumentation.attackEdges.length,
        defenseCount: argumentation.defenseEdges.length,
        admissibleSet: argumentation.admissibleSet.map(claimNode),
        groundedExtension: argumentation.groundedExtension.map(claimNode),
        vulnerableClaims: argumentation.vulnerableClaims.map((item) => claimNode(item.claimId)),
        generatedBy: sessionNode,
      },
      ...argumentation.attackEdges.slice(0, 12).map((edge) => ({
        "@id": `urn:wre:attack:${edge.id}`,
        "@type": "wre:AttackEdge",
        attackId: edge.id,
        source: claimNode(edge.source),
        target: claimNode(edge.target),
        weight: edge.weight,
        rationale: edge.rationale,
        generatedBy: argumentationNode(argumentation.id),
      })),
      {
        "@id": triageNode(triage.id),
        "@type": "wre:TriageRun",
        triageRunId: triage.id,
        nliMode: triage.nliMode,
        externalProcessing: triage.externalProcessing,
        queuedPairCount: triage.queuedPairCount,
        formalizationFlagCount: triage.formalizationCandidates.length,
        averageSoftTensionScore: triage.probabilisticSummary.averageSoftTensionScore,
        generatedBy: sessionNode,
      },
      ...triage.reviewQueue.slice(0, 12).map((item) => ({
        "@id": `urn:wre:triage-pair:${item.id}`,
        "@type": "wre:TriagePair",
        source: claimNode(item.claimA),
        target: claimNode(item.claimB),
        contradictionProbability: item.contradictionProbability,
        softTensionScore: item.softTensionScore,
        recommendation: item.recommendation,
        explanation: item.explanation,
        generatedBy: triageNode(triage.id),
      })),
      {
        "@id": syncNode(sessionId),
        "@type": "wre:SyncPacket",
        syncStatus: syncPacket.readiness.status,
        readinessScore: syncPacket.readiness.score,
        mode: syncPacket.workspace.mode,
        mutationCount: syncPacket.mutationSet.count,
        idempotencyKey: syncPacket.manifest.idempotencyKey,
        conflictPolicy: syncPacket.conflictPolicy.strategy,
        generatedBy: sessionNode,
      },
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
  const formal = getLatestFormalRun() || buildFormalTrace({ preview: true });
  const argumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true });
  const missingInfo = buildMissingInformationReport({ preview: true });
  const rows = [
    ...buildBeliefItems().map((item) => ["belief_item", item.id, labelForLayer(item.family), "raw", "", "", item.revisionStatus, item.confidence, item.rawText, `${item.scope.conditions}; ${item.provenance.sourceType}: ${item.provenance.sourceRef}`]),
    ...state.beliefs.map((belief) => {
      const normalized = normalizeBelief(belief);
      return ["claim", normalized.id, claimKindLabel(normalized.kind), `${normalized.modality}/${normalized.polarity}`, "", "", normalized.status, normalized.confidence, normalized.proposition || normalized.text, `${normalized.scope}; entrenchment ${normalized.entrenchment}%; ${normalized.provenance}; ${normalized.sensitivity}`];
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
    ["formal_run", formal.id, "Formal solver trace", formal.status, "", "", formal.satisfiable ? "sat" : "unsat", formal.unsatCores.length, `${formal.assertions.length} named assertions; ${formal.constraints.length} templates`, formal.engineVersions.join(" ")],
    ...formal.unsatCores.map((core) => ["unsat_core", core.id, core.conflictId || core.constraintId || "Tracked core", core.source, core.members?.[0] || "", core.members?.[1] || "", core.severity, core.confidence, core.explanation, (core.namedAssertions || []).join(" ")]),
    ["argumentation_run", argumentation.id, "Argumentation review", "attack-defense", "", "", argumentation.vulnerableClaims.length ? "review" : "defended", argumentation.attackEdges.length, argumentation.summary, `admissible ${argumentation.admissibleSet.join(" ")}`],
    ...argumentation.attackEdges.slice(0, 12).map((edge) => ["attack_edge", edge.id, edge.type, edge.relationId || edge.conflictId || "", edge.source, edge.target, "", edge.weight, edge.rationale, "argumentation graph"]),
    ["triage_run", triage.id, "NLI and probabilistic triage", triage.nliMode, "", "", triage.externalProcessing ? "external" : "local", triage.reviewQueue.length, `${triage.formalizationCandidates.length} formalization flags`, triage.probabilisticSummary.scoringFormula],
    ...triage.reviewQueue.slice(0, 12).map((item) => ["triage_pair", item.id, item.recommendation, item.retrievalReason, item.claimA, item.claimB, item.priority, item.softTensionScore, item.explanation, `nli ${item.contradictionProbability}; overlap ${item.semanticOverlap}`]),
    ...missingInfo.requests.map((request) => ["evidence_request", request.id, request.targetId, request.reason, "", "", request.priority, "", request.prompt, request.suggestedAction]),
    ...domainRulePacks.map((pack) => ["rule_pack", pack.id, pack.label, pack.engine, "", "", pack.status, pack.checks.length, pack.checks.join("; "), "deterministic plugin hook"]),
    ["sync_packet", "SYNC-001", "Optional sync packet", syncPacket.workspace.mode, "", "", syncPacket.readiness.status, syncPacket.readiness.score, `${syncPacket.mutationSet.count} mutation records; ${syncPacket.edgeContract.routes.length} routes`, syncPacket.manifest.idempotencyKey],
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
      schemaVersion: `${WRE_SCHEMA_VERSION}-benchmark`,
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
      schemaVersion: `${WRE_SCHEMA_VERSION}-evaluation`,
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
      schemaVersion: `${WRE_SCHEMA_VERSION}-constraints`,
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      constraints: state.constraints.map(normalizeConstraint),
      latestAnalysis: getLatestAnalysisRun() || buildAnalysisReport({ preview: true }),
    },
    "normativity-wre-constraints.json"
  );
}

function exportFormalTrace() {
  const trace = getLatestFormalRun() || buildFormalTrace({ preview: true });
  downloadJson(
    {
      schemaVersion: `${WRE_SCHEMA_VERSION}-formal-trace`,
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      formalTrace: trace,
      note: "Trace uses local named assertions and SMT-style templates so the static WRE app can explain unsat cores without remote processing.",
    },
    "normativity-wre-formal-trace.json"
  );
}

function exportArgumentationReport() {
  const argumentation = getLatestArgumentationRun() || buildArgumentationRun({ preview: true });
  downloadJson(
    {
      schemaVersion: `${WRE_SCHEMA_VERSION}-argumentation`,
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      argumentation,
      note: "Argumentation review models conflicts and undercuts as attacks, support and implication as defenses, and exposes an admissible working set for human review.",
    },
    "normativity-wre-argumentation.json"
  );
}

function exportTriageReport() {
  const triage = getLatestTriageRun() || buildTriageRun({ preview: true });
  downloadJson(
    {
      schemaVersion: `${WRE_SCHEMA_VERSION}-triage`,
      generatedAt: new Date().toISOString(),
      sessionId: "sess_7f2c9e7a",
      triage,
      note: "NLI-style scores are local deterministic estimates. The static WRE app does not send belief text to an external model during this export.",
    },
    "normativity-wre-triage.json"
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

function exportJsonSchemaContract() {
  downloadJson(buildJsonSchemasPayload(), "normativity-wre5-json-schema.json");
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
  const syncReady = state.privacy.privacyMode === "local_only" || controls.syncAuthRequired;
  const budgetReady = controls.monthlyBudgetUsd <= 100;
  const mapped = controls.complianceStatus === "mapped" || controls.complianceStatus === "launch-ready";
  const launchGate = quotaReady && nliReady && syncReady && budgetReady && mapped ? "ready-for-beta" : "needs-security-review";

  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-security-report`,
    generatedAt: new Date().toISOString(),
    sessionId: "sess_7f2c9e7a",
    standards: {
      privacyByDesign: "DPIA-style review before sync, analytics, or third-party LLM processing",
      applicationSecurity: "OWASP ASVS mapping for auth, session handling, secrets, uploads, and logging",
      apiAbuse: "OWASP API Top 10 guardrails for quotas, body-size limits, and execution caps",
      observability: "OpenTelemetry-compatible event vocabulary without mandatory third-party telemetry",
      restoreDrills: `${controls.restoreDrillCadence} encrypted archive restore drill`,
      incidentResponse: controls.incidentRunbook,
      sensitiveUse: controls.modelTrainingPolicy,
      humanReview: controls.humanReviewPath,
      contentSecurityPolicy: controls.cspMode,
      dependencyScanning: controls.dependencyScanning,
      publicFormAbuse: controls.publicFormAbuse,
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
      localFirstDefault: state.privacy.privacyMode === "local_only",
      nliOptIn: Boolean(state.privacy.nliTriage),
      encryptedArchiveAvailable: hasWebCrypto(),
      exportDeleteCorrection: true,
      telemetryMode: controls.telemetryMode,
      dpiaReview: controls.dpiaReview,
      asvsMapping: controls.asvsMapping,
      incidentRunbook: controls.incidentRunbook,
      modelTrainingPolicy: controls.modelTrainingPolicy,
      humanReviewPath: controls.humanReviewPath,
      cspMapped: true,
      dependencyScanningMapped: true,
      turnstileReady: true,
    },
  };
}

function buildStorageReportPayload() {
  const sessionOnly = state.privacy.retention === "session-only";
  const indexedActive = storageInfo.indexedDb === "active" && !sessionOnly;
  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-storage-report`,
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
    privacyMode: state.privacy.privacyMode,
    cloudSync: state.privacy.privacyMode !== "local_only",
    lastSavedAt: storageInfo.lastSavedAt || state.updatedAt || "",
    lastHydratedAt: storageInfo.lastHydratedAt,
  };
}

function buildSyncPacketPayload() {
  const security = buildSecurityReportPayload();
  const storage = buildStorageReportPayload();
  const sessionId = INDEXED_DB_SESSION_ID;
  const generatedAt = new Date().toISOString();
  const snapshotHashes = {
    beliefItems: hashPayload(buildBeliefItems()),
    beliefs: hashPayload(state.beliefs.map(normalizeBelief)),
    relations: hashPayload(state.relations.map(normalizeRelation)),
    constraints: hashPayload(state.constraints.map(normalizeConstraint)),
    conflicts: hashPayload(state.conflicts),
    evidenceRequests: hashPayload(buildMissingInformationReport({ preview: true }).requests),
    revisions: hashPayload(state.revisions),
  };
  const mutationTypes = [
    ["beliefItems", state.beliefs.length],
    ["claims", state.beliefs.length],
    ["relations", state.relations.length],
    ["constraints", state.constraints.length],
    ["conflicts", state.conflicts.length],
    ["evidenceRequests", buildMissingInformationReport({ preview: true }).requests.length],
    ["revisions", state.revisions.length],
    ["analysisRuns", state.analysisRuns.length],
    ["formalRuns", state.formalRuns.length],
    ["argumentationRuns", state.argumentationRuns.length],
    ["triageRuns", state.triageRuns.length],
    ["calibrationRounds", state.calibrationRounds.length],
    ["repairApplications", state.repairApplications.length],
  ];
  const mutationCount = mutationTypes.reduce((sum, [, count]) => sum + count, 0);
  const checks = {
    localFirstDefault: state.privacy.privacyMode === "local_only" || storage.indexedDb.primary || state.privacy.retention === "session-only",
    cloudSyncConsent: state.privacy.privacyMode !== "local_only",
    encryptedArchiveAvailable: hasWebCrypto(),
    workerEndpointConfigured: Boolean(state.privacy.syncEndpoint),
    workspaceConfigured: state.privacy.privacyMode === "local_only" || Boolean(state.privacy.workspaceId),
    syncTokenPresent: state.privacy.privacyMode === "local_only" || Boolean(getStoredSyncToken()),
    authRequiredForSync: security.controls.syncAuthRequired,
    quotaReady: security.controls.quotaPerHour > 0 && security.controls.bodyLimitKb <= 512,
    budgetReady: security.controls.monthlyBudgetUsd <= 100,
    deleteWorkflowReady: Boolean(els.deleteLocalDataBtn),
    retentionMapped: ["until-deleted", "session-only", "30-days"].includes(state.privacy.retention),
  };
  const readinessBase = [
    checks.localFirstDefault,
    checks.encryptedArchiveAvailable,
    checks.workerEndpointConfigured,
    checks.workspaceConfigured,
    checks.syncTokenPresent,
    checks.authRequiredForSync,
    checks.quotaReady,
    checks.budgetReady,
    checks.deleteWorkflowReady,
    checks.retentionMapped,
  ];
  const readinessScore = roundNumber(readinessBase.filter(Boolean).length / readinessBase.length);
  const status = state.privacy.privacyMode !== "local_only"
    ? readinessScore >= 0.85 ? "ready-to-sync" : "needs-sync-review"
    : readinessScore >= 0.85 ? "staged-local-only" : "needs-local-hardening";

  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-sync-packet`,
    algorithmVersion: WRE_ENGINE_VERSION,
    generatedAt,
    workspace: {
      id: `workspace-${sessionId}`,
      sessionId,
      ownerHash: `local-${hashPayload(state.createdAt || sessionId).slice(0, 10)}`,
      mode: state.privacy.privacyMode === "local_only" ? "local-first-staged" : state.privacy.privacyMode,
      retentionPolicy: state.privacy.retention,
      syncConsent: state.privacy.privacyMode !== "local_only",
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    },
    manifest: {
      encryption: hasWebCrypto() ? "AES-GCM archive ready; sync payload must be encrypted before upload" : "Web Crypto unavailable",
      storagePrimary: storage.indexedDb.primary ? "IndexedDB" : storage.retention === "session-only" ? "sessionStorage" : "localStorage",
      snapshotHashes,
      algorithmVersion: WRE_ENGINE_VERSION,
      objectPrefix: `r2://normativity-wre/${sessionId}/`,
      d1Tables: ["workspace", "sync_packet_manifest", "sync_audit_event", "sync_tombstone"],
      canonicalTables: ["agent_profile", "session", "belief_item", "claim", "claim_relation", "evidence_link", "revision_event", "conflict_set", "repair_option", "snapshot"],
      idempotencyKey: `sync-${sessionId}-${hashPayload(snapshotHashes).slice(0, 12)}`,
    },
    mutationSet: {
      count: mutationCount,
      clientClock: state.revisions.length + state.repairApplications.length + state.analysisRuns.length,
      lastLocalRevisionAt: state.revisions[state.revisions.length - 1]?.time || state.updatedAt,
      types: Object.fromEntries(mutationTypes),
      operations: mutationTypes.filter(([, count]) => count > 0).map(([type, count]) => ({
        type: `upsert_${type}`,
        count,
        hash: hashPayload({ type, count, version: state.updatedAt }),
      })),
      tombstones: [],
    },
    conflictPolicy: {
      strategy: "revision-log-merge",
      deterministicMerge: "merge non-overlapping claim/relation updates by id and timestamp",
      humanReview: "require review when two clients edit the same conflict, claim text, confidence, or sensitivity tag",
      rollback: "restore from encrypted archive or revision before accepting remote packet",
    },
    edgeContract: {
      provider: "Cloudflare Workers + D1 metadata + R2 encrypted packets; the WRE5 canonical store is local IndexedDB unless sync is explicitly enabled",
      apiVersion: WRE_SCHEMA_VERSION,
      algorithmVersion: WRE_ENGINE_VERSION,
      auth: security.controls.syncAuthRequired ? "Bearer token required for synced workspaces" : "local export only; sync auth disabled",
      quotaPerHour: security.controls.quotaPerHour,
      bodyLimitKb: security.controls.bodyLimitKb,
      deleteWorkflow: "DELETE /v1/sessions/{id} writes tombstone and purges encrypted objects",
      routes: [
        { method: "GET", path: "/health", purpose: "Read Worker health and schema version" },
        { method: "POST", path: "/v1/workspaces", purpose: "Create encrypted sync workspace and token verifier" },
        { method: "POST", path: "/v1/sync/push", purpose: "Upload encrypted mutation packet with idempotency key" },
        { method: "GET", path: "/v1/sync/pull", purpose: "Fetch remote manifest, vector clock, and tombstones" },
        { method: "POST", path: "/v1/sync/resolve", purpose: "Submit user-reviewed merge result" },
        { method: "GET", path: "/v1/sessions/{id}/manifest", purpose: "Read opaque encrypted packet metadata" },
        { method: "DELETE", path: "/v1/sessions/{id}", purpose: "Delete a synced session packet set and write a local tombstone" },
      ],
      canonicalStore: agentContract.architecture.canonicalStore,
      rlsBoundary: "agent_profile, session, belief_item, claim, and revision rows are scoped by owner/workspace role",
    },
    backend: {
      endpoint: state.privacy.syncEndpoint || DEFAULT_SYNC_ENDPOINT,
      workspaceId: state.privacy.workspaceId || "",
      tokenPresent: Boolean(getStoredSyncToken()),
      lastStatus: state.privacy.lastSyncStatus,
      lastSyncAt: state.privacy.lastSyncAt,
      remoteClock: state.privacy.lastRemoteClock,
    },
    readiness: {
      score: readinessScore,
      status,
      checks,
      blockers: Object.entries(checks)
        .filter(([key, value]) => key !== "cloudSyncConsent" && !value)
        .map(([key]) => key),
      note: state.privacy.privacyMode !== "local_only"
        ? "Cloud sync is opted in; packet must be encrypted and authenticated before upload."
        : "Cloud sync is off; packet is a local preview until the user opts in.",
    },
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
  const syncPacket = buildSyncPacketPayload();
  const sensitivityCounts = state.beliefs.reduce((counts, belief) => {
    const key = belief.sensitivity || "private";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const potentiallySensitive = state.beliefs.filter((belief) => {
    return belief.sensitivity === "private" || belief.domain === "normative" || belief.domain === "meta";
  }).length;

  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-privacy-receipt`,
    generatedAt: new Date().toISOString(),
    sessionId: "sess_7f2c9e7a",
    classification: {
      beliefContent: "potentially-sensitive philosophical, political, religious, or moral commitments",
      potentiallySensitive,
      sensitivityCounts,
      agentKind: state.agentProfile.actorKind,
      workflowMode: state.agentProfile.workflowMode,
      beliefItemCount: buildBeliefItems().length,
      claimCount: state.beliefs.length,
      relationCount: state.relations.length,
      conflictCount: state.conflicts.length,
      formalRuns: state.formalRuns.length,
      argumentationRuns: state.argumentationRuns.length,
      triageRuns: state.triageRuns.length,
      calibrationRounds: state.calibrationRounds.length,
      repairApplications: state.repairApplications.length,
      evidenceRequests: buildMissingInformationReport({ preview: true }).requests.length,
    },
    processing: {
      storageMode: state.privacy.retention === "session-only" ? "sessionStorage" : storage.indexedDb.primary ? "IndexedDB" : "localStorage",
      persistence: storage.summary,
      indexedDbStatus: storage.indexedDb.status,
      retention: state.privacy.retention,
      privacyMode: state.privacy.privacyMode,
      cloudSync: state.privacy.privacyMode !== "local_only",
      nliTriage: Boolean(state.privacy.nliTriage),
      encryptedArchive: hasWebCrypto() ? "AES-GCM available locally" : "unavailable in this browser",
      thirdPartyProcessing: state.privacy.privacyMode !== "local_only" || state.privacy.nliTriage ? "opt-in only" : "none selected",
      syncEndpoint: state.privacy.syncEndpoint,
      workspaceId: state.privacy.workspaceId || "not-created",
      syncToken: getStoredSyncToken() ? "stored locally only" : "not stored",
      syncPacketStatus: syncPacket.readiness.status,
      syncPacketMutations: syncPacket.mutationSet.count,
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
      export: "JSON session, JSON-LD graph, CSV summary, benchmark, sync packet, and calibration exports",
      delete: "Delete Local Data removes WRE local/session storage keys",
      correction: "Edit by importing corrected JSON or adding revised claims/rounds",
    },
  };
}

function buildAccessibilityReportPayload() {
  const commands = getCommandDefinitions();
  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-accessibility-report`,
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
      guidedStageFlow: Boolean(els.stageList && document.querySelector("[data-stage='preparation']") && document.querySelector("[data-stage='action']")),
      fieldErrorSummary: Boolean(els.beliefErrorSummary && els.constraintForm && els.calibrationForm),
      dualGraphTableMode: Boolean(els.claimWorkbenchPanel && document.querySelector("[data-view-mode='table']") && document.querySelector("[data-view-mode='graph']")),
      keyboardCommandPalette: Boolean(els.commandPalette),
      screenReaderSummaryRegion: Boolean(els.screenReaderSummary),
      textConstraintEditor: Boolean(els.constraintForm && els.constraintList),
      formalTracePanel: Boolean(els.formalTraceList && els.exportFormalTraceBtn),
      argumentationReviewPanel: Boolean(els.argumentationList && els.exportArgumentationBtn),
      triageReviewPanel: Boolean(els.triageList && els.exportTriageBtn),
      syncPacketPanel: Boolean(els.syncReadinessList && els.exportSyncPacketBtn),
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
      schemaVersion: `${WRE_SCHEMA_VERSION}-calibration`,
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
  const beliefs = Array.isArray(parsed.beliefs)
    ? parsed.beliefs
    : Array.isArray(parsed.claims)
      ? parsed.claims
      : Array.isArray(parsed.beliefItems)
        ? parsed.beliefItems.map(beliefItemToClaim)
        : [];
  const conflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
  if (!beliefs.length || !conflicts.length) throw new Error("Import requires beliefs and conflicts.");
  const normalizedBeliefs = beliefs.map(normalizeBelief);
  const relations = normalizeRelationSet(parsed.relations, normalizedBeliefs, conflicts);
  const migrationReport = buildMigrationReport(parsed, beliefs, conflicts, relations);
  state = {
    ...createState(),
    agentProfile: normalizeAgentProfile(parsed.agentProfile || parsed.session?.agentProfile || parsed.session),
    beliefs: normalizedBeliefs,
    relations,
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(normalizeConstraint) : clone(seedConstraints),
    conflicts: conflicts.map((conflict) => normalizeImportedConflict(conflict, migrationReport)),
    revisions: Array.isArray(parsed.revisions) ? parsed.revisions.map(normalizeRevision) : [],
    analysisRuns: Array.isArray(parsed.analysisRuns) ? parsed.analysisRuns.map(normalizeAnalysisRun) : [],
    formalRuns: Array.isArray(parsed.formalRuns) ? parsed.formalRuns.map(normalizeFormalRun) : [],
    argumentationRuns: Array.isArray(parsed.argumentationRuns) ? parsed.argumentationRuns.map(normalizeArgumentationRun) : [],
    triageRuns: Array.isArray(parsed.triageRuns) ? parsed.triageRuns.map(normalizeTriageRun) : [],
    evaluationRuns: Array.isArray(parsed.evaluationRuns) ? parsed.evaluationRuns.map(normalizeEvaluationRun) : [],
    calibrationRounds: Array.isArray(parsed.calibrationRounds) ? parsed.calibrationRounds.map(normalizeCalibrationRound) : [],
    repairApplications: Array.isArray(parsed.repairApplications) ? parsed.repairApplications.map(normalizeRepairApplication) : [],
    migrationReport,
    privacy: normalizePrivacy(parsed.privacy || parsed.session?.privacy),
    securityControls: normalizeSecurityControls(parsed.securityControls || parsed.securityReport?.controls),
    selectedConflictId: parsed.selectedConflictId || conflicts[0]?.id || "C-001",
    viewMode: parsed.viewMode === "graph" ? "graph" : "table",
    workbenchFilter: ["judgment", "principle", "theory"].includes(parsed.workbenchFilter) ? parsed.workbenchFilter : "all",
    relationTypeFilter: agentContract.relationTypes.includes(parsed.relationTypeFilter) ? parsed.relationTypeFilter : "all",
  };
}

async function encryptSessionPayload(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveArchiveKey(passphrase, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-encrypted-archive`,
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
  if (![`${WRE_SCHEMA_VERSION}-encrypted-archive`, `${PREVIOUS_SCHEMA_VERSION}-encrypted-archive`, `${LEGACY_SCHEMA_VERSION}-encrypted-archive`, `${OLDER_SCHEMA_VERSION}-encrypted-archive`].includes(archive.schemaVersion)) throw new Error("Unsupported archive.");
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

function syncTokenStorageKey(workspaceId = state.privacy.workspaceId) {
  return `${STORAGE_KEY}:sync-token:${workspaceId || "pending"}`;
}

function getStoredSyncToken() {
  if (!state.privacy?.workspaceId) return "";
  try {
    return localStorage.getItem(syncTokenStorageKey()) || "";
  } catch {
    return "";
  }
}

function storeSyncToken(token, workspaceId = state.privacy.workspaceId) {
  try {
    localStorage.setItem(syncTokenStorageKey(workspaceId), token);
  } catch {
    // The UI keeps working in export-only mode if localStorage is unavailable.
  }
}

function resolveSyncTokenFromInput() {
  const typed = els.syncTokenInput.value.trim();
  if (typed && !typed.includes("•")) {
    storeSyncToken(typed);
    return typed;
  }
  return getStoredSyncToken();
}

function generateSyncToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `wre_${arrayBufferToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeSyncEndpoint(value) {
  const endpoint = String(value || DEFAULT_SYNC_ENDPOINT).trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(endpoint)) throw new Error("Worker endpoint must start with http:// or https://.");
  return endpoint;
}

async function requestSyncJson(path, { method = "GET", endpoint = state.privacy.syncEndpoint, token = "", body = null } = {}) {
  const headers = {
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${normalizeSyncEndpoint(endpoint)}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Worker request failed with ${response.status}.`);
  }
  return payload;
}

function showSyncBackendStatus(message, tone = "neutral") {
  if (!els.syncBackendStatus) return;
  els.syncBackendStatus.textContent = message;
  els.syncBackendStatus.dataset.tone = tone;
}

function syncBackendStatusText() {
  if (state.privacy.privacyMode === "local_only") return "Worker sync is staged locally until encrypted sync is selected.";
  if (!state.privacy.workspaceId) return "Encrypted sync selected. Create a workspace before pushing packets.";
  const tokenStatus = getStoredSyncToken() ? "token stored" : "token missing";
  const clock = state.privacy.lastRemoteClock ? ` · remote clock ${state.privacy.lastRemoteClock}` : "";
  return `${privacyModeLabel(state.privacy.privacyMode)} workspace ${state.privacy.workspaceId}; ${tokenStatus}; ${state.privacy.lastSyncStatus || "not synced"}${clock}.`;
}

function normalizeImportedConflict(conflict, migrationReport) {
  const normalized = normalizeConflict(conflict);
  if (!migrationReport.status.startsWith("native-wre")) {
    normalized.verification = "legacy-unverified";
    normalized.engine = [...new Set([...(normalized.engine || []), "Legacy import review"])];
  }
  return normalized;
}

function buildMigrationReport(parsed, beliefs, conflicts, relations = []) {
  const schemaVersion = parsed.schemaVersion || parsed.version || "legacy/unknown";
  const native = [WRE_SCHEMA_VERSION, PREVIOUS_SCHEMA_VERSION, LEGACY_SCHEMA_VERSION, OLDER_SCHEMA_VERSION].includes(schemaVersion);
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
    status: native ? `native-${schemaVersion}` : "legacy-imported",
    mappedClaims: beliefs.length,
    mappedRelations: relations.length,
    mappedConstraints: constraints.length,
    mappedConflicts: conflicts.length,
    legacyUnverified: native ? 0 : conflicts.length,
    ambiguousFields,
    notes: native
      ? `Imported data declares ${schemaVersion} schema.`
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
    notes: "Current sample session is already normalized into the local WRE5 belief graph model.",
  };
}

function resetLocalSession() {
  const confirmed = window.confirm("Reset the local WRE session and restore the sample workspace?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PREVIOUS_STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PREVIOUS_STORAGE_KEY);
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
  localStorage.removeItem(PREVIOUS_STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(PREVIOUS_STORAGE_KEY);
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
  const privacyMode = els.privacyModeSelect.value || DEFAULT_PRIVACY.privacyMode;
  state.privacy = normalizePrivacy({
    ...state.privacy,
    privacyMode,
    cloudSync: privacyMode !== "local_only" || Boolean(els.cloudSyncToggle.checked),
    nliTriage: Boolean(els.llmTriageToggle.checked),
    retention: els.retentionSelect.value || DEFAULT_PRIVACY.retention,
    syncEndpoint: els.syncEndpointInput.value.trim() || DEFAULT_SYNC_ENDPOINT,
    workspaceId: els.workspaceIdInput.value.trim(),
  });
  recordRevision(
    "privacy",
    `Updated privacy controls: ${privacyModeLabel(state.privacy.privacyMode)}, ${state.privacy.nliTriage ? "NLI triage on" : "NLI triage off"}, ${retentionLabel(state.privacy.retention)} retention.`
  );
  saveState();
  syncPrivacyControls();
  syncSyncBackendControls();
  syncStorageStatus();
  renderDataRightsPanel();
  renderAnalysisPanel();
  renderPipeline();
  renderRevisionReplay();
}

function updateSyncBackendSettings() {
  state.privacy = normalizePrivacy({
    ...state.privacy,
    syncEndpoint: els.syncEndpointInput.value.trim() || DEFAULT_SYNC_ENDPOINT,
    workspaceId: els.workspaceIdInput.value.trim(),
  });
  recordRevision("privacy", `Updated WRE5 sync backend settings for ${state.privacy.syncEndpoint}.`);
  saveState();
  syncSyncBackendControls();
  renderDataRightsPanel();
}

async function createEncryptedWorkspace() {
  if (state.privacy.privacyMode === "local_only") {
    showSyncBackendStatus("Select encrypted sync, private link, or workspace before creating a remote workspace.", "error");
    return;
  }
  try {
    const endpoint = normalizeSyncEndpoint(els.syncEndpointInput.value);
    const token = generateSyncToken();
    const tokenVerifierHash = await sha256Hex(token);
    const payload = await requestSyncJson("/v1/workspaces", {
      method: "POST",
      endpoint,
      body: {
        sessionId: INDEXED_DB_SESSION_ID,
        privacyMode: state.privacy.privacyMode,
        retentionPolicy: state.privacy.retention,
        tokenVerifierHash,
        schemaVersion: WRE_SCHEMA_VERSION,
      },
    });
    const workspaceId = payload.workspaceId || payload.workspace?.id;
    if (!workspaceId) throw new Error("Workspace response did not include an ID.");
    storeSyncToken(token, workspaceId);
    state.privacy = normalizePrivacy({
      ...state.privacy,
      syncEndpoint: endpoint,
      workspaceId,
      syncTokenCreatedAt: new Date().toISOString(),
      lastSyncStatus: "workspace-created",
      lastSyncAt: new Date().toISOString(),
      lastRemoteClock: Number(payload.remoteClock || 0),
    });
    recordRevision("privacy", `Created encrypted sync workspace ${workspaceId}.`);
    saveState();
    syncSyncBackendControls();
    renderDataRightsPanel();
    showSyncBackendStatus(`Workspace ${workspaceId} created. Sync token is stored in this browser only.`, "success");
  } catch (error) {
    showSyncBackendStatus(error?.message || "Workspace creation failed.", "error");
  }
}

async function pushEncryptedSyncPacket() {
  if (state.privacy.privacyMode === "local_only") {
    showSyncBackendStatus("Local-only sessions do not push to the Worker.", "error");
    return;
  }
  const token = resolveSyncTokenFromInput();
  const passphrase = els.archivePassphraseInput.value;
  if (!state.privacy.workspaceId || !token) {
    showSyncBackendStatus("Create a workspace and keep its sync token before pushing.", "error");
    return;
  }
  if (!passphrase || passphrase.length < 8) {
    showSyncBackendStatus("Enter an archive passphrase with at least 8 characters before pushing encrypted data.", "error");
    els.archivePassphraseInput.focus();
    return;
  }
  try {
    const packet = buildSyncPacketPayload();
    const encryptedPayload = await encryptSessionPayload(packet, passphrase);
    const response = await requestSyncJson("/v1/sync/push", {
      method: "POST",
      token,
      body: {
        schemaVersion: `${WRE_SCHEMA_VERSION}-encrypted-sync-push`,
        workspaceId: state.privacy.workspaceId,
        sessionId: INDEXED_DB_SESSION_ID,
        idempotencyKey: packet.manifest.idempotencyKey,
        manifest: packet.manifest,
        mutationSet: packet.mutationSet,
        encryptedPayload,
      },
    });
    state.privacy = normalizePrivacy({
      ...state.privacy,
      lastSyncStatus: response.status || "pushed",
      lastSyncAt: new Date().toISOString(),
      lastRemoteClock: Number(response.remoteClock || response.manifest?.remoteClock || state.privacy.lastRemoteClock || 0),
    });
    recordRevision("privacy", `Pushed encrypted sync packet ${packet.manifest.idempotencyKey} to ${state.privacy.workspaceId}.`);
    saveState();
    syncSyncBackendControls();
    renderDataRightsPanel();
    renderRevisionReplay();
    showSyncBackendStatus(`Encrypted sync pushed (${state.privacy.lastSyncStatus}).`, "success");
  } catch (error) {
    showSyncBackendStatus(error?.message || "Encrypted sync push failed.", "error");
  }
}

async function pullSyncManifest() {
  const token = resolveSyncTokenFromInput();
  if (!state.privacy.workspaceId || !token) {
    showSyncBackendStatus("Workspace ID and sync token are required before pulling.", "error");
    return;
  }
  try {
    const payload = await requestSyncJson(`/v1/sync/pull?workspaceId=${encodeURIComponent(state.privacy.workspaceId)}&sessionId=${encodeURIComponent(INDEXED_DB_SESSION_ID)}`, {
      method: "GET",
      token,
    });
    state.privacy = normalizePrivacy({
      ...state.privacy,
      lastSyncStatus: payload.status || "pulled-manifest",
      lastSyncAt: new Date().toISOString(),
      lastRemoteClock: Number(payload.remoteClock || payload.manifest?.remoteClock || 0),
    });
    recordRevision("privacy", `Pulled remote sync manifest for ${state.privacy.workspaceId}.`);
    saveState();
    syncSyncBackendControls();
    renderDataRightsPanel();
    renderRevisionReplay();
    showSyncBackendStatus(`Remote manifest pulled: clock ${state.privacy.lastRemoteClock}.`, "success");
  } catch (error) {
    showSyncBackendStatus(error?.message || "Sync pull failed.", "error");
  }
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

function focusFormalTrace() {
  state.activeStage = "reflection";
  saveState();
  renderStages();
  focusElement(els.formalTraceList);
}

function focusArgumentationReview() {
  state.activeStage = "reflection";
  saveState();
  renderStages();
  focusElement(els.argumentationList);
}

function focusTriageReview() {
  state.activeStage = "reflection";
  saveState();
  renderStages();
  focusElement(els.triageList);
}

function focusSetupProfile() {
  state.activeStage = "preparation";
  saveState();
  renderStages();
  focusElement(els.setupProfileList);
}

function focusEvidenceRequests() {
  state.activeStage = "reflection";
  saveState();
  renderStages();
  focusElement(els.missingInfoList);
}

function focusRulePacks() {
  state.activeStage = "integration";
  saveState();
  renderStages();
  focusElement(els.rulePackList);
}

function focusEncryptedArchive() {
  focusElement(els.dataRightsPanel);
  els.archivePassphraseInput.focus();
}

function focusSyncReadiness() {
  focusElement(els.syncReadinessList);
}

function focusSecurityControls() {
  focusElement(els.dataRightsPanel);
  els.quotaPerHourInput.focus();
}

function getVisibleBeliefs() {
  if (state.workbenchFilter === "all") return state.beliefs;
  return state.beliefs.filter((belief) => belief.layer === state.workbenchFilter);
}

function getVisibleRelations() {
  if (!agentContract.relationTypes.includes(state.relationTypeFilter)) return state.relations;
  return state.relations.filter((relation) => relation.type === state.relationTypeFilter);
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
    preparation: document.querySelector(".setup-panel") || document.querySelector(".session-card"),
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
      id: `RV-${String(state.revisions.length + 1).padStart(3, "0")}`,
      time: new Date().toISOString(),
      type,
      text,
      schemaVersion: WRE_SCHEMA_VERSION,
      algorithmVersion: WRE_ENGINE_VERSION,
      ...extra,
    })
  );
}

function buildAgentContractPayload() {
  return {
    schemaVersion: agentContract.schemaVersion,
    architecture: agentContract.architecture,
    publicArtifacts: agentContract.publicArtifacts,
    agentProfile: normalizeAgentProfile(state.agentProfile),
    setupTemplates,
    beliefItemFields: agentContract.beliefItemFields,
    claimFields: agentContract.claimFields,
    relationFields: agentContract.relationFields,
    constraintFields: agentContract.constraintFields,
    agentProfileFields: agentContract.agentProfileFields,
    formalRunFields: agentContract.formalRunFields,
    argumentationRunFields: agentContract.argumentationRunFields,
    triageRunFields: agentContract.triageRunFields,
    syncPacketFields: agentContract.syncPacketFields,
    repairOptionFields: agentContract.repairOptionFields,
    revisionEventFields: agentContract.revisionEventFields,
    evidenceRequestFields: agentContract.evidenceRequestFields,
    rulePackFields: agentContract.rulePackFields,
    exportFormats: agentContract.exportFormats,
    relationTypes: agentContract.relationTypes,
    conflictKinds: agentContract.conflictKinds,
    conflictClasses: agentContract.conflictClasses,
    conflictSignals: agentContract.conflictSignals,
    jsonSchemas: buildJsonSchemasPayload(),
    examples: buildAgentRequestExamples(),
    rulePacks: domainRulePacks,
    missingInformation: buildMissingInformationReport({ preview: true }),
    endpoints: agentContract.endpoints.map(([method, path, description]) => ({ method, path, description })),
    exportFormats: agentContract.exportFormats,
    securityControls: normalizeSecurityControls(state.securityControls),
    securityReport: buildSecurityReportPayload(),
    storageReport: buildStorageReportPayload(),
    syncPacket: buildSyncPacketPayload(),
  };
}

function buildJsonSchemasPayload() {
  return {
    schemaVersion: `${WRE_SCHEMA_VERSION}-json-schema`,
    generatedAt: new Date().toISOString(),
    architecture: agentContract.architecture,
    schemas: {
      AgentProfile: {
        type: "object",
        required: ["id", "actorKind", "workflowMode", "activeScope", "permissionsModel", "canonicalStore"],
        properties: {
          id: { type: "string" },
          displayName: { type: "string" },
          actorKind: { type: "string", enum: ["individual_human", "ai_agent", "team", "institution"] },
          workflowMode: { type: "string", enum: ["individual", "shared", "import_trace"] },
          templateId: { type: "string" },
          activeScope: { type: "string" },
          jurisdiction: { type: "string" },
          timeHorizon: { type: "string" },
          conditions: { type: "string" },
          importTraceSource: { type: "string" },
          sharedEquilibrium: { type: "boolean" },
          permissionsModel: { type: "string" },
          canonicalStore: { type: "string" },
        },
      },
      ScopeObject: {
        type: "object",
        required: ["domain", "actor", "time", "jurisdiction", "conditions"],
        properties: {
          domain: { type: "string" },
          actor: { type: "string" },
          time: { type: "string" },
          jurisdiction: { type: "string" },
          conditions: { type: "string" },
        },
      },
      ProvenanceObject: {
        type: "object",
        required: ["sourceType", "sourceRef", "evidenceRefs"],
        properties: {
          sourceType: { type: "string", enum: ["user_supplied", "user", "agent", "import", "assistant", "document", "dataset", "ai_trace", "interview", "policy", "external_reference"] },
          sourceRef: { type: "string" },
          importedAt: { type: "string" },
          evidenceRefs: { type: "array", items: { type: "string" } },
        },
      },
      PropositionObject: {
        type: "object",
        required: ["actor", "action", "modality", "polarity", "scope", "exceptions"],
        properties: {
          actor: { type: "string", minLength: 1 },
          action: { type: "string", minLength: 1 },
          object: { type: "string" },
          propositionType: { type: "string", enum: ["judgment", "principle", "background_theory", "belief_statement", "exception", "empirical_premise", "meta", "deontic", "descriptive"] },
          modality: { type: "string", enum: ["is", "ought", "must", "must_not", "permitted", "forbidden"] },
          polarity: { type: "string", enum: ["positive", "negative", "mixed", "unknown"] },
          scope: { type: "string" },
          exceptions: { type: "array", items: { type: "string" } },
        },
      },
      BeliefItem: {
        type: "object",
        required: ["id", "family", "rawText", "propositionObject", "confidence", "entrenchment", "scope", "provenance", "claimIds", "revisionStatus"],
        properties: {
          id: { type: "string", pattern: "^BI-[A-Z0-9-]+$" },
          family: { type: "string", enum: ["judgment", "principle", "theory", "background", "meta"] },
          rawText: { type: "string", minLength: 1 },
          propositionObject: { $ref: "#/schemas/PropositionObject" },
          confidence: { type: "number", minimum: 1, maximum: 100 },
          entrenchment: { type: "number", minimum: 1, maximum: 100 },
          scope: { $ref: "#/schemas/ScopeObject" },
          provenance: { $ref: "#/schemas/ProvenanceObject" },
          evidenceRefs: { type: "array", items: { type: "string" } },
          references: { type: "array", items: { type: "string" } },
          claimIds: { type: "array", items: { type: "string" } },
          normalizedClaims: { type: "array", items: { type: "object" } },
          revisionStatus: { type: "string", enum: ["active", "draft", "accepted_tension", "retired"] },
        },
      },
      Claim: {
        type: "object",
        required: ["id", "beliefItemId", "kind", "layer", "proposition", "propositionObject", "text", "canonicalForm", "domain", "modality", "polarity", "scope", "scopeObject", "confidence", "entrenchment", "provenance", "provenanceObject", "evidenceRefs", "sensitivity", "status", "revisionStatus"],
        properties: {
          id: { type: "string", pattern: "^[JPTB][0-9]+$" },
          beliefItemId: { type: "string" },
          kind: { type: "string", enum: ["judgment", "principle", "background_theory", "belief_statement", "exception", "empirical_premise", "meta"] },
          layer: { type: "string", enum: ["judgment", "principle", "theory"] },
          proposition: { type: "string", minLength: 1 },
          propositionObject: { $ref: "#/schemas/PropositionObject" },
          text: { type: "string", minLength: 1 },
          canonicalForm: { type: "string" },
          domain: { type: "string", enum: ["normative", "empirical", "conceptual", "meta"] },
          modality: { type: "string", enum: ["is", "ought", "must", "must_not", "permitted", "forbidden"] },
          polarity: { type: "string", enum: ["positive", "negative", "mixed", "unknown"] },
          scope: { type: "string" },
          scopeObject: { $ref: "#/schemas/ScopeObject" },
          exceptions: { type: "array", items: { type: "string" } },
          confidence: { type: "number", minimum: 1, maximum: 100 },
          entrenchment: { type: "number", minimum: 1, maximum: 100 },
          timeScope: { type: "string" },
          provenance: { type: "string" },
          sourceType: { type: "string" },
          provenanceObject: { $ref: "#/schemas/ProvenanceObject" },
          evidenceRefs: { type: "array", items: { type: "string" } },
          references: { type: "array", items: { type: "string" } },
          sensitivity: { type: "string", enum: ["private", "pseudonymous", "public"] },
          status: { type: "string", enum: ["active", "draft", "accepted_tension", "retired"] },
          revisionStatus: { type: "string", enum: ["active", "draft", "accepted_tension", "retired"] },
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
          conflictClass: { type: "string", enum: agentContract.conflictClasses },
          signalType: { type: "string", enum: agentContract.conflictSignals },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          constraintId: { type: "string" },
          core: { type: "array", items: { type: "string" } },
          engine: { type: "array", items: { type: "string" } },
          why: { type: "string" },
          status: { type: "string", enum: ["open", "repaired", "ignored", "accepted_tension"] },
          tensionRationale: { type: "string" },
          minimalConflictSet: { type: "array", items: { type: "string" } },
          evidencePath: { type: "array", items: { type: "object" } },
          downstreamClaims: { type: "array", items: { type: "object" } },
          evidenceRequests: { type: "array", items: { $ref: "#/schemas/EvidenceRequest" } },
          algorithmVersion: { type: "string" },
          explanation: { type: "object" },
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
          actionType: { type: "string", enum: ["revise_scope", "add_exception", "lower_confidence", "edit_text", "archive_item", "request_missing_evidence"] },
          targetId: { type: "string" },
          affectedClaims: { type: "array", items: { type: "string" } },
          predictedResolutionScore: { type: "number", minimum: 0, maximum: 1 },
          estimatedCost: { type: "number", minimum: 0 },
          disruptionCost: { type: "number", minimum: 0 },
          explanation: { type: "string" },
          cost: { type: "string" },
        },
      },
      EvidenceRequest: {
        type: "object",
        required: ["id", "targetType", "targetId", "priority", "prompt", "reason", "suggestedAction", "status"],
        properties: {
          id: { type: "string", pattern: "^ER-[0-9]+$|^ER-preview$" },
          targetType: { type: "string", enum: ["claim", "conflict", "relation", "session"] },
          targetId: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "review"] },
          prompt: { type: "string" },
          reason: { type: "string" },
          suggestedAction: { type: "string" },
          targetClaims: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["open", "resolved", "postponed"] },
        },
      },
      RulePack: {
        type: "object",
        required: ["id", "label", "status", "engine", "checks"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          status: { type: "string" },
          engine: { type: "string" },
          checks: { type: "array", items: { type: "string" } },
        },
      },
      RevisionEvent: {
        type: "object",
        required: ["id", "time", "type", "text", "schemaVersion", "algorithmVersion"],
        properties: {
          id: { type: "string", pattern: "^RV-[0-9]+$|^RV-[0-9]{13,}$" },
          time: { type: "string", format: "date-time" },
          type: { type: "string" },
          text: { type: "string" },
          schemaVersion: { type: "string", const: WRE_SCHEMA_VERSION },
          algorithmVersion: { type: "string" },
          conflictId: { type: "string" },
          repairId: { type: "string" },
          affectedClaims: { type: "array", items: { type: "string" } },
          predictedResolutionScore: { type: ["number", "null"], minimum: 0, maximum: 1 },
          disruptionCost: { type: ["number", "null"], minimum: 0 },
          beforeHash: { type: "string" },
          afterHash: { type: "string" },
          beforeSnapshot: { type: ["object", "null"] },
          afterSnapshot: { type: ["object", "null"] },
        },
      },
      FormalRun: {
        type: "object",
        required: ["id", "status", "assertions", "constraints", "unsatCores", "repairRanking"],
        properties: {
          id: { type: "string", pattern: "^F-[0-9]+$|^F-preview$" },
          analysisRunId: { type: "string" },
          time: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["unsat", "sat-with-soft-tensions"] },
          satisfiable: { type: "boolean" },
          engineVersions: { type: "array", items: { type: "string" } },
          assertions: { type: "array", items: { type: "object" } },
          constraints: { type: "array", items: { type: "object" } },
          unsatCores: { type: "array", items: { type: "object" } },
          softTensions: { type: "array", items: { type: "object" } },
          repairRanking: { type: "array", items: { type: "object" } },
        },
      },
      ArgumentationRun: {
        type: "object",
        required: ["id", "attackEdges", "defenseEdges", "admissibleSet", "vulnerableClaims"],
        properties: {
          id: { type: "string", pattern: "^G-[0-9]+$|^G-preview$" },
          analysisRunId: { type: "string" },
          time: { type: "string", format: "date-time" },
          attackEdges: { type: "array", items: { type: "object" } },
          supportEdges: { type: "array", items: { type: "object" } },
          defenseEdges: { type: "array", items: { type: "object" } },
          admissibleSet: { type: "array", items: { type: "string" } },
          groundedExtension: { type: "array", items: { type: "string" } },
          vulnerableClaims: { type: "array", items: { type: "object" } },
          contestedClaims: { type: "array", items: { type: "object" } },
          summary: { type: "string" },
        },
      },
      TriageRun: {
        type: "object",
        required: ["id", "nliMode", "candidateLimit", "reviewQueue", "formalizationCandidates", "probabilisticSummary"],
        properties: {
          id: { type: "string", pattern: "^N-[0-9]+$|^N-preview$" },
          analysisRunId: { type: "string" },
          time: { type: "string", format: "date-time" },
          nliMode: { type: "string", enum: ["local-preview", "opt-in-selected-pairs"] },
          externalProcessing: { type: "boolean" },
          candidateLimit: { type: "number" },
          queuedPairCount: { type: "number" },
          reviewQueue: { type: "array", items: { type: "object" } },
          formalizationCandidates: { type: "array", items: { type: "object" } },
          probabilisticSummary: { type: "object" },
          adapter: { type: "string" },
        },
      },
      SyncPacket: {
        type: "object",
        required: ["schemaVersion", "workspace", "manifest", "mutationSet", "edgeContract", "conflictPolicy", "readiness", "backend"],
        properties: {
          schemaVersion: { type: "string", const: `${WRE_SCHEMA_VERSION}-sync-packet` },
          generatedAt: { type: "string", format: "date-time" },
          workspace: { type: "object" },
          manifest: { type: "object" },
          mutationSet: { type: "object" },
          edgeContract: { type: "object" },
          conflictPolicy: { type: "object" },
          readiness: { type: "object" },
          backend: { type: "object" },
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
          generatedCount: { type: "number" },
          missingInfoCount: { type: "number" },
          nliQueued: { type: "number" },
          estimatedHybridLatency: { type: "number" },
          engines: { type: "array", items: { type: "string" } },
          deterministicSignals: { type: "array", items: { type: "object" } },
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
        required: ["quotaPerHour", "bodyLimitKb", "analysisClaimCap", "nliPairCap", "monthlyBudgetUsd", "telemetryMode", "complianceStatus", "syncAuthRequired", "incidentRunbook", "modelTrainingPolicy", "humanReviewPath"],
        properties: {
          quotaPerHour: { type: "number", minimum: 1 },
          bodyLimitKb: { type: "number", minimum: 16 },
          analysisClaimCap: { type: "number", minimum: 10 },
          nliPairCap: { type: "number", minimum: 0 },
          monthlyBudgetUsd: { type: "number", minimum: 0 },
          telemetryMode: { type: "string", enum: ["off", "local", "otlp-ready"] },
          complianceStatus: { type: "string", enum: ["draft", "mapped", "launch-ready"] },
          syncAuthRequired: { type: "boolean" },
          restoreDrillCadence: { type: "string" },
          dpiaReview: { type: "string" },
          asvsMapping: { type: "string" },
          incidentRunbook: { type: "string" },
          modelTrainingPolicy: { type: "string" },
          humanReviewPath: { type: "string" },
          cspMode: { type: "string" },
          dependencyScanning: { type: "string" },
          publicFormAbuse: { type: "string" },
        },
      },
      SessionExport: {
        type: "object",
        required: ["schemaVersion", "session", "agentProfile", "beliefItems", "claims", "beliefs", "relations", "conflicts"],
        properties: {
          schemaVersion: { type: "string", const: WRE_SCHEMA_VERSION },
          session: { type: "object" },
          agentProfile: { $ref: "#/schemas/AgentProfile" },
          beliefItems: { type: "array", items: { $ref: "#/schemas/BeliefItem" } },
          claims: { type: "array", items: { $ref: "#/schemas/Claim" } },
          beliefs: { type: "array", items: { $ref: "#/schemas/Claim" } },
          relations: { type: "array", items: { $ref: "#/schemas/Relation" } },
          constraints: { type: "array", items: { $ref: "#/schemas/Constraint" } },
          conflicts: { type: "array", items: { $ref: "#/schemas/Conflict" } },
          revisions: { type: "array", items: { $ref: "#/schemas/RevisionEvent" } },
          schema: {
            type: "object",
            properties: {
              exportFormats: { type: "array", items: { type: "string", enum: agentContract.exportFormats } },
            },
          },
          analysisRuns: { type: "array", items: { $ref: "#/schemas/AnalysisRun" } },
          formalRuns: { type: "array", items: { $ref: "#/schemas/FormalRun" } },
          argumentationRuns: { type: "array", items: { $ref: "#/schemas/ArgumentationRun" } },
          triageRuns: { type: "array", items: { $ref: "#/schemas/TriageRun" } },
          syncPacket: { $ref: "#/schemas/SyncPacket" },
          missingInformation: { type: "object", properties: { requests: { type: "array", items: { $ref: "#/schemas/EvidenceRequest" } } } },
          rulePacks: { type: "array", items: { $ref: "#/schemas/RulePack" } },
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
      description: "Deterministic WRE5 local-first belief graph contract for humans, AI agents, teams, institutions, and optional encrypted Cloudflare sync.",
    },
    paths: Object.fromEntries(agentContract.endpoints.map(([method, path, description]) => {
      const operation = method.toLowerCase();
      return [
        path,
        {
          [operation]: {
            summary: description,
            operationId: operationIdFor(method, path),
            security: endpointRequiresBearer(method, path) ? [{ bearerAuth: [] }] : [],
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
    "x-wre-architecture": agentContract.architecture,
    "x-wre-rule-packs": domainRulePacks,
    "x-wre-security": buildSecurityReportPayload(),
    "x-wre-storage": buildStorageReportPayload(),
  };
}

function endpointRequiresBearer(method, path) {
  if (!state.securityControls.syncAuthRequired) return false;
  if (path === "/health" || path === "/v1/workspaces") return false;
  return path.startsWith("/v1/sync/") || path.startsWith("/v1/sessions/");
}

function requestBodyForEndpoint(method, path) {
  if (method === "GET" || method === "DELETE") return undefined;
  if (path === "/v1/belief-items") return jsonRequestBody("Belief item batch", { type: "object", properties: { beliefItems: { type: "array", items: { $ref: "#/components/schemas/BeliefItem" } } } });
  if (path === "/v1/beliefs") return jsonRequestBody("Claim batch", { type: "object", properties: { beliefs: { type: "array", items: { $ref: "#/components/schemas/Claim" } } } });
  if (path === "/v1/relations") return jsonRequestBody("Relation batch", { type: "object", properties: { relations: { type: "array", items: { $ref: "#/components/schemas/Relation" } } } });
  if (path === "/v1/constraints") return jsonRequestBody("Constraint batch", { type: "object", properties: { constraints: { type: "array", items: { $ref: "#/components/schemas/Constraint" } } } });
  if (path === "/v1/conflicts/{id}/repair") return jsonRequestBody("Repair application", { type: "object", properties: { repairId: { type: "string" }, mode: { type: "string", enum: ["preview", "apply"] } } });
  if (path === "/v1/workspaces") return jsonRequestBody("Encrypted workspace create", {
    type: "object",
    required: ["sessionId", "privacyMode", "retentionPolicy", "tokenVerifierHash"],
    properties: {
      sessionId: { type: "string" },
      privacyMode: { type: "string", enum: ["encrypted_sync", "private_link", "workspace"] },
      retentionPolicy: { type: "string" },
      tokenVerifierHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
      schemaVersion: { type: "string", const: WRE_SCHEMA_VERSION },
    },
  });
  if (path === "/v1/sync/push") return jsonRequestBody("Encrypted sync push", {
    type: "object",
    required: ["workspaceId", "sessionId", "idempotencyKey", "manifest", "mutationSet", "encryptedPayload"],
    properties: {
      schemaVersion: { type: "string", const: `${WRE_SCHEMA_VERSION}-encrypted-sync-push` },
      workspaceId: { type: "string" },
      sessionId: { type: "string" },
      idempotencyKey: { type: "string" },
      manifest: { type: "object" },
      mutationSet: { type: "object" },
      encryptedPayload: { type: "object" },
    },
  });
  if (path === "/v1/sync/resolve") return jsonRequestBody("Sync conflict resolution", {
    type: "object",
    required: ["workspaceId", "sessionId", "resolutionId", "strategy"],
    properties: {
      workspaceId: { type: "string" },
      sessionId: { type: "string" },
      resolutionId: { type: "string" },
      strategy: { type: "string", enum: ["local_wins", "remote_wins", "manual_merge", "accept_tension"] },
      rationale: { type: "string" },
      mergedManifest: { type: "object" },
    },
  });
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
  if (path === "/v1/rule-packs/{id}/run") return jsonRequestBody("Rule-pack preview", { type: "object", properties: { sessionId: { type: "string" }, packId: { type: "string" }, mode: { type: "string", enum: ["preview", "apply"] } } });
  if (path === "/v1/sessions") return jsonRequestBody("Session create", { type: "object", properties: { scope: { type: "string" }, agentProfile: { $ref: "#/components/schemas/AgentProfile" }, privacy: { type: "object" } } });
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
  if (path === "/health") {
    return {
      "200": {
        description: "Worker health, schema, and storage binding readiness.",
        content: { "application/json": { schema: { type: "object" } } },
      },
    };
  }

  if (path === "/v1/workspaces") {
    return {
      "201": {
        description: "Encrypted sync workspace metadata. The raw token remains client-side.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                workspaceId: { type: "string" },
                remoteClock: { type: "number" },
                status: { type: "string" },
              },
            },
          },
        },
      },
    };
  }

  if (["/v1/sync/push", "/v1/sync/pull", "/v1/sync/resolve", "/v1/sessions/{id}/manifest"].includes(path)) {
    return {
      "200": {
        description: "Encrypted sync manifest metadata, vector clock, tombstones, and merge policy response.",
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      },
    };
  }

  if (method === "DELETE" && path === "/v1/sessions/{id}") {
    return {
      "200": {
        description: "Deletion tombstone recorded and known encrypted objects removed when available.",
        content: { "application/json": { schema: { type: "object" } } },
      },
    };
  }

  if (path === "/v1/formal-trace/latest") {
    return {
      "200": {
        description: "Latest local formal solver trace with named assertions, templates, unsat cores, and repair ranking.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/FormalRun" },
          },
        },
      },
    };
  }

  if (path === "/v1/argumentation/latest") {
    return {
      "200": {
        description: "Latest argumentation analysis with attack edges, defense edges, admissible set, and vulnerable claims.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ArgumentationRun" },
          },
        },
      },
    };
  }

  if (path === "/v1/triage/latest") {
    return {
      "200": {
        description: "Latest NLI-style and probabilistic triage run with candidate-pair scores and formalization suggestions.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TriageRun" },
          },
        },
      },
    };
  }

  if (path === "/v1/evidence-requests") {
    return {
      "200": {
        description: "Missing-information requests for scope, provenance, evidence, and relation-path gaps.",
        content: { "application/json": { schema: { type: "object", properties: { requests: { type: "array", items: { $ref: "#/components/schemas/EvidenceRequest" } } } } } },
      },
    };
  }

  if (path === "/v1/rule-packs") {
    return {
      "200": {
        description: "Available deterministic rule-pack hooks.",
        content: { "application/json": { schema: { type: "object", properties: { rulePacks: { type: "array", items: { $ref: "#/components/schemas/RulePack" } } } } } },
      },
    };
  }

  if (path === "/v1/schema/wre5") {
    return {
      "200": {
        description: "Public WRE5 JSON schema and agent contract.",
        content: { "application/json": { schema: { type: "object" } } },
      },
    };
  }

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
      path: "/v1/belief-items",
      description: "Batch add raw belief items before normalization into typed claims.",
      body: {
        agentProfile: normalizeAgentProfile(state.agentProfile),
        beliefItems: buildBeliefItems().slice(0, 2),
      },
    },
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
      path: "/v1/formal-trace/latest",
      description: "Inspect the latest local named-assertion trace and unsat-core repair ranking.",
      body: {
        includeAssertions: true,
        includeRepairRanking: true,
      },
    },
    {
      method: "GET",
      path: "/v1/argumentation/latest",
      description: "Inspect attack, defense, vulnerable-claim, and admissible-set evidence.",
      body: {
        includeAttackEdges: true,
        includeAdmissibleSet: true,
      },
    },
    {
      method: "GET",
      path: "/v1/triage/latest",
      description: "Inspect local NLI-style and probabilistic candidate-pair triage.",
      body: {
        includeReviewQueue: true,
        includeFormalizationCandidates: true,
      },
    },
    {
      method: "GET",
      path: "/v1/evidence-requests",
      description: "Inspect missing-information requests generated by deterministic checks.",
      body: {
        requests: buildMissingInformationReport({ preview: true }).requests.slice(0, 3),
      },
    },
    {
      method: "GET",
      path: "/v1/rule-packs",
      description: "Inspect deterministic domain-rule pack hooks available to the session.",
      body: {
        rulePacks: domainRulePacks,
      },
    },
    {
      method: "POST",
      path: "/v1/workspaces",
      description: "Create an encrypted sync workspace. Store the raw token in the browser; send only its verifier hash.",
      body: {
        sessionId: INDEXED_DB_SESSION_ID,
        privacyMode: state.privacy.privacyMode === "local_only" ? "encrypted_sync" : state.privacy.privacyMode,
        retentionPolicy: state.privacy.retention,
        tokenVerifierHash: "sha256(sync-token)",
        schemaVersion: WRE_SCHEMA_VERSION,
      },
    },
    {
      method: "POST",
      path: "/v1/sync/push",
      description: "Upload the encrypted local mutation packet after explicit sync consent.",
      body: {
        schemaVersion: `${WRE_SCHEMA_VERSION}-encrypted-sync-push`,
        workspaceId: state.privacy.workspaceId || "wsp_example",
        sessionId: INDEXED_DB_SESSION_ID,
        idempotencyKey: buildSyncPacketPayload().manifest.idempotencyKey,
        manifest: buildSyncPacketPayload().manifest,
        mutationSet: buildSyncPacketPayload().mutationSet,
        encryptedPayload: {
          schemaVersion: `${WRE_SCHEMA_VERSION}-encrypted-archive`,
          salt: "base64",
          iv: "base64",
          ciphertext: "base64",
        },
      },
    },
    {
      method: "GET",
      path: "/v1/export",
      description: "Request a portable archive as JSON, linked data, or a spreadsheet-safe summary.",
      body: {
        accept: agentContract.exportFormats,
        includes: ["agentProfile", "beliefItems", "claims", "relations", "constraints", "conflicts", "evidenceRequests", "revisions"],
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

function getLatestFormalRun() {
  return state.formalRuns[state.formalRuns.length - 1] || null;
}

function getLatestArgumentationRun() {
  return state.argumentationRuns[state.argumentationRuns.length - 1] || null;
}

function getLatestTriageRun() {
  return state.triageRuns[state.triageRuns.length - 1] || null;
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

function nextFormalRunId() {
  const max = state.formalRuns
    .map((run) => Number(String(run.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `F-${String(max + 1).padStart(3, "0")}`;
}

function nextArgumentationRunId() {
  const max = state.argumentationRuns
    .map((run) => Number(String(run.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `G-${String(max + 1).padStart(3, "0")}`;
}

function nextTriageRunId() {
  const max = state.triageRuns
    .map((run) => Number(String(run.id).replace(/^[A-Z-]+/, "")) || 0)
    .reduce((highest, value) => Math.max(highest, value), 0);
  return `N-${String(max + 1).padStart(3, "0")}`;
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
      "contradicts",
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

function hashPayload(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
  if (type === "setup") return "Setup changed";
  return "Session event";
}

function relationTypeLabel(type) {
  if (type === "exception_to") return "Exception to";
  if (type === "depends_on") return "Depends on";
  if (type === "contradicts") return "Contradicts";
  if (type === "implies") return "Implies";
  if (type === "entails") return "Entails";
  if (type === "scopes") return "Scopes";
  if (type === "defines") return "Defines";
  return titleCase(String(type || "depends_on").replace(/_/g, " "));
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
