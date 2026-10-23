"""Build the cumulative Build 01 tracker from the immutable Plan 01 snapshot."""
import csv
import json
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'docs/release/PLAN01_STATUS.json').read_text())
changes = {
 'DAT-001': ('Implemented','Two forward-only migrations, advisory migration lock, historical checksums, ownership/business-key constraints. Empty database, rerun, changed checksum and prior-release upgrade fixtures pass.','Native PostgreSQL/RDS migration verification is tracked as B01/B02 before release.'),
 'DAT-002': ('Implemented','Persistent users, verified identities, hashed sessions and one personal workspace per account. Composite tenant keys and two-account negative fixtures pass.','Wire public identity adapters and the existing frontend in AUT-001..004/WRK tasks.'),
 'DAT-003': ('Implemented','Persistent runs, versioned results, optimistic notes, threads/messages. Completed/failed/cancelled runs, notes and chat restore after PGlite restart.','Frontend persistence migration and live chat streaming remain separate work.'),
 'DAT-004': ('Partial','Tenant-scoped file/revision/extraction/share tables, text-object lifecycle, retry keys, tombstones and durable delete jobs. Failed writes and ownership fixtures pass.','Implement revision-update/download/share-resolution APIs, S3 adapter and secure multi-format extraction. Verify S3 lifecycle on AWS.'),
 'DAT-005': ('Partial','Plans/prices/subscriptions/event inbox plus a trusted verified-event service. Replayed/tampered/stale events and repeated period grants are tested.','Verify native concurrent event processing. Add merchant signature adapter and approved plan-change/proration rules; run payment gates.'),
 'DAT-006': ('Partial','Reserved/consumed/granted accounts and immutable ledger. Request races, rollback, once-only settlement/release and ledger reconciliation pass on PGlite.','Run the native multi-connection suite and contention/failure fixtures. PGlite serializes transactions and cannot prove PostgreSQL replica behavior.'),
 'DAT-007': ('Implemented','Transactional outbox commits with run/hold. Durable leases, retries, bounded backoff, stale-ack fencing and inspectable dead letters pass.','Native concurrent worker contention and production queue operations remain release verification gates B01/B02.'),
 'DAT-008': ('Implemented','Durable export/deletion/object cleanup jobs. Export ownership, immediate access revocation, content redaction, staging cleanup and retention replay fixtures pass.','Approve retention policy; integrate merchant cancellation, provider deletion and backup expiry before production. Standalone chat retention remains open.'),
 'API-001': ('Implemented','Portable Fastify Node service with real loopback HTTP proof and database/outbox readiness checks. Failure responses omit connection details.','Deploy the portable service after production adapters/gates. Existing Sites preview is not wired to it.'),
 'API-002': ('Implemented','Strict JSON schemas, body/context bounds, safe error envelopes and rejection of client role/model/owner injection. Portable CSRF and forged-header tests pass.','Continue full route response schemas in API-003 and staging/browser security checks in SEC-003.'),
 'API-003': ('Partial','Registered OpenAPI specification and typed browser-safe run client. Actual API error, pagination and idempotency transport fixtures pass.','Replace broad response placeholders with complete schemas, generate all client routes, add SSE contracts and connect the existing frontend.'),
 'API-004': ('Implemented','Workspace-scoped idempotency key plus canonical request hash. Atomic reservation/dispatch outbox, cancellation and conservative uncertain-outcome fencing pass with provider doubles.','Live provider adapters/reconciliation are separate blocked/incomplete AI integration work B03. Uncertain holds require confirmed outcome before resolution.'),
 'API-005': ('Implemented','Whitelisted metadata logs and W3C trace propagation across actual API request, job and provider-double failure. Raw source, tokens and provider errors are absent from logs.','CloudWatch/OTel export and production alerting remain AWS observability work.'),
 'API-007': ('Implemented','Hourly deduplicated cleanup/reconciliation jobs, lease/retry observability and safely replayable export/deletion handlers. Expired unsent holds release; uncertain sent holds remain.','Production scheduler/worker deployment and alerting remain AWS work B02.'),
 'QTA-002': ('Partial','Verified-account starter grant keyed once per account. Thirty parallel application calls and replay leave exactly five credits and one grant on PGlite.','Prove multi-connection concurrent signup/login using the native PostgreSQL suite. Public signup verification is separate auth work.'),
 'QTA-004': ('Partial','Row-locked durable reserve/settle/release service. Overspend, duplicate delivery, cancellation, rejection, timeout and crash-fence fixtures pass on PGlite.','Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely.'),
 'QTA-005': ('Partial','Database-shared fixed-window limits and renewable concurrency leases. Two service instances enforce shared limits in application-level race tests.','Verify actual separate API/worker processes and native database connections under contention/load. Configure deployment limits and worker monitoring.'),
 'AUT-006': ('Implemented','Hashed opaque sessions, CSRF binding, revocation/expiry, fixation rotation and explicit fresh-session identity linking. Matching email never silently links. Forged Sites headers are ignored.','Connect OAuth/OTP verification adapters and session-cookie issuance in AUT-001..004. Production account flow is not live.'),
 'SEC-001': ('Implemented','Two-account route/service fixtures deny guessed/cross-user reads and writes across runs, notes, chats, files, shares, exports and billing views. Composite database ownership keys also reject invalid references.','Repeat negative cases as new routes/adapters are added and on staging before release.'),
 'SEC-006': ('Implemented','Server-built context uses only owned records, fixed trusted roles and bounded attachments. Source remains untrusted JSON data, no tools are exposed, and sessions/secrets are excluded.','Live model quality/adversarial evaluation and streaming/UI integration remain AI/chat release work B03.'),
}
assert len(changes) == 20
delta = []
native = {'DAT-005','DAT-006','QTA-002','QTA-004','QTA-005'}
for task in data['tasks']:
    if task['id'] not in changes:
        continue
    status,evidence,left = changes[task['id']]
    delta.append({'id':task['id'],'feature':task['feature'],'before':task['status'],'after':status,'evidence':evidence,'remaining_work':left})
    task.update(status=status,owner='Codex / Engineering',evidence='BUILD-01: '+evidence,remaining_work=left,last_reviewed='2026-10-22',verification='34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.')
    task['blockers'] = 'B01' if task['id'] in native else 'B02' if task['id']=='DAT-004' else ''
data['baseline']='BUILD-01'
data['baseline_source_commit']=data.pop('source_commit')
data['source_ref']='This tracker is versioned with the source. The delivered release-manifest.json records the exact Build 01 commit.'
data['as_of']='2026-10-22'
data['verification_database']='PGlite 0.3.16, PostgreSQL WASM. Serialized transactions, not native multi-connection PostgreSQL.'
data['current_release']='Owner-private Sites preview. Portable backend implemented separately; frontend database wiring and AWS production remain incomplete.'
data['build_tasks'] = [d['id'] for d in delta]
data['build_outcomes'] = dict(Counter(d['after'] for d in delta))
data['totals'] = dict(Counter(t['status'] for t in data['tasks']))
data['reference_totals'] = dict(Counter(t['status'] for t in data['tasks'] if t['scope']=='Reference'))
data['production_ready']=False
for blocker in data['blockers']:
    if blocker['id']=='B01':
        blocker.update(title='Docker, native database and isolated runner verification unavailable',owner='Codex on Docker-capable CI / owner host',evidence='Docker executable absent. Native PostgreSQL packages downloaded, but install/configuration cannot switch UID (setresuid/setgroups); initdb refuses root. PGlite SQL suite passes.',unblock='Run node portable/scripts/test-native.mjs on a Docker-capable host, or inject a disposable TEST_DATABASE_URL and run the same suite. Then run container/sandbox probes.',can_continue='Application code, SQL migrations, persistent PGlite tests, fixtures, container/IaC source and runbooks.',affected='Native multi-connection SQL/worker contention, container builds, remote five-runtime execution and isolation verification.')
data['tasks'].sort(key=lambda t:({'Blocked':0,'Partial':1,'Not started':2,'Implemented':3}[t['status']],t['phase'],t['id']))
out=root/'docs/release'
(out/'FEATURE_STATUS.json').write_text(json.dumps(data,indent=2)+'\n')
with (out/'FEATURE_STATUS.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(data['tasks'][0]));writer.writeheader();writer.writerows(data['tasks'])
with (out/'BUILD01_DELTA.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(delta[0]));writer.writeheader();writer.writerows(delta)
with (out/'BLOCKED_OWNERSHIP.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(data['blockers'][0]));writer.writeheader();writer.writerows(data['blockers'])
(out/'STATUS_SUMMARY.json').write_text(json.dumps({k:data[k] for k in ['baseline','as_of','total_tasks','totals','reference_totals','build_outcomes','production_ready','verification_database']},indent=2)+'\n')

lines=['# FutureRobotic AI Build 01 status','',
'Twenty existing tasks were advanced: **13 have implemented backend scope and seven remain partial**. One of those 13, API-002, was already implemented in the preview and now has portable API validation as well. This batch adds 12 newly implemented tasks to the cumulative tracker.',
'',f"Cumulative status: **{data['totals']['Implemented']} implemented, {data['totals']['Partial']} partial, {data['totals']['Blocked']} blocked, {data['totals']['Not started']} not started** across {data['total_tasks']} tasks.",'',
'The backend is in portable/. The existing private preview retains its Worker API and browser workspace. The preview is not connected to this PostgreSQL backend. AWS production is not released. Production startup is explicitly gated until required adapters and release checks are complete.','',
'## Batch results','',
'| Task | Status | Implemented evidence | What remains |','| --- | --- | --- | --- |']
for d in sorted(delta,key=lambda d:d['id']):lines.append(f"| {d['id']} {d['feature']} | {d['after']} | {d['evidence']} | {d['remaining_work']} |")
lines += ['', '## Verification', '',
'- 34/34 integration tests pass against persistent PGlite, including real Node HTTP, forward migrations, constraints, rollback, restart, ownership, CSRF, quotas, retries, cancellation and redacted traces.',
'- The existing utility/reference/API transport regression suite passes. Root and portable TypeScript checks pass.',
'- Provider and billing tests use explicit test doubles/trusted internal fixtures. No live AI call, payment, refund, OAuth, email, S3 or RDS operation was performed.',
'- PGlite serializes transactions. Passing parallel application requests is not native PostgreSQL lock/replica proof. Five database/quota tasks retain partial status for this reason.',
'- No Docker container, remote runner sandbox, RDS failover/restore, full security audit or worldwide production rollout was verified.','',
'## Blocked ownership', '',
'| Blocker | Execution owner | Required next action |','| --- | --- | --- |']
for b in data['blockers']:lines.append(f"| {b['id']} {b['title']} | {b['owner']} | {b['unblock']} |")
lines += ['', 'Owner actions should be completed in the relevant cloud/provider console or protected environment. Do not paste provider/AWS secrets into chat. The declined OpenAI Developers plugin is not required or retried.', '',
'## Next engineering batch', '',
'Continue ownership with public identity/OTP adapters, full API/client and SSE contracts, frontend persistence wiring, revision/S3 upload adapters, secure extraction, billing signature/checkout adapters, provider integration and AWS/IaC/CI source. Native SQL/container tests move to a capable Codex/CI environment. AWS provisioning and live financial tests wait for the owner-controlled prerequisites above.', '',
'The delivered source ZIP is cumulative and excludes dependencies, build output, Git credentials, environment files and database data. Run commands and limitations are in portable/README.md. The delivery manifest identifies its source commit.','']
(root/'docs/BUILD01_STATUS.md').write_text('\n'.join(lines))
print(json.dumps({'tasks':len(delta),'outcomes':data['build_outcomes'],'cumulative':data['totals']}))
