# Copy this into Codex Cloud — FutureRobotic AI verification only

Use this focused prompt instead of the older broad cross-model/NEXT_20 prompt for this run. Application baseline is Build03; the attached 23 October test-preparation package contains the complete source plus two prepared test runners. It does not claim any new native/cloud pass.

```text
Work on my existing FutureRobotic AI project. This is a LIMITED VERIFICATION
handoff, not a feature-development request. This scope overrides the older
NEXT_20/master instructions to continue building features.

My Codex Cloud allowance is limited. Target one bounded run of about 25 minutes,
reserve the last 5 minutes for evidence and complete ZIP delivery, and checkpoint
earlier if time is short. This is a work budget, not a claim about subscription
limits. Do not start parallel agent sessions or repeatedly reinstall tools.

Read AGENTS.md, handoff/STATUS_SUMMARY.md and handoff/cloud-only/README.md.
Do not read the entire historical backlog/reference gallery or replan the project.
Find the actual project root. If the repository contains only the supplied ZIP,
safely extract its FutureRobotic_AI folder and use that as root; do not overwrite
Git metadata or unrelated files. Preserve any newer actual source. Original SHA
76dda7b040a95e96c529073240056678d9f12ba4 is baseline provenance, not a reason
to reject an imported repository with a different commit ID.

ONLY DO THESE THINGS, IN ORDER:
1. Spend at most a few minutes checking Node >=22.13, pnpm 11.25.0, locked
   dependency availability, Docker daemon/socket and Compose. Install the locked
   dependencies once if needed and permitted. Capture the exact failing host or
   permission if setup is blocked. Do not disable TLS, change versions broadly,
   remove the lockfile or attempt to bypass environment restrictions.
2. From project root run:
   python3 handoff/cloud-only/run_native.py
   It runs ALL existing backend suites, including completion, on disposable
   native PostgreSQL with distinct native connection/transaction-lock evidence.
   It never substitutes PGlite. Existing TEST_DATABASE_URL may be used only if
   explicitly disposable and FR_DISPOSABLE_NATIVE_DB=true is configured.
3. Independently, if Docker/Compose works, run:
   python3 handoff/cloud-only/run_containers.py
   It builds/starts the existing portable stack, runs migrations, checks real
   health/status and removes only its own test containers/volumes. Record actual
   image IDs. This is container readiness, not authenticated/live acceptance.
4. Fix only concrete failures in those tests/builds. Keep acceptance intact.
   Limit repair to a small focused fix (up to two attempts/about 10 minutes within
   the overall budget), rerun affected checks and checkpoint unresolved failures.
   Do not fix a failing test by skipping it or weakening ownership/ledger rules.
5. Run existing native runner probes ONLY if an approved isolated TLS gateway
   and protected test signing material are ALREADY supplied and time remains.
   Otherwise report that gate blocked without installing/baking a new fleet.

DO NOT do UI redesign, localization, new features, broad refactors, model evals,
fresh browser tests, repeated PGlite/UI/offline CDK checks, dependency upgrades,
production deployment, CDK apply, paid purchases/refunds, AWS resource creation,
or untrusted execution on this trusted host. No AI/merchant/AWS key is needed for
the primary native/container run. Leave real AI/auth/email/payment/AWS/restore/
country gates pending when their prerequisites are absent.

If Docker/native capability is denied, record BLOCKED_ENVIRONMENT and move to
other independent permitted checks. Do not spend the session trying nested-Docker
or privilege/network workarounds. If a native database is already available, do
that native scope even when containers are blocked. If both are unavailable,
produce evidence and a focused Linux-CI/remote-host handoff, then stop.

RETURN ALL OF THE FOLLOWING:
- Exact source/commit or imported baseline, changed files, test commands, timing,
  native DB version/connection proof, image IDs, passed/failed/skipped counts and
  sanitized logs from handoff/cloud-only/results. No secret values/DSNs.
- Keep global feature totals evidence-based (baseline 73 Implemented, 59 Partial,
  64 Blocked, 0 Not started; 196 total). Add per-gate verification states:
  PASSED_NATIVE, PASSED_CONTAINER, FAILED, BLOCKED_ENVIRONMENT,
  BLOCKED_ACCOUNT, PREPARED_NOT_EXECUTED or NOT_ATTEMPTED_SCOPE.
  Never close an entire feature just because one test gate passed.
- A COMPLETE updated cumulative source ZIP, including all previous code/assets/
  migrations/tests/infra/CI and updated handoff/status/sanitized evidence. Exclude
  secrets, node_modules, Git internals, runtime databases, build output and the
  delivery folder itself; retain the supplied reference archive. Verify ZIP CRC
  and SHA-256 and record application source versus documentation-overlay changes.
- Prefer a real downloadable artifact. If this surface cannot attach it, put the
  actual ZIP under deliverables/ on the authorized working branch, commit or open
  a draft PR as permitted, and return the exact accessible path/commit. Never
  invent a sandbox/download URL. Do not merge or publish the website.
- Write CLOUD_RETURN.md: fixed IDs, remaining failures, exact blockers and a
  one-sentence next action for the primary project agent to integrate.

Do not install/suggest the declined OpenAI Developers plugin. The primary
project agent retains implementation/integration ownership; you are the bounded
native/container verifier for this run. Start execution, not a long plan.
```
