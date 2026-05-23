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
  fileName: z.string().max(240).optional(),
  file_name: z.string().max(240).optional(),
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
