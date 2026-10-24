import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {migrate} from '../src/migrate.js';
import type {Db} from '../src/db.js';
import {AppError,id,hash} from '../src/common.js';
import {LocalResultService,type LocalResultInput} from '../src/local-results.js';
import {RunService} from '../src/runs.js';
import {LifecycleService} from '../src/lifecycle.js';
import {QuotaService} from '../src/quota.js';
import {AccountService} from '../src/account-services.js';
import {ContentService} from '../src/content.js';
import {Worker} from '../src/worker.js';
import {buildApi} from '../src/api.js';
import {account,authHeaders,LocalObjects,silent,testDatabase} from './support.js';

let db:Db,root:string,objects:LocalObjects,dispose:()=>Promise<void>;
const error=(code:string)=>(e:unknown)=>e instanceof AppError&&e.code===code;
const sample:LocalResultInput={tool:'comments',source:'// comment\nconst café="😀";',output:'\nconst café="😀";',language:'JavaScript',historyMode:'cloud'};
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-local-results-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});

test('HIS-001 local tool snapshots retain provenance, notes and one result without provider dispatch or credit use',async()=>{
 const a=await account(db),results=new LocalResultService(db),runs=new RunService(db),q=new QuotaService(db);
 await new AccountService(db).update(a.p,{evaluationOptOut:false});
 const balance=await q.balances(a.p),ledger=(await db.query('SELECT * FROM allowance_ledger WHERE account_id=$1',[balance[0].id])).rows;
 for(const tool of ['comments','pdf','run','convert'] as const){
  const saved=await results.record(a.p,{...sample,tool,kind:tool==='convert'?'example':'local'},`local-${tool}-request`,'local-results-test');
  assert.equal(saved.status,'completed');assert.equal(saved.replayed,false);
  const full=await runs.get(a.p,saved.id);
  assert.equal(full.source,sample.source);assert.equal(full.history_mode,'cloud');
  assert.equal(full.model,tool==='convert'?'local-example':'local-tool');
  assert.equal(full.results.length,1);assert.equal(full.results[0].origin,'local_tool');assert.equal(full.results[0].content,sample.output);
  assert.deepEqual((await db.query('SELECT data FROM run_events WHERE run_id=$1',[saved.id])).rows.map(r=>r.data),[{status:'completed',output:sample.output,local:true}]);
  assert.equal((await db.query('SELECT evaluation_allowed FROM tool_runs WHERE id=$1',[saved.id])).rows[0].evaluation_allowed,false);
  const note=await runs.saveNote(a.p,saved.id,`note for ${tool}`,null);assert.equal(note.version,1);
 }
 const listed=await runs.list(a.p);assert.equal(listed.items.length,4);assert.ok(listed.items.every(r=>r.result_origin==='local_tool'));
 assert.deepEqual(await q.balances(a.p),balance);
 assert.deepEqual((await db.query('SELECT * FROM allowance_ledger WHERE account_id=$1',[balance[0].id])).rows,ledger);
 assert.equal((await db.query('SELECT count(*)::int n FROM reservations WHERE owner_id=$1',[a.p.userId])).rows[0].n,0);
 assert.equal((await db.query("SELECT count(*)::int n FROM jobs WHERE kind='dispatch' AND payload->>'runId' IN(SELECT id::text FROM tool_runs WHERE owner_id=$1)",[a.p.userId])).rows[0].n,0);
 assert.equal((await db.query('SELECT count(*)::int n FROM evaluation_candidates WHERE owner_id=$1',[a.p.userId])).rows[0].n,0);
});

test('HIS-001 local result idempotency serializes duplicate writes and rejects changed retry content',async()=>{
 const a=await account(db),service=new LocalResultService(db);
 const saved=await Promise.all([service.record(a.p,sample,'local-duplicate-key','test'),service.record(a.p,{...sample},'local-duplicate-key','test')]);
 assert.equal(saved[0].id,saved[1].id);assert.deepEqual(saved.map(r=>r.replayed).sort(),[false,true]);
 await assert.rejects(service.record(a.p,{...sample,output:'changed'},'local-duplicate-key','test'),error('IDEMPOTENCY_CONFLICT'));
 await assert.rejects(service.record(a.p,{...sample,kind:'example'},'local-duplicate-key','test'),error('IDEMPOTENCY_CONFLICT'));
 assert.equal((await db.query('SELECT count(*)::int n FROM tool_runs WHERE owner_id=$1',[a.p.userId])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM result_versions WHERE owner_id=$1',[a.p.userId])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM concurrency_leases WHERE subject_hash=$1',[hash(a.p.userId)])).rows[0].n,0);
});

test('HIS-001 local snapshots validate tool-specific Unicode limits, explicit cloud consent and empty output',async()=>{
 const a=await account(db),service=new LocalResultService(db);
 for(const [tool,limit] of [['comments',100000],['pdf',50000],['run',10000],['convert',25000]] as const){
  const value={...sample,tool,source:'😀'.repeat(limit),output:''};
  const saved=await service.record(a.p,value,`limit-${tool}-exact`,'test');assert.equal((await new RunService(db).get(a.p,saved.id)).results[0].content,'');
  await assert.rejects(service.record(a.p,{...value,source:value.source+'x'},`limit-${tool}-over`,'test'),error('INVALID_LOCAL_RESULT'));
 }
 for(const change of [{historyMode:'local'},{historyMode:'none'},{historyMode:undefined},{tool:'review'},{source:' '},{language:' '},{language:'x'.repeat(61)},{targetLanguage:''},{kind:'ai'},{output:'x'.repeat(200001)}]){
  await assert.rejects(service.record(a.p,{...sample,...change} as LocalResultInput,id(),'test'),error('INVALID_LOCAL_RESULT'));
 }
 await assert.rejects(service.record(a.p,sample,'short','test'),error('INVALID_IDEMPOTENCY_KEY'));
 assert.equal((await new RunService(db).list(a.p)).items.length,4);
});

test('HIS-001 local snapshot API enforces session, CSRF, strict consent and account isolation',async()=>{
 const a=await account(db),b=await account(db),app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 try{
  const url='/v1/local-results';
  assert.equal((await app.inject({method:'POST',url,payload:sample})).statusCode,401);
  for(const headers of [{cookie:`fr_session=${a.session.sessionToken}`},{...authHeaders(a.session),origin:'https://attacker.invalid'},{...authHeaders(a.session),'x-csrf-token':'bad-token'}]){
   const denied=await app.inject({method:'POST',url,headers,payload:sample});assert.equal(denied.statusCode,403);
  }
  for(const historyMode of ['local','none',undefined]){
   const denied=await app.inject({method:'POST',url,headers:authHeaders(a.session,id()),payload:{...sample,historyMode}});assert.equal(denied.statusCode,400);
  }
  const key=id(),first=await app.inject({method:'POST',url,headers:authHeaders(a.session,key),payload:sample});
  assert.equal(first.statusCode,201,first.body);const runId=first.json().data.id;
  const replay=await app.inject({method:'POST',url,headers:authHeaders(a.session,key),payload:sample});assert.equal(replay.statusCode,201);assert.equal(replay.json().data.id,runId);assert.equal(replay.json().data.replayed,true);
  const other=await app.inject({method:'POST',url,headers:authHeaders(b.session,key),payload:sample});assert.equal(other.statusCode,201);assert.notEqual(other.json().data.id,runId);
  for(const suffix of ['', '/note'])assert.equal((await app.inject({url:`/v1/runs/${runId}${suffix}`,headers:authHeaders(b.session)})).statusCode,404);
  const deniedNote=await app.inject({method:'PUT',url:`/v1/runs/${runId}/note`,headers:authHeaders(b.session),payload:{content:'foreign',expectedVersion:null}});assert.equal(deniedNote.statusCode,404);
  assert.equal((await app.inject({url:`/v1/runs/${runId}/note`,headers:authHeaders(a.session)})).json().data,null);
  const note=await app.inject({method:'PUT',url:`/v1/runs/${runId}/note`,headers:authHeaders(a.session),payload:{content:'my local result note',expectedVersion:null}});assert.equal(note.statusCode,200,note.body);
  const conflict=await app.inject({method:'PUT',url:`/v1/runs/${runId}/note`,headers:authHeaders(a.session),payload:{content:'stale tab',expectedVersion:null}});assert.equal(conflict.statusCode,409);
  assert.equal((await app.inject({url:`/v1/runs/${runId}/note`,headers:authHeaders(a.session)})).json().data.content,'my local result note');
 }finally{await app.close();}
});

test('HIS-001 API accepts a valid maximum-length comment source and output within its declared route bounds',async()=>{
 const a=await account(db),app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 try{
  const response=await app.inject({method:'POST',url:'/v1/local-results',headers:authHeaders(a.session,id()),payload:{...sample,source:'x'.repeat(100000),output:'y'.repeat(100000)}});
  assert.equal(response.statusCode,201,response.body);
  assert.equal((await new RunService(db).get(a.p,response.json().data.id)).results[0].content.length,100000);
 }finally{await app.close();}
});

test('HIS-005 recovery discovers only the owner recent actionable jobs and unexpired completed exports',async()=>{
 const a=await account(db),b=await account(db),life=new LifecycleService(db),local=new LocalResultService(db);
 const run=await local.record(a.p,sample,'recovery-local-result','test');
 const accountJob=await life.requestExport(a.p,'recover-account-export','test'),historyJob=await life.historyJob(a.p,'history_export',[run.id],'recover-history-export','test'),deletion=await life.historyJob(a.p,'delete_history',[run.id],'recover-history-delete','test');
 const foreign=await life.requestExport(b.p,'foreign-account-export','test');
 await db.query("UPDATE jobs SET status='running' WHERE id=$1",[accountJob.jobId]);await db.query("UPDATE jobs SET status='dead',last_error='fixture failure' WHERE id=$1",[deletion.jobId]);
 const accountRecovery=await life.recoverableJobs(a.p,'account');
 assert.deepEqual(accountRecovery.map(r=>r.jobId),[accountJob.jobId]);assert.equal(accountRecovery[0].requestKey,'recover-account-export');
 assert.deepEqual(new Set((await life.recoverableJobs(a.p,'history')).map(r=>r.id)),new Set([historyJob.jobId,deletion.jobId]));
 assert.equal((await life.recoverableJobs(b.p,'history')).length,0);
 await assert.rejects(life.job(a.p,foreign.jobId),error('NOT_FOUND'));
 await life.buildExport(a.p.userId,a.p.workspaceId,accountJob.jobId);await life.historyExport(a.p.userId,a.p.workspaceId,[run.id],historyJob.jobId);
 await db.query("UPDATE jobs SET status='completed' WHERE id=ANY($1::uuid[])",[[accountJob.jobId,historyJob.jobId,deletion.jobId]]);
 assert.equal((await life.recoverableJobs(a.p,'account')).length,1);
 const completedHistory=await life.recoverableJobs(a.p,'history');
 assert.deepEqual(new Set(completedHistory.map(r=>r.id)),new Set([historyJob.jobId,deletion.jobId]));
 assert.equal(completedHistory.find(r=>r.id===deletion.jobId)?.requestKey,'recover-history-delete');
 assert.equal(completedHistory.find(r=>r.id===deletion.jobId)?.status,'completed');
 await db.query("UPDATE account_exports SET expires_at=now()-interval '1 second' WHERE id=ANY($1::uuid[])",[[accountJob.jobId,historyJob.jobId]]);
 assert.equal((await life.recoverableJobs(a.p,'account')).length,0);assert.deepEqual((await life.recoverableJobs(a.p,'history')).map(r=>r.id),[deletion.jobId]);
 await db.query("UPDATE jobs SET created_at=now()-interval '8 days' WHERE id=$1",[deletion.jobId]);assert.equal((await life.recoverableJobs(a.p,'history')).length,0);
 const old=await life.requestExport(a.p,'old-pending-export','test');await db.query("UPDATE jobs SET created_at=now()-interval '8 days' WHERE id=$1",[old.jobId]);
 assert.equal((await life.recoverableJobs(a.p,'account')).length,0);
});

test('HIS-005 pending discovery API publishes scoped serializable recovery data and reuses export intent',async()=>{
 const a=await account(db),b=await account(db),app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 try{
  const key=id(),queued=await app.inject({method:'POST',url:'/v1/account/exports',headers:authHeaders(a.session,key),payload:{}});assert.equal(queued.statusCode,202,queued.body);
  const repeated=await app.inject({method:'POST',url:'/v1/account/exports',headers:authHeaders(a.session,key),payload:{}});assert.equal(repeated.json().data.jobId,queued.json().data.jobId);
  const recovery=await app.inject({url:'/v1/account/exports/pending',headers:authHeaders(a.session)});assert.equal(recovery.statusCode,200,recovery.body);assert.deepEqual(recovery.json().data.items.map((r:{jobId:string})=>r.jobId),[queued.json().data.jobId]);
  assert.match(recovery.json().data.items[0].created_at,/^\d{4}-\d{2}-\d{2}T/);assert.equal(recovery.json().data.items[0].requestKey,key);
  const foreign=await app.inject({url:'/v1/account/exports/pending',headers:authHeaders(b.session)});assert.equal(foreign.statusCode,200);assert.deepEqual(foreign.json().data.items,[]);
  const run=await new LocalResultService(db).record(a.p,sample,'pending-api-result','test');
  const history=await app.inject({method:'POST',url:'/v1/history/export',headers:authHeaders(a.session,id()),payload:{runIds:[run.id]}});assert.equal(history.statusCode,202,history.body);
  const jobs=await app.inject({url:'/v1/history/jobs/pending',headers:authHeaders(a.session)});assert.equal(jobs.statusCode,200,jobs.body);assert.equal(jobs.json().data.items[0].id,history.json().data.jobId);assert.equal(jobs.json().data.items[0].kind,'history_export');
  assert.deepEqual((await app.inject({url:'/v1/history/jobs/pending',headers:authHeaders(b.session)})).json().data.items,[]);
 }finally{await app.close();}
});

test('CHT-001 nullable chat selection clears the account choice and preserves authenticated legacy selection',async()=>{
 const a=await account(db),b=await account(db),content=new ContentService(db,objects),own=await content.createThread(a.p,'Own conversation'),foreign=await content.createThread(b.p,'Other conversation');
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 const selected=async()=>{const r=await app.inject({url:'/v1/account',headers:authHeaders(a.session)});assert.equal(r.statusCode,200,r.body);return r.json().data.selected_chat_id;};
 try{
  const pick=await app.inject({method:'POST',url:'/v1/chats/select',headers:authHeaders(a.session),payload:{id:own.id}});assert.equal(pick.statusCode,200,pick.body);assert.equal(pick.json().data.id,own.id);assert.equal(await selected(),own.id);
  for(const threadId of [foreign.id,id()]){
   const denied=await app.inject({method:'POST',url:'/v1/chats/select',headers:authHeaders(a.session),payload:{id:threadId}});assert.equal(denied.statusCode,404,denied.body);assert.equal(await selected(),own.id);
  }
  const deniedClear=await app.inject({method:'POST',url:'/v1/chats/select',headers:{cookie:`fr_session=${a.session.sessionToken}`,origin:'http://localhost:3001'},payload:{id:null}});assert.equal(deniedClear.statusCode,403,deniedClear.body);assert.equal(await selected(),own.id);
  const cleared=await app.inject({method:'POST',url:'/v1/chats/select',headers:authHeaders(a.session),payload:{id:null}});assert.equal(cleared.statusCode,200,cleared.body);assert.equal(cleared.json().data.id,null);assert.equal(await selected(),null);
  const invalid=await app.inject({method:'POST',url:'/v1/chats/select',headers:authHeaders(a.session),payload:{}});assert.equal(invalid.statusCode,400);assert.equal(await selected(),null);
  const legacy=await app.inject({method:'POST',url:`/v1/chats/${own.id}/select`,headers:authHeaders(a.session)});assert.equal(legacy.statusCode,200,legacy.body);assert.equal(legacy.json().data.id,own.id);assert.equal(await selected(),own.id);
  const foreignLegacy=await app.inject({method:'POST',url:`/v1/chats/${foreign.id}/select`,headers:authHeaders(a.session)});assert.equal(foreignLegacy.statusCode,404);assert.equal(await selected(),own.id);
 }finally{await app.close();}
});

test('HIS-005 a completed deletion retry keeps its job after run content has already been removed',async()=>{
 const a=await account(db),local=new LocalResultService(db),life=new LifecycleService(db);
 const run=await local.record(a.p,sample,'deletion-replay-result','test');
 const created=await life.historyJob(a.p,'delete_history',[run.id],'delete-completed-retry','test');
 const worker=new Worker(db,objects,null,silent);
 for(let i=0;i<30&&(await life.job(a.p,created.jobId)).status!=='completed';i++)assert.equal(await worker.tick(),true);
 assert.equal((await life.job(a.p,created.jobId)).status,'completed');
 const deleted=await new RunService(db).get(a.p,run.id);assert.ok(deleted.history_deleted_at);assert.equal(deleted.source,'');assert.equal(deleted.results[0].content,'');assert.equal((await new RunService(db).list(a.p)).items.length,0);
 const replay=await life.historyJob(a.p,'delete_history',[run.id],'delete-completed-retry','test');assert.equal(replay.jobId,created.jobId);
 const second=await local.record(a.p,sample,'deletion-replay-result-2','test');
 await assert.rejects(life.historyJob(a.p,'delete_history',[second.id],'delete-completed-retry','test'),error('IDEMPOTENCY_CONFLICT'));
 assert.equal((await db.query("SELECT count(*)::int n FROM jobs WHERE dedupe_key=$1",[`delete_history:${a.p.userId}:delete-completed-retry`])).rows[0].n,1);
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 try{
  const response=await app.inject({method:'POST',url:'/v1/history/delete',headers:authHeaders(a.session,'delete-completed-retry'),payload:{runIds:[run.id]}});assert.equal(response.statusCode,202,response.body);assert.equal(response.json().data.jobId,created.jobId);
 }finally{await app.close();}
});
