// Called in two separate processes by the disposable native runner only.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Postgres } from '../dist/src/db.js';
import { migrate } from '../dist/src/migrate.js';
import { RunService } from '../dist/src/runs.js';
import { ContentService, LocalObjects } from '../dist/src/content.js';
import { Worker } from '../dist/src/worker.js';
import { account, input, silent } from '../dist/tests/support.js';

const [phase, stateFile] = process.argv.slice(2);
if (!['seed', 'verify'].includes(phase) || !stateFile ||
    process.env.FR_DISPOSABLE_NATIVE_DB !== 'true' || !process.env.TEST_DATABASE_URL) {
  console.error('BLOCKED: restart proof requires an explicitly disposable native database and a state file.');
  process.exit(2);
}
const admin = new Postgres({ connectionString: process.env.TEST_DATABASE_URL });
let db, schema, completed = false;
try {
  let state;
  if (phase === 'seed') {
    schema = `fr_restart_${randomUUID().replaceAll('-', '')}`;
    await admin.query(`CREATE SCHEMA ${schema}`);
  } else {
    state = JSON.parse(await readFile(stateFile, 'utf8'));
    schema = state.schema;
    assert.match(schema, /^fr_restart_[a-f0-9]{32}$/);
  }
  db = new Postgres({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` });
  await migrate(db);
  if(phase==='seed')await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
  const started = (await admin.query('SELECT pg_postmaster_start_time()::text AS started')).rows[0].started;
  if (phase === 'seed') {
    const objects = new LocalObjects(join(dirname(stateFile), 'objects'));
    const { p } = await account(db, 'restart-fixture');
    const runs = new RunService(db), content = new ContentService(db, objects);
    const run = await runs.create(p, input, 'restart-proof-completed', 'f'.repeat(32));
    await runs.saveNote(p, run.id, 'native restart note', null);
    const chat = await content.createThread(p, 'Native restart');
    await content.addUserMessage(p, chat.id, 'native restart message');
    await new Worker(db, objects, { async generate() { return 'native restart result'; } }, silent).tick();
    const cancelled = await runs.create(p, input, 'restart-proof-cancelled', 'f'.repeat(32));
    await runs.cancel(p, cancelled.id, 'f'.repeat(32));
    await new Worker(db, objects, null, silent).tick();
    const failed = await runs.create(p, input, 'restart-proof-failed', 'f'.repeat(32));
    await new Worker(db, objects, null, silent).tick();
    await mkdir(dirname(stateFile), { recursive: true });
    await writeFile(stateFile, JSON.stringify({ schema, p, run: run.id, chat: chat.id,
      cancelled: cancelled.id, failed: failed.id, started }), { mode: 0o600 });
    console.log(JSON.stringify({ phase, database: 'native-postgresql', recordsSeeded: true }));
  } else {
    assert.notEqual(started, state.started, 'The PostgreSQL server process must actually restart.');
    const runs = new RunService(db);
    const restored = await runs.get(state.p, state.run);
    assert.equal(restored.status, 'completed');
    assert.equal(restored.results[0].content, 'native restart result');
    assert.equal((await db.query('SELECT content FROM notes WHERE run_id=$1', [state.run])).rows[0].content, 'native restart note');
    const objects = new LocalObjects(join(dirname(stateFile), 'objects'));
    assert.equal((await new ContentService(db, objects).thread(state.p, state.chat)).messages[0].content, 'native restart message');
    assert.equal((await runs.get(state.p, state.cancelled)).status, 'cancelled');
    assert.equal((await runs.get(state.p, state.failed)).status, 'failed');
    assert.equal((await db.query('SELECT id FROM users WHERE id=$1', [state.p.userId])).rowCount, 1);
    console.log(JSON.stringify({ phase, database: 'native-postgresql', postgresRestartObserved: true,
      userRestored: true, completedResultRestored: true, noteRestored: true,
      chatRestored: true, cancelledRunRestored: true, failedRunRestored: true }));
  }
  completed = true;
} catch (error) {
  console.error('Native restart proof failed:', error?.code || error?.name || 'RESTART_PROOF_FAILED');
  process.exitCode = 1;
} finally {
  if (db) await db.close();
  if (schema && /^fr_restart_[a-f0-9]{32}$/.test(schema) && (phase === 'verify' || !completed)) {
    try { await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); }
    catch (error) { console.error('Restart fixture cleanup failed:', error?.code || 'CLEANUP_FAILED'); process.exitCode = 1; }
  }
  await admin.close();
}
