# Real production acceptance matrix

**74 pending scenarios.** These are requirements, not test results. No row was executed merely by preparing this handoff. Local/mocked/offline evidence is separate. Set thresholds and pass criteria before the run; measure against approved service/cost/recovery targets, not invented SLAs. Full-scope launch requires every applicable row; any narrower launch needs an explicit scope decision.

The first 12 group names match `ops/check-release.mjs`; `productAcceptance` adds the full user/privacy/browser scope that its current key list does not independently establish. A validator accepting a JSON evidence string is not proof of an observed pass. Each run must bind actual source SHA, images/runtime/models, environment/region, UTC time, operator, fixtures/request IDs, observed pass/fail and immutable sanitized logs. Do not record secrets/payment data/user source in public evidence.

## nativePostgres

### LIVE-001 — Fresh install and every prior migration upgrade

**Task IDs:** DAT-001,QAS-003

**Prerequisites:** B01; disposable native PostgreSQL

**Required observation:** Apply 001-004 once, preserve historical checksums/data and deny a changed old migration.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-002 — Concurrent reserve/settle/release and process death

**Task IDs:** DAT-006,QTA-004

**Prerequisites:** B01; multi-process test harness

**Required observation:** Independent connections cannot overspend; settle/release once; rollback and uncertain holds match the ledger.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-003 — Concurrent verified signup/login and linking

**Task IDs:** QTA-002,AUT-006

**Prerequisites:** B01; native SQL and verified identity fixtures

**Required observation:** One starter grant/workspace; no email-only linking, session fixation, replay or cross-identity takeover.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-004 — Concurrent direct/quarantine/revision/delete capacity

**Task IDs:** FIL-006,FIL-010

**Prerequisites:** B01/B02; native SQL and test S3

**Required observation:** Staged slots and retained bytes count; no race exceeds limits; stale versions reject and objects reconcile.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-005 — Concurrent merchant events and monthly grants

**Task IDs:** DAT-005,BIL-003

**Prerequisites:** B01/B04; verified event fixtures

**Required observation:** Duplicate/reordered events and annual month transitions yield one correct period/grant under separate connections.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-006 — Worker lease expiry, stale ack and duplicate notification

**Task IDs:** DAT-007,AWS-010

**Prerequisites:** B01/B02; multiple workers and fault controls

**Required observation:** One external dispatch; stale leases cannot ack/renew; bounded retry/dead letter and SQL-authoritative recovery work.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-007 — Query plans and pool saturation

**Task IDs:** DAT-009

**Prerequisites:** B01/B02; representative safe fixtures and approved targets

**Required observation:** Representative rows/tenants use intended indexes; pool limits/timeouts and p95 are measured against approved budgets.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-008 — Restricted runtime and migration/operator privileges

**Task IDs:** SEC-009,DAT-001

**Prerequisites:** B01/B02; distinct native database roles

**Required observation:** Serving role cannot change schema, audit/ledger history, grant roles or enroll operators; migrations work under separate owner.

**Status:** Pending real acceptance; not executed by this handoff

## dockerImagesAndCompose

### LIVE-009 — Clean locked install and portable image builds

**Task IDs:** AWS-002,SEC-010

**Prerequisites:** B01/B09; package/registry access

**Required observation:** Fresh protected CI builds API/web from lockfile with recorded input/base/output digests; no hidden local dependency.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-010 — Compose migration/API/web readiness and restart

**Task IDs:** AWS-002,API-001

**Prerequisites:** B01; generated protected local test password

**Required observation:** Disposable stack starts in order, answers status/health and restores owned data after restart without dev auth bypass.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-011 — Scan, SBOM, provenance and secret-free bundle

**Task IDs:** AWS-003,SEC-010

**Prerequisites:** B01/B09; actual built artifacts/scanner

**Required observation:** Verified attestations bind exact source/images; findings reviewed; browser/image/archive contain no protected secret.

**Status:** Pending real acceptance; not executed by this handoff

## fiveRuntimeIsolation

### LIVE-012 — Five measured runtimes success and compile/runtime errors

**Task IDs:** RUN-002,RUN-003,RUN-004

**Prerequisites:** B01/B02; approved isolated gateway/images

**Required observation:** Python/JS/C/C++/Java version catalog equals built digest images; stdout/stderr/status/phase/exit/duration are accurate.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-013 — Time/CPU/memory/process/disk/output stress

**Task IDs:** RUN-005,RUN-007

**Prerequisites:** B01/B02; isolated abuse-only test host

**Required observation:** Each runtime stops within configured limits, kills child groups, bounds output/disk and leaves fleet healthy.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-014 — Network/metadata/private-services/package denial

**Task IDs:** RUN-006,RUN-009,SEC-004

**Prerequisites:** B01/B02; isolated controlled egress probes

**Required observation:** Jobs cannot reach metadata, internet, DB, files, sockets or credentials; packages/interactive stdin violate policy safely.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-015 — Forged/expired/replayed/mismatched capability

**Task IDs:** RUN-006

**Prerequisites:** B01/B02; protected test signer and isolated gateway

**Required observation:** Only bound fresh job/source/stdin/runtime signatures execute; forgery/replay/nonce reuse fails before container launch.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-016 — Queue fairness, saturation and concurrent accounts

**Task IDs:** RUN-008,QAS-008

**Prerequisites:** B01/B02; native multi-client load

**Required observation:** Global/workspace limits enforce before daily usage; clients have measured fair capacity; retries do not create jobs twice.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-017 — Cross-job residue, drain/patch/key rotation and host crash

**Task IDs:** RUN-010

**Prerequisites:** B01/B02; approved fleet maintenance window

**Required observation:** No source/files/processes survive between jobs; failed probe keeps fleet closed; crashed sent jobs reconcile without redispatch.

**Status:** Pending real acceptance; not executed by this handoff

## oauthAndOtpDelivery

### LIVE-018 — Real Google and GitHub public account lifecycle

**Task IDs:** AUT-001,AUT-002,AUT-003

**Prerequisites:** B02/B05/B06; exact test-domain OAuth apps

**Required observation:** Actual consent/callback and verified email create correct owned session; reload/logout/revoke/linking UX works outside Sites.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-019 — OTP and human verification delivery/abuse

**Task IDs:** AUT-004,AUT-005

**Prerequisites:** B02/B05/B07; verified sender and human-verification setup

**Required observation:** Real permitted inbox receives code; expiry/replay/wrong-attempt/send windows/hostname/action checks work through edge.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-020 — OAuth state/PKCE/CSRF/session negative cases

**Task IDs:** AUT-006,SEC-003

**Prerequisites:** B02/B06; real browser test accounts

**Required observation:** Forged headers, wrong origin/state/PKCE/cookie/CSRF and stale/revoked sessions grant no access or account linking.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-021 — Operator enrollment/role/MFA lifecycle

**Task IDs:** AUT-009,SEC-009

**Prerequisites:** Operator source completion; B02; protected test operators

**Required observation:** Protected enrollment is inaccessible to serving roles; fresh MFA/replay/rotation/revoke and least-privilege console actions are audited.

**Status:** Pending real acceptance; not executed by this handoff

## realAiQualityAndCost

### LIVE-022 — Unseen semantic conversions

**Task IDs:** TOL-001

**Prerequisites:** B03; approved models/fixtures; approved execution harness

**Required observation:** Chosen source/target/instructions produce equivalent behavior on frozen external fixtures; language/import/Unicode/errors reviewed.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-023 — Unseen code generation requirements

**Task IDs:** TOL-002

**Prerequisites:** Structured generation checks; B03; safe test harness

**Required observation:** Selected language and explicit constraints are honored; real runnable outputs meet frozen acceptance without claiming unrun tests.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-024 — Grounded explanation and complexity

**Task IDs:** TOL-003

**Prerequisites:** B03; frozen rubric and independent review

**Required observation:** Explanation matches actual source/examples, states justified complexity and avoids invented behavior; reviewer rubric recorded.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-025 — Structured checking and false positives

**Task IDs:** TOL-004

**Prerequisites:** Structured checker completion; B03; unseen fixture rubric

**Required observation:** Issue schema/severity/location/snippets validate; known defects detected and valid fixtures not falsely broken beyond approved rubric.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-026 — Unseen fixes and original/diff preservation

**Task IDs:** TOL-005,TOL-006,TOL-007

**Prerequisites:** B03; approved isolated/trusted fixture runner

**Required observation:** Actual provider repair passes relevant tests/constraints; diff/download/version original agree and unsupported fixes remain labeled.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-027 — Follow-up grounded chat and explicit apply

**Task IDs:** CHT-002,CHT-004,CHT-008

**Prerequisites:** B02/B03; two test accounts and files

**Required observation:** Real replies use only owned selected source/result/revisions; omissions disclose; applying reviewed code appends a version and preserves original.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-028 — Streaming UTF-8, disconnect/reconnect/stop/retry

**Task IDs:** CHT-007,TOL-011,EDT-011

**Prerequisites:** B02/B03; actual edge; controlled connection interruption

**Required observation:** Actual provider through CloudFront preserves deltas, terminal markers and Last-Event-ID; no lost ownership or double dispatch/charge.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-029 — 429/rejection/timeouts/unknown acceptance and worker crash

**Task IDs:** API-004,QTA-004

**Prerequisites:** B02/B03; approved provider fault simulation

**Required observation:** Known unsent/rejected work releases once; uncertain accepted work remains fenced; UI retains source and explains recovery.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-030 — Tier/model/context and Unicode budgets

**Task IDs:** QTA-003,TOL-010

**Prerequisites:** B03/B08; policy decision and configured models

**Required observation:** Server rejects forbidden model/tier, omitted authorization, excess source/instructions/references; registry matches approved actual model capabilities.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-031 — Anonymous routes across replicas and spoofed IP/human inputs

**Task IDs:** QTA-001,SEC-007

**Prerequisites:** Anonymous source completion; B02/B03/B08

**Required observation:** Daily idempotent counters, human validation, trusted edge IP and spending denial cannot be bypassed with concurrency/replay/headers.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-032 — Model costs, budget kill and invoice reconciliation

**Task IDs:** QTA-006,QTA-007,REL-006

**Prerequisites:** B02/B03/B08; real pricing/quota/invoice evidence

**Required observation:** Measured usage/reserves/invoice reconcile; emergency off reaches workers; high-use Standard scenario fits approved economics.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-033 — Frozen evaluation thresholds and no leakage

**Task IDs:** TOL-012,QAS-004

**Prerequisites:** Evaluation harness completion; B03; approved evaluation policy

**Required observation:** Fixtures/scoring fixed before run; source/model/version/results retained; actual pass/fail meets approved thresholds without cherry-picking.

**Status:** Pending real acceptance; not executed by this handoff

## merchantSandboxAndRefund

### LIVE-034 — Actual checkout price/country/tax and return tampering

**Task IDs:** BIL-001,BIL-002,BIL-008

**Prerequisites:** B04/B08; approved sandbox products/countries/prices

**Required observation:** Server verified price matches catalog/merchant; provider-verified eligible country/tax; return-page/client edits never grant entitlement.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-035 — Raw signed webhook delivery/replay/rotation

**Task IDs:** BIL-003

**Prerequisites:** B04; merchant sandbox and protected signing setup

**Required observation:** Real delivered bytes verify; stale/future/tampered/duplicate/reordered and key-rotation cases preserve one correct event outcome.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-036 — Monthly/annual renewals, short months and grace

**Task IDs:** BIL-004,BIL-005

**Prerequisites:** B04/B08; merchant lifecycle/time fixtures

**Required observation:** Actual lifecycle matches approved active/trialing/past-due/expiry behavior; monthly grants within annual periods remain exact.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-037 — Upgrade/downgrade/proration preview and confirmation

**Task IDs:** BIL-006

**Prerequisites:** Policy/implementation completion; B04/B08

**Required observation:** Approved previews and confirmed settlement update entitlement/credits once; abandoned/failed transitions remain safe.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-038 — Portal, invoices, cancel/resume and access end

**Task IDs:** BIL-007,BIL-011

**Prerequisites:** B04/B08; sandbox customer lifecycle

**Required observation:** Only owned portal/invoices accessible; actual cancellation/resumption and paid-through access follow approved policy.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-039 — Sandbox refunds/disputes/corrections

**Task IDs:** BIL-009,BIL-012

**Prerequisites:** Refund/correction implementation; B04/B08

**Required observation:** Approved eligibility/allowance treatment enforced; provider confirmation reconciles through immutable audited events with role/fresh-MFA protection.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-040 — Payment failures, delayed/lost events and recovery

**Task IDs:** BIL-010,REL-006

**Prerequisites:** Reconciliation completion; B04; controlled failure fixtures

**Required observation:** Authoritative provider reconciliation finds/resolves mismatch without blind external retries or manual ledger edits.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-041 — Deletion during active subscription or uncertain checkout

**Task IDs:** AUT-008

**Prerequisites:** Merchant deletion handoff completion; B04/B08

**Required observation:** Recurring payment cannot be orphaned; cancellation/reconciliation path is explicit; deletion guard and redaction preserve required accounting.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-042 — Owner-authorized low-value live purchase and refund

**Task IDs:** QAS-006,ENV-004

**Prerequisites:** Specific owner financial authorization; B04; all sandbox gates

**Required observation:** One approved real charge/refund and resulting entitlement/ledger/invoice are observed and reconciled with no card data retained.

**Status:** Pending real acceptance; not executed by this handoff

## awsStagingSmokeAndFailover

### LIVE-043 — Fresh account first-deploy bootstrap and drift review

**Task IDs:** AWS-001,AWS-005

**Prerequisites:** Bootstrap completion; B02/B09; reviewed actual config

**Required observation:** Retained registry, images, secrets, migrations and serving tasks create in order; owner change set and drift/retention controls recorded.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-044 — Private origin/network and runner boundary

**Task IDs:** AWS-004,AWS-007

**Prerequisites:** B02; applied staging app/edge/runner networking

**Required observation:** No direct public ALB/RDS/S3 path or job-to-private-service access; actual origin SG/client-IP assumptions validated.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-045 — Task/AZ/RDS/SQS failure and replay

**Task IDs:** AWS-008,AWS-010

**Prerequisites:** B02; controlled staging fault window

**Required observation:** Observed outage/recovery preserves ownership, jobs/reservations and known uncertain outcomes; failover/dlq/replay produce no duplicates.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-046 — IAM/KMS/secret separation and rotation

**Task IDs:** SEC-002,AWS-011

**Prerequisites:** B02; real task/IAM/KMS roles and test secrets

**Required observation:** Browser/runner cannot access app/provider/DB secrets; each task gets only intended fields; rotation restarts/reloads safely.

**Status:** Pending real acceptance; not executed by this handoff

## dnsTlsEdgeAndCountryProbes

### LIVE-047 — Owned DNS/TLS/callback/redirect validation

**Task IDs:** AWS-006,ENV-005

**Prerequisites:** B02/B05/B06; owner zone and actual domain

**Required observation:** Actual apex/app/locale/callback routes resolve with valid TLS/redirects; DNS rollback observed; no fixture domains remain.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-048 — Authenticated cache and cookie separation

**Task IDs:** AWS-006,SEC-003

**Prerequisites:** B02/B05; two accounts and actual edge

**Required observation:** Account A response is never cached to B/anonymous; dynamic SSE/api uncached; cookies secure and forwarded paths/headers correct.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-049 — WAF/rate/human limits and origin bypass

**Task IDs:** AWS-007,SEC-007

**Prerequisites:** B02/B05; controlled staging abuse clients

**Required observation:** Abusive requests are bounded with trusted real viewer IP; forged forwarding headers and direct-origin attempts fail.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-050 — Approved-country DNS/TLS/product/checkout probes

**Task IDs:** QAS-011,REL-001

**Prerequisites:** B02/B05/B08; regional test agents; actual eligibility matrix

**Required observation:** Each selected regional agent records actual timing/availability and permitted identity/AI/merchant paths; unsupported countries are handled as approved.

**Status:** Pending real acceptance; not executed by this handoff

## loadAndAutoscaling

### LIVE-051 — Representative authenticated API/DB load

**Task IDs:** QAS-008,DAT-009

**Prerequisites:** B01/B02; approved load/cost targets and fixtures

**Required observation:** Latency/error/pool/queue/connection budgets measured with representative safe tenant data; no readiness-only benchmark claimed as product capacity.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-052 — AI/execution multi-tenant saturation/fairness

**Task IDs:** RUN-008,QTA-005

**Prerequisites:** B01/B02/B03/B08; real fleet and provider quota

**Required observation:** Per-user/global budgets and lanes enforce at load; task scale ceilings and rejection/recovery match approved capacity/cost.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-053 — Autoscaling ceilings and emergency stops

**Task IDs:** AWS-016,QTA-006

**Prerequisites:** B02/B03/B08; approved budgets/scale window

**Required observation:** Actual task/runner maxima, zero-budget/off controls and alert thresholds prevent unbounded admission/spend; reopen only after recovery checks.

**Status:** Pending real acceptance; not executed by this handoff

## backupRestoreAndRollback

### LIVE-054 — RDS snapshot/PITR and S3/version restore

**Task IDs:** AWS-015,DAT-010

**Prerequisites:** B02/B08; recovery configuration; disposable restore target

**Required observation:** Measured RPO/RTO meet approved targets; restored identity/ledger/jobs/files reconcile without duplicated external dispatch.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-055 — Second-region backup/KMS recovery

**Task IDs:** AWS-015,SEC-011

**Prerequisites:** Regional-copy implementation; B02/B08

**Required observation:** Copied encrypted backups can be restored privately by approved role in selected second region; lost primary/key access scenario measured.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-056 — Deleted-user restoration and legal retention

**Task IDs:** AUT-008,SEC-011

**Prerequisites:** B02/B08; approved retention/deletion policy

**Required observation:** Tombstones/consent/deletion state reapply after restore; erased customer content is not republished; retained accounting is justified/audited.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-057 — Failed image/config/migration release and rollback

**Task IDs:** AWS-005,QAS-009

**Prerequisites:** B02/B09; staging rollback window and approved images

**Required observation:** Failed stability/smoke initiates safe previous-task restore; operator verifies recovery and compatible schema/data; immutable evidence records actual result.

**Status:** Pending real acceptance; not executed by this handoff

## alertsAndIncidentDrill

### LIVE-058 — Latency/queue/error/spend/finance alert delivery

**Task IDs:** AWS-014,REL-005

**Prerequisites:** Dashboard/alert source completion; B02/B07/B08

**Required observation:** Meaningful emitted metrics trigger approved recipients/on-call and recovery; raw source/secrets absent from logs/dashboards.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-059 — SES/support delivery bounce/complaint/retry recovery

**Task IDs:** AWS-012,ENV-007

**Prerequisites:** Support delivery completion; B02/B07

**Required observation:** OTP/support messages deliver to permitted external inboxes; bounce/complaint suppression and outbox retry/dead letter recover correctly.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-060 — Incident drill and operating-window reconciliation

**Task IDs:** REL-005,REL-006

**Prerequisites:** B02/B03/B04/B07/B08; operating responsibility

**Required observation:** Named operator follows runbook, measures diagnosis/recovery, resolves finance/provider exceptions and records follow-up without fabricated SLA.

**Status:** Pending real acceptance; not executed by this handoff

## protectedOidcCi

### LIVE-061 — Protected OIDC environment/branch/role denial

**Task IDs:** AWS-013,ENV-010

**Prerequisites:** B02/B09; selected owner repository/trust

**Required observation:** Only exact authorized repository/main/environment assumes narrow role; untrusted branch/fork/token fails; no long-lived secret in repo.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-062 — Verified source-to-image-to-deployment binding

**Task IDs:** AWS-003,SEC-010

**Prerequisites:** B01/B02/B09; actual pipeline and artifact validation

**Required observation:** Protected CI tests/scans at exact SHA; attestations/digests/gates match promoted tasks; altered evidence/image is rejected.

**Status:** Pending real acceptance; not executed by this handoff

## productAcceptance

### LIVE-063 — Reference layout/keyboard at four viewports and supported engines

**Task IDs:** QAS-002,WEB-017,QAS-010

**Prerequisites:** Browser automation completion; approved browser tools/CI; reference archive

**Required observation:** Public pages, paired editors, sidebar and assistant remain usable; visual diffs/actions/focus/zoom/screen-reader findings resolved.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-064 — 72-language editor/export and Unicode boundaries

**Task IDs:** EDT-003,EDT-007,EDT-010

**Prerequisites:** Grammar/source completion; target browser matrix

**Required observation:** Offered grammar/fallback honest; correct extensions and code-point caps hold for input/instructions/context, paste/upload/fullscreen and downloads.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-065 — Comment parser adversarial fixtures in actual browser

**Task IDs:** TOL-009,SEC-005

**Prerequisites:** Actual built frontend/browser matrix

**Required observation:** Supported 26 grammars preserve strings/regex/interpolation/shebangs/non-comment text; unsupported formats explicitly reject.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-066 — PDF downloaded bytes and browser-print parity

**Task IDs:** PDF-007,PDF-002,PDF-006

**Prerequisites:** PDF parity completion; supported browsers and file inspection

**Required observation:** 50k input, five sizes/margins, both themes, title/lines, long lines/page breaks/glyphs/colors validated in actual exported files/print.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-067 — Account reload/second device and race-safe history/notes/chat

**Task IDs:** CHT-003,HIS-003,WRK-006

**Prerequisites:** Recovery/persistence completion; B02; two devices/test accounts

**Required observation:** Saved source/results/versions/preferences/pins/notes/chats paginate/restore correctly; late responses do not switch owned context.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-068 — Real file quarantine/direct upload/ZIP failure matrix

**Task IDs:** FIL-002,FIL-008,SEC-005

**Prerequisites:** B02; actual S3 and native race tests

**Required observation:** Wrong length/checksum/binary/path/symlink/duplicate/ratio/CRC/expired URL reject; staged failures recover; exact owned revision enters context.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-069 — Share snapshot/expiry/revoke/token handling

**Task IDs:** SHR-001,SHR-002,SHR-003

**Prerequisites:** B02/B05; real shared domain and two accounts

**Required observation:** Only explicitly shared result visible; no source/attachment leak; fragment token absent from path/query logs; revoke/expiry/noindex work.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-070 — Cloud/local/no-history, evaluation and retention deletion

**Task IDs:** HIS-004,HIS-005,HIS-006,HIS-007

**Prerequisites:** B02/B03/B08; approved retention and cleanup timing

**Required observation:** Mode behavior matches disclosures; opt-out removes candidates; interrupted ephemeral/expired content and derived objects redact; provider exceptions approved.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-071 — Export/deletion ownership and recovery

**Task IDs:** AUT-008,HIS-005

**Prerequisites:** Recovery completion; B02/B08; approved deletion policy

**Required observation:** Full-reload job recovery, expiry, bulk/individual redaction, session revoke and second-account denial work with no private auth/provider fields exported.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-072 — Tenant/XSS/prompt-context/redaction attack cases

**Task IDs:** SEC-001,SEC-006,SEC-003

**Prerequisites:** B02; two accounts, malicious synthetic text and actual edge

**Required observation:** B cannot read/mutate A via IDs/SSE/files/jobs/shares/operator views; unsafe Markdown/links and source instructions gain no tool authority or secret.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-073 — Locales/metadata/legal/pricing/assets before public cutover

**Task IDs:** WEB-015,WEB-016,WEB-012,SEC-012

**Prerequisites:** Source completion; B05/B08; owner content/policy approval

**Required observation:** English/French guides and flows complete; correct canonicals/alternates/robots/sitemap/redirects; approved claims/countries/prices and artwork licenses.

**Status:** Pending real acceptance; not executed by this handoff

### LIVE-074 — Limited beta to approved-country expansion

**Task IDs:** REL-003,REL-004,REL-006

**Prerequisites:** All engineering and external acceptance; owner launch decision

**Required observation:** All required tests/evidence reviewed, named operations ready, real beta window observed and reconciled; country expansion only follows actual eligibility/results.

**Status:** Pending real acceptance; not executed by this handoff

