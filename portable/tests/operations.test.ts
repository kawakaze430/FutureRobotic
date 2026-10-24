import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {migrate} from '../src/migrate.js';
import {buildApi} from '../src/api.js';
import {RunService} from '../src/runs.js';
import {Worker} from '../src/worker.js';
import {QuotaService} from '../src/quota.js';
import {ContentService} from '../src/content.js';
import type {Db} from '../src/db.js';
import {account,input,silent,LocalObjects,testDatabase} from './support.js';
let root:string,db:Db,dispose:()=>Promise<void>,objects:LocalObjects;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-operations-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
test('QAS-003 a Build 01 database upgrades once to Build 02 without losing identity or ledger data',async()=>{
 const oldDir=join(root,'old-migrations');await mkdir(oldDir);for(const name of ['001_core.sql','002_query_indexes.sql'])await copyFile('portable/migrations/'+name,join(oldDir,name));
 const old=await testDatabase(join(root,'old-db'));try{await migrate(old.db,oldDir);const a=await account(old.db),run={id:randomUUID()};await old.db.query("INSERT INTO tool_runs(id,workspace_id,owner_id,tool,source,instructions,language,model,idempotency_key,request_hash,trace_id,retention_until) VALUES($1,$2,$3,'convert',$4,'','Python','standard-auto','upgrade-source','fixture','fixture',now()+interval '1 day')",[run.id,a.p.workspaceId,a.p.userId,input.source]);await migrate(old.db);await migrate(old.db);assert.equal((await new RunService(old.db).get(a.p,run.id)).source,input.source);assert.equal((await old.db.query('SELECT count(*)::int n FROM schema_migrations')).rows[0].n,8);assert.ok((await old.db.query('SELECT id FROM runtime_controls')).rowCount);}finally{await old.db.close();await old.dispose();}
});
test('DAT-009 tenant history uses an indexed plan for a 10,000-row fixture',async()=>{
 const a=await account(db);await db.query("INSERT INTO tool_runs(id,workspace_id,owner_id,tool,source,instructions,language,model,idempotency_key,request_hash,trace_id,retention_until,status,created_at) SELECT gen_random_uuid(),$1,$2,'convert','','','Python','standard-auto','query-fixture-'||n,'fixture','fixture',now()+interval '1 day','completed',now()-n*interval '1 second' FROM generate_series(1,10000) n",[a.p.workspaceId,a.p.userId]);await db.query('ANALYZE tool_runs');
 const plan=(await db.query("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,tool,status FROM tool_runs WHERE workspace_id=$1 AND owner_id=$2 ORDER BY created_at DESC,id DESC LIMIT 20",[a.p.workspaceId,a.p.userId])).rows[0]['QUERY PLAN'];assert.ok(JSON.stringify(plan).includes('Index'));await mkdir('outputs',{recursive:true});await writeFile('outputs/build02-query-plan.json',JSON.stringify({database:process.env.TEST_DATABASE_URL?'native-postgresql':'PostgreSQL-WASM',rows:10000,plan},null,2));
});
test('QAS-008 real HTTP readiness saturation remains bounded at concurrency ten',async()=>{
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});await app.listen({host:'127.0.0.1',port:0});const address=app.server.address();assert.ok(address&&typeof address==='object');const endpoint=`http://127.0.0.1:${address.port}/ready`;const times:number[]=[];let next=0;
 try{await Promise.all(Array.from({length:10},async()=>{while(next++<100){const start=performance.now(),r=await fetch(endpoint,{signal:AbortSignal.timeout(5000)});assert.equal(r.status,200);await r.arrayBuffer();times.push(performance.now()-start);}}));times.sort((a,b)=>a-b);const p95=times[Math.floor(times.length*.95)];assert.ok(p95<2000);await writeFile('outputs/build02-http-load.json',JSON.stringify({scope:'loopback HTTP readiness only; no AWS/AI/runner saturation claim',requests:100,concurrency:10,errors:0,p95Ms:Math.round(p95),database:process.env.TEST_DATABASE_URL?'native':'WASM'},null,2));}finally{await app.close();}
});
test('CHT-006 chat history is trimmed within the current account context ceiling',async()=>{
 const a=await account(db),content=new ContentService(db,objects),thread=await content.createThread(a.p,'Budgeted chat');
 for(let i=0;i<12;i++)await content.addUserMessage(a.p,thread.id,'x'.repeat(1900));
 const r=await new RunService(db).create(a.p,{...input,tool:'chat',source:'y'.repeat(23000),chatThreadId:thread.id},'budgeted-context','3'.repeat(32));const context=await content.context(a.p,r.id);assert.ok(context.messages.slice(1).reduce((n,m)=>n+m.content.length,0)<=25000);assert.ok(context.messages.length<14);
});
test('SEC-009/REL-006 financial reconciliation reports no violations after an ordinary completed run',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),r=await new RunService(db).create(a.p,input,'finance-run','4'.repeat(32));const worker=new Worker(db,objects,{async generate(){return 'console.log("hello");';}},silent);for(let i=0;i<5&&await worker.tick();i++){}assert.equal((await new RunService(db).get(a.p,r.id)).status,'completed');const sql=await readFile('ops/check-finance.sql','utf8');for(const query of sql.split(';').map(x=>x.trim()).filter(Boolean)){assert.equal((await db.query(query)).rowCount,0,query.slice(0,70));}
});

test('AWS-014 operational metrics query the actual migrated database and emit only bounded aggregate metadata',async()=>{
 const {operationalMetrics}=await import('../src/operational-metrics.js');const metrics=await operationalMetrics(db,'staging');assert.equal(metrics.Environment,'staging');assert.equal(metrics.OperationalHeartbeat,1);assert.ok(Number.isFinite(metrics.DurableQueueOldestSeconds));assert.ok(metrics.EstimatedSpendPercent>=0);
});
