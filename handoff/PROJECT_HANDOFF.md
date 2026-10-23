# FutureRobotic AI — project handoff

Reviewed 22 October 2026. Application baseline: Build03, commit `76dda7b040a95e96c529073240056678d9f12ba4`. This document records the cumulative current project; it does not claim a new implementation release.

## Main goal and scope

Create the complete FutureRobotic AI SaaS, using the supplied CodeConvert captures and workflow inventory as the visual/product reference. Preserve the warm beige public website, green controls, language cards, tool layouts, dark signed-in workspace and right-hand assistant, with FutureRobotic AI branding. Deliver the frontend, portable backend, PostgreSQL schema, private storage, identity, billing, AI integration, execution isolation, AWS infrastructure and operating procedures needed for an actual commercial service.

The eight tools are code conversion, code generation, code explanation, code checking, code fixing, comment removal, code-to-PDF and code execution. The assistant is a first-class right-side chat experience grounded in the current source/result and selected owned file revisions. Accounts need preferences, pinned tools, notes, history, cloud files, exports/deletion, subscriptions and allowance displays. Public content includes FAQs, pricing, contact, privacy/terms, language directories/pairs and English/French localization.

The supplied archive captures 57 public desktop screenshots and representative repeated language templates, not every authenticated screen or the reference company's private backend. Its real example results describe the reference service, not FutureRobotic AI. The V1 signed-in video mentioned earlier is not in the available handoff archive. Target parity remains subject to our own product, browser and live-integration acceptance.

## Current release and counts

| Measure | Current evidence |
| --- | --- |
| Total work register | 196 stable IDs |
| Implemented / Partial / Blocked / Not started | **73 / 59 / 64 / 0** |
| Build03 carried work | Of 126 former partials: 23 implemented, 59 remain partial, 44 reclassified blocked |
| Application source | Complete cumulative Build03 tree; 382 tracked files at the recorded commit |
| Private preview | https://futurerobotic-ai.pearly-zebra-9453.chatgpt.site |
| Portable AWS production | Not deployed |
| Production ready | No |

The 44 reclassified tasks were not completed. Counts are work-item counts, not a readiness percentage. Some canonical descriptions predate later code. `CURRENT_TASK_REGISTER` keeps every original field and adds reviewed implementation/remaining-work notes; classifications are unchanged.

## What already exists

| Area | Implemented source / local behavior | Important remaining scope |
| --- | --- | --- |
| Public website | FutureRobotic AI visual system, home cards/ribbon, eight tool routes, pricing display, footer, help search, privacy page, 68 source directories and 68 pair routes; standalone emits 152 public candidate routes | Final comparison/production policies, full French localization, framework canonicals, approved public indexing, own commercial artwork review, mobile/cross-browser acceptance |
| Workspace | Dark sidebar, tool navigation, collapse/visibility controls, personal home, curated popular tools, account preferences and pins/pair ordering | Real authenticated browser acceptance; source/read-result races; some account/operator flows |
| Editors | CodeMirror input, grammar loading, indentation, font/theme/gutter settings, plain-text fallback, fullscreen keyboard/focus behavior, shared Unicode counters and language extension downloads | Full 72-language input/output grammar parity; output uses a more limited highlighter; mobile/accessibility/performance checks |
| AI tools | Server-only provider-neutral streaming adapter, allowlisted tool instructions, model registry, input/context/tier bounds, durable run/jobs, versioned results, safe rendering, fix diff/change summary | Real provider quality/cost testing; structured issue output/schema; unseen evaluation harness; main-tool model picker still hardcoded Auto |
| Right assistant | Quick prompts, selected source/result context, selected owned revision snapshots, bounded history, safe Markdown/fenced copy, load older messages, attachment inspection/removal, diff confirmation and versioned apply | Real streamed follow-up/reconnect/stop tests through the edge; session-switch and pagination races; deployed second-device acceptance |
| Files | Local management, bounded UTF-8 validation, all advertised text extensions, safe ZIP import/exclusions, cloud object adapter/quarantine, revisions/checksums, selected context, capacity locks and retryable deletion | Actual S3/KMS/CORS/presign/lifecycle/native race tests. Binary document parsers and malware scanning are not implemented |
| History/privacy/shares | Local history, owned cloud records/pagination, cloud/local/no-history modes, evaluation opt-out, bulk history jobs, expiring exports, result-only shares with hashed token/expiry/revoke/noindex | Complete local-tool cloud persistence/notes, reload export recovery, deployed deletion/backup/provider retention acceptance |
| PDF | Multi-page output, 50k input, five font sizes, light/dark, five margins, independent title/line-number controls, embedded Unicode font and sandboxed print preview | Syntax-color/download-print parity, broader glyph coverage, downloaded bytes and print acceptance across supported browsers |
| Execution | Local browser JavaScript; five-language remote API/admission source, signed capabilities, bounded queue, durable jobs/results, separate gVisor gateway/container source and abuse probes | Build five version-pinned images and measured runtime catalog; native functionality/isolation/resource/fairness/patch/drain proof; anonymous dispatch integration |
| Identity/accounts | Google/GitHub OAuth adapters, OTP/human-verification source, hashed sessions/CSRF, safe explicit linking, account preferences, export/deletion and support ticket API | Real provider/sender/edge verification, full export recovery, protected operator enrollment/console, support acknowledgement outbox |
| Database/jobs | Four forward-only SQL migrations, tenant constraints, persistent results/notes/chats/files, transactional outbox, leases/backoff/dead letters, cleanup, append-only allowance/audit history | Native multi-connection contention/privilege/load tests, actual RDS migration/failover/PITR/restore/deletion reconciliation |
| Billing/allowances | Server catalog, Paddle raw-signature adapter, verified server price lookup, persisted checkout intent/portal, signed event ordering/deduplication, monthly windows inside annual entitlements, atomic reservations and spend/kill controls | Merchant sandbox/live verification, grace/proration/cancel/refund/dispute policies and correction UI, verified country/tax/invoices, authoritative reconciliation |
| AWS/CI/operations | Six offline CDK stacks, app/worker/web separation, private RDS/S3/network, edge/WAF, optional isolated runner stack, budgets/backup/queues/SES/OIDC source, image/release scripts and runbooks | First-deploy bootstrap, scoped account/CI setup, pinned/scanned base/runtime artifacts, dashboards, second-region recovery configuration and all real operational drills |

## Implementation details that matter for the next model

**Two hosting paths exist.** The current Sites preview uses Vinext/Worker and browser storage. It does not run the portable Node/PostgreSQL account backend. The AWS-oriented frontend is a React/Vite static build served by an Nginx container; its portable Fastify API and worker run as separate trusted services. Preserve the preview while continuing portable work. Do not describe the preview as proof of cloud-account persistence.

**Database evidence has a limit.** The 77 backend tests use PGlite 0.3.16 with serialized transactions when `TEST_DATABASE_URL` is empty. They prove the tested SQL/services, not native multi-process locking, RDS failover or production throughput. Four numbered migrations currently exist; some historical READMEs still say two.

**AI is prepared, not live.** The generic HTTPS chat-completions-compatible adapter supports bounded streaming and approved model mapping. No configured live provider/quota was verified. Standard and Advanced public registry IDs exist, but all current AI requests still use the credit reservation bucket. Unlimited Standard, final per-user fair use and paid execution policy are unresolved. The main-tool Auto picker is not a complete model-choice interface.

**Limits are explicit.** The private preview AI path is 4,000 Unicode characters; authenticated request budgets are 25,000 or Premium 100,000 including instructions/selected context. PDF input is 50,000, execution 10,000. At most five selected files contribute up to 6,000 Unicode characters each with omission disclosure. Cloud file validation is UTF-8 text only and up to 100,000 bytes/file; source catalog capacities are Free zero cloud slots, Pro 100 files/10 MB, Premium 250 files/25 MB, with at most 20 retained revisions. These commercial entitlements remain subject to approval and native enforcement tests.

**Retention is provisional.** Cloud source/results default to 30 days, account/history exports to 24 hours, shares to at most seven days. Local/no-history requests use ephemeral server processing, terminal redaction where possible, and interrupted-content expiry plus scheduled cleanup. This is not zero storage or a provider-retention promise. Backup, accounting, legal and provider exceptions need approved policy and actual evidence.

**Never blindly retry uncertain work.** Durable dispatch fencing reserves/settles once and leaves uncertain provider/execution/checkout outcomes pending reconciliation. Do not fix balances by editing append-only ledger rows. Account deletion is guarded against active subscriptions or unresolved checkout intents; an authoritative merchant cancellation/reconciliation path remains necessary.

**Anonymous routes remain unfinished.** Durable daily anonymous counters exist (two AI / three execution reservations in source policy), but public anonymous AI/execution dispatch is not wired. Do not advertise those counters as a complete public free service.

**Execution isolation remains unverified.** Launch argument tests are not sandbox evidence. The current runner Dockerfile is a combined multi-language image and its runtime packaging still needs pinned, measured release artifacts. Native probes must execute only on the isolated approved fleet.

## Work remaining with the coding model

All 59 Partial rows remain engineering-owned, including work that also needs final external acceptance. Mixed work inside a Blocked feature can continue independently. High-value code work includes complete typed API contracts, guarded anonymous dispatch, structured checking/evaluations, local-tool cloud persistence/notes, race-safe chat/history recovery, operator bootstrap/console, support delivery outbox, authoritative reconciliation, first AWS bootstrap, runtime image/version/drain automation, dashboards, regional recovery, browser regression, French strings, full syntax coverage and PDF parity.

Read the complete register for exact remaining work and acceptance criteria. `NEXT_20_TASKS.md` is a proposed implementation sequence, not a replacement for the 196-task register or a claim those tasks are finished.

## External dependencies and ownership

| Gate | Owner/environment supplies | Coding model owns after access |
| --- | --- | --- |
| B01 | Docker-capable CI/host; isolated gVisor gateway or disposable native PostgreSQL environment | Build, run native/concurrency/container/runner acceptance, inspect failures and fix code |
| B02 | Scoped AWS role, account, selected region and budget | Complete bootstrap, provision staging, migrate, configure, measure and prepare release |
| B03 | Protected AI configuration, usable quota, approved models/retention/spend ceiling | Actual conversion/generation/explanation/check/fix/chat quality, streaming, failures and cost verification |
| B04 | Approved merchant onboarding and protected sandbox/live identifiers; authorization for real charges/refunds | Complete policies/adapters/UI/reconciliation and execute actual payment acceptance |
| B05/B06 | Domain/DNS control and owner OAuth applications | TLS/callbacks and real login/session/edge checks |
| B07 | Verified sender, SES sending access and support mailbox | Delivery/retry/bounce/complaint source, OTP/support acceptance and alerts |
| B08 | Business identity; countries, pricing/fair use, refund/retention/legal/support and asset decisions | Implement approved decisions, enforce availability and verify published promises |
| B09 | Selected owner delivery repository/protected environments and scoped OIDC trust | Execute CI/security/build/rollout/rollback and prove branch/role denial |

The latest runtime check found no Docker, AWS CLI or psql, no supplied disposable native database/gateway, and no configured AWS credential/release-file variables. Existing application dependencies are installed; dependency installation is not a blanket blocker. A future environment must check its own capabilities rather than inherit this runtime's limitations.

## Verification and release path

Build03 records 100 automated passes: backend 77, UI/export/grammar 15, runner-policy/release-gate 4 and infrastructure 4. Root/API/infra TypeScript, existing regression and both relevant web builds passed. Desktop Chromium checks were recorded; mobile/other engines and live-account integration were not.

The later 22 October check rebuilt the backend/infra, passed 77 + 4 tests and synthesized six templates. It did not add 81 new test cases. Native database/runner gates exited 2. No AWS, provider, merchant, OAuth, sender or worldwide acceptance was performed.

Before production: close remaining source scope; run native SQL/containers/five-runtime isolation; finish initial AWS bootstrap; apply reviewed staging; verify real identity, AI/chat, S3, merchant, edge and complete product workflows; measure load/spend/alerts/failover/restore/rollback/deletion/incident handling; approve countries and final commitments; release to a controlled approved audience and expand using observed regional evidence. `PRODUCTION_TEST_MATRIX` specifies scenarios and evidence. The current 12-key release validator is one control, not proof that its evidence strings correspond to real passing tests.

The handoff includes no production credentials and requires none to read or continue independent code work. The OpenAI Developers plugin was declined; do not reintroduce it. No model-specific subscription, entitlement or tool availability is assumed by this handoff.
