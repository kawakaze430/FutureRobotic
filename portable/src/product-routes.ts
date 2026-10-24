import {Readable} from 'node:stream';
import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Db} from './db.js';
import {fail,scope,type Principal} from './common.js';
import {IdentityService} from './identity.js';
import {PublicAuth} from './public-auth.js';
import {AccountService,FileService,ShareService} from './account-services.js';
import {OperatorService,allowedModel} from './protection.js';
import {modelCatalog,planCatalog} from './product-policy.js';
import {ContentService,type ObjectStore} from './content.js';
import {QuarantineService,S3Objects,extractProject} from './cloud-files.js';
import {RunService} from './runs.js';
import {Sealer} from './crypto.js';
import {PaddleGateway} from './merchant.js';
import {LifecycleService} from './lifecycle.js';
import type {AnonymousDispatchService} from './anonymous-dispatch.js';
import {supportedTextExtensions} from './product-policy.js';
import {ExecutionService,executionLanguages} from './execution.js';
export interface ProductOptions {db:Db;objects:ObjectStore;origin:string;production?:boolean;proxyHops?:number;auth?:PublicAuth;sealer?:Sealer;merchant?:PaddleGateway;providerReady?:boolean;turnstileSiteKey?:string;anonymousHashSecret?:string;anonymousService?:AnonymousDispatchService;supportEventSecrets?:readonly string[]}
const uuid={type:'string',format:'uuid'},str=(n:number)=>({type:'string',maxLength:n}),obj=(properties:Record<string,any>,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const publicConfig={config:{public:true}};
const principalId=(r:FastifyRequest)=>(r.params as {id:string}).id;
const headerKey=(r:FastifyRequest)=>{const key=r.headers['idempotency-key'];if(typeof key!=='string')return fail('IDEMPOTENCY_KEY_REQUIRED');return key;};
export async function registerProductRoutes(app:FastifyInstance,o:ProductOptions){
 const {db,objects,origin,production=false,auth}=o,accounts=new AccountService(db),files=new FileService(db,objects),shares=new ShareService(db),identity=new IdentityService(db);
 const param={params:obj({id:uuid})},writeOrigin=(r:FastifyRequest)=>{if(r.headers.origin!==origin)fail('CSRF_ORIGIN',403);};
 const issue=(reply:any,session:{sessionToken:string;csrfToken:string})=>{
  reply.setCookie(production?'__Host-fr_session':'fr_session',session.sessionToken,{httpOnly:true,secure:production,sameSite:'strict',path:'/',maxAge:7*86400});
  reply.setCookie(production?'__Host-fr_csrf':'fr_csrf',session.csrfToken,{httpOnly:false,secure:production,sameSite:'strict',path:'/',maxAge:7*86400});
 };
 app.get('/api/status',publicConfig,async req=>{
  let signedIn=false;try{await identity.authenticate(req.cookies[production?'__Host-fr_session':'fr_session']);signedIn=true;}catch{}
  return {aiConfigured:!!o.providerReady&&signedIn,cloudEnabled:true,signedIn,providers:auth?.providers()??{google:false,github:false,email:false}};
 });
 app.get('/auth/providers',publicConfig,async()=>({data:auth?.providers()??{google:false,github:false,email:false}}));
 app.get('/v1/public/auth-config',publicConfig,async()=>({data:{turnstileSiteKey:o.turnstileSiteKey??''}}));
 app.post('/auth/email/request',{...publicConfig,schema:{body:obj({email:str(254),humanToken:str(2048)})}},async req=>{
  writeOrigin(req);if(!auth)return fail('AUTH_NOT_CONFIGURED',503);const b=req.body as {email:string;humanToken:string};return {data:await auth.requestOtp(b.email,b.humanToken,req.ip)};
 });
 app.post('/auth/email/verify',{...publicConfig,schema:{body:obj({challengeId:uuid,code:{type:'string',pattern:'^\\d{6}$'}})}},async(req,reply)=>{
  writeOrigin(req);if(!auth)return fail('AUTH_NOT_CONFIGURED',503);const b=req.body as {challengeId:string;code:string};const session=await auth.verifyOtp(b.challengeId,b.code,req.ip);issue(reply,session);return {data:{signedIn:true}};
 });
 for(const provider of ['google','github'] as const){
  app.get(`/auth/${provider}/start`,publicConfig,async(req,reply)=>{
   if(!auth)return fail('AUTH_NOT_CONFIGURED',503);const start=await auth.begin(provider,req.ip);
   reply.setCookie(production?'__Host-fr_oauth':'fr_oauth',start.binding,{httpOnly:true,secure:production,sameSite:'lax',path:'/',maxAge:600});return reply.redirect(start.url);
  });
  app.get(`/auth/${provider}/callback`,{...publicConfig,schema:{querystring:obj({state:str(200),code:str(2000)})}},async(req,reply)=>{
   if(!auth)return fail('AUTH_NOT_CONFIGURED',503);const q=req.query as {state:string;code:string};
   const session=await auth.callback(provider,q.state,q.code,req.cookies[production?'__Host-fr_oauth':'fr_oauth']??'');
   issue(reply,session);reply.clearCookie(production?'__Host-fr_oauth':'fr_oauth',{path:'/',secure:production,sameSite:'lax'});return reply.redirect('/workspace');
  });
 }
 app.get('/v1/account',{schema:{}},async req=>({data:await accounts.profile(req.principal)}));
 app.patch('/v1/account',{schema:{body:obj({displayName:str(100),evaluationOptOut:{type:'boolean'},notifications:{type:'boolean'},editor:obj({dark:{type:'boolean'},lineNumbers:{type:'boolean'},fontSize:{type:'integer',enum:[12,13,14,15,16]}}),pins:{type:'array',items:str(125),maxItems:8,uniqueItems:true},historyMode:{type:'string',enum:['cloud','local','none']}},[])}},async req=>({data:await accounts.update(req.principal,req.body as any)}));
 app.get('/v1/public/file-types',publicConfig,async()=>({data:{encoding:'UTF-8 text only',maxFileBytes:100000,extensions:[...supportedTextExtensions].sort(),excluded:'Dependencies, secrets, binaries, generated build output'}}));
 app.get('/v1/files/:id/revisions',{schema:param},async req=>({data:await files.revisions(req.principal,principalId(req))}));
 app.post('/v1/runs/:id/results',{schema:{...param,body:obj({content:str(200000),expectedVersion:{type:'integer',minimum:1,maximum:99}})}},async req=>{const b=req.body as {content:string;expectedVersion:number};return {data:await new RunService(db).applyResult(req.principal,principalId(req),b.content,b.expectedVersion,headerKey(req))};});
 for(const operation of ['delete','export'] as const)app.post(`/v1/history/${operation}`,{schema:{body:obj({runIds:{type:'array',items:uuid,minItems:1,maxItems:200,uniqueItems:true}})}},async(req,reply)=>reply.code(202).send({data:await new LifecycleService(db).historyJob(req.principal,operation==='delete'?'delete_history':'history_export',(req.body as {runIds:string[]}).runIds,headerKey(req),req.traceId)}));
 app.get('/v1/account/jobs/:id',{schema:param},async req=>({data:await new LifecycleService(db).job(req.principal,principalId(req))}));
 app.get('/v1/history/jobs/pending',{},async req=>({data:{items:await new LifecycleService(db).recoverableJobs(req.principal,'history')}}));
 app.get('/v1/models',{},async req=>{
  const items=[];for(const model of modelCatalog){let allowed=true;try{await allowedModel(db,req.principal,model.id);}catch{allowed=false;}items.push({...model,allowed});}return {data:{items}};
 });
 app.get('/v1/catalog',publicConfig,async()=>({data:{currency:'USD',approved:!!o.merchant?.approved,plans:planCatalog}}));
 if(o.anonymousHashSecret){const executions=new ExecutionService(db,o.anonymousHashSecret);
  app.post('/v1/executions',{schema:{body:obj({language:{type:'string',enum:executionLanguages},source:str(10000)})}},async(req,reply)=>{const b=req.body as {language:string;source:string};return reply.code(202).send({data:await executions.create(req.principal,b.language,b.source,headerKey(req))});});
  app.get('/v1/executions/:id',{schema:param},async req=>({data:await executions.get(req.principal,principalId(req))}));
 }
 app.post('/v1/chats/select',{schema:{body:obj({id:{anyOf:[uuid,{type:'null'}]}})}},async req=>({data:await accounts.selectChat(req.principal,(req.body as {id:string|null}).id)}));
 app.post('/v1/chats/:id/select',{schema:param},async req=>({data:await accounts.selectChat(req.principal,principalId(req))}));
 app.put('/v1/files/:id/revision',{schema:{...param,body:obj({content:str(100000),expectedRevision:{type:'integer',minimum:1}})}},async req=>{
  const b=req.body as {content:string;expectedRevision:number};return {data:await files.revision(req.principal,principalId(req),b.content,b.expectedRevision,headerKey(req))};
 });
 app.get('/v1/files/:id/download',{schema:param},async(req,reply)=>{
  const result=await files.download(req.principal,principalId(req));return reply.type('application/octet-stream').header('content-disposition',`attachment; filename*=UTF-8''${encodeURIComponent(result.name)}`).send(Buffer.from(result.bytes));
 });
 app.post('/v1/projects/import',{bodyLimit:2800000,schema:{body:obj({archiveBase64:str(2700000)})}},async req=>{
  const b=req.body as {archiveBase64:string};if(!/^[A-Za-z0-9+/]*={0,2}$/.test(b.archiveBase64))fail('INVALID_ARCHIVE');
  const parsed=extractProject(Buffer.from(b.archiveBase64,'base64')),content=new ContentService(db,objects),result=[];
  const flattened=parsed.files.map(f=>f.name.replaceAll('/','__'));if(new Set(flattened.map(n=>n.toLowerCase())).size!==flattened.length)fail('ARCHIVE_NAME_COLLISION');
  for(const [i,f]of parsed.files.entries()){
   // Names are flattened only after collision detection. Paths are recorded in the import report.
   const name=f.name.replaceAll('/','__');result.push({path:f.name,...await content.uploadText(req.principal,name,f.content,`${headerKey(req)}-${i}`)});
  }return {data:{files:result,excluded:parsed.excluded}};
 });
 app.post('/v1/uploads',{schema:{body:obj({name:str(200),size:{type:'integer',minimum:1,maximum:100000},sha256:{type:'string',pattern:'^[a-f0-9]{64}$'}})}},async req=>{
  if(!(objects instanceof S3Objects))return fail('CLOUD_STORAGE_NOT_CONFIGURED',503);const b=req.body as {name:string;size:number;sha256:string};return {data:await new QuarantineService(db,objects).begin(req.principal,b.name,b.size,b.sha256)};
 });
 app.post('/v1/uploads/:id/complete',{schema:param},async req=>{
  if(!(objects instanceof S3Objects))return fail('CLOUD_STORAGE_NOT_CONFIGURED',503);return {data:await new QuarantineService(db,objects).complete(req.principal,principalId(req))};
 });
 app.delete('/v1/history/:id',{schema:param},async req=>({data:await accounts.deleteHistory(req.principal,principalId(req))}));
 app.post('/v1/support',{schema:{body:obj({subject:str(200),message:{type:'string',minLength:10,maxLength:10000}})}},async(req,reply)=>{const b=req.body as {subject:string;message:string};return reply.code(201).send({data:await accounts.ticket(req.principal,b.subject,b.message,headerKey(req),req.traceId)});});
 app.get('/v1/support',{},async req=>({data:{items:await accounts.tickets(req.principal)}}));
 app.get('/v1/support/:id',{schema:param},async req=>({data:(await accounts.tickets(req.principal,principalId(req)))[0]}));
 app.post('/v1/public/shares/resolve',{...publicConfig,schema:{body:obj({token:str(100)})}},async(req,reply)=>{reply.header('x-robots-tag','noindex, nofollow, noarchive');return {data:await shares.resolve((req.body as {token:string}).token)};});
 app.get('/v1/runs/:id/shares',{schema:param},async req=>{const runId=principalId(req);await new RunService(db).get(req.principal,runId);const rows=await db.query('SELECT id,expires_at,revoked_at FROM shares WHERE run_id=$1 AND workspace_id=$2 AND owner_id=$3 ORDER BY expires_at DESC LIMIT 100',[runId,req.principal.workspaceId,req.principal.userId]);return {data:{items:rows.rows}};});
 app.get('/v1/runs/:id/events',{schema:param},async(req,reply)=>{
  const runId=principalId(req);await new RunService(db).get(req.principal,runId);
  const last=req.headers['last-event-id'];if(last&&typeof last!=='string'||last&&!/^\d{1,15}$/.test(last as string))fail('INVALID_EVENT_CURSOR');
  let after=last?Number(last):0,closed=false;const until=Date.now()+60000;
  reply.raw.on('close',()=>{closed=true;});
  async function* stream(){
   yield ': connected\n\n';
   while(!closed&&Date.now()<until){
    await scope(db,req.principal);
    const events=await db.query('SELECT sequence,event_type,data FROM run_events WHERE run_id=$1 AND sequence>$2 ORDER BY sequence LIMIT 100',[runId,after]);
    for(const event of events.rows){after=Number(event.sequence);yield `id: ${after}\nevent: ${event.event_type}\ndata: ${JSON.stringify(event.data)}\n\n`;if(event.event_type==='done')return;}
    const run=await new RunService(db).get(req.principal,runId);
    if(['completed','failed','cancelled','uncertain'].includes(run.status)){
     yield `event: done\ndata: ${JSON.stringify({status:run.status,output:run.results.at(-1)?.content??'',errorCode:run.error_code})}\n\n`;return;
    }
    yield ': waiting\n\n';await new Promise(r=>setTimeout(r,200));
   }
  }
  return reply.type('text/event-stream').header('cache-control','no-store, no-transform').header('x-accel-buffering','no').send(Readable.from(stream()));
 });
 app.post('/v1/billing/checkout',{schema:{body:obj({plan:{type:'string',enum:['pro','premium']},interval:{type:'string',enum:['month','year']},country:{type:'string',pattern:'^[A-Z]{2}$'}})}},async req=>{if(!o.merchant)return fail('BILLING_NOT_CONFIGURED',503);const b=req.body as any;return {data:await o.merchant.checkout(req.principal,b.plan,b.interval,b.country,headerKey(req))};});
 app.post('/v1/billing/portal',{},async req=>{if(!o.merchant)return fail('BILLING_NOT_CONFIGURED',503);return {data:await o.merchant.portal(req.principal)};});
 if(o.merchant)await app.register(async webhooks=>{
  webhooks.removeContentTypeParser('application/json');webhooks.addContentTypeParser('application/json',{parseAs:'buffer'},(_req,body,done)=>done(null,body));
  webhooks.post('/webhooks/paddle',{...publicConfig,bodyLimit:200000},async req=>{
   const signature=req.headers['paddle-signature'];if(typeof signature!=='string')fail('INVALID_WEBHOOK_SIGNATURE',401);
   await o.merchant!.webhook((req.body as Buffer).toString('utf8'),signature as string);return {received:true};
  });
 });
 if(o.sealer){const operator=new OperatorService(db,o.sealer);
  const authorize=async(req:FastifyRequest,permission:string)=>{const code=req.headers['x-mfa-code'];if(typeof code!=='string')fail('OPERATOR_FORBIDDEN',403);return operator.authorize(req.principal,permission,code as string);};
  app.get('/v1/operator/controls',{},async req=>{await authorize(req,'controls.read');return {data:await operator.controls(req.principal)};});
  app.patch('/v1/operator/controls',{schema:{body:obj({providerEnabled:{type:'boolean'},runnerEnabled:{type:'boolean'},dailyBudgetMicroUsd:{type:'integer',minimum:0,maximum:1000000000}})}},async req=>{await authorize(req,'controls.write');return {data:await operator.controls(req.principal,req.body as any)};});
  app.get('/v1/operator/support',{},async req=>{await authorize(req,'support.read');return {data:{items:(await db.query('SELECT id,subject,message,status,created_at FROM support_tickets ORDER BY created_at DESC LIMIT 50')).rows}};});
 }
}
