# FutureRobotic AI — proposed API contract

PLAN-01, 22 October 2026. **Contract design, not implemented endpoints.** Existing product endpoints are only `GET /api/status` and `POST /api/ai` in the Sites Worker. The portable service below is planned under `/api/v1` and must replace direct dependence on Sites identity.

## Common behavior

- Same-origin browser API where practical. Validate a server session or a bounded signed anonymous identity. Never accept `oai-authenticated-user-id`, `user_id` or `workspace_id` from a caller as proof of identity.
- Secure HttpOnly session cookies, deliberate SameSite/domain settings, CSRF protection for cookie-authenticated mutations and explicit allowed origins. Webhooks use provider signature verification instead of browser CSRF.
- JSON schemas published through OpenAPI, bounded content type/body size, strict tool/model/language IDs and structured error codes. Opaque IDs are strings; money uses minor units with currency.
- `Idempotency-Key` on cost-bearing dispatch, checkout and other retryable side effects. Bind key to principal plus request hash. Return the existing operation for same body; return `409 IDEMPOTENCY_CONFLICT` for a different body.
- Common error body: `error.code`, safe `message`, `request_id`, optional `retry_after_seconds` and field errors. No raw provider response/secrets in user errors.
- Lists use bounded `limit` and opaque cursor. All object access checks ownership/membership. Private responses use `Cache-Control: no-store`; CloudFront must not share-cache authenticated API or SSE.

## Routes

| Method and path | Principal | Main contract / side effects |
|---|---|---|
| GET /health/live | Infrastructure | Process liveness, no secrets or customer metadata |
| GET /health/ready | Infrastructure | Required service readiness, bounded dependency checks |
| GET /catalog | Public | Approved tools, language registry, runner versions, model capability labels and published plan limits |
| POST /auth/oauth/{provider}/start | Public | Safe Google/GitHub state/PKCE initiation; validated same-origin return path |
| GET /auth/oauth/{provider}/callback | OAuth callback | State/code validation, identity mapping and session issue |
| POST /auth/email/code | Public, throttled | Issue hashed expiring OTP challenge; generic enumeration-safe acknowledgement |
| POST /auth/email/verify | Public, throttled | Consume valid OTP once and issue session |
| POST /auth/logout | Account | Revoke session and clear cookie |
| GET /me | Account | Profile, authorized workspace, preferences and entitlement summary |
| PATCH /me/preferences | Account | Validated locale/editor/history/privacy preferences with version control |
| POST /me/identities/link | Account, recent auth | Explicit provider identity linking; no unsafe email-only merge |
| POST /me/export | Account, recent auth | Owned asynchronous export job and expiring private download |
| DELETE /me | Account, recent auth | Revoke access and start deletion job; explain required retention exceptions |
| GET /workspaces | Account | Authorized workspaces only; personal workspace first |
| GET /workspaces/{id}/home | Member | Pins, curated popular tools, recent permitted records and entitlement summary |
| PUT /workspaces/{id}/pins | Member | Validated tool/pair pins and order |
| POST /workspaces/{id}/runs | Member or bounded anonymous tool scope | Validate policy/context, reserve quota, create operation and dispatch permitted tool |
| GET /workspaces/{id}/runs/{run} | Owner/member | Run state and permitted result; no access by guessed ID |
| GET /workspaces/{id}/runs/{run}/events | Owner/member | SSE run lifecycle, output chunks and confirmed usage |
| POST /workspaces/{id}/runs/{run}/cancel | Owner/member | Idempotent cancellation request; outcome may be partial/uncertain until reconciled |
| GET /workspaces/{id}/history | Owner/member | Keyset-paginated tool/model/time filter with permitted previews |
| DELETE /workspaces/{id}/history/{run} | Owner/member | Revoke/delete active stored run content per policy |
| POST /workspaces/{id}/history/export | Owner/member | Async export job, selected scope and short-lived access |
| PATCH /workspaces/{id}/runs/{run}/notes | Owner/member | Per-run note with expected version |
| POST /workspaces/{id}/files/upload-intents | Owner/member | Reserve count/bytes; return scoped short-lived S3 upload fields/URL |
| POST /workspaces/{id}/files/{file}/complete | Owner/member | Verify actual object/checksum/size; enqueue quarantine/extraction |
| GET /workspaces/{id}/files | Owner/member | Search/paginate metadata and extraction state |
| GET /workspaces/{id}/files/{file} | Owner/member | Metadata, permitted revisions and bounded preview |
| POST /workspaces/{id}/files/{file}/download | Owner/member | Authorized short-lived access to permitted revision |
| DELETE /workspaces/{id}/files/{file} | Owner/member | Revoke access and schedule object/derived-context cleanup |
| POST /workspaces/{id}/imports/zip | Owner/member | Reference uploaded quarantine object; enqueue bounded safe ZIP import |
| GET /workspaces/{id}/imports/{job} | Owner/member | Progress, included/excluded files and safe per-file errors |
| POST /workspaces/{id}/chats | Owner/member | Optional saved session with linked run and history mode |
| GET /workspaces/{id}/chats | Owner/member | Permitted session list with cursor |
| POST /workspaces/{id}/chats/{chat}/messages | Owner/member | Create owned operation with user message, allowed model and selected context revisions |
| GET /workspaces/{id}/chats/{chat}/messages | Owner/member | Ordered permitted messages; no system prompt/secret leakage |
| GET /workspaces/{id}/chats/{chat}/events | Owner/member | SSE assistant response and operation lifecycle |
| POST /workspaces/{id}/chats/{chat}/cancel | Owner/member | Stop current operation with consistent accounting |
| DELETE /workspaces/{id}/chats/{chat} | Owner/member | Revoke and delete stored session/messages according to policy |
| POST /workspaces/{id}/runs/{run}/apply | Owner/member | Explicit selected assistant code application; new result version, parent version and diff |
| POST /workspaces/{id}/runs/{run}/shares | Owner/member | Explicit immutable selected snapshot with expiry; excludes hidden context |
| GET /shares/{token} | Token recipient | Read-only sanitized snapshot, expiry/revocation checked; noindex/no-store |
| DELETE /workspaces/{id}/shares/{share} | Owner/member | Revoke share and schedule content cleanup |
| POST /executions | Account or bounded anonymous identity | Reserve runner quota and enqueue approved runtime/source with strict limits |
| GET /executions/{job} | Operation owner | Structured compile/run state, output, exit code, duration and timeout reason |
| POST /executions/{job}/cancel | Operation owner | Idempotent stop request and cleanup |
| GET /billing/catalog | Public | Versioned approved plan/price/currency display data, no secret provider IDs beyond intended public fields |
| GET /workspaces/{id}/billing | Billing owner | Verified subscription, period, allowance and permitted invoice metadata |
| POST /workspaces/{id}/billing/checkout | Billing owner | Server-controlled customer/price mapping and hosted checkout session |
| POST /workspaces/{id}/billing/portal | Billing owner | Provider-approved short-lived portal session |
| POST /billing/webhooks/{provider} | Signed provider | Verify raw body/signature first; durable unique event inbox and idempotent processing |
| GET /workspaces/{id}/usage | Owner/member | Approved allowance/balance/period and own usage details |
| POST /support/tickets | Account or throttled public sender | Validate ticket and enqueue acknowledgement; no false delivery success |
| GET /operations/{id} | Operation owner | Safe export/deletion/extraction status and permitted result links |
| GET /operator/overview | Audited operator with MFA | Minimized operational metrics; no unrestricted customer source access |
| POST /operator/feature-flags | Audited operator with MFA | Versioned AI/runner/billing emergency switches and reason |
| POST /operator/reconciliation | Audited operator with MFA | Safe scoped reconciliation job, no arbitrary credit minting |

Anonymous public tools may use a separate explicit public run route rather than a real workspace ID. The implementation must never let an anonymous caller impersonate a workspace member. Use the same service contracts and policy checks behind either route.

## Tool dispatch request

Example logical request fields (documentation placeholders only):

```json
{
  "tool": "convert",
  "source_language": "python",
  "target_language": "javascript",
  "input": "print(1)",
  "instructions": "Preserve behavior",
  "model_route": "approved-standard-auto",
  "context_revision_ids": [],
  "history_mode": "local-only"
}
```

The service determines the authenticated user, permitted workspace, model tier and allowance. Language choice does not grant runner support. Input limits come from the approved catalog: reference targets include 4k anonymous converter, 25k account tool, 100k Premium, 50k PDF and 10k execution, with independently bounded byte/token/output sizes.

Creation should return an operation/run identifier, current state and events URL (`202` when queued). Code outputs and Markdown outputs have different typed result fields. Fixer response contains corrected code plus a separate change summary; diff is computed from source/result, not trusted as arbitrary AI HTML.

## SSE event contract

Use IDs/sequence numbers and a bounded stream. Planned event types:

| Event | Meaning |
|---|---|
| accepted | Operation and quota reservation accepted, with safe identifiers |
| queued | Waiting for bounded provider/runner capacity |
| started | Actual dispatch started with selected approved route |
| delta | Ordered text/code chunk; render as data, not trusted HTML |
| result | Final typed output/version metadata available |
| usage | Confirmed model/execution usage, not an invented estimate presented as final |
| cancelled | Cancellation acknowledged with partial-output/accounting status |
| error | Safe error code, retryability and existing-operation status |
| complete | Terminal operation state and final result/usage reference |

Keep server heartbeats and idle/max-duration limits compatible with ALB/CloudFront. Validate production streaming behavior rather than assuming the local server proves it. A reconnect should return stored operation state or a documented replay window; do not redispatch costly work just to recreate a lost stream. Ephemeral/no-save modes can expose a limited reconnect guarantee and must disclose it.

## Execution contract

Allow only configured language/runtime IDs and standard-library code. API workers do not execute code. The broker places an owned job on the isolated fleet. Distinguish queue time, compile time and run time. Return bounded stdout/stderr, exit code, timeout/resource reason and elapsed wall time. Resource limits are defined separately for compilation and execution.

Guest jobs have no egress, metadata access, provider secrets, customer storage credentials or reusable writable filesystem. Build/runtime tests must verify restrictions in the actual execution environment.

## Required negative and concurrency tests

- Forged platform/user/workspace headers, guessed resource IDs and unauthorized file/chat/history/share/billing actions.
- Replayed OTP, bad OAuth state, unsafe callback URL and session revocation.
- Same idempotency key with same/different body; simultaneous last-credit requests; crashes around outbox/dispatch/finalize.
- Duplicate, delayed, invalid and out-of-order payment events, period renewals and refund replay.
- Oversized code/context, excessive selected files, binary uploads, path traversal, symlinks and ZIP bombs.
- Unsafe Markdown/HTML/link content, prompt injection and secret leakage through errors/logs.
- Provider timeout/cancellation with uncertain completion; stream reconnect without duplicate dispatch.
- Runner resource abuse and cross-job residue; expired/revoked shares; account deletion and backup restore behavior.

Each endpoint needs its own policy and data constraints. This route list is a contract backlog, not evidence of running backend code.
