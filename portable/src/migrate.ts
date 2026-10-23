import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Db } from './db.js';

export async function migrate(db: Db, directory = fileURLToPath(new URL('../../migrations/', import.meta.url))) {
  const names = (await readdir(directory)).filter(n => /^\d{3}_[a-z0-9_]+\.sql$/.test(n)).sort();
  await db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(20261022,1)');
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = await tx.query<{name:string; sha256:string}>('SELECT name,sha256 FROM schema_migrations');
    for (const prior of applied.rows) if (!names.includes(prior.name)) throw new Error('Applied migration missing from source');
    for (const name of names) {
      const sql = await readFile(`${directory}/${name}`, 'utf8');
      const digest = createHash('sha256').update(sql).digest('hex');
      const prior = applied.rows.find(x => x.name === name);
      if (prior && prior.sha256 !== digest) throw new Error(`Migration checksum changed: ${name}`);
      if (prior) continue;
      await tx.query(sql);
      await tx.query('INSERT INTO schema_migrations(name,sha256) VALUES($1,$2)', [name,digest]);
    }
  });
  return names.length;
}
