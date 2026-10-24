import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db.js';
export const id = randomUUID;
export const hash = (value:string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export class AppError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
export function fail(code:string,status=400):never { throw new AppError(code,status); }
export interface Principal { userId: string; workspaceId: string; sessionId: string }
export const iso = (ms:number) => new Date(ms).toISOString();
export async function scope(db: Db, p: Principal) {
  const r = await db.query('SELECT w.id FROM workspaces w JOIN users u ON u.id=w.owner_id WHERE w.id=$1 AND w.owner_id=$2 AND u.status=\'active\'', [p.workspaceId,p.userId]);
  if (!r.rowCount) fail('NOT_FOUND',404);
}
export async function lock(db: Db, key:string) {
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
}
export async function audit(db:Db, p:Principal|null, action:string, resource:string, trace:string, metadata:Record<string,string|number|boolean>={}) {
  await db.query('INSERT INTO audit_events(id,actor_id,workspace_id,action,resource_id,trace_id,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)', [id(),p?.userId??null,p?.workspaceId??null,action,resource,trace,JSON.stringify(metadata)]);
}
export function safeTrace(value?:string) {
  return value && /^[a-f0-9]{32}$/.test(value) && !/^0+$/.test(value) ? value : randomBytes(16).toString('hex');
}
export function pageCursor(value?:string) {
  if (!value) return null;
  try {
    const x=JSON.parse(Buffer.from(value,'base64url').toString());
    if (typeof x.at!=='string'||!Number.isFinite(Date.parse(x.at))||!/^[-a-f0-9]{36}$/.test(x.id)) fail('INVALID_CURSOR');
    return x as {at:string; id:string};
  } catch { return fail('INVALID_CURSOR'); }
}
export function nextCursor(rows:Record<string,any>[],limit:number) {
  const last=rows.length===limit ? rows.at(-1) : null;
  return last ? Buffer.from(JSON.stringify({at:new Date(last.created_at).toISOString(),id:last.id})).toString('base64url') : null;
}
