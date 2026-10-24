# Guarded workflows and current operating limits

Source implemented on 24 October 2026; no AWS resources, emails, provider requests,
payments, authenticator enrollments or public release were performed by this run.
Use protected settings for all credentials. Defaults keep public dispatch closed.

## Operator access

Run migrations001–008 with the separate protected migration role, then the runtime
bootstrap. Serving processes in production require `fr_runtime`; they cannot add,
rotate or revoke operators. Do not mount admin credentials in a serving container.

After `pnpm api:build`, the protected provisioning task can run:

```sh
node portable/scripts/operator-admin.mjs generate-seed --output /protected/new-operator.json --label USER_ID
node portable/scripts/operator-admin.mjs enroll --user USER_ID --role support --seed-file /protected/new-operator.json --request-key UNIQUE_REQUEST_KEY --reason 'Reviewed operator enrollment'
# rotate additionally requires --expected-version CURRENT_VERSION; revoke requires
# --user, --expected-version, --request-key and --reason, without a seed file.
```

These are templates, not commands executed against an account. Provisioning needs
`OPERATOR_ADMIN_AUTHORIZED=true`, a separate `OPERATOR_ADMIN_DATABASE_URL`,
`APP_ENCRYPTION_KEY` and trusted `PG_CA_FILE`. Seed files are owned, mode0600,
exclusive-create regular files. Import the URI through the protected channel;
never include the seed, database URL or URI in an issue, log, archive or chat.
Enrollment/rotation/revocation invalidate account and operator sessions. The
`/operator` console uses a fresh TOTP session, five-minute expiry, role checks,
CSRF, optimistic/idempotent writes and immutable audit receipts. Support, billing,
operations and administrator permissions differ. No purchase/refund action was added.

## Support acknowledgements

POST support retains a request key across uncertain browser retries. Ticket,
outbox and queue insert are atomic. The worker sends only a constant receipt;
private support text is never included. Set `supportAckEnabled` only after sender
approval; it supplies `SUPPORT_ACK_ENABLED`, `SES_FROM_EMAIL` and
`SUPPORT_CONFIGURATION_SET`. Definite non-acceptance may retry; unknown acceptance
stays uncertain and must not be resent. An authorized fresh-MFA operator can
recover a definite failed delivery through the generation-bound retry endpoint.

SES configuration-set events go to the dedicated encrypted SNS topic and Lambda
relay. The relay validates the exact topic, strips recipient/private content and
HMAC-signs bounded delivery metadata to `/webhooks/support-delivery`. The API and
relay share a dedicated Secrets Manager document, separate from application/provider
secrets. Rotation uses `current` and optional `previous` keys on the API; relay
reads current with a five-minute cache. Review SES, Lambda and dead-letter outcomes
before any recovery. Delivery/bounce/complaint fixtures do not prove real delivery.

## Anonymous admission

Protected `ANONYMOUS_RELEASE_APPROVED=true`, hash and Turnstile secrets enable the
service. `ANONYMOUS_AI_ENABLED` and `ANONYMOUS_EXECUTION_ENABLED` are independent;
AI also requires approved `ANONYMOUS_MAX_AI_MICRO_USD` and configured worker pricing.
Use Turnstile action `anonymous_dispatch` bound to the actual hostname. Direct-edge
mode rejects forwarded-header spoofing; trusted mode needs the measured hop count.
No CloudFront viewer-IP/real-human/deployed abuse acceptance was performed.

The account-free schema enforces two AI requests and three executions per day,
context limits, concurrency/backlog caps and shared spending controls before dispatch.
The browser stores only pending IDs/keys, supports explicit recovery and preserves
Reset/editor selections. Unknown outcomes retain cost holds; no blind resend or
refund is allowed. Anonymous execution uses only an approved HTTPS gateway and
protected Ed25519 signing material, never the application host. Public flags remain
off in the release configuration until their acceptance gates are satisfied.

## Authoritative reconciliation

A billing-authorized fresh operator session can inspect reconciliation cases and
request a bounded authoritative merchant lookup. Observations, applications and
provider-cost adjustments are append-only/idempotent. Mismatches and unsupported
provider evidence remain open; no fabricated output recovery, refund or new credit
minting is used. Approved paid-price, ownership and time-window binding are required.
The production model provider has no authoritative outcome adapter yet.

The worker has an optional merchant reconciliation scheduler, but the current CDK
worker does not inject a dedicated reconciliation merchant credential. Finish that
secret-separated wiring before claiming scheduled deployed reconciliation. Plan
change/proration/grace policy, provider charged totals, all dispute state transitions,
invoices/tax and real merchant lifecycle acceptance remain engineering/acceptance gaps.

## Infrastructure and portable JavaScript worker

The foundation synthesis phase has data/network/ECR/cluster outputs and no serving
image/task dependency. It is for a new stack only: applying it over an existing
services stack would propose removal of serving resources. The create-only guarded
first-deploy orchestrator, migration task and image-promotion workflow are unfinished;
do not manually deploy this phase to an existing environment. No AWS apply occurred.

Optional regional recovery adds an encrypted RDS backup-copy vault/key/role in a
distinct region. It does not provide regional file replication or measured restore.
Operational EMF totals now feed queue/uncertain/cost/mismatch/heartbeat charts;
real alarms, recipients, synthetic probes and incident drills remain unverified.

The portable build now includes the same browser JavaScript worker as the Sites
build. Its response alone allows evaluation and denies network access; the main
page policy does not allow evaluation. This is a disposable browser worker, not
proof of server-side native isolation or a replacement for the approved sandbox.
