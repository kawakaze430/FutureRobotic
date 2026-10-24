# SEC-003 — bounded Markdown destination hardening (24 October 2026)

**State: Partial.** The signed-in and free tool Markdown result renderer now checks destinations using a fail-closed helper instead of accepting any `http:` / `https:` prefix. Only fully formed HTTP(S) URLs without embedded credentials, a single root-relative path, fragment, or header-free single-recipient `mailto:` are permitted. Control characters, backslashes, leading/trailing whitespace, oversized and malformed destinations are suppressed. Remote images remain non-fetching text placeholders; raw HTML remains disabled.

Source: `lib/safe-markdown-url.ts`, `app/result-reading.tsx`. Automated rendering/security regression: `tests/markdown-security-ui.test.tsx` (picked up by the existing `pnpm test:ui` glob). Standalone helper cases were exercised under Node 22 in the authoring environment. Hosted CI must be inspected for the exact commit after push.

This is not full SEC-003 closure. Browser/content policies, portable identity/session/CSRF/CORS coverage, actual deployment headers and adversarial staging probes are still needed. No claim of live-provider or AWS acceptance is made. Canonical status remains **75 Implemented / 57 Partial / 64 Blocked / 0 Not started / 196 total**.

Earlier Build03 notes and source provenance in `handoff/PROJECT_STATE.json` are historical; consult `CLOUD_RETURN.md` for current source/test evidence.
