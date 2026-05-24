import { prisma } from "../../server/src/db/prisma";
import { createMerkleCheckpoint } from "../../server/src/services/auditLog";
import { recordCommitmentMetric } from "../../server/src/services/monitoring";
import { timestampPendingCheckpoints } from "../../server/src/services/tsa";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const checkpoint = await createMerkleCheckpoint(prisma);
    const timestampResult = await timestampPendingCheckpoints(prisma);
    recordCommitmentMetric("cron_commitment_audit_completed", {
      checkpointId: checkpoint?.id || null,
      timestamped: Number(timestampResult.timestamped || 0),
    });
    res.status(200).json({ checkpoint, timestampResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Commitment audit cron failed.";
    recordCommitmentMetric("cron_commitment_audit_failed", { error: message });
    res.status(500).json({ error: message });
  }
}
