import {SESv2Client,SendEmailCommand} from '@aws-sdk/client-sesv2';
import type {z} from 'zod/v4';
import {supportDeliveryEventSchema} from './support-contracts.js';
import type {Db} from './db.js';
import {audit,fail,hash,lock,scope,type Principal} from './common.js';
import {constantEqual,mac} from './crypto.js';
import {enqueue,type Job} from './jobs.js';

export interface SupportAcknowledgement {
 ticketId:string;generation:number;idempotencyKey:string;email:string;signal:AbortSignal;
}
export interface SupportSender {sendAcknowledgement(input:SupportAcknowledgement):Promise<{messageId:string}>}
export class SupportSendFailure extends Error {
 constructor(public outcome:'not_sent'|'rejected'|'unknown',public code='SUPPORT_SEND_FAILED'){super(code);}
}

/** SES has no send-email idempotency key. Disable SDK retries; the durable fence
 * deliberately holds unknown outcomes instead of risking a second email. */
export class SesSupportSender implements SupportSender {
 constructor(private from:string,region:string,private client=new SESv2Client({region,maxAttempts:1}),private configurationSet?:string) {
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from))throw new Error('Set a verified support sender email.');
 }
 async sendAcknowledgement(input:SupportAcknowledgement){
  try{
   const result=await this.client.send(new SendEmailCommand({FromEmailAddress:this.from,...(this.configurationSet?{ConfigurationSetName:this.configurationSet}:{}),Destination:{ToAddresses:[input.email]},
    EmailTags:[{Name:'support_ticket',Value:input.ticketId},{Name:'support_generation',Value:String(input.generation)}],
    Content:{Simple:{Subject:{Data:'We received your FutureRobotic AI support request'},Body:{Text:{Data:`Your support request ${input.ticketId} has been received. Keep this reference for follow-up. This acknowledgement does not include your private request or code.`}}}}}),{abortSignal:input.signal});
   if(!result.MessageId)throw new SupportSendFailure('unknown','SUPPORT_SEND_OUTCOME_UNKNOWN');
   return {messageId:result.MessageId};
  }catch(error){
   if(error instanceof SupportSendFailure)throw error;
   const value=error as {name?:string;$metadata?:{httpStatusCode?:number}};
   if(['MessageRejected','MailFromDomainNotVerifiedException','AccountSuspendedException','SendingPausedException','AccessDeniedException','TooManyRequestsException'].includes(value.name??'')&&[400,403,429].includes(value.$metadata?.httpStatusCode??0))throw new SupportSendFailure('rejected','SUPPORT_SEND_REJECTED');
   throw new SupportSendFailure('unknown','SUPPORT_SEND_OUTCOME_UNKNOWN');
  }
 }
}


type DeliveryEvent=z.infer<typeof supportDeliveryEventSchema>;
const terminal=['sent','delivered','bounced','complained','suppressed'];
const safeCode=(value:string)=>/^[A-Z0-9_]{1,80}$/.test(value)?value:'SUPPORT_SEND_FAILED';

export function verifySupportSignature(body:string,signature:string|undefined,secrets:readonly string[],now=Date.now()) {
 if(!secrets.length||secrets.some(secret=>secret.length<32))fail('SUPPORT_EVENTS_NOT_CONFIGURED',503);
 const parsed=/^ts=(\d{10});h1=([a-f0-9]{64})$/.exec(signature??'');
 if(!parsed||Math.abs(now-Number(parsed[1])*1000)>300000||!secrets.some(secret=>constantEqual(mac(secret,`${parsed[1]}:${body}`),parsed[2])))fail('INVALID_SUPPORT_EVENT_SIGNATURE',401);
}

export class SupportDeliveryService {
 constructor(private db:Db){}
 async status(p:Principal,ticketId:string){
  await scope(this.db,p);
  const row=(await this.db.query('SELECT d.ticket_id AS "ticketId",d.state,d.attempts,d.last_error AS "lastError",d.updated_at AS "updatedAt",d.delivered_at AS "deliveredAt" FROM support_deliveries d JOIN support_tickets t ON t.id=d.ticket_id WHERE t.id=$1 AND t.workspace_id=$2 AND t.owner_id=$3',[ticketId,p.workspaceId,p.userId])).rows[0];
  if(!row)fail('NOT_FOUND',404);return row;
 }
 async dispatch(job:Job,sender:SupportSender|null|undefined,timeoutMs=30000){
  const ticketId=String(job.payload.ticketId??'');
  const claimed=await this.db.transaction(async tx=>{
   const lease=await tx.query("SELECT id FROM jobs WHERE id=$1 AND lease_token=$2 AND status='running' AND lease_until>now() FOR UPDATE",[job.id,job.lease_token]);
   if(!lease.rowCount)fail('JOB_LEASE_LOST',409);
   const row=(await tx.query('SELECT d.*,t.owner_id,t.workspace_id,t.status AS ticket_status,u.email,u.status AS user_status FROM support_deliveries d JOIN support_tickets t ON t.id=d.ticket_id JOIN users u ON u.id=t.owner_id WHERE d.ticket_id=$1 FOR UPDATE OF d',[ticketId])).rows[0];
   if(!row)return null;
   if(terminal.includes(row.state))return null;
   if(row.state==='sending'||row.state==='uncertain'){
    await tx.query("UPDATE support_deliveries SET state='uncertain',last_error='SUPPORT_SEND_OUTCOME_UNKNOWN',updated_at=now() WHERE ticket_id=$1",[ticketId]);return null;
   }
   if(row.state==='dead')return null;
   if(row.user_status!=='active'||row.ticket_status!=='open'){
    await tx.query("UPDATE support_deliveries SET state='suppressed',last_error='SUPPORT_TICKET_INACTIVE',updated_at=now() WHERE ticket_id=$1",[ticketId]);return null;
   }
   if(!sender)fail('SUPPORT_SENDER_NOT_CONFIGURED',503);
   await tx.query("UPDATE support_deliveries SET state='sending',attempts=attempts+1,send_started_at=now(),last_error=NULL,updated_at=now() WHERE ticket_id=$1",[ticketId]);return row;
  });
  if(!claimed)return;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new SupportSendFailure('unknown','SUPPORT_SEND_OUTCOME_UNKNOWN'));},timeoutMs);});
   const result=await Promise.race([sender!.sendAcknowledgement({ticketId,generation:claimed.generation,idempotencyKey:`support-ack:${ticketId}:${claimed.generation}`,email:claimed.email,signal:controller.signal}),deadline]);
   if(!result||typeof result.messageId!=='string'||!result.messageId||result.messageId.length>200)throw new SupportSendFailure('unknown','SUPPORT_SEND_OUTCOME_UNKNOWN');
   await this.db.transaction(async tx=>{
    await tx.query("UPDATE support_deliveries SET provider_message_id=coalesce(provider_message_id,$3),state=CASE WHEN state IN('sending','uncertain') THEN 'sent' ELSE state END,last_error=CASE WHEN state IN('bounced','complained') THEN last_error ELSE NULL END,updated_at=now() WHERE ticket_id=$1 AND generation=$2 AND state IN('sending','uncertain','sent','delivered','bounced','complained')",[ticketId,claimed.generation,result.messageId]);
    await audit(tx,{userId:claimed.owner_id,workspaceId:claimed.workspace_id,sessionId:''},'support.acknowledged',ticketId,job.trace_id,{generation:claimed.generation});
   });
  }catch(error){
   const failure=error instanceof SupportSendFailure?error:new SupportSendFailure('unknown','SUPPORT_SEND_OUTCOME_UNKNOWN');
   const safe=failure.outcome==='not_sent'||failure.outcome==='rejected';
   await this.db.query("UPDATE support_deliveries SET state=$3,last_error=$4,updated_at=now() WHERE ticket_id=$1 AND generation=$2 AND state='sending'",[ticketId,claimed.generation,safe?(job.attempts>=job.max_attempts?'dead':'queued'):'uncertain',safeCode(failure.code)]);
   if(safe)fail(safeCode(failure.code),503);
   // Queue completes; unknown delivery remains inspectable and cannot resend.
  }finally{if(timer)clearTimeout(timer);}
 }
 async failedJob(job:Job,code:string){
  await this.db.query("UPDATE support_deliveries SET state=CASE WHEN $2 THEN 'dead' ELSE state END,last_error=$3,updated_at=now() WHERE ticket_id=$1 AND state='queued'",[job.payload.ticketId,job.attempts>=job.max_attempts,safeCode(code)]);
 }
 async retry(p:Principal,ticketId:string,key:string,trace:string){
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('INVALID_IDEMPOTENCY_KEY');
  return this.db.transaction(async tx=>{
   await scope(tx,p);await lock(tx,`support-delivery:${ticketId}`);
   const previous=(await tx.query('SELECT job_id FROM support_delivery_actions WHERE ticket_id=$1 AND request_key=$2 AND actor_id=$3',[ticketId,key,p.userId])).rows[0];
   if(previous)return {jobId:previous.job_id as string,replayed:true};
   const row=(await tx.query('SELECT d.*,t.status AS ticket_status,u.status AS user_status FROM support_deliveries d JOIN support_tickets t ON t.id=d.ticket_id JOIN users u ON u.id=t.owner_id WHERE d.ticket_id=$1 FOR UPDATE OF d',[ticketId])).rows[0];
   if(!row)fail('NOT_FOUND',404);
   if(row.state==='sending'||row.state==='uncertain')fail('SUPPORT_OUTCOME_UNCONFIRMED',409);
   if(row.state!=='dead')fail('SUPPORT_NOT_RETRYABLE',409);
   if(row.ticket_status!=='open'||row.user_status!=='active')fail('SUPPORT_TICKET_INACTIVE',409);
   const generation=Number(row.generation)+1;
   await tx.query("UPDATE support_deliveries SET state='queued',generation=$2,provider_message_id=NULL,last_error=NULL,send_started_at=NULL,updated_at=now() WHERE ticket_id=$1",[ticketId,generation]);
   const jobId=await enqueue(tx,'support_ack',`support-ack:${ticketId}:${generation}`,{ticketId},trace);
   await tx.query('INSERT INTO support_delivery_actions(ticket_id,request_key,actor_id,job_id) VALUES($1,$2,$3,$4)',[ticketId,key,p.userId,jobId]);
   await audit(tx,p,'support.acknowledgement_retried',ticketId,trace,{generation});
   return {jobId,replayed:false};
  });
 }
 async ingest(body:string,signature:string|undefined,secrets:readonly string[]){
  if(Buffer.byteLength(body)>8192)fail('SUPPORT_EVENT_TOO_LARGE',413);
  verifySupportSignature(body,signature,secrets);
  let event:DeliveryEvent;try{event=supportDeliveryEventSchema.parse(JSON.parse(body));}catch{return fail('INVALID_SUPPORT_EVENT');}
  if(Date.parse(event.occurredAt)>Date.now()+300000)fail('INVALID_SUPPORT_EVENT');
  const fingerprint=hash(body);
  return this.db.transaction(async tx=>{
   await lock(tx,`support-event:${event.eventId}`);
   const previous=(await tx.query('SELECT body_sha256 FROM support_delivery_events WHERE event_id=$1',[event.eventId])).rows[0];
   if(previous){if(previous.body_sha256!==fingerprint)fail('SUPPORT_EVENT_CONFLICT',409);return {received:true as const,replayed:true};}
   const current=(await tx.query('SELECT * FROM support_deliveries WHERE ticket_id=$1 FOR UPDATE',[event.ticketId])).rows[0];
   if(!current)fail('NOT_FOUND',404);
   if(Number(current.generation)!==event.generation)fail('SUPPORT_EVENT_GENERATION_CONFLICT',409);
   if(current.provider_message_id&&current.provider_message_id!==event.providerMessageId)fail('SUPPORT_EVENT_MESSAGE_CONFLICT',409);
   if(current.state==='suppressed')fail('SUPPORT_TICKET_INACTIVE',409);
   await tx.query('INSERT INTO support_delivery_events(event_id,ticket_id,generation,provider_message_id,event_kind,body_sha256,occurred_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[event.eventId,event.ticketId,event.generation,event.providerMessageId,event.status,fingerprint,event.occurredAt]);
   const priority:Record<string,number>={sent:1,delivered:2,bounced:3,complained:4};
   const next=(priority[event.status]??0)>=(priority[current.state]??0)?event.status:current.state;
   await tx.query("UPDATE support_deliveries SET provider_message_id=coalesce(provider_message_id,$2),state=$3,last_error=CASE WHEN $3 IN('bounced','complained') THEN 'SUPPORT_DELIVERY_FAILED' ELSE NULL END,delivered_at=CASE WHEN $4='delivered' THEN coalesce(delivered_at,$5) ELSE delivered_at END,updated_at=now() WHERE ticket_id=$1",[event.ticketId,event.providerMessageId,next,event.status,event.occurredAt]);
   await audit(tx,null,'support.delivery_event',event.ticketId,'support-event',{status:event.status,generation:event.generation});
   return {received:true as const,replayed:false};
  });
 }
}
