import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest, sha256Hex } from "../src/index.ts";

test("health exposes storage readiness", async () => {
  const env = makeEnv();
  const response = await handleRequest(new Request("http://worker.test/health"), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.equal(body.storage.d1, true);
  assert.equal(body.storage.r2, true);
});

test("workspace creation stores a token verifier without returning the token", async () => {
  const env = makeEnv();
  const token = "client-only-token";
  const response = await jsonRequest(env, "/v1/workspaces", {
    sessionId: "sess_test",
    privacyMode: "encrypted_sync",
    retentionPolicy: "until-deleted",
    tokenVerifierHash: await sha256Hex(token),
    schemaVersion: "wre-5",
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.match(body.workspaceId, /^wsp_/);
  assert.equal(JSON.stringify(body).includes(token), false);
});

test("push rejects missing bearer token and accepts idempotent encrypted packets", async () => {
  const env = makeEnv();
  const token = "sync-token";
  const workspace = await createWorkspace(env, token);
  const payload = syncPayload(workspace.workspaceId);

  const unauthenticated = await jsonRequest(env, "/v1/sync/push", payload);
  assert.equal(unauthenticated.status, 401);

  const pushed = await jsonRequest(env, "/v1/sync/push", payload, token);
  assert.equal(pushed.status, 200);
  const pushedBody = await pushed.json();
  assert.equal(pushedBody.status, "pushed");
  assert.equal(pushedBody.remoteClock, 1);
  assert.equal(env.WRE_SYNC_ARCHIVES.objects.size, 1);

  const duplicate = await jsonRequest(env, "/v1/sync/push", payload, token);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.status, "duplicate");
  assert.equal(duplicateBody.remoteClock, 1);
  assert.equal(env.WRE_SYNC_ARCHIVES.objects.size, 1);
});

test("pull, manifest, resolve, and delete return metadata only", async () => {
  const env = makeEnv();
  const token = "sync-token";
  const workspace = await createWorkspace(env, token);
  await jsonRequest(env, "/v1/sync/push", syncPayload(workspace.workspaceId), token);

  const pull = await getRequest(env, `/v1/sync/pull?workspaceId=${workspace.workspaceId}&sessionId=sess_test`, token);
  assert.equal(pull.status, 200);
  const pullBody = await pull.json();
  assert.equal(pullBody.manifests.length, 1);
  assert.equal(JSON.stringify(pullBody).includes("encryptedPayload"), false);

  const manifest = await getRequest(env, `/v1/sessions/sess_test/manifest?workspaceId=${workspace.workspaceId}`, token);
  assert.equal(manifest.status, 200);
  assert.equal((await manifest.json()).manifests.length, 1);

  const resolved = await jsonRequest(env, "/v1/sync/resolve", {
    workspaceId: workspace.workspaceId,
    sessionId: "sess_test",
    resolutionId: "res_1",
    strategy: "accept_tension",
    rationale: "The unresolved tension is intentionally preserved for review.",
  }, token);
  assert.equal((await resolved.json()).status, "resolved");

  const deleted = await handleRequest(new Request(`http://worker.test/v1/sessions/sess_test?workspaceId=${workspace.workspaceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }), env);
  assert.equal(deleted.status, 200);
  assert.equal(env.WRE_SYNC_ARCHIVES.objects.size, 0);
});

async function createWorkspace(env, token) {
  const response = await jsonRequest(env, "/v1/workspaces", {
    sessionId: "sess_test",
    privacyMode: "encrypted_sync",
    retentionPolicy: "until-deleted",
    tokenVerifierHash: await sha256Hex(token),
    schemaVersion: "wre-5",
  });
  return response.json();
}

function syncPayload(workspaceId) {
  return {
    schemaVersion: "wre-5-encrypted-sync-push",
    workspaceId,
    sessionId: "sess_test",
    idempotencyKey: "idem_1",
    manifest: {
      schemaVersion: "wre-5-sync-packet",
      sessionId: "sess_test",
      idempotencyKey: "idem_1",
      hashes: { claims: "abc123" },
      readiness: { status: "ready" },
    },
    mutationSet: {
      claims: [{ id: "J1" }],
      relations: [],
      conflicts: [],
      revisions: [],
    },
    encryptedPayload: {
      salt: "base64-salt",
      iv: "base64-iv",
      ciphertext: "base64-ciphertext",
    },
  };
}

function jsonRequest(env, path, body, token) {
  return handleRequest(new Request(`http://worker.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }), env);
}

function getRequest(env, path, token) {
  return handleRequest(new Request(`http://worker.test${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }), env);
}

function makeEnv() {
  return {
    WRE_SYNC_DB: new FakeD1(),
    WRE_SYNC_ARCHIVES: new FakeR2(),
    ALLOWED_ORIGINS: "http://localhost:4173,http://worker.test",
    BODY_LIMIT_BYTES: "262144",
    RATE_LIMIT_PER_HOUR: "60",
  };
}

class FakeR2 {
  objects = new Map();

  async put(key, value) {
    this.objects.set(key, value);
  }

  async delete(key) {
    this.objects.delete(key);
  }
}

class FakeD1 {
  workspaces = new Map();
  manifests = [];
  tombstones = [];
  audits = [];
  rateLimits = new Map();

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, " ").trim();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    if (this.sql.startsWith("SELECT * FROM workspace")) {
      return this.db.workspaces.get(this.values[0]) || null;
    }
    if (this.sql.startsWith("SELECT * FROM sync_packet_manifest")) {
      return this.db.manifests.find((row) => row.workspace_id === this.values[0] && row.idempotency_key === this.values[1]) || null;
    }
    if (this.sql.startsWith("SELECT count FROM rate_limit_bucket")) {
      return this.db.rateLimits.get(this.values[0]) || null;
    }
    return null;
  }

  async all() {
    if (this.sql.includes("FROM sync_packet_manifest")) {
      const [workspaceId, sessionId] = this.values;
      const rows = this.db.manifests
        .filter((row) => row.workspace_id === workspaceId && (!sessionId || row.session_id === sessionId))
        .sort((left, right) => right.remote_clock - left.remote_clock);
      return { results: rows };
    }
    if (this.sql.includes("FROM sync_tombstone")) {
      const [workspaceId, sessionId] = this.values;
      const rows = this.db.tombstones
        .filter((row) => row.workspace_id === workspaceId && (!sessionId || row.session_id === sessionId))
        .sort((left, right) => right.remote_clock - left.remote_clock);
      return { results: rows };
    }
    return { results: [] };
  }

  async run() {
    if (this.sql.startsWith("INSERT INTO workspace")) {
      const [id, session_id, token_verifier_hash, privacy_mode, retention_policy, created_at, updated_at] = this.values;
      this.db.workspaces.set(id, {
        id,
        session_id,
        token_verifier_hash,
        privacy_mode,
        retention_policy,
        remote_clock: 0,
        created_at,
        updated_at,
        deleted_at: null,
      });
    } else if (this.sql.startsWith("INSERT INTO sync_packet_manifest")) {
      const [
        id,
        workspace_id,
        session_id,
        idempotency_key,
        r2_key,
        manifest_hash,
        body_hash,
        byte_length,
        remote_clock,
        manifest_json,
        mutation_summary_json,
        created_at,
      ] = this.values;
      this.db.manifests.push({
        id,
        workspace_id,
        session_id,
        idempotency_key,
        r2_key,
        manifest_hash,
        body_hash,
        byte_length,
        remote_clock,
        manifest_json,
        mutation_summary_json,
        created_at,
      });
    } else if (this.sql.startsWith("UPDATE workspace SET remote_clock")) {
      const [remote_clock, updated_at, id] = this.values;
      const workspace = this.db.workspaces.get(id);
      this.db.workspaces.set(id, { ...workspace, remote_clock, updated_at });
    } else if (this.sql.startsWith("INSERT INTO sync_tombstone")) {
      const [id, workspace_id, session_id, reason, remote_clock, created_at] = this.values;
      this.db.tombstones.push({ id, workspace_id, session_id, reason, remote_clock, created_at });
    } else if (this.sql.startsWith("INSERT INTO sync_audit_event")) {
      const [id, workspace_id, event_type, detail_json, created_at] = this.values;
      this.db.audits.push({ id, workspace_id, event_type, detail_json, created_at });
    } else if (this.sql.startsWith("INSERT INTO rate_limit_bucket")) {
      const [id, workspace_id, bucket, count, updated_at] = this.values;
      this.db.rateLimits.set(id, { id, workspace_id, bucket, count, updated_at });
    } else if (this.sql.startsWith("UPDATE rate_limit_bucket")) {
      const [count, updated_at, id] = this.values;
      const bucket = this.db.rateLimits.get(id);
      this.db.rateLimits.set(id, { ...bucket, count, updated_at });
    }
    return { success: true };
  }
}
