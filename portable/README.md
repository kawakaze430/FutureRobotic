# FutureRobotic AI portable application — Build 02

The portable Node/PostgreSQL application now includes public OAuth/OTP adapters, account services, streaming AI/chat, revisions/shares, merchant contracts, S3/SES/SQS adapters and a standalone browser frontend. See `../ops/README.md` for configuration, verification and the ordered AWS release procedure. The owner-private Sites preview still uses its Worker/browser storage; it does not run this Node/database backend.

Production deployment, real provider/login/email/payment tests, Docker/native contention and five-runtime isolation remain blocked by the recorded environment/account gates. Startup and release checks fail closed until configured. `docs/release/BUILD02_REPORT.md` lists the implemented scope and remaining engineering work. Source is not a claim of production readiness.

## Run the verified local suite

From the repository root, use Node 22.13+ and the locked pnpm version in package.json.

```sh
pnpm install --frozen-lockfile
pnpm api:build
pnpm api:test
node tests/tools.test.mjs
```

Without TEST_DATABASE_URL, tests use persistent PGlite (PostgreSQL compiled to WASM). This exercises SQL, constraints, migrations, rollback, persistence and application-level request races. PGlite serializes database transactions. It **does not prove native multi-connection locking, deadlock behavior, connection-pool sizing or RDS operation**.

Run the same suite on a Docker host:

```sh
node portable/scripts/test-native.mjs
```

This creates a disposable loopback-only PostgreSQL 16 container, generates a temporary password in memory, runs the tests using a 20-connection pool, and removes its container. It does not print or save the password. Alternatively inject TEST_DATABASE_URL for a disposable database. The suite creates and drops a unique schema; never point it at production.

## Run the local API

Inject DATABASE_URL through your shell or secret manager, set APP_ORIGIN to the exact frontend origin, and run:

```sh
pnpm api:build
pnpm api:migrate
pnpm api:start
```

The API binds 127.0.0.1:3001 by default. PORT and HOST are configurable. Local object storage defaults to ignored portable/.data/objects. GET /health and /ready are public and contain no credentials. GET /openapi.json returns the registered contract.

There is no public test login, identity-claim endpoint, billing-event injection endpoint or operator backdoor. The integration suite creates verified fixtures directly through internal services. OAuth/OTP adapters must verify provider evidence before calling IdentityService and setting the session and CSRF cookies. Never trust a client-supplied email_verified flag or the Sites-specific identity header on this public backend.

No AI provider is configured in this build. The local worker fails such runs with PROVIDER_NOT_CONFIGURED and releases the hold. Provider tests use explicit test doubles. No live inference, email, OAuth, checkout, refund or AWS operation was performed.

## Source map

| File | Responsibility |
| --- | --- |
| migrations/001_core.sql | Users, workspaces, sessions, runs, chats, files, shares, billing, allowance ledger and durable jobs |
| migrations/002_query_indexes.sql | Forward-only query and retention indexes |
| src/migrate.ts | Transactional migration lock and historical checksum verification |
| src/db.ts | Bounded pg pool and one-client transactions |
| src/identity.ts | Verified identity linking, hashed opaque sessions, rotation and revocation |
| src/quota.ts | Once-only grants, row-locked reservations, settlement, release and shared limit leases |
| src/jobs.ts | Transactional outbox, leases, retries, backoff and dead letters |
| src/runs.ts | Idempotent dispatch records, cancellation, history pagination and optimistic notes |
| src/content.ts | Tenant-scoped chats, text files, lifecycle locks, shares and trusted context construction |
| src/billing.ts | Trusted event inbox, replay protection, event ordering and once-per-period grants |
| src/lifecycle.ts | Export, deletion, retention, reconciliation and deduplicated schedules |
| src/worker.ts | Provider dispatch fence, deadlines, heartbeat and conservative uncertain outcomes |
| src/api.ts | Fastify routes, validation, cookies/CSRF, safe errors and OpenAPI |
| src/client.ts | Browser-safe typed run transport |
| tests/integration.test.ts | Shared WASM/native PostgreSQL integration suite |

## Accounting and retries

Run creation, quota reservation and the dispatch job commit in one transaction. An idempotency key is scoped to a workspace and tied to a canonical request hash. Reusing the key with changed content returns 409. The ledger and audit records reject UPDATE and DELETE. Never repair balances by editing ledger history.

Unsent cancellation releases a hold. Successful accepted work settles once, even if cancellation was requested while it was running. A rejected request confirmed by the provider adapter releases the hold. Timeout, process death after the dispatch fence, or unknown provider acceptance produces an `uncertain` run and keeps the reservation. It is never blindly sent again. A future provider reconciliation adapter/operator workflow must establish its actual outcome before charging or releasing it.

BillingService accepts only an already signature-verified server event. Build 02 adds raw Paddle signatures, bound checkout intents and a hosted customer portal adapter. Plan changes, annual monthly grants, refunds and actual merchant integration remain incomplete. The sample plan allowances follow the reference inventory; owner approval and cost modeling are still required.

## Data retention and deletion

The provisional source/result retention is 30 days. Exports expire after one day. Shares expire after seven days. These are implementation defaults awaiting owner approval, not a published legal promise. Cleanup redacts expired terminal run source, instructions, results and notes. Staged files older than one hour are queued for object deletion. Standalone chat retention and paid-plan retention policy remain open.

Account deletion immediately revokes sessions, then removes linked identities, profile data, file text, notes, chats, results and source content. Files become deletion tombstones and their objects are removed through retryable jobs. Minimal ledger, audit, subscription and event records remain for accounting/reconciliation. Final legal retention, backup expiry, provider-side deletion and S3/RDS backup lifecycle remain release gates. No paid subscription is cancelled by this local deletion job; merchant cancellation must be integrated before production.

## Remaining integration work

- Verify actual account browser flows, native PostgreSQL contention, S3/SES/SQS and private AWS connectivity.
- Complete file capacity/revision UI, account/local data migration, message pagination and full OpenAPI response contracts.
- Complete public anonymous dispatch integration, authoritative provider reconciliation and per-user paid Standard fair-use rules.
- Complete annual monthly allowance scheduling, proration/refund/country policies, merchant reconciliation and subscription deletion handling.
- Build/scan the runner host/image, execute isolated resource/network/residue probes and verify fleet drain/recovery.
- Run the protected CI/rollout, real AI/OAuth/email/payment, load/failover/restore/incident and regional release gates.

See docs/release/BUILD02_REPORT.md, FEATURE_STATUS.json and ../ops/README.md for task evidence, owner blockers and the release sequence.
