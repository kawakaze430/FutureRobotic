# FutureRobotic AI — continuing agent instructions

Read `START_HERE.md`, `handoff/PROJECT_HANDOFF.md`, `handoff/CURRENT_TASK_REGISTER.json`, `handoff/VERIFICATION_EVIDENCE.md`, `handoff/NEXT_20_TASKS.md` and the code relevant to the requested batch before implementation. This package starts from Build03 application commit `76dda7b040a95e96c529073240056678d9f12ba4`; handoff documents are a separate overlay.

## Ownership

- Communicate in English. Treat the owner as technically experienced.
- Own engineering: implementation, migrations, tests, bug fixes, infrastructure, CI, runbooks, packaging and available deployment work. Do not transfer coding work to the owner because final acceptance needs credentials.
- Continue independent work when an operation is blocked. Record the exact operation, observed reason, affected IDs, unblock action and responsible party.
- The owner supplies account authorization, scoped AWS role/OIDC trust, domain/sender control, protected service configuration and business/policy decisions. Use secret stores or protected environment settings; never ask for plaintext credentials in chat.
- The OpenAI Developers plugin was declined. Do not install, invoke, or suggest that plugin. The provider-neutral application can be developed and tested with available tools and protected configuration.
- Work autonomously within the request; do not repeatedly request permission for routine, reversible engineering. Preserve the current private audience. Public cutover and real financial transactions require the relevant existing authorization and concrete release evidence.
- Do not spawn subagents unless the owner or applicable execution-environment instructions authorize delegation.

## Evidence and implementation

- Preserve stable IDs. Current totals: 73 Implemented, 59 Partial, 64 Blocked, 0 Not started, 196 total. Read reviewed clarifications; original descriptions can be stale. Inspect code before rebuilding existing features.
- Implemented means the precise named scope has evidence. It never means live AI, real merchant, native isolation or AWS operation merely because source/mock tests exist.
- Separate application implementation, local test results, native/deployed acceptance, and owner decisions. Do not mark an item complete just by updating its status. Do not treat all 126 former partial tasks as still partial.
- Use appropriate tests for changed behavior. Do not fabricate outputs, screenshots, benchmarks, runtime versions, payment outcomes or launch records. Exit 2 from native/release gates means blocked.
- Keep historical SQL migrations immutable. Add new numbered migrations; review runtime-role grants. Preserve tenant checks, CSRF, secret separation, ledger/audit immutability, dispatch fencing and idempotency.
- Never blindly resend an uncertain provider/payment/execution request or refund an uncertain reservation. Reconcile against authoritative evidence first.
- Run native SQL tests only against disposable databases. Run untrusted native code and abuse probes only in the approved isolated runner. Do not execute them directly on a trusted application host.
- Do not deploy offline fixture account IDs, `.invalid` domains or placeholder image digests. First-deploy orchestration is unfinished; the existing service-release workflow is not a complete bootstrap.
- Do not promise unlimited Standard use, refund eligibility, provider zero retention, worldwide payment eligibility or a multi-currency catalog without implementation and owner approval.

## Required output for every substantive project reply

1. State the batch objective and concrete implementation outcome.
2. Show global **Implemented / Partial / Blocked / Not started / total** counts, then stable IDs changed in the batch. Include what remains; leave unrelated statuses unchanged.
3. Report tests actually run: command or scope, observed result, source revision and limitations. Label reused evidence as reused. Separate blocked tests from failures and passes.
4. Provide a downloadable **complete cumulative source ZIP**, not only changed files. Include the current code, lockfile, migrations, tests, assets, infrastructure, CI, operating docs, status register, test evidence and updated handoff. Exclude secrets, dependency folders, runtime user data and Git credentials/history. Verify ZIP integrity and record SHA-256 and application source provenance.
5. If no source changed, link the latest verified complete ZIP and say it is unchanged. If file delivery is unavailable, state that limitation honestly; do not invent a download link or claim a package was created.
6. List exact blockers with ownership and the next concrete tasks. Update the handoff so another model can continue without this chat.

Keep final communication concise, with detailed evidence in files. A handoff-only/documentation batch does not close implementation tasks or require a public redeployment.

## Limited Cloud verification assignment — 23 October 2026

When the owner supplies the cloud-test-only prompt, its narrow scope takes precedence over generic instructions to implement a broad batch. Use the prepared native/container runners and only repair failures they demonstrate. Keep the feature backlog, UI redesign, live integrations and AWS provisioning outside that limited task. Return complete source/evidence even if the environment blocks execution.
