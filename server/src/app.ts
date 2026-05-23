import express from "express";
import { createWRERouter } from "./routes/wreRoutes";
import { createWREAiRouter } from "./routes/wreAiRoutes";
import { createCommitmentRouter } from "./routes/commitmentRoutes";
import { prisma } from "./db/prisma";
import { createMerkleCheckpoint } from "./services/auditLog";
import { timestampPendingCheckpoints } from "./services/tsa";

export const createApp = () => {
  const app = express();
  app.use((req, res, next) => {
    const allowedOrigin = process.env.CORS_ORIGIN || "*";
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id, X-User-Handle, X-User-Role");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json());
  app.use(createWRERouter());
  app.use(createWREAiRouter());
  app.use("/api/commitments", createCommitmentRouter());
  return app;
};

const startCommitmentJobs = (): void => {
  if (process.env.COMMITMENT_JOBS !== "true") return;
  const intervalMs = Number(process.env.COMMITMENT_JOB_INTERVAL_MS || 5 * 60 * 1000);
  setInterval(() => {
    createMerkleCheckpoint(prisma)
      .then(() => timestampPendingCheckpoints(prisma))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Commitment audit job failed", error);
      });
  }, intervalMs).unref();
};

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`WRE stub server listening on http://localhost:${port}`);
  });
  startCommitmentJobs();
}
