# Cross-model continuation prompts

Attach or extract `FutureRobotic_AI_Build03_All_Source_Cross_AI_Handoff.zip`. Its root is `FutureRobotic_AI/`. The prompts below are about continuing this project; they do not assume a specific model subscription, tool installation or benchmark advantage.

## Universal master prompt — copy this first

```text
You are taking engineering ownership of my existing FutureRobotic AI project.
Use the attached COMPLETE cumulative source ZIP. Do not restart it from scratch.
Communicate in English and treat me as technically experienced.

MAIN GOAL
Deliver the full FutureRobotic AI product matching the supplied CodeConvert
visual/workflow reference under my brand: public website, all eight tools,
dark signed-in workspace, right-side AI chatbot, portable auth/backend/database,
private files/history/shares, subscriptions/allowances, isolated five-language
execution, and a real operated AWS release for approved countries, expanding
worldwide after actual eligibility and acceptance. Code/source alone is not launch.

BASELINE
Application release Build03, commit 76dda7b040a95e96c529073240056678d9f12ba4.
196 stable tasks: 73 Implemented, 59 Partial, 64 Blocked, 0 Not started.
These are scope-specific counts, not a production-readiness percentage.
Of 126 earlier partials, 23 were implemented and 44 became externally blocked;
do not treat all 126 as still partial and do not count those 44 as completed.
The current private Sites preview is not the portable Node/PostgreSQL backend.
No AWS deployment, live AI/payment/identity/sender verification or native runner
acceptance was performed. The application is not production ready.

READ BEFORE EDITING
1. Root AGENTS.md and START_HERE.md.
2. handoff/PROJECT_HANDOFF.md and ARCHITECTURE_AND_SETUP.md.
3. handoff/STATUS_SUMMARY.md, then relevant IDs in CURRENT_TASK_REGISTER.json
   OR its readable edition IMPLEMENTED_AND_REMAINING.md; do not load duplicate
   full registers when selective file queries are available.
4. handoff/NEXT_20_TASKS.md and PRODUCTION_TEST_MATRIX.md/CSV.
5. handoff/VERIFICATION_EVIDENCE.md and the relevant source/tests.
Keep stable IDs. Some original backlog descriptions/READMEs are historical;
use reviewed clarifications and inspect current code before rebuilding services.
The supplied reference ZIP has 57 public desktop images; the earlier V1 signed-in
video is not included. Never claim to have watched unavailable media.

WORKING RULES
Own coding, tests, fixes, migrations, IaC, CI, deployment preparation, available
account-authorized operations, documentation and packaging. If an operation is
blocked, record exact evidence, affected IDs, owner and unblock step, then continue
independent engineering. Missing secrets do not transfer coding work to me.
Do not repeatedly ask permission for routine reversible engineering.
Do not use or suggest the declined OpenAI Developers plugin.
Do not spawn subagents unless my instruction or your execution rules permit it.
Discover available runtime/account capabilities instead of assuming the last
environment's Docker/AWS/network limitations also apply to yours.
Keep credentials in protected configuration. Never ask me to paste keys in chat,
put secrets in source/browser/status files, or fabricate configured integrations.
Keep the current preview private. Public cutover and real payment/refund actions
need the relevant authorization and measured release conditions.

CRITICAL TECHNICAL BOUNDARIES
PGlite serializes transactions: its passing races do not prove native PostgreSQL.
The native DB wrapper currently omits the completion suite; close that gap.
Keep SQL migrations immutable and add new numbered ones with runtime grants.
Preserve tenant ownership, CSRF, append-only ledger/audit, outbox and dispatch fences.
Never blindly replay/refund unknown provider/payment/execution acceptance.
Run native tests only on disposable databases. Run untrusted code/abuse probes
only in the approved isolated runner, never on the trusted app host.
Anonymous public dispatch, structured review/evaluation, local-tool cloud history,
operator enrollment/console, support acknowledgement outbox, reconciliation,
initial AWS bootstrap, image/version/drain automation, dashboards/regional
recovery, full browser regression/French/grammar/PDF parity remain engineering.
No unlimited Standard, multi-currency, provider zero-retention, refund or worldwide
eligibility promise is approved just because a reference card says so.

EXECUTE
Inventory the repository and environment, then select the highest-priority
unblocked work in NEXT_20_TASKS and the full register. Progress autonomously
through a substantial coherent batch. Inspect existing implementations first.
Run appropriate checks for changes. Keep live/native/cloud tests explicitly pending
until actually run. Do not lower acceptance or change counts to make a report look done.

EVERY SUBSTANTIVE PROJECT REPLY MUST INCLUDE
1. Main goal and this batch's concrete outcome.
2. Global Implemented / Partial / Blocked / Not started / total counts;
   stable IDs changed, what was implemented, what remains and evidence.
3. Tests actually run and results/limitations; reused evidence labeled reused.
4. A DOWNLOADABLE COMPLETE CUMULATIVE SOURCE ZIP, not a patch or snippets.
   Include frontend/backend/schema/migrations/tests/assets/infra/CI/runbooks,
   current status/handoff and sanitized test evidence. Exclude secrets, dependency
   folders, runtime user data and Git credentials/history. Verify ZIP integrity,
   record source provenance and SHA-256. If no code changed, link the latest
   verified ZIP and explicitly say unchanged. Never invent a file/download.
5. Exact blockers split by coding-model work versus owner/account decisions,
   and next concrete tasks. Update the handoff so another model can continue.

Start by verifying the baseline, then do the next available engineering batch.
If your environment cannot execute code or create files, state that limit clearly
and provide reviewable changes/tests for an execution-capable environment;
do not claim to have run tests, packaged files or deployed anything.
```

## Adapter A — Codex with a repository/terminal

Append this after the master prompt:

```text
Open/extract the package as the current repository. Check the source provenance
and current git/worktree before editing. If this is an imported ZIP without .git,
preserve the original application SHA in the handoff and import into the selected
owner delivery repository; do not pretend the original Git history was included.
Use existing repo instructions and the supported Sites workflow for any hosted
preview edit. Preserve its audience. For AWS work use the portable frontend/API,
not trusted Sites authentication headers. Verify Node/pnpm/dependencies and run
the appropriate local suite; use Docker/CI for native checks if available.
After the batch commit the actual current source where authorized, update status
and evidence, produce the complete cumulative ZIP and return its checksum/link.
```

## Adapter B — browser chat model, including a GPT Sol/Astra session

Append this after the master prompt:

```text
First identify whether this session can read the complete archive, edit files,
run commands and return downloadable artifacts. If it can, execute the work and
package the full current tree. If it cannot, do not claim those capabilities.
Use the attached source/register to give a precise implementation handoff for
Codex or another execution-capable environment, with affected files, acceptance
and test commands. Keep the complete existing source intact; never replace the
project with a small prototype. Link an unchanged existing complete ZIP only
when that actual artifact is available. Ask only for genuinely missing inputs.
```

## Adapter C — Antigravity / another coding IDE

Append this after the master prompt:

```text
Open the extracted FutureRobotic_AI directory as the workspace. Read AGENTS.md
and the handoff before suggesting a rewrite. Inspect your actual terminal,
package manager, Docker, browser and authorized AWS/CI capabilities. Preserve
the portable TypeScript/React/Fastify/PostgreSQL/CDK architecture unless a real
requirement justifies a reviewed change. Do not assume ChatGPT Sites or its
credentials are available in this IDE. Continue the portable product locally/CI,
keep the existing private preview untouched without supported authorization,
and package complete cumulative source/status/evidence after each batch.
```

## Resume prompt after any future batch

```text
Continue from the LATEST attached complete FutureRobotic AI ZIP and its manifest,
not the original Build03 snapshot if a newer package exists. Read the updated
START_HERE, handoff/register, evidence, blockers and next tasks. Verify actual
source/environment before acting. Implement the next unblocked coherent batch,
keep evidence-based status, run appropriate checks and return a complete updated
ZIP plus current handoff. Preserve all previous work and honest pending gates.
```

The receiving model must follow its own higher-priority execution/security rules. A prompt cannot supply AWS authority, service credentials, a Docker daemon or absent file-delivery tools.
