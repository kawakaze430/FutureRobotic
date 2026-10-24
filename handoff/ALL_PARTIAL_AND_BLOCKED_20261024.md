# All open Partial and Blocked tasks — FutureRobotic AI
**Source snapshot:** c1ac4ba86d362ee27df8f1ac17289280b9684101 on main, checked 24 October 2026. Canonical source: handoff/CURRENT_TASK_REGISTER.json. This inventory derives from that register. It is not evidence that completion has occurred.

**Totals:** 75 Implemented / 57 Partial / 64 Blocked / 0 Not started = 196. The original Build03 and 73/59 numbers are historical; 75/57 is current. All stable task IDs are preserved. No status reclassification occurred in this inventory.

## How to interpret
- Partial: an implementation or accepted portion exists; the listed remaining acceptance must be demonstrated.
- Blocked: the external test/input/permission cannot currently be executed. Independent source work may still remain and must continue.
- 10 Partial rows have no explicit B01–B09 blocker tag: AUT-001, EDT-003, EDT-011, WRK-006, CHT-005, WEB-015, WEB-017, QAS-002, QAS-010, SEC-003. This means **not blocker-tagged**, not that they can all be marked Implemented today.
- The remaining 47 Partial rows have at least one dependency in the task register. Most have source portions that can be advanced without accounts. Some Blocked rows depend only on native/approved hosts and could be accepted in authorized CI; never convert a sandbox fixture into production acceptance.
- The 64 Blocked rows are not "not started" and cannot be counted as complete solely because source/tests exist.
- The last new SEC-003 hardening commit c1ac4ba86d362ee27df8f1ac17289280b9684101 passed TypeScript/Node/container/audit/lint but its Chromium hosted job failed because "Chromium did not start"; no successful browser acceptance for that SHA is claimed.

## Engineering source that can proceed independently
Typed contracts already completed (API-003). Highest-priority independent work, avoiding duplicate completed implementation: source-linked anonymous AI/runner dispatch (QTA-001/QTA-003/RUN-005/SEC-007), 72-language editing (EDT-003), browser interruption/cancellation (EDT-011), attachment races/accessibility (CHT-005), full French locale (WEB-015), deterministic four-viewport/browser regression (QAS-002/QAS-010/WEB-017), checker quality harness (TOL-012), guarded operator enrollment/console (AUT-009/API-006/SEC-009), support outbox (WEB-010), authoritative reconciliation adapters (BIL-010/BIL-012/REL-006), first-deploy bootstrap (AWS-005/AWS-001), metrics/alerts (AWS-014), regional recovery source (AWS-015), five pinned runtime definitions/catalog (RUN-002/RUN-003). Each still needs suitable acceptance; do not reclassify on source alone.

## 57 Partial tasks (complete ID, goal, remaining scope, gates)
| ID | Category | Feature | Remaining evidence or engineering | Gate(s) |
| --- | --- | --- | --- | --- |
| AUT-001 | Authentication and accounts | Portable public signup, login and logout | Complete real public account/browser integration outside Sites, recovery/linking UX and deployed identity/sender acceptance. Do not rebuild the session service merely because the original field is stale. | — |
| AUT-008 | Authentication and accounts | Account export and deletion | Authoritative merchant cancellation/reconciliation, deployed deletion/backup/provider retention acceptance remain deferred. | B02/B04/B08 |
| DAT-004 | Database and durable jobs | Files, revisions, extraction and share records | Verify actual S3/KMS/CORS/presign/version cleanup and native races; finish approved parser scope. Binary document parsing/malware scanning is not implemented. | B02 |
| DAT-005 | Database and durable jobs | Plans, prices, subscriptions and provider events | Complete approved plan-change/proration/grace behavior and authoritative reconciliation; prove native concurrent events and actual merchant lifecycle. | B01 |
| EDT-003 | Shared editor and result controls | Syntax highlighting in editable source panels | Complete syntax grammar/color coverage for the entire 72-language catalog and replace generic output highlighting where required. | — |
| EDT-011 | Shared editor and result controls | Progress, cancellation, errors and retry | Finish resilient browser interruption/session races and run real provider/edge progress, stop/retry/reconnect acceptance without duplicate dispatch or charges. | — |
| WRK-006 | Signed-in workspace | Personal notes tied to results | Finish browser acceptance for remote/provider tool results, interrupted streaming and full tool/language/device matrix. Local/notes source is implemented; actual provider/device acceptance is deferred. | — |
| WRK-007 | Signed-in workspace | Plan card, balance and account navigation | Verify UI after real paid activation, renewal, past-due and cancellation events in staging. | B02/B04 |
| CHT-005 | Right-side AI chatbot | Attach, inspect and remove chat files | Complete multi-file/replace/accessibility and stale-selection/race browser acceptance against the deployed account backend; do not start from the old local-only attachment description. | — |
| TOL-004 | AI coding tools | Code checking with issues and corrected snippets | Grounded unseen live-model evaluation remains required. Human-authored division-by-zero fixture parsing is not proof that a real model diagnoses the bug. | B03 |
| TOL-012 | AI coding tools | Grounded tool evaluation suite | Build the unseen grounded evaluation fixtures, scoring thresholds and actual provider evaluation run. | B03 |
| RUN-002 | Execution service | Python, JavaScript, C, C++ and Java remote runtimes | Produce five pinned/measured runtime release artifacts and adapters/catalog, scan/build/deploy on the approved sandbox host and run native acceptance. | B01 |
| RUN-003 | Execution service | Searchable five-language runner selector | Publish verified versions from digest-pinned built artifacts, keep image/catalog mapping consistent and validate search/selection in browser. | B01 |
| BIL-011 | Billing and subscriptions | Billing account page and allowance display | Verify actual provider invoice/portal, tax, payment-method and renewal states against merchant sandbox. | B04 |
| QTA-003 | Quotas and AI cost control | Plan request and context limits | Wire guarded anonymous AI/execution dispatch. Implement final approved Standard-vs-Advanced and paid-execution policy; current AI runs all use the credit reservation bucket. | B02/B03/B08 |
| QTA-004 | Quotas and AI cost control | Durable reservation, settle and release ledger | Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely. | B01 |
| WEB-010 | Public website and discovery | Contact page and message form | Implement acknowledgement outbox/delivery recovery/status and prove verified-sender support delivery/bounce/complaint behavior. | B07 |
| WEB-015 | Public website and discovery | English and French website localization | Implement complete French strings, locale routing/switching/persistence, translated guides/help and language metadata. | — |
| WEB-016 | Public website and discovery | Search metadata, sitemap and indexing policy | Finish framework static-page canonical coverage; configure the actual approved domain and verify public redirects/robots/sitemap/indexing after authorized cutover. | B02/B05/B08 |
| WEB-017 | Public website and discovery | Mobile and tablet reference adaptation | Test real viewports, keyboard interactions and assistant overlay behavior. | — |
| QAS-002 | Quality and release verification | Frontend reference screenshots and interaction regression | Automate deterministic screenshot/action baselines and complete four viewport sizes and supported browser engines. | — |
| QAS-010 | Quality and release verification | Accessibility and cross-browser compatibility | Complete WCAG keyboard/screen-reader audit and actual cross-browser/mobile checks. | — |
| SEC-003 | Security and data handling | Secure HTTP, cookies, CSRF and content policies | Complete headers/CORS/CSP/cookie/edge audit in the actual deployment and prove session/cache isolation across browser engines. Keep named partial status until full acceptance. | — |
| SEC-008 | Security and data handling | Consent and privacy implementation | Implement consent where required and document actual region/provider/retention flows. | B08 |
| SEC-010 | Security and data handling | Dependency, container and supply-chain checks | fast-uri3.1.9 fixes four lower-severity advisories but was published2026-10-19T23:05:26.357Z and is not seven days old. Preserve minimumReleaseAge10080; upgrade/test after2026-10-26T23:05:26.357Z (2026-10-27 04:35:26 IST). Image/fleet scanning remains separate. | B01 |
| SEC-012 | Security and data handling | Commercial asset/font rights and own artwork | Replace reference product artwork with own recreated visuals and verify third-party licenses. | B08 |
| API-006 | Portable backend contracts | Account/files/history/billing/support CRUD | Finish protected operator enrollment/console, correction/refund/invoice workflows, support acknowledgement and native deployed account-browser acceptance. | B02/B04/B07 |
| AUT-003 | Authentication and accounts | GitHub login | Verify real GitHub consent/callback and explicit account linking UI. | B05/B06 |
| AUT-005 | Authentication and accounts | Human verification and account-abuse controls | Validate actual hostname/action and viewer-IP handling through CloudFront. OAuth abuse tuning remains. | B02/B05 |
| AUT-009 | Authentication and accounts | Operator access with MFA and role checks | Protected operator enrollment, operator console and live MFA acceptance remain. | B02/B08 |
| CHT-003 | Right-side AI chatbot | Persisted chat sessions and messages | Actual remote streamed chat, full reload/second-device and deployed session/older-page browser scenarios remain deferred. | B02/B06 |
| FIL-008 | Files and context | Upload quarantine and extraction jobs | Verify S3 retries/lifecycle and failed-job recovery; binary parsers/malware scanning are not implemented. | B01/B02 |
| FIL-010 | Files and context | File revisions, checksums and stale-context handling | Run concurrent revision edits against deployed native storage and complete owned file-browser acceptance. | B01/B02 |
| HIS-003 | History and privacy preferences | Cloud history with pagination and cross-device sync | Actual physical second-device/deployed synchronization, other browser engines and remote AI/execution results remain unverified. | B02/B06 |
| PDF-007 | Code-to-PDF | Browser print and Unicode-aware syntax export | Complete syntax/color/glyph/download-print parity and actual downloaded-byte/print browser acceptance. Do not count a successful UI click as downloaded-file evidence. | B01 |
| RUN-005 | Execution service | 10,000-character runner policy and daily usage | Public anonymous execution route and end-to-end native runtime enforcement remain. | B01/B02 |
| RUN-010 | Execution service | Sandbox lifecycle, patching and abuse response | Rehearse residue/patch/drain/key-rotation and host failure on real fleet. | B01/B02 |
| BIL-004 | Billing and subscriptions | Subscription state and entitlement synchronization | Complete all provider states/grace and actual paid lifecycle browser acceptance. | B04/B08 |
| BIL-005 | Billing and subscriptions | Renewal allowances and Advanced monthly usage | Verify actual renewal/annual lifecycle, plan change, proration and grace under approved policy; do not rebuild calendar windows from the older README. | B04/B08 |
| BIL-008 | Billing and subscriptions | Invoices, currencies, tax and country eligibility | Provider-verified billing country, actual tax/invoices and supported-market eligibility remain; multi-currency is not implemented. | B04/B08 |
| BIL-010 | Billing and subscriptions | Payment failures, retries and reconciliation | Provider payment-failure/retry reconciliation API and automated mismatch recovery remain. | B04 |
| BIL-012 | Billing and subscriptions | Chargebacks, fraud and administrative corrections | Complete provider dispute/correction lifecycle, role-limited correction UI and merchant tests. | B04/B08 |
| QTA-001 | Quotas and AI cost control | Anonymous daily tool and execution allowances | Connect both public anonymous dispatch routes with human/abuse protection and recovery; currently execution API requires account. | B01/B03 |
| QTA-006 | Quotas and AI cost control | Provider/model spending ceiling and emergency stop | Reconcile estimates to real model pricing/invoices and verify emergency stop across deployed workers. | B02/B03 |
| WEB-008 | Public website and discovery | Detailed plan comparison table | Merchant prices must be approved; file capacity and annual/monthly allowance behavior must match every published comparison cell. | B04/B08 |
| AWS-001 | AWS platform and delivery | Separate staging and production infrastructure as code | Finish bootstrap/drift/retention protections and review/apply owner-specific change sets. Offline fixture is never deployable production evidence. | B02/B05 |
| AWS-005 | AWS platform and delivery | ECS Fargate web/API services and ALB health | Codex must implement an initial bootstrap workflow separate from the existing service update workflow, then prove staging rollout/health/rollback. | B01/B02 |
| AWS-007 | AWS platform and delivery | WAF, origin restriction and public abuse limits | Tighten managed-origin SG after creation and demonstrate direct-origin/abuse denial in staging. | B02/B05 |
| AWS-012 | AWS platform and delivery | SES domain, DKIM and delivery events | Verify domain, SES production sending, actual delivery/bounce/complaint handling and support mailbox. | B02/B05/B07 |
| AWS-014 | AWS platform and delivery | Metrics, logs, alerts and synthetic checks | Codex must complete latency/financial dashboards and alert wiring, then measure real delivery/synthetic checks. | B02/B07 |
| AWS-015 | AWS platform and delivery | Backups, restore and regional disaster recovery | Codex must implement second-region backup/key-copy configuration and then run measured restores with deleted-user reconciliation. | B02/B08 |
| QAS-008 | Quality and release verification | Load, saturation and autoscaling checks | Measure native DB, AI/runner saturation, fairness and ECS autoscaling at approved staging targets. | B01/B02/B03 |
| SEC-005 | Security and data handling | Upload/archive and content extraction safety | Audit native parser resource behavior, S3 retry races and any future binary extraction/malware pipeline. | B01/B02 |
| SEC-007 | Security and data handling | Account abuse, bot and spend protection | Complete anonymous dispatch integration and verify edge client-IP, WAF and provider/runner costs under deployed abuse. | B01/B02/B03 |
| SEC-009 | Security and data handling | Security audit trail and operator actions | Protected operator enrollment/console, native privilege checks and observed CloudTrail/alert review remain. | B01/B02 |
| REL-005 | Launch and operations | Support, incident response and on-call runbooks | Assign actual support/on-call contact; wire mailbox/alerts and perform an incident drill. | B02/B07/B08 |
| REL-006 | Launch and operations | Post-launch reconciliation and maintenance | Implement authoritative provider/merchant reconciliation and audited corrections, then observe real operating-window mismatches, alerts and maintenance. | B02/B03/B04 |

## 64 Blocked tasks (complete ID, goal, remaining scope, gates)
| ID | Category | Feature | Remaining evidence or engineering | Gate(s) |
| --- | --- | --- | --- | --- |
| ENV-001 | External access and environment | Docker image build and execution verification | Use a Docker-capable CI runner or owner environment. Image files can be authored before this is resolved. | B01 |
| ENV-002 | External access and environment | AWS account deployment and infrastructure verification | Owner supplies a scoped role/CI OIDC setup and account budget. Infrastructure code can proceed. | B02 |
| ENV-003 | External access and environment | Real AI tools and chatbot provider verification | Provide an approved server secret and usable model quota. Adapter work does not require exposing a key. | B03 |
| ENV-004 | External access and environment | Live subscription, renewal and refund verification | Approved merchant account, live price IDs, signing secret and controlled live test authorization required. | B04 |
| ENV-005 | External access and environment | Production domain and DNS control | Owner selects a domain and supplies DNS control through its normal account. | B05 |
| ENV-006 | External access and environment | Google and GitHub production OAuth credentials | Create owner-controlled OAuth applications with verified production callback URLs. | B06 |
| ENV-007 | External access and environment | Transactional email delivery and sender approval | Verify sender domain and request SES production access; configure bounce/complaint handling. | B07 |
| ENV-008 | External access and environment | Business, country, pricing and policy approval | Owner supplies business identity, merchant eligibility, supported countries, refund and retention decisions. | B08 |
| ENV-010 | External access and environment | CI repository and deployment-role trust | Choose owner repository/CI and authorize a narrowly scoped AWS OIDC trust policy. CI files can be written beforehand. | B09 |
| QAS-006 | Quality and release verification | Live low-value payment and refund verification | Run owner-authorized live purchase/refund after sandbox gates; do not fabricate proof. | B04 |
| CHT-002 | Right-side AI chatbot | Contextual real follow-up chat | Connect portable API and real-provider verification. | B03 |
| TOL-001 | AI coding tools | Arbitrary source-to-target code conversion | Run unseen semantic conversions against the configured approved provider and isolated/trusted test harness; implement any schema/language/output validation gaps found. | B03 |
| TOL-002 | AI coding tools | Natural-language code generation | Codex can complete structured output/language validation and runnable-result integration without credentials; actual unseen generation quality/cost needs B03. | B03 |
| TOL-003 | AI coding tools | Code explanation with examples and complexity | Complete output/evaluation contract as needed and run actual provider usefulness/complexity/example acceptance; do not present reference-site output as ours. | B03 |
| TOL-005 | AI coding tools | Complete corrected code from fixer | Prove real provider fixes against unseen defects/constraints and native supported execution; verify no unmeasured claim of successful tests. | B03 |
| FIL-006 | Files and context | Plan-based file and storage limits | Run native concurrent direct/quarantine/revision/deletion and real S3 race acceptance; validate final approved entitlements. | B01/B02 |
| RUN-004 | Execution service | stdout, stderr, exit code and elapsed time | Exercise the actual signed isolated gateway for all five runtimes and verify every failure outcome. | B01/B02 |
| RUN-009 | Execution service | No network, packages or interactive stdin policy | Enforce equivalent remote egress/installation/stdin restrictions and publish limits. | B01/B02 |
| BIL-001 | Billing and subscriptions | Versioned Free, Pro and Premium catalog | Owner approves prices/entitlements and merchant IDs. Codex must align UI/server/merchant and policy tests. Multi-currency remains unimplemented; do not create a second catalog from the stale text. | B04/B08 |
| QTA-002 | Quotas and AI cost control | Free-account initial credits | Prove native multi-connection signup/login/replay with real public identity acceptance; do not reimplement the starter ledger. | B01 |
| QTA-005 | Quotas and AI cost control | Distributed rate and concurrency limits | Prove separate replicas/native connections, lease loss, pool failure and real load behavior before calling limits distributed in production. | B01/B02 |
| WEB-012 | Public website and discovery | Production Privacy Policy and Terms | Replace preview terms with owner-approved business, country, payment and retention language. | B08 |
| WEB-018 | Public website and discovery | Partnerships or affiliate destination | Owner decides actual program/destination; Codex wires only approved application/payout promises and tests links. | B08 |
| SEC-002 | Security and data handling | Secret management and short-lived AWS roles | Use AWS Secrets Manager/KMS and task roles; never send keys to browser or persist in Git. | B02/B09 |
| SEC-004 | Security and data handling | Untrusted code isolation verification | Threat-model and test remote runner independently of trusted API containers. | B01/B02 |
| AUT-002 | Authentication and accounts | Google login | Verify owner Google app on the exact staging/production domain. | B05/B06 |
| AUT-004 | Authentication and accounts | Email one-time-code login | Verify real sender delivery, human verification and email login in staging. | B05/B07 |
| DAT-009 | Database and durable jobs | Indexes, pooling and paginated query plans | Measure native multi-connection query/pool budgets at representative staging load. | B01/B02 |
| DAT-010 | Database and durable jobs | Backup, point-in-time recovery and restore drill | Execute measured RDS/S3 restoration and reconcile usage/payment/deleted accounts. | B02/B08 |
| CHT-007 | Right-side AI chatbot | Stream, stop, retry and recover chat replies | Run browser disconnect/stop/retry scenarios with a real provider through CloudFront. | B02/B03 |
| TOL-011 | AI coding tools | Provider response streaming | Verify actual provider and CloudFront idle/reconnect/cancellation behavior under load. | B02/B03 |
| FIL-002 | Files and context | Private cloud uploads and downloads | Exercise actual S3/KMS/presigned CORS and cross-account negative tests; enforce final plan file capacities. | B02 |
| FIL-009 | Files and context | Cloud file visibility, deletion and cleanup | Verify real versioned S3/backup expiry and all derived cleanup under approved retention. | B02/B08 |
| HIS-007 | History and privacy preferences | Provider data-retention disclosure and exceptions | Owner must approve the actual provider/model contract and route-specific retention/exceptions before enabling AI. | B03/B08 |
| RUN-006 | Execution service | Separate execution worker fleet and network boundary | Bake/scan approved host/image, apply actual networking/IAM and prove job denial of DB, private services, metadata and egress; policy source is not isolation proof. | B01/B02 |
| RUN-007 | Execution service | CPU, memory, process, disk and output limits | Run all five native runtimes and resource/disk/fork/network abuse probes on isolated host. | B01/B02 |
| RUN-008 | Execution service | Execution queue, fairness and concurrency admission | Measure native multi-client fairness, queue saturation/rejection and actual gateway capacity. | B01/B02 |
| BIL-002 | Billing and subscriptions | Secure hosted checkout | Merchant sandbox checkout, default checkout integration/domain and verified-country restrictions remain. | B04 |
| BIL-003 | Billing and subscriptions | Signed, idempotent payment webhooks | Verify actual sandbox event delivery/retries/key rotation and provider reconciliation. | B04 |
| BIL-006 | Billing and subscriptions | Upgrade, downgrade and proration policy | Owner must approve upgrade/downgrade/proration rules; then implement provider preview/confirmation and sandbox settlement. | B04/B08 |
| BIL-007 | Billing and subscriptions | Cancel, resume and self-service billing portal | Verify cancel/resume/invoice/access-end behavior and approved cancellation policy in sandbox. | B04 |
| BIL-009 | Billing and subscriptions | Refund policy and refund processing | Owner must approve refund eligibility and allowance treatment; implement refund requests/reconciliation and authorized sandbox/live rehearsal. | B04/B08 |
| QTA-007 | Quotas and AI cost control | Economically viable Standard fair-use policy | Owner approves final policy/pricing. Codex supplies configuration/enforcement/cost scenarios and real model/invoice reconciliation; never simply remove credit controls. | B03/B08 |
| AWS-002 | AWS platform and delivery | Portable web/API Dockerfiles and local compose | Build images and run compose/migration/container smoke on Docker host. | B01 |
| AWS-003 | AWS platform and delivery | ECR image registry and artifact provenance | Bootstrap retained repositories, pin build/runtime inputs, execute protected builds, verify attestations and review real vulnerability findings before promotion. | B01/B02/B09 |
| AWS-004 | AWS platform and delivery | VPC, private service/database subnets and egress | Apply/test egress, service rules, peering, managed origin SG and no DB route from runner. | B02 |
| AWS-006 | AWS platform and delivery | Route53, ACM and CloudFront edge distribution | Activate domain/cert and test actual signed-in cache separation and streaming globally. | B02/B05 |
| AWS-008 | AWS platform and delivery | RDS PostgreSQL Multi-AZ and migrations | Native multi-client/failover and owner-controlled migration task/privilege verification. | B01/B02 |
| AWS-009 | AWS platform and delivery | Private S3 buckets and lifecycle policies | Actual bucket public-access/CORS/key/presign/version cleanup checks. | B02 |
| AWS-010 | AWS platform and delivery | Shared limiter, SQS queues and scheduler | Multi-replica native contention, SQS notification loss/replay and worker failure acceptance. | B01/B02 |
| AWS-011 | AWS platform and delivery | Secrets Manager and configuration separation | Verify real least privilege/KMS/execution role access and bundled asset secret scan in deployed accounts. | B02/B09 |
| AWS-013 | AWS platform and delivery | CI test/build/scan and OIDC deployment workflow | Current owner-repository CI verification passed all seven jobs at397d0e1, including actual local browser/native/container gates. Protected production environments/OIDC role assumption and untrusted-branch denial, first deploy, rollout/failed-smoke rollback and B02/B09 operational acceptance remain pending. | B01/B02/B09 |
| AWS-016 | AWS platform and delivery | Budgets, autoscaling ceilings and runner kill switch | Observe actual budget/scale/kill-switch behavior and approve cost/capacity targets. | B02/B03/B08 |
| QAS-003 | Quality and release verification | Database/service integration and migrations | Native multi-process contention/replay/settlement/killed-transaction rollback, actual restart and full container gates verified locally and in hosted CI. Actual RDS production privileges/load/failover and applicable live matrix acceptance remain pending. | B01/B02 |
| QAS-004 | Quality and release verification | Real provider end-to-end quality and failures | Real provider key/quota/approved model and retention are required to run quality/cost end-to-end acceptance. | B03/B08 |
| QAS-005 | Quality and release verification | Checkout/webhook sandbox integration | Merchant sandbox purchase/renewal/cancel/refund reconciliation remains unperformed. | B04 |
| QAS-007 | Quality and release verification | Five-runtime isolation and resource-abuse tests | Execute native functional, loop/memory/fork/disk/output/metadata/network/residue probes and inspect evidence. | B01/B02 |
| QAS-009 | Quality and release verification | Backup restore and rollback drills | Perform real snapshot/PITR/S3 restoration and failed-release rollback drills with measured invariants/RPO/RTO. | B02/B08 |
| QAS-011 | Quality and release verification | Public-country performance and availability probes | Need a deployed approved domain/service-country matrix and regional test agents for actual measurements. | B02/B05/B08 |
| SEC-011 | Security and data handling | Backup confidentiality and deletion policy | Approve backup expiry/deletion disclosure and prove private/audited restore with deleted-user reconciliation. | B02/B08 |
| REL-003 | Launch and operations | Staging acceptance and private beta | Provision staging and complete real signup/eight tools/chat/files/history/shares/billing acceptance with recorded beta evidence. | B02/B03/B04/B06/B07 |
| REL-001 | Launch and operations | Approved launch countries, currency and service matrix | Owner must choose approved countries/currency/service matrix and verify provider/merchant eligibility. | B04/B08 |
| REL-002 | Launch and operations | Owner-reviewed release configuration and prices | Owner must review actual business/domain/provider/merchant/prices/limits/retention configuration before release. | B02/B03/B04/B05/B08 |
| REL-004 | Launch and operations | Controlled worldwide production launch | All measured release gates and owner approvals must pass before public AWS launch. No worldwide production exists. | B02/B03/B04/B05/B08/B09 |

## Exact external gates
| Gate | Missing prerequisite | Authority |
| --- | --- | --- |
| B01 | Approved Docker/native PostgreSQL/isolated runner execution host | Agent/CI environment operator; owner if a host grant is necessary |
| B02 | Scoped AWS role/OIDC, approved region and budget | Owner |
| B03 | Approved AI provider/model, protected key, quota, retention | Owner/provider |
| B04 | Paddle merchant sandbox/live access, prices, signing, payment authority | Owner/merchant |
| B05 | Domain choice and DNS | Owner |
| B06 | OAuth applications for GitHub/Google with verified callbacks | Owner |
| B07 | Verified sender, SES/support mailbox and events | Owner |
| B08 | Business identity, launch countries, prices, tax/fair-use/refunds/retention/assets | Owner |
| B09 | Protected repo environments and AWS OIDC trust | Owner |

**Most recent applicable hosted pass (reused):** Seven jobs on 397d0e1, https://github.com/kawakaze430/FutureRobotic/actions/runs/40069616534. Native 91 pass / 1 existing skip, 92 PGlite, 41 UI, 10 Chromium, six offline synth templates, container checks. This evidence is NOT a fresh pass for c1ac4ba86d362ee27df8f1ac17289280b9684101; the newer failure must be diagnosed.

**Acceptance discipline:** Stable IDs change only on scope-complete demonstrable acceptance, release matrix rows need individually source-bound factual observations, native tests require disposable database and untrusted code must never execute on trusted app hosts. Approved region/countries, live provider, merchant and AWS are not provisioned merely because CDK or adapters exist.
