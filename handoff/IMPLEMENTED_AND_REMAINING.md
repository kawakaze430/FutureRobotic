# Implemented, partial and blocked — complete 196-task register

Application Build03; handoff review 22 October 2026. Counts: **73 Implemented / 59 Partial / 64 Blocked / 0 Not started**. Statuses have not changed in this documentation batch. Each item retains its original evidence and acceptance. Reviewed clarifications take precedence over stale missing-feature descriptions; they do not claim new implementation or external verification.

## By area

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

## Implemented — 73 items

### AUT-007 — Account profile, preferences and notification settings

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Account profile, display name, notification/editor/history preferences and pins round-trip through owned API sessions; completion.test.ts includes an independent second session.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Settings survive cross-device login and cannot update another account.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-004 — Line numbers and editor preferences

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** CodeMirror gutters share editor scrolling; theme/font/line-number controls and accessible plain-text fallback are connected to account preferences.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Line numbers and font settings remain aligned while scrolling and switching tools.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 08,21,49 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-005 — Expanded input/output editor views

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Expanded input/output containers have dialog semantics, Escape/Tab handling, scroll lock and focus restoration. Browser verified Escape and content preservation; CodeMirror instance retains selection.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Every expanded view supports keyboard close and preserves content and selection.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 08,56-57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-007 — Code copy and correct file-extension downloads

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** All 72 selectable languages have explicit download extensions. Code/fixed-code copy and safe constant filenames preserve the selected result; extension matrix test passes.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Every supported code output copies/downloads accurately with a safe filename.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 09,50-55 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-009 — Markdown copy and .md downloads

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Explanation/review exports use .md and copy the same raw Markdown, preserving headings and fenced examples. Safe rendered preview remains separate.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Markdown export contains headings, fences and examples; rendered UI copy is defined consistently.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 53-54,56-57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-010 — Per-plan counters and input limits

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Unicode code-point counters and effective source cap account for instructions/selected file text. Server validates plan context; 25,000 astral-character boundary tests pass. Private preview AI cap is 4,000.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Counter, editor cap and server rejection agree on Unicode counting and selected plan.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21,23,28,30; inventory / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-012 — Reference page-specific explanatory content

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Eight distinct ToolGuide descriptions, three-step workflows and examples replace generic page copy; all tool guides and observed pair routes are covered.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Each tool and pair page explains its actual operation and includes working examples.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 07,12,14,16,18,20,22,24,43,45 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-003 — Personal workspace selection and home

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Personal workspace button opens owned home; account display name and session-scoped server profile are used. Existing tenant-negative API fixtures remain passing.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** User always reaches only their personal workspace and its permitted data.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-004 — Pinned tools and saved language pairs

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Tool-specific and language-pair pins can be added, unpinned and reordered; saved account preferences and browser reload storage preserve order by stable pin value.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Pin/unpin and reorder survive reload and cross-device login.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-005 — Popular tools list

- **Area / priority / phase:** Signed-in workspace / P1 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Popular tools are explicitly curated static shortcuts; they open configured tools and contain no other account content.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Popular entries open the configured tool and never expose other users code.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-004 — Current result and reference-file grounding

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Current source/result bounds and omission disclosure, explicitly selected reference IDs, removable/inspectable cloud chat attachment and immutable server file snapshots are connected.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Only the current user selected files enter context and truncation/omissions are disclosed.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-008 — Apply assistant code to the current result

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Chat code opens a diff-confirmation dialog. Reviewed account edits append an optimistic/idempotent version; originals remain downloadable. Local/no-save sessions preserve up to 20 session snapshots.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Only an explicit user action updates the intended result; original version remains recoverable.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-009 — Sanitized Markdown and fenced code in chat

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Assistant prose uses safe GFM rendering; fenced blocks have copy and review actions. Raw HTML/scripts, remote images and unsafe links are rejected in rendering tests.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Code and prose display accurately; scripts/unsafe HTML cannot run.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-009 — Comment-remover coverage for the advertised catalog

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** 26 advertised comment-removal grammars have fixtures. Dialect-aware SQL/PHP, template interpolation, regex strings, nested Rust comments and shebang preservation pass; unsupported grammars reject explicitly.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Each offered language has adversarial fixtures including template, regex and nested comment behavior.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 19-20,55 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-003 — 70-plus context-file types and parser matrix

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** All catalog extensions use the same bounded UTF-8-only extraction contract. Each offered extension is uploaded/downloaded in a fixture; binary/control/secret names and over-100KB content reject.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Every offered type has a bounded extraction fixture; unparsed binary content never silently becomes context.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33; inventory advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-007 — Reference-file selection and bounded AI context

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Only explicit selected owned files enter requests, at most five; original/included Unicode character counts and revision/checksum provenance disclose the 6,000-character truncation.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Unselected or unauthorized files never enter requests; user sees any omissions.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-004 — Local-only history mode

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Cloud/local/no-history mode is in the request fingerprint; ephemeral runs/chat are absent from cloud history/evaluation, discarded after delivery, and expired content is redacted by cleanup. Browser saving follows the selected mode.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Local-only requests do not persist code/chat in cloud history; unavoidable operational metadata is disclosed.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33,37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-005 — Bulk history deletion and account export jobs

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Owned idempotent bulk-delete/history-export jobs expose status and 24-hour authenticated exports. Browser retains only job metadata for recovery; redaction includes notes, events, chat content and shares.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Bulk jobs complete idempotently and signed export links expire.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33,37-39; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### PDF-002 — 50,000-character PDF input and live preview

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** 50,000-character input and sandboxed printable preview verified in browser: 50,006 characters with numbering, exactly 50,000 without. Input cap and responsive settings remain usable.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** 50,000-character code displays a matching printable preview and remains responsive.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21-22,49 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### PDF-006 — Line-number, title and custom-title controls

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Document title, include-title and PDF line numbers are independent of editor line numbers; print preview and embedded PDF use the selected options. Unit/browser checks pass.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Title and line numbers can be independently included/excluded and match the preview.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21,49 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-006 — Resource, legal and tools footer

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Footer tools/resources/legal resolve to distinct routes, including dedicated /partnerships and /code-privacy; partnership destination makes current program status explicit.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Every footer destination resolves to its own approved content or explicit external destination.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 47 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-009 — Complete categorized FAQ content

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** 14 accurate categorized help articles support keyboard search and stable anchors; browser credits search returns one answer and opens it. Proposed/disabled services are labeled.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Credits, files, models, execution, privacy and billing questions reflect real server behavior.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 31-33 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-013 — Source-language directory routes

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** 68 source-language directories resolve to selected-source and related-target links, alongside 68 pair pages; standalone output prerenders 152 public candidate routes with indexing off by default.
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** All 68 captured directory routes resolve with the selected source and related targets.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 42-43; discovered-links.csv / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-008 — Rendered and sanitized Markdown results

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** app/result-reading.tsx; tests/product-ui.test.tsx renders GFM/code and rejects scripts, raw HTML, unsafe links and images
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Explanations and reviews match structured reading views; unsafe HTML and links cannot execute scripts.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 53-54,56-57 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### CHT-006 — Assistant model and tier selection

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Shared model registry, allowed-tier UI, server model/context/budget validation; paid/free and context-trimming tests pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Changing model cannot bypass tier, context or spending restrictions.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1;28,30,33; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-006 — Fixer inline diff and plain fixed-code tabs

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** app/result-reading.tsx FixResult; changed-line and clean fixed-code extraction tests for missing-colon fixture
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Missing-colon fixture highlights exactly the changed lines and plain-code export omits markers.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 50-51 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-007 — Fixer What I Changed summary

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Computed additions/removals and What I Changed text; no fabricated execution/test result; UI fixture passes
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Summary corresponds to actual diff and contains no fabricated execution status.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 50 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### TOL-010 — Model capability registry and Standard/Advanced routing

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** portable/src/product-policy.ts and provider.ts; Standard/Advanced IDs, model mapping, tier/output rules; contract fixtures pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Only allowed models appear; server validates model tier and routes requests consistently.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 28,30,33,37; advertised; V1 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### FIL-004 — ZIP project import

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Shared ZIP validator + bounded browser/server inflation, CRC/UTF-8/path/symlink/duplicate/ratio limits; malicious fixtures pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Safe project imports; malicious paths and zip bombs fail before extraction.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### FIL-005 — Automatic dependency/build-folder exclusion

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Shared dependency/build/secret-name exclusions and explicit import report; browser/server fixtures pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Excluded folders never enter uploaded context; import report lists exclusions.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### HIS-006 — Internal-evaluation opt-out

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Default evaluation opt-out, explicit preference UI, consent snapshot and current-user filtering; opt-in/out fixture passes
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Opted-out content never enters evaluation datasets; policy matches implementation.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 37; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-001 — Explicit share-result creation and copy link

- **Area / priority / phase:** Shared results / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Explicit result-only share creation, copy/link UI and owner list; hidden source/attachments excluded in snapshot fixture
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Sharing creates a link only after explicit action and does not include hidden source/context.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 09,50-55 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-002 — Read-only shared-result page

- **Area / priority / phase:** Shared results / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** app/shared-result.tsx; fragment-token POST resolver and read-only snapshot; positive/negative API fixture passes
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Recipient can view the intended snapshot but cannot browse owner history or mutate it.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 09,50-55 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SHR-003 — Share expiration, revocation and noindex

- **Area / priority / phase:** Shared results / P0 / P05
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Expiry/revoke service and owner UI, hashed tokens, noindex API/page/standalone metadata; expiry/replay fixtures pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Expired/revoked links stop working; workspace IDs cannot be used as share tokens.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-003 — Five selectable PDF font sizes

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Five font-size presets and PDF-lib embedded font; all size/theme/margin combinations produce valid documents; browser control selected
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Every size changes final document text consistently without clipping.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21,49 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-004 — Light and dark PDF themes

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Light/dark page fills and readable text colors; 50 combination exports pass PDF parsing; browser Dark setting exercised
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Dark and light exported PDFs preserve readable syntax and background.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 49 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### PDF-005 — Five page margins

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Five measured wrapping/margin presets; multi-page PDF parsing tests and browser Small selection pass
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** Each preset changes usable area correctly and no code is cut off.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21,49 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### WEB-011 — Dedicated Code Privacy page

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Dedicated /code-privacy with actual preview/account/provider/consent/share/provisional retention and deletion flows
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** /code-privacy exists and reflects configured data flows and provider contracts.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 36-37 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### WEB-014 — Dedicated language-pair converter routes

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** 68 observed pair slugs, valid language aliases, dedicated Next routes and standalone prerender metadata; all resolve in test
- **Original remaining-work record:** 
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** 
- **Acceptance:** The 68 observed pair links resolve; Python-to-JavaScript matches the captured template.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 44-45; discovered-links.csv / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### ENV-009 — Existing application dependencies and local checks

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Implemented / Codex / CI
- **Original evidence:** Dependencies installed; Build03 root/API/infra typechecks,100 tests, regression, standalone and private hosting builds recorded.
- **Original remaining-work record:** Fresh clean installation of the future AWS project remains to be verified; it is not currently an observed blocker.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Fresh clean installation of the future AWS project remains to be verified; it is not currently an observed blocker.
- **Acceptance:** Existing checkout typechecks and meaningful local tests pass.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Current source and test output / Current automated check

### REL-007 — Recurring implemented/partial/blocked/remaining report

- **Area / priority / phase:** Launch and operations / P0 / P00
- **Status / owner:** Implemented / Owner / Engineering
- **Original evidence:** This planning package establishes stable task IDs and an evidence-based baseline
- **Original remaining-work record:** Every future build must update the same IDs with code changes, verification, blockers and next actions.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Every future build must update the same IDs with code changes, verification, blockers and next actions.
- **Acceptance:** Each build includes cumulative source snapshot, status data, delta report and truthful test evidence.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** User reporting requirement / Source or environment audit

### API-001 — Portable Node API and health/readiness endpoints

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Portable Fastify Node service with real loopback HTTP proof and database/outbox readiness checks. Failure responses omit connection details.
- **Original remaining-work record:** Deploy the portable service after production adapters/gates. Existing Sites preview is not wired to it.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Deploy the portable service after production adapters/gates. Existing Sites preview is not wired to it.
- **Acceptance:** Runs outside Workers; readiness reflects required DB/queue state without leaking secrets.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** worker/index.ts;lib/site-api.ts / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-002 — Validated request schemas and safe errors

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Strict JSON schemas, body/context bounds, safe error envelopes and rejection of client role/model/owner injection. Portable CSRF and forged-header tests pass.
- **Original remaining-work record:** Continue full route response schemas in API-003 and staging/browser security checks in SEC-003.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Continue full route response schemas in API-003 and staging/browser security checks in SEC-003.
- **Acceptance:** Existing invalid input, role injection, oversized context and provider error tests pass.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** tests/tools.test.mjs / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-004 — Idempotent tool dispatch and cancellation

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Workspace-scoped idempotency key plus canonical request hash. Atomic reservation/dispatch outbox, cancellation and conservative uncertain-outcome fencing pass with provider doubles.
- **Original remaining-work record:** Live provider adapters/reconciliation are separate blocked/incomplete AI integration work B03. Uncertain holds require confirmed outcome before resolution.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Live provider adapters/reconciliation are separate blocked/incomplete AI integration work B03. Uncertain holds require confirmed outcome before resolution.
- **Acceptance:** A retried same operation produces one logical run and at most one settled allowance charge.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-005 — Metadata-only logs and distributed tracing

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Whitelisted metadata logs and W3C trace propagation across actual API request, job and provider-double failure. Raw source, tokens and provider errors are absent from logs.
- **Original remaining-work record:** CloudWatch/OTel export and production alerting remain AWS observability work.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** CloudWatch/OTel export and production alerting remain AWS observability work.
- **Acceptance:** Can trace a failed run across API/job/provider without recording raw code or credentials.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### API-007 — Scheduled cleanup and reconciliation tasks

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Hourly deduplicated cleanup/reconciliation jobs, lease/retry observability and safely replayable export/deletion handlers. Expired unsent holds release; uncertain sent holds remain.
- **Original remaining-work record:** Production scheduler/worker deployment and alerting remain AWS work B02.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Production scheduler/worker deployment and alerting remain AWS work B02.
- **Acceptance:** Scheduled jobs are idempotent, observable and can be safely replayed.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### AUT-006 — Secure sessions and linked identities

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Hashed opaque sessions, CSRF binding, revocation/expiry, fixation rotation and explicit fresh-session identity linking. Matching email never silently links. Forged Sites headers are ignored.
- **Original remaining-work record:** Connect OAuth/OTP verification adapters and session-cookie issuance in AUT-001..004. Production account flow is not live.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Connect OAuth/OTP verification adapters and session-cookie issuance in AUT-001..004. Production account flow is not live.
- **Acceptance:** CSRF, session fixation, replay and revoked-session access tests fail safely.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 46; production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-001 — PostgreSQL schema, migrations and constraints

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Two forward-only migrations, advisory migration lock, historical checksums, ownership/business-key constraints. Empty database, rerun, changed checksum and prior-release upgrade fixtures pass.
- **Original remaining-work record:** Native PostgreSQL/RDS migration verification is tracked as B01/B02 before release.
- **Current clarification:** Four numbered migrations now exist (001 through 004); older evidence mentioning two is historical.
- **Reviewed remaining work:** Preserve all historical checksums. Any new schema change needs a new migration and explicit runtime-role grants; native/deployed migration acceptance remains separate.
- **Acceptance:** Empty DB and prior release migrate successfully; invalid ownership and duplicate business keys are rejected.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Current manifest; production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-002 — Users, identities, sessions and personal workspaces

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Persistent users, verified identities, hashed sessions and one personal workspace per account. Composite tenant keys and two-account negative fixtures pass.
- **Original remaining-work record:** Wire public identity adapters and the existing frontend in AUT-001..004/WRK tasks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Wire public identity adapters and the existing frontend in AUT-001..004/WRK tasks.
- **Acceptance:** Two accounts cannot read/update each others workspace records.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 46;V1 / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-003 — Tool runs, result versions, notes and chats

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Persistent runs, versioned results, optimistic notes, threads/messages. Completed/failed/cancelled runs, notes and chat restore after PGlite restart.
- **Original remaining-work record:** Frontend persistence migration and live chat streaming remain separate work.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Frontend persistence migration and live chat streaming remain separate work.
- **Acceptance:** Completed/failed/cancelled runs and notes restore consistently after process restart.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-007 — Outbox, job retries and dead-letter processing

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Transactional outbox commits with run/hold. Durable leases, retries, bounded backoff, stale-ack fencing and inspectable dead letters pass.
- **Original remaining-work record:** Native concurrent worker contention and production queue operations remain release verification gates B01/B02.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Native concurrent worker contention and production queue operations remain release verification gates B01/B02.
- **Acceptance:** Commit-to-queue failure does not lose work; duplicate delivery is safe and failures are inspectable.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### DAT-008 — Retention, deletion and account export jobs

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Durable export/deletion/object cleanup jobs. Export ownership, immediate access revocation, content redaction, staging cleanup and retention replay fixtures pass.
- **Original remaining-work record:** Approve retention policy; integrate merchant cancellation, provider deletion and backup expiry before production. Standalone chat retention remains open.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Approve retention policy; integrate merchant cancellation, provider deletion and backup expiry before production. Standalone chat retention remains open.
- **Acceptance:** Expired data is cleaned and exports contain only authorized user data.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 37-41 / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### EDT-001 — Code input and additional instructions

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; controlled textareas with input and instruction bounds
- **Original remaining-work record:** Preserve editing state in the portable app.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Preserve editing state in the portable app.
- **Acceptance:** Typing, paste, clear and instructions retain the selected languages and tool.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 06-20,50-57 / Source audit; earlier browser QA

### EDT-002 — Text/source file input

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21 upload; TEST22 language detection; uploadFiles validates size and binary NULs
- **Original remaining-work record:** Cloud upload support is tracked separately in FIL tasks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Cloud upload support is tracked separately in FIL tasks.
- **Acceptance:** Supported local text file opens in source editor; oversized/binary inputs receive errors.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 06-24 / Current automated check

### EDT-006 — Code and execution-output tabs

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21: free converter example executes and returns 55
- **Original remaining-work record:** Five-language remote execution integration is in RUN.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Five-language remote execution integration is in RUN.
- **Acceptance:** JavaScript example switches between code and output without losing either result.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 09-10,50-52 / Source audit; earlier browser QA

### WRK-001 — Dark workspace, sidebar and eight-tool navigation

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; signed-workspace.css and FutureApp
- **Original remaining-work record:** Preserve keyboard and responsive behavior during port.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Preserve keyboard and responsive behavior during port.
- **Acceptance:** All tool navigation and dark workspace areas render with FutureRobotic AI branding.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; V1 / Source audit; earlier browser QA

### WRK-002 — Sidebar collapse and panel layout controls

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21 verified collapse, assistant close/reopen and hide-main-tool
- **Original remaining-work record:** Add viewport regression coverage.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Add viewport regression coverage.
- **Acceptance:** Sidebar/main/assistant toggles recover a usable layout in every allowed state.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1 / Source audit; earlier browser QA

### CHT-001 — Right-hand assistant welcome and quick prompts

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Implemented / Backend / Frontend
- **Original evidence:** QA21; AssistantPanel controls and local guide verified
- **Original remaining-work record:** Preserve interface while replacing preview provider path.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Preserve interface while replacing preview provider path.
- **Acceptance:** Welcome, Add Comments, Improve Results and Debug prompts remain accessible.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 04; V1 / Source audit; earlier browser QA

### TOL-008 — Local comment removal for supported language families

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Implemented / Backend / Frontend
- **Original evidence:** TEST22 covers quoted strings, SQL quoting, shebangs and JS regex examples
- **Original remaining-work record:** Broader language coverage and parser fidelity are separate tasks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Broader language coverage and parser fidelity are separate tasks.
- **Acceptance:** Existing supported-family fixtures preserve strings while removing comments.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 19-20,55 / Current automated check

### FIL-001 — Local file list, search, open and delete

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Implemented / Backend / Frontend
- **Original evidence:** QA21; local file management in FutureApp
- **Original remaining-work record:** Keep local mode available after cloud mode is added.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Keep local mode available after cloud mode is added.
- **Acceptance:** Supported file can be listed, searched, opened and removed within the browser limits.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; V1 / Source audit; earlier browser QA

### HIS-001 — Browser history list, search/filter and restore

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Implemented / Backend / Frontend
- **Original evidence:** QA21 history; local 30-result list in source
- **Original remaining-work record:** Keep local behavior and add regression fixtures.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Keep local behavior and add regression fixtures.
- **Acceptance:** A saved result restores correct tool, languages, source and output.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05; V1 / Source audit; earlier browser QA

### HIS-002 — History JSON export and individual deletion

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Implemented / Backend / Frontend
- **Original evidence:** Source handlers; local history data structures
- **Original remaining-work record:** Verify downloads in an unconstrained browser as part of release QA.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify downloads in an unconstrained browser as part of release QA.
- **Acceptance:** Export contains only local account data; delete removes the intended item.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 33,37; advertised / Source or environment audit

### PDF-001 — Basic multi-page PDF export

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Implemented / Frontend
- **Original evidence:** TEST22: valid three-page PDF; prior Poppler check
- **Original remaining-work record:** Maintain this tested local utility until replacement is validated.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Maintain this tested local utility until replacement is validated.
- **Acceptance:** Long code creates a structurally valid multipage PDF with escaped PDF text.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 21-22 / Current automated check

### RUN-001 — Local plain-JavaScript runner

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Implemented / Backend / Security
- **Original evidence:** QA21 result 55; worker CSP and five-second timeout in source
- **Original remaining-work record:** Keep the offline mode distinct from server runner capability.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Keep the offline mode distinct from server runner capability.
- **Acceptance:** Plain JavaScript runs in a disposable worker with bounded output and timeout.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 10,23-26 / Source audit; earlier browser QA

### WEB-001 — FutureRobotic AI brand, hero and public visual system

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; app/reference-home.tsx, reference.css, layout.tsx
- **Original remaining-work record:** Maintain visual regression coverage during the AWS port.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Maintain visual regression coverage during the AWS port.
- **Acceptance:** Brand, beige background, Geist typography and desktop hero render against reference.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 01-02 / Source audit; earlier browser QA

### WEB-002 — Eight-tool navigation and public routes

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** TEST22; freePaths and eight route files; QA21 navigation
- **Original remaining-work record:** Preserve URLs during migration.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Preserve URLs during migration.
- **Acceptance:** Each of eight menu entries resolves to the correct tool page.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 03,06-24 / Current automated check

### WEB-003 — Homepage four tool cards and calls to action

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; ReferenceHome renders four cards and tool links
- **Original remaining-work record:** Preserve routing and accessible labels.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Preserve routing and accessible labels.
- **Acceptance:** All four cards and both hero/closing calls to action navigate correctly.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 04,48 / Source audit; earlier browser QA

### WEB-004 — Moving language-logo strip and language cards

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; 68 directory assets checked by TEST22
- **Original remaining-work record:** Keep language catalog and counts consistent.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Keep language catalog and counts consistent.
- **Acceptance:** All displayed language logos load; source-language selection passes through correctly.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 01-02,42-43 / Current automated check

### WEB-005 — Workspace promotional preview and benefits section

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** QA21; local preview image with FutureRobotic AI overlays
- **Original remaining-work record:** Replace reference-owned artwork before commercial release where rights are unconfirmed (SEC-012).
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Replace reference-owned artwork before commercial release where rights are unconfirmed (SEC-012).
- **Acceptance:** Workspace image and three benefits columns render with FutureRobotic AI branding.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 05,48 / Source audit; earlier browser QA

### WEB-007 — Monthly and yearly pricing display

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Implemented / Frontend
- **Original evidence:** app/future-app.tsx annual state; prices explicitly preview-only
- **Original remaining-work record:** Connect these displays to approved catalog in BIL tasks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Connect these displays to approved catalog in BIL tasks.
- **Acceptance:** Toggle changes displayed proposed monthly/yearly prices accurately, without implying a purchase.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 27-30 / Source or environment audit

### QAS-001 — Existing TypeScript and utility/API mock suite

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Implemented / QA / Engineering
- **Original evidence:** TEST22: tsc --noEmit and tests/tools.test.mjs pass
- **Original remaining-work record:** Retain checks while adding portable backend coverage.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Retain checks while adding portable backend coverage.
- **Acceptance:** Current 72-language/68-asset/8-route fixtures and API validation checks pass.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Current tests / Current automated check

### SEC-001 — Tenant authorization and anti-IDOR tests

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Two-account route/service fixtures deny guessed/cross-user reads and writes across runs, notes, chats, files, shares, exports and billing views. Composite database ownership keys also reject invalid references.
- **Original remaining-work record:** Repeat negative cases as new routes/adapters are added and on staging before release.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Repeat negative cases as new routes/adapters are added and on staging before release.
- **Acceptance:** Cross-user and guessed-ID reads/writes/deletes fail across runs, chats, files and billing.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.

### SEC-006 — Prompt/context trust boundaries

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Implemented / Codex / Engineering
- **Original evidence:** BUILD-01: Server-built context uses only owned records, fixed trusted roles and bounded attachments. Source remains untrusted JSON data, no tools are exposed, and sessions/secrets are excluded.
- **Original remaining-work record:** Live model quality/adversarial evaluation and streaming/UI integration remain AI/chat release work B03.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Live model quality/adversarial evaluation and streaming/UI integration remain AI/chat release work B03.
- **Acceptance:** Injected code/attachments cannot obtain secrets, other-user data or unapproved tool execution.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** tests/tools.test.mjs; production requirement / 34 passing PostgreSQL-in-WASM integration tests plus TypeScript and existing utility/API regression suite; native multi-connection/RDS/live-provider gates remain unverified.


## Partial — 59 items

### API-003 — OpenAPI specification and typed web client

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** OpenAPI route and browser transport now include preferences, result versions, history jobs and file provenance.
- **Original remaining-work record:** Replace broad response envelopes/default-any client results with complete typed endpoint response contracts and generation/validation.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Replace broad response envelopes/default-any client results with complete typed endpoint response contracts and generation/validation.
- **Acceptance:** Frontend and API agree on error, pagination, idempotency and SSE payload contracts.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-001 — Portable public signup, login and logout

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Current app relies on Sites owner-private authentication
- **Original remaining-work record:** Implement AWS-portable sessions and remove dependence on trusted Sites identity headers.
- **Current clarification:** Portable OAuth/OTP adapters, hashed sessions, CSRF/logout and forged-header rejection exist in portable/src/public-auth.ts, identity.ts and api.ts; the private preview still uses its separate Sites path.
- **Reviewed remaining work:** Complete real public account/browser integration outside Sites, recovery/linking UX and deployed identity/sender acceptance. Do not rebuild the session service merely because the original field is stale.
- **Acceptance:** Account lifecycle works outside ChatGPT; forged oai-authenticated-user-id grants no access.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 46; current app/chatgpt-auth.ts / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-008 — Account export and deletion

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Account exports reuse the pending job on retry. Deletion guards active entitlements and unresolved checkout intents before revoking access. Billing/deletion/checkout share a lifecycle lock.
- **Original remaining-work record:** Complete merchant cancellation/reconciliation handoff, durable export recovery after full reload, and deployed deletion/backup acceptance.
- **Current clarification:** Owned export/deletion jobs, immediate session revocation, paid/unresolved-checkout guard and content redaction exist.
- **Reviewed remaining work:** Complete full-reload export recovery, authoritative merchant cancellation/reconciliation and deployed backup/provider/deletion acceptance.
- **Acceptance:** Deletion removes active user data and access; backup expiry and legally retained records are explained.
- **External gates:** B02/B04/B08
- **Reference / verification:** 33,37-41; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-004 — Files, revisions, extraction and share records

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** BUILD-01: Tenant-scoped file/revision/extraction/share tables, text-object lifecycle, retry keys, tombstones and durable delete jobs. Failed writes and ownership fixtures pass.
- **Original remaining-work record:** Implement revision-update/download/share-resolution APIs, S3 adapter and secure multi-format extraction. Verify S3 lifecycle on AWS.
- **Current clarification:** Revision update/download, share resolution, S3 object/quarantine adapters and bounded UTF-8 extraction already exist in Build03.
- **Reviewed remaining work:** Verify actual S3/KMS/CORS/presign/version cleanup and native races; finish approved parser scope. Binary document parsing/malware scanning is not implemented.
- **Acceptance:** Object lifecycle and ownership survive retries and deletion events.
- **External gates:** B02
- **Reference / verification:** 33,37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-005 — Plans, prices, subscriptions and provider events

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** BUILD-01: Plans/prices/subscriptions/event inbox plus a trusted verified-event service. Replayed/tampered/stale events and repeated period grants are tested.
- **Original remaining-work record:** Verify native concurrent event processing. Add merchant signature adapter and approved plan-change/proration rules; run payment gates.
- **Current clarification:** Raw Paddle signature verification, checkout intent binding and server catalog/period grants already exist.
- **Reviewed remaining work:** Complete approved plan-change/proration/grace behavior and authoritative reconciliation; prove native concurrent events and actual merchant lifecycle.
- **Acceptance:** Duplicate provider events and period grants are harmless under concurrent processing.
- **External gates:** B01
- **Reference / verification:** 27-30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-006 — Usage reservations and append-only allowance ledger

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** BUILD-01: Reserved/consumed/granted accounts and immutable ledger. Request races, rollback, once-only settlement/release and ledger reconciliation pass on PGlite.
- **Original remaining-work record:** Run the native multi-connection suite and contention/failure fixtures. PGlite serializes transactions and cannot prove PostgreSQL replica behavior.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run the native multi-connection suite and contention/failure fixtures. PGlite serializes transactions and cannot prove PostgreSQL replica behavior.
- **Acceptance:** Race/replay fixtures reconcile the same balance without negative spendable allowance.
- **External gates:** B01
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-003 — Syntax highlighting in editable source panels

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** app/studio-editor.tsx uses maintained CodeMirror grammars, scroll/history/indentation and explicit accessible plain-text fallback; browser syntax check passes.
- **Original remaining-work record:** Complete syntax grammar/color coverage for the entire 72-language catalog and replace generic output highlighting where required.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete syntax grammar/color coverage for the entire 72-language catalog and replace generic output highlighting where required.
- **Acceptance:** Source and output coloring, indentation and scrolling work for the advertised language catalog.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 06-26,49-57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### EDT-011 — Progress, cancellation, errors and retry

- **Area / priority / phase:** Shared editor and result controls / P0 / P03
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Busy/AbortController and user-visible errors exist
- **Original remaining-work record:** Add streaming progress and durable job states with retries that do not double charge.
- **Current clarification:** Durable run states, event replay/SSE, cancellation, provider dispatch fencing and idempotency are implemented and mocked.
- **Reviewed remaining work:** Finish resilient browser interruption/session races and run real provider/edge progress, stop/retry/reconnect acceptance without duplicate dispatch or charges.
- **Acceptance:** Cancellation and provider timeouts leave input intact and settle usage exactly once.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 09-10,26,50-57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-006 — Personal notes tied to results

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Owned optimistic notes remain tied to the active server run; history deletion now clears derived notes.
- **Original remaining-work record:** Complete per-result local notes/version restoration and browser race scenarios across all local/remote tools.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete per-result local notes/version restoration and browser race scenarios across all local/remote tools.
- **Acceptance:** Switching results restores the correct note without overwriting another result.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WRK-007 — Plan card, balance and account navigation

- **Area / priority / phase:** Signed-in workspace / P0 / P03
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Sidebar and billing usage now read current server entitlement, ledger balance and monthly credit refresh date instead of hardcoded Free.
- **Original remaining-work record:** Verify UI after real paid activation, renewal, past-due and cancellation events in staging.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify UI after real paid activation, renewal, past-due and cancellation events in staging.
- **Acceptance:** Displayed plan and remaining quota match server ledger after a real signed billing update.
- **External gates:** B02/B04
- **Reference / verification:** 05; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-005 — Attach, inspect and remove chat files

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Single local text/code attachment up to 100 KB; 6,000 characters sent
- **Original remaining-work record:** Integrate cloud-file picker, visible inclusion state and remove/replace controls.
- **Current clarification:** Current assistant source includes owned cloud attachments, inclusion state, inspect/remove controls and bounded frozen context.
- **Reviewed remaining work:** Complete multi-file/replace/accessibility and stale-selection/race browser acceptance against the deployed account backend; do not start from the old local-only attachment description.
- **Acceptance:** Selected attachments can be inspected/removed and unsupported formats fail clearly.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-004 — Code checking with issues and corrected snippets

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Static tool-instructions.ts requests severity, evidence/lines and checker examples; safe review Markdown display exists.
- **Original remaining-work record:** Implement a validated structured issue schema/renderer, severity handling and grounded live-model evaluation.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Implement a validated structured issue schema/renderer, severity handling and grounded live-model evaluation.
- **Acceptance:** Empty-list division by zero is identified in the reference fixture without fabricating tests.
- **External gates:** B03
- **Reference / verification:** 15-16,54,57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-012 — Grounded tool evaluation suite

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Static allowlisted tool prompts, bounded provider context and opt-in evaluation candidates are present. No mocked response is described as real AI quality.
- **Original remaining-work record:** Build the unseen grounded evaluation fixtures, scoring thresholds and actual provider evaluation run.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Build the unseen grounded evaluation fixtures, scoring thresholds and actual provider evaluation run.
- **Acceptance:** Failures are reproducible and release-blocking; transport mocks are not counted as model quality proof.
- **External gates:** B03
- **Reference / verification:** 09-10,50-57 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-002 — Python, JavaScript, C, C++ and Java remote runtimes

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Only browser JavaScript currently runs
- **Original remaining-work record:** Build five version-pinned sandbox images and execution adapters.
- **Current clarification:** Signed remote dispatcher and five-language combined-image gateway/entrypoint source exist.
- **Reviewed remaining work:** Produce five pinned/measured runtime release artifacts and adapters/catalog, scan/build/deploy on the approved sandbox host and run native acceptance.
- **Acceptance:** All five compile/run success, syntax failure and runtime failure fixtures return correct outcomes.
- **External gates:** B01
- **Reference / verification:** 23-26 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-003 — Searchable five-language runner selector

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Runner selector filters exactly Python, JavaScript, C, C++, Java.
- **Original remaining-work record:** Publish and display versions measured from built digest-pinned runtime images; never invent versions from an unbuilt Dockerfile.
- **Current clarification:** The selector offers exactly five languages, but actual built-image versions have not been measured.
- **Reviewed remaining work:** Publish verified versions from digest-pinned built artifacts, keep image/catalog mapping consistent and validate search/selection in browser.
- **Acceptance:** Selector filters exactly five server languages and shows correct runtime/version.
- **External gates:** B01
- **Reference / verification:** 25 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-011 — Billing account page and allowance display

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Account billing displays ledger granted/reserved/consumed/available, credit refresh and paid period separately; portal and stable checkout retries are wired.
- **Original remaining-work record:** Verify actual provider invoice/portal, tax, payment-method and renewal states against merchant sandbox.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify actual provider invoice/portal, tax, payment-method and renewal states against merchant sandbox.
- **Acceptance:** Billing page matches signed provider and usage-ledger state after reload.
- **External gates:** B04
- **Reference / verification:** V1;28,30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-003 — Plan request and context limits

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Unicode limits match PostgreSQL length and UI source/instruction/reference counts; private preview is capped at4,000 and authenticated service at25k/100k.
- **Original remaining-work record:** Wire guarded public anonymous AI/execution dispatch and settle the approved Standard-vs-Advanced usage/paid-execution policies.
- **Current clarification:** Unicode request/context enforcement exists; main-tool model choice is still Auto and public anonymous routes are not wired.
- **Reviewed remaining work:** Wire guarded anonymous AI/execution dispatch. Implement final approved Standard-vs-Advanced and paid-execution policy; current AI runs all use the credit reservation bucket.
- **Acceptance:** Concurrent APIs enforce server policy independent of frontend limits or model selection.
- **External gates:** B02/B03/B08
- **Reference / verification:** Inventory and28,30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-004 — Durable reservation, settle and release ledger

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** BUILD-01: Row-locked durable reserve/settle/release service. Overspend, duplicate delivery, cancellation, rejection, timeout and crash-fence fixtures pass on PGlite.
- **Original remaining-work record:** Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run native PostgreSQL contention/failure tests, then live provider outcome reconciliation. Unknown acceptance remains held safely.
- **Acceptance:** Concurrent requests never overspend; timeouts/replays cannot charge twice or bypass caps.
- **External gates:** B01
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-010 — Contact page and message form

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Authenticated support tickets now have a shared durable five-per-hour user rate window. Account ownership and input validation are tested.
- **Original remaining-work record:** Add durable idempotent acknowledgement outbox, delivery/recovery UI, verified sender and actual support delivery.
- **Current clarification:** Owned support-ticket persistence and durable send-attempt rate limit exist.
- **Reviewed remaining work:** Implement acknowledgement outbox/delivery recovery/status and prove verified-sender support delivery/bounce/complaint behavior.
- **Acceptance:** Valid form creates one ticket and an acknowledgement; failed delivery is recoverable.
- **External gates:** B07
- **Reference / verification:** 34-35 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-015 — English and French website localization

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** English interface and explicit English metadata remain.
- **Original remaining-work record:** Implement complete French strings, locale routing/switching/persistence, translated guides/help and language metadata.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Implement complete French strings, locale routing/switching/persistence, translated guides/help and language metadata.
- **Acceptance:** English/French selection changes all covered UI and uses correct canonical/hreflang behavior.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 47 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-016 — Search metadata, sitemap and indexing policy

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Framework robots/sitemap routes and standalone canonical/sitemap generation default to noindex unless public HTTPS origin and indexing approval are configured. Sensitive routes stay excluded.
- **Original remaining-work record:** Finish static framework-page canonicals, approved domain configuration and observed public indexing/redirect checks.
- **Current clarification:** Default noindex gating, standalone canonical/sitemap source and language routes exist.
- **Reviewed remaining work:** Finish framework static-page canonical coverage; configure the actual approved domain and verify public redirects/robots/sitemap/indexing after authorized cutover.
- **Acceptance:** Public pages index correctly; workspace, shared-sensitive and auth pages are excluded as intended.
- **External gates:** B02/B05/B08
- **Reference / verification:** 02,07,12,14,16,18,20,22,24,43,45 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-017 — Mobile and tablet reference adaptation

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Responsive CSS exists; only desktop was previously verified
- **Original remaining-work record:** Test real viewports, keyboard interactions and assistant overlay behavior.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Test real viewports, keyboard interactions and assistant overlay behavior.
- **Acceptance:** At 360/390/768/1024 widths every core action remains usable without horizontal page overflow.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Archive says mobile not captured / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-002 — Frontend reference screenshots and interaction regression

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Recorded desktop Chromium interactions cover syntax, fullscreen Escape, plain fallback, comments, five-language selector, local execution55, PDF50k, help search and directory routing.
- **Original remaining-work record:** Automate deterministic screenshot/action baselines and complete four viewport sizes and supported browser engines.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Automate deterministic screenshot/action baselines and complete four viewport sizes and supported browser engines.
- **Acceptance:** All reference families and right-chat panel states pass visual and functional comparison.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 01-57; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-010 — Accessibility and cross-browser compatibility

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Keyboard source fallback, fullscreen focus/Escape, safe Markdown, searchable help and existing accessible labels are present.
- **Original remaining-work record:** Complete WCAG keyboard/screen-reader audit and actual cross-browser/mobile checks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete WCAG keyboard/screen-reader audit and actual cross-browser/mobile checks.
- **Acceptance:** Core workflows complete with keyboard and required WCAG 2.2 AA checks pass.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** 01-57; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-003 — Secure HTTP, cookies, CSRF and content policies

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Same-origin API check and runner CSP exist
- **Original remaining-work record:** Harden portable sessions, CORS, headers and sanitized Markdown/link behavior.
- **Current clarification:** Production-cookie settings, portable Origin/CSRF enforcement, sanitized Markdown/link controls and negative fixtures already exist.
- **Reviewed remaining work:** Complete headers/CORS/CSP/cookie/edge audit in the actual deployment and prove session/cache isolation across browser engines. Keep named partial status until full acceptance.
- **Acceptance:** CSRF, XSS and cross-origin fixture suites fail safely on staging.
- **External gates:** None assigned; inspect the actual scenario prerequisites.
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-008 — Consent and privacy implementation

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Generic policy text and local-storage preferences only
- **Original remaining-work record:** Implement consent where required and document actual region/provider/retention flows.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Implement consent where required and document actual region/provider/retention flows.
- **Acceptance:** User preferences affect storage/evaluation behavior and relevant metadata is auditable.
- **External gates:** B08
- **Reference / verification:** 37-41 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-010 — Dependency, container and supply-chain checks

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Lockfile and TypeScript tests exist
- **Original remaining-work record:** Pin runtimes, scan dependencies/images, create SBOM and verify provenance in CI.
- **Current clarification:** Final image-digest publication and workflow/SBOM scaffolding exist; base tags and combined runner packages remain unpinned.
- **Reviewed remaining work:** Pin actual dependencies/base/runtime inputs, run clean protected CI scans and verify provenance; inspect findings and record approved remediation.
- **Acceptance:** Release images have no unresolved policy-blocking findings and map to a source commit.
- **External gates:** B01
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-012 — Commercial asset/font rights and own artwork

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Reference tool art/screenshots/fonts were downloaded for requested visual matching
- **Original remaining-work record:** Replace reference product artwork with own recreated visuals and verify third-party licenses.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Replace reference product artwork with own recreated visuals and verify third-party licenses.
- **Acceptance:** Release asset manifest records sources/licenses; no unapproved reference product branding/art remains.
- **External gates:** B08
- **Reference / verification:** README.md Visual assets;01-05 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### API-006 — Account/files/history/billing/support CRUD

- **Area / priority / phase:** Portable backend contracts / P0 / P01
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Owned preference, file revision, result-version and bulk-history APIs added with validation; existing ownership fixtures pass.
- **Original remaining-work record:** Complete operator enrollment/console, correction/refund/invoice interfaces, support acknowledgements and native deployed browser acceptance.
- **Current clarification:** Owned account/files/history/billing/support CRUD and limited operator endpoints exist.
- **Reviewed remaining work:** Finish protected operator enrollment/console, correction/refund/invoice workflows, support acknowledgement and native deployed account-browser acceptance.
- **Acceptance:** Every list/read/write path has positive and negative ownership tests.
- **External gates:** B02/B04/B07
- **Reference / verification:** Current worker; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-003 — GitHub login

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** portable/src/public-auth.ts: verified primary GitHub email; no silent linking fixture passes
- **Original remaining-work record:** Verify real GitHub consent/callback and explicit account linking UI.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify real GitHub consent/callback and explicit account linking UI.
- **Acceptance:** GitHub login succeeds without silently linking an unverified matching email.
- **External gates:** B05/B06
- **Reference / verification:** 46 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-005 — Human verification and account-abuse controls

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Turnstile adapter, one-use token fingerprints and durable OTP/send windows; flood fixtures pass
- **Original remaining-work record:** Validate actual hostname/action and viewer-IP handling through CloudFront. OAuth abuse tuning remains.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Validate actual hostname/action and viewer-IP handling through CloudFront. OAuth abuse tuning remains.
- **Acceptance:** Signup/OTP flood fixtures throttle before sending excess messages or spending AI quota.
- **External gates:** B02/B05
- **Reference / verification:** 46 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-009 — Operator access with MFA and role checks

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** portable/src/protection.ts: role-gated replay-resistant TOTP; API controls/support gates; audit tests
- **Original remaining-work record:** Protected operator enrollment, operator console and live MFA acceptance remain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Protected operator enrollment, operator console and live MFA acceptance remain.
- **Acceptance:** Ordinary users cannot access support, billing correction or feature-flag controls.
- **External gates:** B02/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-003 — Persisted chat sessions and messages

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Newest-first 50-message pages and older cursors recover 125 messages without overlap; selected-session restore remains owned.
- **Original remaining-work record:** Complete deployed reload/second-device acceptance and remaining session-switch/older-page browser race coverage.
- **Current clarification:** Newer chat page, earlier cursor recovery and selected-session preference restoration exist.
- **Reviewed remaining work:** Complete session-switch/late-response/older-page race coverage and actual reload/second-device browser acceptance.
- **Acceptance:** Reload restores the selected session; another user cannot list/read it.
- **External gates:** B02/B06
- **Reference / verification:** 33,37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-008 — Upload quarantine and extraction jobs

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Quarantine metadata, signed size/checksum verification, extraction outbox and safe-prefix promotion; integrity fixture passes
- **Original remaining-work record:** Verify S3 retries/lifecycle and failed-job recovery; binary parsers/malware scanning are not implemented.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify S3 retries/lifecycle and failed-job recovery; binary parsers/malware scanning are not implemented.
- **Acceptance:** Only clean extracted files become context; failed jobs can be retried without duplicate records.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-010 — File revisions, checksums and stale-context handling

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Cloud file revision editing, expected-version save, provenance/checksum list, file pagination and actual sizes are wired. Stale and frozen-context fixtures pass.
- **Original remaining-work record:** Run concurrent revision edits against deployed native storage and complete owned file-browser acceptance.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run concurrent revision edits against deployed native storage and complete owned file-browser acceptance.
- **Acceptance:** Results disclose the revision used; later uploads do not silently change past context.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-003 — Cloud history with pagination and cross-device sync

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Paged owner-scoped durable run history and browser load-more/detail/note wiring; API cursor tests pass
- **Original remaining-work record:** Second-device browser acceptance, complete cloud export UI and local-tool history persistence remain.
- **Current clarification:** Cloud owned-run pagination and bulk history export/delete jobs are implemented.
- **Reviewed remaining work:** Finish local-tool cloud result/notes persistence, export recovery after reload and actual cross-device synchronization acceptance.
- **Acceptance:** Results persist across devices and paginate without leaking other users records.
- **External gates:** B02/B06
- **Reference / verification:** 05,33,37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### PDF-007 — Browser print and Unicode-aware syntax export

- **Area / priority / phase:** Code-to-PDF / P0 / P06
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Embedded Unicode font, glyph rejection/system-font print fallback, escaped print HTML and long-line pagination tests
- **Original remaining-work record:** Verify downloaded bytes and print output in target browsers; complete syntax-color parity and additional glyph coverage. Browser export UI succeeded, automation download-path wait timed out.
- **Current clarification:** Embedded font PDF generation and sandboxed 50k print preview exist; automated valid-document tests pass.
- **Reviewed remaining work:** Complete syntax/color/glyph/download-print parity and actual downloaded-byte/print browser acceptance. Do not count a successful UI click as downloaded-file evidence.
- **Acceptance:** Print-to-PDF and direct export preserve representative Unicode, long lines and pagination.
- **External gates:** B01
- **Reference / verification:** 21-22,49 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-005 — 10,000-character runner policy and daily usage

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Server admission and shared durable three/day counter, five-language/10k character validation; race/idempotency fixtures pass
- **Original remaining-work record:** Public anonymous execution route and end-to-end native runtime enforcement remain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Public anonymous execution route and end-to-end native runtime enforcement remain.
- **Acceptance:** Configured 10,000-character input and public run allowance are enforced concurrently.
- **External gates:** B01/B02
- **Reference / verification:** 23-26; inventory / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-010 — Sandbox lifecycle, patching and abuse response

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Disposable container/work dirs, digest pinning, cleanup, zero-default fleet, drain/rebuild incident runbook
- **Original remaining-work record:** Rehearse residue/patch/drain/key-rotation and host failure on real fleet.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Rehearse residue/patch/drain/key-rotation and host failure on real fleet.
- **Acceptance:** No cross-job residue remains; compromised/overloaded fleet can be drained without affecting normal web service.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-004 — Subscription state and entitlement synchronization

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Bound paid transactions grant periods; checkout/active update alone cannot mint; cancel/past-due mapping and browser billing view
- **Original remaining-work record:** Complete all provider states/grace and actual paid lifecycle browser acceptance.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete all provider states/grace and actual paid lifecycle browser acceptance.
- **Acceptance:** Only valid paid state grants paid entitlements; grace behavior is explicit and tested.
- **External gates:** B04/B08
- **Reference / verification:** 27-30; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-005 — Renewal allowances and Advanced monthly usage

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** credit-period.ts anchors monthly credits within annual paid periods, preserving Jan31/Feb29/Mar31 UTC boundaries. Current month grants are unique; expired months do not roll into availability.
- **Original remaining-work record:** Validate live merchant annual renewal, plan-change/proration and grace-policy scenarios before paid release.
- **Current clarification:** Build03 adds idempotent monthly grant windows inside annual paid periods with short-month/leap-year anchor tests.
- **Reviewed remaining work:** Verify actual renewal/annual lifecycle, plan change, proration and grace under approved policy; do not rebuild calendar windows from the older README.
- **Acceptance:** Renewal grants exactly one configured allowance despite webhook replay or delayed events.
- **External gates:** B04/B08
- **Reference / verification:** 28,30; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-008 — Invoices, currencies, tax and country eligibility

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Shared proposed USD cents catalog, server live-price check and country allowlist; wrong price/country fixtures pass
- **Original remaining-work record:** Provider-verified billing country, actual tax/invoices and supported-market eligibility remain; multi-currency is not implemented.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Provider-verified billing country, actual tax/invoices and supported-market eligibility remain; multi-currency is not implemented.
- **Acceptance:** Supported-country checkout uses correct price/currency; unsupported countries receive a clear message.
- **External gates:** B04/B08
- **Reference / verification:** 27-30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-010 — Payment failures, retries and reconciliation

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Uncertain checkout fence, past-due subscription mapping, read-only financial exception queries and incident runbook
- **Original remaining-work record:** Provider payment-failure/retry reconciliation API and automated mismatch recovery remain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Provider payment-failure/retry reconciliation API and automated mismatch recovery remain.
- **Acceptance:** No access is granted for failed checkout; mismatched paid state is detected and recoverable.
- **External gates:** B04
- **Reference / verification:** 33; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-012 — Chargebacks, fraud and administrative corrections

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Signed chargeback/refund/credit adjustment inbox, audit and no ledger deletion; chargeback suspends entitlement
- **Original remaining-work record:** Complete provider dispute/correction lifecycle, role-limited correction UI and merchant tests.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete provider dispute/correction lifecycle, role-limited correction UI and merchant tests.
- **Acceptance:** Dispute/correction cannot erase ledger history and does not silently mint credits.
- **External gates:** B04/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-001 — Anonymous daily tool and execution allowances

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Durable HMAC subject/day two-AI/three-execution reservation service and concurrency tests
- **Original remaining-work record:** Connect both public anonymous dispatch routes with human/abuse protection and recovery; currently execution API requires account.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Connect both public anonymous dispatch routes with human/abuse protection and recovery; currently execution API requires account.
- **Acceptance:** Configured two AI uses/day and three executions/day are enforced before provider/runner dispatch.
- **External gates:** B01/B03
- **Reference / verification:** Inventory observed public limits / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-006 — Provider/model spending ceiling and emergency stop

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Atomic day spend holds, conservative bounded provider estimates, MFA kill switch and ceiling/finalize/replay tests
- **Original remaining-work record:** Reconcile estimates to real model pricing/invoices and verify emergency stop across deployed workers.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Reconcile estimates to real model pricing/invoices and verify emergency stop across deployed workers.
- **Acceptance:** Exceeding configured budget rejects new paid-provider dispatch while local tools remain available.
- **External gates:** B02/B03
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-008 — Detailed plan comparison table

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Cards and detailed comparison use shared planCatalog USD cents; browser comparison fixture passes
- **Original remaining-work record:** Merchant prices must be approved; file capacity and annual/monthly allowance behavior must match every published comparison cell.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Merchant prices must be approved; file capacity and annual/monthly allowance behavior must match every published comparison cell.
- **Acceptance:** All cards, comparison cells and checkout price identifiers agree with the active catalog.
- **External gates:** B04/B08
- **Reference / verification:** 28,30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-001 — Separate staging and production infrastructure as code

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Application/Edge/Runner CDK stacks synthesize independently for staging/production; six offline templates
- **Original remaining-work record:** Owner-reviewed change sets, bootstrap/apply/drift/destroy protection and actual environment verification.
- **Current clarification:** Application/edge/optional runner templates for staging/production synthesize offline.
- **Reviewed remaining work:** Finish bootstrap/drift/retention protections and review/apply owner-specific change sets. Offline fixture is never deployable production evidence.
- **Acceptance:** Staging and production can be independently planned/applied/destroyed within approved limits.
- **External gates:** B02/B05
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-005 — ECS Fargate web/API services and ALB health

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Existing private API/web/worker CDK services and locked container sources remain.
- **Original remaining-work record:** Codex must complete first-deploy image/migration/bootstrap orchestration before actual AWS rollout testing.
- **Current clarification:** ECS tasks, roles, private ALB health/deployment-circuit source exist; first image/migration dependency ordering is not automated.
- **Reviewed remaining work:** Codex must implement an initial bootstrap workflow separate from the existing service update workflow, then prove staging rollout/health/rollback.
- **Acceptance:** A task/AZ failure and deployment rollout preserve service availability within the release target.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-007 — WAF, origin restriction and public abuse limits

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Private ALB, CloudFront VPC origin, IP/auth WAF rates and managed IP reputation source
- **Original remaining-work record:** Tighten managed-origin SG after creation and demonstrate direct-origin/abuse denial in staging.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Tighten managed-origin SG after creation and demonstrate direct-origin/abuse denial in staging.
- **Acceptance:** Direct-origin bypass and abusive requests fail without blocking normal auth/API usage.
- **External gates:** B02/B05
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-012 — SES domain, DKIM and delivery events

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; SES identity/DKIM/configuration-set event destination and OTP mailer source
- **Original remaining-work record:** Verify domain, SES production sending, actual delivery/bounce/complaint handling and support mailbox.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify domain, SES production sending, actual delivery/bounce/complaint handling and support mailbox.
- **Acceptance:** OTP/support delivery works for eligible recipients and bounce/complaint events are handled.
- **External gates:** B02/B05/B07
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-014 — Metrics, logs, alerts and synthetic checks

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Existing metadata logging and base alarm source remains.
- **Original remaining-work record:** Codex must complete latency/financial dashboards and alert wiring, then measure real delivery/synthetic checks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Codex must complete latency/financial dashboards and alert wiring, then measure real delivery/synthetic checks.
- **Acceptance:** Test alerts for 5xx, latency, AI errors, queue depth, DB and quota/billing anomalies reach owner.
- **External gates:** B02/B07
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-015 — Backups, restore and regional disaster recovery

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Existing RDS/S3 backup and restore/rollback runbooks remain.
- **Original remaining-work record:** Codex must implement second-region backup/key-copy configuration and then run measured restores with deleted-user reconciliation.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Codex must implement second-region backup/key-copy configuration and then run measured restores with deleted-user reconciliation.
- **Acceptance:** Measured restoration recovers app, files and financial invariants within agreed targets.
- **External gates:** B02/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-008 — Load, saturation and autoscaling checks

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** 100 real loopback readiness requests at concurrency 10: zero errors; 10,000-row indexed history fixture; bounded load script
- **Original remaining-work record:** Measure native DB, AI/runner saturation, fairness and ECS autoscaling at approved staging targets.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Measure native DB, AI/runner saturation, fairness and ECS autoscaling at approved staging targets.
- **Acceptance:** Latency/error/queue/concurrency targets hold and overload returns controlled admission errors.
- **External gates:** B01/B02/B03
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-005 — Upload/archive and content extraction safety

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Bounded ZIP central/local header/ratio/CRC/UTF-8/path/symlink tests; text quarantine integrity/promotion tests
- **Original remaining-work record:** Audit native parser resource behavior, S3 retry races and any future binary extraction/malware pipeline.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Audit native parser resource behavior, S3 retry races and any future binary extraction/malware pipeline.
- **Acceptance:** Archive and parser abuse fixtures are rejected without application outage.
- **External gates:** B01/B02
- **Reference / verification:** 33; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-007 — Account abuse, bot and spend protection

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Turnstile/public identity rate guards, shared anonymous counters, model/spend ceiling and MFA controls; fixtures pass
- **Original remaining-work record:** Complete anonymous dispatch integration and verify edge client-IP, WAF and provider/runner costs under deployed abuse.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Complete anonymous dispatch integration and verify edge client-IP, WAF and provider/runner costs under deployed abuse.
- **Acceptance:** Automated abuse is bounded before provider and runner costs escalate.
- **External gates:** B01/B02/B03
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-009 — Security audit trail and operator actions

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Append-only DB audit/ledger guards, MFA role/one-use operator controls and safe metadata logs; tests pass
- **Original remaining-work record:** Protected operator enrollment/console, native privilege checks and observed CloudTrail/alert review remain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Protected operator enrollment/console, native privilege checks and observed CloudTrail/alert review remain.
- **Acceptance:** Admin changes are attributable, append-only and access controlled.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-005 — Support, incident response and on-call runbooks

- **Area / priority / phase:** Launch and operations / P0 / P12
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** ops/INCIDENTS.md: support/on-call, AI cost, runner drain, payments, data recovery and availability procedures
- **Original remaining-work record:** Assign actual support/on-call contact; wire mailbox/alerts and perform an incident drill.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Assign actual support/on-call contact; wire mailbox/alerts and perform an incident drill.
- **Acceptance:** Simulated incident reaches owner and runbook restores/restricts affected service.
- **External gates:** B02/B07/B08
- **Reference / verification:** 34-35; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-006 — Post-launch reconciliation and maintenance

- **Area / priority / phase:** Launch and operations / P0 / P13
- **Status / owner:** Partial / Codex owns remaining engineering; owner supplies listed external gates
- **Original evidence:** Financial invariant query and local completed-run checks remain. Monthly grant boundaries now have explicit fixtures.
- **Original remaining-work record:** Implement authoritative provider/merchant reconciliation and record actual post-launch exception resolution.
- **Current clarification:** Read-only finance exception SQL and conservative uncertain-outcome handling exist.
- **Reviewed remaining work:** Implement authoritative provider/merchant reconciliation and audited corrections, then observe real operating-window mismatches, alerts and maintenance.
- **Acceptance:** First operation period reconciles provider spend, revenue events and allowances with documented exceptions.
- **External gates:** B02/B03/B04
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates


## Blocked — 64 items

### ENV-001 — Docker image build and execution verification

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Codex on Docker/gVisor-capable CI or owner host
- **Original evidence:** Docker unavailable; native multi-connection/container/runtime checks remain unperformed. Images and probe source are prepared.
- **Original remaining-work record:** Use a Docker-capable CI runner or owner environment. Image files can be authored before this is resolved.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Use a Docker-capable CI runner or owner environment. Image files can be authored before this is resolved.
- **Acceptance:** Build API, web and all runner images; run smoke and isolation tests; retain logs.
- **External gates:** B01
- **Reference / verification:** Production requirement / Source or environment audit

### ENV-002 — AWS account deployment and infrastructure verification

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner supplies AWS role; Codex provisions/tests
- **Original evidence:** Six AWS stacks synthesize offline; no AWS account/deployment role supplied.
- **Original remaining-work record:** Owner supplies a scoped role/CI OIDC setup and account budget. Infrastructure code can proceed.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner supplies a scoped role/CI OIDC setup and account budget. Infrastructure code can proceed.
- **Acceptance:** Assume approved role; apply staging infrastructure; record account/region privately and deployment outputs.
- **External gates:** B02
- **Reference / verification:** Production requirement / Source or environment audit

### ENV-003 — Real AI tools and chatbot provider verification

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner configures protected AI; Codex verifies
- **Original evidence:** Provider-neutral streaming adapter and mock contracts pass; no live secret/quota/model policy supplied.
- **Original remaining-work record:** Provide an approved server secret and usable model quota. Adapter work does not require exposing a key.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Provide an approved server secret and usable model quota. Adapter work does not require exposing a key.
- **Acceptance:** One real request per AI workflow and a follow-up chat succeed; usage reconciles; error cases verified.
- **External gates:** B03
- **Reference / verification:** 06-20,50-57; V1 / Source or environment audit

### ENV-004 — Live subscription, renewal and refund verification

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner configures merchant; Codex integrates/tests
- **Original evidence:** Paddle signature/checkout/portal source and contracts pass; merchant credentials and live-test authorization are absent.
- **Original remaining-work record:** Approved merchant account, live price IDs, signing secret and controlled live test authorization required.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Approved merchant account, live price IDs, signing secret and controlled live test authorization required.
- **Acceptance:** Live payment, entitlement, cancellation and refund reconcile against signed provider events.
- **External gates:** B04
- **Reference / verification:** 27-30 / Source or environment audit

### ENV-005 — Production domain and DNS control

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner chooses domain/DNS; Codex configures
- **Original evidence:** Only the generated owner-private Site domain exists; no owned production domain supplied.
- **Original remaining-work record:** Owner selects a domain and supplies DNS control through its normal account.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner selects a domain and supplies DNS control through its normal account.
- **Acceptance:** TLS works on apex/app domains; redirects, email records and DNS rollback are verified.
- **External gates:** B05
- **Reference / verification:** Production requirement / Source or environment audit

### ENV-006 — Google and GitHub production OAuth credentials

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner registers OAuth apps; Codex verifies
- **Original evidence:** Google/GitHub adapters and fixtures pass; owner production OAuth applications are missing.
- **Original remaining-work record:** Create owner-controlled OAuth applications with verified production callback URLs.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Create owner-controlled OAuth applications with verified production callback URLs.
- **Acceptance:** Both real login flows and safe account linking work on the production domain.
- **External gates:** B06
- **Reference / verification:** 46 / Source or environment audit

### ENV-007 — Transactional email delivery and sender approval

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner supplies sender/mailbox; Codex verifies
- **Original evidence:** SES OTP source is implemented; verified sender, SES production access and support delivery are missing.
- **Original remaining-work record:** Verify sender domain and request SES production access; configure bounce/complaint handling.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify sender domain and request SES production access; configure bounce/complaint handling.
- **Acceptance:** OTP and support messages reach permitted external inboxes; expired codes and delivery failure handled.
- **External gates:** B07
- **Reference / verification:** 34-35,46 / Source or environment audit

### ENV-008 — Business, country, pricing and policy approval

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner approves commitments; Codex implements
- **Original evidence:** Proposed catalog and closed policy/gate configuration exist; business/country/pricing/fair-use/refund/retention decisions are unapproved.
- **Original remaining-work record:** Owner supplies business identity, merchant eligibility, supported countries, refund and retention decisions.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner supplies business identity, merchant eligibility, supported countries, refund and retention decisions.
- **Acceptance:** Published terms, country eligibility, prices and data practices match approved operating configuration.
- **External gates:** B08
- **Reference / verification:** 27-41; inventory advertised capabilities / Source or environment audit

### ENV-010 — CI repository and deployment-role trust

- **Area / priority / phase:** External access and environment / P0 / P00
- **Status / owner:** Blocked / Owner selects protected repo/trust; Codex runs CI
- **Original evidence:** Scoped OIDC/workflow source is prepared; protected owner CI environment has not been configured.
- **Original remaining-work record:** Choose owner repository/CI and authorize a narrowly scoped AWS OIDC trust policy. CI files can be written beforehand.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Choose owner repository/CI and authorize a narrowly scoped AWS OIDC trust policy. CI files can be written beforehand.
- **Acceptance:** Protected production workflow obtains short-lived credentials and only deploys approved artifacts.
- **External gates:** B09
- **Reference / verification:** Production requirement / Source or environment audit

### QAS-006 — Live low-value payment and refund verification

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / QA / Engineering
- **Original evidence:** No approved merchant/live testing authorization
- **Original remaining-work record:** Run owner-authorized live purchase/refund after sandbox gates; do not fabricate proof.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run owner-authorized live purchase/refund after sandbox gates; do not fabricate proof.
- **Acceptance:** Retain private evidence linking payment event, entitlement, invoice and refund.
- **External gates:** B04
- **Reference / verification:** Production requirement / Source or environment audit

### CHT-002 — Contextual real follow-up chat

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Chat adapter, bounded context and mock tests exist; no live secret Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Connect portable API and real-provider verification.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Connect portable API and real-provider verification.
- **Acceptance:** New question uses current source/result and conversation; a real reply returns without fabricated execution.
- **External gates:** B03
- **Reference / verification:** V1; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-001 — Arbitrary source-to-target code conversion

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** lib/site-api.ts adapter and mock tests; four exact local examples only Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Connect portable backend and real provider; evaluate varied unseen programs.
- **Current clarification:** Generic conversion workflow, prompt routing, context and streaming source exist; fixed local examples are not evidence of arbitrary AI conversion.
- **Reviewed remaining work:** Run unseen semantic conversions against the configured approved provider and isolated/trusted test harness; implement any schema/language/output validation gaps found.
- **Acceptance:** Unseen conversions preserve testable behavior and are labeled generated until independently run.
- **External gates:** B03
- **Reference / verification:** 06-10 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-002 — Natural-language code generation

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Generator route, prompt input and server task exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Add structured output, real generation tests and runnable result integration.
- **Current clarification:** Generator UI/backend task/prompt and provider adapter exist. Live output has not been verified.
- **Reviewed remaining work:** Codex can complete structured output/language validation and runnable-result integration without credentials; actual unseen generation quality/cost needs B03.
- **Acceptance:** New requirements produce the selected language and obey extra instructions.
- **External gates:** B03
- **Reference / verification:** 11-12,52 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-003 — Code explanation with examples and complexity

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Explainer route and server task exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Return structured Markdown and validate usefulness against curated fixtures.
- **Current clarification:** Explanation route and safe Markdown rendering/export exist.
- **Reviewed remaining work:** Complete output/evaluation contract as needed and run actual provider usefulness/complexity/example acceptance; do not present reference-site output as ours.
- **Acceptance:** Explanation includes behavior and edge cases with accurate code examples; no false execution claims.
- **External gates:** B03
- **Reference / verification:** 13-14,53,56 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-005 — Complete corrected code from fixer

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Fixer route and fix prompt exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Validate fixed output, language and original constraints; preserve original code.
- **Current clarification:** Fix workflow, diff, What I Changed and original-preserving result versions exist.
- **Reviewed remaining work:** Prove real provider fixes against unseen defects/constraints and native supported execution; verify no unmeasured claim of successful tests.
- **Acceptance:** Broken-loop fixture returns complete corrected code; source remains available for comparison.
- **External gates:** B03
- **Reference / verification:** 17-18,50-51 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-006 — Plan-based file and storage limits

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** file-capacity.ts serializes all direct/quarantine/revision capacity paths. Staged files, all retained revision bytes, 100/250 file limits, per-file100KB and20-revision limit are enforced. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Run native multi-connection contention and real S3 race tests; PGlite serialized transactions are not proof of native contention.
- **Current clarification:** Shared file-capacity transaction lock, active-plan limits and staged/revision byte accounting are implemented and serialized-fixture tested.
- **Reviewed remaining work:** Run native concurrent direct/quarantine/revision/deletion and real S3 race acceptance; validate final approved entitlements.
- **Acceptance:** Concurrent uploads cannot exceed configured 100/250 paid file counts or byte limits.
- **External gates:** B01/B02
- **Reference / verification:** 28,30; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-004 — stdout, stderr, exit code and elapsed time

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Dispatch validates bounded stdout/stderr, exit code, duration, phase, truncation and timeout flags; server derives the displayed execution status. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Exercise the actual signed isolated gateway for all five runtimes and verify every failure outcome.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Exercise the actual signed isolated gateway for all five runtimes and verify every failure outcome.
- **Acceptance:** Success, compile error, runtime error and timeout display distinct status and duration.
- **External gates:** B01/B02
- **Reference / verification:** 26 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-009 — No network, packages or interactive stdin policy

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Local worker has connect-src none; remote service absent Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Enforce equivalent remote egress/installation/stdin restrictions and publish limits.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Enforce equivalent remote egress/installation/stdin restrictions and publish limits.
- **Acceptance:** Blocked network and package installation tests fail; standard-library samples work.
- **External gates:** B01/B02
- **Reference / verification:** 23-26; inventory / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-001 — Versioned Free, Pro and Premium catalog

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Proposed price cards exist only in frontend Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Create server plan/price/entitlement catalog; preserve reference values as comparison inputs until approved.
- **Current clarification:** Server Free/Pro/Premium catalog and price checks exist in product-policy.ts and merchant.ts; current USD prices are proposed, not approved.
- **Reviewed remaining work:** Owner approves prices/entitlements and merchant IDs. Codex must align UI/server/merchant and policy tests. Multi-currency remains unimplemented; do not create a second catalog from the stale text.
- **Acceptance:** Monthly/yearly catalog, entitlements and checkout IDs remain consistent for all supported currencies.
- **External gates:** B04/B08
- **Reference / verification:** 27-30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-002 — Free-account initial credits

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** BUILD-01: Verified-account starter grant keyed once per account. Thirty parallel application calls and replay leave exactly five credits and one grant on PGlite. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Prove multi-connection concurrent signup/login using the native PostgreSQL suite. Public signup verification is separate auth work.
- **Current clarification:** Once-only verified-account starter grant is implemented and passes serialized SQL fixtures.
- **Reviewed remaining work:** Prove native multi-connection signup/login/replay with real public identity acceptance; do not reimplement the starter ledger.
- **Acceptance:** Repeated login, replay and concurrent signup cannot duplicate the initial grant.
- **External gates:** B01
- **Reference / verification:** 28,30,33 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QTA-005 — Distributed rate and concurrency limits

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** BUILD-01: Database-shared fixed-window limits and renewable concurrency leases. Two service instances enforce shared limits in application-level race tests. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify actual separate API/worker processes and native database connections under contention/load. Configure deployment limits and worker monitoring.
- **Current clarification:** Shared durable limit/lease primitives exist and are tested within PGlite.
- **Reviewed remaining work:** Prove separate replicas/native connections, lease loss, pool failure and real load behavior before calling limits distributed in production.
- **Acceptance:** Multiple API replicas enforce the same limits and cannot be bypassed by instance changes.
- **External gates:** B01/B02
- **Reference / verification:** lib/site-api.ts; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-012 — Production Privacy Policy and Terms

- **Area / priority / phase:** Public website and discovery / P0 / P08
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Generic preview policy and terms routes exist Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Replace preview terms with owner-approved business, country, payment and retention language.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Replace preview terms with owner-approved business, country, payment and retention language.
- **Acceptance:** All required policy sections, dates, contacts and navigation are approved and linkable.
- **External gates:** B08
- **Reference / verification:** 38-41 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### WEB-018 — Partnerships or affiliate destination

- **Area / priority / phase:** Public website and discovery / P1 / P08
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Footer Partnerships link routes to contact Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Provide an owner-approved program/application destination without claiming unsupported payouts.
- **Current clarification:** A distinct partnerships page exists and honestly states the program is not open.
- **Reviewed remaining work:** Owner decides actual program/destination; Codex wires only approved application/payout promises and tests links.
- **Acceptance:** Link opens the actual approved destination and application submission is acknowledged.
- **External gates:** B08
- **Reference / verification:** 47 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-002 — Secret management and short-lived AWS roles

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Provider key server-only by design; production env empty Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Use AWS Secrets Manager/KMS and task roles; never send keys to browser or persist in Git.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Use AWS Secrets Manager/KMS and task roles; never send keys to browser or persist in Git.
- **Acceptance:** Secret scans pass; CI uses scoped temporary roles; rotation succeeds without exposing values.
- **External gates:** B02/B09
- **Reference / verification:** lib/site-api.ts; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### SEC-004 — Untrusted code isolation verification

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Only limited browser worker isolation is implemented Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Threat-model and test remote runner independently of trusted API containers.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Threat-model and test remote runner independently of trusted API containers.
- **Acceptance:** Network/metadata/secret/filesystem/cross-job escape probes cannot access protected resources.
- **External gates:** B01/B02
- **Reference / verification:** 23-26; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-002 — Google login

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** portable/src/public-auth.ts: Google PKCE/state/nonce/JWK adapter; callback replay fixture passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify owner Google app on the exact staging/production domain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify owner Google app on the exact staging/production domain.
- **Acceptance:** Real Google login succeeds on staging/production and rejects invalid callback/state.
- **External gates:** B05/B06
- **Reference / verification:** 46 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AUT-004 — Email one-time-code login

- **Area / priority / phase:** Authentication and accounts / P0 / P02
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** portable/src/public-auth.ts; SES adapter; expiry/replay/five-attempt/Secure-cookie tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify real sender delivery, human verification and email login in staging.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify real sender delivery, human verification and email login in staging.
- **Acceptance:** Expired, replayed and brute-forced codes fail; valid code creates one safe session.
- **External gates:** B05/B07
- **Reference / verification:** 46 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-009 — Indexes, pooling and paginated query plans

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Bounded pg pool, tenant indexes/pagination; operations.test.ts EXPLAIN ANALYZE with 10,000 rows uses index Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Measure native multi-connection query/pool budgets at representative staging load.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Measure native multi-connection query/pool budgets at representative staging load.
- **Acceptance:** Representative history/files/chat queries stay within documented latency/connection budgets at load.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### DAT-010 — Backup, point-in-time recovery and restore drill

- **Area / priority / phase:** Database and durable jobs / P0 / P02
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts encrypted backup/PITR source; ops/RECOVERY.md and restore-record template Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Execute measured RDS/S3 restoration and reconcile usage/payment/deleted accounts.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Execute measured RDS/S3 restoration and reconcile usage/payment/deleted accounts.
- **Acceptance:** Restore drill meets approved RPO/RTO and reconciles billing/usage invariants.
- **External gates:** B02/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### CHT-007 — Stream, stop, retry and recover chat replies

- **Area / priority / phase:** Right-side AI chatbot / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Persisted SSE events, Last-Event-ID reconnect, stop/cancel, partial assistant state, durable quota finalization; real HTTP fixture Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Run browser disconnect/stop/retry scenarios with a real provider through CloudFront.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run browser disconnect/stop/retry scenarios with a real provider through CloudFront.
- **Acceptance:** A stopped/failed reply is marked partial; retry settles quota once and preserves messages.
- **External gates:** B02/B03
- **Reference / verification:** 28,30; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### TOL-011 — Provider response streaming

- **Area / priority / phase:** AI coding tools / P0 / P04
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** provider.ts bounded UTF-8 SSE parser; worker persisted deltas; owned API stream and real loopback HTTP replay tests Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify actual provider and CloudFront idle/reconnect/cancellation behavior under load.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify actual provider and CloudFront idle/reconnect/cancellation behavior under load.
- **Acceptance:** Long response streams through local/staging/CloudFront paths without corrupting output or double billing.
- **External gates:** B02/B03
- **Reference / verification:** 28,30; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-002 — Private cloud uploads and downloads

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Private KMS S3 adapter, bounded signed PUT metadata, integrity download/ownership checks; browser file routes wired Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Exercise actual S3/KMS/presigned CORS and cross-account negative tests; enforce final plan file capacities.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Exercise actual S3/KMS/presigned CORS and cross-account negative tests; enforce final plan file capacities.
- **Acceptance:** Uploaded file is private, size/type verified and inaccessible to another workspace.
- **External gates:** B02
- **Reference / verification:** 05,33,37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### FIL-009 — Cloud file visibility, deletion and cleanup

- **Area / priority / phase:** Files and context / P0 / P05
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Immediate owner-scoped deny/delete, frozen-context redaction and durable object-delete jobs; fixture passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify real versioned S3/backup expiry and all derived cleanup under approved retention.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify real versioned S3/backup expiry and all derived cleanup under approved retention.
- **Acceptance:** Deleted file loses access immediately and all derived copies are processed under retention policy.
- **External gates:** B02/B08
- **Reference / verification:** 37; advertised / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### HIS-007 — Provider data-retention disclosure and exceptions

- **Area / priority / phase:** History and privacy preferences / P0 / P05
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Model disclosure placeholders and Code Privacy state that provider retention is unapproved; AI startup requires approval
- **Original remaining-work record:** Owner must approve the actual provider/model contract and route-specific retention/exceptions before enabling AI.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner must approve the actual provider/model contract and route-specific retention/exceptions before enabling AI.
- **Acceptance:** Each selectable model shows accurate data handling approved for that route.
- **External gates:** B03/B08
- **Reference / verification:** 33,37; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### RUN-006 — Separate execution worker fleet and network boundary

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Separate runner VPC/zero-default ASG source, signed short-lived job capability, no app/provider/DB IAM; template/policy tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Bake/scan AMI, deploy private TLS gateway and prove no DB/metadata/network/cross-job access.
- **Current clarification:** Separate runner-stack/private gateway source is prepared, with worker-only private signer and no application credentials in jobs.
- **Reviewed remaining work:** Bake/scan approved host/image, apply actual networking/IAM and prove job denial of DB, private services, metadata and egress; policy source is not isolation proof.
- **Acceptance:** Untrusted jobs cannot reach application DB, provider keys, metadata, other jobs or internet.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-007 — CPU, memory, process, disk and output limits

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** runsc/no-network/read-only/nonroot/cap/PID/CPU/memory/tmpfs/wall/output limits; policy tests and native probe harness Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Run all five native runtimes and resource/disk/fork/network abuse probes on isolated host.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run all five native runtimes and resource/disk/fork/network abuse probes on isolated host.
- **Acceptance:** Infinite loop, memory exhaustion, fork and output flood fixtures terminate predictably.
- **External gates:** B01/B02
- **Reference / verification:** 23-26; production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### RUN-008 — Execution queue, fairness and concurrency admission

- **Area / priority / phase:** Execution service / P0 / P06
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Atomic admission rejects global pending/running backlog100 and per-workspace2 before charging daily allowance; fair leased workspace lanes remain in use. Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Measure native multi-client fairness, queue saturation/rejection and actual gateway capacity.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Measure native multi-client fairness, queue saturation/rejection and actual gateway capacity.
- **Acceptance:** Concurrent users cannot starve queue or produce duplicate charged executions.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-002 — Secure hosted checkout

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Paddle server-price verification, bound checkout intents, uncertain-request fence, hosted checkout UI; contract tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Merchant sandbox checkout, default checkout integration/domain and verified-country restrictions remain.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Merchant sandbox checkout, default checkout integration/domain and verified-country restrictions remain.
- **Acceptance:** Client cannot alter amount/tier; checkout completion alone does not grant access.
- **External gates:** B04
- **Reference / verification:** 27-30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-003 — Signed, idempotent payment webhooks

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Raw-body Paddle timestamp/HMAC verification, serialized inbox and allowance replay/order fixtures pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify actual sandbox event delivery/retries/key rotation and provider reconciliation.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify actual sandbox event delivery/retries/key rotation and provider reconciliation.
- **Acceptance:** Duplicate, invalid and out-of-order events cannot create duplicate entitlements or credits.
- **External gates:** B04
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-006 — Upgrade, downgrade and proration policy

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** ops/POLICY_DECISIONS.json identifies proration/amount-preview prerequisites and keeps changes disabled
- **Original remaining-work record:** Owner must approve upgrade/downgrade/proration rules; then implement provider preview/confirmation and sandbox settlement.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner must approve upgrade/downgrade/proration rules; then implement provider preview/confirmation and sandbox settlement.
- **Acceptance:** Every change shows amount/timing before confirmation and matches settled provider state.
- **External gates:** B04/B08
- **Reference / verification:** 28,30,33; advertised / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### BIL-007 — Cancel, resume and self-service billing portal

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Owned short-lived hosted customer portal route and browser link; provider customer binding Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify cancel/resume/invoice/access-end behavior and approved cancellation policy in sandbox.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify cancel/resume/invoice/access-end behavior and approved cancellation policy in sandbox.
- **Acceptance:** Owner can cancel/resume supported subscription states and see access end date.
- **External gates:** B04
- **Reference / verification:** 28,30,33; V1 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### BIL-009 — Refund policy and refund processing

- **Area / priority / phase:** Billing and subscriptions / P0 / P07
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Refund adjustment recording preserves accounting history; policy decision record explicitly disables automatic refunds
- **Original remaining-work record:** Owner must approve refund eligibility and allowance treatment; implement refund requests/reconciliation and authorized sandbox/live rehearsal.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner must approve refund eligibility and allowance treatment; implement refund requests/reconciliation and authorized sandbox/live rehearsal.
- **Acceptance:** Eligible test refund reconciles payment, entitlement and audit history without duplicate refunds.
- **External gates:** B04/B08
- **Reference / verification:** 27-30 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### QTA-007 — Economically viable Standard fair-use policy

- **Area / priority / phase:** Quotas and AI cost control / P0 / P07
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** No unlimited usage claim; bounded output/global ceiling; ops/POLICY_DECISIONS.json leaves per-user paid fair-use open
- **Original remaining-work record:** Owner must approve economical per-user Standard policy and prices; implement final per-user controls and high-usage cost scenario.
- **Current clarification:** Reference pricing advertises unlimited Standard; current implementation does not establish an economically approved unlimited policy.
- **Reviewed remaining work:** Owner approves final policy/pricing. Codex supplies configuration/enforcement/cost scenarios and real model/invoice reconciliation; never simply remove credit controls.
- **Acceptance:** Published usage language and server controls agree; a high-usage scenario cannot create uncontrolled loss.
- **External gates:** B03/B08
- **Reference / verification:** 28,30; reference pricing / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### AWS-002 — Portable web/API Dockerfiles and local compose

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Locked pnpm API/web Dockerfiles, compose and standalone web build; container CI definitions Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Build images and run compose/migration/container smoke on Docker host.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Build images and run compose/migration/container smoke on Docker host.
- **Acceptance:** Images build from lockfiles and compose supports migrations and integration tests.
- **External gates:** B01
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-003 — ECR image registry and artifact provenance

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Immutable/scanned ECR source, exact digest services, buildx SBOM/provenance publication helper Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Bootstrap repositories; build/push/scan/verify real image attestations and review findings.
- **Current clarification:** Image publisher requests SBOM/provenance and records final image digests; no real registry push/scan was performed.
- **Reviewed remaining work:** Bootstrap retained repositories, pin build/runtime inputs, execute protected builds, verify attestations and review real vulnerability findings before promotion.
- **Acceptance:** A release refers to exact digests rather than mutable latest tags.
- **External gates:** B01/B02/B09
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-004 — VPC, private service/database subnets and egress

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Private app/isolated DB subnets; separate runner VPC/no NAT; network template assertions pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Apply/test egress, service rules, peering, managed origin SG and no DB route from runner.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Apply/test egress, service rules, peering, managed origin SG and no DB route from runner.
- **Acceptance:** Only intended edge/service traffic reaches app/DB; runner subnet has separate restrictions.
- **External gates:** B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-006 — Route53, ACM and CloudFront edge distribution

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Route53/ACM/CloudFront private VPC-origin source; dynamic cache-disabled and hashed-asset cache assertions Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Activate domain/cert and test actual signed-in cache separation and streaming globally.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Activate domain/cert and test actual signed-in cache separation and streaming globally.
- **Acceptance:** Public assets cache globally; authenticated API, SSE and private results are not shared-cache leaked.
- **External gates:** B02/B05
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-008 — RDS PostgreSQL Multi-AZ and migrations

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Encrypted private PostgreSQL16 Multi-AZ production source; CA-verified pool, migrations and restricted runtime bootstrap Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Native multi-client/failover and owner-controlled migration task/privilege verification.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Native multi-client/failover and owner-controlled migration task/privilege verification.
- **Acceptance:** Failover reconnects application and preserves transaction/ledger invariants.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-009 — Private S3 buckets and lifecycle policies

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Private versioned KMS S3, quarantine expiration, safe text promotion and bounded signed metadata source Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Actual bucket public-access/CORS/key/presign/version cleanup checks.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Actual bucket public-access/CORS/key/presign/version cleanup checks.
- **Acceptance:** Bucket-public-access checks pass; temporary downloads and cleanup work.
- **External gates:** B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-010 — Shared limiter, SQS queues and scheduler

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; SQL-authoritative quota/outbox/leases; encrypted SQS/DLQ notification bridge and worker scheduler Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Multi-replica native contention, SQS notification loss/replay and worker failure acceptance.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Multi-replica native contention, SQS notification loss/replay and worker failure acceptance.
- **Acceptance:** Queue replay, cache loss and multiple replicas preserve durable quota and ownership invariants.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-011 — Secrets Manager and configuration separation

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Separate task secret fields, no browser secrets, worker-only provider key; runtime/bootstrap IAM source Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Verify real least privilege/KMS/execution role access and bundled asset secret scan in deployed accounts.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Verify real least privilege/KMS/execution role access and bundled asset secret scan in deployed accounts.
- **Acceptance:** Frontend bundles contain no server key and each task can read only approved secrets.
- **External gates:** B02/B09
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-013 — CI test/build/scan and OIDC deployment workflow

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; Pinned official Actions revisions, verify/container workflows, exact repo-environment OIDC, gated digest ECS rollout/rollback Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Configure protected owner repo/environments, execute CI/scans, prove untrusted branch denial and rollback.
- **Current clarification:** Verification and protected OIDC service-release workflow source exist but were not run in the owner repository.
- **Reviewed remaining work:** Configure authorized repository/environments, execute clean install/container/native/security checks, prove untrusted-branch denial and real rollout/rollback.
- **Acceptance:** Untrusted branches cannot assume production role; a failed smoke test triggers controlled rollback.
- **External gates:** B01/B02/B09
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### AWS-016 — Budgets, autoscaling ceilings and runner kill switch

- **Area / priority / phase:** AWS platform and delivery / P0 / P09
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** infra/src/stacks.ts; runner-stack.ts; AWS budget alarm, max task/fleet ceilings, provider/runner DB kill switches and spending tests Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Observe actual budget/scale/kill-switch behavior and approve cost/capacity targets.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Observe actual budget/scale/kill-switch behavior and approve cost/capacity targets.
- **Acceptance:** Cost alarm is observed; application kill switch rejects new costly work; local tools remain usable.
- **External gates:** B02/B03/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-003 — Database/service integration and migrations

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** 64 DB/service fixtures include clean + Build01-to02 upgrade/checksum/replay/ownership/deletion; PostgreSQL WASM passes Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Run unchanged suite against native multiple connections and actual containers/RDS.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Run unchanged suite against native multiple connections and actual containers/RDS.
- **Acceptance:** Concurrent ledger, identity and deletion fixtures pass on a clean and upgraded database.
- **External gates:** B01/B02
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-004 — Real provider end-to-end quality and failures

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** ops/ACCEPTANCE.md specifies unseen fixtures, actual quality/cost and failure evidence; provider adapter mock contract tests pass
- **Original remaining-work record:** Real provider key/quota/approved model and retention are required to run quality/cost end-to-end acceptance.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Real provider key/quota/approved model and retention are required to run quality/cost end-to-end acceptance.
- **Acceptance:** Curated unseen fixtures meet documented quality/cost criteria and no false verification claims appear.
- **External gates:** B03/B08
- **Reference / verification:** 09-10,50-57 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### QAS-005 — Checkout/webhook sandbox integration

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Paddle raw signature/HTTP route, price/country, bound payment, stale/replay contract tests pass Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Merchant sandbox purchase/renewal/cancel/refund reconciliation remains unperformed.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Merchant sandbox purchase/renewal/cancel/refund reconciliation remains unperformed.
- **Acceptance:** Provider events reconcile idempotently with subscriptions and allowance grants.
- **External gates:** B04
- **Reference / verification:** 27-30 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-007 — Five-runtime isolation and resource-abuse tests

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Five-runtime image/entrypoint, policy/capability tests and signed native-probe harness; never runs jobs on app host Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Execute native functional, loop/memory/fork/disk/output/metadata/network/residue probes and inspect evidence.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Execute native functional, loop/memory/fork/disk/output/metadata/network/residue probes and inspect evidence.
- **Acceptance:** All abuse fixtures are bounded and no protected data or cross-job state is exposed.
- **External gates:** B01/B02
- **Reference / verification:** 23-26 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-009 — Backup restore and rollback drills

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** Persistent WASM restart baseline, forward-upgrade test, ECS rollback helper and timed restore record/runbook Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Perform real snapshot/PITR/S3 restoration and failed-release rollback drills with measured invariants/RPO/RTO.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Perform real snapshot/PITR/S3 restoration and failed-release rollback drills with measured invariants/RPO/RTO.
- **Acceptance:** Rehearsals meet recovery targets and leave billing/usage data consistent.
- **External gates:** B02/B08
- **Reference / verification:** Production requirement / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### QAS-011 — Public-country performance and availability probes

- **Area / priority / phase:** Quality and release verification / P0 / P10
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Read-only regional http-probe.mjs and explicit country acceptance scenarios are prepared
- **Original remaining-work record:** Need a deployed approved domain/service-country matrix and regional test agents for actual measurements.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Need a deployed approved domain/service-country matrix and regional test agents for actual measurements.
- **Acceptance:** DNS/TLS, login, generation/chat, file actions and checkout work within approved measured targets.
- **External gates:** B02/B05/B08
- **Reference / verification:** Production requirement / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### SEC-011 — Backup confidentiality and deletion policy

- **Area / priority / phase:** Security and data handling / P0 / P10
- **Status / owner:** Blocked / Owner supplies access/decision; Codex executes verification
- **Original evidence:** KMS retained backup resources, restricted runtime grant source, active-content deletion and recovery/tombstone procedure Build03 review: remaining acceptance requires the named external gate; not represented as verified.
- **Original remaining-work record:** Approve backup expiry/deletion disclosure and prove private/audited restore with deleted-user reconciliation.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Approve backup expiry/deletion disclosure and prove private/audited restore with deleted-user reconciliation.
- **Acceptance:** Restore access is audited and user deletion disclosures match actual backup lifecycle.
- **External gates:** B02/B08
- **Reference / verification:** 37-41 / BUILD-03: named application scope verified locally; native/cloud/provider/merchant claims require separate gates

### REL-003 — Staging acceptance and private beta

- **Area / priority / phase:** Launch and operations / P0 / P11
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Local service/UI contracts and staging beta acceptance record prepared; owner-private Site preserved
- **Original remaining-work record:** Provision staging and complete real signup/eight tools/chat/files/history/shares/billing acceptance with recorded beta evidence.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Provision staging and complete real signup/eight tools/chat/files/history/shares/billing acceptance with recorded beta evidence.
- **Acceptance:** Signup, eight tools, chat, files/history, shares and billing pass recorded end-to-end scenarios.
- **External gates:** B02/B03/B04/B06/B07
- **Reference / verification:** Production requirement / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-001 — Approved launch countries, currency and service matrix

- **Area / priority / phase:** Launch and operations / P0 / P12
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Empty country allowlist/default closed billing; POLICY_DECISIONS and country probe/service scenarios
- **Original remaining-work record:** Owner must choose approved countries/currency/service matrix and verify provider/merchant eligibility.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner must choose approved countries/currency/service matrix and verify provider/merchant eligibility.
- **Acceptance:** Only approved countries can purchase/use restricted services; support content explains coverage.
- **External gates:** B04/B08
- **Reference / verification:** Production requirement / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-002 — Owner-reviewed release configuration and prices

- **Area / priority / phase:** Launch and operations / P0 / P12
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Versioned release config/gate examples, exact-digest checks and ownerApproved=false policy; incomplete gate test fails closed
- **Original remaining-work record:** Owner must review actual business/domain/provider/merchant/prices/limits/retention configuration before release.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** Owner must review actual business/domain/provider/merchant/prices/limits/retention configuration before release.
- **Acceptance:** Production config is versioned and every displayed commitment is implementable.
- **External gates:** B02/B03/B04/B05/B08
- **Reference / verification:** 27-41 / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

### REL-004 — Controlled worldwide production launch

- **Area / priority / phase:** Launch and operations / P0 / P12
- **Status / owner:** Blocked / Owner decision/access; Codex after unblock
- **Original evidence:** Fail-closed release checker, scoped OIDC rollout/rollback source and country expansion acceptance procedure
- **Original remaining-work record:** All measured release gates and owner approvals must pass before public AWS launch. No worldwide production exists.
- **Current clarification:** Use the original evidence with the scope/limits in PROJECT_HANDOFF.md; inspect current source before implementing.
- **Reviewed remaining work:** All measured release gates and owner approvals must pass before public AWS launch. No worldwide production exists.
- **Acceptance:** All release gates pass; observed errors, cost and latency stay below approved limits before expansion.
- **External gates:** B02/B03/B04/B05/B08/B09
- **Reference / verification:** Production requirement / BUILD-02: source + recorded local/offline tests; external checks explicitly pending

