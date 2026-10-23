# FutureRobotic AI — Build 03

Reviewed 22 October 2026 (UTC). This is a cumulative source release and an owner-private website preview. It is not a worldwide AWS production launch.

## Outcome of the 126 carried partial tasks

| Result | Tasks |
|---|---:|
| Implemented at the named application scope | 23 |
| Partial — engineering or mixed engineering/external work remains | 59 |
| Blocked — remaining acceptance needs actual external access or owner decisions | 44 |
| Total reviewed | 126 |

The complete 196-item register now has **73 implemented, 59 partial, 64 blocked, and 0 not started**. The 44 newly blocked rows were reclassified after reviewing their remaining acceptance; they were not counted as completed. “Implemented” records the named source/local behavior and does not establish a live provider, merchant, native database, sandbox, or AWS deployment.

## Application changes

- Added a maintained CodeMirror source editor with language loading, indentation, shared-scrolling gutters, font/theme settings, a plain-text fallback, and full-screen keyboard/focus handling. Some catalog languages still fall back to plain text; complete output/catalog grammar coverage remains open.
- Counted Unicode code points consistently. Effective source capacity includes instructions and explicitly selected reference-file text. PDF accepts 50,000 characters; execution accepts 10,000; the preview AI route is capped at 4,000.
- Completed the 72-language download-extension map and Markdown exports for explanation/review results.
- Added account display name, notification/editor/history preferences, tool-specific pins, reordering, and server-sourced entitlement/balance displays. Independent authenticated API sessions restore the same account preferences.
- Added explicit reference selection, context omission disclosures, file size/revision metadata and pagination, file revision saving, and provenance views. File count/storage checks serialize direct uploads, quarantine reservations, and revision writes. Staged uploads and retained revision bytes consume capacity. Native contention proof remains blocked.
- Added paged chat recovery, removable/inspectable cloud attachments, safe fenced-code copy, and a proposed-change diff before applying assistant code. Account edits append optimistic/idempotent result versions; local/no-save sessions keep original snapshots in session memory.
- Added cloud, browser-only, and no-history run modes. Ephemeral content is excluded from account history and internal evaluation, discarded after delivery when possible, and expires for scheduled cleanup if interrupted. Operational accounting and provider retention are separate. Added queued bulk-history export/deletion with ownership checks, status recovery, and 24-hour export expiry.
- Replaced production comment removal with 26 language grammars. Fixtures cover literal strings, regexes, interpolation, nested comments, shebangs, and SQL dialects. Unsupported grammars reject explicitly.
- Added independent PDF title inclusion/line numbers and a live sandboxed print preview. Download and print still have font/glyph and syntax-color differences; these remain documented partial work.
- Added monthly credit windows inside annual entitlements, preserving UTC billing-day anchors across short months/leap years. Current-month grants are unique and previous balances do not roll into availability. Real renewal/proration/grace tests remain blocked by merchant setup.
- Added a global execution backlog cap of 100, per-workspace cap of two, bounded result metadata validation, and explicit execution status. Actual five-runtime sandbox verification remains off.
- Added static allowlisted prompts for each AI task. No generated response or model quality was simulated and then presented as live AI verification.
- Added 68 source-language directory routes, tool-specific instructions/examples, 14 searchable/categorized help articles, a distinct partnerships page, and default-closed indexing configuration. The standalone build emits 152 public candidate routes. Public indexing requires an approved HTTPS domain and explicit approval.
- Added durable support-ticket rate limits and guarded account deletion against active subscriptions/unresolved checkout intents. Support acknowledgement delivery and full merchant reconciliation are still engineering work.

## Verification

| Check | Evidence/result |
|---|---|
| Backend/service suite | 77 passing tests, including 13 Build 03 cases |
| UI, grammar, PDF and export suite | 15 passing tests |
| Runner policy and release gate suite | 4 passing tests |
| Offline infrastructure assertions | 4 passing tests; six CDK stacks synthesize without AWS access |
| Total automated tests | 100 passing; no skipped tests counted as passes |
| Existing tools/API regression | Passed |
| Root/API/infrastructure TypeScript | Passed |
| Standalone web build | Passed; 68 pairs + 68 directories; indexing disabled |
| Native PostgreSQL gate | Exit 2: Docker unavailable; native multi-connection contention not verified |
| Native isolated runner gate | Exit 2: no configured signed TLS sandbox gateway/test key |

Database tests use **PGlite 0.3.16, PostgreSQL in WASM with serialized transactions**. They validate SQL/services and replay/ownership behavior; they do not prove multi-process PostgreSQL/RDS contention.

Desktop Chromium QA at 1365 × 937 verified loaded Python syntax, plain-editor round trip, expanded-editor Escape, line-number removal, 16px font reconfiguration, grammar comment removal, exactly five execution choices, local JavaScript Fibonacci output **55**, independent PDF switches, and a full 50,000-character print preview. Preview text measured 50,006 characters with the line prefix and 50,000 without it. Help search for “credits” returned one answer; a Python directory linked to the correct target query. Mobile/tablet and other browser engines remain open. Native account/provider/merchant/fleet end-to-end browser testing was not performed. Browser PDF download bytes were not used as proof; automated PDF generation tests verify valid documents.

Large optional PDF/language chunks trigger Vite size warnings. The PDF generator and language grammars are loaded on demand; further performance budgets and loading optimization remain part of release verification.

## Work that stays with Codex

Missing credentials do not transfer unfinished engineering to the owner. The task register retains exact remaining work on every partial row. Highest-priority source work includes guarded public anonymous dispatch, complete typed API/response contracts, structured review results and unseen evaluation fixtures, cloud persistence for local-tool results/notes, operator enrollment and console, support acknowledgement outbox, French localization, native runner image/version/build/drain automation, authoritative merchant/provider reconciliation, first-deploy bootstrap, dashboards, second-region recovery configuration, and deterministic browser regression automation.

## External gates

| Gate | Owner action | Codex action after access |
|---|---|---|
| B01 native environment | Provide Docker/gVisor-capable CI or a disposable native PostgreSQL host | Run existing native/concurrency/container/runner probes and fix failures |
| B02 AWS | Supply a scoped deployment role/account, region and budget | Finish bootstrap, apply staging, measure operations and prepare production rollout |
| B03 live AI | Configure a protected provider secret, model policy, quota and spending ceiling | Run actual tool/chat/stream quality and cost acceptance |
| B04 merchant | Complete onboarding and configure approved sandbox/live IDs and secrets | Run real checkout, renewals, cancellation, invoices, refunds and replay tests |
| B05/B06 domain/OAuth | Control domain/DNS and register exact callback applications | Configure TLS, callbacks and real login tests |
| B07 email | Verify sender, production sending access and support mailbox | Complete delivery source and prove OTP/support delivery/recovery |
| B08 business decisions | Approve countries, pricing/fair use, refund/retention/legal and asset rights | Implement decisions and keep release gates closed until verified |
| B09 CI trust | Choose the delivery repository/protected environment and scoped OIDC trust | Execute image/security/rollout/rollback workflows |

Do not put secrets in source, browser code, status files, or chat. Existing protected configuration examples and ops runbooks define the deployment inputs. No declined plugin is required for this source package.

## Release sequence

1. Complete the remaining source work above and review the task-level acceptance criteria.
2. Run native database/container/sandbox checks on the B01 host; publish measured image digests and runtime versions.
3. Approve owner configuration, then bootstrap and apply AWS staging with the controlled CI role.
4. Configure real identity, sender, AI, merchant and domain; complete the staging beta checklist with recorded evidence.
5. Run quota/spend/abuse, multi-tenant load, backup/restore, incident, payment and rollback acceptance. Resolve every failed gate.
6. Review the concrete production change set and owner commitments; release only to approved countries, then expand after observed operation.
7. Operate with named on-call/support, budget alerts and provider/merchant financial reconciliation.

The source ZIP is exported from the exact committed Git tree. The release manifest records its SHA-256 and source commit, along with the actual private publication result. FEATURE_STATUS.json/CSV, BUILD03_DELTA.csv and the workbook preserve stable task IDs.
