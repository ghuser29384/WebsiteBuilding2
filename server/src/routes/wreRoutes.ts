import { Router } from "express";

export type EntityType = "judgment" | "principle";
export type RelationType = "supports" | "conflicts";
export type PrincipleScope = "universal" | "contextual" | "defeasible";

export interface Judgment {
  id: string;
  text: string;
  confidence: number;
  tags: string[];
  sourceNote: string;
  rejected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Principle {
  id: string;
  text: string;
  scope: PrincipleScope;
  plausibility: number;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  fromType: EntityType;
  fromId: string;
  toType: EntityType;
  toId: string;
  relation: RelationType;
  createdAt: string;
}

export interface CoherenceWeights {
  agreementRatio: number;
  avgConfidenceSupported: number;
  parsimonyPenalty: number;
}

export interface CoherenceBreakdown {
  agreementRatio: number;
  avgConfidenceSupported: number;
  parsimonyPenalty: number;
  weights: CoherenceWeights;
}

export interface ConflictSet {
  ids: string[];
  reason: string;
  size: number;
}

export type SuggestionActionType =
  | "lower_confidence"
  | "reject_judgment"
  | "generalize_principle";

export interface SessionPatch {
  judgments?: Judgment[];
  principles?: Principle[];
  links?: Link[];
}

export interface Suggestion {
  id: string;
  title: string;
  actionType: SuggestionActionType;
  targetIds: string[];
  explanation: string;
  effectEstimate: number;
  predictedCoherence: number;
  resultingPatch: SessionPatch;
}

export interface CoherenceReport {
  coherenceScore: number;
  breakdown: CoherenceBreakdown;
  minimalConflicts: ConflictSet[];
  suggestions: Suggestion[];
  timedOut: boolean;
  durationMs: number;
}

export interface RevisionEntry {
  id: string;
  timestamp: string;
  actorId: string;
  operation: string;
  details: string;
}

export interface WRESession {
  id: string;
  createdAt: string;
  updatedAt: string;
  judgments: Judgment[];
  principles: Principle[];
  links: Link[];
  revisionLog: RevisionEntry[];
  lastReport?: CoherenceReport;
}

interface RunCoherenceInput {
  actorId?: string;
  timeoutMs?: number;
  weights?: Partial<CoherenceWeights>;
  sessionPatch?: SessionPatch;
}

const store = new Map<string, WRESession>();

const DEFAULT_WEIGHTS: CoherenceWeights = {
  agreementRatio: 0.5,
  avgConfidenceSupported: 0.35,
  parsimonyPenalty: 0.15,
};

const DEFAULT_TIMEOUT_MS = 2000;

const nowIso = (): string => new Date().toISOString();

const makeId = (prefix: string): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
};

// Escape user-controlled text before persistence/echo. React escapes by default on the client,
// but backend sanitization provides defense-in-depth for logs/exports.
const sanitizeText = (value: unknown): string => {
  const text = String(value ?? "");
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
};

const normalizeWeights = (weights?: Partial<CoherenceWeights>): CoherenceWeights => {
  const merged = {
    agreementRatio: clamp(weights?.agreementRatio ?? DEFAULT_WEIGHTS.agreementRatio, 0, 1),
    avgConfidenceSupported: clamp(
      weights?.avgConfidenceSupported ?? DEFAULT_WEIGHTS.avgConfidenceSupported,
      0,
      1
    ),
    parsimonyPenalty: clamp(weights?.parsimonyPenalty ?? DEFAULT_WEIGHTS.parsimonyPenalty, 0, 1),
  };

  const total = merged.agreementRatio + merged.avgConfidenceSupported + merged.parsimonyPenalty;
  if (total <= 0) {
    return DEFAULT_WEIGHTS;
  }

  return {
    agreementRatio: merged.agreementRatio / total,
    avgConfidenceSupported: merged.avgConfidenceSupported / total,
    parsimonyPenalty: merged.parsimonyPenalty / total,
  };
};

const sanitizeJudgment = (
  input: Partial<Judgment> & Pick<Judgment, "text" | "confidence">,
  now: string
): Judgment => {
  return {
    id: input.id || makeId("j"),
    text: sanitizeText(input.text),
    confidence: clamp(input.confidence, 0, 100),
    tags: Array.isArray(input.tags) ? input.tags.map(sanitizeText).filter(Boolean) : [],
    sourceNote: sanitizeText(input.sourceNote),
    rejected: Boolean(input.rejected),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
};

const sanitizePrinciple = (
  input: Partial<Principle> & Pick<Principle, "text" | "scope" | "plausibility">,
  now: string
): Principle => {
  const scope: PrincipleScope =
    input.scope === "contextual" || input.scope === "defeasible" ? input.scope : "universal";

  return {
    id: input.id || makeId("p"),
    text: sanitizeText(input.text),
    scope,
    plausibility: clamp(input.plausibility, 0, 1),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
};

const sanitizeLink = (input: Partial<Link>, now: string): Link | null => {
  if (!input.fromId || !input.toId || !input.fromType || !input.toType || !input.relation) {
    return null;
  }
  if (input.relation !== "supports" && input.relation !== "conflicts") return null;
  if (input.fromType !== "judgment" && input.fromType !== "principle") return null;
  if (input.toType !== "judgment" && input.toType !== "principle") return null;

  return {
    id: input.id || makeId("link"),
    fromType: input.fromType,
    fromId: sanitizeText(input.fromId),
    toType: input.toType,
    toId: sanitizeText(input.toId),
    relation: input.relation,
    createdAt: input.createdAt || now,
  };
};

const sanitizePatch = (patch: SessionPatch | undefined, now: string): SessionPatch => {
  return {
    judgments: patch?.judgments
      ? patch.judgments
          .filter((judgment) => judgment && typeof judgment.text === "string")
          .map((judgment) => sanitizeJudgment(judgment, now))
      : undefined,
    principles: patch?.principles
      ? patch.principles
          .filter((principle) => principle && typeof principle.text === "string")
          .map((principle) => sanitizePrinciple(principle, now))
      : undefined,
    links: patch?.links
      ? patch.links
          .map((link) => sanitizeLink(link, now))
          .filter((link): link is Link => Boolean(link))
      : undefined,
  };
};

const findJudgment = (session: WRESession, id: string): Judgment | undefined => {
  return session.judgments.find((judgment) => judgment.id === id);
};

const findPrinciple = (session: WRESession, id: string): Principle | undefined => {
  return session.principles.find((principle) => principle.id === id);
};

const signalFromJudgment = (judgment: Judgment): number => {
  if (judgment.rejected) return -1;
  return clamp((judgment.confidence / 100) * 2 - 1, -1, 1);
};

const signalFromPrinciple = (principle: Principle): number => {
  return clamp(principle.plausibility * 2 - 1, -1, 1);
};

interface ScoreContext {
  score: number;
  breakdown: CoherenceBreakdown;
}

const computeScore = (session: WRESession, weights: CoherenceWeights): ScoreContext => {
  const validLinks = session.links.filter((link) => {
    if (link.fromType === "judgment" && !findJudgment(session, link.fromId)) return false;
    if (link.fromType === "principle" && !findPrinciple(session, link.fromId)) return false;
    if (link.toType === "judgment" && !findJudgment(session, link.toId)) return false;
    if (link.toType === "principle" && !findPrinciple(session, link.toId)) return false;
    return true;
  });

  const linkAgreementValues = validLinks.map((link) => {
    const fromSignal =
      link.fromType === "judgment"
        ? signalFromJudgment(findJudgment(session, link.fromId) as Judgment)
        : signalFromPrinciple(findPrinciple(session, link.fromId) as Principle);

    const toSignal =
      link.toType === "judgment"
        ? signalFromJudgment(findJudgment(session, link.toId) as Judgment)
        : signalFromPrinciple(findPrinciple(session, link.toId) as Principle);

    const product = fromSignal * toSignal;
    const supportAgreement = (product + 1) / 2;
    const conflictAgreement = ((-1 * product) + 1) / 2;
    return link.relation === "supports" ? supportAgreement : conflictAgreement;
  });

  const agreementRatio =
    linkAgreementValues.length > 0
      ? linkAgreementValues.reduce((sum, value) => sum + value, 0) / linkAgreementValues.length
      : 0.5;

  const supportLinks = validLinks.filter((link) => link.relation === "supports");
  const supportConfidenceValues = supportLinks
    .map((link) => {
      if (link.fromType === "judgment" && link.toType === "principle") {
        const judgment = findJudgment(session, link.fromId);
        const principle = findPrinciple(session, link.toId);
        if (!judgment || !principle) return null;
        return judgment.confidence * Math.max(0, principle.plausibility);
      }
      if (link.fromType === "principle" && link.toType === "judgment") {
        const principle = findPrinciple(session, link.fromId);
        const judgment = findJudgment(session, link.toId);
        if (!judgment || !principle) return null;
        return judgment.confidence * Math.max(0, principle.plausibility);
      }
      if (link.fromType === "judgment" && link.toType === "judgment") {
        const from = findJudgment(session, link.fromId);
        const to = findJudgment(session, link.toId);
        if (!from || !to) return null;
        return Math.min(from.confidence, to.confidence);
      }
      return null;
    })
    .filter((value): value is number => value !== null);

  const avgConfidenceSupported =
    supportConfidenceValues.length > 0
      ? clamp(
          supportConfidenceValues.reduce((sum, value) => sum + value, 0) /
            supportConfidenceValues.length /
            100,
          0,
          1
        )
      : clamp(
          session.judgments.reduce((sum, judgment) => sum + judgment.confidence, 0) /
            Math.max(1, session.judgments.length) /
            100,
          0,
          1
        );

  const complexityRatio =
    (session.principles.length + session.links.length * 0.35) /
    Math.max(1, session.judgments.length + session.principles.length);
  const parsimonyPenalty = clamp(complexityRatio, 0, 1);

  const raw =
    weights.agreementRatio * agreementRatio +
    weights.avgConfidenceSupported * avgConfidenceSupported -
    weights.parsimonyPenalty * parsimonyPenalty;
  const score = clamp(raw * 100, 0, 100);

  return {
    score,
    breakdown: {
      agreementRatio,
      avgConfidenceSupported,
      parsimonyPenalty,
      weights,
    },
  };
};

const buildJudgmentConflictGraph = (session: WRESession): Map<string, Set<string>> => {
  const graph = new Map<string, Set<string>>();
  for (const judgment of session.judgments) {
    graph.set(judgment.id, new Set());
  }

  for (const link of session.links) {
    if (link.relation !== "conflicts") continue;
    if (link.fromType !== "judgment" || link.toType !== "judgment") continue;
    if (!graph.has(link.fromId) || !graph.has(link.toId)) continue;
    graph.get(link.fromId)?.add(link.toId);
    graph.get(link.toId)?.add(link.fromId);
  }

  return graph;
};

const detectMinimalConflicts = (session: WRESession): ConflictSet[] => {
  const result: ConflictSet[] = [];
  const seen = new Set<string>();

  const conflictGraph = buildJudgmentConflictGraph(session);
  const judgmentIds = Array.from(conflictGraph.keys()).sort();

  for (const id of judgmentIds) {
    const neighbors = Array.from(conflictGraph.get(id) || []).sort();
    for (const neighbor of neighbors) {
      if (id >= neighbor) continue;
      const ids = [id, neighbor].sort();
      const key = ids.join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        ids,
        size: ids.length,
        reason: "Pairwise judgment conflict link.",
      });
    }
  }

  for (let i = 0; i < judgmentIds.length; i += 1) {
    for (let j = i + 1; j < judgmentIds.length; j += 1) {
      for (let k = j + 1; k < judgmentIds.length; k += 1) {
        const a = judgmentIds[i];
        const b = judgmentIds[j];
        const c = judgmentIds[k];
        const pairwise =
          conflictGraph.get(a)?.has(b) &&
          conflictGraph.get(a)?.has(c) &&
          conflictGraph.get(b)?.has(c);
        if (!pairwise) continue;
        const ids = [a, b, c];
        const key = ids.join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          ids,
          size: ids.length,
          reason: "Three-way pairwise judgment conflict clique.",
        });
      }
    }
  }

  for (const principle of session.principles) {
    if (principle.scope !== "universal") continue;

    const relatedConflicts = session.links.filter((link) => {
      if (link.relation !== "conflicts") return false;
      if (link.fromType === "judgment" && link.toType === "principle") {
        return link.toId === principle.id;
      }
      if (link.fromType === "principle" && link.toType === "judgment") {
        return link.fromId === principle.id;
      }
      return false;
    });

    for (const link of relatedConflicts) {
      const judgmentId = link.fromType === "judgment" ? link.fromId : link.toId;
      const judgment = findJudgment(session, judgmentId);
      if (!judgment || judgment.confidence < 50 || judgment.rejected) continue;

      const ids = [principle.id, judgment.id].sort();
      const key = ids.join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        ids,
        size: ids.length,
        reason: "Universal principle conflicts with a high-confidence judgment.",
      });
    }
  }

  return result.sort((a, b) => {
    if (a.size !== b.size) return a.size - b.size;
    return a.ids.join("|").localeCompare(b.ids.join("|"));
  });
};

const replaceJudgment = (judgments: Judgment[], next: Judgment): Judgment[] => {
  return judgments.map((judgment) => (judgment.id === next.id ? next : judgment));
};

const replacePrinciple = (principles: Principle[], next: Principle): Principle[] => {
  return principles.map((principle) => (principle.id === next.id ? next : principle));
};

const hashId = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const suggestionExplanationTemplate = (
  actionType: SuggestionActionType,
  targetIds: string[],
  baseline: number,
  predicted: number,
  effect: number
): string => {
  const ids = targetIds.join(", ");

  const actionPhrase: Record<SuggestionActionType, string> = {
    lower_confidence:
      "This revision reduces confidence in the target judgment by a modest, controlled amount",
    reject_judgment:
      "This revision marks a target judgment as rejected for the current equilibrium cycle",
    generalize_principle:
      "This revision weakens a universal principle into a defeasible, context-sensitive formulation",
  };

  return (
    `${actionPhrase[actionType]}, focusing on ${ids}. ` +
    `The engine predicts a coherence increase from ${baseline.toFixed(2)} to ${predicted.toFixed(2)} ` +
    `(delta +${effect.toFixed(2)}), primarily by reducing direct contradiction pressure while preserving ` +
    `as much original structure as possible. The tradeoff is that explanatory sharpness can decline: lower confidence ` +
    `and broader principles may fit more cases but commit less strongly. Treat this as a reversible test step, then re-run ` +
    `coherence to verify whether the local gain remains robust under additional links and judgments.`
  );
};

const generateSuggestions = (
  session: WRESession,
  baselineScore: number,
  weights: CoherenceWeights,
  timeoutAt: number
): Suggestion[] => {
  interface Candidate {
    actionType: SuggestionActionType;
    title: string;
    targetIds: string[];
    patch: SessionPatch;
    predictedCoherence: number;
    effectEstimate: number;
  }

  const candidates: Candidate[] = [];

  const evaluatePatch = (patch: SessionPatch): { score: number } => {
    const patched: WRESession = {
      ...session,
      judgments: patch.judgments ?? session.judgments,
      principles: patch.principles ?? session.principles,
      links: patch.links ?? session.links,
      updatedAt: nowIso(),
      revisionLog: session.revisionLog,
    };
    const scored = computeScore(patched, weights);
    return { score: scored.score };
  };

  for (const judgment of session.judgments) {
    if (Date.now() > timeoutAt) break;
    if (judgment.rejected) continue;

    if (judgment.confidence >= 20) {
      const delta = 10 + (hashId(judgment.id) % 11);
      const next = { ...judgment, confidence: clamp(judgment.confidence - delta, 0, 100), updatedAt: nowIso() };
      const patch = { judgments: replaceJudgment(session.judgments, next) };
      const prediction = evaluatePatch(patch).score;
      candidates.push({
        actionType: "lower_confidence",
        title: `Lower confidence for ${judgment.id}`,
        targetIds: [judgment.id],
        patch,
        predictedCoherence: prediction,
        effectEstimate: prediction - baselineScore,
      });
    }

    if (judgment.confidence >= 45) {
      const next = {
        ...judgment,
        rejected: true,
        confidence: clamp(Math.min(judgment.confidence, 40), 0, 100),
        updatedAt: nowIso(),
      };
      const patch = { judgments: replaceJudgment(session.judgments, next) };
      const prediction = evaluatePatch(patch).score;
      candidates.push({
        actionType: "reject_judgment",
        title: `Temporarily reject ${judgment.id}`,
        targetIds: [judgment.id],
        patch,
        predictedCoherence: prediction,
        effectEstimate: prediction - baselineScore,
      });
    }
  }

  for (const principle of session.principles) {
    if (Date.now() > timeoutAt) break;
    if (principle.scope !== "universal") continue;

    const generalized = {
      ...principle,
      scope: "defeasible" as PrincipleScope,
      text: `${principle.text} (generalized: unless strong countervailing reasons apply)`,
      plausibility: clamp(principle.plausibility * 0.95, 0, 1),
      updatedAt: nowIso(),
    };

    const patch = { principles: replacePrinciple(session.principles, generalized) };
    const prediction = evaluatePatch(patch).score;
    candidates.push({
      actionType: "generalize_principle",
      title: `Generalize ${principle.id}`,
      targetIds: [principle.id],
      patch,
      predictedCoherence: prediction,
      effectEstimate: prediction - baselineScore,
    });
  }

  const priority: Record<SuggestionActionType, number> = {
    lower_confidence: 0,
    reject_judgment: 1,
    generalize_principle: 2,
  };

  return candidates
    .filter((candidate) => candidate.effectEstimate > 0)
    .sort((a, b) => {
      if (Math.abs(b.effectEstimate - a.effectEstimate) > 1e-9) {
        return b.effectEstimate - a.effectEstimate;
      }
      if (priority[a.actionType] !== priority[b.actionType]) {
        return priority[a.actionType] - priority[b.actionType];
      }
      return a.targetIds.join("|").localeCompare(b.targetIds.join("|"));
    })
    .slice(0, 3)
    .map((candidate, index) => {
      const explanation = suggestionExplanationTemplate(
        candidate.actionType,
        candidate.targetIds,
        baselineScore,
        candidate.predictedCoherence,
        candidate.effectEstimate
      );

      return {
        id: `sugg_${index + 1}_${candidate.actionType}`,
        title: candidate.title,
        actionType: candidate.actionType,
        targetIds: candidate.targetIds,
        explanation,
        effectEstimate: candidate.effectEstimate,
        predictedCoherence: candidate.predictedCoherence,
        resultingPatch: candidate.patch,
      };
    });
};

export const runCoherenceEngine = (
  session: WRESession,
  input: RunCoherenceInput = {}
): CoherenceReport => {
  const startedAt = Date.now();
  const timeoutMs = clamp(input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 50, 10000);
  const timeoutAt = startedAt + timeoutMs;
  const weights = normalizeWeights(input.weights);

  const scoreResult = computeScore(session, weights);
  const conflicts = detectMinimalConflicts(session);

  let timedOut = Date.now() > timeoutAt;
  const suggestions = timedOut
    ? []
    : generateSuggestions(session, scoreResult.score, weights, timeoutAt);

  if (Date.now() > timeoutAt) {
    timedOut = true;
  }

  return {
    coherenceScore: scoreResult.score,
    breakdown: scoreResult.breakdown,
    minimalConflicts: conflicts,
    suggestions,
    timedOut,
    durationMs: Date.now() - startedAt,
  };
};

const createSession = (actorId: string, seed?: Partial<SessionPatch>): WRESession => {
  const now = nowIso();
  const sanitized = sanitizePatch(seed, now);

  const session: WRESession = {
    id: makeId("wre"),
    createdAt: now,
    updatedAt: now,
    judgments: sanitized.judgments ?? [],
    principles: sanitized.principles ?? [],
    links: sanitized.links ?? [],
    revisionLog: [
      {
        id: makeId("rev"),
        timestamp: now,
        actorId,
        operation: "SESSION_CREATED",
        details: "Initialized WRE session.",
      },
    ],
  };

  // TODO(integrator): replace in-memory persistence with DB-backed persistence.
  store.set(session.id, session);
  return session;
};

const getSessionOrThrow = (id: string): WRESession | null => {
  return store.get(id) ?? null;
};

/**
 * Read a WRE session from the in-memory store.
 * TODO(integrator): replace with DB-backed lookup.
 */
export const getWRESessionById = (id: string): WRESession | null => {
  return store.get(id) ?? null;
};

/**
 * Upsert a WRE session in the in-memory store.
 * TODO(integrator): replace with transactional DB persistence.
 */
export const upsertWRESession = (session: WRESession): void => {
  store.set(session.id, session);
};

const applySessionPatch = (session: WRESession, patch: SessionPatch | undefined): WRESession => {
  if (!patch) return session;
  const now = nowIso();
  const sanitized = sanitizePatch(patch, now);
  return {
    ...session,
    judgments: sanitized.judgments ?? session.judgments,
    principles: sanitized.principles ?? session.principles,
    links: sanitized.links ?? session.links,
    updatedAt: now,
  };
};

export const createWRERouter = (): Router => {
  const router = Router();

  // TODO(integrator): configure strict CORS in your app bootstrap layer:
  // app.use(cors({ origin: ["https://your-domain.example"], credentials: true }))

  router.post("/api/wre/session", (req, res) => {
    const actorId = sanitizeText(req.body?.actorId || "anonymous_user");
    const seedSession = req.body?.seedSession as Partial<SessionPatch> | undefined;
    const session = createSession(actorId, seedSession);
    res.status(201).json(session);
  });

  router.get("/api/wre/session/:id", (req, res) => {
    const session = getSessionOrThrow(sanitizeText(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  });

  router.post("/api/wre/session/:id/judgment", (req, res) => {
    const session = getSessionOrThrow(sanitizeText(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const incoming = req.body?.judgment;
    if (!incoming || typeof incoming.text !== "string") {
      res.status(400).json({ error: "Missing judgment payload" });
      return;
    }

    const actorId = sanitizeText(req.body?.actorId || "anonymous_user");
    const now = nowIso();
    const judgment = sanitizeJudgment(incoming, now);

    session.judgments.push(judgment);
    session.updatedAt = now;
    session.revisionLog.push({
      id: makeId("rev"),
      timestamp: now,
      actorId,
      operation: "ADD_JUDGMENT",
      details: `Added ${judgment.id}`,
    });

    // TODO(integrator): persist to DB transactionally.
    store.set(session.id, session);
    res.status(201).json(session);
  });

  router.post("/api/wre/session/:id/principle", (req, res) => {
    const session = getSessionOrThrow(sanitizeText(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const incoming = req.body?.principle;
    if (!incoming || typeof incoming.text !== "string") {
      res.status(400).json({ error: "Missing principle payload" });
      return;
    }

    const actorId = sanitizeText(req.body?.actorId || "anonymous_user");
    const now = nowIso();
    const principle = sanitizePrinciple(incoming, now);

    session.principles.push(principle);
    session.updatedAt = now;
    session.revisionLog.push({
      id: makeId("rev"),
      timestamp: now,
      actorId,
      operation: "ADD_PRINCIPLE",
      details: `Added ${principle.id}`,
    });

    // TODO(integrator): persist to DB transactionally.
    store.set(session.id, session);
    res.status(201).json(session);
  });

  router.post("/api/wre/session/:id/run-coherence", (req, res) => {
    const session = getSessionOrThrow(sanitizeText(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const actorId = sanitizeText(req.body?.actorId || "engine_runner");
    const input = (req.body || {}) as RunCoherenceInput;

    const patchedSession = applySessionPatch(session, input.sessionPatch);
    const report = runCoherenceEngine(patchedSession, input);

    patchedSession.lastReport = report;
    patchedSession.updatedAt = nowIso();
    patchedSession.revisionLog.push({
      id: makeId("rev"),
      timestamp: patchedSession.updatedAt,
      actorId,
      operation: "RUN_COHERENCE",
      details: `Coherence=${report.coherenceScore.toFixed(2)}, conflicts=${report.minimalConflicts.length}`,
    });

    // TODO(integrator): replace map writes with real persistence calls.
    store.set(patchedSession.id, patchedSession);

    res.json(report);
  });

  return router;
};

export const __testing = {
  store,
  getWRESessionById,
  upsertWRESession,
  normalizeWeights,
  computeScore,
  detectMinimalConflicts,
  generateSuggestions,
  sanitizeText,
};
