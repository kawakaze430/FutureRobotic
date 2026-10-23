# FutureRobotic AI — proposed database design

PLAN-01, 22 October 2026. **Design only: schema migrations and a production database have not been implemented or executed.** Task group DAT owns implementation. PostgreSQL is the transactional system of record; S3 stores private large code/file/export objects; cache data is disposable.

## Conventions

- Opaque UUID primary keys. `timestamptz` UTC timestamps. Normalize email without assuming provider-specific address equivalence. Keep display email separate.
- Every private product record includes or resolves to `workspace_id` and `owner_user_id`. Service queries authorize membership; do not accept these values as proof of permission.
- Composite foreign keys or equivalent constraints prevent a child referencing a resource in another workspace. Add row-level security only with a verified transaction-scoped tenant context and connection-pool reset tests; RLS is defense in depth, not a substitute for service authorization.
- Explicit status constraints and unique business keys. Version optimistic updates where user edits can race. Use integer counts and integer minor currency units or exact decimals, never binary floats for money.
- KMS-backed RDS/S3 encryption, TLS and narrow database roles. Runtime, migrations, support and recovery roles have different permissions. No API key, session bearer token, OTP plaintext or card data in ordinary tables/logs.
- A soft-delete flag removes normal access but is not proof that storage has been erased. Retention jobs handle active objects, versions, derived text, shares and backup expiry according to policy.

## Identity and workspace tables

| Table | Core fields | Constraints and lifecycle |
|---|---|---|
| users | id, email_normalized, display_email, display_name, status, session_version, created_at, deleted_at | Unique normalized verified account identity policy; suspended/deleted users cannot create sessions |
| auth_identities | id, user_id, provider, provider_subject, verified_email, linked_at | Unique(provider, provider_subject); explicit verified linking rather than matching arbitrary emails |
| sessions | id, user_id, token_hash, expires_at, revoked_at, last_seen_at | Hash opaque session token; bounded expiry; revoke all through session_version or server records |
| otp_challenges | id, destination_hash, code_hash, flow, expires_at, attempt_count, consumed_at, resend_after | Short TTL, constant-time comparison, atomic single use and attempt/resend caps; no plaintext OTP |
| workspaces | id, owner_user_id, name, kind, status, created_at | Personal workspace first; owner always authorized; future teams require explicit membership rules |
| workspace_members | workspace_id, user_id, role, joined_at, revoked_at | Unique(workspace_id,user_id); role allowlist; no implicit cross-workspace access |
| user_preferences | user_id, locale, editor_theme, font_size, line_numbers, default_history_mode, version | Validated preferences and optimistic version |
| privacy_consents | id, user_id, policy_type, policy_version, decision, effective_at | Append history; explicit internal-evaluation consent; derive current preference safely |

OAuth provider tokens are retained only if required for an actual feature. Login-only integrations should avoid storing broad provider access unnecessarily. If retained, encrypt them separately and limit access. GitHub user OAuth and GitHub Actions deployment OIDC are different systems.

## Files and context tables

| Table | Core fields | Constraints and lifecycle |
|---|---|---|
| files | id, workspace_id, owner_user_id, safe_display_name, media_type, state, current_revision_id, deleted_at | State uploaded/quarantined/ready/rejected/deleting/deleted; count only policy-defined active files |
| file_revisions | id, file_id, workspace_id, object_key, version_id, sha256, byte_size, parser_type, created_at | Immutable content/version; never trust user-supplied S3 keys; exact per-workspace ownership |
| file_extractions | id, revision_id, workspace_id, parser_version, extracted_object_key, token_estimate, state, error_code | Bounded extraction; ready state required before context use; retry is idempotent |
| upload_reservations | id, workspace_id, operation_key, reserved_bytes, expires_at, state | Atomic file-count/byte admission; release unused reservations after verified expiry |
| run_context_files | run_id, revision_id, workspace_id, order_index, included_bytes, omission_reason | Snapshot exactly which revisions entered a run; no unselected files |

Use separate private S3 prefixes/buckets for quarantine, ready content, exports and public static assets. ZIP import creates bounded child file records only after path/symlink/expanded-size/count checks. Exclusion lists and failures are visible to the owner. S3 events can be duplicated; job identity must survive replay.

## Runs, results, notes and chats

| Table | Core fields | Constraints and lifecycle |
|---|---|---|
| tool_runs | id, workspace_id, user_id, tool_id, language_from/to, model_route_id, operation_key, request_hash, state, history_mode, started_at, completed_at, error_code | Unique(workspace_id,operation_key); same key/different body returns conflict; bounded state transitions |
| run_payloads | run_id, workspace_id, source_object_key, instructions_object_key, retention_until | Created only when storage mode permits; large/private payloads stay encrypted and outside general logs |
| result_versions | id, run_id, workspace_id, kind, code_object_key, markdown_object_key, change_summary, parent_version_id, created_at | Immutable results and assistant-applied versions; preserve original for diff/recovery |
| run_notes | id, run_id, workspace_id, author_user_id, text, version, updated_at | Notes belong to a specific run; optimistic concurrency |
| chat_sessions | id, workspace_id, user_id, linked_run_id, title, history_mode, created_at, deleted_at | Owner-scoped list/detail/delete; session persistence follows privacy choice |
| chat_messages | id, session_id, workspace_id, sequence, role, text/object_key, result_version_id, state, created_at | Unique(session_id,sequence); trusted roles only; mark partial/cancelled responses explicitly |
| pins | id, user_id, workspace_id, tool_id, language_from/to, position | Unique per selected tool/pair; validated tool/language registry |
| shared_results | id, workspace_id, owner_user_id, token_hash, snapshot_object_key, expires_at, revoked_at, created_at | High-entropy token hash; immutable selected snapshot; no hidden context; noindex |

Run lifecycle: `created → reserved → queued/dispatched → streaming → succeeded/failed/cancelled/uncertain`. Not every tool uses every intermediate state. Finalization and quota settlement are separate durable transitions linked by operation ID. A provider timeout/disconnect can be uncertain rather than proof that no work/cost occurred.

Local-only mode can retain the UI history in the browser while the service keeps only the minimum operational/usage metadata required to complete and account for a request. Do not persist source/result/chat bodies in cloud history under that mode. Define transient processing retention before public use.

## Catalog, billing and allowance tables

| Table | Core fields | Constraints and lifecycle |
|---|---|---|
| plan_versions | id, plan_key, version, effective_at, published, config | Versioned Free/Pro/Premium policy; frontend cannot invent entitlements |
| prices | id, plan_version_id, provider, provider_price_id, currency, interval, amount_minor, tax_behavior, active | Unique(provider,provider_price_id); approved catalog only; preserve historical purchases |
| model_routes | id, provider, model_id, tier, task_capabilities, token_limits, cost_metadata, retention_policy, active | Explicit provider route/capability and data-handling version |
| billing_customers | id, workspace_id, provider, provider_customer_id | Unique provider customer mapping; ownership validation before portal/checkout |
| subscriptions | id, workspace_id, provider_subscription_id, plan_version_id, price_id, status, current_period_start/end, cancel_at, updated_at | Verified provider state; retain effective dates; no access based solely on redirect |
| provider_events | id, provider, provider_event_id, received_at, payload_hash, restricted_payload, processing_state, processed_at | Unique(provider,provider_event_id); signature verified before trusted processing; minimized retained data |
| subscription_period_grants | id, subscription_id, period_start, allowance_kind, grant_version, ledger_entry_id | Unique(subscription_id,period_start,allowance_kind,grant_version); prevent duplicate renewal grant |
| quota_accounts | id, workspace_id, allowance_kind, period_key, granted_units, available_units, reserved_units, version | Separate Standard/Advanced/runner or other approved units; nonnegative spendable/reserved values |
| usage_reservations | id, workspace_id, operation_key, quota_account_id, requested_units, reserved_cost_micros, state, expires_at, settled_at | Unique logical operation; atomically reserve before dispatch; terminal transition exactly once |
| usage_ledger | id, workspace_id, quota_account_id, operation_id, event_kind, units_delta, cost_micros, provider_request_id, created_at | Append-only grants/reservations/settlements/releases/corrections; unique business event key |
| refunds_adjustments | id, provider, provider_refund_id, payment_reference, workspace_id, state, amount_minor, currency, reason | Unique provider refund; audited append-only entitlement/ledger correction, never rewrite old events |

Allowance units are not assumed equal to dollars or tokens. Define pricing policy explicitly. Monetary costs use exact units such as USD micros with currency labeling. Do not mix currency balances without an approved conversion rule.

### Atomic usage flow

1. Validate authenticated/anonymous principal, tool/model, selected file ownership, policy and idempotency key.
2. In one database transaction, lock the relevant quota/budget rows, reject insufficient allowance, create the run/reservation and write an outbox event. Store the request hash.
3. A worker/dispatcher claims the operation and calls the provider/runner with a bounded context/output policy. Do not keep a DB transaction open during network calls.
4. On confirmed outcome, append the final usage event and adjust the account projection once in a transaction. Duplicate completions are harmless.
5. On retry, return the original operation/result where possible. Same key/different request is a conflict. Do not blindly redispatch an uncertain paid-provider operation.
6. Expired reservations require state-aware reconciliation. Expiry alone must not refund an already completed but delayed event. Preserve audit trail and publish cancellation/failure charging rules.

Tests must cover two simultaneous requests for the last credit, duplicate provider events, stream disconnects, worker crashes after dispatch, restart before outbox acknowledgement, period-boundary renewals and refund/correction replay.

## Operations and policy tables

| Table | Purpose |
|---|---|
| outbox_events | Committed work awaiting queue publication; business ID, attempts and publish status |
| jobs | Idempotent extraction/export/deletion/reconciliation jobs; ownership, state, attempts and next retry |
| execution_jobs | Language/runtime image, owned input/output references, resource profile, exit/elapsed status and cleanup state |
| support_tickets | Owner/contact, subject/body, state and delivery references; bounded user content |
| audit_events | Actor, action, target, outcome, request ID and minimized metadata for sensitive operations |
| deletion_requests | Scope, user/workspace, requested/active-erasure/completed state and retention exceptions |
| export_requests | Authorized scope, export job state, private object reference and expiry |
| retention_policies | Versioned retention modes/durations and effective dates approved before customer use |
| feature_flags | Versioned routing, AI/billing/execution availability and emergency stop state |

## Index and access plan

Index workspace/user plus creation time for history, files and chat lists. Index run operation keys, provider event IDs, active subscriptions, due jobs, reservation states/expiry and private share-token hashes. Use bounded keyset pagination for long lists. Verify query plans with representative data.

Budget total DB connections across maximum ECS replicas and background jobs. Migrations use separate credentials and a single controlled deployment job. Avoid treating every application task restart as permission to run migrations concurrently.

## Backups, deletion and rollout

Enable encrypted automated RDS backups, approved retention and isolated restore drills. Multi-AZ failover and a backup restore solve different failures. Record achieved RPO/RTO rather than assuming a checkbox meets the target.

Prefer expand/backfill/contract changes compatible with both current and previous app image. Reverting application code must not erase new billing or usage events. Destructive migrations require deliberate sequencing and recoverability.

An account deletion must revoke sessions/shares, remove active user content and schedule derived object cleanup. Document what remains for legally required billing records and when backups expire. Restore runbooks must reapply deletion tombstones so a restore does not silently republish previously deleted content.
