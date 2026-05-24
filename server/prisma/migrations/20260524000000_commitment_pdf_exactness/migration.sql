-- Production-hardening pass for the one-on-one deliberation commitments feature.

ALTER TABLE "User"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "tombstoneReason" TEXT;

ALTER TABLE "Deliberation"
  ADD COLUMN "contentDeletedAt" TIMESTAMP(3),
  ADD COLUMN "privacyTombstonedAt" TIMESTAMP(3);

ALTER TABLE "BeliefState"
  ADD COLUMN "contentDeletedAt" TIMESTAMP(3);

ALTER TABLE "Commitment"
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "contentDeletedAt" TIMESTAMP(3),
  ADD COLUMN "privacyTombstonedAt" TIMESTAMP(3);

ALTER TABLE "ProofSubmission"
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "redactionMetadata" JSONB,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewNote" TEXT;

ALTER TABLE "Dispute"
  ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "AuditCheckpoint"
  ADD COLUMN "priorCheckpointId" TEXT,
  ADD COLUMN "priorRootHash" TEXT,
  ADD COLUMN "checkpointHash" TEXT;

CREATE TABLE "PrivacyTombstone" (
  "id" TEXT NOT NULL,
  "objectType" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PrivacyTombstone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProofSubmission_contentHash_idx" ON "ProofSubmission"("contentHash");
CREATE INDEX "AuditCheckpoint_priorCheckpointId_idx" ON "AuditCheckpoint"("priorCheckpointId");
CREATE INDEX "PrivacyTombstone_objectType_objectId_idx" ON "PrivacyTombstone"("objectType", "objectId");
CREATE INDEX "PrivacyTombstone_requestedById_idx" ON "PrivacyTombstone"("requestedById");

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent rows are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "AuditEvent_prevent_update" ON "AuditEvent";
DROP TRIGGER IF EXISTS "AuditEvent_prevent_delete" ON "AuditEvent";

CREATE TRIGGER "AuditEvent_prevent_update"
BEFORE UPDATE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

CREATE TRIGGER "AuditEvent_prevent_delete"
BEFORE DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();
