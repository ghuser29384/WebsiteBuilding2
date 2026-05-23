import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { spawn } from "child_process";
import type { PrismaClient } from "@prisma/client";

const run = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed: ${stderr.trim()}`));
    });
  });
};

export const requestRfc3161Timestamp = async (rootHash: string): Promise<Buffer> => {
  const tsaUrl = process.env.TSA_URL;
  if (!tsaUrl) {
    throw new Error("TSA_URL is not configured.");
  }

  const workdir = await mkdtemp(path.join(tmpdir(), "normativity-tsa-"));
  const queryPath = path.join(workdir, "request.tsq");
  const responsePath = path.join(workdir, "response.tsr");

  try {
    await run("openssl", ["ts", "-query", "-sha256", "-digest", rootHash, "-cert", "-out", queryPath]);
    const query = await readFile(queryPath);
    const fetchImpl = (globalThis as any).fetch;
    if (!fetchImpl) throw new Error("Global fetch is not available for TSA requests.");
    const response = await fetchImpl(tsaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/timestamp-query" },
      body: query,
    });
    if (!response.ok) {
      throw new Error(`TSA request failed with HTTP ${response.status}`);
    }
    const token = Buffer.from(await response.arrayBuffer());
    await writeFile(responsePath, token);

    if (process.env.TSA_CA_FILE) {
      await run("openssl", [
        "ts",
        "-verify",
        "-in",
        responsePath,
        "-queryfile",
        queryPath,
        "-CAfile",
        process.env.TSA_CA_FILE,
      ]);
    }

    return token;
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
};

export const timestampPendingCheckpoints = async (db: PrismaClient) => {
  if (!process.env.TSA_URL) return { timestamped: 0, skipped: "TSA_URL is not configured." };

  const checkpoints = await db.auditCheckpoint.findMany({
    where: { timestamp: null },
    orderBy: { createdAt: "asc" },
    take: Number(process.env.TSA_BATCH_SIZE || 5),
  });

  let timestamped = 0;
  for (const checkpoint of checkpoints) {
    const token = await requestRfc3161Timestamp(checkpoint.rootHash);
    const timestampTokenBuffer = new ArrayBuffer(token.byteLength);
    const timestampTokenDer = new Uint8Array(timestampTokenBuffer);
    timestampTokenDer.set(token);
    await db.auditTimestamp.create({
      data: {
        checkpointId: checkpoint.id,
        tsaUrl: String(process.env.TSA_URL),
        rootHash: checkpoint.rootHash,
        timestampTokenDer,
        verifiedAt: process.env.TSA_CA_FILE ? new Date() : null,
        certificateFingerprint: process.env.TSA_CERT_FINGERPRINT || null,
      },
    });
    timestamped += 1;
  }

  return { timestamped };
};
