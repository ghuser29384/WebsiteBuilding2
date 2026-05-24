import { randomUUID } from "crypto";

export interface ProofStorageReservation {
  storageKey: string;
  uploadMethod: "POST" | "PUT";
  uploadUrl: string | null;
  headers: Record<string, string>;
  expiresInSeconds?: number;
  storageProvider: "supabase" | "local";
  configured: boolean;
}

export const createProofStorageKey = (commitmentId: string, fileName: string): string => {
  const safeName = String(fileName || "proof")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  return `commitments/${commitmentId}/proofs/${randomUUID()}-${safeName}`;
};

const encodeStoragePath = (storageKey: string): string => {
  return storageKey.split("/").map(encodeURIComponent).join("/");
};

const localReservation = (storageKey: string): ProofStorageReservation => {
  return {
    storageKey,
    uploadMethod: "PUT",
    uploadUrl: null,
    headers: {},
    storageProvider: "local",
    configured: false,
  };
};

export const reserveProofUpload = async (
  commitmentId: string,
  fileName: string,
  contentType?: string
): Promise<ProofStorageReservation> => {
  const storageKey = createProofStorageKey(commitmentId, fileName);
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PROOF_BUCKET;
  const fetchImpl = (globalThis as any).fetch;

  if (!supabaseUrl || !serviceRoleKey || !bucket || !fetchImpl) {
    return localReservation(storageKey);
  }

  const expiresInSeconds = Number(process.env.SUPABASE_PROOF_UPLOAD_EXPIRES_IN || 900);
  const response = await fetchImpl(
    `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeStoragePath(storageKey)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ upsert: false, expiresIn: expiresInSeconds }),
    }
  );

  if (!response.ok) {
    throw new Error(`Proof storage reservation failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const rawUrl = String(payload.signedURL || payload.signedUrl || payload.url || "");
  const signedUrl =
    rawUrl && rawUrl.startsWith("/")
      ? `${supabaseUrl.replace(/\/+$/, "")}${rawUrl}`
      : rawUrl ||
        (payload.token
          ? `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeStoragePath(
              storageKey
            )}?token=${encodeURIComponent(String(payload.token))}`
          : "");

  return {
    storageKey,
    uploadMethod: "POST",
    uploadUrl: signedUrl || null,
    headers: contentType ? { "Content-Type": contentType } : {},
    expiresInSeconds,
    storageProvider: "supabase",
    configured: Boolean(signedUrl),
  };
};
