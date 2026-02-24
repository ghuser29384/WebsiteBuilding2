# WRE Assistant Integration Guide

This package adds a single-page **Wide Reflective Equilibrium** workspace to an existing React + Node app.

## Files
- `client/src/components/WREAssistantPage.tsx`
- `client/src/components/JudgmentList.tsx`
- `client/src/components/PrincipleList.tsx`
- `client/src/components/WorkspaceCanvas.tsx`
- `client/src/components/CoherencePanel.tsx`
- `client/src/components/RevisionTimeline.tsx`
- `client/src/lib/wreClient.ts`
- `client/package.json`
- `client/tsconfig.json`
- `client/jest.config.ts`
- `server/src/routes/wreRoutes.ts`
- `server/src/app.ts`
- `server/package.json`
- `server/tsconfig.json`
- `server/jest.config.ts`
- `client/tests/WREAssistantPage.test.tsx`
- `server/tests/runCoherence.test.ts`
- `sample_session.json`

## Quick start (module only)

```bash
cd client && npm install && npm test
cd ../server && npm install && npm test
```

Run stub API locally:

```bash
cd server
npm install
npm run dev
```

## 1) Import into an existing React route/page

```tsx
import WREAssistantPage from "./components/WREAssistantPage";

export function ReflectiveEquilibriumRoute() {
  return (
    <WREAssistantPage
      apiBaseUrl=""
      currentUserId="current_user_id_from_your_app"
      authHeaders={() => ({
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        "X-Session-Id": localStorage.getItem("sessionId") || "",
      })}
      engineTimeoutMs={2000}
    />
  );
}
```

## 2) Wire `wreClient.ts` to authentication/session headers

`WREAssistantPage` passes `authHeaders` through to `wreClient`. If your auth lives in context:

```tsx
const authHeaders = () => ({
  Authorization: `Bearer ${auth.accessToken}`,
  "X-Tenant": auth.tenantId,
});

<WREAssistantPage currentUserId={auth.userId} authHeaders={authHeaders} />
```

If you need per-request refresh, keep `authHeaders` as a function so tokens are read lazily.

## 3) Replace backend stubs with real persistence

Current server code uses in-memory `Map` storage in `server/src/routes/wreRoutes.ts`.

### Prisma/Postgres replacement sketch

```ts
// TODO(integrator): replace in-memory store writes with Prisma transactions.
const session = await prisma.wreSession.create({
  data: {
    id: generatedId,
    actorId,
    judgments: { create: judgmentsPayload },
    principles: { create: principlesPayload },
    links: { create: linksPayload },
    revisionEntries: {
      create: {
        actorId,
        operation: "SESSION_CREATED",
        details: "Initialized WRE session.",
      },
    },
  },
  include: {
    judgments: true,
    principles: true,
    links: true,
    revisionEntries: true,
  },
});
```

Notes:
- Use DB constraints for referential integrity (`links.fromId`, `links.toId`).
- Add row-level auth checks so users can only read/write their own sessions.
- Apply strict CORS policy at app bootstrap (`origin` allowlist, credentials controls).

## 4) Coherence engine design (assistive)

`POST /api/wre/session/:id/run-coherence` computes:
- `AgreementRatio` (how well support/conflict links align with confidence/plausibility signals)
- `AvgConfidenceSupported` (average confidence from supported structure)
- `ParsimonyPenalty` (complexity pressure from principles/links)

Final score:

`coherence_score = 100 * (0.5*AgreementRatio + 0.35*AvgConfidenceSupported - 0.15*ParsimonyPenalty)`

Weights are user-editable and normalized.

Conflict detector returns minimal conflicting subsets by greedy search (small subsets first), including:
- explicit judgment-vs-judgment conflict links
- universal-principle conflicts with high-confidence judgments

Suggestion generator proposes minimal changes and ranks by predicted score delta:
- lower confidence (10-20 points)
- reject judgment
- generalize universal principle to defeasible

**Important:** Coherence score is an *assistive* metric — not a proof of moral correctness.

## 5) Literature mapping

The page and engine are operationalized approximations of WRE concepts:
- SEP overview of reflective equilibrium: https://plato.stanford.edu/entries/reflective-equilibrium/
- Daniels on wide reflective equilibrium and justification structure: https://www.cambridge.org/core/books/abs/cambridge-companion-to-rawls/reflective-equilibrium-and-archimedean-points/7CDE1B3F7456A34DA2D9C7CF3420D6F4
- Beisbart et al. formalization work (directed/computational RE): https://doi.org/10.3998/ergo.1152
- Baumberger & Brun on understanding/explanation and epistemic payoffs: https://doi.org/10.1007/s11229-020-02556-9

These implementations are pedagogical and integration-oriented; they intentionally simplify full formal semantics.

## 6) Seeding with sample data

Use `sample_session.json` to create a seed session via `POST /api/wre/session`:

```json
{
  "actorId": "demo_user",
  "seedSession": {
    "judgments": ["..."],
    "principles": ["..."],
    "links": ["..."]
  }
}
```

(Replace placeholders with arrays from `sample_session.json`.)
