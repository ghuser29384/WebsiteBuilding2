import { z } from "zod";

export const credenceSchema = z.coerce.number().min(0).max(1);

export const pledgeSignatureSchema = z.object({
  version: z.string().min(1).max(80),
  statementHash: z.string().min(8).max(256),
  consentPayload: z.record(z.string(), z.unknown()).default({}),
  signatureJws: z.string().optional(),
});

export const implicationProfileSchema = z.object({
  actionTemplate: z.string().min(3).max(1200),
  applicabilityFacts: z.array(z.string().min(1).max(500)).default([]),
  proofModesAllowed: z.array(z.string().min(1).max(80)).min(1).default(["receipt_log"]),
});

export const createDeliberationSchema = z.object({
  propositionText: z.string().min(3).max(2000).optional(),
  proposition_text: z.string().min(3).max(2000).optional(),
  startingCredence: credenceSchema.optional(),
  starting_credence: credenceSchema.optional(),
  stance: z.enum(["true", "false"]).default("true"),
  reasons: z.string().min(1).max(4000),
  sharedPremises: z.array(z.string().max(500)).default([]).optional(),
  shared_premises: z.array(z.string().max(500)).default([]).optional(),
  evidenceLinks: z.array(z.record(z.string(), z.unknown())).default([]).optional(),
  evidence_links: z.array(z.record(z.string(), z.unknown())).default([]).optional(),
  implicationProfile: implicationProfileSchema.optional(),
  implication_profile: implicationProfileSchema.optional(),
  privacyLevel: z.string().min(1).max(80).default("private_to_participants").optional(),
  privacy_level: z.string().min(1).max(80).default("private_to_participants").optional(),
  consentVersion: z.string().min(1).max(80).default("dc-v1").optional(),
  consent_version: z.string().min(1).max(80).default("dc-v1").optional(),
  availabilitySlots: z.array(z.string().max(120)).default([]).optional(),
  availability_slots: z.array(z.string().max(120)).default([]).optional(),
});

export const reserveDeliberationSchema = z.object({
  stance: z.enum(["true", "false"]),
  startingCredence: credenceSchema.optional(),
  starting_credence: credenceSchema.optional(),
  reasons: z.string().min(1).max(4000),
  availabilitySlots: z.array(z.string().max(120)).default([]).optional(),
  availability_slots: z.array(z.string().max(120)).default([]).optional(),
  eligibilityAttested: z.boolean().default(false).optional(),
  eligibility_attested: z.boolean().default(false).optional(),
  consentSigned: z.boolean().default(false).optional(),
  consent_signed: z.boolean().default(false).optional(),
  consentVersion: z.string().min(1).max(80).default("dc-v1").optional(),
  consent_version: z.string().min(1).max(80).default("dc-v1").optional(),
});

export const createSessionSchema = z.object({
  deliberationId: z.string().min(1).optional(),
  deliberation_id: z.string().min(1).optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduled_start: z.string().datetime().optional(),
  medium: z.string().min(1).max(120).default("guided_video_or_text").optional(),
});

export const beliefStateSchema = z.object({
  credence: credenceSchema,
  strongestArgumentHeard: z.string().min(1).max(4000).optional(),
  strongest_argument_heard: z.string().min(1).max(4000).optional(),
  strongestReplyOrConcession: z.string().min(1).max(4000).optional(),
  strongest_reply_or_concession: z.string().min(1).max(4000).optional(),
  rationale: z.record(z.string(), z.unknown()).default({}),
});

export const transcriptChunkSchema = z.object({
  chunkIndex: z.coerce.number().int().min(0).max(10000).optional(),
  chunk_index: z.coerce.number().int().min(0).max(10000).optional(),
  speakerLabel: z.string().min(1).max(120).optional(),
  speaker_label: z.string().min(1).max(120).optional(),
  text: z.string().min(1).max(12000),
  visibility: z
    .enum(["private_to_participants", "private_to_submitter", "redacted_audit_only"])
    .default("private_to_participants")
    .optional(),
});

export const finalizeSessionSchema = z.object({
  startsOn: z.string().datetime().optional(),
  starts_on: z.string().datetime().optional(),
  endsOn: z.string().datetime().optional(),
  ends_on: z.string().datetime().optional(),
  actionPlan: z.record(z.string(), z.unknown()).optional(),
  action_plan: z.record(z.string(), z.unknown()).optional(),
});

export const proofSubmissionSchema = z.object({
  proofType: z.string().min(1).max(80).optional(),
  proof_type: z.string().min(1).max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  storageKey: z.string().max(500).optional(),
  storage_key: z.string().max(500).optional(),
  contentHash: z.string().min(16).max(256).optional(),
  content_hash: z.string().min(16).max(256).optional(),
  fileName: z.string().max(240).optional(),
  file_name: z.string().max(240).optional(),
  redactionMetadata: z.record(z.string(), z.unknown()).optional(),
  redaction_metadata: z.record(z.string(), z.unknown()).optional(),
});

export const proofUploadReservationSchema = z.object({
  fileName: z.string().min(1).max(240).optional(),
  file_name: z.string().min(1).max(240).optional(),
  contentType: z.string().min(1).max(160).optional(),
  content_type: z.string().min(1).max(160).optional(),
  contentHash: z.string().min(16).max(256).optional(),
  content_hash: z.string().min(16).max(256).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const proofReviewSchema = z.object({
  reviewStatus: z.enum(["ACCEPTED", "REJECTED", "NEEDS_REDACTION"]).optional(),
  review_status: z.enum(["ACCEPTED", "REJECTED", "NEEDS_REDACTION"]).optional(),
  reviewNote: z.string().max(2000).optional(),
  review_note: z.string().max(2000).optional(),
  redactionMetadata: z.record(z.string(), z.unknown()).optional(),
  redaction_metadata: z.record(z.string(), z.unknown()).optional(),
});

export const disputeSchema = z.object({
  targetType: z.string().min(1).max(80).optional(),
  target_type: z.string().min(1).max(80).optional(),
  targetId: z.string().min(1).max(120).optional(),
  target_id: z.string().min(1).max(120).optional(),
  disputeType: z.string().min(1).max(120).optional(),
  dispute_type: z.string().min(1).max(120).optional(),
  resolution: z.record(z.string(), z.unknown()).optional(),
});

export const disputeResolutionSchema = z.object({
  status: z.enum(["RESOLVED", "REJECTED"]).default("RESOLVED"),
  resolution: z.record(z.string(), z.unknown()).default({}),
  revokeCommitment: z.boolean().optional(),
  revoke_commitment: z.boolean().optional(),
});

export const privacyTombstoneSchema = z.object({
  objectType: z.enum(["user", "deliberation", "belief_state", "commitment", "proof_submission", "session_transcript_chunk", "dispute"]).optional(),
  object_type: z.enum(["user", "deliberation", "belief_state", "commitment", "proof_submission", "session_transcript_chunk", "dispute"]).optional(),
  objectId: z.string().min(1).max(120).optional(),
  object_id: z.string().min(1).max(120).optional(),
  reason: z.string().min(1).max(1000),
});
