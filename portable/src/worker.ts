import type { Db } from './db.js';
import { AppError, audit, fail, id, type Principal } from './common.js';
import { ContentService, type ObjectStore } from './content.js';
import { JobQueue, type Job } from './jobs.js';
import { LifecycleService } from './lifecycle.js';
import { QuotaService } from './quota.js';
import { Telemetry } from './telemetry.js';
import {SpendService} from './protection.js';
import {extractQuarantine} from './cloud-files.js';
export interface ProviderRequest {runId:string; traceId:string; idempotencyKey:string;modelId?:string; messages:{role:'system'|'user'|'assistant'; content:string}[]; tools:never[]; signal:AbortSignal;onDelta?:(delta:string)=>Promise<void>}
export interface Provider { generate(request:ProviderRequest):Promise<string>;estimateMicroUsd?:(request:ProviderRequest)=>number }
export class ProviderFailure extends Error {
  constructor(public outcome:'not_sent'|'rejected'|'unknown') {super('PROVIDER_FAILURE');}
}
export class Worker {
  private queue:JobQueue; private quota:QuotaService; private lifecycle:LifecycleService;
  constructor(private db:Db,private objects:ObjectStore,private provider:Provider|null,private telemetry=new Telemetry(),private timeoutMs=30000) {
    this.queue=new JobQueue(db);this.quota=new QuotaService(db);this.lifecycle=new LifecycleService(db);
  }
  async tick() {
    const job=await this.queue.claim();if(!job) return false;
    this.telemetry.emit({event:'job.started',jobId:job.id,traceId:job.trace_id});
    try {
      switch(job.kind) {
        case 'dispatch':await this.dispatch(job);break;
        case 'cleanup':await this.lifecycle.cleanup();break;
        case 'reconcile':await this.lifecycle.reconcile();break;
        case 'delete_history':await this.lifecycle.deleteHistory(job.payload.userId,job.payload.workspaceId,job.payload.runIds);break;
        case 'history_export':await this.lifecycle.historyExport(job.payload.userId,job.payload.workspaceId,job.payload.runIds,job.id);break;
        case 'export':await this.lifecycle.buildExport(job.payload.userId,job.payload.workspaceId,job.id);break;
        case 'delete_account':await this.lifecycle.deleteAccount(job.payload.userId,job.payload.workspaceId);break;
        case 'delete_object':await this.objects.delete(job.payload.objectKey);break;
        case 'extract_text':await extractQuarantine(this.db,this.objects,job.payload.fileId);break;
      }
      await this.queue.complete(job);this.telemetry.emit({event:'job.completed',jobId:job.id,traceId:job.trace_id});
    } catch(e) {
      const code=e instanceof AppError?e.code:'JOB_FAILED';
      await this.queue.reject(job,code);this.telemetry.emit({event:'job.failed',jobId:job.id,traceId:job.trace_id,errorCode:code});
    }
    return true;
  }
  private async dispatch(job:Job) {
    const claim=await this.db.transaction(async tx=>{
      const r=await tx.query('SELECT * FROM tool_runs WHERE id=$1 FOR UPDATE',[job.payload.runId]);
      const run=r.rows[0];if(!run) return null;
      if(['dispatching','running','cancel_requested'].includes(run.status)) {
        // A worker died after fencing dispatch. Remote acceptance is unknown.
        await tx.query('UPDATE tool_runs SET status=\'uncertain\',error_code=\'DISPATCH_OUTCOME_UNKNOWN\',updated_at=now() WHERE id=$1',[run.id]);return null;
      }
      if(run.status!=='queued') return null;
      const user=await tx.query('SELECT status FROM users WHERE id=$1',[run.owner_id]);
      if(user.rows[0]?.status!=='active') {
        await tx.query('UPDATE tool_runs SET status=\'cancelled\' WHERE id=$1',[run.id]);await this.quota.finalize(tx,run.id,'released');return null;
      }
      if(!this.provider) {
        await tx.query('UPDATE tool_runs SET status=\'failed\',error_code=\'PROVIDER_NOT_CONFIGURED\' WHERE id=$1',[run.id]);await this.quota.finalize(tx,run.id,'released');return null;
      }
      // Fence BEFORE the network call; restart cannot make another blind provider request.
      await tx.query('UPDATE tool_runs SET status=\'dispatching\',updated_at=now() WHERE id=$1',[run.id]);return run;
    });
    if(!claim) return;
    const p:Principal={userId:claim.owner_id,workspaceId:claim.workspace_id,sessionId:''};
    let lease:string|undefined;
    try {lease=await this.quota.acquire(p,'provider',20,2,job.trace_id);}
    catch(e) {
      // No network call was made, so a retry is safe.
      await this.db.query('UPDATE tool_runs SET status=\'queued\',updated_at=now() WHERE id=$1 AND status=\'dispatching\'',[claim.id]);throw e;
    }
    const controller=new AbortController();let heartbeatLost=false;
    const heartbeat=setInterval(()=>{
      void Promise.all([this.queue.heartbeat(job),this.quota.renewLease(lease!)]).then(([held])=>{
        if(!held) {heartbeatLost=true;controller.abort();}
      }).catch(()=>{heartbeatLost=true;controller.abort();});
    },30000);heartbeat.unref();
    let timer:ReturnType<typeof setTimeout>|undefined,partial='';let sent=false;
    try {
      const context=await new ContentService(this.db,this.objects).context(p,claim.id);
      const request:ProviderRequest={runId:claim.id,traceId:job.trace_id,idempotencyKey:claim.id,modelId:claim.model,messages:context.messages,tools:context.tools,signal:controller.signal,onDelta:async delta=>{
        partial+=delta;if(partial.length>200000)throw new ProviderFailure('unknown');
        await this.db.transaction(async tx=>{
          const current=await tx.query('SELECT status FROM tool_runs WHERE id=$1 FOR UPDATE',[claim.id]);
          if(!['dispatching','cancel_requested'].includes(current.rows[0]?.status))throw new ProviderFailure('unknown');
          if(current.rows[0].status==='cancel_requested'){controller.abort();throw new ProviderFailure('unknown');}
          await tx.query('INSERT INTO run_events(run_id,event_type,data) VALUES($1,\'delta\',$2)',[claim.id,JSON.stringify({delta})]);
          if(claim.chat_thread_id)await tx.query('INSERT INTO chat_messages(id,thread_id,workspace_id,owner_id,role,content,run_id,state,operation_key) VALUES($1,$2,$3,$4,\'assistant\',$5,$6,\'streaming\',$7) ON CONFLICT(id) DO UPDATE SET content=excluded.content',[claim.id,claim.chat_thread_id,p.workspaceId,p.userId,partial,claim.id,`assistant:${claim.id}`]);
        });
      }};
      if(this.provider!.estimateMicroUsd)await new SpendService(this.db).reserve(claim.id,this.provider!.estimateMicroUsd(request));
      this.telemetry.emit({event:'provider.started',jobId:job.id,runId:claim.id,traceId:job.trace_id});
      const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new ProviderFailure('unknown'));},this.timeoutMs);});
      sent=true;const result=await Promise.race([this.provider!.generate(request),deadline]);
      if(heartbeatLost) throw new ProviderFailure('unknown');
      if(typeof result!=='string'||result.length>200000) throw new ProviderFailure('unknown');
      await this.db.transaction(async tx=>{
        const held=await tx.query('SELECT id FROM jobs WHERE id=$1 AND lease_token=$2 AND status=\'running\' AND lease_until>now() FOR UPDATE',[job.id,job.lease_token]);
        if(!held.rowCount) fail('JOB_LEASE_LOST',409);
        const current=await tx.query('SELECT status FROM tool_runs WHERE id=$1 FOR UPDATE',[claim.id]);
        if(!['dispatching','cancel_requested'].includes(current.rows[0]?.status)) return;
        await tx.query('INSERT INTO result_versions(id,run_id,workspace_id,owner_id,version,content) VALUES($1,$2,$3,$4,1,$5) ON CONFLICT(run_id,version) DO NOTHING',[id(),claim.id,p.workspaceId,p.userId,result]);
        await tx.query('UPDATE tool_runs SET status=$2,updated_at=now() WHERE id=$1',[claim.id,current.rows[0].status==='cancel_requested'?'cancelled':'completed']);
        const cancelled=current.rows[0].status==='cancel_requested';
        await this.quota.finalize(tx,claim.id,'settled');await audit(tx,p,'run.completed',claim.id,job.trace_id);
        await new SpendService(tx).finalize(tx,claim.id,true);
        if(claim.chat_thread_id)await tx.query('INSERT INTO chat_messages(id,thread_id,workspace_id,owner_id,role,content,run_id,state,operation_key) VALUES($1,$2,$3,$4,\'assistant\',$5,$6,\'complete\',$7) ON CONFLICT(id) DO UPDATE SET content=excluded.content,state=excluded.state',[claim.id,claim.chat_thread_id,p.workspaceId,p.userId,result,claim.id,`assistant:${claim.id}`]);
        if(cancelled&&claim.chat_thread_id)await tx.query('UPDATE chat_messages SET state=\'partial\' WHERE run_id=$1 AND role=\'assistant\'',[claim.id]);
        await tx.query('INSERT INTO run_events(run_id,event_type,data) VALUES($1,\'done\',$2)',[claim.id,JSON.stringify({status:cancelled?'cancelled':'completed',output:result})]);
        await tx.query('INSERT INTO evaluation_candidates(run_id,owner_id) SELECT id,owner_id FROM tool_runs WHERE id=$1 AND evaluation_allowed=true ON CONFLICT DO NOTHING',[claim.id]);
      });
      this.telemetry.emit({event:'provider.completed',jobId:job.id,runId:claim.id,traceId:job.trace_id});
    } catch(e) {
      const safe=!sent||e instanceof ProviderFailure&&['not_sent','rejected'].includes(e.outcome);
      await this.db.transaction(async tx=>{
        const run=await tx.query('SELECT status FROM tool_runs WHERE id=$1 FOR UPDATE',[claim.id]);
        if(!['dispatching','cancel_requested'].includes(run.rows[0]?.status)) return;
        const accepted=!!partial,status=accepted?(run.rows[0].status==='cancel_requested'?'cancelled':'failed'):safe?'failed':'uncertain';
        await tx.query('UPDATE tool_runs SET status=$2,error_code=$3,updated_at=now() WHERE id=$1',[claim.id,status,accepted?'PROVIDER_REPLY_PARTIAL':safe?'PROVIDER_REJECTED':'DISPATCH_OUTCOME_UNKNOWN']);
        if(safe||accepted){await this.quota.finalize(tx,claim.id,accepted?'settled':'released');await new SpendService(tx).finalize(tx,claim.id,accepted);}
        if(accepted){
          await tx.query('INSERT INTO result_versions(id,run_id,workspace_id,owner_id,version,content) VALUES($1,$2,$3,$4,1,$5) ON CONFLICT DO NOTHING',[id(),claim.id,p.workspaceId,p.userId,partial]);
          if(claim.chat_thread_id)await tx.query('UPDATE chat_messages SET state=\'partial\',content=$2 WHERE id=$1',[claim.id,partial]);
        }

        await tx.query('INSERT INTO run_events(run_id,event_type,data) VALUES($1,\'done\',$2)',[claim.id,JSON.stringify({status,output:partial,partial:accepted})]);
      });
      this.telemetry.emit({event:'provider.failed',jobId:job.id,runId:claim.id,traceId:job.trace_id,errorCode:safe?'PROVIDER_REJECTED':'DISPATCH_OUTCOME_UNKNOWN'});
    } finally {if(timer)clearTimeout(timer);clearInterval(heartbeat);if(lease)await this.quota.releaseLease(lease);}
  }
}
