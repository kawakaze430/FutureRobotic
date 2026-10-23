# FutureRobotic AI

A developer toolkit branded FutureRobotic AI. The public layout follows the supplied CodeConvert homepage screenshots, and the dark workspace follows the supplied signed-in recording, including the right-hand code assistant. This release is a private preview.

## Included

- Beige landing page with the reference typography, tool artwork, workspace preview, three-column benefits, call to action, 68-card language directory, and footer.
- Eight dedicated free-tool routes and a dark eight-tool workbench with a collapsible sidebar, searchable language selectors, files, history, notes, and account preferences.
- Right-hand AI Code Assistant with follow-up chat, code context, text/code attachments, quick prompts, explicit apply-code controls, and independent panel visibility. Chat remains in the current session. Without a provider, replies are clearly labeled local guidance.
- Converter, generator, explainer, reviewer, and fixer interfaces with a server-side AI adapter.
- 72 language choices, including all 68 reference directory entries; four curated conversion examples with reverse directions. Examples are explicitly labeled and are matched against the complete input, never used as fake results for arbitrary code.
- Local comment removal with string, shebang, regex, and SQL quoting handling. Python triple-quoted strings and JavaScript templates are preserved conservatively.
- A disposable JavaScript Web Worker runner, bounded output and a five-second timeout. The worker response declares a no-network CSP.
- Multi-page code PDF generation, text/code downloads and copy controls. The built-in PDF font covers ASCII; unsupported characters become question marks, as disclosed in the UI.
- Up to 20 local source files (100 KB each, 500 KB combined), 30-result history, search/filter, history JSON export, pinned language pairs, and notes.
- Local saving control, clear-data confirmation, dark editor, line numbers, and font size preferences.
- Pricing previews, FAQ accordions, contact-message download, privacy, and terms pages.

## External connections pending

**Live AI is not enabled in this deployment.** No provider credential was supplied. The frontend checks `/api/status` and clearly distinguishes local utilities, sample results, and live AI. The AI adapter uses a server-side runtime secret; API keys are never accepted through or exposed to the browser.

**Payments are not enabled.** Prices are proposed plans and buttons do not create a charge or subscription. There is no fabricated checkout success, account activation, email delivery, or paid entitlement.

**Contact messages are not sent.** The form downloads a message to the user's device. A support destination has not been configured.

**History and files are browser-local.** There is no cloud synchronization. When reference files are enabled, the main AI tools can send up to five local files (6,000 characters each) as context. The assistant receives the current source/result and its optional attachment. The only execution runtime is plain JavaScript, without imports or DOM access.

## Visual assets

The reference language logos, four tool previews, workspace image, and background pattern are in `public/languages` and `public/previews`, retrieved from the user-requested reference website. The workspace preview has CSS brand overlays. Geist Sans and Geist Mono font files are hosted locally. The application source, new brand icon, interactive workspace, and assistant implementation are authored for this Site.

## Development

This project uses the supplied Sites Vinext starter, React 19, TypeScript, Vite, and Cloudflare Workers. Preserve the existing Sites build integration and project identity.

```sh
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.0/scripts/install-dependencies.mjs
sites-preview start /workspace/sites/codeshift-studio
```

The supervised managed preview is available for internal QA at `http://terminal.local:4173/`.

```sh
./node_modules/.bin/tsc --noEmit
node tests/tools.test.mjs
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.0/scripts/build-site.mjs
```

The checked-in hosting manifest identifies the existing Site. Do not register a second Site for edits.

## Runtime contracts

- `GET /api/status`: returns feature readiness, never secrets.
- `POST /api/ai`: authenticated, same-origin JSON requests only; validates tool/language/input, caps body size, limits per-user requests within each isolate, bounds output and times out provider calls. Chat accepts at most eight prior messages (2,000 characters each), a 4,000-character question, 10,000 characters per editor, and a 6,000-character attachment. Client-supplied system roles are rejected.
- `OPENAI_API_KEY`: server runtime secret, currently absent.
- `OPENAI_MODEL`: optional runtime model name, default `gpt-4.1-mini`.
- Unconfigured live requests return an actionable error; no code is executed by the server.
- Platform access controls protect this owner-private Site. A public commercial launch requires durable distributed rate limiting, billing-backed quotas, entitlement checks, production support delivery, monitoring, and legal/business configuration.

## Verification

Automated checks exercise all eight example directions, all directory assets and free-tool routes, 72 language choices, string-preserving comment removal, multi-page PDF structure, request validation, authentication, origin controls, bounded chat context, reference files, and mocked provider error/success responses. TypeScript is checked separately.

Desktop browser checks verified the landing page, dark converter and runner, local assistant guidance, panel visibility controls, searchable language choices, free converter, and history. Earlier checks verified result execution (`55` for Fibonacci), source upload, and local comment removal. PDF bytes passed a three-page A4 structure check with Poppler. Browser download-event capture is dependent on the preview environment; no real provider, billing, or support-delivery integration was tested. Responsive breakpoints are implemented, but this browser session does not expose device viewport emulation.
