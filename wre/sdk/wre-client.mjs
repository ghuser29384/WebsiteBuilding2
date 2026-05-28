export const WRE_SCHEMA_VERSION = "wre-5";

export const relationTypes = [
  "supports",
  "contradicts",
  "implies",
  "depends_on",
  "exception_to",
  "attacks",
  "entails",
  "undercuts",
  "scopes",
  "defines",
];

export const conflictSignals = [
  "direct_negation",
  "implication_conflict",
  "deontic_clash",
  "threshold_conflict",
  "scope_clash",
  "exception_mismatch",
  "rule_constraint",
  "semantic_tension",
  "unsupported_belief",
];

export const conflictClasses = [
  "direct_contradiction",
  "principle_judgment_mismatch",
  "theory_judgment_mismatch",
  "deontic_clash",
  "scope_exception_mismatch",
  "unsupported_belief",
  "semantic_tension",
];

export const beliefFamilies = ["judgment", "principle", "theory", "background", "meta"];

export function createBeliefItem({
  id,
  family = "judgment",
  proposition,
  propositionObject = {},
  rawText,
  confidence = 70,
  entrenchment = 60,
  scope = {},
  provenance = {},
  evidenceRefs = [],
  references = [],
  claimIds = [],
  revisionStatus = "draft",
}) {
  return {
    id: id || `BI-${crypto.randomUUID()}`,
    family: normalizeFamily(family),
    rawText: String(rawText || proposition || "").trim(),
    propositionObject: normalizePropositionObject(propositionObject, { text: rawText || proposition, family }),
    confidence: clampNumber(confidence, 1, 100),
    entrenchment: clampNumber(entrenchment, 1, 100),
    scope: normalizeScope(scope),
    provenance: normalizeProvenance(provenance, evidenceRefs),
    evidenceRefs: normalizeStringList(evidenceRefs),
    references: normalizeStringList(references),
    claimIds: normalizeStringList(claimIds),
    revisionStatus,
  };
}

export function beliefItemToClaim(item, overrides = {}) {
  const family = normalizeFamily(item.family);
  const layer = family === "background" || family === "meta" ? "theory" : family;
  const id = overrides.id || item.claimIds?.[0] || `${prefixForLayer(layer)}1`;
  const text = overrides.proposition || overrides.text || item.proposition || item.rawText || "";
  const propositionObject = normalizePropositionObject(overrides.propositionObject || item.propositionObject, { text, family: layer });
  return {
    id,
    beliefItemId: item.id,
    kind: overrides.kind || (layer === "theory" ? "background_theory" : layer),
    layer,
    proposition: text,
    propositionObject,
    structuredProposition: propositionObject,
    exceptions: propositionObject.exceptions,
    text,
    canonicalForm: canonicalize(text),
    domain: overrides.domain || (layer === "theory" ? "empirical" : "normative"),
    modality: overrides.modality || propositionObject.modality || inferModality(text),
    polarity: overrides.polarity || propositionObject.polarity || inferPolarity(text),
    scope: item.scope.conditions || "Unscoped",
    scopeObject: item.scope,
    confidence: item.confidence,
    entrenchment: item.entrenchment,
    provenance: item.provenance.sourceRef,
    provenanceObject: item.provenance,
    evidenceRefs: item.evidenceRefs,
    references: item.references,
    sensitivity: overrides.sensitivity || "private",
    status: overrides.status || item.revisionStatus || "draft",
    revisionStatus: overrides.revisionStatus || item.revisionStatus || "draft",
  };
}

export function createPropositionObject({ actor, action, object = "", propositionType = "belief_statement", modality = "ought", polarity = "positive", scope = "default", exceptions = [] } = {}) {
  return normalizePropositionObject({ actor, action, object, propositionType, modality, polarity, scope, exceptions });
}

export function createEvidenceRequest({ targetType, targetId, priority = "review", prompt, reason, suggestedAction, targetClaims = [] }) {
  return {
    id: `ER-${crypto.randomUUID()}`,
    targetType,
    targetId,
    priority,
    prompt,
    reason,
    suggestedAction,
    targetClaims: normalizeStringList(targetClaims),
    status: "open",
  };
}

function normalizeScope(scope) {
  return {
    domain: String(scope.domain || "general"),
    actor: String(scope.actor || "unspecified actor"),
    time: String(scope.time || "unspecified time"),
    jurisdiction: String(scope.jurisdiction || "unspecified jurisdiction"),
    conditions: String(scope.conditions || "Unscoped"),
  };
}

function normalizeProvenance(provenance, evidenceRefs) {
  return {
    sourceType: normalizeSourceType(provenance.sourceType || "user_supplied"),
    sourceRef: String(provenance.sourceRef || "User supplied"),
    evidenceRefs: normalizeStringList(provenance.evidenceRefs || evidenceRefs),
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
}

function normalizePropositionObject(value = {}, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const text = String(fallback.text || "").trim();
  return {
    actor: normalizeToken(source.actor || inferActor(text) || "unspecified_actor"),
    action: normalizeToken(source.action || inferAction(text) || "unspecified_action"),
    object: normalizeToken(source.object || ""),
    propositionType: String(source.propositionType || source.type || fallback.family || "belief_statement").replace(/-/g, "_").toLowerCase(),
    modality: normalizeModality(source.modality || inferModality(text)),
    polarity: source.polarity || inferPolarity(text),
    scope: normalizeToken(source.scope || fallback.scope || "default"),
    exceptions: normalizeStringList(source.exceptions),
  };
}

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeFamily(value) {
  const family = String(value || "judgment").toLowerCase().replace(/-/g, "_");
  return beliefFamilies.includes(family) ? family : "judgment";
}

function normalizeSourceType(value) {
  const sourceType = String(value || "user_supplied").toLowerCase().replace(/-/g, "_");
  const allowed = ["user_supplied", "user", "agent", "import", "assistant", "document", "dataset", "ai_trace", "interview", "policy", "external_reference"];
  return allowed.includes(sourceType) ? sourceType : "user_supplied";
}

function prefixForLayer(layer) {
  if (layer === "principle") return "P";
  if (layer === "theory") return "T";
  return "J";
}

function canonicalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function inferModality(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("forbid") || lower.includes("must not") || lower.includes("should not")) return "forbidden";
  if (lower.includes(" must ") || lower.startsWith("must ") || lower.includes("required")) return "must";
  if (lower.includes("may ") || lower.includes("permit")) return "permitted";
  if (lower.includes(" is ") || lower.includes(" are ")) return "is";
  return "ought";
}

function normalizeModality(value) {
  const modality = String(value || "ought").replace(/-/g, "_").toLowerCase();
  if (["is", "ought", "must", "must_not", "permitted", "forbidden"].includes(modality)) return modality;
  if (modality === "should") return "ought";
  if (modality === "permits" || modality === "may") return "permitted";
  if (modality === "forbids") return "forbidden";
  return "ought";
}

function inferPolarity(text) {
  return /\b(no|not|never|without|prohibit|reject)\b/i.test(text) ? "negative" : "positive";
}

function inferActor(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("hiring")) return "hiring_decision";
  if (lower.includes("agent")) return "agent";
  return "";
}

function inferAction(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("protected attribute") || lower.includes("protected trait")) return "uses_protected_attributes";
  if (lower.includes("experience")) return "uses_relevant_experience";
  if (lower.includes("transparent") || lower.includes("disclos")) return "discloses_decision_reasons";
  return "";
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}
