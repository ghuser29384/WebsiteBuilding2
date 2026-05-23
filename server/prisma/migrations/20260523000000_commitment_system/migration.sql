CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "DeliberationStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED');
CREATE TYPE "ParticipantStance" AS ENUM ('TRUE', 'FALSE');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'FINALIZED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CommitmentStatus" AS ENUM ('PENDING', 'DONE', 'UNDER_REVIEW', 'REVOKED', 'CANCELLED');
CREATE TYPE "ProofReviewStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'NEEDS_REDACTION');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "pledgeSigned" BOOLEAN NOT NULL DEFAULT false,
  "privacySettings" JSONB,
  "authMethods" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PledgeSignature" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "statementHash" TEXT NOT NULL,
  "consentPayload" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "signatureJws" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PledgeSignature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Deliberation" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'one_on_one_commitment',
  "propositionText" TEXT NOT NULL,
  "propositionCanonicalText" TEXT NOT NULL,
  "propositionHash" TEXT NOT NULL,
  "implicationProfile" JSONB NOT NULL,
  "status" "DeliberationStatus" NOT NULL DEFAULT 'OPEN',
  "ambiguityScore" DECIMAL(5,4),
  "privacyLevel" TEXT NOT NULL DEFAULT 'private_to_participants',
  "consentVersion" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Deliberation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliberationParticipant" (
  "id" TEXT NOT NULL,
  "deliberationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stance" "ParticipantStance" NOT NULL,
  "startingCredence" DECIMAL(6,5) NOT NULL,
  "reasons" TEXT NOT NULL,
  "availabilitySlots" JSONB NOT NULL,
  "eligibilityAttested" BOOLEAN NOT NULL DEFAULT false,
  "consentSigned" BOOLEAN NOT NULL DEFAULT false,
  "consentVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliberationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "deliberationId" TEXT NOT NULL,
  "scheduledStart" TIMESTAMP(3),
  "actualEnd" TIMESTAMP(3),
  "medium" TEXT NOT NULL DEFAULT 'guided_video_or_text',
  "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BeliefState" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credence" DECIMAL(6,5) NOT NULL,
  "strongestArgumentHeard" TEXT NOT NULL,
  "strongestReplyOrConcession" TEXT NOT NULL,
  "rationale" JSONB NOT NULL,
  "signatureJws" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "sealed" BOOLEAN NOT NULL DEFAULT true,
  "sealReleasePolicy" TEXT NOT NULL DEFAULT 'both_submit_or_timer_expiry',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BeliefState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Commitment" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "beliefStateId" TEXT NOT NULL,
  "triggerCredence" DECIMAL(6,5) NOT NULL,
  "actionPlan" JSONB NOT NULL,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "endsOn" TIMESTAMP(3) NOT NULL,
  "status" "CommitmentStatus" NOT NULL DEFAULT 'PENDING',
  "signatureJws" TEXT NOT NULL,
  "commitmentHash" TEXT NOT NULL,
  "proofCadence" TEXT NOT NULL DEFAULT 'monthly',
  "proofModesAllowed" JSONB NOT NULL,
  "privacyLevel" TEXT NOT NULL DEFAULT 'private_to_participants',
  "consentVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProofSubmission" (
  "id" TEXT NOT NULL,
  "commitmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "proofType" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "storageKey" TEXT,
  "reviewStatus" "ProofReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProofSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dispute" (
  "id" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "filedById" TEXT NOT NULL,
  "disputeType" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" JSONB,
  "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "sequence" BIGSERIAL NOT NULL,
  "objectType" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "canonicalHash" TEXT NOT NULL,
  "merkleLeafHash" TEXT NOT NULL,
  "merkleRoot" TEXT,
  "jws" TEXT NOT NULL,
  "tsaTokenRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditCheckpoint" (
  "id" TEXT NOT NULL,
  "fromSequence" BIGINT NOT NULL,
  "toSequence" BIGINT NOT NULL,
  "treeSize" INTEGER NOT NULL,
  "rootHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditTimestamp" (
  "id" TEXT NOT NULL,
  "checkpointId" TEXT NOT NULL,
  "tsaUrl" TEXT NOT NULL,
  "rootHash" TEXT NOT NULL,
  "timestampTokenDer" BYTEA NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "certificateFingerprint" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditTimestamp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE UNIQUE INDEX "PledgeSignature_userId_version_key" ON "PledgeSignature"("userId", "version");
CREATE UNIQUE INDEX "DeliberationParticipant_deliberationId_userId_key" ON "DeliberationParticipant"("deliberationId", "userId");
CREATE UNIQUE INDEX "BeliefState_sessionId_userId_key" ON "BeliefState"("sessionId", "userId");
CREATE UNIQUE INDEX "Commitment_sessionId_userId_key" ON "Commitment"("sessionId", "userId");
CREATE UNIQUE INDEX "AuditEvent_sequence_key" ON "AuditEvent"("sequence");
CREATE UNIQUE INDEX "AuditTimestamp_checkpointId_key" ON "AuditTimestamp"("checkpointId");

CREATE INDEX "Deliberation_propositionHash_idx" ON "Deliberation"("propositionHash");
CREATE INDEX "Deliberation_createdById_idx" ON "Deliberation"("createdById");
CREATE INDEX "Deliberation_status_idx" ON "Deliberation"("status");
CREATE INDEX "DeliberationParticipant_deliberationId_stance_idx" ON "DeliberationParticipant"("deliberationId", "stance");
CREATE INDEX "Session_deliberationId_idx" ON "Session"("deliberationId");
CREATE INDEX "Session_status_idx" ON "Session"("status");
CREATE INDEX "BeliefState_contentHash_idx" ON "BeliefState"("contentHash");
CREATE INDEX "Commitment_beliefStateId_idx" ON "Commitment"("beliefStateId");
CREATE INDEX "Commitment_commitmentHash_idx" ON "Commitment"("commitmentHash");
CREATE INDEX "Commitment_status_idx" ON "Commitment"("status");
CREATE INDEX "ProofSubmission_commitmentId_idx" ON "ProofSubmission"("commitmentId");
CREATE INDEX "ProofSubmission_userId_idx" ON "ProofSubmission"("userId");
CREATE INDEX "Dispute_targetType_targetId_idx" ON "Dispute"("targetType", "targetId");
CREATE INDEX "Dispute_filedById_idx" ON "Dispute"("filedById");
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");
CREATE INDEX "AuditEvent_objectType_objectId_idx" ON "AuditEvent"("objectType", "objectId");
CREATE INDEX "AuditEvent_sequence_idx" ON "AuditEvent"("sequence");
CREATE INDEX "AuditEvent_canonicalHash_idx" ON "AuditEvent"("canonicalHash");
CREATE INDEX "AuditCheckpoint_toSequence_idx" ON "AuditCheckpoint"("toSequence");
CREATE INDEX "AuditCheckpoint_rootHash_idx" ON "AuditCheckpoint"("rootHash");
CREATE INDEX "AuditTimestamp_rootHash_idx" ON "AuditTimestamp"("rootHash");

ALTER TABLE "PledgeSignature" ADD CONSTRAINT "PledgeSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deliberation" ADD CONSTRAINT "Deliberation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliberationParticipant" ADD CONSTRAINT "DeliberationParticipant_deliberationId_fkey" FOREIGN KEY ("deliberationId") REFERENCES "Deliberation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliberationParticipant" ADD CONSTRAINT "DeliberationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_deliberationId_fkey" FOREIGN KEY ("deliberationId") REFERENCES "Deliberation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BeliefState" ADD CONSTRAINT "BeliefState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BeliefState" ADD CONSTRAINT "BeliefState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_beliefStateId_fkey" FOREIGN KEY ("beliefStateId") REFERENCES "BeliefState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProofSubmission" ADD CONSTRAINT "ProofSubmission_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProofSubmission" ADD CONSTRAINT "ProofSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditTimestamp" ADD CONSTRAINT "AuditTimestamp_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "AuditCheckpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
