import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import type {SESv2Client} from '@aws-sdk/client-sesv2';
import type {Db} from '../src/db.js';
import {AppError,id} from '../src/common.js';
import {mac,Sealer,totp} from '../src/crypto.js';
import {migrate} from '../src/migrate.js';
import {AccountService} from '../src/account-services.js';
import {Worker} from '../src/worker.js';
import {JobQueue} from '../src/jobs.js';
import {SupportDeliveryService,SupportSendFailure,SesSupportSender,verifySupportSignature,type SupportSender,type SupportAcknowledgement} from '../src/support-delivery.js';
import {buildApi} from '../src/api.js';
import {account,authHeaders,silent,LocalObjects,testDatabase} from './support.js';

let db:Db,root:string,objects:LocalObjects,dispose:()=>Promise<void>;
const eventSecret='support-event-fixture-only-secret-32-characters',sealer=new Sealer(Buffer.alloc(32,19).toString('base64'));
const isCode=(code:string)=>(error:unknown)=>error instanceof AppError&&error.code===code;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-support-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
beforeEach(async()=>{await db.query("UPDATE jobs SET status='completed',lease_token=NULL,lease_until=NULL WHERE status<>'completed'");});
async function ticket(label='request'){
 const a=await account(db,label),accounts=new AccountService(db),t=await accounts.ticket(a.p,'Help '+label,'PRIVATE_SUPPORT_CONTENT '+label,'support-request-'+id());
 return {...a,t,accounts};
}
async function current(ticketId:string){return (await db.query('SELECT * FROM support_deliveries WHERE ticket_id=$1',[ticketId])).rows[0];}
function signature(body:string,when=Math.floor(Date.now()/1000)){return `ts=${when};h1=${mac(eventSecret,`${when}:${body}`)}`;}
function event(ticketId:string,status='delivered',extra:Record<string,unknown>={}){return JSON.stringify({eventId:'event-'+id(),ticketId,generation:1,providerMessageId:'message-'+ticketId,status,occurredAt:new Date().toISOString(),...extra});}

test('WEB-010 support requests and acknowledgement jobs are atomic/idempotent and retain ownership',async()=>{
 const a=await account(db),accounts=new AccountService(db),key='same-support-request';
 const replies=await Promise.all(Array.from({length:5},()=>accounts.ticket(a.p,'One request','A sufficiently detailed private request',key)));
 assert.equal(new Set(replies.map(r=>r.id)).size,1);const tid=replies[0].id;
 assert.equal((await db.query('SELECT count(*)::int AS n FROM support_deliveries WHERE ticket_id=$1',[tid])).rows[0].n,1);
 const jobs=(await db.query("SELECT payload FROM jobs WHERE kind='support_ack' AND payload->>'ticketId'=$1",[tid])).rows;
 assert.equal(jobs.length,1);assert.deepEqual(jobs[0].payload,{ticketId:tid});
 await assert.rejects(accounts.ticket(a.p,'Changed request','A sufficiently detailed private request',key),isCode('IDEMPOTENCY_CONFLICT'));
 const other=await account(db);const second=await accounts.ticket(other.p,'One request','A sufficiently detailed private request',key);assert.notEqual(second.id,tid);
 const delivery=new SupportDeliveryService(db);assert.equal((await delivery.status(a.p,tid)).state,'queued');await assert.rejects(delivery.status(other.p,tid),isCode('NOT_FOUND'));
 assert.equal(JSON.stringify(await delivery.status(a.p,tid)).includes('private request'),false);
});
test('WEB-010 support rate cap is durable; exact replays do not consume another send slot',async()=>{
 const a=await account(db),accounts=new AccountService(db);
 for(let i=0;i<5;i++)await accounts.ticket(a.p,'Help','A private support message '+i,'rate-support-'+i);
 await assert.rejects(accounts.ticket(a.p,'Help','A private support message sixth','rate-support-sixth'),isCode('SUPPORT_RATE_LIMIT'));
 await accounts.ticket(a.p,'Help','A private support message 0','rate-support-0');
 assert.equal((await db.query('SELECT count(*)::int AS n FROM support_tickets WHERE owner_id=$1',[a.p.userId])).rows[0].n,5);
});
test('WEB-010 worker sends one bounded acknowledgement; a replayed queue job never sends again',async()=>{
 const a=await ticket(),calls:SupportAcknowledgement[]=[];
 const sender:SupportSender={async sendAcknowledgement(input){calls.push(input);return {messageId:'provider-'+a.t.id};}};
 const worker=new Worker(db,objects,null,silent,100,sender);assert.equal(await worker.tick(),true);assert.equal((await current(a.t.id)).state,'sent');
 assert.equal(calls.length,1);assert.equal(calls[0].email,(await db.query('SELECT email FROM users WHERE id=$1',[a.p.userId])).rows[0].email);
 assert.equal(calls[0].idempotencyKey,`support-ack:${a.t.id}:1`);assert.equal(JSON.stringify(calls[0]).includes('PRIVATE_SUPPORT_CONTENT'),false);
 await db.query("UPDATE jobs SET status='queued',available_at=now() WHERE kind='support_ack' AND payload->>'ticketId'=$1",[a.t.id]);await worker.tick();assert.equal(calls.length,1);
});
test('WEB-010 definitive rejection retries boundedly; unknown outcome is held without resend',async()=>{
 const a=await ticket(),delivery=new SupportDeliveryService(db);let calls=0;
 const worker=new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){calls++;if(calls<3)throw new SupportSendFailure('rejected','SUPPORT_SEND_REJECTED');return {messageId:'accepted-'+a.t.id};}});
 for(let i=0;i<3;i++){await db.query("UPDATE jobs SET available_at=now() WHERE kind='support_ack' AND payload->>'ticketId'=$1",[a.t.id]);await worker.tick();}
 assert.equal(calls,3);assert.equal((await current(a.t.id)).state,'sent');
 const b=await ticket('unknown');let uncertainCalls=0;
 const uncertain=new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){uncertainCalls++;throw new Error('Private remote diagnostic must not leak');}});
 await uncertain.tick();assert.equal((await current(b.t.id)).state,'uncertain');assert.equal((await current(b.t.id)).last_error,'SUPPORT_SEND_OUTCOME_UNKNOWN');
 await db.query("UPDATE jobs SET status='queued',available_at=now() WHERE kind='support_ack' AND payload->>'ticketId'=$1",[b.t.id]);await uncertain.tick();assert.equal(uncertainCalls,1);
 await assert.rejects(delivery.retry(a.p,b.t.id,'no-blind-resend-key','fixture'),isCode('SUPPORT_OUTCOME_UNCONFIRMED'));
});
test('WEB-010 unconfigured sender exhausts safely; explicit stopped-job recovery is idempotent',async()=>{
 const a=await ticket();await db.query("UPDATE jobs SET max_attempts=1 WHERE kind='support_ack' AND payload->>'ticketId'=$1",[a.t.id]);
 await new Worker(db,objects,null,silent).tick();assert.equal((await current(a.t.id)).state,'dead');assert.equal((await current(a.t.id)).last_error,'SUPPORT_SENDER_NOT_CONFIGURED');
 const service=new SupportDeliveryService(db),retry=await service.retry(a.p,a.t.id,'explicit-recovery-key','fixture');
 const replay=await service.retry(a.p,a.t.id,'explicit-recovery-key','fixture');assert.equal(replay.jobId,retry.jobId);assert.equal(replay.replayed,true);assert.equal((await current(a.t.id)).generation,2);
 let calls=0;await new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){calls++;return {messageId:'recovered-'+a.t.id};}}).tick();assert.equal(calls,1);assert.equal((await current(a.t.id)).state,'sent');
 await assert.rejects(service.retry(a.p,a.t.id,'unsafe-second-key','fixture'),isCode('SUPPORT_NOT_RETRYABLE'));
});
test('WEB-010 deadline and crashed send fence preserve unknown acceptance without duplicate sends',async()=>{
 const a=await ticket();let signal:AbortSignal|undefined,calls=0;
 await new Worker(db,objects,null,silent,5,{async sendAcknowledgement(input){calls++;signal=input.signal;return new Promise(()=>{});}}).tick();assert.equal(signal!.aborted,true);assert.equal((await current(a.t.id)).state,'uncertain');assert.equal(calls,1);
 const b=await ticket('crashed');await db.query("UPDATE support_deliveries SET state='sending' WHERE ticket_id=$1",[b.t.id]);
 await new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){calls++;return {messageId:'must-not-send'};}}).tick();assert.equal((await current(b.t.id)).state,'uncertain');assert.equal(calls,1);
});
test('WEB-010 closed/deleted user tickets suppress mail without persisting recipient or ticket content in outbox',async()=>{
 const a=await ticket();await db.query("UPDATE users SET status='deleting' WHERE id=$1",[a.p.userId]);let calls=0;
 await new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){calls++;return {messageId:'must-not-send'};}}).tick();assert.equal(calls,0);assert.equal((await current(a.t.id)).state,'suppressed');
 const b=await ticket('closed');await db.query("UPDATE support_tickets SET status='closed' WHERE id=$1",[b.t.id]);await new Worker(db,objects,null,silent,100,{async sendAcknowledgement(){calls++;return {messageId:'must-not-send'};}}).tick();assert.equal(calls,0);assert.equal((await current(b.t.id)).state,'suppressed');
 assert.equal(JSON.stringify(await current(b.t.id)).includes('PRIVATE_SUPPORT_CONTENT'),false);
});
test('AWS-012 signed delivery events are authentic, replay-safe, bounded and monotonic',async()=>{
 const a=await ticket(),service=new SupportDeliveryService(db);await db.query("UPDATE support_deliveries SET state='uncertain' WHERE ticket_id=$1",[a.t.id]);
 const body=event(a.t.id);assert.deepEqual(await service.ingest(body,signature(body),[eventSecret]),{received:true,replayed:false});assert.equal((await current(a.t.id)).state,'delivered');
 assert.deepEqual(await service.ingest(body,signature(body),[eventSecret]),{received:true,replayed:true});
 await assert.rejects(service.ingest(body+' ',signature(body),[eventSecret]),isCode('INVALID_SUPPORT_EVENT_SIGNATURE'));
 const conflict=body.replace('delivered','bounced');await assert.rejects(service.ingest(conflict,signature(conflict),[eventSecret]),isCode('SUPPORT_EVENT_CONFLICT'));
 const bounce=event(a.t.id,'bounced');await service.ingest(bounce,signature(bounce),[eventSecret]);const older=event(a.t.id,'delivered',{occurredAt:new Date(Date.now()-100000).toISOString()});await service.ingest(older,signature(older),[eventSecret]);assert.equal((await current(a.t.id)).state,'bounced');
 const wrongGeneration=event(a.t.id,'sent',{generation:2});await assert.rejects(service.ingest(wrongGeneration,signature(wrongGeneration),[eventSecret]),isCode('SUPPORT_EVENT_GENERATION_CONFLICT'));
 const wrongMessage=event(a.t.id,'sent',{providerMessageId:'different-message'});await assert.rejects(service.ingest(wrongMessage,signature(wrongMessage),[eventSecret]),isCode('SUPPORT_EVENT_MESSAGE_CONFLICT'));
 await assert.rejects(db.query('DELETE FROM support_delivery_events WHERE ticket_id=$1',[a.t.id]),/append-only/);
});
test('AWS-012 event verification denies missing/weak configuration, stale/future signatures and malformed data',async()=>{
 const a=await ticket(),service=new SupportDeliveryService(db),body=event(a.t.id);
 assert.throws(()=>verifySupportSignature(body,signature(body),[]),isCode('SUPPORT_EVENTS_NOT_CONFIGURED'));
 assert.throws(()=>verifySupportSignature(body,signature(body),['weak']),isCode('SUPPORT_EVENTS_NOT_CONFIGURED'));
 assert.throws(()=>verifySupportSignature(body,undefined,[eventSecret]),isCode('INVALID_SUPPORT_EVENT_SIGNATURE'));
 for(const delta of [-301,301])assert.throws(()=>verifySupportSignature(body,signature(body,Math.floor(Date.now()/1000)+delta),[eventSecret]),isCode('INVALID_SUPPORT_EVENT_SIGNATURE'));
 await assert.rejects(service.ingest('{bad',signature('{bad'),[eventSecret]),isCode('INVALID_SUPPORT_EVENT'));
 const oversized='x'.repeat(8193);await assert.rejects(service.ingest(oversized,signature(oversized),[eventSecret]),isCode('SUPPORT_EVENT_TOO_LARGE'));
 const future=event(a.t.id,'sent',{occurredAt:new Date(Date.now()+3600000).toISOString()});await assert.rejects(service.ingest(future,signature(future),[eventSecret]),isCode('INVALID_SUPPORT_EVENT'));
});
test('AWS-012 a bounce arriving while send finishes never gets downgraded or loses failure status',async()=>{
 const a=await ticket(),service=new SupportDeliveryService(db);let release!:(value:{messageId:string})=>void,started!:(value:void)=>void;
 const ready=new Promise<void>(resolve=>{started=resolve;});const accepted=new Promise<{messageId:string}>(resolve=>{release=resolve;});
 const queue=new JobQueue(db),job=await queue.claim();assert.ok(job);
 const sent=service.dispatch(job,{async sendAcknowledgement(){started();return accepted;}},1000);await ready;
 const body=event(a.t.id,'bounced');await service.ingest(body,signature(body),[eventSecret]);release({messageId:'message-'+a.t.id});await sent;
 assert.equal((await current(a.t.id)).state,'bounced');assert.equal((await current(a.t.id)).last_error,'SUPPORT_DELIVERY_FAILED');
});
test('WEB-010 SES adapter emits constant acknowledgement and tags, never raw support text; errors are conservative',async()=>{
 let captured:any;const fake={async send(command:any,options:any){captured={command:command.input,options};return {MessageId:'ses-fixture-id'};}} as unknown as SESv2Client;
 const sender=new SesSupportSender('verified@example.com','ap-south-1',fake),input={ticketId:id(),generation:1,idempotencyKey:'one-logical-acknowledgement',email:'recipient@example.com',signal:new AbortController().signal};
 assert.deepEqual(await sender.sendAcknowledgement(input),{messageId:'ses-fixture-id'});assert.equal(captured.command.Destination.ToAddresses[0],input.email);assert.equal(captured.command.EmailTags[0].Value,input.ticketId);assert.equal(captured.options.abortSignal,input.signal);
 const rejected=new SesSupportSender('verified@example.com','ap-south-1',{async send(){throw {name:'TooManyRequestsException',$metadata:{httpStatusCode:429}};}} as unknown as SESv2Client);
 await assert.rejects(rejected.sendAcknowledgement(input),(e:unknown)=>e instanceof SupportSendFailure&&e.outcome==='rejected');
 const unknown=new SesSupportSender('verified@example.com','ap-south-1',{async send(){throw {name:'InternalServerError',$metadata:{httpStatusCode:500}};}} as unknown as SESv2Client);
 await assert.rejects(unknown.sendAcknowledgement(input),(e:unknown)=>e instanceof SupportSendFailure&&e.outcome==='unknown');
});
test('WEB-010 support delivery HTTP routes preserve authentication, ownership, CSRF and fresh operator MFA',async()=>{
 const a=await ticket(),b=await account(db),app=await buildApi({db,objects,origin:'http://localhost:3001',telemetry:silent,sealer,...({supportEventSecrets:[eventSecret]} as {})});
 try{
  assert.equal((await app.inject({url:`/v1/support/${a.t.id}/delivery`,headers:authHeaders(a.session)})).statusCode,200);
  assert.equal((await app.inject({url:`/v1/support/${a.t.id}/delivery`,headers:authHeaders(b.session)})).statusCode,404);
  assert.equal((await app.inject({url:`/v1/support/${a.t.id}/delivery`})).statusCode,401);
  const retryUrl=`/v1/operator/support/${a.t.id}/retry`;
  assert.equal((await app.inject({method:'POST',url:retryUrl,headers:authHeaders(b.session,'ordinary-retry-key'),payload:{}})).statusCode,403);
  const seed=Buffer.from('12345678901234567890');await db.query("INSERT INTO operators(user_id,role,totp_cipher,enabled) VALUES($1,'support',$2,true)",[b.p.userId,sealer.seal(seed.toString('base64'))]);
  await db.query("UPDATE support_deliveries SET state='dead' WHERE ticket_id=$1",[a.t.id]);const code=totp(seed,Math.floor(Date.now()/30000));
  const headers={...authHeaders(b.session,'operator-retry-key'),'x-mfa-code':code};
  const missingCsrf={...headers,'x-csrf-token':''};assert.equal((await app.inject({method:'POST',url:retryUrl,headers:missingCsrf,payload:{}})).statusCode,403);
  const retried=await app.inject({method:'POST',url:retryUrl,headers,payload:{}});assert.equal(retried.statusCode,200,retried.body);assert.equal(retried.json().data.replayed,false);
  assert.equal((await app.inject({method:'POST',url:retryUrl,headers,payload:{}})).statusCode,403);
  const body=event(a.t.id,'delivered',{generation:2});assert.equal((await app.inject({method:'POST',url:'/webhooks/support-delivery',headers:{'x-support-signature':signature(body),'content-type':'application/json'},payload:body})).statusCode,200);
  assert.equal((await app.inject({method:'POST',url:'/webhooks/support-delivery',headers:{'x-support-signature':'forged'},payload:JSON.parse(body)})).statusCode,401);
 }finally{await app.close();}
});
