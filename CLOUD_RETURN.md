# FutureRobotic AI — main CI/build/test return, 24 October 2026

Implemented and pushed directly to `main`. Tested code revision: `518ca8cf430622bb3229ebe4f0519fe835835033`. Hosted verification: https://github.com/kawakaze430/FutureRobotic/actions/runs/40014946240 — **all seven jobs passed**, including Node 22 and Node 24, workflow lint, native PostgreSQL/restart, full container builds/migrations/readiness, production audit and the required aggregate result. No new branch, worktree or pull request was created for this batch. Delivery/evidence commits on top of this code do not change application behavior.

**Delivery revalidation — BLOCKED_ACCOUNT:** The [delivery workflow](https://github.com/kawakaze430/FutureRobotic/actions/runs/40017143274) at `01f9d58` was rejected before any job step ran. GitHub reports: “The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings”. Its application, test and workflow code is byte-identical to the successfully verified `518ca8c` revision. This is an account/billing availability blocker, not a new application test failure. The account owner must resolve GitHub Billing & plans; the primary agent can then dispatch the current main workflow and inspect its exact SHA. No payment/spending limit was changed and no quota workaround was attempted. Evidence: `handoff/cloud-only/results/main-ci-20261024/delivery-account-block.json` and `delivery-check-run-annotations.json`.

The current engineering batch is complete. **The whole production project is not complete:** remaining source scope, real integrations, approved isolated execution and deployed operational acceptance are still required. Global feature status remains **73 Implemented / 59 Partial / 64 Blocked / 0 Not started / 196 total**. Verification notes changed for QAS-003, AWS-013, SEC-010, DAT-003 and CHT-008; no feature status or stable ID was closed.

## Concrete changes

- Independent CI jobs retain source-bound diagnostics even when another job fails; a required aggregate fails on any failed/cancelled/unrun gate. Added manual dispatch, official pinned Actions, checksum-verified actionlint, Node 22/24 coverage, existing utility/API and release-gate checks, both web builds and all existing suites. Verification has read-only repository permissions and never deploys or writes arbitrary fixes.
- The old native wrapper now delegates to the canonical runner, automatically including completion and future existing suites. It proves native connection/transaction exclusion and seeds/reads actual data across a restart of its own PostgreSQL container. It rediscovers a changed loopback port and never restarts an external database.
- Container builds preserve the pnpm workspace/lock policy, use pinned Node/nginx digests and optionally mount the supplied public CA through BuildKit for npm/pnpm. TLS, checksums and dependency release-age verification remain enabled. Buildx state stays in the writable workspace.
- Fixed the unquoted Compose tmpfs comma; nginx health/ready now test the API/database. Non-root users own readable migration/certificate/static files even when source imports retain mode 0600. The selected nginx configuration is baked into the image, avoiding a private-mode bind mount; API and web root filesystems are read-only. Smoke tests request JSON health/ready/status, HTML, SVG and WOFF2 bytes.
- Fixed a failing native concurrency fixture that assumed the first-started request wins. The assertion now finds the actual winner and checks exactly one acceptance, the losing version conflict, same-winner replay, changed retries, cross-account denial and preservation of original/content/origin. Production service logic and acceptance were not weakened.
- Targeted Next.js 16.4.1 and matching lint configuration, sharp 0.35.5, browserslist 4.28.7, source-map-js 1.2.2, Babel 7.29.6, baseline-browser-mapping 2.11.0 and fast-uri 3.1.8. Registry publication dates satisfy the unchanged seven-day policy. **Production audit: 18 findings before → 0 after (all severities).** This is dependency audit evidence, not an image/fleet CVE scan.

## Tests actually executed

All commands ran at `/workspace/FutureRobotic`; exact command/exit/duration/log paths are in `handoff/cloud-only/results/final-zero-audit-regression/20261023T195322988663Z/result.json`, `handoff/cloud-only/results/native-postgres/20261023T195406973747Z/result.json` and `handoff/cloud-only/results/containers/20261023T195623284876Z/result.json`. Hosted jobs bind their evidence to the exact source SHA above. Logs/metadata from earlier source revisions are retained and labelled historical; repeated cases are not added as new unique tests.

| Scope / command | Actual result | Limits |
| --- | --- | --- |
| `pnpm install --frozen-lockfile`; `pnpm exec tsc --noEmit`; `pnpm api:build`; actionlint | Passed | Exact pin/lock policy preserved |
| `node --test portable/dist/tests/*.test.js` with no native URL | 77 passed / 0 failed / 0 skipped | PGlite SQL/services/HTTP and provider/merchant doubles |
| `pnpm test:ui` | 15 passed / 0 failed | Rendering/export/grammar fixtures, not browser/device acceptance |
| `node tests/tools.test.mjs` | Passed | Existing language/asset/route/utility/API fixtures |
| Runner policy + release validator suites | 4 passed / 0 failed | No untrusted native execution or actual release |
| `pnpm infra:build`; offline `INFRA_SYNTH_ONLY=true pnpm infra:synth`; `pnpm infra:test` | Build passed; six templates; 4 tests passed | Offline unapproved fixture, no AWS operation |
| `pnpm web:build`; `pnpm build` | Both passed; 152 public candidate routes prerendered | Public indexing remains unapproved; bundle-size/deprecation warnings retained |
| `pnpm api:test:native` / `python3 handoff/cloud-only/run_native.py` | 77 cases: **76 passed, 0 failed, 1 existing skip**, plus successful separate native locking and actual restart/recovery proof | The skipped PGlite-oriented restart fixture remains distinct; real RDS failover is unrun |
| `python3 handoff/cloud-only/run_containers.py` | **PASSED_CONTAINER**: complete current-source image builds, four migrations, six successful HTTP checks, cleanup exit 0 | Local trusted development stack; no live account/provider/payment/storage acceptance |
| `pnpm audit --prod --audit-level low --json` | Exit 0; **0 info/low/moderate/high/critical** | npm production dependency advisories only |
| Hosted GitHub Actions | **7/7 jobs successful**, including both Node versions and the aggregate gate | Same cases under runtime variants; not new unique tests or production acceptance |

Native proof: `PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit`; distinct backend PIDs and advisory-lock exclusion/release recorded in the native result. Separate processes confirmed users, completed output, notes/chat and cancelled/failed run recovery after changing the actual PostgreSQL server start time. Test fixtures are disposable.

Actual full-stack image IDs:

- `066167ff39c2a612402ce99b734ea1cff92a9d1f2ac52f697a5f0384f0d88d6b`
- `796d12153dc5073168c19e3b0809dda60ee9ecb1e318af358041d29f95eb9ee9`
- `8d26c94764830bc2448ac1928cab32e46a0d98864757fed6c74f2bffa2e2ca14`
- `d62da16abb1d78e762021917384c5c5d87be6db2b8418c4aad330af0349709b5`

Earlier failures are preserved: npm trust-chain rejection, read-only Buildx home, VFS disk exhaustion, private imported file permissions and the CHT-008 false scheduling assumption. Each was diagnosed and corrected; full current-source cold builds and readiness were rerun after clearing only obsolete images/cache belonging to recorded disposable projects from this task. Intermediate permission-only local reuse experiments are labelled as reused outputs and are superseded by the final full-stack pass. No unrelated runtime/user data was removed. No code check remains unexplained or failed at the verified revision; later delivery revalidation is blocked before execution by the account issue above.

## Source and status provenance

Original application provenance remains `76dda7b040a95e96c529073240056678d9f12ba4` in `HANDOFF_MANIFEST.json`; it is a baseline record, not a claim that the current hardening source is byte-identical. All four historical migration files remain byte-identical. Current baseline differences and exact source/configuration file list are in `handoff/cloud-only/results/main-ci-20261024/summary.json`. Current implementation/configuration/document changes through the tested code revision:

- `.dockerignore`
- `.github/workflows/verify.yml`
- `AGENTS.md`
- `README.md`
- `handoff/CODEX_MAIN_TEST_AND_COMPLETE_PROMPT.md`
- `handoff/cloud-only/_test_common.py`
- `handoff/cloud-only/environment-start.md`
- `handoff/cloud-only/run_containers.py`
- `handoff/cloud-only/run_native.py`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `portable/Dockerfile.api`
- `portable/Dockerfile.web`
- `portable/compose.yml`
- `portable/scripts/test-native.mjs`
- `portable/scripts/verify-native-restart.mjs`
- `portable/tests/completion.test.ts`
- `portable/web/nginx.compose.conf`

Additional delivery changes update the current handoff/status/register verification notes and add sanitized evidence/inventories. Global classifications are unchanged. The original reference archive and all cumulative source/assets/tests/infra/CI remain included.

## Remaining scope and next Codex prompt

The requested copy/paste prompt is [handoff/CODEX_MAIN_TEST_AND_COMPLETE_PROMPT.md](handoff/CODEX_MAIN_TEST_AND_COMPLETE_PROMPT.md). It explicitly says **do not create a branch, worktree or PR; commit/push directly to main**, owns failure repair, lists current commands and all next acceptance groups, and directs the next agent to all 74 LIVE-* scenarios and the reviewed remaining feature work.

- Approved isolated sandbox gate is still **BLOCKED_ENVIRONMENT**: `RUNNER_TEST_ENDPOINT` and `RUNNER_TEST_PRIVATE_KEY_FILE` are not supplied. No untrusted native probes ran on this trusted host; no new fleet was installed.
- Live AI, OAuth/email, merchant, S3/queues, RDS/AWS deployment, production OIDC/branch-denial/rollback, restore/country/operational and browser/device acceptance are **not verified by this batch**. Protected inputs/account authority and policy decisions are prerequisites; variable presence was checked without revealing values. Absent process variables alone do not rule out other injected authentication. No production/public cutover, real payment or AWS resource creation occurred.
- The 59 Partial / 64 Blocked source/acceptance rows remain. The primary coding agent owns implementation and integration after supplied access; the owner supplies account authorization/protected bindings and business/policy decisions, not coding labor. Do not mark a whole feature complete because one CI sub-gate passed.

**Next action for the primary project agent:** Continue independent local engineering; after the account owner resolves GitHub Billing & plans, dispatch the current-main verification workflow and inspect its exact SHA. Use the main-only prompt, implement the reviewed source-owned P0 gaps with regression evidence, and execute the applicable 74 real acceptance scenarios only on approved environments with their required protected inputs; retain every unresolved gate explicitly.

## Complete delivery and reusable environment

Complete cumulative ZIP: `deliverables/FutureRobotic_AI_Main_CI_Hardening_20261024.zip`. External `.sha256`, CRC/completeness result and delivery metadata are saved beside it after assembly; the archive excludes its own delivery directory. The package contains all prior code/assets/migrations/tests/infra/CI/reference/status and current sanitized evidence. It excludes credentials, dependency directories, Git internals, build output and runtime databases/data; source file modes are normalized to Git modes for reproducible import. The real file is committed/pushed on main; no artifact or download URL is invented.

Reusable install/start fields were saved in the environment draft and mirrored in `handoff/cloud-only/environment-install.sh` / `environment-start.md`. Startup now follows main and current scope, supports the corrected native/container workflows and public-CA mounts, and documents VFS capacity/owned-cache handling. Exact GitHub API/log/artifact destinations observed during this work were added without replacing preset access or adding credentials. Draft saving is not publication; environment settings review/save and publication remain product actions, separate from the completed repository push and validation. No live process is assumed to survive a snapshot.
