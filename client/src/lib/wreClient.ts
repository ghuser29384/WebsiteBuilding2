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

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  judgments: Judgment[];
  principles: Principle[];
  links: Link[];
  revisionLog: RevisionEntry[];
  lastReport?: CoherenceReport;
}

export interface CreateSessionRequest {
  actorId?: string;
  seedSession?: Partial<SessionPatch>;
}

export interface AddJudgmentRequest {
  actorId?: string;
  judgment: Omit<Judgment, "id" | "createdAt" | "updatedAt"> & { id?: string };
}

export interface AddPrincipleRequest {
  actorId?: string;
  principle: Omit<Principle, "id" | "createdAt" | "updatedAt"> & { id?: string };
}

export interface RunCoherenceRequest {
  actorId?: string;
  timeoutMs?: number;
  weights?: Partial<CoherenceWeights>;
  sessionPatch?: SessionPatch;
}

export interface WREClientOptions {
  baseUrl?: string;
  getHeaders?: () => Record<string, string>;
}

const DEFAULT_BASE = "";

export class WREClient {
  private readonly baseUrl: string;
  private readonly getHeaders?: () => Record<string, string>;

  constructor(options: WREClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE;
    this.getHeaders = options.getHeaders;
  }

  async createSession(payload: CreateSessionRequest = {}): Promise<Session> {
    return this.fetchJson<Session>("/api/wre/session", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async loadSession(id: string): Promise<Session> {
    return this.fetchJson<Session>(`/api/wre/session/${encodeURIComponent(id)}`);
  }

  async addJudgment(id: string, payload: AddJudgmentRequest): Promise<Session> {
    return this.fetchJson<Session>(`/api/wre/session/${encodeURIComponent(id)}/judgment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addPrinciple(id: string, payload: AddPrincipleRequest): Promise<Session> {
    return this.fetchJson<Session>(`/api/wre/session/${encodeURIComponent(id)}/principle`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async runCoherence(id: string, payload: RunCoherenceRequest = {}): Promise<CoherenceReport> {
    return this.fetchJson<CoherenceReport>(`/api/wre/session/${encodeURIComponent(id)}/run-coherence`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  exportSession(session: Session): string {
    return JSON.stringify(session, null, 2);
  }

  private async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.getHeaders ? this.getHeaders() : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WRE request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
  }
}

export const createWREClient = (options: WREClientOptions = {}): WREClient => {
  return new WREClient(options);
};
