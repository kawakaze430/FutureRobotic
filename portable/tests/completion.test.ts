import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {migrate} from '../src/migrate.js';
import type {Db} from '../src/db.js';
import {AppError,id,hash} from '../src/common.js';
import {creditWindow} from '../src/credit-period.js';
import {QuotaService} from '../src/quota.js';
import {ContentService} from '../src/content.js';
import {AccountService,FileService,ShareService} from '../src/account-services.js';
import {RunService} from '../src/runs.js';
import {LifecycleService} from '../src/lifecycle.js';
import {Worker} from '../src/worker.js';
import {fileUsage,validTextName,validTextContent} from '../src/file-capacity.js';
import {supportedTextExtensions} from '../src/product-policy.js';
import {buildApi} from '../src/api.js';
import {characters} from '../src/input-policy.js';
import {account,fileAccount,input,silent,LocalObjects,testDatabase,authHeaders} from './support.js';
let db:Db,root:string,objects:LocalObjects,dispose:()=>Promise<void>;
const error=(code:string)=>(e:unknown)=>e instanceof AppError&&e.code===code;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-completion-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
beforeEach(async()=>{await db.query("UPDATE jobs SET status='completed' WHERE status<>'completed'");});
test('BIL-005 monthly windows preserve the original UTC anchor across short months and leap years',()=>{
 const start='2024-01-31T12:34:56.789Z',end='2025-01-31T12:34:56.789Z';
 assert.deepEqual(creditWindow(start,end,Date.parse('2024-02-29T12:34:56.788Z')),{start,end:'2024-02-29T12:34:56.789Z'});
 assert.deepEqual(creditWindow(start,end,Date.parse('2024-02-29T12:34:56.789Z')),{start:'2024-02-29T12:34:56.789Z',end:'2024-03-31T12:34:56.789Z'});
 assert.equal(creditWindow(start,end,Date.parse(end)),null);
 assert.equal(creditWindow(start,end,Date.parse(start)-1),null);
 assert.equal(creditWindow(start,'invalid'),null);
});
test('BIL-005 annual entitlements grant only the current month, once, without rolling earlier balances forward',async()=>{
 const a=await account(db),q=new QuotaService(db),sub={id:id(),provider:'fixture',provider_id:id(),period_start:'2024-01-31T00:00:00Z',period_end:'2025-01-31T00:00:00Z',advanced_credits:50};
 const now=Date.parse('2024-03-15T00:00:00Z');await Promise.all(Array.from({length:8},()=>db.transaction(tx=>q.monthlyGrant(tx,a.p,sub,now))));
 const rows=(await db.query("SELECT period_key,granted FROM allowance_accounts WHERE workspace_id=$1 AND period_key<>'starter'",[a.p.workspaceId])).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].granted,50);assert.ok(rows[0].period_key.endsWith('2024-02-29T00:00:00.000Z'));
 await db.transaction(tx=>q.monthlyGrant(tx,a.p,sub,Date.parse('2024-04-15T00:00:00Z')));
 assert.equal((await db.query("SELECT count(*)::int n FROM allowance_accounts WHERE workspace_id=$1 AND period_key<>'starter'",[a.p.workspaceId])).rows[0].n,2);
});
test('FIL-003 every catalog extension has UTF-8 validation; binary and secret names are excluded',()=>{
 assert.ok(supportedTextExtensions.size>=70);
 for(const ext of supportedTextExtensions)assert.equal(validTextName('source.'+ext),true,ext);
 for(const name of ['.env','secret.pem','id_rsa','../escape.py','code.exe','a\n.py'])assert.equal(validTextName(name),false,name);
 assert.equal(validTextContent('const text = "中文";\n\t'),true);assert.equal(validTextContent('binary\x01'),false);assert.equal(validTextContent('x'.repeat(100001)),false);
});
test('FIL-006 free cloud uploads fail before object writes and retries consume one paid slot',async()=>{
 const free=await account(db),paid=await fileAccount(db),content=new ContentService(db,objects);
 await assert.rejects(content.uploadText(free.p,'source.py','print(1)','free-upload-request'),error('FILE_COUNT_LIMIT'));
 assert.equal((await db.query('SELECT count(*)::int n FROM files WHERE workspace_id=$1',[free.p.workspaceId])).rows[0].n,0);
 const f=await content.uploadText(paid.p,'source.py','print(1)','paid-upload-request');assert.equal((await content.uploadText(paid.p,'source.py','print(1)','paid-upload-request')).id,f.id);
 await assert.rejects(content.uploadText(paid.p,'source.py','print(2)','paid-upload-request'),error('IDEMPOTENCY_CONFLICT'));
 assert.equal((await fileUsage(db,paid.p)).count,1);
 for(const extension of supportedTextExtensions){const file=await content.uploadText(paid.p,'fixture.'+extension,'UTF-8 café 中文\n','type-fixture-'+extension);assert.equal((await new FileService(db,objects).download(paid.p,file.id)).bytes.toString(),'UTF-8 café 中文\n');}
});
test('FIL-006 staging and retained revisions count against serialized file and byte capacity',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects);
 await db.query("INSERT INTO files(id,workspace_id,owner_id,name,status) SELECT gen_random_uuid(),$1,$2,'seed-'||n||'.py','staged' FROM generate_series(1,99) n",[a.p.workspaceId,a.p.userId]);
 const two=await Promise.allSettled([content.uploadText(a.p,'last.py','x','last-file-request-1'),content.uploadText(a.p,'extra.py','x','last-file-request-2')]);assert.equal(two.filter(r=>r.status==='fulfilled').length,1);assert.equal((await fileUsage(db,a.p)).count,100);
 const b=await fileAccount(db),file=id();await db.query("INSERT INTO files(id,workspace_id,owner_id,name,status) VALUES($1,$2,$3,'versions.py','ready')",[file,b.p.workspaceId,b.p.userId]);
 await db.query("INSERT INTO file_revisions(id,file_id,workspace_id,owner_id,revision,object_key,sha256,size_bytes,media_type,extraction_status,extracted_text) VALUES($1,$2,$3,$4,1,$5,$6,10000000,'text/plain','ready','')",[id(),file,b.p.workspaceId,b.p.userId,'text/'+id(),hash('')]);
 await assert.rejects(new FileService(db,objects).revision(b.p,file,'x',1,'capacity-edit-1'),error('FILE_STORAGE_LIMIT'));
});
test('FIL-007/010 selected context discloses Unicode truncation and file pages expose actual size/revision',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects),files=new FileService(db,objects),text='😀'.repeat(7000),f=await content.uploadText(a.p,'long.txt',text,'long-context-upload');
 const r=await new RunService(db).create(a.p,{...input,fileIds:[f.id]},'long-context-run','a'.repeat(32));const run=await new RunService(db).get(a.p,r.id);
 assert.equal(run.contextFiles[0].original_characters,7000);assert.equal(run.contextFiles[0].included_characters,6000);
 const frozen=(await db.query('SELECT content FROM run_context_files WHERE run_id=$1',[r.id])).rows[0].content;assert.equal(characters(frozen),6000);assert.equal(frozen.at(-1)?.charCodeAt(0),0xde00);
 const listing=await files.list(a.p);assert.equal(Number(listing.items[0].size_bytes),28000);assert.equal(listing.items[0].revision,1);
});
test('QTA-003 Unicode request limits match database character counting and include instructions',async()=>{
 const a=await account(db),runs=new RunService(db),source='😀'.repeat(25000);
 await runs.create(a.p,{...input,source},'unicode-boundary-1','b'.repeat(32));
 await assert.rejects(runs.create(a.p,{...input,source,instructions:'x'},'unicode-boundary-2','b'.repeat(32)),error('CONTEXT_LIMIT'));
});
test('CHT-003 newest chat page and earlier cursors recover all messages without overlap',async()=>{
 const a=await account(db),content=new ContentService(db,objects),t=await content.createThread(a.p,'Paged conversation');
 for(let i=0;i<125;i++)await content.addUserMessage(a.p,t.id,String(i));
 const seen=new Set<string>();let cursor:string|undefined,pages=0;do{const page=await content.thread(a.p,t.id,cursor);for(const row of page.messages){assert.ok(!seen.has(row.id));seen.add(row.id);}cursor=page.nextCursor??undefined;pages++;}while(cursor);
 assert.equal(seen.size,125);assert.equal(pages,3);
 const foreign=await account(db);await assert.rejects(content.thread(foreign.p,t.id),error('NOT_FOUND'));
});
test('CHT-008 applied results preserve original and reject stale, cross-account, and changed retries',async()=>{
 const a=await account(db),b=await account(db),runs=new RunService(db),r=await runs.create(a.p,input,'apply-version-run','c'.repeat(32));
 await db.query("UPDATE tool_runs SET status='completed' WHERE id=$1",[r.id]);await db.query('INSERT INTO result_versions(id,run_id,workspace_id,owner_id,version,content) VALUES($1,$2,$3,$4,1,$5)',[id(),r.id,a.p.workspaceId,a.p.userId,'original']);
 const requests=[{content:'reviewed',key:'apply-request-1'},{content:'alternative',key:'apply-request-2'}];
 const attempts=await Promise.allSettled(requests.map(request=>runs.applyResult(a.p,r.id,request.content,1,request.key)));
 assert.equal(attempts.filter(result=>result.status==='fulfilled').length,1);
 const winnerIndex=attempts.findIndex(result=>result.status==='fulfilled'),winner=requests[winnerIndex];
 const losingAttempt=attempts[1-winnerIndex];assert.equal(losingAttempt.status,'rejected');
 if(losingAttempt.status==='rejected')assert.equal(losingAttempt.reason.code,'VERSION_CONFLICT');
 const replay=await runs.applyResult(a.p,r.id,winner.content,1,winner.key);assert.equal(replay.replayed,true);assert.equal(replay.version,2);
 await assert.rejects(runs.applyResult(a.p,r.id,'changed',1,winner.key),error('IDEMPOTENCY_CONFLICT'));
 await assert.rejects(runs.applyResult(b.p,r.id,'other',2,'apply-other-1'),error('NOT_FOUND'));
 const result=await runs.get(a.p,r.id);assert.equal(result.results.length,2);assert.equal(result.results[0].content,'original');assert.equal(result.results[1].content,winner.content);assert.equal(result.results[1].origin,'user_applied_assistant');
});
test('HIS-004 ephemeral requests stay out of history and evaluation, and delete derived notes/output',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),runs=new RunService(db),accounts=new AccountService(db),life=new LifecycleService(db);await accounts.update(a.p,{evaluationOptOut:false});
 const r=await runs.create(a.p,{...input,historyMode:'none'},'ephemeral-request-1','d'.repeat(32));const worker=new Worker(db,objects,{async generate(){return 'temporary output';}},silent);for(let i=0;i<4&&await worker.tick();i++){}
 assert.equal((await runs.list(a.p)).items.length,0);assert.equal((await accounts.evaluationDataset()).some(v=>v.id===r.id),false);await runs.saveNote(a.p,r.id,'temporary note',null);
 await assert.rejects(new ShareService(db).create(a.p,r.id),error('RESULT_NOT_SHAREABLE'));await accounts.deleteHistory(a.p,r.id);
 assert.equal((await runs.get(a.p,r.id)).results[0].content,'');assert.equal((await db.query('SELECT content FROM notes WHERE run_id=$1',[r.id])).rows[0].content,'');await life.cleanup();
});
test('HIS-005 bulk jobs enforce ownership, retries, export content and queued deletion',async()=>{
 const a=await account(db),b=await account(db),runs=new RunService(db),life=new LifecycleService(db),r=await runs.create(a.p,input,'bulk-history-run','e'.repeat(32));await runs.cancel(a.p,r.id,'e'.repeat(32));
 await assert.rejects(life.historyJob(b.p,'history_export',[r.id],'bulk-owner-1','e'.repeat(32)),error('NOT_FOUND'));
 const queued=await life.historyJob(a.p,'history_export',[r.id],'bulk-export-1','e'.repeat(32));assert.equal((await life.historyJob(a.p,'history_export',[r.id],'bulk-export-1','e'.repeat(32))).jobId,queued.jobId);
 await assert.rejects(life.job(b.p,queued.jobId),error('NOT_FOUND'));const worker=new Worker(db,objects,null,silent);for(let i=0;i<5&&await worker.tick();i++){}
 const exported=await life.getExport(a.p,queued.jobId);assert.equal(exported.content.runs[0].source,input.source);assert.equal(exported.content.scope,'selected_history');
 const del=await life.historyJob(a.p,'delete_history',[r.id],'bulk-delete-1','e'.repeat(32));for(let i=0;i<5&&await worker.tick();i++){}
 assert.equal((await life.job(a.p,del.jobId)).status,'completed');assert.equal((await runs.list(a.p)).items.length,0);assert.equal((await runs.get(a.p,r.id)).source,'');
});
test('AUT-007 profile/editor/pins round trip; API rejects unbounded and unknown preference fields',async()=>{
 const a=await account(db),accounts=new AccountService(db),editor={dark:true,lineNumbers:false,fontSize:16};await accounts.update(a.p,{displayName:'My workspace',editor,pins:['Python → JavaScript'],historyMode:'local',notifications:true});
 const profile=await accounts.profile(a.p);assert.equal(profile.display_name,'My workspace');assert.deepEqual(profile.preferences.editor,editor);assert.equal(profile.entitlement.plan,'free');assert.equal(profile.entitlement.balance.available,5);
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});try{const second=await a.identity.createSession(a.p.userId);const restored=await app.inject({url:'/v1/account',headers:authHeaders(second)});assert.deepEqual(restored.json().data.preferences.editor,editor);assert.equal(restored.json().data.display_name,'My workspace');const response=await app.inject({method:'PATCH',url:'/v1/account',headers:authHeaders(a.session),payload:{editor:{...editor,fontSize:99}}});assert.equal(response.statusCode,400);}finally{await app.close();}
});
test('AUT-008 account deletion requires resolution of an active paid entitlement',async()=>{
 const a=await fileAccount(db),life=new LifecycleService(db);await assert.rejects(life.requestDeletion(a.p,'f'.repeat(32)),error('SUBSCRIPTION_ACTION_REQUIRED'));assert.ok(await a.identity.authenticate(a.session.sessionToken));
 await db.query("UPDATE subscriptions SET status='cancelled' WHERE workspace_id=$1",[a.p.workspaceId]);await life.requestDeletion(a.p,'f'.repeat(32));await assert.rejects(a.identity.authenticate(a.session.sessionToken),error('UNAUTHENTICATED'));
});

test('FIL-010 reviewed context revisions are frozen; stale revisions fail without a reservation or dispatch',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects),files=new FileService(db,objects),runs=new RunService(db),f=await content.uploadText(a.p,'reviewed.py','print("version one")','reviewed-file-upload');
 const original=await runs.create(a.p,{...input,fileIds:[f.id],fileRevisions:[{id:f.id,revision:1}]},'reviewed-run-original','f'.repeat(32));
 await files.revision(a.p,f.id,'print("version two")',1,'reviewed-file-revision');
 const before=(await db.query('SELECT count(*)::int n FROM reservations WHERE owner_id=$1',[a.p.userId])).rows[0].n;
 await assert.rejects(runs.create(a.p,{...input,fileIds:[f.id],fileRevisions:[{id:f.id,revision:1}]},'reviewed-run-stale','f'.repeat(32)),error('CONTEXT_REVISION_CHANGED'));
 assert.equal((await db.query('SELECT count(*)::int n FROM reservations WHERE owner_id=$1',[a.p.userId])).rows[0].n,before);
 const updated=await runs.create(a.p,{...input,fileIds:[f.id],fileRevisions:[{id:f.id,revision:2}]},'reviewed-run-updated','f'.repeat(32));
 assert.equal((await runs.get(a.p,original.id)).contextFiles[0].revision,1);assert.equal((await runs.get(a.p,updated.id)).contextFiles[0].revision,2);
 const b=await fileAccount(db);await assert.rejects(runs.create(b.p,{...input,fileIds:[f.id],fileRevisions:[{id:f.id,revision:2}]},'reviewed-run-foreign','f'.repeat(32)),error('CONTEXT_FILE_UNAVAILABLE'));
});
test('FIL-010 native-compatible concurrent revision/freeze never silently switches a reviewed snapshot',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects),files=new FileService(db,objects),runs=new RunService(db),f=await content.uploadText(a.p,'race.py','print(1)','freeze-race-upload');
 const [edited,frozen]=await Promise.allSettled([files.revision(a.p,f.id,'print(2)',1,'freeze-race-edit'),runs.create(a.p,{...input,fileIds:[f.id],fileRevisions:[{id:f.id,revision:1}]},'freeze-race-run','f'.repeat(32))]);
 assert.equal(edited.status,'fulfilled');if(frozen.status==='fulfilled')assert.equal((await runs.get(a.p,frozen.value.id)).contextFiles[0].revision,1);else assert.ok(error('CONTEXT_REVISION_CHANGED')(frozen.reason));
});
