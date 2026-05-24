# Commitment Operations

## Production Readiness Checks

Use the reviewer console on `index.html#commitment-admin` with an admin-authenticated Supabase account. It checks:

- pending proof submissions
- open disputes and revocations
- latest audit event
- latest Merkle checkpoint
- whether proof storage, JWS signing, TSA, and structured logs are configured

## TSA Configuration

Timestamping is enabled only when `TSA_URL` is set. The cron at `/api/cron/commitment-audit` creates Merkle checkpoints and submits untimestamped roots to the RFC 3161 TSA.

Set these in Vercel Production and Preview:

- `TSA_URL`: RFC 3161 timestamp endpoint
- `TSA_CA_PEM` or `TSA_CA_FILE`: certificate authority used to verify returned timestamp tokens
- `TSA_CERT_FINGERPRINT`: optional certificate fingerprint recorded with the timestamp row

The system timestamps Merkle roots, not individual private records.

## Live E2E Flow

1. Sign in through Supabase auth.
2. Sign the Normativity pledge.
3. Create a deliberation commitment.
4. Reserve with an opposing participant account.
5. Submit a sealed belief state.
6. Confirm commitments activate only when that same user's post-session credence is greater than `0.50`.
7. Upload proof.
8. Request review/revocation.
9. Export the commitment audit package from the action ledger.
10. Load the reviewer console with an admin account and resolve proof/dispute items.
