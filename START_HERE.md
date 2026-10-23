# FutureRobotic AI — complete source and continuation package

**23 October cloud-test preparation:** For the limited Codex Cloud assignment, use `handoff/cloud-only/CLOUD_TEST_ONLY_PROMPT.md` and its README. Run only the missing native/container checks. Do not follow the older broad NEXT_20 prompt for that task. No application feature or native/cloud acceptance was completed by this preparation.

**Application release:** Build03. **Source commit:** `76dda7b040a95e96c529073240056678d9f12ba4`.
**Handoff reviewed:** 22 October 2026. **Production ready:** No. **AWS deployed:** No.

This is the complete cumulative application source, not a patch. Application files match the recorded Git commit. Root `AGENTS.md`, this file, `HANDOFF_MANIFEST.json`, `handoff/` and `reference/` are a documentation overlay created for this handoff; they do not represent a new application implementation build.

## Goal

Deliver **FutureRobotic AI**, matching the supplied CodeConvert reference appearance and workflows under the FutureRobotic AI name: public website, eight tools, signed-in dark workspace, right-side AI chatbot, portable authentication, durable database/files/history, subscriptions, isolated execution, and an operated AWS production service for approved countries. Worldwide rollout follows actual service eligibility, measured acceptance and owner-approved policies.

## Current state

| State | Count / evidence |
| --- | --- |
| Implemented at the named scope | 73 tasks |
| Partial | 59 tasks |
| Blocked | 64 tasks |
| Not started | 0 tasks |
| Total | 196 stable task IDs |
| Build03 verification | 100 automated tests passed; local/mocked/offline scope |
| Latest backend/AWS recheck | 77 backend + 4 infrastructure tests passed; six templates synthesized |
| Native PostgreSQL / isolated runner | Blocked; gate exit 2, not passed |
| Current hosting | Owner-private Sites preview; not the portable database backend |

Counts describe work items, not a production-readiness percentage. The latest 81 checks repeat a subset of the recorded 100; **do not add them together**. Missing real AI/payment/AWS/native evidence remains missing.

## Read in this order

1. `AGENTS.md` — ownership, evidence rules and required output for every project reply.
2. `handoff/PROJECT_HANDOFF.md` — goal, actual implementation and limitations.
3. `handoff/STATUS_SUMMARY.md` and `TASK_INDEX.csv` for quick orientation; query the relevant IDs in `handoff/CURRENT_TASK_REGISTER.json` or `.csv` for all evidence/acceptance/current clarifications. `handoff/IMPLEMENTED_AND_REMAINING.md` is the readable edition. Avoid loading both full registers when the next batch only needs selected IDs.
4. `handoff/ARCHITECTURE_AND_SETUP.md` — code map, invariants, local checks, AWS inputs and rollout order.
5. `handoff/NEXT_20_TASKS.md` — proposed next engineering batch; these are not claimed completed.
6. `handoff/PRODUCTION_TEST_MATRIX.md` / `.csv` — real tests required before production; rows are pending, not results.
7. `handoff/VERIFICATION_EVIDENCE.md` and `handoff/evidence/` — recorded results and their limits.
8. `handoff/CROSS_AI_PROMPTS.md` — copy the master prompt plus the appropriate Codex/browser/Antigravity adapter.

The application remains at the package root: `app/`, `lib/`, `portable/`, `runner/`, `infra/`, `ops/`, `tests/` and `.github/workflows/`. Run package-manager commands from that root.

The original 57-image public desktop reference archive is included as `reference/CodeConvert_Reference_20261021.zip`. Its offline gallery, inventory and screenshot crosswalk explain capture limits. The separately mentioned signed-in video V1 is **not included** in the available archive; do not claim to have watched it. Existing source and recorded notes preserve the workspace implementation. New mobile/authenticated visual acceptance remains pending.

Some source READMEs still have Build01/Build02 or PLAN-01 headings and historical gap descriptions. Use this handoff and current code first; retain historical reports as provenance. All original stable IDs/statuses remain intact. Reviewed clarifications explain where an old instruction says to build a service that already exists.

No secret, dependency directory, runtime database, private credential, generated build directory or Git history is required in this source package. Install the locked dependencies in the next execution environment. All live integrations require normal protected configuration.
