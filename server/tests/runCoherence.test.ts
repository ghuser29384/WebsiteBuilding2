import express from "express";
import request from "supertest";
import { createWRERouter } from "../src/routes/wreRoutes";

describe("wreRoutes run-coherence", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(createWRERouter());
    return app;
  };

  it("returns coherence report with positive revision suggestions on conflicted input", async () => {
    const app = buildApp();

    const createRes = await request(app).post("/api/wre/session").send({ actorId: "tester" });
    expect(createRes.status).toBe(201);
    const sessionId = createRes.body.id as string;

    const runRes = await request(app)
      .post(`/api/wre/session/${sessionId}/run-coherence`)
      .send({
        actorId: "tester",
        timeoutMs: 2000,
        sessionPatch: {
          judgments: [
            {
              id: "j1",
              text: "It is wrong to divert the trolley.",
              confidence: 92,
              tags: ["trolley"],
              sourceNote: "initial intuition",
            },
            {
              id: "j2",
              text: "It is permissible to divert the trolley.",
              confidence: 90,
              tags: ["trolley"],
              sourceNote: "counter intuition",
            },
          ],
          principles: [
            {
              id: "p1",
              text: "Always avoid intentionally harming innocents.",
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

    expect(runRes.status).toBe(200);
    expect(runRes.body.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(runRes.body.minimalConflicts.length).toBeGreaterThan(0);
    expect(runRes.body.suggestions.length).toBeGreaterThan(0);
    expect(runRes.body.suggestions[0].effectEstimate).toBeGreaterThan(0);
  });

  it("is monotonic in a contrived scenario when reducing a conflicting confidence", async () => {
    const app = buildApp();

    const createRes = await request(app).post("/api/wre/session").send({ actorId: "tester" });
    expect(createRes.status).toBe(201);
    const sessionId = createRes.body.id as string;

    const baselineRes = await request(app)
      .post(`/api/wre/session/${sessionId}/run-coherence`)
      .send({
        sessionPatch: {
          judgments: [
            {
              id: "j1",
              text: "Action A is required.",
              confidence: 95,
              tags: ["demo"],
              sourceNote: "baseline",
            },
            {
              id: "j2",
              text: "Action A is forbidden.",
              confidence: 95,
              tags: ["demo"],
              sourceNote: "baseline",
            },
          ],
          principles: [
            {
              id: "p1",
              text: "Always do A.",
              scope: "universal",
              plausibility: 0.92,
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

    expect(baselineRes.status).toBe(200);
    const baselineScore = baselineRes.body.coherenceScore as number;

    const improvedRes = await request(app)
      .post(`/api/wre/session/${sessionId}/run-coherence`)
      .send({
        sessionPatch: {
          judgments: [
            {
              id: "j1",
              text: "Action A is required.",
              confidence: 95,
              tags: ["demo"],
              sourceNote: "baseline",
            },
            {
              id: "j2",
              text: "Action A is forbidden.",
              confidence: 60,
              tags: ["demo"],
              sourceNote: "confidence reduced",
            },
          ],
          principles: [
            {
              id: "p1",
              text: "Always do A.",
              scope: "universal",
              plausibility: 0.92,
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

    expect(improvedRes.status).toBe(200);
    const improvedScore = improvedRes.body.coherenceScore as number;
    expect(improvedScore).toBeGreaterThan(baselineScore);
  });
});
