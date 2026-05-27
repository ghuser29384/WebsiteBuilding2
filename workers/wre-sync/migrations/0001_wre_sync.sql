PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspace (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token_verifier_hash TEXT NOT NULL CHECK (length(token_verifier_hash) = 64),
  privacy_mode TEXT NOT NULL CHECK (privacy_mode IN ('encrypted_sync', 'private_link', 'workspace')),
  retention_policy TEXT NOT NULL,
  remote_clock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_packet_manifest (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  remote_clock INTEGER NOT NULL,
  manifest_json TEXT NOT NULL,
  mutation_summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspace(id),
  UNIQUE (workspace_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS sync_packet_manifest_workspace_clock_idx
  ON sync_packet_manifest (workspace_id, remote_clock DESC);

CREATE INDEX IF NOT EXISTS sync_packet_manifest_session_idx
  ON sync_packet_manifest (workspace_id, session_id, remote_clock DESC);

CREATE TABLE IF NOT EXISTS sync_tombstone (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  remote_clock INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

CREATE INDEX IF NOT EXISTS sync_tombstone_workspace_idx
  ON sync_tombstone (workspace_id, session_id, remote_clock DESC);

CREATE TABLE IF NOT EXISTS sync_audit_event (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

CREATE INDEX IF NOT EXISTS sync_audit_event_workspace_idx
  ON sync_audit_event (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limit_bucket (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  bucket TEXT NOT NULL,
  count INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
