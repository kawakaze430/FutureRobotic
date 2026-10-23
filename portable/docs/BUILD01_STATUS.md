# FutureRobotic AI Build 01 status

Twenty existing tasks were advanced: **13 have implemented backend scope and seven remain partial**. One of those 13, API-002, was already implemented in the preview and now has portable API validation as well. This batch adds 12 newly implemented tasks to the cumulative tracker.

Cumulative status: **34 implemented, 66 partial, 10 blocked, 86 not started** across 196 tasks.

The backend is in portable/. The existing private preview retains its Worker API and browser workspace. The preview is not connected to this PostgreSQL backend. AWS production is not released. Production startup is explicitly gated until required adapters and release checks are complete.

## Batch results

| Task | Status | Implemented evidence | What remains |
| --- | --- | --- | --- |
| API-001 Portable Node API and health/readiness endpoints | Implemented | Portable Fastify Node service with real loopback HTTP proof and database/outbox readiness checks. Failure responses omit connection details. | Deploy the portable service after production adapters/gates. Existing Sites preview is not wired to it. |
| API-002 Validated request schemas and safe errors | Implemented | Strict JSON schemas, body/context bounds, safe error envelopes and rejection of client role/model/owner injection. Portable CSRF and forged-header tests pass. | Continue full route response schemas in API-003 and staging/browser security checks in SEC-003. |
| API-003 OpenAPI specification and typed web client | Partial | Registered OpenAPI specification and typed browser-safe run client. Actual API error, pagination and idempotency transport fixtures pass. | Replace broad response placeholders with complete schemas, generate all client routes, add SSE contracts and connect the existing frontend. |
| API-004 Idempotent tool dispatch and cancellation | Implemented | Workspace-scoped idempotency key plus canonical request hash. Atomic reservation/dispatch outbox, cancellation and conservative uncertain-outcome fencing pass with provider doubles. | Live provider adapters/reconciliation are separate blocked/incomplete AI integration work B03. Uncertain holds require confirmed outcome before resolution. |
| API-005 Metadata-only logs and distributed tracing | Implemented | Whitelisted metadata logs and W3C trace propagation across actual API request, job and provider-double failure. Raw source, tokens and provider errors are absent from logs. | CloudWatch/OTel export and production alerting remain AWS observability work. |
| API-007 Scheduled cleanup and reconciliation tasks | Implemented | Hourly deduplicated cleanup/reconciliation jobs, lease/retry observability and safely replayable export/deletion handlers. Expired unsent holds release; uncertain sent holds remain. | Production scheduler/worker deployment and alerting remain AWS work B02. |
| AUT-006 Secure sessions and linked identities | Implemented | Hashed opaque sessions, CSRF binding, revocation/expiry, fixation rotation and explicit fresh-session identity linking. Matching email never silently links. Forged Sites headers are ignored. | Connect OAuth/OTP verification adapters and session-cookie issuance in AUT-001..004. Production account flow is not live. |
| DAT-001 PostgreSQL schema, migrations and constraints | Implemented | Two forward-only migrations, advisory migration lock, historical checksums, ownership/business-key constraints. Empty database, rerun, changed checksum and prior-release upgrade fixtures pass. | Native PostgreSQL/RDS migration verification is tracked as B01/B02 before release. |
| DAT-002 Users, identities, sessions and personal workspaces | Implemented | Persistent users, verified identities, hashed sessions and one personal workspace per account. Composite tenant keys and two-account negative fixtures pass. | Wire public identity adapters and the existing frontend in AUT-001..004/WRK tasks. |
| DAT-003 Tool runs, result versions, notes and chats | Implemented | Persistent runs, versioned results, optimistic notes, threads/messages. Completed/failed/cancelled runs, notes and chat restore after PGlite restart. | Frontend persistence migration and live chat streaming remain separate work. |
| DAT-004 Files, revisions, extraction and share records | Partial | Tenant-scoped file/revision/extraction/share tables, text-object lifecycle, retry keys, tombstones and durable delete jobs. Failed writes and ownership fixtures pass. | Implement revision-update/download/share-resolution APIs, S3 adapter and secure multi-format extraction. Verify S3 lifecycle on AWS. |
| DAT-005 Plans, prices, subscriptions and provider events | Partial | Plans/prices/subscriptions/event inbox plus a trusted verified-event service. Replayed/tampered/stale events and repeated period grants are tested. | Verify native concurrent event processing. Add merchant signature adapter and approved plan-change/proration rules; run payment gates. |
| DAT-006 Usage reservations and append-only allowance ledger | Partial | Reserved/consumed/granted accounts and immutable ledger. Request races, rollback, once-only settlement/release and ledger reconciliation pass on PGlite. | Run the native multi-connection suite and contention/failure fixtures. PGlite serializes transactions and cannot prove PostgreSQL replica behavior. |
| DAT-007 Outbox, job retries and dead-letter processing | Implemented | Transactional outbox commits with run/hold. Durable leases, retries, bounded backoff, stale-ack fencing and inspectable dead letters pass. | Native concurrent worker contention and production queue operations remain release verification gates B01/B02. |
| DAT-008 Retention, deletion and account export jobs | Implemented | Durable export/deletion/object cleanup jobs. Export ownership, immediate access revocation, content redaction, staging cleanup and retention replay fixtures pass. | Approve retention policy; integrate merchant cancellation, provider deletion and backup expiry before production. Standalone chat retention remains open. |
| QTA-002 Free-account initial credits | Partial | Verified-account starter grant keyed once per account. Thirty parallel application calls and replay leave exactly five credits and one grant on PGlite. | Prove multi-connection concurrent signup/login using the native PostgreSQL suite. Public signup verification is separate auth work. |
| QTA-004 Durable reservation, settle and release ledger | Partial | Row-locked durable reserve/settle/release service. Overspend, duplicate delivery, cancellation, rejection, timeout and crash-fence fixtures pass on PGlite. | Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely. |
| QTA-005 Distributed rate and concurrency limits | Partial | Database-shared fixed-window limits and renewable concurrency leases. Two service instances enforce shared limits in application-level race tests. | Verify actual separate API/worker processes and native database connections under contention/load. Configure deployment limits and worker monitoring. |
| SEC-001 Tenant authorization and anti-IDOR tests | Implemented | Two-account route/service fixtures deny guessed/cross-user reads and writes across runs, notes, chats, files, shares, exports and billing views. Composite database ownership keys also reject invalid references. | Repeat negative cases as new routes/adapters are added and on staging before release. |
| SEC-006 Prompt/context trust boundaries | Implemented | Server-built context uses only owned records, fixed trusted roles and bounded attachments. Source remains untrusted JSON data, no tools are exposed, and sessions/secrets are excluded. | Live model quality/adversarial evaluation and streaming/UI integration remain AI/chat release work B03. |

## Verification

- 34/34 integration tests pass against persistent PGlite, including real Node HTTP, forward migrations, constraints, rollback, restart, ownership, CSRF, quotas, retries, cancellation and redacted traces.
- The existing utility/reference/API transport regression suite passes. Root and portable TypeScript checks pass.
- Provider and billing tests use explicit test doubles/trusted internal fixtures. No live AI call, payment, refund, OAuth, email, S3 or RDS operation was performed.
- PGlite serializes transactions. Passing parallel application requests is not native PostgreSQL lock/replica proof. Five database/quota tasks retain partial status for this reason.
- No Docker container, remote runner sandbox, RDS failover/restore, full security audit or worldwide production rollout was verified.

## Blocked ownership

| Blocker | Execution owner | Required next action |
| --- | --- | --- |
| B01 Docker, native database and isolated runner verification unavailable | Codex on Docker-capable CI / owner host | Run node portable/scripts/test-native.mjs on a Docker-capable host, or inject a disposable TEST_DATABASE_URL and run the same suite. Then run container/sandbox probes. |
| B02 AWS account and deployment role unavailable | Site owner | Provide a scoped deployment role or repository OIDC trust after selecting account, region and budget. |
| B03 Live AI secret and quota unavailable | Site owner | Configure a protected provider secret with an approved model, quota and spending ceiling. |
| B04 Merchant onboarding and payment tests unavailable | Site owner / payment provider | Approve provider and business onboarding; provide sandbox then live identifiers/secrets through protected configuration. |
| B05 Domain and DNS control unavailable | Site owner | Choose and control the production domain and DNS records. |
| B06 Production OAuth applications unavailable | Site owner | Register applications for exact staging/production callbacks and configure secrets safely. |
| B07 Email sender and support delivery unavailable | Site owner / AWS SES | Verify sender domain, request production sending access and select support mailbox. |
| B08 Owner business and release decisions outstanding | Site owner | Approve actual operating commitments and replace unapproved reference artwork before commercial launch. |
| B09 Owner CI trust and repository setup outstanding | Site owner / CI owner | Select the delivery repository and authorize narrowly scoped OIDC deployment trust. |

Owner actions should be completed in the relevant cloud/provider console or protected environment. Do not paste provider/AWS secrets into chat. The declined OpenAI Developers plugin is not required or retried.

## Next engineering batch

Continue ownership with public identity/OTP adapters, full API/client and SSE contracts, frontend persistence wiring, revision/S3 upload adapters, secure extraction, billing signature/checkout adapters, provider integration and AWS/IaC/CI source. Native SQL/container tests move to a capable Codex/CI environment. AWS provisioning and live financial tests wait for the owner-controlled prerequisites above.

The delivered source ZIP is cumulative and excludes dependencies, build output, Git credentials, environment files and database data. Run commands and limitations are in portable/README.md. The delivery manifest identifies its source commit.
