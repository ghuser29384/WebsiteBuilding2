/**
 * Adapter abstractions for calling either cloud-hosted or local LLM endpoints.
 *
 * Notes:
 * - No provider SDK is required here; adapters use HTTP fetch.
 * - Replace request/response shapes with your chosen model vendor contract.
 * - Credentials are read from environment variables only.
 */

export interface GenerateJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** JSON schema hint as prompt guidance only for the sample adapter. */
  jsonSchema?: unknown;
}

export interface LLMJsonAdapter {
  readonly providerName: string;
  /**
   * Generate structured JSON output from prompts.
   */
  generateJson<T>(request: GenerateJsonRequest): Promise<T>;
}

type BasicFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

type BasicFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<BasicFetchResponse>;

const getFetchOrThrow = (): BasicFetch => {
  const candidate = (globalThis as { fetch?: BasicFetch }).fetch;
  if (!candidate) {
    throw new Error("Fetch is unavailable in this runtime. Use Node 18+ or polyfill fetch.");
  }
  return candidate;
};

const parseJsonFromText = <T>(input: string): T => {
  const trimmed = input.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    const arrStart = trimmed.indexOf("[");
    const arrEnd = trimmed.lastIndexOf("]");

    const objectSlice = start >= 0 && end > start ? trimmed.slice(start, end + 1) : "";
    const arraySlice = arrStart >= 0 && arrEnd > arrStart ? trimmed.slice(arrStart, arrEnd + 1) : "";

    if (objectSlice) {
      return JSON.parse(objectSlice) as T;
    }
    if (arraySlice) {
      return JSON.parse(arraySlice) as T;
    }
    throw new Error("Model response did not contain parseable JSON.");
  }
};

/**
 * Sample cloud adapter. Replace endpoint and response shape with your provider.
 */
export class CloudLLMAdapter implements LLMJsonAdapter {
  public readonly providerName = "cloud";
  private readonly apiBaseUrl: string;
  private readonly apiKeyEnvVar: string;

  constructor(options?: { apiBaseUrl?: string; apiKeyEnvVar?: string }) {
    this.apiBaseUrl = options?.apiBaseUrl || process.env.AI_API_BASE_URL || "https://api.example-llm.com";
    this.apiKeyEnvVar = options?.apiKeyEnvVar || "AI_API_KEY";
  }

  async generateJson<T>(request: GenerateJsonRequest): Promise<T> {
    const apiKey = process.env[this.apiKeyEnvVar];
    if (!apiKey) {
      throw new Error(`Missing cloud API key in env var ${this.apiKeyEnvVar}.`);
    }

    const fetcher = getFetchOrThrow();

    const response = await fetcher(`${this.apiBaseUrl}/v1/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature ?? 0,
        max_output_tokens: request.maxTokens ?? 600,
        input: [
          { role: "system", content: request.systemPrompt },
          {
            role: "user",
            content:
              request.userPrompt +
              "\n\nReturn only JSON. Schema hint:\n" +
              JSON.stringify(request.jsonSchema || {}, null, 2),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Cloud LLM call failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };

    const text =
      data.output_text ||
      data.output?.[0]?.content?.map((entry) => entry.text || "").join("\n") ||
      "";

    return parseJsonFromText<T>(text);
  }
}

/**
 * Sample local adapter for self-hosted model gateway.
 */
export class LocalLLMAdapter implements LLMJsonAdapter {
  public readonly providerName = "local";
  private readonly endpointUrl: string;

  constructor(options?: { endpointUrl?: string }) {
    this.endpointUrl = options?.endpointUrl || process.env.LOCAL_LLM_ENDPOINT || "http://127.0.0.1:11434/generate";
  }

  async generateJson<T>(request: GenerateJsonRequest): Promise<T> {
    const fetcher = getFetchOrThrow();

    const response = await fetcher(this.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        temperature: request.temperature ?? 0,
        prompt:
          `${request.systemPrompt}\n\n${request.userPrompt}\n\n` +
          `Return only JSON matching:\n${JSON.stringify(request.jsonSchema || {}, null, 2)}`,
        max_tokens: request.maxTokens ?? 600,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Local LLM call failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { output?: string; response?: string; text?: string };
    const text = data.output || data.response || data.text || "";
    return parseJsonFromText<T>(text);
  }
}
