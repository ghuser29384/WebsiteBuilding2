import { prisma } from "../../server/src/db/prisma";
import { createMerkleCheckpoint } from "../../server/src/services/auditLog";
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

  const checkpoint = await createMerkleCheckpoint(prisma);
  const timestampResult = await timestampPendingCheckpoints(prisma);
  res.status(200).json({ checkpoint, timestampResult });
}
