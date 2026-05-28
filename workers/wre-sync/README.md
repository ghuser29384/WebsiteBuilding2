# Normativity WRE Sync Worker

Cloudflare Worker backend for WRE5 encrypted sync. D1 stores workspace metadata, idempotency keys, vector-clock manifests, tombstones, and audit events. R2 stores only opaque encrypted packet bodies produced by the browser.

WRE5 treats browser IndexedDB as the canonical store. This Worker remains the low-cost optional edge sync path for encrypted local packets and export artifacts.

## Local Setup

1. Create Cloudflare resources:
   - `wrangler d1 create normativity-wre-sync`
   - `wrangler r2 bucket create normativity-wre-sync-archives`
2. Replace the placeholder `database_id` in `wrangler.jsonc`.
3. Run migrations:
   - `wrangler d1 migrations apply normativity-wre-sync --local`
   - `wrangler d1 migrations apply normativity-wre-sync --remote`
4. Generate binding types after resources exist:
   - `npm run cf-typegen`
5. Run locally:
   - `npm run dev`

The browser WRE tool sends only a SHA-256 token verifier on workspace creation. The raw sync token and the archive passphrase stay client-side.
