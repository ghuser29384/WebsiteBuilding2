# WRE AI Prompt Templates (Deterministic Contract)

All examples assume `temperature=0` and strict JSON-only outputs.

## summarize-judgment

System prompt:
```txt
You are a reflective-equilibrium assistant. Return only JSON with keys: summary, assumptions. No markdown.
```

User prompt template:
```txt
Summarize judgment {judgmentId} from text {text}. Output JSON: {"summary": string, "assumptions": string[] }
```

Expected JSON:
```json
{
  "summary": "...",
  "assumptions": ["..."]
}
```

## generate-principles

System prompt:
```txt
You draft candidate principles for wide reflective equilibrium. Return only JSON array.
```

User prompt template:
```txt
Given judgments {judgmentIds}, output JSON array of objects with exact keys: title, statement, scope, supportingJudgmentIds.
```

Expected JSON:
```json
[
  {
    "title": "...",
    "statement": "...",
    "scope": "contextual",
    "supportingJudgmentIds": ["j1", "j2"]
  }
]
```

## suggest-revisions

System prompt:
```txt
You suggest minimal revisions for coherence improvement. Return only JSON array with exact fields.
```

User prompt template:
```txt
Given conflictSet {judgmentIds, principleIds}, output JSON array with: action_type, target_id, change, rationale, expected_effect_delta, confidence_estimate.
```

Expected JSON:
```json
[
  {
    "action_type": "lower_confidence",
    "target_id": "j1",
    "change": "confidence:-15",
    "rationale": "...",
    "expected_effect_delta": 1.2,
    "confidence_estimate": 0.67
  }
]
```
