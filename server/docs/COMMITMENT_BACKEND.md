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
COMMITMENT_JWS_SECRET="replace-with-a-high-entropy-secret"
COMMITMENT_JWS_KEY_ID="local-dev-key"
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

## Audit and Timestamping

Every commitment write route inserts a domain record and an `AuditEvent` in the same transaction.
Audit event payloads are canonicalized, SHA-256 hashed, and signed as JWS.

Create Merkle checkpoints manually:

```bash
npm run prisma:checkpoint
```

Or enable the interval job:

```bash
COMMITMENT_JOBS=true npm run dev
```

TSA timestamping is disabled unless `TSA_URL` is set. When configured, the service submits Merkle root
digests as RFC 3161 timestamp queries using `openssl ts`, stores the DER response, and verifies it when
`TSA_CA_FILE` is provided.
