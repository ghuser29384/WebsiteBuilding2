const WRE_SCHEMA_VERSION = "wre-5";
const DEFAULT_BODY_LIMIT_BYTES = 262_144;
const DEFAULT_RATE_LIMIT_PER_HOUR = 60;
const HEX_64_RE = /^[a-f0-9]{64}$/;
const VALID_PRIVACY_MODES = new Set(["encrypted_sync", "private_link", "workspace"]);
const VALID_RESOLUTION_STRATEGIES = new Set(["local_wins", "remote_wins", "manual_merge", "accept_tension"]);

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue | undefined };

interface Env {
  WRE_SYNC_DB: D1Database;
  WRE_SYNC_ARCHIVES: R2Bucket;
  ALLOWED_ORIGINS?: string;
  BODY_LIMIT_BYTES?: string;
  RATE_LIMIT_PER_HOUR?: string;
}

interface WorkspaceRow {
  id: string;
  session_id: string;
  token_verifier_hash: string;
  privacy_mode: string;
  retention_policy: string;
  remote_clock: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ManifestRow {
  id: string;
  workspace_id: string;
  session_id: string;
  idempotency_key: string;
  r2_key: string;
  manifest_hash: string;
  body_hash: string;
  byte_length: number;
  remote_clock: number;
  manifest_json: string;
  mutation_summary_json: string;
  created_at: string;
}

interface TombstoneRow {
  id: string;
  workspace_id: string;
  session_id: string;
  reason: string;
  remote_clock: number;
  created_at: string;
}

class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export async function handleRequest(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  try {
    if (method === "GET" && url.pathname === "/health") {
      return jsonResponse(request, env, {
        status: "ok",
        schemaVersion: WRE_SCHEMA_VERSION,
        canonicalStoreTarget: "Browser IndexedDB by default; Cloudflare D1/R2 stores only optional encrypted sync metadata and packets",
        storage: {
          d1: Boolean(env.WRE_SYNC_DB),
          r2: Boolean(env.WRE_SYNC_ARCHIVES),
        },
      });
    }

    if (method === "POST" && url.pathname === "/v1/workspaces") {
      return await createWorkspace(request, env);
    }

    if (method === "POST" && url.pathname === "/v1/sync/push") {
      return await pushSyncPacket(request, env);
    }

    if (method === "GET" && url.pathname === "/v1/sync/pull") {
      return await pullSyncManifest(request, env, url);
    }

    if (method === "POST" && url.pathname === "/v1/sync/resolve") {
      return await resolveSyncConflict(request, env);
    }

    const manifestMatch = /^\/v1\/sessions\/([^/]+)\/manifest$/.exec(url.pathname);
    if (method === "GET" && manifestMatch) {
      return await sessionManifest(request, env, url, decodeURIComponent(manifestMatch[1]));
    }

    const deleteMatch = /^\/v1\/sessions\/([^/]+)$/.exec(url.pathname);
    if (method === "DELETE" && deleteMatch) {
      return await deleteSession(request, env, url, decodeURIComponent(deleteMatch[1]), ctx);
    }

    throw new HttpError(404, "not_found", "No WRE sync route matches this request.");
  } catch (error) {
    return errorResponse(request, env, error);
  }
}

async function createWorkspace(request: Request, env: Env): Promise<Response> {
  const body = await readJsonObject(request, env);
  const sessionId = requireString(body, "sessionId", 160);
  const privacyMode = requireString(body, "privacyMode", 64);
  const retentionPolicy = requireString(body, "retentionPolicy", 120);
  const tokenVerifierHash = requireString(body, "tokenVerifierHash", 64).toLowerCase();

  if (!VALID_PRIVACY_MODES.has(privacyMode)) {
    throw new HttpError(400, "invalid_privacy_mode", "Workspace privacy mode must be encrypted_sync, private_link, or workspace.");
  }
  if (!HEX_64_RE.test(tokenVerifierHash)) {
    throw new HttpError(400, "invalid_token_verifier", "tokenVerifierHash must be a 64-character lowercase SHA-256 hex digest.");
  }

  const now = new Date().toISOString();
  const workspaceId = `wsp_${crypto.randomUUID()}`;
  await env.WRE_SYNC_DB
    .prepare(
      `INSERT INTO workspace (id, session_id, token_verifier_hash, privacy_mode, retention_policy, remote_clock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .bind(workspaceId, sessionId, tokenVerifierHash, privacyMode, retentionPolicy, now, now)
    .run();

  await insertAuditEvent(env, workspaceId, "workspace.created", {
    sessionId,
    privacyMode,
    retentionPolicy,
    schemaVersion: String(body.schemaVersion || WRE_SCHEMA_VERSION),
  });

  return jsonResponse(request, env, {
    status: "created",
    schemaVersion: WRE_SCHEMA_VERSION,
    workspaceId,
    workspace: {
      id: workspaceId,
      sessionId,
      privacyMode,
      retentionPolicy,
    },
    remoteClock: 0,
  }, 201);
}

async function pushSyncPacket(request: Request, env: Env): Promise<Response> {
  const body = await readJsonObject(request, env);
  const workspaceId = requireString(body, "workspaceId", 160);
  const sessionId = requireString(body, "sessionId", 160);
  const idempotencyKey = requireString(body, "idempotencyKey", 200);
  const manifest = requireObject(body, "manifest");
  const mutationSet = requireObject(body, "mutationSet");
  const encryptedPayload = requireObject(body, "encryptedPayload");
  validateEncryptedPayload(encryptedPayload);

  const workspace = await requireWorkspaceAuth(request, env, workspaceId);
  await enforceRateLimit(env, workspaceId);

  const existing = await env.WRE_SYNC_DB
    .prepare("SELECT * FROM sync_packet_manifest WHERE workspace_id = ? AND idempotency_key = ? LIMIT 1")
    .bind(workspaceId, idempotencyKey)
    .first<ManifestRow>();
  if (existing) {
    return jsonResponse(request, env, {
      status: "duplicate",
      workspaceId,
      sessionId: existing.session_id,
      remoteClock: numberFrom(existing.remote_clock),
      manifest: manifestResponse(existing),
    });
  }

  const now = new Date().toISOString();
  const remoteClock = numberFrom(workspace.remote_clock) + 1;
  const packetId = `pkt_${crypto.randomUUID()}`;
  const r2Key = `workspaces/${safeSegment(workspaceId)}/sessions/${safeSegment(sessionId)}/${safeSegment(idempotencyKey)}.json`;
  const encryptedPacket = {
    schemaVersion: `${WRE_SCHEMA_VERSION}-encrypted-sync-packet`,
    receivedAt: now,
    workspaceId,
    sessionId,
    remoteClock,
    manifest,
    mutationSet,
    encryptedPayload,
  };
  const bodyText = JSON.stringify(encryptedPacket);
  const bodyHash = await sha256Hex(bodyText);
  const manifestHash = await sha256Hex(JSON.stringify(manifest));
  const mutationSummary = summarizeMutationSet(mutationSet);

  await env.WRE_SYNC_ARCHIVES.put(r2Key, bodyText, {
    httpMetadata: { contentType: "application/json" },
    customMetadata: {
      schemaVersion: WRE_SCHEMA_VERSION,
      workspaceId,
      sessionId,
      bodyHash,
    },
  });

  await env.WRE_SYNC_DB
    .prepare(
      `INSERT INTO sync_packet_manifest
       (id, workspace_id, session_id, idempotency_key, r2_key, manifest_hash, body_hash, byte_length, remote_clock, manifest_json, mutation_summary_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      packetId,
      workspaceId,
      sessionId,
      idempotencyKey,
      r2Key,
      manifestHash,
      bodyHash,
      new TextEncoder().encode(bodyText).byteLength,
      remoteClock,
      JSON.stringify(sanitizeManifest(manifest)),
      JSON.stringify(mutationSummary),
      now
    )
    .run();

  await env.WRE_SYNC_DB
    .prepare("UPDATE workspace SET remote_clock = ?, updated_at = ? WHERE id = ?")
    .bind(remoteClock, now, workspaceId)
    .run();

  await insertAuditEvent(env, workspaceId, "sync.push", {
    sessionId,
    packetId,
    idempotencyKey,
    remoteClock,
    bodyHash,
    byteLength: new TextEncoder().encode(bodyText).byteLength,
  });

  return jsonResponse(request, env, {
    status: "pushed",
    workspaceId,
    sessionId,
    remoteClock,
    manifest: {
      id: packetId,
      idempotencyKey,
      manifestHash,
      bodyHash,
      mutationSummary,
      createdAt: now,
    },
  });
}

async function pullSyncManifest(request: Request, env: Env, url: URL): Promise<Response> {
  const workspaceId = requireQuery(url, "workspaceId", 160);
  const sessionId = optionalQuery(url, "sessionId", 160);
  const workspace = await requireWorkspaceAuth(request, env, workspaceId);
  await enforceRateLimit(env, workspaceId);

  const manifests = await selectManifests(env, workspaceId, sessionId || undefined);
  const tombstones = await selectTombstones(env, workspaceId, sessionId || undefined);
  return jsonResponse(request, env, {
    status: "pulled-manifest",
    schemaVersion: WRE_SCHEMA_VERSION,
    workspaceId,
    sessionId: sessionId || null,
    remoteClock: numberFrom(workspace.remote_clock),
    manifests: manifests.map(manifestResponse),
    tombstones: tombstones.map(tombstoneResponse),
    mergePolicy: {
      defaultStrategy: "manual_merge",
      acceptsUnresolvedTension: true,
      clientMustDecrypt: true,
    },
  });
}

async function resolveSyncConflict(request: Request, env: Env): Promise<Response> {
  const body = await readJsonObject(request, env);
  const workspaceId = requireString(body, "workspaceId", 160);
  const sessionId = requireString(body, "sessionId", 160);
  const resolutionId = requireString(body, "resolutionId", 160);
  const strategy = requireString(body, "strategy", 80);
  const rationale = optionalString(body, "rationale", 5000);

  if (!VALID_RESOLUTION_STRATEGIES.has(strategy)) {
    throw new HttpError(400, "invalid_resolution_strategy", "Resolution strategy must be local_wins, remote_wins, manual_merge, or accept_tension.");
  }

  const workspace = await requireWorkspaceAuth(request, env, workspaceId);
  await enforceRateLimit(env, workspaceId);
  const remoteClock = numberFrom(workspace.remote_clock) + 1;
  const now = new Date().toISOString();

  await env.WRE_SYNC_DB
    .prepare("UPDATE workspace SET remote_clock = ?, updated_at = ? WHERE id = ?")
    .bind(remoteClock, now, workspaceId)
    .run();

  await insertAuditEvent(env, workspaceId, "sync.resolve", {
    sessionId,
    resolutionId,
    strategy,
    rationale,
    remoteClock,
    mergedManifest: isJsonObject(body.mergedManifest) ? body.mergedManifest : null,
  });

  return jsonResponse(request, env, {
    status: "resolved",
    workspaceId,
    sessionId,
    resolutionId,
    strategy,
    remoteClock,
  });
}

async function sessionManifest(request: Request, env: Env, url: URL, sessionId: string): Promise<Response> {
  const workspaceId = requireQuery(url, "workspaceId", 160);
  const workspace = await requireWorkspaceAuth(request, env, workspaceId);
  await enforceRateLimit(env, workspaceId);
  const manifests = await selectManifests(env, workspaceId, sessionId);

  return jsonResponse(request, env, {
    status: "session-manifest",
    workspaceId,
    sessionId,
    remoteClock: numberFrom(workspace.remote_clock),
    manifests: manifests.map(manifestResponse),
  });
}

async function deleteSession(request: Request, env: Env, url: URL, sessionId: string, ctx?: ExecutionContext): Promise<Response> {
  const workspaceId = requireQuery(url, "workspaceId", 160);
  const reason = optionalQuery(url, "reason", 240) || "user_requested_delete";
  const workspace = await requireWorkspaceAuth(request, env, workspaceId);
  await enforceRateLimit(env, workspaceId);

  const manifests = await selectManifests(env, workspaceId, sessionId);
  const now = new Date().toISOString();
  const remoteClock = numberFrom(workspace.remote_clock) + 1;
  const tombstoneId = `tmb_${crypto.randomUUID()}`;
  const deleteObjects = Promise.all(manifests.map((manifest) => env.WRE_SYNC_ARCHIVES.delete(manifest.r2_key)));
  if (ctx) {
    ctx.waitUntil(deleteObjects);
  } else {
    await deleteObjects;
  }

  await env.WRE_SYNC_DB
    .prepare(
      `INSERT INTO sync_tombstone (id, workspace_id, session_id, reason, remote_clock, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(tombstoneId, workspaceId, sessionId, reason, remoteClock, now)
    .run();

  await env.WRE_SYNC_DB
    .prepare("UPDATE workspace SET remote_clock = ?, updated_at = ? WHERE id = ?")
    .bind(remoteClock, now, workspaceId)
    .run();

  await insertAuditEvent(env, workspaceId, "session.delete", {
    sessionId,
    reason,
    remoteClock,
    deletedObjectCount: manifests.length,
  });

  return jsonResponse(request, env, {
    status: "deleted",
    workspaceId,
    sessionId,
    remoteClock,
    tombstone: {
      id: tombstoneId,
      reason,
      createdAt: now,
    },
  });
}

async function requireWorkspaceAuth(request: Request, env: Env, workspaceId: string): Promise<WorkspaceRow> {
  const workspace = await env.WRE_SYNC_DB
    .prepare("SELECT * FROM workspace WHERE id = ? AND deleted_at IS NULL LIMIT 1")
    .bind(workspaceId)
    .first<WorkspaceRow>();
  if (!workspace) {
    throw new HttpError(404, "workspace_not_found", "No active workspace matches that ID.");
  }

  const token = bearerToken(request);
  if (!token) {
    throw new HttpError(401, "missing_bearer_token", "A workspace sync token is required.");
  }

  const presentedHash = await sha256Hex(token);
  if (!constantTimeEqualHex(presentedHash, workspace.token_verifier_hash)) {
    throw new HttpError(403, "invalid_bearer_token", "The workspace sync token was rejected.");
  }

  return workspace;
}

async function enforceRateLimit(env: Env, workspaceId: string): Promise<void> {
  const limit = positiveInteger(env.RATE_LIMIT_PER_HOUR, DEFAULT_RATE_LIMIT_PER_HOUR);
  const bucket = new Date().toISOString().slice(0, 13);
  const id = `${workspaceId}:${bucket}`;
  const existing = await env.WRE_SYNC_DB
    .prepare("SELECT count FROM rate_limit_bucket WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ count: number }>();
  const nextCount = numberFrom(existing?.count) + 1;
  if (nextCount > limit) {
    throw new HttpError(429, "rate_limit_exceeded", "Workspace sync rate limit exceeded.");
  }

  const now = new Date().toISOString();
  if (existing) {
    await env.WRE_SYNC_DB
      .prepare("UPDATE rate_limit_bucket SET count = ?, updated_at = ? WHERE id = ?")
      .bind(nextCount, now, id)
      .run();
    return;
  }

  await env.WRE_SYNC_DB
    .prepare("INSERT INTO rate_limit_bucket (id, workspace_id, bucket, count, updated_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, workspaceId, bucket, nextCount, now)
    .run();
}

async function insertAuditEvent(env: Env, workspaceId: string, eventType: string, detail: JsonObject): Promise<void> {
  await env.WRE_SYNC_DB
    .prepare("INSERT INTO sync_audit_event (id, workspace_id, event_type, detail_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(`aud_${crypto.randomUUID()}`, workspaceId, eventType, JSON.stringify(detail), new Date().toISOString())
    .run();
}

async function selectManifests(env: Env, workspaceId: string, sessionId?: string): Promise<ManifestRow[]> {
  if (sessionId) {
    const result = await env.WRE_SYNC_DB
      .prepare(
        `SELECT * FROM sync_packet_manifest
         WHERE workspace_id = ? AND session_id = ?
         ORDER BY remote_clock DESC
         LIMIT 100`
      )
      .bind(workspaceId, sessionId)
      .all<ManifestRow>();
    return result.results || [];
  }

  const result = await env.WRE_SYNC_DB
    .prepare(
      `SELECT * FROM sync_packet_manifest
       WHERE workspace_id = ?
       ORDER BY remote_clock DESC
       LIMIT 100`
    )
    .bind(workspaceId)
    .all<ManifestRow>();
  return result.results || [];
}

async function selectTombstones(env: Env, workspaceId: string, sessionId?: string): Promise<TombstoneRow[]> {
  if (sessionId) {
    const result = await env.WRE_SYNC_DB
      .prepare(
        `SELECT * FROM sync_tombstone
         WHERE workspace_id = ? AND session_id = ?
         ORDER BY remote_clock DESC
         LIMIT 100`
      )
      .bind(workspaceId, sessionId)
      .all<TombstoneRow>();
    return result.results || [];
  }

  const result = await env.WRE_SYNC_DB
    .prepare(
      `SELECT * FROM sync_tombstone
       WHERE workspace_id = ?
       ORDER BY remote_clock DESC
       LIMIT 100`
    )
    .bind(workspaceId)
    .all<TombstoneRow>();
  return result.results || [];
}

async function readJsonObject(request: Request, env: Env): Promise<JsonObject> {
  const text = await readLimitedText(request, bodyLimitBytes(env));
  if (!text.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isJsonObject(parsed)) {
      throw new HttpError(400, "invalid_json_object", "Request body must be a JSON object.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_json", "Request body is not valid JSON.");
  }
}

async function readLimitedText(request: Request, limitBytes: number): Promise<string> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > limitBytes) {
    throw new HttpError(413, "body_too_large", `Request body exceeds ${limitBytes} bytes.`);
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > limitBytes) {
      throw new HttpError(413, "body_too_large", `Request body exceeds ${limitBytes} bytes.`);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function validateEncryptedPayload(value: JsonObject): void {
  for (const field of ["ciphertext", "iv", "salt"]) {
    if (typeof value[field] !== "string" || !String(value[field]).trim()) {
      throw new HttpError(400, "invalid_encrypted_payload", `encryptedPayload.${field} is required.`);
    }
  }
}

function sanitizeManifest(manifest: JsonObject): JsonObject {
  return {
    schemaVersion: String(manifest.schemaVersion || WRE_SCHEMA_VERSION),
    sessionId: stringOrNull(manifest.sessionId),
    idempotencyKey: stringOrNull(manifest.idempotencyKey),
    vectorClock: isJsonObject(manifest.vectorClock) ? manifest.vectorClock : undefined,
    hashes: isJsonObject(manifest.hashes) ? manifest.hashes : undefined,
    readiness: isJsonObject(manifest.readiness) ? manifest.readiness : undefined,
    conflictPolicy: isJsonObject(manifest.conflictPolicy) ? manifest.conflictPolicy : undefined,
  };
}

function summarizeMutationSet(mutationSet: JsonObject): JsonObject {
  const summary: JsonObject = {};
  for (const key of ["claims", "relations", "conflicts", "constraints", "revisions", "analysisRuns"]) {
    const value = mutationSet[key];
    if (Array.isArray(value)) summary[`${key}Count`] = value.length;
    if (isJsonObject(value)) summary[`${key}Hash`] = stringOrNull(value.hash);
  }
  return summary;
}

function manifestResponse(row: ManifestRow): JsonObject {
  return {
    id: row.id,
    sessionId: row.session_id,
    idempotencyKey: row.idempotency_key,
    manifestHash: row.manifest_hash,
    bodyHash: row.body_hash,
    byteLength: numberFrom(row.byte_length),
    remoteClock: numberFrom(row.remote_clock),
    createdAt: row.created_at,
    manifest: parseJsonObject(row.manifest_json),
    mutationSummary: parseJsonObject(row.mutation_summary_json),
  };
}

function tombstoneResponse(row: TombstoneRow): JsonObject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sessionId: row.session_id,
    reason: row.reason,
    remoteClock: numberFrom(row.remote_clock),
    createdAt: row.created_at,
  };
}

function parseJsonObject(value: string): JsonObject {
  try {
    const parsed: unknown = JSON.parse(value);
    return isJsonObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function requireString(body: JsonObject, field: string, maxLength: number): string {
  const value = body[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "missing_field", `${field} is required.`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, "field_too_long", `${field} must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

function optionalString(body: JsonObject, field: string, maxLength: number): string | null {
  const value = body[field];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_field", `${field} must be a string.`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, "field_too_long", `${field} must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

function requireObject(body: JsonObject, field: string): JsonObject {
  const value = body[field];
  if (!isJsonObject(value)) {
    throw new HttpError(400, "missing_object", `${field} must be a JSON object.`);
  }
  return value;
}

function requireQuery(url: URL, field: string, maxLength: number): string {
  const value = optionalQuery(url, field, maxLength);
  if (!value) throw new HttpError(400, "missing_query", `${field} query parameter is required.`);
  return value;
}

function optionalQuery(url: URL, field: string, maxLength: number): string | null {
  const value = url.searchParams.get(field);
  if (!value) return null;
  if (value.length > maxLength) {
    throw new HttpError(400, "query_too_long", `${field} must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqualHex(left: string, right: string): boolean {
  if (!HEX_64_RE.test(left) || !HEX_64_RE.test(right)) return false;
  const leftBytes = hexToBytes(left);
  const rightBytes = hexToBytes(right);
  let diff = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < Math.max(leftBytes.length, rightBytes.length); index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }
  return diff === 0;
}

function hexToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 160);
}

function stringOrNull(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberFrom(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function bodyLimitBytes(env: Env): number {
  return positiveInteger(env.BODY_LIMIT_BYTES, DEFAULT_BODY_LIMIT_BYTES);
}

function jsonResponse(request: Request, env: Env, body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function errorResponse(request: Request, env: Env, error: unknown): Response {
  const httpError = error instanceof HttpError
    ? error
    : new HttpError(500, "internal_error", "WRE sync Worker failed unexpectedly.");
  if (httpError.status >= 500) {
    console.error(JSON.stringify({
      level: "error",
      code: httpError.code,
      message: httpError.message,
      path: new URL(request.url).pathname,
    }));
  }
  return jsonResponse(request, env, {
    status: "error",
    error: httpError.code,
    message: httpError.message,
  }, httpError.status);
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowedOrigins = new Set(
    (env.ALLOWED_ORIGINS || "https://normativity.org,https://www.normativity.org,http://127.0.0.1:4173,http://localhost:4173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = allowedOrigins.has(origin) ? origin : [...allowedOrigins][0] || "https://normativity.org";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
