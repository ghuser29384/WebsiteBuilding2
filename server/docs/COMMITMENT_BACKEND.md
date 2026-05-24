# Commitment Backend

This server module implements the Normativity one-on-one deliberation commitment backend.

## Setup

1. Install dependencies from `server/`.

```bash
npm install
```

2. Configure Postgres in `server/.env`.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/normativity?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/normativity?schema=public"
COMMITMENT_JWS_SECRET="replace-with-a-high-entropy-secret"
COMMITMENT_JWS_KEY_ID="local-dev-key"
AUTH_JWT_SECRET="local-or-provider-jwt-secret"
ALLOW_DEVELOPMENT_AUTH_HEADERS="true"
```

3. Generate Prisma and apply the commitment migration.

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the API.

```bash
npm run dev
```

The browser app calls `http://localhost:3001/api/commitments` by default. To override it, set
`window.NORMATIVITY_COMMITMENT_API_BASE` before loading `conviction.js`.

On Vercel, the root `api/commitments/*` functions load this Express app directly, and the root
`postinstall` script runs `prisma generate --schema server/prisma/schema.prisma`.

## Auth

Commitment write routes never accept `userId` from the JSON body. In local development, the API can
accept the existing app session headers when `ALLOW_DEVELOPMENT_AUTH_HEADERS=true`. In production,
configure one of:

```bash
AUTH_JWKS_URL="https://issuer.example/.well-known/jwks.json"
AUTH_JWT_ISSUER="https://issuer.example/"
AUTH_JWT_AUDIENCE="normativity"
```

or:

```bash
AUTH_JWT_SECRET="your-provider-jwt-signing-secret"
```

Then have the browser auth layer expose `window.NormativityAuth.getAccessToken()` so the commitment
client can send `Authorization: Bearer <token>`.

## Proof Storage

Proof files are private by default. If Supabase Storage is configured, the API reserves signed upload
URLs and stores only proof metadata, a storage key, and a content hash in Postgres:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_PROOF_BUCKET="commitment-proofs"
SUPABASE_PROOF_UPLOAD_EXPIRES_IN="900"
```

## Audit and Timestamping

Every commitment write route inserts a domain record and an `AuditEvent` in the same transaction.
Audit event payloads are canonicalized, SHA-256 hashed, and signed as JWS. The database migration also
adds triggers that reject updates and deletes on `AuditEvent`, making audit rows append-only.

Create Merkle checkpoints manually:

```bash
npm run prisma:checkpoint
```

Or enable the interval job:

```bash
COMMITMENT_JOBS=true npm run dev
```

On Vercel, `vercel.json` invokes `/api/cron/commitment-audit` daily. Set `CRON_SECRET` in Vercel so
cron requests are authenticated. Pro deployments can change the schedule to `*/5 * * * *` for
five-minute checkpointing.

TSA timestamping is disabled unless `TSA_URL` is set. When configured, the service submits Merkle root
digests as RFC 3161 timestamp queries using `openssl ts`, stores the DER response, and verifies it when
`TSA_CA_FILE` or `TSA_CA_PEM` is provided.
