import { randomUUID } from "crypto";

export interface ProofStorageReservation {
  storageKey: string;
  uploadUrl: string | null;
  headers: Record<string, string>;
}

export const createProofStorageKey = (commitmentId: string, fileName: string): string => {
  const safeName = String(fileName || "proof")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  return `commitments/${commitmentId}/proofs/${randomUUID()}-${safeName}`;
};

export const reserveProofUpload = (commitmentId: string, fileName: string): ProofStorageReservation => {
  return {
    storageKey: createProofStorageKey(commitmentId, fileName),
    uploadUrl: null,
    headers: {},
  };
};
