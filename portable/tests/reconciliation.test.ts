import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {migrate} from '../src/migrate.js';
import type {Db} from '../src/db.js';
import {ReconciliationService,type ReconciliationMerchant} from '../src/reconciliation.js';
import {RunService} from '../src/runs.js';
import {Worker,ProviderFailure} from '../src/worker.js';
import {id} from '../src/common.js';
import {account,input,LocalObjects,silent,testDatabase} from './support.js';
import {planCatalog} from '../src/product-policy.js';
let db:Db,root:string,dispose:()=>Promise<void>,objects:LocalObjects;
before(async()=>{root=await mkdtemp(join(tmpdir(),'fr-reconciliation-'));const d=await testDatabase(join(root,'db'));db=d.db;dispose=d.dispose;objects=new LocalObjects(join(root,'objects'));await migrate(db);});
after(async()=>{await db.close();await dispose();await rm(root,{recursive:true,force:true});});
async function checkout(){
 const a=await account(db),intentId=id(),suffix=id().replaceAll('-',''),transactionId='trn_'+suffix,subscriptionId='sub_'+suffix,customerId='ctm_'+suffix,updated=new Date().toISOString(),start=new Date(Date.now()-60000).toISOString(),end=new Date(Date.now()+30*86400000).toISOString();
 await db.query("INSERT INTO checkout_intents(id,workspace_id,owner_id,request_key,plan_id,interval,country,state,provider_transaction_id) VALUES($1,$2,$3,$4,'pro','month','US','uncertain',$5)",[intentId,a.p.workspaceId,a.p.userId,id(),transactionId]);
 let data:Record<string,unknown>={id:transactionId,status:'completed',customer_id:customerId,subscription_id:subscriptionId,address_id:'addr_fixture',currency_code:'USD',items:[{quantity:1,price:{id:'pri_fixture'}}],billing_period:{starts_at:start,ends_at:end},custom_data:{checkout_intent_id:intentId},updated_at:updated};
 const merchant:ReconciliationMerchant={approved:true,async reconciliationRead(){return data;},async reconciliationCountry(){return 'US';},async reconciliationPrice(){return {plan:'pro',interval:'month',currency:'USD',amountMinor:planCatalog.find(p=>p.id==='pro')!.monthly};}};
 return {...a,intentId,transactionId,subscriptionId,customerId,start,end,merchant,service:new ReconciliationService(db,merchant),data,replace:(value:Record<string,unknown>)=>{data=value;}};
}
test('BIL-010 reconciliation is disabled without authoritative merchant binding and never resends a checkout',async()=>{
 const a=await checkout(),service=new ReconciliationService(db);const r=await service.checkout(a.intentId);assert.equal(r.outcome,'unsupported');assert.equal((await db.query('SELECT state FROM checkout_intents WHERE id=$1',[a.intentId])).rows[0].state,'uncertain');
 assert.equal((await service.checkout(a.intentId)).replayed,true);assert.equal((await db.query('SELECT count(*)::int n FROM subscriptions WHERE owner_id=$1',[a.p.userId])).rows[0].n,0);
});
test('DAT-005 confirmed bound completed payment repairs a missing event once under concurrent reads and never mutates the ledger history',async()=>{
 const a=await checkout();const results=await Promise.all([a.service.checkout(a.intentId),a.service.checkout(a.intentId)]);assert.equal(results.filter(r=>r.correctionApplied).length,1);
 const sub=(await db.query('SELECT * FROM subscriptions WHERE owner_id=$1',[a.p.userId])).rows[0];assert.equal(sub.status,'active');assert.equal(sub.provider_id,a.subscriptionId);
 const grants=(await db.query("SELECT count(*)::int n FROM allowance_ledger l JOIN allowance_accounts a ON a.id=l.account_id WHERE a.owner_id=$1 AND l.kind='grant'",[a.p.userId])).rows[0].n;assert.ok(grants>=1);
 const again=await a.service.checkout(a.intentId);assert.equal(again.replayed,true);assert.equal((await db.query('SELECT count(*)::int n FROM financial_reconciliation_applications WHERE observation_id=$1',[results.find(r=>r.correctionApplied)!.id])).rows[0].n,1);
 await assert.rejects(db.query('DELETE FROM financial_reconciliation_observations WHERE id=$1',[again.id]),/append-only/);
});
test('BIL-008 unbound payment, currency, country and quantity mismatches cannot grant entitlements',async()=>{
 for(const patch of [{custom_data:{checkout_intent_id:id()}},{currency_code:'EUR'},{items:[{quantity:2,price:{id:'pri_fixture'}}]}]){
  const a=await checkout();a.replace({...a.data,...patch});assert.equal((await a.service.checkout(a.intentId)).outcome,'mismatch');assert.equal((await db.query('SELECT count(*)::int n FROM subscriptions WHERE owner_id=$1',[a.p.userId])).rows[0].n,0);
 }
 const a=await checkout();a.merchant.reconciliationCountry=async()=> 'FR';assert.equal((await a.service.checkout(a.intentId)).reason,'PAID_CATALOG_OR_COUNTRY_MISMATCH');
});
test('BIL-004 subscription snapshots cannot mint a new paid period; confirmed cancellation removes paid eligibility',async()=>{
 const a=await checkout();await a.service.checkout(a.intentId);
 a.replace({id:a.subscriptionId,customer_id:a.customerId,status:'active',current_billing_period:{starts_at:a.end,ends_at:new Date(Date.now()+60*86400000).toISOString()},updated_at:new Date(Date.now()+1000).toISOString()});
 assert.equal((await a.service.subscription(a.subscriptionId)).reason,'PAID_PERIOD_TRANSACTION_REQUIRED');
 a.replace({id:a.subscriptionId,customer_id:a.customerId,status:'canceled',current_billing_period:null,updated_at:new Date(Date.now()+2000).toISOString()});assert.equal((await a.service.subscription(a.subscriptionId)).outcome,'corrected');assert.equal((await db.query('SELECT status FROM subscriptions WHERE provider_id=$1',[a.subscriptionId])).rows[0].status,'cancelled');
});
test('BIL-012 dispute observation is append-only and replay-safe; it initiates no refund or credit mutation',async()=>{
 const a=await checkout();await a.service.checkout(a.intentId);const adjustmentId='adj_'+id().replaceAll('-',''),balanceBefore=JSON.stringify((await db.query('SELECT granted,reserved,consumed FROM allowance_accounts WHERE owner_id=$1 ORDER BY id',[a.p.userId])).rows);
 a.replace({id:adjustmentId,subscription_id:a.subscriptionId,action:'chargeback',status:'approved',currency_code:'USD',totals:{total:'1200'},updated_at:new Date(Date.now()+1000).toISOString()});const r=await a.service.adjustment(adjustmentId,a.subscriptionId);assert.equal(r.correctionApplied,true);assert.equal((await a.service.adjustment(adjustmentId,a.subscriptionId)).replayed,true);assert.equal((await db.query('SELECT status FROM subscriptions WHERE provider_id=$1',[a.subscriptionId])).rows[0].status,'past_due');
 assert.equal(JSON.stringify((await db.query('SELECT granted,reserved,consumed FROM allowance_accounts WHERE owner_id=$1 ORDER BY id',[a.p.userId])).rows),balanceBefore);
});
test('QTA-004 provider unknown acceptance remains held; authoritative bound rejection releases once and never resends',async()=>{
 const a=await account(db);await db.query('UPDATE runtime_controls SET provider_enabled=true,daily_budget_micro_usd=1000000 WHERE id=1');const run=await new RunService(db).create(a.p,input,id(),'fixture');let calls=0;
 await new Worker(db,objects,{estimateMicroUsd(){return 1000;},async generate(){calls++;throw new ProviderFailure('unknown');}},silent).tick();
 assert.equal((await new ReconciliationService(db).providerRun(run.id)).outcome,'unsupported');assert.equal((await db.query('SELECT status FROM reservations WHERE run_id=$1',[run.id])).rows[0].status,'held');
 const proof={provider:'fixture-provider',runId:run.id,requestKey:run.id,evidenceId:'proof_'+id(),asOf:new Date(Date.now()+1000).toISOString(),outcome:'not_accepted' as const};
 const service=new ReconciliationService(db,undefined,{provider:proof.provider,async lookup(){return proof;}});assert.equal((await service.providerRun(run.id)).correctionApplied,true);assert.equal((await service.providerRun(run.id)).replayed,true);assert.equal(calls,1);assert.equal((await db.query('SELECT status FROM reservations WHERE run_id=$1',[run.id])).rows[0].status,'released');
});
test('QTA-006 accepted proof requires bound authoritative cost and appends its estimate adjustment once',async()=>{
 const a=await account(db),run=await new RunService(db).create(a.p,input,id(),'fixture');await new Worker(db,objects,{estimateMicroUsd(){return 1000;},async generate(){throw new ProviderFailure('unknown');}},silent).tick();
 const proof={provider:'fixture-provider',runId:run.id,requestKey:run.id,evidenceId:'proof_'+id(),asOf:new Date(Date.now()+1000).toISOString(),outcome:'accepted' as const,actualMicroUsd:700};
 const service=new ReconciliationService(db,undefined,{provider:proof.provider,async lookup(){return proof;}});assert.equal((await service.providerRun(run.id)).correctionApplied,true);assert.equal((await service.providerRun(run.id)).replayed,true);
 const correction=(await db.query('SELECT actual_micro_usd,estimated_micro_usd,delta_micro_usd FROM provider_cost_adjustments WHERE run_id=$1',[run.id])).rows[0];assert.equal(Number(correction.delta_micro_usd),-300);assert.equal((await db.query('SELECT status FROM reservations WHERE run_id=$1',[run.id])).rows[0].status,'settled');
 assert.equal((await db.query('SELECT status FROM tool_runs WHERE id=$1',[run.id])).rows[0].status,'uncertain'); // Accounting proof does not fabricate recovered output.
});

test('QTA-006 emergency stop denies even an adapter without a price estimator before any remote call',async()=>{
 const a=await account(db),run=await new RunService(db).create(a.p,input,id(),'fixture');let calls=0;await db.query('UPDATE runtime_controls SET provider_enabled=false WHERE id=1');
 await new Worker(db,objects,{async generate(){calls++;return 'Must never be called';}},silent).tick();assert.equal(calls,0);assert.equal((await db.query('SELECT status FROM reservations WHERE run_id=$1',[run.id])).rows[0].status,'released');await db.query('UPDATE runtime_controls SET provider_enabled=true WHERE id=1');
});
