# Recorded verification and its limits

Application source: `76dda7b040a95e96c529073240056678d9f12ba4`. No application changes were made by this handoff.

| Evidence set | Actual scope | Result |
| --- | --- | --- |
| Build03 backend | SQL/services/HTTP with synthetic accounts, PGlite and explicit provider/merchant doubles | 77 pass |
| Build03 UI/export/grammar | React rendering, parser/PDF/export fixtures | 15 pass |
| Build03 runner policy/release | Capability/launch policy and release-validator unit assertions | 4 pass |
| Build03 infrastructure | Offline CDK template assertions | 4 pass; six stacks synthesize |
| Build03 automated total | Above four groups | 100 pass; no skipped native test counted |
| Build03 other checks | Root/API/infra TypeScript, existing tools regression, portable standalone and private hosting builds | Recorded pass |
| Latest backend/AWS recheck — 22 October 2026 13:23 UTC | Backend and infra rebuild; backend suite plus infrastructure suite; offline synthesis | 77 + 4 pass; six templates; source clean |
| Latest native PostgreSQL gate | Docker prerequisite | Exit 2, Blocked B01 |
| Latest native runner gate | Isolated signed TLS gateway/test key prerequisite | Exit 2, Blocked B01/B02 |

The latest **81 passes are a repeated subset** of the Build03 100, not 81 additional unique tests. Current packaging checks verify source equality, status/matrix consistency, archive integrity and absence of known secret patterns; they do not rerun unchanged application tests or establish deployment.

Files in `evidence/build03/` preserve recorded TAP/text and verification JSON. `evidence/latest-backend-aws/` preserves the actual later logs and process-exit metadata. Original JSON retains local paths as historical execution context; copies of each referenced log are in the same evidence directory. Do not reinterpret those paths as a deployment endpoint.

PGlite 0.3.16 is PostgreSQL in WASM with serialized transactions. A passing parallel application fixture there is not evidence of native multi-connection contention, worker replicas, pool behavior, RDS operation/failover or production performance.

Recorded desktop Chromium QA at 1365×937 covered Python syntax/plain fallback, fullscreen Escape, line-number/font settings, comment removal, five execution choices, local JavaScript output 55, PDF controls/full 50k print preview, help search and language directory links. This was the private/local preview, not portable account/provider/merchant/fleet acceptance. PDF generation fixture bytes are validated separately; an actual browser download/print across supported engines remains pending. No private browser screenshot is repackaged here.

No AWS provisioning, real AI inference/chat/cost run, real OAuth/sender delivery, merchant sandbox/live financial lifecycle, native execution/isolation, mobile/cross-engine acceptance, regional probe, failover/restore/rollback or incident drill was performed by preparing these documents. Consult PRODUCTION_TEST_MATRIX for the pending real scenarios.

## 23 October — Cloud-test preparation only

Three small Python test utilities and a focused prompt/ownership plan were added as a handoff overlay. Python and embedded probe JavaScript syntax checks passed. Both runners were invoked here and correctly returned exit 2/BLOCKED_ENVIRONMENT because Docker is absent; no native suite or container build ran. Their observed results are under `cloud-only/results/`, and `cloud-only/AUTHORING_CHECKS.json` records this scope. All 382 original application files remain byte-identical to Build03; old 100-test/81-recheck evidence is reused, not rerun or added to a new total.
