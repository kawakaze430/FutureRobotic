import { Pool, type PoolConfig, type PoolClient } from 'pg';
export type Row = Record<string, any>;
export interface QueryResult<T extends Row = Row> { rows: T[]; rowCount: number }
export interface Db {
  query<T extends Row = Row>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
  transaction<T>(work: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export class Postgres implements Db {
  private pool: Pool;
  constructor(config: PoolConfig) {
    this.pool = new Pool({ max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ...config });
    // A disconnected idle socket must not crash the process or print its connection string.
    this.pool.on('error', () => {});
  }
  async query<T extends Row = Row>(sql: string, values: unknown[] = []): Promise<QueryResult<T>> {
    const r = await this.pool.query<T>(sql, values); return { rows: r.rows, rowCount: r.rowCount ?? 0 };
  }
  async transaction<T>(work: (db: Db) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const db = clientDb(client);
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL statement_timeout='10s'");
      await client.query("SET LOCAL lock_timeout='5s'");
      const value = await work(db); await client.query('COMMIT'); return value;
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}
function clientDb(client: PoolClient): Db {
  return {
    async query<T extends Row = Row>(sql: string, values: unknown[] = []) {
      const r = await client.query<T>(sql, values); return { rows: r.rows, rowCount: r.rowCount ?? 0 };
    },
    async transaction<T>(work: (db: Db) => Promise<T>) { return work(this); },
    async close() {},
  };
}
