import { createHash } from "crypto";

export type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike | undefined };

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const sha256Hex = (input: string | Buffer): string => {
  return createHash("sha256").update(input).digest("hex");
};

export const contentHash = (payload: unknown): string => {
  return sha256Hex(canonicalJson(payload));
};

const importJose = async (): Promise<any> => {
  // Keep this as a real dynamic import under CommonJS ts-node.
  return new Function("specifier", "return import(specifier)")("jose");
};

export interface SignJwsInput {
  objectType: string;
  objectId: string;
  eventType: string;
  canonicalHash: string;
  createdAt?: string;
}

export const signJws = async (payload: SignJwsInput): Promise<string> => {
  const jose = await importJose();
  const kid = process.env.COMMITMENT_JWS_KEY_ID || "local-dev-key";
  const alg = process.env.COMMITMENT_JWS_ALG || (process.env.COMMITMENT_JWS_PRIVATE_KEY_PKCS8 ? "EdDSA" : "HS256");

  let key: Uint8Array | KeyLike;
  if (process.env.COMMITMENT_JWS_PRIVATE_KEY_PKCS8) {
    key = await jose.importPKCS8(process.env.COMMITMENT_JWS_PRIVATE_KEY_PKCS8, alg);
  } else {
    key = new TextEncoder().encode(process.env.COMMITMENT_JWS_SECRET || "development-only-commitment-secret");
  }

  return new jose.SignJWT({
    objectType: payload.objectType,
    objectId: payload.objectId,
    eventType: payload.eventType,
    canonicalHash: payload.canonicalHash,
  })
    .setProtectedHeader({ alg, kid, typ: "JWT" })
    .setIssuedAt()
    .setIssuer("normativity-commitment-api")
    .setSubject(`${payload.objectType}:${payload.objectId}`)
    .sign(key);
};

type KeyLike = unknown;
