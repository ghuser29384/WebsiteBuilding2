import { Router } from "express";
import { CloudLLMAdapter, LocalLLMAdapter, type LLMJsonAdapter } from "../lib/aiAdapters";
import {
  InMemoryEmbeddingProvider,
  InMemoryVectorStore,
  ingestDocuments,
  retrieveRelevant,
  type RAGDocument,
} from "../lib/rag";
import {
  getWRESessionById,
  runCoherenceEngine,
  type Judgment,
  type WRESession,
} from "./wreRoutes";

export interface AISummarizeJudgmentRequest {
  judgmentId: string;
  text: string;
}

export interface AISummarizeJudgmentResponse {
  summary: string;
  assumptions: string[];
}

export interface AIGeneratePrinciplesRequest {
  judgmentIds: string[];
}

export interface AIGeneratedPrinciple {
  id?: string;
  title: string;
  statement: string;
  scope: "universal" | "contextual" | "defeasible";
  supportingJudgmentIds: string[];
}

export interface AISuggestRevisionsRequest {
  conflictSet: {
    judgmentIds: string[];
    principleIds: string[];
  };
  maxSuggestions?: number;
}

export interface AIRevisionSuggestion {
  action_type: "lower_confidence" | "reject_judgment" | "generalize_principle";
  target_id: string;
  change: string;
  rationale: string;
  expected_effect_delta: number;
  confidence_estimate: number;
}

const DEFAULT_MODEL = process.env.AI_MODEL || "wre-deterministic-v1";
const DEFAULT_MAX_SUGGESTIONS = 3;
const MAX_TEXT_LENGTH = 1200;
const MAX_ASSUMPTION_LENGTH = 180;
const MAX_SUMMARY_LENGTH = 480;
const MAX_STATEMENT_LENGTH = 420;
const MAX_RATIONALE_LENGTH = 460;
const MAX_RATE_LIMIT_PER_MIN = Number(process.env.AI_RATE_LIMIT_PER_MIN || 30);

export const AI_SEND_TO_THIRD_PARTY =
  (process.env.AI_SEND_TO_THIRD_PARTY || "false").trim().toLowerCase() === "true";

export const AI_PROMPT_TEMPLATES = {
  summarizeJudgment: {
    system:
      "You are a reflective-equilibrium assistant. Return only JSON with keys: summary, assumptions. No markdown.",
    user:
      "Summarize judgment {judgmentId} from text {text}. Output JSON: {\"summary\": string, \"assumptions\": string[] }",
  },
  generatePrinciples: {
    system:
      "You draft candidate principles for wide reflective equilibrium. Return only JSON array.",
    user:
      "Given judgments {judgmentIds}, output JSON array of objects with exact keys: title, statement, scope, supportingJudgmentIds.",
  },
  suggestRevisions: {
    system:
      "You suggest minimal revisions for coherence improvement. Return only JSON array with exact fields.",
    user:
      "Given conflictSet {judgmentIds, principleIds}, output JSON array with: action_type, target_id, change, rationale, expected_effect_delta, confidence_estimate.",
  },
} as const;

const embeddingProvider = new InMemoryEmbeddingProvider(128);
const vectorStore = new InMemoryVectorStore();
const indexedVersion = new Map<string, string>();

const rateBuckets = new Map<string, number[]>();

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
};

const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
};

const sanitizeText = (value: unknown, maxLength = 500): string => {
  const normalized = normalizeWhitespace(String(value ?? ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return normalized.slice(0, maxLength);
};

const splitSentences = (value: string): string[] => {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const titleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const containsAny = (text: string, needles: string[]): boolean => {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
};

const getRequesterId = (body: unknown, headerValue: string | undefined): string => {
  const fromHeader = sanitizeText(headerValue || "", 80);
  if (fromHeader) return fromHeader;

  const actor =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).actorId || (body as Record<string, unknown>).currentUserId
      : "";
  const fromBody = sanitizeText(actor, 80);
  return fromBody || "anonymous_user";
};

const checkRateLimit = (requesterId: string, endpointName: string): boolean => {
  const key = `${requesterId}:${endpointName}`;
  const now = Date.now();
  const windowMs = 60_000;
  const existing = rateBuckets.get(key) || [];
  const recent = existing.filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= MAX_RATE_LIMIT_PER_MIN) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return true;
};

const maybeGetAdapter = (): LLMJsonAdapter => {
  const provider = (process.env.AI_PROVIDER || "local").trim().toLowerCase();
  if (provider === "cloud") {
    return new CloudLLMAdapter();
  }
  return new LocalLLMAdapter();
};

const sessionNamespace = (sessionId: string): string => `wre:${sessionId}`;

const buildRagDocs = (session: WRESession): RAGDocument[] => {
  const docs: RAGDocument[] = [];

  for (const judgment of session.judgments) {
    docs.push({
      id: `judgment:${judgment.id}`,
      text: `${judgment.text}\nTags: ${judgment.tags.join(", ")}\nSource: ${judgment.sourceNote}`,
      metadata: { type: "judgment", sourceId: judgment.id },
    });
  }

  for (const principle of session.principles) {
    docs.push({
      id: `principle:${principle.id}`,
      text: `${principle.text}\nScope: ${principle.scope}\nPlausibility: ${principle.plausibility.toFixed(2)}`,
      metadata: { type: "principle", sourceId: principle.id },
    });
  }

  return docs;
};

const ensureRagIndex = async (session: WRESession): Promise<void> => {
  const version = indexedVersion.get(session.id);
  if (version === session.updatedAt) return;

  const docs = buildRagDocs(session);
  await ingestDocuments(sessionNamespace(session.id), docs, embeddingProvider, vectorStore, {
    maxChars: 340,
    overlapChars: 40,
  });
  indexedVersion.set(session.id, session.updatedAt);
};

const safeAssumption = (value: string): string => sanitizeText(value, MAX_ASSUMPTION_LENGTH);

const deterministicSummarize = (
  judgmentId: string,
  text: string,
  contextSnippets: string[]
): AISummarizeJudgmentResponse => {
  const cleaned = sanitizeText(text, MAX_TEXT_LENGTH);
  const sentences = splitSentences(cleaned);
  const summaryBase = sentences.slice(0, 2).join(" ") || cleaned;
  const contextHint = contextSnippets[0]
    ? ` Context anchor: ${sanitizeText(contextSnippets[0], 120)}.`
    : "";

  const summary = sanitizeText(
    `Judgment ${judgmentId} claims: ${summaryBase}${contextHint}`,
    MAX_SUMMARY_LENGTH
  );

  const assumptions: string[] = [];
  if (containsAny(cleaned, ["always", "never", "all", "must"])) {
    assumptions.push("Assumes the judgment applies with broad or universal force across comparable cases.");
  }
  if (containsAny(cleaned, ["because", "therefore", "causes", "leads to"])) {
    assumptions.push("Assumes the cited causal or explanatory relation is reliable in the relevant context.");
  }
  if (containsAny(cleaned, ["wrong", "permissible", "required", "ought", "should"])) {
    assumptions.push("Assumes shared interpretation of the key normative terms used in the judgment.");
  }
  if (containsAny(cleaned, ["likely", "probably", "risk", "expected"])) {
    assumptions.push("Assumes uncertainty is being weighed using a consistent evidential standard.");
  }

  assumptions.push("Assumes omitted background facts are stable enough not to overturn the local judgment.");

  const deduped = Array.from(new Set(assumptions.map(safeAssumption))).slice(0, 5);
  return { summary, assumptions: deduped };
};

const detectScope = (judgments: Judgment[]): "universal" | "contextual" | "defeasible" => {
  const combined = judgments.map((judgment) => judgment.text.toLowerCase()).join(" ");
  if (containsAny(combined, ["always", "never", "all cases", "in every case"])) {
    return "universal";
  }
  if (containsAny(combined, ["unless", "except", "typically", "generally"])) {
    return "defeasible";
  }
  return "contextual";
};

const generateStatement = (groupLabel: string, judgments: Judgment[]): string => {
  const aggregate = judgments.map((judgment) => judgment.text.toLowerCase()).join(" ");
  const prohibitive = containsAny(aggregate, ["wrong", "impermissible", "forbidden", "avoid"]);
  const permissive = containsAny(aggregate, ["permissible", "required", "should", "ought"]);

  let statement = "In comparable cases, revise commitments and principles to preserve mutual support and reduce unresolved conflict.";
  if (prohibitive && !permissive) {
    statement =
      "Avoid actions in this domain when they predictably impose serious harm unless a stronger countervailing reason is available.";
  } else if (permissive && !prohibitive) {
    statement =
      "Treat actions in this domain as conditionally permissible when they reduce overall expected harm and respect stable constraints.";
  }

  return sanitizeText(`${titleCase(groupLabel)} principle: ${statement}`, MAX_STATEMENT_LENGTH);
};

const deterministicGeneratePrinciples = (
  judgments: Judgment[],
  contextSnippets: string[]
): AIGeneratedPrinciple[] => {
  if (judgments.length === 0) return [];

  const groups = new Map<string, Judgment[]>();
  for (const judgment of judgments) {
    const key = judgment.tags[0] ? sanitizeText(judgment.tags[0], 40).toLowerCase() : "general";
    const existing = groups.get(key) || [];
    existing.push(judgment);
    groups.set(key, existing);
  }

  const sortedEntries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const outputs: AIGeneratedPrinciple[] = [];

  for (const [label, group] of sortedEntries.slice(0, 5)) {
    const hint = contextSnippets[0] ? ` Context: ${sanitizeText(contextSnippets[0], 100)}.` : "";
    outputs.push({
      title: sanitizeText(`${titleCase(label)} Coherence Principle`, 96),
      statement: sanitizeText(`${generateStatement(label, group)}${hint}`, MAX_STATEMENT_LENGTH),
      scope: detectScope(group),
      supportingJudgmentIds: group.map((judgment) => judgment.id),
    });
  }

  return outputs;
};

export const applyAiRevisionSuggestionToSession = (
  session: WRESession,
  suggestion: AIRevisionSuggestion
): WRESession => {
  const next: WRESession = {
    ...session,
    judgments: [...session.judgments],
    principles: [...session.principles],
    links: [...session.links],
    revisionLog: [...session.revisionLog],
    updatedAt: new Date().toISOString(),
  };

  if (suggestion.action_type === "lower_confidence") {
    const target = next.judgments.find((judgment) => judgment.id === suggestion.target_id);
    if (!target) return next;

    const deltaMatch = suggestion.change.match(/-\s*(\d{1,2})/);
    const delta = deltaMatch ? Number(deltaMatch[1]) : 15;
    target.confidence = clamp(target.confidence - delta, 0, 100);
    target.updatedAt = new Date().toISOString();
    return next;
  }

  if (suggestion.action_type === "reject_judgment") {
    const target = next.judgments.find((judgment) => judgment.id === suggestion.target_id);
    if (!target) return next;

    target.rejected = true;
    target.confidence = Math.min(target.confidence, 40);
    target.updatedAt = new Date().toISOString();
    return next;
  }

  if (suggestion.action_type === "generalize_principle") {
    const target = next.principles.find((principle) => principle.id === suggestion.target_id);
    if (!target) return next;

    target.scope = "defeasible";
    if (!target.text.includes("unless stronger countervailing reasons apply")) {
      target.text = `${target.text} (unless stronger countervailing reasons apply)`;
    }
    target.plausibility = clamp(target.plausibility * 0.96, 0, 1);
    target.updatedAt = new Date().toISOString();
    return next;
  }

  return next;
};

const deterministicSuggestRevisions = (
  session: WRESession,
  conflictSet: { judgmentIds: string[]; principleIds: string[] },
  maxSuggestions: number
): AIRevisionSuggestion[] => {
  const baseline = runCoherenceEngine(session, { timeoutMs: 500 }).coherenceScore;
  const candidates: AIRevisionSuggestion[] = [];

  for (const judgmentId of conflictSet.judgmentIds) {
    const judgment = session.judgments.find((item) => item.id === judgmentId);
    if (!judgment) continue;

    if (judgment.confidence > 20) {
      const drop = 10 + (hash(judgment.id) % 11);
      const suggestion: AIRevisionSuggestion = {
        action_type: "lower_confidence",
        target_id: judgment.id,
        change: `confidence:-${drop}`,
        rationale: sanitizeText(
          `Lowering confidence in ${judgment.id} can reduce conflict pressure while keeping the judgment in play for further deliberation.`,
          MAX_RATIONALE_LENGTH
        ),
        expected_effect_delta: 0,
        confidence_estimate: 0,
      };

      const patched = applyAiRevisionSuggestionToSession(session, suggestion);
      const predicted = runCoherenceEngine(patched, { timeoutMs: 500 }).coherenceScore;
      suggestion.expected_effect_delta = Number((predicted - baseline).toFixed(2));
      suggestion.confidence_estimate = Number(clamp(0.5 + (predicted - baseline) / 100, 0.05, 0.99).toFixed(2));
      candidates.push(suggestion);
    }

    if (judgment.confidence >= 50) {
      const suggestion: AIRevisionSuggestion = {
        action_type: "reject_judgment",
        target_id: judgment.id,
        change: "rejected:true;confidence:40",
        rationale: sanitizeText(
          `Temporarily rejecting ${judgment.id} tests whether the conflict is driven by a brittle commitment rather than stable principles.`,
          MAX_RATIONALE_LENGTH
        ),
        expected_effect_delta: 0,
        confidence_estimate: 0,
      };

      const patched = applyAiRevisionSuggestionToSession(session, suggestion);
      const predicted = runCoherenceEngine(patched, { timeoutMs: 500 }).coherenceScore;
      suggestion.expected_effect_delta = Number((predicted - baseline).toFixed(2));
      suggestion.confidence_estimate = Number(clamp(0.45 + (predicted - baseline) / 100, 0.05, 0.99).toFixed(2));
      candidates.push(suggestion);
    }
  }

  for (const principleId of conflictSet.principleIds) {
    const principle = session.principles.find((item) => item.id === principleId);
    if (!principle || principle.scope !== "universal") continue;

    const suggestion: AIRevisionSuggestion = {
      action_type: "generalize_principle",
      target_id: principle.id,
      change: "scope:defeasible;text_append:unless stronger countervailing reasons apply",
      rationale: sanitizeText(
        `Generalizing ${principle.id} from universal to defeasible can preserve explanatory value while reducing direct contradiction with high-confidence judgments.`,
        MAX_RATIONALE_LENGTH
      ),
      expected_effect_delta: 0,
      confidence_estimate: 0,
    };

    const patched = applyAiRevisionSuggestionToSession(session, suggestion);
    const predicted = runCoherenceEngine(patched, { timeoutMs: 500 }).coherenceScore;
    suggestion.expected_effect_delta = Number((predicted - baseline).toFixed(2));
    suggestion.confidence_estimate = Number(clamp(0.52 + (predicted - baseline) / 100, 0.05, 0.99).toFixed(2));
    candidates.push(suggestion);
  }

  return candidates
    .filter((candidate) => candidate.expected_effect_delta > 0)
    .sort((a, b) => {
      if (Math.abs(b.expected_effect_delta - a.expected_effect_delta) > 1e-9) {
        return b.expected_effect_delta - a.expected_effect_delta;
      }
      return `${a.action_type}:${a.target_id}`.localeCompare(`${b.action_type}:${b.target_id}`);
    })
    .slice(0, Math.max(1, maxSuggestions));
};

const validateSummaryResponse = (response: AISummarizeJudgmentResponse): AISummarizeJudgmentResponse => {
  const summary = sanitizeText(response.summary, MAX_SUMMARY_LENGTH);
  if (!summary) {
    throw new Error("Invalid summary response: missing summary text.");
  }

  const assumptions = Array.isArray(response.assumptions)
    ? response.assumptions.map((item) => sanitizeText(item, MAX_ASSUMPTION_LENGTH)).filter(Boolean).slice(0, 6)
    : [];

  return {
    summary,
    assumptions,
  };
};

const validateGeneratedPrinciples = (items: unknown): AIGeneratedPrinciple[] => {
  if (!Array.isArray(items)) {
    throw new Error("Invalid principles response: expected an array.");
  }

  const out: AIGeneratedPrinciple[] = [];
  for (const item of items.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;

    const scope =
      record.scope === "universal" || record.scope === "defeasible" ? record.scope : "contextual";

    const supporting = Array.isArray(record.supportingJudgmentIds)
      ? record.supportingJudgmentIds.map((value) => sanitizeText(value, 64)).filter(Boolean)
      : [];

    const parsed: AIGeneratedPrinciple = {
      id: record.id ? sanitizeText(record.id, 64) : undefined,
      title: sanitizeText(record.title, 96),
      statement: sanitizeText(record.statement, MAX_STATEMENT_LENGTH),
      scope,
      supportingJudgmentIds: supporting,
    };

    if (!parsed.title || !parsed.statement || parsed.supportingJudgmentIds.length === 0) {
      continue;
    }
    out.push(parsed);
  }

  return out;
};

const validateSuggestions = (items: unknown): AIRevisionSuggestion[] => {
  if (!Array.isArray(items)) {
    throw new Error("Invalid suggestions response: expected an array.");
  }

  const out: AIRevisionSuggestion[] = [];
  for (const item of items.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;

    const actionType =
      record.action_type === "reject_judgment" || record.action_type === "generalize_principle"
        ? record.action_type
        : "lower_confidence";

    const parsed: AIRevisionSuggestion = {
      action_type: actionType,
      target_id: sanitizeText(record.target_id, 64),
      change: sanitizeText(record.change, 180),
      rationale: sanitizeText(record.rationale, MAX_RATIONALE_LENGTH),
      expected_effect_delta: Number(clamp(Number(record.expected_effect_delta ?? 0), -100, 100).toFixed(2)),
      confidence_estimate: Number(clamp(Number(record.confidence_estimate ?? 0), 0, 1).toFixed(2)),
    };

    if (!parsed.target_id || !parsed.change || !parsed.rationale) continue;
    out.push(parsed);
  }

  return out;
};

const withOptionalModel = async <T>(params: {
  enabled: boolean;
  promptKey: keyof typeof AI_PROMPT_TEMPLATES;
  userPrompt: string;
  schemaHint: unknown;
  deterministicFallback: () => Promise<T>;
  validate: (value: T) => T;
}): Promise<T> => {
  if (!params.enabled) {
    return params.validate(await params.deterministicFallback());
  }

  try {
    const adapter = maybeGetAdapter();
    const template = AI_PROMPT_TEMPLATES[params.promptKey];
    const generated = await adapter.generateJson<T>({
      model: DEFAULT_MODEL,
      temperature: 0,
      maxTokens: 700,
      systemPrompt: template.system,
      userPrompt: `${template.user}\n\n${params.userPrompt}`,
      jsonSchema: params.schemaHint,
    });

    return params.validate(generated);
  } catch {
    // Fall back to deterministic behavior if adapter fails or output is invalid.
    return params.validate(await params.deterministicFallback());
  }
};

export const createWREAiRouter = (): Router => {
  const router = Router();

  router.post("/api/wre/:sessionId/ai/summarize-judgment", async (req, res) => {
    const requesterId = getRequesterId(req.body, req.header("x-user-id") || undefined);
    if (!checkRateLimit(requesterId, "summarize-judgment")) {
      res.status(429).json({ error: "AI rate limit exceeded. Try again shortly." });
      return;
    }

    const sessionId = sanitizeText(req.params.sessionId, 120);
    const session = getWRESessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const payload = req.body as AISummarizeJudgmentRequest;
    const judgmentId = sanitizeText(payload?.judgmentId, 64);
    const text = sanitizeText(payload?.text, MAX_TEXT_LENGTH);

    if (!judgmentId || !text) {
      res.status(400).json({ error: "judgmentId and text are required" });
      return;
    }

    try {
      await ensureRagIndex(session);
      const context = await retrieveRelevant(sessionNamespace(session.id), text, embeddingProvider, vectorStore, 2);
      const snippets = context.map((entry) => entry.chunk.text);

      const response = await withOptionalModel<AISummarizeJudgmentResponse>({
        enabled: AI_SEND_TO_THIRD_PARTY,
        promptKey: "summarizeJudgment",
        userPrompt: JSON.stringify({ judgmentId, text, snippets }),
        schemaHint: { summary: "string", assumptions: ["string"] },
        deterministicFallback: async () => deterministicSummarize(judgmentId, text, snippets),
        validate: validateSummaryResponse,
      });

      res.json(response);
    } catch {
      res.status(500).json({ error: "Unable to summarize judgment safely." });
    }
  });

  router.post("/api/wre/:sessionId/ai/generate-principles", async (req, res) => {
    const requesterId = getRequesterId(req.body, req.header("x-user-id") || undefined);
    if (!checkRateLimit(requesterId, "generate-principles")) {
      res.status(429).json({ error: "AI rate limit exceeded. Try again shortly." });
      return;
    }

    const sessionId = sanitizeText(req.params.sessionId, 120);
    const session = getWRESessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const payload = req.body as AIGeneratePrinciplesRequest;
    const judgmentIds = Array.isArray(payload?.judgmentIds)
      ? payload.judgmentIds.map((id) => sanitizeText(id, 64)).filter(Boolean)
      : [];

    if (judgmentIds.length === 0) {
      res.status(400).json({ error: "judgmentIds must be a non-empty array" });
      return;
    }

    const selected = session.judgments.filter((judgment) => judgmentIds.includes(judgment.id));
    if (selected.length === 0) {
      res.status(400).json({ error: "No matching judgments found for provided ids" });
      return;
    }

    try {
      await ensureRagIndex(session);
      const query = selected.map((judgment) => judgment.text).join(" ");
      const context = await retrieveRelevant(sessionNamespace(session.id), query, embeddingProvider, vectorStore, 3);
      const snippets = context.map((entry) => entry.chunk.text);

      const generated = await withOptionalModel<AIGeneratedPrinciple[]>({
        enabled: AI_SEND_TO_THIRD_PARTY,
        promptKey: "generatePrinciples",
        userPrompt: JSON.stringify({ judgmentIds, snippets }),
        schemaHint: [
          {
            title: "string",
            statement: "string",
            scope: "contextual",
            supportingJudgmentIds: ["string"],
          },
        ],
        deterministicFallback: async () => deterministicGeneratePrinciples(selected, snippets),
        validate: validateGeneratedPrinciples,
      });

      res.json(generated);
    } catch {
      res.status(500).json({ error: "Unable to generate principles safely." });
    }
  });

  router.post("/api/wre/:sessionId/ai/suggest-revisions", async (req, res) => {
    const requesterId = getRequesterId(req.body, req.header("x-user-id") || undefined);
    if (!checkRateLimit(requesterId, "suggest-revisions")) {
      res.status(429).json({ error: "AI rate limit exceeded. Try again shortly." });
      return;
    }

    const sessionId = sanitizeText(req.params.sessionId, 120);
    const session = getWRESessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const payload = req.body as AISuggestRevisionsRequest;
    const judgmentIds = Array.isArray(payload?.conflictSet?.judgmentIds)
      ? payload.conflictSet.judgmentIds.map((id) => sanitizeText(id, 64)).filter(Boolean)
      : [];
    const principleIds = Array.isArray(payload?.conflictSet?.principleIds)
      ? payload.conflictSet.principleIds.map((id) => sanitizeText(id, 64)).filter(Boolean)
      : [];

    if (judgmentIds.length === 0 && principleIds.length === 0) {
      res.status(400).json({ error: "conflictSet must include judgmentIds and/or principleIds" });
      return;
    }

    const maxSuggestions = clamp(Number(payload?.maxSuggestions ?? DEFAULT_MAX_SUGGESTIONS), 1, 6);

    try {
      const suggestions = await withOptionalModel<AIRevisionSuggestion[]>({
        enabled: AI_SEND_TO_THIRD_PARTY,
        promptKey: "suggestRevisions",
        userPrompt: JSON.stringify({ conflictSet: { judgmentIds, principleIds }, maxSuggestions }),
        schemaHint: [
          {
            action_type: "lower_confidence",
            target_id: "j1",
            change: "confidence:-15",
            rationale: "string",
            expected_effect_delta: 1.25,
            confidence_estimate: 0.63,
          },
        ],
        deterministicFallback: async () =>
          deterministicSuggestRevisions(session, { judgmentIds, principleIds }, maxSuggestions),
        validate: validateSuggestions,
      });

      res.json(suggestions.slice(0, maxSuggestions));
    } catch {
      res.status(500).json({ error: "Unable to produce safe revision suggestions." });
    }
  });

  return router;
};

export const __aiTesting = {
  sanitizeText,
  deterministicSummarize,
  deterministicGeneratePrinciples,
  deterministicSuggestRevisions,
  validateSummaryResponse,
  validateGeneratedPrinciples,
  validateSuggestions,
  checkRateLimit,
};
