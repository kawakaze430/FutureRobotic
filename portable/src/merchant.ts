import {createHmac} from 'node:crypto';
import type {Db} from './db.js';
import {audit,fail,hash,id,lock,scope,type Principal} from './common.js';
import {constantEqual} from './crypto.js';
import {BillingService,type VerifiedBillingEvent} from './billing.js';
import {boundedJson} from './public-auth.js';
import {planCatalog} from './product-policy.js';
export function verifyPaddleSignature(body:string,header:string,secrets:string[],now=Date.now()){
 const parts=header.split(';').map(x=>x.trim().split('=')),timestamps=parts.filter(x=>x[0]==='ts'),signatures=parts.filter(x=>x[0]==='h1').map(x=>x[1]);
 if(timestamps.length!==1||!/^\d{10,11}$/.test(timestamps[0][1]??'')||Math.abs(Math.floor(now/1000)-Number(timestamps[0][1]))>5||!signatures.length||body.length>200000)fail('INVALID_WEBHOOK_SIGNATURE',401);
 const payload=`${timestamps[0][1]}:${body}`;
 if(!secrets.some(secret=>secret.length>=16&&signatures.some(sig=>/^[a-f0-9]{64}$/.test(sig)&&constantEqual(createHmac('sha256',secret).update(payload).digest('hex'),sig))))fail('INVALID_WEBHOOK_SIGNATURE',401);
}
export interface MerchantConfig {mode:'sandbox'|'live';apiKey:string;webhookSecrets:string[];approved:boolean;countries:string[];priceIds:Record<string,string>;origin:string}
export class PaddleGateway {
 readonly approved:boolean;private base:string;
 constructor(private db:Db,private config:MerchantConfig,private http:typeof fetch=fetch){this.approved=config.approved;this.base=config.mode==='live'?'https://api.paddle.com':'https://sandbox-api.paddle.com';}
 private async request(path:string,method='GET',body?:unknown){
  if(!this.approved||!this.config.apiKey)fail('BILLING_NOT_APPROVED',503);
  const response=await this.http(this.base+path,{method,headers:{authorization:`Bearer ${this.config.apiKey}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok)return fail('MERCHANT_REQUEST_FAILED',503);return (await boundedJson(response,200000)).data;
 }
 private safeUrl(value:unknown){if(typeof value!=='string')return fail('INVALID_CHECKOUT_RESPONSE',503);const u=new URL(value);if(u.protocol!=='https:'||![new URL(this.config.origin).hostname,'checkout.paddle.com','sandbox-checkout.paddle.com','customer-portal.paddle.com','sandbox-customer-portal.paddle.com'].includes(u.hostname))return fail('INVALID_CHECKOUT_RESPONSE',503);return u.toString();}
 async checkout(p:Principal,plan:'pro'|'premium',interval:'month'|'year',country:string,key:string){
  if(!this.approved)fail('BILLING_NOT_APPROVED',503);if(!this.config.countries.includes(country))fail('COUNTRY_NOT_SUPPORTED',403);
  if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))fail('INVALID_IDEMPOTENCY_KEY');
  const priceId=this.config.priceIds[`${plan}:${interval}`],catalog=planCatalog.find(x=>x.id===plan);if(!priceId||!catalog)return fail('PRICE_NOT_CONFIGURED',503);
  const intent=await this.db.transaction(async tx=>{
   await lock(tx,`billing-lifecycle:${p.workspaceId}`);await scope(tx,p);await lock(tx,`checkout:${p.workspaceId}:${key}`);
   const old=await tx.query('SELECT * FROM checkout_intents WHERE workspace_id=$1 AND request_key=$2',[p.workspaceId,key]);
   if(old.rowCount){const r=old.rows[0];if(r.plan_id!==plan||r.interval!==interval||r.country!==country)fail('IDEMPOTENCY_CONFLICT',409);if(r.state==='ready')return {id:r.id,url:r.checkout_url as string,replayed:true};return fail('CHECKOUT_RECONCILIATION_REQUIRED',409);}
   const intentId=id();await tx.query('INSERT INTO checkout_intents(id,workspace_id,owner_id,request_key,plan_id,interval,country) VALUES($1,$2,$3,$4,$5,$6,$7)',[intentId,p.workspaceId,p.userId,key,plan,interval,country]);return {id:intentId,replayed:false,url:null};
  });
  if(intent.replayed)return {url:intent.url,id:intent.id};
  try{
   // Verify live price metadata against the approved catalog before creating checkout.
   const price=await this.request(`/prices/${encodeURIComponent(priceId)}`);
   if(price.status!=='active'||price.unit_price?.currency_code!=='USD'||Number(price.unit_price?.amount)!==(interval==='month'?catalog.monthly:catalog.yearly)||price.billing_cycle?.interval!==interval||price.billing_cycle?.frequency!==1)fail('CATALOG_PRICE_MISMATCH',503);
   const transaction=await this.request('/transactions','POST',{items:[{price_id:priceId,quantity:1}],collection_mode:'automatic',custom_data:{checkout_intent_id:intent.id}});
   if(typeof transaction.id!=='string')fail('INVALID_CHECKOUT_RESPONSE',503);const url=this.safeUrl(transaction.checkout?.url);
   await this.db.query('UPDATE checkout_intents SET provider_transaction_id=$2,checkout_url=$3,state=\'ready\' WHERE id=$1',[intent.id,transaction.id,url]);return {id:intent.id,url};
  }catch(e){await this.db.query('UPDATE checkout_intents SET state=\'uncertain\' WHERE id=$1 AND state=\'creating\'',[intent.id]);throw e;}
 }
 // These are read-only authoritative lookups. Reconciliation never creates a
 // second checkout, charge, refund or portal session to discover an outcome.
 async reconciliationRead(kind:'transactions'|'subscriptions'|'adjustments',externalId:string):Promise<unknown>{
  if(!/^[A-Za-z0-9_-]{3,200}$/.test(externalId))fail('INVALID_MERCHANT_REFERENCE');
  return this.request(`/${kind}/${encodeURIComponent(externalId)}`);
 }
 async reconciliationCountry(customerId:string,addressId:string):Promise<string>{
  if(![customerId,addressId].every(value=>/^[A-Za-z0-9_-]{3,200}$/.test(value)))fail('INVALID_MERCHANT_REFERENCE');
  const address=await this.request(`/customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`);
  if(address?.id!==addressId||typeof address.country_code!=='string'||!this.config.countries.includes(address.country_code))fail('UNVERIFIED_BILLING_COUNTRY',409);
  return address.country_code;
 }
 async reconciliationPrice(priceId:string):Promise<{plan:'pro'|'premium';interval:'month'|'year';currency:'USD';amountMinor:number}>{
  const configured=Object.entries(this.config.priceIds).find(([,value])=>value===priceId);
  if(!configured)fail('UNAPPROVED_PAID_PRICE',409);
  const [plan,interval]=configured[0].split(':');
  if((plan!=='pro'&&plan!=='premium')||(interval!=='month'&&interval!=='year'))fail('UNAPPROVED_PAID_PRICE',409);
  const catalog=planCatalog.find(row=>row.id===plan)!;
  const price=await this.request(`/prices/${encodeURIComponent(priceId)}`);
  const amount=interval==='month'?catalog.monthly:catalog.yearly;
  if(price?.id!==priceId||price.status!=='active'||price.unit_price?.currency_code!=='USD'||Number(price.unit_price?.amount)!==amount||price.billing_cycle?.interval!==interval||price.billing_cycle?.frequency!==1)fail('CATALOG_PRICE_MISMATCH',409);
  return {plan,interval,currency:'USD',amountMinor:amount};
 }
 async portal(p:Principal){await scope(this.db,p);const link=(await this.db.query('SELECT customer_id FROM billing_links WHERE workspace_id=$1 AND owner_id=$2 LIMIT 1',[p.workspaceId,p.userId])).rows[0];if(!link)fail('NO_BILLING_CUSTOMER',404);const data=await this.request(`/customers/${encodeURIComponent(link.customer_id)}/portal-sessions`,'POST',{});return {url:this.safeUrl(data.urls?.general?.overview)};}
 async webhook(body:string,signature:string){
  verifyPaddleSignature(body,signature,this.config.webhookSecrets);let event:any;
  try{event=JSON.parse(body);}catch{return fail('INVALID_WEBHOOK');}
  if(typeof event.event_id!=='string'||event.event_id.length>200||!Number.isFinite(Date.parse(event.occurred_at))||!event.data)return fail('INVALID_WEBHOOK');
  const d=event.data;
  await this.db.transaction(async tx=>{
   await lock(tx,`merchant-event:${event.event_id}`);
   const existing=await tx.query('SELECT payload_hash FROM billing_events WHERE provider=\'paddle\' AND event_id=$1',[event.event_id]);
   if(existing.rowCount){if(existing.rows[0].payload_hash!==hash(body))fail('BILLING_REPLAY_CONFLICT',409);return;}
   if(event.event_type==='transaction.completed'){
    if(d.status!=='completed'||typeof d.subscription_id!=='string'||typeof d.customer_id!=='string')fail('INVALID_PAID_EVENT');
    const intent=await tx.query('SELECT * FROM checkout_intents WHERE provider_transaction_id=$1 FOR UPDATE',[d.id]);
    let owner=intent.rows[0];
    if(!owner)owner=(await tx.query('SELECT * FROM billing_links WHERE subscription_id=$1',[d.subscription_id])).rows[0];
    if(!owner)fail('UNBOUND_PAYMENT_EVENT',409);
    const priceId=d.items?.[0]?.price?.id,planEntry=Object.entries(this.config.priceIds).find(([,v])=>v===priceId);if(!planEntry||d.items.length!==1||Number(d.items[0].quantity)!==1)fail('UNAPPROVED_PAID_PRICE');
    const [plan,interval]=planEntry![0].split(':');
    if(intent.rowCount&&(owner.plan_id!==plan||owner.interval!==interval))fail('PAID_PRICE_MISMATCH');
    const p:Principal={userId:owner.owner_id,workspaceId:owner.workspace_id,sessionId:''};
    const paidSub=(await tx.query("SELECT plan_id,period_end FROM subscriptions WHERE provider='paddle' AND provider_id=$1",[d.subscription_id])).rows[0];
    if(paidSub&&paidSub.plan_id!==plan&&Date.parse(d.billing_period?.starts_at)<new Date(paidSub.period_end).getTime())fail('PLAN_CHANGE_REQUIRES_POLICY',409);
    const existingLink=(await tx.query('SELECT owner_id FROM billing_links WHERE subscription_id=$1',[d.subscription_id])).rows[0];
    if(existingLink&&existingLink.owner_id!==p.userId)fail('BILLING_OWNER_CONFLICT',409);
    await tx.query('INSERT INTO billing_links(subscription_id,customer_id,workspace_id,owner_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[d.subscription_id,d.customer_id,p.workspaceId,p.userId]);
    await new BillingService(tx).apply(p,{provider:'paddle',eventId:event.event_id,rawBody:body,occurredAt:event.occurred_at,subscriptionId:d.subscription_id,planId:plan as 'pro'|'premium',status:'active',periodStart:d.billing_period?.starts_at,periodEnd:d.billing_period?.ends_at});
    if(intent.rowCount)await tx.query('UPDATE checkout_intents SET state=\'completed\' WHERE id=$1',[owner.id]);
   }else if(['subscription.updated','subscription.canceled','subscription.past_due','subscription.resumed'].includes(event.event_type)){
    const link=(await tx.query('SELECT * FROM billing_links WHERE subscription_id=$1',[d.id])).rows[0];if(!link)fail('UNBOUND_SUBSCRIPTION_EVENT',409);
    const sub=(await tx.query('SELECT * FROM subscriptions WHERE provider=\'paddle\' AND provider_id=$1',[d.id])).rows[0];if(!sub)fail('UNBOUND_SUBSCRIPTION_EVENT',409);
    const statuses:Record<string,VerifiedBillingEvent['status']>={active:'active',trialing:'trialing',canceled:'cancelled',past_due:'past_due',paused:'cancelled'};
    const status=statuses[d.status];if(!status)fail('UNSUPPORTED_SUBSCRIPTION_STATE');
    if(['active','trialing'].includes(status)&&d.current_billing_period?.starts_at&&Date.parse(d.current_billing_period.starts_at)!==new Date(sub.period_start).getTime()){
     await tx.query('INSERT INTO billing_events(provider,event_id,payload_hash,workspace_id,owner_id,occurred_at,status) VALUES(\'paddle\',$1,$2,$3,$4,$5,\'ignored\')',[event.event_id,hash(body),link.workspace_id,link.owner_id,event.occurred_at]);return;
    }
    // Only a completed transaction grants a new paid period. An active update alone
    // cannot advance the entitlement period or change a plan.
    await new BillingService(tx).apply({userId:link.owner_id,workspaceId:link.workspace_id,sessionId:''},{provider:'paddle',eventId:event.event_id,rawBody:body,occurredAt:event.occurred_at,subscriptionId:d.id,planId:sub.plan_id,status,periodStart:new Date(sub.period_start).toISOString(),periodEnd:new Date(sub.period_end).toISOString()});
   }else if(event.event_type==='adjustment.updated'||event.event_type==='adjustment.created'){
    const link=(await tx.query('SELECT * FROM billing_links WHERE subscription_id=$1',[d.subscription_id])).rows[0];if(!link)fail('UNBOUND_ADJUSTMENT_EVENT',409);
    const kind=d.action==='refund'?'refund':d.action==='chargeback'?'chargeback':d.action==='credit'?'credit':null;if(!kind)return fail('UNSUPPORTED_ADJUSTMENT');
    const amount=Number(d.totals?.total??0);if(!Number.isSafeInteger(amount)||amount<0)fail('INVALID_ADJUSTMENT');
    await tx.query('INSERT INTO payment_adjustments(provider_id,subscription_id,kind,status,amount_minor) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[d.id,d.subscription_id,kind,String(d.status),amount]);
    await tx.query('INSERT INTO billing_events(provider,event_id,payload_hash,workspace_id,owner_id,occurred_at,status) VALUES(\'paddle\',$1,$2,$3,$4,$5,\'processed\')',[event.event_id,hash(body),link.workspace_id,link.owner_id,event.occurred_at]);
    if(kind==='chargeback')await tx.query('UPDATE subscriptions SET status=\'past_due\' WHERE provider=\'paddle\' AND provider_id=$1',[d.subscription_id]);
    await audit(tx,{userId:link.owner_id,workspaceId:link.workspace_id,sessionId:''},'billing.adjustment_recorded',d.id,'billing',{kind,amount});
   }
  });
 }
}
