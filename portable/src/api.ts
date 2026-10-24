import Fastify, { type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import { timingSafeEqual } from 'node:crypto';
import type { Db } from './db.js';
import { AppError, fail, hash, id, type Principal } from './common.js';
import { IdentityService } from './identity.js';
import { ContentService, type ObjectStore } from './content.js';
import { RunService, toolNames, type RunInput } from './runs.js';
import { QuotaService } from './quota.js';
import { BillingService } from './billing.js';
import { LifecycleService } from './lifecycle.js';
import { Telemetry, traceFromParent } from './telemetry.js';
import {registerReconciliationRoutes} from './reconciliation-routes.js';
import {registerOperatorRoutes} from './operator-routes.js';
import {registerSupportRoutes} from './support-routes.js';
import {registerAnonymousRoutes} from './anonymous-routes.js';
import {registerProductRoutes,type ProductOptions} from './product-routes.js';
import {AccountService,FileService,ShareService} from './account-services.js';
import {LocalResultService,type LocalResultInput} from './local-results.js';
import {z} from 'zod/v4';
import {apiContracts,canonicalEndpoint,responseSchemaFor,responseSchemaDefinitionsFor,responseValidatorFor,nonJsonContracts,errorSchema as contractErrorSchema} from './api-contracts.js';
declare module 'fastify' {interface FastifyRequest { principal:Principal; traceId:string }}
export interface ApiOptions extends ProductOptions {telemetry?:Telemetry}
const uuid={type:'string',format:'uuid'} as const;
const text=(maxLength:number,minLength=0)=>({type:'string',maxLength,minLength});
const object=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const params=object({id:uuid});
const errorSchema=z.toJSONSchema(contractErrorSchema,{target:'draft-7'});
const responses:Record<number,unknown>={400:errorSchema,401:errorSchema,402:errorSchema,403:errorSchema,404:errorSchema,409:errorSchema,410:errorSchema,413:errorSchema,415:errorSchema,429:errorSchema,500:errorSchema,503:errorSchema};
const accepted=new Set(['POST /v1/runs','POST /v1/account/exports','DELETE /v1/account','POST /v1/history/delete','POST /v1/history/export','POST /v1/executions','POST /v1/public/anonymous/ai','POST /v1/public/anonymous/executions']);
const created=new Set(['POST /v1/local-results','POST /v1/files','POST /v1/chats','POST /v1/support']);

export async function buildApi(options:ApiOptions) {
  const {db,objects,origin,production=false}=options;
  if(new URL(origin).origin!==origin || (production&&!origin.startsWith('https://'))) throw new Error('Set an exact application origin');
  const telemetry=options.telemetry??new Telemetry();
  const identity=new IdentityService(db),runs=new RunService(db),content=new ContentService(db,objects),lifecycle=new LifecycleService(db);
  const cookieName=production?'__Host-fr_session':'fr_session';
  if(!Number.isInteger(options.proxyHops??0)||(options.proxyHops??0)<0||(options.proxyHops??0)>2)throw new Error('Trusted edge hop count must be 0..2');
  const app=Fastify({logger:false,bodyLimit:120000,genReqId:()=>id(),requestIdHeader:false,trustProxy:(_address,hop)=>hop<(options.proxyHops??0),ajv:{customOptions:{removeAdditional:false,coerceTypes:false}}});
  await app.register(cookie);
  await app.register(swagger,{openapi:{info:{title:'FutureRobotic AI Portable API',version:'0.1.0'},servers:[{url:origin}],components:{securitySchemes:{sessionCookie:{type:'apiKey',in:'cookie',name:cookieName}}},security:[{sessionCookie:[]}]}});
  app.addHook('onRoute',route=>{
    const method=Array.isArray(route.method)?route.method[0]:route.method;
    const verb=method==='HEAD'?'GET':method,key=canonicalEndpoint(verb,route.url);
    const transport=nonJsonContracts[`${verb} ${route.url}` as keyof typeof nonJsonContracts];
    // Several routes deliberately reuse a params schema object. Give each route
    // its own wrapper before attaching its response/media-type contract.
    route.schema={...route.schema};
    if((route.config as {public?:boolean}|undefined)?.public)route.schema.security=[];
    const errors={...responses,...route.schema.response as Record<string,unknown>|undefined};
    if(key){
      const status=accepted.has(key)?202:created.has(key)?201:200;
      for(const definition of responseSchemaDefinitionsFor(verb,route.url))if(!app.getSchema(definition.$id))app.addSchema(definition);
      const schema=responseSchemaFor(verb,route.url)!;
      route.schema.response={...errors,[status]:schema,...(route.url==='/ready'?{503:schema}:{})};
      if(apiContracts[key].idempotency)route.schema.headers={type:'object',properties:{'idempotency-key':{type:'string',minLength:8,maxLength:100}},required:['idempotency-key']};
    }else if(transport){
      const success='contentType' in transport?{content:{[transport.contentType]:{schema:{type:'string',...('events' in transport?{}:{format:'binary'})}}}}:{type:'string',description:'OAuth redirect with Location and session-binding cookies.'};
      route.schema.response={...errors,[transport.status]:success};
      if('reconnectHeader' in transport)route.schema.headers={type:'object',properties:{'last-event-id':{type:'string',pattern:'^\\d{1,15}$'}}};
    }else throw new Error(`Missing response contract for ${verb} ${route.url}`);
  });
  app.addHook('preSerialization',async(req,reply,payload)=>{
    if(req.method==='HEAD'||payload===undefined)return payload;
    const method=req.method==='HEAD'?'GET':req.method,path=req.routeOptions.url;
    if(!path)return payload;
    // Date instances from native pg and PGlite have the same JSON wire contract.
    let wire:unknown;
    try{wire=JSON.parse(JSON.stringify(payload));}catch{return fail('RESPONSE_CONTRACT_VIOLATION',500);}
    const isError=reply.statusCode>=400&&!(path==='/ready'&&reply.statusCode===503&&!(wire&&typeof wire==='object'&&'error' in wire));
    if(isError){if(!contractErrorSchema.safeParse(wire).success)return fail('RESPONSE_CONTRACT_VIOLATION',500);return wire;}
    const validator=responseValidatorFor(method,path);
    if(validator&&!validator.safeParse(wire).success)return fail('RESPONSE_CONTRACT_VIOLATION',500);
    return wire;
  });
  app.decorateRequest('principal',null as unknown as Principal);app.decorateRequest('traceId','');
  app.addHook('onRequest',async(req,reply)=>{
    req.traceId=traceFromParent(req.headers.traceparent);
    reply.header('x-request-id',req.id).header('x-trace-id',req.traceId).header('cache-control','no-store').header('x-content-type-options','nosniff').header('referrer-policy','no-referrer').header('content-security-policy',"default-src 'none'; frame-ancestors 'none'");
    if(production) reply.header('strict-transport-security','max-age=31536000; includeSubDomains');
  });
  app.addHook('preValidation',async req=>{
    if((req.routeOptions.config as {public?:boolean}).public) return;
    const auth=await identity.authenticate(req.cookies[cookieName]);req.principal=auth.principal;
    if(!['GET','HEAD','OPTIONS'].includes(req.method)) {
      if(req.headers.origin!==origin) fail('CSRF_ORIGIN',403);
      const supplied=req.headers['x-csrf-token'];
      if(typeof supplied!=='string'||supplied.length>100) return fail('CSRF_TOKEN',403);
      const a=Buffer.from(hash(supplied)),b=Buffer.from(auth.csrfHash);
      if(a.length!==b.length||!timingSafeEqual(a,b)) fail('CSRF_TOKEN',403);
    }
  });
  app.addHook('onResponse',async(req,reply)=>telemetry.emit({event:'api.completed',traceId:req.traceId,requestId:req.id,status:reply.statusCode,durationMs:Math.round(reply.elapsedTime)}));
  app.setErrorHandler((error,req,reply)=>{
    const fault=error instanceof AppError?error:null;
    const httpError=error as {validation?:unknown;statusCode?:number};
    const status=fault?fault.status:httpError.validation?400:httpError.statusCode===413?413:httpError.statusCode===415?415:500;
    const code=fault?fault.code:httpError.validation?'INVALID_REQUEST':status===413?'BODY_TOO_LARGE':status===415?'UNSUPPORTED_MEDIA_TYPE':'INTERNAL_ERROR';
    telemetry.emit({event:'api.failed',requestId:req.id,traceId:req.traceId,status,errorCode:code});
    reply.code(status).send({error:{code,requestId:req.id}});
  });
  app.setNotFoundHandler((req,reply)=>reply.code(404).send({error:{code:'NOT_FOUND',requestId:req.id}}));
  const publicRoute={config:{public:true},schema:{security:[]}};
  app.get('/health',publicRoute,async()=>({status:'ok',service:'futurerobotic-api'}));
  app.get('/ready',publicRoute,async(_req,reply)=>{
    try {
      await db.query('SELECT name FROM schema_migrations ORDER BY name DESC LIMIT 1');
      await db.query('SELECT id FROM jobs LIMIT 1');
      return {status:'ready',dependencies:{database:'ready',durableQueue:'ready'}};
    }catch {return reply.code(503).send({status:'not_ready',dependencies:{database:'unavailable'}});}
  });
  app.get('/openapi.json',publicRoute,async()=>app.swagger());
  app.get('/v1/session',{schema:{response:responses}},async req=>({data:{userId:req.principal.userId,workspaceId:req.principal.workspaceId,csrfRequired:true,profile:await new AccountService(db).profile(req.principal)}}));
  app.post('/v1/session/logout',{schema:{response:responses}},async(req,reply)=>{
    await identity.revoke(req.principal);
    reply.clearCookie(cookieName,{path:'/',secure:production,sameSite:'strict',httpOnly:true});
    reply.clearCookie(production?'__Host-fr_csrf':'fr_csrf',{path:'/',secure:production,sameSite:'strict'});
    return {data:{loggedOut:true}};
  });
  app.get('/v1/allowance',{schema:{response:responses}},async req=>({data:{items:await new QuotaService(db).balances(req.principal)}}));
  app.get('/v1/billing',{schema:{response:responses}},async req=>({data:{items:await new BillingService(db).get(req.principal)}}));
  const runBody=object({tool:{type:'string',enum:[...toolNames]},source:text(100000,1),instructions:text(3000),language:text(60,1),targetLanguage:text(60,1),modelId:{type:'string',enum:['standard-auto','advanced-code']},fileIds:{type:'array',items:uuid,maxItems:5,uniqueItems:true},fileRevisions:{type:'array',items:object({id:uuid,revision:{type:'integer',minimum:1}}),maxItems:5},chatThreadId:uuid,chatMessage:text(4000,1),historyMode:{type:'string',enum:['cloud','local','none']}},['tool','source','language']);
  app.post('/v1/runs',{schema:{body:runBody,response:responses}},async(req,reply)=>reply.code(202).send({data:await runs.create(req.principal,req.body as RunInput,idempotency(req),req.traceId)}));
  app.post('/v1/local-results',{bodyLimit:2000000,schema:{body:object({tool:{type:'string',enum:['comments','pdf','run','convert']},kind:{type:'string',enum:['local','example']},source:text(100000,1),output:text(200000),language:text(60,1),targetLanguage:text(60,1),historyMode:{const:'cloud',type:'string'}},['tool','source','output','language','historyMode']),response:responses}},async(req,reply)=>reply.code(201).send({data:await new LocalResultService(db).record(req.principal,req.body as LocalResultInput,idempotency(req),req.traceId)}));
  app.get('/v1/runs',{schema:{querystring:object({cursor:text(500),limit:{type:'string',pattern:'^(?:[1-9]|[1-4][0-9]|50)$'}},[]),response:responses}},async req=>{
    const q=req.query as {cursor?:string;limit?:string};return {data:await runs.list(req.principal,q.cursor,q.limit?Number(q.limit):20)};
  });
  app.get('/v1/runs/:id',{schema:{params,response:responses}},async req=>({data:await runs.get(req.principal,(req.params as {id:string}).id)}));
  app.post('/v1/runs/:id/cancel',{schema:{params,response:responses}},async req=>({data:await runs.cancel(req.principal,(req.params as {id:string}).id,req.traceId)}));
  app.put('/v1/runs/:id/note',{schema:{params,body:object({content:text(50000),expectedVersion:{anyOf:[{type:'integer',minimum:1},{type:'null'}]}}),response:responses}},async req=>{
    const b=req.body as {content:string;expectedVersion:number|null};return {data:await runs.saveNote(req.principal,(req.params as {id:string}).id,b.content,b.expectedVersion)};
  });
  app.get('/v1/runs/:id/note',{schema:{params,response:responses}},async req=>{
    await runs.get(req.principal,(req.params as {id:string}).id);
    return {data:(await db.query('SELECT id,content,version FROM notes WHERE run_id=$1 AND workspace_id=$2 AND owner_id=$3',[(req.params as {id:string}).id,req.principal.workspaceId,req.principal.userId])).rows[0]??null};
  });
  app.post('/v1/files',{bodyLimit:2100000,schema:{body:object({name:text(200,1),content:text(2000000)}),response:responses}},async(req,reply)=>{
    const b=req.body as {name:string;content:string};return reply.code(201).send({data:await content.uploadText(req.principal,b.name,b.content,idempotency(req))});
  });
  app.get('/v1/files',{schema:{querystring:object({cursor:text(500)},[]),response:responses}},async req=>({data:await new FileService(db,objects).list(req.principal,(req.query as {cursor?:string}).cursor)}));
  app.get('/v1/files/:id',{schema:{params,response:responses}},async req=>({data:await content.getFile(req.principal,(req.params as {id:string}).id)}));
  app.delete('/v1/files/:id',{schema:{params,response:responses}},async req=>{await content.deleteFile(req.principal,(req.params as {id:string}).id);return {data:{deleted:true}};});
  app.post('/v1/chats',{schema:{body:object({title:text(200,1)}),response:responses}},async(req,reply)=>reply.code(201).send({data:await content.createThread(req.principal,(req.body as {title:string}).title)}));
  app.get('/v1/chats',{schema:{response:responses}},async req=>({data:{items:(await db.query('SELECT id,title,created_at FROM chat_threads WHERE workspace_id=$1 AND owner_id=$2 AND archived_at IS NULL ORDER BY created_at DESC LIMIT 100',[req.principal.workspaceId,req.principal.userId])).rows}}));
  app.get('/v1/chats/:id',{schema:{params,querystring:object({cursor:text(500)},[]),response:responses}},async req=>({data:await content.thread(req.principal,(req.params as {id:string}).id,(req.query as {cursor?:string}).cursor)}));
  app.post('/v1/chats/:id/messages',{schema:{params,body:object({content:text(10000,1)}),response:responses}},async req=>({data:await content.addUserMessage(req.principal,(req.params as {id:string}).id,(req.body as {content:string}).content)}));
  app.delete('/v1/chats/:id',{schema:{params,response:responses}},async req=>{
    await db.transaction(async tx=>{
      const t=await tx.query('SELECT id FROM chat_threads WHERE id=$1 AND workspace_id=$2 AND owner_id=$3 FOR UPDATE',[(req.params as {id:string}).id,req.principal.workspaceId,req.principal.userId]);
      if(!t.rowCount) fail('NOT_FOUND',404);
      await tx.query('UPDATE users SET selected_chat_id=NULL WHERE id=$1 AND selected_chat_id=$2',[req.principal.userId,(req.params as {id:string}).id]);
      await tx.query('UPDATE chat_messages SET content=\'\' WHERE thread_id=$1 AND workspace_id=$2 AND owner_id=$3',[(req.params as {id:string}).id,req.principal.workspaceId,req.principal.userId]);
      await tx.query('UPDATE chat_threads SET title=\'deleted\',archived_at=now() WHERE id=$1 AND workspace_id=$2 AND owner_id=$3',[(req.params as {id:string}).id,req.principal.workspaceId,req.principal.userId]);
    });return {data:{deleted:true}};
  });
  app.post('/v1/runs/:id/shares',{schema:{params,response:responses}},async req=>({data:await new ShareService(db).create(req.principal,(req.params as {id:string}).id)}));
  app.delete('/v1/shares/:id',{schema:{params,response:responses}},async req=>{await content.revokeShare(req.principal,(req.params as {id:string}).id);return {data:{revoked:true}};});
  app.post('/v1/account/exports',{schema:{response:responses}},async(req,reply)=>reply.code(202).send({data:await lifecycle.requestExport(req.principal,idempotency(req),req.traceId)}));
  app.get('/v1/account/exports/pending',{schema:{response:responses}},async req=>({data:{items:await lifecycle.recoverableJobs(req.principal,'account')}}));
  app.get('/v1/account/exports/:id',{schema:{params,response:responses}},async req=>({data:await lifecycle.getExport(req.principal,(req.params as {id:string}).id)}));
  app.delete('/v1/account',{schema:{response:responses}},async(req,reply)=>reply.code(202).send({data:await lifecycle.requestDeletion(req.principal,req.traceId)}));
  await registerProductRoutes(app,options);
  await registerOperatorRoutes(app,options);await registerReconciliationRoutes(app,options);await registerSupportRoutes(app,{db,sealer:options.sealer,eventSecrets:options.supportEventSecrets});
  await registerAnonymousRoutes(app,{service:options.anonymousService,origin,production,edgeMode:options.proxyHops?'trusted-proxy':'direct',trustedEdgeHops:options.proxyHops});
  await app.ready();return app;
}
function idempotency(req:FastifyRequest) {
  const key=req.headers['idempotency-key'];if(typeof key!=='string') return fail('IDEMPOTENCY_KEY_REQUIRED');return key;
}
// OAuth/OTP adapters must call this only after successful verification and session creation.
export const sessionCookieOptions=(production:boolean)=>({httpOnly:true,secure:production,sameSite:'strict' as const,path:'/',maxAge:7*86400});
