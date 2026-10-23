"""Review the 126 Build 02 partial tasks against Build 03 source and recorded evidence."""
from pathlib import Path
import json,csv,collections
root=Path(__file__).resolve().parents[1]/'docs/release'
base=root/'BUILD02_STATUS.json'
if not base.exists():base.write_text((root/'FEATURE_STATUS.json').read_text())
data=json.loads(base.read_text());tasks={t['id']:t for t in data['tasks']};original={t['id'] for t in data['tasks'] if t['status']=='Partial'}
assert len(original)==126
completed={
'AUT-007':'Account profile, display name, notification/editor/history preferences and pins round-trip through owned API sessions; completion.test.ts includes an independent second session.',
'EDT-004':'CodeMirror gutters share editor scrolling; theme/font/line-number controls and accessible plain-text fallback are connected to account preferences.',
'EDT-005':'Expanded input/output containers have dialog semantics, Escape/Tab handling, scroll lock and focus restoration. Browser verified Escape and content preservation; CodeMirror instance retains selection.',
'EDT-007':'All 72 selectable languages have explicit download extensions. Code/fixed-code copy and safe constant filenames preserve the selected result; extension matrix test passes.',
'EDT-009':'Explanation/review exports use .md and copy the same raw Markdown, preserving headings and fenced examples. Safe rendered preview remains separate.',
'EDT-010':'Unicode code-point counters and effective source cap account for instructions/selected file text. Server validates plan context; 25,000 astral-character boundary tests pass. Private preview AI cap is 4,000.',
'EDT-012':'Eight distinct ToolGuide descriptions, three-step workflows and examples replace generic page copy; all tool guides and observed pair routes are covered.',
'WRK-003':'Personal workspace button opens owned home; account display name and session-scoped server profile are used. Existing tenant-negative API fixtures remain passing.',
'WRK-004':'Tool-specific and language-pair pins can be added, unpinned and reordered; saved account preferences and browser reload storage preserve order by stable pin value.',
'WRK-005':'Popular tools are explicitly curated static shortcuts; they open configured tools and contain no other account content.',
'CHT-004':'Current source/result bounds and omission disclosure, explicitly selected reference IDs, removable/inspectable cloud chat attachment and immutable server file snapshots are connected.',
'CHT-008':'Chat code opens a diff-confirmation dialog. Reviewed account edits append an optimistic/idempotent version; originals remain downloadable. Local/no-save sessions preserve up to 20 session snapshots.',
'CHT-009':'Assistant prose uses safe GFM rendering; fenced blocks have copy and review actions. Raw HTML/scripts, remote images and unsafe links are rejected in rendering tests.',
'TOL-009':'26 advertised comment-removal grammars have fixtures. Dialect-aware SQL/PHP, template interpolation, regex strings, nested Rust comments and shebang preservation pass; unsupported grammars reject explicitly.',
'FIL-003':'All catalog extensions use the same bounded UTF-8-only extraction contract. Each offered extension is uploaded/downloaded in a fixture; binary/control/secret names and over-100KB content reject.',
'FIL-007':'Only explicit selected owned files enter requests, at most five; original/included Unicode character counts and revision/checksum provenance disclose the 6,000-character truncation.',
'HIS-004':'Cloud/local/no-history mode is in the request fingerprint; ephemeral runs/chat are absent from cloud history/evaluation, discarded after delivery, and expired content is redacted by cleanup. Browser saving follows the selected mode.',
'HIS-005':'Owned idempotent bulk-delete/history-export jobs expose status and 24-hour authenticated exports. Browser retains only job metadata for recovery; redaction includes notes, events, chat content and shares.',
'PDF-002':'50,000-character input and sandboxed printable preview verified in browser: 50,006 characters with numbering, exactly 50,000 without. Input cap and responsive settings remain usable.',
'PDF-006':'Document title, include-title and PDF line numbers are independent of editor line numbers; print preview and embedded PDF use the selected options. Unit/browser checks pass.',
'WEB-006':'Footer tools/resources/legal resolve to distinct routes, including dedicated /partnerships and /code-privacy; partnership destination makes current program status explicit.',
'WEB-009':'14 accurate categorized help articles support keyboard search and stable anchors; browser credits search returns one answer and opens it. Proposed/disabled services are labeled.',
'WEB-013':'68 source-language directories resolve to selected-source and related-target links, alongside 68 pair pages; standalone output prerenders 152 public candidate routes with indexing off by default.'
}
blocked={
'AUT-002':'B05/B06','AUT-004':'B05/B07','DAT-009':'B01/B02','DAT-010':'B02/B08','CHT-002':'B03','CHT-007':'B02/B03',
'TOL-001':'B03','TOL-002':'B03','TOL-003':'B03','TOL-005':'B03','TOL-011':'B02/B03','FIL-002':'B02','FIL-006':'B01/B02','FIL-009':'B02/B08',
'RUN-004':'B01/B02','RUN-006':'B01/B02','RUN-007':'B01/B02','RUN-008':'B01/B02','RUN-009':'B01/B02',
'BIL-001':'B04/B08','BIL-002':'B04','BIL-003':'B04','BIL-007':'B04','QTA-002':'B01','QTA-005':'B01/B02','WEB-012':'B08','WEB-018':'B08',
'SEC-002':'B02/B09','SEC-004':'B01/B02','SEC-011':'B02/B08','QAS-003':'B01/B02','QAS-005':'B04','QAS-007':'B01/B02','QAS-009':'B02/B08',
**{'AWS-'+n:b for n,b in {'002':'B01','003':'B01/B02/B09','004':'B02','006':'B02/B05','008':'B01/B02','009':'B02','010':'B01/B02','011':'B02/B09','013':'B01/B02/B09','016':'B02/B03/B08'}.items()}}
updates={
'EDT-003':('app/studio-editor.tsx uses maintained CodeMirror grammars, scroll/history/indentation and explicit accessible plain-text fallback; browser syntax check passes.','Complete syntax grammar/color coverage for the entire 72-language catalog and replace generic output highlighting where required.',''),
'WRK-006':('Owned optimistic notes remain tied to the active server run; history deletion now clears derived notes.','Complete per-result local notes/version restoration and browser race scenarios across all local/remote tools.',''),
'WRK-007':('Sidebar and billing usage now read current server entitlement, ledger balance and monthly credit refresh date instead of hardcoded Free.','Verify UI after real paid activation, renewal, past-due and cancellation events in staging.','B02/B04'),
'CHT-003':('Newest-first 50-message pages and older cursors recover 125 messages without overlap; selected-session restore remains owned.','Complete deployed reload/second-device acceptance and remaining session-switch/older-page browser race coverage.','B02/B06'),
'FIL-006':('file-capacity.ts serializes all direct/quarantine/revision capacity paths. Staged files, all retained revision bytes, 100/250 file limits, per-file100KB and20-revision limit are enforced.','Run native multi-connection contention and real S3 race tests; PGlite serialized transactions are not proof of native contention.','B01/B02'),
'FIL-010':('Cloud file revision editing, expected-version save, provenance/checksum list, file pagination and actual sizes are wired. Stale and frozen-context fixtures pass.','Run concurrent revision edits against deployed native storage and complete owned file-browser acceptance.','B01/B02'),
'AUT-008':('Account exports reuse the pending job on retry. Deletion guards active entitlements and unresolved checkout intents before revoking access. Billing/deletion/checkout share a lifecycle lock.','Complete merchant cancellation/reconciliation handoff, durable export recovery after full reload, and deployed deletion/backup acceptance.','B02/B04/B08'),
'BIL-005':('credit-period.ts anchors monthly credits within annual paid periods, preserving Jan31/Feb29/Mar31 UTC boundaries. Current month grants are unique; expired months do not roll into availability.','Validate live merchant annual renewal, plan-change/proration and grace-policy scenarios before paid release.','B04/B08'),
'BIL-011':('Account billing displays ledger granted/reserved/consumed/available, credit refresh and paid period separately; portal and stable checkout retries are wired.','Verify actual provider invoice/portal, tax, payment-method and renewal states against merchant sandbox.','B04'),
'RUN-003':('Runner selector filters exactly Python, JavaScript, C, C++, Java.','Publish and display versions measured from built digest-pinned runtime images; never invent versions from an unbuilt Dockerfile.','B01'),
'RUN-004':('Dispatch validates bounded stdout/stderr, exit code, duration, phase, truncation and timeout flags; server derives the displayed execution status.','Exercise the actual signed isolated gateway for all five runtimes and verify every failure outcome.','B01/B02'),
'RUN-008':('Atomic admission rejects global pending/running backlog100 and per-workspace2 before charging daily allowance; fair leased workspace lanes remain in use.','Measure native multi-client fairness, queue saturation/rejection and actual gateway capacity.','B01/B02'),
'TOL-004':('Static tool-instructions.ts requests severity, evidence/lines and checker examples; safe review Markdown display exists.','Implement a validated structured issue schema/renderer, severity handling and grounded live-model evaluation.','B03'),
'TOL-012':('Static allowlisted tool prompts, bounded provider context and opt-in evaluation candidates are present. No mocked response is described as real AI quality.','Build the unseen grounded evaluation fixtures, scoring thresholds and actual provider evaluation run.','B03'),
'QTA-003':('Unicode limits match PostgreSQL length and UI source/instruction/reference counts; private preview is capped at4,000 and authenticated service at25k/100k.','Wire guarded public anonymous AI/execution dispatch and settle the approved Standard-vs-Advanced usage/paid-execution policies.','B02/B03/B08'),
'API-003':('OpenAPI route and browser transport now include preferences, result versions, history jobs and file provenance.','Replace broad response envelopes/default-any client results with complete typed endpoint response contracts and generation/validation.',''),
'API-006':('Owned preference, file revision, result-version and bulk-history APIs added with validation; existing ownership fixtures pass.','Complete operator enrollment/console, correction/refund/invoice interfaces, support acknowledgements and native deployed browser acceptance.','B02/B04/B07'),
'WEB-010':('Authenticated support tickets now have a shared durable five-per-hour user rate window. Account ownership and input validation are tested.','Add durable idempotent acknowledgement outbox, delivery/recovery UI, verified sender and actual support delivery.','B07'),
'WEB-015':('English interface and explicit English metadata remain.','Implement complete French strings, locale routing/switching/persistence, translated guides/help and language metadata.',''),
'WEB-016':('Framework robots/sitemap routes and standalone canonical/sitemap generation default to noindex unless public HTTPS origin and indexing approval are configured. Sensitive routes stay excluded.','Finish static framework-page canonicals, approved domain configuration and observed public indexing/redirect checks.','B02/B05/B08'),
'QAS-002':('Recorded desktop Chromium interactions cover syntax, fullscreen Escape, plain fallback, comments, five-language selector, local execution55, PDF50k, help search and directory routing.','Automate deterministic screenshot/action baselines and complete four viewport sizes and supported browser engines.',''),
'QAS-010':('Keyboard source fallback, fullscreen focus/Escape, safe Markdown, searchable help and existing accessible labels are present.','Complete WCAG keyboard/screen-reader audit and actual cross-browser/mobile checks.',''),
'AWS-005':('Existing private API/web/worker CDK services and locked container sources remain.','Codex must complete first-deploy image/migration/bootstrap orchestration before actual AWS rollout testing.','B01/B02'),
'AWS-014':('Existing metadata logging and base alarm source remains.','Codex must complete latency/financial dashboards and alert wiring, then measure real delivery/synthetic checks.','B02/B07'),
'AWS-015':('Existing RDS/S3 backup and restore/rollback runbooks remain.','Codex must implement second-region backup/key-copy configuration and then run measured restores with deleted-user reconciliation.','B02/B08'),
'REL-006':('Financial invariant query and local completed-run checks remain. Monthly grant boundaries now have explicit fixtures.','Implement authoritative provider/merchant reconciliation and record actual post-launch exception resolution.','B02/B03/B04')
}
assert set(completed)<=original and set(blocked)<=original and not(set(completed)&set(blocked))
for id in sorted(original):
 t=tasks[id];t.update(last_reviewed='2026-10-22',verification='BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates')
 if id in updates:
  evidence,remaining,gates=updates[id];t.update(evidence=evidence,remaining_work=remaining,blockers=gates)
 if id in completed:t.update(status='Implemented',evidence=completed[id],remaining_work='',blockers='',owner='Codex / CI')
 elif id in blocked:
  t.update(status='Blocked',blockers=blocked[id],owner='Owner supplies access/decision; Codex executes verification')
  t['evidence']+=' Build03 review: remaining acceptance requires the named external gate; not represented as verified.'
 else:t.update(status='Partial',owner='Codex owns remaining engineering; owner supplies listed external gates')
for t in data['tasks']:
 if t['id']=='ENV-009':t.update(evidence='Dependencies installed; Build03 root/API/infra typechecks,100 tests, regression, standalone and private hosting builds recorded.',last_reviewed='2026-10-22')
for phase in data['phases']:phase['current_state']='Build03 application/source progress; task rows separate remaining engineering from actual external verification'
data.update(baseline='BUILD-03',baseline_source_commit='5a4ab1df59d22b1cf6b984893c59ceb9f13a8d8e',source_ref='Exact final source SHA appears in Build03 release-manifest.json',as_of='2026-10-22',time_zone='Etc/UTC',current_release='Build03 owner-private preview; cumulative portable source; no AWS worldwide production',production_ready=False,build_tasks=sorted(original),verification_database='PGlite0.3.16 PostgreSQL WASM. Serialized transactions; native multi-connection PostgreSQL/RDS remain blocked B01/B02.')
data['totals']={s:sum(t['status']==s for t in data['tasks']) for s in ['Implemented','Partial','Blocked','Not started']}
data['reference_totals']=dict(collections.Counter(t['status'] for t in data['tasks'] if t['scope']=='Reference'))
data['build_outcomes']=dict(collections.Counter(tasks[id]['status'] for id in original))
assert sum(data['totals'].values())==196 and sum(data['build_outcomes'].values())==126
(root/'FEATURE_STATUS.json').write_text(json.dumps(data,indent=2)+'\n')
cols=['id','feature','category','scope','status','phase','priority','owner','evidence','remaining_work','acceptance','reference','blockers','last_reviewed','verification']
with (root/'FEATURE_STATUS.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore',lineterminator='\n');w.writeheader();w.writerows(data['tasks'])
with (root/'BUILD03_DELTA.csv').open('w',newline='') as f:
 w=csv.writer(f,lineterminator='\n');w.writerow(['ID','Before','After','Evidence','Remaining work','Blockers','Owner'])
 for id in sorted(original):
  t=tasks[id];w.writerow([id,'Partial',t['status'],t['evidence'],t['remaining_work'],t['blockers'],t['owner']])
summary={k:data[k] for k in ['baseline','as_of','total_tasks','totals','reference_totals','build_outcomes','production_ready','verification_database']}
(root/'STATUS_SUMMARY.json').write_text(json.dumps(summary,indent=2)+'\n')
with (root/'BLOCKED_OWNERSHIP.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['id','title','owner','evidence','unblock','can_continue','affected'],lineterminator='\n');w.writeheader();w.writerows(data['blockers'])
print(json.dumps(summary))
