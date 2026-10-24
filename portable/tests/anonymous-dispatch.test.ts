import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,verify} from 'node:crypto';
import type {Db} from '../src/db.js';
import {migrate} from '../src/migrate.js';
import {AnonymousDispatchService,AnonymousTurnstileVerifier} from '../src/anonymous-dispatch.js';
import {ProviderFailure} from '../src/worker.js';
import {AppError,id} from '../src/common.js';
import {buildApi} from '../src/api.js';
import {testDatabase,LocalObjects,silent} from './support.js';
let db:Db,root:string,dispose:()=>Promise<void>,ipCounter=0;
const secret='a'.repeat(40),origin='http://localhost:3001',input={tool:'explain',source:'print("fixture")',language:'Python'},isCode=(code:string)=>(e:unknown)=>e instanceof AppError&&e.code===code;
const service=()=>new AnonymousDispatchService(db,{enabled:true,hashSecret:secret,human:{async verify(){return true;}},aiEnabled:true,executionEnabled:true,maxAiMicroUsd:1000});
async function session(s=service()){const ip='192.0.2.'+(++ipCounter);return {s,ip,...await s.session(ip,id())};}
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-anonymous-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;await migrate(db);await db.query('UPDATE runtime_controls SET provider_enabled=true,runner_enabled=true,daily_budget_micro_usd=1000000 WHERE id=1');});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
test('QTA-001 human verification/replay/session binding and CSRF precede paid dispatch',async()=>{
 const denied=new AnonymousDispatchService(db,{enabled:true,hashSecret:secret,human:{async verify(){return false;}},aiEnabled:true,executionEnabled:true,maxAiMicroUsd:1000});await assert.rejects(denied.session('192.0.2.250','denied-token'),isCode('HUMAN_VERIFICATION_FAILED'));
 const a=await session(),human=id();await a.s.session(a.ip,human);await assert.rejects(a.s.session(a.ip,human),isCode('HUMAN_TOKEN_REPLAY'));
 await assert.rejects(a.s.create(a.sessionToken,a.ip,'bad-csrf','ai',input,id(),'fixture'),isCode('CSRF_TOKEN'));
 await assert.rejects(a.s.create(a.sessionToken,'192.0.2.249',a.csrfToken,'ai',input,id(),'fixture'),isCode('ANONYMOUS_SESSION_REQUIRED'));
 assert.equal((await db.query('SELECT count(*)::int n FROM anonymous_requests')).rows[0].n,0);
});
test('QTA-001 parallel/replayed anonymous AI admissions consume exactly two daily uses across sessions',async()=>{
 const a=await session(),key=id(),values=await Promise.all([a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,key,'fixture'),a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,key,'fixture')]);assert.equal(new Set(values.map(v=>v.id)).size,1);assert.equal(values.filter(v=>v.replayed).length,1);
 await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',{...input,source:'changed'},key,'fixture'),isCode('IDEMPOTENCY_CONFLICT'));
 const b=await a.s.session(a.ip,id());await assert.rejects(a.s.get(b.sessionToken,a.ip,values[0].id),isCode('NOT_FOUND'));
 await a.s.dispatchAi({async generate(){return 'Transport fixture, not real AI';}});await a.s.create(b.sessionToken,a.ip,b.csrfToken,'ai',input,id(),'fixture');await a.s.dispatchAi({async generate(){return 'Second fixture';}});
 await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,id(),'fixture'),isCode('ANONYMOUS_DAILY_LIMIT'));
 const row=await a.s.get(a.sessionToken,a.ip,values[0].id);assert.equal(row.state,'completed');assert.equal(row.output,'Transport fixture, not real AI');
});
test('QTA-003 public Unicode limits and emergency/budget controls deny without usage or queued work',async()=>{
 const a=await session(),before=(await db.query('SELECT count(*)::int n FROM anonymous_usage')).rows[0].n;
 await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',{...input,source:'😀'.repeat(4001)},id(),'fixture'),isCode('ANONYMOUS_CONTEXT_LIMIT'));
 await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'execution',{language:'Python',source:'x'.repeat(10001)},id(),'fixture'),isCode('EXECUTION_INPUT_LIMIT'));
 await db.query('UPDATE runtime_controls SET provider_enabled=false WHERE id=1');await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,id(),'fixture'),isCode('PROVIDER_EMERGENCY_STOP'));
 await db.query('UPDATE runtime_controls SET provider_enabled=true,daily_budget_micro_usd=0 WHERE id=1');await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,id(),'fixture'),isCode('DAILY_SPENDING_LIMIT'));
 assert.equal((await db.query('SELECT count(*)::int n FROM anonymous_usage')).rows[0].n,before);await db.query('UPDATE runtime_controls SET daily_budget_micro_usd=1000000 WHERE id=1');
});
test('QTA-006 accepted, rejected and unknown public provider outcomes stay fenced; cancellation never blindly refunds uncertain work',async()=>{
 const a=await session(),created=await a.s.create(a.sessionToken,a.ip,a.csrfToken,'ai',input,id(),'fixture');let calls=0;
 await a.s.dispatchAi({async generate(){calls++;throw new ProviderFailure('unknown');}});assert.equal((await a.s.get(a.sessionToken,a.ip,created.id)).state,'uncertain');assert.equal(await a.s.dispatchAi({async generate(){calls++;return 'No replay';}}),false);assert.equal(calls,1);
 const held=(await db.query('SELECT status FROM anonymous_spend_holds WHERE request_id=$1',[created.id])).rows[0];assert.equal(held.status,'held');
 const b=await session(),queued=await b.s.create(b.sessionToken,b.ip,b.csrfToken,'ai',input,id(),'fixture');await b.s.cancel(b.sessionToken,b.ip,b.csrfToken,queued.id);assert.equal((await db.query('SELECT status FROM anonymous_spend_holds WHERE request_id=$1',[queued.id])).rows[0].status,'released');
 const c=await session(),safe=await c.s.create(c.sessionToken,c.ip,c.csrfToken,'ai',input,id(),'fixture');await c.s.dispatchAi({async generate(){throw new ProviderFailure('rejected');}});assert.equal((await c.s.get(c.sessionToken,c.ip,safe.id)).state,'failed');assert.equal((await db.query('SELECT status FROM anonymous_spend_holds WHERE request_id=$1',[safe.id])).rows[0].status,'released');
});
test('RUN-005 three daily public executions use signed gateway capabilities and never execute source on the application host',async()=>{
 const a=await session(),keys=generateKeyPairSync('ed25519'),privateKey=keys.privateKey.export({format:'pem',type:'pkcs8'}).toString();let calls=0;
 const gateway=async(_url:unknown,options?:RequestInit)=>{calls++;const capability=(options?.headers as Record<string,string>)['x-job-capability'],[claims,signature]=capability.split('.');assert.ok(verify(null,Buffer.from(claims),keys.publicKey,Buffer.from(signature,'base64url')));assert.equal(JSON.parse(Buffer.from(claims,'base64url').toString()).aud,'fr-isolated-runner');return new Response(JSON.stringify({stdout:'trusted gateway fixture',stderr:'',exitCode:0,durationMs:1,truncated:false,timedOut:false,phase:'execute'}));};
 for(let n=0;n<3;n++){const r=await a.s.create(a.sessionToken,a.ip,a.csrfToken,'execution',{language:'Python',source:'fixture source not executed here'},id(),'fixture');await a.s.dispatchExecution('https://isolated.example.invalid/run',privateKey,gateway as typeof fetch);assert.equal((await a.s.get(a.sessionToken,a.ip,r.id)).state,'completed');}
 await assert.rejects(a.s.create(a.sessionToken,a.ip,a.csrfToken,'execution',{language:'Python',source:'fixture'},id(),'fixture'),isCode('ANONYMOUS_DAILY_LIMIT'));assert.equal(calls,3);
});
test('SEC-007 direct public routes deny spoofed forwarding, Origin and CSRF; disabled configuration fails closed',async()=>{
 const s=service(),app=await buildApi({db,objects:new LocalObjects(join(root,'objects')),origin,telemetry:silent,anonymousService:s});
 try{
  assert.equal((await app.inject({method:'POST',url:'/v1/public/anonymous/session',headers:{origin,'x-forwarded-for':'203.0.113.7'},payload:{humanToken:id()}})).statusCode,403);
  assert.equal((await app.inject({method:'POST',url:'/v1/public/anonymous/session',headers:{origin:'https://attacker.invalid'},payload:{humanToken:id()}})).statusCode,403);
  const result=await app.inject({method:'POST',url:'/v1/public/anonymous/session',headers:{origin},payload:{humanToken:id()}});assert.equal(result.statusCode,200,result.body);
  const cookies=result.cookies.map(c=>c.name+'='+c.value).join('; '),created=await app.inject({method:'POST',url:'/v1/public/anonymous/ai',headers:{origin,cookie:cookies,'x-csrf-token':result.json().data.csrfToken,'idempotency-key':id()},payload:input});assert.equal(created.statusCode,202,created.body);
 }finally{await app.close();}
 const disabled=await buildApi({db,objects:new LocalObjects(join(root,'disabled')),origin,telemetry:silent});try{assert.equal((await disabled.inject({url:'/v1/public/anonymous/config'})).json().data.enabled,false);assert.equal((await disabled.inject({method:'POST',url:'/v1/public/anonymous/session',headers:{origin},payload:{humanToken:id()}})).statusCode,503);}finally{await disabled.close();}
});
test('AUT-005 anonymous human verifier binds actual hostname and anonymous action',async()=>{
 const transport=(action:string,hostname='app.example.invalid')=>async()=>new Response(JSON.stringify({success:true,action,hostname}));
 assert.equal(await new AnonymousTurnstileVerifier('secret','app.example.invalid',transport('login') as typeof fetch).verify('token','192.0.2.1'),false);
 assert.equal(await new AnonymousTurnstileVerifier('secret','app.example.invalid',transport('anonymous_dispatch') as typeof fetch).verify('token','192.0.2.1'),true);
 assert.equal(await new AnonymousTurnstileVerifier('secret','app.example.invalid',transport('anonymous_dispatch','attacker.invalid') as typeof fetch).verify('token','192.0.2.1'),false);
});
