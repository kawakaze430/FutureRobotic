# FutureRobotic AI — Build 02

Reviewed 22 October 2026 (Asia/Calcutta). Continuation of Build 01 source `eb8cf88ff02d71bf0bd5e91cedca14afa40444ce`. The final cumulative source commit and artifact checksums are recorded in the delivered release-manifest.json.

The original 86 Not started items now each have implementation/test evidence or an explicit blocker. This batch closed 16 task scopes, advanced 60 to Partial and assigned 10 to Blocked. It did not complete all 86 features. Remaining engineering and external verification are listed by stable task ID in FEATURE_STATUS.json, FEATURE_STATUS.csv and BUILD02_DELTA.csv.

| Status | Build 01 project | Build 02 project | Original 86 outcome |
|---|---:|---:|---:|
| Implemented | 34 | 50 | 16 |
| Partial | 66 | 126 | 60 |
| Blocked | 10 | 20 | 10 |
| Not started | 86 | 0 | 0 |
| Total | 196 | 196 | 86 |

Task counts are not a production-readiness percentage. Implemented means the named code scope has evidence; individual external gates remain explicit elsewhere. The existing Site remains owner-private. No AWS production environment or worldwide release was created.

## Delivered code

Public identity now has Google PKCE/state/nonce/JWK verification, GitHub verified-primary-email checks, email OTP expiry/replay/attempt controls, Turnstile integration, secure opaque sessions and MFA/role-gated operator actions. Tests use deliberate provider/mail/human-verification fixtures; no real account was created or email sent.

The portable frontend connects to account profile/preferences, persisted chat/session selection, model policy, streamed runs, cloud history/notes/files, support tickets, account exports/deletion, result sharing/revocation and hosted billing routes. Signed-in cloud content is not automatically written to local browser storage. The ChatGPT-hosted preview keeps its existing Worker API and local storage; it is not a running PostgreSQL account service.

AI/chat now has a shared Standard/Advanced registry, tier/context/output rules, bounded provider-neutral HTTPS SSE parsing, durable event replay, cancellation/partial recovery, exact frozen file context and a conservative global spending ceiling/kill switch. Provider attempts are fenced before dispatch. Unknown remote acceptance retains its hold and is not automatically sent twice. Actual provider quality, retention, pricing and invoice reconciliation remain unverified.

The reading view sanitizes Markdown and unsafe links/HTML. Fixer results have computed line differences, clean fixed-code view/export and a factual change summary. PDF adds five sizes, five margins, light/dark pages, measured wrapping, an embedded Unicode font and escaped print fallback. Unsupported direct-export glyphs are explicit. The heavy PDF module loads on demand; the main standalone browser JS is about 151 KB gzip in this build.

ZIP import validates central/local headers, paths, case collisions, symlinks, limits, expansion ratio, UTF-8 and CRC. Import reports exclude dependencies/build folders/known secret filenames. Cloud text storage includes private S3/KMS adapters, signed upload metadata, quarantine/extraction jobs, checksum downloads and safe-prefix promotion before quarantine cleanup. File revisions freeze context and report revision/checksum through the API. Account ownership, share snapshots/expiry/noindex, evaluation opt-out and content cleanup are tested.

Billing includes server USD price validation, persisted bound checkout intents, uncertain-request protection, raw Paddle HMAC verification, idempotent paid-period grants, subscription state mapping, hosted customer portal and append-only adjustment recording. Checkout return or an active subscription update alone cannot mint access/credits. The merchant integration has not been exercised against an actual sandbox. Annual monthly grants, proration/refunds, verified country/tax behavior and authoritative reconciliation remain incomplete.

Execution adds durable five-language admission, a 10,000-character policy, shared daily counter, fairness lanes, short-lived signed capabilities and a private gateway. Source images/entrypoint set runsc, no network, read-only/nonroot operation and CPU/memory/PID/disk/output/wall limits. Separate runner VPC/fleet templates start at zero. Policy tests prove generated controls; they do not prove native isolation. No user code was executed on the application host.

Infrastructure now has staging/production application, edge and optional runner stacks: private VPC/ALB/RDS, encrypted private S3 and SQS/DLQ, separate ECS web/API/worker tasks and secret fields, CloudFront/WAF/ACM/DNS, SES identity/events, encrypted logs/alarms, backups, budgets, scale ceilings and scoped GitHub OIDC. CI/build/provenance, digest rollout/rollback, migration bootstrap, regional/readiness probes, financial exception queries and recovery/incident/acceptance runbooks are included. First-deployment bootstrap, actual IAM/network/runtime behavior and second-region recovery still need engineering and live verification.

## Verification

| Check | Result | Limit |
|---|---|---|
| Database/service tests | 64 passed | PostgreSQL WASM, transactions serialized |
| UI/Markdown/diff/ZIP/PDF tests | 7 passed | Includes 50 PDF setting combinations; target-browser print parity still open |
| Runner policy/capability tests | 3 passed | No Docker/runsc/native execution |
| Infrastructure assertions | 4 passed | Six offline unapproved fixture stacks synthesized; no AWS calls |
| Release gate behavior | 1 passed | Incomplete evidence/approval is rejected |
| Existing utility/API regression | Passed | Existing local tools and Worker contracts |
| Root, portable and infra TypeScript | Passed | Compilation, not live integration |
| Standalone web build | Passed | All 68 observed converter pair routes resolve/prerender |
| Local HTTP sample | 100 requests, concurrency 10, zero errors | Readiness only; measured p95 recorded in VERIFICATION.json |
| Indexed history fixture | 10,000 rows, index scan | WASM EXPLAIN ANALYZE, not native RDS capacity evidence |
| Managed browser preview | PDF controls/export result and right assistant inspected | Export UI completed; download-path automation timed out, so saved browser bytes are not claimed verified |
| Native PostgreSQL/container/five-runtime probes | Blocked | B01/B02; executable CI/probe source supplied |

Total: 79 passing Node tests plus the existing regression suite. Final source build/private publish outcome belongs to release-manifest.json. No real inference, merchant payment/refund, OAuth consent, external email, AWS provisioning or regional production probe was performed.

## Blocked ownership first

| Blocker | Owner/action |
|---|---|
| B01 | Codex on Docker/gVisor-capable CI or owner host: run native PostgreSQL, images/compose and sandbox probes. Dependency installation itself succeeded. |
| B02 | Owner: select AWS account/region/budget and supply a scoped deployment role or protected OIDC trust. Codex then provisions and tests. |
| B03 | Owner: configure protected live AI secret, approved model/prices/quota/retention. Codex then runs quality/cost/failure checks. |
| B04 | Owner/merchant: onboarding, sandbox configuration and explicit live payment/refund authorization. Codex then completes reconciliation tests. |
| B05 | Owner: choose/control production domain/DNS. Codex then validates TLS/CDN/callback records. |
| B06 | Owner: register Google/GitHub apps for exact callbacks and configure protected secrets. |
| B07 | Owner/SES: verified sender, production sending/support mailbox and actual alert recipient. |
| B08 | Owner: countries, operating identity, prices/fair-use, proration/refund/retention/support and commercial asset approvals. |
| B09 | Owner: protected CI repository/environments and narrow trust. Codex then executes the supplied workflow. |

Do not put secrets in chat or source. The declined OpenAI Developers plugin was not installed or retried.

## Remaining engineering

Partial is not equivalent to waiting only for credentials. Codex still owns file-capacity/revision/message-pagination UI and enforcement, complete response contracts, public anonymous dispatch integration, per-user paid fair-use controls after policy selection, annual monthly credits, proration/refunds/country checks, merchant/provider reconciliation, deployment bootstrap, operational dashboards and regional recovery implementation. The tracker names each gap and separates it from external approval/access. These items remain open; they were not relabeled Implemented merely because source/configuration exists.

## Ordered release path

Use ops/README.md as the executable sequence: run Docker/native gates; finalize owner policy/configuration; bootstrap approved ECR/images and private staging infrastructure; migrate/verify restricted runtime DB role; validate real identity/email/AI/merchant/storage/streaming; run native runner/load/failover/restore/rollback/alert drills; complete protected CI and exact-digest gates; conduct private beta; then expand to approved countries with measured availability/cost and post-launch reconciliation. Production launch remains closed until these recorded gates pass.
