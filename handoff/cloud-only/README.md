# FutureRobotic AI — minimal cloud verification kit

Prepared 23 October 2026 (India). Application remains Build03, SHA `76dda7b040a95e96c529073240056678d9f12ba4`. This kit adds verification utilities/documents without changing any of the 382 tracked application files. Native tests and containers remain unexecuted in the authoring environment.

## What to give Codex Cloud

Use `FutureRobotic_AI_Build03_Cloud_Test_Ready_Complete_Source_20261023.zip`, which includes this directory and all prior source/reference/handoff material. Put the extracted project in a private GitHub repository and select it in your Cloud environment. A repository containing the ZIP can also be used if the task safely extracts the project before installation; an empty repository alone has no project to test.

Paste `CLOUD_TEST_ONLY_PROMPT.md`, not the older broad development prompt. Keep the chosen environment private. Use its setup to prepare the locked dependencies and only the registry/download access needed by these tests. Check the actual current/legacy UI rather than assuming both have identical secret/network settings.

First-pass native/container verification requires **no AWS, merchant or AI credential**. Docker/Compose must actually be permitted; this kit does not guarantee their availability in a particular Cloud session.

## Prepared commands

From the project root, with Node >=22.13, pnpm 11.25.0 and existing locked dependencies:

```bash
python3 handoff/cloud-only/run_native.py
python3 handoff/cloud-only/run_containers.py
```

The native runner creates its own loopback-only disposable PostgreSQL 16 container. It builds the existing backend, proves two native connections plus transaction advisory-lock exclusion, and runs each existing compiled backend suite. This includes completion tests omitted by the old `api:test:native` wrapper. It records the actual server/image and TAP counts, and cleans up only its own container. It never falls back to PGlite.

An already supplied native test database can be used only with `TEST_DATABASE_URL` and `FR_DISPOSABLE_NATIVE_DB=true`. Provide it through protected configuration; never paste or commit its value. The existing fixtures create/drop schemas and manipulate test data. This option is for a disposable test database, not production. Proxy network-secret placeholders for HTTPS do not by themselves provide a native PostgreSQL connection; use a supported test-service connection.

The container runner checks actual Docker/Compose, uses a unique project/password, builds/starts the existing Compose services, runs development migrations and probes loopback `/health` and `/api/status`. It records service/image IDs and bounded logs, then removes its own project/volumes. Port 8080 must be free; it will not stop unrelated services. A readiness pass does not establish account, AI, payment, S3, edge or runner acceptance.

Logs/results are written under `handoff/cloud-only/results/<scope>/<UTC-run>/`. Generated test passwords/known test DSNs are redacted before logging. Review/sanitize any additional credentials introduced by the receiving environment before packaging. No environment dump, resolved Compose configuration or credential file is needed.

| Process exit | Meaning |
| --- | --- |
| 0 | Named native/container scope passed; inspect skips and exact coverage |
| 1 | A test/build/readiness/cleanup failed; inspect bounded evidence |
| 2 | Environment, source, dependency or disposable-account prerequisite blocked |

Commands are bounded and clean up their own resources; their timeouts are guardrails, not a subscription-time estimate. Package results even on exit 1/2. Fixing a failed gate must not weaken its acceptance. Do not count skipped, blocked or never-attempted work as passed.

## First-pass scope boundary

Run native SQL and containers, and only narrowly repair failures they demonstrate. Existing signed native runner probes can run if the approved gateway/key already exists. Leave the remaining production matrix pending. Do not provision AWS, spin up a fleet, configure real payments or implement the next 20 features during this limited run.

If the Cloud runtime denies Docker, do not repeatedly install a Docker client or attempt to bypass privilege restrictions. A permitted disposable native database can still cover the SQL scope. Otherwise hand off the same kit to authorized Linux CI or an approved remote test host. Avoid local Windows installs until those options are exhausted.

## Required handback

Return a complete cumulative source ZIP, actual sanitized evidence, per-gate states, current global status, changed files and `CLOUD_RETURN.md`. Preserve originals/reference assets. Exclude dependencies, build/runtime data, secrets, Git internals and the output ZIP/delivery directory itself. Validate archive integrity/SHA-256. If artifact download is unavailable, use a real accessible file/branch artifact and state the limitation; do not fabricate a link.

The primary project agent owns source implementation, integration of returned changes, documentation, infrastructure preparation and later test planning. Accounts, approvals, final policy and cloud service access remain owner-controlled inputs. `OWNERSHIP_AND_FALLBACK_PLAN.md` maps the rest.
