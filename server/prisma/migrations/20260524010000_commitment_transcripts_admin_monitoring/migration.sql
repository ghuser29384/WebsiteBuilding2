-- Adds optional private session transcript chunks for synchronous deliberation records.

CREATE TABLE "SessionTranscriptChunk" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "speakerLabel" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'private_to_participants',
  "contentHash" TEXT NOT NULL,
  "signatureJws" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessionTranscriptChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionTranscriptChunk_sessionId_userId_chunkIndex_key"
  ON "SessionTranscriptChunk"("sessionId", "userId", "chunkIndex");

CREATE INDEX "SessionTranscriptChunk_sessionId_idx" ON "SessionTranscriptChunk"("sessionId");
CREATE INDEX "SessionTranscriptChunk_userId_idx" ON "SessionTranscriptChunk"("userId");
CREATE INDEX "SessionTranscriptChunk_contentHash_idx" ON "SessionTranscriptChunk"("contentHash");

ALTER TABLE "SessionTranscriptChunk"
  ADD CONSTRAINT "SessionTranscriptChunk_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionTranscriptChunk"
  ADD CONSTRAINT "SessionTranscriptChunk_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
