# Complete implementation and remaining-work register

Updated 24 October 2026. **75 Implemented / 57 Partial / 64 Blocked / 0 Not started / 196 total.** Only API-003 and DAT-006 close in this batch. Named local implementation does not establish full production readiness.

| Area | Implemented | Partial | Blocked | Total |
| --- | ---: | ---: | ---: | ---: |
| External access and environment | 1 | 0 | 9 | 10 |
| Quality and release verification | 1 | 3 | 7 | 11 |
| Portable backend contracts | 6 | 1 | 0 | 7 |
| Authentication and accounts | 2 | 5 | 2 | 9 |
| Database and durable jobs | 6 | 2 | 2 | 10 |
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

## Implemented — 75 items

### API-003 — OpenAPI specification and typed web client

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Shared strict Zod endpoint request/response/error/pagination/idempotency and SSE types drive OpenAPI, server response validation and both browser/portable clients. All registered routes inventoried, malformed responses rejected; root/API TypeScript and full backend/native/browser regression pass.
- **Remaining work:** Named shared wire-contract scope complete. Live external adapters and operational acceptance remain under their existing IDs.
- **Acceptance:** Frontend and API agree on error, pagination, idempotency and SSE payload contracts.
- **Blockers:**
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### AUT-007 — Account profile, preferences and notification settings

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Account profile, display name, notification/editor/history preferences and pins round-trip through owned API sessions; completion.test.ts includes an independent second session.
- **Remaining work:**
- **Acceptance:** Settings survive cross-device login and cannot update another account.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-006 — Usage reservations and append-only allowance ledger

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Native PostgreSQL16 independent-process proof:12 contenders/5credits gives5accepted7quota denials;6idempotent replay processes add nothing;10settlement processes apply5andignore5; append-only ledger reconciles. SIGKILL before commit rolls back run/reservation/job/ledger; key safely reused once. Full native suites also pass.
- **Remaining work:** Named ledger race/replay/failure acceptance complete on disposable native PostgreSQL. RDS failover, deployed load and provider reconciliation remain separate acceptance gates.
- **Acceptance:** Race/replay fixtures reconcile the same balance without negative spendable allowance.
- **Blockers:**
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### EDT-004 — Line numbers and editor preferences

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** CodeMirror gutters share editor scrolling; theme/font/line-number controls and accessible plain-text fallback are connected to account preferences.
- **Remaining work:**
- **Acceptance:** Line numbers and font settings remain aligned while scrolling and switching tools.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-005 — Expanded input/output editor views

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Expanded input/output containers have dialog semantics, Escape/Tab handling, scroll lock and focus restoration. Browser verified Escape and content preservation; CodeMirror instance retains selection.
- **Remaining work:**
- **Acceptance:** Every expanded view supports keyboard close and preserves content and selection.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-007 — Code copy and correct file-extension downloads

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** All 72 selectable languages have explicit download extensions. Code/fixed-code copy and safe constant filenames preserve the selected result; extension matrix test passes.
- **Remaining work:**
- **Acceptance:** Every supported code output copies/downloads accurately with a safe filename.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-009 — Markdown copy and .md downloads

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Explanation/review exports use .md and copy the same raw Markdown, preserving headings and fenced examples. Safe rendered preview remains separate.
- **Remaining work:**
- **Acceptance:** Markdown export contains headings, fences and examples; rendered UI copy is defined consistently.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-010 — Per-plan counters and input limits

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Unicode code-point counters and effective source cap account for instructions/selected file text. Server validates plan context; 25,000 astral-character boundary tests pass. Private preview AI cap is 4,000.
- **Remaining work:**
- **Acceptance:** Counter, editor cap and server rejection agree on Unicode counting and selected plan.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-012 — Reference page-specific explanatory content

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Eight distinct ToolGuide descriptions, three-step workflows and examples replace generic page copy; all tool guides and observed pair routes are covered.
- **Remaining work:**
- **Acceptance:** Each tool and pair page explains its actual operation and includes working examples.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-003 — Personal workspace selection and home

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Personal workspace button opens owned home; account display name and session-scoped server profile are used. Existing tenant-negative API fixtures remain passing.
- **Remaining work:**
- **Acceptance:** User always reaches only their personal workspace and its permitted data.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-004 — Pinned tools and saved language pairs

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Tool-specific and language-pair pins can be added, unpinned and reordered; saved account preferences and browser reload storage preserve order by stable pin value.
- **Remaining work:**
- **Acceptance:** Pin/unpin and reorder survive reload and cross-device login.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-005 — Popular tools list

- **Area:** Signed-in workspace
- **Priority:** P1
- **Owner:** Codex / CI
- **Evidence:** Popular tools are explicitly curated static shortcuts; they open configured tools and contain no other account content.
- **Remaining work:**
- **Acceptance:** Popular entries open the configured tool and never expose other users code.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-004 — Current result and reference-file grounding

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Current source/result bounds and omission disclosure, explicitly selected reference IDs, removable/inspectable cloud chat attachment and immutable server file snapshots are connected.
- **Remaining work:**
- **Acceptance:** Only the current user selected files enter context and truncation/omissions are disclosed.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-008 — Apply assistant code to the current result

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Chat code opens a diff-confirmation dialog. Reviewed account edits append an optimistic/idempotent version; originals remain downloadable. Local/no-save sessions preserve up to 20 session snapshots.
- **Remaining work:**
- **Acceptance:** Only an explicit user action updates the intended result; original version remains recoverable.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates | MAIN-CI-20261024: Corrected a scheduling assumption in the concurrency fixture: either competing request may win; assert exactly one winner, VERSION_CONFLICT for the loser, replay of the actual winner, changed-content rejection, tenant denial and original/result preservation. Application logic and acceptance were not weakened. Source 518ca8cf430622bb3229ebe4f0519fe835835033; https://github.com/kawakaze430/FutureRobotic/actions/runs/40014946240.

### CHT-009 — Sanitized Markdown and fenced code in chat

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Assistant prose uses safe GFM rendering; fenced blocks have copy and review actions. Raw HTML/scripts, remote images and unsafe links are rejected in rendering tests.
- **Remaining work:**
- **Acceptance:** Code and prose display accurately; scripts/unsafe HTML cannot run.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-009 — Comment-remover coverage for the advertised catalog

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** 26 advertised comment-removal grammars have fixtures. Dialect-aware SQL/PHP, template interpolation, regex strings, nested Rust comments and shebang preservation pass; unsupported grammars reject explicitly.
- **Remaining work:**
- **Acceptance:** Each offered language has adversarial fixtures including template, regex and nested comment behavior.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-003 — 70-plus context-file types and parser matrix

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** All catalog extensions use the same bounded UTF-8-only extraction contract. Each offered extension is uploaded/downloaded in a fixture; binary/control/secret names and over-100KB content reject.
- **Remaining work:**
- **Acceptance:** Every offered type has a bounded extraction fixture; unparsed binary content never silently becomes context.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-007 — Reference-file selection and bounded AI context

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Only explicit selected owned files enter requests, at most five; original/included Unicode character counts and revision/checksum provenance disclose the 6,000-character truncation.
- **Remaining work:**
- **Acceptance:** Unselected or unauthorized files never enter requests; user sees any omissions.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-004 — Local-only history mode

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Cloud/local/no-history mode is in the request fingerprint; ephemeral runs/chat are absent from cloud history/evaluation, discarded after delivery, and expired content is redacted by cleanup. Browser saving follows the selected mode.
- **Remaining work:**
- **Acceptance:** Local-only requests do not persist code/chat in cloud history; unavoidable operational metadata is disclosed.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-005 — Bulk history deletion and account export jobs

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Account/history job discovery uses owner-scoped metadata and request keys, includes completed deletion metadata, preserves uncertain intent without private selection, and never mutates/downloads on reload. Nine focused recovery tests and actual Chromium export/reload/download checks pass.
- **Remaining work:** Preserve existing feature classification; deployed job delivery/retention and external deletion exceptions remain subject to existing gates.
- **Acceptance:** Bulk jobs complete idempotently and signed export links expire.
- **Blockers:**
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### PDF-002 — 50,000-character PDF input and live preview

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** 50,000-character input and sandboxed printable preview verified in browser: 50,006 characters with numbering, exactly 50,000 without. Input cap and responsive settings remain usable.
- **Remaining work:**
- **Acceptance:** 50,000-character code displays a matching printable preview and remains responsive.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### PDF-006 — Line-number, title and custom-title controls

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Document title, include-title and PDF line numbers are independent of editor line numbers; print preview and embedded PDF use the selected options. Unit/browser checks pass.
- **Remaining work:**
- **Acceptance:** Title and line numbers can be independently included/excluded and match the preview.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-006 — Resource, legal and tools footer

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Footer tools/resources/legal resolve to distinct routes, including dedicated /partnerships and /code-privacy; partnership destination makes current program status explicit.
- **Remaining work:**
- **Acceptance:** Every footer destination resolves to its own approved content or explicit external destination.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-009 — Complete categorized FAQ content

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** 14 accurate categorized help articles support keyboard search and stable anchors; browser credits search returns one answer and opens it. Proposed/disabled services are labeled.
- **Remaining work:**
- **Acceptance:** Credits, files, models, execution, privacy and billing questions reflect real server behavior.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-013 — Source-language directory routes

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** 68 source-language directories resolve to selected-source and related-target links, alongside 68 pair pages; standalone output prerenders 152 public candidate routes with indexing off by default.
- **Remaining work:**
- **Acceptance:** All 68 captured directory routes resolve with the selected source and related targets.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-008 — Rendered and sanitized Markdown results

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** app/result-reading.tsx; tests/product-ui.test.tsx renders GFM/code and rejects scripts, raw HTML, unsafe links and images
- **Remaining work:**
- **Acceptance:** Explanations and reviews match structured reading views; unsafe HTML and links cannot execute scripts.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### CHT-006 — Assistant model and tier selection

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Shared model registry, allowed-tier UI, server model/context/budget validation; paid/free and context-trimming tests pass
- **Remaining work:**
- **Acceptance:** Changing model cannot bypass tier, context or spending restrictions.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-006 — Fixer inline diff and plain fixed-code tabs

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** app/result-reading.tsx FixResult; changed-line and clean fixed-code extraction tests for missing-colon fixture
- **Remaining work:**
- **Acceptance:** Missing-colon fixture highlights exactly the changed lines and plain-code export omits markers.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-007 — Fixer What I Changed summary

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Computed additions/removals and What I Changed text; no fabricated execution/test result; UI fixture passes
- **Remaining work:**
- **Acceptance:** Summary corresponds to actual diff and contains no fabricated execution status.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-010 — Model capability registry and Standard/Advanced routing

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** portable/src/product-policy.ts and provider.ts; Standard/Advanced IDs, model mapping, tier/output rules; contract fixtures pass
- **Remaining work:**
- **Acceptance:** Only allowed models appear; server validates model tier and routes requests consistently.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### FIL-004 — ZIP project import

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Shared ZIP validator + bounded browser/server inflation, CRC/UTF-8/path/symlink/duplicate/ratio limits; malicious fixtures pass
- **Remaining work:**
- **Acceptance:** Safe project imports; malicious paths and zip bombs fail before extraction.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### FIL-005 — Automatic dependency/build-folder exclusion

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Shared dependency/build/secret-name exclusions and explicit import report; browser/server fixtures pass
- **Remaining work:**
- **Acceptance:** Excluded folders never enter uploaded context; import report lists exclusions.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### HIS-006 — Internal-evaluation opt-out

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Default evaluation opt-out, explicit preference UI, consent snapshot and current-user filtering; opt-in/out fixture passes
- **Remaining work:**
- **Acceptance:** Opted-out content never enters evaluation datasets; policy matches implementation.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-001 — Explicit share-result creation and copy link

- **Area:** Shared results
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Explicit result-only share creation, copy/link UI and owner list; hidden source/attachments excluded in snapshot fixture
- **Remaining work:**
- **Acceptance:** Sharing creates a link only after explicit action and does not include hidden source/context.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-002 — Read-only shared-result page

- **Area:** Shared results
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** app/shared-result.tsx; fragment-token POST resolver and read-only snapshot; positive/negative API fixture passes
- **Remaining work:**
- **Acceptance:** Recipient can view the intended snapshot but cannot browse owner history or mutate it.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-003 — Share expiration, revocation and noindex

- **Area:** Shared results
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Expiry/revoke service and owner UI, hashed tokens, noindex API/page/standalone metadata; expiry/replay fixtures pass
- **Remaining work:**
- **Acceptance:** Expired/revoked links stop working; workspace IDs cannot be used as share tokens.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-003 — Five selectable PDF font sizes

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Five font-size presets and PDF-lib embedded font; all size/theme/margin combinations produce valid documents; browser control selected
- **Remaining work:**
- **Acceptance:** Every size changes final document text consistently without clipping.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-004 — Light and dark PDF themes

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Light/dark page fills and readable text colors; 50 combination exports pass PDF parsing; browser Dark setting exercised
- **Remaining work:**
- **Acceptance:** Dark and light exported PDFs preserve readable syntax and background.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-005 — Five page margins

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Five measured wrapping/margin presets; multi-page PDF parsing tests and browser Small selection pass
- **Remaining work:**
- **Acceptance:** Each preset changes usable area correctly and no code is cut off.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### WEB-011 — Dedicated Code Privacy page

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Dedicated /code-privacy with actual preview/account/provider/consent/share/provisional retention and deletion flows
- **Remaining work:**
- **Acceptance:** /code-privacy exists and reflects configured data flows and provider contracts.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### WEB-014 — Dedicated language-pair converter routes

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** 68 observed pair slugs, valid language aliases, dedicated Next routes and standalone prerender metadata; all resolve in test
- **Remaining work:**
- **Acceptance:** The 68 observed pair links resolve; Python-to-JavaScript matches the captured template.
- **Blockers:**
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### ENV-009 — Existing application dependencies and local checks

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Codex / CI
- **Evidence:** Dependencies installed; Build03 root/API/infra typechecks,100 tests, regression, standalone and private hosting builds recorded.
- **Remaining work:** Fresh clean installation of the future AWS project remains to be verified; it is not currently an observed blocker.
- **Acceptance:** Existing checkout typechecks and meaningful local tests pass.
- **Blockers:**
- **Verification:** Current automated check

### REL-007 — Recurring implemented/partial/blocked/remaining report

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Owner / Engineering
- **Evidence:** This planning package establishes stable task IDs and an evidence-based baseline
- **Remaining work:** Every future build must update the same IDs with code changes, verification, blockers and next actions.
- **Acceptance:** Each build includes cumulative source snapshot, status data, delta report and truthful test evidence.
- **Blockers:**
- **Verification:** Source or environment audit

### API-001 — Portable Node API and health/readiness endpoints

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Portable Fastify Node service with real loopback HTTP proof and database/outbox readiness checks. Failure responses omit connection details.
- **Remaining work:** Deploy the portable service after production adapters/gates. Existing Sites preview is not wired to it.
- **Acceptance:** Runs outside Workers; readiness reflects required DB/queue state without leaking secrets.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-002 — Validated request schemas and safe errors

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Strict JSON schemas, body/context bounds, safe error envelopes and rejection of client role/model/owner injection. Portable CSRF and forged-header tests pass.
- **Remaining work:** Continue full route response schemas in API-003 and staging/browser security checks in SEC-003.
- **Acceptance:** Existing invalid input, role injection, oversized context and provider error tests pass.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-004 — Idempotent tool dispatch and cancellation

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Workspace-scoped idempotency key plus canonical request hash. Atomic reservation/dispatch outbox, cancellation and conservative uncertain-outcome fencing pass with provider doubles.
- **Remaining work:** Live provider adapters/reconciliation are separate blocked/incomplete AI integration work B03. Uncertain holds require confirmed outcome before resolution.
- **Acceptance:** A retried same operation produces one logical run and at most one settled allowance charge.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-005 — Metadata-only logs and distributed tracing

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Whitelisted metadata logs and W3C trace propagation across actual API request, job and provider-double failure. Raw source, tokens and provider errors are absent from logs.
- **Remaining work:** CloudWatch/OTel export and production alerting remain AWS observability work.
- **Acceptance:** Can trace a failed run across API/job/provider without recording raw code or credentials.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-007 — Scheduled cleanup and reconciliation tasks

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Hourly deduplicated cleanup/reconciliation jobs, lease/retry observability and safely replayable export/deletion handlers. Expired unsent holds release; uncertain sent holds remain.
- **Remaining work:** Production scheduler/worker deployment and alerting remain AWS work B02.
- **Acceptance:** Scheduled jobs are idempotent, observable and can be safely replayed.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### AUT-006 — Secure sessions and linked identities

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Hashed opaque sessions, CSRF binding, revocation/expiry, fixation rotation and explicit fresh-session identity linking. Matching email never silently links. Forged Sites headers are ignored.
- **Remaining work:** Connect OAuth/OTP verification adapters and session-cookie issuance in AUT-001..004. Production account flow is not live.
- **Acceptance:** CSRF, session fixation, replay and revoked-session access tests fail safely.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-001 — PostgreSQL schema, migrations and constraints

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Two forward-only migrations, advisory migration lock, historical checksums, ownership/business-key constraints. Empty database, rerun, changed checksum and prior-release upgrade fixtures pass.
- **Remaining work:** Preserve all historical checksums. Any new schema change needs a new migration and explicit runtime-role grants; native/deployed migration acceptance remains separate.
- **Acceptance:** Empty DB and prior release migrate successfully; invalid ownership and duplicate business keys are rejected.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-002 — Users, identities, sessions and personal workspaces

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Persistent users, verified identities, hashed sessions and one personal workspace per account. Composite tenant keys and two-account negative fixtures pass.
- **Remaining work:** Wire public identity adapters and the existing frontend in AUT-001..004/WRK tasks.
- **Acceptance:** Two accounts cannot read/update each others workspace records.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-003 — Tool runs, result versions, notes and chats

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Persistent runs, versioned results, optimistic notes, threads/messages. Completed/failed/cancelled runs, notes and chat restore after PGlite restart.
- **Remaining work:** Frontend persistence migration and live chat streaming remain separate work.
- **Acceptance:** Completed/failed/cancelled runs and notes restore consistently after process restart.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified. | MAIN-CI-20261024: Native owned PostgreSQL was actually restarted between separate seed/verify processes; users, completed results, notes, chat, cancelled and failed runs restored. This is local restart evidence, not RDS failover. Source 518ca8cf430622bb3229ebe4f0519fe835835033; https://github.com/kawakaze430/FutureRobotic/actions/runs/40014946240.

### DAT-007 — Outbox, job retries and dead-letter processing

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Transactional outbox commits with run/hold. Durable leases, retries, bounded backoff, stale-ack fencing and inspectable dead letters pass.
- **Remaining work:** Native concurrent worker contention and production queue operations remain release verification gates B01/B02.
- **Acceptance:** Commit-to-queue failure does not lose work; duplicate delivery is safe and failures are inspectable.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-008 — Retention, deletion and account export jobs

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Durable export/deletion/object cleanup jobs. Export ownership, immediate access revocation, content redaction, staging cleanup and retention replay fixtures pass.
- **Remaining work:** Approve retention policy; integrate merchant cancellation, provider deletion and backup expiry before production. Standalone chat retention remains open.
- **Acceptance:** Expired data is cleaned and exports contain only authorized user data.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### EDT-001 — Code input and additional instructions

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; controlled textareas with input and instruction bounds
- **Remaining work:** Preserve editing state in the portable app.
- **Acceptance:** Typing, paste, clear and instructions retain the selected languages and tool.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### EDT-002 — Text/source file input

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21 upload; TEST22 language detection; uploadFiles validates size and binary NULs
- **Remaining work:** Cloud upload support is tracked separately in FIL tasks.
- **Acceptance:** Supported local text file opens in source editor; oversized/binary inputs receive errors.
- **Blockers:**
- **Verification:** Current automated check

### EDT-006 — Code and execution-output tabs

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21: free converter example executes and returns 55
- **Remaining work:** Five-language remote execution integration is in RUN.
- **Acceptance:** JavaScript example switches between code and output without losing either result.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WRK-001 — Dark workspace, sidebar and eight-tool navigation

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; signed-workspace.css and FutureApp
- **Remaining work:** Preserve keyboard and responsive behavior during port.
- **Acceptance:** All tool navigation and dark workspace areas render with FutureRobotic AI branding.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WRK-002 — Sidebar collapse and panel layout controls

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21 verified collapse, assistant close/reopen and hide-main-tool
- **Remaining work:** Add viewport regression coverage.
- **Acceptance:** Sidebar/main/assistant toggles recover a usable layout in every allowed state.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### CHT-001 — Right-hand assistant welcome and quick prompts

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Backend / Frontend
- **Evidence:** QA21; AssistantPanel controls and local guide verified
- **Remaining work:** Preserve interface while replacing preview provider path.
- **Acceptance:** Welcome, Add Comments, Improve Results and Debug prompts remain accessible.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### TOL-008 — Local comment removal for supported language families

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Backend / Frontend
- **Evidence:** TEST22 covers quoted strings, SQL quoting, shebangs and JS regex examples
- **Remaining work:** Broader language coverage and parser fidelity are separate tasks.
- **Acceptance:** Existing supported-family fixtures preserve strings while removing comments.
- **Blockers:**
- **Verification:** Current automated check

### FIL-001 — Local file list, search, open and delete

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Backend / Frontend
- **Evidence:** QA21; local file management in FutureApp
- **Remaining work:** Keep local mode available after cloud mode is added.
- **Acceptance:** Supported file can be listed, searched, opened and removed within the browser limits.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### HIS-001 — Browser history list, search/filter and restore

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Backend / Frontend
- **Evidence:** QA21 history; local 30-result list in source
- **Remaining work:** Keep local behavior and add regression fixtures.
- **Acceptance:** A saved result restores correct tool, languages, source and output.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### HIS-002 — History JSON export and individual deletion

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Backend / Frontend
- **Evidence:** Source handlers; local history data structures
- **Remaining work:** Verify downloads in an unconstrained browser as part of release QA.
- **Acceptance:** Export contains only local account data; delete removes the intended item.
- **Blockers:**
- **Verification:** Source or environment audit

### PDF-001 — Basic multi-page PDF export

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** TEST22: valid three-page PDF; prior Poppler check
- **Remaining work:** Maintain this tested local utility until replacement is validated.
- **Acceptance:** Long code creates a structurally valid multipage PDF with escaped PDF text.
- **Blockers:**
- **Verification:** Current automated check

### RUN-001 — Local plain-JavaScript runner

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Backend / Security
- **Evidence:** QA21 result 55; worker CSP and five-second timeout in source
- **Remaining work:** Keep the offline mode distinct from server runner capability.
- **Acceptance:** Plain JavaScript runs in a disposable worker with bounded output and timeout.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WEB-001 — FutureRobotic AI brand, hero and public visual system

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; app/reference-home.tsx, reference.css, layout.tsx
- **Remaining work:** Maintain visual regression coverage during the AWS port.
- **Acceptance:** Brand, beige background, Geist typography and desktop hero render against reference.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WEB-002 — Eight-tool navigation and public routes

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** TEST22; freePaths and eight route files; QA21 navigation
- **Remaining work:** Preserve URLs during migration.
- **Acceptance:** Each of eight menu entries resolves to the correct tool page.
- **Blockers:**
- **Verification:** Current automated check

### WEB-003 — Homepage four tool cards and calls to action

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; ReferenceHome renders four cards and tool links
- **Remaining work:** Preserve routing and accessible labels.
- **Acceptance:** All four cards and both hero/closing calls to action navigate correctly.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WEB-004 — Moving language-logo strip and language cards

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; 68 directory assets checked by TEST22
- **Remaining work:** Keep language catalog and counts consistent.
- **Acceptance:** All displayed language logos load; source-language selection passes through correctly.
- **Blockers:**
- **Verification:** Current automated check

### WEB-005 — Workspace promotional preview and benefits section

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** QA21; local preview image with FutureRobotic AI overlays
- **Remaining work:** Replace reference-owned artwork before commercial release where rights are unconfirmed (SEC-012).
- **Acceptance:** Workspace image and three benefits columns render with FutureRobotic AI branding.
- **Blockers:**
- **Verification:** Source audit; earlier browser QA

### WEB-007 — Monthly and yearly pricing display

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Frontend
- **Evidence:** app/future-app.tsx annual state; prices explicitly preview-only
- **Remaining work:** Connect these displays to approved catalog in BIL tasks.
- **Acceptance:** Toggle changes displayed proposed monthly/yearly prices accurately, without implying a purchase.
- **Blockers:**
- **Verification:** Source or environment audit

### QAS-001 — Existing TypeScript and utility/API mock suite

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** QA / Engineering
- **Evidence:** TEST22: tsc --noEmit and tests/tools.test.mjs pass
- **Remaining work:** Retain checks while adding portable backend coverage.
- **Acceptance:** Current 72-language/68-asset/8-route fixtures and API validation checks pass.
- **Blockers:**
- **Verification:** Current automated check

### SEC-001 — Tenant authorization and anti-IDOR tests

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Two-account route/service fixtures deny guessed/cross-user reads and writes across runs, notes, chats, files, shares, exports and billing views. Composite database ownership keys also reject invalid references.
- **Remaining work:** Repeat negative cases as new routes/adapters are added and on staging before release.
- **Acceptance:** Cross-user and guessed-ID reads/writes/deletes fail across runs, chats, files and billing.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### SEC-006 — Prompt/context trust boundaries

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex / Engineering
- **Evidence:** BUILD-01: Server-built context uses only owned records, fixed trusted roles and bounded attachments. Source remains untrusted JSON data, no tools are exposed, and sessions/secrets are excluded.
- **Remaining work:** Live model quality/adversarial evaluation and streaming/UI integration remain AI/chat release work B03.
- **Acceptance:** Injected code/attachments cannot obtain secrets, other-user data or unapproved tool execution.
- **Blockers:**
- **Verification:** 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

## Partial — 57 items

### AUT-001 — Portable public signup, login and logout

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Current app relies on Sites owner-private authentication
- **Remaining work:** Complete real public account/browser integration outside Sites, recovery/linking UX and deployed identity/sender acceptance. Do not rebuild the session service merely because the original field is stale.
- **Acceptance:** Account lifecycle works outside ChatGPT; forged oai-authenticated-user-id grants no access.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-008 — Account export and deletion

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Durable account export intent and owned server discovery recover after full browser reload without duplicate requests/downloads; actual Chromium export file checked. Existing guarded account deletion and merchant lifecycle protections retained.
- **Remaining work:** Authoritative merchant cancellation/reconciliation, deployed deletion/backup/provider retention acceptance remain deferred.
- **Acceptance:** Deletion removes active user data and access; backup expiry and legally retained records are explained.
- **Blockers:** B02/B04/B08
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### DAT-004 — Files, revisions, extraction and share records

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** BUILD-01: Tenant-scoped file/revision/extraction/share tables, text-object lifecycle, retry keys, tombstones and durable delete jobs. Failed writes and ownership fixtures pass.
- **Remaining work:** Verify actual S3/KMS/CORS/presign/version cleanup and native races; finish approved parser scope. Binary document parsing/malware scanning is not implemented.
- **Acceptance:** Object lifecycle and ownership survive retries and deletion events.
- **Blockers:** B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-005 — Plans, prices, subscriptions and provider events

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** BUILD-01: Plans/prices/subscriptions/event inbox plus a trusted verified-event service. Replayed/tampered/stale events and repeated period grants are tested.
- **Remaining work:** Complete approved plan-change/proration/grace behavior and authoritative reconciliation; prove native concurrent events and actual merchant lifecycle.
- **Acceptance:** Duplicate provider events and period grants are harmless under concurrent processing.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-003 — Syntax highlighting in editable source panels

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** app/studio-editor.tsx uses maintained CodeMirror grammars, scroll/history/indentation and explicit accessible plain-text fallback; browser syntax check passes.
- **Remaining work:** Complete syntax grammar/color coverage for the entire 72-language catalog and replace generic output highlighting where required.
- **Acceptance:** Source and output coloring, indentation and scrolling work for the advertised language catalog.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-011 — Progress, cancellation, errors and retry

- **Area:** Shared editor and result controls
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Busy/AbortController and user-visible errors exist
- **Remaining work:** Finish resilient browser interruption/session races and run real provider/edge progress, stop/retry/reconnect acceptance without duplicate dispatch or charges.
- **Acceptance:** Cancellation and provider timeouts leave input intact and settle usage exactly once.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-006 — Personal notes tied to results

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Added owned local-result snapshots, per-result browser notes, serialized optimistic cloud notes, conflict draft preservation/explicit reload and selection/account epochs. Chromium proved separate cloud/local notes, full reload and delayed response/reset protection; native ownership/CSRF/version tests pass.
- **Remaining work:** Finish browser acceptance for remote/provider tool results, interrupted streaming and full tool/language/device matrix. Local/notes source is implemented; actual provider/device acceptance is deferred.
- **Acceptance:** Switching results restores the correct note without overwriting another result.
- **Blockers:**
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### WRK-007 — Plan card, balance and account navigation

- **Area:** Signed-in workspace
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Sidebar and billing usage now read current server entitlement, ledger balance and monthly credit refresh date instead of hardcoded Free.
- **Remaining work:** Verify UI after real paid activation, renewal, past-due and cancellation events in staging.
- **Acceptance:** Displayed plan and remaining quota match server ledger after a real signed billing update.
- **Blockers:** B02/B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-005 — Attach, inspect and remove chat files

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Single local text/code attachment up to 100 KB; 6,000 characters sent
- **Remaining work:** Complete multi-file/replace/accessibility and stale-selection/race browser acceptance against the deployed account backend; do not start from the old local-only attachment description.
- **Acceptance:** Selected attachments can be inspected/removed and unsupported formats fail clearly.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-004 — Code checking with issues and corrected snippets

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Added strict bounded issue/severity/Unicode location/corrected-snippet schemas, safe structured renderer, partial JSON pending state and Markdown fallback; checker-only integration. Seven fixture/parser/rendering tests pass.
- **Remaining work:** Grounded unseen live-model evaluation remains required. Human-authored division-by-zero fixture parsing is not proof that a real model diagnoses the bug.
- **Acceptance:** Empty-list division by zero is identified in the reference fixture without fabricating tests.
- **Blockers:** B03
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### TOL-012 — Grounded tool evaluation suite

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Static allowlisted tool prompts, bounded provider context and opt-in evaluation candidates are present. No mocked response is described as real AI quality.
- **Remaining work:** Build the unseen grounded evaluation fixtures, scoring thresholds and actual provider evaluation run.
- **Acceptance:** Failures are reproducible and release-blocking; transport mocks are not counted as model quality proof.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-002 — Python, JavaScript, C, C++ and Java remote runtimes

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Only browser JavaScript currently runs
- **Remaining work:** Produce five pinned/measured runtime release artifacts and adapters/catalog, scan/build/deploy on the approved sandbox host and run native acceptance.
- **Acceptance:** All five compile/run success, syntax failure and runtime failure fixtures return correct outcomes.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-003 — Searchable five-language runner selector

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Runner selector filters exactly Python, JavaScript, C, C++, Java.
- **Remaining work:** Publish verified versions from digest-pinned built artifacts, keep image/catalog mapping consistent and validate search/selection in browser.
- **Acceptance:** Selector filters exactly five server languages and shows correct runtime/version.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-011 — Billing account page and allowance display

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Account billing displays ledger granted/reserved/consumed/available, credit refresh and paid period separately; portal and stable checkout retries are wired.
- **Remaining work:** Verify actual provider invoice/portal, tax, payment-method and renewal states against merchant sandbox.
- **Acceptance:** Billing page matches signed provider and usage-ledger state after reload.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-003 — Plan request and context limits

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Unicode limits match PostgreSQL length and UI source/instruction/reference counts; private preview is capped at4,000 and authenticated service at25k/100k.
- **Remaining work:** Wire guarded anonymous AI/execution dispatch. Implement final approved Standard-vs-Advanced and paid-execution policy; current AI runs all use the credit reservation bucket.
- **Acceptance:** Concurrent APIs enforce server policy independent of frontend limits or model selection.
- **Blockers:** B02/B03/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-004 — Durable reservation, settle and release ledger

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** BUILD-01: Row-locked durable reserve/settle/release service. Overspend, duplicate delivery, cancellation, rejection, timeout and crash-fence fixtures pass on PGlite.
- **Remaining work:** Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely.
- **Acceptance:** Concurrent requests never overspend; timeouts/replays cannot charge twice or bypass caps.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-010 — Contact page and message form

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Authenticated support tickets now have a shared durable five-per-hour user rate window. Account ownership and input validation are tested.
- **Remaining work:** Implement acknowledgement outbox/delivery recovery/status and prove verified-sender support delivery/bounce/complaint behavior.
- **Acceptance:** Valid form creates one ticket and an acknowledgement; failed delivery is recoverable.
- **Blockers:** B07
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-015 — English and French website localization

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** English interface and explicit English metadata remain.
- **Remaining work:** Implement complete French strings, locale routing/switching/persistence, translated guides/help and language metadata.
- **Acceptance:** English/French selection changes all covered UI and uses correct canonical/hreflang behavior.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-016 — Search metadata, sitemap and indexing policy

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Framework robots/sitemap routes and standalone canonical/sitemap generation default to noindex unless public HTTPS origin and indexing approval are configured. Sensitive routes stay excluded.
- **Remaining work:** Finish framework static-page canonical coverage; configure the actual approved domain and verify public redirects/robots/sitemap/indexing after authorized cutover.
- **Acceptance:** Public pages index correctly; workspace, shared-sensitive and auth pages are excluded as intended.
- **Blockers:** B02/B05/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-017 — Mobile and tablet reference adaptation

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Responsive CSS exists; only desktop was previously verified
- **Remaining work:** Test real viewports, keyboard interactions and assistant overlay behavior.
- **Acceptance:** At 360/390/768/1024 widths every core action remains usable without horizontal page overflow.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-002 — Frontend reference screenshots and interaction regression

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Recorded desktop Chromium interactions cover syntax, fullscreen Escape, plain fallback, comments, five-language selector, local execution55, PDF50k, help search and directory routing.
- **Remaining work:** Automate deterministic screenshot/action baselines and complete four viewport sizes and supported browser engines.
- **Acceptance:** All reference families and right-chat panel states pass visual and functional comparison.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-010 — Accessibility and cross-browser compatibility

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Keyboard source fallback, fullscreen focus/Escape, safe Markdown, searchable help and existing accessible labels are present.
- **Remaining work:** Complete WCAG keyboard/screen-reader audit and actual cross-browser/mobile checks.
- **Acceptance:** Core workflows complete with keyboard and required WCAG 2.2 AA checks pass.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-003 — Secure HTTP, cookies, CSRF and content policies

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Same-origin API check and runner CSP exist
- **Remaining work:** Complete headers/CORS/CSP/cookie/edge audit in the actual deployment and prove session/cache isolation across browser engines. Keep named partial status until full acceptance.
- **Acceptance:** CSRF, XSS and cross-origin fixture suites fail safely on staging.
- **Blockers:**
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-008 — Consent and privacy implementation

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Generic policy text and local-storage preferences only
- **Remaining work:** Implement consent where required and document actual region/provider/retention flows.
- **Acceptance:** User preferences affect storage/evaluation behavior and relevant metadata is auditable.
- **Blockers:** B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-010 — Dependency, container and supply-chain checks

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** High-severity Zod oversized-collection advisory demonstrated by audit; targeted exact 4.6.6 security upgrade (published 2026-10-11) preserves seven-day policy and passes backend/UI/browser/build regression. Current audit:0 high / critical,2 low / 2 moderate fast-uri 3.1.8 findings.
- **Remaining work:** fast-uri 3.1.9 fixes four lower-severity advisories but was published 2026-10-19T23:05:26.357Z and is not seven days old. Preserve minimumReleaseAge10080; upgrade/test after 2026-10-26T23:05:26.357Z (2026-10-27 04:35:26 IST). Image/fleet scanning remains separate.
- **Acceptance:** Release images have no unresolved policy-blocking findings and map to a source commit.
- **Blockers:** B01
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### SEC-012 — Commercial asset/font rights and own artwork

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Reference tool art/screenshots/fonts were downloaded for requested visual matching
- **Remaining work:** Replace reference product artwork with own recreated visuals and verify third-party licenses.
- **Acceptance:** Release asset manifest records sources/licenses; no unapproved reference product branding/art remains.
- **Blockers:** B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### API-006 — Account/files/history/billing/support CRUD

- **Area:** Portable backend contracts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Owned preference, file revision, result-version and bulk-history APIs added with validation; existing ownership fixtures pass.
- **Remaining work:** Finish protected operator enrollment/console, correction/refund/invoice workflows, support acknowledgement and native deployed account-browser acceptance.
- **Acceptance:** Every list/read/write path has positive and negative ownership tests.
- **Blockers:** B02/B04/B07
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-003 — GitHub login

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** portable/src/public-auth.ts: verified primary GitHub email; no silent linking fixture passes
- **Remaining work:** Verify real GitHub consent/callback and explicit account linking UI.
- **Acceptance:** GitHub login succeeds without silently linking an unverified matching email.
- **Blockers:** B05/B06
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-005 — Human verification and account-abuse controls

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Turnstile adapter, one-use token fingerprints and durable OTP/send windows; flood fixtures pass
- **Remaining work:** Validate actual hostname/action and viewer-IP handling through CloudFront. OAuth abuse tuning remains.
- **Acceptance:** Signup/OTP flood fixtures throttle before sending excess messages or spending AI quota.
- **Blockers:** B02/B05
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-009 — Operator access with MFA and role checks

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** portable/src/protection.ts: role-gated replay-resistant TOTP; API controls/support gates; audit tests
- **Remaining work:** Protected operator enrollment, operator console and live MFA acceptance remain.
- **Acceptance:** Ordinary users cannot access support, billing correction or feature-flag controls.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-003 — Persisted chat sessions and messages

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Assistant selection/restore/pagination/stream/attachment requests now use epochs and cancellation; pages deduplicate IDs, selection writes serialize, nullable owned selection persists New chat/clear. Five race fixtures and backend ownership/CSRF/clear/legacy selection regression pass.
- **Remaining work:** Actual remote streamed chat, full reload/second-device and deployed session/older-page browser scenarios remain deferred.
- **Acceptance:** Reload restores the selected session; another user cannot list/read it.
- **Blockers:** B02/B06
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### FIL-008 — Upload quarantine and extraction jobs

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Quarantine metadata, signed size/checksum verification, extraction outbox and safe-prefix promotion; integrity fixture passes
- **Remaining work:** Verify S3 retries/lifecycle and failed-job recovery; binary parsers/malware scanning are not implemented.
- **Acceptance:** Only clean extracted files become context; failed jobs can be retried without duplicate records.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-010 — File revisions, checksums and stale-context handling

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Cloud file revision editing, expected-version save, provenance/checksum list, file pagination and actual sizes are wired. Stale and frozen-context fixtures pass.
- **Remaining work:** Run concurrent revision edits against deployed native storage and complete owned file-browser acceptance.
- **Acceptance:** Results disclose the revision used; later uploads do not silently change past context.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-003 — Cloud history with pagination and cross-device sync

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Cloud local-tool snapshot API preserves provider provenance and spends no AI credits; comments/pdf/run/example support explicit cloud consent. Browser cloud/local/none, two isolated accounts, full reload, late responses and account/history export recovery pass.
- **Remaining work:** Actual physical second-device/deployed synchronization, other browser engines and remote AI/execution results remain unverified.
- **Acceptance:** Results persist across devices and paginate without leaking other users records.
- **Blockers:** B02/B06
- **Verification:** WORKSPACE-20261024 source 4dead9d722ab60eff22199a07d6ae9a88e373ac0; handoff/evidence/workspace-completion-20261024/summary.json

### PDF-007 — Browser print and Unicode-aware syntax export

- **Area:** Code-to-PDF
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Embedded Unicode font, glyph rejection/system-font print fallback, escaped print HTML and long-line pagination tests
- **Remaining work:** Complete syntax/color/glyph/download-print parity and actual downloaded-byte/print browser acceptance. Do not count a successful UI click as downloaded-file evidence.
- **Acceptance:** Print-to-PDF and direct export preserve representative Unicode, long lines and pagination.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-005 — 10,000-character runner policy and daily usage

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Server admission and shared durable three/day counter, five-language/10k character validation; race/idempotency fixtures pass
- **Remaining work:** Public anonymous execution route and end-to-end native runtime enforcement remain.
- **Acceptance:** Configured 10,000-character input and public run allowance are enforced concurrently.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-010 — Sandbox lifecycle, patching and abuse response

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Disposable container/work dirs, digest pinning, cleanup, zero-default fleet, drain/rebuild incident runbook
- **Remaining work:** Rehearse residue/patch/drain/key-rotation and host failure on real fleet.
- **Acceptance:** No cross-job residue remains; compromised/overloaded fleet can be drained without affecting normal web service.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-004 — Subscription state and entitlement synchronization

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Bound paid transactions grant periods; checkout/active update alone cannot mint; cancel/past-due mapping and browser billing view
- **Remaining work:** Complete all provider states/grace and actual paid lifecycle browser acceptance.
- **Acceptance:** Only valid paid state grants paid entitlements; grace behavior is explicit and tested.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-005 — Renewal allowances and Advanced monthly usage

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** credit-period.ts anchors monthly credits within annual paid periods, preserving Jan31/Feb29/Mar31 UTC boundaries. Current month grants are unique; expired months do not roll into availability.
- **Remaining work:** Verify actual renewal/annual lifecycle, plan change, proration and grace under approved policy; do not rebuild calendar windows from the older README.
- **Acceptance:** Renewal grants exactly one configured allowance despite webhook replay or delayed events.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-008 — Invoices, currencies, tax and country eligibility

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Shared proposed USD cents catalog, server live-price check and country allowlist; wrong price/country fixtures pass
- **Remaining work:** Provider-verified billing country, actual tax/invoices and supported-market eligibility remain; multi-currency is not implemented.
- **Acceptance:** Supported-country checkout uses correct price/currency; unsupported countries receive a clear message.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-010 — Payment failures, retries and reconciliation

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Uncertain checkout fence, past-due subscription mapping, read-only financial exception queries and incident runbook
- **Remaining work:** Provider payment-failure/retry reconciliation API and automated mismatch recovery remain.
- **Acceptance:** No access is granted for failed checkout; mismatched paid state is detected and recoverable.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-012 — Chargebacks, fraud and administrative corrections

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Signed chargeback/refund/credit adjustment inbox, audit and no ledger deletion; chargeback suspends entitlement
- **Remaining work:** Complete provider dispute/correction lifecycle, role-limited correction UI and merchant tests.
- **Acceptance:** Dispute/correction cannot erase ledger history and does not silently mint credits.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-001 — Anonymous daily tool and execution allowances

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Durable HMAC subject/day two-AI/three-execution reservation service and concurrency tests
- **Remaining work:** Connect both public anonymous dispatch routes with human/abuse protection and recovery; currently execution API requires account.
- **Acceptance:** Configured two AI uses/day and three executions/day are enforced before provider/runner dispatch.
- **Blockers:** B01/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-006 — Provider/model spending ceiling and emergency stop

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Atomic day spend holds, conservative bounded provider estimates, MFA kill switch and ceiling/finalize/replay tests
- **Remaining work:** Reconcile estimates to real model pricing/invoices and verify emergency stop across deployed workers.
- **Acceptance:** Exceeding configured budget rejects new paid-provider dispatch while local tools remain available.
- **Blockers:** B02/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-008 — Detailed plan comparison table

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Cards and detailed comparison use shared planCatalog USD cents; browser comparison fixture passes
- **Remaining work:** Merchant prices must be approved; file capacity and annual/monthly allowance behavior must match every published comparison cell.
- **Acceptance:** All cards, comparison cells and checkout price identifiers agree with the active catalog.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-001 — Separate staging and production infrastructure as code

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Application/Edge/Runner CDK stacks synthesize independently for staging/production; six offline templates
- **Remaining work:** Finish bootstrap/drift/retention protections and review/apply owner-specific change sets. Offline fixture is never deployable production evidence.
- **Acceptance:** Staging and production can be independently planned/applied/destroyed within approved limits.
- **Blockers:** B02/B05
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-005 — ECS Fargate web/API services and ALB health

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Existing private API/web/worker CDK services and locked container sources remain.
- **Remaining work:** Codex must implement an initial bootstrap workflow separate from the existing service update workflow, then prove staging rollout/health/rollback.
- **Acceptance:** A task/AZ failure and deployment rollout preserve service availability within the release target.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-007 — WAF, origin restriction and public abuse limits

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Private ALB, CloudFront VPC origin, IP/auth WAF rates and managed IP reputation source
- **Remaining work:** Tighten managed-origin SG after creation and demonstrate direct-origin/abuse denial in staging.
- **Acceptance:** Direct-origin bypass and abusive requests fail without blocking normal auth/API usage.
- **Blockers:** B02/B05
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-012 — SES domain, DKIM and delivery events

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; SES identity/DKIM/configuration-set event destination and OTP mailer source
- **Remaining work:** Verify domain, SES production sending, actual delivery/bounce/complaint handling and support mailbox.
- **Acceptance:** OTP/support delivery works for eligible recipients and bounce/complaint events are handled.
- **Blockers:** B02/B05/B07
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-014 — Metrics, logs, alerts and synthetic checks

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Existing metadata logging and base alarm source remains.
- **Remaining work:** Codex must complete latency/financial dashboards and alert wiring, then measure real delivery/synthetic checks.
- **Acceptance:** Test alerts for 5xx, latency, AI errors, queue depth, DB and quota/billing anomalies reach owner.
- **Blockers:** B02/B07
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-015 — Backups, restore and regional disaster recovery

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Existing RDS/S3 backup and restore/rollback runbooks remain.
- **Remaining work:** Codex must implement second-region backup/key-copy configuration and then run measured restores with deleted-user reconciliation.
- **Acceptance:** Measured restoration recovers app, files and financial invariants within agreed targets.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-008 — Load, saturation and autoscaling checks

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** 100 real loopback readiness requests at concurrency 10: zero errors; 10,000-row indexed history fixture; bounded load script
- **Remaining work:** Measure native DB, AI/runner saturation, fairness and ECS autoscaling at approved staging targets.
- **Acceptance:** Latency/error/queue/concurrency targets hold and overload returns controlled admission errors.
- **Blockers:** B01/B02/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-005 — Upload/archive and content extraction safety

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Bounded ZIP central/local header/ratio/CRC/UTF-8/path/symlink tests; text quarantine integrity/promotion tests
- **Remaining work:** Audit native parser resource behavior, S3 retry races and any future binary extraction/malware pipeline.
- **Acceptance:** Archive and parser abuse fixtures are rejected without application outage.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-007 — Account abuse, bot and spend protection

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Turnstile/public identity rate guards, shared anonymous counters, model/spend ceiling and MFA controls; fixtures pass
- **Remaining work:** Complete anonymous dispatch integration and verify edge client-IP, WAF and provider/runner costs under deployed abuse.
- **Acceptance:** Automated abuse is bounded before provider and runner costs escalate.
- **Blockers:** B01/B02/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-009 — Security audit trail and operator actions

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Append-only DB audit/ledger guards, MFA role/one-use operator controls and safe metadata logs; tests pass
- **Remaining work:** Protected operator enrollment/console, native privilege checks and observed CloudTrail/alert review remain.
- **Acceptance:** Admin changes are attributable, append-only and access controlled.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-005 — Support, incident response and on-call runbooks

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** ops/INCIDENTS.md: support/on-call, AI cost, runner drain, payments, data recovery and availability procedures
- **Remaining work:** Assign actual support/on-call contact; wire mailbox/alerts and perform an incident drill.
- **Acceptance:** Simulated incident reaches owner and runbook restores/restricts affected service.
- **Blockers:** B02/B07/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-006 — Post-launch reconciliation and maintenance

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Codex owns remaining engineering; owner supplies listed external gates
- **Evidence:** Financial invariant query and local completed-run checks remain. Monthly grant boundaries now have explicit fixtures.
- **Remaining work:** Implement authoritative provider/merchant reconciliation and audited corrections, then observe real operating-window mismatches, alerts and maintenance.
- **Acceptance:** First operation period reconciles provider spend, revenue events and allowances with documented exceptions.
- **Blockers:** B02/B03/B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

## Blocked — 64 items

### ENV-001 — Docker image build and execution verification

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Codex on Docker/gVisor-capable CI or owner host
- **Evidence:** Docker unavailable; native multi-connection/container/runtime checks remain unperformed. Images and probe source are prepared.
- **Remaining work:** Use a Docker-capable CI runner or owner environment. Image files can be authored before this is resolved.
- **Acceptance:** Build API, web and all runner images; run smoke and isolation tests; retain logs.
- **Blockers:** B01
- **Verification:** Source or environment audit

### ENV-002 — AWS account deployment and infrastructure verification

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner supplies AWS role; Codex provisions/tests
- **Evidence:** Six AWS stacks synthesize offline; no AWS account/deployment role supplied.
- **Remaining work:** Owner supplies a scoped role/CI OIDC setup and account budget. Infrastructure code can proceed.
- **Acceptance:** Assume approved role; apply staging infrastructure; record account/region privately and deployment outputs.
- **Blockers:** B02
- **Verification:** Source or environment audit

### ENV-003 — Real AI tools and chatbot provider verification

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner configures protected AI; Codex verifies
- **Evidence:** Provider-neutral streaming adapter and mock contracts pass; no live secret/quota/model policy supplied.
- **Remaining work:** Provide an approved server secret and usable model quota. Adapter work does not require exposing a key.
- **Acceptance:** One real request per AI workflow and a follow-up chat succeed; usage reconciles; error cases verified.
- **Blockers:** B03
- **Verification:** Source or environment audit

### ENV-004 — Live subscription, renewal and refund verification

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner configures merchant; Codex integrates/tests
- **Evidence:** Paddle signature/checkout/portal source and contracts pass; merchant credentials and live-test authorization are absent.
- **Remaining work:** Approved merchant account, live price IDs, signing secret and controlled live test authorization required.
- **Acceptance:** Live payment, entitlement, cancellation and refund reconcile against signed provider events.
- **Blockers:** B04
- **Verification:** Source or environment audit

### ENV-005 — Production domain and DNS control

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner chooses domain/DNS; Codex configures
- **Evidence:** Only the generated owner-private Site domain exists; no owned production domain supplied.
- **Remaining work:** Owner selects a domain and supplies DNS control through its normal account.
- **Acceptance:** TLS works on apex/app domains; redirects, email records and DNS rollback are verified.
- **Blockers:** B05
- **Verification:** Source or environment audit

### ENV-006 — Google and GitHub production OAuth credentials

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner registers OAuth apps; Codex verifies
- **Evidence:** Google/GitHub adapters and fixtures pass; owner production OAuth applications are missing.
- **Remaining work:** Create owner-controlled OAuth applications with verified production callback URLs.
- **Acceptance:** Both real login flows and safe account linking work on the production domain.
- **Blockers:** B06
- **Verification:** Source or environment audit

### ENV-007 — Transactional email delivery and sender approval

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner supplies sender/mailbox; Codex verifies
- **Evidence:** SES OTP source is implemented; verified sender, SES production access and support delivery are missing.
- **Remaining work:** Verify sender domain and request SES production access; configure bounce/complaint handling.
- **Acceptance:** OTP and support messages reach permitted external inboxes; expired codes and delivery failure handled.
- **Blockers:** B07
- **Verification:** Source or environment audit

### ENV-008 — Business, country, pricing and policy approval

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner approves commitments; Codex implements
- **Evidence:** Proposed catalog and closed policy/gate configuration exist; business/country/pricing/fair-use/refund/retention decisions are unapproved.
- **Remaining work:** Owner supplies business identity, merchant eligibility, supported countries, refund and retention decisions.
- **Acceptance:** Published terms, country eligibility, prices and data practices match approved operating configuration.
- **Blockers:** B08
- **Verification:** Source or environment audit

### ENV-010 — CI repository and deployment-role trust

- **Area:** External access and environment
- **Priority:** P0
- **Owner:** Owner selects protected repo/trust; Codex runs CI
- **Evidence:** Scoped OIDC/workflow source is prepared; protected owner CI environment has not been configured.
- **Remaining work:** Choose owner repository/CI and authorize a narrowly scoped AWS OIDC trust policy. CI files can be written beforehand.
- **Acceptance:** Protected production workflow obtains short-lived credentials and only deploys approved artifacts.
- **Blockers:** B09
- **Verification:** Source or environment audit

### QAS-006 — Live low-value payment and refund verification

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** QA / Engineering
- **Evidence:** No approved merchant/live testing authorization
- **Remaining work:** Run owner-authorized live purchase/refund after sandbox gates; do not fabricate proof.
- **Acceptance:** Retain private evidence linking payment event, entitlement, invoice and refund.
- **Blockers:** B04
- **Verification:** Source or environment audit

### CHT-002 — Contextual real follow-up chat

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Chat adapter, bounded context and mock tests exist; no live secret Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Connect portable API and real-provider verification.
- **Acceptance:** New question uses current source/result and conversation; a real reply returns without fabricated execution.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-001 — Arbitrary source-to-target code conversion

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** lib/site-api.ts adapter and mock tests; four exact local examples only Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Run unseen semantic conversions against the configured approved provider and isolated/trusted test harness; implement any schema/language/output validation gaps found.
- **Acceptance:** Unseen conversions preserve testable behavior and are labeled generated until independently run.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-002 — Natural-language code generation

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Generator route, prompt input and server task exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Codex can complete structured output/language validation and runnable-result integration without credentials; actual unseen generation quality/cost needs B03.
- **Acceptance:** New requirements produce the selected language and obey extra instructions.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-003 — Code explanation with examples and complexity

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Explainer route and server task exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Complete output/evaluation contract as needed and run actual provider usefulness/complexity/example acceptance; do not present reference-site output as ours.
- **Acceptance:** Explanation includes behavior and edge cases with accurate code examples; no false execution claims.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-005 — Complete corrected code from fixer

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Fixer route and fix prompt exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Prove real provider fixes against unseen defects/constraints and native supported execution; verify no unmeasured claim of successful tests.
- **Acceptance:** Broken-loop fixture returns complete corrected code; source remains available for comparison.
- **Blockers:** B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-006 — Plan-based file and storage limits

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** file-capacity.ts serializes all direct/quarantine/revision capacity paths. Staged files, all retained revision bytes, 100/250 file limits, per-file100KB and20-revision limit are enforced. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Run native concurrent direct/quarantine/revision/deletion and real S3 race acceptance; validate final approved entitlements.
- **Acceptance:** Concurrent uploads cannot exceed configured 100/250 paid file counts or byte limits.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-004 — stdout, stderr, exit code and elapsed time

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Dispatch validates bounded stdout/stderr, exit code, duration, phase, truncation and timeout flags; server derives the displayed execution status. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Exercise the actual signed isolated gateway for all five runtimes and verify every failure outcome.
- **Acceptance:** Success, compile error, runtime error and timeout display distinct status and duration.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-009 — No network, packages or interactive stdin policy

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Local worker has connect-src none; remote service absent Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Enforce equivalent remote egress/installation/stdin restrictions and publish limits.
- **Acceptance:** Blocked network and package installation tests fail; standard-library samples work.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-001 — Versioned Free, Pro and Premium catalog

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Proposed price cards exist only in frontend Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Owner approves prices/entitlements and merchant IDs. Codex must align UI/server/merchant and policy tests. Multi-currency remains unimplemented; do not create a second catalog from the stale text.
- **Acceptance:** Monthly/yearly catalog, entitlements and checkout IDs remain consistent for all supported currencies.
- **Blockers:** B04/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-002 — Free-account initial credits

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** BUILD-01: Verified-account starter grant keyed once per account. Thirty parallel application calls and replay leave exactly five credits and one grant on PGlite. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Prove native multi-connection signup/login/replay with real public identity acceptance; do not reimplement the starter ledger.
- **Acceptance:** Repeated login, replay and concurrent signup cannot duplicate the initial grant.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-005 — Distributed rate and concurrency limits

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** BUILD-01: Database-shared fixed-window limits and renewable concurrency leases. Two service instances enforce shared limits in application-level race tests. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Prove separate replicas/native connections, lease loss, pool failure and real load behavior before calling limits distributed in production.
- **Acceptance:** Multiple API replicas enforce the same limits and cannot be bypassed by instance changes.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-012 — Production Privacy Policy and Terms

- **Area:** Public website and discovery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Generic preview policy and terms routes exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Replace preview terms with owner-approved business, country, payment and retention language.
- **Acceptance:** All required policy sections, dates, contacts and navigation are approved and linkable.
- **Blockers:** B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-018 — Partnerships or affiliate destination

- **Area:** Public website and discovery
- **Priority:** P1
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Footer Partnerships link routes to contact Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Owner decides actual program/destination; Codex wires only approved application/payout promises and tests links.
- **Acceptance:** Link opens the actual approved destination and application submission is acknowledged.
- **Blockers:** B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-002 — Secret management and short-lived AWS roles

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Provider key server-only by design; production env empty Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Use AWS Secrets Manager/KMS and task roles; never send keys to browser or persist in Git.
- **Acceptance:** Secret scans pass; CI uses scoped temporary roles; rotation succeeds without exposing values.
- **Blockers:** B02/B09
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-004 — Untrusted code isolation verification

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Only limited browser worker isolation is implemented Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Threat-model and test remote runner independently of trusted API containers.
- **Acceptance:** Network/metadata/secret/filesystem/cross-job escape probes cannot access protected resources.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-002 — Google login

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** portable/src/public-auth.ts: Google PKCE/state/nonce/JWK adapter; callback replay fixture passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify owner Google app on the exact staging/production domain.
- **Acceptance:** Real Google login succeeds on staging/production and rejects invalid callback/state.
- **Blockers:** B05/B06
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-004 — Email one-time-code login

- **Area:** Authentication and accounts
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** portable/src/public-auth.ts; SES adapter; expiry/replay/five-attempt/Secure-cookie tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify real sender delivery, human verification and email login in staging.
- **Acceptance:** Expired, replayed and brute-forced codes fail; valid code creates one safe session.
- **Blockers:** B05/B07
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-009 — Indexes, pooling and paginated query plans

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Bounded pg pool, tenant indexes/pagination; operations.test.ts EXPLAIN ANALYZE with 10,000 rows uses index Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Measure native multi-connection query/pool budgets at representative staging load.
- **Acceptance:** Representative history/files/chat queries stay within documented latency/connection budgets at load.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-010 — Backup, point-in-time recovery and restore drill

- **Area:** Database and durable jobs
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts encrypted backup/PITR source; ops/RECOVERY.md and restore-record template Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Execute measured RDS/S3 restoration and reconcile usage/payment/deleted accounts.
- **Acceptance:** Restore drill meets approved RPO/RTO and reconciles billing/usage invariants.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-007 — Stream, stop, retry and recover chat replies

- **Area:** Right-side AI chatbot
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Persisted SSE events, Last-Event-ID reconnect, stop/cancel, partial assistant state, durable quota finalization; real HTTP fixture Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Run browser disconnect/stop/retry scenarios with a real provider through CloudFront.
- **Acceptance:** A stopped/failed reply is marked partial; retry settles quota once and preserves messages.
- **Blockers:** B02/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-011 — Provider response streaming

- **Area:** AI coding tools
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** provider.ts bounded UTF-8 SSE parser; worker persisted deltas; owned API stream and real loopback HTTP replay tests Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify actual provider and CloudFront idle/reconnect/cancellation behavior under load.
- **Acceptance:** Long response streams through local/staging/CloudFront paths without corrupting output or double billing.
- **Blockers:** B02/B03
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-002 — Private cloud uploads and downloads

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Private KMS S3 adapter, bounded signed PUT metadata, integrity download/ownership checks; browser file routes wired Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Exercise actual S3/KMS/presigned CORS and cross-account negative tests; enforce final plan file capacities.
- **Acceptance:** Uploaded file is private, size/type verified and inaccessible to another workspace.
- **Blockers:** B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-009 — Cloud file visibility, deletion and cleanup

- **Area:** Files and context
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Immediate owner-scoped deny/delete, frozen-context redaction and durable object-delete jobs; fixture passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify real versioned S3/backup expiry and all derived cleanup under approved retention.
- **Acceptance:** Deleted file loses access immediately and all derived copies are processed under retention policy.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-007 — Provider data-retention disclosure and exceptions

- **Area:** History and privacy preferences
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Model disclosure placeholders and Code Privacy state that provider retention is unapproved; AI startup requires approval
- **Remaining work:** Owner must approve the actual provider/model contract and route-specific retention/exceptions before enabling AI.
- **Acceptance:** Each selectable model shows accurate data handling approved for that route.
- **Blockers:** B03/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### RUN-006 — Separate execution worker fleet and network boundary

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Separate runner VPC/zero-default ASG source, signed short-lived job capability, no app/provider/DB IAM; template/policy tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Bake/scan approved host/image, apply actual networking/IAM and prove job denial of DB, private services, metadata and egress; policy source is not isolation proof.
- **Acceptance:** Untrusted jobs cannot reach application DB, provider keys, metadata, other jobs or internet.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-007 — CPU, memory, process, disk and output limits

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** runsc/no-network/read-only/nonroot/cap/PID/CPU/memory/tmpfs/wall/output limits; policy tests and native probe harness Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Run all five native runtimes and resource/disk/fork/network abuse probes on isolated host.
- **Acceptance:** Infinite loop, memory exhaustion, fork and output flood fixtures terminate predictably.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-008 — Execution queue, fairness and concurrency admission

- **Area:** Execution service
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Atomic admission rejects global pending/running backlog100 and per-workspace2 before charging daily allowance; fair leased workspace lanes remain in use. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Measure native multi-client fairness, queue saturation/rejection and actual gateway capacity.
- **Acceptance:** Concurrent users cannot starve queue or produce duplicate charged executions.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-002 — Secure hosted checkout

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Paddle server-price verification, bound checkout intents, uncertain-request fence, hosted checkout UI; contract tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Merchant sandbox checkout, default checkout integration/domain and verified-country restrictions remain.
- **Acceptance:** Client cannot alter amount/tier; checkout completion alone does not grant access.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-003 — Signed, idempotent payment webhooks

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Raw-body Paddle timestamp/HMAC verification, serialized inbox and allowance replay/order fixtures pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify actual sandbox event delivery/retries/key rotation and provider reconciliation.
- **Acceptance:** Duplicate, invalid and out-of-order events cannot create duplicate entitlements or credits.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-006 — Upgrade, downgrade and proration policy

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** ops/POLICY_DECISIONS.json identifies proration/amount-preview prerequisites and keeps changes disabled
- **Remaining work:** Owner must approve upgrade/downgrade/proration rules; then implement provider preview/confirmation and sandbox settlement.
- **Acceptance:** Every change shows amount/timing before confirmation and matches settled provider state.
- **Blockers:** B04/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### BIL-007 — Cancel, resume and self-service billing portal

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Owned short-lived hosted customer portal route and browser link; provider customer binding Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify cancel/resume/invoice/access-end behavior and approved cancellation policy in sandbox.
- **Acceptance:** Owner can cancel/resume supported subscription states and see access end date.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-009 — Refund policy and refund processing

- **Area:** Billing and subscriptions
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Refund adjustment recording preserves accounting history; policy decision record explicitly disables automatic refunds
- **Remaining work:** Owner must approve refund eligibility and allowance treatment; implement refund requests/reconciliation and authorized sandbox/live rehearsal.
- **Acceptance:** Eligible test refund reconciles payment, entitlement and audit history without duplicate refunds.
- **Blockers:** B04/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### QTA-007 — Economically viable Standard fair-use policy

- **Area:** Quotas and AI cost control
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** No unlimited usage claim; bounded output/global ceiling; ops/POLICY_DECISIONS.json leaves per-user paid fair-use open
- **Remaining work:** Owner approves final policy/pricing. Codex supplies configuration/enforcement/cost scenarios and real model/invoice reconciliation; never simply remove credit controls.
- **Acceptance:** Published usage language and server controls agree; a high-usage scenario cannot create uncontrolled loss.
- **Blockers:** B03/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### AWS-002 — Portable web/API Dockerfiles and local compose

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Locked pnpm API/web Dockerfiles, compose and standalone web build; container CI definitions Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Build images and run compose/migration/container smoke on Docker host.
- **Acceptance:** Images build from lockfiles and compose supports migrations and integration tests.
- **Blockers:** B01
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-003 — ECR image registry and artifact provenance

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Immutable/scanned ECR source, exact digest services, buildx SBOM/provenance publication helper Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Bootstrap retained repositories, pin build/runtime inputs, execute protected builds, verify attestations and review real vulnerability findings before promotion.
- **Acceptance:** A release refers to exact digests rather than mutable latest tags.
- **Blockers:** B01/B02/B09
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-004 — VPC, private service/database subnets and egress

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Private app/isolated DB subnets; separate runner VPC/no NAT; network template assertions pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Apply/test egress, service rules, peering, managed origin SG and no DB route from runner.
- **Acceptance:** Only intended edge/service traffic reaches app/DB; runner subnet has separate restrictions.
- **Blockers:** B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-006 — Route53, ACM and CloudFront edge distribution

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Route53/ACM/CloudFront private VPC-origin source; dynamic cache-disabled and hashed-asset cache assertions Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Activate domain/cert and test actual signed-in cache separation and streaming globally.
- **Acceptance:** Public assets cache globally; authenticated API, SSE and private results are not shared-cache leaked.
- **Blockers:** B02/B05
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-008 — RDS PostgreSQL Multi-AZ and migrations

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Encrypted private PostgreSQL16 Multi-AZ production source; CA-verified pool, migrations and restricted runtime bootstrap Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Native multi-client/failover and owner-controlled migration task/privilege verification.
- **Acceptance:** Failover reconnects application and preserves transaction/ledger invariants.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-009 — Private S3 buckets and lifecycle policies

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Private versioned KMS S3, quarantine expiration, safe text promotion and bounded signed metadata source Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Actual bucket public-access/CORS/key/presign/version cleanup checks.
- **Acceptance:** Bucket-public-access checks pass; temporary downloads and cleanup work.
- **Blockers:** B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-010 — Shared limiter, SQS queues and scheduler

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; SQL-authoritative quota/outbox/leases; encrypted SQS/DLQ notification bridge and worker scheduler Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Multi-replica native contention, SQS notification loss/replay and worker failure acceptance.
- **Acceptance:** Queue replay, cache loss and multiple replicas preserve durable quota and ownership invariants.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-011 — Secrets Manager and configuration separation

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Separate task secret fields, no browser secrets, worker-only provider key; runtime/bootstrap IAM source Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Verify real least privilege/KMS/execution role access and bundled asset secret scan in deployed accounts.
- **Acceptance:** Frontend bundles contain no server key and each task can read only approved secrets.
- **Blockers:** B02/B09
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-013 — CI test/build/scan and OIDC deployment workflow

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; Pinned official Actions revisions, verify/container workflows, exact repo-environment OIDC, gated digest ECS rollout/rollback Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Current owner-repository CI verification passed all seven jobs at397d0e1, including actual local browser/native/container gates. Protected production environments/OIDC role assumption and untrusted-branch denial, first deploy, rollout/failed-smoke rollback and B02/B09 operational acceptance remain pending.
- **Acceptance:** Untrusted branches cannot assume production role; a failed smoke test triggers controlled rollback.
- **Blockers:** B01/B02/B09
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates | MAIN-CI-20261024: Main-only owner delivery tested; official pinned Actions, independent Node 22/24 checks, native/restart, container and audit jobs, always-retained source-bound diagnostics and a failing aggregate gate all executed successfully in the owner repository. Source 518ca8cf430622bb3229ebe4f0519fe835835033; https://github.com/kawakaze430/FutureRobotic/actions/runs/40014946240. | WORKSPACE-20261024: seven hosted jobs successful at397d0e1; https://github.com/kawakaze430/FutureRobotic/actions/runs/40069616534; application code4dead9d.

### AWS-016 — Budgets, autoscaling ceilings and runner kill switch

- **Area:** AWS platform and delivery
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** infra/src/stacks.ts; runner-stack.ts; AWS budget alarm, max task/fleet ceilings, provider/runner DB kill switches and spending tests Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Observe actual budget/scale/kill-switch behavior and approve cost/capacity targets.
- **Acceptance:** Cost alarm is observed; application kill switch rejects new costly work; local tools remain usable.
- **Blockers:** B02/B03/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-003 — Database/service integration and migrations

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** 64 DB/service fixtures include clean + Build01-to02 upgrade/checksum/replay/ownership/deletion; PostgreSQL WASM passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Native multi-process contention/replay/settlement/killed-transaction rollback, actual restart and full container gates verified locally and in hosted CI. Actual RDS production privileges/load/failover and applicable live matrix acceptance remain pending.
- **Acceptance:** Concurrent ledger, identity and deletion fixtures pass on a clean and upgraded database.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates | MAIN-CI-20261024: All four backend suites including completion passed on native PostgreSQL 16.15 (76 pass, 0 fail, 1 existing skip); separate native connection/transaction-lock and actual restart/recovery proof passed; full Compose image/migration/HTTP readiness passed. Source 518ca8cf430622bb3229ebe4f0519fe835835033; https://github.com/kawakaze430/FutureRobotic/actions/runs/40014946240. | WORKSPACE-20261024: native91pass/1existing skip; separate-process ledger/crash and actual restart proof; Compose migrations/smoke; hosted run40069616534.

### QAS-004 — Real provider end-to-end quality and failures

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** ops/ACCEPTANCE.md specifies unseen fixtures, actual quality/cost and failure evidence; provider adapter mock contract tests pass
- **Remaining work:** Real provider key/quota/approved model and retention are required to run quality/cost end-to-end acceptance.
- **Acceptance:** Curated unseen fixtures meet documented quality/cost criteria and no false verification claims appear.
- **Blockers:** B03/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### QAS-005 — Checkout/webhook sandbox integration

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Paddle raw signature/HTTP route, price/country, bound payment, stale/replay contract tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Merchant sandbox purchase/renewal/cancel/refund reconciliation remains unperformed.
- **Acceptance:** Provider events reconcile idempotently with subscriptions and allowance grants.
- **Blockers:** B04
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-007 — Five-runtime isolation and resource-abuse tests

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Five-runtime image/entrypoint, policy/capability tests and signed native-probe harness; never runs jobs on app host Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Execute native functional, loop/memory/fork/disk/output/metadata/network/residue probes and inspect evidence.
- **Acceptance:** All abuse fixtures are bounded and no protected data or cross-job state is exposed.
- **Blockers:** B01/B02
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-009 — Backup restore and rollback drills

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** Persistent WASM restart baseline, forward-upgrade test, ECS rollback helper and timed restore record/runbook Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Perform real snapshot/PITR/S3 restoration and failed-release rollback drills with measured invariants/RPO/RTO.
- **Acceptance:** Rehearsals meet recovery targets and leave billing/usage data consistent.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-011 — Public-country performance and availability probes

- **Area:** Quality and release verification
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Read-only regional http-probe.mjs and explicit country acceptance scenarios are prepared
- **Remaining work:** Need a deployed approved domain/service-country matrix and regional test agents for actual measurements.
- **Acceptance:** DNS/TLS, login, generation/chat, file actions and checkout work within approved measured targets.
- **Blockers:** B02/B05/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SEC-011 — Backup confidentiality and deletion policy

- **Area:** Security and data handling
- **Priority:** P0
- **Owner:** Owner supplies access/decision; Codex executes verification
- **Evidence:** KMS retained backup resources, restricted runtime grant source, active-content deletion and recovery/tombstone procedure Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Remaining work:** Approve backup expiry/deletion disclosure and prove private/audited restore with deleted-user reconciliation.
- **Acceptance:** Restore access is audited and user deletion disclosures match actual backup lifecycle.
- **Blockers:** B02/B08
- **Verification:** BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-003 — Staging acceptance and private beta

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Local service/UI contracts and staging beta acceptance record prepared; owner-private Site preserved
- **Remaining work:** Provision staging and complete real signup/eight tools/chat/files/history/shares/billing acceptance with recorded beta evidence.
- **Acceptance:** Signup, eight tools, chat, files/history, shares and billing pass recorded end-to-end scenarios.
- **Blockers:** B02/B03/B04/B06/B07
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-001 — Approved launch countries, currency and service matrix

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Empty country allowlist/default closed billing; POLICY_DECISIONS and country probe/service scenarios
- **Remaining work:** Owner must choose approved countries/currency/service matrix and verify provider/merchant eligibility.
- **Acceptance:** Only approved countries can purchase/use restricted services; support content explains coverage.
- **Blockers:** B04/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-002 — Owner-reviewed release configuration and prices

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Versioned release config/gate examples, exact-digest checks and ownerApproved=false policy; incomplete gate test fails closed
- **Remaining work:** Owner must review actual business/domain/provider/merchant/prices/limits/retention configuration before release.
- **Acceptance:** Production config is versioned and every displayed commitment is implementable.
- **Blockers:** B02/B03/B04/B05/B08
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-004 — Controlled worldwide production launch

- **Area:** Launch and operations
- **Priority:** P0
- **Owner:** Owner decision/access; Codex after unblock
- **Evidence:** Fail-closed release checker, scoped OIDC rollout/rollback source and country expansion acceptance procedure
- **Remaining work:** All measured release gates and owner approvals must pass before public AWS launch. No worldwide production exists.
- **Acceptance:** All release gates pass; observed errors, cost and latency stay below approved limits before expansion.
- **Blockers:** B02/B03/B04/B05/B08/B09
- **Verification:** BUILD-02: source + recorded local/offline tests; external checks explicitly pending

## Not started — 0 items
