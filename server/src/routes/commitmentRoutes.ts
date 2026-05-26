import { Router } from "express";
import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAdmin, requireAuth, type AuthenticatedUser } from "../middleware/auth";
import { appendAuditEvent, buildAuditPackage, createMerkleCheckpoint } from "../services/auditLog";
import { contentHash, signJws } from "../services/cryptoSigning";
import { validateCommitmentPayloadSafety } from "../services/commitmentSafety";
import { recordCommitmentMetric } from "../services/monitoring";
import { reserveProofUpload } from "../services/storage";
import { timestampPendingCheckpoints } from "../services/tsa";
import {
  beliefStateSchema,
  createDeliberationSchema,
  createSessionSchema,
  disputeResolutionSchema,
  disputeSchema,
  finalizeSessionSchema,
  pledgeSignatureSchema,
  privacyTombstoneSchema,
  proofReviewSchema,
  proofSubmissionSchema,
  proofUploadReservationSchema,
  reserveDeliberationSchema,
  transcriptChunkSchema,
} from "../schemas/commitments";

type Tx = Prisma.TransactionClient;

const canonicalizeProposition = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s.%>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const stanceValue = (stance: string): "TRUE" | "FALSE" => {
  return stance === "false" ? "FALSE" : "TRUE";
};

const oneYearFrom = (date: Date): Date => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
};

const jsonSafe = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    if (typeof (value as { toJSON?: unknown }).toJSON === "function") {
      return jsonSafe((value as { toJSON: () => unknown }).toJSON());
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, jsonSafe(item)])
    );
  }
  return value;
};

const sendJson = (res: import("express").Response, value: unknown): void => {
  res.json(jsonSafe(value));
};

const parseOrThrow = <T>(schema: z.ZodType<T>, body: unknown): T => {
  return schema.parse(body);
};

const handleRouteError = (res: import("express").Response, error: unknown): void => {
  if (error instanceof z.ZodError) {
    recordCommitmentMetric("route_error", { status: 400, error: "Invalid request body." });
    res.status(400).json({ error: "Invalid request body.", issues: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown server error.";
  const status =
    message.includes("not found") || message.includes("No ")
      ? 404
      : message.includes("Admin access")
        ? 403
        : message.includes("required") || message.includes("requires")
          ? 400
          : message.includes("sealed until") || message.includes("already submitted") || message.includes("already exists")
            ? 409
            : message.includes("not configured")
              ? 500
              : 500;
  recordCommitmentMetric("route_error", { status, error: message });
  res.status(status).json({ error: message });
};

const ensureUser = async (tx: Tx, actor: AuthenticatedUser) => {
  return tx.user.upsert({
    where: { id: actor.id },
    create: {
      id: actor.id,
      handle: actor.handle,
      role: actor.role === "admin" ? "ADMIN" : "USER",
    },
    update: {
      handle: actor.handle,
      role: actor.role === "admin" ? "ADMIN" : "USER",
    },
  });
};

const requireRequestUser = (req: import("express").Request): AuthenticatedUser => {
  if (!req.user) throw new Error("Authentication required.");
  return req.user;
};

const getDeliberationForUser = async (tx: Tx, deliberationId: string, userId: string) => {
  const deliberation = await tx.deliberation.findUnique({
    where: { id: deliberationId },
    include: { participants: true },
  });
  if (!deliberation) throw new Error("Deliberation not found.");
  const participates = deliberation.createdById === userId || deliberation.participants.some((row) => row.userId === userId);
  if (!participates) throw new Error("Deliberation not found for this user.");
  return deliberation;
};

const assertCanReadAuditObject = async (
  db: PrismaClient,
  actor: AuthenticatedUser,
  objectType: string,
  objectId: string
): Promise<void> => {
  if (actor.role === "admin") return;

  if (objectType === "commitment") {
    const row = await db.commitment.findFirst({ where: { id: objectId, userId: actor.id }, select: { id: true } });
    if (row) return;
  } else if (objectType === "belief_state") {
    const row = await db.beliefState.findFirst({ where: { id: objectId, userId: actor.id }, select: { id: true } });
    if (row) return;
  } else if (objectType === "proof_submission") {
    const row = await db.proofSubmission.findFirst({ where: { id: objectId, userId: actor.id }, select: { id: true } });
    if (row) return;
  } else if (objectType === "deliberation") {
    const row = await db.deliberation.findFirst({
      where: { id: objectId, OR: [{ createdById: actor.id }, { participants: { some: { userId: actor.id } } }] },
      select: { id: true },
    });
    if (row) return;
  } else if (objectType === "session") {
    const row = await db.session.findFirst({
      where: { id: objectId, deliberation: { participants: { some: { userId: actor.id } } } },
      select: { id: true },
    });
    if (row) return;
  } else if (objectType === "session_transcript_chunk") {
    const row = await db.sessionTranscriptChunk.findFirst({
      where: {
        id: objectId,
        OR: [
          { userId: actor.id },
          { session: { deliberation: { participants: { some: { userId: actor.id } } } } },
        ],
      },
      select: { id: true },
    });
    if (row) return;
  } else if (objectType === "pledge_signature") {
    const row = await db.pledgeSignature.findFirst({ where: { id: objectId, userId: actor.id }, select: { id: true } });
    if (row) return;
  } else if (objectType === "dispute") {
    const row = await db.dispute.findFirst({ where: { id: objectId, filedById: actor.id }, select: { id: true } });
    if (row) return;
  }

  throw new Error("Audit object not found for this user.");
};

const buildActionPlan = (
  deliberation: Awaited<ReturnType<typeof getDeliberationForUser>>,
  bodyActionPlan?: Record<string, unknown>
): Prisma.InputJsonObject => {
  if (bodyActionPlan) return bodyActionPlan as Prisma.InputJsonObject;
  const profile = deliberation.implicationProfile as Record<string, unknown>;
  return {
    actionTemplate: String(profile.actionTemplate || ""),
    applicabilityFacts: Array.isArray(profile.applicabilityFacts) ? profile.applicabilityFacts : [],
    proofModesAllowed: Array.isArray(profile.proofModesAllowed) ? profile.proofModesAllowed : ["receipt_log"],
  };
};

export const createCommitmentRouter = (db: PrismaClient = prisma): Router => {
  const router = Router();
  router.use(requireAuth);

  router.post("/pledges/signatures", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(pledgeSignatureSchema, req.body);
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const contentPayload = {
          userId: user.id,
          version: body.version,
          statementHash: body.statementHash,
          consentPayload: body.consentPayload,
        };
        const hash = contentHash(contentPayload);
        const signatureJws =
          body.signatureJws ||
          (await signJws({
            objectType: "pledge_signature",
            objectId: user.id,
            eventType: "pledge_signed",
            canonicalHash: hash,
          }));
        const pledge = await tx.pledgeSignature.upsert({
          where: { userId_version: { userId: user.id, version: body.version } },
          create: {
            userId: user.id,
            version: body.version,
            statementHash: body.statementHash,
            consentPayload: body.consentPayload as Prisma.InputJsonObject,
            contentHash: hash,
            signatureJws,
          },
          update: {
            statementHash: body.statementHash,
            consentPayload: body.consentPayload as Prisma.InputJsonObject,
            contentHash: hash,
            signatureJws,
          },
        });
        await tx.user.update({ where: { id: user.id }, data: { pledgeSigned: true } });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "pledge_signature",
          objectId: pledge.id,
          eventType: "pledge_signed",
          payload: { pledgeId: pledge.id, userId: user.id, version: body.version, contentHash: hash },
        });
        return { pledge, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/deliberations", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(createDeliberationSchema, req.body);
      const propositionText = body.propositionText || body.proposition_text || "";
      const startingCredence = body.startingCredence ?? body.starting_credence ?? 0.5;
      const implicationProfile = body.implicationProfile || body.implication_profile;
      if (!implicationProfile) throw new Error("implication_profile is required.");
      const safetyCheck = validateCommitmentPayloadSafety(implicationProfile);
      if (!safetyCheck.ok) throw new Error(safetyCheck.message || "Commitment implication is not allowed.");
      const consentVersion = body.consentVersion || body.consent_version || "dc-v1";
      const privacyLevel = body.privacyLevel || body.privacy_level || "private_to_participants";
      const availabilitySlots = body.availabilitySlots || body.availability_slots || [];
      const sharedPremises = body.sharedPremises || body.shared_premises || [];
      const canonicalText = canonicalizeProposition(propositionText);
      const propositionHash = contentHash({
        type: "deliberation_proposition",
        canonicalText,
        implicationProfile,
      });

      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const deliberation = await tx.deliberation.create({
          data: {
            propositionText,
            propositionCanonicalText: canonicalText,
            propositionHash,
            implicationProfile: implicationProfile as Prisma.InputJsonObject,
            privacyLevel,
            consentVersion,
            createdById: user.id,
            participants: {
              create: {
                userId: user.id,
                stance: stanceValue(body.stance),
                startingCredence,
                reasons: body.reasons,
                availabilitySlots: availabilitySlots as Prisma.InputJsonArray,
                eligibilityAttested: true,
                consentSigned: true,
                consentVersion,
              },
            },
          },
          include: { participants: true },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "deliberation",
          objectId: deliberation.id,
          eventType: "deliberation_created",
          payload: {
            deliberationId: deliberation.id,
            propositionCanonicalText: canonicalText,
            propositionHash,
            implicationProfile,
            privacyLevel,
            consentVersion,
            startingCredence,
            sharedPremises,
          },
        });
        return { deliberation, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/deliberations/:id/reservations", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(reserveDeliberationSchema, req.body);
      const startingCredence = body.startingCredence ?? body.starting_credence ?? 0.5;
      const availabilitySlots = body.availabilitySlots || body.availability_slots || [];
      const eligibilityAttested = body.eligibilityAttested ?? body.eligibility_attested ?? false;
      const consentSigned = body.consentSigned ?? body.consent_signed ?? false;
      const consentVersion = body.consentVersion || body.consent_version || "dc-v1";
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const deliberation = await tx.deliberation.findUnique({ where: { id: req.params.id } });
        if (!deliberation) throw new Error("Deliberation not found.");
        if (!eligibilityAttested || !consentSigned) {
          throw new Error("Reservation requires eligibility attestation and commitment consent.");
        }
        const participant = await tx.deliberationParticipant.upsert({
          where: { deliberationId_userId: { deliberationId: deliberation.id, userId: user.id } },
          create: {
            deliberationId: deliberation.id,
            userId: user.id,
            stance: stanceValue(body.stance),
            startingCredence,
            reasons: body.reasons,
            availabilitySlots: availabilitySlots as Prisma.InputJsonArray,
            eligibilityAttested,
            consentSigned,
            consentVersion,
          },
          update: {
            stance: stanceValue(body.stance),
            startingCredence,
            reasons: body.reasons,
            availabilitySlots: availabilitySlots as Prisma.InputJsonArray,
            eligibilityAttested,
            consentSigned,
            consentVersion,
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "deliberation",
          objectId: deliberation.id,
          eventType: "reservation_accepted",
          payload: {
            deliberationId: deliberation.id,
            participantId: participant.id,
            userId: user.id,
            stance: participant.stance,
            startingCredence,
            consentVersion,
          },
        });
        return { participant, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get("/deliberations/:id/matches", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const result = await db.$transaction(async (tx) => {
        const deliberation = await getDeliberationForUser(tx, req.params.id, actor.id);
        const creator = deliberation.participants.find((participant) => participant.userId === deliberation.createdById);
        const matches = deliberation.participants
          .filter((participant) => participant.userId !== deliberation.createdById)
          .filter((participant) => !creator || participant.stance !== creator.stance)
          .map((participant) => ({
            participantId: participant.id,
            userId: participant.userId,
            stance: participant.stance,
            startingCredence: Number(participant.startingCredence),
            matchScore: creator
              ? Math.max(0, 100 - Math.abs(Number(creator.startingCredence) - Number(participant.startingCredence)) * 100)
              : 50,
          }))
          .sort((a, b) => b.matchScore - a.matchScore);
        return { deliberationId: deliberation.id, matches };
      });
      sendJson(res, result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/sessions", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(createSessionSchema, req.body);
      const deliberationId = body.deliberationId || body.deliberation_id;
      if (!deliberationId) throw new Error("deliberation_id is required.");
      const result = await db.$transaction(async (tx) => {
        await ensureUser(tx, actor);
        await getDeliberationForUser(tx, deliberationId, actor.id);
        const session = await tx.session.create({
          data: {
            deliberationId,
            scheduledStart: body.scheduledStart || body.scheduled_start ? new Date(body.scheduledStart || body.scheduled_start || "") : null,
            medium: body.medium || "guided_video_or_text",
            status: "SCHEDULED",
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "session",
          objectId: session.id,
          eventType: "session_created",
          payload: { sessionId: session.id, deliberationId, scheduledStart: session.scheduledStart?.toISOString() || null },
        });
        return { session, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/sessions/:id/transcript-chunks", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(transcriptChunkSchema, req.body);
      const speakerLabel = body.speakerLabel || body.speaker_label || actor.handle;
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const session = await tx.session.findUnique({
          where: { id: req.params.id },
          include: { deliberation: { include: { participants: true } } },
        });
        if (!session) throw new Error("Session not found.");
        const participates = session.deliberation.participants.some((participant) => participant.userId === user.id);
        if (!participates) throw new Error("Session not found for this user.");
        const nextChunkIndex =
          body.chunkIndex ?? body.chunk_index ??
          (await tx.sessionTranscriptChunk.count({ where: { sessionId: session.id, userId: user.id } }));
        const payload: Prisma.InputJsonObject = {
          sessionId: session.id,
          deliberationId: session.deliberationId,
          userId: user.id,
          chunkIndex: nextChunkIndex,
          speakerLabel,
          text: body.text,
          visibility: body.visibility || "private_to_participants",
        };
        const hash = contentHash(payload);
        const signatureJws = await signJws({
          objectType: "session_transcript_chunk",
          objectId: session.id,
          eventType: "transcript_chunk_recorded",
          canonicalHash: hash,
        });
        const transcriptChunk = await tx.sessionTranscriptChunk.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            chunkIndex: nextChunkIndex,
            speakerLabel,
            text: body.text,
            visibility: body.visibility || "private_to_participants",
            contentHash: hash,
            signatureJws,
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "session_transcript_chunk",
          objectId: transcriptChunk.id,
          eventType: "transcript_chunk_recorded",
          payload: {
            transcriptChunkId: transcriptChunk.id,
            ...payload,
            contentHash: hash,
          },
        });
        return { transcriptChunk, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/sessions/:id/belief-states", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(beliefStateSchema, req.body);
      const strongestArgumentHeard = body.strongestArgumentHeard || body.strongest_argument_heard || "";
      const strongestReplyOrConcession = body.strongestReplyOrConcession || body.strongest_reply_or_concession || "";
      if (!strongestArgumentHeard || !strongestReplyOrConcession) {
        throw new Error("Strongest argument heard and strongest reply or concession are required.");
      }

      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const session = await tx.session.findUnique({
          where: { id: req.params.id },
          include: { deliberation: { include: { participants: true } } },
        });
        if (!session) throw new Error("Session not found.");
        const participates = session.deliberation.participants.some((participant) => participant.userId === user.id);
        if (!participates) throw new Error("Session not found for this user.");
        const existing = await tx.beliefState.findUnique({
          where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
        });
        if (existing) throw new Error("Belief state already submitted for this session and user.");

        const payload: Prisma.InputJsonObject = {
          sessionId: session.id,
          deliberationId: session.deliberationId,
          userId: user.id,
          credence: body.credence,
          strongestArgumentHeard,
          strongestReplyOrConcession,
          rationale: body.rationale as Prisma.InputJsonObject,
          sealReleasePolicy: "both_submit_or_timer_expiry",
        };
        const hash = contentHash(payload);
        const signatureJws = await signJws({
          objectType: "belief_state",
          objectId: session.id,
          eventType: "sealed_belief_state_submitted",
          canonicalHash: hash,
        });
        const beliefState = await tx.beliefState.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            credence: body.credence,
            strongestArgumentHeard,
            strongestReplyOrConcession,
            rationale: body.rationale as Prisma.InputJsonObject,
            signatureJws,
            contentHash: hash,
            sealed: true,
          },
        });
        const submittedCount = await tx.beliefState.count({ where: { sessionId: session.id } });
        if (submittedCount >= 2) {
          await tx.beliefState.updateMany({ where: { sessionId: session.id }, data: { sealed: false } });
        }
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "belief_state",
          objectId: beliefState.id,
          eventType: "sealed_belief_state_submitted",
          payload,
        });
        return {
          beliefState: {
            id: beliefState.id,
            sessionId: beliefState.sessionId,
            userId: beliefState.userId,
            credence: beliefState.credence,
            contentHash: beliefState.contentHash,
            signatureJws: beliefState.signatureJws,
            sealed: submittedCount < 2,
            sealReleasePolicy: beliefState.sealReleasePolicy,
            submittedAt: beliefState.submittedAt,
          },
          auditEvent,
        };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/sessions/:id/finalize", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(finalizeSessionSchema, req.body);
      const startsOn = body.startsOn || body.starts_on;
      const endsOn = body.endsOn || body.ends_on;
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const session = await tx.session.findUnique({
          where: { id: req.params.id },
          include: { deliberation: { include: { participants: true } } },
        });
        if (!session) throw new Error("Session not found.");
        const deliberation = await getDeliberationForUser(tx, session.deliberationId, user.id);
        const beliefState = await tx.beliefState.findUnique({
          where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
        });
        if (!beliefState) throw new Error("No belief state submitted for this user.");
        const submittedCount = await tx.beliefState.count({ where: { sessionId: session.id } });
        const expectedCount = Math.min(Math.max(session.deliberation.participants.length, 1), 2);
        const expiryBase = session.scheduledStart || session.createdAt;
        const timerExpiresAt = new Date(expiryBase.getTime() + Number(process.env.SEALED_BELIEF_TIMER_MS || 90 * 60 * 1000));
        if (submittedCount < expectedCount && new Date() < timerExpiresAt) {
          throw new Error("Belief states remain sealed until both participants submit or the timer expires.");
        }
        await tx.beliefState.updateMany({ where: { sessionId: session.id }, data: { sealed: false } });
        await tx.session.update({ where: { id: session.id }, data: { status: "FINALIZED", actualEnd: new Date() } });

        const shouldActivate = Number(beliefState.credence) > 0.5;
        if (!shouldActivate) {
          const auditEvent = await appendAuditEvent(tx, {
            objectType: "session",
            objectId: session.id,
            eventType: "session_finalized_no_commitment",
            payload: { sessionId: session.id, userId: user.id, credence: Number(beliefState.credence) },
          });
          return { commitment: null, auditEvent };
        }

        const startDate = startsOn ? new Date(startsOn) : new Date();
        const endDate = endsOn ? new Date(endsOn) : oneYearFrom(startDate);
        const actionPlan = buildActionPlan(deliberation, body.actionPlan || body.action_plan);
        const safetyCheck = validateCommitmentPayloadSafety(actionPlan);
        if (!safetyCheck.ok) throw new Error(safetyCheck.message || "Commitment action plan is not allowed.");
        const proofModesAllowed = (actionPlan.proofModesAllowed || ["receipt_log"]) as Prisma.InputJsonValue;
        const payload = {
          sessionId: session.id,
          userId: user.id,
          beliefStateId: beliefState.id,
          triggerCredence: Number(beliefState.credence),
          actionPlan,
          startsOn: startDate.toISOString(),
          endsOn: endDate.toISOString(),
          proofModesAllowed,
        };
        const commitmentHash = contentHash(payload);
        const signatureJws = await signJws({
          objectType: "commitment",
          objectId: session.id,
          eventType: "commitment_activated",
          canonicalHash: commitmentHash,
        });
        const commitment = await tx.commitment.upsert({
          where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
          create: {
            sessionId: session.id,
            userId: user.id,
            beliefStateId: beliefState.id,
            triggerCredence: beliefState.credence,
            actionPlan,
            startsOn: startDate,
            endsOn: endDate,
            signatureJws,
            commitmentHash,
            proofModesAllowed,
            privacyLevel: deliberation.privacyLevel,
            consentVersion: deliberation.consentVersion,
          },
          update: {},
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "commitment",
          objectId: commitment.id,
          eventType: "commitment_activated",
          payload: { commitmentId: commitment.id, ...payload, commitmentHash },
        });
        return { commitment, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get("/", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const commitments = await db.commitment.findMany({
        where: { userId: actor.id },
        include: { proofSubmissions: true },
        orderBy: { createdAt: "desc" },
      });
      sendJson(res, { commitments });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/:id/proofs/upload-url", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(proofUploadReservationSchema, req.body);
      const fileName = body.fileName || body.file_name || "proof";
      const contentType = body.contentType || body.content_type || "application/octet-stream";
      const contentHashValue = body.contentHash || body.content_hash || null;
      const reservation = await reserveProofUpload(req.params.id, fileName, contentType);
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const commitment = await tx.commitment.findFirst({ where: { id: req.params.id, userId: user.id } });
        if (!commitment) throw new Error("Commitment not found.");
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "commitment",
          objectId: commitment.id,
          eventType: "proof_upload_reserved",
          payload: {
            commitmentId: commitment.id,
            storageKey: reservation.storageKey,
            storageProvider: reservation.storageProvider,
            configured: reservation.configured,
            contentHash: contentHashValue,
            metadata: body.metadata as Prisma.InputJsonObject,
          },
        });
        return { reservation, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/:id/proofs", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(proofSubmissionSchema, req.body);
      const proofType = body.proofType || body.proof_type || "weekly_attestation";
      const contentHashValue = body.contentHash || body.content_hash || null;
      const redactionMetadata = body.redactionMetadata || body.redaction_metadata || null;
      const storageKey =
        body.storageKey ||
        body.storage_key ||
        (await reserveProofUpload(req.params.id, body.fileName || body.file_name || "proof")).storageKey;
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const commitment = await tx.commitment.findFirst({ where: { id: req.params.id, userId: user.id } });
        if (!commitment) throw new Error("Commitment not found.");
        const proofSubmission = await tx.proofSubmission.create({
          data: {
            commitmentId: commitment.id,
            userId: user.id,
            proofType,
            metadata: body.metadata as Prisma.InputJsonObject,
            storageKey,
            contentHash: contentHashValue,
            redactionMetadata: redactionMetadata as Prisma.InputJsonObject | undefined,
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "proof_submission",
          objectId: proofSubmission.id,
          eventType: "proof_uploaded",
          payload: {
            proofSubmissionId: proofSubmission.id,
            commitmentId: commitment.id,
            proofType,
            storageKey,
            contentHash: contentHashValue,
          },
        });
        return { proofSubmission, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/:id/proofs/:proofId/review", requireAdmin, async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const commitmentId = String(req.params.id);
      const proofId = String(req.params.proofId);
      const body = parseOrThrow(proofReviewSchema, req.body);
      const reviewStatus = body.reviewStatus || body.review_status;
      if (!reviewStatus) throw new Error("review_status is required.");
      const reviewNote = body.reviewNote || body.review_note || "";
      const redactionMetadata = body.redactionMetadata || body.redaction_metadata || undefined;
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const proofSubmission = await tx.proofSubmission.findFirst({
          where: { id: proofId, commitmentId },
        });
        if (!proofSubmission) throw new Error("Proof submission not found.");
        const reviewedProof = await tx.proofSubmission.update({
          where: { id: proofSubmission.id },
          data: {
            reviewStatus,
            reviewedById: user.id,
            reviewedAt: new Date(),
            reviewNote,
            redactionMetadata: redactionMetadata as Prisma.InputJsonObject | undefined,
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "proof_submission",
          objectId: reviewedProof.id,
          eventType: "proof_reviewed",
          payload: {
            proofSubmissionId: reviewedProof.id,
            commitmentId,
            reviewStatus,
            reviewedById: user.id,
            redactionMetadata: redactionMetadata as Prisma.InputJsonObject | undefined,
          },
        });
        return { proofSubmission: reviewedProof, auditEvent };
      });
      sendJson(res, result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/:id/revoke", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const commitment = await tx.commitment.findFirst({ where: { id: req.params.id, userId: user.id } });
        if (!commitment) throw new Error("Commitment not found.");
        const dispute = await tx.dispute.create({
          data: {
            targetType: "commitment",
            targetId: commitment.id,
            filedById: user.id,
            disputeType: "prospective_revocation",
            status: "UNDER_REVIEW",
          },
        });
        await tx.commitment.update({ where: { id: commitment.id }, data: { status: "UNDER_REVIEW" } });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "dispute",
          objectId: dispute.id,
          eventType: "dispute_or_revocation_requested",
          payload: { disputeId: dispute.id, commitmentId: commitment.id, disputeType: dispute.disputeType },
        });
        return { dispute, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/disputes/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const disputeId = String(req.params.id);
      const body = parseOrThrow(disputeResolutionSchema, req.body);
      const revokeCommitment = body.revokeCommitment ?? body.revoke_commitment ?? false;
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) throw new Error("Dispute not found.");
        const resolution = body.resolution as Prisma.InputJsonObject;
        const updatedDispute = await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: body.status,
            resolution,
            reviewedById: user.id,
            resolvedAt: new Date(),
          },
        });
        let commitment = null;
        if (dispute.targetType === "commitment") {
          commitment = await tx.commitment.update({
            where: { id: dispute.targetId },
            data: revokeCommitment
              ? { status: "REVOKED", revokedAt: new Date(), reviewNote: JSON.stringify(resolution) }
              : { status: body.status === "REJECTED" ? "PENDING" : "UNDER_REVIEW", reviewedAt: new Date(), reviewNote: JSON.stringify(resolution) },
          });
        }
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "dispute",
          objectId: updatedDispute.id,
          eventType: "review_resolved",
          payload: {
            disputeId: updatedDispute.id,
            targetType: updatedDispute.targetType,
            targetId: updatedDispute.targetId,
            status: updatedDispute.status,
            reviewedById: user.id,
            revokeCommitment,
          },
        });
        return { dispute: updatedDispute, commitment, auditEvent };
      });
      sendJson(res, result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/disputes", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(disputeSchema, req.body);
      const targetType = body.targetType || body.target_type;
      const targetId = body.targetId || body.target_id;
      const disputeType = body.disputeType || body.dispute_type || "general_review";
      if (!targetType || !targetId) throw new Error("target_type and target_id are required.");
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const dispute = await tx.dispute.create({
          data: {
            targetType,
            targetId,
            filedById: user.id,
            disputeType,
            status: "OPEN",
            resolution: body.resolution as Prisma.InputJsonObject | undefined,
          },
        });
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "dispute",
          objectId: dispute.id,
          eventType: "dispute_filed",
          payload: { disputeId: dispute.id, targetType, targetId, disputeType },
        });
        return { dispute, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/privacy/tombstone", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      const body = parseOrThrow(privacyTombstoneSchema, req.body);
      const objectType = body.objectType || body.object_type;
      const objectId = body.objectId || body.object_id || actor.id;
      if (!objectType) throw new Error("object_type is required.");
      const result = await db.$transaction(async (tx) => {
        const user = await ensureUser(tx, actor);
        const isOwnUserRecord = objectType === "user" && objectId === user.id;
        if (!isOwnUserRecord && user.role !== "ADMIN") {
          throw new Error("Admin access required for tombstoning another object.");
        }
        const tombstone = await tx.privacyTombstone.create({
          data: {
            objectType,
            objectId,
            requestedById: user.id,
            reason: body.reason,
          },
        });
        if (objectType === "user") {
          await tx.user.update({ where: { id: objectId }, data: { deletedAt: new Date(), tombstoneReason: body.reason } });
        } else if (objectType === "deliberation") {
          await tx.deliberation.update({
            where: { id: objectId },
            data: { contentDeletedAt: new Date(), privacyTombstonedAt: new Date(), propositionText: "[tombstoned]" },
          });
        } else if (objectType === "belief_state") {
          await tx.beliefState.update({
            where: { id: objectId },
            data: {
              contentDeletedAt: new Date(),
              strongestArgumentHeard: "[tombstoned]",
              strongestReplyOrConcession: "[tombstoned]",
              rationale: { tombstoned: true, reason: body.reason },
            },
          });
        } else if (objectType === "commitment") {
          await tx.commitment.update({
            where: { id: objectId },
            data: { contentDeletedAt: new Date(), privacyTombstonedAt: new Date(), actionPlan: { tombstoned: true, reason: body.reason } },
          });
        } else if (objectType === "proof_submission") {
          await tx.proofSubmission.update({
            where: { id: objectId },
            data: { metadata: { tombstoned: true, reason: body.reason }, storageKey: null, redactionMetadata: { tombstoned: true } },
          });
        } else if (objectType === "session_transcript_chunk") {
          await tx.sessionTranscriptChunk.update({
            where: { id: objectId },
            data: { text: "[tombstoned]", visibility: "redacted_audit_only" },
          });
        }
        const auditEvent = await appendAuditEvent(tx, {
          objectType: "privacy_tombstone",
          objectId: tombstone.id,
          eventType: "privacy_tombstone_applied",
          payload: { tombstoneId: tombstone.id, objectType, objectId, requestedById: user.id, reason: body.reason },
        });
        return { tombstone, auditEvent };
      });
      sendJson(res.status(201), result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get("/admin/health", requireAdmin, async (_req, res) => {
    try {
      const [latestEvent, latestCheckpoint, pendingProofCount, openDisputeCount, untimestampedCheckpointCount] =
        await Promise.all([
          db.auditEvent.findFirst({ orderBy: { sequence: "desc" } }),
          db.auditCheckpoint.findFirst({ orderBy: { createdAt: "desc" }, include: { timestamp: true } }),
          db.proofSubmission.count({ where: { reviewStatus: { in: ["SUBMITTED", "NEEDS_REDACTION"] } } }),
          db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
          db.auditCheckpoint.count({ where: { timestamp: null } }),
        ]);
      const health = {
        config: {
          jwsConfigured: Boolean(process.env.COMMITMENT_JWS_SECRET),
          storageConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_PROOF_BUCKET),
          tsaConfigured: Boolean(process.env.TSA_URL),
          tsaVerificationConfigured: Boolean(process.env.TSA_CA_FILE || process.env.TSA_CA_PEM),
          structuredLogsEnabled: process.env.COMMITMENT_STRUCTURED_LOGS !== "false",
        },
        queues: {
          pendingProofCount,
          openDisputeCount,
          untimestampedCheckpointCount,
        },
        latestEvent: latestEvent
          ? {
              id: latestEvent.id,
              sequence: latestEvent.sequence.toString(),
              eventType: latestEvent.eventType,
              objectType: latestEvent.objectType,
              createdAt: latestEvent.createdAt.toISOString(),
            }
          : null,
        latestCheckpoint: latestCheckpoint
          ? {
              id: latestCheckpoint.id,
              toSequence: latestCheckpoint.toSequence.toString(),
              treeSize: latestCheckpoint.treeSize,
              rootHash: latestCheckpoint.rootHash,
              timestamped: Boolean(latestCheckpoint.timestamp),
              createdAt: latestCheckpoint.createdAt.toISOString(),
            }
          : null,
      };
      recordCommitmentMetric("admin_health_checked", {
        pendingProofCount,
        openDisputeCount,
        untimestampedCheckpointCount,
      });
      sendJson(res, { health });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get("/admin/review-queue", requireAdmin, async (_req, res) => {
    try {
      const [proofSubmissions, disputes] = await Promise.all([
        db.proofSubmission.findMany({
          where: { reviewStatus: { in: ["SUBMITTED", "NEEDS_REDACTION"] } },
          include: {
            user: { select: { id: true, handle: true } },
            commitment: {
              select: {
                id: true,
                userId: true,
                actionPlan: true,
                commitmentHash: true,
                status: true,
                privacyLevel: true,
                proofModesAllowed: true,
              },
            },
          },
          orderBy: { submittedAt: "asc" },
          take: 50,
        }),
        db.dispute.findMany({
          where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
          include: { filedBy: { select: { id: true, handle: true } } },
          orderBy: { filedAt: "asc" },
          take: 50,
        }),
      ]);
      sendJson(res, { proofSubmissions, disputes });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get("/audit/:objectType/:id", async (req, res) => {
    try {
      const actor = requireRequestUser(req);
      await assertCanReadAuditObject(db, actor, req.params.objectType, req.params.id);
      const auditPackage = await buildAuditPackage(db, req.params.objectType, req.params.id);
      sendJson(res, auditPackage);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/audit/checkpoints", requireAdmin, async (_req, res) => {
    try {
      const checkpoint = await createMerkleCheckpoint(db);
      sendJson(res.status(checkpoint ? 201 : 200), { checkpoint });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post("/audit/timestamps", requireAdmin, async (_req, res) => {
    try {
      const result = await timestampPendingCheckpoints(db);
      sendJson(res, result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  return router;
};
