# FutureRobotic AI — ownership and minimum-cost verification path

Prepared 23 October 2026, India. This is a verification plan, not a claim of tests/deployment performed. Baseline remains 73 Implemented / 59 Partial / 64 Blocked / 0 Not started (196 tasks).

The primary project agent keeps implementation/integration ownership: application code, test fixtures, fixes, migrations, API contracts, frontend, AI/billing adapters, IaC, CI, runbooks, status and cumulative packaging. A restricted runtime blocks an operation, not every related coding task. Codex Cloud gets the smallest missing execution scope; it is not asked to reimplement the project or repeat checks already available here.

## Allocation

| Work | Primary owner / execution surface | Input needed | Immediate instruction |
| --- | --- | --- | --- |
| All independent source work and integration | Primary project agent here | Latest source/returned evidence | Retain all 59 Partial items and mixed engineering; do not hand them to the owner |
| Native PostgreSQL multi-connection verification | Codex Cloud if usable native DB/Docker exists | Locked dependencies and disposable DB capability | Run prepared native utility; retain all four suites and evidence |
| API/web images, Compose migration/readiness | Codex Cloud with working Docker; otherwise authorized Linux CI | Daemon/registry/Compose access | Run prepared container utility; narrowly fix demonstrated failures |
| Isolated five-language resource/network/residue probes | Approved separate gVisor test fleet, operated by coding agent | Built/scanned runtime images, gateway and protected signer | Run existing native probes only after host boundary exists; no trusted-host user-code execution |
| RDS/S3/SES/SQS/CloudFront/WAF/IAM integration, load/failover/restore/rollback | AWS staging operated by coding agent | Activated account, scoped role, reviewed config/domain/budget | Separate later staging run; no full-stack provisioning for the first SQL/container check |
| Live AI tools/chat quality/stream/cost | Prepared staging/approved test service; coding agent runs | Approved provider/model/quota/retention/spending config | Separate focused run after code/test harness and configuration are ready |
| Real OAuth/OTP and support sender | Staging/browser verification by coding agent | Owner OAuth apps, domain/sender/human verification | Real delivery/consent/session/edge acceptance; no fabricated identity bypass |
| Merchant sandbox/renewal/refund/reconciliation | Coding agent in approved sandbox | Merchant onboarding, protected IDs and approved policies | Separate sandbox run; actual live charge/refund requires its financial authorization |
| Alternative coding assistance | Antigravity, using an available remote host/CI if needed | Repository and actual compute connection | Use only for a specific unresolved error/review; IDE/model access alone does not supply Docker or AWS |
| Optional CPU/data/evaluation experiments | Colab, if a later task benefits | Appropriate notebook/data/provider setup | Not required for this Node/PostgreSQL/container pass; keep its compute units for useful later work |
| Archive backup and transfer | Your existing Drive storage | Owner-selected private file/folder | Store ZIPs/evidence; storage is not an application test host or product database |
| Last-resort local execution | Codex/Antigravity against a remote host first; Windows Docker/WSL only if necessary | Actual permission/capability after remote alternatives fail | Avoid installing Java/Python/Docker stacks on the hot laptop for this first run |
| Other-cloud test host | Existing/approved Azure CPU host if AWS/CI are unavailable | Activated account, scoped access and explicit cost cap | Run the same kit; do not duplicate the production architecture or buy GPU time |

Your stated cloud credits/compute/storage are potential inputs, not verified access or approval to create arbitrary resources. Set an explicit resource/time/cost limit before provisioning a paid host; stop/remove only resources created for that authorized test. No new service is provisioned by this prompt-preparation batch.

## Dependency failure decision path

1. **Package download blocked:** record exact command, hostname and observed DNS/TLS/HTTP/allowlist issue. Configure the allowed registry in environment setup and retry once after that concrete change. Keep lockfile/versions/TLS validation intact. Repeating the same failing install consumes the allowance without changing access.
2. **Docker client exists but daemon/socket denied:** record observed denial. A client install cannot establish platform privileges. Do native SQL only if a deliberately disposable service is already available; otherwise hand the kit to Linux CI/approved remote host.
3. **Image registry denied:** record exact image/host/status, configure its permitted registry/download hosts, then retry once. Do not repeatedly rebuild unrelated layers or switch unreviewed images.
4. **Actual compile/test failure:** allow a small targeted repair and affected rerun. If it requires a feature/architecture change or exceeds the bounded repair budget, return reproducible logs and the exact source to the primary agent.
5. **AWS account activation/role still blocked:** do not spend the Codex run debugging billing/profile forms or applying infrastructure. Keep B02/B09 blocked and finish native/container checks on the available host. Owner resolves the account-side requirement; the primary agent prepares/reviews code/config.
6. **No usable remote test capability:** return a prepared-not-executed runbook/CI task and exact missing access. Consider another existing authorized cloud host before laptop installs. Do not claim testing succeeded elsewhere merely because this plan names that host.

## Later runs — only when their prerequisites exist

| Stage | Small next assignment | Do not bundle into the first run |
| --- | --- | --- |
| A — now | Native SQL + existing containers + narrow fixes + full ZIP | Feature backlog, real services, AWS stack provisioning |
| B — isolated runner | Actual five-runtime/isolation/queue/patch tests on approved host | New production application rollout |
| C — staging | Source-complete bootstrap and selected AWS integration tests | Worldwide public cutover |
| D — live integrations | Approved AI/auth/sender/merchant scenarios with real observed outcomes | All-provider integrations or unrelated redesign |
| E — release acceptance | Load, costs, failure/restore/rollback/alerts/privacy/browser/country evidence | Invented SLAs, fabricated passes, unapproved transactions |

All 74 full-production scenarios remain in the cumulative handoff matrix. The first run is deliberately narrower. A native/Compose pass can close a named verification gate; it does not automatically complete the encompassing feature or establish worldwide readiness.

## Status contract

Preserve the canonical 196 feature IDs/statuses. Report implementation separately from verification, using these per-gate states:

- `PASSED_NATIVE` / `PASSED_CONTAINER`: actual named scope and evidence; `PASSED_NATIVE_WITH_SKIPS` leaves every skipped scenario unverified.
- `FAILED`: executed and observed failure, with reproducible logs and affected IDs.
- `BLOCKED_ENVIRONMENT`: daemon, permissions, network, package or execution capability unavailable.
- `BLOCKED_ACCOUNT`: missing approved test service, identity, role, secret or owner policy.
- `PREPARED_NOT_EXECUTED`: code/runbook exists, but the real run did not happen.
- `NOT_ATTEMPTED_SCOPE`: intentionally excluded from this bounded assignment.

Do not inflate source completion or reduce blocked counts by relabeling an absent external test as done. Always deliver the full cumulative source, evidence and next action so the primary agent can integrate the result.

## Official setup references checked 23 October 2026

- [Codex Cloud](https://learn.chatgpt.com/docs/cloud): select a repository-backed environment, review setup and start the task. Work executes remotely.
- [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments): prepare dependencies/service access in the actual environment. Configure required hosts; allowed destinations alone do not provide service permission. Current direct variables/network secrets differ from Legacy setup-only secret behavior.

These documentation checks establish the setup mechanism, not Docker/gVisor availability in your particular session. The test kit probes the actual environment first. No Agents API, extra OpenAI API subscription or declined plugin is required for the primary native/container assignment.
