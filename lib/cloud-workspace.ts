export interface CloudState {cloudEnabled:boolean;signedIn:boolean;aiConfigured:boolean;providers?:{google:boolean;github:boolean;email:boolean}}
export const csrfToken=()=>typeof document==='undefined'?'':decodeURIComponent(document.cookie.split('; ').find(x=>x.startsWith('__Host-fr_csrf=')||x.startsWith('fr_csrf='))?.split('=').slice(1).join('=')??'');
export class CloudError extends Error {constructor(public code:string,public status:number){super(({UNAUTHENTICATED:'Sign in to use your account workspace.',BILLING_NOT_CONFIGURED:'Billing is awaiting merchant setup.',MODEL_TIER_REQUIRED:'This model requires a paid plan.',QUOTA_EXHAUSTED:'Your available credits have been used.',DAILY_SPENDING_LIMIT:'The daily AI spending limit has been reached.',PROVIDER_EMERGENCY_STOP:'Live AI is paused.',VERSION_CONFLICT:'A newer version exists. Reload before saving again.',FILE_COUNT_LIMIT:'Your cloud file limit has been reached. Free accounts have no cloud file slots.',FILE_STORAGE_LIMIT:'Your cloud storage limit has been reached.',SUBSCRIPTION_ACTION_REQUIRED:'Open billing to cancel or resolve your active subscription before deleting this account.',AUTH_NOT_CONFIGURED:'Login is awaiting the site owner’s provider setup.'} as Record<string,string>)[code]??code.replaceAll('_',' ').toLowerCase());}}
export async function cloudRequest<T=any>(path:string,method='GET',body?:unknown,key?:string,signal?:AbortSignal):Promise<T>{
 const response=await fetch(path,{method,credentials:'same-origin',headers:{...(body!==undefined?{'content-type':'application/json'}:{}),...(method!=='GET'?{'x-csrf-token':csrfToken()}:{}),...(key?{'idempotency-key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal});
 const value=await response.json() as {data:T;error?:{code?:string}};if(!response.ok)throw new CloudError(value.error?.code??'REQUEST_FAILED',response.status);return value.data;
}
export async function streamCloudRun(input:Record<string,unknown>,onDelta:(text:string)=>void,signal:AbortSignal,onRun?:(id:string)=>void){
 const run=await cloudRequest<{id:string}>('/v1/runs','POST',input,crypto.randomUUID(),signal);onRun?.(run.id);
 const cancel=()=>{void cloudRequest(`/v1/runs/${run.id}/cancel`,'POST').catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 let result='',lastEvent='0';
 try{
  for(let connection=0;connection<4;connection++){
   const response=await fetch(`/v1/runs/${run.id}/events`,{credentials:'same-origin',headers:{'last-event-id':lastEvent},signal});
   if(!response.ok||!response.body)throw new CloudError('STREAM_UNAVAILABLE',response.status);
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   try{for(;;){const r=await reader.read();if(r.done)break;buffer+=decoder.decode(r.value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');if(buffer.length>1000000)throw new Error('Response limit exceeded.');let end;
    while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);let type='',data='';for(const line of block.split('\n')){if(line.startsWith('event:'))type=line.slice(6).trim();if(line.startsWith('data:'))data+=line.slice(5).trimStart();if(line.startsWith('id:'))lastEvent=line.slice(3).trim();}if(!data)continue;const event=JSON.parse(data);
     if(type==='delta'){result+=event.delta;if(result.length>200000)throw new Error('Response limit exceeded.');onDelta(result);}
     if(type==='done'){result=event.output??result;onDelta(result);return {id:run.id,output:result,partial:event.status!=='completed',status:event.status,errorCode:event.errorCode};}
    }
   }}finally{await reader.cancel().catch(()=>{});}
  }
  throw new Error('The connection ended. Your run remains in History; reload it to recover the result.');
 }finally{signal.removeEventListener('abort',cancel);}
}
