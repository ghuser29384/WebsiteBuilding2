import express from "express";
import request from "supertest";
import { createWREAiRouter, applyAiRevisionSuggestionToSession } from "../src/routes/wreAiRoutes";
import { createWRERouter, getWRESessionById, runCoherenceEngine } from "../src/routes/wreRoutes";

describe("wreAiRoutes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(createWRERouter());
    app.use(createWREAiRouter());
    return app;
  };

  it("summarize endpoint returns valid JSON structure", async () => {
    const app = buildApp();
    const createRes = await request(app).post("/api/wre/session").send({ actorId: "tester" });
    expect(createRes.status).toBe(201);

    const sessionId = createRes.body.id as string;

    const addJudgment = await request(app)
      .post(`/api/wre/session/${sessionId}/judgment`)
      .send({
        actorId: "tester",
        judgment: {
          id: "j_sum",
          text: "It is wrong to exploit vulnerable workers for low prices.",
          confidence: 88,
          tags: ["labor"],
          sourceNote: "seed",
        },
      });
    expect(addJudgment.status).toBe(201);

    const response = await request(app)
      .post(`/api/wre/${sessionId}/ai/summarize-judgment`)
      .set("x-user-id", "tester")
      .send({
        judgmentId: "j_sum",
        text: "It is wrong to exploit vulnerable workers for low prices.",
      });

    expect(response.status).toBe(200);
    expect(typeof response.body.summary).toBe("string");
    expect(Array.isArray(response.body.assumptions)).toBe(true);
    expect(response.body.assumptions.length).toBeGreaterThan(0);
  });

  it("generate principles endpoint returns deterministic principle drafts", async () => {
    const app = buildApp();
    const createRes = await request(app).post("/api/wre/session").send({ actorId: "tester" });
    expect(createRes.status).toBe(201);

    const sessionId = createRes.body.id as string;

    await request(app).post(`/api/wre/session/${sessionId}/judgment`).send({
      actorId: "tester",
      judgment: {
        id: "j_a",
        text: "Fast fashion purchases that sustain sweatshop labor are morally wrong.",
        confidence: 85,
        tags: ["labor"],
        sourceNote: "seed",
      },
    });

    await request(app).post(`/api/wre/session/${sessionId}/judgment`).send({
      actorId: "tester",
      judgment: {
        id: "j_b",
        text: "Consumers should avoid purchases that predictably reinforce severe exploitation.",
        confidence: 78,
        tags: ["labor"],
        sourceNote: "seed",
      },
    });

    const response = await request(app)
      .post(`/api/wre/${sessionId}/ai/generate-principles`)
      .set("x-user-id", "tester")
      .send({ judgmentIds: ["j_a", "j_b"] });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        statement: expect.any(String),
        scope: expect.any(String),
        supportingJudgmentIds: expect.any(Array),
      })
    );
  });

  it("AI suggestion can increase coherence in a controlled conflict scenario", async () => {
    const app = buildApp();
    const createRes = await request(app).post("/api/wre/session").send({ actorId: "tester" });
    expect(createRes.status).toBe(201);
    const sessionId = createRes.body.id as string;

    const patchRes = await request(app)
      .post(`/api/wre/session/${sessionId}/run-coherence`)
      .send({
        actorId: "tester",
        sessionPatch: {
          judgments: [
            {
              id: "j1",
              text: "Action A is required.",
              confidence: 95,
              tags: ["demo"],
              sourceNote: "seed",
            },
            {
              id: "j2",
              text: "Action A is forbidden.",
              confidence: 93,
              tags: ["demo"],
              sourceNote: "seed",
            },
          ],
          principles: [
            {
              id: "p1",
              text: "Always perform Action A.",
              scope: "universal",
              plausibility: 0.9,
            },
          ],
          links: [
            {
              id: "l1",
              fromType: "judgment",
              fromId: "j1",
              toType: "judgment",
              toId: "j2",
              relation: "conflicts",
            },
            {
              id: "l2",
              fromType: "judgment",
              fromId: "j2",
              toType: "principle",
              toId: "p1",
              relation: "conflicts",
            },
          ],
        },
      });

    expect(patchRes.status).toBe(200);

    const aiRes = await request(app)
      .post(`/api/wre/${sessionId}/ai/suggest-revisions`)
      .set("x-user-id", "tester")
      .send({
        conflictSet: { judgmentIds: ["j1", "j2"], principleIds: ["p1"] },
        maxSuggestions: 3,
      });

    expect(aiRes.status).toBe(200);
    expect(Array.isArray(aiRes.body)).toBe(true);
    expect(aiRes.body.length).toBeGreaterThan(0);

    const session = getWRESessionById(sessionId);
    expect(session).not.toBeNull();
    if (!session) {
      throw new Error("Expected session to exist");
    }

    const baseline = runCoherenceEngine(session, { timeoutMs: 500 }).coherenceScore;
    const patched = applyAiRevisionSuggestionToSession(session, aiRes.body[0]);
    const improved = runCoherenceEngine(patched, { timeoutMs: 500 }).coherenceScore;

    expect(improved).toBeGreaterThan(baseline);
  });
});
