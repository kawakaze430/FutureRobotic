import type { Db } from './db.js';
import { id, iso } from './common.js';
export type JobKind='dispatch'|'cleanup'|'reconcile'|'export'|'delete_account'|'delete_object'|'extract_text'|'delete_history'|'history_export'|'support_ack';
export interface Job {id:string; kind:JobKind; payload:Record<string,any>; trace_id:string; lease_token:string; attempts:number; max_attempts:number}
export async function enqueue(tx:Db,kind:JobKind,key:string,payload:Record<string,unknown>,trace:string,availableAt=iso(Date.now())) {
  const jobId=id();
  const r=await tx.query('INSERT INTO jobs(id,kind,dedupe_key,payload,trace_id,available_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(dedupe_key) DO NOTHING RETURNING id',[jobId,kind,key,JSON.stringify(payload),trace,availableAt]);
  if(r.rowCount) return jobId;
  return (await tx.query('SELECT id FROM jobs WHERE dedupe_key=$1',[key])).rows[0].id as string;
}
export class JobQueue {
  constructor(private db:Db) {}
  async claim():Promise<Job|null> {
    return this.db.transaction(async tx=>{
      // A crashed job may be reclaimed; dispatch handler separately fences provider attempts.
      const r=await tx.query('SELECT * FROM jobs WHERE (status=\'queued\' AND available_at<=now()) OR (status=\'running\' AND lease_until<=now()) ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1');
      if(!r.rowCount) return null;
      const j=r.rows[0];
      if(j.attempts>=j.max_attempts) {await tx.query('UPDATE jobs SET status=\'dead\',last_error=\'ATTEMPTS_EXHAUSTED\',lease_token=NULL,lease_until=NULL WHERE id=$1',[j.id]);return null;}
      const lease=id();
      await tx.query('UPDATE jobs SET status=\'running\',attempts=attempts+1,lease_token=$2,lease_until=$3 WHERE id=$1',[j.id,lease,iso(Date.now()+120000)]);
      return {...j,lease_token:lease,attempts:j.attempts+1} as Job;
    });
  }
  async heartbeat(j:Job) {
    return !!(await this.db.query('UPDATE jobs SET lease_until=$3 WHERE id=$1 AND lease_token=$2 AND status=\'running\' AND lease_until>now()',[j.id,j.lease_token,iso(Date.now()+120000)])).rowCount;
  }
  async complete(j:Job) {
    return !!(await this.db.query('UPDATE jobs SET status=\'completed\',completed_at=now(),lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2 AND status=\'running\'',[j.id,j.lease_token])).rowCount;
  }
  async reject(j:Job,errorCode:string) {
    const safe=/^[A-Z0-9_]{1,80}$/.test(errorCode)?errorCode:'JOB_FAILED';
    await this.db.query('UPDATE jobs SET status=CASE WHEN attempts>=max_attempts THEN \'dead\' ELSE \'queued\' END,available_at=$3,last_error=$4,lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2 AND status=\'running\'',[j.id,j.lease_token,iso(Date.now()+Math.min(3600000,1000*2**j.attempts)),safe]);
  }
}
