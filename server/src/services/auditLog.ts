import type { Prisma, PrismaClient } from "@prisma/client";
import { auditLeafHash, merkleInclusionProof, merkleRoot } from "./merkle";
import { canonicalJson, contentHash, signJws } from "./cryptoSigning";

type TransactionClient = Prisma.TransactionClient | PrismaClient;

export interface AppendAuditEventInput {
  objectType: string;
  objectId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
}

export const appendAuditEvent = async (
  tx: TransactionClient,
  input: AppendAuditEventInput
) => {
  const canonicalHash = contentHash(input.payload);
  const merkleLeafHash = auditLeafHash(canonicalHash);
  const jws = await signJws({
    objectType: input.objectType,
    objectId: input.objectId,
    eventType: input.eventType,
    canonicalHash,
  });

  return tx.auditEvent.create({
    data: {
      objectType: input.objectType,
      objectId: input.objectId,
      eventType: input.eventType,
      payload: input.payload,
      canonicalHash,
      merkleLeafHash,
      jws,
    },
  });
};

export const createMerkleCheckpoint = async (db: PrismaClient) => {
  const events = await db.auditEvent.findMany({
    orderBy: { sequence: "asc" },
    select: { sequence: true, merkleLeafHash: true },
  });

  if (events.length === 0) return null;

  const toSequence = events[events.length - 1].sequence;
  const existing = await db.auditCheckpoint.findFirst({
    where: { toSequence },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const rootHash = merkleRoot(events.map((event) => event.merkleLeafHash));
  const priorCheckpoint = await db.auditCheckpoint.findFirst({
    where: { toSequence: { lt: toSequence } },
    orderBy: { toSequence: "desc" },
  });
  const checkpointHash = contentHash({
    fromSequence: events[0].sequence.toString(),
    toSequence: toSequence.toString(),
    treeSize: events.length,
    rootHash,
    priorCheckpointId: priorCheckpoint?.id || null,
    priorRootHash: priorCheckpoint?.rootHash || null,
  });
  return db.auditCheckpoint.create({
    data: {
      fromSequence: events[0].sequence,
      toSequence,
      treeSize: events.length,
      rootHash,
      priorCheckpointId: priorCheckpoint?.id || null,
      priorRootHash: priorCheckpoint?.rootHash || null,
      checkpointHash,
    },
  });
};

export const buildAuditPackage = async (
  db: PrismaClient,
  objectType: string,
  objectId: string
) => {
  const checkpoint = await createMerkleCheckpoint(db);
  const checkpointWithTimestamp = checkpoint
    ? await db.auditCheckpoint.findUnique({
        where: { id: checkpoint.id },
        include: { timestamp: true },
      })
    : null;
  const allEvents = await db.auditEvent.findMany({
    orderBy: { sequence: "asc" },
  });
  const targetEvents = allEvents.filter(
    (event) => event.objectType === objectType && event.objectId === objectId
  );
  const leaves = allEvents.map((event) => event.merkleLeafHash);
  const tombstone = await db.privacyTombstone.findFirst({
    where: { objectType, objectId },
    orderBy: { createdAt: "desc" },
  });

  return {
    objectType,
    objectId,
    redacted: Boolean(tombstone),
    tombstone: tombstone
      ? {
          id: tombstone.id,
          reason: tombstone.reason,
          createdAt: tombstone.createdAt.toISOString(),
        }
      : null,
    checkpoint: checkpointWithTimestamp
      ? {
          id: checkpointWithTimestamp.id,
          fromSequence: checkpointWithTimestamp.fromSequence.toString(),
          toSequence: checkpointWithTimestamp.toSequence.toString(),
          treeSize: checkpointWithTimestamp.treeSize,
          rootHash: checkpointWithTimestamp.rootHash,
          priorCheckpointId: checkpointWithTimestamp.priorCheckpointId,
          priorRootHash: checkpointWithTimestamp.priorRootHash,
          checkpointHash: checkpointWithTimestamp.checkpointHash,
          timestamp: checkpointWithTimestamp.timestamp
            ? {
                id: checkpointWithTimestamp.timestamp.id,
                tsaUrl: checkpointWithTimestamp.timestamp.tsaUrl,
                rootHash: checkpointWithTimestamp.timestamp.rootHash,
                verifiedAt: checkpointWithTimestamp.timestamp.verifiedAt?.toISOString() || null,
                certificateFingerprint: checkpointWithTimestamp.timestamp.certificateFingerprint,
                createdAt: checkpointWithTimestamp.timestamp.createdAt.toISOString(),
              }
            : null,
          createdAt: checkpointWithTimestamp.createdAt.toISOString(),
        }
      : null,
    events: targetEvents.map((event) => {
      const leafIndex = allEvents.findIndex((row) => row.id === event.id);
      return {
        id: event.id,
        sequence: event.sequence.toString(),
        objectType: event.objectType,
        objectId: event.objectId,
        eventType: event.eventType,
        payload: tombstone ? { tombstoned: true, originalCanonicalHash: event.canonicalHash } : event.payload,
        canonicalPayload: tombstone ? null : canonicalJson(event.payload),
        canonicalHash: event.canonicalHash,
        merkleLeafHash: event.merkleLeafHash,
        jws: event.jws,
        createdAt: event.createdAt.toISOString(),
        merkleInclusionProof: merkleInclusionProof(leaves, leafIndex),
      };
    }),
  };
};
