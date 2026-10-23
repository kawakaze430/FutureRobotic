# Quick status and read map

**23 October 2026 bounded cloud verification update:** Native PostgreSQL 16.15 ran all four backend suites, including completion: **76 passed, 0 failed, 1 skipped** (dedicated external restart/failover). Distinct native connections and transaction-lock exclusion passed. Container builds are **BLOCKED_ENVIRONMENT** by `SELF_SIGNED_CERT_IN_CHAIN` during npm access to `registry.npmjs.org` inside the stock Alpine build stages. Sandbox gateway/signing configuration is absent. No application source or feature status changed. See [CLOUD_RETURN.md](../CLOUD_RETURN.md) and `cloud-only/results/current-run/summary.json`; this update supersedes historical statements that native PostgreSQL was unavailable in earlier environments. Production and all other acceptance gates remain pending.

**Build03: 73 Implemented / 59 Partial / 64 Blocked / 0 Not started, 196 total.** Application source is unchanged in this handoff. No AWS production deployment or real provider/merchant/native acceptance exists.

The private Sites Worker/browser preview is separate from the portable Fastify/PostgreSQL backend. Source/local evidence is not deployed/live evidence. Build03 recorded 100 automated passes; the later 77-backend + 4-infrastructure checks repeat a subset. Six templates synthesize offline; native database/runner gates exit 2.

| Area | Implemented | Partial | Blocked | Total |
| --- | ---: | ---: | ---: | ---: |
| External access and environment | 1 | 0 | 9 | 10 |
| Quality and release verification | 1 | 3 | 7 | 11 |
| Portable backend contracts | 5 | 2 | 0 | 7 |
| Authentication and accounts | 2 | 5 | 2 | 9 |
| Database and durable jobs | 5 | 3 | 2 | 10 |
| Shared editor and result controls | 10 | 2 | 0 | 12 |
| Signed-in workspace | 5 | 2 | 0 | 7 |
| Right-side AI chatbot | 5 | 2 | 2 | 9 |
| AI coding tools | 5 | 2 | 5 | 12 |
| Files and context | 5 | 2 | 3 | 10 |
| History and privacy preferences | 5 | 1 | 1 | 7 |
| Code-to-PDF | 6 | 1 | 0 | 7 |
| Execution service | 1 | 4 | 5 | 10 |
| Billing and subscriptions | 0 | 6 | 6 | 12 |
| Quotas and AI cost control | 0 | 4 | 3 | 7 |
| Public website and discovery | 11 | 5 | 2 | 18 |
| Security and data handling | 2 | 7 | 3 | 12 |
| Shared results | 3 | 0 | 0 | 3 |
| AWS platform and delivery | 0 | 6 | 10 | 16 |
| Launch and operations | 1 | 2 | 4 | 7 |

## Read efficiently

Start with PROJECT_HANDOFF.md and ARCHITECTURE_AND_SETUP.md. NEXT_20_TASKS.md proposes the next source batch. Use TASK_INDEX.csv to find IDs, then inspect full evidence/remaining work/acceptance in CURRENT_TASK_REGISTER.json or its Markdown edition. Both contain the same 196 items; do not spend context loading duplicate registers. Original field wording is preserved; 35 reviewed clarifications explain historical descriptions.

PRODUCTION_TEST_MATRIX contains 74 pending real scenarios, grouped into 12 existing release-validator groups plus full product acceptance. Read the scenarios relevant to the selected work now and the complete matrix before release. CROSS_AI_PROMPTS.md defines the handoff/output contract.

## Access that cannot be supplied by code

B01 native Docker/gVisor test host; B02 scoped AWS authority/config; B03 protected approved AI provider/quota; B04 merchant onboarding/sandbox/live authority; B05 domain; B06 OAuth applications; B07 verified sender/support mailbox; B08 business/country/pricing/fair-use/refund/retention/legal/asset decisions; B09 protected owner repository/OIDC trust. The coding model owns engineering and actual test/deployment execution after access.

Every substantive implementation reply must report evidence-based status, actual checks/limits, blockers/next work, and a complete cumulative source ZIP with provenance and SHA-256. For unchanged source, link the last verified complete ZIP and say unchanged. Never fabricate file delivery or test/deployment evidence.
