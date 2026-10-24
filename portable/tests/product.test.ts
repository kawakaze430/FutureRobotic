import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes,createHmac} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import {migrate} from '../src/migrate.js';
import type {Db} from '../src/db.js';
import {AppError,hash,id} from '../src/common.js';
import {Sealer,totp} from '../src/crypto.js';
import {PublicAuth} from '../src/public-auth.js';
import {OperatorService,SpendService,AnonymousAllowance} from '../src/protection.js';
import {RunService} from '../src/runs.js';
import {ContentService} from '../src/content.js';
import {FileService,ShareService,AccountService} from '../src/account-services.js';
import {extractProject,extractQuarantine,S3Objects} from '../src/cloud-files.js';
import {PaddleGateway,verifyPaddleSignature,type MerchantConfig} from '../src/merchant.js';
import {BillingService} from '../src/billing.js';
import {QuotaService} from '../src/quota.js';
import {ExecutionService} from '../src/execution.js';
import {HttpCodeProvider,readSse} from '../src/provider.js';
import {Worker} from '../src/worker.js';
import {buildApi} from '../src/api.js';
import {fileAccount,account,input,silent,LocalObjects,testDatabase,authHeaders} from './support.js';
let db:Db,root:string,objects:LocalObjects,dispose:()=>Promise<void>;
const secret='test-only-hash-secret-with-at-least-32-characters',sealer=new Sealer(Buffer.alloc(32,7).toString('base64'));
const codeError=(code:string)=>(e:unknown)=>e instanceof AppError&&e.code===code;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-product-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
beforeEach(async()=>{await db.query("UPDATE jobs SET status='completed',lease_token=NULL,lease_until=NULL WHERE status<>'completed'");await db.query('UPDATE runtime_controls SET provider_enabled=false,runner_enabled=false,daily_budget_micro_usd=0 WHERE id=1');});
function emailAuth(human=true){const codes=new Map<string,string>();let sent=0;const auth=new PublicAuth(db,{origin:'http://localhost:3001',hashSecret:secret,sealer,human:{async verify(){return human;}},mailer:{async sendCode(email,code){codes.set(email,code);sent++;}}});return {auth,codes,sent:()=>sent};}
function signWebhook(body:string,webhookSecret='test-webhook-destination-secret',timestamp=Math.floor(Date.now()/1000)){return `ts=${timestamp};h1=${createHmac('sha256',webhookSecret).update(`${timestamp}:${body}`).digest('hex')}`;}
function merchant(http:typeof fetch,overrides:Partial<MerchantConfig>={}){return new PaddleGateway(db,{mode:'sandbox',apiKey:'test-fixture-only',webhookSecrets:['test-webhook-destination-secret'],approved:true,countries:['IN'],priceIds:{'pro:month':'pri_pro_month','premium:month':'pri_premium_month'},origin:'https://example.com',...overrides},http);}

test('AUT-004/005 OTP creates one safe session; replay, expiration and five wrong attempts fail',async()=>{
 const e=emailAuth(),email=`otp-${id()}@example.com`,ip=id();const challenge=await e.auth.requestOtp(email,id(),ip),code=e.codes.get(email)!;
 const session=await e.auth.verifyOtp(challenge.challengeId,code,ip);assert.ok(session.sessionToken);await assert.rejects(e.auth.verifyOtp(challenge.challengeId,code,ip),codeError('INVALID_OR_EXPIRED_CODE'));
 const brute=await e.auth.requestOtp(`brute-${id()}@example.com`,id(),id());for(let i=0;i<5;i++)await assert.rejects(e.auth.verifyOtp(brute.challengeId,'999999',id()),codeError('INVALID_OR_EXPIRED_CODE'));
 assert.equal((await db.query('SELECT attempts,status FROM otp_challenges WHERE id=$1',[brute.challengeId])).rows[0].attempts,5);
 const expired=await e.auth.requestOtp(`expired-${id()}@example.com`,id(),id());await db.query("UPDATE otp_challenges SET expires_at=now()-interval '1 second' WHERE id=$1",[expired.challengeId]);await assert.rejects(e.auth.verifyOtp(expired.challengeId,'000000',id()),codeError('INVALID_OR_EXPIRED_CODE'));
});
test('AUT-005 human verification, token replay and durable send limits precede sending email',async()=>{
 const denied=emailAuth(false);await assert.rejects(denied.auth.requestOtp(`${id()}@example.com`,id(),id()),codeError('HUMAN_VERIFICATION_FAILED'));assert.equal(denied.sent(),0);
 const e=emailAuth(),human=id(),email=`limited-${id()}@example.com`,ip=id();await e.auth.requestOtp(email,human,ip);await assert.rejects(e.auth.requestOtp(`${id()}@example.com`,human,id()),codeError('HUMAN_TOKEN_REPLAY'));assert.equal(e.sent(),1);
 await e.auth.requestOtp(email,id(),ip);await e.auth.requestOtp(email,id(),ip);await assert.rejects(e.auth.requestOtp(email,id(),ip),codeError('AUTH_RATE_LIMIT'));assert.equal(e.sent(),3);
});
test('AUT-002 Google callback is bound to browser state/PKCE and consumes state once',async()=>{
 let calls=0,expectedNonce='',expectedChallenge='';const http=(async(_url:any,init:any)=>{calls++;const params=new URLSearchParams(init.body);const verifier=params.get('code_verifier')!;const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(verifier).digest('base64url'),expectedChallenge);return Response.json({id_token:'fixture-id-token'});}) as typeof fetch;
 const auth=new PublicAuth(db,{origin:'https://example.com',hashSecret:secret,sealer,google:{id:'google-fixture',secret:'fixture-only'},http,googleVerify:async(_jwt,nonce,aud)=>{assert.equal(nonce,expectedNonce);assert.equal(aud,'google-fixture');return {issuer:'google',subject:id(),email:`${id()}@example.com`,emailVerified:true};}});
 const start=await auth.begin('google',id()),url=new URL(start.url);expectedNonce=url.searchParams.get('nonce')!;expectedChallenge=url.searchParams.get('code_challenge')!;
 await assert.rejects(auth.callback('google',url.searchParams.get('state')!,'code','wrong-binding'),codeError('INVALID_OAUTH_STATE'));assert.equal(calls,0);
 await auth.callback('google',url.searchParams.get('state')!,'code',start.binding);assert.equal(calls,1);
 await assert.rejects(auth.callback('google',url.searchParams.get('state')!,'code',start.binding),codeError('INVALID_OAUTH_STATE'));assert.equal(calls,1);
});
test('AUT-003 GitHub profile requires a primary verified email and never links by email alone',async()=>{
 const existing=await account(db);const email=(await db.query('SELECT email FROM users WHERE id=$1',[existing.p.userId])).rows[0].email;
 let verified=false;const http=(async(url:any)=>String(url).includes('access_token')?Response.json({access_token:'fixture-only'}):String(url).endsWith('/emails')?Response.json([{email,primary:true,verified}]):Response.json({id:54321})) as typeof fetch;
 const auth=new PublicAuth(db,{origin:'https://example.com',hashSecret:secret,sealer,github:{id:'github-fixture',secret:'fixture-only'},http});
 let start=await auth.begin('github',id());await assert.rejects(auth.callback('github',new URL(start.url).searchParams.get('state')!,'code',start.binding),codeError('UNVERIFIED_IDENTITY'));
 verified=true;start=await auth.begin('github',id());await assert.rejects(auth.callback('github',new URL(start.url).searchParams.get('state')!,'code',start.binding),codeError('EXPLICIT_IDENTITY_LINK_REQUIRED'));
});
test('AUT-004 API issues Secure host cookies with HttpOnly session and separate CSRF token',async()=>{
 const e=emailAuth(),app=await buildApi({db,objects,origin:'https://example.com',production:true,auth:e.auth,telemetry:silent});
 try{const email=`apiotp-${id()}@example.com`,r=await app.inject({method:'POST',url:'/auth/email/request',headers:{origin:'https://example.com'},payload:{email,humanToken:id()}});assert.equal(r.statusCode,200);
 const verified=await app.inject({method:'POST',url:'/auth/email/verify',headers:{origin:'https://example.com'},payload:{challengeId:r.json().data.challengeId,code:e.codes.get(email)}});assert.equal(verified.statusCode,200);
 const cookies=verified.headers['set-cookie'] as string[];assert.ok(cookies.some(c=>c.startsWith('__Host-fr_session=')&&c.includes('HttpOnly')&&c.includes('Secure')&&c.includes('SameSite=Strict')));assert.ok(cookies.some(c=>c.startsWith('__Host-fr_csrf=')&&!c.includes('HttpOnly')&&c.includes('Secure')));
 const cookie=cookies.map(c=>c.split(';')[0]).join('; ');assert.equal((await app.inject({url:'/v1/account',headers:{cookie}})).statusCode,200);
 }finally{await app.close();}
});
test('AUT-009/SEC-009 ordinary users and wrong roles fail; MFA is replay-proof and actions are audited',async()=>{
 const a=await account(db),op=new OperatorService(db,sealer),seed=Buffer.from('12345678901234567890');await assert.rejects(op.authorize(a.p,'controls.write','123456'),codeError('OPERATOR_FORBIDDEN'));
 await db.query('INSERT INTO operators(user_id,role,totp_cipher,enabled) VALUES($1,\'operations\',$2,true)',[a.p.userId,sealer.seal(seed.toString('base64'))]);
 const code=totp(seed,Math.floor(Date.now()/30000));await op.authorize(a.p,'controls.write',code);await op.controls(a.p,{providerEnabled:false,runnerEnabled:false,dailyBudgetMicroUsd:100});await assert.rejects(op.authorize(a.p,'controls.write',code),codeError('MFA_INVALID_OR_REPLAYED'));
 await assert.rejects(op.authorize(a.p,'support.read',totp(seed,Math.floor(Date.now()/30000)+1)),codeError('OPERATOR_FORBIDDEN'));
 assert.equal((await db.query('SELECT count(*)::int AS n FROM audit_events WHERE actor_id=$1 AND action=\'operator.controls_changed\'',[a.p.userId])).rows[0].n,1);
 await assert.rejects(db.query('DELETE FROM audit_events WHERE actor_id=$1',[a.p.userId]),/append-only/);
});
test('QTA-006 budget holds share a ceiling, settle once and emergency stop prevents dispatch',async()=>{
 const a=await account(db),runs=new RunService(db),spend=new SpendService(db),r1=await runs.create(a.p,input,'budget-request-1','1'.repeat(32)),r2=await runs.create(a.p,input,'budget-request-2','1'.repeat(32));
 await db.query('UPDATE runtime_controls SET provider_enabled=true,daily_budget_micro_usd=100 WHERE id=1');await spend.reserve(r1.id,60);await assert.rejects(spend.reserve(r2.id,60),codeError('DAILY_SPENDING_LIMIT'));
 await db.transaction(tx=>spend.finalize(tx,r1.id,true));await db.transaction(tx=>spend.finalize(tx,r1.id,true));const day=(await db.query('SELECT * FROM spend_days ORDER BY day DESC LIMIT 1')).rows[0];assert.equal(Number(day.spent_micro_usd),60);assert.equal(Number(day.held_micro_usd),0);
 await db.query('UPDATE runtime_controls SET provider_enabled=false WHERE id=1');await assert.rejects(spend.reserve(r2.id,1),codeError('PROVIDER_EMERGENCY_STOP'));
});
test('QTA-001 anonymous AI and execution reservations enforce two/three daily uses before dispatch',async()=>{
 const allowance=new AnonymousAllowance(db,secret),ip=id();const ai=await Promise.allSettled(Array.from({length:8},(_,i)=>allowance.reserve(ip,'ai',`anon-ai-${i}`)));assert.equal(ai.filter(x=>x.status==='fulfilled').length,2);
 const run=await Promise.allSettled(Array.from({length:8},(_,i)=>allowance.reserve(ip,'execution',`anon-run-${i}`)));assert.equal(run.filter(x=>x.status==='fulfilled').length,3);
 assert.equal((await allowance.reserve(ip,'ai','anon-ai-0')).replayed,true);
 assert.ok(!(await db.query('SELECT subject_hash FROM anonymous_usage')).rows.some(r=>r.subject_hash===ip));
});
test('TOL-010/CHT-006 server rejects Advanced model for Free and accepts a valid paid entitlement',async()=>{
 const a=await account(db),runs=new RunService(db);await assert.rejects(runs.create(a.p,{...input,modelId:'advanced-code'},'advanced-model-1','2'.repeat(32)),codeError('MODEL_TIER_REQUIRED'));
 await new BillingService(db).apply(a.p,{provider:'fixture',eventId:id(),rawBody:'paid-fixture',occurredAt:new Date().toISOString(),subscriptionId:id(),planId:'pro',status:'active',periodStart:new Date(Date.now()-1000).toISOString(),periodEnd:new Date(Date.now()+86400000).toISOString()});
 const r=await runs.create(a.p,{...input,modelId:'advanced-code'},'advanced-model-2','2'.repeat(32));assert.equal((await runs.get(a.p,r.id)).model,'advanced-code');
 await assert.rejects(runs.create(a.p,{...input,modelId:'arbitrary-provider-admin'},'advanced-model-3','2'.repeat(32)),codeError('MODEL_NOT_ALLOWED'));
});
test('FIL-010 freezes exact file revision and checksum; later edits never change past context',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects),files=new FileService(db,objects),runs=new RunService(db),f=await content.uploadText(a.p,'context.py','first revision','context-upload-1');
 const r=await runs.create(a.p,{...input,fileIds:[f.id]},'frozen-context-1','3'.repeat(32));await files.revision(a.p,f.id,'second revision',1,'revision-key-1');
 const context=await content.context(a.p,r.id);assert.ok(context.messages.at(-1)!.content.includes('first revision'));assert.ok(!context.messages.at(-1)!.content.includes('second revision'));
 const detail=await runs.get(a.p,r.id);assert.equal(detail.contextFiles[0].revision,1);assert.equal(detail.contextFiles[0].sha256,hash('first revision'));
 await assert.rejects(files.revision(a.p,f.id,'lost edit',1,'revision-key-2'),codeError('VERSION_CONFLICT'));
 assert.equal((await files.download(a.p,f.id)).bytes.toString(),'second revision');
});
test('FIL-009 deletion revokes file access and clears derived frozen context',async()=>{
 const a=await fileAccount(db),content=new ContentService(db,objects),f=await content.uploadText(a.p,'secret.txt','DERIVED_SECRET','derived-file-1'),r=await new RunService(db).create(a.p,{...input,fileIds:[f.id]},'derived-run-1','4'.repeat(32));
 await content.deleteFile(a.p,f.id);await assert.rejects(new FileService(db,objects).download(a.p,f.id),codeError('NOT_FOUND'));
 assert.equal((await db.query('SELECT content FROM run_context_files WHERE run_id=$1',[r.id])).rows[0].content,'');
});
test('FIL-004/005 safe ZIP import excludes dependencies, build output and secret filenames',async()=>{
 const archive=zipSync({'src/main.py':strToU8('print("hello")'),'node_modules/library/a.js':strToU8('excluded'),'dist/build.js':strToU8('excluded'),'.env':strToU8('not context')});
 const r=extractProject(archive);assert.equal(r.files.length,1);assert.equal(r.files[0].name,'src/main.py');assert.equal(r.excluded.length,3);
});
test('SEC-005 archive traversal, case-colliding paths, binary data and high expansion are rejected',async()=>{
 for(const archive of [zipSync({'../escape.py':strToU8('x')}),zipSync({'a.py':strToU8('a'),'A.py':strToU8('b')}),zipSync({'binary.txt':new Uint8Array([0,1])}),zipSync({'bomb.txt':new Uint8Array(100001).fill(65)})])assert.throws(()=>extractProject(archive));
});
test('FIL-008 quarantined content becomes context only after exact checksum/length/UTF-8 verification',async()=>{
 const a=await account(db),fileId=id(),rev=id(),key=`quarantine/${a.p.workspaceId}/${rev}`,text='verified text';await objects.put(key,Buffer.from(text));
 await db.query('INSERT INTO files(id,workspace_id,owner_id,name,status) VALUES($1,$2,$3,\'safe.txt\',\'staged\')',[fileId,a.p.workspaceId,a.p.userId]);
 await db.query('INSERT INTO file_revisions(id,file_id,workspace_id,owner_id,revision,object_key,sha256,size_bytes,media_type) VALUES($1,$2,$3,$4,1,$5,$6,$7,\'text/plain\')',[rev,fileId,a.p.workspaceId,a.p.userId,key,hash(text),text.length]);
 await db.query('INSERT INTO quarantine_uploads(file_id,revision_id,expected_sha256,expected_bytes,object_key,expires_at,completed_at) VALUES($1,$2,$3,$4,$5,now()+interval \'1 hour\',now())',[fileId,rev,hash(text),text.length,key]);
 await extractQuarantine(db,objects,fileId);assert.equal((await new ContentService(db,objects).getFile(a.p,fileId)).status,'ready');
 const promoted=(await db.query('SELECT object_key FROM file_revisions WHERE id=$1',[rev])).rows[0].object_key;assert.ok(promoted.startsWith('text/'));await objects.put(key,Buffer.from('tampered'));await extractQuarantine(db,objects,fileId);assert.equal(Buffer.from((await new FileService(db,objects).download(a.p,fileId)).bytes).toString(),text);
 await db.query("UPDATE files SET status='staged' WHERE id=$1",[fileId]);await assert.rejects(extractQuarantine(db,objects,fileId),codeError('UPLOAD_INTEGRITY_FAILURE'));
});
test('SHR-001/002/003 sharing publishes only result snapshot and respects expiration/revocation',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),runs=new RunService(db),r=await runs.create(a.p,{...input,source:'HIDDEN_SOURCE',instructions:'HIDDEN_INSTRUCTIONS'},'share-result-1','5'.repeat(32));await new Worker(db,objects,{async generate(){return 'PUBLIC_RESULT';}},silent).tick();
 const shares=new ShareService(db),shared=await shares.create(a.p,r.id),data=await shares.resolve(shared.token);assert.equal(data.result,'PUBLIC_RESULT');assert.ok(!JSON.stringify(data).includes('HIDDEN'));
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});try{const response=await app.inject({method:'POST',url:'/v1/public/shares/resolve',payload:{token:shared.token}});assert.equal(response.statusCode,200);assert.ok(String(response.headers['x-robots-tag']).includes('noindex'));const ownerList=await app.inject({url:`/v1/runs/${r.id}/shares`,headers:authHeaders(a.session)});assert.equal(ownerList.statusCode,200);assert.equal(ownerList.json().data.items.length,1);assert.ok(!ownerList.body.includes(shared.token));const other=await account(db);assert.equal((await app.inject({url:`/v1/runs/${r.id}/shares`,headers:authHeaders(other.session)})).statusCode,404);}finally{await app.close();}
 await new ContentService(db,objects).revokeShare(a.p,shared.id);await assert.rejects(shares.resolve(shared.token),codeError('SHARE_NOT_FOUND'));
 const expires=await shares.create(a.p,r.id);await db.query("UPDATE shares SET expires_at=now()-interval '1 second' WHERE id=$1",[expires.id]);await assert.rejects(shares.resolve(expires.token),codeError('SHARE_NOT_FOUND'));await assert.rejects(shares.resolve(a.p.workspaceId),codeError('SHARE_NOT_FOUND'));
});
test('HIS-006 evaluation is opt-in and opt-out removes queued content immediately',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),accounts=new AccountService(db),runs=new RunService(db);const first=await runs.create(a.p,input,'evaluation-default','6'.repeat(32));await new Worker(db,objects,{async generate(){return 'no evaluation';}},silent).tick();assert.ok(!(await accounts.evaluationDataset()).some(r=>r.id===first.id));
 await accounts.update(a.p,{evaluationOptOut:false});const included=await runs.create(a.p,input,'evaluation-optin','6'.repeat(32));await new Worker(db,objects,{async generate(){return 'explicitly shared';}},silent).tick();assert.ok((await accounts.evaluationDataset()).some(r=>r.id===included.id));
 await accounts.update(a.p,{evaluationOptOut:true});assert.ok(!(await accounts.evaluationDataset()).some(r=>r.id===included.id));
});
test('API-006 account, support, files and selected chat CRUD enforce ownership',async()=>{
 const a=await account(db),b=await account(db),app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});
 try{const headers=authHeaders(a.session);assert.equal((await app.inject({method:'PATCH',url:'/v1/account',headers,payload:{displayName:'Account A',evaluationOptOut:true}})).statusCode,200);
 const ticket=await app.inject({method:'POST',url:'/v1/support',headers:{...headers,'idempotency-key':'support-owner-fixture'},payload:{subject:'Help',message:'A private support request'}});assert.equal(ticket.statusCode,201);const tid=ticket.json().data.id;
 assert.equal((await app.inject({url:`/v1/support/${tid}`,headers:authHeaders(b.session)})).statusCode,404);assert.equal((await app.inject({url:`/v1/support/${tid}`,headers})).statusCode,200);
 const thread=(await app.inject({method:'POST',url:'/v1/chats',headers,payload:{title:'Stored conversation'}})).json().data;
 assert.equal((await app.inject({method:'POST',url:`/v1/chats/${thread.id}/select`,headers:authHeaders(b.session)})).statusCode,404);assert.equal((await app.inject({method:'POST',url:`/v1/chats/${thread.id}/select`,headers})).statusCode,200);
 assert.equal((await app.inject({url:'/v1/account',headers})).json().data.selected_chat_id,thread.id);
 assert.equal((await app.inject({method:'DELETE',url:`/v1/chats/${thread.id}`,headers})).statusCode,200);assert.equal((await app.inject({url:`/v1/chats/${thread.id}`,headers})).statusCode,404);
 }finally{await app.close();}
});
test('TOL-011/CHT-007 SSE parser preserves split UTF-8/CRLF frames and provider requires terminal marker',async()=>{
 const encoded=new TextEncoder().encode('data: {"choices":[{"delta":{"content":"π"}}]}\r\n\r\ndata: [DONE]\r\n\r\n');
 const stream=new ReadableStream<Uint8Array>({start(c){for(const byte of encoded)c.enqueue(new Uint8Array([byte]));c.close();}}),frames=[];for await(const f of readSse(stream))frames.push(f);assert.equal(frames.length,2);assert.ok(frames[0].includes('π'));assert.equal(frames[1],'[DONE]');
 let messages:any;const provider=new HttpCodeProvider({endpoint:'https://model.example.com/v1/chat/completions',key:'fixture-only',models:{'standard-auto':'fixture'},inputMicroUsdPerMillion:10,outputMicroUsdPerMillion:20,retentionApproved:true},(async(_url:any,init:any)=>{messages=JSON.parse(init.body);return new Response('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: [DONE]\n\n');}) as typeof fetch);
 let delta='';const result=await provider.generate({runId:id(),traceId:'7'.repeat(32),idempotencyKey:id(),modelId:'standard-auto',messages:[{role:'user',content:'code'}],tools:[],signal:new AbortController().signal,onDelta:async s=>{delta+=s;}});assert.equal(result,'hello');assert.equal(delta,'hello');assert.equal(messages.stream,true);assert.equal(messages.max_tokens,4096);assert.equal(messages.tools,undefined);
});
test('CHT-003/007 streamed messages persist, partial output settles once and retry delivery does not redispatch',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),content=new ContentService(db,objects),thread=await content.createThread(a.p,'Streaming conversation'),runs=new RunService(db),r=await runs.create(a.p,{...input,tool:'chat',chatThreadId:thread.id,chatMessage:'Please help'},'chat-stream-1','8'.repeat(32));let calls=0;
 const worker=new Worker(db,objects,{async generate(request){calls++;await request.onDelta!('partial answer');throw new Error('stream interrupted');}},silent);await worker.tick();
 const restored=await new ContentService(db,objects).thread(a.p,thread.id);assert.equal(restored.messages[0].content,'Please help');assert.equal(restored.messages[1].content,'partial answer');assert.equal(restored.messages[1].state,'partial');assert.equal((await new QuotaService(db).balances(a.p))[0].consumed,1);
 await db.query('UPDATE jobs SET status=\'queued\',available_at=now() WHERE dedupe_key=$1',[`dispatch:${r.id}`]);await worker.tick();assert.equal(calls,1);
});
test('API-003/CHT-007 real HTTP event route replays persisted deltas and terminal output',async()=>{await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
 const a=await account(db),r=await new RunService(db).create(a.p,input,'sse-replay-1','9'.repeat(32));await new Worker(db,objects,{async generate(req){await req.onDelta!('one ');await req.onDelta!('two');return 'one two';}},silent).tick();
 const app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent});try{const url=await app.listen({host:'127.0.0.1',port:0});const response=await fetch(`${url}/v1/runs/${r.id}/events`,{headers:{cookie:`fr_session=${a.session.sessionToken}`}});const stream=await response.text();assert.equal(response.status,200);assert.ok(stream.includes('event: delta'));assert.ok(stream.includes('one two'));assert.ok(stream.includes('event: done'));const other=await account(db);assert.equal((await fetch(`${url}/v1/runs/${r.id}/events`,{headers:{cookie:`fr_session=${other.session.sessionToken}`}})).status,404);}finally{await app.close();}
});
test('BIL-003 Paddle signature validates raw bytes and rejects stale, future, tampered and unsigned bodies',()=>{
 const body='{"event_id":"evt_fixture"}';verifyPaddleSignature(body,signWebhook(body),['test-webhook-destination-secret']);
 for(const signature of ['bad',signWebhook(body,'wrong-secret-123456'),signWebhook(body,'test-webhook-destination-secret',Math.floor(Date.now()/1000)-30),signWebhook(body,'test-webhook-destination-secret',Math.floor(Date.now()/1000)+30)])assert.throws(()=>verifyPaddleSignature(body,signature,['test-webhook-destination-secret']));
 assert.throws(()=>verifyPaddleSignature(body+' ',signWebhook(body),['test-webhook-destination-secret']));
});
test('BIL-002/008 checkout uses verified server prices, rejects unapproved countries and reuses its intent',async()=>{
 const a=await account(db);let creates=0;const gateway=merchant((async(url:any)=>String(url).includes('/prices/')?Response.json({data:{status:'active',unit_price:{currency_code:'USD',amount:'1900'},billing_cycle:{interval:'month',frequency:1}}}):(++creates,Response.json({data:{id:'txn_'+id(),checkout:{url:'https://checkout.paddle.com/fixture'}}}))) as typeof fetch);
 await assert.rejects(gateway.checkout(a.p,'pro','month','XX','checkout-invalid-country'),codeError('COUNTRY_NOT_SUPPORTED'));
 const one=await gateway.checkout(a.p,'pro','month','IN','checkout-valid-1');assert.equal((await gateway.checkout(a.p,'pro','month','IN','checkout-valid-1')).url,one.url);assert.equal(creates,1);
 await assert.rejects(gateway.checkout(a.p,'premium','month','IN','checkout-valid-1'),codeError('IDEMPOTENCY_CONFLICT'));
});
test('BIL-003/004/005 confirmed signed payment grants once; checkout or active update alone grants nothing',async()=>{
 const a=await account(db),txn='txn_'+id(),subscription='sub_'+id(),gateway=merchant((async(url:any)=>String(url).includes('/prices/')?Response.json({data:{status:'active',unit_price:{currency_code:'USD',amount:'1900'},billing_cycle:{interval:'month',frequency:1}}}):Response.json({data:{id:txn,checkout:{url:'https://checkout.paddle.com/fixture'}}})) as typeof fetch);
 await gateway.checkout(a.p,'pro','month','IN','confirmed-checkout-1');assert.equal((await new BillingService(db).get(a.p)).length,0);
 const start=new Date(Date.now()-1000).toISOString(),end=new Date(Date.now()+86400000).toISOString(),event={event_id:'evt_'+id(),event_type:'transaction.completed',occurred_at:new Date().toISOString(),data:{id:txn,status:'completed',subscription_id:subscription,customer_id:'ctm_'+id(),items:[{quantity:1,price:{id:'pri_pro_month'}}],billing_period:{starts_at:start,ends_at:end}}};
 const body=JSON.stringify(event);await gateway.webhook(body,signWebhook(body));await gateway.webhook(body,signWebhook(body));
 assert.equal((await new QuotaService(db).balances(a.p)).filter(r=>r.period_key.startsWith('subscription:'))[0].granted,50);
 const update=JSON.stringify({event_id:'evt_'+id(),event_type:'subscription.updated',occurred_at:new Date(Date.now()+1000).toISOString(),data:{id:subscription,status:'active',current_billing_period:{starts_at:end,ends_at:new Date(Date.now()+172800000).toISOString()}}});await gateway.webhook(update,signWebhook(update));
 assert.equal((await new QuotaService(db).balances(a.p)).filter(r=>r.period_key.startsWith('subscription:')).length,1);
 const unknown=JSON.stringify({...event,event_id:'evt_'+id(),data:{...event.data,id:'txn_unbound',subscription_id:'sub_unbound'}});await assert.rejects(gateway.webhook(unknown,signWebhook(unknown)),codeError('UNBOUND_PAYMENT_EVENT'));
});
test('BIL-003 webhook API verifies the untouched raw body before processing',async()=>{
 const gateway=merchant((async()=>Response.json({data:{}})) as typeof fetch),app=await buildApi({db,objects,origin:'http://localhost:3001',merchant:gateway,telemetry:silent});try{const body=JSON.stringify({event_id:'evt_'+id(),event_type:'ignored.fixture',occurred_at:new Date().toISOString(),data:{}});assert.equal((await app.inject({method:'POST',url:'/webhooks/paddle',headers:{'content-type':'application/json','paddle-signature':signWebhook(body)},payload:body})).statusCode,200);assert.equal((await app.inject({method:'POST',url:'/webhooks/paddle',headers:{'content-type':'application/json','paddle-signature':'invalid'},payload:body})).statusCode,401);}finally{await app.close();}
});
test('RUN-005/008 execution admission enforces 10,000 characters, daily limits, fair lanes and tenant reads',async()=>{
 const a=await account(db),b=await account(db),executions=new ExecutionService(db,secret);await db.query('UPDATE runtime_controls SET runner_enabled=true WHERE id=1');
 await assert.rejects(executions.create(a.p,'Python','x'.repeat(10001),'runner-over-limit'),codeError('EXECUTION_INPUT_LIMIT'));
 const first=await executions.create(a.p,'Python','print(1)','runner-valid-1');await executions.create(a.p,'Python','print(2)','runner-valid-2');await assert.rejects(executions.create(a.p,'Python','print(3)','runner-valid-3'),codeError('RUNNER_BACKLOG_FULL'));await db.query("UPDATE execution_jobs SET state='completed' WHERE id=$1",[first.id]);await executions.create(a.p,'Python','print(3)','runner-valid-3');await db.query("UPDATE execution_jobs SET state='completed' WHERE workspace_id=$1 AND request_key='runner-valid-2'",[a.p.workspaceId]);await assert.rejects(executions.create(a.p,'Python','print(4)','runner-valid-4'),codeError('ANONYMOUS_DAILY_LIMIT'));
 await executions.create(b.p,'JavaScript','console.log(1)','runner-other-1');const one=await executions.claim(),two=await executions.claim();assert.notEqual(one!.workspace_id,two!.workspace_id);
 assert.equal((await executions.get(a.p,first.id)).id,first.id);await assert.rejects(executions.get(b.p,first.id),codeError('NOT_FOUND'));
});
