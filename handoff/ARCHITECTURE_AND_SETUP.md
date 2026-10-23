# Architecture, setup and AWS continuation

This describes Build03 source at `76dda7b040a95e96c529073240056678d9f12ba4`. Prepared configuration is not an applied AWS environment. Historical PLAN-01 architecture proposals may differ from the actual code below.

## Current source map

| Path | Actual responsibility |
| --- | --- |
| `app/future-app.tsx`, `app/signed-workspace.css` | Main workspace, tools, account/file/history interactions and layout |
| `app/reference-home.tsx`, `app/reference.css` | Public reference-style marketing experience |
| `app/studio-editor.tsx`, `app/result-reading.tsx` | Source editor and safe result/diff reading controls |
| `app/` route files and `lib/` | Public pages, language registries, local tools, safety/format helpers and current Worker-side adapter |
| `portable/web/` | Vite entry and Nginx browser-serving configuration for the portable deployment |
| `portable/src/api.ts`, `product-routes.ts`, `client.ts` | Fastify API, account/product endpoints and browser transport; full response typing remains partial |
| `identity.ts`, `public-auth.ts`, `account-services.ts` | Verified identity/session/auth adapters, profile/preferences and account features |
| `db.ts`, `migrate.ts`, `portable/migrations/001`–`004` | PostgreSQL pool/transactions and immutable migration chain |
| `runs.ts`, `content.ts`, `file-capacity.ts` | Owned runs/results/notes/context, files/chats/shares and quota-capacity locking |
| `quota.ts`, `credit-period.ts`, `billing.ts`, `merchant.ts` | Reservations/ledger/month windows and trusted merchant lifecycle |
| `jobs.ts`, `worker.ts`, `lifecycle.ts` | Transactional outbox, fenced dispatch, leases, export/deletion/retention and reconciliation scaffolding |
| `provider.ts`, `tool-instructions.ts`, `product-policy.ts`, `protection.ts` | Provider/model/prompt/entitlement/budget/abuse/operator policies |
| `execution.ts`, `runner/` | Trusted dispatcher and separate signed isolated execution source |
| `infra/src/` | CDK application, edge and optional runner stacks for staging/production |
| `ops/` | Images, limited runtime-role bootstrap, OIDC, service rollout/rollback, probes and operating procedures |
| `.github/workflows/verify.yml`, `release.yml` | Verification and controlled updates to existing ECS services |
| `portable/tests/`, `tests/`, `runner/tests/`, `infra/tests/` | Application, UI/export/grammar, runner policy/native probes and offline infrastructure tests |

Consult actual filenames in the checkout if a row groups related modules. Do not move the project into an invented monorepo layout just because a historical plan suggested one.

## Persistence and invariants

The database models users, verified identities, opaque hashed sessions, personal workspaces, plans/prices/subscriptions, billing events, grants/reservations/append-only ledger, tool runs/result versions/notes, chats/messages, files/revisions, shares, durable jobs and audit records. Later migrations add OAuth/OTP abuse state, MFA operators, support tickets, runtime/spend controls, anonymous counters, event streams/context snapshots, quarantine, checkout bindings, payment adjustments and execution jobs.

- Authenticate public portable requests independently of Sites. A forged Sites identity header must never establish a portable account.
- Bind records and queries to both workspace and owner; retain two-account negative fixtures.
- Mutating cookie-authenticated requests require the configured Origin and CSRF binding. Rotate/revoke sessions and require verified provider evidence for linking.
- Commit run, reservation and outbox atomically. Use workspace-scoped idempotency keys tied to a canonical request hash.
- Preserve immutable ledger/audit history and optimistic result/note/file versions. Correct through new audited events, not history edits.
- Keep user source, instructions and file context untrusted. The server chooses trusted roles and static tool instructions; no arbitrary model tool authority is exposed.
- Freeze owned file revision/checksum and disclose context truncation. File deletion must remove derived snapshots, evaluation content and shares as required.
- Keep uncertain provider/execution/payment acceptance fenced for authoritative reconciliation. Retrying delivery must not redispatch external work.
- Test migration owner and restricted runtime role separately; serving tasks must not own schema changes or operator enrollment.

## Local installation and available checks

Requirements from current source: Node >=22.13.0 and pnpm 11.25.0. Use the lockfile. Install only when the next environment lacks dependencies or dependency inputs changed.

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm api:build
TEST_DATABASE_URL= pnpm api:test
pnpm test:ui
pnpm runner:test
node tests/tools.test.mjs
pnpm web:build
pnpm infra:build
INFRA_SYNTH_ONLY=true pnpm infra:synth
pnpm infra:test
```

The `TEST_DATABASE_URL=` form is for a POSIX shell and deliberately selects local PGlite. Use the equivalent empty child-process variable in another shell. Do not clear or overwrite unrelated owner configuration. Infrastructure synthesis above uses an unapproved local fixture and writes templates only.

For the current Sites preview, use its environment's supported Sites build/preview workflow. For AWS frontend work, use `web:build`; it creates the portable static output. Do not assume another model/provider has the current managed preview tools or permission to change its audience.

## Native database, containers and runner

```bash
pnpm api:test:native
```

This wrapper requires a working Docker daemon even when `TEST_DATABASE_URL` is supplied. It creates/removes a disposable PostgreSQL 16 container. **Known source gap:** it currently selects integration/product/operations tests and must be extended to include `completion.test.js`. The regular `api:test` command includes every compiled `.test.js` suite.

Alternatively, inject a protected `TEST_DATABASE_URL` for a deliberately disposable native database and run the regular backend suite. The harness creates/drops test schemas and manipulates test data. This is not a production database probe. Native connection/concurrency/role/failure coverage must still match acceptance; a passing serialized WASM race fixture is insufficient.

Build both portable Dockerfiles and run the Compose smoke on the Docker-capable host. `portable/compose.yml` requires a generated `LOCAL_DB_PASSWORD` passed through the process environment and serves loopback port 8080. It supplies development database/migration/API/web wiring, not an identity bypass or live provider setup. Review teardown/volumes before deleting test data.

Only run `runner/tests/native-probes.mjs` against the approved isolated TLS gateway using protected test signing material. The app worker keeps the private signing key, the gateway verifies with its public key, and the job must receive no credentials/network/host control. Verify actual CPU/memory/process/output/disk/time/egress/metadata/residue behavior for all five languages. Local policy assertions cannot establish these properties.

## Protected integration configuration

These are variable names, not supplied credentials. Read `portable/src/config.ts`, `server.ts` and the task definitions for the exact current contract. Keep values in protected configuration, never in browser bundles or this handoff.

| Group | Inputs / decisions |
| --- | --- |
| Database | `DB_HOSTNAME`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_POOL_MAX`; production CA configuration |
| Application/session | `APP_ORIGIN`, `APP_ENCRYPTION_KEY`, `AUTH_HASH_SECRET`, reviewed production startup configuration |
| Identity/sender | Google/GitHub client IDs/secrets, exact callback URLs, `SES_FROM_EMAIL`, Turnstile site key/secret; verified domain and sender access |
| Objects/async | Private S3 bucket/KMS key and task role; SQS notification and scheduler configuration |
| AI/chat | `AI_HTTP_ENDPOINT`, `AI_HTTP_API_KEY`, `AI_MODELS_JSON`, approved retention, input/output price inputs, quota and spending policy |
| Merchant | `PADDLE_MODE`, protected API/webhook secrets, `PADDLE_PRICE_IDS_JSON`, approved countries and billing-release decision |
| Runner | `RUNNER_ENDPOINT`, worker-only signing key, approved gateway/fleet public verification key and measured image catalog |
| Delivery | AWS role/OIDC trust, account/regions, DNS zone/domain, budget/alerts, repository/protected environments, exact image digests and measured gate evidence |

All fields expected by the imported secret documents/task definitions must be present, including deliberate disabled-option values. Never put the database migration-owner credential in a serving task or give the browser AI/merchant/session encryption secrets. The provider-neutral adapter does not require the declined OpenAI Developers plugin.

## AWS topology prepared in source

Each of staging and production has an application stack and edge stack, with an optional separate runner stack. Six offline fixture stacks therefore do not mean six production regions. The app stack prepares private service/database networking, trusted ECS web/API/worker tasks, private ALB, private RDS PostgreSQL, S3/KMS, queues, sender identity, backups, scaling/budgets and scoped CI roles. Edge source prepares CloudFront/private origin, HTTPS/DNS and WAF. Runner source prepares a separate VPC/private gateway/zero-default worker fleet.

The offline fixture uses `ap-south-1` for the application and `us-east-1` for edge resources. These are fixture values, not the owner's selected production region or an availability guarantee. Check real service/account/region support and cost before application. Global CDN access does not by itself establish worldwide merchant/provider eligibility, regional resilience or measured latency.

## Deployment sequence and unfinished orchestration

1. Select actual account, scoped initial deployment role, owner repository/OIDC trust, regions, budget, domain/sender, models/merchant and approved initial countries/policies.
2. Prepare a reviewed external copy of `ops/release.config.example.json`. Reject placeholders, `.invalid` domains, zero fixture digests and unapproved flags. Do not use offline synth fixtures for deployment.
3. Finish and review initial bootstrap: retained ECR repositories, first immutable scanned application images, complete Secrets Manager documents, private migration task, runtime-role grants and health dependency order. The current all-in-one app stack and existing release workflow do not automatically solve the first-image/first-migration bootstrapping dependency.
4. Use the authorized infrastructure role for reviewed staging change sets. Keep production retained resources and budgets protected. Record actual outputs privately.
5. Migrate via a reviewed one-off private task using the migration owner; provision/test the restricted serving role. Deploy exact API/worker/web digests and verify health.
6. Establish the actual CloudFront/private-ALB path, tighten the managed-origin security-group rule, verify trusted proxy hops/client IP, cache separation, DNS/TLS and WAF.
7. Configure real integrations, run the full production test matrix in staging and fix failures. Native runner remains disabled until isolation gates pass.
8. Build measured release records bound to exact source and images. The current `ops/check-release.mjs` expects 12 gate keys plus owner/retention/pricing/support/country decisions; evidence strings alone are not proof. Link actual immutable logs and inspect them. The current controlled release workflow is for already provisioned ECS service updates and cannot be used as evidence that initial bootstrap happened.
9. Run approved limited-audience production acceptance and observe operation/reconciliation before expanding country availability. Preserve the current private preview until an authorized cutover.

## Delivery/security work still pending

Base Dockerfiles currently use moving tags such as Node/Alpine, Nginx stable and PostgreSQL 16 in local Compose; the image publisher records final immutable digests but does not by itself pin every input or complete vulnerability review. Complete pinned build/runtime inputs, clean CI install, scans, SBOM/provenance verification and image promotion. Native runner versions must come from actual built images, not guessed package names.

Finish protected operator enrollment, authoritative merchant/provider reconciliation, support delivery outbox, meaningful latency/financial dashboards/alerts, second-region backup/key-copy configuration, real restore/deletion handling and deterministic browser acceptance. Use the full task register and matrix for remaining requirements rather than this deployment overview alone.
