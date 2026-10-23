import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Keep one native implementation: discover every existing backend suite,
// retain sanitized evidence, and preserve blocked/failure exit codes.
const root = fileURLToPath(new URL('../../', import.meta.url));
const result = spawnSync('python3', ['handoff/cloud-only/run_native.py'], {
  cwd: root, env: process.env, stdio: 'inherit',
});
if (result.error) {
  console.error('Native verification requires Python 3 and the checked-in runner.');
}
process.exitCode = result.status ?? (result.error?.code === 'ENOENT' ? 2 : 1);
