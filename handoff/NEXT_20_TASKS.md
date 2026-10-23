# Proposed next 20 engineering work packages

This handoff does not implement these packages or change task counts. Each package maps to existing stable IDs; it is not 20 additional tasks. Verify source and current environment before starting. Continue independent source work while final live acceptance is blocked. Other remaining scope — full grammar coverage, PDF parity, pricing/policy, privacy and every row in the complete register — stays in scope.

## 1. Complete typed response contracts — API-003

Inventory every endpoint response/error/pagination shape, replace broad/default-any results, generate or validate the browser client against the actual OpenAPI contract.

**Acceptance:** Valid/invalid responses and client build agree across all endpoints; no silent any fallback.

**Dependencies:** Source can proceed; native/deployed contract acceptance follows.

## 2. Include every suite in native/CI verification — QAS-003,AWS-013

Extend the native wrapper to include completion tests and make CI retain source-bound results and blocker/failure exits.

**Acceptance:** All four compiled backend suites run on disposable native PostgreSQL; no suite is silently omitted.

**Dependencies:** Wrapper/CI source can proceed; execution needs B01/B09.

## 3. Wire guarded anonymous AI dispatch — QTA-001,QTA-003,SEC-007

Connect durable daily counters to bounded public requests, trusted edge IP/human verification, idempotency, budgets and ephemeral recovery.

**Acceptance:** Two-use policy cannot be bypassed across replicas/retries; spoofed headers and budget-off requests deny safely.

**Dependencies:** Source can proceed; policy/edge/provider acceptance needs B02/B03/B08.

## 4. Wire guarded anonymous execution dispatch — RUN-005,QTA-001

Use the same server abuse boundary with three-use source policy, fair admission and signed job binding; keep user code off the trusted host.

**Acceptance:** Retry uses one reservation; invalid/over-limit requests create no sandbox job; native isolation evidence remains separate.

**Dependencies:** Source can proceed; B01/B02/B08 for final policy/native acceptance.

## 5. Add structured checker output — TOL-004,API-003

Create a bounded issue/severity/location/corrected-snippet schema and validated renderer; preserve original and safe Markdown fallbacks.

**Acceptance:** Malformed or unsupported issue fields fail safely; Unicode locations and severity fixtures render correctly.

**Dependencies:** Source can proceed; real-model usefulness requires B03.

## 6. Build unseen grounded evaluations — TOL-012,QAS-004

Add non-leaking convert/generate/explain/check/fix/chat fixtures, semantic or reviewer rubrics, versioned scoring and provider run metadata.

**Acceptance:** Frozen fixture/scoring policy exists before real runs; test doubles are labeled; generated code is tested only on approved execution hosts.

**Dependencies:** Harness/fixtures can proceed; actual approved provider needs B03 and policy.

## 7. Persist local-tool cloud results and notes — WRK-006,HIS-003

Complete owned local-tool result creation, optimistic notes/version recovery and selected history mode behavior without losing originals.

**Acceptance:** Two-account, reload, conflict and cloud/local/none scenarios preserve the right data and never leak another workspace.

**Dependencies:** Source can proceed; native/device acceptance needs B01/B02.

## 8. Finish race-safe recovery — CHT-003,HIS-003,AUT-008

Guard late session/page responses; recover history/account export jobs after full reload; keep pagination stable during switches/deletion.

**Acceptance:** Out-of-order response fixtures and reload/browser scenarios cannot display or mutate the wrong session/result.

**Dependencies:** Source can proceed; deployed/second-device acceptance needs B02.

## 9. Finish attachment workflow acceptance — CHT-005,FIL-010

Inspect existing cloud attachment controls first; close replace/multi-file/stale-revision/accessibility gaps rather than reimplementing the picker.

**Acceptance:** Selected owned files show included/omitted content and exact revision; removal/replacement/race and keyboard tests pass.

**Dependencies:** Source can proceed; real S3/native races need B01/B02.

## 10. Implement protected operator enrollment — AUT-009,SEC-009

Add an owner-controlled one-time enrollment/rotation/revocation path with audited roles and protected MFA material; no public bootstrap endpoint.

**Acceptance:** Ordinary runtime cannot enroll itself or modify operator secrets; replay/role/rotation negative cases are tested.

**Dependencies:** Source can proceed; protected setup/native privileges need B02.

## 11. Complete operator console — API-006,AUT-009

Add least-privilege operations views/actions with fresh MFA, audit and bounded finance/support data; never repair ledger history.

**Acceptance:** Unauthorized/stale-MFA/cross-role actions deny; permitted actions append audit and idempotent correction events.

**Dependencies:** Source can proceed; merchant/refund policy/actions need B04/B08.

## 12. Add support acknowledgement outbox — WEB-010,AWS-012

Create idempotent delivery jobs, bounded retry/dead-letter/recovery and delivery status; integrate sender events without exposing ticket data.

**Acceptance:** No duplicate acknowledgement on retries; failed delivery can recover; unauthorized ticket access and message floods deny.

**Dependencies:** Source can proceed; external delivery requires B07.

## 13. Add authoritative external reconciliation — BIL-010,BIL-012,QTA-006,REL-006

Fetch/bind provider/merchant outcomes, detect missing/reordered events and invoice/credit mismatches; apply audited idempotent corrections.

**Acceptance:** Uncertain outcomes never blindly resend/refund; duplicate reconciliation is harmless and mismatches are inspectable.

**Dependencies:** Adapter/source can proceed; real fixtures/accounts and policy need B03/B04/B08.

## 14. Implement first-deploy bootstrap — AWS-005,AWS-001,AWS-003

Separate retained repository/image/secret/migration dependencies from steady-state ECS updates; add reviewed stage orchestration and rollback boundaries.

**Acceptance:** A fresh staging account can be provisioned in documented dependency order without placeholder images, serving DB owner credentials or falsified gates.

**Dependencies:** Source can proceed; actual apply requires B02/B09 and approved config.

## 15. Pin and publish runtime/build inputs — RUN-002,RUN-003,SEC-010

Create five pinned runtime artifacts and measured version catalog; pin base/build inputs, generate SBOM/provenance and scan before promotion.

**Acceptance:** Versions come from actual images; exact digests map to selectors; no moving-tag assumption establishes reproducibility.

**Dependencies:** Definitions can proceed; builds/native probes need B01/B09.

## 16. Automate runner drain and rotation — RUN-010,RUN-006

Implement controlled admission stop, active lease drain, image/host/key replacement, probe gate and safe recovery of crashed sent jobs.

**Acceptance:** Failed patch/probe cannot reopen admission; active/uncertain jobs are accounted for without host residue or blind replay.

**Dependencies:** Source can proceed; real fleet exercise needs B01/B02.

## 17. Complete dashboards and alerts — AWS-014,REL-005

Emit bounded latency/error/queue/DB/spend/finance metrics and meaningful dashboards/alerts with known operators; exclude source/tokens.

**Acceptance:** Synthetic alert and incident evidence demonstrates routing; metrics diagnose mismatch/latency without raw user code.

**Dependencies:** Source can proceed; real delivery and budgets need B02/B07/B08.

## 18. Implement regional recovery configuration — AWS-015,SEC-011

Add second-region backup/key-copy configuration, private restore/role procedure and deleted-user/accounting reconciliation.

**Acceptance:** Measured restore can recover approved data while reapplying deletion tombstones; RPO/RTO and key access are observed.

**Dependencies:** Source can proceed; region/policy and restore execution need B02/B08.

## 19. Add deterministic browser regression — QAS-002,QAS-010,WEB-017

Create stable state/action/screenshot baselines for public/workspace/tools/chat/files/PDF at four viewport sizes and supported engines.

**Acceptance:** Keyboard/focus and visual/action assertions pass in the approved browser/CI environment; no fabricated baseline screenshot.

**Dependencies:** Source can proceed; current runtime browser restrictions and real identity still apply.

## 20. Complete French and locale metadata — WEB-015,WEB-016

Centralize all user-facing strings, translate guides/help/account/errors, implement locale route/switch/persistence and correct alternate metadata.

**Acceptance:** No untranslated target flow; English/French routing, link state, guides and approved canonical/noindex policy are tested.

**Dependencies:** Source can proceed; production indexing/domain activation needs B05/B08.

