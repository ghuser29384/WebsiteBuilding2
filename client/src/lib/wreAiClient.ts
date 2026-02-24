import type { PrincipleScope } from "./wreClient";

export interface AISummarizeJudgmentRequest {
  judgmentId: string;
  text: string;
}

export interface AISummarizeJudgmentResponse {
  summary: string;
  assumptions: string[];
}

export interface AIGeneratedPrinciple {
  id?: string;
  title: string;
  statement: string;
  scope: PrincipleScope;
  supportingJudgmentIds: string[];
}

export interface AIGeneratePrinciplesRequest {
  judgmentIds: string[];
}

export interface AIConflictSetInput {
  judgmentIds: string[];
  principleIds: string[];
}

export type AISuggestionActionType =
  | "lower_confidence"
  | "reject_judgment"
  | "generalize_principle";

export interface AIRevisionSuggestion {
  action_type: AISuggestionActionType;
  target_id: string;
  change: string;
  rationale: string;
  expected_effect_delta: number;
  confidence_estimate: number;
}

export interface AISuggestRevisionsRequest {
  conflictSet: AIConflictSetInput;
  maxSuggestions?: number;
}

export interface WREAiClientOptions {
  baseUrl?: string;
  getHeaders?: () => Record<string, string>;
  currentUserId?: string;
}

export class WREAiClient {
  private readonly baseUrl: string;
  private readonly getHeaders?: () => Record<string, string>;
  private readonly currentUserId?: string;

  constructor(options: WREAiClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
    this.getHeaders = options.getHeaders;
    this.currentUserId = options.currentUserId;
  }

  async summarizeJudgment(
    sessionId: string,
    payload: AISummarizeJudgmentRequest
  ): Promise<AISummarizeJudgmentResponse> {
    return this.fetchJson<AISummarizeJudgmentResponse>(
      `/api/wre/${encodeURIComponent(sessionId)}/ai/summarize-judgment`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async generatePrinciples(
    sessionId: string,
    payload: AIGeneratePrinciplesRequest
  ): Promise<AIGeneratedPrinciple[]> {
    return this.fetchJson<AIGeneratedPrinciple[]>(
      `/api/wre/${encodeURIComponent(sessionId)}/ai/generate-principles`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async suggestRevisions(
    sessionId: string,
    payload: AISuggestRevisionsRequest
  ): Promise<AIRevisionSuggestion[]> {
    return this.fetchJson<AIRevisionSuggestion[]>(
      `/api/wre/${encodeURIComponent(sessionId)}/ai/suggest-revisions`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  private async fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.getHeaders ? this.getHeaders() : {}),
        ...(this.currentUserId ? { "X-User-Id": this.currentUserId } : {}),
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WRE AI request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
  }
}

export const createWREAiClient = (options: WREAiClientOptions = {}): WREAiClient => {
  return new WREAiClient(options);
};
