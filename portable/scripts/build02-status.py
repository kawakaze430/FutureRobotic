"""Apply Build 02 evidence to the immutable Build 01 task snapshot."""
from pathlib import Path
import json,csv,collections
root=Path(__file__).resolve().parents[1]/'docs/release'
baseline=root/'BUILD01_STATUS.json'
if not baseline.exists(): baseline.write_text((root/'FEATURE_STATUS.json').read_text())
data=json.loads(baseline.read_text());tasks={t['id']:t for t in data['tasks']}
original={t['id'] for t in data['tasks'] if t['status']=='Not started'}
implemented=set('EDT-008 CHT-006 TOL-006 TOL-007 TOL-010 FIL-004 FIL-005 HIS-006 SHR-001 SHR-002 SHR-003 PDF-003 PDF-004 PDF-005 WEB-011 WEB-014'.split())
blocked=set('HIS-007 BIL-006 BIL-009 QTA-007 QAS-004 QAS-011 REL-001 REL-002 REL-003 REL-004'.split())
# Each row identifies actual source/evidence and the exact remaining scope.
rows={
'API-006':('portable/src/product-routes.ts; account-services.ts; product.test.ts ownership CRUD fixtures','Complete invoice/refund/admin-correction UI, list/search coverage and deployed account browser acceptance.','B04/B08'),
'AUT-002':('portable/src/public-auth.ts: Google PKCE/state/nonce/JWK adapter; callback replay fixture passes','Verify owner Google app on the exact staging/production domain.','B05/B06'),
'AUT-003':('portable/src/public-auth.ts: verified primary GitHub email; no silent linking fixture passes','Verify real GitHub consent/callback and explicit account linking UI.','B05/B06'),
'AUT-004':('portable/src/public-auth.ts; SES adapter; expiry/replay/five-attempt/Secure-cookie tests pass','Verify real sender delivery, human verification and email login in staging.','B05/B07'),
'AUT-005':('Turnstile adapter, one-use token fingerprints and durable OTP/send windows; flood fixtures pass','Validate actual hostname/action and viewer-IP handling through CloudFront. OAuth abuse tuning remains.','B02/B05'),
'AUT-009':('portable/src/protection.ts: role-gated replay-resistant TOTP; API controls/support gates; audit tests','Protected operator enrollment, operator console and live MFA acceptance remain.','B02/B08'),
'DAT-009':('Bounded pg pool, tenant indexes/pagination; operations.test.ts EXPLAIN ANALYZE with 10,000 rows uses index','Measure native multi-connection query/pool budgets at representative staging load.','B01/B02'),
'DAT-010':('infra/src/stacks.ts encrypted backup/PITR source; ops/RECOVERY.md and restore-record template','Execute measured RDS/S3 restoration and reconcile usage/payment/deleted accounts.','B02/B08'),
'EDT-008':('app/result-reading.tsx; tests/product-ui.test.tsx renders GFM/code and rejects scripts, raw HTML, unsafe links and images','', ''),
'CHT-003':('Account chat CRUD/selected-chat persistence, streamed assistant messages and browser restore wiring; ownership fixture passes','Verify browser reload and second-device behavior against deployed account storage; expand message pagination.','B02/B06'),
'CHT-006':('Shared model registry, allowed-tier UI, server model/context/budget validation; paid/free and context-trimming tests pass','', ''),
'CHT-007':('Persisted SSE events, Last-Event-ID reconnect, stop/cancel, partial assistant state, durable quota finalization; real HTTP fixture','Run browser disconnect/stop/retry scenarios with a real provider through CloudFront.','B02/B03'),
'TOL-006':('app/result-reading.tsx FixResult; changed-line and clean fixed-code extraction tests for missing-colon fixture','', ''),
'TOL-007':('Computed additions/removals and What I Changed text; no fabricated execution/test result; UI fixture passes','', ''),
'TOL-010':('portable/src/product-policy.ts and provider.ts; Standard/Advanced IDs, model mapping, tier/output rules; contract fixtures pass','', ''),
'TOL-011':('provider.ts bounded UTF-8 SSE parser; worker persisted deltas; owned API stream and real loopback HTTP replay tests','Verify actual provider and CloudFront idle/reconnect/cancellation behavior under load.','B02/B03'),
'FIL-002':('Private KMS S3 adapter, bounded signed PUT metadata, integrity download/ownership checks; browser file routes wired','Exercise actual S3/KMS/presigned CORS and cross-account negative tests; enforce final plan file capacities.','B02/B08'),
'FIL-004':('Shared ZIP validator + bounded browser/server inflation, CRC/UTF-8/path/symlink/duplicate/ratio limits; malicious fixtures pass','', ''),
'FIL-005':('Shared dependency/build/secret-name exclusions and explicit import report; browser/server fixtures pass','', ''),
'FIL-008':('Quarantine metadata, signed size/checksum verification, extraction outbox and safe-prefix promotion; integrity fixture passes','Verify S3 retries/lifecycle and failed-job recovery; binary parsers/malware scanning are not implemented.','B01/B02'),
'FIL-009':('Immediate owner-scoped deny/delete, frozen-context redaction and durable object-delete jobs; fixture passes','Verify real versioned S3/backup expiry and all derived cleanup under approved retention.','B02/B08'),
'FIL-010':('Optimistic file revisions, immutable checksums and run-context snapshots in API; stale conflict/deletion fixtures pass','Expose full revision editing/provenance in browser; verify deployed concurrent revisions.','B02'),
'HIS-003':('Paged owner-scoped durable run history and browser load-more/detail/note wiring; API cursor tests pass','Second-device browser acceptance, complete cloud export UI and local-tool history persistence remain.','B02/B06'),
'HIS-006':('Default evaluation opt-out, explicit preference UI, consent snapshot and current-user filtering; opt-in/out fixture passes','', ''),
'HIS-007':('Model disclosure placeholders and Code Privacy state that provider retention is unapproved; AI startup requires approval','Owner must approve the actual provider/model contract and route-specific retention/exceptions before enabling AI.','B03/B08'),
'SHR-001':('Explicit result-only share creation, copy/link UI and owner list; hidden source/attachments excluded in snapshot fixture','', ''),
'SHR-002':('app/shared-result.tsx; fragment-token POST resolver and read-only snapshot; positive/negative API fixture passes','', ''),
'SHR-003':('Expiry/revoke service and owner UI, hashed tokens, noindex API/page/standalone metadata; expiry/replay fixtures pass','', ''),
'PDF-003':('Five font-size presets and PDF-lib embedded font; all size/theme/margin combinations produce valid documents; browser control selected','', ''),
'PDF-004':('Light/dark page fills and readable text colors; 50 combination exports pass PDF parsing; browser Dark setting exercised','', ''),
'PDF-005':('Five measured wrapping/margin presets; multi-page PDF parsing tests and browser Small selection pass','', ''),
'PDF-007':('Embedded Unicode font, glyph rejection/system-font print fallback, escaped print HTML and long-line pagination tests','Verify downloaded bytes and print output in target browsers; complete syntax-color parity and additional glyph coverage. Browser export UI succeeded, automation download-path wait timed out.','B01'),
'RUN-005':('Server admission and shared durable three/day counter, five-language/10k character validation; race/idempotency fixtures pass','Public anonymous execution route and end-to-end native runtime enforcement remain.','B01/B02'),
'RUN-006':('Separate runner VPC/zero-default ASG source, signed short-lived job capability, no app/provider/DB IAM; template/policy tests pass','Bake/scan AMI, deploy private TLS gateway and prove no DB/metadata/network/cross-job access.','B01/B02'),
'RUN-007':('runsc/no-network/read-only/nonroot/cap/PID/CPU/memory/tmpfs/wall/output limits; policy tests and native probe harness','Run all five native runtimes and resource/disk/fork/network abuse probes on isolated host.','B01/B02'),
'RUN-008':('Durable execution queue, one active lane/workspace, oldest admission order and idempotent result state; fixtures pass','Native multi-worker fairness, saturation/recovery and backlog rejection limits remain.','B01/B02'),
'RUN-010':('Disposable container/work dirs, digest pinning, cleanup, zero-default fleet, drain/rebuild incident runbook','Rehearse residue/patch/drain/key-rotation and host failure on real fleet.','B01/B02'),
'BIL-002':('Paddle server-price verification, bound checkout intents, uncertain-request fence, hosted checkout UI; contract tests pass','Merchant sandbox checkout, default checkout integration/domain and verified-country restrictions remain.','B04/B05/B08'),
'BIL-003':('Raw-body Paddle timestamp/HMAC verification, serialized inbox and allowance replay/order fixtures pass','Verify actual sandbox event delivery/retries/key rotation and provider reconciliation.','B04'),
'BIL-004':('Bound paid transactions grant periods; checkout/active update alone cannot mint; cancel/past-due mapping and browser billing view','Complete all provider states/grace and actual paid lifecycle browser acceptance.','B04/B08'),
'BIL-005':('Unique subscription-period grants and stale/replayed event protection tested','Implement scheduled monthly Advanced grants within annual entitlements and verify renewals against merchant.','B04/B08'),
'BIL-006':('ops/POLICY_DECISIONS.json identifies proration/amount-preview prerequisites and keeps changes disabled','Owner must approve upgrade/downgrade/proration rules; then implement provider preview/confirmation and sandbox settlement.','B04/B08'),
'BIL-007':('Owned short-lived hosted customer portal route and browser link; provider customer binding','Verify cancel/resume/invoice/access-end behavior and approved cancellation policy in sandbox.','B04/B08'),
'BIL-008':('Shared proposed USD cents catalog, server live-price check and country allowlist; wrong price/country fixtures pass','Provider-verified billing country, actual tax/invoices and supported-market eligibility remain; multi-currency is not implemented.','B04/B08'),
'BIL-009':('Refund adjustment recording preserves accounting history; policy decision record explicitly disables automatic refunds','Owner must approve refund eligibility and allowance treatment; implement refund requests/reconciliation and authorized sandbox/live rehearsal.','B04/B08'),
'BIL-010':('Uncertain checkout fence, past-due subscription mapping, read-only financial exception queries and incident runbook','Provider payment-failure/retry reconciliation API and automated mismatch recovery remain.','B04'),
'BIL-012':('Signed chargeback/refund/credit adjustment inbox, audit and no ledger deletion; chargeback suspends entitlement','Complete provider dispute/correction lifecycle, role-limited correction UI and merchant tests.','B04/B08'),
'QTA-001':('Durable HMAC subject/day two-AI/three-execution reservation service and concurrency tests','Connect both public anonymous dispatch routes with human/abuse protection and recovery; currently execution API requires account.','B01/B03'),
'QTA-006':('Atomic day spend holds, conservative bounded provider estimates, MFA kill switch and ceiling/finalize/replay tests','Reconcile estimates to real model pricing/invoices and verify emergency stop across deployed workers.','B02/B03'),
'QTA-007':('No unlimited usage claim; bounded output/global ceiling; ops/POLICY_DECISIONS.json leaves per-user paid fair-use open','Owner must approve economical per-user Standard policy and prices; implement final per-user controls and high-usage cost scenario.','B03/B08'),
'WEB-008':('Cards and detailed comparison use shared planCatalog USD cents; browser comparison fixture passes','Merchant prices must be approved; file capacity and annual/monthly allowance behavior must match every published comparison cell.','B04/B08'),
'WEB-011':('Dedicated /code-privacy with actual preview/account/provider/consent/share/provisional retention and deletion flows','', ''),
'WEB-014':('68 observed pair slugs, valid language aliases, dedicated Next routes and standalone prerender metadata; all resolve in test','', ''),
'QAS-003':('64 DB/service fixtures include clean + Build01-to02 upgrade/checksum/replay/ownership/deletion; PostgreSQL WASM passes','Run unchanged suite against native multiple connections and actual containers/RDS.','B01/B02'),
'QAS-004':('ops/ACCEPTANCE.md specifies unseen fixtures, actual quality/cost and failure evidence; provider adapter mock contract tests pass','Real provider key/quota/approved model and retention are required to run quality/cost end-to-end acceptance.','B03/B08'),
'QAS-005':('Paddle raw signature/HTTP route, price/country, bound payment, stale/replay contract tests pass','Merchant sandbox purchase/renewal/cancel/refund reconciliation remains unperformed.','B04'),
'QAS-007':('Five-runtime image/entrypoint, policy/capability tests and signed native-probe harness; never runs jobs on app host','Execute native functional, loop/memory/fork/disk/output/metadata/network/residue probes and inspect evidence.','B01/B02'),
'QAS-008':('100 real loopback readiness requests at concurrency 10: zero errors; 10,000-row indexed history fixture; bounded load script','Measure native DB, AI/runner saturation, fairness and ECS autoscaling at approved staging targets.','B01/B02/B03'),
'QAS-009':('Persistent WASM restart baseline, forward-upgrade test, ECS rollback helper and timed restore record/runbook','Perform real snapshot/PITR/S3 restoration and failed-release rollback drills with measured invariants/RPO/RTO.','B02/B09'),
'QAS-011':('Read-only regional http-probe.mjs and explicit country acceptance scenarios are prepared','Need a deployed approved domain/service-country matrix and regional test agents for actual measurements.','B02/B05/B08'),
'SEC-005':('Bounded ZIP central/local header/ratio/CRC/UTF-8/path/symlink tests; text quarantine integrity/promotion tests','Audit native parser resource behavior, S3 retry races and any future binary extraction/malware pipeline.','B01/B02'),
'SEC-007':('Turnstile/public identity rate guards, shared anonymous counters, model/spend ceiling and MFA controls; fixtures pass','Complete anonymous dispatch integration and verify edge client-IP, WAF and provider/runner costs under deployed abuse.','B01/B02/B03'),
'SEC-009':('Append-only DB audit/ledger guards, MFA role/one-use operator controls and safe metadata logs; tests pass','Protected operator enrollment/console, native privilege checks and observed CloudTrail/alert review remain.','B01/B02'),
'SEC-011':('KMS retained backup resources, restricted runtime grant source, active-content deletion and recovery/tombstone procedure','Approve backup expiry/deletion disclosure and prove private/audited restore with deleted-user reconciliation.','B02/B08'),
'REL-001':('Empty country allowlist/default closed billing; POLICY_DECISIONS and country probe/service scenarios','Owner must choose approved countries/currency/service matrix and verify provider/merchant eligibility.','B04/B08'),
'REL-002':('Versioned release config/gate examples, exact-digest checks and ownerApproved=false policy; incomplete gate test fails closed','Owner must review actual business/domain/provider/merchant/prices/limits/retention configuration before release.','B02/B03/B04/B05/B08'),
'REL-003':('Local service/UI contracts and staging beta acceptance record prepared; owner-private Site preserved','Provision staging and complete real signup/eight tools/chat/files/history/shares/billing acceptance with recorded beta evidence.','B02/B03/B04/B06/B07'),
'REL-004':('Fail-closed release checker, scoped OIDC rollout/rollback source and country expansion acceptance procedure','All measured release gates and owner approvals must pass before public AWS launch. No worldwide production exists.','B02/B03/B04/B05/B08/B09'),
'REL-005':('ops/INCIDENTS.md: support/on-call, AI cost, runner drain, payments, data recovery and availability procedures','Assign actual support/on-call contact; wire mailbox/alerts and perform an incident drill.','B02/B07/B08'),
'REL-006':('ops/check-finance.sql read-only exceptions; completed-run invariant fixture and post-launch reconciliation schedule','Implement authoritative provider/merchant reconciliation and record the first actual operating window with resolved exceptions.','B02/B03/B04')
}
aws={
'001':('Application/Edge/Runner CDK stacks synthesize independently for staging/production; six offline templates','Owner-reviewed change sets, bootstrap/apply/drift/destroy protection and actual environment verification.','B02/B05'),
'002':('Locked pnpm API/web Dockerfiles, compose and standalone web build; container CI definitions','Build images and run compose/migration/container smoke on Docker host.','B01'),
'003':('Immutable/scanned ECR source, exact digest services, buildx SBOM/provenance publication helper','Bootstrap repositories; build/push/scan/verify real image attestations and review findings.','B01/B02/B09'),
'004':('Private app/isolated DB subnets; separate runner VPC/no NAT; network template assertions pass','Apply/test egress, service rules, peering, managed origin SG and no DB route from runner.','B02'),
'005':('Separate web/API/worker Fargate tasks, private ALB targets, health/circuit-breaker and scale ceilings','First-deploy migration/image bootstrap plus actual task/AZ failure and rollout availability test.','B01/B02'),
'006':('Route53/ACM/CloudFront private VPC-origin source; dynamic cache-disabled and hashed-asset cache assertions','Activate domain/cert and test actual signed-in cache separation and streaming globally.','B02/B05'),
'007':('Private ALB, CloudFront VPC origin, IP/auth WAF rates and managed IP reputation source','Tighten managed-origin SG after creation and demonstrate direct-origin/abuse denial in staging.','B02/B05'),
'008':('Encrypted private PostgreSQL16 Multi-AZ production source; CA-verified pool, migrations and restricted runtime bootstrap','Native multi-client/failover and owner-controlled migration task/privilege verification.','B01/B02'),
'009':('Private versioned KMS S3, quarantine expiration, safe text promotion and bounded signed metadata source','Actual bucket public-access/CORS/key/presign/version cleanup checks.','B02'),
'010':('SQL-authoritative quota/outbox/leases; encrypted SQS/DLQ notification bridge and worker scheduler','Multi-replica native contention, SQS notification loss/replay and worker failure acceptance.','B01/B02'),
'011':('Separate task secret fields, no browser secrets, worker-only provider key; runtime/bootstrap IAM source','Verify real least privilege/KMS/execution role access and bundled asset secret scan in deployed accounts.','B02/B09'),
'012':('SES identity/DKIM/configuration-set event destination and OTP mailer source','Verify domain, SES production sending, actual delivery/bounce/complaint handling and support mailbox.','B02/B05/B07'),
'013':('Pinned official Actions revisions, verify/container workflows, exact repo-environment OIDC, gated digest ECS rollout/rollback','Configure protected owner repo/environments, execute CI/scans, prove untrusted branch denial and rollback.','B01/B02/B09'),
'014':('Safe structured metadata logs, encrypted log groups, ALB/queue/DB/service-error SNS alarms and public probe script','Complete latency/financial anomaly dashboards, observed alerts/synthetic checks and recipient confirmation.','B02/B07'),
'015':('Retained encrypted RDS/S3 Backup plan and recovery/rollback/deleted-user runbook','Execute measured restore and configure/test second-region backup/key recovery.','B02/B08'),
'016':('AWS budget alarm, max task/fleet ceilings, provider/runner DB kill switches and spending tests','Observe actual budget/scale/kill-switch behavior and approve cost/capacity targets.','B02/B03/B08')}
for n,value in aws.items(): rows['AWS-'+n]=('infra/src/stacks.ts; runner-stack.ts; '+value[0],value[1],value[2])
assert set(rows)==original,(set(rows)-original,original-set(rows))
for id in sorted(original):
 t=tasks[id]; evidence,remaining,blockers=rows[id]
 t.update(status='Implemented' if id in implemented else 'Blocked' if id in blocked else 'Partial',evidence=evidence,remaining_work=remaining,blockers=blockers,last_reviewed='2026-10-22',verification='BUILD-02: source + recorded local/offline tests; external checks explicitly pending')
 t['owner']='Owner decision/access; Codex after unblock' if id in blocked else 'Codex / CI' if t['status']=='Implemented' else 'Codex remaining engineering; owner external access'
# Refresh existing environment records without adding them to the original 86 batch.
for id,owner,evidence in [
 ('ENV-001','Codex on Docker/gVisor-capable CI or owner host','Docker unavailable; native multi-connection/container/runtime checks remain unperformed. Images and probe source are prepared.'),
 ('ENV-002','Owner supplies AWS role; Codex provisions/tests','Six AWS stacks synthesize offline; no AWS account/deployment role supplied.'),
 ('ENV-003','Owner configures protected AI; Codex verifies','Provider-neutral streaming adapter and mock contracts pass; no live secret/quota/model policy supplied.'),
 ('ENV-004','Owner configures merchant; Codex integrates/tests','Paddle signature/checkout/portal source and contracts pass; merchant credentials and live-test authorization are absent.'),
 ('ENV-005','Owner chooses domain/DNS; Codex configures','Only the generated owner-private Site domain exists; no owned production domain supplied.'),
 ('ENV-006','Owner registers OAuth apps; Codex verifies','Google/GitHub adapters and fixtures pass; owner production OAuth applications are missing.'),
 ('ENV-007','Owner supplies sender/mailbox; Codex verifies','SES OTP source is implemented; verified sender, SES production access and support delivery are missing.'),
 ('ENV-008','Owner approves commitments; Codex implements','Proposed catalog and closed policy/gate configuration exist; business/country/pricing/fair-use/refund/retention decisions are unapproved.'),
 ('ENV-010','Owner selects protected repo/trust; Codex runs CI','Scoped OIDC/workflow source is prepared; protected owner CI environment has not been configured.'),
 ('ENV-009','Codex / CI','Dependencies installed; root/portable/infra TypeScript, 79 tests, existing regression, standalone build and offline synthesis passed.')
]:
 tasks[id].update(owner=owner,evidence=evidence,last_reviewed='2026-10-22')
data.update(baseline='BUILD-02',as_of='2026-10-22',time_zone='Asia/Calcutta',baseline_source_commit='eb8cf88ff02d71bf0bd5e91cedca14afa40444ce',source_ref='Exact final source SHA is recorded in the delivered Build 02 release-manifest.json',production_ready=False,current_release='Build 02 owner-private preview; portable Node/AWS source delivered; no worldwide production',build_tasks=sorted(original),verification_database='PGlite 0.3.16 PostgreSQL WASM; serialized transactions. Native multiple-connection PostgreSQL/RDS remains blocked B01/B02.')
data['totals']={s:sum(t['status']==s for t in data['tasks']) for s in ['Implemented','Partial','Blocked','Not started']}
data['reference_totals']=dict(collections.Counter(t['status'] for t in data['tasks'] if t['scope']=='Reference'))
data['build_outcomes']=dict(collections.Counter(tasks[id]['status'] for id in original))
for p in data['phases']:
 p['current_state']='Build 02 source and local/offline checks recorded; see task-level remaining work and blockers' if p['id'] not in ['P11','P12','P13'] else 'Blocked on actual staging/launch gates; operational source prepared'
for b in data['blockers']:
 if b['id']=='B04': b['evidence']='Paddle source/contracts implemented and mocked tests pass; no owner merchant account or sandbox/live configuration supplied.'
 if b['id']=='B01': b['unblock']='Run pnpm api:test:native, container/compose workflow and signed runner native probes on Docker/gVisor-capable CI; do not ask the owner to implement existing application code.'
(root/'FEATURE_STATUS.json').write_text(json.dumps(data,indent=2)+'\n')
cols=['id','feature','category','scope','status','phase','priority','owner','evidence','remaining_work','acceptance','reference','blockers','last_reviewed','verification']
with (root/'FEATURE_STATUS.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows(data['tasks'])
with (root/'BUILD02_DELTA.csv').open('w',newline='') as f:
 w=csv.writer(f,lineterminator='\n');w.writerow(['ID','Before','After','Evidence','Remaining work','Blockers','Owner'])
 for id in sorted(original):
  t=tasks[id];w.writerow([id,'Not started',t['status'],t['evidence'],t['remaining_work'],t['blockers'],t['owner']])
summary={k:data[k] for k in ['baseline','as_of','total_tasks','totals','reference_totals','build_outcomes','production_ready','verification_database']}
(root/'STATUS_SUMMARY.json').write_text(json.dumps(summary,indent=2)+'\n')
with (root/'BLOCKED_OWNERSHIP.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['id','title','owner','evidence','unblock','can_continue','affected'],lineterminator='\n');w.writeheader();w.writerows(data['blockers'])
print(json.dumps(summary))
