// Shared, browser-safe wire contracts. These schemas also drive OpenAPI and
// server response validation; no database or server-only module is imported here.
import {z} from 'zod/v4';
import {reconciliationContracts} from './reconciliation-contracts.js';
import {operatorContracts} from './operator-contracts.js';
import {supportContracts} from './support-contracts.js';
import {anonymousContracts} from './anonymous-contracts.js';
export type JsonValue = null | boolean | number | string | JsonValue[] | {[key:string]:JsonValue};
export type Schema<T> = z.ZodType<T>;
export type Infer<S extends z.ZodType> = z.infer<S>;
const string=z.string(),number=z.number(),integer=z.number().int(),boolean=z.boolean();
const uuid=z.uuid(),timestamp=z.iso.datetime({offset:true});
const json=z.json();
const array=<T>(items:Schema<T>)=>z.array(items);
const nullable=<T>(value:Schema<T>)=>value.nullable();
const enumeration=<const T extends readonly [string,...string[]] | readonly [number,...number[]] | readonly [boolean,...boolean[]]>(values:T):Schema<T[number]>=>z.union(values.map(value=>z.literal(value))) as Schema<T[number]>;
type ObjectValue<P extends Record<string,Schema<unknown>>,O extends readonly (keyof P)[]> = {[K in Exclude<keyof P,O[number]>]:Infer<P[K]>} & {[K in O[number]]?:Infer<P[K]>};
const object=<const P extends Record<string,Schema<unknown>>,const O extends readonly (keyof P)[]=[]>(properties:P,optional?:O):Schema<ObjectValue<P,O>>=>z.strictObject(Object.fromEntries(Object.entries(properties).map(([key,schema])=>[key,optional?.includes(key)?schema.optional():schema]))) as Schema<ObjectValue<P,O>>;
const numeric=z.union([integer,z.string().regex(/^-?\d+$/)]); // PostgreSQL bigint is serialized as a decimal string.
const items=<T>(item:Schema<T>)=>object({items:array(item)});
const page=<T>(item:Schema<T>)=>object({items:array(item),nextCursor:nullable(string)});
const id=object({id:uuid}),deleted=object({deleted:enumeration([true])}),jobCreated=object({jobId:uuid});
const historyMode=enumeration(['cloud','local','none']);
const tool=enumeration(['convert','generate','explain','fix','refactor','review','tests','chat']);
const storedTool=enumeration(['convert','generate','explain','fix','refactor','review','tests','chat','comments','pdf','run']);
const runStatus=enumeration(['queued','dispatching','running','cancel_requested','completed','failed','cancelled','uncertain']);
const terminalStatus=enumeration(['completed','failed','cancelled','uncertain']);
const modelId=enumeration(['standard-auto','advanced-code']);
const editor=object({dark:boolean,lineNumbers:boolean,fontSize:enumeration([12,13,14,15,16])});
const preferences=object({editor,pins:array(string),historyMode,evaluationOptOut:boolean,notifications:boolean},['editor','pins','historyMode','evaluationOptOut','notifications']);
const user=object({id:uuid,email:string,display_name:string,preferences,selected_chat_id:nullable(uuid)});
const balance=object({granted:numeric,reserved:numeric,consumed:numeric,available:numeric});
const fileUsage=object({plan:enumeration(['free','pro','premium']),count:integer,bytes:integer,fileLimit:integer,byteLimit:integer,maxFileBytes:integer,maxRevisions:integer});
const entitlement=object({period:string,contextLimit:integer,plan:string,creditStart:nullable(timestamp),creditEnd:nullable(timestamp),balance});
const account=object({id:uuid,email:string,display_name:string,preferences,selected_chat_id:nullable(uuid),entitlement,files:fileUsage});
const subscription=object({id:uuid,plan_id:string,status:string,period_start:timestamp,period_end:timestamp});
const runSummary=object({id:uuid,tool:storedTool,language:string,status:runStatus,created_at:timestamp,result_origin:nullable(enumeration(['provider','local_tool','user_applied_assistant']))});
const resultVersion=object({id:uuid,version:integer,content:string,created_at:timestamp,origin:string});
const contextFile=object({name:string,sha256:string,revision:integer,original_characters:integer,included_characters:integer});
const runDetail=object({id:uuid,tool:storedTool,language:string,status:runStatus,created_at:timestamp,source:string,instructions:string,model:string,target_language:nullable(string),error_code:nullable(string),updated_at:timestamp,history_mode:historyMode,history_deleted_at:nullable(timestamp),results:array(resultVersion),contextFiles:array(contextFile)});
const fileSummary=object({id:uuid,name:string,status:string,created_at:timestamp,revision:integer,size_bytes:numeric,sha256:string,characters:integer});
const message=object({id:uuid,role:enumeration(['user','assistant']),content:string,state:enumeration(['complete','partial','failed','streaming']),run_id:nullable(uuid),created_at:timestamp});
const providers=object({google:boolean,github:boolean,email:boolean});
const support=object({id:uuid,subject:string,message:string,status:string,created_at:timestamp});
const pendingJob=object({id:uuid,kind:enumeration(['history_export','delete_history']),status:string,created_at:timestamp,requestKey:string});
const plan=object({id:enumeration(['free','pro','premium']),name:string,monthly:integer,yearly:integer,advancedCredits:integer,contextLimit:integer,fileLimit:integer});
const runInput=object({tool,source:string,language:string,instructions:string,targetLanguage:string,modelId,fileIds:array(uuid),fileRevisions:array(object({id:uuid,revision:integer})),chatThreadId:uuid,chatMessage:string,historyMode},['instructions','targetLanguage','modelId','fileIds','fileRevisions','chatThreadId','chatMessage','historyMode']);
const localResultInput=object({tool:enumeration(['comments','pdf','run','convert']),kind:enumeration(['local','example']),source:string,output:string,language:string,targetLanguage:string,historyMode:enumeration(['cloud'])},['targetLanguage','kind']);
export type RunInput=Infer<typeof runInput>;
export type LocalResultInput=Infer<typeof localResultInput>;
export type AccountProfile=Infer<typeof account>;
export type RunDetail=Infer<typeof runDetail>;
export type RunSummary=Infer<typeof runSummary>;
export type RunStatus=Infer<typeof runStatus>;
export interface Page<T>{items:T[];nextCursor:string|null}
export interface ApiErrorBody {error:{code:string;requestId:string}}
export const errorSchema=object({error:object({code:string,requestId:uuid})});
export const runEventSchemas={status:object({status:runStatus}),delta:object({delta:string}),done:object({status:terminalStatus,output:string,errorCode:nullable(string),partial:boolean,local:boolean},['output','errorCode','partial','local'])};
export type RunEvent = {[K in keyof typeof runEventSchemas]:{type:K;data:Infer<typeof runEventSchemas[K]>}}[keyof typeof runEventSchemas];
type Contract<R,B=undefined,I extends boolean=false>={response:Schema<R>;body?:Schema<B>;idempotency:I;envelope:boolean};
const get=<R>(response:Schema<R>,envelope=true):Contract<R>=>({response,idempotency:false,envelope});
const write=<R,B=undefined,I extends boolean=false>(response:Schema<R>,body?:Schema<B>,idempotency?:I):Contract<R,B,I>=>({response,body,idempotency:(idempotency??false) as I,envelope:true});

export const apiContracts={
 ...operatorContracts,...supportContracts,...anonymousContracts,...reconciliationContracts,
 'GET /health':get(object({status:enumeration(['ok']),service:string}),false),
 'GET /ready':get(object({status:string,dependencies:object({database:string,durableQueue:string},['durableQueue'])}),false),
 'GET /api/status':get(object({cloudEnabled:boolean,signedIn:boolean,aiConfigured:boolean,providers}),false),
 'GET /openapi.json':get(z.record(string,json),false),
 'GET /auth/providers':get(providers),
 'GET /v1/public/auth-config':get(object({turnstileSiteKey:string})),
 'POST /auth/email/request':write(object({challengeId:uuid,expiresIn:integer}),object({email:string,humanToken:string})),
 'POST /auth/email/verify':write(object({signedIn:enumeration([true])}),object({challengeId:uuid,code:string})),
 'GET /v1/session':get(object({userId:uuid,workspaceId:uuid,csrfRequired:enumeration([true]),profile:account})),
 'POST /v1/session/logout':write(object({loggedOut:enumeration([true])})),
 'GET /v1/allowance':get(items(object({id:uuid,bucket:string,period_key:string,granted:numeric,reserved:numeric,consumed:numeric,available:numeric}))),
 'GET /v1/billing':get(items(subscription)),
 'GET /v1/account':get(account),
 'PATCH /v1/account':write(user,object({displayName:string,evaluationOptOut:boolean,notifications:boolean,editor,pins:array(string),historyMode},['displayName','evaluationOptOut','notifications','editor','pins','historyMode'])),
 'DELETE /v1/account':write(jobCreated),
 'POST /v1/runs':write(object({id:uuid,status:runStatus,replayed:boolean}),runInput,true),
 'POST /v1/local-results':write(object({id:uuid,status:enumeration(['completed']),replayed:boolean}),localResultInput,true),
 'GET /v1/runs':get(page(runSummary)),
 'GET /v1/runs/:id':get(runDetail),
 'POST /v1/runs/:id/cancel':write(object({id:uuid,status:runStatus})),
 'GET /v1/runs/:id/note':get(nullable(object({id:uuid,content:string,version:integer}))),
 'PUT /v1/runs/:id/note':write(object({id:uuid,version:integer}),object({content:string,expectedVersion:nullable(integer)})),
 'POST /v1/runs/:id/results':write(object({version:integer,replayed:boolean}),object({content:string,expectedVersion:integer}),true),
 'POST /v1/files':write(object({id:uuid,revision:integer}),object({name:string,content:string}),true),
 'GET /v1/files':get(object({items:array(fileSummary),nextCursor:nullable(string),usage:fileUsage})),
 'GET /v1/files/:id':get(object({id:uuid,name:string,status:string,revision:integer,sha256:string,size_bytes:numeric,extraction_status:string})),
 'DELETE /v1/files/:id':write(deleted),
 'GET /v1/files/:id/revisions':get(items(object({revision:integer,sha256:string,size_bytes:numeric,created_at:timestamp}))),
 'PUT /v1/files/:id/revision':write(object({id:uuid,revision:integer}),object({content:string,expectedRevision:integer}),true),
 'POST /v1/chats':write(object({id:uuid,title:string}),object({title:string})),
 'GET /v1/chats':get(items(object({id:uuid,title:string,created_at:timestamp}))),
 'GET /v1/chats/:id':get(object({id:uuid,title:string,messages:array(message),nextCursor:nullable(string)})),
 'POST /v1/chats/:id/messages':write(object({id:uuid,role:enumeration(['user']),content:string}),object({content:string})),
 'POST /v1/chats/:id/select':write(id),
 'POST /v1/chats/select':write(object({id:nullable(uuid)}),object({id:nullable(uuid)})),
 'DELETE /v1/chats/:id':write(deleted),
 'POST /v1/runs/:id/shares':write(object({id:uuid,token:string,expiresAt:timestamp})),
 'GET /v1/runs/:id/shares':get(items(object({id:uuid,expires_at:timestamp,revoked_at:nullable(timestamp)}))),
 'DELETE /v1/shares/:id':write(object({revoked:enumeration([true])})),
 'POST /v1/public/shares/resolve':write(object({result:string,language:string,expires_at:timestamp}),object({token:string})),
 'POST /v1/account/exports':write(jobCreated,undefined,true),
 'GET /v1/account/exports/pending':get(items(object({jobId:uuid,status:string,created_at:timestamp,requestKey:string}))),
 'GET /v1/account/exports/:id':get(object({id:uuid,content:json,expires_at:timestamp})),
 'GET /v1/account/jobs/:id':get(object({id:uuid,kind:string,status:string,last_error:nullable(string),created_at:timestamp,completed_at:nullable(timestamp)})),
 'POST /v1/history/delete':write(jobCreated,object({runIds:array(uuid)}),true),
 'POST /v1/history/export':write(jobCreated,object({runIds:array(uuid)}),true),
 'GET /v1/history/jobs/pending':get(items(pendingJob)),
 'DELETE /v1/history/:id':write(deleted),
 'GET /v1/public/file-types':get(object({encoding:string,maxFileBytes:integer,extensions:array(string),excluded:string})),
 'GET /v1/models':get(items(object({id:modelId,name:string,tier:enumeration(['standard','advanced']),minimumPlan:enumeration(['free','pro','premium']),maxOutputTokens:integer,retention:string,allowed:boolean}))),
 'GET /v1/catalog':get(object({currency:enumeration(['USD']),approved:boolean,plans:array(plan)})),
 'POST /v1/executions':write(object({id:uuid,state:string,source_hash:string,language:string},['source_hash','language']),object({language:enumeration(['Python','JavaScript','C','C++','Java']),source:string}),true),
 'GET /v1/executions/:id':get(object({id:uuid,language:string,state:string,result:nullable(object({stdout:string,stderr:string,exitCode:integer,durationMs:number,truncated:boolean,timedOut:boolean,phase:enumeration(['compile','execute','validation']),status:string})),created_at:timestamp})),
 'POST /v1/projects/import':write(object({files:array(object({path:string,id:uuid,revision:integer})),excluded:array(string)}),object({archiveBase64:string}),true),
 'POST /v1/uploads':write(object({id:uuid,url:string,headers:z.record(string,string),expiresIn:integer}),object({name:string,size:integer,sha256:string})),
 'POST /v1/uploads/:id/complete':write(object({id:uuid,status:string})),
 'POST /v1/support':write(object({id:uuid,status:string}),object({subject:string,message:string}),true),
 'GET /v1/support':get(items(support)),
 'GET /v1/support/:id':get(support),
 'POST /v1/billing/checkout':write(object({id:uuid,url:string}),object({plan:enumeration(['pro','premium']),interval:enumeration(['month','year']),country:string}),true),
 'POST /v1/billing/portal':write(object({url:string})),
 'GET /v1/operator/controls':get(object({provider_enabled:boolean,runner_enabled:boolean,daily_budget_micro_usd:numeric,updated_at:timestamp})),
 'PATCH /v1/operator/controls':write(object({updated:enumeration([true])}),object({providerEnabled:boolean,runnerEnabled:boolean,dailyBudgetMicroUsd:integer})),
 'GET /v1/operator/support':get(items(support)),
 'POST /webhooks/paddle':get(object({received:enumeration([true])}),false),
} as const;

// Non-JSON transports have explicit media/redirect contracts rather than a fake
// data envelope. Run event payloads are validated individually above.
export const nonJsonContracts={
 'GET /v1/runs/:id/events':{status:200,contentType:'text/event-stream',events:runEventSchemas,reconnectHeader:'last-event-id'},
 'GET /v1/files/:id/download':{status:200,contentType:'application/octet-stream',headers:['content-disposition']},
 'GET /auth/google/start':{status:302,headers:['location','set-cookie']},
 'GET /auth/google/callback':{status:302,headers:['location','set-cookie']},
 'GET /auth/github/start':{status:302,headers:['location','set-cookie']},
 'GET /auth/github/callback':{status:302,headers:['location','set-cookie']},
} as const;

export type ApiMethod='GET'|'POST'|'PUT'|'PATCH'|'DELETE';
export type ContractKey=keyof typeof apiContracts;
type PathOf<K extends string>=K extends `${ApiMethod} ${infer P}`?P:never;
type Concrete<P extends string>=P extends `${infer A}:id${infer B}`?`${A}${string}${B}`:P;
export type ApiPath=Concrete<PathOf<ContractKey>> | `${Concrete<PathOf<ContractKey>>}?${string}`;
type Bare<P extends string>=P extends `${infer B}?${string}`?B:P;
type CanonicalPath<P extends string> = P extends PathOf<ContractKey> ? P
 : P extends `/v1/operator/tickets/${string}/status`?'/v1/operator/tickets/:id/status'
 : P extends `/v1/operator/support/${string}/retry`?'/v1/operator/support/:id/retry'
 : P extends `/v1/support/${string}/delivery`?'/v1/support/:id/delivery'
 : P extends `/v1/public/anonymous/requests/${string}/cancel`?'/v1/public/anonymous/requests/:id/cancel'
 : P extends `/v1/public/anonymous/requests/${string}`?'/v1/public/anonymous/requests/:id'
 : P extends `/v1/runs/${string}/cancel`?'/v1/runs/:id/cancel'
 : P extends `/v1/runs/${string}/note`?'/v1/runs/:id/note'
 : P extends `/v1/runs/${string}/results`?'/v1/runs/:id/results'
 : P extends `/v1/runs/${string}/shares`?'/v1/runs/:id/shares'
 : P extends `/v1/files/${string}/revisions`?'/v1/files/:id/revisions'
 : P extends `/v1/files/${string}/revision`?'/v1/files/:id/revision'
 : P extends `/v1/chats/${string}/messages`?'/v1/chats/:id/messages'
 : P extends `/v1/chats/${string}/select`?'/v1/chats/:id/select'
 : P extends `/v1/uploads/${string}/complete`?'/v1/uploads/:id/complete'
 : P extends `/v1/account/exports/${string}`?'/v1/account/exports/:id'
 : P extends `/v1/account/jobs/${string}`?'/v1/account/jobs/:id'
 : P extends `/v1/runs/${string}`?'/v1/runs/:id'
 : P extends `/v1/files/${string}`?'/v1/files/:id'
 : P extends `/v1/chats/${string}`?'/v1/chats/:id'
 : P extends `/v1/shares/${string}`?'/v1/shares/:id'
 : P extends `/v1/history/${string}`?'/v1/history/:id'
 : P extends `/v1/executions/${string}`?'/v1/executions/:id'
 : P extends `/v1/support/${string}`?'/v1/support/:id':never;
export type EndpointKey<P extends string,M extends ApiMethod> = Extract<`${M} ${CanonicalPath<Bare<P>>}`,ContractKey>;
type Definition<P extends string,M extends ApiMethod>=(typeof apiContracts)[EndpointKey<P,M>];
export type ApiResponse<P extends string,M extends ApiMethod='GET'>=Definition<P,M> extends {response:Schema<infer R>}?R:never;
export type ApiBody<P extends string,M extends ApiMethod> = Definition<P,M> extends {body?:Schema<infer B>}?B:undefined;
export type ApiMethods<P extends string>=EndpointKey<P,ApiMethod> extends `${infer M extends ApiMethod} ${string}`?M:never;
export type ApiArguments<P extends ApiPath,M extends ApiMethod> = M extends 'GET'
 ? [method?:M,body?:undefined,key?:undefined,signal?:AbortSignal]
 : Definition<P,M> extends {idempotency:true}
   ? [method:M,body:ApiBody<P,M>,key:string,signal?:AbortSignal]
   : undefined extends ApiBody<P,M>
     ? [method:M,body?:ApiBody<P,M>,key?:string,signal?:AbortSignal]
     : [method:M,body:ApiBody<P,M>,key?:string,signal?:AbortSignal];

const dynamicKeys=(Object.keys(apiContracts) as ContractKey[]).sort((a,b)=>b.split('/').length-a.split('/').length);
export function canonicalEndpoint(method:string,path:string):ContractKey|undefined {
 const bare=path.split('?')[0];const direct=`${method} ${bare}`;
 if(Object.hasOwn(apiContracts,direct))return direct as ContractKey;
 return dynamicKeys.find(key=>key.startsWith(method+' ')&&key.includes(':id')&&new RegExp('^'+key.replace(':id','[^/?]+')+'$').test(`${method} ${bare}`));
}
export function responseValidatorFor(method:string,path:string):Schema<unknown>|undefined {
 const key=canonicalEndpoint(method,path);if(!key)return;
 const contract=apiContracts[key];return contract.envelope?object({data:contract.response}):contract.response;
}
function generatedResponseSchema(method:string,path:string) {
 const schema=responseValidatorFor(method,path);if(!schema)return;
 const generated=z.toJSONSchema(schema,{target:'draft-7'});
 // All JSON object keys are strings. Removing this redundant Zod record hint
 // avoids fast-json-stringify's propertyNames strict-mode diagnostic.
 const normalize=(value:unknown):void=>{if(!value||typeof value!=='object')return;const record=value as Record<string,unknown>;const names=record.propertyNames;if(names&&typeof names==='object'&&Object.keys(names).length===1&&(names as {type?:string}).type==='string')delete record.propertyNames;for(const nested of Object.values(record))normalize(nested);};
 normalize(generated);
 // Swagger needs recursive definitions registered as shared schemas; local
 // #/definitions references otherwise become dangling OpenAPI component refs.
 const definitions=(generated.definitions??{}) as Record<string,Record<string,unknown>>;
 const prefix=`Contract_${method}_${path.replace(/[^A-Za-z0-9]/g,'_')}_`;
 const names=Object.fromEntries(Object.keys(definitions).map(key=>[key,prefix+key]));
 const rewrite=(value:unknown):void=>{if(!value||typeof value!=='object')return;const record=value as Record<string,unknown>;if(typeof record.$ref==='string'&&record.$ref.startsWith('#/definitions/')){const name=record.$ref.slice('#/definitions/'.length);if(names[name])record.$ref=names[name]+'#';}Object.values(record).forEach(rewrite);};
 rewrite(generated);delete generated.definitions;
 return {schema:generated,definitions:Object.entries(definitions).map(([name,definition])=>({$id:names[name],...definition}))};
}
export function responseSchemaFor(method:string,path:string){return generatedResponseSchema(method,path)?.schema;}
export function responseSchemaDefinitionsFor(method:string,path:string){return generatedResponseSchema(method,path)?.definitions??[];}
export class ContractError extends Error {constructor(public path:string){super(`Invalid API response at ${path}`);this.name='ContractError';}}
export function validateSchema(schema:Schema<unknown>,value:unknown):void {
 const parsed=schema.safeParse(value);if(!parsed.success)throw new ContractError(parsed.error.issues[0]?.path.join('.')??'$');
}
export function parseApiResponse<P extends ApiPath,M extends ApiMethod='GET'>(method:M,path:P,value:unknown):ApiResponse<P,M>{
 const key=canonicalEndpoint(method,path);if(!key)throw new ContractError('unknown endpoint');
 const contract=apiContracts[key],schema=responseValidatorFor(method,path)!;validateSchema(schema,value);
 return (contract.envelope?(value as {data:unknown}).data:value) as ApiResponse<P,M>;
}
export function parseApiError(value:unknown):ApiErrorBody {validateSchema(errorSchema,value);return value as ApiErrorBody;}
export function parseRunEvent(type:string,value:unknown):RunEvent|undefined {
 if(!Object.hasOwn(runEventSchemas,type))return;
 validateSchema(runEventSchemas[type as keyof typeof runEventSchemas],value);
 return {type,data:value} as RunEvent;
}
export function requireIdempotencyKey(method:string,path:string,key?:string):void {
 const endpoint=canonicalEndpoint(method,path);
 if(endpoint&&apiContracts[endpoint].idempotency&&(!key||!/^[A-Za-z0-9_-]{8,100}$/.test(key)))throw new ContractError('idempotency-key');
}
