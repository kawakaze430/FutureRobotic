#!/usr/bin/env bash
set -euo pipefail
cd /workspace/FutureRobotic
node --input-type=module -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("Node >=22.13 is required."); process.exit(1); }'
test "$(pnpm --version)" = "11.25.0"
pnpm install --frozen-lockfile --store-dir /workspace/FutureRobotic/.sites-runtime/pnpm-store --cache-dir /workspace/FutureRobotic/.sites-runtime/pnpm-store/policy-cache --reporter=append-only --fetch-retries=0 --fetch-timeout=30000
mkdir -p /workspace/FutureRobotic/.sites-runtime/buildx
