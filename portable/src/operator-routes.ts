import type {FastifyInstance,FastifyRequest} from 'fastify';
import {z} from 'zod/v4';
import type {Db} from './db.js';
import {fail} from './common.js';
import type {Sealer} from './crypto.js';
import {OperatorConsoleService} from './operator-admin.js';
import {operatorUnlockSchema,operatorTicketStatusSchema,operatorControlSchema,operatorReconcileSchema} from './operator-contracts.js';

const body=(schema:z.ZodType)=>z.toJSONSchema(schema,{target:'draft-7'});
const querystring={type:'object',additionalProperties:false,properties:{cursor:{type:'string',maxLength:500}}};
const key=(req:FastifyRequest)=>{const value=req.headers['idempotency-key'];if(typeof value!=='string')fail('IDEMPOTENCY_KEY_REQUIRED');return value as string;};
export async function registerOperatorRoutes(app:FastifyInstance,{db,sealer}:{db:Db;sealer?:Sealer}){
 if(!sealer)return;
 const service=new OperatorConsoleService(db,sealer);
 app.post('/v1/operator/session',{schema:{body:body(operatorUnlockSchema)}},async req=>({data:await service.unlock(req.principal,(req.body as {code:string}).code)}));
 app.get('/v1/operator/session',{},async req=>({data:await service.session(req.principal)}));
 app.delete('/v1/operator/session',{},async req=>({data:await service.close(req.principal)}));
 app.get('/v1/operator/tickets',{schema:{querystring}},async req=>({data:await service.tickets(req.principal,(req.query as {cursor?:string}).cursor)}));
 app.post('/v1/operator/tickets/:id/status',{schema:{params:{type:'object',additionalProperties:false,properties:{id:{type:'string',format:'uuid'}},required:['id']},body:body(operatorTicketStatusSchema)}},async req=>{
  const value=req.body as z.infer<typeof operatorTicketStatusSchema>;return {data:await service.ticketStatus(req.principal,(req.params as {id:string}).id,value.status,value.reason,key(req))};
 });
 app.get('/v1/operator/billing/accounts',{schema:{querystring}},async req=>({data:await service.billing(req.principal,(req.query as {cursor?:string}).cursor)}));
 app.get('/v1/operator/control-state',{},async req=>({data:await service.controls(req.principal)}));
 app.post('/v1/operator/control-state',{schema:{body:body(operatorControlSchema)}},async req=>({data:await service.updateControls(req.principal,req.body as z.infer<typeof operatorControlSchema>,key(req))}));
 app.get('/v1/operator/audit-events',{schema:{querystring}},async req=>({data:await service.events(req.principal,(req.query as {cursor?:string}).cursor)}));
 app.post('/v1/operator/reconciliation-queue',{schema:{body:body(operatorReconcileSchema)}},async req=>({data:await service.requestReconciliation(req.principal,(req.body as {reason:string}).reason,key(req))}));
}
