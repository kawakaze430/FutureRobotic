import type { Db } from './db.js';
import {creditWindow} from './credit-period.js';
import { audit, fail, hash, id, iso, lock, scope, type Principal } from './common.js';

export class QuotaService {
  constructor(private db:Db) {}
  async grantStarter(p:Principal) {
    return this.db.transaction(async tx=>{
      await scope(tx,p);
      const verified=await tx.query('SELECT id FROM identities WHERE user_id=$1 AND verified_email IS NOT NULL LIMIT 1',[p.userId]);
      if(!verified.rowCount) fail('VERIFICATION_REQUIRED',403);
      return this.grant(tx,p,'starter',5,`starter:${p.userId}`);
    });
  }
  async grant(tx:Db,p:Principal,period:string,units:number,businessKey:string) {
    if(!Number.isInteger(units)||units<0||units>100000) fail('INVALID_GRANT');
    await lock(tx,`allowance:${p.workspaceId}:${period}`);
    await tx.query('INSERT INTO allowance_accounts(id,workspace_id,owner_id,bucket,period_key) VALUES($1,$2,$3,\'advanced\',$4) ON CONFLICT(workspace_id,bucket,period_key) DO NOTHING',[id(),p.workspaceId,p.userId,period]);
    const account=(await tx.query('SELECT * FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 AND bucket=\'advanced\' AND period_key=$3 FOR UPDATE',[p.workspaceId,p.userId,period])).rows[0];
    const result=await tx.query('INSERT INTO allowance_ledger(id,account_id,business_key,kind,granted_delta) VALUES($1,$2,$3,\'grant\',$4) ON CONFLICT(business_key) DO NOTHING',[id(),account.id,businessKey,units]);
    if(result.rowCount) await tx.query('UPDATE allowance_accounts SET granted=granted+$2 WHERE id=$1',[account.id,units]);
    return {accountId:account.id as string,granted:!!result.rowCount};
  }
  async monthlyGrant(tx:Db,p:Principal,sub:Record<string,any>,now=Date.now()) {
    const window=creditWindow(sub.period_start,sub.period_end,now);
    if(!window)return null;
    const period=`subscription:${sub.id}:${window.start}`;
    await this.grant(tx,p,period,sub.advanced_credits,`period:${sub.provider}:${sub.provider_id}:${window.start}`);
    return {...window,period};
  }
  async policy(tx:Db,p:Principal) {
    const sub=await tx.query("SELECT s.*,p.context_limit,p.advanced_credits FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.workspace_id=$1 AND s.owner_id=$2 AND s.status IN('active','trialing') AND s.period_start<=now() AND s.period_end>now() ORDER BY s.last_event_at DESC LIMIT 1 FOR UPDATE OF s",[p.workspaceId,p.userId]);
    if(sub.rowCount){const row=sub.rows[0],window=await this.monthlyGrant(tx,p,row);return {period:window!.period,contextLimit:row.context_limit as number,plan:row.plan_id as string,creditStart:window!.start,creditEnd:window!.end};}
    return {period:'starter',contextLimit:25000,plan:'free',creditStart:null,creditEnd:null};
  }
  async reserve(tx:Db,p:Principal,runId:string,period:string,units=1) {
    const r=await tx.query('SELECT * FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 AND bucket=\'advanced\' AND period_key=$3 FOR UPDATE',[p.workspaceId,p.userId,period]);
    const a=r.rows[0]; if(!a||a.granted-a.reserved-a.consumed<units) fail('QUOTA_EXHAUSTED',402);
    await tx.query('INSERT INTO reservations(id,run_id,account_id,workspace_id,owner_id,units,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[id(),runId,a.id,p.workspaceId,p.userId,units,iso(Date.now()+15*60000)]);
    await tx.query('UPDATE allowance_accounts SET reserved=reserved+$2 WHERE id=$1',[a.id,units]);
    await tx.query('INSERT INTO allowance_ledger(id,account_id,business_key,kind,reserved_delta,run_id) VALUES($1,$2,$3,\'reserve\',$4,$5)',[id(),a.id,`reserve:${runId}`,units,runId]);
  }
  async finalize(tx:Db,runId:string,outcome:'settled'|'released') {
    const r=await tx.query('SELECT * FROM reservations WHERE run_id=$1 FOR UPDATE',[runId]);
    if(!r.rowCount || r.rows[0].status!== 'held') return false;
    const a=r.rows[0],spent=outcome==='settled'?a.units:0;
    await tx.query('UPDATE allowance_accounts SET reserved=reserved-$2,consumed=consumed+$3 WHERE id=$1',[a.account_id,a.units,spent]);
    await tx.query('UPDATE reservations SET status=$2 WHERE id=$1',[a.id,outcome]);
    await tx.query('INSERT INTO allowance_ledger(id,account_id,business_key,kind,reserved_delta,consumed_delta,run_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[id(),a.account_id,`${outcome}:${runId}`,outcome==='settled'?'settle':'release',-a.units,spent,runId]);
    return true;
  }
  async balances(p:Principal) {
    return this.db.transaction(async tx=>{await scope(tx,p);await this.policy(tx,p);return (await tx.query('SELECT id,bucket,period_key,granted,reserved,consumed,granted-reserved-consumed AS available FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2 ORDER BY period_key',[p.workspaceId,p.userId])).rows;});
  }
  async acquire(p:Principal,operation:string,limit=20,concurrency=2,trace='limiter') {
    return this.db.transaction(async tx=>{
      await scope(tx,p);
      const subject=hash(p.userId),start=iso(Math.floor(Date.now()/60000)*60000);
      await lock(tx,`limiter:${subject}`);
      await tx.query('DELETE FROM concurrency_leases WHERE subject_hash=$1 AND expires_at<=now()',[subject]);
      const active=await tx.query('SELECT count(*)::int AS count FROM concurrency_leases WHERE subject_hash=$1',[subject]);
      if(active.rows[0].count>=concurrency) fail('CONCURRENCY_LIMIT',429);
      const hits=await tx.query('INSERT INTO rate_windows(subject_hash,operation,window_start,hits) VALUES($1,$2,$3,1) ON CONFLICT(subject_hash,operation,window_start) DO UPDATE SET hits=rate_windows.hits+1 RETURNING hits',[subject,operation,start]);
      if(hits.rows[0].hits>limit) fail('RATE_LIMIT',429);
      const lease=id();
      await tx.query('INSERT INTO concurrency_leases(id,subject_hash,expires_at) VALUES($1,$2,$3)',[lease,subject,iso(Date.now()+120000)]);
      await audit(tx,p,'limiter.acquired',lease,trace,{operation}); return lease;
    });
  }
  async renewLease(lease:string) {
    const r=await this.db.query('UPDATE concurrency_leases SET expires_at=$2 WHERE id=$1 AND expires_at>now()',[lease,iso(Date.now()+120000)]);
    if(!r.rowCount) fail('LEASE_LOST',409);
  }
  async releaseLease(lease:string) { await this.db.query('DELETE FROM concurrency_leases WHERE id=$1',[lease]); }
}
