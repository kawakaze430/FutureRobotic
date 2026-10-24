import type {FastifyInstance} from 'fastify';
import type {Db} from './db.js';
import {fail} from './common.js';
import type {Sealer} from './crypto.js';
import {OperatorService} from './protection.js';
import {SupportDeliveryService} from './support-delivery.js';

export async function registerSupportRoutes(app:FastifyInstance,options:{db:Db;sealer?:Sealer;eventSecrets?:readonly string[]}){
 const delivery=new SupportDeliveryService(options.db),params={type:'object',properties:{id:{type:'string',format:'uuid'}},required:['id'],additionalProperties:false};
 app.get('/v1/support/:id/delivery',{schema:{params}},async req=>({data:await delivery.status(req.principal,(req.params as {id:string}).id)}));
 app.post('/v1/operator/support/:id/retry',{schema:{params,body:{type:'object',additionalProperties:false}}},async req=>{
  if(!options.sealer)fail('OPERATOR_NOT_CONFIGURED',503);
  const code=req.headers['x-mfa-code'];if(typeof code!=='string')fail('OPERATOR_FORBIDDEN',403);
  await new OperatorService(options.db,options.sealer!).authorize(req.principal,'support.close',code as string);
  const key=req.headers['idempotency-key'];if(typeof key!=='string')fail('IDEMPOTENCY_KEY_REQUIRED');
  return {data:await delivery.retry(req.principal,(req.params as {id:string}).id,key as string,req.traceId)};
 });
 await app.register(async events=>{
  events.removeContentTypeParser('application/json');events.addContentTypeParser('application/json',{parseAs:'buffer'},(_request,body,done)=>done(null,body));
  events.post('/webhooks/support-delivery',{config:{public:true},bodyLimit:8192},async req=>{
   const signature=req.headers['x-support-signature'];
   return delivery.ingest((req.body as Buffer).toString('utf8'),typeof signature==='string'?signature:undefined,options.eventSecrets??[]);
  });
 });
}
