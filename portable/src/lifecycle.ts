import type { Db } from './db.js';
import { audit, fail, id, iso, lock, scope, type Principal } from './common.js';
import { enqueue } from './jobs.js';
import {AccountService} from './account-services.js';
import { QuotaService } from './quota.js';
export class LifecycleService {
  constructor(private db:Db) {}
  async requestExport(p:Principal,key:string,trace:string) {
    if(!/^[a-zA-Z0-9_-]{8,100}$/.test(key)) fail('INVALID_IDEMPOTENCY_KEY');
    return this.db.transaction(async tx=>{
      await scope(tx,p);return {jobId:await enqueue(tx,'export',`export:${p.userId}:${key}`,{userId:p.userId,workspaceId:p.workspaceId},trace)};
    });
  }
  async historyJob(p:Principal,kind:'delete_history'|'history_export',runIds:string[],key:string,trace:string){
    if(!/^[a-zA-Z0-9_-]{8,100}$/.test(key)||!Array.isArray(runIds)||runIds.length<1||runIds.length>200||new Set(runIds).size!==runIds.length)fail('INVALID_HISTORY_JOB');
    const sorted=[...runIds].sort();
    return this.db.transaction(async tx=>{
      await scope(tx,p);
      const rows=await tx.query('SELECT id,status FROM tool_runs WHERE id=ANY($1::uuid[]) AND workspace_id=$2 AND owner_id=$3 ORDER BY id FOR UPDATE',[sorted,p.workspaceId,p.userId]);
      if(rows.rowCount!==sorted.length)fail('NOT_FOUND',404);
      if(rows.rows.some(r=>!['completed','failed','cancelled','uncertain'].includes(r.status)))fail('RUN_NOT_TERMINAL',409);
      const dedupe=`${kind}:${p.userId}:${key}`;await lock(tx,`history-job:${dedupe}`);
      const previous=await tx.query('SELECT id,payload FROM jobs WHERE dedupe_key=$1',[dedupe]);
      if(previous.rowCount){if(JSON.stringify(previous.rows[0].payload.runIds)!==JSON.stringify(sorted))fail('IDEMPOTENCY_CONFLICT',409);return {jobId:previous.rows[0].id};}
      return {jobId:await enqueue(tx,kind,dedupe,{userId:p.userId,workspaceId:p.workspaceId,runIds:sorted},trace)};
    });
  }
  async job(p:Principal,jobId:string){
    await scope(this.db,p);const row=(await this.db.query("SELECT id,kind,status,last_error,created_at,completed_at FROM jobs WHERE id=$1 AND payload->>'userId'=$2 AND payload->>'workspaceId'=$3 AND kind IN('export','delete_history','history_export')",[jobId,p.userId,p.workspaceId])).rows[0];
    if(!row)fail('NOT_FOUND',404);return row;
  }
  async deleteHistory(userId:string,workspaceId:string,runIds:string[]){
    for(const runId of runIds)await new AccountService(this.db).deleteHistory({userId,workspaceId,sessionId:''},runId);
  }
  async historyExport(userId:string,workspaceId:string,runIds:string[],exportId:string){
    return this.db.transaction(async tx=>{
      const p={userId,workspaceId,sessionId:''};await scope(tx,p);
      if((await tx.query('SELECT id FROM account_exports WHERE id=$1',[exportId])).rowCount)return;
      const runs=(await tx.query("SELECT id,tool,source,instructions,language,target_language,status,created_at FROM tool_runs WHERE id=ANY($1::uuid[]) AND workspace_id=$2 AND owner_id=$3 AND history_mode='cloud' AND history_deleted_at IS NULL ORDER BY created_at,id",[runIds,workspaceId,userId])).rows;
      const ids=runs.map(r=>r.id),results=(await tx.query('SELECT run_id,version,content,origin,created_at FROM result_versions WHERE run_id=ANY($1::uuid[]) AND workspace_id=$2 AND owner_id=$3 ORDER BY run_id,version',[ids,workspaceId,userId])).rows;
      const notes=(await tx.query('SELECT run_id,content,version FROM notes WHERE run_id=ANY($1::uuid[]) AND workspace_id=$2 AND owner_id=$3',[ids,workspaceId,userId])).rows;
      await tx.query('INSERT INTO account_exports(id,user_id,content,expires_at) VALUES($1,$2,$3,$4)',[exportId,userId,JSON.stringify({schemaVersion:1,scope:'selected_history',runs,results,notes}),iso(Date.now()+86400000)]);
    });
  }
  async getExport(p:Principal,exportId:string) {
    await scope(this.db,p);
    const r=await this.db.query('SELECT id,content,expires_at FROM account_exports WHERE id=$1 AND user_id=$2 AND expires_at>now()',[exportId,p.userId]);
    if(!r.rowCount) fail('NOT_FOUND',404);return r.rows[0];
  }
  async requestDeletion(p:Principal,trace:string) {
    return this.db.transaction(async tx=>{
      await scope(tx,p);
      await lock(tx,`billing-lifecycle:${p.workspaceId}`);
      const pending=await tx.query("SELECT id FROM checkout_intents WHERE workspace_id=$1 AND owner_id=$2 AND state IN('creating','ready','uncertain') LIMIT 1",[p.workspaceId,p.userId]);if(pending.rowCount)fail('CHECKOUT_RESOLUTION_REQUIRED',409);
      const paid=await tx.query("SELECT id FROM subscriptions WHERE workspace_id=$1 AND owner_id=$2 AND status IN('active','trialing','past_due') AND period_end>now() LIMIT 1",[p.workspaceId,p.userId]);
      if(paid.rowCount)fail('SUBSCRIPTION_ACTION_REQUIRED',409);
      await tx.query('UPDATE users SET status=\'deleting\' WHERE id=$1',[p.userId]);
      await tx.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1',[p.userId]);
      await audit(tx,p,'account.deletion_requested',p.userId,trace);
      return {jobId:await enqueue(tx,'delete_account',`delete-account:${p.userId}`,{userId:p.userId,workspaceId:p.workspaceId},trace)};
    });
  }
  async buildExport(userId:string,workspaceId:string,exportId:string) {
    return this.db.transaction(async tx=>{
      const p={userId,workspaceId,sessionId:''};await scope(tx,p);
      if((await tx.query('SELECT id FROM account_exports WHERE id=$1',[exportId])).rowCount) return;
      const user=await tx.query('SELECT id,email,display_name,preferences,created_at FROM users WHERE id=$1',[userId]);
      const content:Record<string,unknown>={schemaVersion:1,user:user.rows[0]};
      const selects:Record<string,string>={
        runs:'SELECT id,tool,source,instructions,status,created_at FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2',
        results:'SELECT run_id,version,content,created_at FROM result_versions WHERE workspace_id=$1 AND owner_id=$2',
        notes:'SELECT id,run_id,content,version FROM notes WHERE workspace_id=$1 AND owner_id=$2',
        threads:'SELECT id,title,created_at FROM chat_threads WHERE workspace_id=$1 AND owner_id=$2',
        messages:'SELECT thread_id,role,content,created_at FROM chat_messages WHERE workspace_id=$1 AND owner_id=$2',
        files:'SELECT id,name,status,created_at FROM files WHERE workspace_id=$1 AND owner_id=$2',
        fileRevisions:'SELECT file_id,revision,sha256,size_bytes,extracted_text FROM file_revisions WHERE workspace_id=$1 AND owner_id=$2',
        subscriptions:'SELECT plan_id,status,period_start,period_end FROM subscriptions WHERE workspace_id=$1 AND owner_id=$2',
        allowance:'SELECT bucket,period_key,granted,reserved,consumed FROM allowance_accounts WHERE workspace_id=$1 AND owner_id=$2',
      };
      for(const [name,sql] of Object.entries(selects)) content[name]=(await tx.query(sql,[workspaceId,userId])).rows;
      await tx.query('INSERT INTO account_exports(id,user_id,content,expires_at) VALUES($1,$2,$3,$4)',[exportId,userId,JSON.stringify(content),iso(Date.now()+86400000)]);
      await audit(tx,p,'account.export_created',exportId,'export');
    });
  }
  async deleteAccount(userId:string,workspaceId:string) {
    await this.db.transaction(async tx=>{
      const user=await tx.query('SELECT status FROM users WHERE id=$1 FOR UPDATE',[userId]);
      if(!user.rowCount||user.rows[0].status==='deleted') return;
      if(user.rows[0].status!=='deleting') fail('DELETION_NOT_REQUESTED',409);
      const workspace=await tx.query('SELECT id FROM workspaces WHERE id=$1 AND owner_id=$2',[workspaceId,userId]);
      if(!workspace.rowCount) fail('NOT_FOUND',404);
      const runs=await tx.query('SELECT id,status FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2 ORDER BY id FOR UPDATE',[workspaceId,userId]);
      for(const run of runs.rows) {
        if(run.status==='queued') {await new QuotaService(tx).finalize(tx,run.id,'released');await tx.query('UPDATE tool_runs SET status=\'cancelled\' WHERE id=$1',[run.id]);}
        // A sent request must be reconciled, never silently refunded or redispatched.
        if(['dispatching','running','cancel_requested'].includes(run.status)) await tx.query('UPDATE tool_runs SET status=\'uncertain\' WHERE id=$1',[run.id]);
      }
      const revisions=await tx.query('UPDATE file_revisions SET extracted_text=NULL,extraction_status=\'deleted\' WHERE workspace_id=$1 AND owner_id=$2 RETURNING id,object_key',[workspaceId,userId]);
      for(const rev of revisions.rows) await enqueue(tx,'delete_object',`delete-object:${rev.id}`,{objectKey:rev.object_key},'deletion');
      await tx.query('UPDATE files SET status=\'deleted\',name=\'deleted\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE tool_runs SET source=\'\',instructions=\'\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE run_context_files SET content=\'\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('DELETE FROM run_events WHERE run_id IN(SELECT id FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2)',[workspaceId,userId]);
      await tx.query('UPDATE share_snapshots SET result=\'\' WHERE share_id IN(SELECT id FROM shares WHERE workspace_id=$1 AND owner_id=$2)',[workspaceId,userId]);
      await tx.query('DELETE FROM evaluation_candidates WHERE owner_id=$1',[userId]);
      await tx.query('UPDATE support_tickets SET subject=\'deleted\',message=\'\',status=\'closed\' WHERE owner_id=$1',[userId]);
      await tx.query('UPDATE result_versions SET content=\'\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE notes SET content=\'\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE chat_messages SET content=\'\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE chat_threads SET title=\'deleted\' WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('UPDATE shares SET revoked_at=now() WHERE workspace_id=$1 AND owner_id=$2',[workspaceId,userId]);
      await tx.query('DELETE FROM account_exports WHERE user_id=$1',[userId]);
      await tx.query('DELETE FROM identities WHERE user_id=$1',[userId]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1',[userId]);
      await tx.query('UPDATE users SET email=$2,display_name=\'\',preferences=\'{}\',status=\'deleted\' WHERE id=$1',[userId,`deleted+${userId}@invalid.local`]);
      await tx.query('UPDATE workspaces SET name=\'deleted\' WHERE id=$1',[workspaceId]);
      await audit(tx,{userId,workspaceId,sessionId:''},'account.deleted',userId,'deletion');
    });
  }
  async schedule(now=Date.now()) {
    const hour=Math.floor(now/3600000);
    await this.db.transaction(async tx=>{
      await enqueue(tx,'cleanup',`cleanup:${hour}`,{},'scheduler');
      await enqueue(tx,'reconcile',`reconcile:${hour}`,{},'scheduler');
    });
  }
  async cleanup() {
    return this.db.transaction(async tx=>{
      // Preserve immutable accounting/audit metadata; redact expired source content.
      const expired=await tx.query('SELECT id FROM tool_runs WHERE retention_until<=now() AND status IN(\'completed\',\'failed\',\'cancelled\',\'uncertain\') AND history_deleted_at IS NULL FOR UPDATE');
      for(const run of expired.rows) {
        await tx.query('UPDATE tool_runs SET source=\'\',instructions=\'\',history_deleted_at=now() WHERE id=$1',[run.id]);
        await tx.query('UPDATE chat_messages SET content=\'\' WHERE run_id=$1',[run.id]);
        await tx.query('UPDATE share_snapshots SET result=\'\' WHERE share_id IN(SELECT id FROM shares WHERE run_id=$1)',[run.id]);
        await tx.query('UPDATE result_versions SET content=\'\' WHERE run_id=$1',[run.id]);
        await tx.query('UPDATE notes SET content=\'\' WHERE run_id=$1',[run.id]);
        await tx.query('UPDATE run_context_files SET content=\'\' WHERE run_id=$1',[run.id]);
        await tx.query('DELETE FROM run_events WHERE run_id=$1',[run.id]);
        await tx.query('DELETE FROM evaluation_candidates WHERE run_id=$1',[run.id]);
        await tx.query('UPDATE shares SET revoked_at=now() WHERE run_id=$1 AND revoked_at IS NULL',[run.id]);
      }
      const staged=await tx.query('SELECT f.id,r.id AS revision_id,r.object_key FROM files f JOIN file_revisions r ON r.file_id=f.id WHERE f.status=\'staged\' AND f.created_at<now()-interval \'1 hour\' FOR UPDATE OF f');
      for(const file of staged.rows) {
        await tx.query('UPDATE files SET status=\'deleted\' WHERE id=$1',[file.id]);
        await enqueue(tx,'delete_object',`delete-object:${file.revision_id}`,{objectKey:file.object_key},'cleanup');
      }
      await tx.query('DELETE FROM account_exports WHERE expires_at<=now()');
      await tx.query('DELETE FROM sessions WHERE expires_at<=now() OR revoked_at<now()-interval \'7 days\'');
      await tx.query('DELETE FROM rate_windows WHERE window_start<now()-interval \'1 day\'');
      await tx.query('DELETE FROM concurrency_leases WHERE expires_at<=now()');
      await tx.query('UPDATE shares SET revoked_at=now() WHERE expires_at<=now() AND revoked_at IS NULL');
      return {redactedRuns:expired.rowCount,stagedFiles:staged.rowCount};
    });
  }
  async reconcile() {
    return this.db.transaction(async tx=>{
      const expired=await tx.query('SELECT r.id,r.status FROM tool_runs r JOIN reservations a ON a.run_id=r.id WHERE a.status=\'held\' AND a.expires_at<=now() ORDER BY r.id FOR UPDATE OF r');
      for(const run of expired.rows) {
        if(['queued','failed','cancelled'].includes(run.status)) {
          await tx.query('UPDATE tool_runs SET status=\'cancelled\',error_code=\'RESERVATION_EXPIRED\' WHERE id=$1',[run.id]);
          await new QuotaService(tx).finalize(tx,run.id,'released');
        } else if(['running','dispatching','cancel_requested'].includes(run.status)) await tx.query('UPDATE tool_runs SET status=\'uncertain\',error_code=\'DISPATCH_OUTCOME_UNKNOWN\' WHERE id=$1',[run.id]);
      }
      const mismatch=await tx.query('SELECT a.id FROM allowance_accounts a LEFT JOIN (SELECT account_id,sum(granted_delta) AS granted,sum(reserved_delta) AS reserved,sum(consumed_delta) AS consumed FROM allowance_ledger GROUP BY account_id) l ON l.account_id=a.id WHERE a.granted<>coalesce(l.granted,0) OR a.reserved<>coalesce(l.reserved,0) OR a.consumed<>coalesce(l.consumed,0)');
      if(mismatch.rowCount) fail('LEDGER_RECONCILIATION_REQUIRED',503);
      return {expiredReservations:expired.rowCount,ledger:'balanced'};
    });
  }
}
