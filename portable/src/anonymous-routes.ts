import type {FastifyInstance,FastifyRequest} from 'fastify';
import {fail} from './common.js';
import type {AnonymousDispatchService} from './anonymous-dispatch.js';
import {z} from 'zod/v4';
import {anonymousAiInput,anonymousExecutionInput} from './anonymous-contracts.js';
export interface AnonymousRouteOptions {service?:AnonymousDispatchService;origin:string;production?:boolean;edgeMode?:'direct'|'trusted-proxy';trustedEdgeHops?:number}
const publicRoute={config:{public:true}},schema=(body:z.ZodType)=>({body:z.toJSONSchema(body,{target:'draft-7'})});
export async function registerAnonymousRoutes(app:FastifyInstance,o:AnonymousRouteOptions){
 const sessionCookie=o.production?'__Host-fr_anon':'fr_anon',csrfCookie=o.production?'__Host-fr_anon_csrf':'fr_anon_csrf';
 const service=()=>o.service??fail('ANONYMOUS_NOT_ENABLED',503);
 const ip=(req:FastifyRequest)=>{
  if((o.edgeMode??'direct')==='direct'){
   if(req.headers['x-forwarded-for']||req.headers['forwarded']||req.headers['cf-connecting-ip']||req.headers['true-client-ip'])fail('UNTRUSTED_FORWARDING_HEADERS',403);
   return req.socket.remoteAddress??fail('TRUSTED_CLIENT_IP_REQUIRED',403);
  }
  if(!Number.isInteger(o.trustedEdgeHops)||o.trustedEdgeHops!<1||o.trustedEdgeHops!>2||!req.ips||req.ips.length!==o.trustedEdgeHops!+1)fail('TRUSTED_CLIENT_IP_REQUIRED',403);
  return req.ip;
 };
 const origin=(req:FastifyRequest)=>{if(req.headers.origin!==o.origin)fail('CSRF_ORIGIN',403);};
 const credentials=(req:FastifyRequest)=>({session:req.cookies[sessionCookie]??'',csrf:typeof req.headers['x-csrf-token']==='string'?req.headers['x-csrf-token']:''});
 const requestId=(req:FastifyRequest)=>(req.params as {id:string}).id;
 const params={type:'object',properties:{id:{type:'string',format:'uuid'}},required:['id'],additionalProperties:false};
 app.get('/v1/public/anonymous/config',publicRoute,async()=>({data:o.service?.config()??{enabled:false,ai:false,execution:false,contextLimit:4000,executionLimit:10000,dailyAiLimit:2,dailyExecutionLimit:3}}));
 app.post('/v1/public/anonymous/session',{...publicRoute,schema:schema(z.strictObject({humanToken:z.string().min(1).max(2048)}))},async(req,reply)=>{
  origin(req);const result=await service().session(ip(req),(req.body as {humanToken:string}).humanToken);
  reply.setCookie(sessionCookie,result.sessionToken,{httpOnly:true,secure:!!o.production,sameSite:'strict',path:'/',maxAge:3600});reply.setCookie(csrfCookie,result.csrfToken,{httpOnly:false,secure:!!o.production,sameSite:'strict',path:'/',maxAge:3600});
  return {data:{csrfToken:result.csrfToken,expiresAt:result.expiresAt}};
 });
 for(const [path,operation,input]of [['ai','ai',anonymousAiInput],['executions','execution',anonymousExecutionInput]] as const){
  app.post(`/v1/public/anonymous/${path}`,{...publicRoute,bodyLimit:200000,schema:schema(input)},async(req,reply)=>{
   origin(req);const c=credentials(req),key=req.headers['idempotency-key'];if(typeof key!=='string')fail('IDEMPOTENCY_KEY_REQUIRED');
   const result=await service().create(c.session,ip(req),c.csrf,operation,req.body,key,req.traceId);return reply.code(202).send({data:result});
  });
 }
 app.get('/v1/public/anonymous/recovery',{...publicRoute,schema:{querystring:{type:'object',additionalProperties:false,properties:{key:{type:'string',pattern:'^[A-Za-z0-9_-]{8,100}$'},operation:{type:'string',enum:['ai','execution']}},required:['key','operation']}}},async req=>{const query=req.query as {key:string;operation:'ai'|'execution'};return {data:await service().recover(credentials(req).session,ip(req),query.key,query.operation)};});
 app.get('/v1/public/anonymous/requests/:id',{...publicRoute,schema:{params}},async req=>({data:await service().get(credentials(req).session,ip(req),requestId(req))}));
 app.post('/v1/public/anonymous/requests/:id/cancel',{...publicRoute,schema:{params}},async req=>{origin(req);const c=credentials(req);return {data:await service().cancel(c.session,ip(req),c.csrf,requestId(req))};});
}
