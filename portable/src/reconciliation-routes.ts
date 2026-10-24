import type {FastifyInstance} from 'fastify';
import {z} from 'zod/v4';
import type {Db} from './db.js';
import type {Sealer} from './crypto.js';
import {fail} from './common.js';
import {OperatorConsoleService} from './operator-admin.js';
import {ReconciliationService,type ReconciliationMerchant,type ProviderOutcomeGateway} from './reconciliation.js';
import {reconciliationInput} from './reconciliation-contracts.js';
export async function registerReconciliationRoutes(app:FastifyInstance,options:{db:Db;sealer?:Sealer;merchant?:ReconciliationMerchant;providerOutcomes?:ProviderOutcomeGateway}){
 if(!options.sealer)return;
 const service=new ReconciliationService(options.db,options.merchant,options.providerOutcomes),operators=new OperatorConsoleService(options.db,options.sealer);
 app.get('/v1/operator/reconciliation/cases',{schema:{querystring:{type:'object',properties:{state:{type:'string',enum:['open','resolved']}},additionalProperties:false}}},async req=>{
  await operators.authorizeSession(options.db,req.principal,'billing.read');return {data:{items:await service.cases((req.query as {state?:'open'|'resolved'}).state)}};
 });
 app.post('/v1/operator/reconciliation/inspect',{schema:{body:z.toJSONSchema(reconciliationInput,{target:'draft-7'})}},async req=>{
  await operators.authorizeSession(options.db,req.principal,'billing.reconcile');const input=req.body as z.infer<typeof reconciliationInput>;
  // Identifiers locate already bound records; the service derives ownership and
  // validates authoritative remote evidence before applying any local changes.
  const result=input.kind==='checkout'?await service.checkout(input.resourceId,input.transactionId):input.kind==='subscription'?await service.subscription(input.resourceId):input.kind==='provider_run'?await service.providerRun(input.resourceId):input.subscriptionId?await service.adjustment(input.resourceId,input.subscriptionId):fail('SUBSCRIPTION_REFERENCE_REQUIRED');
  return {data:result};
 });
}
