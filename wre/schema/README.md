# WRE5 Public Schema

The WRE5 export contract keeps the original judgment/principle/background-theory workflow, but makes each commitment a typed local-first belief graph record. A belief item preserves the user's raw text, provenance, scope, confidence, entrenchment, evidence references, revision status, and a typed proposition object. A claim is the deterministic machine representation used by contradiction, graph, repair, and replay logic.

Primary entities:

- `AgentProfile`: actor and workflow context for an individual human, AI agent, team, institution, or imported reasoning trace.
- `BeliefItem`: raw commitment with typed scope, provenance, evidence references, and claim links.
- `PropositionObject`: actor, action, object, proposition type, modality, polarity, scope, and exceptions.
- `Claim`: normalized proposition with modality, polarity, confidence, entrenchment, status, scope object, exceptions, and provenance.
- `ClaimRelation`: support, contradiction, implication, dependency, exception, attack, undercut, scope, and definition edges.
- `ConflictSet`: deterministic conflict output with a minimal core, WRE5 conflict class, signal type, explanation, and minimal-change repair options.
- `EvidenceRequest`: missing-information request for provenance, scope, evidence, or relation-path gaps.
- `RulePack`: deterministic domain-rule hook, such as deontic logic or organizational policy constraints.

The canonical store for WRE5 is IndexedDB in the browser. Cloudflare Workers + D1/R2 are optional encrypted sync/export infrastructure only after explicit user opt-in.

The companion SDK entry point is `wre/sdk/wre-client.mjs`. It exposes small builders for WRE5 belief items, proposition objects, claims, evidence requests, and relation/conflict enum lists for agents that want to prepare imports before handing them to the browser tool or sync Worker.
