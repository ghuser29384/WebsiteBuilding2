# WRE AI Integration Notes

This module adds deterministic AI-assisted workflows to `WREAssistantPage` with optional third-party model adapters.

## Added files
- `client/src/lib/wreAiClient.ts`
- `server/src/routes/wreAiRoutes.ts`
- `server/src/lib/aiAdapters.ts`
- `server/src/lib/rag.ts`
- `client/src/components/WREAssistantPage.tsx` (updated with AI controls + side panel)
- `server/tests/wreAiRoutes.test.ts`
- `client/tests/WREAssistantPage.ai.test.tsx`

## API contract

### `POST /api/wre/:sessionId/ai/summarize-judgment`
Request:
```json
{ "judgmentId": "j1", "text": "..." }
```
Response:
```json
{ "summary": "...", "assumptions": ["..."] }
```

### `POST /api/wre/:sessionId/ai/generate-principles`
Request:
```json
{ "judgmentIds": ["j1", "j2"] }
```
Response:
```json
[
  {
    "id": "optional",
    "title": "...",
    "statement": "...",
    "scope": "universal",
    "supportingJudgmentIds": ["j1", "j2"]
  }
]
```

### `POST /api/wre/:sessionId/ai/suggest-revisions`
Request:
```json
{
  "conflictSet": { "judgmentIds": ["j1"], "principleIds": ["p1"] },
  "maxSuggestions": 3
}
```
Response:
```json
[
  {
    "action_type": "lower_confidence",
    "target_id": "j1",
    "change": "confidence:-15",
    "rationale": "...",
    "expected_effect_delta": 1.23,
    "confidence_estimate": 0.66
  }
]
```

## Prompt templates (temperature=0)

These are configured in `server/src/routes/wreAiRoutes.ts` (`AI_PROMPT_TEMPLATES`):
and mirrored in `server/docs/PROMPT_TEMPLATES.md`.

### Summarize judgment
System:
```txt
You are a reflective-equilibrium assistant. Return only JSON with keys: summary, assumptions. No markdown.
```
User template:
```txt
Summarize judgment {judgmentId} from text {text}. Output JSON: {"summary": string, "assumptions": string[] }
```

### Generate principles
System:
```txt
You draft candidate principles for wide reflective equilibrium. Return only JSON array.
```
User template:
```txt
Given judgments {judgmentIds}, output JSON array of objects with exact keys: title, statement, scope, supportingJudgmentIds.
```

### Suggest revisions
System:
```txt
You suggest minimal revisions for coherence improvement. Return only JSON array with exact fields.
```
User template:
```txt
Given conflictSet {judgmentIds, principleIds}, output JSON array with: action_type, target_id, change, rationale, expected_effect_delta, confidence_estimate.
```

## Determinism and fallbacks
- Endpoints are deterministic by default.
- `AI_SEND_TO_THIRD_PARTY=false` by default.
- If `AI_SEND_TO_THIRD_PARTY=true`, adapter calls can be attempted with `temperature=0`, but responses are still schema-validated and length-limited.
- If validation fails, server falls back to deterministic generation.

## Cloud vs self-hosted tradeoffs
- Cloud adapter (`CloudLLMAdapter`): best model quality, faster iteration, higher privacy/compliance burden.
- Local adapter (`LocalLLMAdapter`): stronger data control, lower recurring costs for high volume, potentially lower quality/latency tradeoffs.
- Both are adapter-abstracted; replace endpoint contracts as needed.

## RAG setup

### Current implementation
- `server/src/lib/rag.ts` includes:
  - chunking (`chunkText`)
  - deterministic in-memory embedding (`InMemoryEmbeddingProvider`)
  - brute-force cosine search (`InMemoryVectorStore`)

### Switching to real vector DB
Replace `VectorStoreAdapter` with a production implementation:
- Pinecone
- Weaviate
- PGVector

Suggested ingestion flow:
1. Canonical source collection (SEP entries, policy docs, internal memos).
2. Chunking strategy (`maxChars` + overlap based on paragraph boundaries).
3. Metadata tagging (`source`, `year`, `author`, `topic`).
4. Embedding + upsert into namespace (per tenant/session/domain).

## Security, safety, privacy checklist
- [x] `AI_SEND_TO_THIRD_PARTY` defaults to `false`.
- [x] Output schema validation and max-length sanitization.
- [x] Per-user in-memory rate limiting for AI endpoints.
- [x] No API keys hardcoded.
- [x] Safe fallbacks when model output is malformed.
- [ ] Replace in-memory stores with durable DB + distributed rate limiter.
- [ ] Add tenant-aware ACL checks for session ownership.

## User disclosure snippet (recommended UI copy)

```txt
AI assistance may process the text of your judgments and principles.
By continuing, you confirm that you understand this processing and consent to it.
When third-party AI is disabled, processing remains on this server's deterministic assistant.
```

## Environment variables
- `AI_SEND_TO_THIRD_PARTY` (default: `false`)
- `AI_PROVIDER` (`local` or `cloud`, default: `local`)
- `AI_MODEL` (default: `wre-deterministic-v1`)
- `AI_API_KEY` (cloud adapter)
- `AI_API_BASE_URL` (cloud adapter)
- `LOCAL_LLM_ENDPOINT` (local adapter)
- `AI_RATE_LIMIT_PER_MIN` (default: `30`)

## Integration TODOs
- Replace in-memory persistence in `wreRoutes` with Postgres/Prisma.
- Replace in-memory rate limiting with Redis-backed token bucket.
- Add server-side auth middleware and bind requester identity to session ownership.
