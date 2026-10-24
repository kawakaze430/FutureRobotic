import {parseApiResponse,parseApiError,parseRunEvent,requireIdempotencyKey,type ApiPath,type ApiMethods,type ApiArguments,type ApiResponse,type RunInput,type RunStatus} from '../portable/src/api-contracts';
export interface CloudState {cloudEnabled:boolean;signedIn:boolean;aiConfigured:boolean;providers?:{google:boolean;github:boolean;email:boolean}}
export const csrfToken=(anonymous=false)=>typeof document==='undefined'?'':decodeURIComponent(document.cookie.split('; ').find(x=>anonymous?(x.startsWith('__Host-fr_anon_csrf=')||x.startsWith('fr_anon_csrf=')):(x.startsWith('__Host-fr_csrf=')||x.startsWith('fr_csrf=')))?.split('=').slice(1).join('=')??'');
export class CloudError extends Error {constructor(public code:string,public status:number,public requestId:string=''){super(({UNAUTHENTICATED:'Sign in to use your account workspace.',BILLING_NOT_CONFIGURED:'Billing is awaiting merchant setup.',MODEL_TIER_REQUIRED:'This model requires a paid plan.',QUOTA_EXHAUSTED:'Your available credits have been used.',DAILY_SPENDING_LIMIT:'The daily AI spending limit has been reached.',PROVIDER_EMERGENCY_STOP:'Live AI is paused.',VERSION_CONFLICT:'A newer version exists. Reload before saving again.',FILE_COUNT_LIMIT:'Your cloud file limit has been reached. Free accounts have no cloud file slots.',FILE_STORAGE_LIMIT:'Your cloud storage limit has been reached.',SUBSCRIPTION_ACTION_REQUIRED:'Open billing to cancel or resolve your active subscription before deleting this account.',AUTH_NOT_CONFIGURED:'Login is awaiting the site owner’s provider setup.'} as Record<string,string>)[code]??code.replaceAll('_',' ').toLowerCase());}}
export async function cloudRequest<P extends ApiPath,M extends ApiMethods<P> = Extract<'GET',ApiMethods<P>>>(path:P,...args:ApiArguments<P,M>):Promise<ApiResponse<P,M>>{
 const [providedMethod,body,key,signal]=args,method=providedMethod??'GET';requireIdempotencyKey(method,path,key);
 const response=await fetch(path,{method,credentials:'same-origin',headers:{...(body!==undefined?{'content-type':'application/json'}:{}),...(method!=='GET'?{'x-csrf-token':csrfToken(path.startsWith('/v1/public/anonymous/'))}:{}),...(key?{'idempotency-key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
 let value:unknown;try{value=await response.json();}catch{throw new CloudError('INVALID_RESPONSE',response.status);}
 if(!response.ok){let code='INVALID_RESPONSE',requestId=response.headers.get('x-request-id')??'';try{const error=parseApiError(value).error;code=error.code;requestId=error.requestId;}catch{}throw new CloudError(code,response.status,requestId);}
 return parseApiResponse(method as M,path,value);
}
export interface StreamRunResult {id:string;output:string;partial:boolean;status:RunStatus;errorCode?:string|null}
export async function streamCloudRun(input:RunInput,onDelta:(text:string)=>void,signal:AbortSignal,onRun?:(id:string)=>void):Promise<StreamRunResult>{
 const run=await cloudRequest('/v1/runs','POST',input,crypto.randomUUID(),signal);
 const cancel=()=>{void cloudRequest(`/v1/runs/${run.id}/cancel`,'POST').catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 if(signal.aborted){signal.removeEventListener('abort',cancel);cancel();throw new DOMException('Request cancelled.','AbortError');}
 onRun?.(run.id);
 let result='',lastEvent='0';
 try{
  for(let connection=0;connection<4;connection++){
   const response=await fetch(`/v1/runs/${run.id}/events`,{credentials:'same-origin',headers:{'last-event-id':lastEvent},signal});
   if(!response.ok||!response.body)throw new CloudError('STREAM_UNAVAILABLE',response.status);
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   try{for(;;){const r=await reader.read();if(r.done)break;buffer+=decoder.decode(r.value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');if(buffer.length>1000000)throw new Error('Response limit exceeded.');let end;
    while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);let type='',data='';for(const line of block.split('\n')){if(line.startsWith('event:'))type=line.slice(6).trim();if(line.startsWith('data:'))data+=(data?'\n':'')+line.slice(5).trimStart();if(line.startsWith('id:')){const cursor=line.slice(3).trim();if(!/^\d{1,15}$/.test(cursor))throw new CloudError('INVALID_STREAM_RESPONSE',response.status);lastEvent=cursor;}}if(!data)continue;const event=parseRunEvent(type,JSON.parse(data));
     if(event?.type==='delta'){result+=event.data.delta;if(result.length>200000)throw new Error('Response limit exceeded.');onDelta(result);}
     if(event?.type==='done'){result=event.data.output??result;if(result.length>200000)throw new Error('Response limit exceeded.');onDelta(result);return {id:run.id,output:result,partial:event.data.status!=='completed',status:event.data.status,errorCode:event.data.errorCode};}
    }
   }}finally{await reader.cancel().catch(()=>{});}
  }
  throw new Error('The connection ended. Your run remains in History; reload it to recover the result.');
 }finally{signal.removeEventListener('abort',cancel);}
}
