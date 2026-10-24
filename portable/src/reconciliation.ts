import {z} from 'zod/v4';
import type {Db} from './db.js';
import {AppError,audit,fail,hash,id,lock,type Principal} from './common.js';
import {BillingService} from './billing.js';
import {PaddleGateway} from './merchant.js';
import {QuotaService} from './quota.js';
import {SpendService} from './protection.js';

const externalId=z.string().regex(/^[A-Za-z0-9_-]{3,200}$/);
const stamp=z.iso.datetime({offset:true});
const period=z.object({starts_at:stamp,ends_at:stamp});
const transaction=z.object({id:externalId,status:z.enum(['draft','ready','billed','paid','completed','canceled','past_due']),customer_id:externalId.nullable(),subscription_id:externalId.nullable(),address_id:externalId.nullable(),currency_code:z.string().length(3),items:z.array(z.object({quantity:z.number().int().min(1).max(100),price:z.object({id:externalId})})).max(100),billing_period:period.nullable(),custom_data:z.object({checkout_intent_id:z.uuid().optional()}).nullable(),updated_at:stamp});
const subscription=z.object({id:externalId,customer_id:externalId,status:z.enum(['active','trialing','past_due','canceled','paused']),current_billing_period:period.nullable(),updated_at:stamp});
const adjustment=z.object({id:externalId,subscription_id:externalId,action:z.enum(['refund','chargeback','credit']),status:z.enum(['pending_approval','approved','rejected','reversed']),currency_code:z.string().length(3),totals:z.object({total:z.union([z.string().regex(/^\d+$/),z.number().int().nonnegative()])}),updated_at:stamp});
const providerProof=z.strictObject({provider:externalId,runId:z.uuid(),requestKey:z.uuid(),evidenceId:externalId,asOf:stamp,outcome:z.enum(['accepted','not_accepted','unknown']),actualMicroUsd:z.number().int().min(0).max(1_000_000_000).optional()});
export type ProviderOutcomeProof=z.infer<typeof providerProof>;
export interface ProviderOutcomeGateway {
 readonly provider:string;
 // A vendor-specific approved adapter must bind the provider's authoritative
 // request/invoice evidence. A transport timeout or absence is never rejection.
 lookup(runId:string,providerIdempotencyKey:string):Promise<ProviderOutcomeProof|{unsupported:true}>;
}
export class UnsupportedProviderOutcomes implements ProviderOutcomeGateway {
 readonly provider='unconfigured-provider';
 async lookup(){return {unsupported:true} as const;}
}
export interface ReconciliationMerchant {
 readonly approved:boolean;
 reconciliationRead(kind:'transactions'|'subscriptions'|'adjustments',externalId:string):Promise<unknown>;
 reconciliationCountry(customerId:string,addressId:string):Promise<string>;
 reconciliationPrice(priceId:string):Promise<{plan:'pro'|'premium';interval:'month'|'year';currency:'USD';amountMinor:number}>;
}
export type ReconciliationOutcome='matched'|'corrected'|'mismatch'|'unknown'|'unsupported'|'stale';
export type ReconciliationKind='checkout'|'subscription'|'adjustment'|'provider_run';
export interface ReconciliationResult {id:string;provider:string;resourceKind:ReconciliationKind;resourceId:string;outcome:ReconciliationOutcome;reason:string;correctionApplied:boolean;replayed:boolean;observedAt:string}
type Target={provider:string;kind:ReconciliationKind;id:string};
type Snapshot=Record<string,string|number|boolean|null>;
const keyPattern=/^[A-Za-z0-9_-]{3,200}$/;
const owner=(row:Record<string,unknown>):Principal=>({userId:String(row.owner_id),workspaceId:String(row.workspace_id),sessionId:''});
const date=(value:unknown)=>new Date(value as string|Date).toISOString();
const expectedError=(error:unknown,fallback:string)=>error instanceof AppError?error.code:fallback;
const isFuture=(value:string)=>Date.parse(value)>Date.now()+30_000;

/** Read-only external reconciliation with fenced, append-only local corrections.
 * It never creates transactions, refunds, provider requests or retries uncertain
 * work. All ownership is derived from existing server records, never request DTOs.
 */
export class ReconciliationService {
 constructor(private db:Db,private merchant?:ReconciliationMerchant,private provider:ProviderOutcomeGateway=new UnsupportedProviderOutcomes()){}

 private async record(tx:Db,p:Principal,target:Target,snapshot:Snapshot,outcome:ReconciliationOutcome,reason:string,apply?:()=>Promise<void>):Promise<ReconciliationResult>{
  const fingerprint=hash(JSON.stringify(snapshot));
  await lock(tx,`reconciliation:${target.provider}:${target.kind}:${target.id}`);
  const prior=(await tx.query('SELECT * FROM financial_reconciliation_observations WHERE provider=$1 AND resource_kind=$2 AND resource_id=$3 AND fingerprint=$4',[target.provider,target.kind,target.id,fingerprint])).rows[0];
  if(prior){if(prior.workspace_id!==p.workspaceId||prior.owner_id!==p.userId)fail('RECONCILIATION_OWNER_CONFLICT',409);return {id:prior.id,provider:prior.provider,resourceKind:prior.resource_kind,resourceId:prior.resource_id,outcome:prior.outcome,reason:prior.reason,correctionApplied:false,replayed:true,observedAt:date(prior.created_at)};}
  const observation=id();
  const row=(await tx.query('INSERT INTO financial_reconciliation_observations(id,provider,resource_kind,resource_id,workspace_id,owner_id,fingerprint,outcome,reason,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING created_at',[observation,target.provider,target.kind,target.id,p.workspaceId,p.userId,fingerprint,outcome,reason,JSON.stringify(snapshot)])).rows[0];
  if(apply){await apply();await tx.query('INSERT INTO financial_reconciliation_applications(id,observation_id,business_key,action) VALUES($1,$2,$3,$4)',[id(),observation,`reconciliation:${target.provider}:${target.kind}:${target.id}:${fingerprint}`,reason]);}
  const state=['matched','corrected','stale'].includes(outcome)?'resolved':'open';
  await tx.query('INSERT INTO financial_reconciliation_cases(id,provider,resource_kind,resource_id,workspace_id,owner_id,last_observation_id,reason,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(provider,resource_kind,resource_id) DO UPDATE SET last_observation_id=excluded.last_observation_id,reason=excluded.reason,state=excluded.state,updated_at=now()',[id(),target.provider,target.kind,target.id,p.workspaceId,p.userId,observation,reason,state]);
  await audit(tx,p,'finance.reconciliation_observed',observation,'reconciliation',{provider:target.provider,kind:target.kind,outcome,reason,corrected:!!apply});
  return {id:observation,provider:target.provider,resourceKind:target.kind,resourceId:target.id,outcome,reason,correctionApplied:!!apply,replayed:false,observedAt:date(row.created_at)};
 }
 private unknown(p:Principal,target:Target,reason:string,outcome:'unknown'|'unsupported'|'mismatch'='unknown',snapshot:Snapshot={}){
  return this.db.transaction(tx=>this.record(tx,p,target,{reason,...snapshot},outcome,reason));
 }

 /** transactionId may supply a recovered reference; its merchant custom_data must
  * match this existing intent before any binding or entitlement is changed. */
 async checkout(intentId:string,transactionId?:string):Promise<ReconciliationResult>{
  if(!z.uuid().safeParse(intentId).success||transactionId!==undefined&&!keyPattern.test(transactionId))fail('INVALID_RECONCILIATION_REFERENCE');
  const intent=(await this.db.query('SELECT * FROM checkout_intents WHERE id=$1',[intentId])).rows[0];if(!intent)fail('NOT_FOUND',404);
  const p=owner(intent),target:Target={provider:'paddle',kind:'checkout',id:intentId};
  if(!this.merchant?.approved)return this.unknown(p,target,'MERCHANT_NOT_CONFIGURED','unsupported');
  const reference=transactionId??intent.provider_transaction_id;
  if(!reference)return this.unknown(p,target,'CHECKOUT_REFERENCE_UNAVAILABLE');
  if(intent.provider_transaction_id&&intent.provider_transaction_id!==reference)return this.unknown(p,target,'CHECKOUT_REFERENCE_CONFLICT','mismatch',{transactionId:reference});
  let paid:z.infer<typeof transaction>;
  try{paid=transaction.parse(await this.merchant.reconciliationRead('transactions',reference));}catch(error){return this.unknown(p,target,expectedError(error,'INVALID_MERCHANT_RESPONSE'),'unknown',{transactionId:reference});}
  const snapshot:Snapshot={transactionId:paid.id,status:paid.status,updatedAt:paid.updated_at,currency:paid.currency_code,customerId:paid.customer_id,subscriptionId:paid.subscription_id,priceId:paid.items[0]?.price.id??null,periodStart:paid.billing_period?.starts_at??null,periodEnd:paid.billing_period?.ends_at??null};
  const mismatch=(reason:string)=>this.unknown(p,target,reason,'mismatch',snapshot);
  if(paid.id!==reference||paid.custom_data?.checkout_intent_id!==intentId)return mismatch('UNBOUND_PAYMENT_REFERENCE');
  if(isFuture(paid.updated_at))return mismatch('FUTURE_MERCHANT_EVIDENCE');
  if(paid.status!=='completed'){
   if(paid.status==='canceled')return this.db.transaction(async tx=>{await lock(tx,`billing-lifecycle:${p.workspaceId}`);const current=(await tx.query('SELECT state FROM checkout_intents WHERE id=$1 FOR UPDATE',[intentId])).rows[0];if(current.state==='completed')return this.record(tx,p,target,snapshot,'mismatch','PAID_CHECKOUT_CANNOT_BE_REVERSED');return this.record(tx,p,target,snapshot,'corrected','CHECKOUT_CANCELLED_CONFIRMED',async()=>{await tx.query("UPDATE checkout_intents SET state='failed',provider_transaction_id=$2 WHERE id=$1",[intentId,paid.id]);});});
   return this.unknown(p,target,'PAYMENT_NOT_TERMINAL','unknown',snapshot);
  }
  if(!paid.subscription_id||!paid.customer_id||!paid.address_id||!paid.billing_period||paid.items.length!==1||paid.items[0].quantity!==1)return mismatch('INCOMPLETE_PAID_EVIDENCE');
  if(paid.currency_code!=='USD')return mismatch('UNAPPROVED_CURRENCY');
  let price:Awaited<ReturnType<ReconciliationMerchant['reconciliationPrice']>>,country:string;
  try{price=await this.merchant.reconciliationPrice(paid.items[0].price.id);country=await this.merchant.reconciliationCountry(paid.customer_id,paid.address_id);}catch(error){return mismatch(expectedError(error,'MERCHANT_CATALOG_UNAVAILABLE'));}
  snapshot.country=country;snapshot.amountMinor=price.amountMinor;
  if(price.plan!==intent.plan_id||price.interval!==intent.interval||country!==intent.country)return mismatch('PAID_CATALOG_OR_COUNTRY_MISMATCH');
  if(Date.parse(paid.billing_period.ends_at)<=Date.parse(paid.billing_period.starts_at))return mismatch('INVALID_BILLING_PERIOD');
  if(isFuture(paid.billing_period.starts_at))return this.unknown(p,target,'FUTURE_PERIOD_NOT_ACTIVE','unknown',snapshot);
  return this.db.transaction(async tx=>{
   await lock(tx,`billing-lifecycle:${p.workspaceId}`);await lock(tx,`billing:paddle:${paid.subscription_id}`);
   const currentIntent=(await tx.query('SELECT * FROM checkout_intents WHERE id=$1 FOR UPDATE',[intentId])).rows[0];
   if(currentIntent.provider_transaction_id&&currentIntent.provider_transaction_id!==paid.id)return this.record(tx,p,target,snapshot,'mismatch','CHECKOUT_REFERENCE_CONFLICT');
   const links=await tx.query('SELECT * FROM billing_links WHERE subscription_id=$1 OR (customer_id=$2 AND owner_id<>$3)',[paid.subscription_id,paid.customer_id,p.userId]);
   if(links.rows.some(row=>row.owner_id!==p.userId||row.workspace_id!==p.workspaceId||row.customer_id!==paid.customer_id))return this.record(tx,p,target,snapshot,'mismatch','BILLING_OWNER_CONFLICT');
   const sub=(await tx.query("SELECT * FROM subscriptions WHERE provider='paddle' AND provider_id=$1 FOR UPDATE",[paid.subscription_id])).rows[0];
   if(sub&&(sub.owner_id!==p.userId||sub.workspace_id!==p.workspaceId))return this.record(tx,p,target,snapshot,'mismatch','BILLING_OWNER_CONFLICT');
   if(sub&&Date.parse(paid.updated_at)<=+new Date(sub.last_event_at))return this.record(tx,p,target,snapshot,'stale','OLDER_PAYMENT_SNAPSHOT');
   const sameWindow=sub&&date(sub.period_start)===paid.billing_period!.starts_at&&date(sub.period_end)===paid.billing_period!.ends_at;
   if(sub&&(!sameWindow&&Date.parse(paid.billing_period!.starts_at)<+new Date(sub.period_end)||sameWindow&&sub.plan_id!==price.plan))return this.record(tx,p,target,snapshot,'mismatch','PLAN_CHANGE_OR_PRORATION_REQUIRES_POLICY');
   return this.record(tx,p,target,snapshot,'corrected','PAID_TRANSACTION_RECONCILED',async()=>{
    await tx.query('INSERT INTO billing_links(subscription_id,customer_id,workspace_id,owner_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[paid.subscription_id,paid.customer_id,p.workspaceId,p.userId]);
    const body=JSON.stringify(snapshot);
    await new BillingService(tx).apply(p,{provider:'paddle',eventId:`reconcile-transaction:${paid.id}:${hash(body)}`,rawBody:body,occurredAt:paid.updated_at,subscriptionId:paid.subscription_id!,planId:price.plan,status:'active',periodStart:paid.billing_period!.starts_at,periodEnd:paid.billing_period!.ends_at});
    await tx.query("UPDATE checkout_intents SET state='completed',provider_transaction_id=$2 WHERE id=$1",[intentId,paid.id]);
   });
  });
 }

 async subscription(subscriptionId:string):Promise<ReconciliationResult>{
  if(!keyPattern.test(subscriptionId))fail('INVALID_RECONCILIATION_REFERENCE');
  const link=(await this.db.query('SELECT * FROM billing_links WHERE subscription_id=$1',[subscriptionId])).rows[0];if(!link)fail('NOT_FOUND',404);
  const p=owner(link),target:Target={provider:'paddle',kind:'subscription',id:subscriptionId};
  if(!this.merchant?.approved)return this.unknown(p,target,'MERCHANT_NOT_CONFIGURED','unsupported');
  let data:z.infer<typeof subscription>;
  try{data=subscription.parse(await this.merchant.reconciliationRead('subscriptions',subscriptionId));}catch(error){return this.unknown(p,target,expectedError(error,'INVALID_MERCHANT_RESPONSE'));}
  const snapshot:Snapshot={subscriptionId:data.id,customerId:data.customer_id,status:data.status,updatedAt:data.updated_at,periodStart:data.current_billing_period?.starts_at??null,periodEnd:data.current_billing_period?.ends_at??null};
  if(data.id!==subscriptionId||data.customer_id!==link.customer_id)return this.unknown(p,target,'BILLING_OWNER_CONFLICT','mismatch',snapshot);
  if(isFuture(data.updated_at))return this.unknown(p,target,'FUTURE_MERCHANT_EVIDENCE','mismatch',snapshot);
  return this.db.transaction(async tx=>{
   await lock(tx,`billing-lifecycle:${p.workspaceId}`);await lock(tx,`billing:paddle:${subscriptionId}`);
   const sub=(await tx.query("SELECT * FROM subscriptions WHERE provider='paddle' AND provider_id=$1 FOR UPDATE",[subscriptionId])).rows[0];
   if(!sub||sub.owner_id!==p.userId||sub.workspace_id!==p.workspaceId)return this.record(tx,p,target,snapshot,'mismatch','UNBOUND_SUBSCRIPTION_STATE');
   if(Date.parse(data.updated_at)<=+new Date(sub.last_event_at))return this.record(tx,p,target,snapshot,'stale','OLDER_SUBSCRIPTION_SNAPSHOT');
   if(['active','trialing'].includes(data.status)&&(!data.current_billing_period||date(sub.period_start)!==data.current_billing_period.starts_at||date(sub.period_end)!==data.current_billing_period.ends_at))return this.record(tx,p,target,snapshot,'mismatch','PAID_PERIOD_TRANSACTION_REQUIRED');
   const status=data.status==='canceled'||data.status==='paused'?'cancelled':data.status;
   return this.record(tx,p,target,snapshot,'corrected','SUBSCRIPTION_STATE_RECONCILED',async()=>{
    const body=JSON.stringify(snapshot);await new BillingService(tx).apply(p,{provider:'paddle',eventId:`reconcile-subscription:${subscriptionId}:${hash(body)}`,rawBody:body,occurredAt:data.updated_at,subscriptionId,planId:sub.plan_id,status,periodStart:date(sub.period_start),periodEnd:date(sub.period_end)});
   });
  });
 }

 async adjustment(adjustmentId:string,subscriptionId:string):Promise<ReconciliationResult>{
  if(![adjustmentId,subscriptionId].every(value=>keyPattern.test(value)))fail('INVALID_RECONCILIATION_REFERENCE');
  const link=(await this.db.query('SELECT * FROM billing_links WHERE subscription_id=$1',[subscriptionId])).rows[0];if(!link)fail('NOT_FOUND',404);
  const p=owner(link),target:Target={provider:'paddle',kind:'adjustment',id:adjustmentId};
  if(!this.merchant?.approved)return this.unknown(p,target,'MERCHANT_NOT_CONFIGURED','unsupported');
  let data:z.infer<typeof adjustment>;
  try{data=adjustment.parse(await this.merchant.reconciliationRead('adjustments',adjustmentId));}catch(error){return this.unknown(p,target,expectedError(error,'INVALID_MERCHANT_RESPONSE'));}
  const amount=Number(data.totals.total),snapshot:Snapshot={adjustmentId:data.id,subscriptionId:data.subscription_id,action:data.action,status:data.status,currency:data.currency_code,amountMinor:amount,updatedAt:data.updated_at};
  if(data.id!==adjustmentId||data.subscription_id!==subscriptionId||data.currency_code!=='USD'||!Number.isSafeInteger(amount)||amount<0||isFuture(data.updated_at))return this.unknown(p,target,'INVALID_ADJUSTMENT_BINDING','mismatch',snapshot);
  return this.db.transaction(async tx=>{
   await lock(tx,`billing-lifecycle:${p.workspaceId}`);await lock(tx,`billing:paddle:${subscriptionId}`);
   const prev=(await tx.query('SELECT * FROM payment_adjustments WHERE provider_id=$1 FOR UPDATE',[adjustmentId])).rows[0];
   if(prev&&(prev.subscription_id!==subscriptionId||prev.kind!==data.action||Number(prev.amount_minor)!==amount))return this.record(tx,p,target,snapshot,'mismatch','ADJUSTMENT_REPLAY_CONFLICT');
   const last=(await tx.query("SELECT snapshot FROM financial_reconciliation_observations WHERE provider='paddle' AND resource_kind='adjustment' AND resource_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1",[adjustmentId])).rows[0];
   if(last&&Date.parse(String(last.snapshot.updatedAt))>Date.parse(data.updated_at))return this.record(tx,p,target,snapshot,'stale','OLDER_ADJUSTMENT_SNAPSHOT');
   // Refund/credit status is recorded, never initiated. Financial eligibility and
   // any reduction of unused credits require an approved separate policy.
   return this.record(tx,p,target,snapshot,'corrected',data.action==='chargeback'&&data.status==='approved'?'CONFIRMED_DISPUTE_REVOKED':'ADJUSTMENT_STATUS_RECONCILED',async()=>{
    await tx.query('INSERT INTO payment_adjustments(provider_id,subscription_id,kind,status,amount_minor) VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider_id) DO UPDATE SET status=excluded.status',[adjustmentId,subscriptionId,data.action,data.status,amount]);
    if(data.action==='chargeback'&&data.status==='approved')await tx.query("UPDATE subscriptions SET status='past_due',last_event_at=GREATEST(last_event_at,$2::timestamptz) WHERE provider='paddle' AND provider_id=$1",[subscriptionId,data.updated_at]);
   });
  });
 }

 async providerRun(runId:string):Promise<ReconciliationResult>{
  if(!z.uuid().safeParse(runId).success)fail('INVALID_RECONCILIATION_REFERENCE');
  const run=(await this.db.query('SELECT * FROM tool_runs WHERE id=$1',[runId])).rows[0];if(!run)fail('NOT_FOUND',404);
  const p=owner(run),target:Target={provider:this.provider.provider,kind:'provider_run',id:runId};
  let response:Awaited<ReturnType<ProviderOutcomeGateway['lookup']>>;
  try{response=await this.provider.lookup(runId,runId);}catch{return this.unknown(p,target,'PROVIDER_OUTCOME_UNAVAILABLE');}
  if('unsupported' in response)return this.unknown(p,target,'PROVIDER_OUTCOME_LOOKUP_UNSUPPORTED','unsupported');
  const parsed=providerProof.safeParse(response);
  if(!parsed.success)return this.unknown(p,target,'INVALID_PROVIDER_OUTCOME','mismatch');
  const proof=parsed.data,snapshot:Snapshot={provider:proof.provider,runId:proof.runId,requestKey:proof.requestKey,evidenceId:proof.evidenceId,asOf:proof.asOf,outcome:proof.outcome,actualMicroUsd:proof.actualMicroUsd??null};
  if(proof.provider!==this.provider.provider||proof.runId!==runId||proof.requestKey!==runId||isFuture(proof.asOf))return this.unknown(p,target,'PROVIDER_OUTCOME_BINDING_CONFLICT','mismatch',snapshot);
  if(proof.outcome==='unknown')return this.unknown(p,target,'PROVIDER_ACCEPTANCE_STILL_UNKNOWN','unknown',snapshot);
  return this.db.transaction(async tx=>{
   await lock(tx,'provider-spending');await lock(tx,`provider-reconciliation:${runId}`);
   const current=(await tx.query('SELECT * FROM tool_runs WHERE id=$1 FOR UPDATE',[runId])).rows[0];
   if(Date.parse(proof.asOf)<+new Date(current.updated_at))return this.record(tx,p,target,snapshot,'stale','OLDER_PROVIDER_EVIDENCE');
   const reservation=(await tx.query('SELECT * FROM reservations WHERE run_id=$1 FOR UPDATE',[runId])).rows[0];
   const hold=(await tx.query('SELECT * FROM spend_holds WHERE run_id=$1 FOR UPDATE',[runId])).rows[0];
   if(current.status!=='uncertain'&&!(proof.outcome==='accepted'&&['completed','failed','cancelled'].includes(current.status)))return this.record(tx,p,target,snapshot,'mismatch','RUN_NOT_RECONCILABLE');
   if(!reservation)return this.record(tx,p,target,snapshot,'mismatch','PROVIDER_RESERVATION_MISSING');
   if(proof.outcome==='not_accepted'){
    if(reservation.status==='settled'||hold?.status==='spent')return this.record(tx,p,target,snapshot,'mismatch','SETTLED_ACCEPTANCE_CONFLICT');
    return this.record(tx,p,target,snapshot,'corrected','PROVIDER_REJECTION_CONFIRMED',async()=>{await new QuotaService(tx).finalize(tx,runId,'released');await new SpendService(tx).finalize(tx,runId,false);await tx.query("UPDATE tool_runs SET status='failed',error_code='PROVIDER_NOT_ACCEPTED_RECONCILED',updated_at=now() WHERE id=$1 AND status='uncertain'",[runId]);});
   }
   if(proof.actualMicroUsd===undefined||!hold)return this.record(tx,p,target,snapshot,'mismatch','AUTHORITATIVE_COST_REQUIRED');
   if(reservation.status==='released'||hold.status==='released')return this.record(tx,p,target,snapshot,'mismatch','RELEASED_ACCEPTANCE_CONFLICT');
   const previous=(await tx.query('SELECT * FROM provider_cost_adjustments WHERE run_id=$1',[runId])).rows[0];
   if(previous&&Number(previous.actual_micro_usd)!==proof.actualMicroUsd)return this.record(tx,p,target,snapshot,'mismatch','PROVIDER_COST_EVIDENCE_CONFLICT');
   return this.record(tx,p,target,snapshot,'corrected','PROVIDER_ACCEPTANCE_COST_RECONCILED',async()=>{
    await new QuotaService(tx).finalize(tx,runId,'settled');await new SpendService(tx).finalize(tx,runId,true);
    if(!previous){
     const observation=(await tx.query('SELECT id FROM financial_reconciliation_observations WHERE provider=$1 AND resource_kind=$2 AND resource_id=$3 AND fingerprint=$4',[target.provider,target.kind,target.id,hash(JSON.stringify(snapshot))])).rows[0];
     const delta=proof.actualMicroUsd!-Number(hold.micro_usd);
     await tx.query('INSERT INTO provider_cost_adjustments(run_id,observation_id,evidence_id,actual_micro_usd,estimated_micro_usd,delta_micro_usd) VALUES($1,$2,$3,$4,$5,$6)',[runId,observation.id,proof.evidenceId,proof.actualMicroUsd,hold.micro_usd,delta]);
     await tx.query('UPDATE spend_days SET spent_micro_usd=spent_micro_usd+$2 WHERE day=$1',[hold.day,delta]);
    }
    // Accepted is an accounting outcome, not proof that output was recovered.
    await tx.query("UPDATE tool_runs SET error_code='PROVIDER_ACCEPTED_OUTPUT_UNRECOVERED',updated_at=now() WHERE id=$1 AND status='uncertain'",[runId]);
   });
  });
 }

 async cases(state:'open'|'resolved'='open',limit=50){
  if(!['open','resolved'].includes(state)||!Number.isInteger(limit)||limit<1||limit>100)fail('INVALID_RECONCILIATION_QUERY');
  return (await this.db.query('SELECT id,provider,resource_kind,resource_id,workspace_id,owner_id,reason,state,updated_at FROM financial_reconciliation_cases WHERE state=$1 ORDER BY updated_at DESC,id DESC LIMIT $2',[state,limit])).rows;
 }
 /** Bounded scheduler hook; references already persisted on the server only. */
 async reconcilePending(limit=20){
  if(!Number.isInteger(limit)||limit<1||limit>50)fail('INVALID_RECONCILIATION_QUERY');
  const rows=(await this.db.query("SELECT id FROM checkout_intents WHERE state IN('creating','ready','uncertain') ORDER BY created_at,id LIMIT $1",[limit])).rows;
  const results:ReconciliationResult[]=[];for(const row of rows)results.push(await this.checkout(row.id));return results;
 }
}
