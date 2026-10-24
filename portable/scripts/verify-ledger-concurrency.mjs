// Trusted service fixture only. Never executes submitted code or calls a provider.
// Invoked by run_native.py against an explicitly disposable native PostgreSQL DB.
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Postgres} from '../dist/src/db.js';
import {migrate} from '../dist/src/migrate.js';
import {RunService} from '../dist/src/runs.js';
import {QuotaService} from '../dist/src/quota.js';
import {scope} from '../dist/src/common.js';
import {account, input} from '../dist/tests/support.js';

if (process.env.FR_DISPOSABLE_NATIVE_DB !== 'true' || !process.env.TEST_DATABASE_URL) {
  console.error('BLOCKED: ledger proof requires TEST_DATABASE_URL and FR_DISPOSABLE_NATIVE_DB=true.');
  process.exit(2);
}
const childMode = process.argv[2] === '--child';
const filename = fileURLToPath(import.meta.url);
const schemaPattern = /^fr_ledger_[a-f0-9]{32}$/;
const children = new Set();
let proofStage = 'preflight';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const send = value => new Promise((resolve, reject) => process.send(value, error => error ? reject(error) : resolve()));

async function child() {
  const schema = process.env.FR_LEDGER_SCHEMA;
  assert.match(schema ?? '', schemaPattern);
  const db = new Postgres({connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=${schema}`, max: 1});
  let waiting;
  const start = new Promise(resolve => { waiting = resolve; });
  process.on('message', message => { if (message?.type === 'start') waiting(message); });
  try {
    const backendPid = (await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await send({type: 'ready', pid: process.pid, backendPid});
    const {phase, principal, key, runId} = await start;
    if (phase === 'create') {
      try {
        const result = await new RunService(db).create(principal, input, key, 'f'.repeat(32));
        await send({type: 'result', accepted: true, runId: result.id, replayed: result.replayed});
      } catch (error) {
        if (error?.code !== 'QUOTA_EXHAUSTED') throw error;
        await send({type: 'result', accepted: false, code: error.code});
      }
    } else if (phase === 'settle') {
      const changed = await db.transaction(async tx => {
        await scope(tx, principal);
        return new QuotaService(tx).finalize(tx, runId, 'settled');
      });
      await send({type: 'result', changed, runId});
    } else if (phase === 'crash') {
      await db.transaction(async tx => {
        const result = await new RunService(tx).create(principal, input, key, 'f'.repeat(32));
        const counts = await transactionCounts(tx, principal);
        await send({type: 'uncommitted', runId: result.id, counts});
        // The parent kills this owned process after observing these uncommitted writes.
        await new Promise(() => {});
      });
    } else throw new Error('Unknown ledger-proof phase');
  } finally { await db.close(); }
}

function launch(schema) {
  const processHandle = fork(filename, ['--child'], {
    env: {...process.env, FR_LEDGER_SCHEMA: schema},
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  children.add(processHandle);
  let readyResolve, readyReject, resultResolve, resultReject, exitResolve;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const result = new Promise((resolve, reject) => { resultResolve = resolve; resultReject = reject; });
  // A process can fail before its caller begins awaiting the result.
  result.catch(() => {});
  const exited = new Promise(resolve => { exitResolve = resolve; });
  const timer = setTimeout(() => {
    readyReject(new Error('Ledger child readiness timed out'));
    resultReject(new Error('Ledger child phase timed out'));
    processHandle.kill('SIGKILL');
  }, 30000);
  processHandle.on('message', message => {
    if (message?.type === 'ready') readyResolve(message);
    if (message?.type === 'result' || message?.type === 'uncommitted') resultResolve(message);
    if (message?.type === 'failed') {
      readyReject(new Error(`Ledger child failed: ${message.code}`));
      resultReject(new Error(`Ledger child failed: ${message.code}`));
    }
  });
  processHandle.on('error', error => { readyReject(error); resultReject(error); });
  processHandle.on('exit', (code, signal) => {
    clearTimeout(timer); children.delete(processHandle); exitResolve({code, signal});
    if (code !== 0 || signal) {
      readyReject(new Error('Ledger child exited before readiness'));
      resultReject(new Error('Ledger child exited before result'));
    }
  });
  return {processHandle, ready, result, exited};
}

async function simultaneous(schema, requests) {
  const group = requests.map(() => launch(schema));
  const ready = await Promise.all(group.map(worker => worker.ready));
  assert.equal(new Set(ready.map(value => value.pid)).size, group.length);
  assert.equal(new Set(ready.map(value => value.backendPid)).size, group.length);
  group.forEach((worker, index) => worker.processHandle.send({type: 'start', ...requests[index]}));
  const results = await Promise.all(group.map(worker => worker.result));
  const exits = await Promise.all(group.map(worker => worker.exited));
  assert.ok(exits.every(exit => exit.code === 0 && exit.signal === null));
  return {ready, results};
}

async function transactionCounts(db, p) {
  const row = (await db.query(`SELECT
    (SELECT count(*)::int FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2) AS runs,
    (SELECT count(*)::int FROM reservations WHERE workspace_id=$1 AND owner_id=$2) AS reservations,
    (SELECT count(*)::int FROM jobs WHERE payload->>'runId' IN
      (SELECT id::text FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2)) AS jobs,
    (SELECT count(*)::int FROM allowance_ledger l JOIN allowance_accounts a ON a.id=l.account_id
      WHERE a.workspace_id=$1 AND a.owner_id=$2) AS ledger,
    (SELECT reserved FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 AND period_key='starter') AS reserved,
    (SELECT consumed FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 AND period_key='starter') AS consumed`,
  [p.workspaceId, p.userId])).rows[0];
  return row;
}

async function main() {
  const admin = new Postgres({connectionString: process.env.TEST_DATABASE_URL, max: 1});
  const schema = `fr_ledger_${randomUUID().replaceAll('-', '')}`;
  let db;
  try {
    const version = String((await admin.query('SELECT version() AS version')).rows[0].version);
    assert.match(version, /^PostgreSQL /, 'Native PostgreSQL is required');
    assert.ok(!/PGlite|WASM/i.test(version), 'Fixture engines are not native verification');
    proofStage = 'schema-and-migrations';
    await admin.query(`CREATE SCHEMA ${schema}`);
    db = new Postgres({connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}`, max: 2});
    await migrate(db);
    const {p} = await account(db, 'native-ledger-race-fixture');
    proofStage = 'concurrent-reservation';
    const creations = await simultaneous(schema, Array.from({length: 12}, (_, index) => ({
      phase: 'create', principal: p, key: `native-ledger-create-${index}`,
    })));
    const accepted = creations.results.filter(value => value.accepted);
    assert.equal(accepted.length, 5, 'Five starter credits admit exactly five requests');
    assert.equal(creations.results.filter(value => value.code === 'QUOTA_EXHAUSTED').length, 7);
    assert.equal(new Set(accepted.map(value => value.runId)).size, 5);
    assert.ok(accepted.every(value => value.replayed === false));
    assert.deepEqual(await transactionCounts(db, p), {runs: 5, reservations: 5, jobs: 5, ledger: 6, reserved: 5, consumed: 0});
    proofStage = 'concurrent-idempotency-replay';
    const firstAcceptedIndex = creations.results.findIndex(value => value.accepted);
    const replays = await simultaneous(schema, Array.from({length: 6}, () => ({
      phase: 'create', principal: p, key: `native-ledger-create-${firstAcceptedIndex}`,
    })));
    assert.ok(replays.results.every(value => value.accepted && value.replayed && value.runId === accepted[0].runId));
    assert.deepEqual(await transactionCounts(db, p), {runs: 5, reservations: 5, jobs: 5, ledger: 6, reserved: 5, consumed: 0});
    proofStage = 'duplicate-settlement';
    const settlements = await simultaneous(schema, accepted.flatMap(value => [0, 1].map(() => ({
      phase: 'settle', principal: p, runId: value.runId,
    }))));
    assert.equal(settlements.results.filter(value => value.changed).length, 5);
    assert.equal(settlements.results.filter(value => !value.changed).length, 5);
    assert.deepEqual(await transactionCounts(db, p), {runs: 5, reservations: 5, jobs: 5, ledger: 11, reserved: 0, consumed: 5});
    const reconciled = (await db.query(`SELECT a.granted,a.reserved,a.consumed,
      sum(l.granted_delta)::int AS ledger_granted,sum(l.reserved_delta)::int AS ledger_reserved,
      sum(l.consumed_delta)::int AS ledger_consumed FROM allowance_accounts a
      JOIN allowance_ledger l ON l.account_id=a.id WHERE a.workspace_id=$1 AND a.owner_id=$2
      GROUP BY a.id`, [p.workspaceId, p.userId])).rows[0];
    assert.deepEqual(reconciled, {granted: 5, reserved: 0, consumed: 5, ledger_granted: 5, ledger_reserved: 0, ledger_consumed: 5});
    assert.equal((await db.query("SELECT count(*)::int AS n FROM reservations WHERE workspace_id=$1 AND status='settled'", [p.workspaceId])).rows[0].n, 5);

    proofStage = 'killed-transaction';
    const crashAccount = (await account(db, 'native-ledger-crash-fixture')).p;
    const before = await transactionCounts(db, crashAccount);
    const crash = launch(schema), crashReady = await crash.ready;
    crash.processHandle.send({type: 'start', phase: 'crash', principal: crashAccount, key: 'native-ledger-crash-rollback'});
    const uncommitted = await crash.result;
    assert.equal(uncommitted.type, 'uncommitted');
    assert.deepEqual(uncommitted.counts, {runs: 1, reservations: 1, jobs: 1, ledger: 2, reserved: 1, consumed: 0});
    assert.deepEqual(await transactionCounts(db, crashAccount), before, 'Uncommitted rows cannot be observed from another process');
    crash.processHandle.kill('SIGKILL');
    assert.equal((await crash.exited).signal, 'SIGKILL');
    for (let attempt = 0; attempt < 40; attempt++) {
      if (!(await admin.query('SELECT pid FROM pg_stat_activity WHERE pid=$1', [crashReady.backendPid])).rowCount) break;
      await pause(100);
    }
    assert.equal((await admin.query('SELECT pid FROM pg_stat_activity WHERE pid=$1', [crashReady.backendPid])).rowCount, 0);
    assert.deepEqual(await transactionCounts(db, crashAccount), before, 'Killed transaction leaves no run, reservation, dispatch job or ledger delta');
    const retry = await new RunService(db).create(crashAccount, input, 'native-ledger-crash-rollback', 'f'.repeat(32));
    assert.equal(retry.replayed, false, 'The rolled-back key is not a committed request');
    assert.deepEqual(await transactionCounts(db, crashAccount), {runs: 1, reservations: 1, jobs: 1, ledger: 2, reserved: 1, consumed: 0});
    console.log(JSON.stringify({database: 'native-postgresql', fixture: 'trusted-service-no-provider',
      independentCreateProcesses: creations.ready.length, distinctCreateBackendPids: creations.ready.map(value => value.backendPid),
      createProcessPids: creations.ready.map(value => value.pid), admitted: 5, quotaDenied: 7,
      independentReplayProcesses: replays.ready.length, replayedWithoutAdditionalReservation: true,
      independentSettlementProcesses: settlements.ready.length, settlementsApplied: 5, duplicateSettlementsIgnored: 5,
      ledgerMatchesBalance: true, reservedAfterSettlement: 0, consumedAfterSettlement: 5,
      killedProcessPid: crashReady.pid, uncommittedWritesObservedInsideTransaction: true,
      uncommittedWritesInvisibleOutside: true, killedTransactionRolledBack: true,
      rolledBackRequestKeyReusable: true}));
  } finally {
    for (const processHandle of children) processHandle.kill('SIGKILL');
    if (db) await db.close();
    try { await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); }
    finally { await admin.close(); }
  }
}

try {
  if (childMode) {
    await child();
    process.disconnect();
  } else await main();
} catch (error) {
  // Do not emit driver details, environment variables, principal data or connection URLs.
  const code = error?.code || error?.name || 'LEDGER_PROOF_FAILED';
  if (childMode && process.connected) {
    await send({type: 'failed', code});
    process.disconnect();
  } else console.error('Native ledger concurrency proof failed:', proofStage, code);
  process.exitCode = 1;
}
