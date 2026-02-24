import React, { useCallback, useEffect, useMemo, useState } from "react";
import CoherencePanel from "./CoherencePanel";
import JudgmentList from "./JudgmentList";
import PrincipleList from "./PrincipleList";
import RevisionTimeline from "./RevisionTimeline";
import WorkspaceCanvas from "./WorkspaceCanvas";
import {
  type CoherenceReport,
  type CoherenceWeights,
  createWREClient,
  type Judgment,
  type Link,
  type Principle,
  type Session,
  type Suggestion,
} from "../lib/wreClient";
import {
  createWREAiClient,
  type AIGeneratedPrinciple,
  type AIRevisionSuggestion,
  type AISummarizeJudgmentResponse,
} from "../lib/wreAiClient";

export interface WREAssistantPageProps {
  apiBaseUrl?: string;
  currentUserId: string;
  sessionId?: string;
  authHeaders?: Record<string, string> | (() => Record<string, string>);
  engineTimeoutMs?: number;
}

type AIPanelMode = "summary" | "principles" | "suggestions";

const defaultWeights: CoherenceWeights = {
  agreementRatio: 0.5,
  avgConfidenceSupported: 0.35,
  parsimonyPenalty: 0.15,
};

const nowIso = (): string => new Date().toISOString();

const makeId = (prefix: string): string => {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeWeights = (weights: CoherenceWeights): CoherenceWeights => {
  const total = weights.agreementRatio + weights.avgConfidenceSupported + weights.parsimonyPenalty;
  if (total <= 0) return defaultWeights;
  return {
    agreementRatio: weights.agreementRatio / total,
    avgConfidenceSupported: weights.avgConfidenceSupported / total,
    parsimonyPenalty: weights.parsimonyPenalty / total,
  };
};

const parseConfidenceDrop = (change: string): number => {
  const match = change.match(/-\s*(\d{1,2})/);
  if (!match) return 15;
  return Math.max(1, Math.min(40, Number(match[1]) || 15));
};

const toMarkdown = (session: Session, report?: CoherenceReport): string => {
  const lines: string[] = [];
  lines.push(`# WRE Session Summary (${session.id})`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Judgments");
  for (const judgment of session.judgments) {
    lines.push(
      `- **${judgment.id}**: ${judgment.text} (confidence: ${judgment.confidence}%, tags: ${judgment.tags.join(", ") || "none"})`
    );
  }
  lines.push("");
  lines.push("## Principles");
  for (const principle of session.principles) {
    lines.push(
      `- **${principle.id}**: ${principle.text} (scope: ${principle.scope}, plausibility: ${principle.plausibility.toFixed(2)})`
    );
  }
  lines.push("");
  lines.push("## Links");
  for (const link of session.links) {
    lines.push(`- ${link.fromId} ${link.relation} ${link.toId}`);
  }

  if (report) {
    lines.push("");
    lines.push("## Coherence Breakdown");
    lines.push(`- Coherence score: ${report.coherenceScore.toFixed(2)} / 100`);
    lines.push(`- AgreementRatio: ${report.breakdown.agreementRatio.toFixed(2)}`);
    lines.push(`- AvgConfidenceSupported: ${report.breakdown.avgConfidenceSupported.toFixed(2)}`);
    lines.push(`- ParsimonyPenalty: ${report.breakdown.parsimonyPenalty.toFixed(2)}`);
    lines.push("- Minimal conflicts:");
    for (const conflict of report.minimalConflicts) {
      lines.push(`  - ${conflict.ids.join(", ")}: ${conflict.reason}`);
    }

    lines.push("- Suggested revisions:");
    for (const suggestion of report.suggestions) {
      lines.push(
        `  - ${suggestion.title} (delta +${suggestion.effectEstimate.toFixed(2)}): ${suggestion.explanation}`
      );
    }
  }

  lines.push("");
  lines.push("> Coherence score is an assistive metric — not a proof of moral correctness.");
  return lines.join("\n");
};

const downloadText = (filename: string, content: string, mime: string): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const applyPatch = (
  session: Session,
  patch: Partial<Pick<Session, "judgments" | "principles" | "links">>
): Session => {
  return {
    ...session,
    judgments: patch.judgments ?? session.judgments,
    principles: patch.principles ?? session.principles,
    links: patch.links ?? session.links,
    updatedAt: nowIso(),
  };
};

const applyAiSuggestionLocally = (session: Session, suggestion: AIRevisionSuggestion): Session => {
  const next: Session = {
    ...session,
    judgments: session.judgments.map((judgment) => ({ ...judgment })),
    principles: session.principles.map((principle) => ({ ...principle })),
    links: [...session.links],
    revisionLog: [...session.revisionLog],
    updatedAt: nowIso(),
  };

  if (suggestion.action_type === "lower_confidence") {
    const target = next.judgments.find((judgment) => judgment.id === suggestion.target_id);
    if (target) {
      const drop = parseConfidenceDrop(suggestion.change);
      target.confidence = Math.max(0, target.confidence - drop);
      target.updatedAt = nowIso();
    }
    return next;
  }

  if (suggestion.action_type === "reject_judgment") {
    const target = next.judgments.find((judgment) => judgment.id === suggestion.target_id);
    if (target) {
      target.rejected = true;
      target.confidence = Math.min(target.confidence, 40);
      target.updatedAt = nowIso();
    }
    return next;
  }

  if (suggestion.action_type === "generalize_principle") {
    const target = next.principles.find((principle) => principle.id === suggestion.target_id);
    if (target) {
      target.scope = "defeasible";
      if (!target.text.includes("unless stronger countervailing reasons apply")) {
        target.text = `${target.text} (unless stronger countervailing reasons apply)`;
      }
      target.plausibility = Math.max(0, Math.min(1, target.plausibility * 0.96));
      target.updatedAt = nowIso();
    }
    return next;
  }

  return next;
};

const deriveConflictSet = (
  session: Session,
  report: CoherenceReport | undefined,
  selectedJudgmentId: string | undefined,
  selectedPrincipleId: string | undefined
): { judgmentIds: string[]; principleIds: string[] } => {
  const judgmentIdSet = new Set<string>();
  const principleIdSet = new Set<string>();

  if (report?.minimalConflicts?.length) {
    for (const id of report.minimalConflicts[0].ids) {
      if (session.judgments.some((judgment) => judgment.id === id)) {
        judgmentIdSet.add(id);
      }
      if (session.principles.some((principle) => principle.id === id)) {
        principleIdSet.add(id);
      }
    }
  }

  if (selectedJudgmentId) judgmentIdSet.add(selectedJudgmentId);
  if (selectedPrincipleId) principleIdSet.add(selectedPrincipleId);

  if (judgmentIdSet.size === 0 && session.judgments.length > 0) {
    judgmentIdSet.add(session.judgments[0].id);
  }
  if (principleIdSet.size === 0 && session.principles.length > 0) {
    principleIdSet.add(session.principles[0].id);
  }

  return {
    judgmentIds: Array.from(judgmentIdSet),
    principleIds: Array.from(principleIdSet),
  };
};

export const WREAssistantPage: React.FC<WREAssistantPageProps> = ({
  apiBaseUrl,
  currentUserId,
  sessionId,
  authHeaders,
  engineTimeoutMs = 2000,
}) => {
  const headerResolver = useMemo(() => {
    if (!authHeaders) return undefined;
    return typeof authHeaders === "function" ? authHeaders : () => authHeaders;
  }, [authHeaders]);

  const client = useMemo(() => {
    return createWREClient({
      baseUrl: apiBaseUrl,
      getHeaders: headerResolver,
    });
  }, [apiBaseUrl, headerResolver]);

  const aiClient = useMemo(() => {
    return createWREAiClient({
      baseUrl: apiBaseUrl,
      getHeaders: headerResolver,
      currentUserId,
    });
  }, [apiBaseUrl, currentUserId, headerResolver]);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedJudgmentId, setSelectedJudgmentId] = useState<string | undefined>();
  const [selectedPrincipleId, setSelectedPrincipleId] = useState<string | undefined>();
  const [report, setReport] = useState<CoherenceReport | undefined>();
  const [weights, setWeights] = useState<CoherenceWeights>(defaultWeights);

  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<AIPanelMode>("summary");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const [summaryResponse, setSummaryResponse] = useState<AISummarizeJudgmentResponse | null>(null);
  const [generatedPrinciples, setGeneratedPrinciples] = useState<AIGeneratedPrinciple[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIRevisionSuggestion[]>([]);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError("");
      try {
        const loaded = sessionId
          ? await client.loadSession(sessionId)
          : await client.createSession({ actorId: currentUserId });
        if (!active) return;
        setSession(loaded);
        setReport(loaded.lastReport);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to initialize WRE session.";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [client, currentUserId, sessionId]);

  const appendLocalRevision = useCallback(
    (operation: string, details: string): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updatedAt: nowIso(),
          revisionLog: [
            ...prev.revisionLog,
            {
              id: makeId("rev"),
              timestamp: nowIso(),
              actorId: currentUserId,
              operation,
              details,
            },
          ],
        };
      });
    },
    [currentUserId]
  );

  const handleAddJudgment = useCallback(
    async (draft: {
      text: string;
      confidence: number;
      tags: string[];
      sourceNote: string;
      rejected?: boolean;
    }): Promise<void> => {
      if (!session) return;
      try {
        const next = await client.addJudgment(session.id, {
          actorId: currentUserId,
          judgment: draft,
        });
        setSession(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add judgment.");
      }
    },
    [client, currentUserId, session]
  );

  const handleAddPrinciple = useCallback(
    async (draft: {
      text: string;
      scope: "universal" | "contextual" | "defeasible";
      plausibility: number;
    }): Promise<void> => {
      if (!session) return;
      try {
        const next = await client.addPrinciple(session.id, {
          actorId: currentUserId,
          principle: draft,
        });
        setSession(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add principle.");
      }
    },
    [client, currentUserId, session]
  );

  const handleUpdateJudgment = useCallback(
    (judgmentId: string, patch: Partial<Judgment>): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          judgments: prev.judgments.map((judgment) =>
            judgment.id === judgmentId ? { ...judgment, ...patch, updatedAt: nowIso() } : judgment
          ),
          updatedAt: nowIso(),
        };
      });
      appendLocalRevision("UPDATE_JUDGMENT", `Edited judgment ${judgmentId}.`);
    },
    [appendLocalRevision]
  );

  const handleDeleteJudgment = useCallback(
    (judgmentId: string): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          judgments: prev.judgments.filter((judgment) => judgment.id !== judgmentId),
          links: prev.links.filter((link) => link.fromId !== judgmentId && link.toId !== judgmentId),
          updatedAt: nowIso(),
        };
      });
      if (selectedJudgmentId === judgmentId) setSelectedJudgmentId(undefined);
      appendLocalRevision("DELETE_JUDGMENT", `Deleted judgment ${judgmentId}.`);
    },
    [appendLocalRevision, selectedJudgmentId]
  );

  const handleUpdatePrinciple = useCallback(
    (principleId: string, patch: Partial<Principle>): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          principles: prev.principles.map((principle) =>
            principle.id === principleId ? { ...principle, ...patch, updatedAt: nowIso() } : principle
          ),
          updatedAt: nowIso(),
        };
      });
      appendLocalRevision("UPDATE_PRINCIPLE", `Edited principle ${principleId}.`);
    },
    [appendLocalRevision]
  );

  const handleDeletePrinciple = useCallback(
    (principleId: string): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          principles: prev.principles.filter((principle) => principle.id !== principleId),
          links: prev.links.filter((link) => link.fromId !== principleId && link.toId !== principleId),
          updatedAt: nowIso(),
        };
      });
      if (selectedPrincipleId === principleId) setSelectedPrincipleId(undefined);
      appendLocalRevision("DELETE_PRINCIPLE", `Deleted principle ${principleId}.`);
    },
    [appendLocalRevision, selectedPrincipleId]
  );

  const handleCreateLink = useCallback(
    (relation: "supports" | "conflicts"): void => {
      if (!session || !selectedJudgmentId || !selectedPrincipleId) return;

      const duplicate = session.links.some(
        (link) =>
          link.fromId === selectedJudgmentId &&
          link.toId === selectedPrincipleId &&
          link.relation === relation &&
          link.fromType === "judgment" &&
          link.toType === "principle"
      );
      if (duplicate) return;

      const link: Link = {
        id: makeId("link"),
        fromType: "judgment",
        fromId: selectedJudgmentId,
        toType: "principle",
        toId: selectedPrincipleId,
        relation,
        createdAt: nowIso(),
      };

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          links: [...prev.links, link],
          updatedAt: nowIso(),
        };
      });
      appendLocalRevision(
        "LINK_CREATED",
        `Linked ${selectedJudgmentId} ${relation} ${selectedPrincipleId}.`
      );
    },
    [appendLocalRevision, selectedJudgmentId, selectedPrincipleId, session]
  );

  const handleDeleteLink = useCallback(
    (linkId: string): void => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          links: prev.links.filter((link) => link.id !== linkId),
          updatedAt: nowIso(),
        };
      });
      appendLocalRevision("LINK_DELETED", `Deleted link ${linkId}.`);
    },
    [appendLocalRevision]
  );

  const handleRunCoherence = useCallback(async (): Promise<void> => {
    if (!session) return;
    setIsRunning(true);
    setError("");
    try {
      const normalized = normalizeWeights(weights);
      const response = await client.runCoherence(session.id, {
        actorId: currentUserId,
        timeoutMs: engineTimeoutMs,
        weights: normalized,
        sessionPatch: {
          judgments: session.judgments,
          principles: session.principles,
          links: session.links,
        },
      });

      setWeights(normalized);
      setReport(response);
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lastReport: response,
          updatedAt: nowIso(),
          revisionLog: [
            ...prev.revisionLog,
            {
              id: makeId("rev"),
              timestamp: nowIso(),
              actorId: currentUserId,
              operation: "RUN_COHERENCE",
              details: `Engine run complete. Coherence=${response.coherenceScore.toFixed(2)}.`,
            },
          ],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run coherence engine.");
    } finally {
      setIsRunning(false);
    }
  }, [client, currentUserId, engineTimeoutMs, session, weights]);

  const handleAcceptSuggestion = useCallback(
    (suggestion: Suggestion): void => {
      setSession((prev) => {
        if (!prev) return prev;
        const patched = applyPatch(prev, {
          judgments: suggestion.resultingPatch.judgments,
          principles: suggestion.resultingPatch.principles,
          links: suggestion.resultingPatch.links,
        });

        return {
          ...patched,
          revisionLog: [
            ...patched.revisionLog,
            {
              id: makeId("rev"),
              timestamp: nowIso(),
              actorId: currentUserId,
              operation: "ACCEPT_SUGGESTION",
              details: `${suggestion.id}: ${suggestion.title}`,
            },
          ],
        };
      });
    },
    [currentUserId]
  );

  const handleChangeWeight = useCallback((key: keyof CoherenceWeights, value: number): void => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(1, value)),
    }));
  }, []);

  const handleExportJson = useCallback((): void => {
    if (!session) return;
    downloadText(`wre-session-${session.id}.json`, client.exportSession(session), "application/json");
  }, [client, session]);

  const handleExportMarkdown = useCallback((): void => {
    if (!session) return;
    const markdown = toMarkdown(session, report);
    downloadText(`wre-session-${session.id}.md`, markdown, "text/markdown");
  }, [report, session]);

  const handleSummarizeJudgment = useCallback(async (): Promise<void> => {
    if (!session) return;

    const target =
      session.judgments.find((judgment) => judgment.id === selectedJudgmentId) || session.judgments[0];
    if (!target) {
      setAiError("Add at least one judgment before running AI summarization.");
      setAiPanelOpen(true);
      setAiMode("summary");
      return;
    }

    setAiPanelOpen(true);
    setAiMode("summary");
    setAiError("");
    setAiLoading(true);

    try {
      const response = await aiClient.summarizeJudgment(session.id, {
        judgmentId: target.id,
        text: target.text,
      });
      setSummaryResponse(response);
      appendLocalRevision("AI_SUMMARIZE", `AI summarized judgment ${target.id}.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unable to summarize judgment.");
    } finally {
      setAiLoading(false);
    }
  }, [aiClient, appendLocalRevision, selectedJudgmentId, session]);

  const handleDraftPrinciples = useCallback(async (): Promise<void> => {
    if (!session) return;

    const judgmentIds = selectedJudgmentId
      ? [selectedJudgmentId]
      : session.judgments.slice(0, 6).map((judgment) => judgment.id);

    if (judgmentIds.length === 0) {
      setAiError("Add judgments before drafting principles.");
      setAiPanelOpen(true);
      setAiMode("principles");
      return;
    }

    setAiPanelOpen(true);
    setAiMode("principles");
    setAiError("");
    setAiLoading(true);

    try {
      const response = await aiClient.generatePrinciples(session.id, {
        judgmentIds,
      });
      setGeneratedPrinciples(response);
      appendLocalRevision("AI_GENERATE_PRINCIPLES", `AI drafted ${response.length} principles.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unable to draft principles.");
    } finally {
      setAiLoading(false);
    }
  }, [aiClient, appendLocalRevision, selectedJudgmentId, session]);

  const handleRunAiSuggestions = useCallback(async (): Promise<void> => {
    if (!session) return;

    const conflictSet = deriveConflictSet(session, report, selectedJudgmentId, selectedPrincipleId);

    setAiPanelOpen(true);
    setAiMode("suggestions");
    setAiError("");
    setAiLoading(true);

    try {
      const response = await aiClient.suggestRevisions(session.id, {
        conflictSet,
        maxSuggestions: 3,
      });
      setAiSuggestions(response);
      appendLocalRevision("AI_SUGGEST_REVISIONS", `AI generated ${response.length} revision suggestions.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unable to run AI suggestions.");
    } finally {
      setAiLoading(false);
    }
  }, [aiClient, appendLocalRevision, report, selectedJudgmentId, selectedPrincipleId, session]);

  const handleApplyAiSuggestion = useCallback(
    (suggestion: AIRevisionSuggestion): void => {
      setSession((prev) => {
        if (!prev) return prev;
        const patched = applyAiSuggestionLocally(prev, suggestion);
        return {
          ...patched,
          revisionLog: [
            ...patched.revisionLog,
            {
              id: makeId("rev"),
              timestamp: nowIso(),
              actorId: currentUserId,
              operation: "ACCEPT_AI_SUGGESTION",
              details: `${suggestion.action_type} on ${suggestion.target_id} (${suggestion.change})`,
            },
          ],
        };
      });
      setAiSuggestions((prev) => prev.filter((item) => item !== suggestion));
    },
    [currentUserId]
  );

  const handleAdoptDraftedPrinciple = useCallback(
    async (draft: AIGeneratedPrinciple): Promise<void> => {
      await handleAddPrinciple({
        text: draft.statement,
        scope: draft.scope,
        plausibility: 0.72,
      });
      appendLocalRevision("AI_ADOPT_PRINCIPLE", `Adopted AI drafted principle: ${draft.title}`);
    },
    [appendLocalRevision, handleAddPrinciple]
  );

  const quickAddJudgmentShortcut = useCallback(async (): Promise<void> => {
    await handleAddJudgment({
      text: "New considered judgment (edit me).",
      confidence: 55,
      tags: ["draft"],
      sourceNote: "Shortcut-created entry",
      rejected: false,
    });
  }, [handleAddJudgment]);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        void quickAddJudgmentShortcut();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void handleRunCoherence();
      }

      if (event.key === "1" && report?.suggestions?.[0]) {
        event.preventDefault();
        handleAcceptSuggestion(report.suggestions[0]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [handleAcceptSuggestion, handleRunCoherence, quickAddJudgmentShortcut, report]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading WRE workspace...</div>;
  }

  if (error && !session) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
        {error}
      </div>
    );
  }

  if (!session) {
    return <div className="p-6 text-sm text-slate-600">Unable to load session.</div>;
  }

  return (
    <div
      className="min-h-screen bg-slate-50 p-4 text-slate-900"
      aria-label="Wide Reflective Equilibrium assistant page"
    >
      <div className="mx-auto max-w-[1800px] space-y-3">
        <header className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">WRE Assistant Workspace</h1>
              <p className="mt-1 text-sm text-slate-600">
                Three-pane wide reflective equilibrium workspace with persistence, conflict analysis, and revision support.
              </p>
              <p className="mt-1 text-xs text-slate-500">Session: {session.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                aria-label="Summarize judgment with AI"
                className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
                onClick={() => {
                  void handleSummarizeJudgment();
                }}
                type="button"
              >
                Summarize
              </button>
              <button
                aria-label="Draft principles with AI"
                className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                onClick={() => {
                  void handleDraftPrinciples();
                }}
                type="button"
              >
                Draft principles
              </button>
              <button
                aria-label="Run AI suggestions"
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                onClick={() => {
                  void handleRunAiSuggestions();
                }}
                type="button"
              >
                Run AI suggestions
              </button>
              <button
                aria-label="Export session JSON"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                onClick={handleExportJson}
                type="button"
              >
                Export JSON
              </button>
              <button
                aria-label="Export session Markdown"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                onClick={handleExportMarkdown}
                type="button"
              >
                Export Markdown
              </button>
            </div>
          </div>
          {error ? (
            <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">{error}</p>
          ) : null}
        </header>

        <main className="grid min-h-[840px] grid-cols-1 gap-3 xl:grid-cols-[1fr_1.2fr_1fr]">
          <JudgmentList
            judgments={session.judgments}
            selectedJudgmentId={selectedJudgmentId}
            onSelectJudgment={setSelectedJudgmentId}
            onAddJudgment={handleAddJudgment}
            onUpdateJudgment={handleUpdateJudgment}
            onDeleteJudgment={handleDeleteJudgment}
          />

          <WorkspaceCanvas
            judgments={session.judgments}
            principles={session.principles}
            links={session.links}
            selectedJudgmentId={selectedJudgmentId}
            selectedPrincipleId={selectedPrincipleId}
            onSelectJudgment={setSelectedJudgmentId}
            onSelectPrinciple={setSelectedPrincipleId}
            onCreateLink={handleCreateLink}
            onDeleteLink={handleDeleteLink}
          />

          <div className="grid min-h-0 grid-rows-[1fr_auto_auto] gap-3">
            <PrincipleList
              principles={session.principles}
              selectedPrincipleId={selectedPrincipleId}
              onSelectPrinciple={setSelectedPrincipleId}
              onAddPrinciple={handleAddPrinciple}
              onUpdatePrinciple={handleUpdatePrinciple}
              onDeletePrinciple={handleDeletePrinciple}
            />

            <CoherencePanel
              report={report}
              weights={weights}
              isRunning={isRunning}
              onChangeWeight={handleChangeWeight}
              onRun={handleRunCoherence}
              onAcceptSuggestion={handleAcceptSuggestion}
            />

            <RevisionTimeline entries={session.revisionLog} />
          </div>
        </main>
      </div>

      {aiPanelOpen ? (
        <aside
          aria-label="AI assistant panel"
          className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto border-l border-slate-300 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">AI Assistant</h2>
              <p className="text-xs text-slate-600">Preview, evaluate, and apply deterministic AI outputs.</p>
            </div>
            <button
              aria-label="Close AI panel"
              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setAiPanelOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Privacy notice: session text may be sent to third-party AI services only when server config enables it.
          </div>

          <div className="flex gap-2 border-b border-slate-200 px-4 py-3">
            <button
              aria-label="Show AI summary tab"
              className={`rounded px-2 py-1 text-xs font-medium ${
                aiMode === "summary" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => setAiMode("summary")}
              type="button"
            >
              Summary
            </button>
            <button
              aria-label="Show AI principles tab"
              className={`rounded px-2 py-1 text-xs font-medium ${
                aiMode === "principles" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => setAiMode("principles")}
              type="button"
            >
              Principle drafts
            </button>
            <button
              aria-label="Show AI suggestions tab"
              className={`rounded px-2 py-1 text-xs font-medium ${
                aiMode === "suggestions" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => setAiMode("suggestions")}
              type="button"
            >
              AI suggestions
            </button>
          </div>

          <div className="space-y-3 p-4">
            {aiLoading ? <p className="text-sm text-slate-600">Running AI operation...</p> : null}
            {aiError ? (
              <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{aiError}</p>
            ) : null}

            {aiMode === "summary" ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Judgment Summary</h3>
                {summaryResponse ? (
                  <article className="rounded border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-800">{summaryResponse.summary}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {summaryResponse.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  </article>
                ) : (
                  <p className="text-xs text-slate-500">Click Summarize to generate a structured summary.</p>
                )}
              </section>
            ) : null}

            {aiMode === "principles" ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Drafted Principles</h3>
                {generatedPrinciples.length === 0 ? (
                  <p className="text-xs text-slate-500">Click Draft principles to generate candidates.</p>
                ) : null}
                <ul className="space-y-2">
                  {generatedPrinciples.map((item) => (
                    <li key={`${item.title}-${item.statement}`} className="rounded border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-700">{item.statement}</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Scope: {item.scope} | Supports: {item.supportingJudgmentIds.join(", ")}
                      </p>
                      <button
                        aria-label={`Adopt drafted principle ${item.title}`}
                        className="mt-2 rounded bg-emerald-700 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                        onClick={() => {
                          void handleAdoptDraftedPrinciple(item);
                        }}
                        type="button"
                      >
                        Add to principles
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {aiMode === "suggestions" ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">AI Revision Suggestions</h3>
                {aiSuggestions.length === 0 ? (
                  <p className="text-xs text-slate-500">Click Run AI suggestions to generate revisions.</p>
                ) : null}
                <ul className="space-y-2">
                  {aiSuggestions.map((item, index) => (
                    <li key={`${item.action_type}-${item.target_id}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.action_type} → {item.target_id}
                        </p>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          +{item.expected_effect_delta.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700">Change: {item.change}</p>
                      <p className="mt-1 text-xs text-slate-700">{item.rationale}</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Confidence estimate: {(item.confidence_estimate * 100).toFixed(0)}%
                      </p>
                      <button
                        aria-label={`Apply AI suggestion ${item.target_id}`}
                        className="mt-2 rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                        onClick={() => handleApplyAiSuggestion(item)}
                        type="button"
                      >
                        Apply suggestion
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
};

export default WREAssistantPage;
